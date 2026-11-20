import { Ship, Turret } from '../../../types/game';
import { RenderContext } from '../context';

/**
 * Weapon mounts drawn from each turret's `caliber` description, so a 46cm Yamato turret, a
 * 5"/38 destroyer mount, a Phalanx CIWS and a Mk 26 missile launcher each get a plan-view
 * silhouette in proportion to the real thing instead of one generic gun house.
 */
type MountStyle =
  | { kind: 'gun'; bore: number; radius: number }
  | { kind: 'aa'; bore: number }
  | { kind: 'ciws' }
  | { kind: 'armLauncher' }
  | { kind: 'box'; fixed: boolean; cols: number; rows: number; round: boolean }
  | { kind: 'rbu' }
  | { kind: 'casemate'; bore: number };

const styleCache = new Map<string, MountStyle>();

/** Gun bore in millimetres parsed from strings like "460mm Triple", '5-inch/38', "14吋", ".50 cal". */
export function parseBoreMm(caliber: string): number | null {
  let m = caliber.match(/(\d+(?:\.\d+)?)\s*mm/);
  if (m) return Number(m[1]);
  m = caliber.match(/(\d+(?:\.\d+)?)\s*(?:-inch|吋|")/);
  if (m) return Number(m[1]) * 25.4;
  if (/\.50 cal/.test(caliber)) return 12.7;
  return null;
}

function classify(caliber: string, barrelCount: number): MountStyle {
  if (/Phalanx|CIWS/i.test(caliber) && !/Sea Sparrow/i.test(caliber)) return { kind: 'ciws' };
  if (/RBU/.test(caliber)) return { kind: 'rbu' };
  if (/砲郭|[Cc]asemate/.test(caliber)) return { kind: 'casemate', bore: parseBoreMm(caliber) ?? 152 };
  if (/P-700|Granit 20/.test(caliber)) return { kind: 'box', fixed: true, cols: 5, rows: 4, round: true };
  // Rail launchers first: 'Mk 41 VLS / Mk 26' on the lead Ticonderogas was really the Mk 26 twin arm
  if (/Arm|Mk 1[013]\b|Mk 26|SA-N-[137]|Shtil|Volna|Shtorm/i.test(caliber)) return { kind: 'armLauncher' };
  if (/VLS|S-300|Kinzhal|Revolver/i.test(caliber)) return { kind: 'box', fixed: true, cols: 4, rows: 2, round: true };
  if (/Sea Sparrow|ASROC|BPDMS|Octuple|cell|AShM|P-500|Bazalt|Harpoon|Launcher/i.test(caliber)) {
    return { kind: 'box', fixed: false, cols: 4, rows: 2, round: false };
  }
  const bore = parseBoreMm(caliber);
  if (bore === null) return barrelCount >= 6 ? { kind: 'box', fixed: false, cols: 4, rows: 2, round: false } : { kind: 'gun', bore: 127, radius: 3.8 };
  if (bore < 50) return { kind: 'aa', bore };
  // Gun house radius grows with bore: 76mm ≈ 3.2, 5" ≈ 3.8, 8" ≈ 4.4, 16" ≈ 6.0, 46cm ≈ 6.5
  const radius = bore < 160 ? 2.4 + bore * 0.011 : 3.0 + bore * 0.0076;
  return { kind: 'gun', bore, radius: Math.min(6.6, radius) };
}

function mountStyle(t: Turret): MountStyle {
  const key = t.caliber + '|' + t.barrelCount;
  let s = styleCache.get(key);
  if (!s) {
    s = classify(t.caliber, t.barrelCount);
    styleCache.set(key, s);
  }
  return s;
}

export function drawShipTurrets(rc: RenderContext, ship: Ship, color: string) {
  for (const turret of ship.turrets) {
    const style = mountStyle(turret);
    const ctx = rc.ctx;
    ctx.save();
    ctx.translate(turret.relX, turret.relY);
    // Fixed VLS cells don't train; casemate guns train only a little either side of the beam
    if (style.kind === 'casemate') ctx.rotate(Math.sign(turret.relY || 1) * Math.PI / 2 + clampBeamTrain(turret.angle - ship.heading, turret.relY));
    else if (!(style.kind === 'box' && style.fixed)) ctx.rotate(turret.angle - ship.heading);
    switch (style.kind) {
      case 'gun': {
        // A gun house never spans more than ~3/4 of the beam it sits on
        const r = Math.min(style.radius, Math.max(1.6, ship.width * 0.36));
        drawGunHouse(ctx, r, style.bore, turret.barrelCount, color);
        break;
      }
      case 'aa':
        drawAAMount(ctx, style.bore, turret.barrelCount, color);
        break;
      case 'ciws':
        drawCiws(ctx);
        break;
      case 'armLauncher':
        drawArmLauncher(ctx, Math.min(2, Math.max(1, turret.barrelCount)), color);
        break;
      case 'box':
        drawBoxLauncher(ctx, style.cols, style.rows, style.round, color);
        break;
      case 'rbu':
        drawRbu(ctx, color);
        break;
      case 'casemate':
        drawCasemate(ctx, style.bore, color);
        break;
    }
    ctx.restore();
  }
}

function drawGunHouse(ctx: CanvasRenderingContext2D, r: number, bore: number, barrels: number, color: string) {
  // Beveled armoured gun house, face toward +x
  ctx.fillStyle = '#0D2235';
  ctx.strokeStyle = color;
  ctx.lineWidth = r > 5 ? 1.5 : 1.2;
  ctx.beginPath();
  ctx.moveTo(r * 0.95, -r * 0.58);
  ctx.lineTo(r * 0.25, -r * 0.92);
  ctx.lineTo(-r * 0.92, -r * 0.8);
  ctx.lineTo(-r * 0.92, r * 0.8);
  ctx.lineTo(r * 0.25, r * 0.92);
  ctx.lineTo(r * 0.95, r * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Roof plate
  ctx.fillStyle = '#1E3F5E';
  ctx.fillRect(-r * 0.55, -r * 0.46, r * 0.9, r * 0.92);

  // Heavy turrets: optical rangefinder protruding from both sides at the rear
  if (bore >= 200) {
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.fillRect(-r * 0.78, -r * 1.12, r * 0.28, r * 2.24);
    ctx.strokeRect(-r * 0.78, -r * 1.12, r * 0.28, r * 2.24);
  }

  // Barrels: length and thickness scale with bore
  const n = Math.max(1, Math.min(3, barrels));
  const spacing = n === 1 ? 0 : r * (n === 2 ? 0.42 : 0.5);
  const len = r * 0.7 + bore * 0.03;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(2.4, Math.max(1, bore / 150));
  for (let i = 0; i < n; i++) {
    const by = (i - (n - 1) / 2) * spacing;
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(r * 0.65, by - ctx.lineWidth * 0.75, r * 0.45, ctx.lineWidth * 1.5);
    ctx.beginPath();
    ctx.moveTo(r * 0.7, by);
    ctx.lineTo(r * 0.7 + len, by);
    ctx.stroke();
  }
}

function drawAAMount(ctx: CanvasRenderingContext2D, bore: number, barrels: number, color: string) {
  // Open splinter-shielded tub with light barrels (Bofors, Oerlikon, 2M-3, .50 cal)
  const r = 1.6 + bore * 0.025;
  ctx.fillStyle = '#16293A';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const n = Math.max(1, Math.min(4, barrels));
  const len = 3 + bore * 0.06;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const by = (i - (n - 1) / 2) * 1.1;
    ctx.moveTo(r * 0.4, by);
    ctx.lineTo(r * 0.4 + len, by);
  }
  ctx.stroke();
}

function drawCiws(ctx: CanvasRenderingContext2D) {
  // Phalanx: white radome on a pedestal with a short six-barrel gatling
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(-0.4, 0, 2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(1.2, 0);
  ctx.lineTo(4.6, 0);
  ctx.stroke();
}

function drawArmLauncher(ctx: CanvasRenderingContext2D, arms: number, color: string) {
  // Trainable single / twin-arm rail launcher with missiles on the rails (Mk 13 / Mk 26 / SA-N-1)
  ctx.fillStyle = '#16293A';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < arms; i++) {
    const by = arms === 1 ? 0 : i === 0 ? -1.5 : 1.5;
    ctx.strokeStyle = '#78909C';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, by);
    ctx.lineTo(7, by);
    ctx.stroke();
    // Missile body with white nose
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(1, by - 0.55, 6.5, 1.1);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(7.5, by - 0.55);
    ctx.lineTo(8.6, by);
    ctx.lineTo(7.5, by + 0.55);
    ctx.fill();
  }
}

function drawBoxLauncher(ctx: CanvasRenderingContext2D, cols: number, rows: number, round: boolean, color: string) {
  // Box launcher / VLS cells (Sea Sparrow, ASROC, Kinzhal, Granit): a hatch grid
  const cell = round ? 1.6 : 1.4;
  const w = cols * cell;
  const h = rows * cell;
  ctx.fillStyle = '#1B2B3A';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.7)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = -w / 2 + cell * (c + 0.5);
      const cy = -h / 2 + cell * (r + 0.5);
      if (round) {
        ctx.moveTo(cx + cell * 0.32, cy);
        ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
      } else {
        ctx.rect(cx - cell * 0.32, cy - cell * 0.32, cell * 0.64, cell * 0.64);
      }
    }
  }
  ctx.stroke();
}

function drawRbu(ctx: CanvasRenderingContext2D, color: string) {
  // RBU anti-submarine rocket launcher: fan of short tubes on a trainable mount
  ctx.fillStyle = '#16293A';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.16;
    ctx.moveTo(Math.cos(a) * 1.5, Math.sin(a) * 1.5);
    ctx.lineTo(Math.cos(a) * 5, Math.sin(a) * 5);
  }
  ctx.stroke();
}

/** Offset of a casemate gun from its beam bearing, limited to the ±60° a hull embrasure allows. */
function clampBeamTrain(relAngle: number, relY: number): number {
  const beam = Math.sign(relY || 1) * Math.PI / 2;
  let d = relAngle - beam;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.max(-Math.PI / 3, Math.min(Math.PI / 3, d));
}

function drawCasemate(ctx: CanvasRenderingContext2D, bore: number, color: string) {
  // Hull-side casemate (Kongo / Hiei 15.2cm): an embrasure in the hull with a short barrel outboard
  ctx.fillStyle = '#0A1622';
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.fillRect(-1.6, -1.4, 2.4, 2.8);
  ctx.strokeRect(-1.6, -1.4, 2.4, 2.8);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.9, bore / 150);
  ctx.beginPath();
  ctx.moveTo(0.8, 0);
  ctx.lineTo(0.8 + bore * 0.03, 0);
  ctx.stroke();
}
