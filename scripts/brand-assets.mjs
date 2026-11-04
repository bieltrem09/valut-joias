// Gera favicon, ícones e imagem Open Graph a partir do kit da logo.
// Uso: node scripts/brand-assets.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const avatar = "public/brand/zeroum-avatar-2048.png";
await sharp(avatar).resize(512, 512).png().toFile("public/icon.png");
await sharp(avatar).resize(180, 180).png().toFile("public/apple-touch-icon.png");

// favicon.ico (PNG embutido em ICO, 48px)
const png48 = await sharp(avatar).resize(48, 48).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(48, 6); header.writeUInt8(48, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png48.length, 14); header.writeUInt32LE(22, 18);
writeFileSync("public/favicon.ico", Buffer.concat([header, png48]));

// OG 1200x630: logo sobre preto com faixa vermelha e texto
const logo = readFileSync("public/brand/zeroum-logo-white-red.svg", "utf8");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><radialGradient id="g" cx="1" cy="0" r="1"><stop offset="0" stop-color="#E3182D" stop-opacity=".35"/><stop offset=".6" stop-color="#E3182D" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#0B0B0B"/><rect width="1200" height="630" fill="url(#g)"/>
<svg x="110" y="170" width="980" height="210" viewBox="21 23 976 209.5">${logo.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "")}</svg>
<rect x="110" y="470" width="56" height="4" fill="#E3182D"/>
<text x="110" y="530" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="1">ACADEMIA 24 HORAS · 2.500 M² · AMERICANA/SP</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("ok");
