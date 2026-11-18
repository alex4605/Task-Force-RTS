import { Island } from '../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from './context';
import { drawInstallation } from './installations';

// Draw Islands
export function drawIslands(rc: RenderContext, islands: Island[], camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const wavePulse = (Math.sin(rc.time * 2) + 1) * 0.5;

  for (const island of islands) {
    if (!isWorldCircleVisible(rc, island.center.x, island.center.y, island.radius + 260, camera)) {
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
      drawInstallation(rc, inst, island);
    }
  }

  ctx.restore();
}

// Draw Strongholds with Capture Zones and Command Posts
export function drawStrongholds(rc: RenderContext, islands: Island[], camera: Camera) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const pulse = (Math.sin(rc.time * 3) + 1) * 0.5;

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
