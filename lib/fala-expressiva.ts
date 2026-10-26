/**
 * Fala com sentimento para a voz do aparelho (speechSynthesis), que por padrão
 * lê tudo no mesmo tom. Aqui a fala vira trechos, e cada trecho ganha ritmo,
 * altura e pausa conforme o que ele é: saudação animada, pergunta que sobe no
 * final, exclamação com energia, reticências com respiro. O tom do roteiro
 * (leve, curioso, direto) muda a base.
 */
import type { Tom } from "./mentora";

export type Trecho = { texto: string; rate: number; pitch: number; pausaMs: number };

const BASE: Record<Tom, { rate: number; pitch: number }> = {
  leve: { rate: 0.98, pitch: 1.06 },
  curioso: { rate: 0.95, pitch: 1.1 },
  direto: { rate: 1.04, pitch: 1.0 },
};

const SAUDACAO = /^(oi|ol[aá]|bom dia|boa tarde|boa noite|fala|e a[ií]|opa|rapaz|nossa|pronto|fechou|fechado|perfeito|certo)\b/i;
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Limpa o que não se fala: aspas, marcadores vazios ([preço]) e espaços repetidos. */
export function limparFala(t: string): string {
  return t
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function prosodia(texto: string, tom: Tom = "leve"): Trecho[] {
  const base = BASE[tom];
  // Corta depois de . ! ? … e também em ":" (explicação que vem depois respira).
  const partes = limparFala(texto).match(/[^.!?…:]+(?:[.!?…:]+|$)/g) ?? [];
  return partes
    .map((p) => p.trim())
    .filter((p) => p.replace(/[.!?…:\s]/g, "").length > 0)
    .map((p, i) => {
      let rate = base.rate;
      let pitch = base.pitch;
      let pausaMs = 260;
      const fim = p.slice(-1);
      if (fim === "?") {
        pitch += 0.12; // pergunta sobe
        rate -= 0.04; // e vem um pouco mais devagar, para a pessoa pensar
        pausaMs = 520;
      } else if (fim === "!") {
        pitch += 0.08;
        rate += 0.05;
        pausaMs = 320;
      } else if (fim === "…" || p.endsWith("...")) {
        rate -= 0.06;
        pausaMs = 620;
      } else if (fim === ":") {
        pausaMs = 380;
      }
      if (i === 0 && SAUDACAO.test(p)) {
        pitch += 0.08; // cumprimento sorrindo
        rate += 0.03;
      }
      // Frase curta de reação ("Viu?", "Pronto.") sai mais rápida.
      if (p.length < 14) rate += 0.04;
      return {
        texto: p.replace(/…|\.\.\./g, ",").replace(/:$/, ","),
        rate: Math.round(limitar(rate, 0.8, 1.2) * 100) / 100,
        pitch: Math.round(limitar(pitch, 0.8, 1.4) * 100) / 100,
        pausaMs,
      };
    });
}

/** Dá nota às vozes do aparelho: as "naturais" (Edge, Google) soam bem mais humanas. */
export function notaVoz(v: { name: string; lang: string; localService: boolean }): number {
  const lang = v.lang.toLowerCase().replace("_", "-");
  if (!lang.startsWith("pt")) return -1;
  let n = lang === "pt-br" ? 10 : 2;
  if (/natural|neural|online|enhanced|premium|aprimorad/i.test(v.name)) n += 6;
  if (/google/i.test(v.name)) n += 4;
  if (/francisca|antonio|thalita|luciana|felipe|daniel|camila|vitória|vitoria/i.test(v.name)) n += 2;
  if (!v.localService) n += 1;
  return n;
}
