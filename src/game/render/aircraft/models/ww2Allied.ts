// WWII US / Commonwealth aircraft: vector silhouettes, drawn in the plane's local frame (nose along +x).
import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawNationalInsignia } from '../nation';
import { AircraftDrawerTable } from './types';

function drawF4u(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ F4U Corsair: Inverted Gull Wing ("Bent-Wing Bird") ════
  // Barrel fuselage & Pratt & Whitney R-2800 radial cowling
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Distinctive inverted gull wings: crank down from roots, then extend flat
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  // Port wing
  ctx.moveTo(3, 0);
  ctx.lineTo(1, -6);
  ctx.lineTo(4, -17);
  ctx.lineTo(-2, -17);
  ctx.lineTo(-3, -6);
  ctx.lineTo(-1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  // Starboard wing
  ctx.moveTo(3, 0);
  ctx.lineTo(1, 6);
  ctx.lineTo(4, 17);
  ctx.lineTo(-2, 17);
  ctx.lineTo(-3, 6);
  ctx.lineTo(-1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Horizontal Stabilizer / Tailplane
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, -7);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-8, 7);
  ctx.lineTo(-10, 7);
  ctx.stroke();

  // Cockpit bubble set far aft on long nose
  ctx.fillStyle = 'rgba(128, 222, 234, 0.4)';
  ctx.fillRect(-2, -1.8, 5, 3.6);
  ctx.strokeRect(-2, -1.8, 5, 3.6);

  // US Star insignia on left wing
  drawNationalInsignia(rc, plane, 1, -11, 3.5);

  // 4-Blade Propeller Blur with Yellow Tips
  const propA = rc.time * 28;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(15, 0, 7.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FFD54F';
  for (let b = 0; b < 4; b++) {
    const a = propA + (b * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(15 + Math.cos(a) * 6.5, Math.sin(a) * 6.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawF8f(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F8F Bearcat: Compact, Stubby Late-War Interceptor ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 10.5, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Clipped square wings
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(2, -13);
  ctx.lineTo(4, -13);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 13);
  ctx.lineTo(2, 13);
  ctx.lineTo(-3, 13);
  ctx.lineTo(-3, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teardrop bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
  ctx.beginPath();
  ctx.ellipse(1, 0, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -8, 3);
}

function drawF4f(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ F4F Wildcat: Classic Barrel Fuselage & Grumman Ironworks ════
  ctx.fillStyle = '#061322';
  // Chubby barrel fuselage
  ctx.beginPath();
  ctx.ellipse(1, 0, 11.5, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Square-tipped wings with yellow wingtips
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(2, -15);
  ctx.lineTo(4, -15);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 15);
  ctx.lineTo(2, 15);
  ctx.lineTo(-3, 15);
  ctx.lineTo(-3, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wingtip yellow recognition strips
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(2, -15);
  ctx.lineTo(-3, -15);
  ctx.moveTo(2, 15);
  ctx.lineTo(-3, 15);
  ctx.stroke();

  // Greenhouse canopy frames + glass glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
  ctx.fillRect(-1, -2, 5, 4);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(-1, -2, 5, 4);

  drawNationalInsignia(rc, plane, 0, -9, 3.2);
}

function drawF6f(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ F6F Hellcat: Rugged Broad-Shouldered Fleet Fighter ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad wings with 6 machine guns
  ctx.fillStyle = '#0A1E33';
  ctx.beginPath();
  ctx.moveTo(3, -16);
  ctx.lineTo(5, -16);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 16);
  ctx.lineTo(3, 16);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-3, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6 gun ports on wing leading edge
  ctx.fillStyle = '#FFD54F';
  for (let g = -3; g <= 3; g++) {
    if (g === 0) continue;
    const gy = g * 3.5;
    ctx.fillRect(4, gy - 0.5, 2, 1);
  }

  // Cockpit canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(0, -1.7, 5.2, 3.4);

  drawNationalInsignia(rc, plane, 1, -10, 3.5);
}

function drawSbd(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ SBD Dauntless / SB2C Helldiver: Dive Bombers ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 13, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad tapered dive-bombing wings
  ctx.fillStyle = '#0A1E33';
  ctx.beginPath();
  ctx.moveTo(3, -16);
  ctx.lineTo(5, -16);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 16);
  ctx.lineTo(3, 16);
  ctx.lineTo(-4, 16);
  ctx.lineTo(-4, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Famous Perforated Split Dive-Flap Dots ("Swiss-Cheese Flaps")
  const isDiving = plane.state === 'diving';
  if (isDiving) {
    // Extended red perforated dive brakes deployed top and bottom
    ctx.fillStyle = '#D50000';
    ctx.fillRect(-6.5, -14, 2.5, 28);
    ctx.fillStyle = '#FFFFFF';
    for (let d = -4; d <= 4; d++) {
      if (d === 0) continue;
      ctx.beginPath();
      ctx.arc(-5.2, d * 3.2, 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#FF5252';
    for (let d = -4; d <= 4; d++) {
      if (d === 0) continue;
      const dy = d * 3.2;
      ctx.beginPath();
      ctx.arc(-2.5, dy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Greenhouse pilot canopy + rear twin .30 gunner station
  ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
  ctx.fillRect(0, -2, 6, 4);
  ctx.fillRect(-5, -1.8, 3, 3.6);
  ctx.strokeStyle = color;
  ctx.strokeRect(0, -2, 6, 4);
  ctx.strokeRect(-5, -1.8, 3, 3.6);
  // Twin rear swivel gun
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-8, 0);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -11, 3.5);
}

function drawTbd(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ TBD Devastator / TBF Avenger: Torpedo & Heavy Bombers ════
  ctx.fillStyle = '#061322';
  // Bulky deep fuselage with internal belly bay
  ctx.beginPath();
  ctx.ellipse(1, 0, 14, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad wingspan with thick dihedral
  ctx.fillStyle = '#0A1E33';
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(4, -18);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 18);
  ctx.lineTo(2, 18);
  ctx.lineTo(-4, 18);
  ctx.lineTo(-4, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pilot cockpit greenhouse + Dorsal Power Ball Turret Dome
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(2, -1.7, 5, 3.4);
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // .50 cal machine gun barrel protruding from ball turret
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-7, 0);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -12, 3.8);
}

function drawOs2u(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ OS2U Kingfisher: Scout Floatplane with Pontoon Catamaran ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 12, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High monoplane wings
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, -16);
  ctx.lineTo(3, 16);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-3, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tandem greenhouse canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
  ctx.fillRect(-1, -1.6, 5.5, 3.2);

  // Massive Central Catamaran Float Pontoon
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-9, 0);
  ctx.stroke();

  // Steel Strut Diagonal Bracing between float and fuselage
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(4, -2.5);
  ctx.moveTo(10, 0);
  ctx.lineTo(4, 2.5);
  ctx.moveTo(-4, 0);
  ctx.lineTo(-2, -2.5);
  ctx.moveTo(-4, 0);
  ctx.lineTo(-2, 2.5);
  ctx.stroke();

  // Wingtip outrigger stabilizer floats
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(0, -16.5, 4.5, 2);
  ctx.strokeRect(0, 14.5, 4.5, 2);

  drawNationalInsignia(rc, plane, 0, -10, 3);
}

function drawSc1(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ SC-1 Seahawk: Late-War High-Speed Scout Floatplane ════
  ctx.fillStyle = '#061322';
  // Aerodynamic laminar fuselage with Wright R-1820 Cyclone radial engine
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Clean low-wing cantilever layout with dihedral tips
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(3, -17);
  ctx.lineTo(5, -17);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 17);
  ctx.lineTo(3, 17);
  ctx.lineTo(-3, 17);
  ctx.lineTo(-3, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wing-mounted 20mm M2 autocannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(3, -7);
  ctx.lineTo(9, -7);
  ctx.moveTo(3, 7);
  ctx.lineTo(9, 7);
  ctx.stroke();

  // Streamlined Pedestal Centerline Float with internal bomb bay
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-10, 0);
  ctx.stroke();

  // Pedestal pylon strut
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(4, 0);
  ctx.moveTo(-2, 0);
  ctx.lineTo(-4, 0);
  ctx.stroke();

  // Wingtip Outrigger Stabilizing Floats
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(1, -17.5, 4.2, 2.2);
  ctx.strokeRect(1, 15.3, 4.2, 2.2);

  // Bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
  ctx.fillRect(-1, -1.8, 5, 3.6);
  ctx.strokeRect(-1, -1.8, 5, 3.6);

  // 4-blade prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(15, 0, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -11, 3.4);
}

function drawB17(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ B-17 Flying Fortress: 4-Engine Heavy Horizontal Bomber ════
  ctx.fillStyle = '#071626';
  // Heavy bomber fuselage with dorsal spine
  ctx.beginPath();
  ctx.ellipse(3, 0, 22, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // High-lift broad cantilever wing (Wingspan 52)
  ctx.fillStyle = '#0D2134';
  ctx.beginPath();
  ctx.moveTo(5, -26);
  ctx.lineTo(8, -26);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 26);
  ctx.lineTo(5, 26);
  ctx.lineTo(-4, 26);
  ctx.lineTo(-4, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4x Wright R-1820 Cyclone Radial Engine Nacelles
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.4;
  for (const ey of [-19, -11, 11, 19]) {
    ctx.strokeRect(3, ey - 2.4, 8, 4.8);
    // Spinning prop
    ctx.beginPath();
    ctx.arc(11, ey, 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Iconic tall dorsal fin tail and horizontal stabilizer
  ctx.beginPath();
  ctx.moveTo(-16, -11);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-16, 11);
  ctx.lineTo(-21, 11);
  ctx.lineTo(-21, -11);
  ctx.closePath();
  ctx.stroke();

  // Cockpit greenhouse and top turret
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(8, -2.2, 5, 4.4);
  ctx.beginPath();
  ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, 1, -16, 4.2);
}

function drawB24(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ B-24 Liberator / B-29 Superfortress: Heavy Level Bomber with Twin Oval Tailfins ════
  ctx.fillStyle = '#071626';
  // Deep slab-sided fuselage
  ctx.beginPath();
  ctx.ellipse(4, 0, 23, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Davis High-Aspect Ratio Wings (Wingspan 56)
  ctx.fillStyle = '#0D2134';
  ctx.beginPath();
  ctx.moveTo(6, -28);
  ctx.lineTo(8, -28);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 28);
  ctx.lineTo(6, 28);
  ctx.lineTo(-3, 28);
  ctx.lineTo(-3, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4x Twin Wasp Engines with Cowling Rings
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.4;
  for (const ey of [-21, -12, 12, 21]) {
    ctx.strokeRect(4, ey - 2.5, 8.5, 5);
    ctx.beginPath();
    ctx.arc(12.5, ey, 3.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Horizontal Tailplane with Iconic Twin Oval Vertical Fins at Tips
  ctx.beginPath();
  ctx.moveTo(-17, -13);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-17, 13);
  ctx.stroke();

  // Twin oval rudders
  ctx.strokeRect(-21, -15, 6, 4);
  ctx.strokeRect(-21, 11, 6, 4);

  // Greenhouse nose and cockpit
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(10, -2.4, 6, 4.8);

  drawNationalInsignia(rc, plane, 1, -18, 4.5);
}

function drawP40(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ P-40 Warhawk: Land-Based Fighter with Iconic Chin Scoop & Shark Mouth ════
  ctx.fillStyle = '#061322';
  // Streamlined inline Allison engine fuselage
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cantilever low-wings
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(2, -16);
  ctx.lineTo(4, -16);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 16);
  ctx.lineTo(2, 16);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-3, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Framed cockpit glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(-1, -1.5, 5, 3);

  // Iconic Large Chin Radiator Scoop
  ctx.fillStyle = '#C62828';
  ctx.fillRect(8, -1.8, 4, 3.6);
  // Shark teeth accents
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(9, -1.8);
  ctx.lineTo(11, 0);
  ctx.lineTo(9, 1.8);
  ctx.stroke();

  // 6x .50 cal wing guns
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  for (const gy of [-9, -7.5, -6, 6, 7.5, 9]) {
    ctx.beginPath();
    ctx.moveTo(2, gy);
    ctx.lineTo(6, gy);
    ctx.stroke();
  }

  // Propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(15, 0, 5.5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -10, 3.2);
}

function drawP38(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ P-38 Lightning: Twin-Boom Heavy Land-Based Fighter ("Fork-Tailed Devil") ════
  ctx.fillStyle = '#061322';

  // 1. Central Nacelle (Cockpit & Nose Gun Battery)
  ctx.beginPath();
  ctx.ellipse(2, 0, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Nose gun battery: 1x 20mm Hispano cannon + 4x .50 cal machine guns
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(15, 0);
  ctx.moveTo(8, -1);
  ctx.lineTo(13, -1);
  ctx.moveTo(8, 1);
  ctx.lineTo(13, 1);
  ctx.stroke();

  // 2. High-speed Wing (Wingspan 42)
  ctx.fillStyle = '#0E241C';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(3, -21);
  ctx.lineTo(5, -21);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 21);
  ctx.lineTo(3, 21);
  ctx.lineTo(-3, 21);
  ctx.lineTo(-3, -21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Twin Engine Booms (y = ±9.5) with Twin Vertical Fins & Horizontal Elevator
  for (const by of [-9.5, 9.5]) {
    // Boom body
    ctx.fillStyle = '#061322';
    ctx.strokeRect(-18, by - 2.2, 26, 4.4);
    ctx.fillRect(-18, by - 2.2, 26, 4.4);

    // Vertical rudder fin at tail of boom
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-21, by - 3, 5, 6);

    // Propeller
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(8, by, 4.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rear connecting horizontal elevator bar between twin booms
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-18, -9.5);
  ctx.lineTo(-18, 9.5);
  ctx.stroke();

  // Bubble Canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(0, -1.6, 5, 3.2);

  drawNationalInsignia(rc, plane, 0, -15, 3.5);
}

function drawA20(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ A-20 Havoc: Twin-Engine Low-Altitude Attack Bomber ════
  ctx.fillStyle = '#061322';
  // Streamlined fuselage
  ctx.beginPath();
  ctx.ellipse(3, 0, 15, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Shoulder-mounted wings (Wingspan 38)
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(3, -19);
  ctx.lineTo(5, -19);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 19);
  ctx.lineTo(3, 19);
  ctx.lineTo(-3, 19);
  ctx.lineTo(-3, -19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pilot & nose glass canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
  ctx.fillRect(5, -1.8, 5, 3.6);

  // Twin Wright R-2600 Engine Nacelles (y = ±9)
  for (const ey of [-9, 9]) {
    ctx.strokeRect(0, ey - 2.8, 10, 5.6);
    ctx.beginPath();
    ctx.arc(10, ey, 4.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Nose gun battery for ground strafing
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(19, -1);
  ctx.moveTo(14, 1);
  ctx.lineTo(19, 1);
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-12, 8);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -14, 3.4);
}

function drawA26(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ A-26 Invader: High-Speed Twin-Engine Heavy Attack Aircraft ════
  ctx.fillStyle = '#061322';
  // High-speed laminar fuselage
  ctx.beginPath();
  ctx.ellipse(4, 0, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Laminar-flow attack wing (Wingspan 42)
  ctx.fillStyle = '#0B1F34';
  ctx.beginPath();
  ctx.moveTo(4, -21);
  ctx.lineTo(6, -21);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 21);
  ctx.lineTo(4, 21);
  ctx.lineTo(-3, 21);
  ctx.lineTo(-3, -21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clamshell canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(6, -1.8, 5, 3.6);

  // Heavy Double Wasp Nacelles (y = ±10)
  for (const ey of [-10, 10]) {
    ctx.strokeRect(1, ey - 3, 11, 6);
    ctx.beginPath();
    ctx.arc(12, ey, 4.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // All-Gun Heavy Assault Solid Nose (8x .50 cal)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, -1.5);
  ctx.lineTo(21, -1.5);
  ctx.moveTo(15, 1.5);
  ctx.lineTo(21, 1.5);
  ctx.stroke();

  // Tall vertical fin
  ctx.beginPath();
  ctx.moveTo(-13, -9);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-13, 9);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -15, 3.8);
}

function drawP36a(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Curtiss P-36A Hawk: Classic Radial Fighter, Round Cowl, Olive/Silver ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(2, 0, 12, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rounded Curtiss wings
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(3, -16);
  ctx.quadraticCurveTo(5, 0, 3, 16);
  ctx.lineTo(-3, 16);
  ctx.quadraticCurveTo(-4, 0, -3, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(-1, -1.5, 4.5, 3);

  // Big Twin Wasp radial engine cowling
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(11, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3-blade prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(14, 0, 7, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -9, 3.2);
}

function drawB25(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ North American B-25 Mitchell: Twin R-2600 Radials & Twin H-Tail ════
  ctx.fillStyle = '#071626';
  // Long fuselage with glazed bombardier nose
  ctx.beginPath();
  ctx.ellipse(3, 0, 19, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glazed greenhouse nose
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.beginPath();
  ctx.arc(18, 0, 2.5, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Broad shoulder wings (Wingspan 44)
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(5, -22);
  ctx.lineTo(7, -22);
  ctx.lineTo(5, 0);
  ctx.lineTo(7, 22);
  ctx.lineTo(5, 22);
  ctx.lineTo(-4, 22);
  ctx.lineTo(-4, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Twin Wright R-2600 engine nacelles
  for (const ny of [-9.5, 9.5]) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(-2, ny - 2.8, 12, 5.6);
    ctx.strokeRect(-2, ny - 2.8, 12, 5.6);

    // Propeller blur
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(10.5, ny, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Iconic H-Tail: Horizontal tail with twin outboard vertical fins
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-15, -9);
  ctx.lineTo(-15, 9);
  ctx.stroke();
  // Twin vertical endplate rudders
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-17, -10, 4, 2.5);
  ctx.fillRect(-17, 7.5, 4, 2.5);

  // Top dorsal Bendix turret
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawNationalInsignia(rc, plane, 2, -15, 3.6);
}

function drawP39d(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Bell P-39D Airacobra: Mid-Engine, 37mm Hub Cannon, Car Doors ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 12, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tapered wings with rounded tips
  ctx.fillStyle = '#0E241C';
  ctx.beginPath();
  ctx.moveTo(2, -15);
  ctx.lineTo(4, -15);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 15);
  ctx.lineTo(2, 15);
  ctx.lineTo(-3, 15);
  ctx.lineTo(-3, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward-set car-door canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(2, -1.4, 4.5, 2.8);

  // Centerline 37mm Oldsmobile T9 cannon muzzle sticking out through prop hub
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(16, 0);
  ctx.stroke();

  // Mid-fuselage Allison V-1710 cooling scoops
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-1, -2.5, 4, 5);

  drawNationalInsignia(rc, plane, 0, -9, 3.2);
}

function drawB17Late(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ B-17G Flying Fortress (Late): Bendix Chin Turret + Cheyenne Tail ════
  ctx.fillStyle = '#071626';
  ctx.beginPath();
  ctx.ellipse(3, 0, 23, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wingspan 54
  ctx.fillStyle = '#0D2234';
  ctx.beginPath();
  ctx.moveTo(5, -27);
  ctx.lineTo(8, -27);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 27);
  ctx.lineTo(5, 27);
  ctx.lineTo(-5, 27);
  ctx.lineTo(-5, -27);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4 Wright Cyclone R-1820 engine nacelles
  for (const ey of [-18, -10, 10, 18]) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(-2, ey - 2.5, 12, 5);
    ctx.strokeRect(-2, ey - 2.5, 12, 5);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(10.5, ey, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Distinctive B-17G Bendix Chin Turret under nose with twin .50 cal guns
  ctx.fillStyle = '#1A237E';
  ctx.beginPath();
  ctx.arc(22, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(22, -1.2);
  ctx.lineTo(26, -1.2);
  ctx.moveTo(22, 1.2);
  ctx.lineTo(26, 1.2);
  ctx.stroke();

  // Cheyenne tail turret with twin .50s
  ctx.beginPath();
  ctx.moveTo(-20, -1);
  ctx.lineTo(-24, -1);
  ctx.moveTo(-20, 1);
  ctx.lineTo(-24, 1);
  ctx.stroke();

  // Dorsal sperry ball turret
  ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
  ctx.beginPath();
  ctx.arc(4, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  drawNationalInsignia(rc, plane, 3, -19, 4);
}

function drawHurricane(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Hawker Hurricane Mk.II: Thick Wing, Rear Stringers, RAF Roundel ════
  ctx.fillStyle = '#061322';
  // Robust fuselage with fabric rear stringers
  ctx.beginPath();
  ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Thick RAF five-spar wings with wide chord
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(3, -17);
  ctx.lineTo(4, -17);
  ctx.lineTo(2, 0);
  ctx.lineTo(4, 17);
  ctx.lineTo(3, 17);
  ctx.lineTo(-4, 17);
  ctx.lineTo(-4, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Framed greenhouse canopy glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(-1, -1.5, 4.8, 3);

  // 4x 20mm Hispano cannons (Mk.IIc) protruding from wings
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.5;
  for (const cy of [-11, -8, 8, 11]) {
    ctx.beginPath();
    ctx.moveTo(3, cy);
    ctx.lineTo(7.5, cy);
    ctx.stroke();
  }

  // Propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(15, 0, 7, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -11, 3.4);
}

function drawSpitfireV(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Supermarine Spitfire Mk.V: Iconic Elliptical Wings & Merlin Nose ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 13.5, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pure iconic elliptical wings (雙橢圓機翼)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.ellipse(1, 0, 4.5, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(-1, -1.4, 4.8, 2.8);

  // Twin 20mm Hispano cannon fairings & twin .303 brownings
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(3, -8.5);
  ctx.lineTo(8, -8.5);
  ctx.moveTo(3, 8.5);
  ctx.lineTo(8, 8.5);
  ctx.stroke();

  // Elliptical tailplane
  ctx.beginPath();
  ctx.ellipse(-9, 0, 2.5, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 3-blade Rotol prop
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(16, 0, 7, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -11, 3.3);
}

function drawBeaufighter(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Bristol Beaufighter: Twin Hercules Radials, Blunt Nose, Torpedo ════
  ctx.fillStyle = '#061322';
  // Blunt heavy nose
  ctx.beginPath();
  ctx.ellipse(1, 0, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Thick straight-taper wings (Wingspan 38)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(4, -19);
  ctx.lineTo(6, -19);
  ctx.lineTo(4, 0);
  ctx.lineTo(6, 19);
  ctx.lineTo(4, 19);
  ctx.lineTo(-4, 19);
  ctx.lineTo(-4, -19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pilot & observer glass canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(5, -1.7, 5, 3.4);

  // Twin Bristol Hercules radial engines
  for (const ey of [-8.5, 8.5]) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(-1, ey - 3, 10, 6);
    ctx.strokeRect(-1, ey - 3, 10, 6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(9, ey, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Torpedo mounted under belly
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -13, 3.5);
}

function drawSwordfish(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Fairey Swordfish: Stringbag Biplane, Struts, Slung Torpedo ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(1, 0, 14, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Upper and lower biplane wings
  ctx.fillStyle = '#0B1D20';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(3, -19);
  ctx.lineTo(3, 19);
  ctx.lineTo(-3, 19);
  ctx.lineTo(-3, -19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Interplane struts & bracing wires
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 1;
  for (const sx of [-13, -7, 7, 13]) {
    ctx.strokeRect(-2, sx - 1, 4, 2);
  }

  // Slung 18-inch aerial torpedo
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 0, -12, 3.2);
}

function drawSpitfireXiv(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ Supermarine Spitfire Mk.XIV: 5-Blade Griffon, Bubble Canopy, Pointed Rudder ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 14, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Elliptical wings with E-wing armament (2x 20mm + 2x .50 cal)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.ellipse(1, 0, 4.4, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pointed rudder & teardrop bubble canopy
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5-blade Rotol propeller
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(17, 0, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  drawNationalInsignia(rc, plane, 1, -11, 3.4);
}

function drawTempest(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Hawker Tempest Mk.V: Chin Radiator Beard, Laminar Elliptical Wings ════
  ctx.fillStyle = '#061322';
  ctx.beginPath();
  ctx.ellipse(3, 0, 14, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Huge chin annular radiator scoop under nose ("bearded smile")
  ctx.fillStyle = '#263238';
  ctx.fillRect(8, -2.5, 6, 5);
  ctx.strokeStyle = '#FFD54F';
  ctx.strokeRect(8, -2.5, 6, 5);

  // Semi-elliptical laminar flow wings
  ctx.fillStyle = '#0B1D20';
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(3, -18);
  ctx.lineTo(5, -18);
  ctx.lineTo(3, 0);
  ctx.lineTo(5, 18);
  ctx.lineTo(3, 18);
  ctx.lineTo(-4, 18);
  ctx.lineTo(-4, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bubble canopy glint
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(0, -1.5, 4.5, 3);

  // 4x 20mm Hispano Mk.V short barrel flush cannons
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  for (const cy of [-11, -8, 8, 11]) {
    ctx.beginPath();
    ctx.moveTo(3, cy);
    ctx.lineTo(6, cy);
    ctx.stroke();
  }

  drawNationalInsignia(rc, plane, 1, -12, 3.4);
}

function drawMosquito(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

  // ════ De Havilland Mosquito FB.VI "Wooden Wonder": Twin Merlins, Elegant Swept Fin ════
  ctx.fillStyle = '#061322';
  // Extremely sleek plywood monocoque fuselage
  ctx.beginPath();
  ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pointed swept wings (Wingspan 38)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(4, -19);
  ctx.lineTo(6, 0);
  ctx.lineTo(4, 19);
  ctx.lineTo(-3, 19);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-3, -19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit greenhouse glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
  ctx.fillRect(6, -1.6, 5, 3.2);

  // Twin Rolls-Royce Merlin nacelles
  for (const ey of [-8, 8]) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(-1, ey - 2.6, 12, 5.2);
    ctx.strokeRect(-1, ey - 2.6, 12, 5.2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(11, ey, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4x .303 Browning in nose + 4x 20mm Hispano in belly
  ctx.fillStyle = '#FFD54F';
  for (let g = -1.5; g <= 1.5; g += 1) {
    ctx.fillRect(17, g * 1.2 - 0.5, 2, 1);
  }

  drawNationalInsignia(rc, plane, 1, -13, 3.5);
}

function drawLancaster(rc: RenderContext, plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

  // ════ Avro Lancaster B.I: 4 Merlins, Twin Endplate Rudders, 33ft Bomb Bay ════
  ctx.fillStyle = '#071626';
  // Long heavy bomber slab fuselage
  ctx.beginPath();
  ctx.ellipse(4, 0, 24, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Broad tapering wings (Wingspan 56)
  ctx.fillStyle = '#0B1D20';
  ctx.beginPath();
  ctx.moveTo(6, -28);
  ctx.lineTo(8, -28);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 28);
  ctx.lineTo(6, 28);
  ctx.lineTo(-5, 28);
  ctx.lineTo(-5, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight deck greenhouse glass
  ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
  ctx.fillRect(9, -2.1, 5.5, 4.2);

  // 4 Merlin engines
  for (const ey of [-19, -11, 11, 19]) {
    ctx.fillStyle = '#263238';
    ctx.fillRect(-1, ey - 2.4, 12, 4.8);
    ctx.strokeRect(-1, ey - 2.4, 12, 4.8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(11, ey, 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Massive Twin Endplate Rudders on tailplane
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(-18, 12);
  ctx.stroke();
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-20, -13.5, 4, 3);
  ctx.fillRect(-20, 10.5, 4, 3);

  drawNationalInsignia(rc, plane, 2, -20, 4);
}

export const WW2_ALLIED_DRAWERS: AircraftDrawerTable = {
  f4u: drawF4u,
  f8f: drawF8f,
  f4f: drawF4f,
  f6f: drawF6f,
  sbd: drawSbd,
  sb2c: drawSbd,
  tbd: drawTbd,
  tbf: drawTbd,
  os2u: drawOs2u,
  sc1: drawSc1,
  b17: drawB17,
  b24: drawB24,
  p40: drawP40,
  p38: drawP38,
  a20: drawA20,
  a26: drawA26,
  p36a: drawP36a,
  b25: drawB25,
  p39d: drawP39d,
  b17_late: drawB17Late,
  hurricane: drawHurricane,
  spitfire_v: drawSpitfireV,
  beaufighter: drawBeaufighter,
  swordfish: drawSwordfish,
  spitfire_xiv: drawSpitfireXiv,
  tempest: drawTempest,
  mosquito: drawMosquito,
  lancaster: drawLancaster,
};
