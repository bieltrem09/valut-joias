import type { Metadata } from "next";
import { listPlacas, placasResumo } from "@/lib/data/placas";
import { PlacasView } from "@/components/placas/placas-view";
import { PageIntro } from "@/components/shell/page-intro";
import { formatInt } from "@/lib/format";

export const metadata: Metadata = { title: "Placas NFC" };

export default function PlacasPage() {
  const placas = listPlacas();
  const r = placasResumo(placas);

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Placas NFC">
        <span className="text-foreground">{formatInt(r.leituras30d)} leituras</span> nos últimos 30 dias
        <span className="text-muted-foreground">
          {r.pendentes > 0 ? `, e ${r.pendentes} ${r.pendentes === 1 ? "placa esperando" : "placas esperando"} envio.` : "."}
        </span>
      </PageIntro>

      <dl className="grid grid-cols-3 divide-x divide-border border-y border-border">
        {[
          ["Placas vendidas", r.vendidas],
          ["Ativas", r.ativas],
          ["Leituras totais", r.leituras],
        ].map(([k, v]) => (
          <div key={k} className="px-4 py-4 first:pl-0 md:px-6 md:first:pl-0">
            <dt className="text-12 text-muted-foreground md:text-13">{k}</dt>
            <dd className="mt-1 font-mono text-20 font-medium tracking-[-0.02em] tabular md:text-28">{formatInt(v as number)}</dd>
          </div>
        ))}
      </dl>

      <PlacasView placas={placas} />
    </div>
  );
}
