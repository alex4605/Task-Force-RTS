// WWII Imperial Japanese aircraft: vector silhouettes, drawn in the plane's local frame (nose along +x).
import { Aircraft } from '../../../../types/game';
import { RenderContext } from '../../context';
import { drawHinomaru } from '../insignia';
import { AircraftDrawerTable } from './types';

function drawZero(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawZeroA6m5(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawKi61(rc: RenderContext, _plane: Aircraft, color: string): void {
  const ctx = rc.ctx;

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
}

function drawGeorge(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawVal(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;
  const m = plane.model;

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
}

function drawKate(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawG4m(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawOhka(rc: RenderContext, _plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

function drawKamikazeJudy(rc: RenderContext, plane: Aircraft, _color: string): void {
  const ctx = rc.ctx;

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
}

export const WW2_JAPAN_DRAWERS: AircraftDrawerTable = {
  zero: drawZero,
  zero_a6m2: drawZero,
  zero_a6m5: drawZeroA6m5,
  kamikaze_zero: drawZeroA6m5,
  ki61: drawKi61,
  george: drawGeorge,
  val: drawVal,
  judy: drawVal,
  kate: drawKate,
  jill: drawKate,
  g4m: drawG4m,
  ohka: drawOhka,
  kamikaze_judy: drawKamikazeJudy,
};
