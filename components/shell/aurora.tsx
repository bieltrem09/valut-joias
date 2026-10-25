/**
 * Fundo de todas as abas: feixe violeta desfocado entrando pela esquerda,
 * com linhas verticais finas e granulado (referência do cliente).
 * Só CSS: transform/opacity animados, nada de JS por frame.
 */
export function Aurora() {
  return (
    <div aria-hidden className="aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-beam aurora-beam-a" />
      <div className="aurora-beam aurora-beam-b" />
      <div className="aurora-lines" />
      <div className="aurora-grain" />
    </div>
  );
}
