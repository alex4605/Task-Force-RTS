import { Era, Installation } from '../../../types/game';
import { RenderContext } from '../context';
import { bldFraction, damageStage, popFraction } from '../../settlements';

/**
 * Villages, towns and cities drawn at their state of ruin: five stages of BLD (100 / 75 / 50 / 25 /
 * 0%). Each building of the place is fixed by the settlement's id, so the same houses fall as the
 * BLD bar goes down: first holed roofs, then rubble where houses stood, scorched streets and
 * craters across the whole built-up area, and at 0% a field of ruins. Fires burn while the
 * fighting is recent. Roofs follow the era: Pacific thatch, Korean tile, Vietnamese thatch and
 * tile, North German brick.
 */

type Kind = 'settlement' | 'town' | 'city';

/** Deterministic 0..1 per settlement and index. */
function rnd(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function seedOf(inst: Installation): number {
  let h = 0;
  for (let k = 0; k < inst.id.length; k++) h = (h * 31 + inst.id.charCodeAt(k)) | 0;
  return (h % 9973) + 1;
}

const ROOF: Record<Era, { hut: string; house: string; block: string; edge: string }> = {
  era1: { hut: '#8D6E63', house: '#A1887F', block: '#795548', edge: '#D7CCC8' },
  era2: { hut: '#8D6E63', house: '#B0703A', block: '#795548', edge: '#D7CCC8' },
  era3: { hut: '#6D7B83', house: '#546E7A', block: '#78909C', edge: '#CFD8DC' },
  era4: { hut: '#A1887F', house: '#A1503A', block: '#8D6E63', edge: '#FFCCBC' },
  era5: { hut: '#B5533C', house: '#B5533C', block: '#8D6E63', edge: '#FFAB91' },
};

/** The houses of the central cluster: [x, y, w, h], round huts for thatched villages. */
function buildings(kind: Kind): [number, number, number, number][] {
  if (kind === 'city') {
    const out: [number, number, number, number][] = [];
    for (const x of [-28, -12, 4, 20]) for (const y of [-20, -5, 10]) out.push([x, y, 11, 10]);
    return out;
  }
  if (kind === 'town') return [[-20, -13, 10, 8], [-6, -13, 10, 8], [8, -13, 10, 8], [-20, 4, 10, 8], [-6, 4, 10, 8], [8, 4, 10, 8]];
  return [[-13, -9, 7, 7], [-3, -11, 7, 7], [7, -8, 7, 7], [-12, 2, 7, 7], [-2, 3, 7, 7], [8, 3, 6, 6]];
}

function drawRubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, i: number): void {
  ctx.fillStyle = '#5D5550';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let k = 0; k <= 5; k++) ctx.lineTo(x + (w * k) / 5, y + h * (0.3 + 0.6 * rnd(seed, i * 7 + k)));
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8D8580';
  for (let k = 0; k < 4; k++) ctx.fillRect(x + w * rnd(seed, i * 13 + k), y + h * (0.4 + 0.5 * rnd(seed, i * 17 + k)), 1.4, 1.2);
  // A wall stub still standing
  if (rnd(seed, i * 3) > 0.5) {
    ctx.fillStyle = '#9E9692';
    ctx.fillRect(x + w * 0.15, y + h * 0.1, 1.2, h * 0.7);
  }
}

function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, i: number): void {
  const flick = 0.6 + 0.4 * Math.sin(t * 9 + i * 1.7);
  ctx.fillStyle = `rgba(255, 112, 40, ${0.75 * flick})`;
  ctx.beginPath();
  ctx.arc(x, y, 2.2 + flick, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 214, 90, ${0.8 * flick})`;
  ctx.beginPath();
  ctx.arc(x, y, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // Smoke drifting off
  ctx.fillStyle = 'rgba(60, 60, 64, 0.35)';
  for (let k = 1; k <= 3; k++) {
    ctx.beginPath();
    ctx.arc(x + k * 2.5 + Math.sin(t + k) * 1.5, y - k * 4, 2 + k, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Damage across the whole built-up area: craters, scorch and rubble heaps scaled with lost BLD. */
function drawDistrictDamage(ctx: CanvasRenderingContext2D, inst: Installation, seed: number, frac: number): void {
  const zR = inst.civilianZoneRadius ?? 100;
  const lost = 1 - frac;
  if (lost <= 0.04) return;
  const n = Math.round(lost * (zR / 7));
  for (let i = 0; i < n; i++) {
    const a = rnd(seed, 500 + i) * Math.PI * 2;
    const r = Math.sqrt(rnd(seed, 900 + i)) * zR * 0.95;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (Math.abs(x) < 34 && Math.abs(y) < 26) continue; // the centre is drawn house by house
    const s = 2.5 + rnd(seed, 1300 + i) * 4.5 * (0.5 + lost);
    ctx.fillStyle = 'rgba(28, 24, 22, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, s * 1.7, 0, Math.PI * 2);
    ctx.fill();
    if (i % 2 === 0) drawRubble(ctx, x - s, y - s * 0.6, s * 2, s * 1.2, seed, 2000 + i);
    else {
      ctx.fillStyle = 'rgba(12, 10, 9, 0.75)';
      ctx.beginPath();
      ctx.arc(x, y, s * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** BLD and POP bars under the settlement. */
function drawBars(ctx: CanvasRenderingContext2D, y: number, bld: number, pop: number): void {
  const w = 44;
  const row = (yy: number, v: number, color: string, label: string) => {
    ctx.fillStyle = 'rgba(4, 10, 18, 0.85)';
    ctx.fillRect(-w / 2 - 1, yy - 1, w + 2, 5);
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, yy, w * v, 3);
    ctx.font = 'bold 6.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#CFD8DC';
    ctx.fillText(label, -w / 2 - 3, yy + 3.5);
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(v * 100)}%`, w / 2 + 3, yy + 3.5);
  };
  row(y, bld, bld > 0.5 ? '#FFB74D' : bld > 0.25 ? '#FF8A65' : '#E53935', 'BLD');
  row(y + 7, pop, '#4DD0E1', 'POP');
}

const TITLE: Record<Kind, [string, string, number]> = {
  settlement: ['🏡', '#FFE082', 8.5],
  town: ['🏘️', '#FFCC80', 9],
  city: ['🏛️', '#80DEEA', 9.5],
};

const STAGE_NOTE = ['廢墟', '殘破', '半毀', '受損', ''];

export function drawSettlementStage(rc: RenderContext, inst: Installation): void {
  const ctx = rc.ctx;
  const kind = inst.type as Kind;
  const era = (rc.era ?? 'era1') as Era;
  const roof = ROOF[era];
  const seed = seedOf(inst);
  const frac = bldFraction(inst);
  const stage = damageStage(frac);
  const lost = 1 - frac;
  const thatched = kind === 'settlement' && (era === 'era1' || era === 'era2' || era === 'era4');

  drawDistrictDamage(ctx, inst, seed, frac);

  // Ground of the central cluster
  const [gw, gh] = kind === 'city' ? [66, 48] : kind === 'town' ? [50, 34] : [36, 30];
  ctx.fillStyle = stage === 0 ? 'rgba(48, 42, 38, 0.8)' : kind === 'settlement' ? 'rgba(78, 52, 46, 0.6)' : 'rgba(44, 52, 58, 0.8)';
  ctx.strokeStyle = stage <= 1 ? '#6D5F57' : kind === 'city' ? '#78909C' : '#8D6E63';
  ctx.lineWidth = 1.4;
  if (kind === 'settlement') {
    ctx.beginPath();
    ctx.ellipse(0, 0, gw / 2, gh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
    ctx.strokeRect(-gw / 2, -gh / 2, gw, gh);
    // Streets
    ctx.strokeStyle = stage <= 1 ? 'rgba(160, 140, 120, 0.35)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-gw / 2, -1);
    ctx.lineTo(gw / 2, -1);
    if (kind === 'city') {
      ctx.moveTo(-4, -gh / 2);
      ctx.lineTo(-4, gh / 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const fires: [number, number][] = [];
  buildings(kind).forEach(([x, y, w, h], i) => {
    const r = rnd(seed, i);
    // A house falls once enough of the place has: the first ones early, the last ones only at 0%
    const fallen = stage === 0 || r < lost * 0.95;
    const holed = !fallen && r < lost * 1.8;
    if (fallen) {
      drawRubble(ctx, x, y, w, h, seed, i);
      if (rnd(seed, i + 40) < 0.5) fires.push([x + w / 2, y + h / 2]);
      return;
    }
    const color = thatched ? roof.hut : kind === 'city' ? roof.block : roof.house;
    ctx.fillStyle = color;
    ctx.strokeStyle = roof.edge;
    ctx.lineWidth = 0.8;
    if (thatched) {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      // Ridge line of the roof
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
      ctx.stroke();
    }
    if (holed) {
      // A shell hole through the roof, scorch round it
      ctx.fillStyle = 'rgba(20, 16, 14, 0.85)';
      ctx.beginPath();
      ctx.arc(x + w * (0.3 + 0.4 * rnd(seed, i + 9)), y + h * 0.5, Math.min(w, h) * 0.28, 0, Math.PI * 2);
      ctx.fill();
      if (rnd(seed, i + 60) < 0.35) fires.push([x + w / 2, y + h / 3]);
    }
  });
  // The landmark in the middle of a town or city (town hall, church, pagoda)
  if (kind !== 'settlement') {
    const fallen = stage <= 1;
    if (fallen) drawRubble(ctx, -6, -6, 12, 10, seed, 99);
    else {
      ctx.fillStyle = era === 'era4' ? '#C0A060' : '#BF360C';
      ctx.strokeStyle = '#FF8A65';
      ctx.lineWidth = 1;
      ctx.fillRect(-5, -6, 10, 10);
      ctx.strokeRect(-5, -6, 10, 10);
    }
  }

  // Fires while the fighting is recent
  if ((inst.quietFor ?? 999) < 60 && stage < 4) fires.forEach(([x, y], i) => drawFire(ctx, x, y, rc.time, i));

  // Name, stage and the two bars
  const [icon, color, size] = TITLE[kind];
  const note = STAGE_NOTE[stage];
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`${icon} ${inst.name.split(' (')[0].split(' [')[0]}${note ? ` · ${note}` : ''}`, 0, -gh / 2 - 8);
  drawBars(ctx, gh / 2 + 6, frac, popFraction(inst));
}
