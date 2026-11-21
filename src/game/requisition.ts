import { withGroundRequisitions } from './groundRequisition';
import { withAircraftRequisitions } from './airRequisition';
import { RequisitionItem, Era } from '../types/game';

/** Reinforcement menu for an era, with every ground entry tagged with the unit it raises. */
export function getRequisitionCatalog(era: Era): RequisitionItem[] {
  return withAircraftRequisitions(withMissingWorks(withGroundRequisitions(buildRequisitionCatalog(era), era), era), era);
}

function buildRequisitionCatalog(era: Era): RequisitionItem[] {
  // ══════════════════════════════════════════════════
  // 時代五 (1973-1991) 冷戰終局與大洋航艦神盾決戰
  // ══════════════════════════════════════════════════
  if (era === 'era5') {
    return [
      // ════ Ships & Transports ════
      {
        id: 'req-ship-cvn',
        category: 'ships',
        name: '尼米茲號核動力航母 (CVN-68)',
        cost: 1550,
        era: 'era5',
        badge: '雙核反應爐+CIWS+海麻雀',
        desc: '十萬噸級超級核動力航艦首艦！無限巡航續航力，配備 2座 20mm 方陣 CIWS 快砲、RIM-7 海麻雀防空飛彈系統與 4座 C-13 蒸氣彈射器，搭載 100+ 現代超音速艦載機隊！',
        statsDesc: 'HP: 11000 | 2座 Phalanx CIWS | RIM-7 海麻雀 SAM | 4座 C-13 蒸氣彈射器 | 100+ 戰機容量',
        typeTag: 'cvn',
      },
      {
        id: 'req-ship-cg-tico',
        category: 'ships',
        name: '提康德羅加級神盾巡洋艦 (CG-47)',
        cost: 880,
        era: 'era5',
        badge: 'SPY-1A神盾+SM-2MR+CIWS+魚叉',
        desc: '神盾作戰系統 (Aegis Combat System) 核心旗艦！SPY-1A 3D 四面相位陣列雷達同時引導多枚 SM-2MR 標準二型防空反飛彈，配備 8枚 RGM-84 魚叉反艦飛彈與 2座方陣 CIWS！',
        statsDesc: 'HP: 4800 | SPY-1A 相位陣列雷達 | SM-2MR (2600m 防空/反反艦飛彈) | 8x 魚叉反艦 | 2座方陣 CIWS',
        typeTag: 'cg_tico',
      },
      {
        id: 'req-ship-cg-virginia',
        category: 'ships',
        name: '維吉尼亞級核巡洋艦 (CGN-38)',
        cost: 820,
        era: 'era5',
        badge: '雙核動力+雙臂Mk26+魚叉',
        desc: '核動力打擊群長程護航巡洋艦，雙座 D2G 核反應爐高速伴隨核航母，前艏與後艉配備 Mk 26 雙臂飛彈發射架、SM-2MR、8聯裝魚叉反艦飛彈與方陣 CIWS。',
        statsDesc: 'HP: 4600 | 雙聯 Mk 26 發射架 | SM-2MR (2600m) | 8x 魚叉反艦 | 2座方陣 CIWS | 30kt 無限巡航',
        typeTag: 'cg_virginia',
      },
      {
        id: 'req-ship-bb-iowa-mod',
        category: 'ships',
        name: '愛荷華號現代化改裝戰艦 (BB-61)',
        cost: 1250,
        era: 'era5',
        badge: '406mm巨砲+戰斧+魚叉+4座方陣',
        desc: '600艘海軍造艦計畫象徵！保留 9門 406mm (16吋) 50倍徑重型艦砲，加裝 32枚戰斧巡弋飛彈裝甲發射箱、16枚 RGM-84 魚叉反艦飛彈與 4座 Mk 15 方陣 CIWS 近迫系統！',
        statsDesc: 'HP: 9800 | 3座三聯裝 406mm 巨砲 | 16x 魚叉反艦 | 4座 Phalanx 20mm CIWS | 重裝甲裝甲帶',
        typeTag: 'bb_iowa_mod',
      },
      {
        id: 'req-ship-dd-spruance',
        category: 'ships',
        name: '史普魯恩斯級長程驅逐艦 (DD-963)',
        cost: 560,
        era: 'era5',
        badge: '全燃氣渦輪+反潛+魚叉+CIWS',
        desc: '專為獵殺蘇聯核潛艦而生的大型驅逐艦，4具 LM2500 燃氣渦輪極速奔馳，裝備 SQS-53 巨型聲納、8聯 ASROC、2門 Mk 45 127mm 艦砲、8枚魚叉飛彈與雙方陣 CIWS！',
        statsDesc: 'HP: 3400 | 2門 127mm/54 Mk 45 | 8聯 ASROC | 8x 魚叉反艦 | 2座 Phalanx CIWS | 33kt',
        typeTag: 'dd_spruance',
      },
      {
        id: 'req-ship-ddg-kidd',
        category: 'ships',
        name: '紀德級導向飛彈驅逐艦 (DDG-993)',
        cost: 640,
        era: 'era5',
        badge: '雙臂Mk 26+SM-2MR區域防空',
        desc: '「阿亞圖拉級」重型防空驅逐艦！結合史普魯恩斯級優秀艦體與雙座 Mk 26 雙臂飛彈發射架，具備強大 SM-2MR 區域防空、8枚魚叉與雙座方陣系統。',
        statsDesc: 'HP: 3600 | 雙臂 Mk 26 發射架 | SM-2MR 防空反飛彈 | 8x 魚叉反艦 | 2座 Phalanx CIWS',
        typeTag: 'ddg_kidd',
      },
      {
        id: 'req-ship-ffg-ohp',
        category: 'ships',
        name: '派里級導向飛彈巡防艦 (FFG-7)',
        cost: 420,
        era: 'era5',
        badge: '單臂Mk 13+方陣CIWS+魚叉',
        desc: '經典量產主力巡防艦！艦首 Mk 13 單臂飛彈發射架混合發射 SM-1MR 與魚叉反艦飛彈，上層結構配置 Mk 15 方陣 CIWS 與雙架 SH-2F LAMPS 反潛直升機庫。',
        statsDesc: 'HP: 2600 | Mk 13 發射架 (SM-1MR/魚叉) | 1座 Phalanx CIWS | 76mm 快砲 | 雙直升機庫',
        typeTag: 'ffg_ohp',
      },
      {
        id: 'req-ship-ssn-la',
        category: 'ships',
        name: '洛杉磯級核動力攻擊潛艦 (SSN-688)',
        cost: 480,
        era: 'era5',
        badge: '33kt極速水下+Mk48線導魚雷+魚叉',
        desc: '美國海軍冷戰水下王牌！S6G 核反應爐驅動 33kt 狂暴航速，裝備 BQQ-5 綜合聲納系統、4具 533mm 魚雷發射管，發射 Mk 48 重型線導自導魚雷與潛射魚叉巡弋飛彈！',
        statsDesc: 'HP: 2400 | 33kt 高速水下航行 | Mk 48 重型線導魚雷 | 潛射魚叉反艦飛彈 | BQQ-5 聲納',
        typeTag: 'ssn_la',
      },
      {
        id: 'req-ship-lph',
        category: 'ships',
        name: '塔拉瓦／硫磺島級兩棲突擊艦',
        cost: 580,
        era: 'era5',
        badge: 'AV-8B垂直起降+CH-53突擊',
        desc: '現代立體兩棲作戰母艦，全通甲板起降 AV-8B 海獵鷹垂直起降戰機與 CH-53 海種馬重型直升機，實現大規模遠程垂直登陸包圍！',
        statsDesc: 'HP: 4400 | 搭載 CH-53 重型直升機 / AV-8B 戰機 | 立體垂直登陸作戰',
        typeTag: 'lph',
      },
      {
        id: 'req-ship-lpd',
        category: 'ships',
        name: '奧斯汀級兩棲船塢運輸艦 (LPD-4)',
        cost: 460,
        era: 'era5',
        badge: '泛水塢穴+LCAC/AAV裝卸載',
        desc: '現代化船塢登陸艦，船艉泛水塢穴可容納 LCAC 氣墊登陸艇與 AAV-7A1 兩棲戰車進出，具備海上部隊裝載與卸載能力！',
        statsDesc: 'HP: 3800 | 塢穴泛水甲板 | 具備運載/卸載 LCAC 與 AAV-7A1 能力',
        typeTag: 'lpd',
      },
      {
        id: 'req-ship-lcac',
        category: 'ships',
        name: 'LCAC 氣墊登陸載具',
        cost: 160,
        era: 'era5',
        badge: '40kt高速掠海/直接越障搶灘',
        desc: '革命性全天候高速氣墊登陸艇！4具燃氣渦輪推動，以 40kt 掠海狂飆並直接越過珊瑚礁與沙灘上陸，卸載 M1IP 主力戰車或 2輛 LAV-25！',
        statsDesc: 'HP: 1100 | 航速 40kt 氣墊越障 | 運載 M1IP 戰車或 2輛 LAV-25 / 180名陸戰隊',
        typeTag: 'lcac',
      },
      {
        id: 'req-support-ohio-ssbn',
        category: 'ships',
        name: '俄亥俄級戰略核潛艦 (SSBN-726 · 三叉戟 SLBM)',
        cost: 1000,
        era: 'era5',
        badge: '三叉戟II D5 潛射核彈·MIRV分導熱核',
        desc: '美利堅合眾國水下三位一體核威懾終極基石！呼叫外海戰略巡航中之俄亥俄級核潛艦，實施水下熱發射 UGM-133 三叉戟 II D5 潛射洲際彈道飛彈，巨型白煙柱直衝平流層，以 Mach 24 高超音速再入大氣層，釋放多枚分導熱核彈頭 (MIRV)，毀滅敵軍要塞並癱瘓全島電子射控系統！注意：將觸發 OPFOR 颱風級戰略核潛艦之極限 MAD 核報復！',
        statsDesc: '戰略終極打擊 | 三叉戟 II D5 SLBM | MIRV 多彈頭百萬噸熱核毀滅 + EMP 全島癱瘓',
        typeTag: 'ohio_ssbn',
      },

      // ════ Carrier & Naval Aircraft ════
      {
        id: 'req-air-f14a',
        category: 'aircraft',
        name: 'F-14A 雄貓可變後掠翼重型戰鬥機 (+4架)',
        cost: 360,
        era: 'era5',
        badge: 'AIM-54鳳凰超遠程BVR/反飛彈',
        desc: '航空母艦防禦之魂！AWG-9 脈衝多普勒雷達可在 5000m 鎖定多目標，齊射 AIM-54 鳳凰主動雷達導引飛彈，精確擊落敵超音速逆火轟炸機與來襲反艦巡弋飛彈！',
        statsDesc: '+4架 F-14A 整備庫存 | AWG-9 雷達 (5000m) | 4x AIM-54 鳳凰 (反轟炸機/反反艦飛彈) | AIM-7/AIM-9',
        typeTag: 'air_f14a',
      },
      {
        id: 'req-air-fa18a',
        category: 'aircraft',
        name: 'F/A-18A 大黃蜂多用途打擊戰鬥機 (+4架)',
        cost: 320,
        era: 'era5',
        badge: '空優格鬥+魚叉掠海反艦雙能',
        desc: '一機多能劃時代戰機！APG-65 數位都卜勒雷達，既能掛載 AIM-9L / AIM-7M 爭奪制空，又能掛載 2枚 AGM-84 魚叉反艦飛彈與 AGM-65 小牛飛彈毀滅敵艦！',
        statsDesc: '+4架 F/A-18A 整備庫存 | AIM-9L / AIM-7M / 2x AGM-84 魚叉反艦飛彈 / AGM-65 小牛',
        typeTag: 'air_fa18a',
      },
      {
        id: 'req-air-s3a',
        category: 'aircraft',
        name: 'S-3A 維京艦載長程雙噴射反潛機 (+4架)',
        cost: 260,
        era: 'era5',
        badge: 'APS-116雷達+聲吶浮標+魚叉',
        desc: '艦載雙噴射長程反潛巡邏機，配備機尾磁異探測儀 (MAD)、聲吶浮標投放管、Mk 46 聲自導反潛魚雷與 AGM-84 魚叉反艦飛彈！',
        statsDesc: '+4架 S-3A 整備庫存 | 長程搜潛 | MAD 磁異偵測 | 魚叉反艦 | Mk 46 航空魚雷',
        typeTag: 'air_s3a',
      },
      {
        id: 'req-air-a6e',
        category: 'aircraft',
        name: 'A-6E 侵入者全天候攻擊機 (+4架)',
        cost: 290,
        era: 'era5',
        badge: 'TRAM光電紅外夜視+雷射穿甲',
        desc: '搭載 TRAM 目標識別攻擊複合光電轉塔，具備高精準夜間雷射照射能力，掛載 GBU-10 鋪路雷射穿甲彈與 AGM-84 魚叉飛彈實施外科手術打擊！',
        statsDesc: '+4架 A-6E 整備庫存 | TRAM 光電瞄準轉塔 | 2x GBU-10 雷射穿甲航彈 | 2x 魚叉反艦',
        typeTag: 'air_a6e',
      },
      {
        id: 'req-air-e2c',
        category: 'aircraft',
        name: 'E-2C 鷹眼艦載空中早期預警機 (+2架)',
        cost: 350,
        era: 'era5',
        badge: 'APS-125旋轉雷達罩+神盾指管',
        desc: '航艦特遣戰鬥群千里眼！背負巨型 APS-125 旋轉雷達天線罩，覆蓋 6500m 廣闊空域，與神盾巡洋艦數據鏈聯網，提早洞悉一切超音速空襲！',
        statsDesc: '+2架 E-2C 整備庫存 | 6500m 超遠空情預警 | 穿透迷霧 | 艦隊聯網射控導航',
        typeTag: 'air_e2c',
      },
      {
        id: 'req-air-ea6b',
        category: 'aircraft',
        name: 'EA-6B 徘徊者電子作戰機 (+2架)',
        cost: 320,
        era: 'era5',
        badge: 'ALQ-99電戰干擾+AGM-88 HARM',
        desc: '四座全頻率電子作戰機！搭載 ALQ-99 電戰干擾莢艙壓制敵方雷達與通訊網，配備 AGM-88 HARM 3.5馬赫高速反輻射飛彈獵殺防空雷達陣地！',
        statsDesc: '+2架 EA-6B 整備庫存 | 全頻段電磁壓制干擾 | 2x AGM-88 HARM 高速反輻射飛彈',
        typeTag: 'air_ea6b',
      },
      {
        id: 'req-air-c2a',
        category: 'aircraft',
        name: 'C-2A 灰狗艦載運輸機 (+2架)',
        cost: 180,
        era: 'era5',
        badge: '特快後勤補給與傘兵空投',
        desc: '雙發艦載運輸機，專職航母物資特快投送與前進島嶼快速機動，支援投送陸戰隊空降部隊！',
        statsDesc: '+2架 C-2A 整備庫存 | 快速人員物資空運 | 支援陸戰隊空投突擊',
        typeTag: 'air_c2a',
      },
      {
        id: 'req-air-sh3f',
        category: 'aircraft',
        name: 'SH-3F 海王遠洋重型反潛直升機 (+4架)',
        cost: 220,
        era: 'era5',
        badge: 'AQS-13吊放聲吶+反潛魚雷',
        desc: '大型雙發遠洋反潛直升機，配備 AQS-13 浸水式吊放主動聲吶與聲自導航空反潛魚雷，在艦隊外圍構築嚴密反潛網。',
        statsDesc: '+4架 SH-3F 整備庫存 | 吊放聲吶 | Mk 46 聲自導反潛魚雷 | 艦載垂直起降',
        typeTag: 'air_sh3f',
      },
      {
        id: 'req-air-av8b',
        category: 'aircraft',
        name: 'AV-8B 海獵鷹II 垂直起降攻擊機 (+4架)',
        cost: 270,
        era: 'era5',
        badge: '垂直短場起降+25mm機砲',
        desc: '美國海軍陸戰隊專屬垂直起降密接支援戰機！配備 25mm GAU-12 轉管機砲、AGM-65 小牛飛彈與雷射炸彈，在灘頭前方提供極速密接空中火力！',
        statsDesc: '+4架 AV-8B 整備庫存 | 垂直/短場起降 | GAU-12 25mm 機砲 | AGM-65 小牛',
        typeTag: 'air_av8b',
      },
      {
        id: 'req-air-ch53',
        category: 'aircraft',
        name: 'CH-53 海種馬重型運輸突擊直升機 (+2架)',
        cost: 250,
        era: 'era5',
        badge: '重裝甲吊運與大兵力機降',
        desc: '重型兩棲突擊運輸直升機，具備超強吊運力，可吊掛輕裝甲車輛或快速機降 2個整編陸戰隊步槍排實施縱深包圍！',
        statsDesc: '+2架 CH-53 整備庫存 | 吊運車輛 / 機降 2 個陸戰隊步槍排',
        typeTag: 'air_ch53',
      },

      // ════ Land-Based Air Force & Army Aviation ════
      {
        id: 'req-air-a10a',
        category: 'aircraft',
        name: 'A-10A 疣豬攻擊機 (裝甲開罐器) (+4架)',
        cost: 310,
        era: 'era5',
        badge: '30mm GAU-8復仇者機砲+小牛飛彈',
        desc: '傳奇對地近接支援霸王！裝甲浴缸包裹飛行員，機首 GAU-8 30mm 復仇者七管轉管巨砲 (3900發/分) 發射貧鈾穿甲燃燒彈，掛載 4枚 AGM-65 小牛飛彈橫掃一切裝甲！',
        statsDesc: '+4架 A-10A 整備庫存 | GAU-8 30mm 轉管巨砲 | 4x AGM-65 小牛飛彈 | 裝甲厚重',
        typeTag: 'air_a10a',
      },
      {
        id: 'req-air-ah64a',
        category: 'aircraft',
        name: 'AH-64A 阿帕契重裝武裝直升機 (+4架)',
        cost: 340,
        era: 'era5',
        badge: '16枚地獄火攻頂飛彈+30mm鏈砲',
        desc: '陸軍重型攻擊直升機王牌！機首配備 TADS/PNVS 光電夜視射控系統、M230 30mm 鏈砲，掛載 16枚 AGM-114 地獄火攻頂反戰車飛彈，消滅整支裝甲部隊！',
        statsDesc: '+4架 AH-64A 整備庫存 | 16x AGM-114 地獄火攻頂飛彈 | M230 30mm 鏈砲 | 雷射照射',
        typeTag: 'air_ah64a',
      },
      {
        id: 'req-air-ah1w',
        category: 'aircraft',
        name: 'AH-1W 超級眼鏡蛇武裝直升機 (+4架)',
        cost: 280,
        era: 'era5',
        badge: '雙發渦輪+拖式飛彈+響尾蛇空空',
        desc: '海軍陸戰隊專屬雙發重裝武裝直升機！配備 20mm 旋轉砲塔、8枚 BGM-71 拖式飛彈與 AIM-9L 響尾蛇空空防衛飛彈，支援登陸作戰！',
        statsDesc: '+4架 AH-1W 整備庫存 | 雙發大馬力 | 8x 拖式飛彈 | 2x 響尾蛇空空飛彈',
        typeTag: 'air_ah1w',
      },
      {
        id: 'req-air-f15a',
        category: 'aircraft',
        name: 'F-15A 鷹式純空優戰鬥機 (+4架)',
        cost: 380,
        era: 'era5',
        badge: '純制空霸主+AIM-7F麻雀+9L全向響尾蛇',
        desc: '未嘗一敗之空優之神！推重比高達 1.2，具備 9G 大過載盤旋敏捷性，配備 APG-63 雷達、4枚 AIM-7F 麻雀中程飛彈與 4枚 AIM-9L 全向響尾蛇，稱霸戰區空域！',
        statsDesc: '+4架 F-15A 整備庫存 | 4x AIM-7F 麻雀 + 4x AIM-9L 響尾蛇 | 9G 空優格鬥極限機動',
        typeTag: 'air_f15a',
      },
      {
        id: 'req-air-f16a',
        category: 'aircraft',
        name: 'F-16A 戰隼超音速多用途戰機 (+4架)',
        cost: 300,
        era: 'era5',
        badge: '線傳飛控高敏捷+小牛飛彈',
        desc: '首款全數位電傳飛控 (Fly-by-wire) 輕型空優戰機！水滴形座艙視野無死角，配備 20mm M61A1 火神砲、AIM-9L 響尾蛇與 AGM-65 小牛飛彈！',
        statsDesc: '+4架 F-16A 整備庫存 | 電傳飛控高過載 | 20mm 火神砲 | 響尾蛇 + 小牛飛彈',
        typeTag: 'air_f16a',
      },
      {
        id: 'req-air-e3a',
        category: 'aircraft',
        name: 'E-3A 哨兵望樓預警機 (+1架)',
        cost: 480,
        era: 'era5',
        badge: '波音707巨型雷達罩+全圖情資',
        desc: '戰區級空中指揮所！波音 707 機背搭載巨型 APY-1/2 旋轉雷達罩，視野覆蓋 8000m，全圖即時分享情資，提早預警敵方超音速飽和飛彈突襲！',
        statsDesc: '+1架 E-3A 戰區預警機 | 探測範圍 8000m | 全戰區雷達視野共享 | 即時敵情報告',
        typeTag: 'air_e3a',
      },
      {
        id: 'req-air-f111',
        category: 'aircraft',
        name: 'F-111 土豚超音速變後掠翼轟炸機 (+2架)',
        cost: 390,
        era: 'era5',
        badge: '地形跟隨雷達+低空高速穿透+鋪路炸彈',
        desc: '超音速低空狂飆之王！可變後掠翼配合地形跟隨雷達 (TFR)，在 60米超低空以 2.5 馬赫高速突防避開雷達，掛載 4枚 GBU-10 鋪路重型穿甲彈精確破壞深層地下陣地！',
        statsDesc: '+2架 F-111 整備庫存 | 2.5馬赫低空突防 | 地形跟隨 | 4x GBU-10 鋪路重型穿甲彈',
        typeTag: 'air_f111',
      },
      {
        id: 'req-air-b52-modern',
        category: 'aircraft',
        name: 'B-52G 同溫層堡壘巡弋飛彈重轟炸機 (+2架)',
        cost: 520,
        era: 'era5',
        badge: '魚叉長程反艦+巨型地毯覆蓋轟炸',
        desc: '巨型戰略轟炸機近代化改進型！雙翼重聯掛架可攜帶 8枚 AGM-84 魚叉反艦巡弋飛彈，亦可裝載 108枚 500磅航彈實施毀滅性走廊地毯轟炸！',
        statsDesc: '+2架 B-52G 整備庫存 | 8x AGM-84 魚叉反艦飛彈 或 108枚通用航彈走廊地毯轟炸',
        typeTag: 'air_b52',
      },
      {
        id: 'req-air-c130',
        category: 'aircraft',
        name: 'C-130 大力士戰術空投運輸機 (+2架)',
        cost: 200,
        era: 'era5',
        badge: '戰術空投重型物資與傘兵',
        desc: '四渦槳野戰大力士運輸機，可在前線島嶼野戰跑道起降，或實施低空重裝甲與步槍排傘降投送！',
        statsDesc: '+2架 C-130 整備庫存 | 投送 2 個美軍步槍排 / 重武器空投',
        typeTag: 'air_c130',
      },

      // ════ Ground Combat Units ════
      {
        id: 'req-ground-army-rifle-83',
        category: 'ground',
        name: '美陸軍步槍班 (83\')',
        cost: 160,
        era: 'era5',
        badge: 'M16A2+M249班機槍+AT4火箭',
        desc: '美軍 80 年代主力摩托化步兵骨幹！換裝三連發 M16A2 突擊步槍、M249 SAW 5.56mm 班用機槍與 AT4 84mm 輕型穿甲火箭筒，基層火力極為強盛。',
        statsDesc: 'HP: 850 | STR: 100% | M16A2 / M249 SAW / AT4 穿甲火箭',
        typeTag: 'army_rifle_83',
      },
      {
        id: 'req-ground-usmc-rifle-83',
        category: 'ground',
        name: '陸戰步槍班 (83\')',
        cost: 180,
        era: 'era5',
        badge: 'SMAW攻堅火箭+M16A2勇猛搶灘',
        desc: '美國海軍陸戰隊兩棲突擊排！配備 Mk 153 SMAW 83mm 肩射多用途攻堅火箭筒，能迅速轟穿灘頭鋼筋混凝土機槍掩體與輕裝甲！',
        statsDesc: 'HP: 950 | STR: 100% | SMAW 83mm 攻堅火箭 | 強烈搶灘突擊推進',
        typeTag: 'usmc_rifle_83',
      },
      {
        id: 'req-ground-dragon-atgm',
        category: 'ground',
        name: '反戰車飛彈班 (M47)',
        cost: 220,
        era: 'era5',
        badge: 'M47龍式線導破甲飛彈',
        desc: '單兵肩射反裝甲導向飛彈組！紅外尋標瞄準線追蹤，射程達 1000m，精確破壞敵方主力戰車與重裝甲工事！',
        statsDesc: 'HP: 700 | STR: 100% | M47 龍式導引飛彈 (1000m) | 精確穿透重裝甲',
        typeTag: 'dragon_atgm',
      },
      {
        id: 'req-ground-aav7a1',
        category: 'ground',
        name: 'AAV-7A1 兩棲突擊載具',
        cost: 320,
        era: 'era5',
        badge: '水陸浮渡搶灘+Mk 19榴彈砲',
        desc: '現代海軍陸戰隊標誌性浮渡裝甲運兵車！車頂全封閉砲塔配備 Mk 19 40mm 自動榴彈發射器與 M2HB .50 重機槍，可直接從兩棲艦泛水航渡搶灘破障！',
        statsDesc: 'HP: 2200 | 水陸兩棲浮渡 | Mk 19 40mm 榴彈槍 + .50 機槍 | 快速卸載步兵',
        typeTag: 'usmc_aav7a1',
      },
      {
        id: 'req-ground-lav25',
        category: 'ground',
        name: 'LAV-25 輪型裝甲偵察車',
        cost: 280,
        era: 'era5',
        badge: '25mm M242鏈砲+高速機動',
        desc: '8x8 八輪高速輕型裝甲偵察車！公路時速達 100km/h，具備水上浮渡能力，配備 25mm M242 大毒蛇雙向供彈鏈砲，精確點射撕裂敵輕裝甲與掩體！',
        statsDesc: 'HP: 1800 | 25mm M242 鏈砲 | 100km/h 高速機動 | 浮渡能力',
        typeTag: 'usmc_lav25',
      },
      {
        id: 'req-ground-m2-bradley',
        category: 'ground',
        name: 'M2 布雷德利裝甲機步戰車',
        cost: 380,
        era: 'era5',
        badge: '雙聯TOW-2反戰車飛彈+25mm鏈砲',
        desc: '美軍機械化步兵核心主力！配備雙聯裝 BGM-71 TOW 重型線導破甲反戰車飛彈 (射程 1500m) 與 25mm M242 鏈砲，具備熱成像射控，專門遠程獵殺敵 T-72/T-80 戰車！',
        statsDesc: 'HP: 3300 | 雙聯裝 TOW-2 破甲飛彈 (1500m) + 25mm M242 鏈砲 | 機步中堅',
        typeTag: 'm2_bradley',
      },
      {
        id: 'req-ground-m60a1-rise',
        category: 'ground',
        name: 'M60A1 RISE (Passive) 主力戰車',
        cost: 420,
        era: 'era5',
        badge: '105mm線膛砲+ERA反應裝甲',
        desc: '海軍陸戰隊沙漠風暴作戰主力中堅！加裝 ERA 爆炸反應裝甲模組（大幅減免 RPG/破甲彈傷害），配備 105mm M68 線膛砲與被動微光夜視儀！',
        statsDesc: 'HP: 3400 | 105mm M68 戰車砲 | ERA 反應裝甲模組 | 破甲彈高抗性',
        typeTag: 'm60a1_rise',
      },
      {
        id: 'req-ground-m1a1-abrams',
        category: 'ground',
        name: 'M1A1 艾布蘭主力戰車排',
        cost: 680,
        era: 'era5',
        badge: '120mm M256 滑膛砲+貧鈾裝甲',
        desc: '1985 年起服役的 M1A1：換裝萊茵金屬 120mm M256 滑膛砲與 M829 翼穩脫殼穿甲彈，1988 年起加裝貧鈾裝甲 (M1A1 HA)。沙漠風暴中以熱像儀於夜間 3,000m 外擊毀伊拉克 T-72。',
        statsDesc: 'HP: 5400 | 120mm 滑膛砲 | 貧鈾複合裝甲 | 三核生化防護',
        typeTag: 'us_m1a1_abrams',
      },
      {
        id: 'req-ground-m1ip-abrams',
        category: 'ground',
        name: 'M1IP 艾布蘭主力戰車',
        cost: 580,
        era: 'era5',
        badge: '複合裝甲+1500HP燃氣渦輪+105mm',
        desc: '現代裝甲戰場主宰！改進防護型 M1IP 戰車加強砲塔前部喬巴姆複合裝甲，1500馬力 AGT1500 燃氣渦輪引擎提供 72km/h 越野極速，配備數位彈道射控電腦與熱成像儀！',
        statsDesc: 'HP: 4800 | 複合裝甲極厚 | 1500HP 渦輪極速機動 | 105mm M68A1 電腦精確射控',
        typeTag: 'm1ip_abrams',
      },
      {
        id: 'req-ground-m198-155',
        category: 'ground',
        name: 'M198 155mm 牽引重榴彈砲',
        cost: 300,
        era: 'era5',
        badge: '雙模打擊：遠程曲射+直瞄坦克平射',
        desc: '陸戰隊與陸軍現代化 155mm 39倍徑輕量化重榴彈砲！具備雙模攻擊機制：距離目標 <700m 時切換直瞄高速穿甲平射（坦克殺手），>700m 時切換長程高仰角覆蓋曲射！',
        statsDesc: 'HP: 1600 | 雙模砲擊機制 (<700m 直瞄平射 / >700m 遠程曲射) | 射程: 2000m',
        typeTag: 'm198_155',
      },
      {
        id: 'req-ground-lav-ad',
        category: 'ground',
        name: 'LAV-AD 輪型防空自走砲車',
        cost: 390,
        era: 'era5',
        badge: '25mm格林火神+8x刺針防空飛彈',
        desc: '陸戰隊高速輪型彈砲合一防空車！裝備 GAU-12 25mm 五管格林機砲 (3000發/分) 與兩具四聯裝 FIM-92 刺針紅外防空飛彈，自動獵殺 1600m 內敵戰機與掠海飛彈！',
        statsDesc: 'HP: 1800 | 25mm 五管格林機砲 (3000發/分) + 8枚刺針飛彈 | 彈砲合一',
        typeTag: 'lav_ad',
      },
      {
        id: 'req-ground-m163-vads',
        category: 'ground',
        name: 'M163 火神防空自走砲',
        cost: 360,
        era: 'era5',
        badge: '20mm M61A1火神 3000發/分密集彈幕',
        desc: '以 M113 履帶底盤搭載 M61A1 20mm 六管火神旋轉加特林機砲，配備測距雷達，向掠海巡弋飛彈與低空俯衝戰機噴射毀滅性每分鐘 3000 發光束彈幕！',
        statsDesc: 'HP: 1700 | 20mm M61A1 火神砲 (3000發/分) | 測距雷達 | 密集防空火網',
        typeTag: 'm163_vads',
      },
      {
        id: 'req-ground-m270-mlrs',
        category: 'ground',
        name: 'M270 MLRS 多管火箭系統',
        cost: 480,
        era: 'era5',
        badge: '12x 227mm M39集束子母彈·鋼鐵之雨',
        desc: '美軍現代砲兵最具威懾力的大殺器！以 Bradley 履帶底盤搭載雙聯六管發射箱，可在 4500m 外連續齊射 12 枚 227mm 火箭，每枚火箭在高空解體拋撒數百枚 M39 DPICM 雙用途改進型集束子母彈，於落點造成廣域覆蓋式微爆轟，瞬間蒸發敵裝甲連與步兵縱隊！',
        statsDesc: 'HP: 3600 | 12聯裝 227mm M39 集束子母彈 (4500m) | 鋼鐵之雨廣域飽和毀滅',
        typeTag: 'us_m270_mlrs',
      },
      {
        id: 'req-ground-m270-atacms',
        category: 'ground',
        name: 'MGM-140 ATACMS 戰術飛彈發射車',
        cost: 750,
        era: 'era5',
        badge: 'M57碉堡剋星·6500m點穴毀滅',
        desc: '美國陸軍射程最遠之戰術地對地彈道飛彈！對標敵軍 9K72 飛毛腿-B，發射箱搭載單枚重型 MGM-140 飛彈，裝備 M57 單一高爆穿甲碉堡剋星 (Bunker-Buster) 彈頭，具備 GPS/INS 慣性精確導引與 Mach 3.5 終端俯衝，6500m 外一擊點穴破壞敵方防禦要塞、加固指揮所與重裝甲集結地！',
        statsDesc: 'HP: 3800 | 6500m 超長射程 | M57 碉堡剋星高穿甲巨型彈頭 | 對標飛毛腿-B',
        typeTag: 'us_m270_atacms',
      },
      {
        id: 'req-ground-m109a6',
        category: 'ground',
        name: 'M109A6 帕拉丁 155mm 數位自走砲',
        cost: 540,
        era: 'era5',
        badge: '數位射控·極速反砲擊 (Counter-Battery)',
        desc: '美國陸軍現代數位化主力自走重砲！裝備 39倍徑 155mm M284 榴彈砲與 AFATDS 數位野戰砲兵戰術射控系統，可在 4800m 射程內於 60 秒內完成「停車-射控解算-首發開火-轉移陣地」，配備反砲兵音響/雷達逆推，主動對敵方開火之重砲與火箭陣地實施毀滅性反砲擊覆蓋！',
        statsDesc: 'HP: 3800 | 155mm M284 數位砲兵 (4800m) | 全自動反砲兵雷達逆推打擊',
        typeTag: 'us_m109a6_paladin',
      },
      {
        id: 'req-ground-atacms-nuclear',
        category: 'ground',
        name: 'MGM-140 戰術核彈頭 SSM 發射車',
        cost: 800,
        era: 'era5',
        badge: 'W70/W85 戰術熱核彈頭·6500m毀滅打擊',
        desc: '最高統帥部直屬之重型陸基戰術核打擊發射車！裝備 W70 戰術熱核彈頭（50kt 當量），以 Mach 3.8 超高速終端俯衝直擊敵核心防禦陣地，造成 350m 熱核毀滅火球、EMP 電磁脈衝與永久性重創！高威懾力武器，使用將觸發蘇軍相互保證毀滅 (MAD) 核報復程序！',
        statsDesc: 'HP: 3800 | 6500m 戰術熱核打擊 | 50kt 當量 + EMP 電磁癱瘓 | 極限戰略威懾',
        typeTag: 'us_atacms_nuclear',
      },
      {
        id: 'req-ground-engineer',
        category: 'ground',
        name: 'USN Seabees 戰鬥工兵排',
        cost: 180,
        era: 'era5',
        badge: '愛國者陣地闢建+深水大港修造',
        desc: '現代化海軍工兵團，搶灘後可在島上闢建愛國者飛彈陣地、雷達站、前線深水軍港與前進基地！',
        statsDesc: 'HP: 900 | 開闢前進野戰跑道與雷達站 | 修築防禦工事',
        typeTag: 'engineer',
      },

      // ════ Base & Defense Installations ════
      {
        id: 'req-fac-sam-patriot',
        category: 'installations',
        name: 'MIM-104 愛國者長程防空飛彈營',
        cost: 550,
        era: 'era5',
        badge: 'AN/MPQ-53相列雷達+超長程反飛彈',
        desc: '革命性相位陣列防空/反飛彈系統！配備 AN/MPQ-53 相控陣雷達與四聯裝發射箱，射程達 2600m，精確攔截敵方超音速戰機與來襲反艦巡弋飛彈！',
        statsDesc: 'HP: 2600 | 射程: 2600m | AN/MPQ-53 相控陣雷達 | MIM-104 防空/反飛彈攔截',
        typeTag: 'sam_patriot',
        requiresIsland: true,
      },
      {
        id: 'req-fac-sam-hawk',
        category: 'installations',
        name: 'MIM-23 霍克改進型防空飛彈連',
        cost: 380,
        era: 'era5',
        badge: '半主動雷達導引SAM',
        desc: '半主動雷達導引地對空飛彈陣地，建立 1800m 防空攔截傘，自動鎖定並擊毀敵方超音速戰機與巡航飛彈！',
        statsDesc: 'HP: 1800 | 射程: 1800m | 霍克防空導彈 | 高空反飛彈反飛機',
        typeTag: 'sam_hawk',
        requiresIsland: true,
      },
      {
        id: 'req-fac-fob',
        category: 'installations',
        name: '前進作戰基地 (FOB) 戰術指揮所',
        cost: 450,
        era: 'era5',
        badge: '直升機停機坪+全域指管',
        desc: '在島嶼核心構築現代化前進作戰基地 (FOB)！設有直升機停機坪、長程通訊雷達與加固指揮所，新地面部隊在此直接就地集結！',
        statsDesc: 'HP: 5000 | 專屬地面部隊集結出生點 | 擴展雷達視野 1800m',
        typeTag: 'fob',
        requiresIsland: true,
      },
      {
        id: 'req-fac-m1-240mm',
        category: 'installations',
        name: 'M1 240mm「黑龍」固定式重砲台',
        cost: 380,
        era: 'era5',
        badge: '3800m超重型固定岸砲',
        desc: '在島嶼要衝構築混凝土八角砲座，部署 M1 240mm「黑龍」巨型固定榴彈砲並配發火箭助推彈 (RAP)！具備 3800m 極遠射程，跨海峽轟擊敵艦、地面裝甲與鄰島要塞！',
        statsDesc: 'HP: 2600 | 射程: 3800m | 單發重砲傷害: 1050 (大範圍破片)',
        typeTag: 'm1_240mm',
        requiresIsland: true,
      },
      {
        id: 'req-fac-dockyard',
        category: 'installations',
        name: '前線應急修護浮塢碼頭',
        cost: 260,
        era: 'era5',
        badge: '艦體損害搶修',
        desc: '在島嶼岸邊架設前線修護浮塢，受創戰艦進駐泊位後可緊急抽水焊接搶修至綠色安全狀態！',
        statsDesc: '泊靠搶修 | 60 HP/s 抽水焊接搶修 | 恢復綠色戰備狀態',
        typeTag: 'dockyard',
        requiresIsland: true,
      },
      {
        id: 'req-fac-major-naval-port',
        category: 'installations',
        name: '正規深水軍港突堤',
        cost: 420,
        era: 'era5',
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
        cost: 320,
        era: 'era5',
        badge: '現代噴射戰機起降基石',
        desc: '闢建可供超音速噴射機與重轟炸機起降補給的前線野戰跑道！',
        statsDesc: '前線航空起降基地 | 戰機起降補給 | 建立戰術防禦空域',
        typeTag: 'airfield',
        requiresIsland: true,
      },
      {
        id: 'req-fac-radar',
        category: 'installations',
        name: '現代化超長程對空搜索雷達哨',
        cost: 250,
        era: 'era5',
        badge: '6000m 超長程早期預警',
        desc: '建立現代化高功率對空監視雷達台，探測 6000m 空域敵機活動。',
        statsDesc: '探測半徑: 6000m | 穿透戰場迷霧 | 提早預警空襲機群與飛彈',
        typeTag: 'radar',
        requiresIsland: true,
      },
      {
        id: 'req-fac-supply-depot',
        category: 'installations',
        name: '戰地輜重補給樞紐',
        cost: 200,
        era: 'era5',
        badge: '裝備建制修整+2.5%/s',
        desc: '地下儲備飛彈與重裝備，大幅加快全島陸軍部隊建制度修整 (+2.5%/s)！',
        statsDesc: '補給儲備 | 建制度恢復 +2.5%/s | 維護陸軍作戰戰力',
        typeTag: 'supply_depot',
        requiresIsland: true,
      },
      {
        id: 'req-fac-field-hospital',
        category: 'installations',
        name: '戰地野戰醫院',
        cost: 160,
        era: 'era5',
        badge: '人員救護整編+3.0%/s',
        desc: '設立外科手術野戰醫院，救治負傷官兵迅速歸隊，顯著穩定部隊組織度 (+3.0%/s)！',
        statsDesc: '人員救治返部 | 組織度恢復 +3.0%/s | 防止士氣崩潰',
        typeTag: 'field_hospital',
        requiresIsland: true,
      },
      {
        id: 'req-fac-pow-camp',
        category: 'installations',
        name: '戰俘營 (POW Camp)',
        cost: 140,
        era: 'era5',
        badge: '收押戰俘 · 審訊情資',
        desc: '以鐵絲網圍起的收容營區，收押俘獲的敵方飛行員與艦員（每座 80 人），審訊所得持續轉為研究點數 RP。',
        statsDesc: '容量 80 人 | 每名戰俘 +0.03 RP/s | 需步兵在場構工',
        typeTag: 'pow_camp',
        requiresIsland: true,
      },
    ];
  }

  // ══════════════════════════════════════════════════
  // 時代四 (1965-1973) 越戰與冷戰超音速導彈時代專屬型錄
  // ══════════════════════════════════════════════════
  if (era === 'era4') {
    return [
      // Ships
      {
        id: 'req-ship-cv63',
        category: 'ships',
        name: '小鷹號超級航母 (CV-63)',
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
        name: '貝爾納普級導彈巡洋艦 (CG-26)',
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
        name: '亞當斯級導彈驅逐艦 (DDG-2)',
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
        name: '硫磺島級兩棲突擊艦 (LPH-2)',
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
        name: 'LCM-8 機械化重裝登陸艇',
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
        name: '刺尾鯛級攻擊潛艦 (SS-563)',
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
        name: '雪曼級主力驅逐艦 (DD-931)',
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
        name: '諾克斯級反潛巡防艦 (FFG-1052)',
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
        name: 'F-4J 幽靈II 全天候超音速戰鬥機 (+4架)',
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
        name: 'F-8 十字軍近戰機 (+4架)',
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
        name: 'A-6A 入侵者全天候重型攻擊機 (+4架)',
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
        name: 'A-4 天鷹輕型高速突擊攻擊機 (+4架)',
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
        name: 'B-52 巨型同溫層堡壘戰略重轟炸機 (+2架)',
        cost: 480,
        era: 'era4',
        badge: '36枚巨量地毯轟炸',
        desc: '「滾雷行動」戰略重轟炸機，8具渦輪噴射發動機，直線穿透投擲 36枚高爆炸彈實施毀滅性地毯轟炸！',
        statsDesc: '+2架 B-52 戰略庫存 | 36枚高爆航彈連續地毯覆蓋轟炸',
        typeTag: 'air_b52',
      },
      {
        id: 'req-air-f105',
        category: 'aircraft',
        name: 'F-105G 雷公防空壓制野鼬機 (+4架)',
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
        name: 'A-7 海盜II 輕型戰術攻擊機 (+4架)',
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
        name: 'AH-1G 眼鏡蛇武裝直升機 (+4架)',
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
        name: 'UH-1D 休伊空中突擊直升機 (+4架)',
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
        name: 'OV-10A 野馬前進空中管制機 (+4架)',
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
        name: 'C-1 貿易者艦載傘兵空投機 (+2架)',
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
        name: 'SH-2 海妖艦載輕型反潛直升機 (+4架)',
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
        name: 'P-3C 獵戶座遠程海上巡邏機 (+2架)',
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
        name: 'USMC 空中突擊/直升機機降突擊排 (1965)',
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
        name: 'USMC M48A3 巴頓主力戰車排',
        cost: 350,
        era: 'era4',
        badge: '90mm M41主砲+重裝甲',
        desc: '配備 90mm M41 戰車砲與柴油發動機之主力中戰車，強厚裝甲可抵禦敵步兵 RPG 與機砲直擊。',
        statsDesc: 'HP: 2400 | 90mm 戰車砲 | 裝甲厚重 | 灘頭破障',
        typeTag: 'armor_m48',
      },
      {
        id: 'req-ground-m551',
        category: 'ground',
        name: 'US Army M551 謝里登裝甲騎兵排',
        cost: 280,
        era: 'era4',
        badge: '152mm砲射飛彈兩用砲',
        desc: '1969 年起投入越南裝甲騎兵團的空降突擊偵察車：鋁合金車體可空投、可浮渡，152mm 主砲發射 M625 霰彈對付叢林步兵。',
        statsDesc: 'HP: 1500 | 152mm 兩用砲 | 高機動輕裝甲 | 兩棲浮渡',
        typeTag: 'm551_sheridan',
      },
      {
        id: 'req-ground-ontos',
        category: 'ground',
        name: 'USMC M50 昂圖斯六聯無後座力砲戰車排',
        cost: 260,
        era: 'era4',
        badge: '6聯裝106mm無後座力砲',
        desc: '「這東西太神奇了！」配備 6門 M40A1C 106mm 無後座力砲，一輪急速齊射瞬間轟平敵地下掩體與工事！',
        statsDesc: 'HP: 1100 | 6門 106mm 破甲無後座力砲 | 瞬態爆發殺傷',
        typeTag: 'ontos_m50',
      },
      {
        id: 'req-ground-usmc-lvtp5a1',
        category: 'ground',
        name: 'USMC LVTP-5A1 兩棲重裝步戰車排',
        cost: 290,
        era: 'era4',
        badge: '水陸兩棲+重載機步',
        desc: '海軍陸戰隊主力重型兩棲履帶裝甲載具，具備卓越水陸浮渡航行能力，車頂配備多挺機槍，可搶灘並直接伴隨戰車衝鋒！',
        statsDesc: 'HP: 2000 | 浮渡水陸兩棲 | 機槍與伴隨突擊火力 | 灘頭重載突擊',
        typeTag: 'usmc_lvtp5a1',
      },
      {
        id: 'req-ground-artillery',
        category: 'ground',
        name: 'USMC M114 155mm 重榴彈砲排',
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
        name: 'USN Seabees 戰鬥工兵排',
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
        name: '美陸軍 1965 年型前線常規步槍排',
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
        name: 'M113 裝甲運兵機械化步兵排',
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
        name: 'MIM-72 榭樹野戰履帶防空飛彈排',
        cost: 380,
        era: 'era4',
        badge: '4聯裝響尾蛇防空飛彈',
        desc: '前線機動野戰防空傘！履帶車載四聯裝紅外線尋標防空飛彈發射架，自動偵測並打擊 1600m 範圍內掠空敵戰鬥機與強擊機！',
        statsDesc: 'HP: 1300 | MIM-72 紅外導引飛彈 (1600m防空) | 前線自動防禦攔截',
        typeTag: 'chaparral_sam',
      },
      {
        id: 'req-ground-m109',
        category: 'ground',
        name: 'M109 155mm 履帶自走榴彈砲',
        cost: 480,
        era: 'era4',
        badge: '155mm履帶重砲·反砲火壓制',
        desc: '美軍主力裝甲全封閉履帶自走砲！全鋁合金裝甲防護，裝備 155mm M126 榴彈砲，射程達 4200m，具備反砲兵音響解算雷達，自動捕捉敵砲位座標實施 3 連急速反砲擊！',
        statsDesc: 'HP: 3400 | 155mm M126 自走重砲 (4200m) | 自動反砲擊 Counter-Battery',
        typeTag: 'us_m109_spg',
      },

      // Installations
      {
        id: 'req-fac-sam-hawk',
        category: 'installations',
        name: 'MIM-23 霍克防空飛彈連',
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
        name: '前進作戰基地 (FOB) 戰術指揮所',
        cost: 450,
        era: 'era4',
        badge: '停機坪+全域指管',
        desc: '在島嶼核心構築現代化前進作戰基地 (FOB)！設有直升機停機坪、長程通訊雷達與加固指揮所，新地面部隊在此直接就地集結！',
        statsDesc: 'HP: 4500 | 專屬地面部隊集結出生點 | 擴展雷達視野 1600m',
        typeTag: 'fob',
        requiresIsland: true,
      },
      {
        id: 'req-fac-m1-240mm',
        category: 'installations',
        name: 'M1 240mm「黑龍」固定式重砲台',
        cost: 360,
        era: 'era4',
        badge: '3600m重型固定榴彈砲',
        desc: '在島嶼要衝構築鋼筋混凝土固定砲座，部署 M1 240mm「黑龍」巨型榴彈砲！發射 163kg 超重砲彈，射程達 3600m，重創敵艦與跨海峽敵軍要塞！',
        statsDesc: 'HP: 2600 | 射程: 3600m | 單發重砲傷害: 920 (大範圍破片)',
        typeTag: 'm1_240mm',
        requiresIsland: true,
      },
      {
        id: 'req-fac-dockyard',
        category: 'installations',
        name: '前線應急修護浮塢碼頭',
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
        cost: 160,
        era: 'era4',
        badge: '傷員救護整編',
        desc: '設立外科手術野戰醫院，救治負傷官兵迅速歸隊，顯著穩定部隊組織度 (+2.5%/s)！',
        statsDesc: '人員救治返部 | 組織度恢復 +2.5%/s | 防止士氣崩潰',
        typeTag: 'field_hospital',
        requiresIsland: true,
      },
      {
        id: 'req-fac-pow-camp',
        category: 'installations',
        name: '戰俘營 (POW Camp)',
        cost: 140,
        era: 'era4',
        badge: '收押戰俘 · 審訊情資',
        desc: '以鐵絲網圍起的收容營區，收押俘獲的敵方飛行員與艦員（每座 80 人），審訊所得持續轉為研究點數 RP。',
        statsDesc: '容量 80 人 | 每名戰俘 +0.03 RP/s | 需步兵在場構工',
        typeTag: 'pow_camp',
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
          ? '快速戰車登陸艦 (LST-1153)'
          : era === 'era2'
          ? '戰車登陸艦 (LST-491)'
          : '戰車登陸艦 (LST-391)',
      cost: 220,
      era,
      badge: '登陸突擊',
      desc: '大型戰車登陸艦，滿載陸戰隊突擊步槍排與戰車排直接駛向島嶼灘頭實施搶灘破障！',
      statsDesc: 'HP: 2400 | 運載: 約 20 輛 M4 + 163 人 | 搶灘卸載',
      typeTag: 'lst',
    },
    {
      id: 'req-ship-lcvp',
      category: 'ships',
      name:
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
    {
      id: 'req-air-c47',
      category: 'aircraft',
      name: 'C-47 空中列車傘兵運輸機 (+2架)',
      cost: 210,
      era,
      badge: '全時代傘兵空降',
      desc: '調派 2架 C-47 空中列車戰術運輸機至前進航空基地！搭載精銳傘兵空降排，飛臨島嶼點擊「卸載 (U)」或右鍵島嶼即刻垂直空降奪島！',
      statsDesc: '+2架 陸基傘兵運輸機 | 空投 2 個時代精銳步兵/傘兵排',
      typeTag: 'air_c47',
    },
  ];

  // Era 3 Special Aircraft Additions
  if (era === 'era3') {
    aircraft.push(
      {
        id: 'req-air-jet-f9f',
        category: 'aircraft',
        name: 'F9F 黑豹噴射戰鬥機 (+4架)',
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
        name: 'F2H 女妖雙發噴射機 (+4架)',
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
        name: 'AD-3W 全域空中預警機 (+1架)',
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
        name: 'HO3S-1 搜救直升機 (+1架)',
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

  if (era === 'era2') {
    ground.push(
      {
        id: 'req-ground-m4-calliope',
        category: 'ground',
        name: 'M4A3 雪曼「管風琴」60聯裝火箭車',
        cost: 380,
        era: 'era2',
        badge: 'T34 60聯裝4.5吋火箭·飽和齊射',
        desc: '二戰美軍最具震撼力的地面火箭自走砲！在 M4A3 薛曼戰車砲塔上方安裝 T34 60聯裝 4.5吋火箭發射管，以每秒 4 發的狂暴射速實施 60 發密集高爆火箭飽和齊射，瞬間將敵海灘防禦帶與碉堡群化為焦土！',
        statsDesc: 'HP: 3200 | 60聯裝 114mm 火箭 (3800m) | 飽和面殺傷壓制',
        typeTag: 'us_m4_calliope',
      },
      {
        id: 'req-ground-m26-pershing',
        category: 'ground',
        name: 'US Army M26 潘興重戰車排',
        cost: 380,
        era: 'era3',
        badge: '90mm M3 戰車砲',
        desc: '1950 年 8 月首批運抵釜山環形防線的重戰車，90mm 主砲在 1,000m 內可正面擊穿 T-34/85，扭轉了開戰初期北韓裝甲的優勢。',
        statsDesc: 'HP: 3600 | 90mm M3 | 厚重裝甲 | 機動較慢',
        typeTag: 'us_m26_pershing',
      },
      {
        id: 'req-ground-m7-priest',
        category: 'ground',
        name: 'M7 牧師式 105mm 自走砲',
        cost: 320,
        era: 'era2',
        badge: '105mm自走速射砲·反砲擊',
        desc: '經典全履帶開頂自走榴彈砲！右前側設有圓柱形機槍塔座（如同佈道壇 Priest），裝備 M2A1 105mm 榴彈砲，配備反砲兵音響觀測，自動追瞄敵方開火之迫擊砲與要塞砲陣地實施精準反砲火打擊！',
        statsDesc: 'HP: 2700 | 105mm 自走榴彈砲 (3200m) | 自動反砲擊 Counter-Battery',
        typeTag: 'us_m7_priest',
      }
    );
  } else if (era === 'era3') {
    ground.push({
      id: 'req-ground-m44-spg',
      category: 'ground',
      name: 'M44 155mm 自走榴彈砲',
      cost: 390,
      era: 'era3',
      badge: '155mm巨砲·全自動反砲擊',
      desc: '冷戰初期美軍履帶重型自走砲，裝備 155mm M45 榴彈砲，射程達 3600m，反砲兵雷達自動解算敵砲位座標實施毀滅性反擊！',
      statsDesc: 'HP: 3200 | 155mm 自走砲 (3600m) | 反砲兵雷達自動反砲擊',
      typeTag: 'us_m44_spg',
    });
  }

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
      id: 'req-fac-m1-240mm',
      category: 'installations',
      name: era === 'era1' ? 'M1918 240mm 固定式重砲台' : 'M1 240mm「黑龍」固定式重砲台',
      cost: 340,
      era,
      badge: era === 'era1' ? '2800m超重砲台' : '3200-3400m黑龍重砲',
      desc:
        era === 'era1'
          ? '在島嶼構築固定式八角混凝土砲座，部署 240mm 重型固定榴彈砲，遠程轟擊逼近海峽的敵軍主力艦與登陸部隊！'
          : '在島嶼制高點構築裝甲混凝土八角砲座，部署美軍史上最強野戰/要塞巨砲 M1 240mm「黑龍」！發射 163kg 超重砲彈遠距摧毀敵軍艦艇與鄰島要塞！',
      statsDesc:
        era === 'era3'
          ? 'HP: 2600 | 射程: 3400m | 163kg 重砲傷害: 850'
          : era === 'era2'
          ? 'HP: 2600 | 射程: 3200m | 163kg 重砲傷害: 780'
          : 'HP: 2400 | 射程: 2800m | 重砲傷害: 640',
      typeTag: 'm1_240mm',
      requiresIsland: true,
    },
    {
      id: 'req-fac-radar',
      category: 'installations',
      name:
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
      name: '浮式人工棧橋港 (急造港口)',
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
      name: '戰地輜重樞紐 (Supply Depot)',
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
      name: '戰地野戰醫院 (Field Hospital)',
      cost: 160,
      era,
      badge: '傷員救護整編',
      desc: '設立戰地野戰醫院，救治前線負傷官兵，使傷患重回作戰建制，顯著穩定陸軍部隊組織度！',
      statsDesc: '人員救治返部 | 組織度恢復 +2.5%/s | 防止士氣崩潰',
      typeTag: 'field_hospital',
      requiresIsland: true,
    },
    {
      id: 'req-fac-pow-camp',
      category: 'installations',
      name: '戰俘營 (POW Camp)',
      cost: 140,
      era: era,
      badge: '收押戰俘 · 審訊情資',
      desc: '以鐵絲網圍起的收容營區，收押俘獲的敵方飛行員與艦員（每座 80 人），審訊所得持續轉為研究點數 RP。',
      statsDesc: '容量 80 人 | 每名戰俘 +0.03 RP/s | 需步兵在場構工',
      typeTag: 'pow_camp',
      requiresIsland: true,
    },
    {
      id: 'req-fac-forward-airfield',
      category: 'installations',
      name: '前進野戰機場 (Airfield)',
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
      name: '營指揮所 (Battalion CP)',
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

/**
 * Field works every era needs: eras 4 and 5 had no cards for the battalion command post, ammunition
 * dump, pier, dug-in command post or gun air defence, although reinforcements assemble at the
 * battalion CP and 設施構工 lists them.
 */
function withMissingWorks(items: RequisitionItem[], era: Era): RequisitionItem[] {
  if (era !== 'era4' && era !== 'era5') return items;
  const e5 = era === 'era5';
  const works: RequisitionItem[] = [
    { id: 'req-fac-battalion-cp', category: 'installations', name: '營指揮所 (Battalion CP)', cost: 250, era, badge: '呼叫支援樞紐', desc: '在島嶼構築營級戰術指揮所，新徵集的地面部隊將直接自該指揮所周邊集結開出。', statsDesc: 'HP: 3800 | 專屬解鎖地面部隊增援 | 就地集結出生點', typeTag: 'battalion_cp' },
    { id: 'req-fac-command-post', category: 'installations', name: e5 ? '強化野戰指揮掩體 (TOC)' : '沙包掩體戰術作戰中心 (TOC)', cost: 200, era, badge: '組織度抵抗', desc: e5 ? '以預鑄混凝土與沙包構築的戰術作戰中心，提升駐軍韌性與視距。' : '火力基地中央以沙包與鋼板構築的戰術作戰中心。', statsDesc: 'HP: 3600 | 守備組織度抵抗 +50% | 視距 +1000m', typeTag: 'command_post' },
    { id: 'req-fac-heavy-aa', category: 'installations', name: e5 ? 'M167 火神 20mm 防空砲陣地' : 'M42 雙聯 40mm 防空砲陣地', cost: 200, era, badge: '低空防空', desc: e5 ? '牽引式 M167 火神 6 管 20mm 機砲，保護機場與指揮所免受低空攻擊。' : '固定於火力基地周邊的雙聯 40mm 博福斯防空砲，兼作平射壓制。', statsDesc: '射程: 1200m | 自動攔截低空敵機', typeTag: 'heavy_aa' },
    { id: 'req-fac-ammo-depot', category: 'installations', name: e5 ? '前進彈藥補給點 (ASP)' : '火力基地彈藥庫', cost: 180, era, badge: '彈藥倍增', desc: '囤積砲彈、火箭與航空彈藥，加快全島火砲裝填。', statsDesc: '重砲裝填加速 +35% | 友軍艦隊砲擊冷卻縮短 25%', typeTag: 'ammo_depot' },
    { id: 'req-fac-pontoon-pier', category: 'installations', name: e5 ? '模組化浮動碼頭 (LOTS)' : '浮式人工棧橋港 (急造港口)', cost: 180, era, badge: '搶灘補給線', desc: '工兵架設的浮動碼頭，打通全島補給線；工兵駐守後可升級為正規軍港。', statsDesc: '建立全島陸軍補給線 | LST/LCU 快速泊靠', typeTag: 'pontoon_pier' },
  ];
  const have = new Set(items.filter((i) => i.category === 'installations').map((i) => i.typeTag));
  return [...items, ...works.filter((w) => !have.has(w.typeTag))];
}
