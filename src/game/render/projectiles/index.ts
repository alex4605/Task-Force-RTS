import { Projectile } from '../../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from '../context';
import { PROJECTILE_DRAWERS } from './bodies';

// Draw Projectiles with Authentic WWII Tracers, Ballistic Arcs & Cavitation Wakes
export function drawProjectiles(rc: RenderContext, projectiles: Projectile[], camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const proj of projectiles) {
    if (proj.isDead) continue;
    if (!isWorldCircleVisible(rc, proj.pos.x, proj.pos.y, 300, camera)) continue;

    // Type-specific body: see bodies.ts
    PROJECTILE_DRAWERS[proj.type]?.(rc, proj, camera, projectiles);
  }

  ctx.restore();
}
