import { AircraftModel } from '../types/game';
import { getAircraftSpeed } from './speedScale';
import { getGunRounds } from './aircraftArmament';

/**
 * Airframe health for every aircraft model, shared by carrier launches (launchAircraft) and
 * land-based sorties (launchAirbaseSortie). Gun ammunition comes from the historical gun battery
 * in aircraftArmament.ts.
 */
export interface AircraftBaseStats {
  health: number;
}

const DEFAULT_STATS: AircraftBaseStats = { health: 500 };

const AIRCRAFT_BASE_STATS: Partial<Record<AircraftModel, AircraftBaseStats>> = {
  f4f: { health: 420 },
  sbd: { health: 460 },
  tbd: { health: 360 },
  os2u: { health: 500 },
  b17: { health: 820 },
  p40: { health: 460 },
  a20: { health: 520 },
  f6f: { health: 560 },
  f4u: { health: 540 },
  f8f: { health: 520 },
  sb2c: { health: 500 },
  tbf: { health: 560 },
  b24: { health: 920 },
  p51: { health: 450 },
  p47: { health: 620 },
  p38: { health: 480 },
  a26: { health: 660 },
  f86: { health: 520 },
  b29: { health: 1350 },
  f9f: { health: 560 },
  f2h: { health: 580 },
  ad1: { health: 680 },
  f4u4: { health: 500 },
  af_guardian: { health: 540 },
  ad3w: { health: 520 },
  ho3s1: { health: 420 },
  f8: { health: 600 },
  f4b: { health: 740 },
  f4j: { health: 740 },
  a4: { health: 580 },
  a6a: { health: 780 },
  a6b_weasel: { health: 780 },
  e1: { health: 620 },
  s2: { health: 650 },
  uh2: { health: 500 },
  sh2: { health: 500 },
  c1: { health: 720 },
  c47: { health: 760 },
  p3: { health: 1100 },
  f4e: { health: 740 },
  f105: { health: 720 },
  b52: { health: 3200 },
  a7: { health: 640 },
  ov10: { health: 440 },
  uh1: { health: 460 },
  ah1: { health: 490 },
  zero: { health: 220 },
  george: { health: 320 },
  val: { health: 260 },
  judy: { health: 260 },
  kate: { health: 240 },
  jill: { health: 280 },
  mig15: { health: 540 },
  tu14: { health: 680 },
  yak9: { health: 440 },
  la11: { health: 470 },
  il10: { health: 620 },
  mig17: { health: 470 },
  mig19: { health: 540 },
  mig21: { health: 560 },
  su7: { health: 700 },
  il28: { health: 900 },
  tu16: { health: 1350 },
  f14a: { health: 860 },
  fa18a: { health: 800 },
  s3a: { health: 900 },
  a6e: { health: 950 },
  e2c: { health: 850 },
  ea6b: { health: 920 },
  c2a: { health: 880 },
  sh3f: { health: 820 },
  av8b: { health: 720 },
  ch53: { health: 980 },
  a10a: { health: 1400 },
  ah64a: { health: 750 },
  ah1w: { health: 680 },
  f15a: { health: 850 },
  f16a: { health: 760 },
  e3a: { health: 1500 },
  f111: { health: 1350 },
  c130: { health: 1600 },
  p36a: { health: 400 },
  b25: { health: 720 },
  p39d: { health: 480 },
  hurricane: { health: 420 },
  spitfire_v: { health: 420 },
  beaufighter: { health: 620 },
  swordfish: { health: 340 },
  b17_late: { health: 850 },
  spitfire_xiv: { health: 460 },
  tempest: { health: 520 },
  mosquito: { health: 580 },
  lancaster: { health: 980 },
  meteor: { health: 520 },
  f82: { health: 480 },
  rokaf_p51: { health: 460 },
  firefly_as5: { health: 490 },
  a1h: { health: 680 },
  a37b: { health: 500 },
  f5a: { health: 560 },
  f104g: { health: 550 },
  mirage3: { health: 580 },
  hunter_fga9: { health: 580 },
  f4f_phantom: { health: 680 },
  tornado_gr1: { health: 760 },
  tornado_ids: { health: 760 },
  tornado_adv: { health: 750 },
  mirage2000: { health: 720 },
  jaguar_gr1: { health: 650 },
  tu95: { health: 2400 },
  tu22m3: { health: 2000 },
  yak38: { health: 560 },
  ka27: { health: 800 },
  mig29a: { health: 740 },
  su27: { health: 820 },
  a50: { health: 1500 },
  su25: { health: 1100 },
  beaufort: { health: 700 },
  boomerang: { health: 460 }, // 2 x 20 mm + 4 x .303
  seafire: { health: 420 },
  barracuda: { health: 540 },
  canberra: { health: 900 },
  buccaneer: { health: 900 },
  sea_harrier: { health: 640 }, // 2 x 30 mm ADEN pods
  rufe: { health: 200 },
  e13a: { health: 200 },
  walrus: { health: 400 },
  lynx: { health: 560 },
  ki84: { health: 330 }, // 2 x 20 mm + 2 x 12.7 mm
  po2: { health: 260 },
  ac47: { health: 900 }, // three GAU-2 miniguns
  f100: { health: 640 }, // four M39 20 mm
  ch46: { health: 820 }, // door guns
  mig31: { health: 900 },
  pby: { health: 700 }, // bow turret, waist blisters, tunnel gun
  f84: { health: 560 }, // six .50 cal
  sh60b: { health: 700 },
  mig23: { health: 620 }, // GSh-23L
  mi24: { health: 880 },
  // Japanese types without armour or self-sealing tanks
  zero_a6m2: { health: 220 },
  zero_a6m5: { health: 250 },
  kamikaze_zero: { health: 220 },
  kamikaze_judy: { health: 260 },
  ki61: { health: 300 }, // armour plate and self-sealing tanks, unusual for the IJAAF
  g4m: { health: 340 }, // 'the one-shot lighter'
  ohka: { health: 120 },
  il38: { health: 1100 },
  be12: { health: 850 },
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

/** Rounds for the airframe's fixed guns (historical battery, see aircraftArmament.ts). */
export function getAircraftGunRounds(model: AircraftModel): number {
  return getGunRounds(model);
}
