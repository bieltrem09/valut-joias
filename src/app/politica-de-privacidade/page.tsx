import { zeroum } from "@/content/zeroum";
import { pageMeta } from "@/lib/seo";
import { Todo } from "@/components/ui/Todo";

export const metadata = { ...pageMeta("Política de privacidade", "Como a Zero Um CT Americana trata dados pessoais (LGPD).", "/politica-de-privacidade"), robots: { index: true, follow: true } };

export default function PrivacidadePage() {
  return (
    <section className="bg-black pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <article className="container-site max-w-3xl [&_h2]:title [&_h2]:mt-12 [&_h2]:text-2xl [&_p]:mt-4 [&_p]:text-gray-300 [&_li]:text-gray-300">
        <p className="label !text-red-bright">LGPD · Lei 13.709/2018</p>
        <h1 className="display mt-4 text-section">Política de privacidade</h1>
        <p>
          <Todo>revisar com o responsável jurídico, incluir razão social, CNPJ e e-mail do encarregado (DPO)</Todo>
        </p>

        <h2>1. Quais dados este site coleta</h2>
        <p>
          Este site não tem cadastro, login nem banco de dados. O formulário de aula experimental não envia nada para um servidor: ele apenas monta uma mensagem e abre o WhatsApp no seu aparelho. Os dados (nome, número, objetivo e turno) só chegam à {zeroum.nome} se você enviar essa mensagem.
        </p>

        <h2>2. Para que usamos</h2>
        <p>Para responder seu contato, agendar a aula experimental e falar sobre planos. Não vendemos nem compartilhamos seus dados para publicidade.</p>

        <h2>3. Serviços de terceiros</h2>
        <p>
          Ao clicar em links ou botões, você é levado ao WhatsApp, Instagram e Google Maps, que têm políticas próprias. O mapa do Google só é carregado se você clicar em “Carregar mapa do Google”.
        </p>

        <h2>4. Cookies e métricas</h2>
        <p>
          Este site não usa cookies de rastreamento. <Todo>se instalar analytics (ex.: Vercel Analytics, GA4), atualizar esta seção e pedir consentimento quando necessário</Todo>
        </p>

        <h2>5. Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo WhatsApp {zeroum.whatsapp}.
        </p>

        <p className="label mt-12">Atualizado em novembro de 2026</p>
      </article>
    </section>
  );
}
