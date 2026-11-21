import { Island, Vector2D, SelectionBox, RequisitionItem, Era } from '../../types/game';
import { RenderContext, Camera, OrderMarker, isWorldCircleVisible } from './context';
import type { RadarCoverage } from '../engine';
import { costOf, formatBundle } from '../economy';

// Draw Screen-space RTS Drag Selection Box
export function drawSelectionBox(rc: RenderContext, box: SelectionBox) {
  if (!box.isActive) return;
  const ctx = rc.ctx;
  ctx.save();
  const x = Math.min(box.startX, box.currentX);
  const y = Math.min(box.startY, box.currentY);
  const w = Math.abs(box.currentX - box.startX);
  const h = Math.abs(box.currentY - box.startY);

  ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.restore();
}

// ══════════════════════════════════════════════════════════
// 碼頭與工事營建落點預覽 (Placement Ghost Blueprint Renderer)
// ══════════════════════════════════════════════════════════
export function drawPlacementGhost(rc: RenderContext, item: RequisitionItem, worldPos: Vector2D, camera: Camera, islands: Island[]) {
  const { ctx, width, height } = rc;
  const sx = width / 2 + (worldPos.x - camera.x) * camera.zoom;
  const sy = height / 2 + (worldPos.y - camera.y) * camera.zoom;

  // Find nearest island
  let closestIsland: Island | null = null;
  let minDistance = Infinity;
  for (const isl of islands) {
    const d = Math.hypot(worldPos.x - isl.center.x, worldPos.y - isl.center.y);
    if (d < minDistance) {
      minDistance = d;
      closestIsland = isl;
    }
  }

  let angle = 0;
  let distToCoast = 0;
  const isValidPlacement = true;
  let statusText = '✅ 自由落點座標就緒 - 點擊左鍵戳記建造';

  if (closestIsland) {
    angle = Math.atan2(worldPos.y - closestIsland.center.y, worldPos.x - closestIsland.center.x);
    distToCoast = minDistance - closestIsland.radius;

    const isMaritime =
      item.typeTag === 'dockyard' || item.typeTag === 'pontoon_pier' || item.typeTag === 'major_naval_port';

    if (isMaritime) {
      if (distToCoast < -80) {
        statusText = '⚓ 內灣入海港埠泊位 (點擊直接落成)';
      } else if (distToCoast > 800) {
        statusText = '⚓ 遠洋海面浮動維修泊位 (點擊直接落成)';
      } else {
        statusText = '✅ 理想沿岸水域 - 適合艦艇靠泊補給 (點擊直接落成)';
      }
    } else {
      if (distToCoast < 0) {
        statusText = '🛡️ 島嶼守備陣地工事 (點擊直接構築)';
      } else {
        statusText = '🛡️ 沿岸前沿要塞陣地 (點擊直接構築)';
      }
    }
  }

  ctx.save();

  // 1. Guideline connecting nearest island shoreline to cursor
  if (closestIsland) {
    const shoreWorldX = closestIsland.center.x + Math.cos(angle) * closestIsland.radius;
    const shoreWorldY = closestIsland.center.y + Math.sin(angle) * closestIsland.radius;
    const shoreScreenX = width / 2 + (shoreWorldX - camera.x) * camera.zoom;
    const shoreScreenY = height / 2 + (shoreWorldY - camera.y) * camera.zoom;

    ctx.strokeStyle = isValidPlacement ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 82, 82, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(shoreScreenX, shoreScreenY);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shore anchor indicator
    ctx.fillStyle = isValidPlacement ? '#00E5FF' : '#FF5252';
    ctx.beginPath();
    ctx.arc(shoreScreenX, shoreScreenY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const pulse = (Math.sin(rc.time * 6) + 1) * 0.5;

  // 2. Operational Range Ring (in world scale)
  let rangeRadius = 600;
  if (item.typeTag === 'major_naval_port') rangeRadius = 850;
  else if (item.typeTag === 'dockyard') rangeRadius = 650;
  else if (item.typeTag === 'pontoon_pier') rangeRadius = 550;
  else if (item.typeTag === 'm1_240mm') rangeRadius = item.era === 'era5' ? 3800 : item.era === 'era4' ? 3600 : item.era === 'era3' ? 3400 : item.era === 'era2' ? 3200 : 2800;
  else if (item.typeTag === 'coastal_gun') rangeRadius = 2000;
  else if (item.typeTag === 'heavy_aa') rangeRadius = 1200;
  else if (item.typeTag === 'radar') rangeRadius = 4500;

  const screenRangeRadius = rangeRadius * camera.zoom;
  ctx.strokeStyle = isValidPlacement
    ? `rgba(0, 229, 255, ${0.25 + pulse * 0.15})`
    : `rgba(255, 82, 82, ${0.25 + pulse * 0.15})`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(sx, sy, screenRangeRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Blueprint Hologram at Cursor
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);

  const zoomScale = Math.max(0.4, Math.min(2.5, camera.zoom));
  ctx.scale(zoomScale, zoomScale);

  const blueprintColor = isValidPlacement ? '#00E5FF' : '#FF5252';
  const blueprintFill = isValidPlacement
    ? `rgba(0, 229, 255, ${0.18 + pulse * 0.12})`
    : `rgba(255, 82, 82, ${0.18 + pulse * 0.12})`;

  ctx.strokeStyle = blueprintColor;
  ctx.fillStyle = blueprintFill;
  ctx.lineWidth = 2;

  if (item.typeTag === 'dockyard') {
    // 浮動修船塢 U型槽
    ctx.fillRect(-24, -12, 10, 48);
    ctx.strokeRect(-24, -12, 10, 48);
    ctx.fillRect(14, -12, 10, 48);
    ctx.strokeRect(14, -12, 10, 48);
    ctx.beginPath();
    ctx.moveTo(-24, 36);
    ctx.lineTo(24, 36);
    ctx.stroke();

    // 起重機吊桿
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-34, -18);
    ctx.moveTo(18, 0);
    ctx.lineTo(34, -18);
    ctx.stroke();
  } else if (item.typeTag === 'major_naval_port') {
    // 大型深水突堤軍港
    ctx.fillRect(-42, -14, 84, 28);
    ctx.strokeRect(-42, -14, 84, 28);
    // 龍門吊車架構
    ctx.beginPath();
    ctx.moveTo(-20, -14);
    ctx.lineTo(-20, -26);
    ctx.lineTo(20, -26);
    ctx.lineTo(20, -14);
    ctx.stroke();
  } else if (item.typeTag === 'm1_240mm' || item.typeTag === 'coastal_gun') {
    const rPit = item.typeTag === 'm1_240mm' ? 16 : 12;
    ctx.beginPath();
    ctx.arc(0, 0, rPit, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = item.typeTag === 'm1_240mm' ? 4 : 2.5;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(item.typeTag === 'm1_240mm' ? 34 : 24, 0);
    ctx.stroke();
  } else {
    // 浮式棧橋碼頭或其他設施
    ctx.fillRect(-28, -8, 56, 16);
    ctx.strokeRect(-28, -8, 56, 16);
    for (let px = -24; px <= 24; px += 6) {
      ctx.beginPath();
      ctx.moveTo(px, -8);
      ctx.lineTo(px, 8);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(26, -14);
    ctx.lineTo(32, -8);
    ctx.stroke();
  }

  // Directional Arrow pointing seaward
  ctx.strokeStyle = blueprintColor;
  ctx.fillStyle = blueprintColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(0, 70);
  ctx.lineTo(-8, 58);
  ctx.moveTo(0, 70);
  ctx.lineTo(8, 58);
  ctx.stroke();

  ctx.restore();

  // 4. Tactical Placement Badge (Screen Space floating above cursor)
  const cardW = 280;
  const cardH = 74;
  const cardX = sx - cardW / 2;
  const cardY = sy - screenRangeRadius - cardH - 12;

  ctx.fillStyle = 'rgba(5, 15, 28, 0.92)';
  ctx.strokeStyle = isValidPlacement ? '#00E5FF' : '#FF5252';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 6);
  ctx.fill();
  ctx.stroke();

  // Header badge bar
  ctx.fillStyle = isValidPlacement ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 82, 82, 0.2)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 22, [6, 6, 0, 0]);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#00E5FF';
  ctx.fillText(`⚓【戰地設施自由戳記】${item.name}`, cardX + 8, cardY + 15);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFD54F';
  ctx.fillText(formatBundle(costOf(item)), cardX + cardW - 8, cardY + 15);

  // Coordinate & Coastal info
  ctx.textAlign = 'left';
  ctx.font = '10px monospace';
  ctx.fillStyle = '#E0F7FA';
  ctx.fillText(
    `座標: (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)}) · ${closestIsland ? closestIsland.name : '近海'}`,
    cardX + 8,
    cardY + 36
  );

  ctx.fillStyle = '#80DEEA';
  ctx.fillText(statusText, cardX + 8, cardY + 50);

  // Hotkey instruction
  ctx.font = 'bold 9.5px monospace';
  ctx.fillStyle = '#FFE082';
  ctx.fillText(`👉 [滑鼠左鍵] 點擊自由戳記落點 | [ESC / 右鍵] 結束戳記`, cardX + 8, cardY + 66);

  ctx.restore();
}

// Interactive Tactical CAP Area Designation Reticle
export function drawCapPreview(rc: RenderContext, pos: Vector2D, camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const orbitR = 250;
  const pulse = (Math.sin(rc.time * 6) + 1) * 0.5;

  // Glowing cyan patrol perimeter
  ctx.strokeStyle = `rgba(0, 229, 255, ${0.7 + pulse * 0.3})`;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, orbitR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Shaded patrol sector
  ctx.fillStyle = `rgba(0, 229, 255, ${0.08 + pulse * 0.05})`;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, orbitR, 0, Math.PI * 2);
  ctx.fill();

  // Center crosshair
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pos.x - 18, pos.y);
  ctx.lineTo(pos.x + 18, pos.y);
  ctx.moveTo(pos.x, pos.y - 18);
  ctx.lineTo(pos.x, pos.y + 18);
  ctx.stroke();

  // Rotating radar scan line
  const sweepA = (rc.time * 2.2) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x + Math.cos(sweepA) * orbitR, pos.y + Math.sin(sweepA) * orbitR);
  ctx.stroke();

  // Top instruction banner
  ctx.fillStyle = '#E0F7FA';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText('🛡️【設定 CAP 戰鬥空巡區域】點擊海圖建立盤旋空巡防線 (ESC 取消)', pos.x, pos.y - orbitR - 12);
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 9.5px monospace';
  ctx.fillText(`中心座標: [X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}] · 盤旋半徑 250m · 自動截擊`, pos.x, pos.y - orbitR + 2);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// Interactive Passive Sonobuoy Drop Reticle
export function drawSonobuoyPreview(rc: RenderContext, pos: Vector2D, radius: number, camera: Camera, era: Era) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const pulse = (Math.sin(rc.time * 5.5) + 1) * 0.5;
  const isLegacyEra = era === 'era1' || era === 'era2';
  const strokeCol = isLegacyEra ? `rgba(255, 138, 128, ${0.65 + pulse * 0.25})` : `rgba(38, 198, 218, ${0.72 + pulse * 0.28})`;
  const fillCol = isLegacyEra ? 'rgba(255, 82, 82, 0.06)' : `rgba(0, 229, 255, ${0.06 + pulse * 0.04})`;

  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = fillCol;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner crosshair & buoy icon ring
  ctx.strokeStyle = isLegacyEra ? '#FF8A80' : '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
  ctx.moveTo(pos.x - 24, pos.y);
  ctx.lineTo(pos.x + 24, pos.y);
  ctx.moveTo(pos.x, pos.y - 24);
  ctx.lineTo(pos.x, pos.y + 24);
  ctx.stroke();

  ctx.fillStyle = '#E0F7FA';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText(
    isLegacyEra
      ? '⚠️ 二戰時期（時代一～二）尚無空投被動聲納浮標'
      : '📡【投擲被動聲納浮標】左鍵點擊海域佈放 (Shift 連續插眼 · 右鍵/ESC 取消)',
    pos.x,
    pos.y - 32
  );
  if (!isLegacyEra) {
    ctx.fillStyle = '#80DEEA';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`監聽半徑 ${radius}m · 間歇水聽暴露通過之敵軍潛艦`, pos.x, pos.y + 42);
  }
  ctx.shadowBlur = 0;

  ctx.restore();
}

// Right-click RTS Tactical Order Confirmation Ripples
export function drawOrderMarkers(rc: RenderContext, markers: OrderMarker[], camera: Camera) {
  if (!markers || markers.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const m of markers) {
    const progress = Math.max(0, Math.min(1, m.age / m.maxAge));
    const alpha = (1 - progress) * 0.9;
    const color =
      m.type === 'attack'
        ? `rgba(255, 82, 82, ${alpha})`
        : m.type === 'patrol'
        ? `rgba(0, 229, 255, ${alpha})`
        : m.type === 'rescue'
        ? `rgba(255, 213, 79, ${alpha})`
        : `rgba(0, 230, 118, ${alpha})`;

    const radius = m.type === 'attack' ? 32 - progress * 18 : 10 + progress * 34;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 / Math.max(0.4, camera.zoom);
    ctx.beginPath();
    ctx.arc(m.pos.x, m.pos.y, Math.max(6, radius), 0, Math.PI * 2);
    ctx.stroke();

    // Inner crisp vector ticks
    const tick = 10 / Math.max(0.45, camera.zoom);
    ctx.beginPath();
    ctx.moveTo(m.pos.x - tick, m.pos.y);
    ctx.lineTo(m.pos.x + tick, m.pos.y);
    ctx.moveTo(m.pos.x, m.pos.y - tick);
    ctx.lineTo(m.pos.x, m.pos.y + tick);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Radar coverage layer: for each radar, the low-level coverage (filled outline: where a strike at
 * ~300 m would be seen, with terrain shadows and the radar horizon cut out) and the dashed
 * high-altitude ring. Friendly sensors cyan, known enemy radars red.
 */
export function drawRadarCoverage(rc: RenderContext, coverage: RadarCoverage[], camera: Camera): void {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  for (const enemy of [false, true]) {
    const list = coverage.filter((c) => c.enemy === enemy && isWorldCircleVisible(rc, c.pos.x, c.pos.y, c.highRadius, camera));
    if (list.length === 0) continue;
    const rgb = enemy ? '255, 82, 82' : '0, 229, 255';
    // Low-level coverage: one path for the whole side, filled once, so overlaps do not darken
    ctx.beginPath();
    for (const c of list) {
      c.low.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
    }
    ctx.fillStyle = `rgba(${rgb}, 0.07)`;
    ctx.fill('nonzero');
    ctx.strokeStyle = `rgba(${rgb}, 0.28)`;
    ctx.lineWidth = 1 / camera.zoom;
    ctx.stroke();
    // High-altitude rings: one per cluster (a task force shows the ring of its best radar)
    const kept: RadarCoverage[] = [];
    for (const c of [...list].sort((x, y) => y.highRadius - x.highRadius)) {
      if (kept.some((k) => Math.hypot(k.pos.x - c.pos.x, k.pos.y - c.pos.y) < 600 && k.highRadius >= c.highRadius * 0.9)) continue;
      kept.push(c);
    }
    ctx.setLineDash([10 / camera.zoom, 8 / camera.zoom]);
    ctx.strokeStyle = `rgba(${rgb}, 0.38)`;
    ctx.lineWidth = 1.4 / camera.zoom;
    for (const c of kept) {
      ctx.beginPath();
      ctx.arc(c.pos.x, c.pos.y, c.highRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (camera.zoom >= 0.12) {
      ctx.font = `${Math.round(10 / camera.zoom)}px monospace`;
      ctx.fillStyle = `rgba(${rgb}, 0.9)`;
      ctx.textAlign = 'center';
      for (const c of kept) ctx.fillText(`📡 ${c.rangeKm}km`, c.pos.x, c.pos.y - c.highRadius - 6 / camera.zoom);
    }
  }
  ctx.restore();
}
