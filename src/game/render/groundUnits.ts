import { GroundUnit } from '../../types/game';
import { drawGroundSilhouette, GROUND_SILHOUETTE_SCALE, groundSilhouetteClass } from '../unitPreviewRenderer';
import { RenderContext, Camera } from './context';
import { drawUnitSelectionRing } from './ships';
import { drawGroundDust } from './unitDetails';

// Draw Ground Units (USMC Infantry, LVT Amphibious, Armor, and OPFOR Ambush squads)
export function drawGroundUnits(rc: RenderContext, groundUnits: GroundUnit[], camera: Camera, selectedUnitIds: string[]) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const unit of groundUnits) {
    if (unit.isDestroyed || unit.embarkedInShipId) continue;

    const isSelected = selectedUnitIds.includes(unit.id);
    const isPlayer = unit.side === 'player';

    // Waypoint path if moving
    if (isSelected && unit.order.targetPos && unit.order.type === 'move') {
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(unit.pos.x, unit.pos.y);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    // Same scale as the equipment drawn inside installations (see GROUND_SILHOUETTE_SCALE)
    const scale = GROUND_SILHOUETTE_SCALE[groundSilhouetteClass(unit.type)];
    ctx.ellipse(-1, 1.5, 12.5 * scale, 7.9 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    drawGroundDust(rc, unit, scale);
    drawGroundSilhouette(ctx, unit.type, isPlayer, scale);
    ctx.restore();

    // 1. NATO APP-6 Tactical Frame (藍色長方形 友軍 vs 紅色菱形 敵軍)
    const isHostile = !isPlayer;
    const midY = -20;
    const boxW = 25;
    const boxH = 14;
    const frameColor = isPlayer ? '#42A5F5' : '#FF5252';
    const frameFill = isPlayer ? 'rgba(13, 71, 161, 0.72)' : 'rgba(183, 28, 28, 0.72)';

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

    ctx.fillStyle = frameFill;
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;

    if (isHostile) {
      // NATO APP-6 敵軍菱形邊框 (Hostile Diamond Frame)
      ctx.beginPath();
      ctx.moveTo(0, midY - 10);
      ctx.lineTo(12, midY);
      ctx.lineTo(0, midY + 10);
      ctx.lineTo(-12, midY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // NATO APP-6 友軍長方形邊框 (Friendly Rectangle Frame)
      ctx.fillRect(-boxW / 2, midY - boxH / 2, boxW, boxH);
      ctx.strokeRect(-boxW / 2, midY - boxH / 2, boxW, boxH);
    }

    // 2. NATO APP-6 Echelon Level (框頂編制符號: 排 ••• / 連 | / 營 ||)
    const topY = isHostile ? midY - 13 : midY - boxH / 2 - 3;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';

    const echelon = unit.echelon || (unit.type.includes('bn') || unit.type.includes('tank_bn') ? 'battalion' : unit.type.includes('company') ? 'company' : 'platoon');
    if (echelon === 'battalion') {
      // 營級 (Battalion / Regiment): 雙垂直線 "||"
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-3, topY - 5);
      ctx.lineTo(-3, topY);
      ctx.moveTo(3, topY - 5);
      ctx.lineTo(3, topY);
      ctx.stroke();
    } else if (echelon === 'company' || echelon === 'battery') {
      // 連/砲兵連級 (Company / Battery): 單垂直線 "|"
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, topY - 5);
      ctx.lineTo(0, topY);
      ctx.stroke();
    } else {
      // 排級 (Platoon): 三實心圓點 "•••"
      ctx.beginPath();
      ctx.arc(-5, topY - 2.5, 1.6, 0, Math.PI * 2);
      ctx.arc(0, topY - 2.5, 1.6, 0, Math.PI * 2);
      ctx.arc(5, topY - 2.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. NATO APP-6 兵種符號 (Inside Frame Function Symbol)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;

    if (unit.type.includes('scud') || unit.type.includes('ssm') || unit.type.includes('ballistic') || unit.type.includes('atacms')) {
      // 戰術地對地/彈道飛彈 (Tactical SSM / SCUD / ATACMS): 向上衝天飛彈箭頭與助推器
      ctx.beginPath();
      ctx.moveTo(0, midY - 7);
      ctx.lineTo(-3, midY - 3);
      ctx.lineTo(-1.5, midY - 3);
      ctx.lineTo(-1.5, midY + 5);
      ctx.lineTo(-4, midY + 7);
      ctx.moveTo(0, midY - 7);
      ctx.lineTo(3, midY - 3);
      ctx.lineTo(1.5, midY - 3);
      ctx.lineTo(1.5, midY + 5);
      ctx.lineTo(4, midY + 7);
      ctx.stroke();
    } else if (unit.type.includes('mlrs') || unit.type.includes('grad') || unit.type.includes('uragan') || unit.type.includes('calliope')) {
      // 多管火箭砲兵 (Multiple Launch Rocket System / MLRS / Calliope): 砲兵核心圓點 + 雙向齊射傾斜火箭箭頭
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, midY, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, midY + 4);
      ctx.lineTo(-2.5, midY - 4);
      ctx.lineTo(-5, midY - 4);
      ctx.moveTo(7, midY + 4);
      ctx.lineTo(2.5, midY - 4);
      ctx.lineTo(5, midY - 4);
      ctx.stroke();
    } else if (unit.type.includes('atgm') || unit.type.includes('tow') || unit.type.includes('anti_tank')) {
      // 反戰車飛彈 / 拖式 (Anti-Tank / ATGM): 倒 V 形尖頂飛彈射擊符號
      ctx.beginPath();
      ctx.moveTo(-7, midY + 4);
      ctx.lineTo(0, midY - 5);
      ctx.lineTo(7, midY + 4);
      ctx.stroke();
      // Horizontal cross arrow
      ctx.beginPath();
      ctx.moveTo(0, midY - 5);
      ctx.lineTo(0, midY + 4);
      ctx.stroke();
    } else if (unit.type.includes('lvt') || unit.type.includes('mech') || unit.type.includes('bradley') || unit.type.includes('bmp') || unit.type.includes('m113')) {
      // 機械化步兵/兩棲 (Mechanized Infantry): 履帶橢圓內嵌步兵交叉 "X"
      ctx.beginPath();
      ctx.ellipse(0, midY, isHostile ? 8 : 9.5, isHostile ? 4 : 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4.5, midY - 2.5);
      ctx.lineTo(4.5, midY + 2.5);
      ctx.moveTo(4.5, midY - 2.5);
      ctx.lineTo(-4.5, midY + 2.5);
      ctx.stroke();
    } else if (unit.type.includes('armor') || unit.type.includes('tank') || unit.type.includes('abrams') || unit.type.includes('t72') || unit.type.includes('t62') || unit.type.includes('t55') || unit.type.includes('m60') || unit.type.includes('patton') || unit.type.includes('t34')) {
      // 裝甲主力戰車 (Main Battle Tank / Armor): 裝甲履帶橢圓 "⬭"
      ctx.beginPath();
      ctx.ellipse(0, midY, isHostile ? 7.5 : 9, isHostile ? 3.8 : 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (
      unit.type.includes('chaparral') ||
      unit.type.includes('sam') ||
      unit.type.includes('sa6') ||
      unit.type.includes('sa8') ||
      unit.type.includes('sa9') ||
      unit.type.includes('sa11') ||
      unit.type.includes('sa15') ||
      unit.type.includes('strela')
    ) {
      // 野戰防空飛彈 (Mobile SAM Air Defense): 穹門防空頂 + 向上飛彈發射箭頭
      ctx.beginPath();
      ctx.arc(0, midY + 4, 6, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, midY + 4);
      ctx.lineTo(0, midY - 6);
      ctx.lineTo(-2.5, midY - 3);
      ctx.moveTo(0, midY - 6);
      ctx.lineTo(2.5, midY - 3);
      ctx.stroke();
    } else if (
      unit.type.includes('flak') ||
      unit.type.includes('aa') ||
      unit.type.includes('shilka') ||
      unit.type.includes('zsu') ||
      unit.type.includes('btr_zd') ||
      unit.type.includes('tunguska')
    ) {
      // 防空高射砲 (Air Defense / Flak / SPAAG): 圓頂穹頂穹門 "⌒"
      ctx.beginPath();
      ctx.arc(0, midY + 3, 5, Math.PI, 0);
      ctx.stroke();
    } else if (unit.type.includes('mortar')) {
      // 迫擊砲 (Mortar): 倒 V 形迫砲帶圓彈 "▲."
      ctx.beginPath();
      ctx.moveTo(-5, midY + 4);
      ctx.lineTo(0, midY - 2);
      ctx.lineTo(5, midY + 4);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, midY + 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (unit.isSPG || unit.type.includes('spg') || unit.type.includes('paladin') || unit.type.includes('priest') || unit.type.includes('hummel') || unit.type.includes('m109') || unit.type.includes('2s1') || unit.type.includes('2s3') || unit.type.includes('2s19') || unit.type.includes('su100')) {
      // 自走砲 (Self-Propelled Gun / SPG): 裝甲履帶橢圓 "⬭" + 中央實心砲彈圓點 "●"
      ctx.beginPath();
      ctx.ellipse(0, midY, isHostile ? 7.5 : 9, isHostile ? 3.8 : 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, midY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (unit.type.includes('artillery') || unit.type.includes('howitzer')) {
      // 野戰牽引重砲兵 (Towed Field Artillery): 中央實心砲彈圓點 "●"
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, midY, 3.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (unit.type.includes('rifle') || unit.type.includes('ambush') || unit.type.includes('patrol') || unit.type.includes('infantry') || unit.type.includes('marine')) {
      // 輕步兵 (Infantry): 對角交叉線 "X"
      const xOffset = isHostile ? 7 : 10;
      const yOffset = isHostile ? 5.5 : 6;
      ctx.beginPath();
      ctx.moveTo(-xOffset, midY - yOffset);
      ctx.lineTo(xOffset, midY + yOffset);
      ctx.moveTo(xOffset, midY - yOffset);
      ctx.lineTo(-xOffset, midY + yOffset);
      ctx.stroke();
    } else if (unit.type === 'usmc_engineer') {
      // 戰鬥工兵 (Combat Engineer): 工兵工程橫樑拱門 "E"
      ctx.beginPath();
      ctx.moveTo(-6, midY + 4);
      ctx.lineTo(-6, midY - 3);
      ctx.lineTo(6, midY - 3);
      ctx.lineTo(6, midY + 4);
      ctx.moveTo(-6, midY - 3);
      ctx.lineTo(0, midY + 2);
      ctx.lineTo(6, midY - 3);
      ctx.stroke();
    } else {
      // 偵察部隊 (Recon): 單斜線 "/"
      ctx.beginPath();
      ctx.moveTo(-5, midY + 4);
      ctx.lineTo(5, midY - 4);
      ctx.stroke();
    }

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
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00E5FF';
      ctx.fillText('🛡️ [URBAN 掩體 -70%航彈 -50%直射]', 0, isSelected ? -46 : -36);
    }

    // 火力壓制警示標籤 (Progressive Suppression Badges)
    if (unit.suppression && unit.suppression >= 20) {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      const spdPenalty = Math.round((0.30 + (unit.suppression / 100) * 0.50) * 100);
      if (unit.suppression >= 50 || unit.isPinned) {
        ctx.fillStyle = '#FF1744';
        ctx.fillText(`🛑【重度壓制 PINNED -${spdPenalty}% SPD】`, 0, isSelected ? -55 : -43);
      } else {
        ctx.fillStyle = '#FF9100';
        ctx.fillText(`⚠️【火力壓制 SUPPRESSED -${spdPenalty}% SPD】`, 0, isSelected ? -55 : -43);
      }
    }

    // 反砲擊雷達火控鎖定 (Counter-Battery Radar Lock)
    if (unit.isCounterBatteryFiring) {
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF1744';
      ctx.fillText('📡🎯【反砲擊火控雷達鎖定 COUNTER-BATTERY】', 0, isSelected ? -65 : -53);
      const pingR = (Math.sin(rc.time * 10) + 1) * 6 + 14;
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, midY, pingR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isSelected || unit.isBanzaiCharging || unit.isSurrendered || unit.disorganized) {
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';

      if (unit.isSurrendered) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('🏳️【已降 SURRENDER】', 0, -35);
      } else if (unit.isBanzaiCharging) {
        ctx.fillStyle = '#FF1744';
        ctx.fillText('🔥【萬歲衝鋒 BANZAI】', 0, -35);
      } else if (unit.disorganized) {
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('⚠️【混亂壓制 DISORGANIZED】', 0, -35);
      } else {
        ctx.fillStyle = isPlayer ? '#90CAF9' : '#FFAB91';
        ctx.fillText(unit.name, 0, -35);
      }

      // 僅在選中時顯示詳細補給與數值，平時維持最高戰術地圖專業可讀性
      if (isSelected) {
        ctx.font = 'bold 7px monospace';
        ctx.fillStyle = unit.isSupplied ? '#00E676' : '#FF5252';
        ctx.fillText(`ORG ${Math.round(orgPct * 100)}% · STR ${Math.round(strPct * 100)}% ${unit.isSupplied ? '[補給通]' : '[斷補]'}`, 0, 32);
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
