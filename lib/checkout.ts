import { getProduct, variantLabels } from '@/data/products';
import { site, whatsappLink } from '@/data/site';
import { formatPrice } from './format';
import type { CartItem } from './store';

/**
 * Camada de checkout isolada. Hoje (MVP) gera a mensagem do pedido para o
 * WhatsApp. Para plugar um gateway (Mercado Pago, Pagar.me, Nuvemshop…),
 * implemente `startCheckout` chamando a API e mantenha a mesma assinatura.
 */
export function cartLines(cart: CartItem[]) {
  return cart
    .map((i) => ({ item: i, product: getProduct(i.slug) }))
    .filter((l): l is { item: CartItem; product: NonNullable<ReturnType<typeof getProduct>> } => Boolean(l.product));
}

export function cartSubtotal(cart: CartItem[]) {
  return cartLines(cart).reduce((sum, { item, product }) => sum + product.price * item.qty, 0);
}

const RULE = '━━━━━━━━━━━━━━━━';

/**
 * Mensagem do pedido para o WhatsApp, usando a formatação do próprio app
 * (*negrito*, _itálico_, ~riscado~): itens numerados, resumo de valores e um
 * pequeno roteiro de dados para a VALUT finalizar o atendimento.
 */
export function orderMessage(cart: CartItem[], intro = 'Montei minha sacola no site e gostaria de finalizar o pedido.') {
  const lines = cartLines(cart);
  const pieces = lines.reduce((n, { item }) => n + item.qty, 0);
  const subtotal = cartSubtotal(cart);
  const savings = lines.reduce((s, { item, product }) => s + (product.compareAt ? (product.compareAt - product.price) * item.qty : 0), 0);
  const freeShipping = subtotal >= site.freeShippingThreshold;

  const items = lines.flatMap(({ item, product }, i) => {
    const total = product.price * item.qty;
    const was = product.compareAt ? `  ~${formatPrice(product.compareAt * item.qty)}~` : '';
    return [
      `*${i + 1}. ${product.name}*`,
      `   Banho: ${variantLabels[item.variant]}`,
      `   Quantidade: ${item.qty} × ${formatPrice(product.price)}`,
      `   Valor: *${formatPrice(total)}*${was}`,
      '',
    ];
  });

  return [
    `Olá, ${site.shortName}! ✨`,
    intro,
    '',
    '🛍️ *RESUMO DO PEDIDO*',
    RULE,
    '',
    ...items,
    RULE,
    `Peças: ${pieces}`,
    ...(savings > 0 ? [`Subtotal: ${formatPrice(subtotal + savings)}`, `Descontos: − ${formatPrice(savings)}`] : []),
    `Frete: ${freeShipping ? 'Grátis ✅' : 'A combinar'}`,
    `*TOTAL: ${formatPrice(subtotal)}*`,
    RULE,
    '',
    '📦 *DADOS PARA ENTREGA*',
    'Nome:',
    'CEP:',
    'Endereço e número:',
    'Entrega ou retirada na loja:',
    'Forma de pagamento:',
    '',
    'Aguardo a confirmação. Obrigado(a)! 💛',
  ].join('\n');
}

export function startCheckout(cart: CartItem[]) {
  return whatsappLink(orderMessage(cart));
}
