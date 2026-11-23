import { Island, Installation } from '../../../types/game';
import { RenderContext } from '../context';
import { getInstallationStyle } from './style';
import { INSTALLATION_DRAWERS } from './bodies';
import { airfieldFootprint } from '../../airfieldLayout';
import { airfieldIntegrity, airfieldStage, airfieldStatusLine } from '../../airfieldOps';

// Draw Installation
const SPHERE_LABEL: ReadonlySet<string> = new Set(['settlement', 'town', 'city', 'civil_hospital', 'copra_plantation', 'civil_wharf', 'sugar_mill', 'power_plant', 'pagoda', 'factory']);

export function drawInstallation(rc: RenderContext, inst: Installation, island?: Island) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(inst.pos.x, inst.pos.y);

  // ══════════════════════════════════════════════════════════
  // 平民保護區 / 城市戰掩蔽圈 (Civilian Zone & Urban Cover Perimeter)
  // ══════════════════════════════════════════════════════════
  if (inst.civilianZoneRadius && inst.civilianZoneRadius > 0 && !inst.isDestroyed) {
    const zR = inst.civilianZoneRadius;
    ctx.save();
    ctx.setLineDash([6, 6]);
    // Towns are drawn as street blocks by the terrain layer; only the camp keeps its marked perimeter
    if (inst.type !== 'refugee_camp') ctx.globalAlpha = 0;
    if (inst.isCivilian) {
      ctx.strokeStyle = inst.type === 'refugee_camp' ? 'rgba(255, 238, 88, 0.45)' : 'rgba(128, 222, 234, 0.45)';
      ctx.fillStyle = inst.type === 'refugee_camp' ? 'rgba(255, 238, 88, 0.05)' : 'rgba(0, 229, 255, 0.05)';
    } else {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
    }
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, zR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = 1;
    ctx.fillStyle = inst.type === 'refugee_camp' ? '#FFE082' : '#80DEEA';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    if (inst.type === 'refugee_camp') {
      ctx.fillText('⛺【聯合國難民收容安全區 · 誤擊扣政治值】', 0, -zR - 6);
    } else if (inst.type === 'city' || inst.type === 'town') {
      ctx.fillText('🏛️【城區防禦掩體: 空襲減傷70% · 直射掩護50%】', 0, -zR - 6);
    } else {
      ctx.fillText('🏘️【定居點平民區 · 誤擊扣政治值】', 0, -zR - 6);
    }
    ctx.restore();
  }

  ctx.rotate(inst.angle);

  if (inst.isDestroyed && inst.type === 'airfield') {
    drawNukedAirfield(rc, inst);
    ctx.restore();
    return;
  }

  if (inst.isDestroyed) {
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.moveTo(12, -12);
    ctx.lineTo(-12, 12);
    ctx.stroke();
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
    return;
  }

  const style = getInstallationStyle(inst, island);
  const { color } = style;
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(18, 38, 58, 0.9)';

  // Universal terrain contact drop-shadow for physical depth
  if (inst.type !== 'airfield' && inst.type !== 'city' && inst.type !== 'town') {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 12, 0.42)';
    ctx.beginPath();
    ctx.ellipse(2.5, 3.5, 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Type-specific body: see bodies.ts
  INSTALLATION_DRAWERS[inst.type]?.(rc, inst, style, island);
  if (inst.type === 'airfield' && inst.cratered) drawCrateredOverlay(rc, inst);
  else if (inst.type === 'airfield' && inst.health < inst.maxHealth) drawAirfieldDamage(rc, inst);
  if (inst.type === 'airfield' && inst.captureProgress && inst.captureBy) {
    // Ground troops taking the field
    const { hy } = airfieldFootprint(inst);
    const k = Math.min(1, inst.captureProgress / 100);
    ctx.fillStyle = 'rgba(4, 12, 22, 0.85)';
    ctx.fillRect(-40, -hy - 34, 80, 6);
    ctx.fillStyle = inst.captureBy === 'player' ? '#4FC3F7' : '#FF5252';
    ctx.fillRect(-39, -hy - 33, 78 * k, 4);
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(inst.captureBy === 'player' ? `🚩 我軍奪取機場 ${Math.floor(k * 100)}%` : `⚠️ 敵軍奪取機場 ${Math.floor(k * 100)}%`, 0, -hy - 38);
  }

  // Whose sphere a village or town is in (our troops holding the ground round it make it ours)
  if (inst.controlledBy && SPHERE_LABEL.has(inst.type)) {
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = inst.controlledBy === 'player' ? '#81D4FA' : '#FF8A80';
    const ours = inst.type === 'civil_hospital' ? '🟦 我方勢力範圍 · 收治傷患' : '🟦 我方勢力範圍 · 有產出';
    const settle = inst.type === 'settlement' || inst.type === 'town' || inst.type === 'city';
    ctx.fillText(inst.controlledBy === 'player' ? ours : '🟥 敵方勢力範圍', 0, settle ? (inst.type === 'city' ? 52 : inst.type === 'town' ? 45 : 43) : 24);
  }

  if (inst.health < inst.maxHealth) {
    const hpPct = Math.max(0, inst.health / inst.maxHealth);
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, 22);
    ctx.lineTo(16, 22);
    ctx.stroke();

    ctx.strokeStyle = hpPct > 0.4 ? '#66BB6A' : '#EF5350';
    ctx.beginPath();
    ctx.moveTo(-16, 22);
    ctx.lineTo(-16 + 32 * hpPct, 22);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * A damaged but working airfield, by stage: at 75% a few patched craters and a scorched hangar; at
 * 50% more craters, a burning hangar and burnt-out aircraft on the hard standings, the far end of
 * the runway closed; at 25% only a short cleared stretch, every hangar gutted. The status line says
 * what can still fly from it.
 */
function drawAirfieldDamage(rc: RenderContext, inst: Installation): void {
  const ctx = rc.ctx;
  const { hx, hy } = airfieldFootprint(inst);
  const stage = airfieldStage(inst);
  const lost = 1 - airfieldIntegrity(inst);
  const n = Math.round(lost * 16);
  for (let k = 0; k < n; k++) {
    const x = -hx * 0.85 + ((k * 0.618 + 0.13) % 1) * hx * 1.7;
    const y = (((k * 0.377 + 0.21) % 1) - 0.5) * hy * 0.6;
    // Older craters are already filled with gravel and matting (lighter), fresh ones are dark
    const patched = k % 3 === 0 && stage >= 2;
    ctx.fillStyle = patched ? 'rgba(141, 123, 104, 0.75)' : 'rgba(20, 14, 10, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 4 + (k % 3) * 2, 0, Math.PI * 2);
    ctx.fill();
    if (!patched) {
      ctx.strokeStyle = 'rgba(121, 85, 72, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  // Closed length of runway: a hatched band at the far end
  if (stage <= 2) {
    const len = stage === 2 ? hx * 0.6 : hx * 1.15;
    ctx.save();
    ctx.fillStyle = 'rgba(30, 22, 18, 0.55)';
    ctx.fillRect(hx - len, -hy * 0.22, len, hy * 0.44);
    ctx.strokeStyle = 'rgba(255, 183, 77, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = hx - len; x < hx; x += 9) {
      ctx.moveTo(x, -hy * 0.22);
      ctx.lineTo(x + 7, hy * 0.22);
    }
    ctx.stroke();
    ctx.restore();
  }
  // Burnt-out aircraft on the hard standings
  if (stage <= 2) {
    for (let k = 0; k < (stage === 2 ? 2 : 4); k++) {
      const x = -hx * 0.6 + k * 22;
      const y = hy * 0.62;
      ctx.strokeStyle = 'rgba(40, 36, 34, 0.95)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.moveTo(x - 1, y - 6);
      ctx.lineTo(x + 2, y + 6);
      ctx.stroke();
    }
  }
  // Hangars burning
  const fires = stage === 3 ? 1 : stage === 2 ? 2 : 3;
  for (let k = 0; k < fires; k++) {
    const t = (rc.time * 0.5 + k / 3) % 1;
    const x = -hx * 0.3 + k * 26;
    const y = -hy * 0.75;
    ctx.fillStyle = `rgba(255, 112, 40, ${0.6 + 0.3 * Math.sin(rc.time * 8 + k)})`;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(30, 30, 34, ${0.45 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(x + t * 8, y - t * 34, 6 + t * 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = stage >= 3 ? '#FFE082' : stage === 2 ? '#FFB74D' : '#FF8A65';
  ctx.fillText(`🛠️ ${Math.round((1 - lost) * 100)}% · ${airfieldStatusLine(inst)}`, 0, hy + 14);
}

/** Bomb craters along a knocked-out runway, burning hangars and the repair state. */
function drawCrateredOverlay(rc: RenderContext, inst: Installation): void {
  const ctx = rc.ctx;
  const { hx, hy } = airfieldFootprint(inst);
  const progress = inst.cratered?.progress ?? 0;
  // Craters fill in as the repair goes on
  const n = Math.max(0, Math.round(14 * (1 - progress)));
  for (let k = 0; k < n; k++) {
    const x = -hx * 0.85 + ((k * 0.618) % 1) * hx * 1.7;
    const y = (((k * 0.377) % 1) - 0.5) * hy * 0.6;
    ctx.fillStyle = 'rgba(20, 14, 10, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 6 + (k % 3) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(121, 85, 72, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Smoke from the hangars
  for (let k = 0; k < 3; k++) {
    const t = (rc.time * 0.5 + k / 3) % 1;
    ctx.fillStyle = `rgba(30, 30, 34, ${0.5 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(-20 + k * 25, hy * 0.8 - t * 40, 8 + t * 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFB74D';
  ctx.fillText(`💥 0% · 跑道癱瘓 · 搶修中 ${Math.floor(progress * 100)}%`, 0, hy + 14);
}

/** A field wiped out by a nuclear burst: scorched ground, the runway outline and any rebuilding. */
function drawNukedAirfield(rc: RenderContext, inst: Installation): void {
  const ctx = rc.ctx;
  const { hx, hy } = airfieldFootprint(inst);
  ctx.fillStyle = 'rgba(25, 20, 18, 0.75)';
  ctx.beginPath();
  ctx.ellipse(0, 0, hx * 1.05, hy * 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(-hx * 0.95, -hy * 0.35, hx * 1.9, hy * 0.7);
  ctx.setLineDash([]);
  if (inst.rebuildProgress) {
    ctx.fillStyle = 'rgba(255, 213, 79, 0.35)';
    ctx.fillRect(-hx * 0.95, -hy * 0.35, hx * 1.9 * inst.rebuildProgress, hy * 0.7);
  }
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF8A65';
  ctx.fillText(
    inst.rebuildProgress ? `☢️ 機場全毀 · 工兵重建 ${Math.floor(inst.rebuildProgress * 100)}%` : '☢️ 機場全毀 · 需工兵在場重建',
    0,
    -hy - 10
  );
}
