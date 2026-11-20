import { Vector2D } from '../../types/game';
import { TERRAIN, TerrainMap, TerrainType } from './terrainMap';

/**
 * How terrain shapes the ground battle:
 *
 *  - line of sight: direct fire needs a clear line over the ground between shooter and target;
 *    a ridge or hill crest in between blocks it (artillery and rockets fire indirect, over it);
 *  - high ground: firing down adds reach (better observation, flatter trajectory); firing up
 *    loses some;
 *  - concealment: troops in jungle, forest, towns or mangrove are only spotted at short range,
 *    so a shooter has to close in before engaging them;
 *  - movement: terrain-cost pathfinding routes ground units along roads, over bridges and
 *    around lakes, swamps and mountains.
 */

/** Spotting-range multiplier for a target standing in this terrain. */
const CONCEALMENT: Partial<Record<TerrainType, number>> = {
  [TERRAIN.jungle]: 0.45,
  [TERRAIN.forest]: 0.6,
  [TERRAIN.mangrove]: 0.5,
  [TERRAIN.urban]: 0.6,
  [TERRAIN.palms]: 0.8,
  [TERRAIN.marsh]: 0.85,
};

/** Minimum distance (map units) at which anything is spotted, whatever the cover. */
const SPOT_FLOOR = 260;

export function concealment(map: TerrainMap, pos: Vector2D): number {
  return CONCEALMENT[map.at(pos.x, pos.y)] ?? 1;
}

/** Range multiplier from the height difference: up to +25 % firing down, −15 % firing up. */
export function heightRangeFactor(map: TerrainMap, from: Vector2D, to: Vector2D, indirect: boolean): number {
  const dh = map.elevationAt(from.x, from.y) - map.elevationAt(to.x, to.y);
  const k = indirect ? 0.2 : 0.6;
  return 1 + Math.max(-0.15, Math.min(0.25, dh * k));
}

/** True if no terrain between the two points rises above the sight line (with eye height). */
export function hasLineOfSight(map: TerrainMap, a: Vector2D, b: Vector2D): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d < map.cell * 2) return true;
  const ea = map.elevationAt(a.x, a.y) + 0.04;
  const eb = map.elevationAt(b.x, b.y) + 0.04;
  const steps = Math.min(40, Math.ceil(d / (map.cell * 1.5)));
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    const h = map.elevationAt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    if (h > ea + (eb - ea) * t + 0.05) return false;
  }
  return true;
}

/**
 * Whether a shooter at `from` with `baseRange` can engage a ground target at `to`: within its
 * terrain-adjusted reach, the target spotted through its cover, and (for direct fire) in sight.
 */
export function canEngageGround(map: TerrainMap, from: Vector2D, baseRange: number, to: Vector2D, indirect: boolean): boolean {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const reach = baseRange * heightRangeFactor(map, from, to, indirect);
  if (d > reach) return false;
  // Indirect fire still needs someone to see the target; cover hides it from observers too
  const spot = Math.max(SPOT_FLOOR, reach * concealment(map, to) * (indirect ? 1.4 : 1));
  if (d > spot) return false;
  return indirect || hasLineOfSight(map, from, to);
}

// ── Pathfinding ───────────────────────────────────────────────────────────────────────────────

const NAV_CELL = 120;

interface NavGrid {
  cols: number;
  rows: number;
  /** Seconds-per-unit style cost multipliers; Infinity = impassable. */
  costFoot: Float32Array;
  costVehicle: Float32Array;
}
const NAV_CACHE = new WeakMap<TerrainMap, NavGrid>();

function navGrid(map: TerrainMap): NavGrid {
  let g = NAV_CACHE.get(map);
  if (g && g.cols) return g;
  const cols = Math.ceil(map.worldSize / NAV_CELL);
  const rows = cols;
  const costFoot = new Float32Array(cols * rows);
  const costVehicle = new Float32Array(cols * rows);
  const sub = NAV_CELL / 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Worst of a 3×3 sample, but a road anywhere in the cell lets traffic through (bridges)
      let foot = Infinity;
      let veh = Infinity;
      let worstFoot = 0;
      let worstVeh = 0;
      let road = false;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const x = c * NAV_CELL + (sx + 0.5) * sub;
          const y = r * NAV_CELL + (sy + 0.5) * sub;
          const t = map.at(x, y);
          if (map.onRoad(x, y)) road = true;
          const water = t === TERRAIN.water || t === TERRAIN.lagoon || t === TERRAIN.lake;
          const f = water ? 0 : map.moveFactor(x, y, false);
          const v = water ? 0 : map.moveFactor(x, y, true);
          worstFoot = Math.max(worstFoot, f > 0 ? 1 / f : 1e9);
          worstVeh = Math.max(worstVeh, v > 0 ? 1 / v : 1e9);
        }
      }
      foot = road ? 1 / 1.15 : worstFoot;
      veh = road ? 1 / 1.35 : worstVeh;
      costFoot[r * cols + c] = foot >= 1e8 ? Infinity : foot;
      costVehicle[r * cols + c] = veh >= 1e8 ? Infinity : veh;
    }
  }
  g = { cols, rows, costFoot, costVehicle };
  NAV_CACHE.set(map, g);
  return g;
}

/** Binary min-heap keyed by f-score. */
class Heap {
  private items: number[] = [];
  private keys: number[] = [];
  get size(): number {
    return this.items.length;
  }
  push(item: number, key: number): void {
    this.items.push(item);
    this.keys.push(key);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= this.keys[i]) break;
      [this.items[p], this.items[i]] = [this.items[i], this.items[p]];
      [this.keys[p], this.keys[i]] = [this.keys[i], this.keys[p]];
      i = p;
    }
  }
  pop(): number {
    const top = this.items[0];
    const lastI = this.items.pop()!;
    const lastK = this.keys.pop()!;
    if (this.items.length) {
      this.items[0] = lastI;
      this.keys[0] = lastK;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.items.length && this.keys[r] < this.keys[m]) m = r;
        if (m === i) break;
        [this.items[m], this.items[i]] = [this.items[i], this.items[m]];
        [this.keys[m], this.keys[i]] = [this.keys[i], this.keys[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Fastest route over land for a foot or vehicle unit: A* on a 120 m grid weighted by terrain
 * speed, then shortened by straightening wherever the direct line is no slower. Returns the
 * waypoints after the start (ending at `to`), or null when no land route exists (e.g. across
 * the sea), in which case the caller keeps the straight-line order.
 */
export function findGroundPath(map: TerrainMap, from: Vector2D, to: Vector2D, vehicle: boolean): Vector2D[] | null {
  const g = navGrid(map);
  const cost = vehicle ? g.costVehicle : g.costFoot;
  const cellOf = (p: Vector2D) => Math.max(0, Math.min(g.rows - 1, Math.floor(p.y / NAV_CELL))) * g.cols + Math.max(0, Math.min(g.cols - 1, Math.floor(p.x / NAV_CELL)));
  const start = cellOf(from);
  const goal = cellOf(to);
  if (start === goal) return [to];
  if (!isFinite(cost[goal])) return null;
  const gScore = new Float32Array(g.cols * g.rows).fill(Infinity);
  const came = new Int32Array(g.cols * g.rows).fill(-1);
  const closed = new Uint8Array(g.cols * g.rows);
  const gx = goal % g.cols;
  const gy = Math.floor(goal / g.cols);
  const minCost = 1 / 1.35;
  const h = (i: number) => {
    const dx = Math.abs((i % g.cols) - gx);
    const dy = Math.abs(Math.floor(i / g.cols) - gy);
    return (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)) * minCost;
  };
  const open = new Heap();
  gScore[start] = 0;
  open.push(start, h(start));
  let expanded = 0;
  while (open.size) {
    const cur = open.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (++expanded > 12000) return null; // no land route nearby
    const cx = cur % g.cols;
    const cy = Math.floor(cur / g.cols);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows) continue;
        const n = ny * g.cols + nx;
        const c = cost[n];
        if (!isFinite(c) && n !== goal) continue;
        // No corner cutting past impassable cells
        if (dx && dy && (!isFinite(cost[cy * g.cols + nx]) || !isFinite(cost[ny * g.cols + cx]))) continue;
        const step = (dx && dy ? 1.414 : 1) * ((isFinite(c) ? c : 1) + cost[cur]) * 0.5;
        const t = gScore[cur] + step;
        if (t < gScore[n]) {
          gScore[n] = t;
          came[n] = cur;
          open.push(n, t + h(n));
        }
      }
    }
  }
  if (came[goal] < 0) return null;
  const cells: number[] = [];
  for (let c = goal; c !== start && c >= 0; c = came[c]) cells.push(c);
  cells.reverse();
  const centre = (i: number): Vector2D => ({ x: ((i % g.cols) + 0.5) * NAV_CELL, y: (Math.floor(i / g.cols) + 0.5) * NAV_CELL });
  // String pulling: drop a waypoint when the straight segment is no costlier than the detour
  const pts = [from, ...cells.slice(0, -1).map(centre), to];
  const lineCost = (a: Vector2D, b: Vector2D) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(d / (NAV_CELL / 2)));
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const c = cost[cellOf({ x: a.x + ((b.x - a.x) * (k + 0.5)) / n, y: a.y + ((b.y - a.y) * (k + 0.5)) / n })];
      if (!isFinite(c)) return Infinity;
      sum += c;
    }
    return (sum / n) * d;
  };
  const out: Vector2D[] = [];
  let anchor = 0;
  while (anchor < pts.length - 1) {
    let next = anchor + 1;
    let detour = lineCost(pts[anchor], pts[next]);
    for (let j = anchor + 2; j < pts.length; j++) {
      detour += lineCost(pts[j - 1], pts[j]);
      if (lineCost(pts[anchor], pts[j]) <= detour * 1.02) next = j;
    }
    out.push(pts[next]);
    anchor = next;
  }
  return out;
}

// ── Air and naval effects ─────────────────────────────────────────────────────────────────────

/**
 * Whether an air-defence site (or a ship) at `from` can see an aircraft. Aircraft above ~40 %
 * altitude are above all terrain; low fliers, helicopters and aircraft on a torpedo or strafing
 * run hug the ground, and a ridge, hill or island between them and the site hides them (radar
 * and gun-laying need a line of sight). `mast` is the sensor height above the site's ground
 * (a ship's radar mast, a flak director, a SAM radar on its trailer).
 */
export function canSeeAircraft(map: TerrainMap, from: Vector2D, plane: { pos: Vector2D; altitude?: number }, mast = 0.04): boolean {
  const alt = plane.altitude ?? 0.8;
  if (alt >= 0.4) return true;
  const ea = map.elevationAt(from.x, from.y) + mast;
  const eb = map.elevationAt(plane.pos.x, plane.pos.y) + 0.03 + alt * 0.35;
  const d = Math.hypot(plane.pos.x - from.x, plane.pos.y - from.y);
  if (d < map.cell * 2) return true;
  const steps = Math.min(40, Math.ceil(d / (map.cell * 1.5)));
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    const h = map.elevationAt(from.x + (plane.pos.x - from.x) * t, from.y + (plane.pos.y - from.y) * t);
    if (h > ea + (eb - ea) * t + 0.02) return false;
  }
  return true;
}

/**
 * Reach of a coastal battery against ships: a gun or missile radar high on a headland sees
 * further over the horizon (up to +30 % from the highest ground).
 */
export function coastalReach(map: TerrainMap, pos: Vector2D, base: number): number {
  return base * (1 + Math.min(0.3, map.elevationAt(pos.x, pos.y) * 0.45));
}

/**
 * Naval gunfire is flat: a target on the reverse slope of a ridge or behind an island's crest,
 * out of the ship's line of sight, is only hit by shells that clear the crest and plunge (×0.45).
 */
export function reverseSlopeFactor(map: TerrainMap, shipPos: Vector2D, impact: Vector2D): number {
  return hasLineOfSight(map, shipPos, impact) ? 1 : 0.45;
}
