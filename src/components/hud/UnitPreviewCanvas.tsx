import React, { useEffect, useRef } from 'react';
import { AircraftPayloadType, Era } from '../../types/game';
import { drawUnitPreview, UnitPreviewKind } from '../../game/unitPreviewRenderer';

interface UnitPreviewCanvasProps {
  kind: UnitPreviewKind;
  unitKey: string;
  width?: number;
  height?: number;
  payloadType?: AircraftPayloadType;
  /** Card era (ships are drawn as the class delivered in that era). */
  era?: Era;
  compact?: boolean;
  className?: string;
}

export const UnitPreviewCanvas: React.FC<UnitPreviewCanvasProps> = React.memo(
  ({ kind, unitKey, width = 144, height = 46, payloadType, era, compact = false, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      drawUnitPreview(ctx, width, height, kind, unitKey, { payloadType, compact, era });
      ctx.restore();
    }, [kind, unitKey, width, height, payloadType, compact, era]);

    return (
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className={`block shrink-0 ${compact ? '' : 'rounded border border-[#1E3A5F]/90'} ${className}`}
        aria-hidden="true"
      />
    );
  }
);

UnitPreviewCanvas.displayName = 'UnitPreviewCanvas';
