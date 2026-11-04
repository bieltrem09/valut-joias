/**
 * ZERO UM CT AMERICANA — fonte única de verdade do site.
 *
 * Tudo o que aparece no site sai daqui. Para editar um texto, preço, horário
 * ou professor, mude este arquivo; não é preciso mexer nos componentes.
 *
 * Regra: nada aqui é inventado. O que ainda não foi confirmado pelo dono
 * está marcado com `todo` ou fica vazio, e o site mostra um aviso
 * "A CONFIRMAR" no lugar (ou esconde o bloco, quando indicado).
 */

export type Todo = { todo: string };
export const isTodo = (v: unknown): v is Todo =>
  typeof v === "object" && v !== null && "todo" in v;

/* ------------------------------------------------------------------ */
/* Dados oficiais (Instagram, Google e WhatsApp Business)              */
/* ------------------------------------------------------------------ */

export const zeroum = {
  nome: "Zero Um CT Americana",
  nomeCurto: "Zero Um CT",
  tipo: "Academia especializada em musculação",
  pilares: ["Estrutura", "Performance", "Experiência"] as const, // bio do Instagram
  area: "2.500 m²", // post oficial "Estrutura 2.500 m²"
  areaNumero: 2500,
  funcionamento: "24 horas", // Google e Instagram
  whatsapp: "+55 19 99620-9541",
  whatsappLink: "https://wa.me/5519996209541",
  telefone: "+5519996209541",
  instagram: "@zeroumct.americana",
  instagramLink: "https://instagram.com/zeroumct.americana",
  comunidade: "10,7 mil seguidores", // atualizar quando publicar
  agregadores: [
    { nome: "Wellhub", plano: "Silver", obs: "antigo Gympass" },
    { nome: "TotalPass", plano: "TP2", obs: "" },
  ],
  diferenciais: ["Sala Recovery", "Máquina de gelo", "Funcionamento 24h", "2.500 m² de estrutura"],

  endereco: {
    // ⚠️ Divergência: Google diz nº 200 / Vila N. Sra. de Fátima; Instagram diz nº 220 / Campo Limpo.
    confirmado: false,
    texto: { todo: "Confirmar número (200 ou 220) e bairro" } as Todo | string,
    rua: "Rua Orlando dei Santi",
    cidade: "Americana",
    uf: "SP",
    cep: "13477-000",
    googleLinha: "Rua Orlando dei Santi, 200 · Vila Nossa Senhora de Fátima",
    instagramLinha: "Rua Orlando de Santi, 220 · Campo Limpo",
  },
  mapa: "https://maps.app.goo.gl/Kqcj3cBea41V7nj17",
  referenciaLocal: "Perto da Rodoviária de Americana", // confirmar
  descricao:
    "Academia especializada em musculação, com estrutura completa, equipamentos de qualidade e acompanhamento profissional. Para ganhar massa muscular, emagrecer ou melhorar a qualidade de vida, com segurança e dedicação.",
  slogan: "A maior academia de Americana", // destaque oficial "Estrutura" — confirmar uso
  sloganConfirmado: false,
  site: "https://zeroumct.com.br", // TODO: domínio definitivo

  // ---- PREENCHER (não inventar) ----
  estacionamento: { todo: "Confirmar se há estacionamento e se é gratuito" } as Todo | string,
  avaliacaoFisica: { todo: "Dias e horários da avaliação física" } as Todo | string,
  domingosFeriados: { todo: "Confirmar se abre 24h também aos domingos e feriados" } as Todo | string,
  seguranca: { todo: "Fatos sobre segurança de madrugada: câmeras, controle de acesso, equipe" } as Todo | string,
};

/* ------------------------------------------------------------------ */
/* Navegação                                                           */
/* ------------------------------------------------------------------ */

export const navLinks = [
  { href: "/estrutura", label: "Estrutura" },
  { href: "/planos", label: "Planos" },
  { href: "/horarios", label: "Horários" },
  { href: "/professores", label: "Professores" },
  { href: "/resultados", label: "Resultados" },
  { href: "/contato", label: "Contato" },
] as const;

/* ------------------------------------------------------------------ */
/* Manifesto / pilares                                                 */
/* ------------------------------------------------------------------ */

export const pilares = [
  {
    nome: "Estrutura",
    dado: "2.500 m²",
    frase: "Peso livre, máquinas, cardio e Sala Recovery debaixo do mesmo teto.",
  },
  {
    nome: "Performance",
    dado: "24h",
    frase: "Treino no seu horário. Madrugada, antes do trabalho ou depois da faculdade: a porta está aberta.",
  },
  {
    nome: "Experiência",
    dado: "Recovery",
    frase: "Depois do treino, recuperação: Sala Recovery e máquina de gelo para o dia seguinte render.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Estrutura — ambiente por ambiente                                   */
/* ------------------------------------------------------------------ */

export type Ambiente = {
  id: string;
  nome: string;
  resumo: string;
  detalhe: string;
  foto: string; // slot de imagem (ver src/content/media.ts)
  confirmado: boolean; // false = só aparece depois que o dono confirmar
};

export const ambientes: Ambiente[] = [
  {
    id: "peso-livre",
    nome: "Peso livre",
    resumo: "Halteres, barras e anilhas para treino pesado.",
    detalhe: "Área dedicada a halteres, barras e racks. TODO: listar faixa de pesos e número de racks.",
    foto: "estrutura-peso-livre",
    confirmado: true,
  },
  {
    id: "maquinas",
    nome: "Máquinas de musculação",
    resumo: "Linha completa de máquinas para cada grupo muscular.",
    detalhe: "Máquinas articuladas e de cabo. TODO: marcas e quantidade de equipamentos.",
    foto: "estrutura-maquinas",
    confirmado: true,
  },
  {
    id: "cardio",
    nome: "Área de cardio",
    resumo: "Esteiras e bikes para aquecer ou fechar o treino.",
    detalhe: "TODO: confirmar equipamentos de cardio (esteiras, bikes, escada, remo).",
    foto: "estrutura-cardio",
    confirmado: true,
  },
  {
    id: "recovery",
    nome: "Sala Recovery",
    resumo: "Espaço para recuperar depois do treino.",
    detalhe: "Destaque oficial do Instagram. TODO: descrever o que tem na sala (banheira de gelo, rolos, pistolas de massagem…).",
    foto: "estrutura-recovery",
    confirmado: true,
  },
  {
    id: "gelo",
    nome: "Máquina de gelo",
    resumo: "Gelo à disposição para recuperação.",
    detalhe: "Destaque oficial do Instagram. TODO: como o aluno usa (banheira, compressa…).",
    foto: "estrutura-gelo",
    confirmado: true,
  },
  {
    id: "vestiarios",
    nome: "Vestiários",
    resumo: "Vestiários feminino e masculino.",
    detalhe: "TODO: confirmar chuveiros, armários e se há fechadura/cadeado.",
    foto: "estrutura-vestiario",
    confirmado: true,
  },
  {
    id: "recepcao",
    nome: "Recepção",
    resumo: "Atendimento para matrícula e dúvidas.",
    detalhe: "TODO: horário de atendimento da recepção (a academia é 24h, a recepção pode não ser).",
    foto: "estrutura-recepcao",
    confirmado: true,
  },
  {
    id: "estacionamento",
    nome: "Estacionamento",
    resumo: "Para chegar de carro.",
    detalhe: "TODO: confirmar se existe.",
    foto: "estrutura-estacionamento",
    confirmado: false,
  },
];

/* ------------------------------------------------------------------ */
/* Horários                                                            */
/* ------------------------------------------------------------------ */

export const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const diasLongos = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;

export const turnos = [
  { id: "madrugada", nome: "Madrugada", inicio: 0, fim: 6 },
  { id: "manha", nome: "Manhã", inicio: 6, fim: 12 },
  { id: "tarde", nome: "Tarde", inicio: 12, fim: 18 },
  { id: "noite", nome: "Noite", inicio: 18, fim: 24 },
] as const;

export type TurnoId = (typeof turnos)[number]["id"];

/**
 * Professor no salão por dia e turno. Formato: grade[dia][turno] = "Nome".
 * Vazio = ainda não informado (aparece "A confirmar").
 */
export const gradeProfessores: Partial<Record<(typeof dias)[number], Partial<Record<TurnoId, string>>>> = {
  // Exemplo de preenchimento:
  // Seg: { manha: "Nome", tarde: "Nome", noite: "Nome" },
};

/**
 * Mapa de calor "melhor horário pra treinar vazio".
 * 0 (vazio) a 4 (cheio), por dia e por hora (0–23). Fica oculto enquanto vazio.
 */
export const movimento: Partial<Record<(typeof dias)[number], number[]>> = {};

/* ------------------------------------------------------------------ */
/* Planos                                                              */
/* ------------------------------------------------------------------ */

export type Periodo = "mensal" | "semestral" | "anual";

export type Plano = {
  id: string;
  nome: string;
  destaque?: boolean;
  /** Preço por mês em reais, por período. null = não informado. */
  precos: Record<Periodo, number | null>;
  inclui: string[];
};

/** TODO: copiar do destaque "Planos" do Instagram. Enquanto null, o site mostra "Consultar valor". */
export const planos: Plano[] = [
  {
    id: "plano-1",
    nome: "Plano A — a confirmar",
    precos: { mensal: null, semestral: null, anual: null },
    inclui: ["Acesso 24h à musculação", "TODO: o que mais inclui"],
  },
  {
    id: "plano-2",
    nome: "Plano B — a confirmar",
    destaque: true,
    precos: { mensal: null, semestral: null, anual: null },
    inclui: ["Acesso 24h à musculação", "Sala Recovery", "TODO: o que mais inclui"],
  },
  {
    id: "plano-3",
    nome: "Plano C — a confirmar",
    precos: { mensal: null, semestral: null, anual: null },
    inclui: ["Acesso 24h à musculação", "TODO: o que mais inclui"],
  },
];

export const faqPagamento = [
  { q: "Quais formas de pagamento vocês aceitam?", a: { todo: "Pix, cartão, boleto, recorrência?" } as Todo | string },
  { q: "Tem taxa de matrícula?", a: { todo: "Valor da matrícula, se houver" } as Todo | string },
  { q: "Posso cancelar quando quiser?", a: { todo: "Regras de cancelamento e fidelidade" } as Todo | string },
  {
    q: "Uso Wellhub ou TotalPass. Preciso pagar plano?",
    a: "Não. A Zero Um aceita Wellhub (plano Silver) e TotalPass (plano TP2). É só fazer o check-in pelo app.",
  },
];

/* ------------------------------------------------------------------ */
/* Professores                                                         */
/* ------------------------------------------------------------------ */

export type Professor = {
  id: string;
  nome: string;
  especialidade: string;
  cref: string;
  turno: string;
  foto: string;
  pendente?: boolean;
};

/** TODO: nome, foto, especialidade, CREF e turno reais. Enquanto pendente, o card mostra "A confirmar". */
export const professores: Professor[] = [1, 2, 3, 4].map((n) => ({
  id: `prof-0${n}`,
  nome: `Professor(a) ${n}`,
  especialidade: ["Hipertrofia", "Emagrecimento", "Iniciantes", "Mobilidade"][n - 1],
  cref: "CREF a confirmar",
  turno: "Turno a confirmar",
  foto: `prof-0${n}`,
  pendente: true,
}));

/* ------------------------------------------------------------------ */
/* Resultados, depoimentos, eventos                                    */
/* ------------------------------------------------------------------ */

/** Só com autorização por escrito do aluno. */
export type Transformacao = { id: string; nome: string; dado: string; antes: string; depois: string };
export const transformacoes: Transformacao[] = [];

export type Conquista = { id: string; titulo: string; detalhe: string; data: string };
export const conquistas: Conquista[] = [];

/** Só avaliações reais do Google (nome + texto + nota). */
export type Depoimento = { id: string; nome: string; desde?: string; texto: string; nota: 1 | 2 | 3 | 4 | 5 };
export const depoimentos: Depoimento[] = [];

/** Nota agregada do Google — só preencher com o dado real. */
export const avaliacaoGoogle: { nota: number; total: number } | null = null;

export type Evento = { id: string; titulo: string; data: string; resumo: string; link: string; foto: string };
export const eventos: Evento[] = [
  {
    id: "halloween-2026",
    titulo: "Nightmare Halloween",
    data: "31 OUT 2026",
    resumo: "Treino temático no sábado de Halloween.",
    link: "https://instagram.com/zeroumct.americana",
    foto: "evento-halloween",
  },
  {
    id: "estrutura",
    titulo: "Estrutura 2.500 m²",
    data: "TODO: data",
    resumo: "Imagens aéreas do prédio e do salão.",
    link: "https://instagram.com/zeroumct.americana",
    foto: "estrutura-drone",
  },
  {
    id: "sorteio",
    titulo: "Sorteio Zero Um",
    data: "TODO: data",
    resumo: "Sorteio para a comunidade da academia.",
    link: "https://instagram.com/zeroumct.americana",
    foto: "evento-sorteio",
  },
  {
    id: "inauguracao",
    titulo: "Inauguração",
    data: "TODO: data",
    resumo: "A abertura da Zero Um em Americana.",
    link: "https://instagram.com/zeroumct.americana",
    foto: "evento-inauguracao",
  },
];

/* ------------------------------------------------------------------ */
/* FAQ geral                                                           */
/* ------------------------------------------------------------------ */

export const faq: { q: string; a: string | Todo }[] = [
  {
    q: "Funciona mesmo 24 horas, todo dia?",
    a: "Sim, a Zero Um funciona 24 horas. Domingos e feriados: veja a confirmação na página de horários.",
  },
  { q: "Tem professor de madrugada?", a: { todo: "Confirmar se há professor no salão na madrugada" } },
  {
    q: "Aceita Wellhub e TotalPass?",
    a: "Sim. Aceitamos Wellhub (Gympass) no plano Silver e TotalPass no plano TP2.",
  },
  {
    q: "Nunca treinei. Por onde começo?",
    a: "Agende uma aula experimental. Você conhece a estrutura, conversa com um professor e sai com um treino montado para o seu objetivo.",
  },
  { q: "Tem estacionamento?", a: { todo: "Confirmar estacionamento" } },
  { q: "É seguro treinar de madrugada?", a: { todo: "Responder só com fatos: câmeras, controle de acesso, equipe" } },
];

/* ------------------------------------------------------------------ */
/* Formulário de aula experimental                                     */
/* ------------------------------------------------------------------ */

export const objetivos = ["Hipertrofia", "Emagrecimento", "Saúde", "Começando agora"] as const;
export const turnosPreferidos = ["Manhã", "Tarde", "Noite", "Madrugada"] as const;
