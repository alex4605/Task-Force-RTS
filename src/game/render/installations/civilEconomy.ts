import { Installation, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';

/**
 * Civilian economic sites, top-down: coconut plantations and copra driers, wharves and fishing
 * piers, the Nan'yō Kōhatsu sugar mill with its cane railway, hydro and coal power stations,
 * Buddhist pagodas and West German works. Drawn in civilian colours; whose sphere a site is in
 * is shown by the label underneath (see installations/index.ts).
 */

type Ctx = CanvasRenderingContext2D;

function title(ctx: Ctx, text: string, y: number, color = '#FFE0B2'): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, y);
}

function shed(ctx: Ctx, x: number, y: number, w: number, h: number, roof: string, ridge = true): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x - w / 2 + 1.4, y - h / 2 + 1.4, w, h);
  ctx.fillStyle = roof;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  if (ridge) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.stroke();
  }
}

function palm(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.strokeStyle = 'rgba(46, 104, 40, 0.95)';
  ctx.lineWidth = 1.1;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + x * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6 - 0.8, x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = '#6D4C41';
  ctx.beginPath();
  ctx.arc(x, y, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCopraPlantation(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  // Rows of coconut palms on cleared ground
  ctx.fillStyle = 'rgba(120, 140, 70, 0.35)';
  ctx.fillRect(-34, -22, 68, 44);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) palm(ctx, -28 + c * 11 + (r % 2) * 5, -16 + r * 10, 4.2);
  // Copra drier (hot-air shed) and the planter's house
  shed(ctx, 22, 15, 12, 7, '#8D8D86');
  shed(ctx, -22, 15, 9, 7, '#A1887F');
  ctx.fillStyle = 'rgba(200, 200, 200, 0.35)';
  ctx.beginPath();
  ctx.arc(26, 11, 3, 0, Math.PI * 2);
  ctx.fill();
  title(ctx, `🌴 [${inst.name.replace('(中立) ', '').split(' (')[0]}]`, -27);
}

export function drawCivilWharf(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const early = rc.era === 'era1' || rc.era === 'era2';
  // Pier running out to sea along +x, with the godowns ashore
  ctx.fillStyle = early ? '#8D6E63' : '#9E9E9E';
  ctx.fillRect(-4, -3, 40, 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.5;
  for (let x = -2; x < 36; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, -3);
    ctx.lineTo(x, 3);
    ctx.stroke();
  }
  shed(ctx, -16, -8, 16, 9, early ? '#A1887F' : '#90A4AE');
  shed(ctx, -16, 8, 14, 8, early ? '#BCAAA4' : '#B0BEC5');
  // Boats alongside: sampans and schooners, or a fishing trawler
  ctx.fillStyle = early ? '#5D4037' : '#37474F';
  for (const [x, y] of [[14, -7], [26, 7], [32, -7]] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  title(ctx, `⚓ [${inst.name.replace('(中立) ', '').split(' (')[0]}]`, -16);
}

export function drawSugarMill(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  // Cane fields, the narrow-gauge cane railway and the mill with its tall chimney
  ctx.fillStyle = 'rgba(139, 195, 74, 0.35)';
  ctx.fillRect(-36, -24, 30, 48);
  ctx.strokeStyle = 'rgba(85, 139, 47, 0.6)';
  ctx.lineWidth = 0.6;
  for (let y = -22; y < 24; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-36, y);
    ctx.lineTo(-6, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 1.2]);
  ctx.beginPath();
  ctx.moveTo(-36, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();
  ctx.setLineDash([]);
  shed(ctx, 14, -6, 22, 12, '#9E9E96', false);
  shed(ctx, 16, 10, 14, 8, '#A8A49A');
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.arc(28, -12, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(158, 158, 158, 0.4)';
  ctx.beginPath();
  ctx.arc(32, -16, 4, 0, Math.PI * 2);
  ctx.fill();
  title(ctx, `🏭 [${inst.name.replace('(中立) ', '').split(' (')[0]}]`, -26);
}

export function drawPowerPlant(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  if (rc.era === 'era3') {
    // Hydro station: the dam across the gorge, the penstocks and the powerhouse
    ctx.fillStyle = 'rgba(66, 133, 180, 0.6)';
    ctx.fillRect(-34, -24, 68, 16);
    ctx.fillStyle = '#B0B0A8';
    ctx.fillRect(-34, -9, 68, 5);
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 1.4;
    for (const x of [-12, -4, 4, 12]) {
      ctx.beginPath();
      ctx.moveTo(x, -4);
      ctx.lineTo(x * 0.6, 8);
      ctx.stroke();
    }
    shed(ctx, 0, 12, 30, 9, '#9E9E96', false);
    // Switchyard and the transmission line leaving it
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
    ctx.lineWidth = 0.5;
    for (let x = 18; x < 34; x += 4) {
      ctx.strokeRect(x - 1.2, 9, 2.4, 6);
    }
    ctx.beginPath();
    ctx.moveTo(34, 12);
    ctx.lineTo(44, 20);
    ctx.stroke();
  } else {
    // Coal-fired station: boiler house, turbine hall, two cooling towers, coal yard
    shed(ctx, -6, -4, 26, 14, '#8D8D86', false);
    shed(ctx, -6, 10, 26, 8, '#A3A39B', false);
    for (const [x, y] of [[20, -8], [20, 10]] as const) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, 8);
      g.addColorStop(0, '#5F5F5A');
      g.addColorStop(1, '#BDBDB5');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(236, 239, 241, 0.35)';
      ctx.beginPath();
      ctx.arc(x + 4, y - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#263238';
    ctx.fillRect(-34, -16, 10, 26);
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(-20, -16, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  title(ctx, `⚡ [${inst.name.replace('(中立) ', '').split(' (')[0]}]`, -28);
}

export function drawPagoda(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  // Walled temple court: gate, main hall with curved tiled roof, the tiered tower and a pond
  ctx.strokeStyle = '#C9B47A';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-26, -20, 52, 40);
  ctx.fillStyle = 'rgba(205, 190, 150, 0.35)';
  ctx.fillRect(-26, -20, 52, 40);
  shed(ctx, 0, -6, 26, 12, '#8D4B2C');
  ctx.strokeStyle = '#E8C66A';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-13, -12, 26, 12);
  // Tiered tower seen from above: nested squares
  for (let k = 0; k < 4; k++) {
    const r = 7 - k * 1.6;
    ctx.fillStyle = k % 2 ? '#B0603A' : '#8D4B2C';
    ctx.fillRect(16 - r, 10 - r, r * 2, r * 2);
  }
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(15.2, 9.2, 1.6, 1.6);
  ctx.fillStyle = 'rgba(66, 165, 200, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-14, 11, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C62828';
  ctx.fillRect(-3, 18, 6, 3);
  title(ctx, `🛕 [${inst.name.replace('(中立) ', '').split(' (')[0]}] 受保護`, -25, '#FFE082');
}

export function drawFactory(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  // Sawtooth-roofed halls, an office block, a rail siding and the car park
  for (let k = 0; k < 3; k++) {
    shed(ctx, -16 + k * 14, -6, 13, 22, '#A7A9A3', false);
    ctx.strokeStyle = 'rgba(80, 90, 100, 0.6)';
    ctx.lineWidth = 0.6;
    for (let y = -16; y < 5; y += 3) {
      ctx.beginPath();
      ctx.moveTo(-22.5 + k * 14, y);
      ctx.lineTo(-9.5 + k * 14, y);
      ctx.stroke();
    }
  }
  shed(ctx, 26, -10, 10, 8, '#CFD8DC', false);
  ctx.strokeStyle = '#4E342E';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 1.2]);
  ctx.beginPath();
  ctx.moveTo(-34, 12);
  ctx.lineTo(30, 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(18, 15, 14, 7);
  ctx.fillStyle = '#ECEFF1';
  for (let x = 19; x < 32; x += 3) ctx.fillRect(x, 16, 1.6, 1);
  title(ctx, `🏭 [${inst.name.replace('(中立) ', '').split(' (')[0]}]`, -23);
}
