"use client";
import { useRef, useState } from "react";
import { Media } from "./Media";

/**
 * Slider antes/depois. clip-path na foto de cima (emil: comparison slider, sem DOM extra).
 * O handle segue o ponteiro em tempo real (sem easing). Teclado: setas movem 5%, Home/End.
 * Base: <input type="range"> nativo → acessível por padrão (WCAG 2.5.7 sem arrasto obrigatório).
 */
export function BeforeAfter({ antes, depois, label }: { antes: string; depois: string; label: string }) {
  const [v, setV] = useState(50);
  const box = useRef<HTMLDivElement>(null);

  const fromPointer = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setV(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  };

  return (
    <div
      ref={box}
      className="relative touch-pan-y select-none overflow-hidden rounded-[var(--radius-photo)]"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        fromPointer(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientX)}
    >
      <Media slot={depois} rounded={false} sizes="(min-width:1024px) 40vw, 90vw" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - v}% 0 0)` }}>
        <Media slot={antes} rounded={false} keepRatio={false} className="h-full w-full" sizes="(min-width:1024px) 40vw, 90vw" />
      </div>
      <span className="pill absolute left-3 top-3 bg-black/80 text-white">Antes</span>
      <span className="pill absolute right-3 top-3 bg-red text-white">Depois</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${v}%` }} aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white font-mono text-xs text-black">
          ⟷
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        aria-label={`Comparar antes e depois: ${label}`}
        aria-valuetext={`${v}% antes`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
