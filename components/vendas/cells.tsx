"use client";

import { CompanyAvatar } from "@/components/ui/company-avatar";
import { StatusDot } from "@/components/ui/chip";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EmpresaCell({ nome, cidade, categoria, fotoUrl }: { nome: string; cidade: string; categoria: string; fotoUrl: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CompanyAvatar nome={nome} categoria={categoria} src={fotoUrl} />
      <div className="min-w-0 leading-tight">
        <p className="max-w-[220px] truncate text-14 font-medium">{nome}</p>
        <p className="truncate text-12 text-muted-foreground">{cidade}</p>
      </div>
    </div>
  );
}

const VENDA_STATUS = {
  paga: { tone: "profit", label: "Paga" },
  pendente: { tone: "pending", label: "Pendente" },
  cancelada: { tone: "neutral", label: "Cancelada" },
} as const;

export function VendaStatus({ status }: { status: keyof typeof VENDA_STATUS }) {
  const s = VENDA_STATUS[status];
  return <StatusDot tone={s.tone}>{s.label}</StatusDot>;
}

export function Money({ value, signed, muted }: { value: number; signed?: boolean; muted?: boolean }) {
  return (
    <span className={cn(signed && value > 0 && "text-profit", signed && value < 0 && "text-cost", muted && "text-muted-foreground")}>
      {value < 0 ? `−${formatBRL(-value)}` : formatBRL(value)}
    </span>
  );
}
