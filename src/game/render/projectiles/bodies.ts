// Per-type projectile artwork, drawn in world space (camera transform already applied).
import { Projectile, ProjectileType } from '../../../types/game';
import { RenderContext, Camera } from '../context';
import { drawBullet, drawClusterDispenser, drawConventionalBomb, drawDepthCharge, drawRocket, drawShell, drawSmokeTrail, trailOf } from './ordnance';

/** Draws the type-specific body of one projectile in its local frame. */
export type ProjectileDrawer = (rc: RenderContext, proj: Projectile, camera: Camera, projectiles: Projectile[]) => void;

function drawTorpedo(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
    ctx.arc(bx + (Math.sin(rc.time * 10 + b) - 0.5) * 4, by + (Math.cos(rc.time * 10 + b) - 0.5) * 4, 1.8, 0, Math.PI * 2);
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
    const pingPhase = ((rc.time * 2.5) % 1);
    ctx.strokeStyle = `rgba(0, 229, 255, ${0.75 * (1 - pingPhase)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(proj.pos.x + cosH * 2, proj.pos.y + sinH * 2, 6 + pingPhase * 28, 0, Math.PI * 2);
    ctx.stroke();

    // High frequency inner sonar wave
    const innerPhase = ((rc.time * 4) % 1);
    ctx.strokeStyle = `rgba(128, 222, 234, ${0.6 * (1 - innerPhase)})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(proj.pos.x + cosH * 2, proj.pos.y + sinH * 2, 4 + innerPhase * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBomb(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
    const pulse = 1 + Math.sin(rc.time * 6) * 0.16;
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
    const sway = Math.sin(rc.time * 4) * 0.16;
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
    const beaconBlink = Math.sin(rc.time * 14) > 0;
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
    if (Math.sin(rc.time * 20) > 0) {
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
  } else if (proj.bombType === 'cbu_cluster_bombs' || proj.warhead === 'cluster') {
    // CBU / Rockeye dispenser opening into a bomblet cloud
    ctx.rotate(-Math.PI / 2);
    drawClusterDispenser(ctx, proj, alt);
  } else {
    // General-purpose bombs by era and nation (AN-M64 / Mk 82 / Type 98 / FAB), sized by weight
    ctx.rotate(-Math.PI / 2);
    drawConventionalBomb(ctx, proj, rc.era);
  }

  ctx.restore();
}

function drawHedgehog(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
}

function drawMissileAam(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
  const pLen = 14 + Math.sin(rc.time * 35) * 4;
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
}

function drawMissileSam(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
      const flameLen = 22 + Math.sin(rc.time * 45) * 6;
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
    const flameLen = 18 + Math.sin(rc.time * 40) * 5;
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
}

function drawMissileAshm(rc: RenderContext, proj: Projectile, _camera: Camera, projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
    const pulse = 0.65 + Math.sin(rc.time * 10) * 0.35;
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
    const flameLen = 14 + Math.sin(rc.time * 36) * 3;
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
    const flameLen = (isHeavySoviet ? 22 : 18) + Math.sin(rc.time * 42) * 4;
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
}

function drawMissileArm(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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

function drawMissileCruise(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
}

function drawSlbmTrident(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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
}

function drawMissileSsm(rc: RenderContext, proj: Projectile, _camera: Camera, _projectiles: Projectile[]): void {
  const ctx = rc.ctx;

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

/** Curved exhaust smoke along the missile's recent flight path, under the body artwork. */
function withSmoke(draw: ProjectileDrawer, width: number, alpha: number): ProjectileDrawer {
  return (rc, proj, camera, projectiles) => {
    if (!(proj.isASROC && (proj.asrocStage === 'parachute' || proj.asrocStage === 'water_homing'))) {
      drawSmokeTrail(rc.ctx, trailOf(proj, 22, 9), proj.pos, width, alpha);
    }
    draw(rc, proj, camera, projectiles);
  };
}

export const PROJECTILE_DRAWERS: Partial<Record<ProjectileType, ProjectileDrawer>> = {
  shell: (rc, p) => drawShell(rc, p),
  rocket: (rc, p) => drawRocket(rc, p),
  bullet: (rc, p) => drawBullet(rc, p),
  torpedo: drawTorpedo,
  bomb: drawBomb,
  depth_charge: (rc, p) => drawDepthCharge(rc, p),
  hedgehog: drawHedgehog,
  missile_aam: withSmoke(drawMissileAam, 1.4, 0.4),
  missile_sam: withSmoke(drawMissileSam, 2.2, 0.5),
  missile_ashm: withSmoke(drawMissileAshm, 1.2, 0.22),
  missile_arm: withSmoke(drawMissileArm, 1.4, 0.4),
  missile_cruise: withSmoke(drawMissileCruise, 0.8, 0.1),
  slbm_trident: withSmoke(drawSlbmTrident, 3, 0.55),
  slbm_r39: withSmoke(drawSlbmTrident, 3, 0.55),
  missile_ssm: withSmoke(drawMissileSsm, 3, 0.55),
  // Was missing: nuclear-tipped tactical ballistic missiles were invisible in flight
};
