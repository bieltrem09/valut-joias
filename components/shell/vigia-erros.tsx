"use client";

import * as React from "react";
import { ehVersaoAntiga, recarregarUmaVez, relatarErro } from "@/lib/erro-cliente";

/** Erros fora das telas (ex.: ao trocar de aba): registra e, se for versão antiga do app, recarrega. */
export function VigiaErros() {
  React.useEffect(() => {
    const tratar = (e: unknown) => {
      relatarErro(e);
      if (ehVersaoAntiga(e)) recarregarUmaVez();
    };
    const aoErro = (ev: ErrorEvent) => tratar(ev.error ?? ev.message);
    const aoRejeitar = (ev: PromiseRejectionEvent) => tratar(ev.reason);
    addEventListener("error", aoErro);
    addEventListener("unhandledrejection", aoRejeitar);
    return () => {
      removeEventListener("error", aoErro);
      removeEventListener("unhandledrejection", aoRejeitar);
    };
  }, []);
  return null;
}
