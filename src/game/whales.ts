import { Era, Island, Vector2D, WhalePod } from '../types/game';
import { dist } from './procedural';

/**
 * Neutral sea life: whale pods cruising the deep water between the islands. They surface for a
 * few breaths (the blow is visible from a ship's bridge), then sound for a long dive. Harmless,
 * but a submerged pod near a sonar ship can be logged as a contact before the operators class it
 * as biologics, as happened often enough in every war at sea.
 */

const SPECIES_BY_ERA: Record<Era, WhalePod['species'][]> = {
  era1: ['sperm', 'humpback'],
  era2: ['sperm', 'humpback'],
  era3: ['fin', 'humpback'],
  era4: ['sperm', 'humpback'],
  era5: ['fin', 'sperm'],
};

export const WHALE_NAME: Record<WhalePod['species'], string> = {
  humpback: '座頭鯨',
  sperm: '抹香鯨',
  fin: '長須鯨',
};

/** Body length in world units (≈ metres). */
export const WHALE_LENGTH: Record<WhalePod['species'], number> = {
  humpback: 15,
  sperm: 17,
  fin: 21,
};

const SURFACE_S = 22;
const DIVE_S = 48;

function deepWater(p: Vector2D, islands: Island[], worldSize: number): boolean {
  if (p.x < 400 || p.y < 400 || p.x > worldSize - 400 || p.y > worldSize - 400) return false;
  return islands.every((i) => dist(p, i.center) > i.radius + 700);
}

export function spawnWhales(islands: Island[], worldSize: number, era: Era, seed = 1): WhalePod[] {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const species = SPECIES_BY_ERA[era];
  const pods: WhalePod[] = [];
  for (let tries = 0; tries < 200 && pods.length < 4; tries++) {
    const pos = { x: rnd() * worldSize, y: rnd() * worldSize };
    if (!deepWater(pos, islands, worldSize) || pods.some((p) => dist(p.pos, pos) < 2500)) continue;
    const sp = species[pods.length % species.length];
    const surfaced = rnd() < 0.5;
    pods.push({
      id: `whale-${pods.length}`,
      species: sp,
      pos,
      heading: rnd() * Math.PI * 2,
      speed: 8 + rnd() * 4, // 4-6 kt on the shared speed curve
      count: sp === 'sperm' ? 3 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 3),
      phaseT: (surfaced ? SURFACE_S : DIVE_S) * rnd(),
      surfaced,
      spoutT: rnd() * 6,
    });
  }
  return pods;
}

/** Cruise, turn away from shoal water, and cycle between breathing at the surface and diving. */
export function updateWhales(pods: WhalePod[], dt: number, islands: Island[], worldSize: number): void {
  for (const w of pods) {
    w.phaseT -= dt;
    if (w.phaseT <= 0) {
      w.surfaced = !w.surfaced;
      w.phaseT = w.surfaced ? SURFACE_S * (0.7 + Math.random() * 0.6) : DIVE_S * (0.7 + Math.random() * 0.6);
      if (!w.surfaced) w.reported = false;
      w.heading += (Math.random() - 0.5) * 0.8;
    }
    w.spoutT += dt;
    const ahead = { x: w.pos.x + Math.cos(w.heading) * 400, y: w.pos.y + Math.sin(w.heading) * 400 };
    if (!deepWater(ahead, islands, worldSize)) w.heading += 0.6 * dt;
    else w.heading += Math.sin(w.spoutT * 0.05 + w.pos.x) * 0.01 * dt;
    const v = w.speed * (w.surfaced ? 0.6 : 1);
    w.pos.x += Math.cos(w.heading) * v * dt;
    w.pos.y += Math.sin(w.heading) * v * dt;
  }
}
