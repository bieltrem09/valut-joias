import { describe, expect, it } from "vitest";
import { GRUPOS_NICHOS, NICHOS_DESTAQUE, alternarNicho, dividirNichos } from "./nichos";
import { regraDoNicho } from "./osm";

describe("nichos da prospecção", () => {
  const todos = [...new Set([...NICHOS_DESTAQUE, ...GRUPOS_NICHOS.flatMap((g) => g.nichos)])];
  it("todo nicho listado tem regra de busca (etiqueta do mapa, não só o nome)", () => {
    const semRegra = todos.filter((n) => regraDoNicho(n).tags.length === 0);
    expect(semRegra).toEqual([]);
  });
  it("destaques estão nos grupos", () => {
    const nosGrupos = new Set(GRUPOS_NICHOS.flatMap((g) => g.nichos));
    expect(NICHOS_DESTAQUE.filter((n) => !nosGrupos.has(n))).toEqual([]);
  });
});

describe("vários nichos de uma vez", () => {
  it("divide por vírgula, sem repetir nem quebrar nome com 'e'", () => {
    expect(dividirNichos(" sorveteria,  autopeças , Sorveteria, buffet e eventos ")).toEqual(["sorveteria", "autopeças", "buffet e eventos"]);
    expect(dividirNichos("pizzaria + açaí")).toEqual(["pizzaria", "açaí"]);
    expect(dividirNichos("")).toEqual([]);
  });
  it("tocar no botão põe e tira o nicho da busca", () => {
    let t = alternarNicho("", "sorveteria");
    t = alternarNicho(t, "autopeças");
    expect(t).toBe("sorveteria, autopeças");
    expect(alternarNicho(t, "sorveteria")).toBe("autopeças");
  });
});
