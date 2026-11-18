import { AircraftModel } from '../types/game';

/**
 * Base cruise speed, airframe health and gun ammunition for every aircraft model.
 *
 * Historically the engine kept two independent ternary chains per stat: one for sorties launched with
 * `launchAircraft` (carriers and scripted spawns) and one for `launchAirbaseSortie` (land
 * airbases). They drifted apart, so this table keeps the first as `speed` / `health` / `gunRounds` and
 * records every place the airbase chain differs as `airbaseSpeed` / `airbaseHealth` / `airbaseGunRounds`. Values are copied
 * verbatim; reconcile them here rather than in the engine.
 */
export interface AircraftBaseStats {
  speed: number;
  health: number;
  gunRounds: number;
  airbaseSpeed?: number;
  airbaseHealth?: number;
  airbaseGunRounds?: number;
}

export type SortieOrigin = 'carrier' | 'airbase';

const DEFAULT_SPEED = 120;
const DEFAULT_HEALTH = 500;
const DEFAULT_GUN_ROUNDS = 1440;

const AIRCRAFT_BASE_STATS: Partial<Record<AircraftModel, AircraftBaseStats>> = {
  f4f: { speed: 98, health: 360, gunRounds: 1440 },
  sbd: { speed: 84, health: 420, gunRounds: 720, airbaseGunRounds: 1440 },
  tbd: { speed: 76, health: 360, gunRounds: 600, airbaseHealth: 500, airbaseGunRounds: 1440 },
  os2u: { speed: 120, health: 500, gunRounds: 500, airbaseGunRounds: 1440 },
  b17: { speed: 88, health: 820, gunRounds: 1440, airbaseGunRounds: 3200 },
  p40: { speed: 104, health: 500, gunRounds: 1440, airbaseHealth: 420 },
  a20: { speed: 108, health: 500, gunRounds: 1440, airbaseHealth: 520, airbaseGunRounds: 2000 },
  f6f: { speed: 105, health: 440, gunRounds: 2400, airbaseGunRounds: 1440 },
  f4u: { speed: 112, health: 480, gunRounds: 2400, airbaseGunRounds: 1440 },
  f8f: { speed: 118, health: 520, gunRounds: 800, airbaseGunRounds: 1440 },
  sb2c: { speed: 90, health: 500, gunRounds: 720, airbaseGunRounds: 1440 },
  tbf: { speed: 86, health: 460, gunRounds: 600, airbaseGunRounds: 1440 },
  b24: { speed: 96, health: 920, gunRounds: 1440, airbaseGunRounds: 3200 },
  p51: { speed: 124, health: 500, gunRounds: 1440, airbaseHealth: 450, airbaseGunRounds: 1880 },
  p47: { speed: 114, health: 620, gunRounds: 1440, airbaseGunRounds: 3400 },
  p38: { speed: 116, health: 500, gunRounds: 1440, airbaseHealth: 480, airbaseGunRounds: 1800 },
  a26: { speed: 120, health: 660, gunRounds: 1440, airbaseGunRounds: 2400 },
  f86: { speed: 138, health: 500, gunRounds: 1440, airbaseHealth: 480, airbaseGunRounds: 1800 },
  b29: { speed: 108, health: 1350, gunRounds: 1440, airbaseGunRounds: 4400 },
  f9f: { speed: 150, health: 560, gunRounds: 800, airbaseSpeed: 128, airbaseHealth: 500, airbaseGunRounds: 1440 },
  f2h: { speed: 145, health: 580, gunRounds: 800, airbaseSpeed: 126, airbaseHealth: 540, airbaseGunRounds: 1440 },
  ad1: { speed: 115, health: 680, gunRounds: 800, airbaseGunRounds: 1440 },
  f4u4: { speed: 115, health: 500, gunRounds: 1800, airbaseSpeed: 112, airbaseHealth: 480, airbaseGunRounds: 1440 },
  af_guardian: { speed: 90, health: 540, gunRounds: 600, airbaseSpeed: 86, airbaseHealth: 460, airbaseGunRounds: 1440 },
  ad3w: { speed: 85, health: 520, gunRounds: 0, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  ho3s1: { speed: 65, health: 420, gunRounds: 0, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  f8: { speed: 155, health: 600, gunRounds: 840, airbaseSpeed: 150, airbaseHealth: 560, airbaseGunRounds: 1440 },
  f4b: { speed: 165, health: 740, gunRounds: 0, airbaseHealth: 680, airbaseGunRounds: 1440 },
  f4j: { speed: 165, health: 740, gunRounds: 0, airbaseHealth: 680, airbaseGunRounds: 1440 },
  a4: { speed: 135, health: 580, gunRounds: 400, airbaseSpeed: 132, airbaseHealth: 560, airbaseGunRounds: 1440 },
  a6a: { speed: 130, health: 780, gunRounds: 0, airbaseHealth: 700, airbaseGunRounds: 1440 },
  a6b_weasel: { speed: 130, health: 780, gunRounds: 0, airbaseHealth: 700, airbaseGunRounds: 1440 },
  e1: { speed: 100, health: 620, gunRounds: 0, airbaseHealth: 580, airbaseGunRounds: 1440 },
  s2: { speed: 100, health: 650, gunRounds: 0, airbaseHealth: 580, airbaseGunRounds: 1440 },
  uh2: { speed: 85, health: 500, gunRounds: 0, airbaseSpeed: 90, airbaseHealth: 460, airbaseGunRounds: 1440 },
  sh2: { speed: 92, health: 500, gunRounds: 1440 },
  c1: { speed: 100, health: 720, gunRounds: 0, airbaseHealth: 580 },
  c47: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 98, airbaseHealth: 760, airbaseGunRounds: 0 },
  p3: { speed: 115, health: 500, gunRounds: 1440 },
  f4e: { speed: 165, health: 740, gunRounds: 1440, airbaseHealth: 680, airbaseGunRounds: 1000 },
  f105: { speed: 155, health: 720, gunRounds: 1440, airbaseGunRounds: 1000 },
  b52: { speed: 135, health: 3200, gunRounds: 1440, airbaseGunRounds: 4000 },
  a7: { speed: 140, health: 640, gunRounds: 1440, airbaseGunRounds: 1000 },
  ov10: { speed: 95, health: 500, gunRounds: 1440, airbaseHealth: 440, airbaseGunRounds: 1500 },
  uh1: { speed: 90, health: 500, gunRounds: 1440, airbaseHealth: 460, airbaseGunRounds: 1200 },
  ah1: { speed: 95, health: 500, gunRounds: 1440, airbaseHealth: 490, airbaseGunRounds: 1500 },
  zero: { speed: 120, health: 500, gunRounds: 1000, airbaseGunRounds: 1440 },
  george: { speed: 120, health: 500, gunRounds: 900, airbaseGunRounds: 1440 },
  val: { speed: 120, health: 500, gunRounds: 600, airbaseGunRounds: 1440 },
  judy: { speed: 120, health: 500, gunRounds: 600, airbaseGunRounds: 1440 },
  kate: { speed: 120, health: 500, gunRounds: 500, airbaseGunRounds: 1440 },
  jill: { speed: 120, health: 500, gunRounds: 500, airbaseGunRounds: 1440 },
  mig15: { speed: 160, health: 540, gunRounds: 300, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  tu14: { speed: 130, health: 680, gunRounds: 400, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  yak9: { speed: 132, health: 440, gunRounds: 340, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  il10: { speed: 116, health: 620, gunRounds: 600, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  mig17: { speed: 145, health: 450, gunRounds: 240, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  mig19: { speed: 168, health: 560, gunRounds: 210, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  mig21: { speed: 175, health: 520, gunRounds: 200, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  su7: { speed: 158, health: 700, gunRounds: 320, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  il28: { speed: 128, health: 950, gunRounds: 1440, airbaseSpeed: 120, airbaseHealth: 500 },
  tu16: { speed: 142, health: 1350, gunRounds: 600, airbaseSpeed: 120, airbaseHealth: 500, airbaseGunRounds: 1440 },
  f14a: { speed: 220, health: 860, gunRounds: 1440, airbaseGunRounds: 940 },
  fa18a: { speed: 198, health: 800, gunRounds: 1440, airbaseGunRounds: 940 },
  s3a: { speed: 148, health: 900, gunRounds: 1440 },
  a6e: { speed: 155, health: 950, gunRounds: 1440 },
  e2c: { speed: 125, health: 850, gunRounds: 1440, airbaseGunRounds: 0 },
  ea6b: { speed: 152, health: 920, gunRounds: 1440 },
  c2a: { speed: 125, health: 880, gunRounds: 1440, airbaseGunRounds: 0 },
  sh3f: { speed: 105, health: 820, gunRounds: 1440 },
  av8b: { speed: 170, health: 720, gunRounds: 1440, airbaseGunRounds: 300 },
  ch53: { speed: 105, health: 980, gunRounds: 1440, airbaseGunRounds: 0 },
  a10a: { speed: 140, health: 1400, gunRounds: 1440, airbaseGunRounds: 1174 },
  ah64a: { speed: 115, health: 750, gunRounds: 1440, airbaseGunRounds: 1200 },
  ah1w: { speed: 115, health: 680, gunRounds: 1440, airbaseGunRounds: 750 },
  f15a: { speed: 230, health: 850, gunRounds: 1440, airbaseGunRounds: 940 },
  f16a: { speed: 210, health: 760, gunRounds: 1440, airbaseGunRounds: 940 },
  e3a: { speed: 135, health: 1500, gunRounds: 1440, airbaseGunRounds: 0 },
  f111: { speed: 215, health: 1350, gunRounds: 1440, airbaseGunRounds: 940 },
  c130: { speed: 125, health: 1600, gunRounds: 1440, airbaseGunRounds: 0 },
  p36a: { speed: 100, health: 400, gunRounds: 1440 },
  b25: { speed: 108, health: 720, gunRounds: 1440 },
  p39d: { speed: 98, health: 480, gunRounds: 1440 },
  hurricane: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 102, airbaseHealth: 420 },
  spitfire_v: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 112, airbaseHealth: 420 },
  beaufighter: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 106, airbaseHealth: 620 },
  swordfish: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 74, airbaseHealth: 340 },
  b17_late: { speed: 88, health: 850, gunRounds: 1440 },
  spitfire_xiv: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 126, airbaseHealth: 460 },
  tempest: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 128, airbaseHealth: 520 },
  mosquito: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 125, airbaseHealth: 580 },
  lancaster: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 96, airbaseHealth: 980 },
  meteor: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 138, airbaseHealth: 520 },
  f82: { speed: 124, health: 480, gunRounds: 1440 },
  rokaf_p51: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 122, airbaseHealth: 460 },
  firefly_as5: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 104, airbaseHealth: 490 },
  a1h: { speed: 115, health: 680, gunRounds: 1440 },
  a37b: { speed: 130, health: 500, gunRounds: 1440 },
  f5a: { speed: 160, health: 560, gunRounds: 1440 },
  f104g: { speed: 185, health: 550, gunRounds: 1440 },
  mirage3: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 168, airbaseHealth: 580 },
  hunter_fga9: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 140, airbaseHealth: 580 },
  f4f_phantom: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 165, airbaseHealth: 680, airbaseGunRounds: 1000 },
  tornado_gr1: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 175, airbaseHealth: 760 },
  tornado_ids: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 175, airbaseHealth: 760 },
  tornado_adv: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 195, airbaseHealth: 750 },
  mirage2000: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 205, airbaseHealth: 720 },
  jaguar_gr1: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 155, airbaseHealth: 650 },
  viggen_ja37: { speed: 120, health: 500, gunRounds: 1440, airbaseSpeed: 190, airbaseHealth: 780 },
  tu95: { speed: 130, health: 2200, gunRounds: 1440 },
  tu22m3: { speed: 205, health: 1800, gunRounds: 1440 },
  yak38: { speed: 165, health: 700, gunRounds: 1440, airbaseSpeed: 120, airbaseHealth: 500 },
  ka27: { speed: 105, health: 800, gunRounds: 1440, airbaseHealth: 500 },
  mig29a: { speed: 218, health: 780, gunRounds: 1440 },
  su27: { speed: 225, health: 880, gunRounds: 1440, airbaseHealth: 500 },
  a50: { speed: 135, health: 1500, gunRounds: 1440 },
  su25: { speed: 145, health: 1350, gunRounds: 1440, airbaseSpeed: 120, airbaseHealth: 500 },
  mi24: { speed: 120, health: 880, gunRounds: 1440, airbaseHealth: 500 },
};

/** Un-modified cruise speed before payload speed modifiers. */
export function getAircraftBaseSpeed(model: AircraftModel, origin: SortieOrigin): number {
  const s = AIRCRAFT_BASE_STATS[model];
  if (!s) return DEFAULT_SPEED;
  return origin === 'airbase' ? (s.airbaseSpeed ?? s.speed) : s.speed;
}

/** Airframe hit points. */
export function getAircraftBaseHealth(model: AircraftModel, origin: SortieOrigin): number {
  const s = AIRCRAFT_BASE_STATS[model];
  if (!s) return DEFAULT_HEALTH;
  return origin === 'airbase' ? (s.airbaseHealth ?? s.health) : s.health;
}

/** Gun ammunition carried on a clean-guns loadout. */
export function getAircraftGunRounds(model: AircraftModel, origin: SortieOrigin): number {
  const s = AIRCRAFT_BASE_STATS[model];
  if (!s) return DEFAULT_GUN_ROUNDS;
  return origin === 'airbase' ? (s.airbaseGunRounds ?? s.gunRounds) : s.gunRounds;
}
