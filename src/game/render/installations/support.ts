import { Installation, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';

/**
 * Top-down artwork of the rear-area and headquarters sites: command posts, the field hospital,
 * supply and ammunition dumps and the motor pool. Drawn at map scale (about one unit per metre
 * at this size), with the side's colour on vehicles, flags and trim.
 */

type Ctx = CanvasRenderingContext2D;

const SAND = '#A1887F';
const OLIVE_DARK = '#3E4D24';
const CANVAS = '#6B7B45';

/** Sandbag berm along a rounded rectangle. */
function berm(ctx: Ctx, x: number, y: number, w: number, h: number, r = 4): void {
  ctx.save();
  ctx.strokeStyle = SAND;
  ctx.lineWidth = 2.6;
  ctx.setLineDash([2.4, 1.1]);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/** A ridge tent (GP medium / large): canvas body with the ridge line. */
function tent(ctx: Ctx, x: number, y: number, w: number, h: number, fill = CANVAS): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();
}

/** A truck or jeep seen from above, nose along +x after `a`. */
function vehicle(ctx: Ctx, x: number, y: number, a: number, len: number, wid: number, color: string, cab = true): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = OLIVE_DARK;
  ctx.fillRect(-len / 2, -wid / 2, len, wid);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-len / 2, -wid / 2, len, wid);
  if (cab) {
    ctx.fillStyle = '#2E3A1E';
    ctx.fillRect(len / 2 - len * 0.3, -wid / 2 + 0.4, len * 0.3 - 0.4, wid - 0.8);
  }
  ctx.restore();
}

/** A tracked vehicle (tank / APC) from above, hull along +x. */
function tracked(ctx: Ctx, x: number, y: number, a: number, color: string, turret: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = '#1C2416';
  ctx.fillRect(-4, -2.8, 8, 1.1);
  ctx.fillRect(-4, 1.7, 8, 1.1);
  ctx.fillStyle = OLIVE_DARK;
  ctx.fillRect(-3.8, -1.9, 7.6, 3.8);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-3.8, -1.9, 7.6, 3.8);
  if (turret) {
    ctx.fillStyle = '#4A5A30';
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(1.2, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/** Radio mast with guy wires. */
function mast(ctx: Ctx, x: number, y: number, h: number): void {
  ctx.strokeStyle = '#CFD8DC';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h);
  ctx.moveTo(x, y - h);
  ctx.lineTo(x - h * 0.35, y - h * 0.4);
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + h * 0.35, y - h * 0.4);
  ctx.stroke();
  ctx.fillStyle = '#ECEFF1';
  ctx.beginPath();
  ctx.arc(x, y - h, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

/** Camouflage net: a mottled translucent patch over what is under it. */
function camoNet(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(62, 77, 36, 0.55)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 40, 18, 0.5)';
  for (let k = 0; k < 7; k++) {
    const px = x + ((k * 37) % 100) / 100 * w;
    const py = y + ((k * 61) % 100) / 100 * h;
    ctx.beginPath();
    ctx.ellipse(px, py, 2.6, 1.6, k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function flag(ctx: Ctx, x: number, y: number, color: string): void {
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 9);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 9, 5, 3.4);
}

function label(ctx: Ctx, text: string, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, y);
}

/** Red cross on a white square (hospital roofs and the helipad). */
function redCross(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(x - s * 0.25, y - s * 0.8, s * 0.5, s * 1.6);
  ctx.fillRect(x - s * 0.8, y - s * 0.25, s * 1.6, s * 0.5);
}

// ════ Headquarters: a dug-in bunker complex with an antenna farm, generators and staff cars ════
export function drawCommandPostSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  berm(ctx, -20, -14, 40, 28, 6);
  // Concrete / log-and-earth command bunker with two entrances
  ctx.fillStyle = '#4E5A48';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.fillRect(-10, -7, 20, 14);
  ctx.strokeRect(-10, -7, 20, 14);
  ctx.fillStyle = '#5F6B57';
  ctx.fillRect(-7, -4, 14, 8);
  ctx.fillStyle = '#111';
  ctx.fillRect(10, -1.5, 3, 3);
  ctx.fillRect(-13, -1.5, 3, 3);
  // Map / ops tents and the signals van under nets
  camoNet(ctx, -19, 7, 15, 7);
  tent(ctx, -12, 10.5, 9, 4);
  vehicle(ctx, 13, 10, 0, 7, 3.4, color);
  vehicle(ctx, 14, -10, Math.PI, 5, 2.6, color, true);
  // Generator and antenna farm
  ctx.fillStyle = '#37474F';
  ctx.fillRect(3, 8, 4, 3);
  mast(ctx, -6, -7, 12);
  mast(ctx, 5, -7, 9);
  mast(ctx, -16, -10, 7);
  flag(ctx, 0, -7, color);
  const hq = !inst.id.startsWith('inst-built-');
  label(ctx, isPlayer ? (hq ? '🎖️ [HQ 指揮所] 全類型增援' : '🎖️ [前線指揮所 CP] 輕裝增援') : '🚩 [敵指揮所 CP]', -26, labelColor);
}

// ════ Forward (battalion) CP: tents under camouflage nets, a dug-in bunker, radio masts, jeeps ════
export function drawBattalionCpSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  berm(ctx, -12, -8, 24, 16, 4);
  // Bunker: timber and earth roof, firing step and entrance
  ctx.fillStyle = '#3E4A3D';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.fillRect(-7, -5, 14, 10);
  ctx.strokeRect(-7, -5, 14, 10);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 0.5;
  for (let x = -5; x <= 5; x += 2.5) {
    ctx.beginPath();
    ctx.moveTo(x, -5);
    ctx.lineTo(x, 5);
    ctx.stroke();
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(7, -1.4, 2.4, 2.8);
  // Operations and signals tents under nets
  camoNet(ctx, -22, -16, 14, 9);
  tent(ctx, -15, -11.5, 9, 5);
  camoNet(ctx, 9, 8, 13, 8);
  tent(ctx, 15.5, 12, 8, 4.5);
  // Jeeps
  vehicle(ctx, -14, 10, 0.2, 4.4, 2.4, color, false);
  vehicle(ctx, 14, -11, -0.1, 4.4, 2.4, color, false);
  mast(ctx, -3, -5, 13);
  mast(ctx, 3, 5, 8);
  flag(ctx, 4, -5, color);
  const hq = !inst.id.startsWith('inst-built-');
  label(ctx, !isPlayer ? '🚩 [敵營指揮所]' : hq ? '🎖️ [HQ 營指揮所] 全類型增援' : '🎖️ [前線指揮所] 輕裝增援', -24, labelColor);
}

// ════ Field hospital: ward tents with red crosses, triage tent, ambulances and a casualty helipad ════
export function drawFieldHospitalSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  // Gravel hardstand
  ctx.fillStyle = 'rgba(120, 110, 90, 0.35)';
  ctx.beginPath();
  ctx.roundRect(-22, -14, 44, 28, 4);
  ctx.fill();
  // Two ward tents and the surgical tent (white roofs, red crosses)
  for (const [x, y, w, h] of [[-12, -7, 16, 7], [-12, 3, 16, 7], [6, -7, 10, 7]] as const) {
    tent(ctx, x, y, w, h, '#E0E0D8');
    redCross(ctx, x, y, 2);
  }
  // Casualty helipad
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(13, 6, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  redCross(ctx, 13, 6, 3);
  // Ambulances
  for (const [x, y] of [[-20, 12], [-6, 12]] as const) {
    vehicle(ctx, x, y, 0, 5.5, 3, color);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 1.5, y - 1, 2, 2);
  }
  label(ctx, '🏥 [戰地野戰醫院] 組織度恢復', -20, labelColor);
}

// ════ Supply dump: pallet stacks under tarps, fuel drum lines, a fork-lift track and trucks ════
export function drawSupplyDepotSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  ctx.fillStyle = 'rgba(120, 110, 90, 0.35)';
  ctx.fillRect(-22, -13, 44, 26);
  // Pallet stacks (ration and stores) in rows
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const x = -19 + c * 7;
      const y = -10 + r * 7;
      ctx.fillStyle = r === 0 ? '#8D6E63' : '#6D4C41';
      ctx.fillRect(x, y, 5, 5);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, 5, 5);
      ctx.beginPath();
      ctx.moveTo(x, y + 2.5);
      ctx.lineTo(x + 5, y + 2.5);
      ctx.stroke();
    }
  }
  // Fuel drums
  ctx.fillStyle = '#33691E';
  for (let k = 0; k < 10; k++) {
    ctx.beginPath();
    ctx.arc(10 + (k % 5) * 2.4, -9 + Math.floor(k / 5) * 2.4, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Trucks unloading
  vehicle(ctx, -10, 9, 0, 8, 3.4, color);
  vehicle(ctx, 8, 7, Math.PI, 8, 3.4, color);
  label(ctx, '📦 [戰地輜重樞紐] 建制度修整', -19, labelColor);
}

// ════ Ammunition dump: separated earth-revetted bays (so one hit does not take them all) ════
export function drawAmmoDepotSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  for (const [x, y] of [[-12, -7], [2, -7], [-12, 5], [2, 5]] as const) {
    // U-shaped earth revetment
    ctx.strokeStyle = '#8D7B5A';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 10, y + 6);
    ctx.stroke();
    // Ammunition crates inside
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x + 2, y + 1.5, 6, 3.4);
    ctx.fillStyle = '#FFB300';
    ctx.fillRect(x + 2, y + 1.5, 6, 0.8);
  }
  vehicle(ctx, 18, 0, Math.PI / 2, 7, 3.2, color);
  ctx.fillStyle = '#D32F2F';
  ctx.beginPath();
  ctx.moveTo(-18, -12);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-16, -15);
  ctx.closePath();
  ctx.fill();
  label(ctx, '💣 [彈藥庫] 分散式掩體', -18, labelColor);
}

// ════ Motor pool: gravel hardstand with rows of parked armour and trucks, a workshop and a fuel point ════
export function drawMotorPoolSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  ctx.fillStyle = 'rgba(130, 120, 100, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-24, -15, 48, 30, 3);
  ctx.fill();
  // Perimeter wire
  ctx.save();
  ctx.strokeStyle = 'rgba(200, 200, 190, 0.6)';
  ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 1.4]);
  ctx.strokeRect(-24, -15, 48, 30);
  ctx.restore();
  // Maintenance shed (open-sided, steel roof) with an A-frame hoist
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(-22, -13, 14, 9);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.5;
  for (let x = -20; x < -8; x += 2.4) {
    ctx.beginPath();
    ctx.moveTo(x, -13);
    ctx.lineTo(x, -4);
    ctx.stroke();
  }
  // Rows of parked vehicles: tanks then trucks
  for (let k = 0; k < 4; k++) tracked(ctx, -2 + k * 6.5, -9, -Math.PI / 2, color, k % 2 === 0);
  for (let k = 0; k < 4; k++) vehicle(ctx, -18 + k * 6, 6, -Math.PI / 2, 7, 3.2, color);
  // Fuel point: bladder and pump
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.ellipse(15, 8, 6, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFB300';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  flag(ctx, 21, -12, color);
  label(ctx, '🛠️ [調車場 Motor Pool] 裝甲 / 車輛增援', -20, labelColor);
}
