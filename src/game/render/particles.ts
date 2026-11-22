import { Particle } from '../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from './context';

// Draw Particles including WWII Water Geysers & Authentic Flak Detonations
export function drawParticles(rc: RenderContext, particles: Particle[], camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const p of particles) {
    if (!isWorldCircleVisible(rc, p.x, p.y, p.radius + 90, camera)) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'flak_puff') {
      drawAirburst(ctx, p);
    } else if (p.type === 'muzzle_flash') {
      drawMuzzleFlash(ctx, p);
    } else if (p.type === 'gun_smoke') {
      drawGunSmoke(ctx, p);
    } else if (p.type === 'geyser') {
      // Soaring WWII naval bomb/torpedo water geyser column!
      const prog = 1 - (p.life / p.maxLife); // 0 to 1
      const geyserHeight = p.radius * 2.8 * (1 - prog * 0.35);
      const colW = Math.max(6, p.radius * 0.45);

      // Water base splash ring
      ctx.strokeStyle = 'rgba(224, 247, 250, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radius * 1.3, p.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Expanding foam ripples
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radius * (1 + prog * 1.5), p.radius * 0.5 * (1 + prog * 1.5), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Vertical white geyser fountain plume
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y - geyserHeight);
      grad.addColorStop(0, 'rgba(224, 247, 250, 0.9)');
      grad.addColorStop(0.7, 'rgba(178, 235, 242, 0.8)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p.x - colW, p.y);
      ctx.quadraticCurveTo(p.x - colW * 0.5, p.y - geyserHeight * 0.6, p.x, p.y - geyserHeight);
      ctx.quadraticCurveTo(p.x + colW * 0.5, p.y - geyserHeight * 0.6, p.x + colW, p.y);
      ctx.closePath();
      ctx.fill();

      // Airborne water droplets around geyser head
      ctx.fillStyle = '#FFFFFF';
      for (let d = -2; d <= 2; d++) {
        ctx.beginPath();
        ctx.arc(p.x + d * (colW * 0.7), p.y - geyserHeight + Math.abs(d) * 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.type === 'fire') {
      const prog = 1 - (p.life / p.maxLife);
      const fR = p.radius * (1 - prog * 0.4);
      const fGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, fR);
      fGrad.addColorStop(0, '#FFF9C4');
      fGrad.addColorStop(0.35, '#FFA726');
      fGrad.addColorStop(0.75, '#FF3D00');
      fGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fR, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'oil_slick') {
      ctx.fillStyle = p.color || 'rgba(10, 18, 28, 0.6)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'tracer') {
      const tLen = p.length || Math.min(26, Math.hypot(p.vx, p.vy) * 0.035);
      const tAng = Math.atan2(p.vy, p.vx);
      const tailX = p.x - Math.cos(tAng) * tLen;
      const tailY = p.y - Math.sin(tAng) * tLen;

      ctx.save();
      // 1. Radiant outer bloom
      ctx.strokeStyle = p.color || 'rgba(255, 224, 130, 0.65)';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // 2. High-intensity saturated tracer core
      ctx.strokeStyle = p.color?.includes('FF5252') ? '#FF1744' : '#FFE082';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(tailX * 0.35 + p.x * 0.65, tailY * 0.35 + p.y * 0.65);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // 3. White-hot point
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.shape === 'ring' || p.type === 'shockwave') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

/** Deterministic per-particle variation in [0, 1) from its seed angle, so shapes stay stable frame to frame. */
function hash01(seed: number, k: number): number {
  const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Time-fuzed anti-aircraft shell bursting in the air: an incandescent fireball, a spray of
 * fragments and a pressure ring in the first instants, then the lingering, irregular cloud of
 * detonation smoke that drifts and thins. Colour comes from the particle (black for US 5"/38 and
 * 90 mm, brown-grey for Japanese and Soviet charges).
 */
function drawAirburst(ctx: CanvasRenderingContext2D, p: Particle) {
  const prog = 1 - p.life / p.maxLife; // 0 = detonation, 1 = dissipated
  const seed = p.rot ?? 0;
  const R = p.radius;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 1;

  // 1. Smoke cloud: grows quickly, then slowly; lobes have stable irregular sizes
  const grow = 0.45 + Math.min(1, prog * 3.2) * 0.55 + prog * 0.35;
  const cloudR = R * grow;
  const smokeAlpha = Math.max(0, Math.pow(1 - prog, 1.3)) * 0.88;
  if (smokeAlpha > 0.01) {
    // All lobes are one silhouette filled once, so overlaps do not darken into "bubbles"
    const lobes = 9;
    const cloudPath = (inflate: number) => {
      ctx.beginPath();
      for (let l = 0; l < lobes; l++) {
        const a = (l / lobes) * Math.PI * 2 + seed;
        const reach = cloudR * (0.3 + hash01(seed, l) * 0.28);
        const lobeR = cloudR * (0.4 + hash01(seed, l + 20) * 0.2) * inflate;
        const cx = Math.cos(a) * reach;
        const cy = Math.sin(a) * reach;
        ctx.moveTo(cx + lobeR, cy);
        ctx.arc(cx, cy, lobeR, 0, Math.PI * 2);
      }
      ctx.moveTo(cloudR * 0.55 * inflate, 0);
      ctx.arc(0, 0, cloudR * 0.55 * inflate, 0, Math.PI * 2);
    };
    ctx.fillStyle = p.color || '#161A1E';
    ctx.globalAlpha = smokeAlpha * 0.3; // soft ragged halo
    cloudPath(1.2);
    ctx.fill();
    ctx.globalAlpha = smokeAlpha;
    cloudPath(1);
    ctx.fill();
    // Sunlit upper-left, shadowed lower-right, kept inside the cloud
    ctx.save();
    cloudPath(1);
    ctx.clip();
    const shade = ctx.createRadialGradient(-cloudR * 0.4, -cloudR * 0.45, 0, -cloudR * 0.4, -cloudR * 0.45, cloudR * 1.3);
    shade.addColorStop(0, 'rgba(207, 216, 220, 0.32)');
    shade.addColorStop(0.5, 'rgba(120, 130, 140, 0.08)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = shade;
    ctx.fillRect(-cloudR * 1.5, -cloudR * 1.5, cloudR * 3, cloudR * 3);
    ctx.restore();
  }

  // 2. Fragment spray: hot streaks flung outward from the burst point
  if (prog < 0.3) {
    const k = prog / 0.3;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#FFB74D';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2 + hash01(seed, s + 60) * 0.5;
      const r0 = R * (0.3 + k * 0.9);
      const r1 = r0 + R * (0.25 + hash01(seed, s + 80) * 0.35);
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    }
    ctx.stroke();
  }

  // 3. Pressure ring
  if (prog < 0.22) {
    const k = prog / 0.22;
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.4 + k * 1.2), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Fireball: white-hot centre to orange, gone within a fifth of a second of game time
  if (prog < 0.16) {
    const k = prog / 0.16;
    const fr = R * (0.35 + k * 0.4);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, fr);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.35, 'rgba(255, 241, 118, 0.95)');
    g.addColorStop(0.75, 'rgba(255, 145, 0, 0.7)');
    g.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.globalAlpha = 1 - k * 0.8;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, fr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Muzzle blast along the bore (rot): a forward flame tongue, the side jets thrown out by the
 * muzzle, and a white-hot core. Sized by the gun (radius) and only a few frames long.
 */
function drawMuzzleFlash(ctx: CanvasRenderingContext2D, p: Particle) {
  const k = 1 - p.life / p.maxLife;
  const size = p.radius * (0.7 + k * 0.5);
  const alpha = 1 - k;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot ?? 0);
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(size * 0.3, 0, 0, size * 0.3, 0, size * 1.2);
  glow.addColorStop(0, `rgba(255, 224, 130, ${0.75 * alpha})`);
  glow.addColorStop(1, 'rgba(255, 111, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(size * 0.3, 0, size * 1.2, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Forward tongue and the two side jets
  ctx.fillStyle = `rgba(255, 171, 64, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.22);
  ctx.lineTo(size * 1.5, 0);
  ctx.lineTo(0, size * 0.22);
  ctx.moveTo(size * 0.1, 0);
  ctx.lineTo(size * 0.45, -size * 0.75);
  ctx.lineTo(size * 0.35, 0);
  ctx.lineTo(size * 0.45, size * 0.75);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(size * 0.3, 0, size * 0.42, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Cordite smoke rolling off a heavy gun: a soft brown-grey cloud that swells and fades. */
function drawGunSmoke(ctx: CanvasRenderingContext2D, p: Particle) {
  const k = 1 - p.life / p.maxLife;
  const r = p.radius * (0.6 + k * 1.4);
  const a = Math.max(0, (1 - k) * 0.55);
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, `rgba(150, 140, 124, ${a})`);
  g.addColorStop(0.6, `rgba(120, 112, 100, ${a * 0.6})`);
  g.addColorStop(1, 'rgba(110, 104, 96, 0)');
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
