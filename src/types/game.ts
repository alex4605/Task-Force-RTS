export interface Vector2D {
  x: number;
  y: number;
}

export type Era = 'era1' | 'era2' | 'era3' | 'era4';

export type ShipType =
  | 'carrier'
  | 'battleship'
  | 'cruiser'
  | 'destroyer'
  | 'submarine'
  | 'patrol_boat'
  | 'lcvp'
  | 'lst'
  | 'lsm_r'
  | 'cve'
  | 'cv63'    // 時代四 偽鷹號 (CV-63 Kitty Hawk) 超級航空母艦
  | 'cg'      // 時代四 貝爾納普級 (CG-26 Belknap) 導向飛彈巡洋艦
  | 'ddg'     // 時代四 亞當斯級 (DDG-2 Charles F. Adams) 導向飛彈驅逐艦
  | 'dd'      // 時代四 福雷斯特·薛曼級 (DD-931 Forrest Sherman) 主力驅逐艦
  | 'ffg'     // 時代四 諾克斯級 (FFG-1052 Knox) 反潛巡防艦
  | 'lph'     // 時代四 硫磺島級 (LPH-2 Iwo Jima) 兩棲直升機突擊艦
  | 'lcm8'    // 時代四 LCM-8 麥克登陸艇
  | 'komar_ptg' // 時代四 蚊子級 (Project 183R Komar) 飛彈快艇
  | 'kashin'  // 時代四 卡辛級 (Project 61 Kashin) 導向飛彈驅逐艦 (全燃氣渦輪)
  | 'riga'    // 時代四 里加級 (Project 50 Riga) 護衛艦 (北越海軍主力旗艦)
  | 'osa'     // 時代四 黃蜂級 (Project 205 Osa) 重型飛彈快艇 (4x 冥河飛彈)
  | 'foxtrot'; // 時代四 狐步級 (Project 641 Foxtrot) 遠洋長程攻擊潛艇 (10x 533mm魚雷)

export type GroundUnitType =
  | 'usmc_rifle_42'      // 時代一 1942 USMC 陸戰隊步槍排 (春田M1903 / 早期M1加蘭德)
  | 'usmc_rifle_45'      // 時代二 1945 USMC 陸戰隊步槍排 (M1加蘭德 / 巴祖卡 / 火焰噴射器)
  | 'usmc_korea_rifle'   // 時代三 1950-53 USMC 陸戰第1師突擊排 (M1加蘭德 / M20超級巴祖卡)
  | 'us_army_infantry_korea' // 時代三 美國陸軍前線突擊步兵排 (M14/無後座力砲)
  | 'us_army_armor_korea'    // 時代三 美國陸軍前線裝甲排 (M46巴頓/M4A3E8薛曼)
  | 'usmc_air_assault_65' // 時代四 1965 USMC 陸戰隊空中突擊排 (M16A1 / M60 / M79 / 垂直機動空降)
  | 'us_army_rifle_platoon_65' // 時代四 美陸軍常規步槍排 (M16A1 / M60 / M79)
  | 'us_army_m113_mech'        // 時代四 M113 裝甲運兵機械化步兵排
  | 'us_army_chaparral_sam'    // 時代四 MIM-72 榭樹 (Chaparral) 履帶防空飛彈車
  | 'usmc_armor_m48'      // 時代四 M48A3 Patton 90mm 主力戰車排
  | 'usmc_ontos_m50'      // 時代四 M50 Ontos 6聯裝106mm無後座力砲反裝甲自走車
  | 'usmc_armor_m3'      // 時代一 USMC M3 Stuart 裝甲排
  | 'usmc_armor_m4'      // 時代二 USMC M4A2 Sherman 裝甲排
  | 'usmc_patton_m46'    // 時代三 USMC M46 巴頓 (Patton) 90mm主力戰車排
  | 'usmc_howitzer_155'  // 時代三 美軍 M114 155mm 重榴彈砲排
  | 'usmc_duster_m42'    // 時代三 M42 清道夫雙管40mm防空自走砲 (Duster)
  | 'usmc_lvt_42'        // 時代一 USMC LVT-1/2 水牛兩棲機步排
  | 'usmc_lvt_45'        // 時代二 USMC LVT-4 / LVT(A)-4 兩棲火力排
  | 'usmc_lvtp5'         // 時代三 USMC LVT-P5 兩棲重裝步戰排
  | 'usmc_engineer'      // USN Seabees 海軍工兵團 / 戰鬥工兵排 (可闢建新前進野戰機場)
  | 'usmc_artillery_105' // 美軍 M2A1 105mm 砲兵支援排 (遠程榴彈砲群)
  | 'opfor_infantry_42'  // 時代一 日軍海軍特別陸戰隊步槍排 (SNLF)
  | 'opfor_infantry_45'  // 時代二 日軍要塞守備步兵排 / 萬歲突擊排 (Late-war IJA)
  | 'opfor_coldwar_infantry' // 時代三 遠東聯軍突擊步兵連 (PPSh-41衝鋒槍 / RPG-2)
  | 'opfor_vietnam_sapper' // 時代四 敵軍精銳特工爆破連 (AK-47 / RPG-7 / Sapper)
  | 'opfor_pt76_amphib'   // 時代四 PT-76 水陸兩棲輕戰車排
  | 'opfor_t54_tank'      // 時代四 T-54/55 100mm主力戰車排
  | 'opfor_zsu23_shilka'  // 時代四 ZSU-23-4 石勒喀河 4聯裝雷達導引防空自走砲
  | 'opfor_zu23_aa'       // 時代四 ZU-23-2 雙管防空砲陣地
  | 'opfor_mortar_platoon' // 迫擊砲排
  | 'opfor_infantry_ambush' // 隱蔽坑道突擊衝鋒部隊
  | 'opfor_infantry_patrol' // 敵軍機動步兵大隊
  | 'opfor_type95_tank'    // 敵軍九五式輕戰車小隊
  | 'opfor_type97_tank'    // 敵軍九七式改中戰車中隊
  | 'opfor_t34_85'         // 時代三 T-34/85 突擊裝甲排
  | 'opfor_is3_heavy'      // 時代三 IS-3 重戰車突擊排 (122mm巨砲)
  | 'opfor_s60_flak'       // 時代三 S-60 57mm 雷達導引防空連
  | 'opfor_ks19_heavy'     // 時代三 KS-19 100mm 重高射砲連
  | 'opfor_field_artillery'; // 敵軍機動野戰砲兵連 (機動砲兵陣地)

export interface GroundUnit {
  id: string;
  type: GroundUnitType;
  name: string;
  side: ShipSide;
  era: Era;
  pos: Vector2D;
  vel: Vector2D;
  heading: number;
  speed: number;
  maxSpeed: number;
  health: number;
  maxHealth: number;
  armor: number;
  range: number;
  damage: number;
  cooldown: number;
  reloadTime: number;
  order: UnitOrder;
  embarkedInShipId?: string; // If embarked aboard LCVP or LST
  isAmphibious?: boolean;   // LVT can traverse both water and land!
  canBuildAirfield?: boolean; // Seabees can build forward airstrip on islands!
  buildCooldown?: number;
  isBanzaiCharging?: boolean;
  isDestroyed: boolean;
  // 陸軍雙參數系統 (Dual Parameters System)
  organization: number;       // 組織度 0-100% (反映士氣、組織完整度與回應指揮作戰能力)
  maxOrganization: number;    // 最大組織度 (通常為 100)
  strength: number;           // 建制度 0-100% (反映武器與人員完好狀況)
  maxStrength: number;        // 最大建制度 (通常為 100)
  isSupplied?: boolean;       // 全島補給線是否連通 (需島上有運作中港口或基石)
  isSurrendered?: boolean;    // 是否已繳械投降 (組織度歸零遭包圍觸發)
  surrenderTimer?: number;    // 投降收押倒數
  disorganized?: boolean;     // 混亂狀態 (組織度 < 20%)
  isNPCAlliedFrontline?: boolean; // 時代三 美國陸軍自動前線進攻部隊
  echelon?: 'platoon' | 'company' | 'battery' | 'battalion'; // NATO APP-6 編制階級標記
  isInUrbanCover?: boolean; // 處於城市/城鎮/定居點掩體內 (空襲減傷70%、步火減傷50%)
  urbanCoverFactor?: number; // 掩蔽防護乘數
  // 漸進式火力壓制系統 (Progressive Suppression System: 0~100%, 30%~80% 移速懲罰)
  suppression?: number; // 0 to 100%
  suppressionTimer?: number; // 遭火力射擊倒數
  isSuppressed?: boolean; // suppression > 25 (減速30%~50%)
  isPinned?: boolean; // suppression > 65 (減速50%~80%)
}

export type ShipSide = 'player' | 'enemy' | 'neutral';

export interface Turret {
  relX: number;
  relY: number;
  caliber: string;
  range: number;
  cooldown: number;
  reloadTime: number;
  barrelCount: number;
  angle: number;
  arcMin: number;
  arcMax: number;
  damage: number;
}

export type UnitOrderType = 'idle' | 'move' | 'attack' | 'patrol' | 'rtb' | 'escort';

export interface UnitOrder {
  type: UnitOrderType;
  targetPos?: Vector2D;
  targetId?: string;
  patrolOrigin?: Vector2D;
}

export interface ShipArmamentSpec {
  name: string;
  count: string;
  type: 'main' | 'secondary' | 'aa' | 'torpedo' | 'asw';
  caliber?: string;
  desc?: string;
}

export interface Ship {
  id: string;
  name: string;
  codeName?: string;
  type: ShipType;
  side: ShipSide;
  era: Era;
  pos: Vector2D;
  vel: Vector2D;
  heading: number;
  targetHeading: number;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  turnRate: number;
  length: number;
  width: number;
  health: number;
  maxHealth: number;
  armor: number;
  turrets: Turret[];
  detailedArmaments?: ShipArmamentSpec[];
  torpedoCooldown?: number;
  torpedoReloadTime?: number;
  hasTorpedoes?: boolean;
  hasDepthCharges?: boolean;
  depthChargeCooldown?: number;
  hasHedgehog?: boolean;
  hedgehogCooldown?: number;
  isFlagship?: boolean;
  isSunk: boolean;
  sinkProgress: number;
  wakePoints: { x: number; y: number; life: number; width: number }[];
  order: UnitOrder;
  flakCooldown: number;
  flakRange: number;
  isSubmerged?: boolean;
  detectionRange: number;
  isSpotted?: boolean;
  carrierPlanes?: {
    ready: Record<string, number>;
    hangar: Record<string, number>;
    maxPerType: Record<string, number>;
  };
  embarkedUnitIds?: string[];
  cargoCapacity?: number;
  rocketCooldown?: number;
  isTokyoExpress?: boolean;
  // 艦體沉沒、斷裂兩截與彈藥庫殉爆狀態 (Ship Sinking, Splitting & Magazine Detonation)
  isBrokenInTwo?: boolean;
  breakProgress?: number; // 0 to 1
  bowAngleOffset?: number; // 艦首下沉或偏轉角度
  sternAngleOffset?: number; // 艦尾翹起或偏轉角度
  breakLineOffset?: number; // 斷裂線相對艦身中心位置 (例如 -0.05 煙囪/艦橋後方)
  magazineDetonated?: boolean;
  magazineFlashTimer?: number;
  // 雙重生命條系統 (Dual Health Bars): 武器指管系統 (WCS) 與 人員艦體狀態 (HCI)
  weaponControlHealth?: number;
  maxWeaponControlHealth?: number;
  hullCrewHealth?: number;
  maxHullCrewHealth?: number;
  // 時代四飛彈艦與兩棲母艦擴充 (Era 4 SAM & Amphibious Capabilities)
  hasSAM?: boolean;
  samCooldown?: number;
  samRange?: number;
  maxSAMs?: number;
  readySAMs?: number;
  isLPH?: boolean;
  isAmphibious?: boolean;
  // 艦載 ASROC 反潛火箭與 Mk 32 艦側三聯裝魚雷管 (Shipboard ASROC & SVTT)
  hasASROC?: boolean;
  asrocCooldown?: number;
  asrocRange?: number;
  maxASROC?: number;
  readyASROC?: number;
  hasSVTT?: boolean;
  svttCooldown?: number;
  hasChaffLauncher?: boolean; // 艦載 RBOC 金屬箔條干擾迫擊砲發射器
  chaffCooldown?: number;
}

export type AircraftPayloadType =
  | 'clean_guns'          // Machine guns / Pure Air Superiority
  | 'hvar_rockets'        // HVAR 5" Air-to-Surface Rockets
  | 'bomb_500'            // 500lb Bomb (Fighter-Bomber strike)
  | 'bomb_1000'           // 1000lb Armor Piercing Bomb
  | 'bomb_1600'           // 1600lb Heavy AP Bomb
  | 'bombs_dual_500'      // Dual 500lb Bombs
  | 'aerial_torpedo'      // Mark 13 Aerial Torpedo
  | 'depth_bombs'         // 4x Depth / Ground Bombs
  | 'scout_fuel'          // Long-Range Aux Fuel (Radar Boost)
  | 'scout_depth_charge'  // Light ASW Depth Charge
  // 陸航多元自訂掛載方案 (Heavy Bomber & Attack Craft Loadouts):
  | 'bombs_carpet_250'    // 16x 250lb 密集高爆航彈 (重轟地毯轟炸)
  | 'bombs_quad_500'      // 8x 500lb 通用航彈群 (重轟/雙發攻擊機)
  | 'bombs_dual_1000'     // 4x 1000lb 穿甲航彈 (重轟高空穿甲打擊)
  | 'bomb_1600_ap'        // 2x 1600lb 超重型穿甲航彈 (重轟主力艦致命毀滅)
  | 'mixed_bombs_rockets' // 4x HVAR火箭 + 2x 500lb航彈 混編方案 (攻擊機)
  | 'asw_depth_bombs'     // 重型反潛深水炸彈組 (攻擊機專用)
  // 時代三冷戰/韓戰特種掛載方案 (Era 3 Jet & Cold War Weapons):
  | 'tiny_tim_rocket'     // 11.75吋「小蒂姆」巨型穿甲火箭彈 (重型防空工事與戰列艦毀滅者)
  | 'napalm_canister'     // 凝固汽油彈 (Napalm Canister - 灘頭陣地與坑道廣域焦土覆蓋)
  | 'asw_torpedo'         // Mk 24 / Mk 34 航空聲自導反潛魚雷
  | 'bomb_2000'           // 2,000磅重型低阻通用炸彈 (巨型打擊)
  | 'tactical_nuke'       // ☢️ Mk 4 / Mk 6 戰術原子彈 (消耗 4500 CP · 全島要塞部隊瞬間汽化)
  // 時代四導引飛彈與立體垂直突擊特遣武器 (Era 4 Guided Missiles & Heliborne Assault):
  | 'aim9_sidewinder'      // AIM-9 響尾蛇紅外線空空飛彈 (近戰格鬥攔截)
  | 'aim7_sparrow'         // AIM-7 麻雀半主動雷達導引空空飛彈 (超視距截擊/反飛彈)
  | 'agm12_bullpup'        // AGM-12 犢牛犬無線電導引空艦/空地飛彈 (穿透重裝甲)
  | 'agm45_shrike'         // AGM-45 百 strike 反輻射飛彈 (專門摧毀敵雷達/防空飛彈陣地)
  | 'agm62_walleye'        // AGM-62 鼓眼魚電視導引精確滑翔炸彈 (遠程精確打擊)
  | 'bombs_snakeye_retarded' // Mk 82 蛇眼高阻減速炸彈組 (超低空高速投彈不傷本機)
  | 'b52_megaton_carpet'   // B-52 BUFF 108枚 500lb/750lb 巨型地毯覆蓋轟炸
  | 'ffar_rockets_pod'     // 70mm FFAR 密集火箭巢 (武裝直升機/強擊機)
  | 'helo_assault_troops'  // 空中突擊機降登陸 (直升機垂直包圍)
  | 'c1_paratroopers'      // C-1 貿易商型傘兵空降作戰
  | 'asw_acoustic_torpedo' // Mk 44 / Mk 46 主動聲自導航空反潛魚雷 (SH-2 / P-3C)
  | 'b52_megaton_nuke'     // ☢️ B-52 B28/B41 戰略百萬噸級熱核重彈 (消耗 6000 CP · 萬米平流層投擲)
  | 'tactical_b61_nuke'    // ☢️ F-4 / A-6 / A-4 B61/B43 戰術核炸彈 (消耗 4000 CP · 減速傘低空突防)
  | 'opfor_tactical_nuke'; // ☢️ OPFOR 蘇聯顧問團 RDS-4 戰術核炸彈 (Il-28 絕望突擊)

export interface NuclearDetonation {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  timer: number;
  duration: number;
  targetIslandName?: string;
}

export interface AirWingLoadout {
  fighters: number;
  diveBombers: number;
  torpedoBombers: number;
  scouts: number;
  preLaunchCAP: boolean;
  preLaunchScout: boolean;
  fighterPayload: AircraftPayloadType;
  diveBomberPayload: AircraftPayloadType;
  torpedoBomberPayload: AircraftPayloadType;
  scoutPayload: AircraftPayloadType;
}

export interface PayloadOption {
  id: AircraftPayloadType;
  role: AircraftRole;
  name: string;
  nameZh: string;
  desc: string;
  badge: string;
  era: 'era1' | 'era2' | 'era3' | 'era4' | 'both' | 'all';
  damage: number;
  speedModifier: number; // e.g. 1.15 = +15% speed, 0.9 = -10% speed
  ammoCount: string;
  pros: string;
  purposeBadge?: string; // 作戰用途標籤, 如 【全島要塞汽化】 / 【地毯面狀毀滅】 / 【重甲穿甲破壞】
  blastRadius?: number;  // 殺傷爆炸半徑 (m)
  cpCost?: number;       // 戰略CP授權成本 (如核彈 4500)
  visualTag?: string;    // 模型外觀特徵標籤, 如 [彈艙降落傘核彈] / [24枚連環掛架]
}

export const PAYLOAD_CATALOG: Record<AircraftPayloadType, PayloadOption> = {
  clean_guns: {
    id: 'clean_guns',
    role: 'fighter',
    name: 'Clean Air Superiority (CAP)',
    nameZh: '純空優截擊 (無外掛)',
    desc: '僅攜帶機槍/機砲與流線副油箱。航速最快，專職奪取制空權與阻截敵轟炸機隊。',
    badge: 'CAP 空優',
    era: 'both',
    damage: 55,
    speedModifier: 1.15,
    ammoCount: '6x .50cal / 4x 20mm',
    pros: '航速+15% · 盤旋敏捷 · 強化空戰咬尾火力',
    purposeBadge: '【空中制空截擊】',
    blastRadius: 0,
    cpCost: 0,
    visualTag: '[純機槍/機砲流線構型]',
  },
  hvar_rockets: {
    id: 'hvar_rockets',
    role: 'fighter',
    name: 'HVAR 5" High Velocity Rockets',
    nameZh: 'HVAR 5吋航空火箭彈',
    desc: '掛載 8 枚高速火箭。500米超遠距掠海連射，重創敵方驅逐艦、防空陣地與碉堡。',
    badge: '8x 火箭',
    era: 'both',
    damage: 230,
    speedModifier: 0.98,
    ammoCount: '8x HVAR 5" 火箭 (總傷1840)',
    pros: '超遠距500m齊射 · 壓制驅逐艦與防空工事',
    purposeBadge: '【遠程火箭壓制】',
    blastRadius: 42,
    cpCost: 0,
    visualTag: '[雙翼下 8聯裝導軌]',
  },
  bomb_500: {
    id: 'bomb_500',
    role: 'fighter',
    name: '500lb GP Bomb Strike',
    nameZh: '500磅通用航彈 (對海/對地攻擊)',
    desc: '機腹掛載 500 磅通用航彈。各式戰機皆可改掛！高空投擲命中率受風速與機動影響，但一旦直接命中將造成毀滅性重創！',
    badge: '500lb 航彈',
    era: 'both',
    damage: 850,
    speedModifier: 0.94,
    ammoCount: '1x 500lb GP 航彈',
    pros: '各式戰機通用 · 直擊重創850 (近失彈激起水柱)',
    purposeBadge: '【戰術俯衝轟炸】',
    blastRadius: 45,
    cpCost: 0,
    visualTag: '[機腹中線掛架 500lb]',
  },
  bomb_1000: {
    id: 'bomb_1000',
    role: 'dive_bomber',
    name: '1,000lb Armor-Piercing Bomb',
    nameZh: '1000磅穿甲炸彈 (重型打擊)',
    desc: '海軍標準穿甲航彈。高空俯衝或重裝水平轟炸，直接命中穿透戰艦裝甲甲板引爆彈藥庫！直擊威力極為致命！',
    badge: '1000lb 穿甲',
    era: 'both',
    damage: 1650,
    speedModifier: 0.98,
    ammoCount: '1x 1000lb AP 航彈',
    pros: '極高貫穿 · 直擊破甲1650 · 航母戰列艦剋星',
    purposeBadge: '【重甲穿甲破壞】',
    blastRadius: 55,
    cpCost: 0,
    visualTag: '[重型梯形掛架 1000lb]',
  },
  bombs_dual_500: {
    id: 'bombs_dual_500',
    role: 'dive_bomber',
    name: 'Dual 500lb Bombs',
    nameZh: '雙聯 500磅航彈 (面狀覆蓋)',
    desc: '雙枚 500 磅通用航彈。投彈波及面廣，迅速壓制敵方驅逐艦、防空陣地與碉堡。',
    badge: '2x 500lb 雙彈',
    era: 'both',
    damage: 750,
    speedModifier: 0.96,
    ammoCount: '2x 500lb GP 航彈 (總傷1500)',
    pros: '雙彈覆蓋打擊 · 迅速癱瘓輕艦與防砲',
    purposeBadge: '【雙重面狀殺傷】',
    blastRadius: 48,
    cpCost: 0,
    visualTag: '[雙翼根雙掛架 2x500lb]',
  },
  bomb_1600: {
    id: 'bomb_1600',
    role: 'dive_bomber',
    name: '1,600lb Super Armor-Piercing',
    nameZh: '1600磅超重型穿甲彈 (終極毀滅)',
    desc: '針對巨型主力艦設計的重型炸彈。毀滅性破壞力，直擊穿透大和級與重裝甲航母！',
    badge: '1600lb 超重AP',
    era: 'era2',
    damage: 2400,
    speedModifier: 0.90,
    ammoCount: '1x 1600lb 超重航彈',
    pros: '超重型終極破甲 · 直擊毀滅傷害2400',
    purposeBadge: '【主力艦穿甲絕殺】',
    blastRadius: 65,
    cpCost: 0,
    visualTag: '[重型加強桁架 1600lb]',
  },
  aerial_torpedo: {
    id: 'aerial_torpedo',
    role: 'torpedo_bomber',
    name: 'Mk 13 Aerial Torpedo',
    nameZh: 'Mk 13 高速航空魚雷 (反艦重創)',
    desc: '掠海釋放重型航空魚雷。改良推進機構大幅提升水中航速！從水線下直穿艦底裝甲，忽略65%裝甲造成毀滅性結構破壞。',
    badge: 'Mk13 高速魚雷',
    era: 'both',
    damage: 1450,
    speedModifier: 0.94,
    ammoCount: '1x Mk 13 高速航空魚雷',
    pros: '水中高速340kt · 水線破甲 · 忽略65%裝甲 · 致命重創1450',
    purposeBadge: '【水線穿甲魚雷】',
    blastRadius: 50,
    cpCost: 0,
    visualTag: '[半埋入機腹重型魚雷]',
  },
  depth_bombs: {
    id: 'depth_bombs',
    role: 'torpedo_bomber',
    name: '4x ASW Depth Charges / Coastal Strike',
    nameZh: '4聯裝航空深水炸彈 (反潛壓制)',
    desc: '機腹掛載 4 枚航空深水炸彈。連續投擲覆蓋水面，全面獵殺伏擊潛艇與近海要塞。',
    badge: '4x 深彈',
    era: 'both',
    damage: 420,
    speedModifier: 1.0,
    ammoCount: '4x 航空深水炸彈 (總傷1680)',
    pros: '大面積反潛 · 徹底肅清敵方潛水艇',
    purposeBadge: '【反潛密集轟殺】',
    blastRadius: 40,
    cpCost: 0,
    visualTag: '[彈艙 4聯裝深水炸彈]',
  },
  scout_fuel: {
    id: 'scout_fuel',
    role: 'scout',
    name: 'Long-Range Recon & Artillery Spotting',
    nameZh: '長程空中觀測 (主砲校射引導)',
    desc: '加裝長程副油箱與偵察相機。揭開群島大範圍迷霧，並為友軍戰艦巡洋艦提供 +25% 射程與校射修正！',
    badge: '長程校射',
    era: 'both',
    damage: 0,
    speedModifier: 1.1,
    ammoCount: '光學相機 + 長程油箱',
    pros: '視野+60% · 友艦艦砲射程與命中+25%',
    purposeBadge: '【校射戰場偵察】',
    blastRadius: 0,
    cpCost: 0,
    visualTag: '[雙浮筒長程航空副油箱]',
  },
  scout_depth_charge: {
    id: 'scout_depth_charge',
    role: 'scout',
    name: 'Light ASW Depth Charge Patrol',
    nameZh: '輕型反潛巡邏武裝',
    desc: '雙浮筒下掛載 2 枚輕型航空深水炸彈。偵察同時兼具反潛巡邏自立攻擊能力。',
    badge: '輕反潛',
    era: 'both',
    damage: 280,
    speedModifier: 0.95,
    ammoCount: '2x 輕型深水炸彈',
    pros: '空中偵巡 + 反潛獵殺',
    purposeBadge: '【巡邏反潛兩用】',
    blastRadius: 36,
    cpCost: 0,
    visualTag: '[浮筒兩側雙輕型深彈]',
  },
  bombs_carpet_250: {
    id: 'bombs_carpet_250',
    role: 'level_bomber',
    name: '16x 250lb Carpet Bombing Strike',
    nameZh: '16-24枚 250磅地毯式地表轟炸',
    desc: '重型轟炸機專用！機腹彈艙滿載 16-24 枚高爆航彈連續投擲，大面積地毯式覆蓋灘頭、步兵、砲兵陣地與港口！',
    badge: '地毯轟炸',
    era: 'both',
    damage: 380,
    speedModifier: 0.92,
    ammoCount: '16-24x 250lb 密集彈雨',
    pros: '極大散佈範圍 · 徹底粉碎敵防砲與步兵工事',
    purposeBadge: '【地毯面狀毀滅】',
    blastRadius: 52,
    cpCost: 0,
    visualTag: '[全彈艙 24枚連環掛架]',
  },
  bombs_quad_500: {
    id: 'bombs_quad_500',
    role: 'level_bomber',
    name: '8-16x 500lb General Purpose Cluster',
    nameZh: '8-16枚 500磅通用航彈集群',
    desc: '重轟炸機/雙發攻擊機通用！8-16枚通用航彈連續密集轟炸，兼具貫穿力與毀滅範圍。',
    badge: '500lb 彈群',
    era: 'both',
    damage: 650,
    speedModifier: 0.90,
    ammoCount: '8-16x 500lb 通用航彈',
    pros: '兼具穿透與面打擊 · 迅速癱瘓敵港口與水面艦',
    purposeBadge: '【高爆工事拆除】',
    blastRadius: 58,
    cpCost: 0,
    visualTag: '[彈艙 16枚雙排500lb]',
  },
  bombs_dual_1000: {
    id: 'bombs_dual_1000',
    role: 'level_bomber',
    name: '4-8x 1,000lb Armor Piercing Salvo',
    nameZh: '4-8枚 1000磅穿甲重型炸彈',
    desc: '重型轟炸機穿甲專屬！自萬呎高空呼嘯落下，貫穿戰艦與要塞厚重裝甲！',
    badge: '千磅重轟',
    era: 'both',
    damage: 1350,
    speedModifier: 0.88,
    ammoCount: '4-8x 1000lb AP 彈',
    pros: '極限高空穿甲 · 重創敵戰列艦大和號與大鳳號',
    purposeBadge: '【重甲要塞穿甲】',
    blastRadius: 68,
    cpCost: 0,
    visualTag: '[彈艙 8枚千磅穿甲彈]',
  },
  bomb_1600_ap: {
    id: 'bomb_1600_ap',
    role: 'level_bomber',
    name: '2-4x 1,600lb Super AP Blockbusters',
    nameZh: '2-4枚 1600磅超重型穿甲巨彈',
    desc: '美軍最大口徑航空穿甲彈！專打超級戰列艦核心裝甲艙與地下永久要塞工事！',
    badge: '1600lb 巨型穿甲',
    era: 'era2',
    damage: 2200,
    speedModifier: 0.85,
    ammoCount: '2-4x 1600lb 超重AP彈',
    pros: '毀滅性裝甲貫穿 · 超重裝甲巨艦剋星',
    purposeBadge: '【地下碉堡貫穿】',
    blastRadius: 76,
    cpCost: 0,
    visualTag: '[彈艙 4枚1600lb巨彈]',
  },
  mixed_bombs_rockets: {
    id: 'mixed_bombs_rockets',
    role: 'attacker',
    name: 'Mixed HVAR Rockets & 500lb Bombs',
    nameZh: '火箭彈與航彈混編掛載 (雙重打擊)',
    desc: '攻擊機雙重任務配置！4枚 HVAR 5吋火箭遠距壓制防空，隨後俯衝投下 2枚 500磅通用炸彈滅頂直擊！',
    badge: '火箭+炸彈 混編',
    era: 'both',
    damage: 980,
    speedModifier: 0.92,
    ammoCount: '4x HVAR火箭 + 2x 500lb炸彈',
    pros: '超遠距火箭壓制 + 俯衝投彈直擊 · 多功能通用',
    purposeBadge: '【海空防空壓制】',
    blastRadius: 46,
    cpCost: 0,
    visualTag: '[翼下火箭 + 機腹雙彈]',
  },
  asw_depth_bombs: {
    id: 'asw_depth_bombs',
    role: 'attacker',
    name: 'Heavy ASW Depth Bomb Cluster',
    nameZh: '重型航空深水炸彈群 (反潛特化)',
    desc: '攻擊機與魚雷機反潛特化！6枚重型反潛深彈連續投放，水下震盪激波全面撕裂伏擊潛水艦！',
    badge: '6x 重型深彈',
    era: 'both',
    damage: 550,
    speedModifier: 0.96,
    ammoCount: '6x 重型航空深彈',
    pros: '反潛專精 · 忽視水下隱蔽 · 撕裂潛艇龍骨',
    purposeBadge: '【專門獵殺潛水艦】',
    blastRadius: 48,
    cpCost: 0,
    visualTag: '[機腹 6聯裝重深彈]',
  },
  tiny_tim_rocket: {
    id: 'tiny_tim_rocket',
    role: 'attacker',
    name: '11.75" Tiny Tim Heavy Penetration Rocket',
    nameZh: '小蒂姆 11.75吋 重型穿甲火箭',
    desc: '二戰末期至韓戰美軍最大型空射反艦/破障火箭！重達1,284磅，500磅穿甲戰鬥部可貫穿花崗岩碉堡與戰列艦主裝甲。',
    badge: '小蒂姆 穿甲火箭',
    era: 'era3',
    damage: 1850,
    speedModifier: 0.94,
    ammoCount: '2x 11.75" Tiny Tim 巨型火箭',
    pros: '重裝要塞與戰艦剋星 · 500m 遠程直射 · 貫穿重裝甲',
    purposeBadge: '【防空要塞粉碎】',
    blastRadius: 56,
    cpCost: 0,
    visualTag: '[雙翼下 11.75吋巨型火箭]',
  },
  napalm_canister: {
    id: 'napalm_canister',
    role: 'fighter',
    name: 'Napalm Firebomb Canister Strike',
    nameZh: '凝固汽油燃燒彈 (廣域火海)',
    desc: '韓戰美軍海空軍廣泛使用之凝固汽油燃燒罐。投擲後化為烈焰火海，長達數十秒持續灼燒敵方坑道、陣地與露天砲位！',
    badge: '凝固汽油彈',
    era: 'era3',
    damage: 1200,
    speedModifier: 0.95,
    ammoCount: '2x 凝固汽油燃燒罐',
    pros: '範圍燃燒 · 摧毀步兵陣地與防空砲 · 壓制組織度',
    purposeBadge: '【廣域陣地焦土】',
    blastRadius: 62,
    cpCost: 0,
    visualTag: '[機翼兩側鋁製凝固汽油罐]',
  },
  asw_torpedo: {
    id: 'asw_torpedo',
    role: 'torpedo_bomber',
    name: 'Mk 24/34 Acoustic Homing ASW Torpedo',
    nameZh: '聲自導反潛航空魚雷 (主動鎖定)',
    desc: '冷戰初期聲自導反潛魚雷。入水後自動搜尋水下螺旋槳噪聲進行主動導引鎖定，精準追蹤敵潛艇！',
    badge: '聲自導反潛魚雷',
    era: 'era3',
    damage: 1100,
    speedModifier: 0.96,
    ammoCount: '1x 聲自導反潛魚雷',
    pros: '主動聲自導 · 精準命中伏擊潛艇 · 忽視迴避',
    purposeBadge: '【主動聲自導反潛】',
    blastRadius: 45,
    cpCost: 0,
    visualTag: '[流線聲導反潛魚雷]',
  },
  bomb_2000: {
    id: 'bomb_2000',
    role: 'dive_bomber',
    name: '2,000lb Low-Drag General Purpose Heavy Bomb',
    nameZh: '2000磅低阻通用重型炸彈 (巨型爆破)',
    desc: '巨型空投炸彈，巨大的裝藥量能造成極大範圍震盪與破壞，直接摧毀深水港口突堤與重型岸防砲台。',
    badge: '2000lb 巨炸彈',
    era: 'era3',
    damage: 2200,
    speedModifier: 0.90,
    ammoCount: '1-2x 2000lb GP 航彈',
    pros: '極限爆破 · 摧毀重型港口工事與戰列艦',
    purposeBadge: '【港口工事極限爆破】',
    blastRadius: 86,
    cpCost: 0,
    visualTag: '[機腹 2000lb 巨型低阻彈]',
  },
  tactical_nuke: {
    id: 'tactical_nuke',
    role: 'level_bomber',
    name: 'Mk 4 / Mk 6 Tactical Nuclear Bomb',
    nameZh: 'Mk 4 / Mk 6 戰術原子彈 (☢️ 4500 CP 戰略打擊)',
    desc: '冷戰戰略威懾終極兵器。自 B-29 超高空彈艙投下，於目標島嶼上空引爆毀滅性核分裂反應，瞬間汽化全島要塞工事與守備部隊！伴隨極高政治代價（消耗 4,500 CP）。',
    badge: '☢️ 4500 CP 戰術核武',
    era: 'era3',
    damage: 120000,
    speedModifier: 0.88,
    ammoCount: '1x Mk 4 戰術核航彈 (毀滅半徑520m)',
    pros: '整座島嶼瞬間汽化 · 摧毀全島要塞守軍 · 消耗 4,500 CP',
    purposeBadge: '【全島要塞瞬間汽化】',
    blastRadius: 520,
    cpCost: 4500,
    visualTag: '[彈艙外露 Mk 4 降落傘原子彈]',
  },
  aim9_sidewinder: {
    id: 'aim9_sidewinder',
    role: 'fighter',
    name: 'AIM-9 Sidewinder IR Heat-Seeking Missile',
    nameZh: 'AIM-9 響尾蛇紅外線導引空空飛彈',
    desc: '近身格鬥王者。鎖定敵機噴射尾氣，發射後自動追蹤敵機，命中即造成致命破片毀滅！',
    badge: 'AIM-9 響尾蛇',
    era: 'era4',
    damage: 1450,
    speedModifier: 1.05,
    ammoCount: '4x AIM-9 空空飛彈',
    pros: '紅外線主動追蹤 · 格鬥高命中率 · 雙機編隊防空',
    purposeBadge: '【紅外線格鬥飛彈】',
    blastRadius: 35,
    cpCost: 0,
    visualTag: '[雙翼側掛 4x AIM-9]',
  },
  aim7_sparrow: {
    id: 'aim7_sparrow',
    role: 'fighter',
    name: 'AIM-7 Sparrow SARH Long-Range Missile',
    nameZh: 'AIM-7 麻雀半主動雷達導引空空飛彈',
    desc: '超視距（BVR）雷達截擊導引飛彈。可用於超遠程獵殺敵戰機，並可攔截逼近的空艦反艦飛彈！',
    badge: 'AIM-7 麻雀',
    era: 'era4',
    damage: 2100,
    speedModifier: 1.0,
    ammoCount: '4x AIM-7 雷達導引飛彈',
    pros: '超視距攔截 · 兼具反飛彈攔截能力 · 重創大型空中目標',
    purposeBadge: '【超視距雷達截擊】',
    blastRadius: 45,
    cpCost: 0,
    visualTag: '[機腹半埋 4x AIM-7]',
  },
  agm12_bullpup: {
    id: 'agm12_bullpup',
    role: 'attacker',
    name: 'AGM-12 Bullpup Radio-Guided Air-to-Surface Missile',
    nameZh: 'AGM-12 犢牛犬無線電導引空艦/空地飛彈',
    desc: '第一代實戰化精準導引反艦飛彈。飛行員以手動操縱桿指揮飛彈撲向敵艦水線或重型岸防工事，威力巨大！',
    badge: '犢牛犬空艦飛彈',
    era: 'era4',
    damage: 2800,
    speedModifier: 0.94,
    ammoCount: '2x AGM-12 導引飛彈',
    pros: '精確打擊 · 穿透重裝甲 · 毀滅水面戰艦與橋樑',
    purposeBadge: '【精確導引空艦飛彈】',
    blastRadius: 65,
    cpCost: 0,
    visualTag: '[翼下 2x AGM-12 犢牛犬]',
  },
  agm45_shrike: {
    id: 'agm45_shrike',
    role: 'attacker',
    name: 'AGM-45 Shrike Anti-Radiation Missile (ARM)',
    nameZh: 'AGM-45 百靈鳥反輻射飛彈 (防空雷達壓制)',
    desc: '野鼬（Wild Weasel）任務核心！鎖定敵方 Fan Song 雷達陣地之電磁輻射自動尋標，癱瘓防空飛彈指揮網！',
    badge: 'AGM-45 反輻射',
    era: 'era4',
    damage: 2400,
    speedModifier: 0.96,
    ammoCount: '2-4x AGM-45 反輻射飛彈',
    pros: '自動鎖定敵雷達陣地 · 摧毀雷達即癱瘓周邊所有 SAM 防空飛彈',
    purposeBadge: '【反輻射野鼬壓制】',
    blastRadius: 55,
    cpCost: 0,
    visualTag: '[野鼬雙翼 4x AGM-45]',
  },
  agm62_walleye: {
    id: 'agm62_walleye',
    role: 'dive_bomber',
    name: 'AGM-62 Walleye TV-Guided Glide Bomb',
    nameZh: 'AGM-62 鼓眼魚電視導引精確滑翔炸彈',
    desc: '電視光學對比鎖定滑翔炸彈。高空投下後電視鏡頭鎖定目標，精準撲向指揮所、橋樑與港口設施！',
    badge: '電視導引滑翔彈',
    era: 'era4',
    damage: 3200,
    speedModifier: 0.92,
    ammoCount: '2x AGM-62 電視滑翔彈',
    pros: '光學電視高精度鎖定 · 避開低空防空砲火 · 850lb 聚能穿透戰鬥部',
    purposeBadge: '【電視導引精確滑翔】',
    blastRadius: 70,
    cpCost: 0,
    visualTag: '[機腹掛架 2x AGM-62 鼓眼魚]',
  },
  bombs_snakeye_retarded: {
    id: 'bombs_snakeye_retarded',
    role: 'attacker',
    name: 'Mk 82 Snakeye High-Drag Retarded Bombs',
    nameZh: 'Mk 82 蛇眼高阻減速炸彈組 (超低空高速突防)',
    desc: '折疊減速傘片翼面設計。攻擊機以超低空高速掠過敵艦或陣地投擲，炸彈展開十字阻力翼減速，防止破片傷及本機。',
    badge: '6x 蛇眼減速彈',
    era: 'era4',
    damage: 1800,
    speedModifier: 0.98,
    ammoCount: '6-12x Mk 82 蛇眼減速炸彈',
    pros: '超低空高速突防 · 密集覆蓋敵艦與防空陣地',
    purposeBadge: '【超低空高速突擊】',
    blastRadius: 60,
    cpCost: 0,
    visualTag: '[翼下多聯裝掛架 12x 蛇眼]',
  },
  b52_megaton_carpet: {
    id: 'b52_megaton_carpet',
    role: 'level_bomber',
    name: 'B-52 BUFF Arc Light 108-Bomb Carpet Strike',
    nameZh: 'B-52 弧光行動 108枚重型地毯式航彈走廊',
    desc: '傳奇 B-52D 巨型同溫層堡壘！內置加外掛共 108 枚 500lb / 750lb 航彈，在目標島嶼劃出 2000 米地動山搖之毀滅走廊！',
    badge: '108枚 弧光走廊',
    era: 'era4',
    damage: 14500,
    speedModifier: 0.85,
    ammoCount: '108x 500lb/750lb 航彈走廊',
    pros: '108枚密集連續投擲 · 巨型面狀殺傷 · 徹底摧毀全防線防禦',
    purposeBadge: '【巨型地毯轟炸走廊】',
    blastRadius: 180,
    cpCost: 1200,
    visualTag: '[大肚子彈艙 + 巨型外翼掛架 108彈]',
  },
  ffar_rockets_pod: {
    id: 'ffar_rockets_pod',
    role: 'attacker',
    name: '70mm FFAR / 20mm Vulcan Gun Pods',
    nameZh: '70mm 密集火箭巢與 20mm 機砲莢艙',
    desc: '眼鏡蛇攻擊直升機與前進空中管制機專屬。高密度火箭齊射與每分鐘 6000 發火神旋轉機砲，壓制地面與水上快艇。',
    badge: '火箭巢+機砲',
    era: 'era4',
    damage: 1600,
    speedModifier: 1.0,
    ammoCount: '38x 70mm 火箭 + 1000發 20mm 火神砲',
    pros: '低空懸停密接支援 · 迅速掃除步兵、防空砲與登陸灘頭威脅',
    purposeBadge: '【密接火箭壓制】',
    blastRadius: 50,
    cpCost: 0,
    visualTag: '[兩側短翼 2x 19聯裝火箭巢]',
  },
  helo_assault_troops: {
    id: 'helo_assault_troops',
    role: 'rescue',
    name: 'USMC Heliborne Vertical Envelopment Air Assault',
    nameZh: '海軍陸戰隊直升機垂直包圍空中突擊隊',
    desc: 'CH-46 海騎士或 UH-1 休伊直升機搭載全副武裝陸戰隊空中突擊班。不受灘頭地形限制，直接機降至島上任意內陸高地或敵後！',
    badge: '垂直機動突擊',
    era: 'era4',
    damage: 0,
    speedModifier: 0.92,
    ammoCount: '1x 陸戰隊空中突擊強化排 (機降部署)',
    pros: '無視灘頭地形限制 · 任意陸地機降 · 奪取內陸要塞與制高點',
    purposeBadge: '【直升機垂直機降】',
    blastRadius: 0,
    cpCost: 0,
    visualTag: '[機艙搭載全副武裝陸戰隊]',
  },
  c1_paratroopers: {
    id: 'c1_paratroopers',
    role: 'scout',
    name: 'C-1 Trader Airborne Parachute Assault Drop',
    nameZh: 'C-1 貿易商型 傘兵高空戰術空投突擊',
    desc: '航艦起飛之雙發艦載運輸機。飛抵目標島嶼上空連續釋放傘兵分隊，白色降落傘群自天而降，突擊敵後防線！',
    badge: 'C-1 傘兵空降',
    era: 'era4',
    damage: 0,
    speedModifier: 0.95,
    ammoCount: '2x 空降突擊戰鬥班 (降落傘空投)',
    pros: '遠程高速戰術空投 · 降落傘覆蓋敵後要害 · 加速戰區推進',
    purposeBadge: '【高空傘兵突降】',
    blastRadius: 0,
    cpCost: 0,
    visualTag: '[機尾跳板空投傘兵群]',
  },
  asw_acoustic_torpedo: {
    id: 'asw_acoustic_torpedo',
    role: 'torpedo_bomber',
    name: 'Mk 46 Acoustic Homing ASW Torpedo',
    nameZh: 'Mk 46 主動聲自導航空反潛魚雷',
    desc: 'SH-2 海妖直升機與 P-3C 獵戶座專用主動聲自導航空反潛魚雷。入水降落傘脫離後自動啟動主動高頻聲納，追蹤敵潛艇！',
    badge: 'Mk 46 航空聲導魚雷',
    era: 'era4',
    damage: 1350,
    speedModifier: 0.98,
    ammoCount: '2x Mk 46 主動聲導反潛魚雷',
    pros: '主動高頻聲納導引 · 專克潛艇 · 傘降精確入水',
    purposeBadge: '【主動聲自導獵潛】',
    blastRadius: 52,
    cpCost: 0,
    visualTag: '[機腹/側架 2x Mk 46 聲導魚雷]',
  },
  b52_megaton_nuke: {
    id: 'b52_megaton_nuke',
    role: 'level_bomber',
    name: 'B28 / B41 Megaton Strategic Thermonuclear Weapon',
    nameZh: 'B28 / B41 戰略百萬噸級熱核重彈 (☢️ 6000 CP)',
    desc: 'B-52 巨型同溫層堡壘專屬平流層萬噸級熱核打擊武器。萬米高空投擲，產生毀滅性熱核反應，瞬間汽化方圓 750m 內一切陣地！消耗 6,000 CP。',
    badge: '☢️ 6000 CP 戰略熱核',
    era: 'era4',
    damage: 250000,
    speedModifier: 0.85,
    ammoCount: '1x 戰略熱核重彈',
    pros: '萬米平流層投擲 · 毀滅半徑750m · 消耗 6,000 CP',
    purposeBadge: '【平流層戰略熱核毀滅】',
    blastRadius: 750,
    cpCost: 6000,
    visualTag: '[平流層 B28/B41 巨型熱核重彈]',
  },
  tactical_b61_nuke: {
    id: 'tactical_b61_nuke',
    role: 'attacker',
    name: 'B61 / B43 Variable-Yield Tactical Nuclear Bomb',
    nameZh: 'B61 / B43 戰術核炸彈 (☢️ 4000 CP 低空投擲)',
    desc: 'F-4、A-6、A-4 戰轟機專用低空核武器。配備尼龍減速傘，可在極低高度高速投擲後安全拉升脫離，精準汽化要塞工事！消耗 4,000 CP。',
    badge: '☢️ 4000 CP 戰術核武',
    era: 'era4',
    damage: 90000,
    speedModifier: 0.92,
    ammoCount: '1x B61 戰術核航彈',
    pros: '減速傘低空突防 · 毀滅半徑420m · 消耗 4,000 CP',
    purposeBadge: '【戰術核突防打擊】',
    blastRadius: 420,
    cpCost: 4000,
    visualTag: '[機腹 B61 減速傘戰術核彈]',
  },
  opfor_tactical_nuke: {
    id: 'opfor_tactical_nuke',
    role: 'level_bomber',
    name: 'RDS-4 / 8U49 Soviet Tactical Nuclear Strike',
    nameZh: 'RDS-4 蘇聯特遣戰術核突襲 (OPFOR 絕望反擊)',
    desc: 'OPFOR 於總部危急時發動之絕望核反擊，由 Il-28 突破防線投向特遣隊！',
    badge: '☢️ 敵軍絕望核武',
    era: 'era4',
    damage: 150000,
    speedModifier: 0.9,
    ammoCount: '1x 蘇聯戰術核彈',
    pros: '末日絕望突襲 · 考驗特遣隊遠距防空防禦',
    purposeBadge: '【敵軍絕望核突襲】',
    blastRadius: 480,
    cpCost: 0,
    visualTag: '[Il-28 機腹外露核彈]',
  },
};

// 8 大日軍戰術空中任務編組 (Enemy Air Tactical Mission Doctrines)
export type EnemyAirMissionType =
  | 'dca'               // 1. DCA (防空攔截): 戰鬥機防空攔截，敵基地/艦隊受威脅時緊急升空阻截
  | 'air_sweep'         // 2. Air Sweep/Superiority (制空掃蕩): 零戰/紫電改主力主動尋殲友機搶奪制空權
  | 'scramble'          // 3. Scramble (緊急起飛): 友軍轟炸機接近 1400m 範圍時基地警報緊急昇空
  | 'strike_flagship'   // 4. Strike package (旗艦打擊大編隊): 護航戰機+魚雷機+俯衝轟炸機大編隊專打旗艦
  | 'strike_fleet'      // 5. Strike package (艦隊反艦中編隊): 針對友軍驅逐艦、巡洋艦與護航艦的反艦突擊
  | 'strike_airbase'    // 6. Strike package (陸基轟炸大編隊): 針對友軍前進機場與港口跑道的破壞性重型空襲
  | 'cas'               // 7. CAS (密接空中支援小編隊): 針對地面陸戰隊、裝甲排、兩棲搶灘艇之低空俯衝掃射
  | 'cap';              // 8. CAP (常態防空巡邏): 日軍航母與要塞周邊圓形航線戒備巡邏

// Aircraft Specific Models for Era 1, Era 2 & Era 3
export type AircraftModel =
  // Era 1 Carrier Air Wing
  | 'f4f'   // F4F Wildcat (Fighter)
  | 'sbd'   // SBD Dauntless (Dive Bomber)
  | 'tbd'   // TBD Devastator (Torpedo Bomber)
  | 'os2u'  // OS2U Kingfisher (Scout / Recon)
  // Era 1 Land-Based Aircraft (友軍陸基重型水平轟炸機、陸基戰鬥機、陸基攻擊機)
  | 'b17'   // B-17 Flying Fortress (4發重型水平轟炸機 · 地毯式航彈打擊)
  | 'p40'   // P-40 Warhawk (陸基主力戰鬥機 · 鯊魚嘴機首 6挺.50機槍)
  | 'a20'   // A-20 Havoc (雙發陸基攻擊機 · 低空跳彈與機槍掃射)
  // Era 2 Carrier Air Wing
  | 'f6f'   // F6F Hellcat (Fighter)
  | 'f4u'   // F4U Corsair (Fighter-Bomber)
  | 'f8f'   // F8F Bearcat (Late-war / Cold War Interceptor)
  | 'sb2c'  // SB2C Helldiver (Dive Bomber)
  | 'tbf'   // TBF Avenger (Torpedo Bomber)
  | 'sc1'   // SC-1 Seahawk (Late-war Recon / Floatplane replacing OS2U)
  // Era 2 Land-Based Aircraft (友軍陸基巨型水平轟炸機、主力戰鬥機、重型攻擊機)
  | 'b24'   // B-24 Liberator (4發遠程水平重轟炸機 · 密集地毯式連環航彈)
  | 'p51'   // P-51D Mustang (野馬戰鬥機 · 6x .50機槍 · 長程高速空優護航)
  | 'p47'   // P-47D Thunderbolt (雷霆式重裝甲戰鬥轟炸機 · 8x .50機槍 · 火箭/雙航彈)
  | 'p38'   // P-38 Lightning (雙身惡魔長程重型戰鬥機 · 20mm機砲 + 4挺.50)
  | 'a26'   // A-26 Invader (雙發高速重型攻擊機 · 機首重火砲群與航彈)
  // Era 3 Land-Based Air Force (韓戰空軍配置: F-86軍刀機、B-29超級堡壘、A-26入侵者)
  | 'f86'   // F-86 Sabre (軍刀噴射戰鬥機 · 後掠翼空優王者 · 6x .50 M3 高速機砲)
  | 'b29'   // B-29 Superfortress (超級堡壘戰略轟炸機 · 24x 地毯式連環炸彈/2000lb巨彈)
  // Era 3 Carrier Air Wing (韓戰 / 冷戰遠東特遣隊 1950-1953)
  | 'f9f'   // F9F-2 Panther (海軍第一代艦載噴射戰鬥機 · 4x 20mm 柯爾特機砲)
  | 'f2h'   // F2H-2 Banshee (雙發艦載噴射戰鬥機 · 長程全天候攔截)
  | 'ad1'   // AD-1 / A-1 Skyraider (天襲者重型活塞攻擊機 · 萬磅外掛怪物)
  | 'f4u4'  // F4U-4 Corsair (後期型海盜攻擊戰鬥機 · 火箭/凝固汽油彈支援)
  | 'af_guardian' // AF-2 Guardian (獵潛衛士 · 雙機編隊反潛機 · 聲自導魚雷與雷達)
  | 'ad3w'  // AD-3W Skyraider AEW (空中預警機 · 腹部巨型 AN/APS-20 雷達罩)
  | 'ho3s1' // HO3S-1 Dragonfly (西科斯基搜救醫療直升機 · 飛行員搜救打撈與傷患後送)
  // Era 4 Carrier Air Wing (越戰 / 導引飛彈航艦大洋特遣隊 1965-1973)
  | 'f8'    // F-8 Crusader (最後的槍騎兵 · 4x 20mm 機砲 · 響尾蛇飛彈)
  | 'f4b'   // F-4B Phantom II (艦隊防空重截擊機 · 麻雀/響尾蛇飛彈)
  | 'f4j'   // F-4J Phantom II (都卜勒雷達俯視俯射 · AIM-7E-2/AIM-9G)
  | 'a4'    // A-4 Skyhawk (輕型攻擊機 · 蛇眼減速炸彈 · 犢牛犬空艦飛彈)
  | 'a6a'   // A-6A Intruder (全天候重攻擊機 · 28枚航彈/電視導引彈)
  | 'a6b_weasel' // A-6B Wild Weasel (防空壓制野鼬機 · AGM-45 反輻射飛彈)
  | 'e1'    // E-1B Tracer (艦載空中預警機 · 8000m全天候雷達哨)
  | 's2'    // S-2 Tracker (雙發艦載反潛機 · 聲吶浮標 · 聲自導魚雷)
  | 'uh2'   // UH-2 Seasprite (艦載搜救/聯絡直升機 · 戰鬥落海飛行員打撈)
  | 'sh2'   // SH-2 Seasprite (艦載反潛直升機 · 聲吶浮標 · Mk 46聲自導反潛魚雷 · 支援LPH/CG/DDG/FFG/DD停機坪)
  | 'c1'    // C-1 Trader (艦載空投運輸機 · 傘兵空降後勤)
  // Era 4 Land-Based Aircraft (友軍野戰陸航)
  | 'p3'    // P-3C Orion (獵戶座陸基四發長程反潛巡邏機 · 磁異探測器MAD · 聲吶浮標網 · 航空魚雷)
  | 'f4e'   // F-4E Phantom II (空軍型幽靈 · 內建 20mm M61 火神砲)
  | 'f105'  // F-105D Thunderchief (雷公超音速戰鬥轟炸機)
  | 'b52'   // B-52D Stratofortress (大肚子巨型同溫層堡壘 · 108枚航彈地毯轟炸走廊)
  | 'a7'    // A-7 Corsair II (精準攻擊機 · 抬頭顯示/電腦投彈)
  | 'ov10'  // OV-10 Bronco (前進空中管制 FAC · 白磷指示火箭 · 輕攻擊)
  | 'uh1'   // UH-1 Iroquois (休伊空中突擊直升機 · 垂直機動作戰機降陸戰隊)
  | 'ah1'   // AH-1G Cobra (眼鏡蛇武裝直升機 · 20mm機砲 · 70mm火箭巢)
  // Enemy Models (多樣化日軍戰機)
  | 'zero'       // A6M Zero 通用代碼
  | 'zero_a6m2'  // A6M2 零戰二一型 (早期靈巧纏鬥王)
  | 'zero_a6m5'  // A6M5 零戰五二型 (推力排氣管、高速空優型)
  | 'ki61'       // Ki-61 飛燕 (陸軍液冷高速戰鬥機 / 攔截機)
  | 'george'     // N1K2-J 紫電改 (重裝防空戰鬥機 · 4x 20mm機砲)
  | 'val'        // D3A 九九艦爆 (俯衝轟炸機)
  | 'judy'       // D4Y 彗星 (液冷高速俯衝轟炸機)
  | 'kate'       // B5N 九七艦攻 (航空魚雷攻擊機)
  | 'jill'       // B6N 天山 (重型大推力艦上攻擊機)
  // Era 2 Kamikaze Special Attack & Missile Carriers
  | 'g4m'        // Mitsubishi G4M2e "Betty" (Twin-engine Ohka rocket mother ship)
  | 'ohka'       // MXY-7 Ohka "Cherry Blossom" (Rocket-powered anti-ship suicide missile)
  | 'kamikaze_zero' // A6M5 Zero Kamikaze (Dedicated dive-bomb suicide strike)
  | 'kamikaze_judy' // D4Y Suisei Kamikaze (High-speed suicide dive strike)
  // Era 3 OPFOR Jet & Strike Aircraft (冷戰遠東聯軍 - 徹底移除日軍機)
  | 'mig15'      // MiG-15 (後掠翼噴射戰鬥機 · 1x 37mm + 2x 23mm 重砲 · 高空高速空優截擊)
  | 'tu14'       // Tu-14 Bosun (雙噴射魚雷/水平轟炸機 · 高速掠海突擊)
  | 'yak9'       // Yak-9 (活塞式輕型戰鬥機 · 靈巧盤旋、機首 20mm 機砲)
  | 'il10'       // IL-10 (鐵獸裝甲強擊機 · 23mm雙翼砲 · 堅固重裝甲低空俯衝掃射)
  // Era 4 OPFOR Aircraft & Missile Attack Craft
  | 'mig17'      // MiG-17 Fresco (高亞音速纏鬥機 · 37mm/23mm機砲)
  | 'mig21'      // MiG-21 Fishbed (2馬赫三角翼攔截機 · K-13 環礁空空飛彈)
  | 'il28'       // IL-28 Beagle (雙噴射輕轟炸機 · 魚雷/反艦火箭)
  | 'komar_ptg'; // Komar 級飛彈快艇 (P-15 冥河反艦飛彈)

export type AircraftRole =
  | 'fighter'
  | 'dive_bomber'
  | 'torpedo_bomber'
  | 'scout'
  | 'level_bomber'
  | 'attacker'
  | 'aew'       // 空中早期預警機 (AD-3W)
  | 'rescue'    // 搜救/醫療直升機 (HO3S-1)
  | 'transport'; // 戰術空投運輸機 (C-1)

export interface LifeRaft {
  id: string;
  side: 'player' | 'enemy';
  pos: Vector2D;
  planeModel: AircraftModel;
  planeName: string;
  pilotName: string;
  timer: number;       // 存活倒數 (秒，預設 90s)
  maxTimer: number;    // 90s
  rescued: boolean;
  rescueProgress: number; // 0 to 3s when unit is in proximity
  isOnLand?: boolean;  // 降落於陸地島嶼/大陸之跳傘飛行員
  isCapturedPOW?: boolean; // 是否已被作為戰俘收押
}

export type AircraftState =
  | 'climbing'
  | 'cruising'
  | 'patrolling'
  | 'diving'
  | 'pullout' // 俯衝投彈後大G值拉起脫離 (High-G Pullout with wingtip vortex)
  | 'attacking'
  | 'bombing_run' // 專屬直線穿越目標平飛轟炸走廊 (Straight-Line Bombing Corridor)
  | 'returning'
  | 'landing'
  | 'shot_down'
  | 'kamikaze_dive';

export interface Aircraft {
  id: string;
  squadronId: string;
  model: AircraftModel;
  role: AircraftRole;
  side: ShipSide;
  pos: Vector2D;
  vel: Vector2D;
  heading: number;
  targetHeading: number;
  speed: number;
  maxSpeed: number;
  altitude: number; // 0 to 1 (1 = high cruise, 0.15 = sea level attack)
  state: AircraftState;
  pulloutTimer?: number;
  breakawayTimer?: number;
  health: number;
  maxHealth: number;
  order: UnitOrder;
  targetPos?: Vector2D;
  hasPayload: boolean;
  ammoRemaining?: number;
  maxAmmo?: number;
  gunAmmo?: number;
  maxGunAmmo?: number;
  flightName?: string;
  flightCallsign?: string;
  flightNumber?: number;
  payloadType?: AircraftPayloadType;
  payloadName?: string;
  carrierId?: string;
  shootCooldown: number;
  strafeTarget?: Vector2D;
  deathTimer?: number;
  wingmanOffset: Vector2D;
  name: string;
  isKamikaze?: boolean;
  hasOhkaAttached?: boolean;
  ohkaCarrierId?: string;
  carpetBombTimer?: number;
  carpetBombDropsLeft?: number;
  // 直線穿透轟炸走廊屬性 (Straight-Line Bombing Run Corridor)
  bombingRunHeading?: number;
  bombingRunTarget?: Vector2D;
  bombingDropsTotal?: number;
  bombingDropsLeft?: number;
  bombingDropCooldown?: number;
  bombingPassedTargetDist?: number;
  missionType?: EnemyAirMissionType;
  isWinchester?: boolean;
  // 半主動雷達導引機頭照射狀態 (SARH Nose Radar Illumination)
  sarhIlluminatingTargetId?: string;
  sarhHoldTimer?: number;
  // 轟炸機與攻擊機自衛機槍火力 (Defensive Tail/Dorsal Gunners)
  hasDefensiveTurret?: boolean;
  rearGunnerCooldown?: number;
  tailGunnerCooldown?: number;
  hasFiredRockets?: boolean;
  // 戰機多元墜毀物理與解體模式 (Multi-mode Aircraft Crash Physics)
  crashMode?: 'smoke' | 'burn' | 'breakup' | 'spin';
  crashSpinSpeed?: number;
  crashDebris?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    rotSpeed: number;
    type: 'wing' | 'tail' | 'prop';
  }[];
  // 時代四機載自我防禦系統 (Era 4 Chaff / Flare & Evasive Break Maneuvers)
  chaffCount?: number;
  maxChaff?: number;
  flareCount?: number;
  maxFlare?: number;
  cmCooldown?: number; // 誘餌發射間隔
  isEvading?: boolean;
  evasionTimer?: number;
  evasionTurnSign?: number;
}

export type InstallationType =
  | 'airfield'
  | 'coastal_gun'
  | 'radar_station'
  | 'ammo_depot'
  | 'ship_repair_dock'   // 友軍船舶維修設施 / 應急造船廠浮塢
  | 'pontoon_pier'       // 浮式人工棧橋港 (急造港口 - 可供海運卸載與建立全島補給線)
  | 'major_naval_port'   // 正規深水軍港 (由工兵駐守棧橋港升級或直接採購之全功能戰略深水大港)
  | 'supply_depot'       // 戰地輜重補給樞紐 (加速地面部隊建制度整備與彈藥調配)
  | 'field_hospital'     // 戰地野戰醫院 (救治傷患、快速恢復陸上部隊組織度與兵員)
  | 'infantry_squad'     // 步兵班 (NATO Infantry X with squad dot)
  | 'infantry_platoon'   // 步兵排 (NATO Infantry X with platoon pips)
  | 'tank_platoon'       // 戰車排 (NATO Armor oval with platoon pips)
  | 'tank_battalion'     // 戰車大隊 (NATO Armor oval with battalion ticks)
  | 'towed_artillery'    // 拖曳砲型兵陣地 (NATO Field Artillery solid dot)
  | 'flak_battery'       // 防空高射砲陣地 (NATO Air Defense)
  | 'command_post'       // 指揮所 (NATO HQ Command Post Staff Flag)
  | 'battalion_cp'       // 營指揮所 (前進作戰指揮部 - 呼叫支援選單與地面部隊增援集結出生點)
  | 'hidden_tunnel'      // 地下坑道隱蔽點 (Tunnel Ambush Spawner)
  | 'city'               // 城市/城鎮核心市區 (密集街區與混凝土建築，提供部隊城市戰掩體)
  | 'town'               // 城鎮市集 (提供部隊城市戰掩蔽)
  | 'settlement'         // 沿海漁村與定居點 (平民居住區)
  | 'refugee_camp'       // 戰地難民收容營 (聯合國/紅十字帳篷區，遭受火力攻擊扣除 15 CP)
  // 時代四特種防空與前進雷達作戰設施 (Era 4 Cold War / Vietnam Installations)
  | 'sa2_sam_site'       // SA-2 導針 (Guideline) 地空防空飛彈發射營
  | 'fan_song_radar'     // Fan Song 扇歌火控制導雷達陣地 (摧毀後癱瘓聯網之 SA-2 發射陣地)
  | 'forward_fob'        // 美軍野戰前進作戰基地 (Forward Operating Base · 直升機補給突擊點)
  | 'sam_hawk'           // 美軍陸戰隊 MIM-23 鷹式防空飛彈排 (Hawk SAM Site)
  | 'bunker_nest'        // 加固鋼筋混凝土機槍/迫擊砲掩體 (Fortified Bunker)
  | 'rubber_plantation'  // 中立橡膠種植園加工廠 (提供叢林步兵掩蔽)
  | 'river_ferry'        // 沿河渡口碼頭與浮筒棧橋 (交通要道)
  | 'radio_station'      // 廣播電台/通訊中繼站 (雷達視野中繼)
  | 'ammo_cache'         // 前沿彈藥庫存點
  | 'watchtower';        // 邊境瞭望高塔哨所

export type ActiveDockFacility = 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp';

export interface Installation {
  id: string;
  type: InstallationType;
  name: string;
  weaponDesc?: string;
  pos: Vector2D;
  angle: number;
  health: number;
  maxHealth: number;
  armor?: number;
  range: number;
  cooldown: number;
  reloadTime: number;
  isDestroyed: boolean;
  side: ShipSide;
  spawnTimer?: number;
  strongholdId?: string;
  isASuWOnly?: boolean;
  upgradeTimer?: number; // 工兵駐守升級累積時間 (例如急造棧橋港達 35s 升級為正規軍港)
  civilianZoneRadius?: number; // 城市/城鎮/定居點/難民營之平民區影響半徑 (米)
  isCivilian?: boolean;        // 是否為非軍事平民保護區 (受擊將觸發附帶損害警告與扣除 15 CP)
  isRadarEmitting?: boolean;   // 雷達發射信號 (供 AGM-45 反輻射飛彈追蹤)
  samMissilesReady?: number;   // 鷹式/SA-2 飛彈備射量
  samMaxMissiles?: number;
  captureProgress?: number;    // 陣地/設施佔領進度 (0~100)
}

export interface IslandStronghold {
  id: string;
  name: string;
  cpPos: Vector2D;
  isCaptured: boolean;
  captureProgress: number; // 0 to 100
  garrisonIds: string[];
  hasTriggeredAmbush?: boolean;
  hasTriggeredBanzai?: boolean;
}

export interface Island {
  id: string;
  name: string;
  center: Vector2D;
  radius: number;
  points: Vector2D[];
  contours: Vector2D[][];
  installations: Installation[];
  strongholds?: IslandStronghold[];
  isFriendlyBase?: boolean;
  isFullyCaptured?: boolean;
  isMainland?: boolean;
  jungles?: { x: number; y: number; radius: number; density: number }[];
  roads?: { points: Vector2D[]; type: 'road' | 'trail' }[];
  hills?: { x: number; y: number; radius: number }[];
  rivers?: { points: Vector2D[]; width: number }[];
}

export interface FriendlyAirbasePool {
  ready: Record<string, number>;
  replenishTimer: number;
  replenishMax: number;
}

export type ProjectileType =
  | 'shell'
  | 'bullet'
  | 'torpedo'
  | 'bomb'
  | 'depth_charge'
  | 'rocket'
  | 'hedgehog'
  // 時代四導引飛彈系統 (Era 4 Guided Missiles)
  | 'missile_aam'   // 空對空飛彈 (AIM-9 響尾蛇 / AIM-7 麻雀 / K-13 環礁) - 具反機與反飛彈攔截
  | 'missile_sam'   // 面對空飛彈 (Terrier / Tartar / Sea Sparrow / SA-2 / Hawk) - 攔截敵機與飛彈
  | 'missile_ashm'  // 空艦/艦艦飛彈 (AGM-12 犢牛犬 / P-15 冥河反艦飛彈) - 重甲貫穿
  | 'missile_arm';   // 反輻射飛彈 (AGM-45 百靈鳥) - 專門追蹤雷達信號

export interface Projectile {
  id: string;
  type: ProjectileType;
  side: ShipSide;
  pos: Vector2D;
  vel: Vector2D;
  originPos: Vector2D;
  targetPos: Vector2D;
  flightProgress: number;
  maxDistance: number;
  distanceTraveled: number;
  damage: number;
  blastRadius: number;
  speed: number;
  heading: number;
  isDead: boolean;
  trail: Vector2D[];
  fuseTimer?: number;
  attackerName?: string;
  sourceModel?: AircraftModel;
  bombType?: AircraftPayloadType;
  targetEntityName?: string;
  isNapalm?: boolean;
  isTinyTim?: boolean;
  isAcousticHoming?: boolean;
  isHedgehog?: boolean;
  arcAltitude?: number;
  tumbleAngle?: number;
  isBeamTracer?: boolean; // 仿 M61 火神砲 / GSh-23 連續高亮光束彈幕
  isNuclear?: boolean;
  // 時代四飛彈導引與目標屬性 (Era 4 Missile Guidance & Interception)
  targetEntityId?: string;
  targetEntityType?: 'aircraft' | 'ship' | 'installation' | 'projectile';
  guidanceType?: 'ir' | 'sarh' | 'radio' | 'tv' | 'anti_radiation' | 'active_radar' | 'command_radar' | 'semi_active_radar' | 'radar_homing' | 'infrared';
  turnRate?: number;
  fuelTimer?: number;
  isInterceptionMissile?: boolean;
  isAirDrop?: boolean;
  // ASROC 反潛火箭助飛魚雷與聲自導魚雷 (ASROC & Acoustic Homing Torpedo)
  isASROC?: boolean;
  asrocStage?: 'boost' | 'glide' | 'parachute' | 'water_homing';
  asrocTimer?: number;
  acousticPingTimer?: number;
  sarhIlluminatorId?: string; // 機頭/艦載射控雷達照射源 ID
  isDecoyed?: boolean; // 被箔條雲/熱焰彈誘騙偏航
  decoyTargetPos?: Vector2D;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  type:
    | 'spark'
    | 'smoke'
    | 'flak'
    | 'flak_puff'
    | 'splash'
    | 'shockwave'
    | 'torpedo_bubble'
    | 'shrapnel'
    | 'geyser'
    | 'tracer'
    | 'oil_slick'
    | 'fire'
    | 'flare'
    | 'chaff'
    | 'chaff_cloud';
  shape?: 'circle' | 'line' | 'ring';
  length?: number;
  scale?: number;
  rot?: number;
  rotSpeed?: number;
}

export type FleetFormation = 'circular_screen' | 'line_ahead' | 'wedge_strike' | 'independent_rts';

export interface SectorIntel {
  sectorNumber: number;
  sectorName: string;
  era: Era;
  theater: string;
  briefing: string;
  primaryObjective: string;
  secondaryObjective: string;
  isVictory?: boolean;
  isDefeat?: boolean;
  starsEarned?: number;
  isCompleted?: boolean;
}

export interface FleetUpgrades {
  hullArmorLevel: number;
  aaFirepowerLevel: number;
  radarRangeLevel: number;
  carrierCapacityLevel: number;
  artilleryDamageLevel: number;
  depthChargeSonarLevel: number;
  unlockedF8F?: boolean; // Era 2 Bearcat elite interceptor
}

export interface GameScore {
  enemyShipsSunk: number;
  enemyPlanesDowned: number;
  installationsDestroyed: number;
  sectorsCleared: number;
  totalScore: number;
  stars: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
}

export type CombatLogCategory = 'all' | 'air' | 'naval' | 'aa' | 'sunk';

export interface CombatDiceRoll {
  dieType: 'd100' | 'd20';
  roll: number;
  targetScore: number;
  result: 'crit' | 'hit' | 'near_miss' | 'miss';
  rollDesc: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  category: 'air' | 'naval' | 'aa' | 'sunk';
  sourceSide: ShipSide;
  sourceName: string;
  targetName: string;
  actionType:
    | 'bomb_hit'
    | 'bomb_crit'
    | 'bomb_near_miss'
    | 'bomb_miss'
    | 'torpedo_hit'
    | 'rocket_hit'
    | 'gun_hit'
    | 'aa_down'
    | 'dogfight_down'
    | 'ship_sunk'
    | 'installation_down'
    | 'recon_spotted';
  text: string;
  damage?: number;
  isCrit?: boolean;
  diceRoll?: CombatDiceRoll;
}

// ══════════════════════════════════════════════════════════
// 戰區資源點數 (Command Points / Logistics Requisition System)
// ══════════════════════════════════════════════════════════

export type RequisitionCategory = 'ships' | 'aircraft' | 'ground' | 'installations';

export interface RequisitionItem {
  id: string;
  category: RequisitionCategory;
  name: string;
  nameZh: string;
  cost: number;
  era: 'era1' | 'era2' | 'era3' | 'era4' | 'both' | 'all';
  badge: string;
  desc: string;
  statsDesc: string;
  typeTag: string; // e.g. ShipType, AircraftModel, GroundUnitType, InstallationType
  requiresIsland?: boolean;
}

export interface ResourceState {
  points: number;
  ratePerSecond: number;
  totalEarned: number;
  totalSpent: number;
  islandBonus: number;
  killBonus: number;
}

export interface CasualtiesReport {
  playerShipsLost: number;
  enemyShipsLost: number;
  playerPlanesLost: number;
  enemyPlanesLost: number;
  playerGroundLost: number;
  enemyGroundLost: number;
  playerInstallationsLost: number;
  enemyInstallationsLost: number;
  playerTonnageLost: number;
  enemyTonnageLost: number;
  directHitsScored: number;
  torpedoHitsScored: number;
  critsScored: number;
}

