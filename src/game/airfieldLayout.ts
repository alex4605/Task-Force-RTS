import { Installation, Island, Vector2D } from '../types/game';
import { isPointOnIslandLand } from './procedural';

/**
 * Airfield sizes against the ground units (a tank is ~14 map units): a real 1.5–2 km runway would
 * be 3,000+ units, so fields are drawn at a practical scale instead, large enough that the parked
 * aircraft come out at their flying size and the strip reads as the biggest thing on an island.
 */
export const AIRFIELD_SCALE = { base: 3, expedient: 2.6, civil: 3, farp: 2 };

/** Half-extent of an airfield's footprint (map units), for hit tests and clicks. */
export function airfieldFootprint(inst: Installation): { hx: number; hy: number } {
  if (inst.rotaryOnly) return { hx: 30 * AIRFIELD_SCALE.farp, hy: 18 * AIRFIELD_SCALE.farp };
  if (inst.wasCivil) return { hx: 74 * AIRFIELD_SCALE.civil, hy: 32 * AIRFIELD_SCALE.civil };
  if (inst.id.startsWith('inst-built-')) return { hx: 66 * AIRFIELD_SCALE.expedient, hy: 17 * AIRFIELD_SCALE.expedient };
  return { hx: 70 * AIRFIELD_SCALE.base, hy: 30 * AIRFIELD_SCALE.base };
}

/** Whether a point lies on an airfield's strip (plus a margin), allowing for the strip's angle. */
export function onAirfield(inst: Installation, p: { x: number; y: number }, margin = 0): boolean {
  const { hx, hy } = airfieldFootprint(inst);
  const dx = p.x - inst.pos.x;
  const dy = p.y - inst.pos.y;
  const c = Math.cos(-(inst.angle || 0));
  const s = Math.sin(-(inst.angle || 0));
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= hx + margin && Math.abs(ly) <= hy + margin;
}

/** World position of a point given in the airfield's own frame (x along the runway). */
export function airfieldToWorld(inst: Installation, lx: number, ly: number): Vector2D {
  const c = Math.cos(inst.angle || 0);
  const s = Math.sin(inst.angle || 0);
  return { x: inst.pos.x + lx * c - ly * s, y: inst.pos.y + lx * s + ly * c };
}

function toLocal(inst: Installation, p: Vector2D): { lx: number; ly: number } {
  const dx = p.x - inst.pos.x;
  const dy = p.y - inst.pos.y;
  const c = Math.cos(-(inst.angle || 0));
  const s = Math.sin(-(inst.angle || 0));
  return { lx: dx * c - dy * s, ly: dx * s + dy * c };
}

/**
 * Moves a point off an airfield: to the nearest side of the strip (or past its end), on land.
 * Returns the point unchanged if it is not on the field.
 */
export function nudgeOffAirfield(inst: Installation, p: Vector2D, island: Island, margin = 40): Vector2D {
  if (!onAirfield(inst, p, margin * 0.5)) return p;
  const { hx, hy } = airfieldFootprint(inst);
  const { lx, ly } = toLocal(inst, p);
  const sides = [
    { lx, ly: (ly >= 0 ? 1 : -1) * (hy + margin) },
    { lx, ly: (ly >= 0 ? -1 : 1) * (hy + margin) },
    { lx: (lx >= 0 ? 1 : -1) * (hx + margin), ly },
    { lx: (lx >= 0 ? -1 : 1) * (hx + margin), ly },
  ];
  for (const c of sides) {
    const q = airfieldToWorld(inst, c.lx, c.ly);
    if (isPointOnIslandLand(q, island)) return q;
  }
  return airfieldToWorld(inst, sides[0].lx, sides[0].ly);
}

/** Civilian zones (towns, villages) are part of the ground, not something to move. */
const isZone = (i: Installation) => i.type === 'city' || i.type === 'town' || i.type === 'settlement' || i.type === 'refugee_camp';

/** Keeps every airfield clear: other works standing on a strip are moved off to its side. */
export function clearAirfieldFootprints(islands: Island[]): void {
  for (const isl of islands) {
    for (const field of isl.installations) {
      if (field.type !== 'airfield') continue;
      for (const other of isl.installations) {
        if (other === field || other.type === 'airfield' || isZone(other)) continue;
        other.pos = nudgeOffAirfield(field, other.pos, isl);
      }
    }
  }
}

/**
 * A site for a new strip near `pos`: the runway's length on land and clear of other works.
 * Tries the requested heading first, then others, and nearby offsets.
 */
export function findAirfieldSite(
  island: Island,
  pos: Vector2D,
  angle: number,
  probe: Installation
): { pos: Vector2D; angle: number } | null {
  const others = island.installations.filter((i) => !isZone(i));
  for (const off of [0, 90, -90, 180, -180, 270, -270]) {
    for (let k = 0; k < 12; k++) {
      const a = angle + (k * Math.PI) / 12;
      const p = { x: pos.x - Math.sin(a) * off, y: pos.y + Math.cos(a) * off };
      const cand = { ...probe, pos: p, angle: a } as Installation;
      const { hx, hy } = airfieldFootprint(cand);
      let ok = true;
      for (const fx of [-1, -0.5, 0, 0.5, 1]) {
        for (const fy of [-1, 0, 1]) {
          if (!isPointOnIslandLand(airfieldToWorld(cand, fx * hx, fy * hy * 0.5), island)) ok = false;
        }
      }
      if (ok && others.some((o) => onAirfield(cand, o.pos, 20))) ok = false;
      if (ok) return { pos: p, angle: a };
    }
  }
  return null;
}
