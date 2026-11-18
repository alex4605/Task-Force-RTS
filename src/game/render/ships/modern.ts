import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './index';

// Ticonderoga CG (Aegis Cruiser with SPY-1 phased array deckhouses)
export function drawTiconderogaCG(rc: RenderContext, ship: Ship, hullColor: string, _detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Spruance-derived hull with knifelike bow and broad stern
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.35, -w * 0.44);
  ctx.lineTo(-l * 0.45, -w * 0.44);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.45, w * 0.44);
  ctx.lineTo(l * 0.35, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Prominent Blocky Aegis Deckhouse with Octagonal AN/SPY-1A Radar Plates
  ctx.fillStyle = '#0E2A47';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(l * 0.08, -w * 0.34, l * 0.16, w * 0.68);
  ctx.fillRect(l * 0.08, -w * 0.34, l * 0.16, w * 0.68);

  // SPY-1 Phased Array Octagonal Face (Fwd Starboard & Port)
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(l * 0.18, -w * 0.34, 6, 8);
  ctx.strokeRect(l * 0.18, w * 0.34 - 8, 6, 8);

  // Mk 26 / Mk 41 VLS & Mk 45 5"/54 Lightweight Gun
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(l * 0.28, -w * 0.15, 10, w * 0.3);
  ctx.fillRect(-l * 0.28, -w * 0.15, 10, w * 0.3);

  // Mk 15 Phalanx CIWS (Port & Starboard)
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(l * 0.02, -w * 0.42, 4, 4);
  ctx.fillRect(l * 0.02, w * 0.42 - 4, 4, 4);

  drawShipTurrets(rc, ship, hullColor);
}

// Iowa Modernized (1980s refit: 3x 16" turrets, 4x Phalanx CIWS, 8x ABL Tomahawk, 4x Harpoon)
export function drawIowaModernized(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#0A1828';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  // Heavily armored Iowa battleship clipper hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.36, -w * 0.46);
  ctx.lineTo(-l * 0.42, -w * 0.46);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.42, w * 0.46);
  ctx.lineTo(l * 0.36, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Citadel & Modern Armored Box Launchers (Tomahawk)
  ctx.fillStyle = '#142A3E';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(-l * 0.15, -w * 0.28, l * 0.3, w * 0.56);
  ctx.fillRect(-l * 0.15, -w * 0.28, l * 0.3, w * 0.56);

  // 4x Mk 15 Phalanx CIWS white domes
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFE082';
  for (const pos of [
    { x: l * 0.06, y: -w * 0.4 },
    { x: l * 0.06, y: w * 0.4 },
    { x: -l * 0.18, y: -w * 0.38 },
    { x: -l * 0.18, y: w * 0.38 },
  ]) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Harpoon Quad Launchers midships
  ctx.fillStyle = '#00E5FF';
  ctx.fillRect(-l * 0.02, -w * 0.34, 6, 3);
  ctx.fillRect(-l * 0.02, w * 0.34 - 3, 6, 3);

  drawShipTurrets(rc, ship, hullColor);
}

// Oliver Hazard Perry FFG (Single Mk 13 launcher on foredeck, LAMPS helo hangar aft)
export function drawPerryFFG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#071624';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.32, -w * 0.44);
  ctx.lineTo(-l * 0.46, -w * 0.44);
  ctx.lineTo(-l * 0.49, 0);
  ctx.lineTo(-l * 0.46, w * 0.44);
  ctx.lineTo(l * 0.32, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mk 13 Single Arm Missile Launcher (SM-1MR & Harpoon)
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(l * 0.28, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Superstructure & Mk 75 76mm OTO Melara Gun on top of deckhouse
  ctx.fillStyle = '#0E243A';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(-l * 0.05, -w * 0.3, l * 0.22, w * 0.6);
  ctx.fillRect(-l * 0.05, -w * 0.3, l * 0.22, w * 0.6);

  // Twin Helo Hangar & Flight Deck Aft
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(-l * 0.36, -w * 0.36, l * 0.26, w * 0.72);

  drawShipTurrets(rc, ship, hullColor);
}

// LCAC Air Cushion Landing Craft
export function drawLCAC(rc: RenderContext, ship: Ship, _hullColor: string, _detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  // Inflatable black rubber skirt outline
  ctx.fillStyle = '#1A1D20';
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-l * 0.48, -w * 0.48, l * 0.96, w * 0.96, 6);
  ctx.fill();
  ctx.stroke();

  // Open center vehicle cargo well deck
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#CFD8DC';
  ctx.strokeRect(-l * 0.36, -w * 0.26, l * 0.72, w * 0.52);
  ctx.fillRect(-l * 0.36, -w * 0.26, l * 0.72, w * 0.52);

  // Two huge aft shrouded ducted propulsion air fans
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-l * 0.38, -w * 0.35, 7, 0, Math.PI * 2);
  ctx.arc(-l * 0.38, w * 0.35, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Control cabin on starboard bow
  ctx.fillStyle = '#80DEEA';
  ctx.fillRect(l * 0.22, -w * 0.44, 10, 6);
}

// Soviet Kiev Class Aircraft Carrier / Heavy Aviation Cruiser (CVHG)
export function drawKievCVHG(rc: RenderContext, ship: Ship, hullColor: string, _detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#1C1217';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Angled flight deck on port side, heavy missile battery on forecastle
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.48, -w * 0.48);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.48, w * 0.48);
  ctx.lineTo(l * 0.36, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Huge island on starboard side
  ctx.fillStyle = '#2D1B22';
  ctx.strokeStyle = '#FF8A80';
  ctx.strokeRect(-l * 0.1, w * 0.12, l * 0.28, w * 0.3);
  ctx.fillRect(-l * 0.1, w * 0.12, l * 0.28, w * 0.3);

  // Port Angled Runway Line
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.44, -w * 0.12);
  ctx.lineTo(l * 0.25, -w * 0.22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Forecastle 4x Twin P-500 Bazalt / Granit Heavy Missile Launch Tubes
  ctx.fillStyle = '#D50000';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(l * 0.28 + (i % 2) * 8, -w * 0.28 + Math.floor(i / 2) * 12, 12, 4);
  }

  // Yellow angled deck foul stripe & Yak-38 deck spots
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-l * 0.45, -w * 0.42);
  ctx.lineTo(l * 0.22, -w * 0.40);
  ctx.stroke();

  const readyDeckPlanes = ship.carrierPlanes
    ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
    : 0;
  const parkedCount = Math.min(3, Math.ceil(readyDeckPlanes / 3));
  for (let p = 0; p < parkedCount; p++) {
    const px = -l * 0.34 + p * (l * 0.14);
    ctx.fillStyle = '#EF9A9A';
    ctx.beginPath();
    ctx.moveTo(px + 3, -w * 0.32);
    ctx.lineTo(px - 2, -w * 0.32 - 2.8);
    ctx.lineTo(px - 2, -w * 0.32 + 2.8);
    ctx.closePath();
    ctx.fill();
  }

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Kirov Class Battlecruiser (CGN Project 1144 Orlan)
export function drawKirovCGN(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#1E1217';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  // Massive nuclear-powered battlecruiser hull with wave-piercing bow
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.36, -w * 0.46);
  ctx.lineTo(-l * 0.46, -w * 0.46);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.46, w * 0.46);
  ctx.lineTo(l * 0.36, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Foredeck 20x P-700 Granit VLS Silos (Incline Launchers)
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);
  ctx.fillRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);

  // Massive Pyramid Superstructure & Radar Masts (Top Pair / Top Steer)
  ctx.fillStyle = '#2A1820';
  ctx.strokeStyle = detailColor;
  ctx.strokeRect(-l * 0.08, -w * 0.32, l * 0.2, w * 0.64);
  ctx.fillRect(-l * 0.08, -w * 0.32, l * 0.2, w * 0.64);

  // S-300F Fort (SA-N-6) Revolver Silos & AK-630 CIWS Batteries
  ctx.strokeStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(l * 0.08, 0, 6, 0, Math.PI * 2);
  ctx.arc(-l * 0.16, 0, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Twin AK-130 130mm Gun Turret on Stern
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc(-l * 0.35, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  drawShipTurrets(rc, ship, hullColor);
}

// Soviet Sovremenny Class Destroyer (Project 956 Sarych with 8x Moskit Sunburn)
export function drawSovremennyDD(rc: RenderContext, ship: Ship, hullColor: string, _detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#1A1015';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.9;

  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.32, -w * 0.44);
  ctx.lineTo(-l * 0.46, -w * 0.44);
  ctx.lineTo(-l * 0.49, 0);
  ctx.lineTo(-l * 0.46, w * 0.44);
  ctx.lineTo(l * 0.32, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2x Quad P-270 Moskit (SS-N-22 Sunburn) Angled Canisters (Port & Starboard)
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(l * 0.08, -w * 0.45, 12, 6);
  ctx.strokeRect(l * 0.08, w * 0.45 - 6, 12, 6);

  // Bow & Stern AK-130 Twin 130mm Gun Mounts
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(l * 0.34, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.38, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// CVN-68 Nimitz Nuclear Supercarrier Line Art (Angled flight deck, aft nuclear island, 4 catapults)
// ══════════════════════════════════════════════════════════
export function drawNimitzCVN(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.4;

  // Angled Flight Deck Outer Perimeter:
  ctx.beginPath();
  ctx.moveTo(l * 0.52, -w * 0.16);
  ctx.lineTo(l * 0.48, w * 0.36);
  ctx.lineTo(l * 0.24, w * 0.40);
  ctx.lineTo(-l * 0.04, w * 0.40);
  ctx.lineTo(-l * 0.08, w * 0.46);
  ctx.lineTo(-l * 0.34, w * 0.46);
  ctx.lineTo(-l * 0.38, w * 0.38);
  ctx.lineTo(-l * 0.50, w * 0.30);
  ctx.lineTo(-l * 0.52, 0);
  ctx.lineTo(-l * 0.50, -w * 0.34);
  ctx.lineTo(-l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.08, -w * 0.54);
  ctx.lineTo(l * 0.20, -w * 0.54);
  ctx.lineTo(l * 0.34, -w * 0.30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Steel Deck Armor Tint
  ctx.fillStyle = 'rgba(16, 36, 56, 0.5)';
  ctx.fill();

  // 1. Bow Steam Catapults (Cat 1 & Cat 2)
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(l * 0.18, w * 0.12);
  ctx.lineTo(l * 0.48, w * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(l * 0.18, -w * 0.05);
  ctx.lineTo(l * 0.48, -w * 0.05);
  ctx.stroke();

  // 2. Angled Waist Steam Catapults (Cat 3 & Cat 4)
  const cantAngle = -0.165; // ~9.5 deg
  ctx.save();
  ctx.translate(-l * 0.04, -w * 0.18);
  ctx.rotate(cantAngle);
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-l * 0.14, -w * 0.06);
  ctx.lineTo(l * 0.24, -w * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.14, w * 0.06);
  ctx.lineTo(l * 0.24, w * 0.06);
  ctx.stroke();

  // Angled Runway Centerline
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.44, 0);
  ctx.lineTo(l * 0.26, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 Cross-Deck Pendant Arresting Cables
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.4;
  for (let c = 0; c < 4; c++) {
    const cx = -l * 0.30 + c * 11;
    ctx.beginPath();
    ctx.moveTo(cx, -w * 0.19);
    ctx.lineTo(cx, w * 0.19);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Four Large Deck-Edge Elevators (2 starboard fwd, 1 starboard aft, 1 port aft)
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(l * 0.22, w * 0.38, l * 0.08, w * 0.09);
  ctx.strokeRect(l * 0.06, w * 0.38, l * 0.08, w * 0.09);
  ctx.strokeRect(-l * 0.24, w * 0.36, l * 0.08, w * 0.09); // Starboard aft (behind island)
  ctx.strokeRect(-l * 0.36, -w * 0.45, l * 0.08, w * 0.09); // Port aft

  // 4. Compact Nuclear Island placed far aft on starboard side (Behind Elevator 2)
  ctx.fillStyle = '#0B1D2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.rect(-l * 0.06, w * 0.28, l * 0.15, w * 0.11);
  ctx.fill();
  ctx.stroke();

  // Radars atop Island: SPS-48 3D radar & SPN-43 air traffic radar
  ctx.fillStyle = '#FFE082';
  ctx.fillRect(-l * 0.02, w * 0.31, 3, 3);
  ctx.fillRect(l * 0.04, w * 0.31, 3, 3);

  // 5. Jet Blast Deflectors, Foul Edge Lines & Parked Air Wing Silhouettes
  ctx.fillStyle = '#CFD8DC';
  ctx.fillRect(l * 0.15, w * 0.10, 2.5, 5);
  ctx.fillRect(l * 0.15, -w * 0.07, 2.5, 5);
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-l * 0.36, -w * 0.46);
  ctx.lineTo(l * 0.18, -w * 0.52);
  ctx.stroke();

  const readyDeckPlanes = ship.carrierPlanes
    ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
    : 0;
  const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 4));
  for (let p = 0; p < parkedCount; p++) {
    const px = -l * 0.32 + p * (l * 0.13);
    const py = p % 2 === 0 ? w * 0.28 : -w * 0.40;
    ctx.fillStyle = '#90CAF9';
    ctx.beginPath();
    ctx.moveTo(px + 3.5, py);
    ctx.lineTo(px - 2.5, py - 3.5);
    ctx.lineTo(px - 2.5, py + 3.5);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Weapon Sponsons: Mk 29 Sea Sparrow & Phalanx CIWS
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1;
  // Bow starboard CIWS sponson
  ctx.strokeRect(l * 0.44, w * 0.32, 5, 5);
  // Stern port Sea Sparrow sponson
  ctx.strokeRect(-l * 0.48, -w * 0.32, 6, 6);
  // Stern starboard Sea Sparrow + CIWS sponson
  ctx.strokeRect(-l * 0.48, w * 0.28, 6, 6);

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// CGN-38 Virginia-Class Nuclear Cruiser Line Art
// ══════════════════════════════════════════════════════════
export function drawVirginiaCG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Sleek, flush-deck nuclear cruiser hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0); // Sharp raked bow
  ctx.lineTo(l * 0.36, -w * 0.44);
  ctx.lineTo(-l * 0.38, -w * 0.44);
  ctx.lineTo(-l * 0.50, -w * 0.28); // Transom stern
  ctx.lineTo(-l * 0.50, w * 0.28);
  ctx.lineTo(-l * 0.38, w * 0.44);
  ctx.lineTo(l * 0.36, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Boxy nuclear superstructure (no main smokestacks)
  ctx.fillStyle = '#0C2032';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.4;
  ctx.fillRect(-l * 0.24, -w * 0.30, l * 0.48, w * 0.60);
  ctx.strokeRect(-l * 0.24, -w * 0.30, l * 0.48, w * 0.60);

  // Forward Bridge & Navigation Tower
  ctx.fillStyle = '#102A44';
  ctx.fillRect(l * 0.08, -w * 0.24, l * 0.14, w * 0.48);
  ctx.strokeRect(l * 0.08, -w * 0.24, l * 0.14, w * 0.48);

  // SPS-40 / SPS-48 Radar Masts
  ctx.strokeStyle = '#FFE082';
  ctx.strokeRect(l * 0.12, -w * 0.08, 4, w * 0.16);
  ctx.strokeRect(-l * 0.16, -w * 0.08, 4, w * 0.16);

  // Mk 26 Mod 0/1 Twin-Arm Missile Launchers (Fore & Aft)
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.2;
  // Forward Mk 26 Launcher
  ctx.beginPath();
  ctx.arc(l * 0.28, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(l * 0.28, -6);
  ctx.lineTo(l * 0.28, 6);
  ctx.stroke();

  // Aft Mk 26 Launcher
  ctx.beginPath();
  ctx.arc(-l * 0.30, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.30, -6);
  ctx.lineTo(-l * 0.30, 6);
  ctx.stroke();

  // Midships Harpoon Quad Canisters (Port & Starboard)
  ctx.strokeStyle = '#FFCA28';
  ctx.strokeRect(-l * 0.02, -w * 0.36, 6, 4);
  ctx.strokeRect(-l * 0.02, w * 0.30, 6, 4);

  // Stern Helo Flight Deck & Internal Hangar
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(-l * 0.48, -w * 0.22, l * 0.14, w * 0.44);
  ctx.beginPath();
  ctx.arc(-l * 0.41, 0, 5, 0, Math.PI * 2);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// DD-963 Spruance-Class Destroyer Line Art (Gas turbine, twin macks, dual helo hangar)
// ══════════════════════════════════════════════════════════
export function drawSpruanceDD(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // 172m Gas-Turbine Destroyer Hull with flared bow and transom stern
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.38, -w * 0.46);
  ctx.lineTo(-l * 0.40, -w * 0.46);
  ctx.lineTo(-l * 0.50, -w * 0.32);
  ctx.lineTo(-l * 0.50, w * 0.32);
  ctx.lineTo(-l * 0.40, w * 0.46);
  ctx.lineTo(l * 0.38, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Deck Superstructure (Split into forward bridge, twin macks, and dual hangar)
  ctx.fillStyle = '#0C1E30';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(-l * 0.30, -w * 0.32, l * 0.56, w * 0.64);
  ctx.strokeRect(-l * 0.30, -w * 0.32, l * 0.56, w * 0.64);

  // Forward ASROC / Mk 41 VLS Deck Hatch
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(l * 0.18, -w * 0.22, l * 0.08, w * 0.44);

  // Forward Mack (Combined Mast and Stack)
  ctx.fillStyle = '#1A237E';
  ctx.fillRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
  ctx.strokeRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
  ctx.fillStyle = '#212121'; // Soot cap
  ctx.fillRect(l * 0.05, -w * 0.12, l * 0.04, w * 0.24);

  // Aft Mack (Aft Combined Mast and Stack)
  ctx.fillStyle = '#1A237E';
  ctx.fillRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
  ctx.strokeRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
  ctx.fillStyle = '#212121'; // Soot cap
  ctx.fillRect(-l * 0.11, -w * 0.12, l * 0.04, w * 0.24);

  // Dual Helicopter Hangars (houses 2x SH-60B)
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(-l * 0.30, -w * 0.26, l * 0.12, w * 0.24);
  ctx.strokeRect(-l * 0.30, w * 0.02, l * 0.12, w * 0.24);

  // Stern Helo Landing Deck
  ctx.strokeRect(-l * 0.48, -w * 0.26, l * 0.15, w * 0.52);
  ctx.beginPath();
  ctx.arc(-l * 0.40, 0, 5, 0, Math.PI * 2);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// DDG-993 Kidd-Class Guided Missile Destroyer Line Art (Spruance hull + Mk 26 fore/aft)
// ══════════════════════════════════════════════════════════
export function drawKiddDDG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Spruance-Derived Heavy Destroyer Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.38, -w * 0.46);
  ctx.lineTo(-l * 0.40, -w * 0.46);
  ctx.lineTo(-l * 0.50, -w * 0.32);
  ctx.lineTo(-l * 0.50, w * 0.32);
  ctx.lineTo(-l * 0.40, w * 0.46);
  ctx.lineTo(l * 0.38, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Superstructure with SPS-48 3D Radar Tower
  ctx.fillStyle = '#0C1E30';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(-l * 0.26, -w * 0.32, l * 0.48, w * 0.64);
  ctx.strokeRect(-l * 0.26, -w * 0.32, l * 0.48, w * 0.64);

  // Forward and Aft Twin Macks with SPG-51 Illuminators
  ctx.fillStyle = '#102A44';
  ctx.fillRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
  ctx.strokeRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
  ctx.fillRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
  ctx.strokeRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);

  // Forward Mk 26 Twin-Arm Guided Missile Launcher
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(l * 0.22, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(l * 0.22, -5);
  ctx.lineTo(l * 0.22, 5);
  ctx.stroke();

  // Aft Mk 26 Twin-Arm Guided Missile Launcher (Replaces Spruance aft helo hangar)
  ctx.beginPath();
  ctx.arc(-l * 0.28, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.28, -5);
  ctx.lineTo(-l * 0.28, 5);
  ctx.stroke();

  // Midships Harpoon quad canister racks
  ctx.strokeStyle = '#FFCA28';
  ctx.strokeRect(-l * 0.04, -w * 0.38, 5, 4);
  ctx.strokeRect(-l * 0.04, w * 0.30, 5, 4);

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// LPD-4 Austin-Class Amphibious Transport Dock Line Art (Forward bridge, floodable well deck)
// ══════════════════════════════════════════════════════════
export function drawAustinLPD(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // High, beamy amphibious transport hull with open transom stern
  ctx.beginPath();
  ctx.moveTo(l * 0.50, 0);
  ctx.lineTo(l * 0.36, -w * 0.46);
  ctx.lineTo(-l * 0.44, -w * 0.46);
  ctx.lineTo(-l * 0.50, -w * 0.38);
  ctx.lineTo(-l * 0.50, w * 0.38);
  ctx.lineTo(-l * 0.44, w * 0.46);
  ctx.lineTo(l * 0.36, w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward Command Bridge Superstructure
  ctx.fillStyle = '#0B1E2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.4;
  ctx.fillRect(l * 0.14, -w * 0.36, l * 0.22, w * 0.72);
  ctx.strokeRect(l * 0.14, -w * 0.36, l * 0.22, w * 0.72);

  // Twin Funnels atop Forward Superstructure
  ctx.strokeRect(l * 0.18, -w * 0.22, 5, 8);
  ctx.strokeRect(l * 0.18, w * 0.14, 5, 8);

  // Heavy-duty Midships Cargo Crane
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(l * 0.06, 0, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(l * 0.06, 0);
  ctx.lineTo(-l * 0.04, -w * 0.25);
  ctx.stroke();

  // Massive Stern Floodable Well Deck with Dock Water Surface
  ctx.fillStyle = 'rgba(0, 150, 136, 0.35)';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-l * 0.46, -w * 0.28, l * 0.42, w * 0.56);
  ctx.strokeRect(-l * 0.46, -w * 0.28, l * 0.42, w * 0.56);

  // Stern Well-Deck Gate Opening lines
  ctx.strokeStyle = '#80CBC4';
  ctx.beginPath();
  ctx.moveTo(-l * 0.50, -w * 0.28);
  ctx.lineTo(-l * 0.46, -w * 0.28);
  ctx.moveTo(-l * 0.50, w * 0.28);
  ctx.lineTo(-l * 0.46, w * 0.28);
  ctx.stroke();

  // Elevated Helo Landing Deck over Well Deck
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.strokeRect(-l * 0.42, -w * 0.36, l * 0.34, w * 0.72);
  ctx.beginPath();
  ctx.arc(-l * 0.25, 0, 7, 0, Math.PI * 2);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// SSN-688 Los Angeles-Class Nuclear Attack Submarine Line Art
// ══════════════════════════════════════════════════════════
export function drawLosAngelesSSN(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#040C16';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // 110m Streamlined Teardrop Cylindrical Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.50, 0); // Rounded hemispherical sonar bow
  ctx.bezierCurveTo(l * 0.46, -w * 0.45, l * 0.25, -w * 0.45, 0, -w * 0.45);
  ctx.bezierCurveTo(-l * 0.25, -w * 0.45, -l * 0.44, -w * 0.30, -l * 0.50, 0);
  ctx.bezierCurveTo(-l * 0.44, w * 0.30, -l * 0.25, w * 0.45, 0, w * 0.45);
  ctx.bezierCurveTo(l * 0.25, w * 0.45, l * 0.46, w * 0.45, l * 0.50, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 12 VLS Tomahawk Vertical Launch Tube Hatches on Forward Casing
  ctx.fillStyle = '#1A237E';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const vx = l * 0.24 + row * 4;
    ctx.fillRect(vx, -w * 0.18, 2.5, 2.5);
    ctx.fillRect(vx, w * 0.10, 2.5, 2.5);
  }

  // Streamlined Sail (Conning Tower) with Fairwater Dive Planes
  ctx.fillStyle = '#0D233A';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(l * 0.05, -w * 0.20, l * 0.14, w * 0.40, 2);
  ctx.fill();
  ctx.stroke();

  // Fairwater Dive Planes extending from sail
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(l * 0.12, -w * 0.42);
  ctx.lineTo(l * 0.12, -w * 0.20);
  ctx.moveTo(l * 0.12, w * 0.20);
  ctx.lineTo(l * 0.12, w * 0.42);
  ctx.stroke();

  // Cruciform Stern Control Surfaces (Rudders & Elevators) & 7-Blade Screw
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-l * 0.45, -w * 0.48);
  ctx.lineTo(-l * 0.45, w * 0.48);
  ctx.moveTo(-l * 0.51, -w * 0.18);
  ctx.lineTo(-l * 0.51, w * 0.18);
  ctx.stroke();
}

// ══════════════════════════════════════════════════════════
// Project 949A Oscar-II Class Nuclear Cruise Missile Submarine Line Art
// ══════════════════════════════════════════════════════════
export function drawOscarSSGN(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#040C16';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  // Massive 18.2m Broad Double Hull (Widest Submarine Profile)
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.bezierCurveTo(l * 0.48, -w * 0.50, l * 0.28, -w * 0.50, 0, -w * 0.50);
  ctx.bezierCurveTo(-l * 0.30, -w * 0.50, -l * 0.46, -w * 0.35, -l * 0.52, 0);
  ctx.bezierCurveTo(-l * 0.46, w * 0.35, -l * 0.30, w * 0.50, 0, w * 0.50);
  ctx.bezierCurveTo(l * 0.28, w * 0.50, l * 0.48, w * 0.50, l * 0.52, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 24 Angled Silo Hatches for P-700 Granit (SS-N-19 Shipwreck) Missiles
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1;
  for (let s = 0; s < 12; s++) {
    const sx = l * 0.18 - s * 5.5;
    // Port missile silos
    ctx.strokeRect(sx, -w * 0.42, 4.5, 4);
    // Starboard missile silos
    ctx.strokeRect(sx, w * 0.32, 4.5, 4);
  }

  // Wide, Low Streamlined Sail
  ctx.fillStyle = '#102A44';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-l * 0.04, -w * 0.24, l * 0.20, w * 0.48, 3);
  ctx.fill();
  ctx.stroke();

  // Prominent Towed-Array Sonar Pod atop Aft Vertical Rudder
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.ellipse(-l * 0.48, 0, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// ══════════════════════════════════════════════════════════
// Project 1155 Udaloy-Class Large ASW Destroyer Line Art
// ══════════════════════════════════════════════════════════
export function drawUdaloyDD(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // 163m Deep Knuckle Bow Soviet Destroyer Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.38, -w * 0.45);
  ctx.lineTo(-l * 0.42, -w * 0.45);
  ctx.lineTo(-l * 0.50, -w * 0.28);
  ctx.lineTo(-l * 0.50, w * 0.28);
  ctx.lineTo(-l * 0.42, w * 0.45);
  ctx.lineTo(l * 0.38, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central Superstructure & Top Pair Air-Search Radar Towers
  ctx.fillStyle = '#0B1D2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(-l * 0.24, -w * 0.32, l * 0.46, w * 0.64);
  ctx.strokeRect(-l * 0.24, -w * 0.32, l * 0.46, w * 0.64);

  // Twin 4-Tube KT-100 Box Launchers for Rastrub-B (SS-N-14 Silex) ASW Missiles
  ctx.strokeStyle = '#FF8A80';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(l * 0.12, -w * 0.42, l * 0.08, w * 0.16);
  ctx.strokeRect(l * 0.12, w * 0.26, l * 0.08, w * 0.16);

  // 3K95 Kinzhal (SA-N-9 Gauntlet) VLS Rotary Drums (4 fwd, 4 aft)
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(l * 0.28, -w * 0.14, 3, 0, Math.PI * 2);
  ctx.arc(l * 0.28, w * 0.14, 3, 0, Math.PI * 2);
  ctx.arc(-l * 0.16, -w * 0.14, 3, 0, Math.PI * 2);
  ctx.arc(-l * 0.16, w * 0.14, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Twin Helicopter Hangars & Sunken Landing Deck for Ka-27 Helix
  ctx.strokeStyle = '#80DEEA';
  ctx.strokeRect(-l * 0.36, -w * 0.28, l * 0.12, w * 0.26);
  ctx.strokeRect(-l * 0.36, w * 0.02, l * 0.12, w * 0.26);
  ctx.strokeRect(-l * 0.48, -w * 0.25, l * 0.12, w * 0.50);

  // Bow Twin AK-100 100mm Single Gun Turrets
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(l * 0.38, 0, 4, 0, Math.PI * 2);
  ctx.arc(l * 0.44, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}
