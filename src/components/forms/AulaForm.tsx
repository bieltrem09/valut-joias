"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { objetivos, turnosPreferidos } from "@/content/zeroum";
import { waLink } from "@/lib/whatsapp";

type Errors = Partial<Record<"nome" | "whats" | "objetivo" | "turno", string>>;

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function validate(f: { nome: string; whats: string; objetivo: string; turno: string }): Errors {
  const e: Errors = {};
  if (f.nome.trim().length < 2) e.nome = "Escreva seu nome.";
  if (f.whats.replace(/\D/g, "").length < 10) e.whats = "Informe um WhatsApp com DDD, ex.: (19) 99999-9999.";
  if (!f.objetivo) e.objetivo = "Escolha um objetivo.";
  if (!f.turno) e.turno = "Escolha um turno.";
  return e;
}

/**
 * Formulário de aula experimental: monta a mensagem e abre o wa.me.
 * Nada é enviado a servidor (frontend-only) — os dados vão direto para a conversa no WhatsApp.
 */
export function AulaForm() {
  const id = useId();
  const [f, setF] = useState({ nome: "", whats: "", objetivo: "", turno: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const errors = validate(f);
  const show = (k: keyof Errors) => (touched[k] || sent) && errors[k];

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSent(true);
    const e = validate(f);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const msg = `Olá, Zero Um! Quero agendar uma aula experimental.\n\nNome: ${f.nome.trim()}\nWhatsApp: ${f.whats}\nObjetivo: ${f.objetivo}\nTurno preferido: ${f.turno}`;
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
  };

  const input = "mt-2 block w-full min-h-14 rounded-[var(--radius-chip)] border bg-carbon px-4 text-base text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus-visible:border-white";

  // Função de render (não componente) para não remontar e perder o foco a cada tecla.
  const renderChoice = (name: "objetivo" | "turno", options: readonly string[]) => (
    <fieldset aria-describedby={show(name) ? `${id}-${name}-err` : undefined}>
      <legend className="text-sm font-semibold">{name === "objetivo" ? "Seu objetivo" : "Turno preferido"}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label key={o} className="relative">
            <input
              type="radio"
              name={name}
              value={o}
              id={i === 0 ? `${id}-${name}` : undefined}
              checked={f[name] === o}
              onChange={() => {
                setF((s) => ({ ...s, [name]: o }));
                setTouched((t) => ({ ...t, [name]: true }));
              }}
              className="peer sr-only"
            />
            <span className="btn btn-outline peer-checked:!border-red peer-checked:bg-red peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
              {o}
            </span>
          </label>
        ))}
      </div>
      {show(name) && (
        <p id={`${id}-${name}-err`} className="mt-2 text-sm text-red-bright">
          {errors[name]}
        </p>
      )}
    </fieldset>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      <div>
        <label htmlFor={`${id}-nome`} className="text-sm font-semibold">
          Nome
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          autoComplete="name"
          value={f.nome}
          onChange={(e) => setF((s) => ({ ...s, nome: e.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
          aria-invalid={!!show("nome")}
          aria-describedby={show("nome") ? `${id}-nome-err` : undefined}
          className={`${input} ${show("nome") ? "border-red-bright" : "border-white/15"}`}
          placeholder="Como você se chama?"
        />
        {show("nome") && (
          <p id={`${id}-nome-err`} className="mt-2 text-sm text-red-bright">
            {errors.nome}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-whats`} className="text-sm font-semibold">
          WhatsApp
        </label>
        <input
          id={`${id}-whats`}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={f.whats}
          onChange={(e) => setF((s) => ({ ...s, whats: maskPhone(e.target.value) }))}
          onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
          aria-invalid={!!show("whats")}
          aria-describedby={`${id}-whats-help${show("whats") ? ` ${id}-whats-err` : ""}`}
          className={`${input} tnum ${show("whats") ? "border-red-bright" : "border-white/15"}`}
          placeholder="(19) 99999-9999"
        />
        <p id={`${id}-whats-help`} className="mt-2 text-sm text-gray-300">
          Com DDD. A gente responde por lá.
        </p>
        {show("whats") && (
          <p id={`${id}-whats-err`} className="mt-1 text-sm text-red-bright">
            {errors.whats}
          </p>
        )}
      </div>

      {renderChoice("objetivo", objetivos)}
      {renderChoice("turno", turnosPreferidos)}

      <div className="hairline flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-sm text-gray-300">
          Ao enviar, abrimos o WhatsApp com a mensagem pronta. Seus dados não ficam salvos no site.{" "}
          <Link href="/politica-de-privacidade" className="underline underline-offset-4 hover:text-white">
            Privacidade
          </Link>
        </p>
        <button type="submit" className="btn btn-red justify-center">
          Enviar pelo WhatsApp <span className="btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
