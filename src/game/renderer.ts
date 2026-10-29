import {
  Ship,
  Aircraft,
  Island,
  IslandStronghold,
  Projectile,
  Particle,
  Vector2D,
  Installation,
  SelectionBox,
  GroundUnit,
  RequisitionItem,
  LifeRaft,
  NuclearDetonation,
} from '../types/game';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
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

  // Clear & Draw Ocean Grid with Radar Sweep & Chart Markings
  public drawOcean(camera: Camera, worldSize: number, radarOrigin?: Vector2D) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#050D18';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

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
      // 1. Shore ripple
      ctx.strokeStyle = `rgba(100, 181, 246, ${0.15 + wavePulse * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < island.points.length; i++) {
        const p = island.points[i];
        const dx = p.x - island.center.x;
        const dy = p.y - island.center.y;
        const dist = Math.hypot(dx, dy);
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

      // 6. Continental Hills & Mountain Ridges
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

      // 7. Dense Tropical Jungle Clusters (Dominant terrain in Era 4)
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

          // Organic canopy lumps
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

    if (inst.type === 'airfield') {
      ctx.lineWidth = 2;
      ctx.strokeRect(-65, -12, 130, 24);
      ctx.fillRect(-65, -12, 130, 24);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(-55, 0);
      ctx.lineTo(55, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 16, 14, 14);

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '✈️ [友軍航空基地 AFB]' : '✈️ [敵軍航空基地 AFB]', 0, -18);
    } else if (inst.type === 'coastal_gun') {
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

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[NATO 友軍岸防砲連] 155mm' : '[NATO 敵軍岸防重砲] 140mm', 0, -20);
    } else if (inst.type === 'radar_station') {
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -10, 20, 20);

      const radarAngle = this.time * 3;
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
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * 14;
        const y = Math.sin(a) * 14;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isPlayer ? '[友軍戰略油彈庫]' : '[敵軍戰略彈藥庫]', 0, -22);
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
    } else if (inst.type === 'sam_hawk') {
      // ════ 美軍陸戰隊 MIM-23 鷹式防空飛彈排 (MIM-23 Hawk Mobile SAM Battery) ════
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

      // 3. 三聯裝鷹式飛彈導軌與 3 枚白色羽翼飛彈
      const hawkRot = this.time * 0.4;
      for (let m = 0; m < 3; m++) {
        const mAngle = hawkRot + (m * Math.PI * 2) / 3;
        const mx = Math.cos(mAngle) * 8;
        const my = 6 + Math.sin(mAngle) * 8;

        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(mAngle) * 14, my + Math.sin(mAngle) * 14);
        ctx.stroke();

        // 鷹式標誌性梯形大翼
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
      ctx.fillText('🚀 [NATO 友軍霍克防空飛彈 SAM] MIM-23 Hawk (自動攔截)', 0, -36);
    } else if (inst.type === 'sa2_sam_site') {
      // ════ 敵軍 S-75 德維納 / SA-2 導針防空飛彈營 (S-75 Dvina SA-2 Guideline Site) ════
      // 1. 環形防護土堤碉堡
      ctx.strokeStyle = '#FF5252';
      ctx.fillStyle = 'rgba(62, 39, 35, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 4, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. 六邊形發射架滑軌
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(14, 4);
      ctx.stroke();

      // 3. 巨大的 SA-2 兩級防空飛彈 (銀白彈體 + 紅色助推段)
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

      // 標籤
      ctx.fillStyle = '#FF5252';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 [敵軍薩姆-2 防空飛彈營] SA-2 Guideline', 0, -22);
    } else if (inst.type === 'fan_song_radar') {
      // ════ 敵軍扇歌射控火控雷達 (Fan Song Fire Control Radar) ════
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-12, -10, 24, 20);
      ctx.fillRect(-12, -10, 24, 20);

      // 動態旋轉的方位角天線與雙拋物面天線
      const radarRot = this.time * 2.8;
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(radarRot) * 22, Math.sin(radarRot) * 22);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(radarRot + Math.PI / 2) * 16, Math.sin(radarRot + Math.PI / 2) * 16);
      ctx.stroke();

      // 電磁波輻射環 (供 AGM-45 反輻射飛彈鎖定示意)
      const radPulse = (Math.sin(this.time * 6) + 1) * 0.5;
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.3 + radPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, 24 + radPulse * 8, 0, Math.PI * 2);
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

  // Draw Ships with RTS Selection Indicators
  public drawShips(ships: Ship[], camera: Camera, selectedUnitIds: string[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const ship of ships) {
      this.drawWake(ship);

      const isSelected = selectedUnitIds.includes(ship.id);

      // RTS Waypoint vector line
      if (isSelected && ship.order.targetPos && ship.order.type === 'move') {
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(ship.pos.x, ship.pos.y);
        ctx.lineTo(ship.order.targetPos.x, ship.order.targetPos.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#00E676';
        ctx.beginPath();
        ctx.arc(ship.order.targetPos.x, ship.order.targetPos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const isPlayer = ship.side === 'player';
      const hullColor = isPlayer ? '#E0F7FA' : '#FFCDD2';
      const detailColor = isPlayer ? '#80DEEA' : '#EF9A9A';

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
        }
        this.renderShipHullByType(ship, hullColor, detailColor);
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

        // 2. NATO APP-6 Naval Tactical Frame (Blue Rectangle / Red Diamond)
        const frameW = 32;
        const frameH = 18;
        const frameY = ship.pos.y - ship.width - 32;
        const isPl = ship.side === 'player';
        ctx.strokeStyle = isPl ? '#42A5F5' : '#FF5252';
        ctx.fillStyle = isPl ? 'rgba(13, 71, 161, 0.75)' : 'rgba(183, 28, 28, 0.75)';
        ctx.lineWidth = 1.6;

        ctx.strokeRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);
        ctx.fillRect(ship.pos.x - frameW / 2, frameY, frameW, frameH);

        // Naval Surface Symbol: Water Line with Anchor/Mast
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ship.pos.x - 9, frameY + frameH * 0.7);
        ctx.lineTo(ship.pos.x + 9, frameY + frameH * 0.7);
        ctx.moveTo(ship.pos.x, frameY + frameH * 0.25);
        ctx.lineTo(ship.pos.x, frameY + frameH * 0.7);
        ctx.stroke();

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
        this.drawShipStatus(ship);
      }
    }

    ctx.restore();
  }

  // Draw RTS Selection Ring
  private drawUnitSelectionRing(pos: Vector2D, radius: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#00E676';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Ship Wake Lines
  private drawWake(ship: Ship) {
    if (ship.speed < 0.5 || ship.wakePoints.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = ship.side === 'player' ? 'rgba(128, 222, 234, 0.28)' : 'rgba(239, 154, 154, 0.22)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < ship.wakePoints.length; i++) {
      const p = ship.wakePoints[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Bow wave V-spray lines
    const cosH = Math.cos(ship.heading);
    const sinH = Math.sin(ship.heading);
    const bowX = ship.pos.x + cosH * (ship.length * 0.48);
    const bowY = ship.pos.y + sinH * (ship.length * 0.48);
    const sprayLen = Math.min(20, ship.speed * 1.1);

    ctx.strokeStyle = 'rgba(224, 247, 250, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bowX, bowY);
    ctx.lineTo(bowX - cosH * sprayLen + sinH * (sprayLen * 0.6), bowY - sinH * sprayLen - cosH * (sprayLen * 0.6));
    ctx.moveTo(bowX, bowY);
    ctx.lineTo(bowX - cosH * sprayLen - sinH * (sprayLen * 0.6), bowY - sinH * sprayLen + cosH * (sprayLen * 0.6));
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

    ctx.fillStyle = '#081726';
    ctx.strokeStyle = hullColor;
    ctx.lineWidth = 2;

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

  // Submarine Line Art (I-19 / I-400)
  private drawSubmarine(ship: Ship, hullColor: string, detailColor: string) {
    const ctx = this.ctx;
    const l = ship.length;
    const w = ship.width;

    if (ship.isSubmerged) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
    } else {
      ctx.strokeStyle = hullColor;
    }

    ctx.fillStyle = '#06101A';
    ctx.lineWidth = 2;

    // Streamlined fish hull with bow & stern dive planes
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

    // Conning Tower with periscope & deck gun
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-l * 0.08, -w * 0.22, l * 0.16, w * 0.44);

    // Deck gun forward
    ctx.beginPath();
    ctx.moveTo(l * 0.14, 0);
    ctx.lineTo(l * 0.24, 0);
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
  private drawLSMR(ship: Ship, hullColor: string, detailColor: string) {
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

      ctx.fillStyle = '#0D2235';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(0, 0, turret.barrelCount > 2 ? 6.5 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.lineWidth = 2;
      const bLen = turret.barrelCount > 2 ? 16 : 12;
      if (turret.barrelCount === 1) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bLen, 0);
        ctx.stroke();
      } else if (turret.barrelCount === 2) {
        ctx.beginPath();
        ctx.moveTo(0, -2.5);
        ctx.lineTo(bLen, -2.5);
        ctx.moveTo(0, 2.5);
        ctx.lineTo(bLen, 2.5);
        ctx.stroke();
      } else if (turret.barrelCount >= 3) {
        ctx.beginPath();
        ctx.moveTo(0, -3.5);
        ctx.lineTo(bLen, -3.5);
        ctx.moveTo(0, 0);
        ctx.lineTo(bLen, 0);
        ctx.moveTo(0, 3.5);
        ctx.lineTo(bLen, 3.5);
        ctx.stroke();
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

  // 依照艦種呼叫對應之向量線條艦體繪製
  private renderShipHullByType(ship: Ship, hullColor: string, detailColor: string) {
    if (ship.type === 'carrier') {
      this.drawCarrier(ship, hullColor, detailColor);
    } else if (ship.type === 'cv63') {
      this.drawCV63(ship, hullColor, detailColor);
    } else if (ship.type === 'cg') {
      this.drawBelknapCG(ship, hullColor, detailColor);
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
    }
  }

  private drawShipStatus(ship: Ship) {
    const ctx = this.ctx;
    const isPlayer = ship.side === 'player';
    
    const maxWcs = ship.maxWeaponControlHealth || ship.maxHealth;
    const curWcs = ship.weaponControlHealth !== undefined ? ship.weaponControlHealth : ship.health;
    const wcsPct = Math.max(0, Math.min(1, curWcs / maxWcs));

    const maxHcs = ship.maxHullCrewHealth || ship.maxHealth;
    const curHcs = ship.hullCrewHealth !== undefined ? ship.hullCrewHealth : ship.health;
    const hcsPct = Math.max(0, Math.min(1, curHcs / maxHcs));

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
    ctx.strokeStyle = isPlayer ? 'rgba(66, 165, 245, 0.45)' : 'rgba(239, 83, 80, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateWidth, plateHeight, 3);
    ctx.fill();
    ctx.stroke();

    // 1. Ship Identifier Name & Submarine Status
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isPlayer ? '#E0F7FA' : '#FFCDD2';
    ctx.fillText(ship.codeName || ship.name, ship.pos.x, ship.pos.y + yOffset - 1);

    if (ship.type === 'submarine' && (ship.isSubmerged ?? true)) {
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = '#4DD0E1';
      ctx.fillText('[深潛 · 艦砲免疫]', ship.pos.x, plateY - 4);
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
      const isPlayer = plane.side === 'player';
      const cosH = Math.cos(plane.heading);
      const sinH = Math.sin(plane.heading);

      // ══════════════════════════════════════════════════════════
      // 1. 動態高度陰影 (Scale-accurate Altitude Ocean Drop Shadow)
      // ══════════════════════════════════════════════════════════
      if (plane.altitude > 0.08) {
        const altOffset = plane.altitude * 32;
        const shadowScale = 0.85 + plane.altitude * 0.25;
        const shadowAlpha = 0.32 * Math.min(1, plane.altitude * 1.6);
        ctx.save();
        ctx.translate(plane.pos.x + altOffset * 0.72, plane.pos.y + altOffset * 0.72);
        ctx.rotate(plane.heading);
        ctx.scale(shadowScale, shadowScale);
        ctx.fillStyle = `rgba(3, 9, 18, ${shadowAlpha})`;

        // Fuselage shadow
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings shadow
        ctx.beginPath();
        ctx.ellipse(1, 0, 4.2, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail shadow
        ctx.beginPath();
        ctx.ellipse(-9, 0, 2.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

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
      const color = isPlayer ? '#80D8FF' : '#FF8A80';

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

        // ══════════════════════════════════════════════════════════
        // 時代三噴射機尾焰與直升機旋翼動效 (Jet Flame & Helicopter Rotor)
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
          plane.model === 'mig17' ||
          plane.model === 'il28';

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
            plane.model === 'il28';
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

        const isHelo = plane.model === 'ho3s1' || plane.model === 'uh2' || plane.model === 'uh1' || plane.model === 'ah1' || plane.model === 'sh2';
        if (isHelo) {
          const rotorAngle = this.time * 42;
          const rRadius = plane.model === 'ah1' ? 18 : 22;
          ctx.strokeStyle = 'rgba(128, 222, 234, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, rRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 2-blade or 3-blade main rotor
          const blades = plane.model === 'ho3s1' ? 3 : 2;
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
          ctx.strokeStyle = '#FFD54F';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(-16, 2, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // ══════════════════════════════════════════════════════════
        // 5. 雙方二戰史實敵我識別特徵 (Historical Combat IFF Markings - No Civilian Nav Lights)
        // ══════════════════════════════════════════════════════════
        if (!isPlayer) {
          const isColdWarOpfor =
            plane.model === 'mig15' ||
            plane.model === 'tu14' ||
            plane.model === 'yak9' ||
            plane.model === 'il10';

          if (!isColdWarOpfor) {
            // 日軍特徵: 主翼前緣黃色敵我識別帶 (Yellow Leading Edge Band) + 胴體識別標帶
            const m = plane.model;
            const span = m === 'g4m' ? 32 : (m === 'kate' || m === 'jill' || m === 'val') ? 17 : 14;
            this.drawJapaneseIFFLeadingEdge(span, 3.5, 3.5);

            // 機尾識別白胴帶 (Hachimaki identification stripe across fuselage)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-6, -2.5, 2.5, 5);
          } else {
            // 冷戰聯軍: 機尾紅星識別與紅星翼徽 (Red Star OPFOR Combat Markings)
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
        ctx.strokeStyle = isPlayer ? '#42A5F5' : '#FF5252';
        ctx.fillStyle = isPlayer ? 'rgba(13, 71, 161, 0.75)' : 'rgba(183, 28, 28, 0.75)';
        ctx.lineWidth = 1.6;

        ctx.strokeRect(plane.pos.x - frameW / 2, tagY, frameW, frameH);
        ctx.fillRect(plane.pos.x - frameW / 2, tagY, frameW, frameH);

        // Aviation Wing Symbol: Horizontal line with double arched wings
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(plane.pos.x - 11, tagY + frameH * 0.5);
        ctx.quadraticCurveTo(plane.pos.x - 5, tagY + frameH * 0.2, plane.pos.x, tagY + frameH * 0.5);
        ctx.quadraticCurveTo(plane.pos.x + 5, tagY + frameH * 0.2, plane.pos.x + 11, tagY + frameH * 0.5);
        ctx.stroke();

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
      ctx.beginPath();
      // Port wing
      ctx.moveTo(3, 0);
      ctx.lineTo(1, -6);
      ctx.lineTo(4, -17);
      ctx.lineTo(-2, -17);
      ctx.lineTo(-3, -6);
      ctx.lineTo(-1, 0);
      // Starboard wing
      ctx.moveTo(3, 0);
      ctx.lineTo(1, 6);
      ctx.lineTo(4, 17);
      ctx.lineTo(-2, 17);
      ctx.lineTo(-3, 6);
      ctx.lineTo(-1, 0);
      ctx.stroke();

      // Horizontal Stabilizer / Tailplane
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
      ctx.beginPath();
      ctx.moveTo(2, -13);
      ctx.lineTo(4, -13);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 13);
      ctx.lineTo(2, 13);
      ctx.lineTo(-3, 13);
      ctx.lineTo(-3, -13);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
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

      // Greenhouse canopy frames
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
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(5, -16);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.stroke();

      // 6 gun ports on wing leading edge
      ctx.fillStyle = '#FFD54F';
      for (let g = -3; g <= 3; g++) {
        if (g === 0) continue;
        const gy = g * 3.5;
        ctx.fillRect(4, gy - 0.5, 2, 1);
      }

      if (isPlayer) this.drawUSInsignia(1, -10, 3.5);
    } else if (m === 'sbd' || m === 'sb2c') {
      // ════ SBD Dauntless / SB2C Helldiver: Dive Bombers ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 13, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broad tapered dive-bombing wings
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(5, -16);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-4, 16);
      ctx.lineTo(-4, -16);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(4, -18);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 18);
      ctx.lineTo(2, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.stroke();

      // Dorsal Power Ball Turret Dome (Grumman spherical glass turret)
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
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
      ctx.beginPath();
      ctx.moveTo(3, -16);
      ctx.lineTo(3, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(5, -17);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-3, 17);
      ctx.lineTo(-3, -17);
      ctx.closePath();
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
      const scProp = this.time * 26;
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
      ctx.beginPath();
      ctx.moveTo(5, -26);
      ctx.lineTo(8, -26);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 26);
      ctx.lineTo(5, 26);
      ctx.lineTo(-4, 26);
      ctx.lineTo(-4, -26);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(6, -28);
      ctx.lineTo(8, -28);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 28);
      ctx.lineTo(6, 28);
      ctx.lineTo(-3, 28);
      ctx.lineTo(-3, -28);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(2, -16);
      ctx.lineTo(4, -16);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 16);
      ctx.lineTo(2, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -21);
      ctx.lineTo(5, -21);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 21);
      ctx.lineTo(3, 21);
      ctx.lineTo(-3, 21);
      ctx.lineTo(-3, -21);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(3, -19);
      ctx.lineTo(5, -19);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 19);
      ctx.lineTo(3, 19);
      ctx.lineTo(-3, 19);
      ctx.lineTo(-3, -19);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(4, -21);
      ctx.lineTo(6, -21);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 21);
      ctx.lineTo(4, 21);
      ctx.lineTo(-3, 21);
      ctx.lineTo(-3, -21);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(2, -14);
      ctx.lineTo(4, -14);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 14);
      ctx.lineTo(2, 14);
      ctx.lineTo(-3.5, 14);
      ctx.lineTo(-3.5, -14);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(2, -16);
      ctx.lineTo(4, -16);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 16);
      ctx.lineTo(2, 16);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-3, -16);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -17);
      ctx.lineTo(5, -17);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 17);
      ctx.lineTo(3, 17);
      ctx.lineTo(-3.5, 17);
      ctx.lineTo(-3.5, -17);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 16, 0, 0, Math.PI * 2);
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(2, -18);
      ctx.lineTo(4, -18);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 18);
      ctx.lineTo(2, 18);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(7, -26);
      ctx.lineTo(4, 0);
      ctx.lineTo(7, 26);
      ctx.lineTo(4, 26);
      ctx.lineTo(-5, 26);
      ctx.lineTo(-5, -26);
      ctx.closePath();
      ctx.stroke();

      // Twin Kasei engine nacelles with dual spinning props
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, -13, 8, 4.5);
      ctx.strokeRect(3, 8.5, 8, 4.5);

      // Spinning dual props
      const pAng = this.time * 24;
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
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, 0);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 15);
      ctx.lineTo(-3, 15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(2, -18);
      ctx.lineTo(-4, -18);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, 18);
      ctx.lineTo(2, 18);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(2, -8);
      ctx.lineTo(1, -21);
      ctx.lineTo(-5, -21);
      ctx.lineTo(-4, -8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 8);
      ctx.lineTo(1, 21);
      ctx.lineTo(-5, 21);
      ctx.lineTo(-4, 8);
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -23);
      ctx.lineTo(5, -23);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 23);
      ctx.lineTo(3, 23);
      ctx.lineTo(-4, 23);
      ctx.lineTo(-4, -23);
      ctx.closePath();
      ctx.stroke();

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
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(3, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(3, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-4, -22);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, -18);
      ctx.lineTo(-9, -17);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-9, 17);
      ctx.lineTo(-3, 18);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(4, -22);
      ctx.lineTo(6, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 22);
      ctx.lineTo(4, 22);
      ctx.lineTo(-4, 22);
      ctx.lineTo(-4, -22);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(6, -31);
      ctx.lineTo(9, -31);
      ctx.lineTo(7, 0);
      ctx.lineTo(9, 31);
      ctx.lineTo(6, 31);
      ctx.lineTo(-4, 31);
      ctx.lineTo(-4, -31);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(3, -18);
      ctx.lineTo(5, -18);
      ctx.lineTo(3, 0);
      ctx.lineTo(5, 18);
      ctx.lineTo(3, 18);
      ctx.lineTo(-3, 18);
      ctx.lineTo(-3, -18);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(3, -21);
      ctx.lineTo(6, -21);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 21);
      ctx.lineTo(3, 21);
      ctx.lineTo(-4, 21);
      ctx.lineTo(-4, -21);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -19);
      ctx.lineTo(-9, -19);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-9, 19);
      ctx.lineTo(-3, 19);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(3, -16.5);
      ctx.lineTo(5, -16.5);
      ctx.lineTo(4, 0);
      ctx.lineTo(5, 16.5);
      ctx.lineTo(3, 16.5);
      ctx.lineTo(-3.5, 16.5);
      ctx.lineTo(-3.5, -16.5);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(4, -20.5);
      ctx.lineTo(7, -20.5);
      ctx.lineTo(5, 0);
      ctx.lineTo(7, 20.5);
      ctx.lineTo(4, 20.5);
      ctx.lineTo(-4.5, 20.5);
      ctx.lineTo(-4.5, -20.5);
      ctx.closePath();
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
      ctx.stroke();

      // Anhedral tailplanes (sloping downward like inverted V)
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-15, -8);
      ctx.lineTo(-17, -7);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-17, 7);
      ctx.lineTo(-15, 8);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, -15);
      ctx.lineTo(-7, -15);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 15);
      ctx.lineTo(-2, 15);
      ctx.closePath();
      ctx.stroke();

      // Low all-flying tailplanes
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-13, 6);
      ctx.lineTo(-10, 6);
      ctx.stroke();

      // 4x 20mm Colt Mk 12 cannon ports
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(4, -2.4, 3, 1);
      ctx.fillRect(4, 1.4, 3, 1);

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
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-5, -13);
      ctx.lineTo(-8, -13);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 13);
      ctx.lineTo(-5, 13);
      ctx.closePath();
      ctx.stroke();

      // Dorsal avionics hump behind cockpit
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-2, -1.2, 5, 2.4);

      // Refueling probe on starboard nose
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
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -19);
      ctx.lineTo(-8, -19);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 19);
      ctx.lineTo(-3, 19);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-12, -28);
      ctx.lineTo(-18, -28);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-18, 28);
      ctx.lineTo(-12, 28);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-3, -15);
      ctx.lineTo(-8, -15);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 15);
      ctx.lineTo(-3, 15);
      ctx.closePath();
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
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -18);
      ctx.lineTo(-8, -18);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-3, 18);
      ctx.closePath();
      ctx.stroke();

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
      ctx.strokeRect(-2, -18, 5, 36);

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
    } else if (m === 'c1' || m === 's2') {
      // ════ C-1 Trader / S-2 Tracker: Twin-Engine Carrier Transport/ASW ════
      ctx.fillStyle = '#061322';
      ctx.beginPath();
      ctx.ellipse(1, 0, 14, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // High straight wing with twin radial engines
      ctx.strokeRect(-2, -22, 6, 44);

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
      ctx.beginPath();
      ctx.moveTo(5, -24);
      ctx.lineTo(8, -24);
      ctx.lineTo(6, 0);
      ctx.lineTo(8, 24);
      ctx.lineTo(5, 24);
      ctx.lineTo(-3, 24);
      ctx.lineTo(-3, -24);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-8, -13);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 13);
      ctx.lineTo(-6, 13);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-3, -16);
      ctx.lineTo(-8, -16);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-3, 16);
      ctx.closePath();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.moveTo(4, -25);
      ctx.lineTo(6, -25);
      ctx.lineTo(4, 0);
      ctx.lineTo(6, 25);
      ctx.lineTo(4, 25);
      ctx.lineTo(-4, 25);
      ctx.lineTo(-4, -25);
      ctx.closePath();
      ctx.stroke();

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
      'f9f', 'f2h', 'f3h', 'f86', 'mig15', 'mig17', 'mig19', 'mig21', 'su7', 'il28',
      'tu14', 'me262', 'ohka', 'kikka', 'meteor'
    ]);
    const heloModels = new Set(['uh2', 'ch46', 'uh1', 'ah1', 'ho3s1', 'hup', 'hrs']);
    const multiPropModels = new Set(['b17', 'b24', 'b25', 'b29', 'g4m', 'p38', 'c1', 's2', 'e1', 'ov10', 'a20', 'a26']);

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
          const cosH = Math.cos(proj.heading);
          const sinH = Math.sin(proj.heading);

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
        // ════ 空艦/海艦突防飛彈 (P-15 冥河 Styx / AGM-12 犢犬 Bullpup) ════
        const cosH = Math.cos(proj.heading);
        const sinH = Math.sin(proj.heading);

        // Low-altitude sea-spray wake ripples
        ctx.strokeStyle = 'rgba(224, 247, 250, 0.65)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 36 - sinH * 4, proj.pos.y - sinH * 36 + cosH * 4);
        ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.moveTo(proj.pos.x - cosH * 36 + sinH * 4, proj.pos.y - sinH * 36 - cosH * 4);
        ctx.lineTo(proj.pos.x - cosH * 10, proj.pos.y - sinH * 10);
        ctx.stroke();

        // Heavy cruise missile rocket engine exhaust
        ctx.strokeStyle = '#FF3D00';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(proj.pos.x - cosH * 22, proj.pos.y - sinH * 22);
        ctx.lineTo(proj.pos.x - cosH * 8, proj.pos.y - sinH * 8);
        ctx.stroke();

        ctx.save();
        ctx.translate(proj.pos.x, proj.pos.y);
        ctx.rotate(proj.heading);
        // Chunky Styx cruise missile fuselage with delta wings
        ctx.fillStyle = '#37474F';
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 1.4;
        ctx.fillRect(-12, -3.2, 16, 6.4);
        ctx.strokeRect(-12, -3.2, 16, 6.4);

        // Delta wing surfaces
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

        // Heavy warhead nose
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(4, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

      // 1. NATO APP-6 Tactical Frame (藍色長方形 友軍 vs 紅色菱形 敵軍)
      const isHostile = !isPlayer;
      const midY = -12;
      const boxW = 28;
      const boxH = 17;
      const frameColor = isPlayer ? '#42A5F5' : '#FF5252';
      const frameFill = isPlayer ? 'rgba(21, 101, 192, 0.65)' : 'rgba(183, 28, 28, 0.65)';

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
        ctx.moveTo(0, midY - 11);
        ctx.lineTo(13, midY);
        ctx.lineTo(0, midY + 11);
        ctx.lineTo(-13, midY);
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

      if (unit.type.includes('rifle') || unit.type.includes('ambush') || unit.type.includes('patrol') || unit.type.includes('infantry')) {
        // 步兵 (Infantry): 對角交叉線 "X"
        const xOffset = isHostile ? 7 : 10;
        const yOffset = isHostile ? 5.5 : 6;
        ctx.beginPath();
        ctx.moveTo(-xOffset, midY - yOffset);
        ctx.lineTo(xOffset, midY + yOffset);
        ctx.moveTo(xOffset, midY - yOffset);
        ctx.lineTo(-xOffset, midY + yOffset);
        ctx.stroke();
      } else if (unit.type.includes('armor') || unit.type.includes('tank') || unit.type.includes('t34') || unit.type.includes('patton')) {
        // 裝甲戰車 (Armor): 履帶橢圓 "⬭"
        ctx.beginPath();
        ctx.ellipse(0, midY, isHostile ? 7.5 : 9, isHostile ? 3.8 : 4.5, 0, 0, Math.PI * 2);
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
      } else if (unit.type.includes('artillery') || unit.type.includes('howitzer')) {
        // 野戰砲兵 (Field Artillery): 中央實心砲彈圓點 "●"
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, midY, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.type.includes('chaparral') || unit.type.includes('sam')) {
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
      } else if (unit.type.includes('flak') || unit.type.includes('aa')) {
        // 防空砲兵 (Air Defense / Flak): 圓頂穹頂穹門 "⌒"
        ctx.beginPath();
        ctx.arc(0, midY + 3, 5, Math.PI, 0);
        ctx.stroke();
      } else if (unit.type.includes('lvt') || unit.type.includes('mech')) {
        // 機械化步兵/兩棲 (Mechanized Infantry): 履帶橢圓內嵌步兵 "X"
        ctx.beginPath();
        ctx.ellipse(0, midY, 9.5, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5.5, midY - 2.8);
        ctx.lineTo(5.5, midY + 2.8);
        ctx.moveTo(5.5, midY - 2.8);
        ctx.lineTo(-5.5, midY + 2.8);
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
        // 預設/偵察 (Recon): 單斜線 "/"
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
      ctx.fillStyle = 'rgba(4, 12, 22, 0.85)';
      ctx.fillRect(-barW / 2 - 1, 8, barW + 2, 7.5);
      ctx.strokeStyle = '#1E3A5F';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-barW / 2 - 1, 8, barW + 2, 7.5);

      // Bar 1: 組織度 ORG (綠色 / 混亂時黃色 / 崩潰時紅色)
      ctx.fillStyle = orgPct > 0.45 ? '#00E676' : orgPct > 0.2 ? '#FFD54F' : '#FF1744';
      ctx.fillRect(-barW / 2, 9, barW * orgPct, 2.5);

      // Bar 2: 建制度 STR (鋼藍色 / 受損時橙色)
      ctx.fillStyle = strPct > 0.5 ? '#00E5FF' : '#FF9100';
      ctx.fillRect(-barW / 2, 12.2, barW * strPct, 2.5);

      // Bar 3: 火力壓制條 SUPPRESSION (受擊壓制時顯示紅/琥珀色進度條)
      if (unit.suppression && unit.suppression > 5) {
        const suppPct = Math.min(1, unit.suppression / 100);
        ctx.fillStyle = unit.suppression >= 50 ? '#FF1744' : '#FF9100';
        ctx.fillRect(-barW / 2, 15.4, barW * suppPct, 2.2);
      }

      // 6. Tactical Status Badges & Unit Name (保留純粹洗鍊 NATO 圖標，僅在選中或極端狀態下顯示戰術標籤)
      if (unit.isInUrbanCover) {
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00E5FF';
        ctx.fillText('🛡️ [URBAN 掩體 -70%航彈 -50%直射]', 0, isSelected ? -38 : -26);
      }

      // 火力壓制警示標籤 (Progressive Suppression Badges)
      if (unit.suppression && unit.suppression >= 20) {
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const spdPenalty = Math.round((0.30 + (unit.suppression / 100) * 0.50) * 100);
        if (unit.suppression >= 50 || unit.isPinned) {
          ctx.fillStyle = '#FF1744';
          ctx.fillText(`🛑【重度壓制 PINNED -${spdPenalty}% SPD】`, 0, isSelected ? -46 : -32);
        } else {
          ctx.fillStyle = '#FF9100';
          ctx.fillText(`⚠️【火力壓制 SUPPRESSED -${spdPenalty}% SPD】`, 0, isSelected ? -46 : -32);
        }
      }

      if (isSelected || unit.isBanzaiCharging || unit.isSurrendered || unit.disorganized) {
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';

        if (unit.isSurrendered) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText('🏳️【已降 SURRENDER】', 0, -25);
        } else if (unit.isBanzaiCharging) {
          ctx.fillStyle = '#FF1744';
          ctx.fillText('🔥【萬歲衝鋒 BANZAI】', 0, -25);
        } else if (unit.disorganized) {
          ctx.fillStyle = '#FFD54F';
          ctx.fillText('⚠️【混亂壓制 DISORGANIZED】', 0, -25);
        } else {
          ctx.fillStyle = isPlayer ? '#90CAF9' : '#FFAB91';
          ctx.fillText(unit.name, 0, -25);
        }

        // 僅在選中時顯示詳細補給與數值，平時維持最高戰術地圖專業可讀性
        if (isSelected) {
          ctx.font = 'bold 7px monospace';
          ctx.fillStyle = unit.isSupplied ? '#00E676' : '#FF5252';
          ctx.fillText(`ORG ${Math.round(orgPct * 100)}% · STR ${Math.round(strPct * 100)}% ${unit.isSupplied ? '[補給通]' : '[斷補]'}`, 0, 20);
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
    else if (item.typeTag === 'coastal_gun') rangeRadius = 1600;
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
    ctx.fillText(`⚓【戰地設施自由戳記】${item.nameZh}`, cardX + 8, cardY + 15);

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
}

