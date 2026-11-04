# BUILD_LOG: Zero Um CT Americana

Registro do desenvolvimento: quais skills foram usadas, o que cada uma decidiu, onde a decisão está no código, as medições de performance e os itens pendentes (TODO).

---

## 0. Observações de entrada

- **Imagens de referência de layout:** o prompt pedia que o "Velocity" e o "Athlete Showcase" fossem anexados, mas eles **não vieram nesta sessão**. O layout seguiu a descrição em texto dessas referências (seção 4 do prompt). Quando as imagens forem enviadas, vale fazer uma revisão de fidelidade.
- **Fotos reais:** nenhuma foto da academia foi fornecida e nenhuma ferramenta de geração de imagem foi usada. Por isso todas as imagens são **placeholders na proporção exata** (prioridade 3 da seção 9.1). Os prompts estão em `IMAGE_PROMPTS.md`.
- **Logo:** o site usa somente o kit vetorizado (`public/brand/`). Os paths do SVG foram extraídos para `src/components/brand/logo-paths.ts`, para permitir o stagger por letra, sem redesenhar nada.

---

## 1. Skills usadas

| Fase | Skill solicitada | Skill usada | O que ela decidiu | Onde está |
|---|---|---|---|---|
| 1 · Design system | `/ui-ux-pro-max:ui-ux-pro-max` | igual | Gerou e persistiu o design system com os dials variance 8, motion 8 e density 3. Pattern "Feature-Rich Showcase", CTA repetido (hero + meio + fim), checklist pré-entrega, breakpoints 375/768/1024/1440. Diretrizes Next: Server Components por padrão e `next/font`. | `design-system/zero-um-ct-americana/MASTER.md` e `pages/_brand-override.md` |
| 2 · Stack | `/emilkowalski:pick-ui-library` | **`emilkowalski:emil-design-eng`** (a skill pedida **não existe** nesta sessão; usei a equivalente mais próxima do mesmo autor) | Usar o mínimo de bibliotecas. Componentes nativos sempre que possível: `<details>` para accordion, `<dialog>` para o menu e `<input type=range>` para o antes/depois. | ver §2 |
| 3 · Motion de scroll | `/web-animation-skills:gsap-web` | igual | Lenis rodando no ticker do GSAP (`lagSmoothing(0)`, `t*1000`, sem rAF paralelo). Pin horizontal com `invalidateOnRefresh` e valores em função. `gsap.matchMedia()` para reduced-motion e desktop. SplitText revertido no cleanup. | `src/components/layout/SmoothScroll.tsx`, `src/components/motion/ScrollFx.tsx` |
| 4 · Microinterações | `/emilkowalski:animate` | igual | Cada animação passou pelo gate (frequência → propósito → ferramenta → propriedades → curva → duração → interrupção → reduced-motion). Ver §3. | `src/app/globals.css`, componentes |
| 5 · Performance | `/code-performance` | **`anthropic-skills:code-performance`** (nome equivalente) | Baseline, diagnóstico e correções: intro do hero em CSS, GSAP fora do JS crítico e seções estáticas como Server Components. Ver §4. | ver §4 |

### Conflitos entre a skill e a marca (registrados)

| Origem | Sugestão | Decisão |
|---|---|---|
| ui-ux-pro-max | Paleta laranja + verde | **Marca vence**: preto + vermelho |
| ui-ux-pro-max | Brutalism (cantos 0, sem transições) | **Referências vencem**: raios 28/24/14/999px |
| ui-ux-pro-max | Barlow Condensed + Barlow | **Prompt vence**: Anton + Manrope + Geist Mono |
| Prompt (§3.2) | "`--red` sobre paper passa 4.5:1" | **Medição real: 4.19:1, não passa.** Criei `--red-ink #CC1429` (5.03:1) para texto pequeno vermelho em fundo claro. `--red` continua para texto grande e fundo de botão (branco sobre `--red` = 4.74:1). |
| Prompt (§3.3) | Anton com `line-height: .88` | **Cortava os acentos do português** (Ã de "NÃO", É de "TAMBÉM"), que encostavam na linha de cima. Ajustei para `1.0` nos títulos e `1.08` no hero. |
| ui-ux-pro-max (busca "before after slider") | 0 resultados relevantes, mesmo após 1 retry | Fallback declarado: padrão WCAG com `input range` nativo + `clip-path` (receita do emil-design-eng). |

---

## 2. Stack e bibliotecas (decisão do emil-design-eng)

| Necessidade | Escolha | Justificativa |
|---|---|---|
| Framework | Next.js 16.4 (App Router) + TypeScript + Tailwind v4 | Pedido no prompt; SSG de todas as rotas |
| Scroll motion | GSAP 3.15 (ScrollTrigger, SplitText, Draggable, Inertia) | Plugins gratuitos; **carregados sob demanda** (`import()` no idle) |
| Smooth scroll | Lenis 1.3 | Sincronizado com ScrollTrigger; desligado em reduced-motion |
| Carrossel | GSAP Draggable + Inertia (desktop) / scroll-snap nativo (touch) | Nenhuma lib extra |
| Números animados | `RollingNumber` próprio (CSS transition) | 30 linhas; interrompível |
| Accordion | `<details>` + `::details-content` | Zero JS, acessível |
| Tabs | Componente próprio (`role=tablist`, setas do teclado) | 1 uso só |
| Dialog (menu) | `<dialog>` nativo + `showModal()` | Focus trap e Esc nativos |
| Formulário | `<form>` nativo + validação inline | Sem react-hook-form |
| Mapa | SVG estilizado + iframe só no clique | 0 KB de terceiros no carregamento |
| Ícones | lucide-react (tree-shaken) | Traço consistente |
| Removido | `@gsap/react` | Sem uso depois que o GSAP passou a ser dinâmico |

---

## 3. Tabela de motion (`emilkowalski:animate`)

| Elemento | Gate (frequência · propósito) | Ferramenta · propriedades | Curva · duração | Reduced-motion |
|---|---|---|---|---|
| Intro do hero (moldura, fundo, letras ZEROUM, linhas do título, chips, conector) | 1x por visita · delight/marca | **CSS animation** · `clip-path`, `transform`, `opacity` (só nos chips) | `--ease-in-out` 1.2s (moldura) / `--ease-out` 0.6–1.4s; stagger de 40ms nas letras e 80ms nos chips | Sem animação, estado final |
| Hero no scroll (foto desce, logo sobe, pin) | rolagem · profundidade | GSAP ScrollTrigger · `yPercent`, pin com `pinSpacing:false` | `none` (scrub) | Desligado |
| Folha clara do Manifesto | rolagem · continuidade espacial | Pin do hero + sobreposição | scrub | Rolagem normal |
| Manifesto por palavra | rolagem · ritmo de leitura | SplitText `words` · **cor** `#807E7A → #0B0B0B` (troquei a opacidade .15 do prompt por cor para manter 3.59:1 de contraste) | `none` (scrub) | Texto preto direto |
| Pilares | 1x · entrada | GSAP · `y`, `opacity` | `expo.out` 0.8s, stagger 80ms | Desligado |
| Foto aérea | rolagem · revelar | GSAP · `clip-path` inset | scrub | Desligado |
| Estrutura horizontal | rolagem · tour | GSAP pin + `x` | `none`, scrub 1; só ≥1024px | Carrossel com snap |
| Relógio 24h (ponteiro) | 1x/min · state indication | CSS transition · `rotate` | `--ease-in-out` 600ms | Sem transição |
| Dígitos do relógio e preços | ao mudar · state indication | CSS transition · `translateY` | `--ease-out` 240ms (≤300ms) | Troca instantânea |
| Grade de horários (troca de dia) | dezenas/dia · **Flip REJEITADO** | O conteúdo só troca, não se desloca no espaço; Flip seria movimento sem propósito. Fica um crossfade CSS `opacity` | 180ms ease-out | Sem animação |
| Planos (toggle) | ocasional · state | RollingNumber + `background-color` | 240ms / 200ms | Troca instantânea |
| Professores: arrasto | gesto · feedback físico | Draggable + Inertia · `x` | inércia; `edgeResistance .85` | Scroll-snap nativo |
| Cursor-bolha "ARRASTE" | hover desktop · affordance | GSAP `quickTo` · `x/y`, `scale .6→1` (nunca 0) | `.35s power3`; entra em 250ms, **sai em 180ms** | Desligado (e nunca no touch) |
| Botões Anterior/Próximo | clique · feedback | GSAP `x` / `scrollBy` | `expo.out` 0.5s | `behavior:auto` |
| Linha 01→02→03 | rolagem · explicação | GSAP · `scaleX` | scrub | Linha cheia |
| "TODO DIA" | rolagem · marca | GSAP · `xPercent -10→10` | scrub | Estático |
| Antes/depois | arrasto · controle direto | `clip-path` em tempo real, **sem easing**; setas ±5% | — | Igual (não é decorativo) |
| Botões (press) | dezenas/dia · feedback | CSS `:active scale(.97)` | `--ease-out` 160ms | Só cor |
| Seta dos CTAs | hover · affordance | CSS `translateX(4px)`; botão circular `rotate(-45°→0)` | 200–220ms ease-out; hover só com `(hover:hover) and (pointer:fine)` | Sem movimento |
| Ponto "ABERTO" | contínuo · status ao vivo | CSS keyframes · `opacity` a cada 2s | ease-in-out | Parado |
| Nav (some/volta) | rolagem frequente · espaço | CSS transition · `translateY` | `--ease-out` 250ms | Sempre visível |
| Menu mobile | ocasional · continuidade | `<dialog>` + `@starting-style` · `clip-path` + `opacity` | `--ease-drawer` 320ms | Só fade de 200ms |
| FAQ | ocasional · disclosure | `::details-content` `block-size` (exceção aceita para accordion) | `--ease-out` 250ms | — |
| Cards de eventos (hover) | hover · affordance | CSS `scale(1.03)` | `--ease-out` 500ms; só ponteiro fino | Desligado |

---

## 4. Performance (`code-performance`)

Medição real: **Lighthouse 12, perfil mobile (throttling simulado), build de produção** (`next build && next start`).

### Antes × depois (home `/`)

| Métrica | Baseline | Depois | Estado |
|---|---|---|---|
| Performance | 66 | **93–96** (5 execuções; uma fora da curva deu 78 por ruído da máquina) | ⚠️ oscila em torno da meta de 95 |
| Acessibilidade | 89 | **100** | ✅ |
| Boas práticas | 100 | **100** | ✅ |
| SEO | 100 | **100** | ✅ |
| LCP (simulado) | 3.8 s | 2.6–2.8 s | ⚠️ |
| LCP (observado no trace) | — | 0.19 s | ✅ |
| TBT | 1.000 ms | 160–200 ms | ✅ |
| CLS | 0 | 0 | ✅ |
| FCP | 1.1 s | 1.1 s | ✅ |
| JS inicial (moderno, gzip) | — | ~127 KB (polyfills `noModule` não são baixados por navegadores modernos) | ✅ meta < 170 KB |

### Páginas internas (depois)

| Rota | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| /planos | 97 | 100 | 100 | 100 |
| /aula-experimental | 99 | 100 | 100 | 100 |
| /horarios | 98 | 100 | 100 | 100 |
| /estrutura | 97 | 100 | 100 | 100 |
| /contato | 98 | 100 | 100 | 100 |
| /professores | 99 | 100 | 100 | 100 |
| /resultados | 97 | 100 | 100 | 100 |

### Diagnóstico e correções

| Problema | Causa | Correção | Resultado |
|---|---|---|---|
| LCP 3.8 s | O texto do hero ficava em `visibility:hidden` até o GSAP hidratar e rodar a intro | Intro em **CSS puro**; o texto do hero anima só com `transform` (sem opacity 0) | LCP observado: 0.19 s |
| TBT 1.000 ms | GSAP, SplitText e ScrollTrigger no bundle inicial + 5 seções hidratadas só para animar | Seções viraram **Server Components** com `data-fx`; um único `ScrollFx` carrega o GSAP via `import()` no `requestIdleCallback`; Lenis também carrega no idle | TBT 160–200 ms |
| Contraste (a11y) | Manifesto com palavras a .15 de opacidade; TODO vermelho-escuro em card preto | Animação por **cor** (3.59:1 no início); TODO volta para `--red-bright` em card escuro | A11y 100 |
| ARIA (a11y) | `<ul role=tabpanel>`; `aria-label` em `<span>`/`<p>` | Painel em `<div role=tabpanel>`; textos `sr-only`; SplitText com `aria:"none"` | A11y 100 |
| Mapa | iframe do Google pesa centenas de KB | SVG estilizado; iframe só no clique | 0 KB de terceiros |

### Pendências de performance

- **Home em 93–94 (meta 95).** O LCP real é 0.19 s, mas o modelo simulado do Lighthouse (lantern) atribui ~2.3 s de "render delay" ao parágrafo do hero, porque conta os chunks de JS e as fontes baixados antes dele. Quando a **foto real do hero** entrar (`priority` + `fetchPriority="high"`), ela passa a ser o elemento LCP. Medir de novo nesse momento. Se continuar abaixo de 95, o próximo passo é transformar `Horarios24` em Server Component com uma ilha só para o relógio.
- Ainda não medido em dispositivo real nem em CrUX (o site não está publicado).

---

## 5. QA

- [x] 375px sem scroll horizontal. Corrigido: `min-w-0` nas colunas do grid de horários e o chip "ABERTO 24H" escondido no mobile.
- [x] Menu mobile: abre, Esc fecha, foco preso no dialog (nativo).
- [x] Formulário: erros inline com `aria-invalid` e foco no primeiro campo inválido; máscara de telefone; abre `wa.me` com a mensagem pronta.
- [x] Teclado: skip link, foco visível (branco no escuro, `--red-ink` no claro), tabs com setas, slider antes/depois com setas, botões Anterior/Próximo no carrossel (WCAG 2.5.7).
- [x] Reduced-motion: sem Lenis, pin, parallax, scrub, pulso ou intro; carrosséis com snap nativo.
- [x] Todas as rotas respondem 200; 404 customizada; `sitemap.xml` e `robots.txt`.
- [x] JSON-LD `ExerciseGym` (sem `streetAddress` e sem `aggregateRating` até haver dado real) e `FAQPage` só com respostas confirmadas.
- [x] Anti-"cara de IA" (§5): sem gradiente roxo/azul, sem blobs, glass só nos chips do hero, sem grid de 3 cards iguais com ícone, sem emoji como ícone, sem lorem ipsum, sem depoimento inventado.
- [x] Regras da logo (§3.1): só os SVGs do kit, sem recriar com fonte; largura mínima respeitada (nav 7–8 de altura ≈ 140px).

---

## 6. TODOs: tudo que falta o dono confirmar (nada foi inventado)

Todos ficam em `src/content/zeroum.ts` e aparecem no site com o aviso tracejado "A CONFIRMAR".

1. **Planos**: nomes, valores (mensal/semestral/anual) e o que cada um inclui (destaque "Planos" do Instagram).
2. **Professores**: nome, foto, especialidade, CREF e turno. Enquanto não houver, a seção mostra trechos reais das avaliações do Google sobre a equipe (sem cards falsos).
3. **Grade de professores por turno** (`gradeProfessores`).
4. **Avaliação física**: dias e horários.
5. **Domingos e feriados**: abre 24h também?
6. **Horário da recepção.**
7. **Mapa de calor "melhor horário pra treinar vazio"** (`movimento`). A seção fica oculta até haver dados.
8. **Transformações (antes/depois)**: só com autorização por escrito.
9. **Conquistas**: campeonatos, metas, tempo de casa.
10. **Estacionamento**: existe? É gratuito?
11. **Segurança de madrugada**: câmeras, controle de acesso, equipe.
12. **Professor de madrugada**: tem?
13. **FAQ de pagamento**: formas de pagamento, matrícula, cancelamento/fidelidade.
14. **Detalhes de cada ambiente**: faixa de pesos, marcas, equipamentos de cardio, o que tem na Sala Recovery, vestiários.
15. **Datas** dos posts de Estrutura, Sorteio e Inauguração.
16. **"Primeira aula por nossa conta"**: confirmar que a aula experimental é gratuita (a frase está no prompt e no site).
17. **"Perto da Rodoviária de Americana"**: confirmar a referência.
18. **Domínio definitivo** (`zeroum.site`, hoje `https://zeroumct.com.br`), usado no canonical, no sitemap e no Open Graph.
19. **Política de privacidade**: razão social, CNPJ e e-mail do encarregado (DPO).
20. **Fotos**: todos os slots de `src/content/media.ts` (ver `IMAGE_PROMPTS.md`).
21. **Imagens de referência de layout** ("Velocity" e "Athlete Showcase"), para a revisão de fidelidade.

---

## 7. Atualização: dados confirmados pelo dono (03/11/2026)

| Dado | Fonte | Onde entrou |
|---|---|---|
| Endereço **Rua Orlando de Santi, 220 · Campo Limpo · CEP 13477-000** | Perfil do Google + post oficial | Localização, footer, JSON-LD (`streetAddress`) |
| **230 máquinas de 10 marcas** | Post oficial ("Os números impressionam") | Hero, Manifesto (pilar Performance), Estrutura, CTA final |
| **"A maior academia de Americana"** | Post oficial | Manifesto e Estrutura |
| **Nota 4,9 · 181 avaliações** no Google | Perfil do Google | Depoimentos, Professores, JSON-LD (`aggregateRating`), meta description |
| **8 avaliações reais** (nota 5) | Perfil do Google | `depoimentos` em `zeroum.ts`. Textos transcritos sem alteração; trechos cortados pelo Google terminam em "…"; emojis removidos. |
| **Diária avulsa R$ 39,90** | Post oficial do Instagram | Planos (bloco "Diária avulsa") e FAQ |
| Professores | Ainda sem dados | Seção mostra o que os alunos dizem da equipe |

**Não usado:** os preços dos planos Wellhub e TotalPass (Silver a partir de R$ 149,99, TP2 cerca de R$ 119,90…). São preços dos agregadores e variam por cidade e por data. O site mostra só o nome do plano mínimo aceito. As fotos das avaliações também não foram usadas, porque são dos autores das avaliações.
