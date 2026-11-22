/**
 * Self-propelled guns, tank destroyers and air-defence vehicles drawn from real dimensions, on
 * the same scale and drawing vocabulary as the tanks in groundPlan.ts: the M44's open fighting
 * box at the rear, the M109's turret behind a front engine, Tunguska's guns and missiles either
 * side of its turret, the SA-8's boat hull on six wheels.
 */
import { drawGunTube, drawTankPlan, drawTracks, hullPath, K, Nose, PlanPalette, TANK_PLANS, turretPath, TurretShape, WIDEN } from './groundPlan';

interface Gun {
  /** Lateral offset (m) and length from the mount centre (m). */
  y: number;
  len: number;
  bore: number;
  brake?: 'single' | 'double' | 'slotted' | 'tee';
  /** Bore evacuator / fume extractor position (0..1 along the tube). */
  evac?: number;
}

interface Mount {
  /** Mount centre ahead of hull centre (m), lateral offset, length and width. */
  x: number;
  y?: number;
  len: number;
  wid: number;
  /** turret = enclosed; open = open-topped box or tub; casemate = fixed superstructure. */
  kind: 'turret' | 'open' | 'casemate';
  shape?: TurretShape;
  bustle?: number;
}

interface Missiles {
  /** Rails / canisters: count per side group, length (m), lateral centres of the groups (m). */
  count: number;
  len: number;
  groups: number[];
  /** Spacing within a group (m) and the x of the group centres. */
  gap: number;
  x: number;
  canister?: boolean;
}

export interface SupportPlan {
  match: RegExp;
  L: number;
  W: number;
  /** Track width (m); 0 for a wheeled chassis. */
  track: number;
  /** Wheeled chassis: axle count. */
  axles?: number;
  nose: Nose;
  noseLen: number;
  /** Engine deck: span (m) and end of the hull it sits at. */
  engine: { len: number; at: 'rear' | 'front' | 'front_right' };
  mount: Mount;
  guns?: Gun[];
  missiles?: Missiles;
  /** Vertical launch hatches in the turret roof (Tor). */
  vls?: number;
  /** Radar antennas: position relative to hull centre (m), size, dish or rotating bar. */
  radars?: { x: number; y: number; r: number; kind: 'dish' | 'bar' }[];
  /** Front driver's cab (Chaparral's M548 carrier). */
  cab?: { len: number };
  spades?: boolean;
  /** M7 Priest's round machine-gun pulpit. */
  pulpit?: { x: number; y: number };
  /** M50 Ontos: six recoilless rifles on the small turret. */
  recoilless?: boolean;
  amphib?: boolean;
  /** Half-track: steerable front wheels and a short track run at the rear. */
  halftrack?: boolean;
  /** Shielded pintle machine guns on the hull (M113 ACAV): position (m) and facing. */
  pintles?: { x: number; y: number; dir: number }[];
}

export const SUPPORT_PLANS: SupportPlan[] = [
  // ── Additional US and allied vehicles ──
  // M16 MGMC: half-track with the M45 quad .50 mount in the open rear body
  { match: /quad50/, L: 6.5, W: 2.2, track: 0.3, halftrack: true, nose: 'flat', noseLen: 0.3, engine: { len: 1.2, at: 'front' }, cab: { len: 1.3 }, mount: { x: -1.3, len: 1.7, wid: 1.7, kind: 'open', shape: 'dome' }, guns: [{ y: -0.5, len: 2.2, bore: 13 }, { y: -0.25, len: 2.2, bore: 13 }, { y: 0.25, len: 2.2, bore: 13 }, { y: 0.5, len: 2.2, bore: 13 }] },
  // M113 ACAV: commander's .50 behind a shield and two shielded M60s on the roof
  { match: /acav/, L: 4.86, W: 2.69, track: 0.38, nose: 'flat', noseLen: 0.4, engine: { len: 1.2, at: 'front_right' }, mount: { x: 0.3, y: -0.4, len: 1.0, wid: 1.0, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 1.9, bore: 13 }], pintles: [{ x: -1.2, y: -1.0, dir: -1.2 }, { x: -1.2, y: 1.0, dir: 1.2 }] },
  // M106 / M106A2: M113 hull with the 4.2-inch / 107mm mortar on a turntable under the big rear roof hatch, firing over the back
  { match: /m106/, L: 4.93, W: 2.69, track: 0.38, nose: 'flat', noseLen: 0.4, engine: { len: 1.2, at: 'front_right' }, mount: { x: -0.9, len: 1.9, wid: 1.9, kind: 'open', shape: 'box' }, guns: [{ y: 0, len: 1.5, bore: 107 }], pintles: [{ x: 0.7, y: -0.8, dir: 0 }] },
  // 2S9 Nona-S: BTR-D boat hull, small round welded turret with the short 120mm 2A51 gun-mortar
  { match: /2s9/, L: 6.02, W: 2.63, track: 0.3, nose: 'boat', noseLen: 1.0, engine: { len: 1.4, at: 'rear' }, mount: { x: 0.2, len: 1.9, wid: 1.9, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 1.9, bore: 120 }], amphib: true },
  // M107: open 175mm gun on the hull rear, very long tube, recoil spade
  { match: /m107/, L: 5.72, W: 3.15, track: 0.46, nose: 'glacis', noseLen: 0.7, engine: { len: 1.6, at: 'front' }, mount: { x: -1.5, len: 2.0, wid: 2.3, kind: 'open', shape: 'box' }, guns: [{ y: 0, len: 10.2, bore: 175, evac: 0.3 }], spades: true },
  // M966 HMMWV with the TOW launcher on the roof ring
  { match: /hmmwv_tow/, L: 4.57, W: 2.16, track: 0, axles: 2, nose: 'flat', noseLen: 0.3, engine: { len: 1.4, at: 'front' }, mount: { x: -0.6, len: 0.8, wid: 0.8, kind: 'turret', shape: 'dome' }, missiles: { count: 1, len: 1.7, groups: [0], gap: 0, x: -0.3, canister: true } },
  // M1097 Avenger: Stinger pods either side of the gyro-stabilised turret
  { match: /avenger/, L: 4.95, W: 2.16, track: 0, axles: 2, nose: 'flat', noseLen: 0.3, engine: { len: 1.4, at: 'front' }, mount: { x: -1.0, len: 1.0, wid: 0.9, kind: 'turret', shape: 'dome' }, missiles: { count: 4, len: 1.6, groups: [-0.75, 0.75], gap: 0.16, x: -1.0, canister: true }, guns: [{ y: 0.42, len: 1.4, bore: 13 }] },
  // Marder 1A3: small two-man turret with the 20mm Rh 202 and a MILAN launcher on its side
  { match: /marder/, L: 6.88, W: 3.24, track: 0.45, nose: 'glacis', noseLen: 0.9, engine: { len: 1.6, at: 'front_right' }, mount: { x: 0.3, len: 1.8, wid: 1.5, kind: 'turret', shape: 'box' }, guns: [{ y: 0, len: 2.6, bore: 20 }], missiles: { count: 1, len: 1.2, groups: [0.95], gap: 0, x: 0.3, canister: true } },
  // FV510 Warrior: turret with the 30mm RARDEN, rear troop doors
  { match: /warrior/, L: 6.34, W: 3.03, track: 0.5, nose: 'glacis', noseLen: 0.9, engine: { len: 1.5, at: 'front_right' }, mount: { x: 0.1, len: 2.2, wid: 2.0, kind: 'turret', shape: 'box' }, guns: [{ y: 0, len: 3.0, bore: 30 }] },
  // M36 Jackson: open-topped turret with the long 90mm M3 and its double-baffle brake, Sherman-derived hull
  { match: /m36/, L: 5.88, W: 3.05, track: 0.42, nose: 'glacis', noseLen: 0.9, engine: { len: 1.9, at: 'rear' }, mount: { x: 0.1, len: 2.6, wid: 2.5, kind: 'open', shape: 'cast', bustle: 0.5 }, guns: [{ y: 0, len: 5.2, bore: 90, brake: 'double' }] },
  // Flakpanzer Gepard: Leopard 1 hull, big turret with a 35mm KDA either side, search radar on the turret rear, tracking radar in front
  { match: /gepard/, L: 7.68, W: 3.27, track: 0.55, nose: 'glacis', noseLen: 1.0, engine: { len: 2.2, at: 'rear' }, mount: { x: -0.2, len: 3.0, wid: 2.5, kind: 'turret', shape: 'box' }, guns: [{ y: -1.15, len: 4.6, bore: 35, brake: 'single' }, { y: 1.15, len: 4.6, bore: 35, brake: 'single' }], radars: [{ x: -1.3, y: 0, r: 0.75, kind: 'bar' }, { x: 1.2, y: 0, r: 0.45, kind: 'dish' }] },
  // Universal (Bren) Carrier: small open tracked box, Bren on the left front
  { match: /bren_carrier/, L: 3.65, W: 2.06, track: 0.32, nose: 'flat', noseLen: 0.3, engine: { len: 0.9, at: 'rear' }, mount: { x: 0.5, len: 1.4, wid: 1.6, kind: 'open', shape: 'box' }, guns: [{ y: -0.4, len: 1.2, bore: 8 }] },
  // Luchs 8x8: boat hull, small turret with the 20mm Rh 202
  { match: /luchs/, L: 7.74, W: 2.98, track: 0, axles: 4, nose: 'glacis', noseLen: 0.9, engine: { len: 1.6, at: 'rear' }, mount: { x: 0.6, len: 1.7, wid: 1.7, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 2.4, bore: 20 }], amphib: true },
  // BTR-70: 8x8 boat hull, small KPVT turret forward
  { match: /btr70/, L: 7.54, W: 2.8, track: 0, axles: 4, nose: 'glacis', noseLen: 1.1, engine: { len: 1.8, at: 'rear' }, mount: { x: 1.0, len: 1.2, wid: 1.2, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 1.7, bore: 14.5 }], amphib: true },
  // BMD-1: small air-droppable hull, BMP-1 turret with the 73mm Grom and a Malyutka rail
  { match: /bmd/, L: 5.4, W: 2.63, track: 0.3, nose: 'glacis', noseLen: 1.0, engine: { len: 1.5, at: 'rear' }, mount: { x: 0.6, len: 1.9, wid: 1.9, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 1.4, bore: 73 }], missiles: { count: 1, len: 0.9, groups: [0], gap: 0, x: 0.9 }, amphib: true },
  // SU-76M: open fighting compartment at the rear, 76mm with a double-baffle brake
  { match: /su76/, L: 5.0, W: 2.74, track: 0.3, nose: 'glacis', noseLen: 0.7, engine: { len: 1.2, at: 'front_right' }, mount: { x: -0.9, len: 2.2, wid: 2.4, kind: 'open', shape: 'box' }, guns: [{ y: 0, len: 3.6, bore: 76, brake: 'double' }] },
  // ── Self-propelled artillery ──
  // M7 Priest: open box on the M3/M4 chassis, 105mm offset right, the "pulpit" at right front
  { match: /priest/, L: 6.02, W: 2.87, track: 0.42, nose: 'round', noseLen: 0.8, engine: { len: 1.6, at: 'rear' }, mount: { x: 0.2, len: 2.9, wid: 2.5, kind: 'open' }, guns: [{ y: 0.3, len: 3.4, bore: 105 }], pulpit: { x: 1.4, y: 0.95 } },
  // M44: 155mm in an open box at the rear, engine forward, recoil spades
  { match: /m44/, L: 6.16, W: 3.24, track: 0.53, nose: 'glacis', noseLen: 0.6, engine: { len: 1.6, at: 'front' }, mount: { x: -1.1, len: 3.3, wid: 3.0, kind: 'open' }, guns: [{ y: 0, len: 5.2, bore: 155, brake: 'single' }], spades: true },
  // Hummel: 150mm sFH 18 in an open compartment at the rear, engine amidships
  { match: /hummel/, L: 7.17, W: 2.97, track: 0.4, nose: 'flat', noseLen: 0.5, engine: { len: 1.4, at: 'front' }, mount: { x: -1.3, len: 3.2, wid: 2.7, kind: 'open' }, guns: [{ y: 0, len: 5.4, bore: 150 }] },
  // M109A6 Paladin: big turret with bustle, long 39-calibre M284 tube
  { match: /paladin/, L: 6.19, W: 3.15, track: 0.53, nose: 'glacis', noseLen: 0.8, engine: { len: 1.8, at: 'front_right' }, mount: { x: -0.9, len: 3.7, wid: 3.1, kind: 'turret', shape: 'box', bustle: 0.6 }, guns: [{ y: 0, len: 7.6, bore: 155, brake: 'double', evac: 0.4 }] },
  // M109: short 23-calibre M126 with a big double-baffle brake
  { match: /m109/, L: 6.11, W: 3.15, track: 0.53, nose: 'glacis', noseLen: 0.8, engine: { len: 1.8, at: 'front_right' }, mount: { x: -0.9, len: 3.3, wid: 3.0, kind: 'turret', shape: 'box' }, guns: [{ y: 0, len: 5.2, bore: 155, brake: 'double', evac: 0.45 }] },
  // 2S1 Gvozdika: MT-LB chassis, boat nose, small turret at the rear, 122mm
  { match: /2s1(?!9)/, L: 7.26, W: 2.85, track: 0.35, nose: 'boat', noseLen: 1.2, engine: { len: 1.4, at: 'front' }, mount: { x: -1.6, len: 2.4, wid: 2.3, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 5.1, bore: 122, brake: 'double', evac: 0.5 }], amphib: true },
  // 2S3 Akatsiya: rounded turret aft of a front engine, 152mm
  { match: /2s3/, L: 7.76, W: 3.25, track: 0.48, nose: 'glacis', noseLen: 0.9, engine: { len: 1.8, at: 'front' }, mount: { x: -1.3, len: 3.3, wid: 3.0, kind: 'turret', shape: 'egg' }, guns: [{ y: 0, len: 7.0, bore: 152, brake: 'double', evac: 0.55 }] },
  // 2S19 Msta-S: T-80 chassis, very large turret with bustle, 152mm 2A64
  { match: /2s19/, L: 6.9, W: 3.38, track: 0.58, nose: 'glacis', noseLen: 1.1, engine: { len: 2.3, at: 'rear' }, mount: { x: -0.5, len: 4.1, wid: 3.3, kind: 'turret', shape: 'box', bustle: 0.6 }, guns: [{ y: 0, len: 8.0, bore: 152, brake: 'double', evac: 0.45 }] },

  // ── Tank destroyers ──
  // SU-100: casemate forward on the right of the T-34 hull, 100mm D-10S
  { match: /su100|su_100/, L: 6.1, W: 3.0, track: 0.5, nose: 'glacis', noseLen: 1.0, engine: { len: 2.1, at: 'rear' }, mount: { x: 0.7, len: 2.6, wid: 2.5, kind: 'casemate' }, guns: [{ y: 0, len: 5.3, bore: 100 }] },
  // M50 Ontos: tiny tracked carrier with six 106mm recoilless rifles on a small turret
  { match: /ontos/, L: 3.83, W: 2.6, track: 0.35, nose: 'glacis', noseLen: 0.6, engine: { len: 1.0, at: 'front_right' }, mount: { x: -0.4, len: 1.6, wid: 1.6, kind: 'turret', shape: 'box' }, recoilless: true },

  // ── Air defence: guns ──
  // M42 Duster: open turret, twin 40mm Bofors with flash hiders
  { match: /duster/, L: 5.82, W: 3.22, track: 0.53, nose: 'glacis', noseLen: 0.8, engine: { len: 1.9, at: 'rear' }, mount: { x: 0, len: 2.6, wid: 2.4, kind: 'open', shape: 'dome' }, guns: [{ y: -0.32, len: 3.2, bore: 40, brake: 'tee' }, { y: 0.32, len: 3.2, bore: 40, brake: 'tee' }] },
  // ZSU-57-2: big open box turret on a T-54-derived hull, twin 57mm
  { match: /zsu57/, L: 6.22, W: 3.27, track: 0.58, nose: 'glacis', noseLen: 1.0, engine: { len: 2.0, at: 'rear' }, mount: { x: -0.2, len: 3.1, wid: 2.9, kind: 'open' }, guns: [{ y: -0.45, len: 4.2, bore: 57, brake: 'slotted' }, { y: 0.45, len: 4.2, bore: 57, brake: 'slotted' }] },
  // M163 VADS: M113 hull, one-man turret with the M61 Vulcan and its range-only radar on the right
  { match: /vads|m163/, L: 4.86, W: 2.85, track: 0.38, nose: 'flat', noseLen: 0.4, engine: { len: 1.2, at: 'front_right' }, mount: { x: -0.4, len: 1.6, wid: 1.6, kind: 'turret', shape: 'dome' }, guns: [{ y: 0, len: 2.4, bore: 80 }], radars: [{ x: -0.4, y: 1.05, r: 0.35, kind: 'dish' }] },
  // ZSU-23-4 Shilka: flat turret with four 23mm in two pairs, folding search radar at the rear
  { match: /shilka|zsu23/, L: 6.54, W: 3.12, track: 0.38, nose: 'glacis', noseLen: 0.7, engine: { len: 1.8, at: 'rear' }, mount: { x: 0, len: 3.0, wid: 2.9, kind: 'turret', shape: 'box' }, guns: [{ y: -0.62, len: 3.0, bore: 23 }, { y: -0.38, len: 3.0, bore: 23 }, { y: 0.38, len: 3.0, bore: 23 }, { y: 0.62, len: 3.0, bore: 23 }], radars: [{ x: -1.3, y: 0, r: 0.75, kind: 'dish' }] },
  // 2K22 Tunguska: twin 30mm and four missiles on each side of the turret, search radar at the rear
  { match: /tunguska/, L: 7.93, W: 3.24, track: 0.48, nose: 'glacis', noseLen: 0.9, engine: { len: 1.9, at: 'rear' }, mount: { x: -0.6, len: 3.4, wid: 2.4, kind: 'turret', shape: 'box' }, guns: [{ y: -1.5, len: 3.6, bore: 30 }, { y: -1.3, len: 3.6, bore: 30 }, { y: 1.3, len: 3.6, bore: 30 }, { y: 1.5, len: 3.6, bore: 30 }], missiles: { count: 2, len: 2.2, groups: [-1.05, 1.05], gap: 0.22, x: -1.2, canister: true }, radars: [{ x: -2.0, y: 0, r: 0.8, kind: 'bar' }, { x: 0.8, y: 0, r: 0.5, kind: 'dish' }] },
  // BTR-D with ZU-23-2 on the roof (BTR-ZD)
  { match: /btr_zd/, L: 5.88, W: 2.63, track: 0.3, nose: 'boat', noseLen: 0.9, engine: { len: 1.4, at: 'rear' }, mount: { x: -0.9, len: 1.6, wid: 1.4, kind: 'open', shape: 'dome' }, guns: [{ y: -0.18, len: 2.4, bore: 23 }, { y: 0.18, len: 2.4, bore: 23 }], amphib: true },

  // ── Air defence: missiles ──
  // M48 Chaparral (M730): front cab, launcher with four Sidewinder rails at the rear
  { match: /chaparral/, L: 6.06, W: 2.69, track: 0.38, nose: 'flat', noseLen: 0.4, engine: { len: 0.8, at: 'front' }, cab: { len: 1.6 }, mount: { x: -1.2, len: 1.4, wid: 1.4, kind: 'turret', shape: 'box' }, missiles: { count: 2, len: 2.9, groups: [-0.75, 0.75], gap: 0.3, x: -1.0 } },
  // 9K33 Osa (SA-8): amphibious 6x6 boat hull, six missiles flanking the radar turret
  { match: /sa8|osa/, L: 9.14, W: 2.75, track: 0, axles: 3, nose: 'boat', noseLen: 1.6, engine: { len: 1.8, at: 'rear' }, mount: { x: 0.2, len: 2.0, wid: 1.6, kind: 'turret', shape: 'dome' }, missiles: { count: 3, len: 3.2, groups: [-0.95, 0.95], gap: 0.28, x: 0.2 }, radars: [{ x: -0.5, y: 0, r: 0.9, kind: 'bar' }, { x: 1.2, y: 0, r: 0.45, kind: 'dish' }], amphib: true },
  // 9K35 Strela-10 (MT-LB): small turret with four canisters
  { match: /strela10/, L: 6.6, W: 2.85, track: 0.35, nose: 'boat', noseLen: 1.1, engine: { len: 1.4, at: 'front' }, mount: { x: -1.2, len: 1.2, wid: 1.2, kind: 'turret', shape: 'dome' }, missiles: { count: 2, len: 2.2, groups: [-0.75, 0.75], gap: 0.3, x: -1.1, canister: true } },
  // 9K31 Strela-1 (SA-9) on BRDM-2: 4x4, four canisters on a small mount
  { match: /sa9|strela/, L: 5.75, W: 2.35, track: 0, axles: 2, nose: 'boat', noseLen: 1.1, engine: { len: 1.3, at: 'rear' }, mount: { x: -0.3, len: 1.0, wid: 1.0, kind: 'turret', shape: 'dome' }, missiles: { count: 2, len: 1.8, groups: [-0.6, 0.6], gap: 0.28, x: -0.3, canister: true } },
  // 2K12 Kub (SA-6): three large missiles side by side on a trainable launcher
  { match: /sa6|kub/, L: 7.39, W: 3.18, track: 0.4, nose: 'glacis', noseLen: 0.8, engine: { len: 1.8, at: 'rear' }, mount: { x: -0.6, len: 1.6, wid: 1.6, kind: 'turret', shape: 'dome' }, missiles: { count: 3, len: 5.8, groups: [0], gap: 0.75, x: 0.3 } },
  // 9K37 Buk (SA-11 TELAR): four missiles on the launcher, Fire Dome radar ahead of them
  { match: /sa11|buk/, L: 9.3, W: 3.25, track: 0.45, nose: 'glacis', noseLen: 0.9, engine: { len: 1.6, at: 'front' }, mount: { x: -1.0, len: 2.2, wid: 2.0, kind: 'turret', shape: 'box' }, missiles: { count: 2, len: 5.5, groups: [-0.65, 0.65], gap: 0.5, x: -1.2 }, radars: [{ x: 1.8, y: 0, r: 0.75, kind: 'dish' }] },
  // 9K330 Tor (SA-15): box turret with eight vertical launch hatches, search radar on the roof
  { match: /sa15|(^|_)tor(_|$)/, L: 7.5, W: 3.3, track: 0.45, nose: 'glacis', noseLen: 0.9, engine: { len: 1.8, at: 'rear' }, mount: { x: -0.4, len: 3.6, wid: 3.0, kind: 'turret', shape: 'box' }, vls: 8, radars: [{ x: -1.5, y: 0, r: 1.0, kind: 'bar' }, { x: 1.0, y: 0, r: 0.55, kind: 'dish' }] },
];

function drawWheels(ctx: CanvasRenderingContext2D, hl: number, ow: number, axles: number, pal: PlanPalette) {
  const m = (v: number) => v * K;
  const span = hl * 0.62;
  ctx.fillStyle = pal.trackColor;
  for (let i = 0; i < axles; i++) {
    const x = axles === 1 ? 0 : -span / 2 + (span * i) / (axles - 1);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(x - m(0.55), s < 0 ? -ow / 2 : ow / 2 - m(0.38), m(1.1), m(0.38), m(0.18));
      ctx.fill();
    }
  }
}

function drawEngineDeck(ctx: CanvasRenderingContext2D, hl: number, hw: number, len: number, at: SupportPlan['engine']['at']) {
  const ed = len * K;
  const x0 = at === 'rear' ? -hl / 2 + 0.8 : hl / 2 - ed - 1.6;
  const y0 = at === 'front_right' ? 0 : -hw * 0.36;
  const h = at === 'front_right' ? hw * 0.38 : hw * 0.72;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(x0, y0, ed - 1, h);
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.32)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let y = y0 + 0.5; y <= y0 + h - 0.4; y += Math.max(0.9, hw * 0.08)) {
    ctx.moveTo(x0 + 0.4, y);
    ctx.lineTo(x0 + ed - 1.4, y);
  }
  ctx.stroke();
}

export function drawSupportPlan(ctx: CanvasRenderingContext2D, p: SupportPlan, pal: PlanPalette): void {
  const f = Math.pow(6.3 / p.L, 0.35);
  ctx.save();
  ctx.scale(f, f);
  drawSupportBody(ctx, p, pal);
  ctx.restore();
}

function drawSupportBody(ctx: CanvasRenderingContext2D, p: SupportPlan, pal: PlanPalette): void {
  const m = (v: number) => v * K;
  const hl = m(p.L);
  const ow = m(p.W) * WIDEN;
  const tw = m(p.track) * WIDEN;
  const wheeled = p.track === 0;
  const hw = wheeled ? ow * 0.9 : ow - tw * 2 + tw * 0.5;

  if (p.halftrack) {
    // Front wheels under the bonnet, track run under the rear body
    ctx.save();
    ctx.translate(-hl * 0.18, 0);
    drawTracks(ctx, hl * 0.55, ow, tw, pal);
    ctx.restore();
    ctx.fillStyle = pal.trackColor;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(hl * 0.3, s < 0 ? -ow / 2 : ow / 2 - m(0.32), m(0.95), m(0.32), m(0.15));
      ctx.fill();
    }
  } else if (wheeled) drawWheels(ctx, hl, ow, p.axles ?? 2, pal);
  else drawTracks(ctx, hl, ow, tw, pal);

  // Hull
  hullPath(ctx, hl, hw, p.nose, m(p.noseLen));
  ctx.fillStyle = p.amphib ? '#173A4A' : pal.hullFill;
  ctx.strokeStyle = p.amphib ? '#4FC3F7' : pal.hullStroke;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
  drawEngineDeck(ctx, hl, hw, p.engine.len, p.engine.at);

  if (p.cab) {
    // Front cab of a tracked cargo carrier
    ctx.fillStyle = pal.turretFill;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 0.8;
    ctx.fillRect(hl / 2 - m(p.cab.len) - 0.4, -hw * 0.46, m(p.cab.len), hw * 0.92);
    ctx.strokeRect(hl / 2 - m(p.cab.len) - 0.4, -hw * 0.46, m(p.cab.len), hw * 0.92);
    ctx.fillStyle = 'rgba(128, 222, 234, 0.35)';
    ctx.fillRect(hl / 2 - 1.4, -hw * 0.38, 0.8, hw * 0.76);
  }
  if (p.spades) {
    ctx.fillStyle = '#455A64';
    for (const s of [-1, 1]) ctx.fillRect(-hl / 2 - m(0.5), s * hw * 0.3 - m(0.35), m(0.5), m(0.7));
  }

  // Mount
  const mt = p.mount;
  const mx = m(mt.x);
  const my = m(mt.y ?? 0);
  const ml = m(mt.len);
  const mw = Math.min(m(mt.wid) * WIDEN, hw + tw * 0.6);
  ctx.save();
  ctx.translate(mx, my);
  if (mt.kind === 'casemate') {
    ctx.beginPath();
    ctx.moveTo(ml / 2, -mw * 0.38);
    ctx.lineTo(ml / 2 - m(0.5), -mw / 2);
    ctx.lineTo(-ml / 2, -mw / 2);
    ctx.lineTo(-ml / 2, mw / 2);
    ctx.lineTo(ml / 2 - m(0.5), mw / 2);
    ctx.lineTo(ml / 2, mw * 0.38);
    ctx.closePath();
    ctx.fillStyle = pal.turretFill;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  } else {
    turretPath(ctx, mt.shape ?? 'box', ml, mw, m(mt.bustle ?? 0));
    if (mt.kind === 'open') {
      // Open top: thin armour walls around a dark fighting compartment with ammunition racks
      ctx.fillStyle = '#1E272E';
      ctx.strokeStyle = pal.hullStroke;
      ctx.lineWidth = 1.1;
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.45)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let y = -mw / 2 + 1.2; y < mw / 2 - 0.8; y += 1.2) {
        ctx.moveTo(-ml / 2 + 0.8, y);
        ctx.lineTo(-ml / 2 + 2.4, y);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = pal.turretFill;
      ctx.strokeStyle = pal.hullStroke;
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.ellipse(-ml * 0.05, -mw * 0.12, ml * 0.28, mw * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Commander's hatch
      ctx.fillStyle = pal.hullHighlight;
      ctx.beginPath();
      ctx.arc(-ml * 0.25, -mw * 0.25, Math.max(0.8, m(0.3)), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (p.vls) {
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.7)';
    ctx.lineWidth = 0.4;
    const cols = p.vls / 2;
    for (let c = 0; c < cols; c++) {
      for (const row of [-1, 1]) {
        ctx.beginPath();
        ctx.rect(-ml / 2 + 1 + c * m(0.42), row * mw * 0.2 - m(0.17), m(0.34), m(0.34));
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // Guns
  for (const g of p.guns ?? []) {
    const g0 = mt.kind === 'casemate' ? ml / 2 - 0.4 : ml * 0.3;
    drawGunTube(ctx, g0, m(g.len), m(g.y), g.bore, pal, g.brake, g.evac);
  }
  if (p.recoilless) {
    // Ontos: three 106mm M40 rifles each side, long tubes with breech venturis at the rear
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (const y of [-1.2, -0.95, -0.7, 0.7, 0.95, 1.2]) {
      ctx.moveTo(-ml * 0.8, m(y));
      ctx.lineTo(m(2.6), m(y));
    }
    ctx.stroke();
    // Breech venturis at the rear of each rifle
    ctx.fillStyle = '#FFD54F';
    for (const y of [-1.2, -0.95, -0.7, 0.7, 0.95, 1.2]) ctx.fillRect(-ml * 0.8 - 0.6, m(y) - 0.35, 0.6, 0.7);
  }
  ctx.restore();

  // Missiles on rails or in canisters (white body, red seeker)
  if (p.missiles) {
    const ms = p.missiles;
    for (const gy of ms.groups) {
      for (let i = 0; i < ms.count; i++) {
        const y = m(gy + (i - (ms.count - 1) / 2) * ms.gap) + my;
        const x0 = m(ms.x) - m(ms.len) / 2;
        const len = m(ms.len);
        if (ms.canister) {
          ctx.fillStyle = '#5D6B4A';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 0.4;
          ctx.fillRect(x0, y - m(0.13), len, m(0.26));
          ctx.strokeRect(x0, y - m(0.13), len, m(0.26));
        } else {
          ctx.fillStyle = '#ECEFF1';
          ctx.fillRect(x0, y - m(0.1), len * 0.9, m(0.2));
          ctx.fillStyle = '#FF5252';
          ctx.beginPath();
          ctx.moveTo(x0 + len * 0.9, y - m(0.1));
          ctx.lineTo(x0 + len, y);
          ctx.lineTo(x0 + len * 0.9, y + m(0.1));
          ctx.fill();
          ctx.fillStyle = '#90A4AE';
          ctx.fillRect(x0, y - m(0.22), m(0.25), m(0.44));
        }
      }
    }
  }

  // Radars
  for (const r of p.radars ?? []) {
    const rx = m(r.x);
    const ry = m(r.y);
    if (r.kind === 'bar') {
      ctx.fillStyle = '#90A4AE';
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(rx - m(0.18), ry - m(r.r), m(0.36), m(r.r) * 2, m(0.1));
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#B0BEC5';
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(rx, ry, m(r.r) * 0.55, m(r.r), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  for (const pt of p.pintles ?? []) {
    // Gun shield and machine gun on a roof pintle
    ctx.save();
    ctx.translate(m(pt.x), m(pt.y));
    ctx.rotate(pt.dir);
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, m(0.45), -0.9, 0.9);
    ctx.stroke();
    drawGunTube(ctx, 0, m(1.1), 0, 12, pal);
    ctx.restore();
  }

  if (p.pulpit) {
    ctx.fillStyle = pal.turretFill;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(m(p.pulpit.x), m(p.pulpit.y), m(0.45), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = pal.barrelColor;
    ctx.beginPath();
    ctx.moveTo(m(p.pulpit.x), m(p.pulpit.y));
    ctx.lineTo(m(p.pulpit.x + 1.1), m(p.pulpit.y));
    ctx.stroke();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Rocket artillery and ballistic-missile launchers
// ════════════════════════════════════════════════════════════════════════════

/** Wheels at given axle stations (m from the hull centre, + forward). */
function drawAxles(ctx: CanvasRenderingContext2D, stations: number[], ow: number, wheelD: number, pal: PlanPalette) {
  const m = (v: number) => v * K;
  ctx.fillStyle = pal.trackColor;
  for (const x of stations) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(m(x) - m(wheelD / 2), s < 0 ? -ow / 2 : ow / 2 - m(0.42), m(wheelD), m(0.42), m(0.2));
      ctx.fill();
      ctx.strokeStyle = '#607D8B';
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  }
}

/** Truck bed / chassis outline with a cab at the front: bonnet (Ural) or flat-fronted cab-over. */
function drawTruck(ctx: CanvasRenderingContext2D, L: number, W: number, cab: { len: number; bonnet?: number; split?: boolean }, pal: PlanPalette) {
  const m = (v: number) => v * K;
  const hl = m(L);
  const hw = m(W) * WIDEN * 0.76; // wheels show either side of the body
  // Chassis / bed
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.roundRect(-hl / 2, -hw / 2, hl - m(cab.len + (cab.bonnet ?? 0)), hw, 0.6);
  ctx.fill();
  ctx.stroke();
  const cx0 = hl / 2 - m(cab.len + (cab.bonnet ?? 0));
  ctx.fillStyle = pal.turretFill;
  if (cab.split) {
    // MAZ-543: two separate cabs either side of the missile nose, engine between them
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(cx0, s < 0 ? -hw / 2 : hw * 0.14, m(cab.len), hw * 0.36, 0.8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
      ctx.fillRect(cx0 + m(cab.len) - 1.2, s < 0 ? -hw / 2 + 0.6 : hw * 0.14 + 0.6, 0.8, hw * 0.36 - 1.2);
      ctx.fillStyle = pal.turretFill;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(cx0, -hw * 0.14, m(cab.len), hw * 0.28);
    return;
  }
  ctx.beginPath();
  ctx.roundRect(cx0, -hw / 2, m(cab.len), hw, 0.8);
  ctx.fill();
  ctx.stroke();
  // Windscreen
  ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
  ctx.fillRect(cx0 + m(cab.len) - 1.3, -hw * 0.42, 0.9, hw * 0.84);
  if (cab.bonnet) {
    // Engine bonnet ahead of the cab with its grille
    ctx.fillStyle = pal.hullFill;
    ctx.beginPath();
    ctx.roundRect(cx0 + m(cab.len), -hw * 0.34, m(cab.bonnet), hw * 0.68, 1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(hl / 2 - 0.9, -hw * 0.26, 0.6, hw * 0.52);
  }
}

/** Bundle of launch tubes seen from above: rows of tubes with their muzzles toward `dir`. */
function drawTubeBundle(ctx: CanvasRenderingContext2D, x: number, len: number, wid: number, cols: number, colour: string, dir: 1 | -1) {
  const m = (v: number) => v * K;
  const x0 = m(x) - m(len) / 2;
  const w = m(wid);
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 0.5;
  ctx.fillRect(x0, -w / 2, m(len), w);
  ctx.strokeRect(x0, -w / 2, m(len), w);
  const step = w / cols;
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.45)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (let i = 1; i < cols; i++) {
    ctx.moveTo(x0, -w / 2 + i * step);
    ctx.lineTo(x0 + m(len), -w / 2 + i * step);
  }
  ctx.stroke();
  // Muzzles
  ctx.fillStyle = colour;
  const mx = dir > 0 ? x0 + m(len) - 0.5 : x0 + 0.5;
  for (let i = 0; i < cols; i++) {
    ctx.beginPath();
    ctx.arc(mx, -w / 2 + (i + 0.5) * step, Math.min(step * 0.38, 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
  // Frame cross-members
  ctx.fillStyle = '#263238';
  for (const f of [0.2, 0.55, 0.9]) ctx.fillRect(x0 + m(len) * f, -w / 2 - 0.3, 0.6, w + 0.6);
}

export function drawRocketLauncherPlan(ctx: CanvasRenderingContext2D, type: string, pal: PlanPalette): boolean {
  const t = type.toLowerCase();
  const m = (v: number) => v * K;
  const scaled = (L: number, fn: () => void) => {
    const f = Math.pow(6.3 / L, 0.35);
    ctx.save();
    ctx.scale(f, f);
    fn();
    ctx.restore();
  };

  if (t.includes('scud')) {
    // 9P117 on MAZ-543: 8x8, split cabs, the 11.2 m R-17 lying nose-forward between the cabs
    const nuke = t.includes('nuclear');
    scaled(13.36, () => {
      const ow = m(3.02) * WIDEN;
      drawAxles(ctx, [4.6, 2.2, -1.6, -4.0], ow, 1.55, pal);
      drawTruck(ctx, 13.36, 3.02, { len: 2.3, split: true }, pal);
      // Erector beam and the missile on it
      ctx.fillStyle = '#455A64';
      ctx.fillRect(m(-6.4), -m(0.32), m(10.6), m(0.64));
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = nuke ? '#FFAB00' : '#90A4AE';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(m(-6.2), -m(0.44));
      ctx.lineTo(m(3.4), -m(0.44));
      ctx.quadraticCurveTo(m(4.9), -m(0.4), m(5.4), 0);
      ctx.quadraticCurveTo(m(4.9), m(0.4), m(3.4), m(0.44));
      ctx.lineTo(m(-6.2), m(0.44));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Warhead section and tail fins
      ctx.fillStyle = nuke ? '#FFAB00' : '#B0BEC5';
      ctx.fillRect(m(2.6), -m(0.42), m(0.8), m(0.84));
      ctx.fillStyle = '#546E7A';
      ctx.beginPath();
      ctx.moveTo(m(-6.2), -m(0.44));
      ctx.lineTo(m(-6.4), -m(0.95));
      ctx.lineTo(m(-5.4), -m(0.44));
      ctx.moveTo(m(-6.2), m(0.44));
      ctx.lineTo(m(-6.4), m(0.95));
      ctx.lineTo(m(-5.4), m(0.44));
      ctx.fill();
    });
    return true;
  }
  if (t.includes('uragan')) {
    // BM-27 on ZIL-135LM: 8x8 in two widely spaced pairs, cab-over front, 16 x 220mm tubes
    scaled(9.63, () => {
      const ow = m(2.8) * WIDEN;
      drawAxles(ctx, [3.2, 1.6, -1.6, -3.2], ow, 1.2, pal);
      drawTruck(ctx, 9.63, 2.8, { len: 1.9 }, pal);
      drawTubeBundle(ctx, -1.0, 5.6, 2.2, 6, '#FF8A65', -1);
    });
    return true;
  }
  if (t.includes('grad')) {
    // BM-21 on Ural-375D: bonnet cab, 6x6 (front axle + rear tandem), 40 x 122mm tubes in four rows of ten
    scaled(7.35, () => {
      const ow = m(2.4) * WIDEN;
      drawAxles(ctx, [2.5, -1.3, -2.7], ow, 1.1, pal);
      drawTruck(ctx, 7.35, 2.4, { len: 1.5, bonnet: 1.1 }, pal);
      drawTubeBundle(ctx, -1.4, 3.0, 1.9, 10, '#FF8A65', -1);
    });
    return true;
  }
  if (t.includes('calliope')) {
    // T34 Calliope: 60-tube 4.5in rocket frame over the turret of an M4A3 Sherman
    const sherman = TANK_PLANS.find((p) => p.match.test('usmc_armor_m4'));
    if (sherman) drawTankPlan(ctx, sherman, pal);
    scaled(5.84, () => {
      drawTubeBundle(ctx, 0.6, 3.6, 2.5, 18, '#FFB300', 1);
      // Elevating arm down to the gun mantlet
      ctx.strokeStyle = '#90A4AE';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(m(0.6), 0);
      ctx.lineTo(m(2.4), 0);
      ctx.stroke();
    });
    return true;
  }
  if (t.includes('m270') || t.includes('atacms') || t.includes('mlrs')) {
    // M270: Bradley-derived chassis, armoured three-man cab forward, launcher-loader module with
    // two pods aft (rocket pods: 6 tubes each; ATACMS: one missile per pod)
    const atacms = t.includes('atacms');
    const nuke = t.includes('nuclear');
    scaled(6.85, () => {
      const ow = m(2.97) * WIDEN;
      const tw = m(0.53) * WIDEN;
      drawTracks(ctx, m(6.85), ow, tw, pal);
      const hw = ow - tw * 1.5;
      hullPath(ctx, m(6.85), hw, 'glacis', m(0.7));
      ctx.fillStyle = pal.hullFill;
      ctx.strokeStyle = nuke ? '#FFAB00' : pal.hullStroke;
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      // Cab
      ctx.fillStyle = pal.turretFill;
      ctx.beginPath();
      ctx.roundRect(m(1.4), -hw / 2 + 0.3, m(1.8), hw - 0.6, 0.8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
      for (const s of [-1, 1]) ctx.fillRect(m(3.0), s < 0 ? -hw * 0.4 : hw * 0.08, 0.8, hw * 0.32);
      // Two pods side by side, muzzles aft in the travel position
      for (const s of [-1, 1]) {
        const y0 = s < 0 ? -hw / 2 + 0.4 : 0.3;
        const pw = hw / 2 - 0.7;
        ctx.fillStyle = nuke ? '#5D1F1F' : '#4E5B3A';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.fillRect(m(-3.2), y0, m(4.3), pw);
        ctx.strokeRect(m(-3.2), y0, m(4.3), pw);
        ctx.fillStyle = nuke ? '#FFEA00' : atacms ? '#FF8A65' : '#FFD54F';
        if (atacms) {
          ctx.beginPath();
          ctx.arc(m(-3.2) + 1.4, y0 + pw / 2, pw * 0.34, 0, Math.PI * 2);
          ctx.fill();
        } else {
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(m(-3.2) + 1.0, y0 + (i + 0.5) * (pw / 3), pw / 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });
    return true;
  }
  return false;
}
