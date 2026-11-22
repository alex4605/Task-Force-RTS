import { GroundUnit, GroundUnitType, Vector2D } from '../types/game';

/**
 * Special operations forces. Small, well-trained teams that the other side only finds when it
 * is right on top of them or when they open fire; they report ships and incoming raids from
 * behind the lines (the Solomons coastwatchers gave Henderson Field its warning), blow up
 * installations with demolition charges, and take a lightly held position quickly.
 */
export const SOF_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'usmc_raider_42',
  'sof_coastwatcher_42',
  'sof_alamo_scouts_45',
  'sof_udt_45',
  'sof_ranger_50',
  'sof_udt_50',
  'sof_seal_65',
  'sof_macv_sog_65',
  'sof_lrrp_65',
  'sof_force_recon_83',
  'sof_seal_83',
  'sof_ranger_83',
  'au_sasr_66',
  'uk_sas_83',
  'opfor_spetsnaz_83',
]);

/** Teams whose main job is watching and reporting rather than raiding. */
const RECON_SOF: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'sof_coastwatcher_42',
  'sof_alamo_scouts_45',
  'sof_lrrp_65',
  'sof_macv_sog_65',
  'sof_force_recon_83',
]);

export const isSof = (type: GroundUnitType): boolean => SOF_TYPES.has(type);

/** An unrevealed team can only be engaged from this close (m), scaled by terrain concealment. */
export const SOF_DETECT_RANGE = 260;
/** Seconds a team stays visible after it fires. */
export const SOF_REVEAL_S = 6;
/** Damage multiplier for demolition against installations. */
export const SOF_SABOTAGE_MULT = 3;
/** Extra stronghold capture speed when a team is on the objective. */
export const SOF_CAPTURE_BONUS = 8;

/** Ship and air reporting radius (m). */
export function sofReconRange(type: GroundUnitType): { ships: number; air: number } {
  return RECON_SOF.has(type) ? { ships: 3000, air: 4200 } : { ships: 1500, air: 2000 };
}

/**
 * Whether an observer can find and engage this unit. Ordinary units are always visible;
 * SOF only within a short range (shorter still in jungle and towns) unless they have just fired.
 * `concealment` is the terrain factor at the unit (1 = open, lower = more cover).
 */
export function canSpotUnit(observer: Vector2D, u: GroundUnit, concealment: number): boolean {
  if (!isSof(u.type) || (u.revealTimer ?? 0) > 0) return true;
  const dx = observer.x - u.pos.x;
  const dy = observer.y - u.pos.y;
  const r = SOF_DETECT_RANGE * Math.max(0.5, concealment);
  return dx * dx + dy * dy <= r * r;
}
