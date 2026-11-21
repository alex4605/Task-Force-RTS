import { Era, Installation, Island, Vector2D } from '../types/game';
import { dist, isPointInPolygon, makeInstallation } from './procedural';

/**
 * Prisoner-of-war camps.
 *
 * Both sides keep their prisoners in a camp. Ours is built by 設施構工 and turns the prisoners it
 * holds into intelligence (interrogation: RP over time). The enemy has one camp behind its lines
 * where every airman or sailor of ours it picks up ends up; a ground force that takes the camp
 * frees them. Shooting at the enemy camp hits our own men, so it is a no-fire zone like a village.
 */

/** Prisoners one camp can hold (the rest are kept aboard ship and in the field, without interrogation). */
export const POW_CAMP_CAPACITY = 80;
/** Research points per prisoner per second while held in a camp. */
export const POW_RP_PER_SECOND = 0.03;
/** A friendly ground unit this close, with no enemy ground unit within LIBERATE_CLEAR, frees the camp. */
export const LIBERATE_RADIUS = 160;
export const LIBERATE_CLEAR = 280;

const ENEMY_CAMP_NAME: Record<Era, string> = {
  era1: '日軍戰俘收容所 (IJA POW Compound)',
  era2: '拉包爾日軍戰俘收容所 (Rabaul POW Compound)',
  era3: '北韓人民軍戰俘營 (KPA POW Camp)',
  era4: '北越戰俘營「河內希爾頓」分營 (Hỏa Lò Annex)',
  era5: '華約戰俘轉運營 (Warsaw Pact POW Transit Camp)',
};

export const PLAYER_CAMP_NAME: Record<Era, string> = {
  era1: '盟軍戰俘收容所 (Allied POW Stockade)',
  era2: '盟軍戰俘收容所 (Allied POW Stockade)',
  era3: '聯合國軍戰俘營 (UNC POW Camp)',
  era4: '美軍戰俘收容所 (US POW Camp)',
  era5: '北約戰俘收容所 (NATO POW Cage)',
};

function onLand(p: Vector2D, isl: Island): boolean {
  if (!isPointInPolygon(p, isl.points)) return false;
  return !(isl.lagoons ?? []).some((l) => isPointInPolygon(p, l.points));
}

/**
 * The enemy camp: on the island (or stretch of mainland) with the most enemy positions, a little
 * behind them (away from the island's coast), clear of every other installation.
 */
export function addEnemyPowCamp(islands: Island[], era: Era): void {
  let best: Island | null = null;
  let bestN = 0;
  for (const isl of islands) {
    const n = isl.installations.filter((i) => i.side === 'enemy' && !i.isCivilian).length;
    if (n > bestN) {
      bestN = n;
      best = isl;
    }
  }
  if (!best) return;
  const enemy = best.installations.filter((i) => i.side === 'enemy' && !i.isCivilian);
  const cx = enemy.reduce((a, i) => a + i.pos.x, 0) / enemy.length;
  const cy = enemy.reduce((a, i) => a + i.pos.y, 0) / enemy.length;
  const ok = (p: Vector2D) =>
    onLand(p, best!) &&
    [0, 1, 2, 3, 4, 5].every((j) => onLand({ x: p.x + Math.cos(j) * 90, y: p.y + Math.sin(j) * 90 }, best!)) &&
    best!.installations.every((i) => dist(i.pos, p) > 260);
  let pos: Vector2D | null = null;
  for (let r = 0; r <= 1800 && !pos; r += 60) {
    for (let k = 0; k < 16 && !pos; k++) {
      const a = (k / 16) * Math.PI * 2 + r * 0.01;
      const p = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      if (ok(p)) pos = p;
    }
  }
  if (!pos) return;
  const camp: Installation = makeInstallation({
    id: `${best.id}-pow-camp`,
    type: 'pow_camp',
    name: ENEMY_CAMP_NAME[era],
    weaponDesc: '關押我方被俘人員 · 嚴禁實彈射擊 · 地面部隊進入營區即可解放',
    pos,
    health: 2400,
    armor: 0.3,
    side: 'enemy',
    civilianZoneRadius: 110,
    isCivilian: true,
    prisoners: 0,
  });
  best.installations.push(camp);
}
