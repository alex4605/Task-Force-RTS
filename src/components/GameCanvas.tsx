import React, { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { VectorRenderer, Camera, OrderMarker } from '../game/renderer';
import { Vector2D, SelectionBox, RequisitionItem } from '../types/game';
import { dist, isPointInPolygon } from '../game/procedural';

export interface CameraViewportState {
  x: number;
  y: number;
  zoom: number;
  viewW: number;
  viewH: number;
}

interface GameCanvasProps {
  engine: GameEngine;
  onSelectUnits: (ids: string[]) => void;
  onToggleMap: () => void;
  externalCameraTarget?: Vector2D | null;
  onClearCameraTarget?: () => void;
  onCameraChange?: (cam: CameraViewportState) => void;
  onSelectAirfacility?: (
    facilityType: 'carrier' | 'airbase' | 'engineer_construction' | 'battalion_cp' | null,
    facilityId?: string
  ) => void;
  activePlacementItem?: RequisitionItem | null;
  onConfirmPlacement?: (item: RequisitionItem, worldPos: Vector2D) => void;
  onCancelPlacement?: () => void;
  onTogglePlacement?: () => void;
  isDesignatingCap?: boolean;
  onConfirmCapTarget?: (worldPos: Vector2D, box?: { x0: number; y0: number; x1: number; y1: number }) => void;
  onCancelCap?: () => void;
  isDesignatingSonobuoy?: boolean;
  onConfirmSonobuoyTarget?: (worldPos: Vector2D, keepActive?: boolean) => void;
  onCancelSonobuoy?: () => void;
  onTogglePause?: () => void;
  /** Called when the R key toggles the radar coverage layer. */
  onRadarLayerChange?: (on: boolean) => void;
  onCycleSpeed?: (delta: 1 | -1) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onSelectUnits,
  onToggleMap,
  externalCameraTarget,
  onClearCameraTarget,
  onCameraChange,
  onSelectAirfacility,
  activePlacementItem,
  onConfirmPlacement,
  onCancelPlacement,
  onTogglePlacement,
  isDesignatingCap = false,
  onConfirmCapTarget,
  onCancelCap,
  isDesignatingSonobuoy = false,
  onConfirmSonobuoyTarget,
  onCancelSonobuoy,
  onTogglePause,
  onRadarLayerChange,
  onCycleSpeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<VectorRenderer | null>(null);
  const cameraRef = useRef<Camera>({ x: 800, y: 3400, zoom: 0.65 });
  const cameraTargetRef = useRef<Vector2D | null>(null);
  const orderMarkersRef = useRef<OrderMarker[]>([]);
  const lastCamEmitRef = useRef<number>(0);
  const lastLeftClickRef = useRef<{ time: number; key: string }>({ time: 0, key: '' });

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
  /** World point where the CAP box drag began. */
  const capDragStartRef = useRef<Vector2D | null>(null);
  onConfirmCapTargetRef.current = onConfirmCapTarget;
  const onCancelCapRef = useRef(onCancelCap);
  onCancelCapRef.current = onCancelCap;

  // Sonobuoy Designation Refs
  const isDesignatingSonobuoyRef = useRef<boolean>(isDesignatingSonobuoy);
  isDesignatingSonobuoyRef.current = isDesignatingSonobuoy;
  const onConfirmSonobuoyTargetRef = useRef(onConfirmSonobuoyTarget);
  onConfirmSonobuoyTargetRef.current = onConfirmSonobuoyTarget;
  const onCancelSonobuoyRef = useRef(onCancelSonobuoy);
  onCancelSonobuoyRef.current = onCancelSonobuoy;
  const onTogglePauseRef = useRef(onTogglePause);
  onTogglePauseRef.current = onTogglePause;
  const onRadarLayerChangeRef = useRef(onRadarLayerChange);
  onRadarLayerChangeRef.current = onRadarLayerChange;
  const onCycleSpeedRef = useRef(onCycleSpeed);
  onCycleSpeedRef.current = onCycleSpeed;
  const onSelectUnitsRef = useRef(onSelectUnits);
  onSelectUnitsRef.current = onSelectUnits;
  const onCameraChangeRef = useRef(onCameraChange);
  onCameraChangeRef.current = onCameraChange;
  const lastGroupTapRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const pushOrderMarker = useCallback((pos: Vector2D, type: OrderMarker['type']) => {
    orderMarkersRef.current.push({
      pos: { x: pos.x, y: pos.y },
      type,
      age: 0,
      maxAge: 0.75,
    });
    if (orderMarkersRef.current.length > 16) {
      orderMarkersRef.current.shift();
    }
  }, []);

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

  // Glide camera smoothly to external target (e.g. from minimap or stronghold click)
  useEffect(() => {
    if (externalCameraTarget) {
      cameraTargetRef.current = { x: externalCameraTarget.x, y: externalCameraTarget.y };
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
      let manualPan = false;

      if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        cameraRef.current.y -= camSpeed;
        manualPan = true;
      }
      if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        cameraRef.current.y += camSpeed;
        manualPan = true;
      }
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        cameraRef.current.x -= camSpeed;
        manualPan = true;
      }
      if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        cameraRef.current.x += camSpeed;
        manualPan = true;
      }

      // Screen edge pan (within 18px of edge if cursor is inside canvas)
      const mx = mouseScreenPosRef.current.x;
      const my = mouseScreenPosRef.current.y;
      if (mx >= 0 && my >= 0 && mx <= canvas.width && my <= canvas.height && !selectionBoxRef.current.isActive) {
        const edgeMargin = 18;
        if (mx <= edgeMargin) {
          cameraRef.current.x -= camSpeed * 0.75;
          manualPan = true;
        }
        if (mx >= canvas.width - edgeMargin) {
          cameraRef.current.x += camSpeed * 0.75;
          manualPan = true;
        }
        if (my <= edgeMargin) {
          cameraRef.current.y -= camSpeed * 0.75;
          manualPan = true;
        }
        if (my >= canvas.height - edgeMargin) {
          cameraRef.current.y += camSpeed * 0.75;
          manualPan = true;
        }
      }

      if (manualPan) {
        cameraTargetRef.current = null;
      } else if (cameraTargetRef.current) {
        const alpha = 1 - Math.exp(-10 * dt);
        cameraRef.current.x += (cameraTargetRef.current.x - cameraRef.current.x) * alpha;
        cameraRef.current.y += (cameraTargetRef.current.y - cameraRef.current.y) * alpha;
        if (Math.hypot(cameraTargetRef.current.x - cameraRef.current.x, cameraTargetRef.current.y - cameraRef.current.y) < 1.5) {
          cameraRef.current.x = cameraTargetRef.current.x;
          cameraRef.current.y = cameraTargetRef.current.y;
          cameraTargetRef.current = null;
        }
      }

      // Clamp camera within world bounds
      cameraRef.current.x = Math.max(200, Math.min(engine.worldSize - 200, cameraRef.current.x));
      cameraRef.current.y = Math.max(200, Math.min(engine.worldSize - 200, cameraRef.current.y));

      // Report throttled camera viewport for minimap & theater plotter rectangle
      if (onCameraChangeRef.current && currentTime - lastCamEmitRef.current >= 90) {
        lastCamEmitRef.current = currentTime;
        onCameraChangeRef.current({
          x: cameraRef.current.x,
          y: cameraRef.current.y,
          zoom: cameraRef.current.zoom,
          viewW: canvas.width,
          viewH: canvas.height,
        });
      }

      // Update simulation & visual order markers
      engine.update(dt);
      renderer.updateTime(dt);
      renderer.setEra(engine.era);
      if (orderMarkersRef.current.length > 0) {
        for (const m of orderMarkersRef.current) {
          m.age += dt;
        }
        orderMarkersRef.current = orderMarkersRef.current.filter((m) => m.age < m.maxAge);
      }

      // Render Scene with Carrier Radar Sweep
      const flagship = engine.getFlagship();
      renderer.drawOcean(cameraRef.current, engine.worldSize, flagship ? flagship.pos : undefined);
      renderer.drawIslands(engine.islands, cameraRef.current, engine.worldSize);
      renderer.drawStrongholds(engine.islands, cameraRef.current);
      renderer.drawImpactScars(engine.impacts, cameraRef.current);
      if (engine.showRadarCoverage) renderer.drawRadarCoverage(engine.getRadarCoverage(), cameraRef.current);
      renderer.drawSonobuoys(engine.sonobuoys, cameraRef.current);
      renderer.drawShips(
        [...engine.playerShips, ...engine.enemyShips, ...(engine.alliedShips || [])],
        cameraRef.current,
        engine.selectedUnitIds
      );
      renderer.drawGroundWrecks(engine.groundWrecks, cameraRef.current);
      renderer.drawGroundUnits(engine.groundUnits, cameraRef.current, engine.selectedUnitIds);
      renderer.drawAircraft(engine.aircraft, cameraRef.current, engine.selectedUnitIds);
      renderer.drawProjectiles(engine.projectiles, cameraRef.current);
      renderer.drawImpacts(engine.impacts, cameraRef.current);
      renderer.drawParticles(engine.particles, cameraRef.current);
      // Draw Downed Pilot SAR Life Rafts
      renderer.drawLifeRafts(engine.lifeRafts, cameraRef.current);
      // Draw Tactical Nuclear Strike Screen Flash & Mushroom Cloud Detonations
      renderer.drawNuclearEffects(engine.nuclearFlash, engine.nuclearDetonations, cameraRef.current);
      // Draw RTS Command Ripple Markers
      renderer.drawOrderMarkers(orderMarkersRef.current, cameraRef.current);

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
        renderer.drawCapPreview(hoverWorldPosRef.current, cameraRef.current, capDragStartRef.current);
      }

      if (engine.isDesignatingRebase) {
        renderer.drawRebasePreview(hoverWorldPosRef.current, engine.findRebaseTarget(hoverWorldPosRef.current), cameraRef.current);
      }
      if (engine.isDesignatingEscort) {
        renderer.drawEscortPreview(hoverWorldPosRef.current, engine.findEscortCharge(hoverWorldPosRef.current), cameraRef.current);
      }
      // Selected aircraft's assigned CAP boxes and escort charges
      renderer.drawCapBoxes(engine.aircraft, engine.selectedUnitIds, cameraRef.current);

      // Draw Interactive Passive Sonobuoy Drop Preview
      if (isDesignatingSonobuoyRef.current) {
        renderer.drawSonobuoyPreview(
          hoverWorldPosRef.current,
          engine.getSonobuoyPreviewRadius(),
          cameraRef.current,
          engine.era
        );
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

  // Mouse Wheel Zoom-to-Cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cam = cameraRef.current;
    const worldBeforeX = cam.x + (sx - canvas.width / 2) / cam.zoom;
    const worldBeforeY = cam.y + (sy - canvas.height / 2) / cam.zoom;

    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
    const nextZoom = Math.max(0.12, Math.min(1.8, cam.zoom * zoomFactor));
    cam.zoom = nextZoom;
    cam.x = Math.max(200, Math.min(engine.worldSize - 200, worldBeforeX - (sx - canvas.width / 2) / nextZoom));
    cam.y = Math.max(200, Math.min(engine.worldSize - 200, worldBeforeY - (sy - canvas.height / 2) / nextZoom));
    cameraTargetRef.current = null;
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    // Interactive Sonobuoy Drop Designation Interceptor
    if (isDesignatingSonobuoyRef.current) {
      if (e.button === 0) {
        e.preventDefault();
        const worldPos = screenToWorld(e.clientX, e.clientY);
        onConfirmSonobuoyTargetRef.current?.(worldPos, e.shiftKey);
        return;
      } else if (e.button === 2) {
        e.preventDefault();
        onCancelSonobuoyRef.current?.();
        return;
      }
    }

    // Escort charge pick
    if (engine.isDesignatingEscort) {
      e.preventDefault();
      if (e.button === 0) engine.assignEscort(screenToWorld(e.clientX, e.clientY));
      engine.isDesignatingEscort = false;
      return;
    }

    // Rebase destination pick
    if (engine.isDesignatingRebase) {
      e.preventDefault();
      if (e.button === 0) engine.rebaseSelectedAircraft(screenToWorld(e.clientX, e.clientY));
      engine.isDesignatingRebase = false;
      return;
    }

    // Interactive CAP Area Designation Interceptor
    if (isDesignatingCapRef.current) {
      if (e.button === 0) {
        // Left button: start dragging out the CAP box (a plain click sets a point orbit on release)
        e.preventDefault();
        capDragStartRef.current = screenToWorld(e.clientX, e.clientY);
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
        pushOrderMarker(hitRaft.pos, 'rescue');
        engine.orderRescueRaft(hitRaft.id);
        return;
      }

      // 1. Check if right-clicked a transport craft (LCVP / LST / LCM-8 / LCAC / LPD)
      const hitTransport = engine.playerShips.find(
        (s) => (s.type === 'lcvp' || s.type === 'lst' || s.type === 'lcm8' || s.type === 'lcac' || s.type === 'lpd') && !s.isSunk && dist(worldPos, s.pos) < 65
      );

      const selectedGroundUnits = engine.groundUnits.filter(
        (u) => engine.selectedUnitIds.includes(u.id) && u.side === 'player' && !u.isDestroyed
      );

      if (hitTransport) {
        if (selectedGroundUnits.length > 0) {
          pushOrderMarker(hitTransport.pos, 'move');
          engine.toggleTransportEmbarkDisembark(hitTransport.id);
          return;
        } else if (engine.selectedUnitIds.includes(hitTransport.id)) {
          pushOrderMarker(hitTransport.pos, 'move');
          engine.toggleTransportEmbarkDisembark(hitTransport.id);
          return;
        }
      }

      // If a transport is selected and has troops, and player right-clicks near shore: disembark!
      const selectedTransports = engine.playerShips.filter(
        (s) => engine.selectedUnitIds.includes(s.id) && (s.type === 'lcvp' || s.type === 'lst' || s.type === 'lcm8' || s.type === 'lcac' || s.type === 'lpd') && !s.isSunk
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
          pushOrderMarker(worldPos, 'move');
          engine.toggleTransportEmbarkDisembark(trans.id);
          return;
        }
      }

      // 2. Check if right-clicked an enemy ground unit
      const hitEnemyGround = engine.groundUnits.find((u) => u.side === 'enemy' && !u.isDestroyed && dist(worldPos, u.pos) < 32);
      if (hitEnemyGround) {
        if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitEnemyGround.pos, 'attack');
        engine.issueOrderToSelected({
          type: 'attack',
          targetPos: hitEnemyGround.pos,
          targetId: hitEnemyGround.id,
        });
        return;
      }

      // 3. Check if right-clicked an enemy ship (Enemy submarines cannot be targeted while undetected under Fog of War)
      const hitEnemyShip = engine.enemyShips.find(
        (s) => !s.isSunk && (!engine.isSubmarine(s) || Boolean(s.isSpotted)) && dist(worldPos, s.pos) < 55
      );
      if (hitEnemyShip) {
        if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitEnemyShip.pos, 'attack');
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
        if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitEnemyPlane.pos, 'attack');
        engine.issueOrderToSelected({
          type: 'attack',
          targetPos: hitEnemyPlane.pos,
          targetId: hitEnemyPlane.id,
        });
        return;
      }

      // 5. Check if right-clicked an enemy installation or CP
      for (const isl of engine.islands) {
        const hitEnemyInst = isl.installations.find((i) => !i.isDestroyed && i.side === 'enemy' && dist(worldPos, i.pos) < 40);
        if (hitEnemyInst) {
          if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitEnemyInst.pos, 'attack');
          engine.issueOrderToSelected({
            type: 'attack',
            targetPos: hitEnemyInst.pos,
            targetId: hitEnemyInst.id,
          });
          return;
        }
      }

      // 6. Check if right-clicked a friendly ship (Escort / CAP friendly ship)
      const hitFriendlyShip = engine.playerShips.find((s) => !s.isSunk && dist(worldPos, s.pos) < 55);
      if (hitFriendlyShip) {
        if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitFriendlyShip.pos, 'patrol');
        engine.issueOrderToSelected({
          type: 'patrol',
          targetPos: hitFriendlyShip.pos,
          patrolOrigin: hitFriendlyShip.pos,
        });
        return;
      }

      // 6b. Check if right-clicked a friendly or allied aircraft (CAP / Escort)
      const hitFriendlyPlane = engine.aircraft.find((a) => (a.side === 'player' || a.side === 'allied') && a.state !== 'shot_down' && dist(worldPos, a.pos) < 35);
      if (hitFriendlyPlane) {
        if (engine.selectedUnitIds.length > 0) pushOrderMarker(hitFriendlyPlane.pos, 'patrol');
        engine.issueOrderToSelected({
          type: 'patrol',
          targetPos: hitFriendlyPlane.pos,
          patrolOrigin: hitFriendlyPlane.pos,
        });
        return;
      }

      // 7. Default: RTS Move to coordinate
      if (engine.selectedUnitIds.length > 0) pushOrderMarker(worldPos, 'move');
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
      cameraTargetRef.current = null;
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
    if (capDragStartRef.current && e.button === 0) {
      const a = capDragStartRef.current;
      capDragStartRef.current = null;
      const b = screenToWorld(e.clientX, e.clientY);
      const minSide = 24 / cameraRef.current.zoom;
      if (Math.abs(b.x - a.x) > minSide && Math.abs(b.y - a.y) > minSide) {
        const box = { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) };
        onConfirmCapTargetRef.current?.({ x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 }, box);
      } else {
        onConfirmCapTargetRef.current?.(a);
      }
      return;
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (selectionBoxRef.current.isActive) {
      const box = selectionBoxRef.current;
      box.isActive = false;

      const deltaX = Math.abs(box.currentX - box.startX);
      const deltaY = Math.abs(box.currentY - box.startY);

      // Single Click (< 6px drag) — supports double-click same-type selection
      if (deltaX < 6 && deltaY < 6) {
        const worldPos = screenToWorld(box.startX, box.startY);
        const now = performance.now();

        // Check if clicked player aircraft
        const hitPlane = engine.aircraft.find((a) => a.side === 'player' && a.state !== 'shot_down' && dist(worldPos, a.pos) < 32);
        if (hitPlane) {
          const clickKey = `plane:${hitPlane.model}`;
          if (!e.shiftKey && lastLeftClickRef.current.key === clickKey && now - lastLeftClickRef.current.time < 360) {
            const samePlanes = engine.aircraft
              .filter((a) => a.side === 'player' && a.state !== 'shot_down' && a.model === hitPlane.model)
              .map((a) => a.id);
            engine.selectUnits(samePlanes, false);
          } else {
            engine.selectUnits([hitPlane.id], e.shiftKey);
          }
          lastLeftClickRef.current = { time: now, key: clickKey };
          onSelectUnits(engine.selectedUnitIds);
          onSelectAirfacility?.(null);
          return;
        }

        // Check if clicked player ground unit
        const hitGround = engine.groundUnits.find(
          (u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && dist(worldPos, u.pos) < 28
        );
        if (hitGround) {
          const clickKey = `ground:${hitGround.type}`;
          if (!e.shiftKey && lastLeftClickRef.current.key === clickKey && now - lastLeftClickRef.current.time < 360) {
            const sameGround = engine.groundUnits
              .filter((u) => u.side === 'player' && !u.isDestroyed && !u.embarkedInShipId && u.type === hitGround.type)
              .map((u) => u.id);
            engine.selectUnits(sameGround, false);
          } else {
            engine.selectUnits([hitGround.id], e.shiftKey);
          }
          lastLeftClickRef.current = { time: now, key: clickKey };
          onSelectUnits(engine.selectedUnitIds);
          if (hitGround.type === 'usmc_engineer') {
            onSelectAirfacility?.('engineer_construction', hitGround.id);
          } else {
            onSelectAirfacility?.(null);
          }
          return;
        }

        // Check if clicked player ship
        const hitShip = engine.playerShips.find((s) => !s.isSunk && dist(worldPos, s.pos) < 45);
        if (hitShip) {
          const clickKey = `ship:${hitShip.type}`;
          if (!e.shiftKey && lastLeftClickRef.current.key === clickKey && now - lastLeftClickRef.current.time < 360) {
            const sameShips = engine.playerShips
              .filter((s) => !s.isSunk && s.type === hitShip.type)
              .map((s) => s.id);
            engine.selectUnits(sameShips, false);
          } else {
            engine.selectUnits([hitShip.id], e.shiftKey);
          }
          lastLeftClickRef.current = { time: now, key: clickKey };
          onSelectUnits(engine.selectedUnitIds);
          if (hitShip.flightDeck || hitShip.type === 'carrier' || hitShip.type === 'cve' || hitShip.type === 'cv63' || hitShip.type === 'cvn' || hitShip.type === 'lph' || hitShip.type === 'lha_tarawa') {
            onSelectAirfacility?.('carrier', hitShip.id);
          } else {
            onSelectAirfacility?.(null);
          }
          return;
        }

        // Check if clicked an installation (Battalion CP or Airfield)
        for (const isl of engine.islands) {
          const hitBattalionCp = isl.installations.find(
            (inst) => (inst.type === 'battalion_cp' || inst.type === 'command_post') && !inst.isDestroyed && dist(worldPos, inst.pos) < 85
          );
          if (hitBattalionCp) {
            onSelectAirfacility?.('battalion_cp', hitBattalionCp.id);
            return;
          }

          const hitAirfieldInst = isl.installations.find(
            (inst) => (inst.type === 'airfield' || inst.type === 'radar_station') && !inst.isDestroyed && dist(worldPos, inst.pos) < 65
          );
          const hasAirfield = isl.installations.some((i) => i.type === 'airfield' && !i.isDestroyed);
          if (hitAirfieldInst || ((isl.isFriendlyBase || hasAirfield) && isPointInPolygon(worldPos, isl.points))) {
            // Open the stock of the airfield that was clicked (or the island's nearest friendly one)
            const field =
              (hitAirfieldInst?.type === 'airfield' && hitAirfieldInst.side === 'player' ? hitAirfieldInst : undefined) ??
              isl.installations
                .filter((i) => i.type === 'airfield' && i.side === 'player' && !i.isDestroyed)
                .sort((a, b) => dist(worldPos, a.pos) - dist(worldPos, b.pos))[0];
            onSelectAirfacility?.('airbase', field?.id ?? isl.id);
            return;
          }
        }

        // Empty ocean click: clear selection unless shift pressed
        lastLeftClickRef.current = { time: 0, key: '' };
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
        (s) =>
          engine.selectedUnitIds.includes(s.id) &&
          (s.type === 'carrier' || s.type === 'cve' || s.type === 'cv63' || s.type === 'cvn' || s.type === 'lph' || s.type === 'lha_tarawa')
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      keysDownRef.current[e.key] = true;

      if (e.key === 'Escape') {
        if (engine.isDesignatingRebase || engine.isDesignatingEscort) {
          e.preventDefault();
          engine.isDesignatingRebase = false;
          engine.isDesignatingEscort = false;
          return;
        }
        if (isDesignatingSonobuoyRef.current) {
          e.preventDefault();
          onCancelSonobuoyRef.current?.();
          return;
        }
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

      // Control Groups (Ctrl+1..4 to assign, 1..4 to recall, double-tap to center camera)
      if (e.key >= '1' && e.key <= '4') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const count = engine.assignControlGroup(e.key);
          if (count > 0) {
            engine.addCombatLog({
              category: 'naval',
              sourceSide: 'player',
              sourceName: `第 ${e.key} 特遣編隊`,
              targetName: `${count} 個單位`,
              actionType: 'recon_spotted',
              text: `🎖️【編隊設定】已將 ${count} 個作戰單位編為快捷編組 [${e.key}]（按 ${e.key} 選取 · 連按兩下跳轉視角）。`,
            });
          }
          return;
        } else if (!e.altKey) {
          const recalled = engine.recallControlGroup(e.key);
          if (recalled.length > 0) {
            onSelectUnitsRef.current(recalled);
            const now = performance.now();
            if (lastGroupTapRef.current.key === e.key && now - lastGroupTapRef.current.time < 350) {
              const targetPos = engine.getControlGroupTargetPos(e.key);
              if (targetPos) {
                cameraTargetRef.current = { x: targetPos.x, y: targetPos.y };
              }
            }
            lastGroupTapRef.current = { key: e.key, time: now };
          }
          return;
        }
      }

      if (e.key === 'Backspace' || e.key === 'Pause') {
        e.preventDefault();
        onTogglePauseRef.current?.();
        return;
      }

      if (e.key === '[') {
        onCycleSpeedRef.current?.(-1);
        return;
      }
      if (e.key === ']') {
        onCycleSpeedRef.current?.(1);
        return;
      }

      if (e.key === 'F3' || e.code === 'F3') {
        e.preventDefault();
        onTogglePlacementRef.current?.();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onTogglePauseRef.current?.();
      } else if (e.key === 'f' || e.key === 'F') {
        // Focus Camera on Selected Units or Flagship Carrier
        const flagship = engine.getFlagship();
        const selectedShip = engine.playerShips.find((s) => engine.selectedUnitIds.includes(s.id));
        const selectedPlane = engine.aircraft.find((a) => engine.selectedUnitIds.includes(a.id));
        const selectedGround = engine.groundUnits.find((u) => engine.selectedUnitIds.includes(u.id));
        const focusTarget = selectedShip || selectedPlane || selectedGround || flagship;
        if (focusTarget) {
          cameraTargetRef.current = { x: focusTarget.pos.x, y: focusTarget.pos.y };
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
      } else if (e.key === 'r' || e.key === 'R') {
        // Radar coverage layer
        engine.showRadarCoverage = !engine.showRadarCoverage;
        onRadarLayerChangeRef.current?.(engine.showRadarCoverage);
      } else if (e.key === 'v' || e.key === 'V') {
        // Escort: pick the friendly aircraft the selected fighters protect
        if (engine.aircraft.some((a) => a.side === 'player' && a.state !== 'shot_down' && engine.selectedUnitIds.includes(a.id))) {
          engine.isDesignatingEscort = !engine.isDesignatingEscort;
          engine.isDesignatingRebase = false;
        }
      } else if (e.key === 't' || e.key === 'T') {
        // Rebase: pick the airfield or carrier the selected aircraft divert to
        if (engine.aircraft.some((a) => a.side === 'player' && a.state !== 'shot_down' && engine.selectedUnitIds.includes(a.id))) {
          engine.isDesignatingRebase = !engine.isDesignatingRebase;
          engine.isDesignatingEscort = false;
        }
      } else if (e.key === 'p' || e.key === 'P') {
        engine.issueOrderToSelected({ type: 'patrol' });
      } else if (e.key === 'u' || e.key === 'U') {
        engine.unloadSelectedAircraft();
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
