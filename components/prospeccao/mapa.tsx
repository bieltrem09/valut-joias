"use client";

import * as React from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";

export type Pin = { id: string; lat: number; lng: number; nome: string; numero: number; prioridade: "maxima" | "alta" | "media" | "baixa" };
export type Area = { south: number; west: number; north: number; east: number };

export type MapaHandle = { area: () => Area | null; zoom: (delta: number) => void; nivel: () => number };

type Props = {
  centro: { lat: number; lng: number };
  pins: Pin[];
  selecionado: string | null;
  onSelecionar: (id: string) => void;
  /** Ajusta o enquadramento quando muda (resultado novo, cidade nova). */
  enquadrar?: { key: string; bounds?: Area; centro?: { lat: number; lng: number }; zoom?: number } | null;
  raio?: { lat: number; lng: number; km: number } | null;
  voce?: { lat: number; lng: number } | null;
  /** Contorno da cidade buscada (retângulo), desenhado bem de leve. */
  limites?: Area | null;
  onZoom?: (nivel: number) => void;
};

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const icone = (L: typeof Leaflet, p: Pin, ativo: boolean) =>
  L.divIcon({
    className: "pin-num-wrap",
    html: `<div class="pin-num pin-${p.prioridade}${ativo ? " is-selected" : ""}"><span>${String(p.numero).padStart(2, "0")}</span></div>`,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    tooltipAnchor: [0, -40],
  });

/** Leaflet só existe no navegador: carregamos dentro do efeito. */
export const Mapa = React.forwardRef<MapaHandle, Props>(function Mapa(
  { centro, pins, selecionado, onSelecionar, enquadrar, raio, voce, limites, onZoom },
  ref,
) {
  const el = React.useRef<HTMLDivElement>(null);
  const L = React.useRef<typeof Leaflet | null>(null);
  const map = React.useRef<Leaflet.Map | null>(null);
  const tiles = React.useRef<Leaflet.TileLayer | null>(null);
  const layer = React.useRef<Leaflet.LayerGroup | null>(null);
  const extras = React.useRef<Leaflet.LayerGroup | null>(null);
  const markers = React.useRef(new Map<string, { m: Leaflet.Marker; p: Pin }>());
  const [pronto, setPronto] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const onSel = React.useRef(onSelecionar);
  onSel.current = onSelecionar;
  const onZ = React.useRef(onZoom);
  onZ.current = onZoom;

  React.useImperativeHandle(ref, () => ({
    area: () => {
      const b = map.current?.getBounds();
      return b ? { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } : null;
    },
    zoom: (d) => (d > 0 ? map.current?.zoomIn() : map.current?.zoomOut()),
    nivel: () => map.current?.getZoom() ?? 13,
  }));

  React.useEffect(() => {
    let cancel = false;
    import("leaflet").then((mod) => {
      if (cancel || !el.current || map.current) return;
      L.current = mod;
      map.current = mod.map(el.current, { zoomControl: false, attributionControl: true }).setView([centro.lat, centro.lng], 13);
      map.current.on("zoomend", () => onZ.current?.(map.current!.getZoom()));
      layer.current = mod.layerGroup().addTo(map.current);
      extras.current = mod.layerGroup().addTo(map.current);
      setPronto(true);
      onZ.current?.(13);
    });
    return () => {
      cancel = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa claro/escuro acompanha o tema; o CSS tinge de roxo.
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

  // Pinos numerados
  React.useEffect(() => {
    if (!pronto || !L.current || !layer.current) return;
    layer.current.clearLayers();
    markers.current.clear();
    for (const p of pins) {
      const m = L.current
        .marker([p.lat, p.lng], { icon: icone(L.current, p, false), keyboard: true, title: p.nome, riseOnHover: true })
        .bindTooltip(p.nome, { direction: "top", className: "lead-tip" })
        .on("click", () => onSel.current(p.id));
      m.addTo(layer.current);
      markers.current.set(p.id, { m, p });
    }
  }, [pronto, pins]);

  // Selecionado: pino maior, na frente, e o mapa vai até ele.
  React.useEffect(() => {
    if (!L.current) return;
    for (const [id, { m, p }] of markers.current) {
      const ativo = id === selecionado;
      m.setIcon(icone(L.current, p, ativo));
      m.setZIndexOffset(ativo ? 1000 : 0);
      if (ativo && map.current) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.current.panTo(m.getLatLng(), { animate: !reduce });
      }
    }
  }, [selecionado, pins]);

  // Raio, "você está aqui" e contorno da cidade.
  React.useEffect(() => {
    if (!pronto || !L.current || !extras.current) return;
    extras.current.clearLayers();
    if (limites)
      L.current
        .rectangle(
          [
            [limites.south, limites.west],
            [limites.north, limites.east],
          ],
          { className: "lead-limites", interactive: false },
        )
        .addTo(extras.current);
    if (raio) L.current.circle([raio.lat, raio.lng], { radius: raio.km * 1000, className: "lead-raio", interactive: false }).addTo(extras.current);
    if (voce) L.current.circleMarker([voce.lat, voce.lng], { radius: 6, className: "lead-voce", interactive: false }).addTo(extras.current);
  }, [pronto, raio, voce, limites]);

  // Enquadramento
  const key = enquadrar?.key;
  React.useEffect(() => {
    if (!pronto || !map.current || !L.current || !enquadrar) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (enquadrar.bounds) {
      const b = enquadrar.bounds;
      map.current.fitBounds(
        [
          [b.south, b.west],
          [b.north, b.east],
        ],
        { padding: [48, 48], animate: !reduce, maxZoom: 16 },
      );
    } else if (enquadrar.centro) {
      map.current.setView([enquadrar.centro.lat, enquadrar.centro.lng], enquadrar.zoom ?? 13, { animate: !reduce });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, key]);

  return <div ref={el} className="lead-map size-full" role="application" aria-label="Mapa das empresas encontradas" />;
});
