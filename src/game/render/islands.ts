import { Island } from '../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from './context';
import { drawInstallation } from './installations';
import { drawTerrainGround, drawTerrainOverlays } from './terrain';
import { getTerrainMap } from '../terrain/terrainMap';

function tracePath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}

/** Ring around an island's coast pushed outward from its centre by `offset` (reef, surf line). */
function traceOffsetRing(ctx: CanvasRenderingContext2D, island: Island, offset: number): void {
  ctx.beginPath();
  for (let i = 0; i < island.points.length; i++) {
    const p = island.points[i];
    const dx = p.x - island.center.x;
    const dy = p.y - island.center.y;
    const d = Math.hypot(dx, dy) || 1;
    const x = p.x + (dx / d) * offset;
    const y = p.y + (dy / d) * offset;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Islands and mainland: shallow-water shelf and surf, the terrain raster (render/terrain.ts),
 * lagoons, the coastline, then rivers, roads, towns and peaks, and finally names and
 * installations on top.
 */
export function drawIslands(rc: RenderContext, islands: Island[], camera: Camera, worldSize = 14000) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const wavePulse = (Math.sin(rc.time * 2) + 1) * 0.5;
  const visible = islands.filter((isl) => isWorldCircleVisible(rc, isl.center.x, isl.center.y, isl.radius + 260, camera) || isl.isMainland);

  // 1. Shallow shelf and surf line
  for (const island of visible) {
    if (island.points.length < 3) continue;
    ctx.fillStyle = 'rgba(0, 150, 175, 0.14)';
    ctx.strokeStyle = 'rgba(38, 198, 218, 0.22)';
    ctx.lineWidth = 2;
    traceOffsetRing(ctx, island, 28);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(100, 181, 246, ${0.15 + wavePulse * 0.15})`;
    ctx.lineWidth = 1.5;
    traceOffsetRing(ctx, island, 14 + wavePulse * 8);
    ctx.stroke();
  }

  // 2. Ground: a dark land fill (shown while the raster is built), then the terrain raster
  ctx.fillStyle = 'rgba(16, 34, 30, 0.95)';
  for (const island of visible) {
    tracePath(ctx, island.points);
    ctx.fill();
  }
  const terrain = getTerrainMap(islands, worldSize, rc.era);
  drawTerrainGround(rc, terrain, visible);

  // 3. Lagoons and coastline
  for (const island of visible) {
    for (const lag of island.lagoons ?? []) {
      const lagGrad = ctx.createRadialGradient(lag.center.x, lag.center.y, lag.radius * 0.15, lag.center.x, lag.center.y, lag.radius);
      lagGrad.addColorStop(0, 'rgba(0, 120, 140, 0.85)');
      lagGrad.addColorStop(0.7, 'rgba(0, 160, 180, 0.6)');
      lagGrad.addColorStop(1, 'rgba(77, 208, 225, 0.45)');
      ctx.fillStyle = lagGrad;
      tracePath(ctx, lag.points);
      ctx.fill();
      ctx.strokeStyle = 'rgba(178, 235, 242, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (camera.zoom >= 0.55) {
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(128, 222, 234, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('⚓ 潟湖 · 水深 26M · 可通航', lag.center.x, lag.center.y);
      }
      for (const ch of lag.channelBreaches ?? []) {
        const chX = island.center.x + Math.cos(ch.angle) * island.radius * 0.95;
        const chY = island.center.y + Math.sin(ch.angle) * island.radius * 0.95;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(chX, chY, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (camera.zoom >= 0.42) {
          ctx.fillStyle = '#80DEEA';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('通行水門', chX, chY - 28);
        }
      }
    }
    ctx.strokeStyle = 'rgba(176, 210, 230, 0.75)';
    ctx.lineWidth = 2;
    tracePath(ctx, island.points);
    ctx.stroke();
  }

  // 4. Rivers, roads, bridges, towns, peaks
  drawTerrainOverlays(rc, terrain, camera);

  // 5. Names and installations
  for (const island of visible) {
    ctx.fillStyle = 'rgba(144, 202, 249, 0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    if (!island.isMainland) ctx.fillText(island.name.toUpperCase(), island.center.x, island.center.y - island.radius - 12);
    for (const inst of island.installations) {
      drawInstallation(rc, inst, island);
    }
  }

  ctx.restore();
}

// Draw Strongholds with Capture Zones and Command Posts
export function drawStrongholds(rc: RenderContext, islands: Island[], camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const pulse = (Math.sin(rc.time * 3) + 1) * 0.5;

  for (const island of islands) {
    if (island.isFriendlyBase || !island.strongholds) continue;

    for (const sh of island.strongholds) {
      // 1. Circular Tactical Capture Perimeter Zone (380m)
      const isCaptured = sh.isCaptured;
      const isContested = sh.captureProgress > 0 && !isCaptured;

      const zoneColor = isCaptured
        ? 'rgba(0, 230, 118, 0.45)'
        : isContested
        ? 'rgba(255, 213, 79, 0.55)'
        : 'rgba(239, 83, 80, 0.35)';

      ctx.strokeStyle = zoneColor;
      ctx.lineWidth = isCaptured ? 2 : 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(sh.cpPos.x, sh.cpPos.y, 380, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Translucent Zone Tint when capturing
      if (isContested) {
        ctx.fillStyle = `rgba(255, 213, 79, ${0.03 + pulse * 0.04})`;
        ctx.beginPath();
        ctx.arc(sh.cpPos.x, sh.cpPos.y, 380, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. CP Tactical Badge floating above CP
      ctx.save();
      ctx.translate(sh.cpPos.x, sh.cpPos.y);

      // CP Progress Bar
      const barW = 56;
      const barH = 5;
      ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
      ctx.fillRect(-barW / 2, -42, barW, barH);
      ctx.strokeStyle = '#1E3A5F';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2, -42, barW, barH);

      const progPct = sh.captureProgress / 100;
      ctx.fillStyle = isCaptured ? '#00E676' : '#FFD54F';
      ctx.fillRect(-barW / 2, -42, barW * progPct, barH);

      // CP Label
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      if (isCaptured) {
        ctx.fillStyle = '#00E676';
        ctx.fillText(`🚩【已解放 LIBERATED】${sh.name}`, 0, -48);
      } else {
        ctx.fillStyle = isContested ? '#FFD54F' : '#FF8A80';
        ctx.fillText(`🚩【據點 CP】${sh.name} · 佔領度: ${Math.round(sh.captureProgress)}%`, 0, -48);
      }

      ctx.restore();
    }
  }

  ctx.restore();
}
