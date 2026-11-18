import {
  Ship,
  Aircraft,
  Island,
  Projectile,
  Particle,
  Vector2D,
  Installation,
  SelectionBox,
  GroundUnit,
  RequisitionItem,
  LifeRaft,
  NuclearDetonation,
  Sonobuoy,
  Era,
} from '../types/game';
import { drawGroundSilhouette } from './unitPreviewRenderer';

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

export class VectorRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private time: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public updateTime(dt: number) {
    this.time += dt;
  }

  private isWorldCircleVisible(x: number, y: number, radius: number, camera: Camera): boolean {
    if (this.width <= 0 || this.height <= 0 || camera.zoom <= 0) return true;
    const halfW = (this.width * 0.5) / camera.zoom;
    const halfH = (this.height * 0.5) / camera.zoom;
    return (
      x + radius >= camera.x - halfW &&
      x - radius <= camera.x + halfW &&
      y + radius >= camera.y - halfH &&
      y - radius <= camera.y + halfH
    );
  }

  // Clear & Draw Ocean Grid with Radar Sweep & Chart Markings
  public drawOcean(camera: Camera, worldSize: number, radarOrigin?: Vector2D) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#050D18';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle deep-sea bathymetric radial vignette
    const bgGrad = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      Math.min(this.width, this.height) * 0.15,
      this.width * 0.5,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.78
    );
    bgGrad.addColorStop(0, 'rgba(13, 42, 74, 0.28)');
    bgGrad.addColorStop(0.65, 'rgba(7, 20, 38, 0.1)');
    bgGrad.addColorStop(1, 'rgba(2, 6, 14, 0.55)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.translate(this.width / 2, this.height / 2);
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
    const startX = Math.max(0, Math.floor((camera.x - (this.width / 2) / camera.zoom) / gridSize) * gridSize);
    const endX = Math.min(worldSize, Math.ceil((camera.x + (this.width / 2) / camera.zoom) / gridSize) * gridSize);
    const startY = Math.max(0, Math.floor((camera.y - (this.height / 2) / camera.zoom) / gridSize) * gridSize);
    const endY = Math.min(worldSize, Math.ceil((camera.y + (this.height / 2) / camera.zoom) / gridSize) * gridSize);

    // Subtle sinusoidal ocean ripples
    ctx.strokeStyle = 'rgba(41, 98, 155, 0.14)';
    ctx.lineWidth = 1;
    const wavePhase = this.time * 1.5;
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
    this.drawCompassRose(600, 600);

    // Active Radar Sweep from Carrier / Screen Flagship
    if (radarOrigin) {
      this.drawRadarSweep(radarOrigin);
    }

    ctx.restore();
  }

  // Authentic WWII Naval Plotting Compass Rose
  private drawCompassRose(cx: number, cy: number) {
    const ctx = this.ctx;
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
  private drawRadarSweep(origin: Vector2D) {
    const ctx = this.ctx;
    const sweepRadius = 1600;
    const sweepAngle = (this.time * 0.7) % (Math.PI * 2);

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

  // Draw Islands
  public drawIslands(islands: Island[], camera: Camera) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const wavePulse = (Math.sin(this.time * 2) + 1) * 0.5;

    for (const island of islands) {
      if (!this.isWorldCircleVisible(island.center.x, island.center.y, island.radius + 260, camera)) {
        continue;
      }

      // 0. Shallow-water turquoise reef shoal contour
      if (island.points.length >= 3) {
        ctx.fillStyle = 'rgba(0, 150, 175, 0.14)';
        ctx.strokeStyle = 'rgba(38, 198, 218, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < island.points.length; i++) {
          const p = island.points[i];
          const dx = p.x - island.center.x;
          const dy = p.y - island.center.y;
          const dist = Math.hypot(dx, dy) || 1;
          const reefX = p.x + (dx / dist) * 28;
          const reefY = p.y + (dy / dist) * 28;
          if (i === 0) ctx.moveTo(reefX, reefY);
          else ctx.lineTo(reefX, reefY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 1. Shore ripple
      ctx.strokeStyle = `rgba(100, 181, 246, ${0.15 + wavePulse * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < island.points.length; i++) {
        const p = island.points[i];
        const dx = p.x - island.center.x;
        const dy = p.y - island.center.y;
        const dist = Math.hypot(dx, dy) || 1;
        const expX = p.x + (dx / dist) * (14 + wavePulse * 8);
        const expY = p.y + (dy / dist) * (14 + wavePulse * 8);
        if (i === 0) ctx.moveTo(expX, expY);
        else ctx.lineTo(expX, expY);
      }
      ctx.closePath();
      ctx.stroke();

      // 2. Base Coastline
      ctx.fillStyle = 'rgba(12, 32, 52, 0.85)';
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let i = 0; i < island.points.length; i++) {
        const p = island.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2B. Atoll Central Calm Turquoise Lagoon Water (中央內海深水潟湖水域)
      if (island.isAtoll && island.lagoons && island.lagoons.length > 0) {
        ctx.save();
        for (const lag of island.lagoons) {
          // Deep turquoise lagoon water radial gradient fill
          const lagGrad = ctx.createRadialGradient(
            lag.center.x,
            lag.center.y,
            lag.radius * 0.15,
            lag.center.x,
            lag.center.y,
            lag.radius
          );
          lagGrad.addColorStop(0, 'rgba(0, 150, 169, 0.75)'); // deeper central lagoon basin
          lagGrad.addColorStop(0.7, 'rgba(0, 188, 212, 0.55)');
          lagGrad.addColorStop(1, 'rgba(77, 208, 225, 0.35)'); // shallow sand bar reef rim

          ctx.fillStyle = lagGrad;
          ctx.strokeStyle = '#26C6DA';
          ctx.lineWidth = 2.0;

          ctx.beginPath();
          for (let i = 0; i < lag.points.length; i++) {
            const lp = lag.points[i];
            if (i === 0) ctx.moveTo(lp.x, lp.y);
            else ctx.lineTo(lp.x, lp.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Lagoon Navigational Marker & Depth Sounding
          if (camera.zoom >= 0.42) {
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = 'rgba(128, 222, 234, 0.85)';
            ctx.textAlign = 'center';
            ctx.fillText(`⚓ ${island.name.split(' ')[0]} 內海深水潟湖 (Navigable Lagoon)`, lag.center.x, lag.center.y);
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(77, 208, 225, 0.65)';
            ctx.fillText('水深 26M · 艦船舟艇可安全進出通航', lag.center.x, lag.center.y + 12);
          }

          // Navigable channel breach markers (水門通路)
          if (lag.channelBreaches) {
            for (const ch of lag.channelBreaches) {
              const chDist = island.radius * 0.95;
              const chX = island.center.x + Math.cos(ch.angle) * chDist;
              const chY = island.center.y + Math.sin(ch.angle) * chDist;
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.arc(chX, chY, 24, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
              if (camera.zoom >= 0.42) {
                ctx.fillStyle = '#80DEEA';
                ctx.font = '8px monospace';
                ctx.fillText('通行水門', chX, chY - 28);
              }
            }
          }
        }
        ctx.restore();
      }

      // 3. Topographical lines
      ctx.strokeStyle = 'rgba(66, 133, 244, 0.35)';
      ctx.lineWidth = 1;
      for (const contour of island.contours) {
        ctx.beginPath();
        for (let i = 0; i < contour.length; i++) {
          const p = contour[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 4. Continental Rivers & Deltas
      if (island.rivers && island.rivers.length > 0) {
        ctx.save();
        for (const river of island.rivers) {
          ctx.strokeStyle = '#0277BD';
          ctx.lineWidth = river.width || 14;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < river.points.length; i++) {
            const rp = river.points[i];
            if (i === 0) ctx.moveTo(rp.x, rp.y);
            else ctx.lineTo(rp.x, rp.y);
          }
          ctx.stroke();

          // Luminous river highlight
          ctx.strokeStyle = '#4FC3F7';
          ctx.lineWidth = Math.max(2, (river.width || 14) * 0.35);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Continental Supply Trails & Highway Network
      if (island.roads && island.roads.length > 0) {
        ctx.save();
        for (const rd of island.roads) {
          const isTrail = rd.type === 'trail';
          ctx.strokeStyle = isTrail ? 'rgba(141, 110, 99, 0.7)' : 'rgba(207, 216, 220, 0.85)';
          ctx.lineWidth = isTrail ? 2.8 : 4.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (isTrail) ctx.setLineDash([6, 6]);
          ctx.beginPath();
          for (let i = 0; i < rd.points.length; i++) {
            const p = rd.points[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // 6. Continuous Mountain Ridge Chains & High Peaks (連續山脈稜線與頂峰)
      if (island.mountainRidges && island.mountainRidges.length > 0) {
        ctx.save();
        for (const ridge of island.mountainRidges) {
          if (!ridge.spine || ridge.spine.length < 2) continue;

          // 1. Ridge Mountain Base Massif (Elevation shading along the continuous spine)
          ctx.strokeStyle = 'rgba(45, 55, 72, 0.85)';
          ctx.lineWidth = ridge.width || 200;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < ridge.spine.length; i++) {
            const sp = ridge.spine[i];
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
          }
          ctx.stroke();

          // 2. Secondary upper elevation shelf
          ctx.strokeStyle = 'rgba(26, 32, 44, 0.9)';
          ctx.lineWidth = (ridge.width || 200) * 0.55;
          ctx.stroke();

          // 3. Sharp Ridgeline Crest Spine (山脊尖銳稜線)
          ctx.strokeStyle = 'rgba(176, 190, 197, 0.65)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < ridge.spine.length; i++) {
            const sp = ridge.spine[i];
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
          }
          ctx.stroke();

          // 4. Peaks with triangles and elevations
          if (ridge.peaks && ridge.peaks.length > 0) {
            for (const pk of ridge.peaks) {
              // Mountain peak icon
              ctx.fillStyle = '#CFD8DC';
              ctx.beginPath();
              ctx.moveTo(pk.pos.x, pk.pos.y - 12);
              ctx.lineTo(pk.pos.x + 8, pk.pos.y + 4);
              ctx.lineTo(pk.pos.x - 8, pk.pos.y + 4);
              ctx.closePath();
              ctx.fill();

              ctx.font = 'bold 9px monospace';
              ctx.fillStyle = '#ECEFF1';
              ctx.textAlign = 'center';
              ctx.fillText(`▲ ${pk.label}`, pk.pos.x, pk.pos.y - 16);
            }
          }
        }
        ctx.restore();
      }

      // Legacy Continental Hills
      if (island.hills && island.hills.length > 0) {
        ctx.save();
        for (const hill of island.hills) {
          const hGrad = ctx.createRadialGradient(hill.x, hill.y, 8, hill.x, hill.y, hill.radius);
          hGrad.addColorStop(0, 'rgba(55, 71, 79, 0.85)');
          hGrad.addColorStop(0.65, 'rgba(38, 50, 56, 0.6)');
          hGrad.addColorStop(1, 'rgba(38, 50, 56, 0)');
          ctx.fillStyle = hGrad;
          ctx.beginPath();
          ctx.arc(hill.x, hill.y, hill.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(144, 164, 174, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(hill.x, hill.y, hill.radius * 0.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = 'rgba(176, 190, 197, 0.75)';
          ctx.textAlign = 'center';
          ctx.fillText(`▲ Hill ${Math.round(hill.radius * 3.5)}`, hill.x, hill.y + 3);
        }
        ctx.restore();
      }

      // 7. Continuous Forest & Jungle Belts (連續長條狀有機雨林廊道，非離散圓點)
      if (island.forestBelts && island.forestBelts.length > 0) {
        ctx.save();
        for (const belt of island.forestBelts) {
          if (!belt.points || belt.points.length < 3) continue;

          // Color scheme depending on biome
          let fillColor = 'rgba(27, 94, 32, 0.8)';
          let strokeColor = 'rgba(76, 175, 80, 0.4)';
          let labelText = '🌲 連續熱帶雨林廊道';
          if (belt.biome === 'mangrove') {
            fillColor = 'rgba(19, 42, 19, 0.82)';
            strokeColor = 'rgba(46, 125, 50, 0.45)';
            labelText = '🌿 沿海紅樹林潮間沼澤帶';
          } else if (belt.biome === 'palms') {
            fillColor = 'rgba(45, 106, 79, 0.8)';
            strokeColor = 'rgba(82, 183, 136, 0.45)';
            labelText = '🌴 環礁海防椰林林帶';
          } else if (belt.biome === 'bamboo') {
            fillColor = 'rgba(40, 75, 50, 0.82)';
            strokeColor = 'rgba(100, 180, 100, 0.4)';
            labelText = '🎋 喀斯特石灰岩深谷密林';
          }

          // Smooth organic polygon
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          for (let i = 0; i < belt.points.length; i++) {
            const p = belt.points[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Organic canopy texture bumps along the boundary
          ctx.fillStyle = strokeColor;
          for (let i = 0; i < belt.points.length; i += 2) {
            const p = belt.points[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.fill();
          }

          // Central subtle ribbon label
          if (camera.zoom >= 0.42) {
            const midIdx = Math.floor(belt.points.length / 2);
            const midP = belt.points[midIdx];
            if (midP) {
              ctx.font = '8.5px monospace';
              ctx.fillStyle = 'rgba(165, 214, 167, 0.7)';
              ctx.textAlign = 'center';
              ctx.fillText(labelText, midP.x, midP.y);
            }
          }
        }
        ctx.restore();
      }

      // Legacy Jungles (if present)
      if (island.jungles && island.jungles.length > 0) {
        ctx.save();
        for (const j of island.jungles) {
          const jGrad = ctx.createRadialGradient(j.x, j.y, 6, j.x, j.y, j.radius);
          jGrad.addColorStop(0, 'rgba(27, 94, 32, 0.85)');
          jGrad.addColorStop(0.7, 'rgba(46, 125, 50, 0.6)');
          jGrad.addColorStop(1, 'rgba(51, 105, 30, 0)');
          ctx.fillStyle = jGrad;
          ctx.beginPath();
          ctx.arc(j.x, j.y, j.radius, 0, Math.PI * 2);
          ctx.fill();

          const canopyCount = Math.min(8, Math.max(4, Math.floor(j.radius / 18)));
          ctx.fillStyle = 'rgba(46, 125, 50, 0.45)';
          for (let c = 0; c < canopyCount; c++) {
            const cAng = (c * Math.PI * 2) / canopyCount;
            const cDist = j.radius * 0.55;
            const cx = j.x + Math.cos(cAng) * cDist;
            const cy = j.y + Math.sin(cAng) * cDist;
            ctx.beginPath();
            ctx.arc(cx, cy, j.radius * 0.38, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = 'rgba(76, 175, 80, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(j.x, j.y, j.radius * 0.9, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(144, 202, 249, 0.7)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(island.name.toUpperCase(), island.center.x, island.center.y - island.radius - 12);

      for (const inst of island.installations) {
        this.drawInstallation(inst, island);
      }
    }

    ctx.restore();
  }

  // Draw Installation
  private drawInstallation(inst: Installation, island?: Island) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(inst.pos.x, inst.pos.y);

    // ══════════════════════════════════════════════════════════
    // 平民保護區 / 城市戰掩蔽圈 (Civilian Zone & Urban Cover Perimeter)
    // ══════════════════════════════════════════════════════════
    if (inst.civilianZoneRadius && inst.civilianZoneRadius > 0 && !inst.isDestroyed) {
      const zR = inst.civilianZoneRadius;
      ctx.save();
      ctx.setLineDash([6, 6]);
      if (inst.isCivilian) {
        ctx.strokeStyle = inst.type === 'refugee_camp' ? 'rgba(255, 238, 88, 0.45)' : 'rgba(128, 222, 234, 0.45)';
        ctx.fillStyle = inst.type === 'refugee_camp' ? 'rgba(255, 238, 88, 0.05)' : 'rgba(0, 229, 255, 0.05)';
      } else {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
      }
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, zR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = inst.type === 'refugee_camp' ? '#FFE082' : '#80DEEA';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      if (inst.type === 'refugee_camp') {
        ctx.fillText('⛺【聯合國難民收容安全區 · 誤擊扣15CP】', 0, -zR - 6);
      } else if (inst.type === 'city' || inst.type === 'town') {
        ctx.fillText('🏛️【城區防禦掩體: 空襲減傷70% · 直射掩護50%】', 0, -zR - 6);
      } else {
        ctx.fillText('🏘️【定居點平民區 · 誤擊扣15CP】', 0, -zR - 6);
      }
      ctx.restore();
    }

    ctx.rotate(inst.angle);

    if (inst.isDestroyed) {
      ctx.strokeStyle = '#546E7A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(12, 12);
      ctx.moveTo(12, -12);
      ctx.lineTo(-12, 12);
      ctx.stroke();
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.restore();
      return;
    }

    const isPlayer = inst.side === 'player' || island?.isFriendlyBase === true || inst.id.includes('friendly');
    const color = isPlayer ? '#4FC3F7' : '#EF5350';
    const frameFill = isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(183, 28, 28, 0.45)';
    const frameStroke = isPlayer ? '#42A5F5' : '#FF5252';
    const labelColor = isPlayer ? '#90CAF9' : '#EF5350';
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(18, 38, 58, 0.9)';

    // Universal terrain contact drop-shadow for physical depth
    if (inst.type !== 'airfield' && inst.type !== 'city' && inst.type !== 'town') {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 12, 0.42)';
      ctx.beginPath();
      ctx.ellipse(2.5, 3.5, 19, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (inst.type === 'airfield') {
      // Runway concrete apron & blast pad shadow
      ctx.fillStyle = 'rgba(2, 8, 16, 0.55)';
      ctx.fillRect(-67, -11, 134, 26);

      ctx.lineWidth = 2;
      ctx.fillStyle = '#0F1C2A';
      ctx.fillRect(-65, -12, 130, 24);
      ctx.strokeRect(-65, -12, 130, 24);

      // Runway threshold piano keys
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      for (const tx of [-61, 55]) {
        for (const ty of [-8, -3, 2, 7]) {
          ctx.fillRect(tx, ty - 1, 6, 2);
        }
      }

      // Centerline dashes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(-48, 0);
      ctx.lineTo(48, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hangar & control tower apron
      ctx.fillStyle = '#182C3E';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.fillRect(10, 15, 16, 13);
      ctx.strokeRect(10, 15, 16, 13);
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(-6, 15, 7, 7);
      ctx.strokeRect(-6, 15, 7, 7);

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '✈️ [友軍航空基地 AFB]' : '✈️ [敵軍航空基地 AFB]', 0, -18);
    } else if (inst.type === 'coastal_gun') {
      const is240mm = inst.name.includes('240mm') || inst.id.includes('240');
      if (is240mm) {
        // M1 240mm "Black Dragon" 重型八角混凝土砲座固定重砲
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          const x = Math.cos(a) * 16;
          const y = Math.sin(a) * 16;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = isPlayer ? 'rgba(13, 71, 161, 0.78)' : 'rgba(78, 52, 46, 0.8)';
        ctx.fill();
        ctx.stroke();

        // Gun carriage & dual hydraulic recuperator cylinders
        ctx.fillStyle = isPlayer ? '#546E7A' : '#5D4037';
        ctx.fillRect(-10, -7, 16, 14);
        ctx.strokeRect(-10, -7, 16, 14);

        // Long heavy 240mm barrel + recoil cylinders
        ctx.lineWidth = 4.2;
        ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(34, 0);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = isPlayer ? '#B2EBF2' : '#FFCDD2';
        ctx.beginPath();
        ctx.moveTo(2, -4.5);
        ctx.lineTo(15, -4.5);
        ctx.moveTo(2, 4.5);
        ctx.lineTo(15, 4.5);
        ctx.stroke();

        ctx.fillStyle = labelColor;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isPlayer ? '[友軍重砲] M1 240mm 黑龍' : '[敵軍要塞重砲] 240mm', 0, -24);
      } else {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.65)' : 'rgba(78, 52, 46, 0.75)';
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
        ctx.beginPath();
        ctx.moveTo(4, -3);
        ctx.lineTo(24, -3);
        ctx.moveTo(4, 3);
        ctx.lineTo(24, 3);
        ctx.stroke();

        const caliberMatch = inst.name.match(/\d{3}mm/);
        const calText = caliberMatch ? caliberMatch[0] : (isPlayer ? '155mm' : '140mm');
        ctx.fillStyle = labelColor;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isPlayer ? `[友軍岸防砲連] ${calText}` : `[敵軍岸防重砲] ${calText}`, 0, -20);
      }
    } else if (inst.type === 'radar_station') {
      ctx.fillStyle = '#0F2234';
      ctx.lineWidth = 2;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeRect(-10, -10, 20, 20);

      const radarAngle = this.time * 3;
      // Soft sweep wedge
      ctx.fillStyle = isPlayer ? 'rgba(100, 255, 218, 0.14)' : 'rgba(255, 138, 128, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 28, radarAngle - 0.35, radarAngle);
      ctx.closePath();
      ctx.fill();

      // Rotating parabolic dish reflector bar
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-Math.sin(radarAngle) * 7, Math.cos(radarAngle) * 7);
      ctx.lineTo(Math.sin(radarAngle) * 7, -Math.cos(radarAngle) * 7);
      ctx.stroke();

      ctx.strokeStyle = isPlayer ? 'rgba(100, 255, 218, 0.7)' : 'rgba(255, 138, 128, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(radarAngle) * 32, Math.sin(radarAngle) * 32);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[友軍早期電探哨] SCR-270' : '[敵軍防空電探哨] 二一號', 0, -22);
    } else if (inst.type === 'ammo_depot') {
      // Hexagonal sandbagged revetment bunker + fuel/ordnance canisters + hazard diamond
      ctx.lineWidth = 2;
      ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(62, 39, 35, 0.78)';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * 16;
        const y = Math.sin(a) * 16;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner reinforced roof & 3 fuel/ammo drums
      ctx.fillStyle = '#33691E';
      ctx.strokeStyle = '#AED581';
      ctx.lineWidth = 1;
      ctx.fillRect(-8, -6, 7, 5);
      ctx.strokeRect(-8, -6, 7, 5);
      ctx.fillRect(1, -6, 7, 5);
      ctx.strokeRect(1, -6, 7, 5);
      ctx.fillStyle = '#FFA726';
      ctx.beginPath();
      ctx.arc(-4, 4, 2.8, 0, Math.PI * 2);
      ctx.arc(4, 4, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[友軍戰略油彈庫]' : '[敵軍戰略彈藥庫]', 0, -23);
    } else if (inst.type === 'infantry_squad') {
      // ════ NATO 步兵班 (APP-6 Infantry Squad: Tactical Box + X + Squad Dot) ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -26, 24, 15);
      ctx.fillRect(-12, -26, 24, 15);

      // NATO 步兵符號: 對角交叉交叉線 "X"
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(12, -11);
      ctx.moveTo(12, -26);
      ctx.lineTo(-12, -11);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 單點 "●" 代表 步兵班 Squad)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -29, 2, 0, Math.PI * 2);
      ctx.fill();

      // 2. 地面物理工事: 沙袋半月掩體與機槍
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#BCAAA4';
      ctx.fillStyle = 'rgba(78, 52, 46, 0.75)';
      ctx.beginPath();
      ctx.arc(0, 5, 11, -Math.PI * 0.75, Math.PI * 0.75);
      ctx.stroke();
      ctx.fill();

      // 機槍槍身與三腳架
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 5);
      ctx.lineTo(14, 5);
      ctx.moveTo(4, 2);
      ctx.lineTo(4, 8);
      ctx.moveTo(-2, 5);
      ctx.lineTo(-6, 1);
      ctx.moveTo(-2, 5);
      ctx.lineTo(-6, 9);
      ctx.stroke();

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍步兵班 SQD] .30cal' : '[NATO 步兵班 SQD] 7.7mm', 0, -33);
    } else if (inst.type === 'infantry_platoon') {
      // ════ NATO 步兵排 (APP-6 Infantry Platoon: Tactical Box + X + Platoon 3 Pips) ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -28, 26, 16);
      ctx.fillRect(-13, -28, 26, 16);

      // NATO 步兵符號: 對角交叉線 "X"
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-13, -28);
      ctx.lineTo(13, -12);
      ctx.moveTo(13, -28);
      ctx.lineTo(-13, -12);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 三點 "●●●" 代表 步兵排 Platoon)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-5, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(0, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(5, -31, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. 地面物理工事: 防禦暗堡與機砲
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#CFD8DC';
      ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.45)' : 'rgba(38, 50, 56, 0.85)';
      ctx.strokeRect(-12, -2, 24, 20);
      ctx.fillRect(-12, -2, 24, 20);

      // 壕溝連接網絡
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(-12, 8);
      ctx.moveTo(12, 8);
      ctx.lineTo(20, 12);
      ctx.stroke();

      // 機砲砲身
      ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 5.5);
      ctx.lineTo(17, 5.5);
      ctx.moveTo(0, 10.5);
      ctx.lineTo(17, 10.5);
      ctx.stroke();

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍陸戰步兵排 PLT]' : '[NATO 步兵排 PLT] 20mm', 0, -35);
    } else if (inst.type === 'tank_platoon') {
      // ════ NATO 戰車排 (APP-6 Tank Platoon: Tactical Box + Armor Oval + 3 Pips) ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -28, 28, 16);
      ctx.fillRect(-14, -28, 28, 16);

      // NATO 裝甲/戰車符號: 橫向橢圓賽道符號 "⬭" (Armor Track Oval)
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, -20, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 三點 "●●●" 代表 戰車排 Platoon)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-5, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(0, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(5, -31, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. 地面物理工事: 戰車車體與戰車砲
      ctx.fillStyle = '#263238';
      ctx.fillRect(-13, 0, 26, 4);
      ctx.fillRect(-13, 14, 26, 4);

      ctx.fillStyle = isPlayer ? '#1B5E20' : '#33691E';
      ctx.strokeStyle = isPlayer ? '#81C784' : '#C5E1A5';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-10, 3, 20, 12);
      ctx.strokeRect(-10, 3, 20, 12);

      // 砲塔與砲身
      ctx.fillStyle = isPlayer ? '#2E7D32' : '#1B5E20';
      ctx.beginPath();
      ctx.arc(2, 9, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(2, 9);
      ctx.lineTo(20, 9);
      ctx.stroke();

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍戰車排 PLT] 75mm' : '[NATO 戰車排 PLT] 47mm', 0, -35);

    } else if (inst.type === 'tank_battalion') {
      // ════ NATO 戰車大隊 (APP-6 Tank Battalion: Tactical Box + Armor Oval + 2 Ticks "||") ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-16, -30, 32, 17);
      ctx.fillRect(-16, -30, 32, 17);

      // NATO 裝甲符號: 橫向橢圓 "⬭"
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -21.5, 10, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 雙豎條 "||" 代表 戰車大隊/營 Battalion)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-3, -37);
      ctx.lineTo(-3, -31);
      ctx.moveTo(3, -37);
      ctx.lineTo(3, -31);
      ctx.stroke();

      // 2. 地面物理工事: 裝甲指揮掩體 + 戰車集群
      ctx.fillStyle = isPlayer ? '#1B5E20' : '#263238';
      ctx.strokeStyle = isPlayer ? '#81C784' : '#90A4AE';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-14, 2, 28, 16);
      ctx.strokeRect(-14, 2, 28, 16);

      // 無線電通訊天線
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-5, -14);
      ctx.stroke();

      // 戰車砲身
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(2, 10);
      ctx.lineTo(22, 10);
      ctx.stroke();

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍裝甲大隊 BN] 重裝甲' : '[NATO 戰車大隊 BN] 重裝甲', 0, -40);
    } else if (inst.type === 'towed_artillery') {
      // ════ NATO 拖曳砲兵陣地 (APP-6 Towed Artillery: Tactical Box + Cannonball Dot "●" + Battery Tick) ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -28, 28, 16);
      ctx.fillRect(-14, -28, 28, 16);

      // NATO 野戰砲兵符號: 中央實心黑色砲彈圓點 "●" (Field Artillery Solid Cannonball)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -20, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // 砲架橫樑示意線
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -20);
      ctx.lineTo(8, -20);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 雙點 "●●" 代表 砲兵連 Battery)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-3, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(3, -31, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. 地面物理工事: 野戰重砲 (雙腳開腳大架、防盾與砲管)
      // 防盾
      ctx.strokeStyle = isPlayer ? '#90CAF9' : '#B0BEC5';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(2, 18);
      ctx.stroke();

      // 長身管砲身與制退器
      ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FFCA28';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(22, 10);
      ctx.stroke();

      // 雙腳開腳駐鋤 (Trail Legs)
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-12, 3);
      ctx.moveTo(0, 10);
      ctx.lineTo(-12, 17);
      ctx.stroke();

      // 彈藥箱與砲彈堆
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(-14, 8, 4, 4);

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍野戰砲兵連 BTRY] 105mm' : '[NATO 拖曳砲兵 BTRY] 75mm', 0, -35);
    } else if (inst.type === 'flak_battery') {
      // ════ NATO 防空高射砲兵連 (APP-6 Air Defense: Tactical Box + Air Dome "⌢") ════
      // 1. NATO APP-6 Tactical Box Frame (友軍藍 / 敵軍紅)
      ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(183, 28, 28, 0.45)';
      ctx.strokeStyle = isPlayer ? '#42A5F5' : '#FF5252';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -28, 28, 16);
      ctx.fillRect(-14, -28, 28, 16);

      // NATO 防空符號: 仰角拱頂罩 "⌢" (Air Defense Arch)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -17, 5, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, -17);
      ctx.lineTo(6, -17);
      ctx.stroke();

      // NATO 編制符號 (頂部中央 雙點 "●●" 代表 防空砲連)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-3, -31, 1.8, 0, Math.PI * 2);
      ctx.arc(3, -31, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. 地面物理工事: 友軍 90mm M2 / 敵軍 八八式 75mm 重型高射砲
      ctx.strokeStyle = isPlayer ? '#64B5F6' : '#78909C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 10);
      ctx.lineTo(8, 10);
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 18);
      ctx.stroke();

      // 旋轉圓盤
      ctx.fillStyle = isPlayer ? '#1E3A5F' : '#37474F';
      ctx.beginPath();
      ctx.arc(0, 10, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 高仰角防空砲管
      ctx.strokeStyle = isPlayer ? '#80DEEA' : '#FF8A80';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(16, 2);
      ctx.stroke();

      // 標籤
      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FF8A80';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍防空砲連 AA] 90mm M2' : '[NATO 防空砲兵連 AA] 75mm', 0, -35);
    } else if (inst.type === 'ship_repair_dock') {
      // ════ NATO 船舶維修設施 / 應急修船浮塢 (Ship Repair Facility & Floating Drydock) ════
      // 1. NATO APP-6 Maintenance Tactical Box Frame (友軍藍戰術框 + 扳手維修符號)
      ctx.fillStyle = 'rgba(21, 101, 192, 0.55)';
      ctx.strokeStyle = '#42A5F5';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-18, -32, 36, 18);
      ctx.fillRect(-18, -32, 36, 18);

      // NATO 維修符號: 交叉工具
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-9, -27);
      ctx.lineTo(9, -15);
      ctx.moveTo(9, -27);
      ctx.lineTo(-9, -15);
      ctx.stroke();

      // "REP" 標記
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REP', 0, -18);

      // 2. 地面與水域物理設施: 巨大浮動修船塢槽 (Floating U-Drydock Basin) + 起重機桁架 + 焊接閃光
      ctx.fillStyle = '#1A2938';
      ctx.strokeStyle = '#42A5F5';
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -12, 10, 48);
      ctx.fillRect(-24, -12, 10, 48);
      ctx.strokeRect(14, -12, 10, 48);
      ctx.fillRect(14, -12, 10, 48);

      // 塢底基座
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-24, 36);
      ctx.lineTo(24, 36);
      ctx.stroke();

      // 浮動船塢水槽
      ctx.fillStyle = 'rgba(3, 169, 244, 0.2)';
      ctx.fillRect(-14, -12, 28, 48);

      // 旋臂造船起重機
      const craneRot = this.time * 0.8;
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-19, 0);
      ctx.lineTo(-19 + Math.cos(craneRot) * 18, Math.sin(craneRot) * 18);
      ctx.stroke();

      // 電銲搶修動態火花
      const weldFlash = (Math.sin(this.time * 16) + 1) * 0.5;
      ctx.fillStyle = `rgba(128, 222, 234, ${0.4 + weldFlash * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 12, 5 + weldFlash * 4, 0, Math.PI * 2);
      ctx.fill();

      // 標籤
      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚓ [NATO 友軍船塢 REPAIR] 應急損管修船廠', 0, -38);
    } else if (inst.type === 'command_post') {
      // ════ NATO 指揮所司令部 (APP-6 Command Post: Headquarters Flag + Fortified Bunker) ════
      // 1. NATO APP-6 Headquarters Frame (友軍藍 / 敵軍紅 + 左側旗桿 Flagpole)
      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameStroke;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-16, -32, 32, 18);
      ctx.fillRect(-16, -32, 32, 18);

      // 左側指揮所旗桿延伸線 (Headquarters Staff/Flagpole)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -32);
      ctx.lineTo(-16, -42);
      ctx.stroke();

      // "CP" 字樣標示
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CP', 0, -20);

      // 2. 地面物理建築: 重裝甲鋼筋混泥土司令掩體 + 旋轉無線電雷達天線
      ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.45)' : '#263238';
      ctx.strokeStyle = isPlayer ? '#81C784' : '#90A4AE';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -4, 36, 26);
      ctx.fillRect(-18, -4, 36, 26);

      // 司令部防爆觀察窗狹縫
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(-12, 4, 24, 4);

      // 通訊雷達天線桿
      const antRot = this.time * 2.5;
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -18);
      ctx.moveTo(-7 * Math.cos(antRot), -18 - 7 * Math.sin(antRot));
      ctx.lineTo(7 * Math.cos(antRot), -18 + 7 * Math.sin(antRot));
      ctx.stroke();

      // 標籤
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '🚩 [NATO 友軍指揮所 CP] 後勤要塞' : '🚩 [NATO 指揮所 CP] 核心樞紐', 0, -46);
    } else if (inst.type === 'hidden_tunnel') {
      // ════ 隱蔽地下坑道掩體 (Hidden Bomb Shelter / Tunnel Entrance) ════
      ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 蛛網洞穴掩蔽木板
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(10, 5);
      ctx.moveTo(-10, 5);
      ctx.lineTo(10, -5);
      ctx.stroke();

      ctx.fillStyle = '#BCAAA4';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[地下坑道網]', 0, -18);
    } else if (inst.type === 'pontoon_pier') {
      // ════ 浮式人工棧橋港 (Expedient Pontoon Pier / 急造港口) ════
      // 浮動突堤棧橋 (Modular Pontoon Pier) + 卸載吊桿
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#4FC3F7';
      ctx.fillStyle = 'rgba(2, 136, 209, 0.45)';
      ctx.strokeRect(-28, -8, 56, 16);
      ctx.fillRect(-28, -8, 56, 16);

      // 突堤木質棧道橫條紋
      ctx.strokeStyle = '#81D4FA';
      ctx.lineWidth = 1.2;
      for (let px = -24; px <= 24; px += 6) {
        ctx.beginPath();
        ctx.moveTo(px, -8);
        ctx.lineTo(px, 8);
        ctx.stroke();
      }

      // 吊運起重桁架桿
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(26, -14);
      ctx.lineTo(32, -8);
      ctx.stroke();

      // 標籤與工兵升級進度
      ctx.fillStyle = '#80D8FF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚓ [浮式人工棧橋港] 急造港口 (補給線連通)', 0, -22);

      if (inst.upgradeTimer && inst.upgradeTimer > 0) {
        const upProg = Math.min(1, inst.upgradeTimer / 35.0);
        ctx.fillStyle = '#FFD54F';
        ctx.fillText(`🔨 工兵拓建中: ${Math.round(inst.upgradeTimer)}s / 35s`, 0, 26);
        ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
        ctx.fillRect(-20, 29, 40, 3.5);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(-20, 29, 40 * upProg, 3.5);
      }
    } else if (inst.type === 'major_naval_port') {
      // ════ 正規深水軍港 (Major Deepwater Naval Port) ════
      // 現代化大型深水混凝土突堤碼頭 + 港埠起重機
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#00E5FF';
      ctx.fillStyle = 'rgba(0, 151, 167, 0.55)';
      ctx.strokeRect(-42, -14, 84, 28);
      ctx.fillRect(-42, -14, 84, 28);

      // 大型龍門吊車架構
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-20, -14);
      ctx.lineTo(-20, -26);
      ctx.lineTo(20, -26);
      ctx.lineTo(20, -14);
      ctx.stroke();

      // 突堤泊靠繫纜樁
      ctx.fillStyle = '#FFFFFF';
      for (const bx of [-36, -18, 0, 18, 36]) {
        ctx.beginPath();
        ctx.arc(bx, -12, 2.2, 0, Math.PI * 2);
        ctx.arc(bx, 12, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚓【正規深水軍港】全島戰略樞紐 (+1.5 CP/s)', 0, -32);
    } else if (inst.type === 'supply_depot') {
      // ════ 戰地輜重補給樞紐 (Supply Depot) ════
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFA726';
      ctx.fillStyle = 'rgba(230, 81, 0, 0.45)';
      ctx.strokeRect(-22, -12, 44, 24);
      ctx.fillRect(-22, -12, 44, 24);

      // 彈藥箱堆疊符號
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-16, -6, 12, 12);
      ctx.strokeRect(4, -6, 12, 12);

      ctx.fillStyle = '#FFE082';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('📦 [戰地輜重樞紐] 建制度修整 +2.0%/s', 0, -20);
    } else if (inst.type === 'field_hospital') {
      // ════ 戰地野戰醫院 (Field Hospital) ════
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#EF5350';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeRect(-20, -12, 40, 24);
      ctx.fillRect(-20, -12, 40, 24);

      // 紅十字 Red Cross
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(-3, -8, 6, 16);
      ctx.fillRect(-8, -3, 16, 6);

      ctx.fillStyle = '#EF5350';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏥 [戰地野戰醫院] 組織度穩定 +2.5%/s', 0, -20);
    } else if (inst.type === 'city') {
      // ════ 城市市區 (City: High-Density Urban Street Grid & Buildings) ════
      ctx.fillStyle = 'rgba(38, 50, 56, 0.85)';
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 2;
      ctx.strokeRect(-32, -22, 64, 44);
      ctx.fillRect(-32, -22, 64, 44);

      // 十字街道網格
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-32, 0);
      ctx.lineTo(32, 0);
      ctx.moveTo(0, -22);
      ctx.lineTo(0, 22);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4大建築街區群 (高層公寓與市政廳)
      ctx.fillStyle = '#455A64';
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-28, -18, 12, 14);
      ctx.strokeRect(-28, -18, 12, 14);
      ctx.fillRect(16, -18, 12, 14);
      ctx.strokeRect(16, -18, 12, 14);
      ctx.fillRect(-28, 4, 12, 14);
      ctx.strokeRect(-28, 4, 12, 14);
      ctx.fillRect(16, 4, 12, 14);
      ctx.strokeRect(16, 4, 12, 14);

      // 市政中心/鐘樓頂部屋脊 (中央磚紅核心)
      ctx.fillStyle = '#BF360C';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = '#FF8A65';
      ctx.strokeRect(-8, -8, 16, 16);

      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🏛️【城市核心市區】${inst.name.split(' ')[0]}`, 0, -30);
    } else if (inst.type === 'town') {
      // ════ 城鎮集市 (Town: Traditional Crossroads Settlement & Houses) ════
      ctx.fillStyle = 'rgba(62, 39, 35, 0.75)';
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-24, -16, 48, 32);
      ctx.fillRect(-24, -16, 48, 32);

      // 市集道路
      ctx.strokeStyle = '#BCAAA4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();

      // 磚瓦人字形小屋群
      ctx.fillStyle = '#D84315';
      ctx.strokeStyle = '#FFAB91';
      ctx.lineWidth = 1.2;
      for (const hx of [-16, 4]) {
        for (const hy of [-12, 4]) {
          ctx.beginPath();
          ctx.moveTo(hx, hy + 8);
          ctx.lineTo(hx + 6, hy);
          ctx.lineTo(hx + 12, hy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#FFCC80';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🏘️【城鎮市集】${inst.name.split(' ')[0]}`, 0, -24);
    } else if (inst.type === 'settlement') {
      // ════ 沿海漁村定居點 (Settlement: Coastal Huts & Dock Pier) ════
      ctx.fillStyle = 'rgba(78, 52, 46, 0.65)';
      ctx.strokeStyle = '#A1887F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3座圓形茅草屋頂
      ctx.fillStyle = '#8D6E63';
      for (const [cx, cy] of [[-7, -6], [7, -6], [0, 8]]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#FFE082';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🏡【沿海定居點】${inst.name.split(' ')[0]}`, 0, -24);
    } else if (inst.type === 'refugee_camp') {
      // ════ 戰地難民營 (Refugee Camp: Humanitarian UN / Red Cross Relief Tents) ════
      ctx.fillStyle = 'rgba(30, 40, 50, 0.85)';
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2;
      ctx.strokeRect(-26, -18, 52, 36);
      ctx.fillRect(-26, -18, 52, 36);

      // 人道救援白色/卡其色帳篷群 (4頂尖頂帆布帳篷)
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = '#90A4AE';
      ctx.lineWidth = 1.2;
      for (const tx of [-18, 4]) {
        for (const ty of [-14, 4]) {
          ctx.beginPath();
          ctx.moveTo(tx, ty + 10);
          ctx.lineTo(tx + 7, ty);
          ctx.lineTo(tx + 14, ty + 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // 中央聯合國藍色圓徽 + 紅十字人道旗標
      ctx.fillStyle = '#0288D1';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 紅十字
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(-1.2, -3.2, 2.4, 6.4);
      ctx.fillRect(-3.2, -1.2, 6.4, 2.4);

      ctx.fillStyle = '#FFE082';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⛺【人道救援難民營】誤擊 -15 CP`, 0, -26);
    } else if (inst.type === 'bunker_nest') {
      // ════ 加固鋼筋混凝土暗堡與機槍碉堡 (Fortified Concrete Bunker & MG Nest) ════
      // 1. 沙袋半月形外圍防護堤
      ctx.strokeStyle = '#BCAAA4';
      ctx.fillStyle = 'rgba(78, 52, 46, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 4, 18, -Math.PI * 0.85, Math.PI * 0.85);
      ctx.stroke();
      ctx.fill();

      // 2. 八角形鋼筋混泥土厚重工事主體
      ctx.fillStyle = isPlayer ? 'rgba(21, 101, 192, 0.65)' : '#37474F';
      ctx.strokeStyle = isPlayer ? '#42A5F5' : '#78909C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4 + Math.PI / 8;
        const bx = Math.cos(ang) * 14;
        const by = Math.sin(ang) * 14;
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. 橫向防爆射擊狹縫 (Firing Embrasures)
      ctx.fillStyle = '#1A237E';
      ctx.fillRect(-8, -2, 16, 3.5);
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(-2, -1, 4, 1.8);

      // 4. 重機槍與無後座力砲身
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(8, -3);
      ctx.lineTo(8, 3);
      ctx.stroke();

      // 5. 標籤
      ctx.fillStyle = isPlayer ? '#90CAF9' : '#FF8A80';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '🛡️ [NATO 友軍加固暗堡] 重機槍/無後座力砲' : '🛡️ [敵軍加固防禦暗堡] 重機槍/穿甲砲', 0, -24);
    } else if (inst.type === 'sam_hawk' || inst.type === 'sam_patriot') {
      // ════ 美軍陸戰隊 MIM-23 鷹式 / MIM-104 愛國者防空飛彈營 ════
      // 1. NATO APP-6 防空飛彈長方框標記
      ctx.fillStyle = 'rgba(21, 101, 192, 0.65)';
      ctx.strokeStyle = '#42A5F5';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-16, -30, 32, 17);
      ctx.fillRect(-16, -30, 32, 17);

      // 防空圓頂 + 向上飛彈箭頭
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -18, 5, Math.PI, 0);
      ctx.moveTo(-6, -18);
      ctx.lineTo(6, -18);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, -25);
      ctx.lineTo(-3, -22);
      ctx.moveTo(0, -25);
      ctx.lineTo(3, -22);
      ctx.stroke();

      // 2. 圓形旋轉發射基座
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3. 三聯裝鷹式飛彈導軌與 3 枚白色羽翼飛彈 (或愛國者四聯裝箱式發射架)
      const hawkRot = this.time * 0.4;
      for (let m = 0; m < (inst.type === 'sam_patriot' ? 4 : 3); m++) {
        const mAngle = hawkRot + (m * Math.PI * 2) / (inst.type === 'sam_patriot' ? 4 : 3);
        const mx = Math.cos(mAngle) * 8;
        const my = 6 + Math.sin(mAngle) * 8;

        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(mAngle) * 14, my + Math.sin(mAngle) * 14);
        ctx.stroke();

        // 標誌性梯形翼
        ctx.strokeStyle = '#80DEEA';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(mAngle) * 5, my + Math.sin(mAngle) * 5);
        ctx.lineTo(mx + Math.cos(mAngle) * 5 - Math.sin(mAngle) * 4, my + Math.sin(mAngle) * 5 + Math.cos(mAngle) * 4);
        ctx.moveTo(mx + Math.cos(mAngle) * 5, my + Math.sin(mAngle) * 5);
        ctx.lineTo(mx + Math.cos(mAngle) * 5 + Math.sin(mAngle) * 4, my + Math.sin(mAngle) * 5 - Math.cos(mAngle) * 4);
        ctx.stroke();
      }

      // 4. 標籤
      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(inst.type === 'sam_patriot' ? '🚀 [NATO 愛國者防空飛彈營] MIM-104 Patriot (相列雷達多通道攔截)' : '🚀 [NATO 友軍霍克防空飛彈 SAM] MIM-23 Hawk (自動攔截)', 0, -36);
    } else if (inst.type === 'sa2_sam_site' || inst.type === 'sa3_sam_site' || inst.type === 's300_sam_site') {
      // ════ 敵軍 S-75 德維納 SA-2 / S-125 涅瓦河 SA-3 / S-300PMU SA-10 區域防空飛彈營 ════
      // 1. 環形防護土堤碉堡
      ctx.strokeStyle = inst.type === 'sa3_sam_site' ? '#FF7043' : '#FF5252';
      ctx.fillStyle = 'rgba(62, 39, 35, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 4, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (inst.type === 's300_sam_site') {
        // S-300PMU 4連裝垂直冷發射圓筒 TEL (Quad VLS Launch Tubes) + 混凝土防爆坪
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 1.4;
        ctx.fillRect(-13, -7, 26, 22);
        ctx.strokeRect(-13, -7, 26, 22);
        ctx.fillStyle = '#455A64';
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 1.5;
        for (const [vx, vy] of [[-6, -1], [6, -1], [-6, 9], [6, 9]]) {
          ctx.beginPath();
          ctx.arc(vx, vy, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFAB40';
          ctx.beginPath();
          ctx.arc(vx, vy, 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#455A64';
        }
      } else if (inst.type === 'sa3_sam_site') {
        // 雙聯裝 SA-3 固定旋轉傾斜發射架
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(13, 0);
        ctx.moveTo(-11, 8);
        ctx.lineTo(13, 8);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(-6, 8);
        ctx.lineTo(15, 8);
        ctx.stroke();

        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(-5, 0);
        ctx.moveTo(-11, 8);
        ctx.lineTo(-5, 8);
        ctx.stroke();
      } else {
        // 2. 六邊形發射架滑軌 (SA-2 Guideline)
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(14, 4);
        ctx.stroke();

        // 3. 防空飛彈 (銀白彈體 + 紅色助推段)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-6, 4);
        ctx.lineTo(16, 4);
        ctx.stroke();

        // 尾部固體助推火箭
        ctx.strokeStyle = '#FF3D00';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-4, 4);
        ctx.stroke();

        // 十字大型三角翼
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(4, -2);
        ctx.lineTo(4, 10);
        ctx.stroke();
      }

      // 標籤
      ctx.fillStyle = inst.type === 'sa3_sam_site' ? '#FFAB91' : '#FF5252';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        inst.type === 's300_sam_site'
          ? '🚀 [S-300PMU 長程區域防空營] SA-10 Grumble (垂直發射)'
          : inst.type === 'sa3_sam_site'
          ? '🚀 [敵軍薩姆-3 飛彈營] S-125 Neva (SA-3 Goa 雙聯低中空攔截)'
          : '🚀 [敵軍薩姆-2 防空飛彈營] SA-2 Guideline',
        0,
        -22
      );
    } else if (inst.type === 'coastal_harpoon') {
      // ════ 友軍岸置魚叉反艦飛彈連 (Coastal Harpoon Battery: Sandbag Berm + Quad Canisters) ════
      ctx.fillStyle = 'rgba(38, 50, 56, 0.85)';
      ctx.strokeStyle = '#90A4AE';
      ctx.lineWidth = 1.8;
      ctx.fillRect(-19, -13, 38, 26);
      ctx.strokeRect(-19, -13, 38, 26);
      // 4連裝 Mk-141 發射筒組
      ctx.fillStyle = '#1565C0';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.4;
      for (const cy of [-8.5, -3.5, 1.5, 6.5]) {
        ctx.fillRect(-13, cy - 1.5, 26, 3.2);
        ctx.strokeRect(-13, cy - 1.5, 26, 3.2);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(10.5, cy - 1.2, 2.2, 2.4);
        ctx.fillStyle = '#1565C0';
      }
      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 [NATO 岸置魚叉反艦飛彈連] RGM-84 Harpoon (掠海突防 4500m)', 0, -24);
    } else if (inst.type === 'glcm_site') {
      // ════ 友軍陸基戰斧巡弋飛彈連 (BGM-109G Gryphon TEL + 4-Tube Canister Pod) ════
      ctx.fillStyle = '#1E3A8A';
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2.0;
      ctx.fillRect(-20, -12, 40, 24);
      ctx.strokeRect(-20, -12, 40, 24);
      // Tractor cab + armored quad TEL box
      ctx.fillStyle = '#37474F';
      ctx.fillRect(10, -8, 7, 16);
      ctx.fillStyle = '#1D4ED8';
      ctx.strokeStyle = '#93C5FD';
      ctx.fillRect(-15, -7, 22, 14);
      ctx.strokeRect(-15, -7, 22, 14);
      ctx.fillStyle = '#FFD54F';
      for (const cy of [-4, 0, 4]) {
        ctx.fillRect(-12, cy - 1, 16, 1.8);
      }
      ctx.fillStyle = '#93C5FD';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 [NATO 陸基戰斧巡弋飛彈連] BGM-109G GLCM (TERCOM 6000m)', 0, -24);
    } else if (inst.type === 'coastal_rubezh') {
      // ════ 敵軍 4K51 邊界岸置反艦飛彈連 (Coastal Rubezh Twin P-15M/P-21 Armored Tubes) ════
      ctx.fillStyle = '#5F1616';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.0;
      ctx.fillRect(-20, -13, 40, 26);
      ctx.strokeRect(-20, -13, 40, 26);
      // Twin massive armored KT-161 canisters + radar mast
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#FCA5A5';
      ctx.fillRect(-14, -8.5, 28, 6.5);
      ctx.strokeRect(-14, -8.5, 28, 6.5);
      ctx.fillRect(-14, 2, 28, 6.5);
      ctx.strokeRect(-14, 2, 28, 6.5);
      ctx.fillStyle = '#FF7043';
      ctx.fillRect(11, -7.5, 3, 4.5);
      ctx.fillRect(11, 3, 3, 4.5);
      ctx.fillStyle = '#FCA5A5';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 [華約 4K51 邊界岸防飛彈連] Rubezh (超重型反艦 4800m)', 0, -24);
    } else if (inst.type === 'scud_site') {
      // ════ 華約 9K72 飛毛腿-B 戰術彈道飛彈發射營 (Scud-B MAZ-543 TEL) ════
      ctx.fillStyle = '#450A0A';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2.2;
      ctx.fillRect(-21, -13, 42, 26);
      ctx.strokeRect(-21, -13, 42, 26);
      // MAZ-543 重型 8x8 底盤輪胎 + 雙前置駕駛艙
      ctx.fillStyle = '#111827';
      for (let w = -15; w <= 15; w += 10) {
        ctx.fillRect(w - 3, -16, 6, 3.5);
        ctx.fillRect(w - 3, 12.5, 6, 3.5);
      }
      ctx.fillStyle = '#37474F';
      ctx.fillRect(12, -11, 7, 7);
      ctx.fillRect(12, 4, 7, 7);
      // 豎起之 9M21 重型高爆彈道飛彈 + 尾翼
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-16, -2.5);
      ctx.lineTo(9, -2.5);
      ctx.lineTo(17, 0);
      ctx.lineTo(9, 2.5);
      ctx.lineTo(-16, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(-17, -4.5, 3, 9);
      ctx.fillStyle = '#F87171';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 [華約 9K72 飛毛腿-B 戰術飛彈營] Scud-B SSM (6500m)', 0, -24);
    } else if (inst.type === 'fan_song_radar') {
      // ════ 敵軍扇歌射控火控雷達 (SNR-75 Fan Song Dual Orthogonal Lewis Scanners) ════
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 2.0;
      ctx.fillRect(-13, -10, 26, 20);
      ctx.strokeRect(-13, -10, 26, 20);

      // 雙正交橙紅拋物面扇形掃描天線 (Horizontal + Vertical Fan Arrays)
      const radarRot = this.time * 2.2;
      ctx.save();
      ctx.rotate(radarRot);
      ctx.strokeStyle = '#FF8A65';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(10, -4);
      ctx.moveTo(4, -10);
      ctx.lineTo(4, 10);
      ctx.stroke();
      ctx.fillStyle = '#FF5252';
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 電磁波輻射環 (供 AGM-45 反輻射飛彈鎖定示意)
      const radPulse = (Math.sin(this.time * 6) + 1) * 0.5;
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.3 + radPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, 22 + radPulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#FF8A80';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('📡 [敵軍射控火控雷達] Fan Song 扇歌 (高頻輻射)', 0, -24);
    } else if (inst.type === 'rubber_plantation') {
      // ════ 橡膠種植園 (Rubber Plantation) ════
      // 1. 種植林蔭地表
      ctx.fillStyle = 'rgba(46, 125, 50, 0.25)';
      ctx.fillRect(-22, -18, 44, 36);
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-22, -18, 44, 36);

      // 2. 整齊排列的橡膠樹冠 (Rows of Rubber Trees)
      for (let rx = -16; rx <= 16; rx += 10) {
        for (let ry = -12; ry <= 12; ry += 12) {
          ctx.fillStyle = '#1B5E20';
          ctx.beginPath();
          ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#388E3C';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 3. 中央木製膠乳收購站
      ctx.fillStyle = '#795548';
      ctx.fillRect(-6, -5, 12, 10);
      ctx.strokeStyle = '#D7CCC8';
      ctx.strokeRect(-6, -5, 12, 10);

      // 標籤
      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFE082';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🌲 [${inst.name}]`, 0, -24);
    } else if (inst.type === 'river_ferry') {
      // ════ 內河渡口 (River Ferry Terminal) ════
      // 1. 木造渡口突堤與繫纜樁
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(-18, -4, 20, 8);
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-18, -4, 20, 8);

      // 2. 停泊的平底鋼纜渡輪駁船 (Ferry Barge)
      ctx.fillStyle = '#37474F';
      ctx.fillRect(4, -7, 18, 14);
      ctx.strokeStyle = isPlayer ? '#42A5F5' : '#FFB300';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, -7, 18, 14);

      // 鋼纜引渡線
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // 渡口號誌燈
      ctx.fillStyle = isPlayer ? '#00E5FF' : '#FFD54F';
      ctx.beginPath();
      ctx.arc(-16, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFD54F';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⛴️ [${inst.name}]`, 0, -22);
    } else if (inst.type === 'radio_station') {
      // ════ 轉播電台 / 無線電通訊塔 (Radio Relay Station) ════
      // 1. 鋼構桁架發射鐵塔
      ctx.strokeStyle = isPlayer ? '#00E5FF' : '#FF5252';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-10, 14);
      ctx.lineTo(0, -18);
      ctx.lineTo(10, 14);
      // 塔架橫樑
      ctx.moveTo(-7, 6);
      ctx.lineTo(7, 6);
      ctx.moveTo(-4, -4);
      ctx.lineTo(4, -4);
      ctx.stroke();

      // 2. 頂部航空障礙閃爍信標
      const blink = Math.sin(this.time * 8) > 0;
      ctx.fillStyle = blink ? '#FF1744' : '#546E7A';
      ctx.beginPath();
      ctx.arc(0, -19, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. 擴散電波環
      const wavePhase = ((this.time * 2) % 1);
      ctx.strokeStyle = isPlayer ? `rgba(0, 229, 255, ${0.7 * (1 - wavePhase)})` : `rgba(255, 82, 82, ${0.7 * (1 - wavePhase)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -19, 6 + wavePhase * 18, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();

      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FF8A80';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`📡 [${inst.name}]`, 0, -26);
    } else if (inst.type === 'ammo_cache') {
      // ════ 前線彈藥補給庫 (Ammunition Cache) ════
      // 1. 環形防爆沙袋堡 (Sandbag Revetment)
      ctx.strokeStyle = '#BCAAA4';
      ctx.fillStyle = 'rgba(78, 52, 46, 0.7)';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-16, -12, 32, 24);
      ctx.fillRect(-16, -12, 32, 24);

      // 2. 堆疊的軍綠色彈藥箱與帆布遮棚
      ctx.fillStyle = '#33691E';
      ctx.fillRect(-10, -7, 9, 6);
      ctx.fillRect(1, -7, 9, 6);
      ctx.fillRect(-5, 0, 10, 6);

      // 3. 亮黃/紅色危險標記
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-4, -3);
      ctx.lineTo(4, -3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFAB91';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`📦 [${inst.name}]`, 0, -20);
    } else if (inst.type === 'watchtower') {
      // ════ 邊境觀察哨樓 (Border Observation Watchtower) ════
      // 1. 四腳木/鋼支撐架
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-10, 16);
      ctx.lineTo(-5, -10);
      ctx.moveTo(10, 16);
      ctx.lineTo(5, -10);
      ctx.moveTo(-7, 3);
      ctx.lineTo(7, 3);
      ctx.stroke();

      // 2. 頂部高架木造瞭望崗樓
      ctx.fillStyle = isPlayer ? '#1565C0' : '#4E342E';
      ctx.strokeStyle = isPlayer ? '#42A5F5' : '#D7CCC8';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-8, -16, 16, 8);
      ctx.strokeRect(-8, -16, 16, 8);

      // 3. 鐵皮屋頂 (Roof)
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.moveTo(-11, -16);
      ctx.lineTo(0, -22);
      ctx.lineTo(11, -16);
      ctx.closePath();
      ctx.fill();

      // 4. 探照燈光束提示
      const beamAng = this.time * 0.8;
      ctx.strokeStyle = 'rgba(255, 238, 88, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(Math.cos(beamAng) * 32, -14 + Math.sin(beamAng) * 32);
      ctx.stroke();

      ctx.fillStyle = isPlayer ? '#80DEEA' : '#FFE082';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🗼 [${inst.name}]`, 0, -28);
    }

    if (inst.health < inst.maxHealth) {
      const hpPct = Math.max(0, inst.health / inst.maxHealth);
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 22);
      ctx.lineTo(16, 22);
      ctx.stroke();

      ctx.strokeStyle = hpPct > 0.4 ? '#66BB6A' : '#EF5350';
      ctx.beginPath();
      ctx.moveTo(-16, 22);
      ctx.lineTo(-16 + 32 * hpPct, 22);
      ctx.stroke();
    }

    ctx.restore();
  }

  private isSubmarineShip(ship: Ship): boolean {
    return (
      ship.type === 'submarine' ||
      ship.type === 'foxtrot' ||
      ship.type === 'ssn_la' ||
      ship.type === 'ssgn_oscar'
    );
  }

  // Draw Ships with RTS Selection Indicators & Submarine Fog of War
  public drawShips(ships: Ship[], camera: Camera, selectedUnitIds: string[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const ship of ships) {
      const isSub = this.isSubmarineShip(ship);
      if (ship.side === 'enemy' && isSub && !ship.isSunk && !ship.isSpotted) {
        continue; // Undetected enemy submarine stays hidden under Fog of War
      }

      const isSelected = selectedUnitIds.includes(ship.id);
      if (!isSelected && !this.isWorldCircleVisible(ship.pos.x, ship.pos.y, Math.max(ship.length * 1.35, 260), camera)) {
        continue;
      }

      this.drawWake(ship);

      // Submarine Sonar Contact / Stealth Bubble Ring
      if (isSub && !ship.isSunk) {
        const pulse = (Math.sin(this.time * 5.2) + 1) * 0.5;
        if (ship.side === 'enemy' && ship.isSpotted) {
          ctx.strokeStyle = `rgba(255, 171, 64, ${0.45 + pulse * 0.4})`;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.52 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (ship.side !== 'enemy') {
          if (ship.isSpottedByEnemy) {
            ctx.strokeStyle = `rgba(255, 82, 82, ${0.5 + pulse * 0.45})`;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.52 + pulse * 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = 'rgba(77, 208, 225, 0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.arc(ship.pos.x, ship.pos.y, ship.length * 0.48, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // RTS A* Sea-Lane Waypoint Path Line
      if (isSelected && ship.order.targetPos && (ship.order.type === 'move' || ship.order.type === 'attack')) {
        const wps = ship.order.waypoints;
        const startIdx = ship.order.activeWaypointIndex ?? 0;
        const hasWaypoints = Array.isArray(wps) && wps.length > startIdx;
        if (ship.order.type === 'move' || hasWaypoints) {
          ctx.strokeStyle = ship.order.type === 'attack' ? 'rgba(255, 138, 128, 0.65)' : 'rgba(0, 230, 118, 0.65)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(ship.pos.x, ship.pos.y);
          if (hasWaypoints) {
            for (let wi = startIdx; wi < wps.length; wi++) {
              ctx.lineTo(wps[wi].x, wps[wi].y);
            }
          } else {
            ctx.lineTo(ship.order.targetPos.x, ship.order.targetPos.y);
          }
          ctx.stroke();

          ctx.setLineDash([]);
          if (hasWaypoints) {
            ctx.fillStyle = 'rgba(0, 230, 118, 0.6)';
            for (let wi = startIdx; wi < wps.length - 1; wi++) {
              ctx.beginPath();
              ctx.arc(wps[wi].x, wps[wi].y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.fillStyle = ship.order.type === 'attack' ? '#FF5252' : '#00E676';
          ctx.beginPath();
          ctx.arc(ship.order.targetPos.x, ship.order.targetPos.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const isPlayer = ship.side === 'player';
      const isAllied = ship.side === 'allied';
      const hullColor = isPlayer ? '#E0F7FA' : isAllied ? '#B9F6CA' : '#FFCDD2';
      const detailColor = isPlayer ? '#80DEEA' : isAllied ? '#00E676' : '#EF9A9A';

      if (ship.isSunk && ship.isBrokenInTwo) {
        // ══════════════════════════════════════════════════════════
        // 艦體應力斷裂兩截沉沒 (Ship Sinking Split in Two Segments)
        // ══════════════════════════════════════════════════════════
        const breakX = ship.length * (ship.breakLineOffset || 0);
        const l = ship.length;
        const w = ship.width;
        const alpha = Math.max(0, 1 - ship.sinkProgress);
        const breakProg = ship.breakProgress || 1;

        // 1. 艦尾節 (Stern Section): 斷裂後向後傾側沉降
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.globalAlpha = alpha;
        ctx.rotate(ship.heading + (ship.sternAngleOffset || -0.25) * breakProg);
        ctx.beginPath();
        ctx.rect(-l, -w * 2, breakX + l, w * 4);
        ctx.clip();
        this.renderShipHullByType(ship, hullColor, detailColor);
        ctx.restore();

        // 2. 艦首節 (Bow Section): 斷裂後艦首下插前傾
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.globalAlpha = alpha;
        ctx.rotate(ship.heading + (ship.bowAngleOffset || 0.18) * breakProg);
        ctx.beginPath();
        ctx.rect(breakX, -w * 2, l * 2, w * 4);
        ctx.clip();
        this.renderShipHullByType(ship, hullColor, detailColor);
        ctx.restore();

        // 3. 斷裂接縫處 (Jagged Steel Fracture Line & Raging Internal Flame)
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        ctx.rotate(ship.heading);

        // 撕裂鋼板輪廓
        ctx.strokeStyle = '#FF3D00';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(breakX, -w * 0.52);
        ctx.lineTo(breakX + 4, -w * 0.2);
        ctx.lineTo(breakX - 4, w * 0.2);
        ctx.lineTo(breakX, w * 0.52);
        ctx.stroke();

        // 斷裂處高熱燃燒火光與融鐵核心
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.arc(breakX, 0, Math.min(8, w * 0.45), 0, Math.PI * 2);
        ctx.fill();

        // 4. 彈藥庫劇烈殉爆瞬態高光光球 (Catastrophic Magazine Detonation Flash)
        if (ship.magazineFlashTimer && ship.magazineFlashTimer > 0) {
          const flashAlpha = Math.min(1, ship.magazineFlashTimer / 0.5);
          const flashR = (1 - flashAlpha) * (ship.length * 1.6) + 35;
          const flashGrad = ctx.createRadialGradient(breakX, 0, 2, breakX, 0, flashR);
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
          flashGrad.addColorStop(0.25, `rgba(255, 238, 88, ${flashAlpha * 0.95})`);
          flashGrad.addColorStop(0.65, `rgba(255, 87, 34, ${flashAlpha * 0.75})`);
          flashGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(breakX, 0, flashR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // 標準艦體姿態繪製
        ctx.save();
        ctx.translate(ship.pos.x, ship.pos.y);
        if (ship.isSunk) {
          ctx.globalAlpha = Math.max(0, 1 - ship.sinkProgress);
          ctx.rotate(ship.heading + ship.sinkProgress * 0.4);
        } else {
          ctx.rotate(ship.heading);
          // Subsurface ocean drop shadow & waterline cushion for surfaced ships
          if (!(this.isSubmarineShip(ship) && (ship.isSubmerged ?? true))) {
            ctx.fillStyle = 'rgba(2, 7, 15, 0.48)';
            ctx.beginPath();
            ctx.ellipse(2, 3, ship.length * 0.51, ship.width * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        this.renderShipHullByType(ship, hullColor, detailColor);
        if (!ship.isSunk) {
          this.drawShipUniversalDetails(ship, hullColor, detailColor);
        }
        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════
      // 戰損燃燒與沉沒特效 (Battle Damage Fire, Black Smoke & Oil Slicks)
      // ══════════════════════════════════════════════════════════
      if (ship.isSunk) {
        // Sinking Ship: Expanding Iridescent Oil Slick on Water Surface
        const slickRadius = (ship.length * 0.5) + ship.sinkProgress * 32;
        const oilGrad = ctx.createRadialGradient(
          ship.pos.x, ship.pos.y, 4,
          ship.pos.x, ship.pos.y, slickRadius
        );
        oilGrad.addColorStop(0, 'rgba(10, 25, 45, 0.6)');
        oilGrad.addColorStop(0.6, 'rgba(21, 52, 85, 0.35)');
        oilGrad.addColorStop(0.85, 'rgba(41, 121, 150, 0.18)');
        oilGrad.addColorStop(1, 'rgba(41, 121, 150, 0)');

        ctx.fillStyle = oilGrad;
        ctx.beginPath();
        ctx.ellipse(ship.pos.x, ship.pos.y, slickRadius, slickRadius * 0.65, ship.heading, 0, Math.PI * 2);
        ctx.fill();

        // Water boil, foam and boiler room steam bubbles
        ctx.strokeStyle = 'rgba(224, 247, 250, 0.45)';
        ctx.lineWidth = 1.2;
        for (let b = 0; b < 4; b++) {
          const bAngle = (this.time * 3 + b * 1.5) % (Math.PI * 2);
          const bDist = (b * 9 + this.time * 12) % (ship.length * 0.4);
          const bx = ship.pos.x + Math.cos(ship.heading + bAngle) * bDist;
          const by = ship.pos.y + Math.sin(ship.heading + bAngle) * bDist;
          ctx.beginPath();
          ctx.arc(bx, by, 3 + (b % 3), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (ship.health < ship.maxHealth * 0.55) {
        // Heavy Battle Damage: Multi-stage Billowing Black Smoke & Internal Fiery Core
        const isCritical = ship.health < ship.maxHealth * 0.3;
        const plumeCount = isCritical ? 4 : 2;

        for (let pIdx = 0; pIdx < plumeCount; pIdx++) {
          const offsetAlongHull = (pIdx - (plumeCount - 1) / 2) * (ship.length * 0.22);
          const originX = ship.pos.x + Math.cos(ship.heading) * offsetAlongHull;
          const originY = ship.pos.y + Math.sin(ship.heading) * offsetAlongHull;

          // 1. Billowing dense black smoke clouds drifting astern
          for (let s = 0; s < 3; s++) {
            const puffCycle = (this.time * 1.8 + pIdx * 0.4 + s * 0.32) % 1;
            const r = 6 + puffCycle * 22;
            const alpha = (1 - puffCycle) * 0.6;
            // Drift opposite to ship heading + wind drift
            const driftDist = puffCycle * 28;
            const driftX = originX - Math.cos(ship.heading) * driftDist + Math.sin(this.time * 2 + s) * 5;
            const driftY = originY - Math.sin(ship.heading) * driftDist - puffCycle * 22;

            // Gradient smoke puff: dark charcoal edges
            ctx.fillStyle = `rgba(18, 24, 32, ${alpha})`;
            ctx.beginPath();
            ctx.arc(driftX, driftY, r, 0, Math.PI * 2);
            ctx.fill();
          }

          // 2. Active raging internal fire combustion core on deck
          if (isCritical) {
            const fireFlicker = (Math.sin(this.time * 16 + pIdx * 3) + 1) * 0.5;
            const flameRadius = 4 + fireFlicker * 5;

            // Intense orange/yellow fireball
            const fireGrad = ctx.createRadialGradient(
              originX, originY, 1,
              originX, originY, flameRadius
            );
            fireGrad.addColorStop(0, '#FFF59D');
            fireGrad.addColorStop(0.4, '#FFA726');
            fireGrad.addColorStop(0.8, '#FF5722');
            fireGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');

            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.arc(originX, originY, flameRadius, 0, Math.PI * 2);
            ctx.fill();

            // Flying burning embers / sparks
            const sparkCycle = (this.time * 5 + pIdx * 2) % 1;
            const sparkX = originX + (Math.sin(this.time * 10 + pIdx) - 0.5) * 12 - Math.cos(ship.heading) * (sparkCycle * 20);
            const sparkY = originY - sparkCycle * 24;
            ctx.fillStyle = '#FFE082';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ══════════════════════════════════════════════════════════
      // 戰術線條與軍事圖例 (Tactical Vectors & NATO Symbology)
      // ══════════════════════════════════════════════════════════
      if (isSelected && !ship.isSunk) {
        this.drawUnitSelectionRing(ship.pos, Math.max(ship.length, ship.width) * 0.65);

        // 1. Heading Vector with 30s & 60s Navigation Time Ticks
        const cosH = Math.cos(ship.heading);
        const sinH = Math.sin(ship.heading);
        const vectorLen = Math.max(80, ship.speed * 2.2);
        const tick30X = ship.pos.x + cosH * (vectorLen * 0.5);
        const tick30Y = ship.pos.y + sinH * (vectorLen * 0.5);
        const tick60X = ship.pos.x + cosH * vectorLen;
        const tick60Y = ship.pos.y + sinH * vectorLen;

        ctx.strokeStyle = 'rgba(0, 230, 118, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ship.pos.x, ship.pos.y);
        ctx.lineTo(tick60X, tick60Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 30s Tick
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tick30X - sinH * 6, tick30Y + cosH * 6);
        ctx.lineTo(tick30X + sinH * 6, tick30Y - cosH * 6);
        ctx.stroke();

        // 60s Tick with Arrowhead
        ctx.beginPath();
        ctx.moveTo(tick60X - sinH * 7, tick60Y + cosH * 7);
        ctx.lineTo(tick60X + sinH * 7, tick60Y - cosH * 7);
        ctx.stroke();

        ctx.fillStyle = '#00E676';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('30s', tick30X + 8, tick30Y + 3);
        ctx.fillText('60s', tick60X + 8, tick60Y + 3);

        // 2. NATO APP-6 Naval Tactical Frame (Blue / Green Rectangle / Red Diamond)
        const frameW = 32;
        const frameH = 18;
        const frameY = ship.pos.y - ship.width - 32;
        const isPl = ship.side === 'player';
        const isAl = ship.side === 'allied';
        ctx.strokeStyle = isPl ? '#42A5F5' : isAl ? '#00E676' : '#FF5252';
        ctx.fillStyle = isPl ? 'rgba(13, 71, 161, 0.75)' : isAl ? 'rgba(27, 94, 32, 0.75)' : 'rgba(183, 28, 28, 0.75)';
        ctx.lineWidth = 1.6;

        if (!isPl && !isAl) {
          // NATO APP-6 敵軍菱形邊框 (Hostile Diamond Frame)
          ctx.beginPath();
          ctx.moveTo(ship.pos.x, frameY);
          ctx.lineTo(ship.pos.x + frameW * 0.55, frameY + frameH / 2);
          ctx.lineTo(ship.pos.x, frameY + frameH);
          ctx.lineTo(ship.pos.x - frameW * 0.55, frameY + frameH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // NATO APP-6 友軍長方形邊框 (Friendly Rectangle Frame - Blue for US, Green for Allied)
          ctx.fillRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);
          ctx.strokeRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);
        }

        // NATO APP-6 艦艇兵種專用圖例符號
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.3;
        const cy = frameY + frameH / 2;
        const cx = ship.pos.x;

        if (ship.type === 'carrier' || ship.type === 'cve' || ship.type === 'cv63' || ship.type === 'cvn' || ship.type === 'cvhg_kiev' || ship.type === 'lph') {
          // 航空母艦 (Aircraft Carrier): 水平水線 + 上方雙翼飛翼折角 (Aviation Chevron)
          ctx.beginPath();
          ctx.moveTo(cx - 9, cy + 3);
          ctx.lineTo(cx + 9, cy + 3);
          ctx.moveTo(cx - 7, cy - 2);
          ctx.lineTo(cx, cy - 6);
          ctx.lineTo(cx + 7, cy - 2);
          ctx.stroke();
        } else if (ship.type === 'submarine' || ship.type === 'foxtrot' || ship.type === 'ssn_la' || ship.type === 'ssgn_oscar') {
          // 潛艦 (Submarine): 水線 + 下潛水下圓弧 (Submerged Arc)
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 1);
          ctx.lineTo(cx + 8, cy - 1);
          ctx.arc(cx, cy - 1, 5.5, 0, Math.PI);
          ctx.stroke();
        } else if (ship.type === 'lcvp' || ship.type === 'lst' || ship.type === 'lsm_r' || ship.type === 'lcm8' || ship.type === 'lcac' || ship.type === 'lpd') {
          // 兩棲登陸艇/登陸艦 (Amphibious Craft): 水線 + 登陸跳板導引箭頭 (Landing Ramp Arrow)
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy + 3);
          ctx.lineTo(cx + 8, cy + 3);
          ctx.moveTo(cx - 4, cy + 3);
          ctx.lineTo(cx, cy - 4);
          ctx.lineTo(cx + 4, cy - 4);
          ctx.stroke();
        } else if (ship.type === 'battleship' || ship.type === 'kongo' || ship.type === 'bb_iowa_mod') {
          // 主力戰艦 (Battleship): 重型水面作戰艦 (水線 + 雙重戰鬥桅檣主砲)
          ctx.beginPath();
          ctx.moveTo(cx - 9, cy + 3);
          ctx.lineTo(cx + 9, cy + 3);
          ctx.moveTo(cx, cy - 5);
          ctx.lineTo(cx, cy + 3);
          ctx.moveTo(cx - 4, cy - 1);
          ctx.lineTo(cx + 4, cy - 1);
          ctx.stroke();
        } else {
          // 水面作戰艦巡洋艦/驅逐艦/巡防艦 (Cruiser / Destroyer / Frigate): 水線 + 射控主桅
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy + 3);
          ctx.lineTo(cx + 8, cy + 3);
          ctx.moveTo(cx, cy - 4);
          ctx.lineTo(cx, cy + 3);
          ctx.stroke();
        }

        // Hull code & Speed tag (e.g. "BB · 28KT")
        ctx.fillStyle = '#E0F7FA';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        const typeCode = ship.type.toUpperCase();
        ctx.fillText(`${typeCode} · ${Math.round(ship.speed)}KT`, ship.pos.x, frameY + frameH + 9);

        // Naval Main Battery Gun Range
        const maxGunRange = ship.turrets.reduce((m, t) => Math.max(m, t.range), 0);
        if (maxGunRange > 0) {
          ctx.strokeStyle = 'rgba(255, 183, 77, 0.28)';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          ctx.arc(ship.pos.x, ship.pos.y, maxGunRange, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Anti-Aircraft Flak Envelope
        if (ship.flakRange > 0) {
          ctx.strokeStyle = 'rgba(128, 222, 234, 0.24)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(ship.pos.x, ship.pos.y, ship.flakRange, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      if (!ship.isSunk) {
        this.drawShipStatus(ship, camera.zoom, isSelected);
      }
    }

    ctx.restore();
  }

  // Draw RTS Selection Ring with CIC corner lock-on brackets
  private drawUnitSelectionRing(pos: Vector2D, radius: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#00E676';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 crisp CIC corner lock-on reticle brackets
    const b = radius + 5;
    const arm = Math.max(6, Math.min(12, radius * 0.26));
    ctx.strokeStyle = '#69F0AE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(pos.x - b, pos.y - b + arm);
    ctx.lineTo(pos.x - b, pos.y - b);
    ctx.lineTo(pos.x - b + arm, pos.y - b);
    // Top-Right
    ctx.moveTo(pos.x + b - arm, pos.y - b);
    ctx.lineTo(pos.x + b, pos.y - b);
    ctx.lineTo(pos.x + b, pos.y - b + arm);
    // Bottom-Right
    ctx.moveTo(pos.x + b, pos.y + b - arm);
    ctx.lineTo(pos.x + b, pos.y + b);
    ctx.lineTo(pos.x + b - arm, pos.y + b);
    // Bottom-Left
    ctx.moveTo(pos.x - b + arm, pos.y + b);
    ctx.lineTo(pos.x - b, pos.y + b);
    ctx.lineTo(pos.x - b, pos.y + b - arm);
    ctx.stroke();

    ctx.restore();
  }

  // Ship Wake Lines (Graded Kelvin wake ribbon + bow V-spray)
  private drawWake(ship: Ship) {
    if (ship.speed < 0.5 || ship.wakePoints.length < 2) return;
    const ctx = this.ctx;
    const pts = ship.wakePoints;
    const baseRgb = ship.side === 'player' ? '128, 222, 234' : ship.side === 'allied' ? '105, 240, 174' : '239, 154, 154';

    // Outer soft foam glow
    ctx.strokeStyle = `rgba(${baseRgb}, 0.08)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Graded fading wake core from tail to stern
    ctx.lineWidth = 1.6;
    for (let i = 1; i < pts.length; i++) {
      const t = i / (pts.length - 1);
      ctx.strokeStyle = `rgba(${baseRgb}, ${(0.05 + t * 0.32).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // Bow wave V-spray lines
    const cosH = Math.cos(ship.heading);
    const sinH = Math.sin(ship.heading);
    const bowX = ship.pos.x + cosH * (ship.length * 0.48);
    const bowY = ship.pos.y + sinH * (ship.length * 0.48);
    const sprayLen = Math.min(22, ship.speed * 1.15);

    ctx.strokeStyle = 'rgba(224, 247, 250, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(bowX, bowY);
    ctx.lineTo(bowX - cosH * sprayLen + sinH * (sprayLen * 0.58), bowY - sinH * sprayLen - cosH * (sprayLen * 0.58));
    ctx.moveTo(bowX, bowY);
    ctx.lineTo(bowX - cosH * sprayLen - sinH * (sprayLen * 0.58), bowY - sinH * sprayLen + cosH * (sprayLen * 0.58));
    ctx.stroke();
  }

  // Carrier Line Art (Yorktown CV-6 / Essex CV-9)
  private drawCarrier(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Flight Deck Profile with chamfered bow
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.4);
    ctx.lineTo(l * 0.51, 0);
    ctx.lineTo(l * 0.48, w * 0.4);
    ctx.lineTo(-l * 0.48, w * 0.44);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.48, -w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flight Deck Centerline
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(-l * 0.44, 0);
    ctx.lineTo(l * 0.46, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Deck Elevators with X Cross-Bracing
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    // Fwd Elevator
    ctx.strokeRect(l * 0.16, -w * 0.22, l * 0.14, w * 0.44);
    ctx.beginPath();
    ctx.moveTo(l * 0.16, -w * 0.22);
    ctx.lineTo(l * 0.3, w * 0.22);
    ctx.moveTo(l * 0.3, -w * 0.22);
    ctx.lineTo(l * 0.16, w * 0.22);
    ctx.stroke();

    // Aft Elevator
    ctx.strokeRect(-l * 0.3, -w * 0.22, l * 0.14, w * 0.44);
    ctx.beginPath();
    ctx.moveTo(-l * 0.3, -w * 0.22);
    ctx.lineTo(-l * 0.16, w * 0.22);
    ctx.moveTo(-l * 0.16, -w * 0.22);
    ctx.lineTo(-l * 0.3, w * 0.22);
    ctx.stroke();

    // Arresting Wires (4 wires)
    ctx.lineWidth = 1;
    for (let i = -4; i <= -1; i++) {
      const x = l * 0.08 * i;
      ctx.beginPath();
      ctx.moveTo(x, -w * 0.38);
      ctx.lineTo(x, w * 0.38);
      ctx.stroke();
    }

    // Catapult Launch Tracks
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(l * 0.18, -w * 0.18);
    ctx.lineTo(l * 0.48, -w * 0.18);
    if (ship.era === 'era2') {
      ctx.moveTo(l * 0.18, w * 0.18);
      ctx.lineTo(l * 0.48, w * 0.18);
    }
    ctx.stroke();

    // Starboard Island Superstructure
    ctx.fillStyle = '#050E18';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(l * 0.04, -w * 0.62, l * 0.22, w * 0.22);
    ctx.fillRect(l * 0.04, -w * 0.62, l * 0.22, w * 0.22);

    // Island Bridge Tier Levels & Tripod Radar Mast
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(l * 0.08, -w * 0.58, l * 0.14, w * 0.14);
    ctx.beginPath();
    ctx.moveTo(l * 0.15, -w * 0.62);
    ctx.lineTo(l * 0.15, -w * 0.82); // Mast
    ctx.stroke();

    // Radar dish on mast
    ctx.beginPath();
    ctx.arc(l * 0.15, -w * 0.82, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Port and Starboard Anti-Aircraft Gun Sponson Tubs
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    // Fwd sponsons
    ctx.beginPath();
    ctx.arc(l * 0.4, -w * 0.44, 4, 0, Math.PI * 2);
    ctx.arc(l * 0.4, w * 0.44, 4, 0, Math.PI * 2);
    // Aft sponsons
    ctx.arc(-l * 0.42, -w * 0.46, 4, 0, Math.PI * 2);
    ctx.arc(-l * 0.42, w * 0.46, 4, 0, Math.PI * 2);
    ctx.stroke();

    // Deck Edge Foul Stripes & Parked Aircraft Wing Silhouettes
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-l * 0.42, -w * 0.40);
    ctx.lineTo(l * 0.42, -w * 0.40);
    ctx.stroke();

    const readyDeckPlanes = ship.carrierPlanes
      ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
      : 0;
    const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 3));
    for (let p = 0; p < parkedCount; p++) {
      const px = -l * 0.34 + p * (l * 0.14);
      const py = p % 2 === 0 ? w * 0.28 : -w * 0.28;
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.moveTo(px + 3, py);
      ctx.lineTo(px - 2, py - 3.2);
      ctx.lineTo(px - 2, py + 3.2);
      ctx.closePath();
      ctx.fill();
    }

    // Pennant number on bow deck
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ship.era === 'era2' ? '9' : '6', l * 0.42, 3);

    this.drawShipTurrets(ship, hullColor);
  }

  // Battleship Line Art (North Carolina / Yamato)
  private drawBattleship(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;
    const isYamato = ship.name.includes('大和') || ship.name.includes('Yamato');

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.2;

    if (isYamato) {
      // ════ IJN Yamato (72,800 ton Super-Battleship) ════
      // Massive flared clipper bow with bulbous bow outline and torpedo armor bulge
      ctx.beginPath();
      ctx.moveTo(l * 0.54, 0); // Bulbous bow
      ctx.lineTo(l * 0.40, -w * 0.46);
      ctx.lineTo(-l * 0.36, -w * 0.50); // Massive midship armor bulge (38.9m beam)
      ctx.lineTo(-l * 0.50, -w * 0.24);
      ctx.lineTo(-l * 0.52, 0);
      ctx.lineTo(-l * 0.50, w * 0.24);
      ctx.lineTo(-l * 0.36, w * 0.50);
      ctx.lineTo(l * 0.40, w * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armored Citadel & Pagoda Command Tower
      ctx.fillStyle = '#050E18';
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.6;
      ctx.fillRect(-l * 0.16, -w * 0.30, l * 0.34, w * 0.60);
      ctx.strokeRect(-l * 0.16, -w * 0.30, l * 0.34, w * 0.60);

      // 15-meter Optical Rangefinder atop bridge
      ctx.strokeStyle = '#FFE082';
      ctx.beginPath();
      ctx.moveTo(l * 0.05, -w * 0.25);
      ctx.lineTo(l * 0.05, w * 0.25);
      ctx.stroke();

      // Single Massive Curved Funnel with Black Raked Cap
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.ellipse(-l * 0.04, 0, 7, 10, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Two Triple 15.5cm Secondary Turrets (one fwd of bridge, one aft of mainmast)
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(l * 0.12, 0, 4.5, 0, Math.PI * 2);
      ctx.arc(-l * 0.18, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stern Dual Catapults and Aircraft Handling Turntable Deck
      ctx.strokeStyle = '#FFE082';
      ctx.beginPath();
      ctx.moveTo(-l * 0.38, -w * 0.18);
      ctx.lineTo(-l * 0.49, -w * 0.22);
      ctx.moveTo(-l * 0.38, w * 0.18);
      ctx.lineTo(-l * 0.49, w * 0.22);
      ctx.stroke();
    } else {
      // ════ US Battleship (Iowa / Colorado) ════
      // Armored Hull with Raked Bow and Torpedo Bulge
      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0); // Clipper bow
      ctx.lineTo(l * 0.38, -w * 0.45);
      ctx.lineTo(-l * 0.36, -w * 0.48); // Armor belt bulge
      ctx.lineTo(-l * 0.5, -w * 0.2);
      ctx.lineTo(-l * 0.52, 0);
      ctx.lineTo(-l * 0.5, w * 0.2);
      ctx.lineTo(-l * 0.36, w * 0.48);
      ctx.lineTo(l * 0.38, w * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner Deck Teak Line
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(-l * 0.38, -w * 0.32, l * 0.76, w * 0.64);

      // Armored Citadel Superstructure
      ctx.fillStyle = '#050E18';
      ctx.strokeRect(-l * 0.16, -w * 0.28, l * 0.32, w * 0.56);
      ctx.fillRect(-l * 0.16, -w * 0.28, l * 0.32, w * 0.56);

      // Conning Tower & Bridge levels
      ctx.strokeRect(-l * 0.05, -w * 0.2, l * 0.14, w * 0.4);

      // Twin Funnels / Smokestacks with grates
      ctx.strokeRect(-l * 0.12, -w * 0.12, l * 0.06, w * 0.24);
      ctx.strokeRect(-l * 0.02, -w * 0.12, l * 0.06, w * 0.24);

      // Stern Aircraft Catapult
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-l * 0.36, 0);
      ctx.lineTo(-l * 0.48, 0);
      ctx.stroke();
    }

    this.drawShipTurrets(ship, hullColor);
  }

  // Cruiser Line Art (CA San Francisco / CL Cleveland)
  private drawCruiser(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#071624';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Slender Cruiser Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.35, -w * 0.45);
    ctx.lineTo(-l * 0.42, -w * 0.45);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.42, w * 0.45);
    ctx.lineTo(l * 0.35, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Superstructure & Bridge Deckhouse
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-l * 0.15, -w * 0.26, l * 0.3, w * 0.52);

    // Funnels
    ctx.strokeRect(-l * 0.08, -w * 0.12, l * 0.06, w * 0.24);
    ctx.strokeRect(l * 0.02, -w * 0.12, l * 0.06, w * 0.24);

    // Midship Catapult
    ctx.beginPath();
    ctx.moveTo(-l * 0.18, 0);
    ctx.lineTo(-l * 0.28, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Destroyer Line Art (Fletcher / Gearing)
  private drawDestroyer(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#071420';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Sharp Fast Destroyer Hull Profile
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0); // Knife bow
    ctx.lineTo(l * 0.28, -w * 0.44);
    ctx.lineTo(-l * 0.44, -w * 0.44);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.44, w * 0.44);
    ctx.lineTo(l * 0.28, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Raised Forecastle Line
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(l * 0.12, -w * 0.44);
    ctx.lineTo(l * 0.12, w * 0.44);
    ctx.stroke();

    // Bridge & Mast
    ctx.strokeRect(0, -w * 0.25, l * 0.14, w * 0.5);

    // Quintuple Torpedo Tube Launcher Assembly midships
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-l * 0.12, -w * 0.2, l * 0.09, w * 0.4);
    // 5 Torpedo tips
    for (let t = -2; t <= 2; t++) {
      ctx.beginPath();
      ctx.arc(-l * 0.03, t * (w * 0.08), 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 20mm Oerlikon Rapid-Fire Gun Tubs (Bridge wings & amidships)
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(l * 0.05, -w * 0.38, 2.5, 0, Math.PI * 2);
    ctx.arc(l * 0.05, w * 0.38, 2.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.06, -w * 0.38, 2.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.06, w * 0.38, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // 40mm Bofors Twin AA Mount Platforms
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-l * 0.08, -w * 0.22, l * 0.04, w * 0.44);

    // Stern Depth Charge Twin Roller Racks with Canisters
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-l * 0.42, -w * 0.32);
    ctx.lineTo(-l * 0.5, -w * 0.32);
    ctx.moveTo(-l * 0.42, w * 0.32);
    ctx.lineTo(-l * 0.5, w * 0.32);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Submarine Line Art (IJN 伊號 / Kriegsmarine Monsun U-Boat / Soviet Whiskey-Zulu)
  private drawSubmarine(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;
    const variant = ship.subVariant;

    if (ship.isSubmerged) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle =
        ship.side === 'enemy' ? 'rgba(255, 171, 64, 0.72)' : 'rgba(128, 222, 234, 0.55)';
    } else {
      ctx.strokeStyle = hullColor;
    }

    ctx.fillStyle = variant === 'uboat' ? '#0C141D' : variant === 'whiskey' || variant === 'zulu' ? '#120C12' : '#06101A';
    ctx.lineWidth = 2;

    if (variant === 'uboat') {
      // Kriegsmarine Type VII/IX U-Boat: narrow pointed bow, external saddle-tank bulge amidships
      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.lineTo(l * 0.25, -w * 0.34);
      ctx.lineTo(l * 0.14, -w * 0.48); // Saddle tanks
      ctx.lineTo(-l * 0.16, -w * 0.48);
      ctx.lineTo(-l * 0.26, -w * 0.32);
      ctx.lineTo(-l * 0.50, 0);
      ctx.lineTo(-l * 0.26, w * 0.32);
      ctx.lineTo(-l * 0.16, w * 0.48);
      ctx.lineTo(l * 0.14, w * 0.48);
      ctx.lineTo(l * 0.25, w * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wintergarten dual-tier AA gun platform aft of conning tower
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-l * 0.04, -w * 0.22, l * 0.14, w * 0.44);
      ctx.strokeRect(-l * 0.13, -w * 0.16, l * 0.09, w * 0.32);
      // Bow net-cutter & forward deck gun
      ctx.beginPath();
      ctx.moveTo(l * 0.16, 0);
      ctx.lineTo(l * 0.27, 0);
      ctx.stroke();
    } else if (variant === 'whiskey' || variant === 'zulu') {
      // Soviet Project 613 Whiskey / 611 Zulu streamlined post-war casing without deck gun
      ctx.beginPath();
      ctx.moveTo(l * 0.50, 0);
      ctx.bezierCurveTo(l * 0.38, -w * 0.42, l * 0.12, -w * 0.42, -l * 0.2, -w * 0.38);
      ctx.lineTo(-l * 0.50, 0);
      ctx.lineTo(-l * 0.2, w * 0.38);
      ctx.bezierCurveTo(l * 0.12, w * 0.42, l * 0.38, w * 0.42, l * 0.50, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stepped snorkel fairing sail + Soviet red star mark
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-l * 0.08, -w * 0.22, l * 0.18, w * 0.44, 2);
      ctx.stroke();
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // IJN 伊號 Type B1/B3 Cruiser Submarine (forward watertight aircraft hangar + aft deck gun)
      ctx.beginPath();
      ctx.ellipse(0, 0, l * 0.5, w * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Free-flooding casing limber hole slits
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1;
      for (let s = -3; s <= 3; s++) {
        const sx = s * (l * 0.08);
        ctx.beginPath();
        ctx.moveTo(sx, -w * 0.22);
        ctx.lineTo(sx + 4, -w * 0.22);
        ctx.moveTo(sx, w * 0.22);
        ctx.lineTo(sx + 4, w * 0.22);
        ctx.stroke();
      }

      if (variant === 'ijn_sub') {
        // Cylindrical aircraft hangar forward of sail
        ctx.fillStyle = '#14202C';
        ctx.fillRect(l * 0.08, -w * 0.16, l * 0.15, w * 0.32);
        ctx.strokeRect(l * 0.08, -w * 0.16, l * 0.15, w * 0.32);
      }

      // Conning Tower with periscope & deck gun
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-l * 0.08, -w * 0.22, l * 0.16, w * 0.44);

      // Deck gun
      ctx.beginPath();
      ctx.moveTo(variant === 'ijn_sub' ? -l * 0.14 : l * 0.14, 0);
      ctx.lineTo(variant === 'ijn_sub' ? -l * 0.24 : l * 0.24, 0);
      ctx.stroke();
    }

    // Bow & Stern Hydroplanes (Diving Planes)
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(l * 0.34, -w * 0.52);
    ctx.lineTo(l * 0.34, w * 0.52);
    ctx.moveTo(-l * 0.42, -w * 0.48);
    ctx.lineTo(-l * 0.42, w * 0.48);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // LCVP Higgins Landing Craft Line Art
  private drawLCVP(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#091B2C';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Distinctive blunt-nosed Higgins boat profile with forward ramp
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.42); // Square bow ramp top
    ctx.lineTo(l * 0.48, w * 0.42);
    ctx.lineTo(-l * 0.45, w * 0.45);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.45, -w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forward Drop Ramp Seam & Hinges
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.42);
    ctx.lineTo(l * 0.48, w * 0.42);
    ctx.stroke();

    // Cargo / Troop Well Deck Interior
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-l * 0.28, -w * 0.32, l * 0.65, w * 0.64);

    // Ribbed floor decking lines
    for (let r = -2; r <= 3; r++) {
      const rx = r * (l * 0.08);
      ctx.beginPath();
      ctx.moveTo(rx, -w * 0.28);
      ctx.lineTo(rx, w * 0.28);
      ctx.stroke();
    }

    // Aft Coxswain Station & Twin .50 cal Machine Gun Tubs
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-l * 0.32, -w * 0.28, 2.8, 0, Math.PI * 2);
    ctx.arc(-l * 0.32, w * 0.28, 2.8, 0, Math.PI * 2);
    ctx.stroke();

    // .50 cal machine gun barrels
    ctx.beginPath();
    ctx.moveTo(-l * 0.32, -w * 0.28);
    ctx.lineTo(-l * 0.2, -w * 0.28);
    ctx.moveTo(-l * 0.32, w * 0.28);
    ctx.lineTo(-l * 0.2, w * 0.28);
    ctx.stroke();

    // Embarked troop indicators inside well deck if carrying units
    if (ship.embarkedUnitIds && ship.embarkedUnitIds.length > 0) {
      ctx.fillStyle = '#00E676';
      for (let t = 0; t < ship.embarkedUnitIds.length; t++) {
        ctx.beginPath();
        ctx.arc(-l * 0.1 + t * (l * 0.2), 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // LST Tank Landing Ship Line Art
  private drawLST(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    const isNewport = ship.name.includes('Newport') || ship.name.includes('1179') || ship.era === 'era4' || ship.era === 'era5';

    if (isNewport) {
      // ════ Newport-Class Tank Landing Ship (LST-1179) ════
      // 20-knot clipper bow with two giant fixed horn gantries extending over the bow for deploying the 112ft aluminum ramp
      ctx.fillStyle = '#081726';
      ctx.strokeStyle = hullColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(l * 0.44, -w * 0.28);
      ctx.lineTo(l * 0.52, 0); // Sharp 20-knot clipper bow
      ctx.lineTo(l * 0.44, w * 0.28);
      ctx.lineTo(-l * 0.48, w * 0.38);
      ctx.lineTo(-l * 0.5, w * 0.25);
      ctx.lineTo(-l * 0.5, -w * 0.25); // Stern gate for launching AAVs/LVTPs
      ctx.lineTo(-l * 0.48, -w * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin Bow Horn Derrick Gantries (Iconic Newport-class feature extending over the bow)
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // Port gantry horn
      ctx.moveTo(l * 0.32, -w * 0.22);
      ctx.lineTo(l * 0.56, -w * 0.16);
      ctx.lineTo(l * 0.58, -w * 0.12);
      // Starboard gantry horn
      ctx.moveTo(l * 0.32, w * 0.22);
      ctx.lineTo(l * 0.56, w * 0.16);
      ctx.lineTo(l * 0.58, w * 0.12);
      ctx.stroke();

      // Aluminum ramp stowed between horns
      ctx.fillStyle = '#37474F';
      ctx.fillRect(l * 0.36, -w * 0.1, l * 0.18, w * 0.2);
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1;
      ctx.strokeRect(l * 0.36, -w * 0.1, l * 0.18, w * 0.2);

      // Forward Twin 3"/50 Mk 33 Gun Turret
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(l * 0.26, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Twin barrels
      ctx.beginPath();
      ctx.moveTo(l * 0.26, -1.5);
      ctx.lineTo(l * 0.34, -1.5);
      ctx.moveTo(l * 0.26, 1.5);
      ctx.lineTo(l * 0.34, 1.5);
      ctx.stroke();

      // Phalanx CIWS in Era 5
      if (ship.era === 'era5') {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(l * 0.18, -w * 0.24, 4, 3);
        ctx.strokeRect(l * 0.18, w * 0.24 - 3, 4, 3);
      }

      // Large Bridge Superstructure & Combined Exhaust Funnel-Mast (Mack)
      ctx.fillStyle = '#102A43';
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.4;
      ctx.fillRect(-l * 0.08, -w * 0.24, l * 0.22, w * 0.48);
      ctx.strokeRect(-l * 0.08, -w * 0.24, l * 0.22, w * 0.48);

      // Radar Mast
      ctx.beginPath();
      ctx.arc(l * 0.02, 0, 3, 0, Math.PI * 2);
      ctx.stroke();

      // Aft Flight Deck & Vehicle Parking Deck (CH-46/CH-53 Helo Spot & Tank Parking)
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-l * 0.45, -w * 0.32, l * 0.34, w * 0.64);

      // Helo Landing Spot "H"
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-l * 0.32, 0, w * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-l * 0.35, -w * 0.12);
      ctx.lineTo(-l * 0.35, w * 0.12);
      ctx.moveTo(-l * 0.29, -w * 0.12);
      ctx.lineTo(-l * 0.29, w * 0.12);
      ctx.moveTo(-l * 0.35, 0);
      ctx.lineTo(-l * 0.29, 0);
      ctx.stroke();

      // Stowed M60 / M1 Abrams Tank on vehicle deck
      ctx.fillStyle = '#33691E';
      ctx.strokeStyle = '#AED581';
      ctx.lineWidth = 1;
      ctx.fillRect(-l * 0.18, -w * 0.18, l * 0.08, w * 0.36);
      ctx.strokeRect(-l * 0.18, -w * 0.18, l * 0.08, w * 0.36);
      ctx.beginPath();
      ctx.arc(-l * 0.14, 0, 3, 0, Math.PI * 2);
      ctx.moveTo(-l * 0.14, 0);
      ctx.lineTo(-l * 0.06, 0);
      ctx.stroke();

      this.drawShipTurrets(ship, hullColor);
      return;
    }

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Full-bodied Amphibious Landing Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.35);
    ctx.lineTo(l * 0.51, 0); // Bow visor seam
    ctx.lineTo(l * 0.48, w * 0.35);
    ctx.lineTo(-l * 0.46, w * 0.46);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.46, -w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bow Clamshell Doors Center Split Seam
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(l * 0.38, 0);
    ctx.lineTo(l * 0.51, 0);
    ctx.stroke();

    // Long Tank Vehicle Deck Area
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-l * 0.18, -w * 0.34, l * 0.52, w * 0.68);

    // Stowed M4 Sherman / M3 Tank outline on deck
    ctx.fillStyle = '#2E7D32';
    ctx.strokeStyle = '#C8E6C9';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(l * 0.05, -w * 0.2, l * 0.14, w * 0.4);
    ctx.fillRect(l * 0.05, -w * 0.2, l * 0.14, w * 0.4);
    // Tank turret
    ctx.beginPath();
    ctx.arc(l * 0.11, 0, w * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    // Tank gun barrel
    ctx.beginPath();
    ctx.moveTo(l * 0.11, 0);
    ctx.lineTo(l * 0.24, 0);
    ctx.stroke();

    // Forward 40mm Bofors Twin Tub
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(l * 0.32, 0, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    // Aft Superstructure, Bridge & Dual Exhaust Stacks
    ctx.strokeRect(-l * 0.42, -w * 0.34, l * 0.2, w * 0.68);
    ctx.strokeRect(-l * 0.38, -w * 0.15, l * 0.08, w * 0.3);

    // Stern 3"/50 DP Gun Platform
    ctx.beginPath();
    ctx.arc(-l * 0.44, 0, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.44, 0);
    ctx.lineTo(-l * 0.5, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // LSM(R) Medium Rocket Landing Ship Line Art
  private drawLSMR(ship: Ship, hullColor: string, _detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Streamlined amphibious landing ship hull
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.38, -w * 0.44);
    ctx.lineTo(-l * 0.45, -w * 0.44);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.45, w * 0.44);
    ctx.lineTo(l * 0.38, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Multi-tier 5-inch Continuous Rocket Launcher Banks along foredeck
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.2;
    for (let row = -1; row <= 1; row += 2) {
      for (let bank = 0; bank < 4; bank++) {
        const bx = -l * 0.05 + bank * (l * 0.1);
        const by = row * (w * 0.24);
        ctx.strokeRect(bx, by - 3, l * 0.07, 6);
        // Rocket tube slots
        for (let t = 0; t < 3; t++) {
          ctx.beginPath();
          ctx.moveTo(bx + t * 4, by - 3);
          ctx.lineTo(bx + t * 4 + 3, by + 3);
          ctx.stroke();
        }
      }
    }

    // Red Hazard Diagonal Warning Stripes on rocket blast deck
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-l * 0.08, -w * 0.4);
    ctx.lineTo(l * 0.32, -w * 0.4);
    ctx.moveTo(-l * 0.08, w * 0.4);
    ctx.lineTo(l * 0.32, w * 0.4);
    ctx.stroke();

    // Aft 5"/38 DP Enclosed Gun Mount
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-l * 0.28, 0, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.28, 0);
    ctx.lineTo(-l * 0.42, 0);
    ctx.stroke();

    // Aft Bridge Conning Tower
    ctx.strokeRect(-l * 0.2, -w * 0.24, l * 0.12, w * 0.48);

    this.drawShipTurrets(ship, hullColor);
  }

  // CVE Escort Carrier (Casablanca Class) Line Art
  private drawCVE(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Compact rectangular flight deck
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.42);
    ctx.lineTo(l * 0.5, 0);
    ctx.lineTo(l * 0.48, w * 0.42);
    ctx.lineTo(-l * 0.48, w * 0.42);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.48, -w * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flight Deck Planking lines & centerline
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(-l * 0.45, 0);
    ctx.lineTo(l * 0.45, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Single Starboard Mini-Island Superstructure
    ctx.strokeRect(l * 0.08, -w * 0.48, l * 0.14, w * 0.14);
    ctx.fillStyle = '#80DEEA';
    ctx.beginPath();
    ctx.arc(l * 0.15, -w * 0.41, 2, 0, Math.PI * 2);
    ctx.fill();

    // Flight Deck Elevators
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(l * 0.2, -w * 0.22, l * 0.14, w * 0.44);
    ctx.strokeRect(-l * 0.28, -w * 0.22, l * 0.14, w * 0.44);

    // Arrestor Cables
    for (let c = -3; c <= -1; c++) {
      ctx.beginPath();
      ctx.moveTo(-l * 0.44 - c * 5, -w * 0.38);
      ctx.lineTo(-l * 0.44 - c * 5, w * 0.38);
      ctx.stroke();
    }

    // Catwalk 40mm Bofors / 20mm Oerlikon Gun Tubs along port & starboard
    ctx.strokeStyle = '#80DEEA';
    ctx.beginPath();
    ctx.arc(l * 0.35, -w * 0.46, 2.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.35, -w * 0.46, 2.5, 0, Math.PI * 2);
    ctx.arc(l * 0.35, w * 0.46, 2.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.35, w * 0.46, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  private drawShipTurrets(ship: Ship, color: string) {
    const ctx = this.ctx;
    for (const turret of ship.turrets) {
      ctx.save();
      ctx.translate(turret.relX, turret.relY);
      ctx.rotate(turret.angle - ship.heading);

      const r = turret.barrelCount > 2 ? 6.5 : 4.8;
      // Beveled armored gun house (trapezoid/octagonal barbette profile)
      ctx.fillStyle = '#0D2235';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.95, -r * 0.58);
      ctx.lineTo(r * 0.25, -r * 0.92);
      ctx.lineTo(-r * 0.92, -r * 0.80);
      ctx.lineTo(-r * 0.92, r * 0.80);
      ctx.lineTo(r * 0.25, r * 0.92);
      ctx.lineTo(r * 0.95, r * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top armored roof hatch & rangefinder highlight
      ctx.fillStyle = '#1E3F5E';
      ctx.fillRect(-r * 0.55, -r * 0.46, r * 0.9, r * 0.92);

      // Recoil barrel jackets + gun barrels
      const bLen = turret.barrelCount > 2 ? 16 : 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const drawBarrel = (by: number) => {
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(r * 0.65, by - 1.3, 3.2, 2.6);
        ctx.beginPath();
        ctx.moveTo(r * 0.7, by);
        ctx.lineTo(bLen, by);
        ctx.stroke();
      };
      if (turret.barrelCount === 1) {
        drawBarrel(0);
      } else if (turret.barrelCount === 2) {
        drawBarrel(-2.3);
        drawBarrel(2.3);
      } else if (turret.barrelCount >= 3) {
        drawBarrel(-3.3);
        drawBarrel(0);
        drawBarrel(3.3);
      }

      ctx.restore();
    }
  }

  // CV-63 Kitty Hawk Supercarrier Line Art (Angled flight deck, 4 catapults, modern island)
  private drawCV63(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.2;

    // Angled Flight Deck Outer Perimeter:
    ctx.beginPath();
    ctx.moveTo(l * 0.5, -w * 0.18);
    ctx.lineTo(l * 0.46, w * 0.35);
    ctx.lineTo(l * 0.22, w * 0.38);
    ctx.lineTo(-l * 0.05, w * 0.38);
    ctx.lineTo(-l * 0.1, w * 0.44);
    ctx.lineTo(-l * 0.32, w * 0.44);
    ctx.lineTo(-l * 0.35, w * 0.38);
    ctx.lineTo(-l * 0.48, w * 0.32);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.48, -w * 0.35);
    ctx.lineTo(-l * 0.35, -w * 0.42);
    ctx.lineTo(-l * 0.1, -w * 0.52);
    ctx.lineTo(l * 0.18, -w * 0.52);
    ctx.lineTo(l * 0.32, -w * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Steel Deck Armor Tint
    ctx.fillStyle = 'rgba(18, 38, 58, 0.45)';
    ctx.fill();

    // 1. Axial Bow Catapults (Cat 1 & Cat 2)
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(l * 0.15, w * 0.1);
    ctx.lineTo(l * 0.46, w * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(l * 0.15, -w * 0.06);
    ctx.lineTo(l * 0.46, -w * 0.06);
    ctx.stroke();

    // 2. Angled Waist Catapults (Cat 3 & Cat 4)
    const cantAngle = -0.183; // ~10.5 deg
    ctx.save();
    ctx.translate(-l * 0.05, -w * 0.18);
    ctx.rotate(cantAngle);
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-l * 0.12, -w * 0.06);
    ctx.lineTo(l * 0.22, -w * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.12, w * 0.06);
    ctx.lineTo(l * 0.22, w * 0.06);
    ctx.stroke();

    // Angled Deck Runway Centerline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(-l * 0.42, 0);
    ctx.lineTo(l * 0.25, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 Arrestor Cables across angled deck
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 4; c++) {
      const cx = -l * 0.28 + c * 10;
      ctx.beginPath();
      ctx.moveTo(cx, -w * 0.18);
      ctx.lineTo(cx, w * 0.18);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Deck Elevators
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(l * 0.24, w * 0.35, l * 0.08, w * 0.08);
    ctx.strokeRect(l * 0.08, w * 0.35, l * 0.08, w * 0.08);
    ctx.strokeRect(-l * 0.32, w * 0.35, l * 0.08, w * 0.08);
    ctx.strokeRect(-l * 0.28, -w * 0.45, l * 0.08, w * 0.08);

    // 4. Modern Starboard Island Superstructure
    const islandX = -l * 0.16;
    const islandY = w * 0.32;
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.8;
    ctx.fillRect(islandX - l * 0.07, islandY - 6, l * 0.14, 12);
    ctx.strokeRect(islandX - l * 0.07, islandY - 6, l * 0.14, 12);

    // Island Pri-Fly glass windows
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(islandX - l * 0.06, islandY - 7, l * 0.04, 2);

    // AN/SPS-48 3D Radar Mast
    const radarRot = this.time * 2.8;
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(islandX, islandY);
    ctx.lineTo(islandX + Math.cos(radarRot) * 7, islandY + Math.sin(radarRot) * 7);
    ctx.stroke();

    // "63" Hull Number Stenciled on Bow Deck
    ctx.save();
    ctx.translate(l * 0.38, w * 0.12);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('63', 0, 0);
    ctx.restore();

    // Jet Blast Deflectors (JBDs) & Deck Edge Foul Stripes + Parked Aircraft
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(l * 0.12, w * 0.08, 2.5, 5);
    ctx.fillRect(l * 0.12, -w * 0.08, 2.5, 5);
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-l * 0.34, -w * 0.44);
    ctx.lineTo(l * 0.16, -w * 0.50);
    ctx.stroke();

    const readyDeckPlanes = ship.carrierPlanes
      ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
      : 0;
    const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 3));
    for (let p = 0; p < parkedCount; p++) {
      const px = -l * 0.30 + p * (l * 0.13);
      const py = p % 2 === 0 ? w * 0.30 : -w * 0.38;
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.moveTo(px + 3.5, py);
      ctx.lineTo(px - 2.5, py - 3.5);
      ctx.lineTo(px - 2.5, py + 3.5);
      ctx.closePath();
      ctx.fill();
    }

    // RIM-7 Sea Sparrow Launchers
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-l * 0.45, -w * 0.32, 8, 6);
    ctx.strokeRect(-l * 0.45, -w * 0.32, 8, 6);
    ctx.fillRect(l * 0.42, w * 0.25, 8, 6);
    ctx.strokeRect(l * 0.42, w * 0.25, 8, 6);

    this.drawShipTurrets(ship, hullColor);
  }

  // CG Belknap Class Guided Missile Cruiser Line Art
  private drawBelknapCG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.35, -w * 0.44);
    ctx.lineTo(-l * 0.42, -w * 0.44);
    ctx.lineTo(-l * 0.48, -w * 0.3);
    ctx.lineTo(-l * 0.48, w * 0.3);
    ctx.lineTo(-l * 0.42, w * 0.44);
    ctx.lineTo(l * 0.35, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Foredeck: Mk 10 Twin-Arm Terrier / Standard ER Missile Launcher
    ctx.strokeStyle = '#FFD54F';
    ctx.fillStyle = '#263238';
    ctx.lineWidth = 1.4;
    const launcherX = l * 0.28;
    ctx.beginPath();
    ctx.arc(launcherX, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(launcherX, -2.5);
    ctx.lineTo(launcherX + 9, -2.5);
    ctx.moveTo(launcherX, 2.5);
    ctx.lineTo(launcherX + 9, 2.5);
    ctx.stroke();

    // Forward Bridge & Conning Tower
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.08, -w * 0.3, l * 0.12, w * 0.6);
    ctx.fillRect(l * 0.08, -w * 0.3, l * 0.12, w * 0.6);

    // Forward Mack (Combined Mast and Stack) with SPS-48 3D Radar
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(l * 0.04, -4, 8, 8);
    const mackRot = this.time * 2.5;
    ctx.beginPath();
    ctx.moveTo(l * 0.08, 0);
    ctx.lineTo(l * 0.08 + Math.cos(mackRot) * 6, Math.sin(mackRot) * 6);
    ctx.stroke();

    // Aft Mack
    ctx.strokeRect(-l * 0.12, -4, 8, 8);

    // Aft Helicopter Hangar & Flight Deck
    ctx.strokeStyle = '#4FC3F7';
    ctx.strokeRect(-l * 0.38, -w * 0.35, l * 0.18, w * 0.7);
    ctx.beginPath();
    ctx.arc(-l * 0.3, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Aft 5-inch/54 caliber Mk 42 Gun Mount
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(-l * 0.42, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.42, 0);
    ctx.lineTo(-l * 0.42 - 12, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // DDG Charles F. Adams Class Guided Missile Destroyer Line Art
  private drawAdamsDDG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.44, -w * 0.44);
    ctx.lineTo(-l * 0.48, -w * 0.28);
    ctx.lineTo(-l * 0.48, w * 0.28);
    ctx.lineTo(-l * 0.44, w * 0.44);
    ctx.lineTo(l * 0.36, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forecastle 5"/54 Caliber Mk 42 Gun Turret
    const gun1X = l * 0.32;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gun1X, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun1X, 0);
    ctx.lineTo(gun1X + 11, 0);
    ctx.stroke();

    // Bridge & Conning Tower
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.12, -w * 0.3, l * 0.11, w * 0.6);
    ctx.fillRect(l * 0.12, -w * 0.3, l * 0.11, w * 0.6);

    // Twin Funnels
    ctx.strokeRect(l * 0.04, -3, 6, 6);
    ctx.strokeRect(-l * 0.1, -3, 6, 6);

    // Midships ASROC 8-cell launcher
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-l * 0.02, -4, 7, 8);

    // Aft 5"/54 Caliber Gun Turret
    const gun2X = -l * 0.22;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(gun2X, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun2X, 0);
    ctx.lineTo(gun2X - 11, 0);
    ctx.stroke();

    // Stern: Tartar Guided Missile Launcher
    const tartarX = -l * 0.38;
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(tartarX, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tartarX, 0);
    ctx.lineTo(tartarX + 8, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // LPH Iwo Jima Class Amphibious Assault Ship Line Art
  private drawLPHIwoJima(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#061322';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Boxy amphibious assault hull with flat full-length helicopter flight deck
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.36);
    ctx.lineTo(l * 0.48, w * 0.36);
    ctx.lineTo(-l * 0.48, w * 0.36);
    ctx.lineTo(-l * 0.48, -w * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flight Deck Tint
    ctx.fillStyle = 'rgba(18, 38, 58, 0.45)';
    ctx.fill();

    // 5 Helicopter Landing Spots along deck centerline
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.3;
    for (let s = 0; s < 5; s++) {
      const spotX = -l * 0.36 + s * (l * 0.18);
      ctx.beginPath();
      ctx.arc(spotX, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(spotX - 3, 0);
      ctx.lineTo(spotX + 3, 0);
      ctx.stroke();
    }

    // Starboard Island Tower with Bridge
    const islandX = l * 0.12;
    const islandY = w * 0.3;
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.fillRect(islandX - l * 0.08, islandY - 5, l * 0.16, 10);
    ctx.strokeRect(islandX - l * 0.08, islandY - 5, l * 0.16, 10);

    // Radar Antenna
    const rRot = this.time * 2.2;
    ctx.strokeStyle = '#80DEEA';
    ctx.beginPath();
    ctx.moveTo(islandX, islandY);
    ctx.lineTo(islandX + Math.cos(rRot) * 6, islandY + Math.sin(rRot) * 6);
    ctx.stroke();

    // Port Side Aircraft Elevator
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-l * 0.12, -w * 0.44, l * 0.1, w * 0.1);

    this.drawShipTurrets(ship, hullColor);
  }

  // LCM-8 "Mike Boat" Landing Craft Line Art
  private drawLCM8(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.45);
    ctx.lineTo(l * 0.48, w * 0.45);
    ctx.lineTo(-l * 0.48, w * 0.45);
    ctx.lineTo(-l * 0.48, -w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy bow drop ramp
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(l * 0.48, -w * 0.4);
    ctx.lineTo(l * 0.48, w * 0.4);
    ctx.stroke();

    // Deep Open Cargo Well Deck
    ctx.fillStyle = 'rgba(15, 39, 61, 0.6)';
    ctx.fillRect(-l * 0.22, -w * 0.36, l * 0.56, w * 0.72);
    ctx.strokeRect(-l * 0.22, -w * 0.36, l * 0.56, w * 0.72);

    // Aft Armored Wheelhouse
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(-l * 0.44, -w * 0.32, l * 0.16, w * 0.64);
    ctx.fillRect(-l * 0.44, -w * 0.32, l * 0.16, w * 0.64);

    this.drawShipTurrets(ship, hullColor);
  }

  // Komar Class Project 183R Missile Boat Line Art
  private drawKomarPTG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#180E14';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.28, -w * 0.45);
    ctx.lineTo(-l * 0.48, -w * 0.45);
    ctx.lineTo(-l * 0.48, w * 0.45);
    ctx.lineTo(l * 0.28, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Foredeck 25mm gun mount
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(l * 0.26, 0, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Wheelhouse / Bridge
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
    ctx.fillRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);

    // Two Launch Canisters for P-15 Styx
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-l * 0.36, -w * 0.44, l * 0.32, w * 0.24);
    ctx.fillRect(-l * 0.36, -w * 0.44, l * 0.32, w * 0.24);
    ctx.strokeRect(-l * 0.36, w * 0.2, l * 0.32, w * 0.24);
    ctx.fillRect(-l * 0.36, w * 0.2, l * 0.32, w * 0.24);

    this.drawShipTurrets(ship, hullColor);
  }

  // Forrest Sherman Class Destroyer Line Art (DD-931)
  private drawForrestShermanDD(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.44, -w * 0.44);
    ctx.lineTo(-l * 0.48, -w * 0.28);
    ctx.lineTo(-l * 0.48, w * 0.28);
    ctx.lineTo(-l * 0.44, w * 0.44);
    ctx.lineTo(l * 0.36, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forecastle 5"/54 Caliber Mk 42 Gun Mount ('A' Mount)
    const gun1X = l * 0.32;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gun1X, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun1X, 0);
    ctx.lineTo(gun1X + 12, 0);
    ctx.stroke();

    // Bridge & Conning Tower
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.12, -w * 0.3, l * 0.12, w * 0.6);
    ctx.fillRect(l * 0.12, -w * 0.3, l * 0.12, w * 0.6);

    // Twin Stacks (Funnels)
    ctx.strokeRect(l * 0.04, -3.5, 7, 7);
    ctx.strokeRect(-l * 0.12, -3.5, 7, 7);

    // Midships 8-cell ASROC box launcher
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-l * 0.04, -4.5, 8, 9);

    // Mk 32 SVTT triple torpedo tubes (port & starboard)
    ctx.fillStyle = '#80DEEA';
    ctx.fillRect(-l * 0.02, -w * 0.42, 6, 2.5);
    ctx.fillRect(-l * 0.02, w * 0.42 - 2.5, 6, 2.5);

    // Aft 5"/54 Mk 42 Mounts ('X' and 'Y' Mounts)
    const gun2X = -l * 0.24;
    const gun3X = -l * 0.38;
    for (const gx of [gun2X, gun3X]) {
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#FFE082';
      ctx.beginPath();
      ctx.arc(gx, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx - 12, 0);
      ctx.stroke();
    }

    this.drawShipTurrets(ship, hullColor);
  }

  // Knox Class Fast Frigate Line Art (FFG-1052)
  private drawKnoxFFG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.35, -w * 0.45);
    ctx.lineTo(-l * 0.42, -w * 0.45);
    ctx.lineTo(-l * 0.48, -w * 0.32);
    ctx.lineTo(-l * 0.48, w * 0.32);
    ctx.lineTo(-l * 0.42, w * 0.45);
    ctx.lineTo(l * 0.35, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bow single 5"/54 Caliber Mk 42 Gun Mount
    const gunX = l * 0.34;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gunX, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gunX, 0);
    ctx.lineTo(gunX + 12, 0);
    ctx.stroke();

    // 8-Cell ASROC Box Launcher directly behind 5" gun
    ctx.fillStyle = '#1B2A38';
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(l * 0.18, -4.5, 8, 9);
    ctx.fillRect(l * 0.18, -4.5, 8, 9);

    // Bridge Structure
    ctx.fillStyle = '#0F273D';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.05, -w * 0.3, l * 0.1, w * 0.6);
    ctx.fillRect(l * 0.05, -w * 0.3, l * 0.1, w * 0.6);

    // Combined Mack (Mast and Stack)
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#80DEEA';
    ctx.beginPath();
    ctx.arc(-l * 0.06, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stern Helicopter Hangar and Flight Deck for SH-2 Seasprite
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-l * 0.42, -w * 0.38, l * 0.22, w * 0.76);
    ctx.beginPath();
    ctx.arc(-l * 0.32, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.35, -3);
    ctx.lineTo(-l * 0.35, 3);
    ctx.moveTo(-l * 0.29, -3);
    ctx.lineTo(-l * 0.29, 3);
    ctx.moveTo(-l * 0.35, 0);
    ctx.lineTo(-l * 0.29, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Project 61 Kashin Class Guided Missile Destroyer Line Art (DDG)
  private drawKashinDDG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#140D12';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    // Distinctive flush-deck long hull with raked bow and transom
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.44, -w * 0.44);
    ctx.lineTo(-l * 0.49, -w * 0.3);
    ctx.lineTo(-l * 0.49, w * 0.3);
    ctx.lineTo(-l * 0.44, w * 0.44);
    ctx.lineTo(l * 0.36, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bow AK-726 twin 76mm automatic turret
    const bowGunX = l * 0.32;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bowGunX, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bowGunX, -1.2);
    ctx.lineTo(bowGunX + 11, -1.2);
    ctx.moveTo(bowGunX, 1.2);
    ctx.lineTo(bowGunX + 11, 1.2);
    ctx.stroke();

    // RBU-6000 12-barrel ASW rocket mortars (pair forward of bridge)
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(l * 0.22, -w * 0.24, 2.8, 0, Math.PI * 2);
    ctx.arc(l * 0.22, w * 0.24, 2.8, 0, Math.PI * 2);
    ctx.stroke();

    // Forward SA-N-1 Goa twin-arm SAM launcher
    const fwdGoaX = l * 0.15;
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fwdGoaX, 0, 3.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fwdGoaX, 0);
    ctx.lineTo(fwdGoaX + 8, -2);
    ctx.moveTo(fwdGoaX, 0);
    ctx.lineTo(fwdGoaX + 8, 2);
    ctx.stroke();

    // Bridge and First Gas Turbine Funnel Pair
    ctx.fillStyle = '#211822';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.02, -w * 0.32, l * 0.1, w * 0.64);
    ctx.fillRect(l * 0.02, -w * 0.32, l * 0.1, w * 0.64);

    // Twin angled gas-turbine funnels forward & aft ("Singing Frigate")
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-l * 0.04, -w * 0.35, 6, 4);
    ctx.fillRect(-l * 0.04, w * 0.35 - 4, 6, 4);
    ctx.fillRect(-l * 0.22, -w * 0.35, 6, 4);
    ctx.fillRect(-l * 0.22, w * 0.35 - 4, 6, 4);

    // Midships 533mm quintuple torpedo launcher
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-l * 0.14, -4, 8, 8);

    // Aft SA-N-1 Goa twin-arm SAM launcher
    const aftGoaX = -l * 0.3;
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(aftGoaX, 0, 3.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(aftGoaX, 0);
    ctx.lineTo(aftGoaX - 8, -2);
    ctx.moveTo(aftGoaX, 0);
    ctx.lineTo(aftGoaX - 8, 2);
    ctx.stroke();

    // Stern AK-726 twin 76mm automatic turret
    const sternGunX = -l * 0.4;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(sternGunX, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sternGunX, -1.2);
    ctx.lineTo(sternGunX - 11, -1.2);
    ctx.moveTo(sternGunX, 1.2);
    ctx.lineTo(sternGunX - 11, 1.2);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Project 50 Riga Class Frigate Line Art (FFG / North Vietnamese Flagship)
  private drawRigaFFG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#140D12';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    // Raised forecastle stepping down to low quarterdeck
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.34, -w * 0.44);
    ctx.lineTo(-l * 0.42, -w * 0.44);
    ctx.lineTo(-l * 0.48, -w * 0.3);
    ctx.lineTo(-l * 0.48, w * 0.3);
    ctx.lineTo(-l * 0.42, w * 0.44);
    ctx.lineTo(l * 0.34, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bow 100mm B-34 Gun Turret ('A' Mount)
    const gun1X = l * 0.32;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gun1X, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun1X, 0);
    ctx.lineTo(gun1X + 11, 0);
    ctx.stroke();

    // RBU-2500 ASW rocket launcher forward of bridge
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(l * 0.22, 0, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Midships Bridge & Single Raked Funnel
    ctx.fillStyle = '#211822';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(l * 0.06, -w * 0.3, l * 0.12, w * 0.6);
    ctx.fillRect(l * 0.06, -w * 0.3, l * 0.12, w * 0.6);

    ctx.fillStyle = '#37474F';
    ctx.fillRect(-l * 0.06, -3, 8, 6);

    // Midships 100mm B-34 Gun Turret ('B' Mount between funnel and torpedo tubes)
    const gun2X = -l * 0.14;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(gun2X, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun2X, 0);
    ctx.lineTo(gun2X + 10, 0);
    ctx.stroke();

    // Twin 37mm V-11M anti-aircraft autocannon tubs
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(-l * 0.24, -w * 0.3, 2.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.24, w * 0.3, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // Stern 100mm B-34 Gun Turret ('X' Mount)
    const gun3X = -l * 0.36;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(gun3X, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gun3X, 0);
    ctx.lineTo(gun3X - 11, 0);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Project 205 Osa Class Missile Boat Line Art (PTG)
  private drawOsaPTG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#1A0E12';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    // Wide hard-chine planing hull
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.32, -w * 0.46);
    ctx.lineTo(-l * 0.48, -w * 0.46);
    ctx.lineTo(-l * 0.48, w * 0.46);
    ctx.lineTo(l * 0.32, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forward AK-230 30mm twin enclosed dome turret
    const fwdAkX = l * 0.3;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(fwdAkX, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fwdAkX, -1);
    ctx.lineTo(fwdAkX + 7, -1);
    ctx.moveTo(fwdAkX, 1);
    ctx.lineTo(fwdAkX + 7, 1);
    ctx.stroke();

    // Wheelhouse and Drum Tilt Fire Control Radar Dome
    ctx.fillStyle = '#2E1C22';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(-l * 0.05, -w * 0.24, l * 0.16, w * 0.48);
    ctx.fillRect(-l * 0.05, -w * 0.24, l * 0.16, w * 0.48);
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(l * 0.03, 0, 3, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Box Missile Containers for P-15 Styx (2 Port, 2 Starboard)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.4;
    // Fwd port & starboard missile boxes
    ctx.strokeRect(l * 0.05, -w * 0.45, l * 0.22, w * 0.2);
    ctx.fillRect(l * 0.05, -w * 0.45, l * 0.22, w * 0.2);
    ctx.strokeRect(l * 0.05, w * 0.25, l * 0.22, w * 0.2);
    ctx.fillRect(l * 0.05, w * 0.25, l * 0.22, w * 0.2);
    // Aft port & starboard missile boxes
    ctx.strokeRect(-l * 0.32, -w * 0.45, l * 0.22, w * 0.2);
    ctx.fillRect(-l * 0.32, -w * 0.45, l * 0.22, w * 0.2);
    ctx.strokeRect(-l * 0.32, w * 0.25, l * 0.22, w * 0.2);
    ctx.fillRect(-l * 0.32, w * 0.25, l * 0.22, w * 0.2);

    // Aft AK-230 30mm twin enclosed dome turret
    const aftAkX = -l * 0.38;
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(aftAkX, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(aftAkX, -1);
    ctx.lineTo(aftAkX - 7, -1);
    ctx.moveTo(aftAkX, 1);
    ctx.lineTo(aftAkX - 7, 1);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Project 641 Foxtrot / Project 671RTM Victor III / Project 971 Akula Submarine Line Art
  private drawFoxtrotSS(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;
    const isNuclearSSN = ship.subVariant === 'victor3' || ship.subVariant === 'akula';

    if (ship.isSubmerged) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 138, 128, 0.72)';
    } else {
      ctx.strokeStyle = hullColor;
    }

    ctx.fillStyle = isNuclearSSN ? '#0E0912' : '#120B10';
    ctx.lineWidth = 1.8;

    if (isNuclearSSN) {
      // Teardrop nuclear attack submarine hull (Victor III / Akula)
      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.bezierCurveTo(l * 0.46, -w * 0.48, l * 0.20, -w * 0.48, -l * 0.10, -w * 0.42);
      ctx.bezierCurveTo(-l * 0.32, -w * 0.34, -l * 0.46, -w * 0.16, -l * 0.52, 0);
      ctx.bezierCurveTo(-l * 0.46, w * 0.16, -l * 0.32, w * 0.34, -l * 0.10, w * 0.42);
      ctx.bezierCurveTo(l * 0.20, w * 0.48, l * 0.46, w * 0.48, l * 0.52, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Long streamlined sail with forward dive planes
      ctx.fillStyle = '#1E1424';
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(l * 0.04, -w * 0.22, l * 0.22, w * 0.44, 3);
      ctx.fill();
      ctx.stroke();

      // Characteristic Soviet Victor III / Akula Towed-Array Sonar Pod atop stern fin
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#FFAB40';
      ctx.beginPath();
      ctx.ellipse(-l * 0.48, 0, 7, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fairwater Sail Planes & Bow/Stern Hydroplanes
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(l * 0.14, -w * 0.38);
      ctx.lineTo(l * 0.14, w * 0.38);
      ctx.moveTo(-l * 0.44, -w * 0.44);
      ctx.lineTo(-l * 0.44, w * 0.44);
      ctx.stroke();

      // Red Star insignia
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(l * 0.14, 0, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([]);
      return;
    }

    // Streamlined Foxtrot hull with sharp bow and bulbous sonar chin
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.36, -w * 0.38);
    ctx.lineTo(-l * 0.42, -w * 0.38);
    ctx.lineTo(-l * 0.49, 0);
    ctx.lineTo(-l * 0.42, w * 0.38);
    ctx.lineTo(l * 0.36, w * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Distinctive bulbous bow chin sonar dome (MG-10 / Herkules)
    ctx.strokeStyle = '#FF5252';
    ctx.fillStyle = '#263238';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(l * 0.44, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6 Forward Bow Torpedo Tube Shutters
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(l * 0.4, -w * 0.22);
    ctx.lineTo(l * 0.46, -w * 0.14);
    ctx.moveTo(l * 0.4, w * 0.22);
    ctx.lineTo(l * 0.46, w * 0.14);
    ctx.stroke();

    // Casing Free-Flooding Limber Slits
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    for (let s = -3; s <= 3; s++) {
      const sx = s * (l * 0.07);
      ctx.beginPath();
      ctx.moveTo(sx, -w * 0.2);
      ctx.lineTo(sx + 3.5, -w * 0.2);
      ctx.moveTo(sx, w * 0.2);
      ctx.lineTo(sx + 3.5, w * 0.2);
      ctx.stroke();
    }

    // Tall stepped sail / conning tower midships with periscopes & snorkel mast
    ctx.fillStyle = '#21131A';
    ctx.strokeStyle = '#FF8A80';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-l * 0.1, -w * 0.2, l * 0.2, w * 0.4);
    ctx.fillRect(-l * 0.1, -w * 0.2, l * 0.2, w * 0.4);

    // Periscope and Snorkel Masts
    ctx.beginPath();
    ctx.moveTo(-l * 0.02, 0);
    ctx.lineTo(l * 0.05, 0);
    ctx.stroke();

    // Stern 4 Torpedo Tubes and Rudder Fin
    ctx.strokeStyle = detailColor;
    ctx.beginPath();
    ctx.moveTo(-l * 0.42, 0);
    ctx.lineTo(-l * 0.48, 0);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // Ticonderoga CG (Aegis Cruiser with SPY-1 phased array deckhouses)
  private drawTiconderogaCG(ship: Ship, hullColor: string, _detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Spruance-derived hull with knifelike bow and broad stern
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.35, -w * 0.44);
    ctx.lineTo(-l * 0.45, -w * 0.44);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.45, w * 0.44);
    ctx.lineTo(l * 0.35, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Prominent Blocky Aegis Deckhouse with Octagonal AN/SPY-1A Radar Plates
    ctx.fillStyle = '#0E2A47';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(l * 0.08, -w * 0.34, l * 0.16, w * 0.68);
    ctx.fillRect(l * 0.08, -w * 0.34, l * 0.16, w * 0.68);

    // SPY-1 Phased Array Octagonal Face (Fwd Starboard & Port)
    ctx.strokeStyle = '#80DEEA';
    ctx.strokeRect(l * 0.18, -w * 0.34, 6, 8);
    ctx.strokeRect(l * 0.18, w * 0.34 - 8, 6, 8);

    // Mk 26 / Mk 41 VLS & Mk 45 5"/54 Lightweight Gun
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(l * 0.28, -w * 0.15, 10, w * 0.3);
    ctx.fillRect(-l * 0.28, -w * 0.15, 10, w * 0.3);

    // Mk 15 Phalanx CIWS (Port & Starboard)
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(l * 0.02, -w * 0.42, 4, 4);
    ctx.fillRect(l * 0.02, w * 0.42 - 4, 4, 4);

    this.drawShipTurrets(ship, hullColor);
  }

  // Iowa Modernized (1980s refit: 3x 16" turrets, 4x Phalanx CIWS, 8x ABL Tomahawk, 4x Harpoon)
  private drawIowaModernized(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#0A1828';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.2;

    // Heavily armored Iowa battleship clipper hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.36, -w * 0.46);
    ctx.lineTo(-l * 0.42, -w * 0.46);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.42, w * 0.46);
    ctx.lineTo(l * 0.36, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Citadel & Modern Armored Box Launchers (Tomahawk)
    ctx.fillStyle = '#142A3E';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(-l * 0.15, -w * 0.28, l * 0.3, w * 0.56);
    ctx.fillRect(-l * 0.15, -w * 0.28, l * 0.3, w * 0.56);

    // 4x Mk 15 Phalanx CIWS white domes
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFE082';
    for (const pos of [
      { x: l * 0.06, y: -w * 0.4 },
      { x: l * 0.06, y: w * 0.4 },
      { x: -l * 0.18, y: -w * 0.38 },
      { x: -l * 0.18, y: w * 0.38 },
    ]) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Harpoon Quad Launchers midships
    ctx.fillStyle = '#00E5FF';
    ctx.fillRect(-l * 0.02, -w * 0.34, 6, 3);
    ctx.fillRect(-l * 0.02, w * 0.34 - 3, 6, 3);

    this.drawShipTurrets(ship, hullColor);
  }

  // Oliver Hazard Perry FFG (Single Mk 13 launcher on foredeck, LAMPS helo hangar aft)
  private drawPerryFFG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#071624';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.32, -w * 0.44);
    ctx.lineTo(-l * 0.46, -w * 0.44);
    ctx.lineTo(-l * 0.49, 0);
    ctx.lineTo(-l * 0.46, w * 0.44);
    ctx.lineTo(l * 0.32, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mk 13 Single Arm Missile Launcher (SM-1MR & Harpoon)
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(l * 0.28, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Superstructure & Mk 75 76mm OTO Melara Gun on top of deckhouse
    ctx.fillStyle = '#0E243A';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(-l * 0.05, -w * 0.3, l * 0.22, w * 0.6);
    ctx.fillRect(-l * 0.05, -w * 0.3, l * 0.22, w * 0.6);

    // Twin Helo Hangar & Flight Deck Aft
    ctx.strokeStyle = '#4FC3F7';
    ctx.strokeRect(-l * 0.36, -w * 0.36, l * 0.26, w * 0.72);

    this.drawShipTurrets(ship, hullColor);
  }

  // LCAC Air Cushion Landing Craft
  private drawLCAC(ship: Ship, _hullColor: string, _detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    // Inflatable black rubber skirt outline
    ctx.fillStyle = '#1A1D20';
    ctx.strokeStyle = '#78909C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-l * 0.48, -w * 0.48, l * 0.96, w * 0.96, 6);
    ctx.fill();
    ctx.stroke();

    // Open center vehicle cargo well deck
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#CFD8DC';
    ctx.strokeRect(-l * 0.36, -w * 0.26, l * 0.72, w * 0.52);
    ctx.fillRect(-l * 0.36, -w * 0.26, l * 0.72, w * 0.52);

    // Two huge aft shrouded ducted propulsion air fans
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-l * 0.38, -w * 0.35, 7, 0, Math.PI * 2);
    ctx.arc(-l * 0.38, w * 0.35, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Control cabin on starboard bow
    ctx.fillStyle = '#80DEEA';
    ctx.fillRect(l * 0.22, -w * 0.44, 10, 6);
  }

  // Soviet Kiev Class Aircraft Carrier / Heavy Aviation Cruiser (CVHG)
  private drawKievCVHG(ship: Ship, hullColor: string, _detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#1C1217';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

    // Angled flight deck on port side, heavy missile battery on forecastle
    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.48, -w * 0.48);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.48, w * 0.48);
    ctx.lineTo(l * 0.36, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Huge island on starboard side
    ctx.fillStyle = '#2D1B22';
    ctx.strokeStyle = '#FF8A80';
    ctx.strokeRect(-l * 0.1, w * 0.12, l * 0.28, w * 0.3);
    ctx.fillRect(-l * 0.1, w * 0.12, l * 0.28, w * 0.3);

    // Port Angled Runway Line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(-l * 0.44, -w * 0.12);
    ctx.lineTo(l * 0.25, -w * 0.22);
    ctx.stroke();
    ctx.setLineDash([]);

    // Forecastle 4x Twin P-500 Bazalt / Granit Heavy Missile Launch Tubes
    ctx.fillStyle = '#D50000';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(l * 0.28 + (i % 2) * 8, -w * 0.28 + Math.floor(i / 2) * 12, 12, 4);
    }

    // Yellow angled deck foul stripe & Yak-38 deck spots
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-l * 0.45, -w * 0.42);
    ctx.lineTo(l * 0.22, -w * 0.40);
    ctx.stroke();

    const readyDeckPlanes = ship.carrierPlanes
      ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
      : 0;
    const parkedCount = Math.min(3, Math.ceil(readyDeckPlanes / 3));
    for (let p = 0; p < parkedCount; p++) {
      const px = -l * 0.34 + p * (l * 0.14);
      ctx.fillStyle = '#EF9A9A';
      ctx.beginPath();
      ctx.moveTo(px + 3, -w * 0.32);
      ctx.lineTo(px - 2, -w * 0.32 - 2.8);
      ctx.lineTo(px - 2, -w * 0.32 + 2.8);
      ctx.closePath();
      ctx.fill();
    }

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Kirov Class Battlecruiser (CGN Project 1144 Orlan)
  private drawKirovCGN(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#1E1217';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.2;

    // Massive nuclear-powered battlecruiser hull with wave-piercing bow
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.36, -w * 0.46);
    ctx.lineTo(-l * 0.46, -w * 0.46);
    ctx.lineTo(-l * 0.5, 0);
    ctx.lineTo(-l * 0.46, w * 0.46);
    ctx.lineTo(l * 0.36, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Foredeck 20x P-700 Granit VLS Silos (Incline Launchers)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);
    ctx.fillRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);

    // Massive Pyramid Superstructure & Radar Masts (Top Pair / Top Steer)
    ctx.fillStyle = '#2A1820';
    ctx.strokeStyle = detailColor;
    ctx.strokeRect(-l * 0.08, -w * 0.32, l * 0.2, w * 0.64);
    ctx.fillRect(-l * 0.08, -w * 0.32, l * 0.2, w * 0.64);

    // S-300F Fort (SA-N-6) Revolver Silos & AK-630 CIWS Batteries
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(l * 0.08, 0, 6, 0, Math.PI * 2);
    ctx.arc(-l * 0.16, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Twin AK-130 130mm Gun Turret on Stern
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(-l * 0.35, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    this.drawShipTurrets(ship, hullColor);
  }

  // Soviet Sovremenny Class Destroyer (Project 956 Sarych with 8x Moskit Sunburn)
  private drawSovremennyDD(ship: Ship, hullColor: string, _detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#1A1015';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.9;

    ctx.beginPath();
    ctx.moveTo(l * 0.5, 0);
    ctx.lineTo(l * 0.32, -w * 0.44);
    ctx.lineTo(-l * 0.46, -w * 0.44);
    ctx.lineTo(-l * 0.49, 0);
    ctx.lineTo(-l * 0.46, w * 0.44);
    ctx.lineTo(l * 0.32, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2x Quad P-270 Moskit (SS-N-22 Sunburn) Angled Canisters (Port & Starboard)
    ctx.strokeStyle = '#FF1744';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(l * 0.08, -w * 0.45, 12, 6);
    ctx.strokeRect(l * 0.08, w * 0.45 - 6, 12, 6);

    // Bow & Stern AK-130 Twin 130mm Gun Mounts
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(l * 0.34, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.38, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // CVN-68 Nimitz Nuclear Supercarrier Line Art (Angled flight deck, aft nuclear island, 4 catapults)
  // ══════════════════════════════════════════════════════════
  private drawNimitzCVN(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.4;

    // Angled Flight Deck Outer Perimeter:
    ctx.beginPath();
    ctx.moveTo(l * 0.52, -w * 0.16);
    ctx.lineTo(l * 0.48, w * 0.36);
    ctx.lineTo(l * 0.24, w * 0.40);
    ctx.lineTo(-l * 0.04, w * 0.40);
    ctx.lineTo(-l * 0.08, w * 0.46);
    ctx.lineTo(-l * 0.34, w * 0.46);
    ctx.lineTo(-l * 0.38, w * 0.38);
    ctx.lineTo(-l * 0.50, w * 0.30);
    ctx.lineTo(-l * 0.52, 0);
    ctx.lineTo(-l * 0.50, -w * 0.34);
    ctx.lineTo(-l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.08, -w * 0.54);
    ctx.lineTo(l * 0.20, -w * 0.54);
    ctx.lineTo(l * 0.34, -w * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Steel Deck Armor Tint
    ctx.fillStyle = 'rgba(16, 36, 56, 0.5)';
    ctx.fill();

    // 1. Bow Steam Catapults (Cat 1 & Cat 2)
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(l * 0.18, w * 0.12);
    ctx.lineTo(l * 0.48, w * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(l * 0.18, -w * 0.05);
    ctx.lineTo(l * 0.48, -w * 0.05);
    ctx.stroke();

    // 2. Angled Waist Steam Catapults (Cat 3 & Cat 4)
    const cantAngle = -0.165; // ~9.5 deg
    ctx.save();
    ctx.translate(-l * 0.04, -w * 0.18);
    ctx.rotate(cantAngle);
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-l * 0.14, -w * 0.06);
    ctx.lineTo(l * 0.24, -w * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.14, w * 0.06);
    ctx.lineTo(l * 0.24, w * 0.06);
    ctx.stroke();

    // Angled Runway Centerline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(-l * 0.44, 0);
    ctx.lineTo(l * 0.26, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 Cross-Deck Pendant Arresting Cables
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 4; c++) {
      const cx = -l * 0.30 + c * 11;
      ctx.beginPath();
      ctx.moveTo(cx, -w * 0.19);
      ctx.lineTo(cx, w * 0.19);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Four Large Deck-Edge Elevators (2 starboard fwd, 1 starboard aft, 1 port aft)
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(l * 0.22, w * 0.38, l * 0.08, w * 0.09);
    ctx.strokeRect(l * 0.06, w * 0.38, l * 0.08, w * 0.09);
    ctx.strokeRect(-l * 0.24, w * 0.36, l * 0.08, w * 0.09); // Starboard aft (behind island)
    ctx.strokeRect(-l * 0.36, -w * 0.45, l * 0.08, w * 0.09); // Port aft

    // 4. Compact Nuclear Island placed far aft on starboard side (Behind Elevator 2)
    ctx.fillStyle = '#0B1D2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.rect(-l * 0.06, w * 0.28, l * 0.15, w * 0.11);
    ctx.fill();
    ctx.stroke();

    // Radars atop Island: SPS-48 3D radar & SPN-43 air traffic radar
    ctx.fillStyle = '#FFE082';
    ctx.fillRect(-l * 0.02, w * 0.31, 3, 3);
    ctx.fillRect(l * 0.04, w * 0.31, 3, 3);

    // 5. Jet Blast Deflectors, Foul Edge Lines & Parked Air Wing Silhouettes
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(l * 0.15, w * 0.10, 2.5, 5);
    ctx.fillRect(l * 0.15, -w * 0.07, 2.5, 5);
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-l * 0.36, -w * 0.46);
    ctx.lineTo(l * 0.18, -w * 0.52);
    ctx.stroke();

    const readyDeckPlanes = ship.carrierPlanes
      ? Object.values(ship.carrierPlanes.ready).reduce((sum, n) => sum + n, 0)
      : 0;
    const parkedCount = Math.min(4, Math.ceil(readyDeckPlanes / 4));
    for (let p = 0; p < parkedCount; p++) {
      const px = -l * 0.32 + p * (l * 0.13);
      const py = p % 2 === 0 ? w * 0.28 : -w * 0.40;
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.moveTo(px + 3.5, py);
      ctx.lineTo(px - 2.5, py - 3.5);
      ctx.lineTo(px - 2.5, py + 3.5);
      ctx.closePath();
      ctx.fill();
    }

    // 6. Weapon Sponsons: Mk 29 Sea Sparrow & Phalanx CIWS
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1;
    // Bow starboard CIWS sponson
    ctx.strokeRect(l * 0.44, w * 0.32, 5, 5);
    // Stern port Sea Sparrow sponson
    ctx.strokeRect(-l * 0.48, -w * 0.32, 6, 6);
    // Stern starboard Sea Sparrow + CIWS sponson
    ctx.strokeRect(-l * 0.48, w * 0.28, 6, 6);

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // CGN-38 Virginia-Class Nuclear Cruiser Line Art
  // ══════════════════════════════════════════════════════════
  private drawVirginiaCG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Sleek, flush-deck nuclear cruiser hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0); // Sharp raked bow
    ctx.lineTo(l * 0.36, -w * 0.44);
    ctx.lineTo(-l * 0.38, -w * 0.44);
    ctx.lineTo(-l * 0.50, -w * 0.28); // Transom stern
    ctx.lineTo(-l * 0.50, w * 0.28);
    ctx.lineTo(-l * 0.38, w * 0.44);
    ctx.lineTo(l * 0.36, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boxy nuclear superstructure (no main smokestacks)
    ctx.fillStyle = '#0C2032';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-l * 0.24, -w * 0.30, l * 0.48, w * 0.60);
    ctx.strokeRect(-l * 0.24, -w * 0.30, l * 0.48, w * 0.60);

    // Forward Bridge & Navigation Tower
    ctx.fillStyle = '#102A44';
    ctx.fillRect(l * 0.08, -w * 0.24, l * 0.14, w * 0.48);
    ctx.strokeRect(l * 0.08, -w * 0.24, l * 0.14, w * 0.48);

    // SPS-40 / SPS-48 Radar Masts
    ctx.strokeStyle = '#FFE082';
    ctx.strokeRect(l * 0.12, -w * 0.08, 4, w * 0.16);
    ctx.strokeRect(-l * 0.16, -w * 0.08, 4, w * 0.16);

    // Mk 26 Mod 0/1 Twin-Arm Missile Launchers (Fore & Aft)
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.2;
    // Forward Mk 26 Launcher
    ctx.beginPath();
    ctx.arc(l * 0.28, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(l * 0.28, -6);
    ctx.lineTo(l * 0.28, 6);
    ctx.stroke();

    // Aft Mk 26 Launcher
    ctx.beginPath();
    ctx.arc(-l * 0.30, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.30, -6);
    ctx.lineTo(-l * 0.30, 6);
    ctx.stroke();

    // Midships Harpoon Quad Canisters (Port & Starboard)
    ctx.strokeStyle = '#FFCA28';
    ctx.strokeRect(-l * 0.02, -w * 0.36, 6, 4);
    ctx.strokeRect(-l * 0.02, w * 0.30, 6, 4);

    // Stern Helo Flight Deck & Internal Hangar
    ctx.strokeStyle = '#80DEEA';
    ctx.strokeRect(-l * 0.48, -w * 0.22, l * 0.14, w * 0.44);
    ctx.beginPath();
    ctx.arc(-l * 0.41, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // DD-963 Spruance-Class Destroyer Line Art (Gas turbine, twin macks, dual helo hangar)
  // ══════════════════════════════════════════════════════════
  private drawSpruanceDD(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // 172m Gas-Turbine Destroyer Hull with flared bow and transom stern
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.46);
    ctx.lineTo(-l * 0.40, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.32);
    ctx.lineTo(-l * 0.50, w * 0.32);
    ctx.lineTo(-l * 0.40, w * 0.46);
    ctx.lineTo(l * 0.38, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Deck Superstructure (Split into forward bridge, twin macks, and dual hangar)
    ctx.fillStyle = '#0C1E30';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(-l * 0.30, -w * 0.32, l * 0.56, w * 0.64);
    ctx.strokeRect(-l * 0.30, -w * 0.32, l * 0.56, w * 0.64);

    // Forward ASROC / Mk 41 VLS Deck Hatch
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#4FC3F7';
    ctx.strokeRect(l * 0.18, -w * 0.22, l * 0.08, w * 0.44);

    // Forward Mack (Combined Mast and Stack)
    ctx.fillStyle = '#1A237E';
    ctx.fillRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
    ctx.strokeRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
    ctx.fillStyle = '#212121'; // Soot cap
    ctx.fillRect(l * 0.05, -w * 0.12, l * 0.04, w * 0.24);

    // Aft Mack (Aft Combined Mast and Stack)
    ctx.fillStyle = '#1A237E';
    ctx.fillRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
    ctx.strokeRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
    ctx.fillStyle = '#212121'; // Soot cap
    ctx.fillRect(-l * 0.11, -w * 0.12, l * 0.04, w * 0.24);

    // Dual Helicopter Hangars (houses 2x SH-60B)
    ctx.strokeStyle = '#80DEEA';
    ctx.strokeRect(-l * 0.30, -w * 0.26, l * 0.12, w * 0.24);
    ctx.strokeRect(-l * 0.30, w * 0.02, l * 0.12, w * 0.24);

    // Stern Helo Landing Deck
    ctx.strokeRect(-l * 0.48, -w * 0.26, l * 0.15, w * 0.52);
    ctx.beginPath();
    ctx.arc(-l * 0.40, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // DDG-993 Kidd-Class Guided Missile Destroyer Line Art (Spruance hull + Mk 26 fore/aft)
  // ══════════════════════════════════════════════════════════
  private drawKiddDDG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Spruance-Derived Heavy Destroyer Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.46);
    ctx.lineTo(-l * 0.40, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.32);
    ctx.lineTo(-l * 0.50, w * 0.32);
    ctx.lineTo(-l * 0.40, w * 0.46);
    ctx.lineTo(l * 0.38, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Superstructure with SPS-48 3D Radar Tower
    ctx.fillStyle = '#0C1E30';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(-l * 0.26, -w * 0.32, l * 0.48, w * 0.64);
    ctx.strokeRect(-l * 0.26, -w * 0.32, l * 0.48, w * 0.64);

    // Forward and Aft Twin Macks with SPG-51 Illuminators
    ctx.fillStyle = '#102A44';
    ctx.fillRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
    ctx.strokeRect(l * 0.04, -w * 0.18, l * 0.06, w * 0.36);
    ctx.fillRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);
    ctx.strokeRect(-l * 0.12, -w * 0.18, l * 0.06, w * 0.36);

    // Forward Mk 26 Twin-Arm Guided Missile Launcher
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(l * 0.22, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(l * 0.22, -5);
    ctx.lineTo(l * 0.22, 5);
    ctx.stroke();

    // Aft Mk 26 Twin-Arm Guided Missile Launcher (Replaces Spruance aft helo hangar)
    ctx.beginPath();
    ctx.arc(-l * 0.28, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-l * 0.28, -5);
    ctx.lineTo(-l * 0.28, 5);
    ctx.stroke();

    // Midships Harpoon quad canister racks
    ctx.strokeStyle = '#FFCA28';
    ctx.strokeRect(-l * 0.04, -w * 0.38, 5, 4);
    ctx.strokeRect(-l * 0.04, w * 0.30, 5, 4);

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // LPD-4 Austin-Class Amphibious Transport Dock Line Art (Forward bridge, floodable well deck)
  // ══════════════════════════════════════════════════════════
  private drawAustinLPD(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // High, beamy amphibious transport hull with open transom stern
    ctx.beginPath();
    ctx.moveTo(l * 0.50, 0);
    ctx.lineTo(l * 0.36, -w * 0.46);
    ctx.lineTo(-l * 0.44, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.38);
    ctx.lineTo(-l * 0.50, w * 0.38);
    ctx.lineTo(-l * 0.44, w * 0.46);
    ctx.lineTo(l * 0.36, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forward Command Bridge Superstructure
    ctx.fillStyle = '#0B1E2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.fillRect(l * 0.14, -w * 0.36, l * 0.22, w * 0.72);
    ctx.strokeRect(l * 0.14, -w * 0.36, l * 0.22, w * 0.72);

    // Twin Funnels atop Forward Superstructure
    ctx.strokeRect(l * 0.18, -w * 0.22, 5, 8);
    ctx.strokeRect(l * 0.18, w * 0.14, 5, 8);

    // Heavy-duty Midships Cargo Crane
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(l * 0.06, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(l * 0.06, 0);
    ctx.lineTo(-l * 0.04, -w * 0.25);
    ctx.stroke();

    // Massive Stern Floodable Well Deck with Dock Water Surface
    ctx.fillStyle = 'rgba(0, 150, 136, 0.35)';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-l * 0.46, -w * 0.28, l * 0.42, w * 0.56);
    ctx.strokeRect(-l * 0.46, -w * 0.28, l * 0.42, w * 0.56);

    // Stern Well-Deck Gate Opening lines
    ctx.strokeStyle = '#80CBC4';
    ctx.beginPath();
    ctx.moveTo(-l * 0.50, -w * 0.28);
    ctx.lineTo(-l * 0.46, -w * 0.28);
    ctx.moveTo(-l * 0.50, w * 0.28);
    ctx.lineTo(-l * 0.46, w * 0.28);
    ctx.stroke();

    // Elevated Helo Landing Deck over Well Deck
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(-l * 0.42, -w * 0.36, l * 0.34, w * 0.72);
    ctx.beginPath();
    ctx.arc(-l * 0.25, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // SSN-688 Los Angeles-Class Nuclear Attack Submarine Line Art
  // ══════════════════════════════════════════════════════════
  private drawLosAngelesSSN(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#040C16';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // 110m Streamlined Teardrop Cylindrical Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.50, 0); // Rounded hemispherical sonar bow
    ctx.bezierCurveTo(l * 0.46, -w * 0.45, l * 0.25, -w * 0.45, 0, -w * 0.45);
    ctx.bezierCurveTo(-l * 0.25, -w * 0.45, -l * 0.44, -w * 0.30, -l * 0.50, 0);
    ctx.bezierCurveTo(-l * 0.44, w * 0.30, -l * 0.25, w * 0.45, 0, w * 0.45);
    ctx.bezierCurveTo(l * 0.25, w * 0.45, l * 0.46, w * 0.45, l * 0.50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 12 VLS Tomahawk Vertical Launch Tube Hatches on Forward Casing
    ctx.fillStyle = '#1A237E';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1;
    for (let row = 0; row < 6; row++) {
      const vx = l * 0.24 + row * 4;
      ctx.fillRect(vx, -w * 0.18, 2.5, 2.5);
      ctx.fillRect(vx, w * 0.10, 2.5, 2.5);
    }

    // Streamlined Sail (Conning Tower) with Fairwater Dive Planes
    ctx.fillStyle = '#0D233A';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(l * 0.05, -w * 0.20, l * 0.14, w * 0.40, 2);
    ctx.fill();
    ctx.stroke();

    // Fairwater Dive Planes extending from sail
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(l * 0.12, -w * 0.42);
    ctx.lineTo(l * 0.12, -w * 0.20);
    ctx.moveTo(l * 0.12, w * 0.20);
    ctx.lineTo(l * 0.12, w * 0.42);
    ctx.stroke();

    // Cruciform Stern Control Surfaces (Rudders & Elevators) & 7-Blade Screw
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-l * 0.45, -w * 0.48);
    ctx.lineTo(-l * 0.45, w * 0.48);
    ctx.moveTo(-l * 0.51, -w * 0.18);
    ctx.lineTo(-l * 0.51, w * 0.18);
    ctx.stroke();
  }

  // ══════════════════════════════════════════════════════════
  // Project 949A Oscar-II Class Nuclear Cruise Missile Submarine Line Art
  // ══════════════════════════════════════════════════════════
  private drawOscarSSGN(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#040C16';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.2;

    // Massive 18.2m Broad Double Hull (Widest Submarine Profile)
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.bezierCurveTo(l * 0.48, -w * 0.50, l * 0.28, -w * 0.50, 0, -w * 0.50);
    ctx.bezierCurveTo(-l * 0.30, -w * 0.50, -l * 0.46, -w * 0.35, -l * 0.52, 0);
    ctx.bezierCurveTo(-l * 0.46, w * 0.35, -l * 0.30, w * 0.50, 0, w * 0.50);
    ctx.bezierCurveTo(l * 0.28, w * 0.50, l * 0.48, w * 0.50, l * 0.52, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 24 Angled Silo Hatches for P-700 Granit (SS-N-19 Shipwreck) Missiles
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF8A80';
    ctx.lineWidth = 1;
    for (let s = 0; s < 12; s++) {
      const sx = l * 0.18 - s * 5.5;
      // Port missile silos
      ctx.strokeRect(sx, -w * 0.42, 4.5, 4);
      // Starboard missile silos
      ctx.strokeRect(sx, w * 0.32, 4.5, 4);
    }

    // Wide, Low Streamlined Sail
    ctx.fillStyle = '#102A44';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-l * 0.04, -w * 0.24, l * 0.20, w * 0.48, 3);
    ctx.fill();
    ctx.stroke();

    // Prominent Towed-Array Sonar Pod atop Aft Vertical Rudder
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#80DEEA';
    ctx.beginPath();
    ctx.ellipse(-l * 0.48, 0, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // ══════════════════════════════════════════════════════════
  // Project 1155 Udaloy-Class Large ASW Destroyer Line Art
  // ══════════════════════════════════════════════════════════
  private drawUdaloyDD(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // 163m Deep Knuckle Bow Soviet Destroyer Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.45);
    ctx.lineTo(-l * 0.42, -w * 0.45);
    ctx.lineTo(-l * 0.50, -w * 0.28);
    ctx.lineTo(-l * 0.50, w * 0.28);
    ctx.lineTo(-l * 0.42, w * 0.45);
    ctx.lineTo(l * 0.38, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Superstructure & Top Pair Air-Search Radar Towers
    ctx.fillStyle = '#0B1D2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(-l * 0.24, -w * 0.32, l * 0.46, w * 0.64);
    ctx.strokeRect(-l * 0.24, -w * 0.32, l * 0.46, w * 0.64);

    // Twin 4-Tube KT-100 Box Launchers for Rastrub-B (SS-N-14 Silex) ASW Missiles
    ctx.strokeStyle = '#FF8A80';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(l * 0.12, -w * 0.42, l * 0.08, w * 0.16);
    ctx.strokeRect(l * 0.12, w * 0.26, l * 0.08, w * 0.16);

    // 3K95 Kinzhal (SA-N-9 Gauntlet) VLS Rotary Drums (4 fwd, 4 aft)
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(l * 0.28, -w * 0.14, 3, 0, Math.PI * 2);
    ctx.arc(l * 0.28, w * 0.14, 3, 0, Math.PI * 2);
    ctx.arc(-l * 0.16, -w * 0.14, 3, 0, Math.PI * 2);
    ctx.arc(-l * 0.16, w * 0.14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Twin Helicopter Hangars & Sunken Landing Deck for Ka-27 Helix
    ctx.strokeStyle = '#80DEEA';
    ctx.strokeRect(-l * 0.36, -w * 0.28, l * 0.12, w * 0.26);
    ctx.strokeRect(-l * 0.36, w * 0.02, l * 0.12, w * 0.26);
    ctx.strokeRect(-l * 0.48, -w * 0.25, l * 0.12, w * 0.50);

    // Bow Twin AK-100 100mm Single Gun Turrets
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(l * 0.38, 0, 4, 0, Math.PI * 2);
    ctx.arc(l * 0.44, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // Project 58 Kynda-Class Guided Missile Cruiser Line Art
  // ══════════════════════════════════════════════════════════
  private drawKyndaCG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Raked Bow Soviet Cruiser Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.44);
    ctx.lineTo(-l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.50, -w * 0.26);
    ctx.lineTo(-l * 0.50, w * 0.26);
    ctx.lineTo(-l * 0.40, w * 0.44);
    ctx.lineTo(l * 0.38, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tall Pyramidal Lattice Mast Towers (Head Net A Radar)
    ctx.fillStyle = '#0B1E2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(l * 0.02, -w * 0.26, l * 0.10, w * 0.52);
    ctx.strokeRect(l * 0.02, -w * 0.26, l * 0.10, w * 0.52);
    ctx.fillRect(-l * 0.16, -w * 0.24, l * 0.08, w * 0.48);
    ctx.strokeRect(-l * 0.16, -w * 0.24, l * 0.08, w * 0.48);

    // Massive Quadruple SM-70 Trainable Launchers for P-35 Shaddock (Fore & Aft)
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 1.5;
    // Forward Quad SM-70
    ctx.strokeRect(l * 0.20, -w * 0.30, l * 0.12, w * 0.60);
    // Aft Quad SM-70
    ctx.strokeRect(-l * 0.34, -w * 0.30, l * 0.12, w * 0.60);

    // Twin AK-726 76mm Enclosed Gun Turret at Stern
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(-l * 0.44, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // Project 68bis Sverdlov-Class Conventional Gun Cruiser Line Art
  // ══════════════════════════════════════════════════════════
  private drawSverdlovCL(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // 210m Long Flush-Deck Classic Cruiser Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.50, -w * 0.24);
    ctx.lineTo(-l * 0.50, w * 0.24);
    ctx.lineTo(-l * 0.40, w * 0.44);
    ctx.lineTo(l * 0.40, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elongated Citadel & Bridge
    ctx.fillStyle = '#0B1D2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(-l * 0.20, -w * 0.28, l * 0.40, w * 0.56);
    ctx.strokeRect(-l * 0.20, -w * 0.28, l * 0.40, w * 0.56);

    // Twin Raked Funnels with Caps
    ctx.fillStyle = '#212121';
    ctx.fillRect(l * 0.04, -w * 0.12, l * 0.05, w * 0.24);
    ctx.fillRect(-l * 0.10, -w * 0.12, l * 0.05, w * 0.24);

    // 4 Triple 152mm Main Turrets (Turrets 1 & 2 fwd, 3 & 4 aft)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(l * 0.36, 0, 5, 0, Math.PI * 2);
    ctx.arc(l * 0.26, 0, 5, 0, Math.PI * 2);
    ctx.arc(-l * 0.28, 0, 5, 0, Math.PI * 2);
    ctx.arc(-l * 0.38, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // Project 159 Petya-Class Coastal ASW Frigate Line Art
  // ══════════════════════════════════════════════════════════
  private drawPetyaFFG(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    // Compact 82m Flush-Deck Frigate Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.50, 0);
    ctx.lineTo(l * 0.36, -w * 0.45);
    ctx.lineTo(-l * 0.42, -w * 0.45);
    ctx.lineTo(-l * 0.50, -w * 0.28);
    ctx.lineTo(-l * 0.50, w * 0.28);
    ctx.lineTo(-l * 0.42, w * 0.45);
    ctx.lineTo(l * 0.36, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Bridge & Gas Turbine Stack
    ctx.fillStyle = '#0B1D2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.2;
    ctx.fillRect(-l * 0.16, -w * 0.30, l * 0.32, w * 0.60);
    ctx.strokeRect(-l * 0.16, -w * 0.30, l * 0.32, w * 0.60);

    // Central RBU-6000 12-Barrel Rocket Launcher
    ctx.strokeStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(l * 0.12, 0, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Bow & Stern Twin 76mm AK-726 Gun Mounts
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(l * 0.34, 0, 4, 0, Math.PI * 2);
    ctx.arc(-l * 0.34, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // IJN Takao-Class Heavy Cruiser (Chokai) Line Art (Iconic Castle/Pagoda Bridge)
  // ══════════════════════════════════════════════════════════
  private drawChokaiCA(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Japanese Cruiser Flush Deck Hull with S-Curved Bow Shear
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.50, -w * 0.22);
    ctx.lineTo(-l * 0.50, w * 0.22);
    ctx.lineTo(-l * 0.40, w * 0.44);
    ctx.lineTo(l * 0.40, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Massive 10-Story Pagoda Castle Bridge Superstructure
    ctx.fillStyle = '#050E18';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.6;
    ctx.fillRect(l * 0.05, -w * 0.32, l * 0.16, w * 0.64);
    ctx.strokeRect(l * 0.05, -w * 0.32, l * 0.16, w * 0.64);

    // Bridge tiers with optical rangefinders
    ctx.strokeRect(l * 0.08, -w * 0.22, l * 0.09, w * 0.44);
    ctx.strokeRect(l * 0.11, -w * 0.14, l * 0.04, w * 0.28);

    // Forward Funnel (curved sharply aft) & Second Funnel (straight)
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(-l * 0.03, 0, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-l * 0.12, 0, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Quadruple Type 93 Long Lance Torpedo Sponsons (Midships)
    ctx.strokeStyle = '#4FC3F7';
    ctx.strokeRect(-l * 0.18, -w * 0.46, 6, 4);
    ctx.strokeRect(-l * 0.18, w * 0.38, 6, 4);

    // 5 Twin 20cm Main Turrets: 3 fwd (Turret 3 facing aft), 2 aft
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(l * 0.38, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(l * 0.28, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(l * 0.18, 0, 4.5, 0, Math.PI * 2); // Turret 3
    ctx.arc(-l * 0.28, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.38, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // IJN Kongo-Class Fast Battleship Line Art (Multi-Tier Pagoda Mast)
  // ══════════════════════════════════════════════════════════
  private drawKongoBB(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2.0;

    // Long, Fast Battleship Hull with Clipper Bow & Torpedo Bulge
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.45);
    ctx.lineTo(-l * 0.38, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.20);
    ctx.lineTo(-l * 0.50, w * 0.20);
    ctx.lineTo(-l * 0.38, w * 0.46);
    ctx.lineTo(l * 0.38, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Famous 6-Tier Japanese Pagoda Mast
    ctx.fillStyle = '#050E18';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.5;
    ctx.fillRect(l * 0.04, -w * 0.26, l * 0.14, w * 0.52);
    ctx.strokeRect(l * 0.04, -w * 0.26, l * 0.14, w * 0.52);
    // Upper Pagoda tiers
    ctx.strokeRect(l * 0.07, -w * 0.18, l * 0.08, w * 0.36);
    ctx.strokeRect(l * 0.09, -w * 0.10, l * 0.04, w * 0.20);

    // Twin Funnels with Steam Pipes
    ctx.fillStyle = '#212121';
    ctx.fillRect(-l * 0.04, -w * 0.14, l * 0.05, w * 0.28);
    ctx.strokeRect(-l * 0.04, -w * 0.14, l * 0.05, w * 0.28);
    ctx.fillRect(-l * 0.13, -w * 0.14, l * 0.05, w * 0.28);
    ctx.strokeRect(-l * 0.13, -w * 0.14, l * 0.05, w * 0.28);

    // 4 Twin 35.6cm Main Gun Turrets (2 fwd, 2 aft)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(l * 0.34, 0, 5.5, 0, Math.PI * 2);
    ctx.arc(l * 0.22, 0, 5.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.26, 0, 5.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.38, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // IJN Akizuki-Class Dedicated Anti-Air Destroyer Line Art (4x Twin 10cm)
  // ══════════════════════════════════════════════════════════
  private drawAkizukiDD(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    ctx.fillStyle = '#06101E';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 1.8;

    // 134m Clean Flush-Deck Destroyer Hull
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.44);
    ctx.lineTo(-l * 0.40, -w * 0.44);
    ctx.lineTo(-l * 0.50, -w * 0.26);
    ctx.lineTo(-l * 0.50, w * 0.26);
    ctx.lineTo(-l * 0.40, w * 0.44);
    ctx.lineTo(l * 0.38, w * 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bridge with Type 94 High-Angle Fire Director Tower
    ctx.fillStyle = '#0B1D2E';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1.3;
    ctx.fillRect(l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
    ctx.strokeRect(l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
    // Director tower dome
    ctx.fillStyle = '#FFE082';
    ctx.beginPath();
    ctx.arc(l * 0.12, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Single Large Streamlined Funnel
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(-l * 0.02, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Centerline Quadruple Type 92 61cm Torpedo Launcher with Shielded Reload Box
    ctx.strokeStyle = '#4FC3F7';
    ctx.strokeRect(-l * 0.12, -w * 0.22, 6, w * 0.44);

    // 4 Twin 10cm/65 Type 98 High-Angle Dual-Purpose Turrets (2 fwd, 2 aft)
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(l * 0.36, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(l * 0.24, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.24, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(-l * 0.36, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawShipTurrets(ship, hullColor);
  }

  // ══════════════════════════════════════════════════════════
  // 盟軍水面打擊群 (Allied SAG) 專屬考證艦艇外觀與動態軍艦旗
  // ══════════════════════════════════════════════════════════

  private drawNavalEnsign(
    ensignType: 'white_ensign' | 'rising_sun' | 'de_bundesmarine' | 'fr_marine',
    x: number,
    y: number,
    length: number = 13,
    height: number = 8.5
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Dynamic wave flutter
    const wave = Math.sin(this.time * 6.5 + x * 0.08) * 1.4;
    const wave2 = Math.cos(this.time * 7.2 + y * 0.08) * 0.9;

    // Flagstaff
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.9);
    ctx.lineTo(0, height * 0.9);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -height * 0.75);

    // Wave clipping mask
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.45, wave, length, wave2);
    ctx.lineTo(length, height + wave2);
    ctx.quadraticCurveTo(length * 0.45, height + wave, 0, height);
    ctx.closePath();
    ctx.clip();

    if (ensignType === 'white_ensign') {
      // 🇬🇧 英國皇家海軍白船旗 (Royal Navy White Ensign)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, length, height);

      // Red St. George's Cross
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(length * 0.42, 0, length * 0.16, height);
      ctx.fillRect(0, height * 0.42, length, height * 0.16);

      // Union Jack in canton (top-left)
      const cW = length * 0.44;
      const cH = height * 0.44;
      ctx.fillStyle = '#0D47A1';
      ctx.fillRect(0, 0, cW, cH);

      // White diagonals
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(cW, cH);
      ctx.moveTo(cW, 0); ctx.lineTo(0, cH);
      ctx.stroke();

      // Red diagonals
      ctx.strokeStyle = '#D32F2F';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(cW, cH);
      ctx.moveTo(cW, 0); ctx.lineTo(0, cH);
      ctx.stroke();

      // Cross
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cW * 0.36, 0, cW * 0.28, cH);
      ctx.fillRect(0, cH * 0.36, cW, cH * 0.28);
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(cW * 0.42, 0, cW * 0.16, cH);
      ctx.fillRect(0, cH * 0.42, cW, cH * 0.16);

    } else if (ensignType === 'rising_sun') {
      // 🇯🇵 日本海上自衛隊十六條旭日旗 (JMSDF 16-ray Rising Sun Ensign)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, length, height);

      const sunX = length * 0.36;
      const sunY = height * 0.5;
      const sunR = height * 0.28;

      ctx.fillStyle = '#C62828';
      for (let r = 0; r < 16; r++) {
        const a1 = (r * Math.PI) / 8 - 0.08;
        const a2 = (r * Math.PI) / 8 + 0.08;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a1) * length * 1.6, sunY + Math.sin(a1) * length * 1.6);
        ctx.lineTo(sunX + Math.cos(a2) * length * 1.6, sunY + Math.sin(a2) * length * 1.6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

    } else if (ensignType === 'de_bundesmarine') {
      // 🇩🇪 德國聯邦海軍旗 (Bundesdienstflagge der Seestreitkräfte)
      const h3 = height / 3;
      ctx.fillStyle = '#212121';
      ctx.fillRect(0, 0, length, h3);
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(0, h3, length, h3);
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(0, h3 * 2, length, h3);

      ctx.fillStyle = '#FFC107';
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(length * 0.38, height * 0.5, height * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (ensignType === 'fr_marine') {
      // 🇫🇷 法國海軍旗 (Pavillon de la Marine nationale)
      const w1 = length * 0.30;
      const w2 = length * 0.33;
      const w3 = length - w1 - w2;
      ctx.fillStyle = '#0D47A1';
      ctx.fillRect(0, 0, w1, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(w1, 0, w2, height);
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(w1 + w2, 0, w3, height);
    }

    ctx.restore();
    ctx.restore();
  }

  // 專屬盟軍艦艇外觀分流分發器
  private drawAlliedSAGShip(ship: Ship, hullColor: string, _detailColor: string) {
    const name = ship.name || '';
    const l = ship.length;
    const w = ship.width;
    const ctx = this.ctx;

    // 1. 日本海上自衛隊 (JMSDF SAG)
    if (name.includes('JDS ') || ship.alliedSAGName?.includes('海上自衛隊')) {
      const isDDH = name.includes('Haruna') || name.includes('Shirane') || name.includes('DDH');

      // JMSDF 海自暗灰塗裝
      const jmsdfDeck = '#455A64';
      const jmsdfDetail = '#80CBC4';

      ctx.fillStyle = '#1A2630';
      ctx.strokeStyle = jmsdfDetail;
      ctx.lineWidth = 2.0;

      // 現代護衛艦船型
      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.lineTo(l * 0.38, -w * 0.46);
      ctx.lineTo(-l * 0.44, -w * 0.46);
      ctx.lineTo(-l * 0.50, -w * 0.35);
      ctx.lineTo(-l * 0.50, w * 0.35);
      ctx.lineTo(-l * 0.44, w * 0.46);
      ctx.lineTo(l * 0.38, w * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (isDDH) {
        // ═══ 榛名型 / 白根型 直升機護衛艦 (DDH) 專屬特徵 ═══
        // 前部階梯雙座 5吋砲甲板
        ctx.fillStyle = jmsdfDeck;
        ctx.fillRect(l * 0.16, -w * 0.32, l * 0.18, w * 0.64);

        // Mk 112 八聯裝 ASROC 椒鹽盒發射箱
        ctx.fillStyle = '#37474F';
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 1.0;
        ctx.fillRect(l * 0.08, -w * 0.22, l * 0.08, w * 0.44);
        ctx.strokeRect(l * 0.08, -w * 0.22, l * 0.08, w * 0.44);

        // 中央整合式 Mack (Mast + Stack 艦橋煙囪複合結構)
        ctx.fillStyle = '#212D38';
        ctx.fillRect(-l * 0.08, -w * 0.26, l * 0.14, w * 0.52);
        ctx.strokeStyle = '#80DEEA';
        ctx.strokeRect(-l * 0.08, -w * 0.26, l * 0.14, w * 0.52);

        // 後部巨型 3機直升機雙機庫 (Double Helicopter Hangar)
        ctx.fillStyle = '#1E2B37';
        ctx.fillRect(-l * 0.30, -w * 0.38, l * 0.20, w * 0.76);
        ctx.strokeStyle = jmsdfDetail;
        ctx.strokeRect(-l * 0.30, -w * 0.38, l * 0.20, w * 0.76);

        // 機庫頂部 Mk 29 海麻雀發射器
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-l * 0.22, -w * 0.14, l * 0.06, w * 0.28);

        // 後甲板大型起降飛行甲板與直升機著艦 "H" 標線
        ctx.fillStyle = '#263238';
        ctx.fillRect(-l * 0.48, -w * 0.38, l * 0.18, w * 0.76);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-l * 0.48, -w * 0.38, l * 0.18, w * 0.76);

        // 白色著艦圓環與 "H"
        ctx.beginPath();
        ctx.arc(-l * 0.39, 0, w * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', -l * 0.39, 0);

      } else {
        // ═══ 朝霧型 / 初雪型 / 高月型 護衛艦 (DD/FFG) ═══
        // 艦首砲位與 ASROC 區
        ctx.fillStyle = jmsdfDeck;
        ctx.fillRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);

        // 緊湊現代艦橋與方陣 CIWS 耳台
        ctx.fillStyle = '#212D38';
        ctx.fillRect(-l * 0.04, -w * 0.30, l * 0.16, w * 0.60);
        ctx.strokeStyle = jmsdfDetail;
        ctx.strokeRect(-l * 0.04, -w * 0.30, l * 0.16, w * 0.60);

        // CIWS sponsons (白色方陣密集陣)
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(l * 0.02, -w * 0.34, 2.8, 0, Math.PI * 2);
        ctx.arc(l * 0.02, w * 0.34, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // 艦舯魚叉發射架
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-l * 0.14, -w * 0.22, l * 0.07, w * 0.44);

        // 艦尾海麻雀與 SH-60J 機庫甲板
        ctx.fillStyle = '#263238';
        ctx.fillRect(-l * 0.42, -w * 0.32, l * 0.24, w * 0.64);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeRect(-l * 0.42, -w * 0.32, l * 0.24, w * 0.64);
        ctx.beginPath();
        ctx.arc(-l * 0.30, 0, w * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 艦尾動態揮舞：日本海上自衛隊十六條旭日旗
      this.drawNavalEnsign('rising_sun', -l * 0.48, 0, 13, 8.5);

    } else if (name.includes('Bremen') || name.includes('FGS ')) {
      // 2. 德國布萊梅級巡防艦 (FGS Bremen F207)
      const deDetail = '#FFD54F';

      ctx.fillStyle = '#1A252E';
      ctx.strokeStyle = deDetail;
      ctx.lineWidth = 1.9;

      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.lineTo(l * 0.36, -w * 0.46);
      ctx.lineTo(-l * 0.44, -w * 0.46);
      ctx.lineTo(-l * 0.50, 0);
      ctx.lineTo(-l * 0.44, w * 0.46);
      ctx.lineTo(l * 0.36, w * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 前甲板 8聯裝 NATO 海麻雀
      ctx.fillStyle = '#37474F';
      ctx.fillRect(l * 0.14, -w * 0.22, l * 0.08, w * 0.44);

      // 緊湊現代德式上層建築
      ctx.fillStyle = '#263238';
      ctx.fillRect(-l * 0.06, -w * 0.28, l * 0.16, w * 0.56);
      ctx.strokeStyle = '#90A4AE';
      ctx.strokeRect(-l * 0.06, -w * 0.28, l * 0.16, w * 0.56);

      // 艦尾飛行甲板
      ctx.fillStyle = '#212D38';
      ctx.fillRect(-l * 0.44, -w * 0.32, l * 0.22, w * 0.64);

      // 艦尾動態：德國聯邦海軍旗
      this.drawNavalEnsign('de_bundesmarine', -l * 0.47, 0, 13, 8.5);

    } else if (name.includes('Tourville') || name.includes('FS ')) {
      // 3. 法國杜爾維爾級導向飛彈驅逐艦 (FS Tourville D610)
      const frDetail = '#64B5F6';
      ctx.fillStyle = '#1E2B37';
      ctx.strokeStyle = frDetail;
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.lineTo(l * 0.36, -w * 0.45);
      ctx.lineTo(-l * 0.45, -w * 0.45);
      ctx.lineTo(-l * 0.50, 0);
      ctx.lineTo(-l * 0.45, w * 0.45);
      ctx.lineTo(l * 0.36, w * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 法式高聳傾斜主桅杆與雷達罩
      ctx.fillStyle = '#2A3C4D';
      ctx.fillRect(-l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(l * 0.05, 0, 4.0, 0, Math.PI * 2);
      ctx.fill();

      // 艦舯 Malafon 重型反潛飛彈箱
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-l * 0.18, -w * 0.20, l * 0.10, w * 0.40);

      // 艦尾響尾蛇 (Crotale) 防空飛彈發射架
      ctx.fillStyle = '#546E7A';
      ctx.fillRect(-l * 0.34, -w * 0.16, l * 0.08, w * 0.32);

      // 艦尾動態：法國海軍三色旗
      this.drawNavalEnsign('fr_marine', -l * 0.48, 0, 13, 8.5);

    } else {
      // 4. 英國皇家海軍 (Royal Navy SAG: KGV / Duke of York / Sheffield / Belfast / Type 42 / Jervis)
      const isRNBB = name.includes('George') || name.includes('York') || ship.type === 'battleship';
      const isRNDDG = name.includes('Type 42') || name.includes('42型') || name.includes('Gloucester') || (name.includes('Sheffield') && name.includes('D80'));
      const isRNCruiser = name.includes('Belfast') || (name.includes('Sheffield') && !isRNDDG);

      // 英國海軍部海軍灰 (Admiralty Dark Sea Grey)
      ctx.fillStyle = isRNBB ? '#1E2B37' : '#192633';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 2.0;

      // 艦體線條
      ctx.beginPath();
      ctx.moveTo(l * 0.52, 0);
      ctx.lineTo(l * 0.36, -w * 0.46);
      ctx.lineTo(-l * 0.42, -w * 0.46);
      ctx.lineTo(-l * 0.50, -w * 0.30);
      ctx.lineTo(-l * 0.50, w * 0.30);
      ctx.lineTo(-l * 0.42, w * 0.46);
      ctx.lineTo(l * 0.36, w * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (isRNBB) {
        // ═══ 喬治五世級戰艦 (KGV / Duke of York) 城堡艦橋與 14吋砲座 ═══
        // 城堡型裝甲艦橋 (Citadel Tower)
        ctx.fillStyle = '#263849';
        ctx.fillRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
        ctx.strokeStyle = '#B0BEC5';
        ctx.strokeRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);

        // 觀察窗光澤 (Cyan Bridge Windows)
        ctx.fillStyle = '#80DEEA';
        ctx.fillRect(l * 0.14, -w * 0.20, 2.5, w * 0.40);

        // 雙煙囪帶防雨排氣帽
        ctx.fillStyle = '#1A2530';
        ctx.beginPath();
        ctx.ellipse(-l * 0.04, 0, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(-l * 0.14, 0, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 艦舯水上飛機彈射甲板
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-l * 0.22, -w * 0.34, l * 0.07, w * 0.68);

        // 5.25吋兩用副砲耳台 (左右各四座)
        ctx.fillStyle = '#455A64';
        for (let s = -1; s <= 1; s += 2) {
          ctx.beginPath();
          ctx.arc(l * 0.08, s * w * 0.38, 3.5, 0, Math.PI * 2);
          ctx.arc(-l * 0.08, s * w * 0.38, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (isRNDDG) {
        // ═══ 42型 導向飛彈驅逐艦 (Type 42 Sheffield / Gloucester) ═══
        // 艦首海鏢雙臂發射架底座 (Twin Sea Dart Launcher)
        ctx.fillStyle = '#37474F';
        ctx.fillRect(l * 0.18, -w * 0.20, l * 0.08, w * 0.40);
        ctx.strokeStyle = '#80DEEA';
        ctx.strokeRect(l * 0.18, -w * 0.20, l * 0.08, w * 0.40);

        // 艦橋前 Type 909 白色球型射控天線罩
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(l * 0.14, 0, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // 緊湊艦橋與 Type 965 雷達大桅
        ctx.fillStyle = '#263849';
        ctx.fillRect(-l * 0.04, -w * 0.26, l * 0.15, w * 0.52);
        ctx.strokeStyle = '#B0BEC5';
        ctx.strokeRect(-l * 0.04, -w * 0.26, l * 0.15, w * 0.52);

        // 艦橋後 Type 909 第二座球型天線罩
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.arc(-l * 0.12, 0, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // 山貓直升機飛行甲板
        ctx.fillStyle = '#1E2C38';
        ctx.fillRect(-l * 0.44, -w * 0.34, l * 0.22, w * 0.68);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeRect(-l * 0.44, -w * 0.34, l * 0.22, w * 0.68);

      } else if (isRNCruiser) {
        // ═══ 謝菲爾德 / 貝爾法斯特 輕巡洋艦 ═══
        // 箱型上層艦橋
        ctx.fillStyle = '#263849';
        ctx.fillRect(l * 0.05, -w * 0.26, l * 0.15, w * 0.52);
        ctx.strokeStyle = '#80DEEA';
        ctx.strokeRect(l * 0.05, -w * 0.26, l * 0.15, w * 0.52);

        // 雙傾斜煙囪
        ctx.fillStyle = '#1A2530';
        ctx.beginPath();
        ctx.ellipse(-l * 0.05, 0, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(-l * 0.16, 0, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ═══ 皇家海軍驅逐艦 (Jervis / Cossack / Defender) ═══
        ctx.fillStyle = '#263849';
        ctx.fillRect(l * 0.06, -w * 0.24, l * 0.14, w * 0.48);
        ctx.fillStyle = '#1A2530';
        ctx.beginPath();
        ctx.ellipse(-l * 0.06, 0, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 艦尾動態：英國皇家海軍白船旗 (White Ensign)
      this.drawNavalEnsign('white_ensign', -l * 0.48, 0, 13, 8.5);
    }

    this.drawShipTurrets(ship, hullColor);
  }

  // 依照艦種呼叫對應之向量線條艦體繪製
  private renderShipHullByType(ship: Ship, hullColor: string, detailColor: string) {
    // 優先判定盟軍水面作戰群 (Allied SAG) 專屬外觀
    if (ship.isAlliedSAG || ship.side === 'allied') {
      this.drawAlliedSAGShip(ship, hullColor, detailColor);
      return;
    }

    if (ship.type === 'carrier') {
      this.drawCarrier(ship, hullColor, detailColor);
    } else if (ship.type === 'cv63') {
      this.drawCV63(ship, hullColor, detailColor);
    } else if (ship.type === 'cg') {
      this.drawBelknapCG(ship, hullColor, detailColor);
    } else if (ship.type === 'cvn') {
      this.drawNimitzCVN(ship, hullColor, detailColor); // Nimitz supercarrier dedicated modern angled deck
    } else if (ship.type === 'cg_tico') {
      this.drawTiconderogaCG(ship, hullColor, detailColor);
    } else if (ship.type === 'cg_virginia') {
      this.drawVirginiaCG(ship, hullColor, detailColor);
    } else if (ship.type === 'bb_iowa_mod') {
      this.drawIowaModernized(ship, hullColor, detailColor);
    } else if (ship.type === 'dd_spruance') {
      this.drawSpruanceDD(ship, hullColor, detailColor);
    } else if (ship.type === 'ddg_kidd') {
      this.drawKiddDDG(ship, hullColor, detailColor);
    } else if (ship.type === 'ffg_ohp') {
      this.drawPerryFFG(ship, hullColor, detailColor);
    } else if (ship.type === 'ssn_la') {
      this.drawLosAngelesSSN(ship, hullColor, detailColor);
    } else if (ship.type === 'lpd') {
      this.drawAustinLPD(ship, hullColor, detailColor);
    } else if (ship.type === 'lcac') {
      this.drawLCAC(ship, hullColor, detailColor);
    } else if (ship.type === 'cvhg_kiev') {
      this.drawKievCVHG(ship, hullColor, detailColor);
    } else if (ship.type === 'cgn_kirov') {
      this.drawKirovCGN(ship, hullColor, detailColor);
    } else if (ship.type === 'dd_sovremenny') {
      this.drawSovremennyDD(ship, hullColor, detailColor);
    } else if (ship.type === 'dd_udaloy') {
      this.drawUdaloyDD(ship, hullColor, detailColor);
    } else if (ship.type === 'ssgn_oscar') {
      this.drawOscarSSGN(ship, hullColor, detailColor);
    } else if (ship.type === 'ddg') {
      this.drawAdamsDDG(ship, hullColor, detailColor);
    } else if (ship.type === 'dd') {
      this.drawForrestShermanDD(ship, hullColor, detailColor);
    } else if (ship.type === 'ffg') {
      this.drawKnoxFFG(ship, hullColor, detailColor);
    } else if (ship.type === 'lph') {
      this.drawLPHIwoJima(ship, hullColor, detailColor);
    } else if (ship.type === 'lcm8') {
      this.drawLCM8(ship, hullColor, detailColor);
    } else if (ship.type === 'komar_ptg') {
      this.drawKomarPTG(ship, hullColor, detailColor);
    } else if (ship.type === 'kashin') {
      this.drawKashinDDG(ship, hullColor, detailColor);
    } else if (ship.type === 'riga') {
      this.drawRigaFFG(ship, hullColor, detailColor);
    } else if (ship.type === 'osa') {
      this.drawOsaPTG(ship, hullColor, detailColor);
    } else if (ship.type === 'foxtrot') {
      this.drawFoxtrotSS(ship, hullColor, detailColor);
    } else if (ship.type === 'battleship') {
      this.drawBattleship(ship, hullColor, detailColor);
    } else if (ship.type === 'cruiser') {
      this.drawCruiser(ship, hullColor, detailColor);
    } else if (ship.type === 'destroyer') {
      this.drawDestroyer(ship, hullColor, detailColor);
    } else if (ship.type === 'submarine') {
      this.drawSubmarine(ship, hullColor, detailColor);
    } else if (ship.type === 'lcvp') {
      this.drawLCVP(ship, hullColor, detailColor);
    } else if (ship.type === 'lst') {
      this.drawLST(ship, hullColor, detailColor);
    } else if (ship.type === 'lsm_r') {
      this.drawLSMR(ship, hullColor, detailColor);
    } else if (ship.type === 'cve') {
      this.drawCVE(ship, hullColor, detailColor);
    } else if (ship.type === 'chokai') {
      this.drawChokaiCA(ship, hullColor, detailColor);
    } else if (ship.type === 'kongo') {
      this.drawKongoBB(ship, hullColor, detailColor);
    } else if (ship.type === 'akizuki') {
      this.drawAkizukiDD(ship, hullColor, detailColor);
    } else if (ship.type === 'sverdlov') {
      this.drawSverdlovCL(ship, hullColor, detailColor);
    } else if (ship.type === 'kynda') {
      this.drawKyndaCG(ship, hullColor, detailColor);
    } else if (ship.type === 'petya') {
      this.drawPetyaFFG(ship, hullColor, detailColor);
    } else {
      this.drawCruiser(ship, hullColor, detailColor);
    }
  }

  // Universal Surface & Subsurface Ship Tactical Details (Breakwater, Spinning Radar Mast, Port/Starboard Nav Lights)
  private drawShipUniversalDetails(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;
    const isSub = this.isSubmarineShip(ship);

    if (isSub) {
      // Subtle periscope / sail feather ripple when submerged & moving
      if ((ship.isSubmerged ?? true) && ship.speed > 1.5) {
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l * 0.1, 0);
        ctx.lineTo(-l * 0.25, -4);
        ctx.moveTo(l * 0.1, 0);
        ctx.lineTo(-l * 0.25, 4);
        ctx.stroke();
      }
      return;
    }

    const isCarrier =
      ship.type === 'carrier' ||
      ship.type === 'cve' ||
      ship.type === 'cv63' ||
      ship.type === 'cvn' ||
      ship.type === 'cvhg_kiev' ||
      ship.type === 'lph';
    const isLandingCraft = ship.type === 'lcvp' || ship.type === 'lcm8' || ship.type === 'lcac';

    // 1. Bow Breakwater V-Shield & Subtle Deck Centerline on Surface Warships
    if (!isCarrier && !isLandingCraft) {
      ctx.strokeStyle = detailColor;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(l * 0.25, -w * 0.24);
      ctx.lineTo(l * 0.36, 0);
      ctx.lineTo(l * 0.25, w * 0.24);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 2. Animated Spinning Search Radar Bar atop Major Surface Combatants
    if (!isLandingCraft) {
      const radarX = isCarrier ? (ship.type === 'cvn' ? -l * 0.01 : l * 0.12) : -l * 0.02;
      const radarY = isCarrier ? (ship.type === 'cvn' || ship.type === 'cv63' ? w * 0.32 : -w * 0.48) : 0;
      const rAng = this.time * 3.4 + (ship.heading || 0);
      const barR = Math.max(3.8, Math.min(6.2, w * 0.26));
      ctx.strokeStyle = hullColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(radarX - Math.cos(rAng) * barR, radarY - Math.sin(rAng) * barR);
      ctx.lineTo(radarX + Math.cos(rAng) * barR, radarY + Math.sin(rAng) * barR);
      ctx.stroke();
    }

    // 3. International Port (Red) / Starboard (Green) / Stern Navigation Lights
    ctx.fillStyle = '#FF5252';
    ctx.fillRect(0, -w * 0.45, 2.2, 2.2);
    ctx.fillStyle = '#00E676';
    ctx.fillRect(0, w * 0.45 - 2.2, 2.2, 2.2);
    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(-l * 0.48, -1, 2, 2);
  }

  private drawShipStatus(ship: Ship, zoom: number = 0.65, isSelected: boolean = false) {
    const ctx = this.ctx;
    const isPlayer = ship.side === 'player';
    const isAllied = ship.side === 'allied';
    
    const maxWcs = ship.maxWeaponControlHealth || ship.maxHealth;
    const curWcs = ship.weaponControlHealth !== undefined ? ship.weaponControlHealth : ship.health;
    const wcsPct = Math.max(0, Math.min(1, curWcs / maxWcs));

    const maxHcs = ship.maxHullCrewHealth || ship.maxHealth;
    const curHcs = ship.hullCrewHealth !== undefined ? ship.hullCrewHealth : ship.health;
    const hcsPct = Math.max(0, Math.min(1, curHcs / maxHcs));

    // Strategic Zoom LOD: when zoomed far out, render a clean compact HP bar unless flagship/selected
    if (zoom < 0.34 && !ship.isFlagship && !isSelected) {
      const compactW = 48;
      const compactY = ship.pos.y - ship.width - 18;
      const compactX = ship.pos.x - compactW / 2;
      ctx.fillStyle = 'rgba(5, 14, 25, 0.85)';
      ctx.fillRect(compactX - 1, compactY - 1, compactW + 2, 7);
      ctx.fillStyle = hcsPct > 0.5 ? (isPlayer ? '#00E5FF' : isAllied ? '#00E676' : '#EF5350') : hcsPct > 0.25 ? '#FFCA28' : '#FF1744';
      ctx.fillRect(compactX, compactY, compactW * hcsPct, 5);
      return;
    }

    const barWidth = 60;
    const barHeight = 4;
    const barGap = 2.5;
    const plateWidth = barWidth + 34;
    const plateHeight = barHeight * 2 + barGap + 18;
    const yOffset = -ship.width - 26;

    // Tactical HUD backing plate for maximum readability against ocean/islands
    const plateX = ship.pos.x - plateWidth / 2;
    const plateY = ship.pos.y + yOffset - 12;

    ctx.fillStyle = 'rgba(5, 14, 25, 0.82)';
    ctx.strokeStyle = isPlayer ? 'rgba(66, 165, 245, 0.45)' : isAllied ? 'rgba(0, 230, 118, 0.55)' : 'rgba(239, 83, 80, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateWidth, plateHeight, 3);
    ctx.fill();
    ctx.stroke();

    // 1. Ship Identifier Name & Submarine Status
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isPlayer ? '#E0F7FA' : isAllied ? '#A7FFEB' : '#FFCDD2';
    ctx.fillText(ship.codeName || ship.name, ship.pos.x, ship.pos.y + yOffset - 1);

    if (this.isSubmarineShip(ship) && (ship.isSubmerged ?? true)) {
      ctx.font = 'bold 7.5px monospace';
      if (ship.side === 'enemy') {
        ctx.fillStyle = '#FFAB40';
        ctx.fillText('[聲吶接觸定位 · 艦砲免疫]', ship.pos.x, plateY - 4);
      } else if (ship.isSpottedByEnemy) {
        ctx.fillStyle = '#FF5252';
        ctx.fillText('[敵聲吶鎖定 · 位置暴露]', ship.pos.x, plateY - 4);
      } else {
        ctx.fillStyle = '#4DD0E1';
        ctx.fillText('[潛航隱蔽 · 聲吶靜默]', ship.pos.x, plateY - 4);
      }
    }

    const startX = ship.pos.x - barWidth / 2 + 6;
    const yWcs = ship.pos.y + yOffset + 3;
    const yHcs = yWcs + barHeight + barGap;

    // 2. Upper Bar: 武器指管系統 (Weapon Control System - WCS)
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFA726';
    ctx.fillText('WPN', startX - 3, yWcs + barHeight - 0.5);

    // WCS Bar Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(startX, yWcs, barWidth, barHeight);
    // WCS Fill
    ctx.fillStyle = wcsPct > 0.45 ? '#FFA726' : wcsPct > 0.18 ? '#FB8C00' : '#D32F2F';
    ctx.fillRect(startX, yWcs, barWidth * wcsPct, barHeight);
    ctx.strokeStyle = 'rgba(255, 183, 77, 0.6)';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(startX, yWcs, barWidth, barHeight);

    // 3. Lower Bar: 人員艦體狀態 (Hull & Crew State - HCS)
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00E5FF';
    ctx.fillText('HUL', startX - 3, yHcs + barHeight - 0.5);

    // HCS Bar Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(startX, yHcs, barWidth, barHeight);
    // HCS Fill
    ctx.fillStyle = hcsPct > 0.5 ? '#00E5FF' : hcsPct > 0.25 ? '#FFCA28' : '#FF1744';
    ctx.fillRect(startX, yHcs, barWidth * hcsPct, barHeight);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(startX, yHcs, barWidth, barHeight);
  }

  // Draw Specific Aircraft Models with Authentic Vector Silhouettes
  public drawAircraft(aircraftList: Aircraft[], camera: Camera, selectedUnitIds: string[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const plane of aircraftList) {
      if (plane.state === 'shot_down' && (plane.deathTimer || 0) <= 0) continue;

      const isSelected = selectedUnitIds.includes(plane.id);
      if (!isSelected && !this.isWorldCircleVisible(plane.pos.x, plane.pos.y, 180, camera)) {
        continue;
      }

      const isPlayer = plane.side === 'player';
      const cosH = Math.cos(plane.heading);
      const sinH = Math.sin(plane.heading);

      // ══════════════════════════════════════════════════════════
      // 1. 動態高度陰影 (Scale-accurate Altitude Ocean Drop Shadow)
      // ══════════════════════════════════════════════════════════
      if (plane.altitude > 0.08) {
        const altOffset = plane.altitude * 32;
        const shadowScale = 0.85 + plane.altitude * 0.25;
        const shadowAlpha = 0.34 * Math.min(1, plane.altitude * 1.6);
        const isHeloShadow =
          plane.model === 'ho3s1' ||
          plane.model === 'uh2' ||
          plane.model === 'uh1' ||
          plane.model === 'ah1' ||
          plane.model === 'sh2' ||
          plane.model === 'sh3f' ||
          plane.model === 'ch53' ||
          plane.model === 'ah64a' ||
          plane.model === 'ah1w' ||
          plane.model === 'ka27' ||
          plane.model === 'mi24';
        const isSweptWing =
          plane.model === 'f14a' ||
          plane.model === 'fa18a' ||
          plane.model === 'f15a' ||
          plane.model === 'f16a' ||
          plane.model === 'f111' ||
          plane.model === 'f4b' ||
          plane.model === 'f4j' ||
          plane.model === 'f4e' ||
          plane.model === 'b52' ||
          plane.model === 'tu22m3' ||
          plane.model === 'tu95' ||
          plane.model === 'mig29a' ||
          plane.model === 'su27' ||
          plane.model === 'mirage3' ||
          plane.model === 'mirage2000';
        const isHeavySpan = plane.role === 'level_bomber' || plane.model === 'tu95' || plane.model === 'e3a' || plane.model === 'c130';

        ctx.save();
        ctx.translate(plane.pos.x + altOffset * 0.72, plane.pos.y + altOffset * 0.72);
        ctx.rotate(plane.heading);
        ctx.scale(shadowScale, shadowScale);
        ctx.fillStyle = `rgba(3, 9, 18, ${shadowAlpha})`;

        if (isHeloShadow) {
          ctx.beginPath();
          ctx.ellipse(-2, 0, 14, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(3, 9, 18, ${shadowAlpha * 0.45})`;
          ctx.fill();
        } else if (isSweptWing) {
          const spanMul = isHeavySpan ? 1.55 : 1.0;
          ctx.beginPath();
          ctx.ellipse(0, 0, 15 * spanMul, 3.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(6 * spanMul, 0);
          ctx.lineTo(-7 * spanMul, -18 * spanMul);
          ctx.lineTo(-12 * spanMul, -18 * spanMul);
          ctx.lineTo(-4 * spanMul, 0);
          ctx.lineTo(-12 * spanMul, 18 * spanMul);
          ctx.lineTo(-7 * spanMul, 18 * spanMul);
          ctx.closePath();
          ctx.fill();
        } else {
          const spanMul = isHeavySpan ? 1.5 : 1.0;
          ctx.beginPath();
          ctx.ellipse(0, 0, 11 * spanMul, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(1, 0, 4.2 * spanMul, 17 * spanMul, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(-9 * spanMul, 0, 2.5, 7 * spanMul, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════
      // 2. 高空翼尖水氣凝結尾跡 (Aerodynamic Wingtip Contrails)
      // ══════════════════════════════════════════════════════════
      if (plane.altitude > 0.65 || plane.speed > 130 || plane.state === 'diving' || plane.state === 'pullout') {
        const isPullout = plane.state === 'pullout' || plane.state === 'diving';
        const wingSpan = plane.role === 'level_bomber' ? 28 : 16;
        const trailLen = isPullout ? 55 + plane.speed * 0.35 : 35 + plane.speed * 0.2;
        const leftTipX = plane.pos.x - sinH * wingSpan;
        const leftTipY = plane.pos.y + cosH * wingSpan;
        const rightTipX = plane.pos.x + sinH * wingSpan;
        const rightTipY = plane.pos.y - cosH * wingSpan;

        ctx.strokeStyle = isPullout ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = isPullout ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.moveTo(leftTipX, leftTipY);
        ctx.lineTo(leftTipX - cosH * trailLen, leftTipY - sinH * trailLen);
        ctx.moveTo(rightTipX, rightTipY);
        ctx.lineTo(rightTipX - cosH * trailLen, rightTipY - sinH * trailLen);
        ctx.stroke();
      }

      // ══════════════════════════════════════════════════════════
      // 3. 戰損發動機燃燒黑煙與烈焰 (Battle Damage Engine Smoke & Fire)
      // ══════════════════════════════════════════════════════════
      if (plane.health < plane.maxHealth * 0.55 || plane.state === 'shot_down') {
        const isCritical = plane.health < plane.maxHealth * 0.25 || plane.state === 'shot_down';
        const puffCount = isCritical ? 4 : 2;

        for (let s = 0; s < puffCount; s++) {
          const puffProg = (this.time * 3 + s * 0.28) % 1;
          const puffR = 4 + puffProg * 16;
          const puffAlpha = (1 - puffProg) * 0.65;
          const driftX = plane.pos.x - cosH * (puffProg * 38) + (Math.sin(this.time * 6 + s) - 0.5) * 4;
          const driftY = plane.pos.y - sinH * (puffProg * 38) + (Math.cos(this.time * 6 + s) - 0.5) * 4;

          // Billowing charcoal black smoke
          ctx.fillStyle = `rgba(20, 26, 34, ${puffAlpha})`;
          ctx.beginPath();
          ctx.arc(driftX, driftY, puffR, 0, Math.PI * 2);
          ctx.fill();

          // Internal fire combustion flame
          if (isCritical && puffProg < 0.45) {
            const flameR = 2.5 + (1 - puffProg * 2) * 4.5;
            ctx.fillStyle = puffProg < 0.2 ? '#FFF59D' : '#FF6D00';
            ctx.beginPath();
            ctx.arc(driftX, driftY, flameR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ══════════════════════════════════════════════════════════
      // 4. 戰機本體向量繪製與多元墜毀模式 (Aircraft Vector & Crash Modes)
      // ══════════════════════════════════════════════════════════
      const isAllied = plane.side === 'allied';
      const color = isPlayer ? '#80D8FF' : isAllied ? '#00E676' : '#FF8A80';

      if (plane.state === 'shot_down') {
        const mode = plane.crashMode || 'smoke';
        ctx.save();
        ctx.translate(plane.pos.x, plane.pos.y);
        ctx.rotate(plane.heading);

        if (mode === 'spin') {
          // 螺旋失速自旋 (Flat Spin & Ocean Plunge): 快速自旋伴隨失速氣流環
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 16, 0, 0, Math.PI * 2);
          ctx.stroke();
          this.drawSpecificAircraftModel(plane, '#FF8A80');
        } else if (mode === 'breakup') {
          // 空中斷翼解體 (Structural Wing Disintegration): 單側主翼折斷，殘翼噴射火花
          ctx.save();
          ctx.beginPath();
          // 裁切斷右翼 (右翼打斷)
          ctx.rect(-30, -35, 60, 38);
          ctx.clip();
          this.drawSpecificAircraftModel(plane, '#FF5252');
          ctx.restore();

          // 斷翼斷裂處鋼構撕裂噴濺電弧與火花
          ctx.strokeStyle = '#FF3D00';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(2, 3);
          ctx.lineTo(5, 7);
          ctx.lineTo(1, 10);
          ctx.stroke();

          ctx.fillStyle = '#FFE082';
          ctx.beginPath();
          ctx.arc(3, 5, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === 'burn') {
          // 機翼發動機烈焰翻滾 (Wing Engine Blaze): 烈火包覆機身
          this.drawSpecificAircraftModel(plane, '#FF3D00');
          const firePulse = (Math.sin(this.time * 24) + 1) * 0.5;
          const fireGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14 + firePulse * 6);
          fireGrad.addColorStop(0, 'rgba(255, 245, 157, 0.9)');
          fireGrad.addColorStop(0.35, 'rgba(255, 109, 0, 0.7)');
          fireGrad.addColorStop(0.75, 'rgba(216, 27, 96, 0.4)');
          fireGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 14 + firePulse * 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 冒煙滑翔偏航 (Engine Failure & Yaw Glide)
          this.drawSpecificAircraftModel(plane, color);
        }

        ctx.restore();

        // 繪製脫離機身在空中翻滾旋轉的解體零件 (Tumbling Disintegrated Wing & Tail Debris)
        if (mode === 'breakup' && plane.crashDebris) {
          for (const deb of plane.crashDebris) {
            ctx.save();
            ctx.translate(deb.x, deb.y);
            ctx.rotate(deb.rot);
            ctx.strokeStyle = '#FF8A80';
            ctx.fillStyle = isPlayer ? '#0D2235' : '#2D1B1B';
            ctx.lineWidth = 1.4;

            if (deb.type === 'wing') {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(4, 15);
              ctx.lineTo(-4, 15);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // 斷翼末端拖曳淡淡黑煙
              ctx.fillStyle = 'rgba(25, 25, 25, 0.6)';
              ctx.beginPath();
              ctx.arc(-2, 8, 3, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // 機尾翼面
              ctx.beginPath();
              ctx.moveTo(-5, -6);
              ctx.lineTo(3, 0);
              ctx.lineTo(-5, 6);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      } else {
        ctx.save();
        ctx.translate(plane.pos.x, plane.pos.y);
        ctx.rotate(plane.heading);

        ctx.strokeStyle = color;
        ctx.fillStyle = '#06101E';
        ctx.lineWidth = 1.5;

        this.drawSpecificAircraftModel(plane, color);

        // Crisp Wingtip Navigation Strobes (Port Red / Starboard Green) on airborne aircraft
        if (plane.altitude > 0.15) {
          const tipSpan =
            plane.role === 'level_bomber' || plane.model === 'e3a' || plane.model === 'c130' || plane.model === 'tu95'
              ? 30
              : plane.model === 'e2c' || plane.model === 'a10a' || plane.model === 's3a'
              ? 24
              : 16;
          const tipX = -4;
          ctx.fillStyle = 'rgba(255, 82, 82, 0.85)';
          ctx.beginPath();
          ctx.arc(tipX, -tipSpan, 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0, 230, 118, 0.85)';
          ctx.beginPath();
          ctx.arc(tipX, tipSpan, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // ══════════════════════════════════════════════════════════
        // 現代噴射機尾焰與直升機旋翼動效 (Jet Flame & Helicopter Rotor)
        // ══════════════════════════════════════════════════════════
        const isJet =
          plane.model === 'f9f' ||
          plane.model === 'f2h' ||
          plane.model === 'f86' ||
          plane.model === 'mig15' ||
          plane.model === 'tu14' ||
          plane.model === 'f4b' ||
          plane.model === 'f4j' ||
          plane.model === 'f4e' ||
          plane.model === 'f8' ||
          plane.model === 'a4' ||
          plane.model === 'a6a' ||
          plane.model === 'a6b_weasel' ||
          plane.model === 'b52' ||
          plane.model === 'f105' ||
          plane.model === 'a7' ||
          plane.model === 'mig21' ||
          plane.model === 'mig19' ||
          plane.model === 'mig17' ||
          plane.model === 'su7' ||
          plane.model === 'il28' ||
          plane.model === 'tu16' ||
          // Era 5 Jets (時代五全噴射戰機)
          plane.model === 'f14a' ||
          plane.model === 'fa18a' ||
          plane.model === 'f15a' ||
          plane.model === 'f16a' ||
          plane.model === 'a10a' ||
          plane.model === 'a6e' ||
          plane.model === 'ea6b' ||
          plane.model === 'av8b' ||
          plane.model === 's3a' ||
          plane.model === 'e3a' ||
          plane.model === 'f111' ||
          plane.model === 'tu22m3' ||
          plane.model === 'yak38' ||
          plane.model === 'mig29a' ||
          plane.model === 'su27' ||
          plane.model === 'a50' ||
          plane.model === 'su25' ||
          // Expanded Player & Allied Jets (時代三/四/五盟軍與美軍噴射機)
          plane.model === 'meteor' ||
          plane.model === 'a37b' ||
          plane.model === 'f5a' ||
          plane.model === 'f104g' ||
          plane.model === 'mirage3' ||
          plane.model === 'hunter_fga9' ||
          plane.model === 'tornado_gr1' ||
          plane.model === 'tornado_ids' ||
          plane.model === 'tornado_adv' ||
          plane.model === 'mirage2000' ||
          plane.model === 'jaguar_gr1' ||
          plane.model === 'viggen_ja37';

        if (isJet && plane.state !== 'landing') {
          const flamePulse = (Math.sin(this.time * 30 + (plane.id.charCodeAt(0) || 0)) + 1) * 0.5;
          const flameLen = 12 + flamePulse * 10;
          const isTwinExhaust =
            plane.model === 'f4b' ||
            plane.model === 'f4j' ||
            plane.model === 'f4e' ||
            plane.model === 'a6a' ||
            plane.model === 'a6b_weasel' ||
            plane.model === 'f2h' ||
            plane.model === 'tu14' ||
            plane.model === 'il28' ||
            // Era 5 Twin Jets:
            plane.model === 'f14a' ||
            plane.model === 'fa18a' ||
            plane.model === 'f15a' ||
            plane.model === 's3a' ||
            plane.model === 'a6e' ||
            plane.model === 'ea6b' ||
            plane.model === 'f111' ||
            plane.model === 'tu22m3' ||
            plane.model === 'mig29a' ||
            plane.model === 'su27' ||
            plane.model === 'su25' ||
            plane.model === 'tornado_gr1' ||
            plane.model === 'tornado_ids' ||
            plane.model === 'tornado_adv' ||
            plane.model === 'jaguar_gr1' ||
            plane.model === 'a37b';
          const exhaustX = -16;

          if (isTwinExhaust) {
            for (const ey of [-2.5, 2.5]) {
              const flameGrad = ctx.createLinearGradient(exhaustX, ey, exhaustX - flameLen, ey);
              flameGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
              flameGrad.addColorStop(0.2, 'rgba(255, 171, 64, 0.9)');
              flameGrad.addColorStop(0.5, 'rgba(255, 87, 34, 0.6)');
              flameGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
              ctx.fillStyle = flameGrad;
              ctx.beginPath();
              ctx.moveTo(exhaustX, ey - 2);
              ctx.lineTo(exhaustX - flameLen, ey);
              ctx.lineTo(exhaustX, ey + 2);
              ctx.closePath();
              ctx.fill();
            }
          } else if (plane.model === 'b52') {
            for (const podY of [-16, -9, 9, 16]) {
              const flameGrad = ctx.createLinearGradient(0, podY, -10, podY);
              flameGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
              flameGrad.addColorStop(0.4, 'rgba(255, 152, 0, 0.6)');
              flameGrad.addColorStop(1, 'rgba(244, 67, 54, 0)');
              ctx.fillStyle = flameGrad;
              ctx.beginPath();
              ctx.moveTo(-1, podY - 1.5);
              ctx.lineTo(-10, podY);
              ctx.lineTo(-1, podY + 1.5);
              ctx.closePath();
              ctx.fill();
            }
          } else {
            const flameGrad = ctx.createLinearGradient(exhaustX, 0, exhaustX - flameLen, 0);
            flameGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            flameGrad.addColorStop(0.25, 'rgba(0, 229, 255, 0.85)');
            flameGrad.addColorStop(0.7, 'rgba(41, 121, 255, 0.45)');
            flameGrad.addColorStop(1, 'rgba(41, 121, 255, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(exhaustX, -2.5);
            ctx.lineTo(exhaustX - flameLen, 0);
            ctx.lineTo(exhaustX, 2.5);
            ctx.closePath();
            ctx.fill();
          }
        }

        // ══════════════════════════════════════════════════════════
        // 蘇聯/北越「一擊脫離 (Hit & Run)」超音速掠殺與馬赫震波動效
        // ══════════════════════════════════════════════════════════
        if (plane.isHitAndRunActive) {
          const abLen = 32 + (Math.sin(this.time * 40) + 1) * 8;
          const abGrad = ctx.createLinearGradient(-16, 0, -16 - abLen, 0);
          abGrad.addColorStop(0, '#FFFFFF');
          abGrad.addColorStop(0.25, '#00E5FF');
          abGrad.addColorStop(0.65, '#2979FF');
          abGrad.addColorStop(1, 'rgba(41, 121, 255, 0)');
          ctx.fillStyle = abGrad;
          ctx.beginPath();
          ctx.moveTo(-16, -3.5);
          ctx.lineTo(-16 - abLen, 0);
          ctx.lineTo(-16, 3.5);
          ctx.closePath();
          ctx.fill();

          // Mach shock diamonds
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.2;
          for (let d = 1; d <= 3; d++) {
            const dx = -16 - d * 7;
            ctx.beginPath();
            ctx.moveTo(dx, -2.5);
            ctx.lineTo(dx - 3.5, 0);
            ctx.lineTo(dx, 2.5);
            ctx.lineTo(dx + 3.5, 0);
            ctx.closePath();
            ctx.stroke();
          }

          // Tactical HUD label
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#00E5FF';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ MACH 1.8+ BUG-OUT', 0, -18);
        }

        const isHelo =
          plane.model === 'ho3s1' ||
          plane.model === 'uh2' ||
          plane.model === 'uh1' ||
          plane.model === 'ah1' ||
          plane.model === 'sh2' ||
          plane.model === 'sh3f' ||
          plane.model === 'ch53' ||
          plane.model === 'ah64a' ||
          plane.model === 'ah1w' ||
          plane.model === 'ka27' ||
          plane.model === 'mi24';
        if (isHelo) {
          const rotorAngle = this.time * 42;
          const rRadius = plane.model === 'ah1' || plane.model === 'ah1w' ? 18 : plane.model === 'ch53' ? 28 : plane.model === 'ka27' ? 21 : 22;
          ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, rRadius, 0, Math.PI * 2);
          ctx.stroke();

          if (plane.model === 'ka27') {
            // ════ Ka-27 Helix: Soviet Coaxial Contra-Rotating Dual Rotors (NO TAIL ROTOR) ════
            // Upper rotor spinning clockwise, lower rotor spinning counter-clockwise
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            for (let b = 0; b < 3; b++) {
              const radUpper = rotorAngle + (b * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(radUpper) * rRadius, Math.sin(radUpper) * rRadius);
              ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(179, 229, 252, 0.85)';
            ctx.lineWidth = 1.8;
            for (let b = 0; b < 3; b++) {
              const radLower = -rotorAngle + (b * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(radLower) * (rRadius * 0.95), Math.sin(radLower) * (rRadius * 0.95));
              ctx.stroke();
            }
            // Mast hub
            ctx.fillStyle = '#CFD8DC';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            // Note: Ka-27 has NO tail rotor because contra-rotating torque cancels out!
          } else {
            // Main rotor blade counts: CH-53 (6 blades), Mi-24 / SH-3F (5 blades), AH-64A / UH-2 / SH-2 (4 blades), HO3S-1 (3 blades), AH-1 / AH-1W / UH-1 (2 blades)
            const blades =
              plane.model === 'ch53'
                ? 6
                : plane.model === 'mi24' || plane.model === 'sh3f'
                ? 5
                : plane.model === 'ah64a' || plane.model === 'sh2' || plane.model === 'uh2'
                ? 4
                : plane.model === 'ho3s1'
                ? 3
                : 2;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 2;
            for (let b = 0; b < blades; b++) {
              const rad = rotorAngle + (b * Math.PI * 2) / blades;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(rad) * rRadius, Math.sin(rad) * rRadius);
              ctx.stroke();
            }

            // Tail rotor
            const tailDistance = plane.model === 'ch53' ? -22 : plane.model === 'mi24' ? -19 : -16;
            ctx.strokeStyle = '#FFD54F';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(tailDistance, 2, 4.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // ══════════════════════════════════════════════════════════
        // 5. 雙方二戰史實敵我識別特徵 (Historical Combat IFF Markings - No Civilian Nav Lights)
        // ══════════════════════════════════════════════════════════
        if (!isPlayer) {
          const isWw2Japanese =
            plane.model === 'zero' ||
            plane.model === 'zero_a6m2' ||
            plane.model === 'zero_a6m5' ||
            plane.model === 'kamikaze_zero' ||
            plane.model === 'ki61' ||
            plane.model === 'george' ||
            plane.model === 'val' ||
            plane.model === 'judy' ||
            plane.model === 'kamikaze_judy' ||
            plane.model === 'kate' ||
            plane.model === 'jill' ||
            plane.model === 'g4m' ||
            plane.model === 'ohka';

          if (isWw2Japanese) {
            // 日軍特徵: 主翼前緣黃色敵我識別帶 (Yellow Leading Edge Band) + 胴體識別標帶
            const m = plane.model;
            const span = m === 'g4m' ? 32 : (m === 'kate' || m === 'jill' || m === 'val' || m === 'judy') ? 17 : 14;
            this.drawJapaneseIFFLeadingEdge(span, 3.5, 3.5);

            // 機尾識別白胴帶 (Hachimaki identification stripe across fuselage)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-6, -2.5, 2.5, 5);
          } else {
            // 冷戰/現代蘇軍與華約戰機: 機尾紅星識別與紅星翼徽 (Red Star OPFOR Combat Markings)
            ctx.fillStyle = '#D50000';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(-11, 0, 2.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // 美軍海航 vs 陸航識別特徵
          const isArmy =
            plane.model === 'b17' ||
            plane.model === 'b24' ||
            plane.model === 'b29' ||
            plane.model === 'p40' ||
            plane.model === 'p38' ||
            plane.model === 'p51' ||
            plane.model === 'p47' ||
            plane.model === 'f86' ||
            plane.model === 'a20' ||
            plane.model === 'a26';

          if (isArmy) {
            // 陸航 (USAAF) 特徵: 垂直尾翼黃色編號標帶 / 翼尖識別帶
            ctx.strokeStyle = '#FFD54F';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-14, -1.8);
            ctx.lineTo(-14, 1.8);
            ctx.stroke();
          } else {
            // 海航 (US Navy) 特徵: 機尾白色幾何空母識別隊徽 (Carrier Air Group Triangle)
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-11, -3);
            ctx.lineTo(-7, 0);
            ctx.lineTo(-11, 3);
            ctx.closePath();
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // Tactical Overhead Warning Banners for Special Kamikaze & Rocket Threats
      if (!isPlayer && plane.state !== 'shot_down') {
        if (plane.model === 'ohka') {
          ctx.fillStyle = '#FF1744';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🚨【櫻花火箭反艦飛彈 OHKA】', plane.pos.x, plane.pos.y - 18);
        } else if (plane.model === 'g4m' && plane.hasOhkaAttached) {
          ctx.fillStyle = '#FF9100';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️【一式陸攻 (載彈: 櫻花特攻火箭)】', plane.pos.x, plane.pos.y - 22);
        } else if (plane.isKamikaze || plane.state === 'kamikaze_dive' || plane.model === 'kamikaze_zero' || plane.model === 'kamikaze_judy') {
          ctx.fillStyle = '#FF5252';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️【神風特攻機 KAMIKAZE】', plane.pos.x, plane.pos.y - 18);
        }
      }

      // ══════════════════════════════════════════════════════════
      // 6. RTS 戰術線條、時間刻度與 NATO 軍事圖例 (Tactical Vectors & NATO APP-6)
      // ══════════════════════════════════════════════════════════
      if (isSelected && plane.state !== 'shot_down') {
        this.drawUnitSelectionRing(plane.pos, 20);

        // 6a. 航向向量線與 30s / 60s 預測時間刻度 (Heading Vector & Time Ticks)
        const vecLen = Math.max(90, plane.speed * 1.5);
        const tick30 = { x: plane.pos.x + cosH * (vecLen * 0.5), y: plane.pos.y + sinH * (vecLen * 0.5) };
        const tick60 = { x: plane.pos.x + cosH * vecLen, y: plane.pos.y + sinH * vecLen };

        ctx.strokeStyle = 'rgba(0, 230, 118, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(plane.pos.x, plane.pos.y);
        ctx.lineTo(tick60.x, tick60.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 30s Tick
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tick30.x - sinH * 5, tick30.y + cosH * 5);
        ctx.lineTo(tick30.x + sinH * 5, tick30.y - cosH * 5);
        ctx.stroke();

        // 60s Tick with Arrowhead
        ctx.beginPath();
        ctx.moveTo(tick60.x - sinH * 6, tick60.y + cosH * 6);
        ctx.lineTo(tick60.x + sinH * 6, tick60.y - cosH * 6);
        ctx.stroke();

        ctx.fillStyle = '#00E676';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('30s', tick30.x + 7, tick30.y + 3);
        ctx.fillText('60s', tick60.x + 7, tick60.y + 3);

        // 6b. 攻擊目標鎖定線 (Attack Engagement Vector)
        if (plane.order.type === 'attack' && plane.order.targetPos) {
          ctx.strokeStyle = 'rgba(255, 82, 82, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(plane.pos.x, plane.pos.y);
          ctx.lineTo(plane.order.targetPos.x, plane.order.targetPos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Target reticle crosshair
          const tx = plane.order.targetPos.x;
          const ty = plane.order.targetPos.y;
          ctx.strokeStyle = '#FF5252';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tx - 7, ty - 7, 14, 14);
          ctx.beginPath();
          ctx.moveTo(tx - 11, ty);
          ctx.lineTo(tx + 11, ty);
          ctx.moveTo(tx, ty - 11);
          ctx.lineTo(tx, ty + 11);
          ctx.stroke();
        }

        // 6b2. CAP 戰鬥空巡盤旋軌道線 (Combat Air Patrol Orbit Visualizer)
        if (plane.order.type === 'patrol' && plane.order.patrolOrigin) {
          const po = plane.order.patrolOrigin;
          const orbitR = 250;
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(po.x, po.y, orbitR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center anchor & slow rotating radar sweep
          ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(po.x, po.y, 4, 0, Math.PI * 2);
          ctx.fill();

          const sweepAngle = (this.time * 1.5) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(po.x, po.y);
          ctx.lineTo(po.x + Math.cos(sweepAngle) * orbitR, po.y + Math.sin(sweepAngle) * orbitR);
          ctx.stroke();

          // Flight path connecting line
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(plane.pos.x, plane.pos.y);
          ctx.lineTo(po.x, po.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Radar perimeter tag
          ctx.fillStyle = '#80DEEA';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🛡️ CAP 空中戰鬥巡邏區 (R: 250m)`, po.x, po.y - orbitR - 7);
        }

        // 6c. NATO APP-6 航空軍事圖例 (Military Aviation Symbol Tag)
        const frameW = 34;
        const frameH = 17;
        const tagY = plane.pos.y - 28;
        const isPl = isPlayer;
        const isAl = plane.side === 'allied';
        ctx.strokeStyle = isPl ? '#42A5F5' : isAl ? '#00E676' : '#FF5252';
        ctx.fillStyle = isPl ? 'rgba(13, 71, 161, 0.75)' : isAl ? 'rgba(27, 94, 32, 0.75)' : 'rgba(183, 28, 28, 0.75)';
        ctx.lineWidth = 1.6;

        if (!isPl && !isAl) {
          // NATO APP-6 敵軍菱形邊框 (Hostile Diamond Frame)
          ctx.beginPath();
          ctx.moveTo(plane.pos.x, tagY);
          ctx.lineTo(plane.pos.x + frameW * 0.55, tagY + frameH / 2);
          ctx.lineTo(plane.pos.x, tagY + frameH);
          ctx.lineTo(plane.pos.x - frameW * 0.55, tagY + frameH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // NATO APP-6 友軍長方形邊框 (Friendly Rectangle Frame - Blue for US, Green for Allied)
          ctx.fillRect(plane.pos.x - frameW / 2, tagY, frameW, frameH);
          ctx.strokeRect(plane.pos.x - frameW / 2, tagY, frameW, frameH);
        }

        // Aviation Role Symbol: Rotary-wing vs Fixed-wing
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        const isRotary =
          plane.model === 'ho3s1' ||
          plane.model === 'uh2' ||
          plane.model === 'uh1' ||
          plane.model === 'ah1' ||
          plane.model === 'sh2' ||
          plane.model === 'sh3f' ||
          plane.model === 'ch53' ||
          plane.model === 'ah64a' ||
          plane.model === 'ah1w' ||
          plane.model === 'ka27' ||
          plane.model === 'mi24';

        if (isRotary) {
          // 旋翼機/直升機 (Rotary-wing / Helicopter): 旋翼十字節點 (Rotor Hub with Blades)
          const cy = tagY + frameH * 0.5;
          ctx.beginPath();
          ctx.moveTo(plane.pos.x - 7.5, cy - 3.5);
          ctx.lineTo(plane.pos.x + 7.5, cy + 3.5);
          ctx.moveTo(plane.pos.x - 7.5, cy + 3.5);
          ctx.lineTo(plane.pos.x + 7.5, cy - 3.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(plane.pos.x, cy, 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // 定翼機 (Fixed-wing Aircraft): 雙弧形海鷗飛翼 (Double Arched Wings)
          ctx.beginPath();
          ctx.moveTo(plane.pos.x - 11, tagY + frameH * 0.5);
          ctx.quadraticCurveTo(plane.pos.x - 5, tagY + frameH * 0.2, plane.pos.x, tagY + frameH * 0.5);
          ctx.quadraticCurveTo(plane.pos.x + 5, tagY + frameH * 0.2, plane.pos.x + 11, tagY + frameH * 0.5);
          ctx.stroke();
        }

        // Altitude & Speed Label (e.g. "FL08 · 140KT")
        const fl = Math.round(plane.altitude * 10);
        const spd = Math.round(plane.speed);
        ctx.fillStyle = '#E0F7FA';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FL0${fl} · ${spd}KT`, plane.pos.x, tagY + frameH + 9);

        // Plane Model and individual flight callsign
        ctx.fillStyle = '#00E676';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(plane.name, plane.pos.x, tagY - 4);

        // Machine gun & payload ammo indicator over selected plane
        if (plane.gunAmmo !== undefined) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#FFE082';
          const ammoLabel =
            plane.hasPayload && plane.ammoRemaining
              ? `[${plane.payloadName || 'ORD'}] · MG: ${plane.gunAmmo}`
              : `MG: ${plane.gunAmmo} 發`;
          ctx.fillText(ammoLabel, plane.pos.x, tagY - 14);
        }
      }

      // 6d. 飛彈威脅對策規避戰術指示 (Threat-Matched Evasion HUD Badges: Notching & Breaking)
      if (plane.isEvading && plane.evasionTactic && plane.state !== 'shot_down') {
        ctx.save();
        const pulse = (Math.sin(this.time * 20) + 1) * 0.5;
        const bY = plane.pos.y - 30;
        if (plane.evasionTactic === 'notching') {
          // Cyan Notching Badge: 90° Beam Aspect to defeat radar
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#00E5FF';
          ctx.textAlign = 'center';
          ctx.fillText(`📡 NOTCHING 90° [都卜勒盲區]`, plane.pos.x, bY);

          // Perpendicular Beam Aspect Guide
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.45 + pulse * 0.4})`;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(plane.pos.x - Math.cos(plane.heading) * 32, plane.pos.y - Math.sin(plane.heading) * 32);
          ctx.lineTo(plane.pos.x + Math.cos(plane.heading) * 32, plane.pos.y + Math.sin(plane.heading) * 32);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (plane.evasionTactic === 'breaking') {
          // Orange/Amber Breaking Badge: High-G Hard Slice + Flares
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#FF9100';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ HIGH-G BREAK [大G破轉]`, plane.pos.x, bY);

          // High-G turn vortex arc
          ctx.strokeStyle = `rgba(255, 145, 0, ${0.4 + pulse * 0.5})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(plane.pos.x, plane.pos.y, 22, plane.heading - 1.2, plane.heading + 1.2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. AIM-7 Semi-Active Radar Homing (SARH) Nose Pencil Illumination Beam
      if (plane.sarhIlluminatingTargetId && (plane.sarhHoldTimer || 0) > 0) {
        const targetPlane = aircraftList.find((a: Aircraft) => a.id === plane.sarhIlluminatingTargetId && a.state !== 'shot_down');
        if (targetPlane) {
          const tPos = targetPlane.pos;
          const beamPulse = (Math.sin(this.time * 25) + 1) * 0.5;

          // Outer radar illumination cone
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 + beamPulse * 0.15})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(plane.pos.x, plane.pos.y);
          ctx.lineTo(tPos.x, tPos.y);
          ctx.stroke();

          // High-frequency CW radar illumination core beam
          ctx.strokeStyle = `rgba(128, 222, 234, ${0.6 + beamPulse * 0.4})`;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([6, 3]);
          ctx.beginPath();
          ctx.moveTo(plane.pos.x, plane.pos.y);
          ctx.lineTo(tPos.x, tPos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Radar lock target reticle
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(tPos.x, tPos.y, 14 + beamPulse * 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#00E5FF';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('📡 SARH 雷達照射鎖定 (AIM-7)', tPos.x, tPos.y - 18);
        }
      }
    }

    ctx.restore();
  }

  // Authentic US WWII National Insignia (Star & Bars)
  // US Navy: Glossy Sea Blue roundel + White Star + White side bars with blue outline
  // USAAF: Same Star & Bars with crisp outline
  private drawUSInsignia(x: number, y: number, r: number, isArmyAirForce: boolean = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // 1943+ Star & Bars: White rectangular side bars
    const barW = r * 1.5;
    const barH = r * 0.56;
    ctx.fillStyle = '#081C30';
    ctx.fillRect(-barW - 0.8, -barH / 2 - 0.8, (barW + 0.8) * 2, barH + 1.6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-barW, -barH / 2, barW * 2, barH);

    // Blue disc
    ctx.fillStyle = isArmyAirForce ? '#1E3A5F' : '#0B2545';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // White 5-pointed Star
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const sx = Math.cos(angle) * (r * 0.88);
      const sy = Math.sin(angle) * (r * 0.88);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Japanese IJN/IJA Red Sun (Hinomaru) Roundel with Authentic White Outer Border (Fukurin)
  private drawHinomaru(x: number, y: number, r: number, withWhiteBorder: boolean = true) {
    const ctx = this.ctx;
    ctx.save();
    if (withWhiteBorder) {
      // White border ring (白覆輪)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, r + 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crimson red sun (日之丸)
    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Japanese Yellow Wing Leading Edge Identification Band (主翼前緣黃色敵我識別帶)
  // Essential historical IFF stripe from wing root to mid-span on both wings
  private drawJapaneseIFFLeadingEdge(wingSpan: number, rootX: number, tipX: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 2.4;

    // Port (left) wing leading edge band
    ctx.beginPath();
    ctx.moveTo(rootX, -3.5);
    ctx.lineTo(tipX, -wingSpan * 0.72);
    ctx.stroke();

    // Starboard (right) wing leading edge band
    ctx.beginPath();
    ctx.moveTo(rootX, 3.5);
    ctx.lineTo(tipX, wingSpan * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  // British Royal Air Force / Fleet Air Arm Cockade Roundel (Type B / C1 Roundel)
  private drawRAFRoundel(x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();
    // Outer Blue ring
    ctx.fillStyle = '#0D47A1';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Middle White ring
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
    // Center Red dot
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Republic of Korea Air Force (ROKAF) Taegeuk Insignia
  private drawROKAFRoundel(x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    // Outer white wing bar
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-r * 1.4, -r * 0.45, r * 2.8, r * 0.9);
    // Taegeuk circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#D32F2F';
    ctx.fill();
    // Blue half
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.fillStyle = '#1976D2';
    ctx.fill();
    ctx.restore();
  }

  // Draw Specific WWII Vector Aircraft Model with Authentic Profiles
  private drawSpecificAircraftModel(plane: Aircraft, color: string) {
    const ctx = this.ctx;
    const m = plane.model;
    const isPlayer = plane.side === 'player';

    if (m === 'f4u') {
      // ════ F4U Corsair: Inverted Gull Wing ("Bent-Wing Bird") ════
      // Barrel fuselage & Pratt & Whitney R-2800 radial cowling
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Distinctive inverted gull wings: crank down from roots, then extend flat
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      // Port wing
      ctx.moveTo(3, 0);
      ctx.lineTo(1, -6);
      ctx.lineTo(4, -17);
      ctx.lineTo(-2, -17);
      ctx.lineTo(-3, -6);
      ctx.lineTo(-1, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      // Starboard wing
      ctx.moveTo(3, 0);
      ctx.lineTo(1, 6);
      ctx.lineTo(4, 17);
      ctx.lineTo(-2, 17);
      ctx.lineTo(-3, 6);
      ctx.lineTo(-1, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Horizontal Stabilizer / Tailplane
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(-10, -7);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-10, 7);
      ctx.stroke();

      // Cockpit bubble set far aft on long nose
      ctx.fillStyle = 'rgba(128, 222, 234, 0.4)';
      ctx.fillRect(-2, -1.8, 5, 3.6);
      ctx.strokeRect(-2, -1.8, 5, 3.6);

      // US Star insignia on left wing
      if (isPlayer) this.drawUSInsignia(1, -11, 3.5);

      // 4-Blade Propeller Blur with Yellow Tips
      const propA = this.time * 28;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(15, 0, 7.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFD54F';
      for (let b = 0; b < 4; b++) {
        const a = propA + (b * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(15 + Math.cos(a) * 6.5, Math.sin(a) * 6.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (m === 'f8f') {
      // ════ F8F Bearcat: Compact, Stubby Late-War Interceptor ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 10.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Clipped square wings
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(2, -13);
      ctx.lineTo(4, -13);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 13);
      ctx.lineTo(2, 13);
      ctx.lineTo(-3, 13);
      ctx.lineTo(-3, -13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Teardrop bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
      ctx.beginPath();
      ctx.ellipse(1, 0, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -8, 3);
    } else if (m === 'f4f') {
      // ════ F4F Wildcat: Classic Barrel Fuselage & Grumman Ironworks ════
      ctx.fillStyle = '#061322';
      // Chubby barrel fuselage
      ctx.beginPath();
      ctx.ellipse(1, 0, 11.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Square-tipped wings with yellow wingtips
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wingtip yellow recognition strips
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(-3, -15);
      ctx.moveTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.stroke();

      // Greenhouse canopy frames + glass glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
      ctx.fillRect(-1, -2, 5, 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(-1, -2, 5, 4);

      if (isPlayer) this.drawUSInsignia(0, -9, 3.2);
    } else if (m === 'f6f') {
      // ════ F6F Hellcat: Rugged Broad-Shouldered Fleet Fighter ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad wings with 6 machine guns
      ctx.fillStyle = '#0A1E33';
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(5, -16);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 6 gun ports on wing leading edge
      ctx.fillStyle = '#FFD54F';
      for (let g = -3; g <= 3; g++) {
        if (g === 0) continue;
        const gy = g * 3.5;
        ctx.fillRect(4, gy - 0.5, 2, 1);
      }

      // Cockpit canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(0, -1.7, 5.2, 3.4);

      if (isPlayer) this.drawUSInsignia(1, -10, 3.5);
    } else if (m === 'sbd' || m === 'sb2c') {
      // ════ SBD Dauntless / SB2C Helldiver: Dive Bombers ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 13, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad tapered dive-bombing wings
      ctx.fillStyle = '#0A1E33';
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(5, -16);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-4, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Famous Perforated Split Dive-Flap Dots ("Swiss-Cheese Flaps")
      const isDiving = plane.state === 'diving';
      if (isDiving) {
        // Extended red perforated dive brakes deployed top and bottom
        ctx.fillStyle = '#D50000';
        ctx.fillRect(-6.5, -14, 2.5, 28);
        ctx.fillStyle = '#FFFFFF';
        for (let d = -4; d <= 4; d++) {
          if (d === 0) continue;
          ctx.beginPath();
          ctx.arc(-5.2, d * 3.2, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#FF5252';
        for (let d = -4; d <= 4; d++) {
          if (d === 0) continue;
          const dy = d * 3.2;
          ctx.beginPath();
          ctx.arc(-2.5, dy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Greenhouse pilot canopy + rear twin .30 gunner station
      ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
      ctx.fillRect(0, -2, 6, 4);
      ctx.fillRect(-5, -1.8, 3, 3.6);
      ctx.strokeStyle = color;
      ctx.strokeRect(0, -2, 6, 4);
      ctx.strokeRect(-5, -1.8, 3, 3.6);
      // Twin rear swivel gun
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-8, 0);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(1, -11, 3.5);
    } else if (m === 'tbd' || m === 'tbf') {
      // ════ TBD Devastator / TBF Avenger: Torpedo & Heavy Bombers ════
      ctx.fillStyle = '#061322';
      // Bulky deep fuselage with internal belly bay
      ctx.beginPath();
      ctx.ellipse(1, 0, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad wingspan with thick dihedral
      ctx.fillStyle = '#0A1E33';
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(4, -18);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 18);
      ctx.lineTo(2, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pilot cockpit greenhouse + Dorsal Power Ball Turret Dome
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(2, -1.7, 5, 3.4);
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // .50 cal machine gun barrel protruding from ball turret
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-7, 0);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -12, 3.8);
    } else if (m === 'os2u') {
      // ════ OS2U Kingfisher: Scout Floatplane with Pontoon Catamaran ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 12, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High monoplane wings
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tandem greenhouse canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
      ctx.fillRect(-1, -1.6, 5.5, 3.2);

      // Massive Central Catamaran Float Pontoon
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-9, 0);
      ctx.stroke();

      // Steel Strut Diagonal Bracing between float and fuselage
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -2.5);
      ctx.moveTo(10, 0);
      ctx.lineTo(4, 2.5);
      ctx.moveTo(-4, 0);
      ctx.lineTo(-2, -2.5);
      ctx.moveTo(-4, 0);
      ctx.lineTo(-2, 2.5);
      ctx.stroke();

      // Wingtip outrigger stabilizer floats
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(0, -16.5, 4.5, 2);
      ctx.strokeRect(0, 14.5, 4.5, 2);

      if (isPlayer) this.drawUSInsignia(0, -10, 3);
    } else if (m === 'sc1') {
      // ════ SC-1 Seahawk: Late-War High-Speed Scout Floatplane ════
      ctx.fillStyle = '#061322';
      // Aerodynamic laminar fuselage with Wright R-1820 Cyclone radial engine
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Clean low-wing cantilever layout with dihedral tips
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(5, -17);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-3, 17);
      ctx.lineTo(-3, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing-mounted 20mm M2 autocannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(3, -7);
      ctx.lineTo(9, -7);
      ctx.moveTo(3, 7);
      ctx.lineTo(9, 7);
      ctx.stroke();

      // Streamlined Pedestal Centerline Float with internal bomb bay
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-10, 0);
      ctx.stroke();

      // Pedestal pylon strut
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(4, 0);
      ctx.moveTo(-2, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();

      // Wingtip Outrigger Stabilizing Floats
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(1, -17.5, 4.2, 2.2);
      ctx.strokeRect(1, 15.3, 4.2, 2.2);

      // Bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.45)';
      ctx.fillRect(-1, -1.8, 5, 3.6);
      ctx.strokeRect(-1, -1.8, 5, 3.6);

      // 4-blade prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(15, 0, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -11, 3.4);
    } else if (m === 'b17') {
      // ════ B-17 Flying Fortress: 4-Engine Heavy Horizontal Bomber ════
      ctx.fillStyle = '#071626';
      // Heavy bomber fuselage with dorsal spine
      ctx.beginPath();
      ctx.ellipse(3, 0, 22, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High-lift broad cantilever wing (Wingspan 52)
      ctx.fillStyle = '#0D2134';
      ctx.beginPath();
      ctx.moveTo(5, -26);
      ctx.lineTo(8, -26);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 26);
      ctx.lineTo(5, 26);
      ctx.lineTo(-4, 26);
      ctx.lineTo(-4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4x Wright R-1820 Cyclone Radial Engine Nacelles
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.4;
      for (const ey of [-19, -11, 11, 19]) {
        ctx.strokeRect(3, ey - 2.4, 8, 4.8);
        // Spinning prop
        ctx.beginPath();
        ctx.arc(11, ey, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Iconic tall dorsal fin tail and horizontal stabilizer
      ctx.beginPath();
      ctx.moveTo(-16, -11);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-16, 11);
      ctx.lineTo(-21, 11);
      ctx.lineTo(-21, -11);
      ctx.closePath();
      ctx.stroke();

      // Cockpit greenhouse and top turret
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(8, -2.2, 5, 4.4);
      ctx.beginPath();
      ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (isPlayer) this.drawUSInsignia(1, -16, 4.2);
    } else if (m === 'b24') {
      // ════ B-24 Liberator / B-29 Superfortress: Heavy Level Bomber with Twin Oval Tailfins ════
      ctx.fillStyle = '#071626';
      // Deep slab-sided fuselage
      ctx.beginPath();
      ctx.ellipse(4, 0, 23, 5.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Davis High-Aspect Ratio Wings (Wingspan 56)
      ctx.fillStyle = '#0D2134';
      ctx.beginPath();
      ctx.moveTo(6, -28);
      ctx.lineTo(8, -28);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 28);
      ctx.lineTo(6, 28);
      ctx.lineTo(-3, 28);
      ctx.lineTo(-3, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4x Twin Wasp Engines with Cowling Rings
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.4;
      for (const ey of [-21, -12, 12, 21]) {
        ctx.strokeRect(4, ey - 2.5, 8.5, 5);
        ctx.beginPath();
        ctx.arc(12.5, ey, 3.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Horizontal Tailplane with Iconic Twin Oval Vertical Fins at Tips
      ctx.beginPath();
      ctx.moveTo(-17, -13);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-17, 13);
      ctx.stroke();

      // Twin oval rudders
      ctx.strokeRect(-21, -15, 6, 4);
      ctx.strokeRect(-21, 11, 6, 4);

      // Greenhouse nose and cockpit
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(10, -2.4, 6, 4.8);

      if (isPlayer) this.drawUSInsignia(1, -18, 4.5);
    } else if (m === 'p40') {
      // ════ P-40 Warhawk: Land-Based Fighter with Iconic Chin Scoop & Shark Mouth ════
      ctx.fillStyle = '#061322';
      // Streamlined inline Allison engine fuselage
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cantilever low-wings
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(2, -16);
      ctx.lineTo(4, -16);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 16);
      ctx.lineTo(2, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Framed cockpit glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.5, 5, 3);

      // Iconic Large Chin Radiator Scoop
      ctx.fillStyle = '#C62828';
      ctx.fillRect(8, -1.8, 4, 3.6);
      // Shark teeth accents
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(9, -1.8);
      ctx.lineTo(11, 0);
      ctx.lineTo(9, 1.8);
      ctx.stroke();

      // 6x .50 cal wing guns
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      for (const gy of [-9, -7.5, -6, 6, 7.5, 9]) {
        ctx.beginPath();
        ctx.moveTo(2, gy);
        ctx.lineTo(6, gy);
        ctx.stroke();
      }

      // Propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(15, 0, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -10, 3.2);
    } else if (m === 'p38') {
      // ════ P-38 Lightning: Twin-Boom Heavy Land-Based Fighter ("Fork-Tailed Devil") ════
      ctx.fillStyle = '#061322';

      // 1. Central Nacelle (Cockpit & Nose Gun Battery)
      ctx.beginPath();
      ctx.ellipse(2, 0, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nose gun battery: 1x 20mm Hispano cannon + 4x .50 cal machine guns
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(15, 0);
      ctx.moveTo(8, -1);
      ctx.lineTo(13, -1);
      ctx.moveTo(8, 1);
      ctx.lineTo(13, 1);
      ctx.stroke();

      // 2. High-speed Wing (Wingspan 42)
      ctx.fillStyle = '#0E241C';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(3, -21);
      ctx.lineTo(5, -21);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 21);
      ctx.lineTo(3, 21);
      ctx.lineTo(-3, 21);
      ctx.lineTo(-3, -21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Twin Engine Booms (y = ±9.5) with Twin Vertical Fins & Horizontal Elevator
      for (const by of [-9.5, 9.5]) {
        // Boom body
        ctx.fillStyle = '#061322';
        ctx.strokeRect(-18, by - 2.2, 26, 4.4);
        ctx.fillRect(-18, by - 2.2, 26, 4.4);

        // Vertical rudder fin at tail of boom
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-21, by - 3, 5, 6);

        // Propeller
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(8, by, 4.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rear connecting horizontal elevator bar between twin booms
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-18, -9.5);
      ctx.lineTo(-18, 9.5);
      ctx.stroke();

      // Bubble Canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(0, -1.6, 5, 3.2);

      if (isPlayer) this.drawUSInsignia(0, -15, 3.5);
    } else if (m === 'a20') {
      // ════ A-20 Havoc: Twin-Engine Low-Altitude Attack Bomber ════
      ctx.fillStyle = '#061322';
      // Streamlined fuselage
      ctx.beginPath();
      ctx.ellipse(3, 0, 15, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shoulder-mounted wings (Wingspan 38)
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(3, -19);
      ctx.lineTo(5, -19);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 19);
      ctx.lineTo(3, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-3, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pilot & nose glass canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
      ctx.fillRect(5, -1.8, 5, 3.6);

      // Twin Wright R-2600 Engine Nacelles (y = ±9)
      for (const ey of [-9, 9]) {
        ctx.strokeRect(0, ey - 2.8, 10, 5.6);
        ctx.beginPath();
        ctx.arc(10, ey, 4.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Nose gun battery for ground strafing
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(14, -1);
      ctx.lineTo(19, -1);
      ctx.moveTo(14, 1);
      ctx.lineTo(19, 1);
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-12, 8);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -14, 3.4);
    } else if (m === 'a26') {
      // ════ A-26 Invader: High-Speed Twin-Engine Heavy Attack Aircraft ════
      ctx.fillStyle = '#061322';
      // High-speed laminar fuselage
      ctx.beginPath();
      ctx.ellipse(4, 0, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Laminar-flow attack wing (Wingspan 42)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(4, -21);
      ctx.lineTo(6, -21);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 21);
      ctx.lineTo(4, 21);
      ctx.lineTo(-3, 21);
      ctx.lineTo(-3, -21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Clamshell canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(6, -1.8, 5, 3.6);

      // Heavy Double Wasp Nacelles (y = ±10)
      for (const ey of [-10, 10]) {
        ctx.strokeRect(1, ey - 3, 11, 6);
        ctx.beginPath();
        ctx.arc(12, ey, 4.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // All-Gun Heavy Assault Solid Nose (8x .50 cal)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, -1.5);
      ctx.lineTo(21, -1.5);
      ctx.moveTo(15, 1.5);
      ctx.lineTo(21, 1.5);
      ctx.stroke();

      // Tall vertical fin
      ctx.beginPath();
      ctx.moveTo(-13, -9);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-13, 9);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -15, 3.8);
    } else if (m === 'zero' || m === 'zero_a6m2') {
      // ════ A6M2 零戰二一型 (Mitsubishi A6M2 Zero Model 21) ════
      // 早期經典象牙灰/飴色 (Ameiro) 機身，靈巧柔美流暢線條
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sleek rounded Mitsubishi wings
      ctx.fillStyle = '#18242C';
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Framed Mitsubishi greenhouse canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.4, 5, 2.8);

      // Wingtip folding hinge lines (二一型航母甲板折疊翼端)
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, -12.5);
      ctx.lineTo(-3, -12.5);
      ctx.moveTo(2, 12.5);
      ctx.lineTo(-3, 12.5);
      ctx.stroke();

      // Nakajima Sakae 12 engine cowl
      ctx.strokeStyle = '#37474F';
      ctx.strokeRect(10, -2.4, 3, 4.8);

      // Red Hinomaru roundels
      this.drawHinomaru(0, -8.5, 3.4);
      this.drawHinomaru(0, 8.5, 3.4);
    } else if (m === 'zero_a6m5' || m === 'kamikaze_zero') {
      // ════ A6M5 零戰五二型 (Mitsubishi A6M5 Zero Model 52) ════
      // 帝國海軍深綠色塗裝、切角翼端、單重推力排氣管
      ctx.fillStyle = '#051816';
      ctx.beginPath();
      ctx.ellipse(2, 0, 12.5, 3.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Clipped square-tip wings (五二型圓角改切角)
      ctx.fillStyle = '#0D241C';
      ctx.beginPath();
      ctx.moveTo(2, -14);
      ctx.lineTo(4, -14);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 14);
      ctx.lineTo(2, 14);
      ctx.lineTo(-3.5, 14);
      ctx.lineTo(-3.5, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glass glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.4, 5, 2.8);

      // Multiple individual thrust exhaust stacks (推力式單排氣管)
      ctx.strokeStyle = '#FF7043';
      ctx.lineWidth = 1.2;
      for (const ey of [-2.8, 2.8]) {
        ctx.beginPath();
        ctx.moveTo(7, ey);
        ctx.lineTo(5, ey * 1.2);
        ctx.stroke();
      }

      // Yellow wing leading edge identification bands (黃色識別帶)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2.5, -13);
      ctx.lineTo(2.5, -7);
      ctx.moveTo(2.5, 7);
      ctx.lineTo(2.5, 13);
      ctx.stroke();

      this.drawHinomaru(0, -8.5, 3.6);
      this.drawHinomaru(0, 8.5, 3.6);
    } else if (m === 'ki61') {
      // ════ Ki-61 飛燕 (Kawasaki Ki-61 Hien / "Tony") ════
      // 帝國陸軍唯一量產液冷倒V12發動機戰鬥機，銳利流線長機首
      ctx.fillStyle = '#081720';
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 3.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pointed liquid-cooled nose (倒V12長機首)
      ctx.strokeStyle = '#FFB74D';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(17, 0);
      ctx.stroke();

      // Tapered wings (Wingspan 36)
      ctx.fillStyle = '#142228';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(2, -16);
      ctx.lineTo(4, -16);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 16);
      ctx.lineTo(2, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.4, 5, 2.8);

      // Ventral radiator bath (機腹冷卻散熱器)
      ctx.fillStyle = '#102027';
      ctx.fillRect(-2, -1.5, 5, 3);
      ctx.strokeRect(-2, -1.5, 5, 3);

      this.drawHinomaru(0, -9.5, 3.4);
      this.drawHinomaru(0, 9.5, 3.4);
    } else if (m === 'george') {
      // ════ N1K2-J 紫電改 (Kawajima N1K2-J Shiden-Kai / "George") ════
      // 帝國海軍最強制空戰鬥機！中單翼厚實翼型，翼內 4門 九九式二號二〇粍機砲突出
      ctx.fillStyle = '#061D1A';
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 4.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad low-mid laminar-flow wings
      ctx.fillStyle = '#0D241C';
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(5, -17);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-3.5, 17);
      ctx.lineTo(-3.5, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.6, 5, 3.2);

      // 4x 20mm long gun barrels extending forward from wing leading edge
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.8;
      for (const gy of [-11, -8, 8, 11]) {
        ctx.beginPath();
        ctx.moveTo(3, gy);
        ctx.lineTo(8.5, gy);
        ctx.stroke();
      }

      // Large Homare 21 engine cowling
      ctx.strokeStyle = '#37474F';
      ctx.strokeRect(10, -2.8, 4, 5.6);

      this.drawHinomaru(0, -10, 3.8);
      this.drawHinomaru(0, 10, 3.8);
    } else if (m === 'val' || m === 'judy') {
      // ════ Enemy D3A Val / D4Y Suisei: Dive Bomber ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Elliptical wings
      ctx.fillStyle = '#142228';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Long tandem greenhouse canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-2, -1.5, 7, 3);

      // Val Fixed Streamlined Spatted Landing Gear Pants
      if (m === 'val') {
        ctx.strokeStyle = '#EF9A9A';
        ctx.lineWidth = 2;
        ctx.strokeRect(3, -7, 4.5, 3);
        ctx.strokeRect(3, 4, 4.5, 3);
      }

      this.drawHinomaru(0, -10, 3.6);
      this.drawHinomaru(0, 10, 3.6);
    } else if (m === 'kate' || m === 'jill') {
      // ════ Enemy B5N Kate / B6N Jill: Torpedo Bomber ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 14, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Long wingspan
      ctx.fillStyle = '#0D241C';
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(4, -18);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 18);
      ctx.lineTo(2, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Three-seat long greenhouse canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.48)';
      ctx.fillRect(-3, -1.6, 8, 3.2);

      this.drawHinomaru(0, -11, 3.8);
      this.drawHinomaru(0, 11, 3.8);
    } else if (m === 'g4m') {
      // ════ 一式陸上攻擊機 (Mitsubishi G4M2e "Betty" Bomber / Ohka Mother Ship) ════
      ctx.fillStyle = '#061322';
      // Cigar-shaped twin-engine medium bomber fuselage
      ctx.beginPath();
      ctx.ellipse(2, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wide tapered wings with dual engine nacelles
      ctx.fillStyle = '#0D241C';
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(7, -26);
      ctx.lineTo(4, 0);
      ctx.lineTo(7, 26);
      ctx.lineTo(4, 26);
      ctx.lineTo(-5, 26);
      ctx.lineTo(-5, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glazed navigator nose & stepped cockpit glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(10, -2.1, 6, 4.2);

      // Twin Kasei engine nacelles with dual spinning props
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, -13, 8, 4.5);
      ctx.strokeRect(3, 8.5, 8, 4.5);

      // Spinning dual props
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.7)';
      ctx.beginPath();
      ctx.arc(11, -11, 4, 0, Math.PI * 2);
      ctx.arc(11, 11, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Tail horizontal & vertical stabilizers
      ctx.beginPath();
      ctx.moveTo(-14, -8);
      ctx.lineTo(-18, -8);
      ctx.lineTo(-14, 8);
      ctx.lineTo(-18, 8);
      ctx.stroke();

      // Red Hinomaru on both wings
      this.drawHinomaru(1, -19, 4.2);
      this.drawHinomaru(1, 19, 4.2);

      // If carrying underslung MXY-7 Ohka Rocket Missile!
      if (plane.hasOhkaAttached) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#212121';
        ctx.lineWidth = 1.8;
        // Ohka rocket silhouette semi-recessed in bomb bay
        ctx.strokeRect(-2, -2, 11, 4);
        ctx.fillRect(-2, -2, 11, 4);
        // Ohka stubby wings
        ctx.beginPath();
        ctx.moveTo(3, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(3, 6);
        ctx.lineTo(5, 6);
        ctx.stroke();
      }
    } else if (m === 'ohka') {
      // ════ 櫻花特攻機 (MXY-7 Ohka Rocket-Powered Suicide Missile) ════
      // Rocket fuselage
      ctx.fillStyle = '#FAFAFA';
      ctx.strokeStyle = '#D32F2F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(1, 0, 10, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stubby squared wooden wings
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.moveTo(1, -9);
      ctx.lineTo(4, -9);
      ctx.lineTo(1, 9);
      ctx.lineTo(4, 9);
      ctx.lineTo(-2, 9);
      ctx.lineTo(-2, -9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin vertical endplate tailfins
      ctx.strokeStyle = '#D32F2F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-8, -4.5);
      ctx.lineTo(-8, 4.5);
      ctx.moveTo(-9, -4.5);
      ctx.lineTo(-6, -4.5);
      ctx.moveTo(-9, 4.5);
      ctx.lineTo(-6, 4.5);
      ctx.stroke();

      // Cockpit bubble
      ctx.fillStyle = '#0288D1';
      ctx.beginPath();
      ctx.arc(1, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Hinomaru on tiny wings
      this.drawHinomaru(1, -5.5, 2);
      this.drawHinomaru(1, 5.5, 2);

      // Blazing Triple Solid Rocket Booster Exhaust Flame
      const flameLen = 14 + Math.random() * 8;
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-9 - flameLen, 0);
      ctx.stroke();

      ctx.strokeStyle = '#FFEA00';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-9 - flameLen * 0.65, 0);
      ctx.stroke();
    } else if (m === 'kamikaze_judy') {
      // ════ 一般神風特攻機 (A6M5 / Suisei Suicide Attack Units with Bomb) ════
      ctx.fillStyle = '#1B5E20'; // Imperial Army/Navy Dark Green
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = plane.state === 'kamikaze_dive' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.ellipse(2, 0, 12, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wings
      ctx.fillStyle = '#1B5E20';
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(1, -1.4, 4.5, 2.8);

      // White "Hachimaki" / identification stripe across fuselage
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -3.5, 3, 7);

      // Red Hinomaru
      this.drawHinomaru(0, -9, 3.5);
      this.drawHinomaru(0, 9, 3.5);

      // Centerline Mounted 250kg/500kg Heavy Suicide Bomb
      ctx.strokeStyle = '#FFA000';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      // Kamikaze High-Speed Terminal Dive Visual Aura
      if (plane.state === 'kamikaze_dive') {
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (m === 'f9f') {
      // ════ F9F Panther: USN Carrier Jet Fighter (Grumman F9F-2) ════
      ctx.fillStyle = '#061322';
      // Streamlined jet fuselage
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Straight wings with leading-edge root fillets (Wingspan 38)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(2, -18);
      ctx.lineTo(-4, -18);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, 18);
      ctx.lineTo(2, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wingtip Auxiliary Fuel Drop Tanks (Permanent teardrop tip tanks)
      for (const ty of [-18, 18]) {
        ctx.fillStyle = '#0B2544';
        ctx.beginPath();
        ctx.ellipse(0, ty, 6, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 4x 20mm Colt M3 Cannons in nose
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(14, -1.2);
      ctx.lineTo(19, -1.2);
      ctx.moveTo(14, 1.2);
      ctx.lineTo(19, 1.2);
      ctx.stroke();

      // Cruciform swept tail
      ctx.beginPath();
      ctx.moveTo(-11, -7);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-11, 7);
      ctx.stroke();

      // Bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(2, -1.6, 5, 3.2);

      if (isPlayer) this.drawUSInsignia(0, -11, 3.2);
    } else if (m === 'f2h') {
      // ════ F2H Banshee: Twin-Engine Jet Interceptor ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(4, 0, 17, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thickened wing roots housing twin Westinghouse J34 turbojets
      ctx.fillStyle = '#0A1E34';
      ctx.beginPath();
      ctx.rect(-3, -8, 10, 16);
      ctx.fill();
      ctx.stroke();

      // Outer wings extending to wingtip tanks (Wingspan 42)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(2, -8);
      ctx.lineTo(1, -21);
      ctx.lineTo(-5, -21);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 8);
      ctx.lineTo(1, 21);
      ctx.lineTo(-5, 21);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(6, -1.5, 5, 3);

      // Large cylindrical wingtip fuel tanks
      for (const ty of [-21, 21]) {
        ctx.fillStyle = '#0B2544';
        ctx.beginPath();
        ctx.ellipse(0, ty, 7, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Nose gun cluster
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(15, -1);
      ctx.lineTo(20, -1);
      ctx.moveTo(15, 1);
      ctx.lineTo(20, 1);
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-12, 8);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -14, 3.2);
    } else if (m === 'ad1') {
      // ════ AD-1 / A-1 Skyraider: Heavy Attack Bomber ════
      ctx.fillStyle = '#061322';
      // Bulky fuselage with Wright R-3350 radial
      ctx.beginPath();
      ctx.ellipse(3, 0, 15, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad straight wings (Wingspan 46) with 15 weapons hardpoints
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, -23);
      ctx.lineTo(5, -23);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 23);
      ctx.lineTo(3, 23);
      ctx.lineTo(-4, 23);
      ctx.lineTo(-4, -23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(1, -1.7, 5, 3.4);

      // 4-blade propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(17, 0, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      // Wing cannon barrels (4x 20mm)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      for (const wy of [-10, -7, 7, 10]) {
        ctx.beginPath();
        ctx.moveTo(4, wy);
        ctx.lineTo(9, wy);
        ctx.stroke();
      }

      // Side fuselage dive brakes
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-5, -5.6, 6, 1.4);
      ctx.strokeRect(-5, 4.2, 6, 1.4);

      if (isPlayer) this.drawUSInsignia(0, -16, 3.6);
    } else if (m === 'f4u4') {
      // ════ F4U-4 Corsair: Late-War / Cold War Upgraded Bent-Wing Bird ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inverted Gull Wings
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(1, -7);
      ctx.lineTo(4, -19);
      ctx.lineTo(-3, -19);
      ctx.lineTo(-1, -7);
      ctx.lineTo(1, 0);
      ctx.lineTo(-1, 7);
      ctx.lineTo(-3, 19);
      ctx.lineTo(4, 19);
      ctx.lineTo(1, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Aft-set Corsair bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(-2, -1.7, 5, 3.4);

      // 4-blade prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(17, 0, 6.2, 0, Math.PI * 2);
      ctx.stroke();

      // 4x 20mm M3 Cannon Barrels (F4U-4B)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      for (const wy of [-11, -8, 8, 11]) {
        ctx.beginPath();
        ctx.moveTo(3, wy);
        ctx.lineTo(9, wy);
        ctx.stroke();
      }

      if (isPlayer) this.drawUSInsignia(0, -13, 3.4);
    } else if (m === 'af_guardian') {
      // ════ AF-2 Guardian: Hunter-Killer ASW ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 16, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wings (Wingspan 44)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(3, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(1, -1.7, 5.5, 3.4);

      // Starboard Wing Radome Pod & Port Searchlight
      ctx.fillStyle = '#0B2544';
      ctx.beginPath();
      ctx.ellipse(1, 14, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Big Prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(17, 0, 6.8, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -15, 3.5);
    } else if (m === 'ad3w') {
      // ════ AD-3W Skyraider AEW: Airborne Early Warning Radar Sentry ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 15, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wings
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(3, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ★ 腹部大型 AN/APS-20 搜索雷達罩 (Giant Bulbous Ventral Radome)
      ctx.fillStyle = '#020C17';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Radar scan pulse rings
      const aewPulse = (Math.sin(this.time * 8) + 1) * 0.5;
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + aewPulse * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + aewPulse * 8, 0, Math.PI * 2);
      ctx.stroke();

      // Twin auxiliary vertical finlets on horizontal tail
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -8, 2.5, 4);
      ctx.strokeRect(-12, 4, 2.5, 4);

      if (isPlayer) this.drawUSInsignia(0, -15, 3.5);
    } else if (m === 'ho3s1') {
      // ════ HO3S-1 Dragonfly: Sikorsky SAR Helicopter ════
      ctx.fillStyle = '#061322';
      // Teardrop Cockpit Fuselage
      ctx.beginPath();
      ctx.ellipse(2, 0, 10, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Slender Tubular Tail Boom
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-17, 0);
      ctx.stroke();

      // Starboard Rescue Winch Arm & Hoist
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 4.2);
      ctx.lineTo(2, 7.5);
      ctx.lineTo(0, 7.5);
      ctx.stroke();

      // Glazed Canopy Dome
      ctx.fillStyle = 'rgba(128, 222, 234, 0.7)';
      ctx.beginPath();
      ctx.arc(6, 0, 3.5, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Landing Gear / Float Skids
      ctx.strokeStyle = '#90CAF9';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-3, -5.5, 8, 1);
      ctx.strokeRect(-3, 4.5, 8, 1);

      if (isPlayer) this.drawUSInsignia(0, -2, 2.5);
    } else if (m === 'mig15') {
      // ════ MiG-15 Fagot: Soviet 35-Degree Swept-Wing Jet Fighter ════
      ctx.fillStyle = '#061322';
      // Circular nose air intake and tapered jet fuselage
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nose Air Intake Ring
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(17, 0, 2.8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // 35-Degree Swept Wings (Wingspan 36)
      ctx.fillStyle = '#1D1319';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, -18);
      ctx.lineTo(-9, -17);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-9, 17);
      ctx.lineTo(-3, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(3, -1.5, 5, 3);

      // Wing Fences (Boundary layer fences on swept wings)
      ctx.strokeStyle = '#FF8A80';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-5, -10);
      ctx.moveTo(0, 9);
      ctx.lineTo(-5, 10);
      ctx.stroke();

      // Heavy Cannon Armament in Nose: 1x 37mm N-37 + 2x 23mm NR-23
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(15, -1.8);
      ctx.lineTo(21, -1.8); // 37mm cannon
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(15, 1.2);
      ctx.lineTo(19, 1.2); // 23mm cannon
      ctx.moveTo(15, 2.2);
      ctx.lineTo(19, 2.2);
      ctx.stroke();

      // High-mounted swept T-tail
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-9, 8);
      ctx.stroke();

      // Red Star Insignia on Wings
      ctx.fillStyle = '#FF1744';
      ctx.beginPath();
      ctx.arc(-3, -11, 2.5, 0, Math.PI * 2);
      ctx.arc(-3, 11, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'tu14') {
      // ════ Tu-14 Bosun: Twin-Jet Torpedo & Naval Attack Bomber ════
      ctx.fillStyle = '#061322';
      // Long fuselage with glazed bombardier nose
      ctx.beginPath();
      ctx.ellipse(4, 0, 20, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Straight shoulder wings with twin underslung jet nacelles (Wingspan 44)
      ctx.fillStyle = '#1D1319';
      ctx.beginPath();
      ctx.moveTo(4, -22);
      ctx.lineTo(6, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 22);
      ctx.lineTo(4, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glazed nose & cockpit canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(12, -2, 6, 4);

      // Twin Klimov VK-1 Jet Nacelles (y = ±9)
      for (const ey of [-9, 9]) {
        ctx.fillStyle = '#081726';
        ctx.beginPath();
        ctx.rect(-6, ey - 3, 16, 6);
        ctx.fill();
        ctx.stroke();
      }

      // Swept vertical & horizontal tail
      ctx.beginPath();
      ctx.moveTo(-13, -9);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-13, 9);
      ctx.stroke();

      // Red Star
      ctx.fillStyle = '#FF1744';
      ctx.beginPath();
      ctx.arc(0, -15, 2.8, 0, Math.PI * 2);
      ctx.arc(0, 15, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'b29') {
      // ════ B-29 Superfortress: Heavy Strategic Bomber (Pressurized Fuselage & 4x R-3350) ════
      ctx.fillStyle = '#071626';
      // Long cylindrical fuselage with circular cross-section
      ctx.beginPath();
      ctx.ellipse(5, 0, 26, 5.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High-Aspect Ratio Wings (Wingspan 62)
      ctx.fillStyle = '#0E2133';
      ctx.beginPath();
      ctx.moveTo(6, -31);
      ctx.lineTo(9, -31);
      ctx.lineTo(7, 0);
      ctx.lineTo(9, 31);
      ctx.lineTo(6, 31);
      ctx.lineTo(-4, 31);
      ctx.lineTo(-4, -31);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4x Wright R-3350 Duplex-Cyclone Turbo-supercharged Radial Nacelles
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.5;
      for (const ey of [-23, -13, 13, 23]) {
        ctx.strokeRect(4, ey - 2.8, 9.5, 5.6);
        ctx.beginPath();
        ctx.arc(13.5, ey, 4.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4x Spinning 4-blade propellers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1;
      for (const ey of [-23, -13, 13, 23]) {
        ctx.beginPath();
        ctx.arc(15, ey, 3.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tall vertical single fin and broad horizontal stabilizer
      ctx.beginPath();
      ctx.moveTo(-18, -14);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-18, 14);
      ctx.lineTo(-24, 14);
      ctx.lineTo(-24, -14);
      ctx.closePath();
      ctx.stroke();

      // Fully glazed greenhouse cockpit & nose bombardier dome
      ctx.fillStyle = 'rgba(128, 222, 234, 0.7)';
      ctx.beginPath();
      ctx.ellipse(19, 0, 7.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0288D1';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Greenhouse framing grid lines
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(26, 0);
      ctx.moveTo(19, -3.8);
      ctx.lineTo(19, 3.8);
      ctx.stroke();

      // Remote dorsal and ventral turrets (CFC General Electric Remote Control Fire Control)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, -1.8, 4.5, 3.6);  // Forward dorsal turret
      ctx.strokeRect(-8, -1.8, 4.5, 3.6); // Aft dorsal turret
      // Tail stinger gun position (Twin .50 + 20mm cannon)
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-25, 0);
      ctx.stroke();

      // Open Bomb Bay Doors during Bombing Run
      if (plane.state === 'bombing_run') {
        ctx.fillStyle = '#020B14';
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-4, -2.4, 12, 4.8);
        ctx.fillRect(-4, -2.4, 12, 4.8);
        if (plane.payloadType === 'tactical_nuke') {
          // Yellow Mk 4 nuke casing armed inside bomb bay
          ctx.fillStyle = '#FFD600';
          ctx.beginPath();
          ctx.ellipse(2, 0, 4, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Cluster of yellow bomb rack tips
          ctx.fillStyle = '#FFCA28';
          for (let bx = -2; bx <= 6; bx += 3) {
            ctx.fillRect(bx, -1.2, 1.8, 1);
            ctx.fillRect(bx, 0.2, 1.8, 1);
          }
        }
      }

      if (isPlayer) this.drawUSInsignia(2, -20, 4.8);
    } else if (m === 'p51') {
      // ════ P-51D Mustang: High-Speed Long-Range Air Superiority Fighter ════
      ctx.fillStyle = '#061322';
      // Streamlined fuselage with belly ventral radiator scoop
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Belly ventral radiator scoop (Merlin coolant duct)
      ctx.fillStyle = '#0B2544';
      ctx.strokeRect(-3, -1.6, 6, 3.2);

      // Laminar-flow clipped wings (Wingspan 36)
      ctx.fillStyle = '#0D2235';
      ctx.beginPath();
      ctx.moveTo(3, -18);
      ctx.lineTo(5, -18);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 18);
      ctx.lineTo(3, 18);
      ctx.lineTo(-3, 18);
      ctx.lineTo(-3, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Teardrop bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(1, -1.6, 5, 3.2);

      // 6x .50 cal wing guns
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      for (const gy of [-11, -9.5, -8, 8, 9.5, 11]) {
        ctx.beginPath();
        ctx.moveTo(3, gy);
        ctx.lineTo(7, gy);
        ctx.stroke();
      }

      // 4-blade propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(16, 0, 5.8, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -11, 3.4);
    } else if (m === 'p47') {
      // ════ P-47D Thunderbolt: Heavy Armored Fighter-Bomber ("The Jug") ════
      ctx.fillStyle = '#061322';
      // Bulky barrel-shaped fuselage with huge R-2800 radial cowling
      ctx.beginPath();
      ctx.ellipse(3, 0, 15, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Heavy radial cowling front ring
      ctx.strokeStyle = '#4FC3F7';
      ctx.strokeRect(10, -3.2, 4, 6.4);

      // Broad elliptical high-lift wings (Wingspan 42)
      ctx.fillStyle = '#0D2235';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(3, -21);
      ctx.lineTo(6, -21);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 21);
      ctx.lineTo(3, 21);
      ctx.lineTo(-4, 21);
      ctx.lineTo(-4, -21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 8x .50 cal Browning M2 Heavy Machine Gun Battery
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      for (const gy of [-14, -12.5, -11, -9.5, 9.5, 11, 12.5, 14]) {
        ctx.beginPath();
        ctx.moveTo(3, gy);
        ctx.lineTo(8, gy);
        ctx.stroke();
      }

      // Teardrop bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(1, -1.8, 6, 3.6);

      // 4-blade paddle propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(16.5, 0, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -14, 3.8);
    } else if (m === 'f86') {
      // ════ F-86 Sabre: USAF 35-Degree Swept-Wing Jet Fighter ════
      ctx.fillStyle = '#061322';
      // Streamlined jet fuselage with open nose intake
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Open oval nose intake
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(14, -1.8, 2.5, 3.6);

      // 35-degree swept wings (Wingspan 38)
      ctx.fillStyle = '#0D2235';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -19);
      ctx.lineTo(-9, -19);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-9, 19);
      ctx.lineTo(-3, 19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 6x .50 M3 Colt machine guns in nose
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(12, -1.2);
      ctx.lineTo(16, -1.2);
      ctx.moveTo(12, 1.2);
      ctx.lineTo(16, 1.2);
      ctx.stroke();

      // Swept horizontal & vertical tail surfaces
      ctx.beginPath();
      ctx.moveTo(-10, -7);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-10, 7);
      ctx.stroke();

      // Teardrop bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(2, -1.6, 5, 3.2);

      if (isPlayer) this.drawUSInsignia(0, -11, 3.2);
    } else if (m === 'yak9') {
      // ════ Yak-9: Soviet Piston Fighter (Klimov M-105PF & Nose ShVAK/NS-37 Cannon) ════
      ctx.fillStyle = '#081726';
      // Slender aerodynamic fuselage with tapered tail
      ctx.beginPath();
      ctx.ellipse(3, 0, 13.5, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Straight tapered wings with rounded tips (Wingspan 33)
      ctx.fillStyle = '#1D1319';
      ctx.beginPath();
      ctx.moveTo(3, -16.5);
      ctx.lineTo(5, -16.5);
      ctx.lineTo(4, 0);
      ctx.lineTo(5, 16.5);
      ctx.lineTo(3, 16.5);
      ctx.lineTo(-3.5, 16.5);
      ctx.lineTo(-3.5, -16.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Teardrop sliding canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(1, -1.5, 5.5, 3.0);

      // Nose 20mm/37mm hollow spinner cannon barrel
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(19, 0);
      ctx.stroke();

      // Spinning propeller disc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(15, 0, 5.2, 0, Math.PI * 2);
      ctx.stroke();

      // Red Star on wings
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -11, 2.6, 0, Math.PI * 2);
      ctx.arc(0, 11, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'il10') {
      // ════ IL-10 Beast: Heavy Armored Ground Attack Assault Craft (Armoured Bathtub & 23mm Wing Cannons) ════
      ctx.fillStyle = '#071626';
      // Rugged, heavy armoured fuselage
      ctx.beginPath();
      ctx.ellipse(4, 0, 15, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Heavy inverted gull dihedral wings with broad wing root (Wingspan 41)
      ctx.fillStyle = '#1D1319';
      ctx.beginPath();
      ctx.moveTo(4, -20.5);
      ctx.lineTo(7, -20.5);
      ctx.lineTo(5, 0);
      ctx.lineTo(7, 20.5);
      ctx.lineTo(4, 20.5);
      ctx.lineTo(-4.5, 20.5);
      ctx.lineTo(-4.5, -20.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armoured cockpit tandem greenhouse (Pilot + Rear Gunner)
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(3, -1.8, 5, 3.6);
      ctx.fillRect(-3, -1.5, 3.5, 3.0);

      // Twin 23mm VYa/NS-23 heavy wing cannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.8;
      for (const cy of [-11, 11]) {
        ctx.beginPath();
        ctx.moveTo(4, cy);
        ctx.lineTo(10.5, cy);
        ctx.stroke();
      }

      // Rear gunner B-20 defensive machine gun
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-9, 0);
      ctx.stroke();

      // Spinning 3-blade propeller disc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(16, 0, 5.8, 0, Math.PI * 2);
      ctx.stroke();

      // Red Star on wings
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -13, 3, 0, Math.PI * 2);
      ctx.arc(0, 13, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'f4b' || m === 'f4j' || m === 'f4e') {
      // ════ F-4 Phantom II: Twin-Engine Heavy Supersonic Fighter-Bomber ════
      ctx.fillStyle = '#061322';
      // Long fuselage with pointed radome
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(13, -2.5);
      ctx.lineTo(-13, -2.5);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-13, 2.5);
      ctx.lineTo(13, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // F-4E Vulcan 20mm M61 cannon nose fairing
      if (m === 'f4e') {
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(11, -0.9, 5, 1.8);
      }

      // Swept wings (45°) with outer wing panels cranked upward (dihedral)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-2, -9);
      ctx.lineTo(1, -19);
      ctx.lineTo(-6, -19);
      ctx.lineTo(-7, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 9);
      ctx.lineTo(-6, 19);
      ctx.lineTo(1, 19);
      ctx.lineTo(-2, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Anhedral tailplanes (sloping downward like inverted V)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-15, -8);
      ctx.lineTo(-17, -7);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-17, 7);
      ctx.lineTo(-15, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tandem twin cockpit canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(1, -1.8, 8, 3.6);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(5, -1.8);
      ctx.lineTo(5, 1.8);
      ctx.stroke();

      // Twin jet exhausts
      ctx.fillStyle = '#263238';
      ctx.fillRect(-14, -2.6, 2, 2.2);
      ctx.fillRect(-14, 0.4, 2, 2.2);

      if (isPlayer) this.drawUSInsignia(0, -12, 3.2);
    } else if (m === 'f8') {
      // ════ F-8 Crusader: "The Last of the Gunfighters" ════
      ctx.fillStyle = '#061322';
      // Slender needle fuselage with chin air scoop
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chin air intake
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(10, -1.5, 3, 3);

      // High swept wing (variable-incidence wing)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, -15);
      ctx.lineTo(-7, -15);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 15);
      ctx.lineTo(-2, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Low all-flying tailplanes
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-13, 6);
      ctx.lineTo(-10, 6);
      ctx.stroke();

      // 4x 20mm Colt Mk 12 cannon ports & bubble canopy glint
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(4, -2.4, 3, 1);
      ctx.fillRect(4, 1.4, 3, 1);
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(6, -1.4, 5, 2.8);

      if (isPlayer) this.drawUSInsignia(0, -9, 3);
    } else if (m === 'a4') {
      // ════ A-4 Skyhawk: "Heinemann's Hot Rod" Compact Delta ════
      ctx.fillStyle = '#061322';
      // Short nimble fuselage with dorsal avionics hump
      ctx.beginPath();
      ctx.ellipse(2, 0, 12, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Compact modified delta wing (Wingspan 27 - no folding wings!)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-5, -13);
      ctx.lineTo(-8, -13);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 13);
      ctx.lineTo(-5, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dorsal avionics hump behind cockpit
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -1.2, 5, 2.4);

      // Canopy glint & refueling probe
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(4, -1.5, 4.5, 3);
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(14, 3.5);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -8, 2.8);
    } else if (m === 'a6a' || m === 'a6b_weasel') {
      // ════ A-6 Intruder / A-6B Wild Weasel: All-Weather Heavy Attack ════
      ctx.fillStyle = '#061322';
      // Bulbous radome nose & side-by-side cockpit
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(10, -3.8);
      ctx.lineTo(-12, -3.2);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-12, 3.2);
      ctx.lineTo(10, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Broad swept wings with wingtip speedbrakes
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -19);
      ctx.lineTo(-8, -19);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 19);
      ctx.lineTo(-3, 19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(2, -2.6, 6, 5.2);

      // Nose curved refueling probe
      ctx.strokeStyle = '#80DEEA';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(13, 0);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -12, 3.2);
    } else if (m === 'b52') {
      // ════ B-52 Stratofortress: 8-Engine Strategic Heavy Bomber ════
      ctx.fillStyle = '#061322';
      // Massive fuselage (length 44)
      ctx.beginPath();
      ctx.ellipse(3, 0, 24, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Giant 35° swept high wings (wingspan 48)
      ctx.fillStyle = '#0D2134';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-12, -28);
      ctx.lineTo(-18, -28);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-18, 28);
      ctx.lineTo(-12, 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4 twin-engine pods on forward pylons
      ctx.fillStyle = '#263238';
      for (const podY of [-18, -10, 10, 18]) {
        ctx.fillRect(-2, podY - 2.2, 8, 4.4);
      }

      // Tall swept vertical tail & broad horizontal stabilizers
      ctx.beginPath();
      ctx.moveTo(-16, -12);
      ctx.lineTo(-21, -12);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-21, 12);
      ctx.lineTo(-16, 12);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -18, 4);
    } else if (m === 'f105') {
      // ════ F-105 Thunderchief: "Thud" Supersonic Heavy Strike Fighter ════
      ctx.fillStyle = '#061322';
      // Long sleek area-ruled fuselage with needle nose
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(13, -2.8);
      ctx.lineTo(-14, -2.4);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-14, 2.4);
      ctx.lineTo(13, 2.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swept wings with forward-swept root intakes
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-3, -15);
      ctx.lineTo(-8, -15);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 15);
      ctx.lineTo(-3, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Unique root forward-swept intakes
      ctx.fillStyle = '#263238';
      ctx.fillRect(2, -4, 4, 1.8);
      ctx.fillRect(2, 2.2, 4, 1.8);

      if (isPlayer) this.drawUSInsignia(0, -10, 3);
    } else if (m === 'a7') {
      // ════ A-7 Corsair II: High-Precision Carrier Attack Bomber ════
      ctx.fillStyle = '#061322';
      // Stocky fuselage with chin intake
      ctx.beginPath();
      ctx.ellipse(2, 0, 14, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wide chin scoop intake
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(10, -2, 3, 4);

      // High swept wings with 6 underwing weapon pylons
      ctx.fillStyle = '#0B1F34';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -18);
      ctx.lineTo(-8, -18);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-3, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Forward-mounted canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(4, -1.7, 5, 3.4);

      if (isPlayer) this.drawUSInsignia(0, -11, 3.2);
    } else if (m === 'ov10') {
      // ════ OV-10 Bronco: Twin-Boom Forward Air Control (FAC) ════
      ctx.fillStyle = '#061322';
      // Central crew gondola with high-visibility canopy
      ctx.beginPath();
      ctx.ellipse(3, 0, 11, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High straight wing
      ctx.fillStyle = '#0E241C';
      ctx.fillRect(-2, -18, 5, 36);
      ctx.strokeRect(-2, -18, 5, 36);
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(3, -1.6, 5.5, 3.2);

      // Twin tail booms extending from twin engines
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-12, -7.5, 14, 3);
      ctx.strokeRect(-12, 4.5, 14, 3);

      // High horizontal stabilizer bridging the two vertical fins
      ctx.beginPath();
      ctx.moveTo(-12, -9);
      ctx.lineTo(-12, 9);
      ctx.stroke();

      // Twin propellers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(4, -6, 4, 0, Math.PI * 2);
      ctx.arc(4, 6, 4, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -12, 2.8);
    } else if (m === 'ah1') {
      // ════ AH-1G Cobra: Dedicated Tandem Attack Helicopter ════
      ctx.fillStyle = '#061322';
      // Extremely narrow 36-inch fuselage
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(8, -1.8);
      ctx.lineTo(-13, -1.2);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-13, 1.2);
      ctx.lineTo(8, 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stub wings for rocket pods
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-1, -7, 3, 14);

      // Under-nose 20mm rotary cannon chin turret
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(8, -1, 4, 2);

      // Skid landing gear
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -3.2, 10, 6.4);
    } else if (m === 'uh1' || m === 'uh2') {
      // ════ UH-1 Huey / UH-2 Seasprite: Combat Utility Helicopter ════
      ctx.fillStyle = '#061322';
      // Broad cabin fuselage
      ctx.beginPath();
      ctx.ellipse(2, 0, 11, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tail boom
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-16, 0);
      ctx.stroke();

      // Twin skids
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, -4.2);
      ctx.lineTo(7, -4.2);
      ctx.moveTo(-4, 4.2);
      ctx.lineTo(7, 4.2);
      ctx.stroke();

      // Open side cargo doors with Marine squads
      ctx.fillStyle = '#1B5E20';
      ctx.fillRect(-1, -3.6, 5, 1.2);
      ctx.fillRect(-1, 2.4, 5, 1.2);
    } else if (m === 'e1') {
      // ════ E-1B Tracer: Airborne Early Warning (AEW) with Dorsal Dome ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High straight wings with twin radial engines
      ctx.fillStyle = '#0B1F34';
      ctx.fillRect(-2, -22, 6, 44);
      ctx.strokeRect(-2, -22, 6, 44);

      // Huge teardrop aerodynamic dorsal radome ("Flying Saucer")
      ctx.fillStyle = 'rgba(7, 26, 43, 0.9)';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Twin vertical tail fins
      ctx.beginPath();
      ctx.moveTo(-13, -8);
      ctx.lineTo(-13, 8);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -18, 3.2);
    } else if (m === 'c47') {
      // ════ C-47 Skytrain / Dakota: Twin-Engine Paratrooper Transport ════
      ctx.fillStyle = '#3B4D36';
      ctx.strokeStyle = '#C5E1A5';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Swept-back tapered transport wings
      ctx.beginPath();
      ctx.moveTo(5, -24);
      ctx.lineTo(-4, -24);
      ctx.lineTo(-5, 24);
      ctx.lineTo(4, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Invasion white stripes on wings
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, -13);
      ctx.lineTo(-3, -13);
      ctx.moveTo(2, 13);
      ctx.lineTo(-3, 13);
      ctx.stroke();

      // Tailplane
      ctx.strokeStyle = '#C5E1A5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, -9);
      ctx.lineTo(-14, 9);
      ctx.stroke();

      // Twin radial propellers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.arc(8, -8, 5, 0, Math.PI * 2);
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -18, 3.3);
    } else if (m === 'c1' || m === 's2') {
      // ════ C-1 Trader / S-2 Tracker: Twin-Engine Carrier Transport/ASW ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 14, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High straight wing with twin radial engines
      ctx.fillStyle = '#0B1F34';
      ctx.fillRect(-2, -22, 6, 44);
      ctx.strokeRect(-2, -22, 6, 44);
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(6, -1.8, 4.5, 3.6);

      // Twin propellers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(6, -8, 5, 0, Math.PI * 2);
      ctx.arc(6, 8, 5, 0, Math.PI * 2);
      ctx.stroke();

      // S-2 extended MAD boom
      if (m === 's2') {
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.lineTo(-19, 0);
        ctx.stroke();
      }

      if (isPlayer) this.drawUSInsignia(0, -16, 3.2);
    } else if (m === 'sh2') {
      // ════ SH-2 Seasprite: LAMPS I Shipboard ASW Helicopter ════
      ctx.fillStyle = '#061322';
      // Streamlined cabin fuselage
      ctx.beginPath();
      ctx.ellipse(3, 0, 13, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chin search radar blister dome (LN-66HP surface search radar)
      ctx.fillStyle = '#1A237E';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(13, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Twin General Electric T58 turboshaft engine fairings on roof
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -3.2, 8, 2.2);
      ctx.fillRect(-2, 1.0, 8, 2.2);

      // Tail boom
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-18, 0);
      ctx.stroke();

      // Side Mk 46 lightweight acoustic homing torpedo weapon racks
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(0, -6.5, 9, 2.2);
      ctx.fillRect(0, 4.3, 9, 2.2);

      // Landing wheels
      ctx.fillStyle = '#263238';
      ctx.fillRect(3, -5.2, 3, 1.5);
      ctx.fillRect(3, 3.7, 3, 1.5);

      if (isPlayer) this.drawUSInsignia(0, 0, 2.8);
    } else if (m === 'p3') {
      // ════ P-3C Orion: 4-Turboprop Long-Range ASW Maritime Patrol ════
      ctx.fillStyle = '#061322';
      // Long cylindrical fuselage with prominent cockpit
      ctx.beginPath();
      ctx.ellipse(4, 0, 24, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad high-aspect ratio straight wings (wingspan 48)
      ctx.fillStyle = '#0B1F34';
      ctx.beginPath();
      ctx.moveTo(5, -24);
      ctx.lineTo(8, -24);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 24);
      ctx.lineTo(5, 24);
      ctx.lineTo(-3, 24);
      ctx.lineTo(-3, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flight deck cockpit windshield
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(17, -2.1, 4.5, 4.2);

      // 4x Allison T56 Turboprop Engine Nacelles (y = ±9, ±17)
      ctx.fillStyle = '#263238';
      for (const ey of [-17, -9, 9, 17]) {
        ctx.fillRect(1, ey - 2.4, 10, 4.8);
        ctx.beginPath();
        ctx.arc(11, ey, 3.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spinning 4-blade propellers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      for (const ey of [-17, -9, 9, 17]) {
        ctx.beginPath();
        ctx.arc(12, ey, 3.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Stinger MAD (Magnetic Anomaly Detector) Tail Boom (length 18px behind tail)
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-30, 0);
      ctx.stroke();

      // Tall vertical fin & broad horizontal stabilizers
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-16, -11);
      ctx.lineTo(-19, -11);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-19, 11);
      ctx.lineTo(-16, 11);
      ctx.stroke();

      // Sonobuoy launch chute belly tubes
      ctx.fillStyle = '#80DEEA';
      for (let sb = 0; sb < 4; sb++) {
        ctx.fillRect(-8 + sb * 3, -1.2, 1.8, 2.4);
      }

      if (isPlayer) this.drawUSInsignia(0, -18, 3.5);
    } else if (m === 'mig21') {
      // ════ MiG-21 Fishbed: Pure Delta Supersonic Interceptor ════
      ctx.fillStyle = '#180E14';
      ctx.strokeStyle = '#FF5252';
      // Long cylindrical fuselage with conical nose centerbody shock cone
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(13, -2.2);
      ctx.lineTo(-13, -2.0);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-13, 2.0);
      ctx.lineTo(13, 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Conical shock cone inside nose intake
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(14, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Pure delta wing (57° sweep)
      ctx.fillStyle = '#22141B';
      ctx.strokeStyle = '#FF5252';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-8, -13);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 13);
      ctx.lineTo(-6, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(4, -1.2, 4.8, 2.4);

      // Swept tailplanes & large dorsal spine
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-13, 6);
      ctx.lineTo(-10, 6);
      ctx.stroke();

      // Red Star insignia on wings
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(0, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'mig17') {
      // ════ MiG-17 Fresco: 45° Swept Subsonic Agile Fighter ════
      ctx.fillStyle = '#180E14';
      ctx.strokeStyle = '#FF5252';
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 45° swept wings with 3 wing fences on each side
      ctx.fillStyle = '#22141B';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-3, -16);
      ctx.lineTo(-8, -16);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-3, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(3, -1.4, 4.8, 2.8);

      // Wing fences
      for (const wy of [-12, -7, 7, 12]) {
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.lineTo(-4, wy);
        ctx.stroke();
      }

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -10, 2.6, 0, Math.PI * 2);
      ctx.arc(0, 10, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'il28') {
      // ════ Il-28 Beagle: Twin-Engine Jet Tactical Bomber ════
      ctx.fillStyle = '#180E14';
      ctx.strokeStyle = '#FF5252';
      // Long fuselage with glazed nose
      ctx.beginPath();
      ctx.ellipse(3, 0, 20, 4.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High straight wings with twin Klimov jet engine nacelles
      ctx.fillStyle = '#22141B';
      ctx.beginPath();
      ctx.moveTo(4, -25);
      ctx.lineTo(6, -25);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 25);
      ctx.lineTo(4, 25);
      ctx.lineTo(-4, 25);
      ctx.lineTo(-4, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glazed navigator nose & bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(14, -1.8, 5, 3.6);
      ctx.fillRect(6, -1.5, 4.5, 3);

      // Twin jet nacelles under wings
      ctx.fillStyle = '#263238';
      ctx.fillRect(0, -10, 12, 4.2);
      ctx.fillRect(0, 5.8, 12, 4.2);

      // Tail gunner turret
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(-17, -1, 3, 2);

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -16, 3, 0, Math.PI * 2);
      ctx.arc(0, 16, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'su7') {
      // ════ Su-7 Fitter: Supersonic Heavy Strike Fighter ════
      ctx.fillStyle = '#141416';
      ctx.strokeStyle = '#FF5252';
      // Long tubular fuselage with Lyulka AL-7F afterburning turbojet
      ctx.beginPath();
      ctx.ellipse(3, 0, 18, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nose intake shock cone
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(21, 0);
      ctx.stroke();

      // Heavily swept 62-degree wings with prominent wing fences
      ctx.fillStyle = '#201B1E';
      ctx.strokeStyle = '#FF5252';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -18);
      ctx.lineTo(-9, -18);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-9, 18);
      ctx.lineTo(-4, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(6, -1.4, 5, 2.8);

      // Wing boundary-layer fences
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-6, -9);
      ctx.moveTo(0, 9);
      ctx.lineTo(-6, 9);
      ctx.stroke();

      // Twin 30mm NR-30 wing-root autocannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(4, -4);
      ctx.lineTo(9, -4);
      ctx.moveTo(4, 4);
      ctx.lineTo(9, 4);
      ctx.stroke();

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-2, -12, 2.8, 0, Math.PI * 2);
      ctx.arc(-2, 12, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'mig19') {
      // ════ MiG-19 Farmer: Twin-Jet Supersonic Fighter (VPAF 925th Reg) ════
      ctx.fillStyle = '#161418';
      ctx.strokeStyle = '#FF5252';
      // Twin-engine fuselage with wide rear section
      ctx.beginPath();
      ctx.ellipse(2, 0, 15, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Twin exhaust nozzles at rear
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-13, -2.6, 3, 2.2);
      ctx.fillRect(-13, 0.4, 3, 2.2);

      // 55° sharply swept wings
      ctx.fillStyle = '#201B1E';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-4, -17);
      ctx.lineTo(-8, -17);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-8, 17);
      ctx.lineTo(-4, 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(4, -1.4, 4.8, 2.8);

      // Wing fence on each wing
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-5, -10);
      ctx.moveTo(0, 10);
      ctx.lineTo(-5, 10);
      ctx.stroke();

      // Triple 30mm NR-30 guns (2 in wing roots, 1 in nose)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.lineTo(8, -4);
      ctx.moveTo(2, 4);
      ctx.lineTo(8, 4);
      ctx.moveTo(10, 1.8);
      ctx.lineTo(15, 1.8);
      ctx.stroke();

      // VPAF Red Star with Yellow Border
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-2, -11, 2.6, 0, Math.PI * 2);
      ctx.arc(-2, 11, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'tu16') {
      // ════ Tu-16 Badger: Heavy Maritime Anti-Ship Missile Bomber (Soviet AV-MF) ════
      ctx.fillStyle = '#121922';
      ctx.strokeStyle = '#FF5252';
      // Long fuselage with glazed navigator nose and chin radome
      ctx.beginPath();
      ctx.ellipse(3, 0, 26, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glazed cockpit & nose
      ctx.fillStyle = '#80DEEA';
      ctx.beginPath();
      ctx.arc(24, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Chin search radar radome (Short Horn)
      ctx.fillStyle = '#37474F';
      ctx.fillRect(14, -2, 4.5, 4);

      // Large 35° swept wings
      ctx.fillStyle = '#18222C';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-8, -34);
      ctx.lineTo(-15, -34);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-15, 34);
      ctx.lineTo(-8, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Huge Mikulin AM-3 turbojet nacelles blended into wing roots
      ctx.fillStyle = '#263238';
      ctx.fillRect(2, -8.5, 14, 5.2);
      ctx.fillRect(2, 3.3, 14, 5.2);

      // Swept tailplane and tail barbette
      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(-24, -12);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-24, 12);
      ctx.lineTo(-18, 12);
      ctx.stroke();

      // Tail gunner 23mm turret
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(-26, -1, 4, 2);

      // Underwing KSR-5 (AS-5 Kelt) heavy anti-ship cruise missiles
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 1.3;
      for (const my of [-18, 18]) {
        ctx.fillRect(-2, my - 1.6, 12, 3.2);
        ctx.strokeRect(-2, my - 1.6, 12, 3.2);
        // Missile delta wings
        ctx.beginPath();
        ctx.moveTo(3, my - 4);
        ctx.lineTo(6, my);
        ctx.lineTo(3, my + 4);
        ctx.stroke();
      }

      // Soviet Red Stars on wings
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-6, -26, 3.2, 0, Math.PI * 2);
      ctx.arc(-6, 26, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'f14a') {
      // ════ F-14A Tomcat: Variable-sweep wings, twin vertical tails, glove vanes ════
      ctx.fillStyle = '#091A2C';
      // Blended lifting-body fuselage
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(8, -4.5);
      ctx.lineTo(-14, -5.5);
      ctx.lineTo(-18, -4);
      ctx.lineTo(-18, 4);
      ctx.lineTo(-14, 5.5);
      ctx.lineTo(8, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Variable-Sweep Wings (Swept position for high-speed intercept)
      ctx.fillStyle = '#0D2238';
      ctx.beginPath();
      ctx.moveTo(6, -5);
      ctx.lineTo(-6, -22);
      ctx.lineTo(-12, -22);
      ctx.lineTo(-4, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 5);
      ctx.lineTo(-6, 22);
      ctx.lineTo(-12, 22);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit canopy glass highlight
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.beginPath();
      ctx.ellipse(9, 0, 4.5, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twin canted vertical stabilizers
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10, -3.8);
      ctx.lineTo(-16, -3.8);
      ctx.moveTo(-10, 3.8);
      ctx.lineTo(-16, 3.8);
      ctx.stroke();

      // Twin TF30 engine exhausts
      ctx.fillStyle = '#FFB300';
      ctx.fillRect(-19, -4.5, 2, 2.5);
      ctx.fillRect(-19, 2, 2, 2.5);

      if (isPlayer) this.drawUSInsignia(0, -12, 3.0);
    } else if (m === 'fa18a') {
      // ════ F/A-18A Hornet: Leading edge root extensions (LEX) and twin canted tails ════
      ctx.fillStyle = '#08182A';
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(10, -2.8);
      ctx.lineTo(2, -4.5);
      ctx.lineTo(-14, -4.5);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-14, 4.5);
      ctx.lineTo(2, 4.5);
      ctx.lineTo(10, 2.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mid-mounted 20-degree swept wings
      ctx.fillStyle = '#0D2238';
      ctx.beginPath();
      ctx.moveTo(2, -4.5);
      ctx.lineTo(-2, -18);
      ctx.lineTo(-7, -18);
      ctx.lineTo(-6, -4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 4.5);
      ctx.lineTo(-2, 18);
      ctx.lineTo(-7, 18);
      ctx.lineTo(-6, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit canopy highlight
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.beginPath();
      ctx.ellipse(8, 0, 3.8, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twin outward-canted rudders
      ctx.strokeStyle = '#29B6F6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -3.2);
      ctx.lineTo(-14, -3.8);
      ctx.moveTo(-8, 3.2);
      ctx.lineTo(-14, 3.8);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -10, 2.8);
    } else if (m === 'a10a') {
      // ════ A-10A Thunderbolt II: Straight unswept high-aspect wing, twin nacelles over tail ════
      ctx.fillStyle = '#091A26';
      // Rugged titanium bathtub cockpit & fuselage
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(12, -2.8);
      ctx.lineTo(-16, -2.8);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-16, 2.8);
      ctx.lineTo(12, 2.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Long unswept wings (Wide Wingspan)
      ctx.fillStyle = '#0D2332';
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(4, 26);
      ctx.lineTo(-4, 26);
      ctx.lineTo(-4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin elevated TF34 turbofans mounted on rear fuselage
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-8, -7, 10, 3.8);
      ctx.fillRect(-8, 3.2, 10, 3.8);

      // GAU-8 30mm Avenger Gatling Gun muzzle in nose
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(16, -0.6, 2.5, 1.2);

      if (isPlayer) this.drawUSInsignia(-1, -14, 3.2);
    } else if (m === 'f15a') {
      // ════ F-15A Eagle: Twin-tail high-wing air superiority fighter ════
      ctx.fillStyle = '#071626';
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(10, -3.5);
      ctx.lineTo(-16, -4.8);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-16, 4.8);
      ctx.lineTo(10, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Large clipped-delta wings
      ctx.fillStyle = '#0D2238';
      ctx.beginPath();
      ctx.moveTo(6, -4.5);
      ctx.lineTo(-4, -22);
      ctx.lineTo(-11, -22);
      ctx.lineTo(-8, -4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 4.5);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-11, 22);
      ctx.lineTo(-8, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.beginPath();
      ctx.ellipse(9, 0, 4.2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Twin vertical fins
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-16, -4);
      ctx.moveTo(-10, 4);
      ctx.lineTo(-16, 4);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -12, 3.0);
    } else if (m === 'f16a') {
      // ════ F-16A Fighting Falcon: Single engine, frameless bubble canopy, blended wing-body ════
      ctx.fillStyle = '#081A2A';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, -2.6);
      ctx.lineTo(-13, -3.4);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-13, 3.4);
      ctx.lineTo(8, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cropped-delta wing with missile rails on tips
      ctx.fillStyle = '#0D2238';
      ctx.beginPath();
      ctx.moveTo(3, -3.2);
      ctx.lineTo(-3, -16);
      ctx.lineTo(-7, -16);
      ctx.lineTo(-6, -3.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 3.2);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-7, 16);
      ctx.lineTo(-6, 3.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.65)';
      ctx.beginPath();
      ctx.ellipse(7, 0, 3.8, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isPlayer) this.drawUSInsignia(-1, -9, 2.6);
    } else if (m === 'mig29a' || m === 'su27') {
      // ════ MiG-29A Fulcrum & Su-27 Flanker: Twin engine, twin tail, blended LERX ════
      const isSu27 = m === 'su27';
      const scale = isSu27 ? 1.25 : 1.0;
      ctx.fillStyle = '#1C1217';
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(17 * scale, 0);
      ctx.lineTo(9 * scale, -3.2 * scale);
      ctx.lineTo(-14 * scale, -4.5 * scale);
      ctx.lineTo(-17 * scale, 0);
      ctx.lineTo(-14 * scale, 4.5 * scale);
      ctx.lineTo(9 * scale, 3.2 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swept wing with prominent root extensions
      ctx.fillStyle = '#28151D';
      ctx.beginPath();
      ctx.moveTo(2 * scale, -4 * scale);
      ctx.lineTo(-4 * scale, -18 * scale);
      ctx.lineTo(-9 * scale, -18 * scale);
      ctx.lineTo(-7 * scale, -4.5 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2 * scale, 4 * scale);
      ctx.lineTo(-4 * scale, 18 * scale);
      ctx.lineTo(-9 * scale, 18 * scale);
      ctx.lineTo(-7 * scale, 4.5 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Soviet Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-4 * scale, -10 * scale, 2.5, 0, Math.PI * 2);
      ctx.arc(-4 * scale, 10 * scale, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'tu22m3') {
      // ════ Tu-22M3 Backfire: Supersonic variable-sweep heavy missile bomber ════
      ctx.fillStyle = '#1B0E14';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(14, -4.5);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-18, 6);
      ctx.lineTo(14, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Variable sweep wings swept back for supersonic penetration
      ctx.fillStyle = '#24141C';
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(-6, -26);
      ctx.lineTo(-12, -26);
      ctx.lineTo(-4, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(-6, 26);
      ctx.lineTo(-12, 26);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(10, -2, 6, 4);

      // Kh-22 (AS-4 Kitchen) heavy supersonic anti-ship missile mounted under belly
      ctx.fillStyle = '#ECEFF1';
      ctx.fillRect(-6, -1.8, 16, 3.6);

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-8, -16, 3, 0, Math.PI * 2);
      ctx.arc(-8, 16, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'ah64a') {
      // ════ AH-64A Apache: Tandem cockpit, cheek sponsons, TADS turret, 30mm chain gun, Hellfire rails ════
      ctx.fillStyle = '#102015';
      ctx.strokeStyle = '#66BB6A';
      ctx.lineWidth = 1.6;

      // Narrow fuselage with cheek avionics sponsons
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(10, -2.2);
      ctx.lineTo(2, -4.2);
      ctx.lineTo(-8, -3.2);
      ctx.lineTo(-20, -1.5);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-20, 1.5);
      ctx.lineTo(-8, 3.2);
      ctx.lineTo(2, 4.2);
      ctx.lineTo(10, 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nose TADS/PNVS sensor turret ball
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(15, 0, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // M230 30mm chain gun barrel
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();

      // Stub wings with rocket pods and AGM-114 Hellfire rails
      ctx.strokeStyle = '#81C784';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -4.2);
      ctx.lineTo(-2, -12);
      ctx.moveTo(0, 4.2);
      ctx.lineTo(-2, 12);
      ctx.stroke();

      // Hellfire racks & Hydra pods
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(-4, -13, 5, 2.2);
      ctx.fillRect(-4, 10.8, 5, 2.2);

      // Tail horizontal stabilator
      ctx.beginPath();
      ctx.moveTo(-21, -6);
      ctx.lineTo(-21, 6);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-4, 0, 2.4);
    } else if (m === 'ah1w') {
      // ════ AH-1W SuperCobra: Ultra-slim tandem fuselage, chin Gatling turret, stub wings ════
      ctx.fillStyle = '#0F1A1B';
      ctx.strokeStyle = '#4DB6AC';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(11, -1.8);
      ctx.lineTo(-6, -2.4);
      ctx.lineTo(-21, -1.2);
      ctx.lineTo(-23, 0);
      ctx.lineTo(-21, 1.2);
      ctx.lineTo(-6, 2.4);
      ctx.lineTo(11, 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Under-chin 20mm 3-barrel cannon
      ctx.strokeStyle = '#FFCA28';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(19, 0);
      ctx.stroke();

      // Stub wings with TOW/Hellfire pods
      ctx.strokeStyle = '#80CBC4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-1, -2.4);
      ctx.lineTo(-2, -9);
      ctx.moveTo(-1, 2.4);
      ctx.lineTo(-2, 9);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-4, 0, 2.2);
    } else if (m === 'f111') {
      // ════ F-111 Aardvark: Long needle nose, variable-sweep shoulder wings, twin TF30 afterburners ════
      ctx.fillStyle = '#0A1822';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(15, -3.2);
      ctx.lineTo(-17, -5.2);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-17, 5.2);
      ctx.lineTo(15, 3.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Variable sweep wings
      ctx.fillStyle = '#0E2232';
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(-5, -24);
      ctx.lineTo(-11, -24);
      ctx.lineTo(-7, -5.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 5);
      ctx.lineTo(-5, 24);
      ctx.lineTo(-11, 24);
      ctx.lineTo(-7, 5.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit capsule glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(9, -2.2, 5.5, 4.4);

      // Horizontal stabs & twin exhausts
      ctx.beginPath();
      ctx.moveTo(-16, -11);
      ctx.lineTo(-20, -11);
      ctx.lineTo(-19, -4.5);
      ctx.moveTo(-16, 11);
      ctx.lineTo(-20, 11);
      ctx.lineTo(-19, 4.5);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -14, 3.0);
    } else if (m === 'e3a') {
      // ════ E-3A Sentry AWACS: 4-engine Boeing 707 airframe with rotating APY-2 rotodome radar ════
      ctx.fillStyle = '#0E1E2E';
      ctx.strokeStyle = '#81D4FA';
      ctx.lineWidth = 2;

      // Long 707 airliner fuselage
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(20, -4.2);
      ctx.lineTo(-24, -4.8);
      ctx.lineTo(-29, 0);
      ctx.lineTo(-24, 4.8);
      ctx.lineTo(20, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swept wings with 4 turbofan nacelles
      ctx.fillStyle = '#14283D';
      ctx.beginPath();
      ctx.moveTo(6, -4.8);
      ctx.lineTo(-8, -32);
      ctx.lineTo(-14, -32);
      ctx.lineTo(-6, -4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 4.8);
      ctx.lineTo(-8, 32);
      ctx.lineTo(-14, 32);
      ctx.lineTo(-6, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flight deck cockpit glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(18, -2, 5, 4);

      // 4 CFM56 Turbofan engines
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -16, 8, 3.2);
      ctx.fillRect(-6, -26, 8, 3.2);
      ctx.fillRect(-2, 12.8, 8, 3.2);
      ctx.fillRect(-6, 22.8, 8, 3.2);

      // Rotating APY-2 Rotodome 30ft Radar Disc on rear fuselage
      const rotAngle = this.time * 2.5;
      ctx.save();
      ctx.translate(-4, 0);
      ctx.rotate(rotAngle);
      // Dark half & light half
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(0, 0, 11, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (isPlayer) this.drawUSInsignia(-12, 0, 3.5);
    } else if (m === 'e2c') {
      // ════ E-2C Hawkeye: Twin turboprop carrier AWACS with rotating rotodome and quad tailfins ════
      ctx.fillStyle = '#0B1C2A';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(12, -3.8);
      ctx.lineTo(-16, -4.2);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-16, 4.2);
      ctx.lineTo(12, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High straight wings
      ctx.fillStyle = '#0E2438';
      ctx.beginPath();
      ctx.moveTo(3, -26);
      ctx.lineTo(3, 26);
      ctx.lineTo(-4, 26);
      ctx.lineTo(-4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flight deck glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(10, -2, 4.5, 4);

      // Twin Allison T56 turboprop nacelles & propeller blur discs
      ctx.fillStyle = '#263238';
      ctx.fillRect(0, -11, 8, 3.6);
      ctx.fillRect(0, 7.4, 8, 3.6);
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(8, -9.2, 5.5, 0, Math.PI * 2);
      ctx.arc(8, 9.2, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      // Quad vertical tail fins
      ctx.strokeStyle = '#29B6F6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-18, 10);
      ctx.moveTo(-16, -10);
      ctx.lineTo(-20, -10);
      ctx.moveTo(-16, -3.5);
      ctx.lineTo(-20, -3.5);
      ctx.moveTo(-16, 3.5);
      ctx.lineTo(-20, 3.5);
      ctx.moveTo(-16, 10);
      ctx.lineTo(-20, 10);
      ctx.stroke();

      // Rotating APS-125 Radar Rotodome
      const e2Rot = this.time * 2.8;
      ctx.save();
      ctx.translate(-2, 0);
      ctx.rotate(e2Rot);
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-9.5, 0);
      ctx.lineTo(9.5, 0);
      ctx.stroke();
      ctx.restore();

      if (isPlayer) this.drawUSInsignia(-9, 0, 2.6);
    } else if (m === 'a6e') {
      // ════ A-6E Intruder: Broad bulbous radome, TRAM FLIR ball turret, swept wings ════
      ctx.fillStyle = '#081724';
      ctx.strokeStyle = '#29B6F6';
      ctx.lineWidth = 1.7;

      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(9, -4.2);
      ctx.lineTo(-13, -4.6);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-13, 4.6);
      ctx.lineTo(9, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Under-nose TRAM FLIR sensor ball turret
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(13, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Mid-mounted swept wings with wingtip speed brakes
      ctx.fillStyle = '#0D2234';
      ctx.strokeStyle = '#29B6F6';
      ctx.beginPath();
      ctx.moveTo(4, -4.5);
      ctx.lineTo(-4, -22);
      ctx.lineTo(-9, -22);
      ctx.lineTo(-6, -4.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 4.5);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-9, 22);
      ctx.lineTo(-6, 4.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(4, -2.5, 5.5, 5);

      if (isPlayer) this.drawUSInsignia(-2, -12, 2.8);
    } else if (m === 'ea6b') {
      // ════ EA-6B Prowler: Stretched 4-seat cockpit, football ECM pod on tailfin, ALQ-99 pods ════
      ctx.fillStyle = '#081726';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(10, -4.2);
      ctx.lineTo(-15, -4.6);
      ctx.lineTo(-19, 0);
      ctx.lineTo(-15, 4.6);
      ctx.lineTo(10, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4-seat gold-tinted canopy
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.fillRect(4, -2.8, 8, 5.6);

      // Swept wings
      ctx.fillStyle = '#0D2234';
      ctx.strokeStyle = '#00E5FF';
      ctx.beginPath();
      ctx.moveTo(5, -4.5);
      ctx.lineTo(-4, -22);
      ctx.lineTo(-9, -22);
      ctx.lineTo(-6, -4.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 4.5);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-9, 22);
      ctx.lineTo(-6, 4.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Football ECM pod on top of vertical fin
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.ellipse(-16, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // ALQ-99 Tactical Jamming Pods under wings
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -14, 6, 2.5);
      ctx.fillRect(-2, 11.5, 6, 2.5);

      if (isPlayer) this.drawUSInsignia(-1, 0, 2.8);
    } else if (m === 'av8b') {
      // ════ AV-8B Harrier II: Anhedral drooping wings, outrigger landing gear pods, 4 Pegasus nozzles ════
      ctx.fillStyle = '#091925';
      ctx.strokeStyle = '#26C6DA';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(9, -2.8);
      ctx.lineTo(-12, -3.8);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-12, 3.8);
      ctx.lineTo(9, 2.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Supercritical high wing with anhedral droop
      ctx.fillStyle = '#0E2432';
      ctx.beginPath();
      ctx.moveTo(3, -3.6);
      ctx.lineTo(-2, -16);
      ctx.lineTo(-7, -16);
      ctx.lineTo(-5, -3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 3.6);
      ctx.lineTo(-2, 16);
      ctx.lineTo(-7, 16);
      ctx.lineTo(-5, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Raised bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(5, -1.5, 5, 3);

      // Wingtip outrigger landing gear fairings
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(-6, -17.2, 3, 1.8);
      ctx.fillRect(-6, 15.4, 3, 1.8);

      // Four Pegasus vectored thrust rotating nozzle fairings
      ctx.fillStyle = '#FFB300';
      ctx.fillRect(1, -4.5, 2.5, 1.2);
      ctx.fillRect(-3, -4.5, 2.5, 1.2);
      ctx.fillRect(1, 3.3, 2.5, 1.2);
      ctx.fillRect(-3, 3.3, 2.5, 1.2);

      if (isPlayer) this.drawUSInsignia(-2, -9, 2.4);
    } else if (m === 's3a') {
      // ════ S-3A Viking: High swept wings, TF34 turbofans under wings, retractable MAD boom ════
      ctx.fillStyle = '#081726';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(11, -3.5);
      ctx.lineTo(-15, -4.0);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-15, 4.0);
      ctx.lineTo(11, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High swept wings
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(3, -4);
      ctx.lineTo(-3, -24);
      ctx.lineTo(-8, -24);
      ctx.lineTo(-5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 4);
      ctx.lineTo(-3, 24);
      ctx.lineTo(-8, 24);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit windshield
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(7, -2, 5, 4);

      // Twin TF34 turbofan nacelles under wings
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -10, 8, 3.4);
      ctx.fillRect(-2, 6.6, 8, 3.4);

      // Retractable Magnetic Anomaly Detector (MAD) boom from tail
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-26, 0);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-2, -14, 2.8);
    } else if (m === 'c130') {
      // ════ C-130 Hercules: Four turboprops, high straight wing, side sponsons, blunt nose ════
      ctx.fillStyle = '#0B1C28';
      ctx.strokeStyle = '#80CBC4';
      ctx.lineWidth = 2;

      // Heavy transport fuselage with sponsons
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(18, -4.8);
      ctx.lineTo(4, -5.8);
      ctx.lineTo(-6, -5.8); // Side sponson
      ctx.lineTo(-22, -4.4);
      ctx.lineTo(-27, 0);
      ctx.lineTo(-22, 4.4);
      ctx.lineTo(-6, 5.8);
      ctx.lineTo(4, 5.8);
      ctx.lineTo(18, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High straight wings
      ctx.fillStyle = '#0F2532';
      ctx.beginPath();
      ctx.moveTo(6, -34);
      ctx.lineTo(6, 34);
      ctx.lineTo(-4, 34);
      ctx.lineTo(-4, -34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stepped flight deck greenhouse
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(15, -2.2, 4.5, 4.4);

      // 4 Allison T56 Turboprop engines and blur discs
      ctx.fillStyle = '#263238';
      ctx.fillRect(3, -16, 7, 3.2);
      ctx.fillRect(3, -27, 7, 3.2);
      ctx.fillRect(3, 12.8, 7, 3.2);
      ctx.fillRect(3, 23.8, 7, 3.2);

      ctx.strokeStyle = 'rgba(178, 235, 242, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(10, -14.4, 5, 0, Math.PI * 2);
      ctx.arc(10, -25.4, 5, 0, Math.PI * 2);
      ctx.arc(10, 14.4, 5, 0, Math.PI * 2);
      ctx.arc(10, 25.4, 5, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-6, 0, 3.4);
    } else if (m === 'c2a') {
      // ════ C-2A Greyhound: Carrier transport, quad tail fins, twin turboprops ════
      ctx.fillStyle = '#091A29';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(12, -4.0);
      ctx.lineTo(-17, -4.5);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-17, 4.5);
      ctx.lineTo(12, 4.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wings
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(3, -25);
      ctx.lineTo(3, 25);
      ctx.lineTo(-4, 25);
      ctx.lineTo(-4, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit windshield
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(10, -2, 4.5, 4);

      // Turboprops
      ctx.fillStyle = '#263238';
      ctx.fillRect(0, -11, 8, 3.6);
      ctx.fillRect(0, 7.4, 8, 3.6);

      // Quad fins
      ctx.strokeStyle = '#29B6F6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-18, 10);
      ctx.moveTo(-16, -10);
      ctx.lineTo(-20, -10);
      ctx.moveTo(-16, -3.5);
      ctx.lineTo(-20, -3.5);
      ctx.moveTo(-16, 3.5);
      ctx.lineTo(-20, 3.5);
      ctx.moveTo(-16, 10);
      ctx.lineTo(-20, 10);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-8, 0, 2.6);
    } else if (m === 'sh3f') {
      // ════ SH-3H / SH-3F Sea King: Boat hull, twin sponsons with torpedoes, 5-blade rotor ════
      ctx.fillStyle = '#0A1B28';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(10, -3.6);
      ctx.lineTo(0, -4.5); // Sponson
      ctx.lineTo(-8, -4.5);
      ctx.lineTo(-16, -2.6);
      ctx.lineTo(-22, -1.2);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-22, 1.2);
      ctx.lineTo(-16, 2.6);
      ctx.lineTo(-8, 4.5);
      ctx.lineTo(0, 4.5);
      ctx.lineTo(10, 3.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin amphibious side sponsons
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-6, -6.5, 8, 2.2);
      ctx.fillRect(-6, 4.3, 8, 2.2);

      // Mk 46 torpedo mounted on sponson
      ctx.fillStyle = '#FFB300';
      ctx.fillRect(-5, -7.5, 6, 1.3);
      ctx.fillRect(-5, 6.2, 6, 1.3);

      if (isPlayer) this.drawUSInsignia(-6, 0, 2.5);
    } else if (m === 'ch53') {
      // ════ CH-53 Sea Stallion: Heavy-lift helicopter, massive cylindrical fuel sponsons ════
      ctx.fillStyle = '#0D1E20';
      ctx.strokeStyle = '#26A69A';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(15, -4.5);
      ctx.lineTo(-14, -5.5);
      ctx.lineTo(-24, -2.2);
      ctx.lineTo(-28, 0);
      ctx.lineTo(-24, 2.2);
      ctx.lineTo(-14, 5.5);
      ctx.lineTo(15, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Huge cylindrical external fuel tanks / sponsons on both sides
      ctx.fillStyle = '#004D40';
      ctx.strokeStyle = '#80CBC4';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-8, -9.5, 16, 4);
      ctx.strokeRect(-8, -9.5, 16, 4);
      ctx.fillRect(-8, 5.5, 16, 4);
      ctx.strokeRect(-8, 5.5, 16, 4);

      // Aft cargo ramp seam
      ctx.beginPath();
      ctx.moveTo(-16, -3.5);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-16, 3.5);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-4, 0, 3.2);
    } else if (m === 'tu95') {
      // ════ Tu-95 Bear: 35-degree swept wings, 4 contra-rotating turboprops (8 blur discs!) ════
      ctx.fillStyle = '#1C1217';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 2.2;

      // Massive needle-nose fuselage
      ctx.beginPath();
      ctx.moveTo(34, 0);
      ctx.lineTo(24, -4.2);
      ctx.lineTo(-28, -5.0);
      ctx.lineTo(-35, 0);
      ctx.lineTo(-28, 5.0);
      ctx.lineTo(24, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 35-degree heavily swept giant wings
      ctx.fillStyle = '#24161D';
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(-18, -42);
      ctx.lineTo(-26, -42);
      ctx.lineTo(-10, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 5);
      ctx.lineTo(-18, 42);
      ctx.lineTo(-26, 42);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glazed navigator nose & flight deck
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(20, -2, 6, 4);

      // 4 Kuznetsov NK-12 Turboprop engine nacelles
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -18, 14, 4.2);
      ctx.fillRect(-10, -32, 14, 4.2);
      ctx.fillRect(-2, 13.8, 14, 4.2);
      ctx.fillRect(-10, 27.8, 14, 4.2);

      // Contra-rotating dual propeller blur rings on each engine!
      ctx.strokeStyle = 'rgba(255, 112, 67, 0.55)';
      ctx.lineWidth = 1.2;
      const t95P = [
        { x: 12, y: -16 },
        { x: 4, y: -30 },
        { x: 12, y: 16 },
        { x: 4, y: 30 },
      ];
      for (const p of t95P) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
        ctx.arc(p.x - 2, p.y, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Kh-55 Cruise Missiles under belly / rotary bay
      ctx.fillStyle = '#ECEFF1';
      ctx.fillRect(-8, -2, 16, 4);

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-14, -28, 3.5, 0, Math.PI * 2);
      ctx.arc(-14, 28, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'ka27') {
      // ════ Ka-27 Helix: Coaxial twin rotors, stubby boxy fuselage, twin endplate vertical fins ════
      ctx.fillStyle = '#1D1217';
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.6;

      // Stubby compact anti-submarine fuselage
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(8, -3.8);
      ctx.lineTo(-10, -4.2);
      ctx.lineTo(-16, -2.5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-16, 2.5);
      ctx.lineTo(-10, 4.2);
      ctx.lineTo(8, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Chin search radar radome blister
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Twin endplate vertical tail fins
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-16, -9);
      ctx.lineTo(-16, 9);
      ctx.moveTo(-14, -9);
      ctx.lineTo(-18, -9);
      ctx.moveTo(-14, 9);
      ctx.lineTo(-18, 9);
      ctx.stroke();

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-4, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'mi24') {
      // ════ Mi-24 Hind: Stepped tandem cockpit, titanium bathtub, angled 12-deg anhedral stub wings ════
      ctx.fillStyle = '#1A1116';
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.8;

      // Heavy armored fuselage with stepped double-bubble canopy
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(12, -2.5);
      ctx.lineTo(2, -4.5);
      ctx.lineTo(-10, -3.5);
      ctx.lineTo(-22, -1.5);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-22, 1.5);
      ctx.lineTo(-10, 3.5);
      ctx.lineTo(2, 4.5);
      ctx.lineTo(12, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stepped tandem cockpit bubbles (Front gunner & rear pilot)
      ctx.fillStyle = 'rgba(255, 82, 82, 0.5)';
      ctx.beginPath();
      ctx.arc(13, 0, 2, 0, Math.PI * 2);
      ctx.arc(8, 0, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Angled stub wings with 12-degree anhedral droop
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, -4.5);
      ctx.lineTo(-2, -14);
      ctx.moveTo(2, 4.5);
      ctx.lineTo(-2, 14);
      ctx.stroke();

      // AT-6 Spiral missile launch tubes on wingtips & UB-32 rocket pods
      ctx.fillStyle = '#ECEFF1';
      ctx.fillRect(-4, -15.5, 6, 2.2);
      ctx.fillRect(-4, 13.3, 6, 2.2);

      // Chin Yak-B 12.7mm four-barrel Gatling turret
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(21, 0);
      ctx.stroke();

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-4, 0, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'yak38') {
      // ════ Yak-38 Forger: Soviet naval carrier V/STOL jet ════
      ctx.fillStyle = '#1A1218';
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(10, -2.8);
      ctx.lineTo(-13, -3.8);
      ctx.lineTo(-16, 0);
      ctx.lineTo(-13, 3.8);
      ctx.lineTo(10, 2.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lift engine doors behind cockpit
      ctx.fillStyle = '#37474F';
      ctx.fillRect(4, -2.2, 5, 4.4);

      // Small cropped-delta wings
      ctx.fillStyle = '#24161E';
      ctx.strokeStyle = '#FF5252';
      ctx.beginPath();
      ctx.moveTo(1, -3.6);
      ctx.lineTo(-3, -13);
      ctx.lineTo(-7, -13);
      ctx.lineTo(-6, -3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, 3.6);
      ctx.lineTo(-3, 13);
      ctx.lineTo(-7, 13);
      ctx.lineTo(-6, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Forward bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(8, -1.3, 4.2, 2.6);

      // Red Star
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-4, -8, 2.2, 0, Math.PI * 2);
      ctx.arc(-4, 8, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'a50') {
      // ════ A-50 Mainstay: Soviet heavy AWACS with rotating Shmel rotodome, high T-tail ════
      ctx.fillStyle = '#1A1116';
      ctx.strokeStyle = '#FF3D00';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(20, -4.5);
      ctx.lineTo(-24, -5.2);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-24, 5.2);
      ctx.lineTo(20, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Swept high wings
      ctx.fillStyle = '#24161C';
      ctx.beginPath();
      ctx.moveTo(6, -5.2);
      ctx.lineTo(-8, -32);
      ctx.lineTo(-14, -32);
      ctx.lineTo(-6, -5.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, 5.2);
      ctx.lineTo(-8, 32);
      ctx.lineTo(-14, 32);
      ctx.lineTo(-6, 5.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glazed Il-76 navigator nose & flight deck
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(19, -2.2, 6, 4.4);

      // 4 D-30KP Turbofan engines
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -16, 8, 3.4);
      ctx.fillRect(-6, -26, 8, 3.4);
      ctx.fillRect(-2, 12.6, 8, 3.4);
      ctx.fillRect(-6, 22.6, 8, 3.4);

      // Shmel Rotating Radar Rotodome disc
      const a50Rot = this.time * 2.6;
      ctx.save();
      ctx.translate(-4, 0);
      ctx.rotate(a50Rot);
      ctx.fillStyle = '#CFD8DC';
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10.5, 0);
      ctx.lineTo(10.5, 0);
      ctx.stroke();
      ctx.restore();

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-10, -18, 3, 0, Math.PI * 2);
      ctx.arc(-10, 18, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'su25') {
      // ════ Su-25 Frogfoot: Armored close air support, straight wings, 10 weapon pylons ════
      ctx.fillStyle = '#1A1215';
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(12, -3.2);
      ctx.lineTo(-14, -4.2);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, 4.2);
      ctx.lineTo(12, 3.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High-aspect straight wings with wingtip speed brake pods
      ctx.fillStyle = '#24171A';
      ctx.beginPath();
      ctx.moveTo(3, -4.2);
      ctx.lineTo(0, -21);
      ctx.lineTo(-6, -21);
      ctx.lineTo(-5, -4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 4.2);
      ctx.lineTo(0, 21);
      ctx.lineTo(-6, 21);
      ctx.lineTo(-5, 4.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armored cockpit canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(6, -1.5, 5, 3);

      // Wingtip pods
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(-6, -22.5, 5, 2.4);
      ctx.fillRect(-6, 20.1, 5, 2.4);

      // GSh-30-2 30mm twin cannon in nose
      ctx.strokeStyle = '#FFCA28';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(14, -1);
      ctx.lineTo(18, -1);
      ctx.stroke();

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-4, -12, 2.8, 0, Math.PI * 2);
      ctx.arc(-4, 12, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'p36a') {
      // ════ Curtiss P-36A Hawk: Classic Radial Fighter, Round Cowl, Olive/Silver ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 12, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rounded Curtiss wings
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.quadraticCurveTo(5, 0, 3, 16);
      ctx.lineTo(-3, 16);
      ctx.quadraticCurveTo(-4, 0, -3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.5, 4.5, 3);

      // Big Twin Wasp radial engine cowling
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(11, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3-blade prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(14, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -9, 3.2, true);
    } else if (m === 'b25') {
      // ════ North American B-25 Mitchell: Twin R-2600 Radials & Twin H-Tail ════
      ctx.fillStyle = '#071626';
      // Long fuselage with glazed bombardier nose
      ctx.beginPath();
      ctx.ellipse(3, 0, 19, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glazed greenhouse nose
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.beginPath();
      ctx.arc(18, 0, 2.5, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Broad shoulder wings (Wingspan 44)
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(5, -22);
      ctx.lineTo(7, -22);
      ctx.lineTo(5, 0);
      ctx.lineTo(7, 22);
      ctx.lineTo(5, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin Wright R-2600 engine nacelles
      for (const ny of [-9.5, 9.5]) {
        ctx.fillStyle = '#263238';
        ctx.fillRect(-2, ny - 2.8, 12, 5.6);
        ctx.strokeRect(-2, ny - 2.8, 12, 5.6);

        // Propeller blur
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(10.5, ny, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Iconic H-Tail: Horizontal tail with twin outboard vertical fins
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-15, -9);
      ctx.lineTo(-15, 9);
      ctx.stroke();
      // Twin vertical endplate rudders
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-17, -10, 4, 2.5);
      ctx.fillRect(-17, 7.5, 4, 2.5);

      // Top dorsal Bendix turret
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(2, -15, 3.6, true);
    } else if (m === 'p39d') {
      // ════ Bell P-39D Airacobra: Mid-Engine, 37mm Hub Cannon, Car Doors ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 12, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tapered wings with rounded tips
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Forward-set car-door canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(2, -1.4, 4.5, 2.8);

      // Centerline 37mm Oldsmobile T9 cannon muzzle sticking out through prop hub
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      // Mid-fuselage Allison V-1710 cooling scoops
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-1, -2.5, 4, 5);

      if (isPlayer) this.drawUSInsignia(0, -9, 3.2, true);
    } else if (m === 'b17_late') {
      // ════ B-17G Flying Fortress (Late): Bendix Chin Turret + Cheyenne Tail ════
      ctx.fillStyle = '#071626';
      ctx.beginPath();
      ctx.ellipse(3, 0, 23, 5.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wingspan 54
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(5, -27);
      ctx.lineTo(8, -27);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 27);
      ctx.lineTo(5, 27);
      ctx.lineTo(-5, 27);
      ctx.lineTo(-5, -27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4 Wright Cyclone R-1820 engine nacelles
      for (const ey of [-18, -10, 10, 18]) {
        ctx.fillStyle = '#263238';
        ctx.fillRect(-2, ey - 2.5, 12, 5);
        ctx.strokeRect(-2, ey - 2.5, 12, 5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(10.5, ey, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Distinctive B-17G Bendix Chin Turret under nose with twin .50 cal guns
      ctx.fillStyle = '#1A237E';
      ctx.beginPath();
      ctx.arc(22, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(22, -1.2);
      ctx.lineTo(26, -1.2);
      ctx.moveTo(22, 1.2);
      ctx.lineTo(26, 1.2);
      ctx.stroke();

      // Cheyenne tail turret with twin .50s
      ctx.beginPath();
      ctx.moveTo(-20, -1);
      ctx.lineTo(-24, -1);
      ctx.moveTo(-20, 1);
      ctx.lineTo(-24, 1);
      ctx.stroke();

      // Dorsal sperry ball turret
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.beginPath();
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      if (isPlayer) this.drawUSInsignia(3, -19, 4, true);
    } else if (m === 'f82') {
      // ════ North American F-82 Twin Mustang: Twin Fuselages & Center Wing ════
      ctx.fillStyle = '#061322';

      // Port & starboard twin fuselages
      for (const fy of [-7.5, 7.5]) {
        ctx.beginPath();
        ctx.ellipse(2, fy, 14, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cockpit canopy
        ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
        ctx.beginPath();
        ctx.ellipse(1, fy, 3.6, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Propeller
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(15, fy, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer wings and center connecting wing
      ctx.fillStyle = '#0D2234';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      // Outboard left wing
      ctx.moveTo(3, -22);
      ctx.lineTo(3, -7.5);
      ctx.lineTo(-3, -7.5);
      ctx.lineTo(-3, -22);
      ctx.closePath();
      // Center connecting wing (houses 6x .50 cal guns)
      ctx.moveTo(3, -7.5);
      ctx.lineTo(3, 7.5);
      ctx.lineTo(-3, 7.5);
      ctx.lineTo(-3, -7.5);
      ctx.closePath();
      // Outboard right wing
      ctx.moveTo(3, 7.5);
      ctx.lineTo(3, 22);
      ctx.lineTo(-3, 22);
      ctx.lineTo(-3, 7.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Common continuous horizontal tailplane connecting both vertical fins
      ctx.beginPath();
      ctx.moveTo(-11, -8.5);
      ctx.lineTo(-11, 8.5);
      ctx.lineTo(-13, 8.5);
      ctx.lineTo(-13, -8.5);
      ctx.closePath();
      ctx.stroke();

      // 6 center-wing machine gun muzzles
      ctx.fillStyle = '#FFD54F';
      for (let g = -2.5; g <= 2.5; g += 1) {
        ctx.fillRect(3, g * 2 - 0.5, 2, 1);
      }

      if (isPlayer) this.drawUSInsignia(0, -15, 3.2, true);
    } else if (m === 'a1h') {
      // ════ Douglas A-1H Skyraider: Heavy Armor, Wide Wings, 15 Pylons ════
      ctx.fillStyle = '#061322';
      // Bulky deep fuselage with Wright R-3350 Duplex-Cyclone
      ctx.beginPath();
      ctx.ellipse(2, 0, 15, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wide broad straight wings (Wingspan 40)
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(3, -20);
      ctx.lineTo(5, -20);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 20);
      ctx.lineTo(3, 20);
      ctx.lineTo(-5, 20);
      ctx.lineTo(-5, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(1, -1.7, 5, 3.4);

      // 4 wing-mounted 20mm M3 cannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      for (const cy of [-8, -6, 6, 8]) {
        ctx.beginPath();
        ctx.moveTo(3, cy);
        ctx.lineTo(8, cy);
        ctx.stroke();
      }

      // Big 4-blade prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(17, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Dive brakes on fuselage sides
      ctx.fillStyle = '#455A64';
      ctx.fillRect(-6, -4.8, 5, 1.2);
      ctx.fillRect(-6, 3.6, 5, 1.2);

      if (isPlayer) this.drawUSInsignia(0, -13, 3.6);
    } else if (m === 'a37b') {
      // ════ Cessna A-37B Dragonfly: Side-by-Side Twin Cockpit, Wingtip Tip Tanks ════
      ctx.fillStyle = '#061322';
      // Stubby twin-seat fuselage
      ctx.beginPath();
      ctx.ellipse(1, 0, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Side-by-side cockpit canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.beginPath();
      ctx.ellipse(2, 0, 4.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Straight wings with prominent wingtip fuel tanks
      ctx.fillStyle = '#0E241C';
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-4, 15);
      ctx.lineTo(-4, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Distinctive wingtip fuel tanks
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(-6, -17, 8, 2.8);
      ctx.fillRect(-6, 14.2, 8, 2.8);

      // Nose GAU-2B/A Minigun (7.62mm 6-barrel)
      ctx.strokeStyle = '#FFCA28';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(0, -9, 3);
    } else if (m === 'f5a') {
      // ════ Northrop F-5A Freedom Fighter: Slender Area-Ruled Fuselage & Tip Sidewinders ════
      ctx.fillStyle = '#061322';
      // Slender needle nose with coke-bottle waist
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(10, -2.2);
      ctx.lineTo(-6, -3.2);
      ctx.lineTo(-14, -2.4);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-14, 2.4);
      ctx.lineTo(-6, 3.2);
      ctx.lineTo(10, 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Low aspect ratio trapezoidal wings
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(2, -2.6);
      ctx.lineTo(-2, -13);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-5, -2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 2.6);
      ctx.lineTo(-2, 13);
      ctx.lineTo(-6, 13);
      ctx.lineTo(-5, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Slender canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(4, -1.2, 5, 2.4);

      // Wingtip missile launch rails with AIM-9 Sidewinders
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-1, -13.5);
      ctx.lineTo(-8, -13.5);
      ctx.moveTo(-1, 13.5);
      ctx.lineTo(-8, 13.5);
      ctx.stroke();

      // Twin M39A2 20mm cannons in nose upper decking
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(9, -1);
      ctx.lineTo(12, -1);
      ctx.moveTo(9, 1);
      ctx.lineTo(12, 1);
      ctx.stroke();

      if (isPlayer) this.drawUSInsignia(-2, -8, 2.8);
    } else if (m === 'f104g') {
      // ════ Lockheed F-104G Starfighter: Missile with a Man in it, Razor Wings, T-Tail ════
      ctx.fillStyle = '#061322';
      // Extreme needle fuselage (24m long feel)
      ctx.beginPath();
      ctx.moveTo(21, 0);
      ctx.lineTo(12, -2.2);
      ctx.lineTo(-14, -2.4);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, 2.4);
      ctx.lineTo(12, 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Razor-thin trapezoidal stub wings with negative dihedral (droop)
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(0, -2.2);
      ctx.lineTo(-2, -11);
      ctx.lineTo(-6, -11);
      ctx.lineTo(-5, -2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 2.2);
      ctx.lineTo(-2, 11);
      ctx.lineTo(-6, 11);
      ctx.lineTo(-5, 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Forward canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(6, -1.2, 5, 2.4);

      // High T-Tail horizontal stabilizer mounted atop tall vertical fin
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, -6.5);
      ctx.lineTo(-16, 6.5);
      ctx.stroke();

      // Shock cone half-spike engine intakes
      ctx.fillStyle = '#37474F';
      ctx.fillRect(4, -3.2, 4, 1.4);
      ctx.fillRect(4, 1.8, 4, 1.4);

      // Wingtip tiptanks or Sidewinders
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(-7, -12, 7, 2);
      ctx.fillRect(-7, 10, 7, 2);

      if (isPlayer) this.drawUSInsignia(-3, -7, 2.5);
    } else if (m === 'hurricane') {
      // ════ Hawker Hurricane Mk.II: Thick Wing, Rear Stringers, RAF Roundel ════
      ctx.fillStyle = '#061322';
      // Robust fuselage with fabric rear stringers
      ctx.beginPath();
      ctx.ellipse(2, 0, 13, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thick RAF five-spar wings with wide chord
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(4, -17);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-4, 17);
      ctx.lineTo(-4, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Framed greenhouse canopy glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(-1, -1.5, 4.8, 3);

      // 4x 20mm Hispano cannons (Mk.IIc) protruding from wings
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      for (const cy of [-11, -8, 8, 11]) {
        ctx.beginPath();
        ctx.moveTo(3, cy);
        ctx.lineTo(7.5, cy);
        ctx.stroke();
      }

      // Propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(15, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      this.drawRAFRoundel(0, -11, 3.4);
    } else if (m === 'spitfire_v') {
      // ════ Supermarine Spitfire Mk.V: Iconic Elliptical Wings & Merlin Nose ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 13.5, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pure iconic elliptical wings (雙橢圓機翼)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.ellipse(1, 0, 4.5, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(-1, -1.4, 4.8, 2.8);

      // Twin 20mm Hispano cannon fairings & twin .303 brownings
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(3, -8.5);
      ctx.lineTo(8, -8.5);
      ctx.moveTo(3, 8.5);
      ctx.lineTo(8, 8.5);
      ctx.stroke();

      // Elliptical tailplane
      ctx.beginPath();
      ctx.ellipse(-9, 0, 2.5, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3-blade Rotol prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(16, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      this.drawRAFRoundel(1, -11, 3.3);
    } else if (m === 'beaufighter') {
      // ════ Bristol Beaufighter: Twin Hercules Radials, Blunt Nose, Torpedo ════
      ctx.fillStyle = '#061322';
      // Blunt heavy nose
      ctx.beginPath();
      ctx.ellipse(1, 0, 16, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thick straight-taper wings (Wingspan 38)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(4, -19);
      ctx.lineTo(6, -19);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 19);
      ctx.lineTo(4, 19);
      ctx.lineTo(-4, 19);
      ctx.lineTo(-4, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pilot & observer glass canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(5, -1.7, 5, 3.4);

      // Twin Bristol Hercules radial engines
      for (const ey of [-8.5, 8.5]) {
        ctx.fillStyle = '#263238';
        ctx.fillRect(-1, ey - 3, 10, 6);
        ctx.strokeRect(-1, ey - 3, 10, 6);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(9, ey, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Torpedo mounted under belly
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      this.drawRAFRoundel(1, -13, 3.5);
    } else if (m === 'swordfish') {
      // ════ Fairey Swordfish: Stringbag Biplane, Struts, Slung Torpedo ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 14, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Upper and lower biplane wings
      ctx.fillStyle = '#0B1D20';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(3, -19);
      ctx.lineTo(3, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-3, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Interplane struts & bracing wires
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1;
      for (const sx of [-13, -7, 7, 13]) {
        ctx.strokeRect(-2, sx - 1, 4, 2);
      }

      // Slung 18-inch aerial torpedo
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();

      this.drawRAFRoundel(0, -12, 3.2);
    } else if (m === 'spitfire_xiv') {
      // ════ Supermarine Spitfire Mk.XIV: 5-Blade Griffon, Bubble Canopy, Pointed Rudder ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Elliptical wings with E-wing armament (2x 20mm + 2x .50 cal)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.ellipse(1, 0, 4.4, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pointed rudder & teardrop bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5-blade Rotol propeller
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(17, 0, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      this.drawRAFRoundel(1, -11, 3.4);
    } else if (m === 'tempest') {
      // ════ Hawker Tempest Mk.V: Chin Radiator Beard, Laminar Elliptical Wings ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Huge chin annular radiator scoop under nose ("bearded smile")
      ctx.fillStyle = '#263238';
      ctx.fillRect(8, -2.5, 6, 5);
      ctx.strokeStyle = '#FFD54F';
      ctx.strokeRect(8, -2.5, 6, 5);

      // Semi-elliptical laminar flow wings
      ctx.fillStyle = '#0B1D20';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(3, -18);
      ctx.lineTo(5, -18);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 18);
      ctx.lineTo(3, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(0, -1.5, 4.5, 3);

      // 4x 20mm Hispano Mk.V short barrel flush cannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.4;
      for (const cy of [-11, -8, 8, 11]) {
        ctx.beginPath();
        ctx.moveTo(3, cy);
        ctx.lineTo(6, cy);
        ctx.stroke();
      }

      this.drawRAFRoundel(1, -12, 3.4);
    } else if (m === 'mosquito') {
      // ════ De Havilland Mosquito FB.VI "Wooden Wonder": Twin Merlins, Elegant Swept Fin ════
      ctx.fillStyle = '#061322';
      // Extremely sleek plywood monocoque fuselage
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pointed swept wings (Wingspan 38)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(4, -19);
      ctx.lineTo(6, 0);
      ctx.lineTo(4, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-3, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit greenhouse glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(6, -1.6, 5, 3.2);

      // Twin Rolls-Royce Merlin nacelles
      for (const ey of [-8, 8]) {
        ctx.fillStyle = '#263238';
        ctx.fillRect(-1, ey - 2.6, 12, 5.2);
        ctx.strokeRect(-1, ey - 2.6, 12, 5.2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(11, ey, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4x .303 Browning in nose + 4x 20mm Hispano in belly
      ctx.fillStyle = '#FFD54F';
      for (let g = -1.5; g <= 1.5; g += 1) {
        ctx.fillRect(17, g * 1.2 - 0.5, 2, 1);
      }

      this.drawRAFRoundel(1, -13, 3.5);
    } else if (m === 'lancaster') {
      // ════ Avro Lancaster B.I: 4 Merlins, Twin Endplate Rudders, 33ft Bomb Bay ════
      ctx.fillStyle = '#071626';
      // Long heavy bomber slab fuselage
      ctx.beginPath();
      ctx.ellipse(4, 0, 24, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad tapering wings (Wingspan 56)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(6, -28);
      ctx.lineTo(8, -28);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 28);
      ctx.lineTo(6, 28);
      ctx.lineTo(-5, 28);
      ctx.lineTo(-5, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flight deck greenhouse glass
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(9, -2.1, 5.5, 4.2);

      // 4 Merlin engines
      for (const ey of [-19, -11, 11, 19]) {
        ctx.fillStyle = '#263238';
        ctx.fillRect(-1, ey - 2.4, 12, 4.8);
        ctx.strokeRect(-1, ey - 2.4, 12, 4.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(11, ey, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Massive Twin Endplate Rudders on tailplane
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(-18, 12);
      ctx.stroke();
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-20, -13.5, 4, 3);
      ctx.fillRect(-20, 10.5, 4, 3);

      this.drawRAFRoundel(2, -20, 4);
    } else if (m === 'meteor') {
      // ════ Gloster Meteor F.8: Twin Derwent Turbojets Mid-Wing, Early Jet Fighter ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 15, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Straight wings with two large Derwent turbojet nacelles breaking through mid-wing
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(4, 0);
      ctx.lineTo(2, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(4, -1.4, 4.8, 2.8);

      // Twin Derwent engine tubes
      for (const ey of [-8, 8]) {
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-6, ey - 2.8, 14, 5.6);
        ctx.strokeRect(-6, ey - 2.8, 14, 5.6);
      }

      // T-Tail high cruciform tail
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(-12, 7);
      ctx.stroke();

      this.drawRAFRoundel(0, -13, 3.4);
    } else if (m === 'sea_fury') {
      // ════ Hawker Sea Fury FB.11: Centaurus 18-Cyl Radial, 5-Blade Rotol, FAA Paint ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 14, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Semi-elliptical wings
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(5, -17);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-4, 17);
      ctx.lineTo(-4, -17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.52)';
      ctx.fillRect(0, -1.6, 4.8, 3.2);

      // 4x 20mm Hispano Mk.V cannons
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.6;
      for (const cy of [-10, -7.5, 7.5, 10]) {
        ctx.beginPath();
        ctx.moveTo(3, cy);
        ctx.lineTo(7, cy);
        ctx.stroke();
      }

      // 5-blade Rotol prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(16, 0, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      this.drawRAFRoundel(1, -11, 3.4);
    } else if (m === 'rokaf_p51') {
      // ════ ROKAF F-51D Mustang: ROKAF Taegeuk Roundel & Korean War Combat Fighter ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 14, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Laminar flow wings
      ctx.fillStyle = '#0D2235';
      ctx.beginPath();
      ctx.moveTo(4, -16);
      ctx.lineTo(6, -16);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 16);
      ctx.lineTo(4, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Belly radiator scoop
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-4, -2, 6, 4);

      // Bubble canopy
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4-blade prop
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(17, 0, 7, 0, Math.PI * 2);
      ctx.stroke();

      this.drawROKAFRoundel(1, -10, 3.2);
    } else if (m === 'firefly_as5') {
      // ════ Fairey Firefly AS.5: Griffon Chin Radiator, ASH Wing Pod Radar ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 15, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad elliptical wings
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(3, -18);
      ctx.lineTo(5, 0);
      ctx.lineTo(3, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tandem cockpit canopies
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.fillRect(0, -1.6, 6, 3.2);

      // Distinctive ASH radar pod slung under starboard wing leading edge
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(4, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chin radiator scoop
      ctx.fillRect(8, -2.5, 5, 5);

      this.drawRAFRoundel(0, -11, 3.4);
    } else if (m === 'mirage3') {
      // ════ Dassault Mirage IIIE: Pure Tailless Delta Wing, Shock-Cone Intakes ════
      ctx.fillStyle = '#061322';
      // Long slender conical nose
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(9, -2.5);
      ctx.lineTo(-14, -3.2);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-14, 3.2);
      ctx.lineTo(9, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pure 60° Delta Wing (無尾翼三角翼)
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-14, -17);
      ctx.lineTo(-14, 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(4, -1.3, 5, 2.6);

      // Half-cone shock spikes on air intakes
      ctx.fillStyle = '#37474F';
      ctx.fillRect(5, -3.8, 4, 1.4);
      ctx.fillRect(5, 2.4, 4, 1.4);

      // French Armée de l'Air roundel
      this.drawRAFRoundel(-5, -8, 3);
    } else if (m === 'hunter_fga9') {
      // ════ Hawker Hunter FGA.9: Curved Wing-Root Intakes, Dogtooth Swept Wings ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(3, 0, 16, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Swept wings with wing-root air intakes
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -16);
      ctx.lineTo(-7, -16);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 16);
      ctx.lineTo(-3, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(4, -1.4, 5, 2.8);

      // 4x 30mm ADEN cannon pack in lower forward fuselage
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(7, -1.8, 3, 3.6);

      this.drawRAFRoundel(-1, -10, 3.2);
    } else if (m === 'tornado_gr1' || m === 'tornado_ids') {
      // ════ Panavia Tornado GR.1 / IDS: Swing-Wing Strike Bomber, Twin RB199, Tall Fin ════
      ctx.fillStyle = '#061322';
      // Heavy twin-engine box fuselage
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(12, -3.5);
      ctx.lineTo(-14, -4.5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, 4.5);
      ctx.lineTo(12, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Variable sweep wings swept at 45°
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(4, -3.5);
      ctx.lineTo(-5, -17);
      ctx.lineTo(-9, -17);
      ctx.lineTo(-3, -3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 3.5);
      ctx.lineTo(-5, 17);
      ctx.lineTo(-9, 17);
      ctx.lineTo(-3, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tandem canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(5, -1.6, 6, 3.2);

      // Huge tall swept vertical tail
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-16, -1.5, 7, 3);

      // Box air intakes
      ctx.fillRect(3, -4.8, 5, 1.6);
      ctx.fillRect(3, 3.2, 5, 1.6);

      // JP233 or ALARM/Sea Eagle pods under fuselage
      if (m === 'tornado_ids') {
        ctx.fillStyle = '#FFE082';
        ctx.fillRect(-4, -2.5, 10, 5);
      }

      this.drawRAFRoundel(-5, -10, 3.2);
    } else if (m === 'tornado_adv') {
      // ════ Panavia Tornado ADV F.3: Stretched Radome, Semi-Recessed Skyflash SARH ════
      ctx.fillStyle = '#061322';
      // Stretched interceptor nose for Foxhunter radar
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(12, -3.5);
      ctx.lineTo(-14, -4.5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, 4.5);
      ctx.lineTo(12, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Variable sweep wings swept at 25° for high altitude patrol
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(4, -3.5);
      ctx.lineTo(-2, -18);
      ctx.lineTo(-6, -18);
      ctx.lineTo(-2, -3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 3.5);
      ctx.lineTo(-2, 18);
      ctx.lineTo(-6, 18);
      ctx.lineTo(-2, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tandem interceptor canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(5, -1.6, 6.5, 3.2);

      // 4x Skyflash SARH semi-recessed in fuselage belly
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.4;
      for (const my of [-2, 2]) {
        ctx.beginPath();
        ctx.moveTo(1, my);
        ctx.lineTo(7, my);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-7, my);
        ctx.lineTo(-1, my);
        ctx.stroke();
      }

      this.drawRAFRoundel(-4, -11, 3.2);
    } else if (m === 'mirage2000') {
      // ════ Dassault Mirage 2000C: Blended Cambered Delta, Super 530D SARH ════
      ctx.fillStyle = '#061322';
      // Needle nose with blended fuselage-wing fillets
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(10, -2.6);
      ctx.lineTo(-13, -3.6);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-13, 3.6);
      ctx.lineTo(10, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Large cambered delta wing
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-12, -18);
      ctx.lineTo(-14, -18);
      ctx.lineTo(-13, 0);
      ctx.lineTo(-14, 18);
      ctx.lineTo(-12, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubble canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.6)';
      ctx.fillRect(5, -1.3, 5.2, 2.6);

      // 2x Matra Super 530D SARH under wings
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-2, -9);
      ctx.lineTo(5, -9);
      ctx.moveTo(-2, 9);
      ctx.lineTo(5, 9);
      ctx.stroke();

      // French roundel
      this.drawRAFRoundel(-4, -9, 3);
    } else if (m === 'jaguar_gr1') {
      // ════ SEPECAT Jaguar GR.1: High Shoulder Wings, Over-Wing Rails, Chiseled Nose ════
      ctx.fillStyle = '#061322';
      // Long chiseled nose with Ferranti LRMTS chisel
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(11, -2.5);
      ctx.lineTo(-14, -3.5);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-14, 3.5);
      ctx.lineTo(11, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shoulder mounted swept wings with anhedral (droop)
      ctx.fillStyle = '#0B1D20';
      ctx.beginPath();
      ctx.moveTo(3, -2.5);
      ctx.lineTo(-4, -14);
      ctx.lineTo(-7, -14);
      ctx.lineTo(-4, -2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 2.5);
      ctx.lineTo(-4, 14);
      ctx.lineTo(-7, 14);
      ctx.lineTo(-4, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(5, -1.3, 5, 2.6);

      // Iconic OVER-WING missile pylons (Magic/Sidewinder mounted ON TOP of wing)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, -7.5);
      ctx.lineTo(-6, -7.5);
      ctx.moveTo(-1, 7.5);
      ctx.lineTo(-6, 7.5);
      ctx.stroke();

      this.drawRAFRoundel(-3, -9, 3);
    } else if (m === 'viggen_ja37') {
      // ════ Saab JA 37 Viggen: Double Delta with Foreplane Canards, RBS-15F ════
      ctx.fillStyle = '#061322';
      // Muscular delta fuselage with big Volvo RM8B afterburning turbofan
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(10, -3.4);
      ctx.lineTo(-13, -4.5);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-13, 4.5);
      ctx.lineTo(10, 3.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Distinctive Foreplane Canards with flaps (前置主翼鴨翼)
      ctx.fillStyle = '#0D2234';
      ctx.beginPath();
      ctx.moveTo(10, -2.5);
      ctx.lineTo(6, -8.5);
      ctx.lineTo(4, -8.5);
      ctx.lineTo(6, -2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, 2.5);
      ctx.lineTo(6, 8.5);
      ctx.lineTo(4, 8.5);
      ctx.lineTo(6, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Main Double Delta Wing
      ctx.beginPath();
      ctx.moveTo(3, -3.5);
      ctx.lineTo(0, -9);
      ctx.lineTo(-13, -17);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-13, 17);
      ctx.lineTo(0, 9);
      ctx.lineTo(3, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Canopy glint
      ctx.fillStyle = 'rgba(128, 222, 234, 0.58)';
      ctx.fillRect(5, -1.4, 5, 2.8);

      // Swedish Air Force Tre Kronor (Three Crowns) roundel
      ctx.fillStyle = '#0D47A1';
      ctx.beginPath();
      ctx.arc(-5, -9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(-5, -10, 0.9, 0, Math.PI * 2);
      ctx.arc(-6, -8.2, 0.9, 0, Math.PI * 2);
      ctx.arc(-4, -8.2, 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'be12') {
      // ════ Beriev Be-12 Chayka: Soviet Twin-Turboprop Gull-Wing ASW Flying Boat ════
      ctx.fillStyle = '#18131A';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.7;

      // Flying-boat chine fuselage with glazed navigator nose & rear MAD tail sting
      ctx.beginPath();
      ctx.moveTo(21, 0);
      ctx.lineTo(15, -3.4);
      ctx.lineTo(2, -4.4);
      ctx.lineTo(-17, -2.8);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-17, 2.8);
      ctx.lineTo(2, 4.4);
      ctx.lineTo(15, 3.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // High gull-wing parasol wing with wingtip stabilizing floats
      ctx.beginPath();
      ctx.moveTo(4, -27);
      ctx.lineTo(-3, -27);
      ctx.lineTo(-5, -4);
      ctx.lineTo(5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, 27);
      ctx.lineTo(-3, 27);
      ctx.lineTo(-5, 4);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wingtip floats
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-1, -29, 7, 2.5);
      ctx.fillRect(-1, 26.5, 7, 2.5);

      // Twin Ivchenko AI-20D turboprop nacelles & spinning prop discs
      ctx.fillRect(1, -11.5, 9, 3.4);
      ctx.fillRect(1, 8.1, 9, 3.4);
      ctx.strokeStyle = 'rgba(255, 138, 128, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(10.5, -9.8, 5, 0, Math.PI * 2);
      ctx.arc(10.5, 9.8, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Twin vertical H-tail fins & extended rear MAD sting boom
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-18, -9.5);
      ctx.lineTo(-18, 9.5);
      ctx.moveTo(-16, -9.5);
      ctx.lineTo(-20.5, -9.5);
      ctx.moveTo(-16, 9.5);
      ctx.lineTo(-20.5, 9.5);
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(-21, 0);
      ctx.lineTo(-28, 0);
      ctx.stroke();

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(0, -19, 2.8, 0, Math.PI * 2);
      ctx.arc(0, 19, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (m === 'il38') {
      // ════ Ilyushin Il-38 May: Soviet 4-Turboprop Long-Range ASW Maritime Patrol ════
      ctx.fillStyle = '#181218';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.9;

      // Long cylindrical patrol fuselage
      ctx.beginPath();
      ctx.ellipse(2, 0, 23, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Forward ventral Berkut search radar bulge
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.ellipse(15, 0, 5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Straight-tapered long-span patrol wings (mounted forward of CG)
      ctx.fillStyle = '#181218';
      ctx.beginPath();
      ctx.moveTo(8, -4.5);
      ctx.lineTo(1, -34);
      ctx.lineTo(-5, -34);
      ctx.lineTo(-3, -4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(8, 4.5);
      ctx.lineTo(1, 34);
      ctx.lineTo(-5, 34);
      ctx.lineTo(-3, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4 Ivchenko AI-20M turboprop nacelles & 4 prop discs
      ctx.fillStyle = '#37474F';
      for (const ny of [-12, -23, 9, 20]) {
        ctx.fillRect(0, ny, 9, 3.2);
      }
      ctx.strokeStyle = 'rgba(255, 138, 128, 0.65)';
      ctx.lineWidth = 1.1;
      for (const py of [-10.4, -21.4, 10.6, 21.6]) {
        ctx.beginPath();
        ctx.arc(9.5, py, 4.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Horizontal stabilizer & Rear MAD sting boom
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-18, -11);
      ctx.lineTo(-22, -11);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-22, 11);
      ctx.lineTo(-18, 11);
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.beginPath();
      ctx.moveTo(-21, 0);
      ctx.lineTo(-29, 0);
      ctx.stroke();

      // Red Stars
      ctx.fillStyle = '#D50000';
      ctx.beginPath();
      ctx.arc(-2, -28, 3, 0, Math.PI * 2);
      ctx.arc(-2, 28, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default Generic Plane
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(2, 0, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // ══════════════════════════════════════════════════════════
    // VISIBLE MOUNTED ORDNANCE UNDER AIRFRAME
    // ══════════════════════════════════════════════════════════
    if (plane.hasPayload) {
      const pType = plane.payloadType;

      if (pType === 'bomb_500') {
        // 500lb GP Bomb mounted under fuselage center rack
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(5, 0);
        ctx.stroke();
        // Tail fins
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-2, -1.8);
        ctx.lineTo(-2, 1.8);
        ctx.stroke();
      } else if (pType === 'bomb_1000') {
        // 1000lb Armor-Piercing Heavy Bomb
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-3, -2, 2, 4);
      } else if (pType === 'bombs_dual_500') {
        // Dual 500lb bombs on twin wing racks
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-1, -7);
        ctx.lineTo(5, -7);
        ctx.moveTo(-1, 7);
        ctx.lineTo(5, 7);
        ctx.stroke();
      } else if (pType === 'bomb_1600') {
        // 1600lb Super Heavy Armor-Piercing Bomb
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
      } else if (pType === 'aerial_torpedo') {
        // Mk 13 Aerial Torpedo with bronze warhead
        ctx.strokeStyle = '#80DEEA';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        ctx.fillStyle = '#FFE082';
        ctx.beginPath();
        ctx.arc(8, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 'hvar_rockets') {
        // 8x HVAR 5" High-Velocity Rockets under wing rails
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 1.2;
        for (let r = 1; r <= 4; r++) {
          const ry = 4 + r * 2.5;
          ctx.beginPath();
          ctx.moveTo(-1, ry);
          ctx.lineTo(5, ry);
          ctx.moveTo(-1, -ry);
          ctx.lineTo(5, -ry);
          ctx.stroke();
        }
      } else if (pType === 'depth_bombs') {
        // 4x Depth Bombs in belly bay
        ctx.strokeStyle = '#80DEEA';
        ctx.lineWidth = 2;
        for (let d = -2; d <= 1; d++) {
          ctx.strokeRect(d * 3.5, -1.8, 2.6, 3.6);
        }
      } else if (pType === 'scout_depth_charge') {
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(1, -10, 3, 2);
        ctx.strokeRect(1, 8, 3, 2);
      } else if (pType === 'aim9_sidewinder') {
        // AIM-9 Sidewinder: Slender white heat-seeking missiles on wing rails
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        for (const my of [-10, 10]) {
          ctx.beginPath();
          ctx.moveTo(-2, my);
          ctx.lineTo(6, my);
          ctx.stroke();
          // Yellow seeker head
          ctx.fillStyle = '#FFD54F';
          ctx.beginPath();
          ctx.arc(6, my, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pType === 'aim7_sparrow') {
        // AIM-7 Sparrow: Radar-guided missiles with triangular mid-wings
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 2.0;
        for (const my of [-4, 4]) {
          ctx.beginPath();
          ctx.moveTo(-4, my);
          ctx.lineTo(5, my);
          ctx.stroke();
          // Triangular mid-wings
          ctx.strokeStyle = '#78909C';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(1, my - 2);
          ctx.lineTo(1, my + 2);
          ctx.stroke();
        }
      } else if (pType === 'agm12_bullpup') {
        // AGM-12 Bullpup: Heavy air-to-ground missile
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.strokeRect(-2, -7, 8, 2);
        ctx.strokeRect(-2, 5, 8, 2);
      } else if (pType === 'agm45_shrike') {
        // AGM-45 Shrike: Anti-Radiation Missile with dark radome & large delta wings
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 2.0;
        for (const my of [-8, 8]) {
          ctx.beginPath();
          ctx.moveTo(-3, my);
          ctx.lineTo(6, my);
          ctx.stroke();
          // Dark dielectric seeker nose
          ctx.fillStyle = '#263238';
          ctx.beginPath();
          ctx.arc(6, my, 1.2, 0, Math.PI * 2);
          ctx.fill();
          // Large cruciform wings
          ctx.strokeStyle = '#B0BEC5';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(1, my - 2.5);
          ctx.lineTo(1, my + 2.5);
          ctx.stroke();
        }
      } else if (pType === 'agm62_walleye') {
        // AGM-62 Walleye: TV-Guided Glide Bomb with 4 long delta wings
        ctx.fillStyle = '#CFD8DC';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 1.5;
        for (const wy of [-7, 7]) {
          ctx.fillRect(-2, wy - 1.5, 9, 3);
          ctx.strokeRect(-2, wy - 1.5, 9, 3);
          // Glass optical seeker dome
          ctx.fillStyle = '#80DEEA';
          ctx.beginPath();
          ctx.arc(7, wy, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pType === 'bombs_snakeye_retarded') {
        // Mk 82 Snakeye: Low-altitude retarded bombs with cross drag fins
        ctx.strokeStyle = '#8BC34A';
        ctx.lineWidth = 2.2;
        for (const by of [-8, -5, 5, 8]) {
          ctx.beginPath();
          ctx.moveTo(-2, by);
          ctx.lineTo(4, by);
          ctx.stroke();
          // Cruciform retarder fins
          ctx.strokeStyle = '#558B2F';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-2, by - 1.6);
          ctx.lineTo(-2, by + 1.6);
          ctx.stroke();
        }
      } else if (pType === 'b52_megaton_carpet') {
        // Heavy multi-cluster bomb racks in Arc Light bay
        ctx.fillStyle = '#558B2F';
        for (let r = -2; r <= 2; r++) {
          ctx.fillRect(r * 4 - 2, -3.2, 3.5, 6.4);
        }
      } else if (pType === 'ffar_rockets_pod') {
        // LAU-3/A 70mm FFAR 19-tube Rocket Pods
        ctx.fillStyle = '#ECEFF1';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 1.2;
        for (const ry of [-8, 8]) {
          ctx.fillRect(-2, ry - 2, 7, 4);
          ctx.strokeRect(-2, ry - 2, 7, 4);
          // Red pod nose fairing
          ctx.fillStyle = '#FF5252';
          ctx.beginPath();
          ctx.arc(5, ry, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pType === 'helo_assault_troops') {
        // Marine Air Assault Combat Squad mounted
        ctx.fillStyle = '#00E676';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('USMC', 0, -6);
      } else if (pType === 'c1_paratroopers') {
        // Airborne Paratroopers
        ctx.fillStyle = '#80DEEA';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AIRBORNE', 0, -6);
      } else if (pType === 'aim7_aim9_combo') {
        // 2x semi-recessed AIM-7 Sparrows + 2x AIM-9 Sidewinders
        ctx.fillStyle = '#ECEFF1';
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 1.1;
        // Semi-recessed fuselage belly Sparrows
        ctx.fillRect(-2, -2.2, 8, 1.8);
        ctx.fillRect(-2, 0.4, 8, 1.8);
        // Outer wing Sidewinders with yellow rollerons
        ctx.strokeStyle = '#FFE082';
        for (const sy of [-11, 11]) {
          ctx.beginPath();
          ctx.moveTo(-1, sy);
          ctx.lineTo(5, sy);
          ctx.stroke();
          ctx.fillStyle = '#FF9800';
          ctx.fillRect(-1.5, sy - 1, 1.2, 2);
        }
      } else if (pType === 'gbu10_laser_paveway') {
        // GBU-10 2,000lb Paveway I Laser-Guided Bomb
        ctx.fillStyle = '#558B2F';
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 1.2;
        for (const gy of [-7, 7]) {
          ctx.fillRect(-3, gy - 2, 10, 4);
          ctx.strokeRect(-3, gy - 2, 10, 4);
          // Laser seeker ring airfoil head
          ctx.fillStyle = '#80DEEA';
          ctx.beginPath();
          ctx.arc(8, gy, 1.6, 0, Math.PI * 2);
          ctx.fill();
          // Cruciform tail guidance fins
          ctx.strokeStyle = '#8BC34A';
          ctx.beginPath();
          ctx.moveTo(-3, gy - 3);
          ctx.lineTo(-3, gy + 3);
          ctx.stroke();
        }
      } else if (pType === 'cbu_cluster_bombs') {
        // CBU-24 / Rockeye Cluster Dispenser Canisters
        ctx.fillStyle = '#689F38';
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 1;
        for (const cy of [-9, -5, 5, 9]) {
          ctx.fillRect(-2, cy - 1.5, 7, 3);
          ctx.strokeRect(-2, cy - 1.5, 7, 3);
          // Yellow ID stripes
          ctx.fillStyle = '#FFEB3B';
          ctx.fillRect(0, cy - 1.5, 1.5, 3);
        }
      } else if (pType === 'blu27_napalm') {
        // BLU-27 750lb Streamlined Aluminum Napalm Canisters
        ctx.fillStyle = '#CFD8DC';
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 1.1;
        for (const ny of [-8, -4, 4, 8]) {
          ctx.beginPath();
          ctx.ellipse(1, ny, 4.5, 1.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Red thermal igniter nose
          ctx.fillStyle = '#FF5252';
          ctx.beginPath();
          ctx.arc(5.5, ny, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pType === 'agm78_standard_arm') {
        // AGM-78 Standard ARM (Long-range heavy anti-radiation missile)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FF3D00';
        ctx.lineWidth = 1.2;
        for (const ay of [-8, 8]) {
          ctx.fillRect(-4, ay - 1.8, 12, 3.6);
          ctx.strokeRect(-4, ay - 1.8, 12, 3.6);
          // Long dorsal strakes
          ctx.fillStyle = '#FF5252';
          ctx.fillRect(-1, ay - 2.8, 6, 1);
          ctx.fillRect(-1, ay + 1.8, 6, 1);
        }
      } else if (pType === 'mer_iron_bombs') {
        // MER Multiple Ejector Racks (Dense stick of 500lb bombs)
        ctx.fillStyle = '#558B2F';
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 1;
        for (const side of [-8, 8]) {
          // 3x2 bomb rack per wing
          for (let row = -1; row <= 1; row++) {
            ctx.fillRect(row * 3 - 2, side - 2, 2.8, 1.8);
            ctx.fillRect(row * 3 - 2, side + 0.4, 2.8, 1.8);
          }
        }
      }
    }

    // Wingtip aerodynamic condensation trails during turns/dives
    if (plane.altitude > 0.3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -15);
      ctx.lineTo(-9, -15);
      ctx.moveTo(-2, 15);
      ctx.lineTo(-9, 15);
      ctx.stroke();
    }

    // ════ Propulsion Visuals: Jet Supersonic Exhaust vs. Propeller Disc ════
    const jetModels = new Set([
      'f8', 'f4b', 'f4j', 'f4e', 'a4', 'a6a', 'a6b_weasel', 'f105', 'b52', 'a7',
      'f9f', 'f2h', 'f3h', 'f86', 'mig15', 'mig17', 'mig19', 'mig21', 'su7', 'il28', 'tu16',
      'tu14', 'me262', 'ohka', 'kikka', 'meteor',
      // Era 5 Cold War Jets (冷戰噴射戰機群，絕無螺旋槳)
      'f14a', 'fa18a', 's3a', 'a6e', 'ea6b', 'av8b', 'a10a', 'f15a', 'f16a', 'e3a', 'f111',
      'tu22m3', 'yak38', 'mig29a', 'su27', 'a50', 'su25'
    ]);
    const heloModels = new Set([
      'uh2', 'ch46', 'uh1', 'ah1', 'ho3s1', 'hup', 'hrs',
      // Era 5 Helicopters:
      'sh3f', 'ch53', 'ah64a', 'ah1w', 'ka27', 'mi24'
    ]);
    const multiPropModels = new Set([
      'b17', 'b24', 'b25', 'b29', 'g4m', 'p38', 'c47', 'c1', 's2', 'e1', 'ov10', 'a20', 'a26',
      // Era 4/5 Turboprops / Patrol / Transports (多發渦輪螺旋槳/反潛巡邏機):
      'e2c', 'c2a', 'c130', 'tu95', 'be12', 'il38'
    ]);

    const isJet = jetModels.has(m);
    const isHelo = heloModels.has(m);
    const isMultiProp = multiPropModels.has(m);

    if (isJet) {
      // ════ Jet Exhaust Heat Shimmer & Supersonic Plume (噴射機無螺旋槳，繪製尾噴熾熱焰錐) ════
      const jetFlameLen = (plane.speed > (plane.maxSpeed * 0.75) ? 9 : 5) + Math.sin(this.time * 30) * 2;
      const jGrad = ctx.createLinearGradient(-13, 0, -13 - jetFlameLen, 0);
      jGrad.addColorStop(0, 'rgba(128, 222, 234, 0.75)');
      jGrad.addColorStop(0.35, 'rgba(255, 171, 0, 0.6)');
      jGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
      ctx.strokeStyle = jGrad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(-13 - jetFlameLen, 0);
      ctx.stroke();
    } else if (!isHelo && !isMultiProp) {
      // Spinning propeller blur with yellow tip blades (僅限單發螺旋槳機)
      const propAngle = this.time * 26;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(13, 0, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(13 + Math.cos(propAngle) * 4, Math.sin(propAngle) * 4);
      ctx.lineTo(13 + Math.cos(propAngle) * 5.5, Math.sin(propAngle) * 5.5);
      ctx.moveTo(13 - Math.cos(propAngle) * 4, -Math.sin(propAngle) * 4);
      ctx.lineTo(13 - Math.cos(propAngle) * 5.5, -Math.sin(propAngle) * 5.5);
      ctx.stroke();
    }
  }

  // Draw Projectiles with Authentic WWII Tracers, Ballistic Arcs & Cavitation Wakes
  public drawProjectiles(projectiles: Projectile[], camera: Camera) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const proj of projectiles) {
      if (proj.isDead) continue;
      if (!this.isWorldCircleVisible(proj.pos.x, proj.pos.y, 300, camera)) continue;

      if (proj.type === 'shell') {
        // High-Angle Ballistic Naval Artillery Trajectory
        const maxAlt = proj.blastRadius > 25 ? 65 : 45;
        const alt = Math.sin(proj.flightProgress * Math.PI) * maxAlt;

        // 1. Water surface ballistic shadow (tracks directly underneath shell)
        const shadowAlpha = 0.45 * (1 - alt / maxAlt * 0.5);
        ctx.fillStyle = `rgba(3, 8, 16, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(proj.pos.x, proj.pos.y, 3.5, 2, proj.heading, 0, Math.PI * 2);
        ctx.fill();

        // 2. Trailing propellant smoke wisp
        if (proj.flightProgress > 0.1) {
          ctx.strokeStyle = 'rgba(255, 171, 0, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - proj.vel.x * 0.03, (proj.pos.y - proj.vel.y * 0.03) - alt * 0.95);
          ctx.lineTo(proj.pos.x, proj.pos.y - alt);
          ctx.stroke();
        }

        // 3. Incandescent artillery shell body in mid-air
        const isPl = proj.side === 'player';
        // Outer radiant fireball glow
        ctx.fillStyle = isPl ? 'rgba(255, 193, 7, 0.45)' : 'rgba(255, 87, 34, 0.45)';
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y - alt, proj.blastRadius > 25 ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();

        // White-hot core
        ctx.fillStyle = isPl ? '#FFF9C4' : '#FFCCBC';
        ctx.strokeStyle = isPl ? '#FF8F00' : '#D84315';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y - alt, proj.blastRadius > 25 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (proj.type === 'rocket') {
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);

        if (proj.isTinyTim) {
          // ════ 11.75" Tiny Tim Heavy Standoff Rocket ════
          // Giant billowing dense rocket exhaust smoke
          ctx.strokeStyle = 'rgba(238, 238, 238, 0.75)';
          ctx.lineWidth = 5.0;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 50, proj.pos.y - sinH * 50);
          ctx.lineTo(proj.pos.x - cosH * 16, proj.pos.y - sinH * 16);
          ctx.stroke();

          // Roaring booster exhaust flame
          const flamePulse = (Math.sin(this.time * 28) + 1) * 0.5;
          ctx.strokeStyle = '#FF3D00';
          ctx.lineWidth = 6.0;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * (22 + flamePulse * 8), proj.pos.y - sinH * (22 + flamePulse * 8));
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          ctx.strokeStyle = '#FFEB3B';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 14, proj.pos.y - sinH * 14);
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          // Heavy cylindrical steel rocket body & cruciform fins
          ctx.save();
          ctx.translate(proj.pos.x, proj.pos.y);
          ctx.rotate(proj.heading);
          ctx.fillStyle = '#37474F';
          ctx.fillRect(-12, -2.5, 14, 5);
          // Dark steel armor piercing ogive head
          ctx.fillStyle = '#78909C';
          ctx.beginPath();
          ctx.ellipse(3, 0, 4.5, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Large cruciform tail stabilizer fins
          ctx.fillStyle = '#263238';
          ctx.fillRect(-12, -4.5, 3.5, 9);
          ctx.restore();
        } else {
          // Standard HVAR 5" High-Velocity Rocket with Fiery Propellant Exhaust & Smoke
          ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 28, proj.pos.y - sinH * 28);
          ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
          ctx.stroke();

          // Fiery exhaust nozzle flame
          const flamePulse = (Math.sin(this.time * 24) + 1) * 0.5;
          ctx.strokeStyle = '#FF3D00';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * (12 + flamePulse * 4), proj.pos.y - sinH * (12 + flamePulse * 4));
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          // Inner incandescent flame core
          ctx.strokeStyle = '#FFEE58';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 8, proj.pos.y - sinH * 8);
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          // Rocket nose tip
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(proj.pos.x, proj.pos.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (proj.type === 'bullet') {
        const isPl = proj.side === 'player';

        if (proj.isBeamTracer) {
          // ════ 連續射擊火神光束 (M61A1 Vulcan / GSh-23 連續雷射狀高亮光束彈幕) ════
          const beamScale = 0.22; // continuous elongated stream
          const bTailX = proj.pos.x - proj.vel.x * beamScale;
          const bTailY = proj.pos.y - proj.vel.y * beamScale;

          ctx.save();
          // 1. 寬幅高亮電離輝光 (Wide Ionization Bloom)
          ctx.strokeStyle = isPl ? 'rgba(255, 235, 59, 0.45)' : 'rgba(255, 61, 0, 0.45)';
          ctx.lineWidth = 6.0;
          ctx.beginPath();
          ctx.moveTo(bTailX, bTailY);
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          // 2. 飽和核心光束 (Saturated Core Tracer)
          ctx.strokeStyle = isPl ? '#FFD54F' : '#FF5252';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(bTailX, bTailY);
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          // 3. 耀眼白熱光芯 (Blinding White-Hot Core)
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(bTailX * 0.35 + proj.pos.x * 0.65, bTailY * 0.35 + proj.pos.y * 0.65);
          ctx.lineTo(proj.pos.x, proj.pos.y);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(proj.pos.x, proj.pos.y, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        // High-Luminous Machine Gun & Autocannon Glowing Tracer Fire (密集群射曳光彈)
        const trailScale = 0.055;
        const tailX = proj.pos.x - proj.vel.x * trailScale;
        const tailY = proj.pos.y - proj.vel.y * trailScale;

        ctx.save();
        // 1. Radiant luminous glow bloom
        ctx.strokeStyle = isPl ? 'rgba(255, 224, 130, 0.65)' : 'rgba(255, 23, 68, 0.75)';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        // 2. High-intensity saturated tracer core
        ctx.strokeStyle = isPl ? '#FFD54F' : '#FF1744';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(tailX * 0.35 + proj.pos.x * 0.65, tailY * 0.35 + proj.pos.y * 0.65);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        // 3. White-hot needle point tip
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX * 0.15 + proj.pos.x * 0.85, tailY * 0.15 + proj.pos.y * 0.85);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (proj.type === 'torpedo') {
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);

        // 1. Dual-line frothy white cavitation bubble wake (60px length)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        // Left wake line
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 60 - sinH * 3, proj.pos.y - sinH * 60 + cosH * 3);
        ctx.lineTo(proj.pos.x - cosH * 14 - sinH * 2, proj.pos.y - sinH * 14 + cosH * 2);
        // Right wake line
        ctx.moveTo(proj.pos.x - cosH * 60 + sinH * 3, proj.pos.y - sinH * 60 - cosH * 3);
        ctx.lineTo(proj.pos.x - cosH * 14 + sinH * 2, proj.pos.y - sinH * 14 - cosH * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Churning water bubble particles along wake
        ctx.fillStyle = 'rgba(224, 247, 250, 0.7)';
        for (let b = 1; b <= 3; b++) {
          const bx = proj.pos.x - cosH * (b * 16);
          const by = proj.pos.y - sinH * (b * 16);
          ctx.beginPath();
          ctx.arc(bx + (Math.sin(this.time * 10 + b) - 0.5) * 4, by + (Math.cos(this.time * 10 + b) - 0.5) * 4, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Underwater phosphorescent cyan glow
        ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
        ctx.beginPath();
        ctx.arc(proj.pos.x, proj.pos.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // 4. Steel-cyan metallic torpedo cylinder
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 18, proj.pos.y - sinH * 18);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        // 5. Heavy bronze / yellow explosive warhead nose
        ctx.fillStyle = '#FFE082';
        ctx.beginPath();
        ctx.arc(proj.pos.x + cosH * 1.5, proj.pos.y + sinH * 1.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Active acoustic sonar homing ping rings (Eras 3 & 4)
        if (proj.isAcousticHoming || proj.acousticPingTimer !== undefined) {
          const pingPhase = ((this.time * 2.5) % 1);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.75 * (1 - pingPhase)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(proj.pos.x + cosH * 2, proj.pos.y + sinH * 2, 6 + pingPhase * 28, 0, Math.PI * 2);
          ctx.stroke();

          // High frequency inner sonar wave
          const innerPhase = ((this.time * 4) % 1);
          ctx.strokeStyle = `rgba(128, 222, 234, ${0.6 * (1 - innerPhase)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(proj.pos.x + cosH * 2, proj.pos.y + sinH * 2, 4 + innerPhase * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (proj.type === 'bomb') {
        const alt = (1 - proj.flightProgress) * 70;
        const isB52Megaton = proj.bombType === 'b52_megaton_nuke';
        const isTacticalNuke =
          proj.bombType === 'tactical_nuke' ||
          proj.bombType === 'tactical_b61_nuke' ||
          proj.bombType === 'opfor_tactical_nuke' ||
          proj.isNuclear === true;
        const isNuke = isB52Megaton || isTacticalNuke;

        // 1. Water surface impact shadow growing larger as bomb drops closer
        const shadowSize = isB52Megaton
          ? 12 + proj.flightProgress * 28
          : isTacticalNuke
          ? 8 + proj.flightProgress * 18
          : 2 + proj.flightProgress * 5;
        const shadowAlpha = isNuke ? 0.45 + proj.flightProgress * 0.4 : 0.25 + proj.flightProgress * 0.4;
        ctx.fillStyle = isNuke ? `rgba(255, 109, 0, ${shadowAlpha})` : `rgba(4, 10, 18, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(proj.pos.x, proj.pos.y, shadowSize, shadowSize * 0.6, proj.heading, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing ground epicenter ground-zero ring for tactical or megaton nuke
        if (isNuke) {
          const pulse = 1 + Math.sin(this.time * 6) * 0.16;
          ctx.strokeStyle = isB52Megaton
            ? `rgba(255, 23, 68, ${0.5 + proj.flightProgress * 0.5})`
            : `rgba(255, 109, 0, ${0.45 + proj.flightProgress * 0.45})`;
          ctx.lineWidth = isB52Megaton ? 3.4 : 2.4;
          ctx.beginPath();
          const blastPreviewR = isB52Megaton ? 72 : 48;
          ctx.arc(proj.targetPos.x, proj.targetPos.y, blastPreviewR * proj.flightProgress * pulse, 0, Math.PI * 2);
          ctx.stroke();

          // Megaton Strategic Crosshair Warning
          if (isB52Megaton) {
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(proj.targetPos.x - 40, proj.targetPos.y);
            ctx.lineTo(proj.targetPos.x + 40, proj.targetPos.y);
            ctx.moveTo(proj.targetPos.x, proj.targetPos.y - 40);
            ctx.lineTo(proj.targetPos.x, proj.targetPos.y + 40);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // 2. Falling bomb in mid-air
        const bx = proj.pos.x;
        const by = proj.pos.y - alt;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(proj.heading + Math.PI / 2);

        if (isTacticalNuke) {
          // Dynamic aerodynamic parachute sway angle (B61 / Mk4 Retarded Nuke)
          const sway = Math.sin(this.time * 4) * 0.16;
          ctx.save();
          ctx.rotate(sway);

          // Parachute cords trailing behind falling nuclear bomb
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(-4, 6);
          ctx.lineTo(-10, 22);
          ctx.moveTo(0, 6);
          ctx.lineTo(0, 23);
          ctx.moveTo(4, 6);
          ctx.lineTo(10, 22);
          ctx.stroke();

          // White Silk Retardation Parachute Canopy
          ctx.fillStyle = 'rgba(250, 250, 250, 0.95)';
          ctx.strokeStyle = '#90CAF9';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 24, 12, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Tactical Nuclear Bomb Casing (B61 streamlined / Mk 4 bulbous shell)
          ctx.fillStyle = proj.bombType === 'tactical_b61_nuke' ? '#ECEFF1' : '#FFC107';
          ctx.strokeStyle = '#E65100';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.ellipse(0, 0, 5.5, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Stabilizer Tail Fins
          ctx.strokeStyle = '#D84315';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(-5.5, 5, 11, 4.5);

          // Radiation Hazard Trefoil Symbol Core
          ctx.fillStyle = '#D50000';
          ctx.beginPath();
          ctx.arc(0, -1, 2.6, 0, Math.PI * 2);
          ctx.fill();

          // Blinking warning beacon on nose tip
          const beaconBlink = Math.sin(this.time * 14) > 0;
          if (beaconBlink) {
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.arc(0, -11, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (isB52Megaton) {
          // ════ B-52 Stratospheric B28/B41 Megaton Thermonuclear Weapon ════
          // Heavy elongated cylindrical thermonuclear casing
          ctx.fillStyle = '#ECEFF1';
          ctx.strokeStyle = '#B71C1C';
          ctx.lineWidth = 2.4;
          ctx.fillRect(-6, -14, 12, 28);
          ctx.strokeRect(-6, -14, 12, 28);

          // Rounded nose cone
          ctx.fillStyle = '#D32F2F';
          ctx.beginPath();
          ctx.arc(0, -14, 6, Math.PI, 0);
          ctx.fill();

          // 4 Cruciform tail stabilizer fins
          ctx.strokeStyle = '#263238';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-11, 10);
          ctx.lineTo(11, 10);
          ctx.moveTo(-11, 14);
          ctx.lineTo(11, 14);
          ctx.stroke();

          // Nuclear hazard badge on casing
          ctx.fillStyle = '#FFEB3B';
          ctx.beginPath();
          ctx.arc(0, 0, 4.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // High-frequency blinking strobe
          if (Math.sin(this.time * 20) > 0) {
            ctx.fillStyle = '#FF1744';
            ctx.beginPath();
            ctx.arc(0, -17, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (proj.isNapalm || proj.bombType === 'napalm_canister') {
          // ════ 凝固汽油燃燒罐 (Napalm Tumbling Canister) ════
          ctx.rotate(proj.tumbleAngle || 0);
          // Cylindrical aluminum tank body
          ctx.fillStyle = '#CFD8DC';
          ctx.strokeStyle = '#78909C';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(-4, -8, 8, 16);
          ctx.fillRect(-4, -8, 8, 16);
          // High-visibility orange danger bands
          ctx.fillStyle = '#FF5722';
          ctx.fillRect(-4, -4, 8, 3);
          ctx.fillRect(-4, 2, 8, 3);
          // Danger red dot
          ctx.fillStyle = '#D50000';
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.bombType === 'bombs_snakeye_retarded') {
          // Mk 82 Snakeye Retarded Bomb: 4 aerodynamic steel drag decelerator blades deployed
          ctx.fillStyle = '#689F38';
          ctx.strokeStyle = '#33691E';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.2, 7.0, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Deployed 4-fin metal retarder airbrakes at tail
          ctx.strokeStyle = '#FFD54F';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-6, 7);
          ctx.lineTo(6, 7);
          ctx.moveTo(0, 4);
          ctx.lineTo(-5, 9);
          ctx.moveTo(0, 4);
          ctx.lineTo(5, 9);
          ctx.stroke();
        } else if (proj.bombType === 'agm62_walleye') {
          // AGM-62 Walleye TV-Guided Glide Bomb
          ctx.fillStyle = '#CFD8DC';
          ctx.strokeStyle = '#546E7A';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.0, 9.0, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4 Long delta glide fins
          ctx.strokeStyle = '#78909C';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-8, 2);
          ctx.lineTo(8, 2);
          ctx.moveTo(-7, 7);
          ctx.lineTo(7, 7);
          ctx.stroke();

          // TV Optical Seeker lens
          ctx.fillStyle = '#80DEEA';
          ctx.beginPath();
          ctx.arc(0, -9, 2.0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const isHeavy = proj.bombType === 'bomb_1600' || proj.bombType === 'bomb_2000' || proj.bombType === 'bomb_1600_ap';
          const bW = isHeavy ? 4.2 : 3.0;
          const bH = isHeavy ? 8.5 : 6.0;

          // Olive drab / yellow bomb casing
          ctx.fillStyle = isHeavy ? '#546E7A' : '#FFE082';
          ctx.strokeStyle = isHeavy ? '#263238' : '#FFA000';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(0, 0, bW, bH, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Tail guidance box fins
          ctx.strokeStyle = isHeavy ? '#FF3D00' : '#E65100';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-bW * 1.2, bH * 0.7);
          ctx.lineTo(bW * 1.2, bH * 0.7);
          ctx.moveTo(0, bH * 0.3);
          ctx.lineTo(0, bH * 1.05);
          ctx.stroke();
        }

        ctx.restore();
      } else if (proj.type === 'depth_charge') {
        ctx.strokeStyle = '#80DEEA';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(proj.pos.x - 3.5, proj.pos.y - 3.5, 7, 7);
      } else if (proj.type === 'hedgehog') {
        // ════ 刺蝟砲 ASW 反潛迫擊砲彈 (Spigot Mortar Airborne Projectile) ════
        const alt = proj.arcAltitude || 0;
        const scale = 1.0 + (alt / 45) * 0.45;

        // 1. Water shadow directly underneath the mortar
        ctx.fillStyle = 'rgba(2, 6, 12, 0.4)';
        ctx.beginPath();
        ctx.ellipse(proj.pos.x, proj.pos.y, Math.max(1, 3.2 * (1 - alt / 90)), Math.max(0.5, 1.8 * (1 - alt / 90)), proj.heading, 0, Math.PI * 2);
        ctx.fill();

        // 2. Parabolic airborne mortar projectile
        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y - alt);
        ctx.rotate(proj.heading);
        ctx.scale(scale, scale);

        // Dark gunmetal teardrop bomb body
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.2, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Brass impact contact fuze nose
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(3.6, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Spigot mortar tail tube and ring/cross stabilizer fins
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3.5, 0);
        ctx.lineTo(-7.5, 0);
        ctx.moveTo(-6.5, -2.2);
        ctx.lineTo(-6.5, 2.2);
        ctx.stroke();

        ctx.restore();
      } else if (proj.type === 'missile_aam') {
        // ════ 空空飛彈 (AIM-9 響尾蛇 / AIM-7 麻雀 / K-13 環禮) ════
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);

        // 1. Supersonic White Rocket Exhaust Smoke Trail
        ctx.strokeStyle = 'rgba(238, 238, 238, 0.65)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 32, proj.pos.y - sinH * 32);
        ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.stroke();

        // 2. High-Temperature Supersonic Exhaust Plume with Mach Diamonds
        const pLen = 14 + Math.sin(this.time * 35) * 4;
        const eGrad = ctx.createLinearGradient(
          proj.pos.x - cosH * 10, proj.pos.y - sinH * 10,
          proj.pos.x - cosH * (10 + pLen), proj.pos.y - sinH * (10 + pLen)
        );
        eGrad.addColorStop(0, '#FFFFFF');
        eGrad.addColorStop(0.3, '#FFE082');
        eGrad.addColorStop(0.7, '#FF6D00');
        eGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
        ctx.strokeStyle = eGrad;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.lineTo(proj.pos.x - cosH * (10 + pLen), proj.pos.y - sinH * (10 + pLen));
        ctx.stroke();

        // 3. Slender missile airframe
        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);
        ctx.fillStyle = '#FAFAFA';
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 1;
        ctx.fillRect(-10, -1.4, 12, 2.8);
        ctx.strokeRect(-10, -1.4, 12, 2.8);

        // Fore canards & aft delta fins
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-1, -3.5);
        ctx.lineTo(-1, 3.5);
        ctx.moveTo(-9, -4.5);
        ctx.lineTo(-9, 4.5);
        ctx.stroke();

        // Seeker nose
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(2.5, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (proj.type === 'missile_sam') {
        if (proj.isASROC) {
          // ════ RUR-5 ASROC 反潛火箭 (Rocket Thrown Anti-Submarine Torpedo) ════
          const alt = proj.arcAltitude || 0;

          // 1. Water shadow directly underneath ASROC trajectory
          ctx.fillStyle = 'rgba(2, 8, 16, 0.35)';
          ctx.beginPath();
          ctx.ellipse(proj.pos.x, proj.pos.y, Math.max(3, 8 * (1 - alt / 120)), Math.max(1.5, 4 * (1 - alt / 120)), proj.heading, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(proj.pos.x, proj.pos.y - alt);
          ctx.rotate(proj.heading);

          if (proj.asrocStage === 'parachute') {
            // ══ 降落傘減速段 (Parachute Retardation Stage) ══
            // Cords trailing to parachute
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-24, -8);
            ctx.moveTo(-10, 0);
            ctx.lineTo(-24, 8);
            ctx.stroke();

            // Deployed white silk parachute canopy
            ctx.fillStyle = '#FAFAFA';
            ctx.strokeStyle = '#90CAF9';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(-26, 0, 10, -Math.PI / 2, Math.PI / 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Mk 46 Lightweight Torpedo Body suspended under parachute
            ctx.fillStyle = '#00E5FF';
            ctx.strokeStyle = '#006064';
            ctx.lineWidth = 1.2;
            ctx.fillRect(-10, -2.5, 18, 5);
            ctx.strokeRect(-10, -2.5, 18, 5);
            // Torpedo nose
            ctx.fillStyle = '#FFE082';
            ctx.beginPath();
            ctx.arc(8, 0, 2.5, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
          } else {
            // ══ 固體火箭助推升空段 (Rocket Booster Flyout Stage) ══
            // Roaring ASROC rocket motor flame
            const flameLen = 22 + Math.sin(this.time * 45) * 6;
            const bGrad = ctx.createLinearGradient(-14, 0, -14 - flameLen, 0);
            bGrad.addColorStop(0, '#FFFFFF');
            bGrad.addColorStop(0.3, '#FFE082');
            bGrad.addColorStop(0.7, '#FF3D00');
            bGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
            ctx.strokeStyle = bGrad;
            ctx.lineWidth = 4.4;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(-14 - flameLen, 0);
            ctx.stroke();

            // ASROC Booster Motor Case (Aft)
            ctx.fillStyle = '#ECEFF1';
            ctx.strokeStyle = '#455A64';
            ctx.lineWidth = 1.2;
            ctx.fillRect(-14, -3.0, 12, 6.0);
            ctx.strokeRect(-14, -3.0, 12, 6.0);

            // Cruciform stabilizer booster tail fins
            ctx.strokeStyle = '#D32F2F';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-14, -6);
            ctx.lineTo(-10, -3);
            ctx.lineTo(-10, 3);
            ctx.lineTo(-14, 6);
            ctx.stroke();

            // Mk 46 Torpedo Fore Payload (Fore)
            ctx.fillStyle = '#00E5FF';
            ctx.strokeStyle = '#00838F';
            ctx.fillRect(-2, -2.6, 12, 5.2);
            ctx.strokeRect(-2, -2.6, 12, 5.2);
            ctx.fillStyle = '#FFE082';
            ctx.beginPath();
            ctx.arc(10, 0, 2.6, -Math.PI / 2, Math.PI / 2);
            ctx.fill();
          }

          ctx.restore();
        } else {
          // ════ 面對空防空飛彈 (RIM-2 雙頭犬 / RIM-24 韃靼 / RIM-7 海麻雀 / SA-2 導針) ════
          const cosH = Math.cos(proj.heading);
          const sinH = Math.sin(proj.heading);

          // 1. Massive Solid Rocket Booster Billowing White Smoke Column
          ctx.strokeStyle = 'rgba(245, 245, 245, 0.85)';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 48, proj.pos.y - sinH * 48);
          ctx.lineTo(proj.pos.x - cosH * 12, proj.pos.y - sinH * 12);
          ctx.stroke();

          // 2. Intense Roaring Booster Flame
          const flameLen = 18 + Math.sin(this.time * 40) * 5;
          const bGrad = ctx.createLinearGradient(
            proj.pos.x - cosH * 12, proj.pos.y - sinH * 12,
            proj.pos.x - cosH * (12 + flameLen), proj.pos.y - sinH * (12 + flameLen)
          );
          bGrad.addColorStop(0, '#FFFFFF');
          bGrad.addColorStop(0.25, '#FFD54F');
          bGrad.addColorStop(0.65, '#FF3D00');
          bGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
          ctx.strokeStyle = bGrad;
          ctx.lineWidth = 4.8;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * 12, proj.pos.y - sinH * 12);
          ctx.lineTo(proj.pos.x - cosH * (12 + flameLen), proj.pos.y - sinH * (12 + flameLen));
          ctx.stroke();

          // 3. Heavy SAM airframe
          ctx.save();
          ctx.translate(proj.pos.x, proj.pos.y);
          ctx.rotate(proj.heading);
          ctx.fillStyle = '#ECEFF1';
          ctx.strokeStyle = '#455A64';
          ctx.lineWidth = 1.2;
          ctx.fillRect(-13, -2.0, 16, 4.0);
          ctx.strokeRect(-13, -2.0, 16, 4.0);

          // Large booster stabilizer fins
          ctx.strokeStyle = '#D32F2F';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-12, -6.5);
          ctx.lineTo(-9, -2.0);
          ctx.lineTo(-9, 2.0);
          ctx.lineTo(-12, 6.5);
          ctx.stroke();

          // Radome tip
          ctx.fillStyle = '#FF5252';
          ctx.beginPath();
          ctx.arc(3.5, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (proj.type === 'missile_ashm') {
        // ════ 空艦/海艦突防飛彈 (依史實彈種、飛行高度、超音速激波與領彈資料鏈差異化繪製) ════
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);
        const variant = proj.ashmVariant;
        const altRatio = proj.missileAltitude ?? 0.2;
        const yLift = altRatio * 18;
        const drawX = proj.pos.x;
        const drawY = proj.pos.y - yLift;

        // 1. Water surface drop shadow when climbing (Harpoon pop-up / P-700 leader / Kh-22 high plunge)
        if (yLift > 2.5) {
          const shadowAlpha = Math.max(0.14, 0.36 - altRatio * 0.18);
          ctx.fillStyle = `rgba(3, 10, 20, ${shadowAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(proj.pos.x, proj.pos.y + 2, 7, 2.6, proj.heading, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. P-700 Granit / P-500 Bazalt High-Altitude Leader Datalink Relay Lines & Halo
        if (proj.isLeadMissile && !proj.isDecoyed) {
          const pulse = 0.65 + Math.sin(this.time * 10) * 0.35;
          let linkedCount = 0;
          ctx.save();
          ctx.strokeStyle = `rgba(0, 229, 255, ${(0.28 * pulse).toFixed(2)})`;
          ctx.lineWidth = 1.1;
          ctx.setLineDash([4, 5]);
          for (const follower of projectiles) {
            if (follower.isDead || follower.id === proj.id || follower.leadMissileId !== proj.id || follower.datalinkLost) continue;
            const fLift = (follower.missileAltitude ?? 0.15) * 18;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(follower.pos.x, follower.pos.y - fLift);
            ctx.stroke();
            linkedCount++;
            if (linkedCount >= 5) break;
          }
          ctx.setLineDash([]);

          // Leader radar broadcast beacon ring
          ctx.strokeStyle = `rgba(255, 213, 79, ${(0.55 * pulse).toFixed(2)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(drawX, drawY, 10 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        const isExocet = variant === 'exocet_mm40' || variant === 'exocet_mm38';
        const isHarpoon = variant === 'harpoon_rgm84' || variant === 'harpoon_ugm84' || variant === 'harpoon_agm84';
        const isHeavySoviet = variant === 'p700_granit' || variant === 'p500_bazalt';
        const isMoskit = variant === 'p270_moskit';
        const isKh22 = variant === 'kh22_burya';

        // 3. Low-altitude sea-spray wake ripples (intense on wave-top Exocet & Moskit; fades when climbing)
        if (altRatio < 0.35) {
          const sprayLen = isExocet ? 44 : isMoskit ? 40 : 30;
          const spraySpread = isExocet ? 5.2 : 4.0;
          ctx.strokeStyle = isExocet ? 'rgba(224, 247, 250, 0.85)' : 'rgba(224, 247, 250, 0.58)';
          ctx.lineWidth = isExocet ? 2.6 : 2.1;
          ctx.beginPath();
          ctx.moveTo(proj.pos.x - cosH * sprayLen - sinH * spraySpread, proj.pos.y - sinH * sprayLen + cosH * spraySpread);
          ctx.lineTo(proj.pos.x - cosH * 8, proj.pos.y - sinH * 8);
          ctx.moveTo(proj.pos.x - cosH * sprayLen + sinH * spraySpread, proj.pos.y - sinH * sprayLen - cosH * spraySpread);
          ctx.lineTo(proj.pos.x - cosH * 8, proj.pos.y - sinH * 8);
          ctx.stroke();
        }

        if (isExocet) {
          // ── NATO Exocet MM40 / MM38: Low-signature solid rocket flare + blue-striped sea-skimmer ──
          ctx.strokeStyle = '#80DEEA';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(drawX - cosH * 15, drawY - sinH * 15);
          ctx.lineTo(drawX - cosH * 7, drawY - sinH * 7);
          ctx.stroke();

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(proj.heading);
          // Sleek silver-grey body with NATO sky-blue tactical bands
          ctx.fillStyle = '#CFD8DC';
          ctx.strokeStyle = '#0277BD';
          ctx.lineWidth = 1.2;
          ctx.fillRect(-10, -2.0, 14, 4.0);
          ctx.strokeRect(-10, -2.0, 14, 4.0);
          ctx.fillStyle = '#0288D1';
          ctx.fillRect(-4, -2.0, 3.2, 4.0);

          // Swept cruciform delta wings + aft fins
          ctx.fillStyle = '#90A4AE';
          ctx.beginPath();
          ctx.moveTo(1, 0);
          ctx.lineTo(-4, -5.8);
          ctx.lineTo(-6, -5.8);
          ctx.lineTo(-3.5, 0);
          ctx.lineTo(-6, 5.8);
          ctx.lineTo(-4, 5.8);
          ctx.closePath();
          ctx.fill();

          // Sharp sea-skimmer radome
          ctx.fillStyle = '#E1F5FE';
          ctx.beginPath();
          ctx.arc(4.2, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (isHarpoon) {
          // ── USN / Allied RGM-84 / UGM-84 / AGM-84 Harpoon: Amber turbojet plume + pop-up arc ──
          const flameLen = 14 + Math.sin(this.time * 36) * 3;
          ctx.strokeStyle = '#FFB300';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(drawX - cosH * (8 + flameLen), drawY - sinH * (8 + flameLen));
          ctx.lineTo(drawX - cosH * 7, drawY - sinH * 7);
          ctx.stroke();

          if (proj.ashmProfile === 'pop_up_dive' && altRatio > 0.45) {
            ctx.strokeStyle = 'rgba(255, 213, 79, 0.55)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(drawX, drawY, 8.5, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(proj.heading);
          ctx.fillStyle = '#ECEFF1';
          ctx.strokeStyle = '#37474F';
          ctx.lineWidth = 1.2;
          ctx.fillRect(-10, -2.1, 14, 4.2);
          ctx.strokeRect(-10, -2.1, 14, 4.2);

          // USN amber warhead band
          ctx.fillStyle = '#FFB300';
          ctx.fillRect(0.5, -2.1, 2.4, 4.2);

          // Slim mid-body swept fins
          ctx.strokeStyle = '#607D8B';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-2, -5.2);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-2, 5.2);
          ctx.moveTo(-9, -4.2);
          ctx.lineTo(-10, 0);
          ctx.lineTo(-9, 4.2);
          ctx.stroke();

          // Radome tip
          ctx.fillStyle = '#B0BEC5';
          ctx.beginPath();
          ctx.arc(4.2, 0, 2.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (isHeavySoviet || isMoskit || isKh22) {
          // ── Soviet Supersonic AShMs (P-700 Granit / P-500 Bazalt / P-270 Moskit / Kh-22 Burya) ──
          const flameLen = (isHeavySoviet ? 22 : 18) + Math.sin(this.time * 42) * 4;
          const sGrad = ctx.createLinearGradient(
            drawX - cosH * 8, drawY - sinH * 8,
            drawX - cosH * (8 + flameLen), drawY - sinH * (8 + flameLen)
          );
          sGrad.addColorStop(0, '#FFFFFF');
          sGrad.addColorStop(0.3, isMoskit ? '#80DEEA' : '#FFD54F');
          sGrad.addColorStop(0.7, '#FF3D00');
          sGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
          ctx.strokeStyle = sGrad;
          ctx.lineWidth = isHeavySoviet ? 4.6 : 3.8;
          ctx.beginPath();
          ctx.moveTo(drawX - cosH * (8 + flameLen), drawY - sinH * (8 + flameLen));
          ctx.lineTo(drawX - cosH * 8, drawY - sinH * 8);
          ctx.stroke();

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(proj.heading);
          const scale = variant === 'p700_granit' || isKh22 ? 1.16 : 1.02;
          ctx.scale(scale, scale);

          // Supersonic Mach shock-cone chevron around nose
          ctx.strokeStyle = isMoskit ? 'rgba(128, 222, 234, 0.72)' : 'rgba(255, 224, 178, 0.62)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(-5, -8.5);
          ctx.lineTo(7.5, 0);
          ctx.lineTo(-5, 8.5);
          ctx.stroke();

          if (isMoskit) {
            ctx.beginPath();
            ctx.moveTo(-9, -6.5);
            ctx.lineTo(1, 0);
            ctx.lineTo(-9, 6.5);
            ctx.stroke();
          }

          // Heavy gunmetal fuselage & crimson intake/radome
          ctx.fillStyle = isKh22 ? '#CFD8DC' : '#263238';
          ctx.strokeStyle = isMoskit ? '#FF6D00' : '#FF5252';
          ctx.lineWidth = 1.3;
          ctx.fillRect(-12, -2.8, 17, 5.6);
          ctx.strokeRect(-12, -2.8, 17, 5.6);

          // Swept supersonic delta wings
          ctx.fillStyle = isKh22 ? '#90A4AE' : '#37474F';
          ctx.beginPath();
          ctx.moveTo(2, 0);
          ctx.lineTo(-9, -7.2);
          ctx.lineTo(-11.5, -7.2);
          ctx.lineTo(-7.5, 0);
          ctx.lineTo(-11.5, 7.2);
          ctx.lineTo(-9, 7.2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crimson nose radome (gold ring if P-700/P-500 swarm leader)
          ctx.fillStyle = proj.isLeadMissile ? '#FFD54F' : '#FF1744';
          ctx.beginPath();
          ctx.arc(5, 0, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // ── P-15 Styx / KSR-5 Kelt / AGM-12 Bullpup fallback ──
          ctx.strokeStyle = '#FF3D00';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(drawX - cosH * 22, drawY - sinH * 22);
          ctx.lineTo(drawX - cosH * 8, drawY - sinH * 8);
          ctx.stroke();

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(proj.heading);
          ctx.fillStyle = '#37474F';
          ctx.strokeStyle = '#FF5252';
          ctx.lineWidth = 1.4;
          ctx.fillRect(-12, -3.2, 16, 6.4);
          ctx.strokeRect(-12, -3.2, 16, 6.4);

          ctx.fillStyle = '#455A64';
          ctx.beginPath();
          ctx.moveTo(1, 0);
          ctx.lineTo(-8, -8);
          ctx.lineTo(-11, -8);
          ctx.lineTo(-7, 0);
          ctx.lineTo(-11, 8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FF1744';
          ctx.beginPath();
          ctx.arc(4, 0, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (proj.type === 'missile_arm') {
        // ════ 反輻射雷達獵殺飛彈 (AGM-45 百舌鳥 Shrike) ════
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);

        // Piercing supersonic streak with violet/cyan radar tracking aura
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.45)';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 28, proj.pos.y - sinH * 28);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        ctx.strokeStyle = '#E0F7FA';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 16, proj.pos.y - sinH * 16);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);
        ctx.fillStyle = '#ECEFF1';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 1.2;
        ctx.fillRect(-10, -1.6, 13, 3.2);
        ctx.strokeRect(-10, -1.6, 13, 3.2);

        // Large mid-body delta wings
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-1, -5.5);
        ctx.lineTo(2, 0);
        ctx.lineTo(-1, 5.5);
        ctx.stroke();

        // Dark dielectric radar seeker nose
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(3.5, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (proj.type === 'missile_cruise') {
        // ════ 戰斧巡弋飛彈 (BGM-109 / UGM-109 / GLCM / RK-55) ════
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 24, proj.pos.y - sinH * 24);
        ctx.lineTo(proj.pos.x, proj.pos.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);
        // 白色流線圓柱彈體
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.0;
        ctx.fillRect(-12, -2.0, 16, 4.0);
        ctx.strokeRect(-12, -2.0, 16, 4.0);
        // 展開之平直主翼
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-2, -7.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-2, 7.5);
        ctx.stroke();
        // 彈頭鼻錐
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.arc(4, 0, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (proj.type === 'slbm_trident' || proj.type === 'slbm_r39') {
        const isTrident = proj.type === 'slbm_trident';
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);
        // 潛射洲際彈道飛彈高溫熾熱等離子羽流 (Massive Plasma Jet)
        ctx.strokeStyle = isTrident ? '#00E5FF' : '#FF3D00';
        ctx.lineWidth = 7.0;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 45, proj.pos.y - sinH * 45);
        ctx.lineTo(proj.pos.x - cosH * 14, proj.pos.y - sinH * 14);
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 32, proj.pos.y - sinH * 32);
        ctx.lineTo(proj.pos.x - cosH * 12, proj.pos.y - sinH * 12);
        ctx.stroke();

        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);
        // 重型 SLBM 圓柱彈身 (Trident D5 / R-39 Rif)
        ctx.fillStyle = isTrident ? '#F8FAFC' : '#334155';
        ctx.strokeStyle = isTrident ? '#0284C7' : '#EF4444';
        ctx.lineWidth = 1.6;
        ctx.fillRect(-22, -5, 28, 10);
        ctx.strokeRect(-22, -5, 28, 10);
        // MIRV 分導核彈頭空氣動力鼻錐
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(6, -5);
        ctx.lineTo(16, 0);
        ctx.lineTo(6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 減阻針 (Aerospike Extension)
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.restore();
      } else if (proj.type === 'missile_ssm') {
        const isAtacms = Boolean(proj.isAtacms || proj.isBunkerBuster);
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);
        // 巨大高溫火箭尾焰與超音速震波光錐
        ctx.strokeStyle = isAtacms ? '#F59E0B' : '#EF4444';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 32, proj.pos.y - sinH * 32);
        ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.stroke();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 22, proj.pos.y - sinH * 22);
        ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.stroke();

        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);

        if (isAtacms) {
          // ════ MGM-140 ATACMS 戰術彈道飛彈 ════
          // 美軍卡其白/灰白圓柱固體火箭彈體
          ctx.fillStyle = '#E2E8F0';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.4;
          ctx.fillRect(-15, -3.5, 20, 7.0);
          ctx.strokeRect(-15, -3.5, 20, 7.0);

          // 尾部 4 片可動十字形控制格柵翼/三角控制翼
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-15, -8.5);
          ctx.lineTo(-10, -3.5);
          ctx.lineTo(-10, 3.5);
          ctx.lineTo(-15, 8.5);
          ctx.stroke();

          // M57 碉堡剋星 (Bunker Buster) 穿甲鎢鋼黑金屬鼻錐
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(5, -3.5);
          ctx.lineTo(13, 0);
          ctx.lineTo(5, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // ════ 9K72 飛毛腿-B 戰術彈道飛彈 (Scud-B Heavy Ballistic Missile) ════
          // 粗壯軍綠色飛毛腿彈體
          ctx.fillStyle = '#3F6212';
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-16, -3.8, 22, 7.6);
          ctx.strokeRect(-16, -3.8, 22, 7.6);
          // 尾部 4 片大型梯形控制翼
          ctx.strokeStyle = '#15803D';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-16, -9);
          ctx.lineTo(-12, -3.8);
          ctx.lineTo(-12, 3.8);
          ctx.lineTo(-16, 9);
          ctx.stroke();
          // 重型高爆彈頭錐
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.moveTo(6, -3.8);
          ctx.lineTo(12, 0);
          ctx.lineTo(6, 3.8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Draw Particles including WWII Water Geysers & Authentic Flak Detonations
  public drawParticles(particles: Particle[], camera: Camera) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const p of particles) {
      if (!this.isWorldCircleVisible(p.x, p.y, p.radius + 90, camera)) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'flak_puff') {
        // ══════════════════════════════════════════════════════════
        // 黑色延時引信爆炸煙霧 一朵一朵的 (Timed-Fuse Flak Puff Clouds)
        // ══════════════════════════════════════════════════════════
        const prog = 1 - (p.life / p.maxLife); // 0 (just exploded) to 1 (fading)
        const currentR = p.radius * (0.55 + prog * 0.95);
        const rot = (p.rot || 0) + (p.rotSpeed || 0.1) * (prog * 2.5);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(rot);

        // 1. Initial timed detonation flash core (bright yellow-orange flash for first 18% of duration)
        if (prog < 0.18) {
          const flashAlpha = 1 - (prog / 0.18);
          ctx.fillStyle = `rgba(255, 238, 88, ${flashAlpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, currentR * 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, currentR * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Multi-lobed billowing black smoke cloud ("一朵一朵的黑煙")
        const cloudAlpha = Math.max(0, (1 - prog) * 0.9);
        const lobeCount = 7;
        for (let l = 0; l < lobeCount; l++) {
          const lAng = (l * Math.PI * 2) / lobeCount;
          const lDist = currentR * 0.45;
          const lx = Math.cos(lAng) * lDist;
          const ly = Math.sin(lAng) * lDist;
          const lobeR = currentR * 0.55;

          const lobeGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, lobeR);
          lobeGrad.addColorStop(0, `rgba(16, 20, 26, ${cloudAlpha})`);
          lobeGrad.addColorStop(0.7, `rgba(26, 32, 40, ${cloudAlpha * 0.85})`);
          lobeGrad.addColorStop(1, 'rgba(38, 50, 56, 0)');

          ctx.fillStyle = lobeGrad;
          ctx.beginPath();
          ctx.arc(lx, ly, lobeR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Dense central charcoal core
        ctx.fillStyle = `rgba(10, 14, 18, ${cloudAlpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, currentR * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Shrapnel streaks (early phase)
        if (prog < 0.28) {
          const shrapAlpha = (1 - prog / 0.28) * 0.75;
          ctx.fillStyle = `rgba(255, 171, 64, ${shrapAlpha})`;
          for (let s = 0; s < 6; s++) {
            const sAng = (s * Math.PI) / 3 + 0.25;
            const sDist = currentR * (1.1 + prog * 1.2);
            ctx.beginPath();
            ctx.arc(Math.cos(sAng) * sDist, Math.sin(sAng) * sDist, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (p.type === 'flak') {
        // Authentic WWII AA Flak Burst: Expanding Charcoal Puffy Cloud Lobes with Detonation Core
        const prog = 1 - (p.life / p.maxLife); // 0 (just exploded) to 1 (fading)
        const currentR = p.radius * (0.6 + prog * 0.6);

        // 1. Central initial detonation flash (first 30% of lifetime)
        if (prog < 0.35) {
          const flashAlpha = (1 - prog / 0.35);
          ctx.fillStyle = `rgba(255, 238, 88, ${flashAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentR * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Multi-lobed charcoal black flak smoke puff (5 overlapping lobes)
        ctx.fillStyle = `rgba(26, 32, 40, ${0.75 * (1 - prog * 0.7)})`;
        for (let l = 0; l < 5; l++) {
          const lAng = (l * Math.PI * 2) / 5 + 0.3;
          const lDist = currentR * 0.45;
          const lx = p.x + Math.cos(lAng) * lDist;
          const ly = p.y + Math.sin(lAng) * lDist;
          ctx.beginPath();
          ctx.arc(lx, ly, currentR * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Expanding outer shrapnel fragmentation ring
        ctx.strokeStyle = `rgba(255, 138, 128, ${0.5 * (1 - prog)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentR * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'geyser') {
        // Soaring WWII naval bomb/torpedo water geyser column!
        const prog = 1 - (p.life / p.maxLife); // 0 to 1
        const geyserHeight = p.radius * 2.8 * (1 - prog * 0.35);
        const colW = Math.max(6, p.radius * 0.45);

        // Water base splash ring
        ctx.strokeStyle = 'rgba(224, 247, 250, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.3, p.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Expanding foam ripples
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * (1 + prog * 1.5), p.radius * 0.5 * (1 + prog * 1.5), 0, 0, Math.PI * 2);
        ctx.stroke();

        // Vertical white geyser fountain plume
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y - geyserHeight);
        grad.addColorStop(0, 'rgba(224, 247, 250, 0.9)');
        grad.addColorStop(0.7, 'rgba(178, 235, 242, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.x - colW, p.y);
        ctx.quadraticCurveTo(p.x - colW * 0.5, p.y - geyserHeight * 0.6, p.x, p.y - geyserHeight);
        ctx.quadraticCurveTo(p.x + colW * 0.5, p.y - geyserHeight * 0.6, p.x + colW, p.y);
        ctx.closePath();
        ctx.fill();

        // Airborne water droplets around geyser head
        ctx.fillStyle = '#FFFFFF';
        for (let d = -2; d <= 2; d++) {
          ctx.beginPath();
          ctx.arc(p.x + d * (colW * 0.7), p.y - geyserHeight + Math.abs(d) * 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'fire') {
        const prog = 1 - (p.life / p.maxLife);
        const fR = p.radius * (1 - prog * 0.4);
        const fGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, fR);
        fGrad.addColorStop(0, '#FFF9C4');
        fGrad.addColorStop(0.35, '#FFA726');
        fGrad.addColorStop(0.75, '#FF3D00');
        fGrad.addColorStop(1, 'rgba(216, 27, 96, 0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, fR, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'oil_slick') {
        ctx.fillStyle = p.color || 'rgba(10, 18, 28, 0.6)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'flare') {
        // High-intensity magnesium flare with incandescent core
        const prog = 1 - (p.life / p.maxLife);
        const flareR = Math.max(2.5, p.radius * (1 - prog * 0.3));
        const fGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, flareR * 2.2);
        fGrad.addColorStop(0, '#FFFFFF');
        fGrad.addColorStop(0.25, '#FFF59D');
        fGrad.addColorStop(0.65, '#FF7043');
        fGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, flareR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent core spark
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, flareR * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'chaff') {
        // High-reflective aluminum/mylar chaff dipoles fluttering in wind
        ctx.strokeStyle = '#E0F7FA';
        ctx.lineWidth = 1.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.life * 7.5) % (Math.PI * 2));
        ctx.beginPath();
        ctx.moveTo(-p.radius, 0);
        ctx.lineTo(p.radius, 0);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'chaff_cloud') {
        // Expanding radar reflection decoy cloud over water/air
        const prog = 1 - (p.life / p.maxLife);
        const cloudR = Math.max(4, p.radius * (0.8 + prog * 0.4));
        const cGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, cloudR);
        cGrad.addColorStop(0, 'rgba(224, 247, 250, 0.45)');
        cGrad.addColorStop(0.5, 'rgba(178, 235, 242, 0.25)');
        cGrad.addColorStop(1, 'rgba(128, 222, 234, 0)');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, cloudR, 0, Math.PI * 2);
        ctx.fill();

        // Shimmering radar sparkles
        ctx.fillStyle = '#FFFFFF';
        for (let s = 0; s < 3; s++) {
          const sx = p.x + (Math.sin(p.life * 10 + s * 2.1) * cloudR * 0.6);
          const sy = p.y + (Math.cos(p.life * 8 + s * 3.2) * cloudR * 0.6);
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === 'tracer') {
        const tLen = p.length || Math.min(26, Math.hypot(p.vx, p.vy) * 0.035);
        const tAng = Math.atan2(p.vy, p.vx);
        const tailX = p.x - Math.cos(tAng) * tLen;
        const tailY = p.y - Math.sin(tAng) * tLen;

        ctx.save();
        // 1. Radiant outer bloom
        ctx.strokeStyle = p.color || 'rgba(255, 224, 130, 0.65)';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // 2. High-intensity saturated tracer core
        ctx.strokeStyle = p.color?.includes('FF5252') ? '#FF1744' : '#FFE082';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(tailX * 0.35 + p.x * 0.65, tailY * 0.35 + p.y * 0.65);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // 3. White-hot point
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'ring' || p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Screen-space RTS Drag Selection Box
  public drawSelectionBox(box: SelectionBox) {
    if (!box.isActive) return;
    const ctx = this.ctx;
    ctx.save();
    const x = Math.min(box.startX, box.currentX);
    const y = Math.min(box.startY, box.currentY);
    const w = Math.abs(box.currentX - box.startX);
    const h = Math.abs(box.currentY - box.startY);

    ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#00E676';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Draw Ground Units (USMC Infantry, LVT Amphibious, Armor, and OPFOR Ambush squads)
  public drawGroundUnits(groundUnits: GroundUnit[], camera: Camera, selectedUnitIds: string[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const unit of groundUnits) {
      if (unit.isDestroyed || unit.embarkedInShipId) continue;

      const isSelected = selectedUnitIds.includes(unit.id);
      const isPlayer = unit.side === 'player';

      // Waypoint path if moving
      if (isSelected && unit.order.targetPos && unit.order.type === 'move') {
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(unit.pos.x, unit.pos.y);
        ctx.lineTo(unit.order.targetPos.x, unit.order.targetPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.save();
      ctx.translate(unit.pos.x, unit.pos.y);

      // 0. Physical Top-Down Vehicle / Fireteam Silhouette underneath NATO frame
      const moveHeading = unit.order.targetPos
        ? Math.atan2(unit.order.targetPos.y - unit.pos.y, unit.order.targetPos.x - unit.pos.x)
        : isPlayer
        ? 0
        : Math.PI;
      ctx.save();
      ctx.translate(0, 2);
      ctx.rotate(moveHeading);
      // Soft ground contact shadow for crisp silhouette pop over island terrain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(-1, 1.5, 13.5, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      drawGroundSilhouette(ctx, unit.type, isPlayer, 1.08);
      ctx.restore();

      // 1. NATO APP-6 Tactical Frame (藍色長方形 友軍 vs 紅色菱形 敵軍)
      const isHostile = !isPlayer;
      const midY = -20;
      const boxW = 25;
      const boxH = 14;
      const frameColor = isPlayer ? '#42A5F5' : '#FF5252';
      const frameFill = isPlayer ? 'rgba(13, 71, 161, 0.72)' : 'rgba(183, 28, 28, 0.72)';

      // If unit is in Banzai Charge, render pulsating flaming spikes around the frame
      if (unit.isBanzaiCharging) {
        const spikePulse = (Math.sin(this.time * 12) + 1) * 0.5;
        ctx.strokeStyle = `rgba(255, 23, 68, ${0.7 + spikePulse * 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4 + this.time * 2;
          const r1 = 18;
          const r2 = 26 + spikePulse * 6;
          ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
        }
        ctx.stroke();
      }

      ctx.fillStyle = frameFill;
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2;

      if (isHostile) {
        // NATO APP-6 敵軍菱形邊框 (Hostile Diamond Frame)
        ctx.beginPath();
        ctx.moveTo(0, midY - 10);
        ctx.lineTo(12, midY);
        ctx.lineTo(0, midY + 10);
        ctx.lineTo(-12, midY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // NATO APP-6 友軍長方形邊框 (Friendly Rectangle Frame)
        ctx.fillRect(-boxW / 2, midY - boxH / 2, boxW, boxH);
        ctx.strokeRect(-boxW / 2, midY - boxH / 2, boxW, boxH);
      }

      // 2. NATO APP-6 Echelon Level (框頂編制符號: 排 ••• / 連 | / 營 ||)
      const topY = isHostile ? midY - 13 : midY - boxH / 2 - 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';

      const echelon = unit.echelon || (unit.type.includes('bn') || unit.type.includes('tank_bn') ? 'battalion' : unit.type.includes('company') ? 'company' : 'platoon');
      if (echelon === 'battalion') {
        // 營級 (Battalion / Regiment): 雙垂直線 "||"
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-3, topY - 5);
        ctx.lineTo(-3, topY);
        ctx.moveTo(3, topY - 5);
        ctx.lineTo(3, topY);
        ctx.stroke();
      } else if (echelon === 'company' || echelon === 'battery') {
        // 連/砲兵連級 (Company / Battery): 單垂直線 "|"
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, topY - 5);
        ctx.lineTo(0, topY);
        ctx.stroke();
      } else {
        // 排級 (Platoon): 三實心圓點 "•••"
        ctx.beginPath();
        ctx.arc(-5, topY - 2.5, 1.6, 0, Math.PI * 2);
        ctx.arc(0, topY - 2.5, 1.6, 0, Math.PI * 2);
        ctx.arc(5, topY - 2.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. NATO APP-6 兵種符號 (Inside Frame Function Symbol)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;

      if (unit.type.includes('scud') || unit.type.includes('ssm') || unit.type.includes('ballistic') || unit.type.includes('atacms')) {
        // 戰術地對地/彈道飛彈 (Tactical SSM / SCUD / ATACMS): 向上衝天飛彈箭頭與助推器
        ctx.beginPath();
        ctx.moveTo(0, midY - 7);
        ctx.lineTo(-3, midY - 3);
        ctx.lineTo(-1.5, midY - 3);
        ctx.lineTo(-1.5, midY + 5);
        ctx.lineTo(-4, midY + 7);
        ctx.moveTo(0, midY - 7);
        ctx.lineTo(3, midY - 3);
        ctx.lineTo(1.5, midY - 3);
        ctx.lineTo(1.5, midY + 5);
        ctx.lineTo(4, midY + 7);
        ctx.stroke();
      } else if (unit.type.includes('mlrs') || unit.type.includes('grad') || unit.type.includes('uragan') || unit.type.includes('calliope')) {
        // 多管火箭砲兵 (Multiple Launch Rocket System / MLRS / Calliope): 砲兵核心圓點 + 雙向齊射傾斜火箭箭頭
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, midY, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-7, midY + 4);
        ctx.lineTo(-2.5, midY - 4);
        ctx.lineTo(-5, midY - 4);
        ctx.moveTo(7, midY + 4);
        ctx.lineTo(2.5, midY - 4);
        ctx.lineTo(5, midY - 4);
        ctx.stroke();
      } else if (unit.type.includes('atgm') || unit.type.includes('tow') || unit.type.includes('anti_tank')) {
        // 反戰車飛彈 / 拖式 (Anti-Tank / ATGM): 倒 V 形尖頂飛彈射擊符號
        ctx.beginPath();
        ctx.moveTo(-7, midY + 4);
        ctx.lineTo(0, midY - 5);
        ctx.lineTo(7, midY + 4);
        ctx.stroke();
        // Horizontal cross arrow
        ctx.beginPath();
        ctx.moveTo(0, midY - 5);
        ctx.lineTo(0, midY + 4);
        ctx.stroke();
      } else if (unit.type.includes('lvt') || unit.type.includes('mech') || unit.type.includes('bradley') || unit.type.includes('bmp') || unit.type.includes('m113')) {
        // 機械化步兵/兩棲 (Mechanized Infantry): 履帶橢圓內嵌步兵交叉 "X"
        ctx.beginPath();
        ctx.ellipse(0, midY, isHostile ? 8 : 9.5, isHostile ? 4 : 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4.5, midY - 2.5);
        ctx.lineTo(4.5, midY + 2.5);
        ctx.moveTo(4.5, midY - 2.5);
        ctx.lineTo(-4.5, midY + 2.5);
        ctx.stroke();
      } else if (unit.type.includes('armor') || unit.type.includes('tank') || unit.type.includes('abrams') || unit.type.includes('t72') || unit.type.includes('t62') || unit.type.includes('t55') || unit.type.includes('m60') || unit.type.includes('patton') || unit.type.includes('t34')) {
        // 裝甲主力戰車 (Main Battle Tank / Armor): 裝甲履帶橢圓 "⬭"
        ctx.beginPath();
        ctx.ellipse(0, midY, isHostile ? 7.5 : 9, isHostile ? 3.8 : 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (
        unit.type.includes('chaparral') ||
        unit.type.includes('sam') ||
        unit.type.includes('sa6') ||
        unit.type.includes('sa8') ||
        unit.type.includes('sa9') ||
        unit.type.includes('sa11') ||
        unit.type.includes('sa15') ||
        unit.type.includes('strela')
      ) {
        // 野戰防空飛彈 (Mobile SAM Air Defense): 穹門防空頂 + 向上飛彈發射箭頭
        ctx.beginPath();
        ctx.arc(0, midY + 4, 6, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, midY + 4);
        ctx.lineTo(0, midY - 6);
        ctx.lineTo(-2.5, midY - 3);
        ctx.moveTo(0, midY - 6);
        ctx.lineTo(2.5, midY - 3);
        ctx.stroke();
      } else if (
        unit.type.includes('flak') ||
        unit.type.includes('aa') ||
        unit.type.includes('shilka') ||
        unit.type.includes('zsu') ||
        unit.type.includes('btr_zd') ||
        unit.type.includes('tunguska')
      ) {
        // 防空高射砲 (Air Defense / Flak / SPAAG): 圓頂穹頂穹門 "⌒"
        ctx.beginPath();
        ctx.arc(0, midY + 3, 5, Math.PI, 0);
        ctx.stroke();
      } else if (unit.type.includes('mortar')) {
        // 迫擊砲 (Mortar): 倒 V 形迫砲帶圓彈 "▲."
        ctx.beginPath();
        ctx.moveTo(-5, midY + 4);
        ctx.lineTo(0, midY - 2);
        ctx.lineTo(5, midY + 4);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, midY + 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.isSPG || unit.type.includes('spg') || unit.type.includes('paladin') || unit.type.includes('priest') || unit.type.includes('hummel') || unit.type.includes('m109') || unit.type.includes('2s1') || unit.type.includes('2s3') || unit.type.includes('2s19') || unit.type.includes('su100')) {
        // 自走砲 (Self-Propelled Gun / SPG): 裝甲履帶橢圓 "⬭" + 中央實心砲彈圓點 "●"
        ctx.beginPath();
        ctx.ellipse(0, midY, isHostile ? 7.5 : 9, isHostile ? 3.8 : 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, midY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.type.includes('artillery') || unit.type.includes('howitzer')) {
        // 野戰牽引重砲兵 (Towed Field Artillery): 中央實心砲彈圓點 "●"
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, midY, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.type.includes('rifle') || unit.type.includes('ambush') || unit.type.includes('patrol') || unit.type.includes('infantry') || unit.type.includes('marine')) {
        // 輕步兵 (Infantry): 對角交叉線 "X"
        const xOffset = isHostile ? 7 : 10;
        const yOffset = isHostile ? 5.5 : 6;
        ctx.beginPath();
        ctx.moveTo(-xOffset, midY - yOffset);
        ctx.lineTo(xOffset, midY + yOffset);
        ctx.moveTo(xOffset, midY - yOffset);
        ctx.lineTo(-xOffset, midY + yOffset);
        ctx.stroke();
      } else if (unit.type === 'usmc_engineer') {
        // 戰鬥工兵 (Combat Engineer): 工兵工程橫樑拱門 "E"
        ctx.beginPath();
        ctx.moveTo(-6, midY + 4);
        ctx.lineTo(-6, midY - 3);
        ctx.lineTo(6, midY - 3);
        ctx.lineTo(6, midY + 4);
        ctx.moveTo(-6, midY - 3);
        ctx.lineTo(0, midY + 2);
        ctx.lineTo(6, midY - 3);
        ctx.stroke();
      } else {
        // 偵察部隊 (Recon): 單斜線 "/"
        ctx.beginPath();
        ctx.moveTo(-5, midY + 4);
        ctx.lineTo(5, midY - 4);
        ctx.stroke();
      }

      // 5. 陸軍雙參數系統 (Dual Parameters): 組織度 (ORG 綠/黃/紅) 與 建制度 (STR 藍/橙)
      const orgPct = Math.max(0, Math.min(1, (unit.organization ?? 100) / 100));
      const strPct = Math.max(0, Math.min(1, (unit.strength ?? 100) / 100));
      const barW = 32;

      // Background plate
      ctx.fillStyle = 'rgba(4, 12, 22, 0.88)';
      ctx.fillRect(-barW / 2 - 1, 16, barW + 2, 7.5);
      ctx.strokeStyle = '#1E3A5F';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-barW / 2 - 1, 16, barW + 2, 7.5);

      // Bar 1: 組織度 ORG (綠色 / 混亂時黃色 / 崩潰時紅色)
      ctx.fillStyle = orgPct > 0.45 ? '#00E676' : orgPct > 0.2 ? '#FFD54F' : '#FF1744';
      ctx.fillRect(-barW / 2, 17, barW * orgPct, 2.5);

      // Bar 2: 建制度 STR (鋼藍色 / 受損時橙色)
      ctx.fillStyle = strPct > 0.5 ? '#00E5FF' : '#FF9100';
      ctx.fillRect(-barW / 2, 20.2, barW * strPct, 2.5);

      // Bar 3: 火力壓制條 SUPPRESSION (受擊壓制時顯示紅/琥珀色進度條)
      if (unit.suppression && unit.suppression > 5) {
        const suppPct = Math.min(1, unit.suppression / 100);
        ctx.fillStyle = unit.suppression >= 50 ? '#FF1744' : '#FF9100';
        ctx.fillRect(-barW / 2, 23.4, barW * suppPct, 2.2);
      }

      // 6. Tactical Status Badges & Unit Name (保留純粹洗鍊 NATO 圖標，僅在選中或極端狀態下顯示戰術標籤)
      if (unit.isInUrbanCover) {
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00E5FF';
        ctx.fillText('🛡️ [URBAN 掩體 -70%航彈 -50%直射]', 0, isSelected ? -46 : -36);
      }

      // 火力壓制警示標籤 (Progressive Suppression Badges)
      if (unit.suppression && unit.suppression >= 20) {
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const spdPenalty = Math.round((0.30 + (unit.suppression / 100) * 0.50) * 100);
        if (unit.suppression >= 50 || unit.isPinned) {
          ctx.fillStyle = '#FF1744';
          ctx.fillText(`🛑【重度壓制 PINNED -${spdPenalty}% SPD】`, 0, isSelected ? -55 : -43);
        } else {
          ctx.fillStyle = '#FF9100';
          ctx.fillText(`⚠️【火力壓制 SUPPRESSED -${spdPenalty}% SPD】`, 0, isSelected ? -55 : -43);
        }
      }

      // 反砲擊雷達火控鎖定 (Counter-Battery Radar Lock)
      if (unit.isCounterBatteryFiring) {
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF1744';
        ctx.fillText('📡🎯【反砲擊火控雷達鎖定 COUNTER-BATTERY】', 0, isSelected ? -65 : -53);
        const pingR = (Math.sin(this.time * 10) + 1) * 6 + 14;
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, midY, pingR, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (isSelected || unit.isBanzaiCharging || unit.isSurrendered || unit.disorganized) {
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';

        if (unit.isSurrendered) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('🏳️【已降 SURRENDER】', 0, -35);
        } else if (unit.isBanzaiCharging) {
          ctx.fillStyle = '#FF1744';
          ctx.fillText('🔥【萬歲衝鋒 BANZAI】', 0, -35);
        } else if (unit.disorganized) {
          ctx.fillStyle = '#FFD54F';
          ctx.fillText('⚠️【混亂壓制 DISORGANIZED】', 0, -35);
        } else {
          ctx.fillStyle = isPlayer ? '#90CAF9' : '#FFAB91';
          ctx.fillText(unit.name, 0, -35);
        }

        // 僅在選中時顯示詳細補給與數值，平時維持最高戰術地圖專業可讀性
        if (isSelected) {
          ctx.font = 'bold 7px monospace';
          ctx.fillStyle = unit.isSupplied ? '#00E676' : '#FF5252';
          ctx.fillText(`ORG ${Math.round(orgPct * 100)}% · STR ${Math.round(strPct * 100)}% ${unit.isSupplied ? '[補給通]' : '[斷補]'}`, 0, 32);
        }
      }

      ctx.restore();

      // Selection ring & Weapon range
      if (isSelected) {
        this.drawUnitSelectionRing(unit.pos, 22);

        if (unit.range > 0) {
          ctx.strokeStyle = 'rgba(255, 213, 79, 0.28)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(unit.pos.x, unit.pos.y, unit.range, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    ctx.restore();
  }

  // Draw Strongholds with Capture Zones and Command Posts
  public drawStrongholds(islands: Island[], camera: Camera) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const pulse = (Math.sin(this.time * 3) + 1) * 0.5;

    for (const island of islands) {
      if (island.isFriendlyBase || !island.strongholds) continue;

      for (const sh of island.strongholds) {
        // 1. Circular Tactical Capture Perimeter Zone (380m)
        const isCaptured = sh.isCaptured;
        const isContested = sh.captureProgress > 0 && !isCaptured;

        const zoneColor = isCaptured
          ? 'rgba(0, 230, 118, 0.45)'
          : isContested
          ? 'rgba(255, 213, 79, 0.55)'
          : 'rgba(239, 83, 80, 0.35)';

        ctx.strokeStyle = zoneColor;
        ctx.lineWidth = isCaptured ? 2 : 1.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(sh.cpPos.x, sh.cpPos.y, 380, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Translucent Zone Tint when capturing
        if (isContested) {
          ctx.fillStyle = `rgba(255, 213, 79, ${0.03 + pulse * 0.04})`;
          ctx.beginPath();
          ctx.arc(sh.cpPos.x, sh.cpPos.y, 380, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. CP Tactical Badge floating above CP
        ctx.save();
        ctx.translate(sh.cpPos.x, sh.cpPos.y);

        // CP Progress Bar
        const barW = 56;
        const barH = 5;
        ctx.fillStyle = 'rgba(7, 19, 34, 0.9)';
        ctx.fillRect(-barW / 2, -42, barW, barH);
        ctx.strokeStyle = '#1E3A5F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW / 2, -42, barW, barH);

        const progPct = sh.captureProgress / 100;
        ctx.fillStyle = isCaptured ? '#00E676' : '#FFD54F';
        ctx.fillRect(-barW / 2, -42, barW * progPct, barH);

        // CP Label
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        if (isCaptured) {
          ctx.fillStyle = '#00E676';
          ctx.fillText(`🚩【已解放 LIBERATED】${sh.name}`, 0, -48);
        } else {
          ctx.fillStyle = isContested ? '#FFD54F' : '#FF8A80';
          ctx.fillText(`🚩【據點 CP】${sh.name} · 佔領度: ${Math.round(sh.captureProgress)}%`, 0, -48);
        }

        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  // 碼頭與工事營建落點預覽 (Placement Ghost Blueprint Renderer)
  // ══════════════════════════════════════════════════════════
  public drawPlacementGhost(
    item: RequisitionItem,
    worldPos: Vector2D,
    camera: Camera,
    islands: Island[]
  ) {
    const { ctx, width, height } = this;
    const sx = width / 2 + (worldPos.x - camera.x) * camera.zoom;
    const sy = height / 2 + (worldPos.y - camera.y) * camera.zoom;

    // Find nearest island
    let closestIsland: Island | null = null;
    let minDistance = Infinity;
    for (const isl of islands) {
      const d = Math.hypot(worldPos.x - isl.center.x, worldPos.y - isl.center.y);
      if (d < minDistance) {
        minDistance = d;
        closestIsland = isl;
      }
    }

    let angle = 0;
    let distToCoast = 0;
    const isValidPlacement = true;
    let statusText = '✅ 自由落點座標就緒 - 點擊左鍵戳記建造';

    if (closestIsland) {
      angle = Math.atan2(worldPos.y - closestIsland.center.y, worldPos.x - closestIsland.center.x);
      distToCoast = minDistance - closestIsland.radius;

      const isMaritime =
        item.typeTag === 'dockyard' || item.typeTag === 'pontoon_pier' || item.typeTag === 'major_naval_port';

      if (isMaritime) {
        if (distToCoast < -80) {
          statusText = '⚓ 內灣入海港埠泊位 (點擊直接落成)';
        } else if (distToCoast > 800) {
          statusText = '⚓ 遠洋海面浮動維修泊位 (點擊直接落成)';
        } else {
          statusText = '✅ 理想沿岸水域 - 適合艦艇靠泊補給 (點擊直接落成)';
        }
      } else {
        if (distToCoast < 0) {
          statusText = '🛡️ 島嶼守備陣地工事 (點擊直接構築)';
        } else {
          statusText = '🛡️ 沿岸前沿要塞陣地 (點擊直接構築)';
        }
      }
    }

    ctx.save();

    // 1. Guideline connecting nearest island shoreline to cursor
    if (closestIsland) {
      const shoreWorldX = closestIsland.center.x + Math.cos(angle) * closestIsland.radius;
      const shoreWorldY = closestIsland.center.y + Math.sin(angle) * closestIsland.radius;
      const shoreScreenX = width / 2 + (shoreWorldX - camera.x) * camera.zoom;
      const shoreScreenY = height / 2 + (shoreWorldY - camera.y) * camera.zoom;

      ctx.strokeStyle = isValidPlacement ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 82, 82, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(shoreScreenX, shoreScreenY);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shore anchor indicator
      ctx.fillStyle = isValidPlacement ? '#00E5FF' : '#FF5252';
      ctx.beginPath();
      ctx.arc(shoreScreenX, shoreScreenY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = (Math.sin(this.time * 6) + 1) * 0.5;

    // 2. Operational Range Ring (in world scale)
    let rangeRadius = 600;
    if (item.typeTag === 'major_naval_port') rangeRadius = 850;
    else if (item.typeTag === 'dockyard') rangeRadius = 650;
    else if (item.typeTag === 'pontoon_pier') rangeRadius = 550;
    else if (item.typeTag === 'm1_240mm') rangeRadius = item.era === 'era5' ? 3800 : item.era === 'era4' ? 3600 : item.era === 'era3' ? 3400 : item.era === 'era2' ? 3200 : 2800;
    else if (item.typeTag === 'coastal_gun') rangeRadius = 2000;
    else if (item.typeTag === 'heavy_aa') rangeRadius = 1200;
    else if (item.typeTag === 'radar') rangeRadius = 4500;

    const screenRangeRadius = rangeRadius * camera.zoom;
    ctx.strokeStyle = isValidPlacement
      ? `rgba(0, 229, 255, ${0.25 + pulse * 0.15})`
      : `rgba(255, 82, 82, ${0.25 + pulse * 0.15})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(sx, sy, screenRangeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Blueprint Hologram at Cursor
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const zoomScale = Math.max(0.4, Math.min(2.5, camera.zoom));
    ctx.scale(zoomScale, zoomScale);

    const blueprintColor = isValidPlacement ? '#00E5FF' : '#FF5252';
    const blueprintFill = isValidPlacement
      ? `rgba(0, 229, 255, ${0.18 + pulse * 0.12})`
      : `rgba(255, 82, 82, ${0.18 + pulse * 0.12})`;

    ctx.strokeStyle = blueprintColor;
    ctx.fillStyle = blueprintFill;
    ctx.lineWidth = 2;

    if (item.typeTag === 'dockyard') {
      // 浮動修船塢 U型槽
      ctx.fillRect(-24, -12, 10, 48);
      ctx.strokeRect(-24, -12, 10, 48);
      ctx.fillRect(14, -12, 10, 48);
      ctx.strokeRect(14, -12, 10, 48);
      ctx.beginPath();
      ctx.moveTo(-24, 36);
      ctx.lineTo(24, 36);
      ctx.stroke();

      // 起重機吊桿
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-34, -18);
      ctx.moveTo(18, 0);
      ctx.lineTo(34, -18);
      ctx.stroke();
    } else if (item.typeTag === 'major_naval_port') {
      // 大型深水突堤軍港
      ctx.fillRect(-42, -14, 84, 28);
      ctx.strokeRect(-42, -14, 84, 28);
      // 龍門吊車架構
      ctx.beginPath();
      ctx.moveTo(-20, -14);
      ctx.lineTo(-20, -26);
      ctx.lineTo(20, -26);
      ctx.lineTo(20, -14);
      ctx.stroke();
    } else if (item.typeTag === 'm1_240mm' || item.typeTag === 'coastal_gun') {
      const rPit = item.typeTag === 'm1_240mm' ? 16 : 12;
      ctx.beginPath();
      ctx.arc(0, 0, rPit, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = item.typeTag === 'm1_240mm' ? 4 : 2.5;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(item.typeTag === 'm1_240mm' ? 34 : 24, 0);
      ctx.stroke();
    } else {
      // 浮式棧橋碼頭或其他設施
      ctx.fillRect(-28, -8, 56, 16);
      ctx.strokeRect(-28, -8, 56, 16);
      for (let px = -24; px <= 24; px += 6) {
        ctx.beginPath();
        ctx.moveTo(px, -8);
        ctx.lineTo(px, 8);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(26, -14);
      ctx.lineTo(32, -8);
      ctx.stroke();
    }

    // Directional Arrow pointing seaward
    ctx.strokeStyle = blueprintColor;
    ctx.fillStyle = blueprintColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 70);
    ctx.lineTo(-8, 58);
    ctx.moveTo(0, 70);
    ctx.lineTo(8, 58);
    ctx.stroke();

    ctx.restore();

    // 4. Tactical Placement Badge (Screen Space floating above cursor)
    const cardW = 280;
    const cardH = 74;
    const cardX = sx - cardW / 2;
    const cardY = sy - screenRangeRadius - cardH - 12;

    ctx.fillStyle = 'rgba(5, 15, 28, 0.92)';
    ctx.strokeStyle = isValidPlacement ? '#00E5FF' : '#FF5252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 6);
    ctx.fill();
    ctx.stroke();

    // Header badge bar
    ctx.fillStyle = isValidPlacement ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 82, 82, 0.2)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, 22, [6, 6, 0, 0]);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#00E5FF';
    ctx.fillText(`⚓【戰地設施自由戳記】${item.name}`, cardX + 8, cardY + 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(`${item.cost} CP`, cardX + cardW - 8, cardY + 15);

    // Coordinate & Coastal info
    ctx.textAlign = 'left';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#E0F7FA';
    ctx.fillText(
      `座標: (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)}) · ${closestIsland ? closestIsland.name : '近海'}`,
      cardX + 8,
      cardY + 36
    );

    ctx.fillStyle = '#80DEEA';
    ctx.fillText(statusText, cardX + 8, cardY + 50);

    // Hotkey instruction
    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#FFE082';
    ctx.fillText(`👉 [滑鼠左鍵] 點擊自由戳記落點 | [ESC / 右鍵] 結束戳記`, cardX + 8, cardY + 66);

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  // 時代三搜救救生筏繪製 (Era 3 Downed Pilot Life Raft on Ocean)
  // ══════════════════════════════════════════════════════════
  public drawLifeRafts(lifeRafts: LifeRaft[], camera: Camera) {
    if (!lifeRafts || lifeRafts.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const raft of lifeRafts) {
      if (raft.rescued) continue;

      ctx.save();
      ctx.translate(raft.pos.x, raft.pos.y);

      const isFriendly = raft.side !== 'enemy';
      const isOnLand = !!raft.isOnLand;
      const bob = isOnLand ? 0 : Math.sin(this.time * 3 + raft.pos.x * 0.1) * 2;
      const pulse = (Math.sin(this.time * 6) + 1) * 0.5;

      if (!isOnLand) {
        // 海面同心水波 (Concentric sea ripples)
        ctx.strokeStyle = isFriendly
          ? `rgba(128, 222, 234, ${0.35 + pulse * 0.25})`
          : `rgba(255, 82, 82, ${0.35 + pulse * 0.25})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, bob, 18 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();

        // 海面充氣救生筏 (Inflatable Life Raft Hexagon)
        ctx.fillStyle = isFriendly ? '#FF6D00' : '#D84315';
        ctx.strokeStyle = isFriendly ? '#FFD54F' : '#FF8A80';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const rad = (i * Math.PI) / 3;
          const rx = Math.cos(rad) * 9;
          const ry = Math.sin(rad) * 6.5 + bob;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 救生筏內襯
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.ellipse(0, bob, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 陸地跳傘降落傘降 (Downed Parachute Canopy on Land)
        ctx.fillStyle = isFriendly ? 'rgba(236, 239, 241, 0.85)' : 'rgba(85, 139, 47, 0.85)';
        ctx.strokeStyle = isFriendly ? '#90A4AE' : '#33691E';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, -6, 14, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 傘繩牽引向飛行員 (Suspension cords)
        ctx.strokeStyle = 'rgba(207, 216, 220, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(0, 3);
        ctx.moveTo(10, -6);
        ctx.lineTo(0, 3);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 3);
        ctx.stroke();
      }

      // 落難飛行員頭部軀幹 (Downed Pilot Figure)
      ctx.fillStyle = '#FFE082';
      ctx.beginPath();
      ctx.arc(0, isOnLand ? 3 : bob - 1, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 求救煙霧信號 (Emergency Smoke Flare Plume)
      const flareColor = isFriendly ? '255, 109, 0' : '229, 57, 53';
      const flareGrad = ctx.createRadialGradient(8, bob - 10, 1, 8, bob - 10, 12);
      flareGrad.addColorStop(0, `rgba(${flareColor}, 0.85)`);
      flareGrad.addColorStop(0.6, `rgba(${flareColor}, 0.45)`);
      flareGrad.addColorStop(1, `rgba(${flareColor}, 0)`);
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(8, bob - 10, 12, 0, Math.PI * 2);
      ctx.fill();

      // 閃爍信號燈 / 密碼信標 (Strobe Light Beacon Blip)
      if (Math.sin(this.time * 12) > 0) {
        ctx.fillStyle = isFriendly ? '#FFFFFF' : '#FF5252';
        ctx.beginPath();
        ctx.arc(0, bob - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 直升機吊掛打撈進度環 (SAR Winch Cable & Rescue Progress Ring)
      if (raft.rescueProgress > 0) {
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        const pct = Math.min(1, raft.rescueProgress / 3.0);
        ctx.arc(0, bob, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#00E676';
        ctx.textAlign = 'center';
        ctx.fillText(`🚁 吊掛打撈中: ${Math.round(pct * 100)}%`, 0, bob - 28);
      } else {
        // 倒數計時與戰術標籤 (Friendly SAR vs POW Reward)
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        if (isFriendly) {
          ctx.fillStyle = raft.timer < 30 ? '#FF5252' : '#80DEEA';
          ctx.fillText(
            isOnLand
              ? `🪂【我方跳傘員】${Math.round(raft.timer)}s · 接近救起 +1戰機`
              : `🛟【我軍救生筏】${Math.round(raft.timer)}s · 接近救起 +1戰機`,
            0,
            bob - 22
          );
        } else {
          ctx.fillStyle = '#FFB74D';
          ctx.fillText(
            isOnLand
              ? `🎖️【敵跳傘員·POW】${Math.round(raft.timer)}s · 靠近俘獲 +100 CP`
              : `🎖️【敵救生筏·POW】${Math.round(raft.timer)}s · 靠近俘獲 +100 CP`,
            0,
            bob - 22
          );
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════
  // 時代三戰術核打擊全景特效 (全域白光盲閃、超音速擴散震波與升騰巨型蕈狀雲)
  // ══════════════════════════════════════════════════════════
  public drawNuclearEffects(flash: number, detonations: NuclearDetonation[], camera: Camera) {
    const ctx = this.ctx;

    // 1. 全螢幕熱核白光盲閃 (Screen-Space Thermal Blind Flash)
    if (flash > 0) {
      const alpha = Math.min(1.0, flash);
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    if (!detonations || detonations.length === 0) return;

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const det of detonations) {
      const progress = Math.min(1.0, det.timer / det.duration);
      const fade = 1 - progress;

      // A. 熱核高溫焦土與沸騰海域環 (Thermal Scorch Footprint - 匹配 220m 毀傷半徑)
      const scorchRadius = Math.min(det.maxRadius, 140 + progress * 80);
      const scorchGrad = ctx.createRadialGradient(det.x, det.y, 0, det.x, det.y, scorchRadius);
      scorchGrad.addColorStop(0, `rgba(255, 109, 0, ${0.45 * fade})`);
      scorchGrad.addColorStop(0.3, `rgba(191, 54, 12, ${0.35 * fade})`);
      scorchGrad.addColorStop(0.7, `rgba(38, 50, 56, ${0.25 * fade})`);
      scorchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = scorchGrad;
      ctx.beginPath();
      ctx.arc(det.x, det.y, scorchRadius, 0, Math.PI * 2);
      ctx.fill();

      // B. 超音速外擴震波光環 (High-Mach Expanding Shockwave Rings)
      const shockRadius = Math.min(680, progress * 950);
      if (shockRadius < 680 && progress < 0.75) {
        const shockAlpha = (1 - progress / 0.75) * 0.85;
        ctx.strokeStyle = `rgba(255, 248, 225, ${shockAlpha})`;
        ctx.lineWidth = 14 * (1 - progress / 0.75);
        ctx.beginPath();
        ctx.arc(det.x, det.y, shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 內層高折射光環
        ctx.strokeStyle = `rgba(255, 171, 0, ${shockAlpha * 0.6})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(det.x, det.y, Math.max(0, shockRadius - 25), 0, Math.PI * 2);
        ctx.stroke();
      }

      // C. 核心熱核火球 (Central Thermonuclear Fireball)
      const fireballRadius = Math.min(180, (1 - Math.exp(-progress * 8)) * 140);
      const fireAlpha = Math.max(0, 1 - progress * 1.5) * 0.9;
      if (fireAlpha > 0) {
        const fireGrad = ctx.createRadialGradient(det.x, det.y, 0, det.x, det.y, fireballRadius);
        fireGrad.addColorStop(0, `rgba(255, 255, 255, ${fireAlpha})`);
        fireGrad.addColorStop(0.2, `rgba(255, 235, 59, ${fireAlpha * 0.95})`);
        fireGrad.addColorStop(0.5, `rgba(255, 87, 34, ${fireAlpha * 0.85})`);
        fireGrad.addColorStop(0.85, `rgba(183, 28, 28, ${fireAlpha * 0.6})`);
        fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(det.x, det.y, fireballRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // D. 升騰巨型蕈狀雲柱與翻滾傘狀冠部 (Rising Mushroom Cloud Stem & Billowing Cap)
      const stemHeight = Math.min(320, progress * 420);
      const stemWidth = 35 + progress * 45;
      const stemBaseY = det.y;
      const stemTopY = det.y - stemHeight;

      // 翻滾火柱主幹 (Turbulent vertical stem)
      const stemGrad = ctx.createLinearGradient(det.x, stemBaseY, det.x, stemTopY);
      stemGrad.addColorStop(0, `rgba(62, 39, 35, ${0.65 * fade})`);
      stemGrad.addColorStop(0.4, `rgba(255, 112, 67, ${0.5 * fade})`);
      stemGrad.addColorStop(0.8, `rgba(97, 97, 97, ${0.75 * fade})`);
      stemGrad.addColorStop(1, `rgba(33, 33, 33, ${0.85 * fade})`);
      ctx.fillStyle = stemGrad;
      ctx.beginPath();
      ctx.ellipse(det.x, (stemBaseY + stemTopY) / 2, stemWidth / 2, stemHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 威爾遜凝結雲環 (Wilson Condensation Cloud Ring around neck collar)
      if (progress > 0.08 && progress < 0.65) {
        const ringAlpha = Math.sin(((progress - 0.08) / 0.57) * Math.PI) * 0.7;
        const ringRadius = stemWidth * 1.5;
        ctx.fillStyle = `rgba(245, 245, 245, ${ringAlpha})`;
        ctx.beginPath();
        ctx.ellipse(det.x, stemTopY + stemHeight * 0.25, ringRadius, ringRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 巨型翻滾蕈狀雲冠部 (Multi-lobed Billowing Cap)
      const capRadiusX = Math.min(260, 60 + progress * 240);
      const capRadiusY = Math.min(150, 40 + progress * 130);
      const capCenterY = stemTopY;

      // 冠部內部熾熱餘輝 (Internal Fire Glow)
      if (progress < 0.6) {
        const capGlow = ctx.createRadialGradient(det.x, capCenterY, 0, det.x, capCenterY, capRadiusX * 0.7);
        capGlow.addColorStop(0, `rgba(255, 179, 0, ${(1 - progress / 0.6) * 0.8})`);
        capGlow.addColorStop(0.6, `rgba(244, 81, 30, ${(1 - progress / 0.6) * 0.5})`);
        capGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = capGlow;
        ctx.beginPath();
        ctx.ellipse(det.x, capCenterY, capRadiusX * 0.7, capRadiusY * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 重疊翻滾煙塵球瓣 (Overlapping Dark Billow Lobes)
      const lobes = 10;
      for (let l = 0; l < lobes; l++) {
        const lAngle = (l / lobes) * Math.PI * 2;
        const lx = det.x + Math.cos(lAngle) * (capRadiusX * 0.65);
        const ly = capCenterY + Math.sin(lAngle) * (capRadiusY * 0.55);
        const lRadius = 32 + progress * 42;

        const lobeGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lRadius);
        lobeGrad.addColorStop(0, `rgba(66, 66, 66, ${0.85 * fade})`);
        lobeGrad.addColorStop(0.7, `rgba(33, 33, 33, ${0.75 * fade})`);
        lobeGrad.addColorStop(1, 'rgba(18, 18, 18, 0)');
        ctx.fillStyle = lobeGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, lRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 冠部平流層頂部穹頂 (Overarching Anvil Top)
      const capGrad = ctx.createRadialGradient(det.x, capCenterY - capRadiusY * 0.2, 0, det.x, capCenterY, capRadiusX);
      capGrad.addColorStop(0, `rgba(117, 117, 117, ${0.8 * fade})`);
      capGrad.addColorStop(0.6, `rgba(66, 66, 66, ${0.75 * fade})`);
      capGrad.addColorStop(1, 'rgba(15, 15, 15, 0)');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.ellipse(det.x, capCenterY - capRadiusY * 0.1, capRadiusX, capRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // 戰場上空熱核標注徽章 (Overhead Tactical Nuclear Banner)
      ctx.fillStyle = '#FFE082';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(`☢️【戰術核打擊點 - ${det.targetIslandName || '群島要塞'}】`, det.x, det.y + 40);
      ctx.fillStyle = '#FF8A80';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('熱核汽化半徑 550m · 全島守備設施完全湮滅', det.x, det.y + 56);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Interactive Tactical CAP Area Designation Reticle
  public drawCapPreview(pos: Vector2D, camera: Camera) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const orbitR = 250;
    const pulse = (Math.sin(this.time * 6) + 1) * 0.5;

    // Glowing cyan patrol perimeter
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, orbitR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shaded patrol sector
    ctx.fillStyle = `rgba(0, 229, 255, ${0.08 + pulse * 0.05})`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, orbitR, 0, Math.PI * 2);
    ctx.fill();

    // Center crosshair
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pos.x - 18, pos.y);
    ctx.lineTo(pos.x + 18, pos.y);
    ctx.moveTo(pos.x, pos.y - 18);
    ctx.lineTo(pos.x, pos.y + 18);
    ctx.stroke();

    // Rotating radar scan line
    const sweepA = (this.time * 2.2) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + Math.cos(sweepA) * orbitR, pos.y + Math.sin(sweepA) * orbitR);
    ctx.stroke();

    // Top instruction banner
    ctx.fillStyle = '#E0F7FA';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText('🛡️【設定 CAP 戰鬥空巡區域】點擊海圖建立盤旋空巡防線 (ESC 取消)', pos.x, pos.y - orbitR - 12);
    ctx.fillStyle = '#80DEEA';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`中心座標: [X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}] · 盤旋半徑 250m · 自動截擊`, pos.x, pos.y - orbitR + 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Render Active Air-Dropped Passive Sonobuoys & Acoustic Ping Sweeps
  public drawSonobuoys(sonobuoys: Sonobuoy[], camera: Camera) {
    if (!sonobuoys || sonobuoys.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const buoy of sonobuoys) {
      const flashTimer = buoy.contactFlashTimer ?? 0;
      const hasContact = flashTimer > 0;
      const lifeRatio = Math.max(0, Math.min(1, buoy.lifetime / Math.max(1, buoy.maxLifetime)));
      const pingProgress = 1 - Math.max(0, Math.min(1, buoy.pingTimer / Math.max(0.1, buoy.pingInterval)));

      // Subtle dashed passive hydrophone listening perimeter
      ctx.strokeStyle = hasContact ? 'rgba(255, 82, 82, 0.55)' : 'rgba(38, 198, 218, 0.24)';
      ctx.lineWidth = hasContact ? 1.8 : 1.1;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.arc(buoy.pos.x, buoy.pos.y, buoy.detectionRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Very light acoustic water tint inside perimeter
      ctx.fillStyle = hasContact ? 'rgba(255, 82, 82, 0.045)' : 'rgba(38, 198, 218, 0.025)';
      ctx.beginPath();
      ctx.arc(buoy.pos.x, buoy.pos.y, buoy.detectionRadius, 0, Math.PI * 2);
      ctx.fill();

      // Expanding faint ping ring shortly after each listening sweep
      if (pingProgress < 0.35) {
        const waveProgress = pingProgress / 0.35;
        const waveR = Math.max(18, buoy.detectionRadius * waveProgress);
        ctx.strokeStyle = hasContact
          ? `rgba(255, 110, 110, ${(1 - waveProgress) * 0.45})`
          : `rgba(0, 229, 255, ${(1 - waveProgress) * 0.28})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(buoy.pos.x, buoy.pos.y, waveR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sonobuoy battery ring around surface float
      ctx.strokeStyle = hasContact ? '#FF5252' : '#00E5FF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(buoy.pos.x, buoy.pos.y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
      ctx.stroke();

      // Surface orange/white radio float + whip antenna
      ctx.fillStyle = hasContact ? '#FF5252' : '#FF7043';
      ctx.beginPath();
      ctx.arc(buoy.pos.x, buoy.pos.y, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E0F7FA';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Whip antenna tick
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(buoy.pos.x, buoy.pos.y);
      ctx.lineTo(buoy.pos.x + 3, buoy.pos.y - 10);
      ctx.stroke();

      // Bearing line hint to transient contact when triggered
      if (hasContact && buoy.lastContactPos) {
        ctx.strokeStyle = `rgba(255, 138, 128, ${Math.min(0.85, flashTimer * 0.7)})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(buoy.pos.x, buoy.pos.y);
        ctx.lineTo(buoy.lastContactPos.x, buoy.lastContactPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Zoom-gated crisp label
      if (camera.zoom >= 0.32) {
        ctx.fillStyle = hasContact ? '#FF8A80' : '#80DEEA';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${hasContact ? '🚨 聲紋接觸' : '📡 聲納浮標'} · ${Math.ceil(buoy.lifetime)}s`,
          buoy.pos.x,
          buoy.pos.y + 24
        );
      }
    }

    ctx.restore();
  }

  // Interactive Passive Sonobuoy Drop Reticle
  public drawSonobuoyPreview(pos: Vector2D, radius: number, camera: Camera, era: Era) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const pulse = (Math.sin(this.time * 5.5) + 1) * 0.5;
    const isLegacyEra = era === 'era1' || era === 'era2';
    const strokeCol = isLegacyEra ? `rgba(255, 138, 128, ${0.65 + pulse * 0.25})` : `rgba(38, 198, 218, ${0.72 + pulse * 0.28})`;
    const fillCol = isLegacyEra ? 'rgba(255, 82, 82, 0.06)' : `rgba(0, 229, 255, ${0.06 + pulse * 0.04})`;

    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = fillCol;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner crosshair & buoy icon ring
    ctx.strokeStyle = isLegacyEra ? '#FF8A80' : '#00E5FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
    ctx.moveTo(pos.x - 24, pos.y);
    ctx.lineTo(pos.x + 24, pos.y);
    ctx.moveTo(pos.x, pos.y - 24);
    ctx.lineTo(pos.x, pos.y + 24);
    ctx.stroke();

    ctx.fillStyle = '#E0F7FA';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(
      isLegacyEra
        ? '⚠️ 二戰時期（時代一～二）尚無空投被動聲納浮標'
        : '📡【投擲被動聲納浮標】左鍵點擊海域佈放 (Shift 連續插眼 · 右鍵/ESC 取消)',
      pos.x,
      pos.y - 32
    );
    if (!isLegacyEra) {
      ctx.fillStyle = '#80DEEA';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`監聽半徑 ${radius}m · 間歇水聽暴露通過之敵軍潛艦`, pos.x, pos.y + 42);
    }
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Right-click RTS Tactical Order Confirmation Ripples
  public drawOrderMarkers(markers: OrderMarker[], camera: Camera) {
    if (!markers || markers.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const m of markers) {
      const progress = Math.max(0, Math.min(1, m.age / m.maxAge));
      const alpha = (1 - progress) * 0.9;
      const color =
        m.type === 'attack'
          ? `rgba(255, 82, 82, ${alpha})`
          : m.type === 'patrol'
          ? `rgba(0, 229, 255, ${alpha})`
          : m.type === 'rescue'
          ? `rgba(255, 213, 79, ${alpha})`
          : `rgba(0, 230, 118, ${alpha})`;

      const radius = m.type === 'attack' ? 32 - progress * 18 : 10 + progress * 34;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 / Math.max(0.4, camera.zoom);
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, Math.max(6, radius), 0, Math.PI * 2);
      ctx.stroke();

      // Inner crisp vector ticks
      const tick = 10 / Math.max(0.45, camera.zoom);
      ctx.beginPath();
      ctx.moveTo(m.pos.x - tick, m.pos.y);
      ctx.lineTo(m.pos.x + tick, m.pos.y);
      ctx.moveTo(m.pos.x, m.pos.y - tick);
      ctx.lineTo(m.pos.x, m.pos.y + tick);
      ctx.stroke();
    }

    ctx.restore();
  }
}

