"use client";

import { useEffect } from "react";

/** Some com a tela de abertura quando o painel já está pronto (mínimo de 1,4 s na tela). */
export function AberturaSaida() {
  useEffect(() => {
    const d = document.documentElement;
    if (d.dataset.abertura !== "1") return;
    const espera = Math.max(0, 1400 - performance.now());
    const t1 = setTimeout(() => (d.dataset.abertura = "saindo"), espera);
    const t2 = setTimeout(() => delete d.dataset.abertura, espera + 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}
