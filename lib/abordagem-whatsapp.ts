/**
 * Venda à distância pelo WhatsApp: mensagem curta pedindo licença, áudio de 30 s,
 * vídeo mostrando a placa funcionando e só então preço e visita marcada.
 * Mesmos marcadores das falas da Mentora ({estabelecimento}, {seuNome}, {preco}…).
 */
import type { Roteiro } from "./mentora";

export type Envio = "texto" | "audio" | "video";

export type PassoWhats = Roteiro & {
  /** Como sai: mensagem escrita, áudio gravado por você ou vídeo gravado por você. */
  envio: Envio;
};

export const PASSOS_WHATS: PassoWhats[] = [
  {
    id: "zap-primeira",
    envio: "texto",
    titulo: "1. Primeira mensagem",
    tom: "leve",
    quando: "Primeiro contato. Mande entre 9h30 e 11h ou entre 14h e 16h, fora do horário de pico.",
    fala: "Oi, tudo bem? Aqui é o {seuNome}, de {cidade}. Vi o {estabelecimento} no Google, com {avaliacoes} avaliações, e tive uma ideia simples pra vocês ganharem mais avaliação sem precisar ficar pedindo pra cada cliente. Posso te mandar um áudio rapidinho de 30 segundos explicando?",
    porque: "Curta, com o nome do lugar (mostra que não é mensagem em massa) e termina pedindo licença para o áudio. Quem diz “pode” já aceitou ouvir.",
  },
  {
    id: "zap-audio",
    envio: "audio",
    titulo: "2. Áudio de 30 segundos",
    tom: "curioso",
    quando: "Assim que ele responder “pode” ou qualquer coisa positiva. Grave você mesmo, com calma e sorrindo.",
    fala: "Oi, obrigado por responder! Então, rapidinho: eu vi que o {estabelecimento} tem {avaliacoes} avaliações no Google. Pelo movimento de vocês, aposto que muita gente sai satisfeita e não avalia, porque no dia a dia ninguém lembra de pedir, né? Eu trabalho com uma plaquinha que fica no balcão: o cliente encosta o celular ou aponta a câmera e já abre direto a página pra dar as cinco estrelas, sem procurar nada. Vou te mandar um vídeo curtinho mostrando ela funcionando, aí você vê na prática.",
    porque: "Voz cria confiança que texto não cria. Mostra o problema (ninguém lembra de pedir) antes do produto e já prepara o vídeo.",
  },
  {
    id: "zap-video",
    envio: "video",
    titulo: "3. Vídeo mostrando na prática",
    tom: "leve",
    quando: "Logo depois do áudio. Mande o vídeo e esta mensagem junto.",
    fala: "Olha ela funcionando: o cliente só encosta o celular e já abre a avaliação do Google. Se o celular não tiver NFC, o QR code abre igual. Fica no caixa pedindo avaliação por vocês o dia inteiro.",
    porque: "O vídeo faz o papel da placa na mão. A mensagem resume em uma frase o que ele acabou de ver.",
  },
  {
    id: "zap-pergunta",
    envio: "texto",
    titulo: "4. Pergunta depois do vídeo",
    tom: "curioso",
    quando: "Alguns minutos depois do vídeo, ou quando ele visualizar.",
    fala: "Conseguiu ver? Pra vocês faria diferença o cliente que sai satisfeito {momento} conseguir avaliar em cinco segundos?",
    porque: "Pergunta de necessidade: o “faria diferença” sai da boca dele. A partir daí você está atendendo um pedido, não vendendo.",
  },
  {
    id: "zap-preco",
    envio: "texto",
    titulo: "5. Preço e visita marcada",
    tom: "direto",
    quando: "Quando ele mostrar interesse ou perguntar o valor.",
    fala: "Ela sai R$ {preco}, pagamento único, sem mensalidade. Eu levo aí, deixo configurada com o link do {estabelecimento} e testo com você no seu celular. Qual dia fica melhor pra eu passar: amanhã ou quinta?",
    porque: "Você só vai até o lugar quando a venda já está quase feita. Duas opções de dia em vez de “quer ou não quer”.",
  },
  {
    id: "zap-quanto",
    envio: "texto",
    titulo: "Se ele pedir “manda o preço”",
    tom: "direto",
    quando: "Ele pula tudo e pergunta só o valor.",
    fala: "Claro! É R$ {preco}, uma vez só, sem mensalidade. Se ela trouxer um cliente novo por mês pelo Google, já se pagou. Quer que eu te mande um vídeo de 30 segundos mostrando ela funcionando?",
    porque: "Responde direto (não enrolar gera desconfiança), compara o preço com o retorno e puxa de volta para a prova.",
  },
  {
    id: "zap-seguimento",
    envio: "texto",
    titulo: "6. Retomada (2 dias sem resposta)",
    tom: "leve",
    quando: "Ele visualizou e não respondeu. Espere dois dias.",
    fala: "Oi! Passando só pra saber se você conseguiu ver o vídeo da plaquinha. Se agora não for o momento, sem problema, é só me avisar que eu não incomodo.",
    porque: "Dá uma saída fácil. Quem pode dizer “agora não” sem constrangimento muitas vezes responde “manda mais detalhes”.",
  },
  {
    id: "zap-ultima",
    envio: "texto",
    titulo: "7. Última mensagem",
    tom: "leve",
    quando: "Uma semana depois, se continuar sem resposta. Depois disso, pare.",
    fala: "Vou deixar você tranquilo e não mando mais mensagem. Se um dia quiser mais avaliações no Google pro {estabelecimento}, é só me chamar aqui. Sucesso pra vocês!",
    porque: "Sair com educação deixa a porta aberta e evita ser bloqueado ou denunciado como spam.",
  },
];

/** Roteiro do vídeo de demonstração: gravado uma vez, serve para todos. */
export const CENAS_VIDEO: Roteiro[] = [
  {
    id: "video-gancho",
    titulo: "Cena 1 · Gancho (0 a 5 s)",
    tom: "direto",
    quando: "Celular em pé, placa na mão, bem iluminado.",
    fala: "Olha como o seu cliente vai te avaliar no Google em cinco segundos.",
    porque: "Os primeiros segundos decidem se ele assiste o resto. Prometa um resultado rápido.",
  },
  {
    id: "video-toque",
    titulo: "Cena 2 · O toque (5 a 15 s)",
    tom: "leve",
    quando: "Mostre a tela do celular encostando na placa.",
    fala: "Encostou, abriu. O cliente só escolhe as estrelas e pronto, não precisa procurar nada no Google.",
    porque: "É a prova. Deixe a tela aparecer bem: é o momento que convence.",
  },
  {
    id: "video-qr",
    titulo: "Cena 3 · QR code (15 a 22 s)",
    tom: "leve",
    quando: "Vire a placa para mostrar o QR e aponte a câmera de outro celular.",
    fala: "Celular sem NFC? Aponta a câmera no QR code que abre igual.",
    porque: "Responde antes a dúvida mais comum: “e quem não tem NFC?”.",
  },
  {
    id: "video-lugar",
    titulo: "Cena 4 · No balcão (22 a 32 s)",
    tom: "leve",
    quando: "Mostre a placa em pé num balcão ou caixa (de um cliente seu, se puder).",
    fala: "Ela fica aqui no caixa, pedindo avaliação por você o dia inteiro, sem você precisar lembrar.",
    porque: "O dono se imagina com a placa no lugar dele. Se for no balcão de um cliente real, ainda vira prova social.",
  },
  {
    id: "video-chamada",
    titulo: "Cena 5 · Chamada (32 a 40 s)",
    tom: "direto",
    quando: "Volte para a placa ou para o seu rosto.",
    fala: "Pagamento único, sem mensalidade. Me responde aqui que eu levo e já deixo funcionando.",
    porque: "Termina dizendo o que fazer agora. Sem preço no vídeo: o preço vai na conversa, depois que ele mostrar interesse.",
  },
];

export const DICAS_WHATS = [
  "Mande para o número do Google só quando for celular (o funil mostra o botão só nesses casos).",
  "Nunca mande áudio ou vídeo antes de ele responder a primeira mensagem: pede licença primeiro.",
  "Áudio de no máximo 40 segundos e vídeo de no máximo 40 segundos, celular em pé.",
  "Grave o vídeo uma vez e reaproveite. Se o lead for muito bom, grave um áudio citando o nome do lugar.",
  "Responda rápido quando ele responder: quem demora esfria a conversa.",
  "No máximo 3 tentativas sem resposta. Depois disso, pare para não virar spam.",
];
