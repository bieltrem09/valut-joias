"use client";

import * as React from "react";
import { LayoutGroup, motion } from "motion/react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridGlow } from "@/components/ui/grid-glow";
import type { EmpresaCardData } from "@/lib/data/empresas";
import type { ISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CompanyCard } from "./company-card";
import { ClienteSheet } from "./cliente-sheet";
import { AddClienteSheet } from "./add-cliente";

const SORTS = [
  { key: "faturamento", label: "Faturamento" },
  { key: "nota", label: "Nota" },
  { key: "recente", label: "Mais recente" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ClientesView({ empresas, today, googleEnabled }: { empresas: EmpresaCardData[]; today: ISODate; googleEnabled: boolean }) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("faturamento");
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [adding, setAdding] = React.useState(false);

  const list = React.useMemo(() => {
    const nq = norm(q.trim());
    const rows = nq ? empresas.filter((e) => norm(`${e.nome} ${e.cidade} ${e.categoria}`).includes(nq)) : empresas;
    return [...rows].sort((a, b) => {
      if (sort === "nota") return (b.rating ?? 0) - (a.rating ?? 0) || (b.totalAvaliacoes ?? 0) - (a.totalAvaliacoes ?? 0);
      if (sort === "recente") return (b.ultimaCompra ?? b.criadaEm).localeCompare(a.ultimaCompra ?? a.criadaEm);
      return b.faturamento - a.faturamento;
    });
  }, [empresas, q, sort]);

  const aberta = empresas.find((e) => e.id === openId) ?? null;

  return (
    <>
      <div className="grid gap-3 md:flex md:items-center">
        <div className="flex gap-3">
          <label className="relative flex min-w-0 flex-1 items-center md:w-72 md:flex-none">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome"
              aria-label="Buscar cliente por nome"
              className="h-10 w-full rounded-control bg-card pl-9 pr-3 text-14 shadow-hairline ring-1 ring-border outline-hidden placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring coarse:h-11 [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          <Button variant="primary" onClick={() => setAdding(true)} className="md:hidden" aria-label="Adicionar cliente">
            <Plus strokeWidth={1.5} />
            Adicionar
          </Button>
        </div>
        <LayoutGroup id="sort">
          <div
            role="radiogroup"
            aria-label="Ordenar por"
            className="flex items-center gap-0.5 rounded-full bg-card p-1 shadow-hairline ring-1 ring-border md:ml-auto"
          >
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={sort === s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "relative h-8 flex-1 rounded-full px-3 text-13 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-10 md:flex-none",
                  sort === s.key ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                )}
              >
                {sort === s.key && (
                  <motion.span
                    layoutId="sort-pill"
                    className="absolute inset-0 rounded-full bg-muted"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{s.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <Button variant="primary" onClick={() => setAdding(true)} className="hidden md:inline-flex">
          <Plus strokeWidth={1.5} />
          Adicionar cliente
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="surface relative grid place-items-center overflow-hidden px-6 py-20 text-center">
          <GridGlow />
          <div className="relative">
            <p className="text-16 font-medium">{empresas.length === 0 ? "Seu primeiro cliente mora aqui" : `Ninguém com “${q}”`}</p>
            <p className="mt-1 text-13 text-muted-foreground">
              {empresas.length === 0
                ? googleEnabled
                  ? "Busque pelo nome e o Google preenche foto, nota e endereço."
                  : "Cadastre com nome e cidade. Dá para ligar ao Google depois."
                : "Confira a grafia ou busque pela cidade."}
            </p>
            {empresas.length === 0 && (
              <Button variant="primary" className="mt-5" onClick={() => setAdding(true)}>
                <Plus strokeWidth={1.5} /> Adicionar cliente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {list.map((e, i) => (
            <li key={e.id}>
              <CompanyCard empresa={e} today={today} index={i} onOpen={() => setOpenId(e.id)} />
            </li>
          ))}
        </ul>
      )}

      <ClienteSheet empresa={aberta} today={today} googleEnabled={googleEnabled} onClose={() => setOpenId(null)} />
      <AddClienteSheet open={adding} onOpenChange={setAdding} googleEnabled={googleEnabled} />
    </>
  );
}
