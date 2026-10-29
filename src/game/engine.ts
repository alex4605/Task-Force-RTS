import {
  Ship,
  Aircraft,
  AircraftModel,
  AircraftRole,
  AircraftPayloadType,
  PAYLOAD_CATALOG,
  AirWingLoadout,
  Island,
  IslandStronghold,
  Installation,
  Projectile,
  Particle,
  Vector2D,
  Turret,
  SectorIntel,
  FleetFormation,
  GameScore,
  Era,
  UnitOrder,
  CombatLogEntry,
  GroundUnit,
  GroundUnitType,
  EnemyAirMissionType,
  RequisitionItem,
  CasualtiesReport,
  ResourceState,
  LifeRaft,
  NuclearDetonation,
} from '../types/game';
import {
  generateSector,
  isPointInPolygon,
  dist,
  distToShipHull,
  createGroundUnit,
  createLCVP,
  createLST,
  createLSMR,
  createCVE,
  createTokyoExpressDD,
  createConvoyEscortShip,
  createPlayerBattleship,
  createCV63,
  createBelknapCG,
  createAdamsDDG,
  createLPHIwoJima,
  createLCM8,
  createKomarMissileBoat,
  createForrestShermanDD,
  createKnoxFFG,
} from './procedural';
import { soundEngine } from './audio';

export interface BattleAlertBanner {
  id: string;
  text: string;
  side: 'player' | 'enemy';
  type: 'sunk' | 'down' | 'capture' | 'winchester' | 'alert';
  duration: number;
}

export class GameEngine {
  public sectorNumber: number = 1;
  public era: Era = 'era1';
  public worldSize: number = 4200;
  public islands: Island[] = [];
  public friendlyBase: Island | null = null;
  public playerShips: Ship[] = [];
  public enemyShips: Ship[] = [];
  public groundUnits: GroundUnit[] = [];
  public aircraft: Aircraft[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];

  // ══════════════════════════════════════════════════════════
  // 戰區資源點數 (Command Points) 與 後勤採購系統
  // ══════════════════════════════════════════════════════════
  public resourcePoints: number = 1200;
  public commandPointsPerSec: number = 15; // 基礎每秒產出提升3倍 (15 CP/s)
  public totalCpEarned: number = 1200;
  public totalCpSpent: number = 0;

  // ══════════════════════════════════════════════════════════
  // 雙方戰損總表 (Casualties Summary & Force Balance)
  // ══════════════════════════════════════════════════════════
  public casualties: CasualtiesReport = {
    playerShipsLost: 0,
    enemyShipsLost: 0,
    playerPlanesLost: 0,
    enemyPlanesLost: 0,
    playerGroundLost: 0,
    enemyGroundLost: 0,
    playerInstallationsLost: 0,
    enemyInstallationsLost: 0,
    playerTonnageLost: 0,
    enemyTonnageLost: 0,
    directHitsScored: 0,
    torpedoHitsScored: 0,
    critsScored: 0,
  };

  // ══════════════════════════════════════════════════════════
  // 頂部高對比即時擊沉戰報橫條 (Top High-Contrast Battle Ticker)
  // ══════════════════════════════════════════════════════════
  public activeBannerAlerts: BattleAlertBanner[] = [];

  // ══════════════════════════════════════════════════════════
  // 時代三搜救救生筏與全域預警 (Era 3 SAR Rafts & Global AEW)
  // ══════════════════════════════════════════════════════════
  public lifeRafts: LifeRaft[] = [];
  public hasAD3WOnStation: boolean = false;

  // ══════════════════════════════════════════════════════════
  // 時代三戰術核打擊全景視覺系統 (Era 3 Tactical Nuclear Strike System)
  // ══════════════════════════════════════════════════════════
  public nuclearFlash: number = 0;
  public nuclearDetonations: NuclearDetonation[] = [];
  public hasPlayerUsedNuke: boolean = false;
  public hasOpforRetaliatedNuke: boolean = false;
  public opforNukeCheckTimer: number = 0;

  // Friendly Airbase (AFB) plane reserve pool & replenishment
  public airbasePlanes: Record<string, number> = {};
  public airbaseReplenishTimer: number = 45;
  public airbaseReplenishMax: number = 45;

  // Scheduled Convoy Reinforcement & Escort Fleet
  public convoyReinforceTimer: number = 100;
  public convoyReinforceMax: number = 100;
  public nextConvoyEscort: 'ss' | 'dd' | 'cl' | 'ca' = 'dd';

  // 8 大日軍戰術空中任務編組計時器 (Tactical Air Mission Timers)
  private enemyAirStrikeTimer: number = 65; // 主力 Strike Package 攻擊波
  private enemySweepTimer: number = 38;      // Air Sweep 搶制空權戰巡
  private enemyCasTimer: number = 55;        // CAS 密接支援反陸戰隊
  private enemyCapTimer: number = 25;        // CAP 防空巡邏軌道
  private enemyScrambleCooldown: number = 0; // 緊急升空冷卻
  private enemyDcaCooldown: number = 0;      // 防空攔截冷卻

  // 1942 Era 1 Tokyo Express DD timer
  public tokyoExpressTimer: number = 120;

  // Era 3 Continental Frontline Automated Reinforcement Timers
  public frontlineWaveTimer: number = 40;
  public enemyFrontlineWaveTimer: number = 55;
  public usaafSortieTimer: number = 65; // USAAF 第5航空隊自動出擊計時器 (60-90s)
  public komarRaidTimer: number = 95; // OPFOR 飛彈快艇狼群突擊計時器 (90-120s)
  private civilianCollateralCooldowns: Record<string, number> = {};

  public selectedUnitIds: string[] = [];
  public formation: FleetFormation = 'independent_rts';

  public score: GameScore = {
    enemyShipsSunk: 0,
    enemyPlanesDowned: 0,
    installationsDestroyed: 0,
    sectorsCleared: 0,
    totalScore: 0,
    stars: 12,
  };

  public sectorIntel: SectorIntel | null = null;
  public isVictory: boolean = false;
  public isDefeat: boolean = false;
  public isPaused: boolean = true;
  public gameSpeed: number = 1.0;
  public gameTime: number = 0;

  // Real-time Tactical Battle Log & State Version Counters (Performance Optimization)
  public combatLogs: CombatLogEntry[] = [];
  public combatLogsVersion: number = 0;
  public islandsVersion: number = 0;

  // Active ordnance loadouts for each aircraft role
  public activePayloads: Record<AircraftRole, AircraftPayloadType> = {
    fighter: 'clean_guns',
    dive_bomber: 'bomb_1000',
    torpedo_bomber: 'aerial_torpedo',
    scout: 'scout_fuel',
    level_bomber: 'bomb_1000',
    attacker: 'hvar_rockets',
    aew: 'clean_guns',
    rescue: 'clean_guns',
    transport: 'c1_paratroopers',
  };

  public addCombatLog(entry: Omit<CombatLogEntry, 'id' | 'timestamp' | 'timeStr'>) {
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const log: CombatLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: this.gameTime,
      timeStr,
    };
    this.combatLogs.unshift(log);
    if (this.combatLogs.length > 120) {
      this.combatLogs.pop();
    }
    this.combatLogsVersion++;
  }

  public addBannerAlert(
    text: string,
    side: 'player' | 'enemy',
    type: 'sunk' | 'down' | 'capture' | 'winchester' | 'alert',
    duration: number = 6.0
  ) {
    const banner: BattleAlertBanner = {
      id: `banner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      side,
      type,
      duration,
    };
    this.activeBannerAlerts.unshift(banner);
    if (this.activeBannerAlerts.length > 4) {
      this.activeBannerAlerts.pop();
    }
  }

  public getResourceState(): ResourceState {
    const capturedIslands = this.islands.filter((i) => i.isFullyCaptured || i.isFriendlyBase).length;
    const islandBonus = capturedIslands * 2.5;
    return {
      points: Math.floor(this.resourcePoints),
      ratePerSecond: this.commandPointsPerSec + islandBonus,
      totalEarned: Math.floor(this.totalCpEarned),
      totalSpent: Math.floor(this.totalCpSpent),
      islandBonus,
      killBonus: 0,
    };
  }

  private flakBarrageTimer: number = 0;

  constructor(sector: number = 1, era: Era = 'era1') {
    this.era = era;
    this.loadSector(sector, era);
  }

  public setRolePayload(role: AircraftRole, payload: AircraftPayloadType) {
    this.activePayloads[role] = payload;
  }

  public loadSector(sectorNum: number, era: Era = this.era) {
    this.sectorNumber = sectorNum;
    this.era = era;
    const generated = generateSector(sectorNum, era);
    this.worldSize = generated.worldSize;
    this.islands = generated.islands;
    this.friendlyBase = generated.friendlyBase;
    this.playerShips = generated.playerShips;
    this.enemyShips = generated.enemyShips;
    this.groundUnits = generated.groundUnits;
    this.sectorIntel = generated.briefing;
    this.aircraft = [];
    this.projectiles = [];
    this.particles = [];
    this.isVictory = false;
    this.isDefeat = false;
    this.isPaused = true;
    this.gameTime = 0;
    this.combatLogs = [];
    this.combatLogsVersion++;
    this.islandsVersion++;
    this.selectedUnitIds = [];

    // Initialize friendly airbase planes & replenishment timers (包含水平轟炸機、陸基戰鬥機、陸基攻擊機)
    this.airbasePlanes =
      this.era === 'era1'
        ? { b17: 6, p40: 8, a20: 6, f4f: 8, sbd: 8, tbd: 6, os2u: 2 }
        : this.era === 'era2'
        ? { b24: 6, p51: 8, p47: 6, p38: 4, f6f: 10, f4u: 8, sb2c: 8, tbf: 8, sc1: 2 }
        : this.era === 'era3'
        ? { b29: 6, f86: 8, a26: 6, f9f: 8, f2h: 6, ad1: 8, f4u4: 6, af_guardian: 4, ad3w: 2, ho3s1: 2 }
        : { b52: 4, f4e: 8, f105: 8, a7: 8, ov10: 6, uh1: 6, ah1: 6, f4j: 6, a6a: 6, e1: 2, c1: 4 };
    this.airbaseReplenishTimer = this.airbaseReplenishMax;
    this.convoyReinforceTimer = this.convoyReinforceMax;
    this.tokyoExpressTimer = 120;
    this.lifeRafts = [];

    // Initial deployment combat log
    const flagName =
      this.era === 'era1'
        ? '企業號 (CV-6 Enterprise)'
        : this.era === 'era2'
        ? '艾塞克斯號 (CV-9 Essex)'
        : this.era === 'era3'
        ? '奧里斯卡尼號 (CV-34 Oriskany SCB-27A)'
        : '小鷹號 (CV-63 Kitty Hawk 超級航母)';
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: flagName,
      targetName: this.sectorIntel?.sectorName || '作戰海域',
      actionType: 'recon_spotted',
      text: `【戰備就緒】特混艦隊旗艦「${flagName}」進入 ${this.sectorIntel?.sectorName || '戰區'}。後方前進空軍基地 (AFB) 與兩棲登陸船團已集結完畢，完成戰前配置即可出擊！`,
    });

    // Select flagship carrier by default
    const flagship = this.getFlagship();
    if (flagship) {
      this.selectedUnitIds = [flagship.id];
    }

    // Launch initial CAP flights (2 fighters on patrol over battle group)
    if (this.era === 'era1') {
      this.launchAircraft('f4f', 2);
    } else if (this.era === 'era2') {
      this.launchAircraft('f6f', 2);
    } else if (this.era === 'era3') {
      this.launchAircraft('f9f', 2);
      this.launchAircraft('ad3w', 1);
    } else {
      this.launchAircraft('f4b', 2);
      this.launchAircraft('e1', 1);
    }
  }

  public getFlagship(): Ship | undefined {
    return this.playerShips.find((s) => s.isFlagship && !s.isSunk);
  }

  public setEra(newEra: Era) {
    if (this.era !== newEra) {
      this.era = newEra;
      this.loadSector(this.sectorNumber, newEra);
    }
  }

  // ══════════════════════════════════════════════════════════
  // RTS SELECTION & COMMAND PIPELINE
  // ══════════════════════════════════════════════════════════

  public selectUnits(unitIds: string[], append: boolean = false) {
    if (append) {
      const set = new Set([...this.selectedUnitIds, ...unitIds]);
      this.selectedUnitIds = Array.from(set);
    } else {
      this.selectedUnitIds = [...unitIds];
    }
  }

  public clearSelection() {
    this.selectedUnitIds = [];
  }

  // Pre-fill / Pre-load Carrier Air Groups before battle starts
  public applyAirWingLoadout(loadout: Partial<AirWingLoadout> & {
    fighters: number;
    diveBombers: number;
    torpedoBombers: number;
    scouts: number;
    preLaunchCAP: boolean;
    preLaunchScout: boolean;
  }) {
    const flagship = this.getFlagship();
    if (!flagship || !flagship.carrierPlanes) return;

    if (loadout.fighterPayload) this.activePayloads.fighter = loadout.fighterPayload;
    if (loadout.diveBomberPayload) this.activePayloads.dive_bomber = loadout.diveBomberPayload;
    if (loadout.torpedoBomberPayload) this.activePayloads.torpedo_bomber = loadout.torpedoBomberPayload;
    if (loadout.scoutPayload) this.activePayloads.scout = loadout.scoutPayload;

    if (this.era === 'era1') {
      flagship.carrierPlanes.ready.f4f = loadout.fighters;
      flagship.carrierPlanes.ready.sbd = loadout.diveBombers;
      flagship.carrierPlanes.ready.tbd = loadout.torpedoBombers;
      flagship.carrierPlanes.ready.os2u = loadout.scouts;
    } else if (this.era === 'era2') {
      const f6fCount = Math.ceil(loadout.fighters * 0.6);
      const f4uCount = Math.floor(loadout.fighters * 0.4);
      flagship.carrierPlanes.ready.f6f = f6fCount;
      flagship.carrierPlanes.ready.f4u = f4uCount;
      flagship.carrierPlanes.ready.f8f = 2;
      flagship.carrierPlanes.ready.sb2c = loadout.diveBombers;
      flagship.carrierPlanes.ready.tbf = loadout.torpedoBombers;
      flagship.carrierPlanes.ready.sc1 = loadout.scouts; // SC-1 Seahawk replaces OS2U in Era 2
    } else if (this.era === 'era3') {
      // 時代三 (1950-1953) 艦載聯隊編裝
      const f9fCount = Math.ceil(loadout.fighters * 0.6);
      const f2hCount = Math.floor(loadout.fighters * 0.4);
      flagship.carrierPlanes.ready.f9f = f9fCount;
      flagship.carrierPlanes.ready.f2h = f2hCount;
      flagship.carrierPlanes.ready.f8f = 4;
      flagship.carrierPlanes.ready.f4u4 = 4;
      flagship.carrierPlanes.ready.ad1 = loadout.diveBombers;
      flagship.carrierPlanes.ready.af_guardian = loadout.torpedoBombers;
      flagship.carrierPlanes.ready.ad3w = 2;
      flagship.carrierPlanes.ready.ho3s1 = 2;
    } else {
      // 時代四 (1965-1973) 超級航母艦載聯隊編裝 (CV-63 Kitty Hawk)
      const f4Count = Math.ceil(loadout.fighters * 0.6);
      const f8Count = Math.floor(loadout.fighters * 0.4);
      flagship.carrierPlanes.ready.f4b = f4Count;
      flagship.carrierPlanes.ready.f4j = 4;
      flagship.carrierPlanes.ready.f8 = f8Count;
      flagship.carrierPlanes.ready.a4 = loadout.diveBombers;
      flagship.carrierPlanes.ready.a6a = loadout.torpedoBombers;
      flagship.carrierPlanes.ready.a6b_weasel = 2;
      flagship.carrierPlanes.ready.e1 = 2;
      flagship.carrierPlanes.ready.s2 = 4;
      flagship.carrierPlanes.ready.uh2 = 2;
      flagship.carrierPlanes.ready.c1 = 2;
    }

    if (loadout.preLaunchCAP) {
      const fModel = this.era === 'era1' ? 'f4f' : this.era === 'era2' ? 'f6f' : this.era === 'era3' ? 'f9f' : 'f4b';
      this.launchAircraft(fModel, 2);
    }

    if (loadout.preLaunchScout) {
      const sModel = this.era === 'era1' ? 'os2u' : this.era === 'era2' ? 'sc1' : this.era === 'era3' ? 'ad3w' : 'e1';
      this.launchAircraft(sModel, 1);
    }
  }

  // Reliable Stop / Halt for Ships and Units
  public stopUnits(unitIds?: string[]) {
    const ids = unitIds || this.selectedUnitIds;
    const ships = this.playerShips.filter((s) => ids.includes(s.id));
    const planes = this.aircraft.filter((a) => ids.includes(a.id));
    const ground = this.groundUnits.filter((u) => ids.includes(u.id));

    ships.forEach((s) => {
      s.targetSpeed = 0;
      s.order = { type: 'idle' };
    });

    planes.forEach((p) => {
      p.order = { type: 'patrol', patrolOrigin: { ...p.pos } };
      p.state = 'patrolling';
    });

    ground.forEach((u) => {
      u.speed = 0;
      u.order = { type: 'idle' };
    });
  }

  // Issue RTS Order to Selected Units
  public issueOrderToSelected(order: UnitOrder) {
    if (this.selectedUnitIds.length === 0) return;

    const selectedShips = this.playerShips.filter((s) => this.selectedUnitIds.includes(s.id) && !s.isSunk);
    const selectedPlanes = this.aircraft.filter((a) => this.selectedUnitIds.includes(a.id) && a.side === 'player' && a.state !== 'shot_down');
    const selectedGround = this.groundUnits.filter((u) => this.selectedUnitIds.includes(u.id) && u.side === 'player' && !u.isDestroyed);

    // 1. Order Ships
    selectedShips.forEach((ship, idx) => {
      // Calculate formation offset if multiple ships moving together
      let targetPos = order.targetPos ? { ...order.targetPos } : undefined;
      if (targetPos && selectedShips.length > 1) {
        const offsetDist = 90;
        const offsetAngle = (idx / selectedShips.length) * Math.PI * 2;
        targetPos.x += Math.cos(offsetAngle) * offsetDist;
        targetPos.y += Math.sin(offsetAngle) * offsetDist;
      }

      ship.order = {
        ...order,
        targetPos,
      };

      if (order.type === 'move' && targetPos) {
        const dx = targetPos.x - ship.pos.x;
        const dy = targetPos.y - ship.pos.y;
        ship.targetHeading = Math.atan2(dy, dx);
        ship.targetSpeed = ship.maxSpeed;
      } else if (order.type === 'idle') {
        ship.targetSpeed = 0;
      }
    });

    // 2. Order Aircraft
    selectedPlanes.forEach((plane, idx) => {
      let targetPos = order.targetPos ? { ...order.targetPos } : undefined;
      if (targetPos && selectedPlanes.length > 1) {
        targetPos.x += (idx - (selectedPlanes.length - 1) / 2) * 35;
        targetPos.y += (idx % 2) * 25;
      }

      plane.order = {
        ...order,
        targetPos,
      };

      if (order.type === 'move' && targetPos) {
        plane.state = 'cruising';
        plane.targetHeading = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
      } else if (order.type === 'attack') {
        plane.state = plane.role === 'dive_bomber' ? 'cruising' : 'cruising';
      } else if (order.type === 'patrol') {
        plane.state = 'patrolling';
        plane.order.patrolOrigin = targetPos || { ...plane.pos };
      } else if (order.type === 'rtb') {
        plane.state = 'returning';
      }
    });

    // 3. Order Ground Units (USMC Infantry, LVT Mech, Tanks)
    selectedGround.forEach((unit, idx) => {
      let targetPos = order.targetPos ? { ...order.targetPos } : undefined;
      if (targetPos && selectedGround.length > 1) {
        const offsetDist = 32;
        const offsetAngle = (idx / selectedGround.length) * Math.PI * 2;
        targetPos.x += Math.cos(offsetAngle) * offsetDist;
        targetPos.y += Math.sin(offsetAngle) * offsetDist;
      }

      unit.order = {
        ...order,
        targetPos,
      };

      if (order.type === 'move' && targetPos) {
        unit.heading = Math.atan2(targetPos.y - unit.pos.y, targetPos.x - unit.pos.x);
        unit.speed = unit.maxSpeed;
      } else if (order.type === 'idle') {
        unit.speed = 0;
      }
    });

    soundEngine.playPlaneSortie();
  }

  // Issue Combat Air Patrol (CAP) Orbit Order to Fighters in a designated area
  public issueCapPatrolOrder(origin: Vector2D, specificUnitIds?: string[]) {
    const ids = specificUnitIds || this.selectedUnitIds;
    let targetFighters = this.aircraft.filter(
      (a) => a.side === 'player' && a.state !== 'shot_down' && ids.includes(a.id) &&
        (a.role === 'fighter' || ['f4f', 'f6f', 'f4u', 'f8f', 'f9f', 'f2h', 'p51', 'p47', 'p38', 'p40', 'f86'].includes(a.model))
    );

    // If no specific fighters selected, command all friendly fighters currently airborne
    if (targetFighters.length === 0) {
      targetFighters = this.aircraft.filter(
        (a) => a.side === 'player' && a.state !== 'shot_down' &&
          (a.role === 'fighter' || ['f4f', 'f6f', 'f4u', 'f8f', 'f9f', 'f2h', 'p51', 'p47', 'p38', 'p40', 'f86'].includes(a.model))
      );
    }

    if (targetFighters.length === 0) {
      this.addBannerAlert('⚠️【無可用戰鬥機】目前空域尚無升空之戰鬥機，請先從航母或前進基地派遣戰機出擊！', 'player', 'alert', 4.5);
      return;
    }

    targetFighters.forEach((plane, idx) => {
      plane.order = {
        type: 'patrol',
        patrolOrigin: { ...origin },
        targetPos: { ...origin },
      };
      plane.state = 'patrolling';
      plane.targetHeading = Math.atan2(origin.y - plane.pos.y, origin.x - plane.pos.x);
    });

    const fCount = targetFighters.length;
    const fNames = Array.from(new Set(targetFighters.map((f) => f.flightName || f.name))).slice(0, 2).join('、');
    soundEngine.playPlaneSortie();
    this.addBannerAlert(`🛡️【CAP 戰鬥空巡已佈設】${fCount} 架戰鬥機前往指定空域建立防禦圈！`, 'player', 'capture', 5.5);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '戰區防空指揮所 (TAC/CAP)',
      targetName: `空域 [${Math.round(origin.x)}, ${Math.round(origin.y)}]`,
      actionType: 'recon_spotted',
      text: `🛡️【CAP 戰鬥空巡防區就位】${fCount} 架空優戰鬥機（${fNames}）奉命移防至指定海域 [X:${Math.round(origin.x)}, Y:${Math.round(origin.y)}]，於半徑 250m 盤旋警戒，自動攔截周邊 450m 內所有敵機！`,
    });
  }

  // Box-Select Units in World Coordinates
  public selectUnitsInBox(minX: number, minY: number, maxX: number, maxY: number, append: boolean = false) {
    const matchedIds: string[] = [];

    // Check player ships
    for (const ship of this.playerShips) {
      if (ship.isSunk) continue;
      if (ship.pos.x >= minX && ship.pos.x <= maxX && ship.pos.y >= minY && ship.pos.y <= maxY) {
        matchedIds.push(ship.id);
      }
    }

    // Check player aircraft
    for (const plane of this.aircraft) {
      if (plane.side !== 'player' || plane.state === 'shot_down') continue;
      if (plane.pos.x >= minX && plane.pos.x <= maxX && plane.pos.y >= minY && plane.pos.y <= maxY) {
        matchedIds.push(plane.id);
      }
    }

    // Check player ground units (if not currently embarked in ship)
    for (const unit of this.groundUnits) {
      if (unit.side !== 'player' || unit.isDestroyed || unit.embarkedInShipId) continue;
      if (unit.pos.x >= minX && unit.pos.x <= maxX && unit.pos.y >= minY && unit.pos.y <= maxY) {
        matchedIds.push(unit.id);
      }
    }

    if (matchedIds.length > 0) {
      this.selectUnits(matchedIds, append);
    } else if (!append) {
      this.clearSelection();
    }
  }

  // ══════════════════════════════════════════════════════════
  // CARRIER FLIGHT DECK OPERATIONS
  // ══════════════════════════════════════════════════════════

  public launchAircraft(model: AircraftModel, count: number = 2, specificPayload?: AircraftPayloadType): boolean {
    const flagship = this.getFlagship();
    if (!flagship || !flagship.carrierPlanes) return false;

    const readyCount = flagship.carrierPlanes.ready[model] || 0;
    if (readyCount <= 0) return false;

    const actualCount = Math.min(count, readyCount);
    flagship.carrierPlanes.ready[model] -= actualCount;

    const sqId = `sq-${model}-${Date.now()}`;
    const role: AircraftRole =
      model === 'ad3w' || model === 'e1'
        ? 'aew'
        : model === 'ho3s1' || model === 'uh2'
        ? 'rescue'
        : model === 'ad1' || model === 'a4' || model === 'a6a' || model === 'a6b_weasel'
        ? 'attacker'
        : model === 'af_guardian' || model === 's2'
        ? 'torpedo_bomber'
        : model === 'c1'
        ? 'scout'
        : model === 'f4f' || model === 'f6f' || model === 'f4u' || model === 'f8f' || model === 'f9f' || model === 'f2h' || model === 'f4u4' || model === 'mig15' || model === 'f8' || model === 'f4b' || model === 'f4j' || model === 'mig21' || model === 'mig17'
        ? 'fighter'
        : model === 'sbd' || model === 'sb2c'
        ? 'dive_bomber'
        : model === 'tbd' || model === 'tbf' || model === 'tu14' || model === 'il28'
        ? 'torpedo_bomber'
        : 'scout';

    // Allow overriding payload on sortie, and persist as current active payload for role
    const payloadType = specificPayload || this.activePayloads[role];
    if (specificPayload) {
      this.activePayloads[role] = specificPayload;
    }

    // ══════════════════════════════════════════════════════════
    // 時代四 B61 戰術核彈 4000 CP 政治授權檢定 (Carrier Tactical Nuke CP)
    // ══════════════════════════════════════════════════════════
    if (payloadType === 'tactical_b61_nuke') {
      if (this.resourcePoints < 4000) {
        flagship.carrierPlanes.ready[model] += actualCount;
        this.addBannerAlert('❌【政治授權不足】動用 B61 戰術核武器需耗費 4,000 CP 戰略指揮點數！目前 CP 不足！', 'player', 'sunk', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '參謀長聯席會議 (JCS)',
          targetName: `${flagship.name} 艦載機隊`,
          actionType: 'recon_spotted',
          text: `❌【戰術核授權駁回】動用 B61 戰術核航彈需耗費 4,000 CP 政治與戰略資源！目前指揮點數不足 (${Math.floor(this.resourcePoints)} / 4000 CP)！`,
        });
        return false;
      }
      this.resourcePoints -= 4000;
      this.totalCpSpent += 4000;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert(`☢️【國家最高指揮授權核准】「${flagship.name}」彈射掛載 B61 戰術核武器之打擊編隊！消耗 4,000 CP！`, 'player', 'sunk', 7.5);
    }

    // High-performance naval aviation speeds (agile and superior relative to surface ships)
    const rawSpeed =
      model === 'mig21' ? 175 :
      model === 'f4b' || model === 'f4j' ? 165 :
      model === 'mig15' ? 160 :
      model === 'f8' ? 155 :
      model === 'f9f' ? 150 :
      model === 'f2h' ? 145 :
      model === 'mig17' ? 145 :
      model === 'a4' ? 135 :
      model === 'yak9' ? 132 :
      model === 'a6a' || model === 'a6b_weasel' ? 130 :
      model === 'tu14' ? 130 :
      model === 'il28' ? 128 :
      model === 'f8f' ? 118 :
      model === 'il10' ? 116 :
      model === 'f4u4' ? 115 :
      model === 'f4u' ? 112 :
      model === 'f6f' ? 105 :
      model === 's2' ? 100 :
      model === 'f4f' ? 98 :
      model === 'c1' ? 98 :
      model === 'ad1' ? 96 :
      model === 'e1' ? 95 :
      model === 'sb2c' ? 90 :
      model === 'af_guardian' ? 90 :
      model === 'ad3w' ? 85 :
      model === 'uh2' ? 85 :
      model === 'sbd' ? 84 :
      model === 'tbf' ? 86 :
      model === 'tbd' ? 76 :
      model === 'ho3s1' ? 65 : 82;

    const catalogItem = PAYLOAD_CATALOG[payloadType];
    const speedModifier = catalogItem ? catalogItem.speedModifier : 1.0;
    const baseSpeed = Math.round(rawSpeed * speedModifier);

    // Resilient, battle-hardened health pools for carrier air groups
    const baseHealth =
      model === 'il28' ? 950 :
      model === 'a6a' || model === 'a6b_weasel' ? 780 :
      model === 'f4b' || model === 'f4j' ? 740 :
      model === 'c1' ? 720 :
      model === 'tu14' ? 680 :
      model === 'ad1' ? 680 :
      model === 's2' ? 650 :
      model === 'il10' ? 620 :
      model === 'e1' ? 620 :
      model === 'f8' ? 600 :
      model === 'f2h' ? 580 :
      model === 'a4' ? 580 :
      model === 'f9f' ? 560 :
      model === 'af_guardian' ? 540 :
      model === 'mig15' ? 540 :
      model === 'mig21' ? 520 :
      model === 'ad3w' ? 520 :
      model === 'f8f' ? 520 :
      model === 'uh2' ? 500 :
      model === 'f4u4' ? 500 :
      model === 'sb2c' ? 500 :
      model === 'f4u' ? 480 :
      model === 'tbf' ? 460 :
      model === 'mig17' ? 450 :
      model === 'yak9' ? 440 :
      model === 'f6f' ? 440 :
      model === 'sbd' ? 420 :
      model === 'ho3s1' ? 420 :
      model === 'f4f' ? 360 :
      model === 'tbd' ? 360 : 320;

    const hasPayload =
      payloadType === 'hvar_rockets' ||
      payloadType === 'tiny_tim_rocket' ||
      payloadType === 'napalm_canister' ||
      payloadType === 'asw_torpedo' ||
      payloadType === 'bomb_2000' ||
      payloadType === 'bomb_500' ||
      payloadType === 'bomb_1000' ||
      payloadType === 'bomb_1600' ||
      payloadType === 'bombs_dual_500' ||
      payloadType === 'aerial_torpedo' ||
      payloadType === 'depth_bombs' ||
      payloadType === 'scout_depth_charge' ||
      payloadType === 'aim9_sidewinder' ||
      payloadType === 'aim7_sparrow' ||
      payloadType === 'agm12_bullpup' ||
      payloadType === 'agm45_shrike' ||
      payloadType === 'agm62_walleye' ||
      payloadType === 'bombs_snakeye_retarded' ||
      payloadType === 'b52_megaton_carpet' ||
      payloadType === 'b52_megaton_nuke' ||
      payloadType === 'tactical_b61_nuke' ||
      payloadType === 'opfor_tactical_nuke' ||
      payloadType === 'ffar_rockets_pod' ||
      payloadType === 'helo_assault_troops' ||
      payloadType === 'c1_paratroopers';

    const payloadName = catalogItem ? catalogItem.badge : 'Clean Guns';

    const FLIGHT_CALLSIGNS = [
      'Wyvern', 'Valkyrie', 'Corsair', 'Thunderbird', 'Phoenix',
      'Griffin', 'Ghost', 'Reaper', 'Avenger', 'Warlock',
      'Pegasus', 'Hydra', 'Centaur', 'Eagle', 'Falcon',
      'Osprey', 'Hawk', 'Raven', 'Barracuda', 'Hammerhead',
      'Sea Wolf', 'Triton', 'Viper', 'Blackcat', 'Wildcat',
      'Panther', 'Banshee', 'Skyraider', 'Guardian'
    ];
    const callsign = FLIGHT_CALLSIGNS[Math.floor(Math.random() * FLIGHT_CALLSIGNS.length)];
    const flightName = `${callsign} Flight (${actualCount}x ${model.toUpperCase()})`;

    // 戰鬥機機槍彈殘彈數量
    let gunRounds = 1440;
    if (model === 'f8') gunRounds = 840; // 4x 20mm Colt Mk 12
    else if (model === 'f4b' || model === 'f4j') gunRounds = 0; // Pure missile interceptors
    else if (model === 'a4') gunRounds = 400; // 2x 20mm Colt Mk 12
    else if (model === 'a6a' || model === 'a6b_weasel') gunRounds = 0;
    else if (model === 'mig21') gunRounds = 200;
    else if (model === 'mig17') gunRounds = 240;
    else if (model === 'f4f') gunRounds = 1440;
    else if (model === 'f6f' || model === 'f4u') gunRounds = 2400;
    else if (model === 'f4u4') gunRounds = 1800;
    else if (model === 'f8f') gunRounds = 800;
    else if (model === 'f9f' || model === 'f2h') gunRounds = 800;
    else if (model === 'mig15') gunRounds = 300;
    else if (model === 'yak9') gunRounds = 340;
    else if (model === 'il10') gunRounds = 600;
    else if (model === 'ad1') gunRounds = 800;
    else if (model === 'af_guardian') gunRounds = 600;
    else if (model === 'ad3w' || model === 'ho3s1' || model === 'uh2' || model === 'e1') gunRounds = 0;
    else if (model === 'sbd' || model === 'sb2c') gunRounds = 720;
    else if (model === 'tbd' || model === 'tbf') gunRounds = 600;
    else if (model === 'os2u') gunRounds = 500;
    else if (model === 'zero') gunRounds = 1000;
    else if (model === 'george') gunRounds = 900;
    else if (model === 'val' || model === 'judy') gunRounds = 600;
    else if (model === 'kate' || model === 'jill') gunRounds = 500;
    else if (model === 'tu14') gunRounds = 400;
    else if (model === 's2' || model === 'c1') gunRounds = 0;

    let initialAmmo = 0;
    if (payloadType === 'clean_guns') initialAmmo = gunRounds;
    else if (payloadType === 'aim9_sidewinder' || payloadType === 'aim7_sparrow') initialAmmo = 4;
    else if (payloadType === 'agm12_bullpup' || payloadType === 'agm45_shrike' || payloadType === 'agm62_walleye') initialAmmo = 2;
    else if (payloadType === 'bombs_snakeye_retarded') initialAmmo = 4;
    else if (payloadType === 'b52_megaton_carpet') initialAmmo = 36;
    else if (payloadType === 'ffar_rockets_pod') initialAmmo = 16;
    else if (payloadType === 'helo_assault_troops') initialAmmo = 1;
    else if (payloadType === 'c1_paratroopers') initialAmmo = 2;
    else if (payloadType === 'hvar_rockets') initialAmmo = 8;
    else if (payloadType === 'tiny_tim_rocket') initialAmmo = 2;
    else if (payloadType === 'napalm_canister') initialAmmo = 2;
    else if (payloadType === 'asw_torpedo') initialAmmo = 1;
    else if (payloadType === 'bomb_2000') initialAmmo = 1;
    else if (payloadType === 'bombs_dual_500') initialAmmo = 2;
    else if (payloadType === 'bomb_500' || payloadType === 'bomb_1000' || payloadType === 'bomb_1600' || payloadType === 'aerial_torpedo') initialAmmo = 1;
    else if (payloadType === 'depth_bombs') initialAmmo = 4;
    else if (payloadType === 'scout_depth_charge') initialAmmo = 2;
    else initialAmmo = 1;

    const launchedIds: string[] = [];

    for (let i = 0; i < actualCount; i++) {
      const planeNumber = i + 1;
      const planeId = `${model}-${Date.now()}-${i}`;
      launchedIds.push(planeId);

      // 每架飛機有單獨編號 (e.g. Wyvern-1 長機, Wyvern-2 僚機)，組成一個 Flight
      const individualName = `${callsign}-${planeNumber} (${model.toUpperCase()})`;

      this.aircraft.push({
        id: planeId,
        squadronId: sqId,
        model,
        role,
        name: individualName,
        flightName,
        flightCallsign: callsign,
        flightNumber: planeNumber,
        gunAmmo: gunRounds,
        maxGunAmmo: gunRounds,
        ammoRemaining: payloadType === 'clean_guns' ? gunRounds : initialAmmo,
        maxAmmo: payloadType === 'clean_guns' ? gunRounds : initialAmmo,
        side: 'player',
        pos: { x: flagship.pos.x, y: flagship.pos.y },
        vel: { x: Math.cos(flagship.heading) * baseSpeed, y: Math.sin(flagship.heading) * baseSpeed },
        heading: flagship.heading,
        targetHeading: flagship.heading,
        speed: baseSpeed,
        maxSpeed: baseSpeed,
        altitude: 0.8,
        state: role === 'fighter' ? 'patrolling' : 'cruising',
        health: baseHealth,
        maxHealth: baseHealth,
        order: {
          type: role === 'fighter' ? 'patrol' : 'move',
          targetPos: {
            x: flagship.pos.x + Math.cos(flagship.heading) * 350,
            y: flagship.pos.y + Math.sin(flagship.heading) * 350,
          },
          patrolOrigin: { ...flagship.pos },
        },
        hasPayload,
        payloadType,
        payloadName,
        carrierId: flagship.id,
        shootCooldown: 0,
        wingmanOffset: { x: (i - (actualCount - 1) / 2) * 28, y: i * 20 },
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: flagship.codeName || flagship.name,
      targetName: flightName,
      actionType: 'recon_spotted',
      text: `🛫【機隊起飛出擊】「${flightName}」從飛行甲板彈射出擊！掛載: ${catalogItem?.nameZh || payloadName} (儲存彈藥: ${initialAmmo})`,
    });

    this.selectUnits(launchedIds, false);
    soundEngine.playPlaneSortie();
    return true;
  }

  // Trigger Emergency Fleet Flak Barrage
  public triggerFleetFlakBarrage() {
    this.flakBarrageTimer = 8;
    soundEngine.playKlaxon();
  }

  public setGameSpeed(speed: number) {
    this.gameSpeed = speed;
    if (speed > 0 && this.isPaused) {
      this.isPaused = false;
    }
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  // Fleet Rudder & Speed
  public setFleetSpeed(speedKnots: number) {
    const selectedShips = this.playerShips.filter((s) => this.selectedUnitIds.includes(s.id));
    const targets = selectedShips.length > 0 ? selectedShips : [this.getFlagship()].filter(Boolean) as Ship[];
    targets.forEach((s) => {
      s.targetSpeed = speedKnots;
    });
  }

  public steerRudder(dir: 'port' | 'starboard') {
    const selectedShips = this.playerShips.filter((s) => this.selectedUnitIds.includes(s.id));
    const targets = selectedShips.length > 0 ? selectedShips : [this.getFlagship()].filter(Boolean) as Ship[];
    const delta = dir === 'port' ? -0.35 : 0.35;
    targets.forEach((s) => {
      s.targetHeading += delta;
      s.order = { type: 'idle' };
    });
  }

  // ══════════════════════════════════════════════════════════
  // MAIN SIMULATION LOOP (60 FPS with GameSpeed pacing)
  // ══════════════════════════════════════════════════════════

  public update(dt: number) {
    if (this.isPaused || this.isVictory || this.isDefeat) return;

    const effectiveDt = dt * this.gameSpeed;
    this.gameTime += effectiveDt;

    if (this.flakBarrageTimer > 0)
      this.flakBarrageTimer = Math.max(0, this.flakBarrageTimer - effectiveDt);

    // ══════════════════════════════════════════════════════════
    // 資源點數累積 (Command Points: Base + Islands Bonus)
    // ══════════════════════════════════════════════════════════
    const capturedCount = this.islands.filter((i) => i.isFullyCaptured || i.isFriendlyBase).length;
    const islandBonus = capturedCount * 2.5;
    const cpGain = (this.commandPointsPerSec + islandBonus) * effectiveDt;
    this.resourcePoints += cpGain;
    this.totalCpEarned += cpGain;

    // ══════════════════════════════════════════════════════════
    // 頂部擊沉與空戰戰報橫條更新 (Banner Alerts Duration)
    // ══════════════════════════════════════════════════════════
    for (let b = this.activeBannerAlerts.length - 1; b >= 0; b--) {
      this.activeBannerAlerts[b].duration -= effectiveDt;
      if (this.activeBannerAlerts[b].duration <= 0) {
        this.activeBannerAlerts.splice(b, 1);
      }
    }

    // ══════════════════════════════════════════════════════════
    // 時代三戰術核爆視覺衰減 (Tactical Nuclear Visual Timers)
    // ══════════════════════════════════════════════════════════
    if (this.nuclearFlash > 0) {
      this.nuclearFlash = Math.max(0, this.nuclearFlash - effectiveDt * 0.75);
    }
    for (let n = this.nuclearDetonations.length - 1; n >= 0; n--) {
      const det = this.nuclearDetonations[n];
      det.timer += effectiveDt;
      det.radius = Math.min(det.maxRadius, det.radius + (det.maxRadius / 1.1) * effectiveDt);
      if (det.timer >= det.duration) {
        this.nuclearDetonations.splice(n, 1);
      }
    }

    // ══════════════════════════════════════════════════════════
    // 8 大日軍戰術空中任務編組調度 (8 Enemy Air Doctrines Schedulers)
    // ══════════════════════════════════════════════════════════

    // 4, 5, 6: Strike Package 攻擊波 (旗艦 / 護航艦艇 / 陸基基地)
    this.enemyAirStrikeTimer -= effectiveDt;
    if (this.enemyAirStrikeTimer <= 0) {
      const strikeRoll = Math.random();
      if (strikeRoll < 0.45) {
        this.triggerEnemyAirDoctrine('strike_flagship');
      } else if (strikeRoll < 0.75) {
        this.triggerEnemyAirDoctrine('strike_fleet');
      } else {
        this.triggerEnemyAirDoctrine('strike_airbase');
      }
      this.enemyAirStrikeTimer = Math.max(50, 75 - this.sectorNumber * 3);
    }

    // 2: Air Sweep (空中制空掃蕩隊)
    this.enemySweepTimer -= effectiveDt;
    if (this.enemySweepTimer <= 0) {
      this.triggerEnemyAirDoctrine('air_sweep');
      this.enemySweepTimer = 65;
    }

    // 7: CAS (近距空中支援針對海灘登陸舟艇與部隊)
    this.enemyCasTimer -= effectiveDt;
    if (this.enemyCasTimer <= 0) {
      const hasGroundAction =
        this.groundUnits.some((u) => u.side === 'player' && !u.isDestroyed) ||
        this.playerShips.some((s) => (s.type === 'lst' || s.type === 'lcvp' || s.name.includes('LCVP') || s.name.includes('LST')) && !s.isSunk);
      if (hasGroundAction) {
        this.triggerEnemyAirDoctrine('cas');
      }
      this.enemyCasTimer = 70;
    }

    // 8: CAP (常態戰鬥巡邏維護)
    this.enemyCapTimer -= effectiveDt;
    if (this.enemyCapTimer <= 0) {
      const activeCaps = this.aircraft.filter((a) => a.side === 'enemy' && a.missionType === 'cap' && a.state !== 'shot_down');
      if (activeCaps.length < 2) {
        this.triggerEnemyAirDoctrine('cap');
      }
      this.enemyCapTimer = 85;
    }

    // 1, 3: DCA & Scramble 冷卻衰減與近迫感應觸發
    if (this.enemyScrambleCooldown > 0) this.enemyScrambleCooldown -= effectiveDt;
    if (this.enemyDcaCooldown > 0) this.enemyDcaCooldown -= effectiveDt;
    this.checkEnemyAirDoctrineTriggers();

    // ══════════════════════════════════════════════════════════
    // 指揮準則：飛機、船艦與陸軍單位不會隨著時間自行生成，所有的增援由玩家使用 CP 購買
    // ══════════════════════════════════════════════════════════
    // Periodic Airbase Replenishment & Convoy Spawning Disabled - Player purchases via CP Requisition

    // Era 1 Tokyo Express Fast Destroyer Raid (120s interval)
    if (this.era === 'era1') {
      this.tokyoExpressTimer -= effectiveDt;
      if (this.tokyoExpressTimer <= 0) {
        this.spawnTokyoExpressDD();
        this.tokyoExpressTimer = 110;
      }
    }

    // Era 3 Continental Frontline Automated Reinforcements & USAAF Sorties
    if (this.era === 'era3') {
      this.frontlineWaveTimer -= effectiveDt;
      if (this.frontlineWaveTimer <= 0) {
        this.spawnContinentalAlliedFrontlineWave();
        this.frontlineWaveTimer = 40;
      }

      this.enemyFrontlineWaveTimer -= effectiveDt;
      if (this.enemyFrontlineWaveTimer <= 0) {
        this.spawnContinentalEnemyFrontlineWave();
        this.enemyFrontlineWaveTimer = 55;
      }

      this.usaafSortieTimer -= effectiveDt;
      if (this.usaafSortieTimer <= 0) {
        this.spawnUsaafAirSortie();
        this.usaafSortieTimer = 60 + Math.random() * 30; // 60 to 90 seconds
      }
    }

    // Tick civilian collateral damage cooldowns
    for (const id in this.civilianCollateralCooldowns) {
      this.civilianCollateralCooldowns[id] -= effectiveDt;
      if (this.civilianCollateralCooldowns[id] <= 0) {
        delete this.civilianCollateralCooldowns[id];
      }
    }

    this.updateShips(effectiveDt);
    this.updateGroundUnits(effectiveDt);
    this.updateStrongholds(effectiveDt);
    this.updateAircraft(effectiveDt);
    this.updateInstallations(effectiveDt);
    this.updateEra3Mechanics(effectiveDt);
    this.updateEra4Mechanics(effectiveDt);
    this.updateLifeRaftRescue(effectiveDt);
    this.updateProjectiles(effectiveDt);
    this.updateParticles(effectiveDt);
    this.checkVictoryConditions();
  }

  // 1. Update Warships with RTS Orders
  private updateShips(dt: number) {
    const allShips = [...this.playerShips, ...this.enemyShips];

    for (const ship of allShips) {
      if (ship.isSunk) {
        ship.sinkProgress = Math.min(1, ship.sinkProgress + dt * 0.08);

        if (ship.magazineFlashTimer && ship.magazineFlashTimer > 0) {
          ship.magazineFlashTimer -= dt;
        }

        if (ship.isBrokenInTwo) {
          ship.breakProgress = Math.min(1, (ship.breakProgress || 0) + dt * 0.15);
          ship.bowAngleOffset = Math.min(0.28, (ship.bowAngleOffset || 0) + dt * 0.04);
          ship.sternAngleOffset = Math.max(-0.35, (ship.sternAngleOffset || 0) - dt * 0.05);

          const fracX = ship.pos.x + Math.cos(ship.heading) * (ship.length * (ship.breakLineOffset || 0));
          const fracY = ship.pos.y + Math.sin(ship.heading) * (ship.length * (ship.breakLineOffset || 0));

          // 斷裂處滾滾黑煙 (Heavy billowing oil smoke)
          if (Math.random() < 0.75) {
            this.particles.push({
              id: `sink-smoke-${Date.now()}-${Math.random()}`,
              x: fracX + (Math.random() - 0.5) * (ship.width * 0.8),
              y: fracY + (Math.random() - 0.5) * (ship.width * 0.8),
              vx: (Math.random() - 0.5) * 6,
              vy: -10 - Math.random() * 16,
              life: 1.8 + Math.random() * 0.8,
              maxLife: 2.6,
              radius: 14 + Math.random() * 16,
              color: 'rgba(16, 20, 26, 0.85)',
              type: 'smoke',
            });
          }

          // 燃燒火光 (Fracture combustion fire)
          if (Math.random() < 0.45) {
            this.particles.push({
              id: `sink-fire-${Date.now()}-${Math.random()}`,
              x: fracX + (Math.random() - 0.5) * (ship.width * 0.5),
              y: fracY + (Math.random() - 0.5) * (ship.width * 0.5),
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10 - 5,
              life: 0.5 + Math.random() * 0.4,
              maxLife: 0.9,
              radius: 5 + Math.random() * 6,
              color: Math.random() > 0.4 ? '#FF3D00' : '#FFAB00',
              type: 'fire',
            });
          }

          // 水面油污與浮沫 (Oil slick & foam)
          if (Math.random() < 0.35) {
            this.particles.push({
              id: `sink-oil-${Date.now()}-${Math.random()}`,
              x: fracX + (Math.random() - 0.5) * ship.width * 1.5,
              y: fracY + (Math.random() - 0.5) * ship.width * 1.5,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 3.0,
              maxLife: 3.0,
              radius: 10 + Math.random() * 14,
              color: 'rgba(5, 10, 18, 0.6)',
              type: 'oil_slick',
            });
          }
        }
        continue;
      }

      // RTS Navigation Orders
      if (ship.order.type === 'move' && ship.order.targetPos) {
        const dx = ship.order.targetPos.x - ship.pos.x;
        const dy = ship.order.targetPos.y - ship.pos.y;
        const d = Math.hypot(dx, dy);

        if (d < 45) {
          ship.order = { type: 'idle' };
          ship.targetSpeed = 0;
        } else {
          ship.targetHeading = Math.atan2(dy, dx);
          ship.targetSpeed = ship.maxSpeed;
        }
      }

      // Enemy AI
      if (ship.side === 'enemy') {
        this.updateEnemyShipAI(ship, dt);
      }

      // Smooth heading turn
      let angleDiff = ship.targetHeading - ship.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnStep = ship.turnRate * dt;
      if (Math.abs(angleDiff) < turnStep) {
        ship.heading = ship.targetHeading;
      } else {
        ship.heading += Math.sign(angleDiff) * turnStep;
      }

      // Acceleration and Full Stop Braking
      if (ship.targetSpeed === 0) {
        const brake = 16 * dt;
        if (ship.speed > 0) ship.speed = Math.max(0, ship.speed - brake);
        else if (ship.speed < 0) ship.speed = Math.min(0, ship.speed + brake);
        if (Math.abs(ship.speed) < 0.15) {
          ship.speed = 0;
          ship.vel.x = 0;
          ship.vel.y = 0;
        }
      } else {
        const accel = 6 * dt;
        if (ship.speed < ship.targetSpeed) {
          ship.speed = Math.min(ship.targetSpeed, ship.speed + accel);
        } else if (ship.speed > ship.targetSpeed) {
          ship.speed = Math.max(ship.targetSpeed, ship.speed - accel);
        }
      }

      // Realistic Deliberate Naval Warship Movement (Noticeably slower than high-speed aircraft)
      if (ship.speed !== 0) {
        ship.vel.x = Math.cos(ship.heading) * ship.speed;
        ship.vel.y = Math.sin(ship.heading) * ship.speed;
        ship.pos.x += ship.vel.x * dt * 1.6;
        ship.pos.y += ship.vel.y * dt * 1.6;
      } else {
        ship.vel.x = 0;
        ship.vel.y = 0;
      }

      // Island collision bounce
      for (const island of this.islands) {
        if (isPointInPolygon(ship.pos, island.points)) {
          const pushAngle = Math.atan2(ship.pos.y - island.center.y, ship.pos.x - island.center.x);
          ship.pos.x += Math.cos(pushAngle) * 2;
          ship.pos.y += Math.sin(pushAngle) * 2;
          ship.speed *= 0.8;
        }
      }

      // Wakes
      if (ship.speed > 2) {
        const sternX = ship.pos.x - Math.cos(ship.heading) * (ship.length * 0.45);
        const sternY = ship.pos.y - Math.sin(ship.heading) * (ship.length * 0.45);
        ship.wakePoints.push({ x: sternX, y: sternY, life: 1.0, width: ship.width * 0.6 });
      }

      for (let i = ship.wakePoints.length - 1; i >= 0; i--) {
        const wp = ship.wakePoints[i];
        wp.life -= dt * 0.4;
        wp.width += dt * 4;
        if (wp.life <= 0) ship.wakePoints.splice(i, 1);
      }

      // Cooldowns
      if (ship.hasTorpedoes && ship.torpedoCooldown !== undefined && ship.torpedoCooldown > 0) {
        ship.torpedoCooldown = Math.max(0, ship.torpedoCooldown - dt);
      }
      if (ship.hasDepthCharges && ship.depthChargeCooldown !== undefined && ship.depthChargeCooldown > 0) {
        ship.depthChargeCooldown = Math.max(0, ship.depthChargeCooldown - dt);
      }
      if (ship.hasHedgehog && ship.hedgehogCooldown !== undefined && ship.hedgehogCooldown > 0) {
        ship.hedgehogCooldown = Math.max(0, ship.hedgehogCooldown - dt);
      }

      // Depth Charge auto drop (overhead/stern drop)
      if (ship.side === 'player' && ship.hasDepthCharges && (ship.depthChargeCooldown || 0) <= 0) {
        const nearSub = this.enemyShips.find((e) => e.type === 'submarine' && !e.isSunk && dist(ship.pos, e.pos) < 320);
        if (nearSub) {
          this.dropDepthCharge(ship);
          ship.depthChargeCooldown = 6;
        }
      }

      // Hedgehog ASW forward-firing mortar barrage (automatic forward cone detection 100m-290m, ±45°)
      if (ship.side === 'player' && ship.hasHedgehog && (ship.hedgehogCooldown || 0) <= 0) {
        const targetSub = this.enemyShips.find((e) => {
          if (e.type !== 'submarine' || e.isSunk) return false;
          const d = dist(ship.pos, e.pos);
          if (d < 100 || d > 290) return false;
          const ang = Math.atan2(e.pos.y - ship.pos.y, e.pos.x - ship.pos.x);
          let relAngle = ang - ship.heading;
          while (relAngle > Math.PI) relAngle -= Math.PI * 2;
          while (relAngle < -Math.PI) relAngle += Math.PI * 2;
          return Math.abs(relAngle) <= 0.8; // Forward bow cone: ~±45°
        });

        if (targetSub) {
          this.fireHedgehogSalvo(ship, targetSub.pos);
          ship.hedgehogCooldown = 12; // 12s reload
        }
      }

      // ══════════════════════════════════════════════════════════
      // 損害管制雙軌修復 (Damage Control Repair Rates)
      // 武器指管系統 (WCS)：較好修復，艦上損管隊接線搶修電路與砲塔供彈 (+6.5 HP/s)
      // 人員艦體狀態 (HCS)：修復極慢 (+0.4 HP/s)，主要仰賴進駐維修船塢大修
      // ══════════════════════════════════════════════════════════
      if (!ship.isSunk) {
        if (ship.weaponControlHealth === undefined) ship.weaponControlHealth = ship.health;
        if (ship.hullCrewHealth === undefined) ship.hullCrewHealth = ship.health;
        if (ship.maxWeaponControlHealth === undefined) ship.maxWeaponControlHealth = ship.maxHealth;
        if (ship.maxHullCrewHealth === undefined) ship.maxHullCrewHealth = ship.maxHealth;

        // 海上自主搶修武器指管
        if (ship.weaponControlHealth < ship.maxWeaponControlHealth) {
          ship.weaponControlHealth = Math.min(ship.maxWeaponControlHealth, ship.weaponControlHealth + dt * 6.5);
        }
        // 人員艦體緩慢微量堵漏搶修
        if (ship.side === 'player' && ship.hullCrewHealth < ship.maxHullCrewHealth) {
          ship.hullCrewHealth = Math.min(ship.maxHullCrewHealth, ship.hullCrewHealth + dt * 0.4);
          ship.health = ship.hullCrewHealth;
        }
      }

      // ══════════════════════════════════════════════════════════
      // 友軍船舶維修設施 (Ship Repair Docks) 緊急搶修至綠色安全生命值
      // ══════════════════════════════════════════════════════════
      if (ship.side === 'player') {
        const repairDocks = this.islands
          .flatMap((i) => i.installations)
          .filter((inst) => inst.type === 'ship_repair_dock' && !inst.isDestroyed && inst.side === 'player');

        for (const dock of repairDocks) {
          const d = dist(ship.pos, dock.pos);
          if (d <= (dock.range || 750)) {
            // Can emergency repair ship back up to safe green health (>= 85% up to 100%)
            const greenHealthTarget = ship.maxHealth * 0.90;
            if (ship.health < greenHealthTarget) {
              const repairAmount = 55 * dt; // +55 HP/s per dock
              ship.hullCrewHealth = Math.min(ship.maxHullCrewHealth || ship.maxHealth, (ship.hullCrewHealth || ship.health) + repairAmount);
              ship.weaponControlHealth = Math.min(ship.maxWeaponControlHealth || ship.maxHealth, (ship.weaponControlHealth || ship.health) + repairAmount * 1.5);
              ship.health = ship.hullCrewHealth;

              // Periodic announcement log
              const now = this.gameTime;
              const lastLog = (ship as { lastRepairLogTime?: number }).lastRepairLogTime || 0;
              if (now - lastLog > 16) {
                (ship as { lastRepairLogTime?: number; wasRepairing?: boolean }).lastRepairLogTime = now;
                (ship as { lastRepairLogTime?: number; wasRepairing?: boolean }).wasRepairing = true;
                this.addCombatLog({
                  category: 'naval',
                  sourceSide: 'player',
                  sourceName: dock.name,
                  targetName: ship.name,
                  actionType: 'recon_spotted',
                  text: `⚓🔧【船舶維修設施緊急搶修】「${ship.name}」進駐「${dock.name}」泊位！工兵與損管隊全力抽水排澇焊接破洞，緊急修補船身至綠色安全狀態！`,
                });
              }

              // Visual damage control welding spark particles
              if (Math.random() < 0.32) {
                const sparkOffset = (Math.random() - 0.5) * ship.width;
                this.particles.push({
                  id: `repair-spark-${Date.now()}-${Math.random()}`,
                  x: ship.pos.x + Math.cos(ship.heading + Math.PI / 2) * sparkOffset,
                  y: ship.pos.y + Math.sin(ship.heading + Math.PI / 2) * sparkOffset,
                  vx: (Math.random() - 0.5) * 25,
                  vy: (Math.random() - 0.5) * 25,
                  life: 0.5,
                  maxLife: 0.5,
                  radius: 3.5,
                  color: '#00E676',
                  type: 'spark',
                });
              }

              if (ship.health >= greenHealthTarget && (ship as { wasRepairing?: boolean }).wasRepairing) {
                (ship as { wasRepairing?: boolean }).wasRepairing = false;
                this.addCombatLog({
                  category: 'naval',
                  sourceSide: 'player',
                  sourceName: dock.name,
                  targetName: ship.name,
                  actionType: 'recon_spotted',
                  text: `✅【搶修達標】「${ship.name}」已成功修復至綠色安全生命值 (${Math.round((ship.health / ship.maxHealth) * 100)}%)！戰備良好可重新出戰！`,
                });
              }
            }
          }
        }
      }

      this.updateShipCombat(ship, dt);
    }
  }

  private updateEnemyShipAI(ship: Ship, dt: number) {
    const flagship = this.getFlagship();
    if (!flagship) return;

    const d = dist(ship.pos, flagship.pos);

    if (ship.type === 'submarine') {
      ship.targetHeading = Math.atan2(flagship.pos.y - ship.pos.y, flagship.pos.x - ship.pos.x);
      ship.targetSpeed = 8;
      if ((ship.torpedoCooldown || 0) <= 0 && d < 750) {
        this.fireTorpedoSalvo(ship, flagship.pos, 2);
        ship.torpedoCooldown = 22;
      }
      return;
    }

    if (d > 1000) {
      ship.targetHeading = Math.atan2(flagship.pos.y - ship.pos.y, flagship.pos.x - ship.pos.x);
      ship.targetSpeed = 16;
    } else if (d < 450) {
      ship.targetHeading = Math.atan2(flagship.pos.y - ship.pos.y, flagship.pos.x - ship.pos.x) + Math.PI * 0.6;
      ship.targetSpeed = 18;
    } else {
      ship.targetHeading = flagship.heading + Math.PI;
      ship.targetSpeed = 14;
    }

    if (ship.hasTorpedoes && (ship.torpedoCooldown || 0) <= 0 && d < 700) {
      this.fireTorpedoSalvo(ship, flagship.pos, 3);
      ship.torpedoCooldown = ship.torpedoReloadTime || 20;
    }
  }

  private updateShipCombat(ship: Ship, dt: number) {
    const isPlayer = ship.side === 'player';
    const targetShips = isPlayer ? this.enemyShips : this.playerShips;

    const hasAirSpotting = isPlayer && this.aircraft.some(
      (a) => a.side === 'player' && a.model === 'os2u' && a.state !== 'shot_down'
    );
    const rangeMod = hasAirSpotting ? 1.25 : 1.0;

    // 武器指管系統效率 (Weapon Control System Efficiency: 0 to 1)
    const maxWcs = ship.maxWeaponControlHealth || ship.maxHealth;
    const curWcs = ship.weaponControlHealth !== undefined ? ship.weaponControlHealth : ship.health;
    const wcsEfficiency = Math.max(0, Math.min(1, curWcs / maxWcs));

    // 1. Naval Gun Turrets (潛艦處於水下深潛狀態，艦砲無法直接鎖定攻擊)
    for (const turret of ship.turrets) {
      turret.cooldown = Math.max(0, turret.cooldown - dt);
      const effectiveRange = turret.range * rangeMod;

      let target: Ship | Installation | null = null;
      if (ship.order.type === 'attack' && ship.order.targetId) {
        target =
          targetShips.find((s) => s.id === ship.order.targetId && !s.isSunk && s.type !== 'submarine') ||
          this.findTargetInstallation(ship.order.targetId);
      }

      if (!target || dist(ship.pos, target.pos) > effectiveRange) {
        target =
          targetShips
            .filter((s) => !s.isSunk && s.type !== 'submarine')
            .find((s) => dist(ship.pos, s.pos) <= effectiveRange) || null;
      }

      if (target) {
        // ══════════════════════════════════════════════════════════
        // FCS 射控系統前置量攔截計算 (Lead Angle Intercept Calculation)
        // 依據目標當前航速航向向量與砲彈飛行時間計算未來攔截點
        // ══════════════════════════════════════════════════════════
        const shellSpeed = 480;
        const dTarget = Math.hypot(target.pos.x - ship.pos.x, target.pos.y - ship.pos.y);
        const flightTime = dTarget / shellSpeed;
        const targetVel = (target as Ship).vel || { x: 0, y: 0 };
        const leadPos = {
          x: target.pos.x + targetVel.x * flightTime,
          y: target.pos.y + targetVel.y * flightTime,
        };

        turret.angle = Math.atan2(leadPos.y - ship.pos.y, leadPos.x - ship.pos.x);

        // 武器指管系統癱瘓 (<15%) 則火砲無法正常射擊，受損時裝填週期按比例延長
        if (turret.cooldown <= 0 && wcsEfficiency >= 0.15) {
          this.fireTurretSalvo(ship, turret, leadPos);
          turret.cooldown = turret.reloadTime / Math.max(0.3, wcsEfficiency);
        }
      }
    }

    // 2. Anti-Aircraft Flak Screen (受武器指管系統運作狀況影響)
    ship.flakCooldown = Math.max(0, ship.flakCooldown - dt);
    const isEra2Player = isPlayer && this.era === 'era2';
    const isEra3Player = isPlayer && this.era === 'era3';
    const baseFlakRate = isPlayer
      ? (this.flakBarrageTimer > 0 ? 0.08 : (isEra3Player ? 0.20 : isEra2Player ? 0.35 : 0.65))
      : (ship.type === 'carrier' ? 1.2 : ship.type === 'battleship' ? 0.85 : 0.95);
    const effectiveFlakRate = baseFlakRate / Math.max(0.2, wcsEfficiency);

    if (ship.flakCooldown <= 0 && wcsEfficiency >= 0.12) {
      const hostilePlanes = this.aircraft.filter(
        (a) => a.side !== ship.side && a.state !== 'shot_down' && dist(ship.pos, a.pos) < ship.flakRange
      );

      if (hostilePlanes.length > 0) {
        const targetPlane = hostilePlanes[Math.floor(Math.random() * hostilePlanes.length)];
        this.fireFlakBurst(ship.pos, targetPlane);
        ship.flakCooldown = effectiveFlakRate;
      }
    }
  }

  // 2. Update Aircraft with Air Warfare RTS Logic
  private updateAircraft(dt: number) {
    const flagship = this.getFlagship();

    for (let i = this.aircraft.length - 1; i >= 0; i--) {
      const plane = this.aircraft[i];

      if (plane.state === 'shot_down') {
        plane.deathTimer = (plane.deathTimer || 0) - dt;
        const mode = plane.crashMode || 'smoke';

        // Dynamic flight physics according to crash mode
        if (mode === 'spin') {
          plane.heading += (plane.crashSpinSpeed || 4) * dt;
          plane.speed = Math.max(35, plane.speed * 0.96);
          plane.pos.x += Math.cos(plane.heading) * plane.speed * dt * 0.4;
          plane.pos.y += Math.sin(plane.heading) * plane.speed * dt * 0.4;
          plane.altitude = Math.max(0, plane.altitude - dt * 0.55);
        } else if (mode === 'breakup') {
          plane.heading += (plane.crashSpinSpeed || 2) * dt * 0.4;
          plane.pos.x += plane.vel.x * dt * 0.5;
          plane.pos.y += plane.vel.y * dt * 0.5;
          plane.altitude = Math.max(0, plane.altitude - dt * 0.65);

          // Update detached debris pieces (flying wings & tail)
          if (plane.crashDebris) {
            for (const deb of plane.crashDebris) {
              deb.x += deb.vx * dt;
              deb.y += deb.vy * dt;
              deb.rot += deb.rotSpeed * dt;
            }
          }
        } else if (mode === 'burn') {
          plane.heading += (Math.sin(this.gameTime * 4) * 0.5) * dt;
          plane.pos.x += plane.vel.x * dt * 0.65;
          plane.pos.y += plane.vel.y * dt * 0.65;
          plane.altitude = Math.max(0, plane.altitude - dt * 0.5);
        } else {
          // Smoke & Yaw Glide
          plane.pos.x += plane.vel.x * dt * 0.7;
          plane.pos.y += plane.vel.y * dt * 0.7;
          plane.altitude = Math.max(0, plane.altitude - dt * 0.45);
        }

        // Spawn dynamic crash fire particles
        if (mode === 'burn') {
          if (Math.random() < 0.75) {
            this.particles.push({
              id: `crash-fire-${Date.now()}-${Math.random()}`,
              x: plane.pos.x + (Math.random() - 0.5) * 6,
              y: plane.pos.y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10 - 5,
              life: 0.45,
              maxLife: 0.45,
              radius: 5 + Math.random() * 5,
              color: Math.random() > 0.4 ? '#FF3D00' : '#FFD54F',
              type: 'fire',
            });
          }
        }

        // Heavy dark smoke trails for all crashing planes
        if (Math.random() < 0.8) {
          this.particles.push({
            id: `crash-smoke-${Date.now()}-${Math.random()}`,
            x: plane.pos.x - Math.cos(plane.heading) * 10 + (Math.random() - 0.5) * 6,
            y: plane.pos.y - Math.sin(plane.heading) * 10 + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 8,
            life: 1.2 + Math.random() * 0.6,
            maxLife: 1.8,
            radius: 8 + Math.random() * 10,
            color: 'rgba(20, 24, 30, 0.82)',
            type: 'smoke',
          });
        }

        // Terminal crash impact when altitude reaches sea level or timer expires
        if (plane.altitude <= 0.04 || (plane.deathTimer || 0) <= 0) {
          soundEngine.playExplosion(true);
          soundEngine.playWaterSplash();

          // Check if crashing into island land or ocean water
          const onIsland = this.islands.some((isl) => isPointInPolygon(plane.pos, isl.points));

          if (onIsland) {
            // Ground impact explosion & shockwave
            this.particles.push({
              id: `crash-impact-blast-${Date.now()}`,
              x: plane.pos.x,
              y: plane.pos.y,
              vx: 0,
              vy: 0,
              life: 0.8,
              maxLife: 0.8,
              radius: 45,
              color: '#FF5722',
              type: 'shockwave',
              shape: 'ring',
            });
          } else {
            // Soaring Ocean Geyser Splash Water Column!
            this.particles.push({
              id: `crash-geyser-${Date.now()}`,
              x: plane.pos.x,
              y: plane.pos.y,
              vx: 0,
              vy: 0,
              life: 1.0,
              maxLife: 1.0,
              radius: 42,
              color: '#E0F7FA',
              type: 'geyser',
            });
            // Foam ring
            this.particles.push({
              id: `crash-foam-${Date.now()}`,
              x: plane.pos.x,
              y: plane.pos.y,
              vx: 0,
              vy: 0,
              life: 1.6,
              maxLife: 1.6,
              radius: 35,
              color: 'rgba(255, 255, 255, 0.8)',
              type: 'splash',
              shape: 'ring',
            });
          }

          this.aircraft.splice(i, 1);
        }
        continue;
      }

      // ══════════════════════════════════════════════════════════
      // SPECIAL ERA 2 THREATS: OHKA ROCKET, G4M BETTY, & KAMIKAZE
      // ══════════════════════════════════════════════════════════

      // 1. MXY-7 櫻花特攻火箭反艦飛彈 (Rocket-Propelled Anti-Ship Suicide Missile)
      if (plane.model === 'ohka') {
        plane.speed = 380;
        // 噴射火尾與推進煙幕粒子 (Flaring rocket trail)
        if (Math.random() < 0.65) {
          this.particles.push({
            id: `ohka-smoke-${Date.now()}-${Math.random()}`,
            x: plane.pos.x - Math.cos(plane.heading) * 14,
            y: plane.pos.y - Math.sin(plane.heading) * 14,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 0.35,
            maxLife: 0.35,
            radius: 4.5,
            color: Math.random() < 0.5 ? '#FF3D00' : 'rgba(255, 235, 150, 0.8)',
            type: 'smoke',
          });
        }

        const targetShip =
          this.playerShips.find((s) => !s.isSunk && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3200)) ||
          this.getFlagship();

        if (targetShip) {
          const d = dist(plane.pos, targetShip.pos);
          plane.targetHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);
          plane.altitude = Math.max(0.08, plane.altitude - dt * 0.45);

          if (d < 45 || (d < 85 && plane.altitude <= 0.12)) {
            // 直擊命中！1200kg特裝穿甲彈頭巨爆
            soundEngine.playExplosion(true);
            const warheadDmg = 2200;
            const actualDmg = Math.round(warheadDmg * (1 - targetShip.armor * 0.35));
            targetShip.health = Math.max(0, targetShip.health - actualDmg);

            this.particles.push({
              id: `ohka-blast-${Date.now()}`,
              x: targetShip.pos.x,
              y: targetShip.pos.y,
              vx: 0,
              vy: 0,
              life: 0.9,
              maxLife: 0.9,
              radius: 85,
              color: '#FF1744',
              type: 'shockwave',
              shape: 'ring',
            });

            this.addCombatLog({
              category: 'naval',
              sourceSide: 'enemy',
              sourceName: 'MXY-7 櫻花特攻火箭反艦飛彈',
              targetName: targetShip.name,
              actionType: 'bomb_crit',
              isCrit: true,
              damage: actualDmg,
              diceRoll: {
                dieType: 'd100',
                roll: 99,
                targetScore: 40,
                result: 'crit',
                rollDesc: '櫻花1200kg特裝彈頭以400節極速貫穿裝甲甲板',
              },
              text: `💥【櫻花火箭撞擊引爆！】1200kg特裝穿甲彈頭高速撞擊「${targetShip.name}」！造成毀滅性重創 (-${actualDmg} HP)！全艦陷入火海！`,
            });

            if (targetShip.health <= 0) {
              targetShip.isSunk = true;
            }
            this.killPlane(plane);
            continue;
          }
        }
      }

      // 2. 一式陸攻 (G4M "Betty") 投放櫻花特攻火箭
      if (plane.model === 'g4m' && plane.hasOhkaAttached) {
        const targetShip =
          this.playerShips.find((s) => !s.isSunk && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3800)) ||
          this.getFlagship();

        if (targetShip) {
          const d = dist(plane.pos, targetShip.pos);
          plane.targetHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);

          // 於1800米外或受創重傷時脫離投放櫻花
          if (d < 1800 || plane.health < 260) {
            plane.hasOhkaAttached = false;
            plane.order = { type: 'rtb' };
            plane.state = 'returning';

            soundEngine.playRocketIgnition();
            const ohkaHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);
            this.aircraft.push({
              id: `ohka-${Date.now()}`,
              squadronId: `sq-ohka-${Date.now()}`,
              model: 'ohka',
              role: 'dive_bomber',
              name: 'MXY-7 櫻花火箭反艦飛彈 (一式陸攻投擲)',
              side: 'enemy',
              pos: { ...plane.pos },
              vel: { x: Math.cos(ohkaHeading) * 380, y: Math.sin(ohkaHeading) * 380 },
              heading: ohkaHeading,
              targetHeading: ohkaHeading,
              speed: 380,
              maxSpeed: 380,
              altitude: 0.75,
              state: 'kamikaze_dive',
              health: 180,
              maxHealth: 180,
              order: { type: 'attack', targetPos: targetShip.pos, targetId: targetShip.id },
              hasPayload: false,
              shootCooldown: 0,
              wingmanOffset: { x: 0, y: 0 },
              isKamikaze: true,
            });

            this.addCombatLog({
              category: 'air',
              sourceSide: 'enemy',
              sourceName: '一式陸攻 (神雷部隊)',
              targetName: targetShip.name,
              actionType: 'recon_spotted',
              text: `🚀【櫻花特攻火箭點火出擊！】一式陸攻於1800米空域投下 MXY-7 櫻花火箭！火箭發動機全開，以近400節極速直撲「${targetShip.name}」！`,
            });
          }
        }
      }

      // 3. 一般神風特攻機 (A6M5 / Suisei Suicide Attack)
      if (plane.isKamikaze || plane.model === 'kamikaze_zero' || plane.model === 'kamikaze_judy') {
        const targetShip =
          this.playerShips.find((s) => !s.isSunk && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3200)) ||
          this.getFlagship();

        if (targetShip) {
          const d = dist(plane.pos, targetShip.pos);
          plane.targetHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);

          // 距離小於 950米 時進入特攻俯衝
          if (d < 950 && plane.state !== 'kamikaze_dive') {
            plane.state = 'kamikaze_dive';
            plane.speed = 220;
            soundEngine.playDiveBomberWhistle();
            this.addCombatLog({
              category: 'air',
              sourceSide: 'enemy',
              sourceName: plane.name,
              targetName: targetShip.name,
              actionType: 'bomb_hit',
              text: `⚠️【神風特攻俯衝啟動】敵「${plane.name}」鎖定「${targetShip.name}」進入自殺俯衝航線！防空火網集火截擊！`,
            });
          }

          if (plane.state === 'kamikaze_dive') {
            plane.altitude = Math.max(0.05, plane.altitude - dt * 0.55);
            if (Math.random() < 0.6) {
              this.particles.push({
                id: `kami-trail-${Date.now()}-${Math.random()}`,
                x: plane.pos.x,
                y: plane.pos.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.35,
                maxLife: 0.35,
                radius: 4,
                color: 'rgba(255, 87, 34, 0.7)',
                type: 'smoke',
              });
            }

            if (d < 45 || (d < 75 && plane.altitude <= 0.08)) {
              // 自殺撞擊引爆
              soundEngine.playExplosion(true);
              const suicideDmg = 1200;
              const actualDmg = Math.round(suicideDmg * (1 - targetShip.armor * 0.3));
              targetShip.health = Math.max(0, targetShip.health - actualDmg);

              this.particles.push({
                id: `kami-hit-${Date.now()}`,
                x: targetShip.pos.x,
                y: targetShip.pos.y,
                vx: 0,
                vy: 0,
                life: 0.8,
                maxLife: 0.8,
                radius: 65,
                color: '#FF5722',
                type: 'shockwave',
                shape: 'ring',
              });

              this.addCombatLog({
                category: 'naval',
                sourceSide: 'enemy',
                sourceName: '神風特別攻擊隊 (自殺撞擊)',
                targetName: targetShip.name,
                actionType: 'bomb_crit',
                isCrit: true,
                damage: actualDmg,
                diceRoll: {
                  dieType: 'd100',
                  roll: 95,
                  targetScore: 50,
                  result: 'crit',
                  rollDesc: '神風特攻機攜帶250kg航彈撞入甲板',
                },
                text: `💥【神風特攻撞擊命中！】敵機直接撞擊「${targetShip.name}」引爆250kg航彈！造成重創 (-${actualDmg} HP)！`,
              });

              if (targetShip.health <= 0) targetShip.isSunk = true;
              this.killPlane(plane);
              continue;
            }
          }
        }
      }

      // RTS Orders Execution
      if (plane.state === 'bombing_run') {
        // 保持直線穩定平飛穿越目標，沿航線直線投下串列炸彈後再脫離
        this.updateBombingRunCorridor(plane, dt);
      } else if (plane.state === 'pullout') {
        // 俯衝投彈後大G值拉起脫離 (High-G Pullout with wingtip vortex)
        plane.pulloutTimer = (plane.pulloutTimer || 1.3) - dt;
        plane.altitude = Math.min(0.85, plane.altitude + dt * 0.65);
        if (Math.random() < 0.65) {
          const perpX = -Math.sin(plane.heading) * 14;
          const perpY = Math.cos(plane.heading) * 14;
          for (const dir of [-1, 1]) {
            this.particles.push({
              id: `vortex-${Date.now()}-${Math.random()}`,
              x: plane.pos.x + perpX * dir,
              y: plane.pos.y + perpY * dir,
              vx: -Math.cos(plane.heading) * 12,
              vy: -Math.sin(plane.heading) * 12,
              life: 0.35,
              maxLife: 0.35,
              radius: 2.2,
              color: 'rgba(255, 255, 255, 0.75)',
              type: 'smoke',
            });
          }
        }
        if (plane.pulloutTimer <= 0) {
          plane.state = 'returning';
          plane.order = { type: 'rtb' };
          plane.speed = plane.maxSpeed;
        }
      } else if (plane.order.type === 'attack') {
        // Find designated target
        const targetEntity =
          this.enemyShips.find((s) => s.id === plane.order.targetId && !s.isSunk) ||
          this.aircraft.find((a) => a.id === plane.order.targetId && a.state !== 'shot_down') ||
          this.findTargetInstallation(plane.order.targetId || '');

        const targetPos = targetEntity ? targetEntity.pos : plane.order.targetPos;

        if (targetPos) {
          const dx = targetPos.x - plane.pos.x;
          const dy = targetPos.y - plane.pos.y;
          const d = Math.hypot(dx, dy);
          plane.targetHeading = Math.atan2(dy, dx);

          if (plane.hasPayload) {
            if (plane.role === 'level_bomber') {
              // ════ 水平重型轟炸機 (Level Bomber - B-17 / B-24 / B-29): 保持平流層萬米平飛航線，直線穿透投彈走廊 ════
              plane.altitude = plane.model === 'b29' ? 0.98 : 0.95;
              if (d < 520) {
                this.initiateBombingRun(plane, targetPos);
              }
            } else if (plane.payloadType === 'tiny_tim_rocket') {
              // ════ 11.75" 小蒂姆重型穿甲火箭 (Tiny Tim Heavy Standoff Rocket): 500m 遠程直線齊射 ════
              if (d < 500) {
                this.fireTinyTimRocket(plane, targetPos);
                plane.hasPayload = false;
                plane.heading += (Math.random() > 0.5 ? 1 : -1) * 0.65;
                plane.targetHeading = plane.heading;
                plane.breakawayTimer = 1.6;
              }
            } else if (plane.payloadType === 'napalm_canister') {
              // ════ 凝固汽油燃燒彈 (Napalm Firebomb Canister): 低空滑翔投擲，地面化為焦土火海 ════
              plane.altitude = Math.max(0.22, plane.altitude - dt * 0.55);
              if (d < 260) {
                this.dropNapalmCanisters(plane, targetPos);
                plane.hasPayload = false;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.3;
              }
            } else if (
              plane.payloadType === 'aerial_torpedo' ||
              plane.payloadType === 'asw_torpedo' ||
              plane.role === 'torpedo_bomber'
            ) {
              // ════ 掠海低空魚雷攻擊 (Torpedo Run): 超低空突防 320m 點穴投雷後 45度防空規避急轉脫離 ════
              if (d < 560) {
                plane.altitude = Math.max(0.12, plane.altitude - dt * 0.6);
              }
              if (d < 320) {
                this.dropAircraftTorpedo(plane, targetPos);
                plane.hasPayload = false;
                // Immediate 45-degree evasive breakaway turn to dodge ship anti-aircraft fire
                plane.heading += (Math.random() > 0.5 ? 1 : -1) * 0.78;
                plane.targetHeading = plane.heading;
                plane.breakawayTimer = 1.8;
              }
            } else if (plane.payloadType === 'mixed_bombs_rockets') {
              // ════ 攻擊機三段式強襲 (Mixed Attack): 500m火箭壓制 -> 360m機槍掃射 -> 180m精準俯衝投彈 ════
              plane.altitude = Math.max(0.26, plane.altitude - dt * 0.45);
              if (d < 500 && !plane.hasFiredRockets) {
                this.fireRockets(plane, targetPos, 4);
                plane.hasFiredRockets = true;
              }
              if (d < 360 && plane.shootCooldown <= 0) {
                this.fireAircraftGuns(plane, targetPos);
                plane.shootCooldown = 0.16;
              }
              if (d < 180) {
                this.dropBomb(plane, targetPos);
                plane.hasPayload = false;
                plane.hasFiredRockets = undefined;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.3;
              }
            } else if (plane.payloadType === 'hvar_rockets') {
              // ════ HVAR 5吋航空火箭彈 (HVAR Rockets Salvo): 520m 遠程連環齊射 ════
              if (d < 520) {
                this.fireRockets(plane, targetPos, 8);
                plane.hasPayload = false;
                plane.order = { type: 'rtb' };
                plane.state = 'returning';
                plane.altitude = 0.75;
              }
            } else if (plane.payloadType === 'aim9_sidewinder') {
              if (d < 1600) {
                const targetHostile = targetEntity || { pos: targetPos, id: plane.order.targetId || '' };
                this.fireAAMissile(plane, targetHostile as Aircraft, 'aim9');
                plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
                if ((plane.ammoRemaining || 0) <= 0) {
                  plane.hasPayload = false;
                  plane.order = { type: 'rtb' };
                  plane.state = 'returning';
                }
              }
            } else if (plane.payloadType === 'aim7_sparrow') {
              if (d < 2400) {
                const targetHostile = targetEntity || { pos: targetPos, id: plane.order.targetId || '' };
                this.fireAAMissile(plane, targetHostile as Aircraft, 'aim7');
                plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
                if ((plane.ammoRemaining || 0) <= 0) {
                  plane.hasPayload = false;
                  plane.order = { type: 'rtb' };
                  plane.state = 'returning';
                }
              }
            } else if (plane.payloadType === 'agm45_shrike') {
              if (d < 2600) {
                let radarTarget = targetEntity && 'type' in targetEntity ? targetEntity as Installation : null;
                if (!radarTarget) {
                  for (const isl of this.islands) {
                    const rInst = isl.installations.find(
                      (i) => !i.isDestroyed && i.side !== plane.side && (i.type === 'fan_song_radar' || i.type === 'radar_station')
                    );
                    if (rInst) {
                      radarTarget = rInst;
                      break;
                    }
                  }
                }
                if (radarTarget) {
                  this.fireARMShrike(plane, radarTarget);
                } else {
                  this.fireBullpupMissile(plane, targetPos);
                }
                plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
                if ((plane.ammoRemaining || 0) <= 0) {
                  plane.hasPayload = false;
                  plane.order = { type: 'rtb' };
                  plane.state = 'returning';
                }
              }
            } else if (plane.payloadType === 'agm12_bullpup') {
              if (d < 2000) {
                this.fireBullpupMissile(plane, targetPos);
                plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
                if ((plane.ammoRemaining || 0) <= 0) {
                  plane.hasPayload = false;
                  plane.order = { type: 'rtb' };
                  plane.state = 'returning';
                }
              }
            } else if (plane.payloadType === 'agm62_walleye') {
              if (d < 1600) {
                this.dropWalleyeGlideBomb(plane, targetPos);
                plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
                if ((plane.ammoRemaining || 0) <= 0) {
                  plane.hasPayload = false;
                  plane.order = { type: 'rtb' };
                  plane.state = 'returning';
                }
              }
            } else if (plane.payloadType === 'tactical_b61_nuke') {
              plane.altitude = Math.max(0.24, plane.altitude - dt * 0.5);
              if (d < 300) {
                this.dropBomb(plane, targetPos);
                plane.hasPayload = false;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.5;
                plane.speed = plane.maxSpeed * 1.35;
              }
            } else if (plane.payloadType === 'opfor_tactical_nuke') {
              if (d < 450) {
                this.dropSingleCorridorBomb(plane, targetPos, 0, 1, 0);
                plane.hasPayload = false;
                plane.state = 'returning';
                plane.order = { type: 'rtb' };
              }
            } else if (plane.payloadType === 'bombs_snakeye_retarded') {
              plane.altitude = Math.max(0.2, plane.altitude - dt * 0.6);
              if (d < 260) {
                this.dropSnakeyeBombs(plane, targetPos);
                plane.hasPayload = false;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.3;
              }
            } else if (plane.payloadType === 'ffar_rockets_pod') {
              if (d < 520) {
                this.fireRockets(plane, targetPos, 16);
                plane.hasPayload = false;
                plane.order = { type: 'rtb' };
                plane.state = 'returning';
              }
            } else if (plane.payloadType === 'helo_assault_troops') {
              plane.altitude = Math.max(0.12, plane.altitude - dt * 0.4);
              if (d < 150) {
                this.dropHeloAssaultTroops(plane, targetPos);
                plane.hasPayload = false;
                plane.order = { type: 'rtb' };
                plane.state = 'returning';
              }
            } else if (plane.payloadType === 'c1_paratroopers') {
              plane.altitude = 0.5;
              if (d < 220) {
                this.dropParatroopers(plane, targetPos);
                plane.hasPayload = false;
                plane.order = { type: 'rtb' };
                plane.state = 'returning';
              }
            } else if (
              plane.payloadType === 'asw_depth_bombs' ||
              plane.payloadType === 'depth_bombs' ||
              plane.payloadType === 'scout_depth_charge'
            ) {
              // ════ 航空深水炸彈群 (ASW Depth Bomb Attack): 低空震盪獵潛 ════
              plane.altitude = Math.max(0.22, plane.altitude - dt * 0.45);
              if (d < 220) {
                this.dropDepthBombs(plane, targetPos);
                plane.hasPayload = false;
                plane.order = { type: 'rtb' };
                plane.state = 'returning';
                plane.altitude = 0.75;
              }
            } else if (
              plane.payloadType === 'bomb_500' ||
              plane.payloadType === 'bomb_1000' ||
              plane.payloadType === 'bomb_1600' ||
              plane.payloadType === 'bomb_2000' ||
              plane.payloadType === 'bombs_dual_500' ||
              plane.role === 'dive_bomber'
            ) {
              // ════ 高空垂直呼嘯俯衝轟炸 (High-Angle Screaming Dive Bombing) ════
              if (d < 480 && plane.state !== 'diving') {
                plane.state = 'diving';
                soundEngine.playDiveBomberWhistle();
                plane.speed = plane.maxSpeed * 1.35;
              }

              if (plane.state === 'diving') {
                plane.altitude = Math.max(0.18, plane.altitude - dt * 1.05);
              }

              // Release bomb at point-blank altitude (120m distance or altitude <= 0.22)
              if (d < 120 || (plane.state === 'diving' && plane.altitude <= 0.22)) {
                this.dropBomb(plane, targetPos);
                plane.hasPayload = false;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.3;
              }
            } else {
              // 通用對地/對艦投彈
              plane.altitude = Math.max(0.28, plane.altitude - dt * 0.45);
              if (d < 360 && plane.shootCooldown <= 0) {
                this.fireAircraftGuns(plane, targetPos);
                plane.shootCooldown = 0.16;
              }
              if (d < 180) {
                this.dropBomb(plane, targetPos);
                plane.hasPayload = false;
                plane.state = 'pullout';
                plane.pulloutTimer = 1.2;
              }
            }
          } else {
            // Dogfight intercept & strafe
            plane.shootCooldown -= dt;
            if (plane.shootCooldown <= 0 && d < 240) {
              this.fireAircraftGuns(plane, targetPos);
              plane.shootCooldown = 0.2;
            }
          }
        }
      } else if (plane.order.type === 'patrol' || plane.state === 'patrolling') {
        // Orbit patrol area & auto-intercept hostile planes entering perimeter
        const center = plane.order.patrolOrigin || (flagship ? flagship.pos : plane.pos);

        // SARH continuous radar illumination lock
        if (plane.sarhHoldTimer !== undefined && plane.sarhHoldTimer > 0 && plane.sarhIlluminatingTargetId) {
          plane.sarhHoldTimer -= dt;
          const illTarget = this.aircraft.find((a) => a.id === plane.sarhIlluminatingTargetId && a.state !== 'shot_down');
          if (illTarget) {
            plane.targetHeading = Math.atan2(illTarget.pos.y - plane.pos.y, illTarget.pos.x - plane.pos.x);
          } else {
            plane.sarhIlluminatingTargetId = undefined;
            plane.sarhHoldTimer = 0;
          }
        }

        // In Era 4 or with modern radar, fighters have 2400m radar search range!
        const isModernFighter = this.era === 'era4' || plane.payloadType === 'aim7_sparrow' || plane.payloadType === 'aim9_sidewinder';
        const radarPerimeter = isModernFighter ? 2400 : 420;

        // Find hostile aircraft within patrol radar
        const hostile = this.aircraft.find(
          (a) => a.side !== plane.side && a.state !== 'shot_down' && dist(plane.pos, a.pos) < radarPerimeter
        );

        if (hostile && plane.role === 'fighter') {
          const hDist = dist(plane.pos, hostile.pos);
          plane.targetHeading = Math.atan2(hostile.pos.y - plane.pos.y, hostile.pos.x - plane.pos.x);
          plane.shootCooldown -= dt;

          if (isModernFighter) {
            // 1. BVR Engagement (800m - 2400m): AIM-7 Sparrow SARH (1 missile, holds nose illumination)
            if (hDist >= 800 && hDist <= 2400 && (plane.sarhHoldTimer || 0) <= 0 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, hostile, 'aim7');
              plane.shootCooldown = 6.0;
            }
            // 2. Dogfight Salvo (< 800m): Dual AIM-9 Sidewinder Salvo (ripple 2 missiles)
            else if (hDist < 800 && hDist > 220 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, hostile, 'aim9');
              setTimeout(() => {
                if (plane.state !== 'shot_down') {
                  this.fireAAMissile(plane, hostile, 'aim9');
                }
              }, 250);
              plane.shootCooldown = 5.0;
            }
            // 3. Close Guns (< 240m): M61 Vulcan stream
            else if (hDist <= 240 && plane.shootCooldown <= 0) {
              this.fireAircraftGuns(plane, hostile.pos);
              plane.shootCooldown = 0.18;
            }
          } else {
            // Era 1 - 3 WWII/Korea machine guns
            if (plane.shootCooldown <= 0 && hDist < 220) {
              this.fireAircraftGuns(plane, hostile.pos);
              plane.shootCooldown = 0.22;
            }
          }
        } else {
          // Circular orbit
          const orbitR = 250;
          const a = Date.now() * 0.0016;
          const ox = center.x + Math.cos(a) * orbitR + plane.wingmanOffset.x;
          const oy = center.y + Math.sin(a) * orbitR + plane.wingmanOffset.y;
          plane.targetHeading = Math.atan2(oy - plane.pos.y, ox - plane.pos.x);
        }
      } else if (plane.order.type === 'move' && plane.order.targetPos) {
        const dx = plane.order.targetPos.x - plane.pos.x;
        const dy = plane.order.targetPos.y - plane.pos.y;
        plane.targetHeading = Math.atan2(dy, dx);
        if (Math.hypot(dx, dy) < 40) {
          plane.order = { type: 'patrol', patrolOrigin: { ...plane.pos } };
          plane.state = 'patrolling';
        }
      } else if (plane.state === 'returning' || plane.order.type === 'rtb') {
        if (plane.side === 'player') {
          const isLandBased =
            plane.squadronId.startsWith('sq-afb-') ||
            plane.model === 'b29' ||
            plane.model === 'b17' ||
            plane.model === 'b24' ||
            plane.model === 'f86' ||
            plane.model === 'p51' ||
            plane.model === 'p47' ||
            plane.model === 'p38' ||
            plane.model === 'p40' ||
            plane.model === 'a20' ||
            plane.model === 'a26';

          if (isLandBased) {
            // 友軍陸基戰機返航至 Henderson Field / Wonsan 前進基地
            const basePos = this.friendlyBase?.center || { x: 2000, y: 12400 };
            const dx = basePos.x - plane.pos.x;
            const dy = basePos.y - plane.pos.y;
            const d = Math.hypot(dx, dy);
            plane.targetHeading = Math.atan2(dy, dx);
            plane.altitude = plane.model === 'b29' ? 0.98 : Math.min(0.85, plane.altitude + dt * 0.2);

            if (d < 65) {
              // 成功降落基地並補入庫存
              this.airbasePlanes[plane.model] = (this.airbasePlanes[plane.model] || 0) + 1;
              const baseName = this.friendlyBase?.name || (this.era === 'era3' ? 'Wonsan Airfield' : 'Henderson Field');
              this.addCombatLog({
                category: 'air',
                sourceSide: 'player',
                sourceName: '前進航空基地 (AFB)',
                targetName: plane.name,
                actionType: 'recon_spotted',
                text: plane.model === 'b29'
                  ? `🛬【戰略重轟平安返降】「${plane.name}」完成長程作戰任務返降 ${baseName}，庫存整備入庫！`
                  : `🛬【陸基戰機平安返航】「${plane.name}」完成長程作戰任務返降 ${baseName}，整備入庫！`,
              });
              this.aircraft.splice(i, 1);
              continue;
            }
          } else {
            // 艦載機返航降落航母甲板
            if (flagship) {
              const dx = flagship.pos.x - plane.pos.x;
              const dy = flagship.pos.y - plane.pos.y;
              const d = Math.hypot(dx, dy);
              plane.targetHeading = Math.atan2(dy, dx);
              plane.altitude = Math.min(0.8, plane.altitude + dt * 0.2);

              if (d < 50) {
                if (flagship.carrierPlanes) {
                  flagship.carrierPlanes.ready[plane.model] = (flagship.carrierPlanes.ready[plane.model] || 0) + 1;
                }
                this.aircraft.splice(i, 1);
                continue;
              }
            }
          }
        } else {
          // 敵機返航 (Enemy RTB): 返航至敵方航母或脫離戰場返回北方前線基地
          const enemyCarrier = this.enemyShips.find((s) => s.type === 'carrier' && !s.isSunk);
          if (enemyCarrier) {
            const dx = enemyCarrier.pos.x - plane.pos.x;
            const dy = enemyCarrier.pos.y - plane.pos.y;
            const d = Math.hypot(dx, dy);
            plane.targetHeading = Math.atan2(dy, dx);
            if (d < 60) {
              this.aircraft.splice(i, 1);
              continue;
            }
          } else {
            // 敵航母已沉沒或陸攻機，飛返北方作戰分界線脫離
            const exitPoint = { x: 11000, y: 1000 };
            const dx = exitPoint.x - plane.pos.x;
            const dy = exitPoint.y - plane.pos.y;
            plane.targetHeading = Math.atan2(dy, dx);
            if (Math.hypot(dx, dy) < 300 || plane.pos.y < 1200) {
              this.aircraft.splice(i, 1);
              continue;
            }
          }
        }
      }

      // Low-altitude breakaway turn timer countdown (魚雷機/火箭機投放後低空急轉脫離)
      if (plane.breakawayTimer !== undefined && plane.breakawayTimer > 0) {
        plane.breakawayTimer -= dt;
        if (plane.breakawayTimer <= 0) {
          plane.breakawayTimer = undefined;
          plane.state = 'returning';
          plane.order = { type: 'rtb' };
          plane.altitude = 0.8;
        }
      }

      // Smooth Heading
      let aDiff = plane.targetHeading - plane.heading;
      while (aDiff > Math.PI) aDiff -= Math.PI * 2;
      while (aDiff < -Math.PI) aDiff += Math.PI * 2;
      const turnSpeed = 2.4 * dt;
      if (Math.abs(aDiff) < turnSpeed) {
        plane.heading = plane.targetHeading;
      } else {
        plane.heading += Math.sign(aDiff) * turnSpeed;
      }

      // Move
      plane.vel.x = Math.cos(plane.heading) * plane.speed;
      plane.vel.y = Math.sin(plane.heading) * plane.speed;
      plane.pos.x += plane.vel.x * dt;
      plane.pos.y += plane.vel.y * dt;

      // ══════════════════════════════════════════════════════════
      // 重轟與攻擊機/俯衝轟炸機自衛火力 (Defensive Tail Gunners)
      // 尾部機槍手自動對咬尾逼近之敵方截擊戰機實施壓制性曳光彈射擊
      // ══════════════════════════════════════════════════════════
      const hasTailGunner =
        plane.role === 'level_bomber' ||
        plane.role === 'attacker' ||
        plane.role === 'dive_bomber' ||
        plane.role === 'torpedo_bomber' ||
        ['b17', 'b24', 'b29', 'a20', 'a26', 'sbd', 'sb2c', 'tbd', 'tbf', 'val', 'kate', 'judy', 'jill', 'g4m', 'tu14', 'il10'].includes(plane.model);

      if (hasTailGunner) {
        plane.rearGunnerCooldown = Math.max(0, (plane.rearGunnerCooldown || 0) - dt);
        if (plane.rearGunnerCooldown <= 0) {
          const isB29 = plane.model === 'b29';
          // B-29 超級堡壘配備 CFC 類比計算機遙控雙聯機槍塔群 (前上、後上、前下、後下與尾砲)，具備 360 度半球全向自衛火力！
          // 其他機種為後方錐形約 75 度角自衛機槍
          const pursuer = this.aircraft.find((other) => {
            if (other.side === plane.side || other.state === 'shot_down') return false;
            const d = dist(plane.pos, other.pos);
            if (isB29) return d <= 360;
            if (d > 280) return false;
            const angToOther = Math.atan2(other.pos.y - plane.pos.y, other.pos.x - plane.pos.x);
            let relAngle = angToOther - (plane.heading + Math.PI);
            while (relAngle > Math.PI) relAngle -= Math.PI * 2;
            while (relAngle < -Math.PI) relAngle += Math.PI * 2;
            return Math.abs(relAngle) < (Math.PI * 0.42);
          });

          if (pursuer) {
            this.fireTailGunnerBurst(plane, pursuer);
            plane.rearGunnerCooldown = isB29 ? 0.28 : plane.role === 'level_bomber' ? 0.36 : 0.60;
          }
        }
      }
    }
  }

  // 自衛尾部機槍向後方追擊敵機射擊曳光彈鏈
  private fireTailGunnerBurst(bomber: Aircraft, target: Aircraft) {
    soundEngine.playGunBurst();
    const isB29 = bomber.model === 'b29';
    const burstCount = isB29 ? 6 : bomber.role === 'level_bomber' ? 4 : 2;
    const bulletSpeed = 540;
    const tailAngle = Math.atan2(target.pos.y - bomber.pos.y, target.pos.x - bomber.pos.x);

    for (let b = 0; b < burstCount; b++) {
      const spread = (Math.random() - 0.5) * (isB29 ? 0.05 : 0.08);
      const bAngle = tailAngle + spread;
      const tailX = bomber.pos.x - Math.cos(bomber.heading) * (isB29 ? 4 : 12);
      const tailY = bomber.pos.y - Math.sin(bomber.heading) * (isB29 ? 4 : 12);

      this.projectiles.push({
        id: `tail-gun-${Date.now()}-${b}-${Math.random()}`,
        type: 'bullet',
        side: bomber.side,
        pos: { x: tailX, y: tailY },
        vel: { x: Math.cos(bAngle) * bulletSpeed, y: Math.sin(bAngle) * bulletSpeed },
        originPos: { x: tailX, y: tailY },
        targetPos: { ...target.pos },
        flightProgress: 0,
        maxDistance: isB29 ? 360 : 290,
        distanceTraveled: 0,
        damage: isB29 ? 24 : bomber.model === 'b17' || bomber.model === 'b24' ? 18 : 12,
        blastRadius: 6,
        speed: bulletSpeed,
        heading: bAngle,
        isDead: false,
        trail: [],
        attackerName: isB29 ? `${bomber.name} (CFC遙控砲塔群)` : `${bomber.name} 尾部自衛機槍`,
      });
    }

    target.health = Math.max(0, target.health - (isB29 ? 20 : bomber.role === 'level_bomber' ? 14 : 9));
    if (target.health <= 0) {
      this.killPlane(target);
    }
  }

  // Combat Actions
  private fireAircraftGuns(attacker: Aircraft, targetPos: Vector2D) {
    if ((attacker.gunAmmo ?? 1) <= 0) {
      if (!attacker.hasPayload) {
        attacker.order = { type: 'rtb' };
        attacker.state = 'returning';
      }
      return;
    }

    attacker.gunAmmo = Math.max(0, (attacker.gunAmmo ?? 1440) - 30);
    if (attacker.payloadType === 'clean_guns') {
      attacker.ammoRemaining = attacker.gunAmmo;
    }

    const isVulcanJet = ['f4e', 'f105', 'a7', 'ah1', 'f8', 'mig21'].includes(attacker.model);
    const burstCount = isVulcanJet ? 6 : 4;
    const bulletSpeed = isVulcanJet ? 680 : 540;
    const bulletDmg = isVulcanJet ? 32 : (attacker.model === 'f8f' || attacker.model === 'sb2c' ? 24 : 16);

    for (let b = 0; b < burstCount; b++) {
      const spread = (Math.random() - 0.5) * (isVulcanJet ? 0.02 : 0.045);
      const bAngle = attacker.heading + spread;
      const wingOffset = isVulcanJet ? 0 : (b % 2 === 0 ? 1 : -1) * (5 + Math.floor(b / 2) * 3);
      const startX = attacker.pos.x + Math.sin(attacker.heading) * wingOffset;
      const startY = attacker.pos.y - Math.cos(attacker.heading) * wingOffset;

      this.projectiles.push({
        id: `bullet-${Date.now()}-${b}-${Math.random()}`,
        type: 'bullet',
        side: attacker.side,
        pos: { x: startX, y: startY },
        vel: { x: Math.cos(bAngle) * bulletSpeed, y: Math.sin(bAngle) * bulletSpeed },
        originPos: { x: startX, y: startY },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: isVulcanJet ? 450 : 320,
        distanceTraveled: 0,
        damage: bulletDmg,
        blastRadius: isVulcanJet ? 10 : 8,
        speed: bulletSpeed,
        heading: bAngle,
        isDead: false,
        trail: [],
        attackerName: attacker.name,
        isBeamTracer: isVulcanJet,
      });
    }
  }

  private fireRockets(plane: Aircraft, targetPos: Vector2D, count: number = 8) {
    soundEngine.playRocketWhoosh();
    const rocketSpeed = 580;
    const baseAngle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);

    for (let i = 0; i < count; i++) {
      const angleSpread = baseAngle + (i - (count - 1) / 2) * 0.038 + (Math.random() - 0.5) * 0.015;
      const offsetSide = (i % 2 === 0 ? 1 : -1) * (12 + Math.floor(i / 2) * 2.5);
      const startX = plane.pos.x + Math.sin(plane.heading) * offsetSide;
      const startY = plane.pos.y - Math.cos(plane.heading) * offsetSide;

      this.projectiles.push({
        id: `rocket-${Date.now()}-${i}`,
        type: 'rocket',
        side: plane.side,
        pos: { x: startX, y: startY },
        vel: { x: Math.cos(angleSpread) * rocketSpeed, y: Math.sin(angleSpread) * rocketSpeed },
        originPos: { x: startX, y: startY },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: 580,
        distanceTraveled: 0,
        damage: 230, // 8 x 230 = 1840 salvo damage!
        blastRadius: 26,
        speed: rocketSpeed,
        heading: angleSpread,
        isDead: false,
        trail: [],
        attackerName: `${plane.name} (HVAR火箭)`,
        sourceModel: plane.model,
      });
    }
  }

  private fireTinyTimRocket(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playRocketWhoosh();
    soundEngine.playGunSalvo(false);
    const rocketSpeed = 620;
    const baseAngle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const attackerName = `${plane.name} (小蒂姆 11.75" 巨型火箭 #${plane.id.slice(-4)})`;

    for (let i = 0; i < 2; i++) {
      const offsetSide = i === 0 ? -14 : 14;
      const startX = plane.pos.x + Math.sin(plane.heading) * offsetSide;
      const startY = plane.pos.y - Math.cos(plane.heading) * offsetSide;
      const angle = baseAngle + (i === 0 ? -0.015 : 0.015);

      // Rocket ignition flash & heavy smoke plume
      this.particles.push({
        id: `tinytim-ign-${Date.now()}-${i}`,
        x: startX,
        y: startY,
        vx: -Math.cos(angle) * 30,
        vy: -Math.sin(angle) * 30,
        life: 0.45,
        maxLife: 0.45,
        radius: 6.5,
        color: '#FF6D00',
        type: 'fire',
      });

      this.projectiles.push({
        id: `tinytim-${Date.now()}-${i}-${Math.random()}`,
        type: 'rocket',
        side: plane.side,
        pos: { x: startX, y: startY },
        vel: { x: Math.cos(angle) * rocketSpeed, y: Math.sin(angle) * rocketSpeed },
        originPos: { x: startX, y: startY },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: 620,
        distanceTraveled: 0,
        damage: 1850,
        blastRadius: 56,
        speed: rocketSpeed,
        heading: angle,
        isDead: false,
        trail: [],
        isTinyTim: true,
        attackerName,
        sourceModel: plane.model,
        bombType: 'tiny_tim_rocket',
      });
    }

    if (plane.side === 'player') {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '目標戰略工事/艦艇',
        actionType: 'bomb_hit',
        text: `🚀【小蒂姆火箭齊射】${attackerName} 於 500m 距離齊射 2 枚 11.75吋「小蒂姆」重型穿甲火箭！500磅穿甲戰鬥部呼嘯直撲目標！`,
      });
    }
  }

  private dropNapalmCanisters(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const attackerName = `${plane.name} (凝固汽油燃燒罐 #${plane.id.slice(-4)})`;
    const dispX = (Math.random() - 0.5) * 20;
    const dispY = (Math.random() - 0.5) * 20;
    const actualTarget = { x: targetPos.x + dispX, y: targetPos.y + dispY };

    for (let i = 0; i < 2; i++) {
      const offsetSide = i === 0 ? -11 : 11;
      const startX = plane.pos.x + Math.sin(plane.heading) * offsetSide;
      const startY = plane.pos.y - Math.cos(plane.heading) * offsetSide;
      const bTarget = {
        x: actualTarget.x + Math.cos(plane.heading) * (i * 18 - 9),
        y: actualTarget.y + Math.sin(plane.heading) * (i * 18 - 9),
      };
      const bDist = Math.max(1, dist({ x: startX, y: startY }, bTarget));

      this.projectiles.push({
        id: `napalm-${Date.now()}-${i}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { x: startX, y: startY },
        vel: { x: 0, y: 0 },
        originPos: { x: startX, y: startY },
        targetPos: bTarget,
        flightProgress: 0,
        maxDistance: bDist,
        distanceTraveled: 0,
        damage: 1200,
        blastRadius: 62,
        speed: 260,
        heading: plane.heading,
        isDead: false,
        trail: [],
        isNapalm: true,
        tumbleAngle: 0,
        attackerName,
        sourceModel: plane.model,
        bombType: 'napalm_canister',
      });
    }

    if (plane.side === 'player') {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '敵灘頭防禦陣地',
        actionType: 'bomb_hit',
        text: `🔥【凝固汽油彈投放】${attackerName} 掠地投下 2 具凝固汽油燃燒罐！鋁製罐體空中翻滾砸向敵目標陣地！`,
      });
    }
  }

  private fireTailGunner(bomber: Aircraft, targetFighter: Aircraft) {
    soundEngine.playPlaneGun();
    const tailAngle = bomber.heading + Math.PI;
    const originX = bomber.pos.x + Math.cos(tailAngle) * 16;
    const originY = bomber.pos.y + Math.sin(tailAngle) * 16;
    const dx = targetFighter.pos.x - originX;
    const dy = targetFighter.pos.y - originY;
    const d = Math.hypot(dx, dy);
    const fireAngle = Math.atan2(dy, dx);
    const bulletSpeed = 560;

    // Backward tracer stream from tail/dorsal turret
    for (let b = 0; b < 2; b++) {
      const spread = (Math.random() - 0.5) * 0.1;
      const bAngle = fireAngle + spread;
      this.projectiles.push({
        id: `tailgun-${Date.now()}-${b}-${Math.random()}`,
        type: 'bullet',
        side: bomber.side,
        pos: { x: originX, y: originY },
        vel: { x: Math.cos(bAngle) * bulletSpeed, y: Math.sin(bAngle) * bulletSpeed },
        originPos: { x: originX, y: originY },
        targetPos: { x: originX + Math.cos(bAngle) * d, y: originY + Math.sin(bAngle) * d },
        flightProgress: 0,
        maxDistance: d + 40,
        distanceTraveled: 0,
        damage: bomber.role === 'level_bomber' ? 28 : 18,
        blastRadius: 8,
        speed: bulletSpeed,
        heading: bAngle,
        isDead: false,
        trail: [],
        attackerName: `${bomber.name} (自衛尾部機槍)`,
      });
    }

    if (Math.random() < 0.6) {
      const dmg = bomber.role === 'level_bomber' ? 36 : 22;
      targetFighter.health = Math.max(0, targetFighter.health - dmg);
      if (targetFighter.health <= 0) {
        this.killPlane(targetFighter);
        this.addCombatLog({
          category: 'air',
          sourceSide: bomber.side,
          sourceName: `${bomber.name} 尾部機槍射手`,
          targetName: targetFighter.name,
          actionType: 'recon_spotted',
          text: `🎯【自衛火力擊落！】${bomber.name} 尾部機槍手冷靜鎖定咬尾敵機「${targetFighter.name}」，自衛火網將其當空打爆！`,
        });
      }
    }
  }

  private initiateBombingRun(plane: Aircraft, targetPos: Vector2D) {
    plane.state = 'bombing_run';
    const headingToTarget = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    plane.bombingRunHeading = headingToTarget;
    plane.targetHeading = headingToTarget;
    plane.heading = headingToTarget;
    plane.bombingRunTarget = { ...targetPos };

    const pType: AircraftPayloadType =
      plane.payloadType ||
      (plane.model === 'b24'
        ? 'bombs_quad_500'
        : plane.model === 'b29'
        ? 'bombs_carpet_250'
        : 'bombs_carpet_250');

    const m = plane.model;
    let dropsTotal = 12;

    if (
      pType === 'b52_megaton_nuke' ||
      pType === 'tactical_b61_nuke' ||
      pType === 'opfor_tactical_nuke' ||
      pType === 'tactical_nuke'
    ) {
      dropsTotal = 1;
    } else if (pType === 'b52_megaton_carpet' || m === 'b52') {
      dropsTotal = 36;
    } else if (pType === 'bombs_carpet_250') {
      dropsTotal = m === 'b29' ? 24 : m === 'b24' ? 16 : 12;
    } else if (pType === 'bombs_quad_500') {
      dropsTotal = m === 'b29' ? 16 : m === 'b24' ? 10 : 8;
    } else if (pType === 'bombs_dual_1000' || pType === 'bomb_1000') {
      dropsTotal = m === 'b29' ? 8 : m === 'b24' ? 6 : 4;
    } else if (pType === 'bomb_1600_ap' || pType === 'bomb_1600' || pType === 'bomb_2000') {
      dropsTotal = m === 'b29' ? 4 : 2;
    } else if (pType === 'bombs_dual_500') {
      dropsTotal = m === 'b29' ? 12 : m === 'b24' ? 8 : 6;
    } else {
      dropsTotal = m === 'b29' ? 16 : m === 'b24' ? 10 : 8;
    }

    plane.bombingDropsTotal = dropsTotal;
    plane.bombingDropsLeft = dropsTotal;
    plane.bombingDropCooldown = 0;
    soundEngine.playTorpedoLaunch();

    if (plane.side === 'player') {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: plane.name,
        targetName: '目標戰略空域',
        actionType: 'recon_spotted',
        text: `✈️【轟炸航線鎖定】「${plane.name}」建立直線平飛穿透投彈航線，進入平流層轟炸走廊！`,
      });
    }
  }

  private updateBombingRunCorridor(plane: Aircraft, dt: number) {
    // 保持平流層萬米平飛與絕對直線航向，不轉彎、不甩圈
    plane.altitude = plane.model === 'b52' ? 0.99 : plane.model === 'b29' ? 0.98 : 0.95;
    if (plane.bombingRunHeading !== undefined) {
      plane.targetHeading = plane.bombingRunHeading;
      plane.heading = plane.bombingRunHeading;
    }

    const targetPos = plane.bombingRunTarget;
    if (!targetPos) {
      plane.hasPayload = false;
      plane.state = 'returning';
      plane.order = { type: 'rtb' };
      return;
    }

    // 計算沿投彈航向的向前投影距離 (相對於目標中心: 接近中為負值，目標正上方為 0，越過後為正值)
    const forwardDist =
      (plane.pos.x - targetPos.x) * Math.cos(plane.heading) +
      (plane.pos.y - targetPos.y) * Math.sin(plane.heading);

    plane.bombingDropCooldown = (plane.bombingDropCooldown || 0) - dt;

    const pType = plane.payloadType;
    const m = plane.model;
    let nextCd = 0.08;
    if (pType === 'b52_megaton_carpet') {
      nextCd = 0.04;
    } else if (pType === 'bombs_carpet_250') {
      nextCd = m === 'b29' ? 0.055 : m === 'b24' ? 0.07 : 0.085;
    } else if (pType === 'bombs_quad_500') {
      nextCd = m === 'b29' ? 0.075 : m === 'b24' ? 0.09 : 0.105;
    } else if (pType === 'bombs_dual_1000' || pType === 'bomb_1000') {
      nextCd = 0.13;
    } else if (pType === 'bomb_1600_ap' || pType === 'bomb_1600' || pType === 'bomb_2000') {
      nextCd = 0.20;
    } else {
      nextCd = 0.08;
    }

    const dropsTotal = plane.bombingDropsTotal || 16;
    const stickLength = Math.max(130, Math.min(260, (dropsTotal - 1) * nextCd * plane.speed));
    const halfSpan = stickLength / 2;
    const forwardFallDist = 65;
    const startDropDist = -(halfSpan + forwardFallDist);

    if ((plane.bombingDropsLeft ?? 0) > 0 && (plane.bombingDropCooldown ?? 0) <= 0) {
      if (
        plane.payloadType === 'tactical_nuke' ||
        plane.payloadType === 'b52_megaton_nuke' ||
        plane.payloadType === 'tactical_b61_nuke' ||
        plane.payloadType === 'opfor_tactical_nuke'
      ) {
        if (forwardDist >= -20 && forwardDist <= 35) {
          this.dropSingleCorridorBomb(plane, targetPos, 0, 1, 0);
          plane.bombingDropsLeft = 0;
        }
      } else {
        if (forwardDist >= startDropDist) {
          const dropIdx = dropsTotal - (plane.bombingDropsLeft ?? 1);
          this.dropSingleCorridorBomb(plane, targetPos, dropIdx, dropsTotal, halfSpan);
          plane.bombingDropsLeft = (plane.bombingDropsLeft ?? 1) - 1;
          plane.bombingDropCooldown = nextCd;
        }
      }
    }

    const clearDist = (
      plane.payloadType === 'tactical_nuke' ||
      plane.payloadType === 'b52_megaton_nuke' ||
      plane.payloadType === 'tactical_b61_nuke' ||
      plane.payloadType === 'opfor_tactical_nuke'
    ) ? 750 : 320;

    if ((plane.bombingDropsLeft ?? 0) <= 0 && forwardDist > clearDist) {
      plane.hasPayload = false;
      plane.state = 'returning';
      plane.order = { type: 'rtb' };
      plane.speed = plane.maxSpeed;
      if (plane.side === 'player') {
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: plane.name,
          targetName: '目標戰區',
          actionType: 'recon_spotted',
          text: `🛩️【轟炸航線脫離】「${plane.name}」已完成直線平飛穿透投彈航線，安全脫離爆震波轉向返航！`,
        });
      }
    }
  }

  private dropSingleCorridorBomb(
    plane: Aircraft,
    centerTargetPos: Vector2D,
    dropIdx: number = 0,
    dropsTotal: number = 1,
    halfSpan: number = 70
  ) {
    if (plane.payloadType === 'b52_megaton_nuke') {
      const attackerName = `${plane.name} (B-52 戰略轟炸機 #${plane.id.slice(-4)})`;
      const bDist = Math.max(1, dist(plane.pos, centerTargetPos));
      this.projectiles.push({
        id: `b52-nuke-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: { ...centerTargetPos },
        flightProgress: 0,
        maxDistance: Math.max(280, bDist),
        distanceTraveled: 0,
        damage: 250000,
        blastRadius: 750,
        speed: 95,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: 'b52_megaton_nuke',
        isNuclear: true,
      });
      soundEngine.playKlaxon();
      plane.speed = 160;
      plane.altitude = 0.99;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【B-52 百萬噸級戰略熱核武器投下】B28/B41 氫彈重力墜落！全戰區毀滅衝擊波倒數！', 'player', 'sunk', 7.5);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '核心目標要塞',
        actionType: 'bomb_hit',
        text: `☢️【百萬噸戰略核打擊】B-52 於平流層高空投放 B28/B41 百萬噸級熱核武器！全戰區毀滅衝擊波準備！`,
      });
      return;
    }

    if (plane.payloadType === 'tactical_b61_nuke') {
      const attackerName = `${plane.name} (戰術核打擊機 #${plane.id.slice(-4)})`;
      const bDist = Math.max(1, dist(plane.pos, centerTargetPos));
      this.projectiles.push({
        id: `b61-nuke-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: { ...centerTargetPos },
        flightProgress: 0,
        maxDistance: Math.max(220, bDist),
        distanceTraveled: 0,
        damage: 90000,
        blastRadius: 420,
        speed: 70,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: 'tactical_b61_nuke',
        isNuclear: true,
      });
      soundEngine.playKlaxon();
      plane.speed = plane.maxSpeed * 1.35;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【B61 戰術核武器投下】超低空拋投！減速降落傘張開！打擊機急速脫離！', 'player', 'sunk', 6.5);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '敵核心工事',
        actionType: 'bomb_hit',
        text: `☢️【B61 戰術核打擊】戰術打擊機成功投放 B61 戰術核航彈，減速傘已張開，防護衝擊波！`,
      });
      return;
    }

    if (plane.payloadType === 'opfor_tactical_nuke') {
      const attackerName = `${plane.name} (敵 Il-28 獵犬噴射轟炸機 #${plane.id.slice(-4)})`;
      const bDist = Math.max(1, dist(plane.pos, centerTargetPos));
      this.projectiles.push({
        id: `opfor-nuke-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: 'enemy',
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: { ...centerTargetPos },
        flightProgress: 0,
        maxDistance: Math.max(240, bDist),
        distanceTraveled: 0,
        damage: 100000,
        blastRadius: 450,
        speed: 72,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: 'opfor_tactical_nuke',
        isNuclear: true,
      });
      soundEngine.playKlaxon();
      plane.speed = 150;
      this.addBannerAlert('☢️⚠️【敵軍戰術核航彈已投放！】敵 Il-28 投放核彈頭！全艦隊全員防衝擊波！', 'enemy', 'sunk', 8.5);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: attackerName,
        targetName: '我方特混艦隊',
        actionType: 'bomb_hit',
        text: `☢️⚠️【敵軍核打擊實施】敵方核武裝轟炸機投放戰術核航彈！目標直指我方核心陣容！`,
      });
      return;
    }

    if (plane.payloadType === 'tactical_nuke') {
      const attackerName = `${plane.name} (B-29 超級堡壘戰略轟炸機 #${plane.id.slice(-4)})`;
      const bDist = Math.max(1, dist(plane.pos, centerTargetPos));
      this.projectiles.push({
        id: `tactical-nuke-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: { ...centerTargetPos },
        flightProgress: 0,
        maxDistance: Math.max(260, bDist),
        distanceTraveled: 0,
        damage: 120000,
        blastRadius: 520,
        speed: 75,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: 'tactical_nuke',
        isNuclear: true,
      });
      soundEngine.playKlaxon();
      plane.speed = 145;
      plane.altitude = 0.99;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【B-29 戰術原子彈投下】減速降落傘張開！核分裂毀滅倒數！B-29 進入緊急超壓脫離！', 'player', 'sunk', 6.0);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '目標戰略島嶼',
        actionType: 'bomb_hit',
        text: `☢️【戰術核武器投放】${attackerName} 於目標核心上空投擲 Mk 4 戰術原子彈！減速降落傘張開緩緩降落！B-29 啟動緊急超壓加力以 145m/s (522km/h) 狂飆加速脫離爆震波範圍！消耗 4,500 CP！`,
      });
      return;
    }

    const pType: AircraftPayloadType =
      plane.payloadType ||
      (plane.model === 'b24'
        ? 'bombs_quad_500'
        : plane.model === 'b29'
        ? 'bombs_carpet_250'
        : 'bombs_carpet_250');

    const m = plane.model;
    let singleDmg = 380;
    let blastRad = 48;

    if (pType === 'b52_megaton_carpet' || m === 'b52') {
      singleDmg = 950;
      blastRad = 65;
    } else if (pType === 'bombs_carpet_250') {
      singleDmg = m === 'b29' ? 420 : m === 'b24' ? 400 : 380;
      blastRad = m === 'b29' ? 52 : m === 'b24' ? 48 : 46;
    } else if (pType === 'bombs_quad_500') {
      singleDmg = m === 'b29' ? 720 : m === 'b24' ? 680 : 650;
      blastRad = m === 'b29' ? 58 : m === 'b24' ? 54 : 52;
    } else if (pType === 'bombs_dual_1000' || pType === 'bomb_1000') {
      singleDmg = m === 'b29' ? 1500 : m === 'b24' ? 1400 : 1350;
      blastRad = m === 'b29' ? 68 : m === 'b24' ? 65 : 62;
    } else if (pType === 'bomb_1600_ap' || pType === 'bomb_1600') {
      singleDmg = m === 'b29' ? 2500 : 2400;
      blastRad = 76;
    } else if (pType === 'bomb_2000') {
      singleDmg = 2600;
      blastRad = 86;
    } else if (pType === 'bombs_dual_500') {
      singleDmg = 750;
      blastRad = 50;
    } else {
      singleDmg = 650;
      blastRad = 52;
    }

    // 航彈落點幾何：嚴格沿著穿越目標中心的轟炸走廊排列成直線連環彈幕
    const progress = dropsTotal > 1 ? dropIdx / (dropsTotal - 1) : 0.5;
    const distAlongAxis = -halfSpan + progress * (halfSpan * 2);
    // 雙排彈艙交替橫向微偏 (左右彈艙交替釋放感)
    const lateralDeviation = ((dropIdx % 2 === 0 ? 1 : -1) * (5 + (dropIdx % 3) * 2.5)) + (Math.random() - 0.5) * 4;
    const perpHeading = plane.heading + Math.PI / 2;

    const bTarget: Vector2D = {
      x: centerTargetPos.x + Math.cos(plane.heading) * distAlongAxis + Math.cos(perpHeading) * lateralDeviation,
      y: centerTargetPos.y + Math.sin(plane.heading) * distAlongAxis + Math.sin(perpHeading) * lateralDeviation,
    };

    const bDist = Math.max(1, dist(plane.pos, bTarget));
    const attackerName = `${plane.name} (重型水平轟炸機 #${plane.id.slice(-4)})`;

    this.projectiles.push({
      id: `corridor-bomb-${Date.now()}-${Math.random()}`,
      type: 'bomb',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: 0, y: 0 },
      originPos: { ...plane.pos },
      targetPos: bTarget,
      flightProgress: 0,
      maxDistance: bDist,
      distanceTraveled: 0,
      damage: singleDmg,
      blastRadius: blastRad,
      speed: 290,
      heading: plane.heading,
      isDead: false,
      trail: [],
      attackerName,
      sourceModel: plane.model,
      bombType: pType,
    });
  }

  private dropCarpetBomb(plane: Aircraft, targetPos: Vector2D) {
    this.initiateBombingRun(plane, targetPos);
  }

  private dropDepthBombs(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playWaterSplash();
    const count = plane.payloadType === 'scout_depth_charge' ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const spreadX = plane.pos.x + Math.cos(plane.heading) * (i * 24);
      const spreadY = plane.pos.y + Math.sin(plane.heading) * (i * 24);
      this.projectiles.push({
        id: `air-dc-${Date.now()}-${i}`,
        type: 'depth_charge',
        side: plane.side,
        pos: { x: spreadX, y: spreadY },
        vel: { x: plane.vel.x * 0.15, y: plane.vel.y * 0.15 },
        originPos: { x: spreadX, y: spreadY },
        targetPos: { x: spreadX, y: spreadY },
        flightProgress: 0,
        maxDistance: 0,
        distanceTraveled: 0,
        damage: plane.payloadType === 'scout_depth_charge' ? 320 : 420,
        blastRadius: 65,
        speed: 0,
        heading: plane.heading,
        isDead: false,
        trail: [],
        fuseTimer: 0.7 + i * 0.25,
      });
    }
  }

  private dropBomb(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const pType = plane.payloadType || 'bomb_1000';
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;

    // Realistic Ballistic Dispersion (散佈圓機制):
    // 俯衝轟炸機精確度最高 (CEP ~26m)；戰鬥機俯衝 (~46m)；魚雷機/水上機水平投彈 (~68m)
    const dispersionRadius =
      plane.role === 'dive_bomber'
        ? 26
        : plane.role === 'fighter'
        ? 46
        : 68;

    const dispX = (Math.random() - 0.5) * 2 * dispersionRadius;
    const dispY = (Math.random() - 0.5) * 2 * dispersionRadius;
    const actualTarget = { x: targetPos.x + dispX, y: targetPos.y + dispY };

    if (pType === 'tactical_b61_nuke') {
      const bDist = Math.max(1, dist(plane.pos, actualTarget));
      this.projectiles.push({
        id: `b61-nuke-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: actualTarget,
        flightProgress: 0,
        maxDistance: Math.max(220, bDist),
        distanceTraveled: 0,
        damage: 90000,
        blastRadius: 420,
        speed: 70,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: 'tactical_b61_nuke',
        isNuclear: true,
      });
      soundEngine.playKlaxon();
      plane.speed = plane.maxSpeed * 1.35;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【B61 戰術核武器投下】超低空拋投！減速降落傘張開！打擊機急速脫離！', 'player', 'sunk', 6.5);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '敵核心工事',
        actionType: 'bomb_hit',
        text: `☢️【B61 戰術核打擊】戰術打擊機成功投放 B61 戰術核航彈，減速傘已張開，防護衝擊波！`,
      });
      return;
    }

    if (pType === 'bombs_dual_500') {
      // Dual 500lb bombs along flight path with slight stagger
      for (let b = -1; b <= 1; b += 2) {
        const lateralX = Math.sin(plane.heading) * (b * 12) + (Math.random() - 0.5) * 14;
        const lateralY = -Math.cos(plane.heading) * (b * 12) + (Math.random() - 0.5) * 14;
        const bTarget = { x: actualTarget.x + lateralX, y: actualTarget.y + lateralY };
        const bDist = Math.max(1, dist(plane.pos, bTarget));
        this.projectiles.push({
          id: `bomb-${Date.now()}-${b}-${Math.random()}`,
          type: 'bomb',
          side: plane.side,
          pos: { x: plane.pos.x + lateralX, y: plane.pos.y + lateralY },
          vel: { x: 0, y: 0 },
          originPos: { x: plane.pos.x + lateralX, y: plane.pos.y + lateralY },
          targetPos: bTarget,
          flightProgress: 0,
          maxDistance: bDist,
          distanceTraveled: 0,
          damage: 750, // 2 x 750 = 1500 damage!
          blastRadius: 48,
          speed: 340,
          heading: plane.heading,
          isDead: false,
          trail: [],
          attackerName,
          sourceModel: plane.model,
          bombType: 'bombs_dual_500',
        });
      }
    } else {
      const isSuperHeavy = pType === 'bomb_1600';
      const isLight = pType === 'bomb_500';
      const dmg = isSuperHeavy ? 2400 : isLight ? 850 : 1650;
      const blast = isSuperHeavy ? 72 : isLight ? 45 : 58;
      const bDist = Math.max(1, dist(plane.pos, actualTarget));

      this.projectiles.push({
        id: `bomb-${Date.now()}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: actualTarget,
        flightProgress: 0,
        maxDistance: bDist,
        distanceTraveled: 0,
        damage: dmg,
        blastRadius: blast,
        speed: 340,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName,
        sourceModel: plane.model,
        bombType: pType,
      });
    }

    if (plane.side === 'player') {
      const bombName = PAYLOAD_CATALOG[pType]?.nameZh || '航空炸彈';
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: '目標區域',
        actionType: 'bomb_hit',
        text: `【高空投彈】${attackerName} 進入攻擊航線，向目標區域俯衝投下 ${bombName}！`,
      });
    }
  }

  private dropAircraftTorpedo(plane: Aircraft, targetPos?: Vector2D) {
    soundEngine.playTorpedoLaunch();
    soundEngine.playWaterSplash();
    // Realistic WWII Aerial Torpedo Speed: 95 (calibrated to historical 33~40 knots)
    const speed = 95;
    const dropAngle = targetPos
      ? Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x)
      : plane.heading;

    // Splash particle on water entry
    this.particles.push({
      id: `torp-splash-${Date.now()}`,
      x: plane.pos.x,
      y: plane.pos.y,
      vx: 0,
      vy: 0,
      life: 0.6,
      maxLife: 0.6,
      radius: 26,
      color: '#80DEEA',
      type: 'geyser',
      shape: 'ring',
    });

    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    this.projectiles.push({
      id: `torp-air-${Date.now()}`,
      type: 'torpedo',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(dropAngle) * speed, y: Math.sin(dropAngle) * speed },
      originPos: { ...plane.pos },
      targetPos: { x: plane.pos.x + Math.cos(dropAngle) * 1400, y: plane.pos.y + Math.sin(dropAngle) * 1400 },
      flightProgress: 0,
      maxDistance: 1400,
      distanceTraveled: 0,
      damage: plane.model === 'tbf' ? 1450 : 1200, // Massive waterline torpedo devastation!
      blastRadius: 38,
      speed,
      heading: dropAngle,
      isDead: false,
      trail: [],
      attackerName,
      sourceModel: plane.model,
      isAcousticHoming: plane.payloadType === 'asw_torpedo',
    });

    if (plane.side === 'player') {
      const isAsw = plane.payloadType === 'asw_torpedo';
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: isAsw ? '水下潛艇/水面艦' : '敵水面艦艇',
        actionType: 'torpedo_hit',
        text: isAsw
          ? `【聲自導反潛雷投放】${attackerName} 掠海投放 Mk 24 聲自導反潛魚雷！聲吶水下被動聽音主動搜索鎖定目標！`
          : `【掠海投雷】${attackerName} 釋放 Mk 13 高速航空魚雷！水中航速 340節，直指目標！`,
      });
    }
  }

  private dropDepthCharge(ship: Ship) {
    soundEngine.playTorpedoLaunch();
    const sternX = ship.pos.x - Math.cos(ship.heading) * (ship.length * 0.45);
    const sternY = ship.pos.y - Math.sin(ship.heading) * (ship.length * 0.45);

    this.projectiles.push({
      id: `dc-${Date.now()}`,
      type: 'depth_charge',
      side: ship.side,
      pos: { x: sternX, y: sternY },
      vel: { x: 0, y: 0 },
      originPos: { x: sternX, y: sternY },
      targetPos: { x: sternX, y: sternY },
      flightProgress: 0,
      maxDistance: 0,
      distanceTraveled: 0,
      damage: 500,
      blastRadius: 70,
      speed: 0,
      heading: 0,
      isDead: false,
      trail: [],
      fuseTimer: 1.5,
    });
  }

  private fireHedgehogSalvo(ship: Ship, targetPos: Vector2D) {
    soundEngine.playGunSalvo(false);
    const bowX = ship.pos.x + Math.cos(ship.heading) * (ship.length * 0.45);
    const bowY = ship.pos.y + Math.sin(ship.heading) * (ship.length * 0.45);

    const launchAngle = Math.atan2(targetPos.y - bowY, targetPos.x - bowX);

    // Salvo pattern: 24 projectiles arranged in a 4x6 grid, rotated along launch angle
    const rows = 4;
    const cols = 6;
    const gridSpacing = 7;

    this.addBannerAlert(`🦔【刺蝟砲齊射】「${ship.name}」聲納鎖定敵潛艇！艦艏刺蝟反潛迫擊砲 24聯裝彈幕齊射！`, 'player', 'alert', 4.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: `${ship.name} (艦艏刺蝟砲)`,
      targetName: '敵方潛艦',
      actionType: 'gun_hit',
      text: `🦔【刺蝟砲 24聯裝超前發射】「${ship.name}」前方聲納鎖定水下威脅！艦艏拋射 24枚 刺蝟反潛迫擊砲彈形成橢圓覆蓋網！觸發式引信接觸即爆！`,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const forwardOffset = (r - (rows - 1) / 2) * gridSpacing;
        const lateralOffset = (c - (cols - 1) / 2) * gridSpacing;

        const cellTargetX =
          targetPos.x +
          Math.cos(launchAngle) * forwardOffset -
          Math.sin(launchAngle) * lateralOffset +
          (Math.random() - 0.5) * 4;
        const cellTargetY =
          targetPos.y +
          Math.sin(launchAngle) * forwardOffset +
          Math.cos(launchAngle) * lateralOffset +
          (Math.random() - 0.5) * 4;

        const cellDist = dist({ x: bowX, y: bowY }, { x: cellTargetX, y: cellTargetY });
        const mortarSpeed = 160;

        this.projectiles.push({
          id: `hedgehog-${Date.now()}-${r}-${c}-${Math.random()}`,
          type: 'hedgehog',
          side: ship.side,
          pos: { x: bowX, y: bowY },
          vel: {
            x: ((cellTargetX - bowX) / cellDist) * mortarSpeed,
            y: ((cellTargetY - bowY) / cellDist) * mortarSpeed,
          },
          originPos: { x: bowX, y: bowY },
          targetPos: { x: cellTargetX, y: cellTargetY },
          flightProgress: 0,
          maxDistance: cellDist,
          distanceTraveled: 0,
          damage: 780,
          blastRadius: 28,
          speed: mortarSpeed,
          heading: launchAngle,
          isDead: false,
          trail: [],
          isHedgehog: true,
          arcAltitude: 0,
          attackerName: `${ship.name} 刺蝟砲`,
        });
      }
    }
  }

  private fireFlakBurst(origin: Vector2D, plane: Aircraft) {
    // ══════════════════════════════════════════════════════════
    // B-29 超高空萬米平流層巡航：免疫一般艦載與野戰防空火網！
    // 常規高射砲最高有效射高僅 6,000-8,000m，砲彈破片於低空自毀，完全無法傷及 B-29！
    // 僅有噴射截擊機 (MiG-15) 等高空攔截機能造成威脅
    // ══════════════════════════════════════════════════════════
    if ((plane.model === 'b29' || plane.model === 'b52' || (plane.role === 'level_bomber' && (plane.altitude ?? 0.8) >= 0.88)) && (plane.altitude ?? 0.8) >= 0.88) {
      if (Math.random() < 0.25) {
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'enemy',
          sourceName: '敵方防空高射火網',
          targetName: plane.flightName || plane.name,
          actionType: 'recon_spotted',
          text: `☁️【萬米平流層防空免疫】敵地面防空高射砲射高極限無法企及 (巡航高度 11,000m+ 平流層)，破片彈幕於萬米下空引爆，無法傷及「${plane.flightName || plane.name}」！`,
        });
      }
      return;
    }

    soundEngine.playFlakBurst();

    // 1. 黑色延時引信爆炸煙霧 一朵一朵的 (Flak Puffs blooming in the air around the aircraft)
    const puffCount = Math.floor(Math.random() * 2) + 2; // 2 to 3 distinct flak puff clouds
    const flakX = plane.pos.x + (Math.random() - 0.5) * 48;
    const flakY = plane.pos.y + (Math.random() - 0.5) * 48;

    for (let p = 0; p < puffCount; p++) {
      const offsetX = (Math.random() - 0.5) * 75;
      const offsetY = (Math.random() - 0.5) * 75;
      this.particles.push({
        id: `flak-puff-${Date.now()}-${p}-${Math.random()}`,
        x: plane.pos.x + offsetX,
        y: plane.pos.y + offsetY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1.6 + Math.random() * 0.8, // Lingering smoke puffs hanging in air
        maxLife: 2.4,
        radius: 20 + Math.random() * 14,
        color: '#161A1E',
        type: 'flak_puff',
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
      });
    }

    // 2. 密集群射曳光彈鏈 (Dense AA Tracer Stream arcing from ship/battery to flak altitude)
    const tracerCount = 4;
    const dx = plane.pos.x - origin.x;
    const dy = plane.pos.y - origin.y;
    const totalDist = Math.hypot(dx, dy);
    const baseAngle = Math.atan2(dy, dx);
    const aaSpeed = 580;

    for (let t = 0; t < tracerCount; t++) {
      const spread = (Math.random() - 0.5) * 0.08;
      const tAngle = baseAngle + spread;
      const tDist = Math.min(totalDist * (0.85 + t * 0.05), totalDist + 50);

      this.projectiles.push({
        id: `aa-tracer-${Date.now()}-${t}-${Math.random()}`,
        type: 'bullet',
        side: plane.side === 'player' ? 'enemy' : 'player',
        pos: {
          x: origin.x + Math.cos(tAngle) * (t * 22),
          y: origin.y + Math.sin(tAngle) * (t * 22),
        },
        vel: {
          x: Math.cos(tAngle) * aaSpeed,
          y: Math.sin(tAngle) * aaSpeed,
        },
        originPos: { ...origin },
        targetPos: {
          x: origin.x + Math.cos(tAngle) * tDist,
          y: origin.y + Math.sin(tAngle) * tDist,
        },
        flightProgress: 0,
        maxDistance: tDist,
        distanceTraveled: 0,
        damage: 18,
        blastRadius: 8,
        speed: aaSpeed,
        heading: tAngle,
        isDead: false,
        trail: [],
        attackerName: plane.side === 'player' ? '敵方防空陣地' : '艦隊防空砲火',
      });
    }

    // 系統自動擲骰判定: 防空火網破片截擊檢定 (D100)
    // 時代一 (1942): 光學與早期雷達指引，手動瞄準機砲 (感測半徑 32m，門檻 55)
    // 時代二 (1945): 引入 VT近炸引信 (Radio Proximity Fuze) 與密集博福斯機砲 (感測半徑 64m，門檻 35)
    // 時代三 (1950-53): 3"/50 Mark 33 自動高平砲與 AN/SPS 長程三維對空雷達導引 (感測半徑 76m，門檻 26，極高命中率)
    const isEra2AA = plane.side === 'enemy' && this.era === 'era2';
    const isEra3AA = plane.side === 'enemy' && this.era === 'era3';
    const roll = Math.floor(Math.random() * 100) + 1;
    const threshold = isEra3AA ? 26 : (isEra2AA ? 35 : 55);
    const burstProximityRadius = isEra3AA ? 76 : (isEra2AA ? 64 : 32);
    const isFlakHit = dist({ x: flakX, y: flakY }, plane.pos) < burstProximityRadius && roll >= threshold;

    if (isFlakHit) {
      const isCrit = roll >= (isEra3AA ? 78 : isEra2AA ? 82 : 95);
      const flakDmg = isCrit ? (isEra3AA ? 175 : isEra2AA ? 120 : 60) : (isEra3AA ? 72 : isEra2AA ? 48 : 22);
      plane.health -= flakDmg;

      const pName = plane.flightName || plane.name;
      if (isCrit || plane.health <= 0) {
        this.addCombatLog({
          category: 'aa',
          sourceSide: plane.side === 'player' ? 'enemy' : 'player',
          sourceName: isEra3AA
            ? '冷戰長程雷達自動防空火網 (3"/50 Mk 33 速射砲 & VT信管)'
            : isEra2AA
            ? '艦隊雷達射控防空火網 (5"/38 VT近炸信管 & 40mm 博福斯)'
            : plane.side === 'player'
            ? '敵方防空火網'
            : '艦隊防空砲火 (5"/38 & 40mm)',
          targetName: pName,
          actionType: 'aa_down',
          isCrit,
          damage: flakDmg,
          diceRoll: {
            dieType: 'd100',
            roll,
            targetScore: threshold,
            result: isCrit ? 'crit' : 'hit',
            rollDesc: isEra3AA
              ? `3吋自動砲VT近炸 D100: ${roll} vs 門檻 ${threshold} [${isCrit ? '自動射控致命殉爆' : '高頻速射截擊'}]`
              : isEra2AA
              ? `VT近炸信管感應 D100: ${roll} vs 門檻 ${threshold} [${isCrit ? '致命近炸殉爆' : '破片彈幕攔截'}]`
              : `D100防空擲骰: ${roll} vs 門檻 ${threshold} [${isCrit ? '致命破片殉爆' : '破片截擊'}]`,
          },
          text: isCrit
            ? (isEra3AA
                ? `🎯【3吋自動高平砲近炸殉爆 D100: ${roll} / 門檻 ${threshold}】冷戰全自動速射砲VT信管凌空殉爆！重創「${pName}」(-${flakDmg} HP)!`
                : isEra2AA
                ? `🎯【VT近炸引信暴擊殉爆 D100: ${roll} / 門檻 ${threshold}】5吋高平砲近炸引信凌空殉爆！破片重創「${pName}」發動機與油箱 (-${flakDmg} HP)!`
                : `🎲【防空暴擊擲骰 D100: ${roll} / 門檻 ${threshold}】防空彈幕命中發動機！重創「${pName}」(-${flakDmg} HP)!`)
            : (isEra3AA
                ? `🎯【3吋50倍徑雷達射控彈幕 D100: ${roll} / 門檻 ${threshold}】水冷自動防空砲每分鐘50發急速撕裂「${pName}」機身 (-${flakDmg} HP)!`
                : isEra2AA
                ? `🎯【VT近炸信管密集彈幕 D100: ${roll} / 門檻 ${threshold}】博福斯與VT近炸引信破片精準撕裂「${pName}」機身 (-${flakDmg} HP)!`
                : `🎲【防空擲骰判定 D100: ${roll} / 門檻 ${threshold}】5吋高平砲破片撕裂「${pName}」機翼 (-${flakDmg} HP)!`),
        });
      }

      if (plane.health <= 0) {
        this.killPlane(plane, roll, threshold);
      }
    }
  }

  private killPlane(plane: Aircraft, roll?: number, threshold?: number) {
    plane.state = 'shot_down';
    plane.deathTimer = 2.0; // Full dramatic crash flight sequence
    soundEngine.playExplosion(false);

    // 隨機分派二戰多元墜毀模式 (Crash failure modes: 冒煙拖尾、劇烈燃燒、空中折翼解體、螺旋自旋失速)
    const modes: ('smoke' | 'burn' | 'breakup' | 'spin')[] = ['smoke', 'burn', 'breakup', 'spin'];
    plane.crashMode = modes[Math.floor(Math.random() * modes.length)];
    plane.crashSpinSpeed = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 5.0);

    if (plane.crashMode === 'breakup') {
      plane.crashDebris = [
        {
          x: plane.pos.x,
          y: plane.pos.y,
          vx: plane.vel.x * 0.5 + (Math.random() - 0.5) * 50,
          vy: plane.vel.y * 0.5 + (Math.random() - 0.5) * 50,
          rot: plane.heading,
          rotSpeed: (Math.random() - 0.5) * 14,
          type: 'wing',
        },
        {
          x: plane.pos.x - Math.cos(plane.heading) * 10,
          y: plane.pos.y - Math.sin(plane.heading) * 10,
          vx: plane.vel.x * 0.35 + (Math.random() - 0.5) * 40,
          vy: plane.vel.y * 0.35 + (Math.random() - 0.5) * 40,
          rot: plane.heading,
          rotSpeed: (Math.random() - 0.5) * 10,
          type: 'tail',
        },
      ];
    }

    const actualRoll = roll || (Math.floor(Math.random() * 35) + 65);
    const actualThresh = threshold || 55;
    const pName = plane.flightName || plane.name;

    if (plane.side === 'enemy') {
      this.casualties.enemyPlanesLost++;
      let cpAward = 25;

      if (plane.model === 'g4m' && plane.hasOhkaAttached) {
        this.score.enemyPlanesDowned += 2;
        this.score.totalScore += 200;
        cpAward = 140;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`🎯【空戰大捷】凌空打爆敵「一式陸攻」與櫻花特攻火箭！+${cpAward} CP`, 'enemy', 'down', 6.0);
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'player',
          sourceName: '防空巡邏戰機 (CAP) / 艦隊防空',
          targetName: '一式陸攻 (載彈: 櫻花特攻火箭)',
          actionType: 'aa_down',
          isCrit: true,
          diceRoll: {
            dieType: 'd100',
            roll: 99,
            targetScore: 50,
            result: 'crit',
            rollDesc: '空中打爆一式陸攻並引爆機腹櫻花火箭彈',
          },
          text: `🎯【長程截擊大捷】巡邏空優戰機凌空打爆敵「一式陸攻」！機腹掛載之櫻花火箭特攻彈連環殉爆！特遣艦隊化險為夷！獲得 +200 分，+${cpAward} CP！`,
        });
      } else if (plane.model === 'ohka') {
        this.score.enemyPlanesDowned++;
        this.score.totalScore += 150;
        cpAward = 100;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`🎯【擊墜戰報】防空火網凌空粉碎「櫻花火箭反艦飛彈」！+${cpAward} CP`, 'enemy', 'down', 5.5);
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'player',
          sourceName: '艦隊集中防空火網 (40mm 博福斯 & 5" VT信管)',
          targetName: 'MXY-7 櫻花火箭反艦飛彈',
          actionType: 'aa_down',
          isCrit: true,
          diceRoll: {
            dieType: 'd100',
            roll: 98,
            targetScore: 60,
            result: 'crit',
            rollDesc: '防空雷達導引近炸信管凌空打爆櫻花火箭',
          },
          text: `🎯【神風櫻花擊落！】艦隊集中防空火網凌空打爆高速來襲之「櫻花火箭反艦飛彈」！獲得 +150 分，+${cpAward} CP！`,
        });
      } else if (plane.isKamikaze || plane.model === 'kamikaze_zero' || plane.model === 'kamikaze_judy') {
        this.score.enemyPlanesDowned++;
        this.score.totalScore += 100;
        cpAward = 80;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`🎯【擊墜戰報】防空彈幕阻截凌空粉碎「${pName}」！+${cpAward} CP`, 'enemy', 'down', 5.0);
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'player',
          sourceName: '艦隊密集防空火網',
          targetName: pName,
          actionType: 'aa_down',
          isCrit: true,
          diceRoll: {
            dieType: 'd100',
            roll: actualRoll,
            targetScore: actualThresh,
            result: 'crit',
            rollDesc: `D100擊墜: ${actualRoll} vs 門檻 ${actualThresh}`,
          },
          text: `🎯【神風特攻阻截成功】防空火網於半空中粉碎來襲「${pName}」！成功化解特攻撞擊！獲得 +100 分，+${cpAward} CP！`,
        });
      } else if (plane.model === 'mig15') {
        this.score.enemyPlanesDowned++;
        this.score.totalScore += 120;
        cpAward = 75;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`🎯【空戰大捷】成功擊落敵「MiG-15 後掠翼噴射戰鬥機」！+${cpAward} CP`, 'enemy', 'down', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '艦隊噴射機隊 / VT防空網',
          targetName: 'MiG-15 噴射戰鬥機',
          actionType: 'dogfight_down',
          isCrit: true,
          diceRoll: {
            dieType: 'd100',
            roll: actualRoll,
            targetScore: actualThresh,
            result: 'crit',
            rollDesc: '穿透高空高速阻截擊落MiG-15',
          },
          text: `🎯【空戰擊落 MiG-15！】我方戰機穿透高空攔截，以 20mm 機砲精準咬尾擊落敵方「MiG-15 噴射戰鬥機」！獲得 +120 分，+${cpAward} CP！`,
        });
      } else if (plane.model === 'tu14') {
        this.score.enemyPlanesDowned++;
        this.score.totalScore += 140;
        cpAward = 90;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`🎯【阻截成功】擊落敵「Tu-14 噴射魚雷/水平轟炸機」！+${cpAward} CP`, 'enemy', 'down', 5.5);
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'player',
          sourceName: '艦隊集中防空網',
          targetName: 'Tu-14 雙噴射魚雷轟炸機',
          actionType: 'aa_down',
          isCrit: true,
          text: `🎯【擊落 Tu-14！】防空火網擊碎掠海突擊之「Tu-14 噴射魚雷機」，化解反艦魚雷威脅！獲得 +140 分，+${cpAward} CP！`,
        });
      } else {
        this.score.enemyPlanesDowned++;
        this.score.totalScore += 75;
        cpAward = 50;
        this.resourcePoints += cpAward;
        this.totalCpEarned += cpAward;
        this.addBannerAlert(`✈️【擊墜戰報】成功擊墜敵「${pName}」！獲得 +${cpAward} CP`, 'enemy', 'down', 4.5);
        this.addCombatLog({
          category: 'aa',
          sourceSide: 'player',
          sourceName: '防空防護網 / 空優攔截',
          targetName: pName,
          actionType: 'aa_down',
          diceRoll: {
            dieType: 'd100',
            roll: actualRoll,
            targetScore: actualThresh,
            result: 'crit',
            rollDesc: `D100擊墜擲骰: ${actualRoll} vs 門檻 ${actualThresh}`,
          },
          text: `✈️【敵機擊落 · 擲骰判定】🎲 D100: ${actualRoll} (門檻 ${actualThresh})！成功擊墜敵方「${pName}」！獲得 +75 分，+${cpAward} CP！`,
        });
      }

      // 敵方飛行員跳傘 (POW 戰俘機制 - 75% 機率跳傘落海或降落於陸地)
      if (Math.random() < 0.75) {
        const raftId = `raft-enemy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const isOnLand = this.islands.some((isl) => isPointInPolygon(plane.pos, isl.points));
        this.lifeRafts.push({
          id: raftId,
          side: 'enemy',
          pos: { ...plane.pos },
          planeModel: plane.model,
          planeName: plane.name,
          pilotName: `OPFOR 飛行員 (${plane.name.split(' ')[0]})`,
          timer: 90,
          maxTimer: 90,
          rescued: false,
          rescueProgress: 0,
          isOnLand,
        });

        this.addCombatLog({
          category: 'air',
          sourceSide: 'enemy',
          sourceName: '落難信號 (SOS)',
          targetName: pName,
          actionType: 'recon_spotted',
          text: `🪂【敵機組員跳傘】「${pName}」被擊墜後飛行員跳傘（座標 [${Math.round(plane.pos.x)}, ${Math.round(plane.pos.y)}]）！派遣水面艦（<85-120m）或地面部隊（<85m）物理接近可將其捕獲為 POW (+100 CP)！`,
        });
      }
    } else {
      this.casualties.playerPlanesLost++;
      // 我方飛行員跳傘展開救生筏 (Life Raft, 90s 倒數窗口)
      const raftId = `raft-player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const isOnLand = this.islands.some((isl) => isPointInPolygon(plane.pos, isl.points));
      this.lifeRafts.push({
        id: raftId,
        side: 'player',
        pos: { ...plane.pos },
        planeModel: plane.model,
        planeName: plane.name,
        pilotName: pName,
        timer: 90,
        maxTimer: 90,
        rescued: false,
        rescueProgress: 0,
        isOnLand,
      });

      this.addBannerAlert(
        `🛟【跳傘救生】我方「${pName}」飛行員跳傘！派遣船隻或地面部隊物理接近救起可補回戰機！`,
        'player',
        'alert',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: '跳傘緊急頻道 (SAR Channel)',
        targetName: pName,
        actionType: 'recon_spotted',
        text: `🛟【飛行員跳傘】「${pName}」遭擊落後飛行員成功開啟救生筏（座標 [${Math.round(plane.pos.x)}, ${Math.round(plane.pos.y)}]，90秒窗口）！水面艦（<85-120m）、地面部隊（<85m）或搜救直升機物理接近即可救起補回 1 架該型戰機；若遭敵軍先接觸將損失 -80 CP！`,
      });
    }
  }

  public fireTorpedoSalvo(ship: Ship, targetPos: Vector2D, count: number = 3) {
    soundEngine.playTorpedoLaunch();
    const baseAngle = Math.atan2(targetPos.y - ship.pos.y, targetPos.x - ship.pos.x);
    const shipName = ship.codeName || ship.name;

    for (let i = 0; i < count; i++) {
      const spreadAngle = baseAngle + (i - (count - 1) / 2) * 0.08;
      const speed = 85;
      this.projectiles.push({
        id: `torp-${Date.now()}-${i}`,
        type: 'torpedo',
        side: ship.side,
        pos: { x: ship.pos.x, y: ship.pos.y },
        vel: { x: Math.cos(spreadAngle) * speed, y: Math.sin(spreadAngle) * speed },
        originPos: { ...ship.pos },
        targetPos: { x: ship.pos.x + Math.cos(spreadAngle) * 1350, y: ship.pos.y + Math.sin(spreadAngle) * 1350 },
        flightProgress: 0,
        maxDistance: 1350,
        distanceTraveled: 0,
        damage: 520,
        blastRadius: 28,
        speed,
        heading: spreadAngle,
        isDead: false,
        trail: [],
        attackerName: shipName,
      });
    }

    if (ship.side === 'player') {
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: shipName,
        targetName: '敵艦方位',
        actionType: 'torpedo_hit',
        text: `【魚雷扇形齊射】${shipName} 發射 ${count}枚 重型魚雷！水中航速 290節！`,
      });
    }
  }

  private fireTurretSalvo(ship: Ship, turret: Turret, targetPos: Vector2D) {
    const isHeavy = turret.damage > 100;
    soundEngine.playGunSalvo(isHeavy);

    const cosH = Math.cos(turret.angle);
    const sinH = Math.sin(turret.angle);
    const muzzleX = ship.pos.x + cosH * 24;
    const muzzleY = ship.pos.y + sinH * 24;

    const d = dist(ship.pos, targetPos);
    // 時代二 (Mk 37 雷達射控) 與時代三 (Mk 25 微波射控) 散佈大幅收斂，砲彈初速更高
    const dispersionFactor =
      ship.era === 'era3' ? 0.016 : ship.era === 'era2' ? 0.026 : 0.040;
    const shellSpeed = ship.era === 'era3' ? 520 : ship.era === 'era2' ? 480 : 450;

    for (let b = 0; b < turret.barrelCount; b++) {
      const spread = (Math.random() - 0.5) * (d * dispersionFactor);
      const impactPos: Vector2D = {
        x: targetPos.x + spread,
        y: targetPos.y + spread,
      };

      this.projectiles.push({
        id: `shell-${Date.now()}-${b}`,
        type: 'shell',
        side: ship.side,
        pos: { x: muzzleX, y: muzzleY },
        vel: {
          x: ((impactPos.x - muzzleX) / d) * shellSpeed,
          y: ((impactPos.y - muzzleY) / d) * shellSpeed,
        },
        originPos: { x: muzzleX, y: muzzleY },
        targetPos: impactPos,
        flightProgress: 0,
        maxDistance: d,
        distanceTraveled: 0,
        damage: turret.damage,
        blastRadius: isHeavy ? 35 : 18,
        speed: shellSpeed,
        heading: turret.angle,
        isDead: false,
        trail: [],
        attackerName: ship.codeName || ship.name,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 8 大日軍戰術空中任務編組系統 (8 Tactical Enemy Air Mission Doctrines)
  // 1. DCA (戰鬥機起飛防空)
  // 2. Air Sweep / Superiority (空中制空掃蕩 搶制空權)
  // 3. Scramble (敵機接近時緊急起飛)
  // 4. Strike package (大編隊針對旗艦反艦)
  // 5. Strike package (中編隊針對護衛艦船反艦)
  // 6. Strike package (大編隊針對陸基前進基地)
  // 7. CAS (近距空中支援針對地面單位與登陸艇)
  // 8. CAP (平時防空巡邏)
  // ══════════════════════════════════════════════════════════

  public getSafeEnemySpawnPos(): Vector2D {
    const enemyAirfield = this.islands
      .filter((island) => !island.isFriendlyBase && !island.isFullyCaptured)
      .flatMap((i) => i.installations)
      .find((inst) => inst.type === 'airfield' && inst.side === 'enemy' && !inst.isDestroyed);

    const enemyCarrier = this.enemyShips.find((s) => s.type === 'carrier' && !s.isSunk);

    let spawnPos: Vector2D;
    if (enemyAirfield) {
      spawnPos = { ...enemyAirfield.pos };
    } else if (enemyCarrier) {
      spawnPos = { ...enemyCarrier.pos };
    } else {
      spawnPos = { x: 10500 + Math.random() * 2000, y: 1200 + Math.random() * 1500 };
    }

    if (this.friendlyBase && dist(spawnPos, this.friendlyBase.center) < 4000) {
      spawnPos = { x: 10800 + Math.random() * 1500, y: 1500 + Math.random() * 1500 };
    }
    const flagship = this.getFlagship();
    if (flagship && dist(spawnPos, flagship.pos) < 2500) {
      spawnPos = { x: 11000, y: 2200 };
    }
    return spawnPos;
  }

  // ══════════════════════════════════════════════════════════
  // 敵機波次編隊動態規模演算法 (Dynamic Enemy Air Wave Sizing: 2 - 6 架)
  // 依據敵軍運作中機場數量、航母存活與戰局威脅度動態調節編隊數量
  // ══════════════════════════════════════════════════════════
  private calculateDynamicWaveSize(baseCount: number): number {
    const operationalAirfields = this.islands
      .filter((i) => !i.isFriendlyBase && !i.isFullyCaptured)
      .flatMap((i) => i.installations)
      .filter((inst) => inst.type === 'airfield' && inst.side === 'enemy' && !inst.isDestroyed).length;
    const hasCarrier = this.enemyShips.some((s) => s.type === 'carrier' && !s.isSunk);
    let size = baseCount;
    if (operationalAirfields >= 2) size += 1;
    if (hasCarrier) size += 1;
    if (operationalAirfields === 0 && !hasCarrier) size -= 1;
    // 隨機戰術波動 (±1)
    const roll = Math.random();
    if (roll < 0.35) size += 1;
    else if (roll > 0.65) size -= 1;
    return Math.max(2, Math.min(6, size));
  }

  public triggerEnemyAirDoctrine(missionType: EnemyAirMissionType) {
    const flagship = this.getFlagship();
    const spawnPos = this.getSafeEnemySpawnPos();
    const sqId = `sq-opfor-${missionType}-${Date.now()}`;
    const isEra3 = this.era === 'era3';

    // 時代機型配屬 (時代三純冷戰聯軍: MiG-15, Tu-14, Yak-9, IL-10; 時代一/二: 史實日軍機種)
    const fModel: AircraftModel = isEra3
      ? (Math.random() < 0.6 ? 'mig15' : 'yak9')
      : this.era === 'era1'
      ? (Math.random() < 0.5 ? 'zero_a6m2' : 'zero')
      : (Math.random() < 0.5 ? 'ki61' : 'george');

    const dbModel: AircraftModel = isEra3
      ? 'il10'
      : this.era === 'era1'
      ? 'val'
      : 'judy';

    const tbModel: AircraftModel = isEra3
      ? 'tu14'
      : this.era === 'era1'
      ? 'kate'
      : 'jill';

    if (missionType === 'dca') {
      // 1. DCA (防空攔截): 戰鬥機緊急升空截擊正在逼近之轟炸機隊 (動態規模 2-6架)
      soundEngine.playKlaxon();
      const targetPlane = this.aircraft.find(
        (a) => a.side === 'player' && a.state !== 'shot_down' && (a.role === 'dive_bomber' || a.role === 'torpedo_bomber' || a.role === 'level_bomber')
      );
      const targetPos = targetPlane ? targetPlane.pos : (flagship ? flagship.pos : { x: 5000, y: 5000 });
      const heading = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);

      const dcaModel: AircraftModel = isEra3 ? 'mig15' : fModel;
      const dcaSpeed = isEra3 ? 160 : 148;
      const dcaHealth = isEra3 ? 540 : 160;
      const dcaCount = this.calculateDynamicWaveSize(3);

      for (let i = 0; i < dcaCount; i++) {
        this.aircraft.push({
          id: `enemy-dca-${Date.now()}-${i}`,
          squadronId: sqId,
          model: dcaModel,
          role: 'fighter',
          name: isEra3 ? `DCA 米格-15 噴射截擊機 (#${i + 1})` : `DCA 零戰防空截擊機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 28, y: spawnPos.y + (i - (dcaCount - 1) / 2) * 22 },
          vel: { x: Math.cos(heading) * dcaSpeed, y: Math.sin(heading) * dcaSpeed },
          heading,
          targetHeading: heading,
          speed: dcaSpeed,
          maxSpeed: dcaSpeed,
          altitude: 0.95,
          state: 'cruising',
          health: dcaHealth,
          maxHealth: dcaHealth,
          order: targetPlane ? { type: 'attack', targetPos, targetId: targetPlane.id } : { type: 'patrol', patrolOrigin: spawnPos },
          hasPayload: false,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 300 : 1000,
          maxGunAmmo: isEra3 ? 300 : 1000,
          wingmanOffset: { x: i * 25, y: (i - (dcaCount - 1) / 2) * 20 },
          missionType: 'dca',
        });
      }

      this.addBannerAlert(
        isEra3 ? `🚨【DCA 噴射防空截擊】冷戰聯軍出動 ${dcaCount}架 MiG-15 噴射截擊編隊緊急升空阻截！` : `🚨【DCA 戰鬥機防空攔截】敵出動 ${dcaCount}架 戰機升空截擊我空襲轟炸機！`,
        'enemy',
        'sunk',
        5.5
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '冷戰遠東航空軍 (DCA)' : '帝國海軍防空戰隊 (DCA)',
        targetName: targetPlane ? targetPlane.name : '美軍空襲編隊',
        actionType: 'recon_spotted',
        text: isEra3
          ? `🚨【MiG-15 噴射截擊起飛】防空雷達偵獲我機！冷戰聯軍基地緊急起飛 ${dcaCount}架 米格-15 (MiG-15) 噴射戰鬥機實施超音速防空攔截！`
          : `🚨【DCA 防空截擊起飛】防空雷達與哨戒艇偵獲美機逼近！敵基地緊急彈射 ${dcaCount}架 ${fModel.toUpperCase()} 戰鬥機實施防空攔截 (DCA)！`,
      });
    } else if (missionType === 'air_sweep') {
      // 2. Air Sweep (空中制空掃蕩): 戰鬥機大編隊飛越戰區搶奪制空權 (動態規模 2-6架)
      soundEngine.playKlaxon();
      const sweepTarget = flagship ? { ...flagship.pos } : { x: 6000, y: 7000 };
      const heading = Math.atan2(sweepTarget.y - spawnPos.y, sweepTarget.x - spawnPos.x);

      const sweepCount = this.calculateDynamicWaveSize(4);
      for (let i = 0; i < sweepCount; i++) {
        const sweepModel: AircraftModel = isEra3
          ? (i % 2 === 0 ? 'mig15' : 'yak9')
          : i % 2 === 0
          ? fModel
          : (this.era === 'era1' ? 'zero_a6m5' : 'ki61');
        const sSpeed = sweepModel === 'mig15' ? 160 : sweepModel === 'yak9' ? 132 : 152;
        const sHealth = sweepModel === 'mig15' ? 540 : sweepModel === 'yak9' ? 440 : 175;

        this.aircraft.push({
          id: `enemy-sweep-${Date.now()}-${i}`,
          squadronId: sqId,
          model: sweepModel,
          role: 'fighter',
          name: isEra3 ? `${sweepModel.toUpperCase()} 冷戰空優戰鬥機 (#${i + 1})` : `制空掃蕩戰鬥機 (Air Sweep #${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 32, y: spawnPos.y + (i - (sweepCount - 1) / 2) * 25 },
          vel: { x: Math.cos(heading) * sSpeed, y: Math.sin(heading) * sSpeed },
          heading,
          targetHeading: heading,
          speed: sSpeed,
          maxSpeed: sSpeed,
          altitude: 0.92,
          state: 'cruising',
          health: sHealth,
          maxHealth: sHealth,
          order: { type: 'attack', targetPos: sweepTarget },
          hasPayload: false,
          shootCooldown: 0,
          gunAmmo: sweepModel === 'mig15' ? 300 : sweepModel === 'yak9' ? 340 : 1000,
          maxGunAmmo: sweepModel === 'mig15' ? 300 : sweepModel === 'yak9' ? 340 : 1000,
          wingmanOffset: { x: i * 30, y: (i - (sweepCount - 1) / 2) * 22 },
          missionType: 'air_sweep',
        });
      }

      this.addBannerAlert(
        isEra3 ? `⚔️【Air Sweep 冷戰空優掃蕩】${sweepCount}架 米格-15 噴射機與雅克-9 混編大隊搶奪戰區制空權！` : `⚔️【Air Sweep 制空掃蕩】日軍派出 ${sweepCount}架 王牌戰鬥機編隊搶奪制空權！`,
        'enemy',
        'down',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '遠東前線聯軍制空戰隊' : '南太平洋航空戰隊制空隊',
        targetName: '特混艦隊制空空域',
        actionType: 'recon_spotted',
        text: isEra3
          ? `⚔️【空中制空掃蕩 (Air Sweep)】冷戰聯軍 ${sweepCount}架 MiG-15 / Yak-9 戰鬥機高速掠過戰區，專門搜尋我軍巡邏戰機 (CAP) 爭奪制空權！`
          : `⚔️【空中制空掃蕩 (Air Sweep)】偵測到敵軍 ${sweepCount}架 零戰/飛燕高速掠過鐵底灣！專門鎖定我軍巡邏戰機 (CAP) 爭奪制空權！`,
      });
    } else if (missionType === 'scramble') {
      // 3. Scramble (緊急迎擊起飛): 基地防空警報大作時立即由跑道拉起 (動態規模 2-4架)
      soundEngine.playKamikazeSiren();
      const scrambleTarget = flagship ? { ...flagship.pos } : { x: 5000, y: 5000 };
      const heading = Math.atan2(scrambleTarget.y - spawnPos.y, scrambleTarget.x - spawnPos.x);

      const scModel: AircraftModel = isEra3 ? 'mig15' : fModel;
      const scSpeed = isEra3 ? 160 : 142;
      const scHealth = isEra3 ? 540 : 150;
      const scrambleCount = Math.min(4, this.calculateDynamicWaveSize(2));

      for (let i = 0; i < scrambleCount; i++) {
        this.aircraft.push({
          id: `enemy-scramble-${Date.now()}-${i}`,
          squadronId: sqId,
          model: scModel,
          role: 'fighter',
          name: isEra3 ? `MiG-15 緊急迎擊噴射機 (#${i + 1})` : `緊急起飛迎擊機 (Scramble #${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 22, y: spawnPos.y + (i - (scrambleCount - 1) / 2) * 16 },
          vel: { x: Math.cos(heading) * scSpeed, y: Math.sin(heading) * scSpeed },
          heading,
          targetHeading: heading,
          speed: scSpeed,
          maxSpeed: scSpeed,
          altitude: 0.65,
          state: 'cruising',
          health: scHealth,
          maxHealth: scHealth,
          order: { type: 'attack', targetPos: scrambleTarget },
          hasPayload: false,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 300 : 1000,
          maxGunAmmo: isEra3 ? 300 : 1000,
          wingmanOffset: { x: i * 22, y: 15 },
          missionType: 'scramble',
        });
      }

      this.addBannerAlert(
        isEra3 ? `⚡【Scramble 噴射緊急迎擊】冷戰聯軍基地防空警報大作，${scrambleCount}架 米格-15 加足噴射推力升空！` : `⚡【Scramble 緊急起飛】敵前線航空基地 ${scrambleCount}架 戰機拉響警報緊急升空！`,
        'enemy',
        'sunk',
        5.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '前線要塞迎擊隊' : '前線基地迎擊隊',
        targetName: '來襲戰機',
        actionType: 'recon_spotted',
        text: isEra3
          ? `⚡【噴射截擊緊急升空】敵基地防空雷達鎖定！${scrambleCount}架 MiG-15 噴射戰鬥機點燃發動機強行起飛迎敵！`
          : `⚡【基地防空緊急起飛 (Scramble)】敵機場警報響起！${scrambleCount}架 戰機加足馬力強行起飛迎敵！`,
      });
    } else if (missionType === 'strike_flagship') {
      // 4. Strike Package (針對旗艦反艦 動態編隊: 2-6架): 協同魚雷機、俯衝轟炸機與護航戰機重擊航母
      soundEngine.playKamikazeSiren();
      const target = flagship ? { ...flagship.pos } : { x: 3000, y: 11000 };
      const heading = Math.atan2(target.y - spawnPos.y, target.x - spawnPos.x);

      const totalStrikeCount = this.calculateDynamicWaveSize(5); // 2-6 架
      const escCount = totalStrikeCount >= 5 ? 2 : 1;
      const bomberCount = totalStrikeCount - escCount;
      const dbCount = Math.ceil(bomberCount / 2);
      const tbCount = bomberCount - dbCount;

      // 護航戰鬥機 (MiG-15 / Zero Escorts)
      const escModel: AircraftModel = isEra3 ? 'mig15' : fModel;
      const escSpeed = isEra3 ? 150 : 135;
      const escHealth = isEra3 ? 540 : 160;

      for (let i = 0; i < escCount; i++) {
        this.aircraft.push({
          id: `st-flag-f-${Date.now()}-${i}`,
          squadronId: sqId,
          model: escModel,
          role: 'fighter',
          name: isEra3 ? `旗艦突擊 MiG-15 噴射直衛機 (#${i + 1})` : `旗艦突擊直衛機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 30, y: spawnPos.y - 25 },
          vel: { x: Math.cos(heading) * escSpeed, y: Math.sin(heading) * escSpeed },
          heading,
          targetHeading: heading,
          speed: escSpeed,
          maxSpeed: escSpeed,
          altitude: 0.9,
          state: 'cruising',
          health: escHealth,
          maxHealth: escHealth,
          order: { type: 'attack', targetPos: target, targetId: flagship?.id },
          hasPayload: false,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 300 : 1000,
          maxGunAmmo: isEra3 ? 300 : 1000,
          wingmanOffset: { x: i * 30, y: -25 },
          missionType: 'strike_flagship',
        });
      }

      // 俯衝轟炸機 / 強擊機 (IL-10 / Val / Judy)
      const strikeDbModel: AircraftModel = isEra3 ? 'il10' : dbModel;
      const strikeDbSpeed = isEra3 ? 116 : 115;
      const strikeDbHealth = isEra3 ? 620 : 155;

      for (let i = 0; i < dbCount; i++) {
        this.aircraft.push({
          id: `st-flag-db-${Date.now()}-${i}`,
          squadronId: sqId,
          model: strikeDbModel,
          role: 'dive_bomber',
          name: isEra3 ? `IL-10 鐵獸裝甲強擊機 (#${i + 1})` : `旗艦俯衝轟炸機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 28, y: spawnPos.y },
          vel: { x: Math.cos(heading) * strikeDbSpeed, y: Math.sin(heading) * strikeDbSpeed },
          heading,
          targetHeading: heading,
          speed: strikeDbSpeed,
          maxSpeed: strikeDbSpeed,
          altitude: 0.88,
          state: 'cruising',
          health: strikeDbHealth,
          maxHealth: strikeDbHealth,
          order: { type: 'attack', targetPos: target, targetId: flagship?.id },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 600 : 600,
          maxGunAmmo: isEra3 ? 600 : 600,
          wingmanOffset: { x: i * 28, y: 0 },
          missionType: 'strike_flagship',
        });
      }

      // 魚雷攻擊機 / 噴射反艦機 (Tu-14 / Kate / Jill)
      const strikeTbModel: AircraftModel = isEra3 ? 'tu14' : tbModel;
      const strikeTbSpeed = isEra3 ? 130 : 110;
      const strikeTbHealth = isEra3 ? 680 : 150;

      for (let i = 0; i < tbCount; i++) {
        this.aircraft.push({
          id: `st-flag-tb-${Date.now()}-${i}`,
          squadronId: sqId,
          model: strikeTbModel,
          role: 'torpedo_bomber',
          name: isEra3 ? `Tu-14 雙噴射魚雷轟炸機 (#${i + 1})` : `旗艦魚雷雷擊機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 28, y: spawnPos.y + 25 },
          vel: { x: Math.cos(heading) * strikeTbSpeed, y: Math.sin(heading) * strikeTbSpeed },
          heading,
          targetHeading: heading,
          speed: strikeTbSpeed,
          maxSpeed: strikeTbSpeed,
          altitude: 0.8,
          state: 'cruising',
          health: strikeTbHealth,
          maxHealth: strikeTbHealth,
          order: { type: 'attack', targetPos: target, targetId: flagship?.id },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 400 : 500,
          maxGunAmmo: isEra3 ? 400 : 500,
          wingmanOffset: { x: i * 28, y: 25 },
          missionType: 'strike_flagship',
        });
      }

      this.addBannerAlert(
        isEra3
          ? `🚨【Strike Package 旗艦反艦編隊】冷戰聯軍 ${totalStrikeCount}機 打擊群（圖-14與伊爾-10）直撲我旗艦航母！`
          : `🚨【Strike Package 旗艦反艦編隊】敵海空主力 ${totalStrikeCount}機 打擊群直撲我旗艦航母！`,
        'enemy',
        'sunk',
        7.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '冷戰遠東航空打擊軍 (Strike Package)' : '帝國海軍第一航空戰隊 (Strike Package)',
        targetName: flagship?.name || '特混艦隊旗艦',
        actionType: 'recon_spotted',
        text: isEra3
          ? `🚨【旗艦打擊編隊！】長程對空雷達警報大作！偵測到敵 ${totalStrikeCount}機 動態反艦打擊群 (Tu-14 噴射魚雷機 + IL-10 鐵獸強擊機 + MiG-15 噴射直衛) 全速直撲「${flagship?.name || '航空母艦'}」！`
          : `🚨【旗艦打擊編隊！】長程對空雷達警報大作！偵測到敵 ${totalStrikeCount}機 動態反艦打擊群 (魚雷機+俯衝艦爆+直衛零戰) 全速直撲「${flagship?.name || '航空母艦'}」！`,
      });
    } else if (missionType === 'strike_fleet') {
      // 5. Strike Package (針對船艦反艦 動態編隊: 2-6架): 獵殺巡洋艦、驅逐艦與兩棲運輸隊
      soundEngine.playKlaxon();
      const escorts = this.playerShips.filter((s) => !s.isSunk && s.type !== 'carrier');
      const targetShip = escorts.length > 0 ? escorts[Math.floor(Math.random() * escorts.length)] : flagship;
      const target = targetShip ? { ...targetShip.pos } : { x: 3000, y: 11000 };
      const heading = Math.atan2(target.y - spawnPos.y, target.x - spawnPos.x);

      const fleetDbModel: AircraftModel = isEra3 ? 'il10' : dbModel;
      const fleetTbModel: AircraftModel = isEra3 ? 'tu14' : tbModel;
      const fDbSpeed = isEra3 ? 116 : 115;
      const fTbSpeed = isEra3 ? 130 : 110;
      const fDbHealth = isEra3 ? 620 : 155;
      const fTbHealth = isEra3 ? 680 : 150;

      const totalFleetCount = this.calculateDynamicWaveSize(4); // 2-6 架
      const fDbCount = Math.ceil(totalFleetCount / 2);
      const fTbCount = totalFleetCount - fDbCount;

      // Dive Bombers / Ground Attackers
      for (let i = 0; i < fDbCount; i++) {
        this.aircraft.push({
          id: `st-flt-db-${Date.now()}-${i}`,
          squadronId: sqId,
          model: fleetDbModel,
          role: 'dive_bomber',
          name: isEra3 ? `IL-10 反艦強擊機 (#${i + 1})` : `反艦俯衝轟炸機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 26, y: spawnPos.y - 15 },
          vel: { x: Math.cos(heading) * fDbSpeed, y: Math.sin(heading) * fDbSpeed },
          heading,
          targetHeading: heading,
          speed: fDbSpeed,
          maxSpeed: fDbSpeed,
          altitude: 0.88,
          state: 'cruising',
          health: fDbHealth,
          maxHealth: fDbHealth,
          order: { type: 'attack', targetPos: target, targetId: targetShip?.id },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 600 : 600,
          maxGunAmmo: isEra3 ? 600 : 600,
          wingmanOffset: { x: i * 26, y: -15 },
          missionType: 'strike_fleet',
        });
      }
      // Torpedo Bombers
      for (let i = 0; i < fTbCount; i++) {
        this.aircraft.push({
          id: `st-flt-tb-${Date.now()}-${i}`,
          squadronId: sqId,
          model: fleetTbModel,
          role: 'torpedo_bomber',
          name: isEra3 ? `Tu-14 噴射魚雷機 (#${i + 1})` : `反艦魚雷機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 26, y: spawnPos.y + 15 },
          vel: { x: Math.cos(heading) * fTbSpeed, y: Math.sin(heading) * fTbSpeed },
          heading,
          targetHeading: heading,
          speed: fTbSpeed,
          maxSpeed: fTbSpeed,
          altitude: 0.8,
          state: 'cruising',
          health: fTbHealth,
          maxHealth: fTbHealth,
          order: { type: 'attack', targetPos: target, targetId: targetShip?.id },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 400 : 500,
          maxGunAmmo: isEra3 ? 400 : 500,
          wingmanOffset: { x: i * 26, y: 15 },
          missionType: 'strike_fleet',
        });
      }

      this.addBannerAlert(
        isEra3
          ? `⚠️【Strike Package 反艦打擊】冷戰聯軍 ${totalFleetCount}機 編隊鎖定我巡洋艦與護航驅逐艦！`
          : `⚠️【Strike Package 反艦打擊】敵 ${totalFleetCount}機 轟炸機隊鎖定我巡洋艦與護航驅逐艦！`,
        'enemy',
        'down',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '冷戰遠東反艦突擊隊' : '反艦戰鬥轟炸隊',
        targetName: targetShip?.name || '護航艦隊',
        actionType: 'recon_spotted',
        text: isEra3
          ? `⚠️【反艦動態編隊來襲】冷戰遠東聯軍 ${totalFleetCount}架 打擊機隊掠海飛來，Tu-14 噴射魚雷機與 IL-10 強擊機目標鎖定護航艦艇「${targetShip?.name || '巡洋艦'}」！`
          : `⚠️【反艦動態編隊來襲】敵 ${totalFleetCount}架 打擊機隊掠海飛來，目標鎖定護航艦艇「${targetShip?.name || '巡洋艦'}」！護航艦砲火全力攔截！`,
      });
    } else if (missionType === 'strike_airbase') {
      // 6. Strike Package (針對陸基基地 動態編隊: 2-6架): 重轟大隊空襲前進基地
      soundEngine.playKlaxon();
      const basePos = this.friendlyBase?.center || { x: 2000, y: 12400 };
      const heading = Math.atan2(basePos.y - spawnPos.y, basePos.x - spawnPos.x);

      const heavyModel: AircraftModel = isEra3 ? 'tu14' : 'g4m';
      const hSpeed = isEra3 ? 130 : 120;
      const hHealth = isEra3 ? 680 : 480;

      const heavyCount = this.calculateDynamicWaveSize(4);
      for (let i = 0; i < heavyCount; i++) {
        this.aircraft.push({
          id: `st-base-h-${Date.now()}-${i}`,
          squadronId: sqId,
          model: heavyModel,
          role: 'dive_bomber',
          name: isEra3 ? `Tu-14 雙噴射重轟大隊 (#${i + 1})` : `一式陸攻重轟大隊 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + (i - (heavyCount - 1) / 2) * 36, y: spawnPos.y + (i - (heavyCount - 1) / 2) * 20 },
          vel: { x: Math.cos(heading) * hSpeed, y: Math.sin(heading) * hSpeed },
          heading,
          targetHeading: heading,
          speed: hSpeed,
          maxSpeed: hSpeed,
          altitude: 0.94,
          state: 'cruising',
          health: hHealth,
          maxHealth: hHealth,
          order: { type: 'attack', targetPos: basePos },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 400 : 600,
          maxGunAmmo: isEra3 ? 400 : 600,
          wingmanOffset: { x: (i - (heavyCount - 1) / 2) * 35, y: (i - (heavyCount - 1) / 2) * 18 },
          missionType: 'strike_airbase',
        });
      }

      this.addBannerAlert(
        isEra3
          ? `💣【Strike Package 陸基基地編隊】冷戰聯軍 ${heavyCount}架 圖-14雙噴射轟炸機空襲前進基地！`
          : `💣【Strike Package 陸基基地編隊】敵 ${heavyCount}架 一式陸攻大隊空襲 Henderson 前進基地！`,
        'enemy',
        'sunk',
        6.5
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '遠東戰略轟炸航空軍 (Tu-14大隊)' : '基地航空部隊 (陸攻大隊)',
        targetName: '前進空軍基地跑道',
        actionType: 'recon_spotted',
        text: isEra3
          ? `💣【陸基前進基地遭襲！】冷戰聯軍 ${heavyCount}架 Tu-14 雙噴射轟炸機以高空編隊越境！意圖對前進空軍基地跑道與機庫實施毀滅性面狀轟炸！`
          : `💣【陸基前進基地遭襲！】敵 ${heavyCount}架 一式陸攻以高空編隊越境！意圖對 Henderson Field 機場跑道與機庫實施毀滅性面狀轟炸！`,
      });
    } else if (missionType === 'cas') {
      // 7. CAS (近距空中支援 動態編隊: 2-4架): 俯衝掃射我搶灘舟艇 (LCVP/LST) 與灘頭陸戰隊
      soundEngine.playKlaxon();
      const landingTransports = this.playerShips.filter(
        (s) => !s.isSunk && (s.type === 'lst' || s.type === 'lcvp' || s.name.includes('LST') || s.name.includes('LCVP'))
      );
      const playerGround = this.groundUnits.filter((u) => u.side === 'player' && !u.isDestroyed);
      const targetPos = landingTransports.length > 0
        ? landingTransports[0].pos
        : playerGround.length > 0
        ? playerGround[0].pos
        : (flagship ? flagship.pos : { x: 4000, y: 9000 });

      const heading = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);
      const casModel: AircraftModel = isEra3 ? 'il10' : dbModel;
      const casSpeed = isEra3 ? 116 : 122;
      const casHealth = isEra3 ? 620 : 145;
      const casCount = Math.min(4, this.calculateDynamicWaveSize(2));

      for (let i = 0; i < casCount; i++) {
        this.aircraft.push({
          id: `cas-db-${Date.now()}-${i}`,
          squadronId: sqId,
          model: casModel,
          role: 'dive_bomber',
          name: isEra3 ? `IL-10 鐵獸裝甲強擊機 (#${i + 1})` : `CAS 近距空中支援艦爆 (#${i + 1})`,
          side: 'enemy',
          pos: { x: spawnPos.x + i * 28, y: spawnPos.y },
          vel: { x: Math.cos(heading) * casSpeed, y: Math.sin(heading) * casSpeed },
          heading,
          targetHeading: heading,
          speed: casSpeed,
          maxSpeed: casSpeed,
          altitude: 0.65,
          state: 'cruising',
          health: casHealth,
          maxHealth: casHealth,
          order: { type: 'attack', targetPos },
          hasPayload: true,
          shootCooldown: 0,
          gunAmmo: isEra3 ? 600 : 600,
          maxGunAmmo: isEra3 ? 600 : 600,
          wingmanOffset: { x: i * 25, y: 15 },
          missionType: 'cas',
        });
      }

      this.addBannerAlert(
        isEra3
          ? `🛩️【CAS 密接空中支援】冷戰聯軍 ${casCount}架 伊爾-10裝甲強擊機向我搶灘舟艇與登陸部隊俯衝掃射！`
          : `🛩️【CAS 密接空中支援】敵 ${casCount}架 俯衝轟炸機向我搶灘舟艇與登陸部隊俯衝掃射！`,
        'enemy',
        'down',
        5.5
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '遠東前線強擊航空師 (IL-10)' : '近距支援艦爆隊 (CAS)',
        targetName: '海灘灘頭 / 登陸舟艇',
        actionType: 'recon_spotted',
        text: isEra3
          ? `🛩️【灘頭密接支援 (CAS)】冷戰聯軍 ${casCount}架 IL-10 鐵獸強擊機實施超低空突防！俯衝壓制我方兩棲登陸艇與陸戰隊排！`
          : `🛩️【灘頭密接支援 (CAS)】敵 2架 艦爆實施超低空突防！俯衝壓制我方兩棲登陸艇與陸戰隊排！海灘防空機槍全力還擊！`,
      });
    } else if (missionType === 'cap') {
      // 8. CAP (平時巡邏): 在敵艦隊或要塞上空執行持續防空巡邏 (CAP)
      const enemyCarrier = this.enemyShips.find((s) => s.type === 'carrier' && !s.isSunk);
      const capCenter = enemyCarrier ? enemyCarrier.pos : spawnPos;
      const heading = 0;

      for (let i = 0; i < 2; i++) {
        const capModel: AircraftModel = isEra3 ? (i === 0 ? 'mig15' : 'yak9') : fModel;
        const cSpeed = capModel === 'mig15' ? 160 : capModel === 'yak9' ? 132 : 130;
        const cHealth = capModel === 'mig15' ? 540 : capModel === 'yak9' ? 440 : 150;

        this.aircraft.push({
          id: `cap-f-${Date.now()}-${i}`,
          squadronId: sqId,
          model: capModel,
          role: 'fighter',
          name: isEra3 ? `${capModel.toUpperCase()} 冷戰巡邏戰鬥機 (#${i + 1})` : `CAP 常態戰鬥巡邏機 (#${i + 1})`,
          side: 'enemy',
          pos: { x: capCenter.x + (i === 0 ? 80 : -80), y: capCenter.y + (i === 0 ? -60 : 60) },
          vel: { x: 0, y: 0 },
          heading,
          targetHeading: heading,
          speed: cSpeed,
          maxSpeed: cSpeed,
          altitude: 0.88,
          state: 'patrolling',
          health: cHealth,
          maxHealth: cHealth,
          order: { type: 'patrol', patrolOrigin: { ...capCenter } },
          hasPayload: false,
          shootCooldown: 0,
          gunAmmo: capModel === 'mig15' ? 300 : capModel === 'yak9' ? 340 : 1000,
          maxGunAmmo: capModel === 'mig15' ? 300 : capModel === 'yak9' ? 340 : 1000,
          wingmanOffset: { x: i * 35, y: -20 },
          missionType: 'cap',
        });
      }

      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: isEra3 ? '冷戰聯軍直衛機隊' : '敵方直衛機隊',
        targetName: '敵主力空域',
        actionType: 'recon_spotted',
        text: isEra3
          ? `🛡️【常態戰鬥巡邏 (CAP)】冷戰遠東聯軍維持 MiG-15 / Yak-9 雙機編隊防空巡邏 (CAP)，警戒戰區空域！`
          : `🛡️【常態戰鬥巡邏 (CAP)】敵艦隊上空維持雙機編隊防空巡邏 (CAP)，警戒任何接近之美軍航空隊！`,
      });
    }
  }

  private checkEnemyAirDoctrineTriggers() {
    // 檢查是否有美軍攻擊機進入敵軍核心防區 -> 觸發 DCA 或 Scramble
    const enemyCarrier = this.enemyShips.find((s) => s.type === 'carrier' && !s.isSunk);
    const enemyAirfield = this.islands
      .filter((i) => !i.isFriendlyBase && !i.isFullyCaptured)
      .flatMap((i) => i.installations)
      .find((inst) => inst.type === 'airfield' && inst.side === 'enemy' && !inst.isDestroyed);

    if (this.enemyDcaCooldown <= 0 && (enemyCarrier || enemyAirfield)) {
      const threatBasePos = enemyCarrier ? enemyCarrier.pos : enemyAirfield!.pos;
      const incomingBomber = this.aircraft.find(
        (a) => a.side === 'player' && a.state !== 'shot_down' &&
          (a.role === 'dive_bomber' || a.role === 'torpedo_bomber' || a.role === 'level_bomber') &&
          dist(a.pos, threatBasePos) < 3600
      );
      if (incomingBomber) {
        this.triggerEnemyAirDoctrine('dca');
        this.enemyDcaCooldown = 45;
      }
    }

    if (this.enemyScrambleCooldown <= 0 && enemyAirfield) {
      const nearPlanes = this.aircraft.find(
        (a) => a.side === 'player' && a.state !== 'shot_down' && dist(a.pos, enemyAirfield.pos) < 2400
      );
      if (nearPlanes) {
        this.triggerEnemyAirDoctrine('scramble');
        this.enemyScrambleCooldown = 40;
      }
    }
  }

  private updateInstallations(dt: number) {
    const flagship = this.getFlagship();
    if (!flagship) return;

    for (const island of this.islands) {
      for (const inst of island.installations) {
        if (inst.isDestroyed) continue;
        inst.cooldown = Math.max(0, inst.cooldown - dt);

        if (inst.side === 'player') {
          // 友軍防空砲陣地 (90mm / 40mm Bofors)：攔截空襲敵機
          if (inst.type === 'flak_battery') {
            const enemyPlane = this.aircraft.find(
              (a) => a.side === 'enemy' && a.state !== 'shot_down' && dist(inst.pos, a.pos) <= inst.range
            );
            if (enemyPlane && inst.cooldown <= 0) {
              this.fireFlakBurst(inst.pos, enemyPlane);
              inst.cooldown = inst.reloadTime;
            }
          }
          continue;
        }

        // ══════════════════════════════════════════════════════════
        // 敵方地面單位 (OPFOR Ground Units) - 嚴格遵守 ASuW 限制
        // ══════════════════════════════════════════════════════════

        // 尋找射程內我方水面艦艇或搶灘登陸部隊 (ASuW 專用目標)
        const shipTarget = this.playerShips.find((s) => !s.isSunk && dist(inst.pos, s.pos) <= inst.range);
        const groundTarget = !shipTarget
          ? this.groundUnits.find((u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(inst.pos, u.pos) <= inst.range)
          : null;
        const targetPos = shipTarget ? shipTarget.pos : groundTarget ? groundTarget.pos : null;

        if (inst.type === 'coastal_gun') {
          // 203mm 岸防重砲 (ASuW Only)：砲擊近海美軍巡洋艦/航母/登陸艦
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              soundEngine.playGunSalvo(true);
              this.projectiles.push({
                id: `shore-shell-${Date.now()}`,
                type: 'shell',
                side: 'enemy',
                pos: { ...inst.pos },
                vel: { x: 0, y: 0 },
                originPos: { ...inst.pos },
                targetPos: { ...targetPos },
                flightProgress: 0,
                maxDistance: dist(inst.pos, targetPos),
                distanceTraveled: 0,
                damage: 260,
                blastRadius: 30,
                speed: 400,
                heading: inst.angle,
                isDead: false,
                trail: [],
                attackerName: inst.name,
              });
              inst.cooldown = inst.reloadTime;
            }
          }
        } else if (inst.type === 'infantry_squad' || inst.type === 'command_post') {
          // 步兵班 / 指揮所衛隊 (ASuW Only)：九二式重機槍點射搶灘舟艇或上陸步兵
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              for (let b = 0; b < 3; b++) {
                const spread = (Math.random() - 0.5) * 0.08;
                const bAngle = inst.angle + spread;
                const bSpeed = 500;
                this.projectiles.push({
                  id: `mg-bullet-${Date.now()}-${b}`,
                  type: 'bullet',
                  side: 'enemy',
                  pos: { x: inst.pos.x + Math.cos(inst.angle) * 12, y: inst.pos.y + Math.sin(inst.angle) * 12 },
                  vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
                  originPos: { ...inst.pos },
                  targetPos: { ...targetPos },
                  flightProgress: 0,
                  maxDistance: inst.range,
                  distanceTraveled: 0,
                  damage: 20,
                  blastRadius: 6,
                  speed: bSpeed,
                  heading: bAngle,
                  isDead: false,
                  trail: [],
                  attackerName: inst.name,
                });
              }
              inst.cooldown = inst.reloadTime;
            }
          }
        } else if (inst.type === 'bunker_nest') {
          // 鋼筋混凝土暗堡 (ASuW Only)：密集重機槍/無後座力砲扼守隘口，壓制推進部隊
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              soundEngine.playGunBurst();
              for (let b = 0; b < 4; b++) {
                const spread = (Math.random() - 0.5) * 0.06;
                const bAngle = inst.angle + spread;
                const bSpeed = 520;
                this.projectiles.push({
                  id: `bunker-mg-${Date.now()}-${b}`,
                  type: 'bullet',
                  side: inst.side,
                  pos: { x: inst.pos.x + Math.cos(inst.angle) * 14, y: inst.pos.y + Math.sin(inst.angle) * 14 },
                  vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
                  originPos: { ...inst.pos },
                  targetPos: { ...targetPos },
                  flightProgress: 0,
                  maxDistance: inst.range,
                  distanceTraveled: 0,
                  damage: 34,
                  blastRadius: 8,
                  speed: bSpeed,
                  heading: bAngle,
                  isDead: false,
                  trail: [],
                  attackerName: inst.name,
                });
              }
              inst.cooldown = inst.reloadTime;
            }
          }
        } else if (inst.type === 'tank_platoon' || inst.type === 'tank_battalion') {
          // 戰車排與戰車大隊 (ASuW Only)：47mm/57mm 戰車砲打擊搶灘部隊與登陸艦
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              soundEngine.playGunSalvo(false);
              const d = dist(inst.pos, targetPos);
              this.projectiles.push({
                id: `tank-shell-${Date.now()}`,
                type: 'shell',
                side: 'enemy',
                pos: { x: inst.pos.x + Math.cos(inst.angle) * 20, y: inst.pos.y + Math.sin(inst.angle) * 20 },
                vel: {
                  x: ((targetPos.x - inst.pos.x) / d) * 480,
                  y: ((targetPos.y - inst.pos.y) / d) * 480,
                },
                originPos: { ...inst.pos },
                targetPos: { ...targetPos },
                flightProgress: 0,
                maxDistance: d,
                distanceTraveled: 0,
                damage: inst.type === 'tank_battalion' ? 220 : 160,
                blastRadius: 20,
                speed: 480,
                heading: inst.angle,
                isDead: false,
                trail: [],
                attackerName: inst.name,
              });
              inst.cooldown = inst.reloadTime;
            }
          }
        } else if (inst.type === 'towed_artillery') {
          // 拖曳野戰砲兵陣地 (ASuW Only)：75mm/105mm 高爆彈覆蓋灘頭與水面艦
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              soundEngine.playGunSalvo(true);
              const d = dist(inst.pos, targetPos);
              this.projectiles.push({
                id: `towed-art-shell-${Date.now()}`,
                type: 'shell',
                side: 'enemy',
                pos: { x: inst.pos.x + Math.cos(inst.angle) * 24, y: inst.pos.y + Math.sin(inst.angle) * 24 },
                vel: {
                  x: ((targetPos.x - inst.pos.x) / d) * 440,
                  y: ((targetPos.y - inst.pos.y) / d) * 440,
                },
                originPos: { ...inst.pos },
                targetPos: { ...targetPos },
                flightProgress: 0,
                maxDistance: d,
                distanceTraveled: 0,
                damage: 190,
                blastRadius: 28,
                speed: 440,
                heading: inst.angle,
                isDead: false,
                trail: [],
                attackerName: inst.name,
              });
              inst.cooldown = inst.reloadTime;
            }
          }
        } else if (inst.type === 'flak_battery') {
          // 專職防空高射砲連 (八八式75mm高射砲)：專門阻截美軍空襲轟炸機隊
          const targetPlane = this.aircraft.find(
            (a) => a.side === 'player' && a.state !== 'shot_down' && dist(inst.pos, a.pos) <= inst.range
          );
          if (targetPlane && inst.cooldown <= 0) {
            this.fireFlakBurst(inst.pos, targetPlane);
            inst.cooldown = inst.reloadTime;
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 地面部隊動態與戰鬥運算 (Ground Units & Combat)
  // ══════════════════════════════════════════════════════════

  private updateGroundUnits(dt: number) {
    // ══════════════════════════════════════════════════════════
    // 1. 全島補給線連通判定與工兵急造棧橋港自動升級 (Island Supply & Port Evolution)
    // ══════════════════════════════════════════════════════════
    const islandSupplyMap = new Map<string, { playerSupplied: boolean; enemySupplied: boolean; hasHospital: boolean; hasDepot: boolean; hasMajorPort: boolean }>();

    for (const isl of this.islands) {
      let playerSupplied = isl.isFriendlyBase === true;
      let enemySupplied = !isl.isFriendlyBase && !isl.isFullyCaptured;
      let hasHospital = false;
      let hasDepot = false;
      let hasMajorPort = false;

      for (const inst of isl.installations) {
        if (inst.isDestroyed) continue;

        if (inst.side === 'player') {
          if (inst.type === 'pontoon_pier' || inst.type === 'major_naval_port' || inst.type === 'ship_repair_dock' || inst.type === 'airfield') {
            playerSupplied = true;
          }
          if (inst.type === 'major_naval_port') hasMajorPort = true;
          if (inst.type === 'field_hospital') hasHospital = true;
          if (inst.type === 'supply_depot') hasDepot = true;

          // Seabees 駐守升級機制：海軍工兵在急造棧橋港 220m 範圍內駐留 35 秒，自動升級為正規深水軍港！
          if (inst.type === 'pontoon_pier') {
            const hasNearbySeabee = this.groundUnits.some(
              (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && u.type === 'usmc_engineer' && dist(u.pos, inst.pos) <= 220
            );
            if (hasNearbySeabee) {
              inst.upgradeTimer = (inst.upgradeTimer || 0) + dt;
              if (inst.upgradeTimer >= 35.0) {
                inst.type = 'major_naval_port';
                inst.name = `正規深水軍港 (${isl.name})`;
                inst.weaponDesc = '全功能深水軍港 · 大型混凝土突堤起重港埠 · 穩定建立全島補給線 (+1.5 CP/s)';
                inst.health = 4200;
                inst.maxHealth = 4200;
                inst.armor = 0.5;
                inst.range = 850;
                inst.upgradeTimer = 0;
                soundEngine.playPlaneSortie();
                this.score.totalScore += 500;
                this.score.stars += 2;
                this.addBannerAlert(`⚓【工兵群奇蹟工程！】「${isl.name}」棧橋港正式升級為「正規深水軍港」！全島補給吞吐量躍升！`, 'player', 'capture', 6.5);
                this.addCombatLog({
                  category: 'naval',
                  sourceSide: 'player',
                  sourceName: 'USN Seabees 海軍工兵團',
                  targetName: inst.name,
                  actionType: 'recon_spotted',
                  text: `⚓【正規深水軍港落成！】工兵部隊日夜奮戰 35秒，成功將急造棧橋港拓建為現代化深水軍港！深水突堤與大型起重桁架竣工，全島補給線與艦艇維護全面投運！+500分，★+2星！`,
                });
              }
            }
          }
        } else if (inst.side === 'enemy') {
          if (inst.type === 'airfield' || inst.type === 'command_post' || inst.type === 'coastal_gun') {
            enemySupplied = true;
          }
        }
      }

      // 正規軍港持續產出後勤資源加成 (+1.5 CP/s)
      if (hasMajorPort && isl.isFullyCaptured) {
        this.resourcePoints += 1.5 * dt * 0.2;
        this.totalCpEarned += 1.5 * dt * 0.2;
      }

      islandSupplyMap.set(isl.id, { playerSupplied, enemySupplied, hasHospital, hasDepot, hasMajorPort });
    }

    // ══════════════════════════════════════════════════════════
    // 2. 地面部隊狀態更新、組織度/建制度計算與投降審查 (Ground Unit Logic)
    // ══════════════════════════════════════════════════════════
    for (let i = this.groundUnits.length - 1; i >= 0; i--) {
      const unit = this.groundUnits[i];
      if (unit.isDestroyed) {
        this.groundUnits.splice(i, 1);
        continue;
      }

      // 初始化組織度與建制度預設值防呆
      if (unit.organization === undefined) unit.organization = 100;
      if (unit.maxOrganization === undefined) unit.maxOrganization = 100;
      if (unit.strength === undefined) unit.strength = 100;
      if (unit.maxStrength === undefined) unit.maxStrength = 100;

      // If unit is embarked aboard LCVP/LST, synchronize position
      if (unit.embarkedInShipId) {
        const carrierShip = this.playerShips.find((s) => s.id === unit.embarkedInShipId);
        if (carrierShip && !carrierShip.isSunk) {
          unit.pos = { ...carrierShip.pos };
          unit.isSupplied = true;
          unit.organization = Math.min(unit.maxOrganization, unit.organization + 2.0 * dt);
          continue;
        } else {
          // Transport sunk: unit falls into water
          unit.embarkedInShipId = undefined;
          unit.health = Math.max(0, unit.health - 350);
          unit.organization = Math.max(0, unit.organization - 40);
          if (unit.health <= 0) {
            unit.isDestroyed = true;
            continue;
          }
        }
      }

      // 檢查所屬島嶼補給線與設施加成
      const currentIsland = this.islands.find(
        (isl) => isPointInPolygon(unit.pos, isl.points) || dist(unit.pos, isl.center) < isl.radius + 35
      );
      const supplyInfo = currentIsland ? islandSupplyMap.get(currentIsland.id) : null;
      const isSupplied = unit.side === 'player'
        ? (supplyInfo ? supplyInfo.playerSupplied : false)
        : (supplyInfo ? supplyInfo.enemySupplied : true);
      unit.isSupplied = isSupplied;

      const hasHospital = supplyInfo ? supplyInfo.hasHospital : false;
      const hasDepot = supplyInfo ? supplyInfo.hasDepot : false;
      const hasMajorPort = supplyInfo ? supplyInfo.hasMajorPort : false;

      // 組織度 (士氣/通訊指揮能力) 運作：
      // 補給暢通且脫離交戰時自然恢復；若補給線斷絕，部隊陷入飢餓慌亂，組織度隨時間持續下降
      if (isSupplied) {
        const orgRecoverRate = hasHospital ? 4.5 : 2.5;
        unit.organization = Math.min(unit.maxOrganization, unit.organization + orgRecoverRate * dt);
      } else {
        unit.organization = Math.max(0, unit.organization - 1.2 * dt);
      }

      // 建制度 (武器人員完好度) 運作：若在有野戰醫院或輜重樞紐之島嶼休整，逐步救治傷員調撥裝備
      if (isSupplied && (hasDepot || hasHospital || hasMajorPort) && unit.health < unit.maxHealth) {
        const healRate = (hasDepot ? 28 : hasHospital ? 24 : 12) * dt;
        unit.health = Math.min(unit.maxHealth, unit.health + healRate);
      }
      unit.strength = Math.max(0, Math.round((unit.health / unit.maxHealth) * 100));

      // 組織度低於 20% 判定為混亂壓制狀態 (Pinned / Disorganized)
      unit.disorganized = unit.organization < 20;

      // ══════════════════════════════════════════════════════════
      // 投降判定 (Surrender Mechanics):
      // 當部隊組織度降至 0% 且周圍 380m 內有敵方戰鬥單位包圍時，整群繳械投降！
      // 敵方投降獎勵玩家 CP，我方投降扣除 CP
      // ══════════════════════════════════════════════════════════
      if (unit.organization <= 0 && !unit.isSurrendered) {
        const hostileNear = unit.side === 'enemy'
          ? this.groundUnits.some((u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(u.pos, unit.pos) < 380) ||
            this.playerShips.some((s) => !s.isSunk && dist(s.pos, unit.pos) < 450)
          : this.groundUnits.some((u) => u.side === 'enemy' && !u.isDestroyed && dist(u.pos, unit.pos) < 380);

        if (hostileNear) {
          unit.isSurrendered = true;
          if (unit.side === 'enemy') {
            const cpReward = unit.type.includes('armor') ? 120 : 80;
            this.resourcePoints += cpReward;
            this.totalCpEarned += cpReward;
            this.score.totalScore += 250;
            soundEngine.playPlaneSortie();
            this.addBannerAlert(`🎖️【敵軍全體繳械投降！】成功收押「${unit.name}」！獲得戰區後勤 +${cpReward} CP！`, 'player', 'capture', 6.0);
            this.addCombatLog({
              category: 'naval',
              sourceSide: 'player',
              sourceName: '前線陸戰突擊隊',
              targetName: unit.name,
              actionType: 'recon_spotted',
              text: `🏳️【全體繳械投降！】敵「${unit.name}」在猛烈火力與斷援包圍下士氣崩潰（組織度歸零），升起白旗舉手投降！我軍收押俘虜並接管陣地，獲得 +${cpReward} CP！`,
            });
            unit.isDestroyed = true;
            this.groundUnits.splice(i, 1);
            continue;
          } else {
            this.resourcePoints = Math.max(0, this.resourcePoints - 50);
            this.addBannerAlert(`⚠️【我軍部隊被迫投降】「${unit.name}」組織度瓦解被迫繳械... 扣除 50 CP！`, 'enemy', 'sunk', 6.0);
            this.addCombatLog({
              category: 'naval',
              sourceSide: 'enemy',
              sourceName: '敵要塞守備隊',
              targetName: unit.name,
              actionType: 'recon_spotted',
              text: `🏳️【部隊被迫繳械】我軍「${unit.name}」彈盡援絕且遭受重重包圍，組織度耗盡不幸被俘... 扣除 50 CP！`,
            });
            unit.isDestroyed = true;
            this.groundUnits.splice(i, 1);
            continue;
          }
        }
      }

      // ══════════════════════════════════════════════════════════
      // 城市戰地形與掩體判定 (Urban Terrain & Air Raid Cover)
      // 進入城市/城鎮/定居點掩體內: 空襲減傷70%、步火直射防禦掩護50%
      // ══════════════════════════════════════════════════════════
      let inUrban = false;
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (!inst.isDestroyed && (inst.civilianZoneRadius || 0) > 0) {
            if (dist(unit.pos, inst.pos) <= inst.civilianZoneRadius!) {
              inUrban = true;
              break;
            }
          }
        }
        if (inUrban) break;
      }
      unit.isInUrbanCover = inUrban;
      unit.urbanCoverFactor = inUrban ? 0.5 : 1.0;

      unit.cooldown = Math.max(0, unit.cooldown - dt);

      // ══════════════════════════════════════════════════════════
      // 戰場火力壓制機制 (Suppression & Progressive Speed Penalty 30% ~ 80%)
      // 遭遇火力時部隊就地臥倒隱蔽，移動速度大幅減緩，有效防止閃擊直接奪取HQ
      // ══════════════════════════════════════════════════════════
      if (unit.suppressionTimer !== undefined && unit.suppressionTimer > 0) {
        unit.suppressionTimer -= dt;
      } else if ((unit.suppression ?? 0) > 0) {
        unit.suppression = Math.max(0, (unit.suppression ?? 0) - 8.0 * dt);
      }
      unit.isSuppressed = (unit.suppression ?? 0) >= 30;
      unit.isPinned = (unit.suppression ?? 0) >= 75;

      // RTS Navigation (混亂壓制狀態下速度減緩 60%)
      if (unit.order.type === 'move' && unit.order.targetPos) {
        const dx = unit.order.targetPos.x - unit.pos.x;
        const dy = unit.order.targetPos.y - unit.pos.y;
        const d = Math.hypot(dx, dy);

        if (d < 25) {
          unit.order = { type: 'idle' };
          unit.speed = 0;
        } else {
          unit.heading = Math.atan2(dy, dx);
          let moveSpeed = unit.isBanzaiCharging ? unit.maxSpeed * 1.6 : unit.maxSpeed;
          if (unit.disorganized || (unit.organization ?? 100) < 20) moveSpeed *= 0.5;

          // 漸進式火力壓制速度懲罰 (30% ~ 80% 速度懲罰)
          if ((unit.suppression ?? 0) > 0) {
            const penalty = Math.min(0.80, 0.30 + ((unit.suppression ?? 0) / 100) * 0.50);
            moveSpeed *= (1 - penalty);
          }
          unit.speed = moveSpeed;

          // ══════════════════════════════════════════════════════════
          // 水陸兩棲涉水規則: 僅有 LVT 系列 (LVT-1 / LVT-4 / LVT-P5) 與兩棲載具可涉水
          // 步兵排、裝甲戰車與砲兵無法徒步涉海，停於灘頭海岸線
          // ══════════════════════════════════════════════════════════
          const nextX = unit.pos.x + Math.cos(unit.heading) * unit.speed * dt * 15;
          const nextY = unit.pos.y + Math.sin(unit.heading) * unit.speed * dt * 15;
          const isLVT = unit.isAmphibious || unit.type === 'usmc_lvt_42' || unit.type === 'usmc_lvt_45' || unit.type === 'usmc_lvtp5';
          const onAnyIsland = this.islands.some((isl) => isPointInPolygon({ x: nextX, y: nextY }, isl.points));

          if (!onAnyIsland && !isLVT) {
            // 非兩棲裝備無法涉水，停駐於灘頭
            unit.speed = 0;
            unit.order = { type: 'idle' };
          } else {
            const waterMod = !onAnyIsland && isLVT ? 0.75 : 1.0;
            unit.pos.x += Math.cos(unit.heading) * unit.speed * waterMod * dt * 15;
            unit.pos.y += Math.sin(unit.heading) * unit.speed * waterMod * dt * 15;
          }
        }
      }

      // Combat Behavior
      if (unit.side === 'player') {
        let targetPos: Vector2D | null = null;
        let targetUnit: GroundUnit | null = null;
        let targetName = '敵軍防禦工事';

        const enemyGround = this.groundUnits.find(
          (u) => u.side === 'enemy' && !u.isDestroyed && dist(unit.pos, u.pos) <= unit.range
        );
        if (enemyGround) {
          targetPos = enemyGround.pos;
          targetUnit = enemyGround;
          targetName = enemyGround.name;
        } else {
          // Find enemy installation on current island (友軍地面部隊絕不攻擊我方建造之陣地設施)
          for (const isl of this.islands) {
            for (const inst of isl.installations) {
              if (!inst.isDestroyed && inst.side === 'enemy' && dist(unit.pos, inst.pos) <= unit.range) {
                targetPos = inst.pos;
                targetName = inst.name;
                break;
              }
            }
            if (targetPos) break;
          }
        }

        if (targetPos && unit.cooldown <= 0) {
          unit.heading = Math.atan2(targetPos.y - unit.pos.y, targetPos.x - unit.pos.x);
          soundEngine.playGunSalvo(false);

          const d = dist(unit.pos, targetPos);
          const isShell = unit.type.includes('armor') || unit.type === 'usmc_lvt_45' || unit.type.includes('artillery');

          if (isShell) {
            const isHeavyArty = unit.type.includes('artillery');
            this.projectiles.push({
              id: `usmc-shell-${Date.now()}`,
              type: 'shell',
              side: 'player',
              pos: { ...unit.pos },
              vel: {
                x: ((targetPos.x - unit.pos.x) / d) * (isHeavyArty ? 420 : 460),
                y: ((targetPos.y - unit.pos.y) / d) * (isHeavyArty ? 420 : 460),
              },
              originPos: { ...unit.pos },
              targetPos: { ...targetPos },
              flightProgress: 0,
              maxDistance: d,
              distanceTraveled: 0,
              damage: unit.damage,
              blastRadius: isHeavyArty ? 34 : 22,
              speed: isHeavyArty ? 420 : 460,
              heading: unit.heading,
              isDead: false,
              trail: [],
              attackerName: unit.name,
            });
          } else {
            // 密集群射機槍曳光彈 (3發高速點射)
            for (let b = 0; b < 3; b++) {
              const spread = (Math.random() - 0.5) * 0.07;
              const bAngle = unit.heading + spread;
              const bSpeed = 490;
              this.projectiles.push({
                id: `usmc-mg-${Date.now()}-${b}`,
                type: 'bullet',
                side: 'player',
                pos: {
                  x: unit.pos.x + Math.cos(unit.heading) * (b * 8),
                  y: unit.pos.y + Math.sin(unit.heading) * (b * 8),
                },
                vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
                originPos: { ...unit.pos },
                targetPos: { ...targetPos },
                flightProgress: 0,
                maxDistance: d,
                distanceTraveled: 0,
                damage: Math.round(unit.damage / 3),
                blastRadius: 8,
                speed: bSpeed,
                heading: bAngle,
                isDead: false,
                trail: [],
                attackerName: unit.name,
              });
            }
          }

          // 戰鬥交火使雙方組織度與壓制值受到衝擊
          unit.organization = Math.max(0, unit.organization - 0.8);
          if (targetUnit) {
            targetUnit.organization = Math.max(0, targetUnit.organization - Math.max(4, Math.round(unit.damage / 24)));
            targetUnit.suppression = Math.min(100, (targetUnit.suppression || 0) + Math.max(16, Math.round(unit.damage / 16)));
            targetUnit.suppressionTimer = 5.0;
            targetUnit.isSuppressed = targetUnit.suppression >= 30;
            targetUnit.isPinned = targetUnit.suppression >= 75;
          }

          unit.cooldown = unit.disorganized ? unit.reloadTime * 2 : unit.reloadTime;
        }
      } else {
        // ══════════════════════════════════════════════════════════
        // 敵軍地面部隊 AI (OPFOR Mobile Patrols & Counter-Attacks)
        // ══════════════════════════════════════════════════════════
        const playerGround = this.groundUnits.find(
          (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(unit.pos, u.pos) <= (unit.isBanzaiCharging ? 1200 : unit.range)
        );

        // 局部反突擊判定: 若同一島嶼或1600m內有美軍登陸部隊，敵機動部隊主動逼近
        const nearbyLandingForce = !playerGround
          ? this.groundUnits.find(
              (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(unit.pos, u.pos) <= 1600
            )
          : null;

        if (nearbyLandingForce && dist(unit.pos, nearbyLandingForce.pos) > unit.range) {
          unit.heading = Math.atan2(nearbyLandingForce.pos.y - unit.pos.y, nearbyLandingForce.pos.x - unit.pos.x);
          let advanceSpeed = (unit.disorganized || (unit.organization ?? 100) < 20) ? unit.maxSpeed * 0.5 : unit.maxSpeed;
          if ((unit.suppression ?? 0) > 0) {
            const pen = Math.min(0.80, 0.30 + ((unit.suppression ?? 0) / 100) * 0.50);
            advanceSpeed *= (1 - pen);
          }
          unit.pos.x += Math.cos(unit.heading) * advanceSpeed * dt * 12;
          unit.pos.y += Math.sin(unit.heading) * advanceSpeed * dt * 12;
        }

        if (playerGround) {
          unit.heading = Math.atan2(playerGround.pos.y - unit.pos.y, playerGround.pos.x - unit.pos.x);

          // Banzai charge: 狂熱白刃刺刀突擊
          if (unit.isBanzaiCharging) {
            unit.pos.x += Math.cos(unit.heading) * unit.maxSpeed * 1.6 * dt * 18;
            unit.pos.y += Math.sin(unit.heading) * unit.maxSpeed * 1.6 * dt * 18;

            if (dist(unit.pos, playerGround.pos) < 60 && unit.cooldown <= 0) {
              soundEngine.playExplosion(false);
              const targetOrg = playerGround.organization ?? 100;
              const orgDmgScale = targetOrg < 50 ? 1.0 + 0.5 * (1.0 - targetOrg / 50) : 1.0;
              const urbanDefense = playerGround.isInUrbanCover ? 0.50 : 1.0;
              const banzaiDmg = Math.round(120 * orgDmgScale * urbanDefense);
              playerGround.health -= banzaiDmg;
              playerGround.organization = Math.max(0, playerGround.organization - (playerGround.isInUrbanCover ? 14 : 25));
              playerGround.strength = Math.max(0, Math.round((playerGround.health / playerGround.maxHealth) * 100));

              this.particles.push({
                id: `banzai-clash-${Date.now()}`,
                x: playerGround.pos.x,
                y: playerGround.pos.y,
                vx: 0,
                vy: 0,
                life: 0.4,
                maxLife: 0.4,
                radius: 18,
                color: '#FF1744',
                type: 'spark',
              });
              this.addCombatLog({
                category: 'naval',
                sourceSide: 'enemy',
                sourceName: unit.name,
                targetName: playerGround.name,
                actionType: 'gun_hit',
                damage: banzaiDmg,
                text: `⚔️【白刃突擊！】狂熱萬歲衝鋒刺刀突入「${playerGround.name}」防線！造成 ${banzaiDmg} 點傷害，士氣重挫 (組織度-25%)！`,
              });
              unit.cooldown = 1.0;
              if (playerGround.health <= 0) {
                playerGround.isDestroyed = true;
              }
            }
          } else if (dist(unit.pos, playerGround.pos) <= unit.range && unit.cooldown <= 0) {
            soundEngine.playGunSalvo(false);
            const d = dist(unit.pos, playerGround.pos);
            const isTank = unit.type.includes('tank');
            const isArtillery = unit.type.includes('artillery');
            const isMortar = unit.type.includes('mortar');

            if (isTank || isArtillery || isMortar) {
              const pSpeed = isMortar ? 390 : 460;
              this.projectiles.push({
                id: `opfor-shell-${Date.now()}`,
                type: 'shell',
                side: 'enemy',
                pos: { ...unit.pos },
                vel: {
                  x: ((playerGround.pos.x - unit.pos.x) / d) * pSpeed,
                  y: ((playerGround.pos.y - unit.pos.y) / d) * pSpeed,
                },
                originPos: { ...unit.pos },
                targetPos: { ...playerGround.pos },
                flightProgress: 0,
                maxDistance: d,
                distanceTraveled: 0,
                damage: unit.damage,
                blastRadius: isArtillery ? 28 : isMortar ? 18 : 20,
                speed: pSpeed,
                heading: unit.heading,
                isDead: false,
                trail: [],
                attackerName: unit.name,
              });
            } else {
              // 密集群射機槍曳光彈 (3發緊湊點射)
              for (let b = 0; b < 3; b++) {
                const spread = (Math.random() - 0.5) * 0.08;
                const bAngle = unit.heading + spread;
                const bSpeed = 480;
                this.projectiles.push({
                  id: `opfor-mg-${Date.now()}-${b}`,
                  type: 'bullet',
                  side: 'enemy',
                  pos: {
                    x: unit.pos.x + Math.cos(unit.heading) * (b * 8),
                    y: unit.pos.y + Math.sin(unit.heading) * (b * 8),
                  },
                  vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
                  originPos: { ...unit.pos },
                  targetPos: { ...playerGround.pos },
                  flightProgress: 0,
                  maxDistance: d,
                  distanceTraveled: 0,
                  damage: Math.round(unit.damage / 3),
                  blastRadius: 6,
                  speed: bSpeed,
                  heading: bAngle,
                  isDead: false,
                  trail: [],
                  attackerName: unit.name,
                });
              }
            }

            // 壓制我軍步兵組織度與壓制值
            playerGround.organization = Math.max(0, playerGround.organization - Math.max(3, Math.round(unit.damage / 26)));
            playerGround.suppression = Math.min(100, (playerGround.suppression || 0) + Math.max(16, Math.round(unit.damage / 16)));
            playerGround.suppressionTimer = 5.0;
            playerGround.isSuppressed = playerGround.suppression >= 30;
            playerGround.isPinned = playerGround.suppression >= 75;
            unit.cooldown = unit.disorganized ? unit.reloadTime * 2 : unit.reloadTime;
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 多據點 CP 肅清佔領與伏擊反撲判定 (Strongholds & CPs)
  // ══════════════════════════════════════════════════════════

  private updateStrongholds(dt: number) {
    for (const island of this.islands) {
      if (island.isFriendlyBase || !island.strongholds) continue;

      for (const sh of island.strongholds) {
        if (sh.isCaptured) continue;

        // Friendly ground units within 380m of the CP
        const friendlyTroopsNearCP = this.groundUnits.filter(
          (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(u.pos, sh.cpPos) <= 380
        );

        // Hostile defenders near the CP
        const hostileDefenders = this.groundUnits.filter(
          (u) => u.side === 'enemy' && !u.isDestroyed && dist(u.pos, sh.cpPos) <= 340
        );

        // 1. 坑道伏擊反撲判定 (Tunnel Ambush Counter-Attack)
        if (!sh.hasTriggeredAmbush && friendlyTroopsNearCP.length > 0) {
          sh.hasTriggeredAmbush = true;
          soundEngine.playKlaxon();
          for (let a = 0; a < 2; a++) {
            const ambushUnit = createGroundUnit(
              `ambush-${island.id}-${sh.id}-${a}`,
              'opfor_infantry_ambush',
              '守備突擊步兵班 (坑道伏擊)',
              'enemy',
              this.era,
              { x: sh.cpPos.x + (a === 0 ? 60 : -60), y: sh.cpPos.y + (a === 0 ? -40 : 40) }
            );
            ambushUnit.order = { type: 'move', targetPos: friendlyTroopsNearCP[0].pos };
            this.groundUnits.push(ambushUnit);
          }
          this.addCombatLog({
            category: 'naval',
            sourceSide: 'enemy',
            sourceName: '地下掩體要塞',
            targetName: friendlyTroopsNearCP[0].name,
            actionType: 'recon_spotted',
            text: `🚨【坑道伏擊！】日軍步兵躲避轟炸自地下掩體猛烈衝出！企圖反撲「${friendlyTroopsNearCP[0].name}」！`,
          });
        }

        // 2. 時代二 (1945) 萬歲衝鋒 (Banzai Charge Trigger)
        if (this.era === 'era2' && !sh.hasTriggeredBanzai && sh.captureProgress >= 40 && friendlyTroopsNearCP.length > 0) {
          sh.hasTriggeredBanzai = true;
          soundEngine.playKamikazeSiren();

          // Spawn additional fanatic charge squad with banzai mode enabled
          const banzaiSquad = createGroundUnit(
            `banzai-${Date.now()}`,
            'opfor_infantry_ambush',
            '玉碎突擊死士 (萬歲衝鋒)',
            'enemy',
            'era2',
            { x: sh.cpPos.x + 30, y: sh.cpPos.y + 30 }
          );
          banzaiSquad.isBanzaiCharging = true;
          banzaiSquad.order = { type: 'move', targetPos: friendlyTroopsNearCP[0].pos };
          this.groundUnits.push(banzaiSquad);

          // All remaining defenders in stronghold enter Banzai frenzy
          this.groundUnits
            .filter((u) => u.side === 'enemy' && !u.isDestroyed && dist(u.pos, sh.cpPos) <= 450)
            .forEach((u) => {
              u.isBanzaiCharging = true;
              u.order = { type: 'move', targetPos: friendlyTroopsNearCP[0].pos };
            });

          this.addCombatLog({
            category: 'naval',
            sourceSide: 'enemy',
            sourceName: '守備司令官與殘存衛隊',
            targetName: '我方登陸部隊',
            actionType: 'recon_spotted',
            text: `⚔️🔥【萬歲衝鋒！】「天皇陛下萬歲！」敵軍殘存守軍全員上刺刀，發動瘋狂絕望的玉碎萬歲突擊！立即提供火力掩護！`,
          });
        }

        // 3. CP 佔領推進判定 (Capture Progress)
        if (friendlyTroopsNearCP.length > 0 && hostileDefenders.length === 0) {
          // Progress advances based on number of troops in zone
          const captureSpeed = 7 + friendlyTroopsNearCP.length * 3.5;
          sh.captureProgress = Math.min(100, sh.captureProgress + dt * captureSpeed);

          if (sh.captureProgress >= 100) {
            sh.isCaptured = true;
            soundEngine.playExplosion(false);

            // Destroy the CP installation
            const cpInst = island.installations.find((i) => i.id === `${island.id}-${sh.id.replace(`${island.id}-`, '')}-cp`);
            if (cpInst) cpInst.isDestroyed = true;

            this.score.totalScore += 500;
            this.score.stars += 2;
            const shCp = 150;
            this.resourcePoints += shCp;
            this.totalCpEarned += shCp;
            this.addBannerAlert(`🚩【據點攻克！】成功肅清並佔領「${sh.name}」！獲得戰利 +${shCp} CP！`, 'player', 'capture', 6.0);

            this.addCombatLog({
              category: 'sunk',
              sourceSide: 'player',
              sourceName: 'USMC 登陸突擊部隊',
              targetName: sh.name,
              actionType: 'installation_down',
              text: `🚩【據點攻克！】我方部隊成功肅清並佔領「${sh.name}」！俘獲敵軍指揮通訊密碼本！+500分，★+2星，+${shCp} CP！`,
            });

            // Check if all strongholds on this island are captured
            const allCaptured = island.strongholds.every((s) => s.isCaptured);
            if (allCaptured) {
              island.isFullyCaptured = true;
              const islandCp = 500;
              this.resourcePoints += islandCp;
              this.totalCpEarned += islandCp;
              this.score.totalScore += 1200;
              this.score.stars += 4;
              this.addBannerAlert(`🏆【全島解放宣告！】「${island.name}」全部核心據點完全肅清！繳獲敵戰略軍火庫 +${islandCp} CP！`, 'player', 'capture', 7.5);
              this.addCombatLog({
                category: 'sunk',
                sourceSide: 'player',
                sourceName: '海軍陸戰隊特混遠征隊',
                targetName: island.name,
                actionType: 'installation_down',
                text: `🏆【全島解放宣告！】「${island.name}」全部核心據點與要塞已完全肅清解放！國旗於制高點冉冉升起！繳獲大量物資，+1200分，★+4星，+${islandCp} CP！`,
              });
            }
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 兩棲登陸 (LCVP / LST) 裝載與卸載 (Embark / Disembark)
  // ══════════════════════════════════════════════════════════

  public toggleTransportEmbarkDisembark(transportId: string) {
    const transport = this.playerShips.find((s) => s.id === transportId);
    if (!transport) return;

    // Check if transport has embarked units
    const embarkedUnits = this.groundUnits.filter((u) => u.embarkedInShipId === transport.id && !u.isDestroyed);

    // 尋找最近島嶼海岸線與灘頭沙灘最近點
    let nearestIsland: Island | null = null;
    let minShoreDist = 999999;
    let bestShorePt: Vector2D | null = null;

    for (const isl of this.islands) {
      let closestPt: Vector2D = isl.points[0];
      let minPtDist = 999999;
      for (let p = 0; p < isl.points.length; p++) {
        const p1 = isl.points[p];
        const p2 = isl.points[(p + 1) % isl.points.length];
        const segDx = p2.x - p1.x;
        const segDy = p2.y - p1.y;
        const segLenSq = segDx * segDx + segDy * segDy;
        let t = 0;
        if (segLenSq > 0.0001) {
          t = Math.max(0, Math.min(1, ((transport.pos.x - p1.x) * segDx + (transport.pos.y - p1.y) * segDy) / segLenSq));
        }
        const projPt = { x: p1.x + t * segDx, y: p1.y + t * segDy };
        const d = dist(transport.pos, projPt);
        if (d < minPtDist) {
          minPtDist = d;
          closestPt = projPt;
        }
      }

      const isInside = isPointInPolygon(transport.pos, isl.points);
      const effectiveDist = isInside ? 0 : minPtDist;
      if (effectiveDist < minShoreDist) {
        minShoreDist = effectiveDist;
        nearestIsland = isl;
        bestShorePt = closestPt;
      }
    }

    if (embarkedUnits.length > 0) {
      // ══════════════════════════════════════════════════════════
      // 登陸安全校準: 遠離海岸時嚴禁下水，防止步兵戰車落海溺斃！
      // ══════════════════════════════════════════════════════════
      if (!nearestIsland || !bestShorePt || minShoreDist > 260) {
        const targetDesc = nearestIsland
          ? `距「${nearestIsland.name}」海岸約 ${Math.round(minShoreDist)}m (安全搶灘上限 260m)`
          : '周邊空闊無海岸陸地';
        this.addBannerAlert(
          `⚠️【嚴禁於外海下水】「${transport.name}」目前位於開闊海域！請先指令登陸艇貼近沙灘灘頭！`,
          'player',
          'alert',
          5.0
        );
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName: transport.name,
          targetName: '灘頭導航警報',
          actionType: 'recon_spotted',
          text: `⚠️【搶灘中止】「${transport.name}」遠離海岸線 (${targetDesc})！為防止突擊步兵與重戰車落海沈沒，嚴禁於深水外海下水！請先下達移動指令讓艦艇靠近灘頭！`,
        });
        return;
      }

      // DISEMBARK: 強制精準校準至最近島嶼沙灘陸地 (Solid Land Polygon)
      soundEngine.playPlaneSortie();
      const inDx = nearestIsland.center.x - bestShorePt.x;
      const inDy = nearestIsland.center.y - bestShorePt.y;
      const inLen = Math.hypot(inDx, inDy) || 1;
      const inwardAngle = Math.atan2(inDy, inDx);
      const perpAngle = inwardAngle + Math.PI / 2;

      // 灘頭基準點: 自海岸線向島內陸地延伸 35px
      const landBasePos: Vector2D = {
        x: bestShorePt.x + (inDx / inLen) * 35,
        y: bestShorePt.y + (inDy / inLen) * 35,
      };

      embarkedUnits.forEach((unit, idx) => {
        unit.embarkedInShipId = undefined;
        const lateralOffset = (idx - (embarkedUnits.length - 1) / 2) * 24;
        let landingPos = {
          x: landBasePos.x + Math.cos(perpAngle) * lateralOffset,
          y: landBasePos.y + Math.sin(perpAngle) * lateralOffset,
        };

        // 確保單位 100% 落在島嶼多邊形陸地內部 (若超出邊界則逐步往島嶼中心拉入)
        if (!isPointInPolygon(landingPos, nearestIsland.points)) {
          for (let step = 1; step <= 12; step++) {
            const testPos = {
              x: landingPos.x + (inDx / inLen) * (step * 20),
              y: landingPos.y + (inDy / inLen) * (step * 20),
            };
            if (isPointInPolygon(testPos, nearestIsland.points)) {
              landingPos = testPos;
              break;
            }
          }
        }

        unit.pos = landingPos;
        unit.heading = inwardAngle;
        unit.order = { type: 'idle' };
        unit.isSupplied = true;
      });
      transport.embarkedUnitIds = [];

      const islName = nearestIsland?.name || '目標灘頭';
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: transport.name,
        targetName: islName,
        actionType: 'recon_spotted',
        text: `🌊【搶灘登陸成功！】「${transport.name}」放下艏門跳板！${embarkedUnits.length} 個陸戰排/戰車部隊衝上海灘灘頭！`,
      });
    } else {
      // EMBARK: 靠岸裝載我方地面部隊
      const capacity = transport.cargoCapacity || 2;
      const nearbyUnits = this.groundUnits.filter(
        (u) => u.side === 'player' && !u.embarkedInShipId && !u.isDestroyed && dist(u.pos, transport.pos) < 450
      );

      if (nearbyUnits.length === 0) {
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName: transport.name,
          targetName: '部隊裝載',
          actionType: 'recon_spotted',
          text: `⚠️「${transport.name}」周圍 450m 內無我方部隊。請先派遣步兵或戰車靠攏登陸艇。`,
        });
        return;
      }

      const toEmbark = nearbyUnits.slice(0, capacity);
      toEmbark.forEach((u) => {
        u.embarkedInShipId = transport.id;
        u.pos = { ...transport.pos };
      });
      transport.embarkedUnitIds = toEmbark.map((u) => u.id);
      soundEngine.playPlaneSortie();

      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: transport.name,
        targetName: '陸戰隊編隊',
        actionType: 'recon_spotted',
        text: `⚓【裝載登艦完畢】「${transport.name}」成功裝載 ${toEmbark.length} 個部隊（裝載量: ${toEmbark.length}/${capacity}）！準備航向目標群島！`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // LSM(R) 火箭艦連續火箭齊射主動技能 (Rocket Barrage)
  // ══════════════════════════════════════════════════════════

  public triggerLSMRocketBarrage(lsmrId: string, targetPos?: Vector2D) {
    const lsmr = this.playerShips.find((s) => s.id === lsmrId && !s.isSunk);
    if (!lsmr || (lsmr.rocketCooldown && lsmr.rocketCooldown > 0)) return;

    const target = targetPos || {
      x: lsmr.pos.x + Math.cos(lsmr.heading) * 950,
      y: lsmr.pos.y + Math.sin(lsmr.heading) * 950,
    };
    soundEngine.playRocketIgnition();

    // Fire 12 continuous rockets in rapid succession
    for (let r = 0; r < 12; r++) {
      setTimeout(() => {
        if (!lsmr || lsmr.isSunk) return;
        const spreadX = (Math.random() - 0.5) * 120;
        const spreadY = (Math.random() - 0.5) * 120;
        const rTarget = { x: target.x + spreadX, y: target.y + spreadY };
        const angle = Math.atan2(rTarget.y - lsmr.pos.y, rTarget.x - lsmr.pos.x);
        const d = dist(lsmr.pos, rTarget);

        this.projectiles.push({
          id: `lsm-rocket-${Date.now()}-${r}`,
          type: 'rocket',
          side: 'player',
          pos: { ...lsmr.pos },
          vel: { x: Math.cos(angle) * 360, y: Math.sin(angle) * 360 },
          originPos: { ...lsmr.pos },
          targetPos: rTarget,
          flightProgress: 0,
          maxDistance: d,
          distanceTraveled: 0,
          damage: 220,
          blastRadius: 45,
          speed: 360,
          heading: angle,
          isDead: false,
          trail: [],
          attackerName: 'LSM(R)-196 火箭艦',
        });
      }, r * 80);
    }

    lsmr.rocketCooldown = 18; // 18 seconds cooldown
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: lsmr.name,
      targetName: '敵灘頭防禦陣地',
      actionType: 'rocket_hit',
      text: `🚀【密集火箭彈幕覆蓋！】「${lsmr.name}」85聯裝連續火箭發射架齊射！密集 5吋火箭呼嘯傾瀉目標海灘！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 前進航空基地 (AFB) 轉場與出擊調度 (Airbase Operations)
  // ══════════════════════════════════════════════════════════

  public ferryAirbasePlanesToCarrier(model: string, count: number = 2) {
    const flagship = this.getFlagship();
    if (!flagship || !flagship.carrierPlanes) {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: '前進航空基地',
        targetName: '特遣艦隊',
        actionType: 'recon_spotted',
        text: `⚠️ 目前特遣艦隊中無航空母艦可供轉場降落。`,
      });
      return;
    }

    const available = this.airbasePlanes[model] || 0;
    if (available < count) {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: '前進航空基地',
        targetName: '特遣艦隊',
        actionType: 'recon_spotted',
        text: `⚠️ 基地該機型庫存不足 (${available}/${count})。`,
      });
      return;
    }

    this.airbasePlanes[model] -= count;
    const currentReady = flagship.carrierPlanes.ready[model] || 0;
    const maxReady = flagship.carrierPlanes.maxPerType[model] || 14;
    const addReady = Math.min(count, maxReady - currentReady);
    const addHangar = count - addReady;

    flagship.carrierPlanes.ready[model] = currentReady + addReady;
    if (addHangar > 0) {
      flagship.carrierPlanes.hangar[model] = (flagship.carrierPlanes.hangar[model] || 0) + addHangar;
    }

    soundEngine.playPlaneSortie();
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '前進航空基地 (AFB)',
      targetName: flagship.name,
      actionType: 'recon_spotted',
      text: `🛫【轉場渡航成功】前進空軍基地調派 ${count} 架 ${model.toUpperCase()} 飛往「${flagship.name}」，已順利降落補入艦隊機庫！`,
    });
  }

  public launchAirbaseSortie(
    model: AircraftModel,
    count: number = 2,
    payload?: AircraftPayloadType,
    targetPos?: Vector2D
  ) {
    const available = this.airbasePlanes[model] || 0;
    if (available < count) return;
    this.airbasePlanes[model] -= count;

    const baseCenter = this.friendlyBase?.center || { x: 2000, y: 12400 };
    const heading = -Math.PI / 4;
    soundEngine.playPlaneSortie();

    const role: AircraftRole =
      model === 'b17' || model === 'b24' || model === 'b29' || model === 'b52'
        ? 'level_bomber'
        : model === 'p40' || model === 'p38' || model === 'p51' || model === 'f86' || model === 'f4f' || model === 'f6f' || model === 'f4u' || model === 'f8f' || model === 'f9f' || model === 'f2h' || model === 'f8' || model === 'f4b' || model === 'f4j' || model === 'f4e'
        ? 'fighter'
        : model === 'a20' || model === 'p47' || model === 'a26' || model === 'ad1' || model === 'f4u4' || model === 'a4' || model === 'a6a' || model === 'a6b_weasel' || model === 'f105' || model === 'a7' || model === 'ah1'
        ? 'attacker'
        : model === 'sbd' || model === 'sb2c'
        ? 'dive_bomber'
        : model === 'os2u' || model === 'sc1' || model === 'ad3w' || model === 'e1' || model === 'ov10' || model === 's2' || model === 'p3'
        ? 'scout'
        : model === 'ho3s1' || model === 'uh2' || model === 'sh2'
        ? 'rescue'
        : model === 'uh1' || model === 'c1'
        ? 'transport'
        : 'torpedo_bomber';

    const rawSpeed =
      model === 'f4b' || model === 'f4j' || model === 'f4e' ? 165 :
      model === 'f105' ? 155 :
      model === 'f8' ? 150 :
      model === 'a7' ? 140 :
      model === 'f86' ? 138 :
      model === 'b52' ? 135 :
      model === 'a4' ? 132 :
      model === 'a6a' || model === 'a6b_weasel' ? 130 :
      model === 'f9f' ? 128 :
      model === 'f2h' ? 126 :
      model === 'p51' ? 124 :
      model === 'a26' ? 120 :
      model === 'f8f' ? 118 :
      model === 'p38' ? 116 :
      model === 'ad1' ? 115 :
      model === 'p3' ? 115 :
      model === 'p47' ? 114 :
      model === 'f4u' || model === 'f4u4' ? 112 :
      model === 'b29' ? 108 :
      model === 'a20' ? 108 :
      model === 'f6f' ? 105 :
      model === 'p40' ? 104 :
      model === 'c1' || model === 's2' || model === 'e1' ? 100 :
      model === 'ov10' || model === 'ah1' ? 95 :
      model === 'sh2' ? 92 :
      model === 'f4f' ? 98 :
      model === 'b24' ? 96 :
      model === 'uh1' || model === 'uh2' ? 90 :
      model === 'sb2c' ? 90 :
      model === 'b17' ? 88 :
      model === 'tbf' || model === 'af_guardian' ? 86 :
      model === 'sbd' ? 84 :
      model === 'tbd' ? 76 : 90;

    const baseHealth =
      model === 'b52' ? 3200 :
      model === 'b29' ? 1350 :
      model === 'b24' ? 920 :
      model === 'b17' ? 820 :
      model === 'f105' ? 720 :
      model === 'a6a' || model === 'a6b_weasel' ? 700 :
      model === 'f4b' || model === 'f4j' || model === 'f4e' ? 680 :
      model === 'ad1' ? 680 :
      model === 'a26' ? 660 :
      model === 'a7' ? 640 :
      model === 'p47' ? 620 :
      model === 's2' || model === 'c1' || model === 'e1' ? 580 :
      model === 'a4' ? 560 :
      model === 'f8' ? 560 :
      model === 'f2h' ? 540 :
      model === 'a20' ? 520 :
      model === 'f8f' ? 520 :
      model === 'f9f' ? 500 :
      model === 'sb2c' ? 500 :
      model === 'ah1' ? 490 :
      model === 'p38' ? 480 :
      model === 'p51' ? 450 :
      model === 'f86' ? 480 :
      model === 'uh1' || model === 'uh2' ? 460 :
      model === 'f4u' || model === 'f4u4' ? 480 :
      model === 'tbf' || model === 'af_guardian' ? 460 :
      model === 'ov10' ? 440 :
      model === 'f6f' ? 440 :
      model === 'p40' ? 420 :
      model === 'sbd' ? 420 :
      model === 'f4f' ? 360 : 400;

    const pType: AircraftPayloadType =
      payload ||
      (model === 'b52'
        ? 'b52_megaton_carpet'
        : model === 'f4e' || model === 'f4j'
        ? 'aim7_sparrow'
        : model === 'f105'
        ? 'agm45_shrike'
        : model === 'a7'
        ? 'agm62_walleye'
        : model === 'a6a'
        ? 'bombs_snakeye_retarded'
        : model === 'a6b_weasel'
        ? 'agm45_shrike'
        : model === 'a4'
        ? 'bombs_snakeye_retarded'
        : model === 'f8'
        ? 'aim9_sidewinder'
        : model === 'ov10'
        ? 'ffar_rockets_pod'
        : model === 'uh1'
        ? 'helo_assault_troops'
        : model === 'ah1'
        ? 'ffar_rockets_pod'
        : model === 'c1'
        ? 'c1_paratroopers'
        : model === 'sh2' || model === 'p3'
        ? 'asw_acoustic_torpedo'
        : model === 'b17'
        ? 'bombs_carpet_250'
        : model === 'b24'
        ? 'bombs_quad_500'
        : model === 'b29'
        ? 'bombs_carpet_250'
        : model === 'p51'
        ? 'clean_guns'
        : model === 'p47'
        ? 'mixed_bombs_rockets'
        : model === 'f86'
        ? 'clean_guns'
        : model === 'a20'
        ? 'bombs_dual_500'
        : model === 'a26'
        ? (this.era === 'era3' ? 'napalm_canister' : 'bombs_dual_500')
        : model === 'p40'
        ? 'clean_guns'
        : model === 'p38'
        ? 'hvar_rockets'
        : role === 'level_bomber'
        ? 'bombs_carpet_250'
        : role === 'attacker'
        ? 'mixed_bombs_rockets'
        : role === 'fighter'
        ? 'clean_guns'
        : role === 'dive_bomber'
        ? 'bomb_1000'
        : 'aerial_torpedo');

    // ══════════════════════════════════════════════════════════
    // 時代三與時代四戰術/戰略核武器政治後果與授權檢定 (Nuclear Weapons CP Costs)
    // ══════════════════════════════════════════════════════════
    if (pType === 'b52_megaton_nuke') {
      if (this.resourcePoints < 6000) {
        this.airbasePlanes[model] += count;
        this.addBannerAlert('❌【政治授權不足】動用 B28/B41 百萬噸級戰略核武器需耗費 6,000 CP！目前 CP 不足！', 'player', 'sunk', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '戰略空軍司令部 (SAC)',
          targetName: 'B-52 戰略打擊機隊',
          actionType: 'recon_spotted',
          text: `❌【戰略核授權駁回】動用百萬噸級戰略熱核武器需耗費 6,000 CP！目前指揮點數不足 (${Math.floor(this.resourcePoints)} / 6000 CP)！`,
        });
        return;
      }
      this.resourcePoints -= 6000;
      this.totalCpSpent += 6000;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【國家最高指揮授權核准】B-52 戰略轟炸機裝載百萬噸級熱核武器升空！消耗 6,000 CP！', 'player', 'sunk', 7.5);
    } else if (pType === 'tactical_b61_nuke') {
      if (this.resourcePoints < 4000) {
        this.airbasePlanes[model] += count;
        this.addBannerAlert('❌【政治授權不足】動用 B61 戰術核武器需耗費 4,000 CP！目前 CP 不足！', 'player', 'sunk', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '參謀長聯席會議 (JCS)',
          targetName: '戰術攻擊機隊',
          actionType: 'recon_spotted',
          text: `❌【戰術核授權駁回】動用 B61 戰術核航彈需耗費 4,000 CP 政治與戰略資源！目前指揮點數不足 (${Math.floor(this.resourcePoints)} / 4000 CP)！`,
        });
        return;
      }
      this.resourcePoints -= 4000;
      this.totalCpSpent += 4000;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【國家最高指揮授權核准】戰術攻擊機群裝載 B61 戰術核航彈升空！消耗 4,000 CP！', 'player', 'sunk', 7.5);
    } else if (pType === 'tactical_nuke') {
      if (this.resourcePoints < 4500) {
        // Return available planes since sortie cannot proceed
        this.airbasePlanes[model] += count;
        this.addBannerAlert('❌【政治授權不足】動用戰術核武器需耗費 4,500 CP 戰略指揮點數！目前 CP 不足！', 'player', 'sunk', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '參謀長聯席會議 (JCS)',
          targetName: 'B-29 戰略打擊機隊',
          actionType: 'recon_spotted',
          text: `❌【戰略核授權駁回】動用戰術原子彈需耗費 4,500 CP 政治與戰略資源！目前指揮點數不足 (${Math.floor(this.resourcePoints)} / 4500 CP)！`,
        });
        return;
      }
      this.resourcePoints -= 4500;
      this.totalCpSpent += 4500;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert('☢️【國家最高指揮授權核准】B-29 超高空戰略轟炸機裝載 Mk 4 戰術核武器升空！消耗 4,500 CP！', 'player', 'sunk', 7.5);
    }

    const roleZh =
      role === 'level_bomber' ? (model === 'b52' ? '同溫層堡壘巨型戰略轟炸機 (36枚地毯轟炸)' : model === 'b29' ? '超級堡壘戰略轟炸機 (萬米平流層防空免疫)' : '四發重型水平轟炸機') :
      model === 'f105' ? '野鼬/超音速戰鬥轟炸機 (ARM 反輻射打擊)' :
      model === 'ah1' ? '眼鏡蛇重武裝攻擊直升機' :
      model === 'uh1' ? '休伊突擊運輸直升機 (垂直包圍作戰)' :
      model === 'ov10' ? '野馬前進空中管制機 (FAC / FFAR 火箭)' :
      model === 'c1' ? '貿易者艦載傘兵空投機' :
      role === 'attacker' ? '重型突擊攻擊機' :
      role === 'fighter' ? '主力超音速戰鬥機' :
      role === 'dive_bomber' ? '俯衝轟炸機' :
      role === 'transport' ? '空中突擊運輸機' : '巡邏反潛機';

    const flightName = `AFB 出擊機隊 (${count}x ${model.toUpperCase()} ${roleZh})`;

    let gunRounds = 1440;
    if (model === 'b52') gunRounds = 4000;
    else if (model === 'b29') gunRounds = 4400;
    else if (model === 'b17' || model === 'b24') gunRounds = 3200;
    else if (model === 'f4e' || model === 'f105' || model === 'a7') gunRounds = 1000;
    else if (model === 'ov10' || model === 'ah1') gunRounds = 1500;
    else if (model === 'uh1') gunRounds = 1200;
    else if (model === 'p47') gunRounds = 3400;
    else if (model === 'a26') gunRounds = 2400;
    else if (model === 'a20') gunRounds = 2000;
    else if (model === 'p51') gunRounds = 1880;
    else if (model === 'p38' || model === 'f86') gunRounds = 1800;
    else if (model === 'p40') gunRounds = 1440;

    for (let i = 0; i < count; i++) {
      const planeId = `afb-plane-${Date.now()}-${i}`;
      this.aircraft.push({
        id: planeId,
        squadronId: `sq-afb-${Date.now()}`,
        model,
        role,
        name: flightName,
        side: 'player',
        pos: { x: baseCenter.x + (i - (count - 1) / 2) * 28, y: baseCenter.y + (i - (count - 1) / 2) * 22 },
        vel: { x: Math.cos(heading) * rawSpeed, y: Math.sin(heading) * rawSpeed },
        heading,
        targetHeading: heading,
        speed: rawSpeed,
        maxSpeed: rawSpeed,
        altitude: model === 'b29' ? 0.98 : role === 'level_bomber' ? 0.95 : role === 'attacker' ? 0.35 : 0.85,
        state: 'cruising',
        health: baseHealth,
        maxHealth: baseHealth,
        order: targetPos ? { type: 'attack', targetPos } : { type: 'patrol' },
        hasPayload: true,
        payloadType: pType,
        payloadName: PAYLOAD_CATALOG[pType]?.badge || 'Standard',
        shootCooldown: 0,
        gunAmmo: gunRounds,
        maxGunAmmo: gunRounds,
        wingmanOffset: { x: (i - (count - 1) / 2) * 28, y: i * 20 },
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '前進航空基地 (AFB)',
      targetName: '戰區空域',
      actionType: 'recon_spotted',
      text: `✈️【基地機隊緊急出擊！】前進航空基地出動 ${count} 架 ${model.toUpperCase()} (${roleZh}) 直飛戰區！掛載: ${PAYLOAD_CATALOG[pType]?.nameZh || pType}`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 工兵群闢建前進野戰機場 (Engineer Airfield Construction)
  // ══════════════════════════════════════════════════════════

  public buildAirfield(engineerId: string): { success: boolean; message: string } {
    const eng = this.groundUnits.find((u) => u.id === engineerId && u.side === 'player' && !u.isDestroyed);
    if (!eng) {
      return { success: false, message: '找不到選定的工兵部隊！' };
    }
    if (eng.embarkedInShipId) {
      return { success: false, message: '工兵部隊目前在登陸艇內，請先搶灘登陸上島後再行闢建機場！' };
    }

    // Check which island the engineer is currently standing on
    const onIsland = this.islands.find(
      (isl) => isPointInPolygon(eng.pos, isl.points) || dist(eng.pos, isl.center) < isl.radius + 35
    );

    if (!onIsland) {
      return { success: false, message: '工兵部隊必須位於陸地島嶼灘頭上方可開闢新機場！' };
    }

    const existingPlayerAirfield = onIsland.installations.find(
      (i) => i.type === 'airfield' && !i.isDestroyed && i.side === 'player'
    );
    if (existingPlayerAirfield) {
      return { success: false, message: `「${onIsland.name}」已建有運作中的友軍前進機場！` };
    }

    // Successfully construct new forward airfield!
    soundEngine.playPlaneSortie();
    const newAirfieldId = `airfield-${onIsland.id}-${Date.now()}`;
    const newAirfield: Installation = {
      id: newAirfieldId,
      type: 'airfield',
      name: `前進野戰航空基地 (${onIsland.name})`,
      weaponDesc: '工兵群緊急拓闢之野戰前進機場 · 跑道長度1800米 · 支援全天候出擊',
      pos: { ...eng.pos },
      angle: -Math.PI / 4,
      health: 3000,
      maxHealth: 3000,
      range: 4000,
      cooldown: 0,
      reloadTime: 15,
      isDestroyed: false,
      side: 'player',
    };
    onIsland.installations.push(newAirfield);

    // Build companion AA Flak battery to protect airfield
    const newFlak: Installation = {
      id: `flak-${onIsland.id}-${Date.now()}`,
      type: 'flak_battery',
      name: '野戰防空砲兵連 (90mm M2 / 40mm Bofors)',
      weaponDesc: '工兵防空陣地 · 保護前進野戰跑道不受空襲',
      pos: { x: eng.pos.x + 85, y: eng.pos.y + 40 },
      angle: 0,
      health: 1200,
      maxHealth: 1200,
      armor: 0.35,
      range: 1100,
      cooldown: 0.5,
      reloadTime: 1.6,
      isDestroyed: false,
      side: 'player',
      isASuWOnly: false,
    };
    onIsland.installations.push(newFlak);

    // Stock newly built airfield with fresh planes in airbase pool!
    if (this.era === 'era1') {
      this.airbasePlanes.b17 = (this.airbasePlanes.b17 || 0) + 3;
      this.airbasePlanes.p40 = (this.airbasePlanes.p40 || 0) + 4;
      this.airbasePlanes.a20 = (this.airbasePlanes.a20 || 0) + 3;
    } else if (this.era === 'era2') {
      this.airbasePlanes.b24 = (this.airbasePlanes.b24 || 0) + 3;
      this.airbasePlanes.p51 = (this.airbasePlanes.p51 || 0) + 4;
      this.airbasePlanes.p47 = (this.airbasePlanes.p47 || 0) + 3;
    } else {
      this.airbasePlanes.b29 = (this.airbasePlanes.b29 || 0) + 3;
      this.airbasePlanes.f86 = (this.airbasePlanes.f86 || 0) + 4;
      this.airbasePlanes.a26 = (this.airbasePlanes.a26 || 0) + 3;
    }

    this.score.totalScore += 800;
    this.score.stars += 3;

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: eng.name,
      targetName: onIsland.name,
      actionType: 'recon_spotted',
      text: `🏗️【前進野戰機場闢建完成！】${eng.name} 在「${onIsland.name}」完成跑道鋪設與防空塔台！前進野戰航空基地正式投運，戰備機隊已就位！+800分，★+3星！`,
    });

    return {
      success: true,
      message: `【前進野戰機場闢建完成！】在「${onIsland.name}」成功拓闢新跑道！`,
    };
  }

  // ══════════════════════════════════════════════════════════
  // 戰區後勤採購系統 (Command Logistics & Requisition System)
  // ══════════════════════════════════════════════════════════

  public purchaseRequisition(
    item: RequisitionItem,
    targetIslandId?: string,
    customPos?: Vector2D,
    freeSandbox: boolean = false
  ): boolean {
    if (!freeSandbox) {
      if (this.resourcePoints < item.cost) {
        this.addBannerAlert(
          `⚠️【CP 點數不足】需要 ${item.cost} CP，目前僅有 ${Math.floor(this.resourcePoints)} CP！請等待累積或開啟【免CP沙盒模式】！`,
          'player',
          'alert',
          4.0
        );
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName: '後勤司令部 (LOGCOM)',
          targetName: item.nameZh,
          actionType: 'recon_spotted',
          text: `⚠️ 資源點數不足！需要 ${item.cost} CP，目前僅有 ${Math.floor(this.resourcePoints)} CP。請等待時間累積、佔領據點或擊沉敵艦！`,
        });
        return false;
      }

      this.resourcePoints -= item.cost;
      this.totalCpSpent += item.cost;
    }

    const flagship = this.getFlagship();
    const spawnBase = this.friendlyBase?.center || { x: 2200, y: 12000 };
    const fleetPos = flagship ? { x: flagship.pos.x - 220, y: flagship.pos.y + 220 } : spawnBase;

    if (item.category === 'ships') {
      soundEngine.playPlaneSortie();
      let newShip: Ship | null = null;
      const shipId = `player-req-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      // 海軍艦艇單位固定自地圖西南邊緣海疆增援航向戰區
      const mapBound = this.worldSize || 14000;
      const edgeSpawnX = 800 + Math.random() * 1400;
      const edgeSpawnY = mapBound - 350 - Math.random() * 400;
      const warshipSpawnPos: Vector2D = { x: edgeSpawnX, y: edgeSpawnY };

      if (item.typeTag === 'bb' || item.typeTag === 'bb_missouri') {
        const isMo = item.typeTag === 'bb_missouri' || this.era === 'era3';
        newShip = createPlayerBattleship(
          shipId,
          isMo
            ? 'USS Missouri (BB-63 密蘇里號主力戰艦)'
            : this.era === 'era1'
            ? 'USS North Carolina (BB-55)'
            : 'USS Iowa (BB-61)',
          warshipSpawnPos,
          this.era
        );
      } else if (item.typeTag === 'ca' || item.typeTag === 'ca_desmoines') {
        newShip = createConvoyEscortShip(shipId, 'ca', warshipSpawnPos, this.era);
        if (item.typeTag === 'ca_desmoines' || this.era === 'era3') {
          newShip.name = 'USS Des Moines (CA-134 得梅因號自動裝填重巡)';
          newShip.health = 3600;
          newShip.maxHealth = 3600;
        }
      } else if (item.typeTag === 'cl') {
        newShip = createConvoyEscortShip(shipId, 'cl', warshipSpawnPos, this.era);
      } else if (item.typeTag === 'dd' || item.typeTag === 'dd_gearing' || item.typeTag === 'dd_sherman') {
        if (this.era === 'era4' || item.typeTag === 'dd_sherman') {
          newShip = createForrestShermanDD(shipId, 'USS Forrest Sherman (DD-931 驅逐艦)', warshipSpawnPos);
        } else {
          newShip = createConvoyEscortShip(shipId, 'dd', warshipSpawnPos, this.era);
          if (item.typeTag === 'dd_gearing' || this.era === 'era3') {
            newShip.name = 'USS Gearing (DD-710 基靈級雷達糾察驅逐艦)';
            newShip.health = 1850;
            newShip.maxHealth = 1850;
          }
        }
      } else if (item.typeTag === 'ffg') {
        newShip = createKnoxFFG(shipId, 'USS Knox (FFG-1052 巡防艦)', warshipSpawnPos);
      } else if (item.typeTag === 'ss') {
        newShip = createConvoyEscortShip(shipId, 'ss', warshipSpawnPos, this.era);
      } else if (item.typeTag === 'lst') {
        newShip = createLST(shipId, 'USS LST-491 戰車登陸艦', warshipSpawnPos, this.era);
      } else if (item.typeTag === 'lcvp') {
        newShip = createLCVP(shipId, 'LCVP 突擊登陸艇', warshipSpawnPos, this.era);
      } else if (item.typeTag === 'cv63') {
        newShip = createCV63(shipId, 'USS Kitty Hawk (CV-63 超級航空母艦)', warshipSpawnPos);
      } else if (item.typeTag === 'cg') {
        newShip = createBelknapCG(shipId, 'USS Belknap (CG-26 導彈巡洋艦)', warshipSpawnPos);
      } else if (item.typeTag === 'ddg') {
        newShip = createAdamsDDG(shipId, 'USS Charles F. Adams (DDG-2 導彈驅逐艦)', warshipSpawnPos);
      } else if (item.typeTag === 'lph') {
        newShip = createLPHIwoJima(shipId, 'USS Iwo Jima (LPH-2 兩棲突擊艦)', warshipSpawnPos);
      } else if (item.typeTag === 'lcm8') {
        newShip = createLCM8(shipId, 'LCM-8 機械化登陸艇', warshipSpawnPos);
      }

      if (newShip) {
        newShip.heading = -Math.PI / 4; // 朝向東北戰區航進
        this.playerShips.push(newShip);
        this.addBannerAlert(`⚓【艦隊邊界增援】「${newShip.name}」自地圖邊緣駛入戰區！`, 'player', 'capture', 6.0);
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName: '後勤調遣司令部',
          targetName: newShip.name,
          actionType: 'recon_spotted',
          text: `⚓【海軍調遣就緒】${freeSandbox ? '【免CP沙盒建造】' : `耗費 ${item.cost} CP`} 調派「${newShip.name}」自地圖西南邊疆外海駛入戰區！火砲裝備、航向與戰術編隊已就緒！`,
        });
        return true;
      }
    } else if (item.category === 'aircraft') {
      soundEngine.playPlaneSortie();
      // 飛機(陸海基)增援固定剛開始都是在起始機場 pool 中
      if (item.typeTag === 'fighter_pool') {
        const fighterModel = this.era === 'era1' ? 'f4f' : this.era === 'era2' ? 'f6f' : this.era === 'era3' ? 'f9f' : 'f4b';
        const landFighter = this.era === 'era1' ? 'p40' : this.era === 'era2' ? 'p51' : this.era === 'era3' ? 'f86' : 'f4e';
        this.airbasePlanes[fighterModel] = (this.airbasePlanes[fighterModel] || 0) + 4;
        this.airbasePlanes[landFighter] = (this.airbasePlanes[landFighter] || 0) + 4;
      } else if (item.typeTag === 'air_f4j') {
        this.airbasePlanes.f4j = (this.airbasePlanes.f4j || 0) + 4;
      } else if (item.typeTag === 'air_f8') {
        this.airbasePlanes.f8 = (this.airbasePlanes.f8 || 0) + 4;
      } else if (item.typeTag === 'air_a6a') {
        this.airbasePlanes.a6a = (this.airbasePlanes.a6a || 0) + 4;
      } else if (item.typeTag === 'air_a4') {
        this.airbasePlanes.a4 = (this.airbasePlanes.a4 || 0) + 4;
      } else if (item.typeTag === 'air_b52') {
        this.airbasePlanes.b52 = (this.airbasePlanes.b52 || 0) + 2;
      } else if (item.typeTag === 'air_f105') {
        this.airbasePlanes.f105 = (this.airbasePlanes.f105 || 0) + 4;
      } else if (item.typeTag === 'air_a7') {
        this.airbasePlanes.a7 = (this.airbasePlanes.a7 || 0) + 4;
      } else if (item.typeTag === 'air_ov10') {
        this.airbasePlanes.ov10 = (this.airbasePlanes.ov10 || 0) + 4;
      } else if (item.typeTag === 'air_uh1') {
        this.airbasePlanes.uh1 = (this.airbasePlanes.uh1 || 0) + 4;
      } else if (item.typeTag === 'air_ah1') {
        this.airbasePlanes.ah1 = (this.airbasePlanes.ah1 || 0) + 4;
      } else if (item.typeTag === 'air_c1') {
        this.airbasePlanes.c1 = (this.airbasePlanes.c1 || 0) + 2;
      } else if (item.typeTag === 'air_sh2') {
        this.airbasePlanes.sh2 = (this.airbasePlanes.sh2 || 0) + 2;
      } else if (item.typeTag === 'air_p3') {
        this.airbasePlanes.p3 = (this.airbasePlanes.p3 || 0) + 2;
      } else if (item.typeTag === 'fighter_jet_f9f') {
        this.airbasePlanes.f9f = (this.airbasePlanes.f9f || 0) + 4;
      } else if (item.typeTag === 'fighter_jet_f2h') {
        this.airbasePlanes.f2h = (this.airbasePlanes.f2h || 0) + 4;
      } else if (item.typeTag === 'attacker_skyraider') {
        this.airbasePlanes.ad1 = (this.airbasePlanes.ad1 || 0) + 4;
      } else if (item.typeTag === 'aew_ad3w') {
        this.airbasePlanes.ad3w = (this.airbasePlanes.ad3w || 0) + 1;
      } else if (item.typeTag === 'sar_ho3s1') {
        this.airbasePlanes.ho3s1 = (this.airbasePlanes.ho3s1 || 0) + 1;
      } else if (item.typeTag === 'dive_bomber_pool') {
        const diveModel = this.era === 'era1' ? 'sbd' : this.era === 'era2' ? 'sb2c' : this.era === 'era3' ? 'ad1' : 'a4';
        this.airbasePlanes[diveModel] = (this.airbasePlanes[diveModel] || 0) + 4;
      } else if (item.typeTag === 'torpedo_bomber_pool') {
        const torpModel = this.era === 'era1' ? 'tbd' : this.era === 'era2' ? 'tbf' : this.era === 'era3' ? 'af_guardian' : 'a6a';
        this.airbasePlanes[torpModel] = (this.airbasePlanes[torpModel] || 0) + 4;
      } else if (item.typeTag === 'heavy_bomber_pool') {
        const heavyModel = this.era === 'era1' ? 'b17' : this.era === 'era2' ? 'b24' : this.era === 'era3' ? 'b29' : 'b52';
        this.airbasePlanes[heavyModel] = (this.airbasePlanes[heavyModel] || 0) + 2;
      } else if (item.typeTag === 'attacker_pool') {
        const attModel = this.era === 'era1' ? 'a20' : this.era === 'era2' ? 'p47' : this.era === 'era3' ? 'a26' : 'a7';
        this.airbasePlanes[attModel] = (this.airbasePlanes[attModel] || 0) + 4;
      }

      this.addBannerAlert(`✈️【機隊補充】「${item.nameZh}」已進駐起始前進基地航空庫存！`, 'player', 'capture', 5.0);
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: '海軍航空兵部 (BuAer)',
        targetName: item.nameZh,
        actionType: 'recon_spotted',
        text: `✈️【航空戰力充實】${freeSandbox ? '【免CP沙盒配置】' : `耗費 ${item.cost} CP`}！${item.nameZh} 戰機群已進駐起始前進基地機庫，可隨時自基地起飛或轉場！`,
      });
      return true;
    } else if (item.category === 'ground') {
      soundEngine.playPlaneSortie();
      // 尋找可用的友軍營指揮所 (Battalion CP)
      let activeBattalionCp: Installation | null = null;
      for (const isl of this.islands) {
        const found = isl.installations.find(
          (inst) => (inst.type === 'battalion_cp' || inst.type === 'command_post') && !inst.isDestroyed && inst.side === 'player'
        );
        if (found) {
          if (!activeBattalionCp || (targetIslandId && isl.id === targetIslandId)) {
            activeBattalionCp = found;
          }
        }
      }

      let spawnPos: Vector2D;
      let spawnLabel: string;
      if (customPos) {
        spawnPos = { x: customPos.x + (Math.random() - 0.5) * 35, y: customPos.y + (Math.random() - 0.5) * 35 };
        spawnLabel = '指定營指揮所前線';
      } else if (activeBattalionCp) {
        // 在該營指揮所旁邊 Spawn 陸地單位！
        spawnPos = {
          x: activeBattalionCp.pos.x + 40 + (Math.random() - 0.5) * 30,
          y: activeBattalionCp.pos.y + 40 + (Math.random() - 0.5) * 30,
        };
        spawnLabel = `${activeBattalionCp.name} 旁集結點`;
      } else {
        const targetIsland = targetIslandId
          ? this.islands.find((i) => i.id === targetIslandId)
          : this.islands.find((i) => i.isFriendlyBase) || this.islands[0];
        spawnPos = targetIsland
          ? { x: targetIsland.center.x + (Math.random() - 0.5) * 120, y: targetIsland.center.y + (Math.random() - 0.5) * 120 }
          : fleetPos;
        spawnLabel = targetIsland?.name || '戰略基地';
      }

      const gId = `usmc-req-${Date.now()}`;
      let gUnit: GroundUnit | null = null;
      if (item.typeTag === 'infantry') {
        gUnit = createGroundUnit(
          gId,
          this.era === 'era1' ? 'usmc_rifle_42' : this.era === 'era2' ? 'usmc_rifle_45' : this.era === 'era3' ? 'usmc_korea_rifle' : 'usmc_air_assault_65',
          this.era === 'era1' ? 'USMC 陸戰步兵排 (1942)' : this.era === 'era2' ? 'USMC 陸戰突擊步兵排 (1945)' : this.era === 'era3' ? 'USMC 陸戰突擊步兵排 (1950)' : 'USMC 空中突擊/直升機機降排 (1965)',
          'player',
          this.era,
          spawnPos
        );
      } else if (item.typeTag === 'air_assault') {
        gUnit = createGroundUnit(gId, 'usmc_air_assault_65', 'USMC 空中突擊/直升機機降突擊排 (1965)', 'player', this.era, spawnPos);
      } else if (item.typeTag === 'armor_m48') {
        gUnit = createGroundUnit(gId, 'usmc_armor_m48', 'USMC M48A3 巴頓主力戰車排', 'player', this.era, spawnPos);
      } else if (item.typeTag === 'ontos_m50') {
        gUnit = createGroundUnit(gId, 'usmc_ontos_m50', 'USMC M50 昂圖斯六聯無後座力砲戰車', 'player', this.era, spawnPos);
      } else if (item.typeTag === 'artillery') {
        gUnit = createGroundUnit(
          gId,
          this.era === 'era3' || this.era === 'era4' ? 'usmc_howitzer_155' : 'usmc_artillery_105',
          this.era === 'era3' || this.era === 'era4' ? 'USMC M114 155mm 重榴彈砲排' : 'USMC M2A1 105mm 砲兵支援排',
          'player',
          this.era,
          spawnPos
        );
      } else if (item.typeTag === 'tank') {
        gUnit = createGroundUnit(
          gId,
          this.era === 'era1' ? 'usmc_armor_m3' : this.era === 'era2' ? 'usmc_armor_m4' : this.era === 'era3' ? 'usmc_patton_m46' : 'usmc_armor_m48',
          this.era === 'era1' ? 'USMC M3 斯圖亞特戰車排' : this.era === 'era2' ? 'USMC M4A2 薛曼中戰車排' : this.era === 'era3' ? 'USMC M46 巴頓主力戰車排' : 'USMC M48A3 巴頓中戰車排',
          'player',
          this.era,
          spawnPos
        );
      } else if (item.typeTag === 'lvt') {
        gUnit = createGroundUnit(
          gId,
          this.era === 'era1' ? 'usmc_lvt_42' : 'usmc_lvt_45',
          this.era === 'era1'
            ? 'USMC LVT-1 水牛兩棲機步排'
            : this.era === 'era2'
            ? 'USMC LVT-4 水牛兩棲突擊排'
            : 'USMC LVT-P5 兩棲重裝步戰排',
          'player',
          this.era,
          spawnPos
        );
      } else if (item.typeTag === 'engineer') {
        gUnit = createGroundUnit(gId, 'usmc_engineer', 'USN Seabees 戰鬥工兵排', 'player', this.era, spawnPos);
      }

      if (gUnit) {
        this.groundUnits.push(gUnit);
        this.addBannerAlert(`🪖【陸軍戰備就位】「${gUnit.name}」已於 ${spawnLabel} 就地集結！`, 'player', 'capture', 5.0);
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName: '陸戰隊司令部',
          targetName: gUnit.name,
          actionType: 'recon_spotted',
          text: `🪖【陸戰戰力進駐】耗費 ${item.cost} CP！「${gUnit.name}」於 ${spawnLabel} 完成戰備集結，隨時準備發動突擊或加固防衛！`,
        });
        return true;
      }
    } else if (item.category === 'installations') {
      soundEngine.playPlaneSortie();
      let targetIsland = targetIslandId
        ? this.islands.find((i) => i.id === targetIslandId)
        : null;

      // If customPos is supplied, locate the nearest island
      if (customPos && !targetIsland) {
        let bestDist = 999999;
        for (const isl of this.islands) {
          const d = dist(customPos, isl.center);
          if (d < bestDist) {
            bestDist = d;
            targetIsland = isl;
          }
        }
      }

      if (!targetIsland) {
        targetIsland = this.islands.find((i) => i.isFullyCaptured || i.isFriendlyBase) || this.islands[0];
      }

      if (!targetIsland) return false;

      const isMaritimeFacility =
        item.typeTag === 'dockyard' || item.typeTag === 'pontoon_pier' || item.typeTag === 'major_naval_port';

      let instPos: Vector2D;
      let instAngle = 0;

      if (customPos) {
        instPos = { x: customPos.x, y: customPos.y };
        instAngle = Math.atan2(customPos.y - targetIsland.center.y, customPos.x - targetIsland.center.x);
      } else if (isMaritimeFacility) {
        // Place maritime pier/dock on the shoreline / coastal water edge of the island facing open sea
        const angle = targetIsland.isFriendlyBase ? -Math.PI / 4 : (Math.PI * 3) / 4;
        instPos = {
          x: targetIsland.center.x + Math.cos(angle) * (targetIsland.radius * 1.03),
          y: targetIsland.center.y + Math.sin(angle) * (targetIsland.radius * 1.03),
        };
        instAngle = angle;
      } else {
        const offsetAngle = Math.random() * Math.PI * 2;
        const rFactor = item.typeTag === 'coastal_gun' ? 0.90 : 0.45;
        instPos = {
          x: targetIsland.center.x + Math.cos(offsetAngle) * (targetIsland.radius * rFactor),
          y: targetIsland.center.y + Math.sin(offsetAngle) * (targetIsland.radius * rFactor),
        };
        instAngle = offsetAngle;
      }

      const instId = `inst-built-${Date.now()}`;
      if (item.typeTag === 'heavy_aa') {
        targetIsland.installations.push({
          id: instId,
          type: 'flak_battery',
          name: '127mm 雙聯重型防空砲堡',
          side: 'player',
          pos: instPos,
          health: 1200,
          maxHealth: 1200,
          angle: instAngle,
          range: 1200,
          reloadTime: 1.6,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'coastal_gun') {
        targetIsland.installations.push({
          id: instId,
          type: 'coastal_gun',
          name: '203mm 雙聯岸防重砲台',
          side: 'player',
          pos: instPos,
          health: 1600,
          maxHealth: 1600,
          angle: instAngle,
          range: 1600,
          reloadTime: 4.5,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'radar') {
        targetIsland.installations.push({
          id: instId,
          type: 'radar_station',
          name: '早期對空預警雷達台',
          side: 'player',
          pos: instPos,
          health: 800,
          maxHealth: 800,
          angle: instAngle,
          range: 4500,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'dockyard') {
        targetIsland.installations.push({
          id: instId,
          type: 'ship_repair_dock',
          name: `前線應急修護浮塢碼頭 (${targetIsland.name})`,
          side: 'player',
          pos: instPos,
          health: 1800,
          maxHealth: 1800,
          angle: instAngle,
          range: 650,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'pontoon_pier') {
        // 浮式人工棧橋港 (急造港口)
        targetIsland.installations.push({
          id: instId,
          type: 'pontoon_pier',
          name: `浮式人工棧橋港碼頭 (${targetIsland.name})`,
          weaponDesc: '工兵快速架設急造棧橋港 · 打通全島陸軍補給線 · 工兵駐守35秒自動升級正規深水軍港',
          side: 'player',
          pos: instPos,
          health: 2200,
          maxHealth: 2200,
          armor: 0.35,
          angle: instAngle,
          range: 550,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
          upgradeTimer: 0,
        });
      } else if (item.typeTag === 'major_naval_port') {
        // 正規深水軍港
        targetIsland.installations.push({
          id: instId,
          type: 'major_naval_port',
          name: `正規深水軍港突堤 (${targetIsland.name})`,
          weaponDesc: '大型深水突堤起重港埠 · 穩定建立全島補給線 · 產出補給點 (+1.5 CP/s)',
          side: 'player',
          pos: instPos,
          health: 4200,
          maxHealth: 4200,
          armor: 0.5,
          angle: instAngle,
          range: 850,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'supply_depot') {
        // 戰地輜重補給樞紐
        targetIsland.installations.push({
          id: instId,
          type: 'supply_depot',
          name: '戰地輜重補給樞紐',
          weaponDesc: '地下彈藥儲備與重裝備修造處 · 大幅加快全島地面部隊建制度修整 (+2.0%/s)',
          side: 'player',
          pos: instPos,
          health: 2000,
          maxHealth: 2000,
          armor: 0.4,
          angle: instAngle,
          range: 0,
          reloadTime: 0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'field_hospital') {
        // 戰地野戰醫院
        targetIsland.installations.push({
          id: instId,
          type: 'field_hospital',
          name: '戰地野戰醫院',
          weaponDesc: '救護整編中心 · 救治前線負傷官兵快速歸隊 · 穩定部隊組織度 (+2.5%/s)',
          side: 'player',
          pos: instPos,
          health: 1600,
          maxHealth: 1600,
          armor: 0.3,
          angle: instAngle,
          range: 0,
          reloadTime: 0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'airfield') {
        // 前進野戰機場
        targetIsland.installations.push({
          id: instId,
          type: 'airfield',
          name: `前進野戰機場跑道 (${targetIsland.name})`,
          weaponDesc: 'PSP鋼板珊瑚礁平整跑道 · 前線戰鬥機與重轟炸機起降補給點',
          side: 'player',
          pos: instPos,
          health: 3500,
          maxHealth: 3500,
          armor: 0.4,
          angle: instAngle,
          range: 0,
          reloadTime: 0,
          cooldown: 0,
          isDestroyed: false,
        });
        targetIsland.isFriendlyBase = true;
      } else if (item.typeTag === 'command_post') {
        // 堅固防衛坑道指揮所
        targetIsland.installations.push({
          id: instId,
          type: 'command_post',
          name: `地下坑道指揮所 (${targetIsland.name})`,
          weaponDesc: '深層防空花崗岩掩體 · 守備組織度抵抗 +50% · 擴展雷達視野 1000m',
          side: 'player',
          pos: instPos,
          health: 3600,
          maxHealth: 3600,
          armor: 0.55,
          angle: instAngle,
          range: 1000,
          reloadTime: 2.0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'ammo_depot') {
        // 重型戰備油彈庫
        targetIsland.installations.push({
          id: instId,
          type: 'ammo_depot',
          name: `重型戰備油彈庫 (${targetIsland.name})`,
          weaponDesc: '儲備巨型航空航彈與火箭 · 重砲裝填加速 35% · 砲擊冷卻縮短',
          side: 'player',
          pos: instPos,
          health: 2600,
          maxHealth: 2600,
          armor: 0.45,
          angle: instAngle,
          range: 0,
          reloadTime: 0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'battalion_cp') {
        // 營級前進作戰指揮所 (Battalion CP)
        targetIsland.installations.push({
          id: instId,
          type: 'battalion_cp',
          name: `營前進作戰指揮所 (${targetIsland.name})`,
          weaponDesc: '營級前進戰術指揮所 · 專屬解鎖地面部隊呼叫支援 · 新增援陸軍單位在此就地集結出生',
          side: 'player',
          pos: instPos,
          health: 3800,
          maxHealth: 3800,
          armor: 0.50,
          angle: instAngle,
          range: 1200,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'sam_hawk') {
        // MIM-23 霍克防空飛彈陣地
        targetIsland.installations.push({
          id: instId,
          type: 'flak_battery',
          name: `MIM-23 霍克防空飛彈連 (${targetIsland.name})`,
          weaponDesc: '半主動雷達導引防空飛彈 · 射程 1800m · 攔截高空高速噴射機與巡航飛彈',
          side: 'player',
          pos: instPos,
          health: 1800,
          maxHealth: 1800,
          armor: 0.45,
          angle: instAngle,
          range: 1800,
          reloadTime: 2.2,
          cooldown: 0,
          isDestroyed: false,
        });
      } else if (item.typeTag === 'fob') {
        // 前進作戰基地 (FOB)
        targetIsland.installations.push({
          id: instId,
          type: 'command_post',
          name: `前進作戰基地 FOB (${targetIsland.name})`,
          weaponDesc: '直升機停機坪與全天候作戰指揮中心 · 支援垂直包圍部隊登陸集結 · 擴展雷達視野 1600m',
          side: 'player',
          pos: instPos,
          health: 4500,
          maxHealth: 4500,
          armor: 0.60,
          angle: instAngle,
          range: 1600,
          reloadTime: 1.0,
          cooldown: 0,
          isDestroyed: false,
        });
      }

      this.islandsVersion++;

      // Spawn tactical construction sparkles & ring effect
      for (let i = 0; i < 22; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pSpd = 35 + Math.random() * 80;
        this.particles.push({
          id: `inst-p-${Date.now()}-${i}`,
          x: instPos.x,
          y: instPos.y,
          vx: Math.cos(pAngle) * pSpd,
          vy: Math.sin(pAngle) * pSpd,
          life: 1.0,
          maxLife: 1.0,
          color: '#00E5FF',
          radius: 2.5 + Math.random() * 2.5,
          type: 'spark',
        });
      }

      const locationLabel = customPos ? '指定海圖座標' : targetIsland.name;
      this.addBannerAlert(`🏗️【碼頭/設施落成】已在 ${locationLabel} 構築「${item.nameZh}」！`, 'player', 'capture', 4.5);
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: '海軍工兵團 (Seabees)',
        targetName: item.nameZh,
        actionType: 'recon_spotted',
        text: `🏗️【設施工事落成】${freeSandbox ? '【免CP沙盒建造】' : `耗費 ${item.cost} CP`}！「${item.nameZh}」已在 ${targetIsland.name} (${locationLabel}) 構築完成並即刻投入戰備！`,
      });
      return true;
    }

    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 時代三特殊機制 (Era 3 AEW & SAR Life Raft Mechanics)
  // ══════════════════════════════════════════════════════════

  public orderRescueRaft(raftId: string) {
    const raft = this.lifeRafts.find((r) => r.id === raftId && !r.rescued);
    if (!raft) return;

    let heli = this.aircraft.find(
      (a) => a.side === 'player' && (a.model === 'ho3s1' || a.role === 'rescue') && a.state !== 'shot_down'
    );

    if (!heli) {
      const flagship = this.getFlagship();
      if (flagship?.carrierPlanes?.ready?.ho3s1 && flagship.carrierPlanes.ready.ho3s1 > 0) {
        this.launchAircraft('ho3s1', 1);
        heli = this.aircraft.find(
          (a) => a.side === 'player' && a.model === 'ho3s1' && a.state !== 'shot_down'
        );
      }
    }

    if (heli) {
      heli.order = { type: 'move', targetPos: { ...raft.pos } };
      heli.targetPos = { ...raft.pos };
      this.selectUnits([heli.id]);
      this.addBannerAlert(
        `🚁【直升機搜救打撈】HO3S-1 全速飛往跳傘飛行員救生筏 [${Math.round(raft.pos.x)}, ${Math.round(raft.pos.y)}] 展開吊掛打撈！`,
        'player',
        'alert',
        5.0
      );
    } else {
      this.addBannerAlert(
        `⚠️ 無在空或待命之 HO3S-1 搜救直升機！請在航母整備出擊 HO3S-1！`,
        'player',
        'alert',
        4.0
      );
    }
  }

  private updateEra3Mechanics(dt: number) {
    // 1. AD-3W 全域空中預警系統 (AEW Early Warning 6500m & GCI)
    const activeAEW = this.aircraft.find(
      (a) => a.side === 'player' && (a.model === 'ad3w' || a.role === 'aew') && a.state !== 'shot_down' && a.state !== 'landing'
    );

    this.hasAD3WOnStation = !!activeAEW;

    if (activeAEW) {
      // 擴大破霧鎖定半徑 (6,500m)
      const aewRange = 6500;
      for (const eShip of this.enemyShips) {
        if (!eShip.isSunk && dist(activeAEW.pos, eShip.pos) < aewRange) {
          eShip.isSpotted = true;
        }
      }
    }

    // 2. HO3S-1 自動索尋救生筏任務分配 (僅搜救我方救生筏)
    const idleHelis = this.aircraft.filter(
      (a) =>
        a.side === 'player' &&
        (a.model === 'ho3s1' || a.role === 'rescue') &&
        a.state !== 'shot_down' &&
        (a.order.type === 'idle' || a.order.type === 'patrol')
    );

    for (const heli of idleHelis) {
      const targetRaft = this.lifeRafts.find((r) => !r.rescued && r.side === 'player');
      if (targetRaft) {
        heli.order = { type: 'move', targetPos: { ...targetRaft.pos } };
        heli.targetPos = { ...targetRaft.pos };
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代四 (1965-1973) 飛彈防禦與垂直機動作戰核心機制 (Era 4 Mechanics)
  // 1. E-1 艦載預警機 7500m 破霧雷達監控
  // 2. 艦隊自動防空飛彈系統 (Terrier / Tartar / Sea Sparrow) 截擊敵機與來襲反艦飛彈
  // 3. 敵蚊子級飛彈快艇 (Komar PTG) 發射 P-15 冥河反艦飛彈
  // 4. 敵軍 SA-2 防空飛彈陣地在 Fan Song 雷達導引下鎖定我方戰機
  // 5. 搜救直升機 (UH-2 / UH-1) 自動打撈落水飛行員
  // ══════════════════════════════════════════════════════════
  private updateEra4Mechanics(dt: number) {
    if (this.era !== 'era4') return;

    // 1. E-1 Tracer 全域長程空中預警系統 (AEW 7500m & 破霧鎖定)
    const activeE1 = this.aircraft.find(
      (a) => a.side === 'player' && (a.model === 'e1' || a.role === 'aew') && a.state !== 'shot_down' && a.state !== 'landing'
    );
    if (activeE1) {
      const aewRange = 7500;
      for (const eShip of this.enemyShips) {
        if (!eShip.isSunk && dist(activeE1.pos, eShip.pos) < aewRange) {
          eShip.isSpotted = true;
        }
      }
    }

    // 2. 自動指派 UH-2 / UH-1 搜救直升機前往我方落難救生筏
    const idleRescueHelis = this.aircraft.filter(
      (a) =>
        a.side === 'player' &&
        (a.model === 'uh2' || a.model === 'uh1' || a.role === 'rescue') &&
        a.state !== 'shot_down' &&
        (a.order.type === 'idle' || a.order.type === 'patrol')
    );
    for (const heli of idleRescueHelis) {
      const targetRaft = this.lifeRafts.find((r) => !r.rescued && r.side === 'player');
      if (targetRaft) {
        heli.order = { type: 'move', targetPos: { ...targetRaft.pos } };
        heli.targetPos = { ...targetRaft.pos };
      }
    }

    // 3. 艦載防空飛彈系統 (Ship SAM Defenses: Terrier / Tartar / Sea Sparrow)
    // 自動攔截來襲反艦飛彈 (P-15 Styx) 或進入射程之敵機
    for (const ship of this.playerShips) {
      if (ship.isSunk || !ship.hasSAM) continue;

      if (ship.samCooldown !== undefined && ship.samCooldown > 0) {
        ship.samCooldown = Math.max(0, ship.samCooldown - dt);
      }

      if ((ship.samCooldown || 0) <= 0) {
        const samRange = ship.samRange || 1800;

        // A. 優先攔截極具威脅的來襲反艦飛彈 (Anti-Missile Interception)
        const incomingAshm = this.projectiles.find(
          (p) =>
            !p.isDead &&
            p.side === 'enemy' &&
            p.type === 'missile_ashm' &&
            dist(ship.pos, p.pos) <= samRange
        );

        if (incomingAshm) {
          this.fireSAM(ship, incomingAshm, 'projectile');
          ship.samCooldown = ship.type === 'cg' ? 3.5 : 4.5;
          continue;
        }

        // B. 攔截射程內敵機 (MiG-17, MiG-21, IL-28)
        const hostileAircraft = this.aircraft.find(
          (a) =>
            a.side === 'enemy' &&
            a.state !== 'shot_down' &&
            dist(ship.pos, a.pos) <= samRange
        );

        if (hostileAircraft) {
          this.fireSAM(ship, hostileAircraft, 'aircraft');
          ship.samCooldown = ship.type === 'cg' ? 4.0 : 5.0;
        }
      }

      // 3b. 艦載 ASROC 反潛火箭助推魚雷發射系統 (Automatic Sonar Launch with Manual Target Override)
      if (ship.hasASROC) {
        if (ship.asrocCooldown !== undefined && ship.asrocCooldown > 0) {
          ship.asrocCooldown = Math.max(0, ship.asrocCooldown - dt);
        }

        if ((ship.asrocCooldown || 0) <= 0 && (ship.readyASROC ?? 8) > 0) {
          const asrocRange = ship.asrocRange || 2400;
          const targetSub = this.enemyShips.find(
            (s) => !s.isSunk && s.type === 'submarine' && dist(ship.pos, s.pos) <= asrocRange
          );
          if (targetSub) {
            this.fireASROC(ship, targetSub.pos, targetSub.id);
            ship.asrocCooldown = 18.0;
            ship.readyASROC = Math.max(0, (ship.readyASROC ?? 8) - 1);
          }
        }
      }

      // 3c. 艦側 Mk 32 SVTT 三聯裝魚雷發射管 (SVTT Triple Torpedo Tubes for close ASW)
      if (ship.hasSVTT) {
        if (ship.svttCooldown !== undefined && ship.svttCooldown > 0) {
          ship.svttCooldown = Math.max(0, ship.svttCooldown - dt);
        }
        if ((ship.svttCooldown || 0) <= 0) {
          const targetSubClose = this.enemyShips.find(
            (s) => !s.isSunk && s.type === 'submarine' && dist(ship.pos, s.pos) <= 1000
          );
          if (targetSubClose) {
            this.fireSVTT(ship, targetSubClose.pos);
            ship.svttCooldown = 28.0;
          }
        }
      }
    }

    // 4. 敵蚊子級飛彈快艇 (Komar PTG) 發射 P-15 冥河 (Styx) 反艦飛彈
    for (const eShip of this.enemyShips) {
      if (eShip.isSunk || eShip.type !== 'komar_ptg') continue;

      if (eShip.torpedoCooldown !== undefined && eShip.torpedoCooldown > 0) {
        eShip.torpedoCooldown = Math.max(0, eShip.torpedoCooldown - dt);
      }

      if ((eShip.torpedoCooldown || 0) <= 0) {
        const targetShip = this.playerShips.find(
          (s) =>
            !s.isSunk &&
            (s.type === 'cv63' || s.type === 'cg' || s.type === 'ddg' || s.type === 'carrier' || s.type === 'lph') &&
            dist(eShip.pos, s.pos) <= 2600
        ) || this.getFlagship();

        if (targetShip && dist(eShip.pos, targetShip.pos) <= 2600) {
          this.fireKomarStyx(eShip, targetShip);
          eShip.torpedoCooldown = 22.0;
        }
      }
    }

    // 4b. OPFOR 飛彈快艇狼群突擊 (Komar PTG Wolfpack Raids every 90-110s)
    this.komarRaidTimer = (this.komarRaidTimer || 95) - dt;
    if (this.komarRaidTimer <= 0) {
      this.komarRaidTimer = 95 + Math.random() * 25;
      this.spawnKomarMissileRaid();
    }

    // 5. 敵軍 SA-2 (Guideline) 地對空飛彈陣地防空攔截
    const fanSongAlive = this.islands.some((isl) =>
      isl.installations.some(
        (inst) => (inst.type === 'fan_song_radar' || inst.type === 'radar_station') && !inst.isDestroyed && inst.side === 'enemy'
      )
    );

    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed || inst.side !== 'enemy' || inst.type !== 'sa2_sam_site') continue;

        inst.cooldown = Math.max(0, inst.cooldown - dt);

        if (inst.cooldown <= 0) {
          const samRange = inst.range || 3200;
          const targetPlane = this.aircraft.find(
            (a) =>
              a.side === 'player' &&
              a.state !== 'shot_down' &&
              dist(inst.pos, a.pos) <= samRange
          );

          if (targetPlane) {
            const canFire = fanSongAlive || Math.random() < 0.35;
            if (canFire) {
              this.fireSA2Missile(inst, targetPlane, fanSongAlive);
              inst.cooldown = fanSongAlive ? inst.reloadTime || 12 : (inst.reloadTime || 12) * 2;
            }
          }
        }
      }
    }

    // 6. 友軍 MIM-23 鷹式 (Hawk) 地對空防空飛彈發射連防空自動截擊
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed || inst.side !== 'player' || inst.type !== 'sam_hawk') continue;

        inst.cooldown = Math.max(0, inst.cooldown - dt);

        if (inst.cooldown <= 0 && (inst.samMissilesReady ?? 12) > 0) {
          const samRange = inst.range || 2600;
          const targetPlane = this.aircraft.find(
            (a) =>
              a.side === 'enemy' &&
              a.state !== 'shot_down' &&
              dist(inst.pos, a.pos) <= samRange
          );

          if (targetPlane) {
            this.fireHawkSAM(inst, targetPlane);
            inst.cooldown = inst.reloadTime || 3.5;
            inst.samMissilesReady = (inst.samMissilesReady ?? 12) - 1;
          }
        }
      }
    }

    // 6b. 美陸軍 MIM-72 榭樹 (Chaparral) 履帶防空飛彈車自動攔截
    for (const gUnit of this.groundUnits) {
      if (gUnit.isDestroyed || gUnit.side !== 'player' || gUnit.type !== 'us_army_chaparral_sam') continue;
      gUnit.cooldown = Math.max(0, gUnit.cooldown - dt);
      if (gUnit.cooldown <= 0) {
        const targetPlane = this.aircraft.find(
          (a) => a.side === 'enemy' && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= 2000
        );
        if (targetPlane) {
          this.fireChaparralSAM(gUnit, targetPlane);
          gUnit.cooldown = 5.0;
        }
      }
    }

    // 6c. 大陸戰線前線據點動態爭奪與佔領 (Dynamic Frontline Push with Captureable Neutral & Hostile Bases)
    this.updateMainlandInstallationCapture(dt);

    // 7. OPFOR 蘇製戰術核武器絕望核反擊檢定 (OPFOR Desperate Nuclear Retaliation)
    if (!this.hasOpforRetaliatedNuke) {
      this.opforNukeCheckTimer = (this.opforNukeCheckTimer || 0) + dt;
      if (this.opforNukeCheckTimer >= 3.0) {
        this.opforNukeCheckTimer = 0;
        this.checkOpforNuclearRetaliation();
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // OPFOR 蘇製戰術核武器絕望核反擊檢定 (OPFOR Desperate Nuclear Retaliation)
  // 原型: 北越+蘇聯軍事顧問團
  // 觸發條件:
  // 1. 玩家先動用核武器 (hasPlayerUsedNuke === true)
  // 2. 敵方主島 HQ 指揮所遭遇毀滅性生存威脅 (HQ 生命值 < 25%)
  // 3. 玩家閃擊突破過快 (戰鬥 < 180s 且已奪下 >= 2 個要塞據點)
  // 4. 戰局陷入過久血腥僵局 (戰鬥 > 18 分鐘 / 1080s 仍未分勝負)
  // ══════════════════════════════════════════════════════════
  public checkOpforNuclearRetaliation() {
    if (this.era !== 'era4' || this.hasOpforRetaliatedNuke) return;

    // Check enemy mainland HQ
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    const enemyHQ = mainland?.installations.find((i) => i.id === 'enemy-hq' && !i.isDestroyed);
    const hqThreatened = enemyHQ ? (enemyHQ.health < enemyHQ.maxHealth * 0.25) : false;

    // Check captured strongholds on mainland
    const mainlandStrongholds = mainland?.strongholds || [];
    const capturedShCount = mainlandStrongholds.filter((s) => s.isCaptured).length;
    const blitzTrigger = this.gameTime < 180 && capturedShCount >= 2;

    // Check prolonged stalemate
    const stalemateTrigger = this.gameTime > 1080;

    // Player first-use trigger
    const playerNukeTrigger = this.hasPlayerUsedNuke;

    if (!playerNukeTrigger && !hqThreatened && !blitzTrigger && !stalemateTrigger) {
      return;
    }

    this.hasOpforRetaliatedNuke = true;
    soundEngine.playKlaxon();
    soundEngine.playKamikazeSiren();

    const triggerReason = playerNukeTrigger
      ? '美軍動用核武器，蘇聯軍事顧問團下達戰術核反擊指令！'
      : hqThreatened
      ? '最高統帥部掩體即將陷落，防區司令部啟動玉石俱焚之絕望核突擊！'
      : blitzTrigger
      ? '前線防禦體系遭美軍極速突破，前線陷入崩潰，動用極限核手段遏制！'
      : '戰事陷入 18 分鐘血腥消耗僵局，敵軍決定投擲戰術核武扭轉戰局！';

    this.addBannerAlert(
      `🚨☢️【極度危險！OPFOR 蘇製戰術核突擊！】${triggerReason}`,
      'enemy',
      'sunk',
      9.0
    );

    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: 'OPFOR 聯合特種核打擊分隊',
      targetName: '美國海軍特遣艦隊',
      actionType: 'recon_spotted',
      isCrit: true,
      text: `🚨☢️【戰術核突擊警報】${triggerReason} 敵方 1 架改裝 Il-28 獵犬噴射轟炸機掛載 RDS-4 戰術核航彈在 2 架 MiG-21 護航下全速撲向艦隊！請立即動用防空飛彈 (RIM-2/24/7/Hawk) 或空優戰機全力攔截！`,
    });

    // Spawn Nuclear-armed IL-28 Beagle
    const flagship = this.getFlagship();
    const spawnPos: Vector2D = { x: 10500, y: 1600 };
    const targetPos: Vector2D = flagship ? { ...flagship.pos } : { x: 3000, y: 8000 };
    const heading = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);

    const nukePlaneId = `enemy-nuke-il28-${Date.now()}`;
    this.aircraft.push({
      id: nukePlaneId,
      squadronId: `sq-opfor-nuke-${Date.now()}`,
      model: 'il28',
      role: 'level_bomber',
      name: 'OPFOR 絕望核突擊 · Il-28 獵犬轟炸機 (掛載戰術核彈)',
      side: 'enemy',
      pos: { ...spawnPos },
      vel: { x: Math.cos(heading) * 140, y: Math.sin(heading) * 140 },
      heading,
      targetHeading: heading,
      speed: 140,
      maxSpeed: 140,
      altitude: 0.92,
      state: 'cruising',
      health: 1200,
      maxHealth: 1200,
      order: { type: 'attack', targetPos },
      hasPayload: true,
      payloadType: 'opfor_tactical_nuke',
      payloadName: 'RDS-4 戰術原子彈 (核威脅)',
      shootCooldown: 0,
      gunAmmo: 600,
      maxGunAmmo: 600,
      wingmanOffset: { x: 0, y: 0 },
      flightName: 'OPFOR 特種核突擊長機',
    });

    // Spawn 2x MiG-21 Escorts
    for (let e = 0; e < 2; e++) {
      const eOffset = (e === 0 ? -1 : 1) * 35;
      const ePos = {
        x: spawnPos.x + Math.cos(heading + Math.PI / 2) * eOffset,
        y: spawnPos.y + Math.sin(heading + Math.PI / 2) * eOffset,
      };
      this.aircraft.push({
        id: `enemy-escort-mig21-${Date.now()}-${e}`,
        squadronId: `sq-opfor-nuke-${Date.now()}`,
        model: 'mig21',
        role: 'fighter',
        name: `OPFOR 核武護航機 · MiG-21 魚窩 (#${e + 1})`,
        side: 'enemy',
        pos: ePos,
        vel: { x: Math.cos(heading) * 165, y: Math.sin(heading) * 165 },
        heading,
        targetHeading: heading,
        speed: 165,
        maxSpeed: 165,
        altitude: 0.90,
        state: 'cruising',
        health: 550,
        maxHealth: 550,
        order: { type: 'attack', targetPos },
        hasPayload: true,
        payloadType: 'aim9_sidewinder',
        payloadName: 'K-13 環礁空空飛彈 (紅外格鬥)',
        shootCooldown: 0,
        gunAmmo: 300,
        maxGunAmmo: 300,
        wingmanOffset: { x: eOffset, y: 15 },
        flightName: 'MiG-21 護航截擊雙機',
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代四飛彈發射與作戰執行方法 (Era 4 Missile & Assault Methods)
  // ══════════════════════════════════════════════════════════
  public fireASROC(ship: Ship, targetPos: Vector2D, targetEntityId?: string) {
    soundEngine.playRocketIgnition();
    const d = dist(ship.pos, targetPos);
    const angle = Math.atan2(targetPos.y - ship.pos.y, targetPos.x - ship.pos.x);
    const speed = 480;

    this.projectiles.push({
      id: `asroc-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: ship.side,
      pos: { ...ship.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...ship.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d,
      distanceTraveled: 0,
      damage: 680,
      blastRadius: 32,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId,
      targetEntityType: 'ship',
      isASROC: true,
      asrocStage: 'boost',
      asrocTimer: 0,
      attackerName: `${ship.name} (RUR-5 ASROC 反潛火箭)`,
    });

    this.addBannerAlert(`🚀🌊【ASROC 反潛火箭發射！】「${ship.name}」8聯裝箱型發射架發射 ASROC 獵殺水下潛艦！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: ship.name,
      targetName: '水下目標',
      actionType: 'recon_spotted',
      text: `🚀🌊【ASROC 反潛火箭發射】「${ship.name}」聲納鎖定敵水下音源，8聯裝發射架火箭助推 Mk 46 魚雷騰空飛向目標海域！`,
    });
  }

  public fireSVTT(ship: Ship, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const count = 3;
    const baseAngle = Math.atan2(targetPos.y - ship.pos.y, targetPos.x - ship.pos.x);
    for (let i = 0; i < count; i++) {
      const spreadAngle = baseAngle + (i - 1) * 0.12;
      const speed = 105;
      this.projectiles.push({
        id: `svtt-${Date.now()}-${i}`,
        type: 'torpedo',
        side: ship.side,
        pos: { x: ship.pos.x, y: ship.pos.y },
        vel: { x: Math.cos(spreadAngle) * speed, y: Math.sin(spreadAngle) * speed },
        originPos: { ...ship.pos },
        targetPos: { x: ship.pos.x + Math.cos(spreadAngle) * 1400, y: ship.pos.y + Math.sin(spreadAngle) * 1400 },
        flightProgress: 0,
        maxDistance: 1400,
        distanceTraveled: 0,
        damage: 580,
        blastRadius: 28,
        speed,
        heading: spreadAngle,
        isDead: false,
        trail: [],
        isAcousticHoming: true,
        turnRate: 3.5,
        attackerName: `${ship.name} (Mk 32 SVTT 艦側魚雷)`,
      });
    }
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: ship.name,
      targetName: '水下潛艦方位',
      actionType: 'torpedo_hit',
      text: `🌊【Mk 32 SVTT 艦側三聯裝魚雷發射】「${ship.name}」高壓空氣彈射 3 枚 Mk 46 聲自導反潛魚雷入水！`,
    });
  }

  public fireChaparralSAM(unit: GroundUnit, targetPlane: Aircraft) {
    soundEngine.playRocketWhoosh();
    const d = dist(unit.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - unit.pos.y, targetPlane.pos.x - unit.pos.x);
    const speed = 580;
    this.projectiles.push({
      id: `chaparral-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'player',
      pos: { ...unit.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...unit.pos },
      targetPos: { ...targetPlane.pos },
      flightProgress: 0,
      maxDistance: d + 400,
      distanceTraveled: 0,
      damage: 650,
      blastRadius: 30,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetPlane.id,
      targetEntityType: 'aircraft',
      guidanceType: 'infrared',
      turnRate: 4.8,
      attackerName: `${unit.name} (MIM-72 榭樹防空飛彈)`,
    });
    this.addCombatLog({
      category: 'aa',
      sourceSide: 'player',
      sourceName: unit.name,
      targetName: targetPlane.name,
      actionType: 'recon_spotted',
      text: `🚀【MIM-72 榭樹防空飛彈點火】「${unit.name}」紅外尋標頭鎖定敵機「${targetPlane.name.split(' ')[0]}」，四聯裝發射架火箭呼嘯升空！`,
    });
  }

  public spawnKomarMissileRaid() {
    const boatCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 Komar PTGs
    const spawnBaseX = 3400 + Math.random() * 800;
    const spawnBaseY = 1400 + Math.random() * 400;
    const heading = Math.PI * 0.45; // Heading southeast toward player fleet
    const flagship = this.getFlagship();
    const targetPos = flagship ? { ...flagship.pos } : { x: 3000, y: 8000 };

    for (let k = 0; k < boatCount; k++) {
      const bPos = {
        x: spawnBaseX + (k - (boatCount - 1) / 2) * 90,
        y: spawnBaseY + (k - (boatCount - 1) / 2) * 50,
      };
      const boat = createKomarMissileBoat(`komar-raid-${Date.now()}-${k}`, `OPFOR 蚊子級快艇 (狼群突擊 #${k + 1})`, bPos);
      boat.heading = heading;
      boat.order = { type: 'move', targetPos };
      this.enemyShips.push(boat);
    }

    soundEngine.playKlaxon();
    this.addBannerAlert(
      `🚨【敵飛彈快艇狼群突擊！】偵測到 OPFOR ${boatCount}艘蚊子級 (Komar) 飛彈艇高速長驅奔襲！配備 P-15 冥河反艦飛彈，藍軍請搶在發射前將其擊沉或準備 SAM 攔截！`,
      'enemy',
      'alert',
      7.0
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: 'OPFOR 海軍狼群突擊大隊',
      targetName: '美國海軍特遣艦隊',
      actionType: 'recon_spotted',
      isCrit: true,
      text: `🚨【飛彈快艇狼群突襲】西北海域偵測到敵方 ${boatCount}艘 Komar 蚊子級飛彈艇以 42 節極速南下！每艘搭載 2 枚重裝藥 P-15 冥河飛彈！若不及時擊沉，將對航母與護航艦發動致命飛彈飽和打擊！`,
    });
  }

  public updateMainlandInstallationCapture(dt: number) {
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    if (!mainland) return;

    for (const inst of mainland.installations) {
      if (inst.isDestroyed) continue;
      const nearbyFriendly = this.groundUnits.filter(
        (u) => !u.isDestroyed && !u.embarkedInShipId && u.side === 'player' && dist(u.pos, inst.pos) <= 120
      );
      const nearbyHostile = this.groundUnits.filter(
        (u) => !u.isDestroyed && !u.embarkedInShipId && u.side === 'enemy' && dist(u.pos, inst.pos) <= 120
      );

      if (nearbyFriendly.length > 0 && nearbyHostile.length === 0) {
        if (inst.side !== 'player') {
          inst.captureProgress = (inst.captureProgress || 0) + 12 * dt;
          if (inst.captureProgress >= 100) {
            inst.side = 'player';
            inst.captureProgress = 0;
            const rewardCP = 80;
            this.resourcePoints += rewardCP;
            this.totalCpEarned += rewardCP;
            soundEngine.playPlaneSortie();
            this.addBannerAlert(`🚩【戰線據點佔領】成功控制大陸設施「${inst.name}」！獲得戰利 +${rewardCP} CP！`, 'player', 'capture', 5.0);
            this.addCombatLog({
              category: 'sunk',
              sourceSide: 'player',
              sourceName: nearbyFriendly[0].name,
              targetName: inst.name,
              actionType: 'installation_down',
              text: `🚩【大陸設施控制】友軍地面部隊成功奪取並控制戰略設施「${inst.name}」！繳獲戰地物資 +${rewardCP} CP！`,
            });
          }
        }
      } else if (nearbyHostile.length > 0 && nearbyFriendly.length === 0) {
        if (inst.side !== 'enemy') {
          inst.captureProgress = (inst.captureProgress || 0) + 10 * dt;
          if (inst.captureProgress >= 100) {
            inst.side = 'enemy';
            inst.captureProgress = 0;
            this.addBannerAlert(`⚠️【前線設施失守】敵軍佔領了「${inst.name}」！`, 'enemy', 'sunk', 5.0);
          }
        }
      } else {
        if (inst.captureProgress && inst.captureProgress > 0) {
          inst.captureProgress = Math.max(0, inst.captureProgress - 4 * dt);
        }
      }
    }
  }

  private fireSAM(ship: Ship, target: Aircraft | Projectile, targetType: 'aircraft' | 'projectile') {
    soundEngine.playRocketWhoosh();
    const samModel =
      ship.type === 'cg'
        ? 'RIM-2 梗犬 (Terrier)'
        : ship.type === 'ddg'
        ? 'RIM-24 韃靼人 (Tartar)'
        : 'RIM-7 海麻雀 (Sea Sparrow)';

    const d = dist(ship.pos, target.pos);
    const launchAngle = Math.atan2(target.pos.y - ship.pos.y, target.pos.x - ship.pos.x);
    const speed = 640;

    this.particles.push({
      id: `sam-flash-${Date.now()}`,
      x: ship.pos.x,
      y: ship.pos.y,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.5,
      radius: 20,
      color: '#FF6D00',
      type: 'shockwave',
      shape: 'ring',
    });

    const isAntiMissile = targetType === 'projectile';
    const targetName = isAntiMissile ? '來襲 P-15 冥河反艦飛彈' : (target as Aircraft).name;

    this.projectiles.push({
      id: `sam-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'player',
      pos: { ...ship.pos },
      vel: { x: Math.cos(launchAngle) * speed, y: Math.sin(launchAngle) * speed },
      originPos: { ...ship.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 500,
      distanceTraveled: 0,
      damage: 750,
      blastRadius: 36,
      speed,
      heading: launchAngle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: targetType,
      guidanceType: 'semi_active_radar',
      turnRate: 4.5,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${ship.name} (${samModel})`,
    });

    if (isAntiMissile) {
      this.addBannerAlert(`🚀【防空飛彈緊急攔截！】「${ship.name}」雙臂發射架發射 ${samModel} 攔截來襲冥河飛彈！`, 'player', 'alert', 5.0);
    }
    this.addCombatLog({
      category: 'aa',
      sourceSide: 'player',
      sourceName: `${ship.name} (${samModel})`,
      targetName,
      actionType: 'recon_spotted',
      text: `🚀【防空飛彈點火升空】「${ship.name}」射控雷達導引發射 ${samModel} 導向飛彈！極速 ${speed} 呼嘯撲向 ${targetName}！`,
    });
  }

  private fireSA2Missile(inst: Installation, targetPlane: Aircraft, radarAssisted: boolean) {
    soundEngine.playRocketIgnition();
    const d = dist(inst.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - inst.pos.y, targetPlane.pos.x - inst.pos.x);
    const speed = 590;

    this.projectiles.push({
      id: `sa2-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...inst.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...inst.pos },
      targetPos: { ...targetPlane.pos },
      flightProgress: 0,
      maxDistance: d + 600,
      distanceTraveled: 0,
      damage: 850,
      blastRadius: 45,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetPlane.id,
      targetEntityType: 'aircraft',
      guidanceType: 'command_radar',
      turnRate: radarAssisted ? 3.8 : 1.4,
      attackerName: `${inst.name} (V-750 SA-2 Guideline)`,
    });

    soundEngine.playKlaxon();
    this.addBannerAlert(`🚨【SAM 飛彈警報！】敵「${inst.name}」發射 SA-2 導向飛彈鎖定「${targetPlane.name.split(' ')[0]}」！`, 'enemy', 'alert', 5.5);
    this.addCombatLog({
      category: 'aa',
      sourceSide: 'enemy',
      sourceName: inst.name,
      targetName: targetPlane.name,
      actionType: 'recon_spotted',
      text: `🚨【SAM 防空飛彈來襲！】敵「${inst.name}」陣地發射 V-750 (SA-2 Guideline) 大型地空飛彈！${radarAssisted ? 'Fan Song 雷達全程波束導引！' : '雷達站遭毀，改採備用被動追蹤！'}`,
    });
  }

  private fireHawkSAM(inst: Installation, targetPlane: Aircraft) {
    soundEngine.playRocketIgnition();
    const d = dist(inst.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - inst.pos.y, targetPlane.pos.x - inst.pos.x);
    const speed = 620;

    this.projectiles.push({
      id: `hawk-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'player',
      pos: { ...inst.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...inst.pos },
      targetPos: { ...targetPlane.pos },
      flightProgress: 0,
      maxDistance: d + 600,
      distanceTraveled: 0,
      damage: 800,
      blastRadius: 42,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetPlane.id,
      targetEntityType: 'aircraft',
      guidanceType: 'semi_active_radar',
      turnRate: 4.2,
      attackerName: `${inst.name} (MIM-23 Hawk)`,
    });

    this.addBannerAlert(`🚀【MIM-23 鷹式防空飛彈點火！】友軍「${inst.name}」發射鷹式飛彈攔截「${targetPlane.name.split(' ')[0]}」！`, 'player', 'alert', 5.0);
    this.addCombatLog({
      category: 'aa',
      sourceSide: 'player',
      sourceName: inst.name,
      targetName: targetPlane.name,
      actionType: 'recon_spotted',
      text: `🚀【Hawk 地空防空飛彈攔截】友軍「${inst.name}」連續波都卜勒雷達鎖定敵機，發射 MIM-23 鷹式防空飛彈高速獵殺！`,
    });
  }

  private fireKomarStyx(ship: Ship, targetShip: Ship) {
    soundEngine.playRocketIgnition();
    const d = dist(ship.pos, targetShip.pos);
    const angle = Math.atan2(targetShip.pos.y - ship.pos.y, targetShip.pos.x - ship.pos.x);
    const speed = 360;

    this.projectiles.push({
      id: `styx-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: 'enemy',
      pos: { ...ship.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...ship.pos },
      targetPos: { ...targetShip.pos },
      flightProgress: 0,
      maxDistance: d + 400,
      distanceTraveled: 0,
      damage: 1800,
      blastRadius: 65,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetShip.id,
      targetEntityType: 'ship',
      guidanceType: 'radar_homing',
      turnRate: 2.2,
      attackerName: `${ship.name} (P-15 冥河反艦飛彈)`,
    });

    soundEngine.playKlaxon();
    this.addBannerAlert(`🚨【AShM 反艦飛彈來襲！】敵飛彈艇「${ship.name}」發射 P-15 冥河飛彈撲向「${targetShip.name}」！SAM 立即攔截！`, 'enemy', 'alert', 6.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: ship.name,
      targetName: targetShip.name,
      actionType: 'recon_spotted',
      text: `🚨【反艦飛彈發射警報！】敵蚊子級飛彈快艇「${ship.name}」發射 P-15 冥河反艦飛彈！高爆裝藥513公斤，掠海直撲「${targetShip.name}」！`,
    });
  }

  private fireAAMissile(plane: Aircraft, target: Aircraft | Projectile, aamType: 'aim9' | 'aim7' | 'k13') {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, target.pos);
    const angle = Math.atan2(target.pos.y - plane.pos.y, target.pos.x - plane.pos.x);
    const speed = aamType === 'aim7' ? 620 : 560;
    const isAntiMissile = !('model' in target);
    const aamName =
      aamType === 'aim7' ? 'AIM-7 麻雀雷達空空飛彈' : aamType === 'aim9' ? 'AIM-9 響尾蛇紅外飛彈' : 'K-13 珊瑚空空飛彈';

    this.projectiles.push({
      id: `aam-${Date.now()}-${Math.random()}`,
      type: 'missile_aam',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 400,
      distanceTraveled: 0,
      damage: aamType === 'aim7' ? 550 : 450,
      blastRadius: 28,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: isAntiMissile ? 'projectile' : 'aircraft',
      guidanceType: aamType === 'aim7' ? 'semi_active_radar' : 'infrared',
      sarhIlluminatorId: aamType === 'aim7' ? plane.id : undefined,
      turnRate: aamType === 'aim9' ? 5.2 : 3.8,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${plane.name} (${aamName})`,
    });

    if (aamType === 'aim7') {
      plane.sarhIlluminatingTargetId = target.id;
      plane.sarhHoldTimer = 5.5;
    }

    const targetDesc = isAntiMissile ? '來襲反艦飛彈' : (target as Aircraft).name;
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: targetDesc,
      actionType: 'recon_spotted',
      text: `🚀【空對空飛彈發射】${plane.name} 發射 ${aamName}！鎖定 ${targetDesc} 尾部熱源/雷達回波展開追擊！`,
    });
  }

  private fireARMShrike(plane: Aircraft, targetInst: Installation) {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, targetInst.pos);
    const angle = Math.atan2(targetInst.pos.y - plane.pos.y, targetInst.pos.x - plane.pos.x);
    const speed = 640;

    this.projectiles.push({
      id: `shrike-${Date.now()}-${Math.random()}`,
      type: 'missile_arm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetInst.pos },
      flightProgress: 0,
      maxDistance: d + 300,
      distanceTraveled: 0,
      damage: 2500,
      blastRadius: 40,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetInst.id,
      targetEntityType: 'installation',
      guidanceType: 'anti_radiation',
      turnRate: 3.5,
      attackerName: `${plane.name} (AGM-45 百舌鳥反輻射飛彈)`,
    });

    this.addBannerAlert(`⚡【野鼬出擊！防空壓制】「${plane.name}」發射 AGM-45 百舌鳥反輻射飛彈，循敵「${targetInst.name}」雷達波束獵殺！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: targetInst.name,
      actionType: 'recon_spotted',
      text: `⚡【Wild Weasel SEAD 獵殺】${plane.name} 偵測到敵「${targetInst.name}」高頻追蹤雷達輻射，發射 AGM-45 Shrike 反輻射飛彈順波直攻雷達天線！`,
    });
  }

  private fireBullpupMissile(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, targetPos);
    const angle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const speed = 460;

    this.projectiles.push({
      id: `bullpup-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 150,
      distanceTraveled: 0,
      damage: 1600,
      blastRadius: 52,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      attackerName: `${plane.name} (AGM-12 鬥牛犬超音速空地飛彈)`,
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '目標陣地/艦艇',
      actionType: 'recon_spotted',
      text: `🚀【鬥牛犬飛彈發射】${plane.name} 於 2000m 距離發射 AGM-12 Bullpup 無線電導引飛彈，直撲目標重創工事！`,
    });
  }

  private dropWalleyeGlideBomb(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const d = dist(plane.pos, targetPos);
    const angle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const speed = 300;

    this.projectiles.push({
      id: `walleye-${Date.now()}-${Math.random()}`,
      type: 'bomb',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d,
      distanceTraveled: 0,
      damage: 1800,
      blastRadius: 55,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      attackerName: `${plane.name} (AGM-62 白眼電視導引滑翔炸彈)`,
      bombType: 'bomb_1000',
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '目標戰術核心',
      actionType: 'recon_spotted',
      text: `📺【白眼電視導引投放】${plane.name} 投放 AGM-62 Walleye 光電電視導引滑翔炸彈，自動鎖定光學反差核心，精準穿透！`,
    });
  }

  private dropSnakeyeBombs(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const count = 4;
    for (let i = 0; i < count; i++) {
      const offsetSide = (i % 2 === 0 ? 1 : -1) * (8 + i * 2);
      const startX = plane.pos.x + Math.sin(plane.heading) * offsetSide;
      const startY = plane.pos.y - Math.cos(plane.heading) * offsetSide;
      const bTarget = {
        x: targetPos.x + Math.cos(plane.heading) * (i * 20 - 30),
        y: targetPos.y + Math.sin(plane.heading) * (i * 20 - 30),
      };
      const bDist = Math.max(1, dist({ x: startX, y: startY }, bTarget));

      this.projectiles.push({
        id: `snakeye-${Date.now()}-${i}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { x: startX, y: startY },
        vel: { x: 0, y: 0 },
        originPos: { x: startX, y: startY },
        targetPos: bTarget,
        flightProgress: 0,
        maxDistance: bDist,
        distanceTraveled: 0,
        damage: 650,
        blastRadius: 36,
        speed: 240,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName: `${plane.name} (Mk 82 蛇眼減速炸彈)`,
        bombType: 'bomb_500',
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '敵灘頭陣地',
      actionType: 'bomb_hit',
      text: `💣【蛇眼減速航彈投擲】${plane.name} 超低空高速掠地投下 4 枚 Mk 82 Snakeye！減速十字尾翼張開，形成密集破片面狀壓制！`,
    });
  }

  private dropHeloAssaultTroops(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playPlaneSortie();
    for (let p = 0; p < 12; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 40;
      this.particles.push({
        id: `rotor-dust-${Date.now()}-${p}`,
        x: targetPos.x,
        y: targetPos.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.8,
        maxLife: 0.8,
        radius: 8 + Math.random() * 8,
        color: 'rgba(215, 204, 200, 0.7)',
        type: 'smoke',
      });
    }

    const assaultSquad = createGroundUnit(
      `usmc-assault-${Date.now()}`,
      'usmc_air_assault_65',
      'USMC 空中突擊步兵排 (垂直機降)',
      'player',
      'era4',
      { x: targetPos.x + (Math.random() - 0.5) * 30, y: targetPos.y + (Math.random() - 0.5) * 30 }
    );
    this.groundUnits.push(assaultSquad);

    this.addBannerAlert(`🚁【垂直機動空降成功！】「${plane.name}」完成機降！陸戰空中突擊排投入灘頭據點奪控！`, 'player', 'capture', 6.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: plane.name,
      targetName: '機降高地灘頭',
      actionType: 'recon_spotted',
      text: `🚁【垂直機動作戰 (Vertical Envelopment)】海軍陸戰隊直升機於指定座標懸停降落！突擊排官兵持 M16A1 與 M60 機槍展開戰術包圍！`,
    });
  }

  private dropParatroopers(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playPlaneSortie();
    for (let s = 0; s < 2; s++) {
      const dropPos = {
        x: targetPos.x + (s === 0 ? -35 : 35) + (Math.random() - 0.5) * 20,
        y: targetPos.y + (s === 0 ? -25 : 25) + (Math.random() - 0.5) * 20,
      };

      const paraSquad = createGroundUnit(
        `usmc-para-${Date.now()}-${s}`,
        'usmc_air_assault_65',
        `USMC 第1空降突擊分隊 (#${s + 1})`,
        'player',
        'era4',
        dropPos
      );
      this.groundUnits.push(paraSquad);

      this.particles.push({
        id: `para-drop-${Date.now()}-${s}`,
        x: dropPos.x,
        y: dropPos.y - 45,
        vx: 0,
        vy: 20,
        life: 1.5,
        maxLife: 1.5,
        radius: 12,
        color: '#E0F2F1',
        type: 'smoke',
      });
    }

    this.addBannerAlert(`🪂【C-1 傘降部隊空投完成！】運輸機投下 2 個陸戰傘降步兵排！迅速控制周邊戰略要地！`, 'player', 'capture', 6.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: plane.name,
      targetName: '空投戰區',
      actionType: 'recon_spotted',
      text: `🪂【空投部隊突擊】C-1 運輸機飛越目標空域投放 2 個空降突擊分隊！傘兵安全著陸，迅速奪取防區！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 飛行員搜救打撈與戰俘機制 (CSAR & POW Capture System)
  // 船隻與地面部隊物理接近落難飛行員均可打撈救起或俘虜為戰俘
  // 友軍獲救: 戰備庫存補回 1架戰機, +150分
  // 敵俘為戰俘: +100 CP, +100分
  // 友軍遭敵俘獲: -80 CP
  // ══════════════════════════════════════════════════════════
  private updateLifeRaftRescue(dt: number) {
    if (!this.lifeRafts || this.lifeRafts.length === 0) return;

    for (let i = this.lifeRafts.length - 1; i >= 0; i--) {
      const raft = this.lifeRafts[i];
      if (raft.rescued || raft.isCapturedPOW) continue;

      raft.timer -= dt;
      if (raft.timer <= 0) {
        this.addCombatLog({
          category: 'air',
          sourceSide: raft.side,
          sourceName: '搜救頻道 (SAR)',
          targetName: raft.pilotName,
          actionType: 'aa_down',
          text: raft.side === 'player'
            ? `🌊【搜救逾時】我方落難救生筏（${raft.planeName} - ${raft.pilotName}）逾時未獲救援，訊號消失...`
            : `🌊【敵飛行員失蹤】敵落難飛行員（${raft.pilotName}）救生信號中斷消失。`,
        });
        this.lifeRafts.splice(i, 1);
        continue;
      }

      // 檢查我方單位是否物理接近:
      // A. 水面艦船 (大型艦 < 120m, 巡邏艇/驅逐艦/登陸艇 < 85m)
      const nearPlayerShip = this.playerShips.find((s) => {
        if (s.isSunk) return false;
        const thresh = (s.type === 'carrier' || s.type === 'battleship' || s.type === 'cruiser') ? 120 : 85;
        return dist(s.pos, raft.pos) < thresh;
      });

      // B. 地面部隊 (步兵、裝甲、兩棲戰車、工兵 < 85m)
      const nearPlayerGround = this.groundUnits.find((u) => {
        if (u.isDestroyed || u.embarkedInShipId || u.side !== 'player') return false;
        return dist(u.pos, raft.pos) < 85;
      });

      // C. 搜救直升機 (HO3S-1 < 85m)
      const rescueHeli = this.aircraft.find(
        (a) =>
          a.side === 'player' &&
          (a.model === 'ho3s1' || a.role === 'rescue') &&
          a.state !== 'shot_down' &&
          dist(a.pos, raft.pos) < 85
      );

      // 檢查敵方單位是否物理接近:
      const nearEnemyShip = this.enemyShips.find((s) => !s.isSunk && dist(s.pos, raft.pos) < 95);
      const nearEnemyGround = this.groundUnits.find((u) => !u.isDestroyed && u.side === 'enemy' && dist(u.pos, raft.pos) < 85);

      // ══════════════════════════════════════════════════════════
      // 情況一: 我方單位率先物理接觸救生筏
      // ══════════════════════════════════════════════════════════
      const playerUnit = nearPlayerShip || nearPlayerGround || rescueHeli;
      if (playerUnit) {
        const rescuerName = (playerUnit as Ship).codeName || playerUnit.name;

        if (raft.side === 'player') {
          // 我方飛行員獲救！
          raft.rescued = true;
          soundEngine.playPlaneSortie();

          this.addBannerAlert(
            `🛟【飛行員打撈救援完成！】由「${rescuerName}」成功救起「${raft.pilotName}」！安全歸隊補回 1架「${raft.planeName.split(' ')[0]}」！`,
            'player',
            'capture',
            6.0
          );
          this.addCombatLog({
            category: 'air',
            sourceSide: 'player',
            sourceName: rescuerName,
            targetName: raft.planeName,
            actionType: 'recon_spotted',
            text: `🛟【飛行員搜救成功】「${rescuerName}」物理接近跳傘地點救起落難飛行員「${raft.pilotName}」！機組員安全返回作戰序列，戰備庫存立即復原 1架 ${raft.planeName}！★+1星，+150分！`,
          });

          // 復原 1 架戰機至旗艦機庫或基地庫存
          const flagship = this.getFlagship();
          if (flagship && flagship.carrierPlanes) {
            const m = raft.planeModel;
            flagship.carrierPlanes.ready[m] = (flagship.carrierPlanes.ready[m] || 0) + 1;
          } else if (this.airbasePlanes) {
            const m = raft.planeModel;
            this.airbasePlanes[m] = (this.airbasePlanes[m] || 0) + 1;
          }

          this.score.totalScore += 150;
          this.score.stars += 1;

          if (rescueHeli && flagship) {
            rescueHeli.order = { type: 'rtb' };
            rescueHeli.targetPos = { ...flagship.pos };
          }

          this.lifeRafts.splice(i, 1);
          continue;
        } else {
          // 敵方飛行員被我方捕獲為戰俘 (POW)！獎勵 100 CP
          raft.isCapturedPOW = true;
          soundEngine.playPlaneSortie();

          const cpReward = 100;
          this.resourcePoints += cpReward;
          this.totalCpEarned += cpReward;
          this.score.totalScore += 100;
          this.score.stars += 1;

          this.addBannerAlert(
            `🎖️【俘獲敵方飛行員戰俘！】「${rescuerName}」成功捕獲「${raft.pilotName}」為 POW！獲取戰術情資 +100 CP！`,
            'player',
            'capture',
            6.5
          );
          this.addCombatLog({
            category: 'air',
            sourceSide: 'player',
            sourceName: rescuerName,
            targetName: raft.pilotName,
            actionType: 'recon_spotted',
            text: `🎖️【戰俘捕獲 (POW)】我軍「${rescuerName}」在現場俘虜敵機組員「${raft.pilotName}」！審訊情資提供重要戰術與密碼價值，獲頒 +100 CP！`,
          });

          this.lifeRafts.splice(i, 1);
          continue;
        }
      }

      // ══════════════════════════════════════════════════════════
      // 情況二: 敵方單位率先物理接觸救生筏
      // ══════════════════════════════════════════════════════════
      const enemyUnit = nearEnemyShip || nearEnemyGround;
      if (enemyUnit) {
        const captorName = enemyUnit.name;

        if (raft.side === 'player') {
          // 我方飛行員遭敵俘獲！懲罰扣除 80 CP
          soundEngine.playKlaxon();
          const penalty = 80;
          this.resourcePoints = Math.max(0, this.resourcePoints - penalty);

          this.addBannerAlert(
            `⚠️【我方飛行員遭敵俘虜！】「${raft.pilotName}」遭敵「${captorName}」俘獲！情資外洩扣除 80 CP！`,
            'enemy',
            'sunk',
            6.5
          );
          this.addCombatLog({
            category: 'air',
            sourceSide: 'enemy',
            sourceName: captorName,
            targetName: raft.pilotName,
            actionType: 'recon_spotted',
            text: `⚠️【飛行員不幸被俘】我軍落難飛行員「${raft.pilotName}」未及時搜救，遭敵「${captorName}」捕獲！密碼本與戰術外洩，遭受 -80 CP 懲罰！`,
          });

          this.lifeRafts.splice(i, 1);
          continue;
        } else {
          // 敵軍救起敵方自己飛行員
          this.lifeRafts.splice(i, 1);
          continue;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代三 大陸前線戰線美軍陸軍自動增援波次 (Continental Frontline Waves)
  // 美軍友軍地面單位 (美國陸軍步兵與裝甲排) 定期自大陸友軍HQ生成並推向敵HQ
  // ══════════════════════════════════════════════════════════
  private spawnContinentalAlliedFrontlineWave() {
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    if (!mainland) return;

    const alliedHq = mainland.installations.find((inst) => inst.id === 'player-hq-continental' && !inst.isDestroyed);
    if (!alliedHq) return;

    const spawnBase = { x: alliedHq.pos.x + 60, y: alliedHq.pos.y - 40 };
    const enemyHq = mainland.installations.find((inst) => inst.id === 'enemy-hq-continental' && !inst.isDestroyed);
    const targetObj = enemyHq ? { ...enemyHq.pos } : { x: 11200, y: 3400 }; // 敵東北要塞HQ

    const ts = Date.now();
    const isEra4 = this.era === 'era4';
    const waveUnits: GroundUnit[] = isEra4
      ? [
          {
            ...createGroundUnit(`us-army-wave-rifle-${ts}`, 'us_army_rifle_platoon_65', 'US Army 1st Cav Div (突擊步兵排)', 'player', 'era4', {
              x: spawnBase.x + (Math.random() - 0.5) * 40,
              y: spawnBase.y + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-m113-${ts}`, 'us_army_m113_mech', 'US Army 11th ACR M113 (裝甲機步排)', 'player', 'era4', {
              x: spawnBase.x + 35 + (Math.random() - 0.5) * 40,
              y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-sam-${ts}`, 'us_army_chaparral_sam', 'US Army MIM-72 榭樹 (野戰防空排)', 'player', 'era4', {
              x: spawnBase.x - 35 + (Math.random() - 0.5) * 40,
              y: spawnBase.y + 30 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
        ]
      : [
          {
            ...createGroundUnit(`us-army-wave-inf-${ts}-1`, 'us_army_infantry_korea', 'US Army 7th Inf Div Plt (前線突擊步兵排)', 'player', 'era3', {
              x: spawnBase.x + (Math.random() - 0.5) * 40,
              y: spawnBase.y + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-inf-${ts}-2`, 'us_army_infantry_korea', 'US Army 7th Inf Div Plt (前線突擊步兵排)', 'player', 'era3', {
              x: spawnBase.x + 30 + (Math.random() - 0.5) * 40,
              y: spawnBase.y - 25 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-tank-${ts}`, 'us_army_armor_korea', 'US Army 70th Tank Bn Plt (M46重戰車排)', 'player', 'era3', {
              x: spawnBase.x - 30 + (Math.random() - 0.5) * 40,
              y: spawnBase.y + 30 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
        ];

    this.groundUnits.push(...waveUnits);

    soundEngine.playPlaneSortie();
    this.addBannerAlert(
      isEra4
        ? `⚔️【美陸軍第1騎兵師增援】步兵排、M113裝甲機步與榭樹防空飛彈車開赴前線！`
        : `⚔️【美陸軍戰線增援出動！】美國陸軍第7步兵師前線部隊與第70戰車排自大陸基地出擊，投入中央前線推進！`,
      'player',
      'capture',
      5.5
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: '美陸軍大陸前進指揮中心',
      targetName: '中央大陸戰線',
      actionType: 'recon_spotted',
      text: isEra4
        ? `⚔️【美陸軍戰線出擊】美陸軍第1騎兵師步兵排、M113裝甲機步排與 MIM-72 榭樹防空飛彈車全面投入中央戰線，掩護推進！`
        : `⚔️【美陸軍前線增援抵達】美陸軍第7步兵師2個步兵排與第70戰車營裝甲排自大陸司令部完成集結，全面投入中央戰線向敵要塞推進！`,
    });
  }

  private spawnContinentalEnemyFrontlineWave() {
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    if (!mainland) return;

    const enemyHq = mainland.installations.find((inst) => inst.id === 'enemy-hq-continental' && !inst.isDestroyed);
    if (!enemyHq) return;

    const spawnBase = { x: enemyHq.pos.x - 60, y: enemyHq.pos.y + 40 };
    const alliedHq = mainland.installations.find((inst) => inst.id === 'player-hq-continental' && !inst.isDestroyed);
    const targetObj = alliedHq ? { ...alliedHq.pos } : { x: 6400, y: 7800 }; // 美陸軍大陸HQ

    const ts = Date.now();
    const isEra4 = this.era === 'era4';
    const waveUnits: GroundUnit[] = isEra4
      ? [
          createGroundUnit(`opfor-wave-inf-${ts}`, 'opfor_coldwar_infantry', 'PAVN 320th Div Sapper Plt (越盟主力步兵排)', 'enemy', 'era4', {
            x: spawnBase.x + (Math.random() - 0.5) * 40,
            y: spawnBase.y + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-tank-${ts}`, 'opfor_t34_85', 'PAVN 202nd Armored Regt T-54 (主力戰車排)', 'enemy', 'era4', {
            x: spawnBase.x - 30 + (Math.random() - 0.5) * 40,
            y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-pt76-${ts}`, 'opfor_infantry_ambush', 'PAVN PT-76 水陸裝甲偵察排', 'enemy', 'era4', {
            x: spawnBase.x + 20 + (Math.random() - 0.5) * 40,
            y: spawnBase.y + 30 + (Math.random() - 0.5) * 40,
          }),
        ]
      : [
          createGroundUnit(`opfor-wave-inf-${ts}-1`, 'opfor_coldwar_infantry', 'KPA 4th Inf Div Assault Plt (遠東突擊步兵排)', 'enemy', 'era3', {
            x: spawnBase.x + (Math.random() - 0.5) * 40,
            y: spawnBase.y + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-tank-${ts}`, 'opfor_t34_85', 'KPA 105th Armored Div T-34/85 Plt (裝甲突擊排)', 'enemy', 'era3', {
            x: spawnBase.x - 30 + (Math.random() - 0.5) * 40,
            y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
          }),
        ];

    waveUnits.forEach((u) => {
      u.order = { type: 'move', targetPos: targetObj };
    });

    this.groundUnits.push(...waveUnits);

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: isEra4 ? '北越/蘇聯軍事顧問要塞' : '遠東聯軍要塞司令部',
      targetName: '中央大陸戰線',
      actionType: 'recon_spotted',
      text: isEra4
        ? `⚔️【敵軍發動前線反撲】北越主力步兵連與 T-54 戰車、PT-76 裝甲車自東北坑道要塞出擊，向中央戰線展開反撲！`
        : `⚔️【敵軍發動大陸反撲】敵遠東聯軍突擊步兵排與 T-34/85 裝甲小隊自東北坑道要塞出擊，向中央戰線展開反攻！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 友軍遠東空軍 (USAAF 5th Air Force) 自動出擊機制
  // 週期性 (每 60-90 秒) 自大陸前進航空基地升空，以 CAP 空優為主 (70%)，CAS 密接為輔 (30%)
  // 動態編隊大小: 2 至 4 架戰機
  // ══════════════════════════════════════════════════════════
  private spawnUsaafAirSortie() {
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    let afbPos: Vector2D = { x: 6200, y: 8200 };
    if (mainland) {
      const contAfb = mainland.installations.find((i) => i.id === 'player-afb-continental' && !i.isDestroyed);
      if (contAfb) afbPos = { ...contAfb.pos };
    }

    const count = 2 + Math.floor(Math.random() * 3); // 2 to 4 aircraft
    const isCap = Math.random() < 0.70; // 70% CAP, 30% CAS
    const heading = -Math.PI / 4;
    const sqId = `sq-usaaf-${Date.now()}`;

    if (isCap) {
      // CAP: F-86 Sabre 空優戰巡，巡邏中央戰線奪取制空權
      const patrolCenter: Vector2D = { x: 8600, y: 5200 };
      const speed = 145;
      for (let i = 0; i < count; i++) {
        const pId = `usaaf-f86-${Date.now()}-${i}`;
        this.aircraft.push({
          id: pId,
          squadronId: sqId,
          model: 'f86',
          role: 'fighter',
          name: `USAAF 遠東第5航空隊 · F-86 軍刀空優機 (#${i + 1})`,
          side: 'player',
          pos: { x: afbPos.x + (i - (count - 1) / 2) * 30, y: afbPos.y + (i - (count - 1) / 2) * 20 },
          vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
          heading,
          targetHeading: heading,
          speed,
          maxSpeed: speed,
          altitude: 0.90,
          state: 'cruising',
          health: 520,
          maxHealth: 520,
          order: { type: 'patrol', patrolOrigin: { ...patrolCenter } },
          hasPayload: true,
          payloadType: 'clean_guns',
          payloadName: '純空優截擊',
          shootCooldown: 0,
          gunAmmo: 1800,
          maxGunAmmo: 1800,
          wingmanOffset: { x: (i - (count - 1) / 2) * 30, y: i * 20 },
          flightName: `USAAF 第5航空隊 · 第4戰鬥截擊聯隊 (Sabre CAP)`,
        });
      }

      soundEngine.playPlaneSortie();
      this.addBannerAlert(
        `✈️【遠東空軍巡邏出擊】USAAF 第5航空隊 ${count}架 F-86 軍刀機自大陸基地緊急升空，執行戰線空優巡邏 (CAP)！`,
        'player',
        'alert',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: 'USAAF 遠東空軍 (第5航空隊)',
        targetName: '大陸中央戰線空域',
        actionType: 'recon_spotted',
        text: `✈️【遠東空軍空優出擊】USAAF 遠東第5航空隊 ${count}機編隊 F-86 Sabre 噴射空優機自 K-18 基地升空，巡弋大陸戰線上空奪取制空權！`,
      });
    } else {
      // CAS: AD-1 Skyraider 密接支援前線陸軍
      const targetUnit = this.groundUnits.find((u) => u.side === 'enemy' && !u.isDestroyed);
      const targetPos: Vector2D = targetUnit ? { ...targetUnit.pos } : { x: 9200, y: 4800 };
      const speed = 120;
      for (let i = 0; i < count; i++) {
        const pId = `usaaf-cas-${Date.now()}-${i}`;
        this.aircraft.push({
          id: pId,
          squadronId: sqId,
          model: 'ad1',
          role: 'attacker',
          name: `USAAF 遠東第5航空隊 · AD-1 天襲者密接打擊機 (#${i + 1})`,
          side: 'player',
          pos: { x: afbPos.x + (i - (count - 1) / 2) * 30, y: afbPos.y + (i - (count - 1) / 2) * 20 },
          vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
          heading,
          targetHeading: heading,
          speed,
          maxSpeed: speed,
          altitude: 0.40,
          state: 'cruising',
          health: 700,
          maxHealth: 700,
          order: { type: 'attack', targetPos },
          hasPayload: true,
          payloadType: i % 2 === 0 ? 'hvar_rockets' : 'napalm_canister',
          payloadName: i % 2 === 0 ? 'HVAR 火箭' : '凝固汽油彈',
          shootCooldown: 0,
          gunAmmo: 1200,
          maxGunAmmo: 1200,
          wingmanOffset: { x: (i - (count - 1) / 2) * 30, y: i * 20 },
          flightName: `USAAF 第5航空隊 · 密接對地攻擊分隊`,
        });
      }

      soundEngine.playPlaneSortie();
      this.addBannerAlert(
        `🚀【遠東空軍密接打擊】USAAF 第5航空隊 ${count}架 天襲者攻擊機群升空，對前線敵裝甲與陣地實施火力壓制 (CAS)！`,
        'player',
        'alert',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: 'USAAF 遠東空軍 (第5航空隊)',
        targetName: '前線敵軍裝甲與陣地',
        actionType: 'recon_spotted',
        text: `🚀【前線密接打擊出擊】USAAF 第5航空隊 ${count}機編隊 AD-1 Skyraider 天襲者掛載航空火箭與凝固汽油彈，直撲大陸前線支援美陸軍部隊！`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 平民設施與難民營附帶損害軍事懲處 (Civilian Collateral Penalty)
  // 扣除 15 CP，發出高優先級軍事法庭與參謀訓誡戰鬥日誌
  // ══════════════════════════════════════════════════════════
  private triggerCivilianCollateralPenalty(inst: Installation, attacker: string) {
    if (this.civilianCollateralCooldowns[inst.id] && this.civilianCollateralCooldowns[inst.id] > 0) return;
    this.civilianCollateralCooldowns[inst.id] = 4.0; // 4s cooldown per installation

    const penalty = 15;
    this.resourcePoints = Math.max(0, this.resourcePoints - penalty);
    soundEngine.playKlaxon();

    this.addBannerAlert(
      `⚠️【附帶損害警告】平民區「${inst.name}」遭砲火誤擊！司令部嚴正訓誡，懲處 -${penalty} CP！`,
      'player',
      'sunk',
      6.0
    );

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: '戰區國際軍事法庭與聯合國特派處',
      targetName: inst.name,
      actionType: 'recon_spotted',
      isCrit: true,
      text: `⚠️【平民附帶損害嚴正訓誡】${attacker} 砲火/航彈誤傷非軍事保護區「${inst.name}」造成嚴重附帶損害 (Collateral Damage)！戰區司令部依戰時國際法規嚴厲斥責並懲處扣除 15 CP！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 定期增援循環 (Replenishment & Scheduled Convoys)
  // ══════════════════════════════════════════════════════════

  private replenishAirbasePlanes() {
    if (this.era === 'era1') {
      this.airbasePlanes.b17 = (this.airbasePlanes.b17 || 0) + 1;
      this.airbasePlanes.p40 = (this.airbasePlanes.p40 || 0) + 2;
      this.airbasePlanes.a20 = (this.airbasePlanes.a20 || 0) + 2;
      this.airbasePlanes.f4f = (this.airbasePlanes.f4f || 0) + 2;
      this.airbasePlanes.sbd = (this.airbasePlanes.sbd || 0) + 1;
      this.airbasePlanes.tbd = (this.airbasePlanes.tbd || 0) + 1;
    } else if (this.era === 'era2') {
      this.airbasePlanes.b24 = (this.airbasePlanes.b24 || 0) + 1;
      this.airbasePlanes.p51 = (this.airbasePlanes.p51 || 0) + 2;
      this.airbasePlanes.p47 = (this.airbasePlanes.p47 || 0) + 2;
      this.airbasePlanes.p38 = (this.airbasePlanes.p38 || 0) + 1;
      this.airbasePlanes.f6f = (this.airbasePlanes.f6f || 0) + 2;
      this.airbasePlanes.f4u = (this.airbasePlanes.f4u || 0) + 2;
      this.airbasePlanes.sb2c = (this.airbasePlanes.sb2c || 0) + 1;
      this.airbasePlanes.tbf = (this.airbasePlanes.tbf || 0) + 1;
    } else {
      this.airbasePlanes.b29 = (this.airbasePlanes.b29 || 0) + 1;
      this.airbasePlanes.f86 = (this.airbasePlanes.f86 || 0) + 2;
      this.airbasePlanes.a26 = (this.airbasePlanes.a26 || 0) + 2;
      this.airbasePlanes.f9f = (this.airbasePlanes.f9f || 0) + 2;
      this.airbasePlanes.f2h = (this.airbasePlanes.f2h || 0) + 2;
      this.airbasePlanes.ad1 = (this.airbasePlanes.ad1 || 0) + 2;
      this.airbasePlanes.f4u4 = (this.airbasePlanes.f4u4 || 0) + 1;
      this.airbasePlanes.af_guardian = (this.airbasePlanes.af_guardian || 0) + 1;
    }
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '後勤航空輸送隊',
      targetName: '前進航空基地',
      actionType: 'recon_spotted',
      text: `📦【基地航空補充】後方輸送機隊降落 Henderson Field，水平轟炸機、戰鬥機與攻擊機庫存獲得全面補充！`,
    });
  }

  private spawnConvoyReinforcement() {
    const basePos = this.friendlyBase?.center || { x: 2000, y: 12400 };
    const landingPos: Vector2D = { x: basePos.x + 360, y: basePos.y - 200 };

    // 1. Add Ground unit to base
    const unitType: GroundUnitType =
      this.era === 'era1'
        ? Math.random() < 0.4
          ? 'usmc_rifle_42'
          : Math.random() < 0.7
          ? 'usmc_lvt_42'
          : 'usmc_armor_m3'
        : Math.random() < 0.4
        ? 'usmc_rifle_45'
        : Math.random() < 0.7
        ? 'usmc_lvt_45'
        : 'usmc_armor_m4';

    const uName =
      unitType === 'usmc_rifle_42'
        ? "USMC 陸戰步兵排 (1942)"
        : unitType === 'usmc_rifle_45'
        ? "USMC 陸戰突擊步兵排 (1945)"
        : unitType === 'usmc_lvt_42'
        ? 'USMC LVT-1 水牛兩棲機步排'
        : unitType === 'usmc_lvt_45'
        ? 'USMC LVT-4 水牛兩棲突擊排'
        : unitType === 'usmc_armor_m3'
        ? 'USMC M3 斯圖亞特戰車排'
        : 'USMC M4A2 薛曼中戰車排';

    const newUnit = createGroundUnit(`usmc-reinf-${Date.now()}`, unitType, uName, 'player', this.era, {
      x: basePos.x + (Math.random() - 0.5) * 80,
      y: basePos.y + (Math.random() - 0.5) * 80,
    });
    this.groundUnits.push(newUnit);

    // 2. Add Landing Craft with self-defense armaments
    const craftType = Math.random() < 0.65 ? 'lcvp' : 'lst';
    const craft =
      craftType === 'lcvp'
        ? createLCVP(`player-lcvp-reinf-${Date.now()}`, `LCVP 突擊登陸艇 (PA-${Math.floor(Math.random() * 80) + 10})`, landingPos, this.era)
        : createLST(`player-lst-reinf-${Date.now()}`, `LST-${Math.floor(Math.random() * 400) + 400} 戰車登陸艦`, landingPos, this.era);
    this.playerShips.push(craft);

    // 3. Add Naval Escort (SS, DD, CL, CA, or rare CVE)
    const escortType = this.nextConvoyEscort;
    const escortPos: Vector2D = { x: basePos.x + 480, y: basePos.y - 280 };
    let escortShip: Ship;

    if (this.era === 'era2' && Math.random() < 0.2) {
      escortShip = createCVE(`player-cve-${Date.now()}`, 'USS Casablanca (CVE-55 護航航母)', escortPos, this.era);
    } else {
      escortShip = createConvoyEscortShip(`player-escort-${Date.now()}`, escortType, escortPos, this.era);
    }
    this.playerShips.push(escortShip);

    // Randomize next escort
    const escorts: ('ss' | 'dd' | 'cl' | 'ca')[] = ['ss', 'dd', 'cl', 'ca'];
    this.nextConvoyEscort = escorts[Math.floor(Math.random() * escorts.length)];

    soundEngine.playPlaneSortie();
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: '太平洋後勤輸送總隊',
      targetName: '前進海空基地',
      actionType: 'recon_spotted',
      text: `🚢⚓【海運船團抵達基地！】「${craft.name}」與陸戰隊「${uName}」靠泊！伴隨護航戰艦「${escortShip.name}」加入作戰序列！`,
    });
  }

  private spawnTokyoExpressDD() {
    const spawnPos: Vector2D = { x: 8600, y: 1400 };
    const ddNames = ['IJN Kagero (陽炎號)', 'IJN Shigure (時雨號)', 'IJN Yukikaze (雪風號)', 'IJN Fubuki (吹雪號)'];
    const name = ddNames[Math.floor(Math.random() * ddNames.length)];
    const dd = createTokyoExpressDD(`tokyo-express-${Date.now()}`, name, spawnPos);
    this.enemyShips.push(dd);

    soundEngine.playKlaxon();
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: '外南洋部隊「鼠輸送」',
      targetName: '美軍特混艦隊與登陸灘頭',
      actionType: 'recon_spotted',
      text: `🚨【東京快車奔襲警報！】偵測到日軍高速驅逐艦「${dd.name}」以35節極速自西北外海長驅突入！注意其攜帶之九三式超長程氧氣魚雷！`,
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.isDead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.isASROC) {
        // ════ ASROC 反潛火箭彈道運算 (Boost -> Parachute Retardation -> Water Torpedo Entry) ════
        if (proj.asrocStage === 'boost') {
          const step = proj.speed * dt;
          proj.distanceTraveled += step;
          proj.flightProgress = Math.min(1, proj.distanceTraveled / Math.max(1, proj.maxDistance));
          proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
          proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;
          proj.arcAltitude = Math.sin(proj.flightProgress * Math.PI) * 75;

          if (Math.random() < 0.8) {
            this.particles.push({
              id: `asroc-smoke-${Date.now()}-${Math.random()}`,
              x: proj.pos.x,
              y: proj.pos.y - (proj.arcAltitude || 0),
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 0.45,
              maxLife: 0.45,
              radius: 4.5,
              color: 'rgba(255, 235, 150, 0.7)',
              type: 'smoke',
            });
          }

          if (proj.flightProgress >= 0.75) {
            proj.asrocStage = 'parachute';
            proj.speed = 180;
          }
        } else if (proj.asrocStage === 'parachute') {
          const step = proj.speed * dt;
          proj.distanceTraveled += step;
          proj.flightProgress = Math.min(1, proj.distanceTraveled / Math.max(1, proj.maxDistance));
          proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
          proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;
          proj.arcAltitude = Math.sin(proj.flightProgress * Math.PI) * 75;

          if (proj.flightProgress >= 1) {
            soundEngine.playWaterSplash();
            this.particles.push({
              id: `asroc-splash-${Date.now()}`,
              x: proj.pos.x,
              y: proj.pos.y,
              vx: 0,
              vy: 0,
              life: 0.8,
              maxLife: 0.8,
              radius: 28,
              color: '#80DEEA',
              type: 'geyser',
              shape: 'ring',
            });

            proj.isASROC = false;
            proj.type = 'torpedo';
            proj.isAcousticHoming = true;
            proj.speed = 110;
            proj.maxDistance = 1800;
            proj.distanceTraveled = 0;
            proj.originPos = { ...proj.pos };
            proj.damage = 680;
            proj.turnRate = 3.5;
            proj.blastRadius = 32;
            proj.acousticPingTimer = 0.2;
          }
        }
        continue;
      }

      if (proj.type === 'shell') {
        const step = proj.speed * dt;
        proj.distanceTraveled += step;
        proj.flightProgress = Math.min(1, proj.distanceTraveled / proj.maxDistance);
        proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
        proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;

        if (proj.flightProgress >= 1) {
          this.detonateProjectile(proj);
          proj.isDead = true;
        }
      } else if (proj.type === 'torpedo') {
        // Mk 24 / Mk 34 / Mk 46 聲自導反潛魚雷主動導引鎖定 (Acoustic Homing Tracking: turnRate 3.5)
        const isHoming = proj.isAcousticHoming || this.era === 'era3' || this.era === 'era4';
        if (isHoming) {
          const targets = proj.side === 'player' ? this.enemyShips : this.playerShips;
          let bestTarget: Ship | null = null;
          let bestDist = 1800;

          // Priority 1: enemy submarine
          for (const target of targets) {
            if (target.isSunk) continue;
            const d = dist(proj.pos, target.pos);
            if (target.type === 'submarine' && d < 1800 && d < bestDist) {
              bestDist = d;
              bestTarget = target;
            }
          }

          // Priority 2: surface ships
          if (!bestTarget) {
            for (const target of targets) {
              if (target.isSunk) continue;
              const d = dist(proj.pos, target.pos);
              if (d < 1600 && d < bestDist) {
                bestDist = d;
                bestTarget = target;
              }
            }
          }

          if (bestTarget) {
            const desiredAngle = Math.atan2(bestTarget.pos.y - proj.pos.y, bestTarget.pos.x - proj.pos.x);
            let diff = desiredAngle - proj.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const turnRate = (proj.turnRate || 3.5) * dt;
            if (Math.abs(diff) < turnRate) proj.heading = desiredAngle;
            else proj.heading += Math.sign(diff) * turnRate;
            proj.vel.x = Math.cos(proj.heading) * proj.speed;
            proj.vel.y = Math.sin(proj.heading) * proj.speed;
          }

          // Periodic acoustic sonar ping concentric ring
          proj.acousticPingTimer = (proj.acousticPingTimer || 1.5) - dt;
          if (proj.acousticPingTimer <= 0) {
            proj.acousticPingTimer = 1.5;
            this.particles.push({
              id: `sonar-ping-${Date.now()}-${Math.random()}`,
              x: proj.pos.x,
              y: proj.pos.y,
              vx: 0,
              vy: 0,
              life: 0.7,
              maxLife: 0.7,
              radius: 30,
              color: '#00E5FF',
              type: 'shockwave',
              shape: 'ring',
            });
          }
        }

        proj.pos.x += proj.vel.x * dt;
        proj.pos.y += proj.vel.y * dt;
        proj.distanceTraveled += proj.speed * dt;

        // Foamy bubble wake particle trail behind speeding torpedo
        if (Math.random() < 0.6) {
          this.particles.push({
            id: `torp-wake-${Date.now()}-${Math.random()}`,
            x: proj.pos.x - Math.cos(proj.heading) * 10,
            y: proj.pos.y - Math.sin(proj.heading) * 10,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0.5,
            maxLife: 0.5,
            radius: 2.6,
            color: 'rgba(224, 247, 250, 0.7)',
            type: 'smoke',
          });
        }

        for (const isl of this.islands) {
          if (isPointInPolygon(proj.pos, isl.points)) {
            this.detonateProjectile(proj);
            proj.isDead = true;
            break;
          }
        }

        const targetShips = proj.side === 'player' ? this.enemyShips : this.playerShips;
        for (const ship of targetShips) {
          if (!ship.isSunk && distToShipHull(proj.pos, ship) < ship.width * 0.75 + 14) {
            this.detonateProjectile(proj, ship);
            proj.isDead = true;
            break;
          }
        }

        if (proj.distanceTraveled >= proj.maxDistance) {
          proj.isDead = true;
        }
      } else if (proj.type === 'bomb') {
        // True Ballistic Trajectory: Bomb flies directly toward target coordinates
        const bombSpeed = proj.speed || 280;
        const totalDist = Math.max(1, proj.maxDistance);
        proj.distanceTraveled += bombSpeed * dt;
        proj.flightProgress = Math.min(1, proj.distanceTraveled / totalDist);

        if (proj.isNapalm) {
          proj.tumbleAngle = ((proj.tumbleAngle || 0) + 12 * dt) % (Math.PI * 2);
        }

        proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
        proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;

        if (proj.flightProgress >= 1) {
          this.detonateProjectile(proj);
          proj.isDead = true;
        }
      } else if (proj.type === 'depth_charge') {
        proj.fuseTimer = (proj.fuseTimer || 1) - dt;
        if ((proj.fuseTimer || 0) <= 0) {
          this.detonateProjectile(proj);
          proj.isDead = true;
        }
      } else if (proj.type === 'hedgehog') {
        const step = proj.speed * dt;
        proj.distanceTraveled += step;
        proj.flightProgress = Math.min(1, proj.distanceTraveled / Math.max(1, proj.maxDistance));
        proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
        proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;

        // Parabolic arc altitude
        proj.arcAltitude = Math.sin(proj.flightProgress * Math.PI) * 45;

        // Check contact hit during terminal phase (progress > 0.85) or when landing
        if (proj.flightProgress >= 0.85) {
          const directHitSub = this.enemyShips.find(
            (e) => e.type === 'submarine' && !e.isSunk && dist(proj.pos, e.pos) < 32
          );
          if (directHitSub) {
            this.detonateProjectile(proj, directHitSub);
            proj.isDead = true;
          }
        }

        if (proj.flightProgress >= 1 && !proj.isDead) {
          proj.isDead = true;
          // Contact mortar entered water without hitting submarine -> harmless water splash, no detonation
          soundEngine.playWaterSplash();
          this.particles.push({
            id: `hh-splash-${Date.now()}-${Math.random()}`,
            x: proj.pos.x,
            y: proj.pos.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.5,
            maxLife: 0.5,
            radius: 12,
            color: '#80DEEA',
            type: 'geyser',
            shape: 'ring',
          });
        }
      } else if (proj.type === 'rocket') {
        proj.pos.x += proj.vel.x * dt;
        proj.pos.y += proj.vel.y * dt;
        proj.distanceTraveled += proj.speed * dt;

        // Trail smoke and propellant sparks
        if (Math.random() < 0.6) {
          this.particles.push({
            id: `r-smoke-${Date.now()}-${Math.random()}`,
            x: proj.pos.x,
            y: proj.pos.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.32,
            maxLife: 0.32,
            radius: 3.5,
            color: 'rgba(255, 235, 150, 0.7)',
            type: 'smoke',
          });
        }

        const targetShips = proj.side === 'player' ? this.enemyShips : this.playerShips;
        for (const ship of targetShips) {
          if (!ship.isSunk && distToShipHull(proj.pos, ship) < ship.width * 0.75 + 12) {
            this.detonateProjectile(proj, ship);
            proj.isDead = true;
            break;
          }
        }

        if (!proj.isDead) {
          for (const isl of this.islands) {
            for (const inst of isl.installations) {
              if (!inst.isDestroyed && inst.side !== proj.side && dist(proj.pos, inst.pos) < 28) {
                this.detonateProjectile(proj);
                proj.isDead = true;
                break;
              }
            }
            if (proj.isDead) break;
          }
        }

        if (proj.distanceTraveled >= proj.maxDistance) {
          this.detonateProjectile(proj);
          proj.isDead = true;
        }
      } else if (proj.type === 'bullet') {
        proj.pos.x += proj.vel.x * dt;
        proj.pos.y += proj.vel.y * dt;
        proj.distanceTraveled += proj.speed * dt;

        const targetPlanes = this.aircraft.filter((a) => a.side !== proj.side && a.state !== 'shot_down');
        for (const p of targetPlanes) {
          if (dist(proj.pos, p.pos) < 20) {
            p.health -= proj.damage;
            proj.isDead = true;
            if (p.health <= 0) this.killPlane(p);
            break;
          }
        }

        // 步槍與機槍對地面作戰單位實體碰撞判定 (Ground Unit Bullet Impact)
        // 建制傷害隨目標組織度下降微幅提升 (組織度低於50%時最多增加50%建制傷害)
        if (!proj.isDead) {
          for (const u of this.groundUnits) {
            if (!u.isDestroyed && !u.embarkedInShipId && u.side !== proj.side && dist(proj.pos, u.pos) < 26) {
              const currentOrg = u.organization ?? 100;
              const orgDmgScale = currentOrg < 50 ? 1.0 + 0.5 * (1.0 - currentOrg / 50) : 1.0;
              const urbanCoverMod = u.isInUrbanCover ? 0.50 : 1.0;
              const dmg = Math.round(proj.damage * orgDmgScale * (1 - (u.armor || 0.2) * 0.35) * urbanCoverMod);
              u.health = Math.max(0, u.health - dmg);
              u.strength = Math.max(0, Math.round((u.health / u.maxHealth) * 100));
              u.organization = Math.max(0, currentOrg - (u.isInUrbanCover ? 2 : 4));
              if (u.organization < 20) u.disorganized = true;

              // 遭受槍砲直射火力打擊產生火力壓制 (若為M61火神光束則壓制更劇烈)
              u.suppression = Math.min(100, (u.suppression || 0) + (proj.isBeamTracer ? 20 : 12));
              u.suppressionTimer = 5.0;
              u.isSuppressed = u.suppression >= 30;
              u.isPinned = u.suppression >= 75;

              proj.isDead = true;

              if (u.health <= 0 || u.strength <= 0) {
                u.isDestroyed = true;
                soundEngine.playExplosion(false);
                if (u.side === 'enemy') {
                  this.casualties.enemyGroundLost++;
                  this.resourcePoints += 40;
                  this.totalCpEarned += 40;
                } else {
                  this.casualties.playerGroundLost++;
                }
                this.addCombatLog({
                  category: 'naval',
                  sourceSide: proj.side,
                  sourceName: proj.attackerName || (proj.side === 'player' ? '友軍地面部隊' : '敵軍部隊'),
                  targetName: u.name,
                  actionType: 'gun_hit',
                  damage: dmg,
                  text: `💥【步火交鋒突破】「${u.name}」在密集火力壓制下建制被徹底擊潰消滅！`,
                });
              }
              break;
            }
          }
        }

        if (proj.distanceTraveled >= proj.maxDistance) {
          proj.isDead = true;
        }
      } else if (
        proj.type === 'missile_aam' ||
        proj.type === 'missile_sam' ||
        proj.type === 'missile_ashm' ||
        proj.type === 'missile_arm'
      ) {
        // ══════════════════════════════════════════════════════════
        // 時代四導向飛彈運動、主動尋標轉向與反飛彈防禦攔截 (Missile Guidance & Interception)
        // ══════════════════════════════════════════════════════════
        let targetPos: Vector2D | null = null;

        if (proj.targetEntityId) {
          if (proj.targetEntityType === 'aircraft') {
            const p = this.aircraft.find((a) => a.id === proj.targetEntityId && a.state !== 'shot_down');
            if (p) targetPos = p.pos;
          } else if (proj.targetEntityType === 'projectile') {
            const pr = this.projectiles.find((p) => p.id === proj.targetEntityId && !p.isDead);
            if (pr) targetPos = pr.pos;
          } else if (proj.targetEntityType === 'ship') {
            const s = (proj.side === 'player' ? this.enemyShips : this.playerShips).find(
              (sh) => sh.id === proj.targetEntityId && !sh.isSunk
            );
            if (s) targetPos = s.pos;
          } else if (proj.targetEntityType === 'installation') {
            const inst = this.findTargetInstallation(proj.targetEntityId);
            if (inst) targetPos = inst.pos;
          }
        }

        if (!targetPos && proj.targetPos) {
          targetPos = proj.targetPos;
        }

        if (targetPos) {
          const desiredAngle = Math.atan2(targetPos.y - proj.pos.y, targetPos.x - proj.pos.x);
          let diff = desiredAngle - proj.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turnStep = (proj.turnRate || 3.5) * dt;
          if (Math.abs(diff) < turnStep) {
            proj.heading = desiredAngle;
          } else {
            proj.heading += Math.sign(diff) * turnStep;
          }
          proj.vel.x = Math.cos(proj.heading) * proj.speed;
          proj.vel.y = Math.sin(proj.heading) * proj.speed;
        }

        proj.pos.x += proj.vel.x * dt;
        proj.pos.y += proj.vel.y * dt;
        proj.distanceTraveled += proj.speed * dt;

        // 火箭推進發動機白煙與尾焰粒子
        if (Math.random() < 0.75) {
          const tailDist = 12;
          const tx = proj.pos.x - Math.cos(proj.heading) * tailDist;
          const ty = proj.pos.y - Math.sin(proj.heading) * tailDist;
          this.particles.push({
            id: `m-smoke-${Date.now()}-${Math.random()}`,
            x: tx + (Math.random() - 0.5) * 4,
            y: ty + (Math.random() - 0.5) * 4,
            vx: -Math.cos(proj.heading) * 16 + (Math.random() - 0.5) * 8,
            vy: -Math.sin(proj.heading) * 16 + (Math.random() - 0.5) * 8,
            life: 0.45,
            maxLife: 0.45,
            radius: 3.5,
            color: proj.type === 'missile_ashm' ? 'rgba(255, 112, 67, 0.75)' : 'rgba(245, 245, 245, 0.75)',
            type: 'smoke',
          });
        }

        // A. 反飛彈攔截 (Anti-Missile Interception)
        if (proj.isInterceptionMissile || proj.targetEntityType === 'projectile') {
          const targetProj = this.projectiles.find(
            (p) => !p.isDead && p.id === proj.targetEntityId && dist(proj.pos, p.pos) < 32
          );
          if (targetProj) {
            soundEngine.playExplosion(false);
            targetProj.isDead = true;
            proj.isDead = true;
            this.particles.push({
              id: `intercept-blast-${Date.now()}`,
              x: proj.pos.x,
              y: proj.pos.y,
              vx: 0,
              vy: 0,
              life: 0.6,
              maxLife: 0.6,
              radius: 42,
              color: '#00E5FF',
              type: 'shockwave',
              shape: 'ring',
            });
            this.addBannerAlert('🎯【飛彈防禦攔截成功！】防空飛彈成功凌空打爆來襲反艦飛彈！', 'player', 'alert', 5.5);
            this.addCombatLog({
              category: 'aa',
              sourceSide: proj.side,
              sourceName: proj.attackerName || '防空飛彈射控系統',
              targetName: '來襲反艦飛彈',
              actionType: 'recon_spotted',
              text: `🎯【反飛彈防禦攔截成功】防空飛彈雷達導引近炸引信凌空殉爆！成功粉碎來襲之反艦飛彈！`,
            });
          }
        }

        // B. 空空 / 防空飛彈近炸敵機 (AAM & SAM vs Aircraft)
        if (!proj.isDead && (proj.type === 'missile_aam' || proj.type === 'missile_sam')) {
          const targetPlanes = this.aircraft.filter((a) => a.side !== proj.side && a.state !== 'shot_down');
          for (const plane of targetPlanes) {
            if (dist(proj.pos, plane.pos) < 34) {
              soundEngine.playExplosion(false);
              plane.health -= proj.damage;
              proj.isDead = true;

              this.particles.push({
                id: `sam-air-blast-${Date.now()}`,
                x: proj.pos.x,
                y: proj.pos.y,
                vx: 0,
                vy: 0,
                life: 0.55,
                maxLife: 0.55,
                radius: 38,
                color: '#FF6D00',
                type: 'shockwave',
                shape: 'ring',
              });

              this.addCombatLog({
                category: 'aa',
                sourceSide: proj.side,
                sourceName: proj.attackerName || '導向飛彈',
                targetName: plane.name,
                actionType: 'aa_down',
                damage: proj.damage,
                text: `💥【飛彈近炸破甲】${proj.attackerName || '導向飛彈'} 於「${plane.name}」近距凌空引爆！高能預製破片造成 ${proj.damage} 點重創！`,
              });

              if (plane.health <= 0) {
                this.killPlane(plane);
              }
              break;
            }
          }
        }

        // C. 反艦飛彈命中水面艦艇 (AShM vs Ship)
        if (!proj.isDead && proj.type === 'missile_ashm') {
          const targetShips = proj.side === 'player' ? this.enemyShips : this.playerShips;
          for (const ship of targetShips) {
            if (!ship.isSunk && distToShipHull(proj.pos, ship) < ship.width * 0.75 + 16) {
              this.detonateProjectile(proj, ship);
              proj.isDead = true;
              break;
            }
          }
        }

        // D. 反輻射飛彈命中雷達陣地 (ARM vs Radar Installation)
        if (!proj.isDead && proj.type === 'missile_arm') {
          for (const isl of this.islands) {
            for (const inst of isl.installations) {
              if (!inst.isDestroyed && inst.side !== proj.side && dist(proj.pos, inst.pos) < 38) {
                this.detonateProjectile(proj);
                proj.isDead = true;
                break;
              }
            }
            if (proj.isDead) break;
          }
        }

        // E. 撞擊島嶼陸地
        if (!proj.isDead && (proj.type === 'missile_ashm' || proj.type === 'missile_arm')) {
          for (const isl of this.islands) {
            if (isPointInPolygon(proj.pos, isl.points)) {
              this.detonateProjectile(proj);
              proj.isDead = true;
              break;
            }
          }
        }

        // F. 超出最大射程自毀
        if (proj.distanceTraveled >= proj.maxDistance) {
          proj.isDead = true;
          this.detonateProjectile(proj);
        }
      }
    }
  }

  private detonateProjectile(proj: Projectile, directHitShip?: Ship) {
    // ══════════════════════════════════════════════════════════
    // 時代三 Mk 4 / Mk 6 戰術原子彈終極引爆 (Tactical Nuclear Detonation)
    // 消耗 4500 CP · 全島範圍覆蓋 (半徑 520m) · 瞬間汽化守備要塞部隊與防空陣地
    // ══════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════
    // 戰略與戰術核武器終極引爆系統 (Strategic & Tactical Nuclear Detonations)
    // B-52 百萬噸熱核武器 (750m) / B61 戰術核武器 (420m) / OPFOR 戰術核反撲 (450m) / B-29 Mk 4 (220m)
    // ══════════════════════════════════════════════════════════
    if (
      proj.bombType === 'tactical_nuke' ||
      proj.bombType === 'b52_megaton_nuke' ||
      proj.bombType === 'tactical_b61_nuke' ||
      proj.bombType === 'opfor_tactical_nuke' ||
      proj.isNuclear
    ) {
      const isMegaton = proj.bombType === 'b52_megaton_nuke';
      const isB61 = proj.bombType === 'tactical_b61_nuke';
      const isOpfor = proj.bombType === 'opfor_tactical_nuke';
      const blastRad = isMegaton ? 750 : (isB61 ? 420 : (isOpfor ? 450 : 220));
      const nukeDamage = isMegaton ? 250000 : (isB61 ? 90000 : (isOpfor ? 100000 : 120000));
      const nukeDuration = isMegaton ? 12.0 : 8.5;

      this.nuclearFlash = isMegaton ? 2.0 : 1.35;
      soundEngine.playExplosion(true);
      soundEngine.playGunSalvo(true);

      const hitIsland = this.islands.find((isl) => dist(isl.center, proj.pos) < isl.radius + 200);
      const islName = hitIsland?.name || '目標戰略島嶼防區';

      this.nuclearDetonations.push({
        id: `nuke-${Date.now()}-${Math.random()}`,
        x: proj.pos.x,
        y: proj.pos.y,
        radius: 0,
        maxRadius: blastRad,
        timer: 0,
        duration: nukeDuration,
        targetIslandName: islName,
      });

      // 1. 引爆點周圍工事摧毀判定
      let vaporizedInst = 0;
      let hqDamaged = false;
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (!inst.isDestroyed && dist(proj.pos, inst.pos) <= blastRad) {
            if (inst.type === 'command_post') {
              const hqNukeDmg = Math.round(inst.maxHealth * (isMegaton ? 0.85 : 0.65));
              inst.health = Math.max(0, inst.health - hqNukeDmg);
              hqDamaged = true;
              if (inst.health <= 0) {
                inst.isDestroyed = true;
                vaporizedInst++;
                if (inst.side === 'enemy') {
                  this.casualties.enemyInstallationsLost++;
                  this.score.installationsDestroyed++;
                } else {
                  this.casualties.playerInstallationsLost++;
                }
              }
            } else {
              inst.health = 0;
              inst.isDestroyed = true;
              vaporizedInst++;
              if (inst.side === 'enemy') {
                this.casualties.enemyInstallationsLost++;
                this.score.installationsDestroyed++;
              } else {
                this.casualties.playerInstallationsLost++;
              }
            }
          }
        }
      }

      // 2. 汽化引爆點周圍所有地面作戰部隊
      let vaporizedGround = 0;
      for (const u of this.groundUnits) {
        if (!u.isDestroyed && dist(proj.pos, u.pos) <= blastRad) {
          u.health = 0;
          u.strength = 0;
          u.organization = 0;
          u.isDestroyed = true;
          vaporizedGround++;
          if (u.side === 'enemy') {
            this.casualties.enemyGroundLost++;
          } else {
            this.casualties.playerGroundLost++;
          }
        }
      }

      // 3. 毀滅周圍艦艇
      const candidateShips = isOpfor ? this.playerShips : this.enemyShips;
      for (const s of candidateShips) {
        if (!s.isSunk && dist(proj.pos, s.pos) <= blastRad * 0.8) {
          s.health = Math.max(0, s.health - (isMegaton ? 24000 : 9000));
          if (s.health <= 0) this.sinkShip(s);
        }
      }

      const alertTitle = isMegaton
        ? '☢️【B-52 百萬噸級戰略熱核引爆】B28/B41 氫彈震撼引爆！全戰區半徑 750m 焦土火球衝天！'
        : isB61
        ? '☢️【B61 戰術核打擊引爆】半徑 420m 戰術熱核火球吞噬天際！防空陣地與部隊瞬間汽化！'
        : isOpfor
        ? '☢️⚠️【敵軍戰術核航彈引爆！】敵方核彈於戰區引爆！我方陣容承受衝擊波毀滅打擊！'
        : `☢️【代號：天罰——戰術核打擊引爆】半徑 220m 戰術熱核火球吞噬天際！防空陣地與部隊瞬間汽化！`;

      this.addBannerAlert(
        `${alertTitle}${hqDamaged ? '（地下坑道指揮所深居地下受損生還）' : ''}`,
        isOpfor ? 'enemy' : 'player',
        'sunk',
        9.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: isOpfor ? 'enemy' : 'player',
        sourceName: proj.attackerName || '戰略/戰術核打擊力量',
        targetName: islName,
        actionType: 'bomb_hit',
        damage: nukeDamage,
        text: `☢️【核打擊終極震撼引爆】${alertTitle} 瞬間汽化 ${vaporizedInst} 處工事與 ${vaporizedGround} 個守備連隊${hqDamaged ? '；地下坑道指揮所深居花崗岩坑道承受重創生還！' : '！'}`,
      });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 凝固汽油燃燒彈引爆 (Napalm Firestorm Detonation)
    // 燃燒罐觸地撕裂，化為數十米高溫焦土火海與滾滾濃煙，灼燒工事與步兵連隊
    // ══════════════════════════════════════════════════════════
    if (proj.isNapalm || proj.bombType === 'napalm_canister') {
      soundEngine.playExplosion(false);
      this.addBannerAlert('🔥【凝固汽油烈焰火海】凝固汽油燃燒彈引爆！目標陣地化為數十米高溫焦土火海！', 'player', 'down', 4.5);
      // Spawn 22 lingering flame particles with life 5.5-7.5s and rolling black smoke
      for (let f = 0; f < 22; f++) {
        const fireOffsetDist = Math.random() * 55;
        const fireAngle = Math.random() * Math.PI * 2;
        const fx = proj.pos.x + Math.cos(fireAngle) * fireOffsetDist;
        const fy = proj.pos.y + Math.sin(fireAngle) * fireOffsetDist;
        this.particles.push({
          id: `napalm-fire-${Date.now()}-${f}-${Math.random()}`,
          x: fx,
          y: fy,
          vx: (Math.random() - 0.5) * 6,
          vy: -6 - Math.random() * 10,
          life: 5.5 + Math.random() * 2.5,
          maxLife: 8.0,
          radius: 7 + Math.random() * 7,
          color: f % 3 === 0 ? '#FF1744' : f % 3 === 1 ? '#FF6D00' : '#FFD600',
          type: 'fire',
        });
      }
      for (let s = 0; s < 10; s++) {
        const sx = proj.pos.x + (Math.random() - 0.5) * 45;
        const sy = proj.pos.y + (Math.random() - 0.5) * 45;
        this.particles.push({
          id: `napalm-smoke-${Date.now()}-${s}-${Math.random()}`,
          x: sx,
          y: sy,
          vx: (Math.random() - 0.5) * 10,
          vy: -12 - Math.random() * 14,
          life: 4.5 + Math.random() * 2.0,
          maxLife: 6.5,
          radius: 14 + Math.random() * 12,
          color: 'rgba(18, 20, 24, 0.88)',
          type: 'smoke',
        });
      }
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (!inst.isDestroyed && inst.side !== proj.side && dist(proj.pos, inst.pos) <= 65) {
            inst.health -= 1200;
            if (inst.health <= 0) {
              inst.isDestroyed = true;
              this.casualties.enemyInstallationsLost++;
              this.score.installationsDestroyed++;
            }
          }
        }
      }
      for (const u of this.groundUnits) {
        if (!u.isDestroyed && u.side !== proj.side && dist(proj.pos, u.pos) <= 65) {
          u.health -= 900;
          u.organization = Math.max(0, u.organization - 75);
          if (u.health <= 0) {
            u.isDestroyed = true;
            this.casualties.enemyGroundLost++;
          }
        }
      }
      return;
    }

    const isLarge = proj.damage > 250;
    soundEngine.playExplosion(isLarge);

    const isBomb = proj.type === 'bomb';
    const isTorpedo = proj.type === 'torpedo';
    const onIsland = this.islands.some((isl) => isPointInPolygon(proj.pos, isl.points));

    if (isBomb) {
      // 1. Initial High-Intensity Shockwave Ring
      this.particles.push({
        id: `bomb-shock-${Date.now()}`,
        x: proj.pos.x,
        y: proj.pos.y,
        vx: 0,
        vy: 0,
        life: 0.65,
        maxLife: 0.65,
        radius: proj.blastRadius * 1.5,
        color: '#FF6D00',
        type: 'shockwave',
        shape: 'ring',
      });

      // 2. High-heat rolling fireball core (烈焰向外翻滾膨脹)
      for (let f = 0; f < 4; f++) {
        const fAng = (f * Math.PI) / 2 + Math.random() * 0.5;
        const fSpd = 14 + Math.random() * 22;
        this.particles.push({
          id: `bomb-fire-${Date.now()}-${f}`,
          x: proj.pos.x + (Math.random() - 0.5) * 8,
          y: proj.pos.y + (Math.random() - 0.5) * 8,
          vx: Math.cos(fAng) * fSpd,
          vy: Math.sin(fAng) * fSpd,
          life: 0.55 + Math.random() * 0.3,
          maxLife: 0.85,
          radius: 14 + Math.random() * 12,
          color: f % 2 === 0 ? '#FF3D00' : '#FFD54F',
          type: 'fire',
        });
      }

      // 3. Billowing dark explosion smoke clouds (滾滾灰黑濃煙)
      for (let s = 0; s < 3; s++) {
        this.particles.push({
          id: `bomb-smoke-${Date.now()}-${s}`,
          x: proj.pos.x + (Math.random() - 0.5) * 16,
          y: proj.pos.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 8,
          vy: -10 - Math.random() * 16,
          life: 1.6 + Math.random() * 0.8,
          maxLife: 2.4,
          radius: 16 + Math.random() * 14,
          color: 'rgba(22, 26, 32, 0.85)',
          type: 'smoke',
        });
      }

      if (onIsland) {
        // 地面炸彈：噴濺碎石與土石破片
        for (let d = 0; d < 6; d++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 40 + Math.random() * 70;
          this.particles.push({
            id: `bomb-dirt-${Date.now()}-${d}`,
            x: proj.pos.x,
            y: proj.pos.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.7,
            maxLife: 0.7,
            radius: 8 + Math.random() * 8,
            color: '#8D6E63',
            type: 'smoke',
          });
        }
      } else {
        // 海面炸彈：巨型沖天水柱與環形浮沫
        this.particles.push({
          id: `bomb-geyser-${Date.now()}`,
          x: proj.pos.x,
          y: proj.pos.y,
          vx: 0,
          vy: 0,
          life: 1.1,
          maxLife: 1.1,
          radius: Math.max(36, proj.blastRadius * 0.95),
          color: '#E0F7FA',
          type: 'geyser',
        });
        this.particles.push({
          id: `bomb-splash-foam-${Date.now()}`,
          x: proj.pos.x,
          y: proj.pos.y,
          vx: 0,
          vy: 0,
          life: 1.4,
          maxLife: 1.4,
          radius: Math.max(30, proj.blastRadius * 0.8),
          color: 'rgba(255, 255, 255, 0.75)',
          type: 'splash',
          shape: 'ring',
        });
      }
    } else {
      this.particles.push({
        id: `shock-${Date.now()}`,
        x: proj.pos.x,
        y: proj.pos.y,
        vx: 0,
        vy: 0,
        life: 0.5,
        maxLife: 0.5,
        radius: proj.blastRadius * 1.35,
        color: isTorpedo ? '#80DEEA' : '#FFA726',
        type: 'shockwave',
        shape: 'ring',
      });
    }
    const candidateShips = directHitShip ? [directHitShip] : (proj.side === 'player' ? this.enemyShips : this.playerShips);
    let anyHit = false;

    for (const ship of candidateShips) {
      if (ship.isSunk) continue;

      // 潛水艇處於深潛狀態：艦砲砲彈與機槍掃射穿入水中瞬間破裂，完全無法傷及深潛潛艦
      // 必須仰賴深水炸彈 (Depth Charges) 或魚雷 (Torpedoes)！
      if (ship.type === 'submarine' && (proj.type === 'shell' || proj.type === 'bullet')) {
        continue;
      }

      const hullDist = distToShipHull(proj.pos, ship);
      const directHitThreshold = ship.width * 0.75 + 14;
      const nearMissThreshold = proj.blastRadius + ship.width * 0.75;

      if (hullDist <= directHitThreshold || (directHitShip && directHitShip.id === ship.id)) {
        anyHit = true;
        // ════ 系統自動擲骰判定 (AUTOMATIC COMBAT DICE ROLL) ════
        let isCrit = false;
        let rollVal = 0;
        let rollTarget = 0;
        let dieType: 'd100' | 'd20' = 'd100';
        let rollDesc = '';

        if (isBomb) {
          dieType = 'd100';
          rollVal = Math.floor(Math.random() * 100) + 1;
          rollTarget = 45;
          isCrit = rollVal >= 80;
          rollDesc = `D100投彈命中擲骰: ${rollVal} vs 門檻 45 [${isCrit ? '致命爆擊貫穿' : '直接命中'}]`;
        } else if (isTorpedo) {
          dieType = 'd100';
          rollVal = Math.floor(Math.random() * 100) + 1;
          rollTarget = 38;
          isCrit = rollVal >= 85;
          rollDesc = `D100雷擊引信擲骰: ${rollVal} vs 門檻 38 [${isCrit ? '撕裂龍骨爆擊' : '水線破甲'}]`;
        } else if (proj.type === 'rocket') {
          dieType = 'd20';
          rollVal = Math.floor(Math.random() * 20) + 1;
          rollTarget = 10;
          isCrit = rollVal >= 19;
          rollDesc = `D20火箭齊射擲骰: ${rollVal} vs DC 10 [${isCrit ? '上層建築暴擊' : '命中'}]`;
        } else if (proj.type === 'shell') {
          dieType = 'd20';
          rollVal = Math.floor(Math.random() * 20) + 1;
          rollTarget = 11;
          isCrit = rollVal >= 19;
          rollDesc = `D20艦砲彈道擲骰: ${rollVal} vs DC 11 [${isCrit ? '核心艙爆擊' : '貫穿裝甲'}]`;
        }

        const isArmorPiercingBomb = isBomb && (proj.bombType === 'bomb_1000' || proj.bombType === 'bomb_1600');
        const effectiveArmor = isTorpedo
          ? (ship.armor || 0) * 0.35
          : isArmorPiercingBomb
          ? (ship.armor || 0) * 0.45
          : (ship.armor || 0) * 0.75;

        const critMultiplier = isCrit ? 1.45 : 1.0;
        const dmgMultiplier = (1 - effectiveArmor) * critMultiplier;
        const actualDmg = Math.round(proj.damage * dmgMultiplier);

        // 確保雙重血條數值正確初始化
        if (ship.weaponControlHealth === undefined) ship.weaponControlHealth = ship.health;
        if (ship.hullCrewHealth === undefined) ship.hullCrewHealth = ship.health;
        if (ship.maxWeaponControlHealth === undefined) ship.maxWeaponControlHealth = ship.maxHealth;
        if (ship.maxHullCrewHealth === undefined) ship.maxHullCrewHealth = ship.maxHealth;

        // ══════════════════════════════════════════════════════════
        // 雙血條受損分流核心邏輯 (Dual-HP Damage Routing):
        // 1. 炸彈 / 俯衝火箭 (由上往下攻擊)：大多毀損武器指管系統 (WCS)
        // 2. 艦砲砲擊：兩者皆會影響 (貫穿甲板與艦體)
        // 3. 雷擊戰 / 深水炸彈：直接穿透水線戳穿艦體與人員 (HCS)
        // ══════════════════════════════════════════════════════════
        let wcsDmg = 0;
        let hcsDmg = 0;

        if (isBomb || proj.type === 'rocket') {
          wcsDmg = Math.round(actualDmg * (isBomb ? 0.95 : 0.85));
          hcsDmg = Math.round(actualDmg * (isBomb ? 0.35 : 0.25));
        } else if (proj.type === 'shell') {
          wcsDmg = Math.round(actualDmg * 0.70);
          hcsDmg = Math.round(actualDmg * 0.65);
        } else if (isTorpedo || proj.type === 'depth_charge' || proj.type === 'hedgehog') {
          hcsDmg = Math.round(actualDmg * 1.25);
          wcsDmg = Math.round(actualDmg * 0.20);
        } else {
          wcsDmg = Math.round(actualDmg * 0.5);
          hcsDmg = Math.round(actualDmg * 0.5);
        }

        ship.weaponControlHealth = Math.max(0, ship.weaponControlHealth - wcsDmg);
        ship.hullCrewHealth = Math.max(0, ship.hullCrewHealth - hcsDmg);
        ship.health = ship.hullCrewHealth; // 人員艦體狀態歸零才會沉沒

        // Visual effects for Direct Hit: intense explosion fireball and metal sparks
        for (let s = 0; s < 7; s++) {
          this.particles.push({
            id: `shrap-${Date.now()}-${s}`,
            x: proj.pos.x,
            y: proj.pos.y,
            vx: (Math.random() - 0.5) * 90,
            vy: (Math.random() - 0.5) * 90,
            life: 0.65,
            maxLife: 0.65,
            radius: 4.5,
            color: '#FFE082',
            type: 'spark',
          });
        }

        // Add Battle Log
        const attacker = proj.attackerName || (proj.side === 'player' ? '海軍航空隊' : '敵機');
        const targetShipName = ship.codeName || ship.name;

        if (isBomb) {
          this.addCombatLog({
            category: 'air',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: targetShipName,
            actionType: isCrit ? 'bomb_crit' : 'bomb_hit',
            isCrit,
            damage: actualDmg,
            diceRoll: {
              dieType,
              roll: rollVal,
              targetScore: rollTarget,
              result: isCrit ? 'crit' : 'hit',
              rollDesc,
            },
            text: isCrit
              ? `🎲【致命穿甲爆擊 D100: ${rollVal} / 門檻 ${rollTarget}】${attacker} 航彈直穿「${targetShipName}」防護甲板引爆彈藥庫！造成 ${actualDmg} 點毀滅性打擊！`
              : `🎲【穿甲直接命中 D100: ${rollVal} / 門檻 ${rollTarget}】${attacker} 航空炸彈直接命中「${targetShipName}」艦體！造成 ${actualDmg} 點致命重創！`,
          });
        } else if (isTorpedo) {
          this.addCombatLog({
            category: 'air',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: targetShipName,
            actionType: 'torpedo_hit',
            isCrit,
            damage: actualDmg,
            diceRoll: {
              dieType,
              roll: rollVal,
              targetScore: rollTarget,
              result: isCrit ? 'crit' : 'hit',
              rollDesc,
            },
            text: isCrit
              ? `🦈🎲【魚雷撕裂龍骨暴擊 D100: ${rollVal}】${attacker} 魚雷重擊撕裂「${targetShipName}」龍骨造成嚴重進水！造成 ${actualDmg} 點毀滅傷害！`
              : `🦈🎲【水線魚雷直接重創 D100: ${rollVal} / 門檻 ${rollTarget}】${attacker} 魚雷撕裂「${targetShipName}」水線下防雷隔艙！造成 ${actualDmg} 點打擊！`,
          });
        } else if (proj.type === 'hedgehog') {
          this.addCombatLog({
            category: 'naval',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: targetShipName,
            actionType: 'gun_hit',
            isCrit: true,
            damage: actualDmg,
            diceRoll: {
              dieType: 'd100',
              roll: 96,
              targetScore: 40,
              result: 'crit',
              rollDesc: '刺蝟彈撞擊引信接觸引爆',
            },
            text: `🦔💥【刺蝟砲直接接觸引爆】${attacker} 接觸「${targetShipName}」耐壓殼引爆！造成 ${actualDmg} 點致命水下穿甲重創！`,
          });
        } else if (proj.type === 'rocket') {
          this.addCombatLog({
            category: 'air',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: targetShipName,
            actionType: 'rocket_hit',
            isCrit,
            damage: actualDmg,
            diceRoll: {
              dieType,
              roll: rollVal,
              targetScore: rollTarget,
              result: isCrit ? 'crit' : 'hit',
              rollDesc,
            },
            text: `🚀🎲【火箭彈齊射擲骰 D20: ${rollVal} vs DC ${rollTarget}】${attacker} HVAR 火箭命中「${targetShipName}」上層建築！造成 ${actualDmg} 點破壞！`,
          });
        } else if (proj.type === 'shell') {
          this.addCombatLog({
            category: 'naval',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: targetShipName,
            actionType: 'gun_hit',
            isCrit,
            damage: actualDmg,
            diceRoll: {
              dieType,
              roll: rollVal,
              targetScore: rollTarget,
              result: isCrit ? 'crit' : 'hit',
              rollDesc,
            },
            text: `🎯🎲【艦砲彈道擲骰 D20: ${rollVal} vs DC ${rollTarget}】艦砲齊射貫穿「${targetShipName}」外裝甲！造成 ${actualDmg} 點傷害！`,
          });
        }

        if ((ship.hullCrewHealth !== undefined ? ship.hullCrewHealth : ship.health) <= 0 && !ship.isSunk) {
          this.sinkShip(ship);
        }
      } else if (isBomb && hullDist <= nearMissThreshold) {
        // ════ NEAR MISS (近失彈破片與劇烈水柱震盪 擲骰判定) ════
        anyHit = true;
        const nearMissDmg = Math.round(proj.damage * 0.22);
        if (ship.weaponControlHealth !== undefined) {
          ship.weaponControlHealth = Math.max(0, ship.weaponControlHealth - Math.round(nearMissDmg * 0.85));
        }
        if (ship.hullCrewHealth !== undefined) {
          ship.hullCrewHealth = Math.max(0, ship.hullCrewHealth - Math.round(nearMissDmg * 0.25));
          ship.health = ship.hullCrewHealth;
        } else {
          ship.health -= nearMissDmg;
        }

        // Soaring Water Geyser Particle
        this.particles.push({
          id: `geyser-${Date.now()}`,
          x: proj.pos.x,
          y: proj.pos.y,
          vx: 0,
          vy: 0,
          life: 0.9,
          maxLife: 0.9,
          radius: 38,
          color: '#E0F7FA',
          type: 'geyser',
        });

        const nearRoll = Math.floor(Math.random() * 45) + 25;
        const attacker = proj.attackerName || '我方戰機';
        const targetShipName = ship.codeName || ship.name;
        this.addCombatLog({
          category: 'air',
          sourceSide: proj.side,
          sourceName: attacker,
          targetName: targetShipName,
          actionType: 'bomb_near_miss',
          damage: nearMissDmg,
          diceRoll: {
            dieType: 'd100',
            roll: nearRoll,
            targetScore: 25,
            result: 'near_miss',
            rollDesc: `D100近失衝擊擲骰: ${nearRoll}`,
          },
          text: `💦🎲【近失彈水壓衝擊 D100: ${nearRoll}】${attacker} 炸彈落入「${targetShipName}」艦側海面，劇烈沖天水柱與爆破震盪造成 ${nearMissDmg} 點破片傷害！`,
        });

        if ((ship.hullCrewHealth !== undefined ? ship.hullCrewHealth : ship.health) <= 0 && !ship.isSunk) {
          this.sinkShip(ship);
        }
      }
    }

    // Complete miss in open water: spawn massive water geyser
    if (!anyHit && isBomb) {
      this.particles.push({
        id: `geyser-${Date.now()}`,
        x: proj.pos.x,
        y: proj.pos.y,
        vx: 0,
        vy: 0,
        life: 0.85,
        maxLife: 0.85,
        radius: 34,
        color: '#E0F7FA',
        type: 'geyser',
      });
    }

    // ══════════════════════════════════════════════════════════
    // 地面陸軍部隊受損運算 (Ground Unit Damage & Dual Parameters)
    // 1. 建制度 (STR / Health): 戰壕、散兵坑與裝甲掩蔽大幅吸收破片傷害 (直擊傷害折減)
    // 2. 組織度 (ORG / Morale): 猛烈航彈爆震與破片引發嚴重震盪恐慌、通信中斷與士氣受挫
    // ══════════════════════════════════════════════════════════
    for (const unit of this.groundUnits) {
      if (unit.isDestroyed || unit.embarkedInShipId) continue;
      if (unit.side !== proj.side && dist(proj.pos, unit.pos) <= proj.blastRadius + 24) {
        const attacker = proj.attackerName || (proj.side === 'player' ? '特遣航空隊' : '敵機');
        const unitArmor = unit.armor || 0.25;

        // 史實掩蔽減傷: 地面掩體與散兵坑使直接生命值(建制度)傷害大幅減少 (35%~45% 實質折減)
        // 建制傷害隨組織度下降微幅提升 (組織度低於50%時最多增加50%建制傷害)
        // 城市戰掩體防護: 部隊在城市/城鎮/定居點內享空襲航彈減傷 70% (受擊僅30%)、重砲直射減傷 50%
        const coverReduction = proj.type === 'bomb' ? 0.38 : proj.type === 'rocket' ? 0.45 : 0.60;
        const currentOrg = unit.organization ?? 100;
        const orgDmgScale = currentOrg < 50 ? 1.0 + 0.5 * (1.0 - currentOrg / 50) : 1.0;
        const urbanCoverMod = unit.isInUrbanCover
          ? (proj.type === 'bomb' || proj.type === 'rocket' ? 0.30 : 0.50)
          : 1.0;
        const physicalDmg = Math.round(proj.damage * (1 - unitArmor * 0.4) * coverReduction * orgDmgScale * urbanCoverMod);
        unit.health = Math.max(0, unit.health - physicalDmg);
        unit.strength = Math.max(0, Math.round((unit.health / unit.maxHealth) * 100));

        // 爆震與彈幕對「組織度」造成劇烈震盪衝擊
        const baseOrgDmg = proj.type === 'bomb' ? 24 : proj.type === 'rocket' ? 18 : 12;
        const orgLoss = Math.min(60, Math.round((baseOrgDmg + (proj.damage / 50)) * (unit.isInUrbanCover ? 0.45 : 1.0)));
        unit.organization = Math.max(0, (unit.organization ?? 100) - orgLoss);

        if (unit.organization < 20) {
          unit.disorganized = true;
        }

        // 火力壓制值 (Suppression) 判定: 航彈/火箭/砲火覆蓋帶來 30%~80% 速度懲罰
        const hitSuppression = proj.type === 'bomb' ? 45 : proj.type === 'rocket' ? 35 : 25;
        unit.suppression = Math.min(100, (unit.suppression || 0) + hitSuppression);
        unit.suppressionTimer = 6.0;
        unit.isSuppressed = unit.suppression >= 30;
        unit.isPinned = unit.suppression >= 75;

        // Combat Log 戰況播報
        this.addCombatLog({
          category: proj.type === 'bomb' ? 'air' : 'naval',
          sourceSide: proj.side,
          sourceName: attacker,
          targetName: unit.name,
          actionType: proj.type === 'bomb' ? 'bomb_hit' : 'gun_hit',
          damage: physicalDmg,
          text: `💥【火力覆蓋震盪】${attacker} 火力落入「${unit.name}」陣地！工事吸收部分殺傷 (-${physicalDmg} HP / 建制度 ${unit.strength}%)，劇烈爆震使部隊士氣受挫 (組織度 -${orgLoss}% -> ${Math.round(unit.organization)}%)！`,
        });

        // 建制度過低 (STR / Health 歸零) -> 徹底消滅瓦解
        if (unit.health <= 0 || unit.strength <= 0) {
          unit.isDestroyed = true;
          soundEngine.playExplosion(false);
          if (unit.side === 'enemy') {
            this.casualties.enemyGroundLost++;
            this.resourcePoints += 40;
            this.totalCpEarned += 40;
          } else {
            this.casualties.playerGroundLost++;
          }
          this.addCombatLog({
            category: 'naval',
            sourceSide: proj.side,
            sourceName: attacker,
            targetName: unit.name,
            actionType: 'gun_hit',
            damage: physicalDmg,
            text: `💥【建制徹底瓦解】「${unit.name}」兵員武器遭受毀滅性重創，建制度歸零，整支部隊被全殲消滅！`,
          });
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // 地面固定設施受擊運算 (Fixed Installations Air Defense & Dispersion)
    // 1. 史實判定: 高空或俯衝轟炸對掩體/掩蔽固定工事有天然散佈誤差，不一定每次空襲都成功直擊
    // 2. 混凝土/沙袋裝甲工事加成: 大幅吸收衝擊波，避免一擊必殺
    // 3. 雙方皆可受損 (支援友軍設施防衛與敵軍要塞攻略)
    // ══════════════════════════════════════════════════════════
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed) continue;
        if (inst.side === proj.side) continue; // 攻擊敵方陣地設施

        if (dist(proj.pos, inst.pos) <= proj.blastRadius + 26) {
          const attacker = proj.attackerName || (proj.side === 'player' ? '特遣航空隊' : '敵空襲機隊');
          const isBomb = proj.type === 'bomb';

          if (isBomb) {
            // 史實投彈散佈與掩體直擊擲骰判定 (D100)
            const roll = Math.floor(Math.random() * 100) + 1;
            // 俯衝轟炸機 (SBD/SB2C/Val/Judy) 45% 直擊頂蓋；水平重轟 (B-17/B-24/G4M) 25%；其他 35%
            const isDiveBomber = proj.sourceModel === 'sbd' || proj.sourceModel === 'sb2c' || proj.sourceModel === 'val' || proj.sourceModel === 'judy';
            const isHeavyLevelBomber = proj.sourceModel === 'b17' || proj.sourceModel === 'b24' || proj.sourceModel === 'g4m';
            const hitThreshold = isDiveBomber ? 55 : isHeavyLevelBomber ? 75 : 65;

            const isDirectPenetration = roll >= hitThreshold;
            const isApBomb = proj.bombType === 'bomb_1000' || proj.bombType === 'bomb_1600';
            const armorFactor = inst.armor !== undefined ? inst.armor : 0.45;

            if (isDirectPenetration) {
              // 直擊貫穿掩體: 專用穿甲航彈發揮穿透力，但加固工事仍提供防禦
              const effectiveArmor = isApBomb ? armorFactor * 0.4 : armorFactor * 0.8;
              const actualDmg = Math.round(proj.damage * (1 - effectiveArmor));
              inst.health -= actualDmg;

              soundEngine.playExplosion(true);
              this.addCombatLog({
                category: 'air',
                sourceSide: proj.side,
                sourceName: attacker,
                targetName: inst.name,
                actionType: 'bomb_hit',
                damage: actualDmg,
                diceRoll: {
                  dieType: 'd100',
                  roll,
                  targetScore: hitThreshold,
                  result: isApBomb ? 'crit' : 'hit',
                  rollDesc: `D100工事直擊檢定: ${roll} vs 門檻 ${hitThreshold} [${isApBomb ? '超重AP穿甲直擊' : '頂蓋穿透直擊'}]`,
                },
                text: `🎯🎲【工事頂蓋直擊 D100: ${roll} / 門檻 ${hitThreshold}】${attacker} 航彈精準洞穿「${inst.name}」混凝土工事頂部！造成 ${actualDmg} 點直擊重創！`,
              });
            } else {
              // 史實近失/沙袋土堤吸收衝擊 (二戰空襲不一定成功秒殺): 航彈落入土堤周圍
              const actualDmg = Math.round(proj.damage * 0.22); // 大幅減免，僅承受震盪與破片
              inst.health -= actualDmg;
              // 衝擊波暫時壓制設施運作 (冷卻延遲 3.5秒)
              inst.cooldown = Math.max(inst.cooldown, 3.5);

              // 激起大量沙土珊瑚碎石粒子
              for (let d = 0; d < 5; d++) {
                this.particles.push({
                  id: `dirt-${Date.now()}-${d}`,
                  x: inst.pos.x + (Math.random() - 0.5) * 30,
                  y: inst.pos.y + (Math.random() - 0.5) * 30,
                  vx: (Math.random() - 0.5) * 60,
                  vy: (Math.random() - 0.5) * 60,
                  life: 0.6,
                  maxLife: 0.6,
                  radius: 12,
                  color: '#BCAAA4',
                  type: 'smoke',
                });
              }

              this.addCombatLog({
                category: 'air',
                sourceSide: proj.side,
                sourceName: attacker,
                targetName: inst.name,
                actionType: 'bomb_near_miss',
                damage: actualDmg,
                diceRoll: {
                  dieType: 'd100',
                  roll,
                  targetScore: hitThreshold,
                  result: 'near_miss',
                  rollDesc: `D100土堤偏斜檢定: ${roll} vs 門檻 ${hitThreshold} [掩體吸收衝擊]`,
                },
                text: `🛡️🎲【掩體防護/散佈偏斜 D100: ${roll} / 門檻 ${hitThreshold}】${attacker} 航彈落於「${inst.name}」土堤外側！掩體沙袋大幅吸收爆風 (-${actualDmg} HP)，砲位暫時受震壓制！`,
              });
            }
          } else {
            // 火箭彈或艦砲砲擊: 計算裝甲減傷
            const armorFactor = inst.armor !== undefined ? inst.armor : 0.45;
            const actualDmg = Math.round(proj.damage * (1 - armorFactor * 0.7));
            inst.health -= actualDmg;

            this.addCombatLog({
              category: proj.type === 'rocket' ? 'air' : 'naval',
              sourceSide: proj.side,
              sourceName: attacker,
              targetName: inst.name,
              actionType: proj.type === 'rocket' ? 'rocket_hit' : 'gun_hit',
              damage: actualDmg,
              text: `💥【工事砲火壓制】${attacker} 命中「${inst.name}」！造成 ${actualDmg} 點傷害！`,
            });
          }

          if (inst.health <= 0) {
            if (inst.side === 'enemy') {
              this.destroyInstallation(inst);
            } else {
              inst.isDestroyed = true;
              this.casualties.playerInstallationsLost++;
              soundEngine.playExplosion(true);
              this.addBannerAlert(`🚨【重要設施被毀】我方「${inst.name}」遭受敵空襲轟炸摧毀！`, 'player', 'sunk', 6.0);
              this.addCombatLog({
                category: 'sunk',
                sourceSide: proj.side,
                sourceName: attacker,
                targetName: inst.name,
                actionType: 'installation_down',
                text: `🚨【友軍設施遭毀】我方重要島嶼設施「${inst.name}」在敵猛烈空襲下被徹底摧毀！`,
              });
            }
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    // 平民設施與難民營附帶損害檢驗 (Civilian & Refugee Collateral Damage)
    // 誤擊平民區或難民收容營扣除 15 CP，並觸發司令部軍紀訓誡
    // ══════════════════════════════════════════════════════════
    if (proj.side === 'player') {
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (inst.isCivilian && !inst.isDestroyed) {
            const zR = inst.civilianZoneRadius || 160;
            if (dist(proj.pos, inst.pos) <= zR) {
              this.triggerCivilianCollateralPenalty(inst, proj.attackerName || '我方戰機 / 艦砲');
            }
          }
        }
      }
    }
  }

  private sinkShip(ship: Ship) {
    if (ship.isSunk && ship.magazineDetonated) return;
    ship.isSunk = true;
    ship.sinkProgress = 0;
    ship.isBrokenInTwo = true;
    ship.breakProgress = 0;
    ship.breakLineOffset = (Math.random() - 0.5) * 0.16;
    ship.bowAngleOffset = -0.04;
    ship.sternAngleOffset = 0.04;
    ship.magazineDetonated = true;
    ship.magazineFlashTimer = 0.6;

    soundEngine.playExplosion(true);

    // 災難性彈藥庫殉爆衝擊波 (Catastrophic Magazine Detonation Shockwave)
    this.particles.push({
      id: `mag-blast-${Date.now()}`,
      x: ship.pos.x,
      y: ship.pos.y,
      vx: 0,
      vy: 0,
      life: 1.2,
      maxLife: 1.2,
      radius: Math.max(65, ship.length * 1.5),
      color: '#FF3D00',
      type: 'shockwave',
      shape: 'ring',
    });

    // 殉爆巨型火球與四散艦體殘骸 (Debris & Fiery Ejecta)
    for (let f = 0; f < 10; f++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 80;
      this.particles.push({
        id: `mag-shrap-${Date.now()}-${f}`,
        x: ship.pos.x + (Math.random() - 0.5) * 20,
        y: ship.pos.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.4,
        radius: 4.5,
        color: Math.random() > 0.4 ? '#FFE082' : '#FF5722',
        type: 'shrapnel',
      });
    }

    // 兩截斷裂處噴發高空重油黑煙柱 (Heavy Black Smoke from Fracture)
    for (let s = 0; s < 6; s++) {
      this.particles.push({
        id: `mag-smoke-${Date.now()}-${s}`,
        x: ship.pos.x + (Math.random() - 0.5) * 30,
        y: ship.pos.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 12,
        vy: -15 - Math.random() * 25,
        life: 2.5 + Math.random() * 1.2,
        maxLife: 3.7,
        radius: 18 + Math.random() * 16,
        color: 'rgba(20, 24, 30, 0.88)',
        type: 'smoke',
      });
    }

    const shipName = ship.codeName || ship.name;
    const tonnage =
      ship.type === 'carrier'
        ? 32000
        : ship.type === 'battleship'
        ? 45000
        : ship.type === 'cruiser'
        ? 12500
        : ship.type === 'destroyer'
        ? 2200
        : ship.type === 'submarine'
        ? 1500
        : 3500;

    if (ship.side === 'enemy') {
      this.score.enemyShipsSunk++;
      this.casualties.enemyShipsLost++;
      this.casualties.enemyTonnageLost += tonnage;

      const points = ship.type === 'carrier' ? 1000 : ship.type === 'battleship' ? 800 : 400;
      const stars = ship.type === 'carrier' ? 4 : 2;
      const cpAward = ship.type === 'carrier' ? 750 : ship.type === 'battleship' ? 600 : ship.type === 'cruiser' ? 350 : 200;
      this.score.totalScore += points;
      this.score.stars += stars;
      this.resourcePoints += cpAward;
      this.totalCpEarned += cpAward;

      this.addBannerAlert(
        `⚓【重大擊沉戰報】敵艦「${shipName}」(${ship.type.toUpperCase()}) 徹底沉沒！獲得 +${cpAward} CP`,
        'enemy',
        'sunk',
        7.5
      );
      this.addCombatLog({
        category: 'sunk',
        sourceSide: 'player',
        sourceName: '特混艦隊',
        targetName: shipName,
        actionType: 'ship_sunk',
        text: `⚓【重大擊沉戰報】敵艦「${shipName}」(${ship.type.toUpperCase()}) 發生災難性殉爆，徹底沉沒！排水量 ${tonnage.toLocaleString()}噸 沉入海底！獲取 +${points} 分，★+${stars} 星，+${cpAward} CP！`,
      });
    } else {
      this.casualties.playerShipsLost++;
      this.casualties.playerTonnageLost += tonnage;
      this.addBannerAlert(`🚨【旗艦警報】我方主力艦艇「${shipName}」遭受致命打擊沉沒！`, 'player', 'sunk', 7.5);
      this.addCombatLog({
        category: 'sunk',
        sourceSide: 'enemy',
        sourceName: '敵方艦隊',
        targetName: shipName,
        actionType: 'ship_sunk',
        text: `🚨【警報！友軍艦艇沉沒】我方主力艦艇「${shipName}」(${tonnage.toLocaleString()}噸) 遭受致命打擊沉沒！`,
      });
    }
  }

  private destroyInstallation(inst: Installation) {
    inst.isDestroyed = true;
    soundEngine.playExplosion(true);
    this.score.installationsDestroyed++;
    this.casualties.enemyInstallationsLost++;
    const points = 250;
    const stars = 1;
    const cpAward = 120;
    this.score.totalScore += points;
    this.score.stars += stars;
    this.resourcePoints += cpAward;
    this.totalCpEarned += cpAward;

    this.addBannerAlert(`💥【要塞攻陷】敵「${inst.name}」已被我軍徹底摧毀！獲得 +${cpAward} CP`, 'enemy', 'capture', 5.5);
    this.addCombatLog({
      category: 'sunk',
      sourceSide: 'player',
      sourceName: '航空打擊群',
      targetName: inst.name,
      actionType: 'installation_down',
      text: `💥【要塞攻陷】敵方重要岸防設施「${inst.name}」已被我軍徹底摧毀！獲取 +${points} 分，★+1 星，+${cpAward} CP！`,
    });
  }

  private findTargetInstallation(id: string): Installation | null {
    for (const isl of this.islands) {
      const inst = isl.installations.find((i) => i.id === id && !i.isDestroyed);
      if (inst) return inst;
    }
    return null;
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += dt * 8;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private checkVictoryConditions() {
    const flagship = this.getFlagship();
    if (!flagship || flagship.isSunk) {
      this.isDefeat = true;
      return;
    }

    const enemyCarrierSunk = this.enemyShips.find((s) => s.type === 'carrier')?.isSunk ?? true;
    const enemyIslands = this.islands.filter((i) => !i.isFriendlyBase);
    const allCPsCaptured = enemyIslands.every((isl) =>
      isl.strongholds && isl.strongholds.length > 0 ? isl.strongholds.every((sh) => sh.isCaptured) : true
    );

    if (enemyCarrierSunk && allCPsCaptured && !this.isVictory) {
      this.isVictory = true;
      this.score.sectorsCleared++;
      this.score.totalScore += 2500;
      this.score.stars += 8;
      this.addCombatLog({
        category: 'sunk',
        sourceSide: 'player',
        sourceName: '特混艦隊全體海空官兵',
        targetName: '戰區全域',
        actionType: 'recon_spotted',
        text: `🏆【戰役大捷！全島解放！】敵艦隊航母主力已遭全殲，群島全部指揮所據點已徹底肅清解放！美利堅海軍陸戰隊與特遣艦隊大獲全勝！`,
      });
    }
  }
}
