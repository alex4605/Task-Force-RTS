import typesSource from '../types/game.ts?raw';
import { AircraftModel, Era, GroundUnitType, InstallationType, ShipType } from '../types/game';
import { GROUND_UNIT_STATS } from './groundUnitStats';
import { GROUND_UNIT_RANGE_KM } from './rangeScale';
import { getAircraftBaseHealth, getAircraftBaseSpeed } from './aircraftStats';
import { SHIP_DRAFT_M } from './naval/draft';
import { aircraftEw, shipEw } from './ew';
import { groundSilhouetteClass } from './unitPreviewRenderer';
import { LOCAL_FORCES } from './localForces';
import { AIR_INTRO, GROUND_INTRO, SHIP_INTRO, UnitIntro } from './unitIntro';
import { Ship } from '../types/game';
import { codexFleetShips } from './procedural';
import { AlliedSagShipDef, getAlliedSagFleet } from './alliedSagFleets';
import { shipClassOf } from './shipClasses';

/**
 * 圖鑑 (codex): every ground unit, aircraft, ship and installation in the game, with its era,
 * side, nation, statistics and the historical note written beside its type in types/game.ts.
 * The notes are read from that file's source at load time, so a type added there appears here
 * with no second list to keep in step.
 */

export type CodexKind = 'ground' | 'aircraft' | 'ship' | 'site';
export type CodexSide = 'player' | 'allied' | 'enemy' | 'neutral' | 'both';

export interface CodexEntry {
  kind: CodexKind;
  key: string;
  title: string;
  note: string;
  eras: Era[];
  side: CodexSide;
  nation: string;
  group: string;
  stats: { label: string; value: string }[];
  extras: string[];
  /** A real ship of the era's fleets, drawn with its own artwork. */
  ship?: Ship;
}

const ERA_ZH: Record<string, Era> = { 一: 'era1', 二: 'era2', 三: 'era3', 四: 'era4', 五: 'era5' };
export const ERA_LABEL: Record<Era, string> = { era1: '時代一 (1942)', era2: '時代二 (1944-45)', era3: '時代三 (韓戰)', era4: '時代四 (越戰)', era5: '時代五 (1980s)' };
export const SIDE_LABEL: Record<CodexSide, string> = { player: '我軍 (美軍)', allied: '盟軍', enemy: '敵軍 (OPFOR)', neutral: '中立', both: '雙方' };

interface UnionMember {
  key: string;
  comment: string;
  header: string;
}

/** Members of `export type Name = | 'a' // note ...;` with their comments and section headers. */
function parseUnion(name: string): UnionMember[] {
  const start = typesSource.indexOf(`export type ${name} =`);
  if (start < 0) return [];
  const out: UnionMember[] = [];
  let header = '';
  const lines = typesSource.slice(start).split('\n').slice(1);
  for (const line of lines) {
    const h = line.match(/^\s*\/\/\s*(.*)$/);
    if (h) {
      header = h[1];
      continue;
    }
    const m = line.match(/^\s*\|\s*'([a-z0-9_]+)'\s*;?\s*(?:\/\/\s*(.*))?$/);
    if (m) out.push({ key: m[1], comment: (m[2] ?? '').trim(), header });
    if (/;\s*(\/\/.*)?$/.test(line)) break;
  }
  return out;
}

function erasIn(text: string): Era[] {
  const out = new Set<Era>();
  for (const m of text.matchAll(/時代([一二三四五])(?:[\/／、~～至]([一二三四五]))?/g)) {
    out.add(ERA_ZH[m[1]]);
    if (m[2]) {
      const a = Number(ERA_ZH[m[1]].slice(3));
      const b = Number(ERA_ZH[m[2]].slice(3));
      for (let k = Math.min(a, b); k <= Math.max(a, b); k++) out.add(`era${k}` as Era);
    }
  }
  for (const m of text.matchAll(/Era (\d)/g)) out.add(`era${m[1]}` as Era);
  return [...out].sort();
}

const SUFFIX_ERA: [RegExp, Era][] = [
  [/_4[0-3]$/, 'era1'],
  [/_4[4-9]$/, 'era2'],
  [/_5\d$/, 'era3'],
  [/_6\d$|_7\d$/, 'era4'],
  [/_8\d$/, 'era5'],
  // Pacific War base types that predate the era-suffixed roster
  [/^(usmc_engineer|usmc_artillery_105|opfor_mortar_platoon|opfor_infantry_ambush|opfor_type95_tank|opfor_type97_tank|opfor_field_artillery)$/, 'era1'],
  [/^(usmc_engineer|usmc_artillery_105|opfor_mortar_platoon|opfor_infantry_ambush|opfor_type95_tank|opfor_type97_tank|opfor_field_artillery)$/, 'era2'],
];

/** "時代四 越南共和國陸軍 M41A3 …" → "越南共和國陸軍 M41A3 …" */
const stripEra = (s: string) => s.replace(/^時代[一二三四五](?:[\/／][一二三四五])*\s*/, '').trim();

// ── Ground ───────────────────────────────────────────────────────────────────

const NATION_PREFIX: [RegExp, string, CodexSide][] = [
  [/^usmc_/, '美國海軍陸戰隊', 'player'],
  [/^us_/, '美國陸軍', 'player'],
  [/^sof_/, '美軍特種部隊', 'player'],
  [/^au_/, '澳大利亞', 'allied'],
  [/^nz_/, '紐西蘭', 'allied'],
  [/^cw_/, '大英國協', 'allied'],
  [/^uk_/, '英國', 'allied'],
  [/^frg_/, '西德 (聯邦國防軍)', 'allied'],
  [/^fr_/, '法國', 'allied'],
  [/^nl_/, '荷蘭', 'allied'],
  [/^rok_/, '大韓民國', 'allied'],
  [/^arvn_/, '越南共和國', 'allied'],
  [/^th_/, '泰國', 'allied'],
  [/^tr_/, '土耳其', 'allied'],
  [/^gr_/, '希臘', 'allied'],
  [/^ph_/, '菲律賓 (USAFIP)', 'allied'],
  [/^fj_/, '斐濟', 'allied'],
  [/^si_/, '英屬所羅門群島', 'allied'],
];

function opforNation(key: string, eras: Era[]): string {
  if (/nlf|vc_/.test(key)) return '越南南方民族解放陣線 (越共)';
  if (/pva/.test(key)) return '中國人民志願軍';
  if (/kpa/.test(key)) return '朝鮮人民軍';
  if (/ija|type9/.test(key)) return '大日本帝國陸軍';
  const e = eras[0];
  if (e === 'era1' || e === 'era2') return '大日本帝國陸海軍';
  if (e === 'era3') return '朝鮮人民軍 / 中國人民志願軍';
  if (e === 'era4') return '越南人民軍 / 蘇聯顧問團';
  return '蘇聯 / 華沙公約';
}

const CLASS_ZH: Record<string, string> = {
  infantry: '步兵', tank: '戰車 / 裝甲車', spg: '自走砲', towed: '牽引火砲', rocket: '火箭 / 飛彈', air_defense: '防空', carrier: '輸送 / 兩棲車輛', engineer: '工兵', atgm: '反戰車 / 肩射飛彈小組', mortar: '迫擊砲',
};

function localForceNotes(type: GroundUnitType): string[] {
  const out: string[] = [];
  for (const era of Object.keys(LOCAL_FORCES) as Era[]) {
    for (const r of LOCAL_FORCES[era]) {
      if (r.forces.some((f) => f.type === type)) {
        const sites = r.sites.map(siteName).join('、');
        const odds = r.chance !== undefined ? `（低機率 ${Math.round(r.chance * 100)}%）` : '';
        out.push(
          (r.fightsFor ?? 'holder') === 'holder'
            ? `🏘️ ${ERA_LABEL[era]}：${r.holder === 'player' ? '我方' : '敵方'}控制的 ${sites} 會募集此部隊`
            : r.holder === 'player'
            ? `🕵️ ${ERA_LABEL[era]}：我方控制但 ${r.unguarded ?? 0}m 內無我軍警戒的 ${sites}，可能遭此部隊滲透${odds}`
            : `🎖️ ${ERA_LABEL[era]}：敵控且無敵軍警戒的 ${sites} 外圍，可能有此部隊潛入敵後${odds}`
        );
      }
    }
  }
  return out;
}

function siteName(t: InstallationType): string {
  return SITE_TITLE[t] ?? t;
}

// ── Sites ────────────────────────────────────────────────────────────────────

const SITE_TITLE: Partial<Record<InstallationType, string>> = {
  airfield: '機場 (軍用 / 急造 / 民用 / FARP)',
  coastal_gun: '岸防砲台',
  radar_station: '雷達站',
  ammo_depot: '彈藥庫',
  settlement: '村落 / 定居點',
  town: '城鎮',
  city: '城市',
  rail_station: '(原)民用車站',
  civil_hospital: '民間醫院',
  copra_plantation: '椰乾種植園',
  civil_wharf: '民用碼頭 / 漁港',
  sugar_mill: '製糖廠 (南洋興發)',
  power_plant: '發電廠 (水力 / 火力)',
  pagoda: '佛寺 / 寶塔',
  factory: '工廠',
  refugee_camp: '難民營',
  rubber_plantation: '橡膠園',
  river_ferry: '渡口',
};

const CIVIL_EFFECT: Partial<Record<InstallationType, string>> = {
  settlement: '勢力範圍內產出 MP / PP，可募集地方部隊',
  town: '勢力範圍內產出 MP / RP / PP，可募集地方部隊',
  city: '勢力範圍內產出 MP / RP / PP，可募集地方部隊',
  rail_station: '控制時提供 TP / RP；時代五敵方控制時會出現摩托化步兵',
  civil_hospital: '勢力範圍內救治 520m 內部隊並提供 PP',
  copra_plantation: '勢力範圍內產出 RP / MP',
  civil_wharf: '控制時提供 TP',
  sugar_mill: '控制時產出 RP / PP',
  power_plant: '控制時產出 RP / PP',
  pagoda: '受保護文化設施；勢力範圍內提供 PP',
  factory: '控制時產出 RP / TP；我方控制時可募集國土防衛軍',
  refugee_camp: '受保護；遭攻擊扣除政治值',
};

const CIVILIAN_SITES: ReadonlySet<string> = new Set([
  'settlement', 'town', 'city', 'rail_station', 'civil_hospital', 'copra_plantation', 'civil_wharf', 'sugar_mill', 'power_plant', 'pagoda', 'factory', 'refugee_camp', 'rubber_plantation', 'river_ferry',
]);

// ── Ships ────────────────────────────────────────────────────────────────────

const SHIP_TITLE: Partial<Record<ShipType, string>> = {
  carrier: '艦隊航空母艦 (各時代主力)',
  battleship: '戰艦',
  cruiser: '巡洋艦',
  destroyer: '驅逐艦',
  submarine: '潛艦 (艦隊型 / U艇 / 伊號 / 威士忌 / 狐步…)',
  patrol_boat: '巡邏艇 / 魚雷快艇',
  lcvp: 'LCVP 希金斯登陸艇',
  lst: 'LST 戰車登陸艦',
  lsm_r: 'LSM(R) 火箭登陸艦',
  cve: '護航航空母艦',
};
const ENEMY_SHIP = /^(kashin|riga|foxtrot|sverdlov|kynda|petya|akizuki|chokai|kongo|osa|komar_ptg|cvhg_kiev|cgn_kirov|dd_sovremenny|dd_udaloy|ssgn_oscar|cg_slava|river_gunboat)$/;

// ── Aircraft ─────────────────────────────────────────────────────────────────

const AIR_ROLE_GROUP = (key: string, text: string): string => {
  if (/直升機|helicopter|uh1|ah1|ah64|sh60|sh3f|ch53|ch46|ka27|mi24|ho3s|lynx|uh2|sh2/i.test(key + text)) return '直升機';
  if (/預警|AEW|e2c|e3a|a50|ad3w|e1\b/i.test(key + text)) return '預警機';
  if (/反潛|ASW|巡邏|p3|s3a|s2|il38|be12|pby|af_guardian/i.test(key + text)) return '反潛 / 巡邏機';
  if (/轟炸機|bomber|B-\d|Tu-/i.test(text)) return '轟炸機';
  if (/運輸|transport|C-\d|COD/i.test(text)) return '運輸機';
  if (/攻擊|強擊|attack|俯衝|魚雷/i.test(text)) return '攻擊機';
  return '戰鬥機';
};

/** Intro text replaces the type comment as the note; the comment (eras, sources) stays as a detail line. */
function withIntro(intro: UnitIntro | undefined, comment: string, extras: string[]): string {
  if (!intro) return comment;
  if (comment) extras.unshift(`📋 ${comment}`);
  return intro[1];
}

// ── Build ────────────────────────────────────────────────────────────────────

function buildGround(): CodexEntry[] {
  // Types kept for later eras (時代六 1991-2014, 時代七 2014-) are not shown until those eras exist
  return parseUnion('GroundUnitType')
    .filter(({ comment }) => !/保留待擴充/.test(comment))
    .map(({ key, comment }) => {
    const type = key as GroundUnitType;
    let eras = erasIn(comment);
    if (eras.length === 0) eras = SUFFIX_ERA.filter(([r]) => r.test(key)).map(([, e]) => e);
    const pre = NATION_PREFIX.find(([r]) => r.test(key));
    const side: CodexSide = key.startsWith('opfor_') ? 'enemy' : pre ? pre[2] : 'player';
    const nation = key.startsWith('opfor_') ? opforNation(key, eras) : pre ? pre[1] : '美國';
    const st = GROUND_UNIT_STATS[type];
    const cls = groundSilhouetteClass(type);
    const km = GROUND_UNIT_RANGE_KM[type];
    const intro = GROUND_INTRO[type];
    const extras = localForceNotes(type);
    return {
      kind: 'ground',
      key,
      title: intro?.[0] ?? (stripEra(comment) || key),
      note: withIntro(intro, comment, extras),
      eras,
      side,
      nation,
      group: CLASS_ZH[cls] ?? cls,
      stats: st
        ? [
            { label: '兵力 (HP)', value: String(st.health) },
            { label: '防護', value: `${Math.round(st.armor * 100)}%` },
            { label: '速度', value: String(st.speed) },
            { label: '火力', value: String(st.damage) },
            { label: '射速', value: `${st.reloadTime}s` },
            { label: '射程', value: km !== undefined ? `${km} km` : '—' },
            ...(st.isAmphibious ? [{ label: '兩棲', value: '可涉水' }] : []),
          ]
        : [],
      extras,
    };
  });
}

function buildAircraft(): CodexEntry[] {
  const skip = new Set(['fighter', 'dive_bomber', 'torpedo_bomber', 'scout', 'level_bomber', 'attacker', 'aew', 'rescue', 'transport']);
  return parseUnion('AircraftModel')
    .filter((m) => !skip.has(m.key))
    .map(({ key, comment, header }) => {
      const model = key as AircraftModel;
      let eras = erasIn(comment);
      if (eras.length === 0) eras = erasIn(header);
      if (eras.length === 0 && /日軍|Kamikaze|Enemy Models/.test(header)) eras = ['era1', 'era2'];
      const side: CodexSide = /OPFOR|Enemy|日軍|Kamikaze/.test(header) ? 'enemy' : /Allied/.test(header) && !/US Cross-Add/.test(header) ? 'allied' : /Allied/.test(header) ? 'allied' : 'player';
      const extras: string[] = [];
      for (const e of eras) {
        const ew = aircraftEw(model, e);
        const parts = [ew.dispenser && `${ew.dispenser} (箔條 ${ew.chaff} / 熱焰 ${ew.flares})`, ew.jammer && `ECM ${ew.jammer.name}`, ew.irJammer && `紅外干擾 ${ew.irJammer.name}`, ew.esm && `ESM ${ew.esm.name}`, ew.rwr && `RWR ${ew.rwr}`].filter(Boolean);
        if (parts.length) extras.push(`📡 ${ERA_LABEL[e]}：${parts.join(' · ')}`);
      }
      const intro = AIR_INTRO[model];
      return {
        kind: 'aircraft',
        key,
        title: intro?.[0] ?? (comment.replace(/\s*\(.*$/, '').trim() || key.toUpperCase()),
        note: withIntro(intro, comment, extras),
        eras,
        side,
        nation: side === 'enemy' ? (eras.some((x) => x === 'era1' || x === 'era2') ? '大日本帝國' : '蘇聯 / 共產陣營') : side === 'allied' ? '盟國' : '美國',
        group: AIR_ROLE_GROUP(key, comment),
        stats: [
          { label: '機體強度', value: String(getAircraftBaseHealth(model)) },
          { label: '速度', value: String(getAircraftBaseSpeed(model)) },
        ],
        extras,
      };
    });
}

/** The navy a ship sails for, from its name prefix (enemy ships without one by era). */
function shipNation(ship: Ship, era: Era): string {
  const n = ship.name;
  const PREFIX: [RegExp, string][] = [
    [/^USS |^PBR|^LCAC/, '美國海軍'],
    [/^IJN /, '大日本帝國海軍'],
    [/^U-\d/, '德國海軍 (季風群)'],
    [/^HMS /, '英國皇家海軍'],
    [/^HMAS /, '澳洲皇家海軍'],
    [/^HMNZS /, '紐西蘭皇家海軍'],
    [/^HMCS /, '加拿大皇家海軍'],
    [/^HNLMS /, '荷蘭皇家海軍'],
    [/^FS /, '法國海軍'],
    [/^FGS /, '西德海軍'],
    [/^JDS /, '日本海上自衛隊'],
    [/^ROKS /, '大韓民國海軍'],
    [/^RVNS /, '越南共和國海軍'],
    [/^ORP /, '波蘭人民海軍'],
    [/Thälmann/, '東德人民海軍'],
    [/^朝鮮人民軍/, '朝鮮人民軍海軍'],
    [/^越南人民海軍|^解放陣線|HQ-01|T-26\d/, '越南人民海軍'],
  ];
  const hit = PREFIX.find(([re]) => re.test(n));
  if (hit) return hit[1];
  if (ship.side === 'enemy') return era === 'era1' || era === 'era2' ? '大日本帝國海軍' : '蘇聯海軍';
  return '美國海軍';
}

/** An allied surface action group's ship definition as a Ship the renderers can draw. */
function alliedDefToShip(def: AlliedSagShipDef, era: Era): Ship {
  return {
    ...(def as unknown as Ship),
    id: `codex-${def.name}`,
    side: 'allied',
    era,
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    heading: 0,
    targetHeading: 0,
    maxSpeed: def.speed,
    health: def.maxHealth,
    isSunk: false,
    sinkProgress: 0,
    wakePoints: [],
    isAlliedSAG: true,
    turrets: def.turrets.map((t) => ({ ...t, relX: t.relX ?? t.pos?.x ?? 0, relY: t.relY ?? t.pos?.y ?? 0, angle: 0 })),
  } as Ship;
}

/** The main armament in a line: the ship's armament list, or its mounts grouped by calibre. */
function armamentLine(ship: Ship): string {
  if (ship.detailedArmaments?.length) return ship.detailedArmaments.map((a) => (a.count ? `${a.name} ${/^\d+$/.test(a.count) ? `×${a.count}` : a.count}` : a.name)).join(' · ');
  const byCal = new Map<string, number>();
  for (const t of ship.turrets) {
    const c = (t as { caliber?: string }).caliber;
    if (c) byCal.set(c, (byCal.get(c) ?? 0) + 1);
  }
  const parts = [...byCal].map(([c, n]) => (n > 1 ? `${c} ×${n}` : c));
  if (ship.hasSAM && ship.samModel && !parts.some((p) => p.includes(ship.samModel!))) parts.push(ship.samModel);
  if (ship.hasASROC) parts.push('ASROC 反潛火箭');
  return parts.join(' · ');
}

const SHIP_GROUP = (ship: Ship): string => {
  const k = `${ship.type} ${ship.name}`;
  return /submarine|foxtrot|ssn|ssgn|潛艦|伊-|^U-\d/i.test(k)
    ? '潛艦'
    : /carrier|cve|cv63|cvn|lph|lha|kiev/i.test(k)
    ? '航艦 / 兩棲突擊艦'
    : /lst|lcvp|lpd|lcac|lcm|lsm/i.test(k)
    ? '兩棲艦艇'
    : /patrol|osa|komar|pbr|river_gunboat|魚雷艇|飛彈艇/i.test(k)
    ? '小型艦艇'
    : /battleship|bb_/i.test(k)
    ? '戰艦'
    : /cruiser|cg|sverdlov|kynda|kirov|chokai/i.test(k)
    ? '巡洋艦'
    : '驅逐艦 / 護衛艦';
};

/**
 * Every ship the era's fleets actually sail: our task force, the enemy's fleet and the ships that
 * join it later, and each of the allied surface action groups, under their own names. A ship that
 * sails in more than one era is one entry with all its eras. Ship types no fleet uses as such
 * (landing craft and ships delivered by reinforcement cards) keep a generic entry.
 */
function buildShips(): CodexEntry[] {
  const ERAS: Era[] = ['era1', 'era2', 'era3', 'era4', 'era5'];
  const byName = new Map<string, CodexEntry>();
  const typesSeen = new Set<string>();
  const add = (ship: Ship, era: Era, side: CodexSide) => {
    typesSeen.add(ship.type);
    const have = byName.get(ship.name);
    if (have) {
      if (!have.eras.includes(era)) have.eras.push(era);
      return;
    }
    const cls = shipClassOf(ship.name);
    const intro = SHIP_INTRO[ship.type as ShipType];
    const extras: string[] = [];
    const arms = armamentLine(ship);
    if (arms) extras.push(`🔫 武裝：${arms}`);
    const ew = shipEw({ type: ship.type, side: side === 'enemy' ? 'enemy' : 'player' }, era);
    const ewParts = [ew.esm && `ESM ${ew.esm.name}`, ew.jammer && `ECM ${ew.jammer.name}`, ew.decoys && `誘餌 ${ew.decoys.name}`, ew.noisemaker && ew.noisemaker.name, ew.moss && ew.moss.name].filter(Boolean);
    if (ewParts.length) extras.push(`📡 電子戰：${ewParts.join(' · ')}`);
    byName.set(ship.name, {
      kind: 'ship',
      key: ship.name,
      title: ship.name,
      note: cls?.[2] ?? intro?.[1] ?? '',
      eras: [era],
      side,
      nation: shipNation(ship, era),
      group: cls?.[1] ?? intro?.[0] ?? SHIP_GROUP(ship),
      stats: [
        { label: '耐久', value: String(Math.round(ship.maxHealth)) },
        { label: '最高航速', value: `${Math.round(ship.maxSpeed)} 節` },
        { label: '吃水', value: `${SHIP_DRAFT_M[ship.type as ShipType] ?? '—'} m` },
      ],
      extras,
      ship,
    });
  };
  for (const era of ERAS) {
    const { player, enemy } = codexFleetShips(era);
    for (const s of player) add(s, era, 'player');
    for (const s of enemy) add(s, era, 'enemy');
    // The allied groups are picked at random per game: draw until every option has come up
    for (let i = 0; i < 40; i++) for (const def of getAlliedSagFleet(era).ships) add(alliedDefToShip(def, era), era, 'allied');
  }
  const SIDE_ORDER: Record<CodexSide, number> = { player: 0, enemy: 1, allied: 2, neutral: 3, both: 4 };
  const ERA_ORDER = (e: CodexEntry) => Math.min(...e.eras.map((x) => ERAS.indexOf(x)));
  const real = [...byName.values()].sort((a, b) => SIDE_ORDER[a.side] - SIDE_ORDER[b.side] || ERA_ORDER(a) - ERA_ORDER(b));

  // Generic entries for the types no fleet sails under its own name
  const generic = parseUnion('ShipType')
    .filter(({ key }) => !typesSeen.has(key))
    .map(({ key, comment, header }) => {
      const type = key as ShipType;
      let eras = erasIn(comment);
      if (eras.length === 0) eras = erasIn(header);
      const enemy = ENEMY_SHIP.test(key) || /OPFOR|蘇聯|北越/.test(header + comment);
      const isGeneric = SHIP_TITLE[type] !== undefined;
      const side: CodexSide = isGeneric ? 'both' : enemy ? 'enemy' : 'player';
      const intro = SHIP_INTRO[type];
      const extras: string[] = [];
      const generalNote = isGeneric ? '各時代通用艦種：實際艦名、武裝與外觀依時代與陣營而定' : '';
      return {
        kind: 'ship' as const,
        key,
        title: intro?.[0] ?? SHIP_TITLE[type] ?? (stripEra(comment) || key),
        note: withIntro(intro, comment || generalNote, extras),
        eras,
        side,
        nation: side === 'both' ? '各國' : enemy ? '蘇聯 / 北越' : '美國海軍',
        group: /lst|lcvp|lpd|lcac|lcm|lsm/i.test(key) ? '兩棲艦艇' : '艦種',
        stats: [{ label: '吃水', value: `${SHIP_DRAFT_M[type] ?? '—'} m` }],
        extras,
      };
    });
  return [...real, ...generic];
}

function buildSites(): CodexEntry[] {
  return parseUnion('InstallationType').map(({ key, comment }) => {
    const type = key as InstallationType;
    const civil = CIVILIAN_SITES.has(key);
    const effect = CIVIL_EFFECT[type];
    return {
      kind: 'site',
      key,
      title: SITE_TITLE[type] ?? (stripEra(comment).replace(/\s*\(.*$/, '') || key),
      note: comment,
      eras: erasIn(comment),
      side: civil ? 'neutral' : 'both',
      nation: civil ? '民用' : '軍用',
      group: civil ? '民用設施' : '軍事設施',
      stats: [],
      extras: effect ? [`⚑ ${effect}`] : [],
    };
  });
}

let cache: CodexEntry[] | null = null;

export function codexEntries(): CodexEntry[] {
  cache ??= [...buildGround(), ...buildAircraft(), ...buildShips(), ...buildSites()];
  return cache;
}
