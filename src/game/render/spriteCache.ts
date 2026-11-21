/**
 * Pre-rendered sprites for static vector art drawn many times a frame (ground silhouettes, APP-6
 * symbols, status labels). Each sprite is drawn once at a few pixels per world unit, enough for
 * the closest camera zoom on a high-DPI screen, and blitted afterwards: one drawImage instead of
 * dozens of path fills, and no per-frame text shaping (the emoji labels are the costliest).
 */

interface Sprite {
  canvas: HTMLCanvasElement;
  /** World-space rectangle the sprite covers, relative to its anchor. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pixels per world unit: covers the 1.8× max zoom at 2× device pixel ratio. */
const RES = 4;
const MAX_SPRITES = 400;
const CACHE = new Map<string, Sprite>();

function makeSprite(x: number, y: number, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * RES));
  canvas.height = Math.max(1, Math.ceil(h * RES));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(RES, RES);
  ctx.translate(-x, -y);
  draw(ctx);
  return { canvas, x, y, w, h };
}

function remember(key: string, s: Sprite): Sprite {
  if (CACHE.size >= MAX_SPRITES) {
    // Drop the oldest entries (Map keeps insertion order)
    let n = MAX_SPRITES / 4;
    for (const k of CACHE.keys()) {
      CACHE.delete(k);
      if (--n <= 0) break;
    }
  }
  CACHE.set(key, s);
  return s;
}

/** Draws cached art for `key` at the current transform; `draw` renders it around the origin within ±half. */
export function blitSprite(ctx: CanvasRenderingContext2D, key: string, half: number, draw: (ctx: CanvasRenderingContext2D) => void): void {
  let s = CACHE.get(key);
  if (!s) s = remember(key, makeSprite(-half, -half, half * 2, half * 2, draw));
  ctx.drawImage(s.canvas, s.x, s.y, s.w, s.h);
}

const MEASURE = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

/** A centred line of text (textAlign centre, alphabetic baseline) from the cache. */
export function blitText(ctx: CanvasRenderingContext2D, text: string, font: string, color: string, x: number, y: number): void {
  const key = `T|${font}|${color}|${text}`;
  let s = CACHE.get(key);
  if (!s) {
    const m = MEASURE!;
    m.font = font;
    const width = m.measureText(text).width + 4;
    const size = parseFloat(/([\d.]+)px/.exec(font)?.[1] ?? '10');
    const h = size * 1.6;
    s = remember(
      key,
      makeSprite(-width / 2, -size * 1.2, width, h, (c) => {
        c.font = font;
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        c.fillStyle = color;
        c.fillText(text, 0, 0);
      })
    );
  }
  ctx.drawImage(s.canvas, x + s.x, y + s.y, s.w, s.h);
}
