import {
  Ship,
  Aircraft,
  AircraftModel,
  AircraftNation,
  AircraftRole,
  AircraftPayloadType,
  PAYLOAD_CATALOG,
  AirWingLoadout,
  Island,
  Installation,
  InstallationType,
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
  ShipSide,
  Sonobuoy,
  PendingMissileLaunch,
  AshmVariant,
  AshmFlightProfile,
  FleetUpgrades,
} from '../types/game';
import { getAlliedSagFleet } from './alliedSagFleets';
import { getNavalGunPerformance, getNavalLauncherRange } from './navalGuns';
import { getAfbModelsForEra, getCarrierModelsForEra, getCatalogRole } from './airWingCatalog';
import { AIR_WEAPON_RANGE, gameRangeFromKm, getInstallationRange } from './rangeScale';
import { getShipAshmFit, getShipSamSystem } from './navalMissileSalvos';
import { GroundWreck, leavesWreck, WRECK_LIFETIME } from './render/unitDetails';
import { AHEAD_THROWERS, hasAswWeapon, layerFactorForAircraft, layerFactorForShipSonar, layerFactorForSonobuoy, updateThermoclineDepth, STANDOFF_ASW, aircraftDetectionRange, applyHistoricalAswFit, svttLabel, depthChargePattern, enemyAswWeapon, isDieselBoat, isSurfacedBoat, shipSonar, sonarDeadZone, sonarDetectionRange, sonobuoySensitivity, updateDieselBattery } from './asw';
import { barrierStation, isStriker, selectAirTarget } from './airMissions';
import { getAircraftSpeed, isSupersonicMissile, MISSILE_SPEED, shipMapSpeed, SPECIAL_ATTACK_SPEED } from './speedScale';
import { getAircraftBaseHealth, getAircraftBaseSpeed, getAircraftGunRounds } from './aircraftStats';
import { carriesStores, getPayloadRounds, resolvePayload } from './aircraftLoadouts';

/** Piston and early-jet fighters that count as fighters even when flagged with another role. */
const GUN_FIGHTER_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['f4f', 'f6f', 'f4u', 'f8f', 'f9f', 'f2h', 'p51', 'p47', 'p38', 'p40', 'f86']);
/** Bombers and strike aircraft with a defensive rear / tail gunner. */
const TAIL_GUNNER_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['b17', 'b24', 'b29', 'a20', 'a26', 'sbd', 'sb2c', 'tbd', 'tbf', 'val', 'kate', 'judy', 'jill', 'g4m', 'tu14', 'il10']);
/** BLUFOR / allied fighters that engage with air-to-air missiles. */
const FRIENDLY_MISSILE_FIGHTER_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['f14a', 'f15a', 'f16a', 'fa18a', 'f4e', 'f4b', 'f4j', 'f8', 'tornado_adv', 'f4f_phantom', 'mirage2000', 'mirage3', 'hunter_fga9']);
/** Aircraft armed with a rotary / high-rate internal cannon. */
const ROTARY_CANNON_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['f14a', 'f15a', 'f16a', 'fa18a', 'su27', 'mig29a', 'f4e', 'f105', 'a7', 'ah1', 'f8', 'mig21']);
/** Attack / support aircraft able to strafe ground targets at low level. */
const GROUND_STRAFING_MODELS: ReadonlySet<AircraftModel> = new Set<AircraftModel>(['ah1', 'ov10', 'a4', 'a6a', 'a7', 'f105', 'ad1', 'a20', 'a26', 'su7', 'il10', 'p47']);

type CombatTargetEntity = Ship | Aircraft | GroundUnit | Installation;
type RadarTargetEntity = Installation | Ship | GroundUnit;
import {
  generateSector,
  isPointInPolygon,
  isPointOnIslandLand,
  dist,
  distToShipHull,
  createGroundUnit,
  createLCVP,
  createLST,
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
  createChokaiCA,
  createSendaiCL,
  createKongoBB,
  createAkizukiDD,
  createSverdlovCL,
  createKotlinDD,
  createKyndaCG,
  createPetyaFFG,
  createOsaPTG,
  createCVNNimitz,
  createTiconderogaCG,
  createVirginiaCGN,
  createIowaModernizedBB,
  createSpruanceDD,
  createKiddDDG,
  createPerryFFG,
  createLosAngelesSSN,
  createAustinLPD,
  createLCAC,
  createNewportLST,
  createKirovCGN,
  createSovremennyDD,
  createUdaloyDD,
  createOscarSSGN,
  createFoxtrotSS,
  createMonsunUBoatSS,
  createIjnIBoatSS,
  createSovietWhiskeySS,
  createSovietVictor3SSN,
  makeInstallation,
  createKiloSS,
} from './procedural';
import { NavalNavigationGrid, computeShipSeparationSteering } from './navigation';
import { soundEngine } from './audio';

export interface BattleAlertBanner {
  id: string;
  text: string;
  side: 'player' | 'enemy';
  type: 'sunk' | 'down' | 'capture' | 'winchester' | 'alert';
  duration: number;
}

/** Helicopters and STOVL jets can land on any flight deck, including amphibious ships. */
const DECK_CAPABLE_ROTARY_AND_STOVL: ReadonlySet<AircraftModel> = new Set<AircraftModel>([
  'ho3s1', 'uh2', 'sh2', 'uh1', 'ah1', 'sh3f', 'ch53', 'ch46', 'ah64a', 'ah1w', 'sh60b', 'av8b',
]);

/** Weighted pick from a small list of aircraft models, consuming one random draw. */
function pickModel(models: readonly AircraftModel[], weights: readonly number[]): AircraftModel {
  let r = Math.random();
  for (let i = 0; i < models.length - 1; i++) {
    if (r < weights[i]) return models[i];
    r -= weights[i];
  }
  return models[models.length - 1];
}

export class GameEngine {
  public sectorNumber: number = 1;
  public era: Era = 'era1';
  public worldSize: number = 4200;
  public islands: Island[] = [];
  public friendlyBase: Island | null = null;
  public playerShips: Ship[] = [];
  public alliedShips: Ship[] = [];
  public enemyShips: Ship[] = [];
  public groundUnits: GroundUnit[] = [];
  /** Burnt-out vehicles left where ground units were destroyed (render only). */
  public groundWrecks: GroundWreck[] = [];
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

  // ══════════════════════════════════════════════════════════
  // 砲兵發射聲測/雷達軌跡特徵庫 (Artillery Signatures for Counter-Battery)
  // ══════════════════════════════════════════════════════════
  public artillerySignatures: { id: string; pos: Vector2D; side: ShipSide; attackerName: string; timestamp: number; weaponType: string }[] = [];
  private sessionToken: number = 0;

  // Friendly Airbase (AFB) plane reserve pool & replenishment
  /** HQ island airfield's stock; every reinforcement, replenishment and purchase lands here first. */
  public airbasePlanes: Record<string, number> = {};
  /** Independent aircraft stock of every friendly airfield, keyed by its installation id (HQ shares airbasePlanes). */
  public airfieldPlanes: Record<string, Record<string, number>> = {};
  public hqAirfieldId = 'friendly-base-afb';
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
  public alliedSortieTimer: number = 45; // 盟軍綠色自主空軍聯隊支援計時器 (45-70s)
  public alliedSagTimer: number = 45; // 跨時代盟軍水面打擊群 (Allied SAG) 支援計時器 (初始45s，後每160s)
  public opforWolfpackTimer: number = 175; // 獨立 OPFOR 潛艦狼群增援波次計時器 (160-220s)
  public opforAswAirTimer: number = 95; // 時代四/五 OPFOR 專職反潛機隊出擊計時器
  public sonobuoys: Sonobuoy[] = [];
  public pendingMissileLaunches: PendingMissileLaunch[] = [];
  private activeSalvoLeaders: Map<string, string> = new Map();
  private scheduledActions: Array<{ delayRemaining: number; fn: () => void }> = [];
  private controlGroups: Record<string, string[]> = {};
  private enemyBeringSeaCoordTimer: number = 26; // 白令海百枚反艦飛彈飽和齊射協調計時器
  private navGrid: NavalNavigationGrid | null = null;
  private sonarLogCooldowns: Record<string, number> = {};

  private getAshmStructuralHealth(variant?: AshmVariant, speed?: number): number {
    switch (variant) {
      case 'p700_granit':
        return 225;
      case 'p500_bazalt':
        return 200;
      case 'p270_moskit':
        return 185;
      case 'kh22_burya':
        return 245;
      case 'ksr5_kelt':
        return 155;
      case 'exocet_mm40':
      case 'exocet_mm38':
        return 115;
      case 'p15_styx':
        return 105;
      case 'harpoon_rgm84':
      case 'harpoon_ugm84':
      case 'harpoon_agm84':
        return 130;
      default:
        return isSupersonicMissile(speed) ? 185 : 130;
    }
  }

  private getAshmChaffDecoyChance(proj: Projectile): number {
    const v = proj.ashmVariant;
    if (v === 'p700_granit' || v === 'p500_bazalt') {
      return proj.datalinkLost ? 0.68 : 0.34;
    }
    if (v === 'p270_moskit') return 0.30;
    if (v === 'kh22_burya') return 0.28;
    if (v === 'exocet_mm40' || v === 'exocet_mm38') return 0.52;
    if (v === 'harpoon_rgm84' || v === 'harpoon_ugm84' || v === 'harpoon_agm84') return 0.60;
    if (v === 'p15_styx' || v === 'ksr5_kelt') return 0.78;
    return isSupersonicMissile(proj.speed) ? 0.45 : 0.72;
  }

  private handleAshmLeaderDestroyed(leader: Projectile) {
    if (!leader.isLeadMissile) return;
    let affectedCount = 0;
    for (const p of this.projectiles) {
      if (!p.isDead && p.id !== leader.id && p.leadMissileId === leader.id && !p.datalinkLost) {
        p.datalinkLost = true;
        p.turnRate = Math.max(1.8, (p.turnRate || 3.6) * 0.56);
        affectedCount++;
      }
    }
    if (affectedCount > 0) {
      this.addCombatLog({
        category: 'aa',
        sourceSide: 'player',
        sourceName: '艦隊電子/防空攔截網',
        targetName: leader.attackerName || 'P-700 領航指揮彈',
        actionType: 'aa_down',
        isCrit: true,
        text: `📡💥【領彈資料鏈中斷！】高空偵察引導之蘇軍領航飛彈遭擊毀！其餘 ${affectedCount} 枚掠海跟隨彈失去目標中繼資料鏈，機動修正與抗干擾能力大幅下降！`,
      });
    }
  }

  public isHostile(sideA: ShipSide, sideB: ShipSide): boolean {
    if (sideA === sideB) return false;
    if ((sideA === 'player' || sideA === 'allied') && (sideB === 'player' || sideB === 'allied')) return false;
    if (sideA === 'neutral' || sideB === 'neutral') return false;
    return true;
  }

  public isSubmarine(s: Ship): boolean {
    return s.type === 'submarine' || s.type === 'ssn_la' || s.type === 'ssgn_oscar' || s.type === 'foxtrot';
  }
  private civilianCollateralCooldowns: Record<string, number> = {};
  // 反艦飛彈防空火網與近迫防空警報冷卻 (Anti-Ship Missile AAA Barrage & Defensive Alarm Throttling)
  private lastMissileAlarmTime: number = 0;
  private lastAaaBurstSoundTime: number = 0;

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
  public fleetUpgrades: FleetUpgrades = {
    hullArmorLevel: 1,
    aaFirepowerLevel: 1,
    radarRangeLevel: 1,
    carrierCapacityLevel: 1,
    artilleryDamageLevel: 1,
    depthChargeSonarLevel: 1,
  };
  private shipBaseStats = new WeakMap<
    Ship,
    {
      maxHealth: number;
      maxWeaponControlHealth: number;
      maxHullCrewHealth: number;
      armor: number;
      flakRange: number;
      detectionRange: number;
      sonarRange?: number;
      turretDamages: number[];
      carrierCapacityApplied: number;
    }
  >();
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
    duration: number = 5.0
  ) {
    // 依使用者指示：大幅減少上方橫列跳通知疲乏，僅保留重大戰略戰況橫條通知（主力艦擊沉、島嶼據點奪取、盟軍SAG抵達、戰略核武）
    const isStrategicEvent =
      type === 'sunk' ||
      type === 'capture' ||
      text.includes('擊沉') ||
      text.includes('沉沒') ||
      text.includes('Sunk') ||
      text.includes('佔領') ||
      text.includes('光復') ||
      text.includes('失守') ||
      text.includes('SAG') ||
      text.includes('水面打擊群') ||
      text.includes('白令海') ||
      text.includes('核') ||
      text.includes('HQ') ||
      text.includes('司令部');

    if (!isStrategicEvent) {
      // 次要戰術通知僅記錄於 Live Battle Feed 抽屜，不在頂部橫列彈出
      return;
    }

    const banner: BattleAlertBanner = {
      id: `banner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      side,
      type,
      duration,
    };
    this.activeBannerAlerts.unshift(banner);
    if (this.activeBannerAlerts.length > 2) {
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
  public opforSagTimer: number = 190; // 跨時代 OPFOR 水面打擊群 (SAG) 每 3 至 4 分鐘週期出擊

  constructor(sector: number = 1, era: Era = 'era1') {
    this.era = era;
    this.loadSector(sector, era);
  }

  public setRolePayload(role: AircraftRole, payload: AircraftPayloadType) {
    this.activePayloads[role] = payload;
  }

  public applyFleetUpgrades(upgrades: FleetUpgrades) {
    this.fleetUpgrades = { ...upgrades };
    for (const ship of this.playerShips) {
      this.applyUpgradesToShip(ship);
    }
  }

  private applyUpgradesToShip(ship: Ship) {
    if (ship.side !== 'player') return;
    let base = this.shipBaseStats.get(ship);
    if (!base) {
      base = {
        maxHealth: ship.maxHealth,
        maxWeaponControlHealth: ship.maxWeaponControlHealth ?? ship.maxHealth,
        maxHullCrewHealth: ship.maxHullCrewHealth ?? ship.maxHealth,
        armor: ship.armor,
        flakRange: ship.flakRange,
        detectionRange: ship.detectionRange,
        sonarRange: ship.sonarRange,
        turretDamages: ship.turrets.map((t) => t.damage),
        carrierCapacityApplied: 1,
      };
      this.shipBaseStats.set(ship, base);
    }

    const hullLvl = Math.max(1, this.fleetUpgrades.hullArmorLevel);
    const aaLvl = Math.max(1, this.fleetUpgrades.aaFirepowerLevel);
    const radarLvl = Math.max(1, this.fleetUpgrades.radarRangeLevel);
    const artLvl = Math.max(1, this.fleetUpgrades.artilleryDamageLevel);
    const aswLvl = Math.max(1, this.fleetUpgrades.depthChargeSonarLevel);
    const capLvl = Math.max(1, this.fleetUpgrades.carrierCapacityLevel);

    const oldMaxHp = Math.max(1, ship.maxHealth);
    const newMaxHp = Math.round(base.maxHealth * (1 + 0.1 * (hullLvl - 1)));
    ship.maxHealth = newMaxHp;
    ship.armor = Math.min(0.85, base.armor + (hullLvl - 1) * 0.06);
    if (!ship.isSunk) {
      ship.health = Math.min(newMaxHp, Math.round(ship.health * (newMaxHp / oldMaxHp)));
    }

    if (ship.maxWeaponControlHealth !== undefined && ship.weaponControlHealth !== undefined) {
      const oldWcs = Math.max(1, ship.maxWeaponControlHealth);
      const newWcs = Math.round(base.maxWeaponControlHealth * (1 + 0.1 * (hullLvl - 1)));
      ship.maxWeaponControlHealth = newWcs;
      if (!ship.isSunk) {
        ship.weaponControlHealth = Math.min(newWcs, Math.round(ship.weaponControlHealth * (newWcs / oldWcs)));
      }
    }

    if (ship.maxHullCrewHealth !== undefined && ship.hullCrewHealth !== undefined) {
      const oldHci = Math.max(1, ship.maxHullCrewHealth);
      const newHci = Math.round(base.maxHullCrewHealth * (1 + 0.1 * (hullLvl - 1)));
      ship.maxHullCrewHealth = newHci;
      if (!ship.isSunk) {
        ship.hullCrewHealth = Math.min(newHci, Math.round(ship.hullCrewHealth * (newHci / oldHci)));
      }
    }

    ship.flakRange = Math.round(base.flakRange * (1 + 0.15 * (aaLvl - 1)));
    ship.detectionRange = Math.round(base.detectionRange * (1 + 0.18 * (radarLvl - 1)));

    if (base.sonarRange !== undefined) {
      ship.sonarRange = Math.round(base.sonarRange * (1 + 0.18 * (aswLvl - 1)));
    }

    const artMult = 1 + 0.2 * (artLvl - 1);
    ship.turrets.forEach((turret, idx) => {
      const baseDmg = base.turretDamages[idx] ?? turret.damage;
      turret.damage = Math.round(baseDmg * artMult);
    });

    if (ship.carrierPlanes && capLvl > base.carrierCapacityApplied) {
      const deltaPlanes = (capLvl - base.carrierCapacityApplied) * 2;
      for (const k of Object.keys(ship.carrierPlanes.maxPerType)) {
        ship.carrierPlanes.maxPerType[k] = (ship.carrierPlanes.maxPerType[k] || 6) + deltaPlanes;
        ship.carrierPlanes.ready[k] = (ship.carrierPlanes.ready[k] || 0) + deltaPlanes;
      }
      base.carrierCapacityApplied = capLvl;
    }
  }

  public loadSector(sectorNum: number, era: Era = this.era) {
    this.sectorNumber = sectorNum;
    this.era = era;
    const generated = generateSector(sectorNum, era);
    this.worldSize = generated.worldSize;
    this.islands = generated.islands;
    this.applyHistoricalInstallationRanges();
    this.friendlyBase = generated.friendlyBase;
    this.playerShips = generated.playerShips;
    this.alliedShips = [];
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
    this.sessionToken++;
    this.islandsVersion++;
    this.selectedUnitIds = [];
    this.nuclearFlash = 0;
    this.nuclearDetonations = [];
    this.hasPlayerUsedNuke = false;
    this.hasOpforRetaliatedNuke = false;
    this.opforNukeCheckTimer = 0;
    this.artillerySignatures = [];
    this.hasAD3WOnStation = false;
    this.sonarLogCooldowns = {};
    this.sonobuoys = [];
    this.pendingMissileLaunches = [];
    this.activeSalvoLeaders.clear();
    this.scheduledActions = [];
    this.controlGroups = {};
    this.enemyBeringSeaCoordTimer = 26;
    this.navGrid = new NavalNavigationGrid(this.worldSize, this.islands, 110);

    // 確保初始潛艦進入水下靜默隱蔽 (Fog of War Stealth Defaults)
    for (const s of [...this.playerShips, ...this.enemyShips]) {
      if (this.isSubmarine(s)) {
        s.isSubmerged = true;
        s.isSpotted = false;
        s.spottedTimer = 0;
        s.isSpottedByEnemy = false;
        s.enemySpottedTimer = 0;
      }
    }
    this.playerShips.forEach((s) => this.applyUpgradesToShip(s));

    // Initialize friendly airbase planes & replenishment timers (包含水平轟炸機、陸基戰鬥機、陸基攻擊機)
    this.airbasePlanes =
      this.era === 'era1'
        ? { b17: 6, b25: 6, p40: 8, p36a: 8, p39d: 6, a20: 6, f4f: 8, sbd: 8, tbd: 6, os2u: 2, c47: 4, pby: 3 }
        : this.era === 'era2'
        ? { b24: 6, b17_late: 6, p51: 8, p47: 6, p38: 4, f6f: 10, f4u: 8, sb2c: 8, tbf: 8, sc1: 2, c47: 4, pby: 3 }
        : this.era === 'era3'
        ? { b29: 6, f86: 8, f84: 8, f82: 6, a26: 6, f9f: 8, f2h: 6, ad1: 8, f4u4: 6, af_guardian: 4, ad3w: 2, ho3s1: 2, c47: 4 }
        : this.era === 'era4'
        ? { b52: 4, f4e: 8, f105: 8, f100: 6, ac47: 2, ch46: 4, a7: 8, a1h: 6, a37b: 6, f5a: 6, f104g: 6, ov10: 6, uh1: 6, ah1: 6, f4j: 6, a6a: 6, e1: 2, c1: 4 }
        : { b52: 4, f111: 4, a10a: 8, ah64a: 6, ah1w: 6, f15a: 8, f16a: 8, e3a: 2, c130: 4, f14a: 10, fa18a: 8, a6e: 6, s3a: 4, e2c: 2, ea6b: 4, av8b: 6, ch53: 4, sh3f: 4, c2a: 4 };
    this.hqAirfieldId =
      this.friendlyBase?.installations.find((inst) => inst.type === 'airfield' && inst.side === 'player')?.id ?? 'friendly-base-afb';
    this.airfieldPlanes = { [this.hqAirfieldId]: this.airbasePlanes };
    this.airbaseReplenishTimer = this.airbaseReplenishMax;
    this.convoyReinforceTimer = this.convoyReinforceMax;
    this.tokyoExpressTimer = 120;
    this.opforSagTimer = 180 + Math.random() * 40; // 3 to 4 minutes initial SAG sortie
    this.opforWolfpackTimer = 160 + Math.random() * 60; // 160-220s OPFOR SS Wolfpack wave
    this.opforAswAirTimer = 90 + Math.random() * 35; // Era 4-5 OPFOR ASW patrol interval
    this.lifeRafts = [];

    // Initial deployment combat log
    const flagName =
      this.era === 'era1'
        ? '企業號 (CV-6 Enterprise)'
        : this.era === 'era2'
        ? '艾塞克斯號 (CV-9 Essex)'
        : this.era === 'era3'
        ? '奧里斯卡尼號 (CV-34 Oriskany SCB-27A)'
        : this.era === 'era4'
        ? '小鷹號 (CV-63 Kitty Hawk 超級航母)'
        : '尼米茲號 (CVN-68 Nimitz 核動力超級航空母艦)';
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
    } else if (this.era === 'era4') {
      this.launchAircraft('f4b', 2);
      this.launchAircraft('e1', 1);
    } else if (this.era === 'era5') {
      this.launchAircraft('f14a', 2);
      this.launchAircraft('e2c', 1);
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

  public assignControlGroup(groupKey: string, unitIds: string[] = this.selectedUnitIds): number {
    const aliveIds = this.filterLivePlayerUnitIds(unitIds);
    this.controlGroups[groupKey] = aliveIds;
    return aliveIds.length;
  }

  public recallControlGroup(groupKey: string): string[] {
    const aliveIds = this.filterLivePlayerUnitIds(this.controlGroups[groupKey] || []);
    this.controlGroups[groupKey] = aliveIds;
    if (aliveIds.length > 0) {
      this.selectedUnitIds = [...aliveIds];
    }
    return aliveIds;
  }

  private filterLivePlayerUnitIds(unitIds: string[]): string[] {
    if (unitIds.length === 0) return [];
    const liveIds = new Set<string>();
    for (const s of this.playerShips) {
      if (!s.isSunk) liveIds.add(s.id);
    }
    for (const a of this.aircraft) {
      if (a.side === 'player' && a.state !== 'shot_down') liveIds.add(a.id);
    }
    for (const u of this.groundUnits) {
      if (u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId) liveIds.add(u.id);
    }
    return unitIds.filter((id) => liveIds.has(id));
  }

  public getControlGroupTargetPos(groupKey: string): Vector2D | null {
    const ids = this.controlGroups[groupKey] || [];
    if (ids.length === 0) return null;
    const ship = this.playerShips.find((s) => !s.isSunk && ids.includes(s.id));
    if (ship) return { ...ship.pos };
    const plane = this.aircraft.find((a) => a.side === 'player' && a.state !== 'shot_down' && ids.includes(a.id));
    if (plane) return { ...plane.pos };
    const ground = this.groundUnits.find((u) => u.side === 'player' && !u.isDestroyed && ids.includes(u.id));
    return ground ? { ...ground.pos } : null;
  }

  private scheduleAction(delaySeconds: number, fn: () => void) {
    if (delaySeconds <= 0) {
      fn();
      return;
    }
    this.scheduledActions.push({ delayRemaining: delaySeconds, fn });
  }

  private updateScheduledActions(dt: number) {
    if (this.scheduledActions.length === 0) return;
    for (let i = this.scheduledActions.length - 1; i >= 0; i--) {
      const action = this.scheduledActions[i];
      action.delayRemaining -= dt;
      if (action.delayRemaining <= 0) {
        this.scheduledActions.splice(i, 1);
        action.fn();
      }
    }
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
    if (loadout.diveBomberPayload) {
      // The dive-bomber deck slot is filled by attack aircraft from the Korean War on
      this.activePayloads.dive_bomber = loadout.diveBomberPayload;
      this.activePayloads.attacker = loadout.diveBomberPayload;
    }
    if (loadout.torpedoBomberPayload) this.activePayloads.torpedo_bomber = loadout.torpedoBomberPayload;
    if (loadout.scoutPayload) {
      this.activePayloads.scout = loadout.scoutPayload;
      this.activePayloads.aew = loadout.scoutPayload;
    }

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
    } else if (this.era === 'era4') {
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
    } else {
      // 時代五 (1973-1991) 尼米茲級核動力航空母艦聯隊編裝 (CVN-68 Nimitz)
      const f14Count = Math.ceil(loadout.fighters * 0.6);
      const fa18Count = Math.floor(loadout.fighters * 0.4);
      flagship.carrierPlanes.ready.f14a = f14Count;
      flagship.carrierPlanes.ready.fa18a = fa18Count;
      flagship.carrierPlanes.ready.a6e = loadout.diveBombers || 6;
      flagship.carrierPlanes.ready.ea6b = 2;
      flagship.carrierPlanes.ready.s3a = loadout.torpedoBombers || 4;
      flagship.carrierPlanes.ready.e2c = 2;
      flagship.carrierPlanes.ready.sh3f = 4;
      flagship.carrierPlanes.ready.av8b = 4;
      flagship.carrierPlanes.ready.c2a = 2;
    }

    if (loadout.preLaunchCAP) {
      const fModel = this.era === 'era1' ? 'f4f' : this.era === 'era2' ? 'f6f' : this.era === 'era3' ? 'f9f' : this.era === 'era4' ? 'f4b' : 'f14a';
      this.launchAircraft(fModel, 2);
    }

    if (loadout.preLaunchScout) {
      const sModel = this.era === 'era1' ? 'os2u' : this.era === 'era2' ? 'sc1' : this.era === 'era3' ? 'ad3w' : this.era === 'era4' ? 'e1' : 'e2c';
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

    // 友軍防誤擊保護 (Friendly Fire Prevention): 嚴禁鎖定友軍或盟軍單位為攻擊目標，若點擊則轉為護航/戰鬥巡邏
    if (order.type === 'attack' && order.targetId) {
      const isTargetFriendly =
        this.playerShips.some((s) => s.id === order.targetId) ||
        this.aircraft.some((a) => a.id === order.targetId && (a.side === 'player' || a.side === 'allied')) ||
        this.groundUnits.some((u) => u.id === order.targetId && (u.side === 'player' || u.side === 'allied')) ||
        this.islands.some((isl) => isl.installations.some((i) => i.id === order.targetId && (i.side === 'player' || i.side === 'allied')));

      if (isTargetFriendly) {
        order = {
          type: 'patrol',
          targetPos: order.targetPos,
          patrolOrigin: order.targetPos,
        };
      }
    }

    const selectedShips = this.playerShips.filter((s) => this.selectedUnitIds.includes(s.id) && !s.isSunk);
    const selectedPlanes = this.aircraft.filter((a) => this.selectedUnitIds.includes(a.id) && a.side === 'player' && a.state !== 'shot_down');
    const selectedGround = this.groundUnits.filter((u) => this.selectedUnitIds.includes(u.id) && u.side === 'player' && !u.isDestroyed);

    // 1. Order Ships (with A* sea-lane grid routing)
    selectedShips.forEach((ship, idx) => {
      // Calculate formation offset if multiple ships moving together
      let targetPos = order.targetPos ? { ...order.targetPos } : undefined;
      if (targetPos && selectedShips.length > 1) {
        const offsetDist = 90;
        const offsetAngle = (idx / selectedShips.length) * Math.PI * 2;
        targetPos.x += Math.cos(offsetAngle) * offsetDist;
        targetPos.y += Math.sin(offsetAngle) * offsetDist;
      }
      if (targetPos && this.navGrid) {
        targetPos = this.navGrid.projectToWalkableWater(targetPos);
      }

      let waypoints: Vector2D[] | undefined = undefined;
      if (order.type === 'move' && targetPos) {
        waypoints = this.navGrid ? this.navGrid.findPath(ship.pos, targetPos) : [targetPos];
      }

      ship.order = {
        ...order,
        targetPos,
        waypoints,
        activeWaypointIndex: 0,
      };

      if (order.type === 'move' && targetPos) {
        const firstWp = waypoints && waypoints.length > 0 ? waypoints[0] : targetPos;
        const dx = firstWp.x - ship.pos.x;
        const dy = firstWp.y - ship.pos.y;
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

      const isTroopCarrier =
        plane.hasPayload &&
        (plane.payloadType === 'c1_paratroopers' || plane.payloadType === 'helo_assault_troops');
      const moveDropsOnIsland =
        order.type === 'move' && targetPos && isTroopCarrier ? !!this.findIslandDropPoint(targetPos, 150) : false;

      plane.order = {
        ...order,
        targetPos,
        pendingUnload: order.pendingUnload || moveDropsOnIsland,
      };

      if (order.type === 'move' && targetPos) {
        plane.state = 'cruising';
        plane.targetHeading = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
      } else if (order.type === 'attack') {
        plane.state = 'cruising';
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

  private findIslandDropPoint(pos: Vector2D, maxEdgeDist: number = 180): Vector2D | null {
    for (const isl of this.islands) {
      if (isPointInPolygon(pos, isl.points)) {
        return { ...pos };
      }
    }

    let bestIsl: Island | null = null;
    let bestShorePt: Vector2D | null = null;
    let minEdgeDist = Infinity;

    for (const isl of this.islands) {
      for (let p = 0; p < isl.points.length; p++) {
        const p1 = isl.points[p];
        const p2 = isl.points[(p + 1) % isl.points.length];
        const segDx = p2.x - p1.x;
        const segDy = p2.y - p1.y;
        const segLenSq = segDx * segDx + segDy * segDy;
        let t = 0;
        if (segLenSq > 0.0001) {
          t = Math.max(0, Math.min(1, ((pos.x - p1.x) * segDx + (pos.y - p1.y) * segDy) / segLenSq));
        }
        const projPt = { x: p1.x + t * segDx, y: p1.y + t * segDy };
        const d = dist(pos, projPt);
        if (d < minEdgeDist) {
          minEdgeDist = d;
          bestIsl = isl;
          bestShorePt = projPt;
        }
      }
    }

    if (bestIsl && bestShorePt && minEdgeDist <= maxEdgeDist) {
      const inDx = bestIsl.center.x - bestShorePt.x;
      const inDy = bestIsl.center.y - bestShorePt.y;
      const inLen = Math.hypot(inDx, inDy) || 1;
      for (const push of [45, 90, 140]) {
        const cand = {
          x: bestShorePt.x + (inDx / inLen) * push,
          y: bestShorePt.y + (inDy / inLen) * push,
        };
        if (isPointInPolygon(cand, bestIsl.points)) return cand;
      }
      return { ...bestIsl.center };
    }

    return null;
  }

  public unloadSelectedAircraft(targetPos?: Vector2D): boolean {
    const troopPlanes = this.aircraft.filter(
      (a) =>
        a.side === 'player' &&
        a.state !== 'shot_down' &&
        this.selectedUnitIds.includes(a.id) &&
        a.hasPayload &&
        (a.payloadType === 'c1_paratroopers' || a.payloadType === 'helo_assault_troops')
    );

    if (troopPlanes.length === 0) {
      this.addBannerAlert('⚠️【無可空降機組】請先選取尚載有傘兵或突擊步兵的運輸機 / 直升機！', 'player', 'alert', 4.5);
      return false;
    }

    let droppedCount = 0;
    let queuedCount = 0;

    for (const plane of troopPlanes) {
      const immediateLandPt = this.findIslandDropPoint(plane.pos, 260);
      if (immediateLandPt) {
        if (plane.payloadType === 'helo_assault_troops') {
          this.dropHeloAssaultTroops(plane, immediateLandPt);
        } else {
          this.dropParatroopers(plane, immediateLandPt);
        }
        plane.hasPayload = false;
        plane.ammoRemaining = 0;
        plane.order = { type: 'rtb' };
        plane.state = 'returning';
        droppedCount++;
        continue;
      }

      const candidateTarget = targetPos || plane.order.targetPos;
      if (candidateTarget) {
        const destLandPt = this.findIslandDropPoint(candidateTarget, 220);
        if (destLandPt) {
          plane.order = {
            type: 'move',
            targetPos: destLandPt,
            pendingUnload: true,
          };
          plane.state = 'cruising';
          plane.targetHeading = Math.atan2(destLandPt.y - plane.pos.y, destLandPt.x - plane.pos.x);
          queuedCount++;
          continue;
        }
      }

      // If no island target, fly toward nearest enemy/un-captured island
      const nearestEnemyIsl = this.islands
        .filter((i) => !i.isFriendlyBase && !i.isFullyCaptured)
        .sort((a, b) => dist(plane.pos, a.center) - dist(plane.pos, b.center))[0];
      if (nearestEnemyIsl) {
        plane.order = {
          type: 'move',
          targetPos: { ...nearestEnemyIsl.center },
          pendingUnload: true,
        };
        plane.state = 'cruising';
        plane.targetHeading = Math.atan2(nearestEnemyIsl.center.y - plane.pos.y, nearestEnemyIsl.center.x - plane.pos.x);
        queuedCount++;
      }
    }

    if (droppedCount > 0) {
      soundEngine.playPlaneSortie();
    } else if (queuedCount > 0) {
      soundEngine.playPlaneSortie();
      this.addBannerAlert(
        `🪂【空降卸載指令確認】${queuedCount} 架運輸機群正飛往目標島嶼空域，抵達後將自動傘降／機降並返航！`,
        'player',
        'capture',
        5.5
      );
    }

    return droppedCount > 0 || queuedCount > 0;
  }

  // ══════════════════════════════════════════════════════════
  // Era 3–5 航空投擲被動聲納浮標 (Air-Dropped Passive Sonobuoy System)
  // ══════════════════════════════════════════════════════════
  public getSonobuoySpec(model: AircraftModel, era: Era = this.era): {
    count: number;
    radius: number;
    lifetime: number;
    pingInterval: number;
    revealDuration: number;
    label: string;
  } | null {
    if (era === 'era1' || era === 'era2') return null;

    if (era === 'era3') {
      if (model === 'af_guardian' || model === 'firefly_as5') {
        return {
          count: 6,
          radius: 1280,
          lifetime: 95,
          pingInterval: 5.2,
          revealDuration: 2.7,
          label: 'AN/SSQ-2 被動聲納浮標',
        };
      }
      if (model === 'ho3s1') {
        return {
          count: 4,
          radius: 1180,
          lifetime: 90,
          pingInterval: 5.5,
          revealDuration: 2.6,
          label: 'AN/SSQ-2 輕型聲納浮標',
        };
      }
      return null;
    }

    if (era === 'era4') {
      if (model === 'p3') {
        return {
          count: 12,
          radius: 1750,
          lifetime: 150,
          pingInterval: 4.3,
          revealDuration: 3.1,
          label: 'AN/SSQ-41 Jezebel LOFAR',
        };
      }
      if (model === 's2') {
        return {
          count: 10,
          radius: 1650,
          lifetime: 140,
          pingInterval: 4.5,
          revealDuration: 3.0,
          label: 'AN/SSQ-41 Jezebel LOFAR',
        };
      }
      if (model === 'sh2' || model === 'uh2') {
        return {
          count: 8,
          radius: 1600,
          lifetime: 135,
          pingInterval: 4.5,
          revealDuration: 3.0,
          label: 'AN/SSQ-41 Jezebel LOFAR',
        };
      }
      return null;
    }

    // Era 5
    if (model === 'p3') {
      return {
        count: 16,
        radius: 2150,
        lifetime: 195,
        pingInterval: 3.5,
        revealDuration: 3.5,
        label: 'AN/SSQ-53 DIFAR 定向被動聲納',
      };
    }
    if (model === 's3a') {
      return {
        count: 14,
        radius: 2050,
        lifetime: 185,
        pingInterval: 3.6,
        revealDuration: 3.4,
        label: 'AN/SSQ-53 DIFAR 定向被動聲納',
      };
    }
    if (model === 'sh3f' || model === 'sh2') {
      return {
        count: 12,
        radius: 1950,
        lifetime: 180,
        pingInterval: 3.8,
        revealDuration: 3.3,
        label: 'AN/SSQ-53 DIFAR 定向被動聲納',
      };
    }
    return null;
  }

  public canDropSonobuoy(plane: Aircraft): boolean {
    if (plane.side !== 'player' || plane.state === 'shot_down') return false;
    return (plane.sonobuoyAmmo ?? 0) > 0 && this.getSonobuoySpec(plane.model) !== null;
  }

  public getSonobuoyPreviewRadius(): number {
    const selectedEligible = this.aircraft.find(
      (a) => this.selectedUnitIds.includes(a.id) && this.canDropSonobuoy(a)
    );
    if (selectedEligible) {
      return this.getSonobuoySpec(selectedEligible.model)?.radius || 1650;
    }
    if (this.era === 'era3') return 1280;
    if (this.era === 'era4') return 1650;
    if (this.era === 'era5') return 2050;
    return 1280;
  }

  private snapToOpenWater(pos: Vector2D): Vector2D {
    const isLand = (pt: Vector2D) => this.islands.some((isl) => isPointInPolygon(pt, isl.points));
    if (!isLand(pos)) return { x: Math.max(80, Math.min(this.worldSize - 80, pos.x)), y: Math.max(80, Math.min(this.worldSize - 80, pos.y)) };
    for (let r = 90; r <= 750; r += 90) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const cand = {
          x: Math.max(80, Math.min(this.worldSize - 80, pos.x + Math.cos(a) * r)),
          y: Math.max(80, Math.min(this.worldSize - 80, pos.y + Math.sin(a) * r)),
        };
        if (!isLand(cand)) return cand;
      }
    }
    return pos;
  }

  public orderDropSonobuoy(targetPos: Vector2D, specificUnitIds?: string[]): boolean {
    if (this.era === 'era1' || this.era === 'era2') {
      this.addBannerAlert('⚠️【時代限制】二戰時期（時代一～二）尚無空投無線電被動聲納浮標裝備！', 'player', 'alert', 4.5);
      return false;
    }

    const ids = specificUnitIds || this.selectedUnitIds;
    const eligibleSelected = this.aircraft.filter((a) => ids.includes(a.id) && this.canDropSonobuoy(a));
    const pool =
      eligibleSelected.length > 0
        ? eligibleSelected
        : this.aircraft.filter((a) => this.canDropSonobuoy(a));

    if (pool.length === 0) {
      this.addBannerAlert(
        '⚠️【無可用被動聲納浮標】請派遣攜帶浮標之反潛機／反潛直升機（AF-2 / S-2 / P-3 / SH-2 / S-3A / SH-3F）升空！',
        'player',
        'alert',
        4.5
      );
      return false;
    }

    const dropPos = this.snapToOpenWater(targetPos);

    // 優先指派距離目標最近、且目前尚未領受投擲座標之機組（便於 Shift 連續佈設浮標欄）
    const idlePool = pool.filter((a) => !a.order.pendingSonobuoyPos);
    const candidates = idlePool.length > 0 ? idlePool : pool;
    const assigned = [...candidates].sort((a, b) => dist(a.pos, dropPos) - dist(b.pos, dropPos))[0];

    const isHelo =
      assigned.role === 'rescue' ||
      assigned.model === 'ho3s1' ||
      assigned.model === 'sh2' ||
      assigned.model === 'uh2' ||
      assigned.model === 'sh3f';
    const immediateRange = isHelo ? 115 : 155;

    if (dist(assigned.pos, dropPos) <= immediateRange) {
      this.deploySonobuoyFromAircraft(assigned, dropPos);
      assigned.order = { type: 'patrol', patrolOrigin: { ...dropPos }, targetPos: { ...dropPos } };
      assigned.state = 'patrolling';
      return true;
    }

    assigned.order = {
      type: 'move',
      targetPos: { ...dropPos },
      pendingSonobuoyPos: { ...dropPos },
    };
    assigned.state = 'cruising';
    assigned.targetHeading = Math.atan2(dropPos.y - assigned.pos.y, dropPos.x - assigned.pos.x);

    soundEngine.playPlaneSortie();
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: assigned.name,
      targetName: `座標 [${Math.round(dropPos.x)}, ${Math.round(dropPos.y)}]`,
      actionType: 'recon_spotted',
      text: `📡【空投聲納浮標航線指派】「${assigned.name}」正高速飛往指定海域準備投擲 ${assigned.sonobuoyModel || '被動聲納浮標'}（剩餘 ${assigned.sonobuoyAmmo ?? 0} 枚）。`,
    });
    return true;
  }

  private deploySonobuoyFromAircraft(plane: Aircraft, dropPos: Vector2D) {
    const spec = this.getSonobuoySpec(plane.model);
    if (!spec || (plane.sonobuoyAmmo ?? 0) <= 0) return;

    plane.sonobuoyAmmo = Math.max(0, (plane.sonobuoyAmmo ?? 0) - 1);
    const buoy: Sonobuoy = {
      id: `buoy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      side: 'player',
      era: this.era,
      modelLabel: spec.label,
      pos: { ...dropPos },
      detectionRadius: spec.radius,
      lifetime: spec.lifetime,
      maxLifetime: spec.lifetime,
      pingInterval: spec.pingInterval,
      pingTimer: 0.4, // 落水後隨即展開水聽器進行首次聲學聽音
      revealDuration: spec.revealDuration,
      hasActiveContact: false,
      contactFlashTimer: 0,
    };
    this.sonobuoys.push(buoy);

    // 限制戰場同時存在過多過期浮標以維持性能
    if (this.sonobuoys.length > 48) {
      this.sonobuoys.shift();
    }

    soundEngine.playWaterSplash();
    this.particles.push({
      id: `buoy-splash-${Date.now()}-${Math.random()}`,
      x: dropPos.x,
      y: dropPos.y,
      vx: 0,
      vy: 0,
      life: 1.2,
      maxLife: 1.2,
      radius: 34,
      color: '#26C6DA',
      type: 'shockwave',
      shape: 'ring',
    });

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: plane.name,
      targetName: `${spec.label}`,
      actionType: 'recon_spotted',
      text: `📡【被動聲納浮標入水啟動】「${plane.name}」已於 [${Math.round(dropPos.x)}, ${Math.round(dropPos.y)}] 投下「${spec.label}」（監聽半徑 ${spec.radius}m · 電池續航 ${spec.lifetime}s · 機上剩餘 ${plane.sonobuoyAmmo} 枚）。`,
    });
  }

  private updateSonobuoys(dt: number) {
    if (this.sonobuoys.length === 0) return;
    const enemySubs = this.enemyShips.filter((s) => !s.isSunk && this.isSubmarine(s));

    for (let i = this.sonobuoys.length - 1; i >= 0; i--) {
      const buoy = this.sonobuoys[i];
      buoy.lifetime -= dt;
      if (buoy.lifetime <= 0) {
        this.sonobuoys.splice(i, 1);
        continue;
      }

      if ((buoy.contactFlashTimer ?? 0) > 0) {
        buoy.contactFlashTimer = Math.max(0, (buoy.contactFlashTimer ?? 0) - dt);
        if (buoy.contactFlashTimer <= 0) {
          buoy.hasActiveContact = false;
        }
      }

      buoy.pingTimer -= dt;
      if (buoy.pingTimer <= 0) {
        buoy.pingTimer = buoy.pingInterval;

        // 被動水聽器間歇掃描半徑內是否有敵軍潛艦通過
        const detectedSubs = enemySubs.filter((sub) => dist(buoy.pos, sub.pos) <= buoy.detectionRadius * sonobuoySensitivity(sub, this.era) * layerFactorForSonobuoy(sub, this.era));
        if (detectedSubs.length > 0) {
          soundEngine.playSonarPing();
          buoy.hasActiveContact = true;
          buoy.contactFlashTimer = 1.4;
          buoy.lastContactPos = { ...detectedSubs[0].pos };

          // 浮標向外擴散細緻聲波接觸波紋
          this.particles.push({
            id: `buoy-ping-${Date.now()}-${Math.random()}`,
            x: buoy.pos.x,
            y: buoy.pos.y,
            vx: 0,
            vy: 0,
            life: 0.9,
            maxLife: 0.9,
            radius: Math.min(220, buoy.detectionRadius * 0.16),
            color: '#00E5FF',
            type: 'shockwave',
            shape: 'ring',
          });

          for (const sub of detectedSubs) {
            this.revealSubmarine(sub, buoy.revealDuration, 'sonobuoy', buoy.modelLabel);
          }
        }
      }
    }
  }

  private scheduleStaggeredMissileLaunch(
    ship: Ship | Installation,
    targets: Ship[],
    salvoCount: number,
    options: {
      missileType: PendingMissileLaunch['missileType'];
      missileName: string;
      speed: number;
      damage: number;
      blastRadius: number;
      isSeaSkimming?: boolean;
      spreadAngle?: number;
      baseDelay?: number;
      staggerInterval?: number;
      ashmVariant?: AshmVariant;
      ashmProfile?: AshmFlightProfile;
      leadMissileIndex?: number;
      turnRate?: number;
    }
  ) {
    if (targets.length === 0 || ('isSunk' in ship ? ship.isSunk : ship.isDestroyed)) return;
    const baseDelay = options.baseDelay ?? 0;
    const stagger = options.staggerInterval ?? 0.16;
    const salvoGroupId = `${ship.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    for (let s = 0; s < salvoCount; s++) {
      const target = targets[s % targets.length];
      const isLead = options.leadMissileIndex !== undefined && s === options.leadMissileIndex;
      this.pendingMissileLaunches.push({
        id: `pml-${ship.id}-${Date.now()}-${s}-${Math.random().toString(36).slice(2, 6)}`,
        launcherId: ship.id,
        targetId: target.id,
        side: ship.side,
        missileType: options.missileType,
        missileName: options.missileName,
        speed: options.speed,
        damage: options.damage,
        blastRadius: options.blastRadius,
        isSeaSkimming: options.isSeaSkimming,
        delayRemaining: baseDelay + s * stagger,
        salvoIndex: s,
        salvoTotal: salvoCount,
        ashmVariant: options.ashmVariant,
        ashmProfile: isLead ? 'datalink_leader' : options.ashmProfile,
        salvoGroupId,
        isLeadMissile: isLead,
        turnRate: options.turnRate,
        spreadAngle: options.spreadAngle,
      });
    }
  }

  private updatePendingMissileLaunches(dt: number) {
    if (this.pendingMissileLaunches.length === 0) return;

    const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
    for (let i = this.pendingMissileLaunches.length - 1; i >= 0; i--) {
      const item = this.pendingMissileLaunches[i];
      item.delayRemaining -= dt;
      if (item.delayRemaining > 0) continue;

      this.pendingMissileLaunches.splice(i, 1);

      const launcher =
        allShips.find((s) => s.id === item.launcherId) ||
        this.islands.flatMap((isl) => isl.installations).find((inst) => inst.id === item.launcherId && !inst.isDestroyed);
      if (!launcher || ('isSunk' in launcher && launcher.isSunk)) continue;

      let targetShip = allShips.find((s) => s.id === item.targetId && !s.isSunk);
      if (!targetShip) {
        const candidates = allShips.filter(
          (s) => !s.isSunk && !this.isSubmarine(s) && this.isHostile(item.side, s.side)
        );
        targetShip = candidates[0] || (item.side === 'enemy' ? this.getFlagship() : undefined);
      }
      if (!targetShip || targetShip.isSunk) continue;

      if ('type' in launcher && this.isSubmarine(launcher as Ship)) {
        soundEngine.playWaterSplash();
      }

      const d = dist(launcher.pos, targetShip.pos);
      const baseAngle = Math.atan2(targetShip.pos.y - launcher.pos.y, targetShip.pos.x - launcher.pos.x);
      const spreadStep = item.spreadAngle ?? 0.055;
      const lateralStep = (item.salvoIndex % 8) - 3.5;
      const offsetAngle = lateralStep * spreadStep;
      const lateralOffset = lateralStep * 6;
      const angle = baseAngle + offsetAngle;
      const launcherName = 'name' in launcher ? launcher.name : '艦艇';
      const projId = `ashm-${item.side}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

      const isLead = Boolean(item.isLeadMissile);
      if (isLead && item.salvoGroupId) {
        this.activeSalvoLeaders.set(item.salvoGroupId, projId);
      }
      const leadMissileId = !isLead && item.salvoGroupId ? this.activeSalvoLeaders.get(item.salvoGroupId) : undefined;
      const initialAlt = isLead
        ? 0.88
        : item.ashmProfile === 'ultra_sea_skim'
        ? 0.07
        : item.ashmProfile === 'supersonic_sprint'
        ? 0.11
        : 0.18;

      this.projectiles.push({
        id: projId,
        type: item.missileType,
        side: item.side,
        pos: {
          x: launcher.pos.x + Math.sin(baseAngle) * lateralOffset,
          y: launcher.pos.y - Math.cos(baseAngle) * lateralOffset,
        },
        vel: { x: Math.cos(angle) * item.speed, y: Math.sin(angle) * item.speed },
        originPos: { ...launcher.pos },
        targetPos: { ...targetShip.pos },
        flightProgress: 0,
        maxDistance: d + 1200,
        distanceTraveled: 0,
        damage: item.damage,
        blastRadius: item.blastRadius,
        speed: item.speed,
        heading: angle,
        isDead: false,
        trail: [],
        targetEntityId: targetShip.id,
        targetEntityType: 'ship',
        guidanceType: 'active_radar',
        turnRate: item.turnRate ?? (isLead ? 3.8 : 3.5),
        attackerName: isLead ? `${launcherName} (${item.missileName} · 高空領航領彈)` : `${launcherName} (${item.missileName})`,
        isSeaSkimming: !isLead && (item.isSeaSkimming ?? true),
        ashmVariant: item.ashmVariant,
        ashmProfile: item.ashmProfile,
        missileAltitude: initialAlt,
        isLeadMissile: isLead,
        salvoGroupId: item.salvoGroupId,
        leadMissileId,
        missileHealth: this.getAshmStructuralHealth(item.ashmVariant, item.speed),
        maxMissileHealth: this.getAshmStructuralHealth(item.ashmVariant, item.speed),
        flakHitAccum: 0,
        terminalWeavePhase: item.ashmVariant === 'p270_moskit' ? item.salvoIndex * 1.1 : undefined,
      });
    }
  }

  // Issue Combat Air Patrol (CAP) Orbit Order to Fighters in a designated area
  public issueCapPatrolOrder(origin: Vector2D, specificUnitIds?: string[]) {
    const ids = specificUnitIds || this.selectedUnitIds;
    let targetFighters = this.aircraft.filter(
      (a) => a.side === 'player' && a.state !== 'shot_down' && ids.includes(a.id) &&
        (a.role === 'fighter' || GUN_FIGHTER_MODELS.has(a.model))
    );

    // If no specific fighters selected, command all friendly fighters currently airborne
    if (targetFighters.length === 0) {
      targetFighters = this.aircraft.filter(
        (a) => a.side === 'player' && a.state !== 'shot_down' &&
          (a.role === 'fighter' || GUN_FIGHTER_MODELS.has(a.model))
      );
    }

    if (targetFighters.length === 0) {
      this.addBannerAlert('⚠️【無可用戰鬥機】目前空域尚無升空之戰鬥機，請先從航母或前進基地派遣戰機出擊！', 'player', 'alert', 4.5);
      return;
    }

    targetFighters.forEach((plane) => {
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

  public launchAircraft(model: AircraftModel, count: number = 2, specificPayload?: AircraftPayloadType, carrierId?: string): boolean {
    // Launching carrier: the one asked for, otherwise the flagship
    const flagship = (carrierId ? this.playerShips.find((s) => s.id === carrierId && !s.isSunk && s.carrierPlanes) : undefined) ?? this.getFlagship();
    if (!flagship || !flagship.carrierPlanes) return false;

    const readyCount = flagship.carrierPlanes.ready[model] || 0;
    if (readyCount <= 0) return false;

    const actualCount = Math.min(count, readyCount);
    flagship.carrierPlanes.ready[model] -= actualCount;

    const sqId = `sq-${model}-${Date.now()}`;
    const role: AircraftRole = getCatalogRole(model, 'carrier', this.era);

    // Allow overriding payload on sortie, and persist as current active payload for role
    const payloadType = resolvePayload(model, specificPayload || this.activePayloads[role], this.era);
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

    // High-performance naval and land-based aviation speeds (Supersonic Mach 1.8~2.5+ in Era 5)
    const rawSpeed = getAircraftBaseSpeed(model);

    const catalogItem = PAYLOAD_CATALOG[payloadType];
    const speedModifier = catalogItem ? catalogItem.speedModifier : 1.0;
    const baseSpeed = Math.round(rawSpeed * speedModifier);

    // Resilient, battle-hardened health pools for carrier and land-based air groups
    const baseHealth = getAircraftBaseHealth(model);

    const hasPayload = carriesStores(payloadType);

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
    const gunRounds = getAircraftGunRounds(model);

    const initialAmmo = getPayloadRounds(model, payloadType, this.era, gunRounds);

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
        ammoRemaining: initialAmmo,
        maxAmmo: initialAmmo,
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
        ...((): { sonobuoyAmmo?: number; maxSonobuoyAmmo?: number; sonobuoyModel?: string } => {
          const spec = this.getSonobuoySpec(model);
          return spec
            ? { sonobuoyAmmo: spec.count, maxSonobuoyAmmo: spec.count, sonobuoyModel: spec.label }
            : {};
        })(),
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: flagship.codeName || flagship.name,
      targetName: flightName,
      actionType: 'recon_spotted',
      text: `🛫【機隊起飛出擊】「${flightName}」從飛行甲板彈射出擊！掛載: ${catalogItem?.name || payloadName} (儲存彈藥: ${initialAmmo})`,
    });

    for (const a of this.aircraft) if (a.squadronId === sqId) a.homeBaseId = flagship.id;

    // 不取消航母選取：保持航母/旗艦選中狀態，讓下方飛行甲板出擊選單保持開啟，方便連續派遣多批次機隊
    if (!this.selectedUnitIds.includes(flagship.id)) {
      this.selectedUnitIds = [flagship.id];
    }
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
      this.enemyAirStrikeTimer = Math.max(40, 62 - this.sectorNumber * 3);
    }

    // 2: Air Sweep (空中制空掃蕩隊)
    this.enemySweepTimer -= effectiveDt;
    if (this.enemySweepTimer <= 0) {
      this.triggerEnemyAirDoctrine('air_sweep');
      this.enemySweepTimer = 52;
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
      this.enemyCasTimer = 55;
    }

    // 8: CAP (常態戰鬥巡邏維護 — 提升全時代戰區防空機上限至 6 架)
    this.enemyCapTimer -= effectiveDt;
    if (this.enemyCapTimer <= 0) {
      const activeCaps = this.aircraft.filter((a) => a.side === 'enemy' && a.missionType === 'cap' && a.state !== 'shot_down');
      if (activeCaps.length < 6) {
        this.triggerEnemyAirDoctrine('cap');
      }
      this.enemyCapTimer = 60;
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

    // 跨時代 OPFOR 水面打擊群 (SAG) 每 3 至 4 分鐘週期出擊 (Every 180 - 240s across Eras 1-5)
    this.opforSagTimer -= effectiveDt;
    if (this.opforSagTimer <= 0) {
      this.spawnOpforSagSortie();
      this.opforSagTimer = 180 + Math.random() * 60; // 180 to 240s
    }

    // 獨立 OPFOR 潛艦狼群增援 (1-3 艘, 每 160-220s)
    this.opforWolfpackTimer -= effectiveDt;
    if (this.opforWolfpackTimer <= 0) {
      this.spawnOpforWolfpackSortie();
      this.opforWolfpackTimer = 160 + Math.random() * 60;
    }

    // 時代四 & 時代五 OPFOR 專職反潛機隊出擊 (Be-12 / Il-38 / Ka-27)
    if (this.era === 'era4' || this.era === 'era5') {
      this.opforAswAirTimer -= effectiveDt;
      if (this.opforAswAirTimer <= 0) {
        const activeOpforAsw = this.aircraft.filter(
          (a) => a.side === 'enemy' && a.state !== 'shot_down' && (a.model === 'be12' || a.model === 'il38' || a.model === 'ka27')
        ).length;
        if (activeOpforAsw < 5) {
          this.triggerEnemyAirDoctrine('asw_patrol');
        }
        this.opforAswAirTimer = 95 + Math.random() * 35;
      }
    }

    // Continental Frontline Automated Reinforcements & USAF/USAAF Sorties (Eras 3, 4, 5)
    if (this.era === 'era3' || this.era === 'era4' || this.era === 'era5') {
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

    // 盟軍自主空中戰鬥巡邏與突擊出擊 (Allied Air Wing Autonomous Sorties)
    this.alliedSortieTimer -= effectiveDt;
    if (this.alliedSortieTimer <= 0) {
      this.spawnAlliedAirSortie();
      this.alliedSortieTimer = 35 + Math.random() * 20; // 35 to 55 seconds
    }

    // 跨時代盟軍水面打擊群支援 (Allied Surface Action Group - SAG Autonomous Patrol & Strike)
    this.alliedSagTimer -= effectiveDt;
    if (this.alliedSagTimer <= 0) {
      this.spawnAlliedSAG();
      this.alliedSagTimer = 130 + Math.random() * 30; // 130 to 160 seconds
    }

    this.updateScheduledActions(effectiveDt);
    this.updateSonobuoys(effectiveDt);
    this.updateSubmarineFogOfWar(effectiveDt);
    this.updateShips(effectiveDt);
    this.updateGroundUnits(effectiveDt);
    this.updateStrongholds(effectiveDt);
    this.updateAircraft(effectiveDt);
    this.updateInstallations(effectiveDt);
    this.updateEra3Mechanics(effectiveDt);
    this.updateEra4Mechanics(effectiveDt);
    this.updateEra5Mechanics(effectiveDt);
    this.updateAntiShipMissilePointDefense(effectiveDt);
    this.updateModernNavalGunAA(effectiveDt);
    this.updateLifeRaftRescue(effectiveDt);
    this.updatePendingMissileLaunches(effectiveDt);
    this.updateProjectiles(effectiveDt);
    this.updateParticles(effectiveDt);
    this.checkVictoryConditions();
  }

  // 1. Update Warships with RTS Orders
  private updateShips(dt: number) {
    const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];

    for (const ship of allShips) {
      if (this.updateSinkingShip(dt, ship)) continue;

      if (ship.repathCooldown !== undefined && ship.repathCooldown > 0) {
        ship.repathCooldown = Math.max(0, ship.repathCooldown - dt);
      }

      // RTS Navigation Orders with A* Waypoint Progression & Dynamic Island Perimeter Avoidance
      if (ship.order.type === 'move' && ship.order.targetPos) {
        if (ship.navStuck && this.navGrid) {
          // No headway for several seconds: replan the sea lane from where the ship actually is
          ship.order.waypoints = this.navGrid.findPath(ship.pos, ship.order.targetPos);
          ship.order.activeWaypointIndex = 0;
          ship.navStuck = false;
        }
        const wps = ship.order.waypoints;
        let wpIdx = ship.order.activeWaypointIndex ?? 0;
        let activeTarget = ship.order.targetPos;

        if (wps && wps.length > 0 && wpIdx < wps.length) {
          activeTarget = this.advanceSeaLane(ship, wps);
          wpIdx = ship.order.activeWaypointIndex ?? wpIdx;
          const isFinalWp = wpIdx >= wps.length - 1;
          const arriveDist = isFinalWp ? 45 : 95;
          if (dist(ship.pos, activeTarget) < arriveDist) {
            if (!isFinalWp) {
              wpIdx += 1;
              ship.order.activeWaypointIndex = wpIdx;
              activeTarget = wps[wpIdx];
            } else {
              ship.order = { type: 'idle' };
              ship.targetSpeed = 0;
            }
          }
        } else if (dist(ship.pos, activeTarget) < 45) {
          ship.order = { type: 'idle' };
          ship.targetSpeed = 0;
        }

        if (ship.order.type === 'move') {
          const dx = activeTarget.x - ship.pos.x;
          const dy = activeTarget.y - ship.pos.y;
          const d = Math.hypot(dx, dy);
          const desiredHeading = Math.atan2(dy, dx);
          const avoidance = this.calculateNavalSteeringAvoidance(ship, desiredHeading, d);
          ship.targetHeading = avoidance.targetHeading;
          ship.targetSpeed = ship.maxSpeed * avoidance.speedScale;
        }
      }

      // Enemy AI with Dynamic Island Perimeter Avoidance
      if (ship.side === 'enemy') {
        this.updateEnemyShipAI(ship, dt);
        const avoidance = this.calculateNavalSteeringAvoidance(ship, ship.targetHeading, 1500);
        ship.targetHeading = avoidance.targetHeading;
        ship.targetSpeed = Math.min(ship.targetSpeed, ship.maxSpeed * avoidance.speedScale);
      }

      // 盟軍自主航行 (在轉向結算前計算以套用島嶼閃避與分離操舵)
      if (ship.side === 'allied' && !ship.isSunk) {
        this.updateAlliedShipAI(ship, dt);
        const avoidance = this.calculateNavalSteeringAvoidance(ship, ship.targetHeading, 1500);
        ship.targetHeading = avoidance.targetHeading;
        ship.targetSpeed = Math.min(ship.targetSpeed, ship.maxSpeed * avoidance.speedScale);
      }

      // 我方護航艦反潛：待命時自動以搜索航速獵殺接觸，航行中遇接觸則自動減速至聲納有效航速
      if (ship.side === 'player' && !ship.isSunk && !this.isSubmarine(ship) && hasAswWeapon(ship)) {
        this.updatePlayerEscortAsw(ship);
      }

      // 艦艇間防碰撞分離操舵 (Ship-to-Ship Separation Steering)
      if (ship.targetSpeed > 0.5) {
        const sep = computeShipSeparationSteering(ship, allShips, (s) => this.isSubmarine(s));
        if (Math.abs(sep.vx) > 0.001 || Math.abs(sep.vy) > 0.001) {
          const desiredX = Math.cos(ship.targetHeading) + sep.vx * 0.85;
          const desiredY = Math.sin(ship.targetHeading) + sep.vy * 0.85;
          const sepAvoid = this.calculateNavalSteeringAvoidance(ship, Math.atan2(desiredY, desiredX), 600);
          ship.targetHeading = sepAvoid.targetHeading;
          ship.targetSpeed = Math.min(ship.targetSpeed * sep.speedScale, ship.maxSpeed * sepAvoid.speedScale);
        } else {
          ship.targetSpeed *= sep.speedScale;
        }
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

      // Diesel boats: battery drain, snorkelling (surfacing before the snorkel) and a crawl when flat
      if (this.isSubmarine(ship)) {
        const hostileSurface = ship.side === 'enemy' ? [...this.playerShips, ...this.alliedShips] : this.enemyShips;
        const nearestShip = hostileSurface.reduce((m, h) => (h.isSunk || this.isSubmarine(h) ? m : Math.min(m, dist(h.pos, ship.pos))), Infinity);
        const nearestAircraft = this.aircraft.reduce(
          (m, a) => (a.state === 'shot_down' || !this.isHostile(ship.side, a.side) ? m : Math.min(m, dist(a.pos, ship.pos))),
          Infinity
        );
        const diesel = updateDieselBattery(ship, dt, this.era, nearestShip, nearestAircraft);
        const wasBelow = ship.belowLayer;
        updateThermoclineDepth(ship, dt, nearestShip);
        if (ship.belowLayer && !wasBelow && ship.side === 'enemy' && ship.isSpotted) {
          this.addCombatLog({
            category: 'naval',
            sourceSide: 'enemy',
            sourceName: ship.name,
            targetName: '我方反潛艦',
            actionType: 'recon_spotted',
            text: `🌡️【潛入溫躍層】敵潛艦「${ship.name}」深潛至溫躍層下方，艦殼聲納回波急遽衰減！需拖曳陣列 / 吊放聲納 / 深設聲納浮標追蹤。`,
          });
        }
        if (diesel.surfaceKt !== undefined && ship.targetSpeed > 0) ship.targetSpeed = diesel.surfaceKt;
        if (diesel.capKt !== undefined) ship.targetSpeed = Math.min(ship.targetSpeed, diesel.capKt);
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
        // speed is in knots; vel is the true map velocity on the shared speed scale
        const mapSpeed = shipMapSpeed(ship.speed);
        ship.vel.x = Math.cos(ship.heading) * mapSpeed;
        ship.vel.y = Math.sin(ship.heading) * mapSpeed;
        ship.pos.x += ship.vel.x * dt;
        ship.pos.y += ship.vel.y * dt;
        this.checkNavigationProgress(ship, dt);
      } else {
        ship.vel.x = 0;
        ship.vel.y = 0;
      }

      // Island collision bounce and smooth shoreline sliding (prevent sticking/beaching)
      for (const island of this.islands) {
        if (isPointOnIslandLand(ship.pos, island)) {
          const pushAngle = Math.atan2(ship.pos.y - island.center.y, ship.pos.x - island.center.x);
          ship.pos.x += Math.cos(pushAngle) * 5;
          ship.pos.y += Math.sin(pushAngle) * 5;
          // Rotate targetHeading tangentially away from island shore to slide out smoothly
          const tangentAngle = pushAngle + (Math.sin(ship.heading - pushAngle) >= 0 ? Math.PI / 2 : -Math.PI / 2);
          ship.targetHeading = tangentAngle;
          ship.speed *= 0.65;
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

      // Depth Charge auto drop (overhead/stern drop - 僅針對已被聲吶鎖定或暴露位置之潛艦)
      if ((ship.side === 'player' || ship.side === 'allied') && ship.hasDepthCharges && (ship.depthChargeCooldown || 0) <= 0) {
        const nearSub = this.enemyShips.find((e) => this.isSubmarine(e) && !e.isSunk && e.isSpotted && dist(ship.pos, e.pos) < 320);
        if (nearSub) {
          this.dropDepthCharge(ship);
          ship.depthChargeCooldown = 6;
        }
      }

      // Enemy escorts attack submarines their sensors hold: RBU rocket launchers or depth charges
      if (ship.side === 'enemy' && !this.isSubmarine(ship)) {
        const weapon = enemyAswWeapon(ship, this.era);
        ship.rbuCooldown = Math.max(0, (ship.rbuCooldown || 0) - dt);
        if (weapon && ship.rbuCooldown <= 0) {
          const prey = [...this.playerShips, ...this.alliedShips].find(
            (s) => this.isSubmarine(s) && !s.isSunk && s.isSpottedByEnemy && dist(ship.pos, s.pos) <= weapon.range
          );
          if (prey) {
            if (weapon.kind === 'rbu') this.fireRbuSalvo(ship, prey.pos, weapon.rounds, weapon.label);
            else this.dropDepthCharge(ship);
            ship.rbuCooldown = weapon.cooldown;
          }
        }
      }

      // Hedgehog ASW forward-firing mortar barrage (automatic forward cone detection 100m-290m, ±45°, requires spotted contact)
      if ((ship.side === 'player' || ship.side === 'allied') && ship.hasHedgehog && (ship.hedgehogCooldown || 0) <= 0) {
        const thrower = AHEAD_THROWERS[ship.aheadThrower ?? 'hedgehog'];
        // Hedgehog and Squid fire ahead along a fixed axis; Limbo and the Bofors launcher train to the beam
        const cone = ship.aheadThrower === 'limbo' || ship.aheadThrower === 'bofors375' ? 2.6 : 0.8;
        const targetSub = this.enemyShips.find((e) => {
          if (!this.isSubmarine(e) || e.isSunk || !e.isSpotted) return false;
          const d = dist(ship.pos, e.pos);
          if (d < 100 || d > thrower.maxRange) return false;
          const ang = Math.atan2(e.pos.y - ship.pos.y, e.pos.x - ship.pos.x);
          let relAngle = ang - ship.heading;
          while (relAngle > Math.PI) relAngle -= Math.PI * 2;
          while (relAngle < -Math.PI) relAngle += Math.PI * 2;
          return Math.abs(relAngle) <= cone;
        });

        if (targetSub) {
          this.fireHedgehogSalvo(ship, targetSub.pos);
          ship.hedgehogCooldown = thrower.reload;
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

      this.updateShipRepairAtDocks(dt, ship);

      this.updateShipCombat(ship, dt);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 友軍船舶維修設施 (Ship Repair Docks) 緊急搶修至綠色安全生命值
  // ══════════════════════════════════════════════════════════
  private updateShipRepairAtDocks(dt: number, ship: Ship): void {
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
  }

  private updateSinkingShip(dt: number, ship: Ship): boolean {
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
      return true;
    }
    return false;
  }

  private getEnemySteerPoint(ship: Ship, dest: Vector2D): Vector2D {
    if (!this.navGrid) return dest;
    const dTotal = dist(ship.pos, dest);
    if (dTotal < 520) return dest;
    if (!ship.order.waypoints || ship.order.waypoints.length === 0 || (ship.repathCooldown || 0) <= 0 || ship.navStuck) {
      ship.order.waypoints = this.navGrid.findPath(ship.pos, dest);
      ship.order.activeWaypointIndex = 0;
      ship.repathCooldown = 3.5;
      ship.navStuck = false;
    }
    const wps = ship.order.waypoints || [dest];
    return this.advanceSeaLane(ship, wps) || dest;
  }

  private updateEnemyShipAI(ship: Ship, _dt: number) {
    const flagship = this.getFlagship();
    const hostiles = [...this.playerShips, ...this.alliedShips].filter(
      (s) => !s.isSunk && (!this.isSubmarine(s) || Boolean(s.isSpottedByEnemy))
    );

    if (this.isSubmarine(ship) && (ship.evadeTimer || 0) > 0) {
      ship.evadeTimer = (ship.evadeTimer || 0) - _dt;
      ship.targetHeading = ship.evadeHeading ?? ship.heading;
      ship.targetSpeed = isDieselBoat(ship) ? 3 : ship.maxSpeed;
      return;
    }

    if (this.isSubmarine(ship)) {
      let target: Ship | undefined = hostiles.sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos))[0];
      if (!target) target = flagship;
      if (!target) return;

      const d = dist(ship.pos, target.pos);
      const steerPt = this.getEnemySteerPoint(ship, target.pos);
      ship.targetHeading = Math.atan2(steerPt.y - ship.pos.y, steerPt.x - ship.pos.x);
      ship.targetSpeed = Math.min(ship.maxSpeed, d > 1100 ? Math.max(9, ship.maxSpeed * 0.85) : 7);

      const torpRange = this.era === 'era5' || this.era === 'era4' ? 1600 : 850;
      if ((ship.torpedoCooldown || 0) <= 0 && d < torpRange) {
        if (this.era === 'era5') {
          this.fireWakeHomingTorpedo(ship, target);
          ship.torpedoCooldown = 26;
        } else {
          this.fireTorpedoSalvo(ship, target.pos, 2);
          ship.torpedoCooldown = 22;
        }
      }
      return;
    }

    const sortedHostiles = [...hostiles].sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
    const closestHostile = sortedHostiles[0];
    const distToFlagship = flagship ? dist(ship.pos, flagship.pos) : Infinity;
    const primaryTarget =
      closestHostile && (!flagship || dist(ship.pos, closestHostile.pos) < Math.min(2800, distToFlagship * 0.85))
        ? closestHostile
        : (flagship || closestHostile);
    if (!primaryTarget) return;

    const d = dist(ship.pos, primaryTarget.pos);
    const steerPt = this.getEnemySteerPoint(ship, primaryTarget.pos);

    if (d > 1000) {
      ship.targetHeading = Math.atan2(steerPt.y - ship.pos.y, steerPt.x - ship.pos.x);
      ship.targetSpeed = 16;
    } else if (d < 450) {
      ship.targetHeading = Math.atan2(primaryTarget.pos.y - ship.pos.y, primaryTarget.pos.x - ship.pos.x) + Math.PI * 0.6;
      ship.targetSpeed = 18;
    } else {
      ship.targetHeading = primaryTarget.heading + Math.PI;
      ship.targetSpeed = 14;
    }

    if (ship.hasTorpedoes && (ship.torpedoCooldown || 0) <= 0 && d < 700) {
      this.fireTorpedoSalvo(ship, primaryTarget.pos, 3);
      ship.torpedoCooldown = ship.torpedoReloadTime || 20;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 動態島嶼邊界閃避與預測轉向航行 (Dynamic Island Perimeter Avoidance)
  // 透過多束前方偵測探針 (Forward Lookahead Whiskers) 提前偵測環礁陸地邊界，
  // 依據碰撞緊迫度向外側切線動態轉向並調節航速，徹底避免艦艇擱淺卡灘
  // ══════════════════════════════════════════════════════════
  /**
   * Local land avoidance. Probes ahead along the desired heading; if land is in the way, fans out
   * to either side in 12.5-degree steps and takes the first heading whose probe is clear, keeping
   * the side it chose until the way ahead is open again (so it does not dither left-right along a
   * coast). Works for any coastline shape, unlike steering by the tangent to an island's centre,
   * which sent ships the wrong way along the mainland's irregular shore.
   */
  private calculateNavalSteeringAvoidance(
    ship: Ship,
    desiredHeading: number,
    _targetDist: number
  ): { targetHeading: number; speedScale: number } {
    if (this.islands.length === 0) {
      return { targetHeading: desiredHeading, speedScale: 1.0 };
    }

    // 依據航速與艦艇長度動態計算前視預測距離 (90m ~ 280m)
    const lookahead = Math.max(90, Math.min(280, ship.speed * 8.5 + ship.length * 1.6));
    const nearby = this.islands.filter((isl) => dist(ship.pos, isl.center) < isl.radius + lookahead + 120);
    if (nearby.length === 0) {
      ship.navAvoidSide = undefined;
      return { targetHeading: desiredHeading, speedScale: 1.0 };
    }

    // Fraction of the probe at which land is first met, or > 1 when the probe is clear
    const landAt = (heading: number): number => {
      const cx = Math.cos(heading);
      const cy = Math.sin(heading);
      for (const f of [0.3, 0.55, 0.8, 1]) {
        const p = { x: ship.pos.x + cx * lookahead * f, y: ship.pos.y + cy * lookahead * f };
        if (nearby.some((isl) => isPointOnIslandLand(p, isl))) return f;
      }
      return 2;
    };

    const ahead = landAt(desiredHeading);
    if (ahead > 1) {
      ship.navAvoidSide = undefined;
      return { targetHeading: desiredHeading, speedScale: 1.0 };
    }

    // Prefer the side already being used, otherwise the side with more sea room
    const side = ship.navAvoidSide ?? (landAt(desiredHeading + 0.6) >= landAt(desiredHeading - 0.6) ? 1 : -1);
    // Closer land ahead means a harder turn is needed: slow down to keep rudder authority
    const speedScale = Math.max(0.45, 0.35 + ahead * 0.65);
    for (let k = 1; k <= 12; k++) {
      for (const s of [side, -side]) {
        const heading = desiredHeading + s * k * 0.22;
        if (landAt(heading) > 1) {
          ship.navAvoidSide = s;
          return { targetHeading: heading, speedScale };
        }
      }
    }
    // Boxed in (a bay or a beach): back off the way we came
    return { targetHeading: desiredHeading + Math.PI, speedScale: 0.4 };
  }

  /**
   * Waypoint to steer for: skips ahead to the furthest waypoint already in clear sight, so a ship
   * that overshoots a turn (or was pushed off its lane) never circles back for a missed point.
   */
  private advanceSeaLane(ship: Ship, wps: Vector2D[]): Vector2D {
    let idx = ship.order.activeWaypointIndex ?? 0;
    while (
      idx < wps.length - 1 &&
      (dist(ship.pos, wps[idx]) < 110 || (this.navGrid?.hasClearWaterLine(ship.pos, wps[idx + 1], true) ?? false))
    ) {
      idx += 1;
    }
    ship.order.activeWaypointIndex = idx;
    return wps[Math.min(idx, wps.length - 1)];
  }

  /**
   * Flags a ship that wanted to make way but covered under a quarter of the expected distance in
   * the last four seconds; its next steering update replans its route and tries the other side.
   */
  private checkNavigationProgress(ship: Ship, dt: number): void {
    ship.navCheckTimer = (ship.navCheckTimer ?? 4) - dt;
    if (ship.navCheckTimer > 0) return;
    if (ship.navCheckPos && ship.targetSpeed > 2) {
      const expected = shipMapSpeed(ship.targetSpeed) * 4;
      if (dist(ship.pos, ship.navCheckPos) < expected * 0.25) {
        ship.navStuck = true;
        ship.navAvoidSide = -(ship.navAvoidSide ?? 1);
      }
    }
    ship.navCheckPos = { ...ship.pos };
    ship.navCheckTimer = 4;
  }

  private updateShipCombat(ship: Ship, dt: number) {
    const isPlayer = ship.side === 'player';
    const isFriendly = isPlayer || ship.side === 'allied';
    const targetShips = isFriendly ? this.enemyShips : [...this.playerShips, ...this.alliedShips];

    const hasAirSpotting = isFriendly && this.aircraft.some(
      (a) => (a.side === 'player' || a.side === 'allied') && a.model === 'os2u' && a.state !== 'shot_down'
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
          targetShips.find((s) => s.id === ship.order.targetId && !s.isSunk && this.isGunTarget(s, ship.side)) ||
          this.findTargetInstallation(ship.order.targetId);
      }

      if (!target || dist(ship.pos, target.pos) > effectiveRange) {
        target =
          targetShips
            .filter((s) => !s.isSunk && this.isGunTarget(s, ship.side) && dist(ship.pos, s.pos) <= effectiveRange)
            .sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos))[0] || null;
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
        (a) => this.isHostile(ship.side, a.side) && a.state !== 'shot_down' && dist(ship.pos, a.pos) < ship.flakRange
      );

      if (hostilePlanes.length > 0) {
        const targetPlane = hostilePlanes[Math.floor(Math.random() * hostilePlanes.length)];
        this.fireFlakBurst(ship.pos, targetPlane, ship.side);
        ship.flakCooldown = effectiveFlakRate;
      }
    }
  }

  /** Lead striker of a friendly strike package of this side that has no escort yet. */
  private findUnescortedPackage(side: Aircraft['side']): Aircraft | undefined {
    const escorted = new Set(this.aircraft.filter((a) => a.airMission === 'escort' && a.state !== 'shot_down').map((a) => a.packageId));
    return this.aircraft.find(
      (a) => a.side === side && a.airMission === 'strike' && a.state !== 'shot_down' && a.hasPayload && !escorted.has(a.packageId)
    );
  }

  /** Where enemy air raids come from: an intact enemy airfield, else an enemy carrier. */
  private getEnemyAirThreatAxis(): Vector2D | undefined {
    const airfield = this.islands
      .flatMap((i) => i.installations)
      .find((inst) => inst.type === 'airfield' && inst.side === 'enemy' && !inst.isDestroyed);
    if (airfield) return airfield.pos;
    return this.enemyShips.find((s) => !s.isSunk && (s.type === 'carrier' || s.type === 'cvhg_kiev'))?.pos;
  }

  /**
   * Turns a freshly launched squadron into a strike package: aircraft carrying air-to-ground
   * stores become strikers that fly together, air-to-air fighters become their escort.
   */
  private organizeStrikePackage(packageId: string): void {
    const members = this.aircraft.filter((a) => a.squadronId === packageId && a.state !== 'shot_down');
    const strikers = members.filter(isStriker);
    if (strikers.length === 0) return;
    for (const s of strikers) {
      s.airMission = 'strike';
      s.packageId = packageId;
    }
    members
      .filter((a) => !isStriker(a))
      .forEach((f, i) => {
        f.airMission = 'escort';
        f.packageId = packageId;
        f.state = 'patrolling';
        f.order = { type: 'patrol', patrolOrigin: { ...strikers[0].pos } };
        // Escort elements weave either side of the package, the high cover a little ahead
        f.wingmanOffset = { x: (i % 2 === 0 ? 1 : -1) * (110 + Math.floor(i / 2) * 70), y: (i % 2 === 0 ? -1 : 1) * 60 };
      });
  }

  /**
   * Per-tick mission upkeep: escorts take station on their package's lead, strike packages cruise
   * at their slowest member's speed until they split for the attack, and sweeps go home once
   * their time over the target area is spent.
   */
  private updateAirMissions(dt: number): void {
    const packages = new Map<string, Aircraft[]>();
    for (const a of this.aircraft) {
      if (a.airMission === 'strike' && a.packageId && a.state !== 'shot_down' && a.hasPayload && a.order.type === 'attack') {
        const list = packages.get(a.packageId);
        if (list) list.push(a);
        else packages.set(a.packageId, [a]);
      }
    }

    for (const plane of this.aircraft) {
      if (plane.state === 'shot_down') continue;
      if (plane.airMission === 'escort') {
        const strikers = plane.packageId ? packages.get(plane.packageId) : undefined;
        if (!strikers || strikers.length === 0) {
          // Package has attacked or been destroyed: the escort goes home with it
          plane.airMission = undefined;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
          continue;
        }
        const lead = strikers[0];
        const cos = Math.cos(lead.heading);
        const sin = Math.sin(lead.heading);
        plane.order.patrolOrigin = {
          x: lead.pos.x + cos * 140 - sin * plane.wingmanOffset.x,
          y: lead.pos.y + sin * 140 + cos * plane.wingmanOffset.x,
        };
      } else if (plane.airMission === 'strike' && plane.packageId && plane.state === 'cruising') {
        const strikers = packages.get(plane.packageId);
        const target = plane.order.targetPos;
        if (strikers && strikers.length > 1 && target && dist(plane.pos, target) > 1500) {
          const packageSpeed = Math.min(...strikers.map((s) => s.maxSpeed));
          plane.speed = Math.min(plane.maxSpeed, packageSpeed);
        }
      } else if (plane.airMission === 'sweep' && plane.order.patrolOrigin) {
        if (dist(plane.pos, plane.order.patrolOrigin) < 900) plane.missionTimer = (plane.missionTimer ?? 45) - dt;
        if ((plane.missionTimer ?? 1) <= 0) {
          plane.airMission = undefined;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    }
  }

  // 2. Update Aircraft with Air Warfare RTS Logic
  private updateAircraft(dt: number) {
    const flagship = this.getFlagship();
    this.updateAirMissions(dt);

    for (let i = this.aircraft.length - 1; i >= 0; i--) {
      const plane = this.aircraft[i];

      if (this.updateShotDownAircraft(dt, i, plane)) continue;

      if (plane.ferryTo) {
        if (this.updateFerryFlight(dt, i, plane)) continue;
        // still en route: fall through to steering and movement (no combat orders)
      }

      if (this.updateOhkaRocket(dt, plane)) continue;

      this.updateOhkaCarrierRelease(plane);

      if (this.updateKamikazeAttack(dt, plane)) continue;

      // RTS Orders Execution
      // ══════════════════════════════════════════════════════════
      // 蘇聯/北越 GCI「一擊脫離 (Hit & Run)」超音速掠殺與脫離狀態機
      // ══════════════════════════════════════════════════════════
      if (plane.isHitAndRunActive) {
        this.updateHitAndRunPass(dt, plane);
      } else if (plane.state === 'bombing_run') {
        this.updateBombingRun(dt, plane);
      } else if (plane.state === 'pullout') {
        this.updateDivePullout(dt, plane);
      } else if (plane.order.type === 'attack') {
        if (this.updateAttackOrder(dt, plane)) continue;
      } else if (plane.order.type === 'patrol' || plane.state === 'patrolling') {
        if (this.updatePatrolOrder(dt, flagship, plane)) continue;
      } else if (plane.order.type === 'move' && plane.order.targetPos) {
        if (this.updateMoveOrder(dt, plane)) continue;
      } else if (plane.state === 'returning' || plane.order.type === 'rtb') {
        if (this.updateReturnToBase(dt, flagship, i, plane)) continue;
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

      this.updateCountermeasures(dt, plane);

      // 威脅配對規避機動姿態維持 (Threat-Matched Evasive Maneuver Steering)
      if (plane.isEvading && (plane.evasionTimer || 0) > 0) {
        if (plane.evasionTactic === 'notching') {
          // 壓低高度隱蔽於海面雜波反射區
          plane.altitude = Math.max(0.14, plane.altitude - dt * 0.45);
        } else if (plane.evasionTactic === 'breaking') {
          // 高G轉彎應急加力推力
          plane.speed = Math.min(plane.maxSpeed * 1.35, plane.speed + dt * 240);
        }
      }

      // Smooth Heading
      let aDiff = plane.targetHeading - plane.heading;
      while (aDiff > Math.PI) aDiff -= Math.PI * 2;
      while (aDiff < -Math.PI) aDiff += Math.PI * 2;
      const turnSpeed = (plane.isEvading ? (plane.evasionTactic === 'breaking' ? 6.5 : 4.8) : 2.4) * dt;
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
        TAIL_GUNNER_MODELS.has(plane.model);

      if (hasTailGunner) {
        plane.rearGunnerCooldown = Math.max(0, (plane.rearGunnerCooldown || 0) - dt);
        if (plane.rearGunnerCooldown <= 0) {
          const isB29 = plane.model === 'b29';
          // B-29 超級堡壘配備 CFC 類比計算機遙控雙聯機槍塔群 (前上、後上、前下、後下與尾砲)，具備 360 度半球全向自衛火力！
          // 其他機種為後方錐形約 75 度角自衛機槍
          const pursuer = this.aircraft.find((other) => {
            if (!this.isHostile(plane.side, other.side) || other.state === 'shot_down') return false;
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

  /** Crash sequence for a shot-down aircraft; true once the wreck is removed. */
  private updateShotDownAircraft(dt: number, i: number, plane: Aircraft): boolean {
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
      return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // SPECIAL ERA 2 THREATS: OHKA ROCKET, G4M BETTY, & KAMIKAZE
  // ══════════════════════════════════════════════════════════
  // 1. MXY-7 櫻花特攻火箭反艦飛彈 (Rocket-Propelled Anti-Ship Suicide Missile)
  private updateOhkaRocket(dt: number, plane: Aircraft): boolean {
    if (plane.model === 'ohka') {
      plane.speed = SPECIAL_ATTACK_SPEED.ohka;
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
        [...this.playerShips, ...this.alliedShips]
          .filter((s) => !s.isSunk && !this.isSubmarine(s) && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3200))
          .sort((a, b) => (a.id === plane.order.targetId ? -1 : b.id === plane.order.targetId ? 1 : dist(plane.pos, a.pos) - dist(plane.pos, b.pos)))[0] ||
        this.getFlagship();

      if (targetShip) {
        const d = dist(plane.pos, targetShip.pos);
        plane.targetHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);
        plane.altitude = Math.max(0.08, plane.altitude - dt * 0.45);

        if (d < 45 || (d < 85 && plane.altitude <= 0.12)) {
          // 直擊命中！1200kg特裝穿甲彈頭巨爆
          soundEngine.playExplosion(true);
          const warheadDmg = 2200;
          const safeArmor = Math.min(0.85, Math.max(0, targetShip.armor || 0));
          const actualDmg = Math.round(warheadDmg * (1 - safeArmor * 0.35));
          targetShip.health = Math.max(0, targetShip.health - actualDmg);
          if (targetShip.hullCrewHealth !== undefined) {
            targetShip.hullCrewHealth = Math.max(0, targetShip.hullCrewHealth - actualDmg);
            targetShip.health = targetShip.hullCrewHealth;
          }

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
          return true;
        }
      }
    }
    return false;
  }

  // 2. 一式陸攻 (G4M "Betty") 投放櫻花特攻火箭
  private updateOhkaCarrierRelease(plane: Aircraft): void {
    if (plane.model === 'g4m' && plane.hasOhkaAttached) {
      const targetShip =
        [...this.playerShips, ...this.alliedShips]
          .filter((s) => !s.isSunk && !this.isSubmarine(s) && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3800))
          .sort((a, b) => (a.id === plane.order.targetId ? -1 : b.id === plane.order.targetId ? 1 : dist(plane.pos, a.pos) - dist(plane.pos, b.pos)))[0] ||
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
            speed: SPECIAL_ATTACK_SPEED.ohka,
            maxSpeed: SPECIAL_ATTACK_SPEED.ohka,
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
  }

  // 3. 一般神風特攻機 (A6M5 / Suisei Suicide Attack)
  private updateKamikazeAttack(dt: number, plane: Aircraft): boolean {
    if (plane.isKamikaze || plane.model === 'kamikaze_zero' || plane.model === 'kamikaze_judy') {
      const targetShip =
        [...this.playerShips, ...this.alliedShips]
          .filter((s) => !s.isSunk && !this.isSubmarine(s) && (s.id === plane.order.targetId || dist(plane.pos, s.pos) < 3200))
          .sort((a, b) => (a.id === plane.order.targetId ? -1 : b.id === plane.order.targetId ? 1 : dist(plane.pos, a.pos) - dist(plane.pos, b.pos)))[0] ||
        this.getFlagship();

      if (targetShip) {
        const d = dist(plane.pos, targetShip.pos);
        plane.targetHeading = Math.atan2(targetShip.pos.y - plane.pos.y, targetShip.pos.x - plane.pos.x);

        // 距離小於 950米 時進入特攻俯衝
        if (d < 950 && plane.state !== 'kamikaze_dive') {
          plane.state = 'kamikaze_dive';
          plane.speed = SPECIAL_ATTACK_SPEED.kamikazeDive;
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
            const safeArmor = Math.min(0.85, Math.max(0, targetShip.armor || 0));
            const actualDmg = Math.round(suicideDmg * (1 - safeArmor * 0.3));
            targetShip.health = Math.max(0, targetShip.health - actualDmg);
            if (targetShip.hullCrewHealth !== undefined) {
              targetShip.hullCrewHealth = Math.max(0, targetShip.hullCrewHealth - actualDmg);
              targetShip.health = targetShip.hullCrewHealth;
            }

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
            return true;
          }
        }
      }
    }
    return false;
  }

  /** GCI hit-and-run supersonic slashing pass and egress. */
  private updateHitAndRunPass(dt: number, plane: Aircraft): void {
    plane.disengageTimer = (plane.disengageTimer || 5.0) - dt;
    plane.targetHeading = plane.bugOutHeading ?? plane.heading;

    if (plane.model === 'mig21') {
      // MiG-21: Mach 1.5+ supersonic afterburner climb & high-speed sprint
      plane.speed = plane.maxSpeed * 1.55;
      plane.altitude = Math.min(0.98, plane.altitude + dt * 0.22);

      // Supersonic afterburner flame & shock diamond particles
      if (Math.random() < 0.85) {
        const exhaustX = plane.pos.x - Math.cos(plane.heading) * 16;
        const exhaustY = plane.pos.y - Math.sin(plane.heading) * 16;
        this.particles.push({
          id: `ab-flame-${Date.now()}-${Math.random()}`,
          x: exhaustX,
          y: exhaustY,
          vx: -Math.cos(plane.heading) * 60 + (Math.random() - 0.5) * 8,
          vy: -Math.sin(plane.heading) * 60 + (Math.random() - 0.5) * 8,
          life: 0.28,
          maxLife: 0.28,
          radius: 4.5,
          color: Math.random() < 0.6 ? '#00E5FF' : '#FF6D00',
          type: 'fire',
        });
      }
    } else if (plane.model === 'mig17') {
      // MiG-17: Low-altitude terrain masking egress to drop below radar horizon
      plane.speed = plane.maxSpeed * 1.25;
      plane.altitude = Math.max(0.12, plane.altitude - dt * 0.28);
      if (Math.random() < 0.5) {
        const exhaustX = plane.pos.x - Math.cos(plane.heading) * 12;
        const exhaustY = plane.pos.y - Math.sin(plane.heading) * 12;
        this.particles.push({
          id: `mig17-smoke-${Date.now()}-${Math.random()}`,
          x: exhaustX,
          y: exhaustY,
          vx: -Math.cos(plane.heading) * 25,
          vy: -Math.sin(plane.heading) * 25,
          life: 0.4,
          maxLife: 0.4,
          radius: 3.5,
          color: 'rgba(90, 100, 110, 0.6)',
          type: 'smoke',
        });
      }
    } else {
      plane.speed = plane.maxSpeed * 1.3;
    }

    if (plane.disengageTimer <= 0) {
      plane.isHitAndRunActive = false;
      plane.hitAndRunStage = 'ingress';
      plane.speed = plane.maxSpeed;
      // Re-target nearest hostile aircraft or naval ship to begin next slashing pass
      const nextTarget = this.aircraft.find((a) => this.isHostile(plane.side, a.side) && a.state !== 'shot_down');
      if (nextTarget) {
        plane.order = { type: 'attack', targetPos: nextTarget.pos, targetId: nextTarget.id };
      } else {
        plane.order = { type: 'patrol' };
      }
    }
    // While disengaging, skip normal attack turning to maintain breakaway trajectory
  }

  private updateBombingRun(dt: number, plane: Aircraft): void {
    // 保持直線穩定平飛穿越目標，沿航線直線投下串列炸彈後再脫離
    this.updateBombingRunCorridor(plane, dt);
  }

  private updateDivePullout(dt: number, plane: Aircraft): void {
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
  }

  /** Attack order: intercept, dogfight, strike and weapon release against the assigned target. */
  private updateAttackOrder(dt: number, plane: Aircraft): boolean {
    // Find designated target
    const allShips = [...this.playerShips, ...this.alliedShips, ...this.enemyShips];
    const rawShipTarget = allShips.find((s) => s.id === plane.order.targetId && !s.isSunk && this.isHostile(plane.side, s.side));
    const canSeeShipTarget =
      rawShipTarget &&
      (!this.isSubmarine(rawShipTarget) ||
        (rawShipTarget.side === 'enemy' ? Boolean(rawShipTarget.isSpotted) : Boolean(rawShipTarget.isSpottedByEnemy)));

    let targetEntity =
      (canSeeShipTarget ? rawShipTarget : undefined) ||
      this.aircraft.find((a) => a.id === plane.order.targetId && a.state !== 'shot_down' && this.isHostile(plane.side, a.side)) ||
      (() => {
        const inst = this.findTargetInstallation(plane.order.targetId || '');
        return inst && this.isHostile(plane.side, inst.side) ? inst : null;
      })() ||
      this.groundUnits.find((u) => u.id === plane.order.targetId && !u.isDestroyed && !u.embarkedInShipId && this.isHostile(plane.side, u.side));

    // 時代一~時代四 CAS 近接支援自動索敵: 若無指定目標或原目標已遭殲滅，自動搜尋周邊敵方地面裝甲與部隊
    if (!targetEntity && this.isCasAircraft(plane)) {
      const autoGround = this.acquireCasGroundTarget(plane);
      if (autoGround) {
        targetEntity = autoGround;
        plane.order.targetId = autoGround.id;
        plane.order.targetPos = autoGround.pos;
      }
    }

    // 若為 ASW 反潛機失去已下潛目標 (Fog of War)，恢復反潛巡邏而非直接浪費返航
    const isAswPlane =
      plane.missionType === 'asw_patrol' ||
      plane.payloadType === 'asw_torpedo' ||
      plane.payloadType === 'asw_acoustic_torpedo' ||
      plane.model === 'be12' ||
      plane.model === 'il38' ||
      plane.model === 'ka27';

    if (plane.order.targetId && !targetEntity) {
      if (isAswPlane && plane.hasPayload) {
        plane.order = { type: 'patrol', patrolOrigin: plane.order.patrolOrigin || { ...plane.pos } };
        plane.state = 'patrolling';
        return true;
      }
      // 指定目標已遭殲滅或並非敵對目標！終止無效空襲任務返航
      plane.order = { type: 'rtb' };
      plane.state = 'returning';
      return true;
    }

    const targetPos = targetEntity ? targetEntity.pos : plane.order.targetPos;
    if (!targetPos) {
      plane.order = { type: 'rtb' };
      plane.state = 'returning';
      return true;
    }

    if (targetPos) {
      const dx = targetPos.x - plane.pos.x;
      const dy = targetPos.y - plane.pos.y;
      const d = Math.hypot(dx, dy);
      plane.targetHeading = Math.atan2(dy, dx);

      if (plane.hasPayload) {
        this.releasePayloadOnTarget(dt, plane, targetEntity, targetPos, d);
      } else {
        // Dogfight intercept & strafe
        plane.shootCooldown -= dt;
        const targetPlane = targetEntity && 'role' in targetEntity ? (targetEntity as Aircraft) : null;
        if (targetPlane && targetPlane.state !== 'shot_down') {
          if (plane.side === 'enemy' && (plane.model === 'su27' || plane.model === 'mig29a' || plane.model === 'mig23' || plane.model === 'mig31' || plane.model === 'mig21' || plane.model === 'mig17')) {
            if (plane.model === 'su27' || plane.model === 'mig29a' || plane.model === 'mig23' || plane.model === 'mig31') {
              // Era 5 Soviet 4th Gen Fighters: R-27 BVR & R-73 High-Off-Boresight Dogfight
              if (d >= 1000 && d <= AIR_WEAPON_RANGE.r27er && plane.shootCooldown <= 0) {
                this.fireAAMissile(plane, targetPlane, 'aim7'); // R-27ER Alamo BVR
                plane.shootCooldown = 5.0;
              } else if (d < 1000 && d > 200 && plane.shootCooldown <= 0) {
                this.fireAAMissile(plane, targetPlane, 'aim9'); // R-73 Archer All-Aspect Dogfight
                plane.shootCooldown = 4.0;
              } else if (d <= 250 && plane.shootCooldown <= 0) {
                this.fireAircraftGuns(plane, targetPos);
                plane.shootCooldown = 0.15;
              }
            } else if (plane.model === 'mig21') {
              if (d >= 320 && d <= AIR_WEAPON_RANGE.k13 && plane.shootCooldown <= 0) {
                this.fireAAMissile(plane, targetPlane, 'k13');
                plane.shootCooldown = 4.2;
                this.triggerSovietHitAndRun(plane, targetPlane.pos);
              } else if (d < 320 && plane.shootCooldown <= 0) {
                this.fireAircraftGuns(plane, targetPos);
                plane.shootCooldown = 0.18;
                this.triggerSovietHitAndRun(plane, targetPos);
              }
            } else {
              // MiG-17 37mm/23mm heavy cannon pass
              if (d < 360 && plane.shootCooldown <= 0) {
                this.fireAircraftGuns(plane, targetPos);
                plane.shootCooldown = 0.22;
                this.triggerSovietHitAndRun(plane, targetPos);
              }
            }
          } else if ((plane.side === 'player' || plane.side === 'allied') && (FRIENDLY_MISSILE_FIGHTER_MODELS.has(plane.model))) {
            if (plane.model === 'f14a' && d >= 1600 && d <= AIR_WEAPON_RANGE.aim54 && plane.shootCooldown <= 0) {
              this.firePhoenixMissile(plane, targetPlane.pos, targetPlane);
              plane.shootCooldown = 7.0;
            } else if (d >= 800 && d <= AIR_WEAPON_RANGE.aim7 && (plane.sarhHoldTimer || 0) <= 0 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, targetPlane, 'aim7');
              plane.shootCooldown = 5.5;
            } else if (d < 800 && d > 200 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, targetPlane, 'aim9');
              plane.shootCooldown = 4.0;
            } else if (d <= 250 && plane.shootCooldown <= 0) {
              this.fireAircraftGuns(plane, targetPos);
              plane.shootCooldown = 0.16;
            }
          } else {
            if (plane.shootCooldown <= 0 && d < 240) {
              this.fireAircraftGuns(plane, targetPos);
              plane.shootCooldown = 0.2;
            }
          }
        } else {
          // 對地或對艦無彈藥俯衝低空掃射 (僅在確認目標敵對存在時擊發)
          if (plane.shootCooldown <= 0 && d < 240 && targetEntity && this.isHostile(plane.side, targetEntity.side)) {
            this.fireAircraftGuns(plane, targetPos);
            plane.shootCooldown = 0.2;
          }
        }
      }
    }
    return false;
  }

  // ════ 優先判定超視距/遠程導引飛彈（確保 B-52G / Tu-22 等戰略轟炸機掛載魚叉/暴風反艦飛彈時能在 4000m 外實施遠程獵殺，不誤入近距離地毯投彈）════
  private releasePayloadOnTarget(dt: number, plane: Aircraft, targetEntity: Aircraft | GroundUnit | Installation | Ship | undefined, targetPos: Vector2D, d: number): void {
    if (plane.payloadType === 'rgm84_harpoon') {
      // ════ 魚叉超視距反艦飛彈 (AGM-84 Harpoon AShM): 4000m 掠海主動雷達導引 ════
      if (d < AIR_WEAPON_RANGE.harpoon) {
        this.fireAirLaunchedHarpoon(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'kh22_burya') {
      // ════ Kh-22 暴風超音速高空俯衝重型反艦飛彈 (Mach 4.0): 4600m ════
      if (d < AIR_WEAPON_RANGE.kh22) {
        this.fireKh22Missile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'p700_granit') {
      // ════ P-700 花崗岩超音速飽和掠海反艦群: 4600m ════
      if (d < AIR_WEAPON_RANGE.p700) {
        this.fireGranitMissile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'agm88_harm') {
      // ════ AGM-88 HARM 高速反輻射飛彈 (SEAD 獵殺雷達與防空陣地): 4200m ════
      if (d < AIR_WEAPON_RANGE.harm) {
        this.fireHARMMissile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.role === 'level_bomber') {
      // ════ 水平重型轟炸機 (Level Bomber - B-17 / B-24 / B-29 / B-52 地毯走廊): 保持平流層萬米平飛航線，直線穿透投彈走廊 ════
      plane.altitude = (plane.model === 'b29' || plane.model === 'b52') ? 0.98 : 0.95;
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
      plane.payloadType === 'asw_acoustic_torpedo' ||
      plane.role === 'torpedo_bomber'
    ) {
      // ════ 掠海低空魚雷 / 反潛聲自導魚雷攻擊 (Torpedo Run) ════
      if (d < 560) {
        plane.altitude = Math.max(0.12, plane.altitude - dt * 0.6);
      }
      if (d < 320) {
        this.dropAircraftTorpedo(plane, targetPos);
        const isAswTorp = plane.payloadType === 'asw_torpedo' || plane.payloadType === 'asw_acoustic_torpedo';
        if (isAswTorp && (plane.ammoRemaining ?? 1) > 1) {
          plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
          plane.order = { type: 'patrol', patrolOrigin: { ...targetPos } };
          plane.state = 'patrolling';
        } else {
          plane.ammoRemaining = 0;
          plane.hasPayload = false;
          // Immediate 45-degree evasive breakaway turn to dodge ship anti-aircraft fire
          plane.heading += (Math.random() > 0.5 ? 1 : -1) * 0.78;
          plane.targetHeading = plane.heading;
          plane.breakawayTimer = 1.8;
        }
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
    } else if (plane.payloadType === 'aim54_phoenix') {
      // ════ AIM-54 鳳凰超遠程空空/反飛彈攔截 (AWG-9 Mach 4.3): 4800m BVR ════
      if (d < AIR_WEAPON_RANGE.aim54) {
        this.firePhoenixMissile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 6) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'agm65_maverick') {
      // ════ AGM-65 小牛精確電視/紅外導引反裝甲飛彈: 2400m ════
      if (d < AIR_WEAPON_RANGE.maverick) {
        this.fireMaverickMissile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'hellfire_missiles' || plane.payloadType === 'tow_missiles') {
      // ════ AGM-114 地獄火 / BGM-71 拖式 反戰車導引飛彈: 2000m ════
      if (d < AIR_WEAPON_RANGE.hellfire) {
        this.fireHellfireMissile(plane, targetPos, targetEntity);
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'aim9_sidewinder') {
      if (d < AIR_WEAPON_RANGE.aim9) {
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
      if (d < AIR_WEAPON_RANGE.aim7) {
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
      if (d < AIR_WEAPON_RANGE.shrike) {
        let radarTarget = targetEntity && 'type' in targetEntity ? targetEntity as Installation : null;
        if (!radarTarget) {
          for (const isl of this.islands) {
            const rInst = isl.installations.find(
              (i) => !i.isDestroyed && this.isHostile(plane.side, i.side) && (i.type === 'fan_song_radar' || i.type === 'radar_station')
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
      if (d < AIR_WEAPON_RANGE.bullpup) {
        this.fireBullpupMissile(plane, targetPos);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'agm62_walleye') {
      if (d < AIR_WEAPON_RANGE.walleye) {
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
        plane.ammoRemaining = 0;
        plane.hasPayload = false;
        plane.order = { type: 'rtb' };
        plane.state = 'returning';
      }
    } else if (plane.payloadType === 'c1_paratroopers') {
      plane.altitude = 0.5;
      if (d < 220) {
        this.dropParatroopers(plane, targetPos);
        plane.ammoRemaining = 0;
        plane.hasPayload = false;
        plane.order = { type: 'rtb' };
        plane.state = 'returning';
      }
    } else if (plane.model === 'tu16') {
      // ════ 蘇聯海航 Tu-16 獾式長程飛彈轟炸機: 2800m 發射 KSR-5 超音速反艦飛彈 ════
      if (d < AIR_WEAPON_RANGE.ksr5) {
        this.fireTu16KSR5Missile(plane, targetPos);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'aim7_aim9_combo') {
      // ════ AIM-7 麻雀 + AIM-9 響尾蛇 雙重空優混編 (遠程半主動雷達 + 近距紅外格鬥) ════
      const targetHostile = targetEntity || { pos: targetPos, id: plane.order.targetId || '' };
      const targetPlane = 'role' in targetHostile ? targetHostile : null;
      // Half the rails carry Sparrows (e.g. F-4: 4 AIM-7 + 4 AIM-9), fired first at beyond-visual range
      const sparrowsLeft = (plane.ammoRemaining || 0) - Math.floor((plane.maxAmmo || 4) / 2);
      if (d >= 1200 && d <= AIR_WEAPON_RANGE.aim7 && sparrowsLeft > 0) {
        this.fireAAMissile(plane, targetPlane || targetHostile, 'aim7');
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
      } else if (d < AIR_WEAPON_RANGE.aim9) {
        this.fireAAMissile(plane, targetPlane || targetHostile, 'aim9');
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'gbu10_laser_paveway') {
      // ════ GBU-10 鋪路雷射導引穿甲炸彈 (外科手術式精確破障) ════
      if (d < AIR_WEAPON_RANGE.laserBomb) {
        this.dropLaserGuidedBomb(plane, targetPos);
        plane.ammoRemaining = (plane.ammoRemaining || 2) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.order = { type: 'rtb' };
          plane.state = 'returning';
        }
      }
    } else if (plane.payloadType === 'cbu_cluster_bombs') {
      // ════ CBU-24 / Rockeye 廣域集束子母彈群 (80m 防空陣地粉碎) ════
      plane.altitude = Math.max(0.28, plane.altitude - dt * 0.45);
      if (d < 380) {
        this.dropClusterBombs(plane, targetPos);
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 1;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.state = 'pullout';
          plane.pulloutTimer = 1.3;
        }
      }
    } else if (plane.payloadType === 'blu27_napalm') {
      // ════ BLU-27 凝固汽油燃燒彈 (75m 叢林火海持續灼燒) ════
      plane.altitude = Math.max(0.2, plane.altitude - dt * 0.55);
      if (d < 280) {
        this.dropNapalmCanisters(plane, targetPos);
        plane.ammoRemaining = (plane.ammoRemaining || 4) - 2;
        if ((plane.ammoRemaining || 0) <= 0) {
          plane.hasPayload = false;
          plane.state = 'pullout';
          plane.pulloutTimer = 1.4;
        }
      }
    } else if (plane.payloadType === 'agm78_standard_arm') {
      // ════ AGM-78 標準長程反輻射飛彈 (3600m SEAD 野鼬超遠程獵殺) ════
      if (d < AIR_WEAPON_RANGE.standardArm) {
        let radarTarget = targetEntity && 'type' in targetEntity ? targetEntity as Installation : null;
        if (!radarTarget) {
          for (const isl of this.islands) {
            const rInst = isl.installations.find(
              (i) => !i.isDestroyed && this.isHostile(plane.side, i.side) && (i.type === 'fan_song_radar' || i.type === 'radar_station')
            );
            if (rInst) {
              radarTarget = rInst;
              break;
            }
          }
        }
        if (radarTarget) {
          this.fireStandardARM(plane, radarTarget);
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
    } else if (plane.payloadType === 'mer_iron_bombs') {
      // ════ MER 多聯掛架 18-24枚 500lb 通用高爆彈群 (密集連環彈幕走廊) ════
      plane.altitude = Math.max(0.26, plane.altitude - dt * 0.4);
      if (d < 340) {
        this.dropMERIronBombStick(plane, targetPos);
        plane.hasPayload = false;
        plane.state = 'pullout';
        plane.pulloutTimer = 1.5;
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
  }

  /** CAP / patrol orbit with threat detection and interception. */
  private updatePatrolOrder(dt: number, flagship: Ship | undefined, plane: Aircraft): boolean {
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

    // In Era 4 & 5 or with modern radar, fighters have extended radar search range (up to 4800m for F-14 AWG-9)!
    const isModernFighter = this.era === 'era4' || this.era === 'era5' || plane.payloadType === 'aim7_sparrow' || plane.payloadType === 'aim9_sidewinder' || plane.payloadType === 'aim54_phoenix';
    const radarPerimeter = plane.model === 'f14a' ? 4800 : (this.era === 'era5' ? 3800 : isModernFighter ? 2400 : 420);

    // Find hostile aircraft within patrol radar
    // Mission-aware intercept: CAP/BARCAP go for bombers and stay leashed to their station, a
    // sweep hunts fighters, an escort fights only what threatens its package
    const hostile = selectAirTarget(
      plane,
      this.aircraft.filter((a) => this.isHostile(plane.side, a.side)),
      center,
      radarPerimeter,
      plane.airMission ?? 'cap'
    );

    if (hostile && plane.role === 'fighter') {
      const hDist = dist(plane.pos, hostile.pos);
      plane.targetHeading = Math.atan2(hostile.pos.y - plane.pos.y, hostile.pos.x - plane.pos.x);
      plane.shootCooldown -= dt;

      if (isModernFighter) {
        if (plane.side === 'enemy' && (plane.model === 'su27' || plane.model === 'mig29a' || plane.model === 'mig23' || plane.model === 'mig31' || plane.model === 'mig21' || plane.model === 'mig17')) {
          if (plane.model === 'su27' || plane.model === 'mig29a' || plane.model === 'mig23' || plane.model === 'mig31') {
            if (hDist >= 1000 && hDist <= 3600 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, hostile, 'aim7'); // R-27ER Alamo
              plane.shootCooldown = 5.0;
            } else if (hDist < 1000 && hDist > 200 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, hostile, 'aim9'); // R-73 Archer
              plane.shootCooldown = 4.0;
            } else if (hDist <= 250 && plane.shootCooldown <= 0) {
              this.fireAircraftGuns(plane, hostile.pos);
              plane.shootCooldown = 0.15;
            }
          } else if (plane.model === 'mig21') {
            if (hDist >= 320 && hDist <= 1800 && plane.shootCooldown <= 0) {
              this.fireAAMissile(plane, hostile, 'k13');
              plane.shootCooldown = 4.2;
              this.triggerSovietHitAndRun(plane, hostile.pos);
            } else if (hDist < 320 && plane.shootCooldown <= 0) {
              this.fireAircraftGuns(plane, hostile.pos);
              plane.shootCooldown = 0.18;
              this.triggerSovietHitAndRun(plane, hostile.pos);
            }
          } else {
            if (hDist < 360 && plane.shootCooldown <= 0) {
              this.fireAircraftGuns(plane, hostile.pos);
              plane.shootCooldown = 0.22;
              this.triggerSovietHitAndRun(plane, hostile.pos);
            }
          }
        } else {
          // F-14A Phoenix ultra long range (1600m - 4800m)
          if (plane.model === 'f14a' && hDist >= 1600 && hDist <= 4800 && plane.shootCooldown <= 0) {
            this.firePhoenixMissile(plane, hostile.pos, hostile);
            plane.shootCooldown = 7.0;
          }
          // BVR Engagement (800m - 3200m): AIM-7 Sparrow SARH
          else if (hDist >= 800 && hDist <= 3200 && (plane.sarhHoldTimer || 0) <= 0 && plane.shootCooldown <= 0) {
            this.fireAAMissile(plane, hostile, 'aim7');
            plane.shootCooldown = 5.5;
          }
          // Dogfight Salvo (< 800m): Dual AIM-9 Sidewinder Salvo (ripple 2 missiles)
          else if (hDist < 800 && hDist > 200 && plane.shootCooldown <= 0) {
            this.fireAAMissile(plane, hostile, 'aim9');
            this.scheduleAction(0.25, () => {
              if (plane.state !== 'shot_down') {
                this.fireAAMissile(plane, hostile, 'aim9');
              }
            });
            plane.shootCooldown = 4.5;
          }
          // Close Guns (< 250m): M61 Vulcan stream
          else if (hDist <= 250 && plane.shootCooldown <= 0) {
            this.fireAircraftGuns(plane, hostile.pos);
            plane.shootCooldown = 0.16;
          }
        }
      } else {
        // Era 1 - 3 WWII/Korea machine guns
        if (plane.shootCooldown <= 0 && hDist < 220) {
          this.fireAircraftGuns(plane, hostile.pos);
          plane.shootCooldown = 0.22;
        }
      }
    } else {
      // 反潛機主動巡邏：定時投放聲吶浮標 / 吊放聲吶脈衝，並自動獵殺已被定位之敵方潛艦
      const aswRange = this.getAircraftAswSonarRange(plane);
      // Player ASW aircraft on patrol lay their own buoy pattern: one buoy every ~18 s wherever
      // no friendly buoy is already listening
      if (aswRange > 0 && plane.side === 'player' && (plane.sonobuoyAmmo ?? 0) > 0) {
        plane.sonobuoyDropTimer = (plane.sonobuoyDropTimer ?? 6) - dt;
        if (plane.sonobuoyDropTimer <= 0) {
          plane.sonobuoyDropTimer = 18;
          if (!this.sonobuoys.some((b) => dist(b.pos, plane.pos) < 900)) this.deploySonobuoyFromAircraft(plane, { ...plane.pos });
        }
      }
      if (aswRange > 0) {
        plane.sonarPingCooldown = (plane.sonarPingCooldown ?? 2.5) - dt;
        if (plane.sonarPingCooldown <= 0) {
          plane.sonarPingCooldown = 3.8;
          this.particles.push({
            id: `air-sonar-${Date.now()}-${Math.random()}`,
            x: plane.pos.x,
            y: plane.pos.y,
            vx: 0,
            vy: 0,
            life: 0.9,
            maxLife: 0.9,
            radius: 45,
            color: plane.side === 'enemy' ? '#FF5252' : '#00E5FF',
            type: 'shockwave',
            shape: 'ring',
          });
        }

        if (plane.hasPayload) {
          const spottedSub =
            plane.side === 'enemy'
              ? [...this.playerShips, ...this.alliedShips].find(
                  (s) => !s.isSunk && this.isSubmarine(s) && s.isSpottedByEnemy && dist(plane.pos, s.pos) < 2200
                )
              : this.enemyShips.find(
                  (s) => !s.isSunk && this.isSubmarine(s) && s.isSpotted && dist(plane.pos, s.pos) < 2200
                );
          if (spottedSub) {
            plane.order = { type: 'attack', targetId: spottedSub.id, targetPos: { ...spottedSub.pos }, patrolOrigin: center };
            plane.state = 'attacking';
            return true;
          }
        }
      }

      // 時代一~時代四 CAS 戰機常態空巡自動索敵地面部隊 (Auto-engage ground troops when patrolling)
      if (this.isCasAircraft(plane) && (plane.hasPayload || (plane.gunAmmo ?? 0) > 0)) {
        const autoCasTarget = this.acquireCasGroundTarget(plane);
        if (autoCasTarget) {
          plane.order = { type: 'attack', targetId: autoCasTarget.id, targetPos: autoCasTarget.pos };
          plane.state = 'attacking';
          plane.shootCooldown = 0.4;
          this.addCombatLog({
            category: 'air',
            sourceSide: plane.side,
            sourceName: plane.name,
            targetName: autoCasTarget.name,
            actionType: 'recon_spotted',
            text: `🎯【CAS 密接空中支援索敵】「${plane.name}」在空巡巡邏空域偵測到敵「${autoCasTarget.name}」，立即壓低機頭展開俯衝攻擊！`,
          });
          return true;
        }
      }

      if (plane.airMission === 'escort') {
        plane.targetHeading = Math.atan2(center.y - plane.pos.y, center.x - plane.pos.x);
        return false;
      }

      // Circular orbit (ASW planes sweep wider corridors)
      const orbitR = aswRange > 0 ? 520 : 250;
      const a = Date.now() * (aswRange > 0 ? 0.0009 : 0.0016);
      const ox = center.x + Math.cos(a) * orbitR + plane.wingmanOffset.x;
      const oy = center.y + Math.sin(a) * orbitR + plane.wingmanOffset.y;
      plane.targetHeading = Math.atan2(oy - plane.pos.y, ox - plane.pos.x);
    }
    return false;
  }

  private updateMoveOrder(dt: number, plane: Aircraft): boolean {
    // Narrowing guard carried over from the caller's `plane.order.type === 'move' && plane.order.targetPos` test
    if (!plane.order.targetPos) return false;
    const dx = plane.order.targetPos.x - plane.pos.x;
    const dy = plane.order.targetPos.y - plane.pos.y;
    const moveDist = Math.hypot(dx, dy);
    plane.targetHeading = Math.atan2(dy, dx);

    const isPendingTroopDrop =
      plane.hasPayload &&
      plane.order.pendingUnload &&
      (plane.payloadType === 'c1_paratroopers' || plane.payloadType === 'helo_assault_troops');

    if (plane.order.pendingSonobuoyPos) {
      const isHelo =
        plane.role === 'rescue' ||
        plane.model === 'ho3s1' ||
        plane.model === 'sh2' ||
        plane.model === 'uh2' ||
        plane.model === 'sh3f';
      if (isHelo && moveDist < 340) {
        plane.altitude = Math.max(0.22, plane.altitude - dt * 0.3);
      }
      const buoyDropRadius = isHelo ? 105 : 145;
      if (moveDist < buoyDropRadius) {
        const dropPt = { ...plane.order.pendingSonobuoyPos };
        this.deploySonobuoyFromAircraft(plane, dropPt);
        plane.order = { type: 'patrol', patrolOrigin: dropPt, targetPos: dropPt };
        plane.state = 'patrolling';
        return true;
      }
    } else if (isPendingTroopDrop) {
      const dropRadius = plane.payloadType === 'helo_assault_troops' ? 150 : 220;
      if (plane.payloadType === 'helo_assault_troops' && moveDist < 420) {
        plane.altitude = Math.max(0.15, plane.altitude - dt * 0.35);
      } else if (plane.payloadType === 'c1_paratroopers' && moveDist < 500) {
        plane.altitude = 0.5;
      }
      if (moveDist < dropRadius) {
        const safeDropPt = this.findIslandDropPoint(plane.order.targetPos, 240) || plane.order.targetPos;
        if (plane.payloadType === 'helo_assault_troops') {
          this.dropHeloAssaultTroops(plane, safeDropPt);
        } else {
          this.dropParatroopers(plane, safeDropPt);
        }
        plane.ammoRemaining = 0;
        plane.hasPayload = false;
        plane.order = { type: 'rtb' };
        plane.state = 'returning';
        return true;
      }
    } else if (moveDist < 40) {
      plane.order = { type: 'patrol', patrolOrigin: { ...plane.pos } };
      plane.state = 'patrolling';
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 機場獨立庫存與轉場 (Per-airfield stocks and ferry flights)
  // ══════════════════════════════════════════════════════════

  /** Intact friendly airfield by id. */
  public findFriendlyAirfield(id: string): Installation | undefined {
    for (const isl of this.islands) {
      const inst = isl.installations.find((x) => x.id === id && x.type === 'airfield' && x.side === 'player' && !x.isDestroyed);
      if (inst) return inst;
    }
    return undefined;
  }

  /** Every intact friendly airfield, the HQ island's first. */
  public getFriendlyAirfields(): Installation[] {
    const all = this.islands.flatMap((isl) => isl.installations.filter((x) => x.type === 'airfield' && x.side === 'player' && !x.isDestroyed));
    return all.sort((a, b) => (a.id === this.hqAirfieldId ? -1 : b.id === this.hqAirfieldId ? 1 : 0));
  }

  /** Aircraft stock of an airfield (created empty on first use, e.g. for a captured field). */
  public getAirfieldPool(id: string): Record<string, number> {
    if (id === this.hqAirfieldId) return this.airbasePlanes;
    return (this.airfieldPlanes[id] ??= {});
  }

  /** Friendly ship that can take aircraft aboard. */
  private findFriendlyCarrier(id: string): Ship | undefined {
    return this.playerShips.find((s) => s.id === id && !s.isSunk && s.carrierPlanes);
  }

  /** Position of an airfield or carrier, or undefined if it no longer exists. */
  private getAirBasePos(id: string): Vector2D | undefined {
    return this.findFriendlyAirfield(id)?.pos ?? this.findFriendlyCarrier(id)?.pos;
  }

  /** Whether this airframe can operate from a ship's deck (it appears in a carrier air wing or as a navy type). */
  public isCarrierCapable(model: AircraftModel): boolean {
    if (DECK_CAPABLE_ROTARY_AND_STOVL.has(model)) return true;
    const eras: Era[] = ['era1', 'era2', 'era3', 'era4', 'era5'];
    return eras.some(
      (e) => getCarrierModelsForEra(e).some((d) => d.model === model) || getAfbModelsForEra(e).some((d) => d.id === model && d.isNavy)
    );
  }

  /**
   * Home base to return to: the base it launched from or was ferried to if it still exists,
   * otherwise the nearest friendly airfield (carrier aircraft fall back to the flagship).
   */
  private resolveHomeBase(plane: Aircraft): string | undefined {
    if (plane.homeBaseId && this.getAirBasePos(plane.homeBaseId)) return plane.homeBaseId;
    if (!plane.homeBaseId) return undefined;
    const flagship = this.getFlagship();
    if (flagship?.carrierPlanes && this.isCarrierCapable(plane.model) && this.findFriendlyCarrier(plane.homeBaseId) === undefined && plane.homeBaseId.startsWith('player-')) {
      plane.homeBaseId = flagship.id;
      return flagship.id;
    }
    const nearest = this.getFriendlyAirfields().sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos))[0];
    plane.homeBaseId = nearest?.id;
    return plane.homeBaseId;
  }

  /** Puts a landed aircraft into an airfield's stock or a carrier's ready deck. */
  private stowAircraftAtBase(baseId: string, model: AircraftModel, count: number): void {
    const carrier = this.findFriendlyCarrier(baseId);
    if (carrier?.carrierPlanes) {
      const cp = carrier.carrierPlanes;
      const ready = cp.ready[model] || 0;
      const room = Math.max(0, (cp.maxPerType[model] || 14) - ready);
      cp.ready[model] = ready + Math.min(count, room);
      if (count > room) cp.hangar[model] = (cp.hangar[model] || 0) + (count - room);
      return;
    }
    const pool = this.getAirfieldPool(baseId);
    pool[model] = (pool[model] || 0) + count;
  }

  /** Flies a returning aircraft home; true once it has landed and left the map. */
  private returnToHomeBase(dt: number, i: number, plane: Aircraft): boolean {
    const baseId = plane.homeBaseId;
    const pos = baseId ? this.getAirBasePos(baseId) : undefined;
    if (!baseId || !pos) return false;
    plane.targetHeading = Math.atan2(pos.y - plane.pos.y, pos.x - plane.pos.x);
    plane.altitude = Math.min(0.85, plane.altitude + dt * 0.2);
    if (dist(plane.pos, pos) < 60) {
      this.stowAircraftAtBase(baseId, plane.model, 1);
      this.aircraft.splice(i, 1);
      return true;
    }
    return false;
  }

  /**
   * Ferries aircraft between friendly airfields and carriers. The aircraft actually fly the leg,
   * unarmed, and only join the destination's stock on landing; carrier decks accept only
   * carrier-capable types.
   */
  public transferAircraft(model: AircraftModel, count: number, fromId: string, toId: string): boolean {
    const fail = (text: string) => {
      this.addCombatLog({ category: 'air', sourceSide: 'player', sourceName: '航空作戰中心', targetName: '轉場', actionType: 'recon_spotted', text });
      return false;
    };
    if (fromId === toId) return fail('⚠️ 轉場出發地與目的地相同。');
    const fromPos = this.getAirBasePos(fromId);
    const toPos = this.getAirBasePos(toId);
    if (!fromPos || !toPos) return fail('⚠️ 轉場基地不存在或已被摧毀。');
    const toCarrier = this.findFriendlyCarrier(toId);
    if (toCarrier && !this.isCarrierCapable(model)) return fail(`⚠️ ${model.toUpperCase()} 並非艦載機型，無法降落「${toCarrier.name}」。`);

    const fromCarrier = this.findFriendlyCarrier(fromId);
    let available: number;
    if (fromCarrier?.carrierPlanes) {
      const cp = fromCarrier.carrierPlanes;
      available = (cp.ready[model] || 0) + (cp.hangar[model] || 0);
      if (available < count) return fail(`⚠️ 「${fromCarrier.name}」${model.toUpperCase()} 不足 (${available}/${count})。`);
      const fromReady = Math.min(count, cp.ready[model] || 0);
      cp.ready[model] = (cp.ready[model] || 0) - fromReady;
      cp.hangar[model] = (cp.hangar[model] || 0) - (count - fromReady);
    } else {
      const pool = this.getAirfieldPool(fromId);
      available = pool[model] || 0;
      if (available < count) return fail(`⚠️ 機場 ${model.toUpperCase()} 庫存不足 (${available}/${count})。`);
      pool[model] = available - count;
    }

    const speed = getAircraftBaseSpeed(model);
    const health = getAircraftBaseHealth(model);
    const heading = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const sqId = `sq-ferry-${model}-${Date.now()}`;
    const fromName = fromCarrier?.name ?? this.findFriendlyAirfield(fromId)?.name ?? fromId;
    const toName = toCarrier?.name ?? this.findFriendlyAirfield(toId)?.name ?? toId;
    for (let k = 0; k < count; k++) {
      this.aircraft.push({
        id: `ferry-${model}-${Date.now()}-${k}-${Math.floor(Math.random() * 1e6)}`,
        squadronId: sqId,
        model,
        role: getCatalogRole(model, toCarrier ? 'carrier' : 'airbase', this.era),
        name: `轉場 ${model.toUpperCase()} #${k + 1} (→ ${toName})`,
        flightName: `轉場編隊 ${fromName} → ${toName}`,
        side: 'player',
        pos: { x: fromPos.x + (k - (count - 1) / 2) * 26, y: fromPos.y + k * 18 },
        vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
        heading,
        targetHeading: heading,
        speed,
        maxSpeed: speed,
        altitude: 0.8,
        state: 'cruising',
        health,
        maxHealth: health,
        order: { type: 'move', targetPos: { ...toPos } },
        hasPayload: false,
        payloadType: 'clean_guns',
        shootCooldown: 0,
        gunAmmo: getAircraftGunRounds(model),
        maxGunAmmo: getAircraftGunRounds(model),
        wingmanOffset: { x: (k - (count - 1) / 2) * 26, y: k * 18 },
        homeBaseId: toId,
        ferryTo: toId,
      });
    }
    soundEngine.playPlaneSortie();
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: fromName,
      targetName: toName,
      actionType: 'recon_spotted',
      text: `🛫【轉場起飛】${count} 架 ${model.toUpperCase()} 自「${fromName}」起飛轉場前往「${toName}」，抵達降落後即計入該基地庫存。`,
    });
    return true;
  }

  /**
   * Ferry leg: steer for the destination (which may be a moving carrier) and land into its stock.
   * If the destination is lost en route the flight diverts to the HQ airfield.
   */
  private updateFerryFlight(dt: number, i: number, plane: Aircraft): boolean {
    if (!plane.ferryTo) return false;
    let pos = this.getAirBasePos(plane.ferryTo);
    if (!pos) {
      plane.ferryTo = this.findFriendlyAirfield(this.hqAirfieldId) ? this.hqAirfieldId : this.getFriendlyAirfields()[0]?.id;
      plane.homeBaseId = plane.ferryTo;
      pos = plane.ferryTo ? this.getAirBasePos(plane.ferryTo) : undefined;
      if (!pos) return false;
    }
    plane.order = { type: 'move', targetPos: { ...pos } };
    plane.targetHeading = Math.atan2(pos.y - plane.pos.y, pos.x - plane.pos.x);
    plane.altitude = Math.min(0.85, plane.altitude + dt * 0.2);
    if (dist(plane.pos, pos) < 60) {
      const base = plane.ferryTo;
      this.stowAircraftAtBase(base, plane.model, 1);
      this.aircraft.splice(i, 1);
      if (!this.aircraft.some((a) => a.squadronId === plane.squadronId)) {
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: plane.flightName || '轉場編隊',
          targetName: base,
          actionType: 'recon_spotted',
          text: `🛬【轉場完成】${plane.flightName} 全數降落，已計入目的地基地庫存。`,
        });
      }
      return true;
    }
    return false;
  }

  /** Return to carrier / airbase, landing and rearming. */
  private updateReturnToBase(dt: number, flagship: Ship | undefined, i: number, plane: Aircraft): boolean {
    if (plane.side === 'allied') {
      const basePos = this.friendlyBase?.center || { x: 2000, y: 12400 };
      const dx = basePos.x - plane.pos.x;
      const dy = basePos.y - plane.pos.y;
      const d = Math.hypot(dx, dy);
      plane.targetHeading = Math.atan2(dy, dx);
      plane.altitude = Math.min(0.85, plane.altitude + dt * 0.2);

      if (d < 65) {
        this.addCombatLog({
          category: 'air',
          sourceSide: 'allied',
          sourceName: '前進航空基地 (AFB)',
          targetName: plane.name,
          actionType: 'recon_spotted',
          text: `🛬【盟軍戰機平安返航】「${plane.name}」完成戰鬥巡邏與打擊任務，平安返降前進基地！`,
        });
        this.aircraft.splice(i, 1);
        return true;
      }
    } else if (plane.side === 'player' && this.resolveHomeBase(plane)) {
      // Flies back to its own airfield or carrier and lands into that base's stock
      if (this.returnToHomeBase(dt, i, plane)) return true;
    } else if (plane.side === 'player') {
      const isLandBased =
        plane.squadronId.startsWith('sq-afb-') ||
        plane.model === 'c47' ||
        plane.model === 'c130' ||
        plane.model === 'b29' ||
        plane.model === 'b17' ||
        plane.model === 'b17_late' ||
        plane.model === 'b25' ||
        plane.model === 'b24' ||
        plane.model === 'f86' ||
        plane.model === 'f82' ||
        plane.model === 'p51' ||
        plane.model === 'p47' ||
        plane.model === 'p38' ||
        plane.model === 'p40' ||
        plane.model === 'p36a' ||
        plane.model === 'p39d' ||
        plane.model === 'a20' ||
        plane.model === 'a26' ||
        plane.model === 'a1h' ||
        plane.model === 'a37b' ||
        plane.model === 'f5a' ||
        plane.model === 'f104g';

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
          return true;
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
            return true;
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
          return true;
        }
      } else {
        // 敵航母已沉沒或陸攻機，飛返北方作戰分界線脫離
        const exitPoint = { x: 11000, y: 1000 };
        const dx = exitPoint.x - plane.pos.x;
        const dy = exitPoint.y - plane.pos.y;
        plane.targetHeading = Math.atan2(dy, dx);
        if (Math.hypot(dx, dy) < 300 || plane.pos.y < 1200) {
          this.aircraft.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 時代四/時代五戰機干擾絲 (Chaff) / 熱焰彈 (Flare) 與機動高G破轉防禦
  // ══════════════════════════════════════════════════════════
  /** Era 4/5 chaff, flares and high-G break against incoming missiles. */
  private updateCountermeasures(dt: number, plane: Aircraft): void {
    if (this.era === 'era4' || this.era === 'era5') {
      if (plane.chaffCount === undefined) {
        plane.chaffCount = 36;
        plane.maxChaff = 36;
        plane.flareCount = 36;
        plane.maxFlare = 36;
        plane.cmCooldown = 0;
      }

      if (plane.cmCooldown !== undefined && plane.cmCooldown > 0) {
        plane.cmCooldown = Math.max(0, plane.cmCooldown - dt);
      }

      if (plane.evasionTimer !== undefined && plane.evasionTimer > 0) {
        plane.evasionTimer = Math.max(0, plane.evasionTimer - dt);
        if (plane.evasionTimer <= 0) {
          plane.isEvading = false;
          plane.evasionTactic = undefined;
        }
      }

      if (plane.health > 0 && plane.state !== 'landing') {
        const incomingMissile = this.projectiles.find(
          (pr) =>
            !pr.isDead &&
            this.isHostile(plane.side, pr.side) &&
            (pr.type === 'missile_sam' || pr.type === 'missile_aam') &&
            (pr.targetEntityId === plane.id || dist(pr.pos, plane.pos) < 780)
        );

        if (incomingMissile && (plane.cmCooldown || 0) <= 0) {
          const isIr = incomingMissile.guidanceType === 'infrared' || incomingMissile.guidanceType === 'ir';
          const isRadar = !isIr;

          if (isIr && (plane.flareCount ?? 0) > 0) {
            // ════ 紅外尋標飛彈威脅對策: Breaking 高G大角度切向破轉 + 熱焰彈群 ════
            plane.flareCount = Math.max(0, (plane.flareCount ?? 30) - 2);
            plane.cmCooldown = 1.4;
            plane.isEvading = true;
            plane.evasionTactic = 'breaking';
            plane.evasionTimer = 2.6;
            plane.evasionTurnSign = Math.random() > 0.5 ? 1 : -1;

            // High-G Break Slice: 猛烈大角度急轉切入飛彈追擊幾何並開啟加力燃燒室
            plane.targetHeading = plane.heading + (plane.evasionTurnSign || 1) * 1.85;
            plane.speed = Math.min(plane.maxSpeed * 1.35, plane.speed + 120);

            // 投放高溫鎂燃燒熱焰彈 (Burning magnesium flares)
            for (let f = 0; f < 4; f++) {
              const flareAng = plane.heading + Math.PI + (Math.random() - 0.5) * 0.9;
              this.particles.push({
                id: `flare-${Date.now()}-${f}-${Math.random()}`,
                x: plane.pos.x - Math.cos(plane.heading) * 14,
                y: plane.pos.y - Math.sin(plane.heading) * 14,
                vx: Math.cos(flareAng) * (55 + Math.random() * 30),
                vy: Math.sin(flareAng) * (55 + Math.random() * 30),
                life: 1.6,
                maxLife: 1.6,
                radius: 5.5,
                color: '#FF6D00',
                type: 'flare',
              });
            }

            // Threat-matched Breaking 誘騙脫鎖率達 80%
            if (Math.random() < 0.80) {
              incomingMissile.isDecoyed = true;
              incomingMissile.targetEntityId = undefined;
              incomingMissile.targetPos = {
                x: plane.pos.x + (Math.random() - 0.5) * 450,
                y: plane.pos.y + (Math.random() - 0.5) * 450,
              };
            }

            this.addCombatLog({
              category: 'aa',
              sourceSide: plane.side,
              sourceName: plane.name,
              targetName: '來襲紅外飛彈',
              actionType: 'recon_spotted',
              text: `⚡【Breaking 高G破轉機動 + 熱焰彈群】「${plane.name}」開後燃器大過載破轉！紅外尋標頭被高溫熱焰彈欺騙脫鎖！`,
            });
          } else if (isRadar && (plane.chaffCount ?? 0) > 0) {
            // ════ 雷達導向飛彈威脅對策: Notching 90° 零都卜勒切向規避 + 箔條干擾雲 ════
            plane.chaffCount = Math.max(0, (plane.chaffCount ?? 30) - 4);
            plane.cmCooldown = 1.4;
            plane.isEvading = true;
            plane.evasionTactic = 'notching';
            plane.evasionTimer = 3.0;
            plane.evasionTurnSign = Math.random() > 0.5 ? 1 : -1;

            // 3-9 Line Beam / Notching: 航向精確切至與來襲飛彈夾角 90°，落入都卜勒雷達盲區
            const missileHeading = incomingMissile.heading ?? Math.atan2(plane.pos.y - incomingMissile.pos.y, plane.pos.x - incomingMissile.pos.x);
            plane.targetHeading = missileHeading + (Math.PI / 2) * (plane.evasionTurnSign || 1);
            // 俯衝貼近海面/地形雜波 (Sea Clutter Masking)
            plane.altitude = Math.max(0.14, plane.altitude - dt * 0.45);

            // 投放鍍鋁干擾絲箔條雲 (Reflective aluminum chaff strips)
            for (let c = 0; c < 10; c++) {
              this.particles.push({
                id: `chaff-${Date.now()}-${c}-${Math.random()}`,
                x: plane.pos.x - Math.cos(plane.heading) * 16 + (Math.random() - 0.5) * 14,
                y: plane.pos.y - Math.sin(plane.heading) * 16 + (Math.random() - 0.5) * 14,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16,
                life: 2.8,
                maxLife: 2.8,
                radius: 6.5,
                color: '#E0F7FA',
                type: 'chaff',
              });
            }

            // Threat-matched Notching 規避誘騙率 (78%，若切入角接近90°垂直波束則提升至 88%)
            const angleDiff = Math.abs(Math.sin(plane.heading - missileHeading));
            const notchingBonus = angleDiff > 0.85 ? 0.88 : 0.78;
            if (Math.random() < notchingBonus) {
              incomingMissile.isDecoyed = true;
              incomingMissile.targetEntityId = undefined;
              incomingMissile.targetPos = {
                x: plane.pos.x + (Math.random() - 0.5) * 600,
                y: plane.pos.y + (Math.random() - 0.5) * 600,
              };
            }

            this.addCombatLog({
              category: 'aa',
              sourceSide: plane.side,
              sourceName: plane.name,
              targetName: '來襲雷達導引飛彈',
              actionType: 'recon_spotted',
              text: `📡【Notching 切向橫滾規避 + 箔條干擾雲】「${plane.name}」切至 90° 零都卜勒盲區並俯衝貼地！雷達波束完全迷失於雜波反射雲中！`,
            });
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

    const isA10 = attacker.model === 'a10a';
    const isModernVulcan = ROTARY_CANNON_MODELS.has(attacker.model);
    const isF86 = attacker.model === 'f86';
    const isMig15 = attacker.model === 'mig15';

    const burstCount = isA10 ? 12 : isModernVulcan ? 8 : isF86 ? 6 : isMig15 ? 2 : 4;
    const bulletSpeed = isA10 ? 880 : isModernVulcan ? 740 : isF86 ? 640 : isMig15 ? 520 : 540;
    const bulletDmg = isA10
      ? 85 // GAU-8/A 30mm Depleted Uranium Armor-Piercing Incendiary
      : isModernVulcan
      ? 38
      : isF86
      ? 26
      : isMig15
      ? 48
      : attacker.model === 'f8f' || attacker.model === 'sb2c'
      ? 24
      : 16;

    // Muzzle flashes: nose cannon on jets, a flash at each wing battery on piston fighters
    const noseGun = isA10 || isModernVulcan || isMig15;
    const flashSize = isA10 ? 9 : noseGun ? 6 : 4;
    const stations = noseGun ? [0] : [7, -7];
    for (const offset of stations) {
      const fx = attacker.pos.x + Math.cos(attacker.heading) * (noseGun ? 9 : 3) + Math.sin(attacker.heading) * offset;
      const fy = attacker.pos.y + Math.sin(attacker.heading) * (noseGun ? 9 : 3) - Math.cos(attacker.heading) * offset;
      this.spawnMuzzleFlash(fx, fy, attacker.heading, flashSize, false);
    }

    for (let b = 0; b < burstCount; b++) {
      const spread = (Math.random() - 0.5) * (isA10 ? 0.012 : isModernVulcan ? 0.016 : isF86 ? 0.015 : isMig15 ? 0.05 : 0.045);
      const bAngle = attacker.heading + spread;
      const wingOffset = isA10 || isModernVulcan || isMig15 ? 0 : (b % 2 === 0 ? 1 : -1) * (5 + Math.floor(b / 2) * 3);
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
        maxDistance: isA10 ? 650 : isModernVulcan ? 520 : isF86 ? 420 : 320,
        distanceTraveled: 0,
        damage: bulletDmg,
        blastRadius: isA10 ? 18 : isModernVulcan ? 12 : isMig15 ? 12 : 8,
        speed: bulletSpeed,
        heading: bAngle,
        isDead: false,
        trail: [],
        attackerName: attacker.name,
        isBeamTracer: isA10 || isModernVulcan || isF86,
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

  private dropDepthBombs(plane: Aircraft, _targetPos: Vector2D) {
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
      const bombName = PAYLOAD_CATALOG[pType]?.name || '航空炸彈';
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
      isAcousticHoming: plane.payloadType === 'asw_torpedo' || plane.payloadType === 'asw_acoustic_torpedo',
    });

    if (plane.side === 'player') {
      const isAsw = plane.payloadType === 'asw_torpedo' || plane.payloadType === 'asw_acoustic_torpedo';
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: attackerName,
        targetName: isAsw ? '水下潛艇/水面艦' : '敵水面艦艇',
        actionType: 'torpedo_hit',
        text: isAsw
          ? `【聲自導反潛雷投放】${attackerName} 掠海投放 Mk 46 / Mk 24 聲自導反潛魚雷！聲吶水下被動聽音主動搜索鎖定目標！`
          : `【掠海投雷】${attackerName} 釋放 Mk 13 高速航空魚雷！水中航速 340節，直指目標！`,
      });
    } else if (plane.payloadType === 'asw_torpedo' || plane.payloadType === 'asw_acoustic_torpedo') {
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: attackerName,
        targetName: '我軍水下潛艦',
        actionType: 'torpedo_hit',
        text: `🚨【敵反潛機空投聲自導魚雷！】${attackerName} 投下 APR-2 / AT-1 航空聲自導反潛魚雷入水追蹤我方潛艦！`,
      });
    }
  }

  /**
   * A depth-charge pattern, as escorts actually laid them: charges rolled from the stern racks in
   * a line astern and thrown abeam by the K-guns either side, forming a diamond around the boat's
   * estimated position, with hydrostatic pistols set for different depths (staggered fuses).
   */
  private dropDepthCharge(ship: Ship) {
    soundEngine.playTorpedoLaunch();
    const cos = Math.cos(ship.heading);
    const sin = Math.sin(ship.heading);
    const sternX = ship.pos.x - cos * (ship.length * 0.45);
    const sternY = ship.pos.y - sin * (ship.length * 0.45);
    const count = depthChargePattern(this.era);
    const friendly = ship.side === 'player' || ship.side === 'allied';
    const perCharge = friendly ? Math.round(240 * (1 + 0.2 * (this.fleetUpgrades.depthChargeSonarLevel - 1))) : 240;
    // [along-track offset astern, lateral offset]: racks lay a line, K-guns throw to each beam
    const offsets: Array<[number, number]> = [[0, 0], [-35, 0], [-70, 0], [-20, 60], [-20, -60], [-55, 45], [-55, -45]].slice(0, count) as Array<[number, number]>;
    offsets.forEach(([along, lateral], k) => {
      const x = sternX + cos * along - sin * lateral;
      const y = sternY + sin * along + cos * lateral;
      this.projectiles.push({
        id: `dc-${Date.now()}-${k}`,
        type: 'depth_charge',
        side: ship.side,
        pos: { x, y },
        vel: { x: 0, y: 0 },
        originPos: { x, y },
        targetPos: { x, y },
        flightProgress: 0,
        maxDistance: 0,
        distanceTraveled: 0,
        damage: perCharge,
        blastRadius: 60,
        speed: 0,
        heading: 0,
        isDead: false,
        trail: [],
        fuseTimer: 1.4 + k * 0.35,
      });
    });
  }

  /**
   * Soviet ahead-throwing ASW rocket launchers (RBU-2500 / RBU-6000 / RBU-1000) and, in earlier
   * eras, depth charges, fired by enemy ships at a submarine their sonar holds.
   */
  private fireRbuSalvo(ship: Ship, targetPos: Vector2D, rounds: number, label: string) {
    soundEngine.playRocketWhoosh();
    const bowX = ship.pos.x + Math.cos(ship.heading) * (ship.length * 0.3);
    const bowY = ship.pos.y + Math.sin(ship.heading) * (ship.length * 0.3);
    const angle = Math.atan2(targetPos.y - bowY, targetPos.x - bowX);
    for (let k = 0; k < rounds; k++) {
      // Ring pattern around the aim point, as the launcher's tubes are laid
      const ringA = (k / rounds) * Math.PI * 2;
      const tx = targetPos.x + Math.cos(ringA) * 45;
      const ty = targetPos.y + Math.sin(ringA) * 45;
      const d = dist({ x: bowX, y: bowY }, { x: tx, y: ty });
      const speed = 220;
      this.projectiles.push({
        id: `rbu-${Date.now()}-${k}-${Math.floor(Math.random() * 1e6)}`,
        type: 'hedgehog',
        side: ship.side,
        pos: { x: bowX, y: bowY },
        vel: { x: ((tx - bowX) / d) * speed, y: ((ty - bowY) / d) * speed },
        originPos: { x: bowX, y: bowY },
        targetPos: { x: tx, y: ty },
        flightProgress: 0,
        maxDistance: d,
        distanceTraveled: 0,
        damage: 560,
        blastRadius: 40,
        speed,
        heading: angle,
        isDead: false,
        trail: [],
        isHedgehog: true,
        isDepthFused: true,
        arcAltitude: 0,
        attackerName: `${ship.name} ${label}`,
      });
    }
  }

  /**
   * Ahead-throwing ASW salvo with the ship's own weapon: Hedgehog's 24 contact-fused bombs in an
   * ellipse, or the depth-fused patterns of Squid (two triple mortars, two layers), Limbo (a
   * triangle of three) and the Swedish Bofors 375 mm rocket launcher (four rounds).
   */
  private fireHedgehogSalvo(ship: Ship, targetPos: Vector2D) {
    const kind = ship.aheadThrower ?? 'hedgehog';
    const spec = AHEAD_THROWERS[kind];
    if (kind === 'bofors375') soundEngine.playRocketWhoosh();
    else soundEngine.playGunSalvo(false);
    const bowX = ship.pos.x + Math.cos(ship.heading) * (ship.length * (kind === 'limbo' ? -0.3 : 0.4));
    const bowY = ship.pos.y + Math.sin(ship.heading) * (ship.length * (kind === 'limbo' ? -0.3 : 0.4));
    const launchAngle = Math.atan2(targetPos.y - bowY, targetPos.x - bowX);

    // Pattern offsets (forward, lateral) around the aim point
    const offsets: Array<[number, number]> = [];
    if (kind === 'hedgehog') {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) offsets.push([(r - 1.5) * 7, (c - 2.5) * 7]);
    } else if (kind === 'squid') {
      for (const layer of [-14, 14]) for (const [f, l] of [[8, 0], [-6, -12], [-6, 12]]) offsets.push([f + layer, l]);
    } else if (kind === 'limbo') {
      offsets.push([12, 0], [-8, -16], [-8, 16]);
    } else {
      offsets.push([12, -12], [12, 12], [-12, -12], [-12, 12]);
    }

    const upgrade = ship.side === 'player' || ship.side === 'allied' ? 1 + 0.2 * (this.fleetUpgrades.depthChargeSonarLevel - 1) : 1;
    this.addBannerAlert(`🦔【${spec.label}】「${ship.name}」聲納鎖定敵潛艇，${spec.rounds} 發齊射！`, 'player', 'alert', 4.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: `${ship.name} (${spec.label})`,
      targetName: '敵方潛艦',
      actionType: 'gun_hit',
      text: spec.depthFused
        ? `🦔【${spec.label}】「${ship.name}」依聲納測得之深度裝定引信，${spec.rounds} 發彈落入目標上方海域，下沉至設定深度起爆！`
        : `🦔【刺蝟砲 24聯裝超前發射】「${ship.name}」艦艏拋射 24枚 刺蝟反潛迫擊砲彈形成橢圓覆蓋網！觸發式引信接觸即爆，未命中不引爆亦不擾亂聲納！`,
    });

    const speed = kind === 'bofors375' ? 220 : 160;
    offsets.forEach(([fwd, lat], k) => {
      const tx = targetPos.x + Math.cos(launchAngle) * fwd - Math.sin(launchAngle) * lat + (Math.random() - 0.5) * 4;
      const ty = targetPos.y + Math.sin(launchAngle) * fwd + Math.cos(launchAngle) * lat + (Math.random() - 0.5) * 4;
      const d = dist({ x: bowX, y: bowY }, { x: tx, y: ty });
      this.projectiles.push({
        id: `${kind}-${Date.now()}-${k}-${Math.random()}`,
        type: 'hedgehog',
        side: ship.side,
        pos: { x: bowX, y: bowY },
        vel: { x: ((tx - bowX) / d) * speed, y: ((ty - bowY) / d) * speed },
        originPos: { x: bowX, y: bowY },
        targetPos: { x: tx, y: ty },
        flightProgress: 0,
        maxDistance: d,
        distanceTraveled: 0,
        damage: Math.round(spec.damage * upgrade),
        blastRadius: spec.blast,
        speed,
        heading: launchAngle,
        isDead: false,
        trail: [],
        isHedgehog: true,
        isDepthFused: spec.depthFused,
        arcAltitude: 0,
        attackerName: `${ship.name} ${spec.label}`,
      });
    });
  }

  private fireFlakBurst(origin: Vector2D, plane: Aircraft, sourceSide: ShipSide = 'player') {
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

    // US 5"/38 and 90 mm bursts are black; Japanese and Soviet-pattern charges leave a brown-grey cloud
    const burstColor = sourceSide === 'player' || sourceSide === 'allied' ? '#14181D' : '#3B3530';
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
        color: burstColor,
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
    this.spawnMuzzleFlash(origin.x + Math.cos(baseAngle) * 10, origin.y + Math.sin(baseAngle) * 10, baseAngle, 7, false);
    const aaSpeed = 580;

    for (let t = 0; t < tracerCount; t++) {
      const spread = (Math.random() - 0.5) * 0.08;
      const tAngle = baseAngle + spread;
      const tDist = Math.min(totalDist * (0.85 + t * 0.05), totalDist + 50);

      this.projectiles.push({
        id: `aa-tracer-${Date.now()}-${t}-${Math.random()}`,
        type: 'bullet',
        side: sourceSide,
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
      const baseFlakDmg = isCrit ? (isEra3AA ? 175 : isEra2AA ? 120 : 60) : (isEra3AA ? 72 : isEra2AA ? 48 : 22);
      const aaUpgradeMult =
        sourceSide === 'player' || sourceSide === 'allied'
          ? 1 + 0.15 * (this.fleetUpgrades.aaFirepowerLevel - 1)
          : 1;
      const flakDmg = Math.round(baseFlakDmg * aaUpgradeMult);
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
    if (this.isSubmarine(ship)) {
      this.revealSubmarine(ship, 14.0, 'firing', ship.name);
    }
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
        // 1960s+ torpedoes home: Soviet 53-65K wake homers, US Mk 37 / Mk 48
        isAcousticHoming: this.era === 'era4' || this.era === 'era5',
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

  private muzzleFlashSeq = 0;

  /**
   * Purely visual muzzle blast: a short flame along the bore and, for guns of 5 inches and up, a
   * drifting cordite smoke cloud. Deterministic (no RNG), so it never changes the simulation.
   */
  private spawnMuzzleFlash(x: number, y: number, angle: number, size: number, withSmoke: boolean) {
    const seq = this.muzzleFlashSeq++;
    const life = 0.09 + size * 0.006;
    this.particles.push({
      id: `muzzle-${seq}`,
      x,
      y,
      vx: 0,
      vy: 0,
      life,
      maxLife: life,
      radius: size,
      color: '#FFD54F',
      type: 'muzzle_flash',
      rot: angle,
    });
    if (withSmoke) {
      const drift = 6 + size * 0.4;
      this.particles.push({
        id: `gunsmoke-${seq}`,
        x: x + Math.cos(angle) * size * 0.8,
        y: y + Math.sin(angle) * size * 0.8,
        vx: Math.cos(angle) * drift,
        vy: Math.sin(angle) * drift,
        life: 1.4 + size * 0.03,
        maxLife: 1.4 + size * 0.03,
        radius: size * 1.1,
        color: 'rgba(120, 110, 96, 1)',
        type: 'gun_smoke',
        rot: angle + seq,
      });
    }
  }

  private fireTurretSalvo(ship: Ship, turret: Turret, targetPos: Vector2D) {
    const isHeavy = turret.damage > 100;
    soundEngine.playGunSalvo(isHeavy);

    // Shells leave from the turret's own muzzles, not the ship's centre
    const cosS = Math.cos(ship.heading);
    const sinS = Math.sin(ship.heading);
    const mountX = ship.pos.x + turret.relX * cosS - turret.relY * sinS;
    const mountY = ship.pos.y + turret.relX * sinS + turret.relY * cosS;
    const cosH = Math.cos(turret.angle);
    const sinH = Math.sin(turret.angle);
    const barrel = 4 + Math.sqrt(turret.damage) * 0.55;
    const muzzleX = mountX + cosH * barrel;
    const muzzleY = mountY + sinH * barrel;
    // Flash scales with the bore: a 16-inch broadside dwarfs a 40 mm mount
    const flashSize = 5 + Math.sqrt(turret.damage) * 0.9;
    this.spawnMuzzleFlash(muzzleX, muzzleY, turret.angle, flashSize, turret.damage >= 60);

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
  // 敵機波次編隊動態規模演算法 (Dynamic Enemy Air Wave Sizing: 4 - 12 架)
  // 依據敵軍運作中機場數量、航母存活與戰區推進動態提升全時代敵軍機群數量
  // ══════════════════════════════════════════════════════════
  private calculateDynamicWaveSize(baseCount: number): number {
    const operationalAirfields = this.islands
      .filter((i) => !i.isFriendlyBase && !i.isFullyCaptured)
      .flatMap((i) => i.installations)
      .filter((inst) => inst.type === 'airfield' && inst.side === 'enemy' && !inst.isDestroyed).length;
    const hasCarrier = this.enemyShips.some((s) => s.type === 'carrier' && !s.isSunk);
    let size = baseCount + Math.min(2, Math.floor((this.sectorNumber - 1) / 2));
    if (operationalAirfields >= 2) size += 2;
    else if (operationalAirfields === 1) size += 1;
    if (hasCarrier) size += 1;
    if (operationalAirfields === 0 && !hasCarrier) size -= 1;
    // 隨機戰術波動 (±1)
    const roll = Math.random();
    if (roll < 0.4) size += 1;
    else if (roll > 0.78) size -= 1;
    return Math.max(4, Math.min(12, size));
  }

  public triggerEnemyAirDoctrine(missionType: EnemyAirMissionType) {
    const flagship = this.getFlagship();
    const spawnPos = this.getSafeEnemySpawnPos();
    const sqId = `sq-opfor-${missionType}-${Date.now()}`;
    const isEra3 = this.era === 'era3';
    const isEra4 = this.era === 'era4';
    const isEra5 = this.era === 'era5';

    // 時代機型配屬 (時代五: 蘇聯海空軍冷戰終極打擊編裝 Su-27, MiG-29A, Su-25, Tu-22M3, Tu-95; 時代四: Tu-16, Su-7, IL-28, MiG-21, MiG-19, MiG-17; 時代三: MiG-15, Tu-14, Yak-9, IL-10; 時代一/二: 史實日軍機種)
    const fModel: AircraftModel = isEra5
      ? (Math.random() < 0.5 ? 'su27' : 'mig29a')
      : isEra4
      ? (Math.random() < 0.45 ? 'mig21' : Math.random() < 0.5 ? 'mig19' : 'mig17')
      : isEra3
      ? (Math.random() < 0.6 ? 'mig15' : 'yak9')
      : this.era === 'era1'
      ? pickModel(['zero_a6m2', 'zero', 'rufe'], [0.4, 0.4, 0.2]) // Rufe floatplanes from Tulagi / Shortlands
      : pickModel(['ki61', 'george', 'ki84'], [0.35, 0.35, 0.3]);

    const dbModel: AircraftModel = isEra5
      ? (Math.random() < 0.7 ? 'su25' : 'su7')
      : isEra4
      ? (Math.random() < 0.65 ? 'su7' : 'mig17')
      : isEra3
      ? 'il10'
      : this.era === 'era1'
      ? 'val'
      : 'judy';

    const tbModel: AircraftModel = isEra5
      ? (Math.random() < 0.65 ? 'tu22m3' : 'tu95')
      : isEra4
      ? (Math.random() < 0.55 ? 'tu16' : 'il28')
      : isEra3
      ? 'tu14'
      : this.era === 'era1'
      ? 'kate'
      : 'jill';

    if (missionType === 'dca') {
      this.launchEnemyDca(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, fModel);
    } else if (missionType === 'air_sweep') {
      this.launchEnemyAirSweep(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, fModel);
    } else if (missionType === 'scramble') {
      this.launchEnemyScramble(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, fModel);
    } else if (missionType === 'strike_flagship') {
      this.launchEnemyFlagshipStrike(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, fModel, dbModel, tbModel);
    } else if (missionType === 'strike_fleet') {
      this.launchEnemyFleetStrike(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, dbModel, tbModel);
    } else if (missionType === 'strike_airbase') {
      this.launchEnemyAirbaseStrike(spawnPos, sqId, isEra3, isEra4, isEra5);
    } else if (missionType === 'cas') {
      this.launchEnemyCas(flagship, spawnPos, sqId, isEra3, isEra4, isEra5, dbModel);
    } else if (missionType === 'cap') {
      this.launchEnemyCap(spawnPos, sqId, isEra3, isEra4, isEra5, fModel);
    } else if (missionType === 'asw_patrol' && (isEra4 || isEra5)) {
      this.launchEnemyAswPatrol(flagship, spawnPos, sqId, isEra4);
    }
  }

  private launchEnemyAswPatrol(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra4: boolean): void {
    // 9. Era 4 & Era 5 OPFOR ASW Patrol (蘇聯海航專職反潛機隊: Be-12 / Il-38 / Ka-27)
    const spottedPlayerSub = [...this.playerShips, ...this.alliedShips].find(
      (s) => !s.isSunk && this.isSubmarine(s) && s.isSpottedByEnemy
    );
    const patrolCenter = spottedPlayerSub
      ? { ...spottedPlayerSub.pos }
      : flagship
      ? {
          x: Math.max(1200, Math.min(this.worldSize - 1200, flagship.pos.x + (Math.random() - 0.5) * 1600)),
          y: Math.max(1200, Math.min(this.worldSize - 1200, flagship.pos.y - 900 + (Math.random() - 0.5) * 900)),
        }
      : { x: 4200, y: 6000 };

    const heading = Math.atan2(patrolCenter.y - spawnPos.y, patrolCenter.x - spawnPos.x);
    const aswCount = 3;

    for (let i = 0; i < aswCount; i++) {
      const aswModel: AircraftModel = isEra4 ? 'be12' : i === 0 ? 'il38' : 'ka27';
      const aswSpeed = getAircraftSpeed(aswModel);
      const aswHealth = aswModel === 'il38' ? 1150 : aswModel === 'be12' ? 920 : 800;

      this.aircraft.push({
        id: `opfor-asw-${Date.now()}-${i}`,
        squadronId: sqId,
        model: aswModel,
        role: 'scout',
        name:
          aswModel === 'be12'
            ? `Be-12 海鷗水陸兩棲反潛巡邏機 (蘇聯海航 #${i + 1})`
            : aswModel === 'il38'
            ? `Il-38 五月花長程反潛巡邏機 (蘇聯海航 #${i + 1})`
            : `Ka-27 蝸牛同軸雙旋翼反潛直升機 (#${i + 1})`,
        side: 'enemy',
        pos: { x: spawnPos.x + i * 40, y: spawnPos.y + (i === 0 ? -30 : 30) },
        vel: { x: Math.cos(heading) * aswSpeed, y: Math.sin(heading) * aswSpeed },
        heading,
        targetHeading: heading,
        speed: aswSpeed,
        maxSpeed: aswSpeed,
        altitude: aswModel === 'ka27' ? 0.28 : 0.45,
        state: 'patrolling',
        health: aswHealth,
        maxHealth: aswHealth,
        order: spottedPlayerSub
          ? { type: 'attack', targetId: spottedPlayerSub.id, targetPos: patrolCenter, patrolOrigin: patrolCenter }
          : { type: 'patrol', patrolOrigin: patrolCenter, targetPos: patrolCenter },
        hasPayload: true,
        payloadType: 'asw_acoustic_torpedo',
        payloadName: 'APR-2 / AT-1 航空聲自導反潛魚雷',
        ammoRemaining: 2,
        maxAmmo: 2,
        shootCooldown: 0,
        gunAmmo: 0,
        maxGunAmmo: 0,
        wingmanOffset: { x: i * 55, y: i === 0 ? -35 : 35 },
        missionType: 'asw_patrol',
        sonarPingCooldown: 2.0 + i * 1.4,
        chaffCount: 24,
        maxChaff: 24,
        flareCount: 24,
        maxFlare: 24,
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: '蘇聯海軍航空兵反潛大隊 (AV-MF ASW)',
      targetName: '特混艦隊潛航航道',
      actionType: 'recon_spotted',
      text: isEra4
        ? `🛰️【敵反潛航空巡邏隊逼近！】蘇聯太平洋艦隊派出 2架 Be-12「海鷗」兩棲反潛機攜帶聲吶浮標與 APR-2 航空反潛魚雷前往巡弋！`
        : `🛰️【敵長程反潛機隊獵潛巡邏！】蘇聯北方/太平洋艦隊派出 Il-38「五月花」反潛巡邏機與 Ka-27「蝸牛」反潛直升機！主動投擲聲吶浮標搜捕我方潛艦！`,
    });
  }

  private launchEnemyCap(spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, fModel: AircraftModel): void {
    // 8. CAP (平時巡邏): 在敵艦隊或要塞上空執行強化 4 機防空巡邏 (CAP)
    const enemyCarrier = this.enemyShips.find((s) => s.type === 'carrier' && !s.isSunk);
    const capCenter = enemyCarrier ? enemyCarrier.pos : spawnPos;
    const heading = 0;

    for (let i = 0; i < 4; i++) {
      const capModel: AircraftModel = isEra5
        ? (i % 2 === 0 ? 'su27' : 'mig29a')
        : isEra4
        ? (i % 2 === 0 ? 'mig21' : 'mig17')
        : isEra3
        ? (i % 2 === 0 ? 'mig15' : 'yak9')
        : fModel;
      const cSpeed = getAircraftSpeed(capModel);
      const cHealth = capModel === 'su27' ? 750 : capModel === 'mig29a' ? 680 : capModel === 'mig21' ? 580 : capModel === 'mig17' ? 480 : capModel === 'mig15' ? 540 : capModel === 'yak9' ? 440 : 150;

      this.aircraft.push({
        id: `cap-f-${Date.now()}-${i}`,
        squadronId: sqId,
        model: capModel,
        role: 'fighter',
        name: isEra5
          ? (capModel === 'su27' ? `Su-27 側衛常態空巡機 (#${i + 1})` : `MiG-29A 支點常態空巡機 (#${i + 1})`)
          : isEra4
          ? (capModel === 'mig21' ? `MiG-21 魚窩常態空巡機 (#${i + 1})` : `MiG-17 壁畫常態空巡機 (#${i + 1})`)
          : isEra3
          ? `${capModel.toUpperCase()} 冷戰巡邏戰鬥機 (#${i + 1})`
          : `CAP 常態戰鬥巡邏機 (#${i + 1})`,
        side: 'enemy',
        pos: { x: capCenter.x + (i % 2 === 0 ? 80 : -80), y: capCenter.y + (i < 2 ? -60 : 60) },
        vel: { x: 0, y: 0 },
        heading,
        targetHeading: heading,
        speed: cSpeed,
        maxSpeed: cSpeed,
        altitude: 0.88,
        state: 'patrolling',
        health: cHealth,
        maxHealth: cHealth,
        order: { type: 'patrol', patrolOrigin: barrierStation(capCenter, this.getFlagship()?.pos, 1600) },
        airMission: 'barcap',
        hasPayload: (isEra5 || isEra4) && (capModel === 'su27' || capModel === 'mig29a' || capModel === 'mig21'),
        payloadType: (isEra5 || isEra4) ? 'aim9_sidewinder' : undefined,
        shootCooldown: 0,
        gunAmmo: capModel === 'su27' ? 250 : capModel === 'mig29a' ? 250 : capModel === 'mig21' ? 200 : capModel === 'mig17' ? 240 : capModel === 'mig15' ? 300 : capModel === 'yak9' ? 340 : 1000,
        maxGunAmmo: capModel === 'su27' ? 250 : capModel === 'mig29a' ? 250 : capModel === 'mig21' ? 200 : capModel === 'mig17' ? 240 : capModel === 'mig15' ? 300 : capModel === 'yak9' ? 340 : 1000,
        wingmanOffset: { x: i * 35, y: -20 },
        missionType: 'cap',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯防空軍強化巡邏隊' : isEra4 ? '北越人民軍空軍直衛巡邏隊' : isEra3 ? '冷戰聯軍直衛機隊' : '敵方直衛機隊',
      targetName: '敵主力空域',
      actionType: 'recon_spotted',
      text: isEra5
        ? `🛡️【常態戰鬥巡邏 (CAP)】蘇聯海空軍維持 4 機 Su-27 / MiG-29A 防空巡邏 (CAP)，嚴密警戒全空域！`
        : isEra4
        ? `🛡️【常態戰鬥巡邏 (CAP)】北越空軍維持 4 機 MiG-21 / MiG-17 防空巡邏 (CAP)，雷達引導警戒空域！`
        : isEra3
        ? `🛡️【常態戰鬥巡邏 (CAP)】冷戰遠東聯軍維持 4 機 MiG-15 / Yak-9 編隊防空巡邏 (CAP)，警戒戰區空域！`
        : `🛡️【常態戰鬥巡邏 (CAP)】敵艦隊上空維持 4 機編隊防空巡邏 (CAP)，警戒任何接近之美軍航空隊！`,
    });
  }

  private launchEnemyCas(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, dbModel: AircraftModel): void {
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
    const casModel: AircraftModel = isEra5 ? (Math.random() < 0.6 ? 'su25' : 'mi24') : isEra4 ? (Math.random() < 0.6 ? 'su7' : 'mig17') : isEra3 ? pickModel(['il10', 'po2'], [0.7, 0.3]) : dbModel;
    const casSpeed = getAircraftSpeed(casModel);
    const casHealth = isEra5 ? (casModel === 'su25' ? 850 : 750) : isEra4 ? 680 : isEra3 ? 620 : 145;
    const casCount = Math.min(6, this.calculateDynamicWaveSize(4));

    for (let i = 0; i < casCount; i++) {
      this.aircraft.push({
        id: `cas-db-${Date.now()}-${i}`,
        squadronId: sqId,
        model: casModel,
        role: 'dive_bomber',
        name: isEra5
          ? (casModel === 'su25' ? `Su-25 蛙足噴射裝甲強擊機 (#${i + 1})` : `Mi-24 雌鹿重裝攻擊直升機 (#${i + 1})`)
          : isEra4
          ? (casModel === 'su7' ? `Su-7 裝配匠噴射強擊機 (#${i + 1})` : `MiG-17 俯衝密接掃射機 (#${i + 1})`)
          : isEra3
          ? `IL-10 鐵獸裝甲強擊機 (#${i + 1})`
          : `CAS 近距空中支援艦爆 (#${i + 1})`,
        side: 'enemy',
        pos: { x: spawnPos.x + i * 28, y: spawnPos.y },
        vel: { x: Math.cos(heading) * casSpeed, y: Math.sin(heading) * casSpeed },
        heading,
        targetHeading: heading,
        speed: casSpeed,
        maxSpeed: casSpeed,
        altitude: casModel === 'mi24' ? 0.25 : 0.65,
        state: 'cruising',
        health: casHealth,
        maxHealth: casHealth,
        order: { type: 'attack', targetPos },
        hasPayload: true,
        shootCooldown: 0,
        gunAmmo: isEra5 ? (casModel === 'su25' ? 400 : 900) : isEra4 ? 320 : isEra3 ? 600 : 600,
        maxGunAmmo: isEra5 ? (casModel === 'su25' ? 400 : 900) : isEra4 ? 320 : isEra3 ? 600 : 600,
        wingmanOffset: { x: i * 25, y: 15 },
        missionType: 'cas',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `🛩️【CAS 蘇軍裝甲密接空中支援】敵 ${casCount}架 ${casModel === 'su25' ? 'Su-25 蛙足強擊機' : 'Mi-24 雌鹿武裝直升機'} 低空突防，火箭與機砲俯衝掃射我前線部隊！`
        : isEra4
        ? `🛩️【CAS 噴射密接空中支援】敵 ${casCount}架 Su-7 / MiG-17 噴射強擊機低空突防，火箭彈俯衝掃射灘頭！`
        : isEra3
        ? `🛩️【CAS 密接空中支援】冷戰聯軍 ${casCount}架 伊爾-10裝甲強擊機向我搶灘舟艇與登陸部隊俯衝掃射！`
        : `🛩️【CAS 密接空中支援】敵 ${casCount}架 俯衝轟炸機向我搶灘舟艇與登陸部隊俯衝掃射！`,
      'enemy',
      'down',
      5.5
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯前線強擊航空兵 (CAS)' : isEra4 ? '北越人民軍空軍 923 "安世" 團 (CAS)' : isEra3 ? '遠東前線強擊航空師 (IL-10)' : '近距支援艦爆隊 (CAS)',
      targetName: '前線部隊與登陸載具',
      actionType: 'recon_spotted',
      text: isEra5
        ? `🛩️【前線密接支援 (CAS)】蘇聯空軍 ${casCount}架 ${casModel === 'su25' ? 'Su-25 蛙足強擊機' : 'Mi-24 雌鹿直升機'} 超低空突防！30mm 航空機砲與重型火箭彈猛烈壓制我陸戰隊與裝甲矛頭！`
        : isEra4
        ? `🛩️【灘頭密接支援 (CAS)】北越 923 團 ${casCount}架 Su-7 / MiG-17 噴射強擊機超低空突防！俯衝壓制我方兩棲登陸艇與陸戰隊排！海灘防空火力全力還擊！`
        : isEra3
        ? `🛩️【灘頭密接支援 (CAS)】冷戰聯軍 ${casCount}架 IL-10 鐵獸強擊機實施超低空突防！俯衝壓制我方兩棲登陸艇與陸戰隊排！`
        : `🛩️【灘頭密接支援 (CAS)】敵 ${casCount}架 艦爆實施超低空突防！俯衝壓制我方兩棲登陸艇與陸戰隊排！海灘防空機槍全力還擊！`,
    });

    this.organizeStrikePackage(sqId);
  }

  private launchEnemyAirbaseStrike(spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean): void {
    // 6. Strike Package (針對陸基基地 動態編隊: 2-6架): 重轟大隊空襲前進基地
    soundEngine.playKlaxon();
    const basePos = this.friendlyBase?.center || { x: 2000, y: 12400 };
    const heading = Math.atan2(basePos.y - spawnPos.y, basePos.x - spawnPos.x);

    const heavyModel: AircraftModel = isEra5 ? (Math.random() < 0.6 ? 'tu22m3' : 'tu95') : isEra4 ? 'il28' : isEra3 ? 'tu14' : 'g4m';
    const hSpeed = getAircraftSpeed(heavyModel);
    const hHealth = isEra5 ? 2500 : isEra4 ? 850 : isEra3 ? 680 : 480;

    const heavyCount = this.calculateDynamicWaveSize(6);
    for (let i = 0; i < heavyCount; i++) {
      this.aircraft.push({
        id: `st-base-h-${Date.now()}-${i}`,
        squadronId: sqId,
        model: heavyModel,
        role: 'dive_bomber',
        name: isEra5
          ? (heavyModel === 'tu22m3' ? `Tu-22M3 逆火超音速戰略轟炸機 (#${i + 1})` : `Tu-95 熊式長程戰略飛彈轟炸機 (#${i + 1})`)
          : isEra4
          ? `IL-28 獵犬雙發噴射重轟炸機 (#${i + 1})`
          : isEra3
          ? `Tu-14 雙噴射重轟大隊 (#${i + 1})`
          : `一式陸攻重轟大隊 (#${i + 1})`,
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
        gunAmmo: isEra5 ? 800 : isEra4 ? 400 : isEra3 ? 400 : 600,
        maxGunAmmo: isEra5 ? 800 : isEra4 ? 400 : isEra3 ? 400 : 600,
        wingmanOffset: { x: (i - (heavyCount - 1) / 2) * 35, y: (i - (heavyCount - 1) / 2) * 18 },
        missionType: 'strike_airbase',
        hasDefensiveTurret: isEra5 || isEra4 || isEra3,
        rearGunnerCooldown: 0,
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `💣【Strike Package 戰略基地大轟炸】蘇軍 ${heavyCount}架 ${heavyModel === 'tu22m3' ? 'Tu-22M3 逆火' : 'Tu-95 熊式'} 長程戰略轟炸大隊空襲我方大陸航空基地！`
        : isEra4
        ? `💣【Strike Package 基地大轟炸】敵 ${heavyCount}架 IL-28 雙發噴射轟炸大隊空襲我方航空基地！`
        : isEra3
        ? `💣【Strike Package 陸基基地編隊】冷戰聯軍 ${heavyCount}架 圖-14雙噴射轟炸機空襲前進基地！`
        : `💣【Strike Package 陸基基地編隊】敵 ${heavyCount}架 一式陸攻大隊空襲 Henderson 前進基地！`,
      'enemy',
      'sunk',
      6.5
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯遠程航空兵戰略轟炸大隊' : isEra4 ? '北越人民軍空軍戰略轟炸大隊 (IL-28)' : isEra3 ? '遠東戰略轟炸航空軍 (Tu-14大隊)' : '基地航空部隊 (陸攻大隊)',
      targetName: '前進空軍基地跑道',
      actionType: 'recon_spotted',
      text: isEra5
        ? `💣【陸基前進基地遭襲！】蘇聯遠程航空兵 ${heavyCount}架 ${heavyModel === 'tu22m3' ? 'Tu-22M3 逆火超音速轟炸機' : 'Tu-95 熊式長程戰略轟炸機'} 高空大編隊越境！意圖對前進空軍基地跑道與機庫實施毀滅性長程巡航飛彈轟炸！`
        : isEra4
        ? `💣【陸基前進基地遭襲！】敵 ${heavyCount}架 IL-28 雙噴射重型轟炸機以高空大編隊越境！意圖對前進空軍基地跑道與機庫實施毀滅性地毯轟炸！`
        : isEra3
        ? `💣【陸基前進基地遭襲！】冷戰聯軍 ${heavyCount}架 Tu-14 雙噴射轟炸機以高空編隊越境！意圖對前進空軍基地跑道與機庫實施毀滅性面狀轟炸！`
        : `💣【陸基前進基地遭襲！】敵 ${heavyCount}架 一式陸攻以高空編隊越境！意圖對 Henderson Field 機場跑道與機庫實施毀滅性面狀轟炸！`,
    });

    this.organizeStrikePackage(sqId);
  }

  private launchEnemyFleetStrike(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, dbModel: AircraftModel, tbModel: AircraftModel): void {
    // 5. Strike Package (針對船艦反艦 動態編隊: 2-6架): 獵殺巡洋艦、驅逐艦與兩棲運輸隊
    soundEngine.playKlaxon();
    const escorts = [...this.playerShips, ...this.alliedShips].filter(
      (s) => !s.isSunk && !this.isSubmarine(s) && s.type !== 'carrier'
    );
    const targetShip = escorts.length > 0 ? escorts[Math.floor(Math.random() * escorts.length)] : flagship;
    const target = targetShip ? { ...targetShip.pos } : { x: 3000, y: 11000 };
    const heading = Math.atan2(target.y - spawnPos.y, target.x - spawnPos.x);

    const fleetDbModel: AircraftModel = isEra5 ? 'su25' : isEra4 ? 'su7' : isEra3 ? 'il10' : dbModel;
    const fleetTbModel: AircraftModel = isEra5 ? 'tu22m3' : isEra4 ? 'il28' : isEra3 ? 'tu14' : tbModel;
    const fDbSpeed = getAircraftSpeed(fleetDbModel);
    const fTbSpeed = getAircraftSpeed(fleetTbModel);
    const fDbHealth = isEra5 ? 850 : isEra4 ? 700 : isEra3 ? 620 : 155;
    const fTbHealth = isEra5 ? 2200 : isEra4 ? 950 : isEra3 ? 680 : 150;

    const totalFleetCount = this.calculateDynamicWaveSize(6); // 4-12 架
    const fDbCount = Math.ceil(totalFleetCount / 2);
    const fTbCount = totalFleetCount - fDbCount;

    // Dive Bombers / Ground Attackers
    for (let i = 0; i < fDbCount; i++) {
      this.aircraft.push({
        id: `st-flt-db-${Date.now()}-${i}`,
        squadronId: sqId,
        model: fleetDbModel,
        role: 'dive_bomber',
        name: isEra5
          ? `Su-25 蛙足反艦強擊機 (#${i + 1})`
          : isEra4
          ? `Su-7 裝配匠反艦強擊機 (#${i + 1})`
          : isEra3
          ? `IL-10 反艦強擊機 (#${i + 1})`
          : `反艦俯衝轟炸機 (#${i + 1})`,
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
        gunAmmo: isEra5 ? 400 : isEra4 ? 320 : isEra3 ? 600 : 600,
        maxGunAmmo: isEra5 ? 400 : isEra4 ? 320 : isEra3 ? 600 : 600,
        wingmanOffset: { x: i * 26, y: -15 },
        missionType: 'strike_fleet',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }
    // Torpedo Bombers / Standoff AShM Bombers
    for (let i = 0; i < fTbCount; i++) {
      this.aircraft.push({
        id: `st-flt-tb-${Date.now()}-${i}`,
        squadronId: sqId,
        model: fleetTbModel,
        role: 'torpedo_bomber',
        name: isEra5
          ? `Tu-22M3 逆火超音速反艦飛彈轟炸機 (#${i + 1})`
          : isEra4
          ? `IL-28 獵犬雙噴射反艦魚雷機 (#${i + 1})`
          : isEra3
          ? `Tu-14 噴射魚雷機 (#${i + 1})`
          : `反艦魚雷機 (#${i + 1})`,
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
        gunAmmo: isEra5 ? 800 : isEra4 ? 400 : isEra3 ? 400 : 500,
        maxGunAmmo: isEra5 ? 800 : isEra4 ? 400 : isEra3 ? 400 : 500,
        wingmanOffset: { x: i * 26, y: 15 },
        missionType: 'strike_fleet',
        hasDefensiveTurret: isEra5 || isEra4 || isEra3,
        rearGunnerCooldown: 0,
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `⚠️【Strike Package 水面艦艇獵殺】蘇軍 ${totalFleetCount}架 Su-25 / Tu-22M3 噴射打擊機隊低空掠海直撲我巡洋艦與驅逐艦！`
        : isEra4
        ? `⚠️【Strike Package 水面艦艇獵殺】敵 ${totalFleetCount}架 Su-7 / IL-28 噴射打擊機隊低空掠海直撲我護航艦艇！`
        : isEra3
        ? `⚠️【Strike Package 反艦打擊】冷戰聯軍 ${totalFleetCount}機 編隊鎖定我巡洋艦與護航驅逐艦！`
        : `⚠️【Strike Package 反艦打擊】敵 ${totalFleetCount}機 轟炸機隊鎖定我巡洋艦與護航驅逐艦！`,
      'enemy',
      'down',
      6.0
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯北方艦隊航空兵反艦特遣隊' : isEra4 ? '北越人民軍海軍航空反艦作戰隊' : isEra3 ? '冷戰遠東反艦突擊隊' : '反艦戰鬥轟炸隊',
      targetName: targetShip?.name || '護航艦隊',
      actionType: 'recon_spotted',
      text: isEra5
        ? `⚠️【反艦動態編隊來襲】蘇軍 ${totalFleetCount}架 Su-25 蛙足強擊機與 Tu-22M3 逆火超音速轟炸機掠海突進，目標鎖定神盾護航艦「${targetShip?.name || '巡洋艦'}」！`
        : isEra4
        ? `⚠️【反艦動態編隊來襲】敵 ${totalFleetCount}架 Su-7 裝配匠強擊機與 IL-28 噴射魚雷轟炸機超低空掠海飛來，目標鎖定護航艦艇「${targetShip?.name || '巡洋艦'}」！`
        : isEra3
        ? `⚠️【反艦動態編隊來襲】冷戰遠東聯軍 ${totalFleetCount}架 打擊機隊掠海飛來，Tu-14 噴射魚雷機與 IL-10 強擊機目標鎖定護航艦艇「${targetShip?.name || '巡洋艦'}」！`
        : `⚠️【反艦動態編隊來襲】敵 ${totalFleetCount}架 打擊機隊掠海飛來，目標鎖定護航艦艇「${targetShip?.name || '巡洋艦'}」！護航艦砲火全力攔截！`,
    });

    this.organizeStrikePackage(sqId);
  }

  private launchEnemyFlagshipStrike(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, fModel: AircraftModel, dbModel: AircraftModel, tbModel: AircraftModel): void {
    // 4. Strike Package (針對旗艦反艦 動態編隊: 2-6架): 蘇聯海航 Tu-16 獾式長程飛彈轟炸機 + 蘇聯空軍 Su-7 強擊機 + 北越 MiG-21 直衛
    soundEngine.playKamikazeSiren();
    const target = flagship ? { ...flagship.pos } : { x: 3000, y: 11000 };
    const heading = Math.atan2(target.y - spawnPos.y, target.x - spawnPos.x);

    const totalStrikeCount = this.calculateDynamicWaveSize(7); // 4-12 架
    const escCount = totalStrikeCount >= 7 ? 3 : 2;
    const bomberCount = totalStrikeCount - escCount;
    const dbCount = Math.ceil(bomberCount / 2);
    const tbCount = bomberCount - dbCount;

    // 護航戰鬥機 (Su-27 / MiG-21 / MiG-15 / Zero Escorts)
    const escModel: AircraftModel = isEra5 ? (Math.random() < 0.5 ? 'su27' : 'mig29a') : isEra4 ? 'mig21' : isEra3 ? 'mig15' : fModel;
    const escSpeed = getAircraftSpeed(escModel);
    const escHealth = isEra5 ? 750 : isEra4 ? 580 : isEra3 ? 540 : 160;

    for (let i = 0; i < escCount; i++) {
      this.aircraft.push({
        id: `st-flag-f-${Date.now()}-${i}`,
        squadronId: sqId,
        model: escModel,
        role: 'fighter',
        name: isEra5
          ? (escModel === 'su27' ? `Su-27 側衛反艦護航直衛機 (蘇聯防空軍 #${i + 1})` : `MiG-29A 支點護航直衛機 (#${i + 1})`)
          : isEra4
          ? `MiG-21 魚窩反艦護航直衛機 (北越921團 #${i + 1})`
          : isEra3
          ? `旗艦突擊 MiG-15 噴射直衛機 (#${i + 1})`
          : `旗艦突擊直衛機 (#${i + 1})`,
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
        hasPayload: isEra5 || isEra4,
        payloadType: (isEra5 || isEra4) ? 'aim9_sidewinder' : undefined,
        shootCooldown: 0,
        gunAmmo: isEra5 ? 250 : isEra4 ? 200 : isEra3 ? 300 : 1000,
        maxGunAmmo: isEra5 ? 250 : isEra4 ? 200 : isEra3 ? 300 : 1000,
        wingmanOffset: { x: i * 30, y: -25 },
        missionType: 'strike_flagship',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    // 俯衝轟炸機 / 強擊機 (Su-25 / Su-7 / IL-10 / Val / Judy)
    const strikeDbModel: AircraftModel = isEra5 ? 'su25' : isEra4 ? 'su7' : isEra3 ? 'il10' : dbModel;
    const strikeDbSpeed = getAircraftSpeed(strikeDbModel);
    const strikeDbHealth = isEra5 ? 850 : isEra4 ? 700 : isEra3 ? 620 : 155;

    for (let i = 0; i < dbCount; i++) {
      this.aircraft.push({
        id: `st-flag-db-${Date.now()}-${i}`,
        squadronId: sqId,
        model: strikeDbModel,
        role: 'dive_bomber',
        name: isEra5
          ? `Su-25 蛙足超低空反艦強擊機 (蘇聯前線空軍 #${i + 1})`
          : isEra4
          ? `Su-7 裝配匠超音速反艦強擊機 (蘇聯空軍遠東戰術大隊 #${i + 1})`
          : isEra3
          ? `IL-10 鐵獸裝甲強擊機 (#${i + 1})`
          : `旗艦俯衝轟炸機 (#${i + 1})`,
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
        gunAmmo: isEra5 ? 400 : isEra4 ? 320 : isEra3 ? 600 : 600,
        maxGunAmmo: isEra5 ? 400 : isEra4 ? 320 : isEra3 ? 600 : 600,
        wingmanOffset: { x: i * 28, y: 0 },
        missionType: 'strike_flagship',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    // 魚雷攻擊機 / 長程反艦飛彈轟炸機 (Tu-22M3 逆火 / Tu-16 獾式 / Tu-14 / Kate / Jill)
    const strikeTbModel: AircraftModel = isEra5 ? 'tu22m3' : isEra4 ? 'tu16' : isEra3 ? 'tu14' : tbModel;
    const strikeTbSpeed = getAircraftSpeed(strikeTbModel);
    const strikeTbHealth = isEra5 ? 2200 : isEra4 ? 1350 : isEra3 ? 680 : 150;

    for (let i = 0; i < tbCount; i++) {
      this.aircraft.push({
        id: `st-flag-tb-${Date.now()}-${i}`,
        squadronId: sqId,
        model: strikeTbModel,
        role: 'torpedo_bomber',
        name: isEra5
          ? `Tu-22M3 逆火超音速反艦飛彈轟炸機 (蘇聯海航 AV-MF #${i + 1})`
          : isEra4
          ? `Tu-16 獾式長程反艦飛彈轟炸機 (蘇聯海航 AV-MF #${i + 1})`
          : isEra3
          ? `Tu-14 雙噴射魚雷轟炸機 (#${i + 1})`
          : `旗艦魚雷雷擊機 (#${i + 1})`,
        side: 'enemy',
        pos: { x: spawnPos.x + i * 35, y: spawnPos.y + 30 },
        vel: { x: Math.cos(heading) * strikeTbSpeed, y: Math.sin(heading) * strikeTbSpeed },
        heading,
        targetHeading: heading,
        speed: strikeTbSpeed,
        maxSpeed: strikeTbSpeed,
        altitude: 0.88,
        state: 'cruising',
        health: strikeTbHealth,
        maxHealth: strikeTbHealth,
        order: { type: 'attack', targetPos: target, targetId: flagship?.id },
        hasPayload: true,
        shootCooldown: 0,
        gunAmmo: isEra5 ? 800 : isEra4 ? 600 : isEra3 ? 400 : 500,
        maxGunAmmo: isEra5 ? 800 : isEra4 ? 600 : isEra3 ? 400 : 500,
        wingmanOffset: { x: i * 35, y: 30 },
        missionType: 'strike_flagship',
        hasDefensiveTurret: true,
        rearGunnerCooldown: 0,
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `🚨【Strike Package 蘇聯紅海軍飽和反艦大突擊！】Tu-22M3 逆火超音速飛彈轟炸機 (Kh-22 暴風雨超音速反艦飛彈) + Su-25 強擊機 + Su-27 護航直撲航母！`
        : isEra4
        ? `🚨【Strike Package 蘇越聯合旗艦大打擊群！】蘇聯海航 Tu-16 獾式長程飛彈轟炸機 (KSR-5 超音速反艦飛彈) + 蘇聯空軍 Su-7 強擊機 + 北越空軍 MiG-21 直撲航母！`
        : isEra3
        ? `🚨【Strike Package 旗艦反艦編隊】冷戰聯軍 ${totalStrikeCount}機 打擊群（圖-14與伊爾-10）直撲我旗艦航母！`
        : `🚨【Strike Package 旗艦反艦編隊】敵海空主力 ${totalStrikeCount}機 打擊群直撲我旗艦航母！`,
      'enemy',
      'sunk',
      7.0
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯海軍航空兵特遣打擊部隊 (AV-MF)' : isEra4 ? '蘇聯海空軍特遣打擊部隊 (AV-MF / VPAF)' : isEra3 ? '冷戰遠東航空打擊軍 (Strike Package)' : '帝國海軍第一航空戰隊 (Strike Package)',
      targetName: flagship?.name || '特混艦隊旗艦',
      actionType: 'recon_spotted',
      text: isEra5
        ? `🚨【蘇聯海航逆火大編隊反艦突擊！】長程雷達網紅警狂響！偵測到蘇聯海航 ${totalStrikeCount}機 飽和打擊群（Tu-22M3 逆火掛載 Kh-22 重型超音速反艦飛彈 + Su-25 蛙足強擊機 + Su-27 側衛超音速護航）全速直撲「${flagship?.name || '航空母艦'}」！`
        : isEra4
        ? `🚨【蘇越海空聯合突擊旗艦！】長程對空警戒雷達警報大作！偵測到敵 ${totalStrikeCount}機 聯合重打擊群（蘇聯海航 Tu-16 獾式飛彈轟炸機掛載 KSR-5 凱爾特超音速重型反艦飛彈 + 蘇聯空軍 Su-7 裝配匠超音速強擊機 + 北越 921 團 MiG-21 超音速護航）全速直撲「${flagship?.name || '航空母艦'}」！`
        : isEra3
        ? `🚨【旗艦打擊編隊！】長程對空雷達警報大作！偵測到敵 ${totalStrikeCount}機 動態反艦打擊群 (Tu-14 噴射魚雷機 + IL-10 鐵獸強擊機 + MiG-15 噴射直衛) 全速直撲「${flagship?.name || '航空母艦'}」！`
        : `🚨【旗艦打擊編隊！】長程對空雷達警報大作！偵測到敵 ${totalStrikeCount}機 動態反艦打擊群 (魚雷機+俯衝艦爆+直衛零戰) 全速直撲「${flagship?.name || '航空母艦'}」！`,
    });

    this.organizeStrikePackage(sqId);
  }

  private launchEnemyScramble(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, fModel: AircraftModel): void {
    // 3. Scramble (緊急迎擊起飛): 基地防空警報大作時立即由跑道拉起 (動態規模 2-4架)
    soundEngine.playKamikazeSiren();
    const scrambleTarget = flagship ? { ...flagship.pos } : { x: 5000, y: 5000 };
    const heading = Math.atan2(scrambleTarget.y - spawnPos.y, scrambleTarget.x - spawnPos.x);

    const scModel: AircraftModel = isEra5 ? (() => { const r = Math.random(); return r < 0.34 ? 'su27' : r < 0.67 ? 'mig29a' : 'mig23'; })() : isEra4 ? (Math.random() < 0.5 ? 'mig21' : 'mig19') : isEra3 ? 'mig15' : fModel;
    const scSpeed = getAircraftSpeed(scModel);
    const scHealth = isEra5 ? 720 : scModel === 'mig21' ? 580 : scModel === 'mig19' ? 560 : isEra3 ? 540 : 150;
    const scrambleCount = Math.min(8, this.calculateDynamicWaveSize(4));

    for (let i = 0; i < scrambleCount; i++) {
      this.aircraft.push({
        id: `enemy-scramble-${Date.now()}-${i}`,
        squadronId: sqId,
        model: scModel,
        role: 'fighter',
        name: isEra5
          ? (scModel === 'su27' ? `Su-27 側衛緊急迎擊噴射機 (#${i + 1})` : scModel === 'mig23' ? `MiG-23ML 鞭撻者緊急迎擊機 (#${i + 1})` : `MiG-29A 支點超音速迎擊機 (#${i + 1})`)
          : isEra4
          ? (scModel === 'mig21' ? `MiG-21 緊急迎擊噴射機 (#${i + 1})` : `MiG-19 超音速迎擊機 (#${i + 1})`)
          : isEra3
          ? `MiG-15 緊急迎擊噴射機 (#${i + 1})`
          : `緊急起飛迎擊機 (Scramble #${i + 1})`,
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
        hasPayload: (isEra5 || isEra4) && (scModel === 'su27' || scModel === 'mig29a' || scModel === 'mig23' || scModel === 'mig21'),
        payloadType: (isEra5 || isEra4) ? 'aim9_sidewinder' : undefined,
        shootCooldown: 0,
        gunAmmo: scModel === 'su27' ? 250 : scModel === 'mig29a' ? 250 : scModel === 'mig23' ? 200 : scModel === 'mig21' ? 200 : scModel === 'mig19' ? 210 : isEra3 ? 300 : 1000,
        maxGunAmmo: scModel === 'su27' ? 250 : scModel === 'mig29a' ? 250 : scModel === 'mig23' ? 200 : scModel === 'mig21' ? 200 : scModel === 'mig19' ? 210 : isEra3 ? 300 : 1000,
        wingmanOffset: { x: i * 22, y: 15 },
        missionType: 'scramble',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `⚡【Scramble 蘇軍基地超音速緊急迎擊】警報長鳴！${scrambleCount}架 ${scModel.toUpperCase()} 點燃後燃器強行起飛！`
        : isEra4
        ? `⚡【Scramble 蘇越超音速緊急迎擊】內排/安沛/克夫基地防空警報長鳴！${scrambleCount}架 ${scModel.toUpperCase()} 點燃後燃器強行起飛！`
        : isEra3
        ? `⚡【Scramble 噴射緊急迎擊】冷戰聯軍基地防空警報大作，${scrambleCount}架 米格-15 加足噴射推力升空！`
        : `⚡【Scramble 緊急起飛】敵前線航空基地 ${scrambleCount}架 戰機拉響警報緊急升空！`,
      'enemy',
      'sunk',
      5.0
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇軍前線戰區空軍基地迎擊聯隊' : isEra4 ? '內排/安沛空軍基地迎擊聯隊' : isEra3 ? '前線要塞迎擊隊' : '前線基地迎擊隊',
      targetName: '來襲戰機',
      actionType: 'recon_spotted',
      text: isEra5
        ? `⚡【${scModel.toUpperCase()} 超音速緊急起飛】蘇聯空軍前線基地一級戰備警報！${scrambleCount}架 ${scModel.toUpperCase()} 超音速戰機全後燃器推力緊急起飛迎敵！`
        : isEra4
        ? `⚡【${scModel.toUpperCase()} 超音速緊急起飛】北越前線基地跑道拉響一級戰備紅色警報！${scrambleCount}架 ${scModel.toUpperCase()} 噴射戰鬥機全推力加力強行起飛迎敵！`
        : isEra3
        ? `⚡【噴射截擊緊急升空】敵基地防空雷達鎖定！${scrambleCount}架 MiG-15 噴射戰鬥機點燃發動機強行起飛迎敵！`
        : `⚡【基地防空緊急起飛 (Scramble)】敵機場警報響起！${scrambleCount}架 戰機加足馬力強行起飛迎敵！`,
    });
  }

  private launchEnemyAirSweep(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, fModel: AircraftModel): void {
    // 2. Air Sweep (空中制空掃蕩): 戰鬥機大編隊飛越戰區搶奪制空權 (動態規模 2-6架)
    soundEngine.playKlaxon();
    const sweepTarget = flagship ? { ...flagship.pos } : { x: 6000, y: 7000 };
    const heading = Math.atan2(sweepTarget.y - spawnPos.y, sweepTarget.x - spawnPos.x);

    const sweepCount = this.calculateDynamicWaveSize(6);
    for (let i = 0; i < sweepCount; i++) {
      const sweepModel: AircraftModel = isEra5
        ? (i % 3 === 0 ? 'su27' : i % 3 === 1 ? 'mig29a' : 'yak38')
        : isEra4
        ? (i % 3 === 0 ? 'mig21' : i % 3 === 1 ? 'mig19' : 'mig17')
        : isEra3
        ? (i % 2 === 0 ? 'mig15' : 'yak9')
        : i % 2 === 0
        ? fModel
        : (this.era === 'era1' ? 'zero_a6m5' : 'ki61');
      const sSpeed = getAircraftSpeed(sweepModel);
      const sHealth = sweepModel === 'su27' ? 750 : sweepModel === 'mig29a' ? 680 : sweepModel === 'yak38' ? 520 : sweepModel === 'mig21' ? 580 : sweepModel === 'mig19' ? 560 : sweepModel === 'mig17' ? 480 : sweepModel === 'mig15' ? 540 : sweepModel === 'yak9' ? 440 : 175;

      this.aircraft.push({
        id: `enemy-sweep-${Date.now()}-${i}`,
        squadronId: sqId,
        model: sweepModel,
        role: 'fighter',
        name: isEra5
          ? (sweepModel === 'su27' ? `Su-27 側衛高空超音速制空戰機 (#${i + 1})` : sweepModel === 'mig29a' ? `MiG-29A 支點前線格鬥戰機 (#${i + 1})` : `Yak-38 鐵匠艦載垂直起降攔截機 (#${i + 1})`)
          : isEra4
          ? (sweepModel === 'mig21' ? `MiG-21 魚窩高空制空戰機 (#${i + 1})` : sweepModel === 'mig19' ? `MiG-19 農夫超音速纏鬥機 (#${i + 1})` : `MiG-17 壁畫低空纏鬥王牌機 (#${i + 1})`)
          : isEra3
          ? `${sweepModel.toUpperCase()} 冷戰空優戰鬥機 (#${i + 1})`
          : `制空掃蕩戰鬥機 (Air Sweep #${i + 1})`,
        side: 'enemy',
        pos: { x: spawnPos.x + i * 32, y: spawnPos.y + (i - (sweepCount - 1) / 2) * 25 },
        vel: { x: Math.cos(heading) * sSpeed, y: Math.sin(heading) * sSpeed },
        heading,
        targetHeading: heading,
        speed: sSpeed,
        maxSpeed: sSpeed,
        altitude: 0.92,
        state: 'patrolling',
        health: sHealth,
        maxHealth: sHealth,
        order: { type: 'patrol', patrolOrigin: sweepTarget },
        airMission: 'sweep',
        missionTimer: 45,
        hasPayload: (isEra5 || isEra4) && (sweepModel === 'su27' || sweepModel === 'mig29a' || sweepModel === 'mig21'),
        payloadType: (isEra5 || isEra4) ? 'aim9_sidewinder' : undefined,
        shootCooldown: 0,
        gunAmmo: sweepModel === 'su27' ? 250 : sweepModel === 'mig29a' ? 250 : sweepModel === 'yak38' ? 250 : sweepModel === 'mig21' ? 200 : sweepModel === 'mig19' ? 210 : sweepModel === 'mig17' ? 240 : sweepModel === 'mig15' ? 300 : sweepModel === 'yak9' ? 340 : 1000,
        maxGunAmmo: sweepModel === 'su27' ? 250 : sweepModel === 'mig29a' ? 250 : sweepModel === 'yak38' ? 250 : sweepModel === 'mig21' ? 200 : sweepModel === 'mig19' ? 210 : sweepModel === 'mig17' ? 240 : sweepModel === 'mig15' ? 300 : sweepModel === 'yak9' ? 340 : 1000,
        wingmanOffset: { x: i * 30, y: (i - (sweepCount - 1) / 2) * 22 },
        missionType: 'air_sweep',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `⚔️【Air Sweep 蘇聯海空軍制空大掃蕩】${sweepCount}架 Su-27 / MiG-29A / Yak-38 高低空超音速混編戰鬥群突入搶奪制空權！`
        : isEra4
        ? `⚔️【Air Sweep 蘇越戰區制空掃蕩】${sweepCount}架 MiG-21 / MiG-19 / MiG-17 高中低三層混編噴射戰鬥群突入搶奪制空權！`
        : isEra3
        ? `⚔️【Air Sweep 冷戰空優掃蕩】${sweepCount}架 米格-15 噴射機與雅克-9 混編大隊搶奪戰區制空權！`
        : `⚔️【Air Sweep 制空掃蕩】日軍派出 ${sweepCount}架 王牌戰鬥機編隊搶奪制空權！`,
      'enemy',
      'down',
      6.0
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯空軍與北方艦隊航空兵制空大隊' : isEra4 ? '北越人民軍空軍 921/923/925 聯合掃蕩大隊' : isEra3 ? '遠東前線聯軍制空戰隊' : '南太平洋航空戰隊制空隊',
      targetName: '特混艦隊制空空域',
      actionType: 'recon_spotted',
      text: isEra5
        ? `⚔️【空中制空掃蕩 (Air Sweep)】蘇聯海空軍 ${sweepCount}架 Su-27 / MiG-29A 超音速噴射戰機掠海與高空突入！雷達鎖定我軍巡邏戰機 (CAP) 爭奪全戰區制空權！`
        : isEra4
        ? `⚔️【空中制空掃蕩 (Air Sweep)】北越 VPAF ${sweepCount}架 MiG-21 / MiG-19 / MiG-17 噴射戰機高速突入！MiG-21 高空雷達掩護、MiG-19 爬升攔截、MiG-17 低空山谷剪刀伏擊，專門搜尋我軍巡邏戰機 (CAP) 爭奪制空權！`
        : isEra3
        ? `⚔️【空中制空掃蕩 (Air Sweep)】冷戰聯軍 ${sweepCount}架 MiG-15 / Yak-9 戰鬥機高速掠過戰區，專門搜尋我軍巡邏戰機 (CAP) 爭奪制空權！`
        : `⚔️【空中制空掃蕩 (Air Sweep)】偵測到敵軍 ${sweepCount}架 零戰/飛燕高速掠過鐵底灣！專門鎖定我軍巡邏戰機 (CAP) 爭奪制空權！`,
    });
  }

  private launchEnemyDca(flagship: Ship | undefined, spawnPos: Vector2D, sqId: string, isEra3: boolean, isEra4: boolean, isEra5: boolean, fModel: AircraftModel): void {
    // 1. DCA (防空攔截): 戰鬥機緊急升空截擊正在逼近之轟炸機隊 (動態規模 2-6架)
    soundEngine.playKlaxon();
    const targetPlane = this.aircraft.find(
      (a) => a.side === 'player' && a.state !== 'shot_down' && (a.role === 'dive_bomber' || a.role === 'torpedo_bomber' || a.role === 'level_bomber' || a.role === 'attacker')
    );
    const targetPos = targetPlane ? targetPlane.pos : (flagship ? flagship.pos : { x: 5000, y: 5000 });
    const heading = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);

    const dcaModel: AircraftModel = isEra5 ? (() => { const r = Math.random(); return r < 0.34 ? 'su27' : r < 0.67 ? 'mig29a' : 'mig23'; })() : isEra4 ? (Math.random() < 0.6 ? 'mig21' : 'mig19') : isEra3 ? 'mig15' : fModel;
    const dcaSpeed = getAircraftSpeed(dcaModel);
    const dcaHealth = isEra5 ? 750 : dcaModel === 'mig21' ? 580 : dcaModel === 'mig19' ? 560 : isEra3 ? 540 : 160;
    const dcaCount = this.calculateDynamicWaveSize(5);

    for (let i = 0; i < dcaCount; i++) {
      const thisModel: AircraftModel = isEra5 ? (['su27', 'mig29a', 'mig23', 'mig31'] as const)[i % 4] : isEra4 ? (i % 2 === 0 ? 'mig21' : 'mig19') : dcaModel;
      this.aircraft.push({
        id: `enemy-dca-${Date.now()}-${i}`,
        squadronId: sqId,
        model: thisModel,
        role: 'fighter',
        name: isEra5
          ? (thisModel === 'su27' ? `Su-27 側衛超音速防空截擊機 (#${i + 1})` : thisModel === 'mig23' ? `MiG-23ML 鞭撻者可變翼截擊機 (#${i + 1})` : thisModel === 'mig31' ? `MiG-31 獵狐犬遠程截擊機 (#${i + 1})` : `MiG-29A 支點全天候截擊機 (#${i + 1})`)
          : isEra4
          ? (thisModel === 'mig21' ? `MiG-21 魚窩超音速防空截擊機 (#${i + 1})` : `MiG-19 農夫超音速防空截擊機 (#${i + 1})`)
          : isEra3
          ? `DCA 米格-15 噴射截擊機 (#${i + 1})`
          : `DCA 零戰防空截擊機 (#${i + 1})`,
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
        hasPayload: (isEra5 || isEra4) && (thisModel === 'su27' || thisModel === 'mig29a' || thisModel === 'mig23' || thisModel === 'mig31' || thisModel === 'mig21'),
        payloadType: (isEra5 || isEra4) ? 'aim9_sidewinder' : undefined,
        shootCooldown: 0,
        gunAmmo: thisModel === 'su27' ? 250 : thisModel === 'mig29a' ? 250 : thisModel === 'mig23' ? 200 : thisModel === 'mig21' ? 200 : thisModel === 'mig19' ? 210 : isEra3 ? 300 : 1000,
        maxGunAmmo: thisModel === 'su27' ? 250 : thisModel === 'mig29a' ? 250 : thisModel === 'mig23' ? 200 : thisModel === 'mig21' ? 200 : thisModel === 'mig19' ? 210 : isEra3 ? 300 : 1000,
        wingmanOffset: { x: i * 25, y: (i - (dcaCount - 1) / 2) * 20 },
        missionType: 'dca',
        chaffCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxChaff: isEra5 ? 36 : isEra4 ? 24 : undefined,
        flareCount: isEra5 ? 36 : isEra4 ? 24 : undefined,
        maxFlare: isEra5 ? 36 : isEra4 ? 24 : undefined,
      });
    }

    this.addBannerAlert(
      isEra5
        ? `🚨【DCA 蘇聯防空軍超音速截擊】蘇聯 GCI / 30N6 雷達引導！${dcaCount}架 Su-27 / MiG-29A 超音速截擊戰機全加力升空阻截！`
        : isEra4
        ? `🚨【DCA 蘇越防空截擊】蘇聯 GCI 雷達引導！${dcaCount}架 北越空軍 MiG-21 / MiG-19 超音速截擊大隊全加力升空阻截！`
        : isEra3
        ? `🚨【DCA 噴射防空截擊】冷戰聯軍出動 ${dcaCount}架 MiG-15 噴射截擊編隊緊急升空阻截！`
        : `🚨【DCA 戰鬥機防空攔截】敵出動 ${dcaCount}架 戰機升空截擊我空襲轟炸機！`,
      'enemy',
      'sunk',
      5.5
    );
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯國土防空軍 (PVO GCI引導)' : isEra4 ? '北越人民軍空軍 921/925 截擊團 (蘇聯GCI引導)' : isEra3 ? '冷戰遠東航空軍 (DCA)' : '帝國海軍防空戰隊 (DCA)',
      targetName: targetPlane ? targetPlane.name : '美軍空襲編隊',
      actionType: 'recon_spotted',
      text: isEra5
        ? `🚨【Su-27 / MiG-29A 超音速截擊起飛】蘇聯防空軍 (PVO) 地面引導雷達偵獲我機！緊急起飛 ${dcaCount}架 Su-27 與 MiG-29A 實施極速防空截擊！`
        : isEra4
        ? `🚨【MiG-21 / MiG-19 超音速截擊起飛】蘇聯顧問團 GCI 地面引導雷達偵獲我機！北越空軍 921 團與 925 團起飛 ${dcaCount}架 米格-21 與 米格-19 戰鬥機實施超音速防空截擊！`
        : isEra3
        ? `🚨【MiG-15 噴射截擊起飛】防空雷達偵獲我機！冷戰聯軍基地緊急起飛 ${dcaCount}架 米格-15 (MiG-15) 噴射戰鬥機實施超音速防空攔截！`
        : `🚨【DCA 防空截擊起飛】防空雷達與哨戒艇偵獲美機逼近！敵基地緊急彈射 ${dcaCount}架 ${fModel.toUpperCase()} 戰鬥機實施防空攔截 (DCA)！`,
    });
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

        if (inst.type === 'flak_battery') {
          // 防空高射砲陣地 (雙方皆可自動對敵機射擊)
          const targetPlane = this.aircraft.find(
            (a) => this.isHostile(inst.side, a.side) && a.state !== 'shot_down' && dist(inst.pos, a.pos) <= inst.range
          );
          if (targetPlane && inst.cooldown <= 0) {
            this.fireFlakBurst(inst.pos, targetPlane, inst.side);
            inst.cooldown = inst.reloadTime;
          }
          continue;
        }

        if (inst.side === 'player') {
          // 友軍島上固定式重砲 (M1 240mm / 203mm / 155mm 岸防砲) 與野戰砲兵連主動迎敵砲擊
          if (inst.type === 'coastal_gun' || inst.type === 'towed_artillery') {
            const hasAmmoDepot = island.installations.some(
              (other) => !other.isDestroyed && other.side === inst.side && other.type === 'ammo_depot'
            );
            const reloadMod = hasAmmoDepot ? 0.75 : 1.0;

            const shipTarget = this.enemyShips
              .filter((s) => !s.isSunk && this.isHostile(inst.side, s.side) && (!this.isSubmarine(s) || Boolean(s.isSpotted)) && dist(inst.pos, s.pos) <= inst.range)
              .sort((a, b) => dist(inst.pos, a.pos) - dist(inst.pos, b.pos))[0];

            const groundTarget = !shipTarget
              ? this.groundUnits
                  .filter((u) => !u.isDestroyed && !u.embarkedInShipId && this.isHostile(inst.side, u.side) && dist(inst.pos, u.pos) <= inst.range)
                  .sort((a, b) => dist(inst.pos, a.pos) - dist(inst.pos, b.pos))[0]
              : undefined;

            const instTarget =
              !shipTarget && !groundTarget && inst.type === 'coastal_gun'
                ? this.islands
                    .flatMap((isl) => isl.installations)
                    .filter((other) => !other.isDestroyed && !other.isCivilian && this.isHostile(inst.side, other.side) && dist(inst.pos, other.pos) <= inst.range)
                    .sort((a, b) => dist(inst.pos, a.pos) - dist(inst.pos, b.pos))[0]
                : undefined;

            const targetEntity: Ship | GroundUnit | Installation | undefined = shipTarget || groundTarget || instTarget;
            if (targetEntity) {
              const is240mm = inst.name.includes('240mm') || inst.id.includes('240');
              const shellSpeed = is240mm ? 460 : 420;
              const rawDist = dist(inst.pos, targetEntity.pos);
              const flightTime = rawDist / shellSpeed;
              const targetVel = 'vel' in targetEntity && targetEntity.vel ? targetEntity.vel : { x: 0, y: 0 };
              const aimPos: Vector2D = {
                x: targetEntity.pos.x + targetVel.x * flightTime,
                y: targetEntity.pos.y + targetVel.y * flightTime,
              };
              const dAim = Math.max(1, dist(inst.pos, aimPos));
              inst.angle = Math.atan2(aimPos.y - inst.pos.y, aimPos.x - inst.pos.x);

              if (inst.cooldown <= 0) {
                soundEngine.playGunSalvo(true);
                this.registerArtillerySignature(inst.pos, inst.side, inst.name, is240mm ? 'm1_240mm' : inst.type);
                const shellDmg = inst.damage ?? (is240mm ? 850 : inst.type === 'coastal_gun' ? 380 : 220);
                const blastRadius = inst.blastRadius ?? (is240mm ? 52 : inst.type === 'coastal_gun' ? 36 : 28);
                this.projectiles.push({
                  id: `friendly-shore-shell-${Date.now()}-${Math.random()}`,
                  type: 'shell',
                  side: inst.side,
                  pos: { x: inst.pos.x + Math.cos(inst.angle) * 26, y: inst.pos.y + Math.sin(inst.angle) * 26 },
                  vel: {
                    x: ((aimPos.x - inst.pos.x) / dAim) * shellSpeed,
                    y: ((aimPos.y - inst.pos.y) / dAim) * shellSpeed,
                  },
                  originPos: { ...inst.pos },
                  targetPos: { ...aimPos },
                  flightProgress: 0,
                  maxDistance: dAim,
                  distanceTraveled: 0,
                  damage: shellDmg,
                  blastRadius,
                  speed: shellSpeed,
                  heading: inst.angle,
                  isDead: false,
                  trail: [],
                  attackerName: inst.name,
                });
                inst.cooldown = (inst.reloadTime || 4.0) * reloadMod;
              }
            }
          }
          continue;
        }

        // ══════════════════════════════════════════════════════════
        // 敵方地面單位 (OPFOR Ground Units) - 嚴格遵守 ASuW 限制
        // ══════════════════════════════════════════════════════════

        // 尋找射程內我方或盟軍水面艦艇、搶灘登陸部隊 (ASuW 專用目標)
        const shipTarget = [...this.playerShips, ...this.alliedShips]
          .filter(
            (s) =>
              !s.isSunk &&
              this.isHostile(inst.side, s.side) &&
              (!this.isSubmarine(s) || Boolean(s.isSpottedByEnemy)) &&
              dist(inst.pos, s.pos) <= inst.range
          )
          .sort((a, b) => dist(inst.pos, a.pos) - dist(inst.pos, b.pos))[0];
        const groundTarget = !shipTarget
          ? this.groundUnits.find((u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(inst.pos, u.pos) <= inst.range)
          : null;
        const targetPos = shipTarget ? shipTarget.pos : groundTarget ? groundTarget.pos : null;

        if (inst.type === 'coastal_gun') {
          // 203mm 岸防重砲 (ASuW Only)：砲擊近海美軍及盟軍巡洋艦/航母/登陸艦
          if (targetPos) {
            inst.angle = Math.atan2(targetPos.y - inst.pos.y, targetPos.x - inst.pos.x);
            if (inst.cooldown <= 0) {
              soundEngine.playGunSalvo(true);
              this.registerArtillerySignature(inst.pos, inst.side, inst.name, inst.type);
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
                damage: inst.damage ?? 260,
                blastRadius: inst.blastRadius ?? 30,
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
              this.registerArtillerySignature(inst.pos, inst.side, inst.name, inst.type);
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

    for (const w of this.groundWrecks) w.age += dt;
    this.groundWrecks = this.groundWrecks.filter((w) => w.age < WRECK_LIFETIME);

    // ══════════════════════════════════════════════════════════
    // 2. 地面部隊狀態更新、組織度/建制度計算與投降審查 (Ground Unit Logic)
    // ══════════════════════════════════════════════════════════
    for (let i = this.groundUnits.length - 1; i >= 0; i--) {
      const unit = this.groundUnits[i];
      if (unit.isDestroyed) {
        if (!unit.embarkedInShipId && leavesWreck(unit.type)) {
          const heading = unit.order.targetPos ? Math.atan2(unit.order.targetPos.y - unit.pos.y, unit.order.targetPos.x - unit.pos.x) : unit.side === 'player' ? 0 : Math.PI;
          this.groundWrecks.push({ id: `wreck-${unit.id}`, type: unit.type, side: unit.side, pos: { ...unit.pos }, heading, age: 0 });
          if (this.groundWrecks.length > 60) this.groundWrecks.shift();
        }
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
      if (unit.side === 'player' || unit.side === 'allied') {
        if (this.updateFriendlyGroundCombat(unit)) continue;
      } else {
        this.updateEnemyGroundCombat(dt, unit);
      }
    }

    // 3. 跨時代長程火箭/戰術飛彈與自走砲自動反砲擊雷達聯動 (Era 2-5 Long-Range MLRS/SSM & SPG Counter-Battery)
    this.updateGroundLongRangeAndCounterBattery();
  }

  /** OPFOR ground unit fire selection and attack. */
  private updateEnemyGroundCombat(dt: number, unit: GroundUnit): void {
    // ══════════════════════════════════════════════════════════
    // 敵軍地面部隊 AI (OPFOR SPAAG Active AA + Mobile Patrols & Counter-Attacks)
    // ══════════════════════════════════════════════════════════
    const isOpforSpaag =
      unit.type === 'opfor_s60_flak' ||
      unit.type === 'opfor_ks19_heavy' ||
      unit.type === 'opfor_zsu23_shilka' ||
      unit.type === 'opfor_zu23_aa' ||
      unit.type === 'opfor_zsu57_2' ||
      unit.type === 'opfor_btr_zd' ||
      unit.type === 'opfor_tunguska';

    if (isOpforSpaag && unit.cooldown <= 0 && !unit.embarkedInShipId) {
      const aaRange =
        unit.type === 'opfor_ks19_heavy'
          ? 1900
          : unit.type === 'opfor_zsu57_2'
          ? 1700
          : unit.type === 'opfor_s60_flak'
          ? 1550
          : 1400;
      const targetPlane = this.aircraft.find(
        (a) => this.isHostile(unit.side, a.side) && a.state !== 'shot_down' && dist(unit.pos, a.pos) <= aaRange
      );
      if (targetPlane) {
        unit.heading = Math.atan2(targetPlane.pos.y - unit.pos.y, targetPlane.pos.x - unit.pos.x);
        this.fireFlakBurst(unit.pos, targetPlane, unit.side);
        unit.cooldown = unit.disorganized ? 2.8 : 1.45;
      }
    }

    const targetGround = this.groundUnits.find(
      (u) => this.isHostile(unit.side, u.side) && !u.isDestroyed && !u.embarkedInShipId && dist(unit.pos, u.pos) <= (unit.isBanzaiCharging ? 1200 : unit.range)
    );

    // 局部反突擊判定: 若同一島嶼或1600m內有美軍或盟軍登陸部隊，敵機動部隊主動逼近
    const nearbyLandingForce = !targetGround
      ? this.groundUnits.find(
          (u) => this.isHostile(unit.side, u.side) && !u.isDestroyed && !u.embarkedInShipId && dist(unit.pos, u.pos) <= 1600
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

    if (targetGround) {
      unit.heading = Math.atan2(targetGround.pos.y - unit.pos.y, targetGround.pos.x - unit.pos.x);

      // Banzai charge: 狂熱白刃刺刀突擊
      if (unit.isBanzaiCharging) {
        unit.pos.x += Math.cos(unit.heading) * unit.maxSpeed * 1.6 * dt * 18;
        unit.pos.y += Math.sin(unit.heading) * unit.maxSpeed * 1.6 * dt * 18;

        if (dist(unit.pos, targetGround.pos) < 60 && unit.cooldown <= 0) {
          soundEngine.playExplosion(false);
          const targetOrg = targetGround.organization ?? 100;
          const orgDmgScale = targetOrg < 50 ? 1.0 + 0.5 * (1.0 - targetOrg / 50) : 1.0;
          const urbanDefense = targetGround.isInUrbanCover ? 0.50 : 1.0;
          const banzaiDmg = Math.round(120 * orgDmgScale * urbanDefense);
          targetGround.health -= banzaiDmg;
          targetGround.organization = Math.max(0, targetGround.organization - (targetGround.isInUrbanCover ? 14 : 25));
          targetGround.strength = Math.max(0, Math.round((targetGround.health / targetGround.maxHealth) * 100));

          this.particles.push({
            id: `banzai-clash-${Date.now()}`,
            x: targetGround.pos.x,
            y: targetGround.pos.y,
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
            targetName: targetGround.name,
            actionType: 'gun_hit',
            damage: banzaiDmg,
            text: `⚔️【白刃突擊！】狂熱萬歲衝鋒刺刀突入「${targetGround.name}」防線！造成 ${banzaiDmg} 點傷害，士氣重挫 (組織度-25%)！`,
          });
          unit.cooldown = 1.0;
          if (targetGround.health <= 0) {
            targetGround.isDestroyed = true;
          }
        }
      } else if (dist(unit.pos, targetGround.pos) <= unit.range && unit.cooldown <= 0) {
        soundEngine.playGunSalvo(false);
        const d = dist(unit.pos, targetGround.pos);
        const isArty = unit.isArtillery || unit.isSPG || unit.type.includes('artillery') || unit.type === 'opfor_2s1';
        const isTank = unit.type.includes('tank') || unit.type === 'opfor_t72b' || unit.type === 'opfor_t80b' || unit.type === 'opfor_bmp2';
        const isMortar = unit.type.includes('mortar');
        const isAtgm = unit.type === 'opfor_bmp2' || unit.type === 'opfor_t80b';
        const isNuclearScud = unit.type === 'opfor_scud_nuclear';
        const isScud = unit.type === 'opfor_scud_tel';
        const isOpforMlrs = unit.type === 'opfor_bm21_grad' || unit.type === 'opfor_bm27_uragan';

        if (isNuclearScud) {
          this.fireNuclearSSMMissile(unit, targetGround.pos, targetGround);
          unit.cooldown = unit.reloadTime || 45.0;
        } else if (isScud) {
          this.fireScudMissile(unit, targetGround.pos, targetGround);
          unit.cooldown = unit.reloadTime || 30.0;
        } else if (isOpforMlrs) {
          this.fireOpforMLRSSalvo(unit, targetGround.pos, targetGround);
          unit.cooldown = unit.reloadTime || (unit.type === 'opfor_bm27_uragan' ? 30.0 : 26.0);
        } else if (isAtgm) {
          soundEngine.playRocketWhoosh();
          const atgmSpeed = 460;
          const atgmName = unit.type === 'opfor_bmp2' ? '9M113 競賽 (Konkurs) 反戰車飛彈' : '9M112 眼鏡蛇 (Kobra) 砲射反戰車飛彈';
          this.projectiles.push({
            id: `opfor-atgm-${Date.now()}-${Math.random()}`,
            type: 'missile_arm',
            side: 'enemy',
            pos: { ...unit.pos },
            vel: {
              x: ((targetGround.pos.x - unit.pos.x) / d) * atgmSpeed,
              y: ((targetGround.pos.y - unit.pos.y) / d) * atgmSpeed,
            },
            originPos: { ...unit.pos },
            targetPos: { ...targetGround.pos },
            flightProgress: 0,
            maxDistance: d,
            distanceTraveled: 0,
            damage: Math.round(unit.damage * 1.3),
            blastRadius: 28,
            speed: atgmSpeed,
            heading: unit.heading,
            isDead: false,
            trail: [],
            attackerName: `${unit.name} 【${atgmName}】`,
            targetEntityId: targetGround.id,
            targetEntityType: 'ground',
            guidanceType: 'laser',
            turnRate: 3.6,
          });

          if (unit.type === 'opfor_bmp2') {
            for (let b = 0; b < 2; b++) {
              const spread = (Math.random() - 0.5) * 0.06;
              const bAngle = unit.heading + spread;
              const bSpeed = 510;
              this.projectiles.push({
                id: `opfor-2a42-${Date.now()}-${b}`,
                type: 'bullet',
                side: 'enemy',
                pos: { ...unit.pos },
                vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
                originPos: { ...unit.pos },
                targetPos: { ...targetGround.pos },
                flightProgress: 0,
                maxDistance: d,
                distanceTraveled: 0,
                damage: 60,
                blastRadius: 8,
                speed: bSpeed,
                heading: bAngle,
                isDead: false,
                trail: [],
                attackerName: `${unit.name} (2A42 30mm 機砲)`,
              });
            }
          }
          unit.cooldown = unit.disorganized ? unit.reloadTime * 2 : unit.reloadTime;
        } else if (isArty) {
          this.registerArtillerySignature(unit.pos, unit.side, unit.name, unit.type);
          if (d < 700) {
            unit.artilleryMode = 'direct_fire';
            const pSpeed = 560;
            this.projectiles.push({
              id: `opfor-arty-direct-${Date.now()}`,
              type: 'shell',
              side: 'enemy',
              pos: { ...unit.pos },
              vel: {
                x: ((targetGround.pos.x - unit.pos.x) / d) * pSpeed,
                y: ((targetGround.pos.y - unit.pos.y) / d) * pSpeed,
              },
              originPos: { ...unit.pos },
              targetPos: { ...targetGround.pos },
              flightProgress: 0,
              maxDistance: d,
              distanceTraveled: 0,
              damage: Math.round(unit.damage * 1.15),
              blastRadius: 20,
              speed: pSpeed,
              heading: unit.heading,
              isDead: false,
              trail: [],
              attackerName: `${unit.name} 【直瞄平射】`,
            });
          } else {
            unit.artilleryMode = 'bombardment';
            const pSpeed = 400;
            this.projectiles.push({
              id: `opfor-arty-bombard-${Date.now()}`,
              type: 'shell',
              side: 'enemy',
              pos: { ...unit.pos },
              vel: {
                x: ((targetGround.pos.x - unit.pos.x) / d) * pSpeed,
                y: ((targetGround.pos.y - unit.pos.y) / d) * pSpeed,
              },
              originPos: { ...unit.pos },
              targetPos: { ...targetGround.pos },
              flightProgress: 0,
              maxDistance: d,
              distanceTraveled: 0,
              damage: unit.damage,
              blastRadius: 40,
              arcAltitude: 1.25,
              speed: pSpeed,
              heading: unit.heading,
              isDead: false,
              trail: [],
              attackerName: `${unit.name} 【長程曲射】`,
            });
          }
        } else if (isTank || isMortar) {
          if (isMortar) {
            this.registerArtillerySignature(unit.pos, unit.side, unit.name, unit.type);
          }
          const pSpeed = isMortar ? 390 : 520;
          this.projectiles.push({
            id: `opfor-shell-${Date.now()}`,
            type: 'shell',
            side: 'enemy',
            pos: { ...unit.pos },
            vel: {
              x: ((targetGround.pos.x - unit.pos.x) / d) * pSpeed,
              y: ((targetGround.pos.y - unit.pos.y) / d) * pSpeed,
            },
            originPos: { ...unit.pos },
            targetPos: { ...targetGround.pos },
            flightProgress: 0,
            maxDistance: d,
            distanceTraveled: 0,
            damage: unit.damage,
            blastRadius: isMortar ? 18 : 22,
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
              targetPos: { ...targetGround.pos },
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
        targetGround.organization = Math.max(0, targetGround.organization - Math.max(3, Math.round(unit.damage / 26)));
        targetGround.suppression = Math.min(100, (targetGround.suppression || 0) + Math.max(16, Math.round(unit.damage / 16)));
        targetGround.suppressionTimer = 5.0;
        targetGround.isSuppressed = targetGround.suppression >= 30;
        targetGround.isPinned = targetGround.suppression >= 75;
        unit.cooldown = unit.disorganized ? unit.reloadTime * 2 : unit.reloadTime;
      }
    }
  }

  /** Player / allied ground unit fire selection and attack. */
  private updateFriendlyGroundCombat(unit: GroundUnit): boolean {
    let targetPos: Vector2D | null = null;
    let targetUnit: GroundUnit | null = null;

    const enemyGround = this.groundUnits.find(
      (u) => this.isHostile(unit.side, u.side) && !u.isDestroyed && dist(unit.pos, u.pos) <= unit.range
    );
    if (enemyGround) {
      targetPos = enemyGround.pos;
      targetUnit = enemyGround;
    } else {
      // Find enemy installation on current island (友軍地面部隊絕不攻擊我方或盟軍建造之陣地設施)
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (!inst.isDestroyed && this.isHostile(unit.side, inst.side) && dist(unit.pos, inst.pos) <= unit.range) {
            targetPos = inst.pos;
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
      const isNuclearAtacms = unit.type === 'us_atacms_nuclear';
      const isAtacms = unit.type === 'us_m270_atacms';
      const isCalliope = unit.type === 'us_m4_calliope';
      const isMlrs = unit.type === 'us_m270_mlrs';
      const isAtgm = unit.type === 'us_dragon_atgm' || unit.type === 'us_m2_bradley';
      const isArty = unit.isArtillery || unit.isSPG || unit.type.includes('artillery') || unit.type.includes('howitzer') || unit.type === 'us_m198_155';
      const isTank = unit.type.includes('armor') || unit.type.includes('tank') || unit.type === 'us_m1ip_abrams' || unit.type === 'us_m60a1_rise' || unit.type === 'us_m551_sheridan' || unit.type === 'us_m26_pershing' || unit.type === 'us_m1a1_abrams';
      const isShell = isTank || isArty || unit.type === 'usmc_lvt_45' || unit.type === 'usmc_lvtp5a1' || unit.type === 'usmc_aav7a1' || unit.type === 'usmc_lav25';

      if (isNuclearAtacms) {
        this.fireNuclearSSMMissile(unit, targetPos, targetUnit ?? undefined);
        unit.cooldown = unit.reloadTime || 45.0;
        return true;
      } else if (isAtacms) {
        this.fireAtacmsMissile(unit, targetPos, targetUnit ?? undefined);
        unit.cooldown = unit.reloadTime || 32.0;
        return true;
      } else if (isCalliope) {
        this.fireCalliopeMLRSSalvo(unit, targetPos, targetUnit ?? undefined);
        unit.cooldown = unit.reloadTime || 24.0;
        return true;
      } else if (isMlrs) {
        this.fireM270MLRSSalvo(unit, targetPos, targetUnit ?? undefined);
        unit.cooldown = unit.reloadTime || 28.0;
        return true;
      } else if (isAtgm) {
        // 🚀 BGM-71 TOW 反戰車飛彈 (M2 Bradley) 或 M47 龍式反戰車飛彈
        soundEngine.playRocketWhoosh();
        const atgmSpeed = 440;
        const atgmName = unit.type === 'us_m2_bradley' ? 'BGM-71 TOW 重型反戰車飛彈' : 'M47 龍式反戰車飛彈';
        this.projectiles.push({
          id: `atgm-${Date.now()}-${Math.random()}`,
          type: 'missile_arm',
          side: 'player',
          pos: { ...unit.pos },
          vel: {
            x: ((targetPos.x - unit.pos.x) / d) * atgmSpeed,
            y: ((targetPos.y - unit.pos.y) / d) * atgmSpeed,
          },
          originPos: { ...unit.pos },
          targetPos: { ...targetPos },
          flightProgress: 0,
          maxDistance: d,
          distanceTraveled: 0,
          damage: Math.round(unit.damage * 1.35),
          blastRadius: 26,
          speed: atgmSpeed,
          heading: unit.heading,
          isDead: false,
          trail: [],
          attackerName: `${unit.name} 【${atgmName}】`,
          targetEntityId: targetUnit?.id,
          targetEntityType: targetUnit ? 'ground' : 'installation',
          guidanceType: 'laser',
          turnRate: 3.5,
        });

        // M2 Bradley 額外同步發射 25mm 巨蝮鏈砲點射
        if (unit.type === 'us_m2_bradley') {
          for (let b = 0; b < 2; b++) {
            const spread = (Math.random() - 0.5) * 0.05;
            const bAngle = unit.heading + spread;
            const bSpeed = 520;
            this.projectiles.push({
              id: `m2-25mm-${Date.now()}-${b}`,
              type: 'bullet',
              side: 'player',
              pos: { ...unit.pos },
              vel: { x: Math.cos(bAngle) * bSpeed, y: Math.sin(bAngle) * bSpeed },
              originPos: { ...unit.pos },
              targetPos: { ...targetPos },
              flightProgress: 0,
              maxDistance: d,
              distanceTraveled: 0,
              damage: 65,
              blastRadius: 8,
              speed: bSpeed,
              heading: bAngle,
              isDead: false,
              trail: [],
              attackerName: `${unit.name} (25mm M242 鏈砲)`,
            });
          }
        }
      } else if (isArty) {
        this.registerArtillerySignature(unit.pos, unit.side, unit.name, unit.type);
        if (d < 700) {
          // Direct tank-like line-of-sight cannon fire mode! (直瞄平射)
          unit.artilleryMode = 'direct_fire';
          const pSpeed = 580;
          this.projectiles.push({
            id: `arty-direct-${Date.now()}`,
            type: 'shell',
            side: 'player',
            pos: { ...unit.pos },
            vel: {
              x: ((targetPos.x - unit.pos.x) / d) * pSpeed,
              y: ((targetPos.y - unit.pos.y) / d) * pSpeed,
            },
            originPos: { ...unit.pos },
            targetPos: { ...targetPos },
            flightProgress: 0,
            maxDistance: d,
            distanceTraveled: 0,
            damage: Math.round(unit.damage * 1.15),
            blastRadius: 20,
            speed: pSpeed,
            heading: unit.heading,
            isDead: false,
            trail: [],
            attackerName: `${unit.name} 【直瞄平射】`,
          });
        } else {
          // Long-range high-angle parabolic bombardment mode! (長程曲射)
          unit.artilleryMode = 'bombardment';
          const pSpeed = 410;
          this.projectiles.push({
            id: `arty-bombard-${Date.now()}`,
            type: 'shell',
            side: 'player',
            pos: { ...unit.pos },
            vel: {
              x: ((targetPos.x - unit.pos.x) / d) * pSpeed,
              y: ((targetPos.y - unit.pos.y) / d) * pSpeed,
            },
            originPos: { ...unit.pos },
            targetPos: { ...targetPos },
            flightProgress: 0,
            maxDistance: d,
            distanceTraveled: 0,
            damage: unit.damage,
            blastRadius: 42,
            arcAltitude: 1.25,
            speed: pSpeed,
            heading: unit.heading,
            isDead: false,
            trail: [],
            attackerName: `${unit.name} 【長程曲射】`,
          });
        }
      } else if (isShell) {
        const pSpeed = isTank ? 540 : 460;
        this.projectiles.push({
          id: `usmc-shell-${Date.now()}`,
          type: 'shell',
          side: 'player',
          pos: { ...unit.pos },
          vel: {
            x: ((targetPos.x - unit.pos.x) / d) * pSpeed,
            y: ((targetPos.y - unit.pos.y) / d) * pSpeed,
          },
          originPos: { ...unit.pos },
          targetPos: { ...targetPos },
          flightProgress: 0,
          maxDistance: d,
          distanceTraveled: 0,
          damage: unit.damage,
          blastRadius: 22,
          speed: pSpeed,
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
    return false;
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
          const ambushUnitType: GroundUnitType =
            this.era === 'era5'
              ? 'opfor_motor_rifle_83'
              : this.era === 'era4'
              ? 'opfor_vietnam_sapper'
              : this.era === 'era3'
              ? 'opfor_coldwar_infantry'
              : 'opfor_infantry_ambush';
          const ambushUnitName =
            this.era === 'era5'
              ? '蘇聯海軍步兵特種分隊 (Spetsnaz 坑道伏擊)'
              : this.era === 'era4'
              ? '敵軍精銳特工爆破班 (坑道伏擊)'
              : this.era === 'era3'
              ? '遠東志願軍突擊步兵班 (坑道伏擊)'
              : '守備突擊步兵班 (坑道伏擊)';
          for (let a = 0; a < 2; a++) {
            const ambushUnit = createGroundUnit(
              `ambush-${island.id}-${sh.id}-${a}`,
              ambushUnitType,
              ambushUnitName,
              'enemy',
              this.era,
              { x: sh.cpPos.x + (a === 0 ? 60 : -60), y: sh.cpPos.y + (a === 0 ? -40 : 40) }
            );
            ambushUnit.order = { type: 'move', targetPos: friendlyTroopsNearCP[0].pos };
            this.groundUnits.push(ambushUnit);
          }
          const ambushLogText =
            this.era === 'era5'
              ? `🚨【坑道伏擊！】蘇聯近衛摩步班自地下加固掩體猛烈反撲！企圖突襲「${friendlyTroopsNearCP[0].name}」！`
              : this.era === 'era4'
              ? `🚨【特工伏擊！】敵軍精銳特工爆破班自地下暗道猛烈衝出！企圖反撲「${friendlyTroopsNearCP[0].name}」！`
              : this.era === 'era3'
              ? `🚨【坑道伏擊！】志願軍突擊班自反斜面坑道猛烈衝出！企圖反撲「${friendlyTroopsNearCP[0].name}」！`
              : `🚨【坑道伏擊！】日軍步兵躲避轟炸自地下掩體猛烈衝出！企圖反撲「${friendlyTroopsNearCP[0].name}」！`;
          this.addCombatLog({
            category: 'naval',
            sourceSide: 'enemy',
            sourceName: '地下掩體要塞',
            targetName: friendlyTroopsNearCP[0].name,
            actionType: 'recon_spotted',
            text: ambushLogText,
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
      this.scheduleAction(r * 0.08, () => {
        if (!lsmr || lsmr.isSunk) return;
        const spreadX = (Math.random() - 0.5) * 120;
        const spreadY = (Math.random() - 0.5) * 120;
        const rTarget = { x: target.x + spreadX, y: target.y + spreadY };
        const angle = Math.atan2(rTarget.y - lsmr.pos.y, rTarget.x - lsmr.pos.x);
        const d = dist(lsmr.pos, rTarget);

        this.projectiles.push({
          id: `lsm-rocket-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
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
      });
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
  // 時代五反艦、防空與對地現代化導引飛彈發射系統 (Era 5 Precision Missiles)
  // ══════════════════════════════════════════════════════════

  private fireAirLaunchedHarpoon(plane: Aircraft, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.harpoon; // Mach 0.71 sea-skimming
    const range = 4200;

    let targetShipId: string | undefined = undefined;
    if (targetEntity && 'isSunk' in targetEntity && !this.isSubmarine(targetEntity)) {
      targetShipId = targetEntity.id;
    } else {
      const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
      const hostileShips = allShips.filter((s) => !s.isSunk && this.isHostile(plane.side, s.side) && !this.isSubmarine(s));
      const nearest = hostileShips.reduce<{ s: Ship | null; d: number }>(
        (acc, s) => {
          const dst = dist(plane.pos, s.pos);
          return dst < acc.d ? { s, d: dst } : acc;
        },
        { s: null, d: Infinity }
      );
      if (nearest.s && nearest.d < 5000) {
        targetShipId = nearest.s.id;
      }
    }

    // 依據機型決定魚叉齊射枚數 (B-52 現代化戰轟可掛 8~12 枚齊射 6 枚; A-6E / F-111 掛 4 枚齊射 4 枚; F/A-18 / S-3A 雙發齊射)
    const salvoCount = plane.model === 'b52' ? 6 : (plane.model === 'a6e' || plane.model === 'f111') ? 4 : 2;
    const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
    const hostileShips = allShips.filter((s) => !s.isSunk && this.isHostile(plane.side, s.side) && !this.isSubmarine(s));

    for (let i = 0; i < salvoCount; i++) {
      const spreadAngle = (i - (salvoCount - 1) / 2) * 0.08;
      const mHeading = heading + spreadAngle;
      const lateralOffset = (i - (salvoCount - 1) / 2) * 18;
      const launchX = plane.pos.x - Math.sin(heading) * lateralOffset;
      const launchY = plane.pos.y + Math.cos(heading) * lateralOffset;
      
      let tShipId = targetShipId;
      if (hostileShips.length > 0) {
        tShipId = hostileShips[i % hostileShips.length].id;
      }

      this.projectiles.push({
        id: `ashm-harpoon-${Date.now()}-${i}-${Math.random()}`,
        type: 'missile_ashm',
        side: plane.side,
        pos: { x: launchX, y: launchY },
        vel: { x: Math.cos(mHeading) * speed, y: Math.sin(mHeading) * speed },
        originPos: { x: launchX, y: launchY },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: range,
        distanceTraveled: 0,
        damage: 2600, // Heavy armor-piercing blast fragmentation warhead
        blastRadius: 55,
        speed,
        heading: mHeading,
        isDead: false,
        trail: [],
        attackerName,
        targetEntityId: tShipId,
        targetEntityType: 'ship',
        guidanceType: 'active_radar',
        turnRate: 3.5,
        isSeaSkimming: true,
        ashmVariant: 'harpoon_agm84',
        ashmProfile: 'pop_up_dive',
        missileAltitude: 0.22,
        missileHealth: 130,
        maxMissileHealth: 130,
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: '敵水面戰鬥群',
      actionType: 'recon_spotted',
      text: `🚀【AGM-84 魚叉波次狼群齊射！】「${plane.name}」釋放 ${salvoCount} 枚 AGM-84 魚叉反艦飛彈飽和狼群！火箭助推點火掠海超低空突防！`,
    });
  }

  private firePhoenixMissile(plane: Aircraft, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.aim54; // Mach 5
    const range = 5200;

    let targetId: string | undefined = undefined;
    let targetType: 'aircraft' | 'projectile' = 'aircraft';

    // AIM-54 Phoenix prioritizes incoming hostile supersonic AShMs, then hostile bombers/fighters
    const incomingAshm = this.projectiles.find(
      (pr) => !pr.isDead && this.isHostile(plane.side, pr.side) && pr.type === 'missile_ashm' && dist(plane.pos, pr.pos) < 4800
    );
    if (incomingAshm) {
      targetId = incomingAshm.id;
      targetType = 'projectile';
    } else if (targetEntity && targetEntity.id) {
      targetId = targetEntity.id;
    } else {
      const hostilePlanes = this.aircraft.filter((a) => this.isHostile(plane.side, a.side) && a.state !== 'shot_down');
      const nearest = hostilePlanes.reduce<{ p: Aircraft | null; d: number }>(
        (acc, p) => {
          const dst = dist(plane.pos, p.pos);
          return dst < acc.d ? { p, d: dst } : acc;
        },
        { p: null, d: Infinity }
      );
      if (nearest.p) targetId = nearest.p.id;
    }

    this.projectiles.push({
      id: `aam-phoenix-${Date.now()}-${Math.random()}`,
      type: 'missile_aam',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: range,
      distanceTraveled: 0,
      damage: 3400,
      blastRadius: 45,
      speed,
      heading,
      isDead: false,
      trail: [],
      attackerName,
      targetEntityId: targetId,
      targetEntityType: targetType,
      guidanceType: 'active_radar',
      turnRate: 4.5,
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: targetType === 'projectile' ? '來襲超音速反艦飛彈' : '長程敵空中目標',
      actionType: 'recon_spotted',
      text: `🦅【AIM-54 鳳凰超遠程出鞘！】「${plane.name}」AWG-9 雷達鎖定！AIM-54 Phoenix 4.3馬赫極速升空，執行 4800m 跨地平線超視距獵殺！`,
    });
  }

  private fireHARMMissile(plane: Aircraft, targetPos: Vector2D, _targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.harm; // Mach 2.9
    const range = 4600;

    let radarInstId: string | undefined = undefined;
    for (const isl of this.islands) {
      const rInst = isl.installations.find(
        (i) => !i.isDestroyed && this.isHostile(plane.side, i.side) && (i.type === 'fan_song_radar' || i.type === 'radar_station' || i.type === 'sa2_sam_site' || i.isRadarEmitting)
      );
      if (rInst) {
        radarInstId = rInst.id;
        break;
      }
    }

    this.projectiles.push({
      id: `arm-harm-${Date.now()}-${Math.random()}`,
      type: 'missile_arm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: range,
      distanceTraveled: 0,
      damage: 3400,
      blastRadius: 55,
      speed,
      heading,
      isDead: false,
      trail: [],
      attackerName,
      targetEntityId: radarInstId,
      targetEntityType: 'installation',
      guidanceType: 'passive_radar_arm',
      turnRate: 4.8,
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: '敵方相控陣火控雷達',
      actionType: 'recon_spotted',
      text: `⚡【AGM-88 HARM 高速反輻射飛彈發射！】「${plane.name}」探測到敵防空雷達波束輻射！AGM-88 以 3.0 馬赫高速沿雷達主波瓣逆向俯衝斬首！`,
    });
  }

  private fireMaverickMissile(plane: Aircraft, targetPos: Vector2D, _targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.maverick;
    const range = 2600;

    this.projectiles.push({
      id: `mav-${Date.now()}-${Math.random()}`,
      type: 'rocket',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: range,
      distanceTraveled: 0,
      damage: 1850, // Heavy shaped-charge anti-tank penetration
      blastRadius: 36,
      speed,
      heading,
      isDead: false,
      trail: [],
      attackerName,
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: '敵裝甲/暗堡目標',
      actionType: 'rocket_hit',
      text: `🎯【AGM-65 小牛精確導引】「${plane.name}」電視/紅外尋標頭鎖定地面重甲！錐形裝藥破甲飛彈呼嘯撲向目標！`,
    });
  }

  private fireKh22Missile(plane: Aircraft, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (轟炸機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.kh22; // Mach 4.6 dive
    const range = 4600;

    const playerShipsAlive = [...this.playerShips, ...this.alliedShips]
      .filter((s) => !s.isSunk && !this.isSubmarine(s))
      .sort((a, b) => dist(targetPos, a.pos) - dist(targetPos, b.pos));
    let targetShipId: string | undefined = targetEntity?.id || (playerShipsAlive.length > 0 ? playerShipsAlive[0].id : undefined);

    const salvoCount = (plane.model === 'tu22m3' || plane.model === 'tu95') ? 2 : 1;
    for (let i = 0; i < salvoCount; i++) {
      const spreadAngle = (i - (salvoCount - 1) / 2) * 0.06;
      const mHeading = heading + spreadAngle;
      const lateralOffset = (i - (salvoCount - 1) / 2) * 22;
      const launchX = plane.pos.x - Math.sin(heading) * lateralOffset;
      const launchY = plane.pos.y + Math.cos(heading) * lateralOffset;

      let tShipId = targetShipId;
      if (playerShipsAlive.length > 0) {
        tShipId = playerShipsAlive[i % playerShipsAlive.length].id;
      }

      this.projectiles.push({
        id: `kh22-${Date.now()}-${i}-${Math.random()}`,
        type: 'missile_ashm',
        side: plane.side,
        pos: { x: launchX, y: launchY },
        vel: { x: Math.cos(mHeading) * speed, y: Math.sin(mHeading) * speed },
        originPos: { x: launchX, y: launchY },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: range,
        distanceTraveled: 0,
        damage: 5500, // Massive 1000kg RDX warhead
        blastRadius: 85,
        speed,
        heading: mHeading,
        isDead: false,
        trail: [],
        attackerName,
        targetEntityId: tShipId,
        targetEntityType: 'ship',
        guidanceType: 'active_radar',
        turnRate: 3.0,
        ashmVariant: 'kh22_burya',
        ashmProfile: 'high_plunge',
        missileAltitude: 0.90,
        missileHealth: 245,
        maxMissileHealth: 245,
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: '我方特混旗艦',
      actionType: 'recon_spotted',
      text: `⚠️🚀【Kh-22 暴風超音速雙發齊射！】「${plane.name}」於平流層高空向我方特混戰鬥群發射 ${salvoCount} 枚 Mach 4.0 Kh-22 重型超音速高空俯衝反艦飛彈！`,
    });
  }

  private fireGranitMissile(plane: Aircraft, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (戰機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.granit; // Mach 2.5
    const range = 4200;

    let targetShipId: string | undefined = targetEntity?.id;
    const playerShipsAlive = [...this.playerShips, ...this.alliedShips]
      .filter((s) => !s.isSunk && !this.isSubmarine(s))
      .sort((a, b) => dist(targetPos, a.pos) - dist(targetPos, b.pos));
    if (!targetShipId && playerShipsAlive.length > 0) {
      targetShipId = playerShipsAlive[0].id;
    }

    this.projectiles.push({
      id: `p700-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: range,
      distanceTraveled: 0,
      damage: 3400,
      blastRadius: 75,
      speed,
      heading,
      isDead: false,
      trail: [],
      attackerName,
      targetEntityId: targetShipId,
      targetEntityType: 'ship',
      guidanceType: 'active_radar',
      turnRate: 3.5,
      isSeaSkimming: true,
      ashmVariant: 'p700_granit',
      ashmProfile: 'datalink_follower',
      missileAltitude: 0.22,
      missileHealth: 225,
      maxMissileHealth: 225,
    });
  }

  private fireHellfireMissile(plane: Aircraft, targetPos: Vector2D, _targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    const attackerName = `${plane.name} (武裝直升機 #${plane.id.slice(-4)})`;
    const heading = plane.heading;
    const speed = MISSILE_SPEED.hellfire;
    const range = 2200;

    this.projectiles.push({
      id: `hellfire-${Date.now()}-${Math.random()}`,
      type: 'rocket',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: range,
      distanceTraveled: 0,
      damage: 1650,
      blastRadius: 32,
      speed,
      heading,
      isDead: false,
      trail: [],
      attackerName,
    });

    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: attackerName,
      targetName: '敵地面裝甲部隊',
      actionType: 'rocket_hit',
      text: `🎯【AGM-114 地獄火導向打擊】「${plane.name}」半主動雷射精準導引，穿甲彈頭摧毀敵前線重裝甲！`,
    });
  }

  public launchAirbaseSortie(
    model: AircraftModel,
    count: number = 2,
    payload?: AircraftPayloadType,
    targetPos?: Vector2D,
    airfieldId: string = this.hqAirfieldId
  ) {
    const airfield = this.findFriendlyAirfield(airfieldId);
    if (!airfield) return;
    const pool = this.getAirfieldPool(airfieldId);
    const available = pool[model] || 0;
    if (available < count) return;
    pool[model] -= count;

    const baseCenter = airfield.pos;
    const heading = -Math.PI / 4;
    soundEngine.playPlaneSortie();

    const role: AircraftRole = getCatalogRole(model, 'airbase', this.era);

    const rawSpeed = getAircraftBaseSpeed(model);

    const baseHealth = getAircraftBaseHealth(model);

    const pType = resolvePayload(model, payload, this.era);

    // ══════════════════════════════════════════════════════════
    // 時代三與時代四戰術/戰略核武器政治後果與授權檢定 (Nuclear Weapons CP Costs)
    // ══════════════════════════════════════════════════════════
    if (pType === 'b52_megaton_nuke') {
      const nukeCost = 900;
      if (this.resourcePoints < nukeCost) {
        pool[model] += count;
        this.addBannerAlert(`❌【戰略授權不足】動用 B28/B41 百萬噸級戰略熱核武器需耗費 ${nukeCost} CP！目前 CP 不足！`, 'player', 'sunk', 5.5);
        this.addCombatLog({
          category: 'air',
          sourceSide: 'player',
          sourceName: '戰略空軍司令部 (SAC)',
          targetName: 'B-52 戰略打擊機隊',
          actionType: 'recon_spotted',
          text: `❌【戰略核授權駁回】動用百萬噸級戰略熱核武器需耗費 ${nukeCost} CP！目前指揮點數不足 (${Math.floor(this.resourcePoints)} / ${nukeCost} CP)！`,
        });
        return;
      }
      this.resourcePoints -= nukeCost;
      this.totalCpSpent += nukeCost;
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert(`☢️【國家最高指揮授權核准】B-52 戰略轟炸機裝載百萬噸級熱核武器升空！消耗 ${nukeCost} CP！`, 'player', 'sunk', 7.5);
      this.checkOpforNuclearRetaliation();
    } else if (pType === 'tactical_b61_nuke') {
      if (this.resourcePoints < 4000) {
        pool[model] += count;
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
        pool[model] += count;
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
      model === 'f14a' ? '雄貓超音速重型艦載攔截機 (不死鳥/麻雀)' :
      model === 'fa18a' ? '大黃蜂多用途艦載戰鬥攻擊機' :
      model === 'f15a' ? '鷹式超音速制空戰鬥機' :
      model === 'f16a' ? '戰隼全天候戰術戰鬥機' :
      model === 'a10a' ? '雷霆二式裝甲獵殺密接攻擊機 (30mm/小牛)' :
      model === 'a6e' ? '入侵者全天候重型打擊機' :
      model === 'ea6b' ? '徘徊者雷達電子干擾與反輻射壓制機' :
      model === 's3a' ? '維京人噴射艦載反潛機' :
      model === 'f111' ? '土豚超音速低空突防攻擊機' :
      model === 'e3a' ? '哨兵空中預警管制機 (AWACS)' :
      model === 'e2c' ? '鷹眼艦載預警管制機' :
      model === 'av8b' ? '海獵鷹垂直起降攻擊機' :
      model === 'ah64a' ? '阿帕契重裝攻擊直升機 (地獄火飛彈)' :
      model === 'ah1w' ? '超級眼鏡蛇武裝攻擊直升機' :
      model === 'ch53' ? '海種馬重型空中突擊運輸直升機' :
      model === 'sh3f' ? '海王艦載重型反潛直升機' :
      model === 'c130' ? '大力神戰術空中投送運輸機' :
      role === 'level_bomber' ? (model === 'b52' ? '同溫層堡壘巨型戰略轟炸機 (36枚地毯轟炸)' : model === 'b29' ? '超級堡壘戰略轟炸機 (萬米平流層防空免疫)' : '四發重型水平轟炸機') :
      model === 'f105' ? '野鼬/超音速戰鬥轟炸機 (ARM 反輻射打擊)' :
      model === 'ah1' ? '眼鏡蛇重武裝攻擊直升機' :
      model === 'uh1' ? '休伊突擊運輸直升機 (垂直包圍作戰)' :
      model === 'ov10' ? '野馬前進空中管制機 (FAC / FFAR 火箭)' :
      model === 'c47' ? 'C-47 空中列車戰術傘兵運輸機' :
      model === 'c1' ? '貿易者艦載傘兵空投機' :
      role === 'attacker' ? '重型突擊攻擊機' :
      role === 'fighter' ? '主力超音速戰鬥機' :
      role === 'dive_bomber' ? '俯衝轟炸機' :
      role === 'transport' ? '空中突擊運輸機' : '巡邏反潛機';

    const flightName = `AFB 出擊機隊 (${count}x ${model.toUpperCase()} ${roleZh})`;

    const gunRounds = getAircraftGunRounds(model);

    const afbHasPayload = carriesStores(pType);
    const afbInitialAmmo = getPayloadRounds(model, pType, this.era, gunRounds);

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
        hasPayload: afbHasPayload,
        payloadType: pType,
        payloadName: PAYLOAD_CATALOG[pType]?.badge || 'Standard',
        ammoRemaining: afbInitialAmmo,
        maxAmmo: afbInitialAmmo,
        shootCooldown: 0,
        gunAmmo: gunRounds,
        maxGunAmmo: gunRounds,
        wingmanOffset: { x: (i - (count - 1) / 2) * 28, y: i * 20 },
        homeBaseId: airfieldId,
        ...((): { sonobuoyAmmo?: number; maxSonobuoyAmmo?: number; sonobuoyModel?: string } => {
          const spec = this.getSonobuoySpec(model);
          return spec
            ? { sonobuoyAmmo: spec.count, maxSonobuoyAmmo: spec.count, sonobuoyModel: spec.label }
            : {};
        })(),
      });
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '前進航空基地 (AFB)',
      targetName: '戰區空域',
      actionType: 'recon_spotted',
      text: `✈️【基地機隊緊急出擊！】${airfield.name} 出動 ${count} 架 ${model.toUpperCase()} (${roleZh}) 直飛戰區！掛載: ${PAYLOAD_CATALOG[pType]?.name || pType}`,
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
    const newAirfield: Installation = makeInstallation({
      id: newAirfieldId,
      type: 'airfield',
      name: `前進野戰航空基地 (${onIsland.name})`,
      weaponDesc: '工兵群緊急拓闢之野戰前進機場 · 跑道長度1800米 · 支援全天候出擊',
      pos: { ...eng.pos },
      angle: -Math.PI / 4,
      health: 3000,
      range: 4000,
      reloadTime: 15,
      side: 'player',
    });
    onIsland.installations.push(newAirfield);

    // Build companion AA Flak battery to protect airfield
    const newFlak: Installation = makeInstallation({
      id: `flak-${onIsland.id}-${Date.now()}`,
      type: 'flak_battery',
      name: '野戰防空砲兵連 (90mm M2 / 40mm Bofors)',
      weaponDesc: '工兵防空陣地 · 保護前進野戰跑道不受空襲',
      pos: { x: eng.pos.x + 85, y: eng.pos.y + 40 },
      health: 1200,
      armor: 0.35,
      range: 1100,
      cooldown: 0.5,
      reloadTime: 1.6,
      side: 'player',
      isASuWOnly: false,
    });
    onIsland.installations.push(newFlak);
    this.applyHistoricalInstallationRanges();

    // The new airfield keeps its own stock, starting with a forward detachment; further
    // aircraft reach it by ferry flights from the HQ airfield or a carrier
    this.airfieldPlanes[newAirfieldId] =
      this.era === 'era1'
        ? { b17: 3, p40: 4, a20: 3 }
        : this.era === 'era2'
        ? { b24: 3, p51: 4, p47: 3 }
        : { b29: 3, f86: 4, a26: 3 };

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

  /** Moves every armed installation onto the shared historical range scale (rangeScale.ts). */
  private applyHistoricalInstallationRanges() {
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        const r = getInstallationRange(inst.type, inst.name, this.era);
        if (r !== null) inst.range = r;
      }
    }
  }

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
          targetName: item.name,
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
      return this.purchaseShipRequisition(item, customPos, freeSandbox);
    } else if (item.category === 'aircraft') {
      return this.purchaseAircraftRequisition(item, freeSandbox, flagship);
    } else if (item.category === 'ground') {
      // Garrisons placed by the player join the shared historical range scale
      const ok = this.purchaseGroundRequisition(item, targetIslandId, customPos, fleetPos);
      this.applyHistoricalInstallationRanges();
      return ok;
    } else if (item.category === 'installations') {
      // Garrisons placed by the player join the shared historical range scale
      const ok = this.purchaseInstallationRequisition(item, targetIslandId, customPos, freeSandbox);
      this.applyHistoricalInstallationRanges();
      return ok;
    }

    return false;
  }

  private purchaseInstallationRequisition(item: RequisitionItem, targetIslandId: string | undefined, customPos: Vector2D | undefined, freeSandbox: boolean): boolean {
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
      const rFactor = item.typeTag === 'coastal_gun' || item.typeTag === 'm1_240mm' ? 0.85 : 0.45;
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
    } else if (item.typeTag === 'm1_240mm') {
      const heavyRange =
        this.era === 'era5' ? 3800 : this.era === 'era4' ? 3600 : this.era === 'era3' ? 3400 : this.era === 'era2' ? 3200 : 2800;
      const heavyDamage =
        this.era === 'era5' ? 1050 : this.era === 'era4' ? 920 : this.era === 'era3' ? 850 : this.era === 'era2' ? 780 : 640;
      targetIsland.installations.push(makeInstallation({
        id: `${instId}-240`,
        type: 'coastal_gun',
        name:
          this.era === 'era1'
            ? 'M1918 240mm 固定式重型榴彈砲台'
            : this.era === 'era5'
            ? 'M1 240mm「黑龍」強化要塞重砲台 (RAP)'
            : 'M1 240mm「黑龍」固定式重型榴彈砲台',
        weaponDesc:
          '固定式混凝土八角砲座 M1 240mm「黑龍」· 遠程砲擊封鎖海峽水道，轟擊敵艦、地面部隊與鄰島要塞',
        side: 'player',
        pos: instPos,
        health: 2600,
        armor: 0.55,
        damage: heavyDamage,
        blastRadius: 52,
        angle: instAngle,
        range: heavyRange,
        reloadTime: 6.2,
      }));
    } else if (item.typeTag === 'coastal_gun') {
      const coastalRange = this.era === 'era3' ? 2200 : this.era === 'era2' ? 1900 : 1650;
      const coastalDmg = this.era === 'era3' ? 520 : this.era === 'era2' ? 420 : 340;
      targetIsland.installations.push({
        id: instId,
        type: 'coastal_gun',
        name: this.era === 'era3' ? '152mm 雙聯長管岸防砲台' : this.era === 'era2' ? '203mm 雙聯岸防重砲台' : '140mm 海岸加農砲台',
        side: 'player',
        pos: instPos,
        health: 1800,
        maxHealth: 1800,
        armor: 0.45,
        damage: coastalDmg,
        blastRadius: 36,
        angle: instAngle,
        range: coastalRange,
        reloadTime: 4.0,
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
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'pontoon_pier',
        name: `浮式人工棧橋港碼頭 (${targetIsland.name})`,
        weaponDesc: '工兵快速架設急造棧橋港 · 打通全島陸軍補給線 · 工兵駐守35秒自動升級正規深水軍港',
        side: 'player',
        pos: instPos,
        health: 2200,
        armor: 0.35,
        angle: instAngle,
        range: 550,
        reloadTime: 1.0,
        upgradeTimer: 0,
      }));
    } else if (item.typeTag === 'major_naval_port') {
      // 正規深水軍港
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'major_naval_port',
        name: `正規深水軍港突堤 (${targetIsland.name})`,
        weaponDesc: '大型深水突堤起重港埠 · 穩定建立全島補給線 · 產出補給點 (+1.5 CP/s)',
        side: 'player',
        pos: instPos,
        health: 4200,
        armor: 0.5,
        angle: instAngle,
        range: 850,
        reloadTime: 1.0,
      }));
    } else if (item.typeTag === 'supply_depot') {
      // 戰地輜重補給樞紐
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'supply_depot',
        name: '戰地輜重補給樞紐',
        weaponDesc: '地下彈藥儲備與重裝備修造處 · 大幅加快全島地面部隊建制度修整 (+2.0%/s)',
        side: 'player',
        pos: instPos,
        health: 2000,
        armor: 0.4,
        angle: instAngle,
      }));
    } else if (item.typeTag === 'field_hospital') {
      // 戰地野戰醫院
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'field_hospital',
        name: '戰地野戰醫院',
        weaponDesc: '救護整編中心 · 救治前線負傷官兵快速歸隊 · 穩定部隊組織度 (+2.5%/s)',
        side: 'player',
        pos: instPos,
        health: 1600,
        armor: 0.3,
        angle: instAngle,
      }));
    } else if (item.typeTag === 'airfield') {
      // 前進野戰機場 (own, initially empty aircraft stock; fill it by ferry flights)
      this.airfieldPlanes[instId] = {};
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'airfield',
        name: `前進野戰機場跑道 (${targetIsland.name})`,
        weaponDesc: 'PSP鋼板珊瑚礁平整跑道 · 前線戰鬥機與重轟炸機起降補給點',
        side: 'player',
        pos: instPos,
        health: 3500,
        armor: 0.4,
        angle: instAngle,
      }));
      targetIsland.isFriendlyBase = true;
    } else if (item.typeTag === 'command_post') {
      // 堅固防衛坑道指揮所
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'command_post',
        name: `地下坑道指揮所 (${targetIsland.name})`,
        weaponDesc: '深層防空花崗岩掩體 · 守備組織度抵抗 +50% · 擴展雷達視野 1000m',
        side: 'player',
        pos: instPos,
        health: 3600,
        armor: 0.55,
        angle: instAngle,
        range: 1000,
        reloadTime: 2.0,
      }));
    } else if (item.typeTag === 'ammo_depot') {
      // 重型戰備油彈庫
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'ammo_depot',
        name: `重型戰備油彈庫 (${targetIsland.name})`,
        weaponDesc: '儲備巨型航空航彈與火箭 · 重砲裝填加速 35% · 砲擊冷卻縮短',
        side: 'player',
        pos: instPos,
        health: 2600,
        armor: 0.45,
        angle: instAngle,
      }));
    } else if (item.typeTag === 'battalion_cp') {
      // 營級前進作戰指揮所 (Battalion CP)
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'battalion_cp',
        name: `營前進作戰指揮所 (${targetIsland.name})`,
        weaponDesc: '營級前進戰術指揮所 · 專屬解鎖地面部隊呼叫支援 · 新增援陸軍單位在此就地集結出生',
        side: 'player',
        pos: instPos,
        health: 3800,
        armor: 0.50,
        angle: instAngle,
        range: 1200,
        reloadTime: 1.0,
      }));
    } else if (item.typeTag === 'sam_patriot') {
      // MIM-104 愛國者長程防空/反飛彈營
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'flak_battery',
        name: `MIM-104 愛國者長程防空飛彈營 (${targetIsland.name})`,
        weaponDesc: 'AN/MPQ-53 相位陣列雷達導引 · 射程 2600m · 高空反戰機與掠海反艦/彈道飛彈截擊',
        side: 'player',
        pos: instPos,
        health: 2600,
        armor: 0.55,
        angle: instAngle,
        range: 2600,
        reloadTime: 1.8,
      }));
    } else if (item.typeTag === 'sam_hawk') {
      // MIM-23 霍克防空飛彈陣地
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'flak_battery',
        name: `MIM-23 霍克防空飛彈連 (${targetIsland.name})`,
        weaponDesc: '半主動雷達導引防空飛彈 · 射程 1800m · 攔截高空高速噴射機與巡航飛彈',
        side: 'player',
        pos: instPos,
        health: 1800,
        armor: 0.45,
        angle: instAngle,
        range: 1800,
        reloadTime: 2.2,
      }));
    } else if (item.typeTag === 'fob') {
      // 前進作戰基地 (FOB)
      targetIsland.installations.push(makeInstallation({
        id: instId,
        type: 'command_post',
        name: `前進作戰基地 FOB (${targetIsland.name})`,
        weaponDesc: '直升機停機坪與全天候作戰指揮中心 · 支援垂直包圍部隊登陸集結 · 擴展雷達視野 1600m',
        side: 'player',
        pos: instPos,
        health: 4500,
        armor: 0.60,
        angle: instAngle,
        range: 1600,
        reloadTime: 1.0,
      }));
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
    this.addBannerAlert(`🏗️【碼頭/設施落成】已在 ${locationLabel} 構築「${item.name}」！`, 'player', 'capture', 4.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: '海軍工兵團 (Seabees)',
      targetName: item.name,
      actionType: 'recon_spotted',
      text: `🏗️【設施工事落成】${freeSandbox ? '【免CP沙盒建造】' : `耗費 ${item.cost} CP`}！「${item.name}」已在 ${targetIsland.name} (${locationLabel}) 構築完成並即刻投入戰備！`,
    });
    return true;
    return false;
  }

  private purchaseGroundRequisition(item: RequisitionItem, targetIslandId: string | undefined, customPos: Vector2D | undefined, fleetPos: Vector2D): boolean {
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
    } else if (item.typeTag === 'army_rifle_65') {
      gUnit = createGroundUnit(gId, 'us_army_rifle_platoon_65', '美軍 1965 年型前線常規步槍排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm113_mech') {
      gUnit = createGroundUnit(gId, 'us_army_m113_mech', 'M113 裝甲運兵機械化步兵排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'chaparral_sam') {
      gUnit = createGroundUnit(gId, 'us_army_chaparral_sam', 'MIM-72 榭樹野戰履帶防空飛彈排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'air_assault') {
      gUnit = createGroundUnit(gId, 'usmc_air_assault_65', 'USMC 空中突擊/直升機機降突擊排 (1965)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'armor_m48') {
      gUnit = createGroundUnit(gId, 'usmc_armor_m48', 'USMC M48A3 巴頓主力戰車排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm551_sheridan') {
      gUnit = createGroundUnit(gId, 'us_m551_sheridan', 'US Army M551 謝里登裝甲騎兵排', 'player', this.era, spawnPos);
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
    } else if (item.typeTag === 'usmc_lvtp5a1') {
      gUnit = createGroundUnit(gId, 'usmc_lvtp5a1', 'USMC LVTP-5A1 兩棲重裝登陸裝甲車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'army_rifle_83') {
      gUnit = createGroundUnit(gId, 'us_army_rifle_83', '美陸軍步槍班 (1983)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'usmc_rifle_83') {
      gUnit = createGroundUnit(gId, 'usmc_rifle_83', '陸戰步槍班 (1983)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'dragon_atgm') {
      gUnit = createGroundUnit(gId, 'us_dragon_atgm', 'M47 巨龍反戰車飛彈班', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'usmc_aav7a1') {
      gUnit = createGroundUnit(gId, 'usmc_aav7a1', 'AAV-7A1 兩棲突擊載具', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'usmc_lav25') {
      gUnit = createGroundUnit(gId, 'usmc_lav25', 'LAV-25 輪型裝甲偵搜車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm60a1_rise') {
      gUnit = createGroundUnit(gId, 'us_m60a1_rise', 'M60A1 RISE (PASSIVE) ERA 戰車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm1ip_abrams') {
      gUnit = createGroundUnit(gId, 'us_m1ip_abrams', 'M1IP 艾布蘭主戰戰車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm198_155') {
      gUnit = createGroundUnit(gId, 'us_m198_155', 'M198 155mm 牽引榴彈砲排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'lav_ad') {
      gUnit = createGroundUnit(gId, 'usmc_lav_ad', 'LAV-AD 25mm防空裝甲車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm163_vads') {
      gUnit = createGroundUnit(gId, 'us_m163_vads', 'M163 火神 20mm 防空裝甲車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'm2_bradley') {
      gUnit = createGroundUnit(gId, 'us_m2_bradley', 'M2 布雷德利裝甲機步戰車 (TOW-2飛彈+25mm鏈砲)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m270_mlrs') {
      gUnit = createGroundUnit(gId, 'us_m270_mlrs', 'M270 MLRS 多管火箭系統 (12x M39鋼鐵之雨)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m270_atacms') {
      gUnit = createGroundUnit(gId, 'us_m270_atacms', 'MGM-140 ATACMS 戰術飛彈車 (M57碉堡剋星)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m4_calliope') {
      gUnit = createGroundUnit(gId, 'us_m4_calliope', 'M4A3 薛曼「管風琴」60聯裝火箭車', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m7_priest') {
      gUnit = createGroundUnit(gId, 'us_m7_priest', 'M7 牧師 105mm 自走榴彈砲 (反砲兵急速射擊)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m26_pershing') {
      gUnit = createGroundUnit(gId, 'us_m26_pershing', 'US Army M26 潘興重戰車排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m1a1_abrams') {
      gUnit = createGroundUnit(gId, 'us_m1a1_abrams', 'M1A1 艾布蘭主力戰車排', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m44_spg') {
      gUnit = createGroundUnit(gId, 'us_m44_spg', 'M44 155mm 自走榴彈砲 (反砲兵急速射擊)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m109_spg') {
      gUnit = createGroundUnit(gId, 'us_m109_spg', 'M109 155mm 自走榴彈砲 (長程反砲兵壓制)', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_m109a6_paladin') {
      gUnit = createGroundUnit(gId, 'us_m109a6_paladin', 'M109A6 帕拉丁 155mm 數位自走砲', 'player', this.era, spawnPos);
    } else if (item.typeTag === 'us_atacms_nuclear') {
      gUnit = createGroundUnit(gId, 'us_atacms_nuclear', 'MGM-140B 核武裝 ATACMS 戰術飛彈車 (W70/W85熱核彈頭)', 'player', this.era, spawnPos);
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
    return false;
  }

  private purchaseAircraftRequisition(item: RequisitionItem, freeSandbox: boolean, flagship: Ship | undefined): boolean {
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
    } else if (item.typeTag === 'air_c47') {
      this.airbasePlanes.c47 = (this.airbasePlanes.c47 || 0) + 2;
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
    } else if (item.typeTag === 'air_sh2') {
      this.airbasePlanes['sh2'] = (this.airbasePlanes['sh2'] || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.sh2 = (flagship.carrierPlanes.ready.sh2 || 0) + 2;
      }
    } else if (item.typeTag === 'air_p3') {
      this.airbasePlanes['p3'] = (this.airbasePlanes['p3'] || 0) + 2;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.p3 = (flagship.carrierPlanes.ready.p3 || 0) + 1;
      }
    } else if (item.typeTag === 'air_f14a') {
      this.airbasePlanes.f14a = (this.airbasePlanes.f14a || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.f14a = (flagship.carrierPlanes.ready.f14a || 0) + 2;
      }
    } else if (item.typeTag === 'air_fa18a') {
      this.airbasePlanes.fa18a = (this.airbasePlanes.fa18a || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.fa18a = (flagship.carrierPlanes.ready.fa18a || 0) + 2;
      }
    } else if (item.typeTag === 'air_s3a') {
      this.airbasePlanes.s3a = (this.airbasePlanes.s3a || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.s3a = (flagship.carrierPlanes.ready.s3a || 0) + 2;
      }
    } else if (item.typeTag === 'air_a6e') {
      this.airbasePlanes.a6e = (this.airbasePlanes.a6e || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.a6e = (flagship.carrierPlanes.ready.a6e || 0) + 2;
      }
    } else if (item.typeTag === 'air_e2c') {
      this.airbasePlanes.e2c = (this.airbasePlanes.e2c || 0) + 2;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.e2c = (flagship.carrierPlanes.ready.e2c || 0) + 1;
      }
    } else if (item.typeTag === 'air_ea6b') {
      this.airbasePlanes.ea6b = (this.airbasePlanes.ea6b || 0) + 2;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.ea6b = (flagship.carrierPlanes.ready.ea6b || 0) + 1;
      }
    } else if (item.typeTag === 'air_c2a') {
      this.airbasePlanes.c2a = (this.airbasePlanes.c2a || 0) + 2;
    } else if (item.typeTag === 'air_sh3f') {
      this.airbasePlanes.sh3f = (this.airbasePlanes.sh3f || 0) + 4;
      if (flagship && flagship.carrierPlanes) {
        flagship.carrierPlanes.ready.sh3f = (flagship.carrierPlanes.ready.sh3f || 0) + 2;
      }
    } else if (item.typeTag === 'air_av8b') {
      this.airbasePlanes.av8b = (this.airbasePlanes.av8b || 0) + 4;
    } else if (item.typeTag === 'air_ch53') {
      this.airbasePlanes.ch53 = (this.airbasePlanes.ch53 || 0) + 4;
    } else if (item.typeTag === 'air_a10a') {
      this.airbasePlanes.a10a = (this.airbasePlanes.a10a || 0) + 4;
    } else if (item.typeTag === 'air_ah64a') {
      this.airbasePlanes.ah64a = (this.airbasePlanes.ah64a || 0) + 4;
    } else if (item.typeTag === 'air_ah1w') {
      this.airbasePlanes.ah1w = (this.airbasePlanes.ah1w || 0) + 4;
    } else if (item.typeTag === 'air_f15a') {
      this.airbasePlanes.f15a = (this.airbasePlanes.f15a || 0) + 4;
    } else if (item.typeTag === 'air_f16a') {
      this.airbasePlanes.f16a = (this.airbasePlanes.f16a || 0) + 4;
    } else if (item.typeTag === 'air_e3a') {
      this.airbasePlanes.e3a = (this.airbasePlanes.e3a || 0) + 1;
    } else if (item.typeTag === 'air_f111') {
      this.airbasePlanes.f111 = (this.airbasePlanes.f111 || 0) + 4;
    } else if (item.typeTag === 'air_c130') {
      this.airbasePlanes.c130 = (this.airbasePlanes.c130 || 0) + 2;
    }

    this.addBannerAlert(`✈️【機隊補充】「${item.name}」已進駐起始前進基地航空庫存！`, 'player', 'capture', 5.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: '海軍航空兵部 (BuAer)',
      targetName: item.name,
      actionType: 'recon_spotted',
      text: `✈️【航空戰力充實】${freeSandbox ? '【免CP沙盒配置】' : `耗費 ${item.cost} CP`}！${item.name} 戰機群已進駐起始前進基地機庫，可隨時自基地起飛或轉場！`,
    });
    return true;
    return false;
  }

  private purchaseShipRequisition(item: RequisitionItem, customPos: Vector2D | undefined, freeSandbox: boolean): boolean {
    soundEngine.playPlaneSortie();
    let newShip: Ship | null = null;
    const shipId = `player-req-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    // 海軍艦艇單位固定自地圖西南邊緣海疆增援航向戰區
    const mapBound = this.worldSize || 14000;
    const edgeSpawnX = 800 + Math.random() * 1400;
    const edgeSpawnY = mapBound - 350 - Math.random() * 400;
    const warshipSpawnPos: Vector2D = { x: edgeSpawnX, y: edgeSpawnY };

    if (item.typeTag === 'ohio_ssbn' || item.id === 'req-support-ohio-ssbn') {
      const targetPos = customPos || (this.enemyShips.find(s => !s.isSunk)?.pos) || { x: 9500, y: 4500 };
      this.fireOhioSSBNTridentStrike(targetPos);
      return true;
    } else if (item.typeTag === 'bb' || item.typeTag === 'bb_missouri') {
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
      newShip = (this.era === 'era4' || this.era === 'era5')
        ? createNewportLST(shipId, this.era === 'era5' ? 'USS Newport (LST-1179 紐波特戰車登陸艦 現代化改型)' : 'USS Newport (LST-1179 紐波特級戰車登陸艦)', warshipSpawnPos, this.era)
        : createLST(shipId, 'USS LST-491 戰車登陸艦', warshipSpawnPos, this.era);
    } else if (item.typeTag === 'lcvp') {
      newShip = this.era === 'era5'
        ? createLCAC(shipId, 'LCAC-01 氣墊登陸艇', warshipSpawnPos)
        : this.era === 'era4'
        ? createLCM8(shipId, 'LCM-8 機械化登陸艇', warshipSpawnPos)
        : createLCVP(shipId, 'LCVP 突擊登陸艇', warshipSpawnPos, this.era);
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
    } else if (item.typeTag === 'cvn') {
      newShip = createCVNNimitz(shipId, 'USS Nimitz (CVN-68 超級核動力航空母艦)', warshipSpawnPos);
    } else if (item.typeTag === 'cg_tico') {
      newShip = createTiconderogaCG(shipId, 'USS Ticonderoga (CG-47 神盾巡洋艦)', warshipSpawnPos);
    } else if (item.typeTag === 'cg_virginia') {
      newShip = createVirginiaCGN(shipId, 'USS Virginia (CGN-38 核動力巡洋艦)', warshipSpawnPos);
    } else if (item.typeTag === 'bb_iowa_mod') {
      newShip = createIowaModernizedBB(shipId, 'USS Iowa (BB-61 近代化改裝主力戰艦)', warshipSpawnPos);
    } else if (item.typeTag === 'dd_spruance') {
      newShip = createSpruanceDD(shipId, 'USS Spruance (DD-963 反潛驅逐艦)', warshipSpawnPos);
    } else if (item.typeTag === 'ddg_kidd') {
      newShip = createKiddDDG(shipId, 'USS Kidd (DDG-993 飛彈驅逐艦)', warshipSpawnPos);
    } else if (item.typeTag === 'ffg_ohp') {
      newShip = createPerryFFG(shipId, 'USS Oliver Hazard Perry (FFG-7 巡防艦)', warshipSpawnPos);
    } else if (item.typeTag === 'ssn_la') {
      newShip = createLosAngelesSSN(shipId, 'USS Los Angeles (SSN-688 攻擊核潛艦)', warshipSpawnPos);
    } else if (item.typeTag === 'lpd') {
      newShip = createAustinLPD(shipId, 'USS Austin (LPD-4 兩棲船塢運輸艦)', warshipSpawnPos);
    } else if (item.typeTag === 'lcac') {
      newShip = createLCAC(shipId, 'LCAC-01 氣墊登陸艇', warshipSpawnPos);
    }

    if (newShip) {
      newShip.heading = -Math.PI / 4; // 朝向東北戰區航進
      this.playerShips.push(newShip);
      this.applyUpgradesToShip(newShip);
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

  private updateEra3Mechanics(_dt: number) {
    // 1. AD-3W 全域空中預警系統 (AEW Early Warning 6500m & GCI)
    const activeAEW = this.aircraft.find(
      (a) => a.side === 'player' && (a.model === 'ad3w' || a.role === 'aew') && a.state !== 'shot_down' && a.state !== 'landing'
    );

    this.hasAD3WOnStation = !!activeAEW;

    if (activeAEW) {
      // 擴大破霧鎖定半徑 (6,500m) - 僅偵測水面艦艇，水下潛艦需由反潛機艦偵獲
      const aewRange = 6500;
      for (const eShip of this.enemyShips) {
        if (!eShip.isSunk && !this.isSubmarine(eShip) && dist(activeAEW.pos, eShip.pos) < aewRange) {
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

    // 1. E-1 Tracer 全域長程空中預警系統 (AEW 7500m & 破霧鎖定 - 水下潛艦豁免於水面雷達)
    const activeE1 = this.aircraft.find(
      (a) => a.side === 'player' && (a.model === 'e1' || a.role === 'aew') && a.state !== 'shot_down' && a.state !== 'landing'
    );
    if (activeE1) {
      const aewRange = 7500;
      for (const eShip of this.enemyShips) {
        if (!eShip.isSunk && !this.isSubmarine(eShip) && dist(activeE1.pos, eShip.pos) < aewRange) {
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

      if ((ship.samCooldown || 0) <= 0 && (ship.readySAMs ?? 1) > 0) {
        const samRange = ship.samRange || 1800;

        // A. 艦載長程防空飛彈史實限制：早期連續波照明與海面雜波反射，難以追蹤掠海反艦飛彈，專職攔截中高空敵機
        const hostileAircraft = this.aircraft.filter(
          (a) =>
            a.side === 'enemy' &&
            a.state !== 'shot_down' &&
            dist(ship.pos, a.pos) <= samRange
        );

        if (hostileAircraft.length > 0) {
          this.launchShipSamSalvo(ship, hostileAircraft, (a) => this.fireSAM(ship, a, 'aircraft'), (a) => a.state !== 'shot_down');
        }
      }

      this.fireShipboardChaff(dt, ship);

      // 3b. 艦載 ASROC 反潛火箭助推魚雷發射系統 (Automatic Sonar Launch with Manual Target Override)
      if (ship.hasASROC) {
        if (ship.asrocCooldown !== undefined && ship.asrocCooldown > 0) {
          ship.asrocCooldown = Math.max(0, ship.asrocCooldown - dt);
        }

        if ((ship.asrocCooldown || 0) <= 0 && (ship.readyASROC ?? 8) > 0) {
          const asrocRange = (ship.asrocRange || 2400) * STANDOFF_ASW[ship.standoffAswWeapon ?? 'ASROC'].rangeFactor;
          const targetSub = this.enemyShips.find(
            (s) => !s.isSunk && this.isSubmarine(s) && s.isSpotted && dist(ship.pos, s.pos) <= asrocRange
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
            (s) => !s.isSunk && this.isSubmarine(s) && s.isSpotted && dist(ship.pos, s.pos) <= 1000
          );
          if (targetSubClose) {
            this.fireSVTT(ship, targetSubClose.pos);
            ship.svttCooldown = 28.0;
          }
        }
      }

      // 3d. 時代五 艦載 RGM-84 魚叉 (Harpoon) 掠海反艦飛彈系統 (發射箱艦艇 8 枚齊射 · OHP 單臂 Mk 13 單發)
      if (ship.hasHarpoon) {
        if (ship.harpoonCooldown !== undefined && ship.harpoonCooldown > 0) {
          ship.harpoonCooldown = Math.max(0, ship.harpoonCooldown - dt);
        }
        if ((ship.harpoonCooldown || 0) <= 0 && (ship.readyHarpoons ?? 8) > 0) {
          const harpoonRange = ship.harpoonRange || 4500;
          const inRangeWarships = this.enemyShips
            .filter((s) => !s.isSunk && !this.isSubmarine(s) && dist(ship.pos, s.pos) <= harpoonRange)
            .sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
          if (inRangeWarships.length > 0) {
            this.firePlayerSurfaceAshmSalvo(ship, inRangeWarships);
          }
        }
      }
    }

    // 3e. 時代五 蘇聯/OPFOR 巡洋艦與核潛艦飽和反艦飛彈齊射 (依艦種分級：現代級 8 枚、基輔級 12 枚、基洛夫/奧斯卡 16 枚)
    for (const eShip of this.enemyShips) {
      if (eShip.isSunk) continue;
      if (eShip.type === 'cgn_kirov' || eShip.type === 'ssgn_oscar' || eShip.type === 'dd_sovremenny' || eShip.type === 'cvhg_kiev' || eShip.type === 'cg_slava') {
        if (eShip.torpedoCooldown !== undefined && eShip.torpedoCooldown > 0) {
          eShip.torpedoCooldown = Math.max(0, eShip.torpedoCooldown - dt);
        }
        if ((eShip.torpedoCooldown || 0) <= 0) {
          const surfaceFriendlies = [...this.playerShips, ...this.alliedShips].filter(
            (s) => !s.isSunk && !this.isSubmarine(s) && dist(eShip.pos, s.pos) <= 5000
          );
          const primaryTarget =
            surfaceFriendlies.find((s) => s.type === 'cvn' || s.type === 'carrier' || s.type === 'battleship' || s.type === 'cg_tico') ||
            surfaceFriendlies.sort((a, b) => dist(eShip.pos, a.pos) - dist(eShip.pos, b.pos))[0] ||
            this.getFlagship();

          if (primaryTarget && dist(eShip.pos, primaryTarget.pos) <= 5000) {
            this.fireSovietSaturationSalvo(eShip, primaryTarget, undefined, surfaceFriendlies);
            eShip.torpedoCooldown = eShip.type === 'ssgn_oscar' ? 40.0 : eShip.type === 'cgn_kirov' ? 36.0 : eShip.type === 'cvhg_kiev' ? 34.0 : 28.0;
          }
        }
      }
    }

    // 4. 敵蚊子級/黃蜂級飛彈快艇 (Komar / Osa PTG) 發射 P-15 冥河 (Styx) 反艦飛彈
    for (const eShip of this.enemyShips) {
      if (eShip.isSunk || (eShip.type !== 'komar_ptg' && eShip.type !== 'osa')) continue;

      if (eShip.torpedoCooldown !== undefined && eShip.torpedoCooldown > 0) {
        eShip.torpedoCooldown = Math.max(0, eShip.torpedoCooldown - dt);
      }

      if ((eShip.torpedoCooldown || 0) <= 0) {
        const styxCandidates = [...this.playerShips, ...this.alliedShips].filter(
          (s) => !s.isSunk && !this.isSubmarine(s) && dist(eShip.pos, s.pos) <= 2600
        );
        const targetShip =
          styxCandidates.find((s) => s.type === 'cv63' || s.type === 'cg' || s.type === 'ddg' || s.type === 'carrier' || s.type === 'lph') ||
          styxCandidates.sort((a, b) => dist(eShip.pos, a.pos) - dist(eShip.pos, b.pos))[0] ||
          this.getFlagship();

        const fit = getShipAshmFit(eShip.type);
        const styxLeft = eShip.ashmReady ?? fit?.magazine ?? 2;
        if (targetShip && styxLeft > 0 && dist(eShip.pos, targetShip.pos) <= 2600) {
          // Two Termits per target (the 1967 Eilat attack: two boats, two missiles each)
          const salvo = Math.min(fit?.salvo ?? 2, styxLeft);
          for (let i = 0; i < salvo; i++) {
            this.scheduleAction(i * 1.5, () => {
              if (!eShip.isSunk && !targetShip.isSunk) this.fireKomarStyx(eShip, targetShip);
            });
          }
          eShip.ashmReady = styxLeft - salvo;
          eShip.torpedoCooldown = eShip.type === 'osa' ? 18.0 : 24.0;
        }
      }
    }

    // 4b. OPFOR 飛彈快艇狼群突擊 (Komar PTG Wolfpack Raids every 90-110s)
    this.komarRaidTimer = (this.komarRaidTimer || 95) - dt;
    if (this.komarRaidTimer <= 0) {
      this.komarRaidTimer = 95 + Math.random() * 25;
      this.spawnKomarMissileRaid();
    }

    // 5. 敵軍 SA-2 (Guideline) 地對空飛彈陣地防空攔截與扇歌雷達照射
    let activeFanSong: Installation | null = null;
    for (const isl of this.islands) {
      const fs = isl.installations.find(
        (inst) => (inst.type === 'fan_song_radar' || inst.type === 'radar_station') && !inst.isDestroyed && inst.side === 'enemy'
      );
      if (fs) {
        activeFanSong = fs;
        break;
      }
    }
    const fanSongAlive = !!activeFanSong;

    // 扇歌火控雷達主動波束照射偵測: 當雷達照射在空友機時，在空野鼬戰機即刻感應波束並發動反輻射狙擊
    if (fanSongAlive && activeFanSong && this.era === 'era4') {
      const planeInBeam = this.aircraft.find(
        (a) => this.isHostile(activeFanSong!.side, a.side) && a.state !== 'shot_down' && a.state !== 'landing' && dist(activeFanSong!.pos, a.pos) <= 3200
      );
      if (planeInBeam && Math.random() < 0.28 * dt) {
        this.triggerSeadAutoRetaliation(activeFanSong, planeInBeam);
      }
    }

    this.updateEra4SamSites(dt, fanSongAlive);

    // 5b. 時代四 華約/蘇聯野戰機動防空飛彈連 (SA-6 Kub / SA-9 Strela-1)
    for (const gUnit of this.groundUnits) {
      if (gUnit.isDestroyed || gUnit.side !== 'enemy' || gUnit.cooldown > 0) continue;
      if (gUnit.type === 'opfor_sa6_kub') {
        const targetPlane = this.aircraft.find(
          (a) => this.isHostile(gUnit.side, a.side) && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= (gUnit.range || 2800)
        );
        if (targetPlane) {
          this.fireOpforMobileSAM(gUnit, targetPlane, '2K12 Kub (SA-6 增益)', 720, 760, 'command_radar', true);
          gUnit.cooldown = gUnit.reloadTime || 5.2;
        }
      } else if (gUnit.type === 'opfor_sa9_strela1') {
        const targetPlane = this.aircraft.find(
          (a) => this.isHostile(gUnit.side, a.side) && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= (gUnit.range || 1750)
        );
        if (targetPlane) {
          this.fireOpforMobileSAM(gUnit, targetPlane, '9K31 Strela-1 (SA-9 長弓)', 580, 420, 'ir', false);
          gUnit.cooldown = gUnit.reloadTime || 4.2;
        }
      }
    }

    this.updateEra4CoastalSites(dt);

    // 6b. 美陸軍 MIM-72 榭樹 (Chaparral) 履帶防空飛彈車自動攔截
    for (const gUnit of this.groundUnits) {
      if (gUnit.isDestroyed || (gUnit.side !== 'player' && gUnit.side !== 'allied') || gUnit.type !== 'us_army_chaparral_sam') continue;
      if (gUnit.cooldown <= 0) {
        const targetPlane = this.aircraft.find(
          (a) => this.isHostile(gUnit.side, a.side) && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= 2000
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

  // 6. 友軍 MIM-23 鷹式 (Hawk) 地對空防空飛彈發射連防空自動截擊
  private updateEra4CoastalSites(dt: number): void {
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed || (inst.side !== 'player' && inst.side !== 'allied') || inst.type !== 'sam_hawk') continue;

        inst.cooldown = Math.max(0, inst.cooldown - dt);

        if (inst.cooldown <= 0 && (inst.samMissilesReady ?? 12) > 0) {
          const samRange = inst.range || 2600;
          const targetPlane = this.aircraft.find(
            (a) =>
              this.isHostile(inst.side, a.side) &&
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
  }

  private updateEra4SamSites(dt: number, fanSongAlive: boolean): void {
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed || inst.side !== 'enemy' || (inst.type !== 'sa2_sam_site' && inst.type !== 'sa3_sam_site')) continue;

        inst.cooldown = Math.max(0, inst.cooldown - dt);

        if (inst.cooldown <= 0) {
          const isSA3 = inst.type === 'sa3_sam_site';
          const samRange = inst.range || (isSA3 ? 2900 : 3200);
          const targetPlane = this.aircraft.find(
            (a) =>
              this.isHostile(inst.side, a.side) &&
              a.state !== 'shot_down' &&
              dist(inst.pos, a.pos) <= samRange
          );

          if (targetPlane) {
            const canFire = fanSongAlive || Math.random() < 0.35;
            if (canFire) {
              if (isSA3) {
                this.fireSA3Missile(inst, targetPlane, fanSongAlive);
                inst.cooldown = fanSongAlive ? inst.reloadTime || 4.0 : (inst.reloadTime || 4.0) * 1.8;
              } else {
                this.fireSA2Missile(inst, targetPlane, fanSongAlive);
                inst.cooldown = fanSongAlive ? inst.reloadTime || 12 : (inst.reloadTime || 12) * 2;
              }
            }
          }
        }
      }
    }
  }

  // 3a. 艦載 RBOC 金屬箔條干擾火箭 (Shipboard RBOC Chaff Rocket Mortars vs AShM)
  private fireShipboardChaff(dt: number, ship: Ship): void {
    if (ship.hasChaffLauncher) {
      if (ship.chaffCooldown !== undefined && ship.chaffCooldown > 0) {
        ship.chaffCooldown = Math.max(0, ship.chaffCooldown - dt);
      }
      if ((ship.chaffCooldown || 0) <= 0) {
        const incomingAshm = this.projectiles.find(
          (p) => !p.isDead && p.side === 'enemy' && p.type === 'missile_ashm' && dist(ship.pos, p.pos) <= 950
        );
        if (incomingAshm) {
          ship.chaffCooldown = 18.0;
          soundEngine.playPlaneSortie();

          // 在船艦與飛彈間海面上射出金屬箔條雲假目標
          const cloudPos = {
            x: ship.pos.x + Math.cos(incomingAshm.heading + Math.PI * 0.45) * 260,
            y: ship.pos.y + Math.sin(incomingAshm.heading + Math.PI * 0.45) * 260,
          };
          for (let c = 0; c < 14; c++) {
            this.particles.push({
              id: `ship-chaff-${Date.now()}-${c}`,
              x: cloudPos.x + (Math.random() - 0.5) * 70,
              y: cloudPos.y + (Math.random() - 0.5) * 70,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 4.5,
              maxLife: 4.5,
              radius: 12 + Math.random() * 8,
              color: '#ECEFF1',
              type: 'chaff_cloud',
            });
          }

          if (!incomingAshm.isDecoyed) {
            const decoyChance = this.getAshmChaffDecoyChance(incomingAshm);
            if (Math.random() < decoyChance) {
              incomingAshm.isDecoyed = true;
              incomingAshm.decoyTargetPos = { ...cloudPos };
              incomingAshm.targetPos = { ...cloudPos };
              if (incomingAshm.isLeadMissile) {
                this.handleAshmLeaderDestroyed(incomingAshm);
              }
              this.addBannerAlert('📡【RBOC 艦載箔條干擾生效】海面金屬箔條雲成功誘騙來襲反艦飛彈！', 'player', 'alert', 4.5);
              this.addCombatLog({
                category: 'aa',
                sourceSide: 'player',
                sourceName: `${ship.name} (RBOC 箔條迫擊砲)`,
                targetName: incomingAshm.attackerName || '來襲反艦飛彈',
                actionType: 'recon_spotted',
                text: `📡【艦載箔條誘騙成功】「${ship.name}」向海面射出金屬箔條干擾火箭！形成高雷達截面假目標雲，來襲飛彈尋標頭被引離真艦！`,
              });
            }
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代五 (1973–1991) 現代海陸空立體導引飛彈與超視距神盾作戰體系
  // ══════════════════════════════════════════════════════════
  // 飛機：空艦飛彈 (AGM-84 / Kh-22)、空空飛彈 (AIM-54 / AIM-7M / AIM-9L / R-27 / R-73)、反輻射飛彈 (AGM-88 HARM / Kh-31P)
  // 陸基：面空飛彈 (MIM-104 愛國者 / S-300PMU / 霍克 / 通古斯卡)、面艦飛彈 (岸置魚叉 / 4K51 邊界)、巡弋飛彈 (BGM-109G GLCM / RK-55 Relief)
  // 船艦：艦空飛彈 (神盾 SM-2MR / 海麻雀 / S-300F 堡壘 / 施基利)、艦艦飛彈 (RGM-84 魚叉 / P-700 花崗岩 / P-270 白蛉 / P-500 玄武岩)
  // 潛艦：潛射艦艦飛彈 (UGM-84 潛射魚叉 / 水下潛射 P-700 花崗岩飽和齊射)、重型魚雷 (Mk 48 ADCAP / 53-65K 尾流自導)、潛射巡弋飛彈 (UGM-109 戰斧 TLAM / RK-55 石榴石)
  // ══════════════════════════════════════════════════════════
  private updateEra5Mechanics(dt: number) {
    if (this.era !== 'era5') return;

    // 1. E-2C Hawkeye / E-3A Sentry / A-50 Mainstay 全域超遠程相控陣空中預警系統 (AEW 8500m 破霧鎖定)
    const activeBluforAEW = this.aircraft.find(
      (a) =>
        a.side === 'player' &&
        (a.model === 'e2c' || a.model === 'e3a' || a.role === 'aew') &&
        a.state !== 'shot_down' &&
        a.state !== 'landing'
    );
    if (activeBluforAEW) {
      const aewRange = 8500;
      for (const eShip of this.enemyShips) {
        if (!eShip.isSunk && !this.isSubmarine(eShip) && dist(activeBluforAEW.pos, eShip.pos) < aewRange) {
          eShip.isSpotted = true;
        }
      }
    }

    // 2. 自動指派 SH-3F / CH-53 救援直升機前往我方落難救生筏
    const idleRescueHelis = this.aircraft.filter(
      (a) =>
        a.side === 'player' &&
        (a.model === 'sh3f' || a.model === 'ch53' || a.role === 'rescue') &&
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

    this.updatePlayerShipDefenses(dt);

    this.updateSsnWeapons(dt);

    this.updateSovietShipboardSam(dt);

    // 5b. 蘇聯艦隊/奧斯卡核潛艇「白令海百枚彈著飽和齊射」協同突擊 (Bering Sea 100+ Saturation Alpha Strike)
    const surfaceFriendlies = [...this.playerShips, ...this.alliedShips].filter(
      (s) => !s.isSunk && !this.isSubmarine(s)
    );
    const prioritizedFriendlies = [...surfaceFriendlies].sort((a, b) => {
      const scoreShip = (s: Ship) =>
        s.isFlagship || s.type === 'cvn' || s.type === 'carrier'
          ? 0
          : s.type === 'cg_tico' || s.type === 'battleship' || s.type === 'bb_iowa_mod'
          ? 1
          : 2;
      return scoreShip(a) - scoreShip(b);
    });

    this.enemyBeringSeaCoordTimer -= dt;
    this.updateBeringSeaCoordination(prioritizedFriendlies);

    this.updateEnemyShipTorpedoAttacks(dt, prioritizedFriendlies);

    this.updateLandMissileSites(dt);

    this.updateMobileAirDefenseUnits();

    // 7. 大陸戰線前線據點動態爭奪與佔領
    this.updateMainlandInstallationCapture(dt);

    // 8. OPFOR 蘇聯戰略/戰術核武報復檢定 (時代五 MAD)
    if (!this.hasOpforRetaliatedNuke) {
      this.opforNukeCheckTimer = (this.opforNukeCheckTimer || 0) + dt;
      if (this.opforNukeCheckTimer >= 3.0) {
        this.opforNukeCheckTimer = 0;
        this.checkOpforNuclearRetaliation();
      }
    }
  }

  // 6f. 友軍與敵軍地面裝甲自走防空車自動防空攔截 (LAV-AD / M163 VADS / 通古斯卡 2S6 / 箭-10)
  private updateMobileAirDefenseUnits(): void {
    for (const gUnit of this.groundUnits) {
      if (gUnit.isDestroyed || gUnit.cooldown > 0) continue;

      if (gUnit.side !== 'enemy' && (gUnit.type === 'usmc_lav_ad' || gUnit.type === 'us_m163_vads')) {
        const targetPlane = this.aircraft.find((a) => this.isHostile(gUnit.side, a.side) && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= 2000);
        if (targetPlane) {
          this.fireChaparralSAM(gUnit, targetPlane);
          gUnit.cooldown = gUnit.type === 'usmc_lav_ad' ? 3.5 : 4.0;
        }
      } else if (
        gUnit.side === 'enemy' &&
        (gUnit.type === 'opfor_tunguska' ||
          gUnit.type === 'opfor_strela10' ||
          gUnit.type === 'opfor_sa8_osa' ||
          gUnit.type === 'opfor_sa11_buk' ||
          gUnit.type === 'opfor_sa15_tor')
      ) {
        const samRange =
          gUnit.type === 'opfor_sa11_buk'
            ? 3400
            : gUnit.type === 'opfor_sa8_osa'
            ? 2600
            : gUnit.type === 'opfor_sa15_tor'
            ? 2500
            : gUnit.type === 'opfor_tunguska'
            ? 2400
            : 1850;
        const canAntiMissile = gUnit.type === 'opfor_sa15_tor' || gUnit.type === 'opfor_sa11_buk' || gUnit.type === 'opfor_sa8_osa';

        const incomingBluforMissile = canAntiMissile
          ? this.projectiles.find(
              (p) =>
                !p.isDead &&
                this.isHostile(gUnit.side, p.side) &&
                (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm' || p.type === 'missile_arm') &&
                dist(gUnit.pos, p.pos) <= samRange
            )
          : undefined;

        if (incomingBluforMissile) {
          const sysName =
            gUnit.type === 'opfor_sa15_tor'
              ? '9K330 Tor (SA-15 道爾垂直反飛彈)'
              : gUnit.type === 'opfor_sa11_buk'
              ? '9K37 Buk (SA-11 山毛櫸)'
              : '9K33 Osa-AKM (SA-8 黃蜂)';
          this.fireOpforMobileSAM(gUnit, incomingBluforMissile, sysName, 760, 720, 'command_radar', true);
          gUnit.cooldown = gUnit.reloadTime || (gUnit.type === 'opfor_sa15_tor' ? 3.2 : 4.2);
          continue;
        }

        const targetPlane = this.aircraft.find(
          (a) => this.isHostile(gUnit.side, a.side) && a.state !== 'shot_down' && dist(gUnit.pos, a.pos) <= samRange
        );
        if (targetPlane) {
          if (gUnit.type === 'opfor_tunguska') {
            this.fireTunguskaSAM(gUnit, targetPlane);
            gUnit.cooldown = 4.0;
          } else if (gUnit.type === 'opfor_strela10') {
            this.fireOpforMobileSAM(gUnit, targetPlane, '9K35 Strela-10 (SA-13 金花鼠)', 620, 480, 'ir', false);
            gUnit.cooldown = gUnit.reloadTime || 3.8;
          } else if (gUnit.type === 'opfor_sa8_osa') {
            this.fireOpforMobileSAM(gUnit, targetPlane, '9K33 Osa-AKM (SA-8 黃蜂)', 690, 620, 'command_radar', true);
            gUnit.cooldown = gUnit.reloadTime || 4.0;
          } else if (gUnit.type === 'opfor_sa11_buk') {
            this.fireOpforMobileSAM(gUnit, targetPlane, '9K37 Buk (SA-11 山毛櫸)', 790, 920, 'command_radar', true);
            gUnit.cooldown = gUnit.reloadTime || 5.0;
          } else if (gUnit.type === 'opfor_sa15_tor') {
            this.fireOpforMobileSAM(gUnit, targetPlane, '9K330 Tor-M1 (SA-15 道爾)', 750, 700, 'command_radar', true);
            gUnit.cooldown = gUnit.reloadTime || 3.2;
          }
        }
      }
    }
  }

  // 6. 陸基導向飛彈陣地防禦與打擊 (Land-based Missile Installations & Units in Era 5)
  private updateLandMissileSites(dt: number): void {
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed) continue;

        inst.cooldown = Math.max(0, inst.cooldown - dt);
        if (inst.cooldown > 0) continue;

        // 6a. 友軍 MIM-104 愛國者 (Patriot) 長程防空/反飛彈發射營 (Mach 4.5, 射程 3800m)
        if (inst.side !== 'enemy' && (inst.type === 'sam_patriot' || inst.type === 'flak_battery')) {
          const samRange = 3800;
          // 優先攔截來襲敵方反艦/巡弋/彈道/潛射核飛彈 (ATBM 戰術與戰略彈道飛彈攔截能力)
          const incomingAshm = this.projectiles.find(
            (p) => !p.isDead && this.isHostile(inst.side, p.side) && (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm' || p.type === 'slbm_r39') && dist(inst.pos, p.pos) <= samRange
          );
          if (incomingAshm) {
            this.firePatriotSAM(inst, incomingAshm);
            inst.cooldown = 2.5;
            continue;
          }
          // 其次攔截進入空域之敵方超音速戰機或轟炸機
          const hostileJet = this.aircraft.find(
            (a) => this.isHostile(inst.side, a.side) && a.state !== 'shot_down' && dist(inst.pos, a.pos) <= samRange
          );
          if (hostileJet) {
            this.firePatriotSAM(inst, hostileJet);
            inst.cooldown = 3.5;
            continue;
          }
        }

        // 6b. 友軍岸置魚叉反艦飛彈連 (Coastal Harpoon Battery - 射程 4500m)
        if (inst.side !== 'enemy' && inst.type === 'coastal_harpoon') {
          const targetWarship = this.enemyShips.find((s) => !s.isSunk && !this.isSubmarine(s) && this.isHostile(inst.side, s.side) && dist(inst.pos, s.pos) <= 4500);
          if (targetWarship) {
            this.fireHarpoonMissile(inst, targetWarship);
            inst.cooldown = 24.0;
            continue;
          }
        }

        // 6c. 友軍 BGM-109G 陸基戰斧巡弋飛彈連 (GLCM Site - 射程 6000m)
        if (inst.side !== 'enemy' && inst.type === 'glcm_site') {
          for (const targetIsl of this.islands) {
            const enemyHQ = targetIsl.installations.find(
              (i) => !i.isDestroyed && this.isHostile(inst.side, i.side) && (i.type === 'command_post' || i.type === 's300_sam_site' || i.type === 'radar_station') && dist(inst.pos, i.pos) <= 6000
            );
            if (enemyHQ) {
              this.fireTomahawkCruiseMissile(inst, enemyHQ.pos, enemyHQ);
              inst.cooldown = 40.0;
              break;
            }
          }
          continue;
        }

        // 6d. 敵軍 S-300PMU / SA-3 Pechora / SA-2 區域防空飛彈營
        if (inst.side === 'enemy' && (inst.type === 's300_sam_site' || inst.type === 'sa3_sam_site' || inst.type === 'sa2_sam_site')) {
          const isSA3 = inst.type === 'sa3_sam_site';
          const samRange = isSA3 ? (inst.range || 2900) : 4200;
          const targetPlayerPlane = this.aircraft.find(
            (a) => this.isHostile(inst.side, a.side) && a.state !== 'shot_down' && dist(inst.pos, a.pos) <= samRange
          );
          if (targetPlayerPlane) {
            if (isSA3) {
              this.fireSA3Missile(inst, targetPlayerPlane, true);
              inst.cooldown = inst.reloadTime || 3.6;
            } else {
              this.fireS300SAM(inst, targetPlayerPlane);
              inst.cooldown = 6.0;
            }
            continue;
          }
          if (!isSA3) {
            const incomingTomahawk = this.projectiles.find(
              (p) => !p.isDead && this.isHostile(inst.side, p.side) && (p.type === 'missile_cruise' || p.type === 'missile_ashm' || p.type === 'missile_ssm' || p.type === 'slbm_trident') && dist(inst.pos, p.pos) <= samRange
            );
            if (incomingTomahawk) {
              this.fireS300SAM(inst, incomingTomahawk);
              inst.cooldown = 4.0;
              continue;
            }
          }
        }

        // 6e. 敵軍 4K51 邊界 (Rubezh / Redut) 岸置超重型反艦飛彈陣地 (射程 4800m)
        if (inst.side === 'enemy' && (inst.type === 'coastal_rubezh' || inst.type === 'coastal_gun')) {
          const targetPlayerShip = [...this.playerShips, ...this.alliedShips]
            .filter(
              (s) =>
                !s.isSunk &&
                !this.isSubmarine(s) &&
                this.isHostile(inst.side, s.side) &&
                dist(inst.pos, s.pos) <= 4800
            )
            .sort((a, b) => dist(inst.pos, a.pos) - dist(inst.pos, b.pos))[0];
          if (targetPlayerShip) {
            this.fireSovietSaturationSalvo(inst, targetPlayerShip, 8);
            inst.cooldown = 36.0;
            continue;
          }
        }

        // 6g. 敵軍 9K72 飛毛腿-B (Scud-B) 戰術彈道飛彈陣地 (射程 6500m, Mach 4.5, 1400 傷害)
        if (inst.side === 'enemy' && inst.type === 'scud_site') {
          const scudCandidates = [...this.playerShips, ...this.alliedShips].filter(
            (s) => !s.isSunk && !this.isSubmarine(s) && this.isHostile(inst.side, s.side) && dist(inst.pos, s.pos) <= 6500
          );
          const targetPlayerShip =
            scudCandidates.find((s) => s.type === 'cvn' || s.type === 'carrier' || s.type === 'battleship' || s.type === 'bb_iowa_mod' || s.type === 'cg_tico') ||
            scudCandidates[0] ||
            this.getFlagship();
          const targetPlayerBase = !targetPlayerShip ? this.islands.find(isl => isl.isFriendlyBase)?.installations.find(i => !i.isDestroyed) : null;
          if (targetPlayerShip && dist(inst.pos, targetPlayerShip.pos) <= 6500) {
            this.fireScudMissile(inst, targetPlayerShip.pos, targetPlayerShip);
            inst.cooldown = 32.0;
            continue;
          } else if (targetPlayerBase && dist(inst.pos, targetPlayerBase.pos) <= 6500) {
            this.fireScudMissile(inst, targetPlayerBase.pos, targetPlayerBase);
            inst.cooldown = 35.0;
            continue;
          }
        }
      }
    }
  }

  private updateEnemyShipTorpedoAttacks(dt: number, prioritizedFriendlies: Ship[]): void {
    for (const eShip of this.enemyShips) {
      if (eShip.isSunk) continue;

      if (eShip.torpedoCooldown !== undefined && eShip.torpedoCooldown > 0) {
        eShip.torpedoCooldown = Math.max(0, eShip.torpedoCooldown - dt);
      }

      if ((eShip.torpedoCooldown || 0) <= 0) {
        const syncCandidates = prioritizedFriendlies.filter((s) => dist(eShip.pos, s.pos) <= 5600);
        const primaryTarget = syncCandidates[0] || this.getFlagship();

        if (primaryTarget && dist(eShip.pos, primaryTarget.pos) <= 5600) {
          if (eShip.type === 'ssgn_oscar') {
            // 奧斯卡級水下傾斜發射井分波齊射 16 枚 P-700 花崗岩 (領彈高空資料鏈)
            this.fireSovietSubSalvo(eShip, primaryTarget, 16, syncCandidates);
            eShip.torpedoCooldown = 62.0 + Math.random() * 10.0;
          } else if (eShip.type === 'cgn_kirov' || eShip.type === 'cvhg_kiev' || eShip.type === 'dd_sovremenny' || eShip.type === 'cg_slava') {
            const shipSalvo = getShipAshmFit(eShip.type)?.salvo ?? 8;
            this.fireSovietSaturationSalvo(eShip, primaryTarget, shipSalvo, syncCandidates);
            eShip.torpedoCooldown = eShip.type === 'cgn_kirov' ? 58.0 : eShip.type === 'cvhg_kiev' ? 52.0 : 46.0;
          }
        }
      }

      // 5c. 奧斯卡級與維克托 III 級核潛艇 53-65K 尾流自導重型魚雷近距獵殺
      if (eShip.type === 'ssgn_oscar' || (this.isSubmarine(eShip) && eShip.subVariant === 'victor3') || eShip.subVariant === 'akula') {
        const closeWarship = [...this.playerShips, ...this.alliedShips].find(
          (s) => !s.isSunk && (!this.isSubmarine(s) || Boolean(s.isSpottedByEnemy)) && dist(eShip.pos, s.pos) <= 2600
        );
        if (closeWarship && (eShip.rocketCooldown || 0) <= 0) {
          this.fireWakeHomingTorpedo(eShip, closeWarship);
          eShip.rocketCooldown = 28.0;
        }
      }
    }
  }

  private updateBeringSeaCoordination(prioritizedFriendlies: Ship[]): void {
    if (this.enemyBeringSeaCoordTimer <= 0 && prioritizedFriendlies.length > 0) {
      const coordStrikers = this.enemyShips.filter(
        (e) =>
          !e.isSunk &&
          (e.type === 'ssgn_oscar' || e.type === 'cgn_kirov' || e.type === 'cvhg_kiev' || e.type === 'cg_slava' || e.type === 'dd_sovremenny') &&
          (e.torpedoCooldown || 0) <= 18.0 &&
          prioritizedFriendlies.some((f) => dist(e.pos, f.pos) <= 6400)
      );

      if (coordStrikers.length >= 2) {
        let fleetSalvoTotal = 0;
        coordStrikers.forEach((eShip, idx) => {
          const inRangeTargets = prioritizedFriendlies.filter((f) => dist(eShip.pos, f.pos) <= 6400);
          const primaryTarget = inRangeTargets[0] || prioritizedFriendlies[0];
          const salvoCount = Math.min(getShipAshmFit(eShip.type)?.salvo ?? 8, eShip.ashmReady ?? Infinity);
          if (salvoCount <= 0) return;
          fleetSalvoTotal += salvoCount;

          if (eShip.type === 'ssgn_oscar') {
            this.fireSovietSubSalvo(eShip, primaryTarget, salvoCount, inRangeTargets, idx * 0.25, true);
          } else {
            this.fireSovietSaturationSalvo(eShip, primaryTarget, salvoCount, inRangeTargets, idx * 0.25, true);
          }
          eShip.torpedoCooldown = 60.0 + Math.random() * 14.0;
        });

        // 若協同編隊總彈量低於 72 枚，升空 Tu-22M3 逆火超音速飛彈轟炸機群實施海空協同飽和突擊
        let airSupplemental = 0;
        if (fleetSalvoTotal < 72) {
          this.triggerEnemyAirDoctrine('strike_fleet');
          airSupplemental = Math.max(12, 80 - fleetSalvoTotal);
          fleetSalvoTotal += airSupplemental;
        }

        this.addBannerAlert(
          `🚨【白令海艦群協同飽和齊射！】蘇聯太平洋艦隊「基洛夫／奧斯卡／基輔／現代級」依艦種齊射各 8–16 枚，共傾瀉 ${fleetSalvoTotal} 枚超音速反艦飛彈！立即開啟神盾 SM-2MR、CIWS 與電子干擾！`,
          'enemy',
          'alert',
          9.0
        );
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'enemy',
          sourceName: '蘇聯紅旗太平洋艦隊 協同打擊指揮部',
          targetName: '美國海軍特遣艦隊群',
          actionType: 'recon_spotted',
          isCrit: true,
          text: `🚨【白令海協同飽和反艦突擊 (Operation Bering Saturation)】敵 ${coordStrikers.length} 艘飛彈主戰艦艇／核潛艦${airSupplemental > 0 ? '及海航逆火轟炸機群' : ''}於同一時間窗啟動冷戰協同飽和齊射（單艦 8–16 枚分級配比），共 ${fleetSalvoTotal} 枚 P-700 花崗岩 / P-500 玄武岩 / P-270 白蛉超音速飛彈正掠海撲來！`,
        });

        this.enemyBeringSeaCoordTimer = 76.0 + Math.random() * 18.0;
      } else {
        this.enemyBeringSeaCoordTimer = 18.0;
      }
    }
  }

  // 5. OPFOR 水面艦艇與核潛艦系統 (Kirov, Sovremenny, Udaloy, Kiev, Oscar SSGN)
  // 5a. 蘇聯艦載防空飛彈系統 (S-300F Fort VLS / SA-N-7 Shtil / SA-N-9 Kinzhal)
  private updateSovietShipboardSam(dt: number): void {
    for (const eShip of this.enemyShips) {
      if (eShip.isSunk) continue;

      if (eShip.samCooldown !== undefined && eShip.samCooldown > 0) {
        eShip.samCooldown = Math.max(0, eShip.samCooldown - dt);
      }

      if ((eShip.samCooldown || 0) <= 0) {
        const isKirov = eShip.type === 'cgn_kirov';
        const isSovremenny = eShip.type === 'dd_sovremenny';
        const isUdaloy = eShip.type === 'dd_udaloy';
        const isKiev = eShip.type === 'cvhg_kiev';
        const isSlava = eShip.type === 'cg_slava';

        if (isKirov || isSovremenny || isUdaloy || isKiev || isSlava) {
          const samRange = isKirov || isSlava ? 4000 : isSovremenny ? 3500 : isKiev ? 3200 : 2800;
          const samName = isKirov || isSlava ? 'S-300F 堡壘 (SA-N-6 Fort VLS)' : isSovremenny ? 'SA-N-7 施基利 (Shtil)' : isUdaloy ? 'SA-N-9 匕首 (Kinzhal VLS)' : 'SA-N-3 戈布勒 (Goblet)';

          // 優先攔截來襲之敵方反艦飛彈、巡弋飛彈與戰術/潛射彈道飛彈 (ATACMS / Trident II D5)
          const incomingBluforMissiles = this.projectiles.filter(
            (p) =>
              !p.isDead &&
              this.isHostile(eShip.side, p.side) &&
              (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm' || (isKirov && p.type === 'slbm_trident')) &&
              dist(eShip.pos, p.pos) <= samRange
          );

          if (incomingBluforMissiles.length > 0) {
            this.launchShipSamSalvo(eShip, incomingBluforMissiles, (m) => this.fireSovietShipSAM(eShip, m, samName), (m) => !m.isDead);
          } else {
            // 攔截進入防空圈之敵方在空戰機
            const targetPlayerPlanes = this.aircraft.filter(
              (a) => this.isHostile(eShip.side, a.side) && a.state !== 'shot_down' && dist(eShip.pos, a.pos) <= samRange
            );
            if (targetPlayerPlanes.length > 0) {
              this.launchShipSamSalvo(eShip, targetPlayerPlanes, (a) => this.fireSovietShipSAM(eShip, a, samName), (a) => a.state !== 'shot_down');
            }
          }
        }
      }
    }
  }

  // 4. 潛艦部隊現代化作戰 (Submarine Warfare in Era 5)
  // BLUFOR SSN-688 洛杉磯級 (Los Angeles SSN): 潛射魚叉 UGM-84、Mk 48 ADCAP 線導重型魚雷、UGM-109 戰斧巡弋飛彈
  private updateSsnWeapons(dt: number): void {
    for (const sub of this.playerShips) {
      if (sub.isSunk || sub.type !== 'ssn_la') continue;

      if (sub.torpedoCooldown !== undefined && sub.torpedoCooldown > 0) {
        sub.torpedoCooldown = Math.max(0, sub.torpedoCooldown - dt);
      }
      if (sub.harpoonCooldown !== undefined && sub.harpoonCooldown > 0) {
        sub.harpoonCooldown = Math.max(0, sub.harpoonCooldown - dt);
      }

      // 4a. Mk 48 ADCAP 線導主被動重型魚雷 (射程 2800m, 55節極速 - 敵潛艦需已遭聲吶接觸定位)
      if ((sub.torpedoCooldown || 0) <= 0) {
        const targetHostile = this.enemyShips.find(
          (s) => !s.isSunk && (!this.isSubmarine(s) || Boolean(s.isSpotted)) && dist(sub.pos, s.pos) <= 2800
        );
        if (targetHostile) {
          this.fireMk48Torpedo(sub, targetHostile);
          sub.torpedoCooldown = 18.0;
        }
      }

      // 4b. UGM-84 潛射魚叉 (Sub-Harpoon) 膠囊破浪反艦飛彈 (射程 4200m)
      if ((sub.harpoonCooldown || 0) <= 0 && (sub.readyHarpoons ?? 6) > 0) {
        const targetShip = this.enemyShips.find((s) => !s.isSunk && !this.isSubmarine(s) && dist(sub.pos, s.pos) <= 4200);
        if (targetShip) {
          this.fireSubHarpoon(sub, targetShip);
          sub.harpoonCooldown = 25.0;
          sub.readyHarpoons = Math.max(0, (sub.readyHarpoons ?? 6) - 1);
        }
      }

      // 4c. UGM-109 潛射戰斧對陸巡弋飛彈 (TLAM - 射程 6000m)
      if (Math.random() < 0.05 * dt) {
        for (const isl of this.islands) {
          const enemyHqOrRadar = isl.installations.find(
            (inst) => !inst.isDestroyed && inst.side === 'enemy' && (inst.type === 'command_post' || inst.type === 's300_sam_site' || inst.type === 'radar_station') && dist(sub.pos, inst.pos) <= 6000
          );
          if (enemyHqOrRadar) {
            this.fireTomahawkCruiseMissile(sub, enemyHqOrRadar.pos, enemyHqOrRadar);
            break;
          }
        }
      }
    }
  }

  // 3. 艦載防空飛彈系統 (Ship SAM Defenses: Aegis SM-2MR / Sea Sparrow / SM-1MR)
  // 時代五神盾系統具備 4 個多目標追蹤射控通道，優先攔截來襲超音速反艦/巡弋飛彈，其次攔截敵超音速戰轟機
  private updatePlayerShipDefenses(dt: number): void {
    for (const ship of this.playerShips) {
      if (ship.isSunk) continue;

      // 3a. 艦載防空飛彈系統 (Ship SAM Defenses: Aegis SM-2MR / Sea Sparrow / SM-1MR)
      // 時代五神盾系統 (Ticonderoga CG) 具備 8 個多目標追蹤射控照射通道與 Mk 41 垂直發射系統 (122枚飛彈艙)
      // 可一次齊射攔截多達 8 枚來襲超音速反艦/巡弋/彈道飛彈，並在防空戰中持續作戰！
      if (ship.hasSAM) {
        if (ship.samCooldown !== undefined && ship.samCooldown > 0) {
          ship.samCooldown = Math.max(0, ship.samCooldown - dt);
        }

        const samRange = ship.samRange || (ship.type === 'cg_tico' ? 4200 : ship.type === 'cg_virginia' || ship.type === 'ddg_kidd' ? 3600 : ship.type === 'ffg_ohp' ? 3000 : 2400);

        if ((ship.samCooldown || 0) <= 0 && (ship.readySAMs ?? 48) > 0) {
          // A. 優先攔截進入射程的敵方反艦飛彈、巡弋飛彈與彈道飛彈 (P-700 / Moskit / Scud / RK-55 / R-39 SLBM)
          const incomingMissiles = this.projectiles.filter(
            (p) =>
              !p.isDead &&
              p.side === 'enemy' &&
              (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm' || (ship.hasAegis && p.type === 'slbm_r39')) &&
              dist(ship.pos, p.pos) <= samRange
          );

          if (incomingMissiles.length > 0) {
            // 神盾巡洋艦 (Ticonderoga) 以四具 SPG-62 照明雷達分時導引，每目標雙發齊射 (shoot-shoot)
            this.launchShipSamSalvo(ship, incomingMissiles, (m) => this.fireSAM(ship, m, 'projectile'), (m) => !m.isDead);
          } else {
            // B. 攔截進入防空圈之敵方高空戰鬥機與戰略轟炸機 (Tu-22M3 / Tu-95 / Su-27 / MiG-29A)
            // 神盾艦可同時照射引導多達 4 架敵機！
            const targetPlanes = this.aircraft.filter(
              (a) =>
                a.side === 'enemy' &&
                a.state !== 'shot_down' &&
                a.state !== 'landing' &&
                dist(ship.pos, a.pos) <= samRange
            );
            if (targetPlanes.length > 0) {
              this.launchShipSamSalvo(ship, targetPlanes, (a) => this.fireSAM(ship, a, 'aircraft'), (a) => a.state !== 'shot_down');
            }
          }
        }
      }

      // 3b. 艦載 RGM-84 魚叉 (Harpoon) 掠海反艦飛彈系統 (發射箱艦艇 8 枚齊射 · OHP 單臂 Mk 13 單發)
      if (ship.hasHarpoon && ship.type !== 'ssn_la') {
        if (ship.harpoonCooldown !== undefined && ship.harpoonCooldown > 0) {
          ship.harpoonCooldown = Math.max(0, ship.harpoonCooldown - dt);
        }
        if ((ship.harpoonCooldown || 0) <= 0 && (ship.readyHarpoons ?? 8) > 0) {
          const harpoonRange = ship.harpoonRange || 4500;
          const inRangeWarships = this.enemyShips
            .filter((s) => !s.isSunk && !this.isSubmarine(s) && dist(ship.pos, s.pos) <= harpoonRange)
            .sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
          if (inRangeWarships.length > 0) {
            this.firePlayerSurfaceAshmSalvo(ship, inRangeWarships);
          }
        }
      }

      // 3c. 戰艦 Iowa / 驅逐艦 Spruance 艦載 BGM-109 戰斧巡弋飛彈 (TASM 對艦 / TLAM 對陸)
      if (ship.type === 'bb_iowa_mod' || ship.type === 'dd_spruance') {
        if (ship.rocketCooldown !== undefined && ship.rocketCooldown > 0) {
          ship.rocketCooldown = Math.max(0, ship.rocketCooldown - dt);
        }
        if ((ship.rocketCooldown || 0) <= 0) {
          const targetWarship = this.enemyShips.find((s) => !s.isSunk && !this.isSubmarine(s) && dist(ship.pos, s.pos) <= 5500);
          if (targetWarship) {
            this.fireTomahawkCruiseMissile(ship, targetWarship.pos, targetWarship);
            ship.rocketCooldown = 35.0;
          } else {
            // 對陸打擊敵方 HQ 或 S-300 雷達陣地
            for (const isl of this.islands) {
              const enemyTargetInst = isl.installations.find(
                (inst) => !inst.isDestroyed && inst.side === 'enemy' && (inst.type === 'command_post' || inst.type === 'radar_station' || inst.type === 's300_sam_site' || inst.type === 'airfield') && dist(ship.pos, inst.pos) <= 6000
              );
              if (enemyTargetInst) {
                this.fireTomahawkCruiseMissile(ship, enemyTargetInst.pos, enemyTargetInst);
                ship.rocketCooldown = 38.0;
                break;
              }
            }
          }
        }
      }

      // 3d. 時代五 Mk 36 SRBOC 艦載干擾絲箔條 (Chaff) 與熱焰誘餌彈 (Flare)
      if (ship.hasChaffLauncher || ship.hasCIWS || ship.type === 'bb_iowa_mod') {
        if (ship.chaffCooldown !== undefined && ship.chaffCooldown > 0) {
          ship.chaffCooldown = Math.max(0, ship.chaffCooldown - dt);
        }
        if ((ship.chaffCooldown || 0) <= 0) {
          const incomingThreat = this.projectiles.find(
            (p) => !p.isDead && p.side === 'enemy' && (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm') && dist(ship.pos, p.pos) <= 1200
          );
          if (incomingThreat) {
            ship.chaffCooldown = 16.0;
            soundEngine.playPlaneSortie();

            const cloudAngle = (incomingThreat.heading || 0) + Math.PI * 0.45;
            const cloudPos = {
              x: ship.pos.x + Math.cos(cloudAngle) * 280,
              y: ship.pos.y + Math.sin(cloudAngle) * 280,
            };

            for (let c = 0; c < 16; c++) {
              this.particles.push({
                id: `srboc-chaff-${Date.now()}-${c}`,
                x: cloudPos.x + (Math.random() - 0.5) * 80,
                y: cloudPos.y + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 5.0,
                maxLife: 5.0,
                radius: 14 + Math.random() * 8,
                color: '#ECEFF1',
                type: 'chaff_cloud',
              });
            }
            for (let f = 0; f < 6; f++) {
              this.particles.push({
                id: `srboc-flare-${Date.now()}-${f}`,
                x: cloudPos.x + (Math.random() - 0.5) * 40,
                y: cloudPos.y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.5) * 18,
                life: 3.5,
                maxLife: 3.5,
                radius: 7,
                color: '#FF6D00',
                type: 'flare',
              });
            }

            if (!incomingThreat.isDecoyed) {
              const decoyChance =
                incomingThreat.type === 'missile_ashm'
                  ? this.getAshmChaffDecoyChance(incomingThreat)
                  : isSupersonicMissile(incomingThreat.speed) || incomingThreat.type === 'missile_ssm'
                  ? 0.45
                  : 0.76;
              if (Math.random() < decoyChance) {
                incomingThreat.isDecoyed = true;
                incomingThreat.decoyTargetPos = { ...cloudPos };
                incomingThreat.targetPos = { ...cloudPos };
                incomingThreat.targetEntityId = undefined;
                if (incomingThreat.isLeadMissile) {
                  this.handleAshmLeaderDestroyed(incomingThreat);
                }
                this.addBannerAlert(`📡【Mk 36 SRBOC 誘騙成功！】「${ship.name}」發射箔條/熱焰干擾彈！成功誘離來襲飛彈！`, 'player', 'alert', 4.5);
                this.addCombatLog({
                  category: 'aa',
                  sourceSide: 'player',
                  sourceName: `${ship.name} (Mk 36 SRBOC)`,
                  targetName: incomingThreat.attackerName || '來襲飛彈',
                  actionType: 'recon_spotted',
                  text: `📡【艦載干擾誘騙】「${ship.name}」齊射 Mk 36 SRBOC 金屬箔條雲與高溫熱焰誘餌！成功誘離來襲「${incomingThreat.attackerName || '飛彈'}」！`,
                });
              }
            }
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // 跨時代地面長程火箭/戰術飛彈與自走砲自動反砲擊引擎 (Eras 2-5)
  // ══════════════════════════════════════════════════════════
  private updateGroundLongRangeAndCounterBattery(): void {
    for (const gUnit of this.groundUnits) {
      if (gUnit.isDestroyed || gUnit.embarkedInShipId || gUnit.cooldown > 0) continue;

      if (gUnit.side === 'enemy' && gUnit.type === 'opfor_scud_tel') {
        const targetShip =
          [...this.playerShips, ...this.alliedShips].find(
            (s) => !s.isSunk && !this.isSubmarine(s) && this.isHostile(gUnit.side, s.side) && dist(gUnit.pos, s.pos) <= 6500
          ) || this.getFlagship();
        if (targetShip && dist(gUnit.pos, targetShip.pos) <= 6500) {
          this.fireScudMissile(gUnit, targetShip.pos, targetShip);
          gUnit.cooldown = gUnit.reloadTime || 30.0;
        }
      } else if (gUnit.side !== 'enemy' && gUnit.type === 'us_m270_atacms') {
        const targetInst = this.islands.flatMap((isl) => isl.installations).find(
          (inst) => !inst.isDestroyed && this.isHostile(gUnit.side, inst.side) && dist(gUnit.pos, inst.pos) <= 6500
        );
        const targetScud = !targetInst ? this.groundUnits.find(
          (gu) => !gu.isDestroyed && this.isHostile(gUnit.side, gu.side) && (gu.type === 'opfor_scud_tel' || gu.type === 'opfor_scud_nuclear' || gu.type === 'opfor_t80b' || gu.type === 'opfor_bm27_uragan') && dist(gUnit.pos, gu.pos) <= 6500
        ) : null;
        const finalTarget = targetInst || targetScud;
        if (finalTarget) {
          this.fireAtacmsMissile(gUnit, finalTarget.pos, finalTarget);
          gUnit.cooldown = gUnit.reloadTime || 32.0;
        }
      } else if (gUnit.side !== 'enemy' && gUnit.type === 'us_m270_mlrs') {
        const targetEnemyGround = this.groundUnits.find(
          (gu) => !gu.isDestroyed && this.isHostile(gUnit.side, gu.side) && dist(gUnit.pos, gu.pos) <= 4500
        );
        if (targetEnemyGround) {
          this.fireM270MLRSSalvo(gUnit, targetEnemyGround.pos, targetEnemyGround);
          gUnit.cooldown = gUnit.reloadTime || 28.0;
        }
      } else if (gUnit.side === 'enemy' && (gUnit.type === 'opfor_bm21_grad' || gUnit.type === 'opfor_bm27_uragan')) {
        const maxR = gUnit.type === 'opfor_bm27_uragan' ? 4800 : 4200;
        const targetPlayerGround = this.groundUnits.find(
          (gu) => !gu.isDestroyed && this.isHostile(gUnit.side, gu.side) && dist(gUnit.pos, gu.pos) <= maxR
        );
        if (targetPlayerGround) {
          this.fireOpforMLRSSalvo(gUnit, targetPlayerGround.pos, targetPlayerGround);
          gUnit.cooldown = gUnit.reloadTime || (gUnit.type === 'opfor_bm27_uragan' ? 30.0 : 26.0);
        }
      } else if (gUnit.side !== 'enemy' && gUnit.type === 'us_m4_calliope') {
        const targetEnemy = this.groundUnits.find(
          (gu) => !gu.isDestroyed && this.isHostile(gUnit.side, gu.side) && dist(gUnit.pos, gu.pos) <= 3200
        ) || this.islands.flatMap((isl) => isl.installations).find(
          (inst) => !inst.isDestroyed && this.isHostile(gUnit.side, inst.side) && dist(gUnit.pos, inst.pos) <= 3200
        );
        if (targetEnemy) {
          this.fireCalliopeMLRSSalvo(gUnit, targetEnemy.pos, targetEnemy);
          gUnit.cooldown = gUnit.reloadTime || 24.0;
        }
      } else if (gUnit.side !== 'enemy' && gUnit.type === 'us_atacms_nuclear') {
        const target = this.islands.flatMap((isl) => isl.installations).find(
          (inst) => !inst.isDestroyed && this.isHostile(gUnit.side, inst.side) && dist(gUnit.pos, inst.pos) <= 6500
        ) || this.groundUnits.find(
          (gu) => !gu.isDestroyed && this.isHostile(gUnit.side, gu.side) && dist(gUnit.pos, gu.pos) <= 6500
        );
        if (target) {
          this.fireNuclearSSMMissile(gUnit, target.pos, target);
          gUnit.cooldown = gUnit.reloadTime || 45.0;
        }
      } else if (gUnit.side === 'enemy' && gUnit.type === 'opfor_scud_nuclear') {
        const targetShip =
          [...this.playerShips, ...this.alliedShips].find(
            (s) => !s.isSunk && !this.isSubmarine(s) && this.isHostile(gUnit.side, s.side) && dist(gUnit.pos, s.pos) <= 6500
          ) || this.getFlagship();
        if (targetShip && dist(gUnit.pos, targetShip.pos) <= 6500) {
          this.fireNuclearSSMMissile(gUnit, targetShip.pos, targetShip);
          gUnit.cooldown = gUnit.reloadTime || 45.0;
        }
      } else if (gUnit.isSPG) {
        // 自走砲 (SPG) 全時代自動化反砲擊系統 (Automated Counter-Battery Radar & Fire Control)
        const spgRange = gUnit.range || (this.era === 'era5' ? 4400 : this.era === 'era4' ? 3900 : 3400);
        const hostileSig = this.artillerySignatures.find(
          (sig) => this.isHostile(gUnit.side, sig.side) && dist(gUnit.pos, sig.pos) <= spgRange && (this.gameTime - sig.timestamp) <= 15
        );
        if (hostileSig) {
          gUnit.heading = Math.atan2(hostileSig.pos.y - gUnit.pos.y, hostileSig.pos.x - gUnit.pos.x);
          gUnit.isCounterBatteryFiring = true;
          this.scheduleAction(3.2, () => {
            if (gUnit) gUnit.isCounterBatteryFiring = false;
          });
          this.executeSPGCounterBattery(gUnit, hostileSig.pos, hostileSig.attackerName);
          gUnit.cooldown = gUnit.reloadTime || 14.0;
        }
      }
    }

    // 清理過期的砲兵聲測/雷達軌跡特徵 (> 18s)
    if (this.artillerySignatures.length > 0) {
      this.artillerySignatures = this.artillerySignatures.filter((s) => this.gameTime - s.timestamp <= 18);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 砲兵發射聲測/雷達軌跡登錄 (Register Artillery Signatures)
  // ══════════════════════════════════════════════════════════
  public registerArtillerySignature(pos: Vector2D, side: ShipSide, attackerName: string, weaponType: string): void {
    this.artillerySignatures.push({
      id: `sig-${Date.now()}-${Math.random()}`,
      pos: { ...pos },
      side,
      attackerName,
      timestamp: this.gameTime,
      weaponType,
    });
    if (this.artillerySignatures.length > 50) {
      this.artillerySignatures.shift();
    }
  }

  // ══════════════════════════════════════════════════════════
  // 自走砲 (SPG) 自動化反砲擊急速射 (3-Round Rapid Counter-Battery Barrage)
  // ══════════════════════════════════════════════════════════
  private executeSPGCounterBattery(spg: GroundUnit, targetPos: Vector2D, enemyGunName: string) {
    soundEngine.playGunSalvo(false);
    this.registerArtillerySignature(spg.pos, spg.side, spg.name, spg.type);

    for (let r = 0; r < 3; r++) {
      this.scheduleAction(r * 0.7, () => {
        if (!spg || spg.isDestroyed) return;
        soundEngine.playGunSalvo(false);
        const spread: Vector2D = {
          x: targetPos.x + (Math.random() - 0.5) * 55,
          y: targetPos.y + (Math.random() - 0.5) * 55,
        };
        const d = Math.max(1, dist(spg.pos, spread));
        const pSpeed = 620;
        this.projectiles.push({
          id: `spg-cb-${Date.now()}-${r}-${Math.random()}`,
          type: 'shell',
          side: spg.side,
          pos: { ...spg.pos },
          vel: {
            x: ((spread.x - spg.pos.x) / d) * pSpeed,
            y: ((spread.y - spg.pos.y) / d) * pSpeed,
          },
          originPos: { ...spg.pos },
          targetPos: spread,
          flightProgress: 0,
          maxDistance: d,
          distanceTraveled: 0,
          damage: Math.round(spg.damage * 1.25),
          blastRadius: 32,
          speed: pSpeed,
          heading: Math.atan2(spread.y - spg.pos.y, spread.x - spg.pos.x),
          isDead: false,
          trail: [],
          attackerName: `${spg.name} 【反砲兵急速射】`,
        });
      });
    }

    if (spg.side === 'player' || spg.side === 'allied') {
      this.addBannerAlert(
        `🎯💥【反砲兵雷達鎖定！】我軍「${spg.name}」捕獲「${enemyGunName}」射擊軌跡！立即實施 3 連發急速壓制反砲擊！`,
        'player',
        'alert',
        5.0
      );
    }
    this.addCombatLog({
      category: 'naval',
      sourceSide: spg.side,
      sourceName: spg.name,
      targetName: enemyGunName,
      actionType: 'gun_hit',
      isCrit: true,
      text: `🎯💥【精密反砲擊作戰 (Counter-Battery)】「${spg.name}」依據砲位聲測與雷達火控數據，對「${enemyGunName}」陣地急速齊射 3 發高爆榴彈實施覆蓋壓制！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // M4A3 薛曼「管風琴」60聯裝飽和火箭齊射 (Sherman Calliope MLRS Salvo)
  // ══════════════════════════════════════════════════════════
  private fireCalliopeMLRSSalvo(launcher: GroundUnit, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    soundEngine.playRocketWhoosh();
    this.registerArtillerySignature(launcher.pos, launcher.side, launcher.name, 'us_m4_calliope');
    const rocketCount = 18; // 18x 4.5" M8 rockets in 60-tube rack salvo
    for (let r = 0; r < rocketCount; r++) {
      this.scheduleAction(r * 0.095, () => {
        if (!launcher || launcher.isDestroyed) return;
        const impactSpread: Vector2D = {
          x: targetPos.x + (Math.random() - 0.5) * 140,
          y: targetPos.y + (Math.random() - 0.5) * 140,
        };
        const d = dist(launcher.pos, impactSpread);
        const angle = Math.atan2(impactSpread.y - launcher.pos.y, impactSpread.x - launcher.pos.x);
        const speed = 460;
        this.projectiles.push({
          id: `calliope-${Date.now()}-${r}-${Math.random()}`,
          type: 'rocket',
          side: launcher.side,
          pos: { ...launcher.pos },
          vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          originPos: { ...launcher.pos },
          targetPos: impactSpread,
          flightProgress: 0,
          maxDistance: d + 200,
          distanceTraveled: 0,
          damage: 320,
          blastRadius: 28,
          speed,
          heading: angle,
          isDead: false,
          trail: [],
          targetEntityId: targetEntity?.id,
          targetEntityType: 'ground',
          attackerName: `${launcher.name} (T34 管風琴4.5吋火箭)`,
        });
      });
    }
    this.addBannerAlert(`🚀【M4A3 薛曼管風琴火箭齊射！】「${launcher.name}」60聯裝發射架實施飽和火箭覆蓋！鋼鐵之雨洗地！`, launcher.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
  }

  // ══════════════════════════════════════════════════════════
  // 俄亥俄級核潛艦發射三叉戟-D5 SLBM 戰略核突擊 (Ohio SSBN Trident II D5)
  // ══════════════════════════════════════════════════════════
  public fireOhioSSBNTridentStrike(targetPos: Vector2D) {
    soundEngine.playRocketIgnition();
    soundEngine.playKamikazeSiren();
    this.hasPlayerUsedNuke = true;
    const spawnPos: Vector2D = { x: 1200, y: 11000 }; // Submerged Ohio off-map
    const d = dist(spawnPos, targetPos);
    const angle = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);
    const speed = MISSILE_SPEED.trident; // re-entry vehicle terminal plunge
    this.projectiles.push({
      id: `trident-${Date.now()}`,
      type: 'slbm_trident',
      side: 'player',
      pos: { ...spawnPos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...spawnPos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 1000,
      distanceTraveled: 0,
      damage: 280000, // 8x W88 MIRV 475kt each
      blastRadius: 850,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      isNuclear: true,
      isSLBM: true,
      bombType: 'b52_megaton_nuke',
      attackerName: 'USS Ohio (SSBN-726 俄亥俄級核打擊潛艦)',
    });
    this.addBannerAlert('🚨☢️【俄亥俄級戰略核潛艦三叉戟-D5 SLBM 破水升空！】水下垂直發射冷發射點火！8枚 W88 分導核彈頭 (MIRV) 極速砸向目標！觸發華約最高核報復！', 'player', 'sunk', 9.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: 'USS Ohio (SSBN-726 戰略核潛艦)',
      targetName: '敵方戰區戰略目標群',
      actionType: 'bomb_crit',
      isCrit: true,
      text: '🚨☢️【UGM-133 三叉戟 II D5 潛射洲際彈道飛彈出擊！】水下垂直發射筒冷發射破水點火！8枚 W88 重型熱核分導多彈頭以高超音速俯衝向座標實施毀滅性戰區抹除！',
    });
    this.checkOpforNuclearRetaliation();
  }

  // ══════════════════════════════════════════════════════════
  // 陸基戰術熱核飛彈 (Nuclear-Tipped ATACMS / Scud TEL)
  // ══════════════════════════════════════════════════════════
  private fireNuclearSSMMissile(launcher: GroundUnit, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    soundEngine.playKamikazeSiren();
    this.registerArtillerySignature(launcher.pos, launcher.side, launcher.name, launcher.type);
    const d = dist(launcher.pos, targetPos);
    const angle = Math.atan2(targetPos.y - launcher.pos.y, targetPos.x - launcher.pos.x);
    const speed = MISSILE_SPEED.lance;
    const isAtacms = launcher.type === 'us_atacms_nuclear' || launcher.side !== 'enemy';

    this.projectiles.push({
      id: `nuke-ssm-${Date.now()}-${Math.random()}`,
      type: 'missile_ssm',
      side: launcher.side,
      pos: { ...launcher.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...launcher.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 1200,
      distanceTraveled: 0,
      damage: 180000,
      blastRadius: 420,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      isAtacms,
      isNuclear: true,
      bombType: isAtacms ? 'b52_megaton_nuke' : 'opfor_tactical_nuke',
      targetEntityId: targetEntity?.id,
      targetEntityType: targetEntity && 'type' in targetEntity && !('role' in targetEntity) && !('category' in targetEntity) ? 'ship' : 'installation',
      guidanceType: 'command_radar',
      turnRate: 2.2,
      attackerName: isAtacms
        ? `${launcher.name} (MGM-140B 戰術熱核飛彈)`
        : `${launcher.name} (9K72 戰術核彈道飛彈)`,
    });

    if (isAtacms) {
      this.hasPlayerUsedNuke = true;
      this.addBannerAlert(`🚨☢️【戰術熱核飛彈起豎發射！】我軍「${launcher.name}」發射 W70/W85 熱核彈頭戰術彈道飛彈！直撲敵核心防區！華約將啟動核報復！`, 'player', 'sunk', 8.0);
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: launcher.name,
        targetName: targetEntity?.name || '敵軍核心戰略陣地',
        actionType: 'bomb_crit',
        isCrit: true,
        text: `🚨☢️【戰術核突擊】「${launcher.name}」起豎點火發射 MGM-140B 戰術核飛彈！搭載 50kt 當量熱核彈頭，以 Mach 3.8 終端俯衝實施極限抹除！`,
      });
      this.checkOpforNuclearRetaliation();
    } else {
      this.addBannerAlert(`🚨☢️【極度危險！OPFOR 戰術核彈道飛彈發射！】敵方「${launcher.name}」點火發射 10kt 戰術核彈頭！全軍防空飛彈全力實施末端攔截！`, 'enemy', 'sunk', 8.5);
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: launcher.name,
        targetName: targetEntity?.name || '美軍主力陣地或艦隊',
        actionType: 'bomb_crit',
        isCrit: true,
        text: `🚨☢️【敵軍戰術核突擊】「${launcher.name}」發射搭載核彈頭之 9K72 飛毛腿飛彈！高仰角俯衝逼近，唯有 PAC-2 / SM-2 具備末端攔截機會！`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代五現代化陸基與潛射戰術火箭/飛彈發射方法 (Era 5 Tactical Rockets & Missiles)
  // ══════════════════════════════════════════════════════════

  private fireAtacmsMissile(launcher: GroundUnit, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    this.registerArtillerySignature(launcher.pos, launcher.side, launcher.name, launcher.type);
    const d = dist(launcher.pos, targetPos);
    const angle = Math.atan2(targetPos.y - launcher.pos.y, targetPos.x - launcher.pos.x);
    const speed = MISSILE_SPEED.atacms; // Mach 3 terminal

    this.projectiles.push({
      id: `atacms-${Date.now()}-${Math.random()}`,
      type: 'missile_ssm',
      side: launcher.side,
      pos: { ...launcher.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...launcher.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 1000,
      distanceTraveled: 0,
      damage: 2400, // M57 Bunker Buster massive penetration warhead
      blastRadius: 75,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      isAtacms: true,
      isBunkerBuster: true,
      targetEntityId: targetEntity?.id,
      targetEntityType: targetEntity && 'type' in targetEntity && !('role' in targetEntity) && !('category' in targetEntity) ? 'ship' : 'installation',
      guidanceType: 'command_radar',
      turnRate: 2.4,
      attackerName: `${launcher.name} (MGM-140 ATACMS 戰術彈道飛彈)`,
    });

    this.addBannerAlert(`🇺🇸🚀【MGM-140 ATACMS 戰術飛彈點火起豎！】我軍「${launcher.name}」發射 M57 碉堡剋星戰術彈道飛彈！Mach 3.5 終端貫穿摧毀目標要塞！`, launcher.side === 'enemy' ? 'enemy' : 'player', 'alert', 6.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: launcher.side,
      sourceName: launcher.name,
      targetName: targetEntity?.name || '敵軍戰略工事或陣地',
      actionType: 'recon_spotted',
      text: `🇺🇸🚀【MGM-140 ATACMS 戰術飛彈突擊】「${launcher.name}」點火發射重型戰術飛彈！裝備 M57 單一高爆穿甲碉堡剋星彈頭，以 Mach 3.5 終端俯衝精準毀滅 6500m 外之高威脅敵方陣地！`,
    });
  }

  private fireM270MLRSSalvo(launcher: GroundUnit, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    soundEngine.playRocketWhoosh();
    this.registerArtillerySignature(launcher.pos, launcher.side, launcher.name, launcher.type);
    const rocketCount = 12; // 12x 227mm M39 rockets

    for (let r = 0; r < rocketCount; r++) {
      this.scheduleAction(r * 0.09, () => {
        if (!launcher || launcher.isDestroyed) return;
        const impactSpread: Vector2D = {
          x: targetPos.x + (Math.random() - 0.5) * 110,
          y: targetPos.y + (Math.random() - 0.5) * 110,
        };
        const curD = dist(launcher.pos, impactSpread);
        const curAngle = Math.atan2(impactSpread.y - launcher.pos.y, impactSpread.x - launcher.pos.x);
        const speed = 460 + Math.random() * 60;

        this.projectiles.push({
          id: `m270-rkt-${Date.now()}-${r}-${Math.random()}`,
          type: 'rocket',
          side: launcher.side,
          pos: {
            x: launcher.pos.x + (Math.random() - 0.5) * 8,
            y: launcher.pos.y + (Math.random() - 0.5) * 8,
          },
          vel: { x: Math.cos(curAngle) * speed, y: Math.sin(curAngle) * speed },
          originPos: { ...launcher.pos },
          targetPos: impactSpread,
          flightProgress: 0,
          maxDistance: curD + 200,
          distanceTraveled: 0,
          damage: 380,
          blastRadius: 40,
          speed,
          heading: curAngle,
          isDead: false,
          trail: [],
          isMLRS: true,
          isClusterSubmunition: true,
          clusterBombletsCount: 8,
          targetEntityId: targetEntity?.id,
          targetEntityType: 'ground',
          attackerName: `${launcher.name} (227mm M39 DPICM 集束火箭)`,
        });
      });
    }

    this.addBannerAlert(`🇺🇸💥【M270「鋼鐵之雨」連環齊射！】我軍「${launcher.name}」向目標發射 12枚 227mm M39 集束子母彈火箭群！`, launcher.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: launcher.side,
      sourceName: launcher.name,
      targetName: targetEntity?.name || '敵軍地面縱隊',
      actionType: 'gun_hit',
      damage: 4560,
      text: `🇺🇸💥【M270 MLRS 鋼鐵之雨飽和打擊】「${launcher.name}」雙聯六管發射箱全速齊射 12枚 227mm 火箭，每枚拋撒數百枚 M39 DPICM 集束子母彈，對目標區實施滅頂覆蓋！`,
    });
  }

  private fireOpforMLRSSalvo(launcher: GroundUnit, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    soundEngine.playRocketWhoosh();
    this.registerArtillerySignature(launcher.pos, launcher.side, launcher.name, launcher.type);
    const isUragan = launcher.type === 'opfor_bm27_uragan';
    const rocketCount = isUragan ? 12 : 16;
    const rocketCaliber = isUragan ? '220mm 9M27' : '122mm 9M22U';
    const rocketDmg = isUragan ? 520 : 320;

    for (let r = 0; r < rocketCount; r++) {
      this.scheduleAction(r * 0.08, () => {
        if (!launcher || launcher.isDestroyed) return;
        const impactSpread: Vector2D = {
          x: targetPos.x + (Math.random() - 0.5) * 120,
          y: targetPos.y + (Math.random() - 0.5) * 120,
        };
        const curD = dist(launcher.pos, impactSpread);
        const curAngle = Math.atan2(impactSpread.y - launcher.pos.y, impactSpread.x - launcher.pos.x);
        const speed = 440 + Math.random() * 50;

        this.projectiles.push({
          id: `opfor-mlrs-${Date.now()}-${r}-${Math.random()}`,
          type: 'rocket',
          side: 'enemy',
          pos: {
            x: launcher.pos.x + (Math.random() - 0.5) * 8,
            y: launcher.pos.y + (Math.random() - 0.5) * 8,
          },
          vel: { x: Math.cos(curAngle) * speed, y: Math.sin(curAngle) * speed },
          originPos: { ...launcher.pos },
          targetPos: impactSpread,
          flightProgress: 0,
          maxDistance: curD + 200,
          distanceTraveled: 0,
          damage: rocketDmg,
          blastRadius: 36,
          speed,
          heading: curAngle,
          isDead: false,
          trail: [],
          isMLRS: true,
          targetEntityId: targetEntity?.id,
          targetEntityType: 'ground',
          attackerName: `${launcher.name} (${rocketCaliber} 飽和火箭)`,
        });
      });
    }

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: launcher.name,
      targetName: targetEntity?.name || '我軍搶灘登陸陣地',
      actionType: 'gun_hit',
      damage: rocketDmg * rocketCount,
      text: `🚨💥【敵軍多管火箭砲兵齊射】「${launcher.name}」向我方陣地連環發射 ${rocketCount}枚 ${rocketCaliber} 高爆火箭彈幕，實施飽和反砲兵覆蓋打擊！`,
    });
  }

  private fireScudMissile(launcher: GroundUnit | Installation, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    this.registerArtillerySignature(launcher.pos, 'enemy', launcher.name, 'scud');
    const d = dist(launcher.pos, targetPos);
    const angle = Math.atan2(targetPos.y - launcher.pos.y, targetPos.x - launcher.pos.x);
    const speed = MISSILE_SPEED.scud; // Mach 4.5 terminal

    this.projectiles.push({
      id: `scud-${Date.now()}-${Math.random()}`,
      type: 'missile_ssm',
      side: 'enemy',
      pos: { ...launcher.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...launcher.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 1000,
      distanceTraveled: 0,
      damage: 1400,
      blastRadius: 85,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetEntity?.id,
      targetEntityType: targetEntity && 'type' in targetEntity && !('role' in targetEntity) && !('category' in targetEntity) ? 'ship' : 'installation',
      guidanceType: 'command_radar',
      turnRate: 2.2,
      attackerName: `${launcher.name} (9K72 飛毛腿-B 戰術彈道飛彈)`,
    });

    this.addBannerAlert(`🚨🚀【9K72 飛毛腿彈道飛彈發射！】敵方「${launcher.name}」起豎點火發射重型彈道飛彈！Mach 4.5 極速突入，高威脅毀滅性彈頭！`, 'enemy', 'alert', 6.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: launcher.name,
      targetName: targetEntity?.name || '我軍艦隊或防線',
      actionType: 'recon_spotted',
      text: `🚨🚀【飛毛腿-B 戰術彈道飛彈突擊】「${launcher.name}」發射 8K14 (SS-1C Scud-B) 戰術彈道飛彈！高拋物線重力加速度俯衝，裝藥 985kg 烈性炸藥，唯有愛國者 (PAC-2) 或神盾 (SM-2) 能在末端實施反導攔截！`,
    });
  }

  private fireSubHarpoon(sub: Ship, targetShip: Ship) {
    soundEngine.playTorpedoLaunch();
    soundEngine.playRocketIgnition();
    if (this.isSubmarine(sub)) {
      this.revealSubmarine(sub, 14.0, 'firing', sub.name);
    }
    const d = dist(sub.pos, targetShip.pos);
    const angle = Math.atan2(targetShip.pos.y - sub.pos.y, targetShip.pos.x - sub.pos.x);
    const speed = MISSILE_SPEED.harpoon;

    soundEngine.playWaterSplash();
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: `sub-h-splash-${Date.now()}-${i}`,
        x: sub.pos.x + (Math.random() - 0.5) * 20,
        y: sub.pos.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 0.8,
        maxLife: 0.8,
        radius: 16,
        color: '#E0F7FA',
        type: 'geyser',
        shape: 'ring',
      });
    }

    this.projectiles.push({
      id: `ugm84-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: sub.side,
      pos: { ...sub.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...sub.pos },
      targetPos: { ...targetShip.pos },
      flightProgress: 0,
      maxDistance: d + 600,
      distanceTraveled: 0,
      damage: 2500,
      blastRadius: 60,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetShip.id,
      targetEntityType: 'ship',
      guidanceType: 'active_radar',
      turnRate: 3.8,
      attackerName: `${sub.name} (UGM-84 潛射魚叉反艦飛彈)`,
      isSeaSkimming: true,
      ashmVariant: 'harpoon_ugm84',
      ashmProfile: 'pop_up_dive',
      missileAltitude: 0.16,
      missileHealth: 130,
      maxMissileHealth: 130,
    });

    this.addBannerAlert(`🌊🚀【UGM-84 潛射魚叉破浪點火！】「${sub.name}」水下膠囊彈出海面！固態火箭助推器點火升空，掠海撲向「${targetShip.name}」！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: sub.side,
      sourceName: sub.name,
      targetName: targetShip.name,
      actionType: 'recon_spotted',
      text: `🌊🚀【UGM-84 潛射魚叉掠海反艦】「${sub.name}」自 533mm 魚雷管釋放封裝膠囊！膠囊浮出水面點火破殼，飛彈以 500 節高速展開主動雷達掠海突擊！`,
    });
  }

  private fireMk48Torpedo(sub: Ship, target: Ship) {
    soundEngine.playTorpedoLaunch();
    if (this.isSubmarine(sub)) {
      this.revealSubmarine(sub, 14.0, 'firing', sub.name);
    }
    const d = dist(sub.pos, target.pos);
    const angle = Math.atan2(target.pos.y - sub.pos.y, target.pos.x - sub.pos.x);
    const speed = 340;

    this.projectiles.push({
      id: `mk48-${Date.now()}-${Math.random()}`,
      type: 'torpedo',
      side: sub.side,
      pos: { ...sub.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...sub.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 800,
      distanceTraveled: 0,
      damage: 3200,
      blastRadius: 65,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: 'ship',
      isAcousticHoming: true,
      attackerName: `${sub.name} (Mk 48 ADCAP 線導重型魚雷)`,
    });

    this.addCombatLog({
      category: 'naval',
      sourceSide: sub.side,
      sourceName: sub.name,
      targetName: target.name,
      actionType: 'torpedo_hit',
      text: `🐟【Mk 48 ADCAP 重型魚雷出管】「${sub.name}」線導光纖引導 Mk 48 ADCAP 聲自導重型魚雷！55節水中航速直穿水線以下，專門毀滅敵主力艦艦底龍骨！`,
    });
  }

  private fireTomahawkCruiseMissile(origin: Ship | Installation, targetPos: Vector2D, targetEntity?: CombatTargetEntity) {
    soundEngine.playRocketIgnition();
    if ('maxSpeed' in origin && this.isSubmarine(origin as Ship)) {
      this.revealSubmarine(origin as Ship, 14.0, 'firing', origin.name);
    }
    const attackerName = `${origin.name} (BGM-109 / UGM-109 戰斧巡弋飛彈)`;
    const d = dist(origin.pos, targetPos);
    const angle = Math.atan2(targetPos.y - origin.pos.y, targetPos.x - origin.pos.x);
    const speed = MISSILE_SPEED.tomahawk;

    this.projectiles.push({
      id: `tlam-${Date.now()}-${Math.random()}`,
      type: 'missile_cruise',
      side: origin.side,
      pos: { ...origin.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...origin.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 1200,
      distanceTraveled: 0,
      damage: 3600,
      blastRadius: 75,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      attackerName,
      targetEntityId: targetEntity?.id,
      targetEntityType: targetEntity && 'type' in targetEntity && !('role' in targetEntity) && !('category' in targetEntity) ? 'ship' : 'installation',
      guidanceType: 'active_radar',
      turnRate: 3.2,
    });

    this.addBannerAlert(`🚀【BGM-109 戰斧巡弋飛彈升空！】「${origin.name}」發射遠程巡弋飛彈！地圖匹配導航 (TERCOM) 低空穿透，精準外科手術突擊！`, origin.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: origin.side,
      sourceName: origin.name,
      targetName: targetEntity?.name || '敵戰略據點/作戰中心',
      actionType: 'recon_spotted',
      text: `🚀【戰斧巡弋飛彈超視距打擊】「${origin.name}」發射戰斧巡弋飛彈！渦輪扇發動機點火，以 510 航速沿預設航路點實施 6000m 跨地平線精準點穴斬首！`,
    });
  }

  private fireSovietSubSalvo(
    sub: Ship,
    targetShip: Ship,
    salvoOverride?: number,
    extraTargets?: Ship[],
    baseDelay: number = 0,
    suppressPerShipBanner: boolean = false
  ) {
    soundEngine.playKlaxon();
    soundEngine.playRocketIgnition();
    if (this.isSubmarine(sub)) {
      this.revealSubmarine(sub, 14.0, 'firing', sub.name);
    }

    const requested = salvoOverride ?? (this.era === 'era5' ? getShipAshmFit(sub.type)?.salvo ?? 16 : 4);
    const salvoCount = sub.ashmReady !== undefined ? Math.min(requested, sub.ashmReady) : requested;
    if (salvoCount <= 0) return;
    if (sub.ashmReady !== undefined) sub.ashmReady -= salvoCount;
    const speed = MISSILE_SPEED.granit;
    const dmg = 3100;
    const targetPool = extraTargets && extraTargets.length > 0 ? extraTargets : [targetShip];

    this.scheduleStaggeredMissileLaunch(sub, targetPool, salvoCount, {
      missileType: 'missile_ashm',
      missileName: 'P-700 花崗岩潛射重型反艦飛彈',
      speed,
      damage: dmg,
      blastRadius: 75,
      isSeaSkimming: true,
      spreadAngle: 0.055,
      baseDelay,
      staggerInterval: 0.15,
      ashmVariant: 'p700_granit',
      ashmProfile: 'datalink_follower',
      leadMissileIndex: 0,
      turnRate: 3.8,
    });

    if (!suppressPerShipBanner) {
      this.addBannerAlert(`🚨【奧斯卡級水下飽和反艦飛彈破水齊射！】敵「${sub.name}」水下傾斜發射井連續噴湧 ${salvoCount} 枚 P-700 花崗岩超音速重型飛彈群！領航彈攀升開機引導，特混艦隊防空火網立即攔截！`, 'enemy', 'alert', 7.5);
    }
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: sub.name,
      targetName: targetShip.name,
      actionType: 'recon_spotted',
      text: `🚨【奧斯卡核潛艇水下飽和狼群突擊】奧斯卡級 SSGN「${sub.name}」啟動傾斜發射井齊射 ${salvoCount} 枚 P-700 花崗岩巡弋飛彈！首枚領航彈爬升至高空開啟主動雷達，透過資料鏈引導其餘 ${Math.max(0, salvoCount - 1)} 枚超低空掠海突防！`,
    });
  }

  private fireWakeHomingTorpedo(sub: Ship, target: Ship) {
    soundEngine.playTorpedoLaunch();
    if (this.isSubmarine(sub)) {
      this.revealSubmarine(sub, 14.0, 'firing', sub.name);
    }
    const d = dist(sub.pos, target.pos);
    const angle = Math.atan2(target.pos.y - sub.pos.y, target.pos.x - sub.pos.x);
    const speed = 330;

    this.projectiles.push({
      id: `torp-5365-${Date.now()}-${Math.random()}`,
      type: 'torpedo',
      side: sub.side,
      pos: { ...sub.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...sub.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 700,
      distanceTraveled: 0,
      damage: 3500,
      blastRadius: 65,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: 'ship',
      isAcousticHoming: true,
      attackerName: `${sub.name} (53-65K 尾流自導重型魚雷)`,
    });
  }

  private firePatriotSAM(inst: Installation, target: Aircraft | Projectile) {
    soundEngine.playRocketIgnition();
    const isAntiMissile = !('model' in target);
    const d = dist(inst.pos, target.pos);
    const angle = Math.atan2(target.pos.y - inst.pos.y, target.pos.x - inst.pos.x);
    const speed = MISSILE_SPEED.patriot;

    this.projectiles.push({
      id: `patriot-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: inst.side || 'player',
      pos: { ...inst.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...inst.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 600,
      distanceTraveled: 0,
      damage: 1300,
      blastRadius: 42,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: isAntiMissile ? 'projectile' : 'aircraft',
      guidanceType: 'command_radar',
      turnRate: 4.8,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${inst.name} (MIM-104 愛國者長程防空/反飛彈)`,
    });

    if (isAntiMissile) {
      const p = target as Projectile;
      const isSSM = p.type === 'missile_ssm';
      const targetLabel = isSSM ? '9K72 飛毛腿-B 戰術彈道飛彈' : '來襲反艦/巡弋飛彈';
      this.addBannerAlert(`🚀【愛國者 ATBM 反飛彈截擊！】「${inst.name}」相控陣雷達導引 PAC-2 極速點火攔截${targetLabel}！`, 'player', 'alert', 5.0);
    }
  }

  private fireS300SAM(inst: Installation, target: Aircraft | Projectile) {
    soundEngine.playRocketIgnition();
    const isAntiMissile = !('model' in target);
    const d = dist(inst.pos, target.pos);
    const angle = Math.atan2(target.pos.y - inst.pos.y, target.pos.x - inst.pos.x);
    const speed = MISSILE_SPEED.s300;

    this.projectiles.push({
      id: `s300-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...inst.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...inst.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 700,
      distanceTraveled: 0,
      damage: 1400,
      blastRadius: 45,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: isAntiMissile ? 'projectile' : 'aircraft',
      guidanceType: 'command_radar',
      turnRate: 4.6,
      attackerName: `${inst.name} (S-300PMU 驕子長程防空飛彈營)`,
    });

    soundEngine.playKlaxon();
    if (isAntiMissile) {
      const p = target as Projectile;
      const isSSM = p.type === 'missile_ssm';
      const targetLabel = isSSM ? 'MGM-140 ATACMS 戰術彈道飛彈' : '我方反艦/巡弋飛彈';
      this.addBannerAlert(`🚨【S-300 PMU 導向飛彈截擊！】敵「${inst.name}」48N6 高超音速防空飛彈發射！攔截 ${targetLabel}！`, 'enemy', 'alert', 5.0);
    } else {
      this.addBannerAlert(`🚨【S-300 長程防空飛彈警報！】敵「${inst.name}」發射 48N6 高超音速防空飛彈！射程 4200m 全面鎖定！`, 'enemy', 'alert', 5.5);
    }
    if (!isAntiMissile && 'state' in target) {
      this.triggerSeadAutoRetaliation(inst, target as Aircraft);
    }
  }

  private fireTunguskaSAM(unit: GroundUnit, target: Aircraft) {
    soundEngine.playRocketIgnition();
    const d = dist(unit.pos, target.pos);
    const angle = Math.atan2(target.pos.y - unit.pos.y, target.pos.x - unit.pos.x);
    const speed = MISSILE_SPEED.tunguska;

    this.projectiles.push({
      id: `tunguska-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...unit.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...unit.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 400,
      distanceTraveled: 0,
      damage: 650,
      blastRadius: 32,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: 'aircraft',
      guidanceType: 'command_radar',
      turnRate: 4.8,
      attackerName: `${unit.name} (2S6 通古斯卡 9M311)`,
    });
    this.triggerSeadAutoRetaliation(unit, target);
  }

  private fireOpforMobileSAM(
    unit: GroundUnit,
    target: Aircraft | Projectile,
    samSystemName: string,
    speed: number,
    damage: number,
    guidanceType: 'command_radar' | 'ir',
    emitsRadar: boolean
  ) {
    soundEngine.playRocketIgnition();
    const isAntiMissile = !('model' in target);
    const d = dist(unit.pos, target.pos);
    const angle = Math.atan2(target.pos.y - unit.pos.y, target.pos.x - unit.pos.x);

    this.projectiles.push({
      id: `opfor-msam-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...unit.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...unit.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 500,
      distanceTraveled: 0,
      damage,
      blastRadius: 36,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: isAntiMissile ? 'projectile' : 'aircraft',
      guidanceType,
      turnRate: 4.9,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${unit.name} (${samSystemName})`,
    });

    if (emitsRadar && !isAntiMissile && 'state' in target) {
      this.triggerSeadAutoRetaliation(unit, target as Aircraft);
    }
  }

  private fireSA3Missile(inst: Installation, targetPlane: Aircraft, radarAssisted: boolean) {
    soundEngine.playRocketIgnition();
    const d = dist(inst.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - inst.pos.y, targetPlane.pos.x - inst.pos.x);
    const speed = MISSILE_SPEED.sa3;

    this.projectiles.push({
      id: `sa3-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...inst.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...inst.pos },
      targetPos: { ...targetPlane.pos },
      flightProgress: 0,
      maxDistance: d + 550,
      distanceTraveled: 0,
      damage: 760,
      blastRadius: 40,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetPlane.id,
      targetEntityType: 'aircraft',
      guidanceType: 'command_radar',
      turnRate: radarAssisted ? 4.4 : 2.2,
      attackerName: `${inst.name} (S-125 涅瓦/伯朝拉 SA-3 Goa)`,
    });

    this.triggerSeadAutoRetaliation(inst, targetPlane);
  }

  private fireSovietShipSAM(ship: Ship, target: Aircraft | Projectile, samModel: string) {
    soundEngine.playRocketWhoosh();
    const isAntiMissile = !('model' in target);
    const d = dist(ship.pos, target.pos);
    const angle = Math.atan2(target.pos.y - ship.pos.y, target.pos.x - ship.pos.x);
    const speed = MISSILE_SPEED.sovietNavalSam;

    this.projectiles.push({
      id: `sov-sam-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: 'enemy',
      pos: { ...ship.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...ship.pos },
      targetPos: { ...target.pos },
      flightProgress: 0,
      maxDistance: d + 600,
      distanceTraveled: 0,
      damage: 850,
      blastRadius: 40,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: target.id,
      targetEntityType: isAntiMissile ? 'projectile' : 'aircraft',
      guidanceType: 'command_radar',
      turnRate: 4.4,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${ship.name} (${samModel})`,
    });

    if (!isAntiMissile && 'state' in target) {
      this.triggerSeadAutoRetaliation(ship, target as Aircraft);
    }

    if (isAntiMissile) {
      const p = target as Projectile;
      const isSSM = p.type === 'missile_ssm';
      const targetLabel = isSSM ? 'MGM-140 ATACMS 戰術飛彈' : '我方反艦/巡弋飛彈';
      this.addCombatLog({
        category: 'aa',
        sourceSide: 'enemy',
        sourceName: `${ship.name} (${samModel})`,
        targetName: targetLabel,
        actionType: 'recon_spotted',
        text: `🚀【蘇艦發射艦空飛彈反擊】「${ship.name}」點火發射 ${samModel}！垂直發射轉向，緊急攔截${targetLabel}！`,
      });
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
    if ((this.era !== 'era4' && this.era !== 'era5') || this.hasOpforRetaliatedNuke) return;

    // Check enemy mainland HQ
    const mainland = this.islands.find((i) => i.id === 'island-mainland');
    const enemyHQ = mainland?.installations.find(
      (i) => (i.id === 'enemy-hq' || i.id === 'enemy-hq-continental') && !i.isDestroyed
    );
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

    const isEra5 = this.era === 'era5';

    const triggerReason = playerNukeTrigger
      ? (isEra5 ? '美軍動用戰術核打擊，蘇聯紅海軍總司令部依預案啟動極限戰術核反擊！' : '美軍動用核武器，蘇聯軍事顧問團下達戰術核反擊指令！')
      : hqThreatened
      ? (isEra5 ? '華約最高統帥部掩體即將失守，波羅的海防區啟動最終核突擊！' : '最高統帥部掩體即將陷落，防區司令部啟動玉石俱焚之絕望核突擊！')
      : blitzTrigger
      ? (isEra5 ? '北約極速突破第三道縱深防線，蘇軍啟動前線戰術核遏制突擊！' : '前線防禦體系遭美軍極速突破，前線陷入崩潰，動用極限核手段遏制！')
      : (isEra5 ? '歐戰陷入 18 分鐘劇烈消耗僵局，蘇聯決定實施重型戰術核巡弋飛彈斬首！' : '戰事陷入 18 分鐘血腥消耗僵局，敵軍決定投擲戰術核武扭轉戰局！');

    this.addBannerAlert(
      `🚨☢️【極度危險！OPFOR ${isEra5 ? '蘇聯超音速戰略核巡弋突擊' : '蘇製戰術核突擊'}！】${triggerReason}`,
      'enemy',
      'sunk',
      9.0
    );

    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯海軍航空兵 遠程核打擊轟炸機團' : 'OPFOR 聯合特種核打擊分隊',
      targetName: '美國海軍特遣艦隊',
      actionType: 'recon_spotted',
      isCrit: true,
      text: isEra5
        ? `🚨☢️【第三次世界大戰核突擊警報】${triggerReason} 敵 1 架 Tu-22M3 逆火超音速戰略轟炸機掛載 Kh-22N 戰術核巡弋飛彈，在 2 架 Su-27 側衛護航下極速逼近！立即以 F-14A 不死鳥飛彈或提康德羅加宙斯盾艦實施遠程外層攔截！`
        : `🚨☢️【戰術核突擊警報】${triggerReason} 敵方 1 架改裝 Il-28 獵犬噴射轟炸機掛載 RDS-4 戰術核航彈在 2 架 MiG-21 護航下全速撲向艦隊！請立即動用防空飛彈 (RIM-2/24/7/Hawk) 或空優戰機全力攔截！`,
    });

    // Spawn Nuclear Bomber
    const flagship = this.getFlagship();
    const spawnPos: Vector2D = { x: 10500, y: 1600 };
    const targetPos: Vector2D = flagship ? { ...flagship.pos } : { x: 3000, y: 8000 };
    const heading = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);

    if (isEra5) {
      const nukePlaneId = `enemy-nuke-tu22m3-${Date.now()}`;
      this.aircraft.push({
        id: nukePlaneId,
        squadronId: `sq-opfor-nuke-${Date.now()}`,
        model: 'tu22m3',
        role: 'level_bomber',
        name: 'OPFOR 戰略核突擊 · Tu-22M3 逆火超音速轟炸機 (掛載 Kh-22N 核巡弋飛彈)',
        side: 'enemy',
        pos: { ...spawnPos },
        vel: { x: Math.cos(heading) * 210, y: Math.sin(heading) * 210 },
        heading,
        targetHeading: heading,
        speed: getAircraftSpeed('tu22m3'),
        maxSpeed: getAircraftSpeed('tu22m3'),
        altitude: 0.96,
        state: 'cruising',
        health: 1600,
        maxHealth: 1600,
        order: { type: 'attack', targetPos },
        hasPayload: true,
        payloadType: 'opfor_tactical_nuke',
        payloadName: 'Kh-22N (AS-4) 超音速核巡弋飛彈 (350kt)',
        shootCooldown: 0,
        gunAmmo: 800,
        maxGunAmmo: 800,
        wingmanOffset: { x: 0, y: 0 },
        flightName: '蘇聯海航 遠程戰略核突擊長機',
      });

      // Spawn 2x Su-27 Flanker Escorts
      for (let e = 0; e < 2; e++) {
        const eOffset = (e === 0 ? -1 : 1) * 35;
        const ePos = {
          x: spawnPos.x + Math.cos(heading + Math.PI / 2) * eOffset,
          y: spawnPos.y + Math.sin(heading + Math.PI / 2) * eOffset,
        };
        this.aircraft.push({
          id: `enemy-escort-su27-${Date.now()}-${e}`,
          squadronId: `sq-opfor-nuke-${Date.now()}`,
          model: 'su27',
          role: 'fighter',
          name: `OPFOR 核武護航機 · Su-27 側衛超音速戰機 (#${e + 1})`,
          side: 'enemy',
          pos: ePos,
          vel: { x: Math.cos(heading) * 195, y: Math.sin(heading) * 195 },
          heading,
          targetHeading: heading,
          speed: getAircraftSpeed('su27'),
          maxSpeed: getAircraftSpeed('su27'),
          altitude: 0.94,
          state: 'cruising',
          health: 720,
          maxHealth: 720,
          order: { type: 'attack', targetPos },
          hasPayload: true,
          payloadType: 'aim9_sidewinder',
          payloadName: 'R-27ER / R-73 空對空飛彈',
          shootCooldown: 0,
          gunAmmo: 300,
          maxGunAmmo: 300,
          wingmanOffset: { x: eOffset, y: 15 },
          flightName: 'Su-27 側衛近衛護航雙機',
        });
      }

      // 蘇聯海軍 Project 941 颱風級戰略核潛艦發射 R-39 (SS-N-20) 潛射洲際彈道飛彈
      const typhoonPos: Vector2D = { x: 12500, y: 1400 };
      const r39Angle = Math.atan2(targetPos.y - typhoonPos.y, targetPos.x - typhoonPos.x);
      const r39Speed = 780;
      this.projectiles.push({
        id: `r39-${Date.now()}`,
        type: 'slbm_r39',
        side: 'enemy',
        pos: { ...typhoonPos },
        vel: { x: Math.cos(r39Angle) * r39Speed, y: Math.sin(r39Angle) * r39Speed },
        originPos: { ...typhoonPos },
        targetPos: { ...targetPos },
        flightProgress: 0,
        maxDistance: dist(typhoonPos, targetPos) + 1200,
        distanceTraveled: 0,
        damage: 260000,
        blastRadius: 800,
        speed: r39Speed,
        heading: r39Angle,
        isDead: false,
        trail: [],
        isNuclear: true,
        isSLBM: true,
        bombType: 'opfor_tactical_nuke',
        attackerName: 'Project 941 Akula/Typhoon (TK-208 颱風級戰略核潛艦)',
      });
      this.addBannerAlert(
        '🚨☢️【相互保證毀滅 (MAD) 蘇聯颱風級核潛艦發射 R-39 重型 SLBM！】蘇聯海軍「TK-208 德米特里·頓斯科伊號」水下發射 10枚 分導核彈頭 (MIRV)！立即以神盾 SM-2 / 愛國者實施極限攔截！',
        'enemy',
        'sunk',
        9.5
      );
      if (mainland) {
        const opforNukeTel = createGroundUnit(
          `opfor-mad-scud-nuke-${Date.now()}`,
          'opfor_scud_nuclear',
          '蘇聯戰略火箭軍 9K72 戰術核飛毛腿發射車',
          'enemy',
          'era5',
          { x: 10800, y: 2800 }
        );
        this.groundUnits.push(opforNukeTel);
      }
    } else {
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
        speed: getAircraftSpeed('il28'),
        maxSpeed: getAircraftSpeed('il28'),
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
          speed: getAircraftSpeed('mig21'),
          maxSpeed: getAircraftSpeed('mig21'),
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
  }

  // ══════════════════════════════════════════════════════════
  // 時代四飛彈發射與作戰執行方法 (Era 4 Missile & Assault Methods)
  // ══════════════════════════════════════════════════════════
  public fireASROC(ship: Ship, targetPos: Vector2D, targetEntityId?: string) {
    soundEngine.playRocketIgnition();
    const standoff = STANDOFF_ASW[ship.standoffAswWeapon ?? 'ASROC'];
    const d = dist(ship.pos, targetPos);
    const angle = Math.atan2(targetPos.y - ship.pos.y, targetPos.x - ship.pos.x);
    const speed = MISSILE_SPEED.asroc;

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
      attackerName: `${ship.name} (${standoff.label})`,
    });

    this.addBannerAlert(`🚀🌊【${standoff.label}發射！】「${ship.name}」${standoff.launcher}發射，獵殺水下潛艦！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: ship.name,
      targetName: '水下目標',
      actionType: 'recon_spotted',
      text: `🚀🌊【${standoff.label}】「${ship.name}」聲納鎖定敵水下音源，${standoff.launcher}將聲導反潛魚雷送往目標海域！`,
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
        attackerName: `${ship.name} (${svttLabel(ship)})`,
      });
    }
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: ship.name,
      targetName: '水下潛艦方位',
      actionType: 'torpedo_hit',
      text: `🌊【${svttLabel(ship)}發射】「${ship.name}」高壓空氣彈射 3 枚聲自導反潛魚雷入水！`,
    });
  }

  public fireChaparralSAM(unit: GroundUnit, targetPlane: Aircraft) {
    soundEngine.playRocketWhoosh();
    const d = dist(unit.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - unit.pos.y, targetPlane.pos.x - unit.pos.x);
    const speed = MISSILE_SPEED.chaparral;
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

  // ══════════════════════════════════════════════════════════
  // 近迫防空火網系統：自動對來襲反艦飛彈 (AShM) 射擊密集火砲彈幕
  // 1. 進入近程範圍 (~800m) 時自動朝飛彈射擊密集彈幕
  // 2. 高速曳光彈流伴隨近炸破片黑煙 (flak_puff) 與警報音效 (klaxon / gun burst)
  // 3. 依火砲口徑射速計算持續累積命中並引爆飛彈
  // ══════════════════════════════════════════════════════════
  private updateAntiShipMissilePointDefense(dt: number) {
    const incomingMissiles = this.projectiles.filter(
      (p) => !p.isDead && (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm')
    );
    if (incomingMissiles.length === 0) return;

    const now = Date.now() / 1000;

    // 初始化各型飛彈結構抗打擊強度 (Structural Integrity vs CIWS Penetrator Barrage)
    for (const missile of incomingMissiles) {
      if (missile.missileHealth === undefined) {
        if (missile.type === 'missile_ssm') {
          missile.missileHealth = 280; // 重型裝甲彈道飛彈 (Scud-B)
          missile.maxMissileHealth = 280;
        } else if (missile.type === 'missile_ashm') {
          const hp = this.getAshmStructuralHealth(missile.ashmVariant, missile.speed);
          missile.missileHealth = hp;
          missile.maxMissileHealth = hp;
        } else if (isSupersonicMissile(missile.speed)) {
          missile.missileHealth = 180;
          missile.maxMissileHealth = 180;
        } else {
          missile.missileHealth = 130;
          missile.maxMissileHealth = 130;
        }
        missile.flakHitAccum = 0;
      }
    }

    // 彙整所有具備近迫防空能力的防禦水面艦 (單艦火控雷達 mount-centric 追瞄)
    const defenders = [...this.playerShips, ...this.enemyShips, ...this.alliedShips].filter((s) => !s.isSunk && !this.isSubmarine(s));

    for (const ship of defenders) {
      const isCiwsCapable =
        ship.hasCIWS ||
        ship.type === 'bb_iowa_mod' ||
        ship.type === 'cg_tico' ||
        ship.type === 'cgn_kirov' ||
        ship.type === 'ffg_ohp' ||
        ship.type === 'ddg_kidd' ||
        ship.type === 'dd_spruance' ||
        ship.type === 'dd_sovremenny' ||
        ship.type === 'dd_udaloy' ||
        ship.type === 'cvn' ||
        ship.type === 'cvhg_kiev' ||
        ship.type === 'cg_slava' ||
        ship.type === 'lha_tarawa';

      const pdRange = isCiwsCapable ? (ship.ciwsRange || 1100) : 800;

      // 篩選進入該艦防禦圈的敵方來襲飛彈威脅
      const hostileMissiles = incomingMissiles.filter(
        (m) => !m.isDead && this.isHostile(ship.side, m.side) && dist(ship.pos, m.pos) <= pdRange
      );

      if (hostileMissiles.length === 0) {
        ship.ciwsTargetId = undefined;
        continue;
      }

      // 史實近迫火控雷達單目標追蹤法則 (Single-Target Engagement Rule: 一次打一顆飛彈):
      // 火控雷達 (Ku波段單脈衝都卜勒) 必須將全部射控能量集中鎖定單一來襲目標，直至擊落或脫離，無法多目標同時分火！
      if (ship.ciwsTargetId) {
        const stillValid = hostileMissiles.find((m) => m.id === ship.ciwsTargetId);
        if (!stillValid || stillValid.isDead || dist(ship.pos, stillValid.pos) > pdRange + 120) {
          ship.ciwsTargetId = undefined;
        }
      }

      // 若當前無鎖定目標，立即挑選最迫近 (威脅度最高) 的首枚飛彈建立射擊雷達鎖定
      if (!ship.ciwsTargetId && hostileMissiles.length > 0) {
        hostileMissiles.sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
        ship.ciwsTargetId = hostileMissiles[0].id;

        // 當飽和齊射逼近時發出近距告警
        if (ship.side === 'player' && now - this.lastMissileAlarmTime > 5.0) {
          this.lastMissileAlarmTime = now;
          soundEngine.playKlaxon();
          const targetM = hostileMissiles[0];
          const isSaturation = hostileMissiles.length >= 3;
          this.addBannerAlert(
            isSaturation
              ? `🚨【飽和飛彈齊射突入近程！】偵測到 ${hostileMissiles.length} 枚飛彈波狀來襲！${ship.name} 近迫火控雷達正專注單點攔截最前導目標！其餘飛彈高速逼近中！`
              : `⚠️【掠海飛彈逼近警告！】${ship.name} 近迫防衛系統 (CIWS/AAA) 鎖定來襲「${targetM.attackerName || '反艦飛彈'}」展開極限攔截！`,
            'player',
            'alert',
            4.5
          );
        }
      }

      const lockedMissile = hostileMissiles.find((m) => m.id === ship.ciwsTargetId);
      if (!lockedMissile || lockedMissile.isDead) {
        ship.ciwsTargetId = undefined;
        continue;
      }

      // 依艦艇歷史火砲口徑、CIWS 座數與穿甲彈規格計算單一目標的專注集中秒傷 (Concentrated Single-Target DPS)
      let baseBarrageDps = 24;
      let gunDesc = '防空高平機砲群';

      if (isCiwsCapable) {
        const isPhalanx = ship.side === 'player' || ship.ciwsType === 'phalanx';
        // Mk 15 方陣 20mm 六管加特林 (4,500發/分 脫殼貧鈾穿甲彈 DU/Tungsten)
        // 蘇聯 AK-630 30mm 六管轉管砲 (5,000發/分 高爆燃燒曳光彈 OF-84)
        baseBarrageDps = isPhalanx ? 175 : 190;
        const mounts = ship.ciwsMounts || (ship.type === 'bb_iowa_mod' ? 4 : ship.type === 'cgn_kirov' ? 8 : 2);
        // 多座 CIWS 相互支援加成
        if (mounts > 1) {
          baseBarrageDps *= (1 + (mounts - 1) * 0.40);
        }
        gunDesc = isPhalanx
          ? `Mk 15 方陣 (Phalanx) 20mm 六管加特林 CIWS (${mounts}座 貧鈾脫殼穿甲彈)`
          : `AK-630 30mm 六管轉管近迫武器系統 (${mounts}座 5,000發/分)`;
      } else if (ship.type === 'ddg') {
        baseBarrageDps = 32;
        gunDesc = 'Mk 42 5吋/54 全自動速射砲與 SPG-51 類比雷達火控';
      } else if (ship.type === 'cg') {
        baseBarrageDps = 30;
        gunDesc = 'Mk 42 5吋自動砲與雙聯 3吋/50 Mk 33 高平快砲';
      } else if (ship.type === 'kashin') {
        baseBarrageDps = 34;
        gunDesc = 'AK-726 76mm 自動艦砲與 AK-230 30mm 機砲群';
      } else if (ship.type === 'osa') {
        baseBarrageDps = 26;
        gunDesc = 'AK-230 雙管 30mm 射控防砲 (2,000發/分)';
      } else {
        baseBarrageDps = 22;
        gunDesc = '艦載防空速射高平砲群';
      }

      // 距離衰減與近距彈幕飽和倍率 (Distance Proximity Multiplier)
      const d = dist(ship.pos, lockedMissile.pos);
      let rangeMultiplier = 0.85;
      if (d <= 350) {
        rangeMultiplier = 1.30;
      } else if (d <= 650) {
        rangeMultiplier = 1.05;
      }

      // 隨機彈道散布率 (Ballistic Dispersion Jitter ~0.85 - 1.15)
      const dispersionJitter = 0.85 + Math.random() * 0.30;
      // P-270 白蛉超音速終端蛇行機動 (S-Weave inside 1150m) 降低近迫火控追蹤率；超低空 Exocet 也略降追蹤穩定性
      const ciwsProfileMult =
        lockedMissile.ashmVariant === 'p270_moskit' && d <= 1150
          ? 0.68
          : lockedMissile.ashmProfile === 'ultra_sea_skim'
          ? 0.85
          : 1.0;

      // 專注集中火力灌注於此單一飛彈目標 (Single-target concentration)
      const ciwsUpgradeMult =
        ship.side === 'player' || ship.side === 'allied'
          ? 1 + 0.15 * (this.fleetUpgrades.aaFirepowerLevel - 1)
          : 1;
      const tickDamage = baseBarrageDps * rangeMultiplier * dispersionJitter * ciwsProfileMult * ciwsUpgradeMult * dt;
      lockedMissile.missileHealth = (lockedMissile.missileHealth ?? 130) - tickDamage;
      lockedMissile.flakHitAccum = (lockedMissile.flakHitAccum || 0) + tickDamage;

      // 火砲射擊特效更新 (曳光彈幕、槍口焰、破片煙雲)
      ship.pointDefenseCooldown = (ship.pointDefenseCooldown || 0) - dt;
      if (ship.pointDefenseCooldown <= 0) {
        ship.pointDefenseCooldown = isCiwsCapable ? 0.08 : 0.12;

        if (now - this.lastAaaBurstSoundTime > 0.10) {
          this.lastAaaBurstSoundTime = now;
          soundEngine.playGunBurst();
          if (Math.random() < 0.40) {
            soundEngine.playFlakBurst();
          }
        }

        // 高速加特林/速射砲曳光彈流，筆直射向被鎖定之單一目標
        const tracerCount = isCiwsCapable ? 5 : 3;
        const dx = lockedMissile.pos.x - ship.pos.x;
        const dy = lockedMissile.pos.y - ship.pos.y;
        const aimDist = Math.hypot(dx, dy);
        const baseAngle = Math.atan2(dy, dx);
        const tracerSpeed = 1100 + Math.random() * 200;

        for (let t = 0; t < tracerCount; t++) {
          const spread = (Math.random() - 0.5) * (isCiwsCapable ? 0.05 : 0.09);
          const tAngle = baseAngle + spread;
          const originX = ship.pos.x + (Math.random() - 0.5) * (ship.width * 0.5);
          const originY = ship.pos.y + (Math.random() - 0.5) * (ship.length * 0.5);

          this.particles.push({
            id: `ciws-tr-${Date.now()}-${t}-${Math.random()}`,
            x: originX,
            y: originY,
            vx: Math.cos(tAngle) * tracerSpeed,
            vy: Math.sin(tAngle) * tracerSpeed,
            life: Math.min(0.65, aimDist / tracerSpeed),
            maxLife: Math.min(0.65, aimDist / tracerSpeed),
            radius: isCiwsCapable ? 2.0 : 2.5,
            length: isCiwsCapable ? 32 : 24,
            color: ship.side === 'player' ? '#FFF59D' : '#FF5252',
            type: 'tracer',
          });
        }

        // 彈頭破片與金屬撞擊火花 (Spark & Metal Fragments on Locked Missile)
        for (let s = 0; s < 3; s++) {
          const shrapAng = Math.random() * Math.PI * 2;
          const shrapSpd = 50 + Math.random() * 90;
          this.particles.push({
            id: `ciws-shrap-${Date.now()}-${s}-${Math.random()}`,
            x: lockedMissile.pos.x + (Math.random() - 0.5) * 10,
            y: lockedMissile.pos.y + (Math.random() - 0.5) * 10,
            vx: Math.cos(shrapAng) * shrapSpd,
            vy: Math.sin(shrapAng) * shrapSpd,
            life: 0.22,
            maxLife: 0.22,
            radius: 1.6,
            color: '#FFE082',
            type: 'spark',
          });
        }
      }

      this.resolvePointDefenseKill(ship, lockedMissile, gunDesc);
    }
  }

  // 累積傷害耗盡：凌空擊碎引爆目標飛彈！(Single-Target Kill Confirmed)
  private resolvePointDefenseKill(ship: Ship, lockedMissile: Projectile, gunDesc: string): void {
    if ((lockedMissile.missileHealth ?? 0) <= 0) {
      lockedMissile.isDead = true;
      soundEngine.playExplosion(false);
      if (lockedMissile.isLeadMissile) {
        this.handleAshmLeaderDestroyed(lockedMissile);
      }

      // 凌空殉爆視覺特效
      this.particles.push({
        id: `ashm-kill-shock-${Date.now()}`,
        x: lockedMissile.pos.x,
        y: lockedMissile.pos.y,
        vx: 0,
        vy: 0,
        life: 0.65,
        maxLife: 0.65,
        radius: 52,
        color: '#FF6D00',
        type: 'shockwave',
        shape: 'ring',
      });

      for (let k = 0; k < 6; k++) {
        this.particles.push({
          id: `ashm-kill-puff-${Date.now()}-${k}`,
          x: lockedMissile.pos.x + (Math.random() - 0.5) * 35,
          y: lockedMissile.pos.y + (Math.random() - 0.5) * 35,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 2.0,
          maxLife: 2.0,
          radius: 22 + Math.random() * 10,
          color: '#161A1E',
          type: 'flak_puff',
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.4,
        });
      }

      for (let sp = 0; sp < 16; sp++) {
        const spAngle = Math.random() * Math.PI * 2;
        const spSpeed = 90 + Math.random() * 160;
        this.particles.push({
          id: `ashm-kill-sp-${Date.now()}-${sp}`,
          x: lockedMissile.pos.x,
          y: lockedMissile.pos.y,
          vx: Math.cos(spAngle) * spSpeed,
          vy: Math.sin(spAngle) * spSpeed,
          life: 0.5,
          maxLife: 0.5,
          radius: 2.4,
          color: sp % 2 === 0 ? '#FFE082' : '#FF3D00',
          type: 'spark',
        });
      }

      const interceptDist = Math.round(dist(ship.pos, lockedMissile.pos));
      const missileName = lockedMissile.attackerName || '來襲掠海飛彈';

      this.addBannerAlert(
        `💥【CIWS 單一火控雷達精準擊落！】「${ship.name}」火控雷達緊咬目標，在艦舷外 ${interceptDist}m 凌空撕碎來襲「${missileName}」！`,
        ship.side === 'player' ? 'player' : 'enemy',
        'alert',
        4.5
      );

      this.addCombatLog({
        category: 'aa',
        sourceSide: ship.side,
        sourceName: `${ship.name} (${gunDesc})`,
        targetName: missileName,
        actionType: 'aa_down',
        text: `💥【CIWS 密集火網凌空引爆】「${ship.name}」單一雷達火控通道精準追瞄！${gunDesc} 傾瀉密集脫殼穿甲彈幕，在艦舷外 ${interceptDist}m 凌空打碎引爆「${missileName}」！火控天線隨即轉向下一威脅！`,
      });

      // 擊落目標後立即釋放鎖定，讓火控雷達在次幀即刻轉向追瞄齊射波次中的下一枚飛彈
      ship.ciwsTargetId = undefined;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 時代五 現代水面艦快砲對空攔截作戰 (Modern Naval Gun Anti-Missile VT Engagement)
  // 史實依據: Mk 45 5吋艦砲、奧托 76mm 快砲、AK-100 / AK-130、Mod 68 100mm 具備近發引信 (VT / HE-CVT / DART)
  // 射程防禦縱深: 1100m ~ 2200m (位於 CIWS 1100m 之外，進入艦砲雷達火控防空包絡)
  // 攔截率: 次音速飛彈約 20%，超音速飛彈約 10%
  // ══════════════════════════════════════════════════════════
  private updateModernNavalGunAA(dt: number) {
    if (this.era !== 'era5' && this.era !== 'era4') return;

    const allGunsCapableShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips].filter(
      (s) =>
        !s.isSunk &&
        !this.isSubmarine(s) &&
        (s.hasModernNavalGunAA ||
          s.type === 'cg_tico' ||
          s.type === 'dd_spruance' ||
          s.type === 'ddg_kidd' ||
          s.type === 'ffg_ohp' ||
          s.type === 'bb_iowa_mod' ||
          s.type === 'cgn_kirov' ||
          s.type === 'dd_sovremenny' ||
          s.type === 'dd_udaloy' ||
          s.type === 'cvhg_kiev' ||
          s.type === 'cg_slava' ||
          s.type === 'destroyer' ||
          s.type === 'cruiser')
    );

    for (const ship of allGunsCapableShips) {
      if (ship.navalGunAACooldown !== undefined && ship.navalGunAACooldown > 0) {
        ship.navalGunAACooldown = Math.max(0, ship.navalGunAACooldown - dt);
      }

      if ((ship.navalGunAACooldown || 0) <= 0) {
        // 搜尋 1100m 至 2200m 距離內來襲的敵對掠海/彈道/巡弋飛彈
        const targetMissile = this.projectiles.find(
          (p) =>
            !p.isDead &&
            (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm' || p.type === 'missile_arm') &&
            this.isHostile(ship.side, p.side) &&
            dist(ship.pos, p.pos) >= 1100 &&
            dist(ship.pos, p.pos) <= 2200
        );

        if (targetMissile) {
          ship.navalGunAACooldown = 1.8 + Math.random() * 0.4; // ~2秒一組對空齊射
          soundEngine.playGunSalvo(false);
          soundEngine.playFlakBurst();

          // 艦砲型號描述
          let gunName = 'Mk 45 5吋/54倍徑 速射艦砲 (VT近發引信)';
          if (ship.type === 'ffg_ohp' || ship.name.includes('Bremen') || ship.name.includes('Asagiri') || ship.name.includes('Hatsuyuki')) {
            gunName = '奧托梅萊拉 76mm 快砲 (DART/HE-CVT 高爆破片)';
          } else if (ship.type === 'cgn_kirov' || ship.type === 'dd_sovremenny') {
            gunName = 'AK-130 雙聯裝 130mm 自動艦砲 (MR-184 雷達射控)';
          } else if (ship.type === 'dd_udaloy') {
            gunName = 'AK-100 100mm 自動速射艦砲';
          } else if (ship.name.includes('Tourville')) {
            gunName = '100mm/55 Mod 68 快砲';
          } else if (ship.name.includes('Sheffield') || ship.name.includes('Gloucester')) {
            gunName = '4.5吋 Mk 8 全自動艦砲';
          } else if (ship.type === 'bb_iowa_mod') {
            gunName = '5吋/38倍徑 Mk 28 兩聯裝高平兩用砲群';
          }

          // 視覺破片彈幕特效 (Flak burst near missile)
          const angle = Math.atan2(targetMissile.pos.y - ship.pos.y, targetMissile.pos.x - ship.pos.x);
          for (let f = 0; f < 3; f++) {
            const burstOffset = (Math.random() - 0.5) * 45;
            this.particles.push({
              id: `gun-aa-flak-${Date.now()}-${f}`,
              x: targetMissile.pos.x + burstOffset,
              y: targetMissile.pos.y + burstOffset,
              vx: Math.cos(angle) * 12,
              vy: Math.sin(angle) * 12,
              life: 0.6,
              maxLife: 0.6,
              radius: 16 + Math.random() * 8,
              color: 'rgba(255, 171, 0, 0.85)',
              type: 'flak_puff',
            });
          }

          // 史實命中率判定 (依反艦飛彈品種與極低空雜波干擾分級)
          let interceptChance = 0.20;
          if (targetMissile.ashmVariant === 'p270_moskit' || targetMissile.ashmVariant === 'kh22_burya') {
            interceptChance = 0.07;
          } else if (targetMissile.ashmVariant === 'p700_granit' || targetMissile.ashmVariant === 'p500_bazalt') {
            interceptChance = targetMissile.isLeadMissile ? 0.16 : 0.10;
          } else if (targetMissile.ashmVariant === 'exocet_mm40' || targetMissile.ashmVariant === 'exocet_mm38') {
            interceptChance = 0.14;
          } else if (targetMissile.ashmVariant === 'p15_styx' || targetMissile.ashmVariant === 'ksr5_kelt') {
            interceptChance = 0.24;
          } else if (isSupersonicMissile(targetMissile.speed) || targetMissile.type === 'missile_ssm') {
            interceptChance = 0.10;
          }
          const roll = Math.random();

          if (roll < interceptChance) {
            targetMissile.isDead = true;
            soundEngine.playExplosion(false);
            if (targetMissile.isLeadMissile) {
              this.handleAshmLeaderDestroyed(targetMissile);
            }

            // 爆破衝擊環
            this.particles.push({
              id: `gun-aa-kill-${Date.now()}`,
              x: targetMissile.pos.x,
              y: targetMissile.pos.y,
              vx: 0,
              vy: 0,
              life: 0.6,
              maxLife: 0.6,
              radius: 40,
              color: '#00E5FF',
              type: 'shockwave',
              shape: 'ring',
            });

            this.addCombatLog({
              category: 'aa',
              sourceSide: ship.side,
              sourceName: `${ship.name} (${gunName})`,
              targetName: targetMissile.attackerName || '來襲掠海飛彈',
              actionType: 'aa_down',
              text: `💥【艦砲對空攔截成功！】「${ship.name}」${gunName} 雷達射控高爆破片，於艦外 ${Math.round(dist(ship.pos, targetMissile.pos))}m 處凌空引爆「${targetMissile.attackerName || '來襲飛彈'}」！`,
            });
          }
        }
      }
    }
  }

  /**
   * One SAM engagement from a ship's historical launcher (see navalMissileSalvos.ts): up to
   * `channels` targets, `perTarget` rounds rippled at each, limited by the magazine where the
   * ship tracks one. The launcher then waits its reload / cadence cycle.
   */
  private launchShipSamSalvo<T>(ship: Ship, targets: T[], fire: (target: T) => void, isAlive: (target: T) => boolean): void {
    const system = getShipSamSystem(ship);
    const magazine = ship.readySAMs;
    let fired = 0;
    targets.slice(0, system.channels).forEach((target, ti) => {
      for (let r = 0; r < system.perTarget; r++) {
        if (magazine !== undefined && fired >= magazine) return;
        fired++;
        this.scheduleAction(ti * 0.12 + r * 0.6, () => {
          if (!ship.isSunk && isAlive(target)) fire(target);
        });
      }
    });
    if (magazine !== undefined) ship.readySAMs = Math.max(0, magazine - fired);
    ship.samCooldown = system.cycle;
  }

  private fireSAM(ship: Ship, target: Aircraft | Projectile, targetType: 'aircraft' | 'projectile') {
    soundEngine.playRocketWhoosh();
    const samModel =
      ship.samModel ||
      (ship.type === 'cg_tico'
        ? 'RIM-66M 神盾標準二型 (SM-2MR)'
        : ship.type === 'cg_virginia'
        ? 'RIM-66C 標準二型 (SM-2MR)'
        : ship.type === 'cg'
        ? 'RIM-2 梗犬 (Terrier)'
        : ship.type === 'ddg_kidd'
        ? 'RIM-66B 標準一型 (SM-1MR)'
        : ship.type === 'ddg'
        ? 'RIM-24 韃靼人 (Tartar)'
        : ship.type === 'ffg_ohp'
        ? 'Mk 13 單臂 SM-1MR'
        : 'RIM-7 海麻雀 (Sea Sparrow)');

    const d = dist(ship.pos, target.pos);
    const launchAngle = Math.atan2(target.pos.y - ship.pos.y, target.pos.x - ship.pos.x);
    const speed = MISSILE_SPEED.standard;

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
    let targetName = '空中目標';
    if (isAntiMissile) {
      const p = target as Projectile;
      if (p.type === 'missile_ssm') {
        targetName = p.attackerName?.includes('ATACMS') || p.side === 'player' || p.side === 'allied'
          ? '來襲 MGM-140 ATACMS 戰術飛彈'
          : '來襲 9K72 飛毛腿-B 彈道飛彈';
      } else if (p.type === 'missile_cruise') {
        targetName = '來襲巡弋飛彈';
      } else if (p.type === 'missile_ashm') {
        targetName = p.attackerName?.includes('花崗岩')
          ? '來襲 P-700 花崗岩超音速反艦飛彈'
          : p.attackerName?.includes('日蝕')
          ? '來襲 P-270 日蝕超音速反艦飛彈'
          : '來襲超音速反艦飛彈';
      } else {
        targetName = '來襲飛彈';
      }
    } else {
      targetName = (target as Aircraft).name || '空中目標';
    }

    this.projectiles.push({
      id: `sam-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: ship.side,
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
      this.addBannerAlert(`🚀【防空飛彈緊急攔截！】「${ship.name}」發射 ${samModel} 攔截${targetName}！`, ship.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
    }
    this.addCombatLog({
      category: 'aa',
      sourceSide: ship.side,
      sourceName: `${ship.name} (${samModel})`,
      targetName,
      actionType: 'recon_spotted',
      text: `🚀【防空飛彈點火升空】「${ship.name}」射控雷達導引發射 ${samModel} 導向飛彈！極速 ${speed} 呼嘯撲向 ${targetName}！`,
    });
  }

  private firePlayerSurfaceAshmSalvo(ship: Ship, targets: Ship[]) {
    if (targets.length === 0) return;
    const isOHP = ship.side === 'player' && ship.type === 'ffg_ohp';
    if (isOHP) {
      this.fireHarpoonMissile(ship, targets[0]);
      ship.harpoonCooldown = 10.0;
      ship.readyHarpoons = Math.max(0, (ship.readyHarpoons ?? 6) - 1);
      return;
    }

    // US doctrine: half the canisters at one surface group, the rest held for the next
    const salvoCount = Math.min(getShipAshmFit(ship.type)?.salvo ?? 4, ship.readyHarpoons ?? 8);
    if (salvoCount <= 0) return;

    soundEngine.playRocketWhoosh();
    this.scheduleStaggeredMissileLaunch(ship, targets, salvoCount, {
      missileType: 'missile_ashm',
      missileName: 'RGM-84 魚叉掠海反艦飛彈',
      speed: MISSILE_SPEED.harpoon,
      damage: 2050,
      blastRadius: 55,
      isSeaSkimming: true,
      spreadAngle: 0.05,
      staggerInterval: 0.17,
      ashmVariant: 'harpoon_rgm84',
      ashmProfile: 'pop_up_dive',
      turnRate: 3.8,
    });

    ship.readyHarpoons = Math.max(0, (ship.readyHarpoons ?? 8) - salvoCount);
    ship.harpoonCooldown = 36.0;

    const primaryTarget = targets[0];
    this.addBannerAlert(
      `🚀【Mk 141 發射箱 ${salvoCount} 枚魚叉齊射！】「${ship.name}」四聯裝發射筒連續點火！掠海撲向「${primaryTarget.name}」！（剩餘 ${ship.readyHarpoons ?? 0} 枚）`,
      'player',
      'alert',
      5.5
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: ship.side,
      sourceName: `${ship.name} (Mk 141 聯裝發射箱)`,
      targetName: targets.length > 1 ? `${primaryTarget.name} 等 ${targets.length} 艦` : primaryTarget.name,
      actionType: 'recon_spotted',
      text: `🚀【RGM-84 魚叉 ${salvoCount} 枚齊射】「${ship.name}」自 Mk 141 四聯裝發射箱依序射出 ${salvoCount} 枚 RGM-84 魚叉反艦飛彈，採低空掠海巡航並於終端躍升俯衝貫穿敵艦！`,
    });
  }

  private fireAlliedShipAShMSalvo(ship: Ship, targets: Ship[]) {
    if (targets.length === 0) return;
    soundEngine.playRocketWhoosh();
    const isMM40 = ship.ashmType === 'exocet_mm40' || ship.name.includes('Tourville');
    const isMM38 = ship.ashmType === 'exocet_mm38' || ship.name.includes('Andromeda');
    const isExocet = isMM40 || isMM38;
    const salvoCount = 4;

    if (isExocet) {
      const variant: AshmVariant = isMM38 ? 'exocet_mm38' : 'exocet_mm40';
      const label = isMM38 ? 'Exocet MM38 飛魚掠海反艦飛彈' : 'Exocet MM40 飛魚超低空反艦飛彈';
      this.scheduleStaggeredMissileLaunch(ship, targets, salvoCount, {
        missileType: 'missile_ashm',
        missileName: label,
        speed: isMM40 ? MISSILE_SPEED.exocetMm40 : MISSILE_SPEED.exocetMm38,
        damage: isMM40 ? 1850 : 1650,
        blastRadius: 48,
        isSeaSkimming: true,
        spreadAngle: 0.045,
        staggerInterval: 0.16,
        ashmVariant: variant,
        ashmProfile: 'ultra_sea_skim',
        turnRate: 4.1,
      });

      this.addBannerAlert(
        `🚀【北約飛魚 (Exocet) 齊射！】盟軍「${ship.name}」發射 ${salvoCount} 枚 ${label}，極限貼浪突防「${targets[0].name}」！`,
        'player',
        'alert',
        5.0
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: ship.side,
        sourceName: `${ship.name} (北約聯軍)`,
        targetName: targets[0].name,
        actionType: 'recon_spotted',
        text: `🚀【Exocet 超低空貼浪突襲】盟軍「${ship.name}」齊射 ${salvoCount} 枚 ${label}！全程緊貼海浪 2 米飛行避開海面雜波雷達鎖定，直切敵艦水線裝甲帶！`,
      });
    } else {
      this.scheduleStaggeredMissileLaunch(ship, targets, salvoCount, {
        missileType: 'missile_ashm',
        missileName: 'RGM-84 魚叉掠海反艦飛彈 (北約/盟軍標準型)',
        speed: MISSILE_SPEED.harpoon,
        damage: 2050,
        blastRadius: 55,
        isSeaSkimming: true,
        spreadAngle: 0.05,
        staggerInterval: 0.17,
        ashmVariant: 'harpoon_rgm84',
        ashmProfile: 'pop_up_dive',
        turnRate: 3.8,
      });

      this.addCombatLog({
        category: 'naval',
        sourceSide: ship.side,
        sourceName: `${ship.name} (盟軍艦隊)`,
        targetName: targets[0].name,
        actionType: 'recon_spotted',
        text: `🚀【盟軍 RGM-84 魚叉四聯裝齊射】盟軍「${ship.name}」齊射 ${salvoCount} 枚 RGM-84 魚叉掠海反艦飛彈協同反艦，直撲「${targets[0].name}」！`,
      });
    }
  }

  private fireHarpoonMissile(ship: Ship | Installation, targetShip: Ship) {
    soundEngine.playRocketWhoosh();
    const d = dist(ship.pos, targetShip.pos);
    const angle = Math.atan2(targetShip.pos.y - ship.pos.y, targetShip.pos.x - ship.pos.x);
    const speed = MISSILE_SPEED.harpoon;
    const isSingleArmOHP = 'type' in ship && ship.type === 'ffg_ohp' && ship.side === 'player';

    this.projectiles.push({
      id: `harpoon-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: ship.side,
      pos: { ...ship.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...ship.pos },
      targetPos: { ...targetShip.pos },
      flightProgress: 0,
      maxDistance: d + 700,
      distanceTraveled: 0,
      damage: 2050,
      blastRadius: 55,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetShip.id,
      targetEntityType: 'ship',
      guidanceType: 'active_radar',
      turnRate: 3.8,
      attackerName: isSingleArmOHP
        ? `${ship.name} (Mk 13 單臂 RGM-84 魚叉反艦飛彈)`
        : `${ship.name} (RGM-84 魚叉掠海反艦飛彈)`,
      isSeaSkimming: true,
      ashmVariant: 'harpoon_rgm84',
      ashmProfile: 'pop_up_dive',
      missileAltitude: 0.18,
      missileHealth: 130,
      maxMissileHealth: 130,
    });

    this.addBannerAlert(
      isSingleArmOHP
        ? `🚀【Mk 13 單臂魚叉點火！】「${ship.name}」單臂旋轉發射架射出 RGM-84 魚叉飛彈鎖定「${targetShip.name}」！`
        : `🚀【RGM-84 魚叉反艦飛彈點火發射】「${ship.name}」岸防/艦載發射箱呼嘯起飛！鎖定「${targetShip.name}」！`,
      'player',
      'alert',
      4.5
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: ship.side,
      sourceName: ship.name,
      targetName: targetShip.name,
      actionType: 'recon_spotted',
      text: isSingleArmOHP
        ? `🚀【Mk 13 單臂單發魚叉】派里級「${ship.name}」快速旋轉單臂發射架射出 1 枚 RGM-84 魚叉掠海反艦飛彈，低空突防並於終端躍升俯衝！`
        : `🚀【RGM-84 魚叉掠海反艦飛彈】「${ship.name}」發射魚叉反艦飛彈進入低空掠海突防模式！`,
    });
  }

  private fireSovietSaturationSalvo(
    eShip: Ship | Installation,
    targetShip: Ship,
    salvoOverride?: number,
    extraTargets?: Ship[],
    baseDelay: number = 0,
    suppressPerShipBanner: boolean = false
  ) {
    soundEngine.playRocketIgnition();
    soundEngine.playKlaxon();
    if ('isSunk' in eShip && this.isSubmarine(eShip)) {
      this.revealSubmarine(eShip, 14.0, 'firing', eShip.name);
    }

    const isGranit = 'isSunk' in eShip && (eShip.type === 'cgn_kirov' || eShip.type === 'ssgn_oscar');
    const isBazalt = 'isSunk' in eShip && (eShip.type === 'cvhg_kiev' || eShip.type === 'cg_slava');
    const isMoskit = 'isSunk' in eShip && eShip.type === 'dd_sovremenny';
    const isCoastal = !('isSunk' in eShip);

    const ashmVariant: AshmVariant = isGranit
      ? 'p700_granit'
      : isBazalt
      ? 'p500_bazalt'
      : isMoskit
      ? 'p270_moskit'
      : 'p15_styx';

    const missileName = isGranit
      ? 'P-700 花崗岩 (Granit / SS-N-19)'
      : isBazalt
      ? 'P-500 玄武岩 (Bazalt / SS-N-12)'
      : isMoskit
      ? 'P-270 白蛉 (Moskit / SS-N-22 日炎)'
      : 'P-15M/4K51 邊界重型反艦飛彈';

    const fit = 'isSunk' in eShip ? getShipAshmFit(eShip.type) : undefined;
    const requested = salvoOverride ?? (this.era === 'era5' ? fit?.salvo ?? 8 : isGranit ? 4 : 2);
    // Ships cannot fire more than is left in their launchers (Kiev: 8 on the rails + 16 reloads)
    const salvoCount = 'isSunk' in eShip && eShip.ashmReady !== undefined ? Math.min(requested, eShip.ashmReady) : requested;
    if (salvoCount <= 0) return;
    if ('isSunk' in eShip && eShip.ashmReady !== undefined) eShip.ashmReady -= salvoCount;
    const speed = isGranit ? MISSILE_SPEED.granit : isBazalt ? MISSILE_SPEED.bazalt : isMoskit ? MISSILE_SPEED.moskit : MISSILE_SPEED.styx;
    const dmg = isGranit ? 3100 : isBazalt ? 2800 : isMoskit ? 2700 : 2100;
    const ashmProfile: AshmFlightProfile = isGranit || isBazalt
      ? 'datalink_follower'
      : isMoskit
      ? 'supersonic_sprint'
      : 'subsonic_cruise';
    const targetPool = extraTargets && extraTargets.length > 0 ? extraTargets : [targetShip];

    this.scheduleStaggeredMissileLaunch(eShip, targetPool, salvoCount, {
      missileType: 'missile_ashm',
      missileName,
      speed,
      damage: dmg,
      blastRadius: isCoastal ? 65 : 72,
      isSeaSkimming: true,
      spreadAngle: 0.055,
      baseDelay,
      staggerInterval: salvoCount >= 12 ? 0.15 : 0.19,
      ashmVariant,
      ashmProfile,
      leadMissileIndex: (isGranit || isBazalt) && salvoCount >= 4 ? 0 : undefined,
      turnRate: isMoskit ? 4.2 : 3.7,
    });

    if (!suppressPerShipBanner) {
      this.addBannerAlert(`🚨【OPFOR 反艦飛彈齊射！】「${eShip.name}」發射 ${salvoCount} 枚 ${missileName}！特混艦隊防空火網立即攔截！`, 'enemy', 'alert', 7.0);
    }
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: eShip.name,
      targetName: targetShip.name,
      actionType: 'recon_spotted',
      text: isMoskit
        ? `🚨【P-270 白蛉 3馬赫超音速掠海突防】現代級「${eShip.name}」齊射 ${salvoCount} 枚 P-270 白蛉超音速飛彈！極低空超音速衝刺並在終端進行高G蛇行規避！`
        : isGranit || isBazalt
        ? `🚨【蘇聯領彈資料鏈狼群打擊】「${eShip.name}」發射 ${salvoCount} 枚 ${missileName}！1枚領航彈攀升高空開啟雷達中繼，引導其餘 ${salvoCount - 1} 枚掠海突防「${targetShip.name}」！`
        : `🚨【岸置反艦飛彈齊射】「${eShip.name}」發射 ${salvoCount} 枚 ${missileName} 撲向「${targetShip.name}」！`,
    });
  }

  private fireSA2Missile(inst: Installation, targetPlane: Aircraft, radarAssisted: boolean) {
    soundEngine.playRocketIgnition();
    const d = dist(inst.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - inst.pos.y, targetPlane.pos.x - inst.pos.x);
    const speed = MISSILE_SPEED.sa2;

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

    // 觸發在空 SEAD 野鼬反輻射自動反擊
    let emittingRadar: Installation | null = null;
    for (const isl of this.islands) {
      const fs = isl.installations.find(
        (i) => (i.type === 'fan_song_radar' || i.type === 'radar_station') && !i.isDestroyed && i.side === 'enemy'
      );
      if (fs) {
        emittingRadar = fs;
        break;
      }
    }
    this.triggerSeadAutoRetaliation(emittingRadar || inst, targetPlane);
  }

  private fireHawkSAM(inst: Installation, targetPlane: Aircraft) {
    soundEngine.playRocketIgnition();
    const d = dist(inst.pos, targetPlane.pos);
    const angle = Math.atan2(targetPlane.pos.y - inst.pos.y, targetPlane.pos.x - inst.pos.x);
    const speed = MISSILE_SPEED.hawk;

    this.projectiles.push({
      id: `hawk-${Date.now()}-${Math.random()}`,
      type: 'missile_sam',
      side: inst.side || 'player',
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
    const speed = MISSILE_SPEED.styx;

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
      isSeaSkimming: false,
      ashmVariant: 'p15_styx',
      ashmProfile: 'subsonic_cruise',
      missileAltitude: 0.24,
      missileHealth: 105,
      maxMissileHealth: 105,
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

  private fireAAMissile(plane: Aircraft, target: Aircraft | Projectile | { id: string; pos: Vector2D }, aamType: 'aim9' | 'aim7' | 'k13') {
    const isAntiMissile = !('model' in target);
    const d = dist(plane.pos, target.pos);

    // ════ 歷史史實校正 1: AIM-9B / K-13 嚴格後向尾噴視野與發射過載限制 (時代五 AIM-9L / R-73 為全向 All-Aspect 尋標，不受此限) ════
    if ((aamType === 'aim9' || aamType === 'k13') && this.era !== 'era5') {
      if (!isAntiMissile) {
        const targetPlane = target as Aircraft;
        // 發射 G-limit 限制: 盤旋角速度過大或正在高G破轉時，陀螺儀失鎖無法擊發
        if (plane.isEvading || Math.abs(plane.targetHeading - plane.heading) > 0.42) {
          if (plane.side === 'player') {
            this.addCombatLog({
              category: 'air',
              sourceSide: plane.side,
              sourceName: plane.name,
              targetName: targetPlane.name,
              actionType: 'recon_spotted',
              text: `⚠️【FOX TWO 發射過載超限】本機機動 G 值過大 (>2.5G)！AIM-9 尋標陀螺儀鎖定失效，無法擊發！`,
            });
          }
          return;
        }

        // 嚴格後向尾追錐限制 (Strict Rear-Aspect ±40°): 早期未製冷紅外尋標頭僅能感應尾部噴口高溫，無法迎頭/側向發射
        const angFromTargetToAttacker = Math.atan2(plane.pos.y - targetPlane.pos.y, plane.pos.x - targetPlane.pos.x);
        let aspectDiff = angFromTargetToAttacker - (targetPlane.heading + Math.PI);
        while (aspectDiff > Math.PI) aspectDiff -= Math.PI * 2;
        while (aspectDiff < -Math.PI) aspectDiff += Math.PI * 2;

        if (Math.abs(aspectDiff) > (Math.PI * 45) / 180) {
          if (plane.side === 'player') {
            this.addCombatLog({
              category: 'air',
              sourceSide: plane.side,
              sourceName: plane.name,
              targetName: targetPlane.name,
              actionType: 'recon_spotted',
              text: `⚠️【FOX TWO 尋標未捕獲音調】敵機「${targetPlane.name}」處於側向/迎頭方位！早期硫化鉛紅外尋標頭無法感知機體蒙皮熱量，僅限尾噴排氣 ±40° 追尾發射！`,
            });
          }
          return;
        }
      }
    }

    // ════ 歷史史實校正 2: AIM-7 麻雀半主動雷達最小發射距離限制 (1200m) ════
    if (aamType === 'aim7') {
      if (d < 1100) {
        if (plane.side === 'player') {
          this.addCombatLog({
            category: 'air',
            sourceSide: plane.side,
            sourceName: plane.name,
            targetName: isAntiMissile ? '來襲反艦飛彈' : (target as Aircraft).name,
            actionType: 'recon_spotted',
            text: `⚠️【FOX ONE 距離過近】交會距離僅 ${Math.round(d)}m！小於 AIM-7 麻雀火箭點火與雷達連續波解鎖射程 (1200m)！轉用近戰機砲！`,
          });
        }
        return;
      }
    }

    soundEngine.playRocketWhoosh();
    const angle = Math.atan2(target.pos.y - plane.pos.y, target.pos.x - plane.pos.x);
    const speed = aamType === 'aim7' ? MISSILE_SPEED.aim7 : MISSILE_SPEED.aim9;
    const aamName =
      this.era === 'era5'
        ? (aamType === 'aim7'
            ? (plane.side === 'enemy' ? 'R-27ER (AA-10 楊樹) 遠程空空飛彈' : 'AIM-7M 麻雀全天候半主動雷達飛彈')
            : (plane.side === 'enemy' ? 'R-73 (AA-11 射手) 高離軸全向格鬥飛彈' : 'AIM-9L 全向響尾蛇紅外空空飛彈'))
        : (aamType === 'aim7' ? 'AIM-7 麻雀雷達空空飛彈' : aamType === 'aim9' ? 'AIM-9 響尾蛇紅外飛彈' : 'K-13 (AA-2 環礁) 空空飛彈');

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
      minLockRange: aamType === 'aim7' ? 1100 : undefined,
      isRearAspectOnly: this.era !== 'era5' && (aamType === 'aim9' || aamType === 'k13'),
      turnRate: aamType === 'aim9' ? 5.2 : 3.8,
      isInterceptionMissile: isAntiMissile,
      attackerName: `${plane.name} (${aamName})`,
    });

    if (aamType === 'aim7') {
      plane.sarhIlluminatingTargetId = target.id;
      plane.sarhHoldTimer = 5.5;
    }

    const targetDesc = isAntiMissile ? '來襲反艦飛彈' : (target as Aircraft).name;
    const brevityCode = aamType === 'aim7' ? 'FOX ONE' : 'FOX TWO';
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: targetDesc,
      actionType: 'recon_spotted',
      text: `🚀【${brevityCode}!】${plane.name} 發射 ${aamName}！鎖定 ${targetDesc}！`,
    });
  }

  private fireARMShrike(plane: Aircraft, targetInst: RadarTargetEntity) {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, targetInst.pos);
    const angle = Math.atan2(targetInst.pos.y - plane.pos.y, targetInst.pos.x - plane.pos.x);
    const speed = MISSILE_SPEED.shrike;
    const targetName = ('codeName' in targetInst && targetInst.codeName) || targetInst.name;
    const targetEntityType: Projectile['targetEntityType'] =
      'isSunk' in targetInst ? 'ship' : 'reloadTime' in targetInst ? 'installation' : 'ground';

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
      targetEntityType,
      guidanceType: 'anti_radiation',
      turnRate: 3.5,
      attackerName: `${plane.name} (AGM-45 百舌鳥反輻射飛彈)`,
    });

    this.addBannerAlert(`⚡【野鼬出擊！防空壓制】「${plane.name}」發射 AGM-45 百舌鳥反輻射飛彈，循敵「${targetName}」雷達波束獵殺！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName,
      actionType: 'recon_spotted',
      text: `⚡【Wild Weasel SEAD 獵殺】${plane.name} 偵測到敵「${targetName}」高頻追蹤雷達輻射，發射 AGM-45 Shrike 反輻射飛彈順波直攻雷達天線！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 時代四/時代五 SEAD 野鼬反輻射主動反擊 (Wild Weasel Proactive ARM Counter-Strike)
  // 當敵方發射 SAM 或雷達鎖定照射我方戰機時，受攻擊或在空的 SEAD 野鼬戰機立即主動發射反輻射飛彈（HARM / Standard ARM / Shrike）反擊發射源！
  // ══════════════════════════════════════════════════════════
  public triggerSeadAutoRetaliation(radarTarget: RadarTargetEntity, lockedPlane?: Aircraft) {
    if ((this.era !== 'era4' && this.era !== 'era5') || !radarTarget) return;
    if (('isDestroyed' in radarTarget && radarTarget.isDestroyed) || ('isSunk' in radarTarget && radarTarget.isSunk)) return;
    const now = Date.now() / 1000;

    // 尋找具備反輻射飛彈彈藥之友軍/盟軍在空野鼬戰機 (EA-6B, F-4G, A-6B Weasel, F-105, A-7, F/A-18 等)
    const seadPlanes = this.aircraft.filter((a) => {
      if ((a.side !== 'player' && a.side !== 'allied') || a.state === 'shot_down' || a.state === 'landing') return false;
      const isSeadEquipped =
        a.payloadType === 'agm88_harm' ||
        a.payloadType === 'agm45_shrike' ||
        a.payloadType === 'agm78_standard_arm' ||
        a.model === 'a6b_weasel' ||
        a.model === 'ea6b';
      const hasAmmo = (a.ammoRemaining ?? (a.hasPayload ? 2 : 0)) > 0;
      return isSeadEquipped && hasAmmo;
    });

    if (seadPlanes.length === 0) return;

    // 優先選取受到 SAM 射擊鎖定之本機 (若其為 SEAD 機)，否則選取距離雷達/SAM源最近之在空野鼬戰機
    let firingPlane = lockedPlane && seadPlanes.includes(lockedPlane) ? lockedPlane : null;
    if (!firingPlane) {
      seadPlanes.sort((a, b) => dist(a.pos, radarTarget.pos) - dist(b.pos, radarTarget.pos));
      const candidate = seadPlanes[0];
      const maxArmRange =
        candidate.payloadType === 'agm88_harm' ? 4400 :
        candidate.payloadType === 'agm78_standard_arm' ? 3600 : 2800;
      if (dist(candidate.pos, radarTarget.pos) <= maxArmRange) {
        firingPlane = candidate;
      }
    }

    if (!firingPlane) return;

    // 單機 8 秒冷卻避免瞬時傾瀉全數彈藥
    if (firingPlane.lastSeadCounterfireTime && now - firingPlane.lastSeadCounterfireTime < 8) {
      return;
    }

    firingPlane.lastSeadCounterfireTime = now;
    firingPlane.ammoRemaining = (firingPlane.ammoRemaining ?? 2) - 1;
    if (firingPlane.ammoRemaining <= 0) {
      firingPlane.hasPayload = false;
    }

    // 發射對應反輻射飛彈 (HARM / Standard ARM / Shrike)
    const targetName = ('codeName' in radarTarget && radarTarget.codeName) || radarTarget.name || '防空飛彈雷達陣地';
    if (firingPlane.payloadType === 'agm88_harm') {
      this.fireHARMMissile(firingPlane, radarTarget.pos, radarTarget);
    } else if (firingPlane.payloadType === 'agm78_standard_arm') {
      this.fireStandardARM(firingPlane, radarTarget);
    } else {
      this.fireARMShrike(firingPlane, radarTarget);
    }

    this.addCombatLog({
      category: 'air',
      sourceSide: firingPlane.side,
      sourceName: firingPlane.name,
      targetName,
      actionType: 'recon_spotted',
      text: `⚡【SEAD 野鼬反輻射主動反擊！MAGNUM!】「${firingPlane.name}」遭到防空威脅，立即主動發射反輻射飛彈反制狙擊「${targetName}」！`,
    });
  }

  private fireBullpupMissile(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, targetPos);
    const angle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const speed = MISSILE_SPEED.bullpup;

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
      ashmVariant: 'agm12_bullpup',
      ashmProfile: 'high_plunge',
      missileAltitude: 0.55,
      missileHealth: 110,
      maxMissileHealth: 110,
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

  private dropLaserGuidedBomb(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const d = dist(plane.pos, targetPos);
    const angle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const speed = 360;

    this.projectiles.push({
      id: `gbu10-${Date.now()}-${Math.random()}`,
      type: 'bomb',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d,
      distanceTraveled: 0,
      damage: 3800,
      blastRadius: 75,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      attackerName: `${plane.name} (GBU-10 鋪路雷射導引重彈)`,
      bombType: 'bomb_2000',
    });

    this.addBannerAlert(`🎯【GBU-10 鋪路雷射標定】「${plane.name}」導引 2,000lb 雷射穿甲炸彈精確撲向核心目標！`, 'player', 'alert', 5.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '地面要塞/防空雷達',
      actionType: 'bomb_hit',
      text: `🎯【雷射導引穿甲直擊】${plane.name} 投下 GBU-10 Paveway I 雷射導引炸彈！光電吊艙全程標定，重型2000磅戰鬥部破甲貫通！`,
    });
  }

  private dropClusterBombs(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const subCount = 8;
    for (let i = 0; i < subCount; i++) {
      const scatterAngle = (i / subCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const scatterDist = 15 + Math.random() * 45;
      const sTarget = {
        x: targetPos.x + Math.cos(scatterAngle) * scatterDist,
        y: targetPos.y + Math.sin(scatterAngle) * scatterDist,
      };
      const bDist = Math.max(1, dist(plane.pos, sTarget));

      this.projectiles.push({
        id: `cbu-${Date.now()}-${i}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: sTarget,
        flightProgress: 0,
        maxDistance: bDist,
        distanceTraveled: 0,
        damage: 350,
        blastRadius: 28,
        speed: 260,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName: `${plane.name} (CBU-24 集束子母彈)`,
        bombType: 'bomb_500',
      });
    }

    this.addBannerAlert(`💥【CBU 廣域子母彈群覆蓋】「${plane.name}」散佈數百枚集束破片彈藥，全面瓦解敵防空砲陣地！`, 'player', 'alert', 5.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '敵灘頭防空陣地',
      actionType: 'bomb_hit',
      text: `💥【CBU-24 / Rockeye 集束散佈】${plane.name} 投放集束炸彈莢艙！半空炸開釋放大量破片子彈藥，82m 範圍內露天防空砲火全滅！`,
    });
  }

  private fireStandardARM(plane: Aircraft, targetInst: RadarTargetEntity) {
    soundEngine.playRocketWhoosh();
    const d = dist(plane.pos, targetInst.pos);
    const angle = Math.atan2(targetInst.pos.y - plane.pos.y, targetInst.pos.x - plane.pos.x);
    const speed = MISSILE_SPEED.standardArm;
    const targetName = ('codeName' in targetInst && targetInst.codeName) || targetInst.name;
    const targetEntityType: Projectile['targetEntityType'] =
      'isSunk' in targetInst ? 'ship' : 'reloadTime' in targetInst ? 'installation' : 'ground';

    this.projectiles.push({
      id: `stdarm-${Date.now()}-${Math.random()}`,
      type: 'missile_arm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetInst.pos },
      flightProgress: 0,
      maxDistance: d + 400,
      distanceTraveled: 0,
      damage: 3400,
      blastRadius: 65,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      targetEntityId: targetInst.id,
      targetEntityType,
      guidanceType: 'anti_radiation',
      turnRate: 4.2,
      attackerName: `${plane.name} (AGM-78 標準長程反輻射飛彈)`,
    });

    this.addBannerAlert(`⚡【AGM-78 標準野鼬長程狙擊！】「${plane.name}」自 3600m 距離獵殺敵「${targetName}」！`, 'player', 'alert', 6.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName,
      actionType: 'recon_spotted',
      text: `⚡【AGM-78 Standard ARM 超長程獵殺】${plane.name} 發射 2.5 馬赫高速標準反輻射飛彈！記憶尋標電磁輻射，摧毀敵「${targetName}」！`,
    });
  }

  private dropMERIronBombStick(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playTorpedoLaunch();
    const count = 18;
    for (let i = 0; i < count; i++) {
      const stepForward = (i - count / 2) * 22;
      const bTarget = {
        x: targetPos.x + Math.cos(plane.heading) * stepForward,
        y: targetPos.y + Math.sin(plane.heading) * stepForward,
      };
      const bDist = Math.max(1, dist(plane.pos, bTarget));

      this.projectiles.push({
        id: `mer-bomb-${Date.now()}-${i}-${Math.random()}`,
        type: 'bomb',
        side: plane.side,
        pos: { ...plane.pos },
        vel: { x: 0, y: 0 },
        originPos: { ...plane.pos },
        targetPos: bTarget,
        flightProgress: 0,
        maxDistance: bDist,
        distanceTraveled: 0,
        damage: 360,
        blastRadius: 38,
        speed: 280,
        heading: plane.heading,
        isDead: false,
        trail: [],
        attackerName: `${plane.name} (MER 18聯裝 500lb 連續航彈走廊)`,
        bombType: 'bomb_500',
      });
    }

    this.addBannerAlert(`💥【MER 18枚彈幕走廊覆蓋】「${plane.name}」多聯裝複式掛架連續投下 18 枚高爆航彈！撕裂敵防線！`, 'player', 'alert', 5.5);
    this.addCombatLog({
      category: 'air',
      sourceSide: plane.side,
      sourceName: plane.name,
      targetName: '敵地面防線',
      actionType: 'bomb_hit',
      text: `💥【MER 多聯裝航彈波次】${plane.name} 於目標上空拉出長達 400m 的 18 枚 500lb 高爆彈幕走廊！連續炸點形成地動山搖毀滅帶！`,
    });
  }

  private fireTu16KSR5Missile(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playRocketWhoosh();
    soundEngine.playKlaxon();
    const d = dist(plane.pos, targetPos);
    const angle = Math.atan2(targetPos.y - plane.pos.y, targetPos.x - plane.pos.x);
    const speed = MISSILE_SPEED.ksr5;

    this.projectiles.push({
      id: `ksr5-${Date.now()}-${Math.random()}`,
      type: 'missile_ashm',
      side: plane.side,
      pos: { ...plane.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      originPos: { ...plane.pos },
      targetPos: { ...targetPos },
      flightProgress: 0,
      maxDistance: d + 300,
      distanceTraveled: 0,
      damage: 2600,
      blastRadius: 65,
      speed,
      heading: angle,
      isDead: false,
      trail: [],
      attackerName: `${plane.name} (KSR-5 / AS-5 凱爾特超音速重型反艦飛彈)`,
      ashmVariant: 'ksr5_kelt',
      ashmProfile: 'high_plunge',
      missileAltitude: 0.72,
      missileHealth: 155,
      maxMissileHealth: 155,
    });

    this.addBannerAlert(`🚨【KSR-5 超音速反艦飛彈來襲！】蘇聯海航 Tu-16 獾式轟炸機發射重型反艦飛彈！特遣艦隊 SAM/防空火網立即攔截！`, 'enemy', 'alert', 7.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'enemy',
      sourceName: plane.name,
      targetName: '特混艦隊旗艦/主力艦',
      actionType: 'recon_spotted',
      text: `🚨【蘇聯海航長程突擊警報】蘇聯海軍航空兵 Tu-16 獾式飛彈轟炸機自 2800m 遠距發射 KSR-5 (AS-5 Kelt) 超音速反艦飛彈！1000kg 聚能裝藥掠海襲來！防空戰備升級！`,
    });
  }

  private getEraParatrooperProfile(): { type: GroundUnitType; name: string; label: string } {
    if (this.era === 'era1') {
      return {
        type: 'usmc_rifle_42',
        name: '第1陸戰傘兵突擊排 (1942 Paramarines)',
        label: '1942 陸戰傘兵營分隊',
      };
    }
    if (this.era === 'era2') {
      return {
        type: 'usmc_rifle_45',
        name: '第11空降師「天使」傘兵突擊排 (1945)',
        label: '第11空降師傘兵突擊隊',
      };
    }
    if (this.era === 'era3') {
      return {
        type: 'us_army_infantry_korea',
        name: '第187空降團戰鬥群「Rakkasans」傘兵排',
        label: '第187空降團戰鬥群',
      };
    }
    if (this.era === 'era4') {
      return {
        type: 'usmc_air_assault_65',
        name: 'USMC 空中突擊步兵排',
        label: '越戰空中突擊／傘降排',
      };
    }
    return {
      type: 'usmc_rifle_83',
      name: 'USMC 83年編裝空中突擊陸戰步兵排',
      label: '現代化空中突擊步兵排',
    };
  }

  private dropHeloAssaultTroops(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playPlaneSortie();
    const safeDropBase = this.findIslandDropPoint(targetPos, 280) || targetPos;
    for (let p = 0; p < 12; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 40;
      this.particles.push({
        id: `rotor-dust-${Date.now()}-${p}`,
        x: safeDropBase.x,
        y: safeDropBase.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.8,
        maxLife: 0.8,
        radius: 8 + Math.random() * 8,
        color: 'rgba(215, 204, 200, 0.7)',
        type: 'smoke',
      });
    }

    const profile = this.getEraParatrooperProfile();
    const rawPos = { x: safeDropBase.x + (Math.random() - 0.5) * 30, y: safeDropBase.y + (Math.random() - 0.5) * 30 };
    const finalPos = this.findIslandDropPoint(rawPos, 220) || safeDropBase;
    const assaultSquad = createGroundUnit(
      `usmc-assault-${Date.now()}`,
      profile.type,
      `${profile.name} (垂直機降)`,
      'player',
      this.era,
      finalPos
    );
    this.groundUnits.push(assaultSquad);

    this.addBannerAlert(`🚁【垂直機動空降成功！】「${plane.name}」完成機降！${profile.label}投入灘頭據點奪控！`, 'player', 'capture', 6.0);
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: plane.name,
      targetName: '機降高地灘頭',
      actionType: 'recon_spotted',
      text: `🚁【垂直機動作戰 (Vertical Envelopment)】運輸直升機於指定島嶼空降區完成卸載！「${profile.name}」迅速展開戰術包圍！`,
    });
  }

  private dropParatroopers(plane: Aircraft, targetPos: Vector2D) {
    soundEngine.playPlaneSortie();
    const safeDropBase = this.findIslandDropPoint(targetPos, 280) || targetPos;
    const profile = this.getEraParatrooperProfile();
    for (let s = 0; s < 2; s++) {
      const rawDropPos = {
        x: safeDropBase.x + (s === 0 ? -35 : 35) + (Math.random() - 0.5) * 20,
        y: safeDropBase.y + (s === 0 ? -25 : 25) + (Math.random() - 0.5) * 20,
      };
      const dropPos = this.findIslandDropPoint(rawDropPos, 220) || safeDropBase;

      const paraSquad = createGroundUnit(
        `usmc-para-${Date.now()}-${s}`,
        profile.type,
        `${profile.name} (#${s + 1})`,
        'player',
        this.era,
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

    this.addBannerAlert(`🪂【傘降部隊空投完成！】「${plane.model.toUpperCase()}」投下 2 個${profile.label}！迅速控制周邊戰略要地！`, 'player', 'capture', 6.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'player',
      sourceName: plane.name,
      targetName: '空投戰區',
      actionType: 'recon_spotted',
      text: `🪂【空降卸載完成】「${plane.name}」飛越目標島嶼空域投放 2 個「${profile.name}」！傘兵安全著陸，立即奪取防區！`,
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
    const isEra5 = this.era === 'era5';
    const isEra4 = this.era === 'era4';
    const waveUnits: GroundUnit[] = isEra5
      ? [
          {
            ...createGroundUnit(`us-army-wave-m1-${ts}`, 'us_m1ip_abrams', 'US Army 3rd Armored (M1IP艾布蘭突破排)', 'player', 'era5', {
              x: spawnBase.x + (Math.random() - 0.5) * 40,
              y: spawnBase.y + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-m60-${ts}`, 'us_m60a1_rise', 'USMC 1st Tank Bn (M60A1 RISE重戰車排)', 'player', 'era5', {
              x: spawnBase.x + 35 + (Math.random() - 0.5) * 40,
              y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
          {
            ...createGroundUnit(`us-army-wave-lav-${ts}`, 'usmc_lav25', 'USMC 2nd LAR Bn (LAV-25裝甲偵察排)', 'player', 'era5', {
              x: spawnBase.x - 35 + (Math.random() - 0.5) * 40,
              y: spawnBase.y + 30 + (Math.random() - 0.5) * 40,
            }),
            isNPCAlliedFrontline: true,
            order: { type: 'move', targetPos: targetObj },
          },
        ]
      : isEra4
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

    if (Math.random() < 0.5) {
      const spgType: GroundUnitType = isEra5 ? 'us_m109a6_paladin' : isEra4 ? 'us_m109_spg' : 'us_m44_spg';
      const spgName = isEra5
        ? 'US Army M109A6 Paladin 數位自走砲 (反砲擊火力群)'
        : isEra4
        ? 'US Army M109 155mm 自走榴彈砲 (反砲擊組)'
        : 'US Army M44 155mm 自走榴彈砲 (反砲擊組)';
      waveUnits.push({
        ...createGroundUnit(`us-army-wave-spg-${ts}`, spgType, spgName, 'player', this.era, {
          x: spawnBase.x - 55,
          y: spawnBase.y + 45,
        }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: (spawnBase.x + targetObj.x) * 0.5, y: (spawnBase.y + targetObj.y) * 0.5 } },
      });
    }

    this.groundUnits.push(...waveUnits);

    soundEngine.playPlaneSortie();
    this.addBannerAlert(
      isEra5
        ? `⚔️【北約第7軍突破增援！】M1IP 艾布蘭主戰戰車、M60A1 RISE 反應裝甲戰車與 LAV-25 前鋒開赴前線！`
        : isEra4
        ? `⚔️【美陸軍第1騎兵師增援】步兵排、M113裝甲機步與榭樹防空飛彈車開赴前線！`
        : `⚔️【美陸軍戰線增援出動！】美國陸軍第7步兵師前線部隊與第70戰車排自大陸基地出擊，投入中央前線推進！`,
      'player',
      'capture',
      5.5
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'player',
      sourceName: isEra5 ? '北約北方集團軍指揮中心' : '美陸軍大陸前進指揮中心',
      targetName: '中央大陸戰線',
      actionType: 'recon_spotted',
      text: isEra5
        ? `⚔️【北約裝甲突擊出擊】美陸軍 M1IP 艾布蘭與陸戰隊 M60A1 RISE 裝甲連全面投入中央戰線，伴隨 LAV-25 加速突破！`
        : isEra4
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
    const isEra5 = this.era === 'era5';
    const isEra4 = this.era === 'era4';
    const era5AaRoll = Math.random();
    const era5AaType: GroundUnitType =
      era5AaRoll < 0.28 ? 'opfor_sa15_tor' : era5AaRoll < 0.55 ? 'opfor_sa11_buk' : era5AaRoll < 0.78 ? 'opfor_sa8_osa' : 'opfor_tunguska';
    const era5AaName =
      era5AaType === 'opfor_sa15_tor'
        ? '蘇聯 9K330 Tor-M1 (SA-15 道爾自走野戰防空)'
        : era5AaType === 'opfor_sa11_buk'
        ? '蘇聯 9K37 Buk (SA-11 山毛櫸野戰飛彈車)'
        : era5AaType === 'opfor_sa8_osa'
        ? '蘇聯 9K33 Osa-AKM (SA-8 黃蜂水陸防空車)'
        : '蘇聯 2K22 通古斯卡 彈砲防空伴隨車';

    const era4AaRoll = Math.random();
    const era4AaType: GroundUnitType =
      era4AaRoll < 0.34 ? 'opfor_sa6_kub' : era4AaRoll < 0.67 ? 'opfor_zsu57_2' : 'opfor_sa9_strela1';
    const era4AaName =
      era4AaType === 'opfor_sa6_kub'
        ? '華約 2K12 Kub (SA-6 三聯裝機動防空飛彈連)'
        : era4AaType === 'opfor_zsu57_2'
        ? '華約 ZSU-57-2 雙管57mm自走高砲連'
        : '華約 9K31 Strela-1 (SA-9 長弓防空飛彈車)';

    const waveUnits: GroundUnit[] = isEra5
      ? [
          createGroundUnit(`opfor-wave-t80-${ts}`, 'opfor_t80b', '蘇軍近衛裝甲 T-80B 主戰戰車排', 'enemy', 'era5', {
            x: spawnBase.x + (Math.random() - 0.5) * 40,
            y: spawnBase.y + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-bmp2-${ts}`, 'opfor_bmp2', '蘇聯近衛摩托化步兵 BMP-2 裝甲步戰排', 'enemy', 'era5', {
            x: spawnBase.x - 30 + (Math.random() - 0.5) * 40,
            y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-aa-${ts}`, era5AaType, era5AaName, 'enemy', 'era5', {
            x: spawnBase.x + 20 + (Math.random() - 0.5) * 40,
            y: spawnBase.y + 30 + (Math.random() - 0.5) * 40,
          }),
        ]
      : isEra4
      ? [
          createGroundUnit(`opfor-wave-inf-${ts}`, 'opfor_coldwar_infantry', 'PAVN 320th Div Sapper Plt (越盟主力步兵排)', 'enemy', 'era4', {
            x: spawnBase.x + (Math.random() - 0.5) * 40,
            y: spawnBase.y + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-tank-${ts}`, 'opfor_t34_85', 'PAVN 202nd Armored Regt T-54 (主力戰車排)', 'enemy', 'era4', {
            x: spawnBase.x - 30 + (Math.random() - 0.5) * 40,
            y: spawnBase.y - 20 + (Math.random() - 0.5) * 40,
          }),
          createGroundUnit(`opfor-wave-aa-${ts}`, era4AaType, era4AaName, 'enemy', 'era4', {
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

    if (Math.random() < 0.5) {
      const opforSpgType: GroundUnitType = isEra5 ? 'opfor_2s19' : isEra4 ? 'opfor_2s3' : 'opfor_su100';
      const opforSpgName = isEra5
        ? '蘇聯 2S19 Msta-S 152mm 自走榴彈砲 (反砲擊群)'
        : isEra4
        ? '蘇/越 2S3 阿卡齊亞 152mm 自走砲 (反砲擊群)'
        : '遠東聯軍 SU-100 / ISU-152 重型自走砲';
      waveUnits.push(
        createGroundUnit(`opfor-wave-spg-${ts}`, opforSpgType, opforSpgName, 'enemy', this.era, {
          x: spawnBase.x + 55,
          y: spawnBase.y - 45,
        })
      );
    }

    waveUnits.forEach((u) => {
      u.order = u.isSPG
        ? { type: 'move', targetPos: { x: (spawnBase.x + targetObj.x) * 0.5, y: (spawnBase.y + targetObj.y) * 0.5 } }
        : { type: 'move', targetPos: targetObj };
    });

    this.groundUnits.push(...waveUnits);

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: isEra5 ? '蘇聯前線近衛裝甲指揮所' : isEra4 ? '北越/蘇聯軍事顧問要塞' : '遠東聯軍要塞司令部',
      targetName: '中央大陸戰線',
      actionType: 'recon_spotted',
      text: isEra5
        ? `⚔️【華約發動裝甲大反攻！】蘇軍近衛第8軍 T-80B 裝甲突擊排與 BMP-2、通古斯卡自走防空自後方要塞全線衝擊中央戰線！`
        : isEra4
        ? `⚔️【敵軍發動前線反撲】北越主力步兵連與 T-54 戰車、PT-76 裝甲車自東北坑道要塞出擊，向中央戰線展開反撲！`
        : `⚔️【敵軍發動大陸反撲】敵遠東聯軍突擊步兵排與 T-34/85 裝甲小隊自東北坑道要塞出擊，向中央戰線展開反攻！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 友軍陸基/前線空軍自動出擊機制 (USAF / USAAF Air Sortie)
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
    const isEra5 = this.era === 'era5';
    const isEra4 = this.era === 'era4';

    if (isCap) {
      const patrolCenter: Vector2D = { x: 8600, y: 5200 };
      const model = isEra5 ? (Math.random() < 0.5 ? 'f15a' : 'f16a') : isEra4 ? 'f4e' : 'f86';
      const speed = getAircraftSpeed(model);
      const baseHealth = isEra5 ? 750 : isEra4 ? 680 : 520;
      const modelName = isEra5 ? (model === 'f15a' ? 'F-15A 鷹式超音速空優戰機' : 'F-16A 戰隼全天候戰機') : isEra4 ? 'F-4E 幽靈二式空優戰鬥機' : 'F-86 軍刀空優機';
      const pType = isEra5 ? 'aim9_sidewinder' : isEra4 ? 'aim9_sidewinder' : 'clean_guns';
      const pName = isEra5 ? 'AIM-7F 麻雀 / AIM-9L 響尾蛇' : isEra4 ? 'AIM-7E 麻雀 / AIM-9E 響尾蛇' : '純空優截擊';
      const ammo = isEra5 ? 940 : isEra4 ? 640 : 1800;

      for (let i = 0; i < count; i++) {
        const pId = `usaaf-cap-${Date.now()}-${i}`;
        this.aircraft.push({
          id: pId,
          squadronId: sqId,
          model,
          role: 'fighter',
          name: `USAF 大陸戰線空軍 · ${modelName} (#${i + 1})`,
          side: 'player',
          pos: { x: afbPos.x + (i - (count - 1) / 2) * 30, y: afbPos.y + (i - (count - 1) / 2) * 20 },
          vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
          heading,
          targetHeading: heading,
          speed,
          maxSpeed: speed,
          altitude: 0.92,
          state: 'cruising',
          health: baseHealth,
          maxHealth: baseHealth,
          order: { type: 'patrol', patrolOrigin: { ...patrolCenter } },
          airMission: 'barcap',
          hasPayload: true,
          payloadType: pType,
          payloadName: pName,
          shootCooldown: 0,
          gunAmmo: ammo,
          maxGunAmmo: ammo,
          wingmanOffset: { x: (i - (count - 1) / 2) * 30, y: i * 20 },
          flightName: `USAF 大陸戰術空軍 · 空優截擊聯隊 (${model.toUpperCase()} CAP)`,
        });
      }

      soundEngine.playPlaneSortie();
      this.addBannerAlert(
        `✈️【${isEra5 ? '現代超音速空優出擊' : isEra4 ? '幽靈空優巡邏出擊' : '遠東空軍巡邏出擊'}】USAF ${count}架 ${modelName} 自基地緊急升空，執行戰線空優巡邏 (CAP)！`,
        'player',
        'alert',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: isEra5 ? 'USAF 戰術空軍聯隊' : isEra4 ? 'USAF 第7航空隊' : 'USAAF 遠東空軍 (第5航空隊)',
        targetName: '大陸中央戰線空域',
        actionType: 'recon_spotted',
        text: `✈️【戰線空優出擊】${count}機編隊 ${model.toUpperCase()} 噴射空優機自大陸前進基地呼嘯升空，巡弋中央戰線上空奪取制空權！`,
      });
    } else {
      // CAS
      const targetUnit = this.groundUnits.find((u) => u.side === 'enemy' && !u.isDestroyed);
      const targetPos: Vector2D = targetUnit ? { ...targetUnit.pos } : { x: 9200, y: 4800 };
      const model = isEra5 ? 'a10a' : isEra4 ? 'a7' : 'ad1';
      const speed = getAircraftSpeed(model);
      const baseHealth = isEra5 ? 1100 : isEra4 ? 750 : 700;
      const modelName = isEra5 ? 'A-10A 雷霆二式裝甲獵殺機' : isEra4 ? 'A-7 海盜二式輕型攻擊機' : 'AD-1 天襲者密接打擊機';
      const pType = isEra5 ? 'agm65_maverick' : isEra4 ? 'bombs_snakeye_retarded' : (count % 2 === 0 ? 'hvar_rockets' : 'napalm_canister');
      const pName = isEra5 ? 'AGM-65 小牛飛彈 / GAU-8 30mm' : isEra4 ? 'Mk 82 蛇眼減速炸彈' : (count % 2 === 0 ? 'HVAR 火箭' : '凝固汽油彈');
      const ammo = isEra5 ? 1174 : isEra4 ? 1000 : 1200;

      for (let i = 0; i < count; i++) {
        const pId = `usaaf-cas-${Date.now()}-${i}`;
        this.aircraft.push({
          id: pId,
          squadronId: sqId,
          model,
          role: 'attacker',
          name: `USAF 戰術空軍 · ${modelName} (#${i + 1})`,
          side: 'player',
          pos: { x: afbPos.x + (i - (count - 1) / 2) * 30, y: afbPos.y + (i - (count - 1) / 2) * 20 },
          vel: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
          heading,
          targetHeading: heading,
          speed,
          maxSpeed: speed,
          altitude: 0.38,
          state: 'cruising',
          health: baseHealth,
          maxHealth: baseHealth,
          order: { type: 'attack', targetPos },
          hasPayload: true,
          payloadType: pType,
          payloadName: pName,
          shootCooldown: 0,
          gunAmmo: ammo,
          maxGunAmmo: ammo,
          wingmanOffset: { x: (i - (count - 1) / 2) * 30, y: i * 20 },
          flightName: `USAF 戰術空軍 · 密接對地攻擊分隊 (${model.toUpperCase()} CAS)`,
        });
      }

      soundEngine.playPlaneSortie();
      this.addBannerAlert(
        `🚀【${isEra5 ? '雷霆二式裝甲獵殺' : isEra4 ? '海盜密接打擊' : '遠東空軍密接打擊'}】USAF ${count}架 ${modelName} 攻擊機群升空，對前線敵裝甲與陣地實施火力壓制 (CAS)！`,
        'player',
        'alert',
        6.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: 'player',
        sourceName: isEra5 ? 'USAF 戰術空軍聯隊' : isEra4 ? 'USAF 第7航空隊' : 'USAAF 遠東空軍 (第5航空隊)',
        targetName: '前線敵軍裝甲與陣地',
        actionType: 'recon_spotted',
        text: `🚀【前線密接打擊出擊】USAF ${count}機編隊 ${model.toUpperCase()} 攻擊機群掛載精確導引彈藥，直撲大陸前線支援地面部隊！`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 盟軍綠色自主航空支援出擊 (Allied AI Autonomous Air Sorties)
  // 依時代派遣 RAF/FAA、韓戰聯合國軍/ROKAF、北約/南越、晚期冷戰北約多國戰機 (SARH上限)
  // ══════════════════════════════════════════════════════════
  private spawnAlliedAirSortie() {
    const baseCenter = this.friendlyBase?.center || { x: 2000, y: 12400 };
    const heading = -Math.PI / 4;
    const sqId = `sq-allied-${Date.now()}`;

    type AlliedOption = {
      model: AircraftModel;
      role: AircraftRole;
      modelName: string;
      speed: number;
      baseHealth: number;
      payloadType: AircraftPayloadType;
      payloadName: string;
      ammo: number;
      affiliation: string;
      /** Air arm whose insignia it wears when the airframe is flown by another nation. */
      nation?: AircraftNation;
    };

    let pool: AlliedOption[] = [];

    if (this.era === 'era1') {
      pool = [
        { model: 'hurricane', role: 'fighter', modelName: '颶風式 Mk.II 戰鬥機', speed: getAircraftSpeed('hurricane'), baseHealth: 420, payloadType: 'clean_guns', payloadName: '8x .303 白朗寧機槍', ammo: 2400, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'spitfire_v', role: 'fighter', modelName: '噴火式 Mk.V 戰鬥機', speed: getAircraftSpeed('spitfire_v'), baseHealth: 420, payloadType: 'clean_guns', payloadName: '2x 20mm 機砲 + 4x .303', ammo: 1800, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'beaufighter', role: 'attacker', modelName: '雙頭怪 (Beaufighter) 打擊機', speed: getAircraftSpeed('beaufighter'), baseHealth: 620, payloadType: 'aerial_torpedo', payloadName: 'Mk 13 航空魚雷 / 4x 20mm', ammo: 1200, affiliation: '皇家空軍岸防司令部' },
        { model: 'swordfish', role: 'torpedo_bomber', modelName: '劍魚魚雷轟炸機', speed: getAircraftSpeed('swordfish'), baseHealth: 340, payloadType: 'aerial_torpedo', payloadName: '18吋航空重型魚雷', ammo: 600, affiliation: '皇家海軍航空隊 (FAA)' },
        { model: 'p40', role: 'fighter', modelName: 'P-40E 小鷹式 (Kittyhawk)', speed: getAircraftSpeed('p40'), baseHealth: 420, payloadType: 'clean_guns', payloadName: '6x .50 白朗寧機槍', ammo: 1440, affiliation: '澳洲皇家空軍第75中隊 (RAAF)', nation: 'australia' },
        { model: 'a20', role: 'attacker', modelName: 'A-20C 波士頓 (Boston) 攻擊機', speed: getAircraftSpeed('a20'), baseHealth: 520, payloadType: 'bombs_dual_500', payloadName: '機首機槍群 + 500lb 航彈', ammo: 2000, affiliation: '澳洲皇家空軍第22中隊 (RAAF)', nation: 'australia' },
        { model: 'beaufort', role: 'torpedo_bomber', modelName: '蒲福式 Mk.VIII (DAP Beaufort) 魚雷轟炸機', speed: getAircraftSpeed('beaufort'), baseHealth: 700, payloadType: 'aerial_torpedo', payloadName: '18吋 Mk XII 航空魚雷', ammo: 1500, affiliation: '澳洲皇家空軍第100中隊 (RAAF)', nation: 'australia' },
        { model: 'boomerang', role: 'fighter', modelName: 'CA-12 回力鏢 (Boomerang) 戰鬥機', speed: getAircraftSpeed('boomerang'), baseHealth: 460, payloadType: 'clean_guns', payloadName: '2x 20mm 機砲 + 4x .303 機槍', ammo: 1600, affiliation: '澳洲皇家空軍第84中隊 (RAAF)', nation: 'australia' },
      ];
    } else if (this.era === 'era2') {
      pool = [
        { model: 'spitfire_xiv', role: 'fighter', modelName: '噴火式 Mk.XIV (格里芬)', speed: getAircraftSpeed('spitfire_xiv'), baseHealth: 460, payloadType: 'clean_guns', payloadName: '2x 20mm + 2x .50 機槍', ammo: 1600, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'tempest', role: 'fighter', modelName: '暴風式 Mk.V 戰鬥機', speed: getAircraftSpeed('tempest'), baseHealth: 520, payloadType: 'hvar_rockets', payloadName: '8x 航空火箭 / 4x 20mm', ammo: 1600, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'mosquito', role: 'attacker', modelName: '蚊式 (Mosquito FB.VI) 轟炸機', speed: getAircraftSpeed('mosquito'), baseHealth: 580, payloadType: 'bombs_dual_500', payloadName: '雙聯 500lb 航彈 + 4x 20mm', ammo: 1400, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'lancaster', role: 'level_bomber', modelName: '蘭開斯特重型轟炸機', speed: getAircraftSpeed('lancaster'), baseHealth: 980, payloadType: 'bombs_carpet_250', payloadName: '16枚連環地毯航彈', ammo: 1800, affiliation: '皇家空軍轟炸司令部' },
        { model: 'f4u', role: 'fighter', modelName: '海盜 Mk.II (Corsair) 艦載戰鬥機', speed: getAircraftSpeed('f4u'), baseHealth: 480, payloadType: 'clean_guns', payloadName: '6x .50 機槍', ammo: 2400, affiliation: '英國太平洋艦隊 艦隊航空隊 (FAA)', nation: 'british_pacific' },
        { model: 'f6f', role: 'fighter', modelName: '地獄貓 Mk.II (Hellcat) 艦載戰鬥機', speed: getAircraftSpeed('f6f'), baseHealth: 440, payloadType: 'clean_guns', payloadName: '6x .50 機槍', ammo: 2400, affiliation: '英國太平洋艦隊 艦隊航空隊 (FAA)', nation: 'british_pacific' },
        { model: 'tbf', role: 'torpedo_bomber', modelName: '復仇者 Mk.I (Avenger) 魚雷轟炸機', speed: getAircraftSpeed('tbf'), baseHealth: 460, payloadType: 'aerial_torpedo', payloadName: 'Mk 13 航空魚雷', ammo: 600, affiliation: '英國太平洋艦隊 艦隊航空隊 (FAA)', nation: 'british_pacific' },
        { model: 'seafire', role: 'fighter', modelName: '海火式 F.III (Seafire) 艦載戰鬥機', speed: getAircraftSpeed('seafire'), baseHealth: 420, payloadType: 'clean_guns', payloadName: '2x 20mm 機砲 + 4x .303 機槍', ammo: 1200, affiliation: '英國太平洋艦隊 第887中隊 (FAA)', nation: 'british_pacific' },
        { model: 'barracuda', role: 'attacker', modelName: '梭魚式 Mk.II (Barracuda) 俯衝/魚雷轟炸機', speed: getAircraftSpeed('barracuda'), baseHealth: 540, payloadType: 'bombs_dual_500', payloadName: '2x 500lb 航彈 (沙璜/巨港空襲)', ammo: 600, affiliation: '英國東方艦隊 第827中隊 (FAA)', nation: 'british_pacific' },
      ];
    } else if (this.era === 'era3') {
      pool = [
        { model: 'meteor', role: 'fighter', modelName: '流星 (Meteor F.8) 噴射戰鬥機', speed: getAircraftSpeed('meteor'), baseHealth: 520, payloadType: 'clean_guns', payloadName: '4x 20mm 西斯帕諾機砲', ammo: 1600, affiliation: '聯合國軍 / 皇家空軍' },
        { model: 'rokaf_p51', role: 'fighter', modelName: 'F-51D 野馬式戰鬥機', speed: getAircraftSpeed('rokaf_p51'), baseHealth: 460, payloadType: 'clean_guns', payloadName: '6x .50 M2 機槍', ammo: 1800, affiliation: '大韓民國空軍 (ROKAF)' },
        { model: 'sea_fury', role: 'attacker', modelName: '海怒 (Sea Fury FB.11) 艦載機', speed: getAircraftSpeed('sea_fury'), baseHealth: 500, payloadType: 'hvar_rockets', payloadName: '8x 60lb 火箭 + 4x 20mm', ammo: 1600, affiliation: '英聯邦特遣艦隊航空隊' },
        { model: 'firefly_as5', role: 'attacker', modelName: '螢火蟲 (Firefly AS.5) 攻擊機', speed: getAircraftSpeed('firefly_as5'), baseHealth: 490, payloadType: 'hvar_rockets', payloadName: 'ASH雷達 + 8x 火箭', ammo: 1200, affiliation: '英聯邦海軍特遣隊' },
        { model: 'p51', role: 'attacker', modelName: 'F-51D 野馬 (飛豹中隊)', speed: getAircraftSpeed('p51'), baseHealth: 450, payloadType: 'hvar_rockets', payloadName: '6x HVAR 火箭 + 6x .50 機槍', ammo: 1880, affiliation: '南非空軍第2中隊「飛豹」(SAAF)', nation: 'south_africa' },
        { model: 'f4u4', role: 'attacker', modelName: 'F4U-4 海盜 (Corsair) 對地攻擊', speed: getAircraftSpeed('f4u4'), baseHealth: 500, payloadType: 'napalm_canister', payloadName: '凝固汽油彈 + HVAR', ammo: 1800, affiliation: '美國海軍陸戰隊第1陸戰航空聯隊 (1st MAW)' },
        { model: 'p51', role: 'fighter', modelName: 'P-51D 野馬 (韓戰首月)', speed: getAircraftSpeed('p51'), baseHealth: 450, payloadType: 'hvar_rockets', payloadName: '6x HVAR + 6x .50 機槍', ammo: 1880, affiliation: '澳洲皇家空軍第77中隊 (RAAF)', nation: 'australia' },
        { model: 'sea_fury', role: 'attacker', modelName: '海怒 FB.11 (雪梨號航艦)', speed: getAircraftSpeed('sea_fury'), baseHealth: 500, payloadType: 'hvar_rockets', payloadName: '8x 60lb 火箭 + 4x 20mm', ammo: 1600, affiliation: '澳洲皇家海軍 第805中隊 (RAN FAA)', nation: 'australia' },
        { model: 'firefly_as5', role: 'attacker', modelName: '螢火蟲 FR.5 (雪梨號航艦)', speed: getAircraftSpeed('firefly_as5'), baseHealth: 490, payloadType: 'bombs_dual_500', payloadName: '2x 500lb 航彈 + 4x 20mm', ammo: 1200, affiliation: '澳洲皇家海軍 第817中隊 (RAN FAA)', nation: 'australia' },
      ];
    } else if (this.era === 'era4') {
      pool = [
        { model: 'f5a', role: 'fighter', modelName: 'F-5A 自由鬥士輕型戰機', speed: getAircraftSpeed('f5a'), baseHealth: 560, payloadType: 'aim9_sidewinder', payloadName: '2x AIM-9 響尾蛇 + 20mm機砲', ammo: 800, affiliation: '北約盟國戰術空軍' },
        { model: 'mirage3', role: 'fighter', modelName: '幻象 IIIE 三角翼戰鬥機', speed: getAircraftSpeed('mirage3'), baseHealth: 580, payloadType: 'aim9_sidewinder', payloadName: '魔術/響尾蛇 + 雙門德發機砲', ammo: 700, affiliation: '法國空軍 / 北約聯隊' },
        { model: 'f104g', role: 'fighter', modelName: 'F-104G 星式超音速戰機', speed: getAircraftSpeed('f104g'), baseHealth: 550, payloadType: 'aim9_sidewinder', payloadName: '20mm 火神砲 + 響尾蛇飛彈', ammo: 750, affiliation: '西德聯邦海航 (MFG 2)' },
        { model: 'a1h', role: 'attacker', modelName: 'A-1H 天襲者密接打擊機', speed: getAircraftSpeed('a1h'), baseHealth: 680, payloadType: 'bombs_snakeye_retarded', payloadName: '重裝航彈 + 4x 20mm 機砲', ammo: 1200, affiliation: '盟軍戰術空軍聯隊' },
        { model: 'a37b', role: 'attacker', modelName: 'A-37B 蜻蜓式輕型攻擊機', speed: getAircraftSpeed('a37b'), baseHealth: 500, payloadType: 'bombs_snakeye_retarded', payloadName: 'GAU-2B 米尼岡機槍 + 航彈', ammo: 1500, affiliation: '南越空軍 (VNAF)' },
        { model: 'hunter_fga9', role: 'attacker', modelName: '獵手 (Hunter FGA.9) 攻擊機', speed: getAircraftSpeed('hunter_fga9'), baseHealth: 580, payloadType: 'bombs_snakeye_retarded', payloadName: '4x 30mm 亞丁機砲 + 航彈', ammo: 1000, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'f4e', role: 'fighter', modelName: 'F-4E 幽靈II (租借機)', speed: getAircraftSpeed('f4e'), baseHealth: 740, payloadType: 'aim7_aim9_combo', payloadName: '4x AIM-7 + 4x AIM-9', ammo: 1000, affiliation: '澳洲皇家空軍第1/6中隊 (RAAF)', nation: 'australia' },
        { model: 'f100', role: 'attacker', modelName: 'F-100D 超級軍刀', speed: getAircraftSpeed('f100'), baseHealth: 640, payloadType: 'bombs_snakeye_retarded', payloadName: '蛇眼減速彈 + 4x 20mm', ammo: 800, affiliation: '美國空軍第3戰術戰鬥聯隊 (邊和空軍基地)' },
        { model: 'canberra', role: 'level_bomber', modelName: '坎培拉 B.20 (Canberra) 轟炸機', speed: getAircraftSpeed('canberra'), baseHealth: 900, payloadType: 'bombs_carpet_250', payloadName: '6x 750lb 航彈 (藩朗 1967-71)', ammo: 0, affiliation: '澳洲皇家空軍第2中隊 (RAAF)', nation: 'australia' },
        { model: 'a4', role: 'attacker', modelName: 'A-4G 天鷹 (墨爾本號航艦)', speed: getAircraftSpeed('a4'), baseHealth: 580, payloadType: 'bombs_snakeye_retarded', payloadName: 'Mk 82 蛇眼 + 2x 20mm', ammo: 400, affiliation: '澳洲皇家海軍 第805中隊 (RAN FAA)', nation: 'australia' },
      ];
    } else {
      // Era 5 Cold War NATO Coalition (Ceiling is SARH, AMRAAM not yet deployed)
      pool = [
        { model: 'tornado_adv', role: 'fighter', modelName: '龍捲風 ADV F.3 全天候截擊機', speed: getAircraftSpeed('tornado_adv'), baseHealth: 750, payloadType: 'aim7_sparrow', payloadName: '4x 天閃 (Skyflash) SARH + 響尾蛇', ammo: 600, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'f4f_phantom', role: 'fighter', modelName: 'F-4F 幽靈II式戰鬥機', speed: getAircraftSpeed('f4f_phantom'), baseHealth: 680, payloadType: 'aim7_sparrow', payloadName: '4x AIM-7 麻雀 (SARH) + 響尾蛇', ammo: 640, affiliation: '西德聯邦空軍 (Luftwaffe)' },
        { model: 'mirage2000', role: 'fighter', modelName: '幻象 2000C 電傳飛控戰鬥機', speed: getAircraftSpeed('mirage2000'), baseHealth: 720, payloadType: 'aim7_sparrow', payloadName: '超級530D (SARH) + 魔術二型', ammo: 600, affiliation: '法國空軍 (Armée de l\'Air)' },
        { model: 'tornado_gr1', role: 'attacker', modelName: '龍捲風 GR.1 遠程打擊機', speed: getAircraftSpeed('tornado_gr1'), baseHealth: 760, payloadType: 'rgm84_harpoon', payloadName: '海鷹/鸕鶿反艦飛彈 + 雙門27mm砲', ammo: 800, affiliation: '西德聯邦海航 (MFG 1)' },
        { model: 'tornado_ids', role: 'attacker', modelName: '龍捲風 IDS 跑道壓制戰轟機', speed: getAircraftSpeed('tornado_ids'), baseHealth: 760, payloadType: 'bombs_snakeye_retarded', payloadName: 'JP233 跑道集束子母彈藥撒佈器', ammo: 800, affiliation: '英國皇家空軍 (RAF)' },
        { model: 'jaguar_gr1', role: 'attacker', modelName: '美洲豹 GR.1 戰術攻擊機', speed: getAircraftSpeed('jaguar_gr1'), baseHealth: 650, payloadType: 'bombs_snakeye_retarded', payloadName: '翼上響尾蛇 + 蛇眼減速炸彈', ammo: 900, affiliation: '英法聯合特遣隊' },
        { model: 'viggen_ja37', role: 'attacker', modelName: 'JA 37 雷式戰鬥攻擊機', speed: getAircraftSpeed('viggen_ja37'), baseHealth: 780, payloadType: 'rgm84_harpoon', payloadName: 'RBS-15F 重型反艦飛彈 + 30mm砲', ammo: 700, affiliation: '瑞典空軍 (Flygvapnet)' },
        { model: 'f15a', role: 'fighter', modelName: 'F-15J 鷹式 (三菱授權生產)', speed: getAircraftSpeed('f15a'), baseHealth: 850, payloadType: 'aim7_aim9_combo', payloadName: '4x AIM-7F + 4x AIM-9L', ammo: 940, affiliation: '日本航空自衛隊 第2航空團 (JASDF)', nation: 'japan' },
        { model: 'f4e', role: 'fighter', modelName: 'F-4EJ 改 幽靈II', speed: getAircraftSpeed('f4e'), baseHealth: 740, payloadType: 'aim7_aim9_combo', payloadName: '4x AIM-7E + 4x AIM-9', ammo: 1000, affiliation: '日本航空自衛隊 第8航空團 (JASDF)', nation: 'japan' },
        { model: 'av8b', role: 'attacker', modelName: '獵鷹 GR.3 (Harrier) 垂直起降攻擊機', speed: getAircraftSpeed('av8b'), baseHealth: 720, payloadType: 'cbu_cluster_bombs', payloadName: 'BL755 集束炸彈 + 30mm 亞丁砲莢', ammo: 300, affiliation: '英國皇家空軍第1中隊 (RAF)', nation: 'uk' },
        { model: 'buccaneer', role: 'attacker', modelName: '海盜式 S.2B (Buccaneer) 海上打擊機', speed: getAircraftSpeed('buccaneer'), baseHealth: 900, payloadType: 'rgm84_harpoon', payloadName: '2x 海鷹 (Sea Eagle) 反艦飛彈', ammo: 0, affiliation: '英國皇家空軍第12中隊 (RAF)', nation: 'uk' },
        { model: 'sea_harrier', role: 'fighter', modelName: '海獵鷹 FRS.1 (Sea Harrier)', speed: getAircraftSpeed('sea_harrier'), baseHealth: 640, payloadType: 'aim9_sidewinder', payloadName: '2x AIM-9L + 2x 30mm 亞丁', ammo: 300, affiliation: '英國皇家海軍 第800中隊 (FAA)', nation: 'uk' },
        { model: 'fa18a', role: 'fighter', modelName: 'CF-18A 大黃蜂', speed: getAircraftSpeed('fa18a'), baseHealth: 800, payloadType: 'aim7_aim9_combo', payloadName: '4x AIM-7M + 2x AIM-9L', ammo: 940, affiliation: '加拿大空軍第409中隊 (CAF, 西德巴登)', nation: 'canada' },
        { model: 'f16a', role: 'fighter', modelName: 'F-16A 戰隼 (MLU 前)', speed: getAircraftSpeed('f16a'), baseHealth: 760, payloadType: 'aim9_sidewinder', payloadName: '4x AIM-9 + M61', ammo: 940, affiliation: '荷蘭皇家空軍第322中隊 (RNLAF)', nation: 'netherlands' },
      ];
    }

    const fighters = pool.filter((p) => p.role === 'fighter');
    const strikers = pool.filter((p) => p.role !== 'fighter');
    const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

    const hostilePlanes = this.aircraft.filter((a) => this.isHostile('allied', a.side) && a.state !== 'shot_down');
    const hostileShips = this.enemyShips.filter((s) => !s.isSunk);
    const hostileGround = this.groundUnits.filter((u) => this.isHostile('allied', u.side) && !u.isDestroyed);
    const fleetPos = this.getFlagship()?.pos ?? baseCenter;

    // Three sortie types: escort an allied strike already airborne without cover, a strike package
    // (2-4 strikers of one type with a 2-ship escort), or a 2-4 ship barrier CAP on the threat axis
    const unescorted = this.findUnescortedPackage('allied');
    let banner: string;
    if (unescorted && fighters.length > 0) {
      const f = pick(fighters);
      this.launchAlliedFlight(f, 2, sqId, baseCenter, heading, { type: 'patrol', patrolOrigin: { ...unescorted.pos } }, 'escort', unescorted.packageId);
      banner = `${f.affiliation} 2架 ${f.modelName} 升空，為空中的盟軍打擊編隊擔任護航`;
    } else if (strikers.length > 0 && (hostileShips.length > 0 || hostileGround.length > 0) && Math.random() < 0.6) {
      const s = pick(strikers);
      const strikeCount = s.role === 'level_bomber' ? 2 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 4);
      const target =
        (s.role === 'attacker' || s.role === 'torpedo_bomber') && hostileShips.length > 0
          ? hostileShips[0].pos
          : hostileGround.length > 0
          ? hostileGround[0].pos
          : hostileShips[0].pos;
      this.launchAlliedFlight(s, strikeCount, sqId, baseCenter, heading, { type: 'attack', targetPos: { ...target } });
      if (fighters.length > 0) {
        const f = fighters.find((x) => x.affiliation === s.affiliation) ?? pick(fighters);
        // Escort scales with the package: a pair for a small strike, a division for a big one
        this.launchAlliedFlight(f, strikeCount >= 4 ? 4 : 2, sqId, baseCenter, heading, { type: 'patrol', patrolOrigin: { ...baseCenter } });
      }
      this.organizeStrikePackage(sqId);
      banner = `${s.affiliation} ${strikeCount}架 ${s.modelName} 打擊編隊${fighters.length > 0 ? `（含 ${strikeCount >= 4 ? 4 : 2} 架護航戰鬥機）` : ''}出擊`;
    } else {
      const f = fighters.length > 0 ? pick(fighters) : pick(pool);
      const capCount = 2 + Math.floor(Math.random() * 3);
      const threat = this.getEnemyAirThreatAxis() ?? hostilePlanes[0]?.pos;
      this.launchAlliedFlight(f, capCount, sqId, baseCenter, heading, { type: 'patrol', patrolOrigin: barrierStation(fleetPos, threat, 1800) }, 'barcap');
      banner = `${f.affiliation} ${capCount}架 ${f.modelName} 於艦隊與敵機場之間建立阻絕戰鬥空中巡邏 (BARCAP)`;
    }

    soundEngine.playPlaneSortie();
    this.addBannerAlert(`✈️【盟軍航空特遣隊出擊】${banner}！`, 'player', 'alert', 6.0);
    this.addCombatLog({
      category: 'air',
      sourceSide: 'allied',
      sourceName: '盟軍航空部隊',
      targetName: '戰區空域',
      actionType: 'recon_spotted',
      text: `✈️【盟軍航空出擊】${banner}。`,
    });
  }

  /** Puts one allied flight in the air from the friendly base. */
  private launchAlliedFlight(
    choice: { model: AircraftModel; role: AircraftRole; modelName: string; speed: number; baseHealth: number; payloadType: AircraftPayloadType; payloadName: string; ammo: number; affiliation: string; nation?: AircraftNation },
    count: number,
    sqId: string,
    baseCenter: Vector2D,
    heading: number,
    order: UnitOrder,
    airMission?: 'escort' | 'barcap',
    packageId?: string
  ): void {
    const ts = Date.now();
    for (let i = 0; i < count; i++) {
      this.aircraft.push({
        id: `allied-${choice.model}-${ts}-${i}-${Math.floor(Math.random() * 1e6)}`,
        squadronId: sqId,
        model: choice.model,
        role: choice.role,
        name: `【盟軍】${choice.affiliation} · ${choice.modelName} (#${i + 1})`,
        side: 'allied',
        pos: { x: baseCenter.x + (i - (count - 1) / 2) * 32, y: baseCenter.y + (i - (count - 1) / 2) * 22 },
        vel: { x: Math.cos(heading) * choice.speed, y: Math.sin(heading) * choice.speed },
        heading,
        targetHeading: heading,
        speed: choice.speed,
        maxSpeed: choice.speed,
        altitude: choice.role === 'level_bomber' ? 0.95 : 0.82,
        state: airMission ? 'patrolling' : 'cruising',
        health: choice.baseHealth,
        maxHealth: choice.baseHealth,
        order: { ...order },
        hasPayload: true,
        payloadType: choice.payloadType,
        payloadName: choice.payloadName,
        shootCooldown: 0,
        gunAmmo: choice.ammo,
        maxGunAmmo: choice.ammo,
        wingmanOffset: { x: (i - (count - 1) / 2) * 32, y: i * 22 },
        flightName: `${choice.affiliation} · 盟軍特遣航空隊 (${choice.model.toUpperCase()})`,
        airMission,
        packageId,
        nation: choice.nation,
      });
    }
  }


  // ══════════════════════════════════════════════════════════
  // 跨時代盟軍水面打擊群 (Allied Surface Action Group - SAG)
  // 時代一：英國皇家海軍 (King George V BB + Sheffield CL + Jervis DD)
  // 時代二：英國皇家海軍 (Duke of York BB + Belfast CL + Armada DD)
  // 時代三：聯合國軍海軍特遣隊 (Belfast CL + Cossack DD + Defender DD)
  // 時代四：50% 北約特遣艦隊 (Sheffield Type 42 + Andromeda Leander) vs 50% 海上自衛隊 (Haruna DDH + Takatsuki DD)
  // 時代五：50% 北約特遣部隊 (Gloucester Type 42 B2 + Bremen F122 + Tourville F67) vs 50% 海上自衛隊 (Shirane DDH + Asagiri DD + Hatsuyuki FF)
  // 嚴格防止 Blue on blue: side: 'allied' 判定敵對僅對 'enemy' 生效，與玩家同袍協同作戰！
  // ══════════════════════════════════════════════════════════
  private spawnAlliedSAG() {
    // 限制戰場上存活的盟軍艦艇總數，避免畫面過度壅塞
    const activeAllied = this.alliedShips.filter((s) => !s.isSunk);
    if (activeAllied.length >= 9) return;

    const spawnX = 350;
    const centerY = this.worldSize / 2;
    const ts = Date.now();

    const { title: sagTitle, ships: sagShipsDef } = getAlliedSagFleet(this.era);

    // 生成水面打擊群艦艇
    sagShipsDef.forEach((def, idx) => {
      const shipY = centerY + (idx - Math.floor(sagShipsDef.length / 2)) * 130;
      const ship: Ship = {
        id: `allied-sag-${ts}-${idx}`,
        name: def.name,
        codeName: def.codeName,
        type: def.type,
        side: 'allied',
        era: this.era,
        armor: def.type === 'battleship' ? 0.48 : def.type === 'cruiser' ? 0.34 : def.type === 'ddg' || def.type === 'ddg_kidd' ? 0.24 : 0.18,
        detectionRange: 3600,
        wakePoints: [],
        isAlliedSAG: true,
        alliedSAGName: sagTitle,
        pos: { x: spawnX, y: shipY },
        vel: { x: 0, y: 0 },
        heading: 0,
        targetHeading: 0,
        speed: def.speed * 0.75,
        targetSpeed: def.speed,
        maxSpeed: def.speed,
        turnRate: 0.8,
        length: def.length,
        width: def.width,
        health: def.maxHealth,
        maxHealth: def.maxHealth,
        hullCrewHealth: def.maxHealth,
        maxHullCrewHealth: def.maxHealth,
        weaponControlHealth: def.maxHealth,
        maxWeaponControlHealth: def.maxHealth,
        isSunk: false,
        sinkProgress: 0,
        turrets: def.turrets.map((t) => {
          const gun = getNavalGunPerformance(t.caliber);
          const reload = gun?.reloadTime ?? t.reloadTime ?? t.maxCooldown ?? 4.0;
          return {
          relX: t.relX ?? t.pos?.x ?? 0,
          relY: t.relY ?? t.pos?.y ?? 0,
          pos: t.pos,
          caliber: t.caliber,
          range: gun?.range ?? getNavalLauncherRange(t.caliber) ?? t.range,
          cooldown: t.cooldown,
          reloadTime: reload,
          maxCooldown: gun ? reload : t.maxCooldown ?? t.reloadTime ?? 4.0,
          barrelCount: t.barrelCount ?? 2,
          angle: t.angle,
          arcMin: -Math.PI * 0.85,
          arcMax: Math.PI * 0.85,
          damage: gun?.damage ?? t.damage,
          id: t.id,
          };
        }),
        flakRange: def.flakRange,
        flakCooldown: 0,
        hasHarpoon: def.hasHarpoon,
        ashmType: def.ashmType,
        hasCIWS: def.hasCIWS,
        hasASROC: def.hasASROC,
        hasModernNavalGunAA: def.hasModernNavalGunAA,
        hasSAM: def.hasSAM,
        samRange: def.samRange,
        samModel: def.samModel,
        samCooldown: 0,
        readySAMs: def.hasSAM ? 32 : 0,
        maxSAMs: def.hasSAM ? 32 : 0,
        torpedoCooldown: def.torpedoCooldown,
        // Commonwealth / allied escorts all carried depth-charge rails and throwers
        hasDepthCharges: def.type === 'destroyer' || def.type === 'ffg' || def.type === 'ddg',
        depthChargeCooldown: 0,
        sonarRange:
          def.hasASROC || def.type === 'destroyer'
            ? this.era === 'era5'
              ? 2000
              : this.era === 'era4'
              ? 1650
              : 1050
            : 0,
        order: {
          type: 'move',
          targetPos: { x: this.worldSize - 600, y: shipY },
        },
      };
      applyHistoricalAswFit(ship);
      if (this.navGrid) {
        ship.pos = this.navGrid.projectToWalkableWater(ship.pos);
        ship.order.waypoints = this.navGrid.findPath(ship.pos, { x: this.worldSize - 600, y: shipY });
        ship.order.activeWaypointIndex = 0;
      }
      this.alliedShips.push(ship);
    });

    soundEngine.playKlaxon();
    this.addBannerAlert(
      `⚓【盟軍水面打擊群 (SAG) 抵達戰區！】「${sagTitle}」奉命編隊投入戰鬥！自主巡航防空對敵！`,
      'player',
      'alert',
      7.0
    );
    this.addCombatLog({
      category: 'naval',
      sourceSide: 'allied',
      sourceName: sagTitle,
      targetName: '戰區海域',
      actionType: 'recon_spotted',
      text: `⚓【盟軍打擊群編隊進駐】「${sagTitle}」共 ${sagShipsDef.length} 艘主力戰艦駛入作戰海域，全艦雷達開機，自主巡航協同防空與反艦獵殺！`,
    });
  }

  // ══════════════════════════════════════════════════════════
  // 盟軍水面艦艇自主 AI (Allied Ship Autonomous Patrol & Strike AI with A* Routing)
  // 行為：自主搜尋敵艦、敵軍島嶼陣地，維持作戰陣位並以 A* 海上航道網繞越島礁
  // ══════════════════════════════════════════════════════════
  private updateAlliedShipAI(ship: Ship, dt: number) {
    if (ship.isSunk) return;

    // 1. 自主導航：搜尋最近之敵方水面艦艇或未奪取島嶼，結合 NavalNavigationGrid A* 航路規劃
    const enemySurfaceShips = this.enemyShips.filter((e) => !e.isSunk && !this.isSubmarine(e));
    let navDestination: Vector2D | null = null;
    let tacticalInterceptHeading: number | null = null;

    if (enemySurfaceShips.length > 0) {
      enemySurfaceShips.sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
      const closestEnemy = enemySurfaceShips[0];
      const d = dist(ship.pos, closestEnemy.pos);

      if (d < 1600 && (!this.navGrid || this.navGrid.hasClearWaterLine(ship.pos, closestEnemy.pos))) {
        const bearing = Math.atan2(closestEnemy.pos.y - ship.pos.y, closestEnemy.pos.x - ship.pos.x);
        tacticalInterceptHeading = d < 1050 ? bearing + Math.PI * 0.72 : bearing + Math.PI * 0.25;
        ship.targetSpeed = ship.maxSpeed;
      } else {
        navDestination = { ...closestEnemy.pos };
      }
    }

    if (tacticalInterceptHeading === null) {
      if (!navDestination) {
        const enemyIslands = this.islands.filter((i) => !i.isFullyCaptured && !i.isFriendlyBase);
        if (enemyIslands.length > 0) {
          enemyIslands.sort((a, b) => dist(ship.pos, a.center) - dist(ship.pos, b.center));
          const isl = enemyIslands[0];
          const standOffAngle = Math.atan2(ship.pos.y - isl.center.y, ship.pos.x - isl.center.x);
          navDestination = {
            x: isl.center.x + Math.cos(standOffAngle) * (isl.radius + 420),
            y: isl.center.y + Math.sin(standOffAngle) * (isl.radius + 420),
          };
        } else {
          navDestination = { x: this.worldSize - 900, y: ship.pos.y };
        }
      }

      if (this.navGrid) {
        navDestination = this.navGrid.projectToWalkableWater(navDestination);
        const needNewPath =
          !ship.order.waypoints ||
          ship.order.waypoints.length === 0 ||
          (ship.repathCooldown || 0) <= 0 ||
          ship.navStuck;
        if (needNewPath) {
          ship.order.waypoints = this.navGrid.findPath(ship.pos, navDestination);
          ship.order.activeWaypointIndex = 0;
          ship.order.targetPos = navDestination;
          ship.repathCooldown = 3.5;
          ship.navStuck = false;
        }
        const wps = ship.order.waypoints || [navDestination];
        const activeWp = this.advanceSeaLane(ship, wps) || navDestination;
        ship.targetHeading = Math.atan2(activeWp.y - ship.pos.y, activeWp.x - ship.pos.x);
      } else {
        ship.targetHeading = Math.atan2(navDestination.y - ship.pos.y, navDestination.x - ship.pos.x);
      }
      ship.targetSpeed = ship.maxSpeed * 0.9;
    } else {
      ship.targetHeading = tacticalInterceptHeading;
    }

    // 1b. 反潛獵殺：持有或剛失去潛艦接觸的護航艦以搜索航速逼近目標或最後已知位置
    const hunt = this.findAswHunt(ship);
    if (hunt) {
      const steer = this.getEnemySteerPoint(ship, hunt.pos);
      ship.targetHeading = Math.atan2(steer.y - ship.pos.y, steer.x - ship.pos.x);
      ship.targetSpeed = hunt.speedKt;
    }

    // 2. 自主特殊武裝反擊 (Harpoon / Exocet / Torpedo / ASROC - 反潛武器僅針對已定位潛艦)
    if (ship.hasHarpoon) {
      if (ship.harpoonCooldown !== undefined && ship.harpoonCooldown > 0) {
        ship.harpoonCooldown = Math.max(0, ship.harpoonCooldown - dt);
      }
      if ((ship.harpoonCooldown || 0) <= 0) {
        const inRangeWarships = this.enemyShips
          .filter((s) => !s.isSunk && !this.isSubmarine(s) && dist(ship.pos, s.pos) <= 4200)
          .sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos));
        if (inRangeWarships.length > 0) {
          this.fireAlliedShipAShMSalvo(ship, inRangeWarships);
          ship.harpoonCooldown = 26.0;
        }
      }
    }

    if (ship.torpedoCooldown !== undefined) {
      ship.torpedoCooldown = Math.max(0, ship.torpedoCooldown - dt);
      if (ship.torpedoCooldown <= 0) {
        const closeEnemy = this.enemyShips.find(
          (s) => !s.isSunk && !this.isSubmarine(s) && dist(ship.pos, s.pos) <= 1800
        );
        if (closeEnemy) {
          this.fireTorpedoSalvo(ship, closeEnemy.pos, 2);
          ship.torpedoCooldown = 30.0;
        }
      }
    }

    if (ship.hasASROC) {
      if (ship.asrocCooldown !== undefined && ship.asrocCooldown > 0) {
        ship.asrocCooldown = Math.max(0, ship.asrocCooldown - dt);
      }
      if ((ship.asrocCooldown || 0) <= 0) {
        const reach = 2400 * STANDOFF_ASW[ship.standoffAswWeapon ?? 'ASROC'].rangeFactor;
        const enemySub = this.enemyShips.find(
          (s) => !s.isSunk && this.isSubmarine(s) && s.isSpotted && dist(ship.pos, s.pos) <= reach
        );
        if (enemySub) {
          this.fireASROC(ship, enemySub.pos, enemySub.id);
          ship.asrocCooldown = 28.0;
        }
      }
    }

    if (ship.hasSVTT) {
      ship.svttCooldown = Math.max(0, (ship.svttCooldown || 0) - dt);
      if (ship.svttCooldown <= 0) {
        const closeSub = this.enemyShips.find(
          (s) => !s.isSunk && this.isSubmarine(s) && s.isSpotted && dist(ship.pos, s.pos) <= 1000
        );
        if (closeSub) {
          this.fireSVTT(ship, closeSub.pos);
          ship.svttCooldown = 28.0;
        }
      }
    }

    // 3. 自主防空飛彈系統 (Allied SAG SAM Defense & TBM / AShM Interception)
    if (ship.hasSAM) {
      if (ship.samCooldown !== undefined && ship.samCooldown > 0) {
        ship.samCooldown = Math.max(0, ship.samCooldown - dt);
      }
      if ((ship.samCooldown || 0) <= 0) {
        const samRange = ship.samRange || 2800;
        // 優先攔截來襲敵方反艦飛彈、巡弋飛彈與戰術彈道飛彈 (Scud-B 等)
        const incomingThreats = this.projectiles.filter(
          (p) => !p.isDead && this.isHostile(ship.side, p.side) && (p.type === 'missile_ashm' || p.type === 'missile_cruise' || p.type === 'missile_ssm') && dist(ship.pos, p.pos) <= samRange
        );
        if (incomingThreats.length > 0) {
          this.launchShipSamSalvo(ship, incomingThreats, (m) => this.fireSAM(ship, m, 'projectile'), (m) => !m.isDead);
        } else {
          // 攔截防空射程內之敵方戰鬥機或轟炸機
          const hostilePlanes = this.aircraft.filter(
            (a) => this.isHostile(ship.side, a.side) && a.state !== 'shot_down' && dist(ship.pos, a.pos) <= samRange
          );
          if (hostilePlanes.length > 0) {
            this.launchShipSamSalvo(ship, hostilePlanes, (a) => this.fireSAM(ship, a, 'aircraft'), (a) => a.state !== 'shot_down');
          }
        }
      }
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

  // ══════════════════════════════════════════════════════════
  // 時代四 蘇聯/北越「一擊脫離 (Hit & Run)」戰術指揮
  // ══════════════════════════════════════════════════════════
  private triggerSovietHitAndRun(plane: Aircraft, threatPos?: Vector2D) {
    if (plane.side !== 'enemy') return;
    if (plane.model !== 'mig21' && plane.model !== 'mig17' && plane.model !== 'mig19') return;

    plane.isHitAndRunActive = true;
    plane.hitAndRunStage = 'disengaging';
    plane.disengageTimer = 5.2 + Math.random() * 1.8;

    // 計算背向交火點之脫離航向 (Bug-out Heading)
    const baseAngle = threatPos
      ? Math.atan2(plane.pos.y - threatPos.y, plane.pos.x - threatPos.x)
      : plane.heading;
    const dogleg = (Math.random() - 0.5) * 0.75;
    plane.bugOutHeading = baseAngle + dogleg;
    plane.targetHeading = plane.bugOutHeading;

    if (plane.model === 'mig21') {
      plane.speed = plane.maxSpeed * 1.55;
      soundEngine.playRocketWhoosh();
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: '北越空軍 GCI 地面導引台',
        targetName: plane.name,
        actionType: 'recon_spotted',
        text: `⚡【蘇聯一擊脫離 (Hit & Run)】「${plane.name}」完成超音速呼嘯掠殺！開全後燃器 (Mach 1.5+) 大仰角躍升脫離戰區！甩開美軍空對空飛彈！`,
      });
    } else if (plane.model === 'mig17') {
      plane.speed = plane.maxSpeed * 1.25;
      this.addCombatLog({
        category: 'air',
        sourceSide: 'enemy',
        sourceName: '北越人民軍空軍 921 團',
        targetName: plane.name,
        actionType: 'recon_spotted',
        text: `⚡【低空隱蔽脫離】「${plane.name}」完成近距呼嘯掃射後立即破轉，貼海超低空全速脫離雷達視野！`,
      });
    } else {
      plane.speed = plane.maxSpeed * 1.35;
    }
  }

  // ══════════════════════════════════════════════════════════
  // 四時代 OPFOR 水面打擊群 (Surface Action Group - SAG) 週期出擊
  // ══════════════════════════════════════════════════════════
  private spawnOpforSagSortie() {
    // 嚴格確保水面特混打擊群 (SAG) 誕生於開闊深海大洋，絕不重疊任何島嶼或大陸陸地！
    let spawnPos: Vector2D = { x: 2600, y: 1800 };
    let validWaterFound = false;

    for (let attempt = 0; attempt < 60; attempt++) {
      let testX: number;
      let testY: number;

      if (this.era === 'era4' || this.era === 'era5') {
        // 大陸地形時代：大陸西側沿海分界線約在 X = 4900，西側開闊海域 (X: 1800 ~ 4400, Y: 1200 ~ 4000) 均為安全大洋
        testX = 1800 + Math.random() * 2600;
        testY = 1200 + Math.random() * 2800;
      } else {
        // 海島時代 (Era 1~3)：東外海開闊深水水域 (X: 7200 ~ 10500, Y: 1000 ~ 3200)
        testX = 7200 + Math.random() * 3200;
        testY = 1000 + Math.random() * 2200;
      }

      // 遠離我軍出發泊地基地至少 2800m
      if (this.friendlyBase && dist({ x: testX, y: testY }, this.friendlyBase.center) < 2800) {
        continue;
      }

      // 驗證是否重疊任何島嶼地形或大陸多邊形
      let onLand = false;
      for (const isl of this.islands) {
        if (isPointInPolygon({ x: testX, y: testY }, isl.points) || dist({ x: testX, y: testY }, isl.center) < isl.radius + 250) {
          onLand = true;
          break;
        }
      }

      if (!onLand) {
        spawnPos = { x: testX, y: testY };
        validWaterFound = true;
        break;
      }
    }

    if (!validWaterFound) {
      spawnPos = (this.era === 'era4' || this.era === 'era5') ? { x: 2800, y: 2200 } : { x: 8800, y: 1600 };
    }

    soundEngine.playKlaxon();

    if (this.era === 'era1') {
      // Era 1 (1942): IJN Chōkai Heavy Cruiser + Sendai Light Cruiser + 2x Kagerō/Yūgumo DDs
      const chokai = createChokaiCA(`opfor-sag-chokai-${Date.now()}`, 'IJN Chōkai (鳥海號 重巡洋艦)', spawnPos);
      const sendai = createSendaiCL(`opfor-sag-sendai-${Date.now()}`, 'IJN Sendai (川內號 輕巡洋艦)', { x: spawnPos.x + 120, y: spawnPos.y + 70 });
      const kagero1 = createTokyoExpressDD(`opfor-sag-dd1-${Date.now()}`, 'IJN Kagero (陽炎號 驅逐艦)', { x: spawnPos.x - 110, y: spawnPos.y - 60 });
      const kagero2 = createTokyoExpressDD(`opfor-sag-dd2-${Date.now()}`, 'IJN Yūgumo (夕雲號 驅逐艦)', { x: spawnPos.x - 130, y: spawnPos.y + 80 });

      this.enemyShips.push(chokai, sendai, kagero1, kagero2);

      this.addBannerAlert(
        `🚨【OPFOR 水面打擊群出擊！】IJN 第八艦隊「鳥海」重巡洋艦領銜水面特混打擊群 (SAG) 自外海切入！裝備 203mm 艦砲與九三式氧氣魚雷！`,
        'enemy',
        'down',
        7.0
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: 'IJN 第八艦隊水面打擊群 (SAG)',
        targetName: '美軍特混艦隊',
        actionType: 'recon_spotted',
        text: `🚨【敵 SAG 突擊作戰】偵測到日軍「鳥海號」重巡洋艦、川內號輕巡洋艦與 2 艘陽炎級驅逐艦組成強大水面打擊群！企圖搶佔有利砲戰陣位！`,
      });
    } else if (this.era === 'era2') {
      // Era 2 (1945): IJN Kongō Fast Battleship + 2x Akizuki AA DDs + Yukikaze DD
      const kongo = createKongoBB(`opfor-sag-kongo-${Date.now()}`, 'IJN Kongō (金剛號 高速戰艦)', spawnPos);
      const akizuki1 = createAkizukiDD(`opfor-sag-akizuki1-${Date.now()}`, 'IJN Akizuki (秋月號 防空驅逐艦)', { x: spawnPos.x + 130, y: spawnPos.y + 60 });
      const akizuki2 = createAkizukiDD(`opfor-sag-akizuki2-${Date.now()}`, 'IJN Hatsuzuki (初月號 防空驅逐艦)', { x: spawnPos.x + 130, y: spawnPos.y - 60 });
      const yukikaze = createTokyoExpressDD(`opfor-sag-dd-${Date.now()}`, 'IJN Yukikaze (雪風號 驅逐艦)', { x: spawnPos.x - 120, y: spawnPos.y });

      this.enemyShips.push(kongo, akizuki1, akizuki2, yukikaze);

      this.addBannerAlert(
        `🚨【OPFOR 戰艦打擊群出擊！】IJN「金剛號」高速戰艦率秋月級防空驅逐艦隊長驅直入！356mm 連裝主砲火力威脅極大！`,
        'enemy',
        'down',
        7.0
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: 'IJN 挺身水面突擊群 (SAG)',
        targetName: '美軍登陸艦隊與特遣航母群',
        actionType: 'recon_spotted',
        text: `🚨【戰艦特混突擊群來襲】日軍「金剛號」高速戰艦在「秋月號」、「初月號」高密防空驅逐艦護航下突入海域！主砲射程達 1800m，立即調派俯衝轟炸機與魚雷機截擊！`,
      });
    } else if (this.era === 'era3') {
      // Era 3 (1950): Soviet Project 68bis Sverdlov Light Cruiser + 2x Kotlin Gun DDs
      const sverdlov = createSverdlovCL(`opfor-sag-sverdlov-${Date.now()}`, 'Soviet Sverdlov (斯維爾德洛夫號 輕巡洋艦)', spawnPos);
      const kotlin1 = createKotlinDD(`opfor-sag-kotlin1-${Date.now()}`, 'Soviet Kotlin (科特林級 驅逐艦 #321)', { x: spawnPos.x + 120, y: spawnPos.y + 60 });
      const kotlin2 = createKotlinDD(`opfor-sag-kotlin2-${Date.now()}`, 'Soviet Kotlin (科特林級 驅逐艦 #322)', { x: spawnPos.x - 120, y: spawnPos.y - 60 });

      this.enemyShips.push(sverdlov, kotlin1, kotlin2);

      this.addBannerAlert(
        `🚨【OPFOR 冷戰水面打擊群出擊！】蘇聯海軍 Project 68bis「斯維爾德洛夫號」火砲輕巡洋艦率科特林級驅逐艦出擊！`,
        'enemy',
        'down',
        7.0
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: '蘇聯海軍遠東第7艦隊打擊群',
        targetName: '美軍第7艦隊',
        actionType: 'recon_spotted',
        text: `🚨【冷戰火砲水面打擊群】蘇聯 Project 68bis 斯維爾德洛夫級輕巡洋艦 (12門 152mm 主砲) 與 2 艘科特林級高速砲雷驅逐艦逼近！`,
      });
    } else if (this.era === 'era4') {
      // Era 4 (1968): Soviet Kynda Guided Missile Cruiser + Petya ASW Frigate + 2x Osa Missile Boats
      const kynda = createKyndaCG(`opfor-sag-kynda-${Date.now()}`, 'Soviet Kynda (肯達級 飛彈巡洋艦 Грозный)', spawnPos);
      const petya = createPetyaFFG(`opfor-sag-petya-${Date.now()}`, 'Soviet Petya (佩佳級 反潛護衛艦 СКР-1)', { x: spawnPos.x - 110, y: spawnPos.y + 60 });
      const osa1 = createOsaPTG(`opfor-sag-osa1-${Date.now()}`, '北越 Project 205 Osa 飛彈快艇 (#1)', { x: spawnPos.x + 100, y: spawnPos.y + 50 });
      const osa2 = createOsaPTG(`opfor-sag-osa2-${Date.now()}`, '北越 Project 205 Osa 飛彈快艇 (#2)', { x: spawnPos.x + 100, y: spawnPos.y - 50 });

      this.enemyShips.push(kynda, petya, osa1, osa2);

      this.addBannerAlert(
        `🚨【OPFOR 飛彈打擊群 (SAG) 出擊！】蘇聯 Project 58「肯達級」飛彈巡洋艦率佩佳級護衛艦與歐薩飛彈快艇抵達！搭載 P-35 巨型超音速反艦飛彈！`,
        'enemy',
        'down',
        7.5
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: '蘇聯紅海軍分艦隊 & 北越海軍',
        targetName: '美軍第77特遣水面群',
        actionType: 'recon_spotted',
        text: `🚨【現代化超音速反艦飛彈威脅】蘇聯 Project 58 Kynda 飛彈巡洋艦進逼！配備 8枚 P-35 (SS-N-3b 沙道克) 遠程反艦飛彈與伏爾納艦對空飛彈，全面威脅美軍航母戰鬥群！`,
      });
    } else {
      // Era 5 (1973–1991): Soviet Kirov Nuclear Guided Missile Cruiser + Sovremenny DD + Udaloy ASW DD
      const kirov = createKirovCGN(`opfor-sag-kirov-${Date.now()}`, 'Project 1144 Kirov (基洛夫級 核動力飛彈巡洋艦)', spawnPos);
      const sovremenny = createSovremennyDD(`opfor-sag-sov-${Date.now()}`, 'Project 956 Sovremenny (現代級 飛彈驅逐艦)', { x: spawnPos.x + 130, y: spawnPos.y + 60 });
      const udaloy = createUdaloyDD(`opfor-sag-uda-${Date.now()}`, 'Project 1155 Udaloy (無畏級 大型反潛驅逐艦)', { x: spawnPos.x - 120, y: spawnPos.y - 60 });

      this.enemyShips.push(kirov, sovremenny, udaloy);

      this.addBannerAlert(
        `🚨【OPFOR 紅海軍核動力水面打擊群出擊！】蘇聯海軍 Project 1144「基洛夫級」核巡洋艦率現代級、無畏級抵達！裝備 20枚 P-700 花崗岩超音速重型反艦飛彈！`,
        'enemy',
        'down',
        8.0
      );
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'enemy',
        sourceName: '蘇聯紅旗北方艦隊 水面打擊特遣隊 (SAG)',
        targetName: '美軍尼米茲航母戰鬥群',
        actionType: 'recon_spotted',
        text: `🚨【現代超音速飽和打擊群進逼】蘇聯海軍「基洛夫號」核動力重型飛彈巡洋艦 (P-700 花崗岩 + S-300F 區域防空) 與現代級 (日獅反艦飛彈)、無畏級 (大型反潛) 編隊切入戰區！`,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // 跨時代 OPFOR 潛艦狼群獨立增援 (SS Wolfpack: 1-3艘, 每 160-220s)
  // Era 1-2: 納粹德國季風潛艇 (Monsun U-Boat) 或 大日本帝國伊號潛艦
  // Era 3-5: 蘇聯海軍 Whiskey/Zulu -> Foxtrot -> Victor III / Akula / Oscar II
  // ══════════════════════════════════════════════════════════
  private spawnOpforWolfpackSortie() {
    const activeSubs = this.enemyShips.filter((s) => !s.isSunk && this.isSubmarine(s)).length;
    if (activeSubs >= 6) return;

    const packSize = 1 + Math.floor(Math.random() * 3); // 1 to 3 submarines
    let anchorPos: Vector2D = { x: 4200, y: 2600 };

    for (let attempt = 0; attempt < 60; attempt++) {
      const testX =
        this.era === 'era4' || this.era === 'era5'
          ? 1600 + Math.random() * 2800
          : 5800 + Math.random() * 4800;
      const testY = 1100 + Math.random() * (this.worldSize - 3200);
      const cand = { x: testX, y: testY };

      if (this.friendlyBase && dist(cand, this.friendlyBase.center) < 2600) continue;
      if ([...this.playerShips, ...this.alliedShips].some((ps) => !ps.isSunk && dist(cand, ps.pos) < 1800)) continue;

      let onLand = false;
      for (const isl of this.islands) {
        if (isPointOnIslandLand(cand, isl) || dist(cand, isl.center) < isl.radius + 220) {
          onLand = true;
          break;
        }
      }
      if (!onLand) {
        anchorPos = cand;
        break;
      }
    }

    const useUBoat = (this.era === 'era1' || this.era === 'era2') && Math.random() < 0.5;
    const spawnedSubs: Ship[] = [];
    const ts = Date.now();

    for (let i = 0; i < packSize; i++) {
      const offsetPosRaw = {
        x: anchorPos.x + (i - (packSize - 1) / 2) * 190,
        y: anchorPos.y + (i % 2 === 0 ? -90 : 90),
      };
      const subPos = this.navGrid ? this.navGrid.projectToWalkableWater(offsetPosRaw) : offsetPosRaw;

      let sub: Ship;
      if (this.era === 'era1' || this.era === 'era2') {
        sub = useUBoat
          ? createMonsunUBoatSS(`wolfpack-uboat-${ts}-${i}`, `Kriegsmarine U-${178 + i * 7} 季風遠洋潛艇`, subPos, this.era)
          : createIjnIBoatSS(`wolfpack-ijn-${ts}-${i}`, `IJN 伊-${19 + i * 7} 號巡潛型潛艦`, subPos, this.era);
      } else if (this.era === 'era3') {
        const isZulu = i === 0 && Math.random() < 0.45;
        sub = createSovietWhiskeySS(
          `wolfpack-whiskey-${ts}-${i}`,
          isZulu ? `蘇聯 Project 611 Zulu級 遠洋潛艦 B-${62 + i}` : `蘇聯 Project 613 Whiskey級 潛艦 S-${80 + i * 4}`,
          subPos,
          isZulu ? 'zulu' : 'whiskey'
        );
      } else if (this.era === 'era4') {
        sub = createFoxtrotSS(`wolfpack-foxtrot-${ts}-${i}`, `蘇聯 Project 641 Foxtrot級 柴電潛艦 B-${39 + i}`, subPos);
      } else {
        // Era 5: Victor III / Akula SSN or occasional Oscar II SSGN lead
        if (i === 0 && Math.random() < 0.35) {
          sub = createOscarSSGN(`wolfpack-oscar-${ts}-${i}`, `蘇聯 Project 949A 奧斯卡 II 級巡弋核潛艦 K-${132 + i}`, subPos);
        } else {
          const r = Math.random();
          const isAkula = r < 0.35;
          if (r > 0.75) {
            sub = createKiloSS(`wolfpack-kilo-${ts}-${i}`, `蘇聯 Project 877 Kilo 基洛級靜音柴電潛艦 B-${400 + i}`, subPos);
          } else sub = createSovietVictor3SSN(
            `wolfpack-ssn-${ts}-${i}`,
            isAkula ? `蘇聯 Project 971 Akula 阿庫拉級核動力攻擊潛艦 K-${284 + i}` : `蘇聯 Project 671RTM Victor III 核動力攻擊潛艦 K-${255 + i}`,
            subPos,
            isAkula ? 'akula' : 'victor3'
          );
        }
      }

      // 保持戰爭迷霧水下隱蔽狀態
      sub.isSubmerged = true;
      sub.isSpotted = false;
      sub.spottedTimer = 0;
      this.enemyShips.push(sub);
      spawnedSubs.push(sub);
    }

    const packFlavor =
      this.era === 'era1' || this.era === 'era2'
        ? useUBoat
          ? '納粹德國海軍「季風集團 (Gruppe Monsun)」遠洋 U-Boat 狼群'
          : '大日本帝國海軍「伊號」遠洋巡潛狼群'
        : this.era === 'era3'
        ? '蘇聯太平洋艦隊 Project 613 Whiskey / Zulu 級潛艦狼群'
        : this.era === 'era4'
        ? '蘇聯太平洋艦隊 Project 641 Foxtrot 級遠洋柴電潛艦狼群'
        : '蘇聯紅旗太平洋艦隊 Victor III / Akula 級核動力攻擊潛艦狼群';

    this.addCombatLog({
      category: 'naval',
      sourceSide: 'enemy',
      sourceName: 'SOSUS / 艦隊水聽監聽站',
      targetName: '深海潛航威脅區',
      actionType: 'recon_spotted',
      text: `🎧【深海低頻音響警報！】戰區水下聽音陣列偵測到疑似 ${spawnedSubs.length} 艘「${packFlavor}」深潛滲透戰區！目標處於戰爭迷霧深潛靜默狀態，請立即派遣反潛驅逐艦與反潛機隊主動搜捕！`,
    });
  }

  private getAircraftAswSonarRange(plane: Aircraft): number {
    if (plane.model === 'be12') return 1650;
    if (plane.model === 'il38') return 1900;
    if (plane.model === 'ka27') return 1750;
    if (plane.model === 's3a' || plane.model === 'sh3f') return 1850;
    if (plane.model === 'p3' || plane.model === 'sh2' || plane.model === 'uh2') return 1650;
    if (plane.model === 'af_guardian' || plane.model === 's2' || plane.model === 'firefly_as5' || plane.model === 'ho3s1') return 1350;
    if (plane.model === 'os2u' || plane.model === 'sc1') return 1150;
    if (
      plane.payloadType === 'asw_torpedo' ||
      plane.payloadType === 'asw_acoustic_torpedo' ||
      plane.payloadType === 'asw_depth_bombs' ||
      plane.payloadType === 'depth_bombs' ||
      plane.payloadType === 'scout_depth_charge'
    ) {
      return 1450;
    }
    return 0;
  }

  public revealSubmarine(sub: Ship, duration: number, reason: 'sonar' | 'firing' | 'sonobuoy', sourceLabel?: string) {
    if (sub.isSunk) return;

    const logKey = `${sub.id}-${reason}`;
    const canLog = (this.sonarLogCooldowns[logKey] || 0) <= 0;

    sub.datumPos = { ...sub.pos };
    sub.datumAge = 0;
    if (sub.side === 'enemy') {
      const wasHidden = !sub.isSpotted;
      // First contact by sonar or a buoy field: the boat hears the ping and half the time evades
      if (wasHidden && reason !== 'firing' && Math.random() < 0.5) this.startSubmarineEvasion(sub, this.getFlagship()?.pos ?? sub.pos);
      sub.isSpotted = true;
      sub.spottedTimer = Math.max(sub.spottedTimer || 0, duration);

      if ((wasHidden || reason === 'firing') && canLog) {
        this.sonarLogCooldowns[logKey] = reason === 'sonobuoy' ? 20 : 18;
        this.particles.push({
          id: `fow-reveal-${Date.now()}-${Math.random()}`,
          x: sub.pos.x,
          y: sub.pos.y,
          vx: 0,
          vy: 0,
          life: 1.0,
          maxLife: 1.0,
          radius: reason === 'sonobuoy' ? 68 : 52,
          color: reason === 'firing' ? '#FF5252' : reason === 'sonobuoy' ? '#26C6DA' : '#00E5FF',
          type: 'shockwave',
          shape: 'ring',
        });

        this.addCombatLog({
          category: 'naval',
          sourceSide: 'player',
          sourceName:
            reason === 'firing'
              ? '水下聲學瞬態偵測'
              : reason === 'sonobuoy'
              ? sourceLabel || '空投被動聲納浮標網'
              : sourceLabel || '反潛聲吶監聽網',
          targetName: sub.name,
          actionType: 'recon_spotted',
          text:
            reason === 'firing'
              ? `🔴【敵潛艦發射武器暴露行蹤！】偵獲「${sub.name}」魚雷管/飛彈發射音紋！位置暫時暴露於戰術海圖（約 ${Math.round(duration)} 秒）！`
              : reason === 'sonobuoy'
              ? `📡【被動聲納浮標間歇接觸！】「${sourceLabel || '聲納浮標'}」擷取水下螺旋槳低頻噪聲，「${sub.name}」位置暫時閃現！`
              : `📡【敵潛艦聲吶接觸定位！】「${sourceLabel || '反潛巡邏隊'}」主動聲吶/磁異探測鎖定水下「${sub.name}」！`,
        });
      }
    } else {
      const wasHidden = !sub.isSpottedByEnemy;
      sub.isSpottedByEnemy = true;
      sub.enemySpottedTimer = Math.max(sub.enemySpottedTimer || 0, duration);

      if ((wasHidden || reason === 'firing') && canLog) {
        this.sonarLogCooldowns[logKey] = 18;
        this.addCombatLog({
          category: 'naval',
          sourceSide: 'enemy',
          sourceName: reason === 'firing' ? '潛艦射擊音紋暴露' : sourceLabel || '敵軍反潛聲吶',
          targetName: sub.name,
          actionType: 'recon_spotted',
          text:
            reason === 'firing'
              ? `⚠️【警告！我軍潛艦發射武器暴露位置】「${sub.name}」發射魚雷/飛彈產生噪音瞬態！已暫時被敵方反潛網標記位置！`
              : `⚠️【警告！敵軍反潛聲吶鎖定】敵「${sourceLabel || '反潛單位'}」偵獲我方潛艦「${sub.name}」水下位置！建議加速規避或脫離敵反潛圈！`,
        });
      }
    }
  }

  /** Ships guns can engage: surface ships, and WWII boats caught on the surface that this side can see. */
  private isGunTarget(s: Ship, shooterSide: Ship['side']): boolean {
    if (!this.isSubmarine(s)) return true;
    if (!isSurfacedBoat(s, this.era)) return false;
    return shooterSide === 'enemy' ? Boolean(s.isSpottedByEnemy) : Boolean(s.isSpotted);
  }

  /**
   * A submarine under attack evades: it turns away from the attack and either creeps away
   * slowly and quietly (diesel boats, "silent running") or sprints deep (nuclear boats).
   */
  private startSubmarineEvasion(sub: Ship, threatPos: Vector2D): void {
    if ((sub.evadeTimer || 0) > 0 || sub.isSunk) return;
    const away = Math.atan2(sub.pos.y - threatPos.y, sub.pos.x - threatPos.x);
    sub.evadeHeading = away + (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 3);
    sub.evadeTimer = isDieselBoat(sub) ? 30 : 18;
    sub.isSnorkeling = false;
  }

  /**
   * Target for an escort's anti-submarine hunt: a submarine its side currently holds, or the
   * datum (last known position) of one recently lost. Closed at hunting speed so the sonar keeps
   * working.
   */
  /**
   * A player escort with ASW weapons works a contact on its own: idle, it closes the held boat or
   * its datum at sonar search speed; under way, it slows to that speed while a contact is near so
   * flow noise does not blind the hull sonar.
   */
  private updatePlayerEscortAsw(ship: Ship): void {
    const hunt = this.findAswHunt(ship, 2600, 2000);
    const was = ship.aswHunting;
    ship.aswHunting = false;
    if (!hunt) return;
    if (ship.order.type === 'idle') {
      const steer = this.calculateNavalSteeringAvoidance(ship, Math.atan2(hunt.pos.y - ship.pos.y, hunt.pos.x - ship.pos.x), dist(ship.pos, hunt.pos));
      ship.targetHeading = steer.targetHeading;
      ship.targetSpeed = dist(ship.pos, hunt.pos) < 60 ? hunt.speedKt * 0.6 : hunt.speedKt * steer.speedScale;
      ship.aswHunting = true;
    } else if (ship.order.type === 'move') {
      ship.targetSpeed = Math.min(ship.targetSpeed, hunt.speedKt);
      ship.aswHunting = true;
    }
    if (ship.aswHunting && !was) {
      this.addCombatLog({
        category: 'naval',
        sourceSide: 'player',
        sourceName: ship.name,
        targetName: '水下接觸',
        actionType: 'recon_spotted',
        text: `🎧【反潛搜索航速】「${ship.name}」減速至 ${Math.round(hunt.speedKt)} 節，降低流噪維持聲納接觸${ship.order.type === 'idle' ? '，自動逼近接觸 / 最後已知位置' : ''}！`,
      });
    }
  }

  private findAswHunt(ship: Ship, holdRange = 3500, datumRange = 3000): { pos: Vector2D; speedKt: number } | undefined {
    const sonar = shipSonar(ship, this.era, false);
    if (!sonar) return undefined;
    const speedKt = Math.min(ship.maxSpeed, Math.max(6, sonar.huntSpeedKt - 2));
    const subs = this.enemyShips.filter((s) => !s.isSunk && this.isSubmarine(s));
    const held = subs.filter((s) => s.isSpotted && dist(ship.pos, s.pos) < holdRange).sort((a, b) => dist(ship.pos, a.pos) - dist(ship.pos, b.pos))[0];
    if (held) return { pos: held.pos, speedKt };
    const datum = subs
      .filter((s) => s.datumPos && (s.datumAge ?? 999) < 75 && dist(ship.pos, s.datumPos) < datumRange)
      .sort((a, b) => dist(ship.pos, a.datumPos!) - dist(ship.pos, b.datumPos!))[0];
    return datum?.datumPos ? { pos: datum.datumPos, speedKt } : undefined;
  }

  /**
   * One detection pass on a submarine (see asw.ts): hull sonars by era and class, degraded by the
   * hunter's own speed and blind directly overhead; surface-search radar on a snorkelling or
   * surfaced boat; aircraft by sighting, radar, MAD and dipping sonar.
   */
  private detectSubmarine(sub: Ship, ships: Ship[], planes: Aircraft[], revealSec: number): void {
    for (const hunter of ships) {
      const d = dist(hunter.pos, sub.pos);
      if (d > 2600) continue;
      const hunterIsSub = this.isSubmarine(hunter);
      const sonar = shipSonar(hunter, this.era, hunterIsSub);
      if (sonar && d <= sonarDetectionRange(sonar, hunter.speed, sub) * layerFactorForShipSonar(sonar, hunter, sub, hunterIsSub) && d >= sonarDeadZone(sonar, this.era)) {
        this.revealSubmarine(sub, revealSec, 'sonar', `${hunter.name} · ${sonar.label}`);
        return;
      }
      // Surface-search radar (SG / SPS-10 ...) on a snorkel mast or a boat recharging on the surface
      if (sub.isSnorkeling && !hunterIsSub && d <= gameRangeFromKm(this.era === 'era1' ? 5 : 8)) {
        this.revealSubmarine(sub, revealSec + 2, 'sonar', `${hunter.name} · 對海搜索雷達 (呼吸管)`);
        return;
      }
    }
    for (const plane of planes) {
      if (dist(plane.pos, sub.pos) <= aircraftDetectionRange(plane, sub, this.era) * layerFactorForAircraft(plane, sub)) {
        this.revealSubmarine(sub, revealSec + 0.5, 'sonar', plane.name);
        return;
      }
    }
  }

  private updateSubmarineFogOfWar(dt: number) {
    // 1. 衰減日誌節流冷卻與潛艦暴露倒數計時器
    for (const k in this.sonarLogCooldowns) {
      this.sonarLogCooldowns[k] -= dt;
      if (this.sonarLogCooldowns[k] <= 0) delete this.sonarLogCooldowns[k];
    }

    const enemySubs = this.enemyShips.filter((s) => !s.isSunk && this.isSubmarine(s));
    const friendlySubs = [...this.playerShips, ...this.alliedShips].filter((s) => !s.isSunk && this.isSubmarine(s));

    for (const eSub of enemySubs) {
      if (eSub.datumPos) {
        eSub.datumAge = (eSub.datumAge ?? 0) + dt;
        if (eSub.datumAge > 90) eSub.datumPos = undefined;
      }
      if ((eSub.spottedTimer || 0) > 0) {
        eSub.spottedTimer = Math.max(0, (eSub.spottedTimer || 0) - dt);
        if (eSub.spottedTimer <= 0) {
          eSub.isSpotted = false;
        }
      } else {
        eSub.isSpotted = false;
      }
    }

    for (const fSub of friendlySubs) {
      if ((fSub.enemySpottedTimer || 0) > 0) {
        fSub.enemySpottedTimer = Math.max(0, (fSub.enemySpottedTimer || 0) - dt);
        if (fSub.enemySpottedTimer <= 0) {
          fSub.isSpottedByEnemy = false;
        }
      } else {
        fSub.isSpottedByEnemy = false;
      }
    }

    // 2. 友軍反潛艦艇與反潛機隊主動偵測敵潛艦
    const friendlyAswShips = [...this.playerShips, ...this.alliedShips].filter((s) => !s.isSunk);
    const friendlyAswPlanes = this.aircraft.filter(
      (a) => (a.side === 'player' || a.side === 'allied') && a.state !== 'shot_down' && (this.getAircraftAswSonarRange(a) > 0 || a.role === 'scout' || a.role === 'aew')
    );

    for (const eSub of enemySubs) this.detectSubmarine(eSub, friendlyAswShips, friendlyAswPlanes, 4.0);

    // 3. 敵軍反潛艦艇與 Be-12 / Il-38 / Ka-27 反潛機隊主動偵測我方潛艦
    const enemyAswShips = this.enemyShips.filter((s) => !s.isSunk);
    const enemyAswPlanes = this.aircraft.filter(
      (a) => a.side === 'enemy' && a.state !== 'shot_down' && (this.getAircraftAswSonarRange(a) > 0 || a.role === 'scout' || a.role === 'aew')
    );

    for (const fSub of friendlySubs) this.detectSubmarine(fSub, enemyAswShips, enemyAswPlanes, 5.0);
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
        this.updateTorpedoProjectile(dt, proj);
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
        this.updateHedgehogProjectile(dt, proj);
      } else if (proj.type === 'rocket') {
        this.updateRocketProjectile(dt, proj);
      } else if (proj.type === 'bullet') {
        this.updateBulletProjectile(dt, proj);
      } else if (
        proj.type === 'missile_aam' ||
        proj.type === 'missile_sam' ||
        proj.type === 'missile_ashm' ||
        proj.type === 'missile_arm' ||
        proj.type === 'missile_cruise' ||
        proj.type === 'missile_ssm' ||
        proj.type === 'slbm_trident' ||
        proj.type === 'slbm_r39'
      ) {
        if (this.updateGuidedMissile(dt, proj)) continue;
      }
    }
  }

  /** AAM / SAM / anti-ship / cruise / ballistic missile guidance, fuzing and countermeasure decoys. */
  private updateGuidedMissile(dt: number, proj: Projectile): boolean {
    // ══════════════════════════════════════════════════════════
    // 導向飛彈與戰術彈道飛彈運動、主動尋標轉向與反飛彈防禦攔截 (Missile Guidance & Interception)
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
        const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
        const s = allShips.find(
          (sh) => sh.id === proj.targetEntityId && !sh.isSunk && this.isHostile(proj.side, sh.side)
        );
        if (s) targetPos = s.pos;
      } else if (proj.targetEntityType === 'installation') {
        const inst = this.findTargetInstallation(proj.targetEntityId);
        if (inst) targetPos = inst.pos;
      } else if (proj.targetEntityType === 'ground') {
        const g = this.groundUnits.find((u) => u.id === proj.targetEntityId && !u.isDestroyed);
        if (g) targetPos = g.pos;
      }
    }

    if (!targetPos && proj.targetPos) {
      targetPos = proj.targetPos;
    }

    this.updateSarhIllumination(proj, targetPos);

    if (proj.lostLock) {
      targetPos = null;
    }

    this.steerMissileTowardTarget(dt, proj, targetPos);

    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.distanceTraveled += proj.speed * dt;

    // 火箭推進發動機白煙與尾焰粒子 (Exocet / Harpoon 低煙低可視；蘇聯 P-700/P-270/P-15 濃烈尾跡)
    const isBallistic = proj.type === 'missile_ssm' || !!proj.isSLBM || proj.type === 'slbm_trident' || proj.type === 'slbm_r39';
    const isLowSmokeAshm =
      proj.type === 'missile_ashm' &&
      (proj.ashmVariant === 'exocet_mm40' ||
        proj.ashmVariant === 'exocet_mm38' ||
        proj.ashmVariant === 'harpoon_rgm84' ||
        proj.ashmVariant === 'harpoon_ugm84' ||
        proj.ashmVariant === 'harpoon_agm84');
    const smokeProb = isBallistic ? 0.95 : isLowSmokeAshm ? 0.35 : 0.75;
    if (Math.random() < smokeProb) {
      const tailDist = isBallistic ? 18 : 12;
      const tx = proj.pos.x - Math.cos(proj.heading) * tailDist;
      const ty = proj.pos.y - Math.sin(proj.heading) * tailDist - (proj.missileAltitude ? proj.missileAltitude * 18 : 0);
      const ashmSmokeColor =
        proj.ashmVariant === 'exocet_mm40' || proj.ashmVariant === 'exocet_mm38'
          ? 'rgba(224, 247, 250, 0.38)'
          : proj.ashmVariant === 'harpoon_rgm84' || proj.ashmVariant === 'harpoon_ugm84' || proj.ashmVariant === 'harpoon_agm84'
          ? 'rgba(236, 239, 241, 0.48)'
          : 'rgba(255, 112, 67, 0.75)';
      this.particles.push({
        id: `m-smoke-${Date.now()}-${Math.random()}`,
        x: tx + (Math.random() - 0.5) * 4,
        y: ty + (Math.random() - 0.5) * 4,
        vx: -Math.cos(proj.heading) * 20 + (Math.random() - 0.5) * 8,
        vy: -Math.sin(proj.heading) * 20 + (Math.random() - 0.5) * 8,
        life: isBallistic ? 0.65 : isLowSmokeAshm ? 0.30 : 0.45,
        maxLife: isBallistic ? 0.65 : isLowSmokeAshm ? 0.30 : 0.45,
        radius: isBallistic ? 5.5 : isLowSmokeAshm ? 2.4 : 3.5,
        color: proj.type === 'missile_ashm' ? ashmSmokeColor : isBallistic ? 'rgba(255, 171, 0, 0.85)' : 'rgba(245, 245, 245, 0.75)',
        type: 'smoke',
      });
    }

    // 誘餌引離判定：若飛彈被誘騙且抵達誘餌空域/海面，凌空自毀引爆
    if (proj.isDecoyed && targetPos && dist(proj.pos, targetPos) < 65) {
      proj.isDead = true;
      soundEngine.playExplosion(false);
      if (proj.isLeadMissile) {
        this.handleAshmLeaderDestroyed(proj);
      }
      this.particles.push({
        id: `decoyed-blast-${Date.now()}`,
        x: proj.pos.x,
        y: proj.pos.y,
        vx: 0,
        vy: 0,
        life: 0.6,
        maxLife: 0.6,
        radius: 40,
        color: '#80DEEA',
        type: 'shockwave',
        shape: 'ring',
      });
      return true;
    }

    // A. 反飛彈與反戰術/潛射彈道飛彈攔截 (Anti-Missile & ATBM Interception)
    if (proj.isInterceptionMissile || proj.targetEntityType === 'projectile') {
      const targetProj = this.projectiles.find(
        (p) => !p.isDead && p.id === proj.targetEntityId && dist(proj.pos, p.pos) < 36
      );
      if (targetProj) {
        let interceptChance = 0.85;
        const isSLBM = !!targetProj.isSLBM || targetProj.type === 'slbm_trident' || targetProj.type === 'slbm_r39';
        const isTBM = targetProj.type === 'missile_ssm' || isSLBM;

        if (isSLBM) {
          // 洲際潛射彈道飛彈終端超高速突防，唯頂級 ATBM (Patriot PAC-2 / 神盾 SM-2 / S-300) 有有限攔截機會
          const att = proj.attackerName || '';
          if (att.includes('愛國者') || att.includes('Patriot') || att.includes('神盾') || att.includes('SM-2') || att.includes('S-300') || att.includes('48N6')) {
            interceptChance = 0.34;
          } else {
            interceptChance = 0.10;
          }
        } else if (isTBM) {
          const att = proj.attackerName || '';
          if (att.includes('愛國者') || att.includes('Patriot') || att.includes('神盾') || att.includes('SM-2') || att.includes('S-300') || att.includes('48N6')) {
            interceptChance = 0.72;
          } else if (att.includes('Sea Dart') || att.includes('Shtil') || att.includes('施基利') || att.includes('SM-1')) {
            interceptChance = 0.42;
          } else if (att.includes('海麻雀') || att.includes('Sparrow') || att.includes('Sea Wolf') || att.includes('Crotale') || att.includes('Kinzhal') || att.includes('匕首')) {
            interceptChance = 0.22;
          } else {
            interceptChance = 0.15;
          }
        } else if (targetProj.type === 'missile_ashm') {
          const isEra5 = this.era === 'era5';
          if (targetProj.ashmVariant === 'exocet_mm40' || targetProj.ashmVariant === 'exocet_mm38') {
            // 超低空飛魚貼海飛行掩蔽於海面雜波，中長程防空飛彈難以穩定鎖定
            interceptChance = isEra5 ? 0.56 : 0.42;
          } else if (targetProj.ashmVariant === 'p270_moskit') {
            // 3 馬赫超音速貼海與終端蛇行
            interceptChance = isEra5 ? 0.60 : 0.45;
          } else if (targetProj.ashmVariant === 'p700_granit' || targetProj.ashmVariant === 'p500_bazalt') {
            interceptChance = targetProj.isLeadMissile ? 0.90 : isEra5 ? 0.74 : 0.58;
          } else if (targetProj.ashmVariant === 'kh22_burya') {
            interceptChance = isEra5 ? 0.64 : 0.48;
          } else if (targetProj.ashmVariant === 'p15_styx' || targetProj.ashmVariant === 'ksr5_kelt') {
            interceptChance = 0.82;
          } else {
            interceptChance = isEra5 ? 0.78 : 0.62;
          }
        } else if (targetProj.type === 'missile_cruise') {
          interceptChance = 0.80;
        }

        if (Math.random() > interceptChance) {
          // 攔截脫靶
          proj.isDead = true;
          this.particles.push({
            id: `miss-${Date.now()}`,
            x: proj.pos.x,
            y: proj.pos.y,
            vx: 0,
            vy: 0,
            life: 0.4,
            maxLife: 0.4,
            radius: 26,
            color: '#FFA000',
            type: 'shockwave',
            shape: 'ring',
          });
          if (isTBM) {
            this.addCombatLog({
              category: 'aa',
              sourceSide: proj.side,
              sourceName: proj.attackerName || '防空飛彈',
              targetName: '來襲戰術彈道飛彈',
              actionType: 'recon_spotted',
              text: `⚠️【TBM 攔截脫靶】${proj.attackerName || '防空飛彈'} 與超音速俯衝之彈道飛彈失之交臂，引信未能有效破片殺傷！`,
            });
          }
          return true;
        }

        soundEngine.playExplosion(false);
        targetProj.isDead = true;
        proj.isDead = true;
        if (targetProj.isLeadMissile) {
          this.handleAshmLeaderDestroyed(targetProj);
        }
        this.particles.push({
          id: `intercept-blast-${Date.now()}`,
          x: proj.pos.x,
          y: proj.pos.y,
          vx: 0,
          vy: 0,
          life: 0.7,
          maxLife: 0.7,
          radius: isTBM ? 56 : 42,
          color: isTBM ? '#FFD700' : '#00E5FF',
          type: 'shockwave',
          shape: 'ring',
        });
        this.particles.push({
          id: `intercept-flash-${Date.now()}`,
          x: proj.pos.x,
          y: proj.pos.y,
          vx: 0,
          vy: 0,
          life: 0.4,
          maxLife: 0.4,
          radius: isTBM ? 34 : 20,
          color: '#FFFFFF',
          type: 'flak_puff',
          shape: 'circle',
        });

        if (isTBM) {
          const isAtacms = targetProj.attackerName?.includes('ATACMS') || targetProj.side === 'player' || targetProj.side === 'allied';
          const tbmName = isAtacms ? 'MGM-140 ATACMS 戰術彈道飛彈' : '9K72 飛毛腿-B (Scud-B) 彈道飛彈';
          this.addBannerAlert(`🎯【TBM 戰術彈道飛彈末端攔截成功！】防空飛彈成功凌空打爆來襲 ${tbmName}！`, proj.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.5);
          this.addCombatLog({
            category: 'aa',
            sourceSide: proj.side,
            sourceName: proj.attackerName || '防空飛彈系統',
            targetName: tbmName,
            actionType: 'recon_spotted',
            isCrit: true,
            text: `🎯【TBM 反飛彈攔截成功】${proj.attackerName || '防空系統'} 雷達精確引導近炸破片凌空殉爆，成功摧毀超音速俯衝之 ${tbmName}！`,
          });
        } else if (targetProj.type === 'missile_cruise') {
          this.addBannerAlert('🎯【防禦攔截成功！】防空飛彈成功凌空打爆來襲巡弋飛彈！', proj.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
          this.addCombatLog({
            category: 'aa',
            sourceSide: proj.side,
            sourceName: proj.attackerName || '防空飛彈射控系統',
            targetName: '來襲巡弋飛彈',
            actionType: 'recon_spotted',
            text: `🎯【反巡弋飛彈防禦成功】防空飛彈雷達導引近炸引信凌空殉爆！成功粉碎來襲之低空巡弋飛彈！`,
          });
        } else {
          this.addBannerAlert('🎯【防禦攔截成功！】防空飛彈成功凌空打爆來襲反艦飛彈！', proj.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.0);
          this.addCombatLog({
            category: 'aa',
            sourceSide: proj.side,
            sourceName: proj.attackerName || '防空飛彈射控系統',
            targetName: '來襲反艦飛彈',
            actionType: 'recon_spotted',
            text: `🎯【反飛彈防禦攔截成功】防空飛彈雷達導引近炸引信凌空殉爆！成功粉碎來襲之掠海反艦飛彈！`,
          });
        }
      }
    }

    this.applyMissileProximityFuzeVsAircraft(proj);

    // C. 反艦飛彈與巡弋飛彈/戰術飛彈命中水面艦艇 (AShM / TASM / SSM vs Ship - 潛水艇深潛免疫)
    if (!proj.isDead && (proj.type === 'missile_ashm' || proj.type === 'missile_cruise' || proj.type === 'missile_ssm')) {
      const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
      const targetShips = allShips.filter((s) => !s.isSunk && this.isHostile(proj.side, s.side) && !this.isSubmarine(s));
      for (const ship of targetShips) {
        if (!ship.isSunk && distToShipHull(proj.pos, ship) < ship.width * 0.75 + 16) {
          this.detonateProjectile(proj, ship);
          proj.isDead = true;
          break;
        }
      }
    }

    // D. 巡弋飛彈、反輻射飛彈與戰術彈道飛彈命中雷達陣地與陸基要塞 (Cruise / ARM / SSM vs Radar / SAM / Installations)
    if (!proj.isDead && (proj.type === 'missile_arm' || proj.type === 'missile_cruise' || proj.type === 'missile_ssm')) {
      for (const isl of this.islands) {
        for (const inst of isl.installations) {
          if (!inst.isDestroyed && this.isHostile(proj.side, inst.side) && dist(proj.pos, inst.pos) < 46) {
            this.detonateProjectile(proj);
            proj.isDead = true;
            break;
          }
        }
        if (proj.isDead) break;
      }
    }

    // E. 戰術彈道飛彈 (MGM-140 ATACMS / 9K72 Scud-B) 命中敵方地面作戰部隊
    if (!proj.isDead && proj.type === 'missile_ssm') {
      for (const u of this.groundUnits) {
        if (!u.isDestroyed && !u.embarkedInShipId && this.isHostile(proj.side, u.side) && dist(proj.pos, u.pos) < 42) {
          this.detonateProjectile(proj);
          proj.isDead = true;
          break;
        }
      }
    }

    // F. 撞擊島嶼陸地 (僅反艦飛彈受陸地地形阻擋，巡弋飛彈與戰術彈道飛彈自由飛越/灌頂俯衝)
    if (!proj.isDead && proj.type === 'missile_ashm') {
      for (const isl of this.islands) {
        if (isPointInPolygon(proj.pos, isl.points)) {
          this.detonateProjectile(proj);
          proj.isDead = true;
          break;
        }
      }
    }

    // G. 到達目標座標直接灌頂引爆 (Terminal Ballistic Plunge on Target Position)
    if (!proj.isDead && (proj.type === 'missile_ssm' || proj.type === 'slbm_trident' || proj.type === 'slbm_r39') && targetPos && dist(proj.pos, targetPos) < 45) {
      this.detonateProjectile(proj);
      proj.isDead = true;
    }

    // H. 超出最大射程自毀
    if (proj.distanceTraveled >= proj.maxDistance) {
      proj.isDead = true;
      this.detonateProjectile(proj);
    }
    return false;
  }

  // B. 空空 / 防空飛彈近炸敵機 (AAM & SAM vs Aircraft)
  private applyMissileProximityFuzeVsAircraft(proj: Projectile): void {
    if (!proj.isDead && (proj.type === 'missile_aam' || proj.type === 'missile_sam')) {
      if (!proj.isDecoyed) {
        const targetPlanes = this.aircraft.filter((a) => this.isHostile(proj.side, a.side) && a.state !== 'shot_down');
        for (const plane of targetPlanes) {
          if (dist(proj.pos, plane.pos) < 34) {
            // 機動規避動作判定：若戰機正處於大G機動破轉，早期飛彈超載受限高機率脫靶
            if (plane.isEvading && Math.random() < 0.55) {
              soundEngine.playExplosion(false);
              proj.isDead = true;
              this.particles.push({
                id: `near-miss-${Date.now()}`,
                x: proj.pos.x,
                y: proj.pos.y,
                vx: 0,
                vy: 0,
                life: 0.5,
                maxLife: 0.5,
                radius: 32,
                color: '#FFAB00',
                type: 'shockwave',
                shape: 'ring',
              });
              this.addCombatLog({
                category: 'aa',
                sourceSide: 'player',
                sourceName: plane.name,
                targetName: proj.attackerName || '導向飛彈',
                actionType: 'recon_spotted',
                text: `💨【高G機動破轉避開！】「${plane.name}」大過載劇烈破轉，敵飛彈超載脫靶於舷側近距擦過爆炸！`,
              });
              break;
            }

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

            const isLethalHit = plane.health <= 0;
            this.addCombatLog({
              category: 'aa',
              sourceSide: proj.side,
              sourceName: proj.attackerName || '導向飛彈',
              targetName: plane.name,
              actionType: 'aa_down',
              damage: proj.damage,
              text: isLethalHit
                ? `🎯💥【SPLASH! 敵機凌空爆毀！】${proj.attackerName || '導向飛彈'} 近炸引信精準引爆戰鬥部！「${plane.name}」化作巨型火球當空解體擊墜！`
                : `💥【飛彈近炸破甲】${proj.attackerName || '導向飛彈'} 於「${plane.name}」近距凌空引爆！高能預製破片造成 ${proj.damage} 點重創！`,
            });

            if (isLethalHit) {
              this.killPlane(plane);
            }
            break;
          }
        }
      }
    }
  }

  private steerMissileTowardTarget(dt: number, proj: Projectile, targetPos: Vector2D | null): void {
    if (targetPos) {
      let desiredAngle = Math.atan2(targetPos.y - proj.pos.y, targetPos.x - proj.pos.x);
      const distToTarget = dist(proj.pos, targetPos);

      // 歷史反艦飛彈 (AShM) 動態彈道高度、終端躍升俯衝與終端蛇行機動
      if (proj.type === 'missile_ashm' && !proj.isDecoyed) {
        if (proj.ashmProfile === 'pop_up_dive') {
          // RGM-84 / AGM-84 魚叉：巡航掠海 (0.18) -> 距離 540m 時躍升爬高 (0.62) 隨後俯衝砸穿甲板
          if (distToTarget < 540 && distToTarget > 190) {
            proj.missileAltitude = Math.min(0.62, (proj.missileAltitude ?? 0.18) + 1.8 * dt);
          } else if (distToTarget <= 190) {
            proj.missileAltitude = Math.max(0.14, (proj.missileAltitude ?? 0.62) - 2.6 * dt);
          } else {
            proj.missileAltitude = 0.18;
          }
        } else if (proj.ashmProfile === 'ultra_sea_skim') {
          // MM40 / MM38 飛魚：全程極限緊貼浪尖 (0.07) 直插水線
          proj.missileAltitude = 0.07;
        } else if (proj.ashmProfile === 'datalink_leader') {
          // P-700 / P-500 領彈：高空偵察與資料鏈中繼 (0.88)，終端 600m 俯衝
          proj.missileAltitude = distToTarget < 600 ? Math.max(0.20, (distToTarget / 600) * 0.88) : 0.88;
        } else if (proj.ashmProfile === 'datalink_follower') {
          // P-700 / P-500 跟隨彈：核對領彈是否仍健在，若領彈遭摧毀則立即降級資料鏈精度
          if (proj.leadMissileId && !proj.datalinkLost) {
            const leaderProj = this.projectiles.find((p) => p.id === proj.leadMissileId);
            if (leaderProj && (leaderProj.isDead || leaderProj.isDecoyed)) {
              proj.datalinkLost = true;
              proj.turnRate = Math.max(1.8, (proj.turnRate || 3.6) * 0.56);
            }
          }
          proj.missileAltitude = 0.17;
        } else if (proj.ashmProfile === 'supersonic_sprint') {
          // P-270 白蛉：超音速極低空突防 (0.11) + 距離 1150m 內進行高G終端 S 型蛇行規避
          proj.missileAltitude = 0.11;
          if (distToTarget < 1150 && distToTarget > 120) {
            proj.terminalWeavePhase = (proj.terminalWeavePhase ?? 0) + dt * 7.5;
            desiredAngle += Math.sin(proj.terminalWeavePhase) * 0.34;
          }
        } else if (proj.ashmProfile === 'high_plunge') {
          // Kh-22 / KSR-5：高空巡航大俯衝
          proj.missileAltitude = distToTarget < 700 ? Math.max(0.18, (distToTarget / 700) * 0.90) : 0.90;
        }
      }

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
  }

  // ════ 歷史史實校正 3: AIM-7 麻雀半主動雷達 (SARH) 機首持續波照準錐 (±50°) 與地雜波盲區 ════
  private updateSarhIllumination(proj: Projectile, targetPos: Vector2D | null): void {
    if (proj.type === 'missile_aam' && proj.guidanceType === 'semi_active_radar' && !proj.lostLock) {
      if (proj.sarhIlluminatorId) {
        const illPlane = this.aircraft.find((a) => a.id === proj.sarhIlluminatorId && a.state !== 'shot_down');
        if (!illPlane) {
          proj.lostLock = true;
        } else if (targetPos) {
          const angToTarget = Math.atan2(targetPos.y - illPlane.pos.y, targetPos.x - illPlane.pos.x);
          let relAngle = angToTarget - illPlane.heading;
          while (relAngle > Math.PI) relAngle -= Math.PI * 2;
          while (relAngle < -Math.PI) relAngle += Math.PI * 2;
          if (Math.abs(relAngle) > (Math.PI * 50) / 180) {
            proj.lostLock = true;
            if (illPlane.side === 'player') {
              this.addCombatLog({
                category: 'air',
                sourceSide: illPlane.side,
                sourceName: illPlane.name,
                targetName: 'AIM-7 麻雀',
                actionType: 'recon_spotted',
                text: `📡【雷達照準錐脫鎖】「${illPlane.name}」機首照射夾角偏轉逾50°！AIM-7 失去連續波照射，飛彈失控飄移！`,
              });
            }
          }
        }
      }
      // 地雜波盲區 (Ground Clutter Blindness): 若目標處於超低空，早期無都卜勒脈衝雷達淹沒於地表雜波
      if (!proj.lostLock && proj.targetEntityId) {
        const targetPlane = this.aircraft.find((a) => a.id === proj.targetEntityId);
        if (targetPlane && (targetPlane.altitude || 0.5) < 0.28 && Math.random() < 0.04) {
          proj.lostLock = true;
          this.addCombatLog({
            category: 'air',
            sourceSide: proj.side,
            sourceName: proj.attackerName || 'AIM-7',
            targetName: targetPlane.name,
            actionType: 'recon_spotted',
            text: `📡【地雜波盲區脫靶】敵機「${targetPlane.name}」利用超低空掠地，雷達回波湮沒於熱帶叢林地雜波中！AIM-7 脫鎖！`,
          });
        }
      }
    }
  }

  private updateBulletProjectile(dt: number, proj: Projectile): void {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.distanceTraveled += proj.speed * dt;

    const targetPlanes = this.aircraft.filter((a) => this.isHostile(proj.side, a.side) && a.state !== 'shot_down');
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
        if (!u.isDestroyed && !u.embarkedInShipId && this.isHostile(proj.side, u.side) && dist(proj.pos, u.pos) < 26) {
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
  }

  private updateRocketProjectile(dt: number, proj: Projectile): void {
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

    const allShips = [...this.playerShips, ...this.alliedShips, ...this.enemyShips];
    const targetShips = allShips.filter((s) => !s.isSunk && this.isHostile(proj.side, s.side));
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
          if (!inst.isDestroyed && this.isHostile(proj.side, inst.side) && dist(proj.pos, inst.pos) < 28) {
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
  }

  private updateHedgehogProjectile(dt: number, proj: Projectile): void {
    const step = proj.speed * dt;
    proj.distanceTraveled += step;
    proj.flightProgress = Math.min(1, proj.distanceTraveled / Math.max(1, proj.maxDistance));
    proj.pos.x = proj.originPos.x + (proj.targetPos.x - proj.originPos.x) * proj.flightProgress;
    proj.pos.y = proj.originPos.y + (proj.targetPos.y - proj.originPos.y) * proj.flightProgress;

    // Parabolic arc altitude
    proj.arcAltitude = Math.sin(proj.flightProgress * Math.PI) * 45;

    // Depth-fused rounds (Squid, Limbo, Bofors, RBU) sink to their set depth and burst there
    if (proj.isDepthFused) {
      if (proj.flightProgress >= 1) {
        soundEngine.playWaterSplash();
        proj.type = 'depth_charge';
        proj.fuseTimer = 0.9;
        proj.vel = { x: 0, y: 0 };
        proj.arcAltitude = 0;
      }
      return;
    }

    // Check contact hit during terminal phase (progress > 0.85) or when landing
    if (proj.flightProgress >= 0.85) {
      const directHitSub = [...this.playerShips, ...this.alliedShips, ...this.enemyShips].find(
        (e) => this.isSubmarine(e) && !e.isSunk && this.isHostile(proj.side, e.side) && dist(proj.pos, e.pos) < 32
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
  }

  private updateTorpedoProjectile(dt: number, proj: Projectile): void {
    // Mk 24 / Mk 34 / Mk 46 / APR-2 聲自導反潛魚雷主動導引鎖定 (Acoustic Homing Tracking: turnRate 3.5)
    // Only homing torpedoes home (Mk 24 FIDO from 1943, Mk 44/46, 53-65K wake homers); WWII and
    // Korean-war ship and submarine torpedoes ran straight
    const isHoming = Boolean(proj.isAcousticHoming);
    const allShips = [...this.playerShips, ...this.alliedShips, ...this.enemyShips];
    const targetShips = allShips.filter((s) => !s.isSunk && this.isHostile(proj.side, s.side));
    if (isHoming) {
      const targets = targetShips;
      let bestTarget: Ship | null = null;
      let bestDist = 1800;

      // Priority 1: spotted submarine (or close terminal acoustic capture within 480m)
      for (const target of targets) {
        if (target.isSunk || !this.isSubmarine(target)) continue;
        const d = dist(proj.pos, target.pos);
        const isTargetKnown =
          (target.side === 'enemy' ? Boolean(target.isSpotted) : Boolean(target.isSpottedByEnemy)) || d < 480;
        if (isTargetKnown && d < 1800 && d < bestDist) {
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
  }

  private detonateProjectile(proj: Projectile, directHitShip?: Ship) {
    if (this.applyNuclearDetonation(proj)) return;

    if (this.applyNapalmImpact(proj)) return;

    const isLarge = proj.damage > 250;
    soundEngine.playExplosion(isLarge);

    const isBomb = proj.type === 'bomb';
    const isTorpedo = proj.type === 'torpedo';
    const onIsland = this.islands.some((isl) => isPointInPolygon(proj.pos, isl.points));

    this.applyBombImpact(proj, isBomb, isTorpedo, onIsland);
    const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
    const candidateShips = directHitShip
      ? (this.isHostile(proj.side, directHitShip.side) ? [directHitShip] : [])
      : allShips.filter((s) => !s.isSunk && this.isHostile(proj.side, s.side));
    let anyHit = false;

    for (const ship of candidateShips) {
      if (ship.isSunk) continue;

      // 潛水艇處於深潛狀態：完全免疫艦砲砲彈、機槍掃射、反艦飛彈、巡弋飛彈、火箭與常規航彈！
      // 依歷史與現代反潛作戰常理：潛水艇僅能被深水炸彈 (Depth Charges)、刺蝟砲 (Hedgehog)、ASROC 反潛火箭與魚雷 (Torpedoes) 命中傷害！
      const aswWeapon = proj.type === 'depth_charge' || proj.type === 'hedgehog' || proj.type === 'torpedo' || Boolean(proj.isASROC);
      if (this.isSubmarine(ship) && aswWeapon && ship.side === 'enemy' && dist(proj.pos, ship.pos) < 500) {
        this.startSubmarineEvasion(ship, proj.pos);
      }
      // A submerged boat is immune to shells, rockets, bombs and missiles; a WWII boat caught on
      // the surface (transiting or still diving) is not
      if (this.isSubmarine(ship) && !aswWeapon && !isSurfacedBoat(ship, this.era)) {
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
        } else if (proj.type === 'missile_ashm') {
          dieType = 'd20';
          rollVal = Math.floor(Math.random() * 20) + 1;
          rollTarget = 9;
          isCrit = rollVal >= 18;
          rollDesc = `D20反艦飛彈終端貫穿擲骰: ${rollVal} vs DC 9 [${isCrit ? '彈藥庫/輪機艙殉爆' : '裝甲帶貫穿'}]`;
        }

        const rawArmor = Math.min(0.85, Math.max(0, ship.armor || 0));
        const isArmorPiercingBomb = isBomb && (proj.bombType === 'bomb_1000' || proj.bombType === 'bomb_1600');
        const isHeavyKineticAshm = proj.ashmVariant === 'p700_granit' || proj.ashmVariant === 'p500_bazalt' || proj.ashmVariant === 'kh22_burya';
        const effectiveArmor = isTorpedo
          ? rawArmor * 0.35
          : isArmorPiercingBomb || isHeavyKineticAshm
          ? rawArmor * 0.45
          : proj.type === 'missile_ashm'
          ? rawArmor * 0.58
          : rawArmor * 0.75;

        const critMultiplier = isCrit ? 1.45 : 1.0;
        const dmgMultiplier = Math.max(0.1, 1 - effectiveArmor) * critMultiplier;
        const actualDmg = Math.round(proj.damage * dmgMultiplier);

        // 確保雙重血條數值正確初始化
        if (ship.weaponControlHealth === undefined) ship.weaponControlHealth = ship.health;
        if (ship.hullCrewHealth === undefined) ship.hullCrewHealth = ship.health;
        if (ship.maxWeaponControlHealth === undefined) ship.maxWeaponControlHealth = ship.maxHealth;
        if (ship.maxHullCrewHealth === undefined) ship.maxHullCrewHealth = ship.maxHealth;

        // ══════════════════════════════════════════════════════════
        // 雙血條受損分流核心邏輯 (Dual-HP Damage Routing):
        // 1. 炸彈 / 俯衝火箭 (由上往下攻擊)：大多毀損武器指管系統 (WCS)
        // 2. 反艦飛彈 (AShM) 依歷史彈道分工：躍升俯衝魚叉兼具上層建築與船體破壞；極低掠海飛魚與白蛉貫穿水線主艦體 (HCS)；超音速花崗岩雙重毀傷
        // 3. 艦砲砲擊 / 雷擊戰：對應穿甲與水線撕裂
        // ══════════════════════════════════════════════════════════
        let wcsDmg = 0;
        let hcsDmg = 0;

        if (isBomb || proj.type === 'rocket') {
          wcsDmg = Math.round(actualDmg * (isBomb ? 0.95 : 0.85));
          hcsDmg = Math.round(actualDmg * (isBomb ? 0.35 : 0.25));
        } else if (proj.type === 'missile_ashm') {
          if (proj.ashmProfile === 'ultra_sea_skim' || proj.ashmProfile === 'supersonic_sprint') {
            wcsDmg = Math.round(actualDmg * 0.35);
            hcsDmg = Math.round(actualDmg * 0.85);
          } else if (proj.ashmProfile === 'pop_up_dive') {
            wcsDmg = Math.round(actualDmg * 0.68);
            hcsDmg = Math.round(actualDmg * 0.58);
          } else if (isHeavyKineticAshm) {
            wcsDmg = Math.round(actualDmg * 0.72);
            hcsDmg = Math.round(actualDmg * 0.78);
          } else {
            wcsDmg = Math.round(actualDmg * 0.55);
            hcsDmg = Math.round(actualDmg * 0.65);
          }
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
        } else if (proj.type === 'missile_ashm') {
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
            text: isCrit
              ? `💥🚀【反艦飛彈致命貫穿爆擊 D20: ${rollVal}】${attacker} 貫穿「${targetShipName}」水線/上層艦橋引爆燃料起火！造成 ${actualDmg} 點重創！`
              : `💥🚀【反艦飛彈直接命中「${targetShipName}」】${attacker} 突破近迫防禦命中目標艦體，造成 ${actualDmg} 點裝甲破壞！`,
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

    this.applyBlastToGroundUnits(proj);

    // ════ M39 DPICM 集束子母彈微爆轟散射 (Steel Rain Submunition Bursts) ════
    if (proj.isClusterSubmunition && proj.clusterBombletsCount) {
      for (let b = 0; b < (proj.clusterBombletsCount || 8); b++) {
        const subX = proj.pos.x + (Math.random() - 0.5) * 80;
        const subY = proj.pos.y + (Math.random() - 0.5) * 80;
        this.particles.push({
          id: `dpicm-flash-${Date.now()}-${b}`,
          x: subX,
          y: subY,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          life: 0.45,
          maxLife: 0.45,
          radius: 12 + Math.random() * 8,
          color: '#FFAB00',
          type: 'spark',
        });

        // 子母彈群對落點周邊敵軍部隊造成二次密集破片傷害
        for (const g of this.groundUnits) {
          if (!g.isDestroyed && this.isHostile(proj.side, g.side) && Math.hypot(g.pos.x - subX, g.pos.y - subY) <= 38) {
            g.health = Math.max(0, g.health - 120);
            g.strength = Math.max(0, Math.round((g.health / g.maxHealth) * 100));
            g.organization = Math.max(0, (g.organization ?? 100) - 15);
            g.suppression = Math.min(100, (g.suppression || 0) + 30);
            if (g.health <= 0) g.isDestroyed = true;
          }
        }
      }
    }

    this.applyBlastToInstallations(proj);

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

  // ══════════════════════════════════════════════════════════
  // 地面固定設施受擊運算 (Fixed Installations Air Defense & Dispersion)
  // 1. 史實判定: 高空或俯衝轟炸對掩體/掩蔽固定工事有天然散佈誤差，不一定每次空襲都成功直擊
  // 2. 混凝土/沙袋裝甲工事加成: 大幅吸收衝擊波，避免一擊必殺
  // 3. 雙方皆可受損 (支援友軍設施防衛與敵軍要塞攻略)
  // ══════════════════════════════════════════════════════════
  private applyBlastToInstallations(proj: Projectile): void {
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (inst.isDestroyed) continue;
        if (!this.isHostile(proj.side, inst.side)) continue; // 僅攻擊敵對陣地設施

        if (dist(proj.pos, inst.pos) <= proj.blastRadius + 26) {
          const attacker = proj.attackerName || (proj.side === 'player' ? '特遣航空隊' : '敵空襲機隊');
          const isBomb = proj.type === 'bomb';

          // 碉堡剋星 (ATACMS M57 Bunker Buster) 強行穿甲加固要塞
          if (proj.isBunkerBuster) {
            const actualDmg = Math.round(proj.damage * 1.85);
            inst.health -= actualDmg;
            soundEngine.playExplosion(true);
            this.addCombatLog({
              category: 'naval',
              sourceSide: proj.side,
              sourceName: attacker,
              targetName: inst.name,
              actionType: 'gun_hit',
              damage: actualDmg,
              text: `🏰💥【M57 碉堡剋星直擊貫穿！】「${attacker}」超重型穿甲彈頭直貫「${inst.name}」地下核心工事！造成 ${actualDmg} 點致命穿甲破壞！`,
            });
            if (inst.health <= 0) {
              inst.isDestroyed = true;
              this.addBannerAlert(`💥🏰【敵方要塞碉堡貫穿炸裂！】M57 碉堡剋星徹底摧毀「${inst.name}」！`, proj.side === 'enemy' ? 'enemy' : 'player', 'alert', 5.5);
            }
            continue;
          }

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
  }

  // ══════════════════════════════════════════════════════════
  // 地面陸軍部隊受損運算 (Ground Unit Damage & Dual Parameters)
  // 1. 建制度 (STR / Health): 戰壕、散兵坑與裝甲掩蔽大幅吸收破片傷害 (直擊傷害折減)
  // 2. 組織度 (ORG / Morale): 猛烈航彈爆震與破片引發嚴重震盪恐慌、通信中斷與士氣受挫
  // ══════════════════════════════════════════════════════════
  private applyBlastToGroundUnits(proj: Projectile): void {
    for (const unit of this.groundUnits) {
      if (unit.isDestroyed || unit.embarkedInShipId) continue;
      if (this.isHostile(proj.side, unit.side) && dist(proj.pos, unit.pos) <= proj.blastRadius + 24) {
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
        const isBunkerBusterMod = proj.isBunkerBuster ? 1.7 : 1.0;
        const physicalDmg = Math.round(proj.damage * (1 - unitArmor * (proj.isBunkerBuster ? 0.1 : 0.4)) * coverReduction * orgDmgScale * urbanCoverMod * isBunkerBusterMod);
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
  }

  private applyBombImpact(proj: Projectile, isBomb: boolean, isTorpedo: boolean, onIsland: boolean): void {
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
  }

  // ══════════════════════════════════════════════════════════
  // 凝固汽油燃燒彈引爆 (Napalm Firestorm Detonation)
  // 燃燒罐觸地撕裂，化為數十米高溫焦土火海與滾滾濃煙，灼燒工事與步兵連隊
  // ══════════════════════════════════════════════════════════
  /** Napalm canister: burning ground fire; true when the detonation is fully handled. */
  private applyNapalmImpact(proj: Projectile): boolean {
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
          if (!inst.isDestroyed && this.isHostile(proj.side, inst.side) && dist(proj.pos, inst.pos) <= 65) {
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
        if (!u.isDestroyed && this.isHostile(proj.side, u.side) && dist(proj.pos, u.pos) <= 65) {
          u.health -= 900;
          u.organization = Math.max(0, u.organization - 75);
          if (u.health <= 0) {
            u.isDestroyed = true;
            this.casualties.enemyGroundLost++;
          }
        }
      }
      return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 時代三 Mk 4 / Mk 6 戰術原子彈終極引爆 (Tactical Nuclear Detonation)
  // 消耗 4500 CP · 全島範圍覆蓋 (半徑 520m) · 瞬間汽化守備要塞部隊與防空陣地
  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // 戰略與戰術核武器終極引爆系統 (Strategic & Tactical Nuclear Detonations)
  // B-52 百萬噸熱核武器 (750m) / B61 戰術核武器 (420m) / OPFOR 戰術核反撲 (450m) / B-29 Mk 4 (220m)
  // ══════════════════════════════════════════════════════════
  /** Nuclear / megaton weapons; true when the detonation is fully handled. */
  private applyNuclearDetonation(proj: Projectile): boolean {
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
          if (!inst.isDestroyed && this.isHostile(proj.side, inst.side) && dist(proj.pos, inst.pos) <= blastRad) {
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

      // 2. 汽化引爆點周圍所有敵對地面作戰部隊，並對 EMP 影響圈 (1.4x) 施加電子癱瘓壓制
      let vaporizedGround = 0;
      for (const u of this.groundUnits) {
        if (!u.isDestroyed && this.isHostile(proj.side, u.side)) {
          const dGround = dist(proj.pos, u.pos);
          if (dGround <= blastRad) {
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
          } else if (dGround <= blastRad * 1.4) {
            // 核電磁脈衝 (EMP) 衝擊波造成電子射控與指揮壓制
            u.suppression = 100;
            u.suppressionTimer = 10.0;
            u.isSuppressed = true;
            u.isPinned = true;
            u.disorganized = true;
            u.organization = Math.max(0, u.organization - 45);
          }
        }
      }

      // 3. 毀滅周圍敵對艦艇並對 EMP 範圍內敵艦實施雷達/SAM 電子癱瘓
      const allShips = [...this.playerShips, ...this.enemyShips, ...this.alliedShips];
      const candidateShips = allShips.filter((s) => !s.isSunk && this.isHostile(proj.side, s.side));
      for (const s of candidateShips) {
        const dShip = dist(proj.pos, s.pos);
        if (dShip <= blastRad * 0.85) {
          s.health = Math.max(0, s.health - (isMegaton ? 24000 : 9000));
          if (s.health <= 0) this.sinkShip(s);
        }
        if (!s.isSunk && dShip <= blastRad * 1.4) {
          s.samCooldown = Math.max(s.samCooldown || 0, 12.0);
          s.ciwsCooldown = Math.max(s.ciwsCooldown || 0, 8.0);
        }
      }

      const isTrident = proj.type === 'slbm_trident';
      const isR39 = proj.type === 'slbm_r39';
      const isNuclearSSM = proj.type === 'missile_ssm' && proj.isNuclear;
      const alertTitle = isTrident
        ? '☢️【UGM-133 三叉戟-D5 潛射戰略熱核毀滅】8枚 W88 分導核彈頭落地！戰區電磁脈衝癱瘓敵防空！'
        : isR39
        ? '☢️⚠️【蘇聯颱風級 R-39 潛射重型核反擊引爆！】10枚分導核彈頭落地！EMP 癱瘓大範圍雷達通訊！'
        : isNuclearSSM
        ? (isOpfor
          ? '☢️⚠️【敵軍 9K72 戰術核彈道飛彈引爆！】高爆熱核衝擊波橫掃防區！'
          : '☢️【MGM-140B 戰術核彈道飛彈引爆！】W70 熱核彈頭精準抹除目標要塞並觸發 EMP 癱瘓！')
        : isMegaton
        ? '☢️【B-52 百萬噸級戰略熱核引爆】B28/B41 氫彈震撼引爆！全戰區半徑 750m 焦土火球衝天並觸發 EMP！'
        : isB61
        ? '☢️【B61 戰術核打擊引爆】半徑 420m 戰術熱核火球吞噬天際！防空陣地與部隊瞬間汽化！'
        : isOpfor
        ? '☢️⚠️【敵軍戰術核航彈引爆！】敵方核彈於戰區引爆！我方陣容承受衝擊波毀滅打擊！'
        : `☢️【代號：天罰——戰術核打擊引爆】半徑 220m 戰術熱核火球吞噬天際！防空陣地與部隊瞬間汽化！`;

      this.addBannerAlert(
        `${alertTitle}${hqDamaged ? '（地下坑道指揮所深居地下受損生還）' : ''}`,
        isOpfor || isR39 ? 'enemy' : 'player',
        'sunk',
        9.0
      );
      this.addCombatLog({
        category: 'air',
        sourceSide: isOpfor || isR39 ? 'enemy' : 'player',
        sourceName: proj.attackerName || '戰略/戰術核打擊力量',
        targetName: islName,
        actionType: 'bomb_crit',
        isCrit: true,
        damage: nukeDamage,
        text: `☢️【核打擊終極震撼引爆】${alertTitle} 瞬間汽化 ${vaporizedInst} 處工事與 ${vaporizedGround} 個守備連隊${hqDamaged ? '；地下坑道指揮所深居花崗岩坑道承受重創生還！' : '！'}`,
      });
      return true;
    }
    return false;
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
        : this.isSubmarine(ship)
        ? 1850
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
      const isAllied = ship.side === 'allied';
      this.addBannerAlert(
        isAllied
          ? `🚨【盟軍艦艇沉沒】支援友軍「${shipName}」遭受致命打擊沉沒！`
          : `🚨【旗艦警報】我方主力艦艇「${shipName}」遭受致命打擊沉沒！`,
        'player',
        'sunk',
        7.5
      );
      this.addCombatLog({
        category: 'sunk',
        sourceSide: 'enemy',
        sourceName: '敵方艦隊',
        targetName: shipName,
        actionType: 'ship_sunk',
        text: isAllied
          ? `🚨【警報！盟軍支援艦沉沒】盟軍艦艇「${shipName}」(${tonnage.toLocaleString()}噸) 遭受致命打擊沉沒！`
          : `🚨【警報！友軍艦艇沉沒】我方主力艦艇「${shipName}」(${tonnage.toLocaleString()}噸) 遭受致命打擊沉沒！`,
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

  // ══════════════════════════════════════════════════════════
  // 判定戰機是否具備 CAS 密接空中支援作戰能力
  // ══════════════════════════════════════════════════════════
  public isCasAircraft(plane: Aircraft): boolean {
    if (plane.missionType === 'cas') return true;
    if (plane.role === 'attacker' || plane.role === 'dive_bomber') return true;
    const casPayloads = [
      'bomb_500', 'bomb_1000', 'bomb_1600', 'bomb_2000', 'bombs_dual_500', 'bombs_quad_500',
      'bombs_carpet_250', 'mixed_bombs_rockets', 'hvar_rockets', 'tiny_tim_rocket',
      'napalm_canister', 'blu27_napalm', 'cbu_cluster_bombs', 'bombs_snakeye_retarded',
      'mer_iron_bombs', 'ffar_rockets_pod', 'gbu10_laser_paveway', 'agm12_bullpup', 'agm62_walleye'
    ];
    if (plane.payloadType && casPayloads.includes(plane.payloadType)) return true;
    // 具備低空對地掃射能力的攻擊機/支援機
    if (GROUND_STRAFING_MODELS.has(plane.model)) {
      return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════
  // 時代一 ~ 時代四 CAS 近接空中支援目標智能索敵 (Smart Ground Priority Target Acquisition)
  // 優先順序層級:
  // 1. 敵方裝甲主力、兩棲戰車、防空自走砲 (Armor, Tanks & Mobile AA)
  // 2. 爭奪中據點核心防衛部隊 (Stronghold CP Defenders within 380m)
  // 3. 碉堡要塞、重型火砲、防空陣地與雷達 (Bunkers, Coastal Guns, Artillery, SAM/Radar)
  // 4. 周邊步兵連隊與巡邏隊 (Infantry Squads & Patrols)
  // ══════════════════════════════════════════════════════════
  public acquireCasGroundTarget(plane: Aircraft): GroundUnit | Installation | null {
    const searchRadius = 2600;

    // 1. 活體敵方地面部隊 (未在登陸艇內，且與本機敵對)
    const validGround = this.groundUnits.filter(
      (u) => this.isHostile(plane.side, u.side) && !u.isDestroyed && !u.embarkedInShipId && dist(plane.pos, u.pos) <= searchRadius
    );

    // 2. 活體敵方防禦工事 (排除平民定居點，且與本機敵對)
    const validInst: Installation[] = [];
    for (const isl of this.islands) {
      for (const inst of isl.installations) {
        if (this.isHostile(plane.side, inst.side) && !inst.isDestroyed && !inst.isCivilian && dist(plane.pos, inst.pos) <= searchRadius) {
          validInst.push(inst);
        }
      }
    }

    // 優先層級 1: 裝甲戰車、兩棲突擊戰車、履帶防空砲車與自走防空飛彈車
    const armorTypes: GroundUnitType[] = [
      'opfor_type95_tank', 'opfor_type97_tank', 'opfor_t34_85', 'opfor_is3_heavy',
      'opfor_pt76_amphib', 'opfor_t54_tank', 'opfor_zsu23_shilka', 'opfor_s60_flak', 'opfor_ks19_heavy',
      'opfor_zsu57_2', 'opfor_sa6_kub', 'opfor_sa9_strela1', 'opfor_sa8_osa', 'opfor_sa11_buk', 'opfor_sa15_tor', 'opfor_btr_zd',
      'opfor_tunguska', 'opfor_strela10', 'opfor_t72b', 'opfor_t80b', 'opfor_bmp2',
      'usmc_armor_m3', 'usmc_armor_m4', 'usmc_patton_m46', 'us_army_armor_korea',
      'usmc_duster_m42', 'usmc_armor_m48', 'usmc_ontos_m50', 'us_m551_sheridan', 'us_m26_pershing', 'us_m1a1_abrams', 'us_army_m113_mech', 'us_army_chaparral_sam'
    ];
    const armorUnits = validGround.filter((u) => armorTypes.includes(u.type));
    if (armorUnits.length > 0) {
      armorUnits.sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos));
      return armorUnits[0];
    }

    // 優先層級 2: 爭奪中據點核心防禦部隊 (距離 CP <= 380m)
    for (const isl of this.islands) {
      if (isl.strongholds) {
        for (const sh of isl.strongholds) {
          if (!sh.isCaptured && dist(plane.pos, sh.cpPos) <= searchRadius) {
            const cpDefenders = validGround.filter((u) => dist(u.pos, sh.cpPos) <= 380);
            if (cpDefenders.length > 0) {
              cpDefenders.sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos));
              return cpDefenders[0];
            }
          }
        }
      }
    }

    // 優先層級 3: 碉堡要塞、重型火砲、防空陣地與雷達
    const priorityInstTypes: InstallationType[] = [
      'bunker_nest', 'coastal_gun', 'command_post', 'towed_artillery',
      'flak_battery', 'sa2_sam_site', 'sa3_sam_site', 's300_sam_site', 'fan_song_radar', 'sam_hawk', 'watchtower'
    ];
    const keyInst = validInst.filter((i) => priorityInstTypes.includes(i.type));
    if (keyInst.length > 0) {
      keyInst.sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos));
      return keyInst[0];
    }
    if (validInst.length > 0) {
      validInst.sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos));
      return validInst[0];
    }

    // 優先層級 4: 附近敵軍步兵班、迫擊砲排與機動巡邏隊
    if (validGround.length > 0) {
      validGround.sort((a, b) => dist(plane.pos, a.pos) - dist(plane.pos, b.pos));
      return validGround[0];
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

    const enemyCarriers = this.enemyShips.filter((s) => s.type === 'carrier' || s.type === 'cvhg_kiev');
    const enemyCarrierSunk = enemyCarriers.length === 0 ? true : enemyCarriers.every((s) => s.isSunk);
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
