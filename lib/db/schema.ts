import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

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

/** Leituras por dia de cada placa (alimenta o gráfico do detalhe). */
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

/** Histórico de userRatingCount, para o "+N desde a placa". */
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
  },
  (t) => [index("aval_hist_empresa_idx").on(t.empresaId)],
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

export type Empresa = typeof empresas.$inferSelect;
export type Placa = typeof placas.$inferSelect;
export type Venda = typeof vendas.$inferSelect;
export type Despesa = typeof despesas.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type PlacaTipo = Placa["tipo"];
export type PlacaStatus = Placa["status"];
export type VendaStatus = Venda["status"];
export type DespesaCategoria = Despesa["categoria"];
