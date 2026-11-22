import { Era, FieldWork, WhalePod } from '../../types/game';
import { FIELD_WORK_SIZE } from '../fieldWorks';
import { WHALE_LENGTH, WHALE_NAME } from '../whales';
import { Camera, RenderContext, isWorldCircleVisible } from './context';

/**
 * 防禦構工 artwork, top-down at map scale: wire belts on their pickets, zig-zag fire trenches
 * with sandbag parapets, trip-wire traps and punji pits, and minefields as their marked
 * perimeter with the mines scattered inside. Enemy works stay hidden until our troops find them.
 */

type Ctx = CanvasRenderingContext2D;

const early = (era: Era) => era === 'era1' || era === 'era2';

/** Deterministic scatter inside a work, so mines and pickets do not jitter between frames. */
function scatter(seed: string, n: number): [number, number][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const a = ((h >>> 0) % 1000) / 1000;
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    const b = ((h >>> 0) % 1000) / 1000;
    out.push([a * 2 - 1, b * 2 - 1]);
  }
  return out;
}

function drawObstacle(ctx: Ctx, w: FieldWork, trim: string): void {
  const { hx, hy } = FIELD_WORK_SIZE.obstacle;
  // Trampled ground under the belt
  ctx.fillStyle = 'rgba(110, 95, 70, 0.28)';
  ctx.fillRect(-hx, -hy, hx * 2, hy * 2);
  // Anti-tank line in front: dragon's teeth (era 5) or steel hedgehogs (eras 2-4)
  if (w.era === 'era5') {
    ctx.fillStyle = '#B0ADA5';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.5;
    for (let x = -hx + 4; x < hx; x += 7) {
      for (const y of [-hy + 2.5, -hy + 6.5]) {
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 1.8);
        ctx.lineTo(x, y - 2);
        ctx.lineTo(x + 2, y + 1.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (w.era !== 'era1') {
    ctx.strokeStyle = '#5D5A55';
    ctx.lineWidth = 1;
    for (let x = -hx + 6; x < hx; x += 12) {
      const y = -hy + 3;
      ctx.beginPath();
      ctx.moveTo(x - 2.2, y - 2.2);
      ctx.lineTo(x + 2.2, y + 2.2);
      ctx.moveTo(x + 2.2, y - 2.2);
      ctx.lineTo(x - 2.2, y + 2.2);
      ctx.moveTo(x, y - 2.6);
      ctx.lineTo(x, y + 2.6);
      ctx.stroke();
    }
  }
  // Wire: concertina coils as loops (or a double-apron fence in era 1) on pickets
  const wy = w.era === 'era1' ? 2 : 4;
  ctx.strokeStyle = 'rgba(60, 60, 60, 0.95)';
  ctx.lineWidth = 0.55;
  if (w.era === 'era1') {
    ctx.beginPath();
    for (let x = -hx; x <= hx; x += 6) {
      ctx.moveTo(x, wy - 5);
      ctx.lineTo(x + 3, wy + 5);
      ctx.moveTo(x + 3, wy - 5);
      ctx.lineTo(x, wy + 5);
    }
    ctx.moveTo(-hx, wy);
    ctx.lineTo(hx, wy);
    ctx.stroke();
  } else {
    for (const row of w.era === 'era5' ? [wy - 1.5, wy + 3.5] : [wy]) {
      ctx.beginPath();
      for (let x = -hx; x < hx; x += 3.2) {
        ctx.moveTo(x + 3.2, row);
        ctx.ellipse(x + 1.6, row, 1.6, 2.6, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }
  // Pickets
  ctx.fillStyle = w.side === 'enemy' && early(w.era) ? '#8D6E63' : '#455A64';
  for (let x = -hx; x <= hx; x += 12) ctx.fillRect(x - 0.7, wy - 0.7, 1.4, 1.4);
  // Side trim at the ends
  ctx.fillStyle = trim;
  ctx.fillRect(-hx - 1.5, wy - 2, 1.5, 4);
  ctx.fillRect(hx, wy - 2, 1.5, 4);
}

function drawTrench(ctx: Ctx, w: FieldWork, trim: string): void {
  const { hx } = FIELD_WORK_SIZE.trench;
  // Fire bays and traverses: a crenellated line along the axis, enemy side at -y
  const pts: [number, number][] = [];
  const bay = 12;
  for (let x = -hx, k = 0; x <= hx; x += bay / 2, k++) pts.push([x, k % 4 < 2 ? -3 : 3]);
  const path = (dy: number) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)));
  };
  // Spoil and the sandbag parapet facing the enemy
  ctx.strokeStyle = 'rgba(161, 136, 127, 0.9)';
  ctx.lineWidth = 6.5;
  ctx.lineJoin = 'miter';
  path(-2.4);
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = '#C8B48A';
  ctx.lineWidth = 2;
  ctx.setLineDash([1.8, 0.8]);
  path(-4.6);
  ctx.stroke();
  ctx.restore();
  // The trench itself
  ctx.strokeStyle = '#2B2118';
  ctx.lineWidth = 3.4;
  path(0);
  ctx.stroke();
  // Duckboards / revetting along the floor
  ctx.strokeStyle = 'rgba(141, 110, 99, 0.7)';
  ctx.lineWidth = 0.6;
  ctx.setLineDash([1, 2]);
  path(0);
  ctx.stroke();
  ctx.setLineDash([]);
  // Overhead cover on the later fighting positions
  if (w.era === 'era4' || w.era === 'era5') {
    ctx.fillStyle = 'rgba(90, 100, 70, 0.95)';
    for (const x of [-hx * 0.55, 0, hx * 0.55]) ctx.fillRect(x - 4, -4.5, 8, 6);
  }
  // Communication trench to the rear
  ctx.strokeStyle = '#2B2118';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(4, 10);
  ctx.lineTo(-2, 16);
  ctx.stroke();
  ctx.fillStyle = trim;
  ctx.fillRect(-hx - 2, -1, 2, 2);
  ctx.fillRect(hx, -1, 2, 2);
}

function drawTrap(ctx: Ctx, w: FieldWork): void {
  if (w.side === 'enemy' && w.era === 'era4') {
    // Punji pit: a covered hole lined with sharpened bamboo
    ctx.fillStyle = '#1E140C';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeStyle = '#C9B26B';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (const [x, y] of scatter(w.id, 9)) {
      ctx.moveTo(x * 4, y * 4);
      ctx.lineTo(x * 4 + 0.8, y * 4 - 1.4);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(85, 107, 47, 0.8)';
    ctx.strokeRect(-5, -5, 10, 10);
    return;
  }
  // Trip wire between two stakes with the charge (grenade or Claymore) at one end
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.85)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, 1);
  ctx.stroke();
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-12.8, -0.8, 1.6, 1.6);
  ctx.fillRect(11.2, 0.2, 1.6, 1.6);
  if (w.era === 'era4' || w.era === 'era5') {
    // M18A1 Claymore: a curved box on its scissor legs, facing the path
    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.ellipse(-12, -4, 3, 1.2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#3E4D24';
    ctx.beginPath();
    ctx.arc(-12, -2.4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMinefield(ctx: Ctx, w: FieldWork, trim: string): void {
  const { hx, hy } = FIELD_WORK_SIZE.minefield;
  const enemy = w.side === 'enemy';
  // Marked perimeter: a single strand on pickets with warning signs
  ctx.strokeStyle = enemy ? 'rgba(255, 82, 82, 0.85)' : 'rgba(255, 235, 59, 0.85)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(-hx, -hy, hx * 2, hy * 2);
  ctx.setLineDash([]);
  const signs: [number, number][] = [];
  for (let x = -hx; x <= hx; x += 30) signs.push([x, -hy], [x, hy]);
  for (let y = -hy + 27; y < hy; y += 27) signs.push([-hx, y], [hx, y]);
  for (const [x, y] of signs) {
    ctx.fillStyle = enemy ? '#B71C1C' : '#F9A825';
    ctx.beginPath();
    ctx.moveTo(x, y - 2.6);
    ctx.lineTo(x + 2.4, y + 1.6);
    ctx.lineTo(x - 2.4, y + 1.6);
    ctx.closePath();
    ctx.fill();
  }
  // The mines left in the ground (as many as there are charges)
  const left = Math.max(0, Math.ceil(((w.mines ?? 0) / (w.maxMines ?? 1)) * 40));
  const pts = scatter(w.id, 40).slice(0, left);
  pts.forEach(([x, y], i) => {
    const antiTank = i % 3 === 0;
    ctx.fillStyle = antiTank ? '#3E4D24' : '#4E4237';
    ctx.beginPath();
    ctx.arc(x * (hx - 6), y * (hy - 6), antiTank ? 2 : 1.1, 0, Math.PI * 2);
    ctx.fill();
    if (antiTank) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  });
  ctx.fillStyle = trim;
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(enemy ? '☠ MINES' : '⚠ 雷區', 0, 2.5);
}

export function drawFieldWorks(rc: RenderContext, works: FieldWork[], camera: Camera): void {
  if (works.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  for (const w of works) {
    if (w.isDestroyed || (w.side === 'enemy' && !w.revealed)) continue;
    const { hx, hy } = FIELD_WORK_SIZE[w.kind];
    if (!isWorldCircleVisible(rc, w.pos.x, w.pos.y, hx + hy + 30, camera)) continue;
    const trim = w.side === 'enemy' ? '#FF5252' : '#4FC3F7';
    ctx.save();
    ctx.translate(w.pos.x, w.pos.y);
    ctx.rotate(w.angle);
    ctx.globalAlpha = w.progress < 1 ? 0.35 + 0.4 * w.progress : 1;
    if (w.kind === 'obstacle') drawObstacle(ctx, w, trim);
    else if (w.kind === 'trench') drawTrench(ctx, w, trim);
    else if (w.kind === 'trap') drawTrap(ctx, w);
    else drawMinefield(ctx, w, trim);
    ctx.restore();
    // Name and, while it is going up, the work done
    if (camera.zoom > 0.55 || w.progress < 1) {
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = w.side === 'enemy' ? '#FF8A80' : '#B3E5FC';
      const top = w.pos.y - Math.max(hy, 10) - 8;
      ctx.fillText(w.name, w.pos.x, top);
      if (w.progress < 1) {
        ctx.fillStyle = 'rgba(4, 12, 22, 0.85)';
        ctx.fillRect(w.pos.x - 20, top + 3, 40, 4);
        ctx.fillStyle = w.builders > 0 ? '#FFD54F' : '#FF7043';
        ctx.fillRect(w.pos.x - 19, top + 4, 38 * w.progress, 2);
        ctx.fillStyle = w.builders > 0 ? '#FFE082' : '#FF8A65';
        ctx.fillText(w.builders > 0 ? `構工中 ${Math.floor(w.progress * 100)}%` : `構工暫停：無人在場`, w.pos.x, top + 15);
      }
    }
  }
  ctx.restore();
}

/** Whale pods: backs and flukes at the surface with the blow, a faint slick where they sounded. */
export function drawWhales(rc: RenderContext, pods: WhalePod[], camera: Camera): void {
  if (pods.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  for (const pod of pods) {
    if (!isWorldCircleVisible(rc, pod.pos.x, pod.pos.y, 120, camera)) continue;
    const len = WHALE_LENGTH[pod.species] * 1.6;
    const offs = scatter(pod.id, pod.count);
    for (let i = 0; i < pod.count; i++) {
      const [ox, oy] = offs[i];
      const x = pod.pos.x + ox * 28;
      const y = pod.pos.y + oy * 28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(pod.heading);
      if (!pod.surfaced) {
        // The flat "footprint" a diving whale leaves on the surface
        ctx.fillStyle = 'rgba(180, 220, 235, 0.10)';
        ctx.beginPath();
        ctx.ellipse(-len * 0.6, 0, len * 0.7, len * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      // Slick and wash round the back
      ctx.fillStyle = 'rgba(220, 240, 250, 0.16)';
      ctx.beginPath();
      ctx.ellipse(-len * 0.15, 0, len * 0.75, len * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Back
      const body = pod.species === 'sperm' ? '#4A4A4E' : pod.species === 'fin' ? '#545B63' : '#2F3338';
      ctx.fillStyle = body;
      ctx.beginPath();
      if (pod.species === 'sperm') {
        // Blunt box head
        ctx.moveTo(len * 0.5, -len * 0.13);
        ctx.lineTo(len * 0.5, len * 0.13);
        ctx.quadraticCurveTo(-len * 0.1, len * 0.16, -len * 0.5, 0);
        ctx.quadraticCurveTo(-len * 0.1, -len * 0.16, len * 0.5, -len * 0.13);
      } else {
        ctx.ellipse(0, 0, len * 0.5, len * (pod.species === 'fin' ? 0.09 : 0.13), 0, 0, Math.PI * 2);
      }
      ctx.fill();
      // Flukes
      ctx.beginPath();
      ctx.moveTo(-len * 0.48, 0);
      ctx.lineTo(-len * 0.62, -len * 0.16);
      ctx.lineTo(-len * 0.58, 0);
      ctx.lineTo(-len * 0.62, len * 0.16);
      ctx.closePath();
      ctx.fill();
      // Humpback flippers
      if (pod.species === 'humpback') {
        ctx.fillStyle = '#C9D0D6';
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(len * 0.08, sgn * len * 0.2, len * 0.15, len * 0.04, sgn * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // The blow, every few seconds
      const phase = (pod.spoutT + i * 1.3) % 6;
      if (phase < 1.6) {
        const k = phase / 1.6;
        ctx.fillStyle = `rgba(240, 248, 255, ${0.75 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(len * 0.32 + k * 3, 0, 2 + k * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (pod.surfaced && camera.zoom > 0.5) {
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(200, 230, 240, 0.85)';
      ctx.fillText(`🐋 ${WHALE_NAME[pod.species]} ×${pod.count}`, pod.pos.x, pod.pos.y - 52);
    }
  }
  ctx.restore();
}
