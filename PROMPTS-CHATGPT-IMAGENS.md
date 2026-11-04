# Prompts para gerar as imagens do site no ChatGPT (Zero Um CT)

## Como usar

1. Abra **uma conversa nova** no ChatGPT e mande a **MENSAGEM 1** (a "bíblia visual"). Ela fixa o estilo de todas as imagens.
2. Depois mande **um prompt por mensagem**, na ordem. Gere uma imagem por vez.
3. Se uma imagem sair "com cara de IA" (pele de plástico, mão estranha, barra torta), responda: **"Refaça mais realista: pele com poros, mãos anatomicamente corretas, barra reta, iluminação dura de academia real."**
4. Baixe cada imagem com o **nome do arquivo indicado** (ex.: `hero-bg.jpg`) e me mande, ou coloque em `public/photos/`.

> **Proporções:** o ChatGPT gera em quadrado (1:1), horizontal (3:2) ou vertical (2:3). Cada prompt diz qual pedir e como deixar margem para o corte que o site faz (16:9, 21:9, 4:5, 3:4).

### ⚠️ Três regras antes de começar
- **Professores: NÃO gere.** O site mostraria pessoas inventadas como se fossem a equipe real. Use fotos reais da equipe.
- **Antes e depois: NUNCA gere.** Seria um resultado falso. Só fotos reais, com autorização por escrito do aluno.
- **Ambientes (Recovery, vestiário, recepção, máquinas):** imagens geradas servem **só até chegarem as fotos reais**. O aluno vai comparar o site com a academia de verdade. As imagens de clima (hero, madrugada, CTA, rodapé) podem ficar.

---

## MENSAGEM 1: bíblia visual (copie e cole primeiro)

```
Você vai gerar uma série de fotografias para o site oficial de uma academia de musculação brasileira chamada Zero Um CT, em Americana/SP. Todas as imagens desta conversa devem seguir EXATAMENTE este padrão visual, como se fossem do mesmo ensaio fotográfico profissional.

AMBIENTE DA ACADEMIA (manter idêntico em todas):
- Academia enorme (2.500 m²), estilo industrial premium, pé-direito alto.
- Teto e paredes pretos foscos.
- Iluminação assinatura: linhas de LED vermelho formando um padrão geométrico de hexágonos/zigue-zague no teto, refletindo levemente no piso.
- Piso de borracha preta, limpo.
- Máquinas de musculação de alto padrão com estrutura vermelha e preta, estofados pretos, anilhas pretas; halteres cromados e pretos.
- Clima: noturno, cinematográfico, contraste alto, mas com o equipamento nítido e legível.

ESTILO FOTOGRÁFICO:
- Fotografia editorial esportiva real, nível campanha de marca de fitness premium.
- Câmera full-frame (Sony A1), lentes 35mm f/1.4 ou 85mm f/1.8, foco preciso.
- Luz dura e direcional lateral, sombras profundas, rim light vermelho vindo dos LEDs.
- Color grade: pretos profundos, levemente dessaturado, vermelho como único acento forte.
- Granulação fina de filme 35mm, textura real.

PESSOAS (quando houver):
- Brasileiros reais, diversidade natural de tons de pele, corpos atléticos reais (não fisiculturistas exagerados).
- Pele com poros, suor real, veias e marcas naturais, giz nas mãos.
- Roupa de treino preta lisa, sem logos.
- Expressão de esforço ou concentração real; ninguém posando ou sorrindo para a câmera.
- Execução de exercício tecnicamente correta.

PROIBIDO EM TODAS:
- Texto, letras, números, logos, marcas d'água, placas legíveis.
- Pele de plástico, aparência de render 3D, CGI, cartoon, saturação exagerada.
- Mãos ou dedos deformados, barras tortas, anilhas derretidas, equipamentos impossíveis.
- Halteres rosa, sorriso de banco de imagem, cores fora da paleta (preto, cinza, vermelho, tons de pele).

Responda apenas "Entendido" e aguarde os pedidos, um por vez. Gere sempre em altíssima resolução e ultra-realismo fotográfico.
```

---

## Prompts das imagens (um por mensagem)

### 1. `hero-bg.jpg`: fundo do topo do site (o mais importante)
**Pedir em: horizontal 3:2** (o site corta em 16:9)
```
Gere em formato horizontal (3:2), ultra-realista.
Interior vazio da academia à noite, vista ampla em perspectiva central: longas fileiras de racks de agachamento e máquinas vermelhas e pretas se perdendo ao fundo, linhas de LED vermelho em padrão geométrico no teto preto, leve névoa no ar pegando a luz vermelha, piso de borracha preto com reflexos suaves.
Sem pessoas.
Composição: o TERÇO SUPERIOR da imagem deve ser escuro e com pouca informação (um logo grande será colocado por cima); o terço direito deve ter espaço livre no plano médio (uma atleta recortada ficará ali); o terço inferior esquerdo mais escuro (texto vai por cima).
Deixe margem de segurança em cima e embaixo para corte em 16:9.
```

### 2. `hero-athlete-f.png`: atleta mulher recortada (fica na frente do logo)
**Pedir em: vertical 2:3, FUNDO TRANSPARENTE (PNG)**
```
Gere em formato vertical (2:3), PNG com FUNDO TRANSPARENTE, ultra-realista.
Mulher brasileira forte, por volta de 28 anos, no fundo de um agachamento livre com barra nas costas (back squat), carga pesada com anilhas pretas, top de treino preto e legging preta lisa, cabelo preso, expressão de concentração intensa, olhando para frente e levemente para baixo (não para a câmera).
Corpo inteiro visível da cabeça aos pés, incluindo a barra inteira e as anilhas, sem cortes.
Iluminação: luz dura lateral e rim light vermelho contornando o corpo (como se viesse de LEDs vermelhos atrás dela).
Recorte limpo, bordas precisas no cabelo e nos dedos, sem sombra no chão, sem fundo, sem piso.
Técnica de agachamento correta, barra perfeitamente reta.
```

### 3. `hero-athlete-m.png`: atleta homem recortado (alternativa)
**Pedir em: vertical 2:3, FUNDO TRANSPARENTE (PNG)**
```
Gere em formato vertical (2:3), PNG com FUNDO TRANSPARENTE, ultra-realista.
Homem brasileiro musculoso, por volta de 32 anos, no meio de um levantamento terra convencional com barra carregada com anilhas pretas, regata preta lisa, short preto, giz nas mãos, veias aparentes nos antebraços, expressão de esforço real, olhar para frente.
Corpo inteiro visível, barra e anilhas inteiras, sem cortes.
Luz dura lateral e rim light vermelho contornando o corpo.
Recorte limpo, bordas precisas, sem sombra, sem fundo, sem piso.
Postura de levantamento terra tecnicamente correta (coluna neutra), barra perfeitamente reta.
```

### 4. `estrutura-drone.jpg`: vista aérea do prédio
**Pedir em: horizontal 3:2** (o site corta em 21:9, panorâmico)
> A academia já tem vídeo de drone no Instagram. Prefira um frame real dele.
```
Gere em formato horizontal (3:2), ultra-realista.
Foto aérea de drone, ao entardecer (céu azul profundo com último brilho laranja no horizonte), de um grande galpão industrial moderno transformado em academia, numa cidade do interior de São Paulo. Fachada preta com faixas de luz vermelha, janelas altas mostrando o interior iluminado com luz vermelha, estacionamento na frente com algumas luzes de carro.
Sem texto ou logo legível na fachada.
Composição centralizada na faixa horizontal do meio, com céu acima e rua abaixo como margem para corte panorâmico 21:9.
```

### 5. `estrutura-peso-livre.jpg`: área de peso livre
**Pedir em: vertical 2:3** (o site corta em 3:4)
```
Gere em formato vertical (2:3), ultra-realista.
Close-up em diagonal de um rack de halteres longo, halteres pretos e cromados em ordem crescente de peso indo até cargas pesadas, reflexo vermelho dos LEDs do teto no cromado, fundo da academia desfocado (bokeh vermelho).
Sem pessoas. Sem números legíveis nos halteres.
```

### 6. `estrutura-maquinas.jpg`: fileira de máquinas
**Pedir em: vertical 2:3** (o site corta em 4:5)
```
Gere em formato vertical (2:3), ultra-realista.
Corredor simétrico de máquinas de musculação de alto padrão com estrutura vermelha e estofados pretos (máquinas articuladas com anilhas, leg press, remadas), vista em perspectiva central à noite, linhas de LED vermelho geométricas no teto, piso preto.
Sem pessoas. Sem logos ou marcas legíveis nas máquinas.
```

### 7. `estrutura-cardio.jpg`: área de cardio
**Pedir em: quadrado 1:1**
```
Gere em formato quadrado (1:1), ultra-realista.
Fileira de esteiras modernas de frente para janelas altas, às 4 da manhã: lá fora ainda escuro com luzes da cidade; dentro, luz vermelha dos LEDs. Uma única mulher correndo sozinha numa esteira, de costas/perfil, roupa preta, movimento real com leve motion blur nas pernas.
Painéis das esteiras sem números legíveis.
```

### 8. `estrutura-recovery.jpg`: Sala Recovery
**Pedir em: vertical 2:3** (o site corta em 4:5)
```
Gere em formato vertical (2:3), ultra-realista.
Sala de recuperação esportiva moderna e calma dentro da academia: banheira de imersão em gelo em aço inox, rolos de liberação miofascial, pistolas de massagem numa prateleira, cadeira de massagem preta, luz baixa e suave com um toque de vermelho, paredes pretas, piso escuro, toalhas pretas dobradas.
Sem pessoas. Atmosfera de spa esportivo premium.
```

### 9. `estrutura-gelo.jpg`: máquina de gelo
**Pedir em: quadrado 1:1**
```
Gere em formato quadrado (1:1), ultra-realista, macro.
Close-up de uma pá de inox retirando gelo em cubos de uma máquina de gelo comercial em aço inox, cubos cristalinos com textura de gelo real e pequenos detalhes de geada, gotas de água, reflexo vermelho sutil vindo da academia ao fundo desfocado.
Sem mãos visíveis, ou apenas a ponta de uma mão com luva preta.
```

### 10. `estrutura-vestiario.jpg`: vestiário
**Pedir em: vertical 2:3** (o site corta em 3:4)
```
Gere em formato vertical (2:3), ultra-realista.
Vestiário moderno e impecável de academia premium: revestimento de porcelanato preto fosco, bancos de madeira clara, armários pretos, espelho grande, luz quente indireta com um filete de LED vermelho no teto.
Sem pessoas. Limpo, organizado, sem objetos pessoais.
```

### 11. `estrutura-recepcao.jpg`: recepção
**Pedir em: vertical 2:3** (o site corta em 4:5)
```
Gere em formato vertical (2:3), ultra-realista.
Recepção de academia premium à noite: balcão preto com faixa de luz vermelha, catracas modernas de acesso, parede preta (sem logo ou texto), linhas de LED vermelho geométricas no teto, piso escuro brilhante.
Sem pessoas ou com uma recepcionista desfocada ao fundo, sem rosto nítido.
```

### 12. `madrugada.jpg`: treino de madrugada (página Horários)
**Pedir em: horizontal 3:2** (o site corta em 16:9)
```
Gere em formato horizontal (3:2), ultra-realista.
Às 3 da manhã, academia enorme quase vazia e escura; um único homem treinando sozinho (remada com halter apoiado num banco) sob um feixe de luz de cima, no lado direito da imagem; ao redor, máquinas vermelhas na penumbra e linhas de LED vermelho no teto. Sensação de silêncio e foco.
Lado esquerdo e parte de baixo mais escuros (texto grande vai por cima).
Sem relógio com números legíveis.
```

### 13. `resultados.jpg`: esforço máximo (seção "TODO DIA")
**Pedir em: horizontal 3:2** (o site corta em 16:9)
```
Gere em formato horizontal (3:2), ultra-realista.
Mulher brasileira forte puxando um levantamento terra sumô muito pesado, no instante de esforço máximo (rosto em careta real, veias, suor, giz nas mãos), fundo escuro da academia com rim light vermelho, barra perfeitamente reta e anilhas pretas.
Ela ocupa o centro e a parte de cima; a FAIXA INFERIOR da imagem (último quarto) deve ser de piso escuro e simples (um texto vermelho gigante vai por cima).
```

### 14. `cta.jpg`: comunidade (CTA final)
**Pedir em: horizontal 3:2** (o site corta em 16:9)
```
Gere em formato horizontal (3:2), ultra-realista.
Grupo de 4 alunos misturando mulheres e homens, de idades e tons de pele variados, batendo as mãos (fist bump) depois do treino, rindo naturalmente entre si, momento espontâneo e não posado, ninguém olhando para a câmera, roupas pretas de treino, academia ao fundo com LEDs vermelhos desfocados.
As pessoas ficam no TERÇO DIREITO da imagem; o lado esquerdo deve ser escuro e limpo (o título vai por cima).
```

### 15. `footer.jpg`: rodapé (logo gigante por cima)
**Pedir em: horizontal 3:2** (o site corta em 21:9)
```
Gere em formato horizontal (3:2), ultra-realista.
Plano bem aberto do salão da academia às 5 da manhã: luz azulada do amanhecer entrando pelas janelas altas, misturada com as linhas de LED vermelho do teto; poucas pessoas treinando ao longe, pequenas na imagem; máquinas vermelhas e pretas em fileiras.
A metade de baixo deve ser mais escura e uniforme (um logo branco gigante vai por cima).
Composição em faixa horizontal, com margem para corte panorâmico 21:9.
```

### 16. `estrutura-estacionamento.jpg`: só se a academia tiver estacionamento
**Pedir em: quadrado 1:1**
```
Gere em formato quadrado (1:1), ultra-realista.
Estacionamento em frente a um galpão-academia moderno à noite, fachada preta com faixas de luz vermelha, alguns carros estacionados, piso de asfalto com reflexos após chuva leve.
Sem placas, textos ou logos legíveis.
```

---

## Não gerar (usar material real)

| Arquivo | Por quê | O que usar |
|---|---|---|
| `prof-01` a `prof-04` | Seriam pessoas falsas apresentadas como equipe | Fotos reais dos professores (vertical, fundo da academia) |
| `antes` / `depois` | Seria um resultado falso | Fotos reais com autorização por escrito |
| `evento-halloween`, `evento-sorteio`, `evento-inauguracao` | Já existem | Artes reais dos posts do Instagram |

---

## Depois de gerar

Mande as imagens para mim com o nome do arquivo de cada uma. Eu otimizo (AVIF/WebP), coloco no site e publico na Vercel.

Se quiser fazer sozinho: salve em `public/photos/` e preencha `src: "/photos/nome-do-arquivo.jpg"` no slot correspondente em `src/content/media.ts`.
