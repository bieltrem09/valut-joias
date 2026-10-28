/**
 * Nichos da Prospecção, agrupados. Os "destaques" são os que mais compram a placa:
 * atendimento no balcão, cliente que sai satisfeito na hora e concorrência no Google.
 */
export const NICHOS_DESTAQUE = [
  "restaurante",
  "hamburgueria",
  "pizzaria",
  "sorveteria",
  "açaí",
  "barbearia",
  "salão de beleza",
  "estética automotiva",
  "autopeças",
  "lava-rápido",
  "pet shop",
  "clínica odontológica",
];

export const GRUPOS_NICHOS: { titulo: string; nichos: string[] }[] = [
  {
    titulo: "Comida e bebida",
    nichos: [
      "restaurante",
      "hamburgueria",
      "pizzaria",
      "sorveteria",
      "açaí",
      "cafeteria",
      "padaria",
      "doceria",
      "lanchonete",
      "churrascaria",
      "restaurante por quilo",
      "japonês",
      "pastelaria",
      "esfiharia",
      "hot dog",
      "bar",
      "adega",
    ],
  },
  {
    titulo: "Beleza e bem-estar",
    nichos: ["barbearia", "salão de beleza", "estética", "esmalteria", "sobrancelha", "depilação", "spa e massagem", "estúdio de tatuagem"],
  },
  {
    titulo: "Automotivo",
    nichos: ["estética automotiva", "autopeças", "lava-rápido", "oficina", "borracharia", "funilaria", "auto elétrica", "moto peças"],
  },
  {
    titulo: "Saúde",
    nichos: ["clínica odontológica", "clínica", "fisioterapia e pilates", "nutricionista", "psicologia", "laboratório", "ótica", "farmácia"],
  },
  { titulo: "Pets", nichos: ["pet shop", "banho e tosa", "veterinária"] },
  {
    titulo: "Lojas",
    nichos: [
      "loja de roupas",
      "calçados",
      "joias e semijoias",
      "presentes",
      "celulares e assistência",
      "informática",
      "material de construção",
      "móveis",
      "papelaria",
      "cosméticos",
      "floricultura",
      "loja infantil",
      "suplementos",
      "mercado",
      "açougue",
    ],
  },
  {
    titulo: "Serviços",
    nichos: [
      "academia",
      "autoescola",
      "escola de idiomas",
      "imobiliária",
      "lavanderia",
      "chaveiro",
      "gráfica",
      "estúdio de fotografia",
      "buffet e eventos",
      "hotel e pousada",
    ],
  },
];

export const TOTAL_NICHOS = new Set(GRUPOS_NICHOS.flatMap((g) => g.nichos)).size;
