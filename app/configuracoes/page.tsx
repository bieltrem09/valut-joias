import type { Metadata } from "next";
import { googleEnabled } from "@/lib/google/places";
import { PageIntro } from "@/components/shell/page-intro";
import { StatusDot } from "@/components/ui/chip";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  const google = googleEnabled();
  const auth = !!(process.env.PANEL_USER && process.env.PANEL_PASS);

  return (
    <div className="grid max-w-2xl gap-6 md:gap-8">
      <PageIntro eyebrow="Configurações">Tudo aqui vem do arquivo .env. Mudou lá, reinicie o app.</PageIntro>
      <ul className="surface divide-y divide-border">
        <Item
          title="Google Places"
          ok={google}
          okText="Conectado"
          offText="Usando dados de exemplo"
          body={
            google
              ? "Notas, fotos e avaliações dos clientes são atualizadas a cada 24h, ou quando você pede no painel do cliente."
              : "Sem GOOGLE_PLACES_API_KEY, os clientes mostram o seed. Crie a chave no Google Cloud com a Places API (New) ativa."
          }
        />
        <Item
          title="Senha do painel"
          ok={auth}
          okText="Ativa"
          offText="Desligada"
          body={
            auth ? "O navegador pede usuário e senha uma vez (HTTP Basic Auth)." : "Defina PANEL_USER e PANEL_PASS para proteger o painel antes de publicar."
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
