import { Era, GroundUnitType, InstallationType, ShipSide } from '../types/game';

/**
 * Local forces raised from the civilian places each side holds: the militia, police, territorial
 * troops and guerrillas who historically turned out from towns, villages and railway yards.
 *
 *   era1  Solomons 1942: Martin Clemens' Solomon Islands Defence Force scouts from friendly
 *         villages; Japanese naval garrison detachments from occupied ones
 *   era2  1944–45: Filipino guerrillas (USAFIP) from liberated villages; IJA garrison sections
 *   era3  Korea: ROK National Police combat battalions from held towns; KPA sections from towns
 *         and railway stations the North holds
 *   era4  Vietnam: Regional / Popular Forces ("Ruff-Puffs") from secured hamlets; NLF local and
 *         main-force guerrillas from villages and plantations the Front controls
 *   era5  North German plain: Heimatschutz territorial units from West German towns and works;
 *         Soviet motor-rifle (Motostrelki) detachments from railway stations they hold
 */

export interface LocalForce {
  type: GroundUnitType;
  name: string;
  /** Relative chance among the site's options. */
  weight: number;
}

export interface LocalForceRule {
  sites: InstallationType[];
  /** Who must hold the site; the raised unit fights for that side (our sites raise allied troops). */
  holder: 'player' | 'enemy';
  forces: LocalForce[];
  /** Seconds between musters (min, max). */
  every: [number, number];
  /** Units from one site alive at a time. */
  cap: number;
}

const VILLAGES: InstallationType[] = ['settlement', 'town', 'city'];

export const LOCAL_FORCES: Record<Era, LocalForceRule[]> = {
  era1: [
    { sites: ['settlement', 'copra_plantation'], holder: 'player', every: [110, 170], cap: 1, forces: [{ type: 'si_scouts_42', name: '所羅門群島保衛隊 土著偵察隊', weight: 1 }] },
    { sites: VILLAGES, holder: 'enemy', every: [120, 180], cap: 1, forces: [{ type: 'opfor_infantry_42', name: '日本海軍 特別陸戰隊 警備分隊', weight: 1 }] },
  ],
  era2: [
    { sites: VILLAGES, holder: 'player', every: [110, 170], cap: 1, forces: [{ type: 'ph_guerrilla_45', name: '菲律賓游擊隊 (USAFIP) 分遣隊', weight: 1 }] },
    { sites: [...VILLAGES, 'sugar_mill'], holder: 'enemy', every: [120, 180], cap: 1, forces: [{ type: 'opfor_infantry_45', name: '日軍 守備隊 步兵分隊', weight: 1 }] },
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
  ],
  era5: [
    { sites: [...VILLAGES, 'factory'], holder: 'player', every: [100, 160], cap: 2, forces: [{ type: 'frg_heimatschutz_83', name: '西德國土防衛軍 第51國土防衛旅 防衛排', weight: 1 }] },
    {
      sites: ['rail_station'],
      holder: 'enemy',
      every: [90, 150],
      cap: 2,
      forces: [
        { type: 'opfor_motor_rifle_83', name: '蘇軍 摩托化步兵 (Мотострелки) 車站守備排', weight: 3 },
        { type: 'opfor_btr70', name: '蘇軍 摩托化步兵 BTR-70 排', weight: 1 },
      ],
    },
    { sites: [...VILLAGES, 'factory', 'power_plant'], holder: 'enemy', every: [130, 190], cap: 1, forces: [{ type: 'opfor_motor_rifle_83', name: '蘇軍 摩托化步兵 佔領守備排', weight: 1 }] },
  ],
};

export function localRulesFor(era: Era, site: InstallationType, holder: ShipSide | undefined): LocalForceRule | undefined {
  if (holder !== 'player' && holder !== 'enemy') return undefined;
  return LOCAL_FORCES[era].find((r) => r.holder === holder && r.sites.includes(site));
}

export function pickForce(rule: LocalForceRule, r = Math.random()): LocalForce {
  const total = rule.forces.reduce((s, f) => s + f.weight, 0);
  let x = r * total;
  for (const f of rule.forces) {
    x -= f.weight;
    if (x <= 0) return f;
  }
  return rule.forces[rule.forces.length - 1];
}
