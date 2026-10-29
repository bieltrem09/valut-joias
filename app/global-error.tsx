"use client";

import * as React from "react";
import { ehVersaoAntiga, recarregarUmaVez, relatarErro } from "@/lib/erro-cliente";

/** Último recurso (erro no próprio layout): página simples com "Recarregar". */
export default function ErroGeral({ error }: { error: Error & { digest?: string } }) {
  React.useEffect(() => {
    relatarErro(error, { digest: error.digest });
    if (ehVersaoAntiga(error)) recarregarUmaVez();
  }, [error]);
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0a0814",
          color: "#ece9f5",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>O painel não carregou direito</p>
          <p style={{ fontSize: 14, color: "#a39fb5", margin: "0 0 20px" }}>Pode ter sido a internet ou uma atualização. Seus dados estão salvos.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ height: 44, padding: "0 22px", border: 0, borderRadius: 12, background: "#7a4dff", color: "#fff", fontSize: 15, fontWeight: 600 }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
