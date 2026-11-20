// Single-engine piston aircraft drawn from their real planforms (top view, nose along +x).
import { Aircraft, AircraftModel } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawNationalInsignia } from '../nation';
import { TAIL_SPECS } from '../tails';
import { AircraftDrawerTable } from './types';

/**
 * Top-view data for each airframe, scaled from its real dimensions (~2.3 map units per metre):
 * the wing's span, root and tip chords, leading-edge sweep and tip shape; the fuselage nose
 * (a broad radial cowling or a pointed inline nose); the canopy; and the details that identify
 * the type from above.
 */
interface PistonSpec {
  span: number;
  rootChord: number;
  tipChord: number;
  /** Leading edge at the root (x). */
  wingX: number;
  /** How far back the leading edge is at the tip. */
  sweep: number;
  tip: 'round' | 'square' | 'elliptical';
  /** Inverted-gull crease (F4U), drawn as the bend line on each wing. */
  gull?: boolean;
  nose: 'radial' | 'inline';
  /** Fuselage maximum width. */
  width: number;
  canopy: { x: number; len: number; kind: 'bubble' | 'framed' | 'greenhouse' };
  body: string;
  wing: string;
  spats?: boolean;
  floats?: boolean;
  diveFlaps?: boolean;
  ballTurret?: boolean;
  corrugated?: boolean;
  /** Belly radiator (inline-engined types). */
  radiator?: boolean;
}

const NOSE_X = 13.6;
const IJN_GREY = { body: '#232A22', wing: '#2B3327' }; // ameiro / hairyokushoku
const IJN_GREEN = { body: '#10241A', wing: '#15301F' }; // late-war dark green
const IJA_GREEN = { body: '#1A2A18', wing: '#22341F' };
const USN_BLUE = { body: '#0C1C2E', wing: '#12273D' }; // non-specular blue-grey / sea blue
const USAAF_OD = { body: '#20261A', wing: '#2A3122' }; // olive drab
const USAAF_NMF = { body: '#2A3036', wing: '#343B42' }; // natural metal (late P-51D)
const RAF_GREEN = { body: '#1F2A20', wing: '#283528' }; // dark green / ocean grey
const VVS_GREEN = { body: '#22301E', wing: '#2B3B26' };

const SPECS: Partial<Record<AircraftModel, PistonSpec>> = {
  // Imperial Japanese Navy and Army
  zero: { span: 27.6, rootChord: 6.2, tipChord: 3, wingX: 5.5, sweep: 1.2, tip: 'round', nose: 'radial', width: 3.6, canopy: { x: 3.5, len: 6.5, kind: 'framed' }, ...IJN_GREY },
  zero_a6m2: { span: 27.6, rootChord: 6.2, tipChord: 3, wingX: 5.5, sweep: 1.2, tip: 'round', nose: 'radial', width: 3.6, canopy: { x: 3.5, len: 6.5, kind: 'framed' }, ...IJN_GREY },
  zero_a6m5: { span: 25.3, rootChord: 6.2, tipChord: 3.6, wingX: 5.5, sweep: 1, tip: 'square', nose: 'radial', width: 3.6, canopy: { x: 3.5, len: 6.5, kind: 'framed' }, ...IJN_GREEN },
  kamikaze_zero: { span: 25.3, rootChord: 6.2, tipChord: 3.6, wingX: 5.5, sweep: 1, tip: 'square', nose: 'radial', width: 3.6, canopy: { x: 3.5, len: 6.5, kind: 'framed' }, ...IJN_GREEN },
  rufe: { span: 27.6, rootChord: 6.2, tipChord: 3, wingX: 5.5, sweep: 1.2, tip: 'round', nose: 'radial', width: 3.6, canopy: { x: 3.5, len: 6.5, kind: 'framed' }, floats: true, ...IJN_GREY },
  ki61: { span: 27.6, rootChord: 5, tipChord: 2.2, wingX: 4.5, sweep: 0.8, tip: 'round', nose: 'inline', width: 3, canopy: { x: 2, len: 5.5, kind: 'framed' }, radiator: true, ...IJA_GREEN },
  ki84: { span: 25.8, rootChord: 5.6, tipChord: 2.4, wingX: 5, sweep: 1, tip: 'round', nose: 'radial', width: 3.6, canopy: { x: 2.5, len: 5, kind: 'bubble' }, ...IJA_GREEN },
  george: { span: 27.6, rootChord: 6, tipChord: 2.8, wingX: 5, sweep: 1.4, tip: 'square', nose: 'radial', width: 3.9, canopy: { x: 2.5, len: 5.5, kind: 'framed' }, ...IJN_GREEN },
  val: { span: 33, rootChord: 6.6, tipChord: 2.4, wingX: 5.5, sweep: 0, tip: 'elliptical', nose: 'radial', width: 3.8, canopy: { x: 3.5, len: 9, kind: 'framed' }, spats: true, diveFlaps: true, ...IJN_GREY },
  judy: { span: 26.5, rootChord: 5.8, tipChord: 2.8, wingX: 3.5, sweep: 0.8, tip: 'square', nose: 'inline', width: 3, canopy: { x: 3, len: 9, kind: 'greenhouse' }, ...IJN_GREEN },
  kate: { span: 35.7, rootChord: 7, tipChord: 2.8, wingX: 4.5, sweep: 1.6, tip: 'round', nose: 'radial', width: 3.9, canopy: { x: 3.5, len: 11, kind: 'greenhouse' }, ...IJN_GREEN },
  jill: { span: 34.3, rootChord: 6.8, tipChord: 2.8, wingX: 4, sweep: 1.4, tip: 'round', nose: 'radial', width: 4.1, canopy: { x: 3, len: 10, kind: 'greenhouse' }, ...IJN_GREEN },
  // USAAF, RAF / Commonwealth and Soviet single-seaters and attack aircraft
  hurricane: { span: 28, rootChord: 7.2, tipChord: 3.4, wingX: 5, sweep: 1, tip: 'round', nose: 'inline', width: 3.6, canopy: { x: 1.5, len: 5, kind: 'framed' }, ...RAF_GREEN },
  seafire: { span: 25.8, rootChord: 6.6, tipChord: 1.8, wingX: 5, sweep: 0, tip: 'elliptical', nose: 'inline', width: 3.2, canopy: { x: 1.5, len: 4.5, kind: 'framed' }, ...RAF_GREEN },
  tempest: { span: 28.7, rootChord: 6.6, tipChord: 2, wingX: 5, sweep: 0, tip: 'elliptical', nose: 'inline', width: 3.8, canopy: { x: 1.5, len: 4.5, kind: 'bubble' }, radiator: true, ...RAF_GREEN },
  sea_fury: { span: 27, rootChord: 6.8, tipChord: 2, wingX: 5, sweep: 0, tip: 'elliptical', nose: 'radial', width: 4, canopy: { x: 1.5, len: 4.5, kind: 'bubble' }, ...RAF_GREEN },
  boomerang: { span: 25, rootChord: 6.2, tipChord: 2.8, wingX: 5, sweep: 1, tip: 'round', nose: 'radial', width: 4, canopy: { x: 2, len: 5, kind: 'framed' }, ...RAF_GREEN },
  p36a: { span: 26, rootChord: 6.2, tipChord: 2.8, wingX: 5, sweep: 1.2, tip: 'round', nose: 'radial', width: 3.8, canopy: { x: 2, len: 5, kind: 'framed' }, ...USAAF_OD },
  p39d: { span: 24, rootChord: 5.8, tipChord: 2.8, wingX: 4.5, sweep: 0.8, tip: 'round', nose: 'inline', width: 3.2, canopy: { x: 4, len: 4.5, kind: 'framed' }, ...USAAF_OD },
  p47: { span: 28.5, rootChord: 7.6, tipChord: 2.4, wingX: 5, sweep: 0, tip: 'elliptical', nose: 'radial', width: 5, canopy: { x: 1.5, len: 5, kind: 'bubble' }, ...USAAF_OD },
  p51: { span: 26, rootChord: 6.4, tipChord: 3, wingX: 4, sweep: 0.4, tip: 'square', nose: 'inline', width: 3.2, canopy: { x: 1.5, len: 4.5, kind: 'bubble' }, radiator: true, ...USAAF_NMF },
  rokaf_p51: { span: 26, rootChord: 6.4, tipChord: 3, wingX: 4, sweep: 0.4, tip: 'square', nose: 'inline', width: 3.2, canopy: { x: 1.5, len: 4.5, kind: 'bubble' }, radiator: true, ...USAAF_NMF },
  f8f: { span: 25, rootChord: 5.8, tipChord: 3.2, wingX: 5, sweep: 0.6, tip: 'square', nose: 'radial', width: 4, canopy: { x: 2, len: 4.5, kind: 'bubble' }, ...USN_BLUE },
  yak9: { span: 22.5, rootChord: 5.6, tipChord: 2.4, wingX: 4.5, sweep: 1, tip: 'round', nose: 'inline', width: 3, canopy: { x: 1.5, len: 4.5, kind: 'framed' }, radiator: true, ...VVS_GREEN },
  il10: { span: 31, rootChord: 7, tipChord: 3, wingX: 5, sweep: 1.6, tip: 'square', nose: 'inline', width: 3.8, canopy: { x: 3, len: 7, kind: 'framed' }, radiator: true, ...VVS_GREEN },
  // US Navy carrier aircraft
  f4f: { span: 26.7, rootChord: 6.2, tipChord: 3.6, wingX: 5, sweep: 0.6, tip: 'square', nose: 'radial', width: 4, canopy: { x: 2.5, len: 5, kind: 'framed' }, ...USN_BLUE },
  sbd: { span: 29.2, rootChord: 7, tipChord: 2.8, wingX: 5, sweep: 1.4, tip: 'round', nose: 'radial', width: 3.8, canopy: { x: 3.5, len: 9.5, kind: 'greenhouse' }, diveFlaps: true, ...USN_BLUE },
  tbd: { span: 35, rootChord: 7.4, tipChord: 2.8, wingX: 4.5, sweep: 1.6, tip: 'round', nose: 'radial', width: 3.8, canopy: { x: 4, len: 12, kind: 'greenhouse' }, corrugated: true, ...USN_BLUE },
  f6f: { span: 30, rootChord: 7, tipChord: 4, wingX: 5, sweep: 0.8, tip: 'square', nose: 'radial', width: 4.4, canopy: { x: 2, len: 5, kind: 'framed' }, ...USN_BLUE },
  f4u: { span: 28.8, rootChord: 6.6, tipChord: 3, wingX: 3, sweep: 0.8, tip: 'round', gull: true, nose: 'radial', width: 3.9, canopy: { x: -1, len: 5, kind: 'framed' }, ...USN_BLUE },
  sb2c: { span: 35, rootChord: 7.2, tipChord: 3.2, wingX: 5, sweep: 1.2, tip: 'square', nose: 'radial', width: 4.2, canopy: { x: 4, len: 10, kind: 'greenhouse' }, diveFlaps: true, ...USN_BLUE },
  tbf: { span: 38, rootChord: 8, tipChord: 3.4, wingX: 5, sweep: 1.2, tip: 'square', nose: 'radial', width: 4.8, canopy: { x: 4, len: 10, kind: 'greenhouse' }, ballTurret: true, ...USN_BLUE },
};

/** Leading and trailing edge of one wing (y ≥ 0), from root to tip. */
function wingOutline(s: PistonSpec): { le: [number, number][]; te: [number, number][] } {
  const half = s.span / 2;
  const le: [number, number][] = [];
  const te: [number, number][] = [];
  const n = 12;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const y = Math.max(1.4, half * f);
    let chord: number;
    let lead: number;
    if (s.tip === 'elliptical') {
      // Elliptical chord distribution about a straight quarter-chord line
      chord = Math.max(0.6, s.rootChord * Math.sqrt(Math.max(0, 1 - f * f)));
      lead = s.wingX - s.rootChord * 0.25 + chord * 0.25;
    } else {
      chord = s.rootChord + (s.tipChord - s.rootChord) * f;
      lead = s.wingX - s.sweep * f;
      if (s.tip === 'round' && f > 0.8) {
        // Rounded tip: the chord closes in a quarter-ellipse over the last 20 % of the span
        const g = (f - 0.8) / 0.2;
        const k = Math.sqrt(Math.max(0.02, 1 - g * g));
        lead -= chord * (1 - k) * 0.5;
        chord *= k;
      }
    }
    le.push([lead, y]);
    te.push([lead - chord, y]);
  }
  return { le, te };
}

function drawWings(ctx: CanvasRenderingContext2D, s: PistonSpec): void {
  const { le, te } = wingOutline(s);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    le.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y * side) : ctx.lineTo(x, y * side)));
    for (let i = te.length - 1; i >= 0; i--) ctx.lineTo(te[i][0], te[i][1] * side);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawFuselage(ctx: CanvasRenderingContext2D, s: PistonSpec, tailX: number): void {
  const w = s.width / 2;
  ctx.beginPath();
  if (s.nose === 'radial') {
    // Blunt cowling, widest just behind it, tapering to the tail
    ctx.moveTo(NOSE_X, -w * 0.95);
    ctx.lineTo(NOSE_X, w * 0.95);
    ctx.quadraticCurveTo(NOSE_X - 4, w * 1.05, NOSE_X - 7, w);
  } else {
    // Pointed inline nose with spinner
    ctx.moveTo(NOSE_X + 1.2, 0);
    ctx.quadraticCurveTo(NOSE_X - 2, w * 0.9, NOSE_X - 6, w);
  }
  ctx.quadraticCurveTo(tailX + 4, w * 0.75, tailX, w * 0.3);
  ctx.lineTo(tailX, -w * 0.3);
  ctx.quadraticCurveTo(tailX + 4, -w * 0.75, s.nose === 'radial' ? NOSE_X - 7 : NOSE_X - 6, -w);
  if (s.nose === 'radial') ctx.quadraticCurveTo(NOSE_X - 4, -w * 1.05, NOSE_X, -w * 0.95);
  else ctx.quadraticCurveTo(NOSE_X - 2, -w * 0.9, NOSE_X + 1.2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (s.nose === 'radial') {
    // Cowling ring
    ctx.save();
    ctx.strokeStyle = '#455A64';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(NOSE_X - 2.2, -w * 0.98);
    ctx.lineTo(NOSE_X - 2.2, w * 0.98);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCanopy(ctx: CanvasRenderingContext2D, s: PistonSpec): void {
  const { x, len, kind } = s.canopy;
  const half = s.width * (kind === 'bubble' ? 0.32 : 0.3);
  ctx.save();
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.8)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(x - len / 2, 0, len / 2, half, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kind !== 'bubble') {
    // Frame bars: more for a long multi-seat greenhouse
    const bars = kind === 'greenhouse' ? Math.round(len / 1.8) : 2;
    for (let k = 1; k <= bars; k++) {
      const bx = x - (len * k) / (bars + 1);
      ctx.beginPath();
      ctx.moveTo(bx, -half);
      ctx.lineTo(bx, half);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPiston(rc: RenderContext, plane: Aircraft, s: PistonSpec): void {
  const ctx = rc.ctx;
  const tailX = (TAIL_SPECS[plane.model]?.x ?? -10) + 0.5;
  const half = s.span / 2;
  // Floats under the Rufe: a long central float and two wingtip floats
  if (s.floats) {
    ctx.save();
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.ellipse(4, 0, 10, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s.wingX - 3, side * half * 0.82, 3, 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = s.wing;
  drawWings(ctx, s);
  // Wing detail
  const { le, te } = wingOutline(s);
  ctx.save();
  ctx.lineWidth = 0.6;
  if (s.gull) {
    // Inverted-gull bend
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.6)';
    const k = 4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(le[k][0], le[k][1] * side);
      ctx.lineTo(te[k][0], te[k][1] * side);
      ctx.stroke();
    }
  }
  if (s.corrugated) {
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.25)';
    for (let k = 2; k < le.length - 1; k += 1) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(le[k][0] - 0.5, le[k][1] * side);
        ctx.lineTo(te[k][0] + 0.5, te[k][1] * side);
        ctx.stroke();
      }
    }
  }
  if (s.diveFlaps) {
    // Perforated split dive flaps along the trailing edge (SBD, SB2C) / underwing brakes (Val)
    ctx.fillStyle = 'rgba(239, 83, 80, 0.85)';
    for (let k = 1; k < 8; k++) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(te[k][0] + 0.9, te[k][1] * side, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  if (s.spats) {
    // Fixed spatted undercarriage (Val)
    ctx.save();
    ctx.fillStyle = s.body;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s.wingX - 1, side * 4.2, 2.6, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = s.body;
  drawFuselage(ctx, s, tailX);
  if (s.radiator) {
    ctx.save();
    ctx.fillStyle = '#37474F';
    ctx.fillRect(s.wingX - s.rootChord - 1, -0.9, 3, 1.8);
    ctx.restore();
  }
  drawCanopy(ctx, s);
  if (s.ballTurret) {
    ctx.save();
    ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.8)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(s.canopy.x - s.canopy.len - 0.8, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // Roundels on the outer wings
  const iy = half * 0.62;
  const ix = (le[7][0] + te[7][0]) / 2;
  const ir = Math.min(3.6, (le[7][0] - te[7][0]) * 0.36);
  drawNationalInsignia(rc, plane, ix, -iy, ir);
  drawNationalInsignia(rc, plane, ix, iy, ir);
}

/** Drawers for every airframe in SPECS. */
export const PISTON_PLANFORM_DRAWERS: AircraftDrawerTable = Object.fromEntries(
  Object.entries(SPECS).map(([model, spec]) => [model, (rc: RenderContext, plane: Aircraft) => drawPiston(rc, plane, spec as PistonSpec)])
);
