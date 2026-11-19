import { GroundUnitType } from '../types/game';

/**
 * Combat stats of every ground unit type. Engagement range is not listed here: it comes from the
 * historical range table on the shared cross-arm scale (rangeScale.ts). Exhaustive, so a new
 * GroundUnitType without stats is a compile error.
 */
export interface GroundUnitStats {
  health: number;
  armor: number;
  speed: number;
  damage: number;
  reloadTime: number;
  isAmphibious?: boolean;
}

export const GROUND_UNIT_STATS: Record<GroundUnitType, GroundUnitStats> = {
  usmc_rifle_42: { health: 1450, armor: 0.28, speed: 3.6, damage: 65, reloadTime: 1.3 },
  usmc_rifle_45: { health: 1850, armor: 0.35, speed: 4.0, damage: 85, reloadTime: 1.1 },
  usmc_armor_m3: { health: 2200, armor: 0.52, speed: 5.6, damage: 195, reloadTime: 2.4 },
  usmc_armor_m4: { health: 2900, armor: 0.65, speed: 4.8, damage: 310, reloadTime: 2.6 },
  usmc_lvt_42: { health: 1900, armor: 0.42, speed: 4.5, damage: 120, reloadTime: 1.7, isAmphibious: true },
  usmc_lvt_45: { health: 2400, armor: 0.52, speed: 4.7, damage: 230, reloadTime: 2.1, isAmphibious: true },
  usmc_engineer: { health: 1600, armor: 0.38, speed: 4.2, damage: 95, reloadTime: 1.2 },
  usmc_artillery_105: { health: 2200, armor: 0.40, speed: 2.4, damage: 350, reloadTime: 3.2 },
  opfor_infantry_42: { health: 1500, armor: 0.30, speed: 3.8, damage: 68, reloadTime: 1.3 },
  opfor_infantry_45: { health: 1900, armor: 0.38, speed: 4.2, damage: 92, reloadTime: 1.1 },
  opfor_mortar_platoon: { health: 1750, armor: 0.32, speed: 3.2, damage: 190, reloadTime: 2.0 },
  opfor_infantry_ambush: { health: 1500, armor: 0.32, speed: 5.5, damage: 110, reloadTime: 1.2 }, // Fast ambush sprint!
  opfor_infantry_patrol: { health: 1650, armor: 0.35, speed: 4.0, damage: 75, reloadTime: 1.2 },
  opfor_type95_tank: { health: 2100, armor: 0.48, speed: 5.4, damage: 180, reloadTime: 2.2 },
  opfor_type97_tank: { health: 2800, armor: 0.60, speed: 4.6, damage: 290, reloadTime: 2.5 },
  opfor_field_artillery: { health: 2400, armor: 0.40, speed: 2.5, damage: 240, reloadTime: 3.2 },
  usmc_korea_rifle: { health: 2100, armor: 0.38, speed: 4.2, damage: 105, reloadTime: 1.0 },
  us_army_infantry_korea: { health: 2200, armor: 0.40, speed: 4.4, damage: 110, reloadTime: 1.0 },
  us_army_armor_korea: { health: 3500, armor: 0.74, speed: 5.0, damage: 400, reloadTime: 2.3 },
  usmc_lvtp5: { health: 2800, armor: 0.58, speed: 4.8, damage: 250, reloadTime: 2.0, isAmphibious: true },
  usmc_patton_m46: { health: 3400, armor: 0.72, speed: 5.2, damage: 380, reloadTime: 2.3 },
  usmc_howitzer_155: { health: 2600, armor: 0.45, speed: 2.2, damage: 450, reloadTime: 3.8 },
  usmc_duster_m42: { health: 2400, armor: 0.50, speed: 5.4, damage: 160, reloadTime: 0.6 },
  opfor_coldwar_infantry: { health: 2000, armor: 0.36, speed: 4.3, damage: 98, reloadTime: 1.0 },
  opfor_t34_85: { health: 3100, armor: 0.68, speed: 5.0, damage: 330, reloadTime: 2.4 },
  opfor_is3_heavy: { health: 4200, armor: 0.82, speed: 4.0, damage: 520, reloadTime: 3.5 },
  opfor_s60_flak: { health: 2500, armor: 0.45, speed: 2.4, damage: 180, reloadTime: 0.8 },
  opfor_ks19_heavy: { health: 2800, armor: 0.48, speed: 2.0, damage: 360, reloadTime: 2.8 },
  us_army_rifle_platoon_65: { health: 2200, armor: 0.40, speed: 4.6, damage: 120, reloadTime: 0.9 },
  us_army_m113_mech: { health: 2800, armor: 0.60, speed: 5.8, damage: 220, reloadTime: 1.2, isAmphibious: true },
  us_army_chaparral_sam: { health: 2500, armor: 0.48, speed: 5.2, damage: 380, reloadTime: 2.5 },
  usmc_air_assault_65: { health: 2200, armor: 0.40, speed: 4.8, damage: 115, reloadTime: 0.9 },
  usmc_armor_m48: { health: 3800, armor: 0.76, speed: 5.2, damage: 420, reloadTime: 2.4 },
  us_m26_pershing: { health: 3600, armor: 0.74, speed: 4.4, damage: 400, reloadTime: 2.4 },
  us_m551_sheridan: { health: 1500, armor: 0.32, speed: 6.2, damage: 330, reloadTime: 3.0, isAmphibious: true }, // aluminium hull swims with its flotation screen
  usmc_ontos_m50: { health: 2400, armor: 0.45, speed: 6.2, damage: 680, reloadTime: 3.6 },
  usmc_lvtp5a1: { health: 3200, armor: 0.62, speed: 5.0, damage: 280, reloadTime: 1.8, isAmphibious: true },
  opfor_vietnam_sapper: { health: 1800, armor: 0.35, speed: 5.2, damage: 140, reloadTime: 0.8 },
  opfor_pt76_amphib: { health: 2600, armor: 0.50, speed: 5.5, damage: 260, reloadTime: 2.0, isAmphibious: true },
  opfor_t54_tank: { health: 3600, armor: 0.74, speed: 4.8, damage: 440, reloadTime: 2.5 },
  opfor_zsu23_shilka: { health: 2800, armor: 0.52, speed: 5.5, damage: 220, reloadTime: 0.4 },
  opfor_zu23_aa: { health: 2200, armor: 0.42, speed: 2.6, damage: 180, reloadTime: 0.6 },
  us_army_rifle_83: { health: 2300, armor: 0.42, speed: 4.8, damage: 135, reloadTime: 0.85 },
  usmc_rifle_83: { health: 2400, armor: 0.44, speed: 4.9, damage: 145, reloadTime: 0.85 },
  us_dragon_atgm: { health: 2100, armor: 0.38, speed: 4.2, damage: 580, reloadTime: 2.8 },
  usmc_aav7a1: { health: 3400, armor: 0.65, speed: 5.2, damage: 320, reloadTime: 1.6, isAmphibious: true },
  usmc_lav25: { health: 3100, armor: 0.58, speed: 6.8, damage: 340, reloadTime: 1.1, isAmphibious: true },
  us_m60a1_rise: { health: 4200, armor: 0.80, speed: 5.2, damage: 520, reloadTime: 2.2 },
  us_m1a1_abrams: { health: 5400, armor: 0.86, speed: 7.2, damage: 900, reloadTime: 2.0 },
  us_m1ip_abrams: { health: 5000, armor: 0.88, speed: 6.2, damage: 620, reloadTime: 2.0 },
  us_m198_155: { health: 2800, armor: 0.48, speed: 2.2, damage: 580, reloadTime: 3.5 },
  usmc_lav_ad: { health: 2900, armor: 0.54, speed: 6.6, damage: 380, reloadTime: 1.2 },
  us_m163_vads: { health: 3000, armor: 0.58, speed: 5.8, damage: 360, reloadTime: 0.5 },
  us_m2_bradley: { health: 3300, armor: 0.62, speed: 6.4, damage: 680, reloadTime: 2.2, isAmphibious: true }, // TOW-2 heavy ATGM
  opfor_motor_rifle_83: { health: 2250, armor: 0.42, speed: 4.8, damage: 130, reloadTime: 0.85 },
  opfor_bmp2: { health: 3200, armor: 0.60, speed: 6.2, damage: 360, reloadTime: 1.2, isAmphibious: true },
  opfor_t72b: { health: 4600, armor: 0.84, speed: 5.5, damage: 590, reloadTime: 2.2 },
  opfor_t80b: { health: 4900, armor: 0.87, speed: 6.5, damage: 640, reloadTime: 2.0 },
  opfor_2s1: { health: 3000, armor: 0.52, speed: 5.0, damage: 520, reloadTime: 3.2, isAmphibious: true },
  opfor_tunguska: { health: 3300, armor: 0.56, speed: 5.8, damage: 450, reloadTime: 0.8 },
  opfor_strela10: { health: 2700, armor: 0.50, speed: 5.6, damage: 400, reloadTime: 1.8, isAmphibious: true },
  us_m270_mlrs: { health: 3600, armor: 0.55, speed: 4.8, damage: 380, reloadTime: 28.0 },
  us_m270_atacms: { health: 3800, armor: 0.55, speed: 4.8, damage: 2400, reloadTime: 32.0 }, // M57 Bunker Buster Warhead
  opfor_bm21_grad: { health: 2600, armor: 0.35, speed: 5.8, damage: 320, reloadTime: 26.0 },
  opfor_bm27_uragan: { health: 3200, armor: 0.42, speed: 5.2, damage: 520, reloadTime: 30.0 },
  opfor_scud_tel: { health: 3600, armor: 0.45, speed: 4.2, damage: 1400, reloadTime: 30.0 },
  us_m4_calliope: { health: 3200, armor: 0.65, speed: 4.6, damage: 220, reloadTime: 22.0 }, // 60發密集火箭覆蓋
  us_m7_priest: { health: 2700, armor: 0.52, speed: 4.8, damage: 380, reloadTime: 3.6 },
  opfor_hummel: { health: 2600, armor: 0.45, speed: 4.4, damage: 490, reloadTime: 4.2 },
  us_m44_spg: { health: 3200, armor: 0.55, speed: 5.2, damage: 510, reloadTime: 3.8 },
  opfor_su100: { health: 3400, armor: 0.68, speed: 4.8, damage: 530, reloadTime: 3.8 },
  us_m109_spg: { health: 3400, armor: 0.58, speed: 5.4, damage: 560, reloadTime: 3.5 },
  opfor_2s3: { health: 3300, armor: 0.56, speed: 5.2, damage: 550, reloadTime: 3.6 },
  us_m109a6_paladin: { health: 3800, armor: 0.62, speed: 5.6, damage: 620, reloadTime: 3.0 },
  opfor_2s19: { health: 4000, armor: 0.65, speed: 5.6, damage: 640, reloadTime: 2.8 },
  us_atacms_nuclear: { health: 3800, armor: 0.55, speed: 4.8, damage: 45000, reloadTime: 40.0 }, // 戰術核彈頭
  opfor_scud_nuclear: { health: 3600, armor: 0.45, speed: 4.2, damage: 45000, reloadTime: 40.0 },
  opfor_zsu57_2: { health: 3100, armor: 0.50, speed: 5.4, damage: 280, reloadTime: 0.7 },
  opfor_sa6_kub: { health: 3200, armor: 0.54, speed: 5.2, damage: 620, reloadTime: 4.2 },
  opfor_sa9_strela1: { health: 2400, armor: 0.44, speed: 6.2, damage: 380, reloadTime: 2.6, isAmphibious: true },
  opfor_sa8_osa: { health: 3000, armor: 0.50, speed: 6.0, damage: 540, reloadTime: 3.2, isAmphibious: true },
  opfor_sa11_buk: { health: 3600, armor: 0.58, speed: 5.4, damage: 740, reloadTime: 3.0 },
  opfor_sa15_tor: { health: 3500, armor: 0.58, speed: 5.6, damage: 620, reloadTime: 2.2 },
  opfor_btr_zd: { health: 2500, armor: 0.46, speed: 6.1, damage: 240, reloadTime: 0.5, isAmphibious: true },
};

/** Indirect-fire units: towed and self-propelled guns, rocket artillery and ballistic missiles. */
export const ARTILLERY_UNIT_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'us_m4_calliope',
  'us_m7_priest',
  'us_m44_spg',
  'us_m109_spg',
  'us_m109a6_paladin',
  'usmc_howitzer_155',
  'usmc_artillery_105',
  'us_m198_155',
  'us_m270_mlrs',
  'us_m270_atacms',
  'us_atacms_nuclear',
  'opfor_hummel',
  'opfor_su100',
  'opfor_2s3',
  'opfor_field_artillery',
  'opfor_2s1',
  'opfor_2s19',
  'opfor_bm21_grad',
  'opfor_bm27_uragan',
  'opfor_scud_tel',
  'opfor_scud_nuclear',
]);

/** Self-propelled guns (counter-battery capable). */
export const SPG_UNIT_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'us_m7_priest',
  'us_m44_spg',
  'us_m109_spg',
  'us_m109a6_paladin',
  'opfor_hummel',
  'opfor_su100',
  'opfor_2s3',
  'opfor_2s1',
  'opfor_2s19',
]);

/** Multiple rocket launchers. */
export const MLRS_UNIT_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'us_m4_calliope',
  'us_m270_mlrs',
  'opfor_bm21_grad',
  'opfor_bm27_uragan',
]);

/** Nuclear-armed missile launchers. */
export const NUCLEAR_TEL_UNIT_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'us_atacms_nuclear',
  'opfor_scud_nuclear',
]);

/** Units fielded as a battery (artillery, rocket and air-defence); the rest are platoons unless listed as companies. */
export const BATTERY_ECHELON_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'us_m4_calliope',
  'us_m7_priest',
  'us_m44_spg',
  'us_m109_spg',
  'us_m109a6_paladin',
  'usmc_howitzer_155',
  'usmc_duster_m42',
  'usmc_artillery_105',
  'us_m198_155',
  'us_m163_vads',
  'us_m270_mlrs',
  'us_m270_atacms',
  'us_atacms_nuclear',
  'opfor_hummel',
  'opfor_2s3',
  'opfor_zsu23_shilka',
  'opfor_zu23_aa',
  'opfor_s60_flak',
  'opfor_field_artillery',
  'opfor_2s1',
  'opfor_2s19',
  'opfor_tunguska',
  'opfor_strela10',
  'opfor_bm21_grad',
  'opfor_bm27_uragan',
  'opfor_scud_tel',
  'opfor_scud_nuclear',
  'opfor_zsu57_2',
  'opfor_sa6_kub',
  'opfor_sa9_strela1',
  'opfor_sa8_osa',
  'opfor_sa11_buk',
  'opfor_sa15_tor',
  'opfor_btr_zd',
]);

/** Units fielded as a company. */
export const COMPANY_ECHELON_TYPES: ReadonlySet<GroundUnitType> = new Set<GroundUnitType>([
  'opfor_vietnam_sapper',
  'opfor_infantry_ambush',
  'opfor_infantry_patrol',
]);
