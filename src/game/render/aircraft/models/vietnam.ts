// Vietnam / mid Cold War aircraft (1965-73): vector silhouettes, drawn in the plane's local frame (nose along +x).
import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawUSInsignia, drawRAFRoundel } from '../insignia';
import { AircraftDrawerTable } from './types';

function drawF4b(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const m = plane.model;
  const isPlayer = plane.side === 'player';

  // ════ F-4 Phantom II: Twin-Engine Heavy Supersonic Fighter-Bomber ════
  ctx.fillStyle = '#061322';
  // Long fuselage with pointed radome
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(13, -2.5);
  ctx.lineTo(-13, -2.5);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-13, 2.5);
  ctx.lineTo(13, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // F-4E Vulcan 20mm M61 cannon nose fairing
  if (m === 'f4e') {
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(11, -0.9, 5, 1.8);
  }

  // Swept wings (45°) with outer wing panels cranked upward (dihedral)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-2, -9);
  ctx.lineTo(1, -19);
  ctx.lineTo(-6, -19);
  ctx.lineTo(-7, -9);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-7, 9);
  ctx.lineTo(-6, 19);
  ctx.lineTo(1, 19);
  ctx.lineTo(-2, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Anhedral tailplanes (sloping downward like inverted V)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-15, -8);
  ctx.lineTo(-17, -7);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-17, 7);
  ctx.lineTo(-15, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tandem twin cockpit canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(1, -1.8, 8, 3.6);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -1.8);
  ctx.lineTo(5, 1.8);
  ctx.stroke();

  // Twin jet exhausts
  ctx.fillStyle = '#263238';
  ctx.fillRect(-14, -2.6, 2, 2.2);
  ctx.fillRect(-14, 0.4, 2, 2.2);

  if (isPlayer) drawUSInsignia(rc, 0, -12, 3.2);
}

function drawF8(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ F-8 Crusader: "The Last of the Gunfighters" ════
  ctx.fillStyle = '#061322';
  // Slender needle fuselage with chin air scoop
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chin air intake
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(10, -1.5, 3, 3);

  // High swept wing (variable-incidence wing)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-2, -15);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-7, 15);
  ctx.lineTo(-2, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Low all-flying tailplanes
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-13, -6);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-13, 6);
  ctx.lineTo(-10, 6);
  ctx.stroke();

  // 4x 20mm Colt Mk 12 cannon ports & bubble canopy glint
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(4, -2.4, 3, 1);
  ctx.fillRect(4, 1.4, 3, 1);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(6, -1.4, 5, 2.8);

  if (isPlayer) drawUSInsignia(rc, 0, -9, 3);
}

function drawA4(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ A-4 Skyhawk: "Heinemann's Hot Rod" Compact Delta ════
  ctx.fillStyle = '#061322';
  // Short nimble fuselage with dorsal avionics hump
  ctx.beginPath();
  ctx.ellipse(2, 0, 12, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Compact modified delta wing (Wingspan 27 - no folding wings!)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-5, -13);
  ctx.lineTo(-8, -13);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 13);
  ctx.lineTo(-5, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dorsal avionics hump behind cockpit
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -1.2, 5, 2.4);

  // Canopy glint & refueling probe
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(4, -1.5, 4.5, 3);
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(14, 3.5);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -8, 2.8);
}

function drawA6a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ A-6 Intruder / A-6B Wild Weasel: All-Weather Heavy Attack ════
  ctx.fillStyle = '#061322';
  // Bulbous radome nose & side-by-side cockpit
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(10, -3.8);
  ctx.lineTo(-12, -3.2);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-12, 3.2);
  ctx.lineTo(10, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Broad swept wings with wingtip speedbrakes
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, -19);
  ctx.lineTo(-8, -19);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 19);
  ctx.lineTo(-3, 19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(2, -2.6, 6, 5.2);

  // Nose curved refueling probe
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(13, 0);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -12, 3.2);
}

function drawB52(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ B-52 Stratofortress: 8-Engine Strategic Heavy Bomber ════
  ctx.fillStyle = '#061322';
  // Massive fuselage (length 44)
  ctx.beginPath();
  ctx.ellipse(3, 0, 24, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Giant 35° swept high wings (wingspan 48)
  ctx.fillStyle = '#0D2134';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-12, -28);
  ctx.lineTo(-18, -28);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-18, 28);
  ctx.lineTo(-12, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4 twin-engine pods on forward pylons
  ctx.fillStyle = '#263238';
  for (const podY of [-18, -10, 10, 18]) {
    ctx.fillRect(-2, podY - 2.2, 8, 4.4);
  }

  // Tall swept vertical tail & broad horizontal stabilizers
  ctx.beginPath();
  ctx.moveTo(-16, -12);
  ctx.lineTo(-21, -12);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-21, 12);
  ctx.lineTo(-16, 12);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -18, 4);
}

function drawF105(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ F-105 Thunderchief: "Thud" Supersonic Heavy Strike Fighter ════
  ctx.fillStyle = '#061322';
  // Long sleek area-ruled fuselage with needle nose
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(13, -2.8);
  ctx.lineTo(-14, -2.4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-14, 2.4);
  ctx.lineTo(13, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swept wings with forward-swept root intakes
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-3, -15);
  ctx.lineTo(-8, -15);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 15);
  ctx.lineTo(-3, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Unique root forward-swept intakes
  ctx.fillStyle = '#263238';
  ctx.fillRect(2, -4, 4, 1.8);
  ctx.fillRect(2, 2.2, 4, 1.8);

  if (isPlayer) drawUSInsignia(rc, 0, -10, 3);
}

function drawA7(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ A-7 Corsair II: High-Precision Carrier Attack Bomber ════
  ctx.fillStyle = '#061322';
  // Stocky fuselage with chin intake
  ctx.beginPath();
  ctx.ellipse(2, 0, 14, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wide chin scoop intake
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(10, -2, 3, 4);

  // High swept wings with 6 underwing weapon pylons
  ctx.fillStyle = '#0B1F34';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, -18);
  ctx.lineTo(-8, -18);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 18);
  ctx.lineTo(-3, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward-mounted canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(4, -1.7, 5, 3.4);

  if (isPlayer) drawUSInsignia(rc, 0, -11, 3.2);
}

function drawOv10(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ OV-10 Bronco: Twin-Boom Forward Air Control (FAC) ════
  ctx.fillStyle = '#061322';
  // Central crew gondola with high-visibility canopy
  ctx.beginPath();
  ctx.ellipse(3, 0, 11, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High straight wing
  ctx.fillStyle = '#0E241C';
  ctx.fillRect(-2, -18, 5, 36);
  ctx.strokeRect(-2, -18, 5, 36);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(3, -1.6, 5.5, 3.2);

  // Twin tail booms extending from twin engines
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-12, -7.5, 14, 3);
  ctx.strokeRect(-12, 4.5, 14, 3);

  // High horizontal stabilizer bridging the two vertical fins
  ctx.beginPath();
  ctx.moveTo(-12, -9);
  ctx.lineTo(-12, 9);
  ctx.stroke();

  // Twin propellers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(4, -6, 4, 0, Math.PI * 2);
  ctx.arc(4, 6, 4, 0, Math.PI * 2);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -12, 2.8);
}

function drawAh1(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AH-1G Cobra: Dedicated Tandem Attack Helicopter ════
  ctx.fillStyle = '#061322';
  // Extremely narrow 36-inch fuselage
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(8, -1.8);
  ctx.lineTo(-13, -1.2);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-13, 1.2);
  ctx.lineTo(8, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stub wings for rocket pods
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-1, -7, 3, 14);

  // Under-nose 20mm rotary cannon chin turret
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(8, -1, 4, 2);

  // Skid landing gear
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-5, -3.2, 10, 6.4);
}

function drawUh1(rc: RenderContext, _plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ UH-1 Huey / UH-2 Seasprite: Combat Utility Helicopter ════
  ctx.fillStyle = '#061322';
  // Broad cabin fuselage
  ctx.beginPath();
  ctx.ellipse(2, 0, 11, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tail boom
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-16, 0);
  ctx.stroke();

  // Twin skids
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, -4.2);
  ctx.lineTo(7, -4.2);
  ctx.moveTo(-4, 4.2);
  ctx.lineTo(7, 4.2);
  ctx.stroke();

  // Open side cargo doors with Marine squads
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(-1, -3.6, 5, 1.2);
  ctx.fillRect(-1, 2.4, 5, 1.2);
}

function drawE1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ E-1B Tracer: Airborne Early Warning (AEW) with Dorsal Dome ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High straight wings with twin radial engines
  ctx.fillStyle = '#0B1F34';
  ctx.fillRect(-2, -22, 6, 44);
  ctx.strokeRect(-2, -22, 6, 44);

  // Huge teardrop aerodynamic dorsal radome ("Flying Saucer")
  ctx.fillStyle = 'rgba(7, 26, 43, 0.9)';
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin vertical tail fins
  ctx.beginPath();
  ctx.moveTo(-13, -8);
  ctx.lineTo(-13, 8);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -18, 3.2);
}

function drawC47(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ C-47 Skytrain / Dakota: Twin-Engine Paratrooper Transport ════
  ctx.fillStyle = '#3B4D36';
  ctx.strokeStyle = '#C5E1A5';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Swept-back tapered transport wings
  ctx.beginPath();
  ctx.moveTo(5, -24);
  ctx.lineTo(-4, -24);
  ctx.lineTo(-5, 24);
  ctx.lineTo(4, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Invasion white stripes on wings
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(2, -13);
  ctx.lineTo(-3, -13);
  ctx.moveTo(2, 13);
  ctx.lineTo(-3, 13);
  ctx.stroke();

  // Tailplane
  ctx.strokeStyle = '#C5E1A5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, -9);
  ctx.lineTo(-14, 9);
  ctx.stroke();

  // Twin radial propellers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.beginPath();
  ctx.arc(8, -8, 5, 0, Math.PI * 2);
  ctx.arc(8, 8, 5, 0, Math.PI * 2);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -18, 3.3);
}

function drawC1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const m = plane.model;
  const isPlayer = plane.side === 'player';

  // ════ C-1 Trader / S-2 Tracker: Twin-Engine Carrier Transport/ASW ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 14, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High straight wing with twin radial engines
  ctx.fillStyle = '#0B1F34';
  ctx.fillRect(-2, -22, 6, 44);
  ctx.strokeRect(-2, -22, 6, 44);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(6, -1.8, 4.5, 3.6);

  // Twin propellers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(6, -8, 5, 0, Math.PI * 2);
  ctx.arc(6, 8, 5, 0, Math.PI * 2);
  ctx.stroke();

  // S-2 extended MAD boom
  if (m === 's2') {
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(-19, 0);
    ctx.stroke();
  }

  if (isPlayer) drawUSInsignia(rc, 0, -16, 3.2);
}

function drawSh2(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ SH-2 Seasprite: LAMPS I Shipboard ASW Helicopter ════
  ctx.fillStyle = '#061322';
  // Streamlined cabin fuselage
  ctx.beginPath();
  ctx.ellipse(3, 0, 13, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chin search radar blister dome (LN-66HP surface search radar)
  ctx.fillStyle = '#1A237E';
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(13, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin General Electric T58 turboshaft engine fairings on roof
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -3.2, 8, 2.2);
  ctx.fillRect(-2, 1.0, 8, 2.2);

  // Tail boom
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-18, 0);
  ctx.stroke();

  // Side Mk 46 lightweight acoustic homing torpedo weapon racks
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(0, -6.5, 9, 2.2);
  ctx.fillRect(0, 4.3, 9, 2.2);

  // Landing wheels
  ctx.fillStyle = '#263238';
  ctx.fillRect(3, -5.2, 3, 1.5);
  ctx.fillRect(3, 3.7, 3, 1.5);

  if (isPlayer) drawUSInsignia(rc, 0, 0, 2.8);
}

function drawP3(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ P-3C Orion: 4-Turboprop Long-Range ASW Maritime Patrol ════
  ctx.fillStyle = '#061322';
  // Long cylindrical fuselage with prominent cockpit
  ctx.beginPath();
  ctx.ellipse(4, 0, 24, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad high-aspect ratio straight wings (wingspan 48)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(5, -24);
  ctx.lineTo(8, -24);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 24);
  ctx.lineTo(5, 24);
  ctx.lineTo(-3, 24);
  ctx.lineTo(-3, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight deck cockpit windshield
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(17, -2.1, 4.5, 4.2);

  // 4x Allison T56 Turboprop Engine Nacelles (y = ±9, ±17)
  ctx.fillStyle = '#263238';
  for (const ey of [-17, -9, 9, 17]) {
    ctx.fillRect(1, ey - 2.4, 10, 4.8);
    ctx.beginPath();
    ctx.arc(11, ey, 3.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Spinning 4-blade propellers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  for (const ey of [-17, -9, 9, 17]) {
    ctx.beginPath();
    ctx.arc(12, ey, 3.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Stinger MAD (Magnetic Anomaly Detector) Tail Boom (length 18px behind tail)
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-30, 0);
  ctx.stroke();

  // Tall vertical fin & broad horizontal stabilizers
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-16, -11);
  ctx.lineTo(-19, -11);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-19, 11);
  ctx.lineTo(-16, 11);
  ctx.stroke();

  // Sonobuoy launch chute belly tubes
  ctx.fillStyle = '#80DEEA';
  for (let sb = 0; sb < 4; sb++) {
    ctx.fillRect(-8 + sb * 3, -1.2, 1.8, 2.4);
  }

  if (isPlayer) drawUSInsignia(rc, 0, -18, 3.5);
}

function drawMig21(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ MiG-21 Fishbed: Pure Delta Supersonic Interceptor ════
  ctx.fillStyle = '#180E14';
  ctx.strokeStyle = '#FF5252';
  // Long cylindrical fuselage with conical nose centerbody shock cone
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(13, -2.2);
  ctx.lineTo(-13, -2.0);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-13, 2.0);
  ctx.lineTo(13, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Conical shock cone inside nose intake
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(14, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Pure delta wing (57° sweep)
  ctx.fillStyle = '#22141B';
  ctx.strokeStyle = '#FF5252';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-6, -13);
  ctx.lineTo(-8, -13);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 13);
  ctx.lineTo(-6, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(4, -1.2, 4.8, 2.4);

  // Swept tailplanes & large dorsal spine
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-13, -6);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-13, 6);
  ctx.lineTo(-10, 6);
  ctx.stroke();

  // Red Star insignia on wings
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
  ctx.arc(0, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMig17(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ MiG-17 Fresco: 45° Swept Subsonic Agile Fighter ════
  ctx.fillStyle = '#180E14';
  ctx.strokeStyle = '#FF5252';
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 45° swept wings with 3 wing fences on each side
  ctx.fillStyle = '#22141B';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-3, -16);
  ctx.lineTo(-8, -16);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 16);
  ctx.lineTo(-3, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(3, -1.4, 4.8, 2.8);

  // Wing fences
  for (const wy of [-12, -7, 7, 12]) {
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.lineTo(-4, wy);
    ctx.stroke();
  }

  // Red Star
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(0, -10, 2.6, 0, Math.PI * 2);
  ctx.arc(0, 10, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawIl28(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Il-28 Beagle: Twin-Engine Jet Tactical Bomber ════
  ctx.fillStyle = '#180E14';
  ctx.strokeStyle = '#FF5252';
  // Long fuselage with glazed nose
  ctx.beginPath();
  ctx.ellipse(3, 0, 20, 4.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High straight wings with twin Klimov jet engine nacelles
  ctx.fillStyle = '#22141B';
  ctx.beginPath();
  ctx.moveTo(4, -25);
  ctx.lineTo(6, -25);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 25);
  ctx.lineTo(4, 25);
  ctx.lineTo(-4, 25);
  ctx.lineTo(-4, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glazed navigator nose & bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(14, -1.8, 5, 3.6);
  ctx.fillRect(6, -1.5, 4.5, 3);

  // Twin jet nacelles under wings
  ctx.fillStyle = '#263238';
  ctx.fillRect(0, -10, 12, 4.2);
  ctx.fillRect(0, 5.8, 12, 4.2);

  // Tail gunner turret
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(-17, -1, 3, 2);

  // Red Star
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(0, -16, 3, 0, Math.PI * 2);
  ctx.arc(0, 16, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSu7(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Su-7 Fitter: Supersonic Heavy Strike Fighter ════
  ctx.fillStyle = '#141416';
  ctx.strokeStyle = '#FF5252';
  // Long tubular fuselage with Lyulka AL-7F afterburning turbojet
  ctx.beginPath();
  ctx.ellipse(3, 0, 18, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Nose intake shock cone
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(21, 0);
  ctx.stroke();

  // Heavily swept 62-degree wings with prominent wing fences
  ctx.fillStyle = '#201B1E';
  ctx.strokeStyle = '#FF5252';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-4, -18);
  ctx.lineTo(-9, -18);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-9, 18);
  ctx.lineTo(-4, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(6, -1.4, 5, 2.8);

  // Wing boundary-layer fences
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-6, -9);
  ctx.moveTo(0, 9);
  ctx.lineTo(-6, 9);
  ctx.stroke();

  // Twin 30mm NR-30 wing-root autocannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(4, -4);
  ctx.lineTo(9, -4);
  ctx.moveTo(4, 4);
  ctx.lineTo(9, 4);
  ctx.stroke();

  // Red Star
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(-2, -12, 2.8, 0, Math.PI * 2);
  ctx.arc(-2, 12, 2.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawMig19(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ MiG-19 Farmer: Twin-Jet Supersonic Fighter (VPAF 925th Reg) ════
  ctx.fillStyle = '#161418';
  ctx.strokeStyle = '#FF5252';
  // Twin-engine fuselage with wide rear section
  ctx.beginPath();
  ctx.ellipse(2, 0, 15, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin exhaust nozzles at rear
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-13, -2.6, 3, 2.2);
  ctx.fillRect(-13, 0.4, 3, 2.2);

  // 55° sharply swept wings
  ctx.fillStyle = '#201B1E';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-4, -17);
  ctx.lineTo(-8, -17);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 17);
  ctx.lineTo(-4, 17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(4, -1.4, 4.8, 2.8);

  // Wing fence on each wing
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-5, -10);
  ctx.moveTo(0, 10);
  ctx.lineTo(-5, 10);
  ctx.stroke();

  // Triple 30mm NR-30 guns (2 in wing roots, 1 in nose)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(2, -4);
  ctx.lineTo(8, -4);
  ctx.moveTo(2, 4);
  ctx.lineTo(8, 4);
  ctx.moveTo(10, 1.8);
  ctx.lineTo(15, 1.8);
  ctx.stroke();

  // VPAF Red Star with Yellow Border
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(-2, -11, 2.6, 0, Math.PI * 2);
  ctx.arc(-2, 11, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawTu16(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Tu-16 Badger: Heavy Maritime Anti-Ship Missile Bomber (Soviet AV-MF) ════
  ctx.fillStyle = '#121922';
  ctx.strokeStyle = '#FF5252';
  // Long fuselage with glazed navigator nose and chin radome
  ctx.beginPath();
  ctx.ellipse(3, 0, 26, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glazed cockpit & nose
  ctx.fillStyle = '#80DEEA';
  ctx.beginPath();
  ctx.arc(24, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Chin search radar radome (Short Horn)
  ctx.fillStyle = '#37474F';
  ctx.fillRect(14, -2, 4.5, 4);

  // Large 35° swept wings
  ctx.fillStyle = '#18222C';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-8, -34);
  ctx.lineTo(-15, -34);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-15, 34);
  ctx.lineTo(-8, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Huge Mikulin AM-3 turbojet nacelles blended into wing roots
  ctx.fillStyle = '#263238';
  ctx.fillRect(2, -8.5, 14, 5.2);
  ctx.fillRect(2, 3.3, 14, 5.2);

  // Swept tailplane and tail barbette
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(-24, -12);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-24, 12);
  ctx.lineTo(-18, 12);
  ctx.stroke();

  // Tail gunner 23mm turret
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(-26, -1, 4, 2);

  // Underwing KSR-5 (AS-5 Kelt) heavy anti-ship cruise missiles
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 1.3;
  for (const my of [-18, 18]) {
    ctx.fillRect(-2, my - 1.6, 12, 3.2);
    ctx.strokeRect(-2, my - 1.6, 12, 3.2);
    // Missile delta wings
    ctx.beginPath();
    ctx.moveTo(3, my - 4);
    ctx.lineTo(6, my);
    ctx.lineTo(3, my + 4);
    ctx.stroke();
  }

  // Soviet Red Stars on wings
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(-6, -26, 3.2, 0, Math.PI * 2);
  ctx.arc(-6, 26, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawA1h(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ Douglas A-1H Skyraider: Heavy Armor, Wide Wings, 15 Pylons ════
  ctx.fillStyle = '#061322';
  // Bulky deep fuselage with Wright R-3350 Duplex-Cyclone
  ctx.beginPath();
  ctx.ellipse(2, 0, 15, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wide broad straight wings (Wingspan 40)
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(3, -20);
  ctx.lineTo(5, -20);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 20);
  ctx.lineTo(3, 20);
  ctx.lineTo(-5, 20);
  ctx.lineTo(-5, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(1, -1.7, 5, 3.4);

  // 4 wing-mounted 20mm M3 cannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  for (const cy of [-8, -6, 6, 8]) {
    ctx.beginPath();
    ctx.moveTo(3, cy);
    ctx.lineTo(8, cy);
    ctx.stroke();
  }

  // Big 4-blade prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(17, 0, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Dive brakes on fuselage sides
  ctx.fillStyle = '#455A64';
  ctx.fillRect(-6, -4.8, 5, 1.2);
  ctx.fillRect(-6, 3.6, 5, 1.2);

  if (isPlayer) drawUSInsignia(rc, 0, -13, 3.6);
}

function drawA37b(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ Cessna A-37B Dragonfly: Side-by-Side Twin Cockpit, Wingtip Tip Tanks ════
  ctx.fillStyle = '#061322';
  // Stubby twin-seat fuselage
  ctx.beginPath();
  ctx.ellipse(1, 0, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.beginPath();
  ctx.ellipse(2, 0, 4.5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Straight wings with prominent wingtip fuel tanks
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(2, -15);
  ctx.lineTo(2, 15);
  ctx.lineTo(-4, 15);
  ctx.lineTo(-4, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Distinctive wingtip fuel tanks
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(-6, -17, 8, 2.8);
  ctx.fillRect(-6, 14.2, 8, 2.8);

  // Nose GAU-2B/A Minigun (7.62mm 6-barrel)
  ctx.strokeStyle = '#FFCA28';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, 0, -9, 3);
}

function drawF5a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ Northrop F-5A Freedom Fighter: Slender Area-Ruled Fuselage & Tip Sidewinders ════
  ctx.fillStyle = '#061322';
  // Slender needle nose with coke-bottle waist
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(10, -2.2);
  ctx.lineTo(-6, -3.2);
  ctx.lineTo(-14, -2.4);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 2.4);
  ctx.lineTo(-6, 3.2);
  ctx.lineTo(10, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Low aspect ratio trapezoidal wings
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(2, -2.6);
  ctx.lineTo(-2, -13);
  ctx.lineTo(-6, -13);
  ctx.lineTo(-5, -2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 2.6);
  ctx.lineTo(-2, 13);
  ctx.lineTo(-6, 13);
  ctx.lineTo(-5, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Slender canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(4, -1.2, 5, 2.4);

  // Wingtip missile launch rails with AIM-9 Sidewinders
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1, -13.5);
  ctx.lineTo(-8, -13.5);
  ctx.moveTo(-1, 13.5);
  ctx.lineTo(-8, 13.5);
  ctx.stroke();

  // Twin M39A2 20mm cannons in nose upper decking
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(9, -1);
  ctx.lineTo(12, -1);
  ctx.moveTo(9, 1);
  ctx.lineTo(12, 1);
  ctx.stroke();

  if (isPlayer) drawUSInsignia(rc, -2, -8, 2.8);
}

function drawF104g(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;
  const isPlayer = plane.side === 'player';

  // ════ Lockheed F-104G Starfighter: Missile with a Man in it, Razor Wings, T-Tail ════
  ctx.fillStyle = '#061322';
  // Extreme needle fuselage (24m long feel)
  ctx.beginPath();
  ctx.moveTo(21, 0);
  ctx.lineTo(12, -2.2);
  ctx.lineTo(-14, -2.4);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-14, 2.4);
  ctx.lineTo(12, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Razor-thin trapezoidal stub wings with negative dihedral (droop)
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(0, -2.2);
  ctx.lineTo(-2, -11);
  ctx.lineTo(-6, -11);
  ctx.lineTo(-5, -2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 2.2);
  ctx.lineTo(-2, 11);
  ctx.lineTo(-6, 11);
  ctx.lineTo(-5, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(6, -1.2, 5, 2.4);

  // High T-Tail horizontal stabilizer mounted atop tall vertical fin
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-16, -6.5);
  ctx.lineTo(-16, 6.5);
  ctx.stroke();

  // Shock cone half-spike engine intakes
  ctx.fillStyle = '#37474F';
  ctx.fillRect(4, -3.2, 4, 1.4);
  ctx.fillRect(4, 1.8, 4, 1.4);

  // Wingtip tiptanks or Sidewinders
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(-7, -12, 7, 2);
  ctx.fillRect(-7, 10, 7, 2);

  if (isPlayer) drawUSInsignia(rc, -3, -7, 2.5);
}

function drawMirage3(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Dassault Mirage IIIE: Pure Tailless Delta Wing, Shock-Cone Intakes ════
  ctx.fillStyle = '#061322';
  // Long slender conical nose
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(9, -2.5);
  ctx.lineTo(-14, -3.2);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 3.2);
  ctx.lineTo(9, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pure 60° Delta Wing (無尾翼三角翼)
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-14, -17);
  ctx.lineTo(-14, 17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(4, -1.3, 5, 2.6);

  // Half-cone shock spikes on air intakes
  ctx.fillStyle = '#37474F';
  ctx.fillRect(5, -3.8, 4, 1.4);
  ctx.fillRect(5, 2.4, 4, 1.4);

  // French Armée de l'Air roundel
  drawRAFRoundel(rc, -5, -8, 3);
}

function drawHunterFga9(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Hawker Hunter FGA.9: Curved Wing-Root Intakes, Dogtooth Swept Wings ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Swept wings with wing-root air intakes
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, -16);
  ctx.lineTo(-7, -16);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-7, 16);
  ctx.lineTo(-3, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(4, -1.4, 5, 2.8);

  // 4x 30mm ADEN cannon pack in lower forward fuselage
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(7, -1.8, 3, 3.6);

  drawRAFRoundel(rc, -1, -10, 3.2);
}

function drawBe12(rc: RenderContext, _plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Beriev Be-12 Chayka: Soviet Twin-Turboprop Gull-Wing ASW Flying Boat ════
  ctx.fillStyle = '#18131A';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.7;

  // Flying-boat chine fuselage with glazed navigator nose & rear MAD tail sting
  ctx.beginPath();
  ctx.moveTo(21, 0);
  ctx.lineTo(15, -3.4);
  ctx.lineTo(2, -4.4);
  ctx.lineTo(-17, -2.8);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-17, 2.8);
  ctx.lineTo(2, 4.4);
  ctx.lineTo(15, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High gull-wing parasol wing with wingtip stabilizing floats
  ctx.beginPath();
  ctx.moveTo(4, -27);
  ctx.lineTo(-3, -27);
  ctx.lineTo(-5, -4);
  ctx.lineTo(5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4, 27);
  ctx.lineTo(-3, 27);
  ctx.lineTo(-5, 4);
  ctx.lineTo(5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wingtip floats
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-1, -29, 7, 2.5);
  ctx.fillRect(-1, 26.5, 7, 2.5);

  // Twin Ivchenko AI-20D turboprop nacelles & spinning prop discs
  ctx.fillRect(1, -11.5, 9, 3.4);
  ctx.fillRect(1, 8.1, 9, 3.4);
  ctx.strokeStyle = 'rgba(255, 138, 128, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(10.5, -9.8, 5, 0, Math.PI * 2);
  ctx.arc(10.5, 9.8, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Twin vertical H-tail fins & extended rear MAD sting boom
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -9.5);
  ctx.lineTo(-18, 9.5);
  ctx.moveTo(-16, -9.5);
  ctx.lineTo(-20.5, -9.5);
  ctx.moveTo(-16, 9.5);
  ctx.lineTo(-20.5, 9.5);
  ctx.stroke();

  ctx.strokeStyle = '#FFD54F';
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(-28, 0);
  ctx.stroke();

  // Red Stars
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(0, -19, 2.8, 0, Math.PI * 2);
  ctx.arc(0, 19, 2.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawIl38(rc: RenderContext, _plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Ilyushin Il-38 May: Soviet 4-Turboprop Long-Range ASW Maritime Patrol ════
  ctx.fillStyle = '#181218';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.9;

  // Long cylindrical patrol fuselage
  ctx.beginPath();
  ctx.ellipse(2, 0, 23, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Forward ventral Berkut search radar bulge
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.ellipse(15, 0, 5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Straight-tapered long-span patrol wings (mounted forward of CG)
  ctx.fillStyle = '#181218';
  ctx.beginPath();
  ctx.moveTo(8, -4.5);
  ctx.lineTo(1, -34);
  ctx.lineTo(-5, -34);
  ctx.lineTo(-3, -4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, 4.5);
  ctx.lineTo(1, 34);
  ctx.lineTo(-5, 34);
  ctx.lineTo(-3, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4 Ivchenko AI-20M turboprop nacelles & 4 prop discs
  ctx.fillStyle = '#37474F';
  for (const ny of [-12, -23, 9, 20]) {
    ctx.fillRect(0, ny, 9, 3.2);
  }
  ctx.strokeStyle = 'rgba(255, 138, 128, 0.65)';
  ctx.lineWidth = 1.1;
  for (const py of [-10.4, -21.4, 10.6, 21.6]) {
    ctx.beginPath();
    ctx.arc(9.5, py, 4.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Horizontal stabilizer & Rear MAD sting boom
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-18, -11);
  ctx.lineTo(-22, -11);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-22, 11);
  ctx.lineTo(-18, 11);
  ctx.stroke();

  ctx.strokeStyle = '#FFD54F';
  ctx.beginPath();
  ctx.moveTo(-21, 0);
  ctx.lineTo(-29, 0);
  ctx.stroke();

  // Red Stars
  ctx.fillStyle = '#D50000';
  ctx.beginPath();
  ctx.arc(-2, -28, 3, 0, Math.PI * 2);
  ctx.arc(-2, 28, 3, 0, Math.PI * 2);
  ctx.fill();
}

export const VIETNAM_DRAWERS: AircraftDrawerTable = {
  f4b: drawF4b,
  f4j: drawF4b,
  f4e: drawF4b,
  f8: drawF8,
  a4: drawA4,
  a6a: drawA6a,
  a6b_weasel: drawA6a,
  b52: drawB52,
  f105: drawF105,
  a7: drawA7,
  ov10: drawOv10,
  ah1: drawAh1,
  uh1: drawUh1,
  uh2: drawUh1,
  e1: drawE1,
  c47: drawC47,
  c1: drawC1,
  s2: drawC1,
  sh2: drawSh2,
  p3: drawP3,
  mig21: drawMig21,
  mig17: drawMig17,
  il28: drawIl28,
  su7: drawSu7,
  mig19: drawMig19,
  tu16: drawTu16,
  a1h: drawA1h,
  a37b: drawA37b,
  f5a: drawF5a,
  f104g: drawF104g,
  mirage3: drawMirage3,
  hunter_fga9: drawHunterFga9,
  be12: drawBe12,
  il38: drawIl38,
};
