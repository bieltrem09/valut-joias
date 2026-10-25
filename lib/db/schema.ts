import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex, blob } from "drizzle-orm/sqlite-core";

export const empresas = sqliteTable("empresas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  placeId: text("place_id"),
  categoria: text("categoria").notNull(),
  cidade: text("cidade").notNull(),
  endereco: text("endereco"),
  mapsUrl: text("maps_url"),
  fotoUrl: text("foto_url"),
  rating: real("rating"),
  totalAvaliacoes: integer("total_avaliacoes"),
  avaliacoesNaInstalacao: integer("avaliacoes_na_instalacao"),
  contatoNome: text("contato_nome"),
  contatoCargo: text("contato_cargo"),
  contatoFotoUrl: text("contato_foto_url"),
  telefone: text("telefone"),
  refreshedAt: text("refreshed_at"),
  criadaEm: text("criada_em").notNull(),
});

export const placas = sqliteTable(
  "placas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

export const vendas = sqliteTable(
  "vendas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    data: text("data").notNull(), // YYYY-MM-DD
    valorVenda: real("valor_venda").notNull(),
    custoPlaca: real("custo_placa").notNull(),
    custoGravacao: real("custo_gravacao").notNull(),
    frete: real("frete").notNull(),
    taxaPagamento: real("taxa_pagamento").notNull(),
    status: text("status", { enum: ["paga", "pendente", "cancelada"] }).notNull(),
    metodo: text("metodo", { enum: ["Pix", "Cartão", "Boleto"] }).notNull(),
  },
  (t) => [index("vendas_data_idx").on(t.data), index("vendas_empresa_idx").on(t.empresaId)],
);

export const vendaPlacas = sqliteTable(
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

export const despesas = sqliteTable(
  "despesas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    descricao: text("descricao").notNull(),
    categoria: text("categoria", { enum: ["Anúncios", "Ferramentas", "Frete", "Taxas", "Outros"] }).notNull(),
    valor: real("valor").notNull(),
    data: text("data").notNull(),
  },
  (t) => [index("despesas_data_idx").on(t.data)],
);

/** Toques reais por dia em cada placa, contados pelo redirecionador /r/[codigo]. */
export const leituras = sqliteTable(
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
export const avaliacoesHistorico = sqliteTable(
  "avaliacoes_historico",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    empresaId: integer("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    data: text("data").notNull(),
    rating: real("rating"),
    total: integer("total").notNull(),
    /** "google" (Places API) ou "manual" (o dono digitou o que viu no Google). */
    fonte: text("fonte", { enum: ["google", "manual"] })
      .notNull()
      .default("google"),
  },
  (t) => [uniqueIndex("aval_hist_empresa_dia").on(t.empresaId, t.data)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
export const fotos = sqliteTable("fotos", {
  empresaId: integer("empresa_id")
    .primaryKey()
    .references(() => empresas.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  bytes: blob("bytes", { mode: "buffer" }).notNull(),
  atualizadaEm: text("atualizada_em").notNull(),
});

/** Empresas achadas na prospecção (Google Places) e em que ponto do funil estão. */
export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    placeId: text("place_id").notNull().unique(),
    nome: text("nome").notNull(),
    categoria: text("categoria"),
    endereco: text("endereco"),
    lat: real("lat"),
    lng: real("lng"),
    telefone: text("telefone"),
    website: text("website"),
    mapsUrl: text("maps_url"),
    rating: real("rating"),
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
export const buscas = sqliteTable("buscas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  segmento: text("segmento").notNull(),
  local: text("local").notNull(),
  modo: text("modo", { enum: ["cidade", "perto", "area"] }).notNull(),
  raioKm: real("raio_km"),
  total: integer("total").notNull(),
  criadaEm: text("criada_em").notNull(),
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
