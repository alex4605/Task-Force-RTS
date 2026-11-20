/**
 * Smooth plan-view hull outline in the ship's local frame (bow along +x, port -y).
 * Real hulls are a flared entry, a parallel midbody and a run aft into a rounded cruiser stern
 * or a flat transom; straight-line polygons read as arrowheads.
 */
export interface HullForm {
  /** Fraction of the length over which the bow narrows (fine destroyers ~0.3, battleships ~0.3–0.38). */
  entry: number;
  /** Fraction of the length over which the stern narrows. */
  run: number;
  /** Half-width of the transom as a fraction of the half-beam (0 = rounded cruiser stern). */
  transom: number;
  /** How full the bow shoulders are (0.3 fine clipper … 0.7 bluff). */
  fullness?: number;
  /** Bow overhang beyond l/2 (clipper bows rake forward). */
  rake?: number;
}

/** Fill and stroke a hull outline. */
export function drawHullShape(ctx: CanvasRenderingContext2D, l: number, w: number, f: HullForm, fill: string, stroke: string, lineWidth: number): void {
  const hb = w / 2;
  const bowX = l * (0.5 + (f.rake ?? 0));
  const shoulder = l * (0.5 - f.entry);
  const quarter = -l * (0.5 - f.run);
  const sternX = -l * 0.5;
  const full = f.fullness ?? 0.45;
  const th = hb * f.transom;
  ctx.beginPath();
  ctx.moveTo(bowX, 0);
  ctx.bezierCurveTo(bowX - (bowX - shoulder) * 0.3, -hb * full, shoulder + (bowX - shoulder) * 0.25, -hb, shoulder, -hb);
  ctx.lineTo(quarter, -hb);
  if (th > 0) {
    ctx.bezierCurveTo(quarter - (quarter - sternX) * 0.55, -hb, sternX, -(th + (hb - th) * 0.55), sternX, -th);
    ctx.lineTo(sternX, th);
    ctx.bezierCurveTo(sternX, th + (hb - th) * 0.55, quarter - (quarter - sternX) * 0.55, hb, quarter, hb);
  } else {
    ctx.bezierCurveTo(quarter - (quarter - sternX) * 0.6, -hb, sternX, -hb * 0.6, sternX, 0);
    ctx.bezierCurveTo(sternX, hb * 0.6, quarter - (quarter - sternX) * 0.6, hb, quarter, hb);
  }
  ctx.lineTo(shoulder, hb);
  ctx.bezierCurveTo(shoulder + (bowX - shoulder) * 0.25, hb, bowX - (bowX - shoulder) * 0.3, hb * full, bowX, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fill();
  ctx.stroke();
}
