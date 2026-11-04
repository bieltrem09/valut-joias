import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { Media } from "@/components/ui/Media";
import { navLinks, zeroum } from "@/content/zeroum";
import { WA_GERAL } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-24 md:pb-6">
      <div className="container-site">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo className="h-9 w-auto" />
            <p className="mt-6 max-w-sm text-gray-300">
              Academia de musculação 24 horas em Americana/SP. {zeroum.area}, {zeroum.maquinas} máquinas.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Agregadores aceitos">
              {zeroum.agregadores.map((a) => (
                <li key={a.nome} className="pill border border-white/20 text-white/90">
                  {a.nome} {a.plano}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Rodapé" className="md:col-span-3 md:col-start-6">
            <p className="label text-gray-300">Site</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1">
              {[{ href: "/", label: "Início" }, ...navLinks, { href: "/aula-experimental", label: "Aula experimental" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-2 font-semibold text-white/85 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="label text-gray-300">Fale com a gente</p>
            <ul className="mt-4 space-y-1">
              <li>
                <a href={WA_GERAL} target="_blank" rel="noopener noreferrer" className="inline-block py-2 font-semibold hover:text-red-bright">
                  WhatsApp · <span className="tnum">{zeroum.whatsapp}</span>
                </a>
              </li>
              <li>
                <a href={zeroum.instagramLink} target="_blank" rel="noopener noreferrer" className="inline-block py-2 font-semibold hover:text-red-bright">
                  Instagram · {zeroum.instagram}
                </a>
              </li>
              <li>
                <a href={zeroum.mapa} target="_blank" rel="noopener noreferrer" className="inline-block py-2 font-semibold hover:text-red-bright">
                  {zeroum.endereco.rua} · {zeroum.endereco.bairro}
                </a>
              </li>
            </ul>
            <Link href="/politica-de-privacidade" className="mt-4 inline-block py-2 text-sm text-gray-300 hover:text-white">
              Política de privacidade
            </Link>
          </div>
        </div>

        {/* Logo gigante sobre foto arredondada */}
        <div className="relative mt-20 overflow-hidden rounded-[var(--radius-photo)]">
          <Media slot="footer" sizes="(min-width:1440px) 1392px, 100vw" className="min-h-[220px]" rounded={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-[4%] bottom-[8%]">
            <Wordmark className="w-full text-white" />
          </div>
        </div>

        <div className="label mt-6 flex flex-col justify-between gap-2 text-gray-300 sm:flex-row">
          <span>Zero Um CT · Americana/SP · Aberto 24h</span>
          <span>© {new Date().getFullYear()} {zeroum.nome}</span>
        </div>
      </div>
    </footer>
  );
}
