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


/** Open-ended filled ellipse helper. */
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** Spinning rotor disc for helicopters drawn with more than one main rotor. */
function rotorDisc(ctx: CanvasRenderingContext2D, x: number, r: number, blades: number, phase: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(178, 235, 242, 0.07)';
  ctx.strokeStyle = 'rgba(178, 235, 242, 0.22)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.55)';
  ctx.lineWidth = 1.1;
  for (let b = 0; b < blades; b++) {
    const a = phase + (b / blades) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A6M2-N "Rufe": the Zero adapted as a floatplane fighter for the Solomons, with one large
 * central float on a pylon, small stabilising floats under the wings and an enlarged fin.
 */
/**
 * Westland Lynx HAS.2/3: compact naval helicopter, short boxy cabin, slim tail boom with a
 * swept fin and tail rotor, wheeled undercarriage sponsons; Sea Skua or Mk 46 on side pylons.
 */
function drawLynx(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.fillStyle = '#2B3238';
  ctx.beginPath();
  ctx.moveTo(-3.5, -1.3);
  ctx.lineTo(-17, -0.7);
  ctx.lineTo(-17, 0.7);
  ctx.lineTo(-3.5, 1.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-17, -3.6, 2, 7.2);
  ctx.fillStyle = '#323B42';
  ctx.beginPath();
  ctx.moveTo(8.5, 0);
  ctx.quadraticCurveTo(8, -3.4, 3, -3.6);
  ctx.lineTo(-4.5, -3.2);
  ctx.lineTo(-4.5, 3.2);
  ctx.lineTo(3, 3.6);
  ctx.quadraticCurveTo(8, 3.4, 8.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Undercarriage sponsons and weapon pylons
  ctx.fillStyle = '#263238';
  ctx.fillRect(-2, -5.2, 3, 1.6);
  ctx.fillRect(-2, 3.6, 3, 1.6);
  if (plane.hasPayload) {
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(-3, -7, 5, 1.2);
    ctx.fillRect(-3, 5.8, 5, 1.2);
  }
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(4, -2.4, 3.4, 4.8);
  drawNationalInsignia(rc, plane, -9, 0, 2.2);
}

function drawRufe(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#26331F';
  mirrored(ctx, [[-10, 0], [-12, -6], [-15, -6], [-15, 0]]);
  // Central float, longer than the fuselage nose
  ctx.fillStyle = '#3A4433';
  blob(ctx, 6, 0, 16, 2.2);
  ctx.fillStyle = '#2F3D27';
  mirrored(ctx, [[5, -1], [3, -18], [-3, -18], [-4, -1]]);
  ctx.fillStyle = '#3A4433';
  blob(ctx, 0, -14, 3.5, 1.1);
  blob(ctx, 0, 14, 3.5, 1.1);
  ctx.fillStyle = '#26331F';
  blob(ctx, 2, 0, 12, 2.8);
  ctx.fillStyle = '#111';
  blob(ctx, 13, 0, 1.6, 3.2);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(1, -1.3, 4, 2.6);
  drawNationalInsignia(rc, plane, -1, -11, 2.6);
  drawNationalInsignia(rc, plane, -1, 11, 2.6);
}

/**
 * Nakajima Ki-84 Hayate "Frank": the Imperial Army's best late-war fighter, a long Homare-engined
 * nose, straight tapered wing and a tall, broad tail; olive-green over natural metal.
 */
function drawKi84(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#2D3A22';
  mirrored(ctx, [[-10, 0], [-11, -6.5], [-15, -6.5], [-15, 0]]);
  ctx.fillStyle = '#34432A';
  mirrored(ctx, [[5, -2], [3, -17], [-2.5, -17], [-4, -2]]);
  ctx.fillStyle = '#2D3A22';
  ctx.beginPath();
  ctx.moveTo(15, -2.6);
  ctx.lineTo(15, 2.6);
  ctx.lineTo(-14, 1.4);
  ctx.lineTo(-14, -1.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#111';
  blob(ctx, 15.5, 0, 1.4, 3);
  // Yellow wing leading-edge recognition stripes
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4.6, -4);
  ctx.lineTo(3.4, -12);
  ctx.moveTo(4.6, 4);
  ctx.lineTo(3.4, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(0, -1.3, 4.5, 2.6);
  drawNationalInsignia(rc, plane, -1, -11, 2.6);
  drawNationalInsignia(rc, plane, -1, 11, 2.6);
}

/**
 * Polikarpov Po-2: the fabric biplane the North Koreans flew at night over UN lines ("Bedcheck
 * Charlie"), dropping light bombs. Upper wing staggered ahead of the lower, two open cockpits.
 */
function drawPo2(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.fillStyle = '#2E3A28';
  mirrored(ctx, [[-9, 0], [-10, -5.5], [-13, -5.5], [-13, 0]]);
  // Lower wing (behind), then the fuselage and the staggered upper wing on top
  ctx.fillStyle = '#26301F';
  ctx.fillRect(-3, -15, 5, 30);
  ctx.strokeRect(-3, -15, 5, 30);
  ctx.fillStyle = '#344230';
  ctx.beginPath();
  ctx.moveTo(10, -2);
  ctx.lineTo(10, 2);
  ctx.lineTo(-13, 0.8);
  ctx.lineTo(-13, -0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3D4C38';
  ctx.fillRect(0, -16, 5.5, 32);
  ctx.strokeRect(0, -16, 5.5, 32);
  // Interplane struts and the two cockpits
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
  ctx.beginPath();
  ctx.moveTo(1, -11);
  ctx.lineTo(0, -11);
  ctx.moveTo(1, 11);
  ctx.lineTo(0, 11);
  ctx.stroke();
  ctx.fillStyle = '#0B0F14';
  ctx.fillRect(-4, -1, 2, 2);
  ctx.fillRect(-7.5, -1, 2, 2);
  drawNationalInsignia(rc, plane, 2.7, -12, 2.2);
  drawNationalInsignia(rc, plane, 2.7, 12, 2.2);
}

/**
 * AC-47D "Spooky" / "Puff the Magic Dragon": a C-47 with three 7.62 mm GAU-2 miniguns firing out
 * of the port side windows and cargo door while it pylon-turns around the target. Night black.
 */
function drawAc47(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#14181C';
  mirrored(ctx, [[-15, 0], [-17, -8], [-21, -8], [-21, 0]]);
  ctx.fillStyle = '#1B2026';
  ctx.beginPath();
  ctx.moveTo(4, -2.5);
  ctx.lineTo(2, -27);
  ctx.lineTo(-3, -27);
  ctx.lineTo(-6, -2.5);
  ctx.lineTo(-6, 2.5);
  ctx.lineTo(-3, 27);
  ctx.lineTo(2, 27);
  ctx.lineTo(4, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#14181C';
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.quadraticCurveTo(15, -3.6, 9, -3.6);
  ctx.lineTo(-20, -1.4);
  ctx.lineTo(-20, 1.4);
  ctx.lineTo(9, 3.6);
  ctx.quadraticCurveTo(15, 3.6, 17, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const y of [-9, 9]) {
    ctx.fillStyle = '#22282E';
    blob(ctx, 5, y, 4, 2.2);
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
    ctx.beginPath();
    ctx.moveTo(9.4, y - 5);
    ctx.lineTo(9.4, y + 5);
    ctx.stroke();
    ctx.strokeStyle = color;
  }
  // Three miniguns poking out to port (-y)
  ctx.strokeStyle = '#FFB74D';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const x of [-2, -6, -10]) {
    ctx.moveTo(x, -3.2);
    ctx.lineTo(x, -6.2);
  }
  ctx.stroke();
  drawNationalInsignia(rc, plane, -3, 18, 3);
}

/**
 * North American F-100D Super Sabre: the first supersonic USAF fighter, flown in Vietnam as a
 * fighter-bomber and "Misty" fast FAC. Oval nose intake, 45-degree wing, slab tailplane low on the
 * fuselage, natural metal.
 */
function drawF100(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.fillStyle = '#2E3B47';
  mirrored(ctx, [[-12, -2], [-17, -8], [-20, -8], [-19, -2]]);
  ctx.fillStyle = '#34424F';
  mirrored(ctx, [[4, -2.5], [-7, -16], [-11, -16], [-7, -2.5]]);
  ctx.fillStyle = '#2E3B47';
  ctx.beginPath();
  ctx.moveTo(20, -2.4);
  ctx.lineTo(20, 2.4);
  ctx.lineTo(-19, 2.2);
  ctx.lineTo(-21, 0);
  ctx.lineTo(-19, -2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#05080C';
  blob(ctx, 20, 0, 0.9, 2);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  blob(ctx, 10, 0, 3, 1.4);
  drawNationalInsignia(rc, plane, -6, -9, 2.4);
}

/**
 * Boeing Vertol CH-46 Sea Knight: the Marines' tandem-rotor assault transport of Vietnam, with
 * the aft rotor on its pylon above the rear ramp and the fat sponsons carrying the fuel.
 */
function drawCh46(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#2E3826';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.quadraticCurveTo(13, -4, 8, -4);
  ctx.lineTo(-14, -3.4);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-14, 3.4);
  ctx.lineTo(8, 4);
  ctx.quadraticCurveTo(13, 4, 14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#26301F';
  ctx.fillRect(-8, -6, 9, 2.4);
  ctx.fillRect(-8, 3.6, 9, 2.4);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  blob(ctx, 11, 0, 2, 2.6);
  const phase = plane.heading * 3 + plane.pos.x * 0.05;
  rotorDisc(ctx, 9, 13, 3, phase);
  rotorDisc(ctx, -11, 13, 3, -phase);
  drawNationalInsignia(rc, plane, -3, 0, 2.2);
}

/**
 * MiG-31 Foxhound: long-range interceptor with the Zaslon phased-array radar, huge rectangular
 * intakes, a short trapezoidal wing, twin fins and R-33 missiles under the belly.
 */
function drawMig31(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#2A3136';
  mirrored(ctx, [[-14, -4], [-19, -11], [-23, -11], [-22, -4]]);
  ctx.fillStyle = '#30383E';
  mirrored(ctx, [[4, -5.5], [-8, -19], [-14, -19], [-14, -5.5]]);
  ctx.fillStyle = '#262D32';
  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(17, -2.6);
  ctx.lineTo(11, -6);
  ctx.lineTo(-22, -5.5);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-22, 5.5);
  ctx.lineTo(11, 6);
  ctx.lineTo(17, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-15, -3);
  ctx.lineTo(-22, -3);
  ctx.moveTo(-15, 3);
  ctx.lineTo(-22, 3);
  ctx.stroke();
  // Four R-33s in tandem pairs under the fuselage
  ctx.fillStyle = '#CFD8DC';
  for (const [x, y] of [[4, -2.6], [4, 2.6], [-8, -2.6], [-8, 2.6]] as const) {
    ctx.fillRect(x - 4, y - 0.6, 8, 1.2);
  }
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  blob(ctx, 15, 0, 3.5, 1.4);
  drawNationalInsignia(rc, plane, -10, -14, 2.6);
  drawNationalInsignia(rc, plane, -10, 14, 2.6);
}

/**
 * Bristol Beaufort (DAP-built for the RAAF): twin Twin Wasp nacelles that stand well proud of the
 * wing, a glazed nose, the dorsal turret, and an 18-inch torpedo half-recessed under the belly.
 */
function drawBeaufort(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#2F3A2A';
  mirrored(ctx, [[-14, 0], [-16, -8], [-20, -8], [-20, 0]]);
  ctx.fillStyle = '#344230';
  mirrored(ctx, [[5, -2.5], [3, -22], [-3, -22], [-5, -2.5]]);
  ctx.fillStyle = '#2A3526';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.quadraticCurveTo(15, -3, 10, -3.2);
  ctx.lineTo(-19, -1.4);
  ctx.lineTo(-19, 1.4);
  ctx.lineTo(10, 3.2);
  ctx.quadraticCurveTo(15, 3, 16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const y of [-8, 8]) {
    ctx.fillStyle = '#222C20';
    blob(ctx, 4, y, 6.5, 2.4);
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
    ctx.beginPath();
    ctx.moveTo(10.8, y - 5);
    ctx.lineTo(10.8, y + 5);
    ctx.stroke();
    ctx.strokeStyle = color;
  }
  if (plane.hasPayload) {
    ctx.fillStyle = '#B0BEC5';
    ctx.fillRect(-6, -0.8, 12, 1.6);
  }
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  blob(ctx, 14, 0, 2, 2.2);
  blob(ctx, -5, 0, 1.8, 1.8);
  drawNationalInsignia(rc, plane, -1, -15, 2.8);
  drawNationalInsignia(rc, plane, -1, 15, 2.8);
}

/**
 * CAC Boomerang: Australia's home-grown stop-gap fighter, a stubby Twin Wasp radial on a
 * Wirraway-derived wing, later the army co-operation workhorse of New Guinea.
 */
function drawBoomerang(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#3B4630';
  mirrored(ctx, [[-8, 0], [-9, -5.5], [-12, -5.5], [-12, 0]]);
  ctx.fillStyle = '#46523A';
  mirrored(ctx, [[4, -2.5], [2, -14], [-3, -14], [-4, -2.5]]);
  ctx.fillStyle = '#3B4630';
  ctx.beginPath();
  ctx.moveTo(11, -3.4);
  ctx.lineTo(11, 3.4);
  ctx.lineTo(-11, 1.3);
  ctx.lineTo(-11, -1.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#222';
  blob(ctx, 11.5, 0, 1.4, 3.6);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(-1, -1.4, 4, 2.8);
  drawNationalInsignia(rc, plane, -0.5, -9, 2.4);
  drawNationalInsignia(rc, plane, -0.5, 9, 2.4);
}

/** Supermarine Seafire: the navalised Spitfire, with its elliptical wing and arrester hook, in FAA slate grey. */
function drawSeafire(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#3A4650';
  mirrored(ctx, [[-10, 0], [-11, -5.5], [-14, -5.5], [-14, 0]]);
  ctx.fillStyle = '#46525C';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(5, s * 2);
    ctx.bezierCurveTo(6, s * 10, 3, s * 17, -1, s * 17);
    ctx.bezierCurveTo(-4, s * 16, -5, s * 8, -5, s * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#3A4650';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.quadraticCurveTo(14, -2.2, 8, -2.4);
  ctx.lineTo(-13, -1);
  ctx.lineTo(-13, 1);
  ctx.lineTo(8, 2.4);
  ctx.quadraticCurveTo(14, 2.2, 15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
  ctx.beginPath();
  ctx.moveTo(15.5, -5);
  ctx.lineTo(15.5, 5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  blob(ctx, 0, 0, 2.6, 1.2);
  drawNationalInsignia(rc, plane, -1, -11, 2.4);
  drawNationalInsignia(rc, plane, -1, 11, 2.4);
}

/**
 * Fairey Barracuda: shoulder-winged torpedo / dive bomber with the big Fairey-Youngman flaps
 * hanging below the trailing edge, a strut-braced tailplane set high on the fin, and the deep
 * glazed canopy for its crew of three.
 */
function drawBarracuda(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = '#3A4650';
  mirrored(ctx, [[-12, 0], [-13, -7], [-17, -7], [-17, 0]]);
  ctx.fillStyle = '#2E3942';
  mirrored(ctx, [[-4, -3], [-4, -16], [-7, -16], [-7, -3]]);
  ctx.fillStyle = '#46525C';
  mirrored(ctx, [[4, -2.5], [3, -18], [-4, -18], [-4, -2.5]]);
  ctx.fillStyle = '#3A4650';
  ctx.beginPath();
  ctx.moveTo(15, -2.8);
  ctx.lineTo(15, 2.8);
  ctx.lineTo(-16, 1.2);
  ctx.lineTo(-16, -1.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(-6, -1.6, 12, 3.2);
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.5)';
  ctx.beginPath();
  ctx.moveTo(15.5, -5);
  ctx.lineTo(15.5, 5);
  ctx.stroke();
  drawNationalInsignia(rc, plane, 0, -12, 2.6);
  drawNationalInsignia(rc, plane, 0, 12, 2.6);
}

/**
 * English Electric Canberra B.20 (RAAF No. 2 Squadron, Phan Rang 1967-71): broad straight wing with
 * the Avon nacelles at mid-span, a long slender fuselage, the bomb-aimer's glazed nose.
 */
function drawCanberra(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.fillStyle = '#3A4350';
  mirrored(ctx, [[-17, 0], [-19, -9], [-23, -9], [-23, 0]]);
  ctx.fillStyle = '#434D5A';
  mirrored(ctx, [[6, -2.5], [2, -27], [-6, -27], [-8, -2.5]]);
  ctx.fillStyle = '#3A4350';
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.quadraticCurveTo(20, -2.8, 14, -2.8);
  ctx.lineTo(-22, -1.4);
  ctx.lineTo(-22, 1.4);
  ctx.lineTo(14, 2.8);
  ctx.quadraticCurveTo(20, 2.8, 22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const y of [-10, 10]) {
    ctx.fillStyle = '#2E3640';
    blob(ctx, 0, y, 8, 2.2);
    ctx.fillStyle = '#05080C';
    blob(ctx, 8, y, 0.8, 1.6);
  }
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  blob(ctx, 20, 0, 2, 1.8);
  blob(ctx, 12, 0, 2.2, 1.6);
  drawNationalInsignia(rc, plane, -2, -19, 2.8);
  drawNationalInsignia(rc, plane, -2, 19, 2.8);
}

/**
 * Blackburn Buccaneer S.2B: the area-ruled low-level maritime strike jet, with the T-tail, the
 * bulged "coke-bottle" rear fuselage, the split airbrake tail cone and wing-root Spey intakes.
 */
function drawBuccaneer(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.fillStyle = '#2F3A33';
  mirrored(ctx, [[-14, -1], [-18, -8], [-21, -8], [-20, -1]]);
  ctx.fillStyle = '#38443C';
  mirrored(ctx, [[4, -4], [-5, -17], [-10, -17], [-8, -4]]);
  ctx.fillStyle = '#2F3A33';
  ctx.beginPath();
  ctx.moveTo(21, 0);
  ctx.quadraticCurveTo(18, -2.4, 12, -2.6);
  ctx.lineTo(4, -4.6);
  ctx.lineTo(-6, -3.2);
  ctx.lineTo(-14, -4.2);
  ctx.lineTo(-22, -1.6);
  ctx.lineTo(-22, 1.6);
  ctx.lineTo(-14, 4.2);
  ctx.lineTo(-6, 3.2);
  ctx.lineTo(4, 4.6);
  ctx.lineTo(12, 2.6);
  ctx.quadraticCurveTo(18, 2.4, 21, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#05080C';
  blob(ctx, 5, -4.6, 1.2, 1);
  blob(ctx, 5, 4.6, 1.2, 1);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  blob(ctx, 12, 0, 3.4, 1.4);
  drawNationalInsignia(rc, plane, -5, -12, 2.4);
  drawNationalInsignia(rc, plane, -5, 12, 2.4);
}

/**
 * BAe Sea Harrier FRS.1: the Harrier with a raised bubble cockpit, the pointed Blue Fox radar nose,
 * the anhedral wing and the four swivelling nozzles either side of the fuselage.
 */
function drawSeaHarrier(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.fillStyle = '#3A4550';
  mirrored(ctx, [[-12, -1], [-15, -7], [-18, -7], [-17, -1]]);
  ctx.fillStyle = '#434F5A';
  mirrored(ctx, [[4, -3.5], [-3, -13], [-8, -13], [-6, -3.5]]);
  ctx.fillStyle = '#3A4550';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(10, -2.2);
  ctx.lineTo(4, -4.4);
  ctx.lineTo(-16, -1.6);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-16, 1.6);
  ctx.lineTo(4, 4.4);
  ctx.lineTo(10, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1C2228';
  for (const [x, y] of [[2, -5.2], [2, 5.2], [-5, -4.4], [-5, 4.4]] as const) {
    ctx.fillRect(x - 1.6, y - 0.9, 3.2, 1.8);
  }
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  blob(ctx, 8, 0, 2.6, 1.6);
  drawNationalInsignia(rc, plane, -4, -9, 2.2);
  drawNationalInsignia(rc, plane, -4, 9, 2.2);
}

export const ROSTER_ADDITION_DRAWERS: AircraftDrawerTable = {
  beaufort: drawBeaufort,
  boomerang: drawBoomerang,
  seafire: drawSeafire,
  barracuda: drawBarracuda,
  canberra: drawCanberra,
  buccaneer: drawBuccaneer,
  sea_harrier: drawSeaHarrier,
  rufe: drawRufe,
  lynx: drawLynx,
  ki84: drawKi84,
  po2: drawPo2,
  ac47: drawAc47,
  f100: drawF100,
  ch46: drawCh46,
  mig31: drawMig31,
  pby: drawPby,
  f84: drawF84,
  sh60b: drawSh60b,
  mig23: drawMig23,
};
