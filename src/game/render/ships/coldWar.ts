import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './mounts';

// CV-63 Kitty Hawk Supercarrier Line Art (Angled flight deck, 4 catapults, modern island)
export function drawCV63(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  // Angled Flight Deck Outer Perimeter:
  ctx.beginPath();
  ctx.moveTo(l * 0.5, -w * 0.18);
  ctx.lineTo(l * 0.46, w * 0.35);
  ctx.lineTo(l * 0.22, w * 0.38);
  ctx.lineTo(-l * 0.05, w * 0.38);
  ctx.lineTo(-l * 0.1, w * 0.44);
  ctx.lineTo(-l * 0.32, w * 0.44);
  ctx.lineTo(-l * 0.35, w * 0.38);
  ctx.lineTo(-l * 0.48, w * 0.32);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.48, -w * 0.35);
  ctx.lineTo(-l * 0.35, -w * 0.42);
  ctx.lineTo(-l * 0.1, -w * 0.52);
  ctx.lineTo(l * 0.18, -w * 0.52);
  ctx.lineTo(l * 0.32, -w * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Steel Deck Armor Tint
  ctx.fillStyle = 'rgba(18, 38, 58, 0.45)';
  ctx.fill();

  // 1. Axial Bow Catapults (Cat 1 & Cat 2)
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(l * 0.15, w * 0.1);
  ctx.lineTo(l * 0.46, w * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(l * 0.15, -w * 0.06);
  ctx.lineTo(l * 0.46, -w * 0.06);
  ctx.stroke();

  // 2. Angled Waist Catapults (Cat 3 & Cat 4)
  const cantAngle = -0.183; // ~10.5 deg
  ctx.save();
  ctx.translate(-l * 0.05, -w * 0.18);
  ctx.rotate(cantAngle);
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-l * 0.12, -w * 0.06);
  ctx.lineTo(l * 0.22, -w * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.12, w * 0.06);
  ctx.lineTo(l * 0.22, w * 0.06);
  ctx.stroke();

  // Angled Deck Runway Centerline
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, 0);
  ctx.lineTo(l * 0.25, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 Arrestor Cables across angled deck
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.4;
  for (let c = 0; c < 4; c++) {
    const cx = -l * 0.28 + c * 10;
    ctx.beginPath();
    ctx.moveTo(cx, -w * 0.18);
    ctx.lineTo(cx, w * 0.18);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Deck Elevators
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(l * 0.24, w * 0.35, l * 0.08, w * 0.08);
  ctx.strokeRect(l * 0.08, w * 0.35, l * 0.08, w * 0.08);
  ctx.strokeRect(-l * 0.32, w * 0.35, l * 0.08, w * 0.08);
  ctx.strokeRect(-l * 0.28, -w * 0.45, l * 0.08, w * 0.08);

  // 4. Modern Starboard Island Superstructure
  const islandX = -l * 0.16;
  const islandY = w * 0.32;
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.8;
  ctx.fillRect(islandX - l * 0.07, islandY - 6, l * 0.14, 12);
  ctx.strokeRect(islandX - l * 0.07, islandY - 6, l * 0.14, 12);

  // Island Pri-Fly glass windows
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(islandX - l * 0.06, islandY - 7, l * 0.04, 2);

  // AN/SPS-48 3D Radar Mast
  const radarRot = rc.time * 2.8;
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(islandX, islandY);
  ctx.lineTo(islandX + Math.cos(radarRot) * 7, islandY + Math.sin(radarRot) * 7);
  ctx.stroke();

  // "63" Hull Number Stenciled on Bow Deck
  ctx.save();
  ctx.translate(l * 0.38, w * 0.12);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('63', 0, 0);
  ctx.restore();

  // Jet Blast Deflectors (JBDs) & Deck Edge Foul Stripes + Parked Aircraft
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(l * 0.12, w * 0.08, 2.5, 5);
  ctx.fillRect(l * 0.12, -w * 0.08, 2.5, 5);
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-l * 0.34, -w * 0.44);
  ctx.lineTo(l * 0.16, -w * 0.50);
  ctx.stroke();

  const readyDeckPlanes = ship.carrierPlanes
    ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
    : 0;
  const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 3));
  for (let p = 0; p < parkedCount; p++) {
    const px = -l * 0.30 + p * (l * 0.13);
    const py = p % 2 === 0 ? w * 0.30 : -w * 0.38;
    ctx.fillStyle = '#90CAF9';
    ctx.beginPath();
    ctx.moveTo(px + 3.5, py);
    ctx.lineTo(px - 2.5, py - 3.5);
    ctx.lineTo(px - 2.5, py + 3.5);
    ctx.closePath();
    ctx.fill();
  }

  // RIM-7 Sea Sparrow Launchers
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-l * 0.45, -w * 0.32, 8, 6);
  ctx.strokeRect(-l * 0.45, -w * 0.32, 8, 6);
  ctx.fillRect(l * 0.42, w * 0.25, 8, 6);
  ctx.strokeRect(l * 0.42, w * 0.25, 8, 6);

  drawShipTurrets(rc, ship, hullColor);
}

// CG Belknap Class Guided Missile Cruiser Line Art
export function drawBelknapCG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.35, -w * 0.44);
  ctx.lineTo(-l * 0.42, -w * 0.44);
  ctx.lineTo(-l * 0.48, -w * 0.3);
  ctx.lineTo(-l * 0.48, w * 0.3);
  ctx.lineTo(-l * 0.42, w * 0.44);
  ctx.lineTo(l * 0.35, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Foredeck: Mk 10 Twin-Arm Terrier / Standard ER Missile Launcher
  ctx.strokeStyle = '#FFD54F';
  ctx.fillStyle = '#263238';
  ctx.lineWidth = 1.4;
  const launcherX = l * 0.28;
  ctx.beginPath();
  ctx.arc(launcherX, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(launcherX, -2.5);
  ctx.lineTo(launcherX + 9, -2.5);
  ctx.moveTo(launcherX, 2.5);
  ctx.lineTo(launcherX + 9, 2.5);
  ctx.stroke();

  // Forward Bridge & Conning Tower
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.08, -w * 0.3, l * 0.12, w * 0.6);
  ctx.fillRect(l * 0.08, -w * 0.3, l * 0.12, w * 0.6);

  // Forward Mack (Combined Mast and Stack) with SPS-48 3D Radar
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(l * 0.04, -4, 8, 8);
  const mackRot = rc.time * 2.5;
  ctx.beginPath();
  ctx.moveTo(l * 0.08, 0);
  ctx.lineTo(l * 0.08 + Math.cos(mackRot) * 6, Math.sin(mackRot) * 6);
  ctx.stroke();

  // Aft Mack
  ctx.strokeRect(-l * 0.12, -4, 8, 8);

  // Aft Helicopter Hangar & Flight Deck
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(-l * 0.38, -w * 0.35, l * 0.18, w * 0.7);
  ctx.beginPath();
  ctx.arc(-l * 0.3, 0, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Aft 5-inch/54 caliber Mk 42 Gun Mount
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(-l * 0.42, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, 0);
  ctx.lineTo(-l * 0.42 - 12, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// DDG Charles F. Adams Class Guided Missile Destroyer Line Art
export function drawAdamsDDG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.44, -w * 0.44);
  ctx.lineTo(-l * 0.48, -w * 0.28);
  ctx.lineTo(-l * 0.48, w * 0.28);
  ctx.lineTo(-l * 0.44, w * 0.44);
  ctx.lineTo(l * 0.36, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forecastle 5"/54 Caliber Mk 42 Gun Turret
  const gun1X = l * 0.32;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(gun1X, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun1X, 0);
  ctx.lineTo(gun1X + 11, 0);
  ctx.stroke();

  // Bridge & Conning Tower
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.12, -w * 0.3, l * 0.11, w * 0.6);
  ctx.fillRect(l * 0.12, -w * 0.3, l * 0.11, w * 0.6);

  // Twin Funnels
  ctx.strokeRect(l * 0.04, -3, 6, 6);
  ctx.strokeRect(-l * 0.1, -3, 6, 6);

  // Midships ASROC 8-cell launcher
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-l * 0.02, -4, 7, 8);

  // Aft 5"/54 Caliber Gun Turret
  const gun2X = -l * 0.22;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(gun2X, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun2X, 0);
  ctx.lineTo(gun2X - 11, 0);
  ctx.stroke();

  // Stern: Tartar Guided Missile Launcher
  const tartarX = -l * 0.38;
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(tartarX, 0, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tartarX, 0);
  ctx.lineTo(tartarX + 8, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// LPH Iwo Jima Class Amphibious Assault Ship Line Art
export function drawLPHIwoJima(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#061322';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Boxy amphibious assault hull with flat full-length helicopter flight deck
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.36);
  ctx.lineTo(l * 0.48, w * 0.36);
  ctx.lineTo(-l * 0.48, w * 0.36);
  ctx.lineTo(-l * 0.48, -w * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight Deck Tint
  ctx.fillStyle = 'rgba(18, 38, 58, 0.45)';
  ctx.fill();

  // 5 Helicopter Landing Spots along deck centerline
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.3;
  for (let s = 0; s < 5; s++) {
    const spotX = -l * 0.36 + s * (l * 0.18);
    ctx.beginPath();
    ctx.arc(spotX, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(spotX - 3, 0);
    ctx.lineTo(spotX + 3, 0);
    ctx.stroke();
  }

  // Starboard Island Tower with Bridge
  const islandX = l * 0.12;
  const islandY = w * 0.3;
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.6;
  ctx.fillRect(islandX - l * 0.08, islandY - 5, l * 0.16, 10);
  ctx.strokeRect(islandX - l * 0.08, islandY - 5, l * 0.16, 10);

  // Radar Antenna
  const rRot = rc.time * 2.2;
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.moveTo(islandX, islandY);
  ctx.lineTo(islandX + Math.cos(rRot) * 6, islandY + Math.sin(rRot) * 6);
  ctx.stroke();

  // Port Side Aircraft Elevator
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-l * 0.12, -w * 0.44, l * 0.1, w * 0.1);

  drawShipTurrets(rc, ship, hullColor);
}

// LCM-8 "Mike Boat" Landing Craft Line Art
export function drawLCM8(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.45);
  ctx.lineTo(l * 0.48, w * 0.45);
  ctx.lineTo(-l * 0.48, w * 0.45);
  ctx.lineTo(-l * 0.48, -w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Heavy bow drop ramp
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.4);
  ctx.lineTo(l * 0.48, w * 0.4);
  ctx.stroke();

  // Deep Open Cargo Well Deck
  ctx.fillStyle = 'rgba(15, 39, 61, 0.6)';
  ctx.fillRect(-l * 0.22, -w * 0.36, l * 0.56, w * 0.72);
  ctx.strokeRect(-l * 0.22, -w * 0.36, l * 0.56, w * 0.72);

  // Aft Armored Wheelhouse
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(-l * 0.44, -w * 0.32, l * 0.16, w * 0.64);
  ctx.fillRect(-l * 0.44, -w * 0.32, l * 0.16, w * 0.64);

  drawShipTurrets(rc, ship, hullColor);
}

// Komar Class Project 183R Missile Boat Line Art
export function drawKomarPTG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#180E14';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.28, -w * 0.45);
  ctx.lineTo(-l * 0.48, -w * 0.45);
  ctx.lineTo(-l * 0.48, w * 0.45);
  ctx.lineTo(l * 0.28, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Foredeck 25mm gun mount
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(l * 0.26, 0, 3.5, 0, Math.PI * 2);
  ctx.stroke();

  // Wheelhouse / Bridge
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
  ctx.fillRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);

  // Two Launch Canisters for P-15 Styx
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-l * 0.36, -w * 0.44, l * 0.32, w * 0.24);
  ctx.fillRect(-l * 0.36, -w * 0.44, l * 0.32, w * 0.24);
  ctx.strokeRect(-l * 0.36, w * 0.2, l * 0.32, w * 0.24);
  ctx.fillRect(-l * 0.36, w * 0.2, l * 0.32, w * 0.24);

  drawShipTurrets(rc, ship, hullColor);
}

// Forrest Sherman Class Destroyer Line Art (DD-931)
export function drawForrestShermanDD(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.44, -w * 0.44);
  ctx.lineTo(-l * 0.48, -w * 0.28);
  ctx.lineTo(-l * 0.48, w * 0.28);
  ctx.lineTo(-l * 0.44, w * 0.44);
  ctx.lineTo(l * 0.36, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forecastle 5"/54 Caliber Mk 42 Gun Mount ('A' Mount)
  const gun1X = l * 0.32;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(gun1X, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun1X, 0);
  ctx.lineTo(gun1X + 12, 0);
  ctx.stroke();

  // Bridge & Conning Tower
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.12, -w * 0.3, l * 0.12, w * 0.6);
  ctx.fillRect(l * 0.12, -w * 0.3, l * 0.12, w * 0.6);

  // Twin Stacks (Funnels)
  ctx.strokeRect(l * 0.04, -3.5, 7, 7);
  ctx.strokeRect(-l * 0.12, -3.5, 7, 7);

  // Midships 8-cell ASROC box launcher
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(-l * 0.04, -4.5, 8, 9);

  // Mk 32 SVTT triple torpedo tubes (port & starboard)
  ctx.fillStyle = '#80DEEA';
  ctx.fillRect(-l * 0.02, -w * 0.42, 6, 2.5);
  ctx.fillRect(-l * 0.02, w * 0.42 - 2.5, 6, 2.5);

  // Aft 5"/54 Mk 42 Mounts ('X' and 'Y' Mounts)
  const gun2X = -l * 0.24;
  const gun3X = -l * 0.38;
  for (const gx of [gun2X, gun3X]) {
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(gx, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx - 12, 0);
    ctx.stroke();
  }

  drawShipTurrets(rc, ship, hullColor);
}

// Knox Class Fast Frigate Line Art (FFG-1052)
export function drawKnoxFFG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.35, -w * 0.45);
  ctx.lineTo(-l * 0.42, -w * 0.45);
  ctx.lineTo(-l * 0.48, -w * 0.32);
  ctx.lineTo(-l * 0.48, w * 0.32);
  ctx.lineTo(-l * 0.42, w * 0.45);
  ctx.lineTo(l * 0.35, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bow single 5"/54 Caliber Mk 42 Gun Mount
  const gunX = l * 0.34;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(gunX, 0, 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gunX, 0);
  ctx.lineTo(gunX + 12, 0);
  ctx.stroke();

  // 8-Cell ASROC Box Launcher directly behind 5" gun
  ctx.fillStyle = '#1B2A38';
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(l * 0.18, -4.5, 8, 9);
  ctx.fillRect(l * 0.18, -4.5, 8, 9);

  // Bridge Structure
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.05, -w * 0.3, l * 0.1, w * 0.6);
  ctx.fillRect(l * 0.05, -w * 0.3, l * 0.1, w * 0.6);

  // Combined Mack (Mast and Stack)
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.arc(-l * 0.06, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Stern Helicopter Hangar and Flight Deck for SH-2 Seasprite
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(-l * 0.42, -w * 0.38, l * 0.22, w * 0.76);
  ctx.beginPath();
  ctx.arc(-l * 0.32, 0, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.35, -3);
  ctx.lineTo(-l * 0.35, 3);
  ctx.moveTo(-l * 0.29, -3);
  ctx.lineTo(-l * 0.29, 3);
  ctx.moveTo(-l * 0.35, 0);
  ctx.lineTo(-l * 0.29, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Project 61 Kashin Class Guided Missile Destroyer Line Art (DDG)
export function drawKashinDDG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#140D12';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  // Distinctive flush-deck long hull with raked bow and transom
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.44, -w * 0.44);
  ctx.lineTo(-l * 0.49, -w * 0.3);
  ctx.lineTo(-l * 0.49, w * 0.3);
  ctx.lineTo(-l * 0.44, w * 0.44);
  ctx.lineTo(l * 0.36, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bow AK-726 twin 76mm automatic turret
  const bowGunX = l * 0.32;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(bowGunX, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bowGunX, -1.2);
  ctx.lineTo(bowGunX + 11, -1.2);
  ctx.moveTo(bowGunX, 1.2);
  ctx.lineTo(bowGunX + 11, 1.2);
  ctx.stroke();

  // RBU-6000 12-barrel ASW rocket mortars (pair forward of bridge)
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(l * 0.22, -w * 0.24, 2.8, 0, Math.PI * 2);
  ctx.arc(l * 0.22, w * 0.24, 2.8, 0, Math.PI * 2);
  ctx.stroke();

  // Forward SA-N-1 Goa twin-arm SAM launcher
  const fwdGoaX = l * 0.15;
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(fwdGoaX, 0, 3.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fwdGoaX, 0);
  ctx.lineTo(fwdGoaX + 8, -2);
  ctx.moveTo(fwdGoaX, 0);
  ctx.lineTo(fwdGoaX + 8, 2);
  ctx.stroke();

  // Bridge and First Gas Turbine Funnel Pair
  ctx.fillStyle = '#211822';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.02, -w * 0.32, l * 0.1, w * 0.64);
  ctx.fillRect(l * 0.02, -w * 0.32, l * 0.1, w * 0.64);

  // Twin angled gas-turbine funnels forward & aft ("Singing Frigate")
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-l * 0.04, -w * 0.35, 6, 4);
  ctx.fillRect(-l * 0.04, w * 0.35 - 4, 6, 4);
  ctx.fillRect(-l * 0.22, -w * 0.35, 6, 4);
  ctx.fillRect(-l * 0.22, w * 0.35 - 4, 6, 4);

  // Midships 533mm quintuple torpedo launcher
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(-l * 0.14, -4, 8, 8);

  // Aft SA-N-1 Goa twin-arm SAM launcher
  const aftGoaX = -l * 0.3;
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(aftGoaX, 0, 3.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(aftGoaX, 0);
  ctx.lineTo(aftGoaX - 8, -2);
  ctx.moveTo(aftGoaX, 0);
  ctx.lineTo(aftGoaX - 8, 2);
  ctx.stroke();

  // Stern AK-726 twin 76mm automatic turret
  const sternGunX = -l * 0.4;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.beginPath();
  ctx.arc(sternGunX, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sternGunX, -1.2);
  ctx.lineTo(sternGunX - 11, -1.2);
  ctx.moveTo(sternGunX, 1.2);
  ctx.lineTo(sternGunX - 11, 1.2);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Project 50 Riga Class Frigate Line Art (FFG / North Vietnamese Flagship)
export function drawRigaFFG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#140D12';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  // Raised forecastle stepping down to low quarterdeck
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.34, -w * 0.44);
  ctx.lineTo(-l * 0.42, -w * 0.44);
  ctx.lineTo(-l * 0.48, -w * 0.3);
  ctx.lineTo(-l * 0.48, w * 0.3);
  ctx.lineTo(-l * 0.42, w * 0.44);
  ctx.lineTo(l * 0.34, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bow 100mm B-34 Gun Turret ('A' Mount)
  const gun1X = l * 0.32;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(gun1X, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun1X, 0);
  ctx.lineTo(gun1X + 11, 0);
  ctx.stroke();

  // Twin RBU-2500 ASW rocket launchers abreast the bridge front
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(l * 0.12, -w * 0.36, 2.2, 0, Math.PI * 2);
  ctx.moveTo(l * 0.12 + 2.2, w * 0.36);
  ctx.arc(l * 0.12, w * 0.36, 2.2, 0, Math.PI * 2);
  ctx.stroke();

  // Midships Bridge & Single Raked Funnel
  ctx.fillStyle = '#211822';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(l * 0.06, -w * 0.3, l * 0.12, w * 0.6);
  ctx.fillRect(l * 0.06, -w * 0.3, l * 0.12, w * 0.6);

  ctx.fillStyle = '#37474F';
  ctx.fillRect(-l * 0.06, -3, 8, 6);

  // Superfiring 100mm B-34 Gun Turret ('B' Mount ahead of the bridge)
  const gun2X = l * 0.22;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.beginPath();
  ctx.arc(gun2X, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun2X, 0);
  ctx.lineTo(gun2X + 10, 0);
  ctx.stroke();

  // Twin 37mm V-11M anti-aircraft autocannon tubs
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(-l * 0.24, -w * 0.3, 2.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.24, w * 0.3, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Stern 100mm B-34 Gun Turret ('X' Mount)
  const gun3X = -l * 0.36;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.beginPath();
  ctx.arc(gun3X, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gun3X, 0);
  ctx.lineTo(gun3X - 11, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Project 205 Osa Class Missile Boat Line Art (PTG)
export function drawOsaPTG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#1A0E12';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  // Wide hard-chine planing hull
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.32, -w * 0.46);
  ctx.lineTo(-l * 0.48, -w * 0.46);
  ctx.lineTo(-l * 0.48, w * 0.46);
  ctx.lineTo(l * 0.32, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward AK-230 30mm twin enclosed dome turret
  const fwdAkX = l * 0.3;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(fwdAkX, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fwdAkX, -1);
  ctx.lineTo(fwdAkX + 7, -1);
  ctx.moveTo(fwdAkX, 1);
  ctx.lineTo(fwdAkX + 7, 1);
  ctx.stroke();

  // Wheelhouse and Drum Tilt Fire Control Radar Dome
  ctx.fillStyle = '#2E1C22';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(-l * 0.05, -w * 0.24, l * 0.16, w * 0.48);
  ctx.fillRect(-l * 0.05, -w * 0.24, l * 0.16, w * 0.48);
  ctx.strokeStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(l * 0.03, 0, 3, 0, Math.PI * 2);
  ctx.stroke();

  // 4 Box Missile Containers for P-15 Styx (2 Port, 2 Starboard)
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.4;
  // Fwd port & starboard missile boxes
  ctx.strokeRect(l * 0.05, -w * 0.45, l * 0.22, w * 0.2);
  ctx.fillRect(l * 0.05, -w * 0.45, l * 0.22, w * 0.2);
  ctx.strokeRect(l * 0.05, w * 0.25, l * 0.22, w * 0.2);
  ctx.fillRect(l * 0.05, w * 0.25, l * 0.22, w * 0.2);
  // Aft port & starboard missile boxes
  ctx.strokeRect(-l * 0.32, -w * 0.45, l * 0.22, w * 0.2);
  ctx.fillRect(-l * 0.32, -w * 0.45, l * 0.22, w * 0.2);
  ctx.strokeRect(-l * 0.32, w * 0.25, l * 0.22, w * 0.2);
  ctx.fillRect(-l * 0.32, w * 0.25, l * 0.22, w * 0.2);

  // Aft AK-230 30mm twin enclosed dome turret
  const aftAkX = -l * 0.38;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc(aftAkX, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(aftAkX, -1);
  ctx.lineTo(aftAkX - 7, -1);
  ctx.moveTo(aftAkX, 1);
  ctx.lineTo(aftAkX - 7, 1);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Project 641 Foxtrot / Project 671RTM Victor III / Project 971 Akula Submarine Line Art
export function drawFoxtrotSS(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const isNuclearSSN = ship.subVariant === 'victor3' || ship.subVariant === 'akula';

  if (ship.isSubmerged) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 138, 128, 0.72)';
  } else {
    ctx.strokeStyle = hullColor;
  }

  ctx.fillStyle = isNuclearSSN ? '#0E0912' : '#120B10';
  ctx.lineWidth = 1.8;

  if (isNuclearSSN) {
    // Teardrop nuclear attack submarine hull (Victor III / Akula)
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.bezierCurveTo(l * 0.46, -w * 0.48, l * 0.20, -w * 0.48, -l * 0.10, -w * 0.42);
    ctx.bezierCurveTo(-l * 0.32, -w * 0.34, -l * 0.46, -w * 0.16, -l * 0.52, 0);
    ctx.bezierCurveTo(-l * 0.46, w * 0.16, -l * 0.32, w * 0.34, -l * 0.10, w * 0.42);
    ctx.bezierCurveTo(l * 0.20, w * 0.48, l * 0.46, w * 0.48, l * 0.52, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Long streamlined sail with forward dive planes
    ctx.fillStyle = '#1E1424';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(l * 0.04, -w * 0.22, l * 0.22, w * 0.44, 3);
    ctx.fill();
    ctx.stroke();

    // Characteristic Soviet Victor III / Akula Towed-Array Sonar Pod atop stern fin
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFAB40';
    ctx.beginPath();
    ctx.ellipse(-l * 0.48, 0, 7, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fairwater Sail Planes & Bow/Stern Hydroplanes
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(l * 0.14, -w * 0.38);
    ctx.lineTo(l * 0.14, w * 0.38);
    ctx.moveTo(-l * 0.44, -w * 0.44);
    ctx.lineTo(-l * 0.44, w * 0.44);
    ctx.stroke();

    // Red Star insignia
    ctx.fillStyle = '#D50000';
    ctx.beginPath();
    ctx.arc(l * 0.14, 0, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash([]);
    return;
  }

  // Streamlined Foxtrot hull with sharp bow and bulbous sonar chin
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.36, -w * 0.38);
  ctx.lineTo(-l * 0.42, -w * 0.38);
  ctx.lineTo(-l * 0.49, 0);
  ctx.lineTo(-l * 0.42, w * 0.38);
  ctx.lineTo(l * 0.36, w * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Distinctive bulbous bow chin sonar dome (MG-10 / Herkules)
  ctx.strokeStyle = '#FF5252';
  ctx.fillStyle = '#263238';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(l * 0.44, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 6 Forward Bow Torpedo Tube Shutters
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(l * 0.4, -w * 0.22);
  ctx.lineTo(l * 0.46, -w * 0.14);
  ctx.moveTo(l * 0.4, w * 0.22);
  ctx.lineTo(l * 0.46, w * 0.14);
  ctx.stroke();

  // Casing Free-Flooding Limber Slits
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  for (let s = -3; s <= 3; s++) {
    const sx = s * (l * 0.07);
    ctx.beginPath();
    ctx.moveTo(sx, -w * 0.2);
    ctx.lineTo(sx + 3.5, -w * 0.2);
    ctx.moveTo(sx, w * 0.2);
    ctx.lineTo(sx + 3.5, w * 0.2);
    ctx.stroke();
  }

  // Tall stepped sail / conning tower midships with periscopes & snorkel mast
  ctx.fillStyle = '#21131A';
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-l * 0.1, -w * 0.2, l * 0.2, w * 0.4);
  ctx.fillRect(-l * 0.1, -w * 0.2, l * 0.2, w * 0.4);

  // Periscope and Snorkel Masts
  ctx.beginPath();
  ctx.moveTo(-l * 0.02, 0);
  ctx.lineTo(l * 0.05, 0);
  ctx.stroke();

  // Stern 4 Torpedo Tubes and Rudder Fin
  ctx.strokeStyle = detailColor;
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, 0);
  ctx.lineTo(-l * 0.48, 0);
  ctx.stroke();

  ctx.setLineDash([]);
}

// ══════════════════════════════════════════════════════════
// Project 58 Kynda-Class Guided Missile Cruiser Line Art
// ══════════════════════════════════════════════════════════
export function drawKyndaCG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Raked Bow Soviet Cruiser Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.38, -w * 0.44);
  ctx.lineTo(-l * 0.40, -w * 0.44);
  ctx.lineTo(-l * 0.50, -w * 0.26);
  ctx.lineTo(-l * 0.50, w * 0.26);
  ctx.lineTo(-l * 0.40, w * 0.44);
  ctx.lineTo(l * 0.38, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tall Pyramidal Lattice Mast Towers (Head Net A Radar)
  ctx.fillStyle = '#0B1E2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(l * 0.02, -w * 0.26, l * 0.10, w * 0.52);
  ctx.strokeRect(l * 0.02, -w * 0.26, l * 0.10, w * 0.52);
  ctx.fillRect(-l * 0.16, -w * 0.24, l * 0.08, w * 0.48);
  ctx.strokeRect(-l * 0.16, -w * 0.24, l * 0.08, w * 0.48);

  // Massive Quadruple SM-70 Trainable Launchers for P-35 Shaddock (Fore & Aft)
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.5;
  // Forward Quad SM-70
  ctx.strokeRect(l * 0.20, -w * 0.30, l * 0.12, w * 0.60);
  // Aft Quad SM-70
  ctx.strokeRect(-l * 0.34, -w * 0.30, l * 0.12, w * 0.60);

  // Twin AK-726 76mm Enclosed Gun Turret at Stern
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(-l * 0.44, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// Project 68bis Sverdlov-Class Conventional Gun Cruiser Line Art
// ══════════════════════════════════════════════════════════
export function drawSverdlovCL(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // 210m Long Flush-Deck Classic Cruiser Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.40, -w * 0.44);
  ctx.lineTo(-l * 0.40, -w * 0.44);
  ctx.lineTo(-l * 0.50, -w * 0.24);
  ctx.lineTo(-l * 0.50, w * 0.24);
  ctx.lineTo(-l * 0.40, w * 0.44);
  ctx.lineTo(l * 0.40, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Elongated Citadel & Bridge
  ctx.fillStyle = '#0B1D2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(-l * 0.20, -w * 0.28, l * 0.40, w * 0.56);
  ctx.strokeRect(-l * 0.20, -w * 0.28, l * 0.40, w * 0.56);

  // Twin Raked Funnels with Caps
  ctx.fillStyle = '#212121';
  ctx.fillRect(l * 0.04, -w * 0.12, l * 0.05, w * 0.24);
  ctx.fillRect(-l * 0.10, -w * 0.12, l * 0.05, w * 0.24);

  // 4 Triple 152mm Main Turrets (Turrets 1 & 2 fwd, 3 & 4 aft)
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(l * 0.36, 0, 5, 0, Math.PI * 2);
  ctx.arc(l * 0.26, 0, 5, 0, Math.PI * 2);
  ctx.arc(-l * 0.28, 0, 5, 0, Math.PI * 2);
  ctx.arc(-l * 0.38, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// Project 159 Petya-Class Coastal ASW Frigate Line Art
// ══════════════════════════════════════════════════════════
export function drawPetyaFFG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  // Compact 82m Flush-Deck Frigate Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.50, 0);
  ctx.lineTo(l * 0.36, -w * 0.45);
  ctx.lineTo(-l * 0.42, -w * 0.45);
  ctx.lineTo(-l * 0.50, -w * 0.28);
  ctx.lineTo(-l * 0.50, w * 0.28);
  ctx.lineTo(-l * 0.42, w * 0.45);
  ctx.lineTo(l * 0.36, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Bridge & Gas Turbine Stack
  ctx.fillStyle = '#0B1D2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.fillRect(-l * 0.16, -w * 0.30, l * 0.32, w * 0.60);
  ctx.strokeRect(-l * 0.16, -w * 0.30, l * 0.32, w * 0.60);

  // Central RBU-6000 12-Barrel Rocket Launcher
  ctx.strokeStyle = '#FF8A80';
  ctx.beginPath();
  ctx.arc(l * 0.12, 0, 3.5, 0, Math.PI * 2);
  ctx.stroke();

  // Bow & Stern Twin 76mm AK-726 Gun Mounts
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(l * 0.34, 0, 4, 0, Math.PI * 2);
  ctx.arc(-l * 0.34, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Project 183 P-6 Torpedo Boat (Korean War era): planing hull, 2x 533mm side-mounted torpedo tubes,
// twin 25mm 2M-3 mounts fore and aft, small wheelhouse with radar mast.
export function drawP6TorpedoBoat(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  // Hard-chine planing hull with a fine bow and square transom
  ctx.fillStyle = '#180E14';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.quadraticCurveTo(l * 0.36, -w * 0.46, l * 0.18, -w * 0.48);
  ctx.lineTo(-l * 0.48, -w * 0.46);
  ctx.lineTo(-l * 0.48, w * 0.46);
  ctx.lineTo(l * 0.18, w * 0.48);
  ctx.quadraticCurveTo(l * 0.36, w * 0.46, l * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spray strakes along the forward chines
  ctx.strokeStyle = 'rgba(255, 205, 210, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(l * 0.42, -w * 0.12);
  ctx.lineTo(l * 0.1, -w * 0.3);
  ctx.moveTo(l * 0.42, w * 0.12);
  ctx.lineTo(l * 0.1, w * 0.3);
  ctx.stroke();

  // 533mm torpedo tubes on both sides of the aft deck, angled slightly outboard
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(-l * 0.18, side * w * 0.3);
    ctx.rotate(side * 0.06);
    ctx.fillRect(-l * 0.22, -w * 0.11, l * 0.4, w * 0.22);
    ctx.strokeRect(-l * 0.22, -w * 0.11, l * 0.4, w * 0.22);
    // Torpedo warhead visible at the muzzle
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath();
    ctx.arc(l * 0.18, 0, w * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#37474F';
    ctx.restore();
  }

  // Wheelhouse with radar mast
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.fillRect(l * 0.04, -w * 0.24, l * 0.14, w * 0.48);
  ctx.strokeRect(l * 0.04, -w * 0.24, l * 0.14, w * 0.48);
  ctx.strokeStyle = detailColor;
  ctx.beginPath();
  ctx.moveTo(l * 0.06, -w * 0.18);
  ctx.lineTo(l * 0.06, w * 0.18);
  ctx.stroke();
  ctx.fillStyle = detailColor;
  ctx.beginPath();
  ctx.arc(l * 0.06, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Twin 25mm 2M-3 mounts fore and aft
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.2;
  for (const [mx, dir] of [[l * 0.3, 1], [-l * 0.42, -1]] as const) {
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(mx, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx, -1.1);
    ctx.lineTo(mx + dir * 6, -1.1);
    ctx.moveTo(mx, 1.1);
    ctx.lineTo(mx + dir * 6, 1.1);
    ctx.stroke();
  }
}
