import { Era, Ship } from '../types/game';

/** One ship of an allied Surface Action Group, before it is instantiated by the engine. */
export type AlliedSagShipDef = {
  name: string;
  codeName: string;
  type: Ship['type'];
  length: number;
  width: number;
  maxHealth: number;
  speed: number;
  flakRange: number;
  turrets: Array<{
    id?: string;
    pos?: { x: number; y: number };
    relX?: number;
    relY?: number;
    angle: number;
    range: number;
    damage: number;
    cooldown: number;
    maxCooldown?: number;
    reloadTime?: number;
    barrelCount?: number;
    caliber: string;
  }>;
  hasSAM?: boolean;
  samRange?: number;
  samModel?: string;
  hasHarpoon?: boolean;
  ashmType?: 'harpoon' | 'exocet_mm40' | 'exocet_mm38';
  hasCIWS?: boolean;
  hasASROC?: boolean;
  hasModernNavalGunAA?: boolean;
  torpedoCooldown?: number;
};

export interface AlliedSagFleet {
  title: string;
  ships: AlliedSagShipDef[];
}

/** Gun mount: [relX, relY, calibre label, range, damage, reload seconds]. Mounts aft of amidships train aft. */
type Mount = [number, number, string, number, number, number];

/** Compact ship definition: hull data plus a list of mounts. */
function sagShip(base: Omit<AlliedSagShipDef, 'turrets'>, idPrefix: string, mounts: Mount[]): AlliedSagShipDef {
  return {
    ...base,
    turrets: mounts.map(([x, y, caliber, range, damage, reload], i) => ({
      id: `${idPrefix}-${i}`,
      pos: { x, y },
      angle: x < 0 ? Math.PI : 0,
      range,
      damage,
      cooldown: 0,
      maxCooldown: reload,
      caliber,
    })),
  };
}

const COUNTY_8IN: Mount[] = [
  [36, 0, '8吋 Mk VIII 雙聯裝 (A砲塔)', 2300, 620, 5.2],
  [24, 0, '8吋 Mk VIII 雙聯裝 (B砲塔)', 2300, 620, 5.2],
  [-24, 0, '8吋 Mk VIII 雙聯裝 (X砲塔)', 2300, 620, 5.2],
  [-36, 0, '8吋 Mk VIII 雙聯裝 (Y砲塔)', 2300, 620, 5.2],
  [0, -9, '4吋 Mk XVI 雙聯裝高平砲', 1500, 220, 2.2],
  [0, 9, '4吋 Mk XVI 雙聯裝高平砲', 1500, 220, 2.2],
];
const TRIBAL_DD: Mount[] = [
  [22, 0, '4.7吋 Mk XII 雙聯裝 (A砲塔)', 1600, 340, 2.8],
  [12, 0, '4.7吋 Mk XII 雙聯裝 (B砲塔)', 1600, 340, 2.8],
  [-18, 0, '4.7吋 Mk XII 雙聯裝 (X砲塔)', 1600, 340, 2.8],
  [-26, 0, '4吋 Mk XVI 雙聯裝高平砲 (Y砲塔)', 1500, 220, 2.2],
];

/**
 * Additional historical task groups per era, picked at random alongside the original one:
 * Australian, British Pacific Fleet, Commonwealth / ROK, RAN gunline and NATO groups.
 */
const EXTRA_SAG_FLEETS: Record<Era, AlliedSagFleet[]> = {
  era1: [
    {
      title: '澳美聯合第44特遣艦隊 (Task Force 44 · 瓜達爾卡納爾 1942)',
      ships: [
        sagShip({ name: 'HMAS Australia (澳大利亞號重巡洋艦)', codeName: 'HMAS Australia (D84)', type: 'cruiser', length: 112, width: 21, maxHealth: 9800, speed: 20, flakRange: 1300 }, 'ran-aus', COUNTY_8IN),
        sagShip({ name: 'HMAS Canberra (坎培拉號重巡洋艦)', codeName: 'HMAS Canberra (D33)', type: 'cruiser', length: 112, width: 21, maxHealth: 9600, speed: 20, flakRange: 1300 }, 'ran-can', COUNTY_8IN),
        sagShip({ name: 'HMAS Hobart (荷巴特號輕巡洋艦)', codeName: 'HMAS Hobart (D63)', type: 'cruiser', length: 98, width: 17, maxHealth: 7600, speed: 22, flakRange: 1200 }, 'ran-hob', [
          [30, 0, '6吋 Mk XXIII 雙聯裝 (A砲塔)', 2000, 480, 4.0], [18, 0, '6吋 Mk XXIII 雙聯裝 (B砲塔)', 2000, 480, 4.0],
          [-18, 0, '6吋 Mk XXIII 雙聯裝 (X砲塔)', 2000, 480, 4.0], [-30, 0, '6吋 Mk XXIII 雙聯裝 (Y砲塔)', 2000, 480, 4.0],
        ]),
        sagShip({ name: 'HMAS Arunta (阿倫塔號部族級驅逐艦)', codeName: 'HMAS Arunta (I30)', type: 'destroyer', length: 72, width: 13, maxHealth: 4600, speed: 26, flakRange: 1100, torpedoCooldown: 22 }, 'ran-aru', TRIBAL_DD),
      ],
    },
  ],
  era2: [
    {
      title: '英國太平洋艦隊 第1戰列中隊與第4巡洋艦中隊 (BPF · 沖繩 冰山行動 1945)',
      ships: [
        sagShip({ name: 'HMS Howe (豪號戰艦)', codeName: 'HMS Howe (32)', type: 'battleship', length: 128, width: 29, maxHealth: 15800, speed: 18, flakRange: 1400, hasModernNavalGunAA: true }, 'bpf-howe', [
          [40, 0, '14吋 Mk VII 四聯裝 (A砲塔)', 2600, 900, 6.5], [26, 0, '14吋 Mk VII 雙聯裝 (B砲塔)', 2600, 900, 6.5],
          [-36, 0, '14吋 Mk VII 四聯裝 (Y砲塔)', 2600, 900, 6.5], [6, -11, '5.25吋 Mk I 雙聯裝高平砲', 1600, 300, 2.6], [6, 11, '5.25吋 Mk I 雙聯裝高平砲', 1600, 300, 2.6],
        ]),
        sagShip({ name: 'HMS Swiftsure (迅捷號輕巡洋艦)', codeName: 'HMS Swiftsure (08)', type: 'cruiser', length: 100, width: 18, maxHealth: 8000, speed: 22, flakRange: 1300, hasModernNavalGunAA: true }, 'bpf-swift', [
          [30, 0, '6吋 Mk XXIII 三聯裝 (A砲塔)', 2000, 500, 4.0], [18, 0, '6吋 Mk XXIII 三聯裝 (B砲塔)', 2000, 500, 4.0], [-24, 0, '6吋 Mk XXIII 三聯裝 (Y砲塔)', 2000, 500, 4.0],
        ]),
        sagShip({ name: 'HMNZS Gambia (甘比亞號輕巡洋艦)', codeName: 'HMNZS Gambia (48)', type: 'cruiser', length: 100, width: 18, maxHealth: 8000, speed: 22, flakRange: 1300 }, 'bpf-gam', [
          [30, 0, '6吋 Mk XXIII 三聯裝 (A砲塔)', 2000, 500, 4.0], [18, 0, '6吋 Mk XXIII 三聯裝 (B砲塔)', 2000, 500, 4.0],
          [-18, 0, '6吋 Mk XXIII 三聯裝 (X砲塔)', 2000, 500, 4.0], [-30, 0, '6吋 Mk XXIII 三聯裝 (Y砲塔)', 2000, 500, 4.0],
        ]),
        sagShip({ name: 'HMS Quilliam (奎利姆號 Q級驅逐艦)', codeName: 'HMS Quilliam (G09)', type: 'destroyer', length: 70, width: 12, maxHealth: 4200, speed: 27, flakRange: 1100, torpedoCooldown: 22 }, 'bpf-quil', [
          [22, 0, '4.7吋 Mk IX 單裝 (A砲)', 1500, 300, 2.8], [12, 0, '4.7吋 Mk IX 單裝 (B砲)', 1500, 300, 2.8], [-18, 0, '4.7吋 Mk IX 單裝 (X砲)', 1500, 300, 2.8], [-26, 0, '4.7吋 Mk IX 單裝 (Y砲)', 1500, 300, 2.8],
        ]),
      ],
    },
    {
      title: '澳大利亞皇家海軍第74特遣艦隊 (Task Force 74 · 雷伊泰灣 1944)',
      ships: [
        sagShip({ name: 'HMAS Shropshire (什羅普郡號重巡洋艦)', codeName: 'HMAS Shropshire (73)', type: 'cruiser', length: 112, width: 21, maxHealth: 9800, speed: 20, flakRange: 1300 }, 'ran-shrop', COUNTY_8IN),
        sagShip({ name: 'HMAS Arunta (阿倫塔號部族級驅逐艦)', codeName: 'HMAS Arunta (I30)', type: 'destroyer', length: 72, width: 13, maxHealth: 4600, speed: 26, flakRange: 1100, torpedoCooldown: 22 }, 'ran-aru2', TRIBAL_DD),
        sagShip({ name: 'HMAS Warramunga (瓦拉蒙加號部族級驅逐艦)', codeName: 'HMAS Warramunga (I44)', type: 'destroyer', length: 72, width: 13, maxHealth: 4600, speed: 26, flakRange: 1100, torpedoCooldown: 22 }, 'ran-war', TRIBAL_DD),
      ],
    },
  ],
  era3: [
    {
      title: '大英國協與大韓民國海軍 (Commonwealth & ROKN · 仁川 / 元山 1950)',
      ships: [
        sagShip({ name: 'HMS Jamaica (牙買加號輕巡洋艦)', codeName: 'HMS Jamaica (44)', type: 'cruiser', length: 100, width: 18, maxHealth: 8200, speed: 22, flakRange: 1400, hasModernNavalGunAA: true }, 'cw-jam', [
          [30, 0, '6吋 Mk XXIII 三聯裝 (A砲塔)', 2000, 500, 4.0], [18, 0, '6吋 Mk XXIII 三聯裝 (B砲塔)', 2000, 500, 4.0],
          [-18, 0, '6吋 Mk XXIII 三聯裝 (X砲塔)', 2000, 500, 4.0], [-30, 0, '6吋 Mk XXIII 三聯裝 (Y砲塔)', 2000, 500, 4.0],
        ]),
        sagShip({ name: 'HMAS Bataan (巴丹號部族級驅逐艦)', codeName: 'HMAS Bataan (I91)', type: 'destroyer', length: 72, width: 13, maxHealth: 4800, speed: 26, flakRange: 1200, torpedoCooldown: 22 }, 'cw-bat', TRIBAL_DD),
        sagShip({ name: 'HMCS Cayuga (卡尤加號部族級驅逐艦)', codeName: 'HMCS Cayuga (218)', type: 'destroyer', length: 72, width: 13, maxHealth: 4800, speed: 26, flakRange: 1200, torpedoCooldown: 22 }, 'cw-cay', TRIBAL_DD),
        sagShip({ name: 'HMNZS Rotoiti (羅托伊蒂號湖級巡防艦)', codeName: 'HMNZS Rotoiti (F625)', type: 'destroyer', length: 62, width: 11, maxHealth: 3200, speed: 18, flakRange: 1000 }, 'cw-rot', [
          [18, 0, '4吋 Mk XVI 雙聯裝高平砲', 1500, 220, 2.2], [-14, 0, '40mm 博福斯雙聯裝', 800, 60, 0.6],
        ]),
        sagShip({ name: 'ROKS Baekdusan 白頭山號 (PC-701)', codeName: 'ROKS Baekdusan (PC-701)', type: 'destroyer', length: 50, width: 9, maxHealth: 2200, speed: 18, flakRange: 900 }, 'rok-pc701', [
          [16, 0, '3吋 50倍徑單裝砲', 1400, 160, 2.0], [-10, 0, '20mm 厄利孔機砲', 700, 40, 0.4],
        ]),
      ],
    },
  ],
  era4: [
    {
      title: '澳大利亞皇家海軍 越南砲擊線驅逐艦 (RAN Gunline · 1967-1971)',
      ships: [
        sagShip({ name: 'HMAS Hobart 荷巴特號 (D39 珀斯級飛彈驅逐艦)', codeName: 'HMAS Hobart (D39)', type: 'ddg', length: 92, width: 15, maxHealth: 6400, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2800, samModel: 'RIM-24 韃靼人 (Mk 13 單臂)', hasASROC: true }, 'ran-d39', [
          [28, 0, '5吋/54 Mk 42 (艦艏)', 1800, 500, 2.5], [-26, 0, '5吋/54 Mk 42 (艦艉)', 1800, 500, 2.5],
        ]),
        sagShip({ name: 'HMAS Perth 珀斯號 (D38 珀斯級飛彈驅逐艦)', codeName: 'HMAS Perth (D38)', type: 'ddg', length: 92, width: 15, maxHealth: 6400, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2800, samModel: 'RIM-24 韃靼人 (Mk 13 單臂)', hasASROC: true }, 'ran-d38', [
          [28, 0, '5吋/54 Mk 42 (艦艏)', 1800, 500, 2.5], [-26, 0, '5吋/54 Mk 42 (艦艉)', 1800, 500, 2.5],
        ]),
        sagShip({ name: 'HMAS Vampire 吸血鬼號 (D11 果敢級驅逐艦)', codeName: 'HMAS Vampire (D11)', type: 'destroyer', length: 82, width: 14, maxHealth: 5200, speed: 27, flakRange: 1300, hasModernNavalGunAA: true, torpedoCooldown: 24 }, 'ran-d11', [
          [26, 0, '4.5吋 Mk VI 雙聯裝 (A砲塔)', 1700, 380, 2.5], [14, 0, '4.5吋 Mk VI 雙聯裝 (B砲塔)', 1700, 380, 2.5], [-22, 0, '4.5吋 Mk VI 雙聯裝 (Y砲塔)', 1700, 380, 2.5],
        ]),
      ],
    },
  ],
  era5: [
    {
      title: '英國皇家海軍特遣群 (Royal Navy Task Group · 1982-1990)',
      ships: [
        sagShip({ name: 'HMS Broadsword 闊劍號 (Type 22 巡防艦)', codeName: 'HMS Broadsword (F88)', type: 'ffg', length: 90, width: 15, maxHealth: 6000, speed: 26, flakRange: 1300, hasSAM: true, samRange: 2400, samModel: 'Sea Wolf (海狼) 點防空飛彈', hasHarpoon: true, ashmType: 'exocet_mm38', torpedoCooldown: 24 }, 'rn-f88', [
          [24, 0, 'Sea Wolf GWS 25 六聯裝 (艦艏)', 2400, 750, 4.0], [-22, 0, 'Sea Wolf GWS 25 六聯裝 (艦艉)', 2400, 750, 4.0], [30, 0, 'Exocet MM38 四聯裝', 4000, 1650, 24.0],
        ]),
        sagShip({ name: 'HMS Brilliant 卓越號 (Type 22 巡防艦)', codeName: 'HMS Brilliant (F90)', type: 'ffg', length: 90, width: 15, maxHealth: 6000, speed: 26, flakRange: 1300, hasSAM: true, samRange: 2400, samModel: 'Sea Wolf (海狼) 點防空飛彈', hasHarpoon: true, ashmType: 'exocet_mm38', torpedoCooldown: 24 }, 'rn-f90', [
          [24, 0, 'Sea Wolf GWS 25 六聯裝 (艦艏)', 2400, 750, 4.0], [-22, 0, 'Sea Wolf GWS 25 六聯裝 (艦艉)', 2400, 750, 4.0], [30, 0, 'Exocet MM38 四聯裝', 4000, 1650, 24.0],
        ]),
        sagShip({ name: 'HMS Glamorgan 格拉摩根號 (郡級飛彈驅逐艦)', codeName: 'HMS Glamorgan (D19)', type: 'ddg', length: 104, width: 17, maxHealth: 7400, speed: 24, flakRange: 1400, hasModernNavalGunAA: true, hasSAM: true, samRange: 3000, samModel: 'Sea Slug (海蛞蝓) 區域防空飛彈', hasHarpoon: true, ashmType: 'exocet_mm38' }, 'rn-d19', [
          [34, 0, '4.5吋 Mk VI 雙聯裝 (A砲塔)', 1700, 380, 2.5], [-36, 0, 'Sea Slug 雙臂發射架', 3000, 950, 9.0],
        ]),
      ],
    },
    {
      title: '北約大西洋常設艦隊 (STANAVFORLANT · 荷蘭 / 加拿大 / 西德 1985)',
      ships: [
        sagShip({ name: 'HNLMS Tromp 特龍普號 (F801 飛彈巡防艦)', codeName: 'HNLMS Tromp (F801)', type: 'ddg', length: 96, width: 16, maxHealth: 6800, speed: 24, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 3000, samModel: 'SM-1MR 標準 (Mk 13 單臂)', hasHarpoon: true, ashmType: 'harpoon' }, 'nl-f801', [
          [32, 0, '120mm Bofors 雙聯裝 (艦艏)', 1700, 420, 2.4],
        ]),
        sagShip({ name: 'HMCS Iroquois 易洛魁號 (DDH-280 部族級)', codeName: 'HMCS Iroquois (280)', type: 'ddg', length: 92, width: 15, maxHealth: 6400, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2400, samModel: 'RIM-7 海麻雀防空飛彈', hasASROC: true }, 'ca-280', [
          [28, 0, '127mm OTO Melara 超速砲', 1800, 480, 1.8],
        ]),
        sagShip({ name: 'FGS Lütjens 呂特晏斯號 (D185 飛彈驅逐艦)', codeName: 'FGS Lütjens (D185)', type: 'ddg', length: 92, width: 15, maxHealth: 6400, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2800, samModel: 'SM-1MR 標準 (Mk 13 單臂)', hasHarpoon: true, ashmType: 'harpoon', hasASROC: true }, 'de-d185', [
          [28, 0, '5吋/54 Mk 42 (艦艏)', 1800, 500, 2.5], [-26, 0, '5吋/54 Mk 42 (艦艉)', 1800, 500, 2.5],
        ]),
      ],
    },
  ],
};

/**
 * Historical allied surface action group for an era (Royal Navy, UN, NATO or JMSDF).
 * Eras 4 and 5 pick between two task forces with one Math.random() call.
 */
export function getAlliedSagFleet(era: Era): AlliedSagFleet {
  let title = '';
  let ships: AlliedSagShipDef[] = [];

  if (era === 'era1') {
    title = '英國皇家海軍東方艦隊 (Royal Navy Eastern Fleet SAG)';
    ships = [
      {
        name: 'HMS King George V (喬治五世號戰艦)',
        codeName: 'HMS KGV (41)',
        type: 'battleship',
        length: 128,
        width: 29,
        maxHealth: 16000,
        speed: 18,
        flakRange: 1400,
        turrets: [
          { id: 'kgv-t1', pos: { x: 38, y: 0 }, angle: 0, range: 2600, damage: 1250, cooldown: 0, maxCooldown: 10, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'kgv-t2', pos: { x: 20, y: 0 }, angle: 0, range: 2600, damage: 850, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII 雙聯裝' },
          { id: 'kgv-t3', pos: { x: -36, y: 0 }, angle: Math.PI, range: 2600, damage: 1250, cooldown: 0, maxCooldown: 10, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'kgv-dp1', pos: { x: 6, y: -12 }, angle: -Math.PI / 2, range: 1800, damage: 320, cooldown: 0, maxCooldown: 4.0, caliber: '5.25吋 高平兩用雙聯裝' },
          { id: 'kgv-dp2', pos: { x: 6, y: 12 }, angle: Math.PI / 2, range: 1800, damage: 320, cooldown: 0, maxCooldown: 4.0, caliber: '5.25吋 高平兩用雙聯裝' },
        ],
      },
      {
        name: 'HMS Sheffield (謝菲爾德號輕巡洋艦)',
        codeName: 'HMS Sheffield (C24)',
        type: 'cruiser',
        length: 98,
        width: 18,
        maxHealth: 8200,
        speed: 22,
        flakRange: 1200,
        torpedoCooldown: 28,
        turrets: [
          { id: 'sheff-t1', pos: { x: 30, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (A砲塔)' },
          { id: 'sheff-t2', pos: { x: 16, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (B背負砲塔)' },
          { id: 'sheff-t3', pos: { x: -16, y: 0 }, angle: Math.PI, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (X背負砲塔)' },
          { id: 'sheff-t4', pos: { x: -28, y: 0 }, angle: Math.PI, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (Y砲塔)' },
          { id: 'sheff-dp1', pos: { x: 2, y: -8 }, angle: -Math.PI / 2, range: 1600, damage: 240, cooldown: 0, maxCooldown: 3.5, caliber: '4吋 Mk XVI 雙聯高平兩用砲' },
          { id: 'sheff-dp2', pos: { x: 2, y: 8 }, angle: Math.PI / 2, range: 1600, damage: 240, cooldown: 0, maxCooldown: 3.5, caliber: '4吋 Mk XVI 雙聯高平兩用砲' },
        ],
      },
      {
        name: 'HMS Jervis (賈維斯號 J級驅逐艦)',
        codeName: 'HMS Jervis (F00)',
        type: 'destroyer',
        length: 68,
        width: 13,
        maxHealth: 4200,
        speed: 26,
        flakRange: 1000,
        torpedoCooldown: 20,
        turrets: [
          { id: 'jerv-t1', pos: { x: 20, y: 0 }, angle: 0, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (A砲塔)' },
          { id: 'jerv-t2', pos: { x: 9, y: 0 }, angle: 0, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (B背負砲塔)' },
          { id: 'jerv-t3', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (X砲塔)' },
        ],
      },
      sagShip({ name: 'HMS Warspite (厭戰號戰艦 · 東方艦隊旗艦)', codeName: 'HMS Warspite (03)', type: 'battleship', length: 122, width: 28, maxHealth: 15000, speed: 17, flakRange: 1300 }, 'rn-warspite', [
        [40, 0, '15吋 Mk I 雙聯裝 (A砲塔)', 2600, 880, 6.8], [28, 0, '15吋 Mk I 雙聯裝 (B砲塔)', 2600, 880, 6.8],
        [-28, 0, '15吋 Mk I 雙聯裝 (X砲塔)', 2600, 880, 6.8], [-40, 0, '15吋 Mk I 雙聯裝 (Y砲塔)', 2600, 880, 6.8],
        [6, -11, '4吋 Mk XVI 雙聯裝高平砲', 1500, 220, 2.2], [6, 11, '4吋 Mk XVI 雙聯裝高平砲', 1500, 220, 2.2],
      ]),
    ];
  } else if (era === 'era2') {
    title = '英國皇家海軍第57特遣艦隊 (Royal Navy Task Force 57 SAG)';
    ships = [
      {
        name: 'HMS Duke of York (約克公爵號戰艦)',
        codeName: 'HMS Duke of York (17)',
        type: 'battleship',
        length: 128,
        width: 29,
        maxHealth: 16800,
        speed: 18,
        flakRange: 1600,
        turrets: [
          { id: 'doy-t1', pos: { x: 38, y: 0 }, angle: 0, range: 2600, damage: 1350, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII (Type 284 雷達射控)' },
          { id: 'doy-t2', pos: { x: 20, y: 0 }, angle: 0, range: 2600, damage: 900, cooldown: 0, maxCooldown: 9.0, caliber: '14吋 Mk VII 雙聯裝' },
          { id: 'doy-t3', pos: { x: -36, y: 0 }, angle: Math.PI, range: 2600, damage: 1350, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'doy-dp1', pos: { x: 6, y: -12 }, angle: -Math.PI / 2, range: 1800, damage: 340, cooldown: 0, maxCooldown: 3.8, caliber: '5.25吋 VT近發雙聯裝' },
          { id: 'doy-dp2', pos: { x: 6, y: 12 }, angle: Math.PI / 2, range: 1800, damage: 340, cooldown: 0, maxCooldown: 3.8, caliber: '5.25吋 VT近發雙聯裝' },
        ],
      },
      {
        name: 'HMS Belfast (貝爾法斯特號輕巡洋艦)',
        codeName: 'HMS Belfast (C35)',
        type: 'cruiser',
        length: 102,
        width: 19,
        maxHealth: 8600,
        speed: 22,
        flakRange: 1400,
        torpedoCooldown: 25,
        turrets: [
          { id: 'belf-t1', pos: { x: 32, y: 0 }, angle: 0, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (A砲塔)' },
          { id: 'belf-t2', pos: { x: 17, y: 0 }, angle: 0, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (B砲塔)' },
          { id: 'belf-t3', pos: { x: -17, y: 0 }, angle: Math.PI, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (X砲塔)' },
          { id: 'belf-t4', pos: { x: -30, y: 0 }, angle: Math.PI, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (Y砲塔)' },
          { id: 'belf-dp1', pos: { x: 0, y: -8 }, angle: -Math.PI / 2, range: 1600, damage: 260, cooldown: 0, maxCooldown: 3.2, caliber: '4吋 Mk XVI 雙聯裝高平砲' },
          { id: 'belf-dp2', pos: { x: 0, y: 8 }, angle: Math.PI / 2, range: 1600, damage: 260, cooldown: 0, maxCooldown: 3.2, caliber: '4吋 Mk XVI 雙聯裝高平砲' },
        ],
      },
      {
        name: 'HMS Armada (阿瑪達號戰鬥級驅逐艦)',
        codeName: 'HMS Armada (D14)',
        type: 'destroyer',
        length: 72,
        width: 13,
        maxHealth: 4500,
        speed: 26,
        flakRange: 1300,
        torpedoCooldown: 20,
        turrets: [
          { id: 'arm-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.5吋 Mk IV 雙聯裝快砲 (A砲塔)' },
          { id: 'arm-t2', pos: { x: 12, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.5吋 Mk IV 雙聯裝快砲 (B背負砲塔)' },
          { id: 'arm-aa', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1500, damage: 260, cooldown: 0, maxCooldown: 3.0, caliber: '4吋 QF Mk V 高平副砲' },
        ],
      },
    ];
  } else if (era === 'era3') {
    title = '聯合國軍第95特遣艦隊 (UN Naval Task Force 95 SAG)';
    ships = [
      {
        name: 'HMS Belfast (貝爾法斯特號 · 聯合國遠東特遣旗艦)',
        codeName: 'HMS Belfast (UN-C35)',
        type: 'cruiser',
        length: 104,
        width: 19,
        maxHealth: 9000,
        speed: 22,
        flakRange: 1600,
        hasModernNavalGunAA: true,
        turrets: [
          { id: 'un-belf-t1', pos: { x: 32, y: 0 }, angle: 0, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (A砲塔)' },
          { id: 'un-belf-t2', pos: { x: 17, y: 0 }, angle: 0, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (B背負砲塔)' },
          { id: 'un-belf-t3', pos: { x: -17, y: 0 }, angle: Math.PI, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (X背負砲塔)' },
          { id: 'un-belf-t4', pos: { x: -30, y: 0 }, angle: Math.PI, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (Y砲塔)' },
          { id: 'un-belf-aa1', pos: { x: 0, y: -9 }, angle: -Math.PI / 2, range: 1600, damage: 280, cooldown: 0, maxCooldown: 2.2, caliber: '3"/50 VT 雙聯裝速射砲' },
          { id: 'un-belf-aa2', pos: { x: 0, y: 9 }, angle: Math.PI / 2, range: 1600, damage: 280, cooldown: 0, maxCooldown: 2.2, caliber: '3"/50 VT 雙聯裝速射砲' },
        ],
      },
      {
        name: 'HMS Cossack (哥薩克號部族級驅逐艦)',
        codeName: 'HMS Cossack (D03)',
        type: 'destroyer',
        length: 74,
        width: 14,
        maxHealth: 4800,
        speed: 26,
        flakRange: 1200,
        torpedoCooldown: 22,
        turrets: [
          { id: 'coss-t1', pos: { x: 22, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (A砲塔)' },
          { id: 'coss-t2', pos: { x: 10, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (B砲塔)' },
          { id: 'coss-t3', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (X砲塔)' },
        ],
      },
      {
        name: 'HMS Defender (保衛者號衛士級重驅逐艦)',
        codeName: 'HMS Defender (D114)',
        type: 'destroyer',
        length: 78,
        width: 14,
        maxHealth: 5200,
        speed: 26,
        flakRange: 1400,
        hasModernNavalGunAA: true,
        torpedoCooldown: 20,
        turrets: [
          { id: 'def-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (A砲塔)' },
          { id: 'def-t2', pos: { x: 12, y: 0 }, angle: 0, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (B砲塔)' },
          { id: 'def-t3', pos: { x: -20, y: 0 }, angle: Math.PI, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (X砲塔)' },
        ],
      },
    ];
  } else if (era === 'era4') {
    const isNato = Math.random() < 0.5;
    if (isNato) {
      title = '北約大西洋常設艦隊 (NATO STANAVFORLANT SAG)';
      ships = [
        {
          name: 'HMS Sheffield (Type 42 飛彈驅逐艦)',
          codeName: 'HMS Sheffield (D80)',
          type: 'ddg',
          length: 88,
          width: 16,
          maxHealth: 6800,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasSAM: true,
          samRange: 3200,
          samModel: 'Sea Dart (海鏢) 區域防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'shef42-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 480, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk 8 全自動艦砲' },
            { id: 'shef42-sam', pos: { x: 8, y: 0 }, angle: 0, range: 3200, damage: 950, cooldown: 0, maxCooldown: 8.0, caliber: 'Sea Dart (海鏢) 雙臂防空飛彈' },
          ],
        },
        {
          name: 'HMS Andromeda (利安達級巡防艦)',
          codeName: 'HMS Andromeda (F57)',
          type: 'destroyer',
          length: 80,
          width: 15,
          maxHealth: 5500,
          speed: 24,
          flakRange: 1200,
          hasHarpoon: true,
          ashmType: 'exocet_mm38',
          hasSAM: true,
          samRange: 2400,
          samModel: 'Sea Wolf (海狼) 點防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'andro-sam', pos: { x: 18, y: 0 }, angle: 0, range: 2400, damage: 750, cooldown: 0, maxCooldown: 6.0, caliber: 'Sea Wolf (海狼) 短程防空飛彈' },
            { id: 'andro-ashm', pos: { x: -14, y: 0 }, angle: 0, range: 4000, damage: 1650, cooldown: 0, maxCooldown: 24.0, caliber: 'Exocet (飛魚 MM38) 掠海反艦飛彈' },
          ],
        },
        sagShip({ name: 'HMCS Iroquois 易洛魁號 (DDH-280 部族級)', codeName: 'HMCS Iroquois (280)', type: 'ddg', length: 92, width: 15, maxHealth: 6400, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2400, samModel: 'RIM-7 海麻雀防空飛彈', hasASROC: true }, 'ca-280e4', [
          [28, 0, '127mm OTO Melara 超速砲', 1800, 480, 1.8],
        ]),
      ];
    } else {
      title = '日本海上自衛隊護衛艦群 (JMSDF Escort Flotilla SAG)';
      ships = [
        {
          name: 'JDS Haruna 榛名號直升機護衛艦 (DDH-141)',
          codeName: 'JDS Haruna (DDH-141)',
          type: 'ddg',
          length: 104,
          width: 18,
          maxHealth: 7400,
          speed: 24,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2600,
          samModel: 'RIM-7 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'haruna-t1', pos: { x: 32, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'haruna-t2', pos: { x: 18, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'haruna-sam', pos: { x: -24, y: 0 }, angle: Math.PI, range: 2600, damage: 850, cooldown: 0, maxCooldown: 7.0, caliber: 'RIM-7 海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Takatsuki 高月號護衛艦 (DD-164)',
          codeName: 'JDS Takatsuki (DD-164)',
          type: 'destroyer',
          length: 86,
          width: 16,
          maxHealth: 5600,
          speed: 25,
          flakRange: 1200,
          hasModernNavalGunAA: true,
          hasASROC: true,
          torpedoCooldown: 25,
          turrets: [
            { id: 'taka-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'taka-t2', pos: { x: -22, y: 0 }, angle: Math.PI, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
          ],
        },
        sagShip({ name: 'JDS Amatsukaze 天津風號飛彈護衛艦 (DDG-163)', codeName: 'JDS Amatsukaze (DDG-163)', type: 'ddg', length: 88, width: 14, maxHealth: 6000, speed: 26, flakRange: 1300, hasModernNavalGunAA: true, hasSAM: true, samRange: 2600, samModel: 'RIM-24 韃靼人 (Mk 13 單臂)', hasASROC: true }, 'jds-163', [
          [28, 0, '3吋/50 Mk 33 雙聯裝', 1500, 260, 1.8], [-24, 0, 'Mk 13 韃靼人單臂發射架', 2600, 850, 8.0],
        ]),
      ];
    }
  } else {
    // Era 5
    const isNato = Math.random() < 0.5;
    if (isNato) {
      title = '北約海上打擊部隊 (NATO Striking Fleet Atlantic SAG)';
      ships = [
        {
          name: 'HMS Gloucester 格洛斯特號 (Type 42 Batch 2 飛彈驅逐艦)',
          codeName: 'HMS Gloucester (D96)',
          type: 'ddg_kidd',
          length: 95,
          width: 16,
          maxHealth: 7200,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasCIWS: true,
          hasSAM: true,
          samRange: 3400,
          samModel: 'Sea Dart Mod 2 區域防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'glou-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk 8 全自動艦砲' },
            { id: 'glou-sam', pos: { x: 10, y: 0 }, angle: 0, range: 3400, damage: 1050, cooldown: 0, maxCooldown: 7.0, caliber: 'Sea Dart Mod 2 雙臂防空飛彈' },
          ],
        },
        {
          name: 'FGS Bremen 不萊梅號 (F122 巡防艦)',
          codeName: 'FGS Bremen (F207)',
          type: 'ffg_ohp',
          length: 84,
          width: 15,
          maxHealth: 6000,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'NSSMS 北約海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'brem-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托梅萊拉 76mm 快砲' },
            { id: 'brem-sam', pos: { x: -18, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: 'NSSMS 八聯裝北約海麻雀' },
          ],
        },
        {
          name: 'FS Tourville 圖爾維爾號 (F67 飛彈驅逐艦)',
          codeName: 'FS Tourville (D610)',
          type: 'dd_spruance',
          length: 98,
          width: 16,
          maxHealth: 6600,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'exocet_mm40',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2600,
          samModel: '海響尾蛇 (Crotale) 點防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'tour-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 460, cooldown: 0, maxCooldown: 2.2, caliber: '100mm/55 Mod 68 快砲' },
            { id: 'tour-sam', pos: { x: -22, y: 0 }, angle: Math.PI, range: 2600, damage: 800, cooldown: 0, maxCooldown: 6.0, caliber: 'Crotale (海響尾蛇) 防空飛彈' },
          ],
        },
      ];
    } else {
      title = '日本海上自衛隊八八艦隊 (JMSDF Eight-Eight Escort Flotilla SAG)';
      ships = [
        {
          name: 'JDS Shirane 白根號直升機護衛艦 (DDH-143)',
          codeName: 'JDS Shirane (DDH-143)',
          type: 'ddg_kidd',
          length: 108,
          width: 18,
          maxHealth: 7800,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7F 短程海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'shirane-t1', pos: { x: 34, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋速射砲 (Mk 42)' },
            { id: 'shirane-t2', pos: { x: 20, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋速射砲 (Mk 42)' },
            { id: 'shirane-sam', pos: { x: -28, y: 0 }, angle: Math.PI, range: 2800, damage: 880, cooldown: 0, maxCooldown: 6.5, caliber: '短程海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Asagiri 朝霧號飛彈護衛艦 (DD-151)',
          codeName: 'JDS Asagiri (DD-151)',
          type: 'ffg_ohp',
          length: 90,
          width: 16,
          maxHealth: 6400,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7M 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'asagiri-t1', pos: { x: 25, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托 76mm 快砲 (DART)' },
            { id: 'asagiri-sam', pos: { x: -22, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: '海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Hatsuyuki 初雪號護衛艦 (DD-122)',
          codeName: 'JDS Hatsuyuki (DD-122)',
          type: 'ffg_ohp',
          length: 86,
          width: 15,
          maxHealth: 5800,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7E 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'hatsu-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托 76mm 快砲 (DART)' },
            { id: 'hatsu-sam', pos: { x: -20, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: '海麻雀防空飛彈' },
          ],
        },
      ];
    }
  }

  // The era's original task group or one of its other historical groups, equally likely
  const options: AlliedSagFleet[] = [{ title, ships }, ...EXTRA_SAG_FLEETS[era]];
  return options[Math.floor(Math.random() * options.length)];
}
