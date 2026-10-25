"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Esfera de energia (referência do cliente): anéis lilás ondulando em volta
 * de um núcleo escuro, com brilho e partículas. Desenhada em canvas.
 * `energia` (0–1) acelera e agita a esfera (ex.: enquanto busca leads).
 * Pausa fora da tela; com movimento reduzido, desenha um quadro só.
 */
export function Orb({ size = 160, energia = 0.25, className, label }: { size?: number; energia?: number; className?: string; label?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const alvo = React.useRef(energia);
  alvo.current = energia;

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = size / 2;
    const R = size * 0.34;
    const particulas = Array.from({ length: 26 }, (_, i) => ({
      a: (i / 26) * Math.PI * 2 + Math.random(),
      d: R * (1.08 + Math.random() * 0.35),
      v: 0.15 + Math.random() * 0.25,
      s: 0.5 + Math.random() * 1.1,
      f: Math.random() * Math.PI * 2,
    }));

    let e = alvo.current;
    let t = Math.random() * 100;
    let raf = 0;
    let visivel = true;
    let ultimo = performance.now();

    const desenhar = (dt: number) => {
      e += (alvo.current - e) * Math.min(1, dt * 3);
      t += dt * (0.6 + e * 2.2);
      ctx.clearRect(0, 0, size, size);

      // Halo externo
      const halo = ctx.createRadialGradient(c, c, R * 0.6, c, c, R * 1.6);
      halo.addColorStop(0, `rgba(124, 77, 255, ${0.18 + e * 0.18})`);
      halo.addColorStop(1, "rgba(124, 77, 255, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Núcleo escuro com reflexo
      const nucleo = ctx.createRadialGradient(c - R * 0.25, c - R * 0.3, R * 0.1, c, c, R);
      nucleo.addColorStop(0, "rgba(60, 40, 140, 0.85)");
      nucleo.addColorStop(0.7, "rgba(18, 12, 52, 0.95)");
      nucleo.addColorStop(1, "rgba(30, 18, 80, 0.9)");
      ctx.fillStyle = nucleo;
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fill();

      // Anéis ondulando (o "plasma" da borda)
      ctx.globalCompositeOperation = "lighter";
      const amp = R * (0.035 + e * 0.07);
      for (let j = 0; j < 5; j++) {
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const th = (i / 160) * Math.PI * 2;
          const r =
            R +
            amp * (Math.sin(3 * th + t * 1.1 + j * 1.3) * 0.6 + Math.sin(5 * th - t * 0.8 + j * 2.1) * 0.35 + Math.sin(9 * th + t * 1.7 + j) * 0.15) -
            j * 1.2;
          const x = c + Math.cos(th) * r;
          const y = c + Math.sin(th) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = j === 0 ? `rgba(230, 200, 255, ${0.55 + e * 0.3})` : `rgba(170, 120, 255, ${0.22 - j * 0.03})`;
        ctx.lineWidth = j === 0 ? 2 : 1.2;
        ctx.shadowColor = "rgba(170, 110, 255, 0.9)";
        ctx.shadowBlur = 14 + e * 10;
        ctx.stroke();
      }

      // Arcos de luz que giram
      for (let k = 0; k < 3; k++) {
        const ini = t * (0.5 + k * 0.2) + k * 2.1;
        ctx.beginPath();
        ctx.arc(c, c, R - 2 - k * 3, ini, ini + 0.6 + e * 0.6);
        ctx.strokeStyle = `rgba(245, 225, 255, ${0.5 + e * 0.4})`;
        ctx.lineWidth = 2.5 - k * 0.6;
        ctx.shadowBlur = 18;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Partículas
      for (const p of particulas) {
        p.a += p.v * dt * (0.5 + e);
        const x = c + Math.cos(p.a) * p.d;
        const y = c + Math.sin(p.a) * p.d * 0.92;
        const brilho = 0.35 + 0.35 * Math.sin(t * 2 + p.f);
        ctx.fillStyle = `rgba(220, 200, 255, ${brilho})`;
        ctx.beginPath();
        ctx.arc(x, y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (agora: number) => {
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      if (visivel) desenhar(dt);
      raf = requestAnimationFrame(loop);
    };

    if (reduce) desenhar(0.016);
    else raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([en]) => (visivel = en.isIntersecting));
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
