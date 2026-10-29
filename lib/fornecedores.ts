/**
 * Fornecedores das placas: regras puras (sem banco), usadas na tela e no servidor.
 */

export const TIPOS_PLACA = ["NFC + QR Code", "NFC", "QR Code", "Adesivo NFC", "Cartão NFC", "Chaveiro NFC"] as const;
export const MATERIAIS = ["Acrílico", "PVC", "MDF", "Metal", "Adesivo", "Outro"] as const;

export type StatusPedido = "pedido" | "enviado" | "recebido" | "cancelado";
export const STATUS_PEDIDO: Record<StatusPedido, { rotulo: string; tom: "pending" | "brand" | "profit" | "neutral" }> = {
  pedido: { rotulo: "Pedido feito", tom: "pending" },
  enviado: { rotulo: "A caminho", tom: "brand" },
  recebido: { rotulo: "Chegou", tom: "profit" },
  cancelado: { rotulo: "Cancelado", tom: "neutral" },
};

const limpo = (v: unknown, max = 200) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "") || null;
const inteiro = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.trunc(Number(v))));
const valor = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v) * 100) / 100) : 0);

/** "loja.com/placa" → "https://loja.com/placa". Só http(s); o resto vira null. */
export function normalizarUrl(bruto: string | null | undefined): string | null {
  const t = (bruto ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** "@loja", "loja" ou o link inteiro → link do perfil. */
export function linkInstagram(bruto: string | null | undefined): string | null {
  const t = (bruto ?? "").trim();
  if (!t) return null;
  if (/instagram\.com/i.test(t)) return normalizarUrl(t);
  const user = t.replace(/^@/, "").replace(/[^\w.]/g, "");
  return user ? `https://instagram.com/${user}` : null;
}

export type FornecedorEntrada = {
  nome: string;
  whatsapp?: string;
  site?: string;
  linkCompra?: string;
  instagram?: string;
  cidade?: string;
  prazoDias?: number | string | null;
  pedidoMinimo?: number | string | null;
  frete?: string;
  nota?: number | null;
  observacoes?: string;
};

export function validarFornecedor(e: FornecedorEntrada) {
  const nome = limpo(e.nome, 80);
  if (!nome) return { ok: false, error: "Dê um nome ao fornecedor." } as const;
  const whatsapp = limpo(e.whatsapp, 30);
  if (whatsapp && whatsapp.replace(/\D/g, "").length < 10) return { ok: false, error: "WhatsApp incompleto: coloque o DDD." } as const;
  const siteBruto = limpo(e.site, 300);
  const site = normalizarUrl(siteBruto);
  if (siteBruto && !site) return { ok: false, error: "O site não parece um link válido." } as const;
  const compraBruto = limpo(e.linkCompra, 1000);
  const linkCompra = normalizarUrl(compraBruto);
  if (compraBruto && !linkCompra) return { ok: false, error: "O link da compra não parece válido. Copie o endereço inteiro da página." } as const;
  const nota = e.nota == null ? null : Math.min(5, Math.max(1, Math.round(Number(e.nota)))) || null;
  return {
    ok: true,
    dados: {
      nome,
      whatsapp,
      site,
      linkCompra,
      instagram: limpo(e.instagram, 120),
      cidade: limpo(e.cidade, 80),
      prazoDias: inteiro(e.prazoDias),
      pedidoMinimo: inteiro(e.pedidoMinimo),
      frete: limpo(e.frete, 120),
      nota,
      observacoes: limpo(e.observacoes, 1000),
    },
  } as const;
}

export type OfertaEntrada = {
  fornecedorId: number;
  nome: string;
  descricao?: string;
  link?: string;
  tipo?: string;
  material?: string;
  preco: number;
  qtdMinima?: number | string | null;
  imagemUrl?: string;
};

export function validarOferta(e: OfertaEntrada) {
  if (!Number.isInteger(e.fornecedorId) || e.fornecedorId <= 0) return { ok: false, error: "Escolha o fornecedor." } as const;
  const nome = limpo(e.nome, 120);
  if (!nome) return { ok: false, error: "Dê um nome à placa (ex.: Placa NFC acrílico 10x10)." } as const;
  const linkBruto = limpo(e.link, 1000);
  const link = normalizarUrl(linkBruto);
  if (linkBruto && !link) return { ok: false, error: "O link de compra não parece válido." } as const;
  return {
    ok: true,
    dados: {
      fornecedorId: e.fornecedorId,
      nome,
      descricao: typeof e.descricao === "string" ? e.descricao.trim().slice(0, 2000) || null : null,
      link,
      tipo: limpo(e.tipo, 40),
      material: limpo(e.material, 40),
      preco: valor(e.preco),
      qtdMinima: Math.max(1, inteiro(e.qtdMinima) ?? 1),
      imagemUrl: normalizarUrl(limpo(e.imagemUrl, 1000)),
    },
  } as const;
}

export type PedidoEntrada = {
  fornecedorId: number;
  ofertaId?: number | null;
  descricao: string;
  quantidade: number;
  valorTotal: number;
  frete?: number;
  data: string;
  previsao?: string | null;
  rastreio?: string;
  observacao?: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validarPedido(e: PedidoEntrada) {
  if (!Number.isInteger(e.fornecedorId) || e.fornecedorId <= 0) return { ok: false, error: "Escolha o fornecedor." } as const;
  const descricao = limpo(e.descricao, 160);
  if (!descricao) return { ok: false, error: "Diga o que foi comprado." } as const;
  const quantidade = inteiro(e.quantidade) ?? 0;
  if (quantidade < 1) return { ok: false, error: "Quantidade precisa ser pelo menos 1." } as const;
  if (!ISO.test(e.data ?? "")) return { ok: false, error: "Data do pedido inválida." } as const;
  const previsao = e.previsao && ISO.test(e.previsao) ? e.previsao : null;
  return {
    ok: true,
    dados: {
      fornecedorId: e.fornecedorId,
      ofertaId: e.ofertaId && e.ofertaId > 0 ? e.ofertaId : null,
      descricao,
      quantidade,
      valorTotal: valor(e.valorTotal),
      frete: valor(e.frete),
      data: e.data,
      previsao,
      rastreio: limpo(e.rastreio, 60)?.toUpperCase().replace(/\s/g, "") ?? null,
      observacao: limpo(e.observacao, 500),
    },
  } as const;
}

/** Quanto sai cada placa do pedido, já com o frete. */
export const custoUnitario = (p: { valorTotal: number; frete: number; quantidade: number }) => (p.quantidade > 0 ? (p.valorTotal + p.frete) / p.quantidade : 0);

/** Simulador: quanto custa o lote, quanto sobra por placa e quantas vendas pagam a compra. */
export function simularLote(o: { preco: number; quantidade: number; frete?: number; precoVenda: number }) {
  const q = Math.max(0, Math.trunc(o.quantidade));
  const total = o.preco * q + (o.frete ?? 0);
  const custoUn = q ? total / q : 0;
  const lucroUn = o.precoVenda - custoUn;
  return {
    total,
    custoUn,
    lucroUn,
    lucroLote: lucroUn * q,
    margem: o.precoVenda > 0 ? lucroUn / o.precoVenda : null,
    /** Vendas que devolvem o dinheiro do lote (null se o preço de venda não cobre). */
    vendasParaPagar: o.precoVenda > 0 && total > 0 ? Math.ceil(total / o.precoVenda) : null,
  };
}

/** Mensagem pronta para pedir orçamento ou fechar compra pelo WhatsApp. */
export function mensagemPedido(o: { fornecedor: string; placa?: string | null; quantidade?: number | null; link?: string | null; nome?: string | null }) {
  const saudacao = `Olá, ${o.fornecedor}! Tudo bem?`;
  const quem = o.nome ? ` Aqui é ${o.nome}, da Basik7.` : "";
  const pedido = o.placa
    ? ` Tenho interesse em ${o.quantidade ? `${o.quantidade} unidades da ` : ""}${o.placa}.`
    : ` Tenho interesse nas suas placas NFC para avaliação no Google.`;
  const link = o.link ? ` (${o.link})` : "";
  return `${saudacao}${quem}${pedido}${link} Pode me passar o valor com frete, o prazo de produção e as formas de pagamento?`;
}

/** Código dos Correios (AA123456789BR) abre o rastreio direto; outro código vira busca. */
export function urlRastreio(codigo: string | null | undefined): string | null {
  const c = (codigo ?? "").trim().toUpperCase();
  if (!c) return null;
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(c)) return `https://www.linkcorreios.com.br/?id=${c}`;
  return `https://www.google.com/search?q=${encodeURIComponent(`rastreio ${c}`)}`;
}

/** Ainda não chegou e a previsão já passou. */
export const atrasado = (p: { status: string; previsao: string | null }, hoje: string) =>
  (p.status === "pedido" || p.status === "enviado") && !!p.previsao && p.previsao < hoje;

/** Onde procurar fornecedor novo (buscas prontas nos marketplaces). */
export function buscasFornecedor(termo = "placa nfc avaliação google"): { nome: string; url: string; dica: string }[] {
  const q = encodeURIComponent(termo);
  return [
    { nome: "Mercado Livre", url: `https://lista.mercadolivre.com.br/${termo.replace(/\s+/g, "-")}`, dica: "Entrega rápida, bom para repor pouco." },
    { nome: "Shopee", url: `https://shopee.com.br/search?keyword=${q}`, dica: "Preço baixo em lote; confira a nota da loja." },
    { nome: "AliExpress", url: `https://pt.aliexpress.com/w/wholesale-${termo.replace(/\s+/g, "-")}.html`, dica: "Mais barato por unidade, demora mais." },
    { nome: "Elo7", url: `https://www.elo7.com.br/lista/${termo.replace(/\s+/g, "-")}`, dica: "Personalizadas com a sua marca." },
    {
      nome: "Alibaba",
      url: `https://portuguese.alibaba.com/trade/search?SearchText=${encodeURIComponent("nfc google review stand")}`,
      dica: "Direto da fábrica, para lotes grandes.",
    },
    { nome: "Google", url: `https://www.google.com/search?q=${encodeURIComponent(`fornecedor ${termo} atacado`)}`, dica: "Fábricas nacionais e gráficas." },
  ];
}

/* ------------------------------ Ler link do produto ------------------------------ */

const entidades: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
function desescapar(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => entidades[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, ...nomes: string[]): string | null {
  for (const n of nomes) {
    const esc = n.replace(/[:.]/g, "\\$&");
    const a = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${esc}["'][^>]*content=["']([^"']*)["']`, "i").exec(html);
    const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${esc}["']`, "i").exec(html);
    const v = a?.[1] ?? b?.[1];
    if (v && v.trim()) return desescapar(v);
  }
  return null;
}

function precoDoJsonLd(html: string): number | null {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    const achado = /"(?:price|lowPrice)"\s*:\s*"?([\d.,]+)"?/.exec(m[1]);
    if (achado) return paraNumero(achado[1]);
  }
  return null;
}

function paraNumero(t: string): number | null {
  const s = t.trim();
  // "1.234,56" (BR) ou "1234.56" (EN)
  const n = /,\d{1,2}$/.test(s) ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Título, descrição, foto e preço de uma página de produto (Open Graph, meta e JSON-LD). */
export function extrairProduto(html: string, base: string): { titulo: string | null; descricao: string | null; imagem: string | null; preco: number | null } {
  const titulo =
    meta(html, "og:title", "twitter:title") ??
    (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ? desescapar(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)![1]) : null);
  const descricao = meta(html, "og:description", "description", "twitter:description");
  const img = meta(html, "og:image:secure_url", "og:image", "twitter:image", "image");
  let imagem: string | null = null;
  if (img) {
    try {
      imagem = normalizarUrl(new URL(img, base).toString());
    } catch {}
  }
  const precoMeta = meta(html, "product:price:amount", "og:price:amount", "price");
  const preco = (precoMeta ? paraNumero(precoMeta) : null) ?? precoDoJsonLd(html);
  return { titulo: titulo?.slice(0, 120) ?? null, descricao: descricao?.slice(0, 600) ?? null, imagem, preco };
}

/** Só endereços públicos: o servidor não abre a rede interna por um link colado. */
export function urlPublica(u: string): boolean {
  try {
    const { protocol, hostname } = new URL(u);
    if (protocol !== "http:" && protocol !== "https:") return false;
    const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || (!h.includes(".") && !h.includes(":"))) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    if (h.includes(":")) return false; // IPv6 literal
    return true;
  } catch {
    return false;
  }
}
