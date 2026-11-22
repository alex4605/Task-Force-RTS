import { Era, InstallationType, Island, Vector2D } from '../types/game';
import { dist, isPointInPolygon, makeInstallation } from './procedural';
import { TERRAIN, TerrainMap } from './terrain/terrainMap';
import { placeNameByLatitude } from './placeNames';

/**
 * Civilian transport the armies fought over: railway stations on the mainland lines and the
 * region's civilian airport. They start neutral; whichever side's ground troops hold the ground
 * around one takes it over (see the engine's civil-control tick). A held station feeds transport
 * capacity (TP) into the war; a held airport becomes a working airfield for that side.
 */

const STATION_NAMES: Partial<Record<Era, string[]>> = {
  era3: ['(原)京義線 開城驛', '(原)京元線 鐵原驛', '(原)京釜線 水原驛', '(原)咸鏡線 元山驛'],
  era4: ['(原)統一鐵路 東河站', '(原)統一鐵路 順化站', '(原)河內—海防線 海陽站', '(原)統一鐵路 峴港站'],
  era5: ['(原)DB 漢諾威北站', '(原)DB 不來梅貨運站', '(原)DB 呂訥堡站', '(原)DB 策勒站'],
};

const AIRPORT_NAME: Partial<Record<Era, string>> = {
  era3: '(原)金浦民用機場 (Kimpo)',
  era4: '(原)新山一民用機場 (Tân Sơn Nhất)',
  era5: '(原)漢諾威-朗根哈根機場 (Hannover-Langenhagen)',
};

/** Clear of military positions (the town a station serves is of course right there). */
function freeOf(island: Island, p: Vector2D, r: number): boolean {
  return island.installations.every((i) => i.isCivilian || dist(i.pos, p) > r);
}

const dryLand = (map: TerrainMap, p: Vector2D) => {
  const t = map.at(p.x, p.y);
  return t !== TERRAIN.water && t !== TERRAIN.lagoon && t !== TERRAIN.lake && t !== TERRAIN.river && t !== TERRAIN.marsh;
};

export function addCivilTransport(islands: Island[], map: TerrainMap, era: Era): void {
  const mainland = islands.find((i) => i.isMainland);
  if (!mainland) return;

  // Stations: where a railway passes closest to a town, a little off the track
  const names = [...(STATION_NAMES[era] ?? [])];
  const rails = map.roads.filter((r) => r.kind === 'rail');
  const towns = map.districts.filter((d) => d.kind === 'city' || d.kind === 'town');
  const usedNames = new Set<string>();
  let n = 0;
  for (const town of towns) {
    if (names.length === 0 || n >= 3) break;
    let best: { p: Vector2D; a: number; d: number } | null = null;
    for (const rail of rails) {
      for (let k = 1; k < rail.points.length; k++) {
        const p = rail.points[k];
        const d = dist(p, town.center);
        if (d < town.radius + 500 && (!best || d < best.d)) {
          const q = rail.points[k - 1];
          best = { p, a: Math.atan2(p.y - q.y, p.x - q.x), d };
        }
      }
    }
    if (!best) continue;
    const pos = { x: best.p.x + Math.cos(best.a + Math.PI / 2) * 22, y: best.p.y + Math.sin(best.a + Math.PI / 2) * 22 };
    if (!dryLand(map, pos) || !freeOf(mainland, pos, 180)) continue;
    mainland.installations.push(
      makeInstallation({
        id: `civil-station-${n}`,
        type: 'rail_station',
        name: placeNameByLatitude(era, 'station', pos, usedNames) ?? names.shift()!,
        weaponDesc: '原民用鐵路車站 · 我方控制時鐵路縮短運補時程 · 提供時間值 TP · 由地面部隊進駐即可控制',
        pos,
        angle: best.a,
        health: 2600,
        armor: 0.35,
        side: 'neutral',
      })
    );
    n++;
  }

  // Airport: on open ground beside the biggest town, clear of the military positions
  const airportName = AIRPORT_NAME[era];
  if (!airportName) return;
  const city = [...towns].sort((a, b) => b.radius - a.radius)[0];
  if (!city) return;
  for (let r = city.radius + 350; r < city.radius + 1600; r += 120) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const p = { x: city.center.x + Math.cos(a) * r, y: city.center.y + Math.sin(a) * r };
      const ok =
        [-70, -35, 0, 35, 70].every((dx) => dryLand(map, { x: p.x + dx, y: p.y }) && dryLand(map, { x: p.x + dx, y: p.y + 30 })) &&
        freeOf(mainland, p, 420);
      if (!ok) continue;
      mainland.installations.push(
        makeInstallation({
          id: 'civil-airport',
          type: 'airfield',
          name: placeNameByLatitude(era, 'airport', p, new Set()) ?? airportName,
          weaponDesc: '原民用機場 · 由地面部隊進駐即可控制，我方控制後可作為航空站使用',
          pos: p,
          health: 4200,
          armor: 0.4,
          side: 'neutral',
          wasCivil: true,
        })
      );
      return;
    }
  }
}

/** Troops within this distance of a civilian hospital in their side's sphere are treated there. */
export const CIVIL_HOSPITAL_RADIUS = 520;

const HOSPITAL_NAMES: Record<Era, string[]> = {
  era1: ['(中立) 瑪利斯會教會醫院 (Marist Mission)', '(中立) 衛理公會教會醫院 (Methodist Mission)'],
  era2: ['(中立) 南洋廳立醫院', '(中立) 天主教會診療所'],
  era3: ['(中立) 塞弗蘭斯紀念醫院 (Severance)', '(中立) 道立病院'],
  era4: ['(中立) 順化中央醫院 (Huế Central)', '(中立) 省立醫院'],
  era5: ['(中立) 漢諾威醫學院附設醫院 (MHH)', '(中立) 市立綜合醫院 (Klinikum)'],
};

/**
 * Civilian hospitals in the biggest towns: mission hospitals on the Pacific islands, city and
 * provincial hospitals on the mainland. Neutral and protected; whichever side holds the
 * surrounding ground has its wounded treated there.
 */
export function addCivilHospitals(islands: Island[], map: TerrainMap, era: Era): void {
  const names = [...HOSPITAL_NAMES[era]];
  const towns = map.districts
    .filter((d) => d.kind === 'city' || d.kind === 'town' || d.kind === 'settlement' || d.kind === 'village')
    .sort((a, b) => b.radius - a.radius);
  const usedHospitals = new Set<string>();
  let n = 0;
  for (const town of towns) {
    if (names.length === 0) break;
    const isl = islands.find((i) => isPointInPolygon(town.center, i.points));
    if (!isl) continue;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.4;
      const r = Math.min(120, town.radius * 0.45);
      const pos = { x: town.center.x + Math.cos(a) * r, y: town.center.y + Math.sin(a) * r };
      if (!dryLand(map, pos) || !isPointInPolygon(pos, isl.points)) continue;
      if (isl.installations.some((i) => !i.isCivilian && dist(i.pos, pos) < 160)) continue;
      if (islands.some((il) => il.installations.some((i) => i.type === 'civil_hospital' && dist(i.pos, pos) < 1500))) continue;
      const fallback = names.shift()!;
      isl.installations.push(
        makeInstallation({
          id: `civil-hospital-${n++}`,
          type: 'civil_hospital',
          name: placeNameByLatitude(era, 'hospital', pos, usedHospitals) ?? fallback,
          weaponDesc: '中立民間醫院 · 受國際法保護 (攻擊將造成附帶損害) · 我方勢力範圍時救治 520m 內部隊並提供政治值 PP',
          pos,
          angle: a,
          health: 2200,
          armor: 0.3,
          side: 'neutral',
          isCivilian: true,
        })
      );
      break;
    }
  }
}

type EconomySite = {
  type: InstallationType;
  name: string;
  desc: string;
  coast?: boolean;
  health: number;
  /** The real place on the theatre map: the nearest towns to it are tried first. */
  near?: Vector2D;
};

/** Each era's civilian economy that the armies fought over (historical places of the theatre). */
const ECONOMY: Record<Era, EconomySite[]> = {
  era1: [
    { type: 'copra_plantation', name: '(中立) 利華兄弟 倫加椰乾種植園 (Lever Brothers)', desc: '椰乾種植園 · 我方勢力範圍時產出 RP / MP · 友方村落可募集土著偵察兵', health: 1200 },
    { type: 'copra_plantation', name: '(中立) 伯恩斯·菲爾普 椰乾種植園 (Burns Philp)', desc: '椰乾種植園 · 我方勢力範圍時產出 RP / MP', health: 1200 },
    { type: 'civil_wharf', name: '(中立) 圖拉吉 民用碼頭 (Tulagi)', desc: '民用碼頭 · 控制時提供時間值 TP (縮短運補時程)', coast: true, health: 1500 },
  ],
  era2: [
    { type: 'sugar_mill', name: '(中立) 南洋興發 查蘭卡諾亞製糖所 (Chalan Kanoa)', desc: '製糖所與甘蔗鐵道 · 控制時產出 RP / PP', health: 2200 },
    { type: 'copra_plantation', name: '(中立) 南洋興發 椰乾種植園', desc: '椰乾種植園 · 我方勢力範圍時產出 RP / MP', health: 1200 },
    { type: 'civil_wharf', name: '(中立) 加拉班 民用碼頭 (Garapan)', desc: '民用碼頭 · 控制時提供時間值 TP', coast: true, health: 1500 },
  ],
  era3: [
    { type: 'power_plant', name: '(中立) 赴戰江水力發電所 (Pujŏn)', desc: '水力發電廠 · 控制時產出 RP / PP · 敵方控制時供應其地方部隊', health: 3200, near: { x: 11500, y: 1600 } },
    { type: 'civil_wharf', name: '(中立) 元山 漁港 (Wŏnsan)', desc: '漁港碼頭 · 控制時提供時間值 TP', coast: true, health: 1500, near: { x: 6800, y: 6400 } },
  ],
  era4: [
    { type: 'pagoda', name: '(中立) 天姥寺 (Thiên Mụ)', desc: '佛寺 · 受保護文化設施 (攻擊將造成附帶損害) · 我方勢力範圍時提供政治值 PP', health: 1800, near: { x: 6800, y: 6400 } },
    { type: 'pagoda', name: '(中立) 慈曇寺 (Từ Đàm)', desc: '佛寺 · 受保護文化設施 · 我方勢力範圍時提供政治值 PP', health: 1800, near: { x: 7500, y: 6100 } },
    { type: 'civil_wharf', name: '(中立) 峴港 漁港 (Đà Nẵng)', desc: '漁港碼頭 · 控制時提供時間值 TP', coast: true, health: 1500, near: { x: 6400, y: 8400 } },
  ],
  era5: [
    { type: 'factory', name: '(中立) 福斯汽車 漢諾威廠 (VW Werk Hannover)', desc: '工業區 · 控制時產出 RP / TP · 我方控制時可募集國土防衛軍', health: 3600, near: { x: 7900, y: 10800 } },
    { type: 'factory', name: '(中立) 大陸集團 輪胎廠 (Continental)', desc: '工業區 · 控制時產出 RP / TP', health: 3200, near: { x: 8600, y: 12800 } },
    { type: 'power_plant', name: '(中立) 梅倫燃煤電廠 (Kraftwerk Mehrum)', desc: '燃煤發電廠 · 控制時產出 RP / PP', health: 3800, near: { x: 9000, y: 11400 } },
  ],
};

const PROTECTED: ReadonlySet<InstallationType> = new Set(['pagoda']);

/**
 * Places the era's civilian economic sites beside the towns and villages: plantations and mills
 * inland, wharves on the shore. They start neutral; the side whose troops hold the ground round
 * one takes it into its sphere (engine civil-control tick).
 */
export function addCivilEconomy(islands: Island[], map: TerrainMap, era: Era): void {
  const anchors: Vector2D[] = [
    ...islands.flatMap((i) => i.installations.filter((t) => t.type === 'town' || t.type === 'city' || t.type === 'settlement').map((t) => t.pos)),
    ...map.districts.filter((d) => d.kind === 'city' || d.kind === 'town' || d.kind === 'settlement' || d.kind === 'village').map((d) => d.center),
  ];
  if (anchors.length === 0) return;
  const placed: Vector2D[] = [];
  const nearWater = (p: Vector2D) => {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const t = map.at(p.x + Math.cos(a) * 45, p.y + Math.sin(a) * 45);
      if (t === TERRAIN.water || t === TERRAIN.lagoon) return true;
    }
    return false;
  };
  const usedWharves = new Set<string>();
  const add = (site: EconomySite, n: number, isl: Island, pos: Vector2D, angle: number) => {
    placed.push(pos);
    const name = site.type === 'civil_wharf' ? placeNameByLatitude(era, 'wharf', pos, usedWharves) ?? site.name : site.name;
    isl.installations.push(
      makeInstallation({
        id: `civil-econ-${era}-${n}`,
        type: site.type,
        name,
        weaponDesc: site.desc,
        pos,
        angle,
        health: site.health,
        armor: 0.3,
        side: 'neutral',
        isCivilian: PROTECTED.has(site.type) || undefined,
      })
    );
  };
  ECONOMY[era].forEach((site, n) => {
    const before = placed.length;
    const order = site.near
      ? [...anchors].sort((a, b) => dist(a, site.near!) - dist(b, site.near!))
      : anchors.map((_, a0) => anchors[(a0 + n * 3) % anchors.length]);
    for (let a0 = 0; a0 < order.length && placed.length === before; a0++) {
      const anchor = order[a0];
      const isl = islands.find((i) => isPointInPolygon(anchor, i.points));
      if (!isl) continue;
      let pos: Vector2D | null = null;
      search: for (let r = site.coast ? 80 : 150; r <= 420; r += 40) {
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2 + n;
          const p = { x: anchor.x + Math.cos(a) * r, y: anchor.y + Math.sin(a) * r };
          if (!dryLand(map, p) || !isPointInPolygon(p, isl.points)) continue;
          if (site.coast !== nearWater(p) && site.coast) continue;
          if (isl.installations.some((i) => dist(i.pos, p) < 120) || placed.some((q) => dist(q, p) < 500)) continue;
          pos = p;
          break search;
        }
      }
      if (!pos) continue;
      add(site, n, isl, pos, Math.atan2(pos.y - anchor.y, pos.x - anchor.x));
    }
    // A wharf with no town on the shore: walk the coastline of the inhabited islands instead
    if (placed.length === before && site.coast) {
      const inhabited = islands.filter((i) => anchors.some((p) => isPointInPolygon(p, i.points)));
      if (site.near) {
        const gap = (i: Island) => Math.min(...i.points.map((q) => dist(q, site.near!)));
        inhabited.sort((a, b) => gap(a) - gap(b));
      }
      // The mainland polygon runs along the map border: only a real shore counts
      let W = 0;
      for (const i of islands) for (const q of i.points) W = Math.max(W, q.x, q.y);
      const inside = (p: Vector2D) => p.x > 400 && p.y > 400 && p.x < W - 400 && p.y < W - 400;
      for (const isl of inhabited) {
        const step = Math.max(1, Math.floor(isl.points.length / 60));
        // Walk the shore nearest the site's real place first
        const shore = isl.points.filter((_, k) => k % step === 0);
        if (site.near) shore.sort((a, b) => dist(a, site.near!) - dist(b, site.near!));
        for (let k = 0; k < shore.length && placed.length === before; k++) {
          const c = shore[k];
          const a = Math.atan2(isl.center.y - c.y, isl.center.x - c.x);
          for (const inward of [30, 60, 90]) {
            const p = { x: c.x + Math.cos(a) * inward, y: c.y + Math.sin(a) * inward };
            if (!inside(p) || !dryLand(map, p) || !nearWater(p) || !isPointInPolygon(p, isl.points)) continue;
            if (isl.installations.some((i) => dist(i.pos, p) < 120) || placed.some((q) => dist(q, p) < 500)) continue;
            add(site, n, isl, p, a + Math.PI);
            break;
          }
        }
        if (placed.length > before) break;
      }
    }
  });
}
