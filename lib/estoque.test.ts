import { describe, expect, it } from "vitest";
import { margem, resumoEstoque, situacao, validarProduto } from "./estoque";

describe("situacao", () => {
  it("esgotado, baixo e ok", () => {
    expect(situacao(0, 5)).toBe("esgotado");
    expect(situacao(-2, 0)).toBe("esgotado");
    expect(situacao(5, 5)).toBe("baixo");
    expect(situacao(6, 5)).toBe("ok");
    expect(situacao(1, 0)).toBe("ok");
  });
});

describe("margem", () => {
  it("é sobre o preço de venda", () => {
    expect(margem(100, 60)).toBeCloseTo(0.4);
    expect(margem(0, 10)).toBeNull();
  });
});

describe("resumoEstoque", () => {
  it("soma o que tem em mãos e conta alertas", () => {
    const r = resumoEstoque([
      { quantidade: 10, estoqueMinimo: 2, custo: 12.5, preco: 39.9 },
      { quantidade: 2, estoqueMinimo: 3, custo: 20, preco: 59.9 },
      { quantidade: 0, estoqueMinimo: 1, custo: 8, preco: 25 },
      { quantidade: -1, estoqueMinimo: 0, custo: 5, preco: 10 },
    ]);
    expect(r).toEqual({ produtos: 4, unidades: 12, valorCusto: 165, valorVenda: 518.8, lucroPotencial: 353.8, baixos: 1, esgotados: 2 });
  });
});

describe("validarProduto", () => {
  it("limpa textos, arredonda valores e descarta detalhes vazios", () => {
    const r = validarProduto({
      nome: "  Placa NFC Google  ",
      custo: 12.345,
      preco: 49.9,
      quantidade: 30.7,
      estoqueMinimo: 5,
      sku: " ",
      atributos: [
        { nome: "Cor", valor: "Preto" },
        { nome: "", valor: "x" },
      ],
    });
    expect(r.ok && r.dados).toMatchObject({
      nome: "Placa NFC Google",
      custo: 12.35,
      quantidade: 30,
      sku: null,
      unidade: "un",
      atributos: [{ nome: "Cor", valor: "Preto" }],
    });
  });
  it("recusa nome vazio e números negativos", () => {
    expect(validarProduto({ nome: " ", custo: 1, preco: 1, estoqueMinimo: 0 })).toEqual({ ok: false, error: "Dê um nome ao produto." });
    expect(validarProduto({ nome: "X", custo: -1, preco: 1, estoqueMinimo: 0 }).ok).toBe(false);
    expect(validarProduto({ nome: "X", custo: 1, preco: NaN, estoqueMinimo: 0 }).ok).toBe(false);
  });
});
