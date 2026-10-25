"use client";

import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { categoriaHue } from "@/lib/categorias";
import { initials } from "@/lib/format";

/**
 * A imagem pode falhar antes da hidratação (onError some nesse caso).
 * Conferimos o estado real dela ao montar.
 */
export function useImageFallback(src: string | null) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  return { ref, failed, onError: () => setFailed(true) };
}

/**
 * Foto da empresa ou, sem foto (ou se ela falhar), iniciais sobre a cor da categoria.
 * Nunca uma imagem genérica.
 */
export function CompanyAvatar({
  nome,
  categoria,
  src,
  className,
  rounded = "rounded-[8px]",
}: {
  nome: string;
  categoria: string;
  src: string | null;
  className?: string;
  rounded?: string;
}) {
  const { ref, failed, onError } = useImageFallback(src);
  const hue = categoriaHue(categoria);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={onError}
        className={cn("size-7 shrink-0 bg-muted object-cover", rounded, className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("cat-swatch grid size-7 shrink-0 place-items-center font-mono text-[10px] font-medium tracking-tight", rounded, className)}
      style={{ "--hue": hue } as React.CSSProperties}
    >
      {initials(nome)}
    </span>
  );
}

export function PersonAvatar({ nome, src, className }: { nome: string; src: string | null; className?: string }) {
  const { ref, failed, onError } = useImageFallback(src);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={ref} src={src} alt="" loading="lazy" onError={onError} className={cn("size-8 shrink-0 rounded-full bg-muted object-cover", className)} />
    );
  }
  return (
    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-muted text-11 font-semibold text-subtle-foreground", className)}>
      {initials(nome)}
    </span>
  );
}
