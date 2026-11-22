import { drawAircraftLights } from '../unitDetails';
import { Aircraft, AircraftModel } from '../../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from '../context';
import { drawUnitSelectionRing } from '../ships';
import { drawJapaneseIFFLeadingEdge } from './insignia';
import { AIRCRAFT_MODEL_DRAWERS } from './models';
import { TAIL_SPECS, drawTailFins, drawTailplane } from './tails';

// Airframes that cast a swept / delta wing shadow instead of a straight wing.
const SWEPT_WING_SHADOW: ReadonlySet<AircraftModel> = new Set<AircraftModel>([
  'f14a', 'fa18a', 'f15a', 'f16a', 'f111', 'f4b', 'f4j', 'f4e', 'f4f_phantom', 'b52', 'tu22m3', 'tu95', 'mig29a', 'su27', 'mirage3', 'mirage2000',
]);

// Draw Specific Aircraft Models with Authentic Vector Silhouettes
export function drawAircraft(rc: RenderContext, aircraftList: Aircraft[], camera: Camera, selectedUnitIds: string[]) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const plane of aircraftList) {
    if (plane.state === 'shot_down' && (plane.deathTimer || 0) <= 0) continue;
    // Fog of war: enemy aircraft appear only while the player's air picture holds them
    if (plane.side === 'enemy' && plane.state !== 'shot_down' && (plane.trackedByPlayer ?? 1) <= 0) continue;

    const isSelected = selectedUnitIds.includes(plane.id);
    if (!isSelected && !isWorldCircleVisible(rc, plane.pos.x, plane.pos.y, 180, camera)) {
      continue;
    }

    const isPlayer = plane.side === 'player';
    const cosH = Math.cos(plane.heading);
    const sinH = Math.sin(plane.heading);

    drawAltitudeShadow(rc, plane);

    drawWingtipContrails(rc, plane, cosH, sinH);

    drawDamageSmoke(rc, plane, cosH, sinH);

    // ══════════════════════════════════════════════════════════
    // 4. 戰機本體向量繪製與多元墜毀模式 (Aircraft Vector & Crash Modes)
    // ══════════════════════════════════════════════════════════
    const isAllied = plane.side === 'allied';
    const color = isPlayer ? '#80D8FF' : isAllied ? '#00E676' : '#FF8A80';

    drawPlaneBody(rc, plane, isPlayer, color);

    drawAircraftLights(rc, plane, cosH, sinH);

    drawThreatBanner(rc, plane, isPlayer);

    drawSelectionOverlay(rc, plane, isSelected, isPlayer, cosH, sinH);

    drawEvasionBadge(rc, plane);

    drawSarhBeam(rc, aircraftList, plane);
  }

  ctx.restore();
}

// ══════════════════════════════════════════════════════════
// 1. 動態高度陰影 (Scale-accurate Altitude Ocean Drop Shadow)
// ══════════════════════════════════════════════════════════
function drawAltitudeShadow(rc: RenderContext, plane: Aircraft): void {
  const ctx = rc.ctx;

  if (plane.altitude > 0.08) {
    const altOffset = plane.altitude * 32;
    const shadowScale = 0.85 + plane.altitude * 0.25;
    const shadowAlpha = 0.34 * Math.min(1, plane.altitude * 1.6);
    const isHeloShadow = AIRCRAFT_PROPULSION[plane.model] === 'helicopter';
    const isSweptWing = SWEPT_WING_SHADOW.has(plane.model);
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
}

// ══════════════════════════════════════════════════════════
// 2. 高空翼尖水氣凝結尾跡 (Aerodynamic Wingtip Contrails)
// ══════════════════════════════════════════════════════════
function drawWingtipContrails(rc: RenderContext, plane: Aircraft, cosH: number, sinH: number): void {
  const ctx = rc.ctx;

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
}

// ══════════════════════════════════════════════════════════
// 3. 戰損發動機燃燒黑煙與烈焰 (Battle Damage Engine Smoke & Fire)
// ══════════════════════════════════════════════════════════
function drawDamageSmoke(rc: RenderContext, plane: Aircraft, cosH: number, sinH: number): void {
  const ctx = rc.ctx;

  if (plane.health < plane.maxHealth * 0.55 || plane.state === 'shot_down') {
    const isCritical = plane.health < plane.maxHealth * 0.25 || plane.state === 'shot_down';
    const puffCount = isCritical ? 4 : 2;

    for (let s = 0; s < puffCount; s++) {
      const puffProg = (rc.time * 3 + s * 0.28) % 1;
      const puffR = 4 + puffProg * 16;
      const puffAlpha = (1 - puffProg) * 0.65;
      const driftX = plane.pos.x - cosH * (puffProg * 38) + (Math.sin(rc.time * 6 + s) - 0.5) * 4;
      const driftY = plane.pos.y - sinH * (puffProg * 38) + (Math.cos(rc.time * 6 + s) - 0.5) * 4;

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
}

/** Airframe (or tumbling wreck when shot down) in the plane's local frame. */
function drawPlaneBody(rc: RenderContext, plane: Aircraft, isPlayer: boolean, color: string): void {
  const ctx = rc.ctx;

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
      drawSpecificAircraftModel(rc, plane, '#FF8A80');
    } else if (mode === 'breakup') {
      // 空中斷翼解體 (Structural Wing Disintegration): 單側主翼折斷，殘翼噴射火花
      ctx.save();
      ctx.beginPath();
      // 裁切斷右翼 (右翼打斷)
      ctx.rect(-30, -35, 60, 38);
      ctx.clip();
      drawSpecificAircraftModel(rc, plane, '#FF5252');
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
      drawSpecificAircraftModel(rc, plane, '#FF3D00');
      const firePulse = (Math.sin(rc.time * 24) + 1) * 0.5;
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
      drawSpecificAircraftModel(rc, plane, color);
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

    drawSpecificAircraftModel(rc, plane, color);

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
      plane.model === 'jaguar_gr1';

    if (isJet && plane.state !== 'landing') {
      const flamePulse = (Math.sin(rc.time * 30 + (plane.id.charCodeAt(0) || 0)) + 1) * 0.5;
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
      const abLen = 32 + (Math.sin(rc.time * 40) + 1) * 8;
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
      const rotorAngle = rc.time * 42;
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
        drawJapaneseIFFLeadingEdge(rc, span, 3.5, 3.5);

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
}

// Tactical Overhead Warning Banners for Special Kamikaze & Rocket Threats
function drawThreatBanner(rc: RenderContext, plane: Aircraft, isPlayer: boolean): void {
  const ctx = rc.ctx;

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
}

// ══════════════════════════════════════════════════════════
// 6. RTS 戰術線條、時間刻度與 NATO 軍事圖例 (Tactical Vectors & NATO APP-6)
// ══════════════════════════════════════════════════════════
function drawSelectionOverlay(rc: RenderContext, plane: Aircraft, isSelected: boolean, isPlayer: boolean, cosH: number, sinH: number): void {
  const ctx = rc.ctx;

  if (isSelected && plane.state !== 'shot_down') {
    drawUnitSelectionRing(rc, plane.pos, 20);

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

      const sweepAngle = (rc.time * 1.5) % (Math.PI * 2);
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
}

// 6d. 飛彈威脅對策規避戰術指示 (Threat-Matched Evasion HUD Badges: Notching & Breaking)
function drawEvasionBadge(rc: RenderContext, plane: Aircraft): void {
  const ctx = rc.ctx;

  if (plane.isEvading && plane.evasionTactic && plane.state !== 'shot_down') {
    ctx.save();
    const pulse = (Math.sin(rc.time * 20) + 1) * 0.5;
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
}

// 7. AIM-7 Semi-Active Radar Homing (SARH) Nose Pencil Illumination Beam
function drawSarhBeam(rc: RenderContext, aircraftList: Aircraft[], plane: Aircraft): void {
  const ctx = rc.ctx;

  if (plane.sarhIlluminatingTargetId && (plane.sarhHoldTimer || 0) > 0) {
    const targetPlane = aircraftList.find((a: Aircraft) => a.id === plane.sarhIlluminatingTargetId && a.state !== 'shot_down');
    if (targetPlane) {
      const tPos = targetPlane.pos;
      const beamPulse = (Math.sin(rc.time * 25) + 1) * 0.5;

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

/**
 * How each airframe is propelled; selects the generic propulsion effect drawn over the silhouette.
 * Exhaustive by type, so adding an AircraftModel without classifying it is a compile error.
 * - single_prop: spinning nose propeller disc
 * - jet: single tail exhaust plume
 * - multi_prop / podded_jet / helicopter: engines are part of the silhouette, no generic effect
 */
type Propulsion = 'single_prop' | 'multi_prop' | 'jet' | 'podded_jet' | 'helicopter';

const AIRCRAFT_PROPULSION: Record<AircraftModel, Propulsion> = {
  // single_prop
  f4f: 'single_prop', sbd: 'single_prop', tbd: 'single_prop', os2u: 'single_prop', p40: 'single_prop',
  f6f: 'single_prop', f4u: 'single_prop', f8f: 'single_prop', sb2c: 'single_prop', tbf: 'single_prop',
  sc1: 'single_prop', p51: 'single_prop', p47: 'single_prop', ad1: 'single_prop', f4u4: 'single_prop',
  af_guardian: 'single_prop', ad3w: 'single_prop', zero: 'single_prop', zero_a6m2: 'single_prop',
  zero_a6m5: 'single_prop', ki61: 'single_prop', george: 'single_prop', val: 'single_prop',
  judy: 'single_prop', kate: 'single_prop', jill: 'single_prop', kamikaze_zero: 'single_prop',
  kamikaze_judy: 'single_prop', yak9: 'single_prop', la11: 'single_prop', il10: 'single_prop', p36a: 'single_prop',
  p39d: 'single_prop', hurricane: 'single_prop', spitfire_v: 'single_prop', swordfish: 'single_prop',
  spitfire_xiv: 'single_prop', tempest: 'single_prop', sea_fury: 'single_prop', rokaf_p51: 'single_prop',
  firefly_as5: 'single_prop', a1h: 'single_prop', rufe: 'single_prop', e13a: 'single_prop', walrus: 'single_prop', lynx: 'helicopter', ki84: 'single_prop', po2: 'single_prop', boomerang: 'single_prop',
  seafire: 'single_prop', barracuda: 'single_prop',
  // multi_prop
  b17: 'multi_prop', a20: 'multi_prop', b24: 'multi_prop', p38: 'multi_prop', a26: 'multi_prop',
  b29: 'multi_prop', e1: 'multi_prop', s2: 'multi_prop', c1: 'multi_prop', c47: 'multi_prop',
  p3: 'multi_prop', ov10: 'multi_prop', g4m: 'multi_prop', e2c: 'multi_prop', c2a: 'multi_prop',
  c130: 'multi_prop', b25: 'multi_prop', beaufighter: 'multi_prop', b17_late: 'multi_prop',
  mosquito: 'multi_prop', lancaster: 'multi_prop', f82: 'multi_prop', tu95: 'multi_prop', be12: 'multi_prop',
  il38: 'multi_prop', pby: 'multi_prop', ac47: 'multi_prop', beaufort: 'multi_prop',
  // tandem-rotor CH-46 draws both rotors itself
  ch46: 'multi_prop',
  // jet
  f86: 'jet', f9f: 'jet', f2h: 'jet', f8: 'jet', f4b: 'jet', f4f_phantom: 'jet', f4j: 'jet', a4: 'jet', a6a: 'jet',
  a6b_weasel: 'jet', f4e: 'jet', f105: 'jet', a7: 'jet', ohka: 'jet', mig15: 'jet', mig17: 'jet',
  mig19: 'jet', mig21: 'jet', su7: 'jet', tu16: 'jet', f14a: 'jet', fa18a: 'jet', a6e: 'jet', ea6b: 'jet',
  av8b: 'jet', a10a: 'jet', f15a: 'jet', f16a: 'jet', f111: 'jet', meteor: 'jet', a37b: 'jet', f5a: 'jet',
  f104g: 'jet', mirage3: 'jet', hunter_fga9: 'jet', tornado_gr1: 'jet', tornado_ids: 'jet',
  tornado_adv: 'jet', mirage2000: 'jet', jaguar_gr1: 'jet', tu22m3: 'jet', yak38: 'jet',
  mig29a: 'jet', su27: 'jet', su25: 'jet', f84: 'jet', mig23: 'jet', f100: 'jet', mig31: 'jet', buccaneer: 'jet', sea_harrier: 'jet',
  // podded_jet
  b52: 'podded_jet', tu14: 'podded_jet', il28: 'podded_jet', s3a: 'podded_jet', e3a: 'podded_jet',
  a50: 'podded_jet', canberra: 'podded_jet',
  // helicopter
  ho3s1: 'helicopter', uh2: 'helicopter', sh2: 'helicopter', uh1: 'helicopter', ah1: 'helicopter',
  sh3f: 'helicopter', ch53: 'helicopter', ah64a: 'helicopter', ah1w: 'helicopter', ka27: 'helicopter',
  mi24: 'helicopter', sh60b: 'helicopter',
};

interface RotorSpec {
  /** Main rotor radius in airframe units. */
  radius: number;
  blades: number;
  /** Hub position along the fuselage (+x = nose). */
  hubX: number;
  /** Ka-27 style coaxial counter-rotating rotors. */
  coaxial?: boolean;
}

// Main rotor geometry per helicopter (blade counts match the real aircraft).
const ROTOR_SPECS: Partial<Record<AircraftModel, RotorSpec>> = {
  ho3s1: { radius: 14, blades: 3, hubX: 2 },
  uh2: { radius: 13, blades: 4, hubX: 1 },
  uh1: { radius: 14, blades: 2, hubX: 1 },
  ah1: { radius: 14, blades: 2, hubX: 0 },
  ah1w: { radius: 14, blades: 4, hubX: 0 },
  sh2: { radius: 14, blades: 4, hubX: 1 },
  sh3f: { radius: 18, blades: 5, hubX: 2 },
  ch53: { radius: 22, blades: 6, hubX: 2 },
  ah64a: { radius: 15, blades: 4, hubX: 1 },
  ka27: { radius: 14, blades: 3, hubX: 0, coaxial: true },
  mi24: { radius: 18, blades: 5, hubX: 1 },
  sh60b: { radius: 15, blades: 4, hubX: 1 },
  lynx: { radius: 12, blades: 4, hubX: 0 },
};
const DEFAULT_ROTOR: RotorSpec = { radius: 14, blades: 3, hubX: 1 };

/** Translucent rotor disc with spinning blades, drawn over the fuselage. */
function drawRotor(rc: RenderContext, spec: RotorSpec): void {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(spec.hubX, 0);

  ctx.fillStyle = 'rgba(178, 235, 242, 0.07)';
  ctx.strokeStyle = 'rgba(178, 235, 242, 0.22)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, spec.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const rotors = spec.coaxial ? [1, -1] : [1];
  ctx.lineCap = 'round';
  for (const dir of rotors) {
    const base = rc.time * 17 * dir + (dir < 0 ? Math.PI / spec.blades : 0);
    ctx.strokeStyle = dir > 0 ? 'rgba(236, 239, 241, 0.6)' : 'rgba(236, 239, 241, 0.4)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let b = 0; b < spec.blades; b++) {
      const a = base + (b * Math.PI * 2) / spec.blades;
      ctx.moveTo(Math.cos(a) * 1.5, Math.sin(a) * 1.5);
      ctx.lineTo(Math.cos(a) * spec.radius, Math.sin(a) * spec.radius);
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';

  // Rotor hub
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = 'rgba(236, 239, 241, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Draw Specific WWII Vector Aircraft Model with Authentic Profiles
export function drawSpecificAircraftModel(rc: RenderContext, plane: Aircraft, color: string) {
  const ctx = rc.ctx;
  const m = plane.model;

  const drawAirframe = AIRCRAFT_MODEL_DRAWERS[m];
  const tail = TAIL_SPECS[m];
  if (tail) drawTailplane(rc, tail, color);
  if (drawAirframe) {
    drawAirframe(rc, plane, color);
  } else {
    // Default Generic Plane
    ctx.fillStyle = '#061322';
    ctx.beginPath();
    ctx.ellipse(2, 0, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (tail) drawTailFins(rc, tail, color);


  drawMountedOrdnance(rc, plane);

  const propulsion = AIRCRAFT_PROPULSION[m];

  // Wingtip aerodynamic condensation trails during turns/dives (fixed-wing only)
  if (plane.altitude > 0.3 && propulsion !== 'helicopter') {
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

  if (propulsion === 'jet') {
    // ════ Jet Exhaust Heat Shimmer & Supersonic Plume (噴射機無螺旋槳，繪製尾噴熾熱焰錐) ════
    const jetFlameLen = (plane.speed > (plane.maxSpeed * 0.75) ? 9 : 5) + Math.sin(rc.time * 30) * 2;
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
  } else if (propulsion === 'single_prop') {
    // Spinning propeller blur with yellow tip blades (僅限單發螺旋槳機)
    const propAngle = rc.time * 26;
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
  } else if (propulsion === 'helicopter') {
    drawRotor(rc, ROTOR_SPECS[m] ?? DEFAULT_ROTOR);
  }
}

// ══════════════════════════════════════════════════════════
// VISIBLE MOUNTED ORDNANCE UNDER AIRFRAME
// ══════════════════════════════════════════════════════════
function drawMountedOrdnance(rc: RenderContext, plane: Aircraft): void {
  const ctx = rc.ctx;

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
}
