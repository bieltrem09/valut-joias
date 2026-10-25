# Ecloura — Painel

Painel privado do dono da Ecloura: vendas, placas NFC, clientes e despesas. Abre direto no painel, sem tela de login.

## Rodar

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://localhost:3000
```

Na primeira requisição o app cria `data/ecloura.db` (SQLite) e popula com o seed. Nenhum passo de migração é necessário.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build && npm start` | Produção |
| `npm run db:seed` | Apaga e recria o banco com dados de exemplo |
| `npm test` | Testes de `lib/finance.ts` (vitest) |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / ESLint |

## Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `PANEL_USER`, `PANEL_PASS` | HTTP Basic Auth no `middleware.ts`. O navegador pede a senha uma vez. Vazias: acesso livre (dev). |
| `GOOGLE_PLACES_API_KEY` | Places API (New). Sem ela, o app usa o seed e avisa em Configurações. |
| `OWNER_EMAIL` | E-mail mostrado no rodapé da sidebar. |
| `DATABASE_PATH` | Caminho do SQLite (padrão `data/ecloura.db`). |

## Trocar o seed

O seed fica em `lib/db/seed.ts`: 18 empresas, cerca de 60 vendas nos últimos 90 dias, placas, leituras diárias, histórico de avaliações e despesas mensais. As datas são relativas ao dia em que ele roda. Edite a lista `EMPRESAS` ou as regras e rode `npm run db:seed`.

## Dados do Google

A API do Business Profile só cobre empresas que você administra. Para os clientes, o app usa a **Places API (New)**, sempre no servidor:

- `app/api/google/search`: `places:searchText` (autocomplete do "Adicionar cliente")
- `lib/google/places.ts`: `places/{id}` com field mask, download da foto (servida por `app/api/google/photo/[id]`; a chave nunca vai ao navegador)
- Cache no banco com `refreshedAt`: atualiza no máximo a cada 24h (em segundo plano ao abrir Clientes) ou pelo botão "Atualizar dados do Google"
- Cada atualização grava `userRatingCount` em `avaliacoes_historico`, que alimenta o "+N desde a placa"

## Arquitetura

```
app/                 rotas (server components) + actions.ts (server actions)
components/ui/       primitivos: data-table, sheet, button, rolling-number, grid-glow…
components/<tela>/   compostos de cada tela
lib/finance.ts       todas as fórmulas, com testes
lib/data/*           única porta de leitura do banco (tipada); trocar o banco não mexe na UI
lib/db/*             schema Drizzle, DDL idempotente, seed
```

O período fica na URL (`?p=hoje|ontem|7d|30d|custom&de=…&ate=…`).

## Notas de design

**Tokens em três camadas** (`app/globals.css`): primitivos (`--navy-*`, `--blue-*`, `--paper-*`) → semânticos (`--primary`, `--profit`, `--cost`, `--pending`) → componente (`--hero-*`, `--cat-*`). Tudo tem versão `.dark` própria. As telas não têm cor fixa.

- O azul de interação e o do hero ficam um passo abaixo do azul da marca (`0.535` e `0.515` em vez de `0.58`), para texto branco e texto azul pequeno passarem AA. O axe passa sem violações nas 5 telas, claro e escuro.
- As cores das categorias de despesa passaram pelo validador de paleta (banda de luz, croma, separação para daltonismo) nos dois temas.

**Direções do CompanyCard.**
1. **Capa editorial (escolhida).** Foto 16:10 no topo, escurecida só na base, com nome e categoria por cima. Abaixo vêm a nota com o delta "+N desde a placa", o faturamento e quem comprou. A foto mostra o lugar e o número mostra o que a empresa vale para você. Funciona para vender a placa ("olha o que ela fez pela barbearia do Rafael").
2. **Ficha.** Foto quadrada de 64px à esquerda e números como protagonistas, numa linha densa, tipo extrato. Cabe mais cliente por tela, mas perde o caráter de vitrine que o brief pede.

**Direções do hero.**
1. **Curva acumulada (escolhida).** A área mostra o lucro líquido acumulado no período, então a linha termina exatamente no número de 56px. O tooltip mostra o valor do dia e o acumulado. Como os anúncios são cobrados uma vez por semana, a série diária crua fica serrilhada, com dias negativos que não dizem nada.
2. **Barras diárias com linha de média.** É mais literal, mas compete com o número principal e com o gráfico de barras "De onde vai cada real".

Num período de um dia, o hero lista as vendas do dia em vez de desenhar uma curva de um ponto só.

**Movimento.** O movimento só aparece para confirmar uma ação ou explicar uma mudança:
- Botões e pills encolhem ao pressionar (`scale .96`, 150ms).
- Os indicadores da sidebar, do período e da ordenação deslizam com `layoutId` (spring 300/30).
- Os números rolam com `useSpring` escrito direto no DOM.
- A linha do hero se desenha em 600ms e depois muda de forma quando o período troca.
- As rotas entram em 220ms (opacidade e y 6px).
- Os cards de cliente entram em cascata de 40ms (no máximo 8).
- O sheet abre com spring 260/28.

Com `prefers-reduced-motion`, ficam só os fades: deslocamento, escala, desenho da linha e rolagem dos números saem. Nada anima por tecla repetida (as setas da tabela só movem o foco).
