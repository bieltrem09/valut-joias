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
  family: 'Empresa familiar desde 2018',
  instagram: { handle: '@valut.semijoias', url: 'https://www.instagram.com/valut.semijoias/', followers: '54 mil+' },
  salesLink: 'https://linktr.ee/valutvendas',
  url: 'https://valutsemijoias.com.br', // [CONFIRMAR] domínio definitivo
  store: {
    venue: 'Shopping Villa Real',
    unit: 'Loja 2',
    street: 'Av. Mal. Artur da Costa e Silva, 1380 · Lj 2',
    district: 'Jardim Glória',
    city: 'Limeira',
    state: 'SP',
    zip: '13487-230',
    hours: ['Seg a Sex · 09h às 18h', 'Sábado · 09h às 14h', 'Domingo · Fechado'],
    /** Horários no formato schema.org (dados estruturados para o Google). */
    openingHours: ['Mo-Fr 09:00-18:00', 'Sa 09:00-14:00'],
    /** Texto usado para localizar a loja no Google Maps / Waze (ficha "Valut Semi Jóias"). */
    mapsQuery: 'Valut Semi Jóias, Av. Mal. Artur da Costa e Silva, 1380 - Lj 2 - Jardim Gloria, Limeira - SP, 13487-230',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Valut+Semi+J%C3%B3ias%2C+Av.+Mal.+Artur+da+Costa+e+Silva%2C+1380+-+Lj+2%2C+Limeira+-+SP',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Valut+Semi+J%C3%B3ias%2C+Av.+Mal.+Artur+da+Costa+e+Silva%2C+1380+-+Lj+2%2C+Limeira+-+SP',
    wazeUrl: 'https://waze.com/ul?q=Av.%20Mal.%20Artur%20da%20Costa%20e%20Silva%2C%201380%2C%20Limeira%20-%20SP&navigate=yes',
  },

  whatsapp: {
    number: '5519993661551',
    label: '(19) 99366-1551',
  },
  /** Fundação e perfil da empresa. */
  since: 2018,
  warrantyYears: 1,
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

/** Texto institucional enviado pela VALUT. */
export const about = {
  intro:
    'Desde 2018, a VALUT é uma empresa familiar que nasceu com o propósito de impulsionar empreendedores no mercado das semijoias. Acreditamos que vender vai além de oferecer produtos: entregamos confiança, estilo e uma experiência única.',
  trends:
    'Por isso, acompanhamos de perto as principais tendências da moda para desenvolver coleções exclusivas, atemporais e altamente desejadas, que proporcionam maior giro de estoque e excelentes oportunidades de lucratividade para nossos parceiros.',
  pillars: [
    { title: 'Curadoria exclusiva', text: 'Peças que traduzem elegância em cada detalhe — coleções atemporais e desejadas.' },
    { title: 'Garantia de 1 ano', text: 'Qualidade comprovada em todas as peças.' },
    { title: 'Suporte ao revendedor', text: 'Acompanhamento completo para você vender mais.' },
    { title: 'Envio rápido', text: 'Enviamos para todo o Brasil.' },
  ],
};

export const phrases = {
  elegance: 'Um tom que exala elegância',
  chic: 'Coisas que nós achamos chique',
  rubi: 'Rubi Mood',
  ringTip: 'Dica rápida para nunca mais errar o tamanho do anel',
};
