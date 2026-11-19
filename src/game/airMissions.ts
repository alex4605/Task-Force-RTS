import { Aircraft, AircraftPayloadType, AirMission, Vector2D } from '../types/game';

/** Stores that make an aircraft a strike aircraft rather than an air-to-air fighter. */
const AIR_TO_AIR: ReadonlySet<AircraftPayloadType> = new Set<AircraftPayloadType>([
  'clean_guns',
  'aim9_sidewinder',
  'aim7_sparrow',
  'aim7_aim9_combo',
  'aim54_phoenix',
  'scout_fuel',
]);

/** Carrying bombs, torpedoes, rockets or air-to-surface missiles: the aircraft a fighter screen exists to stop. */
export function isStriker(a: Aircraft): boolean {
  if (a.role === 'level_bomber' || a.role === 'dive_bomber' || a.role === 'torpedo_bomber') return true;
  return Boolean(a.hasPayload && a.payloadType && !AIR_TO_AIR.has(a.payloadType));
}

interface MissionRules {
  /** How far from its station a fighter will commit to an intercept (the leash). */
  commitRadius: number;
  /** Target preference: lower weight = more attractive at the same distance. */
  weightStriker: number;
  weightFighter: number;
}

/**
 * CAP and BARCAP exist to kill bombers before they reach the fleet, so strikers are preferred and
 * the leash is short enough that fighters do not get dragged off station by a decoy. A sweep hunts
 * fighters and roams. An escort stays close to its package and only fights what threatens it.
 */
export const MISSION_RULES: Record<AirMission, MissionRules> = {
  cap: { commitRadius: 1800, weightStriker: 0.45, weightFighter: 1 },
  barcap: { commitRadius: 2200, weightStriker: 0.45, weightFighter: 1 },
  sweep: { commitRadius: 3600, weightStriker: 1.4, weightFighter: 0.5 },
  escort: { commitRadius: 900, weightStriker: 2.5, weightFighter: 0.4 },
  strike: { commitRadius: 0, weightStriker: 1, weightFighter: 1 },
};

/**
 * Picks the hostile a fighter should engage: within its radar, within its mission's commit radius
 * of the station, weighted by mission preference and distance. The current target is kept while it
 * remains valid, so fighters do not flick between bandits every frame.
 */
export function selectAirTarget(
  plane: Aircraft,
  hostiles: Aircraft[],
  station: Vector2D,
  radarRange: number,
  mission: AirMission
): Aircraft | undefined {
  const rules = MISSION_RULES[mission];
  const inReach = (a: Aircraft) =>
    a.state !== 'shot_down' &&
    Math.hypot(a.pos.x - plane.pos.x, a.pos.y - plane.pos.y) < radarRange &&
    Math.hypot(a.pos.x - station.x, a.pos.y - station.y) < rules.commitRadius + radarRange * 0.25;
  const current = plane.interceptTargetId ? hostiles.find((a) => a.id === plane.interceptTargetId) : undefined;
  if (current && inReach(current)) return current;

  let best: Aircraft | undefined;
  let bestScore = Infinity;
  for (const a of hostiles) {
    if (!inReach(a)) continue;
    const d = Math.hypot(a.pos.x - plane.pos.x, a.pos.y - plane.pos.y);
    const score = d * (isStriker(a) ? rules.weightStriker : rules.weightFighter);
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  }
  plane.interceptTargetId = best?.id;
  return best;
}

/** A barrier CAP station: out from the defended asset along the bearing of the threat. */
export function barrierStation(asset: Vector2D, threat: Vector2D | undefined, distance: number): Vector2D {
  if (!threat) return { ...asset };
  const dx = threat.x - asset.x;
  const dy = threat.y - asset.y;
  const d = Math.hypot(dx, dy) || 1;
  const k = Math.min(distance, d * 0.5) / d;
  return { x: asset.x + dx * k, y: asset.y + dy * k };
}
