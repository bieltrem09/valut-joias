"use client";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { professores } from "@/content/zeroum";
import { Media } from "@/components/ui/Media";
import { SectionLabel } from "@/components/ui/SectionHead";
import { Todo } from "@/components/ui/Todo";


/**
 * 06 · PROFESSORES — carrossel arrastável com inércia (Draggable + InertiaPlugin) e
 * cursor-bolha vermelho "ARRASTE" (só ponteiro fino). Touch / reduced-motion: scroll-snap nativo.
 * WCAG 2.5.7: botões Anterior/Próximo como alternativa ao arrasto.
 */
export function ProfessoresCarousel({ label = "06", grid = false }: { label?: string; grid?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const pendente = professores.some((p) => p.pendente);

  // Arrasto com inércia só em ponteiro fino e sem reduced-motion; GSAP carregado sob demanda.
  const dragRef = useRef<{ kill: () => void; update: () => void; minX: number } | null>(null);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  useEffect(() => {
    if (grid) return;
    const mq = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;
    let killed = false;
    let cleanup = () => {};
    (async () => {
      const [{ gsap }, { Draggable }, { InertiaPlugin }] = await Promise.all([import("gsap"), import("gsap/Draggable"), import("gsap/InertiaPlugin")]);
      if (killed) return;
      gsap.registerPlugin(Draggable, InertiaPlugin);
      gsapRef.current = gsap;
      const vp = viewport.current!;
      const track = vp.querySelector<HTMLElement>(".prof-track")!;
      vp.style.overflow = "hidden";
      vp.style.scrollSnapType = "none";
      vp.scrollLeft = 0;

      const [drag] = Draggable.create(track, {
        type: "x",
        inertia: true,
        edgeResistance: 0.85,
        bounds: vp,
        cursor: "none",
        activeCursor: "none",
        allowContextMenu: true,
        dragClickables: true,
      });
      dragRef.current = drag;

      // Bolha: quickTo (.35s) segue o ponteiro; entra de scale .6 → 1 (nunca de 0), sai mais rápido.
      const b = bubble.current!;
      gsap.set(b, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
      const xTo = gsap.quickTo(b, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(b, "y", { duration: 0.35, ease: "power3" });
      const move = (e: PointerEvent) => {
        const r = vp.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
      };
      const enter = () => gsap.to(b, { scale: 1, autoAlpha: 1, duration: 0.25, ease: "expo.out" });
      const leave = () => gsap.to(b, { scale: 0.6, autoAlpha: 0, duration: 0.18, ease: "expo.out" });
      vp.addEventListener("pointermove", move);
      vp.addEventListener("pointerenter", enter);
      vp.addEventListener("pointerleave", leave);

      cleanup = () => {
        drag.kill();
        dragRef.current = null;
        vp.removeEventListener("pointermove", move);
        vp.removeEventListener("pointerenter", enter);
        vp.removeEventListener("pointerleave", leave);
        gsap.set(track, { clearProps: "transform" });
        vp.style.overflow = "";
        vp.style.scrollSnapType = "";
      };
    })();
    return () => {
      killed = true;
      cleanup();
    };
  }, [grid]);

  const step = (dir: 1 | -1) => {
    const vp = viewport.current!;
    const card = vp.querySelector<HTMLElement>("li");
    const w = (card?.offsetWidth ?? 300) + 16;
    const drag = dragRef.current;
    const gsap = gsapRef.current;
    const track = vp.querySelector<HTMLElement>(".prof-track")!;
    if (drag && gsap) {
      const cur = Number(gsap.getProperty(track, "x"));
      const next = gsap.utils.clamp(drag.minX, 0, cur - dir * w);
      gsap.to(track, { x: next, duration: 0.5, ease: "expo.out", onUpdate: () => drag.update() });
    } else {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      vp.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
    }
  };

  return (
    <section aria-labelledby="prof-title" className="relative z-10 bg-black py-24 md:py-32">
      <div className="container-site flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel n={label}>Professores</SectionLabel>
          <h2 id="prof-title" className="display mt-4 text-section">
            Quem te
            <br />
            acompanha
          </h2>
          {pendente && (
            <p className="mt-6">
              <Todo>nome, foto, especialidade, CREF e turno de cada professor(a)</Todo>
            </p>
          )}
        </div>
        {!grid && (
          <div className="flex items-center gap-3">
            <span className="label tnum text-gray-300">
              {String(professores.length).padStart(2, "0")} professores
            </span>
            <button type="button" onClick={() => step(-1)} className="btn-circle !bg-steel" aria-label="Professor anterior">
              <ArrowLeft size={20} style={{ transform: "none" }} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} className="btn-circle" aria-label="Próximo professor">
              <ArrowRight size={20} style={{ transform: "none" }} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={viewport}
        className={`relative mt-12 ${grid ? "container-site" : "no-scrollbar snap-x snap-mandatory scroll-px-[var(--gutter)] overflow-x-auto"}`}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Equipe de professores"
      >
        <ul className={`prof-track ${grid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "flex w-max gap-4 px-[var(--gutter)]"}`}>
          {professores.map((p, i) => (
            <li key={p.id} className={`${grid ? "" : "w-[72vw] shrink-0 snap-start sm:w-[44vw] lg:w-[24vw] lg:max-w-[360px]"} select-none`}>
              <article aria-label={`${p.nome}, ${p.especialidade}`}>
                <div className="relative">
                  <Media slot={p.foto} sizes="(min-width:1024px) 24vw, 72vw" />
                  <span className="pill absolute left-3 top-3 bg-red text-white">{p.especialidade}</span>
                  <span className="label absolute right-4 top-4 text-white/60">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="title mt-4 text-xl">{p.nome}</h3>
                <p className="label mt-1 text-gray-300">
                  {p.cref} · {p.turno}
                </p>
              </article>
            </li>
          ))}
        </ul>

        {!grid && (
          <div
            ref={bubble}
            aria-hidden="true"
            className="label pointer-events-none absolute left-0 top-0 z-10 hidden size-24 place-items-center rounded-full bg-red text-white [@media(hover:hover)_and_(pointer:fine)]:grid"
            style={{ visibility: "hidden" }}
          >
            Arraste
          </div>
        )}
      </div>
    </section>
  );
}
