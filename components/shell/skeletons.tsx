import { Skeleton } from "@/components/ui/skeleton";

/** Esqueletos com o formato real do conteúdo, não barras genéricas. */
export function IntroSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-full max-w-xl" />
      <Skeleton className="h-7 w-2/3 max-w-md" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface overflow-hidden" aria-hidden>
      <div className="flex items-center gap-2 border-b border-border p-3">
        {[56, 64, 72, 64].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
        <Skeleton className="ml-auto h-9 w-56 rounded-control" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-4 border-b border-border px-4 last:border-0">
          <Skeleton className="size-7" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="hidden h-3 w-12 md:block" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
