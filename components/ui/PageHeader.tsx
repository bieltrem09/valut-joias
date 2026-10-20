import { ReactNode } from 'react';
import { RevealText } from './Reveal';

/** Cabeçalho editorial das páginas internas. */
export function PageHeader({ eyebrow, title, titleKey, children, aside }: { eyebrow: string; title: ReactNode; titleKey?: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[1600px] px-5 pt-36 pb-10 md:px-8 lg:pt-44">
      <p className="eyebrow text-gold-deep">{eyebrow}</p>
      <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <RevealText key={titleKey} as="h1" immediate className="font-serif text-[clamp(3.2rem,9vw,9rem)] leading-[0.88] tracking-[-0.01em]">
          {title}
        </RevealText>
        {aside}
      </div>
      {children}
    </header>
  );
}
