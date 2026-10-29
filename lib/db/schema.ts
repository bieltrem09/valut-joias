import { pgTable, text, integer, boolean, doublePrecision, serial, primaryKey, index, uniqueIndex, customType, jsonb } from "drizzle-orm/pg-core";

/** bytea ↔ Buffer (fotos guardadas no banco). */
const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => Buffer.from(v),
});

export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  placeId: text("place_id"),
  categoria: text("categoria").notNull(),
  cidade: text("cidade").notNull(),
  endereco: text("endereco"),
  mapsUrl: text("maps_url"),
  fotoUrl: text("foto_url"),
  rating: doublePrecision("rating"),
  totalAvaliacoes: integer("total_avaliacoes"),
  avaliacoesNaInstalacao: integer("avaliacoes_na_instalacao"),
  contatoNome: text("contato_nome"),
  contatoCargo: text("contato_cargo"),
  contatoFotoUrl: text("contato_foto_url"),
  telefone: text("telefone"),
  refreshedAt: text("refreshed_at"),
  criadaEm: text("criada_em").notNull(),
});

export const placas = pgTable(
  "placas",
  {
    id: serial("id").primaryKey(),
    codigo: text("codigo").notNull().unique(),
    tipo: text("tipo", { enum: ["Avaliação Google", "Instagram", "WhatsApp", "Pix", "Cardápio"] }).notNull(),
    destinoUrl: text("destino_url").notNull(),
    status: text("status", { enum: ["Ativa", "Pendente de envio", "Inativa", "Cancelada"] }).notNull(),
    leituras: integer("leituras").notNull().default(0),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    ativadaEm: text("ativada_em"),
  },
  (t) => [index("placas_empresa_idx").on(t.empresaId)],
);

export const vendas = pgTable(
  "vendas",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    data: text("data").notNull(), // YYYY-MM-DD
    valorVenda: doublePrecision("valor_venda").notNull(),
    custoPlaca: doublePrecision("custo_placa").notNull(),
    custoGravacao: doublePrecision("custo_gravacao").notNull(),
    frete: doublePrecision("frete").notNull(),
    taxaPagamento: doublePrecision("taxa_pagamento").notNull(),
    status: text("status", { enum: ["paga", "pendente", "cancelada"] }).notNull(),
    metodo: text("metodo", { enum: ["Pix", "Cartão", "Boleto"] }).notNull(),
  },
  (t) => [index("vendas_data_idx").on(t.data), index("vendas_empresa_idx").on(t.empresaId)],
);

export const vendaPlacas = pgTable(
  "venda_placas",
  {
    vendaId: integer("venda_id")
      .notNull()
      .references(() => vendas.id, { onDelete: "cascade" }),
    placaId: integer("placa_id")
      .notNull()
      .references(() => placas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.vendaId, t.placaId] })],
);

export const despesas = pgTable(
  "despesas",
  {
    id: serial("id").primaryKey(),
    descricao: text("descricao").notNull(),
    categoria: text("categoria", { enum: ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"] }).notNull(),
    valor: doublePrecision("valor").notNull(),
    data: text("data").notNull(),
  },
  (t) => [index("despesas_data_idx").on(t.data)],
);

/** Toques reais por dia em cada placa, contados pelo redirecionador /r/[codigo]. */
export const leituras = pgTable(
  "leituras",
  {
    placaId: integer("placa_id")
      .notNull()
      .references(() => placas.id, { onDelete: "cascade" }),
    data: text("data").notNull(),
    total: integer("total").notNull(),
  },
  (t) => [primaryKey({ columns: [t.placaId, t.data] })],
);

/** Uma medição por empresa por dia: total de avaliações e nota. Alimenta o gráfico de crescimento. */
export const avaliacoesHistorico = pgTable(
  "avaliacoes_historico",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    data: text("data").notNull(),
    rating: doublePrecision("rating"),
    total: integer("total").notNull(),
    /** "google" (Places API) ou "manual" (o dono digitou o que viu no Google). */
    fonte: text("fonte", { enum: ["google", "manual"] })
      .notNull()
      .default("google"),
  },
  (t) => [uniqueIndex("aval_hist_empresa_dia").on(t.empresaId, t.data)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    autor: text("autor").notNull(),
    nota: integer("nota").notNull(),
    texto: text("texto").notNull(),
    data: text("data").notNull(),
  },
  (t) => [index("reviews_empresa_idx").on(t.empresaId)],
);

/** Foto da empresa vinda do Google, guardada no banco (o disco da Vercel é temporário). */
export const fotos = pgTable("fotos", {
  empresaId: integer("empresa_id")
    .primaryKey()
    .references(() => empresas.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
  atualizadaEm: text("atualizada_em").notNull(),
});

/** Empresas achadas na prospecção (Google Places) e em que ponto do funil estão. */
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    placeId: text("place_id").notNull().unique(),
    nome: text("nome").notNull(),
    categoria: text("categoria"),
    endereco: text("endereco"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    telefone: text("telefone"),
    website: text("website"),
    mapsUrl: text("maps_url"),
    rating: doublePrecision("rating"),
    totalAvaliacoes: integer("total_avaliacoes"),
    score: integer("score").notNull(),
    status: text("status", { enum: ["novo", "contatado", "negociando", "fechado", "perdido"] })
      .notNull()
      .default("novo"),
    anotacao: text("anotacao"),
    segmento: text("segmento"),
    empresaId: integer("empresa_id"),
    criadoEm: text("criado_em").notNull(),
    atualizadoEm: text("atualizado_em").notNull(),
  },
  (t) => [index("leads_status_idx").on(t.status)],
);

/** Histórico das buscas de prospecção. */
export const buscas = pgTable("buscas", {
  id: serial("id").primaryKey(),
  segmento: text("segmento").notNull(),
  local: text("local").notNull(),
  modo: text("modo", { enum: ["cidade", "perto", "area"] }).notNull(),
  raioKm: doublePrecision("raio_km"),
  total: integer("total").notNull(),
  criadaEm: text("criada_em").notNull(),
});

/** Produtos em estoque para vender. A quantidade só muda por movimento (fica o histórico). */
export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  sku: text("sku"),
  categoria: text("categoria"),
  descricao: text("descricao"),
  custo: doublePrecision("custo").notNull().default(0),
  preco: doublePrecision("preco").notNull().default(0),
  quantidade: integer("quantidade").notNull().default(0),
  estoqueMinimo: integer("estoque_minimo").notNull().default(0),
  unidade: text("unidade").notNull().default("un"),
  fornecedor: text("fornecedor"),
  localizacao: text("localizacao"),
  /** Detalhes livres: [{ nome: "Cor", valor: "Preto" }, …] */
  atributos: jsonb("atributos").$type<{ nome: string; valor: string }[]>().notNull().default([]),
  criadoEm: text("criado_em").notNull(),
  atualizadoEm: text("atualizado_em").notNull(),
});

/** Fotos do produto no banco; a de menor `ordem` é a capa. */
export const produtoFotos = pgTable(
  "produto_fotos",
  {
    id: serial("id").primaryKey(),
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
    mime: text("mime").notNull(),
    bytes: bytea("bytes").notNull(),
    criadaEm: text("criada_em").notNull(),
  },
  (t) => [index("produto_fotos_produto_idx").on(t.produtoId)],
);

/** Entradas, saídas e ajustes. `delta` positivo entra, negativo sai. */
export const movimentos = pgTable(
  "movimentos_estoque",
  {
    id: serial("id").primaryKey(),
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtos.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: ["entrada", "saida", "ajuste"] }).notNull(),
    delta: integer("delta").notNull(),
    saldo: integer("saldo").notNull(),
    motivo: text("motivo"),
    criadoEm: text("criado_em").notNull(),
  },
  (t) => [index("movimentos_produto_idx").on(t.produtoId)],
);

/** Chamadas à Places API por mês: o painel para antes de sair da cota grátis do Google. */
export const usoGoogle = pgTable("uso_google", {
  mes: text("mes").primaryKey(),
  buscas: integer("buscas").notNull().default(0),
  detalhes: integer("detalhes").notNull().default(0),
  fotos: integer("fotos").notNull().default(0),
});

/** Onde você compra as placas: contato, prazo, pedido mínimo e sua nota para ele. */
export const fornecedores = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  whatsapp: text("whatsapp"),
  site: text("site"),
  instagram: text("instagram"),
  cidade: text("cidade"),
  prazoDias: integer("prazo_dias"),
  pedidoMinimo: integer("pedido_minimo"),
  frete: text("frete"),
  nota: integer("nota"),
  favorito: boolean("favorito").notNull().default(false),
  observacoes: text("observacoes"),
  criadoEm: text("criado_em").notNull(),
});

/** Cada placa que o fornecedor vende: foto, descrição, preço e o link direto para comprar. */
export const ofertasFornecedor = pgTable(
  "ofertas_fornecedor",
  {
    id: serial("id").primaryKey(),
    fornecedorId: integer("fornecedor_id")
      .notNull()
      .references(() => fornecedores.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    link: text("link"),
    tipo: text("tipo"),
    material: text("material"),
    preco: doublePrecision("preco").notNull().default(0),
    qtdMinima: integer("qtd_minima").notNull().default(1),
    /** Foto vinda do link (quando não deu para guardar a imagem). */
    imagemUrl: text("imagem_url"),
    fotoMime: text("foto_mime"),
    foto: bytea("foto"),
    /** Sobe a cada foto nova: a URL muda e o cache não mostra a antiga. */
    fotoVersao: integer("foto_versao").notNull().default(0),
    criadoEm: text("criado_em").notNull(),
  },
  (t) => [index("ofertas_fornecedor_idx").on(t.fornecedorId)],
);

/** Compras de placas: do pedido até chegar (e entrar no estoque). */
export const pedidosCompra = pgTable(
  "pedidos_compra",
  {
    id: serial("id").primaryKey(),
    fornecedorId: integer("fornecedor_id")
      .notNull()
      .references(() => fornecedores.id, { onDelete: "cascade" }),
    ofertaId: integer("oferta_id").references(() => ofertasFornecedor.id, { onDelete: "set null" }),
    descricao: text("descricao").notNull(),
    quantidade: integer("quantidade").notNull(),
    valorTotal: doublePrecision("valor_total").notNull(),
    frete: doublePrecision("frete").notNull().default(0),
    data: text("data").notNull(),
    previsao: text("previsao"),
    status: text("status", { enum: ["pedido", "enviado", "recebido", "cancelado"] })
      .notNull()
      .default("pedido"),
    rastreio: text("rastreio"),
    observacao: text("observacao"),
    recebidoEm: text("recebido_em"),
    produtoId: integer("produto_id"),
    criadoEm: text("criado_em").notNull(),
  },
  (t) => [index("pedidos_compra_status_idx").on(t.status)],
);

export type Fornecedor = typeof fornecedores.$inferSelect;
export type PedidoCompra = typeof pedidosCompra.$inferSelect;

/** Sua voz falando cada roteiro da Mentora (uma gravação por roteiro; regravar troca). */
export const gravacoes = pgTable("gravacoes", {
  id: serial("id").primaryKey(),
  roteiroId: text("roteiro_id").notNull().unique(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
  segundos: doublePrecision("segundos"),
  criadaEm: text("criada_em").notNull(),
});

/** Falas geradas pela voz de IA, guardadas para não gastar a cota de novo. */
export const falasIa = pgTable("falas_ia", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
  caracteres: integer("caracteres").notNull(),
  criadaEm: text("criada_em").notNull(),
});

/** Caracteres gastos na voz de IA por mês (a cota grátis é por caractere). */
export const usoVoz = pgTable("uso_voz", {
  mes: text("mes").primaryKey(),
  caracteres: integer("caracteres").notNull().default(0),
});

export type LeadStatus = (typeof leads.$inferSelect)["status"];

export type Empresa = typeof empresas.$inferSelect;
export type Placa = typeof placas.$inferSelect;
export type Venda = typeof vendas.$inferSelect;
export type Despesa = typeof despesas.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type PlacaTipo = Placa["tipo"];
export type PlacaStatus = Placa["status"];
export type VendaStatus = Venda["status"];
export type DespesaCategoria = Despesa["categoria"];
export type Produto = typeof produtos.$inferSelect;
export type Movimento = typeof movimentos.$inferSelect;
