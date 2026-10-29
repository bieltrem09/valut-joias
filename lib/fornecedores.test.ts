import { describe, expect, it } from "vitest";
import {
  atrasado,
  custoUnitario,
  extrairProduto,
  linkInstagram,
  mensagemPedido,
  normalizarUrl,
  simularLote,
  urlPublica,
  urlRastreio,
  validarFornecedor,
  validarOferta,
  validarPedido,
} from "./fornecedores";

describe("links", () => {
  it("completa e recusa links", () => {
    expect(normalizarUrl("loja.com.br/placa")).toBe("https://loja.com.br/placa");
    expect(normalizarUrl("javascript:alert(1)")).toBeNull();
    expect(normalizarUrl("abc")).toBeNull();
    expect(linkInstagram("@placas.nfc")).toBe("https://instagram.com/placas.nfc");
  });
  it("só abre endereço público", () => {
    expect(urlPublica("https://produto.mercadolivre.com.br/MLB-1")).toBe(true);
    expect(urlPublica("http://localhost:3000")).toBe(false);
    expect(urlPublica("http://192.168.0.1/admin")).toBe(false);
    expect(urlPublica("http://169.254.169.254/latest")).toBe(false);
    expect(urlPublica("file:///etc/passwd")).toBe(false);
  });
});

describe("validação", () => {
  it("fornecedor precisa de nome e WhatsApp com DDD", () => {
    expect(validarFornecedor({ nome: " " }).ok).toBe(false);
    expect(validarFornecedor({ nome: "Gráfica X", whatsapp: "9999-0000" }).ok).toBe(false);
    const v = validarFornecedor({ nome: "Gráfica X", whatsapp: "(19) 99999-0000", site: "graficax.com.br", nota: 7, prazoDias: "5" });
    expect(v.ok && v.dados).toMatchObject({ site: "https://graficax.com.br/", nota: 5, prazoDias: 5 });
  });
  it("oferta e pedido", () => {
    expect(validarOferta({ fornecedorId: 1, nome: "Placa", preco: 12.345, link: "nada" }).ok).toBe(false);
    const o = validarOferta({ fornecedorId: 1, nome: "Placa", preco: 12.345, qtdMinima: "0" });
    expect(o.ok && o.dados).toMatchObject({ preco: 12.35, qtdMinima: 1 });
    expect(validarPedido({ fornecedorId: 1, descricao: "Placas", quantidade: 0, valorTotal: 10, data: "2026-10-29" }).ok).toBe(false);
    const p = validarPedido({ fornecedorId: 1, descricao: "Placas", quantidade: 50, valorTotal: 400, data: "2026-10-29", rastreio: "aa 123456789 br" });
    expect(p.ok && p.dados.rastreio).toBe("AA123456789BR");
  });
});

describe("contas", () => {
  it("simula o lote", () => {
    const s = simularLote({ preco: 8, quantidade: 50, frete: 25, precoVenda: 60 });
    expect(s.total).toBe(425);
    expect(s.custoUn).toBe(8.5);
    expect(s.lucroLote).toBe(2575);
    expect(s.vendasParaPagar).toBe(8);
    expect(custoUnitario({ valorTotal: 400, frete: 25, quantidade: 50 })).toBe(8.5);
  });
  it("pedido atrasado", () => {
    expect(atrasado({ status: "enviado", previsao: "2026-10-20" }, "2026-10-29")).toBe(true);
    expect(atrasado({ status: "recebido", previsao: "2026-10-20" }, "2026-10-29")).toBe(false);
  });
  it("rastreio e mensagem", () => {
    expect(urlRastreio("AA123456789BR")).toContain("AA123456789BR");
    expect(urlRastreio("XYZ")).toContain("google.com");
    expect(mensagemPedido({ fornecedor: "Gráfica X", placa: "Placa NFC 10x10", quantidade: 50, nome: "Gabriel" })).toMatch(
      /Olá, Gráfica X!.*Gabriel.*50 unidades da Placa NFC 10x10.*frete/,
    );
  });
});

describe("ler página do produto", () => {
  it("pega Open Graph e preço", () => {
    const html = `<html><head><title>x</title>
      <meta property="og:title" content="Placa NFC Google &amp; QR Code" />
      <meta content="Acrílico 10x10 com chip" property="og:description">
      <meta property="og:image" content="/img/placa.jpg">
      <meta property="product:price:amount" content="12,90"></head></html>`;
    expect(extrairProduto(html, "https://loja.com.br/p/1")).toEqual({
      titulo: "Placa NFC Google & QR Code",
      descricao: "Acrílico 10x10 com chip",
      imagem: "https://loja.com.br/img/placa.jpg",
      preco: 12.9,
    });
  });
  it("cai no título e no JSON-LD", () => {
    const html = `<title>Placa NFC</title><script type="application/ld+json">{"offers":{"price":"9.50"}}</script>`;
    expect(extrairProduto(html, "https://x.com")).toMatchObject({ titulo: "Placa NFC", preco: 9.5, imagem: null });
  });
});
