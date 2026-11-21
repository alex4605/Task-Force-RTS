import { Era, GroundUnit, GroundUnitType, Installation, Island, Ship, Vector2D } from '../../types/game';
import { createGroundUnit, createLCVP, createLST, dist, isPointInPolygon, makeInstallation } from '../procedural';
import { fitsInHold, holdUsed, shipHold } from '../naval/lift';
import { AlliedEscalation } from '../escalation';
import { groundSilhouetteClass } from '../unitPreviewRenderer';

/**
 * Allied ground operations, run by the AI alongside the player:
 * - Eras 1–2: now and then an allied beach group (an escort with landing craft or an LST) lands
 *   Commonwealth troops on an enemy-held island.
 * - Eras 3–5: an allied division command post on the mainland keeps sending formations forward.
 * Allied ground units then advance on the nearest enemy units and positions by themselves.
 */
export interface AlliedHost {
  era: Era;
  worldSize: number;
  islands: Island[];
  groundUnits: GroundUnit[];
  alliedShips: Ship[];
  /** Build an allied escort warship at a position (from the era's allied fleet list). */
  makeEscort(pos: Vector2D): Ship | null;
  /** Water route for a ship; undefined when no navigation grid is available. */
  route(ship: Ship, to: Vector2D): Vector2D[] | undefined;
  /** Snap a point to navigable water for this ship. */
  toWater(ship: Ship, p: Vector2D): Vector2D;
  /** Whether a land point is good ground for a base (not water, river, lake, marsh or mountain). */
  goodGround(p: Vector2D): boolean;
  isHostileToAllied(side: string): boolean;
  /** Terrain route for a ground unit (A* over the land grid), or null when unreachable. */
  groundRoute(unit: GroundUnit, to: Vector2D): Vector2D[] | null;
  /** How hard the allies are committing at the campaign's current stage. */
  escalation(): AlliedEscalation;
  /** Installations were added or changed (refreshes the UI's island list). */
  islandsChanged(): void;
  banner(text: string): void;
  log(text: string): void;
}

interface LandingGroup {
  id: string;
  escortId?: string;
  transportIds: string[];
  cargo: GroundUnit[];
  /** Which craft carries which units; each craft beaches and unloads on its own. */
  cargoByShip: Record<string, GroundUnit[]>;
  landed: number;
  island: Island;
  offshore: Vector2D;
  land: Vector2D;
  home: Vector2D;
  phase: 'transit' | 'withdraw';
  age: number;
  /** Per-craft progress check: last position and seconds without real headway. */
  progress: Record<string, { pos: Vector2D; stuck: number; window: number }>;
}

interface CargoPlan {
  type: GroundUnitType;
  name: string;
  /** Campaign stage from which this formation is committed (escalation tier, default 0). */
  minTier?: number;
}

/** Plans available at a stage. */
const atTier = (plans: CargoPlan[], tier: number): CargoPlan[] => plans.filter((p) => (p.minTier ?? 0) <= tier);

const LANDING_CARGO: Partial<Record<Era, { lcvp: CargoPlan[]; lst: CargoPlan[]; title: string }>> = {
  era1: {
    title: '澳紐聯軍搶灘支隊',
    lcvp: [
      { type: 'cw_infantry_ww2', name: '澳洲第7師 第2/14營 步兵排' },
      { type: 'nz_infantry_43', name: '紐西蘭第3師 第30營 步兵排' },
      { type: 'cw_infantry_ww2', name: '澳洲第7師 第2/16營 步兵排' },
      { type: 'fj_commando_43', name: '斐濟第1突擊隊 叢林偵搜排', minTier: 1 },
      { type: 'nz_infantry_43', name: '紐西蘭第3師 第37營 步兵排', minTier: 1 },
      { type: 'us_army_rifle_45', name: '美陸軍亞美利加師 第164團 步兵排', minTier: 2 },
    ],
    lst: [
      { type: 'cw_infantry_ww2', name: '澳洲第7師 第2/27營 步兵排' },
      { type: 'au_matilda', name: '澳洲第1裝甲團 瑪蒂達戰車排' },
      { type: 'nz_infantry_43', name: '紐西蘭第3師 第35營 步兵排' },
      { type: 'cw_25pdr', name: '紐西蘭第3師 第17野戰砲兵團 25磅砲連', minTier: 1 },
      { type: 'cw_bren_carrier', name: '紐西蘭第3師 偵察營 布倫載具排', minTier: 1 },
      { type: 'au_matilda', name: '澳洲第2/4裝甲團 瑪蒂達戰車排', minTier: 2 },
      { type: 'cw_infantry_ww2', name: '澳洲第7師 第2/14營 步兵排' },
    ],
  },
  era2: {
    title: '澳洲第9師搶灘支隊 (婆羅洲)',
    lcvp: [
      { type: 'cw_infantry_ww2', name: '澳洲第9師 第2/43營 步兵排' },
      { type: 'us_army_rifle_45', name: '美陸軍第41師 第163團 步兵排' },
      { type: 'cw_infantry_ww2', name: '澳洲第9師 第2/48營 步兵排' },
      { type: 'ph_guerrilla_45', name: '菲律賓美軍游擊隊 北呂宋第15步兵團 排', minTier: 1 },
      { type: 'au_commando_45', name: '澳洲第2/9 突擊中隊 排', minTier: 1 },
      { type: 'au_vickers_mg_45', name: '澳洲第9師 第2/2機槍營 維克斯排', minTier: 1 },
      { type: 'au_commando_45', name: '澳洲第2/12 突擊中隊 排', minTier: 3 },
    ],
    lst: [
      { type: 'au_matilda', name: '澳洲第2/9裝甲團 瑪蒂達戰車排' },
      { type: 'cw_infantry_ww2', name: '澳洲第9師 第2/17營 步兵排' },
      { type: 'cw_bren_carrier', name: '澳洲第9師 布倫載具排' },
      { type: 'au_matilda_frog', name: '澳洲第2/9裝甲團 瑪蒂達「青蛙」噴火戰車排', minTier: 1 },
      { type: 'cw_25pdr', name: '澳洲第9師 第2/12野戰團 25磅砲連', minTier: 1 },
      { type: 'cw_infantry_ww2', name: '澳洲第9師 第2/13營 步兵排' },
      { type: 'au_matilda', name: '澳洲第2/9裝甲團 瑪蒂達戰車排 (第2連)', minTier: 2 },
    ],
  },
};

const BASE_ROSTER: Partial<Record<Era, { base: string; forward: string; units: CargoPlan[] }>> = {
  era3: {
    base: '南韓陸軍第1師 / 大英國協第1師 聯合指揮所 [ROK 1st Div · 1st Commonwealth Div]',
    forward: '聯合國軍前進集結點 [UN Forward Assembly Area]',
    units: [
      { type: 'rok_infantry_50', name: '南韓第1師 第11團 步兵排' },
      { type: 'cw_infantry_50', name: '格洛斯特團第1營 步兵排' },
      { type: 'tr_infantry_50', name: '土耳其旅 第241團 步兵排' },
      { type: 'gr_infantry_50', name: '希臘遠征軍 斯巴達營 步兵排' },
      { type: 'cw_bren_carrier', name: '皇家諾森伯蘭燧發槍團 布倫載具排', minTier: 1 },
      { type: 'fr_infantry_50', name: '聯合國軍法國營 步兵排 (砥平里)', minTier: 1 },
      { type: 'cw_churchill_50', name: '第7皇家坦克團C中隊 邱吉爾鱷魚戰車排', minTier: 2 },
      { type: 'rok_infantry_50', name: '南韓第1師 第12團 步兵排' },
      { type: 'cw_25pdr', name: '皇家騎砲兵第45野戰團 25磅砲連', minTier: 1 },
      { type: 'rok_m36', name: '南韓陸軍 第1師 M36 驅逐戰車排', minTier: 1 },
      { type: 'cw_infantry_50', name: '皇家澳洲團第3營 步兵排', minTier: 1 },
      { type: 'cw_centurion', name: '第8皇家愛爾蘭驃騎兵 百夫長戰車排', minTier: 2 },
      { type: 'tr_infantry_50', name: '土耳其旅 第241團 刺刀突擊排', minTier: 2 },
      { type: 'cw_centurion', name: '第5皇家坦克團 百夫長戰車排', minTier: 3 },
    ],
  },
  era4: {
    base: '自由世界軍援部隊前進基地 [ARVN 1st Div · ROK 2nd Marine Bde · 1 ATF]',
    forward: '自由世界部隊火力支援基地 [Fire Support Base]',
    units: [
      { type: 'arvn_ranger_65', name: '越南共和國陸軍 第37遊騎兵營 排' },
      { type: 'rok_marine_65', name: '南韓海軍陸戰隊 青龍部隊 排' },
      { type: 'au_rar_65', name: '皇家澳洲團第6營 步兵排' },
      { type: 'rok_tiger_65', name: '南韓首都師 猛虎部隊 第1團 排' },
      { type: 'th_cobra_67', name: '泰國皇家志願團「女王眼鏡蛇」排' },
      { type: 'au_sasr_66', name: '澳洲特種空勤團 第3中隊 巡邏隊', minTier: 1 },
      { type: 'arvn_m48a3', name: '越南共和國陸軍 第20戰車團 M48A3 排', minTier: 2 },
      { type: 'arvn_m113_acav', name: '越南共和國陸軍 第1裝騎團 M113「綠龍」排', minTier: 1 },
      { type: 'nz_l5_pack', name: '紐西蘭皇家砲兵 第161砲兵連 L5 山砲排', minTier: 1 },
      { type: 'arvn_m41', name: '越南共和國陸軍 第1裝騎團 M41 戰車排', minTier: 1 },
      { type: 'au_centurion_68', name: '澳洲第1裝甲團 C中隊 百夫長戰車排', minTier: 2 },
      { type: 'rok_tiger_65', name: '南韓首都師 猛虎部隊 機甲團 排', minTier: 2 },
      { type: 'au_centurion_68', name: '澳洲第1裝甲團 B中隊 百夫長戰車排', minTier: 3 },
    ],
  },
  era5: {
    base: '西德第1軍 / 英國萊茵軍團 前進指揮所 [I. Korps · I (BR) Corps]',
    forward: '北約前進集結區 [NATO Forward Assembly Area]',
    units: [
      { type: 'frg_infantry_83', name: '西德第1裝甲擲彈兵旅 擲彈兵排' },
      { type: 'frg_marder', name: '西德第1裝甲擲彈兵旅 黃鼠狼排' },
      { type: 'uk_milan_team', name: '皇家綠夾克團第1營 MILAN 反戰車排' },
      { type: 'uk_warrior', name: '英國第7裝甲旅 武士步兵戰車排' },
      { type: 'nl_infantry_83', name: '荷蘭第1軍 第41裝甲旅 機械化步兵排' },
      { type: 'frg_luchs', name: '西德第1裝甲師 山貓裝甲偵察排', minTier: 1 },
      { type: 'uk_sas_83', name: '英國第22特種空勤團 D中隊 巡邏隊', minTier: 1 },
      { type: 'nl_leopard1', name: '荷蘭第1軍 第41裝甲旅 豹1V 戰車排', minTier: 2 },
      { type: 'frg_gepard', name: '西德第1裝甲師 獵豹防空砲排', minTier: 1 },
      { type: 'frg_leopard2', name: '西德第3裝甲師 豹2戰車排', minTier: 1 },
      { type: 'frg_m109g', name: '西德第1砲兵團 M109G 自走砲連', minTier: 2 },
      { type: 'uk_challenger1', name: '皇家驃騎兵 挑戰者戰車排', minTier: 2 },
      { type: 'frg_leopard2', name: '西德第21裝甲旅 豹2戰車排', minTier: 3 },
      { type: 'uk_challenger1', name: '第14/20國王驃騎兵 挑戰者戰車排', minTier: 3 },
    ],
  },
};

/** Allied light AA dug in beside the works, by era. */
const AA_WORK_NAME: Record<Era, string> = {
  era1: '澳軍 40mm 波佛斯防空砲陣地',
  era2: '澳軍 40mm 波佛斯防空砲陣地',
  era3: '盟軍 40mm 波佛斯 / M55 四聯裝防空陣地',
  era4: '盟軍 M42 / M163 防空砲陣地',
  era5: '北約 Gepard / Rapier 野戰防空陣地',
};

/** Field works allied infantry dig on ground they hold, by era. */
const FIELD_WORK_NAME: Record<Era, string> = {
  era1: '澳軍沙包機槍掩體 (維克斯重機槍)',
  era2: '澳軍椰木沙包機槍掩體 (維克斯重機槍)',
  era3: '盟軍沙包機槍陣地 (勃朗寧 M1919)',
  era4: '盟軍火力基地沙包掩體 (M60 機槍)',
  era5: '北約野戰射擊掩體 (MG3 / GPMG)',
};

export class AlliedOps {
  private landingTimer = 150 + Math.random() * 90;
  private groups: LandingGroup[] = [];
  private baseId: string | null = null;
  private forwardId: string | null = null;
  private baseTimer = 40;
  private rosterIdx = 0;
  private aiTimer = 0;
  private fortTimer = 25;
  private serial = 0;

  constructor(private host: AlliedHost) {}

  update(dt: number): void {
    const era = this.host.era;
    if (era === 'era1' || era === 'era2') this.updateLandings(dt);
    else this.updateBase(dt);
    this.aiTimer -= dt;
    if (this.aiTimer <= 0) {
      this.aiTimer = 2.5;
      this.updateGroundAI();
    }
    this.fortTimer -= dt;
    if (this.fortTimer <= 0) {
      // A failed attempt (nobody free to dig) is tried again soon, not given up on
      this.fortTimer = this.digIn() ? 20 + Math.random() * 10 : 6 + Math.random() * 4;
    }
  }

  /** Ships on an allied landing task are steered here, not by the allied surface-action AI. */
  steer(ship: Ship): boolean {
    if (!ship.alliedTask) return false;
    const wps = ship.order.waypoints;
    let wi = ship.order.activeWaypointIndex ?? 0;
    while (wps && wi < wps.length - 1 && dist(ship.pos, wps[wi]) < 90) wi++;
    ship.order.activeWaypointIndex = wi;
    const target = wps && wi < wps.length ? wps[wi] : ship.order.targetPos;
    if (!target) {
      ship.targetSpeed = 0;
      return true;
    }
    ship.targetHeading = Math.atan2(target.y - ship.pos.y, target.x - ship.pos.x);
    const remaining = ship.order.targetPos ? dist(ship.pos, ship.order.targetPos) : 0;
    ship.targetSpeed = remaining < 140 ? ship.maxSpeed * 0.25 : ship.maxSpeed;
    return true;
  }

  // ════ Eras 1–2: beach landing groups ════

  private updateLandings(dt: number): void {
    for (const g of [...this.groups]) this.updateGroup(g, dt);
    // Later stages run more than one beach group at a time
    if (this.groups.length >= this.host.escalation().landingGroups) return;
    this.landingTimer -= dt;
    if (this.landingTimer > 0) return;
    this.landingTimer = (300 + Math.random() * 180) * this.host.escalation().landingMul;
    this.launchLanding();
  }

  /**
   * Beach selection the way a landing staff would do it: among enemy-held islands near the
   * friendly rear, the stretch of coast covered by the fewest enemy guns.
   */
  private pickBeach(home: Vector2D): { island: Island; vertex: Vector2D } | null {
    const held = this.host.islands.filter(
      (isl) => !isl.isMainland && !isl.isFriendlyBase && isl.installations.some((i) => !i.isDestroyed && i.side === 'enemy'),
    );
    if (held.length === 0) return null;
    let best: { island: Island; vertex: Vector2D } | null = null;
    let bestScore = Infinity;
    for (const island of held) {
      const guns = island.installations.filter((i) => !i.isDestroyed && i.side === 'enemy' && i.range > 0);
      const step = Math.max(1, Math.floor(island.points.length / 48));
      for (let k = 0; k < island.points.length; k += step) {
        const v = island.points[k];
        const covered = guns.filter((g) => dist(g.pos, v) <= g.range + 300).length;
        const score = covered * 4000 + dist(v, home) * 0.35 + Math.random() * 400;
        if (score < bestScore) {
          bestScore = score;
          best = { island, vertex: v };
        }
      }
    }
    return best;
  }

  private launchLanding(): void {
    const h = this.host;
    const cargoDef = LANDING_CARGO[h.era];
    if (!cargoDef) return;
    // Allied shipping comes up from the south-west, the friendly rear area
    const rear: Vector2D = { x: 500, y: h.worldSize - 900 };
    const beach = this.pickBeach(rear);
    if (!beach) return;
    const { island, vertex } = beach;
    // The group enters the action about 3,500 m out from the beach, on the side of the rear area
    const back = { x: rear.x - vertex.x, y: rear.y - vertex.y };
    const bl = Math.hypot(back.x, back.y) || 1;
    // ... in open water clear of every island (never inside another atoll's lagoon)
    let home: Vector2D = rear;
    for (let d = 3500; d < bl; d += 400) {
      const p = { x: vertex.x + (back.x / bl) * d, y: vertex.y + (back.y / bl) * d };
      if (h.islands.every((isl) => dist(p, isl.center) > isl.radius + 450)) {
        home = p;
        break;
      }
    }
    const out = { x: vertex.x - island.center.x, y: vertex.y - island.center.y };
    const ol = Math.hypot(out.x, out.y) || 1;
    out.x /= ol;
    out.y /= ol;
    // Landing point on the beach, stepped inland until it is on the island
    let land = { x: vertex.x - out.x * 60, y: vertex.y - out.y * 60 };
    for (let k = 0; k < 12 && !isPointInPolygon(land, island.points); k++) land = { x: land.x - out.x * 20, y: land.y - out.y * 20 };

    const useLst = Math.random() < 0.5;
    const ts = ++this.serial;
    const transports: Ship[] = [];
    if (useLst) {
      const lst = createLST(`allied-lst-${ts}`, h.era === 'era2' ? 'LST-467 (盟軍戰車登陸艦)' : 'LST-338 (盟軍戰車登陸艦)', { ...home }, h.era);
      transports.push(lst);
      // Later in the campaign the LST comes with LCVPs carrying a follow-up wave of infantry
      for (let i = 0; i < this.host.escalation().extraCraft; i++) transports.push(createLCVP(`allied-lcvp-${ts}-${i}`, `盟軍 LCVP 登陸艇 ${i + 1}`, { x: home.x + 60 + i * 40, y: home.y + 40 + i * 30 }, h.era));
    } else {
      for (let i = 0; i < 3 + this.host.escalation().extraCraft; i++) transports.push(createLCVP(`allied-lcvp-${ts}-${i}`, `盟軍 LCVP 登陸艇 ${i + 1}`, { x: home.x + i * 40, y: home.y + i * 30 }, h.era));
    }
    for (const t of transports) {
      t.side = 'allied';
      t.alliedTask = 'landing';
      t.pos = h.toWater(t, t.pos);
    }

    // Cargo, checked against the LST's historical hold
    const tier = h.escalation().tier;
    const plans = atTier(useLst ? cargoDef.lst : cargoDef.lcvp, tier);
    const cargo: GroundUnit[] = [];
    const hold = useLst ? shipHold(transports[0]) : undefined;
    for (const p of plans) {
      if (hold && !fitsInHold(hold, holdUsed(cargo.map((c) => c.type)), p.type)) continue;
      cargo.push(createGroundUnit(`allied-g-${ts}-${cargo.length}`, p.type, p.name, 'allied', h.era, { ...land }));
    }
    const lstLoad = cargo.length;
    // Each additional landing craft lands one more rifle platoon
    const extras = atTier(cargoDef.lcvp, tier);
    let extraIdx = 0;
    for (let i = transports.length - (useLst ? 1 : 3); i > 0 && extras.length; i--) {
      const plan = extras[extraIdx++ % extras.length];
      cargo.push(createGroundUnit(`allied-g-${ts}-${cargo.length}`, plan.type, plan.name, 'allied', h.era, { ...land }));
    }

    const offshore = h.toWater(transports[0], { x: vertex.x + out.x * 110, y: vertex.y + out.y * 110 });
    for (const [i, t] of transports.entries()) {
      const lateral = (i - (transports.length - 1) / 2) * 60;
      const dest = h.toWater(t, { x: offshore.x - out.y * lateral, y: offshore.y + out.x * lateral });
      t.order = { type: 'move', targetPos: dest, waypoints: h.route(t, dest), activeWaypointIndex: 0 };
      h.alliedShips.push(t);
    }
    const escort = h.makeEscort({ x: home.x - 120, y: home.y + 60 });
    if (escort) {
      escort.alliedTask = 'landing';
      const station = h.toWater(escort, { x: offshore.x + out.x * 260, y: offshore.y + out.y * 260 });
      escort.order = { type: 'move', targetPos: station, waypoints: h.route(escort, station), activeWaypointIndex: 0 };
      h.alliedShips.push(escort);
    }

    const cargoByShip: Record<string, GroundUnit[]> = {};
    if (useLst) {
      // The LST carries its own load; each LCVP with it carries one of the extra rifle platoons
      cargo.forEach((u, i) => (cargoByShip[transports[i < lstLoad ? 0 : 1 + ((i - lstLoad) % (transports.length - 1))].id] ??= []).push(u));
    } else {
      cargo.forEach((u, i) => (cargoByShip[transports[i % transports.length].id] ??= []).push(u));
    }
    this.groups.push({ id: `lg-${ts}`, escortId: escort?.id, transportIds: transports.map((t) => t.id), cargo, cargoByShip, landed: 0, island, offshore, land, home, phase: 'transit', age: 0, progress: {} });
    h.banner(`⚓【盟軍搶灘支隊出航】${cargoDef.title}：${escort ? escort.name + ' 護航，' : ''}${useLst ? `戰車登陸艦${transports.length > 1 ? ` + LCVP ×${transports.length - 1}` : ''}` : `LCVP 登陸艇 ×${transports.length}`} 載運 ${cargo.length} 個排駛向「${island.name.split(' (')[0]}」！`);
  }

  private updateGroup(g: LandingGroup, dt: number): void {
    const h = this.host;
    g.age += dt;
    const ships = g.transportIds.map((id) => h.alliedShips.find((s) => s.id === id)).filter((s): s is Ship => !!s && !s.isSunk);
    const escort = g.escortId ? h.alliedShips.find((s) => s.id === g.escortId && !s.isSunk) : undefined;

    if (g.phase === 'transit') {
      const loaded = ships.filter((sh) => (g.cargoByShip[sh.id]?.length ?? 0) > 0);
      if (loaded.length === 0 || g.age > 600) {
        if (g.landed === 0) h.log(`⚠️【盟軍搶灘失敗】搶灘支隊${ships.length === 0 ? '登陸艇全數被擊沉' : '未能按時抵達灘頭'}，登陸取消。`);
        else h.banner(`🌊【盟軍搶灘完成】共 ${g.landed} 個盟軍排登上「${g.island.name.split(' (')[0]}」，向內陸推進！`);
        this.release(escort);
        this.finish(g, ships);
        return;
      }
      for (const sh of loaded) {
        // Sampled every 2 s: under 15 m of headway in that time counts as stuck
        const pr = (g.progress[sh.id] ??= { pos: { ...sh.pos }, stuck: 0, window: 0 });
        pr.window += dt;
        if (pr.window >= 2) {
          pr.stuck = dist(pr.pos, sh.pos) < 15 ? pr.stuck + pr.window : 0;
          pr.pos = { ...sh.pos };
          pr.window = 0;
        }
        const nearCoast = g.island.points.some((p) => dist(p, sh.pos) < 650);
        const arrived = dist(sh.pos, sh.order.targetPos ?? g.offshore) < 170 || (pr.stuck > 8 && nearCoast);
        if (!arrived) continue;
        this.unload(g, sh);
        const back = h.toWater(sh, g.home);
        sh.order = { type: 'move', targetPos: back, waypoints: h.route(sh, back), activeWaypointIndex: 0 };
      }
      return;
    }

    // Withdraw: empty craft head home and leave the map
    for (const s of ships) {
      if (dist(s.pos, g.home) < 260 || g.age > 900) {
        const idx = h.alliedShips.indexOf(s);
        if (idx >= 0) h.alliedShips.splice(idx, 1);
      }
    }
    if (ships.every((s) => !h.alliedShips.includes(s))) this.drop(g);
  }

  /** Ramp down: this craft's troops and tanks go ashore on the nearest stretch of beach. */
  private unload(g: LandingGroup, sh: Ship): void {
    const h = this.host;
    const units = g.cargoByShip[sh.id] ?? [];
    g.cargoByShip[sh.id] = [];
    let coast = g.island.points[0];
    for (const p of g.island.points) if (dist(p, sh.pos) < dist(coast, sh.pos)) coast = p;
    const inward = { x: g.island.center.x - coast.x, y: g.island.center.y - coast.y };
    const il = Math.hypot(inward.x, inward.y) || 1;
    let land = { x: coast.x + (inward.x / il) * 40, y: coast.y + (inward.y / il) * 40 };
    for (let k = 0; k < 15 && !isPointInPolygon(land, g.island.points); k++) land = { x: land.x + (inward.x / il) * 20, y: land.y + (inward.y / il) * 20 };
    const perp = { x: -inward.y / il, y: inward.x / il };
    units.forEach((u, i) => {
      const off = (i - (units.length - 1) / 2) * 30;
      let p = { x: land.x + perp.x * off, y: land.y + perp.y * off };
      if (!isPointInPolygon(p, g.island.points)) p = { ...land };
      u.pos = p;
      u.order = { type: 'idle' };
      u.isSupplied = true;
      h.groundUnits.push(u);
    });
    g.landed += units.length;
    if (units.length) h.log(`🌊【盟軍登陸艇搶灘】「${sh.name}」放下跳板，${units.map((u) => u.name).join('、')} 衝上灘頭！`);
  }

  private release(escort?: Ship): void {
    if (escort) escort.alliedTask = undefined; // back under the allied surface-action AI
  }

  private finish(g: LandingGroup, ships: Ship[]): void {
    g.phase = 'withdraw';
    for (const s of ships) {
      const back = this.host.toWater(s, g.home);
      s.order = { type: 'move', targetPos: back, waypoints: this.host.route(s, back), activeWaypointIndex: 0 };
    }
    if (ships.length === 0) this.drop(g);
  }

  private drop(g: LandingGroup): void {
    this.groups = this.groups.filter((x) => x !== g);
  }

  // ════ Eras 3–5: allied mainland base ════

  private findBase(): Installation | undefined {
    if (!this.baseId) return undefined;
    for (const isl of this.host.islands) {
      const b = isl.installations.find((i) => i.id === this.baseId);
      if (b) return b;
    }
    return undefined;
  }

  /** Place the allied command post on good ground near the US headquarters on the mainland. */
  private establishBase(): void {
    const h = this.host;
    const roster = BASE_ROSTER[h.era];
    const mainland = h.islands.find((i) => i.isMainland);
    if (!roster || !mainland) return;
    const hq = mainland.installations.find((i) => i.side === 'player' && (i.type === 'command_post' || i.type === 'battalion_cp')) ?? mainland.installations.find((i) => i.side === 'player');
    const anchor = hq?.pos ?? mainland.center;
    const all = mainland.installations;
    // Best site: good ground, clear of other installations, as far from enemy positions as possible
    let best: Vector2D | null = null;
    let bestScore = -Infinity;
    for (let ring = 500; ring <= 1800; ring += 130) {
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2;
        const p = { x: anchor.x + Math.cos(a) * ring, y: anchor.y + Math.sin(a) * ring };
        if (!isPointInPolygon(p, mainland.points) || !h.goodGround(p)) continue;
        if (all.some((i) => dist(i.pos, p) < 220)) continue;
        let enemy = Infinity;
        for (const i of all) if (i.side === 'enemy' && !i.isDestroyed) enemy = Math.min(enemy, dist(i.pos, p));
        const score = Math.min(enemy, 3000) - ring * 0.3;
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
    }
    if (best) {
      const base = makeInstallation({ id: `allied-base-${h.era}`, type: 'battalion_cp', name: roster.base, side: 'allied', pos: best, health: 4200, armor: 0.5 });
      mainland.installations.push(base);
      h.islandsChanged();
      this.baseId = base.id;
      h.log(`🏳️【盟軍前進基地進駐】${roster.base} 已在大陸前線開設，將定期派出盟軍部隊協同推進。`);
      return;
    }
    this.baseId = 'none';
  }

  private updateBase(dt: number): void {
    if (!this.baseId) this.establishBase();
    const base = this.findBase();
    if (!base || base.isDestroyed) return;
    this.baseTimer -= dt;
    if (this.baseTimer > 0) return;
    const esc = this.host.escalation();
    this.baseTimer = (70 + Math.random() * 30) * esc.spawnMul;
    const h = this.host;
    const roster = BASE_ROSTER[h.era];
    if (!roster) return;
    const alive = h.groundUnits.filter((u) => u.side === 'allied' && !u.isDestroyed).length;
    if (alive >= esc.maxUnits) return;
    const plans = atTier(roster.units, esc.tier);
    // From the full-scale stage on, a forward assembly point behind the captured line shortens the march
    const forward = esc.tier >= 2 ? this.ensureForward(roster.forward) : undefined;
    const from = forward && !forward.isDestroyed ? forward : base;
    const names: string[] = [];
    for (let k = 0; k < esc.echelon && alive + k < esc.maxUnits; k++) {
      const plan = plans[this.rosterIdx++ % plans.length];
      const a = Math.random() * Math.PI * 2;
      const u = createGroundUnit(`allied-base-u-${++this.serial}`, plan.type, plan.name, 'allied', h.era, { x: from.pos.x + Math.cos(a) * 80, y: from.pos.y + Math.sin(a) * 80 });
      u.isSupplied = true;
      h.groundUnits.push(u);
      names.push(plan.name);
    }
    const src = (from === base ? roster.base : roster.forward).split(' [')[0];
    if (names.length > 1) h.log(`🪖【盟軍梯隊投入】${names.length} 個單位自 ${src} 開出：${names.join('、')}。`);
    else if (names.length) h.log(`🪖【盟軍部隊出發】「${names[0]}」自 ${src} 開出，向前線推進。`);
  }

  // ════ Field works ════

  /**
   * Allied infantry holding ground dig in: a sandbagged MG position on the spot, preferably at a
   * captured stronghold or covering the approach to the allied base. Works keep firing for the
   * allies at enemy troops that come back.
   */
  private digIn(): boolean {
    const h = this.host;
    const esc = h.escalation();
    if (!esc.fortify) return true;
    const works: Installation[] = [];
    for (const isl of h.islands) for (const i of isl.installations) if (!i.isDestroyed && i.id.startsWith('allied-work-')) works.push(i);
    // Every third work is a light AA position, so the ground held is not left open from the air
    const aaWorks = works.filter((w) => w.type === 'flak_battery').length;
    const wantAA = aaWorks < Math.floor((works.length + 1) / 3) + (works.length >= 2 && aaWorks === 0 ? 1 : 0);
    if (works.length >= esc.maxWorks + Math.ceil(esc.maxWorks / 2)) return true;
    if (!wantAA && works.filter((w) => w.type !== 'flak_battery').length >= esc.maxWorks) return true;
    const enemies = h.groundUnits.filter((u) => u.side === 'enemy' && !u.isDestroyed && !u.embarkedInShipId);
    const captured: Vector2D[] = [];
    for (const isl of h.islands) for (const sh of isl.strongholds ?? []) if (sh.isCaptured) captured.push(sh.cpPos);
    let best: { unit: GroundUnit; island: Island; score: number } | null = null;
    for (const u of h.groundUnits) {
      if (u.side !== 'allied' || u.isDestroyed || u.embarkedInShipId) continue;
      // Troops holding ground (idle, or on a hold / defend order) can dig; units on the move cannot
      if (u.order.type === 'move' || u.order.type === 'attack') continue;
      const kind = groundSilhouetteClass(u.type);
      if (kind !== 'infantry' && kind !== 'engineer') continue;
      if (works.some((w) => dist(w.pos, u.pos) < (wantAA ? (w.type === 'flak_battery' ? 450 : 90) : 320))) continue;
      if (enemies.some((e) => dist(e.pos, u.pos) < 260)) continue; // not under direct fire
      const island = h.islands.find((isl) => isPointInPolygon(u.pos, isl.points));
      if (!island) continue;
      let score = 0;
      for (const c of captured) score = Math.max(score, 1000 - dist(c, u.pos));
      score += Math.random() * 200;
      if (!best || score > best.score) best = { unit: u, island, score };
    }
    if (!best) return false;
    const { unit, island } = best;
    // Face the nearest enemy, or away from the island centre (the likely counter-landing coast)
    const threat = enemies.reduce<GroundUnit | null>((m, e) => (!m || dist(e.pos, unit.pos) < dist(m.pos, unit.pos) ? e : m), null);
    const facing = threat
      ? Math.atan2(threat.pos.y - unit.pos.y, threat.pos.x - unit.pos.x)
      : Math.atan2(unit.pos.y - island.center.y, unit.pos.x - island.center.x);
    const pos = { x: unit.pos.x + Math.cos(facing) * 35, y: unit.pos.y + Math.sin(facing) * 35 };
    const work = wantAA
      ? makeInstallation({
          id: `allied-work-${++this.serial}`,
          type: 'flak_battery',
          name: AA_WORK_NAME[h.era],
          weaponDesc: '盟軍就地構築之防空砲陣地 · 掩護已奪取的陣地不受空襲',
          side: 'allied',
          pos,
          angle: facing,
          health: 1000,
          armor: 0.35,
          range: h.era === 'era5' ? 1300 : 1000,
          cooldown: 0.5,
          reloadTime: 1.6,
        })
      : makeInstallation({
          id: `allied-work-${++this.serial}`,
          type: 'bunker_nest',
          name: FIELD_WORK_NAME[h.era],
          weaponDesc: '盟軍步兵就地構築之沙包機槍掩體 · 扼守已奪取的陣地',
          side: 'allied',
          pos,
          angle: facing,
          health: 1100,
          armor: 0.45,
          range: 520,
          reloadTime: 1.6,
        });
    island.installations.push(work);
    h.islandsChanged();
    h.log(`🛠️【盟軍就地構工】「${unit.name}」在${island.isMainland ? '前線' : `「${island.name.split(' (')[0]}」`}構築${work.name}，鞏固已奪取的陣地。`);
    return true;
  }

  /**
   * Forward assembly point: at the captured mainland stronghold furthest from the allied base
   * (the most advanced ground held), set up once and reused.
   */
  private ensureForward(name: string): Installation | undefined {
    const h = this.host;
    if (this.forwardId) {
      for (const isl of h.islands) {
        const f = isl.installations.find((i) => i.id === this.forwardId);
        if (f) return f;
      }
      return undefined;
    }
    const base = this.findBase();
    const mainland = h.islands.find((i) => i.isMainland);
    if (!base || !mainland) return undefined;
    const held = (mainland.strongholds ?? []).filter((sh) => sh.isCaptured);
    if (held.length === 0) return undefined;
    held.sort((p, q) => dist(q.cpPos, base.pos) - dist(p.cpPos, base.pos));
    for (const sh of held) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const p = { x: sh.cpPos.x + Math.cos(a) * 180, y: sh.cpPos.y + Math.sin(a) * 180 };
        if (!isPointInPolygon(p, mainland.points) || !h.goodGround(p)) continue;
        if (mainland.installations.some((i) => !i.isDestroyed && dist(i.pos, p) < 120)) continue;
        const fwd = makeInstallation({ id: `allied-forward-${h.era}`, type: 'command_post', name: name, side: 'allied', pos: p, health: 2600, armor: 0.45 });
        mainland.installations.push(fwd);
        this.forwardId = fwd.id;
        h.islandsChanged();
        h.banner(`🏳️【盟軍前進集結點開設】${name.split(' [')[0]} 已在「${sh.name.split(' [')[0]}」後方開設，盟軍部隊將直接自前線投入！`);
        return fwd;
      }
    }
    return undefined;
  }

  // ════ Allied ground AI ════

  /** Idle allied units advance on the nearest enemy unit or position within reach. */
  private updateGroundAI(): void {
    const h = this.host;
    const enemies = h.groundUnits.filter((u) => u.side === 'enemy' && !u.isDestroyed && !u.embarkedInShipId);
    // Formations from the base move off together, three at a time, rather than piecemeal
    const base = this.findBase();
    const atBase = base && !base.isDestroyed
      ? h.groundUnits.filter((u) => u.side === 'allied' && !u.isDestroyed && u.order.type === 'idle' && dist(u.pos, base.pos) < 600)
      : [];
    const holdAtBase = atBase.length > 0 && atBase.length < 3;
    const tier = h.escalation().tier;
    // Captured strongholds with no friendly troops near them: one allied infantry unit holds each,
    // so the player's forces are free to push on
    const garrisonNeeded: Vector2D[] = [];
    if (tier >= 1) {
      const friendly = h.groundUnits.filter((u) => u.side !== 'enemy' && !u.isDestroyed && !u.embarkedInShipId);
      for (const isl of h.islands) {
        for (const sh of isl.strongholds ?? []) {
          if (sh.isCaptured && !friendly.some((u) => dist(u.pos, sh.cpPos) < 450)) garrisonNeeded.push(sh.cpPos);
        }
      }
    }
    for (const u of h.groundUnits) {
      if (u.side !== 'allied' || u.isDestroyed || u.embarkedInShipId) continue;
      u.isSupplied = true; // own logistics
      if (u.order.type !== 'idle') continue;
      if (holdAtBase && atBase.includes(u)) continue;
      // Rifle units peel off to garrison an unheld stronghold on their own landmass
      if (garrisonNeeded.length && groundSilhouetteClass(u.type) === 'infantry') {
        const isl = h.islands.find((i) => isPointInPolygon(u.pos, i.points));
        const gi = garrisonNeeded.findIndex((p) => isl && isPointInPolygon(p, isl.points) && dist(p, u.pos) < 4000);
        if (gi >= 0) {
          const post = garrisonNeeded.splice(gi, 1)[0];
          const route = h.groundRoute(u, post);
          if (route && route.length) {
            u.order = { type: 'move', targetPos: { ...route[route.length - 1] }, waypoints: route, activeWaypointIndex: 0, routed: true };
            u.holdPost = { ...post };
            continue;
          }
        }
      }
      // Garrisons stay on their post
      if (u.holdPost && dist(u.pos, u.holdPost) < 500) continue;
      // Candidate objectives: enemy units within 3.2 km, then enemy positions on this landmass,
      // nearest first, taking the first one reachable over land
      const cands: { pos: Vector2D; d: number }[] = [];
      for (const e of enemies) {
        const d = dist(u.pos, e.pos);
        if (d < (tier >= 4 ? 9000 : tier >= 3 ? 5000 : 3200)) cands.push({ pos: e.pos, d });
      }
      {
        for (const isl of h.islands) {
          if (!isPointInPolygon(u.pos, isl.points)) continue;
          for (const inst of isl.installations) {
            if (!inst.isDestroyed && h.isHostileToAllied(inst.side)) cands.push({ pos: inst.pos, d: dist(u.pos, inst.pos) });
          }
        }
      }
      cands.sort((p, q) => p.d - q.d);
      for (const c of cands.slice(0, 6)) {
        if (c.d < u.range * 0.8) break; // already in range: the combat logic takes over
        const route = h.groundRoute(u, c.pos);
        if (!route || route.length === 0) continue;
        // Halt the advance once the objective is within firing range
        let cut = route.length;
        for (let i = 0; i < route.length; i++) {
          if (dist(route[i], c.pos) < u.range * 0.7) {
            cut = i + 1;
            break;
          }
        }
        const wps = route.slice(0, cut);
        u.order = { type: 'move', targetPos: { ...wps[wps.length - 1] }, waypoints: wps, activeWaypointIndex: 0, routed: true };
        break;
      }
    }
  }
}
