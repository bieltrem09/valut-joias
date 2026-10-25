import { Skeleton } from "@/components/ui/skeleton";
import { IntroSkeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div className="grid gap-6 md:gap-8" aria-busy aria-label="Carregando clientes">
      <IntroSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="surface overflow-hidden">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="grid gap-4 p-5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
