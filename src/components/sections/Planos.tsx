"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { faqPagamento, planos, zeroum, type Periodo } from "@/content/zeroum";
import { waLink } from "@/lib/whatsapp";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Todo, Value } from "@/components/ui/Todo";

const periodos: { id: Periodo; label: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "semestral", label: "Semestral" },
  { id: "anual", label: "Anual" },
];

const brl = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 05 · PLANOS — seção clara, layout assimétrico (recomendado maior, preto, borda vermelha). */
export function Planos({ full = false, label = "05" }: { full?: boolean; label?: string }) {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const semPreco = planos.every((p) => Object.values(p.precos).every((v) => v === null));

  return (
    <section aria-labelledby="planos-title" className="surface-paper relative z-10 py-24 md:py-32">
      <div className="container-site">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <SectionLabel n={label}>Planos e preços</SectionLabel>
            <h2 id="planos-title" className="display mt-4 text-section">
              Escolha o plano.
              <br />
              <span className="text-red">A porta já tá aberta.</span>
            </h2>
          </div>
          <div className="md:col-span-5 md:justify-self-end">
            <div role="radiogroup" aria-label="Período do plano" className="inline-flex rounded-full bg-black p-1">
              {periodos.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={periodo === p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors duration-200 ${periodo === p.id ? "bg-white text-black" : "text-white/75 hover:text-white"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {semPreco && (
          <p className="mt-8">
            <Todo>valores e benefícios — copiar do destaque “Planos” do Instagram. Até lá, o botão leva ao WhatsApp.</Todo>
          </p>
        )}

        <ul className="mt-10 grid gap-4 lg:grid-cols-12 lg:items-stretch">
          {planos.map((p) => {
            const preco = p.precos[periodo];
            const dark = p.destaque;
            return (
              <li
                key={p.id}
                className={`flex flex-col rounded-[var(--radius-card)] p-6 md:p-8 ${
                  dark ? "order-first border-2 border-red bg-black text-white lg:order-none lg:col-span-5 lg:-my-4 lg:p-10" : "border border-black/10 bg-white lg:col-span-3 lg:first:col-span-4"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="title text-xl">{p.nome}</h3>
                  {dark && <span className="pill bg-red text-white">Recomendado</span>}
                </div>
                <p className="mt-8 flex items-baseline gap-2">
                  {preco !== null ? (
                    <>
                      <span className="label">R$</span>
                      <span className="font-mono text-5xl font-medium tracking-tight md:text-6xl">
                        <RollingNumber value={brl(preco)} />
                      </span>
                      <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>/mês</span>
                    </>
                  ) : (
                    <span className="font-mono text-3xl font-medium tracking-tight">Consultar valor</span>
                  )}
                </p>
                <ul className="mt-8 space-y-3">
                  {p.inclui.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check size={18} className={`mt-0.5 shrink-0 ${dark ? "text-red-bright" : "text-red-ink"}`} aria-hidden="true" />
                      {item.startsWith("TODO") ? <Todo>{item.replace(/^TODO:\s*/, "")}</Todo> : <span>{item}</span>}
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(`Olá, Zero Um! Quero saber sobre o ${p.nome} (${periodo}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn mt-auto w-full justify-center !mt-10 ${dark ? "btn-red" : "btn-black"}`}
                >
                  {preco !== null ? "Quero esse plano" : "Consultar no WhatsApp"} <span className="btn-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Diária avulsa — preço oficial do Instagram */}
        <div className="mt-6 flex flex-col gap-5 rounded-[var(--radius-card)] bg-black p-6 text-white sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div>
            <p className="label text-gray-300">Diária avulsa</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="label">R$</span>
              <span className="font-mono text-4xl font-medium tracking-tight tnum">{brl(zeroum.diaria)}</span>
              <span className="text-sm text-gray-300">/dia · campanhas podem ter valor promocional</span>
            </p>
          </div>
          <a href={waLink("Olá, Zero Um! Quero fazer uma diária.")} target="_blank" rel="noopener noreferrer" className="btn btn-white justify-center">
            Quero treinar um dia <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        <div className="hairline mt-14 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md">
            <strong>Já tem agregador?</strong> Só chegar com o app.
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Agregadores aceitos">
            {zeroum.agregadores.map((a) => (
              <li key={a.nome} className="pill min-h-11 border border-black/25 px-5 text-base">
                {a.nome} <strong>{a.plano}</strong>
              </li>
            ))}
          </ul>
        </div>

        {full && (
          <div className="mt-20 grid gap-10 md:grid-cols-12">
            <h3 className="display text-[clamp(2.25rem,4vw,3.5rem)] md:col-span-4">Pagamento</h3>
            <div className="md:col-span-8">
              {faqPagamento.map((f) => (
                <details key={f.q} className="hairline border-b">
                  <summary className="flex min-h-14 items-center justify-between gap-4 py-4 text-lg font-semibold">
                    {f.q}
                    <span className="faq-icon text-2xl leading-none text-red-ink" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="pb-5 text-gray-600">
                    <Value v={f.a} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
