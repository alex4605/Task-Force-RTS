import { Vector2D } from '../../types/game';
import { RenderContext, Camera } from './context';

// Clear & Draw Ocean Grid with Radar Sweep & Chart Markings
export function drawOcean(rc: RenderContext, camera: Camera, worldSize: number, radarOrigin?: Vector2D) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.fillStyle = '#050D18';
  ctx.fillRect(0, 0, rc.width, rc.height);

  // Subtle deep-sea bathymetric radial vignette
  const bgGrad = ctx.createRadialGradient(
    rc.width * 0.5,
    rc.height * 0.5,
    Math.min(rc.width, rc.height) * 0.15,
    rc.width * 0.5,
    rc.height * 0.5,
    Math.max(rc.width, rc.height) * 0.78
  );
  bgGrad.addColorStop(0, 'rgba(13, 42, 74, 0.28)');
  bgGrad.addColorStop(0.65, 'rgba(7, 20, 38, 0.1)');
  bgGrad.addColorStop(1, 'rgba(2, 6, 14, 0.55)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, rc.width, rc.height);

  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Outer theater border glow + crisp perimeter
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, worldSize, worldSize);
  ctx.strokeStyle = '#1E3A5F';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, worldSize, worldSize);

  const gridSize = 400;
  const startX = Math.max(0, Math.floor((camera.x - (rc.width / 2) / camera.zoom) / gridSize) * gridSize);
  const endX = Math.min(worldSize, Math.ceil((camera.x + (rc.width / 2) / camera.zoom) / gridSize) * gridSize);
  const startY = Math.max(0, Math.floor((camera.y - (rc.height / 2) / camera.zoom) / gridSize) * gridSize);
  const endY = Math.min(worldSize, Math.ceil((camera.y + (rc.height / 2) / camera.zoom) / gridSize) * gridSize);

  // Subtle sinusoidal ocean ripples
  ctx.strokeStyle = 'rgba(41, 98, 155, 0.14)';
  ctx.lineWidth = 1;
  const wavePhase = rc.time * 1.5;
  for (let wx = startX + 60; wx < endX; wx += 140) {
    for (let wy = startY + 60; wy < endY; wy += 140) {
      const waveOffset = Math.sin(wx * 0.008 + wy * 0.008 + wavePhase) * 5;
      ctx.beginPath();
      ctx.moveTo(wx - 14, wy + waveOffset);
      ctx.quadraticCurveTo(wx, wy + waveOffset + 3, wx + 14, wy + waveOffset);
      ctx.stroke();
    }
  }

  // Grid coordinates
  ctx.strokeStyle = 'rgba(23, 46, 75, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);

  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(74, 114, 156, 0.55)';
    ctx.font = '10px monospace';
    ctx.fillText(`${Math.floor(x / 10)}°E`, x + 6, startY + 20);
  }

  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(74, 114, 156, 0.55)';
    ctx.font = '10px monospace';
    ctx.fillText(`${Math.floor(y / 10)}°S`, startX + 6, y - 6);
  }

  ctx.setLineDash([]);

  // Navigational Compass Rose
  drawCompassRose(rc, 600, 600);

  // Active Radar Sweep from Carrier / Screen Flagship
  if (radarOrigin) {
    drawRadarSweep(rc, radarOrigin);
  }

  ctx.restore();
}

// Authentic WWII Naval Plotting Compass Rose
function drawCompassRose(rc: RenderContext, cx: number, cy: number) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(cx, cy);

  const r = 110;
  ctx.strokeStyle = 'rgba(30, 58, 95, 0.35)';
  ctx.lineWidth = 1;

  // Outer & inner rings
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  // 8 Cardinal Points
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const isCardinal = i % 2 === 0;
    const len = isCardinal ? r : r * 0.85;

    ctx.strokeStyle = isCardinal ? 'rgba(128, 222, 234, 0.3)' : 'rgba(30, 58, 95, 0.25)';
    ctx.lineWidth = isCardinal ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }

  // N S E W labels
  ctx.fillStyle = 'rgba(128, 222, 234, 0.4)';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -r - 12);
  ctx.fillText('S', 0, r + 12);
  ctx.fillText('E', r + 12, 0);
  ctx.fillText('W', -r - 12, 0);

  ctx.restore();
}

// Authentic WWII Phosphor Green Plan Position Indicator (PPI) Radar Display
function drawRadarSweep(rc: RenderContext, origin: Vector2D) {
  const ctx = rc.ctx;
  const sweepRadius = 1600;
  const sweepAngle = (rc.time * 0.7) % (Math.PI * 2);

  ctx.save();

  // 1. Phosphor Persistence Decay Fan (fading 40-degree sweep sector)
  const sweepSector = 0.65;
  const sweepGrad = ctx.createRadialGradient(
    origin.x, origin.y, 20,
    origin.x, origin.y, sweepRadius
  );
  sweepGrad.addColorStop(0, 'rgba(0, 255, 136, 0.16)');
  sweepGrad.addColorStop(0.5, 'rgba(0, 230, 118, 0.08)');
  sweepGrad.addColorStop(0.9, 'rgba(0, 200, 83, 0.02)');
  sweepGrad.addColorStop(1, 'rgba(0, 200, 83, 0)');

  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, sweepRadius, sweepAngle - sweepSector, sweepAngle);
  ctx.closePath();
  ctx.fill();

  // 2. High-intensity CRT Electron Beam Sweep Line with Glow
  // Outer glow
  ctx.strokeStyle = 'rgba(105, 240, 174, 0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(
    origin.x + Math.cos(sweepAngle) * sweepRadius,
    origin.y + Math.sin(sweepAngle) * sweepRadius
  );
  ctx.stroke();

  // Sharp core beam
  ctx.strokeStyle = 'rgba(230, 255, 235, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(
    origin.x + Math.cos(sweepAngle) * sweepRadius,
    origin.y + Math.sin(sweepAngle) * sweepRadius
  );
  ctx.stroke();

  // 3. Radial Bearing Azimuth Spokes (every 45° with degree notation)
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.14)';
  ctx.lineWidth = 1;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(105, 240, 174, 0.45)';

  const bearings = [
    { ang: -Math.PI / 2, label: '000°' },
    { ang: -Math.PI / 4, label: '045°' },
    { ang: 0, label: '090°' },
    { ang: Math.PI / 4, label: '135°' },
    { ang: Math.PI / 2, label: '180°' },
    { ang: (3 * Math.PI) / 4, label: '225°' },
    { ang: Math.PI, label: '270°' },
    { ang: (-3 * Math.PI) / 4, label: '315°' },
  ];

  for (const b of bearings) {
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(
      origin.x + Math.cos(b.ang) * sweepRadius,
      origin.y + Math.sin(b.ang) * sweepRadius
    );
    ctx.stroke();

    const labelDist = sweepRadius - 35;
    ctx.fillText(
      b.label,
      origin.x + Math.cos(b.ang) * labelDist,
      origin.y + Math.sin(b.ang) * labelDist
    );
  }

  // 4. Concentric Calibrated Range Rings with Nautical Mile Markings
  const rangeRings = [
    { r: 400, label: '2 NM' },
    { r: 800, label: '4 NM' },
    { r: 1200, label: '6 NM' },
    { r: 1600, label: '8 NM' },
  ];

  for (const ring of rangeRings) {
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.16)';
    ctx.lineWidth = ring.r === 1600 ? 1.5 : 1;
    ctx.setLineDash(ring.r === 1600 ? [] : [4, 8]);
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();

    // Range text label on North spoke
    ctx.fillStyle = 'rgba(105, 240, 174, 0.55)';
    ctx.font = '8.5px monospace';
    ctx.fillText(ring.label, origin.x + 18, origin.y - ring.r + 4);
  }
  ctx.setLineDash([]);

  // 5. Outer Dial Degree Compass Ticks (every 10 degrees)
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.2)';
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 10) {
    const rad = (deg * Math.PI) / 180;
    const inner = deg % 30 === 0 ? sweepRadius - 16 : sweepRadius - 8;
    ctx.beginPath();
    ctx.moveTo(origin.x + Math.cos(rad) * inner, origin.y + Math.sin(rad) * inner);
    ctx.lineTo(origin.x + Math.cos(rad) * sweepRadius, origin.y + Math.sin(rad) * sweepRadius);
    ctx.stroke();
  }

  // 6. Antenna Origin Beacon Blip
  ctx.fillStyle = '#00E676';
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
