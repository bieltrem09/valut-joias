import { describe, expect, it } from "vitest";
import { limparFala, notaVoz, prosodia } from "./fala-expressiva";

describe("prosodia", () => {
  it("divide em frases e dá emoção a cada uma", () => {
    const t = prosodia("“Bom dia, bom dia! Tudo bem? Rapidinho: vocês hoje estão no Google, né?”", "direto");
    expect(t.map((x) => x.texto)).toEqual(["Bom dia, bom dia!", "Tudo bem?", "Rapidinho,", "vocês hoje estão no Google, né?"]);
    // saudação com exclamação sobe e acelera; pergunta sobe e pausa mais
    expect(t[0].pitch).toBeGreaterThan(1.1);
    expect(t[1].pitch).toBeGreaterThan(t[2].pitch);
    expect(t[3].pausaMs).toBeGreaterThan(t[2].pausaMs);
  });

  it("reticências viram respiro", () => {
    const t = prosodia("Como é o seu nome? … Prazer, eu sou o Gabriel.", "leve");
    expect(t).toHaveLength(2);
    expect(t[0].pausaMs).toBeGreaterThanOrEqual(500);
  });

  it("o tom do roteiro muda a base", () => {
    const [leve] = prosodia("Isso aqui é simples.", "leve");
    const [direto] = prosodia("Isso aqui é simples.", "direto");
    expect(direto.rate).toBeGreaterThan(leve.rate);
  });

  it("não fala marcador vazio nem aspas", () => {
    expect(limparFala("“O valor é R$ [preço] a unidade.”")).toBe("O valor é R$ a unidade.");
  });
});

describe("notaVoz", () => {
  it("prefere voz natural em português do Brasil", () => {
    const vozes = [
      { name: "Microsoft Maria - Portuguese (Brazil)", lang: "pt-BR", localService: true },
      { name: "Microsoft Francisca Online (Natural) - Portuguese (Brazil)", lang: "pt-BR", localService: false },
      { name: "Google português do Brasil", lang: "pt-BR", localService: false },
      { name: "Joana", lang: "pt-PT", localService: true },
      { name: "Samantha", lang: "en-US", localService: true },
    ];
    const melhor = [...vozes].sort((a, b) => notaVoz(b) - notaVoz(a))[0];
    expect(melhor.name).toMatch(/Francisca/);
    expect(notaVoz(vozes[4])).toBe(-1);
  });
});
