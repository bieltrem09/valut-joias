import Image from "next/image";
import { media } from "@/content/media";

type Props = {
  slot: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Usa a proporção do slot para reservar espaço (evita CLS). Desligue quando o pai define a altura. */
  keepRatio?: boolean;
  rounded?: boolean;
  imgClassName?: string;
  /** Esconde a etiqueta do placeholder (quando há texto por cima). */
  hideLabel?: boolean;
};

/**
 * Foto real (next/image → AVIF/WebP, srcset) ou placeholder na proporção exata do slot.
 */
export function Media({ slot, className = "", sizes = "100vw", priority, keepRatio = true, rounded = true, imgClassName = "", hideLabel = false }: Props) {
  const s = media[slot];
  if (!s) throw new Error(`Slot de imagem desconhecido: ${slot}`);
  const style = keepRatio ? { aspectRatio: String(s.ratio) } : undefined;
  const radius = rounded ? "rounded-[var(--radius-photo)]" : "";

  if (s.src) {
    return (
      <div className={`relative overflow-hidden grain ${radius} ${className}`} style={style}>
        <Image
          src={s.src}
          alt={s.alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          className={`object-cover ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={`ph ${radius} ${className}`} style={style} role="img" aria-label={`${s.alt} (foto em produção)`}>
      {!hideLabel && (
        <span className="label absolute bottom-4 left-4 text-gray-300/70">
        <span className="text-red-bright">■</span> FOTO · {s.label}
        </span>
      )}
    </div>
  );
}
