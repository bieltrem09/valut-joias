'use client';

/**
 * Barramento mínimo para coordenar "a página está coberta" (preloader ou
 * cortina de transição) com as animações de entrada. Quem anima a entrada do
 * topo da página chama onReveal(cb): roda já, se nada estiver cobrindo, ou no
 * instante em que a cortina começa a sair (overlap, nada de esperar).
 */
const PRELOADED_KEY = 'valut:preloaded';

function initialCovered() {
  if (typeof window === 'undefined') return false;
  try {
    return !sessionStorage.getItem(PRELOADED_KEY);
  } catch {
    return false;
  }
}

let covered = initialCovered();
const listeners = new Set<() => void>();

export function setCovered(value: boolean) {
  covered = value;
  if (!value) {
    const pending = [...listeners];
    listeners.clear();
    pending.forEach((cb) => cb());
  }
}

export function isCovered() {
  return covered;
}

export function onReveal(cb: () => void) {
  if (!covered) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function markPreloaded() {
  try {
    sessionStorage.setItem(PRELOADED_KEY, '1');
  } catch {}
}

export const preloadScript = `try{if(sessionStorage.getItem('${PRELOADED_KEY}'))document.documentElement.dataset.preloaded='1'}catch(e){}document.documentElement.classList.add('js')`;
