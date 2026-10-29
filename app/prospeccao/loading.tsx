import { IntroSkeleton, TableSkeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div className="grid gap-6 md:gap-8" aria-busy aria-label="Carregando">
      <IntroSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
