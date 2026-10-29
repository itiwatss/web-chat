export async function toJpegBase64(file: File, maxSide: number): Promise<string> {
  const bmp = await createImageBitmap(file).catch(() => {
    throw new Error("Unsupported image file");
  });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();

  for (let q = 0.85; ; q -= 0.15) {
    const url = canvas.toDataURL("image/jpeg", q);
    const b64 = url.slice(url.indexOf(",") + 1);
    if ((b64.length * 3) / 4 < 950_000 || q < 0.3) return b64;
  }
}
