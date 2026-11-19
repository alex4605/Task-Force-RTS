import { Ship, ShipType } from '../types/game';

/**
 * Historical shipboard missile launchers: how many missiles a ship puts in the air per
 * engagement and how quickly it can engage again. These replace flat one-missile-every-few-
 * seconds timers, so a twin-arm Terrier launcher ripples two rounds and reloads, an Aegis
 * cruiser's Mk 41 cells engage several raids at once, and a Komar boat fires its two Styx and is
 * empty.
 */

export interface ShipSamSystem {
  /** Launcher, for logs. */
  launcher: string;
  /** Missiles fired at each target: launcher arms, or the two-round shoot-shoot doctrine. */
  perTarget: number;
  /** Targets engaged at once: fire-control illuminators / guidance channels. */
  channels: number;
  /** Seconds before the launcher can engage again: arm reload, or VLS cadence. */
  cycle: number;
}

const SINGLE_ARM: ShipSamSystem = { launcher: 'single-arm launcher', perTarget: 1, channels: 1, cycle: 8 };

const SAM_BY_TYPE: Partial<Record<ShipType, ShipSamSystem>> = {
  // United States Navy
  cv63: { launcher: 'Mk 10 Terrier twin-arm', perTarget: 2, channels: 2, cycle: 10 },
  cg: { launcher: 'Mk 10 Terrier twin-arm', perTarget: 2, channels: 2, cycle: 8 }, // Belknap, two SPG-55
  ddg: { launcher: 'Mk 11 Tartar twin-arm', perTarget: 2, channels: 2, cycle: 10 }, // Charles F. Adams, two SPG-51
  cvn: { launcher: 'Mk 29 NATO Sea Sparrow', perTarget: 2, channels: 2, cycle: 8 },
  cg_tico: { launcher: 'Mk 41 VLS (Aegis)', perTarget: 2, channels: 4, cycle: 1.5 }, // four SPG-62 illuminators, time-shared
  cg_virginia: { launcher: '2 x Mk 26 twin-arm', perTarget: 2, channels: 2, cycle: 6 },
  ddg_kidd: { launcher: '2 x Mk 26 twin-arm', perTarget: 2, channels: 2, cycle: 6 },
  ffg_ohp: { launcher: 'Mk 13 single-arm', perTarget: 1, channels: 1, cycle: 8 },
  // Soviet Navy
  cgn_kirov: { launcher: 'S-300F (SA-N-6) VLS', perTarget: 2, channels: 6, cycle: 3 }, // Top Dome: 6 targets, 12 missiles
  dd_udaloy: { launcher: 'Kinzhal (SA-N-9) VLS', perTarget: 2, channels: 4, cycle: 3 },
  dd_sovremenny: { launcher: '2 x Shtil (SA-N-7) single-arm', perTarget: 1, channels: 2, cycle: 12 },
  cvhg_kiev: { launcher: '2 x Shtorm (SA-N-3) twin-arm', perTarget: 2, channels: 2, cycle: 10 },
  kashin: { launcher: '2 x Volna (SA-N-1) twin-arm', perTarget: 2, channels: 2, cycle: 10 },
  kynda: { launcher: 'Volna (SA-N-1) twin-arm', perTarget: 2, channels: 1, cycle: 12 },
};

/** Allied (NATO) ships are matched by the missile system named in their fit. */
const SAM_BY_MODEL: Array<[RegExp, ShipSamSystem]> = [
  [/Sea Dart/, { launcher: 'GWS 30 Sea Dart twin-arm', perTarget: 2, channels: 2, cycle: 10 }],
  [/Sea Wolf/, { launcher: 'GWS 25 Sea Wolf sextuple', perTarget: 2, channels: 1, cycle: 4 }],
  [/Crotale/, { launcher: 'Crotale octuple', perTarget: 2, channels: 1, cycle: 6 }],
  [/海麻雀|Sea Sparrow|NSSMS|RIM-7/, { launcher: 'Mk 29 Sea Sparrow octuple', perTarget: 2, channels: 1, cycle: 8 }],
];

export function getShipSamSystem(ship: Ship): ShipSamSystem {
  const byModel = ship.samModel ? SAM_BY_MODEL.find(([re]) => re.test(ship.samModel!))?.[1] : undefined;
  return byModel ?? SAM_BY_TYPE[ship.type] ?? SINGLE_ARM;
}

export interface ShipAshmFit {
  /** Missiles carried in launchers (no reloads at sea unless noted). */
  magazine: number;
  /** Missiles fired in one engagement. */
  salvo: number;
}

/**
 * Anti-ship missile fits. US surface combatants carried two quadruple Mk 141 Harpoon canisters
 * and fired half of them at a single surface group; the Iowas carried four. Soviet heavy units
 * fired their full launcher load in one saturation raid, the doctrine they were built around.
 */
const ASHM_BY_TYPE: Partial<Record<ShipType, ShipAshmFit>> = {
  cg_tico: { magazine: 8, salvo: 4 },
  cg_virginia: { magazine: 8, salvo: 4 },
  dd_spruance: { magazine: 8, salvo: 4 },
  ddg_kidd: { magazine: 8, salvo: 4 },
  bb_iowa_mod: { magazine: 16, salvo: 8 },
  ffg_ohp: { magazine: 4, salvo: 1 }, // shares the Mk 13 single arm with SM-1MR
  ssn_la: { magazine: 4, salvo: 2 }, // UGM-84 from the torpedo tubes
  cgn_kirov: { magazine: 20, salvo: 20 }, // 20 P-700 Granit
  ssgn_oscar: { magazine: 24, salvo: 24 }, // 24 P-700 Granit
  cvhg_kiev: { magazine: 8, salvo: 8 }, // 4 twin P-500 Bazalt launchers (16 reloads below deck)
  dd_sovremenny: { magazine: 8, salvo: 8 }, // 2 x quadruple P-270 Moskit
  komar_ptg: { magazine: 2, salvo: 2 }, // 2 P-15 Termit
  osa: { magazine: 4, salvo: 2 }, // 4 P-15 Termit, two per target
};

export function getShipAshmFit(type: ShipType): ShipAshmFit | undefined {
  return ASHM_BY_TYPE[type];
}
