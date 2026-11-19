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
const MAD_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['pby', 'af_guardian', 's2', 'p3', 's3a', 'sh2', 'sh60b', 'il38', 'be12', 'ka27']);
/** Helicopters with dipping sonar. */
const DIPPING_SONAR: Partial<Record<AircraftModel, number>> = { sh3f: 8, ka27: 7, uh2: 0, sh60b: 0 };
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
      sub.battery = Math.min(1, battery + 0.02 * dt);
      return { surfaceKt: SURFACE_SPEED[sub.subVariant ?? ''] ?? 17 };
    }
    sub.isSnorkeling = false; // crash dive
    drain();
    return (sub.battery ?? 0) <= 0.02 ? { capKt: 3 } : {};
  }

  if (sub.isSnorkeling) {
    sub.battery = Math.min(1, battery + 0.02 * dt);
    if (sub.battery >= 0.95 || nearestShip < 1000) sub.isSnorkeling = false;
    return sub.isSnorkeling ? { capKt: 6 } : {};
  }
  drain();
  if ((sub.battery ?? 0) < 0.3 && nearestShip >= 1000) {
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
