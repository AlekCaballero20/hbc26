import { createRng } from "./rng.js";

const cache = new Map();

export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return cache.get(src);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

  cache.set(src, promise);
  return promise;
}

/**
 * Si la foto de la etapa todavía no existe, dibujamos un lienzo bonito con el
 * mismo tamaño para que el puzzle nunca se rompa por un archivo faltante.
 */
export function placeholderImage(seed, size = 600) {
  const rng = createRng(seed);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const hueA = rng.int(280, 340);
  const hueB = rng.int(190, 260);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, `hsl(${hueA} 78% 62%)`);
  gradient.addColorStop(0.55, `hsl(${hueB} 72% 46%)`);
  gradient.addColorStop(1, `hsl(${(hueA + 40) % 360} 66% 28%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let index = 0; index < 90; index += 1) {
    const radius = rng() * size * 0.012 + 1;
    ctx.globalAlpha = rng() * 0.55 + 0.15;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.font = `${size * 0.34}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💜", size / 2, size / 2);

  return canvas;
}

/** Devuelve siempre algo dibujable en un canvas: la foto real o el respaldo. */
export async function stagePicture(src, seed) {
  const image = await loadImage(src);
  return image || placeholderImage(seed);
}
