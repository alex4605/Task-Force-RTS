import { Era, InstallationType, Island, Vector2D } from '../types/game';

/**
 * Place names by theatre. Eras 3-5 share one continental layout (enemy in the north-east, the
 * allied base on the south-west coast, sea to the west), so the installations it builds carry
 * generic or Korean names; this table gives each theatre its own, in the right order from north
 * to south:
 *
 *   era3  North-east Korea, X Corps 1950: Kanggye – Chosin – Hamhung / Hungnam – Wonsan – Anbyon
 *         – Tongchon … Pohang – Daegu – Gyeongju (the far south compressed into the bottom edge).
 *   era4  Vietnam compressed north to south: Lang Son – Thai Nguyen – Hanoi / Red River – the DMZ
 *         on the Ben Hai – Quang Tri / Khe Sanh – Hue – Da Nang – Central Highlands – Saigon /
 *         Cu Chi – My Tho on the Mekong.
 *   era5  Schleswig-Holstein and the Elbe: Schleswig – Rendsburg on the Kiel Canal – Neumünster
 *         – Heide / Itzehoe – Elmshorn – the Elbe – Lüneburg Heath – Hannover – the Harz.
 */

type ColdWarEra = 'era3' | 'era4' | 'era5';
const isColdWar = (era: Era): era is ColdWarEra => era === 'era3' || era === 'era4' || era === 'era5';

/** Installation id → name, per theatre. Ids not listed keep their (already correct) names. */
const RENAME: Record<ColdWarEra, Record<string, string>> = {
  era3: {
    'player-afb-continental': '聯合國軍 前進野戰航空基地 (陸戰隊第1航空聯隊 / 美國遠東空軍第5航空軍)',
    'enemy-hq-continental': '朝鮮人民軍 / 中國人民志願軍 聯合前線地下要塞指揮所 [KPA–PVA Fortress HQ]',
    'enemy-afb-continental': '朝鮮人民軍空軍 前線野戰機場 (KPAF Forward Airfield)',
    'cont-route9-checkpoint': '元山—平壤 主補給路 公路檢查哨所 [MSR Checkpoint]',
    'neutral-east-delta-port': '東部山間火田民集落 [Eastern Hill Hamlet]',
    'opfor-se-estuary-watch': '東南河谷警戒瞭望哨 [SE Valley Watchtower]',
    'neutral-se-rice-hamlet': '東南部水田農村 [SE Paddy Hamlet]',
    'opfor-dune-dshk': '東南丘陵 DShK 12.7mm 重機槍伏擊陣地 [Hill AA Nest]',
    'cont-se-delta-ferry': '東南河谷裝甲渡河浮橋與艀船碼頭 [SE Valley Pontoon Ferry]',
    'neutral-nw-mountain-village': '北部高原火田民村落 [Highland Village]',
    'enemy-cont-s60-3': 'S-60 57mm 自動防空高射砲連 [Hamhung Plain AA]',
    'enemy-sontra-gun': 'B-13 130mm 沿海要塞重砲台 [西湖津 Sohojin Headland Battery]',
    'enemy-south-coastal': 'B-13 130mm 隱蔽岸防砲台 [注文津 Jumunjin Coastal Battery]',
    'cont-south-coastal-battery': '155mm 浦項海岸要塞重砲台 [Pohang Cape Battery]',
    'cont-east-underground-air-hangar': '太白山脈地下開鑿戰機洞庫掩體 [Taebaek Underground Air Facility]',
    'refugee-hungnam': '興南港聯合國戰地難民收容營 (UN Refugee Camp)',
    'enemy-fwd-cp-valley': '朝鮮人民軍前沿營級加固地下指揮所 [Valley CP Echo]',
  },
  era4: {
    'player-hq-continental': '美軍第3兩棲陸戰隊 (III MAF) 峴港前進指揮中心 [III MAF Da Nang HQ]',
    'player-cont-hospital': '美海軍 峴港海軍支援醫院 (NSA Hospital Da Nang)',
    'enemy-hq-continental': '越南人民軍 前線地下要塞指揮所 [PAVN Fortress HQ]',
    // Hue and its neighbourhood, between the DMZ and Da Nang
    'city-wonsan': '順化京城市區 (Huế Imperial City)',
    'city-hamhung': '東河市區 (Đông Hà)',
    'town-kowon': '海陵縣城 (Hải Lăng)',
    'town-anbyon': '富祿市鎮 (Phú Lộc)',
    'settlement-hungnam': '順安港漁村 (Thuận An)',
    'settlement-tongchon': '會安古鎮漁村 (Hội An)',
    'refugee-hungnam': '順化戰地難民收容營 (Huế Refugee Camp)',
    'neutral-town-hue': '香江沿岸金龍水鄉 (Kim Long)',
    'neutral-plantation-1': '香江上游法屬橡膠種植園 [French Rubber Estate]',
    'neutral-plantation-2': '溪山 法式咖啡種植園 [Khe Sanh Coffee Plantation]',
    'neutral-ferry-2': '香江渡口 [Perfume River Ferry]',
    'enemy-bunker-echo': '阿紹谷外圍鋼筋混凝土連鎖堡 [Bunker Echo - A Shau Valley]',
    'enemy-sontra-gun': 'SM-4-1 130mm 沿海要塞重砲台 [Cửa Tùng Headland Battery]',
    'enemy-south-coastal': 'B-13 130mm 隱蔽岸防砲台 [Batangan Peninsula Battery]',
    'enemy-cont-s60-3': 'S-60 57mm 自動防空高射砲連 [Cửa Tùng River Mouth AA]',
    'cont-route9-checkpoint': '9號公路十字路口檢查哨所 [Route 9 Checkpoint]',
    'neutral-east-delta-port': '長山 少數民族山寨 [Montagnard Village]',
    'opfor-se-estuary-watch': '東南河谷警戒瞭望哨 [SE Valley Watchtower]',
    'neutral-se-rice-hamlet': '東南部水稻農莊農舍群 [SE Rice Farm Hamlet]',
    'cont-se-delta-ferry': '東南水網渡河浮橋與艀船碼頭 [SE Pontoon Ferry]',
    'opfor-rail-freight-yard': '安員鐵路編組調度站 [Yên Viên Rail Yard]',
    'cont-south-city': '西貢—嘉定 都會區 [Saigon–Gia Định]',
    'cont-south-coastal-battery': 'B-13 130mm 頭頓海角地下岸防重砲堡 [Vũng Tàu Cape Battery]',
    // 1960s air defence and artillery at the allied bases
    'player-cont-flak-1': '美陸戰隊 M42 清道夫雙管40mm 自走防空砲連',
    'player-cont-flak-2': '美陸軍 M55 四聯裝 .50 機槍防空排 (Quad-50)',
    'friendly-base-flak-1': '友軍 M42 清道夫雙管40mm 自走防空砲連',
    'friendly-base-flak-2': '友軍 M55 四聯裝 .50 機槍防空排 (Quad-50)',
    'friendly-base-radar': '友軍 AN/TPS-43 遠程對空搜索雷達站',
  },
  era5: {
    'player-afb-continental': '阿爾霍恩北約前進作戰基地 (Ahlhorn FOL / 2ATAF)',
    'player-cont-hospital': '英國萊茵軍團 第22野戰醫院 (BAOR 22 Field Hospital)',
    'enemy-hq-continental': '蘇軍第2近衛坦克集團軍 前進指揮所 [2nd Guards Tank Army FHQ]',
    'enemy-afb-continental': '蘇軍第16空軍 前進野戰機場 [16th Air Army Forward Airfield]',
    // Schleswig-Holstein towns, north to south between the Kiel Canal and the Elbe
    'city-wonsan': '海德市區 (Heide, Dithmarschen)',
    'city-hamhung': '倫茨堡運河工業市 (Rendsburg)',
    'town-kowon': '諾托夫交通十字路口市鎮 (Nortorf)',
    'town-anbyon': '埃爾姆斯霍恩市鎮 (Elmshorn)',
    'settlement-hungnam': '比蘇姆漁港 (Büsum)',
    'settlement-tongchon': '馬爾訥沿海村落 (Marne)',
    'refugee-hungnam': '德國紅十字會 (DRK) 難民收容營 (Heide)',
    'neutral-town-quangtri': '諾伊明斯特交通十字路口重鎮 [Neumünster]',
    'neutral-town-hue': '伊策霍 斯托爾河畔工業市鎮 [Itzehoe]',
    'neutral-plantation-1': '萊夫艾森農業合作社糧倉 [Raiffeisen Granary]',
    'neutral-ferry-1': '基爾運河 倫茨堡渡輪碼頭 [Rendsburg Canal Ferry]',
    'neutral-radio-1': '北德平原微波通信中繼鐵塔 [Relay Tower]',
    'enemy-bunker-bravo': '呂貝克走廊咽喉加固堡壘 [Lübeck Corridor Strongpoint]',
    'enemy-sontra-gun': 'SM-4-1 130mm 沿海要塞重砲台 [Büsum Headland Battery]',
    'enemy-south-coastal': 'B-13 130mm 隱蔽岸防砲台 [Elbe Mouth Coastal Battery]',
    'enemy-cont-s60-3': 'S-60 57mm 自動防空高射砲連 [Eider Mouth AA]',
    'cont-route9-checkpoint': 'A7 高速公路交流道檢查哨所 [A7 Autobahn Checkpoint]',
    'cont-hydroelectric-dam': '易北河水閘與抽水站機房 [Elbe Barrage Station]',
    'cont-buddhist-pagoda': '鄉間古老教堂與修道院 [Village Church & Abbey]',
    'opfor-nw-acoustic-post': '西北沿海對空雷達與防空觀測哨 [NW Coast Radar Post]',
    'opfor-nw-workshop-tunnel': '西北森林隱蔽修配廠與裝甲整備場 [NW Forest Workshop]',
    'opfor-upper-s60-flak': 'ZSU-23-4 石勒喀河 自走防空砲陣地 [NW Valley AA]',
    'opfor-nw-ridge-bunker': '西北冰磧丘制高點機槍加固掩體 [NW Moraine Bunker]',
    'neutral-nw-mountain-village': '安格恩丘陵農村 [Angeln Village]',
    'opfor-rail-freight-yard': '華約戰略鐵路編組調度站與重裝甲集結場 [Rail Logistics Yard]',
    'neutral-east-delta-port': '東部內德邊界村莊 [Inner-German Border Village]',
    'opfor-se-estuary-watch': '東南河谷警戒瞭望哨 [SE Valley Watchtower]',
    'neutral-se-rice-hamlet': '易北河沼澤農莊 [Elbmarsch Farmstead]',
    'opfor-dune-dshk': 'ZU-23-2 雙聯23mm防空機砲伏擊陣地 [Moraine AA Nest]',
    'cont-se-delta-ferry': '易北河支流舟橋渡口 [SE Pontoon Ferry]',
    'cont-north-coastal-battery': 'B-13 130mm 胡蘇姆北部要塞重砲台 [Husum Coastal Fort]',
    'cont-north-patrol-pier': '胡蘇姆港 飛彈快艇隱蔽整備碼頭 [Husum FAC Pier]',
    'cont-north-valley-fortress': '丹麥牆古壘地下永備碉堡群 [Danewerk Bunker Complex]',
    'cont-north-sa2-echo': 'S-75M3 伏爾霍夫 (SA-2E) 地空飛彈營 [SAM Echo]',
    'cont-north-ammo-depot': '弗倫斯堡地下戰略軍火儲備總庫 [Flensburg Arsenal]',
    'cont-north-town': '什勒斯維希古城 [Schleswig]',
    'cont-south-coastal-battery': 'B-13 130mm 威悉河口海防要塞砲台 [Weser Estuary Battery]',
    'cont-south-bunker-complex': '呂訥堡荒原反斜面堅固碉堡群 [Lüneburg Heath Bunker Line]',
    'cont-south-sam-site': 'S-75M3 伏爾霍夫 (SA-2E) 地空飛彈營 [SAM Foxtrot]',
    'cont-south-fob': '英國萊茵軍團 前進砲兵與野戰醫院樞紐 [BAOR Forward Hub]',
    'cont-south-hawk-site': 'MIM-23B 改良鷹式防空飛彈連 [I-Hawk Battery]',
    'cont-south-city': '漢諾威市區 [City of Hannover]',
    'cont-south-town': '策勒古城 [Celle]',
    'cont-south-trail-hub': '蘇軍前進物資集結與油料總庫 [Forward Supply Hub]',
    'cont-east-underground-air-hangar': '華約加固戰機掩體群 [Hardened Aircraft Shelters]',
    'cont-east-theatre-hq': '華約西方戰區 前敵地下總指揮中心 [Western TVD Forward HQ]',
    'cont-east-trail-depot': '東線機械化輜重基地 [Eastern Mechanised Convoy Base]',
    'enemy-fwd-cp-valley': '蘇軍摩托化步兵團 前沿加固地下指揮所 [Valley CP Echo]',
    // 1980s air defence and artillery at the allied bases
    'player-cont-flak-1': '西德陸軍 獵豹 (Gepard) 35mm 自走防空砲連',
    'player-cont-flak-2': '美陸軍 M163 火神 20mm 自走防空砲排',
    'player-cont-flak-3': '荷蘭陸軍 PRTL 35mm 自走防空砲連',
    'player-cont-arty-1': '美陸軍 M109A3 155mm 自走榴彈砲連',
    'player-cont-arty-2': '美陸軍 M110A2 203mm 自走榴彈砲連',
    'friendly-base-flak-1': '荷蘭空軍 L/70 40mm 防空砲連 (Flycatcher 火控)',
    'friendly-base-flak-2': '荷蘭陸軍 PRTL 35mm 自走防空砲連',
    'friendly-base-radar': '友軍 AN/TPS-43 遠程對空搜索雷達站',
  },
};

/** The rear staging island in the south-west, per theatre. */
export const STAGING_BASE: Record<Era, { island: string; airfield: string }> = {
  era1: { island: 'Espiritu Santo Staging Base (聖埃斯皮里圖 友軍前線後勤與空軍基地)', airfield: '友軍前進航空基地 (Espiritu Santo Bomber Field No.1)' },
  era2: { island: 'Espiritu Santo Staging Base (聖埃斯皮里圖 友軍前線後勤與空軍基地)', airfield: '友軍前進航空基地 (Espiritu Santo Pekoe Field)' },
  era3: { island: 'Koje-do Staging Base (巨濟島 聯合國軍後勤基地)', airfield: '巨濟島 前進航空基地 (Koje-do Airstrip)' },
  era4: { island: 'Côn Sơn Staging Base (昆山島 友軍後勤基地)', airfield: '昆山島 前進航空基地 (Côn Sơn Airstrip)' },
  era5: { island: 'Texel Staging Base (泰瑟爾島 北約後勤基地)', airfield: '泰瑟爾 前進航空基地 (De Cocksdorp)' },
};

/** The two offshore islands of the Cold War map: [south-west (y≈8600), north-west (y≈5200)]. */
export const OUTER_ISLANDS: Record<ColdWarEra, [{ name: string; peak: string }, { name: string; peak: string }]> = {
  era3: [
    { name: 'Wonsan Outer Bastion (元山外海要塞屏障島)', peak: '元山外海要塞島 主峰觀測所 [Outer Bastion Peak 195m]' },
    { name: 'Yo-do Radar Outpost (麗島雷達前哨島)', peak: '麗島 雷達觀測哨 [Yo-do Peak]' },
  ],
  era4: [
    { name: 'Cu Lao Cham (占婆島 海防雷達前哨島)', peak: '占婆島 Hòn Lao 頂峰雷達崖 [Hòn Lao]' },
    { name: 'Con Co Island (Cồn Cỏ 島 要塞飛彈陣地)', peak: 'Cồn Cỏ 島 觀測哨 [Cồn Cỏ Peak]' },
  ],
  era5: [
    { name: 'Helgoland Bastion (黑爾戈蘭島 要塞屏障島)', peak: '黑爾戈蘭 上城紅岩崖雷達站 [Oberland]' },
    { name: 'Sylt Radar Outpost (敘爾特島 雷達前哨島)', peak: '敘爾特島 Uwe 沙丘雷達站 [Uwe-Düne]' },
  ],
};

/** Gives the Cold War mainland's installations their theatre's names. */
export function applyEraPlaceNames(era: Era, islands: Island[]): void {
  if (!isColdWar(era)) return;
  const table = RENAME[era];
  for (const isl of islands) for (const inst of isl.installations) if (table[inst.id]) inst.name = table[inst.id];
}

/**
 * Names for civilian places that are placed by the terrain (stations, hospitals, wharves),
 * chosen by how far south they lie so the order matches the real map.
 * Bands are [upper y bound, name]; a name already used falls through to the next band.
 */
const BANDS: Record<ColdWarEra, Record<'station' | 'hospital' | 'wharf' | 'airport', [number, string][]>> = {
  era3: {
    station: [[5000, '(原)咸鏡線 咸興驛'], [6000, '(原)咸鏡線 興南驛'], [7000, '(原)咸鏡線 元山驛'], [8000, '(原)東海北部線 安邊驛'], [9500, '(原)東海北部線 通川驛'], [Infinity, '(原)京釜線 大邱驛']],
    hospital: [[9000, '(中立) 咸鏡南道立 元山病院'], [Infinity, '(中立) 大邱 東山基督病院 (Dongsan)']],
    wharf: [[5000, '(中立) 西湖津 漁港 (Sohojin)'], [6200, '(中立) 興南 漁港 (Hŭngnam)'], [7500, '(中立) 元山 漁港 (Wŏnsan)'], [9500, '(中立) 長箭 漁港 (Changjŏn)'], [Infinity, '(中立) 浦項 漁港 (Pohang)']],
    airport: [[Infinity, '(原)元山 葛麻飛行場 (Kalma)']],
  },
  era4: {
    station: [[3800, '(原)河內—海防線 海陽站'], [4400, '(原)統一鐵路 寧平站'], [5600, '(原)統一鐵路 東河站'], [7000, '(原)統一鐵路 順化站'], [9500, '(原)統一鐵路 峴港站'], [Infinity, '(原)西貢—美萩線 美萩站']],
    hospital: [[4200, '(中立) 河內 白梅醫院 (Bạch Mai)'], [7200, '(中立) 順化中央醫院 (Huế Central)'], [9500, '(中立) 峴港 省立醫院'], [Infinity, '(中立) 西貢 鵝邑醫院 (Hôpital Grall)']],
    wharf: [[4200, '(中立) 海防 漁港 (Hải Phòng)'], [7000, '(中立) 順安 漁港 (Thuận An)'], [9500, '(中立) 峴港 漁港 (Đà Nẵng)'], [Infinity, '(中立) 頭頓 漁港 (Vũng Tàu)']],
    airport: [[4200, '(原)嘉林機場 (Gia Lâm)'], [9500, '(原)富牌機場 (Phú Bài)'], [Infinity, '(原)新山一民用機場 (Tân Sơn Nhất)']],
  },
  era5: {
    station: [[5000, '(原)DB 倫茨堡站 (Rendsburg)'], [7000, '(原)DB 伊策霍站 (Itzehoe)'], [9500, '(原)DB 埃爾姆斯霍恩站 (Elmshorn)'], [11500, '(原)DB 呂訥堡站 (Lüneburg)'], [Infinity, '(原)DB 漢諾威總站 (Hannover Hbf)']],
    hospital: [[8000, '(中立) 西海岸醫院 (Westküstenklinikum Heide)'], [9800, '(中立) 漢堡大學附設醫院 (UKE)'], [Infinity, '(中立) 漢諾威醫學院附設醫院 (MHH)']],
    wharf: [[5000, '(中立) 胡蘇姆 漁港 (Husum)'], [8500, '(中立) 比蘇姆 漁港 (Büsum)'], [Infinity, '(中立) 庫克斯港 漁港 (Cuxhaven)']],
    airport: [[9800, '(原)漢堡-富爾斯比特爾機場 (Hamburg-Fuhlsbüttel)'], [Infinity, '(原)漢諾威-朗根哈根機場 (Hannover-Langenhagen)']],
  },
};

export function placeNameByLatitude(era: Era, kind: 'station' | 'hospital' | 'wharf' | 'airport', pos: Vector2D, used: Set<string>): string | undefined {
  if (!isColdWar(era)) return undefined;
  const bands = BANDS[era][kind];
  const start = bands.findIndex(([maxY]) => pos.y < maxY);
  for (let k = 0; k < bands.length; k++) {
    // Prefer the band itself, then its southern neighbours, then the northern ones
    const i = k < bands.length - start ? start + k : bands.length - 1 - k;
    const name = bands[i]?.[1];
    if (name && !used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return undefined;
}

// ── Era equipment ────────────────────────────────────────────────────────────

/**
 * Equipment corrections per era for installations the shared generators build: a 1950 Korean
 * coast has no SAMs or P-12 radars, a 1983 Soviet island garrison no Type 88 AA guns and Type 38
 * rifles, and a Vietnam base no 1944 SCR-584 fire control. Each entry matches installation ids;
 * `name` may rewrite the old name, `type` turns an anachronistic SAM site into a gun battery.
 */
interface EquipmentFix {
  id: RegExp;
  name?: string | ((old: string) => string);
  desc?: string;
  type?: InstallationType;
  range?: number;
  reloadTime?: number;
}

const keepLabel = (label: string) => (old: string) => {
  const tag = old.match(/\[[^\]]+\]$/)?.[0];
  return tag ? `${label} ${tag}` : label;
};

const ISLAND = '^island-[a-z]+-';
const COLD_WAR_SAM: InstallationType[] = ['sa2_sam_site', 'sa3_sam_site', 's300_sam_site'];

const EQUIPMENT: Partial<Record<Era, EquipmentFix[]>> = {
  era1: [
    // 1942: 90mm M1 guns laid by SCR-268; no SCR-584 or VT fuzes until 1943-44
    { id: /^friendly-base-flak-1$/, name: '友軍重型高射砲第1連 (90mm M1 高射砲)', desc: 'SCR-268 雷達射控 90mm 高射砲 · 定時引信彈幕' },
  ],
  era3: [
    { id: new RegExp(`${ISLAND}sh1-artillery$`), name: '野戰重型砲兵陣地 (M-30 122mm 榴彈砲)', desc: 'M-30 122mm 牽引榴彈砲 · 壓制登陸舟艇與灘頭' },
    { id: new RegExp(`${ISLAND}radar$`), name: 'P-3 (RUS-2) 早期警戒雷達站', desc: '米波早期警戒雷達 · 探測來襲機群並引導 MiG-15 攔截' },
    { id: new RegExp(`${ISLAND}sh1-coastal-gun$`), name: '岸防砲台 (B-13 130mm 岸防加農砲)', desc: 'B-13 130mm 岸防加農砲 · 封鎖近海航道' },
    { id: new RegExp(`${ISLAND}sh1-coastal-gun-2$`), name: '側翼岸防砲台 (BS-3 100mm 野戰加農砲)', desc: 'BS-3 100mm 加農砲 · 隱蔽射口壓制近岸登陸艇' },
    { id: new RegExp(`${ISLAND}sh2-coastal-gun$`), name: '島心高地岸防重砲 (ML-20 152mm 加農榴彈砲)', desc: 'ML-20 152mm 加農榴彈砲 · 制高點長程壓制' },
    { id: new RegExp(`${ISLAND}sh3-coastal-gun$`), name: '港灣入口岸防砲台 (B-13 130mm 岸防加農砲)', desc: 'B-13 130mm 岸防加農砲 · 封鎖深水航道' },
    { id: new RegExp(`${ISLAND}sh1-flak$`), name: '高射砲連 (KS-12 85mm 高射砲)', desc: 'KS-12 85mm 高射砲 · PUAZO-6 射控指揮儀' },
    { id: new RegExp(`${ISLAND}sh3-flak$`), name: '港灣防空砲連 (61-K 37mm 自動高射砲)', desc: '61-K 37mm 自動高射砲 · 攔截低空攻擊機' },
    // Soviet 57mm S-60 and SON-9 only reached service as the war ended: 37mm 61-K and SON-4 instead
    {
      id: /^(enemy-cont-s60-\d|opfor-upper-s60-flak|cont-north-flak-s60|enemy-cont-s60-3|enemy-shilka-2)$/,
      name: keepLabel('61-K 37mm 自動高射砲連'),
      desc: '61-K 37mm 自動高射砲 · 攔截低空攻擊機與俯衝轟炸機',
    },
    { id: /KS-19|ks19/, name: (o) => o.replace('SON-9', 'SON-4'), desc: 'KS-19 100mm 重型高射砲 · SON-4 雷達射控' },
    { id: /^opfor-p12-radar$|^opfor-p14-radar$|^cont-north-deep-p14$|^cont-south-deep-radar$|^opfor-prv11-height-finder$/, name: keepLabel('P-3 (RUS-2) 米波早期警戒雷達站'), desc: '米波早期警戒雷達 · 為 MiG-15 攔截與高射砲提供空情' },
    { id: /^cont-north-coast-radar$/, name: 'P-3 (RUS-2) 北方海防搜索雷達警戒哨 [North Shore Radar]' },
    { id: /^player-long-tom-175$/, name: '美陸軍 M115 203mm (8吋) 重榴彈砲連 [Heavy Battery]', desc: '8吋重榴彈砲 · 壓制敵方後方砲兵陣地與暗堡群' },
    { id: /^opfor-rail-freight-yard$/, desc: '北部軍事鐵道幹線終點樞紐 · 吊運 T-34/85 戰車與蘇製軍火彈藥' },
    { id: /^(opfor-ne-coastal-casemate|enemy-sontra-gun)$/, desc: '懸崖花崗岩半地下重型岸防砲 · 封鎖外海深水航道' },
    { id: /^opfor-p12-radar$/, desc: '沿海米波預警雷達 · 監控低空海面空情' },
    { id: /^player-sam-hawk-2$/, name: '美陸軍 90mm M2 高射砲連 [AAA Battery Bravo]', desc: 'SCR-584 雷達射控 90mm 高射砲 · 攔截來襲敵機', type: 'flak_battery', range: 1400, reloadTime: 1.6 },
    { id: /^cont-south-hawk-site$/, desc: '雙管40mm機動高射砲 · 掩護南部走廊', type: 'flak_battery', range: 1100, reloadTime: 1.0 },
    { id: /^cont-east-underground-air-hangar$/, desc: '天然花崗岩洞穴防空機庫 · 敵方後備 MiG-15 與整備槽' },
    { id: /^cont-east-missile-depot$/, desc: '鑿入花崗岩山體的地下重彈藥儲備庫' },
  ],
  era4: [
    { id: new RegExp(`${ISLAND}sh3-flak$`), name: '港口防空砲哨 (61-K 37mm 高射砲)', desc: '61-K 37mm 自動高射砲 · 攔截低空攻擊機' },
    { id: /^cont-north-coast-radar$/, name: 'P-15 (Flat Face) 北方海防低空搜索雷達哨 [North Shore Radar]' },
    { id: /^enemy-cont-radar$/, desc: '大型全方位預警雷達天線 · 引導 MiG-21 攔截' },
    { id: /^cont-south-shore-radar$/, name: 'AN/TPS-43 南部沿海對空對海警戒雷達站 [South Shore Radar Picket]' },
    { id: /^player-coastal-radar-picket$/, name: '美海軍陸戰隊 AN/TPS-22 沿海警戒雷達哨 [Coastal Radar Picket]' },
    { id: /^(player-cont-flak-1|friendly-base-flak-1)$/, desc: '雙管40mm自走防空砲 · 掩護基地與車隊' },
    { id: /^(player-cont-flak-2|friendly-base-flak-2)$/, desc: '四聯裝 .50 重機槍 · 低空密集彈幕' },
    { id: /^friendly-base-heavy-240-1$/, name: '友軍 M107 175mm 自走加農砲連', desc: 'M107 175mm 長射程加農砲 · 跨海峽遠程砲擊' },
    { id: /^friendly-base-coastal-1$/, name: '友軍 M110 203mm 自走榴彈砲連', desc: '8吋自走榴彈砲 · 封鎖港灣水道與反登陸火力' },
    { id: /^friendly-base-artillery-1$/, name: '友軍野戰砲兵連 (M114 155mm / M101 105mm 榴彈砲)' },
    { id: /^friendly-base-repair-dock-1$/, name: '友軍海軍第1浮動修船塢 (AFDM 中型浮塢)' },
  ],
  era5: [
    // Island garrisons of the Soviet Naval Infantry
    { id: new RegExp(`${ISLAND}sh1-cp$`), name: (o) => o.replace('灘頭木石野戰指揮掩體', '海岸加固防爆指揮所'), desc: '鋼筋混凝土覆土指揮所 · 有線電與無線電通信樞紐' },
    { id: new RegExp(`${ISLAND}sh2-cp$`), name: (o) => o.replace('高地守備指揮部', '高地加固指揮部'), desc: '加固混凝土指揮所 · 島嶼守備部隊指揮中樞' },
    { id: new RegExp(`${ISLAND}sh3-cp$`), desc: '加固海防指揮所 · 守備港口防禦' },
    { id: new RegExp(`${ISLAND}sh1-coastal-gun$`), name: '岸防砲台 (SM-4-1 130mm 岸防加農砲)', desc: 'SM-4-1 130mm 雙聯長管岸防砲 · 雷達與光學雙模射控' },
    { id: new RegExp(`${ISLAND}sh1-coastal-gun-2$`), name: '側翼岸防砲台 (MT-12 100mm 加農砲)', desc: 'MT-12 100mm 滑膛加農砲 · 隱蔽射口壓制近岸登陸艇' },
    { id: new RegExp(`${ISLAND}sh2-coastal-gun$`), name: '高地岸防砲台 (M-46 130mm 加農砲)', desc: 'M-46 130mm 長管加農砲 · 制高點封鎖水道' },
    { id: new RegExp(`${ISLAND}sh3-coastal-gun$`), name: '港口入口岸防砲台 (M-46 130mm 加農砲)', desc: 'M-46 130mm 加農砲 · 防衛港口航道入口' },
    { id: new RegExp(`${ISLAND}sh1-flak$`), name: '防空砲排 (ZSU-23-4 石勒喀河)', desc: 'RPK-2 雷達射控四管 23mm 自走防空砲 · 攔截低空攻擊機與直升機' },
    { id: new RegExp(`${ISLAND}sh1-flak-2$`), name: '防空機砲排 (ZU-23-2 雙聯 23mm)', desc: '雙聯 23mm 機砲 · 低空密集彈幕' },
    { id: new RegExp(`${ISLAND}sh2-flak$`), name: '高地防空砲連 (ZSU-23-4 石勒喀河)', desc: 'RPK-2 雷達射控四管 23mm 自走防空砲' },
    { id: new RegExp(`${ISLAND}sh3-flak$`), name: '港口防空砲排 (ZU-23-2 雙聯 23mm)', desc: '雙聯 23mm 機砲 · 防衛港口上空' },
    { id: new RegExp(`${ISLAND}sh1-squad-\\d$`), name: (o) => o.replace(/\(.*\)$/, '(AK-74 / PKM / RPG-7)'), desc: 'AK-74 突擊步槍、PKM 機槍與 RPG-7 火箭筒 · 混凝土掩體' },
    { id: new RegExp(`${ISLAND}sh1-artillery$`), desc: 'D-30 122mm 牽引榴彈砲 · 360° 環射壓制登陸舟艇' },
    { id: new RegExp(`${ISLAND}sh2-tank-bn$`), desc: '125mm 滑膛砲與 BMP-2 30mm 機砲掩體 · 反擊登陸部隊' },
    { id: new RegExp(`${ISLAND}radar$`), name: 'P-15M (Squat Eye) 低空搜索雷達站', desc: '低空與海面目標搜索 · 為防空與岸防部隊提供目標指示' },
    { id: new RegExp(`${ISLAND}depot$`), name: '加固掩蔽油彈庫 (物資儲備)', desc: '加固掩蔽所 · 油料與彈藥儲備' },
    // Soviet front: 1980s air defence and artillery
    { id: /^enemy-cont-ks19-1$/, name: '2K22 通古斯卡彈砲合一防空連 (第1連)', desc: '雙聯 30mm 機砲 + 9M311 防空飛彈 · 雷達射控' },
    { id: /^enemy-cont-ks19-2$/, name: '2K22 通古斯卡彈砲合一防空連 (要塞核心)', desc: '雙聯 30mm 機砲 + 9M311 防空飛彈 · 雷達射控' },
    { id: /^(enemy-cont-ks19-3|enemy-cont-s60-\d|cont-north-flak-s60)$/, name: keepLabel('ZSU-23-4 石勒喀河 自走防空砲連'), desc: 'RPK-2 雷達射控四管 23mm · 攔截低空攻擊機與直升機' },
    { id: /^enemy-cont-arty-1$/, name: '2S3 阿卡齊亞 152mm 自走榴彈砲連 (前沿砲兵陣地)', desc: '152mm 自走榴彈砲 · 壓制北約進攻矛頭' },
    { id: /^enemy-cont-arty-2$/, name: '2A65 姆斯塔-B 152mm 牽引榴彈砲連 (縱深火網)', desc: '152mm 牽引榴彈砲 · 覆蓋戰線中央交通要道' },
    { id: /^opfor-ml20-heavy-arty$/, name: '2A36 風信子-B 152mm 加農砲 [152mm Heavy Battery]', desc: '152mm 長管加農砲 · 極遠射程反制登陸灘頭' },
    { id: /^enemy-cont-radar$/, name: 'P-37 (Bar Lock) 遠程對空預警雷達站', desc: '大型全方位預警雷達 · 引導 MiG-29 與 Su-27 攔截' },
    { id: /^enemy-afb-continental$/, desc: '混凝土跑道與加固機堡 · MiG-29、Su-24 與 Su-25 前進作戰基地' },
    { id: /^cont-north-coast-radar$/, name: 'P-15M (Squat Eye) 北方海防低空搜索雷達哨 [North Shore Radar]' },
    { id: /^cont-south-shore-radar$/, name: 'AN/TPS-63 南部沿海對海警戒雷達站 [South Shore Radar Picket]' },
    { id: /^player-coastal-radar-picket$/, name: '美海軍陸戰隊 AN/TPS-63 沿海警戒雷達哨 [Coastal Radar Picket]' },
    { id: /^player-long-tom-175$/, name: '美陸軍 M270 多管火箭系統連 [MLRS Battery]', desc: '227mm 多管火箭 · 壓制敵方後方砲兵陣地與集結區' },
    { id: /^player-sam-hawk-2$/, desc: '前進防空連 · 攔截低空突破之敵機' },
    { id: /^opfor-rail-freight-yard$/, desc: '軍事鐵道幹線終點樞紐 · 吊運 T-80 戰車與軍火彈藥' },
    { id: /^(opfor-ne-coastal-casemate|enemy-sontra-gun)$/, desc: '海岸半地下重型岸防砲 · 封鎖外海深水航道' },
    { id: /^opfor-p12-radar$/, desc: '沿海米波預警雷達 · 監控低空海面空情' },
    { id: /^town-anbyon$/, desc: '平原交通市鎮 · 紅磚街區 · 提供城鎮戰掩體' },
    { id: /^neutral-se-rice-hamlet$/, desc: '易北河沼澤低地農莊 · 農業平民區 · 誤擊扣政治值' },
    { id: /^neutral-east-delta-port$/, desc: '內德邊界農村 · 平民居住聚落' },
    { id: /^cont-buddhist-pagoda$/, desc: '石砌教堂與修道院 · 受保護文化設施 · 嚴禁砲擊 · 誤擊扣政治值' },
    { id: /^neutral-nw-mountain-village$/, desc: '丘陵田園聚落 · 屬中立平民安全保護區' },
    { id: /^opfor-nw-acoustic-post$/, desc: '沿海高處雷達監控陣列 · 監控超低空突防戰機' },
    { id: /^cont-east-trail-depot$/, desc: '森林掩蔽卡車整備場 · 東線後勤補給樞紐' },
    { id: /^(player-cont-flak-1|friendly-base-flak-1)$/, desc: '雷達射控速射防空砲 · 攔截低空攻擊機與直升機' },
    { id: /^(player-cont-flak-[23]|friendly-base-flak-2)$/, desc: '機動速射防空砲 · 伴隨掩護指揮所與車隊' },
    { id: /^player-cont-arty-1$/, desc: '155mm 自走榴彈砲 · 壓制敵軍裝甲突擊' },
    { id: /^player-cont-arty-2$/, desc: '203mm 自走榴彈砲 · 縱深打擊與反砲兵' },
    { id: /^friendly-base-heavy-240-1$/, name: '友軍 M110A2 203mm 自走榴彈砲連', desc: '8吋自走榴彈砲 · 跨海峽遠程砲擊' },
    { id: /^friendly-base-coastal-1$/, name: '友軍 FH70 155mm 牽引榴彈砲連', desc: '英德合作 155mm 榴彈砲 · 封鎖港灣水道與反登陸火力' },
    { id: /^friendly-base-cp$/, name: '美國陸戰隊第4陸戰遠征旅 前進指揮所 (4th MAB CP)' },
    { id: /^friendly-base-repair-dock-1$/, name: '友軍海軍第1浮動修船塢 (USS Los Alamos AFDB-7)' },
  ],
};

/** Applies the era's equipment corrections; anachronistic SAM sites of 1950 become gun batteries. */
export function applyEraEquipment(era: Era, islands: Island[]): void {
  const fixes = EQUIPMENT[era] ?? [];
  for (const isl of islands) {
    for (const inst of isl.installations) {
      if (era === 'era3' && COLD_WAR_SAM.includes(inst.type)) {
        inst.type = 'flak_battery';
        inst.range = 1500;
        inst.reloadTime = 1.5;
        if (!/KS-19|37mm/.test(inst.name)) inst.name = keepLabel('KS-19 100mm 重型高射砲連')(inst.name);
        inst.weaponDesc = 'KS-19 100mm 重型高射砲 · SON-4 雷達射控';
      }
      if (era === 'era3' && inst.type === 'fan_song_radar') inst.type = 'radar_station';
      for (const f of fixes) {
        if (!f.id.test(inst.id) && !(f.id.source.includes('KS-19') && f.id.test(inst.name))) continue;
        if (f.name) inst.name = typeof f.name === 'string' ? f.name : f.name(inst.name);
        if (f.desc) inst.weaponDesc = f.desc;
        if (f.type) inst.type = f.type;
        if (f.range !== undefined) inst.range = f.range;
        if (f.reloadTime !== undefined) inst.reloadTime = f.reloadTime;
      }
    }
  }
}
