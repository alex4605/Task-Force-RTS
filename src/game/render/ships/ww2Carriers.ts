import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './mounts';
import { drawHullShape } from './hullShape';

/**
 * WWII / Korea-era straight-deck carriers in plan view. The hull is drawn first and the flight
 * deck over it, so the open forecastle shows ahead of the deck on the US and Shokaku designs
 * while Taiho's enclosed hurricane bow runs the deck to the stem.
 */
interface CarrierPlan {
  navy: 'usn' | 'ijn';
  /** Flight deck forward / aft ends (fractions of length) and half-width (fraction of beam). */
  deckFwd: number;
  deckAft: number;
  deckHalf: number;
  /** Deck narrows toward its ends (IJN). */
  taper?: number;
  hurricaneBow?: boolean;
  hullHalf: number;
  /** Island span along the starboard deck edge. */
  island: [number, number];
  islandDepth: number;
  /** Centreline elevators: centre x and length (fractions of length). */
  elevators: { x: number; len: number }[];
  /** Deck-edge elevators: centre x and side (-1 port, +1 starboard). */
  edgeElevators?: { x: number; side: -1 | 1 }[];
  catapults: number;
  steamCats?: boolean;
  funnel: 'island' | 'shokaku' | 'taiho';
  /** Deck marking: hull number or katakana. */
  mark?: string;
}

function carrierPlan(ship: Ship): CarrierPlan {
  const n = ship.name;
  const hull = n.match(/CVE?A?-(\d+)/)?.[1];
  if (/Taiho/.test(n)) {
    return { navy: 'ijn', deckFwd: 0.5, deckAft: -0.48, deckHalf: 0.44, taper: 0.06, hurricaneBow: true, hullHalf: 0.4, island: [-0.06, 0.06], islandDepth: 0.2, elevators: [{ x: 0.3, len: 0.07 }, { x: -0.3, len: 0.07 }], catapults: 0, funnel: 'taiho', mark: 'タ' };
  }
  if (/Shokaku|Zuikaku/.test(n)) {
    return { navy: 'ijn', deckFwd: 0.36, deckAft: -0.45, deckHalf: 0.46, taper: 0.1, hullHalf: 0.4, island: [0.12, 0.2], islandDepth: 0.16, elevators: [{ x: 0.24, len: 0.06 }, { x: 0.02, len: 0.06 }, { x: -0.22, len: 0.06 }], catapults: 0, funnel: 'shokaku', mark: /Zuikaku/.test(n) ? 'ス' : 'シ' };
  }
  if (/Oriskany|SCB-27/.test(n)) {
    return { navy: 'usn', deckFwd: 0.45, deckAft: -0.48, deckHalf: 0.42, hullHalf: 0.3, island: [-0.04, 0.18], islandDepth: 0.2, elevators: [{ x: 0.3, len: 0.08 }, { x: -0.3, len: 0.07 }], edgeElevators: [{ x: 0.02, side: -1 }, { x: -0.13, side: 1 }], catapults: 2, steamCats: true, funnel: 'island', mark: hull };
  }
  if (/Essex|Intrepid|CV-9|CV-1\d/.test(n)) {
    return { navy: 'usn', deckFwd: 0.43, deckAft: -0.48, deckHalf: 0.42, hullHalf: 0.3, island: [0.07, 0.23], islandDepth: 0.16, elevators: [{ x: 0.395, len: 0.06 }, { x: -0.25, len: 0.08 }], edgeElevators: [{ x: 0.1, side: -1 }], catapults: 2, funnel: 'island', mark: hull };
  }
  // Yorktown class (Enterprise CV-6): three centreline elevators, island amidships
  return { navy: 'usn', deckFwd: 0.43, deckAft: -0.48, deckHalf: 0.42, hullHalf: 0.32, island: [0.02, 0.16], islandDepth: 0.16, elevators: [{ x: 0.28, len: 0.07 }, { x: 0.02, len: 0.07 }, { x: -0.25, len: 0.07 }], catapults: 1, funnel: 'island', mark: hull };
}

function traceDeck(ctx: CanvasRenderingContext2D, l: number, w: number, p: CarrierPlan) {
  const xf = l * p.deckFwd;
  const xa = l * p.deckAft;
  const hw = w * p.deckHalf;
  const tp = w * (p.taper ?? 0);
  ctx.beginPath();
  if (p.hurricaneBow) {
    // Deck follows the plated-in bow to the stem
    ctx.moveTo(xf, 0);
    ctx.bezierCurveTo(xf - l * 0.06, -hw * 0.5, xf - l * 0.12, -hw, xf - l * 0.2, -hw);
  } else {
    // Squared forward deck edge with rounded corners
    ctx.moveTo(xf, -(hw - tp - w * 0.06));
    ctx.quadraticCurveTo(xf, -(hw - tp), xf - l * 0.03, -(hw - tp));
    ctx.lineTo(xf - l * 0.16, -hw);
  }
  ctx.lineTo(xa + l * 0.1, -hw);
  // Aft round-down
  ctx.quadraticCurveTo(xa, -hw + tp * 0.5, xa, -(hw - tp) * 0.55);
  ctx.lineTo(xa, (hw - tp) * 0.55);
  ctx.quadraticCurveTo(xa, hw - tp * 0.5, xa + l * 0.1, hw);
  if (p.hurricaneBow) {
    ctx.lineTo(xf - l * 0.2, hw);
    ctx.bezierCurveTo(xf - l * 0.12, hw, xf - l * 0.06, hw * 0.5, xf, 0);
  } else {
    ctx.lineTo(xf - l * 0.16, hw);
    ctx.lineTo(xf - l * 0.03, hw - tp);
    ctx.quadraticCurveTo(xf, hw - tp, xf, hw - tp - w * 0.06);
  }
  ctx.closePath();
}

export function drawCarrier(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const p = carrierPlan(ship);
  const hw = w * p.deckHalf;

  // Hull below the flight deck: visible as the forecastle ahead of it and the stern under the round-down
  drawHullShape(ctx, l, w * p.hullHalf * 2, { entry: 0.3, run: 0.18, transom: 0.35, fullness: 0.4 }, '#06121E', hullColor, 1.6);
  if (!p.hurricaneBow) {
    // Forecastle deck fittings: anchor windlasses and the bow 40mm tub
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(l * (p.deckFwd + 0.035), -w * 0.06, 1.2, 0, Math.PI * 2);
    ctx.moveTo(l * (p.deckFwd + 0.035) + 1.2, w * 0.06);
    ctx.arc(l * (p.deckFwd + 0.035), w * 0.06, 1.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Edge elevators sit outboard of the deck edge
  for (const e of p.edgeElevators ?? []) {
    ctx.fillStyle = '#0B1B2B';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    const ex = l * e.x;
    const y0 = e.side * hw;
    ctx.beginPath();
    ctx.rect(ex - l * 0.035, e.side < 0 ? y0 - w * 0.13 : y0, l * 0.07, w * 0.13);
    ctx.fill();
    ctx.stroke();
  }

  // Flight deck
  traceDeck(ctx, l, w, p);
  ctx.fillStyle = '#0B1B2B';
  ctx.fill();
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Planking (fore-and-aft) clipped to the deck
  ctx.save();
  traceDeck(ctx, l, w, p);
  ctx.clip();
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.1)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let y = -hw; y <= hw; y += Math.max(1.6, w * 0.06)) {
    ctx.moveTo(l * p.deckAft, y);
    ctx.lineTo(l * p.deckFwd, y);
  }
  ctx.stroke();
  ctx.restore();

  // Centreline and landing-area edge stripes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(l * (p.deckAft + 0.03), 0);
  ctx.lineTo(l * (p.deckFwd - 0.03), 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Elevators
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  for (const e of p.elevators) {
    const x0 = l * (e.x - e.len / 2);
    ctx.strokeRect(x0, -hw * 0.45, l * e.len, hw * 0.9);
    ctx.beginPath();
    ctx.moveTo(x0, -hw * 0.45);
    ctx.lineTo(x0 + l * e.len, hw * 0.45);
    ctx.moveTo(x0 + l * e.len, -hw * 0.45);
    ctx.lineTo(x0, hw * 0.45);
    ctx.stroke();
  }

  // Arresting wires across the after landing area
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.45)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const x = l * (p.deckAft + 0.1 + i * 0.035);
    ctx.moveTo(x, -hw * 0.75);
    ctx.lineTo(x, hw * 0.75);
  }
  ctx.stroke();

  // Bow catapults (hydraulic H-4 on Essex / Yorktown, steam C-11 after SCB-27A)
  if (p.catapults) {
    ctx.strokeStyle = p.steamCats ? '#FFE082' : 'rgba(255, 224, 130, 0.7)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    const ys = p.catapults === 1 ? [-hw * 0.3] : [-hw * 0.32, hw * 0.32];
    for (const y of ys) {
      ctx.moveTo(l * (p.deckFwd - 0.22), y);
      ctx.lineTo(l * (p.deckFwd - 0.02), y);
    }
    ctx.stroke();
  }

  // Deck-edge gun tubs / catwalk sponsons (Bofors and Oerlikon positions)
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const f of [0.36, 0.2, -0.3, -0.42]) {
    for (const s of [-1, 1]) {
      const x = l * f;
      if (s === 1 && x > l * p.island[0] - 4 && x < l * p.island[1] + 4) continue;
      const y = s * (hw + 1.2);
      ctx.moveTo(x + 2.2, y);
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    }
  }
  ctx.stroke();

  // Island on the starboard deck edge (+y), overhanging the hull side
  const [i0, i1] = p.island;
  const iy0 = hw - w * p.islandDepth * 0.55;
  const iy1 = hw + w * p.islandDepth * 0.45;
  ctx.fillStyle = '#132638';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(l * i0, iy1);
  ctx.lineTo(l * i0, iy0 + 1.5);
  ctx.quadraticCurveTo(l * i0, iy0, l * i0 + 2, iy0);
  ctx.lineTo(l * i1 - 3, iy0);
  ctx.quadraticCurveTo(l * i1, iy0, l * i1, iy0 + 3);
  ctx.lineTo(l * i1, iy1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Bridge levels and mast
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 0.9;
  ctx.strokeRect(l * (i0 + (i1 - i0) * 0.55), iy0 + 1.2, l * (i1 - i0) * 0.38, iy1 - iy0 - 2.4);
  ctx.beginPath();
  ctx.arc(l * (i0 + (i1 - i0) * 0.62), (iy0 + iy1) / 2, Math.max(1.2, w * 0.03), 0, Math.PI * 2);
  ctx.stroke();

  // Funnels
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.2;
  if (p.funnel === 'island') {
    // Funnel trunked into the after part of the island
    ctx.beginPath();
    ctx.ellipse(l * (i0 + (i1 - i0) * 0.22), (iy0 + iy1) / 2, l * (i1 - i0) * 0.17, (iy1 - iy0) * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (p.funnel === 'shokaku') {
    // Two downward-curving funnels projecting from the starboard side abaft the island
    for (const fx of [0.02, -0.05]) {
      ctx.beginPath();
      ctx.moveTo(l * fx - 2, hw);
      ctx.quadraticCurveTo(l * fx - 2, hw + w * 0.16, l * fx + 2.5, hw + w * 0.14);
      ctx.lineTo(l * fx + 2.5, hw);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // Taiho: large funnel canted 26° outboard from the island
    ctx.beginPath();
    ctx.ellipse(l * (i0 + (i1 - i0) * 0.4), iy1 + w * 0.04, l * 0.025, w * 0.07, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Parked aircraft on the deck park (folded-wing silhouettes), up to four
  const ready = ship.carrierPlanes ? Object.values(ship.carrierPlanes.ready).reduce((a, n) => a + n, 0) : 0;
  const parked = Math.min(6, Math.ceil(ready / 2.5));
  ctx.fillStyle = p.navy === 'usn' ? 'rgba(144, 202, 249, 0.85)' : 'rgba(165, 214, 167, 0.85)';
  for (let i = 0; i < parked; i++) {
    const px = l * (p.deckAft + 0.06) + (i >> 1) * l * 0.045;
    const py = (i % 2 === 0 ? -1 : 1) * hw * 0.42;
    ctx.beginPath();
    ctx.moveTo(px + 3.4, py);
    ctx.lineTo(px - 0.5, py - 2.6);
    ctx.lineTo(px - 2.2, py - 2.6);
    ctx.lineTo(px - 1.2, py);
    ctx.lineTo(px - 2.2, py + 2.6);
    ctx.lineTo(px - 0.5, py + 2.6);
    ctx.closePath();
    ctx.fill();
  }

  // Deck identification: USN hull number forward, IJN Hinomaru forward and katakana aft
  if (p.navy === 'ijn') {
    const hx = l * (p.deckFwd - (p.hurricaneBow ? 0.16 : 0.08));
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(hx, 0, hw * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.arc(hx, 0, hw * 0.3, 0, Math.PI * 2);
    ctx.fill();
    if (p.mark) {
      ctx.save();
      ctx.translate(l * (p.deckAft + 0.06), 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = `bold ${Math.max(7, hw * 0.8).toFixed(0)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.mark, 0, 3);
      ctx.restore();
    }
  } else if (p.mark) {
    ctx.save();
    ctx.translate(l * (p.deckFwd - 0.08), 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `bold ${Math.max(7, hw * 0.75).toFixed(0)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(p.mark, 0, 3);
    ctx.restore();
  }

  drawShipTurrets(rc, ship, hullColor);
}

/** Casablanca-class escort carrier: short flight deck on a merchant-type hull, small starboard island. */
export function drawCVE(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const hw = w * 0.42;
  drawHullShape(ctx, l, w * 0.62, { entry: 0.26, run: 0.16, transom: 0.4, fullness: 0.5 }, '#06121E', hullColor, 1.5);

  const xf = l * 0.4;
  const xa = -l * 0.47;
  ctx.fillStyle = '#0B1B2B';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(xf, -hw + 2);
  ctx.lineTo(xf - 2, -hw);
  ctx.lineTo(xa + 3, -hw);
  ctx.quadraticCurveTo(xa, -hw, xa, -hw + 3);
  ctx.lineTo(xa, hw - 3);
  ctx.quadraticCurveTo(xa, hw, xa + 3, hw);
  ctx.lineTo(xf - 2, hw);
  ctx.lineTo(xf, hw - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xa + 4, 0);
  ctx.lineTo(xf - 4, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Two centreline elevators, single H-2 catapult on the port side forward
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(l * 0.22, -hw * 0.45, l * 0.09, hw * 0.9);
  ctx.strokeRect(-l * 0.36, -hw * 0.45, l * 0.09, hw * 0.9);
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.7)';
  ctx.beginPath();
  ctx.moveTo(l * 0.16, -hw * 0.35);
  ctx.lineTo(xf - 2, -hw * 0.35);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(207, 216, 220, 0.45)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = l * (-0.24 + i * 0.04);
    ctx.moveTo(x, -hw * 0.75);
    ctx.lineTo(x, hw * 0.75);
  }
  ctx.stroke();

  // Small island forward on the starboard edge
  ctx.fillStyle = '#132638';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(l * 0.14, hw - 1, l * 0.08, w * 0.12);
  ctx.strokeRect(l * 0.14, hw - 1, l * 0.08, w * 0.12);
  // Twin uptakes either side aft (Casablanca's boiler exhausts)
  ctx.fillStyle = '#263238';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-l * 0.18, s * (hw + 1.5), 2.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Gun tubs on the deck-edge catwalks
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const f of [0.32, -0.05, -0.32]) {
    for (const s of [-1, 1]) {
      const y = s * (hw + 1.2);
      ctx.moveTo(l * f + 2, y);
      ctx.arc(l * f, y, 2, 0, Math.PI * 2);
    }
  }
  ctx.stroke();

  const hull = ship.name.match(/CVE-(\d+)/)?.[1];
  if (hull) {
    ctx.save();
    ctx.translate(l * 0.33, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `bold ${Math.max(7, hw * 0.7).toFixed(0)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(hull, 0, 3);
    ctx.restore();
  }

  drawShipTurrets(rc, ship, hullColor);
}
