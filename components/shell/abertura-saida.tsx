"use client";

import { useEffect } from "react";

/**
 * Some com a tela de abertura quando o painel já está pronto, mas só depois de ela
 * ficar 5 s na tela, para dar tempo de ver a entrada.
 */
export function AberturaSaida() {
  useEffect(() => {
    const d = document.documentElement;
    if (d.dataset.abertura !== "1") return;
    const desde = (window as Window & { __aberturaDesde?: number }).__aberturaDesde ?? performance.now();
    const espera = Math.max(0, desde + 5000 - performance.now());
    const t1 = setTimeout(() => (d.dataset.abertura = "saindo"), espera);
    const t2 = setTimeout(() => delete d.dataset.abertura, espera + 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}
