import type { Metadata } from "next";
import { parsePeriod, PERIOD_LABEL } from "@/lib/period";
import { getDashboard, listEmpresasParaSelect } from "@/lib/data/vendas";
import { NovaVendaButton } from "@/components/vendas/nova-venda";
import { HeroLucro } from "@/components/vendas/hero-lucro";
import { KpiColumn } from "@/components/vendas/kpi-column";
import { CadaReal } from "@/components/vendas/cada-real";
import { TopClientes } from "@/components/vendas/top-clientes";
import { VendasRecentes } from "@/components/vendas/vendas-recentes";
import { PageIntro } from "@/components/shell/page-intro";
import { dono } from "@/lib/dono";

export const metadata: Metadata = { title: { absolute: "Minhas vendas · Basik7" } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VendasPage({ searchParams }: Props) {
  const period = parsePeriod(await searchParams);
  const [d, empresas] = await Promise.all([getDashboard(period), listEmpresasParaSelect()]);
  const { nome } = dono();

  return (
    <div className="grid gap-6 md:gap-8">
      <PageIntro eyebrow={nome ? `Olá, ${nome}` : "Seu negócio"} actions={<NovaVendaButton empresas={empresas} />}>
        {resumoFrase(d.placasVendidas, d.placasVendidasAnterior, period.frase, period.fraseAnterior)}
      </PageIntro>

      <div className="grid gap-4 xl:grid-cols-3 xl:gap-5">
        <div className="xl:col-span-2 xl:row-span-1">
          <HeroLucro
            resumo={d.resumo}
            anterior={d.anterior}
            serie={d.serie}
            fraseAnterior={period.fraseAnterior}
            periodKey={period.key}
            periodoLabel={period.key === "custom" ? period.frase.replace(/^de /, "") : PERIOD_LABEL[period.key]}
            vendasDoDia={period.dias === 1 ? d.vendas.filter((v) => v.status !== "cancelada") : []}
          />
        </div>
        <KpiColumn resumo={d.resumo} anterior={d.anterior} serie={d.serie} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12 xl:gap-5">
        <div className="lg:col-span-7">
          <CadaReal resumo={d.resumo} />
        </div>
        <div className="lg:col-span-5">
          <TopClientes clientes={d.topClientes} />
        </div>
      </div>

      <VendasRecentes vendas={d.vendas} />
    </div>
  );
}

function resumoFrase(n: number, prev: number, frase: string, fraseAnterior: string) {
  if (n === 0) return <>Nenhuma placa vendida {frase}. Registre a primeira venda e o painel ganha vida.</>;
  const placas = `${n} ${n === 1 ? "placa" : "placas"}`;
  const diff = n - prev;
  let comp = "";
  if (prev > 0 && diff > 0) comp = `, ${diff} a mais que ${fraseAnterior}`;
  else if (prev > 0 && diff < 0) comp = `, ${-diff} a menos que ${fraseAnterior}`;
  else if (prev > 0) comp = `, o mesmo que ${fraseAnterior}`;
  return (
    <>
      Você vendeu <span className="text-foreground">{placas}</span> {frase}
      <span className="text-muted-foreground">{comp}.</span>
    </>
  );
}
