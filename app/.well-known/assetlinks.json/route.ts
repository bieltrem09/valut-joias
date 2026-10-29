/**
 * Prova para o Android de que o app (APK gerado no PWABuilder) é deste site.
 * Com ela, o app abre em tela cheia, sem a barra do Chrome.
 * Preencha na Vercel: ANDROID_PACKAGE (ex.: app.vercel.basik7.twa) e
 * ANDROID_SHA256 (impressão digital da assinatura; várias separadas por vírgula).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pacote = process.env.ANDROID_PACKAGE?.trim();
  const digitais = (process.env.ANDROID_SHA256 ?? "")
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter((d) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(d));
  const corpo =
    pacote && digitais.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: pacote, sha256_cert_fingerprints: digitais },
          },
        ]
      : [];
  return Response.json(corpo, { headers: { "Cache-Control": "public, max-age=3600" } });
}
