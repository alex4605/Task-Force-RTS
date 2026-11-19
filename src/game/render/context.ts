import { Era, Vector2D } from '../../types/game';

/** Shared drawing state handed to every render function. Owned and updated by VectorRenderer. */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Seconds of accumulated render time; drives all animation phases. */
  time: number;
  /** Current campaign era; selects era-appropriate equipment in installation artwork. */
  era: Era;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface OrderMarker {
  pos: Vector2D;
  type: 'move' | 'attack' | 'patrol' | 'rescue';
  age: number;
  maxAge: number;
}

export function isWorldCircleVisible(rc: RenderContext, x: number, y: number, radius: number, camera: Camera): boolean {
  if (rc.width <= 0 || rc.height <= 0 || camera.zoom <= 0) return true;
  const halfW = (rc.width * 0.5) / camera.zoom;
  const halfH = (rc.height * 0.5) / camera.zoom;
  return (
    x + radius >= camera.x - halfW &&
    x - radius <= camera.x + halfW &&
    y + radius >= camera.y - halfH &&
    y - radius <= camera.y + halfH
  );
}
