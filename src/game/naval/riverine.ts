import { Ship, Vector2D } from '../../types/game';
import { TERRAIN, TerrainMap } from '../terrain/terrainMap';

/**
 * Brown-water navigation: the river centrelines of the terrain map as a graph that small
 * shallow-draught craft can sail — PBRs, the LCM-8 "Monitors" and assault boats of the Mobile
 * Riverine Force, LCVPs. A route runs by sea to the river mouth that serves the destination,
 * then up the channel (through confluences) to the reach nearest the target.
 */

/** Ship types that can work rivers (draught under ~1.6 m, built or adapted for it). */
export function isRiverine(ship: Ship): boolean {
  return ship.type === 'pbr' || ship.type === 'lcm8' || ship.type === 'lcvp' || ship.type === 'river_gunboat';
}

/** Depth of a river channel (m) from its width. */
export function riverDepthM(width: number): number {
  return 1.5 + width * 0.12;
}

interface RiverGraph {
  nodes: Vector2D[];
  /** Adjacency: node → [neighbour, length]. */
  edges: [number, number][][];
  /** Nodes where a river meets the sea. */
  mouths: number[];
  /** Half-width of the channel at each node. */
  halfWidth: number[];
  /** Spatial buckets of node indices (BUCKET-sized cells) for fast nearest-node queries. */
  buckets: Map<number, number[]>;
}

const BUCKET = 250;
const bucketKey = (cx: number, cy: number) => cx * 4096 + cy;

const GRAPHS = new WeakMap<TerrainMap, RiverGraph>();

function graphOf(map: TerrainMap): RiverGraph {
  let g = GRAPHS.get(map);
  if (g) return g;
  const nodes: Vector2D[] = [];
  const edges: [number, number][][] = [];
  const halfWidth: number[] = [];
  const mouths: number[] = [];
  const add = (p: Vector2D, hw: number): number => {
    // Merge with an existing node at the same spot (confluences were snapped together)
    for (let i = 0; i < nodes.length; i++) if (Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y) < 6) return i;
    nodes.push(p);
    edges.push([]);
    halfWidth.push(hw);
    return nodes.length - 1;
  };
  const link = (a: number, b: number) => {
    const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    edges[a].push([b, d]);
    edges[b].push([a, d]);
  };
  const nearSea = (p: Vector2D) => {
    for (let r = 0; r <= 160; r += 40) {
      for (let k = 0; k < 8; k++) {
        const qx = p.x + Math.cos((k * Math.PI) / 4) * r;
        const qy = p.y + Math.sin((k * Math.PI) / 4) * r;
        if (qx < 0 || qy < 0 || qx >= map.worldSize || qy >= map.worldSize) continue; // off the map is not the sea
        if (map.at(qx, qy) === TERRAIN.water) return true;
      }
    }
    return false;
  };
  for (const rv of map.rivers) {
    let prev = -1;
    for (const p of rv.points) {
      const i = add(p, rv.width / 2);
      if (prev >= 0 && prev !== i) link(prev, i);
      prev = i;
    }
    for (const end of [rv.points[0], rv.points[rv.points.length - 1]]) {
      const i = add(end, rv.width / 2);
      if (nearSea(end) && !mouths.includes(i)) mouths.push(i);
    }
  }
  // Tributary ends that were pulled onto a main river but not exactly onto one of its points
  for (let i = 0; i < nodes.length; i++) {
    if (edges[i].length !== 1) continue;
    let best = -1;
    let bestD = 30;
    for (let j = 0; j < nodes.length; j++) {
      if (j === i || edges[i].some(([n]) => n === j)) continue;
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best >= 0) link(i, best);
  }
  const buckets = new Map<number, number[]>();
  nodes.forEach((n, i) => {
    const k = bucketKey(Math.floor(n.x / BUCKET), Math.floor(n.y / BUCKET));
    const b = buckets.get(k);
    if (b) b.push(i);
    else buckets.set(k, [i]);
  });
  g = { nodes, edges, mouths, halfWidth, buckets };
  GRAPHS.set(map, g);
  return g;
}

function nearestNode(g: RiverGraph, p: Vector2D, maxD = Infinity): { i: number; d: number } {
  // Search rings of buckets outward until no closer node can exist beyond the ring
  let i = -1;
  let d = Infinity;
  if (g.nodes.length === 0) return { i, d };
  const cx = Math.floor(p.x / BUCKET);
  const cy = Math.floor(p.y / BUCKET);
  for (let r = 0; r < 64; r++) {
    for (let x = cx - r; x <= cx + r; x++) {
      for (let y = cy - r; y <= cy + r; y++) {
        if (r > 0 && x !== cx - r && x !== cx + r && y !== cy - r && y !== cy + r) continue; // ring only
        const b = g.buckets.get(bucketKey(x, y));
        if (!b) continue;
        for (const k of b) {
          const dd = Math.hypot(g.nodes[k].x - p.x, g.nodes[k].y - p.y);
          if (dd < d) {
            d = dd;
            i = k;
          }
        }
      }
    }
    if (i >= 0 && d <= r * BUCKET) break;
    if (r * BUCKET > maxD) return { i: -1, d: Infinity }; // nothing within the radius asked for
  }
  if (i < 0 && maxD === Infinity) {
    // Far from every river: fall back to the full scan
    for (let k = 0; k < g.nodes.length; k++) {
      const dd = Math.hypot(g.nodes[k].x - p.x, g.nodes[k].y - p.y);
      if (dd < d) {
        d = dd;
        i = k;
      }
    }
  }
  return { i, d };
}

/** Dijkstra over the river graph from a set of start nodes; returns distances and parents. */
function dijkstra(g: RiverGraph, starts: number[]): { dist: Float64Array; prev: Int32Array } {
  const n = g.nodes.length;
  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  // Binary min-heap of (distance, node)
  const heapD: number[] = [];
  const heapN: number[] = [];
  const push = (d: number, v: number) => {
    let i = heapD.length;
    heapD.push(d);
    heapN.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapD[p] <= heapD[i]) break;
      [heapD[p], heapD[i]] = [heapD[i], heapD[p]];
      [heapN[p], heapN[i]] = [heapN[i], heapN[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top: [number, number] = [heapD[0], heapN[0]];
    const ld = heapD.pop()!;
    const ln = heapN.pop()!;
    if (heapD.length > 0) {
      heapD[0] = ld;
      heapN[0] = ln;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heapD.length && heapD[l] < heapD[m]) m = l;
        if (r < heapD.length && heapD[r] < heapD[m]) m = r;
        if (m === i) break;
        [heapD[m], heapD[i]] = [heapD[i], heapD[m]];
        [heapN[m], heapN[i]] = [heapN[i], heapN[m]];
        i = m;
      }
    }
    return top;
  };
  for (const s0 of starts) {
    dist[s0] = 0;
    push(0, s0);
  }
  while (heapD.length > 0) {
    const [d, u] = pop();
    if (d > dist[u]) continue; // stale entry
    for (const [v, w] of g.edges[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        push(nd, v);
      }
    }
  }
  return { dist, prev };
}

function walk(prev: Int32Array, from: number): number[] {
  const out: number[] = [];
  for (let c = from; c >= 0; c = prev[c]) out.push(c);
  return out;
}

/** Whether a point lies in a river channel (with a small margin for the bank). */
export function inRiverChannel(map: TerrainMap, p: Vector2D): boolean {
  const g = graphOf(map);
  if (g.nodes.length === 0) return false;
  // Widest channels are well under 300 m across: no need to look further than that
  const { i, d } = nearestNode(g, p, 300);
  return i >= 0 && d < g.halfWidth[i] + 45;
}

/** Nearest river reach to a point (for orders given on land beside a river). */
export function nearestRiverPoint(map: TerrainMap, p: Vector2D): { pos: Vector2D; dist: number } | null {
  const g = graphOf(map);
  if (g.nodes.length === 0) return null;
  const { i, d } = nearestNode(g, p);
  return { pos: g.nodes[i], dist: d };
}

export interface RiverRoute {
  /** Sea leg needed first: sail to this river mouth (undefined when already in the river). */
  mouth?: Vector2D;
  /** Channel waypoints from the mouth (or the boat's position) up to the destination reach. */
  channel: Vector2D[];
}

/**
 * Plans a riverine route to `to`. From the sea: enter by the mouth with the shortest river
 * distance to the destination reach. From within a river: follow the channel (to a mouth and
 * out to sea if the destination is at sea — the caller then adds the sea leg).
 */
export function planRiverRoute(map: TerrainMap, from: Vector2D, to: Vector2D, fromInRiver: boolean): RiverRoute | null {
  const g = graphOf(map);
  if (g.nodes.length === 0 || g.mouths.length === 0) return null;
  const goal = nearestNode(g, to);
  if (fromInRiver) {
    const start = nearestNode(g, from);
    const goalIsRiver = goal.d < 400;
    const { dist, prev } = dijkstra(g, goalIsRiver ? [goal.i] : g.mouths);
    if (!isFinite(dist[start.i])) return null;
    // walk() from the start back toward the goal/mouth gives the forward order directly
    return { channel: walk(prev, start.i).map((k) => g.nodes[k]) };
  }
  const { dist, prev } = dijkstra(g, [goal.i]);
  let bestMouth = -1;
  let best = Infinity;
  for (const m of g.mouths) {
    const cost = dist[m] + Math.hypot(g.nodes[m].x - from.x, g.nodes[m].y - from.y) * 0.6;
    if (cost < best) {
      best = cost;
      bestMouth = m;
    }
  }
  if (bestMouth < 0 || !isFinite(dist[bestMouth])) return null;
  return { mouth: g.nodes[bestMouth], channel: walk(prev, bestMouth).map((k) => g.nodes[k]) };
}

/**
 * Patrol stations for enemy river craft: reaches that pass `accept`, at least `spacing` apart,
 * placed in pairs on the same connected river system (so boats can reinforce each other along
 * the channel), largest systems first, inland reaches first within each.
 */
export function riverPatrolStations(map: TerrainMap, accept: (p: Vector2D) => boolean, count: number, spacing = 1200): Vector2D[] {
  const g = graphOf(map);
  // Connected river systems
  const comp = new Int32Array(g.nodes.length).fill(-1);
  const systems: number[][] = [];
  for (let i = 0; i < g.nodes.length; i++) {
    if (comp[i] >= 0) continue;
    const members: number[] = [];
    const stack = [i];
    comp[i] = systems.length;
    while (stack.length) {
      const u = stack.pop()!;
      members.push(u);
      for (const [v] of g.edges[u]) if (comp[v] < 0) { comp[v] = systems.length; stack.push(v); }
    }
    systems.push(members);
  }
  systems.sort((a, b) => b.length - a.length);
  const picks: Vector2D[] = [];
  const perSystem = 2;
  for (let round = 0; round < 3 && picks.length < count; round++) {
    for (const sys of systems) {
      if (picks.length >= count) break;
      let taken = 0;
      for (const i of [...sys].sort((x, y) => g.nodes[y].x - g.nodes[x].x)) {
        if (taken >= perSystem || picks.length >= count) break;
        const p = g.nodes[i];
        if (!accept(p) || picks.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < spacing)) continue;
        picks.push({ ...p });
        taken++;
      }
    }
  }
  return picks;
}

/** A river reach between `minR` and `maxR` from `p` (for patrol legs), or null. */
export function riverPointNear(map: TerrainMap, p: Vector2D, minR: number, maxR: number, rand: () => number): Vector2D | null {
  const g = graphOf(map);
  const cands = g.nodes.filter((q) => {
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    return d >= minR && d <= maxR;
  });
  return cands.length ? { ...cands[Math.floor(rand() * cands.length)] } : null;
}

/** An enemy river boat the player cannot currently see (hidden under the bank's canopy). */
export function isHiddenRiverBoat(ship: Ship): boolean {
  return ship.side === 'enemy' && ship.type === 'river_gunboat' && !ship.isSunk && (ship.riverSpotted ?? 0) <= 0 && (ship.riverReveal ?? 0) <= 0;
}
