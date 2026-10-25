# Ecloura — Painel

Painel privado do dono da Ecloura: vendas, placas NFC, clientes e despesas. Abre direto no painel, sem tela de login.

## Rodar

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://localhost:3000
```

O painel começa **vazio**: sem nenhum dado de exemplo. Na primeira requisição ele cria as tabelas. Use **Clientes → Adicionar cliente**, depois **Registrar venda**.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build && npm start` | Produção |
| `npm run db:reset` | Apaga o banco **local** para recomeçar do zero |
| `npm test` | Testes de `lib/finance.ts` e `lib/crescimento.ts` (vitest) |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / ESLint |

## Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | Banco no Turso (`libsql://…`). **Obrigatório em produção**: sem ele, na Vercel o banco fica em `/tmp` e é apagado. Local: usa `data/ecloura.db`. |
| `PANEL_USER`, `PANEL_PASS` | HTTP Basic Auth no `middleware.ts`. Vazias: acesso livre. |
| `GOOGLE_PLACES_API_KEY` | Places API (New): busca de empresas, foto, nota e medição diária das avaliações. |
| `CRON_SECRET` | Protege a rota da medição diária (`/api/cron/google`). A Vercel envia esse segredo sozinha. |
| `PUBLIC_URL` | Opcional. Domínio usado no link das placas (`https://seu-dominio/r/NFC-0001`). Sem ele, usa o endereço atual. |
| `OWNER_EMAIL` | E-mail mostrado no rodapé da sidebar. |

### Banco no Turso (grátis)

1. Crie uma conta em turso.tech e um banco (`turso db create ecloura`).
2. Pegue a URL (`turso db show ecloura --url`) e um token (`turso db tokens create ecloura`).
3. Na Vercel: Project → Settings → Environment Variables → `DATABASE_URL` e `DATABASE_AUTH_TOKEN`. Publique de novo.

As tabelas são criadas sozinhas na primeira requisição.

## Leituras reais das placas

Cada placa tem um link próprio: `/r/NFC-0001`. **É esse link que vai gravado no chip NFC e no QR do verso.** Cada toque passa pelo painel, é contado (total e por dia) e redireciona para o destino atual. Dá para trocar o destino depois, sem regravar a placa. Placas inativas mostram um aviso em vez de redirecionar. As rotas `/r/*` ficam fora da senha do painel.

## Crescimento de avaliações no Google

O Google não entrega histórico de avaliações, só o total de hoje. Por isso o painel **mede**:

- todo dia às 9h de Brasília (Vercel Cron → `/api/cron/google`, ver `vercel.json`);
- no momento em que uma placa "Avaliação Google" é ativada (essa medição vira a **base**);
- quando você toca em "Medir agora" na ficha do cliente;
- ou quando você anota a contagem à mão (sem chave do Google).

É uma medição por empresa por dia. As regras estão em `lib/crescimento.ts`, com testes:

- **Base**: o número que você informou para o dia da instalação; senão, a última medição até a ativação; senão, a primeira depois dela. No último caso o ganho é um piso, e a tela diz isso.
- **Ganho**: última medição − base.
- **Ritmo**: avaliações por semana, só com 7 dias ou mais de dados.
- **Antes × depois**: só quando há 7 dias ou mais medidos antes da placa.
- **Gráfico**: o eixo X é tempo real e cada ponto é uma medição. A faixa verde marca o período com placa. No total geral de Clientes a linha é em degrau: o valor só muda quando há medição nova, sem estimativa entre pontos.

## Dados do Google

A API do Business Profile só cobre empresas que você administra. Para os clientes, o app usa a **Places API (New)**, sempre no servidor. A chave nunca vai ao navegador. A foto da empresa é guardada no banco e servida por `/api/google/photo/[id]`. A atribuição "Dados: Google" aparece onde esses dados são exibidos.

## Arquitetura

```
app/                 rotas (server components) + actions.ts (server actions)
components/ui/       primitivos: data-table, sheet, button, rolling-number, grid-glow…
components/<tela>/   compostos de cada tela
lib/finance.ts       fórmulas financeiras, com testes
lib/crescimento.ts   base, ganho e ritmo das avaliações, com testes
lib/data/*           única porta de leitura do banco (tipada); trocar o banco não mexe na UI
lib/db/*             schema Drizzle (libSQL), DDL idempotente
app/r/[codigo]       link gravado na placa: conta o toque e redireciona
app/api/cron/google  medição diária das avaliações
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
