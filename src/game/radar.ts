import { Aircraft, AircraftModel, Era, Installation, Ship, Vector2D } from '../types/game';
import { gameRangeFromKm } from './rangeScale';
import { canSeeAircraft } from './terrain/combat';
import { TERRAIN, TerrainMap } from './terrain/terrainMap';

/**
 * Early-warning and air-picture model.
 *
 * Each side builds an air picture from its sensors: ground early-warning radars, SAM and flak
 * fire-control radars, warships' air-search radars, airborne early warning aircraft and fighter
 * radars, plus the eyes of every unit at short range. An aircraft is tracked by a side while any
 * of its sensors holds it, and for a few seconds after (track memory).
 *
 * What a radar can see is limited by:
 *  - its range against a fighter-sized target, by era and equipment (SCR-270 to SPS-49, Type 1
 *    to Top Pair, APS-20 to E-3's APY-1);
 *  - the radar horizon: 4.12·(√h_radar + √h_target) km, so a low flier is seen late by a ship
 *    or ground radar and early by an aircraft;
 *  - terrain: ridges and islands between radar and a low flier hide it;
 *  - look-down: before the late-1970s pulse-Doppler radars, an aircraft low over land is lost
 *    in ground clutter to airborne radars (over the sea they still see it).
 */

export interface RadarSensor {
  pos: Vector2D;
  /** Antenna height above sea level (m). */
  heightM: number;
  /** Detection range against a fighter (km). */
  rangeKm: number;
  /** Can pick out low fliers over land (pulse-Doppler look-down). */
  lookDown: boolean;
  /** Airborne: above the terrain, no terrain masking. */
  airborne: boolean;
}

/** Visual spotting range for aircraft (km): lookouts, gun crews, troops. */
export const VISUAL_KM = 8;

/** How long a lost contact stays in the air picture (s). */
export const TRACK_MEMORY_S = 4;

/** Aircraft height (m) from the game's normalised altitude (0 = sea level, 1 = ~11 km). */
export function aircraftHeightM(altitude: number | undefined): number {
  const a = altitude ?? 0.8;
  return 30 + a * a * 11000;
}

export function radarHorizonKm(h1: number, h2: number): number {
  return 4.12 * (Math.sqrt(Math.max(0, h1)) + Math.sqrt(Math.max(0, h2)));
}

/** Warship air-search radar range (km) by era and side; small craft and submarines carry none. */
export function shipRadarKm(ship: Ship, era: Era): number {
  const t = ship.type;
  if (/^(lcvp|lcm8|lcac|pbr|river_gunboat|patrol_boat|osa|komar_ptg|submarine|foxtrot|ssn_la|ssgn_oscar)$/.test(t)) return 0;
  const enemy = ship.side === 'enemy';
  if (era === 'era1') return enemy ? 0 : 100; // SC / SK and Type 281; IJN fleet had no air search radar in 1942
  if (era === 'era2') return enemy ? 55 : 150; // Type 21 / Type 13 vs SK / SK-2
  if (era === 'era3') return enemy ? 70 : 150; // Gyus-2 / Guis vs SPS-6
  if (era === 'era4') return enemy ? 110 : t === 'cv63' || t === 'cg' ? 300 : 220; // Head Net vs SPS-43 / SPS-48
  if (t === 'cgn_kirov' || t === 'cvhg_kiev' || t === 'cg_slava') return 300; // Top Pair / Top Sail
  return enemy ? 220 : t === 'cvn' || t === 'cg_tico' || t === 'cg_virginia' ? 400 : 300; // Top Plate vs SPY-1 / SPS-49
}

/** Ground radar range (km) of an installation that carries one; 0 otherwise. */
export function installationRadarKm(inst: Installation, era: Era): number {
  switch (inst.type) {
    case 'radar_station':
      return era === 'era1' ? 200 : era === 'era2' ? 240 : era === 'era3' ? 220 : era === 'era4' ? 275 : 350; // SCR-270 / Type 1 → P-12 → P-14 / AN/FPS
    case 'fan_song_radar':
      return 145;
    case 'sa2_sam_site':
      return 145;
    case 'sa3_sam_site':
      return 110;
    case 's300_sam_site':
      return 300;
    case 'sam_hawk':
      return 100;
    case 'flak_battery':
      return era === 'era1' ? 0 : era === 'era2' ? 40 : 30; // SCR-584 / SON-9 gun-laying radar
    case 'airfield':
      return era === 'era1' ? 0 : 120; // airfield surveillance / GCI radar
    case 'command_post':
      return era === 'era4' || era === 'era5' ? 120 : 0;
    default:
      return 0;
  }
}

/** Airborne early-warning and fighter radars (km). */
const AIRBORNE_RADAR: Partial<Record<AircraftModel, { km: number; lookDown: boolean }>> = {
  ad3w: { km: 300, lookDown: false }, // APS-20
  e1: { km: 300, lookDown: false }, // APS-82
  e2c: { km: 450, lookDown: true }, // APS-125
  e3a: { km: 400, lookDown: true }, // APY-1
  a50: { km: 300, lookDown: true }, // Shmel
  tu95: { km: 150, lookDown: false },
  il38: { km: 90, lookDown: false },
  p3: { km: 90, lookDown: false },
  f14a: { km: 200, lookDown: true }, // AWG-9
  f15a: { km: 160, lookDown: true }, // APG-63
  f16a: { km: 80, lookDown: true },
  fa18a: { km: 110, lookDown: true },
  mig31: { km: 200, lookDown: true }, // Zaslon
  su27: { km: 100, lookDown: true },
  mig29a: { km: 70, lookDown: true },
  mig23: { km: 70, lookDown: false },
  tornado_adv: { km: 150, lookDown: true },
  mirage2000: { km: 100, lookDown: true },
  f4b: { km: 80, lookDown: false },
  f4j: { km: 80, lookDown: false },
  f4e: { km: 80, lookDown: false },
  f4f_phantom: { km: 80, lookDown: false },
  f8: { km: 40, lookDown: false },
  mig21: { km: 25, lookDown: false },
  f86: { km: 15, lookDown: false }, // APG-30 ranging radar
  f9f: { km: 0, lookDown: false },
};

export function aircraftSensor(plane: Aircraft): RadarSensor | null {
  const r = AIRBORNE_RADAR[plane.model];
  if (!r || r.km <= 0) return null;
  return { pos: plane.pos, heightM: aircraftHeightM(plane.altitude), rangeKm: r.km, lookDown: r.lookDown, airborne: true };
}

/** Whether one sensor holds the aircraft. */
export function sensorDetects(map: TerrainMap, sensor: RadarSensor, plane: Aircraft): boolean {
  const d = Math.hypot(plane.pos.x - sensor.pos.x, plane.pos.y - sensor.pos.y);
  const h = aircraftHeightM(plane.altitude);
  const km = Math.min(sensor.rangeKm, radarHorizonKm(sensor.heightM, h));
  if (d > gameRangeFromKm(km)) return false;
  const low = (plane.altitude ?? 0.8) < 0.3;
  if (sensor.airborne) {
    // Ground clutter: without look-down, a low flier over land is invisible from above
    if (low && !sensor.lookDown) {
      const t = map.at(plane.pos.x, plane.pos.y);
      if (t !== TERRAIN.water && t !== TERRAIN.lagoon) return false;
    }
    return true;
  }
  return canSeeAircraft(map, sensor.pos, plane, 0.04);
}

/** Visual sighting from a unit on the ground or at sea (or another aircraft). */
export function visualDetects(map: TerrainMap, from: Vector2D, plane: Aircraft, airborne: boolean): boolean {
  const d = Math.hypot(plane.pos.x - from.x, plane.pos.y - from.y);
  if (d > gameRangeFromKm(VISUAL_KM)) return false;
  return airborne || canSeeAircraft(map, from, plane, 0.02);
}

/** Altitude used for the low-level coverage boundary (a strike run at ~300 m). */
export const LOW_COVERAGE_ALTITUDE = 0.15;

/**
 * Low-level radar coverage as a polygon (viewshed): rays march out from the antenna keeping the
 * steepest terrain slope met so far; the boundary on each ray is where an aircraft at
 * LOW_COVERAGE_ALTITUDE would first drop into the terrain shadow or below the radar horizon.
 * Airborne sensors are not terrain-limited.
 */
export function lowCoveragePolygon(map: TerrainMap, sensor: RadarSensor, rays = 72): Vector2D[] {
  const hTarget = aircraftHeightM(LOW_COVERAGE_ALTITUDE);
  const maxR = gameRangeFromKm(Math.min(sensor.rangeKm, radarHorizonKm(sensor.heightM, hTarget)));
  const pts: Vector2D[] = [];
  const eye = sensor.airborne ? Infinity : map.elevationAt(sensor.pos.x, sensor.pos.y) + 0.04;
  const step = Math.max(40, maxR / 60);
  for (let k = 0; k < rays; k++) {
    const ang = (k / rays) * Math.PI * 2;
    const cx = Math.cos(ang);
    const cy = Math.sin(ang);
    let reach = maxR;
    if (isFinite(eye)) {
      let maxSlope = -Infinity;
      for (let d = step; d <= maxR; d += step) {
        const x = sensor.pos.x + cx * d;
        const y = sensor.pos.y + cy * d;
        const ground = map.elevationAt(x, y);
        const target = ground + 0.03 + LOW_COVERAGE_ALTITUDE * 0.35;
        if ((target - eye) / d < maxSlope - 0.00002) {
          reach = d;
          break;
        }
        maxSlope = Math.max(maxSlope, (ground - eye) / d);
      }
    }
    pts.push({ x: sensor.pos.x + cx * reach, y: sensor.pos.y + cy * reach });
  }
  return pts;
}

/** High-altitude detection radius (map units). */
export function highCoverageRadius(sensor: RadarSensor): number {
  return gameRangeFromKm(Math.min(sensor.rangeKm, radarHorizonKm(sensor.heightM, aircraftHeightM(0.8))));
}
