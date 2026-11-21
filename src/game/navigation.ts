import { Island, Ship, Vector2D } from '../types/game';
import { isPointOnIslandLand } from './procedural';

// Cell states: 0 = deep open water, 1 = coastal margin buffer, 2 = impassable land
const CELL_OPEN = 0;
const CELL_COASTAL = 1;
const CELL_LAND = 2;

const DIRS_8 = [
  { dx: 1, dy: 0, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 1, cost: Math.SQRT2 },
  { dx: 1, dy: -1, cost: Math.SQRT2 },
  { dx: -1, dy: 1, cost: Math.SQRT2 },
  { dx: -1, dy: -1, cost: Math.SQRT2 },
];

export class NavalNavigationGrid {
  public readonly worldSize: number;
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  private readonly grid: Uint8Array;
  private readonly islands: Island[];
  /** Shallowest water (m) found in each cell; Infinity until a depth model is attached. */
  private readonly minDepth: Float32Array;
  /** 1 where part of the cell is land (a beach or rocks): only beaching craft may enter. */
  private readonly touchesLand: Uint8Array;
  /** Depth the current query's ship needs (its draft plus keel clearance); 0 = ignore depth. */
  private needDepth = 0;

  constructor(worldSize: number, islands: Island[], cellSize: number = 110) {
    this.worldSize = worldSize;
    this.cellSize = cellSize;
    this.cols = Math.max(10, Math.ceil(worldSize / cellSize));
    this.rows = Math.max(10, Math.ceil(worldSize / cellSize));
    this.grid = new Uint8Array(this.cols * this.rows);
    this.minDepth = new Float32Array(this.cols * this.rows).fill(Infinity);
    this.touchesLand = new Uint8Array(this.cols * this.rows);
    this.islands = islands;
    this.bakeTerrain();
  }

  private bakeTerrain() {
    const half = this.cellSize * 0.5;
    const probeOffset = this.cellSize * 0.34;

    // Reach of each island from its centre: its farthest coastline point, not the nominal radius
    // (elongated atolls run out to 1.6 x radius at their tips)
    const reach = this.islands.map((isl) => {
      let r = isl.radius;
      for (const p of isl.points) r = Math.max(r, Math.hypot(p.x - isl.center.x, p.y - isl.center.y));
      return r + this.cellSize * 1.4;
    });

    // Pass 1: Detect island dry land cells using 5-point sampling within each cell
    for (let gy = 0; gy < this.rows; gy++) {
      const wy = gy * this.cellSize + half;
      for (let gx = 0; gx < this.cols; gx++) {
        const wx = gx * this.cellSize + half;
        let isLand = false;

        for (let ii = 0; ii < this.islands.length; ii++) {
          const isl = this.islands[ii];
          const maxReach = reach[ii];
          const dx = wx - isl.center.x;
          const dy = wy - isl.center.y;
          if (dx * dx + dy * dy > maxReach * maxReach) continue;

          if (
            isPointOnIslandLand({ x: wx, y: wy }, isl) ||
            isPointOnIslandLand({ x: wx - probeOffset, y: wy - probeOffset }, isl) ||
            isPointOnIslandLand({ x: wx + probeOffset, y: wy - probeOffset }, isl) ||
            isPointOnIslandLand({ x: wx - probeOffset, y: wy + probeOffset }, isl) ||
            isPointOnIslandLand({ x: wx + probeOffset, y: wy + probeOffset }, isl)
          ) {
            isLand = true;
            break;
          }
        }

        this.grid[gy * this.cols + gx] = isLand ? CELL_LAND : CELL_OPEN;
      }
    }

    // Pass 2: Mark 1-cell coastal buffer around land so A* prefers wide open sea lanes
    for (let gy = 0; gy < this.rows; gy++) {
      for (let gx = 0; gx < this.cols; gx++) {
        const idx = gy * this.cols + gx;
        if (this.grid[idx] !== CELL_OPEN) continue;

        let nearLand = false;
        for (let oy = -1; oy <= 1 && !nearLand; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nx = gx + ox;
            const ny = gy + oy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
              if (this.grid[ny * this.cols + nx] === CELL_LAND) {
                nearLand = true;
                break;
              }
            }
          }
        }
        if (nearLand) {
          this.grid[idx] = CELL_COASTAL;
        }
      }
    }
  }

  /** Attaches bathymetry: samples the depth function over each cell and keeps the shallowest. */
  public setDepthModel(depthAt: (x: number, y: number) => number): void {
    for (let gy = 0; gy < this.rows; gy++) {
      for (let gx = 0; gx < this.cols; gx++) {
        let min = Infinity;
        let land = 0;
        for (let sy = 0; sy < 3; sy++) {
          for (let sx = 0; sx < 3; sx++) {
            const d = depthAt(gx * this.cellSize + (sx + 0.5) * (this.cellSize / 3), gy * this.cellSize + (sy + 0.5) * (this.cellSize / 3));
            if (d <= 0) land = 1;
            else if (d < min) min = d;
          }
        }
        this.minDepth[gy * this.cols + gx] = min;
        this.touchesLand[gy * this.cols + gx] = land;
      }
    }
  }

  /** Shallowest water in the cell holding `pos` (m). */
  public depthAt(pos: Vector2D): number {
    const { gx, gy } = this.worldToCell(pos);
    return this.minDepth[gy * this.cols + gx];
  }

  /** Runs a query for a ship needing `depth` metres of water (0 = depth ignored). */
  public withDepth<T>(depth: number, fn: () => T): T {
    const prev = this.needDepth;
    this.needDepth = depth;
    try {
      return fn();
    } finally {
      this.needDepth = prev;
    }
  }

  /** Land, or too shallow for the current query's ship. */
  private blocked(idx: number): boolean {
    if (this.grid[idx] === CELL_LAND) return true;
    if (this.needDepth <= 0) return false;
    // Beaching craft (LCVP, LCM, LST trimmed for the beach) may close the shore; deeper hulls may not
    return this.minDepth[idx] < this.needDepth || (this.needDepth >= 3 && this.touchesLand[idx] === 1);
  }

  public worldToCell(pos: Vector2D): { gx: number; gy: number } {
    const gx = Math.max(0, Math.min(this.cols - 1, Math.floor(pos.x / this.cellSize)));
    const gy = Math.max(0, Math.min(this.rows - 1, Math.floor(pos.y / this.cellSize)));
    return { gx, gy };
  }

  public cellToWorld(gx: number, gy: number): Vector2D {
    return {
      x: Math.max(80, Math.min(this.worldSize - 80, gx * this.cellSize + this.cellSize * 0.5)),
      y: Math.max(80, Math.min(this.worldSize - 80, gy * this.cellSize + this.cellSize * 0.5)),
    };
  }

  public isWalkableCell(gx: number, gy: number): boolean {
    if (gx < 0 || gx >= this.cols || gy < 0 || gy >= this.rows) return false;
    return !this.blocked(gy * this.cols + gx);
  }

  /**
   * Nearest navigable cell, searched in growing rings. The default radius covers the whole grid,
   * so a destination deep inland (a click on the mainland) resolves to the nearest stretch of
   * coast instead of leaving ships to drive straight at the shore.
   */
  public findNearestWalkableCell(startGx: number, startGy: number, maxRadius: number = Math.max(this.cols, this.rows)): { gx: number; gy: number } | null {
    if (this.isWalkableCell(startGx, startGy)) {
      return { gx: startGx, gy: startGy };
    }

    let bestCell: { gx: number; gy: number } | null = null;
    let bestScore = Infinity;

    for (let r = 1; r <= maxRadius; r++) {
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
          const nx = startGx + ox;
          const ny = startGy + oy;
          if (!this.isWalkableCell(nx, ny)) continue;
          const cellType = this.grid[ny * this.cols + nx];
          const penalty = cellType === CELL_COASTAL ? 0.6 : 0;
          const score = Math.hypot(ox, oy) + penalty;
          if (score < bestScore) {
            bestScore = score;
            bestCell = { gx: nx, gy: ny };
          }
        }
      }
      if (bestCell) return bestCell;
    }

    return null;
  }

  /** Nearest navigable water for a ship needing `needDepth` metres (0 = any water). */
  public projectToWalkableWater(pos: Vector2D, needDepth = 0): Vector2D {
    return this.withDepth(needDepth, () => this.projectImpl(pos));
  }

  private projectImpl(pos: Vector2D): Vector2D {
    const clamped: Vector2D = {
      x: Math.max(80, Math.min(this.worldSize - 80, pos.x)),
      y: Math.max(80, Math.min(this.worldSize - 80, pos.y)),
    };
    const { gx, gy } = this.worldToCell(clamped);
    if (this.grid[gy * this.cols + gx] === CELL_OPEN && !this.blocked(gy * this.cols + gx)) {
      return clamped;
    }
    const walkable = this.findNearestWalkableCell(gx, gy);
    if (!walkable) return clamped;
    return this.cellToWorld(walkable.gx, walkable.gy);
  }

  public hasClearWaterLine(a: Vector2D, b: Vector2D, avoidCoastal: boolean = true, needDepth = 0): boolean {
    return this.withDepth(needDepth, () => this.clearLineImpl(a, b, avoidCoastal));
  }

  private clearLineImpl(a: Vector2D, b: Vector2D, avoidCoastal: boolean): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 10) return true;

    const stepSize = this.cellSize * 0.42;
    const steps = Math.ceil(length / stepSize);

    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const { gx, gy } = this.worldToCell({ x: px, y: py });
      const val = this.grid[gy * this.cols + gx];
      if (this.blocked(gy * this.cols + gx)) return false;
      if (avoidCoastal && val === CELL_COASTAL) return false;
    }
    return true;
  }

  /**
   * Computes an 8-directional A* path on the sea-lane grid and smooths it via line-of-sight string-pulling.
   */
  /** A* sea lane for a ship needing `needDepth` metres of water (0 = any water). */
  public findPath(rawStart: Vector2D, rawGoal: Vector2D, needDepth = 0): Vector2D[] {
    return this.withDepth(needDepth, () => this.findPathImpl(rawStart, rawGoal));
  }

  private findPathImpl(rawStart: Vector2D, rawGoal: Vector2D): Vector2D[] {
    const clampedGoal: Vector2D = {
      x: Math.max(80, Math.min(this.worldSize - 80, rawGoal.x)),
      y: Math.max(80, Math.min(this.worldSize - 80, rawGoal.y)),
    };

    const startCellRaw = this.worldToCell(rawStart);
    const goalCellRaw = this.worldToCell(clampedGoal);

    const startCell = this.findNearestWalkableCell(startCellRaw.gx, startCellRaw.gy);
    const goalCell = this.findNearestWalkableCell(goalCellRaw.gx, goalCellRaw.gy);

    if (!startCell || !goalCell) {
      return [clampedGoal];
    }

    const goalWorld = this.isWalkableCell(goalCellRaw.gx, goalCellRaw.gy)
      ? clampedGoal
      : this.cellToWorld(goalCell.gx, goalCell.gy);

    // Fast path: direct clear deep-water sightline
    if (this.clearLineImpl(rawStart, goalWorld, true)) {
      return [goalWorld];
    }

    const totalCells = this.cols * this.rows;
    const gScore = new Float32Array(totalCells);
    gScore.fill(Infinity);
    const fScore = new Float32Array(totalCells);
    fScore.fill(Infinity);
    const cameFrom = new Int32Array(totalCells);
    cameFrom.fill(-1);
    const closed = new Uint8Array(totalCells);
    const inOpen = new Uint8Array(totalCells);

    const startIdx = startCell.gy * this.cols + startCell.gx;
    const goalIdx = goalCell.gy * this.cols + goalCell.gx;

    gScore[startIdx] = 0;
    fScore[startIdx] = this.octileHeuristic(startCell.gx, startCell.gy, goalCell.gx, goalCell.gy);

    // Binary Min-Heap over cell indices
    const heap: number[] = [startIdx];
    inOpen[startIdx] = 1;

    const pushHeap = (node: number) => {
      heap.push(node);
      let idx = heap.length - 1;
      while (idx > 0) {
        const parent = (idx - 1) >> 1;
        if (fScore[heap[parent]] <= fScore[heap[idx]]) break;
        const tmp = heap[parent];
        heap[parent] = heap[idx];
        heap[idx] = tmp;
        idx = parent;
      }
    };

    const popHeap = (): number => {
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length > 0) {
        heap[0] = last;
        let idx = 0;
        const n = heap.length;
        while (true) {
          let smallest = idx;
          const left = idx * 2 + 1;
          const right = left + 1;
          if (left < n && fScore[heap[left]] < fScore[heap[smallest]]) smallest = left;
          if (right < n && fScore[heap[right]] < fScore[heap[smallest]]) smallest = right;
          if (smallest === idx) break;
          const tmp = heap[idx];
          heap[idx] = heap[smallest];
          heap[smallest] = tmp;
          idx = smallest;
        }
      }
      return top;
    };

    let found = false;
    let expansions = 0;
    const maxExpansions = totalCells;

    while (heap.length > 0 && expansions < maxExpansions) {
      const current = popHeap();
      inOpen[current] = 0;
      if (current === goalIdx) {
        found = true;
        break;
      }
      if (closed[current]) continue;
      closed[current] = 1;
      expansions++;

      const cx = current % this.cols;
      const cy = Math.floor(current / this.cols);

      for (const dir of DIRS_8) {
        const nx = cx + dir.dx;
        const ny = cy + dir.dy;
        if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;

        const nIdx = ny * this.cols + nx;
        if (closed[nIdx]) continue;
        const cellType = this.grid[nIdx];
        if (this.blocked(nIdx)) continue;

        // Prevent diagonal corner-cutting across land corners
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (
            this.blocked(cy * this.cols + nx) ||
            this.blocked(ny * this.cols + cx)
          ) {
            continue;
          }
        }

        // Prefer the deep channel: water barely deep enough costs more
        const marginal = this.needDepth > 0 && this.minDepth[nIdx] < this.needDepth * 1.6;
        const terrainWeight = (cellType === CELL_COASTAL ? 3.2 : 1.0) * (marginal ? 1.8 : 1.0);
        const tentativeG = gScore[current] + dir.cost * terrainWeight;
        if (tentativeG < gScore[nIdx]) {
          cameFrom[nIdx] = current;
          gScore[nIdx] = tentativeG;
          fScore[nIdx] = tentativeG + this.octileHeuristic(nx, ny, goalCell.gx, goalCell.gy);
          if (!inOpen[nIdx]) {
            pushHeap(nIdx);
            inOpen[nIdx] = 1;
          }
        }
      }
    }

    if (!found) {
      return [goalWorld];
    }

    // Reconstruct world points from goal back to start
    const rawPath: Vector2D[] = [];
    let cur = goalIdx;
    while (cur !== -1 && cur !== startIdx) {
      const gx = cur % this.cols;
      const gy = Math.floor(cur / this.cols);
      rawPath.push(this.cellToWorld(gx, gy));
      cur = cameFrom[cur];
    }
    rawPath.reverse();
    if (rawPath.length === 0) {
      return [goalWorld];
    }
    rawPath[rawPath.length - 1] = goalWorld;

    // String-pulling / Line-of-Sight Waypoint Smoothing
    const smoothed: Vector2D[] = [];
    let anchor: Vector2D = rawStart;
    let i = 0;

    while (i < rawPath.length) {
      let farthest = i;
      for (let j = rawPath.length - 1; j > i; j--) {
        if (this.clearLineImpl(anchor, rawPath[j], true)) {
          farthest = j;
          break;
        }
      }
      smoothed.push(rawPath[farthest]);
      anchor = rawPath[farthest];
      i = farthest + 1;
    }

    return smoothed.length > 0 ? smoothed : [goalWorld];
  }

  private octileHeuristic(ax: number, ay: number, bx: number, by: number): number {
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  }
}

/**
 * Computes ship-to-ship separation steering force to prevent clumping/overlapping
 * among friendly and allied task forces while respecting submarine depth separation.
 */
export function computeShipSeparationSteering(
  ship: Ship,
  otherShips: Ship[],
  isSubmarineFn: (s: Ship) => boolean
): { vx: number; vy: number; speedScale: number } {
  let pushX = 0;
  let pushY = 0;
  let closestRatio = 0;
  const selfIsSub = isSubmarineFn(ship);

  for (const other of otherShips) {
    if (other.id === ship.id || other.isSunk) continue;
    // Submarines operate below surface keels; only separate same-layer hulls
    if (isSubmarineFn(other) !== selfIsSub) continue;

    const dx = ship.pos.x - other.pos.x;
    const dy = ship.pos.y - other.pos.y;
    const d = Math.hypot(dx, dy);
    const safeDist = Math.max(92, (ship.length + other.length) * 0.72);

    if (d < safeDist) {
      const closeness = 1 - d / safeDist;
      if (closeness > closestRatio) closestRatio = closeness;

      let nx: number;
      let ny: number;
      if (d < 1) {
        // Deterministic tie-breaker if hulls overlap identically
        const tieAngle = (ship.id.charCodeAt(ship.id.length - 1) % 8) * (Math.PI / 4);
        nx = Math.cos(tieAngle);
        ny = Math.sin(tieAngle);
      } else {
        nx = dx / d;
        ny = dy / d;
      }

      // Add slight starboard pass bias so head-on ships glide past smoothly
      const tangentX = -ny * 0.25;
      const tangentY = nx * 0.25;
      const weight = closeness * closeness * 2.2;
      pushX += (nx + tangentX) * weight;
      pushY += (ny + tangentY) * weight;
    }
  }

  return {
    vx: pushX,
    vy: pushY,
    speedScale: closestRatio > 0.65 ? 0.75 : closestRatio > 0.35 ? 0.88 : 1.0,
  };
}
