'use client';

import { FormEvent, useState } from 'react';
import { whatsappLink } from '@/data/site';
import { RevealText } from '@/components/ui/Reveal';

const faq = [
  { q: 'Qual o pedido mínimo?', a: '[CONFIRMAR] Valor ou quantidade mínima para compras no atacado.' },
  { q: 'Como funciona o envio?', a: 'Enviamos para todo o Brasil. [CONFIRMAR] prazos e transportadoras.' },
  { q: 'Quais as formas de pagamento?', a: '[CONFIRMAR] Formas de pagamento aceitas no atacado.' },
];

/** Formulário de revenda: monta a mensagem e abre o WhatsApp (ou o link de vendas, enquanto o número não é confirmado). */
export function WholesaleForm() {
  const [data, setData] = useState({ nome: '', cidade: '', instagram: '', mensagem: '' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const msg = `Olá, VALUT! Quero revender.\nNome: ${data.nome}\nCidade: ${data.cidade}\nInstagram/loja: ${data.instagram}\n${data.mensagem}`;
    window.open(whatsappLink(msg), '_blank', 'noopener');
  };
  const field = 'peer h-14 w-full border-b border-ink/25 bg-transparent pt-4 text-[15px] outline-none transition-colors focus:border-ink';
  const label = 'pointer-events-none absolute top-0 left-0 text-xs text-ink/60';
  return (
    <section className="mx-auto grid max-w-[1600px] gap-16 px-5 py-28 md:px-8 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-gold-deep">Quero revender</p>
        <RevealText className="mt-4 font-serif text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95]">
          Conte um pouco <span className="serif-italic">sobre você</span>
        </RevealText>
        <dl className="mt-12 space-y-6">
          {faq.map((f) => (
            <div key={f.q} className="border-t border-ink/15 pt-5">
              <dt className="font-serif text-xl">{f.q}</dt>
              <dd className="mt-2 text-[15px] text-ink/70">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
      <form onSubmit={submit} className="space-y-8 self-end rounded-[var(--radius-card)] bg-marble p-8 md:p-12">
        {(
          [
            ['nome', 'Nome completo', 'name'],
            ['cidade', 'Cidade / UF', 'address-level2'],
            ['instagram', 'Instagram ou nome da loja', 'off'],
          ] as const
        ).map(([k, l, ac]) => (
          <div key={k} className="relative">
            <label htmlFor={`ws-${k}`} className={label}>
              {l}
            </label>
            <input id={`ws-${k}`} required={k !== 'instagram'} autoComplete={ac} value={data[k]} onChange={(e) => setData({ ...data, [k]: e.target.value })} className={field} />
          </div>
        ))}
        <div className="relative">
          <label htmlFor="ws-msg" className={label}>
            Mensagem (opcional)
          </label>
          <textarea id="ws-msg" rows={3} value={data.mensagem} onChange={(e) => setData({ ...data, mensagem: e.target.value })} className={`${field} h-auto resize-none pt-6`} />
        </div>
        <button type="submit" className="h-14 w-full rounded-full bg-ink text-[15px] font-medium text-ivory transition-colors hover:bg-gold hover:text-ink">
          Enviar pelo WhatsApp
        </button>
      </form>
    </section>
  );
}
