import { AircraftModel, Era, Ship } from '../types/game';

/**
 * Aircraft carried by surface combatants (not carriers): catapult floatplanes on battleships and
 * cruisers in the Second World War, a plane-guard helicopter on Korean-war cruisers and
 * battleships, and the ASW / ASuW helicopter of later frigates, destroyers and cruisers.
 *
 * The fits follow the real ships: North Carolina / South Dakota / Iowa class battleships flew
 * three OS2U Kingfishers; US cruisers two (SC-1 Seahawk on the 1945 cruisers); Missouri and the
 * cruisers off Korea an HO3S-1; Belknap and Knox class the SH-2 Seasprite (LAMPS I); Spruance,
 * Ticonderoga and Perry class two SH-60B (LAMPS III), Kidd one. Royal Navy and RAN capital ships
 * and County cruisers catapulted the Walrus; Type 42, Leander, F122, Georges Leygues and Tourville
 * class the Lynx; the JMSDF DDHs three HSS-2 (S-61 / SH-3). IJN heavy cruisers and battleships
 * carried E13A "Jake" floatplanes; Soviet Kirov, Slava, Udaloy and Sovremenny class Ka-27.
 * Destroyers of the Second World War and Korea, and the Adams / Sherman class, had no hangar.
 */
export interface ShipFlight {
  model: AircraftModel;
  count: number;
  kind: 'floatplane' | 'helicopter';
}

const F = (model: AircraftModel, count: number): ShipFlight => ({ model, count, kind: 'floatplane' });
const H = (model: AircraftModel, count: number): ShipFlight => ({ model, count, kind: 'helicopter' });

/** Ship types that never carry aircraft of their own (carriers have an air wing; boats, subs, landing craft). */
const NONE = new Set<string>([
  'carrier', 'cve', 'cv63', 'cvn', 'lph', 'lha_tarawa', 'cvhg_kiev', 'submarine', 'foxtrot', 'ssn_la', 'ssgn_oscar',
  'patrol_boat', 'lcvp', 'lst', 'lsm_r', 'lcm8', 'komar_ptg', 'osa', 'pbr', 'river_gunboat', 'lcac',
]);

const ATLANTA_CLASS = /Atlanta|Juneau|San Juan|San Diego|Oakland|Reno|Flint|Tucson|CL-5[1-4]|CL-9[5-8]/;

/** By name, for allied ships whose type is generic (cruiser / ddg / ffg). */
const ALLIED_BY_NAME: Array<[RegExp, ShipFlight, Era[]]> = [
  [/King George V|Duke of York|Howe|Exeter|Australia|Canberra|Shropshire/, F('walrus', 1), ['era1', 'era2']],
  [/Shirane|Haruna/, H('sh3f', 3), ['era4', 'era5']],
  [/Type 42|Sheffield 謝菲爾德號 \(D80|Coventry|Glasgow|Andromeda|Bremen|Georges Leygues|Tourville/, H('lynx', 1), ['era4', 'era5']],
];

export function shipAviation(ship: Ship, era: Era): ShipFlight | undefined {
  if (NONE.has(ship.type) || ship.carrierPlanes) return undefined;
  if (ship.side === 'allied') {
    const name = `${ship.name} ${ship.codeName ?? ''}`;
    for (const [re, fit, eras] of ALLIED_BY_NAME) if (eras.includes(era) && re.test(name)) return { ...fit };
    return undefined;
  }
  if (ship.side === 'enemy') {
    switch (ship.type) {
      case 'chokai':
      case 'kongo':
        return F('e13a', ship.type === 'chokai' ? 2 : 3);
      case 'cgn_kirov':
        return H('ka27', 3);
      case 'dd_udaloy':
        return H('ka27', 2);
      case 'cg_slava':
      case 'dd_sovremenny':
        return H('ka27', 1);
      default:
        // Generic IJN heavy units of the Pacific eras
        if ((era === 'era1' || era === 'era2') && (ship.type === 'battleship' || ship.type === 'cruiser')) return F('e13a', 2);
        return undefined;
    }
  }
  // Player (US Navy)
  switch (ship.type) {
    case 'battleship':
      if (era === 'era1' || era === 'era2') return F('os2u', 3);
      if (era === 'era3') return H('ho3s1', 1);
      return undefined;
    case 'cruiser':
      // Atlanta / Oakland class AA cruisers had no catapults
      if (ATLANTA_CLASS.test(`${ship.name} ${ship.codeName ?? ''}`)) return undefined;
      if (era === 'era1') return F('os2u', 2);
      if (era === 'era2') return F('sc1', 2);
      if (era === 'era3') return H('ho3s1', 1);
      return undefined;
    case 'cg':
    case 'ffg':
      return era === 'era4' ? H('sh2', 1) : era === 'era5' ? H('sh60b', ship.type === 'ffg' ? 2 : 1) : undefined;
    case 'cg_tico':
    case 'dd_spruance':
    case 'ffg_ohp':
      return H('sh60b', 2);
    case 'ddg_kidd':
      return H('sh60b', 1);
    default:
      return undefined;
  }
}

/** Shipboard models, so menus and rebase know a destroyer cannot take an F-14. */
export function deckAccepts(ship: Ship, model: AircraftModel): boolean {
  if (!ship.flightDeck) return true;
  return (ship.carrierPlanes?.maxPerType[model] ?? 0) > 0;
}
