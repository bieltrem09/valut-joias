/**
 * Dados da marca. Fatos confirmados vêm do Instagram @valut.semijoias.
 * Tudo marcado com [CONFIRMAR] é placeholder — substitua antes de publicar.
 */
export const site = {
  name: 'VALUT Semijoias',
  shortName: 'VALUT',
  slogan: 'Semijoia que encanta.',
  model: 'Atacado & Varejo',
  shipping: 'Enviamos para todo o Brasil',
  instagram: { handle: '@valut.semijoias', url: 'https://www.instagram.com/valut.semijoias/', followers: '54 mil+' },
  salesLink: 'https://linktr.ee/valutvendas',
  url: 'https://valutsemijoias.com.br', // [CONFIRMAR] domínio definitivo
  store: {
    street: 'Av. Mal. Arthur da Costa e Silva, 1380',
    district: '[CONFIRMAR BAIRRO]',
    city: '[CONFIRMAR CIDADE]',
    state: '[CONFIRMAR UF]',
    hours: ['Seg a Sex · [CONFIRMAR HORÁRIO]', 'Sábado · [CONFIRMAR HORÁRIO]'],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Mal.+Arthur+da+Costa+e+Silva,+1380', // [CONFIRMAR] link exato
  },
  whatsapp: {
    number: '', // [CONFIRMAR NÚMERO] formato internacional, ex.: 5599999999999
    label: '[CONFIRMAR NÚMERO]',
  },
  cnpj: '[CONFIRMAR CNPJ]',
  /** Valor para frete grátis (placeholder). */
  freeShippingThreshold: 299, // [CONFIRMAR VALOR]
  /** Mostra o aviso "preços e nomes ilustrativos" enquanto os dados não forem reais. */
  demoData: true,
};

export const whatsappLink = (message: string) =>
  site.whatsapp.number
    ? `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`
    : site.salesLink; // enquanto o número não é confirmado, usa o link de vendas oficial

export const phrases = {
  elegance: 'Um tom que exala elegância',
  chic: 'Coisas que nós achamos chique',
  rubi: 'Rubi Mood',
  ringTip: 'Dica rápida para nunca mais errar o tamanho do anel',
};
