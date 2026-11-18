import React, { useRef, useEffect } from 'react';
import { Island, Ship, Aircraft, GroundUnit, Era, Sonobuoy, Vector2D } from '../types/game';
import { CameraViewportState } from './GameCanvas';
import { X, Radio } from 'lucide-react';

import { Language } from '../game/i18n';

interface TacticalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldSize: number;
  islands: Island[];
  playerShips: Ship[];
  alliedShips?: Ship[];
  enemyShips: Ship[];
  aircraft: Aircraft[];
  groundUnits?: GroundUnit[];
  sonobuoys?: Sonobuoy[];
  cameraViewport?: CameraViewportState | null;
  onFocusWorldPos?: (pos: Vector2D) => void;
  sectorName: string;
  lang?: Language;
  era?: Era;
}

export const TacticalMapModal: React.FC<TacticalMapModalProps> = ({
  isOpen,
  onClose,
  worldSize,
  islands,
  playerShips,
  alliedShips = [],
  enemyShips,
  aircraft,
  groundUnits = [],
  sonobuoys = [],
  cameraViewport = null,
  onFocusWorldPos,
  sectorName,
  lang = 'zh',
  era = 'era1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = w / worldSize;

    // Draw Dark Theater Chart
    ctx.fillStyle = '#06101E';
    ctx.fillRect(0, 0, w, h);

    // Nautical Grid
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 0; x <= worldSize; x += 600) {
      const cx = x * scale;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
    }
    for (let y = 0; y <= worldSize; y += 600) {
      const cy = y * scale;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Islands
    for (const island of islands) {
      ctx.fillStyle = 'rgba(16, 40, 64, 0.9)';
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let i = 0; i < island.points.length; i++) {
        const p = island.points[i];
        const px = p.x * scale;
        const py = p.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Island name
      ctx.fillStyle = 'rgba(144, 202, 249, 0.8)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(island.name, island.center.x * scale, (island.center.y - island.radius - 8) * scale);

      // Installations with authentic NATO APP-6 Tactical Military Symbols
      for (const inst of island.installations) {
        if (inst.isDestroyed) continue;
        const ix = inst.pos.x * scale;
        const iy = inst.pos.y * scale;

        const isPlayer = inst.side === 'player' || island.isFriendlyBase;
        const boxFill = isPlayer ? 'rgba(33, 150, 243, 0.65)' : 'rgba(239, 83, 80, 0.6)';
        const boxStroke = isPlayer ? '#42A5F5' : '#FF5252';

        if (inst.type === 'infantry_squad' || inst.type === 'infantry_platoon') {
          // NATO 步兵: 友軍藍/敵軍紅戰術框 + 交叉線 "X"
          ctx.fillStyle = boxFill;
          ctx.strokeStyle = boxStroke;
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 4, iy - 3, 8, 6);
          ctx.strokeRect(ix - 4, iy - 3, 8, 6);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(ix - 4, iy - 3);
          ctx.lineTo(ix + 4, iy + 3);
          ctx.moveTo(ix + 4, iy - 3);
          ctx.lineTo(ix - 4, iy + 3);
          ctx.stroke();
        } else if (inst.type === 'tank_platoon' || inst.type === 'tank_battalion') {
          // NATO 裝甲/戰車: 友軍藍/敵軍紅戰術框 + 橢圓 "⬭"
          ctx.fillStyle = boxFill;
          ctx.strokeStyle = boxStroke;
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 5, iy - 3, 10, 6);
          ctx.strokeRect(ix - 5, iy - 3, 10, 6);
          ctx.strokeStyle = '#FFE082';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(ix, iy, 3.5, 1.8, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (inst.type === 'towed_artillery') {
          // NATO 拖曳砲兵: 友軍藍/敵軍紅戰術框 + 實心黑色砲彈圓點 "●"
          ctx.fillStyle = boxFill;
          ctx.strokeStyle = boxStroke;
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 4, iy - 3, 8, 6);
          ctx.strokeRect(ix - 4, iy - 3, 8, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(ix, iy, 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (inst.type === 'flak_battery') {
          // NATO 防空高射砲: 友軍藍/敵軍紅戰術框 + 防空拱頂 "⌢"
          ctx.fillStyle = boxFill;
          ctx.strokeStyle = boxStroke;
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 4, iy - 3, 8, 6);
          ctx.strokeRect(ix - 4, iy - 3, 8, 6);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(ix, iy + 1, 2.2, Math.PI, 0);
          ctx.stroke();
        } else if (inst.type === 'airfield') {
          // 航空基地 (友軍藍 / 敵軍黃)
          ctx.fillStyle = isPlayer ? '#42A5F5' : '#FFD54F';
          ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FFA000';
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 5, iy - 3, 10, 6);
          ctx.strokeRect(ix - 5, iy - 3, 10, 6);
        } else if (inst.type === 'ship_repair_dock') {
          // 友軍船舶維修設施 (浮動修船塢)
          ctx.fillStyle = 'rgba(33, 150, 243, 0.75)';
          ctx.strokeStyle = '#42A5F5';
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 5, iy - 3, 10, 6);
          ctx.strokeRect(ix - 5, iy - 3, 10, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('REP', ix, iy + 2);
        } else if (inst.type === 'pontoon_pier') {
          // 浮式人工棧橋港碼頭
          ctx.fillStyle = 'rgba(2, 136, 209, 0.75)';
          ctx.strokeStyle = '#4FC3F7';
          ctx.lineWidth = 1;
          ctx.fillRect(ix - 6, iy - 3, 12, 6);
          ctx.strokeRect(ix - 6, iy - 3, 12, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 4.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PIER', ix, iy + 2);
        } else if (inst.type === 'major_naval_port') {
          // 正規深水軍港突堤
          ctx.fillStyle = 'rgba(0, 151, 167, 0.85)';
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1.2;
          ctx.fillRect(ix - 7, iy - 4, 14, 8);
          ctx.strokeRect(ix - 7, iy - 4, 14, 8);
          ctx.fillStyle = '#FFE082';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PORT', ix, iy + 2.5);
        } else if (inst.type === 'supply_depot') {
          ctx.fillStyle = 'rgba(255, 179, 0, 0.75)';
          ctx.strokeStyle = '#FFD54F';
          ctx.strokeRect(ix - 4, iy - 4, 8, 8);
          ctx.fillRect(ix - 4, iy - 4, 8, 8);
          ctx.fillStyle = '#071526';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SUP', ix, iy + 2.5);
        } else if (inst.type === 'field_hospital') {
          ctx.fillStyle = 'rgba(229, 57, 53, 0.75)';
          ctx.strokeStyle = '#EF5350';
          ctx.strokeRect(ix - 4, iy - 4, 8, 8);
          ctx.fillRect(ix - 4, iy - 4, 8, 8);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MED', ix, iy + 2.5);
        } else if (inst.type === 'coastal_gun') {
          // 岸防重砲
          ctx.fillStyle = boxStroke;
          ctx.beginPath();
          ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = isPlayer ? '#42A5F5' : '#90A4AE';
          ctx.fillRect(ix - 2, iy - 2, 4, 4);
        }
      }

      // Island Stronghold Command Posts
      if (island.strongholds) {
        for (const sh of island.strongholds) {
          const sx = sh.cpPos.x * scale;
          const sy = sh.cpPos.y * scale;
          const sRad = 380 * scale;
          const isContested = sh.captureProgress > 0 && !sh.isCaptured;

          ctx.beginPath();
          ctx.arc(sx, sy, sRad, 0, Math.PI * 2);
          if (sh.isCaptured) {
            ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
            ctx.strokeStyle = '#00E676';
          } else if (isContested) {
            ctx.fillStyle = 'rgba(255, 213, 79, 0.15)';
            ctx.strokeStyle = '#FFD54F';
          } else {
            ctx.fillStyle = 'rgba(239, 83, 80, 0.1)';
            ctx.strokeStyle = '#EF5350';
          }
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.fill();
          ctx.setLineDash([]);

          ctx.fillStyle = sh.isCaptured ? '#00E676' : isContested ? '#FFD54F' : '#FF5252';
          ctx.fillRect(sx - 5, sy - 4, 10, 8);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - 5, sy - 4, 10, 8);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CP', sx, sy + 2);

          ctx.fillStyle = sh.isCaptured ? '#A7FFEB' : '#FFE082';
          ctx.font = '7.5px monospace';
          ctx.fillText(sh.isCaptured ? '【已收復】' : `CP: ${sh.name.split('(')[0].trim()}`, sx, sy - sRad - 3);
        }
      }
    }

    // Draw Ground Units (USMC & Ambush Troops)
    for (const unit of groundUnits) {
      if (unit.isDestroyed || unit.embarkedInShipId) continue;
      const ux = unit.pos.x * scale;
      const uy = unit.pos.y * scale;
      const isPlayer = unit.side === 'player';

      ctx.fillStyle = isPlayer ? 'rgba(33, 150, 243, 0.7)' : 'rgba(244, 67, 54, 0.7)';
      ctx.strokeStyle = isPlayer ? '#64B5F6' : '#E57373';
      ctx.lineWidth = 1;
      ctx.fillRect(ux - 3.5, uy - 2.5, 7, 5);
      ctx.strokeRect(ux - 3.5, uy - 2.5, 7, 5);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.7;
      if (unit.type.includes('rifle') || unit.type.includes('ambush')) {
        ctx.beginPath();
        ctx.moveTo(ux - 3.5, uy - 2.5);
        ctx.lineTo(ux + 3.5, uy + 2.5);
        ctx.moveTo(ux + 3.5, uy - 2.5);
        ctx.lineTo(ux - 3.5, uy + 2.5);
        ctx.stroke();
      } else if (unit.type.includes('armor') || unit.type.includes('lvt')) {
        ctx.beginPath();
        ctx.ellipse(ux, uy, 2.5, 1.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const isSubHull = (ship: Ship) =>
      ship.type === 'submarine' || ship.type === 'foxtrot' || ship.type === 'ssn_la' || ship.type === 'ssgn_oscar';

    // Draw Enemy Ships (Submarines obey Fog of War until ASW sonar contact or firing reveal)
    for (const ship of enemyShips) {
      if (ship.isSunk) continue;
      const isSub = isSubHull(ship);
      if (isSub && !ship.isSpotted) continue;

      const sx = ship.pos.x * scale;
      const sy = ship.pos.y * scale;
      ctx.fillStyle = isSub ? '#FF9100' : '#EF5350';
      ctx.beginPath();
      ctx.arc(sx, sy, isSub ? 3.5 : 4, 0, Math.PI * 2);
      ctx.fill();

      if (isSub) {
        ctx.strokeStyle = '#FFAB40';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(sx, sy, 7.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Heading vector line
      ctx.strokeStyle = isSub ? '#FF9100' : '#EF5350';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        (ship.pos.x + Math.cos(ship.heading) * 160) * scale,
        (ship.pos.y + Math.sin(ship.heading) * 160) * scale
      );
      ctx.stroke();

      // Ship name
      ctx.fillStyle = isSub ? 'rgba(255, 209, 128, 0.95)' : 'rgba(255, 138, 128, 0.85)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isSub ? `[聲吶鎖定] ${ship.codeName || ship.name}` : ship.codeName || ship.name,
        sx,
        sy - 7
      );
    }

    // Draw Player & Allied Ships (including planned A* sea-lane paths and ASW sonar rings)
    for (const ship of [...playerShips, ...alliedShips]) {
      if (ship.isSunk) continue;
      const isAllied = ship.side === 'allied';
      const isSub = isSubHull(ship);
      const sx = ship.pos.x * scale;
      const sy = ship.pos.y * scale;

      // A* sea-lane route trace
      if (ship.order.type === 'move' && ship.order.targetPos) {
        const wps = ship.order.waypoints;
        const startIdx = ship.order.activeWaypointIndex ?? 0;
        ctx.strokeStyle = isAllied ? 'rgba(105, 240, 174, 0.45)' : 'rgba(0, 230, 118, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (wps && wps.length > startIdx) {
          for (let wi = startIdx; wi < wps.length; wi++) {
            ctx.lineTo(wps[wi].x * scale, wps[wi].y * scale);
          }
        } else {
          ctx.lineTo(ship.order.targetPos.x * scale, ship.order.targetPos.y * scale);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = ship.isFlagship ? '#00E676' : isAllied ? '#69F0AE' : '#4FC3F7';
      ctx.beginPath();
      ctx.arc(sx, sy, ship.isFlagship ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Submarine stealth / enemy-detected ring
      if (isSub) {
        ctx.strokeStyle = ship.isSpottedByEnemy ? '#FF5252' : 'rgba(77, 208, 225, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2.5, 2.5]);
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Heading vector line
      ctx.strokeStyle = ship.isFlagship ? '#00E676' : isAllied ? '#69F0AE' : '#4FC3F7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        (ship.pos.x + Math.cos(ship.heading) * 160) * scale,
        (ship.pos.y + Math.sin(ship.heading) * 160) * scale
      );
      ctx.stroke();

      // Vision / Radar circle
      ctx.strokeStyle = isAllied ? 'rgba(105, 240, 174, 0.14)' : 'rgba(79, 195, 247, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, ship.detectionRange * scale, 0, Math.PI * 2);
      ctx.stroke();

      // ASW Sonar Ring
      if (ship.sonarRange && ship.sonarRange > 0) {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, ship.sonarRange * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ship code
      ctx.fillStyle = isAllied ? 'rgba(167, 255, 235, 0.9)' : 'rgba(128, 222, 234, 0.85)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isSub && ship.isSpottedByEnemy ? `[暴露] ${ship.codeName || ship.name}` : ship.codeName || ship.name,
        sx,
        sy - 6
      );
    }

    // Draw Aircraft (With Special Kamikaze / Ohka indicators)
    for (const plane of aircraft) {
      if (plane.state === 'shot_down') continue;
      const px = plane.pos.x * scale;
      const py = plane.pos.y * scale;

      if (plane.model === 'ohka') {
        // Ohka Rocket Suicide Missile: Pulsing Red Marker
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 7.5px monospace';
        ctx.fillText('OHKA', px, py - 4);
      } else if (plane.isKamikaze || plane.state === 'kamikaze_dive') {
        // Kamikaze Plane
        ctx.fillStyle = '#FF3D00';
        ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
        ctx.fillStyle = '#FFAB91';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('KAMI', px, py - 3.5);
      } else if (plane.model === 'g4m') {
        ctx.fillStyle = '#FF9100';
        ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
        ctx.fillStyle = '#FFE082';
        ctx.font = '7px monospace';
        ctx.fillText('G4M', px, py - 3.5);
      } else {
        ctx.fillStyle = plane.side === 'player' ? '#80D8FF' : '#FF8A80';
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }
    }

    // Draw Active Passive Sonobuoys
    for (const buoy of sonobuoys) {
      const bx = buoy.pos.x * scale;
      const by = buoy.pos.y * scale;
      const hasContact = (buoy.contactFlashTimer ?? 0) > 0;
      ctx.strokeStyle = hasContact ? 'rgba(255, 82, 82, 0.9)' : 'rgba(38, 198, 218, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(5, buoy.detectionRadius * scale), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = hasContact ? '#FF5252' : '#26C6DA';
      ctx.fillRect(bx - 2, by - 2, 4, 4);
    }

    // Draw Live Camera Viewport Rectangle
    if (cameraViewport && cameraViewport.zoom > 0) {
      const vw = (cameraViewport.viewW / cameraViewport.zoom) * scale;
      const vh = (cameraViewport.viewH / cameraViewport.zoom) * scale;
      const vx = cameraViewport.x * scale - vw / 2;
      const vy = cameraViewport.y * scale - vh / 2;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.setLineDash([]);
    }
  }, [isOpen, worldSize, islands, playerShips, alliedShips, enemyShips, aircraft, groundUnits, sonobuoys, cameraViewport]);

  if (!isOpen) return null;

  const handleChartClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onFocusWorldPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    onFocusWorldPos({
      x: Math.max(200, Math.min(worldSize - 200, rx * worldSize)),
      y: Math.max(200, Math.min(worldSize - 200, ry * worldSize)),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col gap-4 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-2 text-[#80DEEA] font-bold text-sm">
            <Radio className="w-4 h-4" />
            <span>THEATER PLOTTER · {sectorName.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            {onFocusWorldPos && (
              <span className="text-[10px] text-cyan-300/80 hidden sm:inline">
                {lang === 'zh' ? '點擊海圖立即跳轉視角' : 'Click chart to jump camera'}
              </span>
            )}
            <button onClick={onClose} className="p-1 text-[#90CAF9] hover:text-white transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-[#040C16] rounded-lg p-2 border border-[#1E3A5F]">
          <canvas
            ref={canvasRef}
            width={580}
            height={580}
            onClick={handleChartClick}
            className={`w-[580px] h-[580px] max-w-full aspect-square ${onFocusWorldPos ? 'cursor-crosshair' : ''}`}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-[#90CAF9] text-[10.5px] pt-1 border-t border-[#1E3A5F]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
                <span>{lang === 'zh' ? '旗艦 Flagship' : 'Flagship'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4FC3F7]" />
                <span>{lang === 'zh' ? '友軍特遣艦隊 (TF)' : 'Allied Task Force (TF)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF5350]" />
                <span>
                  {lang === 'zh'
                    ? era === 'era5'
                      ? '蘇聯紅海軍水面打擊群 (OPFOR SAG)'
                      : era === 'era4'
                      ? '北越/蘇聯海空作戰群 (OPFOR SAG)'
                      : era === 'era3'
                      ? '蘇聯遠東紅海軍 (OPFOR Fleet)'
                      : '敵水面艦隊 (IJN)'
                    : era === 'era5'
                    ? 'Soviet Surface Action Group (OPFOR)'
                    : era === 'era4'
                    ? 'OPFOR Surface & Air Group'
                    : era === 'era3'
                    ? 'OPFOR Far East Fleet'
                    : 'Enemy Surface Fleet (IJN)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]">CP</span>
                <span className="text-emerald-400 font-bold">
                  {lang === 'zh' ? '指揮所據點 (佔領區)' : 'Command Post (Capture)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px]">USMC</span>
                <span className="text-blue-400 font-bold">
                  {lang === 'zh' ? '陸戰隊地面部隊' : 'USMC Ground Forces'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-red-600 text-white font-bold text-[9px]">
                  {era === 'era5' || era === 'era4' ? 'AShM' : era === 'era3' ? 'KS-1' : 'OHKA'}
                </span>
                <span className="text-red-400 font-bold">
                  {lang === 'zh'
                    ? era === 'era5' || era === 'era4'
                      ? '導引反艦巡弋飛彈'
                      : era === 'era3'
                      ? '長程反艦飛彈'
                      : '反艦火箭飛彈'
                    : era === 'era5' || era === 'era4'
                    ? 'Guided Anti-Ship Missile'
                    : era === 'era3'
                    ? 'Long-Range AShM'
                    : 'Rocket Bomb'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-orange-600 text-white font-bold text-[9px]">
                  {era === 'era5' || era === 'era4' || era === 'era3' ? 'JET' : 'KAMI'}
                </span>
                <span className="text-orange-400 font-bold">
                  {lang === 'zh'
                    ? era === 'era5' || era === 'era4' || era === 'era3'
                      ? '噴射攔截機'
                      : '特攻機'
                    : era === 'era5' || era === 'era4' || era === 'era3'
                    ? 'Jet Interceptor'
                    : 'Kamikaze'}
                </span>
              </div>
            </div>
            <span className="text-slate-400">
              {lang === 'zh' ? '海圖比例尺: 1:14,000 NM (深遠作戰海域)' : 'Chart Scale: 1:14,000 NM (Deep Theater)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-300 bg-[#040C16] p-1.5 rounded border border-[#1E3A5F]/60">
            <span className="font-bold text-[#80DEEA]">
              {lang === 'zh' ? 'NATO APP-6 地面戰術標誌:' : 'NATO APP-6 Ground Symbology:'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-400 font-mono font-bold">[X]</span>
              {lang === 'zh' ? 'USMC 步兵排' : 'USMC Infantry'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-400 font-mono font-bold">[⬭]</span>
              {lang === 'zh' ? 'USMC 戰車/LVT' : 'USMC Armor/LVT'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-400 font-mono font-bold">[X]</span>
              {lang === 'zh'
                ? era === 'era5'
                  ? '蘇軍守備/特種伏擊連'
                  : era === 'era4'
                  ? 'OPFOR 守備/滲透排'
                  : era === 'era3'
                  ? '志願軍/人民軍守備排'
                  : '日軍守備/伏擊排'
                : era === 'era5'
                ? 'Soviet Spetsnaz/Garrison'
                : era === 'era4'
                ? 'OPFOR Garrison'
                : era === 'era3'
                ? 'Coalition Infantry'
                : 'IJN Garrison'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-amber-300 font-mono font-bold">[⬭]</span>
              {lang === 'zh' ? '敵戰車' : 'Hostile Armor'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-orange-400 font-mono font-bold">[●]</span>
              {lang === 'zh' ? '野戰砲兵' : 'Field Artillery'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-300 font-mono font-bold">[⌢]</span>
              {lang === 'zh' ? '防空砲' : 'AA / SAM Battery'}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-400 font-mono font-bold">[✈]</span>
              {lang === 'zh' ? '航空基地' : 'Airfield'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
