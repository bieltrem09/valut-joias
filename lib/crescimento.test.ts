import { describe, expect, it } from "vitest";
import { calcularCrescimento, ganhoAgregado, type Medicao } from "./crescimento";

const m = (data: string, total: number, rating: number | null = 4.7): Medicao => ({ data, total, rating, fonte: "google" });

describe("calcularCrescimento", () => {
  it("sem placa, sem ganho", () => {
    const c = calcularCrescimento([m("2026-10-01", 100)], null, null, "2026-10-25");
    expect(c.ganho).toBeNull();
    expect(c.base).toBeNull();
  });

  it("base = última medição até a instalação", () => {
    const c = calcularCrescimento([m("2026-09-28", 98), m("2026-10-01", 100), m("2026-10-20", 131)], "2026-10-03", null, "2026-10-25");
    expect(c.base).toBe(100);
    expect(c.baseOrigem).toEqual({ tipo: "medicao", data: "2026-10-01" });
    expect(c.ganho).toBe(31);
  });

  it("base informada à mão tem prioridade", () => {
    const c = calcularCrescimento([m("2026-10-01", 100), m("2026-10-20", 131)], "2026-10-03", 104, "2026-10-25");
    expect(c.base).toBe(104);
    expect(c.ganho).toBe(27);
  });

  it("sem medição antes nem base informada: conta da primeira medição depois (piso)", () => {
    const c = calcularCrescimento([m("2026-10-10", 120), m("2026-10-20", 131)], "2026-10-03", null, "2026-10-25");
    expect(c.base).toBe(120);
    expect(c.baseDepoisDaPlaca).toBe(true);
    expect(c.ganho).toBe(11);
  });

  it("ganho exige medição depois da instalação", () => {
    const c = calcularCrescimento([m("2026-10-01", 100)], "2026-10-03", null, "2026-10-25");
    expect(c.ganho).toBeNull();
  });

  it("ritmo por semana só com 7+ dias", () => {
    const curto = calcularCrescimento([m("2026-10-01", 100), m("2026-10-05", 104)], "2026-10-01", null, "2026-10-05");
    expect(curto.ritmoDepois).toBeNull();
    const longo = calcularCrescimento([m("2026-10-01", 100), m("2026-10-15", 128)], "2026-10-01", null, "2026-10-15");
    expect(longo.ritmoDepois).toBeCloseTo(14);
  });

  it("ritmo antes usa só medições antes da placa", () => {
    const c = calcularCrescimento([m("2026-09-01", 90), m("2026-09-15", 94), m("2026-10-01", 100), m("2026-10-15", 128)], "2026-10-01", null, "2026-10-15");
    expect(c.ritmoAntes).toBeCloseTo(((100 - 90) / 30) * 7);
  });
});

describe("ganhoAgregado", () => {
  it("soma empresas com última medição conhecida", () => {
    const s = ganhoAgregado(
      [
        { base: 100, instalacao: "2026-10-01", medicoes: [m("2026-10-01", 100), m("2026-10-03", 106)] },
        { base: 50, instalacao: "2026-10-02", medicoes: [m("2026-10-02", 50), m("2026-10-03", 52)] },
      ],
      "2026-10-03",
    );
    expect(s.map((p) => p.ganho)).toEqual([0, 0, 8]);
    expect(s.at(-1)?.medido).toBe(true);
  });

  it("vazio sem base", () => {
    expect(ganhoAgregado([{ base: null, instalacao: "2026-10-01", medicoes: [m("2026-10-02", 3)] }], "2026-10-03")).toEqual([]);
  });
});
