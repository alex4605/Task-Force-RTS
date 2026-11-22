import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets, parseBoreMm } from './mounts';
import { drawHullShape } from './hullShape';

// Battleship Line Art (North Carolina / Yamato)
export function drawBattleship(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const isYamato = /大和|武藏|Yamato|Musashi/.test(ship.name);

  ctx.fillStyle = '#081726';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;

  if (isYamato) {
    // ════ IJN Yamato (72,800 ton Super-Battleship) ════
    // Very broad hull (38.9 m beam) with a strongly flared bow and a short, wide transom stern
    drawHullShape(ctx, l, w, { entry: 0.3, run: 0.2, transom: 0.42, fullness: 0.55, rake: 0.01 }, '#081726', hullColor, 2.2);

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
    // Iowa: long fine entry ahead of the forward turrets; North Carolina: shorter, fuller bow
    const isIowa = /Iowa|Missouri|New Jersey|Wisconsin|BB-6[1-4]/.test(ship.name);
    drawHullShape(ctx, l, w, isIowa ? { entry: 0.38, run: 0.2, transom: 0.3, fullness: 0.32, rake: 0.012 } : { entry: 0.3, run: 0.2, transom: 0.35, fullness: 0.45, rake: 0.008 }, '#081726', hullColor, 2.2);

    // Superstructure between the forward superfiring turret and the aft turret (from the turret data)
    const centre = ship.turrets.filter((t) => t.relY === 0);
    const big = Math.max(0, ...centre.map((t) => parseBoreMm(t.caliber) ?? 0));
    const main = centre.filter((t) => (parseBoreMm(t.caliber) ?? 0) >= big * 0.8);
    const fwdX = Math.min(...main.filter((t) => t.relX > 0).map((t) => t.relX), l * 0.2) - 7;
    const aftX = Math.max(...main.filter((t) => t.relX < 0).map((t) => t.relX), -l * 0.25) + 7;
    const sw = w * 0.5;
    ctx.fillStyle = '#0E1E2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(aftX, -sw * 0.7);
    ctx.lineTo(fwdX - l * 0.07, -sw * 0.8);
    ctx.lineTo(fwdX - l * 0.02, -sw * 0.62);
    ctx.quadraticCurveTo(fwdX + 2, 0, fwdX - l * 0.02, sw * 0.62);
    ctx.lineTo(fwdX - l * 0.07, sw * 0.8);
    ctx.lineTo(aftX, sw * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Armoured conning tower and forward fire-control tower with Mk 38 director
    const span = fwdX - aftX;
    ctx.fillStyle = '#16293A';
    ctx.beginPath();
    ctx.ellipse(fwdX - span * 0.1, 0, span * 0.06, sw * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(fwdX - span * 0.2, 0, Math.max(1.8, sw * 0.24), 0, Math.PI * 2);
    ctx.stroke();
    // Funnels: Iowa's two widely spaced stacks (the forward one trunked into the tower); NC's pair close together
    const stacks = isIowa ? [0.36, 0.62] : [0.4, 0.56];
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.2;
    for (const f of stacks) {
      ctx.beginPath();
      ctx.ellipse(fwdX - span * f, 0, span * 0.065, sw * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(fwdX - span * f - span * 0.04, 0);
      ctx.lineTo(fwdX - span * f + span * 0.04, 0);
      ctx.stroke();
      ctx.strokeStyle = hullColor;
    }
    // After fire-control tower and director
    ctx.strokeStyle = detailColor;
    ctx.beginPath();
    ctx.arc(aftX + span * 0.1, 0, Math.max(1.6, sw * 0.2), 0, Math.PI * 2);
    ctx.stroke();

    // Fantail: two catapults angled outboard and the aircraft crane at the stern
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-l * 0.37, -w * 0.08);
    ctx.lineTo(-l * 0.44, -w * 0.36);
    ctx.moveTo(-l * 0.37, w * 0.08);
    ctx.lineTo(-l * 0.44, w * 0.36);
    ctx.stroke();
    ctx.strokeStyle = detailColor;
    ctx.beginPath();
    ctx.arc(-l * 0.475, 0, 1.6, 0, Math.PI * 2);
    ctx.moveTo(-l * 0.475, 0);
    ctx.lineTo(-l * 0.42, 0);
    ctx.stroke();
  }

  drawShipTurrets(rc, ship, hullColor);
}

interface CruiserLayout {
  navy: 'usn' | 'ijn';
  /** Funnels as fractions of the superstructure zone (0 = forward end, 1 = aft end). */
  funnels: { at: number; raked?: boolean; trunked?: boolean }[];
  /** Aircraft catapults: 'stern' (Baltimore / Cleveland) or 'midships' (treaty cruisers, IJN). */
  catapult: 'stern' | 'midships' | 'none';
  /** IJN quadruple torpedo mounts on the beam, Atlanta's centreline quads. */
  torpedoes: 'ijn_beam' | 'ijn_centre' | 'usn_centre' | 'none';
  /** Takao-class towering bridge structure. */
  massiveBridge?: boolean;
}

function cruiserLayout(name: string): CruiserLayout {
  if (/Takao|Atago|Maya/.test(name)) {
    return { navy: 'ijn', massiveBridge: true, funnels: [{ at: 0.38, raked: true, trunked: true }, { at: 0.58, raked: true }], catapult: 'midships', torpedoes: 'ijn_beam' };
  }
  if (/Yahagi|Agano|Noshiro|Sakawa/.test(name)) {
    return { navy: 'ijn', funnels: [{ at: 0.4, raked: true, trunked: true }], catapult: 'midships', torpedoes: 'ijn_centre' };
  }
  if (/Atlanta|Juneau|San Diego|Oakland/.test(name)) {
    return { navy: 'usn', funnels: [{ at: 0.35 }, { at: 0.62 }], catapult: 'none', torpedoes: 'usn_centre' };
  }
  if (/Baltimore|Cleveland|Des Moines|Oregon/.test(name)) {
    return { navy: 'usn', funnels: [{ at: 0.38 }, { at: 0.64 }], catapult: 'stern', torpedoes: 'none' };
  }
  // Treaty heavy cruisers (Portland / New Orleans): amidships catapults between funnels and aft turret
  return { navy: 'usn', funnels: [{ at: 0.32 }, { at: 0.55 }], catapult: 'midships', torpedoes: 'none' };
}

// WWII cruiser: superstructure, funnels and catapults placed between the forward and aft main
// batteries taken from the ship's own turret data, with class-specific features.
export function drawCruiser(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const lay = cruiserLayout(ship.name);

  ctx.fillStyle = '#071624';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Hull: flared clipper bow, long parallel midbody, rounded transom stern
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.quadraticCurveTo(l * 0.38, -w * 0.42, l * 0.24, -w * 0.47);
  ctx.lineTo(-l * 0.36, -w * 0.47);
  ctx.quadraticCurveTo(-l * 0.5, -w * 0.4, -l * 0.5, 0);
  ctx.quadraticCurveTo(-l * 0.5, w * 0.4, -l * 0.36, w * 0.47);
  ctx.lineTo(l * 0.24, w * 0.47);
  ctx.quadraticCurveTo(l * 0.38, w * 0.42, l * 0.52, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Superstructure zone: between the aftmost forward main turret and the foremost aft one
  // Main battery = the largest-bore centreline mounts (ignores centreline 5" secondaries on Cleveland etc.)
  const centre = ship.turrets.filter((t) => t.relY === 0);
  const maxBore = Math.max(0, ...centre.map((t) => parseBoreMm(t.caliber) ?? 0));
  const main = centre.filter((t) => (parseBoreMm(t.caliber) ?? 0) >= maxBore * 0.8);
  const fwd = main.filter((t) => t.relX > 0).map((t) => t.relX);
  const aft = main.filter((t) => t.relX < 0).map((t) => t.relX);
  const zoneFwd = (fwd.length ? Math.min(...fwd) : l * 0.2) - 6;
  const zoneAft = (aft.length ? Math.max(...aft) : -l * 0.25) + 6;
  const zx = (f: number) => zoneFwd + (zoneAft - zoneFwd) * f;

  // Bridge / conning tower block at the forward end of the zone
  const bridgeLen = (zoneFwd - zoneAft) * (lay.massiveBridge ? 0.3 : 0.2);
  ctx.fillStyle = '#16293A';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  const bw = w * (lay.massiveBridge ? 0.62 : 0.46);
  ctx.beginPath();
  ctx.moveTo(zoneFwd - bridgeLen, -bw / 2);
  ctx.lineTo(zoneFwd - 2, -bw / 2);
  ctx.quadraticCurveTo(zoneFwd + 1, 0, zoneFwd - 2, bw / 2);
  ctx.lineTo(zoneFwd - bridgeLen, bw / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (lay.massiveBridge) {
    // Takao's stepped bridge levels
    ctx.strokeRect(zoneFwd - bridgeLen * 0.8, -bw * 0.32, bridgeLen * 0.55, bw * 0.64);
  }
  // Main battery director
  ctx.beginPath();
  ctx.arc(zoneFwd - bridgeLen * 0.45, 0, Math.min(3, w * 0.13), 0, Math.PI * 2);
  ctx.stroke();

  // Funnels
  for (const f of lay.funnels) {
    const fx = zx(f.at);
    const rx = l * (f.trunked ? 0.04 : 0.028);
    const ry = w * (f.trunked ? 0.18 : 0.13);
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(fx, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0A0F14';
    ctx.beginPath();
    ctx.ellipse(fx - (f.raked ? rx * 0.35 : 0), 0, rx * 0.55, ry * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aircraft catapults (paired, trained outboard) and a floatplane
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 1;
  if (lay.catapult !== 'none') {
    const cx = lay.catapult === 'stern' ? -l * 0.44 : zx(0.86);
    const len = l * 0.1;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(cx, side * w * 0.12);
      ctx.lineTo(cx + len * 0.55, side * w * 0.42);
    }
    ctx.stroke();
    // Floatplane on the starboard catapult
    ctx.strokeStyle = detailColor;
    ctx.beginPath();
    ctx.moveTo(cx + len * 0.15, w * 0.2);
    ctx.lineTo(cx + len * 0.45, w * 0.36);
    ctx.moveTo(cx + len * 0.22, w * 0.38);
    ctx.lineTo(cx + len * 0.38, w * 0.18);
    ctx.stroke();
  }

  // Torpedo armament
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 0.9;
  if (lay.torpedoes === 'ijn_beam') {
    // Takao: quadruple Type 92 mounts on both beams below the catapult deck
    for (const side of [-1, 1]) {
      for (const ox of [zx(0.7), zx(0.8)]) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const y = side * (w * 0.32 + i * 0.9);
          ctx.moveTo(ox - l * 0.03, y);
          ctx.lineTo(ox + l * 0.03, y);
        }
        ctx.stroke();
      }
    }
  } else if (lay.torpedoes === 'ijn_centre' || lay.torpedoes === 'usn_centre') {
    const tx = zx(lay.torpedoes === 'ijn_centre' ? 0.66 : 0.5);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * 1.1;
      ctx.moveTo(tx - l * 0.035, y);
      ctx.lineTo(tx + l * 0.035, y);
    }
    ctx.stroke();
  }

  drawShipTurrets(rc, ship, hullColor);
}

interface DestroyerLayout {
  navy: 'usn' | 'ijn' | 'sov';
  /** Funnel centres as fractions of length (bow = +0.5); raked funnels lean aft (IJN). */
  funnels: { x: number; raked?: boolean; trunked?: boolean }[];
  /** Centreline torpedo mounts: position and number of tubes. */
  tubes: { x: number; count: number }[];
  bridge: [number, number];
  /** IJN raised forecastle break. */
  deckBreak?: number;
}

// Plan-view layouts per destroyer class, positions as fractions of hull length from midships.
function destroyerLayout(name: string): DestroyerLayout {
  if (/Shimakaze/.test(name)) {
    return { navy: 'ijn', bridge: [0.14, 0.23], deckBreak: 0.13, funnels: [{ x: 0.07, raked: true, trunked: true }, { x: -0.04, raked: true }], tubes: [{ x: 0.0, count: 5 }, { x: -0.1, count: 5 }, { x: -0.155, count: 5 }] };
  }
  if (/IJN|Kagero|Yukikaze/.test(name)) {
    return { navy: 'ijn', bridge: [0.14, 0.23], deckBreak: 0.13, funnels: [{ x: 0.07, raked: true, trunked: true }, { x: -0.04, raked: true }], tubes: [{ x: 0.01, count: 4 }, { x: -0.12, count: 4 }] };
  }
  if (/Skory|Smotryashchy|Sposobny|Ozhestochonny|Vnimatelny|Vrazumitelny|Vidny/.test(name)) {
    return { navy: 'sov', bridge: [0.12, 0.2], funnels: [{ x: 0.07 }, { x: -0.06 }], tubes: [{ x: 0.0, count: 5 }, { x: -0.13, count: 5 }] };
  }
  if (/DE-|Samuel B/.test(name)) {
    return { navy: 'usn', bridge: [0.1, 0.2], funnels: [{ x: 0.03 }], tubes: [{ x: -0.07, count: 3 }] };
  }
  if (/Gearing|Frank Knox|DD-7[0-9]{2}/.test(name)) {
    return { navy: 'usn', bridge: [0.06, 0.12], funnels: [{ x: 0.02 }, { x: -0.1 }], tubes: [{ x: -0.04, count: 5 }] };
  }
  // Fletcher class (default for WWII USN destroyers)
  return { navy: 'usn', bridge: [0.12, 0.21], funnels: [{ x: 0.06 }, { x: -0.045 }], tubes: [{ x: 0.005, count: 5 }, { x: -0.1, count: 5 }] };
}

// WWII destroyer: class-specific funnels, torpedo mounts and deck layout (Fletcher / Butler DE /
// Gearing / Kagero / Shimakaze / Skory), turrets placed from the ship's own turret data.
export function drawDestroyer(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const lay = destroyerLayout(ship.name);

  ctx.fillStyle = '#071420';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;

  // Hull: fine flared bow, parallel midbody, rounded cruiser-style stern
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.quadraticCurveTo(l * 0.36, -w * 0.4, l * 0.22, -w * 0.46);
  ctx.lineTo(-l * 0.38, -w * 0.46);
  ctx.quadraticCurveTo(-l * 0.5, -w * 0.38, -l * 0.5, 0);
  ctx.quadraticCurveTo(-l * 0.5, w * 0.38, -l * 0.38, w * 0.46);
  ctx.lineTo(l * 0.22, w * 0.46);
  ctx.quadraticCurveTo(l * 0.36, w * 0.4, l * 0.52, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // IJN raised forecastle break (step down to the main deck)
  if (lay.deckBreak !== undefined) {
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l * lay.deckBreak, -w * 0.46);
    ctx.lineTo(l * lay.deckBreak, w * 0.46);
    ctx.stroke();
  }

  // Bridge with rounded front face
  const [bA, bF] = lay.bridge;
  ctx.fillStyle = '#16293A';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(l * bA, -w * 0.26);
  ctx.lineTo(l * (bF - 0.03), -w * 0.26);
  ctx.quadraticCurveTo(l * bF, -w * 0.26, l * bF, 0);
  ctx.quadraticCurveTo(l * bF, w * 0.26, l * (bF - 0.03), w * 0.26);
  ctx.lineTo(l * bA, w * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Main director atop the bridge
  ctx.beginPath();
  ctx.arc(l * (bA + bF) * 0.5, 0, Math.min(2.4, w * 0.16), 0, Math.PI * 2);
  ctx.stroke();

  // Funnels: USN / Soviet upright ovals; IJN raked aft (forward one trunked and wider)
  for (const f of lay.funnels) {
    const rx = l * (f.trunked ? 0.05 : f.raked ? 0.042 : 0.034);
    const ry = w * (f.trunked ? 0.2 : 0.16);
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(l * f.x, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Smoke opening: offset aft on raked funnels
    ctx.fillStyle = '#0A0F14';
    ctx.beginPath();
    ctx.ellipse(l * f.x - (f.raked ? rx * 0.35 : 0), 0, rx * 0.55, ry * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torpedo mounts, stowed fore-and-aft on the centreline
  for (const t of lay.tubes) {
    const cx = l * t.x;
    const tubeLen = l * (lay.navy === 'ijn' ? 0.085 : 0.075);
    const spread = Math.min(w * 0.36, t.count * 1.1);
    ctx.save();
    ctx.translate(cx, 0);
    // Training base
    ctx.fillStyle = '#16293A';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, spread * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tubes
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < t.count; i++) {
      const y = -spread / 2 + (spread * i) / Math.max(1, t.count - 1);
      ctx.moveTo(-tubeLen * 0.45, y);
      ctx.lineTo(tubeLen * 0.55, y);
    }
    ctx.stroke();
    // IJN Type 92 launchers carry an enclosed splinter shield over the breech end
    if (lay.navy === 'ijn') {
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 0.8;
      ctx.fillRect(-tubeLen * 0.5, -spread * 0.6, tubeLen * 0.42, spread * 1.2);
      ctx.strokeRect(-tubeLen * 0.5, -spread * 0.6, tubeLen * 0.42, spread * 1.2);
    }
    ctx.restore();
  }

  // IJN reload lockers beside the forward funnel (Long Lance second salvo)
  if (lay.navy === 'ijn') {
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.6)';
    ctx.lineWidth = 0.8;
    const fx = l * lay.funnels[0].x;
    ctx.strokeRect(fx - l * 0.05, -w * 0.42, l * 0.1, w * 0.12);
    ctx.strokeRect(fx - l * 0.05, w * 0.3, l * 0.1, w * 0.12);
  }

  // Light AA: USN 20mm Oerlikon tubs on the bridge wings, IJN / Soviet 25mm tubs abreast the funnels
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const aaX = lay.navy === 'usn' ? l * (bA + 0.01) : l * (lay.funnels[lay.funnels.length - 1].x - 0.06);
  ctx.arc(aaX, -w * 0.38, 1.3, 0, Math.PI * 2);
  ctx.moveTo(aaX + 1.3, w * 0.38);
  ctx.arc(aaX, w * 0.38, 1.3, 0, Math.PI * 2);
  ctx.stroke();

  // Stern depth charge roller racks
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-l * 0.42, -w * 0.24);
  ctx.lineTo(-l * 0.49, -w * 0.24);
  ctx.moveTo(-l * 0.42, w * 0.24);
  ctx.lineTo(-l * 0.49, w * 0.24);
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
