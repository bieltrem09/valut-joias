import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import * as s from "./schema";
import { addDays, diffDays, todaySP, type ISODate } from "../dates";

/* Gerador determinístico: o mesmo seed gera o mesmo negócio. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UNSPLASH = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

type Tipo = s.PlacaTipo;

const EMPRESAS: {
  nome: string;
  categoria: string;
  cidade: string;
  bairro: string;
  foto: string | null;
  contato: [string, string];
  tipos: Tipo[];
  rating: number;
  base: number;
}[] = [
  {
    nome: "Barbearia Navalha de Ouro",
    categoria: "Barbearia",
    cidade: "Campinas",
    bairro: "Cambuí",
    foto: "1503951914875-452162b0f3f1",
    contato: ["Rafael Monteiro", "Proprietário"],
    tipos: ["Avaliação Google", "Instagram", "Pix"],
    rating: 4.8,
    base: 214,
  },
  {
    nome: "Clínica Sorriso Pleno",
    categoria: "Clínica odontológica",
    cidade: "Sumaré",
    bairro: "Centro",
    foto: "1629909613654-28e377c37b09",
    contato: ["Marina Duarte", "Sócia"],
    tipos: ["Avaliação Google", "WhatsApp"],
    rating: 4.9,
    base: 167,
  },
  {
    nome: "Pizzaria Forno di Nonna",
    categoria: "Pizzaria",
    cidade: "Hortolândia",
    bairro: "Jardim Amanda",
    foto: "1513104890138-7c749659a591",
    contato: ["Giovanni Rossetto", "Dono"],
    tipos: ["Cardápio", "Avaliação Google", "Pix"],
    rating: 4.6,
    base: 388,
  },
  {
    nome: "PetLar Banho & Tosa",
    categoria: "Pet shop",
    cidade: "Campinas",
    bairro: "Taquaral",
    foto: "1601758228041-f3b2795255f1",
    contato: ["Juliana Prado", "Gerente"],
    tipos: ["Avaliação Google", "WhatsApp", "Instagram"],
    rating: 4.7,
    base: 129,
  },
  {
    nome: "Studio Équilibre Pilates",
    categoria: "Estúdio de pilates",
    cidade: "Valinhos",
    bairro: "Vila Santana",
    foto: "1518611012118-696072aa579a",
    contato: ["Beatriz Kawano", "Fisioterapeuta e sócia"],
    tipos: ["Avaliação Google", "Instagram"],
    rating: 5.0,
    base: 58,
  },
  {
    nome: "Café Grão Paulista",
    categoria: "Cafeteria",
    cidade: "Campinas",
    bairro: "Barão Geraldo",
    foto: "1501339847302-ac426a4a7cbb",
    contato: ["Thiago Lemos", "Barista e dono"],
    tipos: ["Avaliação Google", "Pix", "Instagram"],
    rating: 4.7,
    base: 276,
  },
  {
    nome: "Padaria Trigo Real",
    categoria: "Padaria",
    cidade: "Americana",
    bairro: "Vila Santa Catarina",
    foto: "1509440159596-0249088772ff",
    contato: ["Sônia Ferraz", "Proprietária"],
    tipos: ["Pix", "Avaliação Google"],
    rating: 4.5,
    base: 512,
  },
  {
    nome: "Espaço Lumi Estética",
    categoria: "Salão de beleza",
    cidade: "Indaiatuba",
    bairro: "Jardim Pau Preto",
    foto: "1560066984-138dadb4c035",
    contato: ["Camila Arantes", "Sócia"],
    tipos: ["Instagram", "WhatsApp", "Avaliação Google"],
    rating: 4.8,
    base: 143,
  },
  {
    nome: "Academia Ritmo Fit",
    categoria: "Academia",
    cidade: "Paulínia",
    bairro: "Morumbi",
    foto: "1534438327276-14e5300c3a48",
    contato: ["Diego Bastos", "Gerente comercial"],
    tipos: ["WhatsApp", "Avaliação Google"],
    rating: 4.4,
    base: 301,
  },
  {
    nome: "Cantina Dona Zefa",
    categoria: "Restaurante",
    cidade: "Jundiaí",
    bairro: "Anhangabaú",
    foto: "1517248135467-4c7edcad34c4",
    contato: ["Josefa Almeida", "Proprietária"],
    tipos: ["Cardápio", "Avaliação Google"],
    rating: 4.7,
    base: 623,
  },
  {
    nome: "Ótica Visão Clara",
    categoria: "Ótica",
    cidade: "Sumaré",
    bairro: "Nova Veneza",
    foto: null,
    contato: ["André Saraiva", "Sócio"],
    tipos: ["WhatsApp", "Avaliação Google"],
    rating: 4.6,
    base: 88,
  },
  {
    nome: "Smash Burger 019",
    categoria: "Hamburgueria",
    cidade: "Campinas",
    bairro: "Guanabara",
    foto: "1568901346375-23c9450c58cd",
    contato: ["Lucas Tavares", "Sócio"],
    tipos: ["Cardápio", "Instagram", "Avaliação Google", "Pix"],
    rating: 4.6,
    base: 942,
  },
  {
    nome: "Temaki Kazu",
    categoria: "Restaurante japonês",
    cidade: "Vinhedo",
    bairro: "Centro",
    foto: "1579871494447-9811cf80d66c",
    contato: ["Kazuo Hirata", "Chef e dono"],
    tipos: ["Cardápio", "Avaliação Google"],
    rating: 4.8,
    base: 357,
  },
  {
    nome: "Gelato Bellini",
    categoria: "Sorveteria",
    cidade: "Valinhos",
    bairro: "Jardim Pinheiros",
    foto: "1501443762994-82bd5dace89a",
    contato: ["Paola Bellini", "Proprietária"],
    tipos: ["Instagram", "Pix"],
    rating: 4.9,
    base: 196,
  },
  {
    nome: "Nail Bar Rosé",
    categoria: "Esmalteria",
    cidade: "Campinas",
    bairro: "Nova Campinas",
    foto: "1604654894610-df63bc536371",
    contato: ["Larissa Couto", "Proprietária"],
    tipos: ["Instagram", "WhatsApp", "Avaliação Google"],
    rating: 4.9,
    base: 104,
  },
  {
    nome: "Clínica Vet Patas",
    categoria: "Clínica veterinária",
    cidade: "Indaiatuba",
    bairro: "Cidade Nova",
    foto: null,
    contato: ["Renata Okada", "Médica-veterinária"],
    tipos: ["Avaliação Google", "WhatsApp"],
    rating: 4.7,
    base: 231,
  },
  {
    nome: "Ink Lab Tattoo",
    categoria: "Estúdio de tatuagem",
    cidade: "Americana",
    bairro: "Jardim São Paulo",
    foto: "1598371839696-5c5bb00bdc28",
    contato: ["Bruno Galvão", "Tatuador e dono"],
    tipos: ["Instagram", "Avaliação Google"],
    rating: 5.0,
    base: 77,
  },
  {
    nome: "Floricultura Jardim Secreto",
    categoria: "Floricultura",
    cidade: "Jundiaí",
    bairro: "Vila Arens",
    foto: null,
    contato: ["Helena Vidal", "Florista"],
    tipos: ["WhatsApp", "Pix"],
    rating: 4.8,
    base: 64,
  },
];

const REVIEWS = [
  "Atendimento impecável do começo ao fim. Já indiquei para a família toda.",
  "Ambiente limpo, equipe atenciosa e preço justo. Volto com certeza.",
  "Fui pela primeira vez semana passada e já marquei de novo.",
  "Gostei muito, só achei a espera um pouco longa no sábado.",
  "Melhor da região, sem exagero. Pontualidade de verdade.",
  "Equipe simpática e o resultado ficou exatamente como eu queria.",
  "Atendimento rápido e muito educado. Vale cada centavo.",
  "Lugar aconchegante, dá vontade de ficar. Recomendo demais.",
  "Bom, mas o estacionamento é complicado em horário de pico.",
  "Experiência excelente. Explicaram tudo com paciência.",
  "Preço honesto e qualidade acima da média. Virei cliente.",
  "Pedi pelo QR da mesa e chegou rapidinho. Muito prático.",
];
const AUTORES = [
  "Fernanda R.",
  "Carlos Eduardo M.",
  "Patrícia L.",
  "João Pedro S.",
  "Aline T.",
  "Marcos V.",
  "Gabriela N.",
  "Ricardo A.",
  "Tatiane B.",
  "Vinícius C.",
  "Letícia F.",
  "Eduardo P.",
];

const PRECOS = [49, 59.9, 69.9, 79.9, 89.9, 99.9, 119.9, 129.9, 149, 169.9, 189];

function destino(tipo: Tipo, nome: string) {
  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 22);
  switch (tipo) {
    case "Avaliação Google":
      return `https://g.page/r/${slug}/review`;
    case "Instagram":
      return `https://instagram.com/${slug}`;
    case "WhatsApp":
      return `https://wa.me/5519${String(Math.abs(hash(slug)) % 1e8).padStart(8, "9")}`;
    case "Pix":
      return `https://ecloura.com.br/pix/${slug}`;
    case "Cardápio":
      return `https://ecloura.com.br/menu/${slug}`;
  }
}

function hash(str: string) {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runSeed(db: BetterSQLite3Database<any>, today: ISODate = todaySP()) {
  const rnd = mulberry32(20261025);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);

  db.transaction((tx) => {
    for (const t of ["venda_placas", "leituras", "avaliacoes_historico", "reviews", "vendas", "placas", "despesas", "empresas"]) {
      tx.run(sql.raw(`delete from ${t}`));
    }
    tx.run(sql.raw(`delete from sqlite_sequence`));

    // 1) Vendas: ~60 nos últimos 90 dias, com leve crescimento recente.
    type VendaSeed = { empresa: number; data: ISODate; precos: number[] };
    const vendasSeed: VendaSeed[] = [];
    // Toda empresa compra ao menos uma vez.
    EMPRESAS.forEach((_, i) => {
      vendasSeed.push({ empresa: i, data: addDays(today, -Math.floor(between(20, 89))), precos: [] });
    });
    while (vendasSeed.length < 61) {
      // Distribuição puxada para o presente (crescimento do negócio).
      const back = Math.floor(Math.pow(rnd(), 1.35) * 90);
      vendasSeed.push({ empresa: Math.floor(Math.pow(rnd(), 1.3) * EMPRESAS.length), data: addDays(today, -back), precos: [] });
    }
    // Garante movimento em hoje e ontem.
    vendasSeed.push({ empresa: 4, data: today, precos: [] });
    vendasSeed.push({ empresa: 11, data: addDays(today, -1), precos: [] });
    vendasSeed.push({ empresa: 1, data: addDays(today, -1), precos: [] });
    vendasSeed.sort((a, b) => (a.data < b.data ? -1 : 1));

    // 2) Empresas.
    const firstSale = new Map<number, ISODate>();
    for (const v of vendasSeed) if (!firstSale.has(v.empresa)) firstSale.set(v.empresa, v.data);

    const empresaIds: number[] = [];
    EMPRESAS.forEach((e, i) => {
      const criada = addDays(firstSale.get(i) ?? today, -Math.floor(between(1, 6)));
      const [contatoNome, contatoCargo] = e.contato;
      const row = tx
        .insert(s.empresas)
        .values({
          nome: e.nome,
          placeId: null,
          categoria: e.categoria,
          cidade: e.cidade,
          endereco: `${e.bairro}, ${e.cidade} - SP`,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.nome} ${e.cidade}`)}`,
          fotoUrl: e.foto ? UNSPLASH(e.foto) : null,
          rating: e.rating,
          totalAvaliacoes: e.base,
          avaliacoesNaInstalacao: null,
          contatoNome,
          contatoCargo,
          contatoFotoUrl: i % 4 === 3 ? null : `https://i.pravatar.cc/96?u=${encodeURIComponent(contatoNome)}`,
          telefone: `(19) 9${Math.floor(between(8100, 9899))}-${Math.floor(between(1000, 9999))}`,
          refreshedAt: null,
          criadaEm: criada,
        })
        .returning({ id: s.empresas.id })
        .get();
      empresaIds.push(row.id);
    });

    // 3) Vendas + placas.
    let codigo = 301;
    const googleInstall = new Map<number, ISODate>(); // empresa -> data de ativação da 1ª placa Google
    const tiposUsados = new Map<number, number>();
    for (const v of vendasSeed) {
      const e = EMPRESAS[v.empresa];
      const n = rnd() < 0.62 ? 1 : rnd() < 0.75 ? 2 : 3;
      const age = diffDays(today, v.data);
      const statusVenda: s.VendaStatus = age <= 9 && rnd() < 0.38 ? "pendente" : rnd() < 0.05 ? "cancelada" : "paga";
      const metodo = rnd() < 0.58 ? "Pix" : rnd() < 0.8 ? "Cartão" : "Boleto";
      const precos = Array.from({ length: n }, () => pick(PRECOS));
      const valorVenda = r2(precos.reduce((a, b) => a + b, 0));
      const custoPlaca = r2(precos.reduce((a, p) => a + Math.min(32, Math.max(9, p * between(0.13, 0.19))), 0));
      const custoGravacao = r2(n * between(3.2, 6.8));
      const frete = r2(rnd() < 0.55 ? between(11.4, 27.9) : 0);
      const taxaPagamento = r2(metodo === "Pix" ? 0 : metodo === "Cartão" ? valorVenda * 0.0499 : 3.49);

      const venda = tx
        .insert(s.vendas)
        .values({
          empresaId: empresaIds[v.empresa],
          data: v.data,
          valorVenda,
          custoPlaca,
          custoGravacao,
          frete,
          taxaPagamento,
          status: statusVenda,
          metodo,
        })
        .returning({ id: s.vendas.id })
        .get();

      for (let k = 0; k < n; k++) {
        const used = tiposUsados.get(v.empresa) ?? 0;
        const tipo = e.tipos[used % e.tipos.length];
        tiposUsados.set(v.empresa, used + 1);

        let status: s.PlacaStatus;
        let ativadaEm: ISODate | null = null;
        if (statusVenda === "cancelada") status = "Cancelada";
        else if (statusVenda === "pendente" || age < 3) status = "Pendente de envio";
        else {
          ativadaEm = addDays(v.data, Math.min(age, Math.floor(between(2, 6))));
          status = rnd() < 0.07 ? "Inativa" : "Ativa";
        }

        const placa = tx
          .insert(s.placas)
          .values({
            codigo: `NFC-${String(codigo++).padStart(4, "0")}`,
            tipo,
            destinoUrl: destino(tipo, e.nome),
            status,
            leituras: 0,
            empresaId: empresaIds[v.empresa],
            ativadaEm,
          })
          .returning({ id: s.placas.id })
          .get();
        tx.insert(s.vendaPlacas).values({ vendaId: venda.id, placaId: placa.id }).run();

        if (ativadaEm) {
          if (tipo === "Avaliação Google" && !googleInstall.has(v.empresa)) googleInstall.set(v.empresa, ativadaEm);
          const rate = { "Avaliação Google": 2.6, Instagram: 3.4, WhatsApp: 1.8, Pix: 4.2, Cardápio: 9.5 }[tipo] * between(0.5, 1.5);
          const end = status === "Inativa" ? addDays(ativadaEm, Math.floor(between(5, 20))) : today;
          let total = 0;
          for (let d = ativadaEm; d <= end && d <= today; d = addDays(d, 1)) {
            const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
            const weekend = dow === 5 || dow === 6 ? 1.45 : dow === 0 ? 1.15 : 1;
            const ramp = Math.min(1, (diffDays(d, ativadaEm) + 2) / 6);
            const n2 = Math.max(0, Math.round(rate * weekend * ramp * between(0.4, 1.6)));
            if (n2 > 0) tx.insert(s.leituras).values({ placaId: placa.id, data: d, total: n2 }).run();
            total += n2;
          }
          tx.update(s.placas).set({ leituras: total }).where(eq(s.placas.id, placa.id)).run();
        }
      }
    }

    // 4) Avaliações: histórico semanal; ritmo acelera depois da placa Google.
    EMPRESAS.forEach((e, i) => {
      const id = empresaIds[i];
      const install = googleInstall.get(i) ?? null;
      const start = addDays(today, -126);
      const pre = between(0.25, 0.9); // avaliações/semana antes
      const post = pre * between(3.2, 6.5); // depois da placa
      let total = e.base;
      let atInstall: number | null = null;
      const points: { data: ISODate; total: number }[] = [];
      for (let d = start; d <= today; d = addDays(d, 7)) {
        points.push({ data: d, total: Math.round(total) });
        if (install && d <= install && addDays(d, 7) > install) atInstall = Math.round(total);
        total += (install && d >= install ? post : pre) * between(0.6, 1.4);
      }
      const final = Math.round(total);
      points.push({ data: today, total: final });
      for (const p of points) tx.insert(s.avaliacoesHistorico).values({ empresaId: id, data: p.data, rating: e.rating, total: p.total }).run();
      tx.update(s.empresas).set({ totalAvaliacoes: final, avaliacoesNaInstalacao: atInstall }).where(eq(s.empresas.id, id)).run();

      for (let k = 0; k < 3; k++) {
        const nota = e.rating >= 4.8 ? 5 : rnd() < 0.7 ? 5 : 4;
        tx.insert(s.reviews)
          .values({
            empresaId: id,
            autor: pick(AUTORES),
            nota,
            texto: REVIEWS[(i * 3 + k * 5) % REVIEWS.length],
            data: addDays(today, -Math.floor(between(1, 40)) - k * 9),
          })
          .run();
      }
    });

    // 5) Despesas operacionais coerentes com um negócio de 1 pessoa.
    const desp: { descricao: string; categoria: s.DespesaCategoria; valor: number; data: ISODate }[] = [];
    for (let back = 92; back >= 0; back--) {
      const d = addDays(today, -back);
      const day = Number(d.slice(8, 10));
      const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
      if (dow === 1) desp.push({ descricao: "Meta Ads · campanha comércio local", categoria: "Anúncios", valor: r2(between(84, 146)), data: d });
      if (day === 5) desp.push({ descricao: "Canva Pro", categoria: "Ferramentas", valor: 34.9, data: d });
      if (day === 10) desp.push({ descricao: "Hospedagem e domínio", categoria: "Ferramentas", valor: 29.9, data: d });
      if (day === 15) desp.push({ descricao: "Tarifa mensal da maquininha", categoria: "Taxas", valor: 19.9, data: d });
      if (dow === 3 && rnd() < 0.7) desp.push({ descricao: "Envio Correios · lote de placas", categoria: "Frete", valor: r2(between(22, 48)), data: d });
      if (day === 20) desp.push({ descricao: "Embalagens kraft e adesivos", categoria: "Outros", valor: r2(between(41, 67)), data: d });
    }
    for (const d of desp) tx.insert(s.despesas).values(d).run();
  });
}
