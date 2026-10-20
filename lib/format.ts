const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = (value: number) => brl.format(value);
export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
