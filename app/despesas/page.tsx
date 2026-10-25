import type { Metadata } from "next";
import { parsePeriod } from "@/lib/period";
import { listDespesas, totalDespesasAnterior } from "@/lib/data/despesas";
import { getResumo } from "@/lib/data/vendas";
import { DespesasView } from "@/components/despesas/despesas-view";
import { PageIntro } from "@/components/shell/page-intro";
import { formatBRL, formatPct } from "@/lib/format";
import { variacao, cents } from "@/lib/finance";

export const metadata: Metadata = { title: "Despesas" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DespesasPage({ searchParams }: Props) {
  const period = parsePeriod(await searchParams);
  const [despesas, resumo, anterior] = await Promise.all([listDespesas(period), getResumo(period), totalDespesasAnterior(period)]);
  const total = despesas.reduce((a, d) => a + d.valor, 0);
  const v = variacao(total, anterior);

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow="Despesas">
        Você gastou <span className="text-foreground">{formatBRL(total)}</span> {period.frase}
        <span className="text-muted-foreground">
          {v === null || v === 0 ? "." : `, ${formatPct(Math.abs(v))} ${v > 0 ? "a mais" : "a menos"} que ${period.fraseAnterior}.`}
        </span>
      </PageIntro>
      <DespesasView
        despesas={despesas}
        periodo={{ de: period.de, ate: period.ate, frase: period.frase }}
        lucroLiquido={resumo.lucroLiquido}
        receita={resumo.receitaBruta}
        taxasDeVenda={cents(resumo.despesasOperacionais - total)}
      />
    </div>
  );
}
