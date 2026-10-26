/**
 * Mentora de vendas presenciais da placa de avaliação (NFC + QR).
 * Tom: vizinho que tem uma ideia boa, não vendedor. Pedir licença, ser breve,
 * mostrar na mão e sempre deixar uma saída para o cliente.
 *
 * As falas aceitam marcadores, trocados pelo que a pessoa preencher na tela:
 * {estabelecimento} {segmento} {nota} {avaliacoes} {seuNome} {momento} {cidade} {vizinho} {preco}
 */

export type Tom = "leve" | "curioso" | "direto";

export type Roteiro = {
  id: string;
  titulo: string;
  tom: Tom;
  /** Quando usar, em uma linha. */
  quando: string;
  fala: string;
  /** Por que funciona (para aprender, não para falar). */
  porque: string;
};

export type Etapa = { id: string; titulo: string; resumo: string; roteiros: Roteiro[] };

export const REGRAS_DE_OURO: { titulo: string; texto: string }[] = [
  { titulo: "Peça licença", texto: "Comece perguntando se é uma boa hora. Quem tem a chance de dizer “agora não” fica mais à vontade para dizer “sim”." },
  { titulo: "30 segundos", texto: "Prometa pouco tempo e cumpra. Se a conversa esquentar, é o cliente que estica, não você." },
  { titulo: "Pergunte antes de mostrar", texto: "Uma boa pergunta vale mais que três argumentos. Deixe ele falar dos clientes dele." },
  { titulo: "Coloque na mão", texto: "A placa na mão do dono, com o celular dele, vende mais que qualquer explicação." },
  { titulo: "Sempre deixe uma porta", texto: "Nunca saia com um “não” seco. Saia com um “posso voltar mês que vem?”." },
];

export const EVITAR: { frase: string; troque: string }[] = [
  { frase: "“Vocês estão perdendo dinheiro.”", troque: "“Aposto que vocês atendem mais gente do que o Google mostra.”" },
  { frase: "“É uma promoção só hoje.”", troque: "“Pensa com calma, eu passo aqui na sexta.”" },
  { frase: "“Todo mundo já tem.”", troque: "“A {vizinho} aqui do lado começou a usar mês passado.”" },
  { frase: "Falar do preço antes de mostrar a placa funcionando.", troque: "Mostre o toque primeiro; o preço vem quando ele perguntar." },
  { frase: "Chegar no horário de pico.", troque: "Passe no começo da tarde ou depois do almoço, quando o movimento cai." },
];

/** O momento em que o cliente está mais feliz, por tipo de negócio. Vira {momento}. */
export const MOMENTOS: Record<string, string> = {
  restaurante: "na hora da conta, quando o cliente acabou de comer bem",
  hamburgueria: "na entrega do pedido, quando o lanche chega bonito",
  pizzaria: "na hora de pagar, com a pizza ainda quentinha na memória",
  barbearia: "quando o cliente se olha no espelho e gosta do corte",
  "salão de beleza": "quando a cliente vê o resultado no espelho",
  "clínica odontológica": "na recepção, na saída, quando o paciente está aliviado",
  "pet shop": "na hora de buscar o pet cheiroso e arrumado",
  academia: "no fim do treino, quando o aluno sai satisfeito",
  açaí: "no balcão, enquanto o cliente monta o copo",
  padaria: "no caixa, com o pão quente na sacola",
  estética: "no fim do atendimento, quando a cliente se sente bem",
  outro: "no momento em que o cliente sai satisfeito",
};

export const SEGMENTOS = Object.keys(MOMENTOS);

export const ETAPAS: Etapa[] = [
  {
    id: "abertura",
    titulo: "Abertura",
    resumo: "Os primeiros 10 segundos. O objetivo não é vender: é ganhar permissão para mostrar.",
    roteiros: [
      {
        id: "licenca",
        titulo: "Pedindo licença",
        tom: "leve",
        quando: "Primeira visita, você não conhece ninguém ali.",
        fala: "Oi, tudo bem? Eu sou o {seuNome}, aqui de {cidade} mesmo. Sei que vocês estão trabalhando, então vou ser rápido: posso te mostrar uma coisa de 30 segundos que tem ajudado comércios aqui da região a ganhar avaliação no Google? Se não for uma boa hora, eu volto outro dia, sem problema.",
        porque: "Pedir licença e oferecer uma saída tira a pressão. “30 segundos” é um pedido tão pequeno que é difícil recusar.",
      },
      {
        id: "dado",
        titulo: "Com o número do Google",
        tom: "direto",
        quando: "Você já olhou a ficha deles no Google antes de entrar.",
        fala: "Oi! Eu vi que a {estabelecimento} tem {avaliacoes} avaliações no Google, com nota {nota}. Pelo movimento que eu vejo aqui, aposto que vocês atendem muito mais gente do que isso mostra. Posso te mostrar como transformar esses clientes satisfeitos em avaliação, sem vocês precisarem ficar pedindo um por um?",
        porque: "Mostra que você fez a lição de casa e fala de um problema real dele, com o número dele. Ninguém resiste a ouvir sobre o próprio negócio.",
      },
      {
        id: "cliente",
        titulo: "Primeiro como cliente",
        tom: "leve",
        quando: "Lugares onde dá para consumir algo rápido (café, padaria, açaí).",
        fala: "Vou levar um café, por favor. … Aliás, posso te perguntar uma coisa? Vocês costumam pedir para os clientes avaliarem no Google? Pergunto porque eu trabalho justamente com isso e achei o atendimento de vocês muito bom.",
        porque: "Você entra como cliente, não como vendedor. O elogio sincero ao atendimento abre a conversa de forma natural.",
      },
      {
        id: "elogio",
        titulo: "Elogio que vira pergunta",
        tom: "curioso",
        quando: "O lugar é bonito, cheio ou tem algo marcante.",
        fala: "Que lugar caprichado! Eu sempre passo aqui na frente. Vi que vocês têm nota {nota} no Google, isso é muito bom. Posso te fazer uma pergunta rápida sobre isso?",
        porque: "Começa com algo positivo e verdadeiro e termina pedindo permissão. A pessoa relaxa e fica curiosa com a pergunta.",
      },
      {
        id: "pergunta",
        titulo: "Pergunta que faz pensar",
        tom: "curioso",
        quando: "O dono está disponível e parece aberto a conversar.",
        fala: "Oi, tudo bem? Uma curiosidade: quando alguém novo em {cidade} procura {segmento} no celular, como você acha que ele escolhe onde ir?",
        porque: "A resposta quase sempre é “pelas avaliações”. Quem chega à conclusão é ele, não você, e isso convence muito mais.",
      },
      {
        id: "vizinho",
        titulo: "Prova do vizinho",
        tom: "direto",
        quando: "Você já tem cliente na mesma rua ou bairro.",
        fala: "Oi! Eu acabei de instalar uma dessas aqui na {vizinho}, do lado. Em um mês eles ganharam um monte de avaliação nova. Posso te mostrar como funciona? É rapidinho.",
        porque: "Ninguém quer ficar para trás do vizinho. A prova de alguém conhecido vale mais que qualquer argumento.",
      },
      {
        id: "responsavel",
        titulo: "Achando quem decide",
        tom: "leve",
        quando: "Quem atendeu não é o dono.",
        fala: "Oi! Quem cuida da parte do Google e das redes de vocês? Queria mostrar uma ideia rápida para essa pessoa. Se ela não estiver, qual o melhor horário para eu passar?",
        porque: "Não gasta a apresentação com quem não decide e ainda descobre o melhor horário para voltar.",
      },
      {
        id: "horario",
        titulo: "Respeitando o movimento",
        tom: "leve",
        quando: "O lugar está cheio na hora que você chegou.",
        fala: "Vi que agora está corrido, não quero atrapalhar. Que horário costuma ser mais tranquilo? Queria te mostrar em 2 minutos uma ideia para aumentar as avaliações de vocês no Google.",
        porque: "Mostra respeito pelo trabalho dele. Na volta, você é “aquele que teve consideração”, e não mais um vendedor.",
      },
      {
        id: "opiniao",
        titulo: "Pedindo opinião, não venda",
        tom: "curioso",
        quando: "O dono parece desconfiado de vendedor.",
        fala: "Eu não vim te vender nada agora. Estou conversando com os comércios aqui do bairro e queria ouvir sua opinião sincera sobre uma ideia. Posso te mostrar?",
        porque: "Pedir opinião coloca o dono no papel de especialista. Ele baixa a guarda e, muitas vezes, se vende sozinho.",
      },
      {
        id: "placa-na-mao",
        titulo: "A placa na mão",
        tom: "direto",
        quando: "Depois do primeiro “pode falar”.",
        fala: "Posso te deixar segurar? Aproxima seu celular aqui… Viu? Abriu direto a página de avaliação de vocês. É isso que o cliente faz no balcão, em 5 segundos, {momento}.",
        porque: "Experimentar convence mais que ouvir. Em 5 segundos ele entende o produto sem você explicar nada.",
      },
    ],
  },
  {
    id: "perguntas",
    titulo: "Perguntas",
    resumo: "Faça o dono falar. Quem descreve o problema com a própria boca já está meio convencido.",
    roteiros: [
      {
        id: "como-pede",
        titulo: "Como pedem hoje",
        tom: "curioso",
        quando: "Logo depois da abertura.",
        fala: "Hoje, como vocês pedem para o cliente avaliar no Google? Costuma funcionar?",
        porque: "A maioria não pede, ou pede e o cliente esquece. A resposta já mostra o problema.",
      },
      {
        id: "movimento",
        titulo: "O tamanho do movimento",
        tom: "curioso",
        quando: "Para fazer a conta junto com ele depois.",
        fala: "Num dia bom, quantos clientes vocês atendem mais ou menos?",
        porque: "Com esse número você mostra a diferença entre clientes atendidos e avaliações no Google, sem precisar dizer que ele está mal.",
      },
      {
        id: "elogio-balcao",
        titulo: "O elogio que se perde",
        tom: "leve",
        quando: "Quando ele disser que o atendimento é bom.",
        fala: "E o cliente costuma elogiar aqui no balcão? Esse elogio chega no Google, ou fica só aqui?",
        porque: "Faz ele perceber que já tem o mais difícil (cliente feliz) e só falta o caminho até o Google.",
      },
      {
        id: "concorrente",
        titulo: "Quem aparece primeiro",
        tom: "direto",
        quando: "Ele é competitivo ou citou concorrentes.",
        fala: "Quando alguém procura {segmento} aqui perto, quem aparece primeiro no Google? Você sabe quantas avaliações eles têm?",
        porque: "Comparação gera vontade. Você não fala mal do concorrente, só deixa ele olhar.",
      },
      {
        id: "avaliacao-ruim",
        titulo: "A avaliação ruim",
        tom: "curioso",
        quando: "Ele reclamou de alguma avaliação injusta.",
        fala: "Tem alguma avaliação ruim que te incomoda, que fica lá em cima? Quanto mais avaliação boa entra, mais ela vai ficando para baixo.",
        porque: "Transforma uma dor real em motivo. Avaliação nova e positiva é o melhor remédio para a antiga e negativa.",
      },
      {
        id: "dobro",
        titulo: "E se dobrasse?",
        tom: "leve",
        quando: "Para ele imaginar o resultado.",
        fala: "Se vocês saíssem de {avaliacoes} para o dobro de avaliações nos próximos meses, o que você acha que mudaria aqui?",
        porque: "Quem imagina o resultado começa a querer o resultado.",
      },
    ],
  },
  {
    id: "mostrar",
    titulo: "Mostrar",
    resumo: "Demonstre, não explique. Curto, na mão, com o celular dele.",
    roteiros: [
      {
        id: "toque",
        titulo: "O toque",
        tom: "direto",
        quando: "Sempre: é o coração da venda.",
        fala: "Olha que simples: o cliente encosta o celular aqui (ou aponta a câmera no QR, se o celular for mais antigo) e já abre a página para avaliar a {estabelecimento}. Não precisa baixar nada, nem procurar vocês no Google.",
        porque: "Tira as duas desculpas do cliente final: “dá trabalho” e “não sei onde fica”.",
      },
      {
        id: "conta",
        titulo: "A conta de cabeça",
        tom: "direto",
        quando: "Depois que ele disser quantos clientes atende.",
        fala: "Se só 1 em cada 20 clientes avaliar, com o movimento que você me falou isso já dá dezenas de avaliações novas por mês. Hoje vocês têm {avaliacoes} no total.",
        porque: "Uma conta simples, com o número dele, transforma uma ideia em resultado concreto.",
      },
      {
        id: "lugar",
        titulo: "Onde fica a placa",
        tom: "leve",
        quando: "Ele já gostou e está imaginando.",
        fala: "O melhor lugar é onde o cliente está mais feliz: {momento}. No caixa, na mesa ou no balcão. Onde você colocaria aqui?",
        porque: "Pedir para ele escolher o lugar faz ele se imaginar já usando. É um “sim” antes do sim.",
      },
      {
        id: "destino",
        titulo: "A placa que muda de destino",
        tom: "curioso",
        quando: "Ele perguntou se dá para usar para outra coisa.",
        fala: "E o link é meu, eu consigo trocar sem mexer na placa: hoje vai para a avaliação, numa promoção pode ir para o Instagram, o cardápio ou o WhatsApp de vocês.",
        porque: "Aumenta o valor percebido sem aumentar o preço. A placa vira uma ferramenta, não um enfeite.",
      },
    ],
  },
  {
    id: "objecoes",
    titulo: "Objeções",
    resumo: "Concorde primeiro, depois responda. Objeção é dúvida, não é “não”.",
    roteiros: [
      {
        id: "caro",
        titulo: "“Tá caro”",
        tom: "leve",
        quando: "Ele achou o preço alto.",
        fala: "Entendo. Pensa assim: se ela trouxer uma avaliação nova por semana, em um mês ela já se pagou só de cliente novo que escolheu vocês pelo Google. E é uma vez só, não é mensalidade.",
        porque: "Troca “preço” por “retorno”. Comparar com o valor de um cliente novo faz o preço parecer pequeno.",
      },
      {
        id: "pensar",
        titulo: "“Vou pensar”",
        tom: "leve",
        quando: "Ele não disse não, mas não decidiu.",
        fala: "Claro, pensa com calma. Só para eu entender: ficou alguma dúvida sobre como funciona, ou é mais a questão do valor? Se quiser, eu passo aqui na sexta para a gente ver.",
        porque: "Respeita o tempo dele e, com uma pergunta leve, descobre a objeção real. Já deixa o retorno combinado.",
      },
      {
        id: "boca-a-boca",
        titulo: "“Eu já peço no boca a boca”",
        tom: "curioso",
        quando: "Ele diz que já pede para avaliar.",
        fala: "Que ótimo, isso já é meio caminho! E quantos você acha que avaliam de verdade depois que vão embora? A placa é para quem quer avaliar conseguir na hora, antes de esquecer.",
        porque: "Valoriza o que ele já faz e mostra a lacuna: a intenção do cliente some quando ele sai pela porta.",
      },
      {
        id: "nao-usa",
        titulo: "“Cliente não vai usar”",
        tom: "direto",
        quando: "Ele duvida que o cliente encoste o celular.",
        fala: "É por isso que tem o QR também: quem não sabe encostar, aponta a câmera. E quando o atendente fala “se gostou, encosta aqui”, a maioria faz. Quer testar uma semana no balcão e ver?",
        porque: "Responde com o detalhe do produto e oferece prova prática, sem discutir.",
      },
      {
        id: "medo-ruim",
        titulo: "“E se avaliarem mal?”",
        tom: "leve",
        quando: "Ele tem medo de avaliação negativa.",
        fala: "Quem tem a placa ganha avaliação de quem está satisfeito, porque é na hora boa que o cliente encosta. E muita avaliação boa deixa a nota mais estável: uma ruim pesa bem menos.",
        porque: "Acolhe o medo e mostra que a placa protege a nota em vez de arriscar.",
      },
      {
        id: "ja-tem-qr",
        titulo: "“Já tenho QR code”",
        tom: "curioso",
        quando: "Ele mostra um QR impresso.",
        fala: "Legal! Para onde o seu leva? Esse aqui vai direto para a tela de escrever a avaliação, e com o toque do celular é mais rápido ainda. E eu consigo trocar o destino sem imprimir outro.",
        porque: "Não desmerece o que ele tem. Mostra a diferença prática: menos passos e link que muda.",
      },
      {
        id: "socio",
        titulo: "“Preciso falar com meu sócio”",
        tom: "leve",
        quando: "A decisão não é só dele.",
        fala: "Faz todo sentido. Posso deixar uma placa de demonstração com você para mostrar para ele? Ou, se preferir, passo aqui num horário em que vocês dois estejam.",
        porque: "Ajuda ele a vender por dentro e mantém você na conversa.",
      },
      {
        id: "sem-tempo",
        titulo: "“Agora não tenho tempo”",
        tom: "leve",
        quando: "Ele está realmente ocupado.",
        fala: "Sem problema nenhum. Te deixo meu contato e passo outro dia. Qual horário é melhor para você, começo da tarde?",
        porque: "Sair rápido e educado é o que faz ele te receber bem na próxima.",
      },
    ],
  },
  {
    id: "fechar",
    titulo: "Fechar",
    resumo: "Feche com uma pergunta fácil de responder, nunca com pressão.",
    roteiros: [
      {
        id: "duas-opcoes",
        titulo: "Duas opções",
        tom: "direto",
        quando: "Ele demonstrou interesse.",
        fala: "Você prefere uma no caixa, ou uma no caixa e outra nas mesas?",
        porque: "A pergunta já parte do sim. Escolher entre duas opções é mais fácil que decidir do zero.",
      },
      {
        id: "teste",
        titulo: "Teste sem risco",
        tom: "leve",
        quando: "Ele gostou, mas está inseguro.",
        fala: "Que tal assim: eu deixo instalada, vocês usam essa semana, e na sexta eu passo aqui. Se vier avaliação nova, a gente fecha. Combinado?",
        porque: "Tira o risco das costas dele. Depois de ver avaliação chegando, o sim é natural.",
      },
      {
        id: "resumo",
        titulo: "Resumo e próximo passo",
        tom: "direto",
        quando: "A conversa foi longa e ele concordou com tudo.",
        fala: "Então, resumindo: placa no balcão, levando direto para a avaliação da {estabelecimento}, e eu acompanho com você quantas avaliações chegam. Posso já gravar a sua?",
        porque: "Organiza o que foi combinado e pede o próximo passo concreto.",
      },
      {
        id: "medir",
        titulo: "Prometer o acompanhamento",
        tom: "leve",
        quando: "Para dar segurança na decisão.",
        fala: "E eu volto em 30 dias para te mostrar quantas avaliações chegaram desde a placa. Hoje vocês estão com {avaliacoes}, vamos ver esse número subir.",
        porque: "O painel mede o crescimento das avaliações. Prometer mostrar o resultado passa confiança e abre espaço para vender mais placas.",
      },
    ],
  },
  {
    id: "depois",
    titulo: "Depois",
    resumo: "A venda não termina na entrega: é aí que nasce a indicação.",
    roteiros: [
      {
        id: "instalou",
        titulo: "Na entrega",
        tom: "leve",
        quando: "Ao instalar a placa.",
        fala: "Pronto! Uma dica que faz toda a diferença: quando o cliente elogiar, fala “que bom! Se puder, encosta o celular aqui e deixa isso no Google”. Essa frase dobra o resultado.",
        porque: "Ensina o time do cliente a usar. Placa usada vira resultado, e resultado vira indicação.",
      },
      {
        id: "indicacao",
        titulo: "Pedindo indicação",
        tom: "leve",
        quando: "Na volta de 30 dias, com resultado bom.",
        fala: "Fico feliz que funcionou! Você conhece outro comércio aqui perto que ia gostar disso? Pode ser um amigo, um vizinho…",
        porque: "Cliente satisfeito indica com gosto quando alguém pede. É o jeito mais barato de conseguir a próxima venda.",
      },
      {
        id: "nao",
        titulo: "Quando disseram não",
        tom: "leve",
        quando: "Ele recusou, educadamente.",
        fala: "Tudo bem, obrigado pelo seu tempo! Posso voltar daqui a uns meses para te mostrar os resultados de quem está usando aqui no bairro?",
        porque: "Sai com a porta aberta. Muita venda acontece na segunda ou terceira visita.",
      },
    ],
  },
];

export type Valores = {
  estabelecimento: string;
  segmento: string;
  nota: string;
  avaliacoes: string;
  seuNome: string;
  cidade: string;
  vizinho: string;
  preco: string;
};

export const ROTULOS: Record<keyof Valores | "momento", string> = {
  estabelecimento: "nome do lugar",
  segmento: "tipo de negócio",
  nota: "nota",
  avaliacoes: "nº de avaliações",
  seuNome: "seu nome",
  cidade: "cidade",
  vizinho: "cliente vizinho",
  preco: "preço",
  momento: "momento feliz do cliente",
};

export type Pedaco = { texto: string; marcador?: keyof typeof ROTULOS; preenchido?: boolean };

/** Divide a fala em pedaços: texto fixo e marcadores (preenchidos ou não). */
export function montarFala(fala: string, v: Partial<Valores>): Pedaco[] {
  const out: Pedaco[] = [];
  const re = /\{(\w+)\}/g;
  let ultimo = 0;
  for (const m of fala.matchAll(re)) {
    if (m.index! > ultimo) out.push({ texto: fala.slice(ultimo, m.index) });
    const k = m[1] as keyof typeof ROTULOS;
    let valor = "";
    if (k === "momento") valor = MOMENTOS[v.segmento?.trim().toLowerCase() ?? ""] ?? MOMENTOS.outro;
    else valor = (v[k as keyof Valores] ?? "").trim();
    out.push(valor ? { texto: valor, marcador: k, preenchido: true } : { texto: `[${ROTULOS[k] ?? k}]`, marcador: k, preenchido: false });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < fala.length) out.push({ texto: fala.slice(ultimo) });
  return out;
}

export const falaPronta = (fala: string, v: Partial<Valores>) =>
  montarFala(fala, v)
    .map((p) => p.texto)
    .join("");

/** Para ouvir: campo vazio vira uma expressão natural em vez de sumir da frase. */
const FALADO_PADRAO: Record<keyof typeof ROTULOS, string> = {
  estabelecimento: "seu negócio",
  segmento: "comércio",
  nota: "boa",
  avaliacoes: "poucas",
  seuNome: "seu parceiro aqui",
  cidade: "nossa cidade",
  vizinho: "vizinho aqui do lado",
  preco: "tantos",
  momento: "na hora em que o cliente sai satisfeito",
};

export const falaParaOuvir = (fala: string, v: Partial<Valores>) =>
  montarFala(fala, v)
    .map((p) => (p.marcador && !p.preenchido ? FALADO_PADRAO[p.marcador] : p.texto))
    .join("")
    .replace(/R\$ tantos/g, "tantos reais");
