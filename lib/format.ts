const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const int = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const one = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Intl insere NBSP entre "R$" e o número; mantemos (não quebra linha). */
export const formatBRL = (v: number) => brl.format(v);
export const formatBRLCompact = (v: number) => brlCompact.format(v);
export const formatInt = (v: number) => int.format(v);
export const formatPct = (v: number) => pct.format(v);
export const formatRating = (v: number) => one.format(v);

export function signed(v: number, fmt: (n: number) => string) {
  if (v === 0) return fmt(0);
  return `${v > 0 ? "+" : "−"}${fmt(Math.abs(v))}`;
}

export function initials(name: string) {
  const parts = name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^\p{Lu}/u.test(p));
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase();
}
