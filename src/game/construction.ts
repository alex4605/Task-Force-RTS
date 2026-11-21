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
  // Engineering works: graders, cranes, concrete and pile drivers
  airfield: 'engineer',
  fob: 'engineer',
  motor_pool: 'engineer',
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
