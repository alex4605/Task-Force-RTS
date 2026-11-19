import { AircraftModel } from '../types/game';
import { getAircraftSpeed } from './speedScale';

/**
 * Airframe health and gun ammunition for every aircraft model, shared by
 * carrier launches (launchAircraft) and land-based sorties (launchAirbaseSortie).
 *
 * gunRounds reflects each era's armament layout: WWII / Korean War fighters carry wing-mounted
 * .50 cal / 20mm batteries with large belts, while post-Vietnam jets carry a single internal
 * fuselage cannon (M61 Vulcan, GSh-30) with far fewer, heavier rounds; missile-only interceptors
 * and support aircraft carry none.
 */
export interface AircraftBaseStats {
  health: number;
  gunRounds: number;
}

const DEFAULT_STATS: AircraftBaseStats = { health: 500, gunRounds: 1440 };

const AIRCRAFT_BASE_STATS: Partial<Record<AircraftModel, AircraftBaseStats>> = {
  f4f: { health: 360, gunRounds: 1440 },
  sbd: { health: 420, gunRounds: 720 },
  tbd: { health: 360, gunRounds: 600 },
  os2u: { health: 500, gunRounds: 500 },
  b17: { health: 820, gunRounds: 3200 },
  p40: { health: 420, gunRounds: 1440 },
  a20: { health: 520, gunRounds: 2000 },
  f6f: { health: 440, gunRounds: 2400 },
  f4u: { health: 480, gunRounds: 2400 },
  f8f: { health: 520, gunRounds: 800 },
  sb2c: { health: 500, gunRounds: 720 },
  tbf: { health: 460, gunRounds: 600 },
  b24: { health: 920, gunRounds: 3200 },
  p51: { health: 450, gunRounds: 1880 },
  p47: { health: 620, gunRounds: 3400 },
  p38: { health: 480, gunRounds: 1800 },
  a26: { health: 660, gunRounds: 2400 },
  f86: { health: 480, gunRounds: 1800 },
  b29: { health: 1350, gunRounds: 4400 },
  f9f: { health: 560, gunRounds: 800 },
  f2h: { health: 580, gunRounds: 800 },
  ad1: { health: 680, gunRounds: 800 },
  f4u4: { health: 500, gunRounds: 1800 },
  af_guardian: { health: 540, gunRounds: 600 },
  ad3w: { health: 520, gunRounds: 0 },
  ho3s1: { health: 420, gunRounds: 0 },
  f8: { health: 600, gunRounds: 840 },
  f4b: { health: 740, gunRounds: 0 },
  f4j: { health: 740, gunRounds: 0 },
  a4: { health: 580, gunRounds: 400 },
  a6a: { health: 780, gunRounds: 0 },
  a6b_weasel: { health: 780, gunRounds: 0 },
  e1: { health: 620, gunRounds: 0 },
  s2: { health: 650, gunRounds: 0 },
  uh2: { health: 500, gunRounds: 0 },
  sh2: { health: 500, gunRounds: 1440 },
  c1: { health: 720, gunRounds: 0 },
  c47: { health: 760, gunRounds: 0 },
  p3: { health: 500, gunRounds: 1440 },
  f4e: { health: 740, gunRounds: 1000 },
  f105: { health: 720, gunRounds: 1000 },
  b52: { health: 3200, gunRounds: 4000 },
  a7: { health: 640, gunRounds: 1000 },
  ov10: { health: 440, gunRounds: 1500 },
  uh1: { health: 460, gunRounds: 1200 },
  ah1: { health: 490, gunRounds: 1500 },
  zero: { health: 500, gunRounds: 1000 },
  george: { health: 500, gunRounds: 900 },
  val: { health: 500, gunRounds: 600 },
  judy: { health: 500, gunRounds: 600 },
  kate: { health: 500, gunRounds: 500 },
  jill: { health: 500, gunRounds: 500 },
  mig15: { health: 540, gunRounds: 300 },
  tu14: { health: 680, gunRounds: 400 },
  yak9: { health: 440, gunRounds: 340 },
  il10: { health: 620, gunRounds: 600 },
  mig17: { health: 450, gunRounds: 240 },
  mig19: { health: 560, gunRounds: 210 },
  mig21: { health: 520, gunRounds: 200 },
  su7: { health: 700, gunRounds: 320 },
  il28: { health: 950, gunRounds: 1440 },
  tu16: { health: 1350, gunRounds: 600 },
  f14a: { health: 860, gunRounds: 940 },
  fa18a: { health: 800, gunRounds: 940 },
  s3a: { health: 900, gunRounds: 1440 },
  a6e: { health: 950, gunRounds: 1440 },
  e2c: { health: 850, gunRounds: 0 },
  ea6b: { health: 920, gunRounds: 1440 },
  c2a: { health: 880, gunRounds: 0 },
  sh3f: { health: 820, gunRounds: 1440 },
  av8b: { health: 720, gunRounds: 300 },
  ch53: { health: 980, gunRounds: 0 },
  a10a: { health: 1400, gunRounds: 1174 },
  ah64a: { health: 750, gunRounds: 1200 },
  ah1w: { health: 680, gunRounds: 750 },
  f15a: { health: 850, gunRounds: 940 },
  f16a: { health: 760, gunRounds: 940 },
  e3a: { health: 1500, gunRounds: 0 },
  f111: { health: 1350, gunRounds: 940 },
  c130: { health: 1600, gunRounds: 0 },
  p36a: { health: 400, gunRounds: 1440 },
  b25: { health: 720, gunRounds: 1440 },
  p39d: { health: 480, gunRounds: 1440 },
  hurricane: { health: 420, gunRounds: 1440 },
  spitfire_v: { health: 420, gunRounds: 1440 },
  beaufighter: { health: 620, gunRounds: 1440 },
  swordfish: { health: 340, gunRounds: 1440 },
  b17_late: { health: 850, gunRounds: 1440 },
  spitfire_xiv: { health: 460, gunRounds: 1440 },
  tempest: { health: 520, gunRounds: 1440 },
  mosquito: { health: 580, gunRounds: 1440 },
  lancaster: { health: 980, gunRounds: 1440 },
  meteor: { health: 520, gunRounds: 1440 },
  f82: { health: 480, gunRounds: 1440 },
  rokaf_p51: { health: 460, gunRounds: 1440 },
  firefly_as5: { health: 490, gunRounds: 1440 },
  a1h: { health: 680, gunRounds: 1440 },
  a37b: { health: 500, gunRounds: 1440 },
  f5a: { health: 560, gunRounds: 1440 },
  f104g: { health: 550, gunRounds: 1440 },
  mirage3: { health: 580, gunRounds: 1440 },
  hunter_fga9: { health: 580, gunRounds: 1440 },
  f4f_phantom: { health: 680, gunRounds: 1000 },
  tornado_gr1: { health: 760, gunRounds: 1440 },
  tornado_ids: { health: 760, gunRounds: 1440 },
  tornado_adv: { health: 750, gunRounds: 1440 },
  mirage2000: { health: 720, gunRounds: 1440 },
  jaguar_gr1: { health: 650, gunRounds: 1440 },
  viggen_ja37: { health: 780, gunRounds: 1440 },
  tu95: { health: 2200, gunRounds: 1440 },
  tu22m3: { health: 1800, gunRounds: 1440 },
  yak38: { health: 700, gunRounds: 1440 },
  ka27: { health: 800, gunRounds: 1440 },
  mig29a: { health: 780, gunRounds: 1440 },
  su27: { health: 880, gunRounds: 1440 },
  a50: { health: 1500, gunRounds: 1440 },
  su25: { health: 1350, gunRounds: 1440 },
  mi24: { health: 880, gunRounds: 1440 },
};

export function getAircraftBaseStats(model: AircraftModel): AircraftBaseStats {
  return AIRCRAFT_BASE_STATS[model] ?? DEFAULT_STATS;
}

/** Un-modified cruise speed before payload speed modifiers, on the shared speed scale. */
export function getAircraftBaseSpeed(model: AircraftModel): number {
  return getAircraftSpeed(model);
}

/** Airframe hit points. */
export function getAircraftBaseHealth(model: AircraftModel): number {
  return getAircraftBaseStats(model).health;
}

/** Gun ammunition carried on a clean-guns loadout. */
export function getAircraftGunRounds(model: AircraftModel): number {
  return getAircraftBaseStats(model).gunRounds;
}
