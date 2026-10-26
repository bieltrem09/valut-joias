import { describe, expect, it } from "vitest";
import { ESTILOS } from "./mentora-estilos";
import { ETAPAS, ROTULOS, falaParaOuvir, falaPronta } from "./mentora";

describe("estilos de vendedor", () => {
  const todos = [...ETAPAS.flatMap((e) => e.roteiros), ...ESTILOS.flatMap((e) => e.roteiros)];

  it("não repete id de roteiro (favoritos dependem disso)", () => {
    const ids = todos.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("só usa marcadores que a tela sabe preencher", () => {
    for (const r of todos) for (const m of r.fala.matchAll(/\{(\w+)\}/g)) expect(Object.keys(ROTULOS), `${r.id}: {${m[1]}}`).toContain(m[1]);
  });

  it("cada estilo tem comportamento e vários roteiros", () => {
    for (const e of ESTILOS) {
      expect(e.comportamento.length).toBeGreaterThanOrEqual(4);
      expect(e.roteiros.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("todo preço vem com R$ na frente", () => {
    for (const r of todos) for (const m of r.fala.matchAll(/(.{3})\{preco\}/g)) expect(m[1], r.id).toBe("R$ ");
  });

  it("preenche o preço", () => {
    const r = ESTILOS.find((e) => e.id === "balcao")!.roteiros.find((x) => x.id === "balcao-preco")!;
    expect(falaPronta(r.fala, { preco: "80" })).toContain("R$ 80 a unidade");
  });

  it("para ouvir, campo vazio vira expressão natural", () => {
    expect(falaParaOuvir("O valor dela é R$ {preco} a unidade, aqui no {estabelecimento}.", {})).toBe(
      "O valor dela é tantos reais a unidade, aqui no seu negócio.",
    );
    expect(falaParaOuvir("Fica R$ {preco}.", { preco: "80" })).toBe("Fica R$ 80.");
  });
});
