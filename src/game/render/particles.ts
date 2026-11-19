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
      // ══════════════════════════════════════════════════════════
      // 黑色延時引信爆炸煙霧 一朵一朵的 (Timed-Fuse Flak Puff Clouds)
      // ══════════════════════════════════════════════════════════
      const prog = 1 - (p.life / p.maxLife); // 0 (just exploded) to 1 (fading)
      const currentR = p.radius * (0.55 + prog * 0.95);
      const rot = (p.rot || 0) + (p.rotSpeed || 0.1) * (prog * 2.5);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(rot);

      // 1. Initial timed detonation flash core (bright yellow-orange flash for first 18% of duration)
      if (prog < 0.18) {
        const flashAlpha = 1 - (prog / 0.18);
        ctx.fillStyle = `rgba(255, 238, 88, ${flashAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, currentR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, currentR * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Multi-lobed billowing black smoke cloud ("一朵一朵的黑煙")
      const cloudAlpha = Math.max(0, (1 - prog) * 0.9);
      const lobeCount = 7;
      for (let l = 0; l < lobeCount; l++) {
        const lAng = (l * Math.PI * 2) / lobeCount;
        const lDist = currentR * 0.45;
        const lx = Math.cos(lAng) * lDist;
        const ly = Math.sin(lAng) * lDist;
        const lobeR = currentR * 0.55;

        const lobeGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, lobeR);
        lobeGrad.addColorStop(0, `rgba(16, 20, 26, ${cloudAlpha})`);
        lobeGrad.addColorStop(0.7, `rgba(26, 32, 40, ${cloudAlpha * 0.85})`);
        lobeGrad.addColorStop(1, 'rgba(38, 50, 56, 0)');

        ctx.fillStyle = lobeGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Dense central charcoal core
      ctx.fillStyle = `rgba(10, 14, 18, ${cloudAlpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(0, 0, currentR * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // 4. Shrapnel streaks (early phase)
      if (prog < 0.28) {
        const shrapAlpha = (1 - prog / 0.28) * 0.75;
        ctx.fillStyle = `rgba(255, 171, 64, ${shrapAlpha})`;
        for (let s = 0; s < 6; s++) {
          const sAng = (s * Math.PI) / 3 + 0.25;
          const sDist = currentR * (1.1 + prog * 1.2);
          ctx.beginPath();
          ctx.arc(Math.cos(sAng) * sDist, Math.sin(sAng) * sDist, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (p.type === 'flak') {
      // Authentic WWII AA Flak Burst: Expanding Charcoal Puffy Cloud Lobes with Detonation Core
      const prog = 1 - (p.life / p.maxLife); // 0 (just exploded) to 1 (fading)
      const currentR = p.radius * (0.6 + prog * 0.6);

      // 1. Central initial detonation flash (first 30% of lifetime)
      if (prog < 0.35) {
        const flashAlpha = (1 - prog / 0.35);
        ctx.fillStyle = `rgba(255, 238, 88, ${flashAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Multi-lobed charcoal black flak smoke puff (5 overlapping lobes)
      ctx.fillStyle = `rgba(26, 32, 40, ${0.75 * (1 - prog * 0.7)})`;
      for (let l = 0; l < 5; l++) {
        const lAng = (l * Math.PI * 2) / 5 + 0.3;
        const lDist = currentR * 0.45;
        const lx = p.x + Math.cos(lAng) * lDist;
        const ly = p.y + Math.sin(lAng) * lDist;
        ctx.beginPath();
        ctx.arc(lx, ly, currentR * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Expanding outer shrapnel fragmentation ring
      ctx.strokeStyle = `rgba(255, 138, 128, ${0.5 * (1 - prog)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentR * 1.25, 0, Math.PI * 2);
      ctx.stroke();
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
    } else if (p.type === 'flare') {
      // High-intensity magnesium flare with incandescent core
      const prog = 1 - (p.life / p.maxLife);
      const flareR = Math.max(2.5, p.radius * (1 - prog * 0.3));
      const fGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, flareR * 2.2);
      fGrad.addColorStop(0, '#FFFFFF');
      fGrad.addColorStop(0.25, '#FFF59D');
      fGrad.addColorStop(0.65, '#FF7043');
      fGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, flareR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Incandescent core spark
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, flareR * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'chaff') {
      // High-reflective aluminum/mylar chaff dipoles fluttering in wind
      ctx.strokeStyle = '#E0F7FA';
      ctx.lineWidth = 1.3;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.life * 7.5) % (Math.PI * 2));
      ctx.beginPath();
      ctx.moveTo(-p.radius, 0);
      ctx.lineTo(p.radius, 0);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'chaff_cloud') {
      // Expanding radar reflection decoy cloud over water/air
      const prog = 1 - (p.life / p.maxLife);
      const cloudR = Math.max(4, p.radius * (0.8 + prog * 0.4));
      const cGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, cloudR);
      cGrad.addColorStop(0, 'rgba(224, 247, 250, 0.45)');
      cGrad.addColorStop(0.5, 'rgba(178, 235, 242, 0.25)');
      cGrad.addColorStop(1, 'rgba(128, 222, 234, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, cloudR, 0, Math.PI * 2);
      ctx.fill();

      // Shimmering radar sparkles
      ctx.fillStyle = '#FFFFFF';
      for (let s = 0; s < 3; s++) {
        const sx = p.x + (Math.sin(p.life * 10 + s * 2.1) * cloudR * 0.6);
        const sy = p.y + (Math.cos(p.life * 8 + s * 3.2) * cloudR * 0.6);
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
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
