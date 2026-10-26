"use client";

import * as React from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { Prioridade } from "@/lib/prospeccao";

export type Pino = { id: string; lat: number; lng: number; nome: string; numero: number; prioridade: Prioridade };

type Props = {
  pinos: Pino[];
  selecionado: string | null;
  onSelecionar: (id: string) => void;
  /** Muda a cada busca: o mapa reenquadra todos os pinos. */
  chave: string;
  voce?: { lat: number; lng: number } | null;
};

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const icone = (L: typeof Leaflet, p: Pino, ativo: boolean) =>
  L.divIcon({
    className: "pin-num-wrap",
    html: `<div class="pin-num pin-${p.prioridade}${ativo ? " is-selected" : ""}"><span>${String(p.numero).padStart(2, "0")}</span></div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    tooltipAnchor: [0, -40],
  });

const semMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mapa com um pino numerado por estabelecimento (mesmo número da lista). Leaflet só existe no navegador. */
export function MapaPinos({ pinos, selecionado, onSelecionar, chave, voce }: Props) {
  const el = React.useRef<HTMLDivElement>(null);
  const L = React.useRef<typeof Leaflet | null>(null);
  const map = React.useRef<Leaflet.Map | null>(null);
  const tiles = React.useRef<Leaflet.TileLayer | null>(null);
  const camada = React.useRef<Leaflet.LayerGroup | null>(null);
  const marcadores = React.useRef(new Map<string, { m: Leaflet.Marker; p: Pino }>());
  const [pronto, setPronto] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const onSel = React.useRef(onSelecionar);
  onSel.current = onSelecionar;

  React.useEffect(() => {
    let cancel = false;
    import("leaflet").then((mod) => {
      if (cancel || !el.current || map.current) return;
      L.current = mod;
      map.current = mod.map(el.current, { zoomControl: false }).setView([-22.5647, -47.4017], 13);
      mod.control.zoom({ position: "bottomright" }).addTo(map.current);
      camada.current = mod.layerGroup().addTo(map.current);
      setPronto(true);
    });
    return () => {
      cancel = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Base clara/escura acompanha o tema; o CSS tinge de roxo.
  React.useEffect(() => {
    if (!pronto || !L.current || !map.current) return;
    tiles.current?.remove();
    tiles.current = L.current
      .tileLayer(resolvedTheme === "light" ? TILES.light : TILES.dark, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      })
      .addTo(map.current);
  }, [pronto, resolvedTheme]);

  // Pinos + "você está aqui"
  React.useEffect(() => {
    if (!pronto || !L.current || !camada.current) return;
    camada.current.clearLayers();
    marcadores.current.clear();
    for (const p of pinos) {
      const m = L.current
        .marker([p.lat, p.lng], { icon: icone(L.current, p, false), keyboard: true, title: `${p.numero}. ${p.nome}`, riseOnHover: true })
        .bindTooltip(`${String(p.numero).padStart(2, "0")} · ${p.nome}`, { direction: "top", className: "lead-tip" })
        .on("click", () => onSel.current(p.id));
      m.addTo(camada.current);
      marcadores.current.set(p.id, { m, p });
    }
    if (voce) L.current.circleMarker([voce.lat, voce.lng], { radius: 6, className: "lead-voce", interactive: false }).addTo(camada.current);
  }, [pronto, pinos, voce]);

  // Cada busca nova enquadra todos os pinos.
  React.useEffect(() => {
    if (!pronto || !L.current || !map.current || !pinos.length) return;
    const b = L.current.latLngBounds(pinos.map((p) => [p.lat, p.lng] as [number, number]));
    if (voce) b.extend([voce.lat, voce.lng]);
    map.current.fitBounds(b, { padding: [56, 56], maxZoom: 16, animate: !semMovimento() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, chave]);

  // Selecionado: pino maior, na frente, e o mapa vai até ele.
  React.useEffect(() => {
    if (!L.current) return;
    for (const [id, { m, p }] of marcadores.current) {
      const ativo = id === selecionado;
      m.setIcon(icone(L.current, p, ativo));
      m.setZIndexOffset(ativo ? 1000 : 0);
      if (ativo && map.current) {
        // A ficha cobre a direita (ou a parte de baixo no celular): o pino fica no espaço livre.
        const { x: w, y: h } = map.current.getSize();
        const desvio = w >= 700 ? L.current.point(Math.min(220, w * 0.22), 0) : L.current.point(0, h * 0.28);
        const alvo = map.current.unproject(map.current.project(m.getLatLng()).add(desvio));
        map.current.panTo(alvo, { animate: !semMovimento() });
      }
    }
  }, [selecionado, pinos]);

  // O contêiner muda de tamanho (aba, tela): o Leaflet precisa saber.
  React.useEffect(() => {
    if (!pronto || !el.current) return;
    const ro = new ResizeObserver(() => map.current?.invalidateSize());
    ro.observe(el.current);
    return () => ro.disconnect();
  }, [pronto]);

  return <div ref={el} className="lead-map size-full" role="application" aria-label="Mapa com os estabelecimentos numerados" />;
}
