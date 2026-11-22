import { Decoy, EsmContact, ShipSide, Vector2D } from '../../types/game';
import { decoyStrength } from '../ew';
import { Camera, RenderContext, isWorldCircleVisible } from './context';

/**
 * Electronic-warfare artwork, top-down at map scale:
 *  · flares: a white-hot magnesium core in an orange glow, falling back behind the aircraft on a
 *    white smoke trail, reddening as they burn out;
 *  · aircraft chaff: a puff of foil dipoles that blooms in a fraction of a second, then spreads
 *    and drifts downwind, glinting;
 *  · ship chaff (SRBOC/RBOC/PK): a rocket on a smoke trail out to the burst point, then a large
 *    silver cloud that keeps growing and drifting;
 *  · ship IR decoys: a pot burning on the water under a plume blown downwind;
 *  · noisemakers, the towed Nixie and the MOSS simulator: acoustic rings in the water;
 *  · ESM bearing strobes and jamming zones.
 */

type Ctx = CanvasRenderingContext2D;

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function begin(rc: RenderContext, camera: Camera): Ctx {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  return ctx;
}

function drawFlare(ctx: Ctx, d: Decoy, t: number): void {
  const s = decoyStrength('flare', d.age);
  const late = Math.min(1, d.age / d.life);
  // Smoke trail, thickening and fading toward the tail
  const tr = d.trail ?? [];
  for (let i = 1; i < tr.length; i++) {
    const k = i / tr.length;
    ctx.strokeStyle = `rgba(236, 239, 241, ${0.32 * k * (1 - late * 0.6)})`;
    ctx.lineWidth = 1 + (1 - k) * 3.5;
    ctx.beginPath();
    ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
    ctx.lineTo(tr[i].x, tr[i].y);
    ctx.stroke();
  }
  const flicker = 0.85 + 0.15 * Math.sin(t * 47 + d.seed);
  const r = (3 + 6 * s) * flicker;
  const g = ctx.createRadialGradient(d.pos.x, d.pos.y, 0, d.pos.x, d.pos.y, r * 2.6);
  g.addColorStop(0, `rgba(255, 255, 255, ${0.95 * s + 0.05})`);
  g.addColorStop(0.2, late > 0.7 ? 'rgba(255, 171, 64, 0.9)' : 'rgba(255, 249, 196, 0.9)');
  g.addColorStop(0.5, `rgba(255, 112, 67, ${0.55 * s})`);
  g.addColorStop(1, 'rgba(255, 61, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.pos.x, d.pos.y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  // Burning sparks shed behind the pellet
  ctx.fillStyle = 'rgba(255, 224, 130, 0.8)';
  for (let i = 0; i < 3; i++) {
    const a = seeded(d.seed, i + Math.floor(t * 20)) * Math.PI * 2;
    const rr = r * (1.2 + seeded(d.seed, i) * 1.4);
    ctx.fillRect(d.pos.x + Math.cos(a) * rr, d.pos.y + Math.sin(a) * rr, 1, 1);
  }
}

function dipoleCloud(ctx: Ctx, d: Decoy, t: number, n: number, radius: number, alpha: number, haze: string): void {
  // Haze of the cloud as a radar would "see" it
  const g = ctx.createRadialGradient(d.pos.x, d.pos.y, 0, d.pos.x, d.pos.y, radius);
  g.addColorStop(0, haze.replace('A', (0.32 * alpha).toFixed(3)));
  g.addColorStop(0.6, haze.replace('A', (0.14 * alpha).toFixed(3)));
  g.addColorStop(1, haze.replace('A', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.pos.x, d.pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  // Foil dipoles glinting as they tumble
  ctx.lineWidth = 0.7;
  for (let i = 0; i < n; i++) {
    const a = seeded(d.seed, i) * Math.PI * 2;
    const rr = Math.sqrt(seeded(d.seed, i + 100)) * radius * 0.92;
    const x = d.pos.x + Math.cos(a) * rr;
    const y = d.pos.y + Math.sin(a) * rr * 0.85;
    const glint = 0.25 + 0.75 * Math.abs(Math.sin(t * (6 + (i % 5)) + i));
    ctx.strokeStyle = `rgba(236, 248, 255, ${(glint * alpha).toFixed(3)})`;
    const rot = t * (2 + (i % 3)) + i;
    const l = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(rot) * l, y - Math.sin(rot) * l);
    ctx.lineTo(x + Math.cos(rot) * l, y + Math.sin(rot) * l);
    ctx.stroke();
  }
}

function drawChaff(ctx: Ctx, d: Decoy, t: number): void {
  const bloom = Math.min(1, d.age / 0.35);
  const radius = 5 + 26 * bloom + d.age * 2.4;
  const alpha = Math.max(0, 1 - Math.pow(d.age / d.life, 1.4));
  dipoleCloud(ctx, d, t, 22, radius, alpha, 'rgba(207, 216, 220, A)');
}

function rocketInFlight(ctx: Ctx, d: Decoy): boolean {
  if (!d.launchPos || !d.burstAt || d.age >= 1.1) return false;
  ctx.strokeStyle = 'rgba(236, 239, 241, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(d.launchPos.x, d.launchPos.y);
  ctx.lineTo(d.pos.x, d.pos.y);
  ctx.stroke();
  ctx.fillStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(d.pos.x, d.pos.y, 2.4, 0, Math.PI * 2);
  ctx.fill();
  return true;
}

function drawShipChaff(ctx: Ctx, d: Decoy, t: number): void {
  if (rocketInFlight(ctx, d)) return;
  const age = d.age - 1.1;
  // The burst, then a cloud that keeps spreading for minutes
  if (age < 0.35) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * (1 - age / 0.35)})`;
    ctx.beginPath();
    ctx.arc(d.pos.x, d.pos.y, 10 + age * 80, 0, Math.PI * 2);
    ctx.fill();
  }
  const radius = 26 + 70 * Math.min(1, age / 2.5) + age * 1.6;
  const alpha = Math.max(0, 1 - Math.pow(d.age / d.life, 1.8));
  dipoleCloud(ctx, d, t, 64, radius, alpha, 'rgba(176, 190, 197, A)');
}

function drawShipIr(ctx: Ctx, d: Decoy, t: number, wind: Vector2D): void {
  if (rocketInFlight(ctx, d)) return;
  const s = Math.max(0.15, decoyStrength('ship_ir', d.age));
  // Smoke plume blown downwind
  const wl = Math.hypot(wind.x, wind.y) || 1;
  const wx = wind.x / wl;
  const wy = wind.y / wl;
  for (let i = 7; i >= 1; i--) {
    const k = i / 7;
    const x = d.pos.x + wx * k * 120 + Math.sin(t * 0.8 + i) * 4;
    const y = d.pos.y + wy * k * 120 + Math.cos(t * 0.7 + i) * 4;
    ctx.fillStyle = `rgba(97, 97, 97, ${0.22 * (1 - k * 0.7) * s})`;
    ctx.beginPath();
    ctx.arc(x, y, 8 + k * 26, 0, Math.PI * 2);
    ctx.fill();
  }
  const flick = 0.85 + 0.15 * Math.sin(t * 31 + d.seed);
  const r = (7 + 7 * s) * flick;
  const g = ctx.createRadialGradient(d.pos.x, d.pos.y, 0, d.pos.x, d.pos.y, r * 2.4);
  g.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
  g.addColorStop(0.3, 'rgba(255, 183, 77, 0.85)');
  g.addColorStop(0.7, 'rgba(255, 87, 34, 0.35)');
  g.addColorStop(1, 'rgba(255, 61, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(d.pos.x, d.pos.y, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Glare on the water
  ctx.strokeStyle = `rgba(255, 204, 128, ${0.25 * s})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(d.pos.x, d.pos.y, r * 3.4, r * 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function acousticRings(ctx: Ctx, p: Vector2D, t: number, color: string, period = 1.4, max = 46): void {
  for (let i = 0; i < 3; i++) {
    const k = ((t / period + i / 3) % 1);
    ctx.strokeStyle = color.replace('A', (0.45 * (1 - k)).toFixed(3));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + k * max, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNoisemaker(ctx: Ctx, d: Decoy, t: number): void {
  acousticRings(ctx, d.pos, t + d.seed, 'rgba(128, 222, 234, A)', 0.9, 40);
  ctx.fillStyle = 'rgba(224, 247, 250, 0.7)';
  for (let i = 0; i < 6; i++) {
    const a = seeded(d.seed, i) * Math.PI * 2;
    const r = ((t * 6 + i * 5) % 14) + 2;
    ctx.beginPath();
    ctx.arc(d.pos.x + Math.cos(a) * r, d.pos.y + Math.sin(a) * r, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFB300';
  ctx.beginPath();
  ctx.arc(d.pos.x, d.pos.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawNixie(ctx: Ctx, d: Decoy, t: number): void {
  const h = d.heading ?? 0;
  // Tow cable up to the ship's stern
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.6)';
  ctx.lineWidth = 0.6;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(d.pos.x, d.pos.y);
  ctx.lineTo(d.pos.x + Math.cos(h) * 150, d.pos.y + Math.sin(h) * 150);
  ctx.stroke();
  ctx.setLineDash([]);
  acousticRings(ctx, d.pos, t, 'rgba(255, 213, 79, A)', 1.1, 52);
  ctx.save();
  ctx.translate(d.pos.x, d.pos.y);
  ctx.rotate(h);
  ctx.fillStyle = '#FFB74D';
  ctx.fillRect(-5, -1.6, 10, 3.2);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-6, -2.4, 2, 4.8);
  ctx.restore();
}

function drawMoss(ctx: Ctx, d: Decoy, t: number, friendly: boolean): void {
  const tr = d.trail ?? [];
  if (friendly) {
    ctx.strokeStyle = 'rgba(128, 222, 234, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    tr.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  acousticRings(ctx, d.pos, t + d.seed, friendly ? 'rgba(128, 222, 234, A)' : 'rgba(255, 138, 128, A)', 1.6, 60);
  ctx.save();
  ctx.translate(d.pos.x, d.pos.y);
  ctx.rotate(d.heading ?? 0);
  ctx.fillStyle = friendly ? '#80DEEA' : 'rgba(255, 138, 128, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = friendly ? 'rgba(178, 235, 242, 0.9)' : 'rgba(255, 171, 145, 0.9)';
  ctx.fillText(friendly ? 'MOSS 誘餌' : '? 水下聲紋接觸', d.pos.x, d.pos.y - 12);
}

/** Decoys in the water (and floating IR pots): drawn under the ships. */
export function drawSeaDecoys(rc: RenderContext, decoys: Decoy[], camera: Camera, wind: Vector2D, viewerSide: ShipSide = 'player'): void {
  if (decoys.length === 0) return;
  const ctx = begin(rc, camera);
  const t = rc.time;
  for (const d of decoys) {
    if (d.kind !== 'noisemaker' && d.kind !== 'nixie' && d.kind !== 'moss' && d.kind !== 'ship_ir') continue;
    if (!isWorldCircleVisible(rc, d.pos.x, d.pos.y, 160, camera)) continue;
    if (d.kind === 'noisemaker') drawNoisemaker(ctx, d, t);
    else if (d.kind === 'nixie') drawNixie(ctx, d, t);
    else if (d.kind === 'moss') drawMoss(ctx, d, t, d.side === viewerSide || (viewerSide === 'player' && d.side === 'allied'));
    else drawShipIr(ctx, d, t, wind);
  }
  ctx.restore();
}

/** Flares, chaff and ship chaff clouds: drawn over the ships and aircraft. */
export function drawAirDecoys(rc: RenderContext, decoys: Decoy[], camera: Camera): void {
  if (decoys.length === 0) return;
  const ctx = begin(rc, camera);
  const t = rc.time;
  for (const d of decoys) {
    if (d.kind !== 'flare' && d.kind !== 'chaff' && d.kind !== 'ship_chaff') continue;
    if (!isWorldCircleVisible(rc, d.pos.x, d.pos.y, 140, camera)) continue;
    if (d.kind === 'flare') drawFlare(ctx, d, t);
    else if (d.kind === 'chaff') drawChaff(ctx, d, t);
    else drawShipChaff(ctx, d, t);
  }
  ctx.restore();
}

/** ESM intercepts: dashed bearing strobes from our receivers toward each hostile emitter. */
export function drawEsmStrobes(rc: RenderContext, contacts: EsmContact[], camera: Camera): void {
  if (contacts.length === 0) return;
  const ctx = begin(rc, camera);
  const z = camera.zoom;
  for (const c of contacts) {
    const fade = Math.max(0, 1 - c.age / 4);
    const ex = c.from.x + Math.cos(c.bearing) * c.reach;
    const ey = c.from.y + Math.sin(c.bearing) * c.reach;
    const g = ctx.createLinearGradient(c.from.x, c.from.y, ex, ey);
    g.addColorStop(0, `rgba(255, 183, 77, ${0.05 * fade})`);
    g.addColorStop(1, `rgba(255, 183, 77, ${0.55 * fade})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2 / z;
    ctx.setLineDash([10 / z, 6 / z]);
    ctx.beginPath();
    ctx.moveTo(c.from.x, c.from.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `bold ${9 / z}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 204, 128, ${0.85 * fade})`;
    ctx.fillText(`📶 ${c.label}`, ex, ey - 6 / z);
  }
  ctx.restore();
}

/** Active jamming: a shimmering ring round each stand-off or escort jammer. */
export function drawJamZones(rc: RenderContext, zones: { pos: Vector2D; radius: number; power: number; side: ShipSide; name: string }[], camera: Camera): void {
  if (zones.length === 0) return;
  const ctx = begin(rc, camera);
  const z = camera.zoom;
  const t = rc.time;
  for (const j of zones) {
    // Escort pods jam too, but only stand-off and bomber jamming gets a ring (it would clutter)
    if (j.radius < 2200 || !isWorldCircleVisible(rc, j.pos.x, j.pos.y, j.radius, camera)) continue;
    const enemy = j.side === 'enemy';
    const col = enemy ? '255, 82, 82' : '79, 195, 247';
    ctx.fillStyle = `rgba(${col}, ${0.035 * j.power})`;
    ctx.beginPath();
    ctx.arc(j.pos.x, j.pos.y, j.radius, 0, Math.PI * 2);
    ctx.fill();
    // Noise ticks crawling round the rim
    ctx.strokeStyle = `rgba(${col}, ${0.35 * j.power + 0.1})`;
    ctx.lineWidth = 1.2 / z;
    ctx.setLineDash([2 / z, 7 / z]);
    ctx.lineDashOffset = -t * 30 / z;
    ctx.beginPath();
    ctx.arc(j.pos.x, j.pos.y, j.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    {
      ctx.font = `bold ${9 / z}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(${col}, 0.75)`;
      ctx.fillText(`⚡ ${j.name}`, j.pos.x, j.pos.y - j.radius - 4 / z);
    }
  }
  ctx.restore();
}
