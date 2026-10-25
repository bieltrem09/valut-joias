/**
 * Rótulo de eixo X em mono que não corta nas bordas: o primeiro alinha à
 * esquerda, o último à direita, o resto ao centro.
 */
export function edgeTick(format: (v: never) => string, count: () => number) {
  function EdgeTick(t: { x?: number | string; y?: number | string; index: number; payload: { value: unknown } }) {
    const last = count() - 1;
    return (
      <text
        x={t.x}
        y={t.y}
        dy={4}
        textAnchor={t.index === 0 ? "start" : t.index === last ? "end" : "middle"}
        fill="var(--muted-foreground)"
        fontSize={11}
        fontFamily="var(--font-jetbrains)"
      >
        {format(t.payload.value as never)}
      </text>
    );
  }
  return EdgeTick;
}
