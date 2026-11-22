import { Aircraft, AircraftModel, Era, Ship } from '../types/game';
import { gameRangeFromKm } from './rangeScale';

/**
 * Anti-submarine warfare model, era by era.
 *
 * Detection is no longer a fixed radius. It depends on:
 * - the sensor: WWII searchlight ASDIC/QC sets (~1.5 km, useless above ~15 kt), 1950s SQS-4,
 *   1960s low-frequency bow sonars (SQS-23/26), 1980s SQS-53 with the SQR-19 towed array;
 *   aircraft see a shallow submarine, find snorkels with radar, and localise with MAD only when
 *   nearly overhead; helicopters lower dipping sonar;
 * - how loud the submarine is: its class (a Kilo or Akula is far quieter than a Victor or an
 *   Oscar) and how fast it is going (cavitation and flow noise);
 * - the hunter's own speed: hull sonars go deaf above hunting speed;
 * - whether a diesel boat is snorkelling (or, before the snorkel, running surfaced) to recharge,
 *   which makes it noisy and visible to radar.
 */

export type SonarKind = 'active' | 'passive';

export interface SonarSuite {
  label: string;
  kind: SonarKind;
  rangeKm: number;
  /** Above this own speed (knots) the hull sonar is drowned by flow noise. */
  huntSpeedKt: number;
}

const DIESEL_VARIANTS = new Set(['uboat', 'ijn_sub', 'whiskey', 'zulu', 'foxtrot', 'kilo']);

/** Relative radiated noise of each submarine class (1 = a noisy boat). */
const CLASS_NOISE: Record<string, number> = {
  uboat: 0.8, // on electric motors
  ijn_sub: 0.9, // large I-boats were comparatively loud
  whiskey: 0.85,
  zulu: 0.85,
  foxtrot: 0.85,
  kilo: 0.45, // "black hole": anechoic tiles, single skewed screw
  victor3: 0.7,
  akula: 0.5,
  oscar2: 0.9,
  ssn_la: 0.55,
};

export function isDieselBoat(sub: Ship): boolean {
  return DIESEL_VARIANTS.has(sub.subVariant ?? '') || sub.type === 'foxtrot' || (sub.type === 'submarine' && !sub.subVariant);
}

/** 0..1+ radiated noise of a submarine right now (class, speed, snorkelling). */
export function submarineNoise(sub: Ship): number {
  const base = CLASS_NOISE[sub.subVariant ?? ''] ?? 0.8;
  const speedFrac = Math.min(1, Math.abs(sub.speed) / Math.max(1, sub.maxSpeed));
  const snorkel = sub.isSnorkeling ? 1.6 : 1;
  return base * (0.55 + 0.9 * speedFrac) * snorkel;
}

/** Hull sonar of a surface ship or submarine, by era, navy and class. */
export function shipSonar(ship: Ship, era: Era, isSub: boolean): SonarSuite | undefined {
  const soviet = ship.side === 'enemy' && era !== 'era1' && era !== 'era2';
  const japanese = ship.side === 'enemy' && (era === 'era1' || era === 'era2');
  if (isSub) {
    if (era === 'era1' || era === 'era2') return { label: '被動水聽器', kind: 'passive', rangeKm: 2, huntSpeedKt: 6 };
    if (era === 'era3') return { label: 'MG-10 / BQR-2 被動聲納', kind: 'passive', rangeKm: 3, huntSpeedKt: 8 };
    if (era === 'era4') return { label: 'MG-200 / BQQ-2 聲納', kind: 'passive', rangeKm: 6, huntSpeedKt: 10 };
    if (ship.subVariant === 'ssn_la') return { label: 'BQQ-5 球形聲納 + 拖曳陣列', kind: 'passive', rangeKm: 14, huntSpeedKt: 12 };
    if (ship.subVariant === 'akula') return { label: 'MGK-540 Skat-3', kind: 'passive', rangeKm: 12, huntSpeedKt: 12 };
    return { label: 'MGK-400 Rubikon', kind: 'passive', rangeKm: 9, huntSpeedKt: 10 };
  }
  const aswShip = ship.hasASROC || ship.hasSVTT || ship.hasDepthCharges || ship.hasHedgehog;
  const sovietAsw = soviet && ['destroyer', 'petya', 'riga', 'kashin', 'dd_udaloy', 'cgn_kirov', 'dd_sovremenny', 'cvhg_kiev', 'cg_slava', 'kynda'].includes(ship.type);
  if (!aswShip && !sovietAsw) return undefined;

  if (japanese) return { label: '九三式探信儀', kind: 'active', rangeKm: era === 'era1' ? 0.8 : 1.0, huntSpeedKt: 12 };
  if (era === 'era1') return { label: 'QC 探照式主動聲納 (ASDIC)', kind: 'active', rangeKm: 1.5, huntSpeedKt: 15 };
  if (era === 'era2') return { label: 'QGA / QJB 主動聲納', kind: 'active', rangeKm: 2, huntSpeedKt: 15 };
  if (soviet) {
    if (era === 'era3') return { label: 'Tamir-5 主動聲納', kind: 'active', rangeKm: 2, huntSpeedKt: 15 };
    if (era === 'era4') {
      return ship.type === 'riga'
        ? { label: 'Pegas-2 主動聲納', kind: 'active', rangeKm: 3, huntSpeedKt: 16 }
        : { label: 'Titan-2 / Gerkules 艦艏聲納', kind: 'active', rangeKm: 6, huntSpeedKt: 18 };
    }
    if (ship.type === 'dd_udaloy' || ship.type === 'cgn_kirov') return { label: 'Polinom 艦艏低頻聲納', kind: 'active', rangeKm: 25, huntSpeedKt: 18 };
    if (ship.type === 'cvhg_kiev' || ship.type === 'cg_slava') return { label: 'Orion / Platina 聲納', kind: 'active', rangeKm: 12, huntSpeedKt: 18 };
    return { label: 'Platina 艦艏聲納', kind: 'active', rangeKm: 8, huntSpeedKt: 18 };
  }
  if (era === 'era3') return { label: 'SQS-4 掃描聲納', kind: 'active', rangeKm: 3.5, huntSpeedKt: 18 };
  if (era === 'era4') {
    return ship.type === 'ffg' || ship.type === 'cg'
      ? { label: 'SQS-26 艦艏低頻聲納', kind: 'active', rangeKm: 15, huntSpeedKt: 20 }
      : { label: 'SQS-23 聲納', kind: 'active', rangeKm: 9, huntSpeedKt: 20 };
  }
  // Era 5: towed arrays listen far but only at low speed; the bow sonar keeps working faster
  if (ship.type === 'dd_spruance' || ship.type === 'ffg_ohp') {
    return { label: 'SQR-19 戰術拖曳陣列 (被動)', kind: 'passive', rangeKm: 30, huntSpeedKt: 15 };
  }
  return { label: 'SQS-53 / SQS-56 艦艏聲納', kind: 'active', rangeKm: 12, huntSpeedKt: 22 };
}

/** Effective detection range (map units) of a hull sonar against a given submarine. */
export function sonarDetectionRange(sonar: SonarSuite, ownSpeedKt: number, sub: Ship): number {
  const noise = submarineNoise(sub);
  // Active sonar hears its own echo, so target noise matters little; passive depends on it entirely
  const targetFactor = sonar.kind === 'active' ? 0.8 + 0.2 * Math.min(1.2, noise) : noise;
  const ownSpeedFactor = Math.abs(ownSpeedKt) > sonar.huntSpeedKt ? 0.35 : 1;
  return gameRangeFromKm(sonar.rangeKm * targetFactor * ownSpeedFactor);
}

/** Close range inside which a searchlight sonar loses contact (the beam passes over the boat). */
export function sonarDeadZone(sonar: SonarSuite, era: Era): number {
  return sonar.kind === 'active' && (era === 'era1' || era === 'era2' || era === 'era3') ? 140 : 0;
}

/** Patrol / ASW aircraft carrying a MAD boom (from 1944). */
const MAD_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['pby', 'af_guardian', 's2', 'p3', 's3a', 'sh2', 'sh60b', 'lynx', 'il38', 'be12', 'ka27']);
/** Helicopters with dipping sonar. */
const DIPPING_SONAR: Partial<Record<AircraftModel, number>> = { sh3f: 8, ka27: 7, lynx: 6, uh2: 0, sh60b: 0 };

/**
 * Helicopters that can hover and lower a dipping sonar: SH-3 Sea King (AN/AQS-13), Ka-27 (VGS-3),
 * Lynx (DUAV-4 / HELRAS on the French and Dutch aircraft). The SH-2 and SH-60B LAMPS helicopters
 * worked with sonobuoys and the ship's sonar instead (the dipper came with the SH-60F).
 */
export function canDipSonar(model: AircraftModel): boolean {
  return (DIPPING_SONAR[model] ?? 0) > 0;
}

/** Nominal range of a dipping sonar (map units), for drawing. */
export function dippingSonarNominalRange(model: AircraftModel): number {
  return gameRangeFromKm(DIPPING_SONAR[model] ?? 0);
}

/** Active range of a lowered dipping sonar against a submarine (map units); not blocked by the layer. */
export function dippingSonarRange(model: AircraftModel, sub: Ship): number {
  const km = DIPPING_SONAR[model] ?? 0;
  return km > 0 ? gameRangeFromKm(km * (0.85 + 0.15 * Math.min(1.2, submarineNoise(sub)))) : 0;
}
/** Aircraft with a search radar able to pick up a snorkel or a surfaced boat (km). */
const SEARCH_RADAR_KM: Partial<Record<AircraftModel, number>> = {
  pby: 15, os2u: 6, sc1: 10, tbf: 10, af_guardian: 20, ad3w: 30, s2: 25, p3: 40, s3a: 40, e2c: 40, sh2: 15, sh60b: 20,
  sh3f: 12, il38: 35, be12: 25, ka27: 15, firefly_as5: 12, beaufort: 10, swordfish: 8, barracuda: 8,
};

/**
 * Detection range of an aircraft against a submerged submarine: sighting a shallow, slow boat,
 * radar on a snorkel or surfaced boat, MAD only when nearly overhead, dipping sonar.
 */
export function aircraftDetectionRange(plane: Aircraft, sub: Ship, era: Era): number {
  const noise = submarineNoise(sub);
  let km = 0;
  // A boat at periscope depth and slow speed can be sighted (clear Pacific water, wake, slick)
  const slow = Math.abs(sub.speed) < sub.maxSpeed * 0.5;
  if (slow) km = Math.max(km, era === 'era1' || era === 'era2' ? 0.8 : 0.5);
  if (sub.isSnorkeling) km = Math.max(km, SEARCH_RADAR_KM[plane.model] ?? (era === 'era1' ? 3 : 5));
  if (MAD_MODELS.has(plane.model) && era !== 'era1') km = Math.max(km, 0.5);
  const dip = DIPPING_SONAR[plane.model];
  if (dip && (era === 'era4' || era === 'era5')) km = Math.max(km, dip * (0.8 + 0.2 * Math.min(1.2, noise)));
  return km > 0 ? gameRangeFromKm(km) : 0;
}

/** Surfaced speed of WWII boats (knots), used for surfaced transit. */
const SURFACE_SPEED: Record<string, number> = { uboat: 19, ijn_sub: 23 };

export interface DieselState {
  /** Hard speed limit (knots): snorkel speed, or a crawl on a flat battery. */
  capKt?: number;
  /** WWII surfaced transit: run at this surface speed instead of the submerged maximum. */
  surfaceKt?: number;
}

/**
 * Diesel battery and surfacing. WWII boats ran on the surface (diesels, charging) and dived only
 * when escorts or aircraft came near; from the Korean War on, boats stayed down and snorkelled to
 * charge when the battery ran low and nothing was close. The battery drains with the square of
 * submerged speed.
 */
export function updateDieselBattery(sub: Ship, dt: number, era: Era, nearestShip: number, nearestAircraft: number): DieselState {
  if (!isDieselBoat(sub)) return {};
  const battery = sub.battery ?? 1;
  const speedFrac = Math.min(1, Math.abs(sub.speed) / Math.max(1, sub.maxSpeed));
  const drain = () => (sub.battery = Math.max(0, battery - (0.0008 + 0.006 * speedFrac * speedFrac) * dt));

  if (era === 'era1' || era === 'era2') {
    const safe = nearestShip > 2500 && nearestAircraft > 1500;
    if (safe) {
      sub.isSnorkeling = true; // on the surface
      sub.diveTimer = undefined;
      sub.battery = Math.min(1, battery + 0.02 * dt);
      return { surfaceKt: SURFACE_SPEED[sub.subVariant ?? ''] ?? 17 };
    }
    if (sub.isSnorkeling) {
      // Crash dive: a U-boat needed ~25 s, a big I-boat nearer a minute, to get under; until then
      // it is still on the surface and can be shelled, bombed or strafed
      sub.diveTimer = (sub.diveTimer ?? (sub.subVariant === 'ijn_sub' ? 9 : 6)) - dt;
      if (sub.diveTimer > 0) return { capKt: 8 };
      sub.isSnorkeling = false;
      sub.diveTimer = undefined;
    }
    drain();
    return (sub.battery ?? 0) <= 0.02 ? { capKt: 3 } : {};
  }

  if (sub.isSnorkeling) {
    sub.battery = Math.min(1, battery + 0.02 * dt);
    // Lookouts or the ESM mast report an aircraft: pull the snorkel and go deep
    if (sub.battery >= 0.95 || nearestShip < 1000 || nearestAircraft < 2500) sub.isSnorkeling = false;
    return sub.isSnorkeling ? { capKt: 6 } : {};
  }
  drain();
  if ((sub.battery ?? 0) < 0.3 && nearestShip >= 1000 && nearestAircraft >= 2500) {
    sub.isSnorkeling = true;
    return { capKt: 6 };
  }
  return (sub.battery ?? 0) <= 0.02 ? { capKt: 3 } : {};
}

/** Depth charges per pattern: K-guns and stern racks (US 1942: 5; later wartime and 1950s: 7). */
export function depthChargePattern(era: Era): number {
  return era === 'era1' ? 5 : 7;
}

export interface EnemyAswWeapon {
  kind: 'rbu' | 'dc';
  label: string;
  /** Engagement range in map units. */
  range: number;
  rounds: number;
  cooldown: number;
}

/**
 * Anti-submarine weapon of an enemy surface ship: IJN Type 95 depth charges (eras 1-2), Soviet
 * BMB depth-charge throwers (era 3), RBU-2500 / RBU-6000 / RBU-1000 rocket launchers (eras 4-5).
 */
export function enemyAswWeapon(ship: Ship, era: Era): EnemyAswWeapon | undefined {
  const t = ship.type;
  if (era === 'era1' || era === 'era2') {
    return t === 'destroyer' || t === 'akizuki' ? { kind: 'dc', label: '九五式爆雷', range: 320, rounds: 0, cooldown: 14 } : undefined;
  }
  if (era === 'era3') {
    return t === 'destroyer' || t === 'sverdlov' ? { kind: 'dc', label: 'BMB-1 深水炸彈拋射器', range: 320, rounds: 0, cooldown: 12 } : undefined;
  }
  if (t === 'riga' || t === 'petya') return { kind: 'rbu', label: 'RBU-2500 反潛火箭', range: gameRangeFromKm(2.5), rounds: 16, cooldown: 30 };
  if (t === 'kashin' || t === 'dd_udaloy' || t === 'cgn_kirov' || t === 'cg_slava' || t === 'cvhg_kiev' || t === 'kynda') {
    return { kind: 'rbu', label: 'RBU-6000 反潛火箭', range: gameRangeFromKm(5.8), rounds: 12, cooldown: 25 };
  }
  if (t === 'dd_sovremenny') return { kind: 'rbu', label: 'RBU-1000 反潛火箭', range: gameRangeFromKm(1), rounds: 6, cooldown: 20 };
  return undefined;
}

/** A WWII boat that is on the surface (transiting, charging or still diving) and can be hit by guns and bombs. */
export function isSurfacedBoat(sub: Ship, era: Era): boolean {
  return Boolean(sub.isSnorkeling) && (era === 'era1' || era === 'era2');
}

/** Passive / active sonobuoy sensitivity against a given boat (multiplies the buoy radius). */
export function sonobuoySensitivity(sub: Ship, era: Era): number {
  const noise = submarineNoise(sub);
  // Era 4 Julie explosive echo-ranging and Jezebel LOFAR; era 5 DIFAR; earlier: simple hydrophones
  const factor = era === 'era4' ? 0.75 + 0.25 * noise : noise * 1.1;
  return Math.max(0.3, Math.min(1.25, factor));
}

/** Ahead-throwing ASW weapon: Hedgehog fires contact-fused bombs; the others are depth-fused. */
export type AheadThrower = 'hedgehog' | 'squid' | 'limbo' | 'bofors375' | 'rbu';

export interface AswFit {
  depthCharges?: boolean;
  aheadThrower?: AheadThrower;
  /** Mk 32 / STWS / L5 324-550 mm lightweight torpedo tubes. */
  svtt?: boolean;
  /** Rocket-delivered homing torpedo: ASROC, the Australian Ikara or the French Malafon. */
  standoff?: 'ASROC' | 'Ikara' | 'Malafon';
  /** Vertical-launch ASROC from Mk 41 cells (in service from 1993). */
  vlAsroc?: boolean;
}

/**
 * Historical anti-submarine fit of each named ship, matched by name. Surface combatants that are
 * not listed keep no ASW weapons (battleships, carriers, cruisers, amphibious ships), with the
 * exceptions noted.
 */
const ASW_FITS: Array<[RegExp, AswFit]> = [
  // ── Era 1-2 USN: depth-charge racks and K-guns; Hedgehog on destroyer escorts. Fletchers at
  //    Samar (Johnston, Hoel) still had no Hedgehog.
  [/Fletcher|Radford|O'Bannon|Johnston|Hoel/, { depthCharges: true }],
  [/Samuel B\. Roberts|DE-\d/, { depthCharges: true, aheadThrower: 'hedgehog' }],
  [/Atlanta \(CL-51\)/, { depthCharges: true }], // early Atlantas carried two stern racks
  // ── Era 1-2 IJN destroyers: Type 95 / Type 2 depth charges
  [/IJN (Kagero|Yukikaze|Akizuki|Shimakaze)/, { depthCharges: true }],
  // ── Era 1-2 Royal Navy / Commonwealth destroyers
  [/Jervis|Arunta|Warramunga|Quilliam|Armada/, { depthCharges: true }],
  // ── Era 3 Korean War
  [/Gearing|Frank Knox/, { depthCharges: true, aheadThrower: 'hedgehog' }],
  [/Skory/, { depthCharges: true }],
  [/Bataan|Cayuga|Cossack/, { depthCharges: true }],
  [/Defender/, { aheadThrower: 'squid', depthCharges: true }], // RN Daring class: one triple Squid
  [/Vampire/, { aheadThrower: 'limbo' }], // the RAN Darings were completed with Limbo in place of Squid
  [/Rotoiti/, { aheadThrower: 'squid' }], // Loch class: two triple Squid
  [/Baekdusan|PC-701/, { depthCharges: true }],
  // ── Era 4 Vietnam: ASROC only on ASW-modernised and new-build ships
  [/Belknap/, { standoff: 'ASROC', svtt: true }], // fired from the Mk 10 Terrier launcher
  [/Charles F\. Adams|DDG-2\b/, { standoff: 'ASROC', svtt: true }],
  [/Forrest Sherman \(DD-931\)/, { aheadThrower: 'hedgehog', depthCharges: true, svtt: true }], // not ASW-modernised
  [/Knox \(FF?G-1052\)/, { standoff: 'ASROC', svtt: true }],
  [/Sheffield \(Type 42|Gloucester|Type 42/, { svtt: true }], // STWS Mk 2
  [/Andromeda/, { aheadThrower: 'limbo' }], // Leander as built: Limbo Mk 10
  [/Iroquois/, { aheadThrower: 'limbo', svtt: true }],
  [/Haruna|Shirane/, { standoff: 'ASROC', svtt: true }],
  [/Takatsuki/, { standoff: 'ASROC', svtt: true, aheadThrower: 'bofors375' }],
  [/Amatsukaze/, { standoff: 'ASROC', svtt: true, aheadThrower: 'hedgehog' }],
  [/D39|D38|HMAS Hobart 荷巴特號|HMAS Perth/, { standoff: 'Ikara', svtt: true }], // RAN Perth class
  // ── Era 5
  [/Ticonderoga \(CG-47\)/, { standoff: 'ASROC', svtt: true }], // CG-47..51 fire ASROC from Mk 26
  [/Virginia|Spruance|Kidd \(DDG-993\)/, { standoff: 'ASROC', svtt: true }],
  [/Oliver Hazard Perry|FFG-7/, { svtt: true }],
  [/Broadsword|Brilliant/, { svtt: true }], // STWS
  [/Tromp|Bremen/, { svtt: true }],
  [/Lütjens|Asagiri|Hatsuyuki/, { standoff: 'ASROC', svtt: true }],
  [/Tourville/, { standoff: 'Malafon', svtt: true }],
  [/Glamorgan/, {}], // County class: ASW by its Wessex helicopter only
];

/** Applies the ship's historical ASW fit; returns false if the ship is not in the table. */
export function applyHistoricalAswFit(ship: Ship): boolean {
  const rule = ASW_FITS.find(([re]) => re.test(ship.name));
  if (!rule) return false;
  const fit = rule[1];
  ship.hasDepthCharges = Boolean(fit.depthCharges);
  ship.hasHedgehog = Boolean(fit.aheadThrower);
  ship.aheadThrower = fit.aheadThrower;
  ship.hasSVTT = Boolean(fit.svtt);
  ship.hasASROC = Boolean(fit.standoff) || Boolean(fit.vlAsroc);
  ship.standoffAswWeapon = fit.vlAsroc ? 'VL-ASROC' : fit.standoff;
  ship.hasVLASROC = Boolean(fit.vlAsroc);
  if (ship.hasDepthCharges && ship.depthChargeCooldown === undefined) ship.depthChargeCooldown = 0;
  if (ship.hasHedgehog && ship.hedgehogCooldown === undefined) ship.hedgehogCooldown = 0;
  return true;
}

/** Ahead-throwing salvo pattern: rounds, contact or depth fuze, per-round damage and blast. */
export const AHEAD_THROWERS: Record<AheadThrower, { label: string; rounds: number; depthFused: boolean; damage: number; blast: number; reload: number; maxRange: number }> = {
  hedgehog: { label: 'Mk 10 / Mk 15 刺蝟砲 (24發觸發引信)', rounds: 24, depthFused: false, damage: 780, blast: 28, reload: 12, maxRange: 290 },
  squid: { label: 'Squid 三管深彈迫擊砲 (深度引信)', rounds: 6, depthFused: true, damage: 900, blast: 55, reload: 14, maxRange: 300 },
  limbo: { label: 'Limbo Mk 10 三管深彈迫擊砲 (深度引信)', rounds: 3, depthFused: true, damage: 1200, blast: 60, reload: 10, maxRange: 420 },
  bofors375: { label: 'Bofors 375mm 四管反潛火箭', rounds: 4, depthFused: true, damage: 1000, blast: 55, reload: 12, maxRange: 560 },
  rbu: { label: 'RBU 反潛火箭', rounds: 12, depthFused: true, damage: 560, blast: 40, reload: 25, maxRange: 1340 },
};

/** Stand-off ASW rockets: each delivers a lightweight homing torpedo by rocket or drone. */
export const STANDOFF_ASW: Record<NonNullable<Ship['standoffAswWeapon']>, { label: string; launcher: string; rangeFactor: number }> = {
  ASROC: { label: 'RUR-5 ASROC 反潛火箭', launcher: 'Mk 16 / Mk 112 八聯裝發射架', rangeFactor: 1 },
  Ikara: { label: 'Ikara 反潛導引飛行器', launcher: 'Ikara 旋轉發射架', rangeFactor: 1.25 },
  Malafon: { label: 'Malafon 反潛滑翔飛彈', launcher: 'Malafon 斜軌發射架', rangeFactor: 1.1 },
  'VL-ASROC': { label: 'RUM-139 VL-ASROC 垂直發射反潛火箭', launcher: 'Mk 41 垂直發射系統', rangeFactor: 1.3 },
};

/** Name of the ship's lightweight torpedo tubes by navy. */
export function svttLabel(ship: Ship): string {
  const n = ship.name;
  if (/^HMS |^HMNZS /.test(n)) return 'STWS Mk 2 艦側魚雷 (Mk 46 / Stingray)';
  if (/Tourville/.test(n)) return 'L5 艦側魚雷';
  if (/^JDS |^JS |Haruna|Shirane|Takatsuki|Amatsukaze|Asagiri|Hatsuyuki/.test(n)) return '68式三聯裝短魚雷發射管';
  return 'Mk 32 SVTT 艦側魚雷';
}

// ── Thermocline ────────────────────────────────────────────────────────────────────────────
// A sharp temperature layer bends sound away: a hull sonar above it hears little of a boat
// below it. Submarine captains went deep under the layer to shake a hunter (well understood by
// 1943, the "afternoon effect" of the Atlantic); the counters were variable-depth and towed
// sonars streamed below the layer, dipping sonars lowered through it, deep-set sonobuoys, and
// later long-range bottom-bounce / convergence-zone paths.

/** How long a boat stays below the layer after the last threat it sensed (s). */
export const LAYER_HOLD_SEC = 25;

/**
 * Updates whether a submerged boat is below the layer: it goes deep when hunted (evading or a
 * hostile ship within ~2 km) and comes back up to periscope / snorkel depth when the area is quiet.
 */
export function updateThermoclineDepth(sub: Ship, dt: number, nearestHostileShip: number): void {
  const surfaced = sub.isSubmerged === false || (sub.diveTimer ?? 0) > 0;
  if (surfaced || sub.isSnorkeling) {
    sub.belowLayer = false;
    sub.layerTimer = 0;
    return;
  }
  if ((sub.evadeTimer ?? 0) > 0 || nearestHostileShip < 500) sub.layerTimer = LAYER_HOLD_SEC;
  else sub.layerTimer = Math.max(0, (sub.layerTimer ?? 0) - dt);
  sub.belowLayer = sub.layerTimer > 0;
}

/** Fraction of a hull sonar's range left against a boat below the layer. */
export function layerFactorForShipSonar(sonar: SonarSuite, hunter: Ship, sub: Ship, hunterIsSub: boolean): number {
  if (!sub.belowLayer) return 1;
  if (hunterIsSub) return hunter.belowLayer ? 1 : 0.5;
  // Towed arrays and variable-depth sonars stream below the layer
  if (/拖曳|VDS|可變深度/.test(sonar.label)) return 1;
  // Low-frequency bow sonars use bottom bounce to reach under the layer
  if (/SQS-26|SQS-53|Polinom/.test(sonar.label)) return 0.75;
  return 0.55;
}

/** Aircraft sensors against a boat below the layer: sighting is lost, dipping sonar goes through. */
export function layerFactorForAircraft(plane: Aircraft, sub: Ship): number {
  if (!sub.belowLayer) return 1;
  if (DIPPING_SONAR[plane.model]) return 1;
  return MAD_MODELS.has(plane.model) ? 0.8 : 0;
}

/** Sonobuoys: early fixed shallow buoys sit above the layer; SSQ-41 and later set to depth. */
export function layerFactorForSonobuoy(sub: Ship, era: Era): number {
  if (!sub.belowLayer) return 1;
  return era === 'era4' || era === 'era5' ? 1 : 0.5;
}

/** True for a surface ship carrying any anti-submarine weapon. */
export function hasAswWeapon(ship: Ship): boolean {
  return Boolean(ship.hasDepthCharges || ship.hasHedgehog || ship.hasASROC || ship.hasSVTT);
}
