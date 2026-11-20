import { AircraftModel, AircraftPayloadType, AircraftRole, Era } from '../types/game';
import { getCarrierModelsForEra } from './airWingCatalog';
import { getGunRounds } from './aircraftArmament';

/**
 * Historical loadouts of every player-flyable airframe: the stores each type actually carried in
 * service, how many of them, and which one it flew with by default. This single table drives the
 * carrier and airbase payload menus, the pre-battle air-wing screen and the engine's launch code,
 * so a menu can never offer a store the airframe never carried (an F-16A with Sparrows, an F-4B
 * strafing with a gun it did not have) and the engine never launches one.
 *
 * `rounds` is the number of releases the aircraft gets: missiles and torpedoes are counted
 * individually, a rocket pod salvo or a bomb stick counts as one release.
 */
interface Store {
  payload: AircraftPayloadType;
  rounds?: number;
  /** Eras in which the store was in service on this airframe; omitted = every era it flies in. */
  eras?: readonly Era[];
}

const s = (payload: AircraftPayloadType, rounds?: number, eras?: readonly Era[]): Store => ({ payload, rounds, eras });

/**
 * Releases per sortie when an airframe does not list its own count. Gun-only sorties use the
 * airframe's gun belt instead (see getPayloadRounds).
 */
const DEFAULT_ROUNDS: Record<AircraftPayloadType, number> = {
  clean_guns: 1,
  hvar_rockets: 8,
  bomb_500: 1,
  bomb_1000: 1,
  bomb_1600: 1,
  bombs_dual_500: 2,
  aerial_torpedo: 1,
  depth_bombs: 4,
  scout_fuel: 1,
  scout_depth_charge: 2,
  bombs_carpet_250: 2,
  bombs_quad_500: 2,
  bombs_dual_1000: 2,
  bomb_1600_ap: 2,
  mixed_bombs_rockets: 2,
  asw_depth_bombs: 2,
  tiny_tim_rocket: 2,
  napalm_canister: 2,
  asw_torpedo: 2,
  bomb_2000: 1,
  tactical_nuke: 1,
  aim9_sidewinder: 4,
  aim7_sparrow: 4,
  agm12_bullpup: 2,
  agm45_shrike: 2,
  agm62_walleye: 2,
  bombs_snakeye_retarded: 4,
  b52_megaton_carpet: 36,
  ffar_rockets_pod: 16,
  helo_assault_troops: 1,
  c1_paratroopers: 1,
  asw_acoustic_torpedo: 2,
  b52_megaton_nuke: 1,
  tactical_b61_nuke: 1,
  opfor_tactical_nuke: 1,
  aim7_aim9_combo: 4,
  gbu10_laser_paveway: 2,
  cbu_cluster_bombs: 4,
  blu27_napalm: 4,
  agm78_standard_arm: 2,
  mer_iron_bombs: 1,
  rgm84_harpoon: 2,
  aim54_phoenix: 4,
  p700_granit: 2,
  kh22_burya: 2,
  agm65_maverick: 2,
  agm88_harm: 2,
  tow_missiles: 8,
  hellfire_missiles: 8,
};

const LOADOUTS: Partial<Record<AircraftModel, readonly Store[]>> = {
  // ── WWII carrier air wing ──
  f4f: [s('clean_guns'), s('bomb_500')], // F4F-4: six .50s, light bombs on wing racks
  sbd: [s('bomb_1000'), s('bomb_500'), s('depth_bombs', 3)], // centreline 1,000 lb or 500 lb; 325 lb depth charges
  tbd: [s('aerial_torpedo'), s('bomb_1000'), s('bombs_dual_500')], // Mk 13 torpedo or 1,000 lb
  os2u: [s('scout_fuel'), s('scout_depth_charge', 2), s('clean_guns')], // two 325 lb depth charges
  f6f: [s('clean_guns'), s('hvar_rockets', 6), s('bomb_1000'), s('bombs_dual_500')], // F6F-5: six HVAR, 1,000 lb centreline
  f4u: [s('clean_guns'), s('hvar_rockets', 8), s('bombs_dual_500'), s('bomb_1000')], // F4U-1D: eight HVAR, 2 x 1,000 lb
  f8f: [s('clean_guns'), s('hvar_rockets', 4), s('bombs_dual_500'), s('bomb_1000')], // F8F-1: four HVAR, 2 x 1,000 lb
  sb2c: [s('bomb_1000'), s('bomb_1600'), s('bombs_dual_500')], // internal bay up to a 1,600 lb AP bomb
  tbf: [s('aerial_torpedo'), s('bomb_1000'), s('bombs_dual_500'), s('depth_bombs', 4), s('hvar_rockets', 8)], // TBM-3: eight HVAR
  sc1: [s('scout_fuel'), s('scout_depth_charge', 2), s('clean_guns')], // two 325 lb depth charges
  // ── WWII land-based ──
  p36a: [s('clean_guns')],
  p40: [s('clean_guns'), s('bomb_500')], // one 500 lb centreline
  p39d: [s('clean_guns'), s('bomb_500')], // 37 mm cannon, one 500 lb
  a20: [s('bombs_dual_500'), s('bombs_quad_500'), s('bomb_1000'), s('clean_guns')], // 2,000-4,000 lb internal, gun nose
  b25: [s('bombs_dual_500'), s('bombs_dual_1000'), s('bomb_1000')], // B-25B: 3,000 lb
  b17: [s('bombs_quad_500'), s('bombs_carpet_250'), s('bombs_dual_1000'), s('bomb_1600_ap')], // 8 x 500 / 4 x 1,000 / 2 x 1,600 AP
  b17_late: [s('bombs_quad_500'), s('bombs_carpet_250'), s('bombs_dual_1000'), s('bomb_1600_ap')],
  b24: [s('bombs_quad_500'), s('bombs_carpet_250'), s('bombs_dual_1000'), s('bomb_1600_ap'), s('bomb_1600'), s('bomb_1000'), s('bombs_dual_500')],
  p51: [s('clean_guns'), s('hvar_rockets', 6), s('bombs_dual_500')], // P-51D: six HVAR or 2 x 500 lb
  p47: [s('mixed_bombs_rockets'), s('hvar_rockets', 10), s('bombs_dual_500'), s('bomb_1000'), s('clean_guns')], // P-47D-30: ten HVAR
  p38: [s('hvar_rockets', 10), s('clean_guns'), s('bombs_dual_500'), s('bomb_1000')], // P-38L: ten HVAR "Christmas tree"
  a26: [s('napalm_canister', 2, ['era3']), s('bombs_dual_500'), s('bomb_1000'), s('bombs_quad_500'), s('hvar_rockets', 8)],
  b29: [s('bombs_carpet_250'), s('bombs_quad_500'), s('bombs_dual_1000'), s('bomb_2000'), s('bomb_1600'), s('bomb_1000'), s('tactical_nuke')],
  c47: [s('c1_paratroopers')],
  pby: [s('scout_fuel'), s('depth_bombs', 4), s('aerial_torpedo', 2), s('bombs_dual_500')], // Black Cat: radar search, depth charges, two Mk 13 torpedoes
  // ── Korean War ──
  f9f: [s('clean_guns'), s('hvar_rockets', 6), s('bombs_dual_500'), s('napalm_canister', 2)], // F9F-2: six HVAR or 2 x 500 lb
  f2h: [s('clean_guns'), s('hvar_rockets', 4), s('bombs_dual_500')], // F2H-2: four HVAR + 2 x 500 lb
  ad1: [s('hvar_rockets', 12), s('bomb_2000'), s('aerial_torpedo'), s('napalm_canister', 2), s('bomb_1000', 3), s('tiny_tim_rocket', 2), s('bombs_dual_500')], // Hwacheon Dam torpedo strike, 1951
  f4u4: [s('clean_guns'), s('hvar_rockets', 8), s('napalm_canister', 2), s('bomb_1000', 2)],
  af_guardian: [s('asw_torpedo', 2), s('depth_bombs', 4)], // AF-2S hunter-killer
  ad3w: [s('scout_fuel')],
  ho3s1: [s('scout_fuel')], // unarmed plane-guard / rescue helicopter
  f86: [s('clean_guns'), s('hvar_rockets', 8), s('bomb_1000', 2), s('napalm_canister', 2)], // F-86F fighter-bomber
  ac47: [s('clean_guns')], // three GAU-2 7.62 mm miniguns, 21,000 rounds
  f100: [s('bombs_snakeye_retarded', 4), s('blu27_napalm', 4), s('cbu_cluster_bombs', 4), s('ffar_rockets_pod', 8), s('clean_guns')],
  ch46: [s('helo_assault_troops'), s('clean_guns')],
  f84: [s('bombs_dual_500'), s('hvar_rockets', 8), s('napalm_canister', 2), s('bomb_1000', 2), s('clean_guns')], // F-84G: Korean War interdiction
  f82: [s('clean_guns'), s('hvar_rockets', 8), s('bomb_1000', 2)],
  // ── Vietnam War ──
  f8: [s('aim9_sidewinder', 4), s('clean_guns'), s('bombs_snakeye_retarded', 4), s('ffar_rockets_pod', 8)], // four AIM-9 on cheek rails, Zuni pods
  f4b: [s('aim7_aim9_combo', 8), s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('bombs_snakeye_retarded', 6), s('blu27_napalm', 4), s('agm12_bullpup', 2), s('tactical_b61_nuke')], // no internal gun
  f4j: [s('aim7_aim9_combo', 8), s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('bombs_snakeye_retarded', 6), s('blu27_napalm', 4), s('agm12_bullpup', 2), s('tactical_b61_nuke')], // no internal gun
  f4e: [s('aim7_aim9_combo', 8), s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('clean_guns'), s('gbu10_laser_paveway', 2), s('bombs_snakeye_retarded', 6), s('blu27_napalm', 4), s('agm12_bullpup', 2), s('tactical_b61_nuke')], // internal M61
  a4: [s('bombs_snakeye_retarded', 4), s('cbu_cluster_bombs', 4), s('blu27_napalm', 4), s('agm12_bullpup', 2), s('ffar_rockets_pod', 8), s('bomb_1000', 2), s('clean_guns'), s('tactical_b61_nuke')],
  a6a: [s('mer_iron_bombs'), s('bombs_snakeye_retarded', 6), s('cbu_cluster_bombs', 4), s('agm62_walleye', 2), s('agm12_bullpup', 2), s('bomb_2000', 2), s('tactical_b61_nuke')], // 28 x 500 lb on MERs; no gun
  a6b_weasel: [s('agm45_shrike', 4), s('agm78_standard_arm', 2)], // four Shrike or two Standard ARM
  a7: [s('agm62_walleye', 2), s('gbu10_laser_paveway', 2), s('mer_iron_bombs'), s('cbu_cluster_bombs', 4), s('blu27_napalm', 4), s('agm45_shrike', 2), s('bombs_snakeye_retarded', 6), s('bomb_2000', 2), s('clean_guns'), s('tactical_b61_nuke')],
  f105: [s('mer_iron_bombs'), s('agm45_shrike', 2), s('agm78_standard_arm', 2), s('agm12_bullpup', 2), s('cbu_cluster_bombs', 4), s('bombs_snakeye_retarded', 6), s('bomb_2000', 2), s('clean_guns'), s('tactical_b61_nuke')],
  a1h: [s('bombs_snakeye_retarded', 6), s('blu27_napalm', 4), s('cbu_cluster_bombs', 4), s('ffar_rockets_pod', 8), s('bomb_2000', 2), s('clean_guns')], // 8,000 lb on 15 pylons
  a37b: [s('bombs_snakeye_retarded', 4), s('blu27_napalm', 2), s('ffar_rockets_pod', 8), s('clean_guns')],
  f5a: [s('aim9_sidewinder', 2), s('clean_guns'), s('bombs_snakeye_retarded', 4)], // two wing-tip AIM-9
  f104g: [s('aim9_sidewinder', 2), s('clean_guns')],
  ov10: [s('ffar_rockets_pod', 8), s('blu27_napalm', 2), s('scout_fuel'), s('clean_guns')], // FAC marking rockets, four M60s
  uh1: [s('helo_assault_troops'), s('clean_guns')],
  ah1: [s('ffar_rockets_pod', 16), s('clean_guns')], // AH-1G: 2.75" pods, minigun / 40 mm turret
  uh2: [s('scout_fuel')], // unarmed utility / plane-guard helicopter
  sh2: [s('asw_acoustic_torpedo', 2)], // SH-2F: two Mk 46
  s2: [s('asw_acoustic_torpedo', 2), s('depth_bombs', 4), s('scout_fuel')], // S-2E: Mk 44 torpedoes in the bay
  e1: [s('scout_fuel')],
  c1: [s('c1_paratroopers')],
  p3: [s('asw_acoustic_torpedo', 4), s('rgm84_harpoon', 4, ['era5']), s('depth_bombs', 4), s('scout_fuel')], // P-3C: Mk 46 bay, Harpoon from 1981
  b52: [s('rgm84_harpoon', 12, ['era5']), s('b52_megaton_carpet'), s('mer_iron_bombs'), s('cbu_cluster_bombs', 4), s('bombs_snakeye_retarded', 6), s('bomb_2000', 2), s('bomb_1000', 2), s('b52_megaton_nuke')], // B-52G: twelve Harpoons
  // ── Late Cold War ──
  f14a: [s('aim54_phoenix', 4), s('aim7_aim9_combo', 8), s('aim7_sparrow', 6), s('aim9_sidewinder', 4), s('clean_guns')], // fleet-defence load: 4 Phoenix
  f15a: [s('aim7_aim9_combo', 8), s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('clean_guns')], // four AIM-7F + four AIM-9L
  f16a: [s('aim9_sidewinder', 4), s('agm65_maverick', 2), s('gbu10_laser_paveway', 2), s('cbu_cluster_bombs', 4), s('clean_guns')], // no Sparrow capability on the F-16A
  fa18a: [s('aim7_aim9_combo', 4), s('rgm84_harpoon', 2), s('agm88_harm', 2), s('agm65_maverick', 2), s('aim9_sidewinder', 4), s('clean_guns')],
  a6e: [s('rgm84_harpoon', 4), s('gbu10_laser_paveway', 4), s('agm65_maverick', 2), s('mer_iron_bombs'), s('cbu_cluster_bombs', 4)], // TRAM; no gun
  ea6b: [s('agm88_harm', 2)], // two HARM in addition to ALQ-99 pods; no gun
  av8b: [s('agm65_maverick', 2), s('cbu_cluster_bombs', 4), s('bombs_snakeye_retarded', 6), s('clean_guns')], // GAU-12 pod
  a10a: [s('agm65_maverick', 4), s('cbu_cluster_bombs', 4), s('mer_iron_bombs'), s('bombs_snakeye_retarded', 6), s('clean_guns')], // GAU-8
  ah64a: [s('hellfire_missiles', 16), s('clean_guns')], // sixteen Hellfire, M230 chain gun
  ah1w: [s('tow_missiles', 8), s('hellfire_missiles', 8), s('aim9_sidewinder', 2), s('clean_guns')],
  s3a: [s('asw_acoustic_torpedo', 4), s('rgm84_harpoon', 2), s('depth_bombs', 4), s('scout_fuel')], // four Mk 46 in the bay; no gun
  sh60b: [s('asw_acoustic_torpedo', 2), s('depth_bombs', 2)], // LAMPS III: two Mk 46 (Penguin from 1989)
  sh3f: [s('asw_acoustic_torpedo', 2), s('depth_bombs', 4)],
  f111: [s('gbu10_laser_paveway', 4), s('mer_iron_bombs'), s('bomb_2000', 4), s('cbu_cluster_bombs', 4)], // F-111F Pave Tack
  e2c: [s('scout_fuel')],
  e3a: [s('scout_fuel')],
  c2a: [s('c1_paratroopers')],
  c130: [s('c1_paratroopers')],
  ch53: [s('helo_assault_troops'), s('c1_paratroopers')],
  // ── Allied (Commonwealth, ROK and NATO) squadrons flown from the friendly airbase ──
  beaufort: [s('aerial_torpedo'), s('bombs_dual_500'), s('clean_guns')],
  boomerang: [s('clean_guns'), s('bomb_500')],
  seafire: [s('clean_guns'), s('bomb_500')],
  barracuda: [s('aerial_torpedo'), s('bombs_dual_500'), s('bomb_1600'), s('depth_bombs', 4)], // 1,600 lb AP vs Tirpitz
  canberra: [s('bombs_carpet_250'), s('bombs_dual_1000')], // six 750 lb or 1,000 lb bombs over Vietnam
  buccaneer: [s('rgm84_harpoon', 2), s('gbu10_laser_paveway', 2), s('bombs_snakeye_retarded', 4)], // Sea Eagle / Martel
  sea_harrier: [s('aim9_sidewinder', 2), s('clean_guns'), s('cbu_cluster_bombs', 2)], // AIM-9L, Falklands 1982
  hurricane: [s('clean_guns')],
  spitfire_v: [s('clean_guns')],
  spitfire_xiv: [s('clean_guns')],
  tempest: [s('hvar_rockets', 8), s('bombs_dual_500'), s('clean_guns')], // eight RP-3
  mosquito: [s('bombs_dual_500'), s('hvar_rockets', 8), s('clean_guns')], // FB.VI: 4 x 500 lb or eight RP-3
  beaufighter: [s('aerial_torpedo'), s('hvar_rockets', 8), s('clean_guns')], // "Torbeau" / RP-3 strike wing
  swordfish: [s('aerial_torpedo'), s('depth_bombs', 4), s('hvar_rockets', 8)],
  lancaster: [s('bombs_carpet_250'), s('bombs_quad_500'), s('bombs_dual_1000')],
  meteor: [s('clean_guns'), s('hvar_rockets', 8)], // RAAF Meteor F.8 with RP-3, Korea
  sea_fury: [s('hvar_rockets', 8), s('bombs_dual_500'), s('clean_guns')],
  rokaf_p51: [s('clean_guns'), s('hvar_rockets', 6), s('bombs_dual_500')],
  firefly_as5: [s('hvar_rockets', 8), s('depth_bombs', 2), s('clean_guns')],
  mirage3: [s('aim9_sidewinder', 2), s('clean_guns')],
  hunter_fga9: [s('bombs_snakeye_retarded', 2), s('hvar_rockets', 8), s('clean_guns')],
  f4f_phantom: [s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('clean_guns')],
  tornado_adv: [s('aim7_sparrow', 4), s('aim9_sidewinder', 4), s('clean_guns')], // four Skyflash
  tornado_gr1: [s('rgm84_harpoon', 2), s('bombs_snakeye_retarded', 4), s('clean_guns')], // Kormoran / Sea Eagle
  tornado_ids: [s('bombs_snakeye_retarded', 4), s('cbu_cluster_bombs', 2), s('clean_guns')], // JP233
  mirage2000: [s('aim7_sparrow', 2), s('aim9_sidewinder', 2), s('clean_guns')], // Super 530D + Magic II
  jaguar_gr1: [s('bombs_snakeye_retarded', 4), s('gbu10_laser_paveway', 2), s('clean_guns')],
  viggen_ja37: [s('rgm84_harpoon', 2), s('clean_guns')], // RBS-15F
};

function storesFor(model: AircraftModel, era: Era): Store[] {
  const hasGuns = getGunRounds(model) > 0;
  const stores = (LOADOUTS[model] ?? [s(hasGuns ? 'clean_guns' : 'scout_fuel')]).filter(
    (st) => (!st.eras || st.eras.includes(era)) && (st.payload !== 'clean_guns' || hasGuns)
  );
  return stores.length > 0 ? stores : [s('scout_fuel')];
}

/** Stores the airframe carried in this era, its default first. */
export function getModelPayloads(model: AircraftModel, era: Era): AircraftPayloadType[] {
  return storesFor(model, era).map((st) => st.payload);
}

export function getDefaultPayload(model: AircraftModel, era: Era): AircraftPayloadType {
  return storesFor(model, era)[0].payload;
}

/** The requested store if this airframe carried it, otherwise its historical default. */
export function resolvePayload(model: AircraftModel, requested: AircraftPayloadType | undefined, era: Era): AircraftPayloadType {
  const stores = storesFor(model, era);
  return stores.find((st) => st.payload === requested)?.payload ?? stores[0].payload;
}

/** Releases per sortie; a gun-only sortie is measured in rounds of the airframe's gun belt. */
export function getPayloadRounds(model: AircraftModel, payload: AircraftPayloadType, era: Era, gunRounds: number): number {
  if (payload === 'clean_guns') return gunRounds;
  return storesFor(model, era).find((st) => st.payload === payload)?.rounds ?? DEFAULT_ROUNDS[payload];
}

/**
 * Every store carried by at least one carrier airframe of these roles in this era, the first
 * airframe's default first (pre-battle air-wing menu).
 */
export function getRolePayloadOptions(roles: readonly AircraftRole[], era: Era): AircraftPayloadType[] {
  const options = getCarrierModelsForEra(era)
    .filter((def) => roles.includes(def.role))
    .flatMap((def) => getModelPayloads(def.model, era));
  return [...new Set(options)];
}

/** Whether the sortie carries expendable stores (as opposed to guns only or a recon fuel load). */
export function carriesStores(payload: AircraftPayloadType): boolean {
  return payload !== 'clean_guns' && payload !== 'scout_fuel';
}
