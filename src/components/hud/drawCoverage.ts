import type { RadarCoverage } from '../../game/engine';

/**
 * Radar coverage on a small map (minimap, tactical map): low-level coverage filled per side,
 * dashed high-altitude rings, one per cluster. `scale` maps world units to map pixels.
 */
export function drawCoverageOnMap(ctx: CanvasRenderingContext2D, coverage: RadarCoverage[] | undefined, scale: number, lineScale = 1): void {
  if (!coverage || coverage.length === 0) return;
  ctx.save();
  for (const enemy of [false, true]) {
    const list = coverage.filter((c) => c.enemy === enemy);
    if (list.length === 0) continue;
    const rgb = enemy ? '255, 82, 82' : '0, 229, 255';
    ctx.beginPath();
    for (const c of list) {
      c.low.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * scale, p.y * scale) : ctx.lineTo(p.x * scale, p.y * scale)));
      ctx.closePath();
    }
    ctx.fillStyle = `rgba(${rgb}, 0.12)`;
    ctx.fill('nonzero');
    const kept: RadarCoverage[] = [];
    for (const c of [...list].sort((a, b) => b.highRadius - a.highRadius)) {
      if (kept.some((k) => Math.hypot(k.pos.x - c.pos.x, k.pos.y - c.pos.y) < 1500 && k.highRadius >= c.highRadius * 0.8)) continue;
      kept.push(c);
    }
    ctx.setLineDash([3 * lineScale, 3 * lineScale]);
    ctx.strokeStyle = `rgba(${rgb}, 0.45)`;
    ctx.lineWidth = 0.8 * lineScale;
    for (const c of kept) {
      ctx.beginPath();
      ctx.arc(c.pos.x * scale, c.pos.y * scale, c.highRadius * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}
