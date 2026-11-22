import { Era, FieldWork, FieldWorkKind, Island, ShipSide, Vector2D } from '../types/game';
import { dist, isPointInPolygon } from './procedural';

/**
 * 防禦構工 — field defences dug and laid by the troops on the spot:
 *  · 阻絕施設 obstacle belt: wire, stakes, hedgehogs, dragon's teeth. Slows whoever crosses it;
 *    tanks flatten wire slowly, engineers (and bombs) breach it.
 *  · 壕溝 trench: fire and communication trench; friendly infantry in it get hard cover.
 *  · 陷阱 trap: trip-wire booby trap or punji pit, one shot against foot troops.
 *  · 雷區 minefield: anti-personnel and anti-tank mines; each unit crossing may set one off.
 *    Engineers sweep them; enemy minefields stay hidden until found.
 * The 散兵坑 foxhole is not a work: any infantry unit digs one where it stands (see engine).
 */

export const FIELD_WORK_TAGS: readonly FieldWorkKind[] = ['obstacle', 'trench', 'trap', 'minefield'];

export function isFieldWorkTag(tag: string | undefined): tag is FieldWorkKind {
  return FIELD_WORK_TAGS.includes(tag as FieldWorkKind);
}

/** Half extents of each work along / across its axis (world units ≈ metres). */
export const FIELD_WORK_SIZE: Record<FieldWorkKind, { hx: number; hy: number }> = {
  obstacle: { hx: 85, hy: 11 },
  trench: { hx: 70, hy: 10 },
  trap: { hx: 16, hy: 16 },
  minefield: { hx: 75, hy: 45 },
};

export const FIELD_WORK_HEALTH: Record<FieldWorkKind, number> = {
  obstacle: 900,
  trench: 1600,
  trap: 60,
  minefield: 1,
};

export const MINEFIELD_CHARGES = 14;

/** Seconds for an infantry unit to scrape a foxhole and sandbag its lip. */
export const FOXHOLE_DIG_S = 8;

/** Whether `p` lies on the work's footprint, grown by `pad`. */
export function insideFieldWork(w: FieldWork, p: Vector2D, pad = 0): boolean {
  const { hx, hy } = FIELD_WORK_SIZE[w.kind];
  const dx = p.x - w.pos.x;
  const dy = p.y - w.pos.y;
  if (Math.abs(dx) > hx + hy + pad && Math.abs(dy) > hx + hy + pad) return false;
  const c = Math.cos(-w.angle);
  const s = Math.sin(-w.angle);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= hx + pad && Math.abs(ly) <= hy + pad;
}

/** Distance from which troops notice an enemy work (concealed works must be walked up to). */
export const SPOT_RANGE: Record<FieldWorkKind, number> = {
  obstacle: 420,
  trench: 360,
  trap: 45,
  minefield: 110,
};

const early = (era: Era) => era === 'era1' || era === 'era2';

/** What each side actually dug and laid in each era. */
export function fieldWorkName(kind: FieldWorkKind, era: Era, side: ShipSide): string {
  const enemy = side === 'enemy';
  switch (kind) {
    case 'obstacle':
      if (enemy)
        return early(era)
          ? '日軍鐵絲網與竹柵阻絕帶'
          : era === 'era3'
          ? '共軍鐵絲網與鹿砦阻絕帶'
          : era === 'era4'
          ? 'NVA 竹柵與鐵絲網阻絕帶'
          : '華約反戰車刺蝟與龍齒阻絕帶';
      return era === 'era1'
        ? '有刺鐵絲網與木樁阻絕帶'
        : era === 'era2'
        ? '蛇腹鐵絲網與反戰車鋼刺 (Hedgehog)'
        : era === 'era3'
        ? '蛇腹鐵絲網與反戰車壕障'
        : era === 'era4'
        ? '火力基地周界蛇腹鐵絲網 (Concertina)'
        : '反戰車龍齒與三層蛇腹鐵絲網';
    case 'trench':
      if (enemy)
        return early(era)
          ? '日軍蛸壺壕與交通壕'
          : era === 'era3'
          ? '共軍山脊坑道交通壕'
          : era === 'era4'
          ? 'NVA 射擊壕與地道入口'
          : '華約連戰鬥陣地射擊壕';
      return early(era)
        ? '射擊壕與交通壕 (沙包胸牆)'
        : era === 'era3'
        ? '山脊連陣地交通壕'
        : era === 'era4'
        ? '火力基地周界射擊壕 (沙包掩蓋)'
        : 'NATO 強化戰鬥陣地 (覆蓋射擊壕)';
    case 'trap':
      if (enemy)
        return early(era)
          ? '日軍拌線詭雷'
          : era === 'era3'
          ? '共軍拌線手榴彈詭雷'
          : era === 'era4'
          ? 'NVA 竹籤陷阱坑 (Punji Pit)'
          : 'OZM-72 跳雷拌線陷阱';
      return early(era)
        ? 'Mk 2 手榴彈拌線詭雷'
        : era === 'era3'
        ? '拌線照明彈與手榴彈詭雷'
        : 'M18A1 闊刀定向雷 (拌線)';
    case 'minefield':
      if (enemy)
        return early(era)
          ? '日軍九三式戰車地雷雷區'
          : era === 'era3'
          ? '共軍木殼反人員雷區 (PMD-6)'
          : era === 'era4'
          ? 'NVA 反人員與反車輛雷區'
          : '華約 TM-62 反戰車 / PMN 反人員雷區';
      return early(era)
        ? 'M1 反戰車雷 + M2 跳雷雷區'
        : era === 'era3'
        ? 'M6 反戰車雷 + M16 跳雷雷區'
        : era === 'era4'
        ? 'M16 跳雷 / M14 反人員周界雷區'
        : 'M15 反戰車雷 + M16 反人員雷區';
  }
}

export const FIELD_WORK_DESC: Record<FieldWorkKind, string> = {
  obstacle: '阻絕施設 · 敵軍地面部隊穿越時大幅減速 (徒步 -55% / 車輛 -70%) · 戰車碾壓與工兵爆破可開闢通路',
  trench: '壕溝 · 我方步兵在壕內享掩體防護 (空襲減傷 70% / 直射掩護 50%)',
  trap: '陷阱 · 一次性詭雷，敵步兵觸發即遭殺傷並被壓制',
  minefield: '雷區 · 敵軍穿越時每段時間有機率觸雷 (反戰車 / 反人員)，工兵可排雷 · 敵方雷區在被發現前不可見',
};

export function makeFieldWork(kind: FieldWorkKind, era: Era, side: ShipSide, pos: Vector2D, angle: number, id: string, built = false): FieldWork {
  const hp = FIELD_WORK_HEALTH[kind];
  return {
    id,
    kind,
    side,
    era,
    name: fieldWorkName(kind, era, side),
    pos: { x: pos.x, y: pos.y },
    angle,
    health: hp,
    maxHealth: hp,
    progress: built ? 1 : 0,
    builders: 0,
    mines: kind === 'minefield' ? MINEFIELD_CHARGES : kind === 'trap' ? 1 : undefined,
    maxMines: kind === 'minefield' ? MINEFIELD_CHARGES : kind === 'trap' ? 1 : undefined,
  };
}

/**
 * The defender's field works laid out in front of its strongholds: a wire belt and a minefield
 * across the approach from the coast, trenches round the position and a few traps on the paths.
 * Footprints must lie on the island's land.
 */
export function placeEnemyFieldWorks(islands: Island[], era: Era): FieldWork[] {
  const out: FieldWork[] = [];
  let n = 0;
  const onLand = (isl: Island, w: FieldWork) => {
    const { hx, hy } = FIELD_WORK_SIZE[w.kind];
    const c = Math.cos(w.angle);
    const s = Math.sin(w.angle);
    return [
      [0, 0],
      [hx, hy],
      [-hx, hy],
      [hx, -hy],
      [-hx, -hy],
    ].every(([x, y]) => isPointInPolygon({ x: w.pos.x + x * c - y * s, y: w.pos.y + x * s + y * c }, isl.points));
  };
  const clear = (w: FieldWork, isl: Island) =>
    out.every((o) => dist(o.pos, w.pos) > 150) &&
    isl.installations.every((i) => i.isCivilian || dist(i.pos, w.pos) > 70);
  for (const isl of islands) {
    if (isl.isFriendlyBase) continue;
    const holds = (isl.strongholds ?? []).slice(0, 4);
    for (const sh of holds) {
      // Approach: from the stronghold towards the nearest coast (the island's rim)
      const a0 = Math.atan2(sh.cpPos.y - isl.center.y, sh.cpPos.x - isl.center.x);
      const plan: { kind: FieldWorkKind; d: number; da: number }[] = [
        { kind: 'trench', d: 120, da: 0 },
        { kind: 'obstacle', d: 250, da: 0 },
        { kind: 'minefield', d: 380, da: 0.15 },
        { kind: 'trap', d: 200, da: 0.9 },
        { kind: 'trap', d: 210, da: -0.9 },
      ];
      for (const p of plan) {
        // Closer in, or swung round, when the approach runs out of land
        search: for (const f of [1, 0.75, 0.55, 0.4]) {
          for (const swing of [0, 0.5, -0.5, 1, -1]) {
            const a = a0 + p.da + swing;
            const pos = { x: sh.cpPos.x + Math.cos(a) * p.d * f, y: sh.cpPos.y + Math.sin(a) * p.d * f };
            const w = makeFieldWork(p.kind, era, 'enemy', pos, a + Math.PI / 2, `fw-enemy-${n}`, true);
            if (onLand(isl, w) && clear(w, isl)) {
              out.push(w);
              n++;
              break search;
            }
          }
        }
      }
    }
  }
  return out;
}
