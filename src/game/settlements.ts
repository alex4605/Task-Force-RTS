import { Installation } from '../types/game';

/**
 * Villages, towns and cities as places people live in, not just targets to avoid.
 *
 * BLD (建築完整度) is the built fabric: a long bar that shells and bombs wear down. POP (人口) is
 * how full of people the place still is: fighting nearby and explosions drive them out (the
 * refugee columns of every one of these wars), and they drift back once the front moves on.
 * Both decide what the place is worth: a full, standing town feeds labour, goods and goodwill;
 * a ruin its people have fled gives nothing. They also decide what hitting it costs: shelling a
 * crowded town is a scandal, while a town that has emptied out and already lies in the battle
 * line (Hue in 1968, Seoul in 1950, the towns of the North German plain on any war plan) costs
 * far less, since there is little left to lose and few left to lose it.
 */

export const SETTLEMENT_TYPES: ReadonlySet<string> = new Set(['settlement', 'town', 'city']);

/** Structure points: a city takes a long time to knock down. */
const MAX_BLD: Record<string, number> = { settlement: 2600, town: 7000, city: 16000 };

/** Political cost of a hit on a full, intact place, by size. */
const BASE_PENALTY: Record<string, number> = { settlement: 12, town: 24, city: 40 };

export function isSettlement(inst: Installation): boolean {
  return SETTLEMENT_TYPES.has(inst.type);
}

/** Gives a settlement its BLD and POP when first seen. */
export function initSettlement(inst: Installation): void {
  if (!isSettlement(inst)) return;
  inst.maxBld ??= MAX_BLD[inst.type] ?? 3000;
  inst.bld ??= inst.maxBld;
  inst.pop ??= 1;
  inst.quietFor ??= 999;
}

export function bldFraction(inst: Installation): number {
  return inst.maxBld ? Math.max(0, Math.min(1, (inst.bld ?? inst.maxBld) / inst.maxBld)) : 1;
}

export function popFraction(inst: Installation): number {
  return Math.max(0, Math.min(1, inst.pop ?? 1));
}

/** The damage stage the map art shows: 4 = intact (100%), 3 = 75%, 2 = 50%, 1 = 25%, 0 = ruins. */
export function damageStage(fraction: number): 0 | 1 | 2 | 3 | 4 {
  return fraction >= 0.875 ? 4 : fraction >= 0.625 ? 3 : fraction >= 0.375 ? 2 : fraction > 0.1 ? 1 : 0;
}

/** Share of the full yield a held settlement gives: people do the work, the buildings house it. */
export function settlementYieldFactor(inst: Installation): number {
  if (!isSettlement(inst)) return 1;
  return popFraction(inst) * (0.25 + 0.75 * bldFraction(inst));
}

/**
 * PP lost when our fire hits a settlement: in proportion to the people still there and what is
 * left standing, and halved when the place is itself contested ground.
 */
export function collateralPenalty(inst: Installation, contested: boolean): number {
  const base = BASE_PENALTY[inst.type] ?? 20;
  const p = base * popFraction(inst) * (0.4 + 0.6 * bldFraction(inst)) * (contested ? 0.5 : 1);
  return Math.round(p);
}

/** Structure damage from one explosion: bombs bring buildings down, light shells chip them. */
export function blastBld(inst: Installation, damage: number, isBomb: boolean): void {
  if (!inst.maxBld) return;
  inst.bld = Math.max(0, (inst.bld ?? inst.maxBld) - damage * (isBomb ? 1.6 : 0.9));
}

/** People leaving after an explosion: a hit in the streets empties more than one heard nearby. */
export function blastPop(inst: Installation, inside: boolean, heavy: boolean): void {
  inst.pop = Math.max(0, popFraction(inst) - (inside ? (heavy ? 0.06 : 0.035) : heavy ? 0.02 : 0.01));
  inst.quietFor = 0;
}

/**
 * One second of a settlement's life. Fighting in or near it keeps people leaving; once it has
 * been quiet for a while they come back, and with people back the buildings are slowly repaired.
 * Returns the refugee band newly reached (1 = half gone, 2 = nearly all gone), however the people
 * were driven out (fighting or explosions); recovering lowers the band again without a report.
 */
export function tickSettlement(inst: Installation, fighting: boolean): 1 | 2 | undefined {
  const before = popFraction(inst);
  if (fighting) {
    inst.pop = Math.max(0, before - 0.008);
    inst.quietFor = 0;
  } else {
    inst.quietFor = (inst.quietFor ?? 0) + 1;
    if (inst.quietFor > 45) {
      // About four minutes for a place to fill up again, ten or more to rebuild
      // People come back only as far as there are roofs to come back to
      const room = 0.3 + 0.7 * bldFraction(inst);
      if (before < room) inst.pop = Math.min(room, before + 0.004);
      if (before > 0.15 && inst.maxBld) inst.bld = Math.min(inst.maxBld, (inst.bld ?? inst.maxBld) + inst.maxBld * 0.0014 * before);
    }
  }
  const after = popFraction(inst);
  const band = after < 0.15 ? 2 : after < 0.5 ? 1 : 0;
  const was = inst.popBand ?? 0;
  inst.popBand = band;
  return band > was ? (band as 1 | 2) : undefined;
}
