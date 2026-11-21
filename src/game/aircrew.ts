import { AircraftModel, Era } from '../types/game';

/**
 * Aircrew and ship's crew survival.
 *
 * Crew per type follows the real aircraft (pilot alone in a single-seat fighter; pilot and
 * gunner in a dive bomber; three in a torpedo bomber; ten in a B-17). Survival when shot down:
 *
 * - Second World War: about half the aircrew of a downed carrier or land-based aircraft got out
 *   and lived (USN carrier aviation recovered roughly 40–50% of its combat-downed airmen; Eighth
 *   Air Force bomber crews in a shot-down B-17 had about the same odds of becoming POWs rather
 *   than KIA). A share of aircraft blew up or burned with nobody getting out.
 * - Korea and after: ejection seats raised it to roughly two in three to four in five for jets;
 *   piston aircraft still meant climbing out over the side.
 * - Helicopters: no ejection, autorotation or a ditching, about two in five.
 * - Suicide aircraft: none.
 *
 * Each crew member rolls on his own after a "catastrophic" roll (the aircraft disintegrates),
 * so a bomber can lose all, some or none of its crew.
 */

/** Crew of every multi-seat type; all others are single-seat. */
const CREW: Partial<Record<AircraftModel, number>> = {
  // Era 1–2 USN / USAAF / Commonwealth
  sbd: 2, sb2c: 2, tbd: 3, tbf: 3, os2u: 2, a20: 3, a26: 3, b25: 5, b17: 10, b17_late: 10, b24: 10, b29: 11,
  pby: 8, c47: 4, mosquito: 2, beaufighter: 2, swordfish: 3, beaufort: 4, barracuda: 3, lancaster: 7,
  // IJN / IJA
  val: 2, judy: 2, kate: 3, jill: 3, g4m: 7,
  // Korea
  f82: 2, firefly_as5: 2, af_guardian: 2, ad3w: 3, ho3s1: 2, il10: 2, tu14: 3, po2: 2,
  // Vietnam
  f4b: 2, f4j: 2, f4e: 2, a6a: 2, a6b_weasel: 2, e1: 4, s2: 4, uh2: 3, sh2: 3, c1: 3, p3: 11, b52: 6,
  ov10: 2, uh1: 4, ah1: 2, a37b: 2, canberra: 3, ac47: 7, ch46: 3, il28: 3, tu16: 6,
  // Cold War
  f14a: 2, s3a: 4, a6e: 2, e2c: 5, ea6b: 4, c2a: 4, sh3f: 4, ch53: 3, ah64a: 2, ah1w: 2, e3a: 18, f111: 2,
  c130: 5, buccaneer: 2, f4f_phantom: 2, tornado_gr1: 2, tornado_ids: 2, tornado_adv: 2, tu95: 7,
  tu22m3: 4, ka27: 3, mi24: 3, a50: 15, mig31: 2, sh60b: 3, be12: 4, il38: 8,
};

/** Piston types (no ejection seat), including those still flying in the jet eras. */
const PISTON_LATE = new Set<AircraftModel>([
  // Every Second World War type
  'f4f', 'sbd', 'tbd', 'os2u', 'b17', 'p40', 'a20', 'f6f', 'f4u', 'f8f', 'sb2c', 'tbf', 'sc1', 'b24', 'p51', 'p47', 'p38',
  'a26', 'p36a', 'b25', 'p39d', 'hurricane', 'spitfire_v', 'beaufighter', 'swordfish', 'b17_late', 'spitfire_xiv',
  'tempest', 'mosquito', 'lancaster', 'beaufort', 'boomerang', 'seafire', 'barracuda', 'rufe', 'ki84', 'zero',
  'zero_a6m2', 'zero_a6m5', 'ki61', 'george', 'val', 'judy', 'kate', 'jill', 'g4m',
  // Piston types still flying in the jet eras
  'f4u4', 'ad1', 'ad3w', 'a1h', 'af_guardian', 'yak9', 'il10', 'po2', 'sea_fury', 'firefly_as5', 'rokaf_p51',
  'f82', 'pby', 'c47', 'ac47', 'b29', 'tu14', 'e1', 's2', 'c1', 'p3', 'c130', 'il38', 'be12', 'ov10',
]);

const HELICOPTERS = new Set<AircraftModel>(['ho3s1', 'uh2', 'sh2', 'uh1', 'ah1', 'sh3f', 'ch53', 'ah64a', 'ah1w', 'ka27', 'mi24', 'ch46', 'sh60b']);

const SUICIDE = new Set<AircraftModel>(['ohka', 'kamikaze_zero', 'kamikaze_judy']);

export function crewOf(model: AircraftModel): number {
  if (SUICIDE.has(model)) return 1;
  return CREW[model] ?? 1;
}

export const isHelicopter = (model: AircraftModel) => HELICOPTERS.has(model);

/** Chance the aircraft breaks up or burns with nobody getting out, and each man's odds otherwise. */
function survivalOdds(model: AircraftModel, era: Era): { catastrophic: number; each: number } {
  if (SUICIDE.has(model)) return { catastrophic: 1, each: 0 };
  if (HELICOPTERS.has(model)) return { catastrophic: 0.3, each: 0.6 };
  const ww2 = era === 'era1' || era === 'era2';
  if (ww2 || PISTON_LATE.has(model)) {
    // Heavies took longer to get out of (and the crew often went down with the aircraft)
    const crew = crewOf(model);
    return { catastrophic: 0.22, each: crew >= 5 ? 0.6 : 0.66 };
  }
  // Ejection seats: Korea's first-generation seats, then zero-zero seats by the 1980s
  return era === 'era3' ? { catastrophic: 0.15, each: 0.85 } : { catastrophic: 0.12, each: 0.9 };
}

export interface BailoutResult {
  crew: number;
  survivors: number;
  killed: number;
}

export function rollBailout(model: AircraftModel, era: Era, rand: () => number = Math.random): BailoutResult {
  const crew = crewOf(model);
  const { catastrophic, each } = survivalOdds(model, era);
  if (rand() < catastrophic) return { crew, survivors: 0, killed: crew };
  let survivors = 0;
  for (let k = 0; k < crew; k++) if (rand() < each) survivors++;
  return { crew, survivors, killed: crew - survivors };
}

/**
 * Survivors from a sinking ship still adrift (most of a crew is picked up by escorts at once or
 * goes down with the ship; the rafts on the map are the ones nobody has reached yet), in up to
 * four rafts of about twenty men each (larger groups when a big ship goes down). The crew is about one man per eleven tons
 * of full-load displacement (a Fletcher: 2,900 t and ~330 men; an Essex: 36,000 t and ~3,000).
 */
export function shipRaftGroups(fullLoadTons: number, rand: () => number = Math.random): number[] {
  const men = Math.max(20, Math.min(3200, fullLoadTons / 11));
  const adrift = Math.max(3, Math.round(men * (0.02 + rand() * 0.03)));
  const rafts = Math.min(4, Math.max(1, Math.ceil(adrift / 20)));
  const out: number[] = [];
  let left = adrift;
  for (let k = 0; k < rafts; k++) {
    const n = k === rafts - 1 ? left : Math.round(adrift / rafts);
    out.push(Math.max(1, n));
    left -= n;
  }
  return out;
}
