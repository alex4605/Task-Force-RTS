import { Installation } from '../types/game';

/**
 * Airfield sizes against the ground units (a tank is ~14 map units): a real 1.5–2 km runway would
 * be 3,000+ units, so fields are drawn at a practical scale instead, large enough that the parked
 * aircraft come out at their flying size and the strip reads as the biggest thing on an island.
 */
export const AIRFIELD_SCALE = { base: 3, expedient: 2.6, civil: 3, farp: 2 };

/** Half-extent of an airfield's footprint (map units), for hit tests and clicks. */
export function airfieldFootprint(inst: Installation): { hx: number; hy: number } {
  if (inst.rotaryOnly) return { hx: 30 * AIRFIELD_SCALE.farp, hy: 18 * AIRFIELD_SCALE.farp };
  if (inst.wasCivil) return { hx: 70 * AIRFIELD_SCALE.civil, hy: 24 * AIRFIELD_SCALE.civil };
  if (inst.id.startsWith('inst-built-')) return { hx: 60 * AIRFIELD_SCALE.expedient, hy: 18 * AIRFIELD_SCALE.expedient };
  return { hx: 68 * AIRFIELD_SCALE.base, hy: 26 * AIRFIELD_SCALE.base };
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
