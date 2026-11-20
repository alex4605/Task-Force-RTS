import { Island } from '../../types/game';
import { fbm, hash2, valueNoise } from '../terrain/noise';
import { TERRAIN, TerrainMap, TerrainType } from '../terrain/terrainMap';
import { Camera, RenderContext, isWorldCircleVisible } from './context';

/**
 * Terrain drawing in two layers:
 *
 *  1. a raster baked once per sector from the TerrainMap (≈9 m per pixel): ground colour by
 *     terrain type with per-pixel texture, hill shading lit from the north-west, contour lines,
 *     field and paddy patterns; clipped to the vector coastline each frame so shores stay crisp;
 *  2. vector overlays drawn every frame but only when on screen: rivers, roads and bridges,
 *     town street blocks and peak labels.
 *
 * The palette stays in the game's dark tactical-display key: muted, desaturated map tints.
 */

type RGB = [number, number, number];

const BASE: Record<TerrainType, RGB> = {
  0: [0, 0, 0],
  1: [0, 0, 0],
  2: [62, 66, 50], // beach strip (sand itself is drawn along the coastline)
  3: [38, 58, 42], // grass / kunai
  4: [52, 60, 40], // farmland
  5: [50, 66, 44], // rice paddies
  6: [24, 50, 34], // temperate forest
  7: [18, 52, 30], // jungle
  8: [20, 44, 38], // mangrove
  9: [34, 66, 44], // palm groves
  10: [52, 60, 48], // hills
  11: [70, 70, 66], // mountains
  12: [60, 58, 54], // built-up
  13: [34, 54, 46], // marsh
  14: [36, 62, 48], // river banks (the water itself is a vector line)
  15: [62, 56, 50], // heather moor
  16: [0, 0, 0], // lakes: vector fill
};

const RASTER_PX = 1536;

interface Baked {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  version: number;
}
const BAKED = new WeakMap<TerrainMap, Baked>();

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function bake(map: TerrainMap): Baked {
  const px = RASTER_PX;
  const canvas = makeCanvas(px, px);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  const img = ctx.createImageData(px, px);
  const data = img.data;
  const scale = map.worldSize / px; // world units per pixel
  const cell = map.cell;
  const s = map.seed;

  // Bilinear elevation lookup (cell centres)
  const elevAt = (x: number, y: number) => {
    const fx = x / cell - 0.5;
    const fy = y / cell - 0.5;
    const c0 = Math.max(0, Math.min(map.cols - 2, Math.floor(fx)));
    const r0 = Math.max(0, Math.min(map.rows - 2, Math.floor(fy)));
    const tx = Math.max(0, Math.min(1, fx - c0));
    const ty = Math.max(0, Math.min(1, fy - r0));
    const i = r0 * map.cols + c0;
    const e = map.elev;
    return (e[i] * (1 - tx) + e[i + 1] * tx) * (1 - ty) + (e[i + map.cols] * (1 - tx) + e[i + map.cols + 1] * tx) * ty;
  };

  for (let py = 0; py < px; py++) {
    for (let pxl = 0; pxl < px; pxl++) {
      const x = (pxl + 0.5) * scale;
      const y = (py + 0.5) * scale;
      // Domain warp the type lookup so cell edges become ragged, natural boundaries
      // Smooth low-frequency warp (organic edges) plus a little grain (no stair-steps)
      const wx = x + (valueNoise(x / 90, y / 90, s) - 0.5) * cell * 1.6 + (hash2(pxl, py, s + 2) - 0.5) * scale;
      const wy = y + (valueNoise(x / 90, y / 90, s + 1) - 0.5) * cell * 1.6 + (hash2(py, pxl, s + 3) - 0.5) * scale;
      // Pick among the four surrounding cells with a noisy nearest-corner rule: boundaries
      // become smooth curves at sub-cell scale instead of 40 m stair-steps
      const gx = wx / cell - 0.5;
      const gy = wy / cell - 0.5;
      const c0 = Math.floor(gx);
      const r0 = Math.floor(gy);
      const tx = gx - c0 + (valueNoise(x / 22, y / 22, s + 4) - 0.5) * 0.9;
      const ty = gy - r0 + (valueNoise(x / 22, y / 22, s + 6) - 0.5) * 0.9;
      const cc = Math.max(0, Math.min(map.cols - 1, c0 + (tx >= 0.5 ? 1 : 0)));
      const rr = Math.max(0, Math.min(map.rows - 1, r0 + (ty >= 0.5 ? 1 : 0)));
      const t = map.type[rr * map.cols + cc] as TerrainType;
      const o = (py * px + pxl) * 4;
      if (t === TERRAIN.water || t === TERRAIN.lagoon || t === TERRAIN.lake) {
        data[o + 3] = 0;
        continue;
      }
      const base = BASE[t];
      let r = base[0];
      let g = base[1];
      let b = base[2];

      // Texture by type
      const grain = hash2(pxl, py, s + 5) - 0.5;
      let tex = grain * 10;
      if (t === TERRAIN.jungle || t === TERRAIN.forest || t === TERRAIN.palms || t === TERRAIN.mangrove) {
        // Canopy clumps
        tex += (fbm(x / 45, y / 45, s + 7, 2) - 0.5) * 34;
      } else if (t === TERRAIN.farmland) {
        // Field parcels: a rotated grid of rectangles in varied crops
        // Field orientation drifts across the map, so the patchwork does not read as a grid
        const rot = (hash2(Math.floor(x / 1400), Math.floor(y / 1400), s + 8) - 0.5) * 1.4;
        const ca = Math.cos(rot);
        const sa = Math.sin(rot);
        const u = x * ca + y * sa;
        const v = y * ca - x * sa;
        const fw = 120 + 60 * hash2(Math.floor(v / 90), 3, s + 10);
        const fx = Math.floor(u / fw);
        const fy = Math.floor(v / 90);
        const crop = hash2(fx, fy, s + 9);
        r += (crop - 0.5) * 18;
        g += (crop - 0.4) * 14;
        b += (crop - 0.6) * 6;
        if (((u % fw) + fw) % fw < scale || ((v % 90) + 90) % 90 < scale) tex -= 9; // hedgerows and tracks
      } else if (t === TERRAIN.paddy) {
        // Paddy dykes: small flooded squares with bright water glints
        const ex = ((x * 0.9 + y * 0.44) % 60 + 60) % 60;
        const ey = ((y * 0.9 - x * 0.44) % 46 + 46) % 46;
        if (ex < scale * 1.2 || ey < scale * 1.2) tex -= 6;
        else {
          const flood = hash2(Math.floor((x * 0.9 + y * 0.44) / 60), Math.floor((y * 0.9 - x * 0.44) / 46), s + 13);
          b += flood * 12;
          g += flood * 6;
        }
      } else if (t === TERRAIN.urban) {
        tex += grain * 8;
      } else if (t === TERRAIN.heath) {
        // Heather tussocks and sandy tracks
        tex += (fbm(x / 35, y / 35, s + 21, 2) - 0.5) * 22;
        r += (fbm(x / 140, y / 140, s + 22, 2) - 0.4) * 22; // patches of flowering heather
      } else if (t === TERRAIN.marsh) {
        tex += (fbm(x / 60, y / 60, s + 15, 2) > 0.55 ? 14 : -6);
        b += 8;
      } else if (t === TERRAIN.mountain) {
        tex += (fbm(x / 70, y / 70, s + 17, 3) - 0.5) * 30;
      } else {
        tex += (fbm(x / 120, y / 120, s + 19, 2) - 0.5) * 16;
      }
      r += tex;
      g += tex;
      b += tex * 0.8;

      // Hill shading: light from the north-west
      const e = elevAt(x, y);
      const ex = elevAt(x + scale * 2, y) - elevAt(x - scale * 2, y);
      const ey = elevAt(x, y + scale * 2) - elevAt(x, y - scale * 2);
      const shade = Math.max(-0.45, Math.min(0.45, -(ex + ey) * 22));
      const lift = 1 + shade + e * 0.25;
      r *= lift;
      g *= lift;
      b *= lift;

      // Contour lines every 0.08 of elevation (≈100 m)
      const band = Math.floor(e / 0.1);
      if (band > 1 && (Math.floor(elevAt(x + scale, y) / 0.1) !== band || Math.floor(elevAt(x, y + scale) / 0.1) !== band)) {
        const major = band % 4 === 0;
        r = r * 0.7 + (major ? 150 : 110) * 0.3;
        g = g * 0.7 + (major ? 140 : 105) * 0.3;
        b = b * 0.7 + (major ? 110 : 85) * 0.3;
      }

      data[o] = Math.max(0, Math.min(255, r));
      data[o + 1] = Math.max(0, Math.min(255, g));
      data[o + 2] = Math.max(0, Math.min(255, b));
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas, version: map.version };
}

function tracePolygon(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]): void {
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}

/** The baked ground raster, clipped to the coastlines (lagoons cut out). World transform must be set. */
export function drawTerrainGround(rc: RenderContext, map: TerrainMap, islands: Island[]): void {
  let baked = BAKED.get(map);
  if (!baked || baked.version !== map.version) {
    baked = bake(map);
    BAKED.set(map, baked);
  }
  const ctx = rc.ctx;
  ctx.save();
  ctx.beginPath();
  for (const isl of islands) {
    tracePolygon(ctx, isl.points);
    for (const lag of isl.lagoons ?? []) tracePolygon(ctx, lag.points);
  }
  ctx.clip('evenodd');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(baked.canvas as CanvasImageSource, 0, 0, RASTER_PX, RASTER_PX, 0, 0, map.worldSize, map.worldSize);
  // Smooth beach band just inside the coastline (still clipped to land)
  const sand = map.era === 'era4' ? 'rgba(120, 112, 84, 0.4)' : 'rgba(150, 140, 100, 0.5)';
  ctx.strokeStyle = sand;
  ctx.lineWidth = 34;
  ctx.lineJoin = 'round';
  for (const isl of islands) {
    ctx.beginPath();
    tracePolygon(ctx, isl.points);
    ctx.stroke();
    for (const lag of isl.lagoons ?? []) {
      ctx.beginPath();
      tracePolygon(ctx, lag.points);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function strokeLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

function lineVisible(rc: RenderContext, camera: Camera, pts: { x: number; y: number }[]): boolean {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return isWorldCircleVisible(rc, (minX + maxX) / 2, (minY + maxY) / 2, Math.hypot(maxX - minX, maxY - minY) / 2 + 50, camera);
}

/** Rivers, roads, bridges, town blocks and peaks over the ground raster. */
export function drawTerrainOverlays(rc: RenderContext, map: TerrainMap, camera: Camera): void {
  const ctx = rc.ctx;
  const zoom = camera.zoom;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Lakes and reservoirs
  for (const lake of map.lakes) {
    if (!lineVisible(rc, camera, lake.points)) continue;
    ctx.beginPath();
    for (let i = 0; i < lake.points.length; i++) {
      const p = lake.points[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#17496A';
    ctx.fill();
    ctx.strokeStyle = 'rgba(129, 212, 250, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (lake.name && zoom >= 0.1) {
      const c = lake.points.reduce((a, p) => ({ x: a.x + p.x / lake.points.length, y: a.y + p.y / lake.points.length }), { x: 0, y: 0 });
      ctx.font = `italic ${Math.round(11 / Math.max(zoom, 0.25))}px serif`;
      ctx.fillStyle = 'rgba(179, 229, 252, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(lake.name, c.x, c.y);
    }
  }

  // Rivers: dark bank, water, faint highlight
  for (const rv of map.rivers) {
    if (!lineVisible(rc, camera, rv.points)) continue;
    ctx.strokeStyle = 'rgba(10, 30, 40, 0.8)';
    ctx.lineWidth = rv.width + 6;
    strokeLine(ctx, rv.points);
    ctx.strokeStyle = '#1C5F86';
    ctx.lineWidth = rv.width;
    strokeLine(ctx, rv.points);
    ctx.strokeStyle = 'rgba(129, 212, 250, 0.35)';
    ctx.lineWidth = Math.max(1, rv.width * 0.25);
    strokeLine(ctx, rv.points);
    if (rv.kind === 'canal') {
      // Canal embankments
      ctx.strokeStyle = 'rgba(200, 200, 190, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 10]);
      strokeLine(ctx, rv.points);
      ctx.setLineDash([]);
    }
    if (rv.name && zoom >= 0.12 && zoom < 0.6) {
      const mid = rv.points[Math.floor(rv.points.length * 0.4)];
      const nxt = rv.points[Math.min(rv.points.length - 1, Math.floor(rv.points.length * 0.4) + 3)];
      let ang = Math.atan2(nxt.y - mid.y, nxt.x - mid.x);
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      ctx.save();
      ctx.translate(mid.x, mid.y);
      ctx.rotate(ang);
      ctx.font = `italic ${Math.round(11 / zoom)}px serif`;
      ctx.fillStyle = 'rgba(179, 229, 252, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(rv.name, 0, -rv.width - 6 / zoom);
      ctx.restore();
    }
  }

  // Roads: casing and surface; trails dashed
  for (const rd of map.roads) {
    if (!lineVisible(rc, camera, rd.points)) continue;
    if (rd.kind === 'rail') {
      // Railway: dark line with sleepers
      ctx.strokeStyle = 'rgba(20, 20, 24, 0.85)';
      ctx.lineWidth = 3.2;
      strokeLine(ctx, rd.points);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
      ctx.lineWidth = 5;
      ctx.setLineDash([1.5, 9]);
      strokeLine(ctx, rd.points);
      ctx.setLineDash([]);
    } else if (rd.kind === 'highway') {
      ctx.strokeStyle = 'rgba(15, 18, 22, 0.8)';
      ctx.lineWidth = rd.width + 4;
      strokeLine(ctx, rd.points);
      ctx.strokeStyle = 'rgba(214, 196, 140, 0.9)';
      ctx.lineWidth = rd.width;
      strokeLine(ctx, rd.points);
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.8)';
      ctx.lineWidth = 1;
      strokeLine(ctx, rd.points);
    } else if (rd.kind === 'trail') {
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(161, 136, 127, 0.75)';
      ctx.lineWidth = 2.4;
      strokeLine(ctx, rd.points);
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(15, 18, 22, 0.75)';
      ctx.lineWidth = rd.width + 3;
      strokeLine(ctx, rd.points);
      ctx.strokeStyle = 'rgba(190, 186, 170, 0.85)';
      ctx.lineWidth = rd.width;
      strokeLine(ctx, rd.points);
    }
  }

  // Bridges
  for (const br of map.bridges) {
    if (!isWorldCircleVisible(rc, br.pos.x, br.pos.y, 40, camera)) continue;
    ctx.save();
    ctx.translate(br.pos.x, br.pos.y);
    ctx.rotate(br.angle);
    ctx.fillStyle = '#B0A88E';
    ctx.strokeStyle = '#2B2B2B';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-16, -5, 32, 10);
    ctx.strokeRect(-16, -5, 32, 10);
    ctx.restore();
  }

  // Built-up areas: streets and buildings (the raster shows the built-up ground far out)
  if (zoom >= 0.18) {
    for (const d of map.districts) {
      if (!isWorldCircleVisible(rc, d.center.x, d.center.y, d.radius * 2, camera)) continue;
      ctx.strokeStyle = 'rgba(200, 196, 180, 0.5)';
      for (const st of d.streets) {
        ctx.lineWidth = st.width;
        ctx.beginPath();
        ctx.moveTo(st.from.x, st.from.y);
        ctx.lineTo(st.to.x, st.to.y);
        ctx.stroke();
      }
      const shadows = zoom >= 0.5 && d.kind !== 'camp';
      for (const b of d.blocks) {
        const p = b.pts;
        if (shadows) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.moveTo(p[0].x + 2, p[0].y + 2);
          for (let k = 1; k < 4; k++) ctx.lineTo(p[k].x + 2, p[k].y + 2);
          ctx.closePath();
          ctx.fill();
        }
        if (d.kind === 'camp') ctx.fillStyle = 'rgba(240, 230, 190, 0.8)';
        else {
          const v = Math.round(70 + b.tone * 70);
          ctx.fillStyle = `rgb(${v}, ${v - 4}, ${v - 12})`;
        }
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(p[k].x, p[k].y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Peaks
  if (zoom >= 0.22) {
    for (const pk of map.peaks) {
      if (!isWorldCircleVisible(rc, pk.pos.x, pk.pos.y, 60, camera)) continue;
      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.moveTo(pk.pos.x, pk.pos.y - 9);
      ctx.lineTo(pk.pos.x + 6, pk.pos.y + 3);
      ctx.lineTo(pk.pos.x - 6, pk.pos.y + 3);
      ctx.closePath();
      ctx.fill();
      if (zoom >= 0.4) {
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(236, 239, 241, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(pk.label, pk.pos.x, pk.pos.y - 13);
      }
    }
  }
  ctx.restore();
}
