import { Era, GroundUnitType, InstallationType, ShipSide } from '../types/game';

/**
 * Local forces raised from the civilian places each side holds: the militia, police, territorial
 * troops and guerrillas who historically turned out from towns, villages and railway yards.
 *
 *   era1  Solomons 1942: Martin Clemens' Solomon Islands Defence Force scouts from friendly
 *         villages; Japanese naval garrison detachments from occupied ones
 *   era2  1944–45: Filipino guerrillas (USAFIP) and Pacific Islands Regiment natives from liberated
 *         villages; IJA garrison sections and the Volunteer Fighting Corps (國民義勇隊)
 *   era3  Korea: ROK National Police combat battalions from held towns; KPA sections from towns
 *         and railway stations the North holds
 *   era4  Vietnam: Regional / Popular Forces ("Ruff-Puffs") from secured hamlets; NLF local and
 *         main-force guerrillas from villages and plantations the Front controls, and from our
 *         unguarded rear; LRRP teams behind the enemy's villages
 *   era5  North German plain: Heimatschutz territorial units from West German towns and works;
 *         Soviet motor-rifle (Motostrelki) and railway troops from the stations they hold, MVD
 *         internal troops in occupied towns
 */

export interface LocalForce {
  type: GroundUnitType;
  name: string;
  /** Relative chance among the site's options. */
  weight: number;
}

export interface LocalForceRule {
  sites: InstallationType[];
  /** Who must hold the site. */
  holder: 'player' | 'enemy';
  /**
   * Who the raised unit fights for: the holder (militia, police, garrisons; our sites raise allied
   * troops) or the holder's enemy (guerrillas slipping into our unguarded rear, LRRP teams behind
   * the enemy's lines). Default 'holder'.
   */
  fightsFor?: 'holder' | 'opponent';
  forces: LocalForce[];
  /** Seconds between musters (min, max). */
  every: [number, number];
  /** Units from one site alive at a time. */
  cap: number;
  /** Units from this rule alive at a time across all sites. */
  limit?: number;
  /** Chance that a muster actually produces a unit (default 1). */
  chance?: number;
  /** Only while the holder has no troops of its own within this radius (an unguarded rear). */
  unguarded?: number;
}

const VILLAGES: InstallationType[] = ['settlement', 'town', 'city'];

/**
 * Historical notes on what each theatre's places could really raise:
 *  - Only reserve, territorial, police or militia formations come from towns; regular allied
 *    formations (Jäger, BAOR, French II Corps, ROK marines, Australians…) come from the allied
 *    headquarters (allied/alliedOps.ts), never from a village.
 *  - Era 2: the IJA garrison and, in the last months, the Volunteer Fighting Corps (國民義勇隊)
 *    raised from the Japanese residents and labour of the towns it still holds.
 *  - Era 4: the NLF was everywhere: it raised its local guerrillas in the hamlets it ran, and
 *    infiltrated the hamlets of our rear that nobody guarded. US LRRP teams worked the other way,
 *    inserted behind the enemy's villages and trails to watch them.
 *  - Era 5: the Soviet rear: railway troops repairing and guarding the stations they held, and
 *    MVD internal troops securing occupied towns.
 */
export const LOCAL_FORCES: Record<Era, LocalForceRule[]> = {
  era1: [
    { sites: ['settlement', 'copra_plantation'], holder: 'player', every: [110, 170], cap: 1, forces: [{ type: 'si_scouts_42', name: '所羅門群島保衛隊 土著偵察隊', weight: 1 }] },
    { sites: VILLAGES, holder: 'enemy', every: [120, 180], cap: 1, forces: [{ type: 'opfor_infantry_42', name: '日本海軍 特別陸戰隊 警備分隊', weight: 1 }] },
  ],
  era2: [
    {
      sites: VILLAGES,
      holder: 'player',
      every: [110, 170],
      cap: 1,
      forces: [
        { type: 'ph_guerrilla_45', name: '菲律賓游擊隊 (USAFIP) 分遣隊', weight: 2 },
        { type: 'si_scouts_42', name: '太平洋島嶼團 新幾內亞步兵營 土著排', weight: 1 },
      ],
    },
    {
      sites: [...VILLAGES, 'sugar_mill'],
      holder: 'enemy',
      every: [110, 170],
      cap: 2,
      forces: [
        { type: 'opfor_infantry_45', name: '日軍 守備隊 步兵分隊', weight: 2 },
        { type: 'opfor_giyutai_45', name: '國民義勇隊 (在留邦人義勇隊)', weight: 2 },
      ],
    },
  ],
  era3: [
    { sites: VILLAGES, holder: 'player', every: [100, 160], cap: 2, forces: [{ type: 'rok_police_50', name: '大韓民國警察 戰鬥警察大隊 排', weight: 1 }] },
    {
      sites: [...VILLAGES, 'rail_station', 'power_plant'],
      holder: 'enemy',
      every: [100, 160],
      cap: 2,
      forces: [
        { type: 'opfor_kpa_infantry_50', name: '朝鮮人民軍 地方警備步兵排', weight: 3 },
        { type: 'opfor_pva_infantry_50', name: '中國人民志願軍 後勤警衛排', weight: 1 },
      ],
    },
  ],
  era4: [
    { sites: VILLAGES, holder: 'player', every: [90, 150], cap: 2, forces: [{ type: 'arvn_rfpf_65', name: '越南共和國 民團 (PF) 排', weight: 1 }] },
    {
      sites: [...VILLAGES, 'rubber_plantation', 'pagoda'],
      holder: 'enemy',
      every: [80, 140],
      cap: 2,
      forces: [
        { type: 'opfor_vc_guerrilla_65', name: '越共 地方游擊隊 (村游擊組)', weight: 3 },
        { type: 'opfor_nlf_main_force_65', name: '越南南方民族解放陣線 主力營 排', weight: 1 },
      ],
    },
    { sites: ['rail_station'], holder: 'enemy', every: [110, 170], cap: 1, forces: [{ type: 'opfor_coldwar_infantry', name: '越南人民軍 鐵路警衛排', weight: 1 }] },
    // NLF cadres slipping into our hamlets when no allied troops are about (a rare event)
    {
      sites: VILLAGES,
      holder: 'player',
      fightsFor: 'opponent',
      every: [150, 240],
      chance: 0.3,
      unguarded: 900,
      cap: 1,
      limit: 3,
      forces: [
        { type: 'opfor_vc_guerrilla_65', name: '越共 滲透武工隊 (後方村落)', weight: 3 },
        { type: 'opfor_nlf_main_force_65', name: 'NLF 主力營 滲透排', weight: 1 },
      ],
    },
    // LRRP teams inserted beside the enemy's quiet villages and plantations to watch them
    {
      sites: [...VILLAGES, 'rubber_plantation'],
      holder: 'enemy',
      fightsFor: 'opponent',
      every: [200, 300],
      chance: 0.25,
      unguarded: 350,
      cap: 1,
      limit: 2,
      forces: [{ type: 'sof_lrrp_65', name: '美陸軍 第52步兵團E連 (LRP) 長程偵察小組 (第1騎兵師)', weight: 1 }],
    },
  ],
  era5: [
    { sites: [...VILLAGES, 'factory'], holder: 'player', every: [150, 230], cap: 1, forces: [{ type: 'frg_heimatschutz_83', name: '西德國土防衛軍 第51國土防衛旅 防衛排', weight: 1 }] },
    {
      sites: ['rail_station'],
      holder: 'enemy',
      every: [90, 150],
      cap: 2,
      forces: [
        { type: 'opfor_motor_rifle_83', name: '蘇軍 摩托化步兵 (Мотострелки) 車站守備排', weight: 3 },
        { type: 'opfor_rail_troops_83', name: '蘇軍 鐵道兵旅 (ЖДВ) 搶修警衛排', weight: 2 },
        { type: 'opfor_btr70', name: '蘇軍 摩托化步兵 BTR-70 排', weight: 1 },
      ],
    },
    {
      sites: [...VILLAGES, 'factory', 'power_plant'],
      holder: 'enemy',
      every: [130, 190],
      cap: 1,
      forces: [
        { type: 'opfor_mvd_vv_83', name: '蘇聯內務部 內衛部隊 (ВВ МВД) 佔領區警備排', weight: 2 },
        { type: 'opfor_motor_rifle_83', name: '蘇軍 摩托化步兵 佔領守備排', weight: 1 },
      ],
    },
  ],
};

/** Every rule a site held by this side musters under (with its index, for per-rule timers). */
export function localRulesFor(era: Era, site: InstallationType, holder: ShipSide | undefined): { rule: LocalForceRule; index: number }[] {
  if (holder !== 'player' && holder !== 'enemy') return [];
  const out: { rule: LocalForceRule; index: number }[] = [];
  LOCAL_FORCES[era].forEach((rule, index) => {
    if (rule.holder === holder && rule.sites.includes(site)) out.push({ rule, index });
  });
  return out;
}

/** The side the rule's unit fights for. */
export const raisedFor = (rule: LocalForceRule): 'player' | 'enemy' =>
  (rule.fightsFor ?? 'holder') === 'holder' ? rule.holder : rule.holder === 'player' ? 'enemy' : 'player';

export function pickForce(rule: LocalForceRule, r = Math.random()): LocalForce {
  const total = rule.forces.reduce((s, f) => s + f.weight, 0);
  let x = r * total;
  for (const f of rule.forces) {
    x -= f.weight;
    if (x <= 0) return f;
  }
  return rule.forces[rule.forces.length - 1];
}
