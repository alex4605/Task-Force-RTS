import { Era, Projectile } from '../types/game';

/**
 * Impact effects: one record per detonation, animated procedurally by the renderer, so a
 * 16-inch salvo, a 500 lb bomb, a rocket and a burst of tracer each look like what they are
 * without spawning dozens of particles per hit.
 */
export type ImpactKind =
  | 'bullet' // tracer strike: water spray or dust kicks
  | 'shell_light' // up to ~6"
  | 'shell_heavy' // 8" to 18"
  | 'rocket' // HVAR / FFAR / MLRS warhead
  | 'bomb' // general-purpose bomb, sized by weight
  | 'missile' // anti-ship / cruise / ballistic warhead
  | 'torpedo' // torpedo hit against a hull
  | 'depth_charge' // underwater burst: dome then plume
  | 'hedgehog' // contact-fuzed spigot bomb
  | 'cluster'; // bomblet ripple

export type ImpactSurface = 'sea' | 'land' | 'ship';

export interface ImpactEffect {
  kind: ImpactKind;
  surface: ImpactSurface;
  x: number;
  y: number;
  /** Seconds since detonation and total duration (craters outlast the blast). */
  age: number;
  life: number;
  /** Characteristic size in world units (column height / fireball radius scale). */
  size: number;
  /** Deterministic randomness for the debris pattern. */
  seed: number;
  /** Splash colour from dye-loaded AP shells (WWII battleships identified their fall of shot by colour). */
  dye?: string;
  heading: number;
}

const DYES = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'];

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Bomb weight (lb) from the payload type, for sizing the burst. */
function bombWeight(p: Projectile): number {
  const t = p.bombType ?? '';
  if (/2000/.test(t)) return 2000;
  if (/1600/.test(t)) return 1600;
  if (/1000|gbu10/.test(t)) return 1000;
  if (/250|carpet/.test(t)) return 250;
  return 500;
}

/** Classify a detonation into an impact effect, or null when nothing should be drawn. */
export function impactFor(p: Projectile, surface: ImpactSurface, era: Era): ImpactEffect | null {
  let kind: ImpactKind;
  let size: number;
  let life: number;
  let dye: string | undefined;
  switch (p.type) {
    case 'bullet':
      kind = 'bullet';
      size = 4;
      life = 0.5;
      break;
    case 'shell': {
      const heavy = p.blastRadius > 25;
      kind = heavy ? 'shell_heavy' : 'shell_light';
      size = heavy ? 34 + Math.min(20, p.damage / 25) : 14 + Math.min(8, p.damage / 20);
      life = heavy ? 2.6 : 1.4;
      // Battleship AP shells carried a dye load per ship in WWII (era 1–2), colouring the splash
      if (heavy && surface === 'sea' && (era === 'era1' || era === 'era2')) dye = DYES[hashName(p.attackerName ?? p.id) % DYES.length];
      break;
    }
    case 'rocket':
      if (p.isClusterSubmunition) {
        kind = 'cluster';
        size = 40;
        life = 1.6;
      } else {
        kind = 'rocket';
        size = p.isTinyTim ? 26 : p.isMLRS ? 22 : 13;
        life = 1.2;
      }
      break;
    case 'bomb':
      if (p.bombType === 'cbu_cluster_bombs' || p.warhead === 'cluster') {
        kind = 'cluster';
        size = 46;
        life = 1.8;
      } else {
        kind = 'bomb';
        const w = bombWeight(p);
        size = 18 + Math.sqrt(w) * 0.9;
        life = 2.4;
      }
      break;
    case 'missile_ashm':
    case 'missile_cruise':
    case 'missile_ssm':
    case 'missile_arm':
      kind = 'missile';
      size = 30 + Math.min(30, p.damage / 30);
      life = 2.6;
      break;
    case 'torpedo':
      if (surface !== 'ship') return null; // a miss runs out and sinks
      kind = 'torpedo';
      size = 46;
      life = 2.4;
      break;
    case 'depth_charge':
      kind = 'depth_charge';
      size = 40;
      life = 2.8;
      surface = 'sea';
      break;
    case 'hedgehog':
      kind = 'hedgehog';
      size = 12;
      life = 1.2;
      break;
    default:
      return null; // AAM / SAM airbursts are drawn as flak by the existing particles
  }
  // Craters stay on the ground long after the smoke has cleared
  if (surface === 'land' && (kind === 'bomb' || kind === 'shell_heavy' || kind === 'missile')) life = 24;
  return { kind, surface, x: p.pos.x, y: p.pos.y, age: 0, life, size, seed: hashName(p.id) % 997, dye, heading: p.heading };
}

/** Keep the effect list bounded: the oldest short-lived effects go first under heavy fire. */
export const MAX_IMPACTS = 420;
