import { GroundUnit } from '../../types/game';
import { drawGroundSilhouette, GROUND_SILHOUETTE_SCALE, groundSilhouetteClass } from '../unitPreviewRenderer';
import { RenderContext, Camera, isWorldCircleVisible } from './context';
import { blitSprite, blitText } from './spriteCache';
import { drawUnitSelectionRing } from './ships';
import { drawGroundDust } from './unitDetails';
import { Affiliation, app6Function, app6Mobility, drawApp6, Echelon } from './app6';

// Draw Ground Units (USMC Infantry, LVT Amphibious, Armor, and OPFOR Ambush squads)
export function drawGroundUnits(rc: RenderContext, groundUnits: GroundUnit[], camera: Camera, selectedUnitIds: string[]) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const unit of groundUnits) {
    if (unit.isDestroyed || unit.embarkedInShipId) continue;
    // Off-screen units draw nothing (the labels reach ~70 units above, range rings further)
    const isSelectedEarly = selectedUnitIds.includes(unit.id);
    if (!isSelectedEarly && !isWorldCircleVisible(rc, unit.pos.x, unit.pos.y, 90, camera)) continue;

    const isSelected = isSelectedEarly;
    const isPlayer = unit.side !== 'enemy'; // allied formations use the friendly palette

    // Waypoint path if moving
    if (isSelected && unit.order.targetPos && unit.order.type === 'move') {
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(unit.pos.x, unit.pos.y);
      // The terrain route (roads, bridges, around obstacles) when one was planned
      const wps = unit.order.waypoints;
      for (let k = unit.order.activeWaypointIndex ?? 0; wps && k < wps.length; k++) ctx.lineTo(wps[k].x, wps[k].y);
      ctx.lineTo(unit.order.targetPos.x, unit.order.targetPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(unit.pos.x, unit.pos.y);

    // 0. Physical Top-Down Vehicle / Fireteam Silhouette underneath NATO frame
    const moveHeading = unit.order.targetPos
      ? Math.atan2(unit.order.targetPos.y - unit.pos.y, unit.order.targetPos.x - unit.pos.x)
      : isPlayer
      ? 0
      : Math.PI;
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(moveHeading);
    // Soft ground contact shadow for crisp silhouette pop over island terrain
    // Same scale as the equipment drawn inside installations (see GROUND_SILHOUETTE_SCALE)
    const silClass = groundSilhouetteClass(unit.type);
    const scale = GROUND_SILHOUETTE_SCALE[silClass];
    if (silClass !== 'infantry' && silClass !== 'mortar' && silClass !== 'atgm') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(-1, 1.5, 12.5 * scale, 7.9 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawGroundDust(rc, unit, scale);
    const palette = unit.side === 'allied' ? 'allied' : isPlayer;
    blitSprite(ctx, `G|${unit.type}|${palette}|${scale}`, 48, (c) => drawGroundSilhouette(c, unit.type, palette, scale));
    ctx.restore();

    // 1. NATO APP-6 Tactical Frame (藍色長方形 友軍 vs 紅色菱形 敵軍)
    const midY = -20;

    // If unit is in Banzai Charge, render pulsating flaming spikes around the frame
    if (unit.isBanzaiCharging) {
      const spikePulse = (Math.sin(rc.time * 12) + 1) * 0.5;
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.7 + spikePulse * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4 + rc.time * 2;
        const r1 = 18;
        const r2 = 26 + spikePulse * 6;
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
      }
      ctx.stroke();
    }

    // NATO APP-6 symbol: affiliation frame, function icon, echelon above, mobility below
    const affiliation: Affiliation = unit.side === 'enemy' ? 'hostile' : unit.side === 'neutral' ? 'neutral' : 'friend';
    const fn = app6Function(unit.type);
    const echelon: Echelon = (unit.echelon as Echelon | undefined) ?? (unit.type.includes('bn') ? 'battalion' : unit.type.includes('company') ? 'company' : 'platoon');
    ctx.save();
    ctx.translate(0, midY);
    const mobility = app6Mobility(unit.type, fn);
    const dim = !!unit.isPinned;
    const fill = unit.side === 'allied' ? '#8BE38B' : undefined;
    blitSprite(ctx, `A|${affiliation}|${fn}|${echelon}|${mobility}|${dim}|${fill}`, 30, (c) => drawApp6(c, { affiliation, fn, echelon, mobility, dim, fill }));
    ctx.restore();

    // 5. 陸軍雙參數系統 (Dual Parameters): 組織度 (ORG 綠/黃/紅) 與 建制度 (STR 藍/橙)
    const orgPct = Math.max(0, Math.min(1, (unit.organization ?? 100) / 100));
    const strPct = Math.max(0, Math.min(1, (unit.strength ?? 100) / 100));
    const barW = 32;

    // Background plate
    ctx.fillStyle = 'rgba(4, 12, 22, 0.88)';
    ctx.fillRect(-barW / 2 - 1, 16, barW + 2, 7.5);
    ctx.strokeStyle = '#1E3A5F';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-barW / 2 - 1, 16, barW + 2, 7.5);

    // Bar 1: 組織度 ORG (綠色 / 混亂時黃色 / 崩潰時紅色)
    ctx.fillStyle = orgPct > 0.45 ? '#00E676' : orgPct > 0.2 ? '#FFD54F' : '#FF1744';
    ctx.fillRect(-barW / 2, 17, barW * orgPct, 2.5);

    // Bar 2: 建制度 STR (鋼藍色 / 受損時橙色)
    ctx.fillStyle = strPct > 0.5 ? '#00E5FF' : '#FF9100';
    ctx.fillRect(-barW / 2, 20.2, barW * strPct, 2.5);

    // Bar 3: 火力壓制條 SUPPRESSION (受擊壓制時顯示紅/琥珀色進度條)
    if (unit.suppression && unit.suppression > 5) {
      const suppPct = Math.min(1, unit.suppression / 100);
      ctx.fillStyle = unit.suppression >= 50 ? '#FF1744' : '#FF9100';
      ctx.fillRect(-barW / 2, 23.4, barW * suppPct, 2.2);
    }

    // 6. Tactical Status Badges & Unit Name (保留純粹洗鍊 NATO 圖標，僅在選中或極端狀態下顯示戰術標籤)
    if (unit.isInUrbanCover) {
      ctx.fillStyle = '#00E5FF';
      blitText(ctx, '🛡️ [URBAN 掩體 -70%航彈 -50%直射]', 'bold 7.5px monospace', ctx.fillStyle as string, 0, isSelected ? -46 : -36);
    }

    // 火力壓制警示標籤 (Progressive Suppression Badges)
    if (unit.suppression && unit.suppression >= 20) {
      const spdPenalty = Math.round((0.30 + (unit.suppression / 100) * 0.50) * 100);
      if (unit.suppression >= 50 || unit.isPinned) {
        ctx.fillStyle = '#FF1744';
        blitText(ctx, `🛑【重度壓制 PINNED -${spdPenalty}% SPD】`, 'bold 8px monospace', ctx.fillStyle as string, 0, isSelected ? -55 : -43);
      } else {
        ctx.fillStyle = '#FF9100';
        blitText(ctx, `⚠️【火力壓制 SUPPRESSED -${spdPenalty}% SPD】`, 'bold 8px monospace', ctx.fillStyle as string, 0, isSelected ? -55 : -43);
      }
    }

    // 反砲擊雷達火控鎖定 (Counter-Battery Radar Lock)
    if (unit.isCounterBatteryFiring) {
      ctx.fillStyle = '#FF1744';
      blitText(ctx, '📡🎯【反砲擊火控雷達鎖定 COUNTER-BATTERY】', 'bold 8.5px monospace', ctx.fillStyle as string, 0, isSelected ? -65 : -53);
      const pingR = (Math.sin(rc.time * 10) + 1) * 6 + 14;
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, midY, pingR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isSelected || unit.isBanzaiCharging || unit.isSurrendered || unit.disorganized) {

      if (unit.isSurrendered) {
        ctx.fillStyle = '#FFFFFF';
        blitText(ctx, '🏳️【已降 SURRENDER】', 'bold 8.5px monospace', ctx.fillStyle as string, 0, -35);
      } else if (unit.isBanzaiCharging) {
        ctx.fillStyle = '#FF1744';
        blitText(ctx, '🔥【萬歲衝鋒 BANZAI】', 'bold 8.5px monospace', ctx.fillStyle as string, 0, -35);
      } else if (unit.disorganized) {
        ctx.fillStyle = '#FFD54F';
        blitText(ctx, '⚠️【混亂壓制 DISORGANIZED】', 'bold 8.5px monospace', ctx.fillStyle as string, 0, -35);
      } else {
        ctx.fillStyle = unit.side === 'allied' ? '#B9F6CA' : isPlayer ? '#90CAF9' : '#FFAB91';
        blitText(ctx, unit.name, 'bold 8.5px monospace', ctx.fillStyle as string, 0, -35);
      }

      // 僅在選中時顯示詳細補給與數值，平時維持最高戰術地圖專業可讀性
      if (isSelected) {
        ctx.fillStyle = unit.isSupplied ? '#00E676' : '#FF5252';
        blitText(ctx, `ORG ${Math.round(orgPct * 100)}% · STR ${Math.round(strPct * 100)}% ${unit.isSupplied ? '[補給通]' : '[斷補]'}`, 'bold 7px monospace', ctx.fillStyle as string, 0, 32);
      }
    }

    ctx.restore();

    // Selection ring & Weapon range
    if (isSelected) {
      drawUnitSelectionRing(rc, unit.pos, 22);

      if (unit.range > 0) {
        ctx.strokeStyle = 'rgba(255, 213, 79, 0.28)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(unit.pos.x, unit.pos.y, unit.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  ctx.restore();
}
