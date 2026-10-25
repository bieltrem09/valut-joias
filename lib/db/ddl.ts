/**
 * Criação idempotente das tabelas (Postgres). Espelha `schema.ts`; roda uma vez
 * por processo, então o app sobe sem passo de migração (painel de um usuário só).
 * Funciona igual no Supabase e no PGlite local.
 */
export const DDL = /* sql */ `
create table if not exists empresas (
  id serial primary key,
  nome text not null,
  place_id text,
  categoria text not null,
  cidade text not null,
  endereco text,
  maps_url text,
  foto_url text,
  rating double precision,
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
  id serial primary key,
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
  id serial primary key,
  empresa_id integer not null references empresas(id) on delete cascade,
  data text not null,
  valor_venda double precision not null,
  custo_placa double precision not null,
  custo_gravacao double precision not null,
  frete double precision not null,
  taxa_pagamento double precision not null,
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
  id serial primary key,
  descricao text not null,
  categoria text not null,
  valor double precision not null,
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
  id serial primary key,
  empresa_id integer not null references empresas(id) on delete cascade,
  data text not null,
  rating double precision,
  total integer not null,
  fonte text not null default 'google'
);
create unique index if not exists aval_hist_empresa_dia on avaliacoes_historico(empresa_id, data);
create table if not exists reviews (
  id serial primary key,
  empresa_id integer not null references empresas(id) on delete cascade,
  autor text not null,
  nota integer not null,
  texto text not null,
  data text not null
);
create index if not exists reviews_empresa_idx on reviews(empresa_id);
create table if not exists fotos (
  empresa_id integer primary key references empresas(id) on delete cascade,
  mime text not null,
  bytes bytea not null,
  atualizada_em text not null
);
create table if not exists leads (
  id serial primary key,
  place_id text not null unique,
  nome text not null,
  categoria text,
  endereco text,
  lat double precision,
  lng double precision,
  telefone text,
  website text,
  maps_url text,
  rating double precision,
  total_avaliacoes integer,
  score integer not null,
  status text not null default 'novo',
  anotacao text,
  segmento text,
  empresa_id integer,
  criado_em text not null,
  atualizado_em text not null
);
create index if not exists leads_status_idx on leads(status);
create table if not exists buscas (
  id serial primary key,
  segmento text not null,
  local text not null,
  modo text not null,
  raio_km double precision,
  total integer not null,
  criada_em text not null
);
`;
