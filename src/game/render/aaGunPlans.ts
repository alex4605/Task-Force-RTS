/**
 * Towed light and medium anti-aircraft guns in plan view, each from its real layout: the
 * Bofors 40mm on its four-wheel carriage with the outriggers swung out and the layers' seats
 * either side, the S-60 with its clip-fed 57mm and pepperpot brake, the ZU-23-2 on its
 * three-legged base with the wheels lifted, the Type 98 20mm on its tripod and the DShK on its
 * wheeled AA tripod. Bow (muzzle) points along +x, the same as every other ground silhouette.
 */

export interface AaPalette {
  hullFill: string;
  hullHighlight: string;
  hullStroke: string;
  turretFill: string;
  trackColor: string;
  barrelColor: string;
}

type Ctx = CanvasRenderingContext2D;

const PAD = '#37474F';
const BRASS = '#C9A227';
const STEEL = '#546E7A';

function crewColor(pal: AaPalette): string {
  // Enemy crews in khaki, ours and allied in olive drab
  return pal.hullStroke === '#EF9A9A' ? '#8A7444' : '#5D6B3A';
}

function crew(ctx: Ctx, pal: AaPalette, spots: ReadonlyArray<readonly [number, number]>, r = 0.95): void {
  ctx.fillStyle = crewColor(pal);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 0.3;
  for (const [x, y] of spots) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** Outrigger arm from the pivot at angle `a` with a round levelling-jack pad at its foot. */
function outrigger(ctx: Ctx, pal: AaPalette, a: number, len: number, width: number, pad: number): void {
  const x = Math.cos(a) * len;
  const y = Math.sin(a) * len;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = PAD;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, pad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function wheel(ctx: Ctx, pal: AaPalette, x: number, y: number, len: number, wid: number): void {
  ctx.fillStyle = pal.trackColor;
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.35)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.roundRect(x - len / 2, y - wid / 2, len, wid, wid * 0.4);
  ctx.fill();
  ctx.stroke();
}

/** Gun tube from x0 forward with a flash hider ('cone'), a muzzle brake ('pepper') or none. */
function tube(ctx: Ctx, pal: AaPalette, x0: number, y: number, len: number, w: number, end?: 'cone' | 'pepper' | 'flash'): void {
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + len, y);
  ctx.stroke();
  const xe = x0 + len;
  ctx.fillStyle = pal.barrelColor;
  if (end === 'cone') {
    // Bofors conical flash hider
    ctx.beginPath();
    ctx.moveTo(xe - 0.3, y - w * 0.5);
    ctx.lineTo(xe + 2.2, y - w * 1.05);
    ctx.lineTo(xe + 2.2, y + w * 1.05);
    ctx.lineTo(xe - 0.3, y + w * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (end === 'pepper') {
    // Multi-port "pepperpot" muzzle brake
    ctx.fillRect(xe - 0.4, y - w * 0.95, 2.4, w * 1.9);
    ctx.fillStyle = '#263238';
    for (let k = 0; k < 3; k++) ctx.fillRect(xe + 0.1 + k * 0.7, y - w * 0.95, 0.3, w * 1.9);
  } else if (end === 'flash') {
    ctx.fillRect(xe - 0.2, y - w * 0.75, 1.4, w * 1.5);
  }
}

function seat(ctx: Ctx, pal: AaPalette, x: number, y: number): void {
  ctx.fillStyle = pal.hullHighlight;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(x - 1.1, y - 0.9, 2.2, 1.8, 0.5);
  ctx.fill();
  ctx.stroke();
}

function ringSight(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.strokeStyle = 'rgba(236, 239, 241, 0.75)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.stroke();
}

/** Ammunition clips standing in the feed guides above the breech (Bofors / S-60). */
function clips(ctx: Ctx, x: number, y: number, n: number, len: number): void {
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = '#5D4A10';
  ctx.lineWidth = 0.25;
  for (let k = 0; k < n; k++) {
    ctx.fillRect(x - len / 2, y - n * 0.32 + k * 0.64, len, 0.48);
    ctx.strokeRect(x - len / 2, y - n * 0.32 + k * 0.64, len, 0.48);
  }
}

/** Bofors 40mm M1 / L/60: four-wheel carriage, cruciform outriggers, twin layers' seats. */
function drawBofors40(ctx: Ctx, pal: AaPalette): void {
  // Carriage body (the axles are wheel-in-well: wheels show at the four corners)
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) wheel(ctx, pal, sx * 5.2, sy * 4.4, 3.2, 1.5);
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.roundRect(-7, -3.2, 14, 6.4, 1.2);
  ctx.fill();
  ctx.stroke();
  // Outriggers swung out to their jack pads
  for (const a of [Math.PI / 2, -Math.PI / 2]) outrigger(ctx, pal, a, 9, 1.2, 1.3);
  // Tow bar folded forward
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-10.5, 0);
  ctx.stroke();
  // Traversing platform
  ctx.fillStyle = 'rgba(84, 110, 122, 0.55)';
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.75)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Layers' seats and their handwheels, either side of the cradle
  seat(ctx, pal, -1.2, -3.4);
  seat(ctx, pal, -1.2, 3.4);
  // Cradle, breech and the long tube with the conical flash hider
  ctx.fillStyle = pal.turretFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.7;
  ctx.fillRect(-3.6, -1.6, 6.4, 3.2);
  ctx.strokeRect(-3.6, -1.6, 6.4, 3.2);
  tube(ctx, pal, 2.8, 0, 11.5, 1.15, 'cone');
  // Recoil spring sleeve over the barrel
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(2.8, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();
  // Four-round clips in the auto-loader guides
  clips(ctx, -1.6, 0, 2, 3);
  // Reflector sights on their arms
  ringSight(ctx, 1.2, -2.4, 0.9);
  ringSight(ctx, 1.2, 2.4, 0.9);
  // Loaders behind the breech, ammunition handlers at the clip racks
  crew(ctx, pal, [[-1.2, -3.4], [-1.2, 3.4], [-5.2, -1.2], [-5.4, 1.4], [-8.2, 3]]);
  ctx.fillStyle = BRASS;
  for (let k = 0; k < 4; k++) ctx.fillRect(-9.6 + k * 0.7, -4.6, 0.45, 1.8);
}

/** S-60 57mm: four-wheel carriage on four outriggers, long tube with pepperpot brake, clip feed. */
function drawS60(ctx: Ctx, pal: AaPalette): void {
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) outrigger(ctx, pal, a, 9.5, 1.4, 1.5);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) wheel(ctx, pal, sx * 4.6, sy * 4.3, 3, 1.4);
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.roundRect(-6.4, -3, 12.8, 6, 1);
  ctx.fill();
  ctx.stroke();
  // Turntable
  ctx.fillStyle = 'rgba(84, 110, 122, 0.55)';
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.75)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Small splinter shields either side of the cradle
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(3.2, -2.9);
  ctx.lineTo(0.8, -3.6);
  ctx.moveTo(3.2, 2.9);
  ctx.lineTo(0.8, 3.6);
  ctx.stroke();
  seat(ctx, pal, -0.6, -3.2);
  seat(ctx, pal, -0.6, 3.2);
  // Cradle with the recoil cylinders, breech and the four-round clip on top
  ctx.fillStyle = pal.turretFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.7;
  ctx.fillRect(-4, -1.7, 7.4, 3.4);
  ctx.strokeRect(-4, -1.7, 7.4, 3.4);
  ctx.strokeStyle = pal.hullHighlight;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(3.4, -1);
  ctx.lineTo(7.4, -0.8);
  ctx.moveTo(3.4, 1);
  ctx.lineTo(7.4, 0.8);
  ctx.stroke();
  tube(ctx, pal, 3.4, 0, 12.8, 1.3, 'pepper');
  clips(ctx, -2, 0, 2, 3.4);
  ringSight(ctx, 0.8, -2.2, 0.8);
  // Layers on the seats, loader behind the breech, clip passers
  crew(ctx, pal, [[-0.6, -3.2], [-0.6, 3.2], [-5.6, 0.4], [-8.4, -2.4], [-8.6, 2.2]]);
  ctx.fillStyle = BRASS;
  for (let k = 0; k < 3; k++) ctx.fillRect(-10.2 + k * 0.8, 3.6, 0.5, 2.2);
}

/** ZU-23-2: twin 23mm on a light triangular base, wheels lifted clear, ammo boxes either side. */
function drawZu23(ctx: Ctx, pal: AaPalette): void {
  // Three levelling legs (one forward, two to the rear) and the base plate
  for (const a of [0, (2 * Math.PI) / 3, (-2 * Math.PI) / 3]) outrigger(ctx, pal, a, 6.5, 1.1, 1.1);
  // Road wheels swung up beside the base
  wheel(ctx, pal, -1.5, -5.4, 3, 1.3);
  wheel(ctx, pal, -1.5, 5.4, 3, 1.3);
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Two seats behind, the 50-round ammunition boxes on the outboard sides of the guns
  seat(ctx, pal, -3.2, -1.5);
  seat(ctx, pal, -3.2, 1.5);
  ctx.fillStyle = '#4E5B31';
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.5;
  ctx.fillRect(-1.6, -3.2, 3.4, 1.3);
  ctx.strokeRect(-1.6, -3.2, 3.4, 1.3);
  ctx.fillRect(-1.6, 1.9, 3.4, 1.3);
  ctx.strokeRect(-1.6, 1.9, 3.4, 1.3);
  ctx.fillStyle = pal.turretFill;
  ctx.fillRect(-1.8, -1.7, 4.2, 3.4);
  ctx.strokeRect(-1.8, -1.7, 4.2, 3.4);
  // Twin 2A14 barrels with flash hiders
  tube(ctx, pal, 2.4, -0.9, 11, 0.75, 'flash');
  tube(ctx, pal, 2.4, 0.9, 11, 0.75, 'flash');
  ringSight(ctx, -0.6, 0, 0.9);
  crew(ctx, pal, [[-3.2, -1.5], [-3.2, 1.5], [-6.6, 3.4]]);
}

/** Type 98 20mm AA machine cannon: tripod mount, single barrel, 20-round box magazine on top. */
function drawType98(ctx: Ctx, pal: AaPalette): void {
  for (const a of [Math.PI, Math.PI / 3, -Math.PI / 3]) outrigger(ctx, pal, a, 5.6, 1, 1);
  // Detached two-wheel axle parked behind
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-9.5, -3.2);
  ctx.lineTo(-9.5, 3.2);
  ctx.stroke();
  wheel(ctx, pal, -9.5, -3.6, 2.4, 1);
  wheel(ctx, pal, -9.5, 3.6, 2.4, 1);
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  seat(ctx, pal, -2.6, 0);
  ctx.fillStyle = pal.turretFill;
  ctx.fillRect(-1.8, -1, 4, 2);
  ctx.strokeRect(-1.8, -1, 4, 2);
  tube(ctx, pal, 2.2, 0, 9.5, 0.8, 'flash');
  // Box magazine
  ctx.fillStyle = '#4E5B31';
  ctx.fillRect(-0.2, -0.8, 1.6, 1.6);
  ringSight(ctx, 1, -1.8, 0.8);
  crew(ctx, pal, [[-2.6, 0], [0.4, 2.8], [-5, -2.8]]);
  ctx.fillStyle = BRASS;
  for (let k = 0; k < 3; k++) ctx.fillRect(-6.2 + k * 0.7, 2.8, 0.45, 1.6);
}

/** DShK 12.7mm on its wheeled tripod raised for AA fire, ring sight and the 50-round drum. */
function drawDshkAa(ctx: Ctx, pal: AaPalette): void {
  for (const a of [Math.PI * 0.8, -Math.PI * 0.8, 0]) outrigger(ctx, pal, a, 4.6, 0.8, 0.8);
  wheel(ctx, pal, -2.2, -3.4, 2.2, 0.9);
  wheel(ctx, pal, -2.2, 3.4, 2.2, 0.9);
  ctx.fillStyle = pal.turretFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.6;
  ctx.fillRect(-2.4, -0.7, 3.6, 1.4);
  ctx.strokeRect(-2.4, -0.7, 3.6, 1.4);
  tube(ctx, pal, 1.2, 0, 7.5, 0.7, 'flash');
  // Ribbed cooling fins near the receiver and the feed drum
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1.2, 0);
  ctx.lineTo(3.4, 0);
  ctx.stroke();
  ctx.fillStyle = '#4E5B31';
  ctx.beginPath();
  ctx.arc(-0.6, -1.4, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ringSight(ctx, 1.8, 0, 1.3);
  crew(ctx, pal, [[-3.4, 0], [-1.4, 2.6]]);
}

const AA_GUNS: Array<[RegExp, (ctx: Ctx, pal: AaPalette) => void]> = [
  [/bofors|40mm_aa/, drawBofors40],
  [/s60/, drawS60],
  [/zu23/, drawZu23],
  [/type98_aa|type96_aa/, drawType98],
  [/dshk/, drawDshkAa],
];

/** Draws the unit if it is one of the towed AA guns above; false otherwise. */
export function drawTowedAaGunPlan(ctx: Ctx, unitType: string, pal: AaPalette): boolean {
  const hit = AA_GUNS.find(([re]) => re.test(unitType));
  if (!hit) return false;
  hit[1](ctx, pal);
  return true;
}
