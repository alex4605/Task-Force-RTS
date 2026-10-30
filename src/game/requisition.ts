import { RequisitionItem, Era } from '../types/game';

export function getRequisitionCatalog(era: Era): RequisitionItem[] {
  // ══════════════════════════════════════════════════
  // 時代四 (1965-1973) 越戰與冷戰超音速導彈時代專屬型錄
  // ══════════════════════════════════════════════════
  if (era === 'era4') {
    return [
      // Ships
      {
        id: 'req-ship-cv63',
        category: 'ships',
        name: 'USS Kitty Hawk (CV-63 超級航空母艦)',
        nameZh: '小鷹號超級航母 (CV-63)',
        cost: 1350,
        era: 'era4',
        badge: '斜角甲板+海麻雀SAM',
        desc: '小鷹級超級航母首艦，裝備現代化斜角飛行甲板、4座C-13蒸氣彈射器與RIM-7海麻雀防空飛彈系統，搭載90+超音速機隊！',
        statsDesc: 'HP: 9500 | RIM-7海麻雀SAM (1600m自動防空) | 4座蒸氣彈射器 | 90+艦載機容量',
        typeTag: 'cv63',
      },
      {
        id: 'req-ship-cg',
        category: 'ships',
        name: 'USS Belknap (CG-26 導彈巡洋艦)',
        nameZh: '貝爾納普級導彈巡洋艦 (CG-26)',
        cost: 750,
        era: 'era4',
        badge: '雙聯梗犬SAM (2200m)',
        desc: '配備 Mk 10 雙聯裝梗犬 (Terrier) 艦對空飛彈發射架、5吋54倍徑自動艦砲與 SPS-48 3D 空中搜索雷達，建立 2200m 區域防空傘！',
        statsDesc: 'HP: 4200 | 雙聯 Terrier SAM (2200m射程) | 127mm自動平高兩用砲 | 區域防空',
        typeTag: 'cg',
      },
      {
        id: 'req-ship-ddg',
        category: 'ships',
        name: 'USS Charles F. Adams (DDG-2 導彈驅逐艦)',
        nameZh: '亞當斯級導彈驅逐艦 (DDG-2)',
        cost: 480,
        era: 'era4',
        badge: '韃靼人SAM (1800m)',
        desc: '美國海軍第一代專職導彈驅逐艦，艦艉配備 Mk 11 雙臂韃靼人 (Tartar) 防空導彈發射架與 2門 127mm 54倍徑自動砲。',
        statsDesc: 'HP: 2600 | Tartar SAM 防空飛彈 | 2座 127mm/54 自動砲 | 航速: 33kt',
        typeTag: 'ddg',
      },
      {
        id: 'req-ship-lph',
        category: 'ships',
        name: 'USS Iwo Jima (LPH-2 硫磺島級兩棲突擊艦)',
        nameZh: '硫磺島級兩棲突擊艦 (LPH-2)',
        cost: 520,
        era: 'era4',
        badge: '垂直包圍登陸',
        desc: '世界首型專門建造的直升機兩棲突擊艦，全通式飛行甲板搭載直升機空中突擊隊，實現遠程垂直包圍作戰！',
        statsDesc: 'HP: 3800 | 搭載直升機空中突擊隊 | 垂直包圍登陸能力',
        typeTag: 'lph',
      },
      {
        id: 'req-ship-lcm8',
        category: 'ships',
        name: 'LCM-8 機械化登陸艇 (Mike Boat)',
        nameZh: 'LCM-8 機械化重裝登陸艇',
        cost: 120,
        era: 'era4',
        badge: '重戰車搶灘',
        desc: '越戰時期主力鋼製機械化登陸艇 (Mike Boat)，可載運 1輛 M48 巴頓主力戰車或 200名陸戰隊員搶灘破障！',
        statsDesc: 'HP: 900 | 運載力: 1輛 M48 戰車或 2個突擊步兵排',
        typeTag: 'lcm8',
      },
      {
        id: 'req-ship-ss',
        category: 'ships',
        name: 'USS Tang (SS-563 高速柴電攻擊潛艦)',
        nameZh: '刺尾鯛級攻擊潛艦 (SS-563)',
        cost: 280,
        era: 'era4',
        badge: '水下伏擊+反潛',
        desc: '配備現代化水下聲納陣列與聲自導反艦/反潛魚雷，獵殺敵方水面戰艦與潛艦。',
        statsDesc: 'HP: 1600 | 高速水下機動 | 聲自導魚雷支援',
        typeTag: 'ss',
      },
      {
        id: 'req-ship-dd',
        category: 'ships',
        name: 'USS Forrest Sherman (DD-931 驅逐艦)',
        nameZh: '雪曼級主力驅逐艦 (DD-931)',
        cost: 440,
        era: 'era4',
        badge: 'Mk 42 5吋全自動砲+ASROC',
        desc: '戰後建造之末代純火砲全能驅逐艦！3門 Mk 42 5吋/54自動速射砲 (40發/分) 與 ASROC 反潛火箭、Mk 32 艦側魚雷發射管。',
        statsDesc: 'HP: 2600 | 3門 5吋/54 全自動速射艦砲 | ASROC 反潛火箭 | Mk 32 魚雷 | 34kt',
        typeTag: 'dd',
      },
      {
        id: 'req-ship-ffg',
        category: 'ships',
        name: 'USS Knox (FFG-1052 諾克斯級巡防艦)',
        nameZh: '諾克斯級反潛巡防艦 (FFG-1052)',
        cost: 390,
        era: 'era4',
        badge: '艦艏ASROC八聯裝+直升機坪',
        desc: '專職遠洋反潛巡防艦，配備 SQS-26 艦首低頻巨型聲納、艦橋前方 8聯裝 ASROC 八宿發射器與直升機飛行甲板。',
        statsDesc: 'HP: 2400 | 5吋54倍徑自動砲 | ASROC 八聯發射箱 | Mk 32 SVTT 魚雷 | LAMPS停機坪',
        typeTag: 'ffg',
      },

      // Aircraft
      {
        id: 'req-air-f4j',
        category: 'aircraft',
        name: 'F-4J Phantom II Fighter Flight (艦載超音速戰機)',
        nameZh: 'F-4J 幽靈II 全天候超音速戰鬥機 (+4架)',
        cost: 260,
        era: 'era4',
        badge: '麻雀+響尾蛇空空飛彈',
        desc: '美國海軍全天候雙發重型超音速艦載戰鬥機，裝備 AWG-10 脈衝多普勒雷達與 AIM-7 麻雀 / AIM-9 響尾蛇飛彈！',
        statsDesc: '+4架 F-4J 整備庫存 | AIM-7 Sparrow & AIM-9 Sidewinder',
        typeTag: 'air_f4j',
      },
      {
        id: 'req-air-f8',
        category: 'aircraft',
        name: 'F-8 Crusader Fighter Flight (最後的十字軍近戰機)',
        nameZh: 'F-8 十字軍近戰機 (+4架)',
        cost: 220,
        era: 'era4',
        badge: '可變傾角翼+4門20mm',
        desc: '「最後的近距離空中格鬥機」，配備可變安裝角機翼、4門 20mm 柯爾特機砲與 AIM-9 響尾蛇空空飛彈。',
        statsDesc: '+4架 F-8 整備庫存 | 4x 20mm Colt Cannons + AIM-9',
        typeTag: 'air_f8',
      },
      {
        id: 'req-air-a6a',
        category: 'aircraft',
        name: 'A-6A Intruder All-Weather Strike Flight (全天候重攻擊機)',
        nameZh: 'A-6A 入侵者全天候重型攻擊機 (+4架)',
        cost: 280,
        era: 'era4',
        badge: 'DIANE雷達轟炸',
        desc: '格魯曼全天候全盲夜戰重型艦載攻擊機，DIANE 整合火控系統支援狂暴阻力傘低空投彈與 AGM-12 犢牛犬飛彈！',
        statsDesc: '+4架 A-6A 整備庫存 | 蛇眼減速炸彈 / 犢牛犬空艦飛彈',
        typeTag: 'air_a6a',
      },
      {
        id: 'req-air-a4',
        category: 'aircraft',
        name: 'A-4 Skyhawk Light Attack Flight (天鷹輕型攻擊機)',
        nameZh: 'A-4 天鷹輕型高速突擊攻擊機 (+4架)',
        cost: 210,
        era: 'era4',
        badge: '小巧機動+蛇眼炸彈',
        desc: '「海軍的熱棒」，緊湊三角翼設計，擅長低空俯衝投彈、精準阻力傘炸彈與近接空中支援 (CAS)。',
        statsDesc: '+4架 A-4 整備庫存 | 蛇眼炸彈 / 航彈俯衝轟炸',
        typeTag: 'air_a4',
      },
      {
        id: 'req-air-b52',
        category: 'aircraft',
        name: 'B-52 Stratofortress Heavy Bomber (同溫層堡壘戰略轟炸機)',
        nameZh: 'B-52 巨型同溫層堡壘戰略重轟炸機 (+2架)',
        cost: 550,
        era: 'era4',
        badge: '36枚巨量地毯轟炸',
        desc: '「滾雷行動」戰略重轟炸機，8具渦輪噴射發動機，直線穿透投擲 36枚高爆炸彈實施毀滅性地毯轟炸！',
        statsDesc: '+2架 B-52 戰略庫存 | 36枚高爆航彈連續地毯覆蓋轟炸',
        typeTag: 'air_b52',
      },
      {
        id: 'req-air-f105',
        category: 'aircraft',
        name: 'F-105G Thunderchief Wild Weasel (野鼬防空網壓制機)',
        nameZh: 'F-105G 雷公防空壓制野鼬機 (+4架)',
        cost: 320,
        era: 'era4',
        badge: 'AGM-45百strike反輻射飛彈',
        desc: '「第一個進去，最後一個出來！」野鼬部隊專職獵殺北越 SA-2 地空飛彈陣地與扇歌雷達 (Fan Song)！',
        statsDesc: '+4架 F-105G 整備庫存 | AGM-45 Shrike ARM 反輻射飛彈',
        typeTag: 'air_f105',
      },
      {
        id: 'req-air-a7',
        category: 'aircraft',
        name: 'A-7 Corsair II Light Attack Flight (海盜II戰術攻擊機)',
        nameZh: 'A-7 海盜II 輕型戰術攻擊機 (+4架)',
        cost: 240,
        era: 'era4',
        badge: 'AGM-62白眼電視導引炸彈',
        desc: '越戰首開精確導引武器時代！裝備 AGM-62 Walleye 電視光學導引滑翔炸彈與雷射導引炸彈。',
        statsDesc: '+4架 A-7 整備庫存 | AGM-62 Walleye TV導引滑翔炸彈',
        typeTag: 'air_a7',
      },
      {
        id: 'req-air-ah1',
        category: 'aircraft',
        name: 'AH-1G Cobra Attack Helicopter Flight (眼鏡蛇武裝直升機)',
        nameZh: 'AH-1G 眼鏡蛇武裝直升機 (+4架)',
        cost: 220,
        era: 'era4',
        badge: '旋轉機砲+火箭巢',
        desc: '世界第一型專職武裝攻擊直升機，狹長串列座艙、機鼻 20mm/7.62mm 旋轉砲塔與 70mm FFAR 火箭巢彈幕。',
        statsDesc: '+4架 AH-1 整備庫存 | 旋轉砲塔 + 19聯裝 FFAR 火箭巢',
        typeTag: 'air_ah1',
      },
      {
        id: 'req-air-uh1',
        category: 'aircraft',
        name: 'UH-1D Huey Airmobile Assault Flight (休伊空中突擊機隊)',
        nameZh: 'UH-1D 休伊空中突擊直升機 (+4架)',
        cost: 180,
        era: 'era4',
        badge: '垂直機動機降任何陸地',
        desc: '越戰標誌性空騎兵突擊直升機！實現垂直包圍戰術，可在任意陸地地形快速機降 USMC 空中突擊排！',
        statsDesc: '+4架 UH-1 整備庫存 | 搭載空中突擊排垂直包圍機降',
        typeTag: 'air_uh1',
      },
      {
        id: 'req-air-ov10',
        category: 'aircraft',
        name: 'OV-10A Bronco Forward Air Control Flight (野馬前進空中管制)',
        nameZh: 'OV-10A 野馬前進空中管制機 (+4架)',
        cost: 160,
        era: 'era4',
        badge: '戰場標定+FFAR火箭',
        desc: '雙尾椼輕型武裝偵察管制機，盤旋前線標定敵軍掩體與車隊，以白磷煙幕火箭引導友軍戰機密集打擊。',
        statsDesc: '+4架 OV-10 整備庫存 | 前進空中管制 (FAC) / 火箭標定',
        typeTag: 'air_ov10',
      },
      {
        id: 'req-air-c1',
        category: 'aircraft',
        name: 'C-1 Trader Paratrooper Transport Flight (貿易者艦載傘兵空投機)',
        nameZh: 'C-1 貿易者艦載傘兵空投機 (+2架)',
        cost: 190,
        era: 'era4',
        badge: '全域空投傘兵突擊',
        desc: '雙發艦載運輸機，滿載陸戰隊空降兵自航母或陸基起飛，在敵陣地上空實施跳傘空投作戰！',
        statsDesc: '+2架 C-1 整備庫存 | 投送 2 個陸戰隊空降步槍排',
        typeTag: 'air_c1',
      },
      {
        id: 'req-air-sh2',
        category: 'aircraft',
        name: 'SH-2 Seasprite LAMPS I ASW Helicopter (+4架)',
        nameZh: 'SH-2 海妖艦載輕型反潛直升機 (+4架)',
        cost: 200,
        era: 'era4',
        badge: '聲納浮標+Mk 46聲導魚雷',
        desc: '海軍輕型空載多用途直升機系統 (LAMPS I)，專門進駐水面艦艇飛行甲板與航母，精確投放聲納浮標與 Mk 46 聲導魚雷！',
        statsDesc: '+4架 SH-2 整備庫存 | 艦載垂直起降 | 聲納浮標 | Mk 46 聲自導反潛魚雷',
        typeTag: 'air_sh2',
      },
      {
        id: 'req-air-p3',
        category: 'aircraft',
        name: 'P-3C Orion Maritime Patrol Bomber (+2架)',
        nameZh: 'P-3C 獵戶座遠程海上巡邏機 (+2架)',
        cost: 340,
        era: 'era4',
        badge: 'MAD磁異探測+重型魚雷艙',
        desc: '4具渦輪螺旋槳之遠程海洋巡邏反潛霸主！航程極遠，配備機尾磁異探測器 (MAD Boom) 與機腹多枚 Mk 46 聲自導魚雷。',
        statsDesc: '+2架 P-3C 遠程巡邏機 | 超長滯空搜潛 | MAD 磁異偵測 | 聲導反潛魚雷',
        typeTag: 'air_p3',
      },

      // Ground Units
      {
        id: 'req-ground-air-assault',
        category: 'ground',
        name: 'USMC Airmobile Assault Platoon (空中突擊步兵排)',
        nameZh: 'USMC 空中突擊/直升機機降突擊排 (1965)',
        cost: 160,
        era: 'era4',
        badge: '垂直機動+M16步槍',
        desc: '配備 M16A1 自動步槍、M79 榴彈發射器與 M60 通用機槍之空中騎兵精銳排，支援直升機垂直機降與搶灘。',
        statsDesc: 'HP: 750 | STR: 100% | 裝備 M16A1 / M60 | 垂直機動作戰',
        typeTag: 'air_assault',
      },
      {
        id: 'req-ground-m48',
        category: 'ground',
        name: 'USMC M48A3 Patton Main Battle Tank Platoon (巴頓主力戰車排)',
        nameZh: 'USMC M48A3 巴頓主力戰車排',
        cost: 350,
        era: 'era4',
        badge: '90mm M41主砲+重裝甲',
        desc: '配備 90mm M41 戰車砲與柴油發動機之主力中戰車，強厚裝甲可抵禦敵步兵 RPG 與機砲直擊。',
        statsDesc: 'HP: 2400 | 90mm 戰車砲 | 裝甲厚重 | 灘頭破障',
        typeTag: 'armor_m48',
      },
      {
        id: 'req-ground-ontos',
        category: 'ground',
        name: 'USMC M50 Ontos 6-Rifle Anti-Tank Vehicle (昂圖斯六聯無後座力砲戰車)',
        nameZh: 'USMC M50 昂圖斯六聯無後座力砲戰車排',
        cost: 260,
        era: 'era4',
        badge: '6聯裝106mm無後座力砲',
        desc: '「這東西太神奇了！」配備 6門 M40A1C 106mm 無後座力砲，一輪急速齊射瞬間轟平敵地下掩體與工事！',
        statsDesc: 'HP: 1100 | 6門 106mm 破甲無後座力砲 | 瞬態爆發殺傷',
        typeTag: 'ontos_m50',
      },
      {
        id: 'req-ground-artillery',
        category: 'ground',
        name: 'USMC M114 155mm Heavy Howitzer Battery (155mm 重榴彈砲排)',
        nameZh: 'USMC M114 155mm 重榴彈砲排',
        cost: 250,
        era: 'era4',
        badge: '全島重砲射程覆蓋',
        desc: '155mm 重型野戰榴彈砲排，射程覆蓋 1600m，對敵坑道陣地與強攻據點實施猛烈砲火準備。',
        statsDesc: 'HP: 1400 | 155mm 重砲 | 射程: 1600m | 彈幕覆蓋',
        typeTag: 'artillery',
      },
      {
        id: 'req-ground-engineer',
        category: 'ground',
        name: 'USN Seabees Combat Engineer Platoon (戰鬥工兵排)',
        nameZh: 'USN Seabees 戰鬥工兵排',
        cost: 160,
        era: 'era4',
        badge: '工事闢建+前進基地',
        desc: '海軍「海蜜蜂」(Seabees) 工兵隊，搶灘後可在島上拓闢前進野戰機場、霍克防空陣地與前進作戰基地 (FOB)！',
        statsDesc: 'HP: 850 | 開闢前進野戰跑道與雷達站 | 修築防禦工事',
        typeTag: 'engineer',
      },
      {
        id: 'req-ground-army-rifle-65',
        category: 'ground',
        name: 'US Army 1965 Rifle Platoon (美陸軍步槍排)',
        nameZh: '美陸軍 1965 年型前線常規步槍排',
        cost: 140,
        era: 'era4',
        badge: 'M16A1+M60機槍火力組',
        desc: '美國陸軍步兵連主力骨幹，全面換裝 M16A1 自動突擊步槍、M60 7.62mm 機槍與 M79 榴彈發射器，火力壓制力強。',
        statsDesc: 'HP: 700 | STR: 100% | 步兵突擊與防線構築 | M16A1 / M60',
        typeTag: 'army_rifle_65',
      },
      {
        id: 'req-ground-m113-mech',
        category: 'ground',
        name: 'US Army M113 Mechanized Infantry Platoon (M113機步排)',
        nameZh: 'M113 裝甲運兵機械化步兵排',
        cost: 260,
        era: 'era4',
        badge: '全履帶裝甲+點50重機槍',
        desc: '經典全天候鋁合金裝甲運兵車，抵禦輕武器掃射與彈片，車載 M2HB 重機槍提供強烈行進間伴隨火力！',
        statsDesc: 'HP: 1650 | 鋁裝甲防護 | M2HB .50 重機槍 | 高速公路越野機動',
        typeTag: 'm113_mech',
      },
      {
        id: 'req-ground-chaparral-sam',
        category: 'ground',
        name: 'MIM-72 Chaparral Mobile SAM Platoon (榭樹野戰防空飛彈排)',
        nameZh: 'MIM-72 榭樹野戰履帶防空飛彈排',
        cost: 380,
        era: 'era4',
        badge: '4聯裝響尾蛇防空飛彈',
        desc: '前線機動野戰防空傘！履帶車載四聯裝紅外線尋標防空飛彈發射架，自動偵測並打擊 1600m 範圍內掠空敵戰鬥機與強擊機！',
        statsDesc: 'HP: 1300 | MIM-72 紅外導引飛彈 (1600m防空) | 前線自動防禦攔截',
        typeTag: 'chaparral_sam',
      },

      // Installations
      {
        id: 'req-fac-sam-hawk',
        category: 'installations',
        name: 'MIM-23 HAWK Surface-to-Air Missile Battery (霍克防空飛彈陣地)',
        nameZh: 'MIM-23 霍克防空飛彈連',
        cost: 380,
        era: 'era4',
        badge: '半主動雷達導引SAM',
        desc: '半主動雷達導引地對空飛彈陣地，建立 1800m 防空攔截傘，自動鎖定並擊毀敵方超音速戰機與巡航飛彈！',
        statsDesc: 'HP: 1800 | 射程: 1800m | 霍克防空導彈 | 高空反飛彈反飛機',
        typeTag: 'sam_hawk',
        requiresIsland: true,
      },
      {
        id: 'req-fac-fob',
        category: 'installations',
        name: 'Forward Operating Base Tactical Command Post (前進作戰基地 FOB)',
        nameZh: '前進作戰基地 (FOB) 戰術指揮所',
        cost: 450,
        era: 'era4',
        badge: '停機坪+全域指管',
        desc: '在島嶼核心構築現代化前進作戰基地 (FOB)！設有直升機停機坪、長程通訊雷達與加固指揮所，新地面部隊在此直接就地集結！',
        statsDesc: 'HP: 4500 | 專屬地面部隊集結出生點 | 擴展雷達視野 1600m',
        typeTag: 'fob',
        requiresIsland: true,
      },
      {
        id: 'req-fac-dockyard',
        category: 'installations',
        name: '前線應急修護浮塢碼頭',
        nameZh: '前線應急修護浮塢碼頭',
        cost: 260,
        era: 'era4',
        badge: '艦體損害搶修',
        desc: '在島嶼岸邊架設前線修護浮塢，受創戰艦進駐泊位後可緊急抽水焊接搶修至綠色安全狀態！',
        statsDesc: '泊靠搶修 | 55 HP/s 抽水焊接搶修 | 恢復綠色戰備狀態',
        typeTag: 'dockyard',
        requiresIsland: true,
      },
      {
        id: 'req-fac-major-naval-port',
        category: 'installations',
        name: '正規深水軍港突堤',
        nameZh: '正規深水軍港突堤',
        cost: 420,
        era: 'era4',
        badge: '深水突堤起重港埠',
        desc: '建造大型深水混凝土起重突堤碼頭，穩定建立全島海運補給線，持續產生戰略補給點 (+1.5 CP/s)！',
        statsDesc: '大型深水軍港 | 補給線連通 | 持續產出 +1.5 CP/s',
        typeTag: 'major_naval_port',
        requiresIsland: true,
      },
      {
        id: 'req-fac-airfield',
        category: 'installations',
        name: '前進野戰機場跑道',
        nameZh: '前進野戰機場跑道',
        cost: 320,
        era: 'era4',
        badge: '全天候前線起降',
        desc: '闢建可供超音速噴射機與重轟炸機起降補給的前線野戰跑道！',
        statsDesc: '前線航空起降基地 | 戰機起降補給 | 建立戰術防禦空域',
        typeTag: 'airfield',
        requiresIsland: true,
      },
      {
        id: 'req-fac-radar',
        category: 'installations',
        name: 'SPS-40 遠程對空搜索雷達哨',
        nameZh: 'SPS-40 遠程對空搜索雷達哨',
        cost: 220,
        era: 'era4',
        badge: '遠程雷達預警',
        desc: '建立現代化高功率對空監視雷達台，探測 5000m 空域敵機活動。',
        statsDesc: '探測半徑: 5000m | 穿透戰場迷霧 | 提早預警空襲機群',
        typeTag: 'radar',
        requiresIsland: true,
      },
      {
        id: 'req-fac-supply-depot',
        category: 'installations',
        name: '戰地輜重補給樞紐',
        nameZh: '戰地輜重補給樞紐',
        cost: 200,
        era: 'era4',
        badge: '裝備建制修整',
        desc: '地下儲備飛彈與重裝備，大幅加快全島陸軍部隊建制度修整 (+2.0%/s)！',
        statsDesc: '補給儲備 | 建制度恢復 +2.0%/s | 維護陸軍作戰戰力',
        typeTag: 'supply_depot',
        requiresIsland: true,
      },
      {
        id: 'req-fac-field-hospital',
        category: 'installations',
        name: '戰地野戰醫院',
        nameZh: '戰地野戰醫院',
        cost: 160,
        era: 'era4',
        badge: '傷員救護整編',
        desc: '設立外科手術野戰醫院，救治負傷官兵迅速歸隊，顯著穩定部隊組織度 (+2.5%/s)！',
        statsDesc: '人員救治返部 | 組織度恢復 +2.5%/s | 防止士氣崩潰',
        typeTag: 'field_hospital',
        requiresIsland: true,
      },
    ];
  }
  // ══════════════════════════════════════════════════
  // 水面與水下戰鬥艦船 (Naval Warships & Transports)
  // 嚴格依據時代匹配歷史專屬艦艇與命名
  // ══════════════════════════════════════════════════
  const ships: RequisitionItem[] = [
    {
      id: 'req-ship-bb',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS Missouri (BB-63 1950 密蘇里號冷戰戰艦)'
          : era === 'era2'
          ? 'USS Missouri (BB-63 密蘇里號戰列艦)'
          : 'USS North Carolina (BB-55 北卡羅來納號戰列艦)',
      nameZh:
        era === 'era3'
          ? '密蘇里號冷戰戰艦 (BB-63)'
          : era === 'era2'
          ? '密蘇里號主力戰艦 (BB-63)'
          : '北卡羅來納號戰列艦 (BB-55)',
      cost: era === 'era3' ? 1050 : 950,
      era,
      badge: era === 'era3' ? '406mm岸轟重砲' : era === 'era2' ? '超重穿甲彈' : '16吋Mk6巨砲',
      desc:
        era === 'era3'
          ? '韓戰戰略岸轟衣阿華級戰列艦，裝備 9門 16吋50倍徑巨砲與現代化 SPS-6 雷達火控，一擊粉碎海岸工事。'
          : era === 'era2'
          ? '調遣衣阿華級主力戰艦密蘇里號，裝備 9門 16吋50倍徑 Mark 7 巨砲與 80門博福斯防空火網！'
          : '調遣北卡羅來納級主力重裝甲戰艦，裝備 9門 16吋45倍徑 Mk 6 主砲與 5吋高平副砲，防護卓越。',
      statsDesc:
        era === 'era3'
          ? 'HP: 6200 | 主砲: 16"/50 Mk7 | 雷達導引火控'
          : era === 'era2'
          ? 'HP: 5800 | 主砲: 16"/50 Mk7 | 航速: 33kt'
          : 'HP: 5200 | 主砲: 16"/45 Mk6 | 航速: 28kt',
      typeTag: era === 'era3' ? 'bb_missouri' : 'bb',
    },
    {
      id: 'req-ship-ca',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS Des Moines (CA-134 得梅因號自動裝填重巡)'
          : era === 'era2'
          ? 'USS Baltimore (CA-68 巴爾的摩號重巡洋艦)'
          : 'USS San Francisco (CA-38 舊金山號重巡洋艦)',
      nameZh:
        era === 'era3'
          ? '得梅因號重巡洋艦 (CA-134)'
          : era === 'era2'
          ? '巴爾的摩號重巡洋艦 (CA-68)'
          : '舊金山號重巡洋艦 (CA-38)',
      cost: era === 'era3' ? 620 : 550,
      era,
      badge: era === 'era3' ? '全自動8吋速射砲' : era === 'era2' ? '穿甲超重彈' : '8吋Mk9艦砲',
      desc:
        era === 'era3'
          ? '世界首創全自動裝填 203mm 砲塔重巡洋艦，每分鐘高達 10發速射，形成毀滅性巡洋速射彈幕！'
          : era === 'era2'
          ? '巴爾的摩級大型重巡洋艦，配備 9門 8吋55倍徑 Mk 12 主砲，發射超重穿甲彈 (SHS) 與強固防空。'
          : '新奧爾良級重巡洋艦，裝備 9門 8吋55倍徑 Mk 9 主砲與 5吋防空砲，瓜島海戰功勳主力。',
      statsDesc:
        era === 'era3'
          ? 'HP: 3800 | 9門 203mm 自動裝填砲 (10發/分)'
          : era === 'era2'
          ? 'HP: 3100 | 主砲: 8"/55 Mk12 | 航速: 28kt'
          : 'HP: 2600 | 主砲: 8"/55 Mk9 | 航速: 25kt',
      typeTag: era === 'era3' ? 'ca_desmoines' : 'ca',
    },
    {
      id: 'req-ship-cl',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS Worcester (CL-144 伍斯特號雙平全自動巡洋艦)'
          : era === 'era2'
          ? 'USS Cleveland (CL-55 克里夫蘭號輕巡洋艦)'
          : 'USS Atlanta (CL-51 亞特蘭大號防空巡洋艦)',
      nameZh:
        era === 'era3'
          ? '伍斯特號防空巡洋艦 (CL-144)'
          : era === 'era2'
          ? '克里夫蘭號輕巡洋艦 (CL-55)'
          : '亞特蘭大號防空巡洋艦 (CL-51)',
      cost: era === 'era3' ? 460 : 420,
      era,
      badge: era === 'era3' ? '6吋全自動雙平砲' : era === 'era2' ? '6吋速射砲群' : '16門高平雙聯砲',
      desc:
        era === 'era3'
          ? '伍斯特級全自動高平兩用輕巡洋艦，配備 6座雙聯 6吋自動速射雙平砲，攔截高空噴射機。'
          : era === 'era2'
          ? '克里夫蘭級輕巡洋艦，裝備 12門 6吋47倍徑三聯裝速射主砲與 12門 5吋高平兩用砲。'
          : '亞特蘭大級防空巡洋艦，裝備 16門 5吋38倍徑雙平兩用砲，無死角撕裂敵俯衝機群。',
      statsDesc:
        era === 'era3'
          ? 'HP: 3200 | 12門 6"/47 DP Auto | 防空網: 950m'
          : era === 'era2'
          ? 'HP: 2800 | 12門 6"/47 速射主砲 | 防空網: 820m'
          : 'HP: 2200 | 16門 5"/38 DP 高平砲 | 防空網: 820m',
      typeTag: 'cl',
    },
    {
      id: 'req-ship-dd',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS Gearing (DD-710 基靈級驅逐艦 · 刺蝟砲)'
          : era === 'era2'
          ? 'USS Johnston (DD-557 約翰斯頓號驅逐艦 · 刺蝟砲)'
          : 'USS Fletcher (DD-445 弗萊徹號主力驅逐艦)',
      nameZh:
        era === 'era3'
          ? '基靈級驅逐艦 (DD-710 · 刺蝟砲)'
          : era === 'era2'
          ? '約翰斯頓號驅逐艦 (DD-557 · 刺蝟砲)'
          : '弗萊徹級主力驅逐艦 (DD-445)',
      cost: era === 'era3' ? 290 : 260,
      era,
      badge: era === 'era3' ? '刺蝟砲+雷達哨' : era === 'era2' ? '刺蝟砲+雷擊衝鋒' : '反潛深彈+雷擊',
      desc:
        era === 'era3'
          ? '基靈級長艦體先進驅逐艦，配備 3座雙聯 5吋速射砲、艦艏 24聯裝刺蝟反潛迫擊砲與 3吋防空快砲。'
          : era === 'era2'
          ? '薩馬島海戰傳奇衝鋒驅逐艦，配備 5門 5吋快砲、10管魚雷與艦艏 24聯裝刺蝟反潛迫擊砲！'
          : '弗萊徹級主力驅逐艦首艦，配備 5門 5吋快砲、10管魚雷發射管與艦尾深水炸彈發射軌。',
      statsDesc:
        era === 'era3'
          ? 'HP: 2100 | 刺蝟砲 (24聯裝) | 6門 5"/38 雙聯裝 | 航速: 36kt'
          : era === 'era2'
          ? 'HP: 1550 | 刺蝟砲 (24聯裝向前拋射) | 5門 5"/38 | 10管魚雷'
          : 'HP: 1350 | 5門 5"/38 | 魚雷: 10聯裝 533mm | 艦尾深彈',
      typeTag: era === 'era3' ? 'dd_gearing' : 'dd',
    },
    {
      id: 'req-ship-ss',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS Tang (SS-563 刺尾鯛號高速柴電潛艦)'
          : era === 'era2'
          ? 'USS Balao (SS-285 白魚號主力潛艦)'
          : 'USS Gato (SS-212 貓鯊號艦隊型潛艦)',
      nameZh:
        era === 'era3'
          ? '刺尾鯛號高速柴電潛艦 (SS-563)'
          : era === 'era2'
          ? '白魚號主力潛艦 (SS-285)'
          : '貓鯊號艦隊型潛艦 (SS-212)',
      cost: era === 'era3' ? 270 : 240,
      era,
      badge: era === 'era3' ? '高速柴電伏擊' : era === 'era2' ? '大深度潛航' : '水下伏擊',
      desc:
        era === 'era3'
          ? '刺尾鯛級二戰後高速柴電攻擊潛艦，配備先進水下聲納陣列與快速裝填魚雷管，聲自導反潛獵殺。'
          : era === 'era2'
          ? '白魚級厚耐壓殼潛艦，可潛至 400英尺大深度，配備改進型電池無痕魚雷。'
          : '貓鯊級艦隊型主力潛艦，配備 6具艦艏魚雷發射管與 4具艦艉管，深潛伏擊敵航母與戰艦。',
      statsDesc:
        era === 'era3'
          ? 'HP: 1500 | 高速水下機動 | 聲自導魚雷支援'
          : era === 'era2'
          ? 'HP: 1350 | 400ft大深度 | 魚雷: 10管發射'
          : 'HP: 1200 | 水下隱匿 | 魚雷: Mk 14 重型魚雷',
      typeTag: 'ss',
    },
    {
      id: 'req-ship-lst',
      category: 'ships',
      name:
        era === 'era3'
          ? 'USS LST-1153 (大型快速戰車登陸艦)'
          : era === 'era2'
          ? 'USS LST-491 (戰車登陸艦)'
          : 'USS LST-391 (戰車登陸艦)',
      nameZh:
        era === 'era3'
          ? '快速戰車登陸艦 (LST-1153)'
          : era === 'era2'
          ? '戰車登陸艦 (LST-491)'
          : '戰車登陸艦 (LST-391)',
      cost: 220,
      era,
      badge: '登陸突擊',
      desc: '大型戰車登陸艦，滿載陸戰隊突擊步槍排與戰車排直接駛向島嶼灘頭實施搶灘破障！',
      statsDesc: 'HP: 2400 | 運載力: 3個連級戰鬥單位 | 搶灘卸載',
      typeTag: 'lst',
    },
    {
      id: 'req-ship-lcvp',
      category: 'ships',
      name:
        era === 'era3'
          ? 'LCU / LCVP 重裝突擊登陸艇'
          : era === 'era2'
          ? 'LCVP 希金斯登陸艇 (PA-45)'
          : 'LCVP 希金斯突擊艇 (PA-1)',
      nameZh:
        era === 'era3'
          ? '兩棲突擊登陸艇 (LCVP/LCU)'
          : '突擊登陸艇 (LCVP 希金斯艇)',
      cost: 90,
      era,
      badge: '前鋒搶灘',
      desc: '高速吃水淺登陸艇，搭載 1個陸戰衝鋒步兵排直衝敵灘頭沙灘，快速搶佔要點。',
      statsDesc: 'HP: 450 | 快速機動 | 搭載 1個步兵排',
      typeTag: 'lcvp',
    },
  ];

  // ══════════════════════════════════════════════════
  // 空中作戰編隊補充 (Air Wing Deployments)
  // ══════════════════════════════════════════════════
  const aircraft: RequisitionItem[] = [
    {
      id: 'req-air-fighter',
      category: 'aircraft',
      name:
        era === 'era3'
          ? 'F9F Panther / F-86 Sabre Flight (噴射戰鬥機隊)'
          : era === 'era2'
          ? 'F6F Hellcat / P-51 Mustang Flight (主力戰鬥機隊)'
          : 'F4F Wildcat / P-40 Warhawk Flight (艦載與陸基戰鬥機隊)',
      nameZh:
        era === 'era3'
          ? 'F9F/F-86 噴射戰鬥機隊 (+4架)'
          : era === 'era2'
          ? 'F6F/P-51 主力戰鬥機隊 (+4架)'
          : 'F4F/P-40 主力戰鬥機隊 (+4架)',
      cost: 180,
      era,
      badge: era === 'era3' ? '噴射空優' : '空戰制空',
      desc:
        era === 'era3'
          ? '調派 4架噴射戰鬥機 (艦載 F9F 黑豹 / 陸基 F-86 軍刀) 即刻整備待命出擊。'
          : era === 'era2'
          ? '調派 4架主力戰鬥機 (艦載 F6F/F4U / 陸基 P-51) 即刻整備待命出擊。'
          : '調派 4架主力戰鬥機 (艦載 F4F 野貓 / 陸基 P-40 戰鷹) 即刻整備待命出擊。',
      statsDesc: '+4架 戰鬥機整備庫存 | 機槍機砲彈藥滿額',
      typeTag: 'fighter_pool',
    },
    {
      id: 'req-air-dive',
      category: 'aircraft',
      name:
        era === 'era3'
          ? 'AD-1 Skyraider Attack Flight (天襲者重攻擊隊)'
          : era === 'era2'
          ? 'SB2C Helldiver Flight (地獄俯衝者中隊)'
          : 'SBD Dauntless Flight (無畏式俯衝轟炸機隊)',
      nameZh:
        era === 'era3'
          ? 'AD-1 天襲者重攻擊隊 (+4架)'
          : era === 'era2'
          ? 'SB2C 地獄俯衝者隊 (+4架)'
          : 'SBD 無畏式俯衝轟炸機隊 (+4架)',
      cost: 200,
      era,
      badge: era === 'era3' ? '萬磅破壞王' : '千磅穿甲',
      desc:
        era === 'era3'
          ? '調派 4架 AD-1 天襲者重型攻擊機至航母，掛載 Tiny Tim 火箭、凝固汽油彈或 2000lb 巨彈。'
          : era === 'era2'
          ? '調派 4架 SB2C 地獄俯衝者至航母，掛載重型穿甲航彈或 HVAR 火箭。'
          : '調派 4架 SBD 無畏式至航母，掛載 1000磅穿甲航彈直擊敵艦甲板。',
      statsDesc:
        era === 'era3'
          ? '+4架 重攻擊機庫存 | 2000lb 航彈 / Tiny Tim / 凝固汽油彈'
          : '+4架 艦載俯衝轟炸機庫存 | 1000lb-1600lb 航空炸彈',
      typeTag: 'dive_bomber_pool',
    },
    {
      id: 'req-air-torpedo',
      category: 'aircraft',
      name:
        era === 'era3'
          ? 'AF-2 Guardian ASW Flight (獵潛衛士反潛攻擊機隊)'
          : era === 'era2'
          ? 'TBF Avenger Torpedo Flight (復仇者魚雷攻擊中隊)'
          : 'TBD Devastator Torpedo Flight (毀滅者魚雷轟炸機隊)',
      nameZh:
        era === 'era3'
          ? 'AF-2 獵潛衛士反潛機隊 (+4架)'
          : era === 'era2'
          ? 'TBF 復仇者魚雷攻擊隊 (+4架)'
          : 'TBD 毀滅者魚雷轟炸機隊 (+4架)',
      cost: 220,
      era,
      badge: era === 'era3' ? '聲自導反潛' : '水線雷擊',
      desc:
        era === 'era3'
          ? '調派 4架 AF-2 獵潛衛士反潛攻擊機，配備 Mk 24 聲自導反潛魚雷與深水炸彈。'
          : era === 'era2'
          ? '調派 4架 TBF 復仇者魚雷機，掛載 Mk 13 高速魚雷直擊敵艦水線。'
          : '調派 4架 TBD 毀滅者魚雷機，掛載重型航空魚雷直擊敵主力艦水線。',
      statsDesc:
        era === 'era3'
          ? '+4架 反潛攻擊機 | Mk 24 聲自導反潛魚雷'
          : '+4架 魚雷機庫存 | Mk 13 航空魚雷',
      typeTag: 'torpedo_bomber_pool',
    },
    {
      id: 'req-air-heavy-bomber',
      category: 'aircraft',
      name:
        era === 'era3'
          ? 'B-29 Superfortress Flight (超級堡壘戰略重轟隊)'
          : era === 'era2'
          ? 'B-24 Liberator Flight (解放者遠程重轟隊)'
          : 'B-17 Flying Fortress Flight (飛行堡壘四發重轟隊)',
      nameZh:
        era === 'era3'
          ? 'B-29 超級堡壘戰略轟炸隊 (+2架)'
          : era === 'era2'
          ? 'B-24 解放者遠程重轟隊 (+2架)'
          : 'B-17 飛行堡壘重轟中隊 (+2架)',
      cost: 320,
      era,
      badge: era === 'era3' ? '平流層防空免疫' : '連環地毯轟炸',
      desc:
        era === 'era3'
          ? '調派 2架 B-29 超級堡壘戰略轟炸機至前進航空基地！巡航於 10,500m 平流層，免疫防空火網，可掛載密集地毯航彈或戰術核航彈。'
          : era === 'era2'
          ? '調派 2架 B-24 解放者四發重型轟炸機至前進航空基地，實施高空連環地毯轟炸。'
          : '調派 2架 B-17 飛行堡壘四發重型轟炸機至前進航空基地，實施密集連環航彈覆蓋。',
      statsDesc:
        era === 'era3'
          ? '+2架 萬米平流層重轟 | 可掛載戰術核彈 (4,500 CP)'
          : '+2架 陸基四發重型轟炸機 | 密集地毯式連環航彈',
      typeTag: 'heavy_bomber_pool',
    },
    {
      id: 'req-air-attacker',
      category: 'aircraft',
      name:
        era === 'era3'
          ? 'A-26 Invader Attack Flight (侵略者重型攻擊隊)'
          : era === 'era2'
          ? 'P-47 Thunderbolt Fighter-Bomber (雷霆戰轟機中隊)'
          : 'A-20 Havoc Strike Attacker (浩劫突擊攻擊機中隊)',
      nameZh:
        era === 'era3'
          ? 'A-26 侵略者重型攻擊隊 (+4架)'
          : era === 'era2'
          ? 'P-47 雷霆戰轟機中隊 (+4架)'
          : 'A-20 浩劫突擊攻擊機隊 (+4架)',
      cost: 260,
      era,
      badge: era === 'era3' ? '重火網掃射' : '火箭掃射',
      desc:
        era === 'era3'
          ? '調派 4架 A-26 侵略者重型攻擊機，配備機首 8挺 .50 重機槍與凝固汽油燃燒罐。'
          : era === 'era2'
          ? '調派 4架 P-47 雷霆重裝戰轟機，配備 8挺 .50 機槍與 HVAR 火箭彈幕。'
          : '調派 4架 A-20 浩劫對地攻擊機，配備機首重火力與低空突防航彈。',
      statsDesc: '+4架 陸基重攻擊機 | 機砲彈藥滿額',
      typeTag: 'attacker_pool',
    },
  ];

  // Era 3 Special Aircraft Additions
  if (era === 'era3') {
    aircraft.push(
      {
        id: 'req-air-jet-f9f',
        category: 'aircraft',
        name: 'F9F-2 Panther Jet Flight (黑豹噴射戰機隊)',
        nameZh: 'F9F 黑豹噴射戰鬥機 (+4架)',
        cost: 240,
        era: 'era3',
        badge: '噴射空優',
        desc: '美國海軍主力艦載噴射戰鬥機！配備 4門 20mm 柯爾特航砲與 8枚 HVAR 高速火箭。',
        statsDesc: '+4架 艦載噴射戰機 | 4x 20mm 機砲 + 火箭',
        typeTag: 'fighter_jet_f9f',
      },
      {
        id: 'req-air-jet-f2h',
        category: 'aircraft',
        name: 'F2H-2 Banshee Twin-Jet Flight (女妖噴射截擊機隊)',
        nameZh: 'F2H 女妖雙發噴射機 (+4架)',
        cost: 260,
        era: 'era3',
        badge: '高空攔截',
        desc: '雙噴射全天候艦載機！優越的爬升率與高空截擊性能，壓制敵噴射轟炸機群。',
        statsDesc: '+4架 雙發噴射機 | 高空升限爬升率 +40%',
        typeTag: 'fighter_jet_f2h',
      },
      {
        id: 'req-air-aew-ad3w',
        category: 'aircraft',
        name: 'AD-3W Skyraider AEW Radar Sentry (空中預警機)',
        nameZh: 'AD-3W 全域空中預警機 (+1架)',
        cost: 280,
        era: 'era3',
        badge: '6500m千里眼',
        desc: '安裝大型 AN/APS-20 搜索雷達罩！在空中持續巡邏可穿透全地圖迷霧，提前預警敵機。',
        statsDesc: '雷達半徑: 6500m | 穿透迷霧鎖定 | 全艦隊防空命中 +35%',
        typeTag: 'aew_ad3w',
      },
      {
        id: 'req-air-sar-ho3s1',
        category: 'aircraft',
        name: 'HO3S-1 Dragonfly SAR Helicopter (搜救醫療直升機)',
        nameZh: 'HO3S-1 搜救直升機 (+1架)',
        cost: 220,
        era: 'era3',
        badge: '天使打撈',
        desc: '搜救與醫療直升機！飛赴落海跳傘飛行員救生筏上方懸停打撈，即刻復原損失戰機！',
        statsDesc: '搜救打撈救生筏 | 返還 1架該型戰機庫存',
        typeTag: 'sar_ho3s1',
      }
    );
  }

  // ══════════════════════════════════════════════════
  // 地面戰鬥部隊 (USMC Ground Combat Forces)
  // 嚴格依據時代匹配不同歷史部隊裝備
  // ══════════════════════════════════════════════════
  const ground: RequisitionItem[] = [
    {
      id: 'req-ground-infantry',
      category: 'ground',
      name:
        era === 'era3'
          ? 'USMC Marine Rifle Platoon (1950 M14/無後座力砲)'
          : era === 'era2'
          ? 'USMC Marine Assault Platoon (1945 M1/巴祖卡/噴火器)'
          : 'USMC Marine Rifle Platoon (1942 M1903/BAR)',
      nameZh:
        era === 'era3'
          ? '陸戰突擊步兵排 (1950 M14/無後座力砲)'
          : era === 'era2'
          ? '陸戰突擊步兵排 (1945 M1/巴祖卡/噴火器)'
          : '陸戰步兵排 (1942 M1903/BAR)',
      cost: 110,
      era,
      badge: era === 'era3' ? '無後座力砲' : era === 'era2' ? '巴祖卡與噴火器' : '春田與BAR',
      desc:
        era === 'era3'
          ? '精銳美軍陸戰隊突擊步槍排 (1950)，配備 M14 自動步槍、75mm 無後座力砲與肩射火箭。'
          : era === 'era2'
          ? '精銳美軍陸戰隊突擊步槍排 (1945)，配備 M1 加蘭德步槍、巴祖卡火箭筒與火焰噴射器！'
          : '精銳美軍陸戰步兵排 (1942)，配備春田 M1903 狙擊步槍、早期加蘭德與 BAR 班用機槍。',
      statsDesc:
        era === 'era3'
          ? '兵力: 36人 | M14/75mm無後座力砲 | 破障穿甲'
          : era === 'era2'
          ? '兵力: 36人 | M1加蘭德/巴祖卡/噴火器 | 火焰壓制'
          : '兵力: 36人 | M1903春田/BAR機槍 | 基礎步戰',
      typeTag: 'infantry',
    },
    {
      id: 'req-ground-artillery',
      category: 'ground',
      name:
        era === 'era3'
          ? 'USMC M114 155mm Howitzer Battery (155mm 重榴彈砲排)'
          : 'USMC M2A1 105mm Howitzer Battery (105mm 砲兵支援排)',
      nameZh:
        era === 'era3'
          ? 'M114 155mm 重榴彈砲排'
          : 'M2A1 105mm 砲兵支援排',
      cost: era === 'era3' ? 240 : 190,
      era,
      badge: era === 'era3' ? '155mm毀滅重砲' : '105mm長程曲射',
      desc:
        era === 'era3'
          ? '調遣陸戰隊 M114 155mm 重型榴彈砲排，發射 43公斤巨型高爆彈，直接粉碎敵地下水泥要塞！'
          : '調遣海軍陸戰隊 105mm 輕型榴彈砲排，實施超長程曲射砲火壓制，摧毀敵碉堡與火力點。',
      statsDesc:
        era === 'era3'
          ? '射程: 1650m | 傷害: 580/發 | 摧毀地下掩體'
          : '射程: 1450m | 傷害: 350/發 | 長程曲射壓制破障',
      typeTag: 'artillery',
    },
    {
      id: 'req-ground-armor',
      category: 'ground',
      name:
        era === 'era3'
          ? 'USMC M46 Patton Tank Platoon (M46 巴頓主力戰車排)'
          : era === 'era2'
          ? 'USMC M4A2 Sherman Tank Platoon (M4A2 薛曼中戰車排)'
          : 'USMC M3 Stuart Light Tank Platoon (M3 斯圖亞特輕戰車排)',
      nameZh:
        era === 'era3'
          ? 'M46 巴頓主力戰車排'
          : era === 'era2'
          ? 'M4A2 薛曼中戰車排'
          : 'M3 斯圖亞特戰車排',
      cost: era === 'era3' ? 280 : 220,
      era,
      badge: era === 'era3' ? '90mm高初速加農' : era === 'era2' ? '75mm薛曼鐵騎' : '37mm輕裝鐵騎',
      desc:
        era === 'era3'
          ? '部署 3輛陸戰隊 M46 巴頓主力戰車，配備 90mm M3A1 高初速戰車加農砲與重型避彈裝甲。'
          : era === 'era2'
          ? '部署 3輛陸戰隊 M4A2 薛曼中型戰車，配備 75mm 戰車砲，直接碾壓敵掩體與沿岸火力點。'
          : '部署 3輛陸戰隊 M3 斯圖亞特輕型戰車，具備高機動伏擊速度與 37mm 戰車砲。',
      statsDesc:
        era === 'era3'
          ? 'HP: 1450 | 主砲: 90mm M3A1 | 重型裝甲'
          : era === 'era2'
          ? 'HP: 950 | 主砲: 75mm 高爆穿甲砲 | 厚裝甲防護'
          : 'HP: 750 | 主砲: 37mm 快砲 | 高速機動',
      typeTag: 'tank',
    },
    {
      id: 'req-ground-lvt',
      category: 'ground',
      name:
        era === 'era3'
          ? 'USMC LVT-P5 Buffalo (LVT-P5 兩棲重裝步戰排)'
          : era === 'era2'
          ? 'USMC LVT-4 Buffalo (LVT-4 水牛兩棲突擊排)'
          : 'USMC LVT-1 Buffalo (LVT-1 水牛兩棲機步排)',
      nameZh:
        era === 'era3'
          ? 'LVT-P5 兩棲重裝步戰排'
          : era === 'era2'
          ? 'LVT-4 水牛兩棲突擊排'
          : 'LVT-1 水牛兩棲機步排',
      cost: era === 'era3' ? 180 : 150,
      era,
      badge: '水陸兩棲',
      desc:
        era === 'era3'
          ? '裝備 105mm 榴彈與大容量裝甲的兩棲步戰車 (LVT-P5)，直接衝破珊瑚礁群搶灘！'
          : era === 'era2'
          ? '裝備尾部跳板與 75mm 榴彈的兩棲突擊水牛車 (LVT-4)，支援步兵快速衝鋒！'
          : '初代水牛兩棲履帶載具 (LVT-1)，直接在海中涉水推進並碾壓珊瑚礁陣地。',
      statsDesc:
        era === 'era3'
          ? 'HP: 950 | 兩棲重裝步戰 | 105mm 榴彈支援'
          : era === 'era2'
          ? 'HP: 700 | 兩棲全地形通過 | 75mm 榴彈支援'
          : 'HP: 550 | 兩棲全地形通過 | 機槍掩護',
      typeTag: 'lvt',
    },
    {
      id: 'req-ground-engineer',
      category: 'ground',
      name:
        era === 'era3'
          ? 'USN Seabees Modernized Combat Engineers (現代化工兵營)'
          : era === 'era2'
          ? 'USN Seabees Assault Engineers (戰鬥工兵排)'
          : 'USN Seabees Combat Engineers (工兵工程排)',
      nameZh:
        era === 'era3'
          ? '現代化工兵營 (Seabees 1950)'
          : era === 'era2'
          ? '戰鬥工兵排 (Seabees 1945)'
          : '工兵工程排 (Seabees 1942)',
      cost: 130,
      era,
      badge: '工兵破障',
      desc: '海軍陸戰隊戰鬥工兵排 (Seabees)，登島後可快速闢建前進野戰機場、修建深水軍港與修復防空砲陣地！',
      statsDesc: '工兵建造速率 x2.5 | 快速闢建前進機場與港口',
      typeTag: 'engineer',
    },
  ];

  // ══════════════════════════════════════════════════
  // 島嶼要塞設施 (Island Facilities & Base Upgrades)
  // 嚴格依據時代匹配不同歷史名稱與防衛能力
  // ══════════════════════════════════════════════════
  const installations: RequisitionItem[] = [
    {
      id: 'req-fac-heavy-aa',
      category: 'installations',
      name:
        era === 'era3'
          ? '100mm 重型防空砲連 (雷達射控高射砲堡)'
          : era === 'era2'
          ? '重型防空砲堡 (127mm 雙聯高平砲 / 四聯博福斯)'
          : '高地防空高射砲哨 (90mm M1 / 40mm 博福斯)',
      nameZh:
        era === 'era3'
          ? '100mm 雷達射控防空砲堡'
          : era === 'era2'
          ? '127mm 雙聯重型防空砲堡'
          : '90mm/40mm 防空高射砲哨',
      cost: 180,
      era,
      badge: era === 'era3' ? '雷達自動射控' : '天空之網',
      desc:
        era === 'era3'
          ? '在島嶼建造配備 SON-9 雷達射控的 100mm 自動高平防空碉堡，有效範圍 1350m。'
          : era === 'era2'
          ? '在島嶼建造一座 127mm 雙聯重型高平砲與博福斯機砲碉堡，有效範圍 1200m。'
          : '在島嶼構築一座 90mm M1 高射砲哨所，防空射程 900m。',
      statsDesc:
        era === 'era3'
          ? '射程: 1350m | 傷害: 200/發 | 自動雷達射控'
          : '射程: 1200m | 傷害: 140/發 | 自動攔截敵機',
      typeTag: 'heavy_aa',
      requiresIsland: true,
    },
    {
      id: 'req-fac-coastal-gun',
      category: 'installations',
      name:
        era === 'era3'
          ? '152mm 雙聯自動岸防加農砲台 (雷達射控)'
          : era === 'era2'
          ? '203mm 雙聯岸防重砲台 (加固混凝土掩體)'
          : '高地要塞海防砲台 (140mm 單裝加農砲)',
      nameZh:
        era === 'era3'
          ? '152mm 自動岸防加農砲台'
          : era === 'era2'
          ? '203mm 雙聯岸防重砲台'
          : '140mm 海防加農砲台',
      cost: 240,
      era,
      badge: era === 'era3' ? '雷達長程穿甲' : '封鎖海峽',
      desc:
        era === 'era3'
          ? '建造 152mm 雙聯長身管自動加農砲台，雷達火控導引重創群島海峽敵艦！'
          : era === 'era2'
          ? '在島嶼岸邊建造混凝土裝甲掩體，安裝 203mm 雙聯重型岸砲，重創接近海峽的敵艦！'
          : '在制高點構築 140mm 單裝加農砲位，俯瞰水道實施水面壓制砲擊。',
      statsDesc:
        era === 'era3'
          ? 'HP: 2200 | 射程: 1900m | 傷害: 520'
          : era === 'era2'
          ? 'HP: 1600 | 射程: 1600m | 穿甲重彈傷害: 420'
          : 'HP: 1300 | 射程: 1400m | 傷害: 320',
      typeTag: 'coastal_gun',
      requiresIsland: true,
    },
    {
      id: 'req-fac-radar',
      category: 'installations',
      name:
        era === 'era3'
          ? 'AN/SPS-6 3D 遠程對空搜索雷達哨'
          : era === 'era2'
          ? '早期對空對海預警電探哨 (SK-2/二二號電探站)'
          : '早期警戒對空電探哨 (CXAM/二一號電探站)',
      nameZh:
        era === 'era3'
          ? 'AN/SPS-6 3D 遠程雷達站'
          : era === 'era2'
          ? 'SK-2/二二號預警電探站'
          : 'CXAM 早期預警雷達站',
      cost: 200,
      era,
      badge: era === 'era3' ? '3D廣域搜索' : '全域情資',
      desc:
        era === 'era3'
          ? '架設 3D 遠程對空搜索雷達天線，提早偵獲敵高空噴射機，探測半徑達 5500m！'
          : era === 'era2'
          ? '架設長程對空對海預警電探哨，提早 45秒偵獲敵軍 Air Sweep 與特攻機隊！'
          : '架設早期 CXAM 對空電波探信儀，提供基礎戰區空情預警。',
      statsDesc:
        era === 'era3'
          ? '探測半徑: 5500m | 友軍防空命中率 +35%'
          : '探測半徑: 4500m | 友軍防空命中率 +25%',
      typeTag: 'radar',
      requiresIsland: true,
    },
    {
      id: 'req-fac-command-post',
      category: 'installations',
      name:
        era === 'era3'
          ? '核化防護深層地下坑道指揮所 (Era 3 戰略核心)'
          : era === 'era2'
          ? '鋼筋混凝土強化防空指揮所 (Era 2 指揮所)'
          : '木質土木被覆掩體指揮所 (Era 1 指揮所)',
      nameZh:
        era === 'era3'
          ? '深層地下坑道指揮所'
          : era === 'era2'
          ? '鋼筋混凝土防空指揮所'
          : '土木被覆掩體指揮所',
      cost: 200,
      era,
      badge: '防禦中樞',
      desc:
        era === 'era3'
          ? '構築深層花崗岩鋼筋混凝土三防指揮中心，大幅提升全島駐軍組織度防禦韌性！'
          : era === 'era2'
          ? '構築強化混凝土防空指揮所，提升全島駐軍防禦韌性與全域戰場情資分享！'
          : '搭建木質土木被覆掩蔽部，作為全島前進戰術指揮據點。',
      statsDesc:
        era === 'era3'
          ? 'HP: 4200 | 全島守備組織度抵抗 +60% | 視距 +1200m'
          : 'HP: 3200 | 全島守備組織度抵抗 +50% | 視距 +1000m',
      typeTag: 'command_post',
      requiresIsland: true,
    },
    {
      id: 'req-fac-ammo-dump',
      category: 'installations',
      name:
        era === 'era3'
          ? '地下恆溫戰略核武與油彈庫'
          : era === 'era2'
          ? '強化裝甲水泥戰備油彈庫'
          : '木箱被覆戰備油彈堆置所',
      nameZh:
        era === 'era3'
          ? '地下戰略油彈庫'
          : era === 'era2'
          ? '強化水泥戰備油彈庫'
          : '戰備油彈堆置所',
      cost: 180,
      era,
      badge: '彈藥倍增',
      desc:
        era === 'era3'
          ? '儲存 Tiny Tim 火箭、凝固汽油彈與各型穿甲重彈，使全島重砲與艦隊獲得急速裝填補給！'
          : era === 'era2'
          ? '儲存重型航空穿甲炸彈與 HVAR 火箭，使全島重砲與艦隊獲得急速裝填！'
          : '儲存 500/1000磅航彈與水面砲彈，支援前線急迫火力補給。',
      statsDesc: '重砲裝填加速 +35% | 友軍艦隊砲擊冷卻縮短 25%',
      typeTag: 'ammo_depot',
      requiresIsland: true,
    },
    {
      id: 'req-fac-dockyard',
      category: 'installations',
      name:
        era === 'era3'
          ? '現代化船舶電氣修理浮塢'
          : era === 'era2'
          ? '鋼質戰地修護浮塢碼頭'
          : '前線應急修護浮塢碼頭',
      nameZh:
        era === 'era3'
          ? '現代化修護浮塢碼頭'
          : '戰地修護塢 (Repair Yard)',
      cost: 220,
      era,
      badge: '快速損管',
      desc: '在島嶼水域闢建戰地修護浮塢，為靠泊與鄰近海域的友軍艦船持續搶修損害、滅火與排水！',
      statsDesc: '每秒修復 55 HP | 滅火防損 | 艦體結構穩固',
      typeTag: 'dockyard',
      requiresIsland: true,
    },
    {
      id: 'req-fac-pontoon-pier',
      category: 'installations',
      name:
        era === 'era3'
          ? '重型全金屬浮箱人工棧橋港'
          : era === 'era2'
          ? '浮式人工棧橋港碼頭'
          : '木質急造浮式人工棧橋港',
      nameZh: '浮式人工棧橋港 (急造港口)',
      cost: 180,
      era,
      badge: '搶灘補給線',
      desc: '海軍工兵快速架設之急造棧橋人工港！打通全島陸軍補給線，工兵駐守35秒自動升級為正規軍港！',
      statsDesc: '建立全島陸軍補給線 | LST/LCVP 快速泊靠 | 工兵駐守自動升級為正規軍港',
      typeTag: 'pontoon_pier',
      requiresIsland: true,
    },
    {
      id: 'req-fac-major-port',
      category: 'installations',
      name:
        era === 'era3'
          ? '冷戰戰略海軍深水基地 (防波堤與油庫樞紐)'
          : era === 'era2'
          ? '正規深水軍港 (全功能水泥突堤碼頭)'
          : '深水錨地與木造突堤碼頭',
      nameZh:
        era === 'era3'
          ? '戰略海軍深水基地'
          : '正規深水軍港 (戰略基地港)',
      cost: 380,
      era,
      badge: '全島戰略樞紐',
      desc: '具備大型碼頭、起重機與油庫之正規軍港！建立穩定補給網絡，每秒額外挹注 +1.5 CP。',
      statsDesc: '全島補給線暢通 | 每秒 +1.5 CP | 陸軍休整建制度恢復速度 +100%',
      typeTag: 'major_naval_port',
      requiresIsland: true,
    },
    {
      id: 'req-fac-supply-depot',
      category: 'installations',
      name:
        era === 'era3'
          ? '現代化後勤維修與物資樞紐'
          : era === 'era2'
          ? '戰地輜重樞紐 (Supply Depot)'
          : '野戰輜重糧抹彈藥堆積所',
      nameZh: '戰地輜重樞紐 (Supply Depot)',
      cost: 150,
      era,
      badge: '軍需物資儲備',
      desc: '建立島嶼大型彈藥與重裝備修配所，大幅加速全島地面部隊「建制度」之修整回復！',
      statsDesc: '建制度回復 +2.0%/s | 砲兵與戰車裝備快速整編',
      typeTag: 'supply_depot',
      requiresIsland: true,
    },
    {
      id: 'req-fac-field-hospital',
      category: 'installations',
      name:
        era === 'era3'
          ? '現代化戰地後送防護野戰醫院'
          : era === 'era2'
          ? '戰地野戰醫院 (外科手術方艙)'
          : '帳棚野戰救護站 (Field Hospital)',
      nameZh: '戰地野戰醫院 (Field Hospital)',
      cost: 160,
      era,
      badge: '傷員救護整編',
      desc: '設立戰地野戰醫院，救治前線負傷官兵，使傷患重回作戰建制，顯著穩定陸軍部隊組織度！',
      statsDesc: '人員救治返部 | 組織度恢復 +2.5%/s | 防止士氣崩潰',
      typeTag: 'field_hospital',
      requiresIsland: true,
    },
    {
      id: 'req-fac-forward-airfield',
      category: 'installations',
      name:
        era === 'era3'
          ? '混凝土全天候噴射機前進基地'
          : era === 'era2'
          ? 'PSP鋼板前進野戰機場 (Airfield)'
          : '壓實珊瑚砂前進跑道航空站',
      nameZh: '前進野戰機場 (Airfield)',
      cost: 320,
      era,
      badge: '空戰前哨',
      desc: '闢建可供陸基重轟炸機、戰鬥機起降補給的前線野戰跑道航空站！',
      statsDesc: '開闢前線航空起降基地 | 戰機起降補給 | 建立戰術防禦空域',
      typeTag: 'airfield',
      requiresIsland: true,
    },
    {
      id: 'req-fac-battalion-cp',
      category: 'installations',
      name:
        era === 'era3'
          ? '前進合成戰鬥群營指揮所 (Battalion CP)'
          : era === 'era2'
          ? '營級作戰前進指揮所 (Battalion CP)'
          : '陸戰隊營戰術指揮所 (Battalion CP)',
      nameZh: '營指揮所 (Battalion CP)',
      cost: 250,
      era,
      badge: '呼叫支援樞紐',
      desc: '在島嶼構築營級戰術指揮所！點擊營指揮所專屬開啟【戰術增援呼叫選單】，新徵集之陸戰部隊將直接自該指揮所周邊集結開出！',
      statsDesc: 'HP: 3800 | 專屬解鎖地面部隊增援 | 就地集結出生點',
      typeTag: 'battalion_cp',
      requiresIsland: true,
    },
  ];

  return [...ships, ...aircraft, ...ground, ...installations];
}

// Backwards-compatible export for default era 1
export const REQUISITION_CATALOG: RequisitionItem[] = getRequisitionCatalog('era1');
