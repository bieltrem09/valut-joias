import type { Metadata } from 'next';
import { site } from '@/data/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { PillLink } from '@/components/ui/Buttons';
import { Media } from '@/components/ui/Media';
import { RingGuideButton } from '@/components/shop/RingGuideButton';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Fale com a VALUT Semijoias. Loja física: ${site.store.street}. Instagram ${site.instagram.handle}.`,
  alternates: { canonical: '/contato' },
};

const policies = [
  { id: 'trocas', title: 'Trocas e devoluções', text: '[CONFIRMAR] Política de trocas: prazo, condições da peça, como solicitar e quem paga o frete de retorno.' },
  { id: 'envio', title: 'Envio', text: `${site.shipping}. [CONFIRMAR] Prazo de postagem, transportadoras, rastreio e valor para frete grátis.` },
  { id: 'garantia', title: 'Garantia', text: '[CONFIRMAR] Garantia do banho e o que ela cobre.' },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title={
          <>
            Fale com a <span className="serif-italic">gente</span>
          </>
        }
      />
      <section className="mx-auto grid max-w-[1600px] gap-12 px-5 pb-24 md:px-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          <div>
            <h2 className="eyebrow text-gold-deep">Loja física</h2>
            <address className="mt-3 font-serif text-2xl leading-snug not-italic">
              {site.store.street}
              <br />
              {site.store.district} · {site.store.city}/{site.store.state}
            </address>
            <ul className="mt-3 text-[15px] text-ink/70">
              {site.store.hours.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <PillLink href={site.store.mapsUrl} external label="Como chegar" className="mt-6" />
          </div>
          <div>
            <h2 className="eyebrow text-gold-deep">Atendimento online</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li>
                Instagram:{' '}
                <a className="link-draw" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                  {site.instagram.handle}
                </a>
              </li>
              <li>
                Vendas:{' '}
                <a className="link-draw" href={site.salesLink} target="_blank" rel="noopener noreferrer">
                  linktr.ee/valutvendas
                </a>
              </li>
              <li>WhatsApp: {site.whatsapp.label}</li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow text-gold-deep">Ajuda</h2>
            <RingGuideButton />
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] lg:col-span-7">
          <Media k="loja-logo-marmore" alt="Logo VALUT dourado em parede de mármore" fill priority sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" />
        </div>
      </section>
      <section className="border-t border-ink/10 bg-marble/40 px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-[1600px] gap-10 md:grid-cols-3">
          {policies.map((p) => (
            <article key={p.id} id={p.id} className="scroll-mt-28">
              <h2 className="font-serif text-3xl">{p.title}</h2>
              <p className="mt-3 text-[15px] text-ink/70">{p.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
