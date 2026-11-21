import { Installation, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';
import { AIRFIELD_SCALE } from '../../airfieldLayout';

/**
 * Top-down artwork of airfields and harbour works:
 * - a permanent air base (paved runway, parallel taxiway, hangars, tower, revetments);
 * - an expedient strip the engineers lay down (PSP / Marston matting, dispersal loops, tents);
 * - a FARP (cleared pads, fuel bladders, ammunition racks);
 * - a former civilian airport (terminal, apron, airliner stands);
 * - a pontoon causeway pier, a deep-water port and a floating dry dock.
 * The harbour works are drawn along the installation's angle, which points out to sea.
 */

type Ctx = CanvasRenderingContext2D;

/** Drawing scale of the current airfield body (labels stay at their normal size). */
let BODY_SCALE = 1;

function label(ctx: Ctx, text: string, y: number, color: string): void {
  ctx.save();
  ctx.scale(1 / BODY_SCALE, 1 / BODY_SCALE);
  ctx.fillStyle = color;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, y * BODY_SCALE);
  ctx.restore();
}

function scaled(ctx: Ctx, k: number, draw: () => void): void {
  ctx.save();
  ctx.scale(k, k);
  BODY_SCALE = k;
  draw();
  BODY_SCALE = 1;
  ctx.restore();
}

/** A parked aircraft outline (cross shape) at map scale. */
function parkedPlane(ctx: Ctx, x: number, y: number, a: number, span: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(span * 0.5, 0);
  ctx.lineTo(-span * 0.45, 0);
  ctx.moveTo(span * 0.05, -span * 0.5);
  ctx.lineTo(span * 0.05, span * 0.5);
  ctx.moveTo(-span * 0.38, -span * 0.18);
  ctx.lineTo(-span * 0.38, span * 0.18);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

/** U-shaped earth revetment open toward +y after rotation `a`. */
function revetment(ctx: Ctx, x: number, y: number, a: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = '#8D7B5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s, s);
  ctx.lineTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(s, s);
  ctx.stroke();
  ctx.restore();
}


// ── Air bases ─────────────────────────────────────────────────────────────

export function drawAirfieldSite(rc: RenderContext, inst: Installation, style: InstallationStyle, island?: Island): void {
  const ctx = rc.ctx;
  if (inst.rotaryOnly) return scaled(ctx, AIRFIELD_SCALE.farp, () => drawFarp(rc, inst, style));
  if (inst.wasCivil) return scaled(ctx, AIRFIELD_SCALE.civil, () => drawCivilAirport(rc, inst, style));
  if (inst.id.startsWith('inst-built-')) return scaled(ctx, AIRFIELD_SCALE.expedient, () => drawExpedientStrip(rc, inst, style));
  scaled(ctx, AIRFIELD_SCALE.base, () => drawAirBase(rc, inst, style, island));
}

/** Paved runway with the full marking set (edges, thresholds, numbers, touchdown and aiming points). */
function runway(ctx: Ctx, half: number, w: number, surface: string, numbers: [string, string], blastPads: boolean): void {
  // Shoulders, then the pavement
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(-half - 1, -w / 2 - 1.4, half * 2 + 2, w + 2.8);
  ctx.fillStyle = surface;
  ctx.fillRect(-half, -w / 2, half * 2, w);
  if (blastPads) {
    // Blast pads / overruns with yellow chevrons
    ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
    for (const sgn of [-1, 1]) ctx.fillRect(sgn > 0 ? half : -half - 5, -w / 2, 5, w);
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.85)';
    ctx.lineWidth = 0.5;
    for (const sgn of [-1, 1]) {
      for (let k = 1; k <= 2; k++) {
        const x = sgn * (half + k * 1.6);
        ctx.beginPath();
        ctx.moveTo(x - sgn * 1.4, -w / 2 + 0.6);
        ctx.lineTo(x, 0);
        ctx.lineTo(x - sgn * 1.4, w / 2 - 0.6);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 0.35;
  ctx.strokeRect(-half + 0.6, -w / 2 + 0.6, half * 2 - 1.2, w - 1.2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (const sgn of [-1, 1]) {
    // Threshold bars
    const tx = sgn > 0 ? half - 3.2 : -half + 1.2;
    for (let k = 0; k < 6; k++) ctx.fillRect(tx, -w / 2 + 1.1 + k * ((w - 2.2) / 6), 2, (w - 2.2) / 6 - 0.5);
    // Touchdown zone and aiming point
    const tz = sgn * (half - 12);
    for (const dy of [-1, 1]) ctx.fillRect(tz - 1.5, dy * w * 0.22 - 0.4, 3, 0.8);
    const ap = sgn * (half - 20);
    for (const dy of [-1, 1]) ctx.fillRect(ap - 2.5, dy * w * 0.25 - 0.7, 5, 1.4);
  }
  // Runway designators, read from each approach
  ctx.save();
  ctx.font = `bold ${Math.max(2.4, w * 0.32)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(-half + 6.5, 0);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(numbers[0], 0, 0);
  ctx.restore();
  ctx.save();
  ctx.font = `bold ${Math.max(2.4, w * 0.32)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(half - 6.5, 0);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(numbers[1], 0, 0);
  ctx.restore();
  // Centreline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 0.35;
  ctx.setLineDash([3, 2.2]);
  ctx.beginPath();
  ctx.moveTo(-half + 10, 0);
  ctx.lineTo(half - 10, 0);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Taxiway strip with its yellow centreline. */
function taxiway(ctx: Ctx, pts: [number, number][], w: number, surface: string): void {
  ctx.strokeStyle = surface;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.8)';
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function windsock(ctx: Ctx, x: number, y: number): void {
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FF7043';
  ctx.beginPath();
  ctx.moveTo(x, y - 0.5);
  ctx.lineTo(x + 3, y - 0.2);
  ctx.lineTo(x + 3, y + 0.2);
  ctx.lineTo(x, y + 0.5);
  ctx.closePath();
  ctx.fill();
}

/** Control tower: base building and the glazed cab. */
function tower(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
  ctx.fillStyle = '#37474F';
  ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
  ctx.fillStyle = 'rgba(129, 212, 250, 0.85)';
  ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
}

function fuelFarm(ctx: Ctx, x: number, y: number, n: number): void {
  ctx.strokeStyle = 'rgba(141, 123, 90, 0.9)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x - 1.5, y - 4.5, n * 4.4 + 1, 9);
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = '#CFD8DC';
    ctx.beginPath();
    ctx.arc(x + 1.6 + k * 4.4, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.2;
    ctx.stroke();
  }
}

/**
 * Permanent military air base: runway with full markings and overruns, a parallel taxiway with
 * links, the apron with tower, fire station, hangars of the era and the fuel farm on one side,
 * and on the other the dispersal: WWII hardstands on a loop, revetments, or hardened shelters.
 */
function drawAirBase(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  const pale = rc.era === 'era1' || rc.era === 'era2';
  const surface = pale ? '#C8C0A4' : '#30363A';
  const taxi = pale ? '#B4AC90' : '#3C4347';
  // Perimeter track
  ctx.strokeStyle = 'rgba(121, 85, 72, 0.6)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 1.4]);
  ctx.strokeRect(-70, -30, 140, 60);
  ctx.setLineDash([]);
  runway(ctx, 64, 10, surface, ['09', '27'], !pale);
  // Parallel taxiway and links (angled high-speed exits from Korea on)
  taxiway(ctx, [[-58, 13], [58, 13]], 3.2, taxi);
  for (const x of [-58, 58]) taxiway(ctx, [[x, 5], [x, 13]], 3, taxi);
  for (const x of [-18, 22]) taxiway(ctx, pale ? [[x, 5], [x, 13]] : [[x - 6, 5], [x, 13]], 3, taxi);
  // Apron with stand lead-in lines and parked aircraft
  ctx.fillStyle = taxi;
  ctx.fillRect(-28, 15, 44, 10);
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.7)';
  ctx.lineWidth = 0.25;
  for (const x of [-22, -10, 2]) {
    ctx.beginPath();
    ctx.moveTo(x, 15);
    ctx.lineTo(x, 21);
    ctx.stroke();
    parkedPlane(ctx, x, 20, Math.PI / 2, 8, color);
  }
  // Hangars of the era
  for (const hx of [20, 33]) {
    if (pale) {
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.roundRect(hx, 17, 11, 8, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.3;
      for (let k = 1; k < 6; k++) {
        ctx.beginPath();
        ctx.moveTo(hx + k * 1.8, 17);
        ctx.lineTo(hx + k * 1.8, 25);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#546E7A';
      ctx.fillRect(hx, 17, 11, 9);
      ctx.fillStyle = '#455A64';
      ctx.fillRect(hx, 17, 11, 1.4);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 0.3;
      ctx.strokeRect(hx, 17, 11, 9);
    }
  }
  tower(ctx, -36, 19);
  // Fire station beside the tower
  ctx.fillStyle = '#C62828';
  ctx.fillRect(-42, 23, 4, 3);
  fuelFarm(ctx, -62, 22, 3);
  if (!pale) {
    // Approach radar
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(52, 23, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  windsock(ctx, 58, -8);
  // Dispersal on the far side
  if (pale) {
    // WWII: a taxi loop with hardstands, aircraft in revetments
    taxiway(ctx, [[-50, -5], [-50, -16], [-30, -24], [0, -26], [30, -24], [50, -16], [50, -5]], 2.6, taxi);
    for (const x of [-38, -18, 2, 22, 40]) {
      ctx.fillStyle = taxi;
      ctx.beginPath();
      ctx.arc(x, -26, 3.2, 0, Math.PI * 2);
      ctx.fill();
      revetment(ctx, x, -27, Math.PI, 4.2);
      parkedPlane(ctx, x, -26, -Math.PI / 2, 7, color);
    }
  } else if (rc.era === 'era5') {
    // Hardened aircraft shelters on taxi links
    taxiway(ctx, [[-50, -5], [-50, -18], [50, -18], [50, -5]], 2.6, taxi);
    for (const x of [-40, -24, -8, 8, 24, 40]) {
      taxiway(ctx, [[x, -18], [x, -22]], 2, taxi);
      ctx.fillStyle = '#7A817C';
      ctx.beginPath();
      ctx.ellipse(x, -26, 4.6, 4, 0, Math.PI, 0);
      ctx.lineTo(x + 4.6, -22);
      ctx.lineTo(x - 4.6, -22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }
  } else {
    // Revetted dispersal along a parallel track
    taxiway(ctx, [[-50, -5], [-50, -18], [50, -18], [50, -5]], 2.6, taxi);
    for (const x of [-36, -18, 0, 18, 36]) {
      revetment(ctx, x, -24, 0, 4.2);
      parkedPlane(ctx, x, -23, -Math.PI / 2, 7.5, color);
    }
  }
  label(ctx, isPlayer ? '✈️ [友軍航空基地]' : '✈️ [敵軍航空基地]', -34, labelColor);
}

/**
 * Expedient strip: one long, narrow mat runway (PSP / AM-2) with a turning pad at each end, a
 * single stub to a small dispersal of hardstands, tents, a fuel dump and a windsock. No tower:
 * the field is run from a jeep with a radio.
 */
function drawExpedientStrip(rc: RenderContext, _inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  const am2 = rc.era === 'era4' || rc.era === 'era5';
  const mat = am2 ? '#9AA3A6' : '#6F7A70';
  // Graded and cleared strip
  ctx.fillStyle = 'rgba(141, 110, 80, 0.5)';
  ctx.fillRect(-66, -6, 132, 12);
  // Mat runway: long and narrow
  ctx.fillStyle = mat;
  ctx.fillRect(-62, -3, 124, 6);
  ctx.strokeStyle = 'rgba(30, 35, 30, 0.5)';
  ctx.lineWidth = 0.25;
  for (let x = -62; x <= 62; x += 1.6) {
    ctx.beginPath();
    ctx.moveTo(x, -3);
    ctx.lineTo(x, 3);
    ctx.stroke();
  }
  if (!am2) {
    ctx.fillStyle = 'rgba(30, 35, 30, 0.35)';
    for (let x = -61; x < 62; x += 3) for (const y of [-1.6, 0, 1.6]) ctx.fillRect(x, y, 0.5, 0.5);
  }
  // Turning pads at both ends
  for (const x of [-62, 62]) {
    ctx.fillStyle = mat;
    ctx.beginPath();
    ctx.arc(x, 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // White panel markers at the thresholds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (const x of [-58, 56]) {
    ctx.fillRect(x, -2.6, 2, 1);
    ctx.fillRect(x, 1.6, 2, 1);
  }
  // Single stub to the dispersal hardstands
  taxiway(ctx, [[-6, 3], [-6, 9], [-26, 9], [16, 9]], 2.2, mat);
  for (const x of [-24, -12, 2, 14]) {
    ctx.fillStyle = mat;
    ctx.fillRect(x - 3, 10, 6, 5);
    parkedPlane(ctx, x, 13, Math.PI / 2, 6.5, color);
  }
  // Ops tent and jeep, tents, fuel drums, windsock
  ctx.fillStyle = '#6B7B45';
  for (const [x, y] of [[28, 10], [35, 10], [28, 14]] as const) ctx.fillRect(x, y, 5, 3);
  ctx.fillStyle = '#3E4D24';
  ctx.fillRect(40, 11, 3.6, 2);
  ctx.fillStyle = '#33691E';
  for (let k = 0; k < 8; k++) {
    ctx.beginPath();
    ctx.arc(46 + (k % 4) * 1.6, 10 + Math.floor(k / 4) * 1.6, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  windsock(ctx, 60, -6);
  label(ctx, am2 ? '🛬 [急造前進機場] AM-2 鋁板跑道' : '🛬 [急造前進機場] PSP 鋼板跑道', -12, labelColor);
}

/** FARP: three cleared landing pads, fuel bladders and ammunition racks, a few tents. */
function drawFarp(rc: RenderContext, _inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  ctx.fillStyle = 'rgba(141, 110, 80, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y] of [[-16, -6], [0, -9], [16, -6]] as const) {
    ctx.fillStyle = '#5D5348';
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 2.5);
    ctx.lineTo(x - 2, y + 2.5);
    ctx.moveTo(x + 2, y - 2.5);
    ctx.lineTo(x + 2, y + 2.5);
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + 2, y);
    ctx.stroke();
  }
  // Fuel bladders and hose lines to the pads
  ctx.fillStyle = '#263238';
  for (const x of [-10, 2]) {
    ctx.beginPath();
    ctx.ellipse(x, 9, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 179, 0, 0.7)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-10, 9);
  ctx.lineTo(-16, -1);
  ctx.moveTo(2, 9);
  ctx.lineTo(0, -4);
  ctx.moveTo(2, 9);
  ctx.lineTo(16, -1);
  ctx.stroke();
  // Ammunition racks and tents
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(12, 6, 8, 2.4);
  ctx.fillRect(12, 9.5, 8, 2.4);
  ctx.fillStyle = '#6B7B45';
  ctx.fillRect(-26, 4, 6, 4);
  ctx.strokeStyle = color;
  ctx.strokeRect(-26, 4, 6, 4);
  label(ctx, '🚁 [FARP 前進加油彈藥點] 直升機專用', -22, labelColor);
}

/**
 * A (former) civilian airport: a long paved runway, full parallel taxiway, a terminal with
 * boarding piers (jet bridges from the 1960s), the airliner apron, tower, cargo shed, fuel farm,
 * car park and the access road.
 */
function drawCivilAirport(rc: RenderContext, inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { labelColor } = style;
  const surface = '#33393C';
  const taxi = '#41484B';
  runway(ctx, 68, 11, surface, ['07', '25'], true);
  taxiway(ctx, [[-62, 14], [62, 14]], 3.4, taxi);
  for (const x of [-62, -28, 6, 40, 62]) taxiway(ctx, [[x, 5.5], [x, 14]], 3, taxi);
  // Apron and terminal
  ctx.fillStyle = taxi;
  ctx.fillRect(-36, 16, 60, 10);
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(-32, 26, 50, 5);
  ctx.fillStyle = 'rgba(129, 212, 250, 0.75)';
  ctx.fillRect(-31, 26, 48, 1);
  const bridges = rc.era === 'era4' || rc.era === 'era5';
  for (const x of [-26, -12, 2]) {
    if (bridges) {
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(x - 0.6, 21, 1.2, 5);
    }
    // Stand markings and an airliner
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.7)';
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(x, 16);
    ctx.lineTo(x, 22);
    ctx.stroke();
    parkedPlane(ctx, x, 19.5, Math.PI / 2, 10, '#ECEFF1');
  }
  tower(ctx, 22, 20);
  // Cargo shed and fuel farm
  ctx.fillStyle = '#78909C';
  ctx.fillRect(30, 17, 12, 8);
  fuelFarm(ctx, 48, 21, 3);
  // Car park and access road out of the field
  ctx.fillStyle = 'rgba(90, 96, 100, 0.9)';
  ctx.fillRect(-24, 31.5, 30, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.2;
  for (let x = -22; x < 6; x += 2) {
    ctx.beginPath();
    ctx.moveTo(x, 31.5);
    ctx.lineTo(x, 34.5);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5D6366';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, 33);
  ctx.lineTo(70, 33);
  ctx.stroke();
  windsock(ctx, 64, -9);
  const owner = inst.side === 'player' ? '我方控制' : inst.side === 'enemy' ? '敵方控制' : '中立';
  label(ctx, `🛫 [原民用機場] ${owner}`, -14, labelColor);
}

// ── Harbour works (drawn along the seaward angle) ─────────────────────────

/** Pontoon causeway pier: ranks of steel pontoon sections from the beach out to the berth. */
export function drawPontoonPierSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Causeway: two ranks of pontoon cells
  for (let x = -26; x < 30; x += 4.6) {
    for (const y of [-4.4, 0]) {
      ctx.fillStyle = '#607D8B';
      ctx.fillRect(x, y, 4.2, 4.2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 0.4;
      ctx.strokeRect(x, y, 4.2, 4.2);
    }
  }
  // Pier head (wider barge) with bollards and a crawler crane
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(28, -10, 12, 20);
  ctx.fillStyle = '#ECEFF1';
  for (const y of [-8, 8]) {
    ctx.beginPath();
    ctx.arc(39, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(44, -6);
  ctx.stroke();
  // A landing craft alongside
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.fillRect(30, 11, 11, 4.4);
  ctx.strokeRect(30, 11, 11, 4.4);
  ctx.restore();
  ctx.fillStyle = '#80D8FF';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓ [急造棧橋港] 浮箱棧道', 0, -20);
  if (inst.upgradeTimer && inst.upgradeTimer > 0) {
    const upProg = Math.min(1, inst.upgradeTimer / 35.0);
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`🔨 工兵拓建中: ${Math.round(inst.upgradeTimer)}s / 35s`, 0, 26);
    ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
    ctx.fillRect(-20, 29, 40, 3.5);
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(-20, 29, 40 * upProg, 3.5);
  }
}

/** Deep-water port: concrete quays and finger piers, warehouses, gantry cranes, a breakwater. */
export function drawMajorPortSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Quay apron along the shore
  ctx.fillStyle = '#8A8F91';
  ctx.fillRect(-30, -34, 22, 68);
  // Warehouses
  ctx.fillStyle = '#6D4C41';
  for (const y of [-30, -16, -2, 12]) {
    ctx.fillRect(-28, y, 12, 11);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-28, y, 12, 11);
  }
  // Two finger piers with a ship at one
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(-8, -24, 40, 7);
  ctx.fillRect(-8, 10, 40, 7);
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-4, -14);
  ctx.lineTo(28, -14);
  ctx.lineTo(34, -11);
  ctx.lineTo(28, -8);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cranes: derricks and travelling cranes before the container age, gantries after
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  const gantries = rc.era === 'era4' || rc.era === 'era5';
  for (const [x, y] of [[4, -24], [18, -24], [10, 10]] as const) {
    if (gantries) {
      ctx.strokeRect(x, y - 2, 5, 11);
      ctx.beginPath();
      ctx.moveTo(x + 2.5, y + 4);
      ctx.lineTo(x + 2.5, y + 14);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + 2.5, y + 3, 1.6, 0, Math.PI * 2);
      ctx.moveTo(x + 2.5, y + 3);
      ctx.lineTo(x + 9, y + 9);
      ctx.stroke();
    }
  }
  // Breakwater
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, -36);
  ctx.quadraticCurveTo(52, 0, 40, 36);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓【正規深水軍港】全島戰略樞紐', 0, -42);
}

/** Floating dry dock: U-shaped hull with wing walls and cranes, a ship on the blocks inside. */
export function drawRepairDockSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Dock floor and wing walls
  ctx.fillStyle = '#455A64';
  ctx.fillRect(-30, -12, 60, 24);
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(-30, -12, 60, 4);
  ctx.fillRect(-30, 8, 60, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-30, -12, 60, 24);
  // Keel blocks and the ship under repair
  ctx.fillStyle = '#8D6E63';
  for (let x = -22; x <= 20; x += 6) ctx.fillRect(x, -1, 2, 2);
  ctx.fillStyle = 'rgba(20, 30, 40, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.lineTo(18, -4);
  ctx.lineTo(25, 0);
  ctx.lineTo(18, 4);
  ctx.lineTo(-24, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wing-wall cranes and the open stern gate
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  for (const [x, y, d] of [[-14, -10, -1], [10, 10, 1]] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y + 6 * d);
    ctx.stroke();
  }
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(28, -8, 2, 16);
  // Welding sparks
  if (Math.sin(rc.time * 9) > 0.3) {
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(-6, -4, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🔧 [浮動乾塢] 艦艇維修', 0, -22);
}

/** A (former) civilian railway station: platforms along the line, the station building, sidings with wagons. */
export function drawRailStationSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { labelColor } = style;
  ctx.save();
  // Tracks: main line and two sidings
  ctx.strokeStyle = 'rgba(30, 30, 34, 0.9)';
  ctx.lineWidth = 1.2;
  for (const y of [18, 10, 2]) {
    ctx.beginPath();
    ctx.moveTo(-36, y);
    ctx.lineTo(36, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([0.8, 3]);
  for (const y of [18, 10, 2]) {
    ctx.beginPath();
    ctx.moveTo(-36, y);
    ctx.lineTo(36, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Platforms and the station building
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(-28, 12.5, 56, 3);
  ctx.fillRect(-28, 4.5, 56, 3);
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-16, -12, 32, 12);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-16, -12, 32, 3);
  ctx.fillStyle = 'rgba(255, 224, 130, 0.6)';
  for (let x = -13; x < 14; x += 5) ctx.fillRect(x, -6, 2.4, 2.4);
  // Goods wagons on the siding
  ctx.fillStyle = '#5D4037';
  for (const x of [-30, -20, -10]) ctx.fillRect(x, 0.4, 8, 3.2);
  ctx.restore();
  const owner = inst.side === 'player' ? '我方控制' : inst.side === 'enemy' ? '敵方控制' : '中立';
  label(ctx, `🚉 [${inst.name.split(' (')[0]}] ${owner}`, -22, labelColor);
}
