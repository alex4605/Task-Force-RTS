import { Aircraft, AircraftModel, AircraftPayloadType, Era, RequisitionItem } from '../types/game';
import { drawShipIcon } from './render/ships';
import { buildRequisitionShip } from './requisitionShips';
import { drawSpecificAircraftModel } from './render/aircraft';
import { AIRCRAFT_NATION } from './render/aircraft/nation';
import { TANK_PLANS, drawTankPlan } from './render/groundPlan';
import { SUPPORT_PLANS, drawRocketLauncherPlan, drawSupportPlan } from './render/groundPlanSupport';
import { drawAtgmTeam, drawEngineerTeam, drawInfantryTeam, drawMortarSection } from './render/groundInfantry';
import { app6Function, app6Mobility, drawApp6 } from './render/app6';

export type UnitPreviewKind = 'ship' | 'aircraft' | 'ground' | 'installation';

export interface UnitPreviewOptions {
  payloadType?: AircraftPayloadType;
  compact?: boolean;
  /** Era of the card (ships: draws the exact class the card delivers in that era). */
  era?: Era;
}

/**
 * Normalizes requisition typeTag / id / model keys into canonical preview identifiers.
 */
function normalizeKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (k.startsWith('air_')) {
    return k.slice(4);
  }
  return k;
}

/**
 * Shared physical top-down silhouette renderer for Ground Units.
 * Used both on the tactical canvas (`VectorRenderer.drawGroundUnits`) and in build menu preview cards.
 */
interface TankSpec {
  match: RegExp;
  hullL: number;
  hullW: number;
  /** Chamfer of the sloped glacis plate in plan view. */
  glacis?: number;
  turret: 'round' | 'boxy' | 'needle';
  turretX: number;
  /** Lateral turret offset: Type 95 Ha-Go (left), Type 97 Chi-Ha (right). */
  turretY: number;
  turretRx: number;
  turretRy: number;
  gunLen: number;
  gunW: number;
  /** Bore evacuator position as a fraction of the gun length. */
  evacuatorAt?: number;
  muzzleBrake?: boolean;
}

// Tanks with real plan dimensions are drawn by groundPlan.ts; the rest (Ontos, SU-100) use these defaults.
const DEFAULT_TANK: TankSpec = { match: /./, hullL: 22, hullW: 11, glacis: 2, turret: 'round', turretX: -0.5, turretY: 0, turretRx: 5.4, turretRy: 4.4, gunLen: 11, gunW: 2 };

interface VehiclePalette {
  hullFill: string;
  hullHighlight: string;
  hullStroke: string;
  turretFill: string;
  trackColor: string;
  barrelColor: string;
}

function drawTrackRuns(ctx: CanvasRenderingContext2D, hl: number, hw: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(-hl / 2 - 1, -hw / 2 - 2.5, hl + 2, 3);
  ctx.fillRect(-hl / 2 - 1, hw / 2 - 0.5, hl + 2, 3);
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.35)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -hl / 2; x <= hl / 2; x += 2.4) {
    ctx.moveTo(x, -hw / 2 - 2.5);
    ctx.lineTo(x, -hw / 2 + 0.5);
    ctx.moveTo(x, hw / 2 - 0.5);
    ctx.lineTo(x, hw / 2 + 2.5);
  }
  ctx.stroke();
}

function drawMuzzle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, kind: 'single' | 'double' | undefined, color: string) {
  if (!kind) return;
  ctx.fillStyle = color;
  ctx.fillRect(x - 1.2, y - w * 0.9, 1.6, w * 1.8);
  if (kind === 'double') ctx.fillRect(x - 3.4, y - w * 0.9, 1.4, w * 1.8);
}

// ════════════════════════════════════════════════════════════════════════════
// Self-propelled guns
// ════════════════════════════════════════════════════════════════════════════
interface SpgSpec {
  match: RegExp;
  hullL: number;
  hullW: number;
  /** Fighting compartment: open-topped (WWII / M44) or fully enclosed turret. */
  compartment: 'open' | 'turret';
  compX: number;
  compL: number;
  compW: number;
  gunY: number;
  gunLen: number;
  gunW: number;
  muzzle?: 'single' | 'double';
  /** Fume extractor position as a fraction of gun length. */
  fumeAt?: number;
  /** Turret rear bustle (Paladin, Msta-S). */
  bustle?: number;
  /** M7 Priest's round anti-aircraft MG "pulpit". */
  pulpit?: boolean;
  /** Boat-shaped amphibious bow (2S1 on the MT-LB chassis). */
  boatBow?: boolean;
  spades?: boolean;
}

const SPG_SPECS: SpgSpec[] = [
  { match: /priest/, hullL: 19, hullW: 10, compartment: 'open', compX: 0, compL: 12, compW: 8.4, gunY: 1.6, gunLen: 9, gunW: 1.6, pulpit: true },
  { match: /m44/, hullL: 20, hullW: 10.5, compartment: 'open', compX: -4, compL: 11, compW: 9.4, gunY: 0, gunLen: 13, gunW: 1.9, muzzle: 'single', spades: true },
  { match: /paladin/, hullL: 21, hullW: 11, compartment: 'turret', compX: -2.5, compL: 12, compW: 9.6, gunY: 0, gunLen: 17, gunW: 1.9, muzzle: 'double', fumeAt: 0.45, bustle: 2.5 },
  { match: /m109/, hullL: 21, hullW: 11, compartment: 'turret', compX: -2.5, compL: 12, compW: 9.6, gunY: 0, gunLen: 11, gunW: 2, muzzle: 'double', fumeAt: 0.5 },
  { match: /hummel/, hullL: 20, hullW: 10, compartment: 'open', compX: -3, compL: 10, compW: 8.6, gunY: 0, gunLen: 13, gunW: 1.9 },
  { match: /2s1/, hullL: 19, hullW: 10, compartment: 'turret', compX: -2, compL: 8, compW: 7, gunY: 0, gunLen: 12, gunW: 1.6, muzzle: 'double', fumeAt: 0.5, boatBow: true },
  { match: /2s3/, hullL: 22, hullW: 11.5, compartment: 'turret', compX: -1.5, compL: 11, compW: 9.4, gunY: 0, gunLen: 14, gunW: 1.9, muzzle: 'double', fumeAt: 0.55 },
  { match: /2s19/, hullL: 23, hullW: 12, compartment: 'turret', compX: -1, compL: 13, compW: 10.4, gunY: 0, gunLen: 18, gunW: 2, muzzle: 'double', fumeAt: 0.5, bustle: 2.5 },
];
const DEFAULT_SPG: SpgSpec = { match: /./, hullL: 20, hullW: 10, compartment: 'turret', compX: -2, compL: 11, compW: 8, gunY: 0, gunLen: 14, gunW: 2, muzzle: 'single' };

function drawSpg(ctx: CanvasRenderingContext2D, sp: SpgSpec, pal: VehiclePalette) {
  const { hullL: hl, hullW: hw } = sp;
  drawTrackRuns(ctx, hl, hw, pal.trackColor);
  ctx.fillStyle = pal.hullFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (sp.boatBow) {
    ctx.moveTo(hl / 2 + 2, 0);
    ctx.lineTo(hl / 2 - 2, -hw / 2);
    ctx.lineTo(-hl / 2, -hw / 2);
    ctx.lineTo(-hl / 2, hw / 2);
    ctx.lineTo(hl / 2 - 2, hw / 2);
  } else {
    ctx.moveTo(hl / 2, -hw / 2 + 2);
    ctx.lineTo(hl / 2 - 2, -hw / 2);
    ctx.lineTo(-hl / 2, -hw / 2);
    ctx.lineTo(-hl / 2, hw / 2);
    ctx.lineTo(hl / 2 - 2, hw / 2);
    ctx.lineTo(hl / 2, hw / 2 - 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rear recoil spades (M44)
  if (sp.spades) {
    ctx.fillStyle = '#455A64';
    ctx.fillRect(-hl / 2 - 2, -hw / 2 + 0.5, 1.8, 2.6);
    ctx.fillRect(-hl / 2 - 2, hw / 2 - 3.1, 1.8, 2.6);
  }

  // Fighting compartment
  const cx = sp.compX;
  if (sp.compartment === 'open') {
    // Open-topped armoured box: thin walls with the crew space and ammunition racks visible
    ctx.fillStyle = '#1E272E';
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 1.1;
    ctx.fillRect(cx - sp.compL / 2, -sp.compW / 2, sp.compL, sp.compW);
    ctx.strokeRect(cx - sp.compL / 2, -sp.compW / 2, sp.compL, sp.compW);
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.45)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let y = -sp.compW / 2 + 1.4; y < sp.compW / 2 - 1; y += 1.4) {
      ctx.moveTo(cx - sp.compL / 2 + 1, y);
      ctx.lineTo(cx - sp.compL / 2 + 3, y);
    }
    ctx.stroke();
  } else {
    // Enclosed turret, slab-sided, with optional rear bustle
    ctx.fillStyle = pal.turretFill;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + sp.compL / 2, -sp.compW / 2 + 1.4);
    ctx.lineTo(cx + sp.compL / 2 - 1.4, -sp.compW / 2);
    ctx.lineTo(cx - sp.compL / 2, -sp.compW / 2);
    ctx.lineTo(cx - sp.compL / 2, sp.compW / 2);
    ctx.lineTo(cx + sp.compL / 2 - 1.4, sp.compW / 2);
    ctx.lineTo(cx + sp.compL / 2, sp.compW / 2 - 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (sp.bustle) {
      ctx.fillStyle = pal.hullHighlight;
      ctx.fillRect(cx - sp.compL / 2 - sp.bustle, -sp.compW * 0.35, sp.bustle, sp.compW * 0.7);
    }
    // Commander's cupola with MG
    ctx.fillStyle = pal.hullHighlight;
    ctx.beginPath();
    ctx.arc(cx - sp.compL * 0.15, -sp.compW * 0.28, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // M7 Priest pulpit (ring-mounted .50 cal at the right front)
  if (sp.pulpit) {
    ctx.strokeStyle = pal.hullStroke;
    ctx.fillStyle = pal.turretFill;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + sp.compL / 2 - 1.5, sp.compW / 2 - 1, 2.4, 0, Math.PI * 2); // right front (+y = starboard)
    ctx.fill();
    ctx.stroke();
  }

  // Howitzer
  const gx = cx + sp.compL / 2 - 0.5;
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = sp.gunW;
  ctx.beginPath();
  ctx.moveTo(gx - 1, sp.gunY);
  ctx.lineTo(gx + sp.gunLen, sp.gunY);
  ctx.stroke();
  if (sp.fumeAt !== undefined) {
    ctx.fillStyle = pal.barrelColor;
    ctx.fillRect(gx + sp.gunLen * sp.fumeAt - 1.2, sp.gunY - sp.gunW * 0.8, 2.4, sp.gunW * 1.6);
  }
  drawMuzzle(ctx, gx + sp.gunLen, sp.gunY, sp.gunW, sp.muzzle, pal.barrelColor);
}

// ════════════════════════════════════════════════════════════════════════════
// APCs, IFVs and amphibious tractors
// ════════════════════════════════════════════════════════════════════════════
interface IfvSpec {
  match: RegExp;
  hullL: number;
  hullW: number;
  /** 0 = tracked; otherwise wheels per side. */
  wheels: number;
  /** box = vertical front, wedge = sloped glacis narrowing forward, pointed = BMP / BRDM / LAV ribbed bow. */
  nose: 'box' | 'wedge' | 'pointed' | 'boat';
  amphib?: boolean;
  /** Turret centre / radius, or none (MG cupola only). */
  turret?: { x: number; y: number; r: number };
  gunLen?: number;
  gunW?: number;
  /** Twin parallel barrels (BTR-ZD's ZU-23-2). */
  twinGun?: boolean;
  /** Bradley's TOW box on the turret's left side. */
  towBox?: boolean;
  /** BMP-2's Konkurs ATGM tube on the turret roof. */
  roofAtgm?: boolean;
  /** LAV-AD Blazer: Stinger pods both sides of the turret. */
  stingerPods?: boolean;
  /** Open-topped cargo well (LVT-2). */
  openCargo?: boolean;
  /** Open-topped howitzer turret (LVT(A)-4). */
  openTurret?: boolean;
  /** Commander's cupola MG position when there is no turret. */
  cupola?: { x: number; y: number };
  rearRamp?: boolean;
  /** Number of parallel gun barrels (Shilka 4, Duster / ZSU-57-2 / Tunguska 2). */
  barrels?: number;
  /** Missile rails / tubes: centre x, count, length; 'sides' splits them either side of the turret. */
  missiles?: { x: number; count: number; len: number; sides?: boolean };
  /** Vertical launch cells in the turret (Tor). */
  vls?: number;
  /** Fire-control / search radar dish. */
  radar?: { x: number; y: number; r: number };
}

const IFV_SPECS: IfvSpec[] = [
  { match: /m113/, hullL: 19, hullW: 10, wheels: 0, nose: 'box', cupola: { x: 2, y: -1.5 }, rearRamp: true },
  { match: /lvt_42/, hullL: 21, hullW: 12, wheels: 0, nose: 'boat', amphib: true, openCargo: true, cupola: { x: 6, y: 0 } },
  { match: /lvt_45/, hullL: 21, hullW: 12, wheels: 0, nose: 'boat', amphib: true, openTurret: true, turret: { x: 0, y: 0, r: 4.2 }, gunLen: 8, gunW: 1.6 },
  { match: /lvtp5/, hullL: 24, hullW: 13, wheels: 0, nose: 'boat', amphib: true, turret: { x: 7, y: 0, r: 2.6 }, gunLen: 5, gunW: 1, rearRamp: true },
  { match: /aav7/, hullL: 22, hullW: 11.5, wheels: 0, nose: 'boat', amphib: true, turret: { x: 3.5, y: 3, r: 2.4 }, gunLen: 6, gunW: 1.2, rearRamp: true },
  { match: /lav_ad/, hullL: 20, hullW: 9.5, wheels: 4, nose: 'pointed', turret: { x: -1, y: 0, r: 3.4 }, gunLen: 8, gunW: 1.6, stingerPods: true },
  { match: /lav25/, hullL: 20, hullW: 9.5, wheels: 4, nose: 'pointed', turret: { x: 0, y: 0, r: 3.2 }, gunLen: 10, gunW: 1.3 },
  { match: /bradley/, hullL: 21, hullW: 11.5, wheels: 0, nose: 'wedge', turret: { x: 0.5, y: 0.8, r: 3.8 }, gunLen: 9, gunW: 1.3, towBox: true, rearRamp: true },
  { match: /bmp/, hullL: 20, hullW: 10.5, wheels: 0, nose: 'pointed', turret: { x: 1, y: 0, r: 3.6 }, gunLen: 11, gunW: 1.1, roofAtgm: true },
  { match: /btr_zd/, hullL: 17, hullW: 9, wheels: 0, nose: 'wedge', turret: { x: -1, y: 0, r: 3 }, gunLen: 8, gunW: 1, twinGun: true },
];
// Self-propelled air defence vehicles, drawn with the same plan-view vocabulary as APCs / IFVs
const AD_SPECS: IfvSpec[] = [
  { match: /chaparral/, hullL: 19, hullW: 10, wheels: 0, nose: 'box', missiles: { x: -3, count: 4, len: 7 }, cupola: { x: 6, y: -2 } },
  { match: /duster|zsu57/, hullL: 21, hullW: 11, wheels: 0, nose: 'wedge', openTurret: true, turret: { x: -2, y: 0, r: 4.4 }, gunLen: 11, gunW: 1.4, barrels: 2 },
  { match: /vads|m163/, hullL: 19, hullW: 10, wheels: 0, nose: 'box', turret: { x: -1, y: 0, r: 3.4 }, gunLen: 9, gunW: 2, radar: { x: -1, y: 4, r: 1.8 } },
  { match: /shilka/, hullL: 20, hullW: 10.5, wheels: 0, nose: 'wedge', turret: { x: 0, y: 0, r: 4.6 }, gunLen: 9, gunW: 0.9, barrels: 4, radar: { x: -4, y: 0, r: 2.2 } },
  { match: /tunguska/, hullL: 22, hullW: 11.5, wheels: 0, nose: 'wedge', turret: { x: -1, y: 0, r: 4.8 }, gunLen: 8, gunW: 1.1, barrels: 2, missiles: { x: -1, count: 4, len: 6, sides: true }, radar: { x: -4, y: 0, r: 2.4 } },
  { match: /sa6|kub/, hullL: 21, hullW: 10.5, wheels: 0, nose: 'wedge', missiles: { x: -2, count: 3, len: 9 } },
  { match: /sa9|strela/, hullL: 16, hullW: 8.5, wheels: 2, nose: 'pointed', missiles: { x: -2, count: 4, len: 6 } },
  { match: /sa8|osa/, hullL: 21, hullW: 10, wheels: 3, nose: 'boat', amphib: true, missiles: { x: -2, count: 6, len: 7, sides: true }, radar: { x: -2, y: 0, r: 2.6 } },
  { match: /sa11|buk/, hullL: 22, hullW: 11, wheels: 0, nose: 'wedge', missiles: { x: -3, count: 4, len: 9 }, radar: { x: 5, y: 0, r: 2.2 } },
  { match: /sa15|(^|_)tor(_|$)/, hullL: 21, hullW: 11, wheels: 0, nose: 'wedge', turret: { x: -2, y: 0, r: 5 }, vls: 8, radar: { x: 2, y: 0, r: 2.4 } },
];

const DEFAULT_IFV: IfvSpec = { match: /./, hullL: 20, hullW: 10, wheels: 0, nose: 'wedge', turret: { x: 1, y: 0, r: 3.4 }, gunLen: 9, gunW: 1.4 };

function drawArmoredCarrier(ctx: CanvasRenderingContext2D, sp: IfvSpec, pal: VehiclePalette) {
  const { hullL: hl, hullW: hw } = sp;
  if (sp.wheels > 0) {
    ctx.fillStyle = pal.trackColor;
    const step = (hl - 4) / (sp.wheels - 1);
    for (let i = 0; i < sp.wheels; i++) {
      const wx = -hl / 2 + 2 + i * step;
      ctx.fillRect(wx - 1.5, -hw / 2 - 2, 3, 2.2);
      ctx.fillRect(wx - 1.5, hw / 2 - 0.2, 3, 2.2);
    }
  } else {
    drawTrackRuns(ctx, hl, hw, pal.trackColor);
  }

  ctx.fillStyle = sp.amphib ? '#173A4A' : pal.hullFill;
  ctx.strokeStyle = sp.amphib ? '#4FC3F7' : pal.hullStroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (sp.nose === 'boat') {
    ctx.moveTo(hl / 2, -hw * 0.3);
    ctx.quadraticCurveTo(hl / 2 + 2.5, 0, hl / 2, hw * 0.3);
    ctx.lineTo(hl / 2 - 3, hw / 2);
  } else if (sp.nose === 'pointed') {
    ctx.moveTo(hl / 2 + 1.5, 0);
    ctx.lineTo(hl / 2 - 2.5, hw / 2);
  } else if (sp.nose === 'wedge') {
    ctx.moveTo(hl / 2, -hw * 0.36);
    ctx.lineTo(hl / 2, hw * 0.36);
    ctx.lineTo(hl / 2 - 2.5, hw / 2);
  } else {
    ctx.moveTo(hl / 2, -hw / 2);
    ctx.lineTo(hl / 2, hw / 2);
  }
  ctx.lineTo(-hl / 2, hw / 2);
  ctx.lineTo(-hl / 2, -hw / 2);
  ctx.lineTo(sp.nose === 'boat' ? hl / 2 - 3 : sp.nose === 'box' ? hl / 2 : hl / 2 - 2.5, -hw / 2);
  if (sp.nose === 'boat') ctx.lineTo(hl / 2, -hw * 0.3);
  else if (sp.nose === 'pointed') ctx.lineTo(hl / 2 + 1.5, 0);
  else if (sp.nose === 'wedge') ctx.lineTo(hl / 2, -hw * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (sp.amphib) {
    // Rear waterjet / track-propulsion shrouds
    ctx.fillStyle = '#263238';
    ctx.fillRect(-hl / 2 - 1.2, -hw * 0.3, 1.4, 2.2);
    ctx.fillRect(-hl / 2 - 1.2, hw * 0.3 - 2.2, 1.4, 2.2);
  }
  if (sp.rearRamp) {
    ctx.strokeStyle = pal.hullHighlight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-hl / 2 + 0.5, -hw * 0.3, 2.2, hw * 0.6);
  }
  if (sp.openCargo) {
    ctx.fillStyle = '#1E272E';
    ctx.fillRect(-hl / 2 + 2, -hw / 2 + 1.6, hl * 0.6, hw - 3.2);
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.4)';
    ctx.strokeRect(-hl / 2 + 2, -hw / 2 + 1.6, hl * 0.6, hw - 3.2);
  }
  if (sp.cupola) {
    ctx.fillStyle = pal.turretFill;
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(sp.cupola.x, sp.cupola.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = pal.barrelColor;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sp.cupola.x + 1.2, sp.cupola.y);
    ctx.lineTo(sp.cupola.x + 5, sp.cupola.y);
    ctx.stroke();
  }

  const tr = sp.turret;
  if (tr) {
    ctx.fillStyle = sp.openTurret ? '#1E272E' : pal.turretFill;
    ctx.strokeStyle = sp.amphib ? '#4FC3F7' : pal.hullStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (sp.towBox) {
      ctx.fillStyle = '#5D6D3A';
      ctx.fillRect(tr.x - tr.r * 0.8, tr.y - tr.r - 2.4, tr.r * 1.6, 2.2);
      ctx.strokeRect(tr.x - tr.r * 0.8, tr.y - tr.r - 2.4, tr.r * 1.6, 2.2);
    }
    if (sp.stingerPods) {
      ctx.fillStyle = '#80DEEA';
      ctx.fillRect(tr.x - 1.5, tr.y - tr.r - 1.8, 4, 1.6);
      ctx.fillRect(tr.x - 1.5, tr.y + tr.r + 0.2, 4, 1.6);
    }
    if (sp.roofAtgm) {
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tr.x - 2, tr.y - 1.2);
      ctx.lineTo(tr.x + 3, tr.y - 1.2);
      ctx.stroke();
    }
    if (sp.vls) {
      // Vertical launch cells in the turret roof (two rows)
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = 'rgba(176, 190, 197, 0.7)';
      ctx.lineWidth = 0.5;
      const cols = sp.vls / 2;
      for (let c = 0; c < cols; c++) {
        for (const row of [-1, 1]) {
          const cx2 = tr.x - tr.r * 0.6 + c * (tr.r * 1.2 / Math.max(1, cols - 1));
          ctx.beginPath();
          ctx.arc(cx2, tr.y + row * tr.r * 0.4, 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (sp.gunLen) {
      ctx.strokeStyle = pal.barrelColor;
      ctx.lineWidth = sp.gunW ?? 1.2;
      ctx.beginPath();
      const n = sp.barrels ?? (sp.twinGun ? 2 : 1);
      const gap = n >= 4 ? 0.9 : 1.8;
      const gy = Array.from({ length: n }, (_, i) => tr.y + (i - (n - 1) / 2) * gap);
      for (const y of gy) {
        ctx.moveTo(tr.x + tr.r * 0.6, y);
        ctx.lineTo(tr.x + tr.r * 0.6 + sp.gunLen, y);
      }
      ctx.stroke();
    }
  }

  // Missile rails / tubes, trained forward (white body, red seeker head)
  if (sp.missiles) {
    const m = sp.missiles;
    const groups = m.sides ? [-(hw / 2) + 1.2, hw / 2 - 1.2] : [0];
    const perGroup = m.sides ? m.count / 2 : m.count;
    for (const gy0 of groups) {
      for (let i = 0; i < perGroup; i++) {
        const y = gy0 + (i - (perGroup - 1) / 2) * (m.sides ? 1 : 1.5);
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(m.x - m.len / 2, y);
        ctx.lineTo(m.x + m.len / 2, y);
        ctx.stroke();
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(m.x + m.len / 2 - 1, y - 0.55, 1.2, 1.1);
      }
    }
  }

  // Radar dish
  if (sp.radar) {
    ctx.fillStyle = '#90A4AE';
    ctx.strokeStyle = '#ECEFF1';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(sp.radar.x, sp.radar.y, sp.radar.r * 0.45, sp.radar.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Towed artillery
// ════════════════════════════════════════════════════════════════════════════
interface TowedSpec {
  match: RegExp;
  /** split = two trails in a V (M101, M114, M198, Type 91); star3 = three-legged base (ZU-23);
   *  cross4 = four outriggers (KS-19). */
  carriage: 'split' | 'star3' | 'cross4' | 'box';
  trailLen: number;
  /** Wheel half-track and wheel size. */
  track: number;
  wheel: number;
  spokedWheels?: boolean;
  shield?: number;
  gunLen: number;
  gunW: number;
  barrels?: number;
  muzzle?: 'single' | 'double';
}

const TOWED_SPECS: TowedSpec[] = [
  // M2A1 / M101 105mm: split trail, small shield, plain muzzle
  { match: /artillery_105/, carriage: 'split', trailLen: 12, track: 5.5, wheel: 2.6, shield: 5, gunLen: 11, gunW: 1.6 },
  // M114 155mm: heavier split trail, no shield
  { match: /howitzer_155/, carriage: 'split', trailLen: 15, track: 6.5, wheel: 3.2, gunLen: 13, gunW: 2 },
  // M198 155mm: long trails and tube with a double-baffle muzzle brake
  { match: /m198/, carriage: 'split', trailLen: 17, track: 6.5, wheel: 3.2, gunLen: 18, gunW: 2, muzzle: 'double' },
  // IJA Type 91 10cm howitzer: split trail, spoked wheels, gun shield
  { match: /field_artillery/, carriage: 'split', trailLen: 12, track: 5.5, wheel: 2.8, spokedWheels: true, shield: 5.5, gunLen: 11, gunW: 1.7 },
  // KS-19 100mm AA gun: cruciform firing platform, long tube with muzzle brake
  { match: /ks19/, carriage: 'cross4', trailLen: 11, track: 0, wheel: 0, shield: 4, gunLen: 18, gunW: 1.8, muzzle: 'single' },
  // QF 25-pounder: single box trail on its round firing platform, shield, double-baffle brake
  { match: /25pdr/, carriage: 'box', trailLen: 13, track: 5, wheel: 2.8, shield: 5, gunLen: 10, gunW: 1.8, muzzle: 'double' },
  // L5 105mm pack howitzer: light split trail, short tube with multi-baffle brake, no shield
  { match: /l5_pack/, carriage: 'split', trailLen: 10, track: 4.2, wheel: 2.2, gunLen: 8, gunW: 1.5, muzzle: 'double' },
  // Type 1 47mm: low split trail, shield, long thin tube
  { match: /47mm_at/, carriage: 'split', trailLen: 11, track: 4.8, wheel: 2.4, shield: 4.6, gunLen: 12, gunW: 1.2 },
  // ZiS-3: light split trail, shield, single-baffle brake
  { match: /zis3/, carriage: 'split', trailLen: 12, track: 5, wheel: 2.6, shield: 5, gunLen: 12, gunW: 1.5, muzzle: 'single' },
  // M-46 130mm: very long tube with the pepperpot brake, long split trails
  { match: /m46_130/, carriage: 'split', trailLen: 18, track: 6.2, wheel: 3.0, shield: 5.5, gunLen: 21, gunW: 1.9, muzzle: 'double' },
  // DShK on its wheeled tripod in the AA role
  { match: /dshk/, carriage: 'star3', trailLen: 6, track: 0, wheel: 0, gunLen: 9, gunW: 0.9 },
  // M1A1 75mm pack howitzer: small split trail, short tube, no shield
  { match: /pack_75/, carriage: 'split', trailLen: 9, track: 3.8, wheel: 2.0, gunLen: 7, gunW: 1.3 },
  // M102 105mm: low box trail on its roller, round firing base, long thin tube
  { match: /m102/, carriage: 'box', trailLen: 11, track: 4.4, wheel: 2.2, gunLen: 11, gunW: 1.5 },
  // M3 37mm anti-tank gun: light split trail, small shield
  { match: /37mm_at/, carriage: 'split', trailLen: 10, track: 4.5, wheel: 2.2, shield: 4.5, gunLen: 10, gunW: 1.1 },
  // ZU-23-2: light three-legged mount, twin 23mm
  { match: /zu23/, carriage: 'star3', trailLen: 9, track: 0, wheel: 0, gunLen: 13, gunW: 1, barrels: 2 },
];
const DEFAULT_TOWED: TowedSpec = { match: /./, carriage: 'split', trailLen: 12, track: 5.5, wheel: 2.6, gunLen: 13, gunW: 1.8 };

function drawTowedGun(ctx: CanvasRenderingContext2D, sp: TowedSpec, pal: VehiclePalette) {
  // Carriage / trails
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (sp.carriage === 'box') {
    // Single box trail to the spade; the gun sits on its round traversing platform
    ctx.moveTo(0, -1.1);
    ctx.lineTo(-sp.trailLen, -0.7);
    ctx.moveTo(0, 1.1);
    ctx.lineTo(-sp.trailLen, 0.7);
  } else if (sp.carriage === 'split') {
    for (const side of [-1, 1]) {
      ctx.moveTo(0, side * 1.2);
      ctx.lineTo(-sp.trailLen, side * sp.trailLen * 0.42);
    }
  } else {
    const legs = sp.carriage === 'star3' ? [Math.PI, Math.PI / 3, -Math.PI / 3] : [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    for (const a of legs) {
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * sp.trailLen, Math.sin(a) * sp.trailLen);
    }
  }
  ctx.stroke();
  // Spades / outrigger pads
  ctx.fillStyle = '#455A64';
  if (sp.carriage === 'box') {
    ctx.fillRect(-sp.trailLen - 1.5, -1.6, 2, 3.2);
    ctx.strokeStyle = 'rgba(120, 144, 156, 0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, sp.track + 1.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sp.carriage === 'split') {
    for (const side of [-1, 1]) ctx.fillRect(-sp.trailLen - 1.5, side * sp.trailLen * 0.42 - 1.2, 2, 2.4);
  } else {
    const legs = sp.carriage === 'star3' ? [Math.PI, Math.PI / 3, -Math.PI / 3] : [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    for (const a of legs) ctx.fillRect(Math.cos(a) * sp.trailLen - 1.2, Math.sin(a) * sp.trailLen - 1.2, 2.4, 2.4);
  }
  // Road wheels on the axle
  if (sp.wheel > 0) {
    for (const side of [-1, 1]) {
      ctx.fillStyle = pal.trackColor;
      ctx.fillRect(-sp.wheel, side * sp.track - 1.2, sp.wheel * 2, 2.4);
      if (sp.spokedWheels) {
        ctx.strokeStyle = 'rgba(176, 190, 197, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(k * sp.wheel * 0.4, side * sp.track - 1.2);
          ctx.lineTo(k * sp.wheel * 0.4, side * sp.track + 1.2);
        }
        ctx.stroke();
      }
    }
    ctx.strokeStyle = pal.hullStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -sp.track);
    ctx.lineTo(0, sp.track);
    ctx.stroke();
  }
  // Cradle / breech block
  ctx.fillStyle = pal.turretFill;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.9;
  ctx.fillRect(-3, -1.8, 5, 3.6);
  ctx.strokeRect(-3, -1.8, 5, 3.6);
  // Gun shield
  if (sp.shield) {
    ctx.fillStyle = pal.hullHighlight;
    ctx.fillRect(2, -sp.shield, 1.2, sp.shield * 2);
  }
  // Barrel(s) and recuperator
  const n = sp.barrels ?? 1;
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = sp.gunW;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const y = (i - (n - 1) / 2) * 1.8;
    ctx.moveTo(1, y);
    ctx.lineTo(1 + sp.gunLen, y);
  }
  ctx.stroke();
  if (n === 1) {
    ctx.strokeStyle = pal.hullHighlight;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(2, sp.gunW * 0.9);
    ctx.lineTo(1 + sp.gunLen * 0.45, sp.gunW * 0.9);
    ctx.stroke();
    drawMuzzle(ctx, 1 + sp.gunLen, 0, sp.gunW, sp.muzzle, pal.barrelColor);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Infantry
// ════════════════════════════════════════════════════════════════════════════

/** Silhouette family a ground unit type is drawn as. */
export type GroundSilhouetteClass =
  | 'rocket'
  | 'tank'
  | 'spg'
  | 'towed'
  | 'air_defense'
  | 'carrier'
  | 'engineer'
  | 'atgm'
  | 'mortar'
  | 'infantry';

/** Classifies a ground unit (or installation equipment) type by the silhouette it is drawn as. */
/** Families of types whose names do not carry the usual keywords. */
const EXPLICIT_SILHOUETTE_CLASS: Record<string, GroundSilhouetteClass> = {
  usmc_raider_42: 'infantry',
  usmc_37mm_at: 'towed',
  us_army_rifle_45: 'infantry',
  usmc_m4a3r3_flame: 'tank',
  us_m24_chaffee: 'tank',
  us_m16_quad50: 'air_defense',
  usmc_90mm_aa_42: 'towed',
  us_redeye_team: 'atgm',
  us_stinger_team: 'atgm',
  opfor_sa7_strela: 'atgm',
  opfor_igla_team: 'atgm',
  usmc_40mm_bofors_45: 'towed',
  us_m113_acav: 'carrier',
  us_m107_175: 'spg',
  us_hmmwv_tow: 'carrier',
  us_avenger: 'air_defense',
  cw_infantry_ww2: 'infantry',
  au_matilda: 'tank',
  rok_infantry_50: 'infantry',
  cw_infantry_50: 'infantry',
  cw_centurion: 'tank',
  rok_marine_65: 'infantry',
  arvn_ranger_65: 'infantry',
  au_rar_65: 'infantry',
  arvn_m41: 'tank',
  frg_infantry_83: 'infantry',
  frg_marder: 'carrier',
  frg_leopard2: 'tank',
  uk_challenger1: 'tank',
  uk_warrior: 'carrier',
  nz_infantry_43: 'infantry',
  fj_commando_43: 'infantry',
  cw_25pdr: 'towed',
  au_commando_45: 'infantry',
  ph_guerrilla_45: 'infantry',
  au_matilda_frog: 'tank',
  tr_infantry_50: 'infantry',
  rok_m36: 'tank',
  rok_tiger_65: 'infantry',
  au_centurion_68: 'tank',
  arvn_m113_acav: 'carrier',
  nz_l5_pack: 'towed',
  frg_gepard: 'air_defense',
  frg_m109g: 'spg',
  uk_milan_team: 'atgm',
  usmc_paramarine_42: 'infantry',
  us_airborne_45: 'infantry',
  us_airborne_50: 'infantry',
  us_airborne_65: 'infantry',
  us_airborne_83: 'infantry',
  us_cav_air_assault_65: 'infantry',
  us_m1a1_pack_75: 'towed',
  us_m102_105: 'towed',
  sof_coastwatcher_42: 'infantry',
  sof_alamo_scouts_45: 'infantry',
  sof_udt_45: 'infantry',
  sof_ranger_50: 'infantry',
  sof_udt_50: 'infantry',
  sof_seal_65: 'infantry',
  sof_macv_sog_65: 'infantry',
  sof_force_recon_83: 'infantry',
  sof_seal_83: 'infantry',
  sof_ranger_83: 'infantry',
  opfor_ija_hmg_42: 'infantry',
  opfor_ija_47mm_at: 'towed',
  opfor_ija_kami: 'tank',
  opfor_ija_banzai_45: 'infantry',
  opfor_pva_infantry_50: 'infantry',
  opfor_zis3_76: 'towed',
  opfor_ija_type92_70: 'towed',
  opfor_ija_type98_aa: 'towed',
  opfor_bm13_katyusha: 'rocket',
  us_armor_m4a3e8: 'tank',
  opfor_su76m: 'spg',
  opfor_vc_guerrilla_65: 'infantry',
  opfor_rpg_team_65: 'infantry',
  opfor_m46_130mm: 'towed',
  opfor_dshk_aa: 'towed',
  opfor_spetsnaz_83: 'infantry',
  opfor_bmd1: 'carrier',
  opfor_btr70: 'carrier',
  opfor_t64b: 'tank',
  cw_bren_carrier: 'carrier',
  au_vickers_mg_45: 'infantry',
  cw_churchill_50: 'tank',
  gr_infantry_50: 'infantry',
  fr_infantry_50: 'infantry',
  th_cobra_67: 'infantry',
  arvn_m48a3: 'tank',
  au_sasr_66: 'infantry',
  nl_leopard1: 'tank',
  nl_infantry_83: 'infantry',
  frg_jaeger_83: 'infantry',
  frg_heimatschutz_83: 'infantry',
  opfor_giyutai_45: 'infantry',
  sof_lrrp_65: 'infantry',
  opfor_rail_troops_83: 'infantry',
  opfor_mvd_vv_83: 'infantry',
  fr_infantry_83: 'infantry',
  fr_amx30b2: 'tank',
  uk_infantry_83: 'infantry',
  arvn_rfpf_65: 'infantry',
  opfor_nlf_main_force_65: 'infantry',
  rok_police_50: 'infantry',
  opfor_kpa_infantry_50: 'infantry',
  si_scouts_42: 'infantry',
  frg_luchs: 'carrier',
  uk_sas_83: 'infantry',
};

const silhouetteClassCache = new Map<string, GroundSilhouetteClass>();

/** Family of a ground unit type (memoised: called for every unit several times a frame). */
export function groundSilhouetteClass(unitType: string): GroundSilhouetteClass {
  let c = silhouetteClassCache.get(unitType);
  if (!c) {
    c = classifyGroundSilhouette(unitType);
    silhouetteClassCache.set(unitType, c);
  }
  return c;
}

function classifyGroundSilhouette(unitType: string): GroundSilhouetteClass {
  const t = unitType.toLowerCase();
  const explicit = EXPLICIT_SILHOUETTE_CLASS[t];
  if (explicit) return explicit;
  const isRocketTel =
    t.includes('atacms') ||
    t.includes('mlrs') ||
    t.includes('m270') ||
    t.includes('calliope') ||
    t.includes('grad') ||
    t.includes('katyusha') ||
    t.includes('uragan') ||
    t.includes('scud');

  const isTank =
    t.includes('abrams') ||
    t.includes('m1ip') ||
    t.includes('m60') ||
    t.includes('m48') ||
    t.includes('patton') ||
    t.includes('tank') ||
    t.includes('armor') ||
    t.includes('t72') ||
    t.includes('t80') ||
    t.includes('t62') ||
    t.includes('t55') ||
    t.includes('t54') ||
    t.includes('t34') ||
    t.includes('is3') ||
    t.includes('pt76') ||
    t.includes('type95') ||
    t.includes('type97') ||
    // Exact model tags: a bare 'm4' / 'm3' also matched the M44 SPG, M42 Duster and others
    t.includes('armor_m4') ||
    t.includes('armor_m3') ||
    t.includes('ontos') ||
    t.includes('sheridan') ||
    t.includes('pershing') ||
    t.includes('m1a1') ||
    t.includes('su100') ||
    t.includes('su_100');

  const isSpg =
    t.includes('spg') ||
    t.includes('paladin') ||
    t.includes('m109') ||
    t.includes('priest') ||
    t.includes('m44') ||
    t.includes('hummel') ||
    t.includes('2s1') ||
    t.includes('2s3') ||
    t.includes('2s19');

  const isTowed =
    t.includes('artillery') ||
    t.includes('m198') ||
    t.includes('howitzer') ||
    t.includes('155') ||
    t.includes('105') ||
    t.includes('zu23') ||
    t.includes('ks19');

  const isIfvApc =
    t.includes('lav') ||
    t.includes('bradley') ||
    t.includes('aav') ||
    t.includes('lvtp') ||
    t.includes('lvt') ||
    t.includes('m113') ||
    t.includes('bmp') ||
    t.includes('btr') ||
    t.includes('mech');

  const isAirDefense =
    t.includes('chaparral') ||
    t.includes('duster') ||
    t.includes('sam') ||
    t.includes('vads') ||
    t.includes('m163') ||
    t.includes('flak') ||
    // 'aa' as a whole word only: 'aav7a1' (amphibious tractor) must not count as air defence
    /(^|_)aa(_|$)/.test(t) ||
    t.includes('shilka') ||
    t.includes('tunguska') ||
    t.includes('zsu') ||
    t.includes('sa6') ||
    t.includes('sa8') ||
    t.includes('sa9') ||
    t.includes('sa11') ||
    t.includes('sa15') ||
    t.includes('kub') ||
    t.includes('buk') ||
    // whole-word 'tor': 'opfor_motor_rifle_83' (motorised infantry) contains 'tor'
    /(^|_)tor(_|$)/.test(t) ||
    t.includes('osa') ||
    t.includes('strela');


  if (isRocketTel) return 'rocket';
  if (isTank) return 'tank';
  if (isSpg) return 'spg';
  if (isTowed) return 'towed';
  if (isAirDefense || AD_SPECS.some((sp) => sp.match.test(t))) return 'air_defense';
  if (isIfvApc) return 'carrier';
  if (t.includes('engineer')) return 'engineer';
  if (t.includes('atgm') || t.includes('dragon')) return 'atgm';
  if (t.includes('mortar')) return 'mortar';
  return 'infantry';
}

/**
 * On-map silhouette scale per family, shared by manoeuvre units and the equipment drawn inside
 * installations, so a tank platoon on the move is the same size as a dug-in one.
 */
export const GROUND_SILHOUETTE_SCALE: Record<GroundSilhouetteClass, number> = {
  rocket: 0.55,
  tank: 0.55,
  spg: 0.55,
  towed: 0.42,
  air_defense: 0.55,
  carrier: 0.55,
  engineer: 0.55,
  atgm: 0.62,
  mortar: 0.62,
  infantry: 0.62,
};

export function drawGroundSilhouette(
  ctx: CanvasRenderingContext2D,
  unitType: string,
  isPlayer: boolean | 'allied',
  scale: number = 1
): void {
  const t = unitType.toLowerCase();
  // Allied formations in a brighter green throughout, so they are not mistaken for the player's
  const allied = isPlayer === 'allied';
  const hullFill = allied ? '#24461F' : isPlayer ? '#1B3A2B' : '#3A2322';
  const hullHighlight = allied ? '#3A6B2E' : isPlayer ? '#295740' : '#4E2F2D';
  const hullStroke = allied ? '#B2FF59' : isPlayer ? '#66BB6A' : '#EF9A9A';
  const turretFill = allied ? '#3D6A2F' : isPlayer ? '#2E5A44' : '#52302E';
  const trackColor = '#0F1419';
  const barrelColor = allied ? '#DCEDC8' : isPlayer ? '#CFD8DC' : '#FFCCBC';
  const accentColor = allied ? '#76FF03' : isPlayer ? '#4FC3F7' : '#FF5252';

  ctx.save();
  ctx.scale(scale, scale);

  // Contact drop-shadow under vehicles (soldiers cast their own small shadows)
  const footKind = groundSilhouetteClass(t);
  if (footKind !== 'infantry' && footKind !== 'mortar' && footKind !== 'atgm') {
    ctx.fillStyle = 'rgba(2, 6, 12, 0.62)';
    ctx.beginPath();
    ctx.ellipse(1.6, 2.2, 13.5, 8.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const kind = groundSilhouetteClass(t);

  if ((kind === 'tank' || kind === 'spg' || kind === 'air_defense' || kind === 'carrier') && SUPPORT_PLANS.some((p) => p.match.test(t))) {
    // Self-propelled guns, tank destroyers and air-defence vehicles from real dimensions
    drawSupportPlan(ctx, SUPPORT_PLANS.find((p) => p.match.test(t))!, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'rocket' && drawRocketLauncherPlan(ctx, t, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor })) {
    // Rocket artillery and missile launchers from real dimensions (groundPlanSupport.ts)
  } else if (kind === 'rocket') {
    const isNuke = t.includes('nuclear');
    const isAtacms = t.includes('atacms');
    const isScud = t.includes('scud');
    const isTruckMlrs = t.includes('grad') || t.includes('uragan');
    const isCalliope = t.includes('calliope');

    if (isScud) {
      // 8x8 MAZ-543 TEL + Split Forward Cabs + R-17 Ballistic Missile
      ctx.fillStyle = trackColor;
      for (const wx of [-9.5, -3.5, 2.8, 9]) {
        ctx.fillRect(wx - 1.9, -7.8, 3.8, 2.3);
        ctx.fillRect(wx - 1.9, 5.5, 3.8, 2.3);
      }
      ctx.fillStyle = hullFill;
      ctx.strokeStyle = isNuke ? '#FFAB00' : hullStroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-12, -5.5, 24, 11);
      ctx.strokeRect(-12, -5.5, 24, 11);
      // Iconic split twin forward cabs
      ctx.fillStyle = turretFill;
      ctx.fillRect(7.5, -5.2, 4.2, 3.6);
      ctx.fillRect(7.5, 1.6, 4.2, 3.6);
      // Ballistic missile fuselage + tail fins + red warhead
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = isNuke ? '#FFAB00' : '#FF5252';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.lineTo(8.5, -2);
      ctx.lineTo(14.5, 0);
      ctx.lineTo(8.5, 2);
      ctx.lineTo(-11, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isNuke ? '#FFAB00' : '#D32F2F';
      ctx.beginPath();
      ctx.moveTo(8.5, -1.8);
      ctx.lineTo(14.5, 0);
      ctx.lineTo(8.5, 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-11.5, -3.4, 2.5, 6.8);
    } else if (isTruckMlrs) {
      // BM-21 Grad / BM-27 Uragan Wheeled Rocket Truck
      const axles = t.includes('uragan') ? [-8, -2, 4, 9] : [-7, 0, 8];
      ctx.fillStyle = trackColor;
      for (const wx of axles) {
        ctx.fillRect(wx - 1.7, -7, 3.4, 2);
        ctx.fillRect(wx - 1.7, 5, 3.4, 2);
      }
      ctx.fillStyle = hullFill;
      ctx.strokeStyle = hullStroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-11, -5, 22, 10);
      ctx.strokeRect(-11, -5, 22, 10);
      // Forward Ural/ZIL truck cab
      ctx.fillStyle = turretFill;
      ctx.fillRect(5, -4.5, 5.5, 9);
      ctx.fillStyle = '#80DEEA';
      ctx.fillRect(8.5, -3.6, 1.4, 7.2);
      // Rear multi-tube rocket rack
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#FFAB91';
      ctx.fillRect(-10, -4.2, 13, 8.4);
      ctx.strokeRect(-10, -4.2, 13, 8.4);
      ctx.fillStyle = '#FF7043';
      for (const ry of [-2.8, -0.9, 0.9, 2.8]) {
        ctx.fillRect(-8.5, ry - 0.5, 10, 1);
      }
    } else if (isCalliope) {
      // M4 Sherman + Roof-Mounted T34 60-Tube Rocket Frame
      ctx.fillStyle = trackColor;
      ctx.fillRect(-11, -7.5, 22, 2.8);
      ctx.fillRect(-11, 4.7, 22, 2.8);
      ctx.fillStyle = hullFill;
      ctx.strokeStyle = hullStroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-10, -5, 20, 10);
      ctx.strokeRect(-10, -5, 20, 10);
      ctx.strokeStyle = barrelColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(13, 0);
      ctx.stroke();
      // Overhead 60-tube steel rocket rack
      ctx.fillStyle = '#455A64';
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.1;
      ctx.fillRect(-5, -5.2, 10, 10.4);
      ctx.strokeRect(-5, -5.2, 10, 10.4);
      ctx.fillStyle = '#FFB300';
      for (let ry = -3.5; ry <= 3.5; ry += 1.75) {
        ctx.fillRect(-4, ry - 0.5, 8, 1);
      }
    } else {
      // Tracked M270 MLRS / ATACMS / Nuclear ATACMS
      ctx.fillStyle = trackColor;
      ctx.fillRect(-11.5, -7.6, 23, 3);
      ctx.fillRect(-11.5, 4.6, 23, 3);
      ctx.fillStyle = hullFill;
      ctx.strokeStyle = isNuke ? '#FFAB00' : hullStroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-10.5, -5, 21, 10);
      ctx.strokeRect(-10.5, -5, 21, 10);
      // Forward armored cab with split windshields
      ctx.fillStyle = turretFill;
      ctx.fillRect(4.5, -4.6, 5.5, 9.2);
      ctx.fillStyle = '#80DEEA';
      ctx.fillRect(8.5, -3.5, 1.1, 2.8);
      ctx.fillRect(8.5, 0.7, 1.1, 2.8);
      // Rear launcher pod box
      ctx.fillStyle = isNuke ? '#8E1515' : '#37474F';
      ctx.strokeStyle = isNuke ? '#FFD54F' : '#80DEEA';
      ctx.fillRect(-9.5, -4.4, 12.5, 8.8);
      ctx.strokeRect(-9.5, -4.4, 12.5, 8.8);
      ctx.fillStyle = isNuke ? '#FFEA00' : isAtacms ? '#FF8A65' : '#FFD54F';
      if (isAtacms) {
        ctx.beginPath();
        ctx.arc(0.5, -2, 1.7, 0, Math.PI * 2);
        ctx.arc(0.5, 2, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-7.5, -2.9, 6.5, 1.8);
        ctx.fillRect(-7.5, 1.1, 6.5, 1.8);
      } else {
        for (const r of [-2.4, 0, 2.4]) {
          ctx.fillRect(-7.5, r - 0.65, 9, 1.3);
        }
      }
    }
  } else if (kind === 'tank' && TANK_PLANS.some((p) => p.match.test(t))) {
    // Plan view from the vehicle's real dimensions
    drawTankPlan(ctx, TANK_PLANS.find((p) => p.match.test(t))!, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'tank') {
    const isAbrams = t.includes('abrams') || t.includes('m1ip');
    const isSovietEra = t.includes('t72') || t.includes('t80');
    const isSovietMid = t.includes('t54') || t.includes('t55') || t.includes('t62') || t.includes('t34');
    const isIs3 = t.includes('is3');
    const isPt76 = t.includes('pt76');
    const isSu100 = t.includes('su100') || t.includes('su_100');
    const isOntos = t.includes('ontos');
    const isPatton = t.includes('m60') || t.includes('m48') || t.includes('patton');

    const spec: TankSpec = DEFAULT_TANK;
    const hl = spec?.hullL ?? 22;
    const hw = spec?.hullW ?? 11;

    // Tracks with road-wheel / track-link ticks
    ctx.fillStyle = trackColor;
    ctx.fillRect(-hl / 2 - 1, -hw / 2 - 2.5, hl + 2, 3);
    ctx.fillRect(-hl / 2 - 1, hw / 2 - 0.5, hl + 2, 3);
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.35)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = -hl / 2; x <= hl / 2; x += 2.4) {
      ctx.moveTo(x, -hw / 2 - 2.5);
      ctx.lineTo(x, -hw / 2 + 0.5);
      ctx.moveTo(x, hw / 2 - 0.5);
      ctx.lineTo(x, hw / 2 + 2.5);
    }
    ctx.stroke();

    // Hull geometry
    ctx.fillStyle = hullFill;
    ctx.strokeStyle = hullStroke;
    ctx.lineWidth = 1.2;
    if (isIs3 || isPt76) {
      // Pike-nose IS-3 or pointed boat bow PT-76
      ctx.beginPath();
      ctx.moveTo(hl / 2 + 2.5, 0);
      ctx.lineTo(hl / 2 - 2.5, -hw / 2);
      ctx.lineTo(-hl / 2, -hw / 2);
      ctx.lineTo(-hl / 2, hw / 2);
      ctx.lineTo(hl / 2 - 2.5, hw / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Sloped glacis (T-34 / Sherman / postwar MBTs) shown as a chamfered front
      const ch = spec?.glacis ?? 0;
      ctx.beginPath();
      ctx.moveTo(hl / 2, -hw / 2 + ch);
      ctx.lineTo(hl / 2 - ch, -hw / 2);
      ctx.lineTo(-hl / 2, -hw / 2);
      ctx.lineTo(-hl / 2, hw / 2);
      ctx.lineTo(hl / 2 - ch, hw / 2);
      ctx.lineTo(hl / 2, hw / 2 - ch);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Engine deck louver accent
      ctx.fillStyle = hullHighlight;
      ctx.fillRect(-hl / 2 + 1.5, -hw / 2 + 1.9, hl * 0.25, hw - 3.8);
    }

    // Soviet external rear fuel drums (T-34 / T-55 / T-72 / T-80)
    if (isSovietEra || isSovietMid) {
      ctx.fillStyle = '#455A64';
      ctx.fillRect(-12.2, -4.4, 2.2, 3.6);
      ctx.fillRect(-12.2, 0.8, 2.2, 3.6);
    }

    if (isOntos) {
      // M50 Ontos 6x 106mm recoilless rifles
      ctx.fillStyle = turretFill;
      ctx.fillRect(-4, -3.5, 8, 7);
      ctx.strokeRect(-4, -3.5, 8, 7);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.15;
      for (const ry of [-4.4, -2.9, -1.4, 1.4, 2.9, 4.4]) {
        ctx.beginPath();
        ctx.moveTo(1, ry);
        ctx.lineTo(12, ry);
        ctx.stroke();
      }
    } else if (isSu100) {
      // SU-100 Casemate sloped hull + long 100mm gun
      ctx.fillStyle = turretFill;
      ctx.fillRect(-2, -4.4, 10, 8.8);
      ctx.strokeRect(-2, -4.4, 10, 8.8);
      ctx.strokeStyle = barrelColor;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
    } else if (isAbrams) {
      // Armored ballistic side skirts
      ctx.fillStyle = hullHighlight;
      ctx.fillRect(-11, -6.8, 21.5, 1.6);
      ctx.fillRect(-11, 5.2, 21.5, 1.6);
      // Angular Chobham turret + rear bustle rack
      ctx.fillStyle = turretFill;
      ctx.strokeStyle = hullStroke;
      ctx.beginPath();
      ctx.moveTo(6.2, -2.6);
      ctx.lineTo(-0.5, -5);
      ctx.lineTo(-8.5, -4.6);
      ctx.lineTo(-8.5, 4.6);
      ctx.lineTo(-0.5, 5);
      ctx.lineTo(6.2, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Bustle stowage rack & roof hatch
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-8.2, -3.6, 2.2, 7.2);
      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.arc(-2, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      // 105mm/120mm gun + bore evacuator
      ctx.strokeStyle = barrelColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(17.5, 0);
      ctx.stroke();
      ctx.fillStyle = barrelColor;
      ctx.fillRect(10, -1.4, 3, 2.8);
    } else {
      // Turret from the historical spec table (shape, position, size, gun)
      const sp = spec ?? DEFAULT_TANK;
      if (isSovietEra || t.includes('rise')) {
        // Glacis Kontakt-1 / RISE ERA armor bricks
        ctx.fillStyle = turretFill;
        ctx.fillRect(hl / 2 - 2.5, -hw / 2 + 1, 2.2, hw - 2);
      }
      ctx.fillStyle = turretFill;
      ctx.strokeStyle = hullStroke;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      if (sp.turret === 'needle') {
        // M60A1 long needle-nose turret
        ctx.moveTo(sp.turretX + sp.turretRx, 0);
        ctx.quadraticCurveTo(sp.turretX + sp.turretRx * 0.4, -sp.turretRy, sp.turretX - sp.turretRx * 0.7, -sp.turretRy);
        ctx.lineTo(sp.turretX - sp.turretRx, -sp.turretRy * 0.7);
        ctx.lineTo(sp.turretX - sp.turretRx, sp.turretRy * 0.7);
        ctx.lineTo(sp.turretX - sp.turretRx * 0.7, sp.turretRy);
        ctx.quadraticCurveTo(sp.turretX + sp.turretRx * 0.4, sp.turretRy, sp.turretX + sp.turretRx, 0);
      } else if (sp.turret === 'boxy') {
        // Riveted / welded box turret (Type 95, Type 97, M3)
        ctx.rect(sp.turretX - sp.turretRx, sp.turretY - sp.turretRy, sp.turretRx * 2, sp.turretRy * 2);
      } else {
        // Cast round / egg / flat-dome turret
        ctx.ellipse(sp.turretX, sp.turretY, sp.turretRx, sp.turretRy, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      // Commander's cupola
      ctx.fillStyle = hullHighlight;
      ctx.beginPath();
      ctx.arc(sp.turretX - sp.turretRx * 0.35, sp.turretY + (sp.turretY ? 0 : -sp.turretRy * 0.35), Math.max(1, sp.turretRy * 0.32), 0, Math.PI * 2);
      ctx.fill();

      if (isSovietEra) {
        // Turret front ERA wedge blocks
        ctx.strokeStyle = '#FFB300';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sp.turretX, 0, sp.turretRx * 0.95, -0.75, 0.75);
        ctx.stroke();
      } else if (isPatton) {
        // M48 / M60 xenon IR searchlight box on mantlet
        ctx.fillStyle = '#FFE082';
        ctx.fillRect(sp.turretX + sp.turretRx * 0.5, sp.turretY - sp.turretRy * 0.75, 2.2, 1.8);
      }

      // Gun: length and thickness from caliber; bore evacuator / muzzle brake where fitted
      const gx = sp.turretX + sp.turretRx * 0.8;
      ctx.strokeStyle = barrelColor;
      ctx.lineWidth = sp.gunW;
      ctx.beginPath();
      ctx.moveTo(gx, sp.turretY);
      ctx.lineTo(gx + sp.gunLen, sp.turretY);
      ctx.stroke();
      ctx.fillStyle = barrelColor;
      if (sp.evacuatorAt !== undefined) {
        ctx.fillRect(gx + sp.gunLen * sp.evacuatorAt - 1, sp.turretY - sp.gunW * 0.75, 2.2, sp.gunW * 1.5);
      }
      if (sp.muzzleBrake) {
        ctx.fillStyle = isIs3 ? '#FFD54F' : barrelColor;
        ctx.fillRect(gx + sp.gunLen - 1.2, sp.turretY - sp.gunW * 0.85, 1.8, sp.gunW * 1.7);
      }
    }
  } else if (kind === 'spg') {
    drawSpg(ctx, SPG_SPECS.find((sp) => sp.match.test(t)) ?? DEFAULT_SPG, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'towed') {
    drawTowedGun(ctx, TOWED_SPECS.find((sp) => sp.match.test(t)) ?? DEFAULT_TOWED, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'air_defense' && AD_SPECS.some((sp) => sp.match.test(t))) {
    drawArmoredCarrier(ctx, AD_SPECS.find((sp) => sp.match.test(t))!, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'air_defense') {
    const isTunguska = t.includes('tunguska');
    const isShilka = t.includes('shilka');
    // M42 Duster shares the ZSU-57-2 layout: open-topped turret with twin AA guns on a light-tank chassis
    const isZsu57 = t.includes('zsu57') || t.includes('duster');
    const isVads = t.includes('vads') || t.includes('m163');
    const isOsa = t.includes('sa8') || t.includes('osa');
    const isStrela = t.includes('sa9') || t.includes('strela');
    const isKub = t.includes('sa6') || t.includes('kub');
    const isBuk = t.includes('sa11') || t.includes('buk');
    const isTor = t.includes('sa15') || /(^|_)tor(_|$)/.test(t);
    const isSamRails = t.includes('chaparral') || (!isTunguska && !isShilka && !isZsu57 && !isVads && (t.includes('sam') || isKub || isBuk || isOsa || isStrela || isTor));

    if (isOsa || isStrela) {
      // 6x6 or 4x4 wheeled SAM hull
      const wxList = isOsa ? [-7, 0, 7] : [-6, 6];
      ctx.fillStyle = trackColor;
      for (const wx of wxList) {
        ctx.fillRect(wx - 1.8, -7.2, 3.6, 2.1);
        ctx.fillRect(wx - 1.8, 5.1, 3.6, 2.1);
      }
    } else {
      ctx.fillStyle = trackColor;
      ctx.fillRect(-10.5, -7.2, 21, 2.6);
      ctx.fillRect(-10.5, 4.6, 21, 2.6);
    }

    ctx.fillStyle = hullFill;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.fillRect(-9.5, -4.8, 19, 9.6);
    ctx.strokeRect(-9.5, -4.8, 19, 9.6);

    if (isTunguska) {
      // Large turret + dish radar + twin 30mm guns + 8 side missile tubes
      ctx.fillStyle = turretFill;
      ctx.fillRect(-5, -4, 9, 8);
      ctx.strokeRect(-5, -4, 9, 8);
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(-3.5, -6, 6, 1.8);
      ctx.fillRect(-3.5, 4.2, 6, 1.8);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(3, -2);
      ctx.lineTo(13, -2);
      ctx.moveTo(3, 2);
      ctx.lineTo(13, 2);
      ctx.stroke();
      ctx.fillStyle = '#80DEEA';
      ctx.fillRect(-5.5, -2.5, 2, 5);
    } else if (isShilka) {
      // ZSU-23-4 flat turret + quad 23mm barrels + circular dish radar
      ctx.fillStyle = turretFill;
      ctx.fillRect(-4.5, -4, 8.5, 8);
      ctx.strokeRect(-4.5, -4, 8.5, 8);
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.1;
      for (const gy of [-2.4, -0.8, 0.8, 2.4]) {
        ctx.beginPath();
        ctx.moveTo(3.5, gy);
        ctx.lineTo(12, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = '#80DEEA';
      ctx.beginPath();
      ctx.arc(-4.5, 0, 2.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isKub || isBuk) {
      // SA-6 (3 big cream missiles) or SA-11 (4 missiles + front radar nose)
      const offsets = isBuk ? [-3.3, -1.1, 1.1, 3.3] : [-2.8, 0, 2.8];
      if (isBuk) {
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(3.5, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 1.7;
      for (const my of offsets) {
        ctx.beginPath();
        ctx.moveTo(-6, my);
        ctx.lineTo(8, my);
        ctx.stroke();
      }
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(6.5, -3.8, 1.8, 7.6);
    } else if (isTor) {
      // SA-15 Tor tall radar/VLS box turret
      ctx.fillStyle = turretFill;
      ctx.fillRect(-4, -3.8, 8, 7.6);
      ctx.strokeRect(-4, -3.8, 8, 7.6);
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(-2, -3.2, 4, 1.4);
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(1, -2.5, 2.5, 5);
    } else if (isOsa) {
      // SA-8 wide H-band folding radar + 6 canisters
      ctx.fillStyle = '#ECEFF1';
      ctx.fillRect(-3, -5.5, 2, 11);
      ctx.fillStyle = '#FF7043';
      ctx.fillRect(-0.5, -4, 6, 2);
      ctx.fillRect(-0.5, 2, 6, 2);
    } else if (isSamRails) {
      // Chaparral / SA-9 4-rail missiles
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 1.5;
      for (const my of [-3.4, -1.1, 1.1, 3.4]) {
        ctx.beginPath();
        ctx.moveTo(-4.5, my);
        ctx.lineTo(7, my);
        ctx.stroke();
      }
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(5.8, -4, 1.6, 8);
    } else {
      // M163 VADS / ZSU-57-2 / Flak AA
      ctx.fillStyle = isZsu57 ? '#1A232A' : turretFill;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = isZsu57 ? 1.5 : 1.3;
      ctx.beginPath();
      ctx.moveTo(2, -1.5);
      ctx.lineTo(isZsu57 ? 13 : 11, -1.5);
      ctx.moveTo(2, 1.5);
      ctx.lineTo(isZsu57 ? 13 : 11, 1.5);
      ctx.stroke();
      if (isVads) {
        ctx.fillStyle = '#69F0AE';
        ctx.beginPath();
        ctx.arc(-2.5, -2.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === 'carrier') {
    drawArmoredCarrier(ctx, IFV_SPECS.find((sp) => sp.match.test(t)) ?? DEFAULT_IFV, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'engineer') {
    drawEngineerTeam(ctx, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'atgm') {
    drawAtgmTeam(ctx, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else if (kind === 'mortar') {
    drawMortarSection(ctx, t, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  } else {
    drawInfantryTeam(ctx, t, { hullFill, hullHighlight, hullStroke, turretFill, trackColor, barrelColor });
  }
  ctx.restore();
}

function drawBlueprintBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  kind: UnitPreviewKind,
  isNuclear: boolean
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (isNuclear) {
    grad.addColorStop(0, '#1B0B10');
    grad.addColorStop(1, '#2D1114');
  } else if (kind === 'ship') {
    grad.addColorStop(0, '#041224');
    grad.addColorStop(1, '#08213D');
  } else if (kind === 'aircraft') {
    grad.addColorStop(0, '#051526');
    grad.addColorStop(1, '#0B243B');
  } else if (kind === 'ground') {
    grad.addColorStop(0, '#06171C');
    grad.addColorStop(1, '#0C2522');
  } else {
    grad.addColorStop(0, '#101622');
    grad.addColorStop(1, '#1A2230');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle blueprint tactical grid
  ctx.strokeStyle = isNuclear ? 'rgba(255, 193, 7, 0.10)' : 'rgba(128, 222, 234, 0.08)';
  ctx.lineWidth = 0.75;
  const step = 12;
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Corner reticle ticks
  ctx.strokeStyle = isNuclear ? 'rgba(255, 213, 79, 0.45)' : 'rgba(79, 195, 247, 0.35)';
  ctx.lineWidth = 1;
  const t = 5;
  ctx.beginPath();
  ctx.moveTo(2, 2 + t);
  ctx.lineTo(2, 2);
  ctx.lineTo(2 + t, 2);
  ctx.moveTo(w - 2 - t, 2);
  ctx.lineTo(w - 2, 2);
  ctx.lineTo(w - 2, 2 + t);
  ctx.moveTo(2, h - 2 - t);
  ctx.lineTo(2, h - 2);
  ctx.lineTo(2 + t, h - 2);
  ctx.moveTo(w - 2 - t, h - 2);
  ctx.lineTo(w - 2, h - 2);
  ctx.lineTo(w - 2, h - 2 - t);
  ctx.stroke();
}

function drawShipPreview(ctx: CanvasRenderingContext2D, w: number, h: number, rawKey: string) {
  const k = normalizeKey(rawKey);
  const cx = w * 0.5;
  const cy = h * 0.52;
  const scale = Math.min(w / 138, h / 46);

  const isOpfor =
    k.includes('kiev') ||
    k.includes('kirov') ||
    k.includes('sovremenny') ||
    k.includes('udaloy') ||
    k.includes('kynda') ||
    k.includes('sverdlov') ||
    k.includes('petya') ||
    k.includes('riga') ||
    k.includes('kashin') ||
    k.includes('komar') ||
    k.includes('osa') ||
    k.includes('foxtrot') ||
    k.includes('oscar');

  const hullColor = isOpfor ? '#2A141A' : '#0B2136';
  const strokeColor = isOpfor ? '#EF5350' : '#4FC3F7';
  const deckRim = isOpfor ? 'rgba(255, 138, 128, 0.35)' : 'rgba(128, 222, 234, 0.30)';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Sea wake + bow V-spray
  ctx.strokeStyle = 'rgba(128, 222, 234, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-48, -2);
  ctx.lineTo(-65, -7.5);
  ctx.moveTo(-48, 2);
  ctx.lineTo(-65, 7.5);
  ctx.stroke();

  if (k === 'cvn' || k === 'cv63' || k === 'carrier' || k === 'cve' || k === 'lph' || k === 'lha_tarawa' || k === 'cvhg_kiev') {
    const isModern = k === 'cvn' || k === 'cv63';
    const isKiev = k === 'cvhg_kiev';
    const isLph = k === 'lph' || k === 'lha_tarawa';
    ctx.fillStyle = isKiev ? '#261318' : '#0D263E';
    ctx.strokeStyle = isKiev ? '#EF5350' : isLph ? '#4DB6AC' : '#4FC3F7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (isModern) {
      ctx.moveTo(52, -7);
      ctx.lineTo(50, 9);
      ctx.lineTo(14, 12);
      ctx.lineTo(-10, 15);
      ctx.lineTo(-42, 14);
      ctx.lineTo(-52, 8);
      ctx.lineTo(-52, -10);
      ctx.lineTo(-36, -14);
      ctx.lineTo(18, -14);
    } else if (isKiev) {
      ctx.moveTo(50, 0);
      ctx.lineTo(34, -8);
      ctx.lineTo(-46, -13);
      ctx.lineTo(-50, 0);
      ctx.lineTo(-46, 10);
      ctx.lineTo(28, 8);
    } else {
      ctx.moveTo(48, -10);
      ctx.lineTo(52, 0);
      ctx.lineTo(48, 10);
      ctx.lineTo(-48, 11);
      ctx.lineTo(-51, 0);
      ctx.lineTo(-48, -11);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Yellow foul edge lines & runway dashed axis
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-45, -11);
    ctx.lineTo(20, -11);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    if (isModern || isKiev) {
      ctx.moveTo(-46, -5);
      ctx.lineTo(22, 4);
    } else {
      ctx.moveTo(-42, 0);
      ctx.lineTo(44, 0);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (isKiev) {
      // Forward P-500 Bazalt missile tubes on foredeck
      ctx.fillStyle = '#FF7043';
      ctx.fillRect(22, -4, 14, 8);
    } else {
      // Catapult tracks
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(18, -2);
      ctx.lineTo(46, -2);
      ctx.moveTo(18, 4);
      ctx.lineTo(46, 4);
      ctx.stroke();
    }

    // Island superstructure + radar bar
    ctx.fillStyle = isKiev ? '#3B1D24' : '#1C3F60';
    ctx.strokeStyle = isKiev ? '#FF8A80' : '#80DEEA';
    ctx.fillRect(isModern ? -10 : 8, 6.5, 16, 6);
    ctx.strokeRect(isModern ? -10 : 8, 6.5, 16, 6);
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.moveTo(isModern ? -2 : 16, 5.5);
    ctx.lineTo(isModern ? -2 : 16, 13.5);
    ctx.stroke();

    // Parked miniature deck aircraft silhouettes
    ctx.fillStyle = '#90CAF9';
    for (const ax of [-34, -22]) {
      ctx.fillRect(ax, -10, 4, 2.2);
    }
  } else if (k === 'ohio_ssbn' || k === 'ssn_la' || k === 'ss' || k === 'foxtrot' || k === 'ssgn_oscar') {
    const isBoomer = k === 'ohio_ssbn';
    const isOscar = k === 'ssgn_oscar';
    const isNukeSub = isBoomer || k === 'ssn_la' || isOscar;
    ctx.fillStyle = isBoomer ? '#1A1120' : isOscar ? '#241219' : '#0B1D2C';
    ctx.strokeStyle = isBoomer ? '#FFD54F' : isOscar ? '#FF5252' : '#4DD0E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, isBoomer ? 52 : 46, isOscar ? 9 : isBoomer ? 7.5 : 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Bow diving planes + stern cruciform stabilizers
    ctx.fillStyle = '#263238';
    ctx.fillRect(10, -2.5, 13, 5);
    ctx.strokeRect(10, -2.5, 13, 5);
    ctx.fillRect(14, -5.5, 2.5, 11);
    ctx.fillRect(-45, -7, 3, 14);
    if (isBoomer) {
      ctx.fillStyle = '#FF5252';
      for (let mx = -28; mx <= 2; mx += 5) {
        ctx.fillRect(mx, -3.2, 3, 2.2);
        ctx.fillRect(mx, 1, 3, 2.2);
      }
    } else if (isOscar) {
      ctx.fillStyle = '#FF7043';
      for (let mx = -14; mx <= 26; mx += 6) {
        ctx.fillRect(mx, -7, 4, 2.2);
        ctx.fillRect(mx, 4.8, 4, 2.2);
      }
    } else if (!isNukeSub) {
      ctx.strokeStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.moveTo(23, 0);
      ctx.lineTo(31, 0);
      ctx.stroke();
    }
  } else if (k === 'lcac') {
    ctx.fillStyle = '#1E252B';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-34, -14, 68, 28, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-24, -8, 48, 16);
    ctx.strokeStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(-26, -10, 4.5, 0, Math.PI * 2);
    ctx.arc(-26, 10, 4.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FFE082';
    ctx.fillRect(16, -12, 8, 4);
  } else if (k === 'lpd' || k === 'lst' || k === 'lcvp' || k === 'lcm8' || k === 'lsm_r') {
    const isBig = k === 'lpd' || k === 'lst';
    const isRocket = k === 'lsm_r';
    ctx.fillStyle = '#0B2034';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(isBig ? 44 : 32, -9);
    ctx.lineTo(isBig ? 48 : 34, 0);
    ctx.lineTo(isBig ? 44 : 32, 9);
    ctx.lineTo(isBig ? -44 : -32, 10);
    ctx.lineTo(isBig ? -44 : -32, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = k === 'lpd' ? 'rgba(0, 188, 212, 0.35)' : '#1C3144';
    ctx.fillRect(isBig ? -38 : -20, -6, isBig ? 42 : 40, 12);
    ctx.strokeRect(isBig ? -38 : -20, -6, isBig ? 42 : 40, 12);
    if (k === 'lpd') {
      ctx.fillStyle = '#163856';
      ctx.fillRect(10, -7, 18, 14);
      ctx.strokeRect(10, -7, 18, 14);
    } else if (isRocket) {
      ctx.fillStyle = '#FFAB00';
      for (let rx = -14; rx <= 14; rx += 7) {
        ctx.fillRect(rx, -4.5, 4, 9);
      }
    }
  } else if (k.startsWith('bb') || k === 'kongo') {
    const isMod = k === 'bb_iowa_mod';
    ctx.fillStyle = hullColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(54, 0);
    ctx.lineTo(36, -9);
    ctx.lineTo(-40, -10);
    ctx.lineTo(-50, 0);
    ctx.lineTo(-40, 10);
    ctx.lineTo(36, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Deck centerline & citadel
    ctx.strokeStyle = deckRim;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-44, 0);
    ctx.lineTo(48, 0);
    ctx.stroke();
    ctx.fillStyle = '#183754';
    ctx.strokeStyle = strokeColor;
    ctx.fillRect(-16, -6, 32, 12);
    ctx.strokeRect(-16, -6, 32, 12);
    // Triple turrets
    ctx.fillStyle = '#546E7A';
    ctx.strokeStyle = '#FFE082';
    for (const tx of [30, 18, -32]) {
      ctx.fillRect(tx - 4, -4, 8, 8);
      ctx.strokeRect(tx - 4, -4, 8, 8);
      ctx.beginPath();
      const dir = tx > 0 ? 1 : -1;
      for (const gy of [-2, 0, 2]) {
        ctx.moveTo(tx, gy);
        ctx.lineTo(tx + dir * 11, gy);
      }
      ctx.stroke();
    }
    if (isMod) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(-2, -8, 10, 2.5);
      ctx.fillRect(-2, 5.5, 10, 2.5);
    }
  } else if (k.startsWith('cg') || k === 'cgn_kirov' || k === 'kynda') {
    const isTico = k === 'cg_tico';
    const isKirov = k === 'cgn_kirov';
    ctx.fillStyle = hullColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(49, 0);
    ctx.lineTo(30, -8);
    ctx.lineTo(-42, -8);
    ctx.lineTo(-47, 0);
    ctx.lineTo(-42, 8);
    ctx.lineTo(30, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isOpfor ? '#421C24' : '#163858';
    ctx.fillRect(-14, -5.5, 28, 11);
    ctx.strokeRect(-14, -5.5, 28, 11);
    if (isTico) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(8, -6.5, 5, 2);
      ctx.fillRect(8, 4.5, 5, 2);
    }
    ctx.fillStyle = isKirov ? '#FF7043' : '#FFD54F';
    ctx.fillRect(20, -3.5, 10, 7);
    ctx.fillRect(-30, -3.5, 9, 7);
    ctx.strokeStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(45, 0);
    ctx.stroke();
  } else {
    // Cruiser / Destroyer / Frigate / FAC
    const isFfg = k.includes('ffg') || k === 'petya' || k === 'riga';
    const isFac = k === 'komar_ptg' || k === 'osa';
    const len = isFac ? 30 : isFfg ? 42 : 46;
    ctx.fillStyle = hullColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(len * 0.62, -7);
    ctx.lineTo(-len * 0.85, -7);
    ctx.lineTo(-len * 0.96, 0);
    ctx.lineTo(-len * 0.85, 7);
    ctx.lineTo(len * 0.62, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bow breakwater V-shield
    ctx.strokeStyle = deckRim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(len * 0.45, -4);
    ctx.lineTo(len * 0.62, 0);
    ctx.lineTo(len * 0.45, 4);
    ctx.stroke();
    // Superstructure & radar mast bar
    ctx.fillStyle = isOpfor ? '#421C24' : '#173A5C';
    ctx.strokeStyle = strokeColor;
    ctx.fillRect(-10, -4.5, 22, 9);
    ctx.strokeRect(-10, -4.5, 22, 9);
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(2, 6);
    ctx.stroke();
    // Forward gun / missile canisters
    if (isFac) {
      ctx.fillStyle = '#FF7043';
      ctx.fillRect(-16, -6.2, 12, 2.4);
      ctx.fillRect(-16, 3.8, 12, 2.4);
    } else {
      ctx.fillStyle = isFfg ? '#FFD54F' : '#80DEEA';
      ctx.beginPath();
      ctx.arc(22, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(34, 0);
      ctx.stroke();
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(-len * 0.8, -4.5, 14, 9);
    }
  }

  // Port (Red) & Starboard (Green) navigation light pips
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(-2, -9.5, 2, 2);
  ctx.fillStyle = '#00E676';
  ctx.fillRect(-2, 7.5, 2, 2);

  ctx.restore();
}

type Icon = { canvas: HTMLCanvasElement; w: number; h: number };

/** Crops a rendered canvas to what was drawn on it. */
function cropToContent(raw: HTMLCanvasElement): Icon | null {
  const px = raw.width;
  const py = raw.height;
  const data = raw.getContext('2d')!.getImageData(0, 0, px, py).data;
  let x0 = px, y0 = py, x1 = -1, y1 = -1;
  for (let y = 0; y < py; y += 2) {
    for (let x = 0; x < px; x += 2) {
      if (data[(y * px + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return null;
  const cw = x1 - x0 + 4;
  const ch = y1 - y0 + 4;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  c.getContext('2d')!.drawImage(raw, x0 - 2, y0 - 2, cw, ch, 0, 0, cw, ch);
  return { canvas: c, w: cw, h: ch };
}

function drawFittedIcon(ctx: CanvasRenderingContext2D, w: number, h: number, icon: Icon, fw: number, fh: number): void {
  const fit = Math.min((w * fw) / icon.w, (h * fh) / icon.h);
  const dw = icon.w * fit;
  const dh = icon.h * fit;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(icon.canvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** The ship a naval card delivers in the era, drawn with its map artwork (bow to the right). */
const SHIP_ICON_CACHE = new Map<string, Icon | null>();
function shipIcon(typeTag: string, era: Era): Icon | null {
  const key = `${typeTag}|${era}`;
  if (SHIP_ICON_CACHE.has(key)) return SHIP_ICON_CACHE.get(key)!;
  let icon: Icon | null = null;
  if (typeof document !== 'undefined') {
    const ship = buildRequisitionShip({ typeTag, id: typeTag } as RequisitionItem, era, 'preview', { x: 0, y: 0 });
    if (ship) {
      ship.heading = 0;
      // Guns trained fore and aft, as in harbour
      for (const t of ship.turrets) t.angle = t.relX < 0 ? Math.PI : 0;
      const res = 4;
      const span = Math.max(80, ship.length * 1.4);
      const raw = document.createElement('canvas');
      raw.width = Math.ceil(span * res);
      raw.height = Math.ceil(Math.max(40, ship.width * 4) * res);
      const rctx = raw.getContext('2d')!;
      rctx.translate(raw.width / 2, raw.height / 2);
      rctx.scale(res, res);
      drawShipIcon({ ctx: rctx, width: raw.width, height: raw.height, time: 0.4, era }, ship);
      icon = cropToContent(raw);
    }
  }
  SHIP_ICON_CACHE.set(key, icon);
  return icon;
}

/**
 * The aircraft exactly as it is drawn on the map (its own planform, markings, rotor or props),
 * rendered once at high resolution, cropped to its outline and cached per type and store.
 */
const AIRCRAFT_ICON_CACHE = new Map<string, { canvas: HTMLCanvasElement; w: number; h: number } | null>();
const ICON_RES = 6;
const ICON_SPAN = 120;

export function aircraftIcon(model: string, payloadType?: AircraftPayloadType): { canvas: HTMLCanvasElement; w: number; h: number } | null {
  const key = `${model}|${payloadType ?? ''}`;
  if (AIRCRAFT_ICON_CACHE.has(key)) return AIRCRAFT_ICON_CACHE.get(key)!;
  let result: { canvas: HTMLCanvasElement; w: number; h: number } | null = null;
  if (model in AIRCRAFT_NATION && typeof document !== 'undefined') {
    const px = ICON_SPAN * ICON_RES;
    const raw = document.createElement('canvas');
    raw.width = px;
    raw.height = px;
    const rctx = raw.getContext('2d');
    if (rctx) {
      rctx.translate(px / 2, px / 2);
      rctx.scale(ICON_RES, ICON_RES);
      rctx.strokeStyle = '#4FC3F7';
      rctx.fillStyle = '#06101E';
      rctx.lineWidth = 1.5;
      const plane = {
        id: 'preview',
        squadronId: 'preview',
        model: model as AircraftModel,
        role: 'fighter',
        name: '',
        side: 'player',
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        heading: 0,
        targetHeading: 0,
        speed: 0,
        maxSpeed: 0,
        altitude: 0.8,
        state: 'cruising',
        health: 1,
        maxHealth: 1,
        order: { type: 'idle' },
        hasPayload: true,
        payloadType,
        shootCooldown: 0,
        wingmanOffset: { x: 0, y: 0 },
      } as unknown as Aircraft;
      drawSpecificAircraftModel({ ctx: rctx, width: px, height: px, time: 0.37, era: 'era1' }, plane, '#4FC3F7');
      // Crop to the drawn outline
      const data = rctx.getImageData(0, 0, px, px).data;
      let x0 = px, y0 = px, x1 = -1, y1 = -1;
      for (let y = 0; y < px; y += 2) {
        for (let x = 0; x < px; x += 2) {
          if (data[(y * px + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 > x0 && y1 > y0) {
        const cw = x1 - x0 + 4;
        const ch = y1 - y0 + 4;
        const c = document.createElement('canvas');
        c.width = cw;
        c.height = ch;
        c.getContext('2d')!.drawImage(raw, x0 - 2, y0 - 2, cw, ch, 0, 0, cw, ch);
        result = { canvas: c, w: cw, h: ch };
      }
    }
  }
  AIRCRAFT_ICON_CACHE.set(key, result);
  return result;
}

function drawAircraftPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rawKey: string,
  payloadType?: AircraftPayloadType
) {
  // The real map artwork of the type, fitted to the card (nose to the right)
  const icon = aircraftIcon(rawKey, payloadType);
  if (icon) {
    drawFittedIcon(ctx, w, h, icon, 0.9, 0.9);
    return;
  }
  const m = normalizeKey(rawKey);
  const cx = w * 0.5;
  const cy = h * 0.52;
  const scale = Math.min(w / 76, h / 46);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const isHeli =
    m === 'ah64a' ||
    m === 'ah1w' ||
    m === 'ah1' ||
    m === 'uh1' ||
    m === 'ch53' ||
    m === 'sh3f' ||
    m === 'sh2' ||
    m === 'ka27' ||
    m === 'mi24' ||
    m === 'ho3s1' ||
    m === 'sar_ho3s1' ||
    m.includes('sar');

  const isHeavyBomber =
    m === 'b52' ||
    m === 'b29' ||
    m === 'b17' ||
    m === 'b17_late' ||
    m === 'b24' ||
    m === 'b25' ||
    m === 'lancaster' ||
    m === 'tu16' ||
    m === 'tu95' ||
    m === 'tu22m3' ||
    m === 'heavy_bomber_pool' ||
    m === 'c130' ||
    m === 'c47' ||
    m === 'c1' ||
    m === 'c2a' ||
    m === 'p3' ||
    m === 'il38';

  const isAwacs = m === 'e2c' || m === 'e3a' || m === 'e1' || m === 'a50' || m === 'aew_ad3w' || m === 'ad3w';
  const isDelta = m === 'mirage3' || m === 'mirage2000' || m === 'mig21' || m === 'a4' || m === 'su7';
  const isSwingWing = m === 'f14a' || m === 'f111' || m === 'tornado_gr1' || m === 'tornado_ids' || m === 'tornado_adv' || m === 'tu22m3';
  const isTwinBoom = m === 'p38' || m === 'ov10' || m === 'f82';
  const isJet =
    isDelta ||
    isSwingWing ||
    m === 'fa18a' ||
    m === 'f15a' ||
    m === 'f16a' ||
    m === 'a6e' ||
    m === 'a6a' ||
    m === 'ea6b' ||
    m === 'av8b' ||
    m === 's3a' ||
    m === 'a10a' ||
    m === 'f4b' ||
    m === 'f4j' ||
    m === 'f4e' ||
    m === 'f4f_phantom' ||
    m === 'f8' ||
    m === 'a7' ||
    m === 'f105' ||
    m === 'f86' ||
    m === 'f9f' ||
    m === 'f2h' ||
    m === 'fighter_jet_f9f' ||
    m === 'fighter_jet_f2h' ||
    m === 'f104g' ||
    m === 'f5a' ||
    m === 'a37b' ||
    m === 'jaguar_gr1' ||
    m === 'hunter_fga9' ||
    m === 'meteor' ||
    m === 'mig15' ||
    m === 'mig17' ||
    m === 'mig19' ||
    m === 'mig23' ||
    m === 'su25' ||
    m === 'su27' ||
    m === 'yak38' ||
    m === 'il28';

  const primaryStroke = isHeli ? '#66BB6A' : isHeavyBomber ? '#80CBC4' : '#4FC3F7';
  const bodyFill = '#0F2740';

  if (isHeli) {
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(8, -3.5);
    ctx.lineTo(-8, -3.5);
    ctx.lineTo(-20, -1.2);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-20, 1.2);
    ctx.lineTo(-8, 3.5);
    ctx.lineTo(8, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Stub wings / sponsons
    ctx.beginPath();
    ctx.moveTo(1, -10.5);
    ctx.lineTo(-3, -10.5);
    ctx.lineTo(-3, 10.5);
    ctx.lineTo(1, 10.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cockpit glass
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(9, 0, 3.2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rotor arc + blades
    ctx.strokeStyle = 'rgba(128, 222, 234, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#E0F7FA';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.moveTo(-12, 12);
    ctx.lineTo(12, -12);
    ctx.stroke();
  } else if (isAwacs) {
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    if (m === 'e3a' || m === 'a50') {
      ctx.moveTo(5, 0);
      ctx.lineTo(-8, -20);
      ctx.lineTo(-13, -20);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-13, 20);
      ctx.lineTo(-8, 20);
    } else {
      ctx.moveTo(4, -20);
      ctx.lineTo(4, 20);
      ctx.lineTo(-4, 20);
      ctx.lineTo(-4, -20);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ECEFF1';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
  } else if (isHeavyBomber) {
    const isSwept = m === 'b52' || m === 'tu16' || m === 'tu95' || m === 'tu22m3';
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    if (isSwept) {
      ctx.moveTo(7, -3);
      ctx.lineTo(-9, -22);
      ctx.lineTo(-15, -22);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3);
      ctx.lineTo(-15, 22);
      ctx.lineTo(-9, 22);
      ctx.lineTo(7, 3);
    } else {
      ctx.moveTo(5, -22);
      ctx.lineTo(5, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-4, -22);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 4 Engine Pods (or 2 for B-25)
    ctx.fillStyle = '#FFD54F';
    const pods = m === 'b25' ? [-9, 9] : [-14, -8, 8, 14];
    for (const ey of pods) {
      ctx.fillRect(0, ey - 1.2, 6, 2.4);
    }
    // Tailplane + MAD tail stinger on P-3/IL-38
    ctx.fillStyle = bodyFill;
    ctx.beginPath();
    ctx.moveTo(-19, -9);
    ctx.lineTo(-24, -9);
    ctx.lineTo(-24, 9);
    ctx.lineTo(-19, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (m === 'p3' || m === 'il38') {
      ctx.strokeStyle = '#FF5252';
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(-30, 0);
      ctx.stroke();
    }
  } else if (isSwingWing) {
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-7, -19);
    ctx.lineTo(-13, -19);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-13, 19);
    ctx.lineTo(-7, 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(10, -4.5);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-20, 5);
    ctx.lineTo(10, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(9, 0, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFB300';
    ctx.fillRect(-22, -4, 3, 2.2);
    ctx.fillRect(-22, 1.8, 3, 2.2);
  } else if (isDelta) {
    // Pure Delta (Mirage III/2000, MiG-21, A-4)
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-14, -17);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-14, 17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(10, -2.8);
    ctx.lineTo(-19, -3);
    ctx.lineTo(-19, 3);
    ctx.lineTo(10, 2.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(8, 0, 4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF9100';
    ctx.fillRect(-21.5, -1.6, 2.5, 3.2);
  } else if (m === 'a10a') {
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-3, -21, 7, 42);
    ctx.strokeRect(-3, -21, 7, 42);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#455A64';
    ctx.fillRect(-10, -6.5, 8, 3);
    ctx.fillRect(-10, 3.5, 8, 3);
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(7, 0, 3.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(17, -0.8, 4, 1.6);
  } else if (isTwinBoom) {
    // P-38 / OV-10 / F-82 Twin Boom or Twin Fuselage
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-3, -20, 7, 40);
    ctx.strokeRect(-3, -20, 7, 40);
    ctx.fillRect(-17, -9.5, 28, 3.2);
    ctx.strokeRect(-17, -9.5, 28, 3.2);
    ctx.fillRect(-17, 6.3, 28, 3.2);
    ctx.strokeRect(-17, 6.3, 28, 3.2);
    ctx.fillRect(-17, -10, 3.5, 20);
    ctx.strokeRect(-17, -10, 3.5, 20);
    if (m !== 'f82') {
      ctx.beginPath();
      ctx.ellipse(3, 0, 10, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (isJet) {
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-5, -18);
    ctx.lineTo(-11, -18);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-11, 18);
    ctx.lineTo(-5, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-18, -9);
    ctx.lineTo(-21, -9);
    ctx.lineTo(-17, 0);
    ctx.lineTo(-21, 9);
    ctx.lineTo(-18, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(10, -3);
    ctx.lineTo(-18, -3.5);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-18, 3.5);
    ctx.lineTo(10, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(8, 0, 4.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF9100';
    ctx.fillRect(-22, -1.6, 2.5, 3.2);
  } else {
    // Classic WWII / Korean Prop Fighter, Gull-Wing F4U, Elliptical Spitfire, Dive/Torpedo Bomber
    const isTorp = m.includes('tbf') || m.includes('tbd') || m.includes('torpedo') || m.includes('af2');
    const isGull = m === 'f4u' || m === 'f4u4';
    ctx.fillStyle = bodyFill;
    ctx.strokeStyle = primaryStroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (isGull) {
      ctx.moveTo(5, -19);
      ctx.lineTo(8, -7);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 7);
      ctx.lineTo(5, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-3, -19);
    } else {
      ctx.moveTo(5, -19);
      ctx.lineTo(7, 0);
      ctx.lineTo(5, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-3, -19);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(1, 0, 16, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(-1, 0, 3.4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(18, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    if (isTorp) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(-4, -1.2, 10, 2.4);
    }
  }

  // Wingtip navigation lights
  ctx.fillStyle = '#FF5252';
  ctx.fillRect(-8, -19.5, 2, 1.5);
  ctx.fillStyle = '#00E676';
  ctx.fillRect(-8, 18, 2, 1.5);

  if (payloadType) {
    if (payloadType.includes('nuke')) {
      ctx.fillStyle = '#FFAB00';
      ctx.beginPath();
      ctx.arc(24, -12, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1A0B0E';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☢', 24, -12);
    } else if (payloadType === 'rgm84_harpoon' || payloadType === 'aim54_phoenix' || payloadType === 'agm88_harm') {
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, -11);
      ctx.lineTo(7, -11);
      ctx.moveTo(-1, 11);
      ctx.lineTo(7, 11);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawGroundPreview(ctx: CanvasRenderingContext2D, w: number, h: number, rawKey: string) {
  const t = normalizeKey(rawKey);
  const cx = w * 0.52;
  const cy = h * 0.54;
  const scale = Math.min(w / 46, h / 28);

  drawGroundSilhouetteAt(ctx, t, cx, cy, scale);

  // The unit's APP-6 symbol in the corner, exactly as it appears on the battlefield
  const fn = app6Function(t);
  ctx.save();
  ctx.translate(15, 16);
  ctx.scale(0.72, 0.72);
  drawApp6(ctx, { affiliation: 'friend', fn, echelon: 'platoon', mobility: app6Mobility(t, fn) });
  ctx.restore();
}

function drawGroundSilhouetteAt(
  ctx: CanvasRenderingContext2D,
  unitType: string,
  cx: number,
  cy: number,
  scale: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  drawGroundSilhouette(ctx, unitType, true, scale);
  ctx.restore();
}

function drawInstallationPreview(ctx: CanvasRenderingContext2D, w: number, h: number, rawKey: string) {
  const k = normalizeKey(rawKey);
  const cx = w * 0.5;
  const cy = h * 0.54;
  const scale = Math.min(w / 82, h / 42);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Subtle ground pad drop shadow
  ctx.fillStyle = 'rgba(2, 6, 12, 0.5)';
  ctx.beginPath();
  ctx.ellipse(1.5, 3, 24, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  if (k.includes('s300')) {
    // 4-tube Vertical Launch System (VLS) cluster on concrete apron
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-16, -12, 32, 24);
    ctx.strokeRect(-16, -12, 32, 24);
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FF5252';
    for (const [vx, vy] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) {
      ctx.beginPath();
      ctx.arc(vx, vy, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (k.includes('patriot') || k.includes('hawk') || k.includes('sam')) {
    const isPatriot = k.includes('patriot');
    ctx.fillStyle = '#182C3E';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const count = isPatriot ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const ang = -0.7 + i * 0.45;
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = isPatriot ? 2.6 : 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 3, 2 + Math.sin(ang) * 3);
      ctx.lineTo(Math.cos(ang) * 16, 2 + Math.sin(ang) * 16);
      ctx.stroke();
      ctx.fillStyle = isPatriot ? '#00E5FF' : '#FF5252';
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 16, 2 + Math.sin(ang) * 16, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (k.includes('harpoon') || k.includes('rubezh') || k.includes('glcm') || k.includes('scud_site')) {
    // Revetment earth berm + concrete launcher pad + missile canisters
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#78909C';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-18, -11, 36, 22);
    ctx.strokeRect(-18, -11, 36, 22);
    ctx.fillStyle = '#455A64';
    ctx.strokeStyle = k.includes('rubezh') || k.includes('scud') ? '#FF5252' : '#4FC3F7';
    ctx.fillRect(-12, -7, 24, 5);
    ctx.strokeRect(-12, -7, 24, 5);
    ctx.fillRect(-12, 2, 24, 5);
    ctx.strokeRect(-12, 2, 24, 5);
    ctx.fillStyle = '#FFAB00';
    ctx.fillRect(10, -6.5, 3, 4);
    ctx.fillRect(10, 2.5, 3, 4);
  } else if (k.includes('heavy_aa') || k.includes('flak')) {
    ctx.fillStyle = '#182C3E';
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(15, -7);
    ctx.moveTo(0, 4);
    ctx.lineTo(15, -3);
    ctx.stroke();
  } else if (k.includes('240') || k.includes('coastal_gun')) {
    const is240 = k.includes('240');
    ctx.fillStyle = '#1A344D';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-6, 1, is240 ? 12 : 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = is240 ? 3.2 : 2.2;
    ctx.beginPath();
    ctx.moveTo(-4, 1);
    ctx.lineTo(25, 1);
    if (!is240) {
      ctx.moveTo(-4, -3);
      ctx.lineTo(19, -3);
    }
    ctx.stroke();
  } else if (k.includes('airfield')) {
    ctx.fillStyle = '#152536';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-32, -8, 64, 16);
    ctx.strokeRect(-32, -8, 64, 16);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#80DEEA';
    ctx.fillRect(6, 9, 12, 7);
    ctx.strokeRect(6, 9, 12, 7);
    ctx.fillRect(-20, -14, 11, 5.5);
    ctx.strokeRect(-20, -14, 11, 5.5);
  } else if (k.includes('radar')) {
    ctx.fillStyle = '#122638';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.moveTo(0, 0);
    ctx.lineTo(14, -6);
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 6);
    ctx.stroke();
  } else if (k.includes('dockyard') || k.includes('major_naval_port') || k.includes('pontoon_pier')) {
    const isPort = k.includes('major_naval_port');
    const isPier = k.includes('pontoon_pier');
    if (isPier) {
      ctx.fillStyle = 'rgba(2, 136, 209, 0.5)';
      ctx.strokeStyle = '#4FC3F7';
      ctx.fillRect(-26, -6, 52, 12);
      ctx.strokeRect(-26, -6, 52, 12);
      ctx.strokeStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(22, -10);
      ctx.stroke();
    } else if (isPort) {
      ctx.fillStyle = 'rgba(0, 151, 167, 0.55)';
      ctx.strokeStyle = '#00E5FF';
      ctx.fillRect(-30, -9, 60, 18);
      ctx.strokeRect(-30, -9, 60, 18);
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-14, -9);
      ctx.lineTo(-14, -15);
      ctx.lineTo(14, -15);
      ctx.lineTo(14, -9);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#182C3E';
      ctx.strokeStyle = '#42A5F5';
      ctx.fillRect(-16, -12, 7, 26);
      ctx.strokeRect(-16, -12, 7, 26);
      ctx.fillRect(9, -12, 7, 26);
      ctx.strokeRect(9, -12, 7, 26);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.fillRect(-9, -12, 18, 26);
      ctx.strokeStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(2, -8);
      ctx.stroke();
    }
  } else if (k.includes('hospital')) {
    ctx.fillStyle = '#ECEFF1';
    ctx.strokeStyle = '#EF5350';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-16, -10, 32, 20);
    ctx.strokeRect(-16, -10, 32, 20);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(-2.5, -7, 5, 14);
    ctx.fillRect(-7, -2.5, 14, 5);
  } else if (k.includes('supply') || k.includes('ammo')) {
    ctx.fillStyle = '#2B2219';
    ctx.strokeStyle = '#FFA726';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-18, -10, 36, 20);
    ctx.strokeRect(-18, -10, 36, 20);
    ctx.fillStyle = '#558B2F';
    ctx.strokeStyle = '#FFE082';
    ctx.fillRect(-12, -5, 10, 10);
    ctx.strokeRect(-12, -5, 10, 10);
    ctx.fillRect(2, -5, 10, 10);
    ctx.strokeRect(2, -5, 10, 10);
  } else {
    const isFob = k.includes('fob');
    ctx.fillStyle = '#152C44';
    ctx.strokeStyle = isFob ? '#00E676' : '#4FC3F7';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-18, -11, 36, 22);
    ctx.strokeRect(-18, -11, 36, 22);
    if (isFob) {
      ctx.strokeStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(-7, 0, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', -7, 0.5);
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(4, -7, 10, 14);
    } else {
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(-10, -2, 20, 4);
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(-14, -11);
      ctx.lineTo(-14, -17);
      ctx.stroke();
      ctx.fillStyle = '#4FC3F7';
      ctx.fillRect(-14, -17, 7, 4);
    }
  }

  ctx.restore();
}

export function drawUnitPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: UnitPreviewKind,
  unitKey: string,
  options: UnitPreviewOptions = {}
): void {
  const k = unitKey.toLowerCase();
  const isNuclear =
    k.includes('nuclear') ||
    k.includes('ohio_ssbn') ||
    Boolean(options.payloadType && options.payloadType.includes('nuke'));

  if (!options.compact) {
    drawBlueprintBackdrop(ctx, width, height, kind, isNuclear);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  if (kind === 'ship') {
    const icon = options.era ? shipIcon(unitKey, options.era) : null;
    if (icon) drawFittedIcon(ctx, width, height, icon, 0.94, 0.8);
    else drawShipPreview(ctx, width, height, unitKey);
  } else if (kind === 'aircraft') {
    drawAircraftPreview(ctx, width, height, unitKey, options.payloadType);
  } else if (kind === 'ground') {
    drawGroundPreview(ctx, width, height, unitKey);
  } else {
    drawInstallationPreview(ctx, width, height, unitKey);
  }
}
