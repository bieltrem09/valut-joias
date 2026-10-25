import { Skeleton } from "@/components/ui/skeleton";
import { IntroSkeleton, TableSkeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div className="grid gap-6 md:gap-8" aria-busy aria-label="Carregando vendas">
      <IntroSkeleton />
      <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
        <div className="relative min-h-[360px] overflow-hidden rounded-card bg-hero p-8 md:min-h-[420px] xl:col-span-2">
          <div className="h-3 w-40 rounded-inner bg-hero-chip" />
          <div className="mt-4 h-12 w-72 rounded-inner bg-hero-chip" />
          <div className="mt-4 h-6 w-44 rounded-full bg-hero-chip" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface grid gap-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-2.5 w-44" />
            </div>
          ))}
        </div>
      </div>
      <TableSkeleton />
    </div>
  );
}
