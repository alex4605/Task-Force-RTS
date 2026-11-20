import { Island, Installation } from '../../../types/game';
import { RenderContext } from '../context';
import { getInstallationStyle } from './style';
import { INSTALLATION_DRAWERS } from './bodies';

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
      ctx.fillText('⛺【聯合國難民收容安全區 · 誤擊扣15CP】', 0, -zR - 6);
    } else if (inst.type === 'city' || inst.type === 'town') {
      ctx.fillText('🏛️【城區防禦掩體: 空襲減傷70% · 直射掩護50%】', 0, -zR - 6);
    } else {
      ctx.fillText('🏘️【定居點平民區 · 誤擊扣15CP】', 0, -zR - 6);
    }
    ctx.restore();
  }

  ctx.rotate(inst.angle);

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
