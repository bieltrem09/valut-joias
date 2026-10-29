import { describe, expect, it } from "vitest";
import { acharLugares, cidadeDoEndereco, ehLinkAvaliacao, fichaDoLugar, hostGoogle, pistasDoLink } from "./ficha-google";

describe("pistasDoLink", () => {
  it("lê chave, nome e coordenadas do link do Maps", () => {
    const p = pistasDoLink([
      "https://www.google.com/maps/place/Coco+Bambu+Ribeir%C3%A3o+Preto/@-21.22,-47.83,17z/data=!4m2!3m1!1s0x94b9b9500adbec2b:0x33772b6884113ec6",
    ]);
    expect(p.chave).toBe("0x94b9b9500adbec2b:0x33772b6884113ec6");
    expect(p.nome).toBe("Coco Bambu Ribeirão Preto");
    expect(p.lat).toBe(-21.22);
  });
  it("lê o id do lugar do link de avaliação", () => {
    expect(pistasDoLink(["https://search.google.com/local/writereview?placeid=ChIJK-zbClC5uZQRxj4RhGgrdzM"]).placeId).toBe("ChIJK-zbClC5uZQRxj4RhGgrdzM");
  });
});

describe("links", () => {
  it("só aceita endereços do Google", () => {
    expect(hostGoogle("https://maps.app.goo.gl/abc")).toBe(true);
    expect(hostGoogle("https://g.page/r/abc/review")).toBe(true);
    expect(hostGoogle("https://evil.com/maps")).toBe(false);
  });
  it("reconhece link de avaliação", () => {
    expect(ehLinkAvaliacao("https://g.page/r/CfigX/review")).toBe(true);
    expect(ehLinkAvaliacao("https://maps.app.goo.gl/abc")).toBe(false);
  });
  it("tira a cidade do endereço", () => {
    expect(cidadeDoEndereco("Av. X, 900 - Vila do Golfe, Ribeirão Preto - SP, 14027-250")).toBe("Ribeirão Preto");
  });
});

describe("fichaDoLugar", () => {
  const lugar: unknown[] = [];
  lugar[2] = ["Av. Luiz Eduardo Toledo Prado, 900 - Vila do Golfe", "Ribeirão Preto - SP", "14027-250"];
  lugar[4] = [null, null, null, ["https://search.google.com/local/reviews?placeid=ChIJK-zbClC5uZQRxj4RhGgrdzM"], null, null, null, 4.7, 11733];
  lugar[7] = ["http://www.cocobambu.com/"];
  lugar[10] = "0x94b9b9500adbec2b:0x33772b6884113ec6";
  lugar[11] = "Coco Bambu Ribeirão Preto";
  lugar[13] = ["Restaurante"];
  lugar[39] = "Av. Luiz Eduardo Toledo Prado, 900 - Vila do Golfe, Ribeirão Preto - SP, 14027-250";
  lugar[50] = [["//lh3.googleusercontent.com/a-/avatar=s40"], ["https://lh3.googleusercontent.com/grass-cs/ABC=w360-h480-k-no"]];
  lugar[60] = ["(16) 3904-3737"];

  it("acha o lugar dentro da resposta", () => {
    expect(acharLugares([null, [[lugar]]])).toHaveLength(1);
  });
  it("monta a ficha", () => {
    const f = fichaDoLugar(lugar);
    expect(f).toMatchObject({
      nome: "Coco Bambu Ribeirão Preto",
      cidade: "Ribeirão Preto",
      categoria: "Restaurante",
      telefone: "(16) 3904-3737",
      rating: 4.7,
      totalAvaliacoes: 11733,
      placeId: "ChIJK-zbClC5uZQRxj4RhGgrdzM",
      fotoUrl: "https://lh3.googleusercontent.com/grass-cs/ABC=w800-h600-k-no",
    });
  });
});
