import { PillLink } from "@/components/ui/Buttons";

export default function NotFound() {
  return (
    <section className="grid min-h-[80svh] place-items-center bg-black pt-[var(--nav-h)]">
      <div className="container-site text-center">
        <p className="label text-red-bright">Erro 404</p>
        <h1 className="display mt-4 text-hero">Página não encontrada.</h1>
        <p className="mt-6 text-gray-300">A academia tá aberta. Essa página, não.</p>
        <PillLink href="/" className="mt-8">Voltar ao início</PillLink>
      </div>
    </section>
  );
}
