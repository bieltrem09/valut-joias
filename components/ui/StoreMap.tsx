'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/data/site';
import { cn } from '@/lib/format';

/**
 * Mapa da loja.
 * - Com NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Google Maps JavaScript API com estilo
 *   próprio da VALUT (ivory, mármore e dourado), sem pontos de interesse.
 * - Sem chave: incorporação oficial do Google Maps (não precisa de chave), com
 *   tratamento de cor em CSS para conversar com o site. A atribuição do Google
 *   continua sempre visível.
 *
 * `interactive` controla se o mapa recebe toque/scroll (evita "prender" a
 * rolagem da página quando o dedo passa por cima do mapa).
 */
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Deslocamento (px) do centro do mapa incorporado: o iframe sobe para esconder o cartão do Google no topo. */
export const EMBED_OFFSET = 56;
export const MAP_PIN_OFFSET = API_KEY ? 0 : EMBED_OFFSET;

const VALUT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f4f1ea' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6252' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f4f1ea' }, { weight: 3 }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ece6da' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#efe7d6' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#e6d7b0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#b79342' }, { weight: 0.6 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a7f6a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cdd8d5' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cbbfa6' }] },
];

type GoogleNS = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => { setOptions: (o: Record<string, unknown>) => void; setCenter: (c: unknown) => void };
    Geocoder: new () => { geocode: (req: { address: string }, cb: (res: { geometry: { location: unknown } }[] | null, status: string) => void) => void };
  };
};

let loader: Promise<GoogleNS> | null = null;
function loadGoogleMaps(key: string) {
  const w = window as unknown as { google?: GoogleNS; __valutMapsReady?: () => void };
  if (w.google?.maps) return Promise.resolve(w.google);
  loader ??= new Promise<GoogleNS>((resolve, reject) => {
    w.__valutMapsReady = () => resolve(w.google!);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=pt-BR&region=BR&callback=__valutMapsReady`;
    s.async = true;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return loader;
}

export function StoreMap({ interactive, className }: { interactive: boolean; className?: string }) {
  return API_KEY ? <StyledMap apiKey={API_KEY} interactive={interactive} className={className} /> : <EmbedMap interactive={interactive} className={className} />;
}

function EmbedMap({ interactive, className }: { interactive: boolean; className?: string }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(site.store.mapsQuery)}&z=16&hl=pt-BR&output=embed`;
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-marble', className)}>
      <iframe
        title={`Mapa: VALUT no ${site.store.venue}, ${site.store.street}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="map-tint absolute inset-x-0 bottom-0 w-full border-0"
        style={{ top: -EMBED_OFFSET * 2, height: `calc(100% + ${EMBED_OFFSET * 2}px)`, pointerEvents: interactive ? 'auto' : 'none' }}
        tabIndex={interactive ? 0 : -1}
      />
      {/* véu quente que aproxima o mapa da paleta ivory/dourado */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#efe2c6] opacity-30 mix-blend-multiply" />
    </div>
  );
}

function StyledMap({ apiKey, interactive, className }: { apiKey: string; interactive: boolean; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<{ setOptions: (o: Record<string, unknown>) => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGoogleMaps(apiKey)
      .then((g) => {
        if (!alive || !el.current) return;
        const m = new g.maps.Map(el.current, {
          zoom: 16,
          center: { lat: -23.55, lng: -46.63 },
          styles: VALUT_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'none',
          backgroundColor: '#f4f1ea',
        });
        map.current = m;
        new g.maps.Geocoder().geocode({ address: site.store.mapsQuery }, (res, status) => {
          if (status === 'OK' && res?.[0]) m.setCenter(res[0].geometry.location);
        });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [apiKey]);

  useEffect(() => {
    map.current?.setOptions({ gestureHandling: interactive ? 'greedy' : 'none' });
  }, [interactive]);

  if (failed) return <EmbedMap interactive={interactive} className={className} />;
  return <div ref={el} role="region" aria-label={`Mapa: VALUT no ${site.store.venue}`} className={cn('absolute inset-0 bg-marble', className)} />;
}
