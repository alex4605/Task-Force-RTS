// Korean War era aircraft (1950-53): vector silhouettes, drawn in the plane's local frame (nose along +x).
import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawNationalInsignia } from '../nation';
import { AircraftDrawerTable } from './types';

function drawF9f(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F9F Panther: USN Carrier Jet Fighter (Grumman F9F-2) ════
  ctx.fillStyle = '#061322';
  // Streamlined jet fuselage
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Straight wings with leading-edge root fillets (Wingspan 38)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(2, -18);
  ctx.lineTo(-4, -18);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-4, 18);
  ctx.lineTo(2, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wingtip Auxiliary Fuel Drop Tanks (Permanent teardrop tip tanks)
  for (const ty of [-18, 18]) {
    ctx.fillStyle = '#0B2544';
    ctx.beginPath();
    ctx.ellipse(0, ty, 6, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4x 20mm Colt M3 Cannons in nose
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, -1.2);
  ctx.lineTo(19, -1.2);
  ctx.moveTo(14, 1.2);
  ctx.lineTo(19, 1.2);
  ctx.stroke();

  // Cruciform swept tail
  ctx.beginPath();
  ctx.moveTo(-11, -7);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-11, 7);
  ctx.stroke();

  // Bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(2, -1.6, 5, 3.2);

  drawNationalInsignia(rc, plane, 0, -11, 3.2);
}

function drawF2h(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F2H Banshee: Twin-Engine Jet Interceptor ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(4, 0, 17, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Thickened wing roots housing twin Westinghouse J34 turbojets
  ctx.fillStyle = '#0A1E34';
  ctx.beginPath();
  ctx.rect(-3, -8, 10, 16);
  ctx.fill();
  ctx.stroke();

  // Outer wings extending to wingtip tanks (Wingspan 42)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(2, -8);
  ctx.lineTo(1, -21);
  ctx.lineTo(-5, -21);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 8);
  ctx.lineTo(1, 21);
  ctx.lineTo(-5, 21);
  ctx.lineTo(-4, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
  ctx.fillRect(6, -1.5, 5, 3);

  // Large cylindrical wingtip fuel tanks
  for (const ty of [-21, 21]) {
    ctx.fillStyle = '#0B2544';
    ctx.beginPath();
    ctx.ellipse(0, ty, 7, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Nose gun cluster
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(15, -1);
  ctx.lineTo(20, -1);
  ctx.moveTo(15, 1);
  ctx.lineTo(20, 1);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-12, 8);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -14, 3.2);
}

function drawAd1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AD-1 / A-1 Skyraider: Heavy Attack Bomber ════
  ctx.fillStyle = '#061322';
  // Bulky fuselage with Wright R-3350 radial
  ctx.beginPath();
  ctx.ellipse(3, 0, 15, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad straight wings (Wingspan 46) with 15 weapons hardpoints
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, -23);
  ctx.lineTo(5, -23);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 23);
  ctx.lineTo(3, 23);
  ctx.lineTo(-4, 23);
  ctx.lineTo(-4, -23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(1, -1.7, 5, 3.4);

  // 4-blade propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(17, 0, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  // Wing cannon barrels (4x 20mm)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  for (const wy of [-10, -7, 7, 10]) {
    ctx.beginPath();
    ctx.moveTo(4, wy);
    ctx.lineTo(9, wy);
    ctx.stroke();
  }

  // Side fuselage dive brakes
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-5, -5.6, 6, 1.4);
  ctx.strokeRect(-5, 4.2, 6, 1.4);

  drawNationalInsignia(rc, plane, 0, -16, 3.6);
}

function drawF4u4(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F4U-4 Corsair: Late-War / Cold War Upgraded Bent-Wing Bird ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inverted Gull Wings
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(1, -7);
  ctx.lineTo(4, -19);
  ctx.lineTo(-3, -19);
  ctx.lineTo(-1, -7);
  ctx.lineTo(1, 0);
  ctx.lineTo(-1, 7);
  ctx.lineTo(-3, 19);
  ctx.lineTo(4, 19);
  ctx.lineTo(1, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Aft-set Corsair bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(-2, -1.7, 5, 3.4);

  // 4-blade prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(17, 0, 6.2, 0, Math.PI * 2);
  ctx.stroke();

  // 4x 20mm M3 Cannon Barrels (F4U-4B)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  for (const wy of [-11, -8, 8, 11]) {
    ctx.beginPath();
    ctx.moveTo(3, wy);
    ctx.lineTo(9, wy);
    ctx.stroke();
  }

  drawNationalInsignia(rc, plane, 0, -13, 3.4);
}

function drawAfGuardian(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AF-2 Guardian: Hunter-Killer ASW ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wings (Wingspan 44)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, -22);
  ctx.lineTo(4, 0);
  ctx.lineTo(3, 22);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-4, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(1, -1.7, 5.5, 3.4);

  // Starboard Wing Radome Pod & Port Searchlight
  ctx.fillStyle = '#0B2544';
  ctx.beginPath();
  ctx.ellipse(1, 14, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Big Prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(17, 0, 6.8, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -15, 3.5);
}

function drawAd3w(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ AD-3W Skyraider AEW: Airborne Early Warning Radar Sentry ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 15, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wings
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, -22);
  ctx.lineTo(4, 0);
  ctx.lineTo(3, 22);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-4, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ★ 腹部大型 AN/APS-20 搜索雷達罩 (Giant Bulbous Ventral Radome)
  ctx.fillStyle = '#020C17';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Radar scan pulse rings
  const aewPulse = (Math.sin(rc.time * 8) + 1) * 0.5;
  ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + aewPulse * 0.4})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 12 + aewPulse * 8, 0, Math.PI * 2);
  ctx.stroke();

  // Twin auxiliary vertical finlets on horizontal tail
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-12, -8, 2.5, 4);
  ctx.strokeRect(-12, 4, 2.5, 4);

  drawNationalInsignia(rc, plane, 0, -15, 3.5);
}

function drawHo3s1(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ HO3S-1 Dragonfly: Sikorsky SAR Helicopter ════
  ctx.fillStyle = '#061322';
  // Teardrop Cockpit Fuselage
  ctx.beginPath();
  ctx.ellipse(2, 0, 10, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Slender Tubular Tail Boom
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-17, 0);
  ctx.stroke();

  // Starboard Rescue Winch Arm & Hoist
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, 4.2);
  ctx.lineTo(2, 7.5);
  ctx.lineTo(0, 7.5);
  ctx.stroke();

  // Glazed Canopy Dome
  ctx.fillStyle = 'rgba(128, 222, 234, 0.7)';
  ctx.beginPath();
  ctx.arc(6, 0, 3.5, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Landing Gear / Float Skids
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-3, -5.5, 8, 1);
  ctx.strokeRect(-3, 4.5, 8, 1);

  drawNationalInsignia(rc, plane, 0, -2, 2.5);
}

function drawMig15(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ MiG-15 Fagot: Soviet 35-Degree Swept-Wing Jet Fighter ════
  ctx.fillStyle = '#061322';
  // Circular nose air intake and tapered jet fuselage
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Nose Air Intake Ring
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(17, 0, 2.8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // 35-Degree Swept Wings (Wingspan 36)
  ctx.fillStyle = '#1D1319';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3, -18);
  ctx.lineTo(-9, -17);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-9, 17);
  ctx.lineTo(-3, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(3, -1.5, 5, 3);

  // Wing Fences (Boundary layer fences on swept wings)
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-5, -10);
  ctx.moveTo(0, 9);
  ctx.lineTo(-5, 10);
  ctx.stroke();

  // Heavy Cannon Armament in Nose: 1x 37mm N-37 + 2x 23mm NR-23
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(15, -1.8);
  ctx.lineTo(21, -1.8); // 37mm cannon
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(15, 1.2);
  ctx.lineTo(19, 1.2); // 23mm cannon
  ctx.moveTo(15, 2.2);
  ctx.lineTo(19, 2.2);
  ctx.stroke();

  // High-mounted swept T-tail
  ctx.beginPath();
  ctx.moveTo(-9, -8);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-9, 8);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, -3, -11, 2.5);
  drawNationalInsignia(rc, plane, -3, 11, 2.5);
}

function drawTu14(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Tu-14 Bosun: Twin-Jet Torpedo & Naval Attack Bomber ════
  ctx.fillStyle = '#061322';
  // Long fuselage with glazed bombardier nose
  ctx.beginPath();
  ctx.ellipse(4, 0, 20, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Straight shoulder wings with twin underslung jet nacelles (Wingspan 44)
  ctx.fillStyle = '#1D1319';
  ctx.beginPath();
  ctx.moveTo(4, -22);
  ctx.lineTo(6, -22);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 22);
  ctx.lineTo(4, 22);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-4, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glazed nose & cockpit canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(12, -2, 6, 4);

  // Twin Klimov VK-1 Jet Nacelles (y = ±9)
  for (const ey of [-9, 9]) {
    ctx.fillStyle = '#081726';
    ctx.beginPath();
    ctx.rect(-6, ey - 3, 16, 6);
    ctx.fill();
    ctx.stroke();
  }

  // Swept vertical & horizontal tail
  ctx.beginPath();
  ctx.moveTo(-13, -9);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-13, 9);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, 0, -15, 2.8);
  drawNationalInsignia(rc, plane, 0, 15, 2.8);
}

function drawB29(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ B-29 Superfortress: Heavy Strategic Bomber (Pressurized Fuselage & 4x R-3350) ════
  ctx.fillStyle = '#071626';
  // Long cylindrical fuselage with circular cross-section
  ctx.beginPath();
  ctx.ellipse(5, 0, 26, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High-Aspect Ratio Wings (Wingspan 62)
  ctx.fillStyle = '#0E2133';
  ctx.beginPath();
  ctx.moveTo(6, -31);
  ctx.lineTo(9, -31);
  ctx.lineTo(7, 0);
  ctx.lineTo(9, 31);
  ctx.lineTo(6, 31);
  ctx.lineTo(-4, 31);
  ctx.lineTo(-4, -31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4x Wright R-3350 Duplex-Cyclone Turbo-supercharged Radial Nacelles
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.5;
  for (const ey of [-23, -13, 13, 23]) {
    ctx.strokeRect(4, ey - 2.8, 9.5, 5.6);
    ctx.beginPath();
    ctx.arc(13.5, ey, 4.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4x Spinning 4-blade propellers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 1;
  for (const ey of [-23, -13, 13, 23]) {
    ctx.beginPath();
    ctx.arc(15, ey, 3.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tall vertical single fin and broad horizontal stabilizer
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-18, 14);
  ctx.lineTo(-24, 14);
  ctx.lineTo(-24, -14);
  ctx.closePath();
  ctx.stroke();

  // Fully glazed greenhouse cockpit & nose bombardier dome
  ctx.fillStyle = 'rgba(128, 222, 234, 0.7)';
  ctx.beginPath();
  ctx.ellipse(19, 0, 7.5, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0288D1';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Greenhouse framing grid lines
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(26, 0);
  ctx.moveTo(19, -3.8);
  ctx.lineTo(19, 3.8);
  ctx.stroke();

  // Remote dorsal and ventral turrets (CFC General Electric Remote Control Fire Control)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(4, -1.8, 4.5, 3.6);  // Forward dorsal turret
  ctx.strokeRect(-8, -1.8, 4.5, 3.6); // Aft dorsal turret
  // Tail stinger gun position (Twin .50 + 20mm cannon)
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-25, 0);
  ctx.stroke();

  // Open Bomb Bay Doors during Bombing Run
  if (plane.state === 'bombing_run') {
    ctx.fillStyle = '#020B14';
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-4, -2.4, 12, 4.8);
    ctx.fillRect(-4, -2.4, 12, 4.8);
    if (plane.payloadType === 'tactical_nuke') {
      // Yellow Mk 4 nuke casing armed inside bomb bay
      ctx.fillStyle = '#FFD600';
      ctx.beginPath();
      ctx.ellipse(2, 0, 4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cluster of yellow bomb rack tips
      ctx.fillStyle = '#FFCA28';
      for (let bx = -2; bx <= 6; bx += 3) {
        ctx.fillRect(bx, -1.2, 1.8, 1);
        ctx.fillRect(bx, 0.2, 1.8, 1);
      }
    }
  }

  drawNationalInsignia(rc, plane, 2, -20, 4.8);
}

function drawP51(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ P-51D Mustang: High-Speed Long-Range Air Superiority Fighter ════
  ctx.fillStyle = '#061322';
  // Streamlined fuselage with belly ventral radiator scoop
  ctx.beginPath();
  ctx.ellipse(3, 0, 14, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly ventral radiator scoop (Merlin coolant duct)
  ctx.fillStyle = '#0B2544';
  ctx.strokeRect(-3, -1.6, 6, 3.2);

  // Laminar-flow clipped wings (Wingspan 36)
  ctx.fillStyle = '#0D2235';
  ctx.beginPath();
  ctx.moveTo(3, -18);
  ctx.lineTo(5, -18);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 18);
  ctx.lineTo(3, 18);
  ctx.lineTo(-3, 18);
  ctx.lineTo(-3, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teardrop bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(1, -1.6, 5, 3.2);

  // 6x .50 cal wing guns
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  for (const gy of [-11, -9.5, -8, 8, 9.5, 11]) {
    ctx.beginPath();
    ctx.moveTo(3, gy);
    ctx.lineTo(7, gy);
    ctx.stroke();
  }

  // 4-blade propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(16, 0, 5.8, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -11, 3.4);
}

function drawP47(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ P-47D Thunderbolt: Heavy Armored Fighter-Bomber ("The Jug") ════
  ctx.fillStyle = '#061322';
  // Bulky barrel-shaped fuselage with huge R-2800 radial cowling
  ctx.beginPath();
  ctx.ellipse(3, 0, 15, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Heavy radial cowling front ring
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(10, -3.2, 4, 6.4);

  // Broad elliptical high-lift wings (Wingspan 42)
  ctx.fillStyle = '#0D2235';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(3, -21);
  ctx.lineTo(6, -21);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 21);
  ctx.lineTo(3, 21);
  ctx.lineTo(-4, 21);
  ctx.lineTo(-4, -21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 8x .50 cal Browning M2 Heavy Machine Gun Battery
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.5;
  for (const gy of [-14, -12.5, -11, -9.5, 9.5, 11, 12.5, 14]) {
    ctx.beginPath();
    ctx.moveTo(3, gy);
    ctx.lineTo(8, gy);
    ctx.stroke();
  }

  // Teardrop bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(1, -1.8, 6, 3.6);

  // 4-blade paddle propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(16.5, 0, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -14, 3.8);
}

function drawF86(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ F-86 Sabre: USAF 35-Degree Swept-Wing Jet Fighter ════
  ctx.fillStyle = '#061322';
  // Streamlined jet fuselage with open nose intake
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Open oval nose intake
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(14, -1.8, 2.5, 3.6);

  // 35-degree swept wings (Wingspan 38)
  ctx.fillStyle = '#0D2235';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, -19);
  ctx.lineTo(-9, -19);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-9, 19);
  ctx.lineTo(-3, 19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6x .50 M3 Colt machine guns in nose
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(12, -1.2);
  ctx.lineTo(16, -1.2);
  ctx.moveTo(12, 1.2);
  ctx.lineTo(16, 1.2);
  ctx.stroke();

  // Swept horizontal & vertical tail surfaces
  ctx.beginPath();
  ctx.moveTo(-10, -7);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-10, 7);
  ctx.stroke();

  // Teardrop bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(2, -1.6, 5, 3.2);

  drawNationalInsignia(rc, plane, 0, -11, 3.2);
}

function drawYak9(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Yak-9: Soviet Piston Fighter (Klimov M-105PF & Nose ShVAK/NS-37 Cannon) ════
  ctx.fillStyle = '#081726';
  // Slender aerodynamic fuselage with tapered tail
  ctx.beginPath();
  ctx.ellipse(3, 0, 13.5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Straight tapered wings with rounded tips (Wingspan 33)
  ctx.fillStyle = '#1D1319';
  ctx.beginPath();
  ctx.moveTo(3, -16.5);
  ctx.lineTo(5, -16.5);
  ctx.lineTo(4, 0);
  ctx.lineTo(5, 16.5);
  ctx.lineTo(3, 16.5);
  ctx.lineTo(-3.5, 16.5);
  ctx.lineTo(-3.5, -16.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teardrop sliding canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(1, -1.5, 5.5, 3.0);

  // Nose 20mm/37mm hollow spinner cannon barrel
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(19, 0);
  ctx.stroke();

  // Spinning propeller disc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(15, 0, 5.2, 0, Math.PI * 2);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, 0, -11, 2.6);
  drawNationalInsignia(rc, plane, 0, 11, 2.6);
}

function drawIl10(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ IL-10 Beast: Heavy Armored Ground Attack Assault Craft (Armoured Bathtub & 23mm Wing Cannons) ════
  ctx.fillStyle = '#071626';
  // Rugged, heavy armoured fuselage
  ctx.beginPath();
  ctx.ellipse(4, 0, 15, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Heavy inverted gull dihedral wings with broad wing root (Wingspan 41)
  ctx.fillStyle = '#1D1319';
  ctx.beginPath();
  ctx.moveTo(4, -20.5);
  ctx.lineTo(7, -20.5);
  ctx.lineTo(5, 0);
  ctx.lineTo(7, 20.5);
  ctx.lineTo(4, 20.5);
  ctx.lineTo(-4.5, 20.5);
  ctx.lineTo(-4.5, -20.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armoured cockpit tandem greenhouse (Pilot + Rear Gunner)
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.fillRect(3, -1.8, 5, 3.6);
  ctx.fillRect(-3, -1.5, 3.5, 3.0);

  // Twin 23mm VYa/NS-23 heavy wing cannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.8;
  for (const cy of [-11, 11]) {
    ctx.beginPath();
    ctx.moveTo(4, cy);
    ctx.lineTo(10.5, cy);
    ctx.stroke();
  }

  // Rear gunner B-20 defensive machine gun
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-9, 0);
  ctx.stroke();

  // Spinning 3-blade propeller disc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(16, 0, 5.8, 0, Math.PI * 2);
  ctx.stroke();

  // National insignia
  drawNationalInsignia(rc, plane, 0, -13, 3);
  drawNationalInsignia(rc, plane, 0, 13, 3);
}

function drawF82(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ North American F-82 Twin Mustang: Twin Fuselages & Center Wing ════
  ctx.fillStyle = '#061322';

  // Port & starboard twin fuselages
  for (const fy of [-7.5, 7.5]) {
    ctx.beginPath();
    ctx.ellipse(2, fy, 14, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cockpit canopy
    ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
    ctx.beginPath();
    ctx.ellipse(1, fy, 3.6, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Propeller
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(15, fy, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer wings and center connecting wing
  ctx.fillStyle = '#0D2234';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  // Outboard left wing
  ctx.moveTo(3, -22);
  ctx.lineTo(3, -7.5);
  ctx.lineTo(-3, -7.5);
  ctx.lineTo(-3, -22);
  ctx.closePath();
  // Center connecting wing (houses 6x .50 cal guns)
  ctx.moveTo(3, -7.5);
  ctx.lineTo(3, 7.5);
  ctx.lineTo(-3, 7.5);
  ctx.lineTo(-3, -7.5);
  ctx.closePath();
  // Outboard right wing
  ctx.moveTo(3, 7.5);
  ctx.lineTo(3, 22);
  ctx.lineTo(-3, 22);
  ctx.lineTo(-3, 7.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Common continuous horizontal tailplane connecting both vertical fins
  ctx.beginPath();
  ctx.moveTo(-11, -8.5);
  ctx.lineTo(-11, 8.5);
  ctx.lineTo(-13, 8.5);
  ctx.lineTo(-13, -8.5);
  ctx.closePath();
  ctx.stroke();

  // 6 center-wing machine gun muzzles
  ctx.fillStyle = '#FFD54F';
  for (let g = -2.5; g <= 2.5; g += 1) {
    ctx.fillRect(3, g * 2 - 0.5, 2, 1);
  }

  drawNationalInsignia(rc, plane, 0, -15, 3.2);
}

function drawMeteor(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Gloster Meteor F.8: Twin Derwent Turbojets Mid-Wing, Early Jet Fighter ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 15, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Straight wings with two large Derwent turbojet nacelles breaking through mid-wing
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(4, 0);
  ctx.lineTo(2, 18);
  ctx.lineTo(-4, 18);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-4, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(4, -1.4, 4.8, 2.8);

  // Twin Derwent engine tubes
  for (const ey of [-8, 8]) {
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-6, ey - 2.8, 14, 5.6);
    ctx.strokeRect(-6, ey - 2.8, 14, 5.6);
  }

  // T-Tail high cruciform tail
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -7);
  ctx.lineTo(-12, 7);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -13, 3.4);
}

function drawSeaFury(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Hawker Sea Fury FB.11: Centaurus 18-Cyl Radial, 5-Blade Rotol, FAA Paint ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 14, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Semi-elliptical wings
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(3, -17);
  ctx.lineTo(5, -17);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 17);
  ctx.lineTo(3, 17);
  ctx.lineTo(-4, 17);
  ctx.lineTo(-4, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(0, -1.6, 4.8, 3.2);

  // 4x 20mm Hispano Mk.V cannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  for (const cy of [-10, -7.5, 7.5, 10]) {
    ctx.beginPath();
    ctx.moveTo(3, cy);
    ctx.lineTo(7, cy);
    ctx.stroke();
  }

  // 5-blade Rotol prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(16, 0, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -11, 3.4);
}

function drawRokafP51(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ ROKAF F-51D Mustang: ROKAF Taegeuk Roundel & Korean War Combat Fighter ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 14, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Laminar flow wings
  ctx.fillStyle = '#0D2235';
  ctx.beginPath();
  ctx.moveTo(4, -16);
  ctx.lineTo(6, -16);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 16);
  ctx.lineTo(4, 16);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-3, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Belly radiator scoop
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-4, -2, 6, 4);

  // Bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4-blade prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(17, 0, 7, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -10, 3.2);
}

function drawFireflyAs5(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Fairey Firefly AS.5: Griffon Chin Radiator, ASH Wing Pod Radar ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 15, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad elliptical wings
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(3, -18);
  ctx.lineTo(5, 0);
  ctx.lineTo(3, 18);
  ctx.lineTo(-4, 18);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-4, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tandem cockpit canopies
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(0, -1.6, 6, 3.2);

  // Distinctive ASH radar pod slung under starboard wing leading edge
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.arc(4, 9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chin radiator scoop
  ctx.fillRect(8, -2.5, 5, 5);

  drawNationalInsignia(rc, plane, 0, -11, 3.4);
}

export const KOREA_DRAWERS: AircraftDrawerTable = {
  f9f: drawF9f,
  f2h: drawF2h,
  ad1: drawAd1,
  f4u4: drawF4u4,
  af_guardian: drawAfGuardian,
  ad3w: drawAd3w,
  ho3s1: drawHo3s1,
  mig15: drawMig15,
  tu14: drawTu14,
  b29: drawB29,
  p51: drawP51,
  p47: drawP47,
  f86: drawF86,
  yak9: drawYak9,
  il10: drawIl10,
  f82: drawF82,
  meteor: drawMeteor,
  sea_fury: drawSeaFury,
  rokaf_p51: drawRokafP51,
  firefly_as5: drawFireflyAs5,
};
