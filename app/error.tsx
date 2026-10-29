"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { ehVersaoAntiga, recarregarUmaVez, relatarErro } from "@/lib/erro-cliente";

/** Se uma tela quebrar: tenta se recuperar sozinha e, se não der, mostra como continuar. */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [tentando, startTransition] = React.useTransition();
  React.useEffect(() => {
    relatarErro(error, { digest: error.digest });
    // Painel atualizado com a tela aberta: carregar de novo resolve.
    if (ehVersaoAntiga(error)) recarregarUmaVez();
  }, [error]);

  return (
    <div className="grid min-h-[50vh] place-items-center px-4">
      <div className="surface grid max-w-sm justify-items-center gap-3 p-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <RotateCw className="size-5" strokeWidth={1.75} />
        </span>
        <p className="text-16 font-semibold">Essa tela não carregou direito</p>
        <p className="text-13 text-muted-foreground">Pode ter sido a internet ou uma atualização do painel. Seus dados estão salvos.</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            // Busca a tela de novo no servidor (só redesenhar não traria os dados).
            onClick={() =>
              startTransition(() => {
                router.refresh();
                reset();
              })
            }
            disabled={tentando}
            className="h-10 rounded-control bg-primary px-4 text-14 font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {tentando ? "Tentando…" : "Tentar de novo"}
          </button>
          <button
            type="button"
            onClick={() => location.reload()}
            className="h-10 rounded-control px-4 text-14 font-medium ring-1 ring-border transition-transform duration-150 active:scale-[0.97]"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}
