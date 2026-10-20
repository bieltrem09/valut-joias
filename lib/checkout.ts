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

export function orderMessage(cart: CartItem[]) {
  const lines = cartLines(cart).map(
    ({ item, product }) => `• ${item.qty}× ${product.name} (${variantLabels[item.variant]}) — ${formatPrice(product.price * item.qty)}`,
  );
  return [`Olá, ${site.shortName}! Quero finalizar este pedido:`, '', ...lines, '', `Subtotal: ${formatPrice(cartSubtotal(cart))}`].join('\n');
}

export function startCheckout(cart: CartItem[]) {
  return whatsappLink(orderMessage(cart));
}
