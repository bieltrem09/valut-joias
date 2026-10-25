import { describe, expect, it } from "vitest";
import { elementoParaLugar, fotoDe, montarConsulta, nominatimParaLugar, regraDoNicho, semRepetidos, areaDaRelacao, tipoNominatim } from "./osm";
import { qualificarAberto } from "./prospeccao";

describe("regraDoNicho", () => {
  it("entende o nicho em português, com ou sem acento", () => {
    expect(regraDoNicho("Hamburgueria").rotulo).toBe("Hamburgueria");
    expect(regraDoNicho("açaí").rotulo).toBe("Açaí");
    expect(regraDoNicho("clínica odontológica").rotulo).toBe("Clínica odontológica");
    expect(regraDoNicho("pet shop").rotulo).toBe("Pet shop");
  });
  it("sem regra, busca pelo nome tolerando acento", () => {
    const r = regraDoNicho("Chaveiro");
    expect(r.tags).toEqual([]);
    expect(r.nome).toBe("[cç]h[aáàâã]v[eéê][ií]r[oóôõ]");
  });
});

describe("montarConsulta", () => {
  it("na cidade usa a área da relação", () => {
    const q = montarConsulta("pizzaria", { tipo: "area", areaId: areaDaRelacao(298439) });
    expect(q).toContain("area(id:3600298439)->.alvo;");
    expect(q).toContain('nwr["cuisine"~"pizza",i]["name"](area.alvo);');
    expect(q).toContain('nwr["name"~"pizz",i]["shop"](area.alvo);');
    expect(q).toMatch(/out center tags 120;$/);
  });
  it("perto de mim usa around com o raio em metros", () => {
    const q = montarConsulta("barbearia", { tipo: "raio", lat: -22.5647, lng: -47.4017, metros: 3000 });
    expect(q).toContain("(around:3000,-22.564700,-47.401700)");
    expect(q).not.toContain("area(");
  });
});

describe("elementoParaLugar", () => {
  it("lê nome, endereço, celular e Instagram", () => {
    const l = elementoParaLugar(
      {
        type: "node",
        id: 42,
        lat: -22.56,
        lon: -47.4,
        tags: {
          name: "Smash Burger",
          amenity: "fast_food",
          cuisine: "burger",
          "addr:street": "Rua Boa Morte",
          "addr:housenumber": "123",
          "addr:suburb": "Centro",
          phone: "+55 19 3441-0000; +55 19 99876-5432",
          website: "https://instagram.com/smashburger",
          opening_hours: "Mo-Su 18:00-23:00",
        },
      },
      "Limeira",
    )!;
    expect(l).toMatchObject({
      placeId: "osm:node/42",
      nome: "Smash Burger",
      categoria: "Hamburgueria",
      endereco: "Rua Boa Morte, 123 - Centro - Limeira",
      telefone: "+55 19 99876-5432",
      website: null,
      instagram: "https://instagram.com/smashburger",
    });
  });
  it("usa o centro de prédios e ignora quem não tem nome", () => {
    expect(elementoParaLugar({ type: "way", id: 1, center: { lat: 1, lon: 2 }, tags: { name: "X", shop: "bakery" } })).toMatchObject({
      lat: 1,
      lng: 2,
      categoria: "Padaria",
    });
    expect(elementoParaLugar({ type: "node", id: 2, lat: 1, lon: 2, tags: { shop: "bakery" } })).toBeNull();
  });
});

describe("semRepetidos", () => {
  it("fica com a versão mais completa da mesma empresa", () => {
    const a = elementoParaLugar({ type: "node", id: 1, lat: -22.5601, lon: -47.4001, tags: { name: "Pizzaria Bella", amenity: "restaurant" } })!;
    const b = elementoParaLugar({
      type: "way",
      id: 2,
      center: { lat: -22.5602, lon: -47.4002 },
      tags: { name: "Pizzaria Bella", amenity: "restaurant", phone: "19 99999-0000" },
    })!;
    expect(semRepetidos([a, b]).map((l) => l.placeId)).toEqual(["osm:way/2"]);
  });
});

describe("qualificarAberto", () => {
  const base = {
    placeId: "x",
    nome: "X",
    categoria: null,
    endereco: null,
    lat: 0,
    lng: 0,
    telefone: null,
    website: null,
    mapsUrl: null,
    rating: null,
    totalAvaliacoes: null,
    status: null,
  };
  it("celular, sem site, Instagram, endereço e horário somam 100", () => {
    const q = qualificarAberto({ ...base, telefone: "(19) 99876-5432", instagram: "x", endereco: "R. A, 1", horario: "Mo-Fr" });
    expect(q.score).toBe(100);
    expect(q.prioridade).toBe("maxima");
  });
  it("sem contato e com site fica baixa", () => {
    const q = qualificarAberto({ ...base, website: "https://x.com" });
    expect(q.score).toBe(18);
    expect(q.prioridade).toBe("baixa");
  });
});

describe("tipoNominatim", () => {
  it("traduz o nicho para o tipo do OSM", () => {
    expect(tipoNominatim("restaurante")).toBe("restaurant");
    expect(tipoNominatim("hamburgueria")).toBe("burger");
    expect(tipoNominatim("clínica")).toBe("clinic");
    expect(tipoNominatim("pet shop")).toBe("pet");
    expect(tipoNominatim("chaveiro")).toBe("chaveiro");
  });
});

describe("fotoDe", () => {
  it("aceita link de imagem e arquivo do Commons", () => {
    expect(fotoDe({ image: "https://x.com/a.jpg" })).toBe("https://x.com/a.jpg");
    expect(fotoDe({ wikimedia_commons: "File:Fachada boa.jpg" })).toBe("https://commons.wikimedia.org/wiki/Special:FilePath/Fachada%20boa.jpg?width=480");
    expect(fotoDe({ image: "http://inseguro.com/a.jpg" })).toBeNull();
    expect(fotoDe({})).toBeNull();
  });
});

describe("nominatimParaLugar", () => {
  it("monta o lugar com endereço e extratags", () => {
    const l = nominatimParaLugar(
      {
        osm_type: "node",
        osm_id: 7,
        lat: "-22.56",
        lon: "-47.40",
        name: "Cantina X",
        display_name: "Cantina X, Rua A, Limeira",
        type: "restaurant",
        address: { road: "Rua A", house_number: "10", suburb: "Centro", city: "Limeira" },
        extratags: { phone: "+55 19 99876-5432", opening_hours: "Mo-Su 11:00-23:00" },
      },
      "Limeira",
    )!;
    expect(l).toMatchObject({
      placeId: "osm:node/7",
      nome: "Cantina X",
      categoria: "Restaurante",
      endereco: "Rua A, 10 - Centro - Limeira",
      telefone: "+55 19 99876-5432",
    });
  });
});
