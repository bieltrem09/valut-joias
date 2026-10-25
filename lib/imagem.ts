/**
 * Reduz a foto no navegador antes de enviar: lado maior de até 1400 px, WEBP
 * (ou JPEG onde o navegador não gera WEBP). Uma foto de celular de 4 MB vira ~200 KB.
 */
export async function comprimirImagem(file: File, max = 1400, qualidade = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name)) throw new Error("Escolha um arquivo de imagem.");
  if (file.type === "image/gif") return file;

  const fonte = await carregar(file);
  const escala = Math.min(1, max / Math.max(fonte.width, fonte.height));
  const w = Math.max(1, Math.round(fonte.width * escala));
  const h = Math.max(1, Math.round(fonte.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não deu para preparar a foto.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fonte.img, 0, 0, w, h);
  fonte.liberar();

  const blob = (await gerar(canvas, "image/webp", qualidade)) ?? (await gerar(canvas, "image/jpeg", qualidade));
  if (!blob) throw new Error("Não deu para preparar a foto.");
  // Safari antigo devolve PNG quando não sabe WEBP: aí vale o JPEG.
  const final = blob.type === "image/png" ? ((await gerar(canvas, "image/jpeg", qualidade)) ?? blob) : blob;
  const ext = final.type === "image/webp" ? "webp" : final.type === "image/png" ? "png" : "jpg";
  return new File([final], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.${ext}`, { type: final.type });
}

const gerar = (c: HTMLCanvasElement, tipo: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, tipo, q));

async function carregar(file: File): Promise<{ img: CanvasImageSource; width: number; height: number; liberar: () => void }> {
  // createImageBitmap já respeita a rotação (EXIF) da foto do celular.
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file);
      return { img: bmp, width: bmp.width, height: bmp.height, liberar: () => bmp.close() };
    } catch {}
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Esse formato de foto não abre aqui. Tente JPG ou PNG.");
  }
  return { img, width: img.naturalWidth, height: img.naturalHeight, liberar: () => URL.revokeObjectURL(url) };
}
