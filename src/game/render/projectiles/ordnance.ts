// Gun rounds, tracers, unguided rockets and free-fall bombs in plan view, with the trails and
// shadows that tell the player what was fired, by whom, and where it is going to land.
import { Era, Projectile } from '../../../types/game';
import { RenderContext } from '../context';

// ════════════════════════════════════════════════════════════════════════════
// Shared helpers
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tracer colours by the firing side's doctrine: US / Commonwealth / ROK red, Soviet-pattern
 * ammunition (PRC, DPRK, NVA, Warsaw Pact) green, wartime Japanese tracer a pale white-green.
 */
export function tracerColours(side: Projectile['side'], era: Era): { glow: string; core: string; tip: string } {
  if (side !== 'enemy') return { glow: 'rgba(255, 82, 48, 0.55)', core: '#FF6E40', tip: '#FFE0D0' };
  if (era === 'era1' || era === 'era2') return { glow: 'rgba(200, 255, 190, 0.5)', core: '#C8FFB4', tip: '#FFFFFF' };
  return { glow: 'rgba(80, 255, 110, 0.5)', core: '#4CFF6A', tip: '#E0FFE6' };
}

/** Render-side position history: the engine does not keep trails for every round. */
const history = new WeakMap<Projectile, { x: number; y: number }[]>();

/** Recent positions of a projectile (newest last), sampled every `step` world units. */
export function trailOf(p: Projectile, maxPts: number, step: number): { x: number; y: number }[] {
  let h = history.get(p);
  if (!h) {
    h = [{ x: p.pos.x, y: p.pos.y }];
    history.set(p, h);
    return h;
  }
  const last = h[h.length - 1];
  const dx = p.pos.x - last.x;
  const dy = p.pos.y - last.y;
  if (dx * dx + dy * dy >= step * step) {
    h.push({ x: p.pos.x, y: p.pos.y });
    if (h.length > maxPts) h.shift();
  }
  return h;
}

/** Billowing exhaust smoke along a trail: widens and fades with age. */
export function drawSmokeTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], head: { x: number; y: number }, width: number, alpha: number, tint = '236, 239, 241'): void {
  const n = pts.length;
  if (n < 2) return;
  ctx.lineCap = 'round';
  for (let i = 0; i < n - 1; i++) {
    const age = 1 - i / (n - 1); // 1 = oldest
    const a = pts[i];
    const b = i + 1 < n - 1 ? pts[i + 1] : head;
    ctx.strokeStyle = `rgba(${tint}, ${(alpha * (1 - age * 0.85)).toFixed(3)})`;
    ctx.lineWidth = width * (1 + age * 1.6);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

// ════════════════════════════════════════════════════════════════════════════
// Gun shells (naval and field artillery): ballistic arc in pseudo-3D
// ════════════════════════════════════════════════════════════════════════════

export function drawShell(rc: RenderContext, proj: Projectile): void {
  const ctx = rc.ctx;
  const heavy = proj.blastRadius > 25;
  const maxAlt = heavy ? 65 : 45;
  const fp = proj.flightProgress;
  const altAt = (f: number) => Math.sin(Math.max(0, Math.min(1, f)) * Math.PI) * maxAlt;
  const dx = proj.targetPos.x - proj.originPos.x;
  const dy = proj.targetPos.y - proj.originPos.y;
  const span = Math.hypot(dx, dy) || 1;
  // Screen point of the shell at an earlier fraction of its flight, relative to where it is now
  const at = (f: number) => ({ x: proj.pos.x + dx * (f - fp), y: proj.pos.y + dy * (f - fp) - altAt(f) });

  // 1. Shadow on the surface, sharper as the shell comes down
  const alt = altAt(fp);
  ctx.fillStyle = `rgba(3, 8, 16, ${(0.5 - (alt / maxAlt) * 0.3).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(proj.pos.x, proj.pos.y, heavy ? 3.4 : 2.4, heavy ? 1.9 : 1.4, proj.heading, 0, Math.PI * 2);
  ctx.fill();

  // 2. Faint arc of the trajectory flown so far (dotted, fading)
  const back = Math.min(fp, 120 / span);
  ctx.fillStyle = 'rgba(207, 216, 220, 0.35)';
  for (let i = 1; i <= 6; i++) {
    const p = at(fp - (back * i) / 6);
    ctx.globalAlpha = 1 - i / 7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, heavy ? 1.1 : 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 3. Motion-blurred shell: a short streak along its screen-space direction of travel
  const head = at(fp);
  const tail = at(fp - Math.min(fp, (heavy ? 22 : 14) / span));
  const enemy = proj.side === 'enemy';
  ctx.lineCap = 'round';
  ctx.strokeStyle = enemy ? 'rgba(255, 112, 67, 0.4)' : 'rgba(255, 202, 40, 0.4)';
  ctx.lineWidth = heavy ? 5 : 3.6;
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.strokeStyle = enemy ? '#FFAB91' : '#FFE082';
  ctx.lineWidth = heavy ? 2.6 : 1.8;
  ctx.beginPath();
  ctx.moveTo((tail.x + head.x * 2) / 3, (tail.y + head.y * 2) / 3);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.arc(head.x, head.y, heavy ? 1.6 : 1.1, 0, Math.PI * 2);
  ctx.fill();
}

// ════════════════════════════════════════════════════════════════════════════
// Machine-gun and cannon tracers
// ════════════════════════════════════════════════════════════════════════════

export function drawBullet(rc: RenderContext, proj: Projectile): void {
  const ctx = rc.ctx;
  const col = tracerColours(proj.side, rc.era);
  const beam = !!proj.isBeamTracer; // M61 / GSh-23 rotary cannon: an almost continuous stream
  const k = beam ? 0.2 : 0.06;
  const tx = proj.pos.x - proj.vel.x * k;
  const ty = proj.pos.y - proj.vel.y * k;
  const lerp = (f: number) => ({ x: tx + (proj.pos.x - tx) * f, y: ty + (proj.pos.y - ty) * f });

  ctx.lineCap = 'round';
  // Glow, then a core that brightens toward the head, then the burning base of the round
  ctx.strokeStyle = col.glow;
  ctx.lineWidth = beam ? 4.2 : 3;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(proj.pos.x, proj.pos.y);
  ctx.stroke();

  ctx.strokeStyle = col.core;
  for (const [f0, w, a] of [[0.15, beam ? 1.6 : 1.1, 0.45], [0.45, beam ? 2.2 : 1.6, 0.8], [0.75, beam ? 2.4 : 1.8, 1]] as const) {
    const p = lerp(f0);
    ctx.globalAlpha = a;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(proj.pos.x, proj.pos.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const nib = lerp(0.88);
  ctx.strokeStyle = col.tip;
  ctx.lineWidth = beam ? 1.4 : 1;
  ctx.beginPath();
  ctx.moveTo(nib.x, nib.y);
  ctx.lineTo(proj.pos.x, proj.pos.y);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

// ════════════════════════════════════════════════════════════════════════════
// Unguided rockets: HVAR / Tiny Tim / FFAR / BM-21 / M26 MLRS
// ════════════════════════════════════════════════════════════════════════════

export function drawRocket(rc: RenderContext, proj: Projectile): void {
  const ctx = rc.ctx;
  const tiny = !!proj.isTinyTim;
  const artillery = !!proj.isMLRS || !!proj.isClusterSubmunition;
  // Body length / radius in world units
  const L = tiny ? 15 : artillery ? 13 : 8;
  const R = tiny ? 2.4 : artillery ? 1.9 : 1.1;

  // Exhaust smoke: a long, slowly widening trail of the recent flight path
  const pts = trailOf(proj, artillery || tiny ? 26 : 18, 7);
  drawSmokeTrail(ctx, pts, proj.pos, tiny || artillery ? 3 : 1.8, artillery ? 0.55 : 0.45);

  ctx.save();
  ctx.translate(proj.pos.x, proj.pos.y);
  ctx.rotate(proj.heading);

  // Motor flame with a flickering length
  const flick = 0.75 + 0.25 * Math.sin(rc.time * 37 + proj.id.length);
  const fl = (tiny ? 16 : artillery ? 14 : 9) * flick;
  const g = ctx.createLinearGradient(-L, 0, -L - fl, 0);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.25, '#FFE082');
  g.addColorStop(0.6, '#FF6D00');
  g.addColorStop(1, 'rgba(255, 61, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-L, -R * 0.8);
  ctx.quadraticCurveTo(-L - fl * 0.5, -R * 1.1, -L - fl, 0);
  ctx.quadraticCurveTo(-L - fl * 0.5, R * 1.1, -L, R * 0.8);
  ctx.closePath();
  ctx.fill();

  // Body: OD or grey motor tube, warhead with its ogive, cruciform fins
  ctx.fillStyle = tiny ? '#4E5B3A' : artillery ? (proj.side === 'enemy' ? '#5D6B4A' : '#7C8B5A') : '#5B6B3A';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 0.5;
  ctx.fillRect(-L, -R, L * 0.72, R * 2);
  ctx.strokeRect(-L, -R, L * 0.72, R * 2);
  ctx.fillStyle = tiny ? '#37474F' : '#B0BEC5';
  ctx.beginPath();
  ctx.moveTo(-L * 0.28, -R);
  ctx.lineTo(-L * 0.05, -R);
  ctx.quadraticCurveTo(R * 1.6, -R * 0.8, R * 1.8, 0);
  ctx.quadraticCurveTo(R * 1.6, R * 0.8, -L * 0.05, R);
  ctx.lineTo(-L * 0.28, R);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Yellow band = high explosive warhead
  ctx.fillStyle = '#FFD54F';
  ctx.fillRect(-L * 0.24, -R, Math.max(0.6, L * 0.05), R * 2);
  // Fins (HVAR's four large cruciform fins; wrap-around fins on M26 / BM-21)
  ctx.fillStyle = '#37474F';
  const fw = tiny ? 3.8 : artillery ? 2.6 : 2.4;
  ctx.beginPath();
  ctx.moveTo(-L + 0.4, -R);
  ctx.lineTo(-L - 0.6, -R - fw);
  ctx.lineTo(-L + 2.4, -R);
  ctx.moveTo(-L + 0.4, R);
  ctx.lineTo(-L - 0.6, R + fw);
  ctx.lineTo(-L + 2.4, R);
  ctx.fill();
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
// Free-fall bombs
// ════════════════════════════════════════════════════════════════════════════

interface BombLook {
  /** Half-length and radius. */
  l: number;
  r: number;
  body: string;
  band?: string;
  /** WWII box tail vs Mk 80-series conical tail with four swept fins. */
  tail: 'box' | 'conical' | 'ring';
  laser?: boolean;
}

function bombLook(proj: Projectile, era: Era): BombLook {
  const t = proj.bombType ?? 'bomb_500';
  const modern = era === 'era4' || era === 'era5';
  const enemy = proj.side === 'enemy';
  const weight = /2000/.test(t) ? 2000 : /1600/.test(t) ? 1600 : /1000/.test(t) ? 1000 : /250|carpet/.test(t) ? 250 : 500;
  const l = { 250: 4.6, 500: 5.6, 1000: 7, 1600: 8, 2000: 8.8 }[weight] ?? 5.6;
  const r = l * 0.3;
  if (t === 'gbu10_laser_paveway') return { l: 9, r: 2.4, body: '#5B6B3A', band: '#FFD54F', tail: 'conical', laser: true };
  if (enemy && (era === 'era1' || era === 'era2')) return { l, r, body: '#6E7766', band: '#C62828', tail: 'box' }; // IJN / IJA: grey-green, red band
  if (enemy) return { l, r: r * 0.95, body: '#6F7A61', tail: 'ring' }; // Soviet-pattern FAB with ring tail
  if (modern) return { l: l * 1.12, r: r * 0.85, body: '#5B6B3A', band: '#FFD54F', tail: 'conical' }; // Mk 82 / 83 / 84
  return { l, r, body: '#5B6B3A', band: '#FFD54F', tail: 'box' }; // AN-M64 / M65 GP bombs
}

/** Conventional bomb body in its local frame (nose along +x). */
export function drawConventionalBomb(ctx: CanvasRenderingContext2D, proj: Projectile, era: Era): void {
  const b = bombLook(proj, era);
  const { l, r } = b;
  // Tail fins
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 0.5;
  if (b.tail === 'box') {
    ctx.fillRect(-l - r * 0.9, -r * 1.25, r * 1.1, r * 2.5);
    ctx.strokeRect(-l - r * 0.9, -r * 1.25, r * 1.1, r * 2.5);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-l - r * 0.75, -r * 1.0, r * 0.8, r * 2.0);
  } else if (b.tail === 'ring') {
    ctx.beginPath();
    ctx.rect(-l - r * 1.0, -r * 1.2, r * 0.7, r * 2.4);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-l * 0.55, -r);
    ctx.lineTo(-l - r * 0.9, -r * 2);
    ctx.lineTo(-l - r * 0.9, r * 2);
    ctx.lineTo(-l * 0.55, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Body: cylindrical case with an ogive nose and a tapering tail cone
  ctx.fillStyle = b.body;
  ctx.beginPath();
  ctx.moveTo(-l, -r * 0.45);
  ctx.lineTo(-l * 0.45, -r);
  ctx.lineTo(l * 0.35, -r);
  ctx.quadraticCurveTo(l, -r * 0.9, l, 0);
  ctx.quadraticCurveTo(l, r * 0.9, l * 0.35, r);
  ctx.lineTo(-l * 0.45, r);
  ctx.lineTo(-l, r * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Highlight along the top for a rounded look
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(-l * 0.4, -r * 0.7, l * 0.9, r * 0.35);
  if (b.band) {
    ctx.fillStyle = b.band;
    ctx.fillRect(l * 0.42, -r * 0.92, Math.max(0.6, l * 0.08), r * 1.84);
    ctx.fillRect(-l * 0.42, -r * 0.98, Math.max(0.5, l * 0.06), r * 1.96);
  }
  if (b.laser) {
    // Paveway seeker head and canards
    ctx.fillStyle = '#90A4AE';
    ctx.beginPath();
    ctx.arc(l + r * 0.4, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(l * 0.75, -r * 1.6);
    ctx.lineTo(l * 0.75, r * 1.6);
    ctx.stroke();
  }
}

/** Cluster dispenser: a closed canister that splits open in the last third of the fall. */
export function drawClusterDispenser(ctx: CanvasRenderingContext2D, proj: Projectile, alt: number): void {
  const open = proj.flightProgress > 0.62;
  const l = 7;
  const r = 2;
  if (!open) {
    ctx.fillStyle = '#5B6B3A';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(-l, -r, l * 2, r * 2, r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(l * 0.4, -r, 0.8, r * 2);
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-l - 1.4, -r * 1.6, 1.4, r * 3.2);
    return;
  }
  // Split halves tumbling apart and the bomblet cloud spreading out below them
  const s = (proj.flightProgress - 0.62) / 0.38;
  ctx.fillStyle = '#5B6B3A';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0, side * (2 + s * 6));
    ctx.rotate(side * (0.4 + s * 1.5));
    ctx.fillRect(-l, -r * 0.5, l * 2, r);
    ctx.restore();
  }
  ctx.fillStyle = '#FFD54F';
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const rad = (2 + s * 22) * Math.sqrt((i + 1) / n);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad + alt * 0.15 * s, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Depth charges: tumbling drums (Mk 6/9 "ash cans", Mk 9 teardrop from era 2)
// ════════════════════════════════════════════════════════════════════════════

export function drawDepthCharge(rc: RenderContext, proj: Projectile): void {
  const ctx = rc.ctx;
  const alt = proj.arcAltitude ?? 0;
  // Ring of disturbed water where it entered / will enter
  ctx.fillStyle = 'rgba(2, 6, 12, 0.35)';
  ctx.beginPath();
  ctx.ellipse(proj.pos.x, proj.pos.y, 3, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(proj.pos.x, proj.pos.y - alt);
  ctx.rotate(rc.time * 6 + proj.id.length);
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.roundRect(-2.6, -3.2, 5.2, 6.4, 1);
  ctx.fill();
  ctx.stroke();
  // Drum hoops
  ctx.strokeStyle = '#B0BEC5';
  ctx.beginPath();
  ctx.moveTo(-2.6, -1.4);
  ctx.lineTo(2.6, -1.4);
  ctx.moveTo(-2.6, 1.4);
  ctx.lineTo(2.6, 1.4);
  ctx.stroke();
  ctx.restore();
}
