import { LifeRaft, NuclearDetonation, Sonobuoy } from '../../types/game';
import { RenderContext, Camera } from './context';

// ══════════════════════════════════════════════════════════
// 時代三搜救救生筏繪製 (Era 3 Downed Pilot Life Raft on Ocean)
// ══════════════════════════════════════════════════════════
export function drawLifeRafts(rc: RenderContext, lifeRafts: LifeRaft[], camera: Camera) {
  if (!lifeRafts || lifeRafts.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const raft of lifeRafts) {
    if (raft.rescued) continue;

    ctx.save();
    ctx.translate(raft.pos.x, raft.pos.y);

    const isFriendly = raft.side !== 'enemy';
    const isOnLand = !!raft.isOnLand;
    const bob = isOnLand ? 0 : Math.sin(rc.time * 3 + raft.pos.x * 0.1) * 2;
    const pulse = (Math.sin(rc.time * 6) + 1) * 0.5;

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
    if (Math.sin(rc.time * 12) > 0) {
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
export function drawNuclearEffects(rc: RenderContext, flash: number, detonations: NuclearDetonation[], camera: Camera) {
  const ctx = rc.ctx;

  // 1. 全螢幕熱核白光盲閃 (Screen-Space Thermal Blind Flash)
  if (flash > 0) {
    const alpha = Math.min(1.0, flash);
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.fillRect(0, 0, rc.width, rc.height);
    ctx.restore();
  }

  if (!detonations || detonations.length === 0) return;

  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
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

// Render Active Air-Dropped Passive Sonobuoys & Acoustic Ping Sweeps
export function drawSonobuoys(rc: RenderContext, sonobuoys: Sonobuoy[], camera: Camera) {
  if (!sonobuoys || sonobuoys.length === 0) return;
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
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
