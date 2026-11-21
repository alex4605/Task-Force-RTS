import { Era, Island, Vector2D } from '../types/game';
import { dist, isPointInPolygon, makeInstallation } from './procedural';
import { TERRAIN, TerrainMap } from './terrain/terrainMap';

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
        name: names.shift()!,
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
          name: airportName,
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
      isl.installations.push(
        makeInstallation({
          id: `civil-hospital-${n++}`,
          type: 'civil_hospital',
          name: names.shift()!,
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
