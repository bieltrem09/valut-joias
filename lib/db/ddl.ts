/**
 * Criação idempotente das tabelas. Espelha `schema.ts`; mantido à mão para
 * o app subir sem passo de migração (é um painel de um usuário só).
 * Para gerar migrações formais: `npx drizzle-kit generate`.
 */
export const DDL = /* sql */ `
create table if not exists empresas (
  id integer primary key autoincrement,
  nome text not null,
  place_id text,
  categoria text not null,
  cidade text not null,
  endereco text,
  maps_url text,
  foto_url text,
  rating real,
  total_avaliacoes integer,
  avaliacoes_na_instalacao integer,
  contato_nome text,
  contato_cargo text,
  contato_foto_url text,
  telefone text,
  refreshed_at text,
  criada_em text not null
);
create table if not exists placas (
  id integer primary key autoincrement,
  codigo text not null unique,
  tipo text not null,
  destino_url text not null,
  status text not null,
  leituras integer not null default 0,
  empresa_id integer not null references empresas(id) on delete cascade,
  ativada_em text
);
create index if not exists placas_empresa_idx on placas(empresa_id);
create table if not exists vendas (
  id integer primary key autoincrement,
  empresa_id integer not null references empresas(id) on delete cascade,
  data text not null,
  valor_venda real not null,
  custo_placa real not null,
  custo_gravacao real not null,
  frete real not null,
  taxa_pagamento real not null,
  status text not null,
  metodo text not null
);
create index if not exists vendas_data_idx on vendas(data);
create index if not exists vendas_empresa_idx on vendas(empresa_id);
create table if not exists venda_placas (
  venda_id integer not null references vendas(id) on delete cascade,
  placa_id integer not null references placas(id) on delete cascade,
  primary key (venda_id, placa_id)
);
create table if not exists despesas (
  id integer primary key autoincrement,
  descricao text not null,
  categoria text not null,
  valor real not null,
  data text not null
);
create index if not exists despesas_data_idx on despesas(data);
create table if not exists leituras (
  placa_id integer not null references placas(id) on delete cascade,
  data text not null,
  total integer not null,
  primary key (placa_id, data)
);
create table if not exists avaliacoes_historico (
  id integer primary key autoincrement,
  empresa_id integer not null references empresas(id) on delete cascade,
  data text not null,
  rating real,
  total integer not null
);
create index if not exists aval_hist_empresa_idx on avaliacoes_historico(empresa_id);
create table if not exists reviews (
  id integer primary key autoincrement,
  empresa_id integer not null references empresas(id) on delete cascade,
  autor text not null,
  nota integer not null,
  texto text not null,
  data text not null
);
create index if not exists reviews_empresa_idx on reviews(empresa_id);
`;
