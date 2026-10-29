import * as React from "react";

/**
 * Função com a mesma identidade a vida toda, mas que sempre chama a versão mais nova.
 * Deixa componentes com React.memo pularem o redesenho quando só o pai mudou.
 */
export function useEstavel<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = React.useRef(fn);
  React.useLayoutEffect(() => {
    ref.current = fn;
  });
  return React.useCallback((...args: A) => ref.current(...args), []);
}
