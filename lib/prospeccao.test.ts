import { describe, expect, it } from "vitest";
import { celular, distanciaKm, qualificar, whatsappUrl, type LugarBruto } from "./prospeccao";

const base: LugarBruto = {
  placeId: "x",
  nome: "Teste",
  categoria: "Pizzaria",
  endereco: null,
  lat: null,
  lng: null,
  telefone: null,
  website: null,
  mapsUrl: null,
  rating: null,
  totalAvaliacoes: null,
  status: "OPERATIONAL",
};

describe("qualificar", () => {
  it("nota alta, poucas avaliações, celular e sem site = prioridade máxima", () => {
    const q = qualificar({ ...base, rating: 4.8, totalAvaliacoes: 32, telefone: "(19) 99804-4635" });
    expect(q.score).toBe(100);
    expect(q.prioridade).toBe("maxima");
  });

  it("referência no Google com site pontua baixo", () => {
    const q = qualificar({ ...base, rating: 4.5, totalAvaliacoes: 2415, telefone: "(19) 3444-6089", website: "https://x.com" });
    expect(q.score).toBe(3 + 18 + 15 + 6 + 5);
    expect(q.prioridade).toBe("baixa");
  });

  it("fechado temporariamente derruba", () => {
    const q = qualificar({ ...base, rating: 4.8, totalAvaliacoes: 30, telefone: "(19) 99804-4635", status: "CLOSED_TEMPORARILY" });
    expect(q.score).toBe(60);
  });

  it("todo ponto tem motivo", () => {
    const q = qualificar({ ...base, rating: 4.1, totalAvaliacoes: 120 });
    expect(q.score).toBe(q.motivos.reduce((a, m) => a + m.pontos, 0) + 5);
  });
});

describe("telefone", () => {
  it("reconhece celular", () => {
    expect(celular("(19) 98719-8900")).toBe(true);
    expect(celular("+55 19 98719-8900")).toBe(true);
    expect(celular("(19) 3648-7897")).toBe(false);
  });
  it("monta link do WhatsApp só para celular", () => {
    expect(whatsappUrl("(19) 98719-8900")).toBe("https://wa.me/5519987198900");
    expect(whatsappUrl("(19) 3648-7897")).toBeNull();
  });
});

describe("distanciaKm", () => {
  it("Limeira → Americana ≈ 20 km", () => {
    const d = distanciaKm({ lat: -22.5647, lng: -47.4017 }, { lat: -22.7392, lng: -47.3312 });
    expect(d).toBeGreaterThan(18);
    expect(d).toBeLessThan(22);
  });
});
