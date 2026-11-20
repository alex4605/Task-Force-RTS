import { Era, GroundUnitType, InstallationType } from '../types/game';

/**
 * One range scale for land, sea and air.
 *
 * Real engagement ranges span three orders of magnitude, from a rifle squad (~0.45 km) to a
 * P-700 Granit (625 km), which no RTS map can show to scale. Every weapon's historical range
 * is therefore passed through the same compressive curve so that cross-arm ordering stays
 * historical (a 16" battleship gun out-ranges a 155mm howitzer, which out-ranges a tank gun),
 * while the overall span matches the game map. The curve is anchored on the game's existing
 * extremes: a WWII rifle squad at 650 and the P-700 at 5000.
 *
 *   range = 650 * (km / 0.45) ^ 0.282
 *
 *   0.45 km rifle ......... 650     2 km tank gun ....... 990     11 km 105mm ........ 1600
 *   16.6 km 5"/38 ........ 1800    24 km SA-6 .......... 1990    38.7 km 16"/50 ..... 2280
 *   124 km Harpoon ....... 3100    190 km AIM-54 ....... 3500    300 km Scud ........ 3960
 */
const ANCHOR_KM = 0.45;
const ANCHOR_RANGE = 650;
const EXPONENT = 0.282;

export function gameRangeFromKm(km: number): number {
  return Math.round(ANCHOR_RANGE * Math.pow(Math.max(0.05, km) / ANCHOR_KM, EXPONENT));
}

/**
 * Historical engagement range (km) of each ground unit's principal weapon: effective range for
 * direct-fire weapons, maximum range for artillery, rockets and surface-to-air missiles.
 * Exhaustive, so a new GroundUnitType without a range is a compile error.
 */
export const GROUND_UNIT_RANGE_KM: Record<GroundUnitType, number> = {
  // WWII infantry and armour
  usmc_rifle_42: 0.46, // M1 Garand
  usmc_rifle_45: 0.5, // M1 Garand + BAR
  usmc_armor_m3: 1.0, // M3 Stuart 37mm
  usmc_armor_m4: 1.5, // M4 Sherman 75mm
  usmc_lvt_42: 1.0, // LVT-2 .30 / .50 cal
  usmc_lvt_45: 2.0, // LVT(A)-4 75mm howitzer, direct fire
  usmc_engineer: 0.3, // flamethrowers / demolition charges
  usmc_artillery_105: 11.3, // M2A1 105mm
  opfor_infantry_42: 0.46, // Type 38 Arisaka
  opfor_infantry_45: 0.5, // Type 99 + Type 96 LMG
  opfor_mortar_platoon: 2.8, // Type 97 81mm mortar
  opfor_infantry_ambush: 0.3,
  opfor_infantry_patrol: 0.4,
  opfor_type95_tank: 1.0, // Type 98 37mm
  opfor_type97_tank: 1.2, // Type 1 47mm
  opfor_field_artillery: 10.8, // Type 91 10cm howitzer
  // Korean War
  usmc_korea_rifle: 0.46,
  us_army_infantry_korea: 0.5,
  us_army_armor_korea: 1.8, // M4A3E8 76mm / M46 90mm
  usmc_lvtp5: 1.0,
  usmc_patton_m46: 2.0, // M3A1 90mm
  usmc_howitzer_155: 14.6, // M114 155mm
  usmc_duster_m42: 4.0, // twin 40mm Bofors, effective AA range
  opfor_coldwar_infantry: 0.5,
  opfor_t34_85: 1.5, // ZiS-S-53 85mm
  opfor_is3_heavy: 2.0, // D-25T 122mm
  opfor_s60_flak: 6.0, // S-60 57mm, effective AA range
  opfor_ks19_heavy: 12.0, // KS-19 100mm AA ceiling
  // Vietnam era
  us_army_rifle_platoon_65: 0.5,
  us_army_m113_mech: 1.5, // M2 .50 cal
  us_army_chaparral_sam: 9.0, // MIM-72
  usmc_air_assault_65: 0.5,
  usmc_armor_m48: 2.0, // M41 90mm
  usmc_ontos_m50: 1.1, // M40 106mm recoilless rifle
  us_m26_pershing: 2.0, // M3 90mm
  us_m551_sheridan: 2.0, // M81 152mm gun-launcher (HEAT / canister in Vietnam)
  usmc_lvtp5a1: 1.5,
  opfor_vietnam_sapper: 0.2,
  opfor_pt76_amphib: 1.5, // D-56T 76mm
  opfor_t54_tank: 2.0, // D-10T 100mm
  opfor_zsu23_shilka: 2.5, // 4x 23mm
  opfor_zu23_aa: 2.5, // ZU-23-2
  // Late Cold War
  us_army_rifle_83: 0.6, // M16A2 / M249 / M203
  usmc_rifle_83: 0.6,
  us_dragon_atgm: 1.0, // M47 Dragon
  usmc_aav7a1: 1.6, // Mk 19 / M2
  usmc_lav25: 2.5, // M242 25mm
  us_m60a1_rise: 3.0, // M68 105mm
  us_m1ip_abrams: 3.0, // M68A1 105mm
  us_m1a1_abrams: 3.5, // M256 120mm
  us_m198_155: 22.4, // M198 155mm (standard round)
  usmc_lav_ad: 4.8, // Stinger
  us_m163_vads: 1.8, // M61 20mm
  us_m2_bradley: 3.75, // TOW
  opfor_motor_rifle_83: 0.6, // AK-74 / PKM / RPG-7
  opfor_bmp2: 4.0, // 9M113 Konkurs
  opfor_t72b: 4.0, // 9M119 Svir gun-launched ATGM
  opfor_t80b: 4.0, // 9M112 Kobra
  opfor_2s1: 15.2, // 2A31 122mm
  opfor_tunguska: 8.0, // 9M311
  opfor_strela10: 5.0, // 9K35
  // Rocket artillery and ballistic missiles
  us_m270_mlrs: 32, // M26 rocket
  us_m270_atacms: 165, // MGM-140 Block I
  opfor_bm21_grad: 20.4,
  opfor_bm27_uragan: 35,
  opfor_scud_tel: 300, // R-17
  us_m4_calliope: 3.8, // T34 4.5in rockets
  us_atacms_nuclear: 165,
  opfor_scud_nuclear: 300,
  // Self-propelled guns
  us_m7_priest: 11.2, // M2A1 105mm
  opfor_hummel: 13.3, // sFH 18 150mm
  us_m44_spg: 14.6, // M45 155mm
  opfor_su100: 15.4, // D-10S 100mm, indirect
  us_m109_spg: 14.6, // M126 155mm
  opfor_2s3: 18.5, // 2A33 152mm
  us_m109a6_paladin: 24, // M284 155mm
  opfor_2s19: 24.7, // 2A64 152mm
  // Air defence vehicles
  opfor_zsu57_2: 4.0, // twin 57mm, effective
  opfor_sa6_kub: 24,
  opfor_sa9_strela1: 4.2,
  opfor_sa8_osa: 10,
  opfor_sa11_buk: 35,
  opfor_sa15_tor: 12,
  opfor_btr_zd: 2.0, // ZU-23-2
  // Additional US formations
  usmc_raider_42: 0.4, // Thompson / BAR / Johnson LMG
  usmc_37mm_at: 1.0, // M3 37mm
  us_army_rifle_45: 0.5,
  usmc_m4a3r3_flame: 0.15, // flame gun
  us_m24_chaffee: 1.3, // M6 75mm
  us_m16_quad50: 1.2, // M45 quad .50, effective AA
  us_m113_acav: 1.5, // M2 .50 cal
  us_m107_175: 32.7, // M113 175mm
  us_hmmwv_tow: 3.75, // TOW-2
  us_avenger: 4.8, // Stinger
  // Allied formations
  cw_infantry_ww2: 0.5, // Lee-Enfield / Bren
  au_matilda: 1.0, // 2pdr / 3in CS howitzer
  rok_infantry_50: 0.46,
  cw_infantry_50: 0.5,
  cw_centurion: 2.0, // 20pdr
  rok_marine_65: 0.5,
  arvn_ranger_65: 0.5,
  au_rar_65: 0.55, // L1A1 SLR / M60
  arvn_m41: 1.5, // M32 76mm
  frg_infantry_83: 0.6, // G3 / MG3 / Panzerfaust
  frg_marder: 2.0, // MILAN
  frg_leopard2: 3.0, // Rh 120
  uk_challenger1: 3.0, // L11 120mm
  uk_warrior: 1.5, // L21 RARDEN 30mm
};

export function getGroundUnitRange(type: GroundUnitType): number {
  return gameRangeFromKm(GROUND_UNIT_RANGE_KM[type]);
}

/**
 * Maximum launch range of air-launched guided weapons on the shared scale. Gravity bombs,
 * unguided rockets and torpedoes are delivered from attack geometry, not stand-off range,
 * so they are not listed here.
 */
export const AIR_WEAPON_RANGE = {
  aim54: gameRangeFromKm(190), // AIM-54A Phoenix
  aim7: gameRangeFromKm(45), // AIM-7F Sparrow
  aim9: gameRangeFromKm(18), // AIM-9L Sidewinder
  k13: gameRangeFromKm(7.5), // K-13 / AA-2 Atoll (MiG-21)
  r27er: gameRangeFromKm(130), // R-27ER Alamo
  harpoon: gameRangeFromKm(124), // AGM-84A Harpoon
  kh22: gameRangeFromKm(600), // Kh-22 Burya
  p700: gameRangeFromKm(625), // P-700 Granit
  harm: gameRangeFromKm(150), // AGM-88 HARM
  standardArm: gameRangeFromKm(90), // AGM-78 Standard ARM
  shrike: gameRangeFromKm(40), // AGM-45 Shrike
  maverick: gameRangeFromKm(22), // AGM-65 Maverick
  walleye: gameRangeFromKm(16), // AGM-62 Walleye I
  laserBomb: gameRangeFromKm(14), // GBU-10 Paveway glide envelope
  bullpup: gameRangeFromKm(11), // AGM-12B Bullpup
  hellfire: gameRangeFromKm(8), // AGM-114 Hellfire
  ksr5: gameRangeFromKm(180), // KSR-5 / AS-6 Kingfish (Tu-16)
} as const;

// Garrison equipment ranges (km) per era: [infantry, tank, field artillery, heavy flak].
const GARRISON_KM: Record<Era, { rifle: number; tank: number; gun: number; flak: number }> = {
  era1: { rifle: 0.46, tank: 1.0, gun: 11, flak: 10 }, // M1 Garand / M3 37mm / M2A1 105mm / M2 90mm
  era2: { rifle: 0.5, tank: 1.5, gun: 11, flak: 10 }, // + BAR / M4 75mm
  era3: { rifle: 0.5, tank: 2.0, gun: 14.6, flak: 12 }, // M46 90mm / M114 155mm / KS-19
  era4: { rifle: 0.5, tank: 2.0, gun: 14.6, flak: 12 }, // M48 / M114 / KS-19
  era5: { rifle: 0.6, tank: 3.0, gun: 22.4, flak: 2.5 }, // M1 / M198 / M163, ZSU-23-4
};

/** Coastal gun range from the bore parsed out of its name (240mm "Black Dragon", 15cm, 14", ...). */
function coastalGunKm(name: string): number {
  const mm = name.match(/(\d+(?:\.\d+)?)\s*mm/);
  const inch = name.match(/(\d+(?:\.\d+)?)\s*(?:-inch|吋|")/);
  const cm = name.match(/(\d+(?:\.\d+)?)\s*cm/);
  const bore = mm ? Number(mm[1]) : inch ? Number(inch[1]) * 25.4 : cm ? Number(cm[1]) * 10 : 0;
  if (!bore) return 20;
  if (bore <= 130) return 15;
  if (bore <= 160) return 20;
  if (bore <= 210) return 25;
  if (bore <= 260) return 23; // 240mm M1 howitzer
  return 33;
}

/**
 * Historical range for an armed installation on the shared scale, or null for unarmed ones
 * (radar, cities, depots, command posts...), which keep their authored value.
 */
export function getInstallationRange(type: InstallationType, name: string, era: Era): number | null {
  const g = GARRISON_KM[era];
  const km: number | undefined = (
    {
      coastal_gun: coastalGunKm(name),
      infantry_squad: g.rifle,
      infantry_platoon: g.rifle + 0.1,
      tank_platoon: g.tank,
      tank_battalion: g.tank,
      towed_artillery: g.gun,
      flak_battery: g.flak,
      bunker_nest: 1.0, // heavy machine-gun bunker
      sam_hawk: 40, // MIM-23B I-Hawk
      sam_patriot: 70, // MIM-104 Patriot
      sa2_sam_site: 45, // S-75 Dvina
      sa3_sam_site: 25, // S-125 Neva
      s300_sam_site: 90, // S-300PMU
      coastal_harpoon: 124, // RGM-84
      coastal_rubezh: 80, // P-15M Termit
      glcm_site: 2500, // BGM-109G Gryphon
      scud_site: 300, // R-17
    } as Partial<Record<InstallationType, number>>
  )[type];
  return km === undefined ? null : gameRangeFromKm(km);
}
