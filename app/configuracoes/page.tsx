import type { Metadata } from "next";
import { googleEnabled, testarChave } from "@/lib/google/places";
import { usoDoMes } from "@/lib/google/uso";
import { bancoRemoto, persistente } from "@/lib/db";
import { PageIntro } from "@/components/shell/page-intro";
import { StatusDot } from "@/components/ui/chip";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // Com a chave colada, testa de verdade: chave presente não quer dizer chave aceita.
  const teste = googleEnabled() ? await testarChave() : null;
  const google = !!teste?.ok;
  const uso = googleEnabled() ? await usoDoMes() : null;
  const auth = !!(process.env.PANEL_USER && process.env.PANEL_PASS);
  const remoto = bancoRemoto;

  return (
    <div className="grid max-w-2xl gap-6 md:gap-8">
      <PageIntro eyebrow="Configurações">Tudo aqui vem das variáveis de ambiente. Mudou lá, publique de novo.</PageIntro>
      <ul className="surface divide-y divide-border">
        <Item
          title="Banco de dados"
          ok={persistente}
          okText={remoto ? "Supabase (Postgres)" : "Postgres local"}
          offText="Temporário"
          body={
            persistente
              ? remoto
                ? "Seus dados ficam guardados no Supabase e sobrevivem a qualquer novo deploy."
                : "Os dados ficam em data/pglite neste computador (Postgres embutido)."
              : "Sem banco conectado, o painel usa um Postgres em memória na Vercel, que se apaga. Na Vercel: Storage → Create Database → Supabase → conecte ao projeto e publique de novo."
          }
        />
        <Item
          title="Google Places"
          ok={google}
          okText="Conectado"
          offText={teste ? "Chave recusada" : "Desligado"}
          body={
            google
              ? `Chave testada agora e aceita pelo Google. Este mês: ${uso!.buscas} de ${uso!.limites.buscas} buscas, ${uso!.fotos} de ${uso!.limites.fotos} fotos e ${uso!.detalhes} de ${uso!.limites.detalhes} atualizações de clientes. Ao chegar no limite, o painel para sozinho até o dia 1º, para ficar dentro da cota grátis do Google.`
              : teste && !teste.ok
                ? teste.motivo
                : "Sem a chave, o mapa do Google funciona, mas a lista com fotos e dados de cada estabelecimento não. Veja abaixo como ligar sem gerar cobrança."
          }
        />
        <Item
          title="Senha do painel"
          ok={auth}
          okText="Ativa"
          offText="Desligada"
          body={
            auth
              ? "O navegador pede usuário e senha uma vez (HTTP Basic Auth)."
              : "Defina PANEL_USER e PANEL_PASS antes de colocar dados reais: sem isso, qualquer pessoa com o link vê o painel."
          }
        />
      </ul>

      {!google && (
        <section aria-labelledby="chave" className="surface grid gap-4 p-5">
          <h2 id="chave" className="text-16 font-semibold tracking-[-0.01em]">
            Ligar a lista com fotos, sem cobrança
          </h2>
          <p className="text-13 text-muted-foreground">
            O Google dá uma cota grátis por mês para cada tipo de chamada. O painel conta tudo e para antes do limite (900 buscas e 900 fotos por mês). Mesmo
            assim o Google exige um cartão no cadastro.
          </p>
          <ol className="grid list-decimal gap-2 pl-5 text-13 text-subtle-foreground">
            <li>Em console.cloud.google.com, crie um projeto e vincule uma conta de faturamento (cartão).</li>
            <li>Em APIs e serviços → Biblioteca, ative a “Places API (New)”.</li>
            <li>Em Credenciais → Criar credenciais → Chave de API. Em “Restrições de API”, marque só a Places API (New).</li>
            <li>
              Proteção extra: em Faturamento → Orçamentos e alertas, crie um orçamento de R$ 1 com alerta por e-mail. Em APIs e serviços → Places API (New) →
              Cotas, limite as chamadas por dia (ex.: 30).
            </li>
            <li>Na Vercel, em Settings → Environment Variables, crie GOOGLE_PLACES_API_KEY com a chave (Production e Preview) e publique de novo.</li>
          </ol>
        </section>
      )}
    </div>
  );
}

function Item({ title, ok, okText, offText, body }: { title: string; ok: boolean; okText: string; offText: string; body: string }) {
  return (
    <li className="grid gap-1.5 p-5 sm:grid-cols-[180px_1fr] sm:gap-6">
      <div className="grid content-start gap-1">
        <p className="text-14 font-medium">{title}</p>
        <StatusDot tone={ok ? "profit" : "pending"}>{ok ? okText : offText}</StatusDot>
      </div>
      <p className="text-13 text-muted-foreground">{body}</p>
    </li>
  );
}
