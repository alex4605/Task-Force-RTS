import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { VectorRenderer, Camera } from '../game/renderer';
import { Vector2D, SelectionBox, RequisitionItem } from '../types/game';
import { dist, isPointInPolygon } from '../game/procedural';

interface GameCanvasProps {
  engine: GameEngine;
  onSelectUnits: (ids: string[]) => void;
  onToggleMap: () => void;
  externalCameraTarget?: Vector2D | null;
  onClearCameraTarget?: () => void;
  onSelectAirfacility?: (
    facilityType: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | null,
    facilityId?: string
  ) => void;
  activePlacementItem?: RequisitionItem | null;
  onConfirmPlacement?: (item: RequisitionItem, worldPos: Vector2D) => void;
  onCancelPlacement?: () => void;
  onTogglePlacement?: () => void;
  isDesignatingCap?: boolean;
  onConfirmCapTarget?: (worldPos: Vector2D) => void;
  onCancelCap?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onSelectUnits,
  onToggleMap,
  externalCameraTarget,
  onClearCameraTarget,
  onSelectAirfacility,
  activePlacementItem,
  onConfirmPlacement,
  onCancelPlacement,
  onTogglePlacement,
  isDesignatingCap = false,
  onConfirmCapTarget,
  onCancelCap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<VectorRenderer | null>(null);
  const cameraRef = useRef<Camera>({ x: 800, y: 3400, zoom: 0.65 });

  // Keyboard pan keys state
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Mouse pan drag state (Middle click or Alt + drag)
  const isPanningRef = useRef<boolean>(false);
  const lastPanPosRef = useRef<Vector2D>({ x: 0, y: 0 });

  // Mouse screen coordinate (for edge scroll)
  const mouseScreenPosRef = useRef<Vector2D>({ x: -1, y: -1 });

  // RTS Selection Box State
  const selectionBoxRef = useRef<SelectionBox>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
  });

  // Active Requisition / Pier Placement Ref
  const activePlacementItemRef = useRef<RequisitionItem | null>(activePlacementItem || null);
  activePlacementItemRef.current = activePlacementItem || null;
  const hoverWorldPosRef = useRef<Vector2D>({ x: 0, y: 0 });

  const onTogglePlacementRef = useRef(onTogglePlacement);
  onTogglePlacementRef.current = onTogglePlacement;
  const onCancelPlacementRef = useRef(onCancelPlacement);
  onCancelPlacementRef.current = onCancelPlacement;
  const onConfirmPlacementRef = useRef(onConfirmPlacement);
  onConfirmPlacementRef.current = onConfirmPlacement;

  // CAP Designation Refs
  const isDesignatingCapRef = useRef<boolean>(isDesignatingCap);
  isDesignatingCapRef.current = isDesignatingCap;
  const onConfirmCapTargetRef = useRef(onConfirmCapTarget);
  onConfirmCapTargetRef.current = onConfirmCapTarget;
  const onCancelCapRef = useRef(onCancelCap);
  onCancelCapRef.current = onCancelCap;

  useEffect(() => {
    if (activePlacementItem) {
      hoverWorldPosRef.current = { x: cameraRef.current.x, y: cameraRef.current.y };
    }
  }, [activePlacementItem]);

  const screenToWorld = useCallback((screenX: number, screenY: number): Vector2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    const cam = cameraRef.current;
    const worldX = cam.x + (x - canvas.width / 2) / cam.zoom;
    const worldY = cam.y + (y - canvas.height / 2) / cam.zoom;
    return { x: worldX, y: worldY };
  }, []);

  // Jump camera to external target (e.g. from minimap click)
  useEffect(() => {
    if (externalCameraTarget) {
      cameraRef.current.x = externalCameraTarget.x;
      cameraRef.current.y = externalCameraTarget.y;
      if (onClearCameraTarget) onClearCameraTarget();
    }
  }, [externalCameraTarget, onClearCameraTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new VectorRenderer(ctx);
    rendererRef.current = renderer;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderer.setSize(canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const flagship = engine.getFlagship();
    if (flagship) {
      cameraRef.current.x = flagship.pos.x;
      cameraRef.current.y = flagship.pos.y;
    }

    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // ══════════════════════════════════════════════════════════
      // CAMERA MOVEMENT: WASD / ARROW KEYS & EDGE PAN
      // ══════════════════════════════════════════════════════════
      const camSpeed = (950 / cameraRef.current.zoom) * dt;
      const keys = keysDownRef.current;

      if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        cameraRef.current.y -= camSpeed;
      }
      if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        cameraRef.current.y += camSpeed;
      }
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        cameraRef.current.x -= camSpeed;
      }
      if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        cameraRef.current.x += camSpeed;
      }

      // Screen edge pan (within 18px of edge if cursor is inside canvas)
      const mx = mouseScreenPosRef.current.x;
      const my = mouseScreenPosRef.current.y;
      if (mx >= 0 && my >= 0 && mx <= canvas.width && my <= canvas.height && !selectionBoxRef.current.isActive) {
        const edgeMargin = 18;
        if (mx <= edgeMargin) cameraRef.current.x -= camSpeed * 0.75;
        if (mx >= canvas.width - edgeMargin) cameraRef.current.x += camSpeed * 0.75;
        if (my <= edgeMargin) cameraRef.current.y -= camSpeed * 0.75;
        if (my >= canvas.height - edgeMargin) cameraRef.current.y += camSpeed * 0.75;
      }

      // Clamp camera within world bounds
      cameraRef.current.x = Math.max(200, Math.min(engine.worldSize - 200, cameraRef.current.x));
      cameraRef.current.y = Math.max(200, Math.min(engine.worldSize - 200, cameraRef.current.y));

      // Update simulation
      engine.update(dt);
      renderer.updateTime(dt);

      // Render Scene with Carrier Radar Sweep
      const flagship = engine.getFlagship();
      renderer.drawOcean(cameraRef.current, engine.worldSize, flagship ? flagship.pos : undefined);
      renderer.drawIslands(engine.islands, cameraRef.current);
      renderer.drawStrongholds(engine.islands, cameraRef.current);
      renderer.drawShips(
        [...engine.playerShips, ...engine.enemyShips],
        cameraRef.current,
        engine.selectedUnitIds
      );
      renderer.drawGroundUnits(engine.groundUnits, cameraRef.current, engine.selectedUnitIds);
      renderer.drawAircraft(engine.aircraft, cameraRef.current, engine.selectedUnitIds);
      renderer.drawProjectiles(engine.projectiles, cameraRef.current);
      renderer.drawParticles(engine.particles, cameraRef.current);
      // Draw Downed Pilot SAR Life Rafts
      renderer.drawLifeRafts(engine.lifeRafts, cameraRef.current);
      // Draw Tactical Nuclear Strike Screen Flash & Mushroom Cloud Detonations
      renderer.drawNuclearEffects(engine.nuclearFlash, engine.nuclearDetonations, cameraRef.current);

      // Draw Placement Ghost Blueprint (Pier, Dockyard, Coastal Installation)
      if (activePlacementItemRef.current) {
        renderer.drawPlacementGhost(
          activePlacementItemRef.current,
          hoverWorldPosRef.current,
          cameraRef.current,
          engine.islands
        );
      }

      // Draw Interactive Tactical CAP Area Designation Preview
      if (isDesignatingCapRef.current) {
        renderer.drawCapPreview(hoverWorldPosRef.current, cameraRef.current);
      }

      // Draw RTS Screen-Space Drag Box
      renderer.drawSelectionBox(selectionBoxRef.current);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [engine]);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
    cameraRef.current.zoom = Math.max(0.12, Math.min(1.8, cameraRef.current.zoom * zoomFactor));
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Interactive CAP Area Designation Interceptor
    if (isDesignatingCapRef.current) {
      if (e.button === 0) {
        // Left click: confirm CAP area
        e.preventDefault();
        const worldPos = screenToWorld(e.clientX, e.clientY);
        onConfirmCapTargetRef.current?.(worldPos);
        return;
      } else if (e.button === 2) {
        // Right click: cancel CAP mode
        e.preventDefault();
        onCancelCapRef.current?.();
        return;
      }
    }

    // Interactive Pier / Installation Placement Interceptor
    if (activePlacementItemRef.current) {
      if (e.button === 0) {
        // Left click: confirm placement
        e.preventDefault();
        const worldPos = screenToWorld(e.clientX, e.clientY);
        onConfirmPlacementRef.current?.(activePlacementItemRef.current, worldPos);
        return;
      } else if (e.button === 2) {
        // Right click: cancel placement
        e.preventDefault();
        onCancelPlacementRef.current?.();
        return;
      }
    }

    // Middle Mouse Click (Wheel Click) or Alt + Left Click: Drag Pan Camera
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      isPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Right Click: RTS Command (Move, Attack, Escort, Embark, Disembark, SAR Rescue)
    if (e.button === 2) {
      e.preventDefault();
      const worldPos = screenToWorld(e.clientX, e.clientY);

      // 0. Check if right-clicked a downed pilot Life Raft (Era 3 SAR rescue!)
      const hitRaft = engine.lifeRafts.find((r) => !r.rescued && dist(worldPos, r.pos) < 55);
      if (hitRaft) {
        engine.orderRescueRaft(hitRaft.id);
        return;
      }

      // 1. Check if right-clicked a transport craft (LCVP / LST)
      const hitTransport = engine.playerShips.find(
        (s) => (s.type === 'lcvp' || s.type === 'lst') && !s.isSunk && dist(worldPos, s.pos) < 65
      );

      const selectedGroundUnits = engine.groundUnits.filter(
        (u) => engine.selectedUnitIds.includes(u.id) && u.side === 'player' && !u.isDestroyed
      );

      if (hitTransport) {
        if (selectedGroundUnits.length > 0) {
          // Embark selected troops onto this transport
          engine.toggleTransportEmbarkDisembark(hitTransport.id);
          return;
        } else if (engine.selectedUnitIds.includes(hitTransport.id)) {
          // Transport right-clicking itself: toggle embark/disembark
          engine.toggleTransportEmbarkDisembark(hitTransport.id);
          return;
        }
      }

      // If a transport is selected and has troops, and player right-clicks near shore: disembark!
      const selectedTransports = engine.playerShips.filter(
        (s) => engine.selectedUnitIds.includes(s.id) && (s.type === 'lcvp' || s.type === 'lst') && !s.isSunk
      );
      if (selectedTransports.length > 0) {
        const trans = selectedTransports[0];
        const hasCargo = trans.embarkedUnitIds && trans.embarkedUnitIds.length > 0;
        let nearIsland = false;
        for (const isl of engine.islands) {
          if (dist(worldPos, isl.center) < isl.radius + 350) {
            nearIsland = true;
            break;
          }
        }
        if (hasCargo && nearIsland && dist(trans.pos, worldPos) < 480) {
          engine.toggleTransportEmbarkDisembark(trans.id);
          return;
        }
      }

      // 2. Check if right-clicked an enemy ground unit
      const hitEnemyGround = engine.groundUnits.find((u) => u.side === 'enemy' && !u.isDestroyed && dist(worldPos, u.pos) < 32);
      if (hitEnemyGround) {
        engine.issueOrderToSelected({
          type: 'attack',
          targetPos: hitEnemyGround.pos,
          targetId: hitEnemyGround.id,
        });
        return;
      }

      // 3. Check if right-clicked an enemy ship
      const hitEnemyShip = engine.enemyShips.find((s) => !s.isSunk && dist(worldPos, s.pos) < 55);
      if (hitEnemyShip) {
        engine.issueOrderToSelected({
          type: 'attack',
          targetPos: hitEnemyShip.pos,
          targetId: hitEnemyShip.id,
        });
        return;
      }

      // 4. Check if right-clicked an enemy aircraft
      const hitEnemyPlane = engine.aircraft.find((a) => a.side === 'enemy' && a.state !== 'shot_down' && dist(worldPos, a.pos) < 35);
      if (hitEnemyPlane) {
        engine.issueOrderToSelected({
          type: 'attack',
          targetPos: hitEnemyPlane.pos,
          targetId: hitEnemyPlane.id,
        });
        return;
      }

      // 5. Check if right-clicked an enemy installation or CP
      for (const isl of engine.islands) {
        const hitInst = isl.installations.find((i) => !i.isDestroyed && dist(worldPos, i.pos) < 40);
        if (hitInst) {
          engine.issueOrderToSelected({
            type: 'attack',
            targetPos: hitInst.pos,
            targetId: hitInst.id,
          });
          return;
        }
      }

      // 6. Check if right-clicked a friendly ship (Escort / CAP friendly ship)
      const hitFriendlyShip = engine.playerShips.find((s) => !s.isSunk && dist(worldPos, s.pos) < 55);
      if (hitFriendlyShip) {
        engine.issueOrderToSelected({
          type: 'patrol',
          targetPos: hitFriendlyShip.pos,
          patrolOrigin: hitFriendlyShip.pos,
        });
        return;
      }

      // 7. Default: RTS Move to coordinate
      engine.issueOrderToSelected({
        type: 'move',
        targetPos: worldPos,
      });
      return;
    }

    // Left Click: RTS Drag Box or Unit Selection
    if (e.button === 0) {
      selectionBoxRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isActive: true,
      };
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    mouseScreenPosRef.current = { x: e.clientX, y: e.clientY };
    hoverWorldPosRef.current = screenToWorld(e.clientX, e.clientY);

    if (isPanningRef.current) {
      const dx = (e.clientX - lastPanPosRef.current.x) / cameraRef.current.zoom;
      const dy = (e.clientY - lastPanPosRef.current.y) / cameraRef.current.zoom;
      cameraRef.current.x -= dx;
      cameraRef.current.y -= dy;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (selectionBoxRef.current.isActive) {
      selectionBoxRef.current.currentX = e.clientX;
      selectionBoxRef.current.currentY = e.clientY;
    }
  };

  // Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (selectionBoxRef.current.isActive) {
      const box = selectionBoxRef.current;
      box.isActive = false;

      const deltaX = Math.abs(box.currentX - box.startX);
      const deltaY = Math.abs(box.currentY - box.startY);

      // Single Click (< 6px drag)
      if (deltaX < 6 && deltaY < 6) {
        const worldPos = screenToWorld(box.startX, box.startY);

        // Check if clicked player aircraft
        const hitPlane = engine.aircraft.find((a) => a.side === 'player' && a.state !== 'shot_down' && dist(worldPos, a.pos) < 32);
        if (hitPlane) {
          engine.selectUnits([hitPlane.id], e.shiftKey);
          onSelectUnits(engine.selectedUnitIds);
          onSelectAirfacility?.(null);
          return;
        }

        // Check if clicked player ground unit
        const hitGround = engine.groundUnits.find(
          (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(worldPos, u.pos) < 28
        );
        if (hitGround) {
          engine.selectUnits([hitGround.id], e.shiftKey);
          onSelectUnits(engine.selectedUnitIds);
          if (hitGround.type === 'usmc_engineer') {
            // 工兵部隊：只能打開建造選單
            onSelectAirfacility?.('engineer_construction', hitGround.id);
          } else {
            onSelectAirfacility?.(null);
          }
          return;
        }

        // Check if clicked player ship
        const hitShip = engine.playerShips.find((s) => !s.isSunk && dist(worldPos, s.pos) < 45);
        if (hitShip) {
          engine.selectUnits([hitShip.id], e.shiftKey);
          onSelectUnits(engine.selectedUnitIds);
          if (hitShip.type === 'carrier' || hitShip.type === 'cve') {
            // 航母：只能顯示從該艦起飛的飛機
            onSelectAirfacility?.('carrier', hitShip.id);
          } else {
            onSelectAirfacility?.(null);
          }
          return;
        }

        // Check if clicked an installation (Battalion CP or Airfield)
        for (const isl of engine.islands) {
          // 1. 營指揮所 (Battalion CP): 出現呼叫支援選單，並在該營指揮所旁 Spawn 陸地單位
          const hitBattalionCp = isl.installations.find(
            (inst) => (inst.type === 'battalion_cp' || inst.type === 'command_post') && !inst.isDestroyed && dist(worldPos, inst.pos) < 60
          );
          if (hitBattalionCp) {
            onSelectAirfacility?.('battalion_cp', hitBattalionCp.id);
            return;
          }

          // 2. 機場 (Airfield): 只能打開陸基飛機選單
          const hitAirfieldInst = isl.installations.find(
            (inst) => (inst.type === 'airfield' || inst.type === 'radar_station') && !inst.isDestroyed && dist(worldPos, inst.pos) < 55
          );
          const hasAirfield = isl.installations.some((i) => i.type === 'airfield' && !i.isDestroyed);
          if (hitAirfieldInst || ((isl.isFriendlyBase || hasAirfield) && isPointInPolygon(worldPos, isl.points))) {
            onSelectAirfacility?.('airbase', isl.id);
            return;
          }
        }

        // Empty ocean click: clear selection unless shift pressed
        if (!e.shiftKey) {
          engine.clearSelection();
          onSelectUnits([]);
          onSelectAirfacility?.(null);
        }
        return;
      }

      // Drag Box Selection
      const p1 = screenToWorld(Math.min(box.startX, box.currentX), Math.min(box.startY, box.currentY));
      const p2 = screenToWorld(Math.max(box.startX, box.currentX), Math.max(box.startY, box.currentY));

      engine.selectUnitsInBox(p1.x, p1.y, p2.x, p2.y, e.shiftKey);
      onSelectUnits(engine.selectedUnitIds);
      const hasEngineerInBox = engine.groundUnits.some(
        (u) => engine.selectedUnitIds.includes(u.id) && u.type === 'usmc_engineer'
      );
      const hasCarrierInBox = engine.playerShips.some(
        (s) => engine.selectedUnitIds.includes(s.id) && (s.type === 'carrier' || s.type === 'cve')
      );
      if (hasEngineerInBox) {
        onSelectAirfacility?.('engineer_construction');
      } else if (hasCarrierInBox) {
        onSelectAirfacility?.('carrier');
      } else {
        onSelectAirfacility?.(null);
      }
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key] = true;

      if (e.key === 'Escape') {
        if (isDesignatingCapRef.current) {
          e.preventDefault();
          onCancelCapRef.current?.();
          return;
        }
        if (activePlacementItemRef.current) {
          e.preventDefault();
          onCancelPlacementRef.current?.();
          return;
        }
      }

      if (e.key === 'F3' || e.code === 'F3') {
        e.preventDefault();
        onTogglePlacementRef.current?.();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        engine.triggerFleetFlakBarrage();
      } else if (e.key === 'f' || e.key === 'F') {
        // Focus Camera on Selected Units or Flagship Carrier
        const flagship = engine.getFlagship();
        const selectedShip = engine.playerShips.find((s) => engine.selectedUnitIds.includes(s.id));
        const selectedPlane = engine.aircraft.find((a) => engine.selectedUnitIds.includes(a.id));
        const focusTarget = selectedShip || selectedPlane || flagship;
        if (focusTarget) {
          cameraRef.current.x = focusTarget.pos.x;
          cameraRef.current.y = focusTarget.pos.y;
        }
      } else if (e.key === 'x' || e.key === 'X') {
        // Stop / Halt all selected ships
        engine.stopUnits();
      } else if (e.key === 'b' || e.key === 'B') {
        // If units are selected, RTB; if no units are selected, toggle facility stamping!
        if (engine.selectedUnitIds.length === 0) {
          e.preventDefault();
          onTogglePlacementRef.current?.();
        } else {
          engine.issueOrderToSelected({ type: 'rtb' });
        }
      } else if (e.key === 'p' || e.key === 'P') {
        engine.issueOrderToSelected({ type: 'patrol' });
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'Tab') {
        e.preventDefault();
        onToggleMap();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onToggleMap]);

  return (
    <canvas
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 w-full h-full cursor-crosshair block"
    />
  );
};
