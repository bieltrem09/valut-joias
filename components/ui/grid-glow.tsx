import { cn } from "@/lib/utils";

/**
 * Grade fina com brilho radial, com escopo (absolute) — nunca fixa na página.
 * Grade de 18px, alfa máximo de 12%, máscara radial que some nas bordas.
 * Usada só em dois lugares: hero de lucro (dark) e estados vazios.
 */
export function GridGlow({ color = "var(--primary)", className, intensity = 0.12 }: { color?: string; className?: string; intensity?: number }) {
  const alpha = Math.min(intensity, 0.12) * 100;
  const line = `color-mix(in oklch, ${color} ${alpha}%, transparent)`;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: "18px 18px",
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%)",
      }}
    />
  );
}
