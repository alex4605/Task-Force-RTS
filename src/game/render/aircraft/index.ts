import { Aircraft } from '../../../types/game';
import { RenderContext, Camera, isWorldCircleVisible } from '../context';
import { drawUnitSelectionRing } from '../ships';
import { drawHinomaru, drawJapaneseIFFLeadingEdge, drawRAFRoundel, drawROKAFRoundel, drawUSInsignia } from './insignia';

// Draw Specific Aircraft Models with Authentic Vector Silhouettes
export function drawAircraft(rc: RenderContext, aircraftList: Aircraft[], camera: Camera, selectedUnitIds: string[]) {
  const ctx = rc.ctx;
  ctx.save();
  ctx.translate(rc.width / 2, rc.height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const plane of aircraftList) {
    if (plane.state === 'shot_down' && (plane.deathTimer || 0) <= 0) continue;

    const isSelected = selectedUnitIds.includes(plane.id);
    if (!isSelected && !isWorldCircleVisible(rc, plane.pos.x, plane.pos.y, 180, camera)) {
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
        plane.model === 'jaguar_gr1' ||
        plane.model === 'viggen_ja37';

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

    // 6d. 飛彈威脅對策規避戰術指示 (Threat-Matched Evasion HUD Badges: Notching & Breaking)
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

    // 7. AIM-7 Semi-Active Radar Homing (SARH) Nose Pencil Illumination Beam
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

  ctx.restore();
}

// Draw Specific WWII Vector Aircraft Model with Authentic Profiles
export function drawSpecificAircraftModel(rc: RenderContext, plane: Aircraft, color: string) {
  const ctx = rc.ctx;
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
    if (isPlayer) drawUSInsignia(rc, 1, -11, 3.5);

    // 4-Blade Propeller Blur with Yellow Tips
    const propA = rc.time * 28;
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

    if (isPlayer) drawUSInsignia(rc, 0, -8, 3);
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

    if (isPlayer) drawUSInsignia(rc, 0, -9, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 1, -10, 3.5);
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

    if (isPlayer) drawUSInsignia(rc, 1, -11, 3.5);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 3.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -10, 3);
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

    if (isPlayer) drawUSInsignia(rc, 0, -11, 3.4);
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

    if (isPlayer) drawUSInsignia(rc, 1, -16, 4.2);
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

    if (isPlayer) drawUSInsignia(rc, 1, -18, 4.5);
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

    if (isPlayer) drawUSInsignia(rc, 0, -10, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -15, 3.5);
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

    if (isPlayer) drawUSInsignia(rc, 0, -14, 3.4);
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

    if (isPlayer) drawUSInsignia(rc, 0, -15, 3.8);
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
    drawHinomaru(rc, 0, -8.5, 3.4);
    drawHinomaru(rc, 0, 8.5, 3.4);
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

    drawHinomaru(rc, 0, -8.5, 3.6);
    drawHinomaru(rc, 0, 8.5, 3.6);
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

    drawHinomaru(rc, 0, -9.5, 3.4);
    drawHinomaru(rc, 0, 9.5, 3.4);
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

    drawHinomaru(rc, 0, -10, 3.8);
    drawHinomaru(rc, 0, 10, 3.8);
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

    drawHinomaru(rc, 0, -10, 3.6);
    drawHinomaru(rc, 0, 10, 3.6);
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

    drawHinomaru(rc, 0, -11, 3.8);
    drawHinomaru(rc, 0, 11, 3.8);
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
    drawHinomaru(rc, 1, -19, 4.2);
    drawHinomaru(rc, 1, 19, 4.2);

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
    drawHinomaru(rc, 1, -5.5, 2);
    drawHinomaru(rc, 1, 5.5, 2);

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
    drawHinomaru(rc, 0, -9, 3.5);
    drawHinomaru(rc, 0, 9, 3.5);

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

    if (isPlayer) drawUSInsignia(rc, 0, -11, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -14, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -16, 3.6);
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

    if (isPlayer) drawUSInsignia(rc, 0, -13, 3.4);
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

    if (isPlayer) drawUSInsignia(rc, 0, -15, 3.5);
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
    const aewPulse = (Math.sin(rc.time * 8) + 1) * 0.5;
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

    if (isPlayer) drawUSInsignia(rc, 0, -15, 3.5);
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

    if (isPlayer) drawUSInsignia(rc, 0, -2, 2.5);
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

    if (isPlayer) drawUSInsignia(rc, 2, -20, 4.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -11, 3.4);
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

    if (isPlayer) drawUSInsignia(rc, 0, -14, 3.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -11, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -9, 3);
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

    if (isPlayer) drawUSInsignia(rc, 0, -8, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -18, 4);
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

    if (isPlayer) drawUSInsignia(rc, 0, -10, 3);
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

    if (isPlayer) drawUSInsignia(rc, 0, -11, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -18, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -18, 3.3);
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

    if (isPlayer) drawUSInsignia(rc, 0, -16, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, 0, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, 0, -18, 3.5);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 3.0);
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

    if (isPlayer) drawUSInsignia(rc, 0, -10, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, -1, -14, 3.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -12, 3.0);
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

    if (isPlayer) drawUSInsignia(rc, -1, -9, 2.6);
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

    if (isPlayer) drawUSInsignia(rc, -4, 0, 2.4);
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

    if (isPlayer) drawUSInsignia(rc, -4, 0, 2.2);
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

    if (isPlayer) drawUSInsignia(rc, 0, -14, 3.0);
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
    const rotAngle = rc.time * 2.5;
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

    if (isPlayer) drawUSInsignia(rc, -12, 0, 3.5);
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
    const e2Rot = rc.time * 2.8;
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

    if (isPlayer) drawUSInsignia(rc, -9, 0, 2.6);
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

    if (isPlayer) drawUSInsignia(rc, -2, -12, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, -1, 0, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, -2, -9, 2.4);
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

    if (isPlayer) drawUSInsignia(rc, -2, -14, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, -6, 0, 3.4);
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

    if (isPlayer) drawUSInsignia(rc, -8, 0, 2.6);
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

    if (isPlayer) drawUSInsignia(rc, -6, 0, 2.5);
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

    if (isPlayer) drawUSInsignia(rc, -4, 0, 3.2);
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
    const a50Rot = rc.time * 2.6;
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

    if (isPlayer) drawUSInsignia(rc, 0, -9, 3.2, true);
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

    if (isPlayer) drawUSInsignia(rc, 2, -15, 3.6, true);
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

    if (isPlayer) drawUSInsignia(rc, 0, -9, 3.2, true);
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

    if (isPlayer) drawUSInsignia(rc, 3, -19, 4, true);
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

    if (isPlayer) drawUSInsignia(rc, 0, -15, 3.2, true);
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

    if (isPlayer) drawUSInsignia(rc, 0, -13, 3.6);
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

    if (isPlayer) drawUSInsignia(rc, 0, -9, 3);
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

    if (isPlayer) drawUSInsignia(rc, -2, -8, 2.8);
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

    if (isPlayer) drawUSInsignia(rc, -3, -7, 2.5);
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

    drawRAFRoundel(rc, 0, -11, 3.4);
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

    drawRAFRoundel(rc, 1, -11, 3.3);
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

    drawRAFRoundel(rc, 1, -13, 3.5);
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

    drawRAFRoundel(rc, 0, -12, 3.2);
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

    drawRAFRoundel(rc, 1, -11, 3.4);
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

    drawRAFRoundel(rc, 1, -12, 3.4);
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

    drawRAFRoundel(rc, 1, -13, 3.5);
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

    drawRAFRoundel(rc, 2, -20, 4);
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

    drawRAFRoundel(rc, 0, -13, 3.4);
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

    drawRAFRoundel(rc, 1, -11, 3.4);
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

    drawROKAFRoundel(rc, 1, -10, 3.2);
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

    drawRAFRoundel(rc, 0, -11, 3.4);
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
    drawRAFRoundel(rc, -5, -8, 3);
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

    drawRAFRoundel(rc, -1, -10, 3.2);
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

    drawRAFRoundel(rc, -5, -10, 3.2);
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

    drawRAFRoundel(rc, -4, -11, 3.2);
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
    drawRAFRoundel(rc, -4, -9, 3);
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

    drawRAFRoundel(rc, -3, -9, 3);
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
  } else if (!isHelo && !isMultiProp) {
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
  }
}
