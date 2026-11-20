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
}

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
  g = { nodes, edges, mouths, halfWidth };
  GRAPHS.set(map, g);
  return g;
}

function nearestNode(g: RiverGraph, p: Vector2D): { i: number; d: number } {
  let i = -1;
  let d = Infinity;
  for (let k = 0; k < g.nodes.length; k++) {
    const dd = Math.hypot(g.nodes[k].x - p.x, g.nodes[k].y - p.y);
    if (dd < d) {
      d = dd;
      i = k;
    }
  }
  return { i, d };
}

/** Dijkstra over the river graph from a set of start nodes; returns distances and parents. */
function dijkstra(g: RiverGraph, starts: number[]): { dist: Float64Array; prev: Int32Array } {
  const dist = new Float64Array(g.nodes.length).fill(Infinity);
  const prev = new Int32Array(g.nodes.length).fill(-1);
  const done = new Uint8Array(g.nodes.length);
  for (const s of starts) dist[s] = 0;
  for (;;) {
    let u = -1;
    let best = Infinity;
    for (let k = 0; k < dist.length; k++) if (!done[k] && dist[k] < best) { best = dist[k]; u = k; }
    if (u < 0) break;
    done[u] = 1;
    for (const [v, w] of g.edges[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
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
  const { i, d } = nearestNode(g, p);
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
 * Patrol stations for enemy river craft: river reaches that pass `accept`, spread at least
 * `spacing` apart, walking the graph from the most inland reach outward.
 */
export function riverPatrolStations(map: TerrainMap, accept: (p: Vector2D) => boolean, count: number, spacing = 1400): Vector2D[] {
  const g = graphOf(map);
  const picks: Vector2D[] = [];
  const order = g.nodes.map((p, i) => ({ p, i })).sort((a, b) => b.p.x - a.p.x);
  for (const { p } of order) {
    if (picks.length >= count) break;
    if (!accept(p)) continue;
    if (picks.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < spacing)) continue;
    picks.push({ ...p });
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
