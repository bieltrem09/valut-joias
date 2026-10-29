import type { Metadata } from "next";
import { googleEnabled, testarChave } from "@/lib/google/places";
import { usoDoMes } from "@/lib/google/uso";
import { tomtomEnabled } from "@/lib/tomtom";
import { usoVozDoMes, vozIaEnabled } from "@/lib/elevenlabs";
import { bancoRemoto, persistente } from "@/lib/db";
import { PageIntro } from "@/components/shell/page-intro";
import { StatusDot } from "@/components/ui/chip";
import { AppNoCelular } from "@/components/shell/instalar-app";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // Com a chave colada, testa de verdade: chave presente não quer dizer chave aceita.
  const teste = googleEnabled() ? await testarChave() : null;
  const google = !!teste?.ok;
  const uso = googleEnabled() ? await usoDoMes() : null;
  const auth = !!(process.env.PANEL_USER && process.env.PANEL_PASS);
  const remoto = bancoRemoto;
  const tomtom = tomtomEnabled();
  const vozIa = vozIaEnabled();
  const usoVoz = vozIa ? await usoVozDoMes() : null;

  return (
    <div className="grid max-w-2xl gap-6 md:gap-8">
      <PageIntro eyebrow="Configurações">Tudo aqui vem das variáveis de ambiente. Mudou lá, publique de novo.</PageIntro>
      <AppNoCelular />
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
          title="TomTom (lista de estabelecimentos)"
          ok={tomtom}
          okText="Ligado"
          offText="Desligado"
          body={
            tomtom
              ? "A Prospecção busca no TomTom (base grande, de graça até 2.500 buscas por dia) e completa com o mapa aberto."
              : "Sem a chave, a lista vem só do mapa aberto (OpenStreetMap), que tem bem menos estabelecimentos que o Google. Veja abaixo como ligar, grátis e sem cartão."
          }
        />
        <Item
          title="Voz de IA da Mentora (ElevenLabs)"
          ok={vozIa}
          okText="Ligada"
          offText="Voz do aparelho"
          body={
            vozIa
              ? `O Ouvir da Mentora usa uma voz de IA com emoção. Este mês: ${usoVoz!.caracteres.toLocaleString("pt-BR")} de ${usoVoz!.limite.toLocaleString("pt-BR")} caracteres. Cada fala é guardada: ouvir de novo não gasta. No limite, volta para a voz do aparelho até o dia 1º.`
              : "Sem a chave, o Ouvir usa a voz do aparelho (já com ritmo e emoção). Com a ElevenLabs, grátis e sem cartão, a voz fica bem mais humana. Veja abaixo como ligar."
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

      {!vozIa && (
        <section aria-labelledby="voz" className="surface grid gap-4 p-5">
          <h2 id="voz" className="text-16 font-semibold tracking-[-0.01em]">
            Ligar a voz de IA da Mentora: grátis e sem cartão
          </h2>
          <p className="text-13 text-muted-foreground">
            O plano grátis da ElevenLabs dá 10.000 caracteres por mês (umas 50 falas diferentes). O painel guarda cada fala gerada e para antes do limite: não
            existe cobrança, porque não há cartão cadastrado.
          </p>
          <ol className="grid list-decimal gap-2 pl-5 text-13 text-subtle-foreground">
            <li>Em elevenlabs.io, clique em “Sign up” e crie a conta grátis (e-mail ou Google).</li>
            <li>No canto de baixo, abra o seu perfil → “API Keys” → “Create API Key”, dê um nome (ex.: Basik7) e copie a chave.</li>
            <li>Na Vercel, em Settings → Environment Variables, crie ELEVENLABS_API_KEY com a chave (Production e Preview).</li>
            <li>
              Opcional: na “Voice Library” da ElevenLabs, escolha uma voz brasileira de que goste, copie o “Voice ID” e crie ELEVENLABS_VOICE_ID com ele. Sem
              isso, o painel usa uma voz padrão que fala português com emoção.
            </li>
            <li>Publique de novo. Aqui em cima a voz passa a aparecer como “Ligada”.</li>
          </ol>
        </section>
      )}

      {!tomtom && !google && (
        <section aria-labelledby="tomtom" className="surface grid gap-4 p-5">
          <h2 id="tomtom" className="text-16 font-semibold tracking-[-0.01em]">
            Ligar o TomTom: mais estabelecimentos na lista, grátis e sem cartão
          </h2>
          <p className="text-13 text-muted-foreground">
            São 2.500 buscas por dia de graça (cada busca no painel gasta de 2 a 3). Passando disso o TomTom só recusa até o dia seguinte: não existe cobrança,
            porque não há cartão cadastrado.
          </p>
          <ol className="grid list-decimal gap-2 pl-5 text-13 text-subtle-foreground">
            <li>Em developer.tomtom.com, clique em “Register” e crie a conta (e-mail e senha; confirme o e-mail).</li>
            <li>No painel do TomTom (Dashboard → Keys), copie a chave que já vem criada (“My first API key”).</li>
            <li>Na Vercel, em Settings → Environment Variables, crie TOMTOM_API_KEY com a chave (Production e Preview).</li>
            <li>Publique de novo. Aqui em cima o TomTom passa a aparecer como “Ligado”.</li>
          </ol>
        </section>
      )}

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
