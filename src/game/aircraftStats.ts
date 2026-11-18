import { AircraftModel } from '../types/game';

/**
 * Base cruise speed, airframe health and gun ammunition for every aircraft model, shared by
 * carrier launches (launchAircraft) and land-based sorties (launchAirbaseSortie).
 *
 * gunRounds reflects each era's armament layout: WWII / Korean War fighters carry wing-mounted
 * .50 cal / 20mm batteries with large belts, while post-Vietnam jets carry a single internal
 * fuselage cannon (M61 Vulcan, GSh-30) with far fewer, heavier rounds; missile-only interceptors
 * and support aircraft carry none.
 */
export interface AircraftBaseStats {
  speed: number;
  health: number;
  gunRounds: number;
}

const DEFAULT_STATS: AircraftBaseStats = { speed: 120, health: 500, gunRounds: 1440 };

const AIRCRAFT_BASE_STATS: Partial<Record<AircraftModel, AircraftBaseStats>> = {
  f4f: { speed: 98, health: 360, gunRounds: 1440 },
  sbd: { speed: 84, health: 420, gunRounds: 720 },
  tbd: { speed: 76, health: 360, gunRounds: 600 },
  os2u: { speed: 120, health: 500, gunRounds: 500 },
  b17: { speed: 88, health: 820, gunRounds: 3200 },
  p40: { speed: 104, health: 420, gunRounds: 1440 },
  a20: { speed: 108, health: 520, gunRounds: 2000 },
  f6f: { speed: 105, health: 440, gunRounds: 2400 },
  f4u: { speed: 112, health: 480, gunRounds: 2400 },
  f8f: { speed: 118, health: 520, gunRounds: 800 },
  sb2c: { speed: 90, health: 500, gunRounds: 720 },
  tbf: { speed: 86, health: 460, gunRounds: 600 },
  b24: { speed: 96, health: 920, gunRounds: 3200 },
  p51: { speed: 124, health: 450, gunRounds: 1880 },
  p47: { speed: 114, health: 620, gunRounds: 3400 },
  p38: { speed: 116, health: 480, gunRounds: 1800 },
  a26: { speed: 120, health: 660, gunRounds: 2400 },
  f86: { speed: 138, health: 480, gunRounds: 1800 },
  b29: { speed: 108, health: 1350, gunRounds: 4400 },
  f9f: { speed: 150, health: 560, gunRounds: 800 },
  f2h: { speed: 145, health: 580, gunRounds: 800 },
  ad1: { speed: 115, health: 680, gunRounds: 800 },
  f4u4: { speed: 115, health: 500, gunRounds: 1800 },
  af_guardian: { speed: 90, health: 540, gunRounds: 600 },
  ad3w: { speed: 85, health: 520, gunRounds: 0 },
  ho3s1: { speed: 65, health: 420, gunRounds: 0 },
  f8: { speed: 155, health: 600, gunRounds: 840 },
  f4b: { speed: 165, health: 740, gunRounds: 0 },
  f4j: { speed: 165, health: 740, gunRounds: 0 },
  a4: { speed: 135, health: 580, gunRounds: 400 },
  a6a: { speed: 130, health: 780, gunRounds: 0 },
  a6b_weasel: { speed: 130, health: 780, gunRounds: 0 },
  e1: { speed: 100, health: 620, gunRounds: 0 },
  s2: { speed: 100, health: 650, gunRounds: 0 },
  uh2: { speed: 85, health: 500, gunRounds: 0 },
  sh2: { speed: 92, health: 500, gunRounds: 1440 },
  c1: { speed: 100, health: 720, gunRounds: 0 },
  c47: { speed: 98, health: 760, gunRounds: 0 },
  p3: { speed: 115, health: 500, gunRounds: 1440 },
  f4e: { speed: 165, health: 740, gunRounds: 1000 },
  f105: { speed: 155, health: 720, gunRounds: 1000 },
  b52: { speed: 135, health: 3200, gunRounds: 4000 },
  a7: { speed: 140, health: 640, gunRounds: 1000 },
  ov10: { speed: 95, health: 440, gunRounds: 1500 },
  uh1: { speed: 90, health: 460, gunRounds: 1200 },
  ah1: { speed: 95, health: 490, gunRounds: 1500 },
  zero: { speed: 120, health: 500, gunRounds: 1000 },
  george: { speed: 120, health: 500, gunRounds: 900 },
  val: { speed: 120, health: 500, gunRounds: 600 },
  judy: { speed: 120, health: 500, gunRounds: 600 },
  kate: { speed: 120, health: 500, gunRounds: 500 },
  jill: { speed: 120, health: 500, gunRounds: 500 },
  mig15: { speed: 160, health: 540, gunRounds: 300 },
  tu14: { speed: 130, health: 680, gunRounds: 400 },
  yak9: { speed: 132, health: 440, gunRounds: 340 },
  il10: { speed: 116, health: 620, gunRounds: 600 },
  mig17: { speed: 145, health: 450, gunRounds: 240 },
  mig19: { speed: 168, health: 560, gunRounds: 210 },
  mig21: { speed: 175, health: 520, gunRounds: 200 },
  su7: { speed: 158, health: 700, gunRounds: 320 },
  il28: { speed: 128, health: 950, gunRounds: 1440 },
  tu16: { speed: 142, health: 1350, gunRounds: 600 },
  f14a: { speed: 220, health: 860, gunRounds: 940 },
  fa18a: { speed: 198, health: 800, gunRounds: 940 },
  s3a: { speed: 148, health: 900, gunRounds: 1440 },
  a6e: { speed: 155, health: 950, gunRounds: 1440 },
  e2c: { speed: 125, health: 850, gunRounds: 0 },
  ea6b: { speed: 152, health: 920, gunRounds: 1440 },
  c2a: { speed: 125, health: 880, gunRounds: 0 },
  sh3f: { speed: 105, health: 820, gunRounds: 1440 },
  av8b: { speed: 170, health: 720, gunRounds: 300 },
  ch53: { speed: 105, health: 980, gunRounds: 0 },
  a10a: { speed: 140, health: 1400, gunRounds: 1174 },
  ah64a: { speed: 115, health: 750, gunRounds: 1200 },
  ah1w: { speed: 115, health: 680, gunRounds: 750 },
  f15a: { speed: 230, health: 850, gunRounds: 940 },
  f16a: { speed: 210, health: 760, gunRounds: 940 },
  e3a: { speed: 135, health: 1500, gunRounds: 0 },
  f111: { speed: 215, health: 1350, gunRounds: 940 },
  c130: { speed: 125, health: 1600, gunRounds: 0 },
  p36a: { speed: 100, health: 400, gunRounds: 1440 },
  b25: { speed: 108, health: 720, gunRounds: 1440 },
  p39d: { speed: 98, health: 480, gunRounds: 1440 },
  hurricane: { speed: 102, health: 420, gunRounds: 1440 },
  spitfire_v: { speed: 112, health: 420, gunRounds: 1440 },
  beaufighter: { speed: 106, health: 620, gunRounds: 1440 },
  swordfish: { speed: 74, health: 340, gunRounds: 1440 },
  b17_late: { speed: 88, health: 850, gunRounds: 1440 },
  spitfire_xiv: { speed: 126, health: 460, gunRounds: 1440 },
  tempest: { speed: 128, health: 520, gunRounds: 1440 },
  mosquito: { speed: 125, health: 580, gunRounds: 1440 },
  lancaster: { speed: 96, health: 980, gunRounds: 1440 },
  meteor: { speed: 138, health: 520, gunRounds: 1440 },
  f82: { speed: 124, health: 480, gunRounds: 1440 },
  rokaf_p51: { speed: 122, health: 460, gunRounds: 1440 },
  firefly_as5: { speed: 104, health: 490, gunRounds: 1440 },
  a1h: { speed: 115, health: 680, gunRounds: 1440 },
  a37b: { speed: 130, health: 500, gunRounds: 1440 },
  f5a: { speed: 160, health: 560, gunRounds: 1440 },
  f104g: { speed: 185, health: 550, gunRounds: 1440 },
  mirage3: { speed: 168, health: 580, gunRounds: 1440 },
  hunter_fga9: { speed: 140, health: 580, gunRounds: 1440 },
  f4f_phantom: { speed: 165, health: 680, gunRounds: 1000 },
  tornado_gr1: { speed: 175, health: 760, gunRounds: 1440 },
  tornado_ids: { speed: 175, health: 760, gunRounds: 1440 },
  tornado_adv: { speed: 195, health: 750, gunRounds: 1440 },
  mirage2000: { speed: 205, health: 720, gunRounds: 1440 },
  jaguar_gr1: { speed: 155, health: 650, gunRounds: 1440 },
  viggen_ja37: { speed: 190, health: 780, gunRounds: 1440 },
  tu95: { speed: 130, health: 2200, gunRounds: 1440 },
  tu22m3: { speed: 205, health: 1800, gunRounds: 1440 },
  yak38: { speed: 165, health: 700, gunRounds: 1440 },
  ka27: { speed: 105, health: 800, gunRounds: 1440 },
  mig29a: { speed: 218, health: 780, gunRounds: 1440 },
  su27: { speed: 225, health: 880, gunRounds: 1440 },
  a50: { speed: 135, health: 1500, gunRounds: 1440 },
  su25: { speed: 145, health: 1350, gunRounds: 1440 },
  mi24: { speed: 120, health: 880, gunRounds: 1440 },
};

export function getAircraftBaseStats(model: AircraftModel): AircraftBaseStats {
  return AIRCRAFT_BASE_STATS[model] ?? DEFAULT_STATS;
}

/** Un-modified cruise speed before payload speed modifiers. */
export function getAircraftBaseSpeed(model: AircraftModel): number {
  return getAircraftBaseStats(model).speed;
}

/** Airframe hit points. */
export function getAircraftBaseHealth(model: AircraftModel): number {
  return getAircraftBaseStats(model).health;
}

/** Gun ammunition carried on a clean-guns loadout. */
export function getAircraftGunRounds(model: AircraftModel): number {
  return getAircraftBaseStats(model).gunRounds;
}
