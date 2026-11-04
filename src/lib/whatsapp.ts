import { zeroum } from "@/content/zeroum";

/** Link wa.me com mensagem pré-preenchida. */
export function waLink(msg?: string) {
  return msg ? `${zeroum.whatsappLink}?text=${encodeURIComponent(msg)}` : zeroum.whatsappLink;
}

export const WA_GERAL = waLink("Olá, Zero Um! Vim pelo site e quero saber mais.");
export const WA_AULA = waLink("Olá, Zero Um! Quero agendar uma aula experimental.");
export const WA_PLANOS = waLink("Olá, Zero Um! Quero saber os valores dos planos.");
