import { Aircraft, AircraftModel, AircraftPayloadType, Era } from '../types/game';

/**
 * Historical fixed armament and air-to-ground ordnance of every airframe:
 *
 *  - the gun battery (calibre, number of guns, rounds carried), which sets the damage of each
 *    hit, how many rounds a burst uses, how far the guns reach and what they can penetrate;
 *  - the rocket each airframe fired (HVAR, RP-3, RS-82, 2.75" FFAR, Zuni, SNEB, S-5, S-8 ...);
 *  - the weight of each bomb in a loadout and how many fall in one release;
 *  - a warhead class per store, which decides how well it works against armour, bunkers, soft
 *    sites, ships and aircraft.
 */

// ── Guns ──────────────────────────────────────────────────────────────────────────────────────

export type GunCalibre = '7.62' | '7.7' | '12.7' | '20' | '23' | '27' | '30' | '30AP' | '37';

interface GunGroup {
  cal: GunCalibre;
  guns: number;
  /** Total rounds for this group. */
  rounds: number;
  /** Rotary (Gatling) cannon: one barrel group, very high rate of fire. */
  rotary?: boolean;
}

export interface GunBattery {
  label: string;
  groups: GunGroup[];
  /** Guns in the nose (converging fire) rather than spread along the wings. */
  nose: boolean;
}

/** Damage of one round hitting, by calibre. */
export const CALIBRE_DAMAGE: Record<GunCalibre, number> = {
  '7.62': 9, '7.7': 9, '12.7': 16, '20': 30, '23': 34, '27': 40, '30': 50, '30AP': 85, '37': 70,
};

/** Effective firing range (map units) by calibre. */
const CALIBRE_RANGE: Record<GunCalibre, number> = {
  '7.62': 300, '7.7': 300, '12.7': 340, '20': 380, '23': 400, '27': 420, '30': 440, '30AP': 650, '37': 420,
};

/** Fraction of damage that gets through tank armour. */
const CALIBRE_VS_ARMOUR: Record<GunCalibre, number> = {
  '7.62': 0.04, '7.7': 0.04, '12.7': 0.1, '20': 0.25, '23': 0.3, '27': 0.4, '30': 0.5, '30AP': 0.9, '37': 0.55,
};

const g = (cal: GunCalibre, guns: number, rounds: number, rotary = false): GunGroup => ({ cal, guns, rounds, rotary });
const wing = (label: string, ...groups: GunGroup[]): GunBattery => ({ label, groups, nose: false });
const nose = (label: string, ...groups: GunGroup[]): GunBattery => ({ label, groups, nose: true });

const M2_6 = (rounds: number) => wing('6x .50 M2 白朗寧', g('12.7', 6, rounds));
const M61 = (rounds: number) => nose('M61A1 火神 20mm 旋轉機砲', g('20', 6, rounds, true));

/** Fixed forward-firing guns of each airframe; null = no gun (missile-only, ASW, transports). */
export const AIRCRAFT_GUNS: Record<AircraftModel, GunBattery | null> = {
  // WWII US Navy / USAAF
  f4f: M2_6(1440), // F4F-4: 240 rounds per gun
  sbd: nose('2x .50 M2 機首機槍', g('12.7', 2, 720)),
  tbd: nose('1x .30 機首機槍', g('7.62', 1, 500)),
  os2u: nose('1x .30 機首機槍', g('7.62', 1, 500)),
  sc1: wing('2x .50 M2', g('12.7', 2, 800)),
  f6f: M2_6(2400),
  f4u: M2_6(2350),
  f8f: wing('4x 20mm M3 機砲', g('20', 4, 820)), // F8F-1B
  sb2c: wing('2x 20mm M2 機砲', g('20', 2, 800)),
  tbf: wing('2x .50 M2 翼砲', g('12.7', 2, 600)), // TBM-3
  pby: nose('.30 / .50 機首機槍', g('12.7', 1, 600)),
  b17: nose('2x .50 下巴炮塔', g('12.7', 2, 730)), // forward-firing chin turret
  b17_late: nose('2x .50 下巴炮塔', g('12.7', 2, 730)),
  b24: nose('2x .50 機首炮塔', g('12.7', 2, 760)),
  b25: nose('機首 .50 機槍群', g('12.7', 4, 1600)),
  b29: nose('2x .50 前上炮塔', g('12.7', 2, 1000)),
  p36a: nose('1x .50 + 1x .30', g('12.7', 1, 200), g('7.62', 1, 500)),
  p39d: nose('37mm M4 機砲 + 2x .50 + 4x .30', g('37', 1, 30), g('12.7', 2, 400), g('7.62', 4, 1000)),
  p40: M2_6(1410), // P-40E
  p38: nose('20mm 機砲 + 4x .50 機首集束', g('20', 1, 150), g('12.7', 4, 2000)),
  p47: wing('8x .50 M2 白朗寧', g('12.7', 8, 3400)),
  p51: M2_6(1880),
  a20: nose('6x .50 機首機槍 (A-20G)', g('12.7', 6, 2100)),
  a26: nose('6x/8x .50 機首機槍', g('12.7', 8, 3200)),
  c47: null,
  ac47: wing('3x GAU-2 7.62mm 米尼岡', g('7.62', 3, 21000, true)),
  // WWII Commonwealth
  hurricane: wing('8x .303 白朗寧', g('7.7', 8, 2672)),
  spitfire_v: wing('2x 20mm 西斯帕諾 + 4x .303', g('20', 2, 120), g('7.7', 4, 1400)),
  spitfire_xiv: wing('2x 20mm 西斯帕諾 + 2x .50', g('20', 2, 240), g('12.7', 2, 500)),
  seafire: wing('2x 20mm 西斯帕諾 + 4x .303', g('20', 2, 240), g('7.7', 4, 1400)),
  boomerang: wing('2x 20mm 西斯帕諾 + 4x .303', g('20', 2, 120), g('7.7', 4, 1400)),
  tempest: wing('4x 20mm 西斯帕諾 Mk V', g('20', 4, 800)),
  beaufighter: nose('4x 20mm 西斯帕諾 + 6x .303', g('20', 4, 960), g('7.7', 6, 2100)),
  mosquito: nose('4x 20mm 西斯帕諾 + 4x .303 機首', g('20', 4, 600), g('7.7', 4, 2000)),
  beaufort: nose('機首 .303 機槍', g('7.7', 2, 1000)),
  lancaster: nose('2x .303 機首炮塔', g('7.7', 2, 2000)),
  swordfish: nose('1x .303 機首機槍', g('7.7', 1, 600)),
  barracuda: null, // only twin Vickers K in the rear cockpit
  // Imperial Japan
  zero: wing('2x 20mm 九九式 + 2x 7.7mm', g('20', 2, 120), g('7.7', 2, 1360)),
  zero_a6m2: wing('2x 20mm 九九式一號 + 2x 7.7mm', g('20', 2, 120), g('7.7', 2, 1360)),
  zero_a6m5: wing('2x 20mm 九九式二號 + 2x 7.7mm', g('20', 2, 250), g('7.7', 2, 1360)),
  rufe: wing('2x 20mm + 2x 7.7mm', g('20', 2, 120), g('7.7', 2, 1000)),
  ki61: nose('2x 20mm Ho-5 + 2x 12.7mm', g('20', 2, 240), g('12.7', 2, 500)),
  ki84: nose('2x 20mm Ho-5 + 2x 12.7mm Ho-103', g('20', 2, 300), g('12.7', 2, 700)),
  george: wing('4x 20mm 九九式二號', g('20', 4, 900)), // N1K2-J
  val: nose('2x 7.7mm 九七式', g('7.7', 2, 1200)),
  judy: nose('2x 7.7mm', g('7.7', 2, 800)),
  kate: null, // only a rear-cockpit 7.7 mm
  jill: nose('1x 7.7mm', g('7.7', 1, 500)),
  g4m: nose('20mm 尾砲 / 7.7mm 機首', g('7.7', 1, 600)),
  ohka: null,
  kamikaze_zero: wing('2x 20mm + 2x 7.7mm', g('20', 2, 120), g('7.7', 2, 1360)),
  kamikaze_judy: nose('2x 7.7mm', g('7.7', 2, 800)),
  // Korean War
  f86: nose('6x .50 M3 (機首)', g('12.7', 6, 1800)),
  f84: nose('6x .50 M3', g('12.7', 6, 1800)),
  f9f: nose('4x 20mm M2 機砲', g('20', 4, 760)),
  f2h: nose('4x 20mm M2 機砲', g('20', 4, 880)),
  ad1: wing('2x/4x 20mm M3 機砲', g('20', 4, 800)),
  f4u4: M2_6(2400),
  af_guardian: null,
  ad3w: null,
  ho3s1: null,
  meteor: nose('4x 20mm 西斯帕諾 Mk V', g('20', 4, 780)),
  sea_fury: wing('4x 20mm 西斯帕諾 Mk V', g('20', 4, 580)),
  f82: nose('6x .50 M3 中翼', g('12.7', 6, 2400)),
  rokaf_p51: M2_6(1880),
  firefly_as5: wing('4x 20mm 西斯帕諾', g('20', 4, 640)),
  mig15: nose('1x 37mm N-37 + 2x 23mm NR-23', g('37', 1, 40), g('23', 2, 160)),
  tu14: nose('2x 23mm NR-23', g('23', 2, 170)),
  yak9: nose('1x 20mm ShVAK + 1x 12.7mm UBS', g('20', 1, 120), g('12.7', 1, 200)),
  il10: wing('2x 23mm NS-23 + 2x 7.62mm ShKAS', g('23', 2, 300), g('7.62', 2, 1500)),
  po2: null,
  // Vietnam War
  f8: nose('4x 20mm Colt Mk 12', g('20', 4, 500)),
  f4b: null, // no internal gun
  f4j: null,
  f4e: M61(640),
  f105: M61(1028),
  f100: nose('4x 20mm M39', g('20', 4, 800)),
  a4: nose('2x 20mm Colt Mk 12', g('20', 2, 400)),
  a6a: null,
  a6b_weasel: null,
  a7: M61(1000), // A-7E
  a1h: wing('4x 20mm M3 機砲', g('20', 4, 800)),
  a37b: nose('GAU-2B/A 7.62mm 米尼岡', g('7.62', 1, 1500, true)),
  f5a: nose('2x 20mm M39', g('20', 2, 560)),
  e1: null,
  s2: null,
  c1: null,
  p3: null,
  b52: null, // tail guns only
  ov10: wing('4x 7.62mm M60C', g('7.62', 4, 2000)),
  uh1: wing('2x M60 艙門機槍', g('7.62', 2, 3000)),
  uh2: null,
  sh2: null,
  ah1: nose('M134 米尼岡 + M129 40mm 榴彈 (TAT-102)', g('7.62', 1, 4000, true)),
  ch46: wing('2x .50 艙門機槍', g('12.7', 2, 800)),
  mig17: nose('1x 37mm N-37D + 2x 23mm NR-23', g('37', 1, 40), g('23', 2, 160)),
  mig19: wing('3x 30mm NR-30', g('30', 3, 210)),
  mig21: nose('GSh-23L 雙管 23mm (MiG-21PFM 吊艙 / MF 內建)', g('23', 2, 200)),
  su7: wing('2x 30mm NR-30', g('30', 2, 160)),
  il28: nose('2x 23mm NR-23', g('23', 2, 200)),
  tu16: nose('23mm AM-23 機首砲', g('23', 1, 100)),
  // Allied Cold War
  f104g: M61(725),
  mirage3: nose('2x 30mm DEFA 552', g('30', 2, 250)),
  hunter_fga9: nose('4x 30mm ADEN', g('30', 4, 600)),
  f4f_phantom: null,
  tornado_gr1: nose('2x 27mm 毛瑟 BK-27', g('27', 2, 360)),
  tornado_ids: nose('2x 27mm 毛瑟 BK-27', g('27', 2, 360)),
  tornado_adv: nose('1x 27mm 毛瑟 BK-27', g('27', 1, 180)),
  mirage2000: nose('2x 30mm DEFA 554', g('30', 2, 250)),
  jaguar_gr1: nose('2x 30mm ADEN', g('30', 2, 300)),
  viggen_ja37: nose('1x 30mm 奧利岡 KCA', g('30', 1, 150)),
  canberra: null,
  buccaneer: null,
  sea_harrier: wing('2x 30mm ADEN 吊艙', g('30', 2, 260)),
  // Late Cold War
  f14a: M61(675),
  f15a: M61(940),
  f16a: M61(511),
  fa18a: M61(578),
  f111: null, // F-111F carried Pave Tack in the bay instead of the M61
  av8b: nose('GAU-12/U 25mm 吊艙', g('27', 5, 300, true)),
  a10a: nose('GAU-8/A 復仇者 30mm 貧鈾穿甲', g('30AP', 7, 1174, true)),
  a6e: null,
  ea6b: null,
  s3a: null,
  e2c: null,
  c2a: null,
  e3a: null,
  c130: null,
  sh3f: null,
  ch53: wing('2x .50 艙門機槍', g('12.7', 2, 800)),
  sh60b: wing('M60D 艙門機槍', g('7.62', 1, 500)),
  ah64a: nose('M230 30mm 鏈砲', g('30', 1, 1200)),
  ah1w: nose('M197 20mm 三管機砲', g('20', 3, 750, true)),
  mig29a: nose('GSh-30-1 30mm', g('30', 1, 150)),
  su27: nose('GSh-30-1 30mm', g('30', 1, 150)),
  su25: nose('GSh-30-2 雙管 30mm', g('30', 2, 250)),
  yak38: wing('GSh-23 吊艙', g('23', 2, 250)),
  tu95: null,
  tu22m3: null,
  a50: null,
  il38: null,
  mig23: nose('GSh-23L 雙管 23mm', g('23', 2, 200)),
  mig31: nose('GSh-6-23 六管 23mm', g('23', 6, 260, true)),
  be12: null,
  ka27: null,
  mi24: nose('YakB-12.7 四管機槍', g('12.7', 4, 1470, true)),
};

export function getGunBattery(model: AircraftModel): GunBattery | null {
  return AIRCRAFT_GUNS[model];
}

/** Total rounds carried for the forward guns. */
export function getGunRounds(model: AircraftModel): number {
  return AIRCRAFT_GUNS[model]?.groups.reduce((a, gr) => a + gr.rounds, 0) ?? 0;
}

/** Rounds one firing pass uses: a ~0.3 s burst from every gun (Gatlings fire far faster). */
export function roundsPerBurst(battery: GunBattery): number {
  return battery.groups.reduce((a, gr) => a + (gr.rotary ? (gr.cal === '7.62' ? 40 : 30) : gr.guns * (gr.cal === '37' ? 1 : 4)), 0);
}

export interface BulletSpec {
  cal: GunCalibre;
  damage: number;
  range: number;
  vsArmour: number;
  /** Projectiles drawn for this group in one burst. */
  tracers: number;
  rotary: boolean;
}

/** The bullets one burst sends out, group by group. */
export function burstBullets(battery: GunBattery): BulletSpec[] {
  return battery.groups.map((gr) => ({
    cal: gr.cal,
    damage: CALIBRE_DAMAGE[gr.cal],
    range: CALIBRE_RANGE[gr.cal],
    vsArmour: CALIBRE_VS_ARMOUR[gr.cal],
    tracers: gr.rotary ? (gr.cal === '30AP' ? 12 : 8) : Math.min(8, gr.guns),
    rotary: Boolean(gr.rotary),
  }));
}

/** Penetration of a gun round against armour, by its damage class (used on the projectile). */
export function calibreVsArmour(cal: GunCalibre | undefined): number {
  return cal ? CALIBRE_VS_ARMOUR[cal] : 0.1;
}

// ── Rockets ───────────────────────────────────────────────────────────────────────────────────

export type RocketKind = 'hvar' | 'rp3' | 'rs82' | 'type3' | 'ffar' | 'zuni' | 'sneb' | 's5' | 's8' | 's24' | 'hydra';

export const ROCKETS: Record<RocketKind, { label: string; damage: number; blast: number; vsArmour: number }> = {
  hvar: { label: '5" HVAR 高速航空火箭', damage: 230, blast: 26, vsArmour: 0.55 },
  rp3: { label: 'RP-3 60磅半穿甲火箭', damage: 300, blast: 28, vsArmour: 0.6 },
  rs82: { label: 'RS-82 火箭', damage: 110, blast: 18, vsArmour: 0.2 },
  type3: { label: '三式六番二七號 火箭', damage: 200, blast: 26, vsArmour: 0.3 },
  ffar: { label: '2.75" FFAR (LAU-3 莢艙)', damage: 120, blast: 20, vsArmour: 0.35 },
  zuni: { label: '5" Zuni (LAU-10 莢艙)', damage: 250, blast: 28, vsArmour: 0.55 },
  sneb: { label: 'SNEB 68mm 火箭莢艙', damage: 110, blast: 18, vsArmour: 0.45 },
  s5: { label: 'S-5 57mm (UB-16 莢艙)', damage: 90, blast: 16, vsArmour: 0.3 },
  s8: { label: 'S-8 80mm (B-8M1 莢艙)', damage: 170, blast: 22, vsArmour: 0.6 },
  s24: { label: 'S-24 240mm 重型火箭', damage: 900, blast: 48, vsArmour: 0.7 },
  hydra: { label: 'Hydra 70 (2.75") 火箭', damage: 140, blast: 22, vsArmour: 0.45 },
};

const BRITISH_RP3 = new Set<AircraftModel>(['tempest', 'mosquito', 'beaufighter', 'swordfish', 'sea_fury', 'firefly_as5', 'meteor', 'barracuda']);

/** Rocket each airframe fired, by era. */
export function rocketKind(model: AircraftModel, era: Era): RocketKind {
  if (BRITISH_RP3.has(model)) return 'rp3';
  if (model === 'hunter_fga9' || model === 'jaguar_gr1' || model === 'mirage3' || model === 'tornado_ids') return 'sneb';
  if (model === 'il10' || model === 'yak9' || model === 'po2') return 'rs82';
  if (model === 'zero' || model === 'zero_a6m2' || model === 'zero_a6m5' || model === 'ki84' || model === 'george' || model === 'val' || model === 'judy') return 'type3';
  if (model === 'su25') return 's8';
  if (model === 'mi24') return era === 'era5' ? 's8' : 's5';
  if (model === 'su7' || model === 'mig17' || model === 'mig19' || model === 'mig21' || model === 'mig23' || model === 'yak38') return 's5';
  if (model === 'f8' || model === 'a4' || model === 'a7') return 'zuni';
  if (era === 'era5') return 'hydra';
  if (era === 'era4') return 'ffar';
  return 'hvar';
}

/** Rockets fired in one salvo for a rocket loadout. */
export function rocketsPerSalvo(rounds: number, payload: AircraftPayloadType): number {
  if (payload === 'mixed_bombs_rockets') return 4;
  return Math.max(2, Math.min(24, rounds));
}

// ── Bombs ─────────────────────────────────────────────────────────────────────────────────────

export interface BombSpec {
  label: string;
  /** Weight of each bomb (lb). */
  weightLb: number;
  damage: number;
  blast: number;
  armourPiercing?: boolean;
}

/** Damage and blast of a free-fall bomb by weight: roughly with the charge, blast with its cube root. */
function bombOf(label: string, weightLb: number, armourPiercing = false): BombSpec {
  return {
    label,
    weightLb,
    damage: Math.round(1650 * Math.pow(weightLb / 1000, 0.85)),
    blast: Math.round(58 * Math.cbrt(weightLb / 1000)),
    armourPiercing,
  };
}

/** The bomb of a bomb loadout as carried by a given airframe (Japanese and Soviet weights differ). */
export function bombSpec(model: AircraftModel, payload: AircraftPayloadType): BombSpec {
  // Imperial Japanese Navy: Val 250 kg, Judy 500 kg, Kate 800 kg Type 99 No. 80 AP
  if (model === 'val' || model === 'zero_a6m5' || model === 'zero' || model === 'zero_a6m2' || model === 'ki84' || model === 'george') return bombOf('九九式 25番 (250kg) 通常爆彈', 551);
  if (model === 'judy' || model === 'kamikaze_judy') return bombOf('二式 50番 (500kg) 通常爆彈', 1102);
  if (model === 'kate' || model === 'jill') return bombOf('九九式 80番 (800kg) 穿甲爆彈', 1764, true);
  if (model === 'g4m') return bombOf('九八式 25番 陸用爆彈', 551);
  // Soviet
  if (model === 'il10' || model === 'po2') return bombOf('FAB-100 航彈', 220);
  if (model === 'su7' || model === 'mig17' || model === 'mig21' || model === 'mig23') return bombOf('FAB-250 航彈', 551);
  if (model === 'su25') return bombOf('FAB-500 航彈', 1102);
  if (model === 'il28' || model === 'tu14') return bombOf('FAB-500 航彈', 1102);
  switch (payload) {
    case 'bomb_500': return bombOf('AN-M64 500lb 通用炸彈', 500);
    case 'bombs_dual_500': return bombOf('AN-M64 500lb 通用炸彈', 500);
    case 'bombs_quad_500': return bombOf('AN-M64 500lb 通用炸彈', 500);
    case 'bomb_1000': return bombOf('AN-M65 1000lb 通用炸彈', 1000);
    case 'bombs_dual_1000': return bombOf('AN-M65 1000lb 通用炸彈', 1000);
    case 'bomb_1600': return bombOf('AN-Mk 1 1600lb 穿甲彈', 1600, true);
    case 'bomb_1600_ap': return bombOf('AN-Mk 1 1600lb 穿甲彈', 1600, true);
    case 'bomb_2000': return bombOf('AN-M66 / Mk 84 2000lb 炸彈', 2000);
    case 'bombs_carpet_250': return bombOf('AN-M57 250lb 通用炸彈', 250);
    case 'bombs_snakeye_retarded': return bombOf('Mk 82 蛇眼 500lb 減速炸彈', 500);
    case 'mer_iron_bombs': return bombOf('Mk 82 500lb 低阻炸彈', 500);
    case 'mixed_bombs_rockets': return bombOf('500lb 通用炸彈', 500);
    default: return bombOf('1000lb 通用炸彈', 1000);
  }
}

/** Bombs that fall in one release of a dive / glide attack. */
export function bombsPerRelease(payload: AircraftPayloadType, rounds: number): number {
  switch (payload) {
    case 'bomb_500':
    case 'bomb_1000':
    case 'bomb_1600':
    case 'bomb_2000':
    case 'bombs_dual_500':
      return Math.max(1, Math.min(4, rounds));
    default:
      return 1;
  }
}

// ── Warheads vs targets ───────────────────────────────────────────────────────────────────────

/**
 * How a warhead works against each kind of target:
 *  he         blast/fragmentation (bombs, rockets): good on soft targets, poor on tanks
 *  ap         armour-piercing / semi-AP: penetrates decks and bunkers
 *  heat       shaped charge (Maverick, Hellfire, TOW, Bullpup-class): kills tanks, small blast
 *  cluster    CBU / Rockeye submunitions: shreds SAM sites, radars, trucks and infantry
 *  incendiary napalm: infantry and dug-in troops, almost useless on ships and armour
 *  gun        cannon / machine-gun fire (penetration set by calibre)
 */
export type Warhead = 'he' | 'ap' | 'heat' | 'cluster' | 'incendiary' | 'gun';

export function warheadVsGround(warhead: Warhead | undefined, armoured: boolean, vsArmour?: number): number {
  switch (warhead) {
    case 'heat': return armoured ? 1.8 : 0.8;
    case 'cluster': return armoured ? 0.9 : 1.4;
    case 'incendiary': return armoured ? 0.5 : 1.4;
    case 'ap': return armoured ? 1.1 : 0.8;
    case 'gun': return armoured ? (vsArmour ?? 0.1) : 1;
    case 'he': return armoured ? 0.65 : 1;
    default: return 1;
  }
}

export function warheadVsInstallation(warhead: Warhead | undefined, hardened: boolean): number {
  switch (warhead) {
    case 'ap': return hardened ? 1.35 : 0.9;
    case 'heat': return hardened ? 0.7 : 1.1;
    case 'cluster': return hardened ? 0.45 : 1.5;
    case 'incendiary': return hardened ? 0.4 : 1.2;
    case 'gun': return hardened ? 0.15 : 0.5;
    default: return 1;
  }
}

export function warheadVsShip(warhead: Warhead | undefined): number {
  switch (warhead) {
    case 'incendiary': return 0.35;
    case 'cluster': return 0.5;
    case 'heat': return 0.85;
    default: return 1;
  }
}

/** The warhead class of a store. */
export function payloadWarhead(payload: AircraftPayloadType | undefined): Warhead {
  switch (payload) {
    case 'bomb_1600':
    case 'bomb_1600_ap':
    case 'tiny_tim_rocket':
    case 'rgm84_harpoon':
      return 'ap';
    case 'agm65_maverick':
    case 'hellfire_missiles':
    case 'tow_missiles':
      return 'heat';
    case 'cbu_cluster_bombs':
      return 'cluster';
    case 'napalm_canister':
    case 'blu27_napalm':
      return 'incendiary';
    default:
      return 'he';
  }
}

/** Initialises an aircraft's gun ammunition from its historical battery (once per sortie). */
export function applyHistoricalGuns(plane: Aircraft): void {
  if (plane.gunsInitialised) return;
  plane.gunsInitialised = true;
  const rounds = getGunRounds(plane.model);
  plane.gunAmmo = rounds;
  plane.maxGunAmmo = rounds;
  if (plane.payloadType === 'clean_guns') {
    plane.ammoRemaining = rounds;
    plane.maxAmmo = rounds;
  }
}
