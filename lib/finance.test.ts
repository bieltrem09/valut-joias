import { describe, expect, it } from "vitest";
import { cents, composicaoDoReal, resumir, serieDiaria, variacao, type VendaFin } from "./finance";

const venda = (o: Partial<VendaFin>): VendaFin => ({
  data: "2026-10-20",
  valorVenda: 0,
  custoPlaca: 0,
  custoGravacao: 0,
  frete: 0,
  taxaPagamento: 0,
  status: "paga",
  ...o,
});

describe("resumir", () => {
  const vendas = [
    venda({ valorVenda: 149, custoPlaca: 24.3, custoGravacao: 5.1, frete: 14.9, taxaPagamento: 7.44 }),
    venda({ valorVenda: 89.9, custoPlaca: 13.2, custoGravacao: 4.2, frete: 0, taxaPagamento: 0 }),
    venda({ valorVenda: 129.9, status: "pendente" }),
    venda({ valorVenda: 59.9, status: "cancelada", custoPlaca: 9 }),
  ];
  const despesas = [
    { data: "2026-10-20", valor: 112.37 },
    { data: "2026-10-21", valor: 34.9 },
  ];
  const r = resumir(vendas, despesas);

  it("soma só vendas pagas na receita", () => expect(r.receitaBruta).toBe(238.9));
  it("CMV = placa + gravação + frete", () => expect(r.cmv).toBe(cents(24.3 + 5.1 + 14.9 + 13.2 + 4.2)));
  it("lucro bruto", () => expect(r.lucroBruto).toBe(cents(238.9 - 61.7)));
  it("despesas operacionais incluem taxa de pagamento", () => expect(r.despesasOperacionais).toBe(cents(112.37 + 34.9 + 7.44)));
  it("lucro líquido", () => expect(r.lucroLiquido).toBe(cents(238.9 - 61.7 - 154.71)));
  it("gastos = CMV + despesas", () => expect(r.gastos).toBe(cents(r.cmv + r.despesasOperacionais)));
  it("margem líquida", () => expect(r.margemLiquida).toBeCloseTo(r.lucroLiquido / 238.9, 6));
  it("ticket médio só com pagas", () => expect(r.ticketMedio).toBe(cents(238.9 / 2)));
  it("a receber = pendentes", () => {
    expect(r.aReceber).toBe(129.9);
    expect(r.vendasPendentes).toBe(1);
  });

  it("sem vendas não divide por zero", () => {
    const z = resumir([], []);
    expect(z.margemLiquida).toBe(0);
    expect(z.ticketMedio).toBe(0);
  });
});

describe("variacao", () => {
  it("relativa", () => expect(variacao(120, 100)).toBeCloseTo(0.2));
  it("base negativa usa valor absoluto", () => expect(variacao(50, -100)).toBeCloseTo(1.5));
  it("sem base", () => expect(variacao(10, 0)).toBeNull());
  it("zero com zero", () => expect(variacao(0, 0)).toBe(0));
});

describe("serieDiaria", () => {
  it("preenche dias vazios e acumula", () => {
    const s = serieDiaria(
      [venda({ data: "2026-10-01", valorVenda: 100, custoPlaca: 20 }), venda({ data: "2026-10-03", valorVenda: 50, custoPlaca: 10 })],
      [{ data: "2026-10-02", valor: 15 }],
      "2026-10-01",
      "2026-10-03",
    );
    expect(s.map((p) => p.lucro)).toEqual([80, -15, 40]);
    expect(s.at(-1)?.acumulado).toBe(105);
  });
});

describe("composicaoDoReal", () => {
  it("fatias somam 1 quando há lucro", () => {
    const c = composicaoDoReal(resumir([venda({ valorVenda: 200, custoPlaca: 50 })], [{ data: "2026-10-20", valor: 30 }]));
    expect(c.cmv + c.despesas + c.lucro).toBeCloseTo(1);
  });
  it("prejuízo vira fatia própria", () => {
    const c = composicaoDoReal(resumir([venda({ valorVenda: 100, custoPlaca: 50 })], [{ data: "2026-10-20", valor: 80 }]));
    expect(c.lucro).toBe(0);
    expect(c.prejuizo).toBeCloseTo(0.3);
  });
});
