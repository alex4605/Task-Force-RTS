/**
 * 設施構工: who has to be on site to build a facility. Field works an infantry unit can dig and
 * sandbag itself need any friendly foot unit nearby; airfields, piers, heavy gun pits and missile
 * sites need combat engineers (Seabees) with their plant.
 */
export type BuilderRequirement = 'infantry' | 'engineer';

/** Builders must be within this distance of the site (world units ≈ metres). */
export const BUILDER_RADIUS = 500;

const REQUIREMENT_BY_TAG: Record<string, BuilderRequirement> = {
  // Field works: dug in and sandbagged by the troops on the spot
  battalion_cp: 'infantry',
  command_post: 'infantry',
  heavy_aa: 'infantry',
  field_hospital: 'infantry',
  pow_camp: 'infantry',
  supply_depot: 'infantry',
  ammo_depot: 'infantry',
  radar: 'infantry',
  // 防禦構工: wire, trenches and traps the riflemen put in themselves; mines need sappers
  obstacle: 'infantry',
  trench: 'infantry',
  trap: 'infantry',
  minefield: 'engineer',
  // Engineering works: graders, cranes, concrete and pile drivers
  airfield: 'engineer',
  fob: 'engineer',
  motor_pool: 'engineer',
  farp: 'engineer',
  dockyard: 'engineer',
  pontoon_pier: 'engineer',
  major_naval_port: 'engineer',
  coastal_gun: 'engineer',
  m1_240mm: 'engineer',
  sam_hawk: 'engineer',
  sam_patriot: 'engineer',
  chaparral_sam: 'engineer',
};

export function builderRequirement(typeTag: string): BuilderRequirement {
  return REQUIREMENT_BY_TAG[typeTag] ?? 'infantry';
}

export const BUILDER_LABEL: Record<BuilderRequirement, string> = {
  infantry: '需步兵在場',
  engineer: '需工兵在場',
};

/** Engineer units: Seabees / combat engineers. */
export function isEngineerType(type: string): boolean {
  return type === 'usmc_engineer';
}

// ── Construction time ─────────────────────────────────────────────────────

/**
 * Game seconds an engineer platoon needs to finish each engineering work, scaled from what the
 * real units took: a FARP is fuel bladders and a cleared pad (hours); a motor pool or an FOB a
 * graded hardstand, berms and wire (a day or two); a gun or missile battery its pits and
 * revetments; a pontoon causeway pier a few days; a PSP-matted expedient airstrip a week or more
 * (Seabees at Guadalcanal, Munda, Tinian); a floating dry dock or a deep-water port weeks.
 * Command posts and depots the infantry dig themselves go up at once; field defences take a
 * little time (see the top of the table).
 */
const BUILD_TIME_S: Record<string, number> = {
  // Field defences: a rifle platoon strings a wire belt or digs a fire trench in a few hours,
  // rigs a trip wire in minutes; an engineer platoon lays a minefield in an afternoon
  trap: 10,
  obstacle: 25,
  trench: 35,
  minefield: 40,
  farp: 40,
  motor_pool: 60,
  fob: 90,
  coastal_gun: 75,
  chaparral_sam: 60,
  sam_hawk: 90,
  m1_240mm: 120,
  sam_patriot: 120,
  pontoon_pier: 120,
  airfield: 180,
  dockyard: 240,
  major_naval_port: 300,
};

export function buildTime(typeTag: string): number {
  return BUILD_TIME_S[typeTag] ?? 0;
}

/** Work rate with `n` builders on site: a second platoon helps a lot, a third a little. */
export function buildRate(n: number): number {
  if (n <= 0) return 0;
  return Math.min(2, 1 + 0.6 * (n - 1));
}

/** Prerequisites shown on the card and checked when the work is ordered. */
export const BUILD_PREREQ: Record<string, string> = {
  major_naval_port: '需島上已有急造棧橋港，且附近 800m 無敵軍',
  dockyard: '需島上已有棧橋港或正規軍港',
  airfield: '工地 700m 內不得有敵軍地面部隊',
  farp: '工地 500m 內不得有敵軍地面部隊',
};
