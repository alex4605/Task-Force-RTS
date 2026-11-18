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
  ResourceState,
  Sonobuoy,
} from '../types/game';
import { REQUISITION_CATALOG, getRequisitionCatalog } from '../game/requisition';
import { BattleAlertBanner } from '../game/engine';
import {
  ShieldAlert,
  Plane,
  Volume2,
  VolumeX,
  Map as MapIcon,
  HelpCircle,
  Wrench,
  Compass,
  Square,
  Crosshair,
  Anchor,
  Sliders,
  Eye,
  Zap,
  Play,
  Pause,
  ScrollText,
  Radio,
  Flag,
  Rocket,
  Shield,
  Layers,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Check,
  Plus,
  MapPin,
  Languages,
  Hammer,
} from 'lucide-react';
import { Language, getTranslation } from '../game/i18n';

interface HUDProps {
  lang?: Language;
  onSetLang?: (lang: Language) => void;
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
  onLaunchModel: (model: AircraftModel, count?: number, payload?: AircraftPayloadType) => void;
  onOrderSelected: (type: 'move' | 'attack' | 'patrol' | 'rtb' | 'idle') => void;
  onStopUnits: () => void;
  onSetSpeed: (speed: number) => void;
  onSteer: (dir: 'port' | 'starboard') => void;
  onTriggerFlak: () => void;
  intel: SectorIntel | null;
  score: GameScore;
  onOpenBriefing: () => void;
  onOpenMap: () => void;
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
  isMuted: boolean;
  onToggleMute: () => void;
  // AFB and Convoy Reinforcements
  airbasePlanes?: Record<string, number>;
  airbaseReplenishTimer?: number;
  convoyReinforceTimer?: number;
  nextConvoyEscort?: 'ss' | 'dd' | 'cl' | 'ca';
  onFerryPlanes?: (model: string, count: number) => void;
  onLaunchAirbaseSortie?: (model: AircraftModel, count: number, payload?: AircraftPayloadType) => void;
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
  onSetSpeed,
  onSteer,
  onTriggerFlak,
  intel,
  score,
  onOpenBriefing,
  onOpenMap,
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
  isMuted,
  onToggleMute,
  airbasePlanes = {},
  airbaseReplenishTimer = 45,
  convoyReinforceTimer = 100,
  nextConvoyEscort = 'dd',
  onFerryPlanes,
  onLaunchAirbaseSortie,
  onToggleTransportEmbark,
  onTriggerLSMRocket,
  onBuildAirfield,
  onUnloadAircraft,
  resourcePoints = 1200,
  commandPointsPerSec = 15,
  totalCpEarned = 1200,
  totalCpSpent = 0,
  casualties,
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
  lang = 'zh',
  onSetLang,
}) => {
  const t = getTranslation(lang);
  const currentSpeed = flagship ? Math.round(flagship.speed) : 0;
  const planes = flagship?.carrierPlanes?.ready || {};
  const miniMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMiniMapDraggingRef = useRef<boolean>(false);
  const currentCatalog = useMemo(() => getRequisitionCatalog(era), [era]);

  // Render Mini-Radar Map
  useEffect(() => {
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const scale = size / worldSize;

    ctx.fillStyle = '#050D18';
    ctx.fillRect(0, 0, size, size);

    // Nautical Grid Lines
    ctx.strokeStyle = 'rgba(23, 46, 75, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    // Islands
    for (const isl of islands) {
      ctx.fillStyle = 'rgba(18, 42, 66, 0.9)';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < isl.points.length; i++) {
        const p = isl.points[i];
        if (i === 0) ctx.moveTo(p.x * scale, p.y * scale);
        else ctx.lineTo(p.x * scale, p.y * scale);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Island Ground Installations
      for (const inst of isl.installations) {
        if (inst.isDestroyed) continue;
        const ix = inst.pos.x * scale;
        const iy = inst.pos.y * scale;
        const isFriendly = inst.side === 'player';
        const isNeutral = inst.side === 'neutral';
        const col = isFriendly ? '#00E5FF' : isNeutral ? '#F59E0B' : '#EF4444';

        ctx.fillStyle = col;
        if (inst.type === 'airfield' || inst.type === 'command_post' || inst.type === 'forward_fob') {
          ctx.fillRect(ix - 2, iy - 2, 4, 4);
        } else if (
          inst.type === 'sam_hawk' ||
          inst.type === 'sam_patriot' ||
          inst.type === 'sa2_sam_site' ||
          inst.type === 'sa3_sam_site' ||
          inst.type === 's300_sam_site' ||
          inst.type === 'fan_song_radar' ||
          inst.type === 'radar_station'
        ) {
          ctx.beginPath();
          ctx.arc(ix, iy, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (inst.type === 'towed_artillery' || inst.type === 'coastal_gun') {
          ctx.beginPath();
          ctx.arc(ix, iy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(ix - 1, iy - 1, 2, 2);
        }
      }
    }

    // Hostile Ships
    for (const ship of enemyShips) {
      if (ship.isSunk) continue;
      ctx.fillStyle = '#EF5350';
      ctx.beginPath();
      ctx.arc(ship.pos.x * scale, ship.pos.y * scale, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player Ships
    for (const ship of playerShips) {
      if (ship.isSunk) continue;
      ctx.fillStyle = ship.isFlagship ? '#00E676' : '#80D8FF';
      ctx.beginPath();
      ctx.arc(ship.pos.x * scale, ship.pos.y * scale, ship.isFlagship ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Passive Sonobuoys
    for (const buoy of sonobuoys) {
      const bx = buoy.pos.x * scale;
      const by = buoy.pos.y * scale;
      const hasContact = (buoy.contactFlashTimer ?? 0) > 0;
      ctx.strokeStyle = hasContact ? 'rgba(255, 82, 82, 0.85)' : 'rgba(38, 198, 218, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(3, buoy.detectionRadius * scale), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = hasContact ? '#FF5252' : '#26C6DA';
      ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
    }

    // Airborne Planes
    for (const p of aircraft) {
      if (p.state === 'shot_down') continue;
      ctx.fillStyle = p.side === 'player' ? '#80DEEA' : '#FF8A80';
      ctx.fillRect(p.pos.x * scale - 1, p.pos.y * scale - 1, 2, 2);
    }

    // Live Camera Viewport Box
    if (cameraViewport && cameraViewport.zoom > 0) {
      const vw = (cameraViewport.viewW / cameraViewport.zoom) * scale;
      const vh = (cameraViewport.viewH / cameraViewport.zoom) * scale;
      const vx = Math.max(0.5, Math.min(size - vw - 0.5, cameraViewport.x * scale - vw / 2));
      const vy = Math.max(0.5, Math.min(size - vh - 0.5, cameraViewport.y * scale - vh / 2));
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, Math.min(vw, size - 1), Math.min(vh, size - 1));
    }
  }, [islands, playerShips, enemyShips, aircraft, sonobuoys, worldSize, cameraViewport]);

  // Mini-Radar pointer pan helpers (supports click & drag-to-pan)
  const panMiniMapFromClient = (clientX: number, clientY: number) => {
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const worldX = (x / rect.width) * worldSize;
    const worldY = (y / rect.height) * worldSize;
    onMiniMapClick({ x: worldX, y: worldY });
  };

  const handleMiniMapPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isMiniMapDraggingRef.current = true;
    panMiniMapFromClient(e.clientX, e.clientY);
  };

  const handleMiniMapPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMiniMapDraggingRef.current) return;
    panMiniMapFromClient(e.clientX, e.clientY);
  };

  const handleMiniMapPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isMiniMapDraggingRef.current) {
      isMiniMapDraggingRef.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const era1Models: { model: AircraftModel; label: string; role: AircraftRole; desc: string }[] = [
    { model: 'f4f', label: 'F4F Wildcat', role: 'fighter', desc: '4x .50 cal · CAP Escort' },
    { model: 'sbd', label: 'SBD Dauntless', role: 'dive_bomber', desc: 'AP Bomb / Dual 500lb' },
    { model: 'tbd', label: 'TBD Devastator', role: 'torpedo_bomber', desc: 'Mk 13 Torpedo / ASW' },
    { model: 'os2u', label: 'OS2U Kingfisher', role: 'scout', desc: 'Air Recon & Spotting' },
  ];

  const era2Models: { model: AircraftModel; label: string; role: AircraftRole; desc: string }[] = [
    { model: 'f6f', label: 'F6F Hellcat', role: 'fighter', desc: '6x .50 cal · Heavy fighter' },
    { model: 'f4u', label: 'F4U Corsair', role: 'fighter', desc: 'Bent-wing speed bird' },
    { model: 'f8f', label: 'F8F Bearcat', role: 'fighter', desc: 'Climb rocket · 20mm cannons' },
    { model: 'sb2c', label: 'SB2C Helldiver', role: 'dive_bomber', desc: 'Twin 20mm + Heavy Bomb' },
    { model: 'tbf', label: 'TBF Avenger', role: 'torpedo_bomber', desc: 'Heavy naval torpedo strike' },
    { model: 'sc1', label: 'SC-1 Seahawk', role: 'scout', desc: 'High-speed Floatplane & Radar' },
  ];

  const era3Models: { model: AircraftModel; label: string; role: AircraftRole; desc: string }[] = [
    { model: 'f8f', label: 'F8F Bearcat', role: 'fighter', desc: 'Climb rocket · 4x 20mm M3' },
    { model: 'f9f', label: 'F9F Panther', role: 'fighter', desc: 'Carrier Jet · 4x 20mm Colt · HVAR' },
    { model: 'f2h', label: 'F2H Banshee', role: 'fighter', desc: 'Twin Jet Interceptor · Long Range' },
    { model: 'ad1', label: 'AD-1 Skyraider', role: 'attacker', desc: 'Tiny Tim / Napalm / 2000lb Bomb' },
    { model: 'f4u4', label: 'F4U-4 Corsair', role: 'fighter', desc: 'Late Fighter-Bomber · 4x 20mm' },
    { model: 'af_guardian', label: 'AF Guardian', role: 'torpedo_bomber', desc: 'Hunter-Killer ASW · Homing Torp' },
    { model: 'ad3w', label: 'AD-3W Skyraider', role: 'aew', desc: '6500m Radar Sentry · Global AEW' },
    { model: 'ho3s1', label: 'HO3S-1 Dragonfly', role: 'rescue', desc: 'SAR Helicopter · Pilot Rescue' },
  ];

  const era4Models: { model: AircraftModel; label: string; role: AircraftRole; desc: string }[] = [
    { model: 'f4b', label: 'F-4B Phantom II', role: 'fighter', desc: '超音速重型戰鬥機 · AIM-7麻雀/AIM-9響尾蛇' },
    { model: 'f4j', label: 'F-4J Phantom II', role: 'fighter', desc: '雷達火控升級 · 全天候空空飛彈截擊' },
    { model: 'f8', label: 'F-8 Crusader', role: 'fighter', desc: '最後的十字軍近戰機 · 4x 20mm 機砲 · 響尾蛇' },
    { model: 'a4', label: 'A-4 Skyhawk', role: 'attacker', desc: '天鷹輕型攻擊機 · 蛇眼減速航彈 / 白眼' },
    { model: 'a6a', label: 'A-6A Intruder', role: 'attacker', desc: '全天候夜戰重攻擊機 · DIANE雷達系統' },
    { model: 'a6b_weasel', label: 'A-6B Wild Weasel', role: 'attacker', desc: '防空網壓制野鼬機 · AGM-45反輻射飛彈' },
    { model: 'e1', label: 'E-1 Tracer', role: 'aew', desc: '艦載預警機 · 7500m 早期遠程警戒雷達' },
    { model: 's2', label: 'S-2 Tracker', role: 'scout', desc: '雙發艦載反潛巡邏機 · 聲納浮標與反潛魚雷' },
    { model: 'uh2', label: 'UH-2 Seasprite', role: 'rescue', desc: '艦載搜救直升機 · 自動跳傘飛行員即時打撈' },
    { model: 'sh2', label: 'SH-2 Seasprite', role: 'torpedo_bomber', desc: 'LAMPS I 艦載反潛直升機 · 聲納浮標與Mk 46魚雷' },
    { model: 'p3', label: 'P-3C Orion', role: 'torpedo_bomber', desc: '長程陸基反潛巡邏機 · MAD磁異探測儀與聲導魚雷' },
    { model: 'c1', label: 'C-1 Trader', role: 'transport', desc: '艦載突擊機 · 傘兵空投作戰' },
  ];

  const era5Models: { model: AircraftModel; label: string; role: AircraftRole; desc: string }[] = [
    { model: 'f14a', label: 'F-14A Tomcat', role: 'fighter', desc: 'AWG-9 脈衝都卜勒雷達 · AIM-54 鳳凰超長程攔截' },
    { model: 'fa18a', label: 'F/A-18A Hornet', role: 'fighter', desc: '全天候艦載多用途打擊戰鬥機 · AIM-7/9/魚叉' },
    { model: 'a6e', label: 'A-6E TRAM', role: 'attacker', desc: 'TRAM 光電夜戰打擊系統 · 鋪路雷射/魚叉/集束彈' },
    { model: 'ea6b', label: 'EA-6B Prowler', role: 'attacker', desc: 'ALQ-99 電戰干擾莢艙 · AGM-88 HARM 高速反輻射' },
    { model: 'av8b', label: 'AV-8B Harrier II', role: 'attacker', desc: '陸戰隊垂直起降攻擊機 · 近接對地支援 CAS' },
    { model: 's3a', label: 'S-3A Viking', role: 'scout', desc: '雙噴射艦載反潛機 · 聲納浮標與魚雷' },
    { model: 'e2c', label: 'E-2C Hawkeye', role: 'aew', desc: 'APS-120 圓盤預警雷達 · 8500m 全域預警' },
    { model: 'sh3f', label: 'SH-3F Sea King', role: 'torpedo_bomber', desc: '重型艦載反潛直升機 · 吊放聲納與Mk 46魚雷' },
    { model: 'ch53', label: 'CH-53D Sea Stallion', role: 'rescue', desc: '重型直升機 · 突擊部隊垂直機降與人員搜救' },
    { model: 'c2a', label: 'C-2A Greyhound', role: 'transport', desc: 'COD 艦載空運機 · 前線傘降與快速補給' },
    { model: 'a10a', label: 'A-10A Thunderbolt II', role: 'attacker', desc: '30mm GAU-8 復仇者機砲 · 幼獅小牛飛彈 (CAS王牌)' },
    { model: 'f15a', label: 'F-15A Eagle', role: 'fighter', desc: '空中優勢制空戰機 · AIM-7/AIM-9 不敗傳奇' },
    { model: 'f16a', label: 'F-16A Fighting Falcon', role: 'fighter', desc: '輕型多用途戰鬥機 · 9G 大過載格鬥與打擊' },
    { model: 'ah64a', label: 'AH-64A Apache', role: 'attacker', desc: '地獄火雷射導引反戰車飛彈 · 30mm 鏈砲' },
    { model: 'ah1w', label: 'AH-1W SuperCobra', role: 'attacker', desc: '陸戰隊雙發重武裝攻擊直升機 · 陶式/地獄火' },
    { model: 'e3a', label: 'E-3A Sentry', role: 'aew', desc: '大型旋轉雷達罩長程戰略預警機 · 全戰區破霧' },
    { model: 'f111', label: 'F-111 Aardvark', role: 'attacker', desc: '可變翼超音速地貌穿透長程重型打擊機' },
  ];

  const flightModels =
    era === 'era1'
      ? era1Models
      : era === 'era2'
      ? era2Models
      : era === 'era3'
      ? era3Models
      : era === 'era4'
      ? era4Models
      : era5Models;

  // Per-model formation count state: e.g. 1, 2, 4, or max available
  const [formationCounts, setFormationCounts] = React.useState<Partial<Record<AircraftModel, number>>>({
    f4f: 2,
    sbd: 2,
    tbd: 2,
    os2u: 1,
    f6f: 2,
    f4u: 2,
    f8f: 2,
    sb2c: 2,
    tbf: 2,
    sc1: 1,
    f9f: 2,
    f2h: 2,
    ad1: 2,
    f4u4: 2,
    af_guardian: 2,
    ad3w: 1,
    ho3s1: 1,
    f4b: 2,
    f4j: 2,
    f8: 2,
    a4: 2,
    a6a: 2,
    a6b_weasel: 1,
    e1: 1,
    s2: 2,
    uh2: 1,
    sh2: 2,
    p3: 1,
    c1: 1,
    b52: 2,
    f4e: 2,
    f105: 2,
    a7: 2,
    ov10: 2,
    uh1: 2,
    ah1: 2,
  });

  // Per-model chosen payload: defaults to role's active payload
  const [modelPayloads, setModelPayloads] = React.useState<Partial<Record<AircraftModel, AircraftPayloadType>>>({
    f4f: activePayloads.fighter,
    sbd: activePayloads.dive_bomber,
    tbd: activePayloads.torpedo_bomber,
    os2u: activePayloads.scout,
    f6f: activePayloads.fighter,
    f4u: activePayloads.fighter,
    f8f: activePayloads.fighter,
    sb2c: activePayloads.dive_bomber,
    tbf: activePayloads.torpedo_bomber,
    sc1: activePayloads.scout,
    f9f: activePayloads.fighter,
    f2h: activePayloads.fighter,
    ad1: activePayloads.attacker || 'tiny_tim_rocket',
    f4u4: activePayloads.fighter,
    af_guardian: activePayloads.torpedo_bomber || 'asw_torpedo',
    ad3w: 'clean_guns',
    ho3s1: 'clean_guns',
    f4b: 'aim7_sparrow',
    f4j: 'aim7_sparrow',
    f8: 'aim9_sidewinder',
    a4: 'bombs_snakeye_retarded',
    a6a: 'bombs_snakeye_retarded',
    a6b_weasel: 'agm45_shrike',
    e1: 'clean_guns',
    s2: 'clean_guns',
    uh2: 'clean_guns',
    sh2: 'asw_torpedo',
    p3: 'asw_torpedo',
    c1: 'c1_paratroopers',
    b52: 'b52_megaton_carpet',
    f4e: 'aim7_sparrow',
    f105: 'agm45_shrike',
    a7: 'agm62_walleye',
    ov10: 'ffar_rockets_pod',
    uh1: 'helo_assault_troops',
    ah1: 'ffar_rockets_pod',
  });

  const [openPayloadPicker, setOpenPayloadPicker] = React.useState<AircraftModel | null>(null);
  const [inspectingShipId, setInspectingShipId] = React.useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = React.useState<'flights' | 'cps'>('flights');
  const [isGuideCollapsed, setIsGuideCollapsed] = React.useState<boolean>(false);

  // Bottom Deck main tab: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | 'requisition'
  const [bottomDeckTab, setBottomDeckTab] = useState<BottomDeckMode>('carrier');
  const [isBottomDeckExpanded, setIsBottomDeckExpanded] = useState<boolean>(true);
  const [requisitionTab, setRequisitionTab] = useState<RequisitionCategory>('ground');
  const [selectedBuildIslandId, setSelectedBuildIslandId] = useState<string>('');

  // 1. 工兵部隊選中判定
  const isEngineerSelected = selectedUnits.some(
    (u) => ('type' in u) && u.type === 'usmc_engineer'
  ) || (selectedAirfacility !== null && (typeof selectedAirfacility === 'object' ? selectedAirfacility.type === 'engineer_construction' : selectedAirfacility === 'engineer_construction'));

  // 2. 營指揮所選中判定 (專屬呼叫支援選單)
  const isBattalionCpSelected = selectedAirfacility !== null && (typeof selectedAirfacility === 'object' ? selectedAirfacility.type === 'battalion_cp' : selectedAirfacility === 'battalion_cp');

  // 3. 機場選中判定 (只能打開陸基飛機選單)
  const isAirbaseSelected = !isEngineerSelected && !isBattalionCpSelected && (selectedAirfacility !== null && (typeof selectedAirfacility === 'object' ? selectedAirfacility.type === 'airbase' : selectedAirfacility === 'airbase'));

  // 4. 航母選中判定 (只能顯示從該艦起飛的飛機) - 支援 CV-6 / CV-9 / CV-34 / CV-63 / CVN-68 與 LPH-2
  const isCarrierSelected = !isEngineerSelected && !isBattalionCpSelected && !isAirbaseSelected && (selectedUnits.some(
    (u) => ('type' in u) && (u.type === 'carrier' || u.type === 'cve' || u.type === 'cv63' || u.type === 'cvn' || u.type === 'lph')
  ) || (selectedAirfacility !== null && (typeof selectedAirfacility === 'object' ? (selectedAirfacility.type === 'carrier' || selectedAirfacility.type === 'cve' || selectedAirfacility.type === 'cv63' || selectedAirfacility.type === 'lph') : selectedAirfacility === 'carrier')));

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
    (s) => !s.isSunk && (s.type === 'carrier' || s.type === 'cve' || s.type === 'cv63' || s.type === 'cvn' || s.type === 'lph')
  ) || !!flagship;
  const hasPlayerAirbase = islands.some((isl) =>
    isl.installations.some((i) => i.type === 'airfield' && i.side === 'player' && !i.isDestroyed)
  );
  const hasEngineerUnit = groundUnits.some(
    (u) => u.type === 'usmc_engineer' && u.side === 'player' && !u.isDestroyed
  );

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

  // 若在畫面上點選了工兵部隊或航空母艦，自動切換至對應選單並展開出擊列
  useEffect(() => {
    const hasEngineer = selectedUnits.some(
      (u) => ('type' in u) && u.type === 'usmc_engineer'
    );
    const hasCarrier = selectedUnits.some(
      (u) => ('type' in u) && (u.type === 'carrier' || u.type === 'cve' || u.type === 'cv63' || u.type === 'cvn' || u.type === 'lph')
    );
    if (hasEngineer) {
      setBottomDeckTab('engineer_construction');
      setIsBottomDeckExpanded(true);
    } else if (hasCarrier && (!selectedAirfacility || (typeof selectedAirfacility === 'object' && selectedAirfacility.type === 'carrier'))) {
      setBottomDeckTab('carrier');
      setIsBottomDeckExpanded(true);
    }
  }, [selectedUnits, selectedAirfacility]);

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
        setOpenPayloadPicker(null);
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
  const [afbFormationCounts, setAfbFormationCounts] = useState<Partial<Record<string, number>>>({
    b17: 2,
    b24: 2,
    b29: 2,
    p40: 2,
    p38: 2,
    p51: 2,
    p47: 2,
    f86: 2,
    a20: 2,
    a26: 2,
    f4f: 2,
    f6f: 2,
    f4u: 2,
    f9f: 2,
    f2h: 2,
    ad1: 2,
    f4u4: 2,
    af_guardian: 2,
    c47: 1,
    c1: 1,
    c2a: 1,
    c130: 1,
    ch53: 1,
    uh1: 2,
  });
  const [afbPayloads, setAfbPayloads] = useState<Partial<Record<string, AircraftPayloadType>>>({
    b17: 'bombs_carpet_250',
    b24: 'bombs_quad_500',
    b29: 'tactical_nuke',
    p40: 'clean_guns',
    p38: 'hvar_rockets',
    p51: 'clean_guns',
    p47: 'mixed_bombs_rockets',
    f86: 'clean_guns',
    a20: 'bombs_dual_500',
    a26: 'napalm_canister',
    c47: 'c1_paratroopers',
    c1: 'c1_paratroopers',
    c2a: 'c1_paratroopers',
    c130: 'c1_paratroopers',
    ch53: 'helo_assault_troops',
  });
  const [openAfbPayloadPicker, setOpenAfbPayloadPicker] = useState<string | null>(null);

  // Bottom Deck Filters & Tactical Armament Selector Tray State
  const [carrierFilter, setCarrierFilter] = useState<'all' | 'fighter' | 'dive_bomber' | 'torpedo_bomber' | 'attacker' | 'special'>('all');
  const [afbFilter, setAfbFilter] = useState<'all' | 'level_bomber' | 'fighter' | 'attacker' | 'navy'>('all');
  const [engineerTab, setEngineerTab] = useState<'all' | 'aviation' | 'air_defense' | 'naval' | 'fortification'>('all');
  const [activeArmamentTray, setActiveArmamentTray] = useState<{
    planeId: string;
    planeLabel: string;
    role: AircraftRole;
    isAirbase: boolean;
    compatiblePayloads: AircraftPayloadType[];
    currentPayload: AircraftPayloadType;
  } | null>(null);

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

  // Keep model payloads updated if activePayloads change externally
  React.useEffect(() => {
    setModelPayloads((prev) => ({
      ...prev,
      f4f: prev.f4f || activePayloads.fighter,
      f6f: prev.f6f || activePayloads.fighter,
      f4u: prev.f4u || activePayloads.fighter,
      f8f: prev.f8f || activePayloads.fighter,
      sbd: prev.sbd || activePayloads.dive_bomber,
      sb2c: prev.sb2c || activePayloads.dive_bomber,
      tbd: prev.tbd || activePayloads.torpedo_bomber,
      tbf: prev.tbf || activePayloads.torpedo_bomber,
      os2u: prev.os2u || activePayloads.scout,
    }));
  }, [activePayloads]);

  const getCompatiblePayloads = (role: AircraftRole, currentEra: Era): AircraftPayloadType[] => {
    if (role === 'fighter') {
      return currentEra === 'era5'
        ? ['aim54_phoenix', 'aim7_aim9_combo', 'rgm84_harpoon', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns', 'gbu10_laser_paveway', 'cbu_cluster_bombs']
        : currentEra === 'era4'
        ? ['tactical_b61_nuke', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns', 'blu27_napalm', 'bombs_snakeye_retarded', 'agm12_bullpup']
        : currentEra === 'era3'
        ? ['clean_guns', 'hvar_rockets', 'bomb_500', 'bomb_1000', 'napalm_canister']
        : ['clean_guns', 'hvar_rockets', 'bomb_500', 'bombs_dual_500'];
    }
    if (role === 'attacker') {
      return currentEra === 'era5'
        ? ['rgm84_harpoon', 'agm88_harm', 'gbu10_laser_paveway', 'agm65_maverick', 'cbu_cluster_bombs', 'mer_iron_bombs', 'bombs_snakeye_retarded', 'clean_guns']
        : currentEra === 'era4'
        ? ['tactical_b61_nuke', 'gbu10_laser_paveway', 'agm78_standard_arm', 'mer_iron_bombs', 'cbu_cluster_bombs', 'blu27_napalm', 'agm62_walleye', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'ffar_rockets_pod', 'bomb_2000', 'clean_guns']
        : currentEra === 'era3'
        ? ['tiny_tim_rocket', 'napalm_canister', 'bomb_2000', 'bomb_1000', 'aerial_torpedo', 'hvar_rockets']
        : ['mixed_bombs_rockets', 'hvar_rockets', 'bomb_1000', 'bombs_dual_500', 'clean_guns'];
    }
    if (role === 'dive_bomber') {
      return currentEra === 'era5' || currentEra === 'era4'
        ? ['gbu10_laser_paveway', 'cbu_cluster_bombs', 'blu27_napalm', 'mer_iron_bombs', 'bombs_snakeye_retarded', 'agm12_bullpup', 'agm62_walleye', 'bomb_2000']
        : currentEra === 'era3'
        ? ['bomb_1000', 'bomb_2000', 'bombs_dual_500']
        : currentEra === 'era2'
        ? ['bomb_1000', 'bombs_dual_500', 'bomb_1600']
        : ['bomb_1000', 'bombs_dual_500'];
    }
    if (role === 'torpedo_bomber') {
      return currentEra === 'era5'
        ? ['asw_torpedo', 'depth_bombs', 'rgm84_harpoon', 'bomb_1000']
        : currentEra === 'era4'
        ? ['asw_torpedo', 'depth_bombs', 'bomb_1000', 'gbu10_laser_paveway']
        : currentEra === 'era3'
        ? ['asw_torpedo', 'aerial_torpedo', 'depth_bombs', 'bomb_1000']
        : ['aerial_torpedo', 'bomb_1000', 'bombs_dual_500', 'depth_bombs'];
    }
    if (role === 'scout' || role === 'aew') {
      return currentEra === 'era5' || currentEra === 'era4'
        ? ['scout_fuel', 'blu27_napalm', 'ffar_rockets_pod', 'clean_guns']
        : ['scout_fuel', 'clean_guns', 'bomb_500'];
    }
    if (role === 'transport') {
      return ['c1_paratroopers', 'scout_fuel'];
    }
    if (role === 'rescue') {
      return currentEra === 'era5' || currentEra === 'era4' ? ['helo_assault_troops', 'clean_guns'] : ['clean_guns'];
    }
    return ['clean_guns', 'bomb_500'];
  };

  const getAfbCompatiblePayloads = (id: string, role: AircraftRole, currentEra: Era): AircraftPayloadType[] => {
    if (role === 'level_bomber') {
      if (id === 'b52') {
        return currentEra === 'era5'
          ? ['rgm84_harpoon', 'b52_megaton_nuke', 'b52_megaton_carpet', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000']
          : ['b52_megaton_nuke', 'b52_megaton_carpet', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000'];
      }
      if (id === 'f111') {
        return ['gbu10_laser_paveway', 'rgm84_harpoon', 'mer_iron_bombs', 'bomb_2000', 'cbu_cluster_bombs', 'clean_guns'];
      }
      if (id === 'b29') {
        return [
          'tactical_nuke',
          'bombs_carpet_250',
          'bombs_quad_500',
          'bomb_1000',
          'bombs_dual_1000',
          'bomb_2000',
          'bomb_1600',
          'bombs_dual_500',
        ];
      }
      if (id === 'b24') {
        return [
          'bombs_quad_500',
          'bombs_carpet_250',
          'bomb_1600_ap',
          'bomb_1600',
          'bombs_dual_1000',
          'bomb_1000',
          'bombs_dual_500',
        ];
      }
      return [
        'bombs_carpet_250',
        'bombs_quad_500',
        'bomb_1000',
        'bombs_dual_1000',
        'bombs_dual_500',
      ];
    }
    if (role === 'attacker') {
      if (id === 'a10a') {
        return ['agm65_maverick', 'mer_iron_bombs', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'clean_guns'];
      }
      if (id === 'ah64a') {
        return ['hellfire_missiles', 'clean_guns'];
      }
      if (id === 'ah1w') {
        return ['tow_missiles', 'aim9_sidewinder', 'clean_guns'];
      }
      if (id === 'a6e') {
        return ['rgm84_harpoon', 'gbu10_laser_paveway', 'agm65_maverick', 'mer_iron_bombs', 'cbu_cluster_bombs', 'clean_guns'];
      }
      if (id === 'ea6b') {
        return ['agm88_harm', 'clean_guns'];
      }
      if (id === 'av8b') {
        return ['agm65_maverick', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'clean_guns'];
      }
      if (id === 'f105') {
        return ['tactical_b61_nuke', 'mer_iron_bombs', 'agm78_standard_arm', 'cbu_cluster_bombs', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'bomb_2000', 'bomb_1000', 'clean_guns'];
      }
      if (id === 'a7') {
        return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'mer_iron_bombs', 'cbu_cluster_bombs', 'blu27_napalm', 'agm62_walleye', 'bombs_snakeye_retarded', 'agm12_bullpup', 'bomb_2000', 'bomb_1000', 'clean_guns'];
      }
      if (id === 'a6a' || id === 'a6b_weasel') {
        return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'agm78_standard_arm', 'mer_iron_bombs', 'cbu_cluster_bombs', 'agm62_walleye', 'agm45_shrike', 'agm12_bullpup', 'bombs_snakeye_retarded', 'bomb_2000', 'clean_guns'];
      }
      if (id === 'a4') {
        return ['tactical_b61_nuke', 'gbu10_laser_paveway', 'blu27_napalm', 'cbu_cluster_bombs', 'bombs_snakeye_retarded', 'agm12_bullpup', 'ffar_rockets_pod', 'bomb_1000', 'clean_guns'];
      }
      if (id === 'ov10') {
        return ['blu27_napalm', 'ffar_rockets_pod', 'cbu_cluster_bombs', 'clean_guns'];
      }
      if (id === 'ah1') {
        return ['ffar_rockets_pod', 'clean_guns'];
      }
      if (id === 'a26') {
        return ['napalm_canister', 'tiny_tim_rocket', 'bomb_2000', 'bomb_1000', 'bombs_quad_500', 'bombs_dual_500', 'hvar_rockets'];
      }
      if (id === 'p47') {
        return ['mixed_bombs_rockets', 'hvar_rockets', 'bombs_quad_500', 'bombs_dual_500', 'bomb_1000'];
      }
      return ['bombs_dual_500', 'bomb_1000', 'bombs_quad_500', 'hvar_rockets', 'aerial_torpedo', 'asw_depth_bombs', 'depth_bombs'];
    }
    if (role === 'fighter') {
      if (id === 'f14a') {
        return ['aim54_phoenix', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns'];
      }
      if (id === 'fa18a') {
        return ['rgm84_harpoon', 'aim7_aim9_combo', 'agm65_maverick', 'agm88_harm', 'aim9_sidewinder', 'clean_guns'];
      }
      if (id === 'f15a') {
        return ['aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'clean_guns'];
      }
      if (id === 'f16a') {
        return ['aim7_aim9_combo', 'agm65_maverick', 'gbu10_laser_paveway', 'aim9_sidewinder', 'clean_guns'];
      }
      if (id === 'f4e' || id === 'f4j' || id === 'f4b') {
        return ['tactical_b61_nuke', 'aim7_aim9_combo', 'aim7_sparrow', 'aim9_sidewinder', 'blu27_napalm', 'agm12_bullpup', 'bombs_snakeye_retarded', 'clean_guns'];
      }
      if (id === 'f8') {
        return ['aim7_aim9_combo', 'aim9_sidewinder', 'clean_guns', 'bombs_snakeye_retarded'];
      }
      if (id === 'f86') {
        return ['clean_guns', 'hvar_rockets', 'bomb_1000', 'napalm_canister'];
      }
      if (id === 'p51') {
        return ['clean_guns', 'hvar_rockets', 'bomb_500', 'bombs_dual_500'];
      }
      if (id === 'p38') {
        return ['hvar_rockets', 'clean_guns', 'bomb_1000', 'bombs_dual_500'];
      }
      return ['clean_guns', 'bomb_500', 'bombs_dual_500', 'hvar_rockets'];
    }
    if (role === 'scout' || role === 'aew') {
      if (id === 's3a') {
        return ['asw_torpedo', 'rgm84_harpoon', 'depth_bombs', 'scout_fuel', 'clean_guns'];
      }
      if (id === 'e3a' || id === 'e2c') {
        return ['scout_fuel', 'clean_guns'];
      }
      if (id === 'ov10') {
        return ['ffar_rockets_pod', 'scout_fuel', 'clean_guns'];
      }
      if (id === 'e1') {
        return ['scout_fuel', 'clean_guns'];
      }
      if (id === 's2') {
        return ['asw_torpedo', 'depth_bombs', 'scout_fuel', 'clean_guns'];
      }
      return ['scout_fuel', 'clean_guns', 'bomb_500'];
    }
    if (role === 'rescue') {
      if (id === 'sh3f') {
        return ['asw_torpedo', 'depth_bombs', 'clean_guns'];
      }
      if (id === 'uh1' || id === 'uh2') {
        return ['helo_assault_troops', 'clean_guns'];
      }
      return ['clean_guns'];
    }
    if (role === 'transport') {
      if (id === 'ch53') {
        return ['helo_assault_troops', 'c1_paratroopers', 'clean_guns'];
      }
      return ['c1_paratroopers', 'scout_fuel'];
    }
    return getCompatiblePayloads(role, currentEra);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 pb-2 z-20 select-none overflow-hidden">
      {/* Top Bar (3 Zones) */}
      <header className="shrink-0 z-30 pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg px-4 py-2 flex items-center justify-between gap-3 sm:gap-4 shadow-2xl">
        {/* Zone 1: Wordmark, Era Indicator & Language Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#80DEEA]" />
            <span className="font-mono font-bold tracking-wider text-sm text-[#E0F7FA] whitespace-nowrap">
              {t.gameTitle}
            </span>
          </div>

          <div className="h-4 w-px bg-[#1E3A5F]" />

          {/* Language Switcher Toggle */}
          <div className="flex items-center bg-[#0B1E34] border border-[#1E3A5F] rounded p-0.5 text-xs font-mono shadow-inner">
            <button
              onClick={() => onSetLang?.('zh')}
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap font-bold text-[10.5px] ${
                lang === 'zh'
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="切換繁體中文介面"
            >
              繁中
            </button>
            <button
              onClick={() => onSetLang?.('en')}
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap font-bold text-[10.5px] ${
                lang === 'en'
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title="Switch to English UI"
            >
              EN
            </button>
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
              title={t.era1Tooltip}
            >
              {t.era1}
            </button>
            <button
              onClick={() => onSetEra('era2')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era2'
                  ? 'bg-[#1976D2] text-white shadow-sm'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title={t.era2Tooltip}
            >
              {t.era2}
            </button>
            <button
              onClick={() => onSetEra('era3')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era3'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-sm border border-cyan-400/60'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title={t.era3Tooltip}
            >
              {t.era3}
            </button>
            <button
              onClick={() => onSetEra('era4')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era4'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm border border-emerald-400/60 ring-1 ring-emerald-400'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title={t.era4Tooltip}
            >
              {t.era4}
            </button>
            <button
              onClick={() => onSetEra('era5')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-bold ${
                era === 'era5'
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white shadow-sm border border-amber-300 ring-1 ring-amber-400'
                  : 'text-[#90CAF9] hover:text-white'
              }`}
              title={t.era5Tooltip}
            >
              {t.era5}
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
              title={t.pause}
            >
              {isPaused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3 fill-white" />}
              <span>{isPaused ? t.paused : t.pause}</span>
            </button>
            <button
              onClick={() => onSetGameSpeed(0.5)}
              className={`px-2 py-1 rounded transition-colors ${
                !isPaused && gameSpeed === 0.5
                  ? 'bg-[#1976D2] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t.speedSlow}
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
              title={t.speedNormal}
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
              title={t.speedFast}
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
              title={lang === 'zh' ? '3倍速戰術推進 (快捷鍵 ] )' : '3.0x Fast Forward ( ] )'}
            >
              3.0x
            </button>
          </div>

          {/* Live Objective Progress Readout */}
          <div
            className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#0B1E34] border border-[#1E3A5F] rounded text-[11px] font-mono tabular-nums whitespace-nowrap"
            title={lang === 'zh' ? '勝利條件：擊沉敵方航空母艦群並解放所有島嶼據點' : 'Victory: Sink enemy carriers & capture all strongholds'}
          >
            <span className={capturedStrongholdsCount === allStrongholds.length && allStrongholds.length > 0 ? 'text-emerald-400 font-bold' : 'text-[#FF80AB] font-bold'}>
              🏴 {capturedStrongholdsCount}/{allStrongholds.length}
            </span>
            <span className="text-slate-600">·</span>
            <span className={remainingEnemyCarriers === 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              🚢 {lang === 'zh' ? '敵航母' : 'CV'} {remainingEnemyCarriers}
            </span>
            {sonobuoys.length > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-300 font-bold">📡 {sonobuoys.length}</span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-[#1E3A5F]" />

          {/* Armament Reconfiguration Button */}
          <button
            onClick={onOpenArmament}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#1A3353] border border-[#FFD54F]/80 rounded text-xs font-mono text-[#FFD54F] font-bold transition-all shadow-sm active:scale-95"
            title={t.btnArmamentTooltip}
          >
            <Zap className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>{t.btnArmament}</span>
          </button>

          <button
            onClick={onOpenAirPrep}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#80DEEA]/50 rounded text-xs font-mono text-[#80DEEA] font-semibold transition-colors"
            title={t.btnAirPrepTooltip}
          >
            <Sliders className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>{t.btnAirPrep}</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#E0F7FA] transition-colors"
            title={t.btnMapTooltip}
          >
            <MapIcon className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>{t.btnMap}</span>
          </button>

          <button
            onClick={onOpenBriefing}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#E0F7FA] transition-colors"
            title={t.btnBriefingTooltip}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#80DEEA]" />
            <span>{t.btnBriefing}</span>
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
            title={t.btnStampTooltip}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>{activePlacementItem ? t.btnStampActive : t.btnStampInactive}</span>
          </button>

          <button
            onClick={onOpenDockyard}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-xs font-mono text-[#FFD54F] transition-colors"
            title={t.btnDockyardTooltip}
          >
            <Wrench className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>{t.btnDockyard}</span>
          </button>

          {/* Tactical Battle Log Button with count badge */}
          {onOpenBattleLog && (
            <button
              onClick={onOpenBattleLog}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#80DEEA]/70 rounded text-xs font-mono text-[#80DEEA] font-bold transition-all shadow-sm active:scale-95"
              title={t.btnBattleLogTooltip}
            >
              <ScrollText className="w-3.5 h-3.5 text-[#80DEEA]" />
              <span>{t.btnBattleLog}</span>
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
            title={isMuted ? t.unmute : t.mute}
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
            <span className="text-[#90CAF9]/70 text-[10px]">{t.airborne}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#040C16] border border-amber-500/70 rounded text-xs font-mono font-bold text-amber-300 shadow-sm" title={t.commandPoints}>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{Math.floor(resourcePoints)} CP</span>
            <span className="text-[10px] text-emerald-400 font-normal">
              (+{commandPointsPerSec.toFixed(1)}/s)
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#FFD54F]">
            <span>★</span>
            <span className="tabular-nums font-bold">{score.stars}</span>
            <span className="text-[#90CAF9]/70 text-[10px]">{t.stars}</span>
          </div>

          <div className="flex items-center gap-1 text-[#E0F7FA]">
            <span className="text-[#90CAF9]/70 text-[10px]">{t.score}</span>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.7)] scale-105 font-bold'
                      : canAfford
                      ? 'bg-[#071526] hover:bg-[#102A45] border-[#1E3A5F] text-slate-200 hover:border-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                  }`}
                  title={`${fac.nameZh} (${fac.cost} CP)\n${fac.desc}`}
                >
                  <span className="font-bold">{fac.nameZh.split(' ')[0]}</span>
                  <span className={`text-[10px] px-1 rounded font-bold ${isSelected ? 'bg-black/40 text-amber-300' : 'text-amber-400'}`}>
                    {fac.cost} CP
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[10.5px] text-slate-300 text-center pt-0.5 flex items-center justify-center gap-2">
            <span className="text-cyan-300 font-bold">👉 目前選定:【{activePlacementItem.nameZh}】</span>
            <span className="text-slate-400">在海圖任意沿岸或海面點擊【滑鼠左鍵】完成戳記</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300">按【ESC】或【滑鼠右鍵】取消退出</span>
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
            <span>👉 請在海圖任意海域點擊【滑鼠左鍵】建立 CAP 空巡核心區！</span>
            <span className="text-amber-300 font-bold">右鍵或 ESC 取消</span>
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
        {/* Left: 單位選擇列表 & Direct Orders */}
        {selectedUnits.length > 0 ? (
          <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#00E676]/60 rounded-lg p-3 w-80 text-xs font-mono space-y-2.5 shadow-xl">
            <div className="flex justify-between items-center text-[#00E676] font-bold border-b border-[#1E3A5F] pb-1">
              <span>{lang === 'zh' ? '單位選擇列表' : 'SELECTED UNITS'} ({selectedUnits.length})</span>
              <span className="text-[10px] text-slate-400">{lang === 'zh' ? '右鍵指派移動 / 攻擊' : 'R-Click to Move / Attack'}</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {selectedUnits.slice(0, 6).map((u) => {
                const hpPct = Math.max(0, u.health / u.maxHealth);
                const isPlane = 'flightName' in u || 'role' in u;
                const isGround = 'type' in u && !isPlane && !('wakePoints' in u);
                const isShip = 'type' in u && !isPlane && !isGround;
                const isTransport = isShip && (u.type === 'lcvp' || u.type === 'lst' || u.type === 'lcm8' || u.type === 'lpd' || u.type === 'lcac');
                const isLSMR = isShip && u.type === 'lsm_r';
                const planeName = u.name;
                const parentFlight = 'flightName' in u ? u.flightName : undefined;

                return (
                  <div key={u.id} className="bg-[#040C16] p-1.5 rounded border border-[#1E3A5F]/60 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <div>
                        <div className="font-semibold text-white truncate max-w-[165px] flex items-center gap-1">
                          {isPlane && <Plane className="w-3 h-3 text-[#80DEEA]" />}
                          {isShip && <Anchor className="w-3 h-3 text-[#80D8FF]" />}
                          {isGround && <Shield className="w-3 h-3 text-[#42A5F5]" />}
                          <span title={planeName}>{planeName}</span>
                        </div>
                        <div className="text-[9.5px] text-[#90CAF9] truncate max-w-[165px]">
                          {isPlane && parentFlight && (
                            <span className="text-slate-400 mr-1">[{parentFlight.split('(')[0].trim()}]</span>
                          )}
                          {isGround
                            ? 'embarkedInShipId' in u && u.embarkedInShipId
                              ? (lang === 'zh' ? '⚓ 已裝載於登陸艦艇' : '⚓ Embarked in Transport')
                              : (lang === 'zh' ? '🎖️ 地面戰鬥展開中' : '🎖️ Ground Combat Deployed')
                            : 'order' in u
                            ? u.order.type === 'patrol'
                              ? (lang === 'zh' ? '巡邏中 (PATROL)' : 'PATROL')
                              : u.order.type === 'attack'
                              ? (lang === 'zh' ? '攻擊中 (ATTACK)' : 'ATTACK')
                              : u.order.type === 'rtb'
                              ? (lang === 'zh' ? '返航中 (RTB)' : 'RTB')
                              : u.order.type === 'move'
                              ? (lang === 'zh' ? '移動中 (MOVING)' : 'MOVING')
                              : (lang === 'zh' ? '待命 (IDLE)' : 'IDLE')
                            : (lang === 'zh' ? '戰鬥就緒' : 'COMBAT READY')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="tabular-nums text-emerald-400 font-bold">{Math.round(hpPct * 100)}%</div>
                        <div className="w-14 h-1 bg-[#1E3A5F] rounded overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-400" style={{ width: `${hpPct * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Ground Unit Dual Parameters (組織度 ORG & 建制度 STR) & Supply Line Status */}
                    {isGround && (
                      <div className="text-[9.5px] pt-1 border-t border-[#1E3A5F]/40 space-y-1">
                        {/* Dual Parameters Gauges */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                          <div className="bg-[#071322] p-1 rounded border border-[#1E3A5F]/50">
                            <div className="flex justify-between items-center text-emerald-400 font-bold mb-0.5">
                              <span>{lang === 'zh' ? '士氣組織度 (ORG)' : 'Organization (ORG)'}</span>
                              <span>{'organization' in u ? Math.round(u.organization ?? 100) : 100}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#1E3A5F] rounded overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 transition-all"
                                style={{ width: `${Math.min(100, 'organization' in u ? (u.organization ?? 100) : 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="bg-[#071322] p-1 rounded border border-[#1E3A5F]/50">
                            <div className="flex justify-between items-center text-[#00E5FF] font-bold mb-0.5">
                              <span>{lang === 'zh' ? '編裝建制度 (STR)' : 'Strength (STR)'}</span>
                              <span>{'strength' in u ? Math.round(u.strength ?? 100) : 100}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#1E3A5F] rounded overflow-hidden">
                              <div
                                className="h-full bg-[#00E5FF] transition-all"
                                style={{ width: `${Math.min(100, 'strength' in u ? (u.strength ?? 100) : 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dual-Mode Artillery Badge */}
                        {'isArtillery' in u && u.isArtillery && (
                          <div className="flex items-center justify-between text-[8.5px] px-1 py-0.5 bg-amber-950/40 border border-amber-600/40 rounded text-amber-300 font-mono">
                            <span>{lang === 'zh' ? '砲兵模式: 直瞄平射(<700m) / 曲射壓制(≥700m)' : 'Dual Artillery: Direct (<700m) / Arc (≥700m)'}</span>
                            <span className="font-bold text-amber-200">
                              {u.artilleryMode === 'direct_fire' ? (lang === 'zh' ? '【直瞄平射】' : 'DIRECT') : (lang === 'zh' ? '【長程曲射】' : 'BOMBARD')}
                            </span>
                          </div>
                        )}

                        {/* Supply Line Status Badge */}
                        <div className="flex justify-between items-center text-[9px]">
                          {'isSupplied' in u && u.isSupplied ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span>{lang === 'zh' ? '🟢 全島補給線暢通 (港口/樞紐連通)' : '🟢 Island Supply Line Intact (Port/Hub)'}</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <span>{lang === 'zh' ? '🔴 補給線斷絕 (士氣持續衰減)' : '🔴 Supply Line Severed (Morale Decaying)'}</span>
                            </span>
                          )}
                          <span className="text-amber-300 font-bold">{lang === 'zh' ? `DMG:${'damage' in u ? u.damage : 0} · 射程:${'range' in u ? u.range : 0}m` : `DMG:${'damage' in u ? u.damage : 0} · RNG:${'range' in u ? u.range : 0}m`}</span>
                        </div>
                      </div>
                    )}

                    {/* Combat Engineer Airfield & Field Construction Buttons */}
                    {isGround && 'type' in u && u.type === 'usmc_engineer' && (
                      <div className="pt-1 border-t border-[#1E3A5F]/40 flex flex-col gap-1">
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-[9.5px] text-[#80D8FF] font-semibold">
                            {'embarkedInShipId' in u && u.embarkedInShipId
                              ? (lang === 'zh' ? '在登陸艇內 (需先搶灘)' : 'Embarked (Need Landing)')
                              : (lang === 'zh' ? '工兵戰地急造工程' : 'Combat Field Engineering')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBottomDeckTab('engineer_construction');
                              setIsBottomDeckExpanded(true);
                            }}
                            className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-amber-600 hover:bg-amber-500 text-white border border-amber-300 transition-colors shadow-sm flex items-center gap-1"
                            title={lang === 'zh' ? "打開工兵建造選單 (前進機場/岸防砲/急造設施/營指揮所/雷達)" : "Open Engineer Construction Menu"}
                          >
                            <span>{t.btnOpenBuildMenu}</span>
                          </button>
                        </div>
                        <div className="flex justify-end items-center gap-1">
                          <button
                            type="button"
                            disabled={'embarkedInShipId' in u && Boolean(u.embarkedInShipId)}
                            onClick={() => onBuildAirfield?.(u.id)}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-colors shadow-sm ${
                              !('embarkedInShipId' in u && u.embarkedInShipId)
                                ? 'bg-[#1565C0] hover:bg-[#1976D2] text-white border-[#42A5F5]'
                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            }`}
                            title={lang === 'zh' ? "在當前島嶼建立全新前進航空基地與防空砲" : "Construct forward airbase and AA artillery on this island"}
                          >
                            🔨 {lang === 'zh' ? '就地闢建機場' : 'Build Airfield Here'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Transport Craft Embark / Disembark Action Button */}
                    {isTransport && (
                      <div className="pt-1 border-t border-[#1E3A5F]/40 flex justify-between items-center gap-1">
                        <span className="text-[9.5px] text-[#A7FFEB]">
                          {'embarkedUnitIds' in u && u.embarkedUnitIds && u.embarkedUnitIds.length > 0
                            ? (lang === 'zh'
                                ? `載運部隊: ${u.embarkedUnitIds.length}/${'cargoCapacity' in u ? u.cargoCapacity : 2}`
                                : `Troops: ${u.embarkedUnitIds.length}/${'cargoCapacity' in u ? u.cargoCapacity : 2}`)
                            : (lang === 'zh'
                                ? `空載 (容量: ${'cargoCapacity' in u ? u.cargoCapacity : 2})`
                                : `Empty (Cap: ${'cargoCapacity' in u ? u.cargoCapacity : 2})`)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleTransportEmbark?.(u.id)}
                          className="px-2 py-0.5 bg-[#00695C] hover:bg-[#00897B] text-white text-[9.5px] font-bold rounded border border-[#80CBC4] transition-colors"
                        >
                          ⚓ {lang === 'zh' ? '裝載/搶灘' : 'Embark/Landing'}
                        </button>
                      </div>
                    )}

                    {/* LSM(R) Rocket Barrage Button */}
                    {isLSMR && (
                      <div className="pt-1 border-t border-[#1E3A5F]/40 flex justify-between items-center gap-1">
                        <span className="text-[9.5px] text-[#FFE082]">
                          {lang === 'zh' ? '85聯裝連續火箭彈幕' : '85-Tube Rocket Barrage'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onTriggerLSMRocket?.(u.id)}
                          disabled={'rocketCooldown' in u && (u.rocketCooldown || 0) > 0}
                          className={`px-2 py-0.5 text-[9.5px] font-bold rounded border transition-colors ${
                            'rocketCooldown' in u && (u.rocketCooldown || 0) <= 0
                              ? 'bg-[#E64A19] hover:bg-[#FF5722] text-white border-[#FFAB91]'
                              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          🚀 {'rocketCooldown' in u && (u.rocketCooldown || 0) > 0 ? `${Math.ceil(u.rocketCooldown!)}s` : (lang === 'zh' ? '發射火箭' : 'Fire Rockets')}
                        </button>
                      </div>
                    )}

                    {/* 下面殘存彈藥判定 (戰鬥機計算機槍殘彈數量，轟炸機計算航彈/魚雷與自衛機槍，運輸機可隨時卸載空降) */}
                    {isPlane && (
                      <div className="text-[10px] pt-0.5 border-t border-[#1E3A5F]/40 space-y-1">
                        <div className="flex justify-between items-center">
                          {'role' in u && u.role === 'fighter' && (!('hasPayload' in u) || !u.hasPayload || u.payloadType === 'clean_guns') ? (
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <span>💥 {lang === 'zh' ? '機槍殘彈:' : 'MG Ammo:'}</span>
                              <span className="tabular-nums">
                                {('gunAmmo' in u ? u.gunAmmo : u.ammoRemaining) ?? 1440} / {('maxGunAmmo' in u ? u.maxGunAmmo : u.maxAmmo) ?? 1440} {lang === 'zh' ? '發' : 'rds'}
                              </span>
                            </span>
                          ) : 'hasPayload' in u && u.hasPayload && (u.ammoRemaining ?? 0) > 0 ? (
                            <div className="flex justify-between items-center w-full">
                              <span className="text-amber-300 font-bold flex items-center gap-1">
                                <span>{(u.payloadType === 'c1_paratroopers' || u.payloadType === 'helo_assault_troops') ? '🪂' : '💥'} {lang === 'zh' ? ((u.payloadType === 'c1_paratroopers' || u.payloadType === 'helo_assault_troops') ? '空降編制:' : '航彈/火箭:') : 'Payload:'}</span>
                                <span>[{u.payloadName}] x{u.ammoRemaining}</span>
                              </span>
                              {'gunAmmo' in u && u.gunAmmo !== undefined && u.gunAmmo > 0 && (
                                <span className="text-emerald-400 font-bold tabular-nums text-[9px]">
                                  {lang === 'zh' ? '機槍' : 'MG'}:{u.gunAmmo}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center w-full text-slate-400">
                              <span>⚠️ {lang === 'zh' ? '彈藥/兵員已投罄 (返航補給中)' : 'Payload Expended (RTB Supply)'}</span>
                              {'gunAmmo' in u && u.gunAmmo !== undefined && u.gunAmmo > 0 && (
                                <span className="text-slate-400 tabular-nums text-[9px]">
                                  {lang === 'zh' ? '機槍' : 'MG'}:{u.gunAmmo}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {'maxSonobuoyAmmo' in u && (u.maxSonobuoyAmmo ?? 0) > 0 && (
                          <div className="flex justify-between items-center text-[10px] text-[#80DEEA]">
                            <span className="truncate">
                              📡 {u.sonobuoyModel || (lang === 'zh' ? '被動聲納浮標' : 'Passive Sonobuoys')}
                            </span>
                            <span className="font-bold tabular-nums shrink-0 ml-2">
                              {u.sonobuoyAmmo ?? 0} / {u.maxSonobuoyAmmo}
                            </span>
                          </div>
                        )}
                        {'hasPayload' in u &&
                          u.hasPayload &&
                          (u.ammoRemaining ?? 0) > 0 &&
                          (u.payloadType === 'c1_paratroopers' || u.payloadType === 'helo_assault_troops') && (
                            <button
                              type="button"
                              onClick={() => onUnloadAircraft?.()}
                              className="w-full py-1 px-2 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#00897B] hover:to-[#00ACC1] text-white font-bold text-[10px] rounded border border-[#80CBC4] shadow flex items-center justify-center gap-1 transition-all"
                              title={lang === 'zh' ? '於所在島嶼（或最近海岸）立即卸載傘兵/機降部隊 (快捷鍵 U)' : 'Airdrop / Unload troops onto nearest island (Hotkey U)'}
                            >
                              <span>🪂 {lang === 'zh' ? '立即卸載 / 空降部隊 (U)' : 'Unload / Airdrop Troops (U)'}</span>
                            </button>
                          )}
                      </div>
                    )}
                    {isShip && !isTransport && !isLSMR && 'detailedArmaments' in u && u.detailedArmaments && (
                      <div className="text-[9.5px] pt-0.5 border-t border-[#1E3A5F]/40 text-slate-400 truncate">
                        <span>{lang === 'zh' ? '武裝' : 'Armament'}: {u.detailedArmaments.slice(0, 2).map((a) => a.name).join(' · ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedUnits.length > 6 && (
                <div className="text-[10px] text-slate-400 text-center">
                  +{selectedUnits.length - 6} {lang === 'zh' ? '個其他單位' : 'other units'}
                </div>
              )}
            </div>

            {/* RTS Action Command Buttons including Full Stop */}
            <div className="grid grid-cols-4 gap-1 pt-1 border-t border-[#1E3A5F]">
              <button
                onClick={() => onOrderSelected('patrol')}
                className="py-1 bg-[#0B1E34] hover:bg-[#1976D2] border border-[#1E3A5F] rounded text-[10px] text-[#E0F7FA] font-bold"
              >
                {t.orderPatrol} (P)
              </button>
              <button
                onClick={() => onOrderSelected('rtb')}
                className="py-1 bg-[#0B1E34] hover:bg-[#C2185B] border border-[#1E3A5F] rounded text-[10px] text-[#FF80AB] font-bold"
              >
                {t.orderRtb} (B)
              </button>
              <button
                onClick={onStopUnits}
                className="py-1 bg-[#D32F2F] hover:bg-[#B71C1C] border border-[#FF8A80] rounded text-[10px] text-white font-bold"
                title={t.orderStop}
              >
                {t.orderStop} (X)
              </button>
              <button
                onClick={() => onOrderSelected('idle')}
                className="py-1 bg-[#0B1E34] hover:bg-slate-700 border border-[#1E3A5F] rounded text-[10px] text-slate-300 font-bold"
              >
                {lang === 'zh' ? '待命' : 'Idle'}
              </button>
            </div>

            {selectedUnits.some(
              (u) =>
                ('flightName' in u || 'role' in u) &&
                'hasPayload' in u &&
                u.hasPayload &&
                (u.ammoRemaining ?? 0) > 0 &&
                (u.payloadType === 'c1_paratroopers' || u.payloadType === 'helo_assault_troops')
            ) && (
              <div className="pt-1 border-t border-[#1E3A5F]/60">
                <button
                  type="button"
                  onClick={() => onUnloadAircraft?.()}
                  className="w-full py-1.5 px-2 rounded text-xs font-mono font-bold bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#00897B] hover:to-[#00ACC1] text-white border border-[#80CBC4] flex items-center justify-center gap-1.5 shadow-md transition-all"
                  title={lang === 'zh' ? '對所有選中的運輸機/突擊直升機下達空降卸載指令 (也可直接右鍵點擊任一島嶼)' : 'Drop paratroopers/air-assault troops onto nearest island (Hotkey U)'}
                >
                  <span>🪂 {lang === 'zh' ? '卸載空降傘兵 / 機降突擊部隊 (U)' : 'Unload / Airdrop Troops (U)'}</span>
                </button>
              </div>
            )}

            {/* CAP 空中戰鬥巡邏專屬指令按鈕 */}
            <div className="pt-1 border-t border-[#1E3A5F]/60">
              <button
                type="button"
                onClick={() => {
                  if (isDesignatingCap) {
                    onCancelCap?.();
                  } else {
                    onStartCapDesignation?.();
                  }
                }}
                className={`w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap ${
                  isDesignatingCap
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300 ring-2 ring-cyan-400'
                    : 'bg-gradient-to-r from-[#00838F] to-[#006064] hover:from-[#0097A7] hover:to-[#00838F] text-[#E0F7FA] border border-[#4DD0E1]/70'
                }`}
                title={t.orderCapOrbitHint}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-200" />
                <span>{isDesignatingCap ? (lang === 'zh' ? '⚡ 正在指定空巡空域 (點地圖)' : '⚡ Designating CAP (Click Map)') : t.orderCapOrbit}</span>
              </button>
            </div>

            {/* Era 3-5 空投被動聲納浮標 ("插眼") 專屬按鈕 */}
            {selectedUnits.some(
              (u) =>
                'model' in u &&
                ('maxSonobuoyAmmo' in u ||
                  u.role === 'scout' ||
                  u.role === 'rescue' ||
                  u.model === 'af_guardian' ||
                  u.model === 'firefly_as5' ||
                  u.model === 'ho3s1' ||
                  u.model === 's2' ||
                  u.model === 'p3' ||
                  u.model === 'sh2' ||
                  u.model === 'uh2' ||
                  u.model === 's3a' ||
                  u.model === 'sh3f')
            ) && (() => {
              const isLegacyEra = era === 'era1' || era === 'era2';
              const hasBuoyAmmo = selectedUnits.some((u) => 'sonobuoyAmmo' in u && (u.sonobuoyAmmo ?? 0) > 0);
              const disabled = isLegacyEra || !hasBuoyAmmo;
              return (
                <div className="pt-1 border-t border-[#1E3A5F]/60">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      if (isDesignatingSonobuoy) {
                        onCancelSonobuoy?.();
                      } else {
                        onStartSonobuoyDesignation?.();
                      }
                    }}
                    className={`w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap ${
                      disabled
                        ? 'bg-slate-800/70 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : isDesignatingSonobuoy
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border border-cyan-200 ring-2 ring-cyan-400'
                        : 'bg-gradient-to-r from-[#00695C] to-[#004D40] hover:from-[#00897B] hover:to-[#00695C] text-[#E0F2F1] border border-[#4DB6AC]/70'
                    }`}
                    title={
                      isLegacyEra
                        ? lang === 'zh'
                          ? '二戰時期（時代一～二）尚無空投被動聲納浮標'
                          : 'Passive air-dropped sonobuoys require Era 3+'
                        : t.orderDropSonobuoyHint
                    }
                  >
                    <Radio className="w-3.5 h-3.5 text-teal-200 shrink-0" />
                    <span>
                      {isLegacyEra
                        ? lang === 'zh'
                          ? '📡 被動聲納浮標 (ERA 3+ 解鎖)'
                          : '📡 Sonobuoys (Era 3+)'
                        : !hasBuoyAmmo
                        ? lang === 'zh'
                          ? '📡 聲納浮標已耗盡'
                          : '📡 Sonobuoys Expended'
                        : isDesignatingSonobuoy
                        ? t.cancelSonobuoy
                        : t.orderDropSonobuoy}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        ) : isGuideCollapsed ? (
          /* Minimized Tactical Controls Guide */
          <div
            onClick={() => setIsGuideCollapsed(false)}
            className="pointer-events-auto bg-[#071322]/85 backdrop-blur-md border border-[#1E3A5F] hover:border-[#80DEEA]/60 rounded-lg px-2.5 py-1.5 text-xs font-mono shadow-lg flex items-center justify-between gap-2.5 cursor-pointer transition-all"
            title={lang === 'zh' ? '點擊展開操作指南' : 'Click to expand controls guide'}
          >
            <div className="text-[#80DEEA] font-bold flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
              <span>{lang === 'zh' ? '戰術操作指南' : 'Controls Guide'}</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {lang === 'zh' ? '展開 ➕' : 'Expand ➕'}
            </span>
          </div>
        ) : (
          /* Camera Movement Guide / Controls Help Banner when no unit is selected */
          <div className="pointer-events-auto bg-[#071322]/85 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-3 w-72 text-xs font-mono space-y-1.5 shadow-lg">
            <div className="text-[#80DEEA] font-bold flex items-center justify-between border-b border-[#1E3A5F] pb-1">
              <span>{lang === 'zh' ? '戰術視角與移動操作指南' : 'Tactical Controls Guide'}</span>
              <button
                type="button"
                onClick={() => setIsGuideCollapsed(true)}
                className="text-[10px] text-slate-400 hover:text-white bg-[#0A1E35] hover:bg-[#1E3A5F] px-1.5 py-0.5 rounded border border-[#1E3A5F] transition-all cursor-pointer"
                title={lang === 'zh' ? '縮小指南' : 'Collapse guide'}
              >
                {lang === 'zh' ? '收合 ➖' : 'Collapse ➖'}
              </button>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '平移畫面：' : 'Pan Camera:'}</span>
                <span className="font-semibold text-white">WASD / Arrows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '拖曳鏡頭：' : 'Drag Pan:'}</span>
                <span className="font-semibold text-white">{lang === 'zh' ? '滑鼠中鍵 / 邊緣游標' : 'Middle Click / Edge'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '縮放視角：' : 'Zoom View:'}</span>
                <span className="font-semibold text-white">{lang === 'zh' ? '滑鼠滾輪 (Wheel)' : 'Mouse Wheel'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '鏡頭鎖定航母：' : 'Lock Flagship:'}</span>
                <span className="font-semibold text-[#80DEEA]">F key</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '框選單位：' : 'Select Units:'}</span>
                <span className="font-semibold text-white">{lang === 'zh' ? '滑鼠左鍵拉框' : 'Left Click Drag'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '移動 / 攻擊：' : 'Move / Attack:'}</span>
                <span className="font-semibold text-[#00E676]">{lang === 'zh' ? '滑鼠右鍵點擊' : 'Right Click'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '暫停 / 倍速：' : 'Pause / Speed:'}</span>
                <span className="font-semibold text-white">Backspace · [ / ]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '編隊設定 / 呼叫：' : 'Squad Groups:'}</span>
                <span className="font-semibold text-[#FFD54F]">Ctrl+1~4 / 1~4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? 'CAP 空巡 / 浮標：' : 'CAP / Sonobuoy:'}</span>
                <span className="font-semibold text-cyan-300">C / G (Shift連點)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '傘降卸載 / 防空：' : 'Unload / Flak:'}</span>
                <span className="font-semibold text-amber-300">U / Space</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#90CAF9]">{lang === 'zh' ? '全速停俥：' : 'Full Stop:'}</span>
                <span className="font-semibold text-red-400">X key</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Corner Mini-Radar Scope + 飛行單位/戰艦狀態欄 (Tab切換，保證不遮擋下方甲板) */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Interactive Mini-Radar Widget (Click to Jump Camera) */}
          <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-1.5 shadow-2xl flex flex-col items-center">
            <div className="w-full flex justify-between text-[10px] font-mono text-[#80DEEA] pb-0.5 border-b border-[#1E3A5F]">
              <span>{t.miniMapTitle}</span>
              <span className="text-slate-400 text-[9px]">{lang === 'zh' ? '點擊 / 拖曳跳轉' : 'Click / Drag Pan'}</span>
            </div>
            <div className="relative mt-0.5">
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-cyan-300 font-bold pointer-events-none drop-shadow">N</span>
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 pointer-events-none">S</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">W</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">E</span>
              <canvas
                ref={miniMapCanvasRef}
                width={124}
                height={124}
                onPointerDown={handleMiniMapPointerDown}
                onPointerMove={handleMiniMapPointerMove}
                onPointerUp={handleMiniMapPointerUp}
                onPointerCancel={handleMiniMapPointerUp}
                className="w-[124px] h-[124px] cursor-pointer rounded bg-[#040C16] border border-[#1E3A5F]/50 touch-none"
              />
            </div>
          </div>

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
              <span>{lang === 'zh' ? '機隊' : 'Flights'}({playerFlights.length})</span>
            </button>
            <button
              onClick={() => setRightPanelTab('cps')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 font-bold transition-all ${
                rightPanelTab === 'cps'
                  ? 'bg-[#C2185B] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'zh' ? "島嶼多據點指揮所與守軍狀況" : "Island Command Posts and Garrison status"}
            >
              <Flag className="w-3 h-3 text-[#FF80AB]" />
              <span>{lang === 'zh' ? '據點' : 'CPs'}({capturedStrongholdsCount}/{allStrongholds.length})</span>
            </button>
          </div>

          {/* 島嶼據點 (COMMAND POSTS) 狀態欄 */}
          {rightPanelTab === 'cps' && (
            <div className="pointer-events-auto bg-[#071322]/95 backdrop-blur-md border border-[#C2185B] rounded-lg p-2.5 w-76 text-xs font-mono space-y-2.5 shadow-xl max-h-72 overflow-y-auto">
              {/* Header */}
              <div className="border-b border-[#1E3A5F] pb-1.5 flex justify-between items-center text-[#FF80AB] font-bold">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Flag className="w-3.5 h-3.5 text-[#FF80AB]" />
                  <span>{lang === 'zh' ? '島嶼作戰據點 (CP)' : 'Island Strongholds (CP)'}</span>
                </span>
                <span className="text-[9.5px] px-1.5 py-0.2 bg-[#880E4F] text-[#F8BBD0] rounded font-bold">
                  {lang === 'zh' ? '收復:' : 'Captured:'} {capturedStrongholdsCount}/{allStrongholds.length}
                </span>
              </div>

              <div className="text-[9.5px] text-slate-400">
                {lang === 'zh' ? '部隊進入 380m 據點圈肅清守軍 · 點擊直接跳轉視角' : 'Enter 380m radius to eliminate garrisons · Click to focus camera'}
              </div>

              {/* Stronghold Cards */}
              <div className="space-y-1.5">
                {allStrongholds.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-2 text-center">{lang === 'zh' ? '本海域暫無據點' : 'No strongholds in this sector'}</div>
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
                        title={lang === 'zh' ? "點擊跳轉視角至此據點" : "Click to center camera on stronghold"}
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
                              ? (lang === 'zh' ? '已收復 100%' : 'Captured 100%')
                              : isContested
                              ? `${lang === 'zh' ? '交戰中' : 'Contested'} ${Math.round(sh.captureProgress)}%`
                              : `${lang === 'zh' ? '守軍:' : 'Garrison:'} ${sh.garrisonIds.length}${lang === 'zh' ? '員' : ''}`}
                          </span>
                        </div>

                        {/* Location and friendly troops */}
                        <div className="flex justify-between items-center text-[9px] text-slate-300">
                          <span className="text-slate-400">{lang === 'zh' ? '所屬:' : 'Island:'} {sh.islandName}</span>
                          <span className={friendlyInZone.length > 0 ? 'text-[#80DEEA] font-bold' : 'text-slate-500'}>
                            {lang === 'zh' ? '圈內友軍:' : 'Allies in Zone:'} {friendlyInZone.length} {lang === 'zh' ? '隊' : 'units'}
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
                            <span>⚠️ {lang === 'zh' ? '敵地下坑道伏擊部隊已湧出' : 'Enemy underground tunnel ambushes emerging!'}</span>
                          </div>
                        )}
                        {sh.hasTriggeredBanzai && (
                          <div className="text-[8.5px] text-red-400 font-bold flex items-center gap-1">
                            <span>🔥 {lang === 'zh' ? '敵軍正發動決死萬歲衝鋒 (Banzai Charge)!' : 'Enemy launching desperate Banzai Charge!'}</span>
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
                  <span>{lang === 'zh' ? '飛行中隊欄 (FLIGHTS)' : 'Air Squadrons (FLIGHTS)'}</span>
                </span>
                <span className="tabular-nums font-bold text-emerald-400 text-[10px]">
                  {playerFlights.length} {lang === 'zh' ? '機隊在空' : 'Airborne'}
                </span>
              </div>

              {playerFlights.length === 0 ? (
                <div className="text-[10px] text-slate-500 py-1 text-center">
                  {lang === 'zh' ? '暫無在空飛行中隊 · 可在下方甲板出擊' : 'No active air squadrons · Launch sorties from carrier deck below'}
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1">
                  {playerFlights.map((flight) => {
                    const hpPct = Math.max(0, flight.health / Math.max(1, flight.maxHealth));
                    const stateLabel =
                      flight.state === 'patrolling'
                        ? (lang === 'zh' ? '巡邏 PATROL' : 'PATROL')
                        : flight.state === 'attacking'
                        ? (lang === 'zh' ? '空襲 ATTACK' : 'ATTACK')
                        : flight.state === 'diving'
                        ? (lang === 'zh' ? '俯衝 DIVING' : 'DIVING')
                        : flight.state === 'returning'
                        ? (lang === 'zh' ? '返航 RTB' : 'RTB')
                        : (lang === 'zh' ? '飛行 CRUISING' : 'CRUISING');

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
                        title={lang === 'zh' ? "點擊選取此中隊並鎖定鏡頭" : "Click to select squadron and focus camera"}
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
                            {flight.planes.length} {lang === 'zh' ? '架/編隊' : 'planes/flt'}
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
                              <span>💥 {lang === 'zh' ? '機槍殘彈:' : 'MG Ammo:'}</span>
                              <span className="text-[#FFE082] tabular-nums">{flight.totalGunAmmo} {lang === 'zh' ? '發' : 'rds'}</span>
                            </span>
                          ) : flight.hasPayload && flight.ammoRemaining > 0 ? (
                            <span className="text-amber-300 font-bold flex items-center gap-1 truncate">
                              <span>💥 {lang === 'zh' ? '航彈:' : 'Bombs:'}</span>
                              <span className="text-[#FFE082]">[{flight.payloadName}] x{flight.ammoRemaining}</span>
                              <span className="text-emerald-400 text-[8.5px]">· MG:{flight.totalGunAmmo}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <span>⚠️ {lang === 'zh' ? '彈藥已投罄 (返航中)' : 'Payload Expended (RTB)'}</span>
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
                              title={lang === 'zh' ? "指派此戰鬥機編隊進行指定區域 CAP 戰鬥空巡" : "Order fighter squadron into Combat Air Patrol (CAP) orbit"}
                            >
                              <Shield className="w-2.5 h-2.5 text-cyan-300" />
                              <span>{lang === 'zh' ? '設定 CAP 空巡 (C)' : 'Set CAP Orbit (C)'}</span>
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
            title={lang === 'zh' ? "點擊打開完整作戰日誌與戰果統計" : "Click to open full Combat Log & Casualty Statistics"}
          >
            <div className="flex items-center justify-between text-[10px] text-[#90CAF9] font-mono border-b border-[#1E3A5F]/70 pb-0.5">
              <span className="flex items-center gap-1.5 font-bold text-[#80DEEA]">
                <ScrollText className="w-3 h-3 text-[#80DEEA]" />
                <span>{lang === 'zh' ? '最新即時戰報 (LIVE BATTLE FEED)' : 'Live Battle Feed'}</span>
              </span>
              <span className="text-[9.5px] text-slate-400 group-hover:text-white transition-colors">
                {lang === 'zh' ? '展開完整戰報' : 'Expand Full Log'} ({combatLogs.length}) ➔
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
                {lang === 'zh' ? '【戰術推演暫停中】' : '【TACTICAL PAUSE】'}
              </span>
              <span className="text-slate-300 text-[11px]">
                {lang === 'zh'
                  ? '可在下方飛行甲板自由設定「幾機編隊」與「更換掛載」，配置完成後隨時開戰！'
                  : 'Configure flight formations and payloads on the deck below, then resume to commence combat!'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePause}
                className="px-3 py-1 bg-[#00E676] hover:bg-[#00C853] text-[#06101E] font-bold rounded flex items-center gap-1.5 text-xs shadow-lg transition-transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'zh' ? '進入戰鬥 · 開始推演 (SPACE)' : 'Commence Battle · Play (SPACE)'}</span>
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
                  ⚓ {lang === 'zh' ? '航母甲板' : 'Carrier'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setBottomDeckTab('airbase'); setIsBottomDeckExpanded(true); }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                  bottomDeckTab === 'airbase' ? 'bg-[#00695C] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✈️ {lang === 'zh' ? '航空站' : 'AFB'}
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
                <span>🎖️ {lang === 'zh' ? '營指揮所' : 'Battalion CP'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setBottomDeckTab('engineer_construction'); setIsBottomDeckExpanded(true); }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold transition-all ${
                  bottomDeckTab === 'engineer_construction' ? 'bg-amber-600 text-white shadow' : 'text-amber-300 hover:text-white'
                }`}
              >
                🏗️ {lang === 'zh' ? '工兵建造' : 'Engineer'}
              </button>
            </div>
            <span
              onClick={() => setIsBottomDeckExpanded(true)}
              className="text-[10px] text-amber-300 font-bold bg-[#0D2235] px-2 py-0.5 rounded-full border border-amber-500/30"
            >
              {lang === 'zh' ? '展開 ▲' : 'Open ▲'}
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
                    <span>{lang === 'zh' ? '⚓ 航母甲板' : 'Carrier Deck'}</span>
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
                  <span>{lang === 'zh' ? '✈️ 陸基航空站' : 'Forward AFB'}</span>
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
                  <span>{lang === 'zh' ? '🎖️ 營指揮所 (呼叫支援)' : 'Battalion CP (Support)'}</span>
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
                  <span>{lang === 'zh' ? '🏗️ 工兵急造' : 'Seabees Engr'}</span>
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
                    title={lang === 'zh' ? '地圖鏡頭移至營指揮所所在位置' : 'Focus camera on Battalion CP'}
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="hidden md:inline">{lang === 'zh' ? '定位指揮所' : 'Locate CP'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#040C16] border border-amber-500/40 rounded-lg text-xs font-mono ml-1">
                  <span className="text-[10px] text-slate-400">{lang === 'zh' ? '戰術點數:' : 'CP:'}</span>
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
                  title={t.flakBarrageDesc}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                  <span>{t.flakBarrage} (SPACE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBottomDeckExpanded(false)}
                  className="px-2 py-1 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] rounded text-[10px] text-slate-300 hover:text-white font-mono"
                  title="收合出擊列"
                >
                  {lang === 'zh' ? '收合 ▼' : 'Minimize ▼'}
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
                    {lang === 'zh' ? '機型篩選:' : 'Role Filter:'}
                  </span>
                  {[
                    { id: 'all', label: lang === 'zh' ? '全部' : 'All' },
                    { id: 'fighter', label: lang === 'zh' ? '空優戰機 🛡️' : 'Fighters 🛡️' },
                    { id: 'dive_bomber', label: lang === 'zh' ? '俯衝轟炸 🎯' : 'Dive Bombers 🎯' },
                    { id: 'torpedo_bomber', label: lang === 'zh' ? '魚雷轟炸 🌊' : 'Torpedo 🌊' },
                    { id: 'attacker', label: lang === 'zh' ? '重型攻擊 💥' : 'Attackers 💥' },
                    { id: 'special', label: lang === 'zh' ? '偵察/特種 📡' : 'Recon/SAR 📡' },
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
                    title={lang === 'zh' ? "開啟母艦全軍械庫彈藥庫" : "Open carrier ordnance armament catalog"}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '母艦全裝備庫' : 'Carrier Armory'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">{lang === 'zh' ? '空白鍵暫停' : 'Space to Pause'}</span>
                </div>
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
                    const currentPayload = modelPayloads[model] || activePayloads[role];
                    const payloadData = PAYLOAD_CATALOG[currentPayload] || PAYLOAD_CATALOG.clean_guns;
                    const compatiblePayloads = getCompatiblePayloads(role, era);

                    const roleBadge =
                      role === 'fighter'
                        ? (lang === 'zh' ? '【空優戰機】' : '【Fighter】')
                        : role === 'dive_bomber'
                        ? (lang === 'zh' ? '【俯衝轟炸】' : '【Dive Bomber】')
                        : role === 'torpedo_bomber'
                        ? (lang === 'zh' ? '【魚雷反艦】' : '【Torpedo】')
                        : role === 'attacker'
                        ? (lang === 'zh' ? '【重型攻擊】' : '【Attacker】')
                        : role === 'aew'
                        ? (lang === 'zh' ? '【預警機】' : '【AEW】')
                        : role === 'rescue'
                        ? (lang === 'zh' ? '【搜救直升機】' : '【SAR Heli】')
                        : role === 'transport'
                        ? (lang === 'zh' ? '【戰術空投】' : '【Air Drop】')
                        : (lang === 'zh' ? '【艦載偵察】' : '【Scout】');

                    return (
                      <div
                        key={model}
                        className="relative flex flex-col justify-between bg-[#071526] border border-[#1E3A5F] hover:border-[#388E3C]/80 rounded-lg p-2 text-xs font-mono shadow-md min-w-[150px] max-w-[165px] transition-colors shrink-0"
                      >
                        {/* Header: Name & Count */}
                        <div>
                          <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]/60">
                            <div className="flex flex-col truncate pr-0.5">
                              <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate" title={`${label} (${desc})`}>
                                {label}
                              </span>
                              <span className="text-[8.5px] text-[#80DEEA]">{roleBadge}</span>
                            </div>
                            <span
                              className={`tabular-nums text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                                hasReady
                                  ? 'bg-[#004D40] text-[#00E676] border border-[#00BFA5]/40'
                                  : 'bg-red-950/60 text-red-400 border border-red-800/40'
                              }`}
                            >
                              {readyCount}{lang === 'zh' ? '架' : 'Rdy'}
                            </span>
                          </div>

                          {/* Formation Selector */}
                          <div className="flex items-center justify-between mt-1 gap-1">
                            <span className="text-[9px] text-slate-400 shrink-0">{lang === 'zh' ? '編隊:' : 'Form:'}</span>
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
                                title={lang === 'zh' ? "全部在艦飛機出擊" : "All ready"}
                              >
                                {lang === 'zh' ? '全' : 'A'}
                              </button>
                            </div>
                          </div>

                          {/* Interactive Armament Tray Trigger Card */}
                          <div className="mt-1.5 bg-[#040E1B] p-1.5 rounded border border-[#1E3A5F]/80 flex flex-col gap-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[8px] font-bold text-emerald-400 bg-[#004D40]/60 px-1 py-0.2 rounded truncate">
                                {payloadData.purposeBadge || (lang === 'zh' ? '作戰' : 'Tac')}
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
                              <span>{lang === 'zh' ? '更換掛載' : 'Payload'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Sortie Button */}
                        <button
                          type="button"
                          disabled={!hasReady}
                          onClick={() => {
                            onLaunchModel(model, effectiveCount, currentPayload);
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
                          <span className="truncate">{hasReady ? (lang === 'zh' ? `出擊 ${effectiveCount}機` : `Sortie ${effectiveCount}`) : (lang === 'zh' ? '整備中' : 'Prepping')}</span>
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
                  <span className="font-bold">{lang === 'zh' ? '前進野戰陸基航空站 (FORWARD AIRBASE)' : 'FORWARD AIRBASE (AFB)'}</span>
                  <span className="text-[10px] text-slate-300">
                    {lang === 'zh'
                      ? era === 'era5'
                        ? '支援 B-52G / F-111 現代長程戰轟、A-10A / AH-64A / F-15A / F-16A 陸空主力與海軍陸基戰備分隊！'
                        : era === 'era4'
                        ? '支援 B-52 戰略重轟、F-4E / F-105D 超音速戰機與海軍陸基分隊！'
                        : '支援 B-17 / B-24 / B-29 重型水平轟炸機、雙發重攻擊機與陸航空優戰機！'
                      : 'Supports strategic bombers, tactical strike attackers & airbase interceptors!'}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300 font-bold bg-[#004D40] px-2 py-0.5 rounded border border-[#80CBC4]/50">
                  {lang === 'zh' ? '基地補給倒數:' : 'Airbase Supply In:'} {Math.ceil(airbaseReplenishTimer)}s
                </div>
              </div>

              {/* AFB Category Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                <div className="flex items-center gap-1 bg-[#03151D] p-1 rounded-lg border border-[#00695C]">
                  <span className="text-[10px] text-slate-400 px-1 font-bold">{lang === 'zh' ? '機型分類:' : 'Role Filter:'}</span>
                  {[
                    { id: 'all', label: lang === 'zh' ? '全部' : 'All' },
                    { id: 'level_bomber', label: lang === 'zh' ? '水平重轟 💣' : 'Bombers 💣' },
                    { id: 'fighter', label: lang === 'zh' ? '陸航空優 🛡️' : 'Fighters 🛡️' },
                    { id: 'attacker', label: lang === 'zh' ? '強襲攻擊 🎯' : 'Attackers 🎯' },
                    { id: 'navy', label: lang === 'zh' ? '海軍分隊 ⚓' : 'Navy Det. ⚓' },
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
                    title={lang === 'zh' ? "開啟軍械庫彈藥庫" : "Open airbase armory"}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '戰地軍械庫' : 'Field Armory'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">{lang === 'zh' ? '長程出擊可隨時返降基地' : 'Long-range sorties RTB to airbase'}</span>
                </div>
              </div>

              {/* AFB Aircraft Cards with Draggable and Wheel Scroll */}
              <DraggableScrollContainer className="gap-2 pb-1">
                {(era === 'era1'
                  ? [
                      { id: 'b17', label: 'B-17 飛行堡壘', role: 'level_bomber' as AircraftRole, desc: '4發重型水平轟炸機 · 12枚連環地毯轟炸', isNavy: false },
                      { id: 'b25', label: 'B-25B 米切爾', role: 'level_bomber' as AircraftRole, desc: '雙發中型轟炸機 · 雙垂尾 · 8枚地毯轟炸', isNavy: false },
                      { id: 'p40', label: 'P-40 戰鷹', role: 'fighter' as AircraftRole, desc: '陸航空優戰鬥機 · 截擊空戰', isNavy: false },
                      { id: 'p36a', label: 'P-36A 鷹式', role: 'fighter' as AircraftRole, desc: '陸航早期主力戰機 · 靈巧盤旋截擊', isNavy: false },
                      { id: 'p39d', label: 'P-39D 空中眼鏡蛇', role: 'attacker' as AircraftRole, desc: '中置引擎 · 槳轂37mm機砲重穿甲', isNavy: false },
                      { id: 'a20', label: 'A-20 浩劫', role: 'attacker' as AircraftRole, desc: '雙發對艦/對地重攻擊機', isNavy: false },
                      { id: 'c47', label: 'C-47 空中列車', role: 'transport' as AircraftRole, desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
                      { id: 'f4f', label: 'F4F 野貓 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回企業號航艦', isNavy: true },
                      { id: 'sbd', label: 'SBD 無畏 (海軍陸基)', role: 'dive_bomber' as AircraftRole, desc: '可轉場回企業號航艦', isNavy: true },
                      { id: 'tbd', label: 'TBD 毀滅者 (海軍陸基)', role: 'torpedo_bomber' as AircraftRole, desc: '可轉場回企業號航艦', isNavy: true },
                    ]
                  : era === 'era2'
                  ? [
                      { id: 'b24', label: 'B-24 解放者', role: 'level_bomber' as AircraftRole, desc: '超重型遠程水平轟炸機 · 16枚地毯連環航彈', isNavy: false },
                      { id: 'b17_late', label: 'B-17G 飛行堡壘 (後期)', role: 'level_bomber' as AircraftRole, desc: '下顎雙聯.50機砲砲塔 · 密集防禦火網 · 16枚地毯轟炸', isNavy: false },
                      { id: 'p51', label: 'P-51 野馬', role: 'fighter' as AircraftRole, desc: '長程高速空優戰鬥機 · 6x .50 機槍 / 火箭 / 航彈', isNavy: false },
                      { id: 'p47', label: 'P-47 雷霆 (Jug)', role: 'attacker' as AircraftRole, desc: '裝甲戰鬥轟炸機 · 8x .50機槍 + 火箭/雙航彈', isNavy: false },
                      { id: 'p38', label: 'P-38 閃電', role: 'fighter' as AircraftRole, desc: '雙身重戰鬥機 · 20mm機砲 + 4x .50機槍', isNavy: false },
                      { id: 'c47', label: 'C-47 空中列車', role: 'transport' as AircraftRole, desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
                      { id: 'f6f', label: 'F6F 地獄貓 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回艾塞克斯號', isNavy: true },
                      { id: 'f4u', label: 'F4U 海盜 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回艾塞克斯號', isNavy: true },
                      { id: 'sb2c', label: 'SB2C 地獄俯衝者', role: 'dive_bomber' as AircraftRole, desc: '可轉場回艾塞克斯號', isNavy: true },
                      { id: 'tbf', label: 'TBF 復仇者 (海軍陸基)', role: 'torpedo_bomber' as AircraftRole, desc: '可轉場回艾塞克斯號', isNavy: true },
                    ]
                  : era === 'era3'
                  ? [
                      { id: 'b29', label: 'B-29 超級堡壘', role: 'level_bomber' as AircraftRole, desc: '萬米平流層戰略重轟 · 24枚連環地毯航彈 / Mk 4 戰術核彈', isNavy: false },
                      { id: 'f86', label: 'F-86 軍刀', role: 'fighter' as AircraftRole, desc: '後掠翼噴射空優王者 · 6x .50 M3 柯爾特高射速機砲', isNavy: false },
                      { id: 'f82', label: 'F-82 雙野馬長程截擊機', role: 'fighter' as AircraftRole, desc: '雙機身超長程護航戰機 · 6x .50高射速機砲', isNavy: false },
                      { id: 'a26', label: 'A-26 入侵者', role: 'attacker' as AircraftRole, desc: '雙發高速重攻擊機 · 凝固汽油燃燒彈 / 小蒂姆火箭 / 巨彈', isNavy: false },
                      { id: 'c47', label: 'C-47 空中列車', role: 'transport' as AircraftRole, desc: '戰術傘兵運輸機 · 空投陸戰/空降傘兵奪島 (按U卸載)', isNavy: false },
                      { id: 'f9f', label: 'F9F 黑豹 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回奧里斯卡尼號', isNavy: true },
                      { id: 'f2h', label: 'F2H 女妖 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回奧里斯卡尼號', isNavy: true },
                      { id: 'ad1', label: 'AD-1 天襲者 (海軍陸基)', role: 'attacker' as AircraftRole, desc: '可轉場回奧里斯卡尼號', isNavy: true },
                      { id: 'f4u4', label: 'F4U-4 海盜 (海軍陸基)', role: 'attacker' as AircraftRole, desc: '可轉場回奧里斯卡尼號', isNavy: true },
                      { id: 'af_guardian', label: 'AF-2 獵潛衛士 (海軍陸基)', role: 'scout' as AircraftRole, desc: '可轉場回奧里斯卡尼號', isNavy: true },
                    ]
                  : era === 'era4'
                  ? [
                      { id: 'b52', label: 'B-52 同溫層堡壘', role: 'level_bomber' as AircraftRole, desc: '8發巨型戰略重轟 · 36枚弧形地毯轟炸 (Arc Light)', isNavy: false },
                      { id: 'f4e', label: 'F-4E 幽靈II (陸空軍)', role: 'fighter' as AircraftRole, desc: '火神20mm航砲 + 麻雀/響尾蛇飛彈 · 超音速空優', isNavy: false },
                      { id: 'f105', label: 'F-105D 雷公', role: 'attacker' as AircraftRole, desc: '超音速戰術戰轟機 · 百舌鳥反輻射飛彈 / 蛇眼減速彈', isNavy: false },
                      { id: 'a7', label: 'A-7D 海盜II', role: 'attacker' as AircraftRole, desc: '對地打擊攻擊機 · 沃爾艾電視滑翔炸彈 / 蛇眼炸彈', isNavy: false },
                      { id: 'a1h', label: 'A-1H 天襲者 (陸航/海航)', role: 'attacker' as AircraftRole, desc: '重裝活塞攻擊機 · 15個武器掛點 · 巨量航彈與火箭齊射', isNavy: false },
                      { id: 'a37b', label: 'A-37B 蜻蜓式攻擊機', role: 'attacker' as AircraftRole, desc: '雙發輕型攻擊機 · 7.62mm米尼岡六管機槍 · 蛇眼航彈', isNavy: false },
                      { id: 'f5a', label: 'F-5A 自由鬥士戰鬥機', role: 'fighter' as AircraftRole, desc: '雙發輕型超音速空優機 · 2x 20mm機砲 + 響尾蛇飛彈', isNavy: false },
                      { id: 'f104g', label: 'F-104G 星式超音速戰機', role: 'fighter' as AircraftRole, desc: '2.0馬赫有人火箭 · 梯形小展弦比翼 · 響尾蛇飛彈', isNavy: false },
                      { id: 'ov10', label: 'OV-10A 野馬', role: 'scout' as AircraftRole, desc: '前進空中管制 (FAC) / 觀測偵察 · 70mm FFAR火箭', isNavy: false },
                      { id: 'ah1', label: 'AH-1G 眼鏡蛇', role: 'attacker' as AircraftRole, desc: '武裝攻擊直升機 · 20mm旋轉機砲 + 70mm火箭火網', isNavy: false },
                      { id: 'uh1', label: 'UH-1D 休伊', role: 'rescue' as AircraftRole, desc: '陸戰隊空中垂直突擊 / 戰場直升機空降搜救', isNavy: false },
                      { id: 'c1', label: 'C-1A 貿易商', role: 'transport' as AircraftRole, desc: '戰術艦載/陸基運輸機 · 陸戰隊傘兵空投遠程奪島', isNavy: false },
                      { id: 'f4j', label: 'F-4J 幽靈 (海軍陸基)', role: 'fighter' as AircraftRole, desc: '可轉場回小鷹號超級航母 · 麻雀 + 響尾蛇飛彈', isNavy: true },
                      { id: 'a6a', label: 'A-6A 入侵者 (海軍陸基)', role: 'attacker' as AircraftRole, desc: '可轉場回小鷹號超級航母 · 沃爾艾 / 百舌鳥 / 蛇眼', isNavy: true },
                      { id: 'a4', label: 'A-4F 天鷹 (海軍陸基)', role: 'attacker' as AircraftRole, desc: '可轉場回小鷹號超級航母 · 輕型精準打擊 / 幼畜飛彈', isNavy: true },
                      { id: 'e1', label: 'E-1B 追蹤者 (海軍陸基)', role: 'aew' as AircraftRole, desc: '可轉場回小鷹號超級航母 · 全向預警雷達', isNavy: true },
                    ]
                  : [
                      // ════ 時代五 (冷戰終局現代化主力戰機與海軍陸基分隊) ════
                      { id: 'a10a', label: 'A-10A 疣豬攻擊機 (開罐器)', role: 'attacker' as AircraftRole, desc: '30mm GAU-8 復仇者轉管巨砲 + 4x AGM-65 小牛導引飛彈', isNavy: false },
                      { id: 'ah64a', label: 'AH-64A 阿帕契重裝武裝直升機', role: 'attacker' as AircraftRole, desc: '16枚 AGM-114 地獄火攻頂反戰車飛彈 + 30mm 鏈砲', isNavy: false },
                      { id: 'ah1w', label: 'AH-1W 超級眼鏡蛇武裝直升機', role: 'attacker' as AircraftRole, desc: '8x 拖式反裝甲飛彈 + 20mm 旋轉機砲 + 響尾蛇空空防衛', isNavy: false },
                      { id: 'f15a', label: 'F-15A 鷹式純空優戰鬥機', role: 'fighter' as AircraftRole, desc: 'APG-63 雷達 + 4x AIM-7F 麻雀 + 4x AIM-9L 響尾蛇', isNavy: false },
                      { id: 'f16a', label: 'F-16A 戰隼超音速多用途戰機', role: 'fighter' as AircraftRole, desc: '電傳飛控高過載 + AIM-9L 響尾蛇 + AGM-65 小牛飛彈', isNavy: false },
                      { id: 'e3a', label: 'E-3A 哨兵望樓預警機', role: 'aew' as AircraftRole, desc: '8000m 戰區巨型雷達早期預警 · 全戰區敵情即時共享', isNavy: false },
                      { id: 'f111', label: 'F-111 土豚變後掠翼戰轟機', role: 'level_bomber' as AircraftRole, desc: '2.5馬赫低空突防 · 4x GBU-10 鋪路穿甲彈 / 魚叉反艦', isNavy: false },
                      { id: 'b52', label: 'B-52G 同溫層堡壘 (現代化重轟)', role: 'level_bomber' as AircraftRole, desc: '8發巨型重轟 · 8x 魚叉長程反艦巡弋飛彈 / 走廊地毯轟炸', isNavy: false },
                      { id: 'c130', label: 'C-130 大力士戰術運輸機', role: 'transport' as AircraftRole, desc: '戰術空投重型物資與陸戰隊傘兵部隊奪島', isNavy: false },
                      { id: 'f14a', label: 'F-14A 雄貓 (海軍陸基分隊)', role: 'fighter' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 4x AIM-54 鳳凰超遠程飛彈', isNavy: true },
                      { id: 'fa18a', label: 'F/A-18A 大黃蜂 (海軍陸基分隊)', role: 'fighter' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 魚叉反艦 + 小牛 + 響尾蛇', isNavy: true },
                      { id: 'a6e', label: 'A-6E 侵入者 (海軍陸基分隊)', role: 'attacker' as AircraftRole, desc: '可轉場回尼米茲號航艦 · TRAM雷射穿甲 + 魚叉反艦', isNavy: true },
                      { id: 'ea6b', label: 'EA-6B 徘徊者 (海軍陸基分隊)', role: 'attacker' as AircraftRole, desc: '可轉場回尼米茲號航艦 · ALQ-99電戰干擾 + AGM-88 HARM', isNavy: true },
                      { id: 'av8b', label: 'AV-8B 海獵鷹II (陸戰隊垂直起降)', role: 'attacker' as AircraftRole, desc: '前線野戰短場起降 · GAU-12 25mm機砲 + 小牛飛彈', isNavy: true },
                      { id: 's3a', label: 'S-3A 維京反潛機 (海軍陸基分隊)', role: 'scout' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 磁異探測 + 魚叉反艦 + 反潛魚雷', isNavy: true },
                      { id: 'e2c', label: 'E-2C 鷹眼預警機 (海軍陸基分隊)', role: 'aew' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 6500m 超遠空情預警', isNavy: true },
                      { id: 'sh3f', label: 'SH-3F 海王反潛直升機 (海軍陸基)', role: 'rescue' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 吊放聲吶 + 聲自導反潛魚雷', isNavy: true },
                      { id: 'ch53', label: 'CH-53 海種馬 (陸戰隊重型運輸)', role: 'transport' as AircraftRole, desc: '重裝甲吊運與大兵力垂直機降突擊', isNavy: true },
                      { id: 'c2a', label: 'C-2A 灰狗艦載運輸機 (海軍陸基)', role: 'transport' as AircraftRole, desc: '可轉場回尼米茲號航艦 · 快速人員物資與傘兵空投', isNavy: true },
                    ]
                )
                  .filter((p) => {
                    if (afbFilter === 'all') return true;
                    if (afbFilter === 'level_bomber') return p.role === 'level_bomber';
                    if (afbFilter === 'fighter') return p.role === 'fighter' && !p.isNavy;
                    if (afbFilter === 'attacker') return p.role === 'attacker' && !p.isNavy;
                    if (afbFilter === 'navy') return p.isNavy;
                    return true;
                  })
                  .map(({ id, label, role, desc, isNavy }) => {
                    const mCount = airbasePlanes[id] || 0;
                    const hasReady = mCount > 0;
                    const selectedCount = afbFormationCounts[id] || 2;
                    const effectiveCount = Math.min(selectedCount, mCount || 1);
                    const currentPayload =
                      afbPayloads[id] ||
                      (role === 'level_bomber'
                        ? id === 'b52'
                          ? era === 'era5' ? 'rgm84_harpoon' : 'b52_megaton_carpet'
                          : id === 'f111'
                          ? 'gbu10_laser_paveway'
                          : id === 'b29'
                          ? 'tactical_nuke'
                          : id === 'b24'
                          ? 'bombs_quad_500'
                          : 'bombs_carpet_250'
                        : role === 'attacker'
                        ? id === 'a10a'
                          ? 'agm65_maverick'
                          : id === 'ah64a'
                          ? 'hellfire_missiles'
                          : id === 'ah1w'
                          ? 'tow_missiles'
                          : id === 'a6e'
                          ? 'rgm84_harpoon'
                          : id === 'ea6b'
                          ? 'agm88_harm'
                          : id === 'av8b'
                          ? 'agm65_maverick'
                          : id === 'f105'
                          ? 'agm45_shrike'
                          : id === 'a7' || id === 'a6a'
                          ? 'agm62_walleye'
                          : id === 'ah1'
                          ? 'ffar_rockets_pod'
                          : id === 'a26' && era === 'era3'
                          ? 'napalm_canister'
                          : id === 'p47'
                          ? 'mixed_bombs_rockets'
                          : era === 'era4'
                          ? 'bombs_snakeye_retarded'
                          : 'bombs_dual_500'
                        : role === 'fighter'
                        ? id === 'f14a'
                          ? 'aim54_phoenix'
                          : id === 'fa18a'
                          ? 'rgm84_harpoon'
                          : id === 'f15a' || id === 'f16a'
                          ? 'aim7_aim9_combo'
                          : era === 'era4'
                          ? 'aim7_sparrow'
                          : 'clean_guns'
                        : role === 'transport'
                        ? id === 'ch53'
                          ? 'helo_assault_troops'
                          : 'c1_paratroopers'
                        : role === 'rescue'
                        ? id === 'sh3f'
                          ? 'asw_torpedo'
                          : era === 'era4'
                          ? 'helo_assault_troops'
                          : 'clean_guns'
                        : role === 'scout' || role === 'aew'
                        ? id === 's3a'
                          ? 'asw_torpedo'
                          : 'scout_fuel'
                        : role === 'dive_bomber'
                        ? 'bomb_1000'
                        : 'aerial_torpedo');
                    const payloadData = PAYLOAD_CATALOG[currentPayload] || PAYLOAD_CATALOG.clean_guns;
                    const isCarrierCapable = isNavy;
                    const afbCompatiblePayloads = getAfbCompatiblePayloads(id, role, era);
                    const isNukeEquipped =
                      currentPayload === 'tactical_nuke' ||
                      currentPayload === 'b52_megaton_nuke' ||
                      currentPayload === 'tactical_b61_nuke';
                    const requiredNukeCp = payloadData.cpCost || 4500;
                    const canAffordNuke = resourcePoints >= requiredNukeCp;

                    const roleBadge =
                      role === 'level_bomber'
                        ? (lang === 'zh' ? '【水平重轟】' : '【Level Bomber】')
                        : role === 'attacker'
                        ? (lang === 'zh' ? '【陸基強襲】' : '【Strike Attacker】')
                        : role === 'fighter'
                        ? isNavy
                          ? (lang === 'zh' ? '【海軍陸基】' : '【Navy Land-Based】')
                          : (lang === 'zh' ? '【陸航空優】' : '【AAF Fighter】')
                        : role === 'transport'
                        ? (lang === 'zh' ? '【戰術空投】' : '【Air Drop】')
                        : role === 'rescue'
                        ? (lang === 'zh' ? '【直升突擊】' : '【Airmobile】')
                        : (lang === 'zh' ? '【海軍分隊】' : '【Navy Detachment】');

                    return (
                      <div
                        key={id}
                        className={`relative flex flex-col justify-between rounded-lg p-2 text-xs font-mono shadow-md min-w-[150px] max-w-[165px] transition-colors shrink-0 ${
                          isNukeEquipped
                            ? 'bg-[#180E14] border-2 border-amber-400 shadow-[0_0_12px_rgba(255,160,0,0.3)]'
                            : 'bg-[#05151F] border border-[#00695C] hover:border-[#80CBC4]'
                        }`}
                      >
                        {/* Card Header: Model Name & Ready Count */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#004D40]">
                          <div className="flex flex-col truncate pr-1">
                            <span className="font-bold text-[#E0F2F1] text-[11px] truncate" title={`${label} (${desc})`}>
                              {label}
                            </span>
                            <span className={`text-[9px] ${isNukeEquipped ? 'text-amber-300 font-bold' : 'text-[#80CBC4]'}`}>
                              {roleBadge}
                            </span>
                          </div>
                          <span
                            className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              hasReady
                                ? 'bg-[#004D40] text-[#80CBC4] border border-[#80CBC4]/50'
                                : 'bg-slate-900 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {mCount} {lang === 'zh' ? '在基地' : 'at Base'}
                          </span>
                        </div>

                        {/* Formation Selector */}
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <span className="text-[10px] text-slate-400 shrink-0">{lang === 'zh' ? '編隊:' : 'Form:'}</span>
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
                                {cnt}{lang === 'zh' ? '機' : ''}
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
                              title={lang === 'zh' ? "全部在基地的飛機出擊" : "All planes at base"}
                            >
                              {lang === 'zh' ? '全' : 'ALL'}
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
                              {payloadData.purposeBadge || (lang === 'zh' ? '【戰術作戰】' : '【Tactical】')}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate font-mono">
                              {payloadData.visualTag || (lang === 'zh' ? '[標準機載]' : '[Standard]')}
                            </span>
                          </div>

                          <div className={`font-bold text-[10px] truncate mt-0.5 ${isNukeEquipped ? 'text-amber-300' : 'text-white'}`}>
                            {payloadData.badge}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-300">
                            <span>💥 {lang === 'zh' ? '半徑:' : 'Radius:'} {payloadData.blastRadius ? `${payloadData.blastRadius}m` : (lang === 'zh' ? '直擊' : 'Direct')}</span>
                            <span className="text-amber-300 font-bold tabular-nums">
                              {payloadData.damage > 0 ? `${payloadData.damage.toLocaleString()} DMG` : (lang === 'zh' ? '空戰' : 'Air Combat')}
                            </span>
                          </div>

                          {payloadData.cpCost ? (
                            <div className="text-[9px] font-bold flex items-center justify-between pt-0.5 border-t border-red-900/40">
                              <span className="text-amber-400">☢️ {lang === 'zh' ? '戰略授權 CP:' : 'Auth Cost CP:'}</span>
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
                            <span>{lang === 'zh' ? '更換掛載 (開啟軍械庫選擇盤)' : 'Swap Payload (Armory Select)'}</span>
                          </button>
                        </div>

                        {/* Action Buttons: Sortie & Ferry */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {isCarrierCapable ? (
                            <button
                              type="button"
                              disabled={!hasReady}
                              onClick={() => onFerryPlanes?.(id, effectiveCount)}
                              className={`py-1.5 px-1 rounded font-bold text-center text-[10px] flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                                hasReady
                                  ? 'bg-[#0B1E34] hover:bg-[#153252] text-[#80DEEA] border border-[#1E3A5F]'
                                  : 'bg-[#031017] text-slate-600 border border-slate-800 cursor-not-allowed'
                              }`}
                              title={lang === 'zh' ? "轉場至旗艦航空母艦機庫" : "Ferry aircraft to carrier flight deck"}
                            >
                              <span>🛫 {lang === 'zh' ? '轉場CV' : 'Ferry CV'}</span>
                            </button>
                          ) : (
                            <div className="text-[9px] text-slate-400 flex items-center justify-center bg-[#031017] rounded border border-slate-800/60 text-center font-bold">
                              {lang === 'zh' ? '陸航專用' : 'AAF Only'}
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={!hasReady}
                            onClick={() => {
                              onLaunchAirbaseSortie?.(id as AircraftModel, effectiveCount, currentPayload);
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
                                    ? (lang === 'zh' ? '☢️ 核打擊出擊' : '☢️ Launch Nuke')
                                    : (lang === 'zh' ? `☢️ 差${4500 - Math.floor(resourcePoints)} CP` : `☢️ Need ${4500 - Math.floor(resourcePoints)} CP`)
                                  : (lang === 'zh' ? `出擊 ${effectiveCount}機` : `Sortie (${effectiveCount})`)
                                : (lang === 'zh' ? '無機' : 'Empty')}
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
                    <span>{lang === 'zh' ? '工事分類:' : 'Category:'}</span>
                  </span>
                  {[
                    { id: 'all', label: lang === 'zh' ? '全部工事' : 'All Works' },
                    { id: 'aviation', label: lang === 'zh' ? '✈️ 航空野戰基地' : '✈️ Aviation Bases' },
                    { id: 'air_defense', label: lang === 'zh' ? '🛡️ 防空飛彈/火砲' : '🛡️ SAM & AAA' },
                    { id: 'naval', label: lang === 'zh' ? '⚓ 海軍軍港浮塢' : '⚓ Naval & Docks' },
                    { id: 'fortification', label: lang === 'zh' ? '🏰 防衛堡壘/指揮所' : '🏰 Forts & CPs' },
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
                  <span className="text-slate-400 text-[10px]">{lang === 'zh' ? '所屬島嶼:' : 'Island:'}</span>
                  <select
                    value={selectedBuildIslandId}
                    onChange={(e) => setSelectedBuildIslandId(e.target.value)}
                    className="bg-[#040C16] border border-[#1E3A5F] rounded px-2 py-0.5 text-amber-300 text-xs font-mono focus:outline-none"
                  >
                    <option value="">
                      {lang === 'zh' ? '預設友軍登陸島嶼' : 'Default Base Island'}
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
                  <span>{lang === 'zh' ? (era === 'era4' ? '冷戰工事快捷建造:' : '戰地工事快捷建造:') : 'Quick Construction Bar:'}</span>
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                  {(era === 'era4'
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
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
                          canAfford
                            ? 'bg-[#0B2138] hover:bg-[#12365D] border-amber-400/60 text-amber-200 hover:text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                        title={`${matchedItem.nameZh} - 快捷在工兵身旁建造 (${matchedItem.cost} CP)`}
                      >
                        <span>{qItem.label}</span>
                        <span className="text-[9px] text-amber-400 font-mono">({qItem.cost})</span>
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
                        className="flex flex-col justify-between bg-[#071526] border border-amber-500/40 hover:border-amber-400 rounded-lg p-2 text-xs font-mono shadow-md min-w-[155px] max-w-[170px] transition-all shrink-0"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]/70">
                            <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate" title={item.name}>
                              {lang === 'zh' ? item.nameZh : item.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="px-1 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-600/50 rounded text-[8.5px] font-bold">
                              {item.badge}
                            </span>
                            <span className="text-amber-300 font-bold text-[10.5px] tabular-nums">
                              {item.cost} CP
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </div>
                          <div className="text-[8.5px] text-[#80DEEA] mt-1 bg-[#040C16] p-1 rounded border border-[#1E3A5F]/50 truncate">
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
                                    ? `在海圖上指定「${item.nameZh}」突堤碼頭建造座標`
                                    : `在海圖上指定建造座標`
                                  : `資源不足 (尚欠 ${shortCp} CP)`
                              }
                            >
                              <MapPin className="w-2.5 h-2.5 text-cyan-200 shrink-0" />
                              <span className="truncate">
                                {isPierFacility ? (lang === 'zh' ? '落點指定' : 'Stamp') : t.stampBuild}
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
                              title={lang === 'zh' ? "快捷在工兵身旁或目標島建造" : "Quick construct"}
                            >
                              <span>{t.quickBuild}</span>
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
                    <span>{lang === 'zh' ? '支援類別:' : 'Category:'}</span>
                  </span>
                  {(
                    [
                      { key: 'ground', label: `🪖 ${t.catGroundUnits}` },
                      { key: 'ships', label: `⚓ ${t.catShips}` },
                      { key: 'aircraft', label: `✈️ ${t.catAircraft}` },
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
                    {t.reinforceSpawnNote}
                  </span>
                </div>
              </div>

              {/* Items Catalog Cards for Battalion CP Support */}
              <DraggableScrollContainer className="gap-2 pb-1 max-w-full">
                {currentCatalog.filter((item) => item.category === requisitionTab).map((item) => {
                  const canAfford = sandboxStamp || resourcePoints >= item.cost;
                  const shortCp = Math.ceil(item.cost - resourcePoints);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between bg-[#071526] border border-[#1E3A5F] hover:border-emerald-400/80 rounded-lg p-2 text-xs font-mono shadow-md min-w-[150px] max-w-[165px] transition-all shrink-0"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]/70">
                          <span className="font-bold text-[#E0F7FA] text-[10.5px] truncate" title={item.name}>
                            {lang === 'zh' ? item.nameZh : item.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="px-1 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 rounded text-[8.5px] font-bold">
                            {item.badge}
                          </span>
                          <span className="text-amber-300 font-bold text-[10.5px] tabular-nums">
                            {item.cost} CP
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </div>
                        <div className="text-[8.5px] text-[#80DEEA] mt-1 bg-[#040C16] p-1 rounded border border-[#1E3A5F]/50 truncate">
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
                          title={canAfford ? `呼叫支援 ${item.nameZh}` : `資源點數不足 (尚欠 ${shortCp} CP)`}
                        >
                          <ShoppingCart className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{canAfford ? (lang === 'zh' ? '呼叫支援' : 'Call Reinforce') : `差 ${shortCp} CP`}</span>
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

      {/* ══════════════════════════════════════════════════════════
          戰地軍械庫掛載選擇盤 (Tactical Armament Selector Tray Modal)
          全面支援作戰用途標籤、殺傷破壞半徑(m)、戰略CP成本與外觀模型預覽
          ══════════════════════════════════════════════════════════ */}
      {activeArmamentTray && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 pointer-events-auto">
          <div className="bg-[#051322] border-2 border-[#1E3A5F] rounded-xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-100 font-mono">
            {/* Tray Header */}
            <div className="flex items-center justify-between p-3.5 bg-[#081B30] border-b border-[#1E3A5F]">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-[#80DEEA]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#E0F7FA]">
                      【{activeArmamentTray.planeLabel}】戰地軍械庫掛載武裝配置盤
                    </span>
                    <span className="text-[11px] text-[#80CBC4] bg-[#004D40] px-2 py-0.5 rounded border border-[#80CBC4]/40 font-bold">
                      {activeArmamentTray.isAirbase ? '前進陸基基地' : '母艦飛行甲板'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    作戰用途標註 · 殺傷破壞半徑 (m) · 戰略CP授權 · 機體外觀掛載標籤
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-slate-400">目前可用 CP: </span>
                  <span className="text-amber-400 font-bold tabular-nums">{Math.floor(resourcePoints)} CP</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveArmamentTray(null)}
                  className="px-3 py-1.5 bg-[#1E3A5F]/80 hover:bg-[#1E3A5F] text-slate-200 hover:text-white rounded text-xs font-bold transition-colors"
                >
                  關閉選擇盤 ✕
                </button>
              </div>
            </div>

            {/* Tray Body: Grid of Payload Cards */}
            <div className="p-3.5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[calc(88vh-80px)]">
              {activeArmamentTray.compatiblePayloads.map((pid) => {
                const item = PAYLOAD_CATALOG[pid];
                if (!item) return null;
                const isSelected = activeArmamentTray.currentPayload === pid;
                const isNuke = pid === 'tactical_nuke';
                const cpCost = item.cpCost || 0;
                const canAfford = !cpCost || resourcePoints >= cpCost;

                return (
                  <div
                    key={pid}
                    className={`flex flex-col justify-between p-3 rounded-lg border transition-all ${
                      isSelected
                        ? isNuke
                          ? 'bg-[#250F0F] border-amber-400 shadow-[0_0_18px_rgba(255,160,0,0.4)]'
                          : 'bg-[#0A2540] border-[#00E676] shadow-md'
                        : isNuke
                        ? 'bg-[#180A0A] border-red-900/80 hover:border-amber-500/80'
                        : 'bg-[#06172A] border-[#1E3A5F] hover:border-[#42A5F5]'
                    }`}
                  >
                    <div>
                      {/* Purpose Badge & Visual Tag */}
                      <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isNuke
                              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-black font-extrabold shadow'
                              : 'bg-[#004D40] text-emerald-300 border border-[#00BFA5]/30'
                          }`}
                        >
                          {item.purposeBadge || '【戰術打擊】'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.visualTag || '[標準機載]'}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-xs font-bold ${isNuke ? 'text-amber-300' : 'text-white'}`}>
                          {item.badge}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.nameZh}</span>
                      </div>

                      {/* Metrics: Blast Radius, Damage, CP */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2 bg-[#030D18] p-2 rounded border border-[#1E3A5F]/60 text-[10px]">
                        <div>
                          <span className="text-slate-400">💥 破壞半徑: </span>
                          <span className="font-bold text-amber-300 tabular-nums">
                            {item.blastRadius ? `${item.blastRadius}m` : '精密點直擊'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">🎯 殺傷威力: </span>
                          <span className="font-bold text-emerald-300 tabular-nums">
                            {item.damage > 0 ? `${item.damage.toLocaleString()} DMG` : '空戰/機砲'}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between pt-1 border-t border-[#1E3A5F]/40">
                          <span className="text-slate-400">戰略CP授權: </span>
                          <span
                            className={`font-bold tabular-nums ${
                              cpCost > 0
                                ? canAfford
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {cpCost > 0 ? `☢️ ${cpCost.toLocaleString()} CP` : '✅ 常規庫存 (0 CP)'}
                          </span>
                        </div>
                      </div>

                      {/* Tactical Pros */}
                      <p className="text-[10px] text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                        {item.pros}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeArmamentTray.isAirbase) {
                          setAfbPayloads((prev) => ({ ...prev, [activeArmamentTray.planeId]: pid }));
                        } else {
                          setModelPayloads((prev) => ({ ...prev, [activeArmamentTray.planeId as AircraftModel]: pid }));
                          onSelectPayload?.(activeArmamentTray.role, pid);
                        }
                        setActiveArmamentTray((prev) => (prev ? { ...prev, currentPayload: pid } : null));
                      }}
                      className={`mt-3 w-full py-2 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#00E676] text-black shadow-md cursor-default'
                          : isNuke
                          ? canAfford
                            ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white border border-amber-300 shadow'
                            : 'bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300'
                          : 'bg-[#1976D2] hover:bg-[#2196F3] text-white shadow'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>✓ 目前已掛裝 (EQUIPPED)</span>
                        </>
                      ) : isNuke ? (
                        canAfford ? (
                          <span>☢️ 立即掛載原子彈 (具備足額 CP 授權)</span>
                        ) : (
                          <span>⚠️ 掛載原子彈 (出擊需 4,500 CP)</span>
                        )
                      ) : (
                        <span>立即更換此武裝 (EQUIP)</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

