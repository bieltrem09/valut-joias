"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, Phone, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { anotarLead, excluirLeads, mudarStatusLead, virarCliente } from "@/app/actions";
import type { LeadFunil } from "@/lib/data/leads";
import { whatsappUrl } from "@/lib/prospeccao";
import { urlBuscaMaps } from "@/lib/maps-link";
import { formatInt, formatRating } from "@/lib/format";
import { relativeDays, todaySP } from "@/lib/dates";
import { cn } from "@/lib/utils";

const COLUNAS = [
  { key: "novo", label: "Novo", dot: "bg-chart-5" },
  { key: "contatado", label: "Contatado", dot: "bg-chart-1" },
  { key: "negociando", label: "Negociando", dot: "bg-chart-4" },
  { key: "fechado", label: "Fechado", dot: "bg-profit" },
  { key: "perdido", label: "Perdido", dot: "bg-cost" },
] as const;
type Status = (typeof COLUNAS)[number]["key"];

/** Mensagem inicial para o WhatsApp: curta, pessoal e com o motivo do contato. */
function mensagem(l: LeadFunil) {
  const n = l.totalAvaliacoes ?? 0;
  return `Oi! Vi a ${l.nome} no Google${l.rating ? `, nota ${formatRating(l.rating)}` : ""}${n ? ` com ${formatInt(n)} avaliações` : ""}. Trabalho com placas NFC que fazem o cliente avaliar com um toque no celular. Posso te mostrar como funciona?`;
}

export function Funil({ leads }: { leads: LeadFunil[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(leads);
  React.useEffect(() => setRows(leads), [leads]);

  const mover = async (l: LeadFunil, status: Status) => {
    setRows((rs) => rs.map((r) => (r.id === l.id ? { ...r, status } : r)));
    const r = await mudarStatusLead(l.id, status);
    if (!r.ok) {
      toast.error(r.error);
      router.refresh();
    }
  };

  if (!rows.length) {
    return (
      <p className="surface px-6 py-8 text-center text-13 text-muted-foreground">
        O funil está vazio. Faça uma busca acima e envie as melhores oportunidades para cá.
      </p>
    );
  }

  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
      {COLUNAS.map((c) => {
        const itens = rows.filter((r) => r.status === c.key);
        return (
          <section key={c.key} aria-label={c.label} className="w-[78%] shrink-0 snap-start rounded-card bg-muted/50 p-2 sm:w-[46%] md:w-auto">
            <header className="flex items-center justify-between px-2 py-2">
              <span className="flex items-center gap-2 text-13 font-medium">
                <span className={cn("size-2 rounded-full", c.dot)} aria-hidden />
                {c.label}
              </span>
              <span className="font-mono text-12 text-muted-foreground tabular">{itens.length}</span>
            </header>
            <ul className="grid gap-2">
              {itens.map((l) => (
                <CartaoLead
                  key={l.id}
                  lead={l}
                  onMover={(s) => mover(l, s)}
                  onRefresh={() => router.refresh()}
                  onRemover={() => setRows((rs) => rs.filter((r) => r.id !== l.id))}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CartaoLead({
  lead: l,
  onMover,
  onRefresh,
  onRemover,
}: {
  lead: LeadFunil;
  onMover: (s: Status) => void;
  onRefresh: () => void;
  onRemover: () => void;
}) {
  const [nota, setNota] = React.useState(l.anotacao ?? "");
  const [editando, setEditando] = React.useState(false);
  const [convertendo, setConvertendo] = React.useState(false);
  const zap = l.telefone ? whatsappUrl(l.telefone, mensagem(l)) : null;

  return (
    <li className="surface grid gap-2.5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-13 font-semibold">{l.nome}</p>
          <p className="truncate text-11 text-muted-foreground">
            {l.segmento ?? l.categoria ?? "—"} · {relativeDays(l.atualizadoEm.slice(0, 10), todaySP())}
          </p>
        </div>
        <span className="font-mono text-13 font-medium tabular" title="Pontuação na hora da busca">
          {l.score}
        </span>
      </div>
      {l.rating != null && (
        <p className="text-11 text-muted-foreground">
          Nota <span className="font-mono text-foreground tabular">{formatRating(l.rating)}</span> · {formatInt(l.totalAvaliacoes ?? 0)} avaliações
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noreferrer"
            onClick={() => l.status === "novo" && onMover("contatado")}
            className="inline-flex h-7 items-center rounded-[8px] bg-profit-soft px-2 text-11 font-medium text-profit coarse:h-10"
          >
            WhatsApp
          </a>
        )}
        {l.telefone && (
          <a
            href={`tel:${l.telefone.replace(/[^\d+]/g, "")}`}
            aria-label={`Ligar para ${l.nome}`}
            className="inline-flex h-7 items-center rounded-[8px] px-2 ring-1 ring-border hover-fine:bg-muted coarse:h-10"
          >
            <Phone className="size-3.5" strokeWidth={1.5} />
          </a>
        )}
        {/* Sem link guardado, abre a busca pelo nome no Maps. */}
        <a
          href={l.mapsUrl ?? urlBuscaMaps({ segmento: l.nome, local: l.endereco ?? undefined })}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${l.nome} no Maps`}
          className="inline-flex h-7 items-center rounded-[8px] px-2 ring-1 ring-border hover-fine:bg-muted coarse:h-10"
        >
          <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
        </a>
      </div>

      {editando ? (
        <textarea
          autoFocus
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onBlur={async () => {
            setEditando(false);
            if (nota !== (l.anotacao ?? "")) {
              const r = await anotarLead(l.id, nota);
              if (!r.ok) toast.error(r.error);
            }
          }}
          rows={3}
          placeholder="Falei com o dono, pediu para voltar sexta…"
          className="w-full resize-none rounded-[8px] bg-card p-2 text-12 ring-1 ring-border outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <button type="button" onClick={() => setEditando(true)} className="text-left text-12 text-muted-foreground hover-fine:text-foreground">
          {nota || "+ Anotação"}
        </button>
      )}

      <div className="flex items-center gap-1.5">
        <Select value={l.status} onChange={(e) => onMover(e.target.value as Status)} className="h-8 flex-1 text-12" aria-label={`Etapa de ${l.nome}`}>
          {COLUNAS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <button
          type="button"
          aria-label={`Remover ${l.nome} do funil`}
          onClick={async () => {
            onRemover();
            const r = await excluirLeads([l.id]);
            if (!r.ok) toast.error(r.error);
            onRefresh();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-[8px] text-muted-foreground hover-fine:bg-cost-soft hover-fine:text-destructive coarse:size-10"
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {(l.status === "negociando" || l.status === "fechado") && !l.empresaId && (
        <Button
          size="sm"
          variant="primary"
          disabled={convertendo}
          onClick={async () => {
            setConvertendo(true);
            const r = await virarCliente(l.id);
            setConvertendo(false);
            if (!r.ok) return void toast.error(r.error);
            toast.success(`${l.nome} agora é cliente`, { description: "Já pode registrar a venda das placas." });
            onRefresh();
          }}
        >
          <Store strokeWidth={1.5} /> {convertendo ? "Cadastrando…" : "Virar cliente"}
        </Button>
      )}
      {l.empresaId && <p className="text-11 font-medium text-profit">Cliente cadastrado</p>}
    </li>
  );
}
