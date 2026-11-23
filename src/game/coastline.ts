import { Era, Installation, Island, Vector2D } from '../types/game';
import { dist, isPointInPolygon, makeInstallation } from './procedural';

/**
 * Natural coastlines and island settlements.
 *
 * Generated islands are smooth polygons of a few dozen points; real coasts have bays, points
 * and coves at every scale. naturalizeCoast() subdivides the outline twice and pushes each new
 * midpoint in or out along the edge normal by a coherent multi-scale noise, so neighbouring
 * points agree (bays are bays, not zig-zags) and the result stays a simple polygon (offsets are
 * capped at a fraction of the edge length).
 */
function coastNoise(x: number, y: number, seed: number): number {
  return (
    Math.sin(x * 0.0041 + seed * 1.37) * 0.45 +
    Math.sin(y * 0.0057 - seed * 0.71) * 0.3 +
    Math.sin((x + y) * 0.019 + seed * 3.1) * 0.17 +
    Math.sin((x - y) * 0.047 + seed * 5.3) * 0.08
  );
}

export function naturalizeCoast(points: Vector2D[], seed: number, amp: number, passes = 2, keepEdge?: (p: Vector2D, q: Vector2D) => boolean): Vector2D[] {
  let pts = points;
  for (let pass = 0; pass < passes; pass++) {
    const n = pts.length;
    const out: Vector2D[] = [];
    const a = amp / Math.pow(pass + 1, 1.4);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      out.push(p);
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = keepEdge?.(p, q) ? 0 : Math.max(-0.3 * len, Math.min(0.3 * len, coastNoise(mx, my, seed + pass * 11) * a));
      out.push({ x: mx + (dy / len) * off, y: my - (dx / len) * off });
    }
    pts = out;
  }
  return pts;
}

/** Land of the island: inside the coastline and outside its lagoons. */
function onIslandLand(p: Vector2D, island: Island): boolean {
  if (!isPointInPolygon(p, island.points)) return false;
  return !(island.lagoons ?? []).some((l) => isPointInPolygon(p, l.points));
}

/** The nearest point on land along the bearing from the island centre (inwards first). */
export function snapOntoLand(island: Island, p: Vector2D): Vector2D {
  if (onIslandLand(p, island)) return p;
  const c = island.center;
  const r = Math.hypot(p.x - c.x, p.y - c.y) || 1;
  const ux = (p.x - c.x) / r;
  const uy = (p.y - c.y) / r;
  for (let k = 1; k <= 140; k++) {
    for (const sign of [-1, 1]) {
      const q = { x: p.x + ux * k * 15 * sign, y: p.y + uy * k * 15 * sign };
      if (onIslandLand(q, island)) {
        const q2 = { x: q.x + ux * 25 * sign, y: q.y + uy * 25 * sign };
        return onIslandLand(q2, island) ? q2 : q;
      }
    }
  }
  return p;
}

/**
 * Roughen every coastline, keeping positions on land. The mainland gets larger bays and points
 * along its sea coast; the edges where it runs along the map border are left straight.
 */
export function naturalizeIslands(islands: Island[], seed: number, skip: (isl: Island) => boolean, worldSize: number): void {
  const onBorder = (p: Vector2D) => p.x < 60 || p.y < 60 || p.x > worldSize - 60 || p.y > worldSize - 60;
  islands.forEach((isl, k) => {
    if (skip(isl)) return;
    isl.points = isl.isMainland
      ? naturalizeCoast(isl.points, seed + k * 97, 220, 3, (p, q) => onBorder(p) && onBorder(q))
      : naturalizeCoast(isl.points, seed + k * 97, Math.max(40, isl.radius * 0.07));
  });
  for (const isl of islands) {
    for (const inst of isl.installations) inst.pos = snapOntoLand(isl, inst.pos);
    for (const sh of isl.strongholds ?? []) sh.cpPos = snapOntoLand(isl, sh.cpPos);
  }
}

// ── Settlements ──────────────────────────────────────────────────────────

/** Village names by theatre: the Solomons; Saipan, Okinawa and the Keramas; Wonsan harbour; Vietnam's coastal islands; the German Bight. */
const VILLAGE_NAMES: Record<Era, string[]> = {
  era1: ['科孔布納土著村落 (Kokumbona)', '塔薩法隆加村 (Tassafaronga)', '馬塔尼考村 (Matanikau)', '科利角漁村 (Koli Point)', '馬拉瑙傳教站 (Marau Mission)', '奧拉椰子種植園 (Aola)', '維薩萊傳教站 (Visale)', '泰納魯村 (Tenaru)', '塔辛博科村 (Tasimboko)', '倫加村落 (Lunga)', '加武圖漁村 (Gavutu)', '魯阿瓦圖傳教站 (Ruavatu)'],
  era2: ['加拉班町 (Garapan)', '查蘭卡諾亞村 (Chalan Kanoa)', '那霸港町 (Naha)', '首里城下町 (Shuri)', '座間味村 (Zamami)', '讀谷村 (Yomitan)', '糸滿漁港 (Itoman)', '名護町 (Nago)', '渡嘉敷村 (Tokashiki)', '北谷村 (Chatan)'],
  // Wonsan harbour islands held by the UN through the siege of Wonsan (1951-53)
  era3: ['熊島村落 (Ung-do)', '黃土島漁村 (Hwangto-do)', '麗島漁村 (Yo-do)', '薪島漁村 (Sin-do)'],
  // Cu Lao Cham off Hoi An, and Con Co off the DMZ
  era4: ['占婆島 Bãi Làng 漁村', '占婆島 Bãi Hương 漁村', 'Cồn Cỏ 島 漁民村', 'Cồn Cỏ 島 燈塔哨村'],
  // Helgoland and Sylt in the German Bight
  era5: ['黑爾戈蘭 下城漁港 (Unterland)', '黑爾戈蘭 上城 (Oberland)', '敘爾特 韋斯特蘭 (Westerland)', '敘爾特 利斯特漁港 (List)'],
};

/** On the Cold War maps each offshore island has its own pair of villages (see placeNames.ts). */
const ISLAND_VILLAGE_SLOTS: Record<string, [number, number]> = { 'island-wonsan': [0, 2], 'island-chodo': [2, 4] };

/** Thatched-hut villages in the tropics, tight fishing villages elsewhere. */
export const isThatchedEra = (era: Era) => era === 'era1' || era === 'era2' || era === 'era4';

/**
 * Small civilian settlements on the islands: one or two per island, on good ground a little in
 * from the coast (villages sit by the beach and their canoes), clear of every military position.
 * They are ordinary civilian installations, so the town layer draws them and hitting them costs
 * political support.
 */
export function addIslandSettlements(islands: Island[], era: Era, seed: number): void {
  const all = [...VILLAGE_NAMES[era]];
  let names = all;
  let rnd = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  for (const isl of islands) {
    if (isl.isMainland) continue;
    const slot = ISLAND_VILLAGE_SLOTS[isl.id];
    if (era === 'era3' || era === 'era4' || era === 'era5') {
      if (!slot) continue;
      names = all.slice(slot[0], slot[1]);
    }
    if (names.length === 0) continue;
    // The Pacific islands were well peopled (Guadalcanal ~15,000, Okinawa ~450,000): two or three villages each
    const pacific = era === 'era1' || era === 'era2';
    const want = isl.radius > 1000 ? (pacific ? (rand() < 0.5 ? 3 : 2) : rand() < 0.6 ? 2 : 1) : rand() < 0.75 ? 1 : 0;
    const military: Vector2D[] = [...isl.installations.map((i) => i.pos), ...(isl.strongholds ?? []).map((s) => s.cpPos)];
    const placed: Vector2D[] = [];
    const n = isl.points.length;
    const start = Math.floor(rand() * n);
    for (let k = 0; k < n && placed.length < want; k += Math.max(1, Math.floor(n / 28))) {
      const coast = isl.points[(start + k) % n];
      const dx = isl.center.x - coast.x;
      const dy = isl.center.y - coast.y;
      const len = Math.hypot(dx, dy) || 1;
      const inset = 130 + rand() * 80;
      const p = { x: coast.x + (dx / len) * inset, y: coast.y + (dy / len) * inset };
      if (!onIslandLand(p, isl)) continue;
      // Room for the huts all round
      if (![0, 1, 2, 3, 4, 5].every((j) => onIslandLand({ x: p.x + Math.cos(j) * 80, y: p.y + Math.sin(j) * 80 }, isl))) continue;
      if (military.some((m) => dist(m, p) < 380) || placed.some((m) => dist(m, p) < 700)) continue;
      if (names.length === 0) break;
      placed.push(p);
      const name = names.splice(Math.floor(rand() * names.length), 1)[0];
      const village: Installation = makeInstallation({
        id: `${isl.id}-village-${placed.length}`,
        type: 'settlement',
        name,
        weaponDesc: '平民聚落 · 嚴禁實彈射擊 · 誤擊扣除政治值',
        pos: p,
        health: 1200,
        armor: 0.2,
        side: 'neutral',
        civilianZoneRadius: 85 + Math.round(rand() * 40),
        isCivilian: true,
      });
      isl.installations.push(village);
    }
  }
}

/**
 * Villages of the mainland front, by theatre: the farming villages of the Hamhung plain behind
 * Wonsan (1950); the hamlets of Quang Tri province below the DMZ, fought through from 1967 to
 * 1972; and the villages and market towns of Schleswig-Holstein and Lower Saxony that every NATO
 * war plan put in the line. Each sits on open ground clear of the military positions.
 */
const MAINLAND_VILLAGES: Partial<Record<Era, { name: string; type: 'settlement' | 'town' }[]>> = {
  era3: [
    { name: '洪原郡 農村 (Hongwon)', type: 'settlement' },
    { name: '定平郡 農村 (Chongpyong)', type: 'settlement' },
    { name: '五老里 (Oro-ri)', type: 'settlement' },
    { name: '新興邑 (Sinhung)', type: 'town' },
  ],
  era4: [
    { name: 'Gio Linh 由靈村', type: 'settlement' },
    { name: 'Cam Lộ 甘露村', type: 'settlement' },
    { name: 'Đại Độ 大渡村', type: 'settlement' },
    { name: 'Triệu Phong 肇豐縣城', type: 'town' },
  ],
  era5: [
    { name: 'Tarp 塔普村', type: 'settlement' },
    { name: 'Hohn 霍恩村', type: 'settlement' },
    { name: 'Lütjenburg 呂延堡村', type: 'settlement' },
    { name: 'Eckernförde 埃肯弗德鎮', type: 'town' },
  ],
};

export function addMainlandVillages(islands: Island[], era: Era, seed: number): void {
  const list = MAINLAND_VILLAGES[era];
  const land = islands.find((i) => i.isMainland);
  if (!list || !land) return;
  let rnd = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const q of land.points) {
    minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y);
  }
  const taken = () => [...islands.flatMap((i) => i.installations.map((x) => x.pos)), ...islands.flatMap((i) => (i.strongholds ?? []).map((s) => s.cpPos))];
  let placedN = 0;
  for (const v of list) {
    for (let tries = 0; tries < 300; tries++) {
      const p = { x: minX + 600 + rand() * (maxX - minX - 1200), y: minY + 600 + rand() * (maxY - minY - 1200) };
      if (!onIslandLand(p, land)) continue;
      if (![0, 1, 2, 3, 4, 5].every((j) => onIslandLand({ x: p.x + Math.cos(j) * 140, y: p.y + Math.sin(j) * 140 }, land))) continue;
      if (taken().some((m) => dist(m, p) < 520)) continue;
      placedN++;
      land.installations.push(
        makeInstallation({
          id: `${land.id}-hamlet-${placedN}`,
          type: v.type,
          name: v.name,
          weaponDesc: '平民聚落 · 嚴禁實彈射擊 · 誤擊扣除政治值',
          pos: p,
          health: v.type === 'town' ? 3000 : 1200,
          armor: 0.2,
          side: 'neutral',
          civilianZoneRadius: v.type === 'town' ? 150 + Math.round(rand() * 30) : 90 + Math.round(rand() * 30),
          isCivilian: true,
        })
      );
      break;
    }
  }
}
