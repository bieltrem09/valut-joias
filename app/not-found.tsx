import Link from "next/link";
import { GridGlow } from "@/components/ui/grid-glow";

export default function NotFound() {
  return (
    <div className="surface relative grid place-items-center overflow-hidden px-6 py-24 text-center">
      <GridGlow />
      <div className="relative">
        <p className="font-mono text-12 text-muted-foreground">404</p>
        <p className="mt-2 text-20 font-medium">Essa página não existe.</p>
        <Link href="/" className="mt-4 inline-block text-14 font-medium text-primary underline-offset-4 hover-fine:underline">
          Voltar para Minhas vendas
        </Link>
      </div>
    </div>
  );
}
