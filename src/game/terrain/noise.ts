/**
 * Small deterministic value-noise toolkit for terrain: no Math.random, so the same sector seed
 * always yields the same coastline texture, forests and towns (and screenshots stay stable).
 */

/** 32-bit integer hash → [0, 1). */
export function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Bilinear value noise in [0, 1) with smoothstep interpolation. */
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Fractal (fBm) noise in roughly [0, 1): `octaves` layers, each twice the frequency, half the weight. */
export function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * f, y * f, seed + o * 101) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** Seeded PRNG (mulberry32) for placing discrete features. */
export function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chaikin corner cutting: turns a coarse polyline into a smooth curve. */
export function chaikin(points: { x: number; y: number }[], iterations = 2, closed = false): { x: number; y: number }[] {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    const out: { x: number; y: number }[] = [];
    const n = pts.length;
    const last = closed ? n : n - 1;
    if (!closed) out.push(pts[0]);
    for (let i = 0; i < last; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
      out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
    }
    if (!closed) out.push(pts[n - 1]);
    pts = out;
  }
  return pts;
}

/**
 * Natural meander for a hand-placed straight polyline (river, road, ridge spine): subdivides
 * each segment and pushes the new points sideways by low-frequency noise, then smooths.
 */
export function meander(points: { x: number; y: number }[], amplitude: number, step: number, seed: number): { x: number; y: number }[] {
  if (points.length < 2) return points;
  const out: { x: number; y: number }[] = [];
  let travelled = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(len / step));
    const nx = -(b.y - a.y) / (len || 1);
    const ny = (b.x - a.x) / (len || 1);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const d = travelled + len * t;
      // Endpoints of the authored polyline stay put; the offset fades in and out
      const fade = Math.min(1, d / (step * 2));
      const off = (fbm(d / (step * 4), 0.5, seed, 3) - 0.5) * 2 * amplitude * fade;
      out.push({ x: a.x + (b.x - a.x) * t + nx * off, y: a.y + (b.y - a.y) * t + ny * off });
    }
    travelled += len;
  }
  out.push(points[points.length - 1]);
  return chaikin(out, 2);
}
