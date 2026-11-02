"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowUpRight, Copy, Mic, Video } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/input";
import { PASSOS_WHATS, CENAS_VIDEO, type PassoWhats } from "@/lib/abordagem-whatsapp";
import { falaPronta, type Valores } from "@/lib/mentora";
import type { LeadFunil } from "@/lib/data/leads";
import { whatsappUrl } from "@/lib/prospeccao";
import { formatInt, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Seu nome, cidade e preço vêm do que você preencheu na Mentora. */
function seusDados(): Partial<Valores> {
  try {
    return JSON.parse(localStorage.getItem("mentora-voce") ?? "{}") as Partial<Valores>;
  } catch {
    return {};
  }
}

const valoresDoLead = (l: LeadFunil): Partial<Valores> => ({
  ...seusDados(),
  estabelecimento: l.nome,
  segmento: l.segmento ?? l.categoria ?? "",
  nota: l.rating != null ? formatRating(l.rating) : "",
  avaliacoes: l.totalAvaliacoes != null ? formatInt(l.totalAvaliacoes) : "",
});

/**
 * Sequência de abordagem pelo WhatsApp para um lead: escolhe o passo, ajusta o texto
 * e abre a conversa já com a mensagem. Áudio e vídeo você grava; aqui fica o roteiro.
 */
export function MensagensWhats({ lead: l, open, onOpenChange, onEnviou }: { lead: LeadFunil; open: boolean; onOpenChange: (o: boolean) => void; onEnviou: () => void }) {
  const [passoId, setPassoId] = React.useState(PASSOS_WHATS[0].id);
  const [texto, setTexto] = React.useState("");
  const passo = PASSOS_WHATS.find((p) => p.id === passoId)!;

  React.useEffect(() => {
    if (open) setTexto(falaPronta(passo.fala, valoresDoLead(l)));
  }, [open, passo, l]);

  const enviar = (comTexto: boolean) => {
    const url = l.telefone ? whatsappUrl(l.telefone, comTexto ? texto : undefined) : null;
    if (!url) return void toast.error("Esse número não parece ser de celular.");
    window.open(url, "_blank", "noopener");
    onEnviou();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`WhatsApp · ${l.nome}`} description="Siga os passos em ordem. Troque os campos entre [colchetes] antes de enviar.">
      <div className="grid gap-5">
        <div role="tablist" aria-label="Passos" className="-mx-1 flex flex-wrap gap-1.5">
          {PASSOS_WHATS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === passoId}
              onClick={() => setPassoId(p.id)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3 text-12 font-medium ring-1 transition-colors duration-150 coarse:h-10",
                p.id === passoId ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover-fine:bg-muted",
              )}
            >
              <IconeEnvio envio={p.envio} />
              {p.titulo}
            </button>
          ))}
        </div>

        <div className="grid gap-2">
          <p className="text-12 text-muted-foreground">{passo.quando}</p>
          {passo.envio !== "texto" && (
            <p className="rounded-control bg-pending-soft px-3 py-2 text-12">
              {passo.envio === "audio"
                ? "Grave você mesmo esse áudio no WhatsApp, lendo o texto abaixo com calma. Voz de gente vende mais que voz de robô."
                : "Mande o vídeo que você gravou (roteiro abaixo) e, junto, esta mensagem."}
            </p>
          )}
          <textarea
            aria-label="Mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={passo.envio === "audio" ? 9 : 6}
            className={cn(fieldClass, "h-auto py-3 text-14 leading-relaxed")}
          />
          <p className="text-12 text-muted-foreground">
            <span className="font-medium text-foreground">Por que funciona: </span>
            {passo.porque}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={() => enviar(passo.envio !== "audio")}>
            <ArrowUpRight strokeWidth={1.5} /> {passo.envio === "audio" ? "Abrir conversa para gravar" : "Abrir no WhatsApp"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(texto);
                toast.success("Texto copiado");
              } catch {
                toast.error("Não deu para copiar. Selecione o texto e copie.");
              }
            }}
          >
            <Copy strokeWidth={1.5} /> Copiar
          </Button>
        </div>

        {passo.envio === "video" && <RoteiroVideo />}
      </div>
    </Sheet>
  );
}

function IconeEnvio({ envio }: { envio: PassoWhats["envio"] }) {
  if (envio === "audio") return <Mic className="size-3.5" strokeWidth={1.75} aria-label="áudio" />;
  if (envio === "video") return <Video className="size-3.5" strokeWidth={1.75} aria-label="vídeo" />;
  return null;
}

function RoteiroVideo() {
  return (
    <section aria-labelledby="rot-video" className="grid gap-3 border-t border-border pt-4">
      <h3 id="rot-video" className="text-14 font-semibold">
        Roteiro do vídeo (até 40 segundos, celular em pé)
      </h3>
      <ol className="grid gap-3">
        {CENAS_VIDEO.map((c) => (
          <li key={c.id} className="grid gap-1 rounded-control bg-muted/50 p-3">
            <p className="text-12 font-medium">{c.titulo}</p>
            <p className="text-12 text-muted-foreground">{c.quando}</p>
            <p className="text-13">“{c.fala}”</p>
          </li>
        ))}
      </ol>
      <p className="text-12 text-muted-foreground">Grave uma vez e reaproveite com todos. O roteiro completo também está na Mentora, no estilo “Pelo WhatsApp”.</p>
    </section>
  );
}
