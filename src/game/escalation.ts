import { Island, Vector2D } from '../types/game';

/**
 * Campaign escalation: the further the landing force gets, the harder both sides commit.
 * The enemy throws more aircraft at the beachheads and routes its raids round the defences;
 * the allies feed more troops in behind the advance and dig in on the ground that was taken.
 */
export type EscalationTier = 0 | 1 | 2 | 3 | 4;

export interface Escalation {
  /** Share of objectives in friendly hands, 0..1. */
  progress: number;
  tier: EscalationTier;
  captured: number;
  total: number;
}

/** Progress thresholds for tiers 1–4. */
const TIER_AT = [0.1, 0.3, 0.55, 0.8];

export const TIER_NAME: Record<EscalationTier, string> = {
  0: '初期接觸',
  1: '灘頭鞏固',
  2: '戰線擴張',
  3: '全面攻勢',
  4: '決戰階段',
};

/**
 * Objectives are the islands' strongholds; a fully captured island counts all of its own, and
 * mainland installations taken from the enemy count as half a stronghold each.
 */
export function computeEscalation(islands: Island[], capturedInstallations: number): Escalation {
  let total = 0;
  let captured = 0;
  for (const isl of islands) {
    const shs = isl.strongholds;
    if (!shs || shs.length === 0) continue;
    total += shs.length;
    captured += isl.isFullyCaptured ? shs.length : shs.filter((s) => s.isCaptured).length;
  }
  captured += capturedInstallations * 0.5;
  total += capturedInstallations * 0.5;
  const progress = total > 0 ? Math.min(1, captured / total) : 0;
  let tier: EscalationTier = 0;
  for (let i = 0; i < TIER_AT.length; i++) if (progress >= TIER_AT[i]) tier = (i + 1) as EscalationTier;
  return { progress, tier, captured, total };
}

export interface AirEscalation {
  /** Extra aircraft per raid. */
  waveBonus: number;
  /** Largest raid. */
  waveCap: number;
  /** Multiplier on the gap between raids (smaller = more often). */
  intervalMul: number;
  /** Most enemy fighters on standing patrol. */
  capLimit: number;
  /** Number of separate approach axes a strike is split across. */
  axes: number;
  /** Whether raids fly a dog-leg round the defences instead of straight in. */
  dogLeg: boolean;
  /** Whether a fighter sweep comes in from another bearing to draw off the CAP. */
  diversion: boolean;
}

export function airEscalation(tier: EscalationTier): AirEscalation {
  return {
    waveBonus: tier,
    waveCap: 12 + tier,
    intervalMul: [1, 0.9, 0.8, 0.7, 0.6][tier],
    capLimit: 6 + tier,
    axes: tier >= 4 ? 3 : tier >= 2 ? 2 : 1,
    dogLeg: tier >= 1,
    diversion: tier >= 3,
  };
}

export interface AlliedEscalation {
  /** Most allied units alive at once from the mainland base. */
  maxUnits: number;
  /** Multiplier on the gap between reinforcements. */
  spawnMul: number;
  /** Multiplier on the gap between beach landings (eras 1–2). */
  landingMul: number;
  /** Extra landing craft per beach group. */
  extraCraft: number;
  /** Whether allied troops dig field works on the ground they hold. */
  fortify: boolean;
  /** Most allied field works standing at once. */
  maxWorks: number;
}

export function alliedEscalation(tier: EscalationTier): AlliedEscalation {
  return {
    maxUnits: 8 + tier * 3,
    spawnMul: [1, 0.9, 0.8, 0.7, 0.6][tier],
    landingMul: [1, 0.85, 0.7, 0.6, 0.5][tier],
    extraCraft: tier >= 3 ? 2 : tier >= 1 ? 1 : 0,
    fortify: tier >= 1,
    maxWorks: 2 + tier * 2,
  };
}

/**
 * Ingress for one axis of a raid: instead of flying the straight line from the airfield, the
 * formation swings out to a flank turn point and then runs in to an initial point off the
 * direct bearing, so it arrives from a direction the screen is not covering.
 * `axis` 0..axes-1 picks the side and width of the swing.
 */
export function ingressRoute(spawn: Vector2D, target: Vector2D, axis: number, axes: number, worldSize: number, wide: boolean): Vector2D[] {
  const dx = target.x - spawn.x;
  const dy = target.y - spawn.y;
  const len = Math.hypot(dx, dy);
  if (len < 2500) return [];
  const ux = dx / len;
  const uy = dy / len;
  // Axis 0 swings one way, axis 1 the other, axis 2 comes in on the direct bearing but late
  const side = axes === 1 ? (Math.random() < 0.5 ? 1 : -1) : axis === 0 ? 1 : axis === 1 ? -1 : 0;
  const swing = Math.min(len * 0.45, 1600 + axis * 500 + Math.random() * 500);
  const clamp = (p: Vector2D): Vector2D => ({
    x: Math.max(300, Math.min(worldSize - 300, p.x)),
    y: Math.max(300, Math.min(worldSize - 300, p.y)),
  });
  if (side === 0) {
    // Straight-in axis: hold short as a timing leg, so all axes arrive together
    return [clamp({ x: spawn.x + dx * 0.35 - uy * 400, y: spawn.y + dy * 0.35 + ux * 400 })];
  }
  const turn = clamp({ x: spawn.x + dx * 0.5 - uy * swing * side, y: spawn.y + dy * 0.5 + ux * swing * side });
  if (!wide) return [turn];
  // Initial point: 1,600 m from the target, 65° off the direct bearing
  const back = Math.atan2(-uy, -ux) + side * (65 * Math.PI) / 180;
  const ip = clamp({ x: target.x + Math.cos(back) * 1600, y: target.y + Math.sin(back) * 1600 });
  return [turn, ip];
}
