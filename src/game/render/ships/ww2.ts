import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './mounts';

// Carrier Line Art (Yorktown CV-6 / Essex CV-9)
export function drawCarrier(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Flight Deck Profile with chamfered bow
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.4);
  ctx.lineTo(l * 0.51, 0);
  ctx.lineTo(l * 0.48, w * 0.4);
  ctx.lineTo(-l * 0.48, w * 0.44);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.48, -w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight Deck Centerline
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.44, 0);
  ctx.lineTo(l * 0.46, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Deck Elevators with X Cross-Bracing
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  // Fwd Elevator
  ctx.strokeRect(l * 0.16, -w * 0.22, l * 0.14, w * 0.44);
  ctx.beginPath();
  ctx.moveTo(l * 0.16, -w * 0.22);
  ctx.lineTo(l * 0.3, w * 0.22);
  ctx.moveTo(l * 0.3, -w * 0.22);
  ctx.lineTo(l * 0.16, w * 0.22);
  ctx.stroke();

  // Aft Elevator
  ctx.strokeRect(-l * 0.3, -w * 0.22, l * 0.14, w * 0.44);
  ctx.beginPath();
  ctx.moveTo(-l * 0.3, -w * 0.22);
  ctx.lineTo(-l * 0.16, w * 0.22);
  ctx.moveTo(-l * 0.16, -w * 0.22);
  ctx.lineTo(-l * 0.3, w * 0.22);
  ctx.stroke();

  // Arresting Wires (4 wires)
  ctx.lineWidth = 1;
  for (let i = -4; i <= -1; i++) {
    const x = l * 0.08 * i;
    ctx.beginPath();
    ctx.moveTo(x, -w * 0.38);
    ctx.lineTo(x, w * 0.38);
    ctx.stroke();
  }

  // Catapult Launch Tracks
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(l * 0.18, -w * 0.18);
  ctx.lineTo(l * 0.48, -w * 0.18);
  if (ship.era === 'era2') {
    ctx.moveTo(l * 0.18, w * 0.18);
    ctx.lineTo(l * 0.48, w * 0.18);
  }
  ctx.stroke();

  // Starboard Island Superstructure
  ctx.fillStyle = '#050E18';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(l * 0.04, -w * 0.62, l * 0.22, w * 0.22);
  ctx.fillRect(l * 0.04, -w * 0.62, l * 0.22, w * 0.22);

  // Island Bridge Tier Levels & Tripod Radar Mast
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(l * 0.08, -w * 0.58, l * 0.14, w * 0.14);
  ctx.beginPath();
  ctx.moveTo(l * 0.15, -w * 0.62);
  ctx.lineTo(l * 0.15, -w * 0.82); // Mast
  ctx.stroke();

  // Radar dish on mast
  ctx.beginPath();
  ctx.arc(l * 0.15, -w * 0.82, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Port and Starboard Anti-Aircraft Gun Sponson Tubs
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  // Fwd sponsons
  ctx.beginPath();
  ctx.arc(l * 0.4, -w * 0.44, 4, 0, Math.PI * 2);
  ctx.arc(l * 0.4, w * 0.44, 4, 0, Math.PI * 2);
  // Aft sponsons
  ctx.arc(-l * 0.42, -w * 0.46, 4, 0, Math.PI * 2);
  ctx.arc(-l * 0.42, w * 0.46, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Deck Edge Foul Stripes & Parked Aircraft Wing Silhouettes
  ctx.strokeStyle = 'rgba(255, 213, 79, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, -w * 0.40);
  ctx.lineTo(l * 0.42, -w * 0.40);
  ctx.stroke();

  const readyDeckPlanes = ship.carrierPlanes
    ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
    : 0;
  const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 3));
  for (let p = 0; p < parkedCount; p++) {
    const px = -l * 0.34 + p * (l * 0.14);
    const py = p % 2 === 0 ? w * 0.28 : -w * 0.28;
    ctx.fillStyle = '#90CAF9';
    ctx.beginPath();
    ctx.moveTo(px + 3, py);
    ctx.lineTo(px - 2, py - 3.2);
    ctx.lineTo(px - 2, py + 3.2);
    ctx.closePath();
    ctx.fill();
  }

  // Pennant number on bow deck
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(ship.era === 'era2' ? '9' : '6', l * 0.42, 3);

  drawShipTurrets(rc, ship, hullColor);
}

// Battleship Line Art (North Carolina / Yamato)
export function drawBattleship(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const isYamato = ship.name.includes('大和') || ship.name.includes('Yamato');

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  if (isYamato) {
    // ════ IJN Yamato (72,800 ton Super-Battleship) ════
    // Massive flared clipper bow with bulbous bow outline and torpedo armor bulge
    ctx.beginPath();
    ctx.moveTo(l * 0.54, 0); // Bulbous bow
    ctx.lineTo(l * 0.40, -w * 0.46);
    ctx.lineTo(-l * 0.36, -w * 0.50); // Massive midship armor bulge (38.9m beam)
    ctx.lineTo(-l * 0.50, -w * 0.24);
    ctx.lineTo(-l * 0.52, 0);
    ctx.lineTo(-l * 0.50, w * 0.24);
    ctx.lineTo(-l * 0.36, w * 0.50);
    ctx.lineTo(l * 0.40, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armored Citadel & Pagoda Command Tower
    ctx.fillStyle = '#050E18';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.fillRect(-l * 0.16, -w * 0.30, l * 0.34, w * 0.60);
    ctx.strokeRect(-l * 0.16, -w * 0.30, l * 0.34, w * 0.60);

    // 15-meter Optical Rangefinder atop bridge
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.moveTo(l * 0.05, -w * 0.25);
    ctx.lineTo(l * 0.05, w * 0.25);
    ctx.stroke();

    // Single Massive Curved Funnel with Black Raked Cap
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(-l * 0.04, 0, 7, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Two Triple 15.5cm Secondary Turrets (one fwd of bridge, one aft of mainmast)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(l * 0.12, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.18, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stern Dual Catapults and Aircraft Handling Turntable Deck
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.moveTo(-l * 0.38, -w * 0.18);
    ctx.lineTo(-l * 0.49, -w * 0.22);
    ctx.moveTo(-l * 0.38, w * 0.18);
    ctx.lineTo(-l * 0.49, w * 0.22);
    ctx.stroke();
  } else {
    // ════ US Battleship (Iowa / Colorado) ════
    // Armored Hull with Raked Bow and Torpedo Bulge
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0); // Clipper bow
    ctx.lineTo(l * 0.38, -w * 0.45);
    ctx.lineTo(-l * 0.36, -w * 0.48); // Armor belt bulge
    ctx.lineTo(-l * 0.5, -w * 0.2);
    ctx.lineTo(-l * 0.52, 0);
    ctx.lineTo(-l * 0.5, w * 0.2);
    ctx.lineTo(-l * 0.36, w * 0.48);
    ctx.lineTo(l * 0.38, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Deck Teak Line
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(-l * 0.38, -w * 0.32, l * 0.76, w * 0.64);

    // Armored Citadel Superstructure
    ctx.fillStyle = '#050E18';
    ctx.strokeRect(-l * 0.16, -w * 0.28, l * 0.32, w * 0.56);
    ctx.fillRect(-l * 0.16, -w * 0.28, l * 0.32, w * 0.56);

    // Conning Tower & Bridge levels
    ctx.strokeRect(-l * 0.05, -w * 0.2, l * 0.14, w * 0.4);

    // Twin Funnels / Smokestacks with grates
    ctx.strokeRect(-l * 0.12, -w * 0.12, l * 0.06, w * 0.24);
    ctx.strokeRect(-l * 0.02, -w * 0.12, l * 0.06, w * 0.24);

    // Stern Aircraft Catapult
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-l * 0.36, 0);
    ctx.lineTo(-l * 0.48, 0);
    ctx.stroke();
  }

  drawShipTurrets(rc, ship, hullColor);
}

// Cruiser Line Art (CA San Francisco / CL Cleveland)
export function drawCruiser(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#071624';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Slender Cruiser Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.35, -w * 0.45);
  ctx.lineTo(-l * 0.42, -w * 0.45);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.42, w * 0.45);
  ctx.lineTo(l * 0.35, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Superstructure & Bridge Deckhouse
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-l * 0.15, -w * 0.26, l * 0.3, w * 0.52);

  // Funnels
  ctx.strokeRect(-l * 0.08, -w * 0.12, l * 0.06, w * 0.24);
  ctx.strokeRect(l * 0.02, -w * 0.12, l * 0.06, w * 0.24);

  // Midship Catapult
  ctx.beginPath();
  ctx.moveTo(-l * 0.18, 0);
  ctx.lineTo(-l * 0.28, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Destroyer Line Art (Fletcher / Gearing)
export function drawDestroyer(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#071420';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Sharp Fast Destroyer Hull Profile
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0); // Knife bow
  ctx.lineTo(l * 0.28, -w * 0.44);
  ctx.lineTo(-l * 0.44, -w * 0.44);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.44, w * 0.44);
  ctx.lineTo(l * 0.28, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Raised Forecastle Line
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(l * 0.12, -w * 0.44);
  ctx.lineTo(l * 0.12, w * 0.44);
  ctx.stroke();

  // Bridge & Mast
  ctx.strokeRect(0, -w * 0.25, l * 0.14, w * 0.5);

  // Quintuple Torpedo Tube Launcher Assembly midships
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-l * 0.12, -w * 0.2, l * 0.09, w * 0.4);
  // 5 Torpedo tips
  for (let t = -2; t <= 2; t++) {
    ctx.beginPath();
    ctx.arc(-l * 0.03, t * (w * 0.08), 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 20mm Oerlikon Rapid-Fire Gun Tubs (Bridge wings & amidships)
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(l * 0.05, -w * 0.38, 2.5, 0, Math.PI * 2);
  ctx.arc(l * 0.05, w * 0.38, 2.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.06, -w * 0.38, 2.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.06, w * 0.38, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // 40mm Bofors Twin AA Mount Platforms
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-l * 0.08, -w * 0.22, l * 0.04, w * 0.44);

  // Stern Depth Charge Twin Roller Racks with Canisters
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, -w * 0.32);
  ctx.lineTo(-l * 0.5, -w * 0.32);
  ctx.moveTo(-l * 0.42, w * 0.32);
  ctx.lineTo(-l * 0.5, w * 0.32);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// Submarine Line Art (IJN 伊號 / Kriegsmarine Monsun U-Boat / Soviet Whiskey-Zulu)
export function drawSubmarine(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const variant = ship.subVariant;

  if (ship.isSubmerged) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle =
      ship.side === 'enemy' ? 'rgba(255, 171, 64, 0.72)' : 'rgba(128, 222, 234, 0.55)';
  } else {
    ctx.strokeStyle = hullColor;
  }

  ctx.fillStyle = variant === 'uboat' ? '#0C141D' : variant === 'whiskey' || variant === 'zulu' ? '#120C12' : '#06101A';
  ctx.lineWidth = 2;

  if (variant === 'uboat') {
    // Kriegsmarine Type VII/IX U-Boat: narrow pointed bow, external saddle-tank bulge amidships
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.25, -w * 0.34);
    ctx.lineTo(l * 0.14, -w * 0.48); // Saddle tanks
    ctx.lineTo(-l * 0.16, -w * 0.48);
    ctx.lineTo(-l * 0.26, -w * 0.32);
    ctx.lineTo(-l * 0.50, 0);
    ctx.lineTo(-l * 0.26, w * 0.32);
    ctx.lineTo(-l * 0.16, w * 0.48);
    ctx.lineTo(l * 0.14, w * 0.48);
    ctx.lineTo(l * 0.25, w * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wintergarten dual-tier AA gun platform aft of conning tower
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-l * 0.04, -w * 0.22, l * 0.14, w * 0.44);
    ctx.strokeRect(-l * 0.13, -w * 0.16, l * 0.09, w * 0.32);
    // Bow net-cutter & forward deck gun
    ctx.beginPath();
    ctx.moveTo(l * 0.16, 0);
    ctx.lineTo(l * 0.27, 0);
    ctx.stroke();
  } else if (variant === 'whiskey' || variant === 'zulu') {
    // Soviet Project 613 Whiskey / 611 Zulu streamlined post-war casing without deck gun
    ctx.beginPath();
    ctx.moveTo(l * 0.50, 0);
    ctx.bezierCurveTo(l * 0.38, -w * 0.42, l * 0.12, -w * 0.42, -l * 0.2, -w * 0.38);
    ctx.lineTo(-l * 0.50, 0);
    ctx.lineTo(-l * 0.2, w * 0.38);
    ctx.bezierCurveTo(l * 0.12, w * 0.42, l * 0.38, w * 0.42, l * 0.50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stepped snorkel fairing sail + Soviet red star mark
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-l * 0.08, -w * 0.22, l * 0.18, w * 0.44, 2);
    ctx.stroke();
    ctx.fillStyle = '#D50000';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // IJN 伊號 Type B1/B3 Cruiser Submarine (forward watertight aircraft hangar + aft deck gun)
    ctx.beginPath();
    ctx.ellipse(0, 0, l * 0.5, w * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Free-flooding casing limber hole slits
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    for (let s = -3; s <= 3; s++) {
      const sx = s * (l * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx, -w * 0.22);
      ctx.lineTo(sx + 4, -w * 0.22);
      ctx.moveTo(sx, w * 0.22);
      ctx.lineTo(sx + 4, w * 0.22);
      ctx.stroke();
    }

    if (variant === 'ijn_sub') {
      // Cylindrical aircraft hangar forward of sail
      ctx.fillStyle = '#14202C';
      ctx.fillRect(l * 0.08, -w * 0.16, l * 0.15, w * 0.32);
      ctx.strokeRect(l * 0.08, -w * 0.16, l * 0.15, w * 0.32);
    }

    // Conning Tower with periscope & deck gun
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-l * 0.08, -w * 0.22, l * 0.16, w * 0.44);

    // Deck gun
    ctx.beginPath();
    ctx.moveTo(variant === 'ijn_sub' ? -l * 0.14 : l * 0.14, 0);
    ctx.lineTo(variant === 'ijn_sub' ? -l * 0.24 : l * 0.24, 0);
    ctx.stroke();
  }

  // Bow & Stern Hydroplanes (Diving Planes)
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(l * 0.34, -w * 0.52);
  ctx.lineTo(l * 0.34, w * 0.52);
  ctx.moveTo(-l * 0.42, -w * 0.48);
  ctx.lineTo(-l * 0.42, w * 0.48);
  ctx.stroke();

  ctx.setLineDash([]);
}

// LCVP Higgins Landing Craft Line Art
export function drawLCVP(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#091B2C';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Distinctive blunt-nosed Higgins boat profile with forward ramp
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.42); // Square bow ramp top
  ctx.lineTo(l * 0.48, w * 0.42);
  ctx.lineTo(-l * 0.45, w * 0.45);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.45, -w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forward Drop Ramp Seam & Hinges
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.42);
  ctx.lineTo(l * 0.48, w * 0.42);
  ctx.stroke();

  // Cargo / Troop Well Deck Interior
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-l * 0.28, -w * 0.32, l * 0.65, w * 0.64);

  // Ribbed floor decking lines
  for (let r = -2; r <= 3; r++) {
    const rx = r * (l * 0.08);
    ctx.beginPath();
    ctx.moveTo(rx, -w * 0.28);
    ctx.lineTo(rx, w * 0.28);
    ctx.stroke();
  }

  // Aft Coxswain Station & Twin .50 cal Machine Gun Tubs
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-l * 0.32, -w * 0.28, 2.8, 0, Math.PI * 2);
  ctx.arc(-l * 0.32, w * 0.28, 2.8, 0, Math.PI * 2);
  ctx.stroke();

  // .50 cal machine gun barrels
  ctx.beginPath();
  ctx.moveTo(-l * 0.32, -w * 0.28);
  ctx.lineTo(-l * 0.2, -w * 0.28);
  ctx.moveTo(-l * 0.32, w * 0.28);
  ctx.lineTo(-l * 0.2, w * 0.28);
  ctx.stroke();

  // Embarked troop indicators inside well deck if carrying units
  if (ship.embarkedUnitIds && ship.embarkedUnitIds.length > 0) {
    ctx.fillStyle = '#00E676';
    for (let t = 0; t < ship.embarkedUnitIds.length; t++) {
      ctx.beginPath();
      ctx.arc(-l * 0.1 + t * (l * 0.2), 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// LST Tank Landing Ship Line Art
export function drawLST(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  const isNewport = ship.name.includes('Newport') || ship.name.includes('1179') || ship.era === 'era4' || ship.era === 'era5';

  if (isNewport) {
    // ════ Newport-Class Tank Landing Ship (LST-1179) ════
    // 20-knot clipper bow with two giant fixed horn gantries extending over the bow for deploying the 112ft aluminum ramp
    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(l * 0.44, -w * 0.28);
    ctx.lineTo(l * 0.52, 0); // Sharp 20-knot clipper bow
    ctx.lineTo(l * 0.44, w * 0.28);
    ctx.lineTo(-l * 0.48, w * 0.38);
    ctx.lineTo(-l * 0.5, w * 0.25);
    ctx.lineTo(-l * 0.5, -w * 0.25); // Stern gate for launching AAVs/LVTPs
    ctx.lineTo(-l * 0.48, -w * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Bow Horn Derrick Gantries (Iconic Newport-class feature extending over the bow)
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    // Port gantry horn
    ctx.moveTo(l * 0.32, -w * 0.22);
    ctx.lineTo(l * 0.56, -w * 0.16);
    ctx.lineTo(l * 0.58, -w * 0.12);
    // Starboard gantry horn
    ctx.moveTo(l * 0.32, w * 0.22);
    ctx.lineTo(l * 0.56, w * 0.16);
    ctx.lineTo(l * 0.58, w * 0.12);
    ctx.stroke();

    // Aluminum ramp stowed between horns
    ctx.fillStyle = '#37474F';
    ctx.fillRect(l * 0.36, -w * 0.1, l * 0.18, w * 0.2);
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 1;
    ctx.strokeRect(l * 0.36, -w * 0.1, l * 0.18, w * 0.2);

    // Forward Twin 3"/50 Mk 33 Gun Turret
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(l * 0.26, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Twin barrels
    ctx.beginPath();
    ctx.moveTo(l * 0.26, -1.5);
    ctx.lineTo(l * 0.34, -1.5);
    ctx.moveTo(l * 0.26, 1.5);
    ctx.lineTo(l * 0.34, 1.5);
    ctx.stroke();

    // Phalanx CIWS in Era 5
    if (ship.era === 'era5') {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(l * 0.18, -w * 0.24, 4, 3);
      ctx.strokeRect(l * 0.18, w * 0.24 - 3, 4, 3);
    }

    // Large Bridge Superstructure & Combined Exhaust Funnel-Mast (Mack)
    ctx.fillStyle = '#102A43';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-l * 0.08, -w * 0.24, l * 0.22, w * 0.48);
    ctx.strokeRect(-l * 0.08, -w * 0.24, l * 0.22, w * 0.48);

    // Radar Mast
    ctx.beginPath();
    ctx.arc(l * 0.02, 0, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Aft Flight Deck & Vehicle Parking Deck (CH-46/CH-53 Helo Spot & Tank Parking)
    ctx.strokeStyle = '#78909C';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-l * 0.45, -w * 0.32, l * 0.34, w * 0.64);

    // Helo Landing Spot "H"
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-l * 0.32, 0, w * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.35, -w * 0.12);
    ctx.lineTo(-l * 0.35, w * 0.12);
    ctx.moveTo(-l * 0.29, -w * 0.12);
    ctx.lineTo(-l * 0.29, w * 0.12);
    ctx.moveTo(-l * 0.35, 0);
    ctx.lineTo(-l * 0.29, 0);
    ctx.stroke();

    // Stowed M60 / M1 Abrams Tank on vehicle deck
    ctx.fillStyle = '#33691E';
    ctx.strokeStyle = '#AED581';
    ctx.lineWidth = 1;
    ctx.fillRect(-l * 0.18, -w * 0.18, l * 0.08, w * 0.36);
    ctx.strokeRect(-l * 0.18, -w * 0.18, l * 0.08, w * 0.36);
    ctx.beginPath();
    ctx.arc(-l * 0.14, 0, 3, 0, Math.PI * 2);
    ctx.moveTo(-l * 0.14, 0);
    ctx.lineTo(-l * 0.06, 0);
    ctx.stroke();

    drawShipTurrets(rc, ship, hullColor);
    return;
  }

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Full-bodied Amphibious Landing Hull
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.35);
  ctx.lineTo(l * 0.51, 0); // Bow visor seam
  ctx.lineTo(l * 0.48, w * 0.35);
  ctx.lineTo(-l * 0.46, w * 0.46);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.46, -w * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bow Clamshell Doors Center Split Seam
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(l * 0.38, 0);
  ctx.lineTo(l * 0.51, 0);
  ctx.stroke();

  // Long Tank Vehicle Deck Area
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-l * 0.18, -w * 0.34, l * 0.52, w * 0.68);

  // Stowed M4 Sherman / M3 Tank outline on deck
  ctx.fillStyle = '#2E7D32';
  ctx.strokeStyle = '#C8E6C9';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(l * 0.05, -w * 0.2, l * 0.14, w * 0.4);
  ctx.fillRect(l * 0.05, -w * 0.2, l * 0.14, w * 0.4);
  // Tank turret
  ctx.beginPath();
  ctx.arc(l * 0.11, 0, w * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  // Tank gun barrel
  ctx.beginPath();
  ctx.moveTo(l * 0.11, 0);
  ctx.lineTo(l * 0.24, 0);
  ctx.stroke();

  // Forward 40mm Bofors Twin Tub
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(l * 0.32, 0, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  // Aft Superstructure, Bridge & Dual Exhaust Stacks
  ctx.strokeRect(-l * 0.42, -w * 0.34, l * 0.2, w * 0.68);
  ctx.strokeRect(-l * 0.38, -w * 0.15, l * 0.08, w * 0.3);

  // Stern 3"/50 DP Gun Platform
  ctx.beginPath();
  ctx.arc(-l * 0.44, 0, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.44, 0);
  ctx.lineTo(-l * 0.5, 0);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// LSM(R) Medium Rocket Landing Ship Line Art
export function drawLSMR(rc: RenderContext, ship: Ship, hullColor: string, _detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Streamlined amphibious landing ship hull
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.lineTo(l * 0.38, -w * 0.44);
  ctx.lineTo(-l * 0.45, -w * 0.44);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.45, w * 0.44);
  ctx.lineTo(l * 0.38, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Multi-tier 5-inch Continuous Rocket Launcher Banks along foredeck
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.2;
  for (let row = -1; row <= 1; row += 2) {
    for (let bank = 0; bank < 4; bank++) {
      const bx = -l * 0.05 + bank * (l * 0.1);
      const by = row * (w * 0.24);
      ctx.strokeRect(bx, by - 3, l * 0.07, 6);
      // Rocket tube slots
      for (let t = 0; t < 3; t++) {
        ctx.beginPath();
        ctx.moveTo(bx + t * 4, by - 3);
        ctx.lineTo(bx + t * 4 + 3, by + 3);
        ctx.stroke();
      }
    }
  }

  // Red Hazard Diagonal Warning Stripes on rocket blast deck
  ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-l * 0.08, -w * 0.4);
  ctx.lineTo(l * 0.32, -w * 0.4);
  ctx.moveTo(-l * 0.08, w * 0.4);
  ctx.lineTo(l * 0.32, w * 0.4);
  ctx.stroke();

  // Aft 5"/38 DP Enclosed Gun Mount
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-l * 0.28, 0, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-l * 0.28, 0);
  ctx.lineTo(-l * 0.42, 0);
  ctx.stroke();

  // Aft Bridge Conning Tower
  ctx.strokeRect(-l * 0.2, -w * 0.24, l * 0.12, w * 0.48);

  drawShipTurrets(rc, ship, hullColor);
}

// CVE Escort Carrier (Casablanca Class) Line Art
export function drawCVE(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Compact rectangular flight deck
  ctx.beginPath();
  ctx.moveTo(l * 0.48, -w * 0.42);
  ctx.lineTo(l * 0.5, 0);
  ctx.lineTo(l * 0.48, w * 0.42);
  ctx.lineTo(-l * 0.48, w * 0.42);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.48, -w * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flight Deck Planking lines & centerline
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.45, 0);
  ctx.lineTo(l * 0.45, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Single Starboard Mini-Island Superstructure
  ctx.strokeRect(l * 0.08, -w * 0.48, l * 0.14, w * 0.14);
  ctx.fillStyle = '#80DEEA';
  ctx.beginPath();
  ctx.arc(l * 0.15, -w * 0.41, 2, 0, Math.PI * 2);
  ctx.fill();

  // Flight Deck Elevators
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(l * 0.2, -w * 0.22, l * 0.14, w * 0.44);
  ctx.strokeRect(-l * 0.28, -w * 0.22, l * 0.14, w * 0.44);

  // Arrestor Cables
  for (let c = -3; c <= -1; c++) {
    ctx.beginPath();
    ctx.moveTo(-l * 0.44 - c * 5, -w * 0.38);
    ctx.lineTo(-l * 0.44 - c * 5, w * 0.38);
    ctx.stroke();
  }

  // Catwalk 40mm Bofors / 20mm Oerlikon Gun Tubs along port & starboard
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.arc(l * 0.35, -w * 0.46, 2.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.35, -w * 0.46, 2.5, 0, Math.PI * 2);
  ctx.arc(l * 0.35, w * 0.46, 2.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.35, w * 0.46, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// IJN Takao-Class Heavy Cruiser (Chokai) Line Art (Iconic Castle/Pagoda Bridge)
// ══════════════════════════════════════════════════════════
export function drawChokaiCA(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Japanese Cruiser Flush Deck Hull with S-Curved Bow Shear
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.40, -w * 0.44);
  ctx.lineTo(-l * 0.40, -w * 0.44);
  ctx.lineTo(-l * 0.50, -w * 0.22);
  ctx.lineTo(-l * 0.50, w * 0.22);
  ctx.lineTo(-l * 0.40, w * 0.44);
  ctx.lineTo(l * 0.40, w * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Massive 10-Story Pagoda Castle Bridge Superstructure
  ctx.fillStyle = '#050E18';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.6;
  ctx.fillRect(l * 0.05, -w * 0.32, l * 0.16, w * 0.64);
  ctx.strokeRect(l * 0.05, -w * 0.32, l * 0.16, w * 0.64);

  // Bridge tiers with optical rangefinders
  ctx.strokeRect(l * 0.08, -w * 0.22, l * 0.09, w * 0.44);
  ctx.strokeRect(l * 0.11, -w * 0.14, l * 0.04, w * 0.28);

  // Forward Funnel (curved sharply aft) & Second Funnel (straight)
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.ellipse(-l * 0.03, 0, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-l * 0.12, 0, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Quadruple Type 93 Long Lance Torpedo Sponsons (Midships)
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(-l * 0.18, -w * 0.46, 6, 4);
  ctx.strokeRect(-l * 0.18, w * 0.38, 6, 4);

  // 5 Twin 20cm Main Turrets: 3 fwd (Turret 3 facing aft), 2 aft
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(l * 0.38, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(l * 0.28, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(l * 0.18, 0, 4.5, 0, Math.PI * 2); // Turret 3
  ctx.arc(-l * 0.28, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.38, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// IJN Kongo-Class Fast Battleship Line Art (Multi-Tier Pagoda Mast)
// ══════════════════════════════════════════════════════════
export function drawKongoBB(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.0;

  // Long, Fast Battleship Hull with Clipper Bow & Torpedo Bulge
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.lineTo(l * 0.38, -w * 0.45);
  ctx.lineTo(-l * 0.38, -w * 0.46);
  ctx.lineTo(-l * 0.50, -w * 0.20);
  ctx.lineTo(-l * 0.50, w * 0.20);
  ctx.lineTo(-l * 0.38, w * 0.46);
  ctx.lineTo(l * 0.38, w * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Famous 6-Tier Japanese Pagoda Mast
  ctx.fillStyle = '#050E18';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.5;
  ctx.fillRect(l * 0.04, -w * 0.26, l * 0.14, w * 0.52);
  ctx.strokeRect(l * 0.04, -w * 0.26, l * 0.14, w * 0.52);
  // Upper Pagoda tiers
  ctx.strokeRect(l * 0.07, -w * 0.18, l * 0.08, w * 0.36);
  ctx.strokeRect(l * 0.09, -w * 0.10, l * 0.04, w * 0.20);

  // Twin Funnels with Steam Pipes
  ctx.fillStyle = '#212121';
  ctx.fillRect(-l * 0.04, -w * 0.14, l * 0.05, w * 0.28);
  ctx.strokeRect(-l * 0.04, -w * 0.14, l * 0.05, w * 0.28);
  ctx.fillRect(-l * 0.13, -w * 0.14, l * 0.05, w * 0.28);
  ctx.strokeRect(-l * 0.13, -w * 0.14, l * 0.05, w * 0.28);

  // 4 Twin 35.6cm Main Gun Turrets (2 fwd, 2 aft)
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(l * 0.34, 0, 5.5, 0, Math.PI * 2);
  ctx.arc(l * 0.22, 0, 5.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.26, 0, 5.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.38, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}

// ══════════════════════════════════════════════════════════
// IJN Akizuki-Class Dedicated Anti-Air Destroyer Line Art (4x Twin 10cm)
// ══════════════════════════════════════════════════════════
export function drawAkizukiDD(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;

  ctx.fillStyle = '#06101E';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;

  // 134m Clean Flush-Deck Destroyer Hull
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

  // Bridge with Type 94 High-Angle Fire Director Tower
  ctx.fillStyle = '#0B1D2E';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
  ctx.strokeRect(l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
  // Director tower dome
  ctx.fillStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(l * 0.12, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  // Single Large Streamlined Funnel
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.ellipse(-l * 0.02, 0, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Centerline Quadruple Type 92 61cm Torpedo Launcher with Shielded Reload Box
  ctx.strokeStyle = '#4FC3F7';
  ctx.strokeRect(-l * 0.12, -w * 0.22, 6, w * 0.44);

  // 4 Twin 10cm/65 Type 98 High-Angle Dual-Purpose Turrets (2 fwd, 2 aft)
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(l * 0.36, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(l * 0.24, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.24, 0, 4.5, 0, Math.PI * 2);
  ctx.arc(-l * 0.36, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawShipTurrets(rc, ship, hullColor);
}
