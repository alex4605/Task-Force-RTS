import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawNationalInsignia } from '../nation';
import { AircraftDrawerTable } from './types';

/** Mirrored polygon about the fuselage centreline: points are given for the port (-y) side. */
function mirrored(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>): void {
  for (const side of [1, -1]) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y * side) : ctx.lineTo(x, y * side)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * PBY-5A Catalina: a boat hull slung beneath a huge parasol wing (104 ft span), two Pratt &
 * Whitney R-1830s on the wing's leading edge, wing-tip floats that retract to form the tips, and
 * the bulged waist-gun blisters. The night-flying "Black Cats" were painted matt black.
 */
function drawPby(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const blackCat = plane.side !== 'enemy';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;

  // Tailplane and the tall single fin
  ctx.fillStyle = blackCat ? '#0B0F14' : '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(-19, -8.5);
  ctx.lineTo(-23, -8.5);
  ctx.lineTo(-23, 8.5);
  ctx.lineTo(-19, 8.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Boat hull: fine bow, flat planing bottom stepping up to the tail
  ctx.fillStyle = blackCat ? '#11161C' : '#0F2740';
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.quadraticCurveTo(15, -3.8, 8, -4);
  ctx.lineTo(-10, -3.4);
  ctx.lineTo(-22, -1.2);
  ctx.lineTo(-22, 1.2);
  ctx.lineTo(-10, 3.4);
  ctx.lineTo(8, 4);
  ctx.quadraticCurveTo(15, 3.8, 17, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Waist gun blisters
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  for (const y of [-3.6, 3.6]) {
    ctx.beginPath();
    ctx.ellipse(-9, y, 2.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Parasol wing on its central pylon, with the floats at the tips
  ctx.fillStyle = blackCat ? '#161C24' : '#123150';
  ctx.beginPath();
  ctx.moveTo(5, -34);
  ctx.lineTo(5, 34);
  ctx.lineTo(-3, 33);
  ctx.lineTo(-3, -33);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#263238';
  for (const y of [-33, 33]) {
    ctx.beginPath();
    ctx.ellipse(1.5, y, 3, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Engine nacelles and propeller discs
  for (const y of [-7.5, 7.5]) {
    ctx.fillStyle = '#1C2630';
    ctx.beginPath();
    ctx.ellipse(6, y, 4.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
    ctx.beginPath();
    ctx.moveTo(10.8, y - 5.5);
    ctx.lineTo(10.8, y + 5.5);
    ctx.stroke();
    ctx.strokeStyle = color;
  }

  // Bow turret glazing
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.arc(14, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, 0, -22, 3.2);
  drawNationalInsignia(rc, plane, 0, 22, 3.2);
}

/**
 * F-84G Thunderjet: straight-winged USAF fighter-bomber of the Korean War, with the round nose
 * intake, tip tanks, bubble canopy and unpainted natural-metal finish.
 */
function drawF84(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;

  // Tailplane
  ctx.fillStyle = '#26323D';
  mirrored(ctx, [[-11, 0], [-13, -7.5], [-16, -7.5], [-16, 0]]);

  // Fuselage: straight tube from the nose intake to the jet pipe
  ctx.fillStyle = '#2E3B47';
  ctx.beginPath();
  ctx.moveTo(18, -2.6);
  ctx.lineTo(18, 2.6);
  ctx.lineTo(-15, 2.4);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-15, -2.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Straight wing, slightly tapered, with tip tanks
  ctx.fillStyle = '#34424F';
  mirrored(ctx, [[5, -2.5], [3, -17], [-3, -17], [-4, -2.5]]);
  ctx.fillStyle = '#3D4C59';
  for (const y of [-17.5, 17.5]) {
    ctx.beginPath();
    ctx.ellipse(1, y, 6.5, 1.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Nose intake ring and six .50 calibre guns around it
  ctx.fillStyle = '#05080C';
  ctx.beginPath();
  ctx.ellipse(18, 0, 1, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(15, -2.9);
  ctx.lineTo(19, -2.9);
  ctx.moveTo(15, 2.9);
  ctx.lineTo(19, 2.9);
  ctx.stroke();

  // Bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.65)';
  ctx.beginPath();
  ctx.ellipse(9, 0, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, -1, -10, 2.8);
}

/**
 * SH-60B Seahawk (LAMPS III): the Navy Black Hawk, with the stub weapons pylons on either side of
 * the cabin, the canted tail rotor on the port side of the folding tail, the stabilator, and the
 * MAD "bird" pod on the starboard pylon. Torpedoes are shown when it carries them.
 */
function drawSh60b(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;

  // Tail boom, stabilator and tail rotor
  ctx.fillStyle = '#1E2A33';
  ctx.beginPath();
  ctx.moveTo(-4, -1.6);
  ctx.lineTo(-20, -0.9);
  ctx.lineTo(-20, 0.9);
  ctx.lineTo(-4, 1.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-19, -4.5, 2.4, 9);
  ctx.strokeRect(-19, -4.5, 2.4, 9);
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.6)';
  ctx.beginPath();
  ctx.moveTo(-21.5, -1.5);
  ctx.lineTo(-21.5, -6.5);
  ctx.stroke();
  ctx.strokeStyle = color;

  // Cabin
  ctx.fillStyle = '#26333D';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(9, -4, 3, -4.2);
  ctx.lineTo(-5, -3.6);
  ctx.lineTo(-5, 3.6);
  ctx.lineTo(3, 4.2);
  ctx.quadraticCurveTo(9, 4, 10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Weapons pylons: Mk 46 to port, MAD towed body to starboard
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-1, -7, 3, 3);
  ctx.fillRect(-1, 4, 3, 3);
  if (plane.hasPayload) {
    ctx.fillStyle = '#CFD8DC';
    ctx.beginPath();
    ctx.ellipse(0.5, -7.5, 5, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFB300';
  ctx.beginPath();
  ctx.ellipse(0.5, 7.4, 2.4, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit glazing
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.ellipse(7, 0, 2.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, -9, 0, 2.2);
}

/**
 * MiG-23ML Flogger-G: variable-sweep fighter, drawn at the 45-degree combat setting, with the
 * fixed triangular wing glove, the boxy side intakes and splitter plates, swept all-moving
 * tailplanes and the long dorsal fin.
 */
function drawMig23(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;

  // All-moving swept tailplanes
  ctx.fillStyle = '#20262B';
  mirrored(ctx, [[-10, -3], [-16, -10], [-19, -10], [-17, -3]]);

  // Outer wing panels at 45 degrees of sweep, behind the fixed glove
  ctx.fillStyle = '#2A3236';
  mirrored(ctx, [[2, -5], [-7, -19], [-11, -19], [-5, -5]]);

  // Fuselage with side intakes
  ctx.fillStyle = '#1F272B';
  ctx.beginPath();
  ctx.moveTo(21, 0);
  ctx.lineTo(13, -2.4);
  ctx.lineTo(8, -4.6);
  ctx.lineTo(-17, -3.6);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-17, 3.6);
  ctx.lineTo(8, 4.6);
  ctx.lineTo(13, 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fixed wing glove
  ctx.fillStyle = '#262E33';
  mirrored(ctx, [[8, -4.6], [0, -8], [-4, -4.6]]);

  // Intake splitter plates
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(9, -4.8);
  ctx.lineTo(12, -4.8);
  ctx.moveTo(9, 4.8);
  ctx.lineTo(12, 4.8);
  ctx.stroke();

  // Dorsal fin root and canopy
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-17, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.beginPath();
  ctx.ellipse(11, 0, 3, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, -7, -13, 2.4);
  drawNationalInsignia(rc, plane, -7, 13, 2.4);
}

export const ROSTER_ADDITION_DRAWERS: AircraftDrawerTable = {
  pby: drawPby,
  f84: drawF84,
  sh60b: drawSh60b,
  mig23: drawMig23,
};
