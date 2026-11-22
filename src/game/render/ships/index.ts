import { isHiddenRiverBoat } from '../../naval/riverine';
import { drawFunnelSmoke } from '../unitDetails';
import { Ship, Vector2D } from '../../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from '../context';
import { drawAlliedSAGShip } from './alliedSag';
import { SHIP_HULL_DRAWERS } from './hulls';
import { planView } from './planform';

function isSubmarineShip(ship: Ship): boolean {
  return (
    ship.type === 'submarine' ||
    ship.type === 'foxtrot' ||
    ship.type === 'ssn_la' ||
    ship.type === 'ssgn_oscar'
  );
}

// Draw Ships with RTS Selection Indicators & Submarine Fog of War
export function drawShips(rc: RenderContext, ships: Ship[], camera: Camera, selectedUnitIds: string[]) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const ship of ships) {
    const isSub = isSubmarineShip(ship);
    if (isHiddenRiverBoat(ship)) continue; // under the canopy of the river bank
    if (ship.side === 'enemy' && isSub && !ship.isSunk && !ship.isSpotted) {
      if (ship.datumPos) drawDatum(rc, ship);
      continue; // Undetected enemy submarine stays hidden under Fog of War
    }

    const isSelected = selectedUnitIds.includes(ship.id);
    if (!isSelected && !isWorldCircleVisible(rc, ship.pos.x, ship.pos.y, Math.max(ship.length * 1.35, 260), camera)) {
      continue;
    }

    // Gone under: only the oil slick on the water is left
    if (ship.isSunk && ship.sinkProgress >= 1) {
      drawBattleDamage(rc, ship);
      continue;
    }

    drawWake(rc, ship);

    drawSubmarineContactRing(rc, ship, isSub);

    drawWaypointPath(rc, ship, isSelected);

    const isPlayer = ship.side === 'player';
    const isAllied = ship.side === 'allied';
    const hullColor = isPlayer ? '#E0F7FA' : isAllied ? '#B9F6CA' : '#FFCDD2';
    const detailColor = isPlayer ? '#80DEEA' : isAllied ? '#00E676' : '#EF9A9A';

    drawHull(rc, planView(ship), hullColor, detailColor);

    drawFunnelSmoke(rc, ship);

    drawBattleDamage(rc, ship);

    drawSelectionOverlay(rc, ship, isSelected);

    if (!ship.isSunk) {
      drawShipStatus(rc, ship, camera.zoom, isSelected);
    }
  }

  ctx.restore();
}

// Submarine Sonar Contact / Stealth Bubble Ring
function drawSubmarineContactRing(rc: RenderContext, ship: Ship, isSub: boolean): void {
  const ctx = rc.ctx;

  if (isSub && !ship.isSunk) {
    const pulse = (Math.sin(rc.time * 5.2) + 1) * 0.5;
    if (ship.side === 'enemy' && ship.isSpotted) {
      ctx.strokeStyle = `rgba(255, 171, 64, ${0.45 + pulse * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.52 + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (ship.side !== 'enemy') {
      if (ship.isSpottedByEnemy) {
        ctx.strokeStyle = `rgba(255, 82, 82, ${0.5 + pulse * 0.45})`;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.52 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(77, 208, 225, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
}

// RTS A* Sea-Lane Waypoint Path Line
function drawWaypointPath(rc: RenderContext, ship: Ship, isSelected: boolean): void {
  const ctx = rc.ctx;

  if (isSelected && ship.order.targetPos && (ship.order.type === 'move' || ship.order.type === 'attack')) {
    const wps = ship.order.waypoints;
    const startIdx = ship.order.activeWaypointIndex ?? 0;
    const hasWaypoints = Array.isArray(wps) && wps.length > startIdx;
    if (ship.order.type === 'move' || hasWaypoints) {
      ctx.strokeStyle = ship.order.type === 'attack' ? 'rgba(255, 138, 128, 0.65)' : 'rgba(0, 230, 118, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(ship.pos.x, ship.pos.y);
      if (hasWaypoints) {
        for (let wi = startIdx; wi < wps.length; wi++) {
          ctx.lineTo(wps[wi].x, wps[wi].y);
        }
      } else {
        ctx.lineTo(ship.order.targetPos.x, ship.order.targetPos.y);
      }
      ctx.stroke();

      ctx.setLineDash([]);
      if (hasWaypoints) {
        ctx.fillStyle = 'rgba(0, 230, 118, 0.6)';
        for (let wi = startIdx; wi < wps.length - 1; wi++) {
          ctx.beginPath();
          ctx.arc(wps[wi].x, wps[wi].y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = ship.order.type === 'attack' ? '#FF5252' : '#00E676';
      ctx.beginPath();
      ctx.arc(ship.order.targetPos.x, ship.order.targetPos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Hull silhouette (or the two sinking halves of a broken-back wreck). */
function drawHull(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string): void {
  const ctx = rc.ctx;

  if (ship.isSunk && ship.isBrokenInTwo) {
    // ══════════════════════════════════════════════════════════
    // 艦體應力斷裂兩截沉沒 (Ship Sinking Split in Two Segments)
    // ══════════════════════════════════════════════════════════
    const breakX = ship.length * (ship.breakLineOffset || 0);
    const l = ship.length;
    const w = ship.width;
    const alpha = Math.max(0, 1 - ship.sinkProgress);
    const breakProg = ship.breakProgress || 1;

    // 1. 艦尾節 (Stern Section): 斷裂後向後傾側沉降
    ctx.save();
    ctx.translate(ship.pos.x, ship.pos.y);
    ctx.globalAlpha = alpha;
    ctx.rotate(ship.heading + (ship.sternAngleOffset || -0.25) * breakProg);
    ctx.beginPath();
    ctx.rect(-l, -w * 2, breakX + l, w * 4);
    ctx.clip();
    renderShipHullByType(rc, ship, hullColor, detailColor);
    ctx.restore();

    // 2. 艦首節 (Bow Section): 斷裂後艦首下插前傾
    ctx.save();
    ctx.translate(ship.pos.x, ship.pos.y);
    ctx.globalAlpha = alpha;
    ctx.rotate(ship.heading + (ship.bowAngleOffset || 0.18) * breakProg);
    ctx.beginPath();
    ctx.rect(breakX, -w * 2, l * 2, w * 4);
    ctx.clip();
    renderShipHullByType(rc, ship, hullColor, detailColor);
    ctx.restore();

    // 3. 斷裂接縫處 (Jagged Steel Fracture Line & Raging Internal Flame), gone once she is under
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha * 1.5);
    ctx.translate(ship.pos.x, ship.pos.y);
    ctx.rotate(ship.heading);

    // 撕裂鋼板輪廓
    ctx.strokeStyle = '#FF3D00';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(breakX, -w * 0.52);
    ctx.lineTo(breakX + 4, -w * 0.2);
    ctx.lineTo(breakX - 4, w * 0.2);
    ctx.lineTo(breakX, w * 0.52);
    ctx.stroke();

    // 斷裂處高熱燃燒火光與融鐵核心
    ctx.fillStyle = '#FFA000';
    ctx.beginPath();
    ctx.arc(breakX, 0, Math.min(8, w * 0.45), 0, Math.PI * 2);
    ctx.fill();

    // 4. 彈藥庫劇烈殉爆瞬態高光光球 (Catastrophic Magazine Detonation Flash)
    if (ship.magazineFlashTimer && ship.magazineFlashTimer > 0) {
      const flashAlpha = Math.min(1, ship.magazineFlashTimer / 0.5);
      const flashR = (1 - flashAlpha) * (ship.length * 1.6) + 35;
      const flashGrad = ctx.createRadialGradient(breakX, 0, 2, breakX, 0, flashR);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      flashGrad.addColorStop(0.25, `rgba(255, 238, 88, ${flashAlpha * 0.95})`);
      flashGrad.addColorStop(0.65, `rgba(255, 87, 34, ${flashAlpha * 0.75})`);
      flashGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(breakX, 0, flashR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    // 標準艦體姿態繪製
    ctx.save();
    ctx.translate(ship.pos.x, ship.pos.y);
    if (ship.isSunk) {
      ctx.globalAlpha = Math.max(0, 1 - ship.sinkProgress);
      ctx.rotate(ship.heading + ship.sinkProgress * 0.4);
    } else {
      ctx.rotate(ship.heading);
      // Subsurface ocean drop shadow & waterline cushion for surfaced ships
      if (!(isSubmarineShip(ship) && (ship.isSubmerged ?? true))) {
        ctx.fillStyle = 'rgba(2, 7, 15, 0.48)';
        ctx.beginPath();
        ctx.ellipse(2, 3, ship.length * 0.51, ship.width * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    renderShipHullByType(rc, ship, hullColor, detailColor);
    if (!ship.isSunk) {
      drawShipUniversalDetails(rc, ship, hullColor, detailColor);
    }
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════════
// 戰損燃燒與沉沒特效 (Battle Damage Fire, Black Smoke & Oil Slicks)
// ══════════════════════════════════════════════════════════
function drawBattleDamage(rc: RenderContext, ship: Ship): void {
  const ctx = rc.ctx;

  if (ship.isSunk) {
    // Sinking Ship: Expanding Iridescent Oil Slick on Water Surface, spreading and thinning out
    // over a few minutes after she has gone down
    const t = ship.sunkTime ?? 0;
    const slickFade = t < 90 ? 1 : Math.max(0, 1 - (t - 90) / 120);
    if (slickFade <= 0) return;
    ctx.save();
    ctx.globalAlpha = slickFade;
    const slickRadius = (ship.length * 0.5) + ship.sinkProgress * 32 + Math.min(60, t * 0.4);
    const oilGrad = ctx.createRadialGradient(
      ship.pos.x, ship.pos.y, 4,
      ship.pos.x, ship.pos.y, slickRadius
    );
    oilGrad.addColorStop(0, 'rgba(10, 25, 45, 0.6)');
    oilGrad.addColorStop(0.6, 'rgba(21, 52, 85, 0.35)');
    oilGrad.addColorStop(0.85, 'rgba(41, 121, 150, 0.18)');
    oilGrad.addColorStop(1, 'rgba(41, 121, 150, 0)');

    ctx.fillStyle = oilGrad;
    ctx.beginPath();
    ctx.ellipse(ship.pos.x, ship.pos.y, slickRadius, slickRadius * 0.65, ship.heading, 0, Math.PI * 2);
    ctx.fill();

    // Water boil, foam and boiler room steam bubbles: only while she is going down and just after
    const boil = Math.max(0, 1 - Math.max(0, t - 15) / 10);
    ctx.globalAlpha = slickFade * boil;
    ctx.strokeStyle = 'rgba(224, 247, 250, 0.45)';
    ctx.lineWidth = 1.2;
    for (let b = 0; b < (boil > 0 ? 4 : 0); b++) {
      const bAngle = (rc.time * 3 + b * 1.5) % (Math.PI * 2);
      const bDist = (b * 9 + rc.time * 12) % (ship.length * 0.4);
      const bx = ship.pos.x + Math.cos(ship.heading + bAngle) * bDist;
      const by = ship.pos.y + Math.sin(ship.heading + bAngle) * bDist;
      ctx.beginPath();
      ctx.arc(bx, by, 3 + (b % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (ship.health < ship.maxHealth * 0.55) {
    // Heavy Battle Damage: Multi-stage Billowing Black Smoke & Internal Fiery Core
    const isCritical = ship.health < ship.maxHealth * 0.3;
    const plumeCount = isCritical ? 4 : 2;

    for (let pIdx = 0; pIdx < plumeCount; pIdx++) {
      const offsetAlongHull = (pIdx - (plumeCount - 1) / 2) * (ship.length * 0.22);
      const originX = ship.pos.x + Math.cos(ship.heading) * offsetAlongHull;
      const originY = ship.pos.y + Math.sin(ship.heading) * offsetAlongHull;

      // 1. Billowing dense black smoke clouds drifting astern
      for (let s = 0; s < 3; s++) {
        const puffCycle = (rc.time * 1.8 + pIdx * 0.4 + s * 0.32) % 1;
        const r = 6 + puffCycle * 22;
        const alpha = (1 - puffCycle) * 0.6;
        // Drift opposite to ship heading + wind drift
        const driftDist = puffCycle * 28;
        const driftX = originX - Math.cos(ship.heading) * driftDist + Math.sin(rc.time * 2 + s) * 5;
        const driftY = originY - Math.sin(ship.heading) * driftDist - puffCycle * 22;

        // Gradient smoke puff: dark charcoal edges
        ctx.fillStyle = `rgba(18, 24, 32, ${alpha})`;
        ctx.beginPath();
        ctx.arc(driftX, driftY, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Active raging internal fire combustion core on deck
      if (isCritical) {
        const fireFlicker = (Math.sin(rc.time * 16 + pIdx * 3) + 1) * 0.5;
        const flameRadius = 4 + fireFlicker * 5;

        // Intense orange/yellow fireball
        const fireGrad = ctx.createRadialGradient(
          originX, originY, 1,
          originX, originY, flameRadius
        );
        fireGrad.addColorStop(0, '#FFF59D');
        fireGrad.addColorStop(0.4, '#FFA726');
        fireGrad.addColorStop(0.8, '#FF5722');
        fireGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(originX, originY, flameRadius, 0, Math.PI * 2);
        ctx.fill();

        // Flying burning embers / sparks
        const sparkCycle = (rc.time * 5 + pIdx * 2) % 1;
        const sparkX = originX + (Math.sin(rc.time * 10 + pIdx) - 0.5) * 12 - Math.cos(ship.heading) * (sparkCycle * 20);
        const sparkY = originY - sparkCycle * 24;
        ctx.fillStyle = '#FFE082';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ══════════════════════════════════════════════════════════
// 戰術線條與軍事圖例 (Tactical Vectors & NATO Symbology)
// ══════════════════════════════════════════════════════════
function drawSelectionOverlay(rc: RenderContext, ship: Ship, isSelected: boolean): void {
  const ctx = rc.ctx;

  if (isSelected && !ship.isSunk) {
    drawUnitSelectionRing(rc, ship.pos, Math.max(ship.length, ship.width) * 0.65);

    // 1. Heading Vector with 30s & 60s Navigation Time Ticks
    const cosH = Math.cos(ship.heading);
    const sinH = Math.sin(ship.heading);
    const vectorLen = Math.max(80, ship.speed * 2.2);
    const tick30X = ship.pos.x + cosH * (vectorLen * 0.5);
    const tick30Y = ship.pos.y + sinH * (vectorLen * 0.5);
    const tick60X = ship.pos.x + cosH * vectorLen;
    const tick60Y = ship.pos.y + sinH * vectorLen;

    ctx.strokeStyle = 'rgba(0, 230, 118, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(ship.pos.x, ship.pos.y);
    ctx.lineTo(tick60X, tick60Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 30s Tick
    ctx.strokeStyle = '#00E676';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tick30X - sinH * 6, tick30Y + cosH * 6);
    ctx.lineTo(tick30X + sinH * 6, tick30Y - cosH * 6);
    ctx.stroke();

    // 60s Tick with Arrowhead
    ctx.beginPath();
    ctx.moveTo(tick60X - sinH * 7, tick60Y + cosH * 7);
    ctx.lineTo(tick60X + sinH * 7, tick60Y - cosH * 7);
    ctx.stroke();

    ctx.fillStyle = '#00E676';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('30s', tick30X + 8, tick30Y + 3);
    ctx.fillText('60s', tick60X + 8, tick60Y + 3);

    // 2. NATO APP-6 Naval Tactical Frame (Blue / Green Rectangle / Red Diamond)
    const frameW = 32;
    const frameH = 18;
    const frameY = ship.pos.y - ship.width - 32;
    const isPl = ship.side === 'player';
    const isAl = ship.side === 'allied';
    ctx.strokeStyle = isPl ? '#42A5F5' : isAl ? '#00E676' : '#FF5252';
    ctx.fillStyle = isPl ? 'rgba(13, 71, 161, 0.75)' : isAl ? 'rgba(27, 94, 32, 0.75)' : 'rgba(183, 28, 28, 0.75)';
    ctx.lineWidth = 1.6;

    if (!isPl && !isAl) {
      // NATO APP-6 敵軍菱形邊框 (Hostile Diamond Frame)
      ctx.beginPath();
      ctx.moveTo(ship.pos.x, frameY);
      ctx.lineTo(ship.pos.x + frameW * 0.55, frameY + frameH / 2);
      ctx.lineTo(ship.pos.x, frameY + frameH);
      ctx.lineTo(ship.pos.x - frameW * 0.55, frameY + frameH / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // NATO APP-6 友軍長方形邊框 (Friendly Rectangle Frame - Blue for US, Green for Allied)
      ctx.fillRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);
      ctx.strokeRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);
    }

    // NATO APP-6 艦艇兵種專用圖例符號
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.3;
    const cy = frameY + frameH / 2;
    const cx = ship.pos.x;

    if (ship.type === 'carrier' || ship.type === 'cve' || ship.type === 'cv63' || ship.type === 'cvn' || ship.type === 'cvhg_kiev' || ship.type === 'lph' || ship.type === 'lha_tarawa') {
      // 航空母艦 (Aircraft Carrier): 水平水線 + 上方雙翼飛翼折角 (Aviation Chevron)
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 3);
      ctx.lineTo(cx + 9, cy + 3);
      ctx.moveTo(cx - 7, cy - 2);
      ctx.lineTo(cx, cy - 6);
      ctx.lineTo(cx + 7, cy - 2);
      ctx.stroke();
    } else if (ship.type === 'submarine' || ship.type === 'foxtrot' || ship.type === 'ssn_la' || ship.type === 'ssgn_oscar') {
      // 潛艦 (Submarine): 水線 + 下潛水下圓弧 (Submerged Arc)
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 1);
      ctx.lineTo(cx + 8, cy - 1);
      ctx.arc(cx, cy - 1, 5.5, 0, Math.PI);
      ctx.stroke();
    } else if (ship.type === 'lcvp' || ship.type === 'lst' || ship.type === 'lsm_r' || ship.type === 'lcm8' || ship.type === 'lcac' || ship.type === 'lpd') {
      // 兩棲登陸艇/登陸艦 (Amphibious Craft): 水線 + 登陸跳板導引箭頭 (Landing Ramp Arrow)
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 3);
      ctx.lineTo(cx + 8, cy + 3);
      ctx.moveTo(cx - 4, cy + 3);
      ctx.lineTo(cx, cy - 4);
      ctx.lineTo(cx + 4, cy - 4);
      ctx.stroke();
    } else if (ship.type === 'battleship' || ship.type === 'kongo' || ship.type === 'bb_iowa_mod') {
      // 主力戰艦 (Battleship): 重型水面作戰艦 (水線 + 雙重戰鬥桅檣主砲)
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 3);
      ctx.lineTo(cx + 9, cy + 3);
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 3);
      ctx.moveTo(cx - 4, cy - 1);
      ctx.lineTo(cx + 4, cy - 1);
      ctx.stroke();
    } else {
      // 水面作戰艦巡洋艦/驅逐艦/巡防艦 (Cruiser / Destroyer / Frigate): 水線 + 射控主桅
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 3);
      ctx.lineTo(cx + 8, cy + 3);
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, cy + 3);
      ctx.stroke();
    }

    // Hull code & Speed tag (e.g. "BB · 28KT")
    ctx.fillStyle = '#E0F7FA';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    const typeCode = ship.type.toUpperCase();
    ctx.fillText(`${typeCode} · ${Math.round(ship.speed)}KT`, ship.pos.x, frameY + frameH + 9);

    // Naval Main Battery Gun Range
    const maxGunRange = ship.turrets.reduce((m, t) => Math.max(m, t.range), 0);
    if (maxGunRange > 0) {
      ctx.strokeStyle = 'rgba(255, 183, 77, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(ship.pos.x, ship.pos.y, maxGunRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Anti-Aircraft Flak Envelope
    if (ship.flakRange > 0) {
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.24)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(ship.pos.x, ship.pos.y, ship.flakRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// Draw RTS Selection Ring with CIC corner lock-on brackets
export function drawUnitSelectionRing(rc: RenderContext, pos: Vector2D, radius: number) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 crisp CIC corner lock-on reticle brackets
  const b = radius + 5;
  const arm = Math.max(6, Math.min(12, radius * 0.26));
  ctx.strokeStyle = '#69F0AE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Top-Left
  ctx.moveTo(pos.x - b, pos.y - b + arm);
  ctx.lineTo(pos.x - b, pos.y - b);
  ctx.lineTo(pos.x - b + arm, pos.y - b);
  // Top-Right
  ctx.moveTo(pos.x + b - arm, pos.y - b);
  ctx.lineTo(pos.x + b, pos.y - b);
  ctx.lineTo(pos.x + b, pos.y - b + arm);
  // Bottom-Right
  ctx.moveTo(pos.x + b, pos.y + b - arm);
  ctx.lineTo(pos.x + b, pos.y + b);
  ctx.lineTo(pos.x + b - arm, pos.y + b);
  // Bottom-Left
  ctx.moveTo(pos.x - b + arm, pos.y + b);
  ctx.lineTo(pos.x - b, pos.y + b);
  ctx.lineTo(pos.x - b, pos.y + b - arm);
  ctx.stroke();

  ctx.restore();
}

// Ship Wake Lines (Graded Kelvin wake ribbon + bow V-spray)
function drawWake(rc: RenderContext, ship: Ship) {
  if (ship.speed < 0.5 || ship.wakePoints.length < 2) return;
  const ctx = rc.ctx;
  const pts = ship.wakePoints;
  const baseRgb = ship.side === 'player' ? '128, 222, 234' : ship.side === 'allied' ? '105, 240, 174' : '239, 154, 154';

  // Outer soft foam glow
  ctx.strokeStyle = `rgba(${baseRgb}, 0.08)`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();

  // Graded fading wake core from tail to stern
  ctx.lineWidth = 1.6;
  for (let i = 1; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    ctx.strokeStyle = `rgba(${baseRgb}, ${(0.05 + t * 0.32).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  // Bow wave V-spray lines
  const cosH = Math.cos(ship.heading);
  const sinH = Math.sin(ship.heading);
  const bowX = ship.pos.x + cosH * (ship.length * 0.48);
  const bowY = ship.pos.y + sinH * (ship.length * 0.48);
  const sprayLen = Math.min(22, ship.speed * 1.15);

  ctx.strokeStyle = 'rgba(224, 247, 250, 0.45)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(bowX, bowY);
  ctx.lineTo(bowX - cosH * sprayLen + sinH * (sprayLen * 0.58), bowY - sinH * sprayLen - cosH * (sprayLen * 0.58));
  ctx.moveTo(bowX, bowY);
  ctx.lineTo(bowX - cosH * sprayLen - sinH * (sprayLen * 0.58), bowY - sinH * sprayLen + cosH * (sprayLen * 0.58));
  ctx.stroke();
}

export { drawShipTurrets } from './mounts';

// ══════════════════════════════════════════════════════════
// 盟軍水面打擊群 (Allied SAG) 專屬考證艦艇外觀與動態軍艦旗
// ══════════════════════════════════════════════════════════
/** Naval ensigns drawn on allied ships. */
export type NavalEnsign = 'white_ensign' | 'rising_sun' | 'de_bundesmarine' | 'fr_marine' | 'au_white_ensign' | 'ca_ensign' | 'nl_ensign' | 'rok_ensign';

export function drawNavalEnsign(rc: RenderContext, ensignType: NavalEnsign, x: number, y: number, length: number = 13, height: number = 8.5) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(x, y);

  // Dynamic wave flutter
  const wave = Math.sin(rc.time * 6.5 + x * 0.08) * 1.4;
  const wave2 = Math.cos(rc.time * 7.2 + y * 0.08) * 0.9;

  // Flagstaff
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.9);
  ctx.lineTo(0, height * 0.9);
  ctx.stroke();

  ctx.save();
  ctx.translate(0, -height * 0.75);

  // Wave clipping mask
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.45, wave, length, wave2);
  ctx.lineTo(length, height + wave2);
  ctx.quadraticCurveTo(length * 0.45, height + wave, 0, height);
  ctx.closePath();
  ctx.clip();

  if (ensignType === 'white_ensign') {
    // 🇬🇧 英國皇家海軍白船旗 (Royal Navy White Ensign)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, length, height);

    // Red St. George's Cross
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(length * 0.42, 0, length * 0.16, height);
    ctx.fillRect(0, height * 0.42, length, height * 0.16);

    // Union Jack in canton (top-left)
    const cW = length * 0.44;
    const cH = height * 0.44;
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, 0, cW, cH);

    // White diagonals
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(cW, cH);
    ctx.moveTo(cW, 0); ctx.lineTo(0, cH);
    ctx.stroke();

    // Red diagonals
    ctx.strokeStyle = '#D32F2F';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(cW, cH);
    ctx.moveTo(cW, 0); ctx.lineTo(0, cH);
    ctx.stroke();

    // Cross
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cW * 0.36, 0, cW * 0.28, cH);
    ctx.fillRect(0, cH * 0.36, cW, cH * 0.28);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(cW * 0.42, 0, cW * 0.16, cH);
    ctx.fillRect(0, cH * 0.42, cW, cH * 0.16);

  } else if (ensignType === 'rising_sun') {
    // 🇯🇵 日本海上自衛隊十六條旭日旗 (JMSDF 16-ray Rising Sun Ensign)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, length, height);

    const sunX = length * 0.36;
    const sunY = height * 0.5;
    const sunR = height * 0.28;

    ctx.fillStyle = '#C62828';
    for (let r = 0; r < 16; r++) {
      const a1 = (r * Math.PI) / 8 - 0.08;
      const a2 = (r * Math.PI) / 8 + 0.08;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(a1) * length * 1.6, sunY + Math.sin(a1) * length * 1.6);
      ctx.lineTo(sunX + Math.cos(a2) * length * 1.6, sunY + Math.sin(a2) * length * 1.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

  } else if (ensignType === 'de_bundesmarine') {
    // 🇩🇪 德國聯邦海軍旗 (Bundesdienstflagge der Seestreitkräfte)
    const h3 = height / 3;
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, 0, length, h3);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(0, h3, length, h3);
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(0, h3 * 2, length, h3);

    ctx.fillStyle = '#FFC107';
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(length * 0.38, height * 0.5, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  } else if (ensignType === 'fr_marine') {
    // 🇫🇷 法國海軍旗 (Pavillon de la Marine nationale)
    const w1 = length * 0.30;
    const w2 = length * 0.33;
    const w3 = length - w1 - w2;
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, 0, w1, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(w1, 0, w2, height);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(w1 + w2, 0, w3, height);
  } else if (ensignType === 'au_white_ensign') {
    // 🇦🇺 Australian White Ensign (from 1967): Union canton, blue Southern Cross on white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, length, height);
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, 0, length * 0.44, height * 0.5);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(length * 0.44, height * 0.5);
    ctx.moveTo(length * 0.44, 0); ctx.lineTo(0, height * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(length * 0.19, 0, length * 0.06, height * 0.5);
    ctx.fillRect(0, height * 0.22, length * 0.44, height * 0.06);
    ctx.fillStyle = '#0D47A1';
    for (const [sx, sy] of [[0.75, 0.2], [0.62, 0.5], [0.88, 0.45], [0.75, 0.8], [0.22, 0.78]] as const) {
      ctx.beginPath();
      ctx.arc(length * sx, height * sy, height * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ensignType === 'ca_ensign') {
    // 🇨🇦 Canadian flag, flown as the naval ensign from 1965: red-white-red with the maple leaf
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(0, 0, length, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(length * 0.25, 0, length * 0.5, height);
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.moveTo(length * 0.5, height * 0.18);
    ctx.lineTo(length * 0.62, height * 0.55);
    ctx.lineTo(length * 0.52, height * 0.5);
    ctx.lineTo(length * 0.52, height * 0.82);
    ctx.lineTo(length * 0.48, height * 0.82);
    ctx.lineTo(length * 0.48, height * 0.5);
    ctx.lineTo(length * 0.38, height * 0.55);
    ctx.closePath();
    ctx.fill();
  } else if (ensignType === 'nl_ensign') {
    // 🇳🇱 Dutch tricolour
    const h3 = height / 3;
    ctx.fillStyle = '#C62828';
    ctx.fillRect(0, 0, length, h3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, h3, length, h3);
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(0, h3 * 2, length, h3);
  } else if (ensignType === 'rok_ensign') {
    // 🇰🇷 Taegukgi: red-over-blue taeguk with the four trigrams
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, length, height);
    const cx = length * 0.5;
    const cy = height * 0.5;
    const rr = height * 0.24;
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.arc(cx, cy, rr, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#1565C0';
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#212121';
    for (const [tx, ty] of [[0.18, 0.2], [0.82, 0.2], [0.18, 0.8], [0.82, 0.8]] as const) {
      ctx.fillRect(length * tx - 1.2, height * ty - 1, 2.4, 2);
    }
  }

  ctx.restore();
  ctx.restore();
}

// 依照艦種呼叫對應之向量線條艦體繪製
function renderShipHullByType(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  // 優先判定盟軍水面作戰群 (Allied SAG) 專屬外觀
  if (ship.isAlliedSAG || ship.side === 'allied') {
    drawAlliedSAGShip(rc, ship, hullColor, detailColor);
    return;
  }
  SHIP_HULL_DRAWERS[ship.type](rc, ship, hullColor, detailColor);
}

// Universal Surface & Subsurface Ship Tactical Details (Breakwater, Spinning Radar Mast, Port/Starboard Nav Lights)
function drawShipUniversalDetails(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) {
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const isSub = isSubmarineShip(ship);

  if (isSub) {
    // Subtle periscope / sail feather ripple when submerged & moving
    if ((ship.isSubmerged ?? true) && ship.speed > 1.5) {
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l * 0.1, 0);
      ctx.lineTo(-l * 0.25, -4);
      ctx.moveTo(l * 0.1, 0);
      ctx.lineTo(-l * 0.25, 4);
      ctx.stroke();
    }
    return;
  }

  const isCarrier =
    ship.type === 'carrier' ||
    ship.type === 'cve' ||
    ship.type === 'cv63' ||
    ship.type === 'cvn' ||
    ship.type === 'cvhg_kiev' ||
    ship.type === 'lph' || ship.type === 'lha_tarawa';
  const isLandingCraft = ship.type === 'lcvp' || ship.type === 'lcm8' || ship.type === 'lcac';

  // 1. Bow Breakwater V-Shield & Subtle Deck Centerline on Surface Warships
  if (!isCarrier && !isLandingCraft) {
    ctx.strokeStyle = detailColor;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(l * 0.25, -w * 0.24);
    ctx.lineTo(l * 0.36, 0);
    ctx.lineTo(l * 0.25, w * 0.24);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 2. Animated Spinning Search Radar Bar atop Major Surface Combatants
  if (!isLandingCraft) {
    const radarX = isCarrier ? (ship.type === 'cvn' ? -l * 0.01 : l * 0.12) : -l * 0.02;
    const radarY = isCarrier ? (ship.type === 'cvn' || ship.type === 'cv63' ? w * 0.32 : -w * 0.48) : 0;
    const rAng = rc.time * 3.4 + (ship.heading || 0);
    const barR = Math.max(3.8, Math.min(6.2, w * 0.26));
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(radarX - Math.cos(rAng) * barR, radarY - Math.sin(rAng) * barR);
    ctx.lineTo(radarX + Math.cos(rAng) * barR, radarY + Math.sin(rAng) * barR);
    ctx.stroke();
  }

  // 3. International Port (Red) / Starboard (Green) / Stern Navigation Lights
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(0, -w * 0.45, 2.2, 2.2);
  ctx.fillStyle = '#00E676';
  ctx.fillRect(0, w * 0.45 - 2.2, 2.2, 2.2);
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(-l * 0.48, -1, 2, 2);
}

const PLATE_MAX_WIDTH = 150;

/** Half of the hull's vertical (screen-space y) extent at its current heading. */
function shipVerticalHalfExtent(ship: Ship): number {
  return Math.abs(Math.sin(ship.heading)) * ship.length * 0.5 + Math.abs(Math.cos(ship.heading)) * ship.width * 0.5;
}

/** Truncate text with an ellipsis so it fits maxWidth in the current font. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + '…';
}

function drawShipStatus(rc: RenderContext, ship: Ship, zoom: number = 0.65, isSelected: boolean = false) {
  const ctx = rc.ctx;
  const isPlayer = ship.side === 'player';
  const isAllied = ship.side === 'allied';
  
  const maxWcs = ship.maxWeaponControlHealth || ship.maxHealth;
  const curWcs = ship.weaponControlHealth !== undefined ? ship.weaponControlHealth : ship.health;
  const wcsPct = Math.max(0, Math.min(1, curWcs / maxWcs));

  const maxHcs = ship.maxHullCrewHealth || ship.maxHealth;
  const curHcs = ship.hullCrewHealth !== undefined ? ship.hullCrewHealth : ship.health;
  const hcsPct = Math.max(0, Math.min(1, curHcs / maxHcs));

  // Clear the hull whatever its heading: half of its on-screen vertical extent, never less than its beam.
  const hullClearance = Math.max(ship.width, shipVerticalHalfExtent(ship));

  // Strategic Zoom LOD: when zoomed far out, render a clean compact HP bar unless flagship/selected
  if (zoom < 0.34 && !ship.isFlagship && !isSelected) {
    const compactW = 48;
    const compactY = ship.pos.y - hullClearance - 18;
    const compactX = ship.pos.x - compactW / 2;
    ctx.fillStyle = 'rgba(5, 14, 25, 0.85)';
    ctx.fillRect(compactX - 1, compactY - 1, compactW + 2, 7);
    ctx.fillStyle = hcsPct > 0.5 ? (isPlayer ? '#00E5FF' : isAllied ? '#00E676' : '#EF5350') : hcsPct > 0.25 ? '#FFCA28' : '#FF1744';
    ctx.fillRect(compactX, compactY, compactW * hcsPct, 5);
    return;
  }

  const barWidth = 60;
  const barHeight = 4;
  const barGap = 2.5;
  const plateHeight = barHeight * 2 + barGap + 18;
  const yOffset = -hullClearance - 26;

  // Plate grows with the label up to a cap; longer labels are ellipsized.
  ctx.font = 'bold 9px monospace';
  const label = ship.name;
  const plateWidth = Math.min(PLATE_MAX_WIDTH, Math.max(barWidth + 34, ctx.measureText(label).width + 12));

  // Tactical HUD backing plate for maximum readability against ocean/islands
  const plateX = ship.pos.x - plateWidth / 2;
  const plateY = ship.pos.y + yOffset - 12;

  ctx.fillStyle = 'rgba(5, 14, 25, 0.82)';
  ctx.strokeStyle = isPlayer ? 'rgba(66, 165, 245, 0.45)' : isAllied ? 'rgba(0, 230, 118, 0.55)' : 'rgba(239, 83, 80, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateWidth, plateHeight, 3);
  ctx.fill();
  ctx.stroke();

  // 1. Ship Identifier Name & Submarine Status
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = isPlayer ? '#E0F7FA' : isAllied ? '#A7FFEB' : '#FFCDD2';
  ctx.fillText(fitText(ctx, label, plateWidth - 8), ship.pos.x, ship.pos.y + yOffset - 1);

  if (isSubmarineShip(ship) && (ship.isSubmerged ?? true)) {
    ctx.font = 'bold 7.5px monospace';
    if (ship.side === 'enemy') {
      ctx.fillStyle = '#FFAB40';
      ctx.fillText('[聲吶接觸定位 · 艦砲免疫]', ship.pos.x, plateY - 4);
    } else if (ship.isSpottedByEnemy) {
      ctx.fillStyle = '#FF5252';
      ctx.fillText('[敵聲吶鎖定 · 位置暴露]', ship.pos.x, plateY - 4);
    } else {
      ctx.fillStyle = '#4DD0E1';
      ctx.fillText('[潛航隱蔽 · 聲吶靜默]', ship.pos.x, plateY - 4);
    }
  }

  const startX = ship.pos.x - barWidth / 2 + 6;
  const yWcs = ship.pos.y + yOffset + 3;
  const yHcs = yWcs + barHeight + barGap;

  // 2. Upper Bar: 武器指管系統 (Weapon Control System - WCS)
  ctx.font = 'bold 7.5px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#FFA726';
  ctx.fillText('WPN', startX - 3, yWcs + barHeight - 0.5);

  // WCS Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(startX, yWcs, barWidth, barHeight);
  // WCS Fill
  ctx.fillStyle = wcsPct > 0.45 ? '#FFA726' : wcsPct > 0.18 ? '#FB8C00' : '#D32F2F';
  ctx.fillRect(startX, yWcs, barWidth * wcsPct, barHeight);
  ctx.strokeStyle = 'rgba(255, 183, 77, 0.6)';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(startX, yWcs, barWidth, barHeight);

  // 3. Lower Bar: 人員艦體狀態 (Hull & Crew State - HCS)
  ctx.font = 'bold 7.5px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#00E5FF';
  ctx.fillText('HUL', startX - 3, yHcs + barHeight - 0.5);

  // HCS Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(startX, yHcs, barWidth, barHeight);
  // HCS Fill
  ctx.fillStyle = hcsPct > 0.5 ? '#00E5FF' : hcsPct > 0.25 ? '#FFCA28' : '#FF1744';
  ctx.fillRect(startX, yHcs, barWidth * hcsPct, barHeight);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(startX, yHcs, barWidth, barHeight);
}

/**
 * Datum of a lost submarine contact: the last known position and a dashed circle that grows
 * with the time since contact at the boat's best submerged speed (where it could be by now).
 */
function drawDatum(rc: RenderContext, ship: Ship): void {
  const ctx = rc.ctx;
  const p = ship.datumPos!;
  const age = ship.datumAge ?? 0;
  const fade = Math.max(0, 1 - age / 90);
  const radius = 40 + age * Math.max(6, ship.maxSpeed * 0.9);
  ctx.save();
  ctx.globalAlpha = 0.85 * fade;
  ctx.strokeStyle = '#FFB74D';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p.x - 8, p.y);
  ctx.lineTo(p.x + 8, p.y);
  ctx.moveTo(p.x, p.y - 8);
  ctx.lineTo(p.x, p.y + 8);
  ctx.stroke();
  ctx.fillStyle = '#FFB74D';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`DATUM +${Math.round(age)}s`, p.x, p.y - radius - 4);
  ctx.restore();
}

/** A ship's hull and deck artwork alone, at the current transform (for menu icons). */
export function drawShipIcon(rc: RenderContext, ship: Ship): void {
  drawHull(rc, planView(ship), '#E0F7FA', '#80DEEA');
}
