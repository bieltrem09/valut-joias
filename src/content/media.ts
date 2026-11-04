/**
 * Slots de imagem do site.
 *
 * Para trocar um placeholder por uma foto real:
 * 1. coloque o arquivo em public/photos/ (ex.: public/photos/hero-bg.jpg — de preferência ≥ 2048px de largura);
 * 2. preencha `src` do slot abaixo com "/photos/hero-bg.jpg".
 * O next/image gera AVIF/WebP e os tamanhos responsivos sozinho.
 *
 * Os prompts para gerar/fotografar cada slot estão em IMAGE_PROMPTS.md.
 */
export type Slot = {
  src?: string;
  alt: string;
  /** largura / altura */
  ratio: number;
  label: string;
};

const r = (w: number, h: number) => w / h;

export const media: Record<string, Slot> = {
  "hero-bg": { ratio: r(16, 9), label: "hero-bg · 16:9", alt: "Salão da Zero Um CT à noite, com fileiras de racks e luz vermelha no teto" },
  "hero-athlete-f": { ratio: r(4, 5), label: "hero-athlete-f · recorte 4:5", alt: "Aluna no fundo de um agachamento livre com barra" },
  "hero-athlete-m": { ratio: r(4, 5), label: "hero-athlete-m · recorte 4:5", alt: "Aluno executando levantamento terra" },
  "estrutura-drone": { ratio: r(21, 9), label: "estrutura-drone · 21:9", alt: "Vista aérea do prédio da Zero Um CT em Americana ao entardecer" },
  "estrutura-peso-livre": { ratio: r(3, 4), label: "peso-livre · 3:4", alt: "Rack de halteres da área de peso livre" },
  "estrutura-maquinas": { ratio: r(4, 5), label: "maquinas · 4:5", alt: "Fileira de máquinas de musculação" },
  "estrutura-cardio": { ratio: r(1, 1), label: "cardio · 1:1", alt: "Esteiras da área de cardio" },
  "estrutura-recovery": { ratio: r(4, 5), label: "recovery · 4:5", alt: "Sala Recovery da Zero Um CT" },
  "estrutura-gelo": { ratio: r(1, 1), label: "gelo · 1:1", alt: "Máquina de gelo da academia" },
  "estrutura-vestiario": { ratio: r(3, 4), label: "vestiario · 3:4", alt: "Vestiário da academia" },
  "estrutura-recepcao": { ratio: r(4, 5), label: "recepcao · 4:5", alt: "Recepção da Zero Um CT" },
  "estrutura-estacionamento": { ratio: r(1, 1), label: "estacionamento · 1:1", alt: "Estacionamento da academia" },
  "prof-01": { ratio: r(3, 4), label: "prof-01 · 3:4", alt: "Retrato de professor(a) da Zero Um CT" },
  "prof-02": { ratio: r(3, 4), label: "prof-02 · 3:4", alt: "Retrato de professor(a) da Zero Um CT" },
  "prof-03": { ratio: r(3, 4), label: "prof-03 · 3:4", alt: "Retrato de professor(a) da Zero Um CT" },
  "prof-04": { ratio: r(3, 4), label: "prof-04 · 3:4", alt: "Retrato de professor(a) da Zero Um CT" },
  resultados: { ratio: r(16, 9), label: "resultados · 16:9", alt: "Aluna fazendo levantamento terra sumô com esforço máximo" },
  madrugada: { ratio: r(16, 9), label: "madrugada · 16:9", alt: "Aluno treinando sozinho de madrugada sob uma única luz" },
  cta: { ratio: r(16, 9), label: "cta · 16:9", alt: "Alunas e alunos se cumprimentando depois do treino" },
  footer: { ratio: r(21, 9), label: "footer · 21:9", alt: "Salão da academia ao amanhecer, com poucas pessoas treinando" },
  "evento-halloween": { ratio: r(4, 5), label: "evento · halloween", alt: "Arte do evento Nightmare Halloween da Zero Um CT" },
  "evento-sorteio": { ratio: r(4, 5), label: "evento · sorteio", alt: "Arte do sorteio da Zero Um CT" },
  "evento-inauguracao": { ratio: r(4, 5), label: "evento · inauguração", alt: "Inauguração da Zero Um CT" },
  antes: { ratio: r(4, 5), label: "antes · 4:5", alt: "Foto de antes de aluno(a) — com autorização" },
  depois: { ratio: r(4, 5), label: "depois · 4:5", alt: "Foto de depois de aluno(a) — com autorização" },
};
