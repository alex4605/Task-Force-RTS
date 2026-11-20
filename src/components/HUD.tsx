import React, { useRef, useEffect, useState, useMemo } from 'react';
import { CameraViewportState } from './GameCanvas';
import {
  Ship,
  Aircraft,
  AircraftModel,
  AircraftRole,
  AircraftPayloadType,
  PAYLOAD_CATALOG,
  Island,
  SectorIntel,
  GameScore,
  Era,
  Vector2D,
  CombatLogEntry,
  GroundUnit,
  RequisitionItem,
  RequisitionCategory,
  CasualtiesReport,
  Sonobuoy,
} from '../types/game';
import { getRequisitionCatalog } from '../game/requisition';
import { BattleAlertBanner, RadarCoverage } from '../game/engine';
import {
  DEFAULT_AFB_FORMATION_COUNTS,
  DEFAULT_CARRIER_FORMATION_COUNTS,
  getAfbModelsForEra,
  getCarrierModelsForEra,
} from '../game/airWingCatalog';
import { getModelPayloads, resolvePayload } from '../game/aircraftLoadouts';
import { getCatalogRole } from '../game/airWingCatalog';
import { MiniRadar } from './hud/MiniRadar';
import { ActiveArmamentTrayState, ArmamentTrayModal } from './hud/ArmamentTrayModal';
import { SelectedUnitsPanel } from './hud/SelectedUnitsPanel';
import { UnitPreviewCanvas } from './hud/UnitPreviewCanvas';
import {
  ShieldAlert,
  Plane,
  Volume2,
  VolumeX,
  Map as MapIcon,
  HelpCircle,
  Wrench,
  Compass,
  Anchor,
  Sliders,
  Zap,
  Play,
  Pause,
  ScrollText,
  Radio,
  Flag,
  Shield,
  Layers,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Hammer,
} from 'lucide-react';

interface HUDProps {
  flagship?: Ship;
  playerShips: Ship[];
  enemyShips: Ship[];
  aircraft: Aircraft[];
  groundUnits?: GroundUnit[];
  islands: Island[];
  worldSize: number;
  era: Era;
  onSetEra: (era: Era) => void;
  selectedUnits: (Ship | Aircraft | GroundUnit)[];
  onLaunchModel: (model: AircraftModel, count?: number, payload?: AircraftPayloadType, carrierId?: string) => void;
  onOrderSelected: (type: 'move' | 'attack' | 'patrol' | 'rtb' | 'idle') => void;
  onStopUnits: () => void;
  onSetSpeed: (speed: number) => void;
  onSteer: (dir: 'port' | 'starboard') => void;
  onTriggerFlak: () => void;
  intel: SectorIntel | null;
  score: GameScore;
  onOpenBriefing: () => void;
  onOpenMap: () => void;
  radarLayerOn?: boolean;
  onToggleRadarLayer?: () => void;
  onOpenDockyard: () => void;
  onOpenAirPrep: () => void;
  onOpenArmament: () => void;
  onOpenBattleLog?: () => void;
  combatLogs?: CombatLogEntry[];
  gameSpeed: number;
  isPaused: boolean;
  onSetGameSpeed: (speed: number) => void;
  onTogglePause: () => void;
  activePayloads: Record<AircraftRole, AircraftPayloadType>;
  onSelectPayload?: (role: AircraftRole, payload: AircraftPayloadType) => void;
  onMiniMapClick: (worldPos: Vector2D) => void;
  cameraViewport?: CameraViewportState | null;
  radarCoverage?: RadarCoverage[];
  isMuted: boolean;
  onToggleMute: () => void;
  // AFB and Convoy Reinforcements
  airbasePlanes?: Record<string, number>;
  airbaseReplenishTimer?: number;
  convoyReinforceTimer?: number;
  nextConvoyEscort?: 'ss' | 'dd' | 'cl' | 'ca';
  /** Friendly airfields with their own aircraft stock, HQ island first. */
  airfields?: { id: string; name: string; isHQ: boolean; planes: Record<string, number> }[];
  onTransferPlanes?: (model: AircraftModel, count: number, fromId: string, toId: string) => void;
  onLaunchAirbaseSortie?: (model: AircraftModel, count: number, payload?: AircraftPayloadType, airfieldId?: string) => void;
  onToggleTransportEmbark?: (transportId: string) => void;
  onTriggerLSMRocket?: (lsmrId: string) => void;
  onBuildAirfield?: (engineerId: string) => void;
  onUnloadAircraft?: () => void;
  // Resource Points & Requisition System
  resourcePoints?: number;
  commandPointsPerSec?: number;
  totalCpEarned?: number;
  totalCpSpent?: number;
  casualties?: CasualtiesReport;
  activePlacementItem?: RequisitionItem | null;
  onStartPlacement?: (item: RequisitionItem) => void;
  onCancelPlacement?: () => void;
  continuousStamp?: boolean;
  onToggleContinuousStamp?: () => void;
  sandboxStamp?: boolean;
  onToggleSandboxStamp?: () => void;
  activeBannerAlerts?: BattleAlertBanner[];
  selectedAirfacility?:
    | {
        type: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | 'cve' | 'cv63' | 'lph';
        id?: string;
        timestamp: number;
      }
    | 'carrier'
    | 'airbase'
    | 'cve'
    | 'cv63'
    | 'lph'
    | 'engineer_construction'
    | 'battalion_cp'
    | null;
  isDesignatingCap?: boolean;
  onStartCapDesignation?: () => void;
  onCancelCap?: () => void;
  sonobuoys?: Sonobuoy[];
  isDesignatingSonobuoy?: boolean;
  onStartSonobuoyDesignation?: () => void;
  onCancelSonobuoy?: () => void;
  onSelectUnitIds?: (ids: string[]) => void;
  onPurchaseRequisition?: (item: RequisitionItem, targetIslandId?: string, customPos?: Vector2D) => boolean;
}

export type BottomDeckMode = 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | 'requisition';

export const ENGINEER_BUILD_IDS = [
  'req-fac-forward-airfield',
  'req-fac-airfield',
  'req-fac-coastal-gun',
  'req-fac-m1-240mm',
  'req-fac-pontoon-pier',
  'req-fac-heavy-aa',
  'req-fac-sam-hawk',
  'req-fac-battalion-cp',
  'req-fac-fob',
  'req-fac-radar',
  'req-fac-dockyard',
  'req-fac-major-port',
  'req-fac-major-naval-port',
  'req-fac-supply-depot',
  'req-fac-field-hospital',
  'req-fac-ammo-depot',
];

// Reusable horizontal scroll container supporting mouse wheel horizontal translation and drag-to-swipe
const DraggableScrollContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;

    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';

    const onMouseMove = (moveEv: MouseEvent) => {
      moveEv.preventDefault();
      const x = moveEv.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 1.35;
    };

    const onMouseUp = () => {
      if (el) {
        el.style.cursor = 'grab';
        el.style.removeProperty('user-select');
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className={`flex items-stretch gap-2 overflow-x-auto pb-1 max-w-full cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-slate-700/80 ${className}`}
    >
      {children}
    </div>
  );
};

export const HUD: React.FC<HUDProps> = ({
  flagship,
  playerShips,
  enemyShips,
  aircraft,
  groundUnits = [],
  islands,
  worldSize,
  era,
  onSetEra,
  selectedUnits,
  onLaunchModel,
  onOrderSelected,
  onStopUnits,
  onTriggerFlak,
  intel: _intel,
  score,
  onOpenBriefing,
  onOpenMap,
  radarLayerOn,
  onToggleRadarLayer,
  onOpenDockyard,
  onOpenAirPrep,
  onOpenArmament,
  onOpenBattleLog,
  combatLogs = [],
  gameSpeed,
  isPaused,
  onSetGameSpeed,
  onTogglePause,
  activePayloads,
  onSelectPayload,
  onMiniMapClick,
  cameraViewport = null,
  radarCoverage,
  isMuted,
  onToggleMute,
  airbasePlanes = {},
  airbaseReplenishTimer = 45,
  convoyReinforceTimer: _convoyReinforceTimer = 100,
  nextConvoyEscort: _nextConvoyEscort = 'dd',
  airfields = [],
  onTransferPlanes,
  onLaunchAirbaseSortie,
  onToggleTransportEmbark,
  onTriggerLSMRocket,
  onBuildAirfield,
  onUnloadAircraft,
  resourcePoints = 1200,
  commandPointsPerSec = 15,
  totalCpEarned: _totalCpEarned = 1200,
  totalCpSpent: _totalCpSpent = 0,
  casualties: _casualties,
  onPurchaseRequisition,
  activePlacementItem,
  onStartPlacement,
  onCancelPlacement,
  continuousStamp = true,
  onToggleContinuousStamp,
  sandboxStamp = false,
  onToggleSandboxStamp,
  activeBannerAlerts = [],
  selectedAirfacility,
  isDesignatingCap = false,
  onStartCapDesignation,
  onCancelCap,
  sonobuoys = [],
  isDesignatingSonobuoy = false,
  onStartSonobuoyDesignation,
  onCancelSonobuoy,
  onSelectUnitIds,
}) => {
  // Every friendly deck with an air group: the flagship carrier, escort carriers and amphibious ships
  const carriers = useMemo(() => playerShips.filter((s) => !s.isSunk && s.carrierPlanes), [playerShips]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | undefined>(undefined);
  const activeCarrier = carriers.find((c) => c.id === selectedCarrierId) ?? flagship;
  const planes = activeCarrier?.carrierPlanes?.ready || {};
  const [selectedAirfieldId, setSelectedAirfieldId] = useState<string | undefined>(undefined);
  const activeAirfield = airfields.find((a) => a.id === selectedAirfieldId) ?? airfields[0];
  const airbaseStock = activeAirfield?.planes ?? airbasePlanes;
  const [carrierFerryTo, setCarrierFerryTo] = useState('');
  const [afbFerryTo, setAfbFerryTo] = useState('');
  const ferryBases = useMemo(
    () => [
      ...airfields.map((a) => ({ id: a.id, name: `${a.isHQ ? '🏛️ ' : '🛬 '}${a.name}`, isCarrier: false })),
      ...carriers.map((c) => ({ id: c.id, name: `⚓ ${c.name}`, isCarrier: true })),
    ],
    [airfields, carriers]
  );
  const currentCatalog = useMemo(() => getRequisitionCatalog(era), [era]);

  // The era's carrier air wing plus any detachment embarked on the selected deck (helicopters, Harriers...)
  const flightModels = useMemo(() => {
    const base = getCarrierModelsForEra(era);
    const stock = activeCarrier?.carrierPlanes?.maxPerType ?? {};
    const extra = Object.keys(stock)
      .filter((m) => !base.some((b) => b.model === m))
      .map((m) => ({ model: m as AircraftModel, label: m.toUpperCase(), role: getCatalogRole(m as AircraftModel, 'carrier', era), desc: '艦載分遣隊' }));
    const all = [...base, ...extra];
    return activeCarrier && activeCarrier !== flagship ? all.filter((fm) => (stock[fm.model] ?? 0) > 0) : all;
  }, [era, activeCarrier, flagship]);

  // Per-model formation count state: e.g. 1, 2, 4, or max available
  const [formationCounts, setFormationCounts] = React.useState<Partial<Record<AircraftModel, number>>>(
    () => ({ ...DEFAULT_CARRIER_FORMATION_COUNTS })
  );

  // Per-model chosen payload; unset models fly the role's active payload if the airframe carried it
  const [modelPayloads, setModelPayloads] = React.useState<Partial<Record<AircraftModel, AircraftPayloadType>>>(
    () => ({})
  );

  const [rightPanelTab, setRightPanelTab] = React.useState<'flights' | 'cps'>('flights');
  const [isGuideCollapsed, setIsGuideCollapsed] = React.useState<boolean>(false);

  // Bottom Deck main tab: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | 'requisition'
  const [bottomDeckTab, setBottomDeckTab] = useState<BottomDeckMode>('carrier');
  const [isBottomDeckExpanded, setIsBottomDeckExpanded] = useState<boolean>(true);
  const [requisitionTab, setRequisitionTab] = useState<RequisitionCategory>('ground');
  const [selectedBuildIslandId, setSelectedBuildIslandId] = useState<string>('');

  // 取得當前活耀的營指揮所 (若有)
  const activeBattalionCp = React.useMemo(() => {
    if (selectedAirfacility && typeof selectedAirfacility === 'object' && selectedAirfacility.id) {
      for (const isl of islands) {
        const found = isl.installations.find((inst) => inst.id === selectedAirfacility.id);
        if (found) return found;
      }
    }
    for (const isl of islands) {
      const found = isl.installations.find(
        (inst) => (inst.type === 'battalion_cp' || inst.type === 'command_post') && !inst.isDestroyed && inst.side === 'player'
      );
      if (found) return found;
    }
    return null;
  }, [islands, selectedAirfacility]);

  const hasPlayerCarrier = playerShips.some(
    (s) => !s.isSunk && (s.type === 'carrier' || s.type === 'cve' || s.type === 'cv63' || s.type === 'cvn' || s.type === 'lph' || s.type === 'lha_tarawa')
  ) || !!flagship;

  // 指揮出擊與支援選單常時可供最高指揮官調遣檢視
  const isAirFacilityActive = true;

  // 取得當前選中的工兵單位
  const selectedEngineerUnit = React.useMemo(() => {
    return groundUnits.find((u) => selectedUnits.some((su) => su.id === u.id) && u.type === 'usmc_engineer');
  }, [groundUnits, selectedUnits]);

  // 點擊工兵/機場/航母/營指揮所時自地圖下方彈出對應專屬選單
  useEffect(() => {
    if (selectedAirfacility) {
      const targetTab = typeof selectedAirfacility === 'object' ? selectedAirfacility.type : selectedAirfacility;
      setBottomDeckTab(targetTab as BottomDeckMode);
      setIsBottomDeckExpanded(true);
    }
  }, [selectedAirfacility]);

  // 若在畫面上點選了工兵部隊或航空母艦，自動切換至對應選單並展開出擊列。
  // Keyed on the selected ids, not the array: the parent hands over a fresh array every frame,
  // which used to snap the deck back to the carrier tab whenever a carrier stayed selected.
  const selectedUnitsKey = selectedUnits.map((u) => u.id).join(',');
  useEffect(() => {
    const hasEngineer = selectedUnits.some(
      (u) => ('type' in u) && u.type === 'usmc_engineer'
    );
    const hasCarrier = selectedUnits.some(
      (u) => ('type' in u) && (u.type === 'carrier' || u.type === 'cve' || u.type === 'cv63' || u.type === 'cvn' || u.type === 'lph' || u.type === 'lha_tarawa')
    );
    if (hasEngineer) {
      setBottomDeckTab('engineer_construction');
      setIsBottomDeckExpanded(true);
    } else if (hasCarrier && (!selectedAirfacility || (typeof selectedAirfacility === 'object' && selectedAirfacility.type === 'carrier'))) {
      setBottomDeckTab('carrier');
      setIsBottomDeckExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitsKey, selectedAirfacility]);

  // C / G / Esc 快捷鍵: CAP 空巡與被動聲納浮標投擲模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'c' || e.key === 'C') {
        if (!isDesignatingCap) {
          onStartCapDesignation?.();
        } else {
          onCancelCap?.();
        }
      } else if (e.key === 'g' || e.key === 'G') {
        if (!isDesignatingSonobuoy) {
          onStartSonobuoyDesignation?.();
        } else {
          onCancelSonobuoy?.();
        }
      } else if (e.key === 'Escape') {
        setActiveArmamentTray(null);
        if (isDesignatingSonobuoy) onCancelSonobuoy?.();
        if (isDesignatingCap) onCancelCap?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isDesignatingCap,
    onStartCapDesignation,
    onCancelCap,
    isDesignatingSonobuoy,
    onStartSonobuoyDesignation,
    onCancelSonobuoy,
  ]);

  // Land-Based Airbase (AFB) formation counts & payload selections
  const [afbFormationCounts, setAfbFormationCounts] = useState<Partial<Record<string, number>>>(
    () => ({ ...DEFAULT_AFB_FORMATION_COUNTS })
  );
  const [afbPayloads, setAfbPayloads] = useState<Partial<Record<AircraftModel, AircraftPayloadType>>>({});

  // Bottom Deck Filters & Tactical Armament Selector Tray State
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'fighter' | 'dive_bomber' | 'torpedo_bomber' | 'attacker' | 'special'>('all');
  const [afbFilter, setAfbFilter] = useState<'all' | 'level_bomber' | 'fighter' | 'attacker' | 'navy'>('all');
  const [engineerTab, setEngineerTab] = useState<'all' | 'aviation' | 'air_defense' | 'naval' | 'fortification'>('all');
  const [activeArmamentTray, setActiveArmamentTray] = useState<ActiveArmamentTrayState | null>(null);

  // Flatten all island strongholds with island context
  const allStrongholds = React.useMemo(() => {
    return islands.flatMap((i) =>
      (i.strongholds || []).map((sh) => ({
        ...sh,
        islandName: i.name,
      }))
    );
  }, [islands]);
  const capturedStrongholdsCount = allStrongholds.filter((sh) => sh.isCaptured).length;
  const remainingEnemyCarriers = enemyShips.filter((s) => !s.isSunk && (s.type === 'carrier' || s.type === 'cvhg_kiev')).length;

  // Group player airborne aircraft into flight squadrons (一個Flight包含兩架飛機)
  const playerFlights = React.useMemo(() => {
    const map = new Map<
      string,
      {
        squadronId: string;
        flightName: string;
        model: AircraftModel;
        role: AircraftRole;
        planes: Aircraft[];
        hasPayload: boolean;
        payloadName: string;
        ammoRemaining: number;
        totalGunAmmo: number;
        maxTotalGunAmmo: number;
        state: string;
        health: number;
        maxHealth: number;
      }
    >();

    for (const p of aircraft) {
      if (p.side !== 'player' || p.state === 'shot_down') continue;
      const key = p.squadronId || p.flightName || p.id;
      if (!map.has(key)) {
        map.set(key, {
          squadronId: key,
          flightName: p.flightName || `${p.name} Flight`,
          model: p.model,
          role: p.role,
          planes: [],
          hasPayload: p.hasPayload,
          payloadName: p.payloadName || 'Clean Guns',
          ammoRemaining: p.ammoRemaining ?? (p.hasPayload ? 1 : 0),
          totalGunAmmo: 0,
          maxTotalGunAmmo: 0,
          state: p.state,
          health: 0,
          maxHealth: 0,
        });
      }
      const group = map.get(key)!;
      group.planes.push(p);
      group.health += p.health;
      group.maxHealth += p.maxHealth;
      group.totalGunAmmo += p.gunAmmo ?? 1440;
      group.maxTotalGunAmmo += p.maxGunAmmo ?? 1440;
      if (p.hasPayload) group.hasPayload = true;
      if ((p.ammoRemaining ?? 0) > group.ammoRemaining) group.ammoRemaining = p.ammoRemaining!;
      group.state = p.state;
    }
    return Array.from(map.values());
  }, [aircraft]);

  const afbModels = useMemo(() => getAfbModelsForEra(era), [era]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 pb-2 z-20 select-none overflow-hidden">
      {/* Top Bar (3 Zones) */}
      <header className="shrink-0 z-30 pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg px-4 py-2 flex items-center justify-between gap-3 sm:gap-4 shadow-2xl">
        {/* Zone 1: Wordmark & Era Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#80DEEA]" />
            <span className="font-mono font-bold tracking-wider text-sm text-[#E0F7FA] whitespace-nowrap">
              特遣艦隊 RTS
            </span>
          </div>

          <div className="h-4 w-px bg-[#1E3A5F]" />

          {/* Era Selector Switch: Era 1 / Era 2 / Era 3 */}
          <div className="flex items-center bg-[#0B1E34] border border-[#1E3A5F] rounded p-0.5 text-xs font-mono">
            <button
              onClick={() => onSetEra('era1')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era1'
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="時代一：二戰太平洋開戰 (珊瑚海／中途島／瓜達康納爾)"
            >
              時代一 (1942)
            </button>
            <button
              onClick={() => onSetEra('era2')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era2'
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="時代二：快速航母特遣艦隊 (馬里亞納／雷伊泰灣／沖繩決戰)"
            >
              時代二 (1944-45)
            </button>
            <button
              onClick={() => onSetEra('era3')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era3'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-sm border border-cyan-400/60'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="時代三：冷戰與噴射時代 (第七艦隊／米格走廊／興南撤退)"
            >
              時代三 (1950-53)
            </button>
            <button
              onClick={() => onSetEra('era4')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era4'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm border border-emerald-400/60 ring-1 ring-emerald-400'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="時代四：冷戰超音速與越戰風暴 (東京灣／小鷹號超級航母／空空反輻射飛彈／直升機垂直包圍)"
            >
              時代四 (1965-73)
            </button>
            <button
              onClick={() => onSetEra('era5')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era5'
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white shadow-sm border border-amber-300 ring-1 ring-amber-400'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="時代五：冷戰終局與大洋決戰 (尼米茲核航母／神盾巡洋艦／CIWS近迫防禦／魚叉與花崗岩超音速反艦／反飛彈攔截)"
            >
              時代五 (1973-91)
            </button>
          </div>
        </div>

        {/* Zone 2: Tactical Time Pacing & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tactical Time Speed Controller */}
          <div className="flex items-center bg-[#0B1E34] border border-[#1E3A5F] rounded p-0.5 text-xs font-mono">
            <button
              onClick={onTogglePause}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-bold ${
                isPaused
                  ? 'bg-[#D32F2F] text-white ring-1 ring-rose-300/70 shadow-[0_0_10px_rgba(244,63,94,0.45)]'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="暫停 (Backspace)"
            >
              {isPaused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3 fill-white" />}
              <span>{isPaused ? '已暫停' : '暫停 (Backspace)'}</span>
            </button>
            <button
              onClick={() => onSetGameSpeed(0.5)}
              className={`px-2 py-1 rounded transition-colors ${
                !isPaused && gameSpeed === 0.5
                  ? 'bg-[#1976D2] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="0.5x 慢速推演"
            >
              0.5x
            </button>
            <button
              onClick={() => onSetGameSpeed(1.0)}
              className={`px-2 py-1 rounded transition-colors ${
                !isPaused && gameSpeed === 1.0
                  ? 'bg-[#1976D2] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="1.0x 實時速度"
            >
              1.0x
            </button>
            <button
              onClick={() => onSetGameSpeed(2.0)}
              className={`px-2 py-1 rounded transition-colors ${
                !isPaused && gameSpeed === 2.0
                  ? 'bg-[#1976D2] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="2.0x 快速前進"
            >
              2.0x
            </button>
            <button
              onClick={() => onSetGameSpeed(3.0)}
              className={`px-2 py-1 rounded transition-colors ${
                !isPaused && gameSpeed === 3.0
                  ? 'bg-[#1976D2] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="3倍速戰術推進 (快捷鍵 ] )"
            >
              3.0x
            </button>
          </div>

          {/* Live Objective Progress Readout (Interactive Camera Focus) */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-[#0B1E34] border border-[#1E3A5F] rounded text-[11px] font-mono tabular-nums whitespace-nowrap"
            title="點擊目標可直接跳轉鏡頭至最近未解放據點或敵艦"
          >
            <button
              type="button"
              onClick={() => {
                setRightPanelTab('cps');
                const nextStronghold = allStrongholds.find((sh) => !sh.isCaptured) || allStrongholds[0];
                if (nextStronghold) onMiniMapClick(nextStronghold.cpPos);
              }}
              className={`hover:underline cursor-pointer ${
                capturedStrongholdsCount === allStrongholds.length && allStrongholds.length > 0
                  ? 'text-emerald-400 font-bold'
                  : 'text-[#FF80AB] font-bold'
              }`}
            >
              🏴 {capturedStrongholdsCount}/{allStrongholds.length}
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => {
                const targetShip =
                  enemyShips.find((s) => !s.isSunk && (s.type === 'carrier' || s.type === 'cvhg_kiev')) ||
                  enemyShips.find((s) => !s.isSunk);
                if (targetShip) onMiniMapClick(targetShip.pos);
              }}
              className={`hover:underline cursor-pointer ${
                remainingEnemyCarriers === 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
              }`}
            >
              🚢 敵航母 {remainingEnemyCarriers}
            </button>
            {sonobuoys.length > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => onMiniMapClick(sonobuoys[0].pos)}
                  className="text-cyan-300 font-bold hover:underline cursor-pointer"
                >
                  📡 {sonobuoys.length}
                </button>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-[#1E3A5F]" />

          {/* Armament Reconfiguration Button */}
          <button
            onClick={onOpenArmament}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#1A3353] border border-[#FFD54F]/80 rounded text-xs font-mono text-[#FFD54F] font-bold transition-all shadow-sm active:scale-95"
            title="重置艦載機掛載武裝 (HVAR火箭、穿甲航彈、凝固汽油彈、聲導魚雷)"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>戰機掛載 (ARM)</span>
          </button>

          <button
            onClick={onOpenAirPrep}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#80DEEA]/50 rounded text-xs font-mono text-[#80DEEA] font-semibold transition-colors"
            title="調整戰鬥機、俯衝轟炸機與魚雷機數量比例"
          >
            <Sliders className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>機隊編制</span>
          </button>

          <button
            onClick={onToggleRadarLayer}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded text-xs font-mono transition-colors ${
              radarLayerOn ? 'bg-cyan-900/60 border-cyan-400 text-cyan-100' : 'bg-[#0B1E34] hover:bg-[#153252] border-[#1E3A5F] text-[#E0F7FA]'
            }`}
            title="顯示我方雷達與已知敵方雷達的覆蓋範圍：實線填色為低空 (~300m) 覆蓋含地形遮蔽，虛線圈為高空偵測距離"
          >
            <Radio className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>雷達覆蓋 (R)</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#E0F7FA] transition-colors"
            title="開啟全戰區大比例海圖與情報疊層"
          >
            <MapIcon className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>戰區全圖 (M)</span>
          </button>

          <button
            onClick={onOpenBriefing}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#E0F7FA] transition-colors"
            title="檢視司令部作戰訓令與戰術指引"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>作戰情報</span>
          </button>

          {/* 戰地設施戳記模式快速開關 (Facility Stamping Toggle Button) */}
          <button
            onClick={() => {
              if (activePlacementItem) {
                onCancelPlacement?.();
              } else {
                const defaultFac =
                  currentCatalog.find((i) => i.id === 'req-fac-pontoon-pier') ||
                  currentCatalog.find((i) => i.category === 'installations');
                if (defaultFac) onStartPlacement?.(defaultFac);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded text-xs font-mono font-bold transition-all shadow-sm active:scale-95 ${
              activePlacementItem
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.65)]'
                : 'bg-[#0B1E34] hover:bg-[#153252] border-cyan-500/80 text-cyan-300'
            }`}
            title="開啟/關閉設施自由建造戳記盤 (可在任意位置建造碼頭、船塢與要塞)"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>{activePlacementItem ? '正在戳記中' : '工事建築 (F3)'}</span>
          </button>

          <button
            onClick={onOpenDockyard}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#FFD54F] transition-colors"
            title="珍珠港海軍造船廠：艦隊大修、科技研發與時代跨越"
          >
            <Wrench className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>艦隊修護改裝</span>
          </button>

          {/* Tactical Battle Log Button with count badge */}
          {onOpenBattleLog && (
            <button
              onClick={onOpenBattleLog}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#80DEEA]/70 rounded text-xs font-mono text-[#80DEEA] font-bold transition-all shadow-sm active:scale-95"
              title="檢視全域交戰報告、擊沉紀錄與傷亡統計"
            >
              <ScrollText className="w-3.5 h-3.5 text-[#80DEEA]" />
              <span>作戰日誌 (LOG)</span>
              {combatLogs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#1976D2] text-white rounded-full text-[10px] font-bold">
                  {combatLogs.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="p-1.5 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-[#80DEEA] transition-colors"
            title={isMuted ? '解除靜音' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Zone 3: Score & In-Flight Tally */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-mono text-xs">
          <div className="flex items-center gap-1 text-[#80DEEA]">
            <Plane className="w-3.5 h-3.5" />
            <span className="tabular-nums font-bold">
              {aircraft.filter((a) => a.side === 'player' && a.state !== 'shot_down').length}
            </span>
            <span className="text-[#90CAF9]/70 text-[10px]">空中在航</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#040C16] border border-amber-500/70 rounded text-xs font-mono font-bold text-amber-300 shadow-sm" title="指揮點數 (CP)">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{Math.floor(resourcePoints)} CP</span>
            <span className="text-[10px] text-emerald-400 font-normal">
              (+{commandPointsPerSec.toFixed(1)}/s)
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#FFD54F]">
            <span>★</span>
            <span className="tabular-nums font-bold">{score.stars}</span>
            <span className="text-[#90CAF9]/70 text-[10px]">功勳星徽</span>
          </div>

          <div className="flex items-center gap-1 text-[#E0F7FA]">
            <span className="text-[#90CAF9]/70 text-[10px]">戰果總分</span>
            <span className="tabular-nums font-bold">{score.totalScore}</span>
          </div>
        </div>
      </header>

      {/* 戰地設施自由戳記與營建控制盤 (Interactive Facility Stamping Palette) */}
      {activePlacementItem && (
        <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-4xl mx-auto z-50 my-1 bg-gradient-to-r from-[#041528]/95 via-[#0A2540]/95 to-[#041528]/95 border-2 border-cyan-400 rounded-xl p-3 shadow-2xl backdrop-blur-md font-mono text-xs">
          <div className="flex items-center justify-between w-full border-b border-[#1E3A5F]/80 pb-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-sm text-[#E0F7FA]">
                🏗️【戰地設施自由戳記盤】點擊海圖任意位置即可立即戳記落成
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <label
                className={`flex items-center gap-1.5 cursor-pointer text-[11px] px-2.5 py-1 rounded border font-bold transition-all shadow-sm ${
                  sandboxStamp
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-[#071322] hover:bg-[#0c1f36] text-slate-300 border-[#1E3A5F]'
                }`}
                title="開啟後戳記建造設施完全不扣除 CP 資源點數，可無限制自由測試與佈防"
              >
                <input
                  type="checkbox"
                  checked={sandboxStamp}
                  onChange={() => onToggleSandboxStamp?.()}
                  className="rounded text-emerald-400 focus:ring-0 cursor-pointer"
                />
                <span>✨ 免CP沙盒自由建造</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-300 bg-amber-950/60 px-2 py-1 rounded border border-amber-600/40">
                <input
                  type="checkbox"
                  checked={continuousStamp}
                  onChange={() => onToggleContinuousStamp?.()}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>連續戳記模式</span>
              </label>
              <div className="flex items-center gap-1 font-bold text-amber-300 text-xs px-2 py-0.5 bg-[#071322] border border-amber-500/60 rounded">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{Math.floor(resourcePoints)} CP</span>
              </div>
              <button
                type="button"
                onClick={() => onCancelPlacement?.()}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-200 rounded font-bold transition-all shadow active:scale-95 text-xs"
              >
                ✖ 結束戳記 (ESC)
              </button>
            </div>
          </div>

          {/* Quick Facility Selection Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pt-1 pb-0.5 max-w-full">
            {currentCatalog.filter((i) => i.category === 'installations').map((fac) => {
              const isSelected = activePlacementItem?.id === fac.id;
              const canAfford = sandboxStamp || resourcePoints >= fac.cost;
              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => onStartPlacement?.(fac)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.7)] scale-105 font-bold'
                      : canAfford
                      ? 'bg-[#071526] hover:bg-[#102A45] border-[#1E3A5F] text-slate-200 hover:border-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                  title={`${fac.name} (${fac.cost} CP)\n${fac.desc}`}
                >
                  <UnitPreviewCanvas
                    kind="installation"
                    unitKey={fac.typeTag || fac.id}
                    width={26}
                    height={16}
                    compact
                  />
                  <span className="font-bold">{fac.name.split(' ')[0]}</span>
                  <span className={`tabular-nums text-[10px] px-1 rounded font-bold ${isSelected ? 'bg-black/40 text-amber-300' : 'text-amber-400'}`}>
                    {fac.cost} CP
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[10.5px] text-slate-300 text-center pt-0.5 flex items-center justify-center gap-2">
            <span className="text-cyan-300 font-bold">
              👉 {`目前選定:【${activePlacementItem.name}】`}
            </span>
            <span className="text-slate-400">
              在海圖任意沿岸或海面點擊【滑鼠左鍵】完成戳記
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300">
              按【ESC】或【滑鼠右鍵】取消退出
            </span>
          </div>
        </div>
      )}

      {/* 戰鬥機 CAP 空中戰鬥巡邏指定導引條 */}
      {isDesignatingCap && (
        <div className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border-2 border-cyan-400 rounded-lg p-2.5 shadow-2xl mx-auto w-full max-w-2xl text-xs font-mono space-y-1.5 z-40 my-1 ring-2 ring-cyan-500/40">
          <div className="flex items-center justify-between border-b border-cyan-800 pb-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-300" />
              <span className="font-bold text-white tracking-wide text-[12px]">
                🛡️【CAP 戰鬥空巡指定模式】
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-600/50">
                半徑 250m 空巡警戒防護圈
              </span>
            </div>
            <button
              type="button"
              onClick={onCancelCap}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-600"
            >
              取消退出 (ESC)
            </button>
          </div>
          <div className="text-[11px] text-cyan-100 flex items-center justify-between">
            <span>
              👉 請在海圖任意海域點擊【滑鼠左鍵】建立 CAP 空巡核心區！
            </span>
            <span className="text-amber-300 font-bold">
              右鍵或 ESC 取消
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          頂部高對比即時擊沉戰報橫條 (Top High-Contrast Battle Ticker)
          ══════════════════════════════════════════════════════════ */}
      {activeBannerAlerts && activeBannerAlerts.length > 0 && (
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-full max-w-3xl mx-auto z-40 my-1">
          {activeBannerAlerts.slice(0, 1).map((banner) => (
            <div
              key={banner.id}
              onClick={onOpenBattleLog}
              className={`w-full px-4 py-2 rounded-lg shadow-2xl border-2 flex items-center justify-between gap-3 font-mono cursor-pointer transition-transform hover:scale-[1.01] ${
                banner.type === 'sunk'
                  ? 'bg-gradient-to-r from-red-950/95 via-rose-900/95 to-red-950/95 border-rose-500 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.4)]'
                  : banner.type === 'winchester'
                  ? 'bg-gradient-to-r from-amber-950/95 via-yellow-900/95 to-amber-950/95 border-amber-400 text-amber-100 shadow-amber-950/80'
                  : banner.type === 'down'
                  ? 'bg-gradient-to-r from-emerald-950/95 via-teal-900/95 to-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-950/80'
                  : 'bg-gradient-to-r from-blue-950/95 via-cyan-900/95 to-blue-950/95 border-cyan-400 text-cyan-100 shadow-cyan-950/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {banner.type === 'sunk' && <Anchor className="w-5 h-5 text-rose-300" />}
                {banner.type === 'down' && <Plane className="w-5 h-5 text-emerald-300" />}
                {banner.type === 'winchester' && <AlertTriangle className="w-5 h-5 text-amber-300" />}
                {banner.type === 'capture' && <Flag className="w-5 h-5 text-cyan-300" />}
                <span className="font-bold text-xs tracking-wide">{banner.text}</span>
              </div>
              <span className="text-[10px] text-slate-300 hover:text-white uppercase font-bold shrink-0">
                查看戰報 ➔
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Middle Floating Panels */}
      <div className="flex-1 min-h-0 pointer-events-none flex justify-between items-start my-1 overflow-hidden">
        {/* Left: 單位選擇列表 / Controls Guide */}
        <SelectedUnitsPanel
          era={era}
          selectedUnits={selectedUnits}
          isGuideCollapsed={isGuideCollapsed}
          onSetGuideCollapsed={setIsGuideCollapsed}
          onOrderSelected={onOrderSelected}
          onStopUnits={onStopUnits}
          onOpenEngineerDeck={() => {
            setBottomDeckTab('engineer_construction');
            setIsBottomDeckExpanded(true);
          }}
          onBuildAirfield={onBuildAirfield}
          onToggleTransportEmbark={onToggleTransportEmbark}
          onTriggerLSMRocket={onTriggerLSMRocket}
          onUnloadAircraft={onUnloadAircraft}
          isDesignatingCap={isDesignatingCap}
          onStartCapDesignation={onStartCapDesignation}
          onCancelCap={onCancelCap}
          isDesignatingSonobuoy={isDesignatingSonobuoy}
          onStartSonobuoyDesignation={onStartSonobuoyDesignation}
          onCancelSonobuoy={onCancelSonobuoy}
        />

        {/* Right: Corner Mini-Radar Scope + 飛行單位/戰艦狀態欄 (Tab切換，保證不遮擋下方甲板) */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Interactive Mini-Radar Widget (Click to Jump Camera) */}
          <MiniRadar
            title="戰術雷達海圖"
            islands={islands}
            playerShips={playerShips}
            enemyShips={enemyShips}
            aircraft={aircraft}
            sonobuoys={sonobuoys}
            worldSize={worldSize}
            cameraViewport={cameraViewport}
            onMiniMapClick={onMiniMapClick}
            radarCoverage={radarCoverage}
          />

          {/* Right Panel Tab Switcher */}
          <div className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-0.5 w-64 flex items-center justify-between text-[10px] font-mono shadow-md">
            <button
              onClick={() => setRightPanelTab('flights')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 font-bold transition-all ${
                rightPanelTab === 'flights'
                  ? 'bg-[#1976D2] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-3 h-3 text-[#80DEEA]" />
              <span>機隊({playerFlights.length})</span>
            </button>
            <button
              onClick={() => setRightPanelTab('cps')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 font-bold transition-all ${
                rightPanelTab === 'cps'
                  ? 'bg-[#C2185B] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="島嶼多據點指揮所與守軍狀況"
            >
              <Flag className="w-3 h-3 text-[#FF80AB]" />
              <span>據點({capturedStrongholdsCount}/{allStrongholds.length})</span>
            </button>
          </div>

          {/* 島嶼據點 (COMMAND POSTS) 狀態欄 */}
          {rightPanelTab === 'cps' && (
            <div className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#C2185B] rounded-lg p-2.5 w-76 text-xs font-mono space-y-2.5 shadow-xl max-h-72 overflow-y-auto">
              {/* Header */}
              <div className="border-b border-[#1E3A5F] pb-1.5 flex justify-between items-center text-[#FF80AB] font-bold">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Flag className="w-3.5 h-3.5 text-[#FF80AB]" />
                  <span>島嶼作戰據點 (CP)</span>
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-[#880E4F] text-[#F8BBD0] rounded font-bold">
                  收復: {capturedStrongholdsCount}/{allStrongholds.length}
                </span>
              </div>

              <div className="text-[9.5px] text-slate-400">
                部隊進入 380m 據點圈肅清守軍 · 點擊直接跳轉視角
              </div>

              {/* Stronghold Cards */}
              <div className="space-y-1.5">
                {allStrongholds.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-2 text-center">本海域暫無據點</div>
                ) : (
                  allStrongholds.map((sh) => {
                    const isContested = sh.captureProgress > 0 && !sh.isCaptured;
                    const friendlyInZone = groundUnits.filter(
                      (u) =>
                        u.side === 'player' &&
                        !u.isDestroyed &&
                        !u.embarkedInShipId &&
                        Math.hypot(u.pos.x - sh.cpPos.x, u.pos.y - sh.cpPos.y) <= 380
                    );

                    return (
                      <div
                        key={sh.id}
                        onClick={() => onMiniMapClick(sh.cpPos)}
                        className={`p-2 rounded border cursor-pointer transition-colors space-y-1 ${
                          sh.isCaptured
                            ? 'bg-[#04160E] border-[#00E676]/60 hover:border-[#00E676]'
                            : isContested
                            ? 'bg-[#1A1608] border-[#FFD54F]/80 hover:border-[#FFD54F]'
                            : 'bg-[#150A0E] border-[#EF5350]/60 hover:border-[#EF5350]'
                        }`}
                        title="點擊跳轉視角至此據點"
                      >
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-bold text-white truncate max-w-[155px]">
                            {sh.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              sh.isCaptured
                                ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50'
                                : isContested
                                ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/50'
                                : 'bg-[#EF5350]/20 text-[#FF8A80] border border-[#EF5350]/50'
                            }`}
                          >
                            {sh.isCaptured
                              ? ('已收復 100%')
                              : isContested
                              ? `交戰中 ${Math.round(sh.captureProgress)}%`
                              : `守軍: ${sh.garrisonIds.length}員`}
                          </span>
                        </div>

                        {/* Location and friendly troops */}
                        <div className="flex justify-between items-center text-[9px] text-slate-300">
                          <span className="text-slate-400">所屬: {sh.islandName}</span>
                          <span className={friendlyInZone.length > 0 ? 'text-[#80DEEA] font-bold' : 'text-slate-500'}>
                            圈內友軍: {friendlyInZone.length} 隊
                          </span>
                        </div>

                        {/* Capture progress bar */}
                        {!sh.isCaptured && (
                          <div className="h-1 bg-[#0D2235] rounded overflow-hidden">
                            <div
                              className="h-full bg-amber-400 transition-all duration-300"
                              style={{ width: `${Math.round(sh.captureProgress)}%` }}
                            />
                          </div>
                        )}

                        {/* Alerts */}
                        {sh.hasTriggeredAmbush && (
                          <div className="text-[8.5px] text-amber-300 flex items-center gap-1">
                            <span>⚠️ 敵地下坑道伏擊部隊已湧出</span>
                          </div>
                        )}
                        {sh.hasTriggeredBanzai && (
                          <div className="text-[8.5px] text-red-400 font-bold flex items-center gap-1">
                            <span>🔥 敵軍正發動決死萬歲衝鋒 (Banzai Charge)!</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 專用飛行單位欄 (AIR SQUADRONS STATUS PANEL) - 1 Flight 包含 2 架戰機 */}
          {rightPanelTab === 'flights' && (
            <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#1E3A5F] hover:border-[#80DEEA]/50 rounded-lg p-2 w-64 text-xs font-mono space-y-1.5 shadow-lg max-h-56 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center text-[#80DEEA] font-semibold border-b border-[#1E3A5F] pb-1 shrink-0">
                <span className="flex items-center gap-1 font-bold text-[11px]">
                  <Plane className="w-3.5 h-3.5 text-[#80DEEA]" />
                  <span>飛行中隊欄 (FLIGHTS)</span>
                </span>
                <span className="tabular-nums font-bold text-emerald-400 text-[10px]">
                  {playerFlights.length} 機隊在空
                </span>
              </div>

              {playerFlights.length === 0 ? (
                <div className="text-[10px] text-slate-500 py-1 text-center">
                  暫無在空飛行中隊 · 可在下方甲板出擊
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1">
                  {playerFlights.map((flight) => {
                    const hpPct = Math.max(0, flight.health / Math.max(1, flight.maxHealth));
                    const stateLabel =
                      flight.state === 'patrolling'
                        ? ('巡邏 PATROL')
                        : flight.state === 'attacking'
                        ? ('空襲 ATTACK')
                        : flight.state === 'diving'
                        ? ('俯衝 DIVING')
                        : flight.state === 'returning'
                        ? ('返航 RTB')
                        : ('飛行 CRUISING');

                    return (
                      <div
                        key={flight.squadronId}
                        onClick={() => {
                          if (flight.planes.length > 0) {
                            onSelectUnitIds?.(flight.planes.map((p) => p.id));
                            onMiniMapClick(flight.planes[0].pos);
                          }
                        }}
                        className="p-1.5 bg-[#040C16] hover:bg-[#0A1E35] border border-[#1E3A5F]/70 hover:border-[#80DEEA]/60 rounded cursor-pointer transition-colors space-y-1"
                        title="點擊選取此中隊並鎖定鏡頭"
                      >
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-bold text-[#E0F7FA] truncate max-w-[150px]">
                            {flight.flightName}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#0D2235] text-[#80DEEA] border border-[#1E3A5F]">
                            {stateLabel}
                          </span>
                        </div>

                        {/* 編隊內各單架飛機標示 (長機 / 僚機) */}
                        <div className="text-[9px] text-[#80DEEA] flex items-center justify-between">
                          <span className="truncate text-slate-400">
                            {flight.planes.map((p) => p.name.split(' ')[0]).join(' · ')}
                          </span>
                          <span className="text-slate-400 tabular-nums">
                            {flight.planes.length} 架/編隊
                          </span>
                        </div>

                        {/* Health bar */}
                        <div className="h-1 bg-[#0D2235] rounded overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${hpPct * 100}%` }}
                          />
                        </div>

                        {/* 下面殘存彈藥判定 (戰鬥機計算機槍殘彈數量) */}
                        <div className="flex justify-between items-center text-[9px]">
                          {flight.role === 'fighter' && (!flight.hasPayload || flight.payloadName === 'Clean Guns') ? (
                            <span className="text-amber-300 font-bold flex items-center gap-1 truncate">
                              <span>💥 機槍殘彈:</span>
                              <span className="text-[#FFE082] tabular-nums">{flight.totalGunAmmo} 發</span>
                            </span>
                          ) : flight.hasPayload && flight.ammoRemaining > 0 ? (
                            <span className="text-amber-300 font-bold flex items-center gap-1 truncate">
                              <span>💥 航彈:</span>
                              <span className="text-[#FFE082]">[{flight.payloadName}] x{flight.ammoRemaining}</span>
                              <span className="text-emerald-400 text-[8.5px]">· MG:{flight.totalGunAmmo}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <span>⚠️ 彈藥已投罄 (返航中)</span>
                            </span>
                          )}
                        </div>

                        {/* 戰鬥機專屬 CAP 空巡快捷發動按鈕 */}
                        {flight.role === 'fighter' && (
                          <div className="pt-0.5 border-t border-[#1E3A5F]/40 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartCapDesignation?.();
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-800 border border-cyan-500/60 text-cyan-200 text-[8.5px] font-bold flex items-center gap-1 shadow-sm transition-colors active:scale-95"
                              title="指派此戰鬥機編隊進行指定區域 CAP 戰鬥空巡"
                            >
                              <Shield className="w-2.5 h-2.5 text-cyan-300" />
                              <span>設定 CAP 空巡 (C)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PINNED BOTTOM AREA (Carrier Flight Deck Sortie Bar - ALWAYS VISIBLE)
          ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 w-full z-30 mt-auto flex flex-col gap-1.5 pointer-events-none">
        {/* Live Mini Battle Log Ticker */}
        {combatLogs.length > 0 && (
          <div
            onClick={onOpenBattleLog}
            className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#1E3A5F] hover:border-[#80DEEA]/60 rounded-lg px-2.5 py-1.5 max-w-xl shadow-xl cursor-pointer transition-all space-y-0.5 group"
            title="點擊打開完整作戰日誌與戰果統計"
          >
            <div className="flex items-center justify-between text-[10px] text-[#90CAF9] font-mono border-b border-[#1E3A5F]/70 pb-0.5">
              <span className="flex items-center gap-1.5 font-bold text-[#80DEEA]">
                <ScrollText className="w-3 h-3 text-[#80DEEA]" />
                <span>最新即時戰報 (LIVE BATTLE FEED)</span>
              </span>
              <span className="text-[9.5px] text-slate-400 group-hover:text-white transition-colors">
                展開完整戰報 ({combatLogs.length}) ➔
              </span>
            </div>
            <div className="space-y-0.5">
              {combatLogs.slice(0, 2).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 text-[10px] truncate font-sans text-slate-200"
                >
                  <span className="font-mono text-[9px] text-slate-400 shrink-0">[{log.timeStr}]</span>
                  {log.diceRoll && (
                    <span className="font-mono text-[8.5px] px-1 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded shrink-0 font-bold">
                      🎲 {log.diceRoll.dieType.toUpperCase()}:{log.diceRoll.roll}
                    </span>
                  )}
                  <span className="truncate flex-1">{log.text}</span>
                  {log.damage !== undefined && log.damage > 0 && (
                    <span className="font-mono font-bold text-[9px] text-amber-300 shrink-0">
                      -{log.damage} HP
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pre-Battle Tactical Pause Status & Quick Unpause Banner */}
        {isPaused && (
          <div className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-amber-400/80 rounded-lg p-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]" />
              <span className="font-bold text-amber-300">
                【戰術推演暫停中】
              </span>
              <span className="text-slate-300 text-[11px]">
                可在下方飛行甲板自由設定「幾機編隊」與「更換掛載」，配置完成後隨時開戰！
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePause}
                className="px-3 py-1 bg-[#00E676] hover:bg-[#00C853] text-[#06101E] font-bold rounded flex items-center gap-1.5 text-xs shadow-lg transition-transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>進入戰鬥 · 開始推演 (SPACE)</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Pinned Multi-Tabbed Deck (Carrier / Land-Based AFB / Requisitions) */}
        {/* Bottom Pinned Context-Sensitive Deck */}
        {!activePlacementItem && isAirFacilityActive && (
          !isBottomDeckExpanded ? (
          <div
            className="pointer-events-auto mx-auto mb-2 bg-[#071322]/95 border border-[#1E3A5F] hover:border-[#80DEEA] rounded-full px-4 py-1.5 flex items-center gap-2 cursor-pointer shadow-2xl transition-all"
          >
            <div className="flex items-center gap-1">
              {hasPlayerCarrier && (
                <button
                  type="button"
                  onClick={() => { setBottomDeckTab('carrier'); setIsBottomDeckExpanded(true); }}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                    bottomDeckTab === 'carrier' ? 'bg-[#1565C0] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚓ 航母甲板
                </button>
              )}
              <button
                type="button"
                onClick={() => { setBottomDeckTab('airbase'); setIsBottomDeckExpanded(true); }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                  bottomDeckTab === 'airbase' ? 'bg-[#00695C] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✈️ 航空站
              </button>
              <button
                type="button"
                onClick={() => {
                  setBottomDeckTab('battalion_cp');
                  setIsBottomDeckExpanded(true);
                  if (activeBattalionCp) {
                    onMiniMapClick(activeBattalionCp.pos);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1 transition-all ${
                  bottomDeckTab === 'battalion_cp' || bottomDeckTab === 'requisition'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-700/40'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>🎖️ 營指揮所</span>
              </button>
              <button
                type="button"
                onClick={() => { setBottomDeckTab('engineer_construction'); setIsBottomDeckExpanded(true); }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                  bottomDeckTab === 'engineer_construction' ? 'bg-amber-600 text-white shadow' : 'text-amber-300 hover:text-white'
                }`}
              >
                🏗️ 工兵建造
              </button>
            </div>
            <span
              onClick={() => setIsBottomDeckExpanded(true)}
              className="text-[10px] text-amber-300 font-bold bg-[#0D2235] px-2 py-0.5 rounded-full border border-amber-500/30"
            >
              展開 ▲
            </span>
          </div>
        ) : (
          <footer className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-2.5 flex flex-col gap-2.5 shadow-2xl max-w-full">
            {/* Deck Header Bar: Context-Specific Title & Emergency Actions */}
            <div className="flex items-center justify-between gap-3 border-b border-[#1E3A5F]/80 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {/* Tab 1: Carrier Deck */}
                {hasPlayerCarrier && (
                  <button
                    type="button"
                    onClick={() => setBottomDeckTab('carrier')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      bottomDeckTab === 'carrier'
                        ? 'bg-gradient-to-r from-[#1565C0] to-[#0D47A1] text-white border border-[#42A5F5] shadow-md ring-1 ring-[#42A5F5]'
                        : 'bg-[#0B1E34]/80 hover:bg-[#153252] text-slate-300 border border-[#1E3A5F]'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-[#80DEEA]" />
                    <span>⚓ 航母甲板</span>
                    <span className="text-[10px] text-emerald-300 font-normal hidden sm:inline">
                      ({era === 'era1' ? 'CV-6' : era === 'era2' ? 'CV-9' : era === 'era3' ? 'CV-34' : era === 'era5' ? 'CVN-68' : 'CV-63'})
                    </span>
                  </button>
                )}

                {/* Tab 2: Land-based AFB */}
                <button
                  type="button"
                  onClick={() => setBottomDeckTab('airbase')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    bottomDeckTab === 'airbase'
                      ? 'bg-gradient-to-r from-[#00695C] to-[#004D40] text-white border border-[#80CBC4] shadow-md ring-1 ring-[#80CBC4]'
                      : 'bg-[#0B1E34]/80 hover:bg-[#153252] text-slate-300 border border-[#1E3A5F]'
                  }`}
                >
                  <Radio className="w-4 h-4 text-[#80CBC4]" />
                  <span>✈️ 陸基航空站</span>
                </button>

                {/* Tab 3: Battalion CP (Support / Reinforcements) */}
                <button
                  type="button"
                  onClick={() => setBottomDeckTab('battalion_cp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    bottomDeckTab === 'battalion_cp' || bottomDeckTab === 'requisition'
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-900 text-white border border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-[#071F1A] hover:bg-[#0A2E26] text-emerald-200 border border-emerald-600/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-emerald-300" />
                  <span>🎖️ 營指揮所 (呼叫支援)</span>
                </button>

                {/* Tab 4: Combat Engineer Construction */}
                <button
                  type="button"
                  onClick={() => setBottomDeckTab('engineer_construction')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    bottomDeckTab === 'engineer_construction'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white border border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-[#0B1E34]/80 hover:bg-[#153252] text-slate-300 border border-[#1E3A5F]'
                  }`}
                >
                  <Hammer className="w-4 h-4 text-amber-300" />
                  <span>🏗️ 工兵急造</span>
                </button>

                {/* Focus Battalion CP button if active */}
                {activeBattalionCp && (
                  <button
                    type="button"
                    onClick={() => {
                      onMiniMapClick(activeBattalionCp.pos);
                      setBottomDeckTab('battalion_cp');
                    }}
                    className="px-2 py-1 rounded bg-[#071F1A] hover:bg-[#0A2E26] border border-emerald-500/50 text-[10px] text-emerald-300 font-mono flex items-center gap-1 transition-colors"
                    title="地圖鏡頭移至營指揮所所在位置"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="hidden md:inline">定位指揮所</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#040C16] border border-amber-500/40 rounded-lg text-xs font-mono ml-1">
                  <span className="text-[10px] text-slate-400">戰術點數:</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {Math.floor(resourcePoints)} CP
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Emergency Fleet Flak Barrage */}
                <button
                  onClick={onTriggerFlak}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#D32F2F] to-[#C2185B] hover:from-[#E53935] hover:to-[#D81B60] border border-[#FF8A80] rounded text-xs font-mono font-bold text-white shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                  title="觸發艦隊周邊所有高射砲密集防空彈幕阻截敵機"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                  <span>防空全彈齊射 (SPACE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBottomDeckExpanded(false)}
                  className="px-2 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-[10px] text-slate-300 hover:text-white font-mono"
                  title="收合出擊列"
                >
                  收合 ▼
                </button>
              </div>
            </div>

          {/* ══════════════════════════════════════════════════════════
              TAB 1: 航艦飛行甲板 (Carrier Flight Deck) - 全面升級版
              ══════════════════════════════════════════════════════════ */}
          {bottomDeckTab === 'carrier' && (
            <div className="flex flex-col gap-2">
              {/* Category Filter Bar & Full Armament Modal Button */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-1 bg-[#051322] p-1 rounded-lg border border-[#1E3A5F]">
                  <span className="text-[10px] text-slate-400 px-1 font-bold">
                    機型篩選:
                  </span>
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'fighter', label: '空優戰機 🛡️' },
                    { id: 'dive_bomber', label: '俯衝轟炸 🎯' },
                    { id: 'torpedo_bomber', label: '魚雷轟炸 🌊' },
                    { id: 'attacker', label: '重型攻擊 💥' },
                    { id: 'special', label: '偵察/特種 📡' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCarrierFilter(f.id as typeof carrierFilter)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                        carrierFilter === f.id
                          ? 'bg-[#1976D2] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenArmament}
                    className="px-2.5 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#FFD54F]/70 rounded text-[10px] text-[#FFD54F] font-bold flex items-center gap-1 transition-colors"
                    title="開啟母艦全軍械庫彈藥庫"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>母艦全裝備庫</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Backspace 暫停 · Space 防空
                  </span>
                </div>
              </div>

              {/* Deck selector and ferry destination */}
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[10px]">
                {carriers.length > 1 &&
                  carriers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCarrierId(c.id)}
                      className={`px-2 py-0.5 rounded font-bold border ${activeCarrier?.id === c.id ? 'bg-[#1976D2] text-white border-[#42A5F5]' : 'bg-[#0B1E34] text-slate-300 border-[#1E3A5F] hover:text-white'}`}
                    >
                      ⚓ {c.name}
                    </button>
                  ))}
                <span className="text-slate-400 ml-auto">轉場至</span>
                <select
                  value={carrierFerryTo}
                  onChange={(e) => setCarrierFerryTo(e.target.value)}
                  className="bg-[#0B1E34] border border-[#1E3A5F] rounded px-1.5 py-0.5 text-[10px] text-[#80DEEA]"
                >
                  <option value="">— 選擇目的地 —</option>
                  {ferryBases.filter((b) => b.id !== activeCarrier?.id).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Carrier Aircraft Cards with Draggable and Wheel Scroll */}
              <DraggableScrollContainer className="gap-2 pb-1">
                {flightModels
                  .filter((fm) => {
                    if (carrierFilter === 'all') return true;
                    if (carrierFilter === 'fighter') return fm.role === 'fighter';
                    if (carrierFilter === 'dive_bomber') return fm.role === 'dive_bomber';
                    if (carrierFilter === 'torpedo_bomber') return fm.role === 'torpedo_bomber';
                    if (carrierFilter === 'attacker') return fm.role === 'attacker';
                    if (carrierFilter === 'special') return fm.role === 'scout' || fm.role === 'aew' || fm.role === 'rescue' || fm.role === 'transport';
                    return true;
                  })
                  .map(({ model, label, role, desc }) => {
                    const readyCount = planes[model] || 0;
                    const hasReady = readyCount > 0;
                    const selectedCount = formationCounts[model] || (role === 'scout' ? 1 : 2);
                    const effectiveCount = Math.min(selectedCount, readyCount || 1);
                    const currentPayload = resolvePayload(model, modelPayloads[model] || activePayloads[role], era);
                    const payloadData = PAYLOAD_CATALOG[currentPayload] || PAYLOAD_CATALOG.clean_guns;
                    const compatiblePayloads = getModelPayloads(model, era);

                    const roleBadge =
                      role === 'fighter'
                        ? ('【空優戰機】')
                        : role === 'dive_bomber'
                        ? ('【俯衝轟炸】')
                        : role === 'torpedo_bomber'
                        ? ('【魚雷反艦】')
                        : role === 'attacker'
                        ? ('【重型攻擊】')
                        : role === 'aew'
                        ? ('【預警機】')
                        : role === 'rescue'
                        ? ('【搜救直升機】')
                        : role === 'transport'
                        ? ('【戰術空投】')
                        : ('【艦載偵察】');

                    return (
                      <div
                        key={model}
                        title={`${label} — ${desc}`}
                        className="relative flex flex-col justify-between bg-[#071526] border border-[#1E3A5F] hover:border-[#388E3C]/80 rounded-lg p-2 text-xs font-mono shadow-md min-w-[156px] max-w-[168px] transition-colors shrink-0"
                      >
                        {/* Header: Name & Count */}
                        <div>
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#1E3A5F]/60">
                            <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate">
                              {label}
                            </span>
                            <span
                              className={`tabular-nums text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                                hasReady
                                  ? 'bg-[#004D40] text-[#00E676] border border-[#00BFA5]/40'
                                  : 'bg-red-950/60 text-red-400 border border-red-800/40'
                              }`}
                            >
                              {readyCount}架
                            </span>
                          </div>

                          {/* Unit Demonstration Blueprint Preview */}
                          <div className="relative mt-1">
                            <UnitPreviewCanvas
                              kind="aircraft"
                              unitKey={model}
                              width={144}
                              height={42}
                              payloadType={currentPayload}
                            />
                            <span className="absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-[#040C16]/85 border border-[#1E3A5F]/80 text-[8px] font-bold text-[#80DEEA]">
                              {roleBadge.replace(/[【】]/g, '')}
                            </span>
                          </div>

                          {/* Formation Selector */}
                          <div className="flex items-center justify-between mt-1 gap-1">
                            <span className="text-[9px] text-slate-400 shrink-0">編隊:</span>
                            <div className="flex items-center gap-0.5 bg-[#040C16] p-0.5 rounded border border-[#1E3A5F]">
                              {[1, 2, 4].map((cnt) => (
                                <button
                                  key={cnt}
                                  type="button"
                                  onClick={() => setFormationCounts((prev) => ({ ...prev, [model]: cnt }))}
                                  className={`px-1 py-0.2 text-[9px] rounded font-bold transition-colors ${
                                    selectedCount === cnt
                                      ? 'bg-[#1976D2] text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title={`${cnt} 機編隊出擊`}
                                >
                                  {cnt}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setFormationCounts((prev) => ({ ...prev, [model]: Math.max(1, readyCount) }))}
                                className={`px-1 py-0.2 text-[9px] rounded font-bold transition-colors ${
                                  selectedCount >= 6 || (readyCount > 0 && selectedCount === readyCount)
                                    ? 'bg-[#1976D2] text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                                title="全部在艦飛機出擊"
                              >
                                全
                              </button>
                            </div>
                          </div>

                          {/* Interactive Armament Tray Trigger Card */}
                          <div className="mt-1.5 bg-[#040E1B] p-1.5 rounded border border-[#1E3A5F]/80 flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8px] font-bold text-emerald-400 bg-[#004D40]/60 px-1 py-0.2 rounded truncate">
                                {payloadData.purposeBadge || ('作戰')}
                              </span>
                              <span className="text-[8.5px] text-amber-300 font-bold tabular-nums">
                                {payloadData.damage > 0 ? `${payloadData.damage}D` : 'CAP'}
                              </span>
                            </div>

                            <div className="font-bold text-white text-[9.5px] truncate">
                              {payloadData.badge}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveArmamentTray({
                                  planeId: model,
                                  planeLabel: label,
                                  role,
                                  isAirbase: false,
                                  compatiblePayloads,
                                  currentPayload,
                                })
                              }
                              className="mt-0.5 w-full py-0.5 px-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#42A5F5]/60 hover:border-[#42A5F5] rounded text-[8.5px] text-[#80DEEA] hover:text-white font-bold flex items-center justify-center gap-0.5 transition-colors"
                            >
                              <Sliders className="w-2.5 h-2.5 text-[#80DEEA]" />
                              <span>更換掛載</span>
                            </button>
                          </div>
                        </div>

                        {/* Sortie Button */}
                        <button
                          type="button"
                          disabled={!hasReady}
                          onClick={() => {
                            onLaunchModel(model, effectiveCount, currentPayload, activeCarrier?.id);
                            setBottomDeckTab('carrier');
                            setIsBottomDeckExpanded(true);
                          }}
                          className={`mt-1.5 py-1 px-1.5 rounded font-bold text-center text-[10px] flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                            hasReady
                              ? 'bg-gradient-to-r from-[#1976D2] to-[#0D47A1] hover:from-[#2196F3] hover:to-[#1565C0] text-white border border-[#42A5F5]/60 shadow'
                              : 'bg-[#050D18] border border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <Plane className="w-3 h-3 shrink-0" />
                          <span className="truncate">{hasReady ? (`出擊 ${effectiveCount}機`) : ('整備中')}</span>
                        </button>
                        <button
                          type="button"
                          disabled={!hasReady || !carrierFerryTo || !activeCarrier}
                          onClick={() => activeCarrier && onTransferPlanes?.(model, effectiveCount, activeCarrier.id, carrierFerryTo)}
                          className={`mt-1 py-0.5 px-1.5 rounded font-bold text-center text-[9px] border ${hasReady && carrierFerryTo ? 'bg-[#0B1E34] hover:bg-[#153252] text-[#80DEEA] border-[#1E3A5F]' : 'bg-[#050D18] text-slate-600 border-slate-800 cursor-not-allowed'}`}
                          title="以轉場航線飛往選定的機場或航艦"
                        >
                          🛫 轉場 {effectiveCount}機
                        </button>
                      </div>
                    );
                  })}
              </DraggableScrollContainer>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: 陸基航空基地 (Land-Based Airbase AFB) - 全面升級版
              ══════════════════════════════════════════════════════════ */}
          {bottomDeckTab === 'airbase' && (
            <div className="flex flex-col gap-2">
              {/* Header Info & Category Filter Bar */}
              <div className="flex items-center justify-between text-xs font-mono text-[#80CBC4] bg-[#051A18] px-3 py-1.5 rounded border border-[#00695C]">
                <div className="flex items-center gap-2">
                  <span className="font-bold">前進野戰陸基航空站 (FORWARD AIRBASE)</span>
                  <span className="text-[10px] text-slate-300">
                    {era === 'era5'
                        ? '支援 B-52G / F-111 現代長程戰轟、A-10A / AH-64A / F-15A / F-16A 陸空主力與海軍陸基戰備分隊！'
                        : era === 'era4'
                        ? '支援 B-52 戰略重轟、F-4E / F-105D 超音速戰機與海軍陸基分隊！'
                        : '支援 B-17 / B-24 / B-29 重型水平轟炸機、雙發重攻擊機與陸航空優戰機！'}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300 font-bold bg-[#004D40] px-2 py-0.5 rounded border border-[#80CBC4]/50">
                  基地補給倒數: {Math.ceil(airbaseReplenishTimer)}s
                </div>
              </div>

              {/* AFB Category Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-1 bg-[#03151D] p-1 rounded-lg border border-[#00695C]">
                  <span className="text-[10px] text-slate-400 px-1 font-bold">機型分類:</span>
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'level_bomber', label: '水平重轟 💣' },
                    { id: 'fighter', label: '陸航空優 🛡️' },
                    { id: 'attacker', label: '強襲攻擊 🎯' },
                    { id: 'navy', label: '海軍分隊 ⚓' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAfbFilter(f.id as typeof afbFilter)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                        afbFilter === f.id
                          ? 'bg-[#00897B] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenArmament}
                    className="px-2.5 py-1 bg-[#051A18] hover:bg-[#004D40] border border-[#80CBC4]/70 rounded text-[10px] text-[#80CBC4] font-bold flex items-center gap-1 transition-colors"
                    title="開啟軍械庫彈藥庫"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>戰地軍械庫</span>
                  </button>
                  <span className="text-[10px] text-slate-400">長程出擊可隨時返降基地</span>
                </div>
              </div>

              {/* Airfield selector (each has its own stock) and ferry destination */}
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[10px]">
                {airfields.map((a) => {
                  const total = Object.values(a.planes).reduce((s, n) => s + (n || 0), 0);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAirfieldId(a.id)}
                      className={`px-2 py-0.5 rounded font-bold border ${activeAirfield?.id === a.id ? 'bg-[#00897B] text-white border-[#80CBC4]' : 'bg-[#051A18] text-slate-300 border-[#1E3A5F] hover:text-white'}`}
                      title={a.isHQ ? 'HQ 島機場：所有增援與補充飛機先抵達此處' : '前進機場：獨立庫存，以轉場補充'}
                    >
                      {a.isHQ ? '🏛️ HQ ' : '🛬 '}{a.name} · {total}機
                    </button>
                  );
                })}
                <span className="text-slate-400 ml-auto">轉場至</span>
                <select
                  value={afbFerryTo}
                  onChange={(e) => setAfbFerryTo(e.target.value)}
                  className="bg-[#051A18] border border-[#1E3A5F] rounded px-1.5 py-0.5 text-[10px] text-[#80CBC4]"
                >
                  <option value="">— 選擇目的地 —</option>
                  {ferryBases.filter((b) => b.id !== activeAirfield?.id).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* AFB Aircraft Cards with Draggable and Wheel Scroll */}
              <DraggableScrollContainer className="gap-2 pb-1">
                {afbModels
                  .filter((p) => {
                    if (afbFilter === 'all') return true;
                    if (afbFilter === 'level_bomber') return p.role === 'level_bomber';
                    if (afbFilter === 'fighter') return p.role === 'fighter' && !p.isNavy;
                    if (afbFilter === 'attacker') return p.role === 'attacker' && !p.isNavy;
                    if (afbFilter === 'navy') return p.isNavy;
                    return true;
                  })
                  .map(({ id, label, role, desc, isNavy }) => {
                    const mCount = airbaseStock[id] || 0;
                    const hasReady = mCount > 0;
                    const selectedCount = afbFormationCounts[id] || 2;
                    const effectiveCount = Math.min(selectedCount, mCount || 1);
                    const currentPayload = resolvePayload(id, afbPayloads[id], era);
                    const payloadData = PAYLOAD_CATALOG[currentPayload] || PAYLOAD_CATALOG.clean_guns;
                    const isCarrierCapable = isNavy;
                    const afbCompatiblePayloads = getModelPayloads(id, era);
                    const isNukeEquipped =
                      currentPayload === 'tactical_nuke' ||
                      currentPayload === 'b52_megaton_nuke' ||
                      currentPayload === 'tactical_b61_nuke';
                    const requiredNukeCp = payloadData.cpCost || 4500;
                    const canAffordNuke = resourcePoints >= requiredNukeCp;

                    const roleBadge =
                      role === 'level_bomber'
                        ? ('【水平重轟】')
                        : role === 'attacker'
                        ? ('【陸基強襲】')
                        : role === 'fighter'
                        ? isNavy
                          ? ('【海軍陸基】')
                          : ('【陸航空優】')
                        : role === 'transport'
                        ? ('【戰術空投】')
                        : role === 'rescue'
                        ? ('【直升突擊】')
                        : ('【海軍分隊】');

                    return (
                      <div
                        key={id}
                        title={`${label} — ${desc}`}
                        className={`relative flex flex-col justify-between rounded-lg p-2 text-xs font-mono shadow-md min-w-[158px] max-w-[170px] transition-colors shrink-0 ${
                          isNukeEquipped
                            ? 'bg-[#180E14] border-2 border-amber-400 shadow-[0_0_12px_rgba(255,160,0,0.3)]'
                            : 'bg-[#05151F] border border-[#00695C] hover:border-[#80CBC4]'
                        }`}
                      >
                        {/* Card Header: Model Name & Ready Count */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#004D40]">
                          <span className="font-bold text-[#E0F2F1] text-[10.5px] truncate">
                            {label}
                          </span>
                          <span
                            className={`tabular-nums text-[9.5px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                              hasReady
                                ? 'bg-[#004D40] text-[#80CBC4] border border-[#80CBC4]/50'
                                : 'bg-slate-900 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {mCount}架
                          </span>
                        </div>

                        {/* Unit Demonstration Blueprint Preview */}
                        <div className="relative mt-1">
                          <UnitPreviewCanvas
                            kind="aircraft"
                            unitKey={id}
                            width={144}
                            height={42}
                            payloadType={currentPayload}
                          />
                          <span
                            className={`absolute bottom-0.5 left-1 px-1 py-0.2 rounded bg-[#040C16]/85 border border-[#004D40]/90 text-[8px] font-bold ${
                              isNukeEquipped ? 'text-amber-300' : 'text-[#80CBC4]'
                            }`}
                          >
                            {roleBadge.replace(/[【】]/g, '')}
                          </span>
                        </div>

                        {/* Formation Selector */}
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <span className="text-[10px] text-slate-400 shrink-0">編隊:</span>
                          <div className="flex items-center gap-0.5 bg-[#031017] p-0.5 rounded border border-[#004D40]">
                            {[1, 2, 4].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setAfbFormationCounts((prev) => ({ ...prev, [id]: cnt }))}
                                className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors ${
                                  selectedCount === cnt
                                    ? 'bg-[#00897B] text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                                title={`${cnt} 機編隊出擊`}
                              >
                                {cnt}機
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setAfbFormationCounts((prev) => ({ ...prev, [id]: Math.max(1, mCount) }))}
                              className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors ${
                                selectedCount >= 6 || (mCount > 0 && selectedCount === mCount)
                                  ? 'bg-[#00897B] text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title="全部在基地的飛機出擊"
                            >
                              全
                            </button>
                          </div>
                        </div>

                        {/* Interactive Armament Tray Trigger Card */}
                        <div
                          className={`mt-2 p-2 rounded-lg border flex flex-col gap-1 ${
                            isNukeEquipped
                              ? 'bg-[#280F0F] border-amber-500/80'
                              : 'bg-[#031017] border-[#004D40]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isNukeEquipped
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold'
                                  : 'bg-[#004D40]/80 text-[#80CBC4]'
                              }`}
                            >
                              {payloadData.purposeBadge || ('【戰術作戰】')}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate font-mono">
                              {payloadData.visualTag || ('[標準機載]')}
                            </span>
                          </div>

                          <div className={`font-bold text-[10px] truncate mt-0.5 ${isNukeEquipped ? 'text-amber-300' : 'text-white'}`}>
                            {payloadData.badge}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-300">
                            <span>💥 半徑: {payloadData.blastRadius ? `${payloadData.blastRadius}m` : ('直擊')}</span>
                            <span className="text-amber-300 font-bold tabular-nums">
                              {payloadData.damage > 0 ? `${payloadData.damage.toLocaleString()} DMG` : ('空戰')}
                            </span>
                          </div>

                          {payloadData.cpCost ? (
                            <div className="text-[9px] font-bold flex items-center justify-between pt-0.5 border-t border-red-900/40">
                              <span className="text-amber-400">☢️ 戰略授權 CP:</span>
                              <span className={canAffordNuke ? 'text-amber-300' : 'text-red-400'}>
                                {payloadData.cpCost} CP
                              </span>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              setActiveArmamentTray({
                                planeId: id,
                                planeLabel: label,
                                role,
                                isAirbase: true,
                                compatiblePayloads: afbCompatiblePayloads,
                                currentPayload,
                              })
                            }
                            className="mt-1 w-full py-1 px-1.5 bg-[#07242B] hover:bg-[#004D40] border border-[#80CBC4]/60 hover:border-[#80CBC4] rounded text-[10px] text-[#80CBC4] hover:text-white font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Sliders className="w-3 h-3 text-[#80CBC4]" />
                            <span>更換掛載</span>
                          </button>
                        </div>

                        {/* Action Buttons: Sortie & Ferry */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {(() => {
                            const dest = ferryBases.find((b) => b.id === afbFerryTo);
                            const deckOnly = dest?.isCarrier && !isCarrierCapable;
                            const canFerry = hasReady && !!dest && !deckOnly && !!activeAirfield;
                            return (
                              <button
                                type="button"
                                disabled={!canFerry}
                                onClick={() => activeAirfield && onTransferPlanes?.(id as AircraftModel, effectiveCount, activeAirfield.id, afbFerryTo)}
                                className={`py-1.5 px-1 rounded font-bold text-center text-[10px] flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                                  canFerry
                                    ? 'bg-[#0B1E34] hover:bg-[#153252] text-[#80DEEA] border border-[#1E3A5F]'
                                    : 'bg-[#031017] text-slate-600 border border-slate-800 cursor-not-allowed'
                                }`}
                                title={deckOnly ? '陸基機型無法降落航艦甲板' : '以轉場航線飛往選定的機場或航艦'}
                              >
                                <span>{deckOnly ? '陸航專用' : '🛫 轉場'}</span>
                              </button>
                            );
                          })()}

                          <button
                            type="button"
                            disabled={!hasReady}
                            onClick={() => {
                              onLaunchAirbaseSortie?.(id as AircraftModel, effectiveCount, currentPayload, activeAirfield?.id);
                            }}
                            className={`py-1.5 px-1 rounded font-bold text-center text-[10px] flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                              hasReady
                                ? isNukeEquipped
                                  ? canAffordNuke
                                    ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white border border-amber-300 shadow-xl'
                                    : 'bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300'
                                  : 'bg-gradient-to-r from-[#00897B] to-[#004D40] hover:from-[#26A69A] hover:to-[#00796B] text-white border border-[#80CBC4]/60 shadow'
                                : 'bg-[#031017] border border-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            <Plane className="w-3 h-3" />
                            <span className="truncate">
                              {hasReady
                                ? isNukeEquipped
                                  ? canAffordNuke
                                    ? ('☢️ 核打擊出擊')
                                    : (`☢️ 差${Math.max(0, requiredNukeCp - Math.floor(resourcePoints))} CP`)
                                  : (`出擊 ${effectiveCount}機`)
                                : ('無機')}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </DraggableScrollContainer>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: 工兵急造戰地工程部 (Engineer Construction Only)
              按工兵群時專屬打開，僅提供 6 項指定急造工事
              ══════════════════════════════════════════════════════════ */}
          {bottomDeckTab === 'engineer_construction' && (
            <div className="flex flex-col gap-2">
              {/* Category Filter Tabs & Target Island Selector */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono border-b border-[#1E3A5F]/60 pb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-300 font-bold flex items-center gap-1 mr-1 text-[11px]">
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                    <span>工事分類:</span>
                  </span>
                  {[
                    { id: 'all', label: '全部工事' },
                    { id: 'aviation', label: '✈️ 航空野戰基地' },
                    { id: 'air_defense', label: '🛡️ 防空飛彈/火砲' },
                    { id: 'naval', label: '⚓ 海軍軍港浮塢' },
                    { id: 'fortification', label: '🏰 防衛堡壘/指揮所' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEngineerTab(tab.id as typeof engineerTab)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        engineerTab === tab.id
                          ? 'bg-amber-600 text-white font-extrabold shadow'
                          : 'bg-[#040C16] text-slate-300 hover:text-white border border-[#1E3A5F]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Target island selector */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">所屬島嶼:</span>
                  <select
                    value={selectedBuildIslandId}
                    onChange={(e) => setSelectedBuildIslandId(e.target.value)}
                    className="bg-[#040C16] border border-[#1E3A5F] rounded px-2 py-0.5 text-amber-300 text-xs font-mono focus:outline-none"
                  >
                    <option value="">
                      預設友軍登陸島嶼
                    </option>
                    {islands
                      .filter((isl) => isl.isFriendlyBase || isl.isFullyCaptured || isl.installations.some((i) => i.side === 'player' && !i.isDestroyed))
                      .map((isl) => (
                        <option key={isl.id} value={isl.id}>
                          {isl.name} {isl.isFullyCaptured ? '★已收復' : isl.isFriendlyBase ? '★主力基地' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 時代四冷戰工事快捷建造列表 (Cold War Rapid Engineering Quick Bar) */}
              <div className="bg-[#051322] border border-amber-500/30 rounded-lg p-1.5 flex items-center justify-between gap-1.5 flex-wrap text-xs font-mono">
                <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{(era === 'era4' ? '冷戰工事快捷建造:' : '戰地工事快捷建造:')}</span>
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {(era === 'era4' || era === 'era5'
                    ? [
                        { id: 'req-fac-sam-hawk', label: '⚡ 霍克SAM飛彈', cost: '380 CP' },
                        { id: 'req-fac-airfield', label: '⚡ 前進野戰跑道', cost: '320 CP' },
                        { id: 'req-fac-fob', label: '⚡ 前進基地(FOB)', cost: '450 CP' },
                        { id: 'req-fac-radar', label: '⚡ SPS-40長程雷達', cost: '220 CP' },
                        { id: 'req-fac-dockyard', label: '⚡ 應急修護浮塢', cost: '260 CP' },
                        { id: 'req-fac-m1-240mm', label: '⚡ M1 240mm重砲', cost: '360 CP' },
                      ]
                    : [
                        { id: 'req-fac-forward-airfield', label: '⚡ 前進野戰跑道', cost: '320 CP' },
                        { id: 'req-fac-heavy-aa', label: '⚡ 雙聯重型防空砲', cost: '220 CP' },
                        { id: 'req-fac-battalion-cp', label: '⚡ 營前進指揮所', cost: '250 CP' },
                        { id: 'req-fac-dockyard', label: '⚡ 戰地修護浮塢', cost: '220 CP' },
                        { id: 'req-fac-coastal-gun', label: '⚡ 岸防重砲', cost: '350 CP' },
                        { id: 'req-fac-m1-240mm', label: '⚡ M1 240mm重砲', cost: '340 CP' },
                      ]
                  ).map((qItem) => {
                    const matchedItem = currentCatalog.find((c) => c.id === qItem.id);
                    if (!matchedItem) return null;
                    const canAfford = sandboxStamp || resourcePoints >= matchedItem.cost;

                    return (
                      <button
                        key={qItem.id}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          onPurchaseRequisition?.(matchedItem, selectedBuildIslandId || undefined, selectedEngineerUnit?.pos);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 whitespace-nowrap transition-transform active:scale-95 ${
                          canAfford
                            ? 'bg-[#0B2138] hover:bg-[#12365D] border-amber-400/60 text-amber-200 hover:text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                        title={`${matchedItem.name} — ${matchedItem.desc} (${matchedItem.cost} CP)`}
                      >
                        <UnitPreviewCanvas
                          kind="installation"
                          unitKey={matchedItem.typeTag || matchedItem.id}
                          width={24}
                          height={15}
                          compact
                        />
                        <span>{qItem.label}</span>
                        <span className="tabular-nums text-[9px] text-amber-400 font-mono">({qItem.cost})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items Catalog Cards for Engineers */}
              <DraggableScrollContainer className="gap-2 pb-1 max-w-full">
                {currentCatalog
                  .filter((item) => {
                    const isInstallation = item.category === 'installations' || ENGINEER_BUILD_IDS.includes(item.id);
                    if (!isInstallation) return false;

                    if (engineerTab === 'all') return true;
                    if (engineerTab === 'aviation') {
                      return item.typeTag === 'airfield' || item.id.includes('airfield');
                    }
                    if (engineerTab === 'air_defense') {
                      return item.typeTag === 'heavy_aa' || item.typeTag === 'sam_hawk' || item.id.includes('aa') || item.id.includes('sam');
                    }
                    if (engineerTab === 'naval') {
                      return item.typeTag === 'dockyard' || item.typeTag === 'pontoon_pier' || item.typeTag === 'major_naval_port' || item.typeTag === 'coastal_gun' || item.typeTag === 'm1_240mm';
                    }
                    if (engineerTab === 'fortification') {
                      return item.typeTag === 'fob' || item.typeTag === 'battalion_cp' || item.typeTag === 'command_post' || item.typeTag === 'radar' || item.typeTag === 'supply_depot' || item.typeTag === 'ammo_depot' || item.typeTag === 'field_hospital';
                    }
                    return true;
                  })
                  .map((item) => {
                    const canAfford = sandboxStamp || resourcePoints >= item.cost;
                    const shortCp = Math.ceil(item.cost - resourcePoints);
                    const isPierFacility =
                      item.typeTag === 'dockyard' || item.typeTag === 'pontoon_pier' || item.typeTag === 'major_naval_port';

                    return (
                      <div
                        key={item.id}
                        title={`${item.name} (${item.cost} CP)\n${item.desc}\n${item.statsDesc}`}
                        className="flex flex-col justify-between bg-[#071526] border border-amber-500/40 hover:border-amber-400 rounded-lg p-2 text-xs font-mono shadow-md min-w-[162px] max-w-[172px] transition-all shrink-0"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#1E3A5F]/70">
                            <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="relative mt-1">
                            <UnitPreviewCanvas
                              kind="installation"
                              unitKey={item.typeTag || item.id}
                              width={148}
                              height={46}
                            />
                            <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-[#040C16]/90 border border-amber-500/60 text-amber-300 font-bold text-[9.5px] tabular-nums">
                              {item.cost} CP
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="px-1 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-600/50 rounded text-[8.5px] font-bold truncate">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[8.5px] text-[#80DEEA] mt-1 bg-[#040C16] px-1 py-0.5 rounded border border-[#1E3A5F]/50 truncate">
                            {item.statsDesc}
                          </div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-[#1E3A5F]/60 flex flex-col gap-1">
                          <div className="flex items-center gap-1 w-full">
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                onStartPlacement?.(item);
                              }}
                              className={`flex-1 py-1 px-1 rounded font-bold text-[9.5px] flex items-center justify-center gap-0.5 transition-transform active:scale-95 ${
                                canAfford
                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white border border-cyan-400 shadow'
                                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                              title={
                                canAfford
                                  ? isPierFacility
                                    ? `在海圖上指定「${item.name}」突堤碼頭建造座標`
                                    : `在海圖上指定建造座標`
                                  : `資源不足 (尚欠 ${shortCp} CP)`
                              }
                            >
                              <MapPin className="w-2.5 h-2.5 text-cyan-200 shrink-0" />
                              <span className="truncate">
                                {isPierFacility ? ('落點指定') : '指定位置建造'}
                              </span>
                            </button>

                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                onPurchaseRequisition?.(item, selectedBuildIslandId || undefined, selectedEngineerUnit?.pos);
                              }}
                              className={`py-1 px-1.5 rounded font-semibold text-[9.5px] flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
                                canAfford
                                  ? 'bg-[#0B1E34] hover:bg-[#153252] text-amber-300 border border-amber-500/50'
                                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                              title="快捷在工兵身旁或目標島建造"
                            >
                              <span>快捷建造</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </DraggableScrollContainer>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: 營指揮所專屬 呼叫支援選單 (Battalion CP Requisitions)
              按營指揮所時專屬打開，地面部隊在該營指揮所旁集結，艦艇自邊緣增援
              ══════════════════════════════════════════════════════════ */}
          {(bottomDeckTab === 'battalion_cp' || bottomDeckTab === 'requisition') && (
            <div className="flex flex-col gap-2">
              {/* Category Sub-Tabs & Spawning Rule Callout */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono border-b border-[#1E3A5F]/60 pb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-emerald-400 font-bold flex items-center gap-1 mr-1 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>支援類別:</span>
                  </span>
                  {(
                    [
                      { key: 'ground', label: `🪖 陸戰隊與裝甲部隊` },
                      { key: 'ships', label: `⚓ 水面艦艇支援` },
                      { key: 'aircraft', label: `✈️ 航空戰力增援` },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setRequisitionTab(cat.key)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        requisitionTab === cat.key
                          ? 'bg-emerald-600 text-white font-extrabold shadow'
                          : 'bg-[#040C16] text-slate-300 hover:text-white border border-[#1E3A5F]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-emerald-300 font-mono">
                  <span className="bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded">
                    增援規則：陸地單位自本營指揮所旁集結；海軍艦艇自地圖南緣入役；飛機進駐航空基地
                  </span>
                </div>
              </div>

              {/* Items Catalog Cards for Battalion CP Support */}
              <DraggableScrollContainer className="gap-2 pb-1 max-w-full">
                {currentCatalog.filter((item) => item.category === requisitionTab).map((item) => {
                  const canAfford = sandboxStamp || resourcePoints >= item.cost;
                  const shortCp = Math.ceil(item.cost - resourcePoints);

                  const previewKind =
                    requisitionTab === 'ships'
                      ? 'ship'
                      : requisitionTab === 'aircraft'
                      ? 'aircraft'
                      : 'ground';

                  return (
                    <div
                      key={item.id}
                      title={`${item.name} (${item.cost} CP)\n${item.desc}\n${item.statsDesc}`}
                      className="flex flex-col justify-between bg-[#071526] border border-[#1E3A5F] hover:border-emerald-400/80 rounded-lg p-2 text-xs font-mono shadow-md min-w-[162px] max-w-[172px] transition-all shrink-0"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#1E3A5F]/70">
                          <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="relative mt-1">
                          <UnitPreviewCanvas
                            kind={previewKind}
                            unitKey={item.typeTag || item.id}
                            width={148}
                            height={46}
                          />
                          <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-[#040C16]/90 border border-emerald-500/60 text-amber-300 font-bold text-[9.5px] tabular-nums">
                            {item.cost} CP
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="px-1 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 rounded text-[8.5px] font-bold truncate">
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[8.5px] text-[#80DEEA] mt-1 bg-[#040C16] px-1 py-0.5 rounded border border-[#1E3A5F]/50 truncate">
                          {item.statsDesc}
                        </div>
                      </div>

                      <div className="mt-2 pt-1 border-t border-[#1E3A5F]/60 flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            onPurchaseRequisition?.(
                              item,
                              selectedBuildIslandId || undefined,
                              requisitionTab === 'ground' ? activeBattalionCp?.pos : undefined
                            );
                          }}
                          className={`w-full py-1 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                            canAfford
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border border-emerald-400/80 shadow'
                              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                          title={canAfford ? `呼叫支援 ${item.name}` : `資源點數不足 (尚欠 ${shortCp} CP)`}
                        >
                          <ShoppingCart className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{canAfford ? ('呼叫支援') : `差 ${shortCp} CP`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </DraggableScrollContainer>
            </div>
          )}
        </footer>
      )
    )}

      {/* 戰地軍械庫掛載選擇盤 (Tactical Armament Selector Tray Modal) */}
      <ArmamentTrayModal
        tray={activeArmamentTray}
        resourcePoints={resourcePoints}
        onClose={() => setActiveArmamentTray(null)}
        onSelectPayload={(pid) => {
          if (!activeArmamentTray) return;
          if (activeArmamentTray.isAirbase) {
            setAfbPayloads((prev) => ({ ...prev, [activeArmamentTray.planeId]: pid }));
          } else {
            setModelPayloads((prev) => ({ ...prev, [activeArmamentTray.planeId as AircraftModel]: pid }));
            onSelectPayload?.(activeArmamentTray.role, pid);
          }
          setActiveArmamentTray((prev) => (prev ? { ...prev, currentPayload: pid } : null));
        }}
      />
      </div>
    </div>
  );
};

