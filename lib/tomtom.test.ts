import { describe, expect, it } from "vitest";
import { tomtomParaLugar } from "./tomtom";
import { juntarFontes, type LugarAberto } from "./osm";

describe("tomtomParaLugar", () => {
  it("converte o resultado com telefone, site e endereço", () => {
    const l = tomtomParaLugar(
      {
        id: "abc",
        poi: { name: " Studio Bella ", phone: "+55 19 3441-1234; +55 19 99876-5432", url: "studiobella.com.br", categories: ["salão de beleza"] },
        address: { streetName: "Rua Boa Morte", streetNumber: "100", municipalitySubdivision: "Centro", municipality: "Limeira" },
        position: { lat: -22.56, lon: -47.4 },
      },
      "Salão de beleza",
    )!;
    expect(l.placeId).toBe("tomtom:abc");
    expect(l.nome).toBe("Studio Bella");
    expect(l.categoria).toBe("Salão de beleza");
    expect(l.telefone).toBe("+55 19 99876-5432"); // celular primeiro (vira WhatsApp)
    expect(l.website).toBe("https://studiobella.com.br");
    expect(l.endereco).toBe("Rua Boa Morte, 100 - Centro - Limeira");
    expect(l.rating).toBeNull();
  });

  it("instagram no lugar do site vira instagram", () => {
    const l = tomtomParaLugar({ id: "x", poi: { name: "Ateliê", url: "instagram.com/atelie" }, position: { lat: 1, lon: 2 } }, "Estética")!;
    expect(l.website).toBeNull();
    expect(l.instagram).toBe("https://instagram.com/atelie");
    expect(l.categoria).toBe("Estética");
  });

  it("sem nome ou sem posição fica de fora", () => {
    expect(tomtomParaLugar({ id: "1", position: { lat: 1, lon: 2 } }, "X")).toBeNull();
    expect(tomtomParaLugar({ id: "2", poi: { name: "A" } }, "X")).toBeNull();
  });
});

describe("juntarFontes", () => {
  const lugar = (placeId: string, nome: string, lat: number, lng: number): LugarAberto => ({
    placeId,
    nome,
    categoria: null,
    endereco: null,
    lat,
    lng,
    telefone: null,
    website: null,
    mapsUrl: null,
    rating: null,
    totalAvaliacoes: null,
    status: null,
    instagram: null,
    horario: null,
    fotoUrl: null,
  });

  it("não repete a mesma empresa vinda das duas fontes", () => {
    const tt = [lugar("tomtom:1", "Salão Glamour", -22.5647, -47.4017)];
    const osm = [lugar("osm:node/1", "Salao glamour", -22.5649, -47.4015), lugar("osm:node/2", "Espaço Vip", -22.57, -47.41)];
    expect(juntarFontes(tt, osm).map((l) => l.placeId)).toEqual(["tomtom:1", "osm:node/2"]);
  });

  it("mesmo nome longe é outra unidade", () => {
    const tt = [lugar("tomtom:1", "Rede Beleza", -22.56, -47.4)];
    const osm = [lugar("osm:node/9", "Rede Beleza", -22.6, -47.45)];
    expect(juntarFontes(tt, osm)).toHaveLength(2);
  });
});
