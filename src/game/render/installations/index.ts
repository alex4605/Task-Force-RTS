import { Island, Installation } from '../../../types/game';
import { RenderContext } from '../context';
import { getInstallationStyle } from './style';
import { INSTALLATION_DRAWERS } from './bodies';
import { airfieldFootprint } from '../../airfieldLayout';

// Draw Installation
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

  // Whose sphere a village or town is in (our troops holding the ground round it make it ours)
  if (inst.controlledBy && (inst.type === 'settlement' || inst.type === 'town' || inst.type === 'city')) {
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = inst.controlledBy === 'player' ? '#81D4FA' : '#FF8A80';
    ctx.fillText(inst.controlledBy === 'player' ? '🟦 我方勢力範圍 · 有產出' : '🟥 敵方勢力範圍', 0, 24);
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
  ctx.fillText(`💥 跑道癱瘓 · 搶修中 ${Math.floor(progress * 100)}%`, 0, -hy - 10);
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
