// Gera os SVGs do logo VALUT (símbolo de folhas em V + wordmark com Λ).
import { writeFileSync } from 'node:fs';
const f = (n) => +n.toFixed(1);
// Lâmina: linha central em curva (vértice → ponta), largura cresce até a ponta arredondada.
function blade(side, tipX, tipY, bulge, maxW) {
  const s = side;
  const P0 = [100 + s * 1.5, 194];
  const P2 = [100 + s * tipX, tipY];
  const P1 = [100 + s * (tipX + bulge), 128];
  const pt = (u) => [0, 1].map((k) => (1 - u) ** 2 * P0[k] + 2 * (1 - u) * u * P1[k] + u * u * P2[k]);
  const N = 28, left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, [x, y] = pt(u);
    const [x2, y2] = pt(Math.min(1, u + 0.01)), [x1, y1] = pt(Math.max(0, u - 0.01));
    let dx = x2 - x1, dy = y2 - y1; const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    const w = (maxW / 2) * Math.pow(u, 0.55) * (1 - 0.15 * u);
    left.push([x - dy * w, y + dx * w]); right.push([x + dy * w, y - dx * w]);
  }
  const [ex, ey] = pt(1), wEnd = (maxW / 2) * 0.85;
  const L = left.map(([x, y]) => `${f(x)} ${f(y)}`), R = right.reverse().map(([x, y]) => `${f(x)} ${f(y)}`);
  // ponta arredondada (arco) ligando os dois lados
  return `M${L[0]}L${L.slice(1).join('L')}A${f(wEnd)} ${f(wEnd)} 0 0 0 ${R[0]}L${R.slice(1).join('L')}Z`;
}
const blades = [
  blade(-1, 14, 60, 4, 17), blade(-1, 40, 72, 24, 16), blade(-1, 64, 94, 40, 14),
  blade(1, 12, 10, 6, 18), blade(1, 38, 20, 24, 17), blade(1, 62, 38, 40, 16), blade(1, 84, 64, 50, 14),
];

const word = [
  'M0 20H28L56 98L80 20H88L58 124H50Z', // V
  'M98 124L128 20H142L180 124H152L131 52L106 124Z', // Λ
  'M131 92L136 100L131 108L126 100Z', // diamante
  'M196 20H222V112H262L267 94H271V124H196Z', // L
  'M282 20H308V86Q308 110 331 110Q352 110 352 86V20H360V86Q360 126 327 126Q282 126 282 86Z', // U
  'M372 20H452V44H448Q444 30 425 30V124H399V30Q380 30 376 44H372Z', // T
];

const gold = '#B79342';
const symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="${gold}">${blades.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 454 160" fill="${gold}">${word.map((d) => `<path d="${d}"/>`).join('')}<text x="227" y="156" text-anchor="middle" font-family="Inter Tight, Helvetica, Arial, sans-serif" font-size="20" letter-spacing="14">SEMIJOIAS</text></svg>`;
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 454 400" fill="${gold}"><g transform="translate(127 0) scale(1)">${blades.map((d) => `<path d="${d}"/>`).join('')}</g><g transform="translate(0 228)">${word.map((d) => `<path d="${d}"/>`).join('')}<text x="227" y="166" text-anchor="middle" font-family="Inter Tight, Helvetica, Arial, sans-serif" font-size="20" letter-spacing="14">SEMIJOIAS</text></g></svg>`;
writeFileSync('public/brand/valut-simbolo.svg', symbol);
writeFileSync('public/brand/valut-wordmark.svg', wordmark);
writeFileSync('public/brand/valut-logo.svg', full);
writeFileSync('components/ui/logo-paths.ts', `// Gerado por scripts/gen-logo.mjs\nexport const symbolPaths = ${JSON.stringify(blades, null, 2)};\nexport const wordmarkPaths = ${JSON.stringify(word, null, 2)};\n`);
