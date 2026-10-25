"use client";

import * as React from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";

export type Pin = { id: string; lat: number; lng: number; nome: string; prioridade: "maxima" | "alta" | "media" | "baixa" };
export type Area = { south: number; west: number; north: number; east: number };

export type MapaHandle = { area: () => Area | null };

type Props = {
  centro: { lat: number; lng: number };
  pins: Pin[];
  selecionado: string | null;
  onSelecionar: (id: string) => void;
  /** Ajusta o enquadramento quando muda (resultado novo, cidade nova). */
  enquadrar?: { key: string; bounds?: Area; centro?: { lat: number; lng: number }; zoom?: number } | null;
  raio?: { lat: number; lng: number; km: number } | null;
  voce?: { lat: number; lng: number } | null;
};

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

/** Leaflet só existe no navegador: carregamos dentro do efeito. */
export const Mapa = React.forwardRef<MapaHandle, Props>(function Mapa({ centro, pins, selecionado, onSelecionar, enquadrar, raio, voce }, ref) {
  const el = React.useRef<HTMLDivElement>(null);
  const L = React.useRef<typeof Leaflet | null>(null);
  const map = React.useRef<Leaflet.Map | null>(null);
  const tiles = React.useRef<Leaflet.TileLayer | null>(null);
  const layer = React.useRef<Leaflet.LayerGroup | null>(null);
  const extras = React.useRef<Leaflet.LayerGroup | null>(null);
  const markers = React.useRef(new Map<string, Leaflet.CircleMarker>());
  const [pronto, setPronto] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const onSel = React.useRef(onSelecionar);
  onSel.current = onSelecionar;

  React.useImperativeHandle(ref, () => ({
    area: () => {
      const b = map.current?.getBounds();
      return b ? { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } : null;
    },
  }));

  React.useEffect(() => {
    let cancel = false;
    import("leaflet").then((mod) => {
      if (cancel || !el.current || map.current) return;
      L.current = mod;
      map.current = mod.map(el.current, { zoomControl: false, attributionControl: true }).setView([centro.lat, centro.lng], 13);
      mod.control.zoom({ position: "bottomright" }).addTo(map.current);
      layer.current = mod.layerGroup().addTo(map.current);
      extras.current = mod.layerGroup().addTo(map.current);
      setPronto(true);
    });
    return () => {
      cancel = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa claro/escuro acompanha o tema.
  React.useEffect(() => {
    if (!pronto || !L.current || !map.current) return;
    tiles.current?.remove();
    tiles.current = L.current
      .tileLayer(resolvedTheme === "dark" ? TILES.dark : TILES.light, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      })
      .addTo(map.current);
  }, [pronto, resolvedTheme]);

  // Pins
  React.useEffect(() => {
    if (!pronto || !L.current || !layer.current) return;
    layer.current.clearLayers();
    markers.current.clear();
    for (const p of pins) {
      const m = L.current
        .circleMarker([p.lat, p.lng], { radius: 7, className: `lead-pin lead-pin-${p.prioridade}`, fill: true, fillOpacity: 1, weight: 2 })
        .bindTooltip(p.nome, { direction: "top", offset: [0, -8], className: "lead-tip" })
        .on("click", () => onSel.current(p.id));
      m.addTo(layer.current);
      markers.current.set(p.id, m);
    }
  }, [pronto, pins]);

  // Selecionado: destaca e traz para frente.
  React.useEffect(() => {
    for (const [id, m] of markers.current) {
      const node = m.getElement();
      if (!node) continue;
      node.classList.toggle("is-selected", id === selecionado);
      if (id === selecionado) {
        m.bringToFront();
        m.setRadius(10);
        if (map.current && !map.current.getBounds().contains(m.getLatLng())) map.current.panTo(m.getLatLng());
      } else m.setRadius(7);
    }
  }, [selecionado, pins]);

  // Raio de busca e "você está aqui".
  React.useEffect(() => {
    if (!pronto || !L.current || !extras.current) return;
    extras.current.clearLayers();
    if (raio) L.current.circle([raio.lat, raio.lng], { radius: raio.km * 1000, className: "lead-raio", interactive: false }).addTo(extras.current);
    if (voce) L.current.circleMarker([voce.lat, voce.lng], { radius: 6, className: "lead-voce", interactive: false }).addTo(extras.current);
  }, [pronto, raio, voce]);

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
        { padding: [24, 24], animate: !reduce, maxZoom: 16 },
      );
    } else if (enquadrar.centro) {
      map.current.setView([enquadrar.centro.lat, enquadrar.centro.lng], enquadrar.zoom ?? 13, { animate: !reduce });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, key]);

  return <div ref={el} className="lead-map size-full" role="application" aria-label="Mapa das empresas encontradas" />;
});
