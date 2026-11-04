"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { zeroum } from "@/content/zeroum";
import { WA_GERAL } from "@/lib/whatsapp";
import { SectionLabel } from "@/components/ui/SectionHead";

const EMBED = `https://www.google.com/maps?q=${encodeURIComponent("Zero Um CT Americana")}&output=embed`;

/** Mapa estilizado em SVG (0 KB de terceiros). O iframe do Google só carrega no clique. */
function MapaEstilizado() {
  return (
    <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="800" height="500" fill="var(--color-carbon)" />
      <g stroke="rgb(255 255 255 / 0.07)" strokeWidth="1">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40 - 120} y2="500" />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="800" y2={i * 40 + 60} />
        ))}
      </g>
      <path d="M-20 360 C 160 300, 300 340, 420 260 S 680 120, 840 140" fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="14" />
      <path d="M120 -20 L 300 520" fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="8" />
      <path d="M560 -20 C 520 160, 600 300, 540 520" fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="8" />
      <circle cx="430" cy="250" r="70" fill="rgb(227 24 45 / 0.12)" />
      <circle cx="430" cy="250" r="34" fill="rgb(227 24 45 / 0.22)" />
    </svg>
  );
}

export function Localizacao({ label = "12" }: { label?: string }) {
  const [live, setLive] = useState(false);
  const e = zeroum.endereco;
  return (
    <section aria-labelledby="loc-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionLabel n={label}>Localização</SectionLabel>
          <h2 id="loc-title" className="display mt-4 text-section">
            Americana,
            <br />
            <span className="text-red">SP.</span>
          </h2>
          <address className="mt-8 not-italic">
            <p className="text-lg font-semibold">{e.rua}</p>
            <p className="text-gray-300">
              {e.bairro} · {e.cidade}/{e.uf} · CEP {e.cep}
            </p>
            <p className="mt-4 text-gray-300">{zeroum.referenciaLocal}.</p>
          </address>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={zeroum.mapa} target="_blank" rel="noopener noreferrer" className="btn btn-red">
              Traçar rota <span className="btn-arrow" aria-hidden="true">→</span>
            </a>
            <a href={WA_GERAL} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Chamar no WhatsApp
            </a>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-[var(--radius-photo)] lg:col-span-8 lg:min-h-[520px]">
          {live ? (
            <iframe
              src={EMBED}
              title="Mapa da Zero Um CT Americana no Google Maps"
              className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_invert(0.92)_contrast(0.9)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <>
              <MapaEstilizado />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center" aria-hidden="true">
                <span className="grid size-12 place-items-center rounded-full bg-red">
                  <MapPin size={22} />
                </span>
                <span className="h-4 w-0.5 bg-red" />
              </div>
              <span className="label pill absolute left-4 top-4 bg-black/80 text-white">Mapa ilustrativo</span>
              <button type="button" onClick={() => setLive(true)} className="btn btn-white absolute bottom-4 left-1/2 -translate-x-1/2">
                Carregar mapa do Google
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
