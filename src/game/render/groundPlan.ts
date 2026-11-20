/**
 * Plan-view tank drawings from real dimensions. Each entry is the vehicle's own measurements in
 * metres (hull length, overall width, track width, turret position and size, gun length from the
 * turret ring), drawn at a common scale so a Ha-Go is visibly half the size of an Abrams and a
 * T-34-85's turret sits forward where a Sherman's sits amidships.
 */

export interface PlanPalette {
  hullFill: string;
  hullHighlight: string;
  hullStroke: string;
  turretFill: string;
  trackColor: string;
  barrelColor: string;
}

export type Nose = 'glacis' | 'round' | 'pike' | 'boat' | 'flat';
export type TurretShape = 'cast' | 'egg' | 'dome' | 'pan' | 'hex' | 'box' | 'needle' | 'angular' | 'cone';

export interface TankPlan {
  match: RegExp;
  /** Hull length, overall width, track width (m). */
  L: number;
  W: number;
  track: number;
  nose: Nose;
  /** Glacis / nose depth in plan (m). */
  noseLen: number;
  /** Turret centre ahead of hull centre, lateral offset (+ starboard), length and width (m). */
  turret: { x: number; y?: number; len: number; wid: number; shape: TurretShape; bustle?: number };
  /** Gun: bore (mm), length from turret centre (m), bore evacuator position (0..1), muzzle brake. */
  gun: { bore: number; len: number; evac?: number; brake?: 'single' | 'double' | 'slotted' | 'tee' };
  /** Commander's cupola relative to turret centre (m). */
  cupola?: { x: number; y: number; r: number };
  loaderHatch?: boolean;
  /** Engine deck grille span from the rear (m). */
  engineDeck: number;
  /** Soviet external fuel drums on the rear plate / fuel cells on the fenders. */
  rearDrums?: boolean;
  fenderTanks?: number;
  unditchingLog?: boolean;
  skirts?: boolean;
  /** Chi-Ha's horseshoe radio antenna around the turret. */
  hachimaki?: boolean;
  /** Reactive armour bricks on glacis and turret front. */
  era?: boolean;
  /** Abrams turret-bustle stowage rack. */
  bustleRack?: boolean;
  /** Driver's hatch side (+1 right, -1 left, 0 centre). */
  driver?: number;
  /** PT-76 bow trim vane. */
  trimVane?: boolean;
}

/** Units per metre along the hull, and the extra width given for legibility on the map. */
export const K = 3.3;
export const WIDEN = 1.12;

export const TANK_PLANS: TankPlan[] = [
  // M4A3R3 "Zippo": Sherman with the flame gun in place of the 75mm (short, fat tube)
  { match: /m4a3r3/, L: 5.84, W: 2.62, track: 0.42, nose: 'round', noseLen: 0.8, turret: { x: 0.2, len: 2.3, wid: 2.0, shape: 'cast', bustle: 0.35 }, gun: { bore: 110, len: 2.2 }, cupola: { x: -0.45, y: 0.45, r: 0.35 }, loaderHatch: true, engineDeck: 2.0, driver: -1 },
  // M24 Chaffee: low hull, small turret, lightweight 75mm M6
  { match: /chaffee/, L: 5.56, W: 2.95, track: 0.41, nose: 'glacis', noseLen: 0.8, turret: { x: 0.1, len: 2.3, wid: 2.0, shape: 'cast', bustle: 0.3 }, gun: { bore: 75, len: 3.3 }, cupola: { x: -0.45, y: 0.5, r: 0.35 }, loaderHatch: true, engineDeck: 1.9, driver: -1 },
  // Matilda Frog: the Australian flame conversion, a stubby flame projector in place of the 2pdr
  { match: /matilda_frog/, L: 5.61, W: 2.59, track: 0.35, nose: 'flat', noseLen: 0.5, turret: { x: 0.3, len: 1.9, wid: 1.7, shape: 'cast', bustle: 0.25 }, gun: { bore: 110, len: 2.1 }, cupola: { x: -0.35, y: 0.35, r: 0.3 }, engineDeck: 1.8, skirts: true, driver: 0 },
  // Matilda II: armoured skirts over the tracks, small cast turret, 2pdr
  { match: /matilda/, L: 5.61, W: 2.59, track: 0.35, nose: 'flat', noseLen: 0.5, turret: { x: 0.3, len: 1.9, wid: 1.7, shape: 'cast', bustle: 0.25 }, gun: { bore: 40, len: 2.3 }, cupola: { x: -0.35, y: 0.35, r: 0.3 }, engineDeck: 1.8, skirts: true, driver: 0 },
  // Centurion Mk 3: long hull with side plates, big cast turret with stowage, 20pdr with fume extractor
  { match: /centurion/, L: 7.6, W: 3.38, track: 0.61, nose: 'glacis', noseLen: 1.0, turret: { x: 0, len: 3.3, wid: 3.0, shape: 'cast', bustle: 0.6 }, gun: { bore: 84, len: 5.4, evac: 0.6 }, cupola: { x: -0.6, y: 0.7, r: 0.45 }, loaderHatch: true, engineDeck: 2.6, skirts: true, driver: 1 },
  // M41A3 Walker Bulldog: wedge turret with a long bustle, 76mm with T-shaped muzzle brake
  { match: /arvn_m41/, L: 5.82, W: 3.2, track: 0.53, nose: 'glacis', noseLen: 0.9, turret: { x: -0.1, len: 2.9, wid: 2.4, shape: 'cast', bustle: 0.7 }, gun: { bore: 76, len: 4.1, evac: 0.72, brake: 'tee' }, cupola: { x: -0.6, y: 0.6, r: 0.4 }, loaderHatch: true, engineDeck: 2.2, driver: -1 },
  // Leopard 2A4: flat-faced angular turret, Rh 120 smoothbore, skirts
  { match: /leopard2/, L: 7.72, W: 3.7, track: 0.63, nose: 'glacis', noseLen: 1.1, turret: { x: -0.2, len: 4.6, wid: 3.4, shape: 'angular' }, gun: { bore: 120, len: 5.6, evac: 0.5 }, cupola: { x: -0.5, y: 0.8, r: 0.45 }, loaderHatch: true, engineDeck: 2.6, skirts: true, driver: 1 },
  // Challenger 1: Chobham turret, L11 rifled 120mm with fume extractor and thermal sleeve
  { match: /challenger/, L: 8.33, W: 3.52, track: 0.6, nose: 'glacis', noseLen: 1.3, turret: { x: -0.6, len: 4.4, wid: 3.3, shape: 'angular' }, gun: { bore: 120, len: 5.8, evac: 0.55 }, cupola: { x: -0.6, y: 0.75, r: 0.45 }, loaderHatch: true, engineDeck: 2.8, skirts: true, driver: 0 },
  // M3 Stuart: narrow riveted hull, small welded turret, 37mm
  { match: /armor_m3$/, L: 4.53, W: 2.24, track: 0.3, nose: 'flat', noseLen: 0.5, turret: { x: 0.3, len: 1.5, wid: 1.4, shape: 'box' }, gun: { bore: 37, len: 2.2 }, cupola: { x: -0.3, y: -0.3, r: 0.3 }, engineDeck: 1.5, driver: -1 },
  // M4 Sherman: rounded cast transmission cover, cast turret with bustle, 75mm
  { match: /armor_m4$/, L: 5.84, W: 2.62, track: 0.42, nose: 'round', noseLen: 0.8, turret: { x: 0.2, len: 2.3, wid: 2.0, shape: 'cast', bustle: 0.35 }, gun: { bore: 75, len: 3.2 }, cupola: { x: -0.45, y: 0.45, r: 0.35 }, loaderHatch: true, engineDeck: 2.0, driver: -1 },
  // M46 / M4A3E8 mix in Korea, drawn as the M46 Patton: 90mm with bore evacuator and muzzle brake
  { match: /patton_m46|armor_korea/, L: 6.35, W: 3.51, track: 0.58, nose: 'glacis', noseLen: 0.9, turret: { x: -0.1, len: 2.9, wid: 2.6, shape: 'cast', bustle: 0.45 }, gun: { bore: 90, len: 4.8, evac: 0.72, brake: 'single' }, cupola: { x: -0.5, y: 0.65, r: 0.38 }, loaderHatch: true, engineDeck: 2.3, driver: -1 },
  // M26 Pershing: long low hull, wide cast turret, 90mm M3 with double-baffle brake
  { match: /pershing/, L: 6.33, W: 3.51, track: 0.61, nose: 'glacis', noseLen: 0.9, turret: { x: -0.05, len: 2.8, wid: 2.5, shape: 'cast', bustle: 0.45 }, gun: { bore: 90, len: 4.7, brake: 'double' }, cupola: { x: -0.5, y: 0.6, r: 0.38 }, loaderHatch: true, engineDeck: 2.3, driver: -1 },
  // M1A1: faceted turret with a long bustle and stowage rack, 120mm M256
  { match: /m1a1/, L: 7.92, W: 3.66, track: 0.64, nose: 'glacis', noseLen: 1.2, turret: { x: -0.4, len: 5.0, wid: 3.4, shape: 'angular' }, gun: { bore: 120, len: 5.6, evac: 0.5 }, cupola: { x: -0.4, y: 0.75, r: 0.45 }, loaderHatch: true, engineDeck: 2.6, skirts: true, bustleRack: true, driver: 0 },
  // M1 (105mm): same turret, M68 gun with the evacuator further out
  { match: /m1ip|abrams/, L: 7.92, W: 3.66, track: 0.64, nose: 'glacis', noseLen: 1.2, turret: { x: -0.4, len: 5.0, wid: 3.4, shape: 'angular' }, gun: { bore: 105, len: 5.3, evac: 0.6 }, cupola: { x: -0.4, y: 0.75, r: 0.45 }, loaderHatch: true, engineDeck: 2.6, skirts: true, bustleRack: true, driver: 0 },
  // M551 Sheridan: aluminium hull, flat welded turret, stubby 152mm gun-launcher
  { match: /sheridan/, L: 6.3, W: 2.82, track: 0.44, nose: 'glacis', noseLen: 1.0, turret: { x: -0.2, len: 2.6, wid: 2.3, shape: 'box' }, gun: { bore: 152, len: 2.4 }, cupola: { x: -0.45, y: 0.55, r: 0.35 }, engineDeck: 2.0, driver: 0 },
  // M48 Patton: elliptical cast hull front, egg turret, T-blast deflector
  { match: /m48/, L: 6.87, W: 3.63, track: 0.71, nose: 'boat', noseLen: 1.4, turret: { x: -0.2, len: 3.2, wid: 2.9, shape: 'egg' }, gun: { bore: 90, len: 4.9, evac: 0.72, brake: 'tee' }, cupola: { x: -0.55, y: 0.7, r: 0.5 }, loaderHatch: true, engineDeck: 2.5, driver: 0 },
  // USMC M60A1 RISE with explosive reactive armour tiles (Desert Storm)
  { match: /m60a1_rise/, L: 6.95, W: 3.63, track: 0.71, nose: 'glacis', noseLen: 1.3, turret: { x: -0.1, len: 4.2, wid: 3.0, shape: 'needle' }, gun: { bore: 105, len: 5.4, evac: 0.55 }, cupola: { x: -0.7, y: 0.75, r: 0.55 }, loaderHatch: true, engineDeck: 2.5, era: true, driver: 0 },
  // M60A1: needle-nose turret, 105mm M68
  { match: /m60/, L: 6.95, W: 3.63, track: 0.71, nose: 'glacis', noseLen: 1.3, turret: { x: -0.1, len: 4.2, wid: 3.0, shape: 'needle' }, gun: { bore: 105, len: 5.4, evac: 0.55 }, cupola: { x: -0.7, y: 0.75, r: 0.55 }, loaderHatch: true, engineDeck: 2.5, driver: 0 },
  // Type 95 Ha-Go: tiny hull, turret offset to the left, 37mm
  { match: /type95/, L: 4.38, W: 2.07, track: 0.25, nose: 'flat', noseLen: 0.6, turret: { x: 0.35, y: -0.3, len: 1.5, wid: 1.4, shape: 'cone' }, gun: { bore: 37, len: 1.6 }, engineDeck: 1.6, driver: 1 },
  // Type 97 Chi-Ha: turret offset to the right with the horseshoe antenna, short 57mm
  { match: /type97/, L: 5.55, W: 2.33, track: 0.3, nose: 'flat', noseLen: 0.7, turret: { x: 0.2, y: 0.3, len: 1.8, wid: 1.6, shape: 'cone' }, gun: { bore: 57, len: 1.5 }, engineDeck: 2.0, hachimaki: true, driver: -1 },
  // T-34-85: sloped hull, big turret set forward, 85mm ZiS-S-53, side fuel tanks
  { match: /t34/, L: 6.1, W: 3.0, track: 0.5, nose: 'glacis', noseLen: 1.0, turret: { x: 0.55, len: 3.0, wid: 2.5, shape: 'hex' }, gun: { bore: 85, len: 4.9 }, cupola: { x: -0.6, y: -0.55, r: 0.4 }, loaderHatch: true, engineDeck: 2.2, fenderTanks: 2, rearDrums: true, driver: 0 },
  // IS-3: pike nose, "frying pan" turret, 122mm D-25T with double-baffle brake
  { match: /is3/, L: 6.77, W: 3.07, track: 0.65, nose: 'pike', noseLen: 1.4, turret: { x: -0.2, len: 3.3, wid: 3.0, shape: 'pan' }, gun: { bore: 122, len: 5.9, brake: 'double' }, cupola: { x: -0.6, y: -0.6, r: 0.42 }, engineDeck: 2.4, driver: 0 },
  // T-54/55: dome turret forward, 100mm D-10T with muzzle evacuator, fender fuel cells and rear drums
  { match: /t54|t55/, L: 6.2, W: 3.27, track: 0.58, nose: 'glacis', noseLen: 1.0, turret: { x: 0.7, len: 3.0, wid: 2.9, shape: 'dome' }, gun: { bore: 100, len: 5.6, evac: 0.88 }, cupola: { x: -0.45, y: 0.65, r: 0.4 }, loaderHatch: true, engineDeck: 2.3, fenderTanks: 3, rearDrums: true, driver: -1 },
  // PT-76: long boat hull with trim vane, small conical turret forward, slotted brake
  { match: /pt76/, L: 7.63, W: 3.15, track: 0.36, nose: 'boat', noseLen: 1.6, turret: { x: 1.3, len: 2.3, wid: 2.3, shape: 'cone' }, gun: { bore: 76, len: 3.8, brake: 'slotted' }, cupola: { x: -0.4, y: -0.5, r: 0.35 }, engineDeck: 2.6, trimVane: true, driver: 0 },
  // T-72B: low dome with Kontakt ERA, 125mm 2A46, rear drums and unditching log
  { match: /t72/, L: 6.95, W: 3.59, track: 0.58, nose: 'glacis', noseLen: 1.2, turret: { x: 0.2, len: 3.1, wid: 2.95, shape: 'dome' }, gun: { bore: 125, len: 6.4, evac: 0.42 }, cupola: { x: -0.5, y: 0.7, r: 0.45 }, loaderHatch: true, engineDeck: 2.4, fenderTanks: 3, rearDrums: true, unditchingLog: true, skirts: true, era: true, driver: 0 },
  // T-80B: same family with the wide gas-turbine exhaust grille at the rear
  { match: /t80/, L: 7.0, W: 3.6, track: 0.58, nose: 'glacis', noseLen: 1.2, turret: { x: 0.2, len: 3.1, wid: 2.95, shape: 'dome' }, gun: { bore: 125, len: 6.4, evac: 0.42 }, cupola: { x: -0.5, y: 0.7, r: 0.45 }, loaderHatch: true, engineDeck: 2.8, fenderTanks: 3, skirts: true, era: true, driver: 0 },
];

export function hullPath(ctx: CanvasRenderingContext2D, hl: number, hw: number, nose: Nose, nl: number) {
  const f = hl / 2;
  const r = -hl / 2;
  ctx.beginPath();
  switch (nose) {
    case 'round':
      ctx.moveTo(f - nl, -hw / 2);
      ctx.bezierCurveTo(f - nl * 0.2, -hw / 2, f, -hw * 0.3, f, 0);
      ctx.bezierCurveTo(f, hw * 0.3, f - nl * 0.2, hw / 2, f - nl, hw / 2);
      break;
    case 'boat':
      ctx.moveTo(f - nl, -hw / 2);
      ctx.bezierCurveTo(f - nl * 0.35, -hw / 2, f, -hw * 0.22, f, 0);
      ctx.bezierCurveTo(f, hw * 0.22, f - nl * 0.35, hw / 2, f - nl, hw / 2);
      break;
    case 'pike':
      ctx.moveTo(f - nl, -hw / 2);
      ctx.lineTo(f - nl * 0.15, -hw * 0.08);
      ctx.lineTo(f, 0);
      ctx.lineTo(f - nl * 0.15, hw * 0.08);
      ctx.lineTo(f - nl, hw / 2);
      break;
    case 'glacis':
      ctx.moveTo(f - nl * 0.3, -hw / 2);
      ctx.lineTo(f, -hw * 0.42);
      ctx.lineTo(f, hw * 0.42);
      ctx.lineTo(f - nl * 0.3, hw / 2);
      break;
    default:
      ctx.moveTo(f, -hw / 2);
      ctx.lineTo(f, hw / 2);
  }
  ctx.lineTo(r + 0.6, hw / 2);
  ctx.lineTo(r, hw / 2 - 0.6);
  ctx.lineTo(r, -hw / 2 + 0.6);
  ctx.lineTo(r + 0.6, -hw / 2);
  ctx.closePath();
}

export function turretPath(ctx: CanvasRenderingContext2D, shape: TurretShape, tl: number, tw: number, bustle: number) {
  const a = tl / 2;
  const b = tw / 2;
  ctx.beginPath();
  switch (shape) {
    case 'cast':
      // Rounded cast turret, flattened mantlet face, rear bustle
      ctx.moveTo(a, -b * 0.62);
      ctx.bezierCurveTo(a * 0.6, -b * 1.02, -a * 0.6, -b * 1.02, -a, -b * 0.55);
      ctx.bezierCurveTo(-a - bustle, -b * 0.3, -a - bustle, b * 0.3, -a, b * 0.55);
      ctx.bezierCurveTo(-a * 0.6, b * 1.02, a * 0.6, b * 1.02, a, b * 0.62);
      ctx.closePath();
      break;
    case 'egg':
      ctx.moveTo(a, 0);
      ctx.bezierCurveTo(a, -b * 0.75, a * 0.2, -b, -a * 0.35, -b);
      ctx.bezierCurveTo(-a * 0.95, -b, -a * 1.05, -b * 0.4, -a * 1.05, 0);
      ctx.bezierCurveTo(-a * 1.05, b * 0.4, -a * 0.95, b, -a * 0.35, b);
      ctx.bezierCurveTo(a * 0.2, b, a, b * 0.75, a, 0);
      break;
    case 'needle':
      ctx.moveTo(a, 0);
      ctx.quadraticCurveTo(a * 0.35, -b * 0.98, -a * 0.6, -b);
      ctx.lineTo(-a, -b * 0.72);
      ctx.lineTo(-a, b * 0.72);
      ctx.lineTo(-a * 0.6, b);
      ctx.quadraticCurveTo(a * 0.35, b * 0.98, a, 0);
      break;
    case 'angular':
      // Abrams: sloped cheeks ahead of flat sides, long bustle
      ctx.moveTo(a * 0.62, -b * 0.42);
      ctx.lineTo(a * 0.1, -b);
      ctx.lineTo(-a * 0.55, -b);
      ctx.lineTo(-a, -b * 0.82);
      ctx.lineTo(-a, b * 0.82);
      ctx.lineTo(-a * 0.55, b);
      ctx.lineTo(a * 0.1, b);
      ctx.lineTo(a * 0.62, b * 0.42);
      ctx.closePath();
      break;
    case 'hex':
      // T-34-85 cast turret: narrow flat front, flaring cheeks, rounded rear
      ctx.moveTo(a, -b * 0.55);
      ctx.lineTo(a * 0.35, -b);
      ctx.lineTo(-a * 0.55, -b);
      ctx.quadraticCurveTo(-a * 1.05, -b * 0.95, -a * 1.05, 0);
      ctx.quadraticCurveTo(-a * 1.05, b * 0.95, -a * 0.55, b);
      ctx.lineTo(a * 0.35, b);
      ctx.lineTo(a, b * 0.55);
      ctx.closePath();
      break;
    case 'box':
      ctx.moveTo(a, -b * 0.7);
      ctx.lineTo(a * 0.7, -b);
      ctx.lineTo(-a, -b);
      ctx.lineTo(-a, b);
      ctx.lineTo(a * 0.7, b);
      ctx.lineTo(a, b * 0.7);
      ctx.closePath();
      break;
    case 'cone':
      // Small conical / polygonal turret (Ha-Go, Chi-Ha, PT-76)
      ctx.moveTo(a, -b * 0.5);
      ctx.lineTo(a * 0.4, -b);
      ctx.lineTo(-a * 0.6, -b);
      ctx.lineTo(-a, -b * 0.5);
      ctx.lineTo(-a, b * 0.5);
      ctx.lineTo(-a * 0.6, b);
      ctx.lineTo(a * 0.4, b);
      ctx.lineTo(a, b * 0.5);
      ctx.closePath();
      break;
    default:
      // dome / pan: near-circular low cast turret
      ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
  }
}

export function drawTankPlan(ctx: CanvasRenderingContext2D, p: TankPlan, pal: PlanPalette): void {
  // Compress the size range a little so a Ha-Go is still a readable marker next to an Abrams
  const f = Math.pow(6.3 / p.L, 0.35);
  ctx.save();
  ctx.scale(f, f);
  drawTankPlanBody(ctx, p, pal);
  ctx.restore();
}

function drawTankPlanBody(ctx: CanvasRenderingContext2D, p: TankPlan, pal: PlanPalette): void {
  const hl = p.L * K;
  const ow = p.W * K * WIDEN;
  const tw = p.track * K * WIDEN;
  const hw = ow - tw * 2 + tw * 0.5; // the upper hull / fenders overhang the inner part of the tracks
  const m = (v: number) => v * K;

  drawTracks(ctx, hl, ow, tw, pal);

  // Side skirts (Abrams armour skirts, T-72 rubber flaps) cover the top run
  if (p.skirts) {
    ctx.fillStyle = pal.hullHighlight;
    for (const s of [-1, 1]) ctx.fillRect(-hl / 2 + m(0.5), s < 0 ? -ow / 2 : ow / 2 - tw * 0.8, hl - m(0.9), tw * 0.8);
  }

  // Hull
  hullPath(ctx, hl, hw, p.nose, m(p.noseLen));
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();

  // Glacis plate edge and driver's hatch
  ctx.strokeStyle = pal.hullHighlight;
  ctx.lineWidth = 0.7;
  if (p.nose !== 'flat') {
    ctx.beginPath();
    ctx.moveTo(hl / 2 - m(p.noseLen), -hw / 2 + 0.4);
    ctx.lineTo(hl / 2 - m(p.noseLen), hw / 2 - 0.4);
    ctx.stroke();
  }
  if (p.driver !== undefined) {
    ctx.fillStyle = pal.hullHighlight;
    ctx.beginPath();
    ctx.ellipse(hl / 2 - m(p.noseLen) * 0.75, (p.driver * hw) / 4, m(0.3), m(0.28), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.trimVane) {
    ctx.fillStyle = pal.hullHighlight;
    ctx.fillRect(hl / 2 - m(0.35), -hw * 0.38, m(0.18), hw * 0.76);
  }
  if (p.era) {
    // Kontakt-1 bricks across the glacis
    ctx.fillStyle = 'rgba(255, 179, 0, 0.55)';
    const n = 6;
    for (let i = 0; i < n; i++) ctx.fillRect(hl / 2 - m(p.noseLen) + 0.4, -hw * 0.42 + (i * hw * 0.84) / n + 0.2, m(p.noseLen) * 0.6, (hw * 0.84) / n - 0.4);
  }

  // Engine deck: grilles with slats, exhausts on the rear plate
  const ed = m(p.engineDeck);
  const ex0 = -hl / 2 + 0.8;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(ex0, -hw * 0.36, ed - 1, hw * 0.72);
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.32)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let y = -hw * 0.32; y <= hw * 0.32; y += Math.max(0.9, hw * 0.08)) {
    ctx.moveTo(ex0 + 0.4, y);
    ctx.lineTo(ex0 + ed - 1.4, y);
  }
  ctx.stroke();
  if (p.rearDrums) {
    ctx.fillStyle = '#455A64';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 0.5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(-hl / 2 - m(0.55), s * hw * 0.28 - m(0.3), m(0.55), m(0.6), 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (p.unditchingLog) {
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(-hl / 2 - m(0.35) - (p.rearDrums ? m(0.55) : 0), -hw * 0.46, m(0.25), hw * 0.92);
  }
  if (p.fenderTanks) {
    // External fuel cells along the right fender (T-54/55/72), both sides on the T-34-85
    ctx.fillStyle = '#4E5B52';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 0.5;
    const sides = p.match.source.includes('t34') ? [-1, 1] : [1];
    for (const s of sides) {
      for (let i = 0; i < p.fenderTanks; i++) {
        const x = -hl / 2 + m(0.5) + i * m(0.75);
        ctx.beginPath();
        ctx.roundRect(x, s < 0 ? -ow / 2 + 0.2 : ow / 2 - tw + 0.2, m(0.65), tw - 0.4, 0.5);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // Turret
  const t = p.turret;
  const tx = m(t.x);
  const ty = m(t.y ?? 0);
  const tl = m(t.len);
  const twid = Math.min(m(t.wid) * WIDEN, hw + tw * 0.9);
  ctx.save();
  ctx.translate(tx, ty);
  if (p.bustleRack) {
    ctx.strokeStyle = pal.hullHighlight;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-tl / 2 - m(0.55), -twid * 0.42, m(0.6), twid * 0.84);
  }
  turretPath(ctx, t.shape, tl, twid, m(t.bustle ?? 0));
  ctx.fillStyle = pal.turretFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
  // Subtle roof highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  ctx.ellipse(-tl * 0.05, -twid * 0.12, tl * 0.28, twid * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.era) {
    ctx.strokeStyle = 'rgba(255, 179, 0, 0.75)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, tl / 2 - 0.4, twid / 2 - 0.4, 0, -0.85, 0.85);
    ctx.stroke();
  }
  if (p.hachimaki) {
    // Horseshoe-shaped radio antenna round the turret roof
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.ellipse(-tl * 0.05, 0, tl * 0.62, twid * 0.66, 0, 0.6, Math.PI * 2 - 0.6);
    ctx.stroke();
  }
  // Commander's cupola and loader's hatch
  if (p.cupola) {
    ctx.fillStyle = pal.hullHighlight;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(m(p.cupola.x), m(p.cupola.y), m(p.cupola.r), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (p.loaderHatch) {
      ctx.fillStyle = pal.hullHighlight;
      ctx.fillRect(m(p.cupola.x) - m(0.25), -m(p.cupola.y) - m(0.25), m(0.5), m(0.5));
    }
  }

  // Gun: mantlet, tube, evacuator, muzzle device
  const gw = 0.55 + p.gun.bore * 0.011;
  const g0 = tl / 2 - m(0.1);
  ctx.fillStyle = pal.hullHighlight;
  ctx.fillRect(g0 - m(0.25), -gw * 1.4, m(0.45), gw * 2.8);
  drawGunTube(ctx, g0, m(p.gun.len), 0, p.gun.bore, pal, p.gun.brake, p.gun.evac);
  ctx.restore();
}

/** Track runs with link ticks on both sides of a hull of length hl and overall width ow. */
export function drawTracks(ctx: CanvasRenderingContext2D, hl: number, ow: number, tw: number, pal: PlanPalette): void {
  const m = (v: number) => v * K;
  ctx.fillStyle = pal.trackColor;
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -ow / 2 : ow / 2 - tw;
    ctx.beginPath();
    ctx.roundRect(-hl / 2 - 0.4, y0, hl + 0.8, tw, Math.min(tw / 2, 1.2));
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.35)';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  const pitch = Math.max(1.1, m(0.3));
  for (let x = -hl / 2 + pitch / 2; x < hl / 2; x += pitch) {
    ctx.moveTo(x, -ow / 2);
    ctx.lineTo(x, -ow / 2 + tw);
    ctx.moveTo(x, ow / 2 - tw);
    ctx.lineTo(x, ow / 2);
  }
  ctx.stroke();

}

/** A gun tube from g0 to g1 along x at lateral offset y, with bore evacuator and muzzle device. */
export function drawGunTube(ctx: CanvasRenderingContext2D, g0: number, g1: number, y: number, bore: number, pal: PlanPalette, brake?: 'single' | 'double' | 'slotted' | 'tee', evac?: number): void {
  const m = (v: number) => v * K;
  // Light automatic cannon stay thin so twin and quad mounts read as separate barrels
  const gw = bore < 60 ? 0.35 + bore * 0.008 : 0.55 + bore * 0.011;
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = gw;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(g0, y);
  ctx.lineTo(g1, y);
  ctx.stroke();
  ctx.fillStyle = pal.barrelColor;
  if (evac !== undefined) {
    const ex = g0 + (g1 - g0) * evac;
    ctx.fillRect(ex - m(0.25), y - gw * 0.85, m(0.5), gw * 1.7);
  }
  switch (brake) {
    case 'single':
      ctx.fillRect(g1 - m(0.3), y - gw * 0.95, m(0.3), gw * 1.9);
      break;
    case 'double':
      ctx.fillRect(g1 - m(0.22), y - gw * 1.05, m(0.22), gw * 2.1);
      ctx.fillRect(g1 - m(0.55), y - gw * 1.05, m(0.22), gw * 2.1);
      break;
    case 'slotted':
      ctx.fillRect(g1 - m(0.45), y - gw * 0.9, m(0.45), gw * 1.8);
      break;
    case 'tee':
      ctx.fillRect(g1 - m(0.18), y - gw * 1.25, m(0.18), gw * 2.5);
      break;
  }
}
