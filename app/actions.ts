"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db, ready, schema as s, one, must, emSerie } from "@/lib/db";
import { isISODate, todaySP } from "@/lib/dates";
import { getEmpresaDetalhe, type EmpresaDetalhe } from "@/lib/data/empresas";
import { proximoCodigo } from "@/lib/data/placas";
import { GoogleApiError, googleEnabled, registrarMedicao, syncEmpresa } from "@/lib/google/places";
import type { DespesaCategoria, PlacaTipo } from "@/lib/db/schema";
import { qualificar } from "@/lib/prospeccao";
import { chaveLead, hostDoMaps, leadManual, lerLinkMaps, type LinkMaps } from "@/lib/maps-link";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const CATEGORIAS: DespesaCategoria[] = ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"];
const TIPOS: PlacaTipo[] = ["Avaliação Google", "Instagram", "WhatsApp", "Pix", "Cardápio"];
const r2 = (v: number) => Math.round(v * 100) / 100;

function revalidateAll() {
  for (const p of ["/", "/placas", "/clientes", "/despesas"]) revalidatePath(p);
}

function urlValida(url: string) {
  try {
    const u = new URL(url.trim());
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

/**
 * Quando uma placa "Avaliação Google" é ativada, mede o Google na hora:
 * essa medição vira a base do "+N desde a placa".
 */
async function medirNaAtivacao(placaIds: number[]) {
  if (!googleEnabled() || !placaIds.length) return;
  const placas = await db.select().from(s.placas).where(inArray(s.placas.id, placaIds));
  const empresaIds = [...new Set(placas.filter((p) => p.tipo === "Avaliação Google").map((p) => p.empresaId))];
  for (const id of empresaIds) {
    const e = await db.select().from(s.empresas).where(eq(s.empresas.id, id)).then(one);
    if (e?.placeId) await syncEmpresa(id, e.placeId).catch((err) => console.error("medição na ativação", err));
  }
}

/** Apaga placas e o que depende delas (sem depender de cascade do banco remoto). */
async function apagarPlacas(ids: number[]) {
  if (!ids.length) return;
  await emSerie([
    db.delete(s.leituras).where(inArray(s.leituras.placaId, ids)),
    db.delete(s.vendaPlacas).where(inArray(s.vendaPlacas.placaId, ids)),
    db.delete(s.placas).where(inArray(s.placas.id, ids)),
  ]);
}

/* ------------------------------- Vendas ------------------------------- */

export type NovaVenda = {
  empresaId: number;
  data: string;
  status: "paga" | "pendente";
  metodo: "Pix" | "Cartão" | "Boleto";
  placas: { tipo: string; destinoUrl: string; preco: number }[];
  custoPlacas: number;
  custoGravacao: number;
  frete: number;
  taxaPagamento: number;
  entregue: boolean;
};

export async function criarVenda(v: NovaVenda): Promise<Result<{ codigos: string[] }>> {
  await ready();
  const empresa = await db.select({ id: s.empresas.id }).from(s.empresas).where(eq(s.empresas.id, v.empresaId)).then(one);
  if (!empresa) return { ok: false, error: "Escolha o cliente." };
  if (!isISODate(v.data) || v.data > todaySP()) return { ok: false, error: "Use a data de hoje ou anterior." };
  if (!v.placas.length) return { ok: false, error: "Adicione pelo menos uma placa." };
  for (const [i, p] of v.placas.entries()) {
    if (!TIPOS.includes(p.tipo as PlacaTipo)) return { ok: false, error: `Placa ${i + 1}: escolha o tipo.` };
    if (!urlValida(p.destinoUrl)) return { ok: false, error: `Placa ${i + 1}: o link de destino precisa começar com https://` };
    if (!Number.isFinite(p.preco) || p.preco <= 0) return { ok: false, error: `Placa ${i + 1}: informe o preço.` };
  }
  for (const [k, n] of [
    ["custo das placas", v.custoPlacas],
    ["gravação", v.custoGravacao],
    ["frete", v.frete],
    ["taxa", v.taxaPagamento],
  ] as const) {
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: `Confira o valor de ${k}.` };
  }

  const venda = await db
    .insert(s.vendas)
    .values({
      empresaId: v.empresaId,
      data: v.data,
      valorVenda: r2(v.placas.reduce((a, p) => a + p.preco, 0)),
      custoPlaca: r2(v.custoPlacas),
      custoGravacao: r2(v.custoGravacao),
      frete: r2(v.frete),
      taxaPagamento: r2(v.taxaPagamento),
      status: v.status,
      metodo: v.metodo,
    })
    .returning({ id: s.vendas.id })
    .then(must);

  let n = await proximoCodigo();
  const codigos: string[] = [];
  const ids: number[] = [];
  for (const p of v.placas) {
    const codigo = `NFC-${String(n++).padStart(4, "0")}`;
    const placa = await db
      .insert(s.placas)
      .values({
        codigo,
        tipo: p.tipo as PlacaTipo,
        destinoUrl: p.destinoUrl.trim(),
        status: v.entregue ? "Ativa" : "Pendente de envio",
        leituras: 0,
        empresaId: v.empresaId,
        ativadaEm: v.entregue ? v.data : null,
      })
      .returning({ id: s.placas.id })
      .then(must);
    await db.insert(s.vendaPlacas).values({ vendaId: venda.id, placaId: placa.id });
    codigos.push(codigo);
    ids.push(placa.id);
  }
  if (v.entregue) await medirNaAtivacao(ids);
  revalidateAll();
  return { ok: true, data: { codigos } };
}

export async function definirStatusVenda(id: number, status: "paga" | "pendente" | "cancelada"): Promise<Result> {
  await ready();
  await db.update(s.vendas).set({ status }).where(eq(s.vendas.id, id));
  if (status === "cancelada") {
    const ids = (await db.select({ id: s.vendaPlacas.placaId }).from(s.vendaPlacas).where(eq(s.vendaPlacas.vendaId, id))).map((r) => r.id);
    if (ids.length) await db.update(s.placas).set({ status: "Cancelada" }).where(inArray(s.placas.id, ids));
  }
  revalidateAll();
  return { ok: true };
}

export async function excluirVendas(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  await ready();
  const placaIds = (await db.select({ id: s.vendaPlacas.placaId }).from(s.vendaPlacas).where(inArray(s.vendaPlacas.vendaId, ids))).map((r) => r.id);
  await apagarPlacas(placaIds);
  await db.delete(s.vendas).where(inArray(s.vendas.id, ids));
  revalidateAll();
  return { ok: true };
}

/* ------------------------------ Despesas ------------------------------ */

export async function criarDespesa(input: { descricao: string; categoria: string; valor: number; data: string }): Promise<Result<{ id: number }>> {
  const descricao = input.descricao.trim();
  if (!descricao) return { ok: false, error: "Diga com o que foi o gasto." };
  if (!CATEGORIAS.includes(input.categoria as DespesaCategoria)) return { ok: false, error: "Escolha uma categoria." };
  if (!Number.isFinite(input.valor) || input.valor <= 0) return { ok: false, error: "O valor precisa ser maior que zero." };
  if (!isISODate(input.data) || input.data > todaySP()) return { ok: false, error: "Use uma data de hoje ou anterior." };
  await ready();
  const row = await db
    .insert(s.despesas)
    .values({ descricao, categoria: input.categoria as DespesaCategoria, valor: r2(input.valor), data: input.data })
    .returning({ id: s.despesas.id })
    .then(must);
  revalidateAll();
  return { ok: true, data: { id: row.id } };
}

export async function excluirDespesas(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  await ready();
  await db.delete(s.despesas).where(inArray(s.despesas.id, ids));
  revalidateAll();
  return { ok: true };
}

/* ------------------------------- Placas ------------------------------- */

export async function atualizarDestino(id: number, url: string): Promise<Result> {
  if (!urlValida(url)) return { ok: false, error: "Esse link não parece válido. Comece com https://" };
  await ready();
  await db.update(s.placas).set({ destinoUrl: url.trim() }).where(eq(s.placas.id, id));
  revalidatePath("/placas");
  return { ok: true };
}

export async function definirStatusPlacas(ids: number[], status: "Ativa" | "Inativa"): Promise<Result> {
  if (!ids.length) return { ok: true };
  await ready();
  const atuais = await db.select().from(s.placas).where(inArray(s.placas.id, ids));
  for (const p of atuais) {
    // Reativar não muda a data da primeira ativação (a base do crescimento fica onde estava).
    await db
      .update(s.placas)
      .set(status === "Ativa" ? { status, ativadaEm: p.ativadaEm ?? todaySP() } : { status })
      .where(eq(s.placas.id, p.id));
  }
  if (status === "Ativa") await medirNaAtivacao(atuais.filter((p) => !p.ativadaEm).map((p) => p.id));
  revalidateAll();
  return { ok: true };
}

/** "Marcar como enviadas": a placa sai de "Pendente de envio" e fica ativa a partir de hoje. */
export async function marcarEnviadas(ids: number[]): Promise<Result<{ alteradas: number }>> {
  await ready();
  const alvo = (await db.select({ id: s.placas.id, status: s.placas.status }).from(s.placas).where(inArray(s.placas.id, ids)))
    .filter((p) => p.status === "Pendente de envio")
    .map((p) => p.id);
  if (alvo.length) {
    await db.update(s.placas).set({ status: "Ativa", ativadaEm: todaySP() }).where(inArray(s.placas.id, alvo));
    await medirNaAtivacao(alvo);
  }
  revalidateAll();
  return { ok: true, data: { alteradas: alvo.length } };
}

export async function excluirPlacas(ids: number[]): Promise<Result> {
  await ready();
  await apagarPlacas(ids);
  revalidateAll();
  return { ok: true };
}

/* ------------------------------ Clientes ------------------------------ */

export async function carregarDetalheEmpresa(id: number): Promise<EmpresaDetalhe> {
  return getEmpresaDetalhe(id);
}

export async function criarEmpresa(
  input: { placeId: string; nome: string } | { nome: string; categoria: string; cidade: string; contatoNome?: string; contatoCargo?: string },
): Promise<Result<{ id: number }>> {
  const nome = input.nome.trim();
  if (!nome) return { ok: false, error: "Qual o nome da empresa?" };
  await ready();

  if ("placeId" in input) {
    if (!googleEnabled()) return { ok: false, error: "Configure a chave do Google para importar." };
    const existente = await db.select({ id: s.empresas.id }).from(s.empresas).where(eq(s.empresas.placeId, input.placeId)).then(one);
    if (existente) return { ok: false, error: "Essa empresa já está na sua lista." };
    const row = await db
      .insert(s.empresas)
      .values({ nome, categoria: "Comércio local", cidade: "", criadaEm: todaySP() })
      .returning({ id: s.empresas.id })
      .then(must);
    try {
      await syncEmpresa(row.id, input.placeId, { foto: true });
    } catch (e) {
      console.error(e);
      await apagarEmpresa(row.id);
      return { ok: false, error: e instanceof GoogleApiError ? e.motivo : "Não deu para puxar os dados do Google agora. Tente de novo." };
    }
    revalidatePath("/clientes");
    return { ok: true, data: { id: row.id } };
  }

  if (!input.cidade.trim()) return { ok: false, error: "Em que cidade fica?" };
  const row = await db
    .insert(s.empresas)
    .values({
      nome,
      categoria: input.categoria.trim() || "Comércio local",
      cidade: input.cidade.trim(),
      contatoNome: input.contatoNome?.trim() || null,
      contatoCargo: input.contatoCargo?.trim() || null,
      criadaEm: todaySP(),
    })
    .returning({ id: s.empresas.id })
    .then(must);
  revalidatePath("/clientes");
  return { ok: true, data: { id: row.id } };
}

export async function editarEmpresa(
  id: number,
  input: { nome: string; categoria: string; cidade: string; contatoNome: string; contatoCargo: string; telefone: string },
): Promise<Result> {
  if (!input.nome.trim()) return { ok: false, error: "O nome não pode ficar vazio." };
  if (!input.cidade.trim()) return { ok: false, error: "Informe a cidade." };
  await ready();
  await db
    .update(s.empresas)
    .set({
      nome: input.nome.trim(),
      categoria: input.categoria.trim() || "Comércio local",
      cidade: input.cidade.trim(),
      contatoNome: input.contatoNome.trim() || null,
      contatoCargo: input.contatoCargo.trim() || null,
      telefone: input.telefone.trim() || null,
    })
    .where(eq(s.empresas.id, id));
  revalidateAll();
  return { ok: true };
}

async function apagarEmpresa(id: number) {
  const vendaIds = (await db.select({ id: s.vendas.id }).from(s.vendas).where(eq(s.vendas.empresaId, id))).map((v) => v.id);
  const placaIds = (await db.select({ id: s.placas.id }).from(s.placas).where(eq(s.placas.empresaId, id))).map((p) => p.id);
  await apagarPlacas(placaIds);
  await emSerie([
    db.delete(s.vendas).where(inArray(s.vendas.id, vendaIds.length ? vendaIds : [-1])),
    db.delete(s.avaliacoesHistorico).where(eq(s.avaliacoesHistorico.empresaId, id)),
    db.delete(s.reviews).where(eq(s.reviews.empresaId, id)),
    db.delete(s.fotos).where(eq(s.fotos.empresaId, id)),
    db.delete(s.empresas).where(eq(s.empresas.id, id)),
  ]);
}

export async function excluirEmpresa(id: number): Promise<Result> {
  await ready();
  await apagarEmpresa(id);
  revalidateAll();
  return { ok: true };
}

/** O dono digita o que está vendo no Google hoje (quando não há chave da API). */
export async function registrarContagem(empresaId: number, total: number, rating: number | null, data?: string): Promise<Result> {
  if (!Number.isInteger(total) || total < 0) return { ok: false, error: "Use o número inteiro de avaliações." };
  if (rating != null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) return { ok: false, error: "A nota vai de 1,0 a 5,0." };
  const dia = data ?? todaySP();
  if (!isISODate(dia) || dia > todaySP()) return { ok: false, error: "Use hoje ou uma data anterior." };
  await registrarMedicao(empresaId, total, rating, "manual", dia);
  // A ficha mostra sempre a medição mais recente.
  const ultima = await db.select().from(s.avaliacoesHistorico).where(eq(s.avaliacoesHistorico.empresaId, empresaId));
  const recente = ultima.sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  await db.update(s.empresas).set({ totalAvaliacoes: recente.total, rating: recente.rating }).where(eq(s.empresas.id, empresaId));
  revalidatePath("/clientes");
  return { ok: true };
}

/** Quantas avaliações a empresa tinha no dia em que a placa foi instalada (se você anotou). */
export async function definirBaseInstalacao(empresaId: number, total: number | null): Promise<Result> {
  if (total != null && (!Number.isInteger(total) || total < 0)) return { ok: false, error: "Use um número inteiro." };
  await ready();
  await db.update(s.empresas).set({ avaliacoesNaInstalacao: total }).where(eq(s.empresas.id, empresaId));
  revalidatePath("/clientes");
  return { ok: true };
}

/* ----------------------------- Prospecção ----------------------------- */

type LeadEntrada = {
  placeId: string;
  nome: string;
  categoria: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  telefone: string | null;
  website: string | null;
  mapsUrl: string | null;
  rating: number | null;
  totalAvaliacoes: number | null;
  score: number;
};

const STATUS_LEAD = ["novo", "contatado", "negociando", "fechado", "perdido"] as const;
type StatusLead = (typeof STATUS_LEAD)[number];

export async function enviarAoFunil(leads: LeadEntrada[], segmento: string): Promise<Result<{ novos: number }>> {
  if (!leads.length) return { ok: true, data: { novos: 0 } };
  await ready();
  const agora = new Date().toISOString();
  const existentes = new Set(
    (
      await db
        .select({ placeId: s.leads.placeId })
        .from(s.leads)
        .where(
          inArray(
            s.leads.placeId,
            leads.map((l) => l.placeId),
          ),
        )
    ).map((l) => l.placeId),
  );
  const novos = leads.filter((l) => !existentes.has(l.placeId));
  if (novos.length) {
    await db.insert(s.leads).values(
      novos.map((l) => ({
        placeId: l.placeId,
        nome: l.nome,
        categoria: l.categoria,
        endereco: l.endereco,
        lat: l.lat,
        lng: l.lng,
        telefone: l.telefone,
        website: l.website,
        mapsUrl: l.mapsUrl,
        rating: l.rating,
        totalAvaliacoes: l.totalAvaliacoes,
        score: Math.round(l.score),
        segmento: segmento.trim() || null,
        status: "novo" as const,
        criadoEm: agora,
        atualizadoEm: agora,
      })),
    );
  }
  revalidatePath("/prospeccao");
  return { ok: true, data: { novos: novos.length } };
}

/**
 * Abre um link curto do Maps (maps.app.goo.gl) só para ler para onde ele aponta:
 * o endereço completo traz nome, coordenadas e a chave do lugar. Não lê a página.
 */
export async function resolverLinkMaps(texto: string): Promise<LinkMaps> {
  const lido = lerLinkMaps(texto);
  if (!lido.curto || !lido.url) return lido;
  let url = lido.url;
  try {
    for (let i = 0; i < 4; i++) {
      const res = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000) });
      const destino = res.headers.get("location");
      if (!destino) break;
      const proximo = new URL(destino, url).toString();
      if (!hostDoMaps(proximo)) break;
      url = proximo;
      if (!lerLinkMaps(url).curto) break; // já saiu do link curto
    }
  } catch (e) {
    console.error("resolverLinkMaps", e);
    return lido;
  }
  const longo = lerLinkMaps(url);
  // O texto colado manda no nome e no endereço; o link completo traz o resto.
  return {
    ...longo,
    url: lido.url,
    nome: lido.nome ?? longo.nome,
    endereco: lido.endereco ?? longo.endereco,
    curto: true,
  };
}

/** Guarda a busca feita no navegador (mapa aberto) para virar atalho em "Recentes". */
export async function registrarBusca(b: { segmento: string; local: string; modo: "cidade" | "perto"; raioKm?: number | null; total: number }): Promise<Result> {
  const segmento = b.segmento.trim().slice(0, 80);
  if (!segmento) return { ok: false, error: "Busca vazia." };
  await ready();
  await db.insert(s.buscas).values({
    segmento,
    local: b.local.trim().slice(0, 80) || "Limeira, SP",
    modo: b.modo === "perto" ? "perto" : "cidade",
    raioKm: b.modo === "perto" ? (b.raioKm ?? null) : null,
    total: Math.max(0, Math.trunc(b.total) || 0),
    criadaEm: new Date().toISOString(),
  });
  revalidatePath("/prospeccao");
  return { ok: true };
}

export async function excluirBusca(id: number): Promise<Result> {
  await ready();
  await db.delete(s.buscas).where(eq(s.buscas.id, id));
  revalidatePath("/prospeccao");
  return { ok: true };
}

export type LeadManualInput = {
  nome: string;
  segmento: string;
  endereco: string | null;
  mapsUrl: string | null;
  chave: string | null;
  lat: number | null;
  lng: number | null;
  telefone: string | null;
  temSite: boolean;
  rating: number | null;
  totalAvaliacoes: number;
};

/** Lead anotado à mão a partir do Google Maps comum (sem API). */
export async function adicionarLeadManual(input: LeadManualInput): Promise<Result<{ id: number }>> {
  const nome = input.nome.trim();
  if (!nome) return { ok: false, error: "Informe o nome da empresa." };
  const total = Math.trunc(input.totalAvaliacoes);
  if (!Number.isFinite(total) || total < 0) return { ok: false, error: "Número de avaliações inválido." };
  const rating = input.rating == null ? null : Math.round(input.rating * 10) / 10;
  if (rating != null && (rating < 1 || rating > 5)) return { ok: false, error: "A nota vai de 1,0 a 5,0." };
  if (total > 0 && rating == null) return { ok: false, error: "Informe a nota que aparece no Google." };
  const mapsUrl = input.mapsUrl && hostDoMaps(input.mapsUrl) ? input.mapsUrl : null;
  const telefone = input.telefone?.trim() || null;
  const endereco = input.endereco?.trim() || null;

  const placeId = chaveLead({ chave: input.chave, nome, endereco });
  const lugar = {
    placeId,
    nome,
    categoria: input.segmento.trim() || null,
    endereco,
    lat: input.lat,
    lng: input.lng,
    telefone,
    // O valor não é mostrado; só conta para a pontuação ("sem site" vale mais).
    website: input.temSite ? "sim" : null,
    mapsUrl,
    rating,
    totalAvaliacoes: total,
    status: null,
  };
  const { score } = qualificar(lugar);

  await ready();
  const existe = await db.select({ id: s.leads.id }).from(s.leads).where(eq(s.leads.placeId, placeId)).then(one);
  if (existe) return { ok: false, error: `${nome} já está no funil.` };
  const agora = new Date().toISOString();
  const row = await db
    .insert(s.leads)
    .values({ ...lugar, score, segmento: lugar.categoria, status: "novo", criadoEm: agora, atualizadoEm: agora })
    .returning({ id: s.leads.id })
    .then(must);
  revalidatePath("/prospeccao");
  return { ok: true, data: { id: row.id } };
}

export async function mudarStatusLead(id: number, status: StatusLead): Promise<Result> {
  if (!STATUS_LEAD.includes(status)) return { ok: false, error: "Status inválido." };
  await ready();
  await db.update(s.leads).set({ status, atualizadoEm: new Date().toISOString() }).where(eq(s.leads.id, id));
  revalidatePath("/prospeccao");
  return { ok: true };
}

export async function anotarLead(id: number, anotacao: string): Promise<Result> {
  await ready();
  await db
    .update(s.leads)
    .set({ anotacao: anotacao.trim().slice(0, 2000) || null, atualizadoEm: new Date().toISOString() })
    .where(eq(s.leads.id, id));
  revalidatePath("/prospeccao");
  return { ok: true };
}

export async function excluirLeads(ids: number[]): Promise<Result> {
  if (!ids.length) return { ok: true };
  await ready();
  await db.delete(s.leads).where(inArray(s.leads.id, ids));
  revalidatePath("/prospeccao");
  return { ok: true };
}

/** Fechou: o lead vira cliente (com os dados do Google) e sai como "fechado". */
export async function virarCliente(id: number): Promise<Result<{ empresaId: number }>> {
  await ready();
  const lead = await db.select().from(s.leads).where(eq(s.leads.id, id)).then(one);
  if (!lead) return { ok: false, error: "Lead não encontrado." };
  if (lead.empresaId) return { ok: true, data: { empresaId: lead.empresaId } };

  const existente = await db.select({ id: s.empresas.id }).from(s.empresas).where(eq(s.empresas.placeId, lead.placeId)).then(one);
  let empresaId = existente?.id;
  if (!empresaId) {
    const cidade = lead.endereco?.match(/,\s*([^,]+?)\s*-\s*[A-Z]{2}/)?.[1] ?? "";
    const row = await db
      .insert(s.empresas)
      .values({
        nome: lead.nome,
        // Lead anotado à mão não tem o ID da Places API; o cliente fica manual.
        placeId: leadManual(lead.placeId) ? null : lead.placeId,
        categoria: lead.categoria ?? "Comércio local",
        cidade,
        endereco: lead.endereco,
        mapsUrl: lead.mapsUrl,
        telefone: lead.telefone,
        rating: lead.rating,
        totalAvaliacoes: lead.totalAvaliacoes,
        criadaEm: todaySP(),
      })
      .returning({ id: s.empresas.id })
      .then(must);
    empresaId = row.id;
    // Foto, avaliações recentes e a primeira medição: direto do Google.
    const sincronizou =
      googleEnabled() && !leadManual(lead.placeId)
        ? await syncEmpresa(empresaId, lead.placeId, { foto: true }).then(
            () => true,
            (e) => (console.error("virarCliente", e), false),
          )
        : false;
    // Sem Google agora: os números que vieram na busca viram a primeira medição, com a data da busca.
    if (!sincronizou && lead.totalAvaliacoes != null)
      await registrarMedicao(empresaId, lead.totalAvaliacoes, lead.rating, leadManual(lead.placeId) ? "manual" : "google", lead.criadoEm.slice(0, 10));
  }
  await db.update(s.leads).set({ status: "fechado", empresaId, atualizadoEm: new Date().toISOString() }).where(eq(s.leads.id, id));
  revalidateAll();
  revalidatePath("/prospeccao");
  return { ok: true, data: { empresaId } };
}
