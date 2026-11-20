import { GroundUnitType, Ship } from '../../types/game';
import { groundSilhouetteClass } from '../unitPreviewRenderer';

/**
 * Sealift for tank landing ships, from the historical figures: the WWII LST-1 class carried
 * about 20 M4 Shermans on its tank deck plus some 160 troops; the Newport-class LST-1179 carries
 * about 500 tons of vehicles and roughly 400 troops. Vehicle space is counted in M4 Sherman
 * equivalents (≈33 t), so heavy Cold War tanks take more room than light ones.
 */
export interface Lift {
  /** Tank-deck space in Sherman equivalents. */
  deck: number;
  /** Embarked troops (men). */
  troops: number;
}

/** Vehicles per platoon / battery on the map. */
function vehiclesPerUnit(type: GroundUnitType, kind: ReturnType<typeof groundSilhouetteClass>): number {
  if (kind === 'tank') return /m60|m1ip|m1a1|leopard|challenger/.test(type) ? 4 : 5;
  if (kind === 'rocket') return /m270|atacms|scud/.test(type) ? 3 : 4;
  return 4;
}

/** Space one vehicle of this type takes, in Sherman equivalents (weight and footprint). */
function vehicleSize(type: GroundUnitType, kind: ReturnType<typeof groundSilhouetteClass>): number {
  if (kind === 'tank') {
    if (/armor_m3|chaffee|type95|type97|sheridan|ontos|pt76/.test(type)) return 0.6;
    if (/matilda/.test(type)) return 0.8;
    if (/m1a1|m1ip|leopard|challenger/.test(type)) return 1.8;
    if (/m60|t72|t80/.test(type)) return 1.6;
    if (/pershing|patton|m46|m48|centurion|armor_korea|is3|t54|arvn_m41/.test(type)) return /arvn_m41/.test(type) ? 0.8 : 1.4;
    return 1.0; // Sherman / T-34 class
  }
  if (kind === 'carrier') return /lvt|aav|bradley|warrior|marder/.test(type) ? 0.9 : /hmmwv/.test(type) ? 0.3 : 0.6;
  if (kind === 'spg') return /m107|paladin|2s19/.test(type) ? 1.1 : 0.9;
  if (kind === 'rocket') return /scud/.test(type) ? 2.0 : 1.0;
  if (kind === 'air_defense') return /avenger|lav_ad/.test(type) ? 0.4 : /gepard/.test(type) ? 1.4 : 0.7;
  return 0.5;
}

export function unitLift(type: GroundUnitType): Lift {
  const kind = groundSilhouetteClass(type);
  switch (kind) {
    case 'infantry':
    case 'atgm':
      return { deck: 0, troops: 40 };
    case 'mortar':
      return { deck: 0.3, troops: 30 };
    case 'engineer':
      // Seabees with a bulldozer and their trucks
      return { deck: 2, troops: 40 };
    case 'towed':
      // Four guns with their prime movers and crews
      return { deck: 1.6, troops: 30 };
    default:
      return { deck: vehiclesPerUnit(type, kind) * vehicleSize(type, kind), troops: 0 };
  }
}

/** Hold of a tank landing ship, or undefined for craft that still use a plain platoon count. */
export function shipHold(ship: Ship): Lift | undefined {
  if (ship.type !== 'lst') return undefined;
  const newport = /1179|Newport|紐波特/.test(ship.name) || ship.era === 'era4' || ship.era === 'era5';
  return newport ? { deck: 15, troops: 400 } : { deck: 20, troops: 163 };
}

/** Space already taken by the units on board. */
export function holdUsed(types: GroundUnitType[]): Lift {
  const used = { deck: 0, troops: 0 };
  for (const t of types) {
    const l = unitLift(t);
    used.deck += l.deck;
    used.troops += l.troops;
  }
  return used;
}

/** Whether a unit still fits alongside what is already loaded. */
export function fitsInHold(hold: Lift, used: Lift, type: GroundUnitType): boolean {
  const l = unitLift(type);
  return used.deck + l.deck <= hold.deck + 1e-6 && used.troops + l.troops <= hold.troops;
}

export function formatHold(hold: Lift, used: Lift): string {
  return `車輛甲板 ${used.deck.toFixed(1)}/${hold.deck}（M4 當量）· 兵員 ${used.troops}/${hold.troops}`;
}
