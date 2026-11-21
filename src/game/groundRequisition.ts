import { Era, GroundUnitType, Installation, RequisitionItem } from '../types/game';
import { groundSilhouetteClass } from './unitPreviewRenderer';

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
  us_redeye_team: fixed('us_redeye_team', 'FIM-43 紅眼肩射防空飛彈小組'),
  us_stinger_team: fixed('us_stinger_team', 'FIM-92 刺針肩射防空飛彈小組'),
  usmc_90mm_aa_42: fixed('usmc_90mm_aa_42', 'USMC 90mm M1 高射砲連 (第3防衛營)'),
  usmc_40mm_bofors_45: fixed('usmc_40mm_bofors_45', 'USMC 40mm 波佛斯高射砲排'),
  us_m16_quad50: fixed('us_m16_quad50', 'M16 四聯裝 .50 防空半履帶車'),
  us_m113_acav: fixed('us_m113_acav', 'M113 ACAV 裝甲騎兵突擊車排'),
  us_m107_175: fixed('us_m107_175', 'M107 175mm 自走加農砲連'),
  us_hmmwv_tow: fixed('us_hmmwv_tow', 'M966 悍馬 TOW 反戰車飛彈班'),
  us_avenger: fixed('us_avenger', 'M1097 復仇者 刺針防空車'),
  // Special operations forces
  sof_coastwatcher_42: fixed('sof_coastwatcher_42', '澳紐海岸監視員偵搜組 (Coastwatchers)'),
  sof_alamo_scouts_45: fixed('sof_alamo_scouts_45', '第6軍阿拉莫偵察隊 (Alamo Scouts)'),
  sof_udt_45: fixed('sof_udt_45', '海軍水下爆破隊 (UDT)'),
  sof_ranger_50: fixed('sof_ranger_50', '第8軍遊騎兵連 (Eighth Army Rangers)'),
  sof_udt_50: fixed('sof_udt_50', 'UDT-1 水下爆破隊'),
  sof_seal_65: fixed('sof_seal_65', '海豹第一分隊 (SEAL Team One)'),
  sof_macv_sog_65: fixed('sof_macv_sog_65', 'MACV-SOG 跨境偵察小組'),
  sof_force_recon_83: fixed('sof_force_recon_83', '陸戰隊武裝偵察排 (Force Recon)'),
  sof_seal_83: fixed('sof_seal_83', '海豹第四分隊 (SEAL Team Four)'),
  sof_ranger_83: fixed('sof_ranger_83', '第75遊騎兵團排 (Rangers)'),
};

export function resolveGroundRequisition(typeTag: string, era: Era): GroundRequisitionTarget | null {
  return GROUND_REQUISITIONS[typeTag]?.(era) ?? null;
}

/** Era-specific additions to the reinforcement menu. */
const ADDITIONAL_GROUND_ITEMS: Partial<Record<Era, Omit<RequisitionItem, 'category' | 'era'>[]>> = {
  era1: [
    { id: 'req-ground-raiders', name: 'USMC 陸戰隊突擊營步兵排 (Raiders)', cost: 140, badge: '湯普森+BAR+詹森機槍', desc: '卡爾森與艾森突擊營的精銳步兵，以大量湯普森衝鋒槍與 BAR 組成火力小組，擅長夜間滲透與叢林突襲（馬金島、瓜島長征）。', statsDesc: '近戰火力強 | 移動快 | 400m', typeTag: 'usmc_raider_42' },
    { id: 'req-sof-coastwatcher', name: '【SOF】澳紐海岸監視員偵搜組', cost: 160, badge: '敵後無線電預警', desc: '潛伏在所羅門群島山區的澳洲海岸監視員，以無線電通報日軍艦隊與機群動向，讓韓德森機場提早升空攔截。', statsDesc: '隱蔽 | 偵察：艦船 3000m・機群 4200m | 戰鬥力弱', typeTag: 'sof_coastwatcher_42' },
    { id: 'req-ground-90mm-aa', name: 'USMC 90mm M1 高射砲連 (牽引)', cost: 190, badge: '90mm 高射砲 · 防空', desc: '陸戰隊第3防衛營的 90mm 高射砲連，1942 年 8 月隨首波登陸瓜島，架設在韓德森機場周邊迎擊日軍一式陸攻的高空轟炸；當年陸戰隊尚無自走防空砲。', statsDesc: '牽引式 | 中高空防空 | 1800m | 移動緩慢', typeTag: 'usmc_90mm_aa_42' },
    { id: 'req-ground-37mm-at', name: 'USMC M3 37mm 反戰車砲班', cost: 130, badge: '37mm 穿甲/霰彈', desc: '瓜島泰納魯河口以 37mm 霰彈擊退一木支隊衝鋒的經典火砲；對九五式、九七式戰車有效。', statsDesc: '反裝甲 | 牽引 | 1000m', typeTag: 'usmc_37mm_at' },
  ],
  era2: [
    { id: 'req-ground-army-45', name: '美陸軍步兵排 (1945 沖繩)', cost: 110, badge: '加蘭德+BAR+巴祖卡', desc: '第7、77、96步兵師的步兵排，與陸戰隊並肩攻打沖繩首里防線。', statsDesc: '標準步兵 | 500m', typeTag: 'us_army_rifle_45' },
    { id: 'req-sof-alamo', name: '【SOF】第6軍阿拉莫偵察隊', cost: 200, badge: '敵後偵察 · 突襲營救', desc: '克魯格將軍的精銳偵察隊，深入呂宋敵後偵察，並引導遊騎兵突襲卡巴納圖安戰俘營。', statsDesc: '隱蔽 | 偵察 | 據點奪取加速 | 爆破設施 ×3', typeTag: 'sof_alamo_scouts_45' },
    { id: 'req-sof-udt-45', name: '【SOF】海軍水下爆破隊 (UDT)', cost: 180, badge: '泳渡 · 灘頭爆破', desc: '「赤裸戰士」在登陸前泳渡至灘頭，以炸藥清除珊瑚礁與水中障礙，沖繩與硫磺島登陸的先鋒。', statsDesc: '兩棲泳渡 | 隱蔽 | 爆破設施 ×3', typeTag: 'sof_udt_45' },
    { id: 'req-ground-40mm-bofors', name: 'USMC 40mm 波佛斯高射砲排 (牽引)', cost: 150, badge: '40mm M1 · 低空防空', desc: '陸戰隊防空營的 40mm M1 波佛斯砲，硫磺島與沖繩灘頭對抗神風機與夜間空襲的主力輕防空砲。', statsDesc: '牽引式 | 低空防空 | 1300m', typeTag: 'usmc_40mm_bofors_45' },
    { id: 'req-ground-quad50-45', name: 'M16 四聯裝 .50 防空半履帶車', cost: 200, badge: 'M45 四聯 .50 · 自走', desc: '1943 年起服役的自走防空車，1945 年隨陸軍各師登上沖繩，對低空神風機與步兵衝鋒都極具威力。', statsDesc: '自走防空 + 對步兵壓制 | 1000m', typeTag: 'us_m16_quad50' },
    { id: 'req-ground-zippo', name: 'USMC M4A3R3「打火機」噴火戰車排', cost: 300, badge: '主砲換裝噴火器', desc: '以 POA-CWS-H1 噴火器取代 75mm 主砲的薛曼，硫磺島與沖繩清除洞窟碉堡的關鍵武器。', statsDesc: '噴火射程 150m | 對碉堡/步兵極強', typeTag: 'usmc_m4a3r3_flame' },
  ],
  era3: [
    { id: 'req-ground-chaffee', name: 'US Army M24 霞飛輕戰車排', cost: 230, badge: '75mm M6 · 高機動', desc: '1950 年 7 月首批抵韓的美軍戰車，裝甲薄弱但機動快，擔任偵察與步兵支援。', statsDesc: '輕戰車 | 75mm | 1300m', typeTag: 'us_m24_chaffee' },
    { id: 'req-sof-ranger-50', name: '【SOF】第8軍遊騎兵連', cost: 230, badge: '夜間滲透突擊', desc: '韓戰中組建的空降遊騎兵連，以夜間滲透突襲中共軍陣地與指揮所。', statsDesc: '隱蔽 | 據點奪取加速 | 爆破設施 ×3', typeTag: 'sof_ranger_50' },
    { id: 'req-sof-udt-50', name: '【SOF】UDT-1 水下爆破隊', cost: 190, badge: '海岸爆破襲擊', desc: '自驅逐艦出發，夜間登岸炸毀北韓東海岸鐵路隧道與橋樑，也為仁川登陸勘察灘頭。', statsDesc: '兩棲泳渡 | 隱蔽 | 爆破設施 ×3', typeTag: 'sof_udt_50' },
    { id: 'req-ground-quad50', name: 'M16 四聯裝 .50 防空半履帶車', cost: 200, badge: 'M45 四聯 .50 機槍', desc: '韓戰中常以平射壓制中共人海衝鋒的「絞肉機」，同時提供低空防空。', statsDesc: '防空 + 對步兵壓制 | 1200m', typeTag: 'us_m16_quad50' },
  ],
  era4: [
    { id: 'req-ground-acav', name: 'M113 ACAV 裝甲騎兵突擊車排', cost: 240, badge: '三挺機槍+防盾', desc: '第11裝甲騎兵團在越南把 M113 改成「裝甲騎兵突擊車」，車長 .50 機槍與兩側 M60 都加裝防盾，穿越叢林正面衝擊。', statsDesc: '機動火力 | 兩棲 | 1500m', typeTag: 'us_m113_acav' },
    { id: 'req-sof-seal-65', name: '【SOF】海豹第一分隊 (SEAL)', cost: 280, badge: '湄公河伏擊', desc: '在湄公河三角洲以小艇滲透，夜間伏擊越共運補與綁架指揮幹部的海軍特戰隊。', statsDesc: '兩棲 | 隱蔽 | 爆破設施 ×3 | 據點奪取加速', typeTag: 'sof_seal_65' },
    { id: 'req-sof-sog', name: '【SOF】MACV-SOG 跨境偵察小組', cost: 260, badge: '胡志明小道偵察', desc: '美軍綠扁帽與南越、蒙達納族隊員組成的偵察小組，深入寮國與柬埔寨監視胡志明小道。', statsDesc: '隱蔽 | 偵察：艦船 3000m・機群 4200m', typeTag: 'sof_macv_sog_65' },
    { id: 'req-ground-redeye', name: 'FIM-43 紅眼肩射防空飛彈小組', cost: 120, badge: '紅外線尾追 · 肩射', desc: '1968 年起配發陸戰隊與陸軍的第一代肩射防空飛彈，兩人小組隨步兵行動，只能從後方追擊低空噴射機的尾焰。', statsDesc: '輕裝 | 低空防空 | 4.5 km | 裝填慢', typeTag: 'us_redeye_team' },
    { id: 'req-ground-m107', name: 'M107 175mm 自走加農砲連', cost: 420, badge: '175mm · 32 km', desc: '越戰美軍射程最遠的火砲，自非軍事區南側的「岩石堆」等火力基地轟擊北越縱深。', statsDesc: '長程火力 | 反砲擊 | 32.7 km', typeTag: 'us_m107_175' },
  ],
  era5: [
    { id: 'req-ground-hmmwv-tow', name: 'M966 悍馬 TOW 反戰車飛彈班', cost: 220, badge: 'BGM-71 TOW-2', desc: '輕型步兵師與陸戰隊的機動反戰車主力，3750m 外以 TOW-2 擊破 T-72。', statsDesc: '反裝甲 | 高機動 | 3750m', typeTag: 'us_hmmwv_tow' },
    { id: 'req-sof-force-recon', name: '【SOF】陸戰隊武裝偵察排', cost: 280, badge: '兩棲偵察', desc: '以潛艦或橡皮艇滲透上岸，在登陸前偵察灘頭與敵陣地的陸戰隊特種偵察兵。', statsDesc: '兩棲 | 隱蔽 | 偵察：艦船 3000m・機群 4200m', typeTag: 'sof_force_recon_83' },
    { id: 'req-sof-seal-83', name: '【SOF】海豹第四分隊 (SEAL)', cost: 320, badge: '直接行動', desc: '1983 年格瑞那達行動中突襲總督府與廣播電台的海軍特戰隊。', statsDesc: '兩棲 | 隱蔽 | 爆破設施 ×3 | 據點奪取加速', typeTag: 'sof_seal_83' },
    { id: 'req-sof-ranger-83', name: '【SOF】第75遊騎兵團排', cost: 300, badge: '機場奪取', desc: '緊急狂怒行動中低空傘降奪取薩林斯角機場的遊騎兵。', statsDesc: '隱蔽 | 據點奪取加速 | 爆破設施 ×3 | 戰鬥力強', typeTag: 'sof_ranger_83' },
    { id: 'req-ground-stinger', name: 'FIM-92 刺針肩射防空飛彈小組', cost: 140, badge: '全向紅外線 · 肩射', desc: '1981 年起服役的第二代肩射防空飛彈，可迎頭攻擊並配有敵我識別，兩人小組可隨步兵或乘直升機進入前線。', statsDesc: '輕裝 | 低空防空 | 4.8 km', typeTag: 'us_stinger_team' },
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

// ── Who can call what ─────────────────────────────────────────────────────

/**
 * Where ground reinforcements can be called to:
 * - the HQ (the command posts the campaign starts with) can raise anything;
 * - a forward command post the player builds handles light troops only: infantry, recon and
 *   special forces, engineers, mortar, anti-tank and MANPAD teams;
 * - a motor pool (調車場) brings up the vehicles and the guns that need prime movers: tanks,
 *   APCs and IFVs, self-propelled and towed artillery, rocket launchers, AA vehicles.
 */
export type RallyKind = 'hq' | 'forward' | 'motor_pool';

export function rallyKind(inst: Installation): RallyKind {
  if (inst.type === 'motor_pool') return 'motor_pool';
  return inst.id.startsWith('inst-built-') ? 'forward' : 'hq';
}

export const RALLY_LABEL: Record<RallyKind, string> = {
  hq: 'HQ 指揮所（全部類型）',
  forward: '前線指揮所（僅輕裝單位）',
  motor_pool: '調車場（裝甲 / 車輛 / 火砲）',
};

/** Light units: what walks in or comes up by truck with the infantry. */
export function isLightGroundUnit(type: GroundUnitType): boolean {
  const cls = groundSilhouetteClass(type);
  return cls === 'infantry' || cls === 'mortar' || cls === 'atgm' || cls === 'engineer';
}

export function canCallFrom(kind: RallyKind, type: GroundUnitType): boolean {
  if (kind === 'hq') return true;
  const light = isLightGroundUnit(type);
  return kind === 'forward' ? light : !light;
}
