# Zero Um CT Americana: site oficial

Site multipágina da **Zero Um CT**, academia de musculação 24 horas com 2.500 m² em Americana/SP.

Feito em **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + GSAP + Lenis**. É só frontend: não tem backend, banco de dados nem login, e todas as páginas são geradas estaticamente.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # produção
```

## Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Home: hero, manifesto, estrutura, horários, planos, professores, primeiro treino, resultados, depoimentos, comunidade, CTA, localização, FAQ |
| `/estrutura` | Tour pelos ambientes |
| `/planos` | Planos, agregadores e FAQ de pagamento |
| `/horarios` | 24h, grade por turno e avaliação física |
| `/professores` | Equipe |
| `/resultados` | Antes e depois, conquistas e depoimentos |
| `/contato` | WhatsApp, Instagram, mapa e FAQ |
| `/aula-experimental` | Formulário que abre o WhatsApp com a mensagem pronta |
| `/politica-de-privacidade` | LGPD |
| `/styleguide` | Logo, cores, tipografia e componentes (fora do índice de busca) |

## Como editar o conteúdo (sem mexer em componente)

**Tudo** fica em **`src/content/zeroum.ts`**: endereço, planos e preços, professores, grade de horários, FAQ, eventos, depoimentos e conquistas.

- O que ainda não foi confirmado está marcado como `{ todo: "..." }`, com valor `null` ou com lista vazia. Nesses casos o site mostra um aviso tracejado **"A CONFIRMAR"**, ou esconde o bloco (como o mapa de calor de horários).
- Quando preencher o dado real, o aviso some sozinho.
- Exemplos:
  - **Preço:** em `planos[i].precos.mensal`, troque `null` por `129.9`.
  - **Endereço:** em `endereco.texto`, coloque `"Rua …, 200 · Bairro · Americana/SP"` e marque `confirmado: true`.
  - **Professor:** preencha nome, CREF e turno e remova `pendente: true`.
  - **Depoimento:** adicione `{ id, nome, texto, nota: 5, desde: "2024" }` em `depoimentos`.

A lista completa do que falta confirmar está no fim do `BUILD_LOG.md`.

## Como trocar as fotos

1. Coloque a foto em `public/photos/` (de preferência com 2048px ou mais de largura).
2. Em `src/content/media.ts`, preencha `src: "/photos/arquivo.jpg"` no slot correspondente e revise o `alt`.
3. Pronto: o `next/image` gera AVIF/WebP e os tamanhos responsivos.

No hero, o `hero-athlete-f` precisa ser um **PNG com fundo transparente** (o recorte da atleta fica na frente do logo gigante). Os prompts e o briefing de cada foto estão em `IMAGE_PROMPTS.md`.

## Logo

Use só os arquivos de `public/brand/` (kit vetorizado). No código, use `<Logo />` e `<Wordmark />` (`src/components/brand/Logo.tsx`). Não recrie a logo com fonte nem troque as cores.

Para regerar o favicon, os ícones e a imagem de Open Graph:

```bash
node scripts/brand-assets.mjs
```

## Publicar

O caminho mais simples é a **Vercel**: importe o repositório e o framework é detectado sozinho. Funciona em qualquer host com Node (`npm run build && npm start`).

Antes de publicar, atualize `zeroum.site` em `src/content/zeroum.ts` com o domínio definitivo. Ele é usado no canonical, no sitemap e no Open Graph.

## Onde está cada coisa

- `src/content/`: dados (`zeroum.ts`) e slots de imagem (`media.ts`)
- `src/components/sections/`: seções das páginas
- `src/components/motion/ScrollFx.tsx`: todas as animações de scroll. As seções só declaram `data-fx="..."`, e o GSAP é carregado sob demanda.
- `src/app/globals.css`: tokens de cor e tipografia, componentes base e a intro do hero em CSS
- `design-system/zero-um-ct-americana/`: design system gerado pela `ui-ux-pro-max` e o override de marca
- `BUILD_LOG.md`: skills usadas, tabela de motion, medições de Lighthouse e TODOs
