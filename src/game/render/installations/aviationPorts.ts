import { Installation, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';
import { AIRFIELD_SCALE } from '../../airfieldLayout';

/**
 * Top-down artwork of airfields and harbour works:
 * - a permanent air base (paved runway, parallel taxiway, hangars, tower, revetments);
 * - an expedient strip the engineers lay down (PSP / Marston matting, dispersal loops, tents);
 * - a FARP (cleared pads, fuel bladders, ammunition racks);
 * - a former civilian airport (terminal, apron, airliner stands);
 * - a pontoon causeway pier, a deep-water port and a floating dry dock.
 * The harbour works are drawn along the installation's angle, which points out to sea.
 */

type Ctx = CanvasRenderingContext2D;

/** Drawing scale of the current airfield body (labels stay at their normal size). */
let BODY_SCALE = 1;

function label(ctx: Ctx, text: string, y: number, color: string): void {
  ctx.save();
  ctx.scale(1 / BODY_SCALE, 1 / BODY_SCALE);
  ctx.fillStyle = color;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, y * BODY_SCALE);
  ctx.restore();
}

function scaled(ctx: Ctx, k: number, draw: () => void): void {
  ctx.save();
  ctx.scale(k, k);
  BODY_SCALE = k;
  draw();
  BODY_SCALE = 1;
  ctx.restore();
}

/** A parked aircraft outline (cross shape) at map scale. */
function parkedPlane(ctx: Ctx, x: number, y: number, a: number, span: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(span * 0.5, 0);
  ctx.lineTo(-span * 0.45, 0);
  ctx.moveTo(span * 0.05, -span * 0.5);
  ctx.lineTo(span * 0.05, span * 0.5);
  ctx.moveTo(-span * 0.38, -span * 0.18);
  ctx.lineTo(-span * 0.38, span * 0.18);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}

/** U-shaped earth revetment open toward +y after rotation `a`. */
function revetment(ctx: Ctx, x: number, y: number, a: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = '#8D7B5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s, s);
  ctx.lineTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(s, s);
  ctx.stroke();
  ctx.restore();
}

function runwayMarkings(ctx: Ctx, len: number, wid: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  for (const tx of [-len / 2 + 3, len / 2 - 9]) for (let k = 0; k < 4; k++) ctx.fillRect(tx, -wid / 2 + 2 + k * (wid - 4) / 4, 6, 1.6);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.1;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(-len / 2 + 14, 0);
  ctx.lineTo(len / 2 - 14, 0);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ── Air bases ─────────────────────────────────────────────────────────────

export function drawAirfieldSite(rc: RenderContext, inst: Installation, style: InstallationStyle, island?: Island): void {
  const ctx = rc.ctx;
  if (inst.rotaryOnly) return scaled(ctx, AIRFIELD_SCALE.farp, () => drawFarp(rc, inst, style));
  if (inst.wasCivil) return scaled(ctx, AIRFIELD_SCALE.civil, () => drawCivilAirport(rc, inst, style));
  if (inst.id.startsWith('inst-built-')) return scaled(ctx, AIRFIELD_SCALE.expedient, () => drawExpedientStrip(rc, inst, style));
  scaled(ctx, AIRFIELD_SCALE.base, () => drawAirBase(rc, inst, style, island));
}

/** Permanent air base: paved runway, parallel taxiway, apron with hangars and tower, revetments. */
function drawAirBase(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  // WWII Pacific fields were crushed coral (pale), later ones asphalt
  const pale = rc.era === 'era1' || rc.era === 'era2';
  ctx.fillStyle = 'rgba(2, 8, 16, 0.35)';
  ctx.fillRect(-68, -13, 136, 30);
  ctx.fillStyle = pale ? '#B9B29A' : '#2E3438';
  ctx.fillRect(-66, -11, 132, 20);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-66, -11, 132, 20);
  runwayMarkings(ctx, 132, 20);
  // Parallel taxiway and links
  ctx.fillStyle = pale ? '#A79F86' : '#3B4246';
  ctx.fillRect(-56, 13, 112, 5);
  for (const x of [-52, 0, 48]) ctx.fillRect(x - 2, 9, 4, 4);
  // Apron, hangars, tower
  ctx.fillStyle = pale ? '#A79F86' : '#3B4246';
  ctx.fillRect(-20, 18, 44, 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  for (const hx of [-18, -4]) {
    if (pale) {
      // Quonset huts: corrugated half-cylinders
      ctx.fillStyle = '#78909C';
      ctx.beginPath();
      ctx.roundRect(hx, 31, 12, 7, 3.5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      for (let k = 1; k < 6; k++) {
        ctx.beginPath();
        ctx.moveTo(hx + k * 2, 31);
        ctx.lineTo(hx + k * 2, 38);
        ctx.stroke();
      }
    } else {
      // Steel hangars with sliding doors
      ctx.fillStyle = '#546E7A';
      ctx.fillRect(hx, 30, 12, 9);
      ctx.strokeRect(hx, 30, 12, 9);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(hx + k * 3, 30);
        ctx.lineTo(hx + k * 3, 39);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = color;
  }
  // From Korea on: a GCA / approach radar beside the runway
  if (!pale) {
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(30, 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(14, 31, 5, 5);
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(14.8, 31.8, 3.4, 1.4);
  // Dispersal: earth revetments, or (from the late 1970s) hardened aircraft shelters
  for (const x of [-50, -36, 36, 50]) {
    if (rc.era === 'era5') {
      ctx.fillStyle = '#78807A';
      ctx.beginPath();
      ctx.ellipse(x, -21, 6, 5, 0, Math.PI, 0);
      ctx.lineTo(x + 6, -16);
      ctx.lineTo(x - 6, -16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    } else {
      revetment(ctx, x, -20, 0, 5);
      parkedPlane(ctx, x, -18, -Math.PI / 2, 8, color);
    }
  }
  for (const x of [-12, 0, 12]) parkedPlane(ctx, x, 24, Math.PI / 2, 8, color);
  label(ctx, isPlayer ? '✈️ [友軍航空基地]' : '✈️ [敵軍航空基地]', -30, labelColor);
}

/** Expedient strip: pierced-steel-plank matting, dispersal loop with revetments, tents and fuel. */
function drawExpedientStrip(rc: RenderContext, _inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  // Graded strip with PSP (Marston) matting
  ctx.fillStyle = 'rgba(141, 110, 80, 0.55)';
  ctx.fillRect(-62, -13, 124, 26);
  // PSP (Marston) steel planking to Korea; AM-2 aluminium matting in Vietnam and after
  const am2 = rc.era === 'era4' || rc.era === 'era5';
  ctx.fillStyle = am2 ? '#9AA3A6' : '#6F7A70';
  ctx.fillRect(-56, -8, 112, 16);
  ctx.strokeStyle = 'rgba(30, 35, 30, 0.55)';
  ctx.lineWidth = 0.5;
  for (let x = -56; x <= 56; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.lineTo(x, 8);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(30, 35, 30, 0.35)';
  for (let x = -55; x < 56; x += 6) for (let y = -6; y < 8; y += 4) ctx.fillRect(x, y, 1, 1);
  // Threshold markers (white panels)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(-56, -8, 2, 16);
  ctx.fillRect(54, -8, 2, 16);
  // Dispersal loop and revetments
  ctx.strokeStyle = '#8D7B5A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 22, 34, 8, 0, Math.PI, 0, true);
  ctx.stroke();
  for (const x of [-26, -9, 9, 26]) {
    revetment(ctx, x, 28, Math.PI, 4);
    parkedPlane(ctx, x, 26, Math.PI / 2, 7, color);
  }
  // Tents and fuel drums
  ctx.fillStyle = '#6B7B45';
  for (const x of [-52, -44]) ctx.fillRect(x, 16, 6, 4);
  ctx.fillStyle = '#33691E';
  for (let k = 0; k < 8; k++) {
    ctx.beginPath();
    ctx.arc(44 + (k % 4) * 2.4, 18 + Math.floor(k / 4) * 2.4, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, am2 ? '🛬 [急造前進機場] AM-2 鋁板跑道' : '🛬 [急造前進機場] PSP 鋼板跑道', -18, labelColor);
}

/** FARP: three cleared landing pads, fuel bladders and ammunition racks, a few tents. */
function drawFarp(rc: RenderContext, _inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  ctx.fillStyle = 'rgba(141, 110, 80, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y] of [[-16, -6], [0, -9], [16, -6]] as const) {
    ctx.fillStyle = '#5D5348';
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 2.5);
    ctx.lineTo(x - 2, y + 2.5);
    ctx.moveTo(x + 2, y - 2.5);
    ctx.lineTo(x + 2, y + 2.5);
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + 2, y);
    ctx.stroke();
  }
  // Fuel bladders and hose lines to the pads
  ctx.fillStyle = '#263238';
  for (const x of [-10, 2]) {
    ctx.beginPath();
    ctx.ellipse(x, 9, 4.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 179, 0, 0.7)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-10, 9);
  ctx.lineTo(-16, -1);
  ctx.moveTo(2, 9);
  ctx.lineTo(0, -4);
  ctx.moveTo(2, 9);
  ctx.lineTo(16, -1);
  ctx.stroke();
  // Ammunition racks and tents
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(12, 6, 8, 2.4);
  ctx.fillRect(12, 9.5, 8, 2.4);
  ctx.fillStyle = '#6B7B45';
  ctx.fillRect(-26, 4, 6, 4);
  ctx.strokeStyle = color;
  ctx.strokeRect(-26, 4, 6, 4);
  label(ctx, '🚁 [FARP 前進加油彈藥點] 直升機專用', -22, labelColor);
}

/** A former civilian airport: concrete runway, terminal and apron with airliner stands. */
function drawCivilAirport(rc: RenderContext, inst: Installation, style: InstallationStyle): void {
  const ctx = rc.ctx;
  const { labelColor } = style;
  ctx.fillStyle = '#3A3F42';
  ctx.fillRect(-70, -10, 140, 18);
  runwayMarkings(ctx, 140, 18);
  ctx.fillStyle = '#4A5054';
  ctx.fillRect(-50, 12, 100, 5);
  ctx.fillRect(-30, 17, 60, 12);
  // Terminal building with a glazed front and the tower
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(-24, 29, 40, 9);
  ctx.fillStyle = 'rgba(129, 212, 250, 0.7)';
  ctx.fillRect(-23, 29, 38, 1.6);
  ctx.fillStyle = '#ECEFF1';
  ctx.fillRect(20, 28, 6, 6);
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(21, 29, 4, 1.4);
  for (const x of [-18, -2, 14]) parkedPlane(ctx, x, 22, -Math.PI / 2, 11, '#ECEFF1');
  const owner = inst.side === 'player' ? '我方控制' : inst.side === 'enemy' ? '敵方控制' : '中立';
  label(ctx, `🛫 [原民用機場] ${owner}`, -18, labelColor);
}

// ── Harbour works (drawn along the seaward angle) ─────────────────────────

/** Pontoon causeway pier: ranks of steel pontoon sections from the beach out to the berth. */
export function drawPontoonPierSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Causeway: two ranks of pontoon cells
  for (let x = -26; x < 30; x += 4.6) {
    for (const y of [-4.4, 0]) {
      ctx.fillStyle = '#607D8B';
      ctx.fillRect(x, y, 4.2, 4.2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 0.4;
      ctx.strokeRect(x, y, 4.2, 4.2);
    }
  }
  // Pier head (wider barge) with bollards and a crawler crane
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(28, -10, 12, 20);
  ctx.fillStyle = '#ECEFF1';
  for (const y of [-8, 8]) {
    ctx.beginPath();
    ctx.arc(39, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(44, -6);
  ctx.stroke();
  // A landing craft alongside
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.fillRect(30, 11, 11, 4.4);
  ctx.strokeRect(30, 11, 11, 4.4);
  ctx.restore();
  ctx.fillStyle = '#80D8FF';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓ [急造棧橋港] 浮箱棧道', 0, -20);
  if (inst.upgradeTimer && inst.upgradeTimer > 0) {
    const upProg = Math.min(1, inst.upgradeTimer / 35.0);
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`🔨 工兵拓建中: ${Math.round(inst.upgradeTimer)}s / 35s`, 0, 26);
    ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
    ctx.fillRect(-20, 29, 40, 3.5);
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(-20, 29, 40 * upProg, 3.5);
  }
}

/** Deep-water port: concrete quays and finger piers, warehouses, gantry cranes, a breakwater. */
export function drawMajorPortSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Quay apron along the shore
  ctx.fillStyle = '#8A8F91';
  ctx.fillRect(-30, -34, 22, 68);
  // Warehouses
  ctx.fillStyle = '#6D4C41';
  for (const y of [-30, -16, -2, 12]) {
    ctx.fillRect(-28, y, 12, 11);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-28, y, 12, 11);
  }
  // Two finger piers with a ship at one
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(-8, -24, 40, 7);
  ctx.fillRect(-8, 10, 40, 7);
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-4, -14);
  ctx.lineTo(28, -14);
  ctx.lineTo(34, -11);
  ctx.lineTo(28, -8);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cranes: derricks and travelling cranes before the container age, gantries after
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.4;
  const gantries = rc.era === 'era4' || rc.era === 'era5';
  for (const [x, y] of [[4, -24], [18, -24], [10, 10]] as const) {
    if (gantries) {
      ctx.strokeRect(x, y - 2, 5, 11);
      ctx.beginPath();
      ctx.moveTo(x + 2.5, y + 4);
      ctx.lineTo(x + 2.5, y + 14);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + 2.5, y + 3, 1.6, 0, Math.PI * 2);
      ctx.moveTo(x + 2.5, y + 3);
      ctx.lineTo(x + 9, y + 9);
      ctx.stroke();
    }
  }
  // Breakwater
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, -36);
  ctx.quadraticCurveTo(52, 0, 40, 36);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓【正規深水軍港】全島戰略樞紐', 0, -42);
}

/** Floating dry dock: U-shaped hull with wing walls and cranes, a ship on the blocks inside. */
export function drawRepairDockSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  ctx.save();
  // Dock floor and wing walls
  ctx.fillStyle = '#455A64';
  ctx.fillRect(-30, -12, 60, 24);
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(-30, -12, 60, 4);
  ctx.fillRect(-30, 8, 60, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-30, -12, 60, 24);
  // Keel blocks and the ship under repair
  ctx.fillStyle = '#8D6E63';
  for (let x = -22; x <= 20; x += 6) ctx.fillRect(x, -1, 2, 2);
  ctx.fillStyle = 'rgba(20, 30, 40, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.lineTo(18, -4);
  ctx.lineTo(25, 0);
  ctx.lineTo(18, 4);
  ctx.lineTo(-24, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wing-wall cranes and the open stern gate
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1.2;
  for (const [x, y, d] of [[-14, -10, -1], [10, 10, 1]] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y + 6 * d);
    ctx.stroke();
  }
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(28, -8, 2, 16);
  // Welding sparks
  if (Math.sin(rc.time * 9) > 0.3) {
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(-6, -4, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🔧 [浮動乾塢] 艦艇維修', 0, -22);
}

/** A (former) civilian railway station: platforms along the line, the station building, sidings with wagons. */
export function drawRailStationSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { labelColor } = style;
  ctx.save();
  // Tracks: main line and two sidings
  ctx.strokeStyle = 'rgba(30, 30, 34, 0.9)';
  ctx.lineWidth = 1.2;
  for (const y of [18, 10, 2]) {
    ctx.beginPath();
    ctx.moveTo(-36, y);
    ctx.lineTo(36, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([0.8, 3]);
  for (const y of [18, 10, 2]) {
    ctx.beginPath();
    ctx.moveTo(-36, y);
    ctx.lineTo(36, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Platforms and the station building
  ctx.fillStyle = '#9E9E9E';
  ctx.fillRect(-28, 12.5, 56, 3);
  ctx.fillRect(-28, 4.5, 56, 3);
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-16, -12, 32, 12);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-16, -12, 32, 3);
  ctx.fillStyle = 'rgba(255, 224, 130, 0.6)';
  for (let x = -13; x < 14; x += 5) ctx.fillRect(x, -6, 2.4, 2.4);
  // Goods wagons on the siding
  ctx.fillStyle = '#5D4037';
  for (const x of [-30, -20, -10]) ctx.fillRect(x, 0.4, 8, 3.2);
  ctx.restore();
  const owner = inst.side === 'player' ? '我方控制' : inst.side === 'enemy' ? '敵方控制' : '中立';
  label(ctx, `🚉 [${inst.name.split(' (')[0]}] ${owner}`, -22, labelColor);
}
