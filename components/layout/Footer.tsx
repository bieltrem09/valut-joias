'use client';

import { FormEvent, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { site } from '@/data/site';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { useShop } from '@/lib/store';
import { IconArrow, IconInstagram } from '@/components/ui/Icons';
import { LogoSymbol } from '@/components/ui/Logo';
import { TransitionLink } from '@/components/ui/TransitionLink';

const payments = ['Pix', 'Visa', 'Master', 'Elo', 'Boleto']; // [CONFIRMAR] formas de pagamento

/**
 * Rodapé fixo por baixo do conteúdo (desktop): a página desliza e revela o
 * rodapé como uma cortina; o "VALUT" gigante sobe letra a letra em scrub.
 */
export function Footer() {
  const wrap = useRef<HTMLDivElement>(null);
  const setRingGuideOpen = useShop((s) => s.setRingGuideOpen);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        gsap.fromTo(
          '.footer-letter',
          { yPercent: 100 },
          {
            yPercent: 0,
            ease: 'none',
            stagger: 0.08,
            scrollTrigger: { trigger: wrap.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
          },
        );
        gsap.fromTo('.footer-inner', { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: wrap.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: wrap },
  );

  return (
    <div ref={wrap} className="relative lg:h-[100svh] lg:min-h-[720px] lg:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]">
      <footer className="bg-ink text-ivory lg:fixed lg:inset-x-0 lg:bottom-0 lg:h-[100svh] lg:min-h-[720px]">
        <div className="footer-inner mx-auto flex h-full max-w-[1600px] flex-col px-5 pt-16 md:px-8 lg:pt-24">
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.6fr]">
            <div className="col-span-2 lg:col-span-1">
              <LogoSymbol className="h-14 w-14 text-gold" aria-hidden />
              <p className="mt-6 max-w-[16rem] font-serif text-2xl leading-snug">
                Semijoia que <span className="serif-italic text-gold">encanta.</span>
              </p>
            </div>
            <FooterCol title="Loja">
              <FLink href="/colecao">Todas as peças</FLink>
              <FLink href="/colecao?filtro=novidade">Novidades</FLink>
              <FLink href="/colecao?colecao=rubi-mood">Rubi Mood</FLink>
              <FLink href="/favoritos">Favoritos</FLink>
            </FooterCol>
            <FooterCol title="Ajuda">
              <li>
                <button type="button" onClick={() => setRingGuideOpen(true)} className="link-draw text-left">
                  Guia de tamanho de anel
                </button>
              </li>
              <FLink href="/contato#trocas">Trocas e devoluções</FLink>
              <FLink href="/contato#envio">Envio</FLink>
              <FLink href="/contato">Fale com a gente</FLink>
            </FooterCol>
            <FooterCol title="Institucional">
              <FLink href="/sobre">Sobre a VALUT</FLink>
              <FLink href="/atacado">Atacado & Revenda</FLink>
              <li>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-draw inline-flex items-center gap-2">
                  <IconInstagram width={16} height={16} /> {site.instagram.handle}
                </a>
              </li>
              <li>
                <a href={site.salesLink} target="_blank" rel="noopener noreferrer" className="link-draw">
                  linktr.ee/valutvendas
                </a>
              </li>
            </FooterCol>
            <Newsletter />
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/15 pt-6 text-xs text-ivory/60 lg:mt-auto">
            <p className="text-gold">✦ {site.shipping}</p>
            <ul className="flex flex-wrap gap-2" aria-label="Formas de pagamento (a confirmar)">
              {payments.map((p) => (
                <li key={p} className="rounded-md border border-ivory/20 px-2.5 py-1 text-[11px] tracking-wide text-ivory/70">
                  {p}
                </li>
              ))}
            </ul>
            <p>
              {site.store.street} · CNPJ {site.cnpj}
            </p>
          </div>
          {site.demoData && <p className="mt-2 text-[11px] text-ivory/40">Nomes de produtos e preços ilustrativos — [CONFIRMAR] com a VALUT.</p>}

          <div aria-hidden className="mt-6 flex justify-between overflow-hidden pb-2 font-display text-[23vw] leading-[0.78] text-ivory select-none lg:text-[min(25vw,46svh)]">
            {['V', 'Λ', 'L', 'U', 'T'].map((l, i) => (
              <span key={i} className="footer-letter inline-block">
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="eyebrow text-gold">{title}</h2>
      <ul className="mt-5 space-y-3 text-[15px] text-ivory/85">{children}</ul>
    </div>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <TransitionLink href={href} className="link-draw">
        {children}
      </TransitionLink>
    </li>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    // [CONFIRMAR] integrar com a ferramenta de e-mail marketing (ex.: RD Station, Mailchimp, Klaviyo).
    setSent(true);
  };
  const lifted = focused || email.length > 0;
  return (
    <div className="col-span-2 lg:col-span-1">
      <h2 className="eyebrow text-gold">Newsletter</h2>
      <p className="mt-5 font-serif text-xl leading-snug">Novidades, lançamentos e coisas que nós achamos chique — direto no seu e-mail.</p>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.p key="ok" className="mt-6 font-serif text-2xl italic text-gold" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            Obrigada! Você está na lista. ✦
          </motion.p>
        ) : (
          <motion.form key="form" onSubmit={submit} className="relative mt-6" exit={{ opacity: 0, y: -12 }}>
            <label htmlFor="newsletter" className={`pointer-events-none absolute left-0 transition-all duration-500 ease-[var(--ease-expo)] ${lifted ? '-top-4 text-[11px] text-gold' : 'top-3 text-[15px] text-ivory/60'}`}>
              Seu e-mail
            </label>
            <input
              id="newsletter"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="h-12 w-full bg-transparent pr-12 text-[15px] text-ivory outline-none"
              autoComplete="email"
            />
            <span aria-hidden className="absolute bottom-0 left-0 h-px w-full bg-ivory/30" />
            <span aria-hidden className={`absolute bottom-0 left-0 h-px w-full origin-left bg-gold transition-transform duration-700 ease-[var(--ease-expo)] ${lifted ? 'scale-x-100' : 'scale-x-0'}`} />
            <button type="submit" aria-label="Assinar newsletter" className="absolute top-1 right-0 grid h-10 w-10 place-items-center rounded-full text-gold transition-transform duration-500 hover:translate-x-1">
              <IconArrow />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
