// Late Cold War aircraft (1973-91): vector silhouettes, drawn in the plane's local frame (nose along +x).
import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawNationalInsignia } from '../nation';
import { AircraftDrawerTable } from './types';

function drawF14a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F-14A Tomcat: Variable-sweep wings, twin vertical tails, glove vanes ════
  ctx.fillStyle = '#091A2C';
  // Blended lifting-body fuselage
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(8, -4.5);
  ctx.lineTo(-14, -5.5);
  ctx.lineTo(-18, -4);
  ctx.lineTo(-18, 4);
  ctx.lineTo(-14, 5.5);
  ctx.lineTo(8, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Variable-Sweep Wings (Swept position for high-speed intercept)
  ctx.fillStyle = '#0D2238';
  ctx.beginPath();
  ctx.moveTo(6, -5);
  ctx.lineTo(-6, -22);
  ctx.lineTo(-12, -22);
  ctx.lineTo(-4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, 5);
  ctx.lineTo(-6, 22);
  ctx.lineTo(-12, 22);
  ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit canopy glass highlight
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.ellipse(9, 0, 4.5, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Twin canted vertical stabilizers
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, -3.8);
  ctx.lineTo(-16, -3.8);
  ctx.moveTo(-10, 3.8);
  ctx.lineTo(-16, 3.8);
  ctx.stroke();

  // Twin TF30 engine exhausts
  ctx.fillStyle = '#FFB300';
  ctx.fillRect(-19, -4.5, 2, 2.5);
  ctx.fillRect(-19, 2, 2, 2.5);

  drawNationalInsignia(rc, plane, 0, -12, 3.0);
}

function drawFa18a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F/A-18A Hornet: Leading edge root extensions (LEX) and twin canted tails ════
  ctx.fillStyle = '#08182A';
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(10, -2.8);
  ctx.lineTo(2, -4.5);
  ctx.lineTo(-14, -4.5);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 4.5);
  ctx.lineTo(2, 4.5);
  ctx.lineTo(10, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mid-mounted 20-degree swept wings
  ctx.fillStyle = '#0D2238';
  ctx.beginPath();
  ctx.moveTo(2, -4.5);
  ctx.lineTo(-2, -18);
  ctx.lineTo(-7, -18);
  ctx.lineTo(-6, -4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 4.5);
  ctx.lineTo(-2, 18);
  ctx.lineTo(-7, 18);
  ctx.lineTo(-6, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit canopy highlight
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.ellipse(8, 0, 3.8, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Twin outward-canted rudders
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -3.2);
  ctx.lineTo(-14, -3.8);
  ctx.moveTo(-8, 3.2);
  ctx.lineTo(-14, 3.8);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -10, 2.8);
}

function drawA10a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ A-10A Thunderbolt II: Straight unswept high-aspect wing, twin nacelles over tail ════
  ctx.fillStyle = '#091A26';
  // Rugged titanium bathtub cockpit & fuselage
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(12, -2.8);
  ctx.lineTo(-16, -2.8);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-16, 2.8);
  ctx.lineTo(12, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Long unswept wings (Wide Wingspan)
  ctx.fillStyle = '#0D2332';
  ctx.beginPath();
  ctx.moveTo(4, -26);
  ctx.lineTo(4, 26);
  ctx.lineTo(-4, 26);
  ctx.lineTo(-4, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin elevated TF34 turbofans mounted on rear fuselage
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-8, -7, 10, 3.8);
  ctx.fillRect(-8, 3.2, 10, 3.8);

  // GAU-8 30mm Avenger Gatling Gun muzzle in nose
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(16, -0.6, 2.5, 1.2);

  drawNationalInsignia(rc, plane, -1, -14, 3.2);
}

function drawF15a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F-15A Eagle: Twin-tail high-wing air superiority fighter ════
  ctx.fillStyle = '#071626';
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(10, -3.5);
  ctx.lineTo(-16, -4.8);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-16, 4.8);
  ctx.lineTo(10, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Large clipped-delta wings
  ctx.fillStyle = '#0D2238';
  ctx.beginPath();
  ctx.moveTo(6, -4.5);
  ctx.lineTo(-4, -22);
  ctx.lineTo(-11, -22);
  ctx.lineTo(-8, -4.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, 4.5);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-11, 22);
  ctx.lineTo(-8, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.ellipse(9, 0, 4.2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Twin vertical fins
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(-16, -4);
  ctx.moveTo(-10, 4);
  ctx.lineTo(-16, 4);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -12, 3.0);
}

function drawF16a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F-16A Fighting Falcon: Single engine, frameless bubble canopy, blended wing-body ════
  ctx.fillStyle = '#081A2A';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(8, -2.6);
  ctx.lineTo(-13, -3.4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-13, 3.4);
  ctx.lineTo(8, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cropped-delta wing with missile rails on tips
  ctx.fillStyle = '#0D2238';
  ctx.beginPath();
  ctx.moveTo(3, -3.2);
  ctx.lineTo(-3, -16);
  ctx.lineTo(-7, -16);
  ctx.lineTo(-6, -3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 3.2);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-7, 16);
  ctx.lineTo(-6, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.65)';
  ctx.beginPath();
  ctx.ellipse(7, 0, 3.8, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, -1, -9, 2.6);
}

function drawMig29a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const m = plane.model;

  // ════ MiG-29A Fulcrum & Su-27 Flanker: Twin engine, twin tail, blended LERX ════
  const isSu27 = m === 'su27';
  const scale = isSu27 ? 1.25 : 1.0;
  ctx.fillStyle = '#1C1217';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(17 * scale, 0);
  ctx.lineTo(9 * scale, -3.2 * scale);
  ctx.lineTo(-14 * scale, -4.5 * scale);
  ctx.lineTo(-17 * scale, 0);
  ctx.lineTo(-14 * scale, 4.5 * scale);
  ctx.lineTo(9 * scale, 3.2 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swept wing with prominent root extensions
  ctx.fillStyle = '#28151D';
  ctx.beginPath();
  ctx.moveTo(2 * scale, -4 * scale);
  ctx.lineTo(-4 * scale, -18 * scale);
  ctx.lineTo(-9 * scale, -18 * scale);
  ctx.lineTo(-7 * scale, -4.5 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2 * scale, 4 * scale);
  ctx.lineTo(-4 * scale, 18 * scale);
  ctx.lineTo(-9 * scale, 18 * scale);
  ctx.lineTo(-7 * scale, 4.5 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, -4 * scale, -10 * scale, 2.5);
  drawNationalInsignia(rc, plane, -4 * scale, 10 * scale, 2.5);
}

function drawTu22m3(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Tu-22M3 Backfire: Supersonic variable-sweep heavy missile bomber ════
  ctx.fillStyle = '#1B0E14';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(14, -4.5);
  ctx.lineTo(-18, -6);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-18, 6);
  ctx.lineTo(14, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Variable sweep wings swept back for supersonic penetration
  ctx.fillStyle = '#24141C';
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(-6, -26);
  ctx.lineTo(-12, -26);
  ctx.lineTo(-4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.lineTo(-6, 26);
  ctx.lineTo(-12, 26);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(10, -2, 6, 4);

  // Kh-22 (AS-4 Kitchen) heavy supersonic anti-ship missile mounted under belly
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(-6, -1.8, 16, 3.6);

  // National insignia
  drawNationalInsignia(rc, plane, -8, -16, 3);
  drawNationalInsignia(rc, plane, -8, 16, 3);
}

function drawAh64a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AH-64A Apache: Tandem cockpit, cheek sponsons, TADS turret, 30mm chain gun, Hellfire rails ════
  ctx.fillStyle = '#102015';
  ctx.strokeStyle = '#66BB6A';
  ctx.lineWidth = 1.6;

  // Narrow fuselage with cheek avionics sponsons
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(10, -2.2);
  ctx.lineTo(2, -4.2);
  ctx.lineTo(-8, -3.2);
  ctx.lineTo(-20, -1.5);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-20, 1.5);
  ctx.lineTo(-8, 3.2);
  ctx.lineTo(2, 4.2);
  ctx.lineTo(10, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nose TADS/PNVS sensor turret ball
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(15, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // M230 30mm chain gun barrel
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();

  // Stub wings with rocket pods and AGM-114 Hellfire rails
  ctx.strokeStyle = '#81C784';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -4.2);
  ctx.lineTo(-2, -12);
  ctx.moveTo(0, 4.2);
  ctx.lineTo(-2, 12);
  ctx.stroke();

  // Hellfire racks & Hydra pods
  ctx.fillStyle = '#2E7D32';
  ctx.fillRect(-4, -13, 5, 2.2);
  ctx.fillRect(-4, 10.8, 5, 2.2);

  // Tail horizontal stabilator
  ctx.beginPath();
  ctx.moveTo(-21, -6);
  ctx.lineTo(-21, 6);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -4, 0, 2.4);
}

function drawAh1w(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AH-1W SuperCobra: Ultra-slim tandem fuselage, chin Gatling turret, stub wings ════
  ctx.fillStyle = '#0F1A1B';
  ctx.strokeStyle = '#4DB6AC';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(11, -1.8);
  ctx.lineTo(-6, -2.4);
  ctx.lineTo(-21, -1.2);
  ctx.lineTo(-23, 0);
  ctx.lineTo(-21, 1.2);
  ctx.lineTo(-6, 2.4);
  ctx.lineTo(11, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Under-chin 20mm 3-barrel cannon
  ctx.strokeStyle = '#FFCA28';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(19, 0);
  ctx.stroke();

  // Stub wings with TOW/Hellfire pods
  ctx.strokeStyle = '#80CBC4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-1, -2.4);
  ctx.lineTo(-2, -9);
  ctx.moveTo(-1, 2.4);
  ctx.lineTo(-2, 9);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -4, 0, 2.2);
}

function drawF111(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F-111 Aardvark: Long needle nose, variable-sweep shoulder wings, twin TF30 afterburners ════
  ctx.fillStyle = '#0A1822';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(15, -3.2);
  ctx.lineTo(-17, -5.2);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-17, 5.2);
  ctx.lineTo(15, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Variable sweep wings
  ctx.fillStyle = '#0E2232';
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(-5, -24);
  ctx.lineTo(-11, -24);
  ctx.lineTo(-7, -5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 5);
  ctx.lineTo(-5, 24);
  ctx.lineTo(-11, 24);
  ctx.lineTo(-7, 5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit capsule glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(9, -2.2, 5.5, 4.4);

  // Horizontal stabs & twin exhausts
  ctx.beginPath();
  ctx.moveTo(-16, -11);
  ctx.lineTo(-20, -11);
  ctx.lineTo(-19, -4.5);
  ctx.moveTo(-16, 11);
  ctx.lineTo(-20, 11);
  ctx.lineTo(-19, 4.5);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -14, 3.0);
}

function drawE3a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ E-3A Sentry AWACS: 4-engine Boeing 707 airframe with rotating APY-2 rotodome radar ════
  ctx.fillStyle = '#0E1E2E';
  ctx.strokeStyle = '#81D4FA';
  ctx.lineWidth = 2;

  // Long 707 airliner fuselage
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(20, -4.2);
  ctx.lineTo(-24, -4.8);
  ctx.lineTo(-29, 0);
  ctx.lineTo(-24, 4.8);
  ctx.lineTo(20, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swept wings with 4 turbofan nacelles
  ctx.fillStyle = '#14283D';
  ctx.beginPath();
  ctx.moveTo(6, -4.8);
  ctx.lineTo(-8, -32);
  ctx.lineTo(-14, -32);
  ctx.lineTo(-6, -4.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, 4.8);
  ctx.lineTo(-8, 32);
  ctx.lineTo(-14, 32);
  ctx.lineTo(-6, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight deck cockpit glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(18, -2, 5, 4);

  // 4 CFM56 Turbofan engines
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -16, 8, 3.2);
  ctx.fillRect(-6, -26, 8, 3.2);
  ctx.fillRect(-2, 12.8, 8, 3.2);
  ctx.fillRect(-6, 22.8, 8, 3.2);

  // Rotating APY-2 Rotodome 30ft Radar Disc on rear fuselage
  const rotAngle = rc.time * 2.5;
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(rotAngle);
  // Dark half & light half
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(0, 0, 11, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ECEFF1';
  ctx.beginPath();
  ctx.arc(0, 0, 11, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawNationalInsignia(rc, plane, -12, 0, 3.5);
}

function drawE2c(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ E-2C Hawkeye: Twin turboprop carrier AWACS with rotating rotodome and quad tailfins ════
  ctx.fillStyle = '#0B1C2A';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(12, -3.8);
  ctx.lineTo(-16, -4.2);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-16, 4.2);
  ctx.lineTo(12, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High straight wings
  ctx.fillStyle = '#0E2438';
  ctx.beginPath();
  ctx.moveTo(3, -26);
  ctx.lineTo(3, 26);
  ctx.lineTo(-4, 26);
  ctx.lineTo(-4, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight deck glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(10, -2, 4.5, 4);

  // Twin Allison T56 turboprop nacelles & propeller blur discs
  ctx.fillStyle = '#263238';
  ctx.fillRect(0, -11, 8, 3.6);
  ctx.fillRect(0, 7.4, 8, 3.6);
  ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(8, -9.2, 5.5, 0, Math.PI * 2);
  ctx.arc(8, 9.2, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  // Quad vertical tail fins
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(-18, 10);
  ctx.moveTo(-16, -10);
  ctx.lineTo(-20, -10);
  ctx.moveTo(-16, -3.5);
  ctx.lineTo(-20, -3.5);
  ctx.moveTo(-16, 3.5);
  ctx.lineTo(-20, 3.5);
  ctx.moveTo(-16, 10);
  ctx.lineTo(-20, 10);
  ctx.stroke();

  // Rotating APS-125 Radar Rotodome
  const e2Rot = rc.time * 2.8;
  ctx.save();
  ctx.translate(-2, 0);
  ctx.rotate(e2Rot);
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-9.5, 0);
  ctx.lineTo(9.5, 0);
  ctx.stroke();
  ctx.restore();

  drawNationalInsignia(rc, plane, -9, 0, 2.6);
}

function drawA6e(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ A-6E Intruder: Broad bulbous radome, TRAM FLIR ball turret, swept wings ════
  ctx.fillStyle = '#081724';
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 1.7;

  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(9, -4.2);
  ctx.lineTo(-13, -4.6);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-13, 4.6);
  ctx.lineTo(9, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Under-nose TRAM FLIR sensor ball turret
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.arc(13, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Mid-mounted swept wings with wingtip speed brakes
  ctx.fillStyle = '#0D2234';
  ctx.strokeStyle = '#29B6F6';
  ctx.beginPath();
  ctx.moveTo(4, -4.5);
  ctx.lineTo(-4, -22);
  ctx.lineTo(-9, -22);
  ctx.lineTo(-6, -4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 4.5);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-9, 22);
  ctx.lineTo(-6, 4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(4, -2.5, 5.5, 5);

  drawNationalInsignia(rc, plane, -2, -12, 2.8);
}

function drawEa6b(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ EA-6B Prowler: Stretched 4-seat cockpit, football ECM pod on tailfin, ALQ-99 pods ════
  ctx.fillStyle = '#081726';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(10, -4.2);
  ctx.lineTo(-15, -4.6);
  ctx.lineTo(-19, 0);
  ctx.lineTo(-15, 4.6);
  ctx.lineTo(10, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4-seat gold-tinted canopy
  ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.fillRect(4, -2.8, 8, 5.6);

  // Swept wings
  ctx.fillStyle = '#0D2234';
  ctx.strokeStyle = '#00E5FF';
  ctx.beginPath();
  ctx.moveTo(5, -4.5);
  ctx.lineTo(-4, -22);
  ctx.lineTo(-9, -22);
  ctx.lineTo(-6, -4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, 4.5);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-9, 22);
  ctx.lineTo(-6, 4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Football ECM pod on top of vertical fin
  ctx.fillStyle = '#ECEFF1';
  ctx.beginPath();
  ctx.ellipse(-16, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ALQ-99 Tactical Jamming Pods under wings
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -14, 6, 2.5);
  ctx.fillRect(-2, 11.5, 6, 2.5);

  drawNationalInsignia(rc, plane, -1, 0, 2.8);
}

function drawAv8b(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AV-8B Harrier II: Anhedral drooping wings, outrigger landing gear pods, 4 Pegasus nozzles ════
  ctx.fillStyle = '#091925';
  ctx.strokeStyle = '#26C6DA';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(9, -2.8);
  ctx.lineTo(-12, -3.8);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-12, 3.8);
  ctx.lineTo(9, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Supercritical high wing with anhedral droop
  ctx.fillStyle = '#0E2432';
  ctx.beginPath();
  ctx.moveTo(3, -3.6);
  ctx.lineTo(-2, -16);
  ctx.lineTo(-7, -16);
  ctx.lineTo(-5, -3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 3.6);
  ctx.lineTo(-2, 16);
  ctx.lineTo(-7, 16);
  ctx.lineTo(-5, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Raised bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(5, -1.5, 5, 3);

  // Wingtip outrigger landing gear fairings
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(-6, -17.2, 3, 1.8);
  ctx.fillRect(-6, 15.4, 3, 1.8);

  // Four Pegasus vectored thrust rotating nozzle fairings
  ctx.fillStyle = '#FFB300';
  ctx.fillRect(1, -4.5, 2.5, 1.2);
  ctx.fillRect(-3, -4.5, 2.5, 1.2);
  ctx.fillRect(1, 3.3, 2.5, 1.2);
  ctx.fillRect(-3, 3.3, 2.5, 1.2);

  drawNationalInsignia(rc, plane, -2, -9, 2.4);
}

function drawS3a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ S-3A Viking: High swept wings, TF34 turbofans under wings, retractable MAD boom ════
  ctx.fillStyle = '#081726';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(11, -3.5);
  ctx.lineTo(-15, -4.0);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-15, 4.0);
  ctx.lineTo(11, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High swept wings
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(3, -4);
  ctx.lineTo(-3, -24);
  ctx.lineTo(-8, -24);
  ctx.lineTo(-5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 4);
  ctx.lineTo(-3, 24);
  ctx.lineTo(-8, 24);
  ctx.lineTo(-5, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side-by-side cockpit windshield
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(7, -2, 5, 4);

  // Twin TF34 turbofan nacelles under wings
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -10, 8, 3.4);
  ctx.fillRect(-2, 6.6, 8, 3.4);

  // Retractable Magnetic Anomaly Detector (MAD) boom from tail
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-26, 0);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -2, -14, 2.8);
}

function drawC130(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ C-130 Hercules: Four turboprops, high straight wing, side sponsons, blunt nose ════
  ctx.fillStyle = '#0B1C28';
  ctx.strokeStyle = '#80CBC4';
  ctx.lineWidth = 2;

  // Heavy transport fuselage with sponsons
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(18, -4.8);
  ctx.lineTo(4, -5.8);
  ctx.lineTo(-6, -5.8); // Side sponson
  ctx.lineTo(-22, -4.4);
  ctx.lineTo(-27, 0);
  ctx.lineTo(-22, 4.4);
  ctx.lineTo(-6, 5.8);
  ctx.lineTo(4, 5.8);
  ctx.lineTo(18, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High straight wings
  ctx.fillStyle = '#0F2532';
  ctx.beginPath();
  ctx.moveTo(6, -34);
  ctx.lineTo(6, 34);
  ctx.lineTo(-4, 34);
  ctx.lineTo(-4, -34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stepped flight deck greenhouse
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(15, -2.2, 4.5, 4.4);

  // 4 Allison T56 Turboprop engines and blur discs
  ctx.fillStyle = '#263238';
  ctx.fillRect(3, -16, 7, 3.2);
  ctx.fillRect(3, -27, 7, 3.2);
  ctx.fillRect(3, 12.8, 7, 3.2);
  ctx.fillRect(3, 23.8, 7, 3.2);

  ctx.strokeStyle = 'rgba(178, 235, 242, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(10, -14.4, 5, 0, Math.PI * 2);
  ctx.arc(10, -25.4, 5, 0, Math.PI * 2);
  ctx.arc(10, 14.4, 5, 0, Math.PI * 2);
  ctx.arc(10, 25.4, 5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -6, 0, 3.4);
}

function drawC2a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ C-2A Greyhound: Carrier transport, quad tail fins, twin turboprops ════
  ctx.fillStyle = '#091A29';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(12, -4.0);
  ctx.lineTo(-17, -4.5);
  ctx.lineTo(-21, 0);
  ctx.lineTo(-17, 4.5);
  ctx.lineTo(12, 4.0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wings
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(3, -25);
  ctx.lineTo(3, 25);
  ctx.lineTo(-4, 25);
  ctx.lineTo(-4, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit windshield
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(10, -2, 4.5, 4);

  // Turboprops
  ctx.fillStyle = '#263238';
  ctx.fillRect(0, -11, 8, 3.6);
  ctx.fillRect(0, 7.4, 8, 3.6);

  // Quad fins
  ctx.strokeStyle = '#29B6F6';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(-18, 10);
  ctx.moveTo(-16, -10);
  ctx.lineTo(-20, -10);
  ctx.moveTo(-16, -3.5);
  ctx.lineTo(-20, -3.5);
  ctx.moveTo(-16, 3.5);
  ctx.lineTo(-20, 3.5);
  ctx.moveTo(-16, 10);
  ctx.lineTo(-20, 10);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -8, 0, 2.6);
}

function drawSh3f(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ SH-3H / SH-3F Sea King: Boat hull, twin sponsons with torpedoes, 5-blade rotor ════
  ctx.fillStyle = '#0A1B28';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(10, -3.6);
  ctx.lineTo(0, -4.5); // Sponson
  ctx.lineTo(-8, -4.5);
  ctx.lineTo(-16, -2.6);
  ctx.lineTo(-22, -1.2);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-22, 1.2);
  ctx.lineTo(-16, 2.6);
  ctx.lineTo(-8, 4.5);
  ctx.lineTo(0, 4.5);
  ctx.lineTo(10, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin amphibious side sponsons
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-6, -6.5, 8, 2.2);
  ctx.fillRect(-6, 4.3, 8, 2.2);

  // Mk 46 torpedo mounted on sponson
  ctx.fillStyle = '#FFB300';
  ctx.fillRect(-5, -7.5, 6, 1.3);
  ctx.fillRect(-5, 6.2, 6, 1.3);

  drawNationalInsignia(rc, plane, -6, 0, 2.5);
}

function drawCh53(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ CH-53 Sea Stallion: Heavy-lift helicopter, massive cylindrical fuel sponsons ════
  ctx.fillStyle = '#0D1E20';
  ctx.strokeStyle = '#26A69A';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(15, -4.5);
  ctx.lineTo(-14, -5.5);
  ctx.lineTo(-24, -2.2);
  ctx.lineTo(-28, 0);
  ctx.lineTo(-24, 2.2);
  ctx.lineTo(-14, 5.5);
  ctx.lineTo(15, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Huge cylindrical external fuel tanks / sponsons on both sides
  ctx.fillStyle = '#004D40';
  ctx.strokeStyle = '#80CBC4';
  ctx.lineWidth = 1.4;
  ctx.fillRect(-8, -9.5, 16, 4);
  ctx.strokeRect(-8, -9.5, 16, 4);
  ctx.fillRect(-8, 5.5, 16, 4);
  ctx.strokeRect(-8, 5.5, 16, 4);

  // Aft cargo ramp seam
  ctx.beginPath();
  ctx.moveTo(-16, -3.5);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-16, 3.5);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -4, 0, 3.2);
}

function drawTu95(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Tu-95 Bear: 35-degree swept wings, 4 contra-rotating turboprops (8 blur discs!) ════
  ctx.fillStyle = '#1C1217';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 2.2;

  // Massive needle-nose fuselage
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(24, -4.2);
  ctx.lineTo(-28, -5.0);
  ctx.lineTo(-35, 0);
  ctx.lineTo(-28, 5.0);
  ctx.lineTo(24, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 35-degree heavily swept giant wings
  ctx.fillStyle = '#24161D';
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(-18, -42);
  ctx.lineTo(-26, -42);
  ctx.lineTo(-10, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 5);
  ctx.lineTo(-18, 42);
  ctx.lineTo(-26, 42);
  ctx.lineTo(-10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glazed navigator nose & flight deck
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(20, -2, 6, 4);

  // 4 Kuznetsov NK-12 Turboprop engine nacelles
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -18, 14, 4.2);
  ctx.fillRect(-10, -32, 14, 4.2);
  ctx.fillRect(-2, 13.8, 14, 4.2);
  ctx.fillRect(-10, 27.8, 14, 4.2);

  // Contra-rotating dual propeller blur rings on each engine!
  ctx.strokeStyle = 'rgba(255, 112, 67, 0.55)';
  ctx.lineWidth = 1.2;
  const t95P = [
    { x: 12, y: -16 },
    { x: 4, y: -30 },
    { x: 12, y: 16 },
    { x: 4, y: 30 },
  ];
  for (const p of t95P) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
    ctx.arc(p.x - 2, p.y, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Kh-55 Cruise Missiles under belly / rotary bay
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(-8, -2, 16, 4);

  // National insignia
  drawNationalInsignia(rc, plane, -14, -28, 3.5);
  drawNationalInsignia(rc, plane, -14, 28, 3.5);
}

function drawKa27(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Ka-27 Helix: Coaxial twin rotors, stubby boxy fuselage, twin endplate vertical fins ════
  ctx.fillStyle = '#1D1217';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.6;

  // Stubby compact anti-submarine fuselage
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(8, -3.8);
  ctx.lineTo(-10, -4.2);
  ctx.lineTo(-16, -2.5);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-16, 2.5);
  ctx.lineTo(-10, 4.2);
  ctx.lineTo(8, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Chin search radar radome blister
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Twin endplate vertical tail fins
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-16, -9);
  ctx.lineTo(-16, 9);
  ctx.moveTo(-14, -9);
  ctx.lineTo(-18, -9);
  ctx.moveTo(-14, 9);
  ctx.lineTo(-18, 9);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, -4, 0, 2.5);
}

function drawMi24(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Mi-24 Hind: Stepped tandem cockpit, titanium bathtub, angled 12-deg anhedral stub wings ════
  ctx.fillStyle = '#1A1116';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.8;

  // Heavy armored fuselage with stepped double-bubble canopy
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(12, -2.5);
  ctx.lineTo(2, -4.5);
  ctx.lineTo(-10, -3.5);
  ctx.lineTo(-22, -1.5);
  ctx.lineTo(-24, 0);
  ctx.lineTo(-22, 1.5);
  ctx.lineTo(-10, 3.5);
  ctx.lineTo(2, 4.5);
  ctx.lineTo(12, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stepped tandem cockpit bubbles (Front gunner & rear pilot)
  ctx.fillStyle = 'rgba(255, 82, 82, 0.5)';
  ctx.beginPath();
  ctx.arc(13, 0, 2, 0, Math.PI * 2);
  ctx.arc(8, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Angled stub wings with 12-degree anhedral droop
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(2, -4.5);
  ctx.lineTo(-2, -14);
  ctx.moveTo(2, 4.5);
  ctx.lineTo(-2, 14);
  ctx.stroke();

  // AT-6 Spiral missile launch tubes on wingtips & UB-32 rocket pods
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(-4, -15.5, 6, 2.2);
  ctx.fillRect(-4, 13.3, 6, 2.2);

  // Chin Yak-B 12.7mm four-barrel Gatling turret
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(21, 0);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, -4, 0, 2.8);
}

function drawYak38(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Yak-38 Forger: Soviet naval carrier V/STOL jet ════
  ctx.fillStyle = '#1A1218';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(10, -2.8);
  ctx.lineTo(-13, -3.8);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-13, 3.8);
  ctx.lineTo(10, 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lift engine doors behind cockpit
  ctx.fillStyle = '#37474F';
  ctx.fillRect(4, -2.2, 5, 4.4);

  // Small cropped-delta wings
  ctx.fillStyle = '#24161E';
  ctx.strokeStyle = '#FF5252';
  ctx.beginPath();
  ctx.moveTo(1, -3.6);
  ctx.lineTo(-3, -13);
  ctx.lineTo(-7, -13);
  ctx.lineTo(-6, -3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 3.6);
  ctx.lineTo(-3, 13);
  ctx.lineTo(-7, 13);
  ctx.lineTo(-6, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(8, -1.3, 4.2, 2.6);

  // National insignia
  drawNationalInsignia(rc, plane, -4, -8, 2.2);
  drawNationalInsignia(rc, plane, -4, 8, 2.2);
}

function drawA50(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ A-50 Mainstay: Soviet heavy AWACS with rotating Shmel rotodome, high T-tail ════
  ctx.fillStyle = '#1A1116';
  ctx.strokeStyle = '#FF3D00';
  ctx.lineWidth = 2.2;

  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(20, -4.5);
  ctx.lineTo(-24, -5.2);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-24, 5.2);
  ctx.lineTo(20, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swept high wings
  ctx.fillStyle = '#24161C';
  ctx.beginPath();
  ctx.moveTo(6, -5.2);
  ctx.lineTo(-8, -32);
  ctx.lineTo(-14, -32);
  ctx.lineTo(-6, -5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, 5.2);
  ctx.lineTo(-8, 32);
  ctx.lineTo(-14, 32);
  ctx.lineTo(-6, 5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glazed Il-76 navigator nose & flight deck
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(19, -2.2, 6, 4.4);

  // 4 D-30KP Turbofan engines
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-2, -16, 8, 3.4);
  ctx.fillRect(-6, -26, 8, 3.4);
  ctx.fillRect(-2, 12.6, 8, 3.4);
  ctx.fillRect(-6, 22.6, 8, 3.4);

  // Shmel Rotating Radar Rotodome disc
  const a50Rot = rc.time * 2.6;
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(a50Rot);
  ctx.fillStyle = '#CFD8DC';
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10.5, 0);
  ctx.lineTo(10.5, 0);
  ctx.stroke();
  ctx.restore();

  // National insignia
  drawNationalInsignia(rc, plane, -10, -18, 3);
  drawNationalInsignia(rc, plane, -10, 18, 3);
}

function drawSu25(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Su-25 Frogfoot: Armored close air support, straight wings, 10 weapon pylons ════
  ctx.fillStyle = '#1A1215';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(12, -3.2);
  ctx.lineTo(-14, -4.2);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-14, 4.2);
  ctx.lineTo(12, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High-aspect straight wings with wingtip speed brake pods
  ctx.fillStyle = '#24171A';
  ctx.beginPath();
  ctx.moveTo(3, -4.2);
  ctx.lineTo(0, -21);
  ctx.lineTo(-6, -21);
  ctx.lineTo(-5, -4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 4.2);
  ctx.lineTo(0, 21);
  ctx.lineTo(-6, 21);
  ctx.lineTo(-5, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armored cockpit canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(6, -1.5, 5, 3);

  // Wingtip pods
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(-6, -22.5, 5, 2.4);
  ctx.fillRect(-6, 20.1, 5, 2.4);

  // GSh-30-2 30mm twin cannon in nose
  ctx.strokeStyle = '#FFCA28';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(18, -1);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, -4, -12, 2.8);
  drawNationalInsignia(rc, plane, -4, 12, 2.8);
}

function drawTornadoGr1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const m = plane.model;

  // ════ Panavia Tornado GR.1 / IDS: Swing-Wing Strike Bomber, Twin RB199, Tall Fin ════
  ctx.fillStyle = '#061322';
  // Heavy twin-engine box fuselage
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(12, -3.5);
  ctx.lineTo(-14, -4.5);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-14, 4.5);
  ctx.lineTo(12, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Variable sweep wings swept at 45°
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(4, -3.5);
  ctx.lineTo(-5, -17);
  ctx.lineTo(-9, -17);
  ctx.lineTo(-3, -3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 3.5);
  ctx.lineTo(-5, 17);
  ctx.lineTo(-9, 17);
  ctx.lineTo(-3, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tandem canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(5, -1.6, 6, 3.2);

  // Huge tall swept vertical tail
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-16, -1.5, 7, 3);

  // Box air intakes
  ctx.fillRect(3, -4.8, 5, 1.6);
  ctx.fillRect(3, 3.2, 5, 1.6);

  // JP233 or ALARM/Sea Eagle pods under fuselage
  if (m === 'tornado_ids') {
    ctx.fillStyle = '#FFE082';
    ctx.fillRect(-4, -2.5, 10, 5);
  }

  drawNationalInsignia(rc, plane, -5, -10, 3.2);
}

function drawTornadoAdv(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Panavia Tornado ADV F.3: Stretched Radome, Semi-Recessed Skyflash SARH ════
  ctx.fillStyle = '#061322';
  // Stretched interceptor nose for Foxhunter radar
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(12, -3.5);
  ctx.lineTo(-14, -4.5);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-14, 4.5);
  ctx.lineTo(12, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Variable sweep wings swept at 25° for high altitude patrol
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(4, -3.5);
  ctx.lineTo(-2, -18);
  ctx.lineTo(-6, -18);
  ctx.lineTo(-2, -3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 3.5);
  ctx.lineTo(-2, 18);
  ctx.lineTo(-6, 18);
  ctx.lineTo(-2, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tandem interceptor canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(5, -1.6, 6.5, 3.2);

  // 4x Skyflash SARH semi-recessed in fuselage belly
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.4;
  for (const my of [-2, 2]) {
    ctx.beginPath();
    ctx.moveTo(1, my);
    ctx.lineTo(7, my);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, my);
    ctx.lineTo(-1, my);
    ctx.stroke();
  }

  drawNationalInsignia(rc, plane, -4, -11, 3.2);
}

function drawMirage2000(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Dassault Mirage 2000C: Blended Cambered Delta, Super 530D SARH ════
  ctx.fillStyle = '#061322';
  // Needle nose with blended fuselage-wing fillets
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(10, -2.6);
  ctx.lineTo(-13, -3.6);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-13, 3.6);
  ctx.lineTo(10, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Large cambered delta wing
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-14, -18);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-14, 18);
  ctx.lineTo(-12, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(5, -1.3, 5.2, 2.6);

  // 2x Matra Super 530D SARH under wings
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, -9);
  ctx.lineTo(5, -9);
  ctx.moveTo(-2, 9);
  ctx.lineTo(5, 9);
  ctx.stroke();

  // French roundel
  drawNationalInsignia(rc, plane, -4, -9, 3);
}

function drawJaguarGr1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ SEPECAT Jaguar GR.1: High Shoulder Wings, Over-Wing Rails, Chiseled Nose ════
  ctx.fillStyle = '#061322';
  // Long chiseled nose with Ferranti LRMTS chisel
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(11, -2.5);
  ctx.lineTo(-14, -3.5);
  ctx.lineTo(-17, 0);
  ctx.lineTo(-14, 3.5);
  ctx.lineTo(11, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shoulder mounted swept wings with anhedral (droop)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(3, -2.5);
  ctx.lineTo(-4, -14);
  ctx.lineTo(-7, -14);
  ctx.lineTo(-4, -2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 2.5);
  ctx.lineTo(-4, 14);
  ctx.lineTo(-7, 14);
  ctx.lineTo(-4, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(5, -1.3, 5, 2.6);

  // Iconic OVER-WING missile pylons (Magic/Sidewinder mounted ON TOP of wing)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-1, -7.5);
  ctx.lineTo(-6, -7.5);
  ctx.moveTo(-1, 7.5);
  ctx.lineTo(-6, 7.5);
  ctx.stroke();

  drawNationalInsignia(rc, plane, -3, -9, 3);
}

export const MODERN_DRAWERS: AircraftDrawerTable = {
  f14a: drawF14a,
  fa18a: drawFa18a,
  a10a: drawA10a,
  f15a: drawF15a,
  f16a: drawF16a,
  mig29a: drawMig29a,
  su27: drawMig29a,
  tu22m3: drawTu22m3,
  ah64a: drawAh64a,
  ah1w: drawAh1w,
  f111: drawF111,
  e3a: drawE3a,
  e2c: drawE2c,
  a6e: drawA6e,
  ea6b: drawEa6b,
  av8b: drawAv8b,
  s3a: drawS3a,
  c130: drawC130,
  c2a: drawC2a,
  sh3f: drawSh3f,
  ch53: drawCh53,
  tu95: drawTu95,
  ka27: drawKa27,
  mi24: drawMi24,
  yak38: drawYak38,
  a50: drawA50,
  su25: drawSu25,
  tornado_gr1: drawTornadoGr1,
  tornado_ids: drawTornadoGr1,
  tornado_adv: drawTornadoAdv,
  mirage2000: drawMirage2000,
  jaguar_gr1: drawJaguarGr1,
};
