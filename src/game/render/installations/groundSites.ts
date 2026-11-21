import { Era, Installation, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';

/**
 * Top-down artwork of radar, gun, missile and field sites: the equipment of the era on its
 * pads and in its pits, with cables, berms and camouflage, instead of a symbol box.
 * The installation's angle (set by the caller's transform) points the guns and antennas.
 */

type Ctx = CanvasRenderingContext2D;

function label(ctx: Ctx, text: string, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, y);
}

function berm(ctx: Ctx, r: number, w = 2.6): void {
  ctx.strokeStyle = 'rgba(141, 123, 90, 0.95)';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

function cable(ctx: Ctx, pts: [number, number][]): void {
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.7)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function trailer(ctx: Ctx, x: number, y: number, a: number, l: number, w: number, color: string, fill = '#4E5A48'): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = fill;
  ctx.fillRect(-l / 2, -w / 2, l, w);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(-l / 2, -w / 2, l, w);
  ctx.restore();
}

function camo(ctx: Ctx, r: number): void {
  ctx.fillStyle = 'rgba(52, 66, 34, 0.45)';
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.35, r * 0.22, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

const RADAR_NAME: Record<Era, [string, string]> = {
  era1: ['SCR-270 早期預警雷達', '二一號 對空電探'],
  era2: ['SCR-584 / SCR-270 雷達', '一三號 對空電探'],
  era3: ['AN/TPS-1 搜索雷達', 'P-20 Periskop 雷達'],
  era4: ['AN/TPS-43 三維雷達', 'P-12 Spoon Rest 雷達'],
  era5: ['AN/TPS-75 雷達', 'P-37 Bar Lock 雷達'],
};

/**
 * Radar station: the antenna of the era turning on its pad, the operations shelter, the
 * generator and the cable runs. Bedspring arrays (SCR-270, Japanese mattress antennas) to
 * Korea, a Yagi array on the Soviet trucks, a big reflector and a radome later.
 */
export function drawRadarSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  const era = rc.era;
  ctx.fillStyle = 'rgba(120, 110, 90, 0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  // Operations shelter, generator and cables
  trailer(ctx, -10, 8, 0, 9, 4.5, color);
  trailer(ctx, 9, 10, 0, 5, 3, color, '#37474F');
  cable(ctx, [[-6, 8], [0, 2]]);
  cable(ctx, [[9, 10], [2, 2]]);
  // The antenna, turning
  const spin = rc.time * (era === 'era1' || era === 'era2' ? 0.8 : 1.4) + inst.pos.x * 0.01;
  ctx.save();
  ctx.rotate(spin);
  if (era === 'era1' || era === 'era2' || (era === 'era3' && !isPlayer)) {
    // Bedspring / mattress array: a grid of dipoles on a frame
    ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
    ctx.fillRect(-9, -1.2, 18, 2.4);
    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-9, -1.6, 18, 3.2);
    for (let x = -8; x <= 8; x += 2) {
      ctx.beginPath();
      ctx.moveTo(x, -1.6);
      ctx.lineTo(x, 1.6);
      ctx.stroke();
    }
  } else if (!isPlayer && era === 'era4') {
    // Spoon Rest: a long Yagi array on a truck mast
    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.lineWidth = 0.4;
    for (let x = -11; x <= 11; x += 2) {
      ctx.beginPath();
      ctx.moveTo(x, -2.4);
      ctx.lineTo(x, 2.4);
      ctx.stroke();
    }
  } else {
    // Parabolic reflector (curved) with its feed horn
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 3, 0, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.lineTo(0, 4);
    ctx.lineTo(6, -1);
    ctx.stroke();
  }
  ctx.restore();
  // Pedestal
  ctx.fillStyle = '#546E7A';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  if (era === 'era5' && isPlayer) {
    // Height-finder radome beside it
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(-12, -8, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const [ours, theirs] = RADAR_NAME[era];
  label(ctx, isPlayer ? `📡 [友軍雷達站] ${ours}` : `📡 [敵軍雷達站] ${theirs}`, -22, labelColor);
}

/**
 * Coastal gun: the piece in a circular concrete emplacement (open pit in the war years, an
 * armoured turret from Korea on), the ready-ammunition bunker and the range-finder post.
 */
export function drawCoastalGunSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor, isPlayer } = style;
  const heavy = inst.name.includes('240mm') || inst.id.includes('240');
  const r = heavy ? 13 : 10;
  // Concrete emplacement with a berm round it
  berm(ctx, r + 4, 3.2);
  ctx.fillStyle = '#6E7376';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A4F52';
  ctx.beginPath();
  ctx.arc(0, 0, r - 2.4, 0, Math.PI * 2);
  ctx.fill();
  const turret = rc.era !== 'era1' && rc.era !== 'era2' && !heavy;
  if (turret) {
    ctx.fillStyle = '#5B6B5A';
    ctx.beginPath();
    ctx.roundRect(-5.5, -4.5, 11, 9, 3);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  } else {
    // Open carriage: trails and recoil cylinders
    ctx.fillStyle = '#3E4A3D';
    ctx.fillRect(-5, -3.6, 9, 7.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-5, -3.6, 9, 7.2);
  }
  // Barrel(s), along the gun's bearing
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = heavy ? 2.6 : 1.8;
  ctx.lineCap = 'round';
  for (const dy of turret ? [-1.4, 1.4] : [0]) {
    ctx.beginPath();
    ctx.moveTo(3, dy);
    ctx.lineTo(heavy ? 26 : 19, dy);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // Ready-ammunition bunker and range-finder post behind the gun
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-r - 9, -4, 5, 8);
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.arc(-r - 3, r - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  const cal = inst.name.match(/\d{3}mm/)?.[0] ?? (isPlayer ? '155mm' : '140mm');
  label(ctx, heavy ? (isPlayer ? '[友軍重砲] M1 240mm 黑龍' : '[敵軍要塞重砲] 240mm') : isPlayer ? `[友軍岸防砲連] ${cal}` : `[敵軍岸防重砲] ${cal}`, -r - 10, labelColor);
}

/** Pillbox: thick concrete with firing slits, sandbagged wing walls and a rear entrance. */
export function drawBunkerSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { labelColor, isPlayer } = style;
  // Wing walls of sandbags
  ctx.strokeStyle = '#A1887F';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([2.2, 1]);
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(-8, 2);
  ctx.moveTo(14, 8);
  ctx.lineTo(8, 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Hexagonal pillbox (log and coral in the Pacific, concrete later)
  const pacific = rc.era === 'era1' || rc.era === 'era2';
  ctx.fillStyle = pacific ? '#6D5D45' : '#7A7F80';
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 8;
    const y = Math.sin(a) * 7;
    if (k) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Roof texture and the firing slits facing the front (+x)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(6.4, -2.6, 1.6, 1.4);
  ctx.fillRect(6.4, 1.2, 1.6, 1.4);
  ctx.fillRect(-1, -6.8, 2, 1.2);
  // Rear entrance
  ctx.fillStyle = '#263238';
  ctx.fillRect(-9, -1.2, 2, 2.4);
  if (pacific) camo(ctx, 8);
  label(ctx, isPlayer ? '🛡️ [友軍加固暗堡] 重機槍/無後座力砲' : '🛡️ [敵軍加固防禦暗堡] 重機槍/穿甲砲', -16, labelColor);
}

/**
 * Hawk / Patriot battery: three or four launchers fanned out on their pads, the radar group
 * (acquisition, illuminator / phased array), the control shelter and generators, all cabled.
 */
export function drawSamBatterySite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  const patriot = inst.type === 'sam_patriot';
  ctx.fillStyle = 'rgba(120, 110, 90, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  // Radar group and control shelter in the middle
  trailer(ctx, -3, 0, 0, 8, 4, color);
  if (patriot) {
    // AN/MPQ-53 phased-array radar: a flat face on its trailer
    trailer(ctx, 6, -4, 0.3, 6, 3, color);
    ctx.fillStyle = '#B0BEC5';
    ctx.fillRect(8.5, -6.5, 1.2, 5);
  } else {
    // Pulse acquisition radar (spinning) and the illuminator dish
    ctx.save();
    ctx.translate(6, -5);
    ctx.rotate(rc.time * 1.3);
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 1.2, 0, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(6, 5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Launchers on the perimeter, all trained the same way
  const n = patriot ? 4 : 3;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + 0.4;
    const x = Math.cos(a) * 17;
    const y = Math.sin(a) * 17;
    cable(ctx, [[0, 0], [x, y]]);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#3E4A3D';
    ctx.fillRect(-3.5, -2.5, 7, 5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-3.5, -2.5, 7, 5);
    if (patriot) {
      ctx.fillStyle = '#9E9E9E';
      for (const dy of [-1.6, -0.5, 0.6, 1.7]) ctx.fillRect(-2.6, dy - 0.45, 6, 0.9);
    } else {
      ctx.fillStyle = '#ECEFF1';
      for (const dy of [-1.5, 0, 1.5]) ctx.fillRect(-1, dy - 0.4, 6, 0.8);
    }
    ctx.restore();
  }
  label(ctx, patriot ? '🚀 [NATO 愛國者防空飛彈營] MIM-104 Patriot' : '🚀 [NATO 霍克防空飛彈連] MIM-23 Hawk', -30, labelColor);
}

/** Fan Song: the SNR-75 fire-control cabin with its two trough antennas (horizontal and vertical). */
export function drawFanSongSite(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  berm(ctx, 13, 2.4);
  trailer(ctx, 0, 0, 0, 9, 5, color);
  ctx.save();
  ctx.rotate(Math.sin(rc.time * 0.6) * 0.5);
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(-1, -9, 2, 7);
  ctx.fillRect(-7, -2.8, 7, 1.6);
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = 0.3;
  ctx.strokeRect(-1, -9, 2, 7);
  ctx.strokeRect(-7, -2.8, 7, 1.6);
  ctx.restore();
  cable(ctx, [[4.5, 0], [12, 6]]);
  trailer(ctx, 14, 8, 0.4, 5, 3, color, '#37474F');
  label(ctx, '📡 [敵軍射控雷達] SNR-75 Fan Song 扇歌', -19, labelColor);
}

/** Tunnel entrance: a timber-framed adit dug into the slope, spoil heap and brush over it. */
export function drawTunnelSite(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  ctx.fillStyle = 'rgba(93, 64, 55, 0.6)';
  ctx.beginPath();
  ctx.ellipse(6, 4, 8, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0D0D0D';
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4.5, 3);
  ctx.lineTo(-4.5, -3);
  ctx.lineTo(4.5, -3);
  ctx.lineTo(4.5, 3);
  ctx.stroke();
  camo(ctx, 9);
  label(ctx, '[地下坑道網]', -13, '#A1887F');
}

/** Forward cache: ammunition boxes and fuel drums under a camouflage net. */
export function drawCacheSite(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = r ? '#5D4037' : '#6D5B45';
      ctx.fillRect(-9 + c * 6, -6 + r * 5, 5, 4);
      ctx.fillStyle = '#FFB300';
      ctx.fillRect(-9 + c * 6, -6 + r * 5, 5, 0.6);
    }
  }
  ctx.fillStyle = '#33691E';
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.arc(-8 + k * 2.4, 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(52, 66, 34, 0.35)';
  ctx.beginPath();
  ctx.roundRect(-12, -9, 24, 18, 3);
  ctx.fill();
  label(ctx, `📦 [${inst.name.split(' (')[0]}]`, -14, '#FFE082');
}

/** River ferry: a pontoon raft with a truck aboard on its cable, ramps on both banks. */
export function drawFerrySite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color } = style;
  // Guide cable across the river
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  // Landing ramps
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-24, -4, 5, 8);
  ctx.fillRect(19, -4, 5, 8);
  // The raft moving across
  const x = Math.sin(rc.time * 0.25) * 12;
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(x - 6, -4.5, 12, 9);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.5;
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, -4.5);
    ctx.lineTo(x + dx, 4.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#3E4D24';
  ctx.fillRect(x - 3.5, -1.6, 7, 3.2);
  ctx.strokeStyle = color;
  ctx.strokeRect(x - 3.5, -1.6, 7, 3.2);
  label(ctx, `⛴️ [${inst.name.split(' (')[0]}]`, -10, '#B3E5FC');
}

/** Radio station: a guyed lattice mast, the transmitter hut and the antenna field. */
export function drawRadioSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { labelColor } = style;
  // Guy wires to anchors
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.55)';
  ctx.lineWidth = 0.35;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
    ctx.stroke();
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(Math.cos(a) * 16 - 0.8, Math.sin(a) * 16 - 0.8, 1.6, 1.6);
  }
  // Lattice mast seen from above
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(1.8, 1);
  ctx.lineTo(-1.8, 1);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc(0, 0, 0.8, 0, Math.PI * 2);
  ctx.fill();
  // Transmitter hut
  ctx.fillStyle = '#8D8D80';
  ctx.fillRect(5, 4, 8, 5);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeRect(5, 4, 8, 5);
  label(ctx, `📡 [${inst.name.split(' (')[0]}]`, -18, labelColor);
}

/** Watchtower: the platform and its roof on four legs, ladder, and a sandbagged base. */
export function drawWatchtowerSite(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { labelColor, color } = style;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(4, 4, 7, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 0.9;
  for (const [x, y] of [[-4, -4], [4, -4], [4, 4], [-4, 4]] as const) {
    ctx.beginPath();
    ctx.moveTo(x * 1.3, y * 1.3);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-4.5, -4.5, 9, 9);
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.moveTo(-5.5, -5.5);
  ctx.lineTo(5.5, -5.5);
  ctx.lineTo(5.5, 5.5);
  ctx.lineTo(-5.5, 5.5);
  ctx.closePath();
  ctx.moveTo(-5.5, -5.5);
  ctx.lineTo(5.5, 5.5);
  ctx.moveTo(5.5, -5.5);
  ctx.lineTo(-5.5, 5.5);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-5.5, -5.5, 11, 11);
  label(ctx, `🗼 [${inst.name.split(' (')[0]}]`, -11, labelColor);
}
