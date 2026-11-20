import { AircraftModel } from '../../../types/game';
import { RenderContext } from '../context';

/**
 * Empennage for airframes whose silhouettes were drawn without one. Coordinates are in the
 * aircraft's local frame (nose along +x): `x` is the stabiliser's root trailing edge, `chord` its
 * root chord and `halfSpan` the distance from the centreline to each tip. The stabiliser is
 * drawn beneath the airframe and the fin(s) above it, so the fuselage overlaps the roots.
 */
export interface TailSpec {
  kind: 'prop' | 'swept' | 'twinFin';
  x: number;
  halfSpan: number;
  chord: number;
  /** twinFin only: lateral offset of the two vertical fins. */
  finOffset?: number;
}

export const TAIL_SPECS: Partial<Record<AircraftModel, TailSpec>> = {
  // WWII / Korean War piston aircraft and straight-wing types
  f4f: { kind: 'prop', x: -10.5, halfSpan: 6, chord: 3 },
  sbd: { kind: 'prop', x: -12, halfSpan: 6, chord: 3.5 },
  tbd: { kind: 'prop', x: -13, halfSpan: 7, chord: 4 },
  os2u: { kind: 'prop', x: -11, halfSpan: 6, chord: 3.5 },
  p40: { kind: 'prop', x: -11, halfSpan: 6, chord: 4 },
  f6f: { kind: 'prop', x: -11, halfSpan: 6, chord: 3.5 },
  f8f: { kind: 'prop', x: -9.5, halfSpan: 5, chord: 3 },
  sb2c: { kind: 'prop', x: -12, halfSpan: 6, chord: 3.5 },
  tbf: { kind: 'prop', x: -13, halfSpan: 7, chord: 4 },
  sc1: { kind: 'prop', x: -11, halfSpan: 6.5, chord: 4.5 },
  p51: { kind: 'prop', x: -11, halfSpan: 7, chord: 4.5 },
  p47: { kind: 'prop', x: -12, halfSpan: 8, chord: 4.5 },
  ad1: { kind: 'prop', x: -12, halfSpan: 8.5, chord: 5 },
  f4u4: { kind: 'prop', x: -11, halfSpan: 7, chord: 4.5 },
  af_guardian: { kind: 'prop', x: -14, halfSpan: 8, chord: 5 },
  zero: { kind: 'prop', x: -10, halfSpan: 5.5, chord: 3.5 },
  zero_a6m2: { kind: 'prop', x: -10, halfSpan: 5.5, chord: 3.5 },
  zero_a6m5: { kind: 'prop', x: -10.5, halfSpan: 5.5, chord: 3.5 },
  kamikaze_zero: { kind: 'prop', x: -10.5, halfSpan: 5.5, chord: 3.5 },
  ki61: { kind: 'prop', x: -11, halfSpan: 6, chord: 4 },
  ki84: { kind: 'prop', x: -10.5, halfSpan: 5.8, chord: 3.6 },
  boomerang: { kind: 'prop', x: -10.5, halfSpan: 5.5, chord: 3.5 },
  seafire: { kind: 'prop', x: -11, halfSpan: 6, chord: 3.8 },
  rufe: { kind: 'prop', x: -10, halfSpan: 5.5, chord: 3.5 },
  george: { kind: 'prop', x: -11, halfSpan: 6.5, chord: 3.5 },
  val: { kind: 'prop', x: -11, halfSpan: 6, chord: 3.5 },
  judy: { kind: 'prop', x: -11, halfSpan: 6, chord: 3.5 },
  kate: { kind: 'prop', x: -12, halfSpan: 7, chord: 4 },
  jill: { kind: 'prop', x: -12, halfSpan: 7, chord: 4 },
  kamikaze_judy: { kind: 'prop', x: -10, halfSpan: 5.5, chord: 3.5 },
  yak9: { kind: 'prop', x: -10.5, halfSpan: 6, chord: 4 },
  il10: { kind: 'prop', x: -11, halfSpan: 7.5, chord: 4.5 },
  p36a: { kind: 'prop', x: -10, halfSpan: 6, chord: 4 },
  p39d: { kind: 'prop', x: -11, halfSpan: 5.5, chord: 3.5 },
  hurricane: { kind: 'prop', x: -11, halfSpan: 6.5, chord: 4.5 },
  beaufighter: { kind: 'prop', x: -15, halfSpan: 7, chord: 4.5 },
  swordfish: { kind: 'prop', x: -13, halfSpan: 7, chord: 4 },
  b17_late: { kind: 'prop', x: -23, halfSpan: 10, chord: 6.5 },
  spitfire_xiv: { kind: 'prop', x: -11, halfSpan: 6.5, chord: 5 },
  tempest: { kind: 'prop', x: -11, halfSpan: 7, chord: 4 },
  mosquito: { kind: 'prop', x: -13, halfSpan: 7, chord: 4.5 },
  sea_fury: { kind: 'prop', x: -12, halfSpan: 6.5, chord: 5 },
  rokaf_p51: { kind: 'prop', x: -11, halfSpan: 6, chord: 4.5 },
  firefly_as5: { kind: 'prop', x: -13, halfSpan: 7, chord: 4 },
  a1h: { kind: 'prop', x: -13, halfSpan: 7.5, chord: 5 },
  c130: { kind: 'prop', x: -27.5, halfSpan: 12.5, chord: 7 },
  c1: { kind: 'prop', x: -13, halfSpan: 8, chord: 4 },
  s2: { kind: 'prop', x: -18, halfSpan: 8, chord: 4.5 },
  il28: { kind: 'prop', x: -17, halfSpan: 9.5, chord: 5.5 },
  a37b: { kind: 'prop', x: -10, halfSpan: 6, chord: 3 },
  // Swept-tail jets and turboprops
  a7: { kind: 'swept', x: -11.5, halfSpan: 7.5, chord: 5 },
  f105: { kind: 'swept', x: -15.5, halfSpan: 6.5, chord: 6 },
  a6a: { kind: 'swept', x: -13.5, halfSpan: 8, chord: 5 },
  a6b_weasel: { kind: 'swept', x: -13.5, halfSpan: 8, chord: 5 },
  a6e: { kind: 'swept', x: -16.5, halfSpan: 9, chord: 6 },
  ea6b: { kind: 'swept', x: -20, halfSpan: 9, chord: 7 },
  mig19: { kind: 'swept', x: -12.5, halfSpan: 7, chord: 5.5 },
  su7: { kind: 'swept', x: -14.5, halfSpan: 7.5, chord: 6.5 },
  s3a: { kind: 'swept', x: -24.5, halfSpan: 10, chord: 7.5 },
  av8b: { kind: 'swept', x: -15.5, halfSpan: 7, chord: 6 },
  f5a: { kind: 'swept', x: -16.5, halfSpan: 5.5, chord: 6.5 },
  hunter_fga9: { kind: 'swept', x: -12.5, halfSpan: 6.5, chord: 5.5 },
  tornado_gr1: { kind: 'swept', x: -17.5, halfSpan: 7, chord: 6.5 },
  tornado_ids: { kind: 'swept', x: -17.5, halfSpan: 7, chord: 6.5 },
  tornado_adv: { kind: 'swept', x: -17.5, halfSpan: 7.5, chord: 7.5 },
  jaguar_gr1: { kind: 'swept', x: -16.5, halfSpan: 6, chord: 6.5 },
  tu22m3: { kind: 'swept', x: -24, halfSpan: 11, chord: 8.5 },
  yak38: { kind: 'swept', x: -15.5, halfSpan: 5.5, chord: 6 },
  su25: { kind: 'swept', x: -17.5, halfSpan: 9, chord: 6.5 },
  f16a: { kind: 'swept', x: -15.5, halfSpan: 6.5, chord: 6 },
  tu95: { kind: 'swept', x: -35.5, halfSpan: 17.5, chord: 10 },
  a50: { kind: 'swept', x: -30, halfSpan: 13.5, chord: 10 },
  // Twin-fin fighters / attackers
  f14a: { kind: 'twinFin', x: -17.5, halfSpan: 10.5, chord: 6.5, finOffset: 3.6 },
  f15a: { kind: 'twinFin', x: -17.5, halfSpan: 10.5, chord: 6.5, finOffset: 4.4 },
  fa18a: { kind: 'twinFin', x: -16.5, halfSpan: 8.5, chord: 6, finOffset: 3.4 },
  mig29a: { kind: 'twinFin', x: -16.5, halfSpan: 8.5, chord: 6, finOffset: 4.4 },
  su27: { kind: 'twinFin', x: -20.5, halfSpan: 10.5, chord: 7.5, finOffset: 4.8 },
  a10a: { kind: 'twinFin', x: -17.5, halfSpan: 12.5, chord: 6.5, finOffset: 12.5 },
};

const STAB_FILL = '#0B1F34';

/** Horizontal stabiliser, drawn before the airframe. */
export function drawTailplane(rc: RenderContext, spec: TailSpec, color: string): void {
  const ctx = rc.ctx;
  const { x, halfSpan: hs, chord: c } = spec;
  ctx.save();
  ctx.fillStyle = STAB_FILL;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const side of [-1, 1]) {
    if (spec.kind === 'prop') {
      // Rounded WWII planform: curved leading edge into an elliptical tip, straight trailing edge.
      ctx.moveTo(x + c, side * 1.2);
      ctx.quadraticCurveTo(x + c * 0.95, side * hs * 0.8, x + c * 0.45, side * hs);
      ctx.quadraticCurveTo(x - c * 0.05, side * hs, x, side * hs * 0.82);
      ctx.lineTo(x, side * 1.2);
    } else {
      // Swept planform with a raked tip; trailing edge reaches slightly past the root.
      ctx.moveTo(x + c, side * 1.5);
      ctx.lineTo(x + c * 0.15, side * hs);
      ctx.lineTo(x - c * 0.3, side * hs);
      ctx.lineTo(x - c * 0.05, side * 1.5);
    }
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Vertical fin(s) seen from above, drawn after the airframe. */
export function drawTailFins(rc: RenderContext, spec: TailSpec, color: string): void {
  const ctx = rc.ctx;
  const { x, chord: c } = spec;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = STAB_FILL;
  ctx.lineWidth = 1;
  if (spec.kind === 'twinFin') {
    const fo = spec.finOffset ?? spec.halfSpan * 0.4;
    for (const side of [-1, 1]) {
      // Slightly out-canted fin: a slim parallelogram in plan view.
      ctx.beginPath();
      ctx.moveTo(x + c * 1.15, side * fo);
      ctx.lineTo(x - c * 0.2, side * (fo + 0.9));
      ctx.lineTo(x - c * 0.2, side * (fo + 2.1));
      ctx.lineTo(x + c * 1.15, side * (fo + 1.2));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Single fin along the centreline, with a darker rudder hinge line.
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + c * 1.25, 0);
    ctx.lineTo(x - (spec.kind === 'prop' ? 0.4 : c * 0.25), 0);
    ctx.stroke();
  }
  ctx.restore();
}
