// Per-type installation artwork. Each drawer runs with the canvas translated to the installation's position.
import { Installation, InstallationType, Island } from '../../../types/game';
import { RenderContext } from '../context';
import { InstallationStyle } from './style';

/** Draws the type-specific body of one installation in its local frame. */
export type InstallationDrawer = (rc: RenderContext, inst: Installation, style: InstallationStyle, island?: Island) => void;

function drawAirfield(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, color, labelColor } = style;

  // Runway concrete apron & blast pad shadow
  ctx.fillStyle = 'rgba(2, 8, 16, 0.55)';
  ctx.fillRect(-67, -11, 134, 26);

  ctx.lineWidth = 2;
  ctx.fillStyle = '#0F1C2A';
  ctx.fillRect(-65, -12, 130, 24);
  ctx.strokeRect(-65, -12, 130, 24);

  // Runway threshold piano keys
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  for (const tx of [-61, 55]) {
    for (const ty of [-8, -3, 2, 7]) {
      ctx.fillRect(tx, ty - 1, 6, 2);
    }
  }

  // Centerline dashes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(-48, 0);
  ctx.lineTo(48, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hangar & control tower apron
  ctx.fillStyle = '#182C3E';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.fillRect(10, 15, 16, 13);
  ctx.strokeRect(10, 15, 16, 13);
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(-6, 15, 7, 7);
  ctx.strokeRect(-6, 15, 7, 7);

  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '✈️ [友軍航空基地 AFB]' : '✈️ [敵軍航空基地 AFB]', 0, -18);
}

function drawCoastalGun(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, labelColor } = style;

  const is240mm = inst.name.includes('240mm') || inst.id.includes('240');
  if (is240mm) {
    // M1 240mm "Black Dragon" 重型八角混凝土砲座固定重砲
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const x = Math.cos(a) * 16;
      const y = Math.sin(a) * 16;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = isPlayer ? 'rgba(13, 71, 161, 0.78)' : 'rgba(78, 52, 46, 0.8)';
    ctx.fill();
    ctx.stroke();

    // Gun carriage & dual hydraulic recuperator cylinders
    ctx.fillStyle = isPlayer ? '#546E7A' : '#5D4037';
    ctx.fillRect(-10, -7, 16, 14);
    ctx.strokeRect(-10, -7, 16, 14);

    // Long heavy 240mm barrel + recoil cylinders
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = isPlayer ? '#B2EBF2' : '#FFCDD2';
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(15, -4.5);
    ctx.moveTo(2, 4.5);
    ctx.lineTo(15, 4.5);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isPlayer ? '[友軍重砲] M1 240mm 黑龍' : '[敵軍要塞重砲] 240mm', 0, -24);
  } else {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.65)' : 'rgba(78, 52, 46, 0.75)';
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
    ctx.beginPath();
    ctx.moveTo(4, -3);
    ctx.lineTo(24, -3);
    ctx.moveTo(4, 3);
    ctx.lineTo(24, 3);
    ctx.stroke();

    const caliberMatch = inst.name.match(/\d{3}mm/);
    const calText = caliberMatch ? caliberMatch[0] : (isPlayer ? '155mm' : '140mm');
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isPlayer ? `[友軍岸防砲連] ${calText}` : `[敵軍岸防重砲] ${calText}`, 0, -20);
  }
}

function drawRadarStation(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, labelColor } = style;

  ctx.fillStyle = '#0F2234';
  ctx.lineWidth = 2;
  ctx.fillRect(-10, -10, 20, 20);
  ctx.strokeRect(-10, -10, 20, 20);

  const radarAngle = rc.time * 3;
  // Soft sweep wedge
  ctx.fillStyle = isPlayer ? 'rgba(100, 255, 218, 0.14)' : 'rgba(255, 138, 128, 0.14)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 28, radarAngle - 0.35, radarAngle);
  ctx.closePath();
  ctx.fill();

  // Rotating parabolic dish reflector bar
  ctx.strokeStyle = '#ECEFF1';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-Math.sin(radarAngle) * 7, Math.cos(radarAngle) * 7);
  ctx.lineTo(Math.sin(radarAngle) * 7, -Math.cos(radarAngle) * 7);
  ctx.stroke();

  ctx.strokeStyle = isPlayer ? 'rgba(100, 255, 218, 0.7)' : 'rgba(255, 138, 128, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(radarAngle) * 32, Math.sin(radarAngle) * 32);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[友軍早期電探哨] SCR-270' : '[敵軍防空電探哨] 二一號', 0, -22);
}

function drawAmmoDepot(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, labelColor } = style;

  // Hexagonal sandbagged revetment bunker + fuel/ordnance canisters + hazard diamond
  ctx.lineWidth = 2;
  ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(62, 39, 35, 0.78)';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * 16;
    const y = Math.sin(a) * 16;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner reinforced roof & 3 fuel/ammo drums
  ctx.fillStyle = '#33691E';
  ctx.strokeStyle = '#AED581';
  ctx.lineWidth = 1;
  ctx.fillRect(-8, -6, 7, 5);
  ctx.strokeRect(-8, -6, 7, 5);
  ctx.fillRect(1, -6, 7, 5);
  ctx.strokeRect(1, -6, 7, 5);
  ctx.fillStyle = '#FFA726';
  ctx.beginPath();
  ctx.arc(-4, 4, 2.8, 0, Math.PI * 2);
  ctx.arc(4, 4, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[友軍戰略油彈庫]' : '[敵軍戰略彈藥庫]', 0, -23);
}

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

  // 2. 地面物理工事: 沙袋半月掩體與機槍
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#BCAAA4';
  ctx.fillStyle = 'rgba(78, 52, 46, 0.75)';
  ctx.beginPath();
  ctx.arc(0, 5, 11, -Math.PI * 0.75, Math.PI * 0.75);
  ctx.stroke();
  ctx.fill();

  // 機槍槍身與三腳架
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 5);
  ctx.lineTo(14, 5);
  ctx.moveTo(4, 2);
  ctx.lineTo(4, 8);
  ctx.moveTo(-2, 5);
  ctx.lineTo(-6, 1);
  ctx.moveTo(-2, 5);
  ctx.lineTo(-6, 9);
  ctx.stroke();

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍步兵班 SQD] .30cal' : '[NATO 步兵班 SQD] 7.7mm', 0, -33);
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

  // 2. 地面物理工事: 防禦暗堡與機砲
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#CFD8DC';
  ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.45)' : 'rgba(38, 50, 56, 0.85)';
  ctx.strokeRect(-12, -2, 24, 20);
  ctx.fillRect(-12, -2, 24, 20);

  // 壕溝連接網絡
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.lineTo(-12, 8);
  ctx.moveTo(12, 8);
  ctx.lineTo(20, 12);
  ctx.stroke();

  // 機砲砲身
  ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 5.5);
  ctx.lineTo(17, 5.5);
  ctx.moveTo(0, 10.5);
  ctx.lineTo(17, 10.5);
  ctx.stroke();

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍陸戰步兵排 PLT]' : '[NATO 步兵排 PLT] 20mm', 0, -35);
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

  // 2. 地面物理工事: 戰車車體與戰車砲
  ctx.fillStyle = '#263238';
  ctx.fillRect(-13, 0, 26, 4);
  ctx.fillRect(-13, 14, 26, 4);

  ctx.fillStyle = isPlayer ? '#1B5E20' : '#33691E';
  ctx.strokeStyle = isPlayer ? '#81C784' : '#C5E1A5';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-10, 3, 20, 12);
  ctx.strokeRect(-10, 3, 20, 12);

  // 砲塔與砲身
  ctx.fillStyle = isPlayer ? '#2E7D32' : '#1B5E20';
  ctx.beginPath();
  ctx.arc(2, 9, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(2, 9);
  ctx.lineTo(20, 9);
  ctx.stroke();

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍戰車排 PLT] 75mm' : '[NATO 戰車排 PLT] 47mm', 0, -35);

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

  // 2. 地面物理工事: 裝甲指揮掩體 + 戰車集群
  ctx.fillStyle = isPlayer ? '#1B5E20' : '#263238';
  ctx.strokeStyle = isPlayer ? '#81C784' : '#90A4AE';
  ctx.lineWidth = 1.6;
  ctx.fillRect(-14, 2, 28, 16);
  ctx.strokeRect(-14, 2, 28, 16);

  // 無線電通訊天線
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, 2);
  ctx.lineTo(-8, -10);
  ctx.lineTo(-5, -14);
  ctx.stroke();

  // 戰車砲身
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, 10);
  ctx.lineTo(22, 10);
  ctx.stroke();

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍裝甲大隊 BN] 重裝甲' : '[NATO 戰車大隊 BN] 重裝甲', 0, -40);
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

  // 2. 地面物理工事: 野戰重砲 (雙腳開腳大架、防盾與砲管)
  // 防盾
  ctx.strokeStyle = isPlayer ? '#90CAF9' : '#B0BEC5';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(2, 18);
  ctx.stroke();

  // 長身管砲身與制退器
  ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FFCA28';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(22, 10);
  ctx.stroke();

  // 雙腳開腳駐鋤 (Trail Legs)
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-12, 3);
  ctx.moveTo(0, 10);
  ctx.lineTo(-12, 17);
  ctx.stroke();

  // 彈藥箱與砲彈堆
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-14, 8, 4, 4);

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍野戰砲兵連 BTRY] 105mm' : '[NATO 拖曳砲兵 BTRY] 75mm', 0, -35);
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

  // 2. 地面物理工事: 友軍 90mm M2 / 敵軍 八八式 75mm 重型高射砲
  ctx.strokeStyle = isPlayer ? '#64B5F6' : '#78909C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.lineTo(8, 10);
  ctx.moveTo(0, 2);
  ctx.lineTo(0, 18);
  ctx.stroke();

  // 旋轉圓盤
  ctx.fillStyle = isPlayer ? '#1E3A5F' : '#37474F';
  ctx.beginPath();
  ctx.arc(0, 10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 高仰角防空砲管
  ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(16, 2);
  ctx.stroke();

  // 標籤
  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FF8A80';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '[NATO 友軍防空砲連 AA] 90mm M2' : '[NATO 防空砲兵連 AA] 75mm', 0, -35);
}

function drawShipRepairDock(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ NATO 船舶維修設施 / 應急修船浮塢 (Ship Repair Facility & Floating Drydock) ════
  // 1. NATO APP-6 Maintenance Tactical Box Frame (友軍藍戰術框 + 扳手維修符號)
  ctx.fillStyle = 'rgba(21, 101, 192, 0.55)';
  ctx.strokeStyle = '#42A5F5';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-18, -32, 36, 18);
  ctx.fillRect(-18, -32, 36, 18);

  // NATO 維修符號: 交叉工具
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-9, -27);
  ctx.lineTo(9, -15);
  ctx.moveTo(9, -27);
  ctx.lineTo(-9, -15);
  ctx.stroke();

  // "REP" 標記
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REP', 0, -18);

  // 2. 地面與水域物理設施: 巨大浮動修船塢槽 (Floating U-Drydock Basin) + 起重機桁架 + 焊接閃光
  ctx.fillStyle = '#1A2938';
  ctx.strokeStyle = '#42A5F5';
  ctx.lineWidth = 2;
  ctx.strokeRect(-24, -12, 10, 48);
  ctx.fillRect(-24, -12, 10, 48);
  ctx.strokeRect(14, -12, 10, 48);
  ctx.fillRect(14, -12, 10, 48);

  // 塢底基座
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-24, 36);
  ctx.lineTo(24, 36);
  ctx.stroke();

  // 浮動船塢水槽
  ctx.fillStyle = 'rgba(3, 169, 244, 0.2)';
  ctx.fillRect(-14, -12, 28, 48);

  // 旋臂造船起重機
  const craneRot = rc.time * 0.8;
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-19, 0);
  ctx.lineTo(-19 + Math.cos(craneRot) * 18, Math.sin(craneRot) * 18);
  ctx.stroke();

  // 電銲搶修動態火花
  const weldFlash = (Math.sin(rc.time * 16) + 1) * 0.5;
  ctx.fillStyle = `rgba(128, 222, 234, ${0.4 + weldFlash * 0.5})`;
  ctx.beginPath();
  ctx.arc(0, 12, 5 + weldFlash * 4, 0, Math.PI * 2);
  ctx.fill();

  // 標籤
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓ [NATO 友軍船塢 REPAIR] 應急損管修船廠', 0, -38);
}

function drawCommandPost(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer, frameFill, frameStroke, labelColor } = style;

  // ════ NATO 指揮所司令部 (APP-6 Command Post: Headquarters Flag + Fortified Bunker) ════
  // 1. NATO APP-6 Headquarters Frame (友軍藍 / 敵軍紅 + 左側旗桿 Flagpole)
  ctx.fillStyle = frameFill;
  ctx.strokeStyle = frameStroke;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-16, -32, 32, 18);
  ctx.fillRect(-16, -32, 32, 18);

  // 左側指揮所旗桿延伸線 (Headquarters Staff/Flagpole)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -32);
  ctx.lineTo(-16, -42);
  ctx.stroke();

  // "CP" 字樣標示
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CP', 0, -20);

  // 2. 地面物理建築: 重裝甲鋼筋混泥土司令掩體 + 旋轉無線電雷達天線
  ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.45)' : '#263238';
  ctx.strokeStyle = isPlayer ? '#81C784' : '#90A4AE';
  ctx.lineWidth = 2;
  ctx.strokeRect(-18, -4, 36, 26);
  ctx.fillRect(-18, -4, 36, 26);

  // 司令部防爆觀察窗狹縫
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(-12, 4, 24, 4);

  // 通訊雷達天線桿
  const antRot = rc.time * 2.5;
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -18);
  ctx.moveTo(-7 * Math.cos(antRot), -18 - 7 * Math.sin(antRot));
  ctx.lineTo(7 * Math.cos(antRot), -18 + 7 * Math.sin(antRot));
  ctx.stroke();

  // 標籤
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '🚩 [NATO 友軍指揮所 CP] 後勤要塞' : '🚩 [NATO 指揮所 CP] 核心樞紐', 0, -46);
}

function drawHiddenTunnel(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 隱蔽地下坑道掩體 (Hidden Bomb Shelter / Tunnel Entrance) ════
  ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 蛛網洞穴掩蔽木板
  ctx.strokeStyle = '#D7CCC8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(10, 5);
  ctx.moveTo(-10, 5);
  ctx.lineTo(10, -5);
  ctx.stroke();

  ctx.fillStyle = '#BCAAA4';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[地下坑道網]', 0, -18);
}

function drawPontoonPier(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 浮式人工棧橋港 (Expedient Pontoon Pier / 急造港口) ════
  // 浮動突堤棧橋 (Modular Pontoon Pier) + 卸載吊桿
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#4FC3F7';
  ctx.fillStyle = 'rgba(2, 136, 209, 0.45)';
  ctx.strokeRect(-28, -8, 56, 16);
  ctx.fillRect(-28, -8, 56, 16);

  // 突堤木質棧道橫條紋
  ctx.strokeStyle = '#81D4FA';
  ctx.lineWidth = 1.2;
  for (let px = -24; px <= 24; px += 6) {
    ctx.beginPath();
    ctx.moveTo(px, -8);
    ctx.lineTo(px, 8);
    ctx.stroke();
  }

  // 吊運起重桁架桿
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(26, -14);
  ctx.lineTo(32, -8);
  ctx.stroke();

  // 標籤與工兵升級進度
  ctx.fillStyle = '#80D8FF';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓ [浮式人工棧橋港] 急造港口 (補給線連通)', 0, -22);

  if (inst.upgradeTimer && inst.upgradeTimer > 0) {
    const upProg = Math.min(1, inst.upgradeTimer / 35.0);
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`🔨 工兵拓建中: ${Math.round(inst.upgradeTimer)}s / 35s`, 0, 26);
    ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
    ctx.fillRect(-20, 29, 40, 3.5);
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(-20, 29, 40 * upProg, 3.5);
  }
}

function drawMajorNavalPort(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 正規深水軍港 (Major Deepwater Naval Port) ════
  // 現代化大型深水混凝土突堤碼頭 + 港埠起重機
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#00E5FF';
  ctx.fillStyle = 'rgba(0, 151, 167, 0.55)';
  ctx.strokeRect(-42, -14, 84, 28);
  ctx.fillRect(-42, -14, 84, 28);

  // 大型龍門吊車架構
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-20, -14);
  ctx.lineTo(-20, -26);
  ctx.lineTo(20, -26);
  ctx.lineTo(20, -14);
  ctx.stroke();

  // 突堤泊靠繫纜樁
  ctx.fillStyle = '#FFFFFF';
  for (const bx of [-36, -18, 0, 18, 36]) {
    ctx.beginPath();
    ctx.arc(bx, -12, 2.2, 0, Math.PI * 2);
    ctx.arc(bx, 12, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚓【正規深水軍港】全島戰略樞紐 (+1.5 CP/s)', 0, -32);
}

function drawSupplyDepot(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 戰地輜重補給樞紐 (Supply Depot) ════
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FFA726';
  ctx.fillStyle = 'rgba(230, 81, 0, 0.45)';
  ctx.strokeRect(-22, -12, 44, 24);
  ctx.fillRect(-22, -12, 44, 24);

  // 彈藥箱堆疊符號
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-16, -6, 12, 12);
  ctx.strokeRect(4, -6, 12, 12);

  ctx.fillStyle = '#FFE082';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('📦 [戰地輜重樞紐] 建制度修整 +2.0%/s', 0, -20);
}

function drawFieldHospital(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 戰地野戰醫院 (Field Hospital) ════
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#EF5350';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.strokeRect(-20, -12, 40, 24);
  ctx.fillRect(-20, -12, 40, 24);

  // 紅十字 Red Cross
  ctx.fillStyle = '#D32F2F';
  ctx.fillRect(-3, -8, 6, 16);
  ctx.fillRect(-8, -3, 16, 6);

  ctx.fillStyle = '#EF5350';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🏥 [戰地野戰醫院] 組織度穩定 +2.5%/s', 0, -20);
}

function drawCity(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 城市市區 (City: High-Density Urban Street Grid & Buildings) ════
  ctx.fillStyle = 'rgba(38, 50, 56, 0.85)';
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 2;
  ctx.strokeRect(-32, -22, 64, 44);
  ctx.fillRect(-32, -22, 64, 44);

  // 十字街道網格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-32, 0);
  ctx.lineTo(32, 0);
  ctx.moveTo(0, -22);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4大建築街區群 (高層公寓與市政廳)
  ctx.fillStyle = '#455A64';
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-28, -18, 12, 14);
  ctx.strokeRect(-28, -18, 12, 14);
  ctx.fillRect(16, -18, 12, 14);
  ctx.strokeRect(16, -18, 12, 14);
  ctx.fillRect(-28, 4, 12, 14);
  ctx.strokeRect(-28, 4, 12, 14);
  ctx.fillRect(16, 4, 12, 14);
  ctx.strokeRect(16, 4, 12, 14);

  // 市政中心/鐘樓頂部屋脊 (中央磚紅核心)
  ctx.fillStyle = '#BF360C';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.strokeStyle = '#FF8A65';
  ctx.strokeRect(-8, -8, 16, 16);

  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🏛️【城市核心市區】${inst.name.split(' ')[0]}`, 0, -30);
}

function drawTown(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 城鎮集市 (Town: Traditional Crossroads Settlement & Houses) ════
  ctx.fillStyle = 'rgba(62, 39, 35, 0.75)';
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-24, -16, 48, 32);
  ctx.fillRect(-24, -16, 48, 32);

  // 市集道路
  ctx.strokeStyle = '#BCAAA4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();

  // 磚瓦人字形小屋群
  ctx.fillStyle = '#D84315';
  ctx.strokeStyle = '#FFAB91';
  ctx.lineWidth = 1.2;
  for (const hx of [-16, 4]) {
    for (const hy of [-12, 4]) {
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.lineTo(hx + 6, hy);
      ctx.lineTo(hx + 12, hy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#FFCC80';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🏘️【城鎮市集】${inst.name.split(' ')[0]}`, 0, -24);
}

function drawSettlement(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 沿海漁村定居點 (Settlement: Coastal Huts & Dock Pier) ════
  ctx.fillStyle = 'rgba(78, 52, 46, 0.65)';
  ctx.strokeStyle = '#A1887F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3座圓形茅草屋頂
  ctx.fillStyle = '#8D6E63';
  for (const [cx, cy] of [[-7, -6], [7, -6], [0, 8]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#FFE082';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🏡【沿海定居點】${inst.name.split(' ')[0]}`, 0, -24);
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
  ctx.fillText(`⛺【人道救援難民營】誤擊 -15 CP`, 0, -26);
}

function drawBunkerNest(rc: RenderContext, _inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 加固鋼筋混凝土暗堡與機槍碉堡 (Fortified Concrete Bunker & MG Nest) ════
  // 1. 沙袋半月形外圍防護堤
  ctx.strokeStyle = '#BCAAA4';
  ctx.fillStyle = 'rgba(78, 52, 46, 0.75)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 4, 18, -Math.PI * 0.85, Math.PI * 0.85);
  ctx.stroke();
  ctx.fill();

  // 2. 八角形鋼筋混泥土厚重工事主體
  ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.65)' : '#37474F';
  ctx.strokeStyle = isPlayer ? '#42A5F5' : '#78909C';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const bx = Math.cos(ang) * 14;
    const by = Math.sin(ang) * 14;
    if (i === 0) ctx.moveTo(bx, by);
    else ctx.lineTo(bx, by);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. 橫向防爆射擊狹縫 (Firing Embrasures)
  ctx.fillStyle = '#1A237E';
  ctx.fillRect(-8, -2, 16, 3.5);
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(-2, -1, 4, 1.8);

  // 4. 重機槍與無後座力砲身
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(8, -3);
  ctx.lineTo(8, 3);
  ctx.stroke();

  // 5. 標籤
  ctx.fillStyle = isPlayer ? '#90CAF9' : '#FF8A80';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? '🛡️ [NATO 友軍加固暗堡] 重機槍/無後座力砲' : '🛡️ [敵軍加固防禦暗堡] 重機槍/穿甲砲', 0, -24);
}

function drawSamHawk(rc: RenderContext, inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 美軍陸戰隊 MIM-23 鷹式 / MIM-104 愛國者防空飛彈營 ════
  // 1. NATO APP-6 防空飛彈長方框標記
  ctx.fillStyle = 'rgba(21, 101, 192, 0.65)';
  ctx.strokeStyle = '#42A5F5';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-16, -30, 32, 17);
  ctx.fillRect(-16, -30, 32, 17);

  // 防空圓頂 + 向上飛彈箭頭
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -18, 5, Math.PI, 0);
  ctx.moveTo(-6, -18);
  ctx.lineTo(6, -18);
  ctx.moveTo(0, -14);
  ctx.lineTo(0, -25);
  ctx.lineTo(-3, -22);
  ctx.moveTo(0, -25);
  ctx.lineTo(3, -22);
  ctx.stroke();

  // 2. 圓形旋轉發射基座
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. 三聯裝鷹式飛彈導軌與 3 枚白色羽翼飛彈 (或愛國者四聯裝箱式發射架)
  const hawkRot = rc.time * 0.4;
  for (let m = 0; m < (inst.type === 'sam_patriot' ? 4 : 3); m++) {
    const mAngle = hawkRot + (m * Math.PI * 2) / (inst.type === 'sam_patriot' ? 4 : 3);
    const mx = Math.cos(mAngle) * 8;
    const my = 6 + Math.sin(mAngle) * 8;

    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + Math.cos(mAngle) * 14, my + Math.sin(mAngle) * 14);
    ctx.stroke();

    // 標誌性梯形翼
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(mx + Math.cos(mAngle) * 5, my + Math.sin(mAngle) * 5);
    ctx.lineTo(mx + Math.cos(mAngle) * 5 - Math.sin(mAngle) * 4, my + Math.sin(mAngle) * 5 + Math.cos(mAngle) * 4);
    ctx.moveTo(mx + Math.cos(mAngle) * 5, my + Math.sin(mAngle) * 5);
    ctx.lineTo(mx + Math.cos(mAngle) * 5 + Math.sin(mAngle) * 4, my + Math.sin(mAngle) * 5 - Math.cos(mAngle) * 4);
    ctx.stroke();
  }

  // 4. 標籤
  ctx.fillStyle = '#80DEEA';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(inst.type === 'sam_patriot' ? '🚀 [NATO 愛國者防空飛彈營] MIM-104 Patriot (相列雷達多通道攔截)' : '🚀 [NATO 友軍霍克防空飛彈 SAM] MIM-23 Hawk (自動攔截)', 0, -36);
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

function drawFanSongRadar(rc: RenderContext, _inst: Installation, _style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;

  // ════ 敵軍扇歌射控火控雷達 (SNR-75 Fan Song Dual Orthogonal Lewis Scanners) ════
  ctx.fillStyle = '#263238';
  ctx.strokeStyle = '#FF1744';
  ctx.lineWidth = 2.0;
  ctx.fillRect(-13, -10, 26, 20);
  ctx.strokeRect(-13, -10, 26, 20);

  // 雙正交橙紅拋物面扇形掃描天線 (Horizontal + Vertical Fan Arrays)
  const radarRot = rc.time * 2.2;
  ctx.save();
  ctx.rotate(radarRot);
  ctx.strokeStyle = '#FF8A65';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(10, -4);
  ctx.moveTo(4, -10);
  ctx.lineTo(4, 10);
  ctx.stroke();
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 電磁波輻射環 (供 AGM-45 反輻射飛彈鎖定示意)
  const radPulse = (Math.sin(rc.time * 6) + 1) * 0.5;
  ctx.strokeStyle = `rgba(255, 23, 68, ${0.3 + radPulse * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, 22 + radPulse * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#FF8A80';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('📡 [敵軍射控火控雷達] Fan Song 扇歌 (高頻輻射)', 0, -24);
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

function drawRiverFerry(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 內河渡口 (River Ferry Terminal) ════
  // 1. 木造渡口突堤與繫纜樁
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-18, -4, 20, 8);
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-18, -4, 20, 8);

  // 2. 停泊的平底鋼纜渡輪駁船 (Ferry Barge)
  ctx.fillStyle = '#37474F';
  ctx.fillRect(4, -7, 18, 14);
  ctx.strokeStyle = isPlayer ? '#42A5F5' : '#FFB300';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(4, -7, 18, 14);

  // 鋼纜引渡線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // 渡口號誌燈
  ctx.fillStyle = isPlayer ? '#00E5FF' : '#FFD54F';
  ctx.beginPath();
  ctx.arc(-16, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFD54F';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⛴️ [${inst.name}]`, 0, -22);
}

function drawRadioStation(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 轉播電台 / 無線電通訊塔 (Radio Relay Station) ════
  // 1. 鋼構桁架發射鐵塔
  ctx.strokeStyle = isPlayer ? '#00E5FF' : '#FF5252';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-10, 14);
  ctx.lineTo(0, -18);
  ctx.lineTo(10, 14);
  // 塔架橫樑
  ctx.moveTo(-7, 6);
  ctx.lineTo(7, 6);
  ctx.moveTo(-4, -4);
  ctx.lineTo(4, -4);
  ctx.stroke();

  // 2. 頂部航空障礙閃爍信標
  const blink = Math.sin(rc.time * 8) > 0;
  ctx.fillStyle = blink ? '#FF1744' : '#546E7A';
  ctx.beginPath();
  ctx.arc(0, -19, 3, 0, Math.PI * 2);
  ctx.fill();

  // 3. 擴散電波環
  const wavePhase = ((rc.time * 2) % 1);
  ctx.strokeStyle = isPlayer ? `rgba(0, 229, 255, ${0.7 * (1 - wavePhase)})` : `rgba(255, 82, 82, ${0.7 * (1 - wavePhase)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -19, 6 + wavePhase * 18, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();

  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FF8A80';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`📡 [${inst.name}]`, 0, -26);
}

function drawAmmoCache(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 前線彈藥補給庫 (Ammunition Cache) ════
  // 1. 環形防爆沙袋堡 (Sandbag Revetment)
  ctx.strokeStyle = '#BCAAA4';
  ctx.fillStyle = 'rgba(78, 52, 46, 0.7)';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-16, -12, 32, 24);
  ctx.fillRect(-16, -12, 32, 24);

  // 2. 堆疊的軍綠色彈藥箱與帆布遮棚
  ctx.fillStyle = '#33691E';
  ctx.fillRect(-10, -7, 9, 6);
  ctx.fillRect(1, -7, 9, 6);
  ctx.fillRect(-5, 0, 10, 6);

  // 3. 亮黃/紅色危險標記
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-4, -3);
  ctx.lineTo(4, -3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFAB91';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`📦 [${inst.name}]`, 0, -20);
}

function drawWatchtower(rc: RenderContext, inst: Installation, style: InstallationStyle, _island?: Island): void {
  const ctx = rc.ctx;
  const { isPlayer } = style;

  // ════ 邊境觀察哨樓 (Border Observation Watchtower) ════
  // 1. 四腳木/鋼支撐架
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-10, 16);
  ctx.lineTo(-5, -10);
  ctx.moveTo(10, 16);
  ctx.lineTo(5, -10);
  ctx.moveTo(-7, 3);
  ctx.lineTo(7, 3);
  ctx.stroke();

  // 2. 頂部高架木造瞭望崗樓
  ctx.fillStyle = isPlayer ? '#1565C0' : '#4E342E';
  ctx.strokeStyle = isPlayer ? '#42A5F5' : '#D7CCC8';
  ctx.lineWidth = 1.4;
  ctx.fillRect(-8, -16, 16, 8);
  ctx.strokeRect(-8, -16, 16, 8);

  // 3. 鐵皮屋頂 (Roof)
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.moveTo(-11, -16);
  ctx.lineTo(0, -22);
  ctx.lineTo(11, -16);
  ctx.closePath();
  ctx.fill();

  // 4. 探照燈光束提示
  const beamAng = rc.time * 0.8;
  ctx.strokeStyle = 'rgba(255, 238, 88, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(Math.cos(beamAng) * 32, -14 + Math.sin(beamAng) * 32);
  ctx.stroke();

  ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFE082';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`🗼 [${inst.name}]`, 0, -28);
}

export const INSTALLATION_DRAWERS: Partial<Record<InstallationType, InstallationDrawer>> = {
  airfield: drawAirfield,
  coastal_gun: drawCoastalGun,
  radar_station: drawRadarStation,
  ammo_depot: drawAmmoDepot,
  infantry_squad: drawInfantrySquad,
  infantry_platoon: drawInfantryPlatoon,
  tank_platoon: drawTankPlatoon,
  tank_battalion: drawTankBattalion,
  towed_artillery: drawTowedArtillery,
  flak_battery: drawFlakBattery,
  ship_repair_dock: drawShipRepairDock,
  command_post: drawCommandPost,
  hidden_tunnel: drawHiddenTunnel,
  pontoon_pier: drawPontoonPier,
  major_naval_port: drawMajorNavalPort,
  supply_depot: drawSupplyDepot,
  field_hospital: drawFieldHospital,
  city: drawCity,
  town: drawTown,
  settlement: drawSettlement,
  refugee_camp: drawRefugeeCamp,
  bunker_nest: drawBunkerNest,
  sam_hawk: drawSamHawk,
  sam_patriot: drawSamHawk,
  sa2_sam_site: drawSa2SamSite,
  sa3_sam_site: drawSa2SamSite,
  s300_sam_site: drawSa2SamSite,
  coastal_harpoon: drawCoastalHarpoon,
  glcm_site: drawGlcmSite,
  coastal_rubezh: drawCoastalRubezh,
  scud_site: drawScudSite,
  fan_song_radar: drawFanSongRadar,
  rubber_plantation: drawRubberPlantation,
  river_ferry: drawRiverFerry,
  radio_station: drawRadioStation,
  ammo_cache: drawAmmoCache,
  watchtower: drawWatchtower,
};
