import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/format";

const PATH = "M10 1.6l2.47 5.29 5.78.66-4.29 3.95 1.17 5.7L10 14.3l-5.13 2.9 1.17-5.7L1.75 7.55l5.78-.66L10 1.6z";

/** Estrelas com meia estrela (arredonda para 0,5). A nota em texto fica ao lado; aqui é só desenho. */
export function Stars({ value, className }: { value: number; className?: string }) {
  const v = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-[2px] text-rating", className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <svg key={i} viewBox="0 0 20 20" className="size-3.5">
            <path d={PATH} fill="currentColor" opacity={0.22} />
            {fill > 0 && <path d={PATH} fill="currentColor" style={fill < 1 ? { clipPath: "inset(0 50% 0 0)" } : undefined} />}
          </svg>
        );
      })}
    </span>
  );
}

export function Rating({ rating, total, className }: { rating: number | null; total: number | null; className?: string }) {
  if (rating == null) return <span className={cn("text-12 text-muted-foreground", className)}>Sem avaliações no Google</span>;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Stars value={rating} />
      <span className="font-mono text-13 font-medium tabular">{formatRating(rating)}</span>
      {total != null && <span className="text-12 text-muted-foreground">({total.toLocaleString("pt-BR")} avaliações)</span>}
      <span className="sr-only">Nota {formatRating(rating)} de 5</span>
    </span>
  );
}
