import { describe, expect, it } from "vitest";
import { ETAPAS, falaPronta, montarFala } from "./mentora";

describe("montarFala", () => {
  it("troca os marcadores pelo que foi preenchido", () => {
    expect(
      falaPronta("Oi, {seuNome}! A {estabelecimento} tem {avaliacoes} avaliações.", { seuNome: "Gabriel", estabelecimento: "Cantina X", avaliacoes: "38" }),
    ).toBe("Oi, Gabriel! A Cantina X tem 38 avaliações.");
  });
  it("marca o que falta preencher", () => {
    const p = montarFala("Nota {nota} aqui.", {});
    expect(p).toEqual([{ texto: "Nota " }, { texto: "[nota]", marcador: "nota", preenchido: false }, { texto: " aqui." }]);
  });
  it("o momento vem do tipo de negócio", () => {
    expect(falaPronta("{momento}", { segmento: "Barbearia" })).toBe("quando o cliente se olha no espelho e gosta do corte");
    expect(falaPronta("{momento}", {})).toBe("no momento em que o cliente sai satisfeito");
  });
});

describe("roteiros", () => {
  it("ids únicos e só marcadores conhecidos", () => {
    const ids = ETAPAS.flatMap((e) => e.roteiros.map((r) => r.id));
    expect(new Set(ids).size).toBe(ids.length);
    const conhecidos = ["estabelecimento", "segmento", "nota", "avaliacoes", "seuNome", "cidade", "vizinho", "momento"];
    for (const r of ETAPAS.flatMap((e) => e.roteiros)) for (const m of r.fala.matchAll(/\{(\w+)\}/g)) expect(conhecidos).toContain(m[1]);
  });
});
