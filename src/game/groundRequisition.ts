import { Era, GroundUnitType, RequisitionItem } from '../types/game';

/**
 * One table from a ground requisition's typeTag to the unit it raises, shared by the engine
 * (which spawns it) and the reinforcement menu (which draws its card), so the card always shows
 * the vehicle or team the player will actually get.
 */
export interface GroundRequisitionTarget {
  type: GroundUnitType;
  name: string;
}

type Resolver = (era: Era) => GroundRequisitionTarget;

const fixed = (type: GroundUnitType, name: string): Resolver => () => ({ type, name });

const GROUND_REQUISITIONS: Record<string, Resolver> = {
  // Era-dependent generic entries
  infantry: (era) =>
    era === 'era1'
      ? { type: 'usmc_rifle_42', name: 'USMC 陸戰步兵排 (1942)' }
      : era === 'era2'
      ? { type: 'usmc_rifle_45', name: 'USMC 陸戰突擊步兵排 (1945)' }
      : era === 'era3'
      ? { type: 'usmc_korea_rifle', name: 'USMC 陸戰突擊步兵排 (1950)' }
      : { type: 'usmc_air_assault_65', name: 'USMC 空中突擊/直升機機降排 (1965)' },
  artillery: (era) =>
    era === 'era3' || era === 'era4'
      ? { type: 'usmc_howitzer_155', name: 'USMC M114 155mm 重榴彈砲排' }
      : { type: 'usmc_artillery_105', name: 'USMC M2A1 105mm 砲兵支援排' },
  tank: (era) =>
    era === 'era1'
      ? { type: 'usmc_armor_m3', name: 'USMC M3 斯圖亞特戰車排' }
      : era === 'era2'
      ? { type: 'usmc_armor_m4', name: 'USMC M4A2 薛曼中戰車排' }
      : era === 'era3'
      ? { type: 'usmc_patton_m46', name: 'USMC M46 巴頓主力戰車排' }
      : { type: 'usmc_armor_m48', name: 'USMC M48A3 巴頓中戰車排' },
  lvt: (era) =>
    era === 'era1'
      ? { type: 'usmc_lvt_42', name: 'USMC LVT-1 水牛兩棲機步排' }
      : era === 'era3'
      ? { type: 'usmc_lvtp5', name: 'USMC LVT-P5 兩棲重裝步戰排' }
      : { type: 'usmc_lvt_45', name: 'USMC LVT-4 水牛兩棲突擊排' },
  engineer: fixed('usmc_engineer', 'USN Seabees 戰鬥工兵排'),
  // Fixed entries
  army_rifle_65: fixed('us_army_rifle_platoon_65', '美軍 1965 年型前線常規步槍排'),
  m113_mech: fixed('us_army_m113_mech', 'M113 裝甲運兵機械化步兵排'),
  chaparral_sam: fixed('us_army_chaparral_sam', 'MIM-72 榭樹野戰履帶防空飛彈排'),
  air_assault: fixed('usmc_air_assault_65', 'USMC 空中突擊/直升機機降突擊排 (1965)'),
  armor_m48: fixed('usmc_armor_m48', 'USMC M48A3 巴頓主力戰車排'),
  m551_sheridan: fixed('us_m551_sheridan', 'US Army M551 謝里登裝甲騎兵排'),
  ontos_m50: fixed('usmc_ontos_m50', 'USMC M50 昂圖斯六聯無後座力砲戰車'),
  usmc_lvtp5a1: fixed('usmc_lvtp5a1', 'USMC LVTP-5A1 兩棲重裝登陸裝甲車'),
  army_rifle_83: fixed('us_army_rifle_83', '美陸軍步槍班 (1983)'),
  usmc_rifle_83: fixed('usmc_rifle_83', '陸戰步槍班 (1983)'),
  dragon_atgm: fixed('us_dragon_atgm', 'M47 巨龍反戰車飛彈班'),
  usmc_aav7a1: fixed('usmc_aav7a1', 'AAV-7A1 兩棲突擊載具'),
  usmc_lav25: fixed('usmc_lav25', 'LAV-25 輪型裝甲偵搜車'),
  m60a1_rise: fixed('us_m60a1_rise', 'M60A1 RISE (PASSIVE) ERA 戰車'),
  m1ip_abrams: fixed('us_m1ip_abrams', 'M1IP 艾布蘭主戰戰車'),
  m198_155: fixed('us_m198_155', 'M198 155mm 牽引榴彈砲排'),
  lav_ad: fixed('usmc_lav_ad', 'LAV-AD 25mm防空裝甲車'),
  m163_vads: fixed('us_m163_vads', 'M163 火神 20mm 防空裝甲車'),
  m2_bradley: fixed('us_m2_bradley', 'M2 布雷德利裝甲機步戰車 (TOW-2飛彈+25mm鏈砲)'),
  us_m270_mlrs: fixed('us_m270_mlrs', 'M270 MLRS 多管火箭系統 (12x M39鋼鐵之雨)'),
  us_m270_atacms: fixed('us_m270_atacms', 'MGM-140 ATACMS 戰術飛彈車 (M57碉堡剋星)'),
  us_m4_calliope: fixed('us_m4_calliope', 'M4A3 薛曼「管風琴」60聯裝火箭車'),
  us_m7_priest: fixed('us_m7_priest', 'M7 牧師 105mm 自走榴彈砲 (反砲兵急速射擊)'),
  us_m26_pershing: fixed('us_m26_pershing', 'US Army M26 潘興重戰車排'),
  us_m1a1_abrams: fixed('us_m1a1_abrams', 'M1A1 艾布蘭主力戰車排'),
  us_m44_spg: fixed('us_m44_spg', 'M44 155mm 自走榴彈砲 (反砲兵急速射擊)'),
  us_m109_spg: fixed('us_m109_spg', 'M109 155mm 自走榴彈砲 (長程反砲兵壓制)'),
  us_m109a6_paladin: fixed('us_m109a6_paladin', 'M109A6 帕拉丁 155mm 數位自走砲'),
  us_atacms_nuclear: fixed('us_atacms_nuclear', 'MGM-140B 核武裝 ATACMS 戰術飛彈車 (W70/W85熱核彈頭)'),
  // Additional formations
  usmc_raider_42: fixed('usmc_raider_42', 'USMC 陸戰隊突擊營步兵排 (Raiders)'),
  usmc_37mm_at: fixed('usmc_37mm_at', 'USMC M3 37mm 反戰車砲班'),
  us_army_rifle_45: fixed('us_army_rifle_45', '美陸軍步兵排 (1945 沖繩)'),
  usmc_m4a3r3_flame: fixed('usmc_m4a3r3_flame', 'USMC M4A3R3「打火機」噴火戰車排'),
  us_m24_chaffee: fixed('us_m24_chaffee', 'US Army M24 霞飛輕戰車排'),
  us_m16_quad50: fixed('us_m16_quad50', 'M16 四聯裝 .50 防空半履帶車'),
  us_m113_acav: fixed('us_m113_acav', 'M113 ACAV 裝甲騎兵突擊車排'),
  us_m107_175: fixed('us_m107_175', 'M107 175mm 自走加農砲連'),
  us_hmmwv_tow: fixed('us_hmmwv_tow', 'M966 悍馬 TOW 反戰車飛彈班'),
  us_avenger: fixed('us_avenger', 'M1097 復仇者 刺針防空車'),
};

export function resolveGroundRequisition(typeTag: string, era: Era): GroundRequisitionTarget | null {
  return GROUND_REQUISITIONS[typeTag]?.(era) ?? null;
}

/** Era-specific additions to the reinforcement menu. */
const ADDITIONAL_GROUND_ITEMS: Partial<Record<Era, Omit<RequisitionItem, 'category' | 'era'>[]>> = {
  era1: [
    { id: 'req-ground-raiders', name: 'USMC 陸戰隊突擊營步兵排 (Raiders)', cost: 140, badge: '湯普森+BAR+詹森機槍', desc: '卡爾森與艾森突擊營的精銳步兵，以大量湯普森衝鋒槍與 BAR 組成火力小組，擅長夜間滲透與叢林突襲（馬金島、瓜島長征）。', statsDesc: '近戰火力強 | 移動快 | 400m', typeTag: 'usmc_raider_42' },
    { id: 'req-ground-37mm-at', name: 'USMC M3 37mm 反戰車砲班', cost: 130, badge: '37mm 穿甲/霰彈', desc: '瓜島泰納魯河口以 37mm 霰彈擊退一木支隊衝鋒的經典火砲；對九五式、九七式戰車有效。', statsDesc: '反裝甲 | 牽引 | 1000m', typeTag: 'usmc_37mm_at' },
  ],
  era2: [
    { id: 'req-ground-army-45', name: '美陸軍步兵排 (1945 沖繩)', cost: 110, badge: '加蘭德+BAR+巴祖卡', desc: '第7、77、96步兵師的步兵排，與陸戰隊並肩攻打沖繩首里防線。', statsDesc: '標準步兵 | 500m', typeTag: 'us_army_rifle_45' },
    { id: 'req-ground-zippo', name: 'USMC M4A3R3「打火機」噴火戰車排', cost: 300, badge: '主砲換裝噴火器', desc: '以 POA-CWS-H1 噴火器取代 75mm 主砲的薛曼，硫磺島與沖繩清除洞窟碉堡的關鍵武器。', statsDesc: '噴火射程 150m | 對碉堡/步兵極強', typeTag: 'usmc_m4a3r3_flame' },
  ],
  era3: [
    { id: 'req-ground-chaffee', name: 'US Army M24 霞飛輕戰車排', cost: 230, badge: '75mm M6 · 高機動', desc: '1950 年 7 月首批抵韓的美軍戰車，裝甲薄弱但機動快，擔任偵察與步兵支援。', statsDesc: '輕戰車 | 75mm | 1300m', typeTag: 'us_m24_chaffee' },
    { id: 'req-ground-quad50', name: 'M16 四聯裝 .50 防空半履帶車', cost: 200, badge: 'M45 四聯 .50 機槍', desc: '韓戰中常以平射壓制中共人海衝鋒的「絞肉機」，同時提供低空防空。', statsDesc: '防空 + 對步兵壓制 | 1200m', typeTag: 'us_m16_quad50' },
  ],
  era4: [
    { id: 'req-ground-acav', name: 'M113 ACAV 裝甲騎兵突擊車排', cost: 240, badge: '三挺機槍+防盾', desc: '第11裝甲騎兵團在越南把 M113 改成「裝甲騎兵突擊車」，車長 .50 機槍與兩側 M60 都加裝防盾，穿越叢林正面衝擊。', statsDesc: '機動火力 | 兩棲 | 1500m', typeTag: 'us_m113_acav' },
    { id: 'req-ground-m107', name: 'M107 175mm 自走加農砲連', cost: 420, badge: '175mm · 32 km', desc: '越戰美軍射程最遠的火砲，自非軍事區南側的「岩石堆」等火力基地轟擊北越縱深。', statsDesc: '長程火力 | 反砲擊 | 32.7 km', typeTag: 'us_m107_175' },
  ],
  era5: [
    { id: 'req-ground-hmmwv-tow', name: 'M966 悍馬 TOW 反戰車飛彈班', cost: 220, badge: 'BGM-71 TOW-2', desc: '輕型步兵師與陸戰隊的機動反戰車主力，3750m 外以 TOW-2 擊破 T-72。', statsDesc: '反裝甲 | 高機動 | 3750m', typeTag: 'us_hmmwv_tow' },
    { id: 'req-ground-avenger', name: 'M1097 復仇者 刺針防空車', cost: 260, badge: '8 枚刺針 + .50 機槍', desc: '1990 年起服役的悍馬底盤短程防空系統，兩具四聯刺針發射箱可行進間射擊。', statsDesc: '短程防空 | 4800m', typeTag: 'us_avenger' },
  ],
};

/** Adds the era's extra ground entries and tags every ground entry with the unit it raises. */
export function withGroundRequisitions(items: RequisitionItem[], era: Era): RequisitionItem[] {
  const extra: RequisitionItem[] = (ADDITIONAL_GROUND_ITEMS[era] ?? []).map((it) => ({ ...it, category: 'ground', era }));
  const all = [...items];
  // Ground entries go before the installations block
  const firstInstallation = all.findIndex((it) => it.category === 'installations');
  all.splice(firstInstallation < 0 ? all.length : firstInstallation, 0, ...extra);
  return all.map((it) => (it.category === 'ground' ? { ...it, unitType: resolveGroundRequisition(it.typeTag, era)?.type } : it));
}
