import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawShipTurrets } from './mounts';

/**
 * Project 1164 Slava: a long cruiser hull whose forecastle is lined on both sides by eight
 * inclined twin P-500 Bazalt launchers, with a tall pyramid superstructure amidships, the twin
 * funnel uptakes, and the S-300F revolver launchers sunk into the after deck.
 */
export function drawSlavaCG(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  ctx.fillStyle = '#1E1217';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(l * 0.52, 0);
  ctx.quadraticCurveTo(l * 0.4, -w * 0.46, l * 0.2, -w * 0.48);
  ctx.lineTo(-l * 0.46, -w * 0.44);
  ctx.lineTo(-l * 0.5, 0);
  ctx.lineTo(-l * 0.46, w * 0.44);
  ctx.lineTo(l * 0.2, w * 0.48);
  ctx.quadraticCurveTo(l * 0.4, w * 0.46, l * 0.52, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eight twin Bazalt tubes each side, angled up and outboard, from the bridge to the bow gun
  ctx.fillStyle = '#4A3A40';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 0.9;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = l * 0.06 + i * l * 0.065;
      ctx.save();
      ctx.translate(x, side * w * 0.3);
      ctx.rotate(side * 0.12);
      ctx.fillRect(-l * 0.03, -w * 0.07, l * 0.06, w * 0.14);
      ctx.strokeRect(-l * 0.03, -w * 0.07, l * 0.06, w * 0.14);
      ctx.restore();
    }
  }

  // Pyramid superstructure with the Top Pair radar and the twin funnel uptakes behind
  ctx.fillStyle = '#2A1820';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.3;
  ctx.fillRect(-l * 0.12, -w * 0.26, l * 0.16, w * 0.52);
  ctx.strokeRect(-l * 0.12, -w * 0.26, l * 0.16, w * 0.52);
  ctx.fillStyle = '#3A2830';
  ctx.fillRect(-l * 0.2, -w * 0.18, l * 0.06, w * 0.14);
  ctx.fillRect(-l * 0.2, w * 0.04, l * 0.06, w * 0.14);
  const rot = rc.time * 1.8;
  ctx.strokeStyle = '#80DEEA';
  ctx.beginPath();
  ctx.moveTo(-l * 0.04 - Math.cos(rot) * 6, -Math.sin(rot) * 6);
  ctx.lineTo(-l * 0.04 + Math.cos(rot) * 6, Math.sin(rot) * 6);
  ctx.stroke();

  // S-300F revolver hatches on the after deck
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(-l * 0.26 - (i % 2) * l * 0.05, side * w * (0.12 + Math.floor(i / 2) * 0.13), 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  drawShipTurrets(rc, ship, hullColor);
}

/**
 * Tarawa-class LHA: a full-length flight deck with nine helicopter spots and the Harrier take-off
 * line, the long starboard island, the side elevator to port and the stern elevator over the
 * well deck.
 */
export function drawTarawaLHA(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  ctx.fillStyle = '#061322';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(l * 0.5, -w * 0.3);
  ctx.lineTo(l * 0.5, w * 0.3);
  ctx.lineTo(l * 0.42, w * 0.42);
  ctx.lineTo(-l * 0.5, w * 0.42);
  ctx.lineTo(-l * 0.5, -w * 0.42);
  ctx.lineTo(l * 0.42, -w * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(30, 44, 60, 0.6)';
  ctx.fill();

  // Deck markings: centreline for STOVL take-off runs and helicopter spots down the port side
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(-l * 0.46, 0);
  ctx.lineTo(l * 0.46, 0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#FFE082';
  for (let s = 0; s < 6; s++) {
    const x = -l * 0.42 + s * l * 0.15;
    ctx.beginPath();
    ctx.arc(x, -w * 0.2, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Long starboard island with two funnels and the SPS-52 radar
  ctx.fillStyle = '#0F273D';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-l * 0.06, w * 0.26, l * 0.3, w * 0.16);
  ctx.strokeRect(-l * 0.06, w * 0.26, l * 0.3, w * 0.16);
  ctx.fillStyle = '#1B3550';
  ctx.fillRect(l * 0.02, w * 0.29, l * 0.04, w * 0.1);
  ctx.fillRect(l * 0.12, w * 0.29, l * 0.04, w * 0.1);

  // Port side elevator and stern elevator
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(-l * 0.1, -w * 0.5, l * 0.12, w * 0.08);
  ctx.strokeRect(-l * 0.5, -w * 0.14, l * 0.06, w * 0.28);
  drawShipTurrets(rc, ship, hullColor);
}

/**
 * PBR Mk II: a 31-foot fibreglass hull on water-jets, the twin .50 calibre gun tub on the bow,
 * a low canopy over the coxswain flat and the single .50 aft, sandbags along the gunwales.
 */
export function drawPBR(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  ctx.fillStyle = '#26331F';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.quadraticCurveTo(l * 0.3, -w * 0.5, 0, -w * 0.5);
  ctx.lineTo(-l * 0.5, -w * 0.44);
  ctx.lineTo(-l * 0.5, w * 0.44);
  ctx.lineTo(0, w * 0.5);
  ctx.quadraticCurveTo(l * 0.3, w * 0.5, l * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Canopy over the coxswain flat
  ctx.fillStyle = '#3B4A30';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  ctx.fillRect(-l * 0.12, -w * 0.32, l * 0.26, w * 0.64);
  ctx.strokeRect(-l * 0.12, -w * 0.32, l * 0.26, w * 0.64);
  // Sandbag line along the gunwales
  ctx.strokeStyle = '#A1887F';
  ctx.setLineDash([2, 1.5]);
  ctx.beginPath();
  ctx.moveTo(l * 0.3, -w * 0.4);
  ctx.lineTo(-l * 0.45, -w * 0.4);
  ctx.moveTo(l * 0.3, w * 0.4);
  ctx.lineTo(-l * 0.45, w * 0.4);
  ctx.stroke();
  ctx.setLineDash([]);
  // Water-jet wake boils at the transom
  ctx.fillStyle = 'rgba(224, 247, 250, 0.5)';
  for (const y of [-w * 0.2, w * 0.2]) {
    ctx.beginPath();
    ctx.arc(-l * 0.52, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  drawShipTurrets(rc, ship, hullColor);
}

/**
 * Enemy river craft. Era 5: Project 1204 Shmel river gunboat, a narrow armoured hull with a
 * PT-76 tank turret (76 mm D-56T) forward, the low wheelhouse and the twin 25 mm aft. Earlier
 * eras: an armed motor junk, a beamy wooden hull with a square stern, deckhouse amidships, a
 * mast with a battened sail furled along the boom and a machine gun in the bow.
 */
export function drawRiverGunboat(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  if (ship.era === 'era5') {
    ctx.fillStyle = '#3A4436';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.32, -w * 0.5);
    ctx.lineTo(-l * 0.5, -w * 0.46);
    ctx.lineTo(-l * 0.5, w * 0.46);
    ctx.lineTo(l * 0.32, w * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // PT-76 turret forward
    ctx.fillStyle = '#4E5B48';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(l * 0.22, 0, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(l * 0.22, 0);
    ctx.lineTo(l * 0.6, 0);
    ctx.stroke();
    // Armoured wheelhouse and the aft twin 25 mm
    ctx.fillStyle = '#2E3A2B';
    ctx.fillRect(-l * 0.12, -w * 0.32, l * 0.18, w * 0.64);
    ctx.strokeRect(-l * 0.12, -w * 0.32, l * 0.18, w * 0.64);
    ctx.beginPath();
    ctx.arc(-l * 0.32, 0, w * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  // Armed motor junk
  ctx.fillStyle = '#5D4630';
  ctx.strokeStyle = hullColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(l * 0.5, 0);
  ctx.quadraticCurveTo(l * 0.38, -w * 0.55, 0, -w * 0.52);
  ctx.lineTo(-l * 0.5, -w * 0.42);
  ctx.lineTo(-l * 0.5, w * 0.42);
  ctx.lineTo(0, w * 0.52);
  ctx.quadraticCurveTo(l * 0.38, w * 0.55, l * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Planking
  ctx.strokeStyle = 'rgba(30, 20, 10, 0.6)';
  ctx.lineWidth = 0.6;
  for (const y of [-w * 0.22, 0, w * 0.22]) {
    ctx.beginPath();
    ctx.moveTo(l * 0.4, y * 0.6);
    ctx.lineTo(-l * 0.48, y);
    ctx.stroke();
  }
  // Deckhouse with a matting roof
  ctx.fillStyle = '#8D6E4A';
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  ctx.fillRect(-l * 0.28, -w * 0.3, l * 0.3, w * 0.6);
  ctx.strokeRect(-l * 0.28, -w * 0.3, l * 0.3, w * 0.6);
  // Mast and furled battened sail along the boom
  ctx.fillStyle = '#C8B48A';
  ctx.beginPath();
  ctx.ellipse(l * 0.08, w * 0.05, l * 0.2, w * 0.1, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3E2A18';
  ctx.beginPath();
  ctx.arc(l * 0.2, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Bow machine gun
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(l * 0.36, 0);
  ctx.lineTo(l * 0.55, 0);
  ctx.stroke();
}
