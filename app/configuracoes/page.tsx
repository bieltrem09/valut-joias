import type { Metadata } from "next";
import { googleEnabled, testarChave } from "@/lib/google/places";
import { bancoRemoto, persistente } from "@/lib/db";
import { PageIntro } from "@/components/shell/page-intro";
import { StatusDot } from "@/components/ui/chip";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // Com a chave colada, testa de verdade: chave presente não quer dizer chave aceita.
  const teste = googleEnabled() ? await testarChave() : null;
  const google = !!teste?.ok;
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
              ? "Chave testada agora e aceita pelo Google. Notas, fotos e avaliações são medidas todo dia às 9h (Vercel Cron) e quando você pede na ficha do cliente."
              : teste && !teste.ok
                ? teste.motivo
                : "Sem GOOGLE_PLACES_API_KEY, você cadastra clientes à mão e anota as contagens de avaliações. Crie a chave no Google Cloud com a Places API (New) ativa."
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
