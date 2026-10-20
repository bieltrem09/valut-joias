# VALUT Semijoias — e-commerce editorial

Site da **VALUT Semijoias** ("Semijoia que encanta."): editorial, com scroll storytelling e transições, e com fluxo de compra completo (sacola → pedido pelo WhatsApp).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · GSAP 3 (ScrollTrigger, SplitText, Flip) · Lenis · Motion (`motion/react`) · Zustand · `next/image` (AVIF/WebP).

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # produção
npm run lint       # checagem de tipos
npm run media      # (re)gera /public/media a partir de /img
```

Requer Node 20+. O `npm run media` usa `sharp` (já instalado) e o `ffmpeg` (opcional, só para converter os vídeos).

## Onde editar

| O quê | Arquivo |
|---|---|
| **Produtos** (nome, preço, fotos, categoria, variações, "Complete o look") | `data/products.ts` |
| Dados da marca (endereço, WhatsApp, horários, frete grátis, CNPJ) | `data/site.ts` |
| Categorias e foto de cada uma | `data/categories.ts` |
| Looks do lookbook e posição dos hotspots (% da foto) | `data/lookbook.ts` |
| Depoimentos | `data/testimonials.ts` |
| Checkout (hoje gera a mensagem do pedido no WhatsApp) | `lib/checkout.ts` |
| Cores, fontes e easings | `app/globals.css` (`@theme`) e `lib/animations/tokens.ts` |

`data/products.ts` tem um formato `Product` tipado e funções de consulta no fim do arquivo: para migrar para CMS/Shopify/Nuvemshop, troque só essas funções.

### Fotos e vídeos
Os originais ficam em `/img` (não são servidos). `scripts/optimize-media.mjs` copia com nomes semânticos para `/public/media`, faz um ajuste leve e uniforme de cor nas fotos da loja, gera blur placeholders (`data/media.generated.ts`) e converte os vídeos para H.264 + WebM com poster. O `next/image` serve AVIF/WebP em vários tamanhos.

A joia recortada do hero (`joia-rubi-recorte.webp`) foi gerada a partir de um frame do vídeo Rubi Mood. **TODO:** substituir por uma foto de estúdio em fundo neutro, em alta resolução, e recortar (troque `scripts/joia-hero-recorte.png` e rode `npm run media`).

### Logo
O logo foi **recriado em SVG** a partir das fotos do letreiro (`public/brand/valut-logo.svg`, `valut-simbolo.svg`, `valut-wordmark.svg`; gerador em `scripts/gen-logo.mjs`). Se a VALUT tiver o vetor oficial, substitua os arquivos e os paths em `components/ui/logo-paths.ts`.

## Estrutura

```
app/                  rotas (/, /colecao, /produto/[slug], /sobre, /atacado, /contato, /favoritos, 404, sitemap, robots)
components/sections/  seções da home (Hero, Marquee, CurvedGallery, Categories, Manifesto, RubiMood, Lookbook, Featured, StoreSection, Wholesale, Feedbacks)
components/layout/    Header, MobileMenu, Footer, Preloader, PageTransition, Providers
components/shop/      ProductCard, CartDrawer, SearchOverlay, RingSizeGuide, FavoriteButton, FilterPills
components/ui/        Media, Reveal, Buttons (magnéticos + roll de letras), Cursor, Logo, LazyVideo, ícones
lib/animations/       hooks: useSplitReveal, useImageReveal, useParallax, useMagnetic, usePinScroll + tokens
lib/                  gsap (registro dos plugins), lenis (smooth scroll), reveal (sincroniza cortina/preloader), store, checkout
```

## Movimento e acessibilidade
- Lenis (`lerp 0.09`) dirigido pelo ticker do GSAP e sincronizado com o ScrollTrigger; desligado em `prefers-reduced-motion`.
- Todas as animações usam `gsap.matchMedia`: com reduced motion ficam só fades curtos (sem pin, scrub nem parallax); pins pesados só no desktop.
- Animações apenas em `transform`, `opacity`, `clip-path` e `filter` (exceção: altura do acordeão do produto).
- Preloader só na 1ª visita da sessão (`sessionStorage`); a entrada do hero começa durante a saída da cortina (`lib/reveal.ts`).
- Transições: cortina dourada → ivory com o nome da página; card → produto via View Transitions API (fallback: cortina); voltar/avançar sem cortina.
- Foco visível dourado, "pular para o conteúdo", `aria-label` nos ícones, diálogos com Esc, `alt` em português.

## Placeholders `[CONFIRMAR]` — a VALUT precisa preencher

Busque por `CONFIRMAR` no código. Lista completa:

**Loja e contato** (`data/site.ts`)
- [ ] Bairro, cidade e UF da loja (Av. Mal. Arthur da Costa e Silva, 1380)
- [ ] Horários de funcionamento
- [ ] Link exato do Google Maps
- [ ] Número de WhatsApp (enquanto vazio, os botões levam para linktr.ee/valutvendas)
- [ ] CNPJ
- [ ] Domínio definitivo do site
- [ ] Valor mínimo para frete grátis (hoje R$ 299)

**Produtos** (`data/products.ts`)
- [ ] Nomes reais das peças (hoje são descrições do que aparece nas fotos)
- [ ] Preços e preços "de" (hoje são ilustrativos)
- [ ] Descrição de cada peça: material, banho, medidas, fecho, garantia
- [ ] Variações disponíveis (dourado / ródio) por peça
- [ ] Quando os dados forem reais, mude `demoData` para `false` em `data/site.ts` (some o aviso "preços ilustrativos")

**Conteúdo**
- [ ] História da marca na página Sobre (`components/pages/AboutView.tsx`)
- [ ] Depoimentos reais com autorização (`data/testimonials.ts`)
- [ ] Benefícios do programa de revenda: pedido mínimo, catálogo (`components/sections/Wholesale.tsx`)
- [ ] FAQ do atacado (`components/pages/WholesaleForm.tsx`)
- [ ] Políticas de trocas, envio e garantia (`app/contato/page.tsx`, acordeão "Envio" do produto)
- [ ] Tabela de tamanhos de anel (`components/shop/RingSizeGuide.tsx`)
- [ ] Formas de pagamento no rodapé (`components/layout/Footer.tsx`)
- [ ] Integração da newsletter (`components/layout/Footer.tsx`)
- [ ] Gateway de pagamento, se for sair do pedido por WhatsApp (`lib/checkout.ts`)

**Mídia**
- [ ] Foto de estúdio da joia do hero, em fundo neutro
- [ ] Logo vetorial oficial (opcional — há uma recriação em SVG)
