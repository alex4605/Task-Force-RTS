import { RenderContext } from '../context';

// Authentic US WWII National Insignia (Star & Bars)
// US Navy: Glossy Sea Blue roundel + White Star + White side bars with blue outline
// USAAF: Same Star & Bars with crisp outline
export function drawUSInsignia(rc: RenderContext, x: number, y: number, r: number, isArmyAirForce: boolean = false) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(x, y);

  // 1943+ Star & Bars: White rectangular side bars
  const barW = r * 1.5;
  const barH = r * 0.56;
  ctx.fillStyle = '#081C30';
  ctx.fillRect(-barW - 0.8, -barH / 2 - 0.8, (barW + 0.8) * 2, barH + 1.6);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-barW, -barH / 2, barW * 2, barH);

  // Blue disc
  ctx.fillStyle = isArmyAirForce ? '#1E3A5F' : '#0B2545';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // White 5-pointed Star
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const sx = Math.cos(angle) * (r * 0.88);
    const sy = Math.sin(angle) * (r * 0.88);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Japanese IJN/IJA Red Sun (Hinomaru) Roundel with Authentic White Outer Border (Fukurin)
export function drawHinomaru(rc: RenderContext, x: number, y: number, r: number, withWhiteBorder: boolean = true) {
  const ctx = rc.ctx;
  ctx.save();
  if (withWhiteBorder) {
    // White border ring (白覆輪)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, r + 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crimson red sun (日之丸)
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Japanese Yellow Wing Leading Edge Identification Band (主翼前緣黃色敵我識別帶)
// Essential historical IFF stripe from wing root to mid-span on both wings
export function drawJapaneseIFFLeadingEdge(rc: RenderContext, wingSpan: number, rootX: number, tipX: number) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2.4;

  // Port (left) wing leading edge band
  ctx.beginPath();
  ctx.moveTo(rootX, -3.5);
  ctx.lineTo(tipX, -wingSpan * 0.72);
  ctx.stroke();

  // Starboard (right) wing leading edge band
  ctx.beginPath();
  ctx.moveTo(rootX, 3.5);
  ctx.lineTo(tipX, wingSpan * 0.72);
  ctx.stroke();
  ctx.restore();
}

// British Royal Air Force / Fleet Air Arm Cockade Roundel (Type B / C1 Roundel)
export function drawRAFRoundel(rc: RenderContext, x: number, y: number, r: number) {
  const ctx = rc.ctx;
  ctx.save();
  // Outer Blue ring
  ctx.fillStyle = '#0D47A1';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Middle White ring
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
  // Center Red dot
  ctx.fillStyle = '#D32F2F';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Republic of Korea Air Force (ROKAF) Taegeuk Insignia
export function drawROKAFRoundel(rc: RenderContext, x: number, y: number, r: number) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(x, y);
  // Outer white wing bar
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-r * 1.4, -r * 0.45, r * 2.8, r * 0.9);
  // Taegeuk circle
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#D32F2F';
  ctx.fill();
  // Blue half
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.fillStyle = '#1976D2';
  ctx.fill();
  ctx.restore();
}

function starPath(ctx: CanvasRenderingContext2D, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
}

// Soviet VVS / AV-MF Red Star (红星) with white and red outline bands
export function drawRedStar(rc: RenderContext, x: number, y: number, r: number) {
  const ctx = rc.ctx;
  const outer = r * 1.25;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'miter';
  // Outer thin red band, then white band, then red star body
  ctx.fillStyle = '#B71C1C';
  starPath(ctx, outer + 1.0, (outer + 1.0) * 0.42);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  starPath(ctx, outer + 0.55, (outer + 0.55) * 0.42);
  ctx.fill();
  ctx.fillStyle = '#E53935';
  starPath(ctx, outer, outer * 0.42);
  ctx.fill();
  ctx.restore();
}

// West German Luftwaffe / Marineflieger Balkenkreuz (iron cross with white edges)
export function drawLuftwaffeCross(rc: RenderContext, x: number, y: number, r: number) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(x, y);
  const arm = r * 1.05;
  const w = r * 0.62;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-arm - 0.5, -w / 2 - 0.5, (arm + 0.5) * 2, w + 1);
  ctx.fillRect(-w / 2 - 0.5, -arm - 0.5, w + 1, (arm + 0.5) * 2);
  ctx.fillStyle = '#111111';
  ctx.fillRect(-arm, -w / 2, arm * 2, w);
  ctx.fillRect(-w / 2, -arm, w, arm * 2);
  ctx.restore();
}

// French Armée de l'Air cocarde (blue centre, white, red outer ring)
export function drawFrenchRoundel(rc: RenderContext, x: number, y: number, r: number) {
  const ctx = rc.ctx;
  ctx.save();
  const rings: [number, string][] = [[1, '#D32F2F'], [0.66, '#FFFFFF'], [0.33, '#1565C0']];
  for (const [scale, fill] of rings) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
