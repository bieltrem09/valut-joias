// Copia, renomeia e otimiza os assets de /img para /public/media.
// - Fotos: ajuste leve e uniforme de cor, redimensionamento (máx. 2000px) e
//   geração do manifesto data/media.generated.ts (dimensões + blur placeholder).
//   AVIF/WebP em vários tamanhos são servidos pelo next/image a partir destes masters.
// - Vídeos: H.264 (mp4) + WebM + poster, se o ffmpeg estiver instalado.
// Uso: npm run media
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'img');
const out = path.join(root, 'public/media');
mkdirSync(out, { recursive: true });

const find = (needle) => {
  const f = readdirSync(src).find((n) => n.includes(needle) && !n.includes('(1).jpg'));
  if (!f) throw new Error(`Asset não encontrado: ${needle}`);
  return path.join(src, f);
};

// kind: 'editorial' (só normaliza) | 'loja' (aquece e dá contraste para conversar com os editoriais)
const photos = [
  ['838001744', 'editorial-colar-dourado.jpg', 'editorial'],
  ['840168044', 'editorial-perfil-brinco.jpg', 'editorial'],
  ['847939322', 'editorial-pulseiras-rosa.jpg', 'editorial'],
  ['847979007', 'bolsa-clutch-rosa.jpg', 'editorial'],
  ['848761503', 'editorial-colar-gota.jpg', 'editorial'],
  ['851984966', 'conjunto-rubi-expositor.jpg', 'loja'],
  ['857895182', 'editorial-flores-cravejadas.jpg', 'editorial'],
  ['857977914', 'detalhe-brinco-gota.jpg', 'editorial'],
  ['unnamed (1).webp', 'loja-perolas-busto.webp', 'loja'],
  ['unnamed (10).webp', 'loja-conjunto-coral.webp', 'loja'],
  ['unnamed (2).webp', 'loja-rivieras.webp', 'loja'],
  ['unnamed (3).webp', 'loja-bolsas.webp', 'loja'],
  ['unnamed (4).webp', 'aneis-coquetel.webp', 'loja'],
  ['unnamed (5).webp', 'loja-letreiro.webp', 'loja'],
  ['unnamed (7).webp', 'loja-rivieras-letreiro.webp', 'loja'],
  ['unnamed (8).webp', 'loja-argolas.webp', 'loja'],
  ['unnamed (9).webp', 'loja-logo-marmore.webp', 'loja'],
  ['unnamed.webp', 'loja-interior.webp', 'loja'],
];

const manifest = {};

for (const [needle, name, kind] of photos) {
  let img = sharp(find(needle)).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
  img =
    kind === 'loja'
      ? img.modulate({ brightness: 1.02, saturation: 0.94 }).recomb([[1.04, 0, 0], [0, 1.0, 0], [0, 0, 0.93]]).linear(1.06, -6)
      : img.modulate({ saturation: 0.97 }).linear(1.02, -2);
  const target = path.join(out, name);
  const buf = name.endsWith('.webp') ? await img.webp({ quality: 84 }).toBuffer() : await img.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  await sharp(buf).toFile(target);
  const meta = await sharp(buf).metadata();
  const blur = await sharp(buf).resize(12).webp({ quality: 40 }).toBuffer();
  manifest[name.replace(/\.(jpg|webp)$/, '')] = {
    src: `/media/${name}`,
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  };
  console.log('✓', name, `${meta.width}×${meta.height}`);
}

// Joia recortada para o hero (gerada a partir de um frame do vídeo Rubi Mood).
// TODO: substituir por foto de estúdio em fundo neutro, recortada em alta resolução.
{
  const cut = path.join(root, 'scripts/joia-hero-recorte.png');
  const buf = await sharp(cut).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  await sharp(buf).toFile(path.join(out, 'joia-rubi-recorte.webp'));
  const meta = await sharp(cut).metadata();
  manifest['joia-rubi-recorte'] = { src: '/media/joia-rubi-recorte.webp', width: meta.width, height: meta.height, blurDataURL: '' };
  console.log('✓ joia-rubi-recorte.webp');
}

// Fachada do Shopping Villa Real (captura do Google Street View — manter o crédito no site).
// Recorte que tira parte do céu e foca no letreiro e na entrada.
{
  const name = 'loja-fachada.jpg';
  const buf = await sharp(find('fachada-shopping-villa-real'))
    .extract({ left: 0, top: 470, width: 1080, height: 1130 })
    .modulate({ saturation: 1.04 })
    .linear(1.03, -3)
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  await sharp(buf).toFile(path.join(out, name));
  const meta = await sharp(buf).metadata();
  const blur = await sharp(buf).resize(12).webp({ quality: 40 }).toBuffer();
  manifest['loja-fachada'] = { src: `/media/${name}`, width: meta.width, height: meta.height, blurDataURL: `data:image/webp;base64,${blur.toString('base64')}` };
  console.log('✓', name, `${meta.width}×${meta.height}`);
}

// Variantes exclusivas do hero desktop (o mobile continua usando os arquivos acima).
// Pós-produção idêntica nas duas para manter tom e nitidez consistentes:
// saturação +8%, contraste leve e sharpening suave.
{
  const finish = (img) => img.modulate({ saturation: 1.08 }).linear(1.04, -4).sharpen({ sigma: 0.8, m1: 0.6, m2: 2 });
  const jobs = [
    { name: 'hero-joia-desktop.webp', from: path.join(root, 'scripts/joia-hero-recorte.png'), webp: true },
    { name: 'hero-editorial-desktop.jpg', from: find('857895182'), webp: false },
  ];
  for (const j of jobs) {
    let img = sharp(j.from).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
    img = finish(img);
    const buf = j.webp ? await img.webp({ quality: 90, alphaQuality: 100 }).toBuffer() : await img.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    await sharp(buf).toFile(path.join(out, j.name));
    const meta = await sharp(buf).metadata();
    const blur = j.webp ? '' : `data:image/webp;base64,${(await sharp(buf).resize(12).webp({ quality: 40 }).toBuffer()).toString('base64')}`;
    manifest[j.name.replace(/\.(jpg|webp)$/, '')] = { src: `/media/${j.name}`, width: meta.width, height: meta.height, blurDataURL: blur };
    console.log('✓', j.name, `${meta.width}×${meta.height}`);
  }
}

// Vídeos
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const videos = [
  ['AQN-btO', 'video-flores-cravejadas'],
  ['AQORPUq', 'video-rubi-mood'],
];
if (hasFfmpeg) {
  for (const [needle, name] of videos) {
    const input = find(needle);
    const base = path.join(out, name);
    const run = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', input, ...args], { stdio: 'inherit' });
    run(['-an', '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}.mp4`]);
    run(['-an', '-vf', 'scale=540:-2', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', `${base}.webm`]);
    run(['-ss', '1', '-frames:v', '1', '-vf', 'scale=540:-2', `${base}-poster.jpg`]);
    console.log('✓', name, '(mp4 + webm + poster)');
  }
} else if (!existsSync(path.join(out, 'video-rubi-mood.mp4'))) {
  console.warn('! ffmpeg não encontrado — vídeos não foram convertidos.');
}

// Posters dos vídeos também entram no manifesto (usados como foto de produto/poster).
for (const [, name] of videos) {
  const file = path.join(out, `${name}-poster.jpg`);
  if (!existsSync(file)) continue;
  const meta = await sharp(file).metadata();
  const blur = await sharp(file).resize(12).webp({ quality: 40 }).toBuffer();
  manifest[`${name}-poster`] = { src: `/media/${name}-poster.jpg`, width: meta.width, height: meta.height, blurDataURL: `data:image/webp;base64,${blur.toString('base64')}` };
}

writeFileSync(
  path.join(root, 'data/media.generated.ts'),
  `// Gerado por scripts/optimize-media.mjs — não editar à mão.\nexport const media = ${JSON.stringify(manifest, null, 2)} as const;\nexport type MediaKey = keyof typeof media;\n`,
);

