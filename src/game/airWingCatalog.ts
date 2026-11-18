import {
  Aircraft,
  AircraftModel,
  AircraftPayloadType,
  AircraftRole,
  Era,
  GroundUnit,
  Ship,
} from '../types/game';

export type SelectableUnit = Ship | Aircraft | GroundUnit;

export function isAircraftUnit(u: SelectableUnit): u is Aircraft {
  return 'model' in u && 'altitude' in u && 'role' in u;
}

export function isShipUnit(u: SelectableUnit): u is Ship {
  return 'wakePoints' in u && 'turrets' in u;
}

export function isGroundUnit(u: SelectableUnit): u is GroundUnit {
  return 'organization' in u && 'strength' in u && !('wakePoints' in u);
}

export interface CarrierModelDef {
  model: AircraftModel;
  label: string;
  role: AircraftRole;
  desc: string;
}

export interface AfbModelDef {
  id: AircraftModel;
  label: string;
  role: AircraftRole;
  desc: string;
  isNavy: boolean;
}

export function getCarrierModelsForEra(era: Era): CarrierModelDef[] {
  if (era === 'era1') {
    return [
      { model: 'f4f', label: 'F4F Wildcat', role: 'fighter', desc: '4x .50 cal · CAP Escort' },
      { model: 'sbd', label: 'SBD Dauntless', role: 'dive_bomber', desc: 'AP Bomb / Dual 500lb' },
      { model: 'tbd', label: 'TBD Devastator', role: 'torpedo_bomber', desc: 'Mk 13 Torpedo / ASW' },
      { model: 'os2u', label: 'OS2U Kingfisher', role: 'scout', desc: 'Air Recon & Spotting' },
    ];
  }
  if (era === 'era2') {
    return [
      { model: 'f6f', label: 'F6F Hellcat', role: 'fighter', desc: '6x .50 cal · Heavy fighter' },
      { model: 'f4u', label: 'F4U Corsair', role: 'fighter', desc: 'Bent-wing speed bird' },
      { model: 'f8f', label: 'F8F Bearcat', role: 'fighter', desc: 'Climb rocket · 20mm cannons' },
      { model: 'sb2c', label: 'SB2C Helldiver', role: 'dive_bomber', desc: 'Twin 20mm + Heavy Bomb' },
      { model: 'tbf', label: 'TBF Avenger', role: 'torpedo_bomber', desc: 'Heavy naval torpedo strike' },
      { model: 'sc1', label: 'SC-1 Seahawk', role: 'scout', desc: 'High-speed Floatplane & Radar' },
    ];
  }
  if (era === 'era3') {
    return [
      { model: 'f8f', label: 'F8F Bearcat', role: 'fighter', desc: 'Climb rocket · 4x 20mm M3' },
      { model: 'f9f', label: 'F9F Panther', role: 'fighter', desc: 'Carrier Jet · 4x 20mm Colt · HVAR' },
      { model: 'f2h', label: 'F2H Banshee', role: 'fighter', desc: 'Twin Jet Interceptor · Long Range' },
      { model: 'ad1', label: 'AD-1 Skyraider', role: 'attacker', desc: 'Tiny Tim / Napalm / 2000lb Bomb' },
      { model: 'f4u4', label: 'F4U-4 Corsair', role: 'fighter', desc: 'Late Fighter-Bomber · 4x 20mm' },
      { model: 'af_guardian', label: 'AF Guardian', role: 'torpedo_bomber', desc: 'Hunter-Killer ASW · Homing Torp' },
      { model: 'ad3w', label: 'AD-3W Skyraider', role: 'aew', desc: '6500m Radar Sentry · Global AEW' },
      { model: 'ho3s1', label: 'HO3S-1 Dragonfly', role: 'rescue', desc: 'SAR Helicopter · Pilot Rescue' },
    ];
  }
  if (era === 'era4') {
    return [
      {
        model: 'f4b',
        label: 'F-4B Phantom II',
        role: 'fighter',
        desc: '超音速重型戰鬥機 · AIM-7麻雀/AIM-9響尾蛇',
      },
      {
        model: 'f4j',
        label: 'F-4J Phantom II',
        role: 'fighter',
        desc: '雷達火控升級 · 全天候空空飛彈截擊',
      },
      {
        model: 'f8',
        label: 'F-8 Crusader',
        role: 'fighter',
        desc: '最後的十字軍近戰機 · 4x 20mm 機砲 · 響尾蛇',
      },
      {
        model: 'a4',
        label: 'A-4 Skyhawk',
        role: 'attacker',
        desc: '天鷹輕型攻擊機 · 蛇眼減速航彈 / 白眼',
      },
      {
        model: 'a6a',
        label: 'A-6A Intruder',
        role: 'attacker',
        desc: '全天候夜戰重攻擊機 · DIANE雷達系統',
      },
      {
        model: 'a6b_weasel',
        label: 'A-6B Wild Weasel',
        role: 'attacker',
        desc: '防空網壓制野鼬機 · AGM-45反輻射飛彈',
      },
      {
        model: 'e1',
        label: 'E-1 Tracer',
        role: 'aew',
        desc: '艦載預警機 · 7500m 早期遠程警戒雷達',
      },
      {
        model: 's2',
        label: 'S-2 Tracker',
        role: 'scout',
        desc: '雙發艦載反潛巡邏機 · 聲納浮標與反潛魚雷',
      },
      {
        model: 'uh2',
        label: 'UH-2 Seasprite',
        role: 'rescue',
        desc: '艦載搜救直升機 · 自動跳傘飛行員即時打撈',
      },
      {
        model: 'sh2',
        label: 'SH-2 Seasprite',
        role: 'torpedo_bomber',
        desc: 'LAMPS I 艦載反潛直升機 · 聲納浮標與Mk 46魚雷',
      },
      {
        model: 'p3',
        label: 'P-3C Orion',
        role: 'torpedo_bomber',
        desc: '長程反潛巡邏機 · MAD磁異探測儀與聲導魚雷',
      },
      {
        model: 'c1',
        label: 'C-1 Trader',
        role: 'transport',
        desc: '艦載突擊機 · 傘兵空投作戰',
      },
    ];
  }
  return [
    {
      model: 'f14a',
      label: 'F-14A Tomcat',
      role: 'fighter',
      desc: 'AWG-9 脈衝都卜勒雷達 · AIM-54 鳳凰超長程攔截',
    },
    {
      model: 'fa18a',
      label: 'F/A-18A Hornet',
      role: 'fighter',
      desc: '全天候艦載多用途打擊戰鬥機 · AIM-7/9/魚叉',
    },
    {
      model: 'a6e',
      label: 'A-6E TRAM',
      role: 'attacker',
      desc: 'TRAM 光電夜戰打擊系統 · 鋪路雷射/魚叉/集束彈',
    },
    {
      model: 'ea6b',
      label: 'EA-6B Prowler',
      role: 'attacker',
      desc: 'ALQ-99 電戰干擾莢艙 · AGM-88 HARM 高速反輻射',
    },
    {
      model: 'av8b',
      label: 'AV-8B Harrier II',
      role: 'attacker',
      desc: '陸戰隊垂直起降攻擊機 · 近接對地支援 CAS',
    },
    {
      model: 's3a',
      label: 'S-3A Viking',
      role: 'scout',
      desc: '雙噴射艦載反潛機 · 聲納浮標與魚雷',
    },
    {
      model: 'e2c',
      label: 'E-2C Hawkeye',
      role: 'aew',
      desc: 'APS-120 圓盤預警雷達 · 8500m 全域預警',
    },
    {
      model: 'sh3f',
      label: 'SH-3F Sea King',
      role: 'torpedo_bomber',
      desc: '重型艦載反潛直升機 · 吊放聲納與Mk 46魚雷',
    },
    {
      model: 'ch53',
      label: 'CH-53D Sea Stallion',
      role: 'rescue',
      desc: '重型直升機 · 突擊部隊垂直機降與人員搜救',
    },
    {
      model: 'c2a',
      label: 'C-2A Greyhound',
      role: 'transport',
      desc: 'COD 艦載空運機 · 前線傘降與快速補給',
    },
    {
      model: 'a10a',
      label: 'A-10A Thunderbolt II',
      role: 'attacker',
      desc: '30mm GAU-8 復仇者機砲 · 小牛飛彈 (CAS王牌)',
    },
    {
      model: 'f15a',
      label: 'F-15A Eagle',
      role: 'fighter',
      desc: '空中優勢制空戰機 · AIM-7/AIM-9 不敗傳奇',
    },
    {
      model: 'f16a',
      label: 'F-16A Fighting Falcon',
      role: 'fighter',
      desc: '輕型多用途戰鬥機 · 9G 大過載格鬥與打擊',
    },
    {
      model: 'ah64a',
      label: 'AH-64A Apache',
      role: 'attacker',
      desc: '地獄火雷射導引反戰車飛彈 · 30mm 鏈砲',
    },
    {
      model: 'ah1w',
      label: 'AH-1W SuperCobra',
      role: 'attacker',
      desc: '陸戰隊雙發重武裝攻擊直升機 · 陶式/地獄火',
    },
    {
      model: 'e3a',
      label: 'E-3A Sentry',
      role: 'aew',
      desc: '大型旋轉雷達罩長程戰略預警機 · 全戰區破霧',
    },
    {
      model: 'f111',
      label: 'F-111 Aardvark',
      role: 'attacker',
      desc: '可變翼超音速地貌穿透長程重型打擊機',
    },
  ];
}

export function getAfbModelsForEra(era: Era): AfbModelDef[] {
  if (era === 'era1') {
    return [
      { id: 'b17', label: 'B-17 飛行堡壘', role: 'level_bomber', desc: '4發重型水平轟炸機 · 12枚連環地毯轟炸', isNavy: false },
      { id: 'b25', label: 'B-25B 米切爾', role: 'level_bomber', desc: '雙發中型轟炸機 · 雙垂尾 · 8枚地毯轟炸', isNavy: false },
      { id: 'p40', label: 'P-40 戰鷹', role: 'fighter', desc: '陸航空優戰鬥機 · 截擊空戰', isNavy: false },
      { id: 'p36a', label: 'P-36A 鷹式', role: 'fighter', desc: '陸航早期主力戰機 · 靈巧盤旋截擊', isNavy: false },
      { id: 'p39d', label: 'P-39D 空中眼鏡蛇', role: 'attacker', desc: '中置引擎 · 槳轂37mm機砲重穿甲', isNavy: false },
      { id: 'a20', label: 'A-20 浩劫', role: 'attacker', desc: '雙發對艦/對地重攻擊機', isNavy: false },
      { id: 'c47', label: 'C-47 空中列車', role: 'transport', desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
      { id: 'f4f', label: 'F4F 野貓 (海軍陸基)', role: 'fighter', desc: '可轉場回企業號航艦', isNavy: true },
      { id: 'sbd', label: 'SBD 無畏 (海軍陸基)', role: 'dive_bomber', desc: '可轉場回企業號航艦', isNavy: true },
      { id: 'tbd', label: 'TBD 毀滅者 (海軍陸基)', role: 'torpedo_bomber', desc: '可轉場回企業號航艦', isNavy: true },
    ];
  }
  if (era === 'era2') {
    return [
      { id: 'b24', label: 'B-24 解放者', role: 'level_bomber', desc: '超重型遠程水平轟炸機 · 16枚地毯連環航彈', isNavy: false },
      { id: 'b17_late', label: 'B-17G 飛行堡壘 (後期)', role: 'level_bomber', desc: '下顎雙聯.50機砲砲塔 · 密集防禦火網 · 16枚地毯轟炸', isNavy: false },
      { id: 'p51', label: 'P-51 野馬', role: 'fighter', desc: '長程高速空優戰鬥機 · 6x .50 機槍 / 火箭 / 航彈', isNavy: false },
      { id: 'p47', label: 'P-47 雷霆 (Jug)', role: 'attacker', desc: '裝甲戰鬥轟炸機 · 8x .50機槍 + 火箭/雙航彈', isNavy: false },
      { id: 'p38', label: 'P-38 閃電', role: 'fighter', desc: '雙身重戰鬥機 · 20mm機砲 + 4x .50機槍', isNavy: false },
      { id: 'c47', label: 'C-47 空中列車', role: 'transport', desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
      { id: 'f6f', label: 'F6F 地獄貓 (海軍陸基)', role: 'fighter', desc: '可轉場回艾塞克斯號', isNavy: true },
      { id: 'f4u', label: 'F4U 海盜 (海軍陸基)', role: 'fighter', desc: '可轉場回艾塞克斯號', isNavy: true },
      { id: 'sb2c', label: 'SB2C 地獄俯衝者', role: 'dive_bomber', desc: '可轉場回艾塞克斯號', isNavy: true },
      { id: 'tbf', label: 'TBF 復仇者 (海軍陸基)', role: 'torpedo_bomber', desc: '可轉場回艾塞克斯號', isNavy: true },
    ];
  }
  if (era === 'era3') {
    return [
      { id: 'b29', label: 'B-29 超級堡壘', role: 'level_bomber', desc: '萬米平流層戰略重轟 · 24枚連環地毯航彈 / Mk 4 戰術核彈', isNavy: false },
      { id: 'f86', label: 'F-86 軍刀', role: 'fighter', desc: '後掠翼噴射空優王者 · 6x .50 M3 柯爾特高射速機砲', isNavy: false },
      { id: 'f82', label: 'F-82 雙野馬長程截擊機', role: 'fighter', desc: '雙機身超長程護航戰機 · 6x .50高射速機砲', isNavy: false },
      { id: 'a26', label: 'A-26 入侵者', role: 'attacker', desc: '雙發高速重攻擊機 · 凝固汽油燃燒彈 / 小蒂姆火箭 / 巨彈', isNavy: false },
      { id: 'c47', label: 'C-47 空中列車', role: 'transport', desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
      { id: 'f9f', label: 'F9F 黑豹 (海軍陸基)', role: 'fighter', desc: '可轉場回奧里斯卡尼號', isNavy: true },
      { id: 'f2h', label: 'F2H 女妖 (海軍陸基)', role: 'fighter', desc: '可轉場回奧里斯卡尼號', isNavy: true },
      { id: 'ad1', label: 'AD-1 天襲者 (海軍陸基)', role: 'attacker', desc: '可轉場回奧里斯卡尼號', isNavy: true },
      { id: 'f4u4', label: 'F4U-4 海盜 (海軍陸基)', role: 'attacker', desc: '可轉場回奧里斯卡尼號', isNavy: true },
      { id: 'af_guardian', label: 'AF-2 獵潛衛士 (海軍陸基)', role: 'scout', desc: '可轉場回奧里斯卡尼號', isNavy: true },
    ];
  }
  if (era === 'era4') {
    return [
      { id: 'b52', label: 'B-52 同溫層堡壘', role: 'level_bomber', desc: '8發巨型戰略重轟 · 36枚弧形地毯轟炸 (Arc Light)', isNavy: false },
      { id: 'f4e', label: 'F-4E 幽靈II (陸空軍)', role: 'fighter', desc: '火神20mm航砲 + 麻雀/響尾蛇飛彈 · 超音速空優', isNavy: false },
      { id: 'f105', label: 'F-105D 雷公', role: 'attacker', desc: '超音速戰術戰轟機 · 百舌鳥反輻射飛彈 / 蛇眼減速彈', isNavy: false },
      { id: 'a7', label: 'A-7D 海盜II', role: 'attacker', desc: '對地打擊攻擊機 · 沃爾艾電視滑翔炸彈 / 蛇眼炸彈', isNavy: false },
      { id: 'a1h', label: 'A-1H 天襲者 (陸航/海航)', role: 'attacker', desc: '重裝活塞攻擊機 · 15個武器掛點 · 巨量航彈與火箭齊射', isNavy: false },
      { id: 'a37b', label: 'A-37B 蜻蜓式攻擊機', role: 'attacker', desc: '雙發輕型攻擊機 · 7.62mm米尼岡六管機槍 · 蛇眼航彈', isNavy: false },
      { id: 'f5a', label: 'F-5A 自由鬥士戰鬥機', role: 'fighter', desc: '雙發輕型超音速空優機 · 2x 20mm機砲 + 響尾蛇飛彈', isNavy: false },
      { id: 'f104g', label: 'F-104G 星式超音速戰機', role: 'fighter', desc: '2.0馬赫有人火箭 · 梯形小展弦比翼 · 響尾蛇飛彈', isNavy: false },
      { id: 'ov10', label: 'OV-10A 野馬', role: 'scout', desc: '前進空中管制 (FAC) / 觀測偵察 · 70mm FFAR火箭', isNavy: false },
      { id: 'ah1', label: 'AH-1G 眼鏡蛇', role: 'attacker', desc: '武裝攻擊直升機 · 20mm旋轉機砲 + 70mm火箭火網', isNavy: false },
      { id: 'uh1', label: 'UH-1D 休伊', role: 'rescue', desc: '陸戰隊空中垂直突擊 / 戰場直升機空降搜救', isNavy: false },
      { id: 'c1', label: 'C-1A 貿易商', role: 'transport', desc: '戰術艦載/陸基運輸機 · 陸戰隊傘兵空投遠程奪島', isNavy: false },
      { id: 'f4j', label: 'F-4J 幽靈 (海軍陸基)', role: 'fighter', desc: '可轉場回小鷹號超級航母 · 麻雀 + 響尾蛇飛彈', isNavy: true },
      { id: 'a6a', label: 'A-6A 入侵者 (海軍陸基)', role: 'attacker', desc: '可轉場回小鷹號超級航母 · 沃爾艾 / 百舌鳥 / 蛇眼', isNavy: true },
      { id: 'a4', label: 'A-4F 天鷹 (海軍陸基)', role: 'attacker', desc: '可轉場回小鷹號超級航母 · 輕型精準打擊 / 幼畜飛彈', isNavy: true },
      { id: 'e1', label: 'E-1B 追蹤者 (海軍陸基)', role: 'aew', desc: '可轉場回小鷹號超級航母 · 全向預警雷達', isNavy: true },
    ];
  }
  return [
    { id: 'a10a', label: 'A-10A 疣豬攻擊機 (開罐器)', role: 'attacker', desc: '30mm GAU-8 復仇者轉管巨砲 + 4x AGM-65 小牛導引飛彈', isNavy: false },
    { id: 'ah64a', label: 'AH-64A 阿帕契重裝武裝直升機', role: 'attacker', desc: '16枚 AGM-114 地獄火攻頂反戰車飛彈 + 30mm 鏈砲', isNavy: false },
    { id: 'ah1w', label: 'AH-1W 超級眼鏡蛇武裝直升機', role: 'attacker', desc: '8x 拖式反裝甲飛彈 + 20mm 旋轉機砲 + 響尾蛇空空防衛', isNavy: false },
    { id: 'f15a', label: 'F-15A 鷹式純空優戰鬥機', role: 'fighter', desc: 'APG-63 雷達 + 4x AIM-7F 麻雀 + 4x AIM-9L 響尾蛇', isNavy: false },
    { id: 'f16a', label: 'F-16A 戰隼超音速多用途戰機', role: 'fighter', desc: '電傳飛控高過載 + AIM-9L 響尾蛇 + AGM-65 小牛飛彈', isNavy: false },
    { id: 'e3a', label: 'E-3A 哨兵望樓預警機', role: 'aew', desc: '8000m 戰區巨型雷達早期預警 · 全戰區敵情即時共享', isNavy: false },
    { id: 'f111', label: 'F-111 土豚變後掠翼戰轟機', role: 'level_bomber', desc: '2.5馬赫低空突防 · 4x GBU-10 鋪路穿甲彈 / 魚叉反艦', isNavy: false },
    { id: 'b52', label: 'B-52G 同溫層堡壘 (現代化重轟)', role: 'level_bomber', desc: '8發巨型重轟 · 8x 魚叉長程反艦巡弋飛彈 / 走廊地毯轟炸', isNavy: false },
    { id: 'c130', label: 'C-130 大力士戰術運輸機', role: 'transport', desc: '戰術空投重型物資與陸戰隊傘兵部隊奪島', isNavy: false },
    { id: 'f14a', label: 'F-14A 雄貓 (海軍陸基分隊)', role: 'fighter', desc: '可轉場回尼米茲號航艦 · 4x AIM-54 鳳凰超遠程飛彈', isNavy: true },
    { id: 'fa18a', label: 'F/A-18A 大黃蜂 (海軍陸基分隊)', role: 'fighter', desc: '可轉場回尼米茲號航艦 · 魚叉反艦 + 小牛 + 響尾蛇', isNavy: true },
    { id: 'a6e', label: 'A-6E 侵入者 (海軍陸基分隊)', role: 'attacker', desc: '可轉場回尼米茲號航艦 · TRAM雷射穿甲 + 魚叉反艦', isNavy: true },
    { id: 'ea6b', label: 'EA-6B 徘徊者 (海軍陸基分隊)', role: 'attacker', desc: '可轉場回尼米茲號航艦 · ALQ-99電戰干擾 + AGM-88 HARM', isNavy: true },
    { id: 'av8b', label: 'AV-8B 海獵鷹II (陸戰隊垂直起降)', role: 'attacker', desc: '前線野戰短場起降 · GAU-12 25mm機砲 + 小牛飛彈', isNavy: true },
    { id: 's3a', label: 'S-3A 維京反潛機 (海軍陸基分隊)', role: 'scout', desc: '可轉場回尼米茲號航艦 · 磁異探測 + 魚叉反艦 + 反潛魚雷', isNavy: true },
    { id: 'e2c', label: 'E-2C 鷹眼預警機 (海軍陸基分隊)', role: 'aew', desc: '可轉場回尼米茲號航艦 · 6500m 超遠空情預警', isNavy: true },
    { id: 'sh3f', label: 'SH-3F 海王反潛直升機 (海軍陸基)', role: 'rescue', desc: '可轉場回尼米茲號航艦 · 吊放聲吶 + 聲自導反潛魚雷', isNavy: true },
    { id: 'ch53', label: 'CH-53 海種馬 (陸戰隊重型運輸)', role: 'transport', desc: '重裝甲吊運與大兵力垂直機降突擊', isNavy: true },
    { id: 'c2a', label: 'C-2A 灰狗艦載運輸機 (海軍陸基)', role: 'transport', desc: '可轉場回尼米茲號航艦 · 快速人員物資與傘兵空投', isNavy: true },
  ];
}

export const DEFAULT_CARRIER_FORMATION_COUNTS: Partial<Record<AircraftModel, number>> = {
  f4f: 2, sbd: 2, tbd: 2, os2u: 1,
  f6f: 2, f4u: 2, f8f: 2, sb2c: 2, tbf: 2, sc1: 1,
  f9f: 2, f2h: 2, ad1: 2, f4u4: 2, af_guardian: 2, ad3w: 1, ho3s1: 1,
  f4b: 2, f4j: 2, f8: 2, a4: 2, a6a: 2, a6b_weasel: 1, e1: 1, s2: 2, uh2: 1, sh2: 2, p3: 1, c1: 1,
  b52: 2, f4e: 2, f105: 2, a7: 2, ov10: 2, uh1: 2, ah1: 2,
  // Era 5 defaults
  f14a: 2, fa18a: 2, a6e: 2, ea6b: 1, av8b: 2, s3a: 2, e2c: 1, sh3f: 2, ch53: 1, c2a: 1,
  a10a: 2, f15a: 2, f16a: 2, ah64a: 2, ah1w: 2, e3a: 1, f111: 2,
};

export function getDefaultCarrierPayloads(
  activePayloads: Record<AircraftRole, AircraftPayloadType>
): Partial<Record<AircraftModel, AircraftPayloadType>> {
  return {
    f4f: activePayloads.fighter,
    sbd: activePayloads.dive_bomber,
    tbd: activePayloads.torpedo_bomber,
    os2u: activePayloads.scout,
    f6f: activePayloads.fighter,
    f4u: activePayloads.fighter,
    f8f: activePayloads.fighter,
    sb2c: activePayloads.dive_bomber,
    tbf: activePayloads.torpedo_bomber,
    sc1: activePayloads.scout,
    f9f: activePayloads.fighter,
    f2h: activePayloads.fighter,
    ad1: activePayloads.attacker || 'tiny_tim_rocket',
    f4u4: activePayloads.fighter,
    af_guardian: activePayloads.torpedo_bomber || 'asw_torpedo',
    ad3w: 'clean_guns',
    ho3s1: 'clean_guns',
    f4b: 'aim7_sparrow',
    f4j: 'aim7_sparrow',
    f8: 'aim9_sidewinder',
    a4: 'bombs_snakeye_retarded',
    a6a: 'bombs_snakeye_retarded',
    a6b_weasel: 'agm45_shrike',
    e1: 'clean_guns',
    s2: 'clean_guns',
    uh2: 'clean_guns',
    sh2: 'asw_torpedo',
    p3: 'asw_torpedo',
    c1: 'c1_paratroopers',
    b52: 'b52_megaton_carpet',
    f4e: 'aim7_sparrow',
    f105: 'agm45_shrike',
    a7: 'agm62_walleye',
    ov10: 'ffar_rockets_pod',
    uh1: 'helo_assault_troops',
    ah1: 'ffar_rockets_pod',
    // Era 5 defaults
    f14a: 'aim54_phoenix',
    fa18a: 'aim7_aim9_combo',
    a6e: 'rgm84_harpoon',
    ea6b: 'agm88_harm',
    av8b: 'agm65_maverick',
    s3a: 'asw_torpedo',
    e2c: 'scout_fuel',
    sh3f: 'asw_torpedo',
    ch53: 'helo_assault_troops',
    c2a: 'c1_paratroopers',
    a10a: 'agm65_maverick',
    f15a: 'aim7_aim9_combo',
    f16a: 'aim7_aim9_combo',
    ah64a: 'hellfire_missiles',
    ah1w: 'tow_missiles',
    e3a: 'scout_fuel',
    f111: 'gbu10_laser_paveway',
  };
}

export const DEFAULT_AFB_FORMATION_COUNTS: Partial<Record<string, number>> = {
  b17: 2, b24: 2, b29: 2, p40: 2, p38: 2, p51: 2, p47: 2, f86: 2, a20: 2, a26: 2,
  f4f: 2, f6f: 2, f4u: 2, f9f: 2, f2h: 2, ad1: 2, f4u4: 2, af_guardian: 2,
  c47: 1, c1: 1, c2a: 1, c130: 1, ch53: 1, uh1: 2,
  // Era 5 defaults
  a10a: 2, ah64a: 2, ah1w: 2, f15a: 2, f16a: 2, e3a: 1, f111: 2, b52: 2,
  f14a: 2, fa18a: 2, a6e: 2, ea6b: 1, av8b: 2, s3a: 2, e2c: 1, sh3f: 2,
};

export const DEFAULT_AFB_PAYLOADS: Partial<Record<string, AircraftPayloadType>> = {
  b17: 'bombs_carpet_250',
  b24: 'bombs_quad_500',
  b29: 'tactical_nuke',
  p40: 'clean_guns',
  p38: 'hvar_rockets',
  p51: 'clean_guns',
  p47: 'mixed_bombs_rockets',
  f86: 'clean_guns',
  a20: 'bombs_dual_500',
  a26: 'napalm_canister',
  c47: 'c1_paratroopers',
  c1: 'c1_paratroopers',
  c2a: 'c1_paratroopers',
  c130: 'c1_paratroopers',
  ch53: 'helo_assault_troops',
  // Era 5 defaults
  a10a: 'agm65_maverick',
  ah64a: 'hellfire_missiles',
  ah1w: 'tow_missiles',
  f15a: 'aim7_aim9_combo',
  f16a: 'aim7_aim9_combo',
  e3a: 'scout_fuel',
  f111: 'gbu10_laser_paveway',
  f14a: 'aim54_phoenix',
  fa18a: 'rgm84_harpoon',
  a6e: 'rgm84_harpoon',
  ea6b: 'agm88_harm',
  av8b: 'agm65_maverick',
  s3a: 'asw_torpedo',
  e2c: 'scout_fuel',
  sh3f: 'asw_torpedo',
};

export function getCompatiblePayloads(role: AircraftRole, currentEra: Era): AircraftPayloadType[] {
  if (role === 'fighter') {
    return currentEra === 'era5'
      ? ['aim54_phoenix', 'aim7_aim9_combo', 'rgm84_harpoon', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns', 'gbu10_laser_paveway', 'cbu_cluster_bombs']
      : currentEra === 'era4'
      ? ['tactical_b61_nuke', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns', 'blu27_napalm', 'bombs_snakeye_retarded', 'agm12_bullpup']
      : currentEra === 'era3'
      ? ['clean_guns', 'hvar_rockets', 'bomb_500', 'bomb_1000', 'napalm_canister']
      : ['clean_guns', 'hvar_rockets', 'bomb_500', 'bombs_dual_500'];
  }
  if (role === 'attacker') {
    return currentEra === 'era5'
      ? ['rgm84_harpoon', 'agm88_harm', 'gbu10_laser_paveway', 'agm65_maverick', 'cbu_cluster_bombs', 'mer_iron_bombs', 'bombs_snakeye_retarded', 'clean_guns']
      : currentEra === 'era4'
      ? ['tactical_b61_nuke', 'gbu10_laser_paveway', 'agm78_standard_arm', 'mer_iron_bombs', 'cbu_cluster_bombs', 'blu27_napalm', 'agm62_walleye', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'ffar_rockets_pod', 'bomb_2000', 'clean_guns']
      : currentEra === 'era3'
      ? ['tiny_tim_rocket', 'napalm_canister', 'bomb_2000', 'bomb_1000', 'aerial_torpedo', 'hvar_rockets']
      : ['mixed_bombs_rockets', 'hvar_rockets', 'bomb_1000', 'bombs_dual_500', 'clean_guns'];
  }
  if (role === 'dive_bomber') {
    return currentEra === 'era5' || currentEra === 'era4'
      ? ['gbu10_laser_paveway', 'cbu_cluster_bombs', 'blu27_napalm', 'mer_iron_bombs', 'bombs_snakeye_retarded', 'agm12_bullpup', 'agm62_walleye', 'bomb_2000']
      : currentEra === 'era3'
      ? ['bomb_1000', 'bomb_2000', 'bombs_dual_500']
      : currentEra === 'era2'
      ? ['bomb_1000', 'bombs_dual_500', 'bomb_1600']
      : ['bomb_1000', 'bombs_dual_500'];
  }
  if (role === 'torpedo_bomber') {
    return currentEra === 'era5'
      ? ['asw_torpedo', 'depth_bombs', 'rgm84_harpoon', 'bomb_1000']
      : currentEra === 'era4'
      ? ['asw_torpedo', 'depth_bombs', 'bomb_1000', 'gbu10_laser_paveway']
      : currentEra === 'era3'
      ? ['asw_torpedo', 'aerial_torpedo', 'depth_bombs', 'bomb_1000']
      : ['aerial_torpedo', 'bomb_1000', 'bombs_dual_500', 'depth_bombs'];
  }
  if (role === 'scout' || role === 'aew') {
    return currentEra === 'era5' || currentEra === 'era4'
      ? ['scout_fuel', 'blu27_napalm', 'ffar_rockets_pod', 'clean_guns']
      : ['scout_fuel', 'clean_guns', 'bomb_500'];
  }
  if (role === 'transport') {
    return ['c1_paratroopers', 'scout_fuel'];
  }
  if (role === 'rescue') {
    return currentEra === 'era5' || currentEra === 'era4' ? ['helo_assault_troops', 'clean_guns'] : ['clean_guns'];
  }
  return ['clean_guns', 'bomb_500'];
}

export function getDefaultAfbPayloadForUnit(
  id: string,
  role: AircraftRole,
  era: Era
): AircraftPayloadType {
  if (role === 'level_bomber') {
    if (id === 'b52') return era === 'era5' ? 'rgm84_harpoon' : 'b52_megaton_carpet';
    if (id === 'f111') return 'gbu10_laser_paveway';
    if (id === 'b29') return 'tactical_nuke';
    if (id === 'b24') return 'bombs_quad_500';
    return 'bombs_carpet_250';
  }
  if (role === 'attacker') {
    if (id === 'a10a') return 'agm65_maverick';
    if (id === 'ah64a') return 'hellfire_missiles';
    if (id === 'ah1w') return 'tow_missiles';
    if (id === 'a6e') return 'rgm84_harpoon';
    if (id === 'ea6b') return 'agm88_harm';
    if (id === 'av8b') return 'agm65_maverick';
    if (id === 'f105') return 'agm45_shrike';
    if (id === 'a7' || id === 'a6a') return 'agm62_walleye';
    if (id === 'ah1') return 'ffar_rockets_pod';
    if (id === 'a26' && era === 'era3') return 'napalm_canister';
    if (id === 'p47') return 'mixed_bombs_rockets';
    return era === 'era4' ? 'bombs_snakeye_retarded' : 'bombs_dual_500';
  }
  if (role === 'fighter') {
    if (id === 'f14a') return 'aim54_phoenix';
    if (id === 'fa18a') return 'rgm84_harpoon';
    if (id === 'f15a' || id === 'f16a') return 'aim7_aim9_combo';
    return era === 'era4' ? 'aim7_sparrow' : 'clean_guns';
  }
  if (role === 'transport') {
    return id === 'ch53' ? 'helo_assault_troops' : 'c1_paratroopers';
  }
  if (role === 'rescue') {
    if (id === 'sh3f') return 'asw_torpedo';
    return era === 'era4' ? 'helo_assault_troops' : 'clean_guns';
  }
  if (role === 'scout' || role === 'aew') {
    return id === 's3a' ? 'asw_torpedo' : 'scout_fuel';
  }
  if (role === 'dive_bomber') return 'bomb_1000';
  return 'aerial_torpedo';
}

export function getAfbCompatiblePayloads(
  id: string,
  role: AircraftRole,
  currentEra: Era
): AircraftPayloadType[] {
  if (role === 'level_bomber') {
    if (id === 'b52') {
      return currentEra === 'era5'
        ? ['rgm84_harpoon', 'b52_megaton_nuke', 'b52_megaton_carpet', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000']
        : ['b52_megaton_nuke', 'b52_megaton_carpet', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000'];
    }
    if (id === 'f111') {
      return ['gbu10_laser_paveway', 'rgm84_harpoon', 'mer_iron_bombs', 'bomb_2000', 'cbu_cluster_bombs', 'clean_guns'];
    }
    if (id === 'b29') {
      return ['tactical_nuke', 'bombs_carpet_250', 'bombs_quad_500', 'bomb_1000', 'bombs_dual_1000', 'bomb_2000', 'bomb_1600', 'bombs_dual_500'];
    }
    if (id === 'b24') {
      return ['bombs_quad_500', 'bombs_carpet_250', 'bomb_1600_ap', 'bomb_1600', 'bombs_dual_1000', 'bomb_1000', 'bombs_dual_500'];
    }
    return ['bombs_carpet_250', 'bombs_quad_500', 'bomb_1000', 'bombs_dual_1000', 'bombs_dual_500'];
  }
  if (role === 'attacker') {
    if (id === 'a10a') return ['agm65_maverick', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'clean_guns'];
    if (id === 'ah64a') return ['hellfire_missiles', 'clean_guns'];
    if (id === 'ah1w') return ['tow_missiles', 'aim9_sidewinder', 'clean_guns'];
    if (id === 'a6e') return ['rgm84_harpoon', 'gbu10_laser_paveway', 'agm65_maverick', 'mer_iron_bombs', 'cbu_cluster_bombs', 'clean_guns'];
    if (id === 'ea6b') return ['agm88_harm', 'clean_guns'];
    if (id === 'av8b') return ['agm65_maverick', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'clean_guns'];
    if (id === 'f105') {
      return ['tactical_b61_nuke', 'mer_iron_bombs', 'agm78_standard_arm', 'cbu_cluster_bombs', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000', 'clean_guns'];
    }
    if (id === 'a7') {
      return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'mer_iron_bombs', 'cbu_cluster_bombs', 'blu27_napalm', 'agm62_walleye', 'bombs_snakeye_retarded', 'agm12_bullpup', 'bomb_2000', 'bomb_1000', 'clean_guns'];
    }
    if (id === 'a6a' || id === 'a6b_weasel') {
      return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'agm78_standard_arm', 'mer_iron_bombs', 'cbu_cluster_bombs', 'agm62_walleye', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'bomb_2000', 'clean_guns'];
    }
    if (id === 'a4') {
      return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'blu27_napalm', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'agm12_bullpup', 'ffar_rockets_pod', 'bomb_1000', 'clean_guns'];
    }
    if (id === 'ov10') return ['blu27_napalm', 'ffar_rockets_pod', 'cbu_cluster_bombs', 'clean_guns'];
    if (id === 'ah1') return ['ffar_rockets_pod', 'clean_guns'];
    if (id === 'a26') return ['napalm_canister', 'tiny_tim_rocket', 'bomb_2000', 'bomb_1000', 'bombs_quad_500', 'bombs_dual_500', 'hvar_rockets'];
    if (id === 'p47') return ['mixed_bombs_rockets', 'hvar_rockets', 'bombs_quad_500', 'bombs_dual_500', 'bomb_1000'];
    return ['bombs_dual_500', 'bomb_1000', 'bombs_quad_500', 'hvar_rockets', 'aerial_torpedo', 'asw_depth_bombs', 'depth_bombs'];
  }
  if (role === 'fighter') {
    if (id === 'f14a') return ['aim54_phoenix', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns'];
    if (id === 'fa18a') return ['rgm84_harpoon', 'aim7_aim9_combo', 'agm65_maverick', 'agm88_harm', 'aim9_sidewinder', 'clean_guns'];
    if (id === 'f15a') return ['aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns'];
    if (id === 'f16a') return ['aim7_aim9_combo', 'agm65_maverick', 'gbu10_laser_paveway', 'aim9_sidewinder', 'clean_guns'];
    if (id === 'f4e' || id === 'f4j' || id === 'f4b') {
      return ['tactical_b61_nuke', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'blu27_napalm', 'agm12_bullpup', 'bombs_snakeye_retarded', 'clean_guns'];
    }
    if (id === 'f8') return ['aim7_aim9_combo', 'aim9_sidewinder', 'clean_guns', 'bombs_snakeye_retarded'];
    if (id === 'f86') return ['clean_guns', 'hvar_rockets', 'bomb_1000', 'napalm_canister'];
    if (id === 'p51') return ['clean_guns', 'hvar_rockets', 'bomb_500', 'bombs_dual_500'];
    if (id === 'p38') return ['hvar_rockets', 'clean_guns', 'bomb_1000', 'bombs_dual_500'];
    return ['clean_guns', 'bomb_500', 'bombs_dual_500', 'hvar_rockets'];
  }
  if (role === 'scout' || role === 'aew') {
    if (id === 's3a') return ['asw_torpedo', 'rgm84_harpoon', 'depth_bombs', 'scout_fuel', 'clean_guns'];
    if (id === 'e3a' || id === 'e2c' || id === 'e1') return ['scout_fuel', 'clean_guns'];
    if (id === 'ov10') return ['ffar_rockets_pod', 'scout_fuel', 'clean_guns'];
    if (id === 's2') return ['asw_torpedo', 'depth_bombs', 'scout_fuel', 'clean_guns'];
    return ['scout_fuel', 'clean_guns', 'bomb_500'];
  }
  if (role === 'rescue') {
    if (id === 'sh3f') return ['asw_torpedo', 'depth_bombs', 'clean_guns'];
    if (id === 'uh1' || id === 'uh2') return ['helo_assault_troops', 'clean_guns'];
    return ['clean_guns'];
  }
  if (role === 'transport') {
    if (id === 'ch53') return ['helo_assault_troops', 'c1_paratroopers', 'clean_guns'];
    return ['c1_paratroopers', 'scout_fuel'];
  }
  return getCompatiblePayloads(role, currentEra);
}
