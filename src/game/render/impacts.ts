// Detonation effects by weapon type and surface. Heights are drawn toward screen-up, matching the
// pseudo-3D altitude used for shells and bombs in flight.
import { ImpactEffect } from '../impacts';
import { RenderContext, Camera, isWorldCircleVisible } from './context';

function rnd(seed: number, i: number): number {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) * (1 - v);

/** Seconds the blast itself lasts (craters persist beyond it). */
function blastDuration(e: ImpactEffect): number {
  return e.life > 10 ? 2.6 : e.life;
}

// ── primitives ────────────────────────────────────────────────────────────

function flash(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255, 255, 240, ${a})`);
  g.addColorStop(0.35, `rgba(255, 220, 120, ${a * 0.8})`);
  g.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fireball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, heat: number, a: number) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y - r * 0.15, r * 0.1, x, y, r);
  g.addColorStop(0, `rgba(255, ${Math.round(200 + 55 * heat)}, ${Math.round(120 * heat)}, ${a})`);
  g.addColorStop(0.5, `rgba(255, ${Math.round(110 + 60 * heat)}, 20, ${a * 0.85})`);
  g.addColorStop(1, `rgba(${Math.round(90 + 60 * heat)}, 30, 10, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function smokePuffs(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, n: number, rise: number, r0: number, dark: number) {
  for (let i = 0; i < n; i++) {
    const d = clamp01((t - i * 0.06) / 0.94);
    if (d <= 0) continue;
    const ox = (rnd(e.seed, i) - 0.5) * r0 * 1.4 + d * (rnd(e.seed, i + 9) - 0.3) * r0;
    const oy = -easeOut(d) * rise * (0.6 + rnd(e.seed, i + 3) * 0.6);
    const r = r0 * (0.6 + d * 1.4) * (0.7 + rnd(e.seed, i + 5) * 0.6);
    const a = (1 - d) * 0.42;
    const c = Math.round(45 + (1 - dark) * 120);
    ctx.fillStyle = `rgba(${c}, ${c}, ${c + 6}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(e.x + ox, e.y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Water column thrown up by a burst at or under the surface: a main jet with leaning side jets. */
function waterColumn(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, height: number, baseW: number, rise = 0.28) {
  // Rise fast, hang, then slump back into a widening curtain of spray
  const up = t < rise ? easeOut(t / rise) : 1 - clamp01((t - 0.5) / 0.5) * 0.7;
  const a = t < 0.65 ? 0.85 : 0.85 * (1 - (t - 0.65) / 0.35);
  if (a <= 0 || up <= 0.02) return;
  const slump = clamp01((t - 0.45) / 0.55);
  const jets = [
    { dx: 0, lean: 0, hk: 1, wk: 1 },
    { dx: -0.7, lean: -0.35, hk: 0.62 + rnd(e.seed, 1) * 0.15, wk: 0.65 },
    { dx: 0.7, lean: 0.35, hk: 0.55 + rnd(e.seed, 2) * 0.2, wk: 0.6 },
    { dx: -0.25, lean: -0.12, hk: 0.82, wk: 0.5 },
    { dx: 0.3, lean: 0.15, hk: 0.78, wk: 0.5 },
  ];
  for (const j of jets) {
    const h = height * up * j.hk;
    const bw = baseW * j.wk * (1 + slump * 0.8);
    const tw = bw * (0.55 + slump * 1.1);
    const x0 = e.x + j.dx * baseW;
    const xt = x0 + j.lean * h * (0.5 + slump * 0.6);
    const g = ctx.createLinearGradient(0, e.y, 0, e.y - h);
    g.addColorStop(0, `rgba(210, 236, 245, ${(a * 0.55).toFixed(3)})`);
    g.addColorStop(0.6, `rgba(240, 250, 253, ${(a * 0.9).toFixed(3)})`);
    g.addColorStop(1, `rgba(255, 255, 255, ${(a * 0.75).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - bw, e.y);
    ctx.quadraticCurveTo(x0 - bw * 0.35, e.y - h * 0.55, xt - tw, e.y - h);
    ctx.quadraticCurveTo(xt, e.y - h - tw * 1.2, xt + tw, e.y - h);
    ctx.quadraticCurveTo(x0 + bw * 0.35, e.y - h * 0.55, x0 + bw, e.y);
    ctx.closePath();
    ctx.fill();
  }
  // Spray crown and falling droplets
  const h = height * up;
  ctx.fillStyle = `rgba(250, 253, 255, ${(a * 0.8).toFixed(3)})`;
  for (let i = 0; i < 9; i++) {
    const cx = e.x + (rnd(e.seed, i) - 0.5) * baseW * (2 + slump * 3);
    const cy = e.y - h * (0.7 + rnd(e.seed, i + 20) * 0.35) + slump * h * 0.5 * rnd(e.seed, i + 30);
    ctx.beginPath();
    ctx.arc(cx, cy, baseW * (0.18 + rnd(e.seed, i + 40) * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }
  // Dye load tints the upper column
  if (e.dye) {
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = e.dye;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - h * 0.72, baseW * (0.9 + slump), h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function foamRing(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, r0: number, r1: number) {
  const r = r0 + (r1 - r0) * easeOut(t);
  const a = (1 - t) * 0.7;
  if (a <= 0) return;
  ctx.strokeStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
  ctx.lineWidth = 1.2 + (1 - t) * 1.6;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(220, 240, 245, ${(a * 0.35).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, r * 0.75, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function dustRing(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, r1: number) {
  const r = r1 * easeOut(t);
  const a = (1 - t) * 0.5;
  if (a <= 0) return;
  ctx.fillStyle = `rgba(150, 120, 90, ${(a * 0.6).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(190, 160, 120, ${a.toFixed(3)})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

/** Clods, spray or fragments thrown outward on ballistic arcs. */
function debris(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, n: number, reach: number, colour: string, r: number) {
  ctx.fillStyle = colour;
  for (let i = 0; i < n; i++) {
    const ang = rnd(e.seed, i + 60) * Math.PI * 2;
    const sp = reach * (0.5 + rnd(e.seed, i + 80) * 0.6);
    const d = easeOut(clamp01(t * 1.3));
    const lift = Math.sin(clamp01(t * 1.3) * Math.PI) * reach * 0.7 * rnd(e.seed, i + 100);
    const a = 1 - clamp01(t * 1.2);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(ang) * sp * d, e.y + Math.sin(ang) * sp * d * 0.6 - lift, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function sparks(ctx: CanvasRenderingContext2D, e: ImpactEffect, t: number, n: number, reach: number) {
  const a = 1 - clamp01(t * 2.2);
  if (a <= 0) return;
  ctx.strokeStyle = `rgba(255, 224, 130, ${a.toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = rnd(e.seed, i + 140) * Math.PI * 2;
    const d0 = reach * t * 1.6;
    const d1 = d0 + reach * 0.25;
    ctx.moveTo(e.x + Math.cos(ang) * d0, e.y + Math.sin(ang) * d0 * 0.7 - reach * 0.2 * t);
    ctx.lineTo(e.x + Math.cos(ang) * d1, e.y + Math.sin(ang) * d1 * 0.7 - reach * 0.2 * t);
  }
  ctx.stroke();
}

// ── per kind ──────────────────────────────────────────────────────────────

function drawBlast(ctx: CanvasRenderingContext2D, e: ImpactEffect) {
  const dur = blastDuration(e);
  const t = clamp01(e.age / dur);
  if (t >= 1) return;
  const s = e.size;
  const sea = e.surface === 'sea';
  const ship = e.surface === 'ship';

  switch (e.kind) {
    case 'bullet': {
      if (sea) {
        ctx.fillStyle = `rgba(240, 250, 255, ${(1 - t) * 0.85})`;
        for (let i = 0; i < 3; i++) {
          const h = Math.sin(t * Math.PI) * s * (0.6 + rnd(e.seed, i) * 0.8);
          ctx.beginPath();
          ctx.arc(e.x + (rnd(e.seed, i + 5) - 0.5) * 5, e.y - h, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(170, 140, 100, ${(1 - t) * 0.6})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y - t * 3, 1.5 + t * 3, 0, Math.PI * 2);
        ctx.fill();
        if (t < 0.15) flash(ctx, e.x, e.y, 3, 0.9);
      }
      break;
    }
    case 'shell_light': {
      flash(ctx, e.x, e.y - 2, s * 0.55, 1 - clamp01(t * 6));
      if (sea) {
        foamRing(ctx, e, t, s * 0.15, s * 0.6);
        waterColumn(ctx, e, t, s * 1.3, s * 0.14);
      } else {
        if (!ship) dustRing(ctx, e, t, s * 0.7);
        debris(ctx, e, t, 8, s * 0.9, ship ? '#90A4AE' : '#6D5A44', 1.1);
        smokePuffs(ctx, e, t, 3, s * 1.1, s * 0.3, 0.6);
        if (ship) {
          sparks(ctx, e, t, 8, s);
          fireball(ctx, e.x, e.y - 2, s * 0.35 * Math.sin(clamp01(t * 2) * Math.PI), 0.8, 0.9);
        }
      }
      break;
    }
    case 'shell_heavy': {
      flash(ctx, e.x, e.y - 4, s * 0.7, 1 - clamp01(t * 5));
      if (sea) {
        foamRing(ctx, e, t, s * 0.2, s * 0.95);
        waterColumn(ctx, e, t, s * 1.7, s * 0.2, 0.3);
        debris(ctx, e, t, 12, s * 0.8, 'rgba(240, 250, 255, 0.85)', 1.3);
      } else {
        if (!ship) dustRing(ctx, e, t, s * 1.1);
        fireball(ctx, e.x, e.y - s * 0.3 * t, s * (0.25 + 0.35 * easeOut(clamp01(t * 3))), 1 - t, 1 - clamp01(t * 2.5));
        debris(ctx, e, t, 16, s * 1.3, ship ? '#90A4AE' : '#5D4A38', 1.5);
        smokePuffs(ctx, e, t, 5, s * 1.8, s * 0.4, 0.8);
        if (ship) sparks(ctx, e, t, 14, s);
      }
      break;
    }
    case 'rocket': {
      flash(ctx, e.x, e.y - 2, s * 0.8, 1 - clamp01(t * 7));
      if (sea) {
        foamRing(ctx, e, t, s * 0.15, s * 0.6);
        waterColumn(ctx, e, t, s * 1.1, s * 0.14, 0.2);
      } else {
        fireball(ctx, e.x, e.y - 2, s * (0.3 + 0.3 * easeOut(clamp01(t * 4))), 1 - t, 1 - clamp01(t * 3.5));
        debris(ctx, e, t, 10, s * 1.1, ship ? '#90A4AE' : '#5D4A38', 1.1);
        sparks(ctx, e, t, 10, s * 0.9);
        smokePuffs(ctx, e, t, 3, s * 1.2, s * 0.32, 0.75);
      }
      break;
    }
    case 'bomb': {
      flash(ctx, e.x, e.y - 4, s * 0.9, 1 - clamp01(t * 6));
      if (sea) {
        // Bombs burst under the surface: a broad white dome, then a tall ragged plume
        if (t < 0.18) {
          ctx.fillStyle = `rgba(230, 245, 250, ${0.8})`;
          ctx.beginPath();
          ctx.ellipse(e.x, e.y, s * 0.6 * easeOut(t / 0.18), s * 0.35 * easeOut(t / 0.18), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        foamRing(ctx, e, t, s * 0.3, s * 1.3);
        waterColumn(ctx, e, t, s * 1.35, s * 0.26, 0.32);
        debris(ctx, e, t, 14, s * 0.9, 'rgba(240, 250, 255, 0.85)', 1.4);
      } else {
        if (!ship) dustRing(ctx, e, t, s * 1.3);
        fireball(ctx, e.x, e.y - s * 0.5 * t, s * (0.25 + 0.3 * easeOut(clamp01(t * 2.5))), 1 - t, 1 - clamp01(t * 1.8));
        debris(ctx, e, t, 20, s * 1.5, ship ? '#90A4AE' : '#5D4A38', 1.6);
        smokePuffs(ctx, e, t, 6, s * 2.2, s * 0.45, 0.9);
        if (ship) sparks(ctx, e, t, 16, s * 1.2);
      }
      break;
    }
    case 'missile': {
      flash(ctx, e.x, e.y - 4, s * 1.1, 1 - clamp01(t * 5));
      if (sea) {
        foamRing(ctx, e, t, s * 0.2, s * 1.0);
        waterColumn(ctx, e, t, s * 1.0, s * 0.24, 0.22);
      } else {
        fireball(ctx, e.x, e.y - s * 0.4 * t, s * (0.3 + 0.35 * easeOut(clamp01(t * 2.2))), 1 - t, 1 - clamp01(t * 1.6));
        // Secondary burning fuel / propellant
        fireball(ctx, e.x + s * 0.3, e.y - s * 0.1, s * 0.3 * Math.sin(clamp01(t * 1.5) * Math.PI), 0.6, 0.7);
        sparks(ctx, e, t, 18, s * 1.3);
        smokePuffs(ctx, e, t, 7, s * 2.4, s * 0.5, 1);
      }
      break;
    }
    case 'torpedo': {
      // Towering white column alongside the hull, then sheets of water falling back
      flash(ctx, e.x, e.y, s * 0.5, 1 - clamp01(t * 6));
      foamRing(ctx, e, t, s * 0.3, s * 1.2);
      waterColumn(ctx, e, t, s * 1.5, s * 0.22, 0.3);
      smokePuffs(ctx, e, t, 3, s * 1.2, s * 0.3, 0.5);
      break;
    }
    case 'depth_charge': {
      // Delayed: the sea bulges into a white dome, then the plume erupts
      const d = clamp01(t / 0.22);
      ctx.fillStyle = `rgba(200, 235, 245, ${(0.7 * (1 - clamp01((t - 0.2) / 0.6))).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, s * 0.6 * easeOut(d), s * 0.35 * easeOut(d), 0, 0, Math.PI * 2);
      ctx.fill();
      if (t > 0.18) {
        const t2 = (t - 0.18) / 0.82;
        foamRing(ctx, e, t2, s * 0.4, s * 1.3);
        waterColumn(ctx, e, t2, s * 1.25, s * 0.28, 0.3);
      }
      break;
    }
    case 'hedgehog': {
      foamRing(ctx, e, t, s * 0.2, s * 0.9);
      waterColumn(ctx, e, t, s * 1.0, s * 0.13, 0.2);
      break;
    }
    case 'cluster': {
      // Ripple of bomblets across the footprint
      for (let i = 0; i < 16; i++) {
        const delay = rnd(e.seed, i + 200) * 0.45;
        const lt = clamp01((t - delay) / 0.4);
        if (lt <= 0 || lt >= 1) continue;
        const ang = rnd(e.seed, i + 220) * Math.PI * 2;
        const r = s * Math.sqrt(rnd(e.seed, i + 240));
        const bx = e.x + Math.cos(ang) * r;
        const by = e.y + Math.sin(ang) * r * 0.7;
        flash(ctx, bx, by - 1, 7, 1 - lt * 1.8);
        ctx.fillStyle = sea ? `rgba(240, 250, 255, ${(1 - lt) * 0.8})` : `rgba(120, 100, 80, ${(1 - lt) * 0.6})`;
        ctx.beginPath();
        ctx.arc(bx, by - lt * 4, 2 + lt * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      smokePuffs(ctx, e, t, 4, s * 0.8, s * 0.25, sea ? 0.1 : 0.6);
      break;
    }
  }
}

/** Scorched crater left by heavy ordnance on land, fading out at the end of its life. */
function drawCrater(ctx: CanvasRenderingContext2D, e: ImpactEffect) {
  if (e.life <= 10 || e.surface !== 'land') return;
  const fade = 1 - clamp01((e.age - e.life * 0.7) / (e.life * 0.3));
  const grow = easeOut(clamp01(e.age / 0.4));
  const r = e.size * 0.38 * grow;
  if (r <= 0 || fade <= 0) return;
  ctx.fillStyle = `rgba(30, 24, 18, ${(0.35 * fade).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, r * 1.9, r * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(14, 10, 8, ${(0.7 * fade).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(120, 100, 80, ${(0.5 * fade).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function withCamera(rc: RenderContext, camera: Camera, fn: (ctx: CanvasRenderingContext2D) => void) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  fn(ctx);
  ctx.restore();
}

/** Ground layer: craters and scorch marks, drawn under units. */
export function drawImpactScars(rc: RenderContext, impacts: ImpactEffect[], camera: Camera) {
  withCamera(rc, camera, (ctx) => {
    for (const e of impacts) {
      if (e.life > 10 && isWorldCircleVisible(rc, e.x, e.y, e.size * 2, camera)) drawCrater(ctx, e);
    }
  });
}

/** Blast layer: flashes, fireballs, water columns and smoke, drawn over units. */
export function drawImpacts(rc: RenderContext, impacts: ImpactEffect[], camera: Camera) {
  withCamera(rc, camera, (ctx) => {
    for (const e of impacts) {
      if (e.age >= blastDuration(e)) continue;
      if (!isWorldCircleVisible(rc, e.x, e.y - e.size, e.size * 3.5, camera)) continue;
      drawBlast(ctx, e);
    }
  });
}
