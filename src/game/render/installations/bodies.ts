// Per-type installation artwork. Each drawer runs with the canvas translated to the installation's position.
import { Era, Installation, InstallationType, Island } from '../../../types/game';
import { drawBunkerSite, drawCacheSite, drawCoastalGunSite, drawFanSongSite, drawFerrySite, drawRadarSite, drawRadioSite, drawSamBatterySite, drawTunnelSite, drawWatchtowerSite } from './groundSites';
import { drawCivilWharf, drawCopraPlantation, drawFactory, drawPagoda, drawPowerPlant, drawSugarMill } from './civilEconomy';
import { drawAirfieldSite, drawMajorPortSite, drawPontoonPierSite, drawRailStationSite, drawRepairDockSite } from './aviationPorts';
import { drawAmmoDepotSite, drawBattalionCpSite, drawCivilHospitalSite, drawCommandPostSite, drawFieldHospitalSite, drawMotorPoolSite, drawSupplyDepotSite } from './support';
import { RenderContext } from '../context';
import { drawGroundSilhouette, GROUND_SILHOUETTE_SCALE, groundSilhouetteClass } from '../../unitPreviewRenderer';
import { InstallationStyle } from './style';
import { drawSettlementStage } from './settlementArt';

/** Draws the type-specific body of one installation in its local frame. */
export type InstallationDrawer = (rc: RenderContext, inst: Installation, style: InstallationStyle, island?: Island) => void;





function drawInfantrySquad(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 步兵班 (APP-6 Infantry Squad: Tactical Box + X + Squad Dot) ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-12, -26, 24, 15);
  ctx.fillRect(-12, -26, 24, 15);

  // NATO 步兵符號: 對角交叉交叉線 "X"
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -26);
  ctx.lineTo(12, -11);
  ctx.moveTo(12, -26);
  ctx.lineTo(-12, -11);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 單點 "●" 代表 步兵班 Squad)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -29, 2, 0, Math.PI * 2);
  ctx.fill();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'infantry_squad', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('infantry_squad', isPlayer, rc.era), 0, -33);
}

function drawInfantryPlatoon(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 步兵排 (APP-6 Infantry Platoon: Tactical Box + X + Platoon 3 Pips) ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-13, -28, 26, 16);
  ctx.fillRect(-13, -28, 26, 16);

  // NATO 步兵符號: 對角交叉線 "X"
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-13, -28);
  ctx.lineTo(13, -12);
  ctx.moveTo(13, -28);
  ctx.lineTo(-13, -12);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 三點 "●●●" 代表 步兵排 Platoon)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-5, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(0, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -31, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'infantry_platoon', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('infantry_platoon', isPlayer, rc.era), 0, -35);
}

function drawTankPlatoon(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 戰車排 (APP-6 Tank Platoon: Tactical Box + Armor Oval + 3 Pips) ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -28, 28, 16);
  ctx.fillRect(-14, -28, 28, 16);

  // NATO 裝甲/戰車符號: 橫向橢圓賽道符號 "⬭" (Armor Track Oval)
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -20, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 三點 "●●●" 代表 戰車排 Platoon)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-5, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(0, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -31, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'tank_platoon', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('tank_platoon', isPlayer, rc.era), 0, -35);

}

function drawTankBattalion(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 戰車大隊 (APP-6 Tank Battalion: Tactical Box + Armor Oval + 2 Ticks "||") ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-16, -30, 32, 17);
  ctx.fillRect(-16, -30, 32, 17);

  // NATO 裝甲符號: 橫向橢圓 "⬭"
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -21.5, 10, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 雙豎條 "||" 代表 戰車大隊/營 Battalion)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3, -37);
  ctx.lineTo(-3, -31);
  ctx.moveTo(3, -37);
  ctx.lineTo(3, -31);
  ctx.stroke();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'tank_battalion', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('tank_battalion', isPlayer, rc.era), 0, -40);
}

function drawTowedArtillery(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 拖曳砲兵陣地 (APP-6 Towed Artillery: Tactical Box + Cannonball Dot "●" + Battery Tick) ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -28, 28, 16);
  ctx.fillRect(-14, -28, 28, 16);

  // NATO 野戰砲兵符號: 中央實心黑色砲彈圓點 "●" (Field Artillery Solid Cannonball)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -20, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // 砲架橫樑示意線
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8, -20);
  ctx.lineTo(8, -20);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 雙點 "●●" 代表 砲兵連 Battery)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-3, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -31, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'towed_artillery', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('towed_artillery', isPlayer, rc.era), 0, -35);
}

function drawFlakBattery(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ NATO 防空高射砲兵連 (APP-6 Air Defense: Tactical Box + Air Dome "⌢") ════
  // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
  ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(183, 28, 28, 0.45)';
  ctx.strokeStyle = isPlayer ? '#42A5F5' : '#FF5252';
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -28, 28, 16);
  ctx.fillRect(-14, -28, 28, 16);

  // NATO 防空符號: 仰角拱頂罩 "⌢" (Air Defense Arch)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -17, 5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -17);
  ctx.lineTo(6, -17);
  ctx.stroke();

  // NATO 編制符號 (頂部中央 雙點 "●●" 代表 防空砲連)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-3, -31, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -31, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. 地面物理工事: historical emplacement layout with era-appropriate silhouettes
  drawEmplacements(ctx, 'flak_battery', isPlayer, rc.era);

  // 標籤
  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FF8A80';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(emplacementLabel('flak_battery', isPlayer, rc.era), 0, -35);
}







function drawPowCamp(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  // ════ 戰俘營 (POW Camp): barbed-wire double fence, corner watchtowers, rows of huts ════
  ctx.fillStyle = 'rgba(96, 84, 62, 0.75)';
  ctx.fillRect(-30, -22, 60, 44);
  // Double fence with the wire between
  ctx.strokeStyle = 'rgba(200, 200, 190, 0.85)';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([2, 1.5]);
  ctx.strokeRect(-30, -22, 60, 44);
  ctx.strokeRect(-26, -18, 52, 36);
  ctx.setLineDash([]);
  // Huts in two rows
  ctx.fillStyle = '#5D4037';
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 0.6;
  for (const y of [-14, 4]) {
    for (const x of [-21, -9, 3, 15]) {
      ctx.fillRect(x, y, 8, 10);
      ctx.strokeRect(x, y, 8, 10);
      ctx.beginPath();
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + 4, y + 10);
      ctx.stroke();
    }
  }
  // Watchtowers at the corners
  ctx.fillStyle = style.isPlayer ? '#1565C0' : '#B71C1C';
  for (const [x, y] of [[-30, -22], [30, -22], [-30, 22], [30, 22]]) {
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  ctx.fillStyle = style.labelColor;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  const n = inst.prisoners ?? 0;
  const wait = inst.prisonersWaiting ? ` (+${inst.prisonersWaiting} 待收容)` : '';
  ctx.fillText(style.isPlayer ? `⛓ [戰俘營] 收押 ${n}/80${wait}` : `⛓ [敵戰俘營] 我方被俘 ${n}/80${wait} · 禁止射擊`, 0, -28);
}


function drawRefugeeCamp(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 戰地難民營 (Refugee Camp: Humanitarian UN / Red Cross Relief Tents) ════
  ctx.fillStyle = 'rgba(30, 40, 50, 0.85)';
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2;
  ctx.strokeRect(-26, -18, 52, 36);
  ctx.fillRect(-26, -18, 52, 36);

  // 人道救援白色/卡其色帳篷群 (4頂尖頂帆布帳篷)
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 1.2;
  for (const tx of [-18, 4]) {
    for (const ty of [-14, 4]) {
      ctx.beginPath();
      ctx.moveTo(tx, ty + 10);
      ctx.lineTo(tx + 7, ty);
      ctx.lineTo(tx + 14, ty + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // 中央聯合國藍色圓徽 + 紅十字人道旗標
  ctx.fillStyle = '#0288D1';
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 紅十字
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(-1.2, -3.2, 2.4, 6.4);
  ctx.fillRect(-3.2, -1.2, 6.4, 2.4);

  ctx.fillStyle = '#FFE082';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⛺【人道救援難民營】誤擊扣政治值`, 0, -26);
}



function drawSa2SamSite(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 敵軍 S-75 德維納 SA-2 / S-125 涅瓦河 SA-3 / S-300PMU SA-10 區域防空飛彈營 ════
  // 1. 環形防護土堤碉堡
  ctx.strokeStyle = inst.type === 'sa3_sam_site' ? '#FF7043' : '#FF5252';
  ctx.fillStyle = 'rgba(62, 39, 35, 0.75)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 4, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (inst.type === 's300_sam_site') {
    // S-300PMU 4連裝垂直冷發射圓筒 TEL (Quad VLS Launch Tubes) + 混凝土防爆坪
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-13, -7, 26, 22);
    ctx.strokeRect(-13, -7, 26, 22);
    ctx.fillStyle = '#455A64';
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 1.5;
    for (const [vx, vy] of [[-6, -1], [6, -1], [-6, 9], [6, 9]]) {
      ctx.beginPath();
      ctx.arc(vx, vy, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFAB40';
      ctx.beginPath();
      ctx.arc(vx, vy, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#455A64';
    }
  } else if (inst.type === 'sa3_sam_site') {
    // 雙聯裝 SA-3 固定旋轉傾斜發射架
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(13, 0);
    ctx.moveTo(-11, 8);
    ctx.lineTo(13, 8);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(15, 0);
    ctx.moveTo(-6, 8);
    ctx.lineTo(15, 8);
    ctx.stroke();

    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(-11, 8);
    ctx.lineTo(-5, 8);
    ctx.stroke();
  } else {
    // 2. 六邊形發射架滑軌 (SA-2 Guideline)
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(14, 4);
    ctx.stroke();

    // 3. 防空飛彈 (銀白彈體 + 紅色助推段)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(16, 4);
    ctx.stroke();

    // 尾部固體助推火箭
    ctx.strokeStyle = '#FF3D00';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(-4, 4);
    ctx.stroke();

    // 十字大型三角翼
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(4, 10);
    ctx.stroke();
  }

  // 標籤
  ctx.fillStyle = inst.type === 'sa3_sam_site' ? '#FFAB91' : '#FF5252';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    inst.type === 's300_sam_site'
      ? '🚀 [S-300PMU 長程區域防空營] SA-10 Grumble (垂直發射)'
      : inst.type === 'sa3_sam_site'
      ? '🚀 [敵軍薩姆-3 飛彈營] S-125 Neva (SA-3 Goa 雙聯低中空攔截)'
      : '🚀 [敵軍薩姆-2 防空飛彈營] SA-2 Guideline',
    0,
    -22
  );
}

function drawCoastalHarpoon(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 友軍岸置魚叉反艦飛彈連 (Coastal Harpoon Battery: Sandbag Berm + Quad Canisters) ════
  ctx.fillStyle = 'rgba(38, 50, 56, 0.85)';
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 1.8;
  ctx.fillRect(-19, -13, 38, 26);
  ctx.strokeRect(-19, -13, 38, 26);
  // 4連裝 Mk-141 發射筒組
  ctx.fillStyle = '#1565C0';
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 1.4;
  for (const cy of [-8.5, -3.5, 1.5, 6.5]) {
    ctx.fillRect(-13, cy - 1.5, 26, 3.2);
    ctx.strokeRect(-13, cy - 1.5, 26, 3.2);
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(10.5, cy - 1.2, 2.2, 2.4);
    ctx.fillStyle = '#1565C0';
  }
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 [NATO 岸置魚叉反艦飛彈連] RGM-84 Harpoon (掠海突防 4500m)', 0, -24);
}

function drawGlcmSite(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 友軍陸基戰斧巡弋飛彈連 (BGM-109G Gryphon TEL + 4-Tube Canister Pod) ════
  ctx.fillStyle = '#1E3A8A';
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2.0;
  ctx.fillRect(-20, -12, 40, 24);
  ctx.strokeRect(-20, -12, 40, 24);
  // Tractor cab + armored quad TEL box
  ctx.fillStyle = '#37474F';
  ctx.fillRect(10, -8, 7, 16);
  ctx.fillStyle = '#1D4ED8';
  ctx.strokeStyle = '#93C5FD';
  ctx.fillRect(-15, -7, 22, 14);
  ctx.strokeRect(-15, -7, 22, 14);
  ctx.fillStyle = '#FFD54F';
  for (const cy of [-4, 0, 4]) {
    ctx.fillRect(-12, cy - 1, 16, 1.8);
  }
  ctx.fillStyle = '#93C5FD';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🎯 [NATO 陸基戰斧巡弋飛彈連] BGM-109G GLCM (TERCOM 6000m)', 0, -24);
}

function drawCoastalRubezh(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 敵軍 4K51 邊界岸置反艦飛彈連 (Coastal Rubezh Twin P-15M/P-21 Armored Tubes) ════
  ctx.fillStyle = '#5F1616';
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2.0;
  ctx.fillRect(-20, -13, 40, 26);
  ctx.strokeRect(-20, -13, 40, 26);
  // Twin massive armored KT-161 canisters + radar mast
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FCA5A5';
  ctx.fillRect(-14, -8.5, 28, 6.5);
  ctx.strokeRect(-14, -8.5, 28, 6.5);
  ctx.fillRect(-14, 2, 28, 6.5);
  ctx.strokeRect(-14, 2, 28, 6.5);
  ctx.fillStyle = '#FF7043';
  ctx.fillRect(11, -7.5, 3, 4.5);
  ctx.fillRect(11, 3, 3, 4.5);
  ctx.fillStyle = '#FCA5A5';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 [華約 4K51 邊界岸防飛彈連] Rubezh (超重型反艦 4800m)', 0, -24);
}

function drawScudSite(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 華約 9K72 飛毛腿-B 戰術彈道飛彈發射營 (Scud-B MAZ-543 TEL) ════
  ctx.fillStyle = '#450A0A';
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2.2;
  ctx.fillRect(-21, -13, 42, 26);
  ctx.strokeRect(-21, -13, 42, 26);
  // MAZ-543 重型 8x8 底盤輪胎 + 雙前置駕駛艙
  ctx.fillStyle = '#111827';
  for (let w = -15; w <= 15; w += 10) {
    ctx.fillRect(w - 3, -16, 6, 3.5);
    ctx.fillRect(w - 3, 12.5, 6, 3.5);
  }
  ctx.fillStyle = '#37474F';
  ctx.fillRect(12, -11, 7, 7);
  ctx.fillRect(12, 4, 7, 7);
  // 豎起之 9M21 重型高爆彈道飛彈 + 尾翼
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#F87171';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, -2.5);
  ctx.lineTo(9, -2.5);
  ctx.lineTo(17, 0);
  ctx.lineTo(9, 2.5);
  ctx.lineTo(-16, 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(-17, -4.5, 3, 9);
  ctx.fillStyle = '#F87171';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 [華約 9K72 飛毛腿-B 戰術飛彈營] Scud-B SSM (6500m)', 0, -24);
}


function drawRubberPlantation(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 橡膠種植園 (Rubber Plantation) ════
  // 1. 種植林蔭地表
  ctx.fillStyle = 'rgba(46, 125, 50, 0.25)';
  ctx.fillRect(-22, -18, 44, 36);
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-22, -18, 44, 36);

  // 2. 整齊排列的橡膠樹冠 (Rows of Rubber Trees)
  for (let rx = -16; rx <= 16; rx += 10) {
    for (let ry = -12; ry <= 12; ry += 12) {
      ctx.fillStyle = '#1B5E20';
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#388E3C';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 3. 中央木製膠乳收購站
  ctx.fillStyle = '#795548';
  ctx.fillRect(-6, -5, 12, 10);
  ctx.strokeStyle = '#D7CCC8';
  ctx.strokeRect(-6, -5, 12, 10);

  // 標籤
  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFE082';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🌲 [${inst.name}]`, 0, -24);
}





type EmplacementKind = 'infantry_squad' | 'infantry_platoon' | 'tank_platoon' | 'tank_battalion' | 'towed_artillery' | 'flak_battery';

/** U-shaped earth revetment open toward the rear, for a vehicle facing north (-y). */
function drawRevetment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = 'rgba(141, 110, 99, 0.9)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.lineTo(x - w / 2, y - h / 2 + 2);
  ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + 2, y - h / 2);
  ctx.lineTo(x + w / 2 - 2, y - h / 2);
  ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.stroke();
}

/** Circular sandbagged gun pit. */
function drawGunPit(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(62, 39, 35, 0.55)';
  ctx.strokeStyle = 'rgba(188, 170, 164, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([1.8, 0.9]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draws a unit silhouette at (x, y), facing north, at the same on-map scale as a manoeuvre
 * unit of that type; `packing` shrinks it for tightly packed layouts such as a battalion laager.
 */
function placeUnit(ctx: CanvasRenderingContext2D, unitType: string, isPlayer: boolean, x: number, y: number, packing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawGroundSilhouette(ctx, unitType, isPlayer, GROUND_SILHOUETTE_SCALE[groundSilhouetteClass(unitType)] * packing);
  ctx.restore();
}

interface EraEquipment {
  rifle: string;
  tank: string;
  gun: string;
  flak: string;
  /** Short designations for the installation label. */
  names: { rifle: string; tank: string; gun: string; flak: string };
}

// Garrison equipment per era: US forces for the player, IJA / KPA-PVA / NVA / Soviet for the enemy.
const EMPLACEMENT_EQUIPMENT: Record<Era, { player: EraEquipment; enemy: EraEquipment }> = {
  era1: {
    player: { rifle: 'usmc_rifle_42', tank: 'usmc_armor_m3', gun: 'usmc_artillery_105', flak: 'opfor_ks19_heavy', names: { rifle: 'M1 Garand / BAR', tank: 'M3 斯圖亞特 37mm', gun: 'M2A1 105mm', flak: 'M2 90mm' } },
    enemy: { rifle: 'opfor_infantry_42', tank: 'opfor_type95_tank', gun: 'opfor_field_artillery', flak: 'opfor_ks19_heavy', names: { rifle: '三八式 / 九六式輕機槍', tank: '九五式輕戰車 37mm', gun: '九一式十糎榴彈砲', flak: '八八式 75mm 高射砲' } },
  },
  era2: {
    player: { rifle: 'usmc_rifle_45', tank: 'usmc_armor_m4', gun: 'usmc_artillery_105', flak: 'opfor_ks19_heavy', names: { rifle: 'M1 Garand / BAR', tank: 'M4 雪曼 75mm', gun: 'M2A1 105mm', flak: 'M2 90mm' } },
    enemy: { rifle: 'opfor_infantry_45', tank: 'opfor_type97_tank', gun: 'opfor_field_artillery', flak: 'opfor_ks19_heavy', names: { rifle: '九九式 / 九六式輕機槍', tank: '九七式中戰車 57mm', gun: '九一式十糎榴彈砲', flak: '八八式 75mm 高射砲' } },
  },
  era3: {
    player: { rifle: 'usmc_korea_rifle', tank: 'usmc_patton_m46', gun: 'usmc_howitzer_155', flak: 'usmc_duster_m42', names: { rifle: 'M1 Garand / BAR', tank: 'M46 巴頓 90mm', gun: 'M114 155mm', flak: 'M42 Duster 40mm' } },
    enemy: { rifle: 'opfor_coldwar_infantry', tank: 'opfor_t34_85', gun: 'opfor_field_artillery', flak: 'opfor_ks19_heavy', names: { rifle: 'PPSh-41 / DP', tank: 'T-34-85 85mm', gun: 'M-30 122mm', flak: 'KS-19 100mm' } },
  },
  era4: {
    player: { rifle: 'us_army_rifle_platoon_65', tank: 'usmc_armor_m48', gun: 'usmc_howitzer_155', flak: 'usmc_duster_m42', names: { rifle: 'M16 / M60', tank: 'M48A3 巴頓 90mm', gun: 'M114 155mm', flak: 'M42 Duster 40mm' } },
    enemy: { rifle: 'opfor_coldwar_infantry', tank: 'opfor_t54_tank', gun: 'opfor_field_artillery', flak: 'opfor_ks19_heavy', names: { rifle: 'AK-47 / RPG-7', tank: 'T-54 100mm', gun: 'M-46 130mm', flak: 'KS-19 100mm' } },
  },
  era5: {
    player: { rifle: 'usmc_rifle_83', tank: 'us_m1ip_abrams', gun: 'us_m198_155', flak: 'us_m163_vads', names: { rifle: 'M16A2 / M249', tank: 'M1IP 艾布蘭 105mm', gun: 'M198 155mm', flak: 'M163 VADS 20mm' } },
    enemy: { rifle: 'opfor_motor_rifle_83', tank: 'opfor_t72b', gun: 'opfor_field_artillery', flak: 'opfor_zsu23_shilka', names: { rifle: 'AK-74 / RPG-7', tank: 'T-72B 125mm', gun: 'D-30 122mm', flak: 'ZSU-23-4 石勒喀河' } },
  },
};

const EMPLACEMENT_TITLES: Record<EmplacementKind, [string, string, keyof EraEquipment['names']]> = {
  infantry_squad: ['[NATO 友軍步兵班 SQD]', '[NATO 步兵班 SQD]', 'rifle'],
  infantry_platoon: ['[NATO 友軍步兵排 PLT]', '[NATO 步兵排 PLT]', 'rifle'],
  tank_platoon: ['[NATO 友軍戰車排 PLT]', '[NATO 戰車排 PLT]', 'tank'],
  tank_battalion: ['[NATO 友軍裝甲大隊 BN]', '[NATO 戰車大隊 BN]', 'tank'],
  towed_artillery: ['[NATO 友軍野戰砲兵連 BTRY]', '[NATO 拖曳砲兵 BTRY]', 'gun'],
  flak_battery: ['[NATO 友軍防空砲連 AA]', '[NATO 防空砲兵連 AA]', 'flak'],
};

function emplacementLabel(kind: EmplacementKind, isPlayer: boolean, era: Era): string {
  const [own, foe, key] = EMPLACEMENT_TITLES[kind];
  const eq = EMPLACEMENT_EQUIPMENT[era][isPlayer ? 'player' : 'enemy'];
  return `${isPlayer ? own : foe} ${eq.names[key]}`;
}

// Garrison layouts with era-appropriate silhouettes.
function drawEmplacements(ctx: CanvasRenderingContext2D, kind: EmplacementKind, isPlayer: boolean, era: Era) {
  const eq = EMPLACEMENT_EQUIPMENT[era][isPlayer ? 'player' : 'enemy'];
  const { rifle, tank, gun } = eq;
  switch (kind) {
    case 'infantry_squad': {
      ctx.strokeStyle = 'rgba(188, 170, 164, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 14, 12, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      placeUnit(ctx, rifle, isPlayer, 0, 10);
      break;
    }
    case 'infantry_platoon': {
      // Zig-zag fire trench with three fireteams along it
      ctx.strokeStyle = 'rgba(62, 39, 35, 0.95)';
      ctx.lineWidth = 3.2;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(-20, 8);
      for (let i = 0; i < 8; i++) ctx.lineTo(-20 + (i + 1) * 5, i % 2 === 0 ? 3 : 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(188, 170, 164, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      for (const x of [-12, 0, 12]) placeUnit(ctx, rifle, isPlayer, x, 12);
      break;
    }
    case 'tank_platoon': {
      for (const x of [-12, 0, 12]) {
        drawRevetment(ctx, x, 9, 10, 16);
        placeUnit(ctx, tank, isPlayer, x, 9);
      }
      break;
    }
    case 'tank_battalion': {
      // Two companies abreast plus a sandbagged command bunker
      for (const [x, y] of [[-15, 4], [-5, 4], [5, 4], [15, 4], [-10, 19], [10, 19]]) {
        drawRevetment(ctx, x, y, 8.5, 13);
        placeUnit(ctx, tank, isPlayer, x, y, 0.82);
      }
      ctx.fillStyle = '#3E4A3D';
      ctx.strokeStyle = 'rgba(188, 170, 164, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-3.5, 15, 7, 7);
      ctx.strokeRect(-3.5, 15, 7, 7);
      break;
    }
    case 'towed_artillery': {
      for (const x of [-15, -5, 5, 15]) {
        drawGunPit(ctx, x, 10, 5);
        placeUnit(ctx, gun, isPlayer, x, 12);
      }
      break;
    }
    case 'flak_battery': {
      // Four heavy AA guns (90mm M2 / Type 88 75mm) on cruciform platforms around the fire director
      for (const [x, y] of [[-11, 3], [11, 3], [-11, 19], [11, 19]]) {
        drawGunPit(ctx, x, y, 6);
        placeUnit(ctx, eq.flak, isPlayer, x, y);
      }
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 11, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 11);
      ctx.lineTo(4, 11);
      ctx.stroke();
      break;
    }
  }
}

// ════ S-75 Dvina (SA-2 Guideline) battery: the "Star of David" layout of six revetted SM-63
// single-rail launchers around the Fan Song fire-control radar, joined by spoke and ring roads ════
function drawSa2Site(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const R = 17;
  const pads = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 3 - Math.PI / 2);
  // Access roads: spokes to each pad and the two interlaced triangles of the ring road
  ctx.strokeStyle = 'rgba(176, 164, 140, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const a of pads) {
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
  }
  for (const start of [0, 1]) {
    for (let k = 0; k < 3; k++) {
      const a = pads[start + k * 2];
      const b = pads[(start + k * 2 + 2) % 6];
      ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.lineTo(Math.cos(b) * R, Math.sin(b) * R);
    }
  }
  ctx.stroke();
  // Revetments (horseshoe berms open toward the centre) with launchers pointing outward
  for (const a of pads) {
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, 4.6, a + Math.PI * 0.75 - Math.PI, a - Math.PI * 0.75 + Math.PI);
    ctx.stroke();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2.5, 0);
    ctx.lineTo(3, 0);
    ctx.stroke();
    // V-750 missile: white body, red booster, cruciform wings
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.strokeStyle = '#FF3D00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-0.8, 0);
    ctx.stroke();
    ctx.restore();
  }
  // Central SNR-75 "Fan Song" radar van with its two scanner antennas
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-3.5, -2.5, 7, 5);
  ctx.strokeRect(-3.5, -2.5, 7, 5);
  ctx.strokeStyle = '#FFAB40';
  ctx.beginPath();
  ctx.moveTo(-1.5, -4.5);
  ctx.lineTo(-1.5, 4.5);
  ctx.moveTo(1.8, -3.5);
  ctx.lineTo(3.8, 3.5);
  ctx.stroke();
  ctx.fillStyle = '#FF5252';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 [敵軍薩姆-2 防空飛彈營] SA-2 Guideline', 0, -26);
}

// ════ S-125 Neva (SA-3 Goa) battery: four 5P73 twin-rail launchers around the SNR-125 "Low Blow" ════
function drawSa3Site(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const R = 13;
  ctx.strokeStyle = 'rgba(176, 164, 140, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  for (const a of [-0.75, 0.75, Math.PI - 0.75, Math.PI + 0.75].map((v) => v - Math.PI / 2)) {
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    for (const off of [-1.2, 1.2]) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-1, off);
      ctx.lineTo(4.5, off);
      ctx.stroke();
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-2.6, off);
      ctx.lineTo(-0.8, off);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF7043';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-3, -3, 6, 6);
  ctx.strokeRect(-3, -3, 6, 6);
  ctx.strokeStyle = '#FFAB40';
  ctx.beginPath();
  ctx.moveTo(-2.5, -4.5);
  ctx.lineTo(2.5, -4.5);
  ctx.moveTo(-4.5, -2.5);
  ctx.lineTo(-4.5, 2.5);
  ctx.stroke();
  ctx.fillStyle = '#FFAB91';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 [敵軍薩姆-3 飛彈營] S-125 Neva (SA-3 Goa)', 0, -22);
}

// ════ Battalion command post: sandbagged command bunker, GP tents, radio mast and unit flag ════

// ════ Forward operating base: HESCO barrier perimeter, helipad, tent rows and parked vehicles ════
function drawForwardFob(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { color, labelColor } = style;
  // HESCO bastion perimeter (filled gabion cells)
  ctx.fillStyle = '#8D7B5A';
  for (let x = -20; x < 20; x += 3) {
    ctx.fillRect(x, -16, 2.6, 2.6);
    ctx.fillRect(x, 13.4, 2.6, 2.6);
  }
  for (let y = -13; y < 13; y += 3) {
    ctx.fillRect(-20, y, 2.6, 2.6);
    ctx.fillRect(17.4, y, 2.6, 2.6);
  }
  // Gate
  ctx.fillStyle = '#1B3A2A';
  ctx.fillRect(17.4, -3, 2.6, 6);
  // Helipad
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-9, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, -7);
  ctx.lineTo(-11, -1);
  ctx.moveTo(-7, -7);
  ctx.lineTo(-7, -1);
  ctx.moveTo(-11, -4);
  ctx.lineTo(-7, -4);
  ctx.stroke();
  // Tent row
  ctx.fillStyle = '#556B2F';
  for (const tx of [2, 8, 14]) ctx.fillRect(tx - 2.5, -11, 5, 7);
  // Parked vehicles
  ctx.fillStyle = '#455A64';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  for (const [vx, vy] of [[0, 6], [7, 6], [-12, 8]]) {
    ctx.fillRect(vx - 2.5, vy - 1.6, 5, 3.2);
    ctx.strokeRect(vx - 2.5, vy - 1.6, 5, 3.2);
  }
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🏕️ [前進作戰基地 FOB]', 0, -22);
}

/** Exhaustive: an InstallationType without artwork is a compile error (it used to render as nothing). */
export const INSTALLATION_DRAWERS: Record<InstallationType, InstallationDrawer> = {
  airfield: drawAirfieldSite,
  coastal_gun: drawCoastalGunSite,
  radar_station: drawRadarSite,
  ammo_depot: drawAmmoDepotSite,
  infantry_squad: drawInfantrySquad,
  infantry_platoon: drawInfantryPlatoon,
  tank_platoon: drawTankPlatoon,
  tank_battalion: drawTankBattalion,
  towed_artillery: drawTowedArtillery,
  flak_battery: drawFlakBattery,
  ship_repair_dock: drawRepairDockSite,
  command_post: drawCommandPostSite,
  hidden_tunnel: drawTunnelSite,
  pontoon_pier: drawPontoonPierSite,
  major_naval_port: drawMajorPortSite,
  supply_depot: drawSupplyDepotSite,
  field_hospital: drawFieldHospitalSite,
  civil_hospital: drawCivilHospitalSite,
  copra_plantation: drawCopraPlantation,
  civil_wharf: drawCivilWharf,
  sugar_mill: drawSugarMill,
  power_plant: drawPowerPlant,
  pagoda: drawPagoda,
  factory: drawFactory,
  motor_pool: drawMotorPoolSite,
  rail_station: drawRailStationSite,
  pow_camp: drawPowCamp,
  city: drawSettlementStage,
  town: drawSettlementStage,
  settlement: drawSettlementStage,
  refugee_camp: drawRefugeeCamp,
  bunker_nest: drawBunkerSite,
  sam_hawk: drawSamBatterySite,
  sam_patriot: drawSamBatterySite,
  sa2_sam_site: drawSa2Site,
  sa3_sam_site: drawSa3Site,
  battalion_cp: drawBattalionCpSite,
  forward_fob: drawForwardFob,
  s300_sam_site: drawSa2SamSite,
  coastal_harpoon: drawCoastalHarpoon,
  glcm_site: drawGlcmSite,
  coastal_rubezh: drawCoastalRubezh,
  scud_site: drawScudSite,
  fan_song_radar: drawFanSongSite,
  rubber_plantation: drawRubberPlantation,
  river_ferry: drawFerrySite,
  radio_station: drawRadioSite,
  ammo_cache: drawCacheSite,
  watchtower: drawWatchtowerSite,
};
