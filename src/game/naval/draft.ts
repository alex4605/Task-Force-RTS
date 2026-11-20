import { Ship, ShipType } from '../../types/game';

/**
 * Navigational draft (m) of every ship type, deep load, including bow sonar domes where they
 * project below the keel (Spruance, Knox, Ticonderoga). Hovercraft (LCAC) float over anything.
 */
export const SHIP_DRAFT_M: Record<ShipType, number> = {
  carrier: 8.5, // Yorktown / Essex class
  cve: 6.3, // Casablanca class
  cv63: 11.4, // Kitty Hawk
  cvn: 11.3, // Nimitz
  cvhg_kiev: 10,
  battleship: 10.4, // North Carolina / Iowa / KGV
  bb_iowa_mod: 11.6,
  kongo: 9.7,
  cruiser: 7.3,
  chokai: 6.9,
  sverdlov: 7.3,
  kynda: 5.3,
  cg: 8.8, // Belknap with SQS-26 dome
  cg_tico: 10.2, // with SQS-53 dome
  cg_virginia: 9.6,
  cgn_kirov: 9.1,
  cg_slava: 7.6,
  destroyer: 5.3, // Fletcher / Gearing / Kagero
  akizuki: 4.2,
  dd: 6.1, // Forrest Sherman
  ddg: 6.1, // Charles F. Adams
  dd_spruance: 8.8,
  ddg_kidd: 9.6,
  kashin: 4.6,
  dd_sovremenny: 5.9,
  dd_udaloy: 7.6,
  ffg: 7.6, // Knox with SQS-26
  ffg_ohp: 6.7,
  riga: 3.2,
  petya: 3.0,
  submarine: 5.1, // surfaced: Gato / Type VII / I-boat
  foxtrot: 5.1,
  ssn_la: 9.4,
  ssgn_oscar: 9.0,
  patrol_boat: 1.7, // P-4 / P-6 torpedo boats, PT boats
  komar_ptg: 1.3,
  osa: 2.0,
  pbr: 0.6, // fibreglass river boat with water jets
  lcvp: 0.9,
  lcm8: 1.5,
  lcac: 0,
  lst: 2.4, // beaching trim
  lsm_r: 2.2,
  lpd: 6.7,
  lph: 8.2,
  lha_tarawa: 7.9,
};

/** Keel clearance a ship keeps under way (m). */
export const KEEL_CLEARANCE_M = 0.6;

/** Water depth a ship needs to move through. */
export function requiredDepth(ship: Ship): number {
  const d = SHIP_DRAFT_M[ship.type];
  return d > 0 ? d + KEEL_CLEARANCE_M : 0;
}

/** Depth below which a submarine cannot dive and must run on the surface or at snorkel depth. */
export const SUBMERGED_MIN_DEPTH_M = 35;
