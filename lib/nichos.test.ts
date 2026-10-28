import { describe, expect, it } from "vitest";
import { GRUPOS_NICHOS, NICHOS_DESTAQUE } from "./nichos";
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
