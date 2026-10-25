import { describe, expect, it } from "vitest";
import { chaveLead, hostDoMaps, lerLinkMaps, urlBuscaMaps, urlEmbedMaps } from "./maps-link";

describe("lerLinkMaps", () => {
  it("lê o texto do Compartilhar do celular", () => {
    const r = lerLinkMaps("Smash Burger Limeira\nR. Boa Morte, 123 - Centro, Limeira - SP, 13480-000\nhttps://maps.app.goo.gl/AbC123xyz");
    expect(r).toMatchObject({
      nome: "Smash Burger Limeira",
      endereco: "R. Boa Morte, 123 - Centro, Limeira - SP, 13480-000",
      url: "https://maps.app.goo.gl/AbC123xyz",
      curto: true,
      lat: null,
    });
  });

  it("lê nome, coordenadas do lugar e chave do link completo", () => {
    const r = lerLinkMaps(
      "https://www.google.com/maps/place/Smash+Burger+Limeira/@-22.5650,-47.4100,17z/data=!3m1!4b1!4m6!3m5!1s0x94c8812345abcdef:0x5b0c1d2e3f4a5b6c!8m2!3d-22.5642!4d-47.4045!16s%2Fg%2F11abc",
    );
    expect(r.nome).toBe("Smash Burger Limeira");
    expect(r.lat).toBe(-22.5642);
    expect(r.lng).toBe(-47.4045);
    expect(r.chave).toBe("0x94c8812345abcdef:0x5b0c1d2e3f4a5b6c");
    expect(r.curto).toBe(false);
  });

  it("usa o centro da tela quando não há !3d/!4d", () => {
    const r = lerLinkMaps("https://www.google.com/maps/place/Barbearia+do+Ze/@-22.5,-47.4,15z");
    expect(r).toMatchObject({ nome: "Barbearia do Ze", lat: -22.5, lng: -47.4 });
  });

  it("ignora links que não são do Google Maps", () => {
    const r = lerLinkMaps("Loja X\nhttps://exemplo.com/maps/place/x");
    expect(r.url).toBeNull();
    expect(r.nome).toBe("Loja X");
  });

  it("aceita só o nome digitado", () => {
    expect(lerLinkMaps("  Pizzaria Bella  ")).toMatchObject({ nome: "Pizzaria Bella", url: null, endereco: null });
  });
});

describe("hostDoMaps", () => {
  it("aceita os domínios do Maps e recusa os outros", () => {
    expect(hostDoMaps("https://maps.app.goo.gl/x")).toBe(true);
    expect(hostDoMaps("https://www.google.com.br/maps/place/x")).toBe(true);
    expect(hostDoMaps("https://www.google.com/search?q=x")).toBe(false);
    expect(hostDoMaps("http://maps.app.goo.gl/x")).toBe(false);
    expect(hostDoMaps("https://evil.com/maps")).toBe(false);
  });
});

describe("urlBuscaMaps", () => {
  it("busca na cidade", () => {
    expect(urlBuscaMaps({ segmento: "hamburgueria", local: "Limeira, SP" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=hamburgueria%20em%20Limeira%2C%20SP",
    );
  });
  it("busca perto de um ponto", () => {
    expect(urlBuscaMaps({ segmento: "barbearia", perto: { lat: -22.5647, lng: -47.4017 } })).toBe(
      "https://www.google.com/maps/search/barbearia/@-22.56470,-47.40170,15z",
    );
  });
});

describe("chaveLead", () => {
  it("prefere a chave do Google", () => {
    expect(chaveLead({ chave: "0xa:0xb", nome: "X" })).toBe("maps:0xa:0xb");
  });
  it("normaliza nome e endereço", () => {
    expect(chaveLead({ chave: null, nome: "Açaí do João!", endereco: "R. São Paulo, 10" })).toBe("manual:acai-do-joao:r-sao-paulo-10");
  });
});

describe("urlEmbedMaps", () => {
  it("monta a busca na cidade", () => {
    const u = new URL(urlEmbedMaps({ segmento: "pizzaria", local: "Limeira, SP" }));
    expect(u.origin).toBe("https://maps.google.com");
    expect(u.searchParams.get("q")).toBe("pizzaria em Limeira, SP");
    expect(u.searchParams.get("output")).toBe("embed");
  });
  it("sem nicho mostra só a cidade", () => {
    expect(new URL(urlEmbedMaps({ local: "Limeira, SP" })).searchParams.get("q")).toBe("Limeira, SP");
  });
  it("perto de mim usa coordenadas e zoom do raio", () => {
    const u = new URL(urlEmbedMaps({ segmento: "barbearia", perto: { lat: -22.5, lng: -47.4 }, raioKm: 1 }));
    expect(u.searchParams.get("q")).toBe("barbearia near -22.50000,-47.40000");
    expect(u.searchParams.get("z")).toBe("16");
  });
});
