/**
 * Matiz (oklch hue) por categoria de empresa. Alimenta o placeholder de
 * iniciais quando não há foto. Luminosidade/croma vêm dos tokens --cat-*.
 */
const HUES: Record<string, number> = {
  Barbearia: 40,
  "Clínica odontológica": 200,
  Pizzaria: 30,
  "Pet shop": 140,
  "Estúdio de pilates": 300,
  Cafeteria: 60,
  Padaria: 75,
  "Salão de beleza": 350,
  Academia: 250,
  Restaurante: 20,
  Ótica: 230,
  Hamburgueria: 45,
  "Restaurante japonês": 10,
  Sorveteria: 330,
  Esmalteria: 0,
  "Clínica veterinária": 165,
  "Estúdio de tatuagem": 280,
  Floricultura: 130,
};

export const CATEGORIAS = Object.keys(HUES);

export function categoriaHue(categoria: string): number {
  if (categoria in HUES) return HUES[categoria];
  let h = 0;
  for (const c of categoria) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
