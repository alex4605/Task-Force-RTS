import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './mounts';

/**
 * Small combatants drawn from their plan (Ship.craft): an Elco PT boat's planing hull with four
 * torpedo tubes, a minesweeper's sweep gear, the Asheville gunboat, the Pegasus hydrofoil with its
 * Harpoon canisters, a wooden Shinyo, a Schnellboot. Guns come from the ship's mounts.
 */
export function drawSmallCraft(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string): void {
  const plan = ship.craft!;
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const bow = plan.hull === 'displacement' ? 0.36 : 0.3;

  // Hydrofoil: the foils show beneath the hull at speed
  if (plan.hull === 'hydrofoil') {
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(l * 0.36, -w * 0.9);
    ctx.lineTo(l * 0.36, w * 0.9);
    ctx.moveTo(-l * 0.3, -w * 0.75);
    ctx.lineTo(-l * 0.3, w * 0.75);
    ctx.stroke();
  }

  ctx.fillStyle = plan.deck ?? (plan.hull === 'wooden' ? '#3E2C1C' : '#14202A');
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.quadraticCurveTo(l * (0.5 - bow * 0.4), -w * 0.5, l * (0.5 - bow), -w * 0.5);
  ctx.lineTo(-l * 0.47, -w * 0.46);
  ctx.lineTo(-l * 0.5, -w * 0.3);
  ctx.lineTo(-l * 0.5, w * 0.3);
  ctx.lineTo(-l * 0.47, w * 0.46);
  ctx.lineTo(l * (0.5 - bow), w * 0.5);
  ctx.quadraticCurveTo(l * (0.5 - bow * 0.4), w * 0.5, l * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Planking or deck seams
  ctx.strokeStyle = plan.hull === 'wooden' ? 'rgba(161, 136, 127, 0.45)' : 'rgba(176, 190, 197, 0.18)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const k of [-0.22, 0, 0.22]) {
    ctx.moveTo(l * 0.38, w * k);
    ctx.lineTo(-l * 0.46, w * k);
  }
  ctx.stroke();

  // Torpedo tubes along the sides (PT boats, S-boats carry them forward, angled out)
  const tubes = plan.tubes ?? 0;
  for (let k = 0; k < tubes; k++) {
    const side = k % 2 === 0 ? -1 : 1;
    const row = Math.floor(k / 2);
    ctx.save();
    ctx.translate(l * (0.12 - row * 0.3), side * w * 0.34);
    ctx.rotate(side * 0.05);
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 0.9;
    ctx.fillRect(-l * 0.13, -w * 0.08, l * 0.26, w * 0.16);
    ctx.strokeRect(-l * 0.13, -w * 0.08, l * 0.26, w * 0.16);
    ctx.restore();
  }

  // Missile canisters aft (Harpoon on the Pegasus, Exocet on the S-boat)
  const can = plan.canisters ?? 0;
  for (let k = 0; k < can; k++) {
    const side = k % 2 === 0 ? -1 : 1;
    const row = Math.floor(k / 2);
    ctx.fillStyle = '#455A64';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 0.9;
    ctx.fillRect(-l * (0.36 - row * 0.09), side * w * 0.22 - w * 0.07, l * 0.16, w * 0.14);
    ctx.strokeRect(-l * (0.36 - row * 0.09), side * w * 0.22 - w * 0.07, l * 0.16, w * 0.14);
  }

  // Stern fittings: depth-charge racks or a minesweeper's sweep gear
  if (plan.stern === 'racks') {
    ctx.fillStyle = '#263238';
    for (const side of [-1, 1]) ctx.fillRect(-l * 0.48, side * w * 0.2 - w * 0.06, l * 0.1, w * 0.12);
  } else if (plan.stern === 'sweep') {
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-l * 0.4, 0, w * 0.2, 0, Math.PI * 2);
    ctx.moveTo(-l * 0.5, -w * 0.35);
    ctx.lineTo(-l * 0.7, -w * 0.9);
    ctx.moveTo(-l * 0.5, w * 0.35);
    ctx.lineTo(-l * 0.7, w * 0.9);
    ctx.stroke();
  }

  // Deckhouse and mast
  const [hx, hl] = plan.house;
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.1;
  ctx.fillRect(l * (hx - hl / 2), -w * 0.26, l * hl, w * 0.52);
  ctx.strokeRect(l * (hx - hl / 2), -w * 0.26, l * hl, w * 0.52);
  ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
  ctx.fillRect(l * (hx + hl / 2) - 1.4, -w * 0.18, 1.2, w * 0.36);
  ctx.fillStyle = detailColor;
  ctx.beginPath();
  ctx.arc(l * hx, 0, 1.3, 0, Math.PI * 2);
  ctx.fill();

  drawShipTurrets(rc, ship, hullColor);
}
