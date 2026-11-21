import { AircraftModel } from '../types/game';

/**
 * One speed scale for ships, aircraft and missiles.
 *
 * Real speeds span from a 12-knot landing craft (22 km/h) to a Mach 5 AIM-54 Phoenix
 * (6,125 km/h). Played linearly, either ships would be frozen or missiles would cross the map
 * in one frame, so every speed goes through the same compressive curve as ranges do
 * (see rangeScale.ts). Ordering across arms stays historical: a jet outruns a Harpoon, a
 * Harpoon outruns a Zero, a Zero outruns any ship.
 *
 *   map speed (units/s) = 19.2 * (km/h / 22) ^ 0.667
 *
 * The curve is anchored on the game's existing extremes, the LCVP (12 kt, 19.2 u/s) and the
 * AIM-54 (Mach 5, 820 u/s):
 *
 *   12 kt LCVP ............ 19     35 kt Fletcher ....... 40     45 kt LCAC ........... 47
 *   167 km/h Swordfish .... 74     270 km/h F6F ........ 102     870 km/h Harpoon .... 222
 *   1000 km/h F-15 cruise . 245    3060 km/h AIM-9 ..... 516     6125 km/h AIM-54 .... 820
 */
const ANCHOR_KMH = 22;
const ANCHOR_SPEED = 19.2;
const TOP_KMH = 6125;
const TOP_SPEED = 820;
const EXPONENT = Math.log(TOP_SPEED / ANCHOR_SPEED) / Math.log(TOP_KMH / ANCHOR_KMH);

const MACH = 1225; // km/h at sea level

export function gameSpeedFromKmh(kmh: number): number {
  return Math.round(ANCHOR_SPEED * Math.pow(Math.max(1, kmh) / ANCHOR_KMH, EXPONENT));
}

/**
 * Ships keep their authored speed in knots (maxSpeed / speed / targetSpeed): this converts a
 * speed in knots into map units per second on the shared curve, preserving sign.
 */
export function shipMapSpeed(knots: number): number {
  if (knots === 0) return 0;
  const kmh = Math.abs(knots) * 1.852;
  const v = ANCHOR_SPEED * Math.pow(kmh / ANCHOR_KMH, EXPONENT);
  return Math.sign(knots) * v;
}

/** Average powered-flight speed of each missile family (km/h) on the shared curve. */
export const MISSILE_SPEED = {
  // Air-to-air
  aim54: gameSpeedFromKmh(5 * MACH), // AIM-54 Phoenix
  aim7: gameSpeedFromKmh(4 * MACH), // AIM-7 Sparrow / R-27
  aim9: gameSpeedFromKmh(2.5 * MACH), // AIM-9 Sidewinder / K-13 / R-73
  // Surface-to-air
  patriot: gameSpeedFromKmh(5 * MACH), // MIM-104
  s300: gameSpeedFromKmh(6 * MACH), // 5V55 / 48N6
  sa2: gameSpeedFromKmh(3.5 * MACH), // V-750
  sa3: gameSpeedFromKmh(3.5 * MACH), // V-600
  hawk: gameSpeedFromKmh(2.4 * MACH), // MIM-23
  standard: gameSpeedFromKmh(3.5 * MACH), // RIM-66 / Terrier / Tartar
  sovietNavalSam: gameSpeedFromKmh(3.5 * MACH), // M-1 Volna / M-11 Shtorm / S-300F
  tunguska: gameSpeedFromKmh(2.7 * MACH), // 9M311
  chaparral: gameSpeedFromKmh(1.5 * MACH), // MIM-72
  // Anti-ship
  harpoon: gameSpeedFromKmh(870), // RGM/AGM/UGM-84
  exocetMm38: gameSpeedFromKmh(1100), // MM38
  exocetMm40: gameSpeedFromKmh(1130), // MM40
  styx: gameSpeedFromKmh(1100), // P-15 Termit (Mach 0.9)
  granit: gameSpeedFromKmh(2.5 * MACH), // P-700
  bazalt: gameSpeedFromKmh(2.5 * MACH), // P-500
  moskit: gameSpeedFromKmh(3 * MACH), // P-270
  kh22: gameSpeedFromKmh(4.6 * MACH), // Kh-22 Burya
  ksr5: gameSpeedFromKmh(3 * MACH), // KSR-5
  // Air-to-surface
  harm: gameSpeedFromKmh(2.9 * MACH), // AGM-88
  standardArm: gameSpeedFromKmh(2.5 * MACH), // AGM-78
  shrike: gameSpeedFromKmh(1.5 * MACH), // AGM-45
  maverick: gameSpeedFromKmh(1150), // AGM-65
  bullpup: gameSpeedFromKmh(1.8 * MACH), // AGM-12
  hellfire: gameSpeedFromKmh(1.3 * MACH), // AGM-114
  // Land attack, ballistic and ASW
  tomahawk: gameSpeedFromKmh(880), // BGM-109
  lance: gameSpeedFromKmh(3 * MACH), // MGM-52 Lance
  atacms: gameSpeedFromKmh(3 * MACH), // MGM-140 terminal
  scud: gameSpeedFromKmh(4.5 * MACH), // R-17 terminal
  trident: gameSpeedFromKmh(10 * MACH), // UGM-133 re-entry vehicle, atmospheric terminal
  asroc: gameSpeedFromKmh(1 * MACH), // RUR-5 ballistic flight
} as const;

/**
 * Typical cruise / combat-transit speed (km/h) of every aircraft model, the speed an aircraft
 * actually flies at between engagements rather than its record maximum. Exhaustive, so a new
 * AircraftModel without a speed is a compile error.
 */
export const AIRCRAFT_CRUISE_KMH: Record<AircraftModel, number> = {
  // WWII United States Navy / USAAF
  f4f: 250,
  sbd: 245,
  tbd: 206,
  os2u: 190,
  sc1: 320,
  f6f: 270,
  f4u: 346,
  f8f: 330,
  sb2c: 254,
  tbf: 241,
  pby: 201,
  beaufort: 320,
  boomerang: 340,
  seafire: 400,
  barracuda: 280,
  canberra: 780,
  buccaneer: 900,
  sea_harrier: 850,
  rufe: 300, // A6M2-N cruise
  e13a: 222, // E13A1 cruise
  walrus: 178, // Walrus cruise
  lynx: 230, // Lynx HAS.2 cruise
  ki84: 380, // Ki-84 cruise
  ac47: 257, // C-47 cruise; orbits at ~190 km/h when firing
  po2: 110,
  f100: 900,
  ch46: 241,
  mig31: 1000, // PBY-5A cruise 125 mph
  b17: 293,
  b17_late: 293,
  b24: 346,
  b25: 370,
  b29: 350,
  p36a: 400,
  p39d: 400,
  p40: 350,
  p38: 440,
  p47: 450,
  p51: 440,
  a20: 370,
  a26: 450,
  c47: 257,
  // WWII Commonwealth
  hurricane: 400,
  spitfire_v: 440,
  spitfire_xiv: 500,
  tempest: 520,
  beaufighter: 400,
  mosquito: 500,
  lancaster: 320,
  swordfish: 167,
  // Imperial Japan
  zero: 333,
  zero_a6m2: 333,
  zero_a6m5: 370,
  ki61: 400,
  george: 370,
  val: 296,
  judy: 425,
  kate: 259,
  jill: 333,
  g4m: 315,
  ohka: 650,
  kamikaze_zero: 370,
  kamikaze_judy: 425,
  // Korean War
  f86: 840,
  f84: 770, // F-84G cruise

  f9f: 770,
  f2h: 740,
  ad1: 320,
  f4u4: 350,
  af_guardian: 290,
  ad3w: 290,
  ho3s1: 136,
  meteor: 750,
  sea_fury: 480,
  f82: 450,
  rokaf_p51: 440,
  firefly_as5: 350,
  mig15: 850,
  tu14: 700,
  yak9: 400,
  il10: 380,
  // Vietnam War
  f8: 900,
  f4b: 940,
  f4j: 940,
  f4e: 940,
  f105: 960,
  a4: 800,
  a6a: 760,
  a6b_weasel: 760,
  a7: 870,
  a1h: 320,
  a37b: 690,
  f5a: 900,
  e1: 290,
  s2: 240,
  c1: 260,
  p3: 610,
  b52: 844,
  ov10: 360,
  uh1: 200,
  uh2: 220,
  sh2: 220,
  ah1: 220,
  mig17: 900,
  mig19: 950,
  mig21: 1000,
  su7: 1000,
  il28: 770,
  tu16: 850,
  // Allied Cold War
  f104g: 980,
  mirage3: 950,
  hunter_fga9: 850,
  f4f_phantom: 940,
  tornado_gr1: 900,
  tornado_ids: 900,
  tornado_adv: 950,
  mirage2000: 1000,
  jaguar_gr1: 850,
  viggen_ja37: 1000,
  // Late Cold War
  f14a: 980,
  f15a: 1000,
  f16a: 980,
  fa18a: 1000,
  f111: 1000,
  av8b: 900,
  a10a: 560,
  a6e: 760,
  ea6b: 770,
  s3a: 650,
  e2c: 474,
  c2a: 465,
  e3a: 800,
  c130: 540,
  sh3f: 219,
  ch53: 278,
  ah64a: 265,
  ah1w: 280,
  mig29a: 1000,
  su27: 1000,
  su25: 750,
  yak38: 800,
  tu95: 710,
  tu22m3: 900,
  a50: 750,
  il38: 600,
  mig23: 950,
  sh60b: 260,
  be12: 320,
  ka27: 205,
  mi24: 270,
};

export function getAircraftSpeed(model: AircraftModel): number {
  return gameSpeedFromKmh(AIRCRAFT_CRUISE_KMH[model]);
}

/** Map speed of Mach 1.2, the line between sea-skimming subsonic and supersonic missiles. */
const SUPERSONIC_SPEED = gameSpeedFromKmh(1.2 * MACH);

export function isSupersonicMissile(speed: number | undefined): boolean {
  return (speed ?? 0) > SUPERSONIC_SPEED;
}

/** Terminal speeds of Japanese special-attack aircraft. */
export const SPECIAL_ATTACK_SPEED = {
  ohka: gameSpeedFromKmh(930), // MXY-7 Model 11 rocket-boosted terminal dive
  kamikazeDive: gameSpeedFromKmh(600), // A6M5 / D4Y power dive
} as const;
