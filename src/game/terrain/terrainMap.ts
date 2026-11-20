import { Era, Island, Vector2D } from '../../types/game';
import { chaikin, fbm, meander, rng } from './noise';

/**
 * One terrain model for every theatre.
 *
 * The sector generator still *authors* terrain the way a scenario designer would: coastline
 * polygons, ridge spines, forest belts, river and road polylines, towns as installations. From
 * those, TerrainMap builds a classified grid (one terrain type and an elevation per 40 m cell)
 * blended with seeded noise, so edges become organic instead of the authored circles, bands
 * and straight lines. The same grid serves:
 *
 *  - rendering: baked once into a cached raster (render/terrain.ts) with hill shading and
 *    contour lines, plus crisp vector overlays (rivers, roads, bridges, town blocks);
 *  - gameplay: movement speed, cover from air attack and the urban-combat rule all ask the
 *    grid what is under a unit (`at`, `moveFactor`, `airConcealment`, `isUrban`).
 *
 * Eras 1-2 build Pacific islands and coral atolls (jungle, palm groves, beaches, lagoons);
 * eras 3-5 add the continental mainland (Korean mountains and valley farms, Tonkin delta
 * paddies and jungle hills, North European farmland and woods) next to the offshore islands.
 */

export const TERRAIN = {
  water: 0,
  lagoon: 1,
  beach: 2,
  plain: 3,
  farmland: 4,
  paddy: 5,
  forest: 6,
  jungle: 7,
  mangrove: 8,
  palms: 9,
  hill: 10,
  mountain: 11,
  urban: 12,
  marsh: 13,
  river: 14,
} as const;
export type TerrainType = (typeof TERRAIN)[keyof typeof TERRAIN];

export const TERRAIN_NAMES: Record<TerrainType, string> = {
  0: '海域', 1: '潟湖', 2: '海灘', 3: '平原草地', 4: '農田', 5: '水稻田', 6: '森林', 7: '熱帶叢林',
  8: '紅樹林', 9: '椰林', 10: '丘陵', 11: '山地', 12: '市街', 13: '沼澤', 14: '河流',
};

/** Ground speed multipliers: [foot, vehicle]. Roads override with ROAD_SPEED. */
const MOVE: Record<TerrainType, [number, number]> = {
  0: [0, 0], 1: [0, 0], 2: [0.85, 0.75], 3: [1, 1], 4: [0.95, 0.9], 5: [0.6, 0.4], 6: [0.75, 0.6],
  7: [0.6, 0.4], 8: [0.45, 0.25], 9: [0.85, 0.75], 10: [0.8, 0.7], 11: [0.5, 0.3], 12: [0.85, 0.75],
  13: [0.45, 0.3], 14: [0.4, 0.3],
};
const ROAD_SPEED: [number, number] = [1.15, 1.35];

/** Damage multiplier from air attack: canopy hides troops from pilots. */
const AIR_CONCEALMENT: Partial<Record<TerrainType, number>> = { 6: 0.8, 7: 0.7, 8: 0.75, 9: 0.9 };

export interface UrbanBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0..1 roof tone. */
  tone: number;
}

export interface UrbanDistrict {
  name: string;
  center: Vector2D;
  radius: number;
  angle: number;
  kind: 'city' | 'town' | 'settlement' | 'camp';
  blocks: UrbanBlock[];
  /** Main streets through the district (local frame: rotated by `angle`). */
  avenues: { from: Vector2D; to: Vector2D }[];
}

export interface TerrainLine {
  points: Vector2D[];
  width: number;
  kind: 'river' | 'road' | 'trail';
}

export interface Peak {
  pos: Vector2D;
  label: string;
}

const CELL = 40;

export class TerrainMap {
  readonly cell = CELL;
  readonly cols: number;
  readonly rows: number;
  readonly type: Uint8Array;
  readonly elev: Float32Array;
  /** 1 where a road runs through the cell. */
  readonly road: Uint8Array;
  /** Distance to the nearest river (capped at 700), for flood-plain farming. */
  readonly riverNear: Float32Array;
  readonly rivers: TerrainLine[] = [];
  readonly roads: TerrainLine[] = [];
  readonly bridges: { pos: Vector2D; angle: number }[] = [];
  readonly districts: UrbanDistrict[] = [];
  readonly peaks: Peak[] = [];
  /** Bumped when the map changes, so cached rasters know to rebuild. */
  version = 0;

  constructor(readonly worldSize: number, readonly era: Era, readonly seed: number) {
    this.cols = Math.ceil(worldSize / CELL);
    this.rows = Math.ceil(worldSize / CELL);
    this.type = new Uint8Array(this.cols * this.rows);
    this.elev = new Float32Array(this.cols * this.rows);
    this.road = new Uint8Array(this.cols * this.rows);
    this.riverNear = new Float32Array(this.cols * this.rows).fill(Infinity);
  }

  private idx(x: number, y: number): number {
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  at(x: number, y: number): TerrainType {
    const i = this.idx(x, y);
    return (i < 0 ? TERRAIN.water : this.type[i]) as TerrainType;
  }

  elevationAt(x: number, y: number): number {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.elev[i];
  }

  onRoad(x: number, y: number): boolean {
    const i = this.idx(x, y);
    return i >= 0 && this.road[i] === 1;
  }

  /** Ground speed multiplier for a unit at this point. */
  moveFactor(x: number, y: number, vehicle: boolean): number {
    if (this.onRoad(x, y)) return ROAD_SPEED[vehicle ? 1 : 0];
    const t = this.at(x, y);
    if (t === TERRAIN.water || t === TERRAIN.lagoon) return 1; // amphibians: handled by the engine
    return MOVE[t][vehicle ? 1 : 0];
  }

  /** Multiplier on air-delivered damage to troops here (forest canopy). */
  airConcealment(x: number, y: number): number {
    return AIR_CONCEALMENT[this.at(x, y)] ?? 1;
  }

  isUrban(x: number, y: number): boolean {
    return this.at(x, y) === TERRAIN.urban;
  }

  // ── Build ───────────────────────────────────────────────────────────────────────────────────

  /** Iterates the cells within `r` of a point (cell centres). */
  private stampDisc(cx: number, cy: number, r: number, fn: (i: number, d: number, x: number, y: number) => void): void {
    const c0 = Math.max(0, Math.floor((cx - r) / CELL));
    const c1 = Math.min(this.cols - 1, Math.floor((cx + r) / CELL));
    const r0 = Math.max(0, Math.floor((cy - r) / CELL));
    const r1 = Math.min(this.rows - 1, Math.floor((cy + r) / CELL));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const x = (col + 0.5) * CELL;
        const y = (row + 0.5) * CELL;
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) fn(row * this.cols + col, d, x, y);
      }
    }
  }

  /** Iterates cells within `r` of a polyline, with the distance to it. */
  private stampLine(points: Vector2D[], r: number, fn: (i: number, d: number, x: number, y: number) => void): void {
    const best = new Map<number, number>();
    const pos = new Map<number, [number, number]>();
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k];
      const b = points[k + 1];
      const minX = Math.min(a.x, b.x) - r;
      const maxX = Math.max(a.x, b.x) + r;
      const minY = Math.min(a.y, b.y) - r;
      const maxY = Math.max(a.y, b.y) + r;
      const c0 = Math.max(0, Math.floor(minX / CELL));
      const c1 = Math.min(this.cols - 1, Math.floor(maxX / CELL));
      const r0 = Math.max(0, Math.floor(minY / CELL));
      const r1 = Math.min(this.rows - 1, Math.floor(maxY / CELL));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const x = (col + 0.5) * CELL;
          const y = (row + 0.5) * CELL;
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
          const d = Math.hypot(x - a.x - dx * t, y - a.y - dy * t);
          if (d > r) continue;
          const i = row * this.cols + col;
          const prev = best.get(i);
          if (prev === undefined || d < prev) {
            best.set(i, d);
            pos.set(i, [x, y]);
          }
        }
      }
    }
    for (const [i, d] of best) {
      const [x, y] = pos.get(i)!;
      fn(i, d, x, y);
    }
  }

  build(islands: Island[]): this {
    const s = this.seed;
    const era = this.era;
    const pacific = era === 'era1' || era === 'era2';

    // 1. Land and water: each island's coastline; lagoons stay water
    for (const isl of islands) {
      const xs = isl.points.map((p) => p.x);
      const ys = isl.points.map((p) => p.y);
      const minX = Math.max(0, Math.min(...xs));
      const minY = Math.max(0, Math.min(...ys));
      const maxY = Math.min(this.worldSize, Math.max(...ys));
      for (let row = Math.floor(minY / CELL); row <= Math.min(this.rows - 1, Math.floor(maxY / CELL)); row++) {
        const y = (row + 0.5) * CELL;
        // Scanline: crossings of this row with the coastline, then fill between pairs
        const xsCross = scanline(isl.points, y);
        for (let k = 0; k + 1 < xsCross.length; k += 2) {
          const ca = Math.max(0, Math.ceil(xsCross[k] / CELL - 0.5));
          const cb = Math.min(this.cols - 1, Math.floor(xsCross[k + 1] / CELL - 0.5));
          for (let col = Math.max(ca, Math.floor(minX / CELL)); col <= cb; col++) this.type[row * this.cols + col] = TERRAIN.plain;
        }
      }
      for (const lag of isl.lagoons ?? []) {
        const lys = lag.points.map((p) => p.y);
        for (let row = Math.floor(Math.min(...lys) / CELL); row <= Math.floor(Math.max(...lys) / CELL); row++) {
          if (row < 0 || row >= this.rows) continue;
          const xsCross = scanline(lag.points, (row + 0.5) * CELL);
          for (let k = 0; k + 1 < xsCross.length; k += 2) {
            for (let col = Math.ceil(xsCross[k] / CELL - 0.5); col <= Math.floor(xsCross[k + 1] / CELL - 0.5); col++) {
              if (col >= 0 && col < this.cols) this.type[row * this.cols + col] = TERRAIN.lagoon;
            }
          }
        }
      }
    }
    const isLand = (i: number) => this.type[i] !== TERRAIN.water && this.type[i] !== TERRAIN.lagoon;

    // 2. Elevation: rolling ground, rising inland, plus ridges and hills
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const i = row * this.cols + col;
        if (!isLand(i)) continue;
        const x = (col + 0.5) * CELL;
        const y = (row + 0.5) * CELL;
        this.elev[i] = fbm(x / 1600, y / 1600, s + 3, 4) * 0.32;
      }
    }
    // Distance from the coast (in cells, capped) lifts the interior of large islands and the mainland
    const coastDist = this.distanceFromWater(isLand, 40);
    for (let i = 0; i < coastDist.length; i++) if (isLand(i)) this.elev[i] += Math.min(1, coastDist[i] / 40) * 0.18;

    for (const isl of islands) {
      for (const ridge of isl.mountainRidges ?? []) {
        if (!ridge.spine || ridge.spine.length < 2) continue;
        const w = ridge.width || 200;
        const spine = meander(ridge.spine, w * 1.1, 260, s + ridge.id.length * 7);
        // A massif, not a wall: broad, with a warped edge, spurs and saddles along the crest
        const half = w * 1.6;
        const relief = era === 'era5' ? 0.55 : 1; // the North German plain has hills, not mountains
        const height = (Math.min(1, (ridge.height || 600) / 1200) * 0.5 + 0.3) * relief;
        this.stampLine(spine, half * 1.9, (i, d, x, y) => {
          if (!isLand(i)) return;
          const warp = (fbm(x / 650, y / 650, s + 11, 4) - 0.5) * half * 1.4;
          const t = Math.max(0, 1 - Math.max(0, d + warp) / half);
          if (t <= 0) return;
          const crest = 0.75 + 0.5 * fbm(x / 900, y / 900, s + 12, 3); // saddles and summits
          const rough = fbm(x / 160, y / 160, s + 13, 3);
          this.elev[i] = Math.max(this.elev[i], height * crest * Math.pow(t, 1.6) + t * 0.18 * rough + this.elev[i] * (1 - t));
        });
        for (const pk of ridge.peaks ?? []) this.peaks.push({ pos: pk.pos, label: pk.label });
      }
      for (const h of isl.hills ?? []) {
        this.stampDisc(h.x, h.y, h.radius * 1.4, (i, d, x, y) => {
          if (!isLand(i)) return;
          const t = Math.max(0, 1 - d / (h.radius * (0.8 + 0.5 * fbm(x / 200, y / 200, s + 17, 2))));
          this.elev[i] = Math.max(this.elev[i], 0.3 + 0.32 * t * t);
        });
      }
    }

    // 3. Rivers and roads: meander the authored polylines, then mark the cells
    for (const isl of islands) {
      for (const rv of isl.rivers ?? []) {
        const pts = meander(rv.points, 240, 200, s + rv.points.length * 31);
        const width = rv.width || 14;
        this.rivers.push({ points: pts, width, kind: 'river' });
        this.stampLine(pts, width * 0.5 + CELL * 0.5, (i) => {
          if (isLand(i)) this.type[i] = TERRAIN.river;
        });
        // Valley floor: the river cuts the ground down gently, and marks its flood plain
        this.stampLine(pts, 700, (i, d) => {
          if (!isLand(i)) return;
          const t = d / 700;
          this.elev[i] = this.elev[i] * (0.35 + 0.65 * t * t);
          this.riverNear[i] = Math.min(this.riverNear[i], d);
        });
      }
      for (const rd of isl.roads ?? []) {
        const pts = meander(rd.points, rd.type === 'trail' ? 45 : 25, 160, s + rd.points.length * 17);
        this.roads.push({ points: pts, width: rd.type === 'trail' ? 3 : 5, kind: rd.type });
      }
    }

    // 4. Towns: organic built-up areas with street blocks
    for (const isl of islands) {
      for (const inst of isl.installations) {
        const r = inst.civilianZoneRadius ?? 0;
        if (r <= 0) continue;
        const kind = inst.type === 'city' ? 'city' : inst.type === 'town' ? 'town' : inst.type === 'refugee_camp' ? 'camp' : 'settlement';
        this.districts.push(buildDistrict(inst.name, inst.pos, r, kind, s + Math.round(inst.pos.x + inst.pos.y)));
      }
    }

    // 5. Classify each land cell
    const vegetationAuthored = new Uint8Array(this.type.length);
    for (const isl of islands) {
      for (const belt of isl.forestBelts ?? []) {
        if (!belt.points || belt.points.length < 3) continue;
        // Authored belts are shared between theatres: tropical biomes only in the Pacific and Tonkin
        const tropical = pacific || era === 'era4';
        const code =
          belt.biome === 'mangrove'
            ? tropical ? TERRAIN.mangrove : 0 // no mangroves outside the tropics: leave it to the generator
            : belt.biome === 'palms'
            ? tropical ? TERRAIN.palms : TERRAIN.forest
            : belt.biome === 'bamboo' || !tropical
            ? TERRAIN.forest
            : TERRAIN.jungle;
        if (!code) continue;
        // Authored belts are coarse polygons: grow them outward by noise so the edge is ragged
        const smooth = chaikin(belt.points, 2, true);
        const ys = smooth.map((p) => p.y);
        const xs = smooth.map((p) => p.x);
        const pad = 160;
        for (let row = Math.max(0, Math.floor((Math.min(...ys) - pad) / CELL)); row <= Math.min(this.rows - 1, Math.floor((Math.max(...ys) + pad) / CELL)); row++) {
          for (let col = Math.max(0, Math.floor((Math.min(...xs) - pad) / CELL)); col <= Math.min(this.cols - 1, Math.floor((Math.max(...xs) + pad) / CELL)); col++) {
            const i = row * this.cols + col;
            if (!isLand(i)) continue;
            const x = (col + 0.5) * CELL;
            const y = (row + 0.5) * CELL;
            const inside = pointInPolygon(x, y, smooth);
            const n = fbm(x / 260, y / 260, s + 21, 3);
            if ((inside && n > 0.28) || (!inside && n > 0.62 && distToPolygon(x, y, smooth) < pad * (n - 0.5) * 3)) vegetationAuthored[i] = code;
          }
        }
      }
      for (const j of isl.jungles ?? []) {
        this.stampDisc(j.x, j.y, j.radius * 1.5, (i, d, x, y) => {
          if (isLand(i) && d < j.radius * (0.7 + 0.7 * fbm(x / 220, y / 220, s + 23, 3))) vegetationAuthored[i] = pacific || era === 'era4' ? TERRAIN.jungle : TERRAIN.forest;
        });
      }
    }

    const atoll = new Uint8Array(this.type.length);
    for (const isl of islands) {
      if (!isl.isAtoll) continue;
      this.stampDisc(isl.center.x, isl.center.y, isl.radius * 1.4, (i) => (atoll[i] = 1));
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const i = row * this.cols + col;
        if (!isLand(i) || this.type[i] === TERRAIN.river) continue;
        const x = (col + 0.5) * CELL;
        const y = (row + 0.5) * CELL;
        const e = this.elev[i];
        const veg = fbm(x / 900, y / 900, s + 31, 4);
        const wet = fbm(x / 700, y / 700, s + 37, 3);
        let t: TerrainType;
        if (e > 0.62) t = TERRAIN.mountain;
        else if (vegetationAuthored[i]) t = vegetationAuthored[i] as TerrainType;
        else if (atoll[i]) t = veg > 0.42 ? TERRAIN.palms : TERRAIN.plain;
        else if (pacific) t = veg > 0.4 ? TERRAIN.jungle : e > 0.45 ? TERRAIN.hill : TERRAIN.plain; // jungle and kunai grass
        else if (era === 'era3') {
          // Korea: forested slopes, terraced farms in the valleys
          const floodPlain = this.riverNear[i] < 450;
          t = e > 0.45 ? (veg > 0.45 ? TERRAIN.forest : TERRAIN.hill) : floodPlain && wet > 0.4 ? TERRAIN.paddy : veg > 0.6 ? TERRAIN.forest : TERRAIN.farmland;
        } else if (era === 'era4') {
          // Tonkin: jungle hills, rice paddies and marsh in the delta
          const floodPlain = this.riverNear[i] < 650 || coastDist[i] < 8;
          t = e > 0.42 ? (veg > 0.35 ? TERRAIN.jungle : TERRAIN.hill) : floodPlain && wet > 0.66 ? TERRAIN.marsh : floodPlain && wet > 0.3 ? TERRAIN.paddy : veg > 0.5 ? TERRAIN.jungle : TERRAIN.plain;
        } else {
          // North Germany / Baltic plain: farmland patchwork, woods, wet heath
          t = e > 0.42 ? (veg > 0.4 ? TERRAIN.forest : TERRAIN.farmland) : veg > 0.6 ? TERRAIN.forest : wet > 0.72 && this.riverNear[i] < 700 ? TERRAIN.marsh : TERRAIN.farmland;
        }
        this.type[i] = t;
      }
    }

    // Beaches: land touching the sea (not rivers), where the ground is low
    for (let row = 1; row < this.rows - 1; row++) {
      for (let col = 1; col < this.cols - 1; col++) {
        const i = row * this.cols + col;
        if (!isLand(i) || this.type[i] === TERRAIN.river || this.elev[i] > 0.45) continue;
        if (coastDist[i] <= 1) {
          const x = (col + 0.5) * CELL;
          const y = (row + 0.5) * CELL;
          this.type[i] = era === 'era4' && fbm(x / 500, y / 500, s + 41, 2) > 0.55 ? TERRAIN.mangrove : TERRAIN.beach;
        }
      }
    }

    // Towns override everything but water
    for (const dist of this.districts) {
      if (dist.kind === 'camp') continue;
      this.stampDisc(dist.center.x, dist.center.y, dist.radius * 1.3, (i, d, x, y) => {
        if (!isLand(i)) return;
        const edge = dist.radius * (0.6 + 0.75 * fbm(x / 110, y / 110, s + 43, 3));
        if (d < edge) {
          this.type[i] = TERRAIN.urban;
          this.elev[i] = Math.min(this.elev[i], 0.4);
        }
      });
    }

    // Road cells (after classification so roads survive towns and forests)
    for (const rd of this.roads) {
      this.stampLine(rd.points, CELL * 0.75, (i) => {
        if (isLand(i)) this.road[i] = 1;
      });
    }
    // Bridges where a road crosses a river
    for (const rd of this.roads) {
      if (rd.kind !== 'road') continue;
      for (const rv of this.rivers) {
        for (const hit of polylineIntersections(rd.points, rv.points)) {
          if (!this.bridges.some((b) => Math.hypot(b.pos.x - hit.pos.x, b.pos.y - hit.pos.y) < 200)) this.bridges.push(hit);
        }
      }
    }
    this.version++;
    return this;
  }

  /** Chebyshev distance (in cells, capped) from each land cell to the nearest water cell. */
  private distanceFromWater(isLand: (i: number) => boolean, cap: number): Uint8Array {
    const d = new Uint8Array(this.type.length).fill(cap);
    let frontier: number[] = [];
    for (let i = 0; i < d.length; i++) {
      if (!isLand(i)) {
        d[i] = 0;
        frontier.push(i);
      }
    }
    for (let step = 1; step < cap && frontier.length; step++) {
      const next: number[] = [];
      for (const i of frontier) {
        const r = Math.floor(i / this.cols);
        const c = i % this.cols;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= this.rows || cc >= this.cols) continue;
            const j = rr * this.cols + cc;
            if (d[j] > step) {
              d[j] = step;
              next.push(j);
            }
          }
        }
      }
      frontier = next;
    }
    return d;
  }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────────────────────

function scanline(poly: Vector2D[], y: number): number[] {
  const xs: number[] = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
  }
  return xs.sort((p, q) => p - q);
}

function pointInPolygon(x: number, y: number, poly: Vector2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function distToPolygon(x: number, y: number, poly: Vector2D[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, y - a.y - dy * t));
  }
  return best;
}

function polylineIntersections(a: Vector2D[], b: Vector2D[]): { pos: Vector2D; angle: number }[] {
  const out: { pos: Vector2D; angle: number }[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    const p = a[i];
    const p2 = a[i + 1];
    for (let j = 0; j < b.length - 1; j++) {
      const q = b[j];
      const q2 = b[j + 1];
      const rx = p2.x - p.x;
      const ry = p2.y - p.y;
      const sx = q2.x - q.x;
      const sy = q2.y - q.y;
      const den = rx * sy - ry * sx;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((q.x - p.x) * sy - (q.y - p.y) * sx) / den;
      const u = ((q.x - p.x) * ry - (q.y - p.y) * rx) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push({ pos: { x: p.x + rx * t, y: p.y + ry * t }, angle: Math.atan2(ry, rx) });
    }
  }
  return out;
}

/**
 * A built-up area: a street grid at a seeded angle, blocks thinning toward a ragged edge, a
 * dense core for cities, scattered houses along lanes for villages, tent rows for camps.
 */
function buildDistrict(name: string, center: Vector2D, radius: number, kind: UrbanDistrict['kind'], seed: number): UrbanDistrict {
  const rand = rng(seed);
  const angle = rand() * Math.PI;
  const block = kind === 'city' ? 34 : kind === 'town' ? 30 : 26;
  const street = kind === 'city' ? 9 : 7;
  const blocks: UrbanBlock[] = [];
  const n = Math.ceil((radius * 1.2) / block);
  for (let gy = -n; gy <= n; gy++) {
    for (let gx = -n; gx <= n; gx++) {
      const lx = gx * block;
      const ly = gy * block;
      const d = Math.hypot(lx, ly);
      const edge = radius * (0.7 + 0.45 * fbm((lx + center.x) / 160, (ly + center.y) / 160, seed, 3));
      if (d > edge) continue;
      const density = kind === 'city' ? 1 - (d / edge) * 0.55 : kind === 'town' ? 0.85 - (d / edge) * 0.5 : kind === 'camp' ? 0.7 : 0.55 - (d / edge) * 0.3;
      if (rand() > density) continue;
      const inner = block - street;
      if (kind === 'city' && d < edge * 0.45) {
        // Downtown: one big block footprint
        blocks.push({ x: lx - inner / 2, y: ly - inner / 2, w: inner, h: inner, tone: 0.55 + rand() * 0.4 });
      } else if (kind === 'camp') {
        for (let k = 0; k < 3; k++) blocks.push({ x: lx - inner / 2 + k * (inner / 3), y: ly - 4, w: inner / 3 - 2, h: 8, tone: 0.9 });
      } else {
        // Split into 2-4 houses / buildings
        const parts = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < parts; k++) {
          const w = inner * (0.35 + rand() * 0.35);
          const h = inner * (0.35 + rand() * 0.35);
          blocks.push({ x: lx - inner / 2 + rand() * (inner - w), y: ly - inner / 2 + rand() * (inner - h), w, h, tone: 0.3 + rand() * 0.6 });
        }
      }
    }
  }
  const avenues = kind === 'camp' ? [] : [
    { from: { x: -radius, y: 0 }, to: { x: radius, y: 0 } },
    { from: { x: 0, y: -radius }, to: { x: 0, y: radius } },
  ];
  return { name, center, radius, angle, kind, blocks, avenues };
}

// ── Cache: one map per generated sector ─────────────────────────────────────────────────────

const CACHE = new WeakMap<Island[], TerrainMap>();

/** The terrain of a sector, built on first use and shared by the engine and the renderer. */
export function getTerrainMap(islands: Island[], worldSize: number, era: Era): TerrainMap {
  let map = CACHE.get(islands);
  if (!map || map.era !== era || map.worldSize !== worldSize) {
    const seed = Math.round(islands.reduce((a, isl) => a + isl.center.x * 3 + isl.center.y, 0)) % 100000;
    map = new TerrainMap(worldSize, era, seed).build(islands);
    CACHE.set(islands, map);
  }
  return map;
}
