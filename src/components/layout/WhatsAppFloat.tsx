import { WA_GERAL } from "@/lib/whatsapp";

/** Mobile: pílula preta com borda vermelha (não o ícone verde gigante). */
export function WhatsAppFloat() {
  return (
    <a
      href={WA_GERAL}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-black fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 border border-red shadow-[0_8px_30px_rgb(0_0_0/0.5)] active:scale-[0.97] md:hidden"
    >
      <span className="pulse-dot" aria-hidden="true" />
      Falar no WhatsApp
    </a>
  );
}
