/** Manda o erro do navegador para o servidor (no máximo 5 por visita). */
let enviados = 0;
export function relatarErro(e: unknown, extra?: { digest?: string }) {
  if (typeof window === "undefined" || enviados >= 5) return;
  enviados++;
  const err = e instanceof Error ? e : new Error(String(e));
  const corpo = JSON.stringify({ pagina: location.pathname, mensagem: err.message, pilha: err.stack, digest: extra?.digest });
  try {
    if (!navigator.sendBeacon?.("/api/erro-cliente", new Blob([corpo], { type: "application/json" })))
      fetch("/api/erro-cliente", { method: "POST", body: corpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {}
}

/** Erro de "peça do app que mudou" (o painel foi atualizado com a tela aberta). */
export const ehVersaoAntiga = (e: unknown) =>
  /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed|Failed to load chunk/i.test(
    e instanceof Error ? `${e.name} ${e.message}` : String(e),
  );

/** Recarrega a página uma única vez por minuto (evita ficar recarregando em loop). */
export function recarregarUmaVez(): boolean {
  try {
    const ultimo = Number(sessionStorage.getItem("recarregou-em") || 0);
    if (Date.now() - ultimo < 60_000) return false;
    sessionStorage.setItem("recarregou-em", String(Date.now()));
  } catch {}
  location.reload();
  return true;
}
