import { Aircraft, GroundUnit, GroundUnitType, Ship, ShipSide, Vector2D } from '../../types/game';
import { drawGroundSilhouette, GROUND_SILHOUETTE_SCALE, groundSilhouetteClass } from '../unitPreviewRenderer';
import { Camera, RenderContext, isWorldCircleVisible } from './context';

/**
 * Small "living" details layered over the unit artwork: funnel exhaust on steam warships,
 * navigation and anti-collision lights on aircraft, dust behind moving vehicles and burnt-out
 * wrecks where vehicles were destroyed.
 */

/** Prevailing wind the smoke and dust drift with (map units / s). */
const WIND: Vector2D = { x: 7, y: -4 };

// ── Ships ─────────────────────────────────────────────────────────────────────────────────────
const NO_FUNNEL = new Set<Ship['type']>([
  'submarine', 'lcvp', 'lcm8', 'lcac', 'pbr', 'river_gunboat', 'patrol_boat', 'osa', 'komar_ptg', 'lsm_r',
]);

/**
 * Boiler smoke from the funnels: dark oil-fired smoke on WWII and Korean War ships, thinning to a
 * light haze on the steam and early gas-turbine ships of the 1960s, none on late Cold War gas
 * turbines (the steam-driven Iowa excepted). Heavier at high power.
 */
export function drawFunnelSmoke(rc: RenderContext, ship: Ship): void {
  if (ship.isSunk || NO_FUNNEL.has(ship.type) || ship.health < ship.maxHealth * 0.55) return;
  if (ship.type === 'cvn' || ship.type === 'cgn_kirov' || ship.type === 'cg_virginia') return; // nuclear
  const era = ship.era;
  const late = era === 'era5';
  if (late && ship.type !== 'bb_iowa_mod') return;
  const tone = era === 'era4' || late ? '176, 178, 182' : '104, 106, 112';
  const strength = era === 'era4' || late ? 0.45 : 1;
  const power = Math.min(1, Math.abs(ship.speed) / Math.max(1, ship.maxSpeed));
  const alpha0 = (0.24 + 0.46 * power) * strength;

  const ctx = rc.ctx;
  const cosH = Math.cos(ship.heading);
  const sinH = Math.sin(ship.heading);
  const isCarrier = ship.type === 'carrier' || ship.type === 'cve' || ship.type === 'cv63';
  // Funnels sit amidships; a carrier's in the starboard island
  const lateral = isCarrier ? (ship.width ?? 20) * 0.38 : 0;
  const ox = ship.pos.x + cosH * ship.length * 0.04 - sinH * lateral;
  const oy = ship.pos.y + sinH * ship.length * 0.04 + cosH * lateral;
  // Apparent wind over the deck: true wind minus the ship's own motion
  const vx = WIND.x - (ship.vel?.x ?? 0) * 0.6;
  const vy = WIND.y - (ship.vel?.y ?? 0) * 0.6;

  const puffs = 6;
  for (let k = 0; k < puffs; k++) {
    const t = (rc.time * 0.55 + k / puffs + (ship.id.length % 7) * 0.13) % 1;
    const x = ox + vx * t * 4.5 + Math.sin(rc.time * 1.3 + k) * 2;
    const y = oy + vy * t * 4.5 + Math.cos(rc.time * 1.1 + k) * 2;
    const r = 3 + t * (8 + 8 * power);
    ctx.fillStyle = `rgba(${tone}, ${alpha0 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Aircraft ──────────────────────────────────────────────────────────────────────────────────
/**
 * Position lights (red port, green starboard wingtip) and a flashing red anti-collision beacon,
 * shown from the jet age on; WWII aircraft flew darkened in combat zones.
 */
export function drawAircraftLights(rc: RenderContext, plane: Aircraft, cosH: number, sinH: number): void {
  if (plane.state === 'shot_down' || rc.era === 'era1' || rc.era === 'era2') return;
  if (plane.model === 'ohka' || plane.model.startsWith('kamikaze')) return;
  const ctx = rc.ctx;
  const span = plane.role === 'level_bomber' || plane.role === 'aew' ? 24 : 13;
  // Screen y grows downward, so (+span along the right-hand normal) is the starboard tip
  const stbd = { x: plane.pos.x - sinH * span, y: plane.pos.y + cosH * span };
  const port = { x: plane.pos.x + sinH * span, y: plane.pos.y - cosH * span };
  ctx.fillStyle = 'rgba(105, 240, 174, 0.85)';
  ctx.beginPath();
  ctx.arc(stbd.x, stbd.y, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 82, 82, 0.85)';
  ctx.beginPath();
  ctx.arc(port.x, port.y, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Beacon: two short flashes each 1.2 s, phase-shifted per aircraft
  const phase = (rc.time + (plane.id.charCodeAt(plane.id.length - 1) % 10) * 0.11) % 1.2;
  if (phase < 0.06 || (phase > 0.18 && phase < 0.24)) {
    const g = ctx.createRadialGradient(plane.pos.x, plane.pos.y, 0, plane.pos.x, plane.pos.y, 5);
    g.addColorStop(0, 'rgba(255, 235, 238, 0.95)');
    g.addColorStop(0.4, 'rgba(255, 23, 68, 0.6)');
    g.addColorStop(1, 'rgba(255, 23, 68, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(plane.pos.x, plane.pos.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Ground units ──────────────────────────────────────────────────────────────────────────────
/** Dust kicked up behind a moving vehicle (drawn in the unit's local, heading-rotated frame). */
export function drawGroundDust(rc: RenderContext, unit: GroundUnit, scale: number): void {
  const kind = groundSilhouetteClass(unit.type);
  if (kind === 'infantry' || kind === 'atgm' || kind === 'mortar' || unit.embarkedInShipId) return;
  const speed = Math.hypot(unit.vel?.x ?? 0, unit.vel?.y ?? 0);
  if (speed < 1.5 || unit.order.type !== 'move') return;
  const ctx = rc.ctx;
  const len = 14 * scale + 12;
  for (let k = 0; k < 5; k++) {
    const t = (rc.time * 1.6 + k / 5) % 1;
    const x = -10 * scale - t * len * 1.6;
    for (const side of [-1, 1]) {
      ctx.fillStyle = `rgba(176, 150, 112, ${0.32 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(x, side * 5 * scale + Math.sin(rc.time * 3 + k) * 1.5, 2 + t * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export interface GroundWreck {
  id: string;
  type: GroundUnitType;
  side: ShipSide;
  pos: Vector2D;
  heading: number;
  age: number;
}

/** How long a burnt-out vehicle stays on the map (s). */
export const WRECK_LIFETIME = 120;

/** Vehicles leave a wreck; infantry and towed weapons do not. */
export function leavesWreck(type: GroundUnitType): boolean {
  const kind = groundSilhouetteClass(type);
  return kind !== 'infantry' && kind !== 'mortar' && kind !== 'atgm' && kind !== 'towed';
}

/** Scorched ground, the charred hulk and a smoke column thinning over the wreck's lifetime. */
/** World units covered by a cached hulk sprite, and its pixels per world unit. */
const HULK_SPAN = 96;
const HULK_RES = 4;
const HULK_CACHE = new Map<string, HTMLCanvasElement>();

function charredHulk(type: GroundWreck['type'], friendly: boolean, scale: number): HTMLCanvasElement {
  const key = `${type}|${friendly}|${scale}`;
  let c = HULK_CACHE.get(key);
  if (c) return c;
  const px = HULK_SPAN * HULK_RES;
  // The silhouette at full colour, then soot-toned through the filter once
  const raw = document.createElement('canvas');
  raw.width = px;
  raw.height = px;
  const rctx = raw.getContext('2d')!;
  rctx.translate(px / 2, px / 2);
  rctx.scale(HULK_RES, HULK_RES);
  drawGroundSilhouette(rctx, type, friendly, scale);
  c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const cctx = c.getContext('2d')!;
  cctx.filter = 'grayscale(1) brightness(0.28)';
  cctx.drawImage(raw, 0, 0);
  HULK_CACHE.set(key, c);
  return c;
}

export function drawGroundWrecks(rc: RenderContext, wrecks: GroundWreck[], camera: Camera): void {
  if (wrecks.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  for (const w of wrecks) {
    if (!isWorldCircleVisible(rc, w.pos.x, w.pos.y, 80, camera)) continue;
    const fade = Math.max(0, 1 - w.age / WRECK_LIFETIME);
    const scale = GROUND_SILHOUETTE_SCALE[groundSilhouetteClass(w.type)];
    ctx.save();
    ctx.translate(w.pos.x, w.pos.y);
    // Scorch mark
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    g.addColorStop(0, `rgba(20, 16, 12, ${0.65 * fade + 0.15})`);
    g.addColorStop(1, 'rgba(20, 16, 12, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, w.heading, 0, Math.PI * 2);
    ctx.fill();
    // Charred hulk: the vehicle's silhouette in soot (pre-rendered once per type; a canvas filter
    // applied per frame costs a full-canvas offscreen pass for every wreck)
    ctx.save();
    ctx.rotate(w.heading);
    ctx.globalAlpha = 0.9;
    const hulk = charredHulk(w.type, w.side === 'player', scale);
    ctx.drawImage(hulk, -HULK_SPAN / 2, -HULK_SPAN / 2, HULK_SPAN, HULK_SPAN);
    ctx.restore();
    ctx.globalAlpha = 1;
    // Embers for the first half-minute
    if (w.age < 30) {
      const flicker = 0.5 + 0.5 * Math.sin(rc.time * 14 + w.pos.x);
      ctx.fillStyle = `rgba(255, 120, 30, ${0.55 * flicker * (1 - w.age / 30)})`;
      ctx.beginPath();
      ctx.arc(1, -1, 2.5 + flicker * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Smoke column drifting downwind
    const puffs = 5;
    for (let k = 0; k < puffs; k++) {
      const t = (rc.time * 0.4 + k / puffs) % 1;
      ctx.fillStyle = `rgba(30, 30, 32, ${0.4 * (1 - t) * fade})`;
      ctx.beginPath();
      ctx.arc(WIND.x * t * 4, WIND.y * t * 4 - t * 10, 3 + t * 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
