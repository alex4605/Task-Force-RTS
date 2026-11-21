import { Era, Island, Vector2D } from '../types/game';
import { dist, makeInstallation } from './procedural';
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
