'use client';

import { phrases } from '@/data/site';
import { useShop } from '@/lib/store';

export function RingGuideButton() {
  const open = useShop((s) => s.setRingGuideOpen);
  return (
    <button type="button" onClick={() => open(true)} className="link-draw mt-3 text-left font-serif text-xl">
      {phrases.ringTip} →
    </button>
  );
}
