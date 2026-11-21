import { Era, RequisitionItem } from '../types/game';
import { EscalationTier } from './escalation';
import { groundSilhouetteClass } from './unitPreviewRenderer';
import { isSof } from './sof';

/**
 * War economy: four pools instead of a single command-point currency.
 *
 * - MP 人力值: recruits, the national labour force and industrial manpower
 * - RP 資源值: raw materials — steel, fuel, explosives
 * - PP 政治值: political capital; spent on high-profile assets, lost to casualties and scandal
 * - TP 時間值: training and production time, banked like the others so the player can buy
 *   in bursts instead of tending a queue
 *
 * Income depends on the era (how the nation fought that war) and on the campaign stage (how far
 * it has mobilised for this battle).
 */
export type ResKey = 'mp' | 'rp' | 'pp' | 'tp';
export type Bundle = Record<ResKey, number>;

export const RES_KEYS: ResKey[] = ['mp', 'rp', 'pp', 'tp'];

export const RES_INFO: Record<ResKey, { label: string; name: string; colour: string; hint: string }> = {
  mp: { label: 'MP', name: '人力值', colour: '#81D4FA', hint: '新兵與國家勞動力、工業人力' },
  rp: { label: 'RP', name: '資源值', colour: '#FFCC80', hint: '原物料：鋼鐵、燃油、炸藥' },
  pp: { label: 'PP', name: '政治值', colour: '#CE93D8', hint: '政治支持；傷亡與附帶損害會使其流失' },
  tp: { label: 'TP', name: '時間值', colour: '#A5D6A7', hint: '人員養成與生產製造時間' },
};

export const zero = (): Bundle => ({ mp: 0, rp: 0, pp: 0, tp: 0 });

// ── Income ───────────────────────────────────────────────────────────────

/** Base income per second at 1.0 mobilisation. */
const BASE_INCOME: Bundle = { mp: 5.0, rp: 11.0, pp: 2.5, tp: 7.0 };

/** Extra income per captured island / liberated area per second. */
const ISLAND_INCOME: Bundle = { mp: 0.6, rp: 1.5, pp: 0.4, tp: 0.3 };

/**
 * How each era's war was fought:
 * 1942 Guadalcanal ran on a shoestring (Europe first); 1944–45 was the industrial peak;
 * Korea was a limited war; Vietnam had material plenty and dwindling public support;
 * 1983 is an all-volunteer force with expensive, slow-to-build equipment.
 */
const ERA_MULT: Record<Era, Bundle> = {
  era1: { mp: 1.0, rp: 0.75, pp: 1.2, tp: 1.0 },
  era2: { mp: 1.2, rp: 1.3, pp: 1.1, tp: 1.1 },
  era3: { mp: 1.0, rp: 1.0, pp: 0.9, tp: 1.0 },
  era4: { mp: 1.05, rp: 1.25, pp: 0.75, tp: 1.0 },
  era5: { mp: 0.75, rp: 1.3, pp: 1.0, tp: 0.8 },
};

export const ERA_ECONOMY_NOTE: Record<Era, string> = {
  era1: '「歐洲優先」戰略：原物料吃緊，民心士氣高昂',
  era2: '工業總動員巔峰：物資充沛，兵源充足',
  era3: '有限戰爭：各項資源均衡，政治空間有限',
  era4: '物資充裕但反戰民意升溫：政治值隨戰事拖延持續下滑',
  era5: '募兵制與高科技裝備：人力有限，製造週期長',
};

/** Mobilisation by campaign stage (escalation tier). */
export const MOBILISATION: Record<EscalationTier, { name: string; mult: Bundle }> = {
  0: { name: '平時編制', mult: { mp: 0.8, rp: 0.8, pp: 1.0, tp: 0.8 } },
  1: { name: '部分動員', mult: { mp: 1.0, rp: 1.0, pp: 1.1, tp: 1.0 } },
  2: { name: '擴大動員', mult: { mp: 1.2, rp: 1.25, pp: 1.0, tp: 1.2 } },
  3: { name: '總動員', mult: { mp: 1.4, rp: 1.5, pp: 0.85, tp: 1.35 } },
  4: { name: '復員準備', mult: { mp: 1.15, rp: 1.3, pp: 1.3, tp: 1.15 } },
};

export interface IncomeContext {
  era: Era;
  tier: EscalationTier;
  /** Captured islands / liberated areas. */
  islands: number;
  /** Fully captured islands with a working deep-water port. */
  ports: number;
  /** Friendly field hospitals. */
  hospitals: number;
  /** Seconds since the battle started (Vietnam's political drain). */
  gameTime: number;
}

/** Income per second. */
export function incomeRate(c: IncomeContext): Bundle {
  const era = ERA_MULT[c.era];
  const mob = MOBILISATION[c.tier].mult;
  const out = zero();
  for (const k of RES_KEYS) out[k] = (BASE_INCOME[k] + ISLAND_INCOME[k] * c.islands) * era[k] * mob[k];
  out.rp += c.ports * 1.5; // deep-water ports bring the convoys in
  out.mp += c.hospitals * 0.3; // wounded returned to duty
  // Vietnam: the longer the war, the thinner the political support
  if (c.era === 'era4') out.pp *= Math.max(0.35, 1 - c.gameTime / 3000);
  return out;
}

export const START_STOCK: Bundle = { mp: 320, rp: 720, pp: 160, tp: 420 };

// ── Prices ───────────────────────────────────────────────────────────────

interface Profile {
  mp: number;
  rp: number;
  pp: number;
  /** TP per unit of base cost. */
  tp: number;
}

const PROFILE: Record<string, Profile> = {
  infantry: { mp: 0.6, rp: 0.3, pp: 0.1, tp: 0.25 },
  vehicle: { mp: 0.2, rp: 0.7, pp: 0.1, tp: 0.3 },
  ship: { mp: 0.15, rp: 0.7, pp: 0.15, tp: 0.45 },
  capital: { mp: 0.15, rp: 0.55, pp: 0.3, tp: 0.55 },
  landing: { mp: 0.2, rp: 0.75, pp: 0.05, tp: 0.3 },
  aircraft: { mp: 0.25, rp: 0.65, pp: 0.1, tp: 0.4 },
  installation: { mp: 0.4, rp: 0.6, pp: 0, tp: 0.3 },
  nuclear: { mp: 0, rp: 0.1, pp: 0.9, tp: 0.1 },
  // Elite teams: few men, long selection and training, politically sensitive missions
  sof: { mp: 0.3, rp: 0.2, pp: 0.5, tp: 0.7 },
  // Strategic bombers, AWACS and the deterrent: national assets, committed by Washington
  strategic: { mp: 0.15, rp: 0.55, pp: 0.3, tp: 0.5 },
  deterrent: { mp: 0.1, rp: 0.45, pp: 0.45, tp: 0.6 },
};

const STRATEGIC_TAGS = new Set(['air_b52', 'heavy_bomber_pool', 'air_f111', 'air_e3a', 'air_b17_late']);

const CAPITAL = /^(carrier|cv63|cvn|battleship|bb_|essex|cve|lph|kongo|iowa)/;
const LANDING = /^(lst|lcvp|lcm|lcac|lsm|lpd|lvt)/;

function profileOf(item: RequisitionItem): Profile {
  const tag = item.typeTag;
  if (/nuclear|atacms_nuc/.test(tag) || /nuclear|nuke/.test(item.unitType ?? '')) return PROFILE.nuclear;
  if (tag === 'ohio_ssbn') return PROFILE.deterrent;
  if (STRATEGIC_TAGS.has(tag)) return PROFILE.strategic;
  if (item.unitType && isSof(item.unitType)) return PROFILE.sof;
  if (item.category === 'ships') return CAPITAL.test(tag) ? PROFILE.capital : LANDING.test(tag) ? PROFILE.landing : PROFILE.ship;
  if (item.category === 'aircraft') return PROFILE.aircraft;
  if (item.category === 'installations') return PROFILE.installation;
  const kind = groundSilhouetteClass(item.unitType ?? tag);
  return kind === 'infantry' || kind === 'atgm' || kind === 'mortar' || kind === 'engineer' ? PROFILE.infantry : PROFILE.vehicle;
}

const round5 = (v: number) => Math.round(v / 5) * 5;

function fromProfile(base: number, p: Profile): Bundle {
  return { mp: round5(base * p.mp), rp: round5(base * p.rp), pp: round5(base * p.pp), tp: round5(base * p.tp) };
}

const costCache = new Map<string, Bundle>();

/** Price of a requisition, from its old single-currency cost and what kind of asset it is. */
export function costOf(item: RequisitionItem): Bundle {
  const key = `${item.id}|${item.cost}|${item.unitType ?? ''}`;
  let c = costCache.get(key);
  if (!c) {
    c = fromProfile(item.cost, profileOf(item));
    costCache.set(key, c);
  }
  return c;
}

/** Political authorisation for nuclear release (scaled from the old CP figure). */
export function nuclearCost(oldCp: number): Bundle {
  return { mp: 0, rp: round5(oldCp * 0.08), pp: round5(oldCp * 0.25), tp: round5(oldCp * 0.05) };
}

// ── Rewards and penalties ────────────────────────────────────────────────

/** What an event is worth, given its old CP figure. */
export type AwardKind = 'kill' | 'capture' | 'pow' | 'logistics';

const AWARD_SPLIT: Record<AwardKind, Bundle> = {
  // Victories make headlines and leave salvage
  kill: { mp: 0.15, rp: 0.55, pp: 0.3, tp: 0 },
  // Ground taken: local labour, captured stores, a communiqué
  capture: { mp: 0.25, rp: 0.45, pp: 0.3, tp: 0 },
  // Prisoners: intelligence, labour and a propaganda win
  pow: { mp: 0.3, rp: 0.1, pp: 0.6, tp: 0 },
  logistics: { mp: 0, rp: 1, pp: 0, tp: 0 },
};

export function award(oldCp: number, kind: AwardKind): Bundle {
  const s = AWARD_SPLIT[kind];
  return { mp: oldCp * s.mp, rp: oldCp * s.rp, pp: oldCp * s.pp, tp: oldCp * s.tp };
}

// ── The pools ────────────────────────────────────────────────────────────

export class Economy {
  stock: Bundle = { ...START_STOCK };
  earned: Bundle = { ...START_STOCK };
  spent: Bundle = zero();
  /** Last computed income per second (for the HUD). */
  rate: Bundle = zero();

  add(b: Bundle): void {
    for (const k of RES_KEYS) {
      this.stock[k] += b[k];
      if (b[k] > 0) this.earned[k] += b[k];
    }
  }

  /** Lose resources (penalties); pools never go below zero. */
  lose(b: Partial<Bundle>): void {
    for (const k of RES_KEYS) this.stock[k] = Math.max(0, this.stock[k] - (b[k] ?? 0));
  }

  canAfford(b: Bundle): boolean {
    return RES_KEYS.every((k) => this.stock[k] + 1e-6 >= b[k]);
  }

  /** Resources still missing for a purchase. */
  shortfall(b: Bundle): Partial<Bundle> {
    const out: Partial<Bundle> = {};
    for (const k of RES_KEYS) if (this.stock[k] < b[k]) out[k] = Math.ceil(b[k] - this.stock[k]);
    return out;
  }

  spend(b: Bundle): boolean {
    if (!this.canAfford(b)) return false;
    for (const k of RES_KEYS) {
      this.stock[k] -= b[k];
      this.spent[k] += b[k];
    }
    return true;
  }

  refund(b: Bundle): void {
    for (const k of RES_KEYS) {
      this.stock[k] += b[k];
      this.spent[k] -= b[k];
    }
  }

  tick(rate: Bundle, dt: number): void {
    this.rate = rate;
    for (const k of RES_KEYS) {
      this.stock[k] += rate[k] * dt;
      this.earned[k] += rate[k] * dt;
    }
  }
}

/** "MP 70 · RP 245 · PP 35 · TP 105", skipping zeroes. */
export function formatBundle(b: Partial<Bundle>): string {
  return RES_KEYS.filter((k) => (b[k] ?? 0) > 0.5)
    .map((k) => `${RES_INFO[k].label} ${Math.round(b[k] ?? 0)}`)
    .join(' · ');
}

/** "未達 RP 120 · TP 40" */
export function formatShortfall(s: Partial<Bundle>): string {
  return formatBundle(s);
}
