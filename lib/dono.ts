/**
 * Quem usa este painel. Vem das variáveis de ambiente para que cada cópia
 * (a sua, a de um amigo) mostre o próprio dono: OWNER_NAME e OWNER_EMAIL.
 */
export function dono() {
  return {
    nome: process.env.OWNER_NAME?.trim() || null,
    email: process.env.OWNER_EMAIL?.trim() || null,
  };
}
