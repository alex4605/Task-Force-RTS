import { Ship, ShipType } from '../../../types/game';

/**
 * Plan-view proportions. `ship.width` is a gameplay value (hit detection, wakes, fire spots) and
 * was set generously, so most hulls drew at a 4.5:1 length-to-beam ratio where real warships run
 * from 7:1 (battleships) to 11:1 (fast destroyers). The renderer draws each hull with its real
 * ratio, widened by READABILITY so deck fittings stay legible at tactical zoom.
 */
const READABILITY = 1.2;

/** Real waterline length / maximum beam (flight-deck width for carriers), by class name. */
const CLASS_RATIOS: [RegExp, number][] = [
  // WWII battleships
  [/Yamato|Musashi|大和|武藏/, 6.8],
  [/Kongo|Hiei|Haruna|Kirishima/, 7.2],
  [/Washington|North Carolina|BB-5[56]/, 6.7],
  [/Iowa|Missouri|New Jersey|Wisconsin|BB-6[1-4]/, 8.2],
  // Carriers (flight deck incl. sponsons)
  [/Enterprise \(CV-6|Yorktown|Hornet \(CV-8/, 7.2],
  [/Oriskany|SCB-27/, 6.0],
  [/Essex|Intrepid|Lexington \(CV-16|CV-9|CV-1[0-9]/, 6.2],
  [/Shokaku|Zuikaku/, 8.4],
  [/Taiho/, 8.0],
  [/Gambier|Casablanca|CVE-/, 6.3],
  // Cruisers
  [/Takao|Chokai|Atago|Maya/, 9.8],
  [/Yahagi|Agano|Noshiro|Sakawa/, 11.5],
  [/Atlanta|Juneau|CL-5[1-4]/, 10.2],
  [/Des Moines|CA-134/, 9.5],
  [/Sverdlov|Pozharsky/, 9.6],
  [/Baltimore|Cleveland|Portland|San Francisco|New Orleans|CA-|CL-/, 9.3],
  // Destroyers / escorts
  [/Shimakaze/, 11.6],
  [/Akizuki/, 11.5],
  [/Kagero|Yukikaze|IJN.*Destroyer/, 11.0],
  [/Samuel B|DE-/, 8.5],
  [/Skory|Smotryashchy|Sposobny|Ozhestochonny|Vnimatelny|Vrazumitelny|Vidny/, 10.0],
  [/Gearing|Frank Knox|Fletcher|Radford|O'Bannon|Johnston|Hoel|DD-[4-8]\d\d\b/, 9.5],
];

/** Fallback ratio by hull type when the name carries no class. */
const TYPE_RATIOS: Partial<Record<ShipType, number>> = {
  battleship: 7.2,
  carrier: 7,
  cve: 6.3,
  cruiser: 9.4,
  destroyer: 10,
  submarine: 11,
  cg: 10,
  ddg: 9.3,
  dd: 9.1,
  ffg: 9.4,
  kashin: 9.1,
  riga: 8.9,
  sverdlov: 9.6,
  kynda: 8.9,
  petya: 8.6,
  akizuki: 11.5,
  chokai: 9.8,
  kongo: 7.2,
  cg_tico: 10.3,
  cg_virginia: 9.3,
  dd_spruance: 10.2,
  ddg_kidd: 10.2,
  ffg_ohp: 9.9,
  bb_iowa_mod: 8.2,
  dd_sovremenny: 9,
  dd_udaloy: 8.4,
  cg_slava: 8.9,
  cgn_kirov: 8.8,
  foxtrot: 12,
  ssn_la: 11,
  ssgn_oscar: 8.5,
  lst: 7.6,
  lsm_r: 5.9,
  lpd: 5.7,
};

const ratioCache = new Map<string, number | null>();

function realRatio(ship: Ship): number | null {
  const key = ship.type + '|' + ship.name;
  let r = ratioCache.get(key);
  if (r === undefined) {
    r = CLASS_RATIOS.find(([re]) => re.test(ship.name))?.[1] ?? TYPE_RATIOS[ship.type] ?? null;
    ratioCache.set(key, r);
  }
  return r;
}

/** Beam the hull is drawn with: the real proportion (eased for legibility), never wider than the gameplay beam. */
export function planBeam(ship: Ship): number {
  const r = realRatio(ship);
  if (!r) return ship.width;
  return Math.min(ship.width, (ship.length / r) * READABILITY);
}

/**
 * The ship as the renderer should draw it: same object when the proportions already match,
 * otherwise a shallow copy with the plan beam and the beam positions of its mounts scaled to it.
 */
export function planView(ship: Ship): Ship {
  const w = planBeam(ship);
  if (w >= ship.width - 0.01) return ship;
  const k = w / ship.width;
  if (ship.type === 'carrier' || ship.type === 'cve') {
    // Carrier guns sit in sponsons outboard of the deck edge, except Essex's twin 5"/38 houses in line with the island
    const edge = w * 0.44;
    return {
      ...ship,
      width: w,
      turrets: ship.turrets.map((t) => (t.relY === 0 ? t : { ...t, relY: Math.sign(t.relY) * (/艦島/.test(t.caliber) ? edge * 0.62 : edge + 2.4) })),
    };
  }
  return {
    ...ship,
    width: w,
    turrets: ship.turrets.map((t) => ({ ...t, relY: t.relY * k })),
  };
}
