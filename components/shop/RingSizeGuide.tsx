'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { phrases } from '@/data/site';
import { getLenis } from '@/lib/lenis';
import { useShop } from '@/lib/store';
import { IconClose } from '@/components/ui/Icons';

// [CONFIRMAR] tabela de aros usada pela VALUT. Referência: aro brasileiro ≈ circunferência (mm) − 40.
const table = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((aro) => ({ aro, mm: aro + 40, diam: ((aro + 40) / Math.PI).toFixed(1) }));

const steps = [
  'Corte uma tira fina de papel (ou use um barbante).',
  'Enrole na base do dedo, sem apertar — o anel precisa passar pela junta.',
  'Marque onde a ponta encontra a tira e meça em milímetros com uma régua.',
  'Encontre a medida na tabela ao lado. Ficou entre dois? Escolha o maior.',
];

/** Modal "Guia de tamanho de anel", aproveitando o conteúdo "Dica rápida…" das redes. */
export function RingSizeGuide() {
  const open = useShop((s) => s.ringGuideOpen);
  const setOpen = useShop((s) => s.setRingGuideOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const lenis = getLenis();
    if (!open) {
      lenis?.start();
      return;
    }
    lenis?.stop();
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[86] grid place-items-center p-4">
          <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ring-title"
            data-lenis-prevent
            className="relative max-h-[90svh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-ivory p-6 text-ink md:p-10"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Fechar guia de tamanho">
              <IconClose />
            </button>
            <p className="eyebrow text-gold-deep">Guia de tamanho de anel</p>
            <h2 id="ring-title" className="mt-2 max-w-lg font-serif text-3xl leading-tight md:text-4xl">
              {phrases.ringTip}<span className="serif-italic">.</span>
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <ol className="space-y-4">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold text-sm text-gold-deep">{i + 1}</span>
                    <span className="pt-1 text-[15px]">{s}</span>
                  </li>
                ))}
              </ol>
              <table className="w-full text-sm">
                <caption className="sr-only">Tabela de medidas de anel</caption>
                <thead>
                  <tr className="border-b border-ink/20 text-left">
                    <th className="py-2 font-medium">Aro</th>
                    <th className="py-2 font-medium">Circunferência</th>
                    <th className="py-2 font-medium">Diâmetro</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r) => (
                    <tr key={r.aro} className="border-b border-ink/10">
                      <td className="py-1.5">{r.aro}</td>
                      <td className="py-1.5">{r.mm} mm</td>
                      <td className="py-1.5">{r.diam} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-xs text-ink/50">[CONFIRMAR] Tabela de referência — confirme com a VALUT antes de publicar.</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
