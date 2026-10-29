import { describe, expect, it } from "vitest";
import { destinoAutomatico } from "./destino-placa";

describe("destino automático da placa", () => {
  it("avaliação Google usa o place id do cliente", () => {
    expect(destinoAutomatico("Avaliação Google", { placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4", mapsUrl: null })).toBe(
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    );
  });
  it("sem id do Google cai no Maps, e sem nada fica vazio", () => {
    expect(destinoAutomatico("Avaliação Google", { placeId: "manual:abc", mapsUrl: "https://maps.google.com/?cid=1" })).toBe("https://maps.google.com/?cid=1");
    expect(destinoAutomatico("Instagram", { placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4", mapsUrl: null })).toBeNull();
    expect(destinoAutomatico("Avaliação Google", null)).toBeNull();
  });
});
