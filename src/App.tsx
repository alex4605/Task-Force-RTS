import { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/engine';
import { GameCanvas, CameraViewportState } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { BriefingModal } from './components/BriefingModal';
import { AirWingPrepModal } from './components/AirWingPrepModal';
import { ArmamentModal } from './components/ArmamentModal';
import { TacticalMapModal } from './components/TacticalMapModal';
import { DockyardModal } from './components/DockyardModal';
import { BattleLogModal } from './components/BattleLogModal';
import { GameOverModal } from './components/GameOverModal';
import {
  FleetUpgrades,
  Ship,
  Aircraft,
  AircraftModel,
  AircraftRole,
  AircraftPayloadType,
  SectorIntel,
  GameScore,
  Era,
  Vector2D,
  AirWingLoadout,
  CombatLogEntry,
  GroundUnit,
  RequisitionItem,
  Island,
  Sonobuoy,
} from './types/game';
import { getRequisitionCatalog } from './game/requisition';
import { soundEngine } from './game/audio';

export default function App() {
  const [era, setEra] = useState<Era>('era1');
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine(1, 'era1');
  }
  const engine = engineRef.current;

  const [sectorNumber, setSectorNumber] = useState<number>(1);
  const [playerShips, setPlayerShips] = useState<Ship[]>(() => [...engine.playerShips]);
  const [enemyShips, setEnemyShips] = useState<Ship[]>(() => [...engine.enemyShips]);
  const [aircraft, setAircraft] = useState<Aircraft[]>(() => [...engine.aircraft]);
  const [groundUnits, setGroundUnits] = useState<GroundUnit[]>(() => [...engine.groundUnits]);
  const [sonobuoys, setSonobuoys] = useState<Sonobuoy[]>(() => [...engine.sonobuoys]);
  const [islands, setIslands] = useState<Island[]>(() => [...engine.islands]);
  const [intel, setIntel] = useState<SectorIntel | null>(engine.sectorIntel);
  const [score, setScore] = useState<GameScore>(() => ({ ...engine.score }));
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(() => [...engine.selectedUnitIds]);

  // Pier / Installation interactive map placement state
  const [activePlacementItem, setActivePlacementItem] = useState<RequisitionItem | null>(null);
  const [continuousStamp, setContinuousStamp] = useState<boolean>(true);
  const [sandboxStamp, setSandboxStamp] = useState<boolean>(false);

  // Simulation speed & pause state
  const [gameSpeed, setGameSpeed] = useState<number>(engine.gameSpeed);
  const [isPaused, setIsPaused] = useState<boolean>(engine.isPaused);

  // Active ordnance loadouts for each role
  const [activePayloads, setActivePayloads] = useState<Record<AircraftRole, AircraftPayloadType>>({
    ...engine.activePayloads,
  });

  // Camera external pan target & live viewport state (for minimap & theater plotter)
  const [externalCameraTarget, setExternalCameraTarget] = useState<Vector2D | null>(null);
  const [cameraViewport, setCameraViewport] = useState<CameraViewportState | null>(null);

  // Modal Dialogs
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(true);
  const [isAirPrepOpen, setIsAirPrepOpen] = useState<boolean>(false);
  const [isArmamentOpen, setIsArmamentOpen] = useState<boolean>(false);
  const [isBattleLogOpen, setIsBattleLogOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isDockyardOpen, setIsDockyardOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  // Selected facility for popping up context dock ('carrier', 'airbase', 'engineer_construction', 'battalion_cp')
  const [selectedAirfacility, setSelectedAirfacility] = useState<{
    type: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp';
    id?: string;
    timestamp: number;
  } | null>(null);

  // Real-time Combat Logs
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([...engine.combatLogs]);

  // CAP Orbit Area Designation Mode
  const [isDesignatingCap, setIsDesignatingCap] = useState<boolean>(false);
  // Passive Sonobuoy Drop Designation Mode
  const [isDesignatingSonobuoy, setIsDesignatingSonobuoy] = useState<boolean>(false);

  const handleStartCapDesignation = () => {
    setIsDesignatingSonobuoy(false);
    setActivePlacementItem(null);
    setIsDesignatingCap(true);
  };

  const handleConfirmCapTarget = (worldPos: Vector2D) => {
    engine.issueCapPatrolOrder(worldPos, selectedUnitIds);
    setAircraft([...engine.aircraft]);
    setCombatLogs([...engine.combatLogs]);
    setIsDesignatingCap(false);
  };

  const handleCancelCap = () => {
    setIsDesignatingCap(false);
  };

  const handleStartSonobuoyDesignation = () => {
    setIsDesignatingCap(false);
    setActivePlacementItem(null);
    setIsDesignatingSonobuoy(true);
  };

  const handleConfirmSonobuoyTarget = (worldPos: Vector2D, keepActive?: boolean) => {
    const ok = engine.orderDropSonobuoy(worldPos, selectedUnitIds);
    setAircraft([...engine.aircraft]);
    setCombatLogs([...engine.combatLogs]);
    if (!ok || !keepActive) {
      setIsDesignatingSonobuoy(false);
    }
  };

  const handleCancelSonobuoy = () => {
    setIsDesignatingSonobuoy(false);
  };

  // Upgrades
  const [upgrades, setUpgrades] = useState<FleetUpgrades>({
    hullArmorLevel: 1,
    aaFirepowerLevel: 1,
    radarRangeLevel: 1,
    carrierCapacityLevel: 1,
    artilleryDamageLevel: 1,
    depthChargeSonarLevel: 1,
  });

  const lastIslandsVer = useRef<number>(-1);
  const lastCombatLogsVer = useRef<number>(-1);
  const lastSelectedIdsStr = useRef<string>('');
  const lastGameTimeRef = useRef<number>(-1);

  const syncEngineSnapshot = () => {
    setPlayerShips([...engine.playerShips]);
    setEnemyShips([...engine.enemyShips]);
    setAircraft([...engine.aircraft]);
    setGroundUnits([...engine.groundUnits]);
    setSonobuoys([...engine.sonobuoys]);
    setIslands([...engine.islands]);
    setCombatLogs([...engine.combatLogs]);
    setSelectedUnitIds([...engine.selectedUnitIds]);
    setScore({ ...engine.score });
    setIsPaused(engine.isPaused);
    setGameSpeed(engine.gameSpeed);
  };

  // Sync React State from Engine tick (~8 Hz) - Pause-aware & dirty-checked
  useEffect(() => {
    const timer = setInterval(() => {
      const simAdvanced = engine.gameTime !== lastGameTimeRef.current;
      if (simAdvanced) {
        lastGameTimeRef.current = engine.gameTime;
        setPlayerShips([...engine.playerShips]);
        setEnemyShips([...engine.enemyShips]);
        setAircraft([...engine.aircraft]);
        setGroundUnits([...engine.groundUnits]);
        setSonobuoys([...engine.sonobuoys]);
      }

      // Only sync selectedUnitIds if actual selection changed
      const idsStr = engine.selectedUnitIds.join(',');
      if (idsStr !== lastSelectedIdsStr.current) {
        lastSelectedIdsStr.current = idsStr;
        setSelectedUnitIds([...engine.selectedUnitIds]);
      }

      // Only update islands if installations or territory changed
      if (engine.islandsVersion !== lastIslandsVer.current) {
        lastIslandsVer.current = engine.islandsVersion;
        setIslands([...engine.islands]);
      }

      // Only update combatLogs if new log entry was added
      if (engine.combatLogsVersion !== lastCombatLogsVer.current) {
        lastCombatLogsVer.current = engine.combatLogsVersion;
        setCombatLogs([...engine.combatLogs]);
      }

      // Guard score object allocation
      setScore((prev) => {
        if (
          prev.totalScore !== engine.score.totalScore ||
          prev.enemyShipsSunk !== engine.score.enemyShipsSunk ||
          prev.stars !== engine.score.stars
        ) {
          return { ...engine.score };
        }
        return prev;
      });

      setIsPaused((prev) => (prev !== engine.isPaused ? engine.isPaused : prev));
      setGameSpeed((prev) => (prev !== engine.gameSpeed ? engine.gameSpeed : prev));

      if (engine.isVictory && !isGameOverOpen) {
        setIsVictory(true);
        setIsGameOverOpen(true);
      } else if (engine.isDefeat && !isGameOverOpen) {
        setIsVictory(false);
        setIsGameOverOpen(true);
      }
    }, 120);

    return () => clearInterval(timer);
  }, [engine, isGameOverOpen]);

  const resetUiModesForTheater = () => {
    setIsDesignatingCap(false);
    setIsDesignatingSonobuoy(false);
    setActivePlacementItem(null);
    setSelectedAirfacility(null);
    setIsGameOverOpen(false);
    lastIslandsVer.current = -1;
    lastCombatLogsVer.current = -1;
    lastGameTimeRef.current = -1;
    const flagshipPos = engine.getFlagship()?.pos;
    if (flagshipPos) {
      setExternalCameraTarget({ ...flagshipPos });
    }
  };

  // Era Switcher
  const handleSetEra = (newEra: Era) => {
    setEra(newEra);
    engine.setEra(newEra);
    setIntel(engine.sectorIntel);
    setActivePayloads({ ...engine.activePayloads });
    resetUiModesForTheater();
    syncEngineSnapshot();
  };

  const handleLaunchModel = (model: AircraftModel, count: number = 2, payload?: AircraftPayloadType, carrierId?: string) => {
    engine.launchAircraft(model, count, payload, carrierId);
    setAircraft([...engine.aircraft]);
    setPlayerShips([...engine.playerShips]);
    setActivePayloads({ ...engine.activePayloads });
    setSelectedUnitIds([...engine.selectedUnitIds]);
  };

  const handleOrderSelected = (type: 'move' | 'attack' | 'patrol' | 'rtb' | 'idle') => {
    engine.issueOrderToSelected({ type });
  };

  const handleStopUnits = () => {
    engine.stopUnits();
  };

  const handleSetSpeed = (knots: number) => {
    engine.setFleetSpeed(knots);
  };

  const handleSteer = (dir: 'port' | 'starboard') => {
    engine.steerRudder(dir);
  };

  const handleTriggerFlak = () => {
    engine.triggerFleetFlakBarrage();
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Game Speed & Pause
  const handleSetGameSpeed = (speed: number) => {
    engine.setGameSpeed(speed);
    setGameSpeed(speed);
    setIsPaused(engine.isPaused);
  };

  const handleTogglePause = () => {
    const paused = engine.togglePause();
    setIsPaused(paused);
  };

  // Reconfigure Armament / Payload
  const handleSelectPayload = (role: AircraftRole, payload: AircraftPayloadType) => {
    engine.setRolePayload(role, payload);
    setActivePayloads({ ...engine.activePayloads });
  };

  // Pre-Battle Air Wing Custom Loadout
  const handleConfirmAirWingLoadout = (loadout: AirWingLoadout) => {
    engine.applyAirWingLoadout(loadout);
    setPlayerShips([...engine.playerShips]);
    setAircraft([...engine.aircraft]);
    setActivePayloads({ ...engine.activePayloads });
    // Unpause simulation upon entering battle!
    engine.isPaused = false;
    setIsPaused(false);
  };

  // Upgrades & Repairs
  const handleSpendStars = (amount: number): boolean => {
    if (engine.score.stars >= amount) {
      engine.score.stars -= amount;
      setScore({ ...engine.score });
      return true;
    }
    return false;
  };

  const handleRepairShips = () => {
    for (const ship of engine.playerShips) {
      ship.health = ship.maxHealth;
      ship.isSunk = false;
      if (ship.carrierPlanes) {
        for (const k in ship.carrierPlanes.ready) {
          ship.carrierPlanes.ready[k] = ship.carrierPlanes.maxPerType[k] || 6;
        }
      }
    }
    setPlayerShips([...engine.playerShips]);
  };

  const handleApplyUpgrade = (type: keyof FleetUpgrades) => {
    const val = upgrades[type];
    const next: FleetUpgrades = {
      ...upgrades,
      [type]: typeof val === 'number' ? val + 1 : true,
    };
    setUpgrades(next);
    engine.applyFleetUpgrades(next);
    setPlayerShips([...engine.playerShips]);
  };

  const handleNextSector = () => {
    const nextSector = sectorNumber + 1;
    setSectorNumber(nextSector);
    engine.loadSector(nextSector, era);
    setIntel(engine.sectorIntel);
    resetUiModesForTheater();
    syncEngineSnapshot();
    setIsAirPrepOpen(true);
  };

  const handleRestart = () => {
    const baseUpgrades: FleetUpgrades = {
      hullArmorLevel: 1,
      aaFirepowerLevel: 1,
      radarRangeLevel: 1,
      carrierCapacityLevel: 1,
      artilleryDamageLevel: 1,
      depthChargeSonarLevel: 1,
    };
    setUpgrades(baseUpgrades);
    engine.applyFleetUpgrades(baseUpgrades);
    setSectorNumber(1);
    engine.score = {
      enemyShipsSunk: 0,
      enemyPlanesDowned: 0,
      installationsDestroyed: 0,
      sectorsCleared: 0,
      totalScore: 0,
      stars: 12,
    };
    engine.loadSector(1, era);
    setIntel(engine.sectorIntel);
    resetUiModesForTheater();
    syncEngineSnapshot();
    setIsBriefingOpen(true);
  };

  const handleCycleSpeed = (delta: 1 | -1) => {
    const steps = [0.5, 1.0, 2.0, 3.0];
    const currentIdx = steps.indexOf(engine.gameSpeed);
    const idx = currentIdx === -1 ? 1 : currentIdx;
    const nextIdx = Math.max(0, Math.min(steps.length - 1, idx + delta));
    handleSetGameSpeed(steps[nextIdx]);
  };

  const flagship = engine.getFlagship();

  const selectedUnits: (Ship | Aircraft | GroundUnit)[] = [
    ...playerShips.filter((s) => selectedUnitIds.includes(s.id)),
    ...aircraft.filter((a) => selectedUnitIds.includes(a.id)),
    ...groundUnits.filter((u) => selectedUnitIds.includes(u.id) && u.side === 'player' && !u.isDestroyed),
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06101E] text-slate-100 select-none">
      {/* 2D HTML5 Vector RTS Game Canvas */}
      <GameCanvas
        engine={engine}
        onSelectUnits={(ids) => setSelectedUnitIds(ids)}
        onToggleMap={() => setIsMapOpen((prev) => !prev)}
        onTogglePause={handleTogglePause}
        onCycleSpeed={handleCycleSpeed}
        externalCameraTarget={externalCameraTarget}
        onClearCameraTarget={() => setExternalCameraTarget(null)}
        onCameraChange={setCameraViewport}
        onSelectAirfacility={(facilityType, facilityId) => {
          if (!facilityType) {
            setSelectedAirfacility(null);
          } else {
            setSelectedAirfacility({
              type: facilityType,
              id: facilityId,
              timestamp: Date.now(),
            });
          }
        }}
        isDesignatingCap={isDesignatingCap}
        onConfirmCapTarget={handleConfirmCapTarget}
        onCancelCap={handleCancelCap}
        isDesignatingSonobuoy={isDesignatingSonobuoy}
        onConfirmSonobuoyTarget={handleConfirmSonobuoyTarget}
        onCancelSonobuoy={handleCancelSonobuoy}
        activePlacementItem={activePlacementItem}
        onConfirmPlacement={(item, worldPos) => {
          const success = engine.purchaseRequisition(item, undefined, worldPos, sandboxStamp);
          if (success) {
            setIslands([...engine.islands]);
            setPlayerShips([...engine.playerShips]);
            setAircraft([...engine.aircraft]);
            if (!continuousStamp) {
              setActivePlacementItem(null);
            }
          }
        }}
        onCancelPlacement={() => setActivePlacementItem(null)}
        onTogglePlacement={() => {
          setActivePlacementItem((prev) => {
            if (prev) return null;
            const catalog = getRequisitionCatalog(era);
            return (
              catalog.find((i) => i.id === 'req-fac-pontoon-pier') ||
              catalog.find((i) => i.category === 'installations') ||
              null
            );
          });
        }}
      />

      {/* Top and Bottom Air-Warfare Centered RTS Plotter HUD */}
      <HUD
        selectedAirfacility={selectedAirfacility}
        isDesignatingCap={isDesignatingCap}
        onStartCapDesignation={handleStartCapDesignation}
        onCancelCap={handleCancelCap}
        sonobuoys={sonobuoys}
        isDesignatingSonobuoy={isDesignatingSonobuoy}
        onStartSonobuoyDesignation={handleStartSonobuoyDesignation}
        onCancelSonobuoy={handleCancelSonobuoy}
        onSelectUnitIds={(ids) => {
          engine.selectUnits(ids);
          setSelectedUnitIds([...engine.selectedUnitIds]);
        }}
        flagship={flagship}
        playerShips={playerShips}
        enemyShips={enemyShips}
        aircraft={aircraft}
        groundUnits={groundUnits}
        islands={islands}
        worldSize={engine.worldSize}
        era={era}
        onSetEra={handleSetEra}
        selectedUnits={selectedUnits}
        onLaunchModel={handleLaunchModel}
        onOrderSelected={handleOrderSelected}
        onStopUnits={handleStopUnits}
        onSetSpeed={handleSetSpeed}
        onSteer={handleSteer}
        onTriggerFlak={handleTriggerFlak}
        intel={intel}
        score={score}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenDockyard={() => setIsDockyardOpen(true)}
        onOpenAirPrep={() => setIsAirPrepOpen(true)}
        onOpenArmament={() => setIsArmamentOpen(true)}
        onOpenBattleLog={() => setIsBattleLogOpen(true)}
        combatLogs={combatLogs}
        gameSpeed={gameSpeed}
        isPaused={isPaused}
        onSetGameSpeed={handleSetGameSpeed}
        onTogglePause={handleTogglePause}
        activePayloads={activePayloads}
        onSelectPayload={handleSelectPayload}
        onMiniMapClick={(pos) => setExternalCameraTarget(pos)}
        cameraViewport={cameraViewport}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        airbasePlanes={engine.airbasePlanes}
        airbaseReplenishTimer={engine.airbaseReplenishTimer}
        convoyReinforceTimer={engine.convoyReinforceTimer}
        nextConvoyEscort={engine.nextConvoyEscort}
        resourcePoints={engine.resourcePoints}
        commandPointsPerSec={engine.commandPointsPerSec}
        totalCpEarned={engine.totalCpEarned}
        totalCpSpent={engine.totalCpSpent}
        casualties={engine.casualties}
        activeBannerAlerts={engine.activeBannerAlerts}
        activePlacementItem={activePlacementItem}
        continuousStamp={continuousStamp}
        onToggleContinuousStamp={() => setContinuousStamp((prev) => !prev)}
        sandboxStamp={sandboxStamp}
        onToggleSandboxStamp={() => setSandboxStamp((prev) => !prev)}
        onStartPlacement={(item) => setActivePlacementItem(item)}
        onCancelPlacement={() => setActivePlacementItem(null)}
        onPurchaseRequisition={(item, targetIslandId, customPos) => {
          const success = engine.purchaseRequisition(item, targetIslandId, customPos);
          setPlayerShips([...engine.playerShips]);
          setAircraft([...engine.aircraft]);
          setGroundUnits([...engine.groundUnits]);
          setIslands([...engine.islands]);
          return success;
        }}
        airfields={engine.getFriendlyAirfields().map((a) => ({
          id: a.id,
          name: a.name,
          isHQ: a.id === engine.hqAirfieldId,
          planes: engine.getAirfieldPool(a.id),
        }))}
        onTransferPlanes={(model, count, fromId, toId) => {
          engine.transferAircraft(model, count, fromId, toId);
          setAircraft([...engine.aircraft]);
          setPlayerShips([...engine.playerShips]);
        }}
        onLaunchAirbaseSortie={(model, count, payload, airfieldId) => {
          engine.launchAirbaseSortie(model, count, payload, undefined, airfieldId);
          setAircraft([...engine.aircraft]);
        }}
        onToggleTransportEmbark={(transportId) => {
          engine.toggleTransportEmbarkDisembark(transportId);
          setPlayerShips([...engine.playerShips]);
          setGroundUnits([...engine.groundUnits]);
        }}
        onTriggerLSMRocket={(lsmrId) => {
          engine.triggerLSMRocketBarrage(lsmrId);
          setPlayerShips([...engine.playerShips]);
        }}
        onBuildAirfield={(engineerId) => {
          engine.buildAirfield(engineerId);
          setPlayerShips([...engine.playerShips]);
        }}
        onUnloadAircraft={() => {
          engine.unloadSelectedAircraft();
          setAircraft([...engine.aircraft]);
          setGroundUnits([...engine.groundUnits]);
          setIslands([...engine.islands]);
        }}
      />

      {/* Tactical Operational Dispatch / Briefing */}
      <BriefingModal
        isOpen={isBriefingOpen}
        onClose={() => {
          setIsBriefingOpen(false);
        }}
        intel={intel}
        onStart={() => {
          setIsBriefingOpen(false);
          setIsAirPrepOpen(true);
        }}
        onQuickStart={() => {
          setIsBriefingOpen(false);
          engine.isPaused = false;
          setIsPaused(false);
        }}
      />

      {/* Pre-Battle Air Wing Loadout Preparation Modal */}
      <AirWingPrepModal
        isOpen={isAirPrepOpen}
        onClose={() => setIsAirPrepOpen(false)}
        era={era}
        intel={intel}
        onConfirmLoadout={handleConfirmAirWingLoadout}
      />

      {/* Mid-Battle Aircraft Armament / Payload Reconfiguration Modal */}
      <ArmamentModal
        isOpen={isArmamentOpen}
        onClose={() => setIsArmamentOpen(false)}
        era={era}
        activePayloads={activePayloads}
        onSelectPayload={handleSelectPayload}
      />

      {/* Tactical Battle Log Modal */}
      <BattleLogModal
        isOpen={isBattleLogOpen}
        onClose={() => setIsBattleLogOpen(false)}
        combatLogs={combatLogs}
        casualties={engine.casualties}
        resourceState={engine.getResourceState()}
        onClearLogs={() => {
          engine.combatLogs = [];
          setCombatLogs([]);
        }}
        era={engine.era}
      />

      {/* Full Theater Map Modal */}
      <TacticalMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        worldSize={engine.worldSize}
        islands={islands}
        playerShips={playerShips}
        alliedShips={engine.alliedShips}
        enemyShips={enemyShips}
        aircraft={aircraft}
        groundUnits={groundUnits}
        sonobuoys={sonobuoys}
        cameraViewport={cameraViewport}
        onFocusWorldPos={(pos) => {
          setExternalCameraTarget(pos);
          setIsMapOpen(false);
        }}
        sectorName={intel?.sectorName || 'Coral Atoll'}
        era={engine.era}
      />

      {/* Pearl Harbor Dockyard & Era Modernization */}
      <DockyardModal
        isOpen={isDockyardOpen}
        onClose={() => setIsDockyardOpen(false)}
        stars={score.stars}
        onSpendStars={handleSpendStars}
        playerShips={playerShips}
        onRepairShips={handleRepairShips}
        upgrades={upgrades}
        onUpgrade={handleApplyUpgrade}
        era={era}
        onSetEra={handleSetEra}
        canAdvance={engine.isVictory}
        onNextSector={handleNextSector}
      />

      {/* After-Action Debriefing / Victory / Defeat */}
      {isGameOverOpen && (
        <GameOverModal
          isVictory={isVictory}
          score={score}
          intel={intel}
          onNextSector={handleNextSector}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
