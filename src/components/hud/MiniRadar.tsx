import React, { useEffect, useRef } from 'react';
import { Aircraft, Island, Ship, Sonobuoy, Vector2D } from '../../types/game';
import { CameraViewportState } from '../GameCanvas';

interface MiniRadarProps {
  title: string;
  islands: Island[];
  playerShips: Ship[];
  enemyShips: Ship[];
  aircraft: Aircraft[];
  sonobuoys: Sonobuoy[];
  worldSize: number;
  cameraViewport: CameraViewportState | null;
  onMiniMapClick: (worldPos: Vector2D) => void;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({
  title,
  islands,
  playerShips,
  enemyShips,
  aircraft,
  sonobuoys,
  worldSize,
  cameraViewport,
  onMiniMapClick,
}) => {
  const miniMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMiniMapDraggingRef = useRef<boolean>(false);

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
      if (p.side === 'enemy' && (p.trackedByPlayer ?? 1) <= 0) continue; // not on our scopes
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

  const panMiniMapFromClient = (clientX: number, clientY: number) => {
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    onMiniMapClick({
      x: (x / rect.width) * worldSize,
      y: (y / rect.height) * worldSize,
    });
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

  return (
    <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-1.5 shadow-2xl flex flex-col items-center">
      <div className="w-full flex justify-between text-[10px] font-mono text-[#80DEEA] pb-0.5 border-b border-[#1E3A5F]">
        <span>{title}</span>
        <span className="text-slate-400 text-[9px]">點擊 / 拖曳跳轉</span>
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
  );
};
