'use client';

import { useRef } from 'react';
import { reviewsSource, testimonials } from '@/data/testimonials';
import { site } from '@/data/site';
import { MediaKey } from '@/data/media.generated';
import { gsap, useGSAP } from '@/lib/gsap';
import { mq } from '@/lib/animations';
import { Media } from '@/components/ui/Media';
import { IconInstagram } from '@/components/ui/Icons';
import { RevealText } from '@/components/ui/Reveal';

const posts: { k: MediaKey; alt: string }[] = [
  { k: 'editorial-colar-dourado', alt: 'Post: colar dourado articulado' },
  { k: 'conjunto-rubi-expositor', alt: 'Post: conjunto rubi — um tom que exala elegância' },
  { k: 'bolsa-clutch-rosa', alt: 'Post: clutch rosa plissada' },
  { k: 'editorial-perfil-brinco', alt: 'Post: brinco franja' },
  { k: 'loja-conjunto-coral', alt: 'Post: conjunto coral' },
  { k: 'detalhe-brinco-gota', alt: 'Post: brinco gota cravejado' },
];

/** Feedbacks (carrossel infinito, pausável) + grade de posts do Instagram. */
export function Feedbacks() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(mq.motion, () => {
        const tween = gsap.to(track.current, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
        const pause = () => tween.timeScale(0.0001);
        const play = () => gsap.to(tween, { timeScale: 1, duration: 0.6 });
        const el = track.current!;
        el.addEventListener('pointerenter', pause);
        el.addEventListener('pointerleave', play);
        el.addEventListener('focusin', pause);
        el.addEventListener('focusout', play);
        gsap.from('.ig-post', { y: 60, autoAlpha: 0, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ig-grid', start: 'top 85%', once: true } });
        return () => {
          el.removeEventListener('pointerenter', pause);
          el.removeEventListener('pointerleave', play);
          el.removeEventListener('focusin', pause);
          el.removeEventListener('focusout', play);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // poucas avaliações: repete a lista para o carrossel infinito preencher a largura
  const loop = [...testimonials, ...testimonials, ...testimonials];
  const cards = (hidden: boolean) =>
    loop.map((t, i) => (
      <figure
        key={`${hidden}-${i}`}
        aria-hidden={hidden || i >= testimonials.length || undefined}
        className="flex w-[82vw] shrink-0 flex-col justify-between rounded-[var(--radius-card)] bg-marble p-8 sm:w-[460px]"
      >
        <span aria-hidden className="font-serif text-6xl leading-none text-gold">“</span>
        <blockquote className="mt-2 font-serif text-[clamp(1.25rem,2vw,1.6rem)] leading-snug">{t.text}</blockquote>
        <figcaption className="mt-6 flex items-center gap-3 text-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-serif text-ivory">{t.name[0]}</span>
          <span>
            <span className="block font-medium text-ink">{t.name}</span>
            <span className="text-xs text-ink/55">{t.detail} · Google</span>
          </span>
        </figcaption>
      </figure>
    ));

  return (
    <section ref={root} aria-labelledby="fb-title" className="relative overflow-hidden bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8">
        <p className="eyebrow text-gold-deep">Feedbacks</p>
        <RevealText as="h2" id="fb-title" className="mt-3 font-serif text-[length:var(--text-title)] leading-[0.95]">
          Quem usa, <span className="serif-italic">conta</span>
        </RevealText>
        <a href={reviewsSource.url} target="_blank" rel="noopener noreferrer" className="link-draw mt-4 inline-block text-sm text-ink/70">
          {reviewsSource.label} ↗
        </a>
      </div>

      <div className="mt-12 overflow-hidden" role="region" aria-label="Depoimentos de clientes">
        <div ref={track} className="flex w-max gap-5 px-5">
          {cards(false)}
          {cards(true)}
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-[1600px] px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="font-serif text-3xl md:text-5xl">
            No Instagram <span className="serif-italic text-gold-deep">{site.instagram.handle}</span>
          </h3>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-draw text-sm font-medium">
            Seguir no Instagram ↗
          </a>
        </div>
        <ul className="ig-grid mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {posts.map((p) => (
            <li key={p.k} className="ig-post">
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-[18px]" aria-label={`${p.alt} — abrir Instagram`}>
                <Media k={p.k} alt={p.alt} fill sizes="(min-width:1024px) 16vw, 50vw" className="object-cover transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-ink/0 text-ivory opacity-0 transition-all duration-500 group-hover:bg-ink/40 group-hover:opacity-100 group-focus-visible:bg-ink/40 group-focus-visible:opacity-100">
                  <IconInstagram width={30} height={30} className="scale-75 transition-transform duration-500 group-hover:scale-100" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
