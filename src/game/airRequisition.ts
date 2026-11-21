import { AircraftModel, Era, RequisitionItem } from '../types/game';

/**
 * Reinforcement cards for every aircraft type the era's carriers and airfields can operate.
 * The hand-written catalogue covers the main types; these fill in the rest so that no aircraft
 * in the order of battle is without a way to replace losses.
 */
interface AirCard {
  model: AircraftModel;
  name: string;
  count: number;
  cost: number;
  badge: string;
  desc: string;
  statsDesc: string;
}

const AIR_CARDS: Partial<Record<Era, AirCard[]>> = {
  era1: [
    { model: 'tbf', name: 'TBF-1 復仇者魚雷轟炸機隊', count: 4, cost: 240, badge: 'Mk 13 魚雷 · 機背砲塔', desc: '1942 年 6 月中途島首戰後逐步取代 TBD，東所羅門與聖克魯斯海戰的主力魚雷機。', statsDesc: '魚雷/水平轟炸 | 3 人座 | 艦載' },
    { model: 'os2u', name: 'OS2U 翠鳥偵察水上機', count: 2, cost: 110, badge: '彈射偵察 · 砲擊觀測', desc: '戰艦與巡洋艦彈射起飛的偵察觀測機，也執行反潛巡邏與落海飛行員救援。', statsDesc: '偵察 | 砲擊觀測 | 艦載' },
    { model: 'b25', name: 'B-25 米切爾中型轟炸機隊', count: 4, cost: 280, badge: '低空跳彈轟炸', desc: '第5航空軍的 B-25 以機鼻機槍掃射加跳彈轟炸，在俾斯麥海海戰擊潰日軍運輸船團。', statsDesc: '中型轟炸 | 反艦跳彈 | 陸基' },
    { model: 'p36a', name: 'P-36A 鷹式戰鬥機隊', count: 4, cost: 140, badge: '早期陸基戰鬥機', desc: '開戰初期太平洋陸航仍在使用的舊式戰鬥機，性能已落後零戰。', statsDesc: '戰鬥機 | 陸基' },
    { model: 'p39d', name: 'P-39D 空中眼鏡蛇戰鬥機隊', count: 4, cost: 170, badge: '37mm 機首機砲', desc: '瓜島「仙人掌航空隊」的陸航主力，高空性能差，轉而擔任低空對地攻擊。', statsDesc: '戰鬥/對地 | 37mm | 陸基' },
    { model: 'pby', name: 'PBY 卡特琳娜巡邏水上機', count: 2, cost: 220, badge: '長程巡邏 · 夜間「黑貓」', desc: '長程海上巡邏與反潛，夜間塗黑的「黑貓」中隊專門獵殺東京快車。', statsDesc: '巡邏/反潛 | 長航程 | 陸基' },
  ],
  era2: [
    { model: 'f4u', name: 'F4U 海盜式戰鬥機隊', count: 4, cost: 220, badge: '倒鷗翼 · 火箭彈', desc: '陸戰隊與海軍的高速戰鬥轟炸機，沖繩戰役中以火箭與凝固汽油彈支援地面部隊。', statsDesc: '戰鬥/對地 | 艦載/陸基' },
    { model: 'f8f', name: 'F8F 熊貓式戰鬥機隊', count: 4, cost: 240, badge: '爬升攔截 · 4x 20mm', desc: '1945 年服役的高性能攔截機，專為對付神風特攻機而設計。', statsDesc: '攔截戰鬥機 | 艦載' },
    { model: 'sc1', name: 'SC-1 海鷹偵察水上機', count: 2, cost: 130, badge: '搜索雷達 · 彈射', desc: '取代翠鳥的高速偵察水上機，翼下吊掛 AN/APS-4 搜索雷達。', statsDesc: '偵察 | 艦載' },
    { model: 'pby', name: 'PBY-5A 卡特琳娜兩棲巡邏機', count: 2, cost: 220, badge: '海上救援 · 反潛', desc: '「海豚」任務救回大量落海飛行員，也擔任夜間反艦與反潛巡邏。', statsDesc: '巡邏/救援 | 陸基' },
    { model: 'b17_late', name: 'B-17G 飛行堡壘重轟炸機', count: 2, cost: 320, badge: '下巴砲塔 · 高空轟炸', desc: '加裝下巴砲塔的後期型 B-17，太平洋戰場改擔任搜救與高空轟炸。', statsDesc: '重轟炸 | 陸基' },
    { model: 'p38', name: 'P-38 閃電式戰鬥機隊', count: 4, cost: 250, badge: '雙發長航程', desc: '第5航空軍王牌邦格與麥奎爾的座機；長航程護航並擊落山本五十六座機。', statsDesc: '長程戰鬥機 | 陸基' },
  ],
  era3: [
    { model: 'f8f', name: 'F8F-1 熊貓式戰鬥機隊', count: 4, cost: 190, badge: '活塞戰機 · 對地', desc: '韓戰初期仍在部分航艦服役的活塞戰鬥機，主要擔任對地攻擊。', statsDesc: '戰鬥/對地 | 艦載' },
    { model: 'f4u4', name: 'F4U-4 海盜式攻擊機隊', count: 4, cost: 210, badge: '火箭 · 凝固汽油彈', desc: '長津湖撤退時日夜不停的近接空中支援主力，黑人飛行員布朗少尉即駕此機陣亡。', statsDesc: '對地攻擊 | 艦載/陸基' },
    { model: 'f84', name: 'F-84 雷霆噴射戰鬥轟炸機隊', count: 4, cost: 230, badge: '水壩攻擊 · 對地', desc: '1953 年轟炸北韓水庫的主力戰轟機，承擔大部分噴射機對地攻擊任務。', statsDesc: '戰鬥轟炸 | 陸基' },
    { model: 'f82', name: 'F-82 雙野馬夜間戰鬥機', count: 2, cost: 200, badge: '雙機身 · 夜戰雷達', desc: '韓戰第一架擊落敵機的美軍飛機，以雷達擔任夜間攔截與護航。', statsDesc: '夜間戰鬥機 | 陸基' },
  ],
  era4: [
    { model: 'f4b', name: 'F-4B 幽靈II 艦載戰鬥機隊', count: 4, cost: 250, badge: '麻雀 + 響尾蛇', desc: '1965 至 1968 年海軍與陸戰隊的主力艦載戰鬥機，無內建機砲。', statsDesc: '多用途戰鬥機 | 艦載' },
    { model: 'a6b_weasel', name: 'A-6B 入侵者反雷達機', count: 2, cost: 260, badge: 'AGM-78 標準反輻射', desc: '專責壓制 SA-2 陣地的反輻射型入侵者，為打擊機群開路。', statsDesc: '防空壓制 | 艦載' },
    { model: 'e1', name: 'E-1 追蹤者艦載預警機', count: 1, cost: 200, badge: 'AN/APS-82 預警雷達', desc: '「鯨魚」背負大型雷達罩，為艦隊提供低空預警。', statsDesc: '空中預警 | 艦載' },
    { model: 's2', name: 'S-2 追蹤者艦載反潛機', count: 2, cost: 220, badge: '聲納浮標 · 磁異偵測', desc: '反潛航艦的主力定翼反潛機，以聲納浮標與 MAD 追蹤蘇聯潛艦。', statsDesc: '反潛 | 艦載' },
    { model: 'uh2', name: 'UH-2 海妖救援直升機', count: 2, cost: 140, badge: '海上搜救', desc: '航艦的救援直升機，在北部灣救回大量落海飛行員。', statsDesc: '搜救 | 艦載' },
    { model: 'f4e', name: 'F-4E 幽靈II 戰鬥機隊', count: 4, cost: 270, badge: '內建 M61 機砲', desc: '空軍吸取空戰教訓加裝內建機砲的型號，「後衛行動」的主力。', statsDesc: '多用途戰鬥機 | 陸基' },
    { model: 'f100', name: 'F-100 超級軍刀戰鬥轟炸機隊', count: 4, cost: 210, badge: '近接空中支援', desc: '南越境內近接空中支援的主力，「F-100F 野鼬」也首創防空壓制戰術。', statsDesc: '戰鬥轟炸 | 陸基' },
    { model: 'ac47', name: 'AC-47「魔龍」砲艇機', count: 2, cost: 200, badge: '3x 7.62mm 迷你砲', desc: '「噴火的魔龍」繞圈對地掃射，夜間守護遭圍攻的特種部隊營地。', statsDesc: '砲艇機 | 夜間支援 | 陸基' },
    { model: 'ch46', name: 'CH-46 海騎士運輸直升機', count: 2, cost: 190, badge: '陸戰隊空中機動', desc: '陸戰隊的中型縱列雙旋翼運輸直升機，在溪山等地擔任補給與運兵。', statsDesc: '運輸直升機 | 陸基/艦載' },
    { model: 'a1h', name: 'A-1H 天襲者攻擊機隊', count: 4, cost: 200, badge: '長滯空 · 搜救掩護', desc: '「Sandy」任務的主角，以長滯空時間掩護直升機救援擊落的飛行員。', statsDesc: '對地攻擊 | 陸基' },
    { model: 'a37b', name: 'A-37B 蜻蜓輕型攻擊機隊', count: 4, cost: 170, badge: '輕型近接支援', desc: '由教練機改裝的輕型攻擊機，美軍與南越空軍都大量使用。', statsDesc: '輕型攻擊 | 陸基' },
    { model: 'f5a', name: 'F-5A 自由鬥士戰鬥機隊', count: 4, cost: 190, badge: '「Skoshi Tiger」', desc: '1965 年起在越南實戰測試的輕型戰鬥機，後移交南越空軍。', statsDesc: '輕型戰鬥機 | 陸基' },
    { model: 'c130', name: 'C-130 大力士戰術運輸機', count: 2, cost: 230, badge: '傘降 · LAPES · 重裝空投', desc: '章克申城行動空投第173空降旅、溪山以 LAPES 低空空投補給；可載兩個傘兵排或一輛 M551。', statsDesc: '戰術運輸 | 陸基' },
    { model: 'f104g', name: 'F-104G 星式戰鬥機隊', count: 4, cost: 220, badge: '高速攔截', desc: '1965 年部署越南擔任護航與阻止米格機攔截 EC-121 預警機。', statsDesc: '攔截機 | 陸基' },
  ],
  era5: [
    { model: 'sh60b', name: 'SH-60B 海鷹 LAMPS III 反潛直升機', count: 2, cost: 240, badge: '艦載反潛 · 企鵝飛彈', desc: '派里級巡防艦與驅逐艦搭載的反潛反艦直升機，資料鏈與母艦共享目標。', statsDesc: '反潛/反艦 | 艦載' },
  ],
};

/** Carrier-only types: their reinforcements go straight to the flagship's deck. */
export const CARRIER_ONLY_AIR: ReadonlySet<string> = new Set(['tbf', 'os2u', 'sc1', 'f8f', 'a6b_weasel', 'e1', 's2', 'uh2', 'f4b', 'sh60b']);

export function withAircraftRequisitions(items: RequisitionItem[], era: Era): RequisitionItem[] {
  const cards = AIR_CARDS[era] ?? [];
  if (!cards.length) return items;
  const have = new Set(items.map((i) => i.typeTag));
  const extra: RequisitionItem[] = cards
    .filter((c) => !have.has(`air_${c.model}`))
    .map((c) => ({
      id: `req-air-${c.model}`,
      category: 'aircraft',
      era,
      name: `${c.name} (+${c.count}架)`,
      cost: c.cost,
      badge: c.badge,
      desc: c.desc,
      statsDesc: c.statsDesc,
      typeTag: `air_${c.model}`,
      airCount: c.count,
    }));
  const all = [...items];
  let at = -1;
  all.forEach((it, i) => {
    if (it.category === 'aircraft') at = i;
  });
  all.splice(at < 0 ? all.length : at + 1, 0, ...extra);
  return all;
}
