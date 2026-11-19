import {
  Island,
  IslandStronghold,
  Installation,
  Ship,
  Vector2D,
  Turret,
  Era,
  SectorIntel,
  GroundUnit,
  GroundUnitType,
  ForestBelt,
  MountainRidge,
  LagoonWater,
} from '../types/game';
import { getNavalGunPerformance, getNavalLauncherRange } from './navalGuns';
import { getGroundUnitRange } from './rangeScale';
import { getShipAshmFit } from './navalMissileSalvos';
import {
  ARTILLERY_UNIT_TYPES,
  BATTERY_ECHELON_TYPES,
  COMPANY_ECHELON_TYPES,
  GROUND_UNIT_STATS,
  MLRS_UNIT_TYPES,
  NUCLEAR_TEL_UNIT_TYPES,
  SPG_UNIT_TYPES,
} from './groundUnitStats';

/** Fields every installation literal must give; unarmed sites may omit their zeroed fire-control values. */
type InstallationSpec = Omit<Installation, 'maxHealth' | 'isDestroyed' | 'angle' | 'range' | 'cooldown' | 'reloadTime'> &
  Partial<Pick<Installation, 'angle' | 'range' | 'cooldown' | 'reloadTime'>>;

/** Builds an intact installation at full health; omitted facing, range and reload default to 0. */
export function makeInstallation(spec: InstallationSpec): Installation {
  return { angle: 0, range: 0, cooldown: 0, reloadTime: 0, ...spec, maxHealth: spec.health, isDestroyed: false };
}

export function dist(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Distance from point to ship's full elongated hull line segment
export function distToShipHull(p: Vector2D, ship: Ship): number {
  const halfL = ship.length * 0.46;
  const cos = Math.cos(ship.heading);
  const sin = Math.sin(ship.heading);
  const ax = ship.pos.x - cos * halfL;
  const ay = ship.pos.y - sin * halfL;
  const bx = ship.pos.x + cos * halfL;
  const by = ship.pos.y + sin * halfL;

  const abx = bx - ax;
  const aby = by - ay;
  const apx = p.x - ax;
  const apy = p.y - ay;

  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    const dx = p.x - ax;
    const dy = p.y - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  let t = (apx * abx + apy * aby) / abLenSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;

  const projX = ax + t * abx;
  const projY = ay + t * aby;
  const pdx = p.x - projX;
  const pdy = p.y - projY;
  return Math.sqrt(pdx * pdx + pdy * pdy);
}

// ═══════════════════════════════════════════════════════════════════════
// ERA 1 & ERA 2 STRATEGIC CORAL ATOLL GENERATOR (狹長型珊瑚環礁與中央內海潟湖)
// ═══════════════════════════════════════════════════════════════════════
export function generateCoralAtoll(
  id: string,
  name: string,
  center: Vector2D,
  baseRadius: number,
  seed: number,
  era: Era = 'era1'
): Island {
  const points: Vector2D[] = [];
  const contours: Vector2D[][] = [];
  const installations: Installation[] = [];
  const strongholds: IslandStronghold[] = [];

  // Major axis orientation of the elongated atoll
  const atollAngle = ((seed * 1.618) % 1) * Math.PI * 2;
  const numOuterPoints = 48;
  const rMajor = baseRadius * 1.25;
  const rMinor = baseRadius * 0.78;

  // 1. Outer Barrier Reef Ring (Elongated organic ellipse with fractal coral crests)
  for (let i = 0; i < numOuterPoints; i++) {
    const angle = (i * Math.PI * 2) / numOuterPoints;
    const n1 = Math.sin(angle * 3 + seed * 1.7) * 0.16;
    const n2 = Math.cos(angle * 6 - seed * 2.3) * 0.09;
    const n3 = Math.sin(angle * 11 + seed * 0.9) * 0.04;
    const localR = 1 + n1 + n2 + n3;
    const lx = Math.cos(angle) * rMajor * localR;
    const ly = Math.sin(angle) * rMinor * localR;

    const wx = center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle);
    const wy = center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle);
    points.push({ x: wx, y: wy });
  }

  // 2. Interior Topographical Contours (Reef crest, white sand shelf, and interior bluffs)
  const contourScales = [0.88, 0.62, 0.38];
  for (const scale of contourScales) {
    const ring: Vector2D[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      ring.push({
        x: center.x + (p.x - center.x) * scale * (0.94 + Math.sin(i * 1.2 + scale * 4) * 0.06),
        y: center.y + (p.y - center.y) * scale * (0.94 + Math.cos(i * 1.2 + scale * 4) * 0.06),
      });
    }
    contours.push(ring);
  }

  // 3. Central Inland Lagoon (中央內海深水潟湖水域)
  const lagoonCenter: Vector2D = {
    x: center.x + Math.cos(atollAngle + 0.4) * (baseRadius * 0.06),
    y: center.y + Math.sin(atollAngle + 0.4) * (baseRadius * 0.06),
  };
  const lagoonPoints: Vector2D[] = [];
  const numLagoonPoints = 36;
  const lagMajor = baseRadius * 0.62;
  const lagMinor = baseRadius * 0.42;

  for (let i = 0; i < numLagoonPoints; i++) {
    const angle = (i * Math.PI * 2) / numLagoonPoints;
    const ln1 = Math.sin(angle * 4 + seed * 2.1) * 0.12;
    const ln2 = Math.cos(angle * 7 - seed * 1.5) * 0.06;
    const lR = 1 + ln1 + ln2;
    const lx = Math.cos(angle) * lagMajor * lR;
    const ly = Math.sin(angle) * lagMinor * lR;

    const wx = lagoonCenter.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle);
    const wy = lagoonCenter.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle);
    lagoonPoints.push({ x: wx, y: wy });
  }

  const lagoon: LagoonWater = {
    center: lagoonCenter,
    radius: lagMajor,
    points: lagoonPoints,
    depth: 26,
    channelBreaches: [
      { angle: atollAngle + Math.PI * 0.45, width: 170 },
      { angle: atollAngle - Math.PI * 0.55, width: 150 },
    ],
  };

  // 4. Continuous Forest Belts (連續長條狀椰林雨林帶沿環礁延伸，而非圓形斑點)
  const forestBelts: ForestBelt[] = [];
  
  // Belt 1: 北/西外環椰林紅樹林廊道 (North/West Barrier Palm Corridor)
  const belt1Pts: Vector2D[] = [];
  const b1Start = atollAngle + 0.2;
  const b1End = atollAngle + Math.PI - 0.2;
  const b1Steps = 16;
  for (let s = 0; s <= b1Steps; s++) {
    const a = b1Start + ((b1End - b1Start) * s) / b1Steps;
    const rOuter = baseRadius * 0.98 + Math.sin(s * 1.4 + seed) * 35;
    const lx = Math.cos(a) * rOuter * 1.15;
    const ly = Math.sin(a) * rOuter * 0.82;
    belt1Pts.push({
      x: center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle),
      y: center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle),
    });
  }
  for (let s = b1Steps; s >= 0; s--) {
    const a = b1Start + ((b1End - b1Start) * s) / b1Steps;
    const rInner = baseRadius * 0.68 + Math.cos(s * 1.2 - seed) * 30;
    const lx = Math.cos(a) * rInner * 1.05;
    const ly = Math.sin(a) * rInner * 0.75;
    belt1Pts.push({
      x: center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle),
      y: center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle),
    });
  }
  forestBelts.push({
    id: `${id}-forest-belt-1`,
    points: belt1Pts,
    density: 0.92,
    biome: 'palms',
  });

  // Belt 2: 南/東外環雨林海防林帶 (South/East Windward Jungle Belt)
  const belt2Pts: Vector2D[] = [];
  const b2Start = atollAngle + Math.PI + 0.2;
  const b2End = atollAngle + Math.PI * 2 - 0.2;
  const b2Steps = 16;
  for (let s = 0; s <= b2Steps; s++) {
    const a = b2Start + ((b2End - b2Start) * s) / b2Steps;
    const rOuter = baseRadius * 0.96 + Math.cos(s * 1.3 + seed) * 35;
    const lx = Math.cos(a) * rOuter * 1.12;
    const ly = Math.sin(a) * rOuter * 0.80;
    belt2Pts.push({
      x: center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle),
      y: center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle),
    });
  }
  for (let s = b2Steps; s >= 0; s--) {
    const a = b2Start + ((b2End - b2Start) * s) / b2Steps;
    const rInner = baseRadius * 0.66 + Math.sin(s * 1.1 - seed) * 28;
    const lx = Math.cos(a) * rInner * 1.04;
    const ly = Math.sin(a) * rInner * 0.72;
    belt2Pts.push({
      x: center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle),
      y: center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle),
    });
  }
  forestBelts.push({
    id: `${id}-forest-belt-2`,
    points: belt2Pts,
    density: 0.88,
    biome: 'rainforest',
  });

  // 5. Continuous Mountain Ridge along Windward Rim (迎風側珊瑚石灰岩陡峭山脊與觀測高地)
  const ridgeSpine: Vector2D[] = [];
  const rRidgeAngleStart = atollAngle + Math.PI * 0.75;
  const rRidgeAngleEnd = atollAngle + Math.PI * 1.45;
  const ridgeSteps = 7;
  for (let s = 0; s <= ridgeSteps; s++) {
    const a = rRidgeAngleStart + ((rRidgeAngleEnd - rRidgeAngleStart) * s) / ridgeSteps;
    const rR = baseRadius * 0.82;
    const lx = Math.cos(a) * rR * 1.1;
    const ly = Math.sin(a) * rR * 0.8;
    ridgeSpine.push({
      x: center.x + lx * Math.cos(atollAngle) - ly * Math.sin(atollAngle),
      y: center.y + lx * Math.sin(atollAngle) + ly * Math.cos(atollAngle),
    });
  }

  const mountainRidges: MountainRidge[] = [
    {
      id: `${id}-ridge-windward`,
      spine: ridgeSpine,
      width: 170,
      height: 185,
      peaks: [
        {
          pos: ridgeSpine[2] || center,
          elevation: 165,
          label: `${name} · 望海石灰岩崖頂 [Cliff Peak 165m]`,
        },
        {
          pos: ridgeSpine[5] || center,
          elevation: 185,
          label: `${name} · 迎風高地要塞稜線 [Windward Bluff 185m]`,
        },
      ],
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // 4x STRATEGIC STRONGHOLDS & 26+ DISPERSED INSTALLATIONS (廣域分佈守備體系)
  // ═══════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // STRONGHOLD 1: 灘頭外圍要塞據點 (Alpha Beachhead Bastion)
  // ─────────────────────────────────────────────────────────────
  const sh1Angle = atollAngle + 0.15;
  const sh1Dist = baseRadius * 0.84;
  const cp1Pos: Vector2D = {
    x: center.x + Math.cos(sh1Angle) * sh1Dist,
    y: center.y + Math.sin(sh1Angle) * sh1Dist,
  };
  const sh1Garrisons: string[] = [];

  const cp1Inst: Installation = makeInstallation({
    id: `${id}-sh1-cp`,
    type: 'command_post',
    name: era === 'era2' ? `${name} · 灘頭鋼筋混凝土要塞指揮所 [Alpha CP]` : `${name} · 灘頭木石野戰指揮掩體 [Alpha CP]`,
    weaponDesc: '前線沙灘抗登陸第一防禦線樞紐 · 衛隊機槍與迫擊砲守備',
    pos: cp1Pos,
    angle: sh1Angle,
    health: era === 'era2' ? 4200 : 3400,
    armor: era === 'era2' ? 0.60 : 0.45,
    range: 750,
    cooldown: 0.8,
    reloadTime: 1.6,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(cp1Inst);
  sh1Garrisons.push(cp1Inst.id);

  // Heavy Coastal Battery (203mm / 140mm)
  const coastGun1: Installation = makeInstallation({
    id: `${id}-sh1-coastal-gun-1`,
    type: 'coastal_gun',
    name: era === 'era2' ? '海岸要塞重砲台 (203mm 雙聯裝岸防重砲)' : '灘頭要塞岸防砲 (140mm 單裝加農砲)',
    weaponDesc: '重裝甲岸防加農砲台 · 覆蓋外海登陸舟艇與驅逐艦',
    pos: { x: cp1Pos.x + 55, y: cp1Pos.y + 35 },
    angle: sh1Angle,
    health: era === 'era2' ? 3800 : 3000,
    armor: era === 'era2' ? 0.58 : 0.48,
    range: era === 'era2' ? 1700 : 1400,
    cooldown: 2.0,
    reloadTime: era === 'era2' ? 5.2 : 4.8,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(coastGun1);
  sh1Garrisons.push(coastGun1.id);

  // Flank Coastal Gun 2
  const coastGun2: Installation = makeInstallation({
    id: `${id}-sh1-coastal-gun-2`,
    type: 'coastal_gun',
    name: era === 'era2' ? '側翼隱蔽岸防砲台 (140mm 單裝加農砲)' : '灘頭掩護野戰砲台 (75mm 單裝岸防野砲)',
    weaponDesc: '側防射口岸防砲 · 封鎖灘頭搶灘走廊',
    pos: { x: cp1Pos.x - 50, y: cp1Pos.y + 40 },
    angle: sh1Angle - 0.3,
    health: 2800,
    armor: 0.48,
    range: 1350,
    cooldown: 1.5,
    reloadTime: 3.5,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(coastGun2);
  sh1Garrisons.push(coastGun2.id);

  // Flak Battery (八八式75mm / 25mm三聯裝)
  const flak1: Installation = makeInstallation({
    id: `${id}-sh1-flak`,
    type: 'flak_battery',
    name: era === 'era2' ? '灘頭防空砲連 (八八式75mm高射砲群)' : '野戰防空高砲哨 (八八式75mm高射砲)',
    weaponDesc: '75mm 高射砲 + 25mm 機砲 · 彈幕攔截俯衝轟炸機與魚雷機',
    pos: { x: cp1Pos.x - 30, y: cp1Pos.y - 45 },
    angle: sh1Angle,
    health: era === 'era2' ? 2600 : 2100,
    armor: 0.42,
    range: era === 'era2' ? 950 : 850,
    cooldown: 0.8,
    reloadTime: 2.2,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: false,
  });
  installations.push(flak1);
  sh1Garrisons.push(flak1.id);

  // Bunker Nest on Beach
  const bunker1: Installation = makeInstallation({
    id: `${id}-sh1-bunker`,
    type: 'bunker_nest',
    name: '灘頭重機槍永備暗堡陣地 [Beach Pillbox Alpha]',
    weaponDesc: '雙聯九二式重機槍鋼筋混凝土暗堡 · 密集火網壓制搶灘陸戰隊',
    pos: { x: cp1Pos.x + 40, y: cp1Pos.y - 30 },
    angle: sh1Angle,
    health: 3200,
    armor: 0.72,
    range: 920,
    cooldown: 0.4,
    reloadTime: 1.2,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(bunker1);
  sh1Garrisons.push(bunker1.id);

  strongholds.push({
    id: `${id}-sh-1`,
    name: `${name} · 灘頭外圍要塞據點`,
    cpPos: cp1Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh1Garrisons,
  });

  // ─────────────────────────────────────────────────────────────
  // STRONGHOLD 2: 核心高地與潟湖水上機場 (Bravo Lagoon Airfield Hub)
  // ─────────────────────────────────────────────────────────────
  const sh2Angle = atollAngle + Math.PI * 0.58;
  const sh2Dist = baseRadius * 0.65;
  const cp2Pos: Vector2D = {
    x: center.x + Math.cos(sh2Angle) * sh2Dist,
    y: center.y + Math.sin(sh2Angle) * sh2Dist,
  };
  const sh2Garrisons: string[] = [];

  const cp2Inst: Installation = makeInstallation({
    id: `${id}-sh2-cp`,
    type: 'command_post',
    name: `${name} · 潟湖航空要塞司令部 [Bravo CP]`,
    weaponDesc: '環礁內海航空作戰與戰役物資調配中心 · 衛隊駐守',
    pos: cp2Pos,
    angle: sh2Angle,
    health: era === 'era2' ? 4500 : 3600,
    armor: 0.62,
    range: 800,
    cooldown: 0.7,
    reloadTime: 1.5,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  });
  installations.push(cp2Inst);
  sh2Garrisons.push(cp2Inst.id);

  // Lagoon Airfield
  const afbInst: Installation = makeInstallation({
    id: `${id}-sh2-airfield`,
    type: 'airfield',
    name: `${name} · 潟湖水上與陸基雙用野戰機場`,
    weaponDesc:
      era === 'era5'
        ? '現代化混凝土硬化跑道與超視距防空雷達站 · 支援 Su-27 / MiG-29 與 Tu-22M3 起降'
        : era === 'era4'
        ? '長程噴射戰機跑道 · 支援 MiG-21 與 Su-7 戰鬥轟炸機進駐'
        : era === 'era3'
        ? '噴射前進跑道 · 支援 MiG-15 與 Tu-14 噴射轟炸機起降'
        : era === 'era2'
        ? '硬化珊瑚跑道與掩體防空砲陣地 · 支援日軍四式戰「疾風」與神風特攻機'
        : '硬化珊瑚跑道與內海平靜潟湖水上機泊位 · 支援零戰與九九艦爆起降',
    pos: { x: cp2Pos.x + 70, y: cp2Pos.y + 20 },
    angle: sh2Angle,
    health: 4800,
    armor: 0.52,
    range: 3600,
    reloadTime: 16,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(afbInst);
  sh2Garrisons.push(afbInst.id);

  // Radar Station
  const radarInst: Installation = makeInstallation({
    id: `${id}-sh2-radar`,
    type: 'radar_station',
    name: era === 'era2' ? '海軍二二號對海對空電探哨 (Radar Station)' : '海軍二一號早期電波探信儀',
    weaponDesc: '廣域空情早期預警雷達 · 探測遠程打擊機群',
    pos: { x: cp2Pos.x - 45, y: cp2Pos.y + 65 },
    angle: sh2Angle,
    health: 2400,
    armor: 0.38,
    range: era === 'era2' ? 3200 : 2400,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(radarInst);
  sh2Garrisons.push(radarInst.id);

  // Ammo Depot
  const depotInst: Installation = makeInstallation({
    id: `${id}-sh2-depot`,
    type: 'ammo_depot',
    name: '地下坑道軍需彈藥航油儲備庫',
    weaponDesc: '珊瑚洞穴覆土彈藥庫 · 為機場與守備砲隊提供補給',
    pos: { x: cp2Pos.x - 55, y: cp2Pos.y - 30 },
    angle: sh2Angle,
    health: 3200,
    armor: 0.55,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(depotInst);
  sh2Garrisons.push(depotInst.id);

  // Airfield Defense Flak
  const flak2: Installation = makeInstallation({
    id: `${id}-sh2-flak`,
    type: 'flak_battery',
    name: '機場核心防空砲連 (九六式25mm三聯裝防空機砲)',
    weaponDesc: '三聯裝 25mm 高射機砲密集火網 · 攔截低空掃射戰機',
    pos: { x: cp2Pos.x + 35, y: cp2Pos.y - 50 },
    angle: sh2Angle,
    health: 2600,
    armor: 0.45,
    range: 900,
    cooldown: 0.6,
    reloadTime: 1.8,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(flak2);
  sh2Garrisons.push(flak2.id);

  strongholds.push({
    id: `${id}-sh-2`,
    name: `${name} · 潟湖航空要塞司令部`,
    cpPos: cp2Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh2Garrisons,
  });

  // ─────────────────────────────────────────────────────────────
  // STRONGHOLD 3: 深水航道入口海防要塞 (Charlie Channel Harbor Guard)
  // ─────────────────────────────────────────────────────────────
  const sh3Angle = atollAngle + Math.PI * 1.35;
  const sh3Dist = baseRadius * 0.72;
  const cp3Pos: Vector2D = {
    x: center.x + Math.cos(sh3Angle) * sh3Dist,
    y: center.y + Math.sin(sh3Angle) * sh3Dist,
  };
  const sh3Garrisons: string[] = [];

  const cp3Inst: Installation = makeInstallation({
    id: `${id}-sh3-cp`,
    type: 'command_post',
    name: `${name} · 深水航道水門海防指揮所 [Charlie CP]`,
    weaponDesc: '扼守環礁潟湖深水航道通道 · 堅固防禦工事',
    pos: cp3Pos,
    angle: sh3Angle,
    health: era === 'era2' ? 4000 : 3200,
    armor: 0.58,
    range: 750,
    cooldown: 0.8,
    reloadTime: 1.6,
    side: 'enemy',
    strongholdId: `${id}-sh-3`,
    isASuWOnly: true,
  });
  installations.push(cp3Inst);
  sh3Garrisons.push(cp3Inst.id);

  // Heavy Channel Artillery (140mm)
  const channelGun: Installation = makeInstallation({
    id: `${id}-sh3-channel-gun`,
    type: 'coastal_gun',
    name: '航道入口雙聯裝岸防重砲堡 (140mm加農砲)',
    weaponDesc: '交叉射火扼守深水潟湖入口狹道',
    pos: { x: cp3Pos.x + 45, y: cp3Pos.y + 40 },
    angle: sh3Angle + 0.4,
    health: 3400,
    armor: 0.55,
    range: 1550,
    cooldown: 1.8,
    reloadTime: 4.2,
    side: 'enemy',
    strongholdId: `${id}-sh-3`,
    isASuWOnly: true,
  });
  installations.push(channelGun);
  sh3Garrisons.push(channelGun.id);

  // Tank Platoon Defending Channel
  const tankInst: Installation = makeInstallation({
    id: `${id}-sh3-tank`,
    type: 'tank_platoon',
    name:
      era === 'era5'
        ? '裝甲戰車排 (T-80B/BMP-2 主戰裝甲陣地)'
        : era === 'era4'
        ? '裝甲戰車排 (T-54/55 戰車陣地)'
        : era === 'era3'
        ? '裝甲戰車排 (T-34/85 突擊裝甲陣地)'
        : era === 'era2'
        ? '裝甲戰車排 (九七式中戰車「チハ」陣地)'
        : '裝甲戰車排 (九五式輕戰車陣地)',
    weaponDesc: '裝甲埋伏射擊掩體 · 反擊突破航道之登陸裝甲車',
    pos: { x: cp3Pos.x - 40, y: cp3Pos.y - 35 },
    angle: sh3Angle,
    health: era === 'era5' ? 4800 : era === 'era4' ? 3800 : era === 'era3' ? 3200 : era === 'era2' ? 2900 : 2200,
    armor: 0.52,
    range: 880,
    cooldown: 1.0,
    reloadTime: 3.0,
    side: 'enemy',
    strongholdId: `${id}-sh-3`,
    isASuWOnly: true,
  });
  installations.push(tankInst);
  sh3Garrisons.push(tankInst.id);

  // Channel Watchtower
  const watchtowerInst: Installation = makeInstallation({
    id: `${id}-sh3-watchtower`,
    type: 'watchtower',
    name: '航道瞭望高台與探照燈哨所',
    weaponDesc: '大型探照燈與光學測距哨 · 引導岸防重砲精準打擊',
    pos: { x: cp3Pos.x - 35, y: cp3Pos.y + 50 },
    angle: sh3Angle,
    health: 1800,
    armor: 0.30,
    range: 950,
    cooldown: 0.5,
    reloadTime: 1.2,
    side: 'enemy',
    strongholdId: `${id}-sh-3`,
  });
  installations.push(watchtowerInst);
  sh3Garrisons.push(watchtowerInst.id);

  strongholds.push({
    id: `${id}-sh-3`,
    name: `${name} · 深水航道水門海防據點`,
    cpPos: cp3Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh3Garrisons,
  });

  // ─────────────────────────────────────────────────────────────
  // STRONGHOLD 4: 迎風珊瑚高地與遠程雷達砲兵陣地 (Delta Coral Bluff Citadel)
  // ─────────────────────────────────────────────────────────────
  const sh4Angle = atollAngle + Math.PI * 1.85;
  const sh4Dist = baseRadius * 0.78;
  const cp4Pos: Vector2D = {
    x: center.x + Math.cos(sh4Angle) * sh4Dist,
    y: center.y + Math.sin(sh4Angle) * sh4Dist,
  };
  const sh4Garrisons: string[] = [];

  const cp4Inst: Installation = makeInstallation({
    id: `${id}-sh4-cp`,
    type: 'command_post',
    name: `${name} · 迎風高地要塞指揮所 [Delta CP]`,
    weaponDesc: '石灰岩高地地下坑道指揮所 · 控制全島制高點與遠程砲隊',
    pos: cp4Pos,
    angle: sh4Angle,
    health: 4400,
    armor: 0.65,
    range: 800,
    cooldown: 0.7,
    reloadTime: 1.5,
    side: 'enemy',
    strongholdId: `${id}-sh-4`,
    isASuWOnly: true,
  });
  installations.push(cp4Inst);
  sh4Garrisons.push(cp4Inst.id);

  // Heavy Long-range Towed Artillery
  const artyInst: Installation = makeInstallation({
    id: `${id}-sh4-arty`,
    type: 'towed_artillery',
    name: '高地野戰加農重砲連 (九六式150mm榴彈砲陣地)',
    weaponDesc: '重型榴彈砲連 · 高角曲射覆蓋全島各灘頭與近海錨地',
    pos: { x: cp4Pos.x + 50, y: cp4Pos.y - 30 },
    angle: sh4Angle - 0.4,
    health: 3200,
    armor: 0.50,
    range: 1650,
    cooldown: 1.2,
    reloadTime: 3.6,
    side: 'enemy',
    strongholdId: `${id}-sh-4`,
    isASuWOnly: true,
  });
  installations.push(artyInst);
  sh4Garrisons.push(artyInst.id);

  // High-ground Flak Battery
  const flak4: Installation = makeInstallation({
    id: `${id}-sh4-flak`,
    type: 'flak_battery',
    name: '制高點重型防空砲營 (十年式120mm高角砲台)',
    weaponDesc: '120mm 重型高平兩用砲 · 封鎖外海上空高空空域',
    pos: { x: cp4Pos.x - 45, y: cp4Pos.y + 35 },
    angle: sh4Angle,
    health: 3000,
    armor: 0.50,
    range: 1200,
    cooldown: 0.9,
    reloadTime: 2.5,
    side: 'enemy',
    strongholdId: `${id}-sh-4`,
  });
  installations.push(flak4);
  sh4Garrisons.push(flak4.id);

  // Ridge Bunker
  const ridgeBunker: Installation = makeInstallation({
    id: `${id}-sh4-bunker`,
    type: 'bunker_nest',
    name: '珊瑚岩洞掩蔽暗堡 [Bluff Bunker Delta]',
    weaponDesc: '天然石灰岩洞加固碉堡 · 壓制山脊進攻路徑',
    pos: { x: cp4Pos.x + 30, y: cp4Pos.y + 45 },
    angle: sh4Angle,
    health: 3500,
    armor: 0.75,
    range: 950,
    cooldown: 0.4,
    reloadTime: 1.2,
    side: 'enemy',
    strongholdId: `${id}-sh-4`,
    isASuWOnly: true,
  });
  installations.push(ridgeBunker);
  sh4Garrisons.push(ridgeBunker.id);

  strongholds.push({
    id: `${id}-sh-4`,
    name: `${name} · 迎風高地要塞據點`,
    cpPos: cp4Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh4Garrisons,
  });

  // ─────────────────────────────────────────────────────────────
  // 2x 珊瑚岩洞隱蔽伏擊坑道 (Hidden Karst Cave Tunnels)
  // ─────────────────────────────────────────────────────────────
  installations.push(
    makeInstallation({
      id: `${id}-tunnel-1`,
      type: 'hidden_tunnel',
      name: '珊瑚洞穴地下偽裝反突擊坑道 [Tunnel 1]',
      weaponDesc: '躲避艦砲轟擊之地下精銳突擊隊伏擊坑道',
      pos: { x: center.x + Math.cos(atollAngle + 0.9) * (baseRadius * 0.75), y: center.y + Math.sin(atollAngle + 0.9) * (baseRadius * 0.75) },
      angle: atollAngle + 0.9,
      health: 3200,
      armor: 0.70,
      side: 'enemy',
    }),
    makeInstallation({
      id: `${id}-tunnel-2`,
      type: 'hidden_tunnel',
      name: '迎風石灰岩洞穴坑道集結點 [Tunnel 2]',
      weaponDesc: '隱伏於懸崖下之伏擊出擊口',
      pos: { x: center.x + Math.cos(atollAngle + 2.2) * (baseRadius * 0.72), y: center.y + Math.sin(atollAngle + 2.2) * (baseRadius * 0.72) },
      angle: atollAngle + 2.2,
      health: 3200,
      armor: 0.70,
      side: 'enemy',
    })
  );

  return {
    id,
    name,
    center,
    radius: baseRadius,
    points,
    contours,
    installations,
    strongholds,
    isFriendlyBase: false,
    isFullyCaptured: false,
    isAtoll: true,
    lagoons: [lagoon],
    forestBelts,
    mountainRidges,
  };
}

// Generate organic island polygon with multiple strongholds, NATO command posts, and ground defense installations
export function generateOrganicIsland(
  id: string,
  name: string,
  center: Vector2D,
  baseRadius: number,
  seed: number,
  era: Era = 'era1'
): Island {
  const points: Vector2D[] = [];
  const contours: Vector2D[][] = [];

  if (id === 'island-mainland') {
    // ════ Dedicated Continental Mainland Polygon (Guaranteed Dry Land from X: 4850 to 14000) ════
    const coastSegments = 28;
    for (let s = 0; s <= coastSegments; s++) {
      const y = (s / coastSegments) * 14000;
      // Organic curving western coastline: safely between X = 4850 and 5200
      const n1 = Math.sin(s * 0.45 + seed * 1.5) * 140;
      const n2 = Math.cos(s * 1.1 - seed * 0.9) * 90;
      const x = 5020 + n1 + n2;
      points.push({ x, y });
    }
    // East continental boundary (spans the entire eastern edge of the world)
    points.push({ x: 14000, y: 14000 });
    points.push({ x: 14000, y: 0 });

    // Continental interior mountain chain contours
    const contourScales = [0.75, 0.52, 0.28];
    for (const scale of contourScales) {
      const ring: Vector2D[] = [];
      const inlandBaseX = 5300 + (14000 - 5300) * (1 - scale);
      for (let s = 1; s < coastSegments; s += 2) {
        const y = (s / coastSegments) * 14000;
        const x = inlandBaseX + Math.sin(s + seed) * 120;
        ring.push({ x, y });
      }
      ring.push({ x: 13800, y: 13800 });
      ring.push({ x: 13800, y: 200 });
      contours.push(ring);
    }
  } else {
    const numPoints = 32 + Math.floor((seed % 7) * 2);
    const angleStep = (Math.PI * 2) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const n1 = Math.sin(angle * 3 + seed * 1.7) * 0.22;
      const n2 = Math.cos(angle * 5 - seed * 2.3) * 0.14;
      const n3 = Math.sin(angle * 7 + seed * 0.9) * 0.08;
      const r = baseRadius * (1 + n1 + n2 + n3);

      points.push({
        x: center.x + Math.cos(angle) * r,
        y: center.y + Math.sin(angle) * r,
      });
    }

    const contourScales = [0.72, 0.45, 0.22];
    for (const scale of contourScales) {
      const ring: Vector2D[] = [];
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ring.push({
          x: center.x + (p.x - center.x) * scale * (0.92 + Math.sin(i + scale * 5) * 0.08),
          y: center.y + (p.y - center.y) * scale * (0.92 + Math.cos(i + scale * 5) * 0.08),
        });
      }
      contours.push(ring);
    }
  }

  const installations: Installation[] = [];
  const strongholds: IslandStronghold[] = [];

  // Determine number of strongholds: 2 to 3 per island
  const strongholdCount = baseRadius > 440 ? 3 : 2;
  const baseAngle = (seed * 1.35) % (Math.PI * 2);

  // ══════════════════════════════════════════════════════════════
  // STRONGHOLD 1: 灘頭外圍要塞據點 (Alpha Stronghold & CP)
  // ══════════════════════════════════════════════════════════════
  const sh1Angle = baseAngle;
  const sh1Dist = baseRadius * 0.62;
  const cp1Pos: Vector2D = {
    x: center.x + Math.cos(sh1Angle) * sh1Dist,
    y: center.y + Math.sin(sh1Angle) * sh1Dist,
  };
  const sh1Garrisons: string[] = [];

  const cp1Name =
    era === 'era4'
      ? `${name} · 北越前線沿海堅固防禦指揮所 [Alpha CP]`
      : era === 'era3'
      ? `${name} · 灘頭地下防核坑道要塞中心 [Alpha CP]`
      : era === 'era2'
      ? `${name} · 灘頭鋼筋混凝土要塞指揮所 [Alpha CP]`
      : `${name} · 灘頭木石野戰指揮掩體 [Alpha CP]`;
  const cp1Desc =
    era === 'era4'
      ? '地下交錯坑道與加固防爆指揮所 · 具備戰術有線電與早期預警通訊'
      : era === 'era3'
      ? '深層花崗岩防核防空掩體 · 自動化戰術通信中樞'
      : era === 'era2'
      ? '島嶼守備第一大隊鋼筋混凝土前進指揮掩體 · 核心衛隊駐防'
      : '木質與夯土覆蓋之野戰守備指揮掩體 · 步槍兵衛隊';

  const cp1Inst: Installation = makeInstallation({
    id: `${id}-sh1-cp`,
    type: 'command_post',
    name: cp1Name,
    weaponDesc: cp1Desc,
    pos: cp1Pos,
    angle: sh1Angle,
    health: (era === 'era4' || era === 'era3') ? 4600 : era === 'era2' ? 3800 : 3200,
    armor: (era === 'era4' || era === 'era3') ? 0.68 : era === 'era2' ? 0.55 : 0.40,
    range: (era === 'era4' || era === 'era3') ? 780 : era === 'era2' ? 700 : 600,
    cooldown: 0.8,
    reloadTime: (era === 'era4' || era === 'era3') ? 1.4 : 1.8,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(cp1Inst);
  sh1Garrisons.push(cp1Inst.id);

  // Coastal Gun 1: Primary Heavy Coastal Battery
  const coastalGunName =
    era === 'era4'
      ? '海岸雷達射控岸防砲台 (SM-4-1 130mm 岸防砲)'
      : era === 'era3'
      ? '自動雷達導引岸防砲台 (130mm 雙聯自動裝填加農砲)'
      : era === 'era2'
      ? '海岸要塞重砲台 (203mm 雙聯裝岸防重砲)'
      : '灘頭要塞岸防砲 (140mm 單裝加農砲)';
  const coastalGunDesc =
    era === 'era4'
      ? '蘇聯援越 SM-4-1 130mm 長管岸防加農砲 · 配備光學與雷達雙模導引'
      : era === 'era3'
      ? '130mm 雷達射控自動岸防砲 · 高射速壓制近海特遣艦隊'
      : era === 'era2'
      ? '203mm 雙聯裝岸防重砲 · 封鎖近海灘頭航道'
      : '140mm 單裝岸防加農砲 · 扼守近岸灘頭水道';

  const coastalGun: Installation = makeInstallation({
    id: `${id}-sh1-coastal-gun`,
    type: 'coastal_gun',
    name: coastalGunName,
    weaponDesc: coastalGunDesc,
    pos: { x: cp1Pos.x + 40, y: cp1Pos.y + 30 },
    angle: sh1Angle,
    health: (era === 'era4' || era === 'era3') ? 4200 : era === 'era2' ? 3500 : 2800,
    armor: (era === 'era4' || era === 'era3') ? 0.65 : era === 'era2' ? 0.55 : 0.45,
    range: (era === 'era4' || era === 'era3') ? 1800 : era === 'era2' ? 1600 : 1350,
    cooldown: 2,
    reloadTime: (era === 'era4' || era === 'era3') ? 3.4 : era === 'era2' ? 5.6 : 5.0,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(coastalGun);
  sh1Garrisons.push(coastalGun.id);

  // Coastal Gun 1B: Flank Covering Battery
  const coastalGun1BName =
    era === 'era4'
      ? '側翼隱蔽岸防加農砲台 (B-13 130mm 岸防砲)'
      : era === 'era3'
      ? '側翼雷達岸防加農砲台 (100mm 自動裝填加農砲)'
      : era === 'era2'
      ? '灘頭側防要塞砲台 (140mm 單裝加農砲)'
      : '灘頭掩護野戰砲台 (75mm 單裝岸防野砲)';
  const coastalGun1BDesc =
    era === 'era4'
      ? '130mm 單裝岸防加農砲 · 隱蔽射口壓制近岸裝甲登陸艇'
      : era === 'era3'
      ? '100mm 自動速射加農砲 · 快速擊破兩棲裝甲登陸艇'
      : era === 'era2'
      ? '140mm 側翼掩護岸防砲 · 壓制搶灘舟艇與登陸艦'
      : '75mm 野防加農砲 · 封鎖沙灘登陸路徑';

  const coastalGun1B: Installation = makeInstallation({
    id: `${id}-sh1-coastal-gun-2`,
    type: 'coastal_gun',
    name: coastalGun1BName,
    weaponDesc: coastalGun1BDesc,
    pos: { x: cp1Pos.x - 55, y: cp1Pos.y + 20 },
    angle: sh1Angle - 0.4,
    health: (era === 'era4' || era === 'era3') ? 3400 : era === 'era2' ? 2800 : 2200,
    armor: (era === 'era4' || era === 'era3') ? 0.60 : era === 'era2' ? 0.50 : 0.40,
    range: (era === 'era4' || era === 'era3') ? 1500 : era === 'era2' ? 1350 : 1200,
    cooldown: 1.4,
    reloadTime: (era === 'era4' || era === 'era3') ? 2.6 : era === 'era2' ? 4.2 : 4.0,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(coastalGun1B);
  sh1Garrisons.push(coastalGun1B.id);

  // Flak Battery 1
  const flak1Name =
    era === 'era4'
      ? 'S-60 57mm 雷達射控防空連 (SON-9火輪雷達)'
      : era === 'era3'
      ? 'S-60 57mm 雷達射控防空砲連 (SON-9火輪雷達)'
      : era === 'era2'
      ? '灘頭防空高射砲連 (八八式75mm高射砲 + 25mm機砲群)'
      : '灘頭防空高射砲哨 (八八式75mm高射砲)';
  const flak1Desc =
    era === 'era4'
      ? 'SON-9 火輪雷達射控 57mm 自動防空高射砲群 · 封鎖中低空防禦空域'
      : era === 'era3'
      ? 'SON-9 火輪雷達射控 57mm 自動防空高射砲群'
      : era === 'era2'
      ? '八八式75粍高射砲 + 九六式25粍機砲'
      : '八八式75粍野戰高射砲 · 目視光學測距';

  const flak1: Installation = makeInstallation({
    id: `${id}-sh1-flak`,
    type: 'flak_battery',
    name: flak1Name,
    weaponDesc: flak1Desc,
    pos: { x: cp1Pos.x - 35, y: cp1Pos.y + 45 },
    angle: sh1Angle + 0.5,
    health: (era === 'era4' || era === 'era3') ? 3200 : era === 'era2' ? 2600 : 2200,
    armor: (era === 'era4' || era === 'era3') ? 0.55 : era === 'era2' ? 0.45 : 0.38,
    range: (era === 'era4' || era === 'era3') ? 1200 : era === 'era2' ? 950 : 880,
    cooldown: 0.8,
    reloadTime: (era === 'era4' || era === 'era3') ? 1.0 : era === 'era2' ? 2.0 : 2.4,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: false,
  });
  installations.push(flak1);
  sh1Garrisons.push(flak1.id);

  // Flak Battery 1B: Close-in AA
  const flak1BName =
    era === 'era4'
      ? 'ZPU-4 四聯裝 14.5mm 防空重機槍連'
      : era === 'era3'
      ? '雙聯裝 37mm 快速防空機砲連'
      : era === 'era2'
      ? '灘頭近迫防空高平機砲排 (九六式25mm三聯裝防空砲)'
      : '灘頭野戰防空高射機槍哨 (十三粍雙聯防空機槍)';
  const flak1BDesc =
    era === 'era4'
      ? '四聯 14.5mm 重機槍 · 致命低空密集彈幕撕碎掠地戰機'
      : era === 'era3'
      ? '37mm 自動速射防空機砲 · 攔截低空噴射攻擊機'
      : era === 'era2'
      ? '密集25mm近迫機砲網 · 攔截俯衝轟炸機與低空掃射戰機'
      : '13.2mm 雙聯防空重機槍 · 壓制低空俯衝戰機';

  const flak1B: Installation = makeInstallation({
    id: `${id}-sh1-flak-2`,
    type: 'flak_battery',
    name: flak1BName,
    weaponDesc: flak1BDesc,
    pos: { x: cp1Pos.x + 25, y: cp1Pos.y + 55 },
    angle: sh1Angle - 0.3,
    health: (era === 'era4' || era === 'era3') ? 2800 : era === 'era2' ? 2400 : 1900,
    armor: (era === 'era4' || era === 'era3') ? 0.50 : era === 'era2' ? 0.42 : 0.35,
    range: (era === 'era4' || era === 'era3') ? 1000 : era === 'era2' ? 820 : 750,
    cooldown: 0.5,
    reloadTime: (era === 'era4' || era === 'era3') ? 0.8 : era === 'era2' ? 1.6 : 1.8,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: false,
  });
  installations.push(flak1B);
  sh1Garrisons.push(flak1B.id);

  // 2x Infantry squads
  for (let s = 1; s <= 2; s++) {
    const sqName =
      era === 'era4'
        ? `越盟前線守備第${s}班 (AK-47 / RPG-7 反戰車組)`
        : era === 'era3'
        ? `灘頭守備第${s}班 (地下防空暗堡與重機槍)`
        : era === 'era2'
        ? `灘頭守備第${s}班 (九二式重機槍碉堡)`
        : `灘頭守備第${s}班 (沙袋塹壕機槍哨)`;
    const sqDesc =
      era === 'era4'
        ? 'AK-47 突擊步槍、RPD 機槍與 RPG-7 火箭筒 · 地道工事伏擊'
        : era === 'era3'
        ? '花崗岩鋼筋掩體 + 12.7mm 重機槍 (ASuW封鎖)'
        : era === 'era2'
        ? '7.7mm 九二式重機關槍 + 沙袋掩體 (ASuW封鎖)'
        : '6.5mm 三八式步槍班 + 十一年式輕機槍 (ASuW封鎖)';

    const sqInst: Installation = makeInstallation({
      id: `${id}-sh1-squad-${s}`,
      type: 'infantry_squad',
      name: sqName,
      weaponDesc: sqDesc,
      pos: { x: cp1Pos.x + (s === 1 ? 50 : -45), y: cp1Pos.y + (s === 1 ? -40 : -35) },
      angle: sh1Angle,
      health: (era === 'era4' || era === 'era3') ? 2400 : era === 'era2' ? 1800 : 1400,
      armor: (era === 'era4' || era === 'era3') ? 0.45 : era === 'era2' ? 0.35 : 0.28,
      range: (era === 'era4' || era === 'era3') ? 680 : era === 'era2' ? 580 : 500,
      cooldown: 0.3,
      reloadTime: (era === 'era4' || era === 'era3') ? 1.0 : 1.4,
      side: 'enemy',
      strongholdId: `${id}-sh-1`,
      isASuWOnly: true,
    });
    installations.push(sqInst);
    sh1Garrisons.push(sqInst.id);
  }

  // Towed Artillery
  const art1Name =
    era === 'era4'
      ? '野戰牽引重砲兵連 (D-30 122mm 榴彈砲)'
      : era === 'era3'
      ? '野戰重型砲兵陣地 (D-30 122mm 榴彈砲)'
      : era === 'era2'
      ? '拖曳野戰砲兵陣地 (九〇式75mm野砲)'
      : '野戰砲兵陣地 (三十八式75mm野砲)';
  const art1Desc =
    era === 'era4'
      ? '蘇援 D-30 122mm 牽引榴彈砲 · 射程 1500m 覆蓋登陸舟艇與灘頭工事'
      : era === 'era3'
      ? '122mm 牽引榴彈砲 · 重裝高爆彈壓制登陸舟艇'
      : era === 'era2'
      ? '九〇式75粍野砲 · 高爆彈壓制登陸舟艇'
      : '三十八式75粍野砲 · 扼守灘頭沙灘';

  const art1: Installation = makeInstallation({
    id: `${id}-sh1-artillery`,
    type: 'towed_artillery',
    name: art1Name,
    weaponDesc: art1Desc,
    pos: { x: cp1Pos.x + 10, y: cp1Pos.y - 65 },
    angle: sh1Angle,
    health: (era === 'era4' || era === 'era3') ? 3000 : era === 'era2' ? 2500 : 2000,
    armor: (era === 'era4' || era === 'era3') ? 0.50 : era === 'era2' ? 0.40 : 0.35,
    range: (era === 'era4' || era === 'era3') ? 1500 : era === 'era2' ? 1250 : 1100,
    cooldown: 1.6,
    reloadTime: (era === 'era4' || era === 'era3') ? 3.0 : era === 'era2' ? 3.8 : 4.0,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  });
  installations.push(art1);
  sh1Garrisons.push(art1.id);

  strongholds.push({
    id: `${id}-sh-1`,
    name: `${name} · 灘頭要塞據點`,
    cpPos: cp1Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh1Garrisons,
  });

  // ══════════════════════════════════════════════════════════════
  // STRONGHOLD 2: 核心高地/機場要塞總部 (Bravo Stronghold & HQ CP)
  // ══════════════════════════════════════════════════════════════
  const sh2Angle = baseAngle + Math.PI * 0.95;
  const sh2Dist = baseRadius * 0.28;
  const cp2Pos: Vector2D = {
    x: center.x + Math.cos(sh2Angle) * sh2Dist,
    y: center.y + Math.sin(sh2Angle) * sh2Dist,
  };
  const sh2Garrisons: string[] = [];

  const cp2Name =
    era === 'era4'
      ? `${name} · 人民軍核心地下坑道司令部 [Bravo CP]`
      : era === 'era3'
      ? `${name} · 核心地下堅固司令部 [Bravo CP]`
      : era === 'era2'
      ? `${name} · 核心高地司令部 [Bravo CP]`
      : `${name} · 高地守備指揮部 [Bravo CP]`;
  const cp2Desc =
    era === 'era4'
      ? '地下複雜防爆坑道網 · 具備早期預警防空通信與後勤調配中樞'
      : era === 'era3'
      ? '地下雙層防空防爆工事 · 遠東戰區島嶼最高指揮中心'
      : era === 'era2'
      ? '島嶼最高守備司令部核心掩體 · 警衛重兵'
      : '夯土木質司令部掩體 · 島嶼守備司令駐防';

  const cp2Inst: Installation = makeInstallation({
    id: `${id}-sh2-cp`,
    type: 'command_post',
    name: cp2Name,
    weaponDesc: cp2Desc,
    pos: cp2Pos,
    angle: sh2Angle,
    health: (era === 'era4' || era === 'era3') ? 5200 : era === 'era2' ? 4200 : 3500,
    armor: (era === 'era4' || era === 'era3') ? 0.70 : era === 'era2' ? 0.55 : 0.42,
    range: (era === 'era4' || era === 'era3') ? 850 : era === 'era2' ? 750 : 650,
    cooldown: 0.6,
    reloadTime: (era === 'era4' || era === 'era3') ? 1.2 : 1.6,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  });
  installations.push(cp2Inst);
  sh2Garrisons.push(cp2Inst.id);

  // Major airfield if island large enough
  if (baseRadius > 360) {
    const afName =
      era === 'era5'
        ? '前線超音速重型空軍基地 (Su-27/MiG-29 戰備起降)'
        : era === 'era4'
        ? '前線超音速噴射空軍基地 (MiG-17/21 截擊基地)'
        : era === 'era3'
        ? '島嶼前線噴射空軍基地 (混凝土跑道)'
        : era === 'era2'
        ? '島嶼前線航空基地 (飛行場)'
        : '島嶼野戰簡易飛行場 (土質跑道)';
    const afDesc =
      era === 'era5'
        ? '雙向加固長跑道 · Su-27 / MiG-29 攔截機與 Tu-22M3 逆火轟炸機前進戰備基地'
        : era === 'era4'
        ? '鋼筋混凝土跑道 · MiG-17 / MiG-21 噴射戰鬥機攔截起降基地'
        : era === 'era3'
        ? '加固混凝土跑道 · MiG-15 / Tu-14 噴射轟炸機起降基地'
        : era === 'era2'
        ? '雙跑道 · 零戰/陸攻/神風起降基地'
        : '簡易草皮跑道 · 九六艦戰/九九艦爆起降基地';

    const afInst: Installation = makeInstallation({
      id: `${id}-airfield`,
      type: 'airfield',
      name: afName,
      weaponDesc: afDesc,
      pos: { x: cp2Pos.x + 40, y: cp2Pos.y - 35 },
      angle: (seed * 0.75) % (Math.PI * 2),
      health: (era === 'era5' || era === 'era4' || era === 'era3') ? 6800 : era === 'era2' ? 5500 : 4500,
      armor: (era === 'era5' || era === 'era4' || era === 'era3') ? 0.55 : era === 'era2' ? 0.45 : 0.35,
      range: 2800,
      cooldown: 5,
      reloadTime: 20,
      side: 'enemy',
      spawnTimer: 12,
      strongholdId: `${id}-sh-2`,
    });
    installations.push(afInst);
    sh2Garrisons.push(afInst.id);
  }

  // Tank Battalion
  const tankBnName =
    era === 'era5'
      ? '蘇聯近衛裝甲連陣地 (T-80B 燃氣渦輪主力戰車 & BMP-2)'
      : era === 'era4'
      ? '蘇援主力裝甲連 (T-54/55 & PT-76 水陸戰車)'
      : era === 'era3'
      ? '裝甲突擊集群核心陣地 (T-34/85 裝甲連)'
      : era === 'era2'
      ? '戰車聯隊/大隊核心陣地 (一式中戰車集群)'
      : '戰車中隊陣地 (九五式輕戰車小隊)';
  const tankBnDesc =
    era === 'era4'
      ? '100mm D-10T 戰車砲 + PT-76 水陸裝甲衝擊群'
      : era === 'era3'
      ? '85mm 戰車加農砲裝甲集群 + 加固地下戰車庫'
      : era === 'era2'
      ? '一式中戰車「チヘ」裝甲集群 + 地下戰車庫'
      : '37mm 戰車砲掩體 · 伏擊步兵登陸';

  const tankBn: Installation = makeInstallation({
    id: `${id}-sh2-tank-bn`,
    type: 'tank_battalion',
    name: tankBnName,
    weaponDesc: tankBnDesc,
    pos: { x: cp2Pos.x - 55, y: cp2Pos.y - 20 },
    angle: sh2Angle,
    health: (era === 'era4' || era === 'era3') ? 4400 : era === 'era2' ? 3600 : 2800,
    armor: (era === 'era4' || era === 'era3') ? 0.68 : era === 'era2' ? 0.55 : 0.42,
    range: (era === 'era4' || era === 'era3') ? 1200 : era === 'era2' ? 1050 : 900,
    cooldown: 1.2,
    reloadTime: (era === 'era4' || era === 'era3') ? 2.5 : era === 'era2' ? 3.2 : 3.0,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  });
  installations.push(tankBn);
  sh2Garrisons.push(tankBn.id);

  // Heavy Flak Battery
  const flak2Name =
    era === 'era4'
      ? 'KS-19 100mm 重型防空砲連 (SON-9火輪雷達火控)'
      : era === 'era3'
      ? 'KS-19 100mm 重型防空砲連 (SON-9雷達導引)'
      : era === 'era2'
      ? '司令部重型防空高射砲連 (八八式75mm高射砲)'
      : '高地防空高射砲哨 (八八式75mm高射砲)';
  const flak2Desc =
    era === 'era4'
      ? '100mm 重型雷達射控高射砲 · 發射無線電引信彈幕封鎖高空轟炸走廊'
      : era === 'era3'
      ? '100mm 重型雷達射控高射砲 · 封鎖高空轟炸走廊'
      : era === 'era2'
      ? '高仰角防空雷達射控高射機砲群'
      : '光學高仰角高射砲陣地';

  const flak2: Installation = makeInstallation({
    id: `${id}-sh2-flak`,
    type: 'flak_battery',
    name: flak2Name,
    weaponDesc: flak2Desc,
    pos: { x: cp2Pos.x + 60, y: cp2Pos.y + 40 },
    angle: sh2Angle + 1.2,
    health: (era === 'era4' || era === 'era3') ? 3600 : era === 'era2' ? 2800 : 2200,
    armor: (era === 'era4' || era === 'era3') ? 0.58 : era === 'era2' ? 0.48 : 0.38,
    range: (era === 'era4' || era === 'era3') ? 1350 : era === 'era2' ? 950 : 880,
    cooldown: 0.7,
    reloadTime: (era === 'era4' || era === 'era3') ? 1.4 : era === 'era2' ? 2.0 : 2.2,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: false,
  });
  installations.push(flak2);
  sh2Garrisons.push(flak2.id);

  // Coastal Gun 2
  const coastalGun2Name =
    era === 'era4'
      ? '島心高地隱蔽長程重型加農砲台 (ML-20 152mm 砲台)'
      : era === 'era3'
      ? '島心高地重型長程岸防加農砲 (152mm 雙聯長身管砲台)'
      : era === 'era2'
      ? '島心高地海防長程重砲台 (203mm 雙聯裝加農砲)'
      : '高地要塞海防砲台 (140mm 單裝加農砲)';
  const coastalGun2Desc =
    era === 'era4'
      ? '152mm 長管重砲 · 居高臨下實施長程壓制'
      : era === 'era3'
      ? '152mm 制高點自動加農砲 · 跨越山體重創登陸艦隊'
      : era === 'era2'
      ? '制高點長程加農砲 · 跨越山體砲擊特混艦隊'
      : '制高點砲位 · 俯瞰水道砲擊艦隻';

  const coastalGun2: Installation = makeInstallation({
    id: `${id}-sh2-coastal-gun`,
    type: 'coastal_gun',
    name: coastalGun2Name,
    weaponDesc: coastalGun2Desc,
    pos: { x: cp2Pos.x - 70, y: cp2Pos.y + 35 },
    angle: sh2Angle + 0.8,
    health: (era === 'era4' || era === 'era3') ? 4400 : era === 'era2' ? 3600 : 2800,
    armor: (era === 'era4' || era === 'era3') ? 0.68 : era === 'era2' ? 0.55 : 0.45,
    range: (era === 'era4' || era === 'era3') ? 1900 : era === 'era2' ? 1650 : 1400,
    cooldown: 2.2,
    reloadTime: (era === 'era4' || era === 'era3') ? 3.8 : era === 'era2' ? 6.0 : 5.5,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  });
  installations.push(coastalGun2);
  sh2Garrisons.push(coastalGun2.id);

  // Radar & Ammo Depot
  const radarName =
    era === 'era4'
      ? 'P-12 匙架 (Spoon Rest) 早期警戒雷達站'
      : era === 'era3'
      ? 'AN/SPS-6 3D 遠程對空搜索雷達哨 (雷達站)'
      : era === 'era2'
      ? '早期警戒對空對海電探哨 (二二號電探雷達站)'
      : '早期警戒對空電探哨 (二一號電波探信儀)';
  const radarDesc =
    era === 'era4'
      ? '米波遠程防空警戒雷達 · 提早探測高空與超音速戰機'
      : era === 'era3'
      ? '3D 對空全方位搜索雷達 · 提早偵獲高空噴射打擊群'
      : era === 'era2'
      ? '二二號對海對空電探 · 廣域空情預警'
      : '二一號早期電波探信儀 · 基礎空情預警';

  const radar: Installation = makeInstallation({
    id: `${id}-radar`,
    type: 'radar_station',
    name: radarName,
    weaponDesc: radarDesc,
    pos: { x: cp2Pos.x - 30, y: cp2Pos.y + 55 },
    angle: sh2Angle,
    health: (era === 'era4' || era === 'era3') ? 2800 : era === 'era2' ? 2200 : 1800,
    armor: (era === 'era4' || era === 'era3') ? 0.45 : era === 'era2' ? 0.35 : 0.28,
    range: (era === 'era4' || era === 'era3') ? 3800 : era === 'era2' ? 2400 : 2000,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(radar);
  sh2Garrisons.push(radar.id);

  const depotName =
    era === 'era4'
      ? '地下坑道軍需彈藥油料庫 (戰略後勤樞紐)'
      : era === 'era3'
      ? '防核地下重裝備油彈庫 (戰略物資儲備)'
      : era === 'era2'
      ? '地下彈藥重油庫 (軍需物資儲備)'
      : '野戰掩蔽油彈棚庫 (物資儲備)';
  const depotDesc =
    era === 'era4'
      ? '深層地下坑道與防空隱蔽部 · 儲存高射砲彈與噴射航空燃油'
      : era === 'era3'
      ? '花崗岩深層防核掩體 · 航油與航空重型火箭航彈'
      : era === 'era2'
      ? '強化防爆地下掩體 · 航油與航空炸彈'
      : '夯土掩蔽所 · 油料與炸彈儲備';

  const depot: Installation = makeInstallation({
    id: `${id}-depot`,
    type: 'ammo_depot',
    name: depotName,
    weaponDesc: depotDesc,
    pos: { x: cp2Pos.x + 30, y: cp2Pos.y + 60 },
    angle: sh2Angle,
    health: (era === 'era4' || era === 'era3') ? 3400 : era === 'era2' ? 2600 : 2000,
    armor: (era === 'era4' || era === 'era3') ? 0.50 : era === 'era2' ? 0.40 : 0.30,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  });
  installations.push(depot);
  sh2Garrisons.push(depot.id);

  strongholds.push({
    id: `${id}-sh-2`,
    name: `${name} · 核心高地司令部`,
    cpPos: cp2Pos,
    isCaptured: false,
    captureProgress: 0,
    garrisonIds: sh2Garrisons,
  });

  // ══════════════════════════════════════════════════════════
  // STRONGHOLD 3 (If large island): 港灣地下要塞 (Charlie CP)
  // ══════════════════════════════════════════════════════════
  if (strongholdCount >= 3) {
    const sh3Angle = baseAngle + Math.PI * 1.55;
    const sh3Dist = baseRadius * 0.58;
    const cp3Pos: Vector2D = {
      x: center.x + Math.cos(sh3Angle) * sh3Dist,
      y: center.y + Math.sin(sh3Angle) * sh3Dist,
    };
    const sh3Garrisons: string[] = [];

    const cp3Name =
      era === 'era3'
        ? `${name} · 港灣地下海防戰術指揮所 [Charlie CP]`
        : era === 'era2'
        ? `${name} · 港灣地下指揮所 [Charlie CP]`
        : `${name} · 港口守備指揮所 [Charlie CP]`;
    const cp3Desc =
      era === 'era3'
        ? '深層岩石防護掩體 · 港口水雷與自動岸防射控'
        : era === 'era2'
        ? '岩壁地下坑道指揮所 · 堅固防禦掩體'
        : '木石野戰海防指揮部 · 守備港口防禦';

    const cp3Inst: Installation = makeInstallation({
      id: `${id}-sh3-cp`,
      type: 'command_post',
      name: cp3Name,
      weaponDesc: cp3Desc,
      pos: cp3Pos,
      angle: sh3Angle,
      health: era === 'era3' ? 4800 : era === 'era2' ? 3800 : 3000,
      armor: era === 'era3' ? 0.65 : era === 'era2' ? 0.50 : 0.38,
      range: era === 'era3' ? 800 : era === 'era2' ? 700 : 600,
      cooldown: 0.7,
      reloadTime: era === 'era3' ? 1.3 : 1.7,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    });
    installations.push(cp3Inst);
    sh3Garrisons.push(cp3Inst.id);

    // Tank Platoon
    const tankPlName =
      era === 'era5'
        ? '裝甲反擊排 (T-80B/BMP-2 岸防裝甲掩體)'
        : era === 'era4'
        ? '裝甲反擊排 (T-54/55 岸防陣地)'
        : era === 'era3'
        ? '裝甲反擊排 (T-34/85 岸防陣地)'
        : era === 'era2'
        ? '裝甲戰車排 (九七式中戰車「チハ」陣地)'
        : '裝甲戰車排 (九五式輕戰車陣地)';
    const tankPlDesc =
      era === 'era5'
        ? '125mm 滑膛砲與反戰車飛彈掩體 · 扼守港區水陸要道'
        : era === 'era4'
        ? '100mm 戰車砲掩體 · 扼守港口防坡堤'
        : era === 'era3'
        ? '85mm 戰車砲掩體 · 扼守港口防坡堤'
        : era === 'era2'
        ? '47mm 戰車砲掩體 · 港灣灘頭反擊'
        : '37mm 輕戰車掩體 · 巡邏碼頭水線';

    const tankPl: Installation = makeInstallation({
      id: `${id}-sh3-tank`,
      type: 'tank_platoon',
      name: tankPlName,
      weaponDesc: tankPlDesc,
      pos: { x: cp3Pos.x + 35, y: cp3Pos.y - 30 },
      angle: sh3Angle,
      health: era === 'era3' ? 3600 : era === 'era2' ? 2800 : 2100,
      armor: era === 'era3' ? 0.62 : era === 'era2' ? 0.50 : 0.40,
      range: era === 'era3' ? 1100 : era === 'era2' ? 900 : 800,
      cooldown: 1.0,
      reloadTime: era === 'era3' ? 2.4 : era === 'era2' ? 3.0 : 3.0,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    });
    installations.push(tankPl);
    sh3Garrisons.push(tankPl.id);

    // Flak Battery
    const flak3Name =
      era === 'era3'
        ? '港灣雷達防空砲連 (S-60 57mm高射砲)'
        : era === 'era2'
        ? '港灣防空砲兵連 (八八式75mm高射砲)'
        : '港口野戰防空砲哨 (八八式75mm高射砲)';
    const flak3Desc =
      era === 'era3'
        ? '57mm 雷達射控防空砲 · 攔截低空突襲戰機'
        : era === 'era2'
        ? '75mm 高射砲 + 25mm 雙聯防空砲'
        : '75mm 高射砲掩體';

    const flak3: Installation = makeInstallation({
      id: `${id}-sh3-flak`,
      type: 'flak_battery',
      name: flak3Name,
      weaponDesc: flak3Desc,
      pos: { x: cp3Pos.x - 40, y: cp3Pos.y + 35 },
      angle: sh3Angle,
      health: era === 'era3' ? 3100 : era === 'era2' ? 2500 : 2000,
      armor: era === 'era3' ? 0.55 : era === 'era2' ? 0.45 : 0.38,
      range: era === 'era3' ? 1150 : era === 'era2' ? 880 : 820,
      cooldown: 0.9,
      reloadTime: era === 'era3' ? 1.2 : era === 'era2' ? 2.4 : 2.5,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: false,
    });
    installations.push(flak3);
    sh3Garrisons.push(flak3.id);

    // Coastal Gun 3
    const coastalGun3Name =
      era === 'era3'
        ? '港灣入口自動重砲台 (130mm 自動岸防加農砲)'
        : era === 'era2'
        ? '港灣入口岸防重砲台 (140mm 單裝加農砲)'
        : '港口入口岸防砲台 (120mm 單裝加農砲)';
    const coastalGun3Desc =
      era === 'era3'
        ? '雷達導引自動加農砲 · 封鎖深水航道'
        : era === 'era2'
        ? '深水港灣水道防禦 · 扼守港口航道'
        : '岸防加農砲 · 防衛港口航道入口';

    const coastalGun3: Installation = makeInstallation({
      id: `${id}-sh3-coastal-gun`,
      type: 'coastal_gun',
      name: coastalGun3Name,
      weaponDesc: coastalGun3Desc,
      pos: { x: cp3Pos.x - 55, y: cp3Pos.y - 20 },
      angle: sh3Angle - 0.6,
      health: era === 'era3' ? 3800 : era === 'era2' ? 3000 : 2400,
      armor: era === 'era3' ? 0.62 : era === 'era2' ? 0.52 : 0.42,
      range: era === 'era3' ? 1650 : era === 'era2' ? 1400 : 1250,
      cooldown: 1.6,
      reloadTime: era === 'era3' ? 3.0 : era === 'era2' ? 4.8 : 4.5,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    });
    installations.push(coastalGun3);
    sh3Garrisons.push(coastalGun3.id);

    strongholds.push({
      id: `${id}-sh-3`,
      name: `${name} · 港灣地下要塞`,
      cpPos: cp3Pos,
      isCaptured: false,
      captureProgress: 0,
      garrisonIds: sh3Garrisons,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // 地下坑道隱蔽點 (Hidden Tunnel Ambush Spawners)
  // ══════════════════════════════════════════════════════════════
  for (let t = 1; t <= 3; t++) {
    const tAngle = baseAngle + (t * Math.PI * 2) / 3 + 0.4;
    const tDist = baseRadius * (0.45 + (t % 2) * 0.15);
    installations.push(makeInstallation({
      id: `${id}-tunnel-${t}`,
      type: 'hidden_tunnel',
      name: `地下掩體隱蔽坑道第${t}出入口`,
      weaponDesc: '偽裝坑道網絡 · 躲避轟炸之精銳守備突擊部隊隱伏於此',
      pos: {
        x: center.x + Math.cos(tAngle) * tDist,
        y: center.y + Math.sin(tAngle) * tDist,
      },
      angle: tAngle,
      health: 2800,
      armor: 0.65,
      side: 'enemy',
    }));
  }

  return {
    id,
    name,
    center,
    radius: baseRadius,
    points,
    contours,
    installations,
    strongholds,
    isFriendlyBase: false,
    isFullyCaptured: false,
  };
}

// Generate the southwest Friendly Base Island with Airbase, AA, Radar, and Staged Forces
export function generateFriendlyBaseIsland(
  center: Vector2D,
  seed: number,
  era: Era
): Island {
  const baseRadius = 560;
  const points: Vector2D[] = [];
  const numPoints = 36;
  const angleStep = (Math.PI * 2) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep;
    const n1 = Math.sin(angle * 3 + seed * 1.5) * 0.18;
    const n2 = Math.cos(angle * 4 - seed * 2.1) * 0.12;
    const r = baseRadius * (1 + n1 + n2);
    points.push({
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
    });
  }

  const contours: Vector2D[][] = [];
  for (const scale of [0.75, 0.48, 0.24]) {
    const ring: Vector2D[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      ring.push({
        x: center.x + (p.x - center.x) * scale,
        y: center.y + (p.y - center.y) * scale,
      });
    }
    contours.push(ring);
  }

  const installations: Installation[] = [
    // Friendly AFB Airfield
    makeInstallation({
      id: 'friendly-base-afb',
      type: 'airfield',
      name: '友軍前進航空基地 (AFB Henderson Field)',
      weaponDesc: '雙跑道全天候後勤航空站 · 提供機隊補充與長程空中打擊',
      pos: { x: center.x + 20, y: center.y - 20 },
      angle: -Math.PI / 4,
      health: 3500,
      range: 4500,
      reloadTime: 15,
      side: 'player',
    }),
    // Friendly Flak Batteries (90mm M2 & 40mm Bofors)
    makeInstallation({
      id: 'friendly-base-flak-1',
      type: 'flak_battery',
      name: '友軍重型高射砲第1連 (90mm M2 高平兩用砲)',
      weaponDesc: 'SCR-584 雷達射控 VT 信管 90mm 防空砲',
      pos: { x: center.x - 140, y: center.y - 80 },
      health: 1200,
      armor: 0.35,
      range: 1100,
      cooldown: 0.6,
      reloadTime: 1.8,
      side: 'player',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'friendly-base-flak-2',
      type: 'flak_battery',
      name: '友軍重型高射砲第2連 (40mm 博福斯四聯裝機砲群)',
      weaponDesc: '密集博福斯防空火網 · 保護航空基地不受空襲',
      pos: { x: center.x + 160, y: center.y + 60 },
      angle: Math.PI / 2,
      health: 1100,
      armor: 0.35,
      range: 980,
      cooldown: 0.5,
      reloadTime: 1.5,
      side: 'player',
      isASuWOnly: false,
    }),
    // Radar Station
    makeInstallation({
      id: 'friendly-base-radar',
      type: 'radar_station',
      name: '友軍早期警戒防空電探哨 (SCR-270 遠程雷達)',
      weaponDesc: '長程預警雷達 · 提供戰區大範圍防空早期預警',
      pos: { x: center.x - 80, y: center.y + 120 },
      health: 800,
      range: 3600,
      side: 'player',
    }),
    // Munitions & Fuel Depot
    makeInstallation({
      id: 'friendly-base-depot',
      type: 'ammo_depot',
      name: '友軍戰略航空重油與彈藥庫',
      weaponDesc: '航空燃油儲存槽與航彈後勤基地',
      pos: { x: center.x + 80, y: center.y - 120 },
      health: 2500,
      side: 'player',
    }),
    // Multiple Ship Repair Facilities (船舶維修設施 / 應急造船廠浮塢) - 緊急修補到綠色生命值
    makeInstallation({
      id: 'friendly-base-repair-dock-1',
      type: 'ship_repair_dock',
      name: '友軍海軍第1浮動修船塢 (USS ABSD-1 巨型修船浮塢)',
      weaponDesc: '巨型浮動修船塢 · 靠泊緊急搶修船艦至安全綠色生命值 (+50 HP/s)',
      pos: { x: center.x + 230, y: center.y - 80 },
      angle: -Math.PI / 6,
      health: 4500,
      armor: 0.4,
      range: 750,
      side: 'player',
    }),
    makeInstallation({
      id: 'friendly-base-repair-dock-2',
      type: 'ship_repair_dock',
      name: '友軍海軍第2應急搶修浮塢 (Advanced Repair Drydock No.2)',
      weaponDesc: '前線快速損管浮塢 · 破孔抽水焊接與輪機搶修',
      pos: { x: center.x + 290, y: center.y + 40 },
      health: 4200,
      armor: 0.4,
      range: 750,
      side: 'player',
    }),
    makeInstallation({
      id: 'friendly-base-repair-dock-3',
      type: 'ship_repair_dock',
      name: '友軍深水港泊位輪機損管站 (Repair Anchorage Basin)',
      weaponDesc: '深水泊位搶修碼頭 · 滅火與緊急重置舵機結構',
      pos: { x: center.x + 180, y: center.y + 160 },
      angle: Math.PI / 4,
      health: 3800,
      armor: 0.35,
      range: 750,
      side: 'player',
    }),
    // Friendly Coastal, Fixed Heavy 240mm & Field Artillery Batteries (友軍島上固定式重砲與岸防陣地)
    makeInstallation({
      id: 'friendly-base-heavy-240-1',
      type: 'coastal_gun',
      name:
        era === 'era1'
          ? '友軍固定式要塞重砲台 (M1918 240mm 重型榴彈砲)'
          : era === 'era5'
          ? '友軍強化要塞重砲台 (M1 240mm 黑龍增程 RAP 岸防榴彈砲)'
          : '友軍固定式要塞重砲台 (M1 240mm「黑龍」重型榴彈砲)',
      weaponDesc:
        era === 'era5'
          ? '強化混凝土八角砲座 · M1 240mm「黑龍」配發增程火箭助推高爆彈 (RAP)，跨海峽極遠程砲擊壓制敵艦與登陸陣地'
          : '美國陸軍最大口徑固定式重砲 M1 240mm「黑龍 (Black Dragon)」· 發射 163kg 重型高爆彈與穿甲彈 · 遠程封鎖航道與重創敵主力艦',
      pos: { x: center.x + 210, y: center.y - 210 },
      angle: -Math.PI / 4,
      health: 2600,
      armor: 0.55,
      damage: era === 'era5' ? 1050 : era === 'era4' ? 920 : era === 'era3' ? 850 : era === 'era2' ? 780 : 640,
      blastRadius: 52,
      range: era === 'era5' ? 3800 : era === 'era4' ? 3600 : era === 'era3' ? 3400 : era === 'era2' ? 3200 : 2800,
      cooldown: 1.5,
      reloadTime: 6.2,
      side: 'player',
    }),
    makeInstallation({
      id: 'friendly-base-coastal-1',
      type: 'coastal_gun',
      name:
        era === 'era1'
          ? '友軍岸防重砲連 (155mm M1918 GPF 岸防加農砲)'
          : era === 'era4' || era === 'era5'
          ? '友軍岸防自動化要塞砲連 (203mm/55 雙聯岸防重砲)'
          : '友軍岸防要塞重砲連 (155mm M1 Long Tom 岸防加農砲)',
      weaponDesc: '長程重型岸防砲 · 封鎖港灣水道阻截敵艦突襲',
      pos: { x: center.x + 320, y: center.y - 140 },
      angle: -Math.PI / 5,
      health: 2000,
      armor: 0.48,
      damage: era === 'era5' ? 520 : era === 'era4' ? 460 : era === 'era3' ? 400 : 340,
      blastRadius: 36,
      range: era === 'era5' ? 2600 : era === 'era4' ? 2400 : era === 'era3' ? 2200 : 1900,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'player',
    }),
    makeInstallation({
      id: 'friendly-base-artillery-1',
      type: 'towed_artillery',
      name:
        era === 'era4' || era === 'era5'
          ? '友軍野戰重型砲兵連 (M198 / M114 155mm 榴彈砲)'
          : '友軍野戰重型砲兵連 (105mm M2A1 野戰榴彈砲)',
      weaponDesc: '陸戰隊砲兵陣地 · 提供全島灘頭反登陸與近海火力掩護',
      pos: { x: center.x - 40, y: center.y - 150 },
      angle: -Math.PI / 3,
      health: 1400,
      armor: 0.35,
      damage: era === 'era5' ? 320 : era === 'era4' ? 280 : era === 'era3' ? 240 : 190,
      blastRadius: 30,
      range: era === 'era5' ? 2100 : era === 'era4' ? 1900 : 1600,
      cooldown: 0.8,
      reloadTime: 2.8,
      side: 'player',
    }),
    // Friendly Battalion CP (前進營作戰指揮所 - 呼叫支援選單)
    makeInstallation({
      id: 'friendly-base-cp',
      type: 'battalion_cp',
      name: era === 'era4'
        ? '美軍陸戰遠征旅前進作戰指揮所 (MEB Battalion CP)'
        : era === 'era3'
        ? '第1陸戰師前進作戰指揮所 (1st MarDiv Battalion CP)'
        : era === 'era2'
        ? '第6陸戰師前進作戰指揮所 (6th MarDiv Battalion CP)'
        : '第1陸戰師前進營作戰指揮所 (1st Marine Raider Battalion CP)',
      weaponDesc: '前線作戰指揮中樞 · 點擊呼叫支援選單徵召重裝地面支援部隊與戰術物資',
      pos: { x: center.x - 60, y: center.y + 40 },
      health: 4000,
      armor: 0.65,
      range: 800,
      reloadTime: 1.5,
      side: 'player',
    }),
  ];

  return {
    id: 'friendly-base-island',
    name: 'Espiritu Santo Staging Base (友軍前線後勤與空軍基地)',
    center,
    radius: baseRadius,
    points,
    contours,
    installations,
    strongholds: [],
    isFriendlyBase: true,
    isFullyCaptured: true,
  };
}

// ══════════════════════════════════════════════════════════════
// GROUND UNITS & AMPHIBIOUS CRAFT FACTORIES
// ══════════════════════════════════════════════════════════════

export function createGroundUnit(
  id: string,
  type: GroundUnitType,
  name: string,
  side: 'player' | 'enemy',
  era: Era,
  pos: Vector2D
): GroundUnit {
  const isPlayer = side === 'player';
  const { health, armor, speed, damage, reloadTime, isAmphibious = false } = GROUND_UNIT_STATS[type];

  const echelon: GroundUnit['echelon'] = BATTERY_ECHELON_TYPES.has(type) ? 'battery' : COMPANY_ECHELON_TYPES.has(type) ? 'company' : 'platoon';
  const isArtillery = ARTILLERY_UNIT_TYPES.has(type);
  const isSPG = SPG_UNIT_TYPES.has(type);
  const isMLRS = MLRS_UNIT_TYPES.has(type);
  const isNuclearTEL = NUCLEAR_TEL_UNIT_TYPES.has(type);

  // Historical engagement range on the shared cross-arm scale (see rangeScale.ts)
  const range = getGroundUnitRange(type);

  return {
    id,
    type,
    name,
    side,
    era,
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    heading: isPlayer ? -Math.PI / 4 : (Math.PI * 3) / 4,
    speed: 0,
    maxSpeed: speed,
    health,
    maxHealth: health,
    armor,
    range,
    damage,
    cooldown: 0,
    reloadTime,
    order: { type: 'idle' },
    isAmphibious,
    isArtillery,
    artilleryMode: isArtillery ? 'direct_fire' : undefined,
    isSPG,
    isMLRS,
    isNuclearTEL,
    canBuildAirfield: type === 'usmc_engineer',
    buildCooldown: 0,
    isDestroyed: false,
    organization: 100,
    maxOrganization: 100,
    strength: 100,
    maxStrength: 100,
    isSupplied: true,
    isSurrendered: false,
    surrenderTimer: 0,
    disorganized: false,
    echelon,
  };
}

export function createLCVP(id: string, name: string, pos: Vector2D, era: Era): Ship {
  return createShip({
    id,
    name,
    codeName: 'Higgins Boat',
    type: 'lcvp',
    side: 'player',
    era,
    pos: { ...pos },
    heading: -Math.PI / 4,
    speed: 8,
    maxSpeed: 12,
    length: 36,
    width: 10,
    health: 700,
    maxHealth: 700,
    armor: 0.18,
    detectionRange: 1600,
    cargoCapacity: 2,
    embarkedUnitIds: [],
    turrets: [
      createTurret(10, -3, '.50 cal M2HB Twin (右舷防盾機槍)', 480, 0.6, 2, -Math.PI / 4, 150),
      createTurret(10, 3, '.50 cal M2HB Twin (左舷防盾機槍)', 480, 0.6, 2, -Math.PI / 4, 150),
    ],
    detailedArmaments: [
      { name: '12.7mm M2 重機關槍', count: '2挺 (單裝)', type: 'secondary', desc: '自衛與壓制灘頭步兵' },
      { name: '裝載容量', count: '2個步兵/機步排', type: 'main', desc: '希金斯艏部跳板登陸艇' },
    ],
    flakCooldown: 0,
    flakRange: 450,
  });
}

export function createLST(id: string, name: string, pos: Vector2D, era: Era): Ship {
  return createShip({
    id,
    name,
    codeName: 'Landing Ship Tank',
    type: 'lst',
    side: 'player',
    era,
    pos: { ...pos },
    heading: -Math.PI / 4,
    speed: 9,
    maxSpeed: 14,
    length: 84,
    width: 18,
    health: 1950,
    maxHealth: 1950,
    armor: 0.30,
    detectionRange: 2200,
    cargoCapacity: 4,
    embarkedUnitIds: [],
    turrets: [
      createTurret(28, 0, '40mm Bofors Twin DP (艦艏雙聯高射砲)', 850, 1.2, 2, -Math.PI / 4, 160),
      createTurret(-24, 0, '40mm Bofors Twin DP (艦艉雙聯高射砲)', 850, 1.2, 2, -Math.PI / 4, 160),
      createTurret(8, -7, '20mm Oerlikon (右舷機砲)', 580, 0.6, 1, -Math.PI / 4, 120),
      createTurret(8, 7, '20mm Oerlikon (左舷機砲)', 580, 0.6, 1, -Math.PI / 4, 120),
    ],
    detailedArmaments: [
      { name: '40mm 博福斯雙聯裝高射砲', count: '4門 (2座雙聯裝)', type: 'aa', desc: '防空與岸防壓制' },
      { name: '20mm 厄利孔高平快砲', count: '4門', type: 'aa', desc: '近迫防空' },
      { name: '車輛與裝甲裝載甲板', count: '可容納4個戰車/步兵排', type: 'main', desc: '雙開蚌式艏門' },
    ],
    flakCooldown: 0,
    flakRange: 750,
  });
}

export function createNewportLST(id: string, name: string, pos: Vector2D, era: Era): Ship {
  const isEra5 = era === 'era5';
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Newport-class Tank Landing Ship (LST-1179 紐波特級高速戰車登陸艦)',
    type: 'lst',
    side: 'player',
    era,
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 21,
    length: 105,
    width: 19,
    health: isEra5 ? 3600 : 3200,
    maxHealth: isEra5 ? 3600 : 3200,
    armor: 0.35,
    detectionRange: 3200,
    cargoCapacity: 6,
    embarkedUnitIds: [],
    hasCIWS: isEra5,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasChaffLauncher: isEra5,
    chaffCooldown: 0,
    turrets: isEra5
      ? [
          createTurret(24, 0, 'Mk 33 3-inch/50 Twin (艦艏雙聯3吋速射砲)', 1400, 1.4, 2, heading, 150),
          createTurret(-32, 0, 'Mk 15 Phalanx 20mm CIWS (艦艉方陣防空系統)', 1100, 0.25, 6, heading, 180),
        ]
      : [
          createTurret(24, 0, 'Mk 33 3-inch/50 Twin (艦艏雙聯3吋速射砲)', 1400, 1.4, 2, heading, 150),
          createTurret(-28, 0, 'Mk 33 3-inch/50 Twin (艦艉雙聯3吋速射砲)', 1400, 1.4, 2, heading, 150),
        ],
    detailedArmaments: [
      { name: '112英呎大型鋁合金艏跳板 (Twin Bow Horns)', count: '雙伸出門架', type: 'main', desc: '以 20 節高速直接向淺灘或珊瑚礁延伸搶灘登陸' },
      { name: 'Mk 33 3吋/50倍徑雙聯全自動防空高射艦砲', count: isEra5 ? '1座 雙聯裝' : '2座 雙聯裝', type: 'secondary', desc: '雷達射控速射高平兩用砲 (50發/分)' },
      ...(isEra5 ? [{ name: 'Mk 15 方陣 (Phalanx) 20mm 近迫武器系統', count: '1座 6管火神', type: 'aa' as const, desc: '防禦反艦飛彈' }] : []),
      { name: '重裝甲車輛與主戰坦克甲板', count: '可容納30輛戰車或500名陸戰隊', type: 'main', desc: '貫通式車輛甲板與艉門登陸' },
    ],
    flakCooldown: 0,
    flakRange: 950,
  });
}

export function createLSMR(id: string, name: string, pos: Vector2D, era: Era): Ship {
  return createShip({
    id,
    name,
    codeName: 'Rocket Citadel',
    type: 'lsm_r',
    side: 'player',
    era,
    pos: { ...pos },
    heading: -Math.PI / 4,
    speed: 10,
    maxSpeed: 15,
    length: 68,
    width: 15,
    health: 1750,
    maxHealth: 1750,
    armor: 0.28,
    detectionRange: 2400,
    rocketCooldown: 0,
    turrets: [
      createTurret(20, 0, '5-inch/38 Mk 30 (艦艏5吋砲)', 1100, 2.4, 1, -Math.PI / 4, 140),
      createTurret(-18, 0, '40mm Bofors Twin (艦艉防空砲)', 850, 1.2, 2, -Math.PI / 4, 160),
    ],
    detailedArmaments: [
      { name: '5吋連續自動裝填火箭發射架群', count: '85具火箭導軌', type: 'main', desc: '密集5吋火箭彈幕準備' },
      { name: '5吋38倍徑單裝高平砲', count: '1門', type: 'secondary', desc: '直接砲擊' },
      { name: '40mm 博福斯雙聯高射砲', count: '2門', type: 'aa', desc: '自衛防空' },
    ],
    flakCooldown: 0,
    flakRange: 750,
  });
}

// ══════════════════════════════════════════════════════════════
// ERA 4 SHIP FACTORIES (1965-1973 COLD WAR / VIETNAM ERA)
// ══════════════════════════════════════════════════════════════

export function createCV63(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Battle Cat (超大型現代化超音速航艦)',
    type: 'cv63',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 33,
    length: 160,
    width: 36,
    health: 7200,
    maxHealth: 7200,
    armor: 0.45,
    isFlagship: true,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 2400,
    samCooldown: 0,
    maxSAMs: 32,
    readySAMs: 32,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(-34, 15, 'Mk 10 Mod 3 Twin-Arm Terrier Launcher (右舷艦艉梗犬防空飛彈)', 2400, 3.5, 2, heading, 90),
      createTurret(-34, -15, 'Mk 10 Mod 3 Twin-Arm Terrier Launcher (左舷艦艉梗犬防空飛彈)', 2400, 3.5, 2, heading, 90),
    ],
    detailedArmaments: [
      { name: 'RIM-7 海麻雀八聯裝防空飛彈發射箱', count: '3座八聯裝 (24枚在架)', type: 'aa', desc: '全自動攔截逼近敵機與掠海反艦飛彈' },
      { name: 'C-13 蒸汽彈射器 (Steam Catapults)', count: '4部彈射器', type: 'main', desc: '支援全天候重載彈射 F-4 幽靈與 A-6 入侵者' },
      { name: 'SPS-48 3D 長程空情相列雷達', count: '5200m 探測半徑', type: 'asw', desc: '全天候掌控戰區高空與超低空態勢' },
      { name: '時代四超級艦載航空聯隊', count: '10款越戰主力戰機', type: 'main', desc: 'F-8 / F-4B / F-4J / A-4 / A-6A / A-6B野鼬 / E-1B預警 / S-2反潛 / UH-2 / C-1' },
    ],
    flakCooldown: 0,
    flakRange: 1200,
    carrierPlanes: {
      ready: { f8: 4, f4b: 4, f4j: 4, a4: 6, a6a: 6, a6b_weasel: 2, e1: 2, s2: 4, uh2: 2, c1: 2, sh2: 4, p3: 2 },
      hangar: { f8: 6, f4b: 6, f4j: 6, a4: 8, a6a: 8, a6b_weasel: 4, e1: 2, s2: 4, uh2: 2, c1: 2, sh2: 4, p3: 2 },
      maxPerType: { f8: 8, f4b: 8, f4j: 8, a4: 10, a6a: 10, a6b_weasel: 4, e1: 2, s2: 4, uh2: 2, c1: 2, sh2: 4, p3: 2 },
    },
  });
}

export function createBelknapCG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Missile Cruiser (導引飛彈巡洋艦)',
    type: 'cg',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 17,
    maxSpeed: 34,
    length: 125,
    width: 20,
    health: 4400,
    maxHealth: 4400,
    armor: 0.36,
    detectionRange: 4600,
    hasSAM: true,
    samRange: 3400,
    samCooldown: 0,
    maxSAMs: 40,
    readySAMs: 40,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 1800,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(28, 0, 'Mk 10 Mod 7 (雙臂長程防空飛彈發射架 RIM-67/Terrier)', 3400, 3.0, 2, heading, 260),
      createTurret(-28, 0, '5-inch/54 Mk 42 Rapid Gun (艦艉5吋自動速射砲)', 1450, 1.5, 1, heading, 220),
      createTurret(8, -8, '3-inch/50 Mk 34 Single (右舷高平砲)', 1150, 1.2, 1, heading, 75),
      createTurret(8, 8, '3-inch/50 Mk 34 Single (左舷高平砲)', 1150, 1.2, 1, heading, 75),
    ],
    detailedArmaments: [
      { name: 'Mk 10 雙臂發射架 (RIM-67 標準ER / 雙發雙導)', count: '40枚 飛彈庫存', type: 'aa', desc: '3400m 區域遠程自動防空防反艦飛彈傘' },
      { name: '5吋54倍徑 Mark 42 全自動高平速射艦砲', count: '1門 (每分40發速射)', type: 'main', desc: '雷達鎖定自動對海對空高射速砲火' },
      { name: 'ASROC 八聯裝反潛火箭發射箱', count: '8發 ASROC', type: 'asw', desc: '遠距火箭助推聲自導魚雷反潛打擊' },
      { name: 'SPS-40 長程對空二維搜索雷達', count: '4600m 搜索半徑', type: 'asw', desc: '引導艦隊長程飛彈截擊' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createAdamsDDG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Guided Missile Destroyer (導引飛彈驅逐艦)',
    type: 'ddg',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 35,
    length: 98,
    width: 16,
    health: 2800,
    maxHealth: 2800,
    armor: 0.26,
    detectionRange: 4200,
    hasSAM: true,
    samRange: 2700,
    samCooldown: 0,
    maxSAMs: 24,
    readySAMs: 24,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 1800,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    hasDepthCharges: true,
    depthChargeCooldown: 0,
    turrets: [
      createTurret(24, 0, '5-inch/54 Mk 42 Auto (No.51 艦艏5吋速射砲)', 1400, 1.6, 1, heading, 100),
      createTurret(-24, 0, '5-inch/54 Mk 42 Auto (No.52 艦艉5吋速射砲)', 1400, 1.6, 1, heading, 100),
      createTurret(-12, 0, 'Mk 11 Mod 0 (雙臂防空飛彈發射架 RIM-66 Tartar)', 2700, 3.2, 2, heading, 220),
      createTurret(-2, 0, 'ASROC 8-cell Launcher (舯部八聯裝反潛火箭箱)', 1800, 3.2, 1, heading, 140),
    ],
    detailedArmaments: [
      { name: 'Mk 11 單臂發射架 (RIM-66 韃靼/標準防空飛彈)', count: '24枚 飛彈庫存', type: 'aa', desc: '自動鎖定攔截超音速噴射機與飛彈' },
      { name: '5吋54倍徑 Mark 42 速射砲 (2門)', count: '2門 (艦艏與艦艉各一門)', type: 'main', desc: '全自動雙向對海砲擊與對空彈幕' },
      { name: 'ASROC 八聯裝反潛火箭發射箱', count: '8發 ASROC', type: 'asw', desc: '火箭推進反潛聲導魚雷' },
      { name: '324mm Mk 32 三聯裝反潛魚雷發射管', count: '6管 (2座三聯裝)', type: 'torpedo', desc: 'Mk 46 聲自導高速輕型反潛魚雷' },
    ],
    flakCooldown: 0,
    flakRange: 950,
  });
}

export function createForrestShermanDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Fleet Destroyer (雪曼級主力驅逐艦)',
    type: 'dd',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 34,
    length: 96,
    width: 15,
    health: 2600,
    maxHealth: 2600,
    armor: 0.25,
    detectionRange: 4000,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 1800,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    hasDepthCharges: true,
    depthChargeCooldown: 0,
    turrets: [
      createTurret(24, 0, '5-inch/54 Mk 42 Auto (No.51 艦艏5吋速射砲)', 1400, 1.6, 1, heading, 100),
      createTurret(-14, 0, '5-inch/54 Mk 42 Auto (No.52 舯後5吋速射砲)', 1400, 1.6, 1, heading, 100),
      createTurret(-24, 0, '5-inch/54 Mk 42 Auto (No.53 艦艉5吋速射砲)', 1400, 1.6, 1, heading, 100),
      createTurret(8, -7, '3-inch/50 Twin Mk 33 (右舷防空砲)', 1100, 1.2, 2, heading, 75),
      createTurret(8, 7, '3-inch/50 Twin Mk 33 (左舷防空砲)', 1100, 1.2, 2, heading, 75),
    ],
    detailedArmaments: [
      { name: '5吋54倍徑 Mark 42 全自動高平兩用速射砲 (3門)', count: '3門 (每門每分40發速射)', type: 'main', desc: '全自動快速對海射擊與對空高平防禦' },
      { name: 'ASROC 八聯裝反潛火箭發射器', count: '8發 ASROC', type: 'asw', desc: '火箭助推 Mk 46 聲自導反潛魚雷' },
      { name: '324mm Mk 32 艦側三聯裝魚雷發射管 (SVTT)', count: '6管 (2座三聯裝)', type: 'torpedo', desc: '近程聲學主被動導引魚雷' },
      { name: '3吋50倍徑 Mark 33 雙聯防空砲', count: '4門', type: 'aa', desc: '中近程防空防護' },
    ],
    flakCooldown: 0,
    flakRange: 900,
  });
}

export function createKnoxFFG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Fast ASW Frigate (諾克斯級反潛巡防艦)',
    type: 'ffg',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 27,
    length: 90,
    width: 14,
    health: 2400,
    maxHealth: 2400,
    armor: 0.24,
    detectionRange: 4400,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 1900,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(24, 0, '5-inch/54 Mk 42 Auto (艦艏5吋自動速射主砲)', 1450, 1.5, 1, heading, 110),
      createTurret(12, 0, 'ASROC 8-cell Launcher (艦艏八聯裝反潛火箭箱)', 1900, 3.5, 1, heading, 80),
      createTurret(-22, 0, 'BPDMS Sea Sparrow / Phalanx (艦艉點防禦系統)', 1600, 2.5, 1, heading, 80),
    ],
    detailedArmaments: [
      { name: '5吋54倍徑 Mark 42 全自動高平速射主砲', count: '1門 (40發/分速射)', type: 'main', desc: '雷達射控高精度艦砲' },
      { name: 'ASROC 八聯裝反潛火箭 (可混裝核深彈/聲導魚雷)', count: '8發火箭箱', type: 'asw', desc: '艦載反潛火箭，射程達1900m' },
      { name: 'Mk 32 艦側三聯裝魚雷發射管 (SVTT)', count: '4管', type: 'torpedo', desc: 'Mk 46 聲自導魚雷' },
      { name: 'SQS-26 艦首巨型低頻聲納 & SQR-18 拖曳陣列', count: '聲納綜合探測系統', type: 'asw', desc: '極強反潛搜索能力，探測水下靜音潛艦' },
    ],
    flakCooldown: 0,
    flakRange: 850,
  });
}

export function createLPHIwoJima(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Helicopter Carrier / Assault Citadel (直升機兩棲突擊母艦)',
    type: 'lph',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 15,
    maxSpeed: 23,
    length: 135,
    width: 28,
    health: 4800,
    maxHealth: 4800,
    armor: 0.32,
    detectionRange: 3800,
    isLPH: true,
    isAmphibious: true,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    cargoCapacity: 6,
    embarkedUnitIds: [],
    turrets: [
      createTurret(24, -10, '3-inch/50 Twin Mk 33 (右舷前高平砲)', 1150, 1.2, 2, heading, 80),
      createTurret(-24, -10, '3-inch/50 Twin Mk 33 (右舷後高平砲)', 1150, 1.2, 2, heading, 80),
      createTurret(24, 10, '3-inch/50 Twin Mk 33 (左舷前高平砲)', 1150, 1.2, 2, heading, 80),
      createTurret(-24, 10, '3-inch/50 Twin Mk 33 (左舷後高平砲)', 1150, 1.2, 2, heading, 80),
    ],
    detailedArmaments: [
      { name: '兩棲空中突擊直升機群', count: 'CH-46 海騎士 / UH-1 / AH-1 / SH-2海妖', type: 'main', desc: '直升機垂直包圍，機降突擊島上任意內陸地形！' },
      { name: '3吋50倍徑雙聯裝防空砲 (8門)', count: '8門 (4座雙聯裝)', type: 'aa', desc: '自衛防空火網' },
      { name: '陸戰隊空中突擊強化排裝載容量', count: '6個重裝加強排', type: 'secondary', desc: '全副武裝兩棲遠征隊 (MEU)' },
    ],
    flakCooldown: 0,
    flakRange: 850,
    carrierPlanes: {
      ready: { uh1: 6, ah1: 4, sh2: 4, ch46: 4 },
      hangar: { uh1: 8, ah1: 6, sh2: 6, ch46: 4 },
      maxPerType: { uh1: 8, ah1: 6, sh2: 6, ch46: 8 },
    },
  });
}

export function createLCM8(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Mike Boat (重型機械化登陸艇)',
    type: 'lcm8',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 10,
    maxSpeed: 15,
    length: 44,
    width: 14,
    health: 1200,
    maxHealth: 1200,
    armor: 0.24,
    detectionRange: 1800,
    cargoCapacity: 3,
    embarkedUnitIds: [],
    turrets: [
      createTurret(12, -4, '.50 cal M2HB Heavy MG (右舷機槍)', 550, 0.5, 2, heading, 150),
      createTurret(12, 4, '.50 cal M2HB Heavy MG (左舷機槍)', 550, 0.5, 2, heading, 150),
    ],
    detailedArmaments: [
      { name: '12.7mm M2HB 重機關槍', count: '2挺', type: 'secondary', desc: '灘頭自衛火力' },
      { name: '裝載能量', count: '1輛 M48A3 重戰車或 3個步兵排', type: 'main', desc: '液壓鋼製跳板，重裝搶灘' },
    ],
    flakCooldown: 0,
    flakRange: 500,
  });
}

export function createKomarMissileBoat(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 183R Komar (飛彈快艇)',
    type: 'komar_ptg',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 22,
    maxSpeed: 44,
    length: 44,
    width: 10,
    health: 800,
    maxHealth: 800,
    armor: 0.14,
    detectionRange: 3200,
    hasTorpedoes: true, // Used for missile salvo cooldown
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [
      createTurret(14, 0, '25mm 2M-3M Twin (艦艏機砲)', 850, 0.6, 2, heading, 70),
    ],
    detailedArmaments: [
      { name: 'P-15 冥河 (Styx) 反艦飛彈發射箱', count: '2枚 P-15 主動雷達導引飛彈', type: 'torpedo', desc: '重達500kg高爆聚能戰鬥部，致命貫穿主力艦！' },
      { name: '25mm 雙聯裝自動防空砲', count: '2門', type: 'aa', desc: '自衛火網' },
      { name: '44節極速掠海突防', count: '高機動快艇', type: 'main', desc: '島礁伏擊與高速扇面齊射' },
    ],
    flakCooldown: 0,
    flakRange: 600,
  });
}

export function createKashinDDG(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 61 Kashin (卡辛級全燃氣渦輪大型飛彈反潛艦)',
    type: 'kashin',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 36,
    length: 106,
    width: 16,
    health: 3400,
    maxHealth: 3400,
    armor: 0.28,
    detectionRange: 4200,
    hasSAM: true,
    samRange: 2600,
    samCooldown: 0,
    maxSAMs: 24,
    readySAMs: 24,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 14,
    turrets: [
      createTurret(28, 0, 'AK-726 76.2mm Twin Auto (艦艏雙聯裝76mm自動速射砲)', 1400, 1.2, 2, heading, 85),
      createTurret(-28, 0, 'AK-726 76.2mm Twin Auto (艦艉雙聯裝76mm自動速射砲)', 1400, 1.2, 2, heading, 85),
      createTurret(14, 0, 'SA-N-1 Volna Twin Arm SAM (前甲板波浪防空飛彈)', 2600, 3.2, 1, heading, 180),
      createTurret(-14, 0, 'SA-N-1 Volna Twin Arm SAM (後甲板波浪防空飛彈)', 2600, 3.2, 1, heading, 180),
      createTurret(36, 0, 'RBU-6000 12-tube ASW Rocket (艦艏反潛火箭深彈)', 1200, 4.0, 2, heading, 120),
    ],
    detailedArmaments: [
      { name: 'AK-726 雙聯裝76.2mm 全自動速射艦砲 (2座4門)', count: '4門 (每分90發)', type: 'main', desc: '雷達火控對海對空全自動速射砲' },
      { name: 'SA-N-1 波浪 (Volna/Goa) 雙臂中程艦空飛彈 (2座)', count: '24枚儲備', type: 'aa', desc: '半主動雷達導引攔截高空戰機' },
      { name: 'RBU-6000 12管反潛火箭發射器 (2座)', count: '24枚火箭深彈', type: 'asw', desc: '反制西太平洋美軍核/常規潛艇' },
      { name: '533mm 五聯裝重型魚雷發射管', count: '5管', type: 'torpedo', desc: '53-65 尾流導引重型魚雷' },
    ],
    flakCooldown: 0,
    flakRange: 900,
  });
}

export function createRigaFFG(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 50 Riga (里加級主力護衛艦 / 北越海軍旗艦)',
    type: 'riga',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 29,
    length: 88,
    width: 13,
    health: 2200,
    maxHealth: 2200,
    armor: 0.22,
    detectionRange: 3400,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 14,
    turrets: [
      createTurret(28, 0, '100mm/56 B-34 Single (A砲 艦艏100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(19, 0, '100mm/56 B-34 Single (B砲 背負100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(-26, 0, '100mm/56 B-34 Single (X砲 艦艉100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(-8, 0, '37mm V-11M Twin AA (舯部雙聯裝防空砲)', 950, 0.8, 2, heading, 75),
    ],
    detailedArmaments: [
      { name: '100mm 56倍徑 B-34 單管高平兩用主砲 (3門)', count: '3門 (16發/分)', type: 'main', desc: '岸轟壓制與水面砲戰主力' },
      { name: '37mm V-11M 雙聯裝自動防空砲 (2座)', count: '4門', type: 'aa', desc: '中低空自衛防空火網' },
      { name: 'RBU-2500 反潛火箭與 BMB-2 深彈發射架', count: '16枚反潛深彈', type: 'asw', desc: '近程反潛反蛙人防禦' },
      { name: '533mm 雙聯裝魚雷發射管', count: '2管', type: 'torpedo', desc: '反艦重型魚雷' },
    ],
    flakCooldown: 0,
    flakRange: 750,
  });
}

export function createOsaPTG(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 205 Osa (黃蜂級重型飛彈快艇)',
    type: 'osa',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 22,
    maxSpeed: 40,
    length: 48,
    width: 11,
    health: 1100,
    maxHealth: 1100,
    armor: 0.18,
    detectionRange: 3400,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [
      createTurret(16, 0, 'AK-230 30mm Twin Enclosed (艦艏30mm高射速機砲)', 950, 0.4, 2, heading, 75),
      createTurret(-16, 0, 'AK-230 30mm Twin Enclosed (艦艉30mm高射速機砲)', 950, 0.4, 2, heading, 75),
    ],
    detailedArmaments: [
      { name: 'P-15 冥河 (Styx) 重型反艦飛彈箱 (4座)', count: '4枚 P-15 主動雷達導引飛彈', type: 'torpedo', desc: '極具毀滅性的4聯裝齊射，可重創任何大型戰艦！' },
      { name: 'AK-230 雙聯裝30mm 全自動水冷防空砲 (2座)', count: '4門 (2000發/分)', type: 'aa', desc: '近迫火控雷達導引高速彈幕' },
      { name: 'M-503 42缸柴油機 (40節極速掠海奔襲)', count: '高突防快艇', type: 'main', desc: '狼群高速側翼穿插' },
    ],
    flakCooldown: 0,
    flakRange: 700,
  });
}

export function createFoxtrotSS(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 3;
  return createShip({
    id,
    name,
    codeName: 'Project 641 Foxtrot (狐步級長程遠洋常規攻擊潛艦)',
    type: 'foxtrot',
    subVariant: 'foxtrot',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 9,
    maxSpeed: 16,
    length: 84,
    width: 11,
    health: 1600,
    maxHealth: 1600,
    armor: 0.20,
    detectionRange: 2400,
    sonarRange: 1450,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 14,
    turrets: [],
    detailedArmaments: [
      { name: '533mm 重型魚雷發射管 (10具: 艦艏6具 + 艦艉4具)', count: '10具發射管 (備彈22枚)', type: 'torpedo', desc: '53-56 / 53-65 聲自導與尾流自導重型反艦魚雷' },
      { name: 'MG-10 聲納與極長大洋伏擊自持力', count: '遠洋作戰潛艦', type: 'asw', desc: '深度下潛伏擊，可對航母戰鬥群發動致命扇面齊射' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

/**
 * Project 877 Paltus (NATO "Kilo"): the quiet diesel-electric successor to the Foxtrot, with a
 * teardrop hull, anechoic tiles and six bow tubes. Slower than an SSN but far harder to hear.
 */
export function createKiloSS(id: string, name: string, pos: Vector2D): Ship {
  const sub = createFoxtrotSS(id, name, pos);
  sub.codeName = 'Project 877 Kilo (基洛級靜音柴電攻擊潛艦)';
  sub.subVariant = 'kilo';
  sub.era = 'era5';
  sub.maxSpeed = 17;
  sub.length = 74;
  sub.width = 12;
  sub.health = sub.maxHealth = 1900;
  sub.sonarRange = 2100;
  sub.torpedoReloadTime = 12;
  sub.detailedArmaments = [
    { name: '533mm 魚雷發射管 (艦艏6具)', count: '6具 (備彈18枚)', type: 'torpedo', desc: 'TEST-71 線導 / 53-65 尾流自導魚雷' },
    { name: '消音瓦與單軸低噪推進', count: '「黑洞」靜音柴電潛艦', type: 'asw', desc: '電池潛航時極難以被動聲納偵測' },
  ];
  return sub;
}

// ══════════════════════════════════════════════════════════════
// ERA 5 (1973-1991) COLD WAR FLEET CONSTRUCTORS
// ══════════════════════════════════════════════════════════════

export function createCVNNimitz(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Nimitz-class Supercarrier (尼米茲級核動力超級航空母艦)',
    type: 'cvn',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 31,
    length: 155,
    width: 38,
    health: 6800,
    maxHealth: 6800,
    armor: 0.45,
    isFlagship: true,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 2800,
    samCooldown: 0,
    maxSAMs: 32,
    readySAMs: 32,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(35, 16, 'Mk 29 Sea Sparrow Octuple (右舷前海麻雀)', 2800, 2.5, 1, heading, 150),
      createTurret(-45, -16, 'Mk 29 Sea Sparrow Octuple (左舷後海麻雀)', 2800, 2.5, 1, heading, 150),
      createTurret(42, -14, 'Mk 15 Phalanx 20mm Block 1 (左舷前密集陣CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(-42, 14, 'Mk 15 Phalanx 20mm Block 1 (右舷後密集陣CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(-48, 0, 'Mk 15 Phalanx 20mm Block 1 (艦艉密集陣CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(-45, 16, 'Mk 29 Sea Sparrow Octuple (右舷後海麻雀)', 2800, 2.5, 1, heading, 150),
      createTurret(42, 14, 'Mk 15 Phalanx 20mm Block 1 (右舷前密集陣)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: '尼米茲級核動力航空母艦旗艦艦隊', count: '90架艦載機編制', type: 'main', desc: 'F-14A 雄貓、F/A-18A 大黃蜂、A-6E 入侵者、S-3A 維京、E-2C 鷹眼、EA-6B 徘徊者' },
      { name: 'Mk 29 八聯裝海麻雀 (Sea Sparrow) 防空飛彈 (2座)', count: '32枚 備彈', type: 'aa', desc: '雷達射控中程防空與反飛彈攔截' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm 6管近迫武器系統 (3座)', count: '4,500發/分', type: 'aa', desc: '末端自主 Ku 頻雷達導引攔截超音速反艦飛彈' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
    carrierPlanes: {
      ready: { f14a: 10, fa18a: 8, a6e: 6, s3a: 4, e2c: 2, ea6b: 2, sh3f: 4, sh60b: 2 },
      hangar: { f14a: 14, fa18a: 14, a6e: 10, s3a: 8, e2c: 4, ea6b: 6, sh3f: 6, sh60b: 4, c2a: 4, av8b: 6 },
      maxPerType: { f14a: 14, fa18a: 14, a6e: 10, s3a: 8, e2c: 4, ea6b: 6, sh3f: 6, sh60b: 4, c2a: 4, av8b: 6 },
    },
  });
}

export function createTiconderogaCG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Ticonderoga-class Aegis Cruiser (提康德羅加級神盾飛彈巡洋艦)',
    type: 'cg_tico',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 32,
    length: 118,
    width: 18,
    health: 4400,
    maxHealth: 4400,
    armor: 0.36,
    detectionRange: 5800,
    hasAegis: true,
    aegisChannels: 8,
    hasSAM: true,
    samRange: 4200,
    samCooldown: 0,
    maxSAMs: 122,
    readySAMs: 122,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 16,
    maxHarpoons: 16,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 2200,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(32, 0, '5-inch/54 Mk 45 Lightweight (艦艏5吋輕量艦砲)', 1500, 1.8, 1, heading, 120),
      createTurret(-32, 0, '5-inch/54 Mk 45 Lightweight (艦艉5吋輕量艦砲)', 1500, 1.8, 1, heading, 120),
      createTurret(18, 0, 'Mk 41 VLS / Mk 26 SAM Launcher (前甲板標準SM-2MR)', 4200, 1.6, 1, heading, 260),
      createTurret(-18, 0, 'Mk 41 VLS / Mk 26 SAM Launcher (後甲板標準SM-2MR)', 4200, 1.6, 1, heading, 260),
      createTurret(0, -9, 'Mk 15 Phalanx 20mm Block 1 (右舷密集陣CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(0, 9, 'Mk 15 Phalanx 20mm Block 1 (左舷密集陣CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: 'AN/SPY-1A 3D 神盾相列陣列雷達 (Aegis Combat System)', count: '4面相列雷達', type: 'main', desc: '同時追蹤數百批目標，8個多通道同時指引 SM-2MR 攔截飽和超音速反艦飛彈！' },
      { name: 'RIM-66 SM-2MR 標準二型中程防空/反飛彈系統', count: '122枚 深度防空庫存', type: 'aa', desc: '半主動雷達中段指引與終端防禦，大容量連續多目標攔截' },
      { name: 'RGM-84 魚叉 (Harpoon) 四聯裝發射箱 (2座)', count: '8枚 掠海巡弋飛彈', type: 'main', desc: '主動雷達終端尋標反艦飛彈，射程 4200m' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (2座)', count: '2座 6管火神', type: 'aa', desc: '超音速飛彈末端毀滅射擊' },
      { name: '5吋54倍徑 Mk 45 輕量全自動艦砲 (2門)', count: '2門 (20發/分)', type: 'secondary', desc: '對海與防空高平打擊' },
      { name: 'ASROC 八聯裝反潛火箭發射箱', count: '8發 ASROC', type: 'asw', desc: '火箭助飛 Mk 46 反潛魚雷' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createVirginiaCGN(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Virginia-class Nuclear Guided Missile Cruiser (維吉尼亞級核動力巡洋艦)',
    type: 'cg_virginia',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 116,
    width: 17,
    health: 4200,
    maxHealth: 4200,
    armor: 0.35,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 3600,
    samCooldown: 0,
    maxSAMs: 44,
    readySAMs: 44,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 16,
    maxHarpoons: 16,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 2200,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(30, 0, '5-inch/54 Mk 45 Lightweight (艦艏5吋砲)', 1500, 1.8, 1, heading, 120),
      createTurret(-30, 0, '5-inch/54 Mk 45 Lightweight (艦艉5吋砲)', 1500, 1.8, 1, heading, 120),
      createTurret(16, 0, 'Mk 26 Twin-Arm SAM Launcher (前甲板SM-2MR)', 3600, 2.3, 1, heading, 250),
      createTurret(-16, 0, 'Mk 26 Twin-Arm SAM Launcher (後甲板SM-2MR)', 3600, 2.3, 1, heading, 250),
      createTurret(0, -8, 'Mk 15 Phalanx 20mm Block 1 (右舷CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(0, 8, 'Mk 15 Phalanx 20mm Block 1 (左舷CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: 'D2G 雙核反應爐無限自持推進', count: '無限航程 33節極速', type: 'main', desc: '護航航母全速伴隨作戰' },
      { name: 'RIM-66 SM-2MR 標準二型防空飛彈 (2座雙臂發射架)', count: '68枚備彈', type: 'aa', desc: '中遠程區域防空' },
      { name: 'RGM-84 魚叉 (Harpoon) 四聯裝發射箱 (2座)', count: '8枚 反艦飛彈', type: 'main', desc: '遠程掠海打擊' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm 近迫武器系統 (2座)', count: '2座 CIWS', type: 'aa', desc: '末端近迫防空' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createIowaModernizedBB(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Iowa-class Modernized Battleship (愛荷華級近代化改裝戰艦 BB-61)',
    type: 'bb_iowa_mod',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 17,
    maxSpeed: 33,
    length: 150,
    width: 32,
    health: 7200,
    maxHealth: 7200,
    armor: 0.76, // Massive 12.1-inch belt + 6-inch deck!
    detectionRange: 5000,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    ciwsMounts: 4,
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 16,
    maxHarpoons: 16,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    rocketCooldown: 0,
    turrets: [
      createTurret(42, 0, '16-inch/50 Mk 7 Triple (No.1 艦艏三聯裝406mm主砲)', 2400, 5.0, 3, heading, 820),
      createTurret(24, 0, '16-inch/50 Mk 7 Triple (No.2 背負三聯裝406mm主砲)', 2400, 5.0, 3, heading, 820),
      createTurret(-36, 0, '16-inch/50 Mk 7 Triple (No.3 艦艉三聯裝406mm主砲)', 2400, 5.0, 3, heading, 820),
      createTurret(18, -14, 'Mk 15 Phalanx CIWS (右前密集陣)', 1100, 0.25, 6, heading, 80),
      createTurret(-18, -14, 'Mk 15 Phalanx CIWS (右後密集陣)', 1100, 0.25, 6, heading, 80),
      createTurret(18, 14, 'Mk 15 Phalanx CIWS (左前密集陣)', 1100, 0.25, 6, heading, 80),
      createTurret(-18, 14, 'Mk 15 Phalanx CIWS (左後密集陣)', 1100, 0.25, 6, heading, 80),
      createTurret(12, 12, '5-inch/38 Mk 28 Twin DP (右舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
      createTurret(12, -12, '5-inch/38 Mk 28 Twin DP (左舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
      createTurret(2, 12, '5-inch/38 Mk 28 Twin DP (右舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
      createTurret(2, -12, '5-inch/38 Mk 28 Twin DP (左舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
      createTurret(-8, 12, '5-inch/38 Mk 28 Twin DP (右舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
      createTurret(-8, -12, '5-inch/38 Mk 28 Twin DP (左舷5吋/38雙聯高平砲)', 1250, 2.0, 2, heading, 90),
    ],
    detailedArmaments: [
      { name: '16吋50倍徑 Mark 7 三聯裝巨型艦砲 (3座9門)', count: '9門 (2,700磅穿甲巨彈)', type: 'main', desc: '現代化射控電腦指引，岸轟直接夷平要塞與重創主力艦！' },
      { name: 'RGM-84 魚叉 (Harpoon) 四聯裝發射箱 (4座)', count: '16枚 掠海巡弋飛彈', type: 'main', desc: '16枚重型反艦巡弋飛彈狂暴齊射' },
      { name: '裝甲箱型戰斧發射箱 (ABL BGM-109 Tomahawk)', count: '8組四聯裝 (32枚)', type: 'main', desc: '長程精確陸攻與反艦巡弋打擊' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (4座)', count: '4座 密集陣', type: 'aa', desc: '四個象限全方位攔截來襲反艦飛彈' },
      { name: '5吋38倍徑雙聯裝高平兩用砲 (6座12門)', count: '12門', type: 'secondary', desc: '中近程防空與對海速射' },
    ],
    flakCooldown: 0,
    flakRange: 1200,
  });
}

export function createSpruanceDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Spruance-class ASW Destroyer (史普魯恩斯級大型反潛驅逐艦)',
    type: 'dd_spruance',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 110,
    width: 16,
    health: 3600,
    maxHealth: 3600,
    armor: 0.28,
    detectionRange: 5000,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 16,
    maxHarpoons: 16,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 2200,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(28, 0, '5-inch/54 Mk 45 Lightweight (艦艏5吋自動砲)', 1500, 1.8, 1, heading, 120),
      createTurret(-28, 0, '5-inch/54 Mk 45 Lightweight (艦艉5吋自動砲)', 1500, 1.8, 1, heading, 120),
      createTurret(14, 0, 'ASROC 8-cell Launcher (艦艏八聯裝反潛火箭箱)', 2200, 3.2, 1, heading, 100),
      createTurret(-14, 0, 'Mk 29 Sea Sparrow 8-cell (艦艉海麻雀防空飛彈)', 2800, 2.5, 1, heading, 120),
      createTurret(0, -7, 'Mk 15 Phalanx 20mm Block 1 (右舷CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(0, 7, 'Mk 15 Phalanx 20mm Block 1 (左舷CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: 'AN/SQS-53 艦艏巨大低頻主被動聲納與拖曳陣列', count: '極致反潛探測', type: 'asw', desc: '鎖定深海靜音蘇聯核潛艇' },
      { name: 'ASROC 八聯裝反潛火箭發射箱', count: '8發 ASROC (備彈24枚)', type: 'asw', desc: '火箭助推 Mk 46 反潛魚雷' },
      { name: 'RGM-84 魚叉 (Harpoon) 四聯裝發射箱 (2座)', count: '8枚 反艦飛彈', type: 'main', desc: '掠海突防反艦巡弋' },
      { name: 'Mk 29 八聯裝海麻雀 (Sea Sparrow) 防空飛彈', count: '8發 點防禦飛彈', type: 'aa', desc: '防空與攔截反艦飛彈' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (2座)', count: '2座 CIWS', type: 'aa', desc: '末端近迫防空' },
      { name: '5吋54倍徑 Mk 45 艦砲 (2門)', count: '2門 (20發/分)', type: 'secondary', desc: '自動射控火砲' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createKiddDDG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Kidd-class Guided Missile Destroyer (紀德級飛彈驅逐艦)',
    type: 'ddg_kidd',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 112,
    width: 16,
    health: 3800,
    maxHealth: 3800,
    armor: 0.30,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 3600,
    samCooldown: 0,
    maxSAMs: 48,
    readySAMs: 48,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 16,
    maxHarpoons: 16,
    hasASROC: true,
    asrocCooldown: 0,
    asrocRange: 2200,
    maxASROC: 8,
    readyASROC: 8,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(28, 0, '5-inch/54 Mk 45 Lightweight (艦艏5吋砲)', 1500, 1.8, 1, heading, 120),
      createTurret(-28, 0, '5-inch/54 Mk 45 Lightweight (艦艉5吋砲)', 1500, 1.8, 1, heading, 120),
      createTurret(14, 0, 'Mk 26 Mod 0 Twin-Arm SAM Launcher (前甲板SM-2MR)', 3600, 2.3, 1, heading, 250),
      createTurret(-14, 0, 'Mk 26 Mod 1 Twin-Arm SAM Launcher (後甲板SM-2MR)', 3600, 2.3, 1, heading, 250),
      createTurret(0, -7, 'Mk 15 Phalanx 20mm Block 1 (右舷CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(0, 7, 'Mk 15 Phalanx 20mm Block 1 (左舷CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: 'SPS-48E 3D 長程對空警戒雷達', count: '強大艦隊防空指管', type: 'aa', desc: '引導標準二型攔截高低空進犯敵機與飛彈' },
      { name: 'RIM-66 SM-2MR 標準二型防空飛彈 (2座雙臂發射架)', count: '68枚備彈 (48備射)', type: 'aa', desc: '中遠程艦隊區域防空' },
      { name: 'RGM-84 魚叉 (Harpoon) 四聯裝發射箱 (2座)', count: '8枚 掠海反艦飛彈', type: 'main', desc: '4200m 反艦打擊' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (2座)', count: '2座 CIWS', type: 'aa', desc: '近迫防空' },
      { name: '5吋54倍徑 Mk 45 輕量艦砲 (2門)', count: '2門', type: 'secondary', desc: '火砲射控' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createPerryFFG(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Oliver Hazard Perry-class Frigate (派里級巡防艦 FFG-7)',
    type: 'ffg_ohp',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 29,
    length: 95,
    width: 14,
    health: 2600,
    maxHealth: 2600,
    armor: 0.25,
    detectionRange: 4600,
    hasSAM: true,
    samRange: 3200,
    samCooldown: 0,
    maxSAMs: 36,
    readySAMs: 36,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 6,
    maxHarpoons: 6,
    hasSVTT: true,
    svttCooldown: 0,
    hasChaffLauncher: true,
    chaffCooldown: 0,
    turrets: [
      createTurret(24, 0, 'Mk 13 Mod 4 Single-Arm Launcher (艦艏單臂標準SM-1MR/魚叉)', 3200, 2.4, 1, heading, 220),
      createTurret(0, 0, 'OTO Melara 76mm/62 Compact (舯部76mm自動快砲)', 1350, 1.2, 1, heading, 100),
      createTurret(-24, 0, 'Mk 15 Phalanx 20mm Block 1 (機庫頂端密集陣CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: 'Mk 13 Mod 4 單臂旋轉發射架', count: '42枚彈艙 (36x SM-1MR + 6x 單發魚叉)', type: 'aa', desc: '單臂快速裝填，每次單發射出 1 枚魚叉反艦飛彈或標準防空飛彈' },
      { name: 'OTO Melara 76mm 62倍徑超射速艦砲', count: '1門 (85發/分)', type: 'secondary', desc: '雷達高精度防空與近距對海壓制' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (1座)', count: '1座 6管火神', type: 'aa', desc: '後向近迫防空' },
      { name: 'LAMPS III 雙機庫 (SH-60B 海鷹反潛直升機)', count: '2架海鷹載機', type: 'asw', desc: '遠距反潛與超視距目標指示' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createLosAngelesSSN(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Los Angeles-class Nuclear Attack Submarine (洛杉磯級核動力攻擊潛艦 SSN-688)',
    type: 'ssn_la',
    subVariant: 'ssn_la',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 32,
    length: 98,
    width: 12,
    health: 2800,
    maxHealth: 2800,
    armor: 0.26,
    detectionRange: 4200,
    sonarRange: 2400,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    hasHarpoon: true,
    harpoonCooldown: 0,
    readyHarpoons: 6,
    maxHarpoons: 6,
    turrets: [],
    detailedArmaments: [
      { name: '533mm 重型魚雷管 (4具) 配備 Mk 48 ADCAP 線導重型魚雷', count: '26枚 Mk 48 ADCAP', type: 'torpedo', desc: '線導主被動終端尋標，55節極速毀滅敵水面艦艇與潛艇！' },
      { name: 'UGM-84 潛射魚叉 (Sub-Harpoon) 膠囊封裝反艦飛彈', count: '6枚 潛射魚叉', type: 'main', desc: '水下出管破浪起飛掠海突襲' },
      { name: 'BQQ-5 / BSY-1 綜合聲納探測系統與水下消音瓦', count: '極致水下靜音', type: 'asw', desc: '深海大洋獵殺蘇聯核巡航飛彈潛艇' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

export function createAustinLPD(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Austin-class Amphibious Transport Dock (奧斯汀級兩棲船塢運輸艦 LPD-4)',
    type: 'lpd',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 14,
    maxSpeed: 21,
    length: 124,
    width: 25,
    health: 4400,
    maxHealth: 4400,
    armor: 0.30,
    detectionRange: 3800,
    isAmphibious: true,
    isLPH: true,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1100,
    ciwsType: 'phalanx',
    hasChaffLauncher: true,
    chaffCooldown: 0,
    cargoCapacity: 8,
    embarkedUnitIds: [],
    turrets: [
      createTurret(24, 0, '3-inch/50 Mk 33 Twin (艦艏雙聯裝防空砲)', 1100, 1.4, 2, heading, 75),
      createTurret(-24, 0, 'Mk 15 Phalanx 20mm Block 1 (艦艉密集陣CIWS)', 1100, 0.25, 6, heading, 80),
      createTurret(0, -9, 'Mk 15 Phalanx 20mm Block 1 (右舷密集陣CIWS)', 1100, 0.25, 6, heading, 80),
    ],
    detailedArmaments: [
      { name: '內部泛水塢艙 (Well Deck)', count: '可裝載1艘LCAC氣墊登陸艇或多輛AAV-7A1', type: 'main', desc: '海上注水卸載裝甲部隊高速搶灘' },
      { name: '直升機飛行甲板', count: '支援 CH-53 / CH-46 / AH-1W', type: 'main', desc: '立體垂直機降突擊' },
      { name: 'Mk 15 方陣 (Phalanx) 20mm CIWS (2座)', count: '2座 CIWS', type: 'aa', desc: '近迫防空' },
      { name: '重裝陸戰遠征隊強化連裝載能量', count: '8個裝甲/步兵排', type: 'secondary', desc: '全副武裝搶灘部隊' },
    ],
    flakCooldown: 0,
    flakRange: 1100,
  });
}

export function createLCAC(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Landing Craft Air Cushion (LCAC 氣墊登陸艇)',
    type: 'lcac',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 25,
    maxSpeed: 45, // 45kt high-speed hovercraft!
    length: 48,
    width: 22,
    health: 1400,
    maxHealth: 1400,
    armor: 0.22,
    detectionRange: 2200,
    isAmphibious: true, // Can traverse both water and overland beach terrain!
    cargoCapacity: 4,
    embarkedUnitIds: [],
    turrets: [
      createTurret(14, -6, '.50 cal M2HB Heavy MG (右舷防盾機槍)', 550, 0.5, 2, heading, 150),
      createTurret(14, 6, 'Mk 19 40mm Auto Grenade Launcher (左舷自動榴彈發射器)', 650, 0.8, 1, heading, 180),
    ],
    detailedArmaments: [
      { name: '全氣墊推進裙板與高速燃氣渦輪', count: '45節高速掠水登陸', type: 'main', desc: '跨越70%世界海岸線，直接衝上海灘與內陸開闊地卸載！' },
      { name: '載重能量 (60公噸)', count: '1輛 M1IP 艾布蘭主戰戰車 或 2輛 AAV-7A1 / LAV-25', type: 'main', desc: '極速投送重裝甲部隊' },
      { name: '12.7mm M2HB 機槍 + 40mm Mk 19 榴彈砲', count: '2座武器站', type: 'secondary', desc: '灘頭自衛火力' },
    ],
    flakCooldown: 0,
    flakRange: 550,
  });
}

// ══════════════════════════════════════════════════════════════
// ERA 5 OPFOR SOVIET RED BANNER FLEET CONSTRUCTORS
// ══════════════════════════════════════════════════════════════

export function createKievCVHG(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 1143 Kiev (基輔級重型航空巡洋艦)',
    type: 'cvhg_kiev',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 32,
    length: 142,
    width: 32,
    health: 6400,
    maxHealth: 6400,
    armor: 0.42,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 3400,
    samCooldown: 0,
    maxSAMs: 48,
    readySAMs: 48,
    hasGranit: true,
    granitCooldown: 0,
    readyGranit: 12,
    maxGranit: 12,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    ciwsType: 'ak630',
    turrets: [
      createTurret(24, 0, 'AK-726 76.2mm Twin Auto (艦艏雙聯自動快砲)', 1400, 1.2, 2, heading, 85),
      createTurret(12, 0, 'SA-N-3 Shtorm Twin SAM (前甲板風暴防空飛彈)', 3400, 2.5, 1, heading, 220),
      createTurret(-32, 0, 'SA-N-3 Shtorm Twin SAM (艦艉風暴防空飛彈)', 3400, 2.5, 1, heading, 220),
      createTurret(18, -10, 'AK-630 30mm 6-barrel CIWS (右前AK-630)', 1000, 0.22, 6, heading, 75),
      createTurret(-18, -10, 'AK-630 30mm 6-barrel CIWS (右後AK-630)', 1000, 0.22, 6, heading, 75),
      createTurret(18, 10, 'AK-630 30mm 6-barrel CIWS (左前AK-630)', 1000, 0.22, 6, heading, 75),
      createTurret(-18, 10, 'AK-630 30mm 6-barrel CIWS (左後AK-630)', 1000, 0.22, 6, heading, 75),
      createTurret(40, -4, 'P-500 Bazalt Twin Launcher (左舷艦艏玄武岩反艦飛彈)', 4600, 4.0, 2, heading, 420),
      createTurret(40, 4, 'P-500 Bazalt Twin Launcher (右舷艦艏玄武岩反艦飛彈)', 4600, 4.0, 2, heading, 420),
      createTurret(34, -4, 'P-500 Bazalt Twin Launcher (左舷艦艏玄武岩反艦飛彈)', 4600, 4.0, 2, heading, 420),
      createTurret(34, 4, 'P-500 Bazalt Twin Launcher (右舷艦艏玄武岩反艦飛彈)', 4600, 4.0, 2, heading, 420),
      createTurret(-40, 0, 'AK-726 76.2mm Twin Auto (艦艉76mm雙聯速射砲)', 1400, 1.2, 2, heading, 85),
      createTurret(6, 10, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(6, -10, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-6, 10, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-6, -10, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
    ],
    detailedArmaments: [
      { name: '斜角飛行甲板與航空聯隊', count: 'Yak-38 鐵匠垂直起降戰鬥機 + Ka-27 螺旋反潛直升機', type: 'main', desc: '提供紅海軍特遣艦隊近距空中攔截與反潛屏障' },
      { name: 'P-500 玄武岩 (Bazalt) 雙聯裝超音速反艦飛彈 (4座+備彈)', count: '每次齊射 12 枚', type: 'main', desc: '2.5馬赫領彈高空資料鏈引導突防反艦飛彈' },
      { name: 'SA-N-3 風暴 (Shtorm) 雙臂防空飛彈 (2座)', count: '72枚 儲備', type: 'aa', desc: '中程艦空防衛' },
      { name: 'AK-630 六管30mm 全自動近迫武器系統 (8座)', count: '8座 (5000發/分)', type: 'aa', desc: '雷達火控極密彈幕攔截來襲飛彈' },
    ],
    flakCooldown: 0,
    flakRange: 1000,
    carrierPlanes: {
      ready: { yak38: 6, ka27: 6 },
      hangar: { yak38: 8, ka27: 8 },
      maxPerType: { yak38: 8, ka27: 8 },
    },
  });
}

export function createKirovCGN(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 1144 Kirov (基洛夫級重型核動力飛彈巡洋艦 / 戰鬥巡洋艦)',
    type: 'cgn_kirov',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 32,
    length: 145,
    width: 28,
    health: 7600, // Massive Soviet capital ship
    maxHealth: 7600,
    armor: 0.52,
    detectionRange: 5800,
    hasSAM: true,
    samRange: 4200,
    samCooldown: 0,
    maxSAMs: 64,
    readySAMs: 64,
    hasGranit: true,
    granitCooldown: 0,
    readyGranit: 16,
    maxGranit: 16,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    ciwsType: 'ak630',
    turrets: [
      createTurret(38, 0, 'P-700 Granit 20-cell VLS (花崗岩超音速重型反艦飛彈井群)', 5000, 3.5, 4, heading, 850),
      createTurret(18, 0, 'S-300F Fort (SA-N-6) Vertical Revolver SAM (堡壘遠程防空飛彈)', 4200, 2.0, 1, heading, 320),
      createTurret(24, -9, 'AK-630 30mm 6-barrel CIWS (右舷密集陣)', 1000, 0.22, 6, heading, 75),
      createTurret(-24, -9, 'AK-630 30mm 6-barrel CIWS (右舷密集陣)', 1000, 0.22, 6, heading, 75),
      createTurret(24, 9, 'AK-630 30mm 6-barrel CIWS (左舷密集陣)', 1000, 0.22, 6, heading, 75),
      createTurret(-24, 9, 'AK-630 30mm 6-barrel CIWS (左舷密集陣)', 1000, 0.22, 6, heading, 75),
      createTurret(-36, 4, 'AK-100 100mm Single Auto (右舷艦艉100mm速射砲)', 1600, 1.4, 1, heading, 180),
      createTurret(-36, -4, 'AK-100 100mm Single Auto (左舷艦艉100mm速射砲)', 1600, 1.4, 1, heading, 180),
      createTurret(8, 9, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(8, -9, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-8, 9, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-8, -9, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
    ],
    detailedArmaments: [
      { name: 'P-700 花崗岩 (Granit / SS-N-19) 傾斜垂直發射井群', count: '每次飽和齊射 16 枚 (20管備彈)', type: 'main', desc: '7噸重 2.5馬赫領彈高空資料鏈蜂群突防，重創整支航母戰鬥群！' },
      { name: 'S-300F 堡壘 (Fort / SA-N-6) 垂直轉輪發射系統', count: '96枚 長程防空飛彈', type: 'aa', desc: '蘇聯海軍神盾級遠程區域防空，反導與反機防禦' },
      { name: 'AK-130 雙聯裝 130mm 70倍徑水冷全自動砲', count: '2門 (60發/分)', type: 'secondary', desc: '對海與防空高爆密集毀滅砲火' },
      { name: 'AK-630 六管30mm 近迫武器系統 (8座)', count: '8座 CIWS', type: 'aa', desc: '全維度攔截來襲魚叉飛彈' },
      { name: 'RBU-6000 12管與 RBU-1000 6管反潛火箭群', count: '多聯裝深彈', type: 'asw', desc: '獵殺西方核潛艦' },
    ],
    flakCooldown: 0,
    flakRange: 1000,
  });
}

/**
 * Project 1164 Atlant (NATO "Slava"): sixteen P-500 Bazalt anti-ship missiles in eight twin
 * launchers lining the forecastle, eight S-300F revolver launchers aft, twin AK-130 forward.
 */
export function createSlavaCG(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 1164 Atlant (斯拉瓦級飛彈巡洋艦)',
    type: 'cg_slava',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 32,
    length: 118,
    width: 22,
    health: 5600,
    maxHealth: 5600,
    armor: 0.4,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 4000,
    samCooldown: 0,
    maxSAMs: 64,
    readySAMs: 64,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    ciwsType: 'ak630',
    turrets: [
      createTurret(44, 0, 'AK-130 130mm Twin (艦艏雙聯裝 130mm)', 1800, 1.5, 2, heading, 220),
      createTurret(-30, 0, 'S-300F Fort (SA-N-6) Revolver SAM (艦艉轉輪垂發)', 4000, 2.0, 1, heading, 320),
      createTurret(-14, 9, 'AK-630 30mm 6-barrel CIWS (右舷)', 1000, 0.22, 6, heading, 75),
      createTurret(-14, -9, 'AK-630 30mm 6-barrel CIWS (左舷)', 1000, 0.22, 6, heading, 75),
      createTurret(6, 9, 'AK-630 30mm 6-barrel CIWS (右舷)', 1000, 0.22, 6, heading, 75),
      createTurret(6, -9, 'AK-630 30mm 6-barrel CIWS (左舷)', 1000, 0.22, 6, heading, 75),
    ],
    detailedArmaments: [
      { name: 'P-500 玄武岩 (Bazalt / SS-N-12) 雙聯裝發射筒', count: '16枚 (8座雙聯裝，沿艦艏兩舷排列)', type: 'main', desc: '斯拉瓦級最醒目的特徵：一次齊射 16 枚超音速反艦飛彈' },
      { name: 'S-300F 堡壘 (SA-N-6) 轉輪垂直發射器', count: '64枚 (8座轉輪)', type: 'aa', desc: '遠程區域防空' },
      { name: 'AK-130 雙聯裝 130mm 艦砲', count: '2門', type: 'secondary', desc: '對海 / 防空' },
      { name: 'AK-630 30mm 近迫武器系統', count: '6座', type: 'aa', desc: '末端反飛彈' },
    ],
    flakCooldown: 0,
    flakRange: 1000,
  });
}

/**
 * USS Tarawa (LHA-1): the first big-deck amphibious assault ship, carrying AV-8B Harriers, CH-53
 * and CH-46 helicopters and a well deck for landing craft; two 5"/54 Mk 45, Sea Sparrow, Phalanx.
 */
export function createTarawaLHA(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Tarawa-class Amphibious Assault Ship',
    type: 'lha_tarawa',
    side: 'player',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 12,
    maxSpeed: 24,
    length: 140,
    width: 30,
    health: 6200,
    maxHealth: 6200,
    armor: 0.3,
    detectionRange: 3800,
    hasSAM: true,
    samRange: 2600,
    samModel: 'RIM-7 海麻雀防空飛彈',
    maxSAMs: 32,
    readySAMs: 32,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    turrets: [
      createTurret(60, 8, '5-inch/54 Mk 45 (艦艏右)', 1700, 2.0, 1, heading, 90),
      createTurret(60, -8, '5-inch/54 Mk 45 (艦艏左)', 1700, 2.0, 1, heading, 90),
      createTurret(-60, 10, 'Mk 15 Phalanx CIWS (艦艉右)', 1000, 0.15, 6, heading, 60),
      createTurret(30, 13, 'Mk 15 Phalanx CIWS (艦島前)', 1000, 0.15, 6, heading, 60),
    ],
    detailedArmaments: [
      { name: '5吋54倍徑 Mk 45 艦砲', count: '2門', type: 'secondary', desc: '登陸支援岸轟' },
      { name: 'Mk 25 海麻雀 八聯裝發射器', count: '2座', type: 'aa', desc: '點防空' },
      { name: 'Mk 15 方陣近迫武器系統', count: '2座', type: 'aa', desc: '末端反飛彈' },
      { name: '陸戰隊航空戰鬥元素 (ACE)', count: '約 35 架', type: 'main', desc: 'AV-8B 海獵鷹 / CH-53 / CH-46 / AH-1W · 塢艙可容 LCAC' },
    ],
    flakCooldown: 0,
    flakRange: 900,
    // Marine aviation combat element
    carrierPlanes: {
      ready: { av8b: 4, ch53: 2, ah1w: 2 },
      hangar: { av8b: 2, ch53: 2 },
      maxPerType: { av8b: 8, ch53: 8, ah1w: 4, sh60b: 2 },
    },
  });
}

/**
 * Patrol Boat, River (PBR) Mk II of Task Force 116 "Game Warden": a 31-foot fibreglass boat on
 * twin water-jets, a twin .50 calibre tub forward and a single .50 aft, crew of four.
 */
export function createPBR(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'River Rat',
    type: 'pbr',
    side: 'player',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 14,
    maxSpeed: 28,
    length: 22,
    width: 7,
    health: 420,
    maxHealth: 420,
    armor: 0.05,
    detectionRange: 1600,
    turrets: [
      createTurret(6, 0, '.50 cal M2 Twin (艇艏雙聯裝)', 700, 0.25, 2, heading, 28),
      createTurret(-7, 0, '.50 cal M2 (艇艉單裝)', 700, 0.25, 1, heading, 22),
    ],
    detailedArmaments: [
      { name: '.50 口徑 M2 雙聯裝機槍塔', count: '1座', type: 'main', desc: '湄公河三角洲巡邏與攔檢' },
      { name: '.50 口徑 M2 / Mk 19 榴彈機槍 / M60', count: '艇艉與舷側', type: 'secondary', desc: '近距火力' },
    ],
    flakCooldown: 0,
    flakRange: 420,
  });
}

export function createSovremennyDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 956 Sovremenny (現代級導向飛彈驅逐艦)',
    type: 'dd_sovremenny',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 115,
    width: 17,
    health: 4200,
    maxHealth: 4200,
    armor: 0.32,
    detectionRange: 5000,
    hasSAM: true,
    samRange: 3500,
    samCooldown: 0,
    maxSAMs: 44,
    readySAMs: 44,
    hasGranit: true, // Moskit supersonic AShM
    granitCooldown: 0,
    readyGranit: 8,
    maxGranit: 8,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    ciwsType: 'ak630',
    turrets: [
      createTurret(30, 0, 'AK-130 130mm Twin Auto (艦艏雙聯裝130mm自動砲)', 1600, 1.4, 2, heading, 180),
      createTurret(-30, 0, 'AK-130 130mm Twin Auto (艦艉雙聯裝130mm自動砲)', 1600, 1.4, 2, heading, 180),
      createTurret(16, 0, '9M38 Shtil (SA-N-7) Single-Arm SAM (前甲板颶風防空飛彈)', 3500, 2.2, 1, heading, 260),
      createTurret(-16, 0, '9M38 Shtil (SA-N-7) Single-Arm SAM (後甲板颶風防空飛彈)', 3500, 2.2, 1, heading, 260),
      createTurret(6, 8, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(6, -8, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-10, 8, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-10, -8, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
    ],
    detailedArmaments: [
      { name: 'P-270 白蛉 / 日炎 (Moskit / SS-N-22) 超音速反艦飛彈', count: '8枚 (2座四聯裝)', type: 'main', desc: '3馬赫低空掠海反艦飛彈，被譽為「航艦殺手」！' },
      { name: '9M38 颶風 (Shtil / SA-N-7) 單臂防空飛彈發射架 (2座)', count: '44枚 備彈', type: 'aa', desc: '中程防空與攔截反艦飛彈' },
      { name: 'AK-130 雙聯裝 130mm 全自動水冷艦砲 (2座4門)', count: '4門 (120發/分)', type: 'secondary', desc: '重型火砲對海對陸砲戰王者' },
      { name: 'AK-630 30mm 6管近迫武器系統 (4座)', count: '4座 CIWS', type: 'aa', desc: '近迫防衛' },
    ],
    flakCooldown: 0,
    flakRange: 1000,
  });
}

export function createUdaloyDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Project 1155 Udaloy (無畏級大型反潛驅逐艦)',
    type: 'dd_udaloy',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 118,
    width: 17,
    health: 4400,
    maxHealth: 4400,
    armor: 0.32,
    detectionRange: 5200,
    hasSAM: true,
    samRange: 2800,
    samCooldown: 0,
    maxSAMs: 64,
    readySAMs: 64,
    hasCIWS: true,
    ciwsCooldown: 0,
    ciwsRange: 1000,
    ciwsType: 'ak630',
    turrets: [
      createTurret(32, 0, 'AK-100 100mm Single Auto (No.1 艦艏100mm速射砲)', 1450, 1.5, 1, heading, 110),
      createTurret(22, 0, 'AK-100 100mm Single Auto (No.2 艦艏100mm速射砲)', 1450, 1.5, 1, heading, 110),
      createTurret(12, 0, '3K95 Kinzhal (SA-N-9) 8-cell VLS (匕首垂直發射防空飛彈)', 2800, 1.8, 1, heading, 180),
      createTurret(-28, 0, '3K95 Kinzhal (SA-N-9) 8-cell VLS (艦艉垂直發射防空飛彈)', 2800, 1.8, 1, heading, 180),
      createTurret(6, 8, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(6, -8, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-10, 8, 'AK-630 30mm 6-barrel CIWS (右舷近迫機砲)', 1000, 0.22, 6, heading, 75),
      createTurret(-10, -8, 'AK-630 30mm 6-barrel CIWS (左舷近迫機砲)', 1000, 0.22, 6, heading, 75),
    ],
    detailedArmaments: [
      { name: 'URPK-5 喇叭 (Rastrub-B / SS-N-14) 長程反潛/反艦飛彈', count: '8枚 (2座四聯裝)', type: 'asw', desc: '55km 長程打擊水下核潛艇與水面戰艦' },
      { name: '3K95 匕首 (Kinzhal / SA-N-9) 垂直發射模組 (8組64枚)', count: '64枚 垂直發射飛彈', type: 'aa', desc: '全方位近程快速防空與反飛彈' },
      { name: 'AK-100 100mm 單管全自動艦砲 (2門)', count: '2門 (60發/分)', type: 'secondary', desc: '高平兩用速射砲' },
      { name: 'AK-630 30mm 近迫武器系統 (4座)', count: '4座 CIWS', type: 'aa', desc: '近防火網' },
      { name: '雙機庫 (Ka-27PL 螺旋反潛直升機 2架)', count: '2架 Ka-27', type: 'asw', desc: '吊放聲納與反潛魚雷' },
    ],
    flakCooldown: 0,
    flakRange: 1000,
  });
}

export function createOscarSSGN(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 3;
  return createShip({
    id,
    name,
    codeName: 'Project 949A Oscar II (奧斯卡二級巡航導彈核潛艦)',
    type: 'ssgn_oscar',
    subVariant: 'oscar2',
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 32,
    length: 130,
    width: 20,
    health: 4800,
    maxHealth: 4800,
    armor: 0.38,
    detectionRange: 4800,
    sonarRange: 1850,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    hasGranit: true,
    granitCooldown: 0,
    readyGranit: 16,
    maxGranit: 16,
    turrets: [],
    detailedArmaments: [
      { name: 'P-700 花崗岩 (Granit) 水下傾斜發射井 (24具)', count: '每次波次齊射 16 枚花崗岩飛彈', type: 'main', desc: '水下潛射 16 枚花崗岩領彈資料鏈狼群突防，2.5馬赫重擊航母戰鬥群！' },
      { name: '650mm 超重型與 533mm 重型魚雷發射管 (6具)', count: '65-76 尾流自導魚雷 (備彈28枚)', type: 'torpedo', desc: '極度致命的重型反艦魚雷' },
      { name: '雙殼體加厚耐壓鋼與水下靜音技術', count: '水下巨獸 24,000噸排水量', type: 'asw', desc: '極強生存力與深海隱蔽性' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ERA 1–5 OPFOR SUBMARINE WOLFPACK CONSTRUCTORS
// ═══════════════════════════════════════════════════════════════════════

// Era 1 & Era 2: Kriegsmarine Monsun Gruppe Type VIIC / IXD2 U-Boat
export function createMonsunUBoatSS(id: string, name: string, pos: Vector2D, era: Era): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: era === 'era1' ? 'Monsun Gruppe Type VIIC U-Boat (德國海軍狼群 U型潛艇)' : 'Monsun Gruppe Type IXD2 U-Boat (遠洋重型 U型潛艇)',
    type: 'submarine',
    subVariant: 'uboat',
    side: 'enemy',
    era,
    pos: { ...pos },
    heading,
    speed: 7.5,
    maxSpeed: era === 'era1' ? 14 : 16,
    length: era === 'era1' ? 66 : 78,
    width: 9,
    health: era === 'era1' ? 760 : 980,
    maxHealth: era === 'era1' ? 760 : 980,
    armor: 0.14,
    detectionRange: 1900,
    sonarRange: 900,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 4,
    torpedoReloadTime: era === 'era1' ? 18 : 15,
    turrets: [],
    detailedArmaments: [
      { name: '533mm 艦艏/艦艉魚雷管 (5具)', count: 'G7a 蒸氣 / G7e 電動聲自導魚雷', type: 'torpedo', desc: '季風狼群遠洋伏擊魚雷齊射' },
      { name: 'GHG 群聽水聽器陣列', count: '被動聲學偵測', type: 'asw', desc: '水下隱蔽接敵，開火後才暫時暴露位置' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

// Era 1 & Era 2: IJN 伊號巡潛大型潛艦 (I-19 / I-168 / I-58)
export function createIjnIBoatSS(id: string, name: string, pos: Vector2D, era: Era): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: era === 'era1' ? 'IJN Type B1 伊號巡潛 (伊-19 級)' : 'IJN Type B3 伊號長程潛艦 (伊-58 級)',
    type: 'submarine',
    subVariant: 'ijn_sub',
    side: 'enemy',
    era,
    pos: { ...pos },
    heading,
    speed: 8,
    maxSpeed: 16,
    length: 84,
    width: 10,
    health: era === 'era1' ? 880 : 1120,
    maxHealth: era === 'era1' ? 880 : 1120,
    armor: 0.15,
    detectionRange: 2050,
    sonarRange: 880,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 4,
    torpedoReloadTime: 16,
    turrets: [],
    detailedArmaments: [
      { name: '533mm 九五式氧氣潛艦魚雷 (6具艦艏發射管)', count: '17~20枚 九五式魚雷', type: 'torpedo', desc: '高航速、高裝藥無航跡重型酸素魚雷' },
      { name: '九三式水中聽音機', count: '被動聽音', type: 'asw', desc: '潛伏截擊美軍航母特遣艦隊側翼' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

// Era 3: Soviet Project 613 Whiskey / Project 611 Zulu Diesel-Electric Submarines
export function createSovietWhiskeySS(
  id: string,
  name: string,
  pos: Vector2D,
  variant: 'whiskey' | 'zulu' = 'whiskey'
): Ship {
  const heading = (Math.PI * 3) / 4;
  const isZulu = variant === 'zulu';
  return createShip({
    id,
    name,
    codeName: isZulu ? 'Soviet Project 611 Zulu (Z級遠洋攻擊潛艦)' : 'Soviet Project 613 Whiskey (W級常規潛艦)',
    type: 'submarine',
    subVariant: variant,
    side: 'enemy',
    era: 'era3',
    pos: { ...pos },
    heading,
    speed: isZulu ? 9 : 8,
    maxSpeed: isZulu ? 18 : 16,
    length: isZulu ? 86 : 76,
    width: 10,
    health: isZulu ? 1350 : 1120,
    maxHealth: isZulu ? 1350 : 1120,
    armor: 0.17,
    detectionRange: 2250,
    sonarRange: 1150,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 5,
    torpedoReloadTime: isZulu ? 15 : 17,
    turrets: [],
    detailedArmaments: [
      { name: '533mm 艦艏魚雷發射管', count: isZulu ? '10具發射管 (備彈22枚)' : '6具發射管 (備彈12枚)', type: 'torpedo', desc: '蘇聯紅海軍冷戰早期狼群重型反艦魚雷' },
      { name: 'Tamir-5 / Mars-24 聲納', count: '水下聲學搜索', type: 'asw', desc: '冷戰早期海峽封鎖伏擊' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

// Era 5: Soviet Project 671RTM Victor III / Project 971 Akula Nuclear Attack Submarines
export function createSovietVictor3SSN(
  id: string,
  name: string,
  pos: Vector2D,
  variant: 'victor3' | 'akula' = 'victor3'
): Ship {
  const heading = (Math.PI * 3) / 4;
  const isAkula = variant === 'akula';
  return createShip({
    id,
    name,
    codeName: isAkula
      ? 'Project 971 Akula (阿庫拉級靜音核攻擊潛艦)'
      : 'Project 671RTM Victor III (維克托III級核攻擊潛艦)',
    type: 'foxtrot',
    subVariant: variant,
    side: 'enemy',
    era: 'era5',
    pos: { ...pos },
    heading,
    speed: isAkula ? 17 : 15,
    maxSpeed: isAkula ? 33 : 30,
    length: isAkula ? 106 : 98,
    width: 13,
    health: isAkula ? 3200 : 2750,
    maxHealth: isAkula ? 3200 : 2750,
    armor: 0.28,
    detectionRange: 4100,
    sonarRange: isAkula ? 2250 : 1900,
    isSubmerged: true,
    hasTorpedoes: true,
    torpedoCooldown: 4,
    torpedoReloadTime: isAkula ? 11 : 13,
    turrets: [],
    detailedArmaments: [
      { name: '650mm / 533mm 重型魚雷管 (8具)', count: '65-76 尾流自導魚雷 / TEST-71 線導反潛魚雷', type: 'torpedo', desc: '極度靜音之水下獵殺狼群主力，專門獵殺航空母艦與洛杉磯級核潛艦' },
      { name: 'MGK-500 鯊魚鰓複合聲納系統', count: '深海極致靜音隱蔽', type: 'asw', desc: '具備消音瓦與拖曳陣列，僅在反潛近距或開火瞬間暴露聲紋' },
    ],
    flakCooldown: 0,
    flakRange: 0,
  });
}

// 1942 Tokyo Express Fast Destroyer (陽炎級/吹雪級)
export function createTokyoExpressDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4; // Heading South-East towards player fleet
  return createShip({
    id,
    name,
    codeName: 'Tokyo Express (東京快車)',
    type: 'destroyer',
    side: 'enemy',
    era: 'era1',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 35, // 35kt high-speed dash!
    length: 68,
    width: 12,
    health: 1450,
    maxHealth: 1450,
    armor: 0.18,
    detectionRange: 2800,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    isTokyoExpress: true,
    turrets: [
      createTurret(22, 0, '127mm/50 Type 3 Twin (No.1 艦艏雙聯)', 1150, 2.4, 2, heading, 80),
      createTurret(-14, 0, '127mm/50 Type 3 Twin (No.2 背負雙聯)', 1150, 2.4, 2, heading, 80),
      createTurret(-22, 0, '127mm/50 Type 3 Twin (No.3 艦艉雙聯)', 1150, 2.4, 2, heading, 80),
    ],
    detailedArmaments: [
      { name: '127mm 雙聯裝三年式艦砲', count: '6門 (3座雙聯裝)', type: 'main', desc: '日本海軍標準主力驅逐艦火砲' },
      { name: '610mm 九三式長矛魚雷 (酸素魚雷)', count: '8管 (2座四聯裝)', type: 'torpedo', desc: '射程極長、無航跡高速致命重擊' },
      { name: '25mm 九六式高射機砲群', count: '6門', type: 'aa', desc: '防空自衛' },
    ],
    flakCooldown: 0,
    flakRange: 600,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MULTI-ERA OPFOR SURFACE ACTION GROUP (SAG) WARSHIPS
// ═══════════════════════════════════════════════════════════════════════

// Era 1 SAG Flagship: IJN Chōkai (鳥海號重巡洋艦 - 第八艦隊夜戰旗艦)
export function createChokaiCA(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Night Strike Flagship (鳥海號重巡洋艦)',
    type: 'chokai',
    side: 'enemy',
    era: 'era1',
    pos: { ...pos },
    heading,
    speed: 16,
    maxSpeed: 34,
    length: 92,
    width: 17,
    health: 2800,
    maxHealth: 2800,
    armor: 0.34,
    detectionRange: 3200,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 16,
    turrets: [
      createTurret(26, 0, '203mm Dual Type 3 (No.1 艦艏雙聯)', 1400, 4.5, 2, heading, 140),
      createTurret(17, 0, '203mm Dual Type 3 (No.2 背負雙聯)', 1400, 4.5, 2, heading, 140),
      createTurret(8, 0, '203mm Dual Type 3 (No.3 背負反向)', 1400, 4.5, 2, heading, 140),
      createTurret(-16, 0, '203mm Dual Type 3 (No.4 背負雙聯)', 1400, 4.5, 2, heading, 140),
      createTurret(-25, 0, '203mm Dual Type 3 (No.5 艦艉雙聯)', 1400, 4.5, 2, heading, 140),
    ],
    detailedArmaments: [
      { name: '203mm 雙聯裝三年式主砲', count: '10門 (5座雙聯裝)', type: 'main', desc: '高雄級強大水面夜戰穿甲齊射' },
      { name: '610mm 四聯裝九三式氧氣魚雷', count: '16管 (4座四聯裝)', type: 'torpedo', desc: '無航跡長矛魚雷，射程達1600m' },
      { name: '127mm 雙聯裝高角砲', count: '8門', type: 'secondary', desc: '高角防空火力' },
    ],
    flakCooldown: 0,
    flakRange: 700,
  });
}

// Era 1 SAG Light Cruiser: IJN Sendai (川內號輕巡洋艦 - 第三水雷戰隊旗艦)
export function createSendaiCL(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Torpedo Leader (川內號水雷戰隊旗艦)',
    type: 'cruiser',
    side: 'enemy',
    era: 'era1',
    pos: { ...pos },
    heading,
    speed: 17,
    maxSpeed: 35,
    length: 80,
    width: 13,
    health: 2200,
    maxHealth: 2200,
    armor: 0.24,
    detectionRange: 2900,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 14,
    turrets: [
      createTurret(24, 0, '140mm Single Type 3 (No.1 艦艏單裝)', 1250, 3.0, 1, heading, 100),
      createTurret(14, 0, '140mm Single Type 3 (No.2 艦艏單裝)', 1250, 3.0, 1, heading, 100),
      createTurret(-14, 0, '140mm Single Type 3 (No.3 艦艉單裝)', 1250, 3.0, 1, heading, 100),
      createTurret(-24, 0, '140mm Single Type 3 (No.4 艦艉單裝)', 1250, 3.0, 1, heading, 100),
    ],
    detailedArmaments: [
      { name: '140mm 單裝三年式主砲', count: '7門', type: 'main', desc: '高射速水雷戰隊支援砲' },
      { name: '610mm 雙聯裝九三式氧氣魚雷', count: '8管 (4座雙聯裝)', type: 'torpedo', desc: '雷擊戰前鋒' },
    ],
    flakCooldown: 0,
    flakRange: 650,
  });
}

// Era 2 SAG Battleship: IJN Kongō (金剛號高速戰艦 - 第一遊擊部隊主砲編隊)
export function createKongoBB(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Fast Battleship Titan (金剛號高速戰艦)',
    type: 'kongo',
    side: 'enemy',
    era: 'era2',
    pos: { ...pos },
    heading,
    speed: 15,
    maxSpeed: 30,
    length: 112,
    width: 24,
    health: 4800,
    maxHealth: 4800,
    armor: 0.42,
    detectionRange: 3400,
    turrets: [
      createTurret(28, 0, '356mm Twin Type 41 (No.1 艦艏雙聯)', 1750, 6.0, 2, heading, 250),
      createTurret(16, 0, '356mm Twin Type 41 (No.2 背負雙聯)', 1750, 6.0, 2, heading, 250),
      createTurret(-18, 0, '356mm Twin Type 41 (No.3 背負雙聯)', 1750, 6.0, 2, heading, 250),
      createTurret(-28, 0, '356mm Twin Type 41 (No.4 艦艉雙聯)', 1750, 6.0, 2, heading, 250),
      createTurret(6, -10, '127mm Twin Type 89 (右舷高角砲)', 1100, 2.5, 2, heading, 80),
      createTurret(-6, -10, '127mm Twin Type 89 (右舷高角砲)', 1100, 2.5, 2, heading, 80),
      createTurret(6, 10, '127mm Twin Type 89 (左舷高角砲)', 1100, 2.5, 2, heading, 80),
      createTurret(-6, 10, '127mm Twin Type 89 (左舷高角砲)', 1100, 2.5, 2, heading, 80),
    ],
    detailedArmaments: [
      { name: '356mm 45倍徑四一式雙聯主砲', count: '8門 (4座雙聯裝)', type: 'main', desc: '金剛級戰列艦致命穿甲巨砲' },
      { name: '127mm 雙聯裝八九式高角砲', count: '12門', type: 'secondary', desc: '密集中近程防空火網' },
      { name: '25mm 九六式三聯裝高射機砲', count: '100+門', type: 'aa', desc: '近迫防空屏障' },
    ],
    flakCooldown: 0,
    flakRange: 800,
  });
}

// Era 1 & Era 2 SAG AA Destroyer: IJN Akizuki (秋月級防空驅逐艦)
export function createAkizukiDD(id: string, name: string, pos: Vector2D, era: Era = 'era2'): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Flak Destroyer Screen (秋月級防空驅逐艦)',
    type: 'akizuki',
    side: 'enemy',
    era,
    pos: { ...pos },
    heading,
    speed: 17,
    maxSpeed: 33,
    length: 68,
    width: 12,
    health: 1600,
    maxHealth: 1600,
    armor: 0.20,
    detectionRange: 2900,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 14,
    turrets: [
      createTurret(24, 0, '100mm Type 98 Twin (No.1 艦艏高角砲)', 1200, 1.8, 2, heading, 85),
      createTurret(15, 0, '100mm Type 98 Twin (No.2 背負高角砲)', 1200, 1.8, 2, heading, 85),
      createTurret(-15, 0, '100mm Type 98 Twin (No.3 背負高角砲)', 1200, 1.8, 2, heading, 85),
      createTurret(-24, 0, '100mm Type 98 Twin (No.4 艦艉高角砲)', 1200, 1.8, 2, heading, 85),
    ],
    detailedArmaments: [
      { name: '100mm 65倍徑九八式雙聯高角砲', count: '8門 (4座雙聯裝)', type: 'main', desc: '極高射速長身管防空主砲' },
      { name: '610mm 四聯裝九三式氧氣魚雷', count: '4管', type: 'torpedo', desc: '長程氧氣魚雷' },
      { name: '25mm 三聯裝防空機砲群', count: '30門', type: 'aa', desc: '緊密防空圈' },
    ],
    flakCooldown: 0,
    flakRange: 820,
  });
}

// Era 3 SAG Light Cruiser: Project 68bis Sverdlov (斯維爾德洛夫級輕巡洋艦)
export function createSverdlovCL(id: string, name: string, pos: Vector2D): Ship {
  const heading = Math.PI * 0.45;
  return createShip({
    id,
    name,
    codeName: 'Soviet Artillery Cruiser (68bis型斯維爾德洛夫級輕巡洋艦)',
    type: 'sverdlov',
    side: 'enemy',
    era: 'era3',
    pos: { ...pos },
    heading,
    speed: 17,
    maxSpeed: 33,
    length: 125,
    width: 20,
    health: 4400,
    maxHealth: 4400,
    armor: 0.38,
    detectionRange: 3600,
    turrets: [
      createTurret(32, 0, '152mm Triple B-38 (No.1 艦艏三聯)', 1700, 2.2, 3, heading, 180),
      createTurret(18, 0, '152mm Triple B-38 (No.2 背負三聯)', 1700, 2.2, 3, heading, 180),
      createTurret(-18, 0, '152mm Triple B-38 (No.3 背負三聯)', 1700, 2.2, 3, heading, 180),
      createTurret(-32, 0, '152mm Triple B-38 (No.4 艦艉三聯)', 1700, 2.2, 3, heading, 180),
      createTurret(6, -9, '100mm Twin SM-5-1 (右舷副砲)', 1250, 1.6, 2, heading, 75),
      createTurret(-6, -9, '100mm Twin SM-5-1 (右舷副砲)', 1250, 1.6, 2, heading, 75),
      createTurret(6, 9, '100mm Twin SM-5-1 (左舷副砲)', 1250, 1.6, 2, heading, 75),
      createTurret(-6, 9, '100mm Twin SM-5-1 (左舷副砲)', 1250, 1.6, 2, heading, 75),
    ],
    detailedArmaments: [
      { name: '152mm 57倍徑三聯裝 B-38 主砲 (4座12門)', count: '12門 (每分7.5發)', type: 'main', desc: '雷達射控高精度火砲，穿甲爆破力極大' },
      { name: '100mm 雙聯裝 SM-5-1 高平兩用砲 (6座)', count: '12門', type: 'secondary', desc: '雷達導引防空副砲' },
      { name: '37mm V-11 雙聯裝高射機砲 (16座)', count: '32門', type: 'aa', desc: '高射速密集彈幕' },
    ],
    flakCooldown: 0,
    flakRange: 850,
  });
}

// Era 3 SAG Gun Destroyer: Project 56 Kotlin (56型科特林級艦隊驅逐艦)
export function createKotlinDD(id: string, name: string, pos: Vector2D): Ship {
  const heading = Math.PI * 0.45;
  return createShip({
    id,
    name,
    codeName: 'Fleet Destroyer (56型科特林級火砲驅逐艦)',
    type: 'destroyer',
    side: 'enemy',
    era: 'era3',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 38,
    length: 86,
    width: 14,
    health: 2200,
    maxHealth: 2200,
    armor: 0.22,
    detectionRange: 3200,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [
      createTurret(24, 0, '130mm Twin SM-2-1 (艦艏雙聯速射砲)', 1350, 1.8, 2, heading, 85),
      createTurret(-24, 0, '130mm Twin SM-2-1 (艦艉雙聯速射砲)', 1350, 1.8, 2, heading, 85),
      createTurret(10, 0, '45mm Quad SM-20-ZIF (前部45mm四聯機砲)', 950, 0.8, 4, heading, 70),
      createTurret(-10, 0, '45mm Quad SM-20-ZIF (後部45mm四聯機砲)', 950, 0.8, 4, heading, 70),
    ],
    detailedArmaments: [
      { name: '130mm 雙聯裝全封閉 SM-2-1 速射砲 (2座4門)', count: '4門 (雷達導引)', type: 'main', desc: '高射速平高兩用火砲' },
      { name: '533mm 五聯裝魚雷發射管 (2座10管)', count: '10管', type: 'torpedo', desc: '重型尾流導引魚雷' },
      { name: '45mm 四聯裝 SM-20-ZIF 自動防空砲', count: '16門 (4座四聯裝)', type: 'aa', desc: '密集防空' },
    ],
    flakCooldown: 0,
    flakRange: 780,
  });
}

// Era 4 SAG Missile Cruiser: Project 58 Kynda (58型肯達級導向飛彈巡洋艦)
export function createKyndaCG(id: string, name: string, pos: Vector2D): Ship {
  const heading = Math.PI * 0.45;
  return createShip({
    id,
    name,
    codeName: 'Guided Missile Cruiser (58型肯達級飛彈巡洋艦)',
    type: 'kynda',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 18,
    maxSpeed: 34,
    length: 115,
    width: 17,
    health: 3800,
    maxHealth: 3800,
    armor: 0.32,
    detectionRange: 4500,
    hasSAM: true,
    samRange: 2800,
    samCooldown: 0,
    maxSAMs: 24,
    readySAMs: 24,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [
      createTurret(32, 0, 'SM-70 4-cell P-35 AShM (艦艏四聯裝沙道克反艦飛彈)', 3200, 5.0, 4, heading, 160),
      createTurret(-32, 0, 'SM-70 4-cell P-35 AShM (艦艉四聯裝沙道克反艦飛彈)', 3200, 5.0, 4, heading, 160),
      createTurret(-18, 0, 'AK-726 76.2mm Twin Auto (艦艉雙聯76mm速射砲)', 1400, 1.2, 2, heading, 85),
      createTurret(18, 0, 'SA-N-1 Volna Twin Arm SAM (前甲板防空飛彈發射架)', 2800, 3.0, 1, heading, 180),
      createTurret(40, 0, 'RBU-6000 12-tube ASW Rocket (艦艏反潛火箭深彈)', 1400, 3.8, 2, heading, 120),
    ],
    detailedArmaments: [
      { name: 'SM-70 四聯裝 P-35 (SS-N-3b Shaddock) 反艦飛彈發射箱 (2座8枚)', count: '8枚超音速遠程反艦飛彈', type: 'torpedo', desc: '1000kg巨型穿甲戰鬥部，超視距重創航母！' },
      { name: 'SA-N-1 波浪 (Volna) 雙臂防空飛彈系統', count: '24枚防空飛彈', type: 'aa', desc: '長程攔截美軍戰機' },
      { name: 'AK-726 雙聯裝76.2mm 全自動速射砲', count: '4門', type: 'main', desc: '高速對海與近迫防禦' },
      { name: 'RBU-6000 12管反潛火箭', count: '24枚火箭深彈', type: 'asw', desc: '全向反潛反魚雷網' },
    ],
    flakCooldown: 0,
    flakRange: 920,
  });
}

// Era 4 SAG Light Frigate: Project 159 Petya (159型別佳級輕型反潛巡防艦)
export function createPetyaFFG(id: string, name: string, pos: Vector2D): Ship {
  const heading = Math.PI * 0.45;
  return createShip({
    id,
    name,
    codeName: 'ASW Patrol Frigate (159型別佳級反潛巡防艦)',
    type: 'petya',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 19,
    maxSpeed: 33,
    length: 82,
    width: 12,
    health: 1900,
    maxHealth: 1900,
    armor: 0.20,
    detectionRange: 3500,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [
      createTurret(22, 0, 'AK-726 76.2mm Twin Auto (艦艏雙聯裝76mm速射砲)', 1350, 1.2, 2, heading, 90),
      createTurret(-22, 0, 'AK-726 76.2mm Twin Auto (艦艉雙聯裝76mm速射砲)', 1350, 1.2, 2, heading, 90),
      createTurret(30, 0, 'RBU-2500 16-tube ASW Rocket (艦艏反潛火箭深彈)', 1200, 3.5, 2, heading, 100),
    ],
    detailedArmaments: [
      { name: 'AK-726 雙聯裝76.2mm 全自動速射砲 (2座4門)', count: '4門', type: 'main', desc: '高速速射火網' },
      { name: '400mm 五聯裝反潛魚雷發射管 (SET-40聲導魚雷)', count: '5管', type: 'torpedo', desc: '聲學主被動自導反潛' },
      { name: 'RBU-2500 16管反潛火箭深彈發射器', count: '16枚深彈', type: 'asw', desc: '近程反潛反蛙人' },
    ],
    flakCooldown: 0,
    flakRange: 750,
  });
}

// Convoy Escort Ship Reinforcement (SS, DD, CL, CA)
export function createConvoyEscortShip(
  id: string,
  type: 'ss' | 'dd' | 'cl' | 'ca',
  pos: Vector2D,
  era: Era
): Ship {
  const heading = -Math.PI / 4;
  if (era === 'era4') {
    if (type === 'dd') {
      return createAdamsDDG(id, 'USS Charles F. Adams (DDG-2)', pos);
    } else if (type === 'cl' || type === 'ca') {
      return createBelknapCG(id, 'USS Belknap (CG-26)', pos);
    } else if (type === 'ss') {
      return createShip({
        id,
        name: 'USS Sturgeon (SSN-637)',
        codeName: 'Nuclear Fast Attack (核動力攻擊潛艦)',
        type: 'submarine',
        side: 'player',
        era: 'era4',
        pos: { ...pos },
        heading,
        speed: 18,
        maxSpeed: 28,
        length: 89,
        width: 10,
        health: 2200,
        maxHealth: 2200,
        armor: 0.28,
        detectionRange: 4200,
        hasTorpedoes: true,
        torpedoCooldown: 0,
        torpedoReloadTime: 8,
        isSubmerged: true,
        turrets: [],
        detailedArmaments: [
          { name: '533mm Mk 48 聲自導線導重型魚雷', count: '4門魚雷發射管', type: 'torpedo', desc: '55節高速主被動聲自導反潛反艦魚雷' },
          { name: 'BQQ-2 綜合艦首聲納陣列', count: '4200m 偵測半徑', type: 'asw', desc: '全天候掌控水下音響目標' },
        ],
        flakCooldown: 0,
        flakRange: 0,
      });
    }
  }

  if (type === 'ss') {
    const isEra3 = era === 'era3';
    const isEra2 = era === 'era2';
    const subName = isEra3 ? 'USS Tang (SS-563)' : isEra2 ? 'USS Balao (SS-285)' : 'USS Gato (SS-212)';
    const subCode = isEra3 ? 'Fast Attack Sub' : isEra2 ? 'Balao Veteran' : 'Silent Service';
    return createShip({
      id,
      name: subName,
      codeName: subCode,
      type: 'submarine',
      side: 'player',
      era,
      pos: { ...pos },
      heading,
      speed: isEra3 ? 14 : isEra2 ? 11 : 10,
      maxSpeed: isEra3 ? 20 : 18,
      length: 65,
      width: 10,
      health: isEra3 ? 1450 : isEra2 ? 1300 : 1200,
      maxHealth: isEra3 ? 1450 : isEra2 ? 1300 : 1200,
      armor: isEra3 ? 0.22 : 0.16,
      detectionRange: isEra3 ? 2800 : 2400,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: isEra3 ? 10 : 12,
      isSubmerged: true,
      turrets: [
        createTurret(12, 0, isEra3 ? '40mm Bofors Sub Deck Gun' : '3-inch/50 Deck Gun (艦艏甲板砲)', 800, 2.2, 1, heading, 50),
      ],
      detailedArmaments: [
        { name: '533mm 艦艏魚雷發射管', count: '6管艏 + 4管艉 (10管)', type: 'torpedo', desc: isEra3 ? 'Mk 27 聲自導 / Mk 18 魚雷' : 'Mark 14 / Mark 18 魚雷齊射' },
        { name: isEra3 ? '40mm 甲板防空快砲' : '3吋50倍徑甲板砲', count: '1門', type: 'secondary', desc: '水面砲戰' },
      ],
      flakCooldown: 0,
      flakRange: 450,
    });
  } else if (type === 'dd') {
    if (era === 'era3') {
      return createShip({
        id,
        name: 'USS Gearing (DD-710)',
        codeName: 'Radar Picket Lead',
        type: 'destroyer',
        side: 'player',
        era: 'era3',
        pos: { ...pos },
        heading,
        speed: 17,
        maxSpeed: 36,
        length: 85,
        width: 15,
        health: 2100,
        maxHealth: 2100,
        armor: 0.22,
        detectionRange: 3200,
        hasTorpedoes: true,
        torpedoCooldown: 0,
        torpedoReloadTime: 12,
        hasDepthCharges: true,
        depthChargeCooldown: 0,
        hasHedgehog: true,
        hedgehogCooldown: 0,
        turrets: [
          createTurret(24, 0, '5-inch/38 Mk 38 Twin (No.51 艦艏雙聯)', 1100, 2.0, 2, heading, 80),
          createTurret(14, 0, '5-inch/38 Mk 38 Twin (No.52 背負雙聯)', 1100, 2.0, 2, heading, 80),
          createTurret(-20, 0, '5-inch/38 Mk 38 Twin (No.53 艦艉雙聯)', 1100, 2.0, 2, heading, 80),
        ],
        detailedArmaments: [
          { name: '5吋38倍徑 Mark 38 雙聯裝高平砲', count: '6門 (3座雙聯裝)', type: 'main', desc: '雷達射控速射砲' },
          { name: '3吋50倍徑 Mark 33 雙聯防空快砲', count: '6門', type: 'aa', desc: '攔截敵噴射轟炸機' },
          { name: '533mm 五聯裝魚雷發射管', count: '5管', type: 'torpedo', desc: '反艦重型魚雷' },
          { name: '刺蝟砲 (Hedgehog Mk 15 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏聲納火控刺蝟迫擊砲，接觸即爆' },
          { name: '艦艉深水炸彈發射軌', count: '雙軌滑落', type: 'asw', desc: '後方壓制深彈' },
        ],
        flakCooldown: 0,
        flakRange: 750,
      });
    } else if (era === 'era2') {
      return createShip({
        id,
        name: 'USS Johnston (DD-557)',
        codeName: 'Tin Can Titan',
        type: 'destroyer',
        side: 'player',
        era: 'era2',
        pos: { ...pos },
        heading,
        speed: 14,
        maxSpeed: 32,
        length: 68,
        width: 12,
        health: 1550,
        maxHealth: 1550,
        armor: 0.18,
        detectionRange: 2700,
        hasTorpedoes: true,
        torpedoCooldown: 0,
        torpedoReloadTime: 14,
        hasDepthCharges: true,
        depthChargeCooldown: 0,
        hasHedgehog: true,
        hedgehogCooldown: 0,
        turrets: [
          createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, heading, 75),
        ],
        detailedArmaments: [
          { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門', type: 'main', desc: '薩馬島海戰傳奇衝鋒驅逐艦' },
          { name: '40mm 博福斯雙聯高射砲', count: '4門', type: 'aa', desc: '防空彈幕' },
          { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: '水面魚雷' },
          { name: '刺蝟砲 (Hedgehog ASW 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏超前拋射刺蝟反潛迫擊砲，接觸即爆' },
          { name: '深水炸彈發射軌與K砲', count: '6座K-Gun', type: 'asw', desc: '後方反潛爆震' },
        ],
        flakCooldown: 0,
        flakRange: 680,
      });
    } else {
      return createShip({
        id,
        name: 'USS Fletcher (DD-445)',
        codeName: 'Greyhound',
        type: 'destroyer',
        side: 'player',
        era: 'era1',
        pos: { ...pos },
        heading,
        speed: 13,
        maxSpeed: 30,
        length: 66,
        width: 12,
        health: 1350,
        maxHealth: 1350,
        armor: 0.16,
        detectionRange: 2600,
        hasTorpedoes: true,
        torpedoCooldown: 0,
        torpedoReloadTime: 16,
        hasDepthCharges: true,
        depthChargeCooldown: 0,
        turrets: [
          createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, heading, 70),
        ],
        detailedArmaments: [
          { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門', type: 'main', desc: '弗萊徹級標準主力驅逐艦' },
          { name: '40mm 博福斯雙聯防空砲', count: '4門', type: 'aa', desc: '防空火網' },
          { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: 'Mark 15 水面魚雷' },
          { name: '深水炸彈發射軌與K砲', count: '6座K-Gun', type: 'asw', desc: '艦尾深水炸彈投放' },
        ],
        flakCooldown: 0,
        flakRange: 620,
      });
    }
  } else if (type === 'cl') {
    if (era === 'era3') {
      return createShip({
        id,
        name: 'USS Worcester (CL-144)',
        codeName: 'Dual Purpose Queen',
        type: 'cruiser',
        side: 'player',
        era: 'era3',
        pos: { ...pos },
        heading,
        speed: 15,
        maxSpeed: 33,
        length: 110,
        width: 19,
        health: 3200,
        maxHealth: 3200,
        armor: 0.35,
        detectionRange: 3200,
        turrets: [
          createTurret(30, 0, '6-inch/47 Mk 16 DP Auto (No.1 雙平砲)', 1400, 2.0, 2, heading, 140),
          createTurret(18, 0, '6-inch/47 Mk 16 DP Auto (No.2 背負砲)', 1400, 2.0, 2, heading, 140),
          createTurret(-18, 0, '6-inch/47 Mk 16 DP Auto (No.3 背負砲)', 1400, 2.0, 2, heading, 140),
          createTurret(-30, 0, '6-inch/47 Mk 16 DP Auto (No.4 艦艉砲)', 1400, 2.0, 2, heading, 140),
          createTurret(0, -9, '3-inch/50 Twin Auto (右舷自動防空砲)', 1050, 1.2, 2, heading, 80),
          createTurret(0, 9, '3-inch/50 Twin Auto (左舷自動防空砲)', 1050, 1.2, 2, heading, 80),
        ],
        detailedArmaments: [
          { name: '6吋47倍徑雙聯自動雙平高平兩用砲', count: '12門 (6座雙聯裝)', type: 'main', desc: '全自動高平兩用速射砲，攔截高空噴射機' },
          { name: '3吋50倍徑 Mark 33 雙聯防空快砲', count: '24門', type: 'aa', desc: '高射速雷達射控防空火網' },
        ],
        flakCooldown: 0,
        flakRange: 950,
      });
    } else if (era === 'era2') {
      return createShip({
        id,
        name: 'USS Cleveland (CL-55)',
        codeName: 'Rapid Fire Queen',
        type: 'cruiser',
        side: 'player',
        era: 'era2',
        pos: { ...pos },
        heading,
        speed: 14,
        maxSpeed: 29,
        length: 96,
        width: 18,
        health: 2800,
        maxHealth: 2800,
        armor: 0.32,
        detectionRange: 3000,
        turrets: [
          createTurret(28, 0, '6-inch/47 Triple Mk 16 (No.1 艦艏主砲)', 1320, 3.4, 3, heading, 130),
          createTurret(16, 0, '6-inch/47 Triple Mk 16 (No.2 背負主砲)', 1320, 3.4, 3, heading, 130),
          createTurret(-16, 0, '6-inch/47 Triple Mk 16 (No.3 背負主砲)', 1320, 3.4, 3, heading, 130),
          createTurret(-28, 0, '6-inch/47 Triple Mk 16 (No.4 艦艉主砲)', 1320, 3.4, 3, heading, 130),
          createTurret(3, 8, '5-inch/38 Twin DP (右舷翼砲)', 1100, 2.2, 2, heading, 75),
          createTurret(3, -8, '5-inch/38 Twin DP (左舷翼砲)', 1100, 2.2, 2, heading, 75),
          createTurret(-3, 8, '5-inch/38 Twin DP (右舷翼砲)', 1100, 2.2, 2, heading, 75),
          createTurret(-3, -8, '5-inch/38 Twin DP (左舷翼砲)', 1100, 2.2, 2, heading, 75),
        ],
        detailedArmaments: [
          { name: '6吋47倍徑三聯裝速射主砲', count: '12門 (4座三聯裝)', type: 'main', desc: '克里夫蘭級高速火力覆蓋' },
          { name: '5吋38倍徑雙聯裝高平砲', count: '12門', type: 'secondary', desc: '防空防護網' },
          { name: '40mm 博福斯四聯高射砲', count: '28門', type: 'aa', desc: '防空彈幕' },
        ],
        flakCooldown: 0,
        flakRange: 820,
      });
    } else {
      return createShip({
        id,
        name: 'USS Atlanta (CL-51)',
        codeName: 'Flak Citadel',
        type: 'cruiser',
        side: 'player',
        era: 'era1',
        pos: { ...pos },
        heading,
        speed: 13,
        maxSpeed: 28,
        length: 86,
        width: 16,
        health: 2200,
        maxHealth: 2200,
        armor: 0.28,
        detectionRange: 2900,
        hasTorpedoes: true,
        torpedoCooldown: 0,
        torpedoReloadTime: 16,
        turrets: [
          createTurret(31, 0, '5-inch/38 Mk 29 Twin DP (No.1 艦艏雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(23, 0, '5-inch/38 Mk 29 Twin DP (No.2 背負雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(15, 0, '5-inch/38 Mk 29 Twin DP (No.3 三層背負)', 1100, 2.2, 2, heading, 80),
          createTurret(-15, 0, '5-inch/38 Mk 29 Twin DP (No.4 三層背負後)', 1100, 2.2, 2, heading, 80),
          createTurret(-23, 0, '5-inch/38 Mk 29 Twin DP (No.5 背負雙聯後)', 1100, 2.2, 2, heading, 80),
          createTurret(-31, 0, '5-inch/38 Mk 29 Twin DP (No.6 艦艉雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(-7, -7, '5-inch/38 Twin (右舷翼砲)', 1050, 2.2, 2, heading, 80),
          createTurret(-7, 7, '5-inch/38 Twin (左舷翼砲)', 1050, 2.2, 2, heading, 80),
        ],
        detailedArmaments: [
          { name: '5吋38倍徑雙聯裝高平砲 (16門)', count: '16門 (8座雙聯裝)', type: 'main', desc: '全艦高仰角速射防空砲幕' },
          { name: '1.1吋 四聯裝防空機砲', count: '16門', type: 'aa', desc: '中程防空' },
          { name: '533mm 四聯裝魚雷發射管', count: '8管', type: 'torpedo', desc: '水面魚雷' },
        ],
        flakCooldown: 0,
        flakRange: 820,
      });
    }
  } else {
    // Heavy Cruiser (CA)
    if (era === 'era3') {
      return createShip({
        id,
        name: 'USS Des Moines (CA-134)',
        codeName: 'Autoloader Citadel',
        type: 'cruiser',
        side: 'player',
        era: 'era3',
        pos: { ...pos },
        heading,
        speed: 16,
        maxSpeed: 33,
        length: 120,
        width: 20,
        health: 3800,
        maxHealth: 3800,
        armor: 0.38,
        detectionRange: 3400,
        turrets: [
          createTurret(32, 0, '8-inch/55 Triple Mk 16 Auto (No.1 艦艏主砲)', 1600, 1.8, 3, heading, 240),
          createTurret(18, 0, '8-inch/55 Triple Mk 16 Auto (No.2 背負主砲)', 1600, 1.8, 3, heading, 240),
          createTurret(-28, 0, '8-inch/55 Triple Mk 16 Auto (No.3 艦艉主砲)', 1600, 1.8, 3, heading, 240),
          createTurret(6, -9, '5-inch/38 Twin (右舷副砲)', 1100, 2.2, 2, heading, 70),
          createTurret(-6, -9, '5-inch/38 Twin (右舷副砲)', 1100, 2.2, 2, heading, 70),
          createTurret(6, 9, '5-inch/38 Twin (左舷副砲)', 1100, 2.2, 2, heading, 70),
          createTurret(-6, 9, '5-inch/38 Twin (左舷副砲)', 1100, 2.2, 2, heading, 70),
          createTurret(11, 0, '5-inch/38 Twin (艦橋前中線雙聯)', 1100, 2.2, 2, heading, 70),
          createTurret(-21, 0, '5-inch/38 Twin (艦艉中線雙聯)', 1100, 2.2, 2, heading, 70),
        ],
        detailedArmaments: [
          { name: '8吋55倍徑自動裝填三聯裝主砲 (9門)', count: '9門 (每門每分鐘10發速射!)', type: 'main', desc: '全自動液壓裝填，火力密度超越以往重巡3倍！' },
          { name: '5吋38倍徑雙聯裝高平砲', count: '12門', type: 'secondary', desc: '防空與近距打擊' },
          { name: '3吋50倍徑雙聯裝高射砲', count: '24門', type: 'aa', desc: 'VT信管近炸防空' },
        ],
        flakCooldown: 0,
        flakRange: 880,
      });
    } else if (era === 'era2') {
      return createShip({
        id,
        name: 'USS Baltimore (CA-68)',
        codeName: 'Heavy Hammer',
        type: 'cruiser',
        side: 'player',
        era: 'era2',
        pos: { ...pos },
        heading,
        speed: 14,
        maxSpeed: 28,
        length: 98,
        width: 19,
        health: 3100,
        maxHealth: 3100,
        armor: 0.38,
        detectionRange: 3000,
        turrets: [
          createTurret(28, 0, '8-inch/55 Triple Mk 12 (No.1 艦艏主砲)', 1550, 4.8, 3, heading, 175),
          createTurret(16, 0, '8-inch/55 Triple Mk 12 (No.2 背負主砲)', 1550, 4.8, 3, heading, 175),
          createTurret(-26, 0, '8-inch/55 Triple Mk 12 (No.3 艦艉主砲)', 1550, 4.8, 3, heading, 175),
          createTurret(4, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, heading, 70),
          createTurret(-4, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, heading, 70),
          createTurret(4, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, heading, 70),
          createTurret(-4, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, heading, 70),
          createTurret(9, 0, '5-inch/38 Twin DP (艦橋前中線雙聯)', 1100, 2.2, 2, heading, 70),
          createTurret(-19, 0, '5-inch/38 Twin DP (艦艉中線雙聯)', 1100, 2.2, 2, heading, 70),
        ],
        detailedArmaments: [
          { name: '8吋55倍徑三聯裝 Mk 12 主砲', count: '9門 (3座三聯裝)', type: 'main', desc: '穿甲超重彈 (SHS)，強烈破甲打擊' },
          { name: '5吋38倍徑雙聯裝高平砲', count: '12門', type: 'secondary', desc: '遠程高平兩用防空' },
          { name: '40mm 博福斯四聯裝機砲', count: '48門', type: 'aa', desc: '高射速中程防空' },
        ],
        flakCooldown: 0,
        flakRange: 780,
      });
    } else {
      return createShip({
        id,
        name: 'USS San Francisco (CA-38)',
        codeName: 'Iron Cruiser',
        type: 'cruiser',
        side: 'player',
        era: 'era1',
        pos: { ...pos },
        heading,
        speed: 12,
        maxSpeed: 25,
        length: 92,
        width: 18,
        health: 2600,
        maxHealth: 2600,
        armor: 0.36,
        detectionRange: 2800,
        turrets: [
          createTurret(28, 0, '8-inch/55 Triple Mk 9 (No.1 艦艏主砲)', 1450, 5.2, 3, heading, 160),
          createTurret(15, 0, '8-inch/55 Triple Mk 9 (No.2 背負主砲)', 1450, 5.2, 3, heading, 160),
          createTurret(-25, 0, '8-inch/55 Triple Mk 9 (No.3 艦艉主砲)', 1450, 5.2, 3, heading, 160),
          createTurret(9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, heading, 65),
        ],
        detailedArmaments: [
          { name: '8吋55倍徑三聯裝主砲', count: '9門 (3座三聯裝)', type: 'main', desc: 'Mk 9 重型艦砲，穿甲彈破壞力極強' },
          { name: '5吋25倍徑防空高射砲', count: '8門', type: 'secondary', desc: '中遠程防空與副砲打擊' },
          { name: '20mm 厄利孔高平快砲群', count: '16門', type: 'aa', desc: '近程防禦火網' },
        ],
        flakCooldown: 0,
        flakRange: 680,
      });
    }
  }
}

// 友軍戰艦支援徵召 (Requisition BB)
/**
 * Casablanca-class escort carrier, the "jeep carrier" of Taffy 3 at Samar (USS Gambier Bay,
 * CVE-73, sunk 25 October 1944): one 5"/38 on the fantail, twin 40 mm Bofors, 19 knots.
 */
export function createCasablancaCVE(id: string, name: string, pos: Vector2D): Ship {
  const heading = -Math.PI / 4;
  return createShip({
    id,
    name,
    codeName: 'Jeep Carrier',
    type: 'cve',
    side: 'player',
    era: 'era2',
    pos: { ...pos },
    heading,
    speed: 12,
    maxSpeed: 19,
    length: 86,
    width: 18,
    health: 2100,
    maxHealth: 2100,
    armor: 0.12,
    detectionRange: 3000,
    turrets: [
      createTurret(-40, 0, '5-inch/38 Mk 12 Single (艦艉單裝)', 1050, 2.4, 1, heading, 65),
      createTurret(30, 7, '40mm Bofors Twin Mk 1 (艦艏左)', 700, 0.5, 2, heading, 30),
      createTurret(30, -7, '40mm Bofors Twin Mk 1 (艦艏右)', 700, 0.5, 2, heading, 30),
      createTurret(-30, 7, '40mm Bofors Twin Mk 1 (艦艉左)', 700, 0.5, 2, heading, 30),
      createTurret(-30, -7, '40mm Bofors Twin Mk 1 (艦艉右)', 700, 0.5, 2, heading, 30),
    ],
    detailedArmaments: [
      { name: '5吋38倍徑單裝高平兩用砲', count: '1門 (艦艉)', type: 'secondary', desc: '卡薩布蘭卡級唯一的大口徑火砲' },
      { name: '40mm 博福斯雙聯裝機砲', count: '16門 (8座雙聯裝)', type: 'aa', desc: '護航航艦近程防空' },
      { name: '20mm 厄利孔防空快砲', count: '20門', type: 'aa', desc: '近迫自衛火網' },
      { name: '混合航空中隊 (Composite Squadron)', count: '28架', type: 'main', desc: 'FM-2 野貓 / TBM 復仇者 · 薩馬島外海以炸彈與機槍迎擊栗田艦隊' },
    ],
    flakCooldown: 0,
    flakRange: 720,
    // VC-10 composite squadron: FM-2 Wildcats (drawn as F4F) and TBM Avengers
    carrierPlanes: {
      ready: { f4f: 6, tbf: 4 },
      hangar: { f4f: 4, tbf: 4 },
      maxPerType: { f4f: 12, tbf: 10 },
    },
  });
}

/**
 * USS New Jersey (BB-62) on her 1968-69 Vietnam gunline deployment: the only battleship in
 * commission, 16-inch guns for shore bombardment, 20 x 5"/38, all light AA removed.
 */
export function createNewJersey1968(id: string, pos: Vector2D): Ship {
  const ship = createPlayerBattleship(id, 'USS New Jersey (BB-62)', pos, 'era3');
  ship.era = 'era4';
  ship.codeName = 'Big J';
  ship.turrets = ship.turrets.filter((tr) => !/3-inch|40mm|20mm/.test(tr.caliber));
  ship.detailedArmaments = [
    { name: '16吋50倍徑三聯裝 Mark 7 巨型艦砲', count: '9門 (3座三聯裝)', type: 'main', desc: '1968-69 越南岸轟：單次部署發射近 6,000 發 16 吋砲彈' },
    { name: '5吋38倍徑雙聯裝高平兩用砲', count: '20門 (10座雙聯裝)', type: 'secondary', desc: '岸轟與防空' },
    { name: '電子作戰系統 (ULQ-6)', count: '1套', type: 'secondary', desc: '1968 年重新服役時拆除全部 40mm / 20mm 輕防空砲' },
  ];
  return ship;
}

/**
 * Project 123K (P-4) torpedo boat, the North Vietnamese boats of the Gulf of Tonkin incident
 * (2 August 1964): aluminium planing hull, two 450 mm torpedoes, twin 14.5 mm KPV, 50 knots.
 */
export function createP4TorpedoBoat(id: string, name: string, pos: Vector2D): Ship {
  const heading = (Math.PI * 3) / 4;
  return createShip({
    id,
    name,
    codeName: 'Swatow Striker',
    type: 'patrol_boat',
    side: 'enemy',
    era: 'era4',
    pos: { ...pos },
    heading,
    speed: 24,
    maxSpeed: 50,
    length: 34,
    width: 7,
    health: 480,
    maxHealth: 480,
    armor: 0.08,
    detectionRange: 2000,
    hasTorpedoes: true,
    torpedoCooldown: 0,
    torpedoReloadTime: 12,
    turrets: [createTurret(6, 0, '14.5mm Twin KPV (2M-5 機槍塔)', 650, 0.3, 2, heading, 30)],
    detailedArmaments: [
      { name: '450mm 魚雷發射槽', count: '2條', type: 'torpedo', desc: '1964 年東京灣事件對美艦馬多克斯號發動魚雷攻擊' },
      { name: '14.5mm KPV 雙聯裝重機槍', count: '2挺', type: 'aa', desc: '近程自衛' },
    ],
    flakCooldown: 0,
    flakRange: 450,
  });
}

export function createPlayerBattleship(
  id: string,
  name: string,
  pos: Vector2D,
  era: Era
): Ship {
  const heading = -Math.PI / 4;
  if (era === 'era1') {
    return createShip({
      id,
      name: name || 'USS North Carolina (BB-55)',
      codeName: 'Showboat',
      type: 'battleship',
      side: 'player',
      era: 'era1',
      pos: { ...pos },
      heading,
      speed: 13,
      maxSpeed: 28,
      length: 125,
      width: 29,
      health: 5200,
      maxHealth: 5200,
      armor: 0.48,
      detectionRange: 3100,
      turrets: [
        createTurret(36, 0, '16-inch/45 Mk 6 Triple (No.1 艦艏巨砲)', 1850, 7.5, 3, heading, 310),
        createTurret(22, 0, '16-inch/45 Mk 6 Triple (No.2 背負巨砲)', 1850, 7.5, 3, heading, 310),
        createTurret(-32, 0, '16-inch/45 Mk 6 Triple (No.3 艦艉巨砲)', 1850, 7.5, 3, heading, 310),
        createTurret(8, -11, '5-inch/38 Twin (右舷前高平砲)', 1100, 2.3, 2, heading, 70),
        createTurret(-4, -11, '5-inch/38 Twin (右舷中高平砲)', 1100, 2.3, 2, heading, 70),
        createTurret(8, 11, '5-inch/38 Twin (左舷前高平砲)', 1100, 2.3, 2, heading, 70),
        createTurret(-4, 11, '5-inch/38 Twin (左舷中高平砲)', 1100, 2.3, 2, heading, 70),
      ],
      detailedArmaments: [
        { name: '16吋45倍徑三聯裝 Mk 6 巨砲', count: '9門 (3座三聯裝)', type: 'main', desc: '北卡羅來納級主力重裝甲戰艦' },
        { name: '5吋38倍徑雙聯高平兩用砲', count: '20門 (10座雙聯裝)', type: 'secondary', desc: '雷達射控火網' },
        { name: '40mm 博福斯四聯高射砲群', count: '60門', type: 'aa', desc: '密集防空' },
      ],
      flakCooldown: 0,
      flakRange: 880,
    });
  } else if (era === 'era3') {
    return createShip({
      id,
      name: name || 'USS Missouri (BB-63 1950)',
      codeName: 'Mighty Mo Cold War',
      type: 'battleship',
      side: 'player',
      era: 'era3',
      pos: { ...pos },
      heading,
      speed: 14,
      maxSpeed: 32,
      length: 145,
      width: 22,
      health: 6200,
      maxHealth: 6200,
      armor: 0.50,
      detectionRange: 3800,
      turrets: [
        createTurret(42, 0, '16-inch/50 Triple Mk 7 (No.1 艦艏巨砲)', 2100, 7.5, 3, heading, 380),
        createTurret(26, 0, '16-inch/50 Triple Mk 7 (No.2 背負巨砲)', 2100, 7.5, 3, heading, 380),
        createTurret(-34, 0, '16-inch/50 Triple Mk 7 (No.3 艦艉巨砲)', 2100, 7.5, 3, heading, 380),
        createTurret(12, -10, '5-inch/38 Twin Mk 28 (右舷高平砲)', 1150, 2.2, 2, heading, 80),
        createTurret(-2, -10, '5-inch/38 Twin Mk 28 (右舷高平砲)', 1150, 2.2, 2, heading, 80),
        createTurret(12, 10, '5-inch/38 Twin Mk 28 (左舷高平砲)', 1150, 2.2, 2, heading, 80),
        createTurret(-2, 10, '5-inch/38 Twin Mk 28 (左舷高平砲)', 1150, 2.2, 2, heading, 80),
      ],
      detailedArmaments: [
        { name: '16吋50倍徑三聯裝 Mark 7 巨型艦砲', count: '9門 (3座三聯裝)', type: 'main', desc: '穿甲超重彈 (AP Mark 8) 與高爆岸轟彈' },
        { name: '5吋38倍徑雙聯裝高平兩用砲', count: '20門', type: 'secondary', desc: 'VT信管防空射控' },
        { name: '3吋50倍徑雙聯自動防空砲群', count: '20門', type: 'aa', desc: '韓戰改裝先進雷達防空火網' },
      ],
      flakCooldown: 0,
      flakRange: 960,
    });
  } else {
    return createShip({
      id,
      name: name || 'USS Missouri (BB-63)',
      codeName: 'Mighty Mo',
      type: 'battleship',
      side: 'player',
      era: 'era2',
      pos: { ...pos },
      heading,
      speed: 15,
      maxSpeed: 33,
      length: 136,
      width: 30,
      health: 6000,
      maxHealth: 6000,
      armor: 0.53,
      detectionRange: 3300,
      turrets: [
        createTurret(38, 0, '16-inch/50 Mk 7 Triple (No.1 艦艏巨砲)', 2000, 7.0, 3, heading, 350),
        createTurret(24, 0, '16-inch/50 Mk 7 Triple (No.2 背負巨砲)', 2000, 7.0, 3, heading, 350),
        createTurret(-34, 0, '16-inch/50 Mk 7 Triple (No.3 艦艉巨砲)', 2000, 7.0, 3, heading, 350),
        createTurret(8, -12, '5-inch/38 Twin (右舷前高平砲)', 1150, 2.2, 2, heading, 75),
        createTurret(-4, -12, '5-inch/38 Twin (右舷中高平砲)', 1150, 2.2, 2, heading, 75),
        createTurret(8, 12, '5-inch/38 Twin (左舷前高平砲)', 1150, 2.2, 2, heading, 75),
        createTurret(-4, 12, '5-inch/38 Twin (左舷中高平砲)', 1150, 2.2, 2, heading, 75),
      ],
      detailedArmaments: [
        { name: '16吋50倍徑三聯裝 Mark 7 巨型艦砲', count: '9門 (3座三聯裝)', type: 'main', desc: '衣阿華級戰艦首艦，高速重甲' },
        { name: '5吋38倍徑雙聯裝高平砲', count: '20門', type: 'secondary', desc: 'VT信管防空射控' },
        { name: '40mm 博福斯四聯裝機砲群', count: '80門', type: 'aa', desc: '刺蝟防空火網' },
      ],
      flakCooldown: 0,
      flakRange: 920,
    });
  }
}


export interface GeneratedSector {
  worldSize: number;
  islands: Island[];
  friendlyBase: Island;
  playerShips: Ship[];
  enemyShips: Ship[];
  groundUnits: GroundUnit[];
  briefing: SectorIntel;
}

const SECTOR_NAMES = [
  'Solomon Archipelago · Ironbottom Sound 1942',
  'Santa Cruz Islands Naval Operations',
  'Mariana Islands · Philippine Sea 1944',
  'Leyte Gulf Crossroads · Surigao & Samar 1944',
  'Okinawa Fortress Line · Operation Ten-Go 1945',
];

export function generateSector(sectorNumber: number, era: Era = 'era1'): GeneratedSector {
  // 放大地圖至 14,000 x 14,000，提供逼真海空作戰深遠縱深與戰術機動空間
  const worldSize = 14000;
  const islands: Island[] = [];
  const seedBase = sectorNumber * 1337 + (era === 'era2' ? 777 : 42);

  // 初始艦隊生成點 (美軍特遣艦隊於西南海域集結，以航向 045 東北朝向敵群島航進)
  const playerSpawn: Vector2D = { x: 2600, y: 11400 };

  // 分布於戰區的要塞島嶼或大陸板塊
  if (era === 'era3' || era === 'era4' || era === 'era5') {
    // ══════════════════════════════════════════════════════════
    // 時代三 (1950-1953) / 時代四 (1965-1973) / 時代五 (1973-1991): 大型大陸板塊戰線 (Continental Mainland) + 外海2小島
    // ══════════════════════════════════════════════════════════
    const mainlandName =
      era === 'era5'
        ? 'North Sea & Baltic Continental Flank (北海與波羅的海沿海平原主戰線)'
        : era === 'era4'
        ? 'Gulf of Tonkin & Coastal Delta (北部灣與沿海紅河三角洲主戰線)'
        : 'Korean Continental Mainland (韓半島大陸主戰線)';
    const continent = generateOrganicIsland(
      'island-mainland',
      mainlandName,
      { x: 9200, y: 5600 },
      4600,
      seedBase + 101,
      era
    );

    // ══════════════════════════════════════════════════════════
    // 大陸板塊多元地形系統 (Mainland Terrain: Rivers, Roads, Hills, Jungles)
    // 時代四 (1965-1973) 為熱帶雨林/叢林為主之大陸戰場，遍布河流網與戰略公路補給線
    // ══════════════════════════════════════════════════════════
    continent.isMainland = true;

    addMainlandTerrain(era, continent);

    // ══════════════════════════════════════════════════════════
    // 友軍大陸板塊防禦設施 (Allied Continental Logistics & Defense Belt)
    // 位於大陸西南後方縱深 (X: 5800-6800, Y: 7200-8500)
    // ══════════════════════════════════════════════════════════
    const alliedHqPos: Vector2D = { x: 6400, y: 7800 };
    const hqName =
      era === 'era5'
        ? '北約北方集團軍前進聯合作戰指揮中心 [NATO NORTHAG HQ]'
        : era === 'era4'
        ? '美軍 MACV 峴港前進指揮中心 [MACV Da Nang HQ]'
        : '美陸軍前線指揮中心 [Mainland Allied HQ]';
    const hqDesc =
      era === 'era5'
        ? '北約歐洲盟軍最高司令部前線地下指揮掩體 · 戰術C3I通信數據鏈與空地作戰指管樞紐'
        : era === 'era4'
        ? '美軍軍事援助越南司令部 · 前線雷達導引通信中心與戰術任務指管部'
        : '地下花崗岩加固防核指揮掩體 · 戰術通信與前線陸軍部隊整備中心';

    const afbName =
      era === 'era5'
        ? '拉姆施泰因北約戰術前進空軍基地 (Ramstein AFB / USAFE)'
        : era === 'era4'
        ? '峴港空軍基地 (Da Nang Air Base / 366th TFW)'
        : '遠東空軍大陸前進航空基地 (K-18 Suwon/Osan AFB)';
    const afbDesc =
      era === 'era5'
        ? '北約核心全天候重型戰術空軍基地 · 部署 A-10A, F-15A, F-16A, E-3A, F-111, B-52, C-130'
        : era === 'era4'
        ? '雙跑道全天候重型空軍航空基地 · 部署 F-4E, F-105, B-52, A-7, OV-10, UH-1, AH-1'
        : '雙跑道全天候後勤航空站 · USAAF 第5航空隊 F-86 軍刀機與天襲者起降基地';

    addAlliedMainlandBases(continent, alliedHqPos, hqName, hqDesc, afbName, afbDesc);

    // ══════════════════════════════════════════════════════════
    // 敵方大陸堅固要塞群 (OPFOR Continental Fortress Complex)
    // 位於大陸東北麓花崗岩山脈深處 (X: 10000-12000, Y: 2600-4200)
    // ══════════════════════════════════════════════════════════
    const enemyHqPos: Vector2D = { x: 11200, y: 3400 };
    addEnemyFortressComplex(era, continent, enemyHqPos);

    addEraSpecificEnemySites(era, continent);

    addMainlandCivilianZones(era, continent);

    islands.push(continent);

    // 2個外海戰略長條形屏障島 (具備連續山脊、長條雨林帶與雙倍雷達/岸防設施)
    const outIsl1Name = era === 'era4' ? 'Hon Me Island (昏果島戰略海防雷達前哨島)' : 'Wonsan Outer Bastion (元山外海要塞屏障島)';
    const outIsl2Name = era === 'era4' ? 'Con Co Island (白龍尾要塞飛彈陣地島)' : 'Chodo Radar Outpost (椒島雷達前哨島)';
    
    const outIsland1 = generateOrganicIsland(
      'island-wonsan',
      outIsl1Name,
      { x: 3800, y: 8600 },
      520,
      seedBase + 201,
      era
    );
    // Add continuous ridge and forest belt to outer island 1
    outIsland1.mountainRidges = [
      {
        id: 'wonsan-ridge',
        spine: [
          { x: 3600, y: 8850 },
          { x: 3800, y: 8600 },
          { x: 4000, y: 8350 },
        ],
        width: 140,
        height: 195,
        peaks: [{ pos: { x: 3800, y: 8600 }, elevation: 195, label: '昏果島頂峰雷達崖 [Hon Me Peak 195m]' }],
      },
    ];
    outIsland1.forestBelts = [
      {
        id: 'wonsan-forest',
        density: 0.90,
        biome: 'rainforest',
        points: [
          { x: 3650, y: 8900 },
          { x: 3850, y: 8700 },
          { x: 4050, y: 8400 },
          { x: 3950, y: 8300 },
          { x: 3750, y: 8550 },
          { x: 3550, y: 8800 },
        ],
      },
    ];

    const outIsland2 = generateOrganicIsland(
      'island-chodo',
      outIsl2Name,
      { x: 3200, y: 5200 },
      460,
      seedBase + 301,
      era
    );
    outIsland2.mountainRidges = [
      {
        id: 'chodo-ridge',
        spine: [
          { x: 3050, y: 5400 },
          { x: 3200, y: 5200 },
          { x: 3350, y: 5000 },
        ],
        width: 130,
        height: 180,
        peaks: [{ pos: { x: 3200, y: 5200 }, elevation: 180, label: '白龍尾山脊觀測哨 [Con Co Peak 180m]' }],
      },
    ];
    outIsland2.forestBelts = [
      {
        id: 'chodo-forest',
        density: 0.88,
        biome: 'palms',
        points: [
          { x: 3100, y: 5450 },
          { x: 3250, y: 5250 },
          { x: 3400, y: 5050 },
          { x: 3300, y: 4950 },
          { x: 3150, y: 5150 },
          { x: 3000, y: 5350 },
        ],
      },
    ];

    islands.push(outIsland1, outIsland2);
  } else {
    // 時代一與時代二: 4座巨型戰略珊瑚環礁要塞群 (狹長型珊瑚環礁與中央內海潟湖)
    // 減少島嶼數量但島嶼大幅擴大 (半徑 1100-1350m)，內部有深水潟湖水域可供舟艇穿梭
    const atollConfigs: { name: string; center: Vector2D; radius: number }[] = [
      { name: 'Guadalcanal-Tulagi Atoll Complex (瓜達爾卡納爾-圖拉吉巨型珊瑚環礁群)', center: { x: 5000, y: 8800 }, radius: 1250 },
      { name: 'Ironbottom Sound Barrier Atoll (鐵底灣天然屏障雙環礁)', center: { x: 7400, y: 6200 }, radius: 1180 },
      { name: 'Rabaul Caldera Fortress Lagoon (拉包爾破火山口要塞潟湖群)', center: { x: 9200, y: 3800 }, radius: 1350 },
      { name: 'Santa Cruz Strategic Coral Atoll (聖克魯斯深水潟湖前哨環礁)', center: { x: 9800, y: 8200 }, radius: 1120 },
    ];

    for (let i = 0; i < atollConfigs.length; i++) {
      const cfg = atollConfigs[i];
      const jitterX = Math.sin(i * 19.3 + seedBase) * 120;
      const jitterY = Math.cos(i * 23.7 + seedBase) * 120;
      const center: Vector2D = {
        x: Math.max(1600, Math.min(worldSize - 1600, cfg.center.x + jitterX)),
        y: Math.max(1600, Math.min(worldSize - 1600, cfg.center.y + jitterY)),
      };

      islands.push(
        generateCoralAtoll(
          `atoll-${i + 1}`,
          cfg.name,
          center,
          cfg.radius,
          seedBase + i * 137,
          era
        )
      );
    }
  }

  // 友軍前進後勤基地島嶼 (西南後方)
  const friendlyBasePos: Vector2D = { x: 2000, y: 12400 };
  const friendlyBase = generateFriendlyBaseIsland(friendlyBasePos, seedBase + 999, era);
  islands.unshift(friendlyBase);

  // 初始友軍地面部隊
  const groundUnits: GroundUnit[] = [];
  addFriendlyGroundUnits(era, groundUnits);

  addEnemyGarrisonUnits(era, islands, groundUnits);

  const cvPos: Vector2D = { ...playerSpawn };
  const initialHeading = -Math.PI / 4; // Heading 045° (North-East)

  const playerShips: Ship[] = [];

  // 初始兩棲登陸船團 (停靠於後方基地岸邊)
  if (era === 'era5') {
    playerShips.push(
      createLCAC('player-lcac-1', 'LCAC-01 氣墊登陸艇', { x: 2360, y: 12150 }),
      createLCAC('player-lcac-2', 'LCAC-02 氣墊登陸艇', { x: 2420, y: 12220 }),
      createNewportLST('player-lst-1', 'LST-1179 紐波特級戰車登陸艦 (現代化改型)', { x: 2500, y: 12320 }, era)
    );
  } else if (era === 'era4') {
    playerShips.push(
      createLCM8('player-lcm-1', 'LCM-8 重型機械化登陸艇 (Mike-1)', { x: 2360, y: 12150 }),
      createLCM8('player-lcm-2', 'LCM-8 重型機械化登陸艇 (Mike-2)', { x: 2420, y: 12220 }),
      createNewportLST('player-lst-1', 'LST-1179 紐波特級高速戰車登陸艦', { x: 2500, y: 12320 }, era)
    );
  } else {
    playerShips.push(
      createLCVP('player-lcvp-1', 'LCVP 希金斯登陸艇 (PA-1)', { x: 2360, y: 12150 }, era),
      createLCVP('player-lcvp-2', 'LCVP 希金斯登陸艇 (PA-2)', { x: 2420, y: 12220 }, era),
      createLST('player-lst-1', 'LST-391 戰車登陸艦', { x: 2500, y: 12320 }, era)
    );
  }

  if (era === 'era2') {
    playerShips.push(
      createLSMR('player-lsmr-1', 'LSM(R)-196 火箭登陸艦', { x: 2580, y: 12400 }, era)
    );
  }

  addPlayerTaskForce(era, cvPos, initialHeading, playerShips);

  // ═══════════════════════════════════════════════════════════════════════
  // 敵方主力艦隊 (OPFOR TASK FORCE BASED ON HISTORICAL COMBAT OPPONENTS)
  // ═══════════════════════════════════════════════════════════════════════
  const enemyShips: Ship[] = [];
  const enemyCenter: Vector2D =
    era === 'era3' || era === 'era4' || era === 'era5'
      ? { x: 3600, y: 1600 }
      : { x: 11400, y: 2600 };
  const enemyHeading =
    era === 'era3' || era === 'era4' || era === 'era5'
      ? Math.PI * 0.45 // Heading Southeast into the gulf/strait
      : (Math.PI * 3) / 4; addEnemyTaskForce(era, enemyShips, enemyCenter, enemyHeading);

  const briefingName =
    era === 'era5'
      ? `GIUK Gap & Barents Sea 1983-1991 (Sector ${sectorNumber})`
      : era === 'era4'
      ? `Gulf of Tonkin & Yankee Station 1965-1973 (Sector ${sectorNumber})`
      : era === 'era3'
      ? `Korea Strait & Wonsan Gulf 1950-1953 (Sector ${sectorNumber})`
      : SECTOR_NAMES[(sectorNumber - 1) % SECTOR_NAMES.length];

  return {
    worldSize,
    islands,
    friendlyBase,
    playerShips,
    enemyShips,
    groundUnits,
    briefing: {
      sectorNumber,
      sectorName: briefingName,
      era,
      theater:
        era === 'era1'
          ? 'South Pacific Campaign 1942'
          : era === 'era2'
          ? 'Western Pacific & Philippine Sea 1944-45'
          : era === 'era3'
          ? 'Far East & Korean Peninsula 1950-1953 (韓戰遠東特遣隊)'
          : era === 'era4'
          ? 'Gulf of Tonkin & Yankee Station 1965-1973 (越戰北部灣特遣隊)'
          : 'GIUK Gap & North Atlantic 1983-1991 (北大西洋神盾攻勢作戰)',
      briefing:
        era === 'era1'
          ? '【1942 瓜達爾卡納爾戰役】美軍第16/61特遣艦隊 (USS Enterprise CV-6, San Francisco, Atlanta) 奉命進入鐵底灣與所羅門群島海域，尋殲日軍南雲第一航空艦隊 (翔鶴、比叡、鳥海、秋月) 與摧毀島嶼要塞防線！'
          : era === 'era2'
          ? '【1944~1945 雷伊泰灣與沖繩特攻戰役】第38/58快速航母特遣艦隊 (USS Essex CV-9, Missouri BB-63, Cleveland, Johnston) 迎戰栗田艦隊主力 (大和、大鳳、金剛、島風)！請務必警戒日軍神風特攻機群與一式陸攻掛載之櫻花火箭反艦飛彈！'
          : era === 'era3'
          ? '【1950~1953 韓戰與遠東冷戰戰役】美海軍第77特遣艦隊 (USS Oriskany CV-34 SCB-27A, USS Missouri BB-63, Des Moines, Gearing) 進駐元山與日本海戰區！全面出動 F9F 黑豹、F2H 女妖噴射機、AD-1 天襲者、AD-3W 全域空中預警機與 HO3S-1 搜救直升機。假想敵冷戰遠東聯軍集結 MiG-15 噴射機、Tu-14 噴射轟炸機、53式魚雷快艇群與 T-34/85、IS-3 重戰車堅固防線！'
          : era === 'era4'
          ? '【1965~1973 越戰與北部灣特遣作戰】美海軍第77特遣艦隊旗艦小鷹號超級航艦 (CV-63 USS Kitty Hawk)、貝爾納普號飛彈巡洋艦 (CG-26)、查爾斯·亞當斯號飛彈驅逐艦 (DDG-2) 與硫磺島號兩棲突擊艦 (LPH-2) 駛入北部灣洋基站！全域實裝超音速噴射打擊群 (F-4B/J, F-8, A-6, A-4, B-52, F-105)、空空/空艦/反輻射導引飛彈系統與直升機立體垂直包圍！全面壓制北越 SA-2 導針防空飛彈營、扇歌射控雷達與冥河反艦飛彈快艇！'
          : '【1983~1991 假想第三次世界大戰 · 格陵蘭-冰島-英國斷口 (GIUK) 與巴倫支海前線】美海軍大西洋打擊艦隊 (USS Nimitz CVN-68, Ticonderoga CG-47, Virginia CGN-38, Iowa BB-61 近代化改裝, Spruance, Kidd, Perry, Los Angeles 核潛艦, Austin 船塢艦與 LCAC 氣墊艇) 推進大洋！迎戰蘇聯紅海軍北方艦隊主力 (基輔號航母、基洛夫號核動力巡洋艦、現代級、無畏級與奧斯卡級飛彈核潛艇)。敵方集結 Tu-22M3 逆火、Tu-95 熊式、MiG-29A、Su-27、T-80B 與 T-72B，發動大規模飽和超音速反艦巡弋飛彈齊射！神盾 SM-2MR、方陣 CIWS 與 F-14A 鳳凰飛彈準備全力接戰！',
      primaryObjective:
        era === 'era1'
          ? '擊沉日軍正規航母翔鶴號與護衛主力艦，摧毀島嶼核心設施'
          : era === 'era2'
          ? '擊沉超級戰艦大和號與大鳳號，殲滅敵神風特攻機隊與櫻花火箭威脅'
          : era === 'era3'
          ? '擊沉敵斯維爾德洛夫級巡洋艦與快艇群，擊落 MiG-15 噴射機隊，奪佔灘頭戰略要塞'
          : era === 'era4'
          ? '壓制敵 SA-2 地空飛彈發射營與扇歌雷達陣地，擊沉冥河飛彈快艇群與巡防艦，奪佔陸上戰略制高點'
          : '擊沉基洛夫號戰鬥巡洋艦與奧斯卡級核潛艦，擊落來襲 Tu-22M3 逆火機隊，化解飽和飛彈突防並奪佔前沿要塞',
      secondaryObjective:
        era === 'era1'
          ? '維持企業號航母血量高於 65%，擊墜 15 架以上敵機'
          : era === 'era2'
          ? '阻截所有來襲之一式陸攻與櫻花火箭特攻機，確保艦隊主力零直擊'
          : era === 'era3'
          ? '保持 AD-3W 預警機空中導引，出動 HO3S-1 直升機成功搜救所有落海飛行員'
          : era === 'era4'
          ? '使用野鼬機與 AGM-45 反輻射飛彈癱瘓防空網，出動直升機垂直突擊部隊搶佔內陸陣地'
          : '以方陣 CIWS 與 SM-2MR 成功攔截 10 枚以上來襲反艦巡弋飛彈，出動 LCAC 與 AAV-7A1 實施重裝搶灘',
    },
  };
}

/** Rivers, roads, hills and jungle belts of the era 3-5 mainland. */
function addMainlandTerrain(era: Era, continent: Island): void {
  if (era === 'era3') {
    addKoreanTerrain(continent);
  } else {
    addDeltaAndPlainTerrain(continent);
  }
}

/** Era 3: Korean rivers, mountain ridges and the coastal road net. */
function addKoreanTerrain(continent: Island): void {
  // ══════════════════════════════════════════════════════════
  // 時代三 (1950-1953) 朝鮮半島原型全境地形系統 (Korean Peninsula Continental Prototype)
  // 覆蓋全大陸 (X: 5000–14000, Y: 0–14000)
  // 包含北段蓋馬高原與長津湖、中段鐵三角與太白山脈主脊、南段洛東江與釜山防禦圈、東麓斷崖
  // ══════════════════════════════════════════════════════════

  // 1. 全境河流網 (North Yalu/Chongchon, Central Imjin/Han, South Naktong)
  continent.rivers = [
    {
      width: 22,
      points: [
        { x: 13600, y: 700 },
        { x: 11400, y: 1100 },
        { x: 9200, y: 1600 },
        { x: 7400, y: 2100 },
        { x: 5020, y: 2400 },
      ],
    },
    {
      width: 20,
      points: [
        { x: 13200, y: 5000 },
        { x: 11000, y: 5500 },
        { x: 8800, y: 5900 },
        { x: 7200, y: 6200 },
        { x: 5050, y: 6400 },
      ],
    },
    {
      width: 24,
      points: [
        { x: 11800, y: 8800 },
        { x: 9800, y: 9800 },
        { x: 8600, y: 10900 },
        { x: 9100, y: 12200 },
        { x: 7600, y: 13100 },
        { x: 5200, y: 13500 },
      ],
    },
  ];

  // 2. 朝鮮半島戰略公路網 (京釜主軸、鐵三角橫貫線、洛東江環形補給線)
  continent.roads = [
    {
      type: 'road',
      points: [
        { x: 11400, y: 1200 },
        { x: 9800, y: 3200 },
        { x: 8600, y: 5200 },
        { x: 7900, y: 7000 },
        { x: 8200, y: 9200 },
        { x: 7800, y: 11400 },
        { x: 7200, y: 13200 },
      ],
    },
    {
      type: 'road',
      points: [
        { x: 5400, y: 4800 },
        { x: 7200, y: 4600 },
        { x: 9200, y: 4400 },
        { x: 10800, y: 4300 },
        { x: 12800, y: 4100 },
      ],
    },
    {
      type: 'trail',
      points: [
        { x: 6400, y: 9400 },
        { x: 8200, y: 10400 },
        { x: 9600, y: 11200 },
        { x: 8800, y: 12400 },
        { x: 6800, y: 13000 },
      ],
    },
    {
      type: 'trail',
      points: [
        { x: 11600, y: 2800 },
        { x: 12400, y: 5200 },
        { x: 12200, y: 7600 },
        { x: 11600, y: 9800 },
      ],
    },
  ];

  // 3. 全境高山與戰略高地
  continent.hills = [
    { x: 11200, y: 1600, radius: 115 }, // 長津湖高地
    { x: 9600, y: 2600, radius: 100 },  // 德川北山
    { x: 10800, y: 3100, radius: 125 }, // 要塞天險制高點
    { x: 9800, y: 4200, radius: 95 },   // 875 高地
    { x: 8900, y: 5200, radius: 85 },   // 55 高地
    { x: 10400, y: 4900, radius: 105 }, // 漢堡高地
    { x: 7400, y: 7000, radius: 90 },   // 冠岳山
    { x: 8200, y: 6200, radius: 80 },   // 水原丘陵
    { x: 9400, y: 8200, radius: 90 },   // 大田丘陵
    { x: 8600, y: 9900, radius: 95 },   // 大邱外圍要隘
    { x: 9800, y: 11200, radius: 110 }, // 智異山南麓
    { x: 8800, y: 12600, radius: 100 }, // 馬山灘頭丘陵
  ];

  // 4. 朝鮮半島連續高寒森林與溫帶林帶 (覆蓋北中南全境)
  continent.forestBelts = [
    // 北段：蓋馬高原針葉落葉松高寒林帶
    {
      id: 'korea-forest-north',
      density: 0.94,
      biome: 'bamboo',
      points: [
        { x: 13500, y: 400 },
        { x: 12000, y: 900 },
        { x: 10200, y: 1600 },
        { x: 8600, y: 2400 },
        { x: 7200, y: 2900 },
        { x: 5300, y: 3200 },
        { x: 5040, y: 2200 },
        { x: 6800, y: 1600 },
        { x: 8800, y: 900 },
        { x: 11200, y: 400 },
      ],
    },
    // 中段：太白山脈主脊溫帶闊葉混交林長廊
    {
      id: 'korea-forest-central',
      density: 0.92,
      biome: 'rainforest',
      points: [
        { x: 8400, y: 3600 },
        { x: 9200, y: 4400 },
        { x: 10200, y: 5600 },
        { x: 10900, y: 6800 },
        { x: 11500, y: 7900 },
        { x: 11800, y: 8600 },
        { x: 11200, y: 8800 },
        { x: 10500, y: 8100 },
        { x: 9800, y: 6900 },
        { x: 8900, y: 5800 },
        { x: 8100, y: 4700 },
        { x: 7600, y: 3800 },
      ],
    },
    // 南段：洛東江河谷與南部丘陵松竹林帶
    {
      id: 'korea-forest-south',
      density: 0.90,
      biome: 'bamboo',
      points: [
        { x: 11400, y: 8900 },
        { x: 10600, y: 10100 },
        { x: 9700, y: 11400 },
        { x: 8900, y: 12600 },
        { x: 7800, y: 13500 },
        { x: 5400, y: 13800 },
        { x: 5150, y: 12800 },
        { x: 6800, y: 12100 },
        { x: 8200, y: 11100 },
        { x: 9200, y: 9900 },
        { x: 10400, y: 8900 },
      ],
    },
    // 東麓：深山老林要塞隱蔽林帶 (日本海沿岸縱深)
    {
      id: 'korea-forest-east',
      density: 0.95,
      biome: 'rainforest',
      points: [
        { x: 12200, y: 2600 },
        { x: 13400, y: 3400 },
        { x: 13800, y: 5800 },
        { x: 13700, y: 8400 },
        { x: 13100, y: 10800 },
        { x: 12400, y: 9800 },
        { x: 12800, y: 7600 },
        { x: 12900, y: 5100 },
        { x: 12300, y: 3600 },
      ],
    },
  ];

  // 5. 朝鮮半島連綿山脈脊線系統 (北中南貫穿 14,000m)
  continent.mountainRidges = [
    // 北段：蓋馬高原與長津湖花崗岩山脈
    {
      id: 'korea-ridge-kaema',
      width: 280,
      height: 2150,
      spine: [
        { x: 12600, y: 600 },
        { x: 11500, y: 1400 },
        { x: 10400, y: 2200 },
        { x: 9200, y: 2900 },
        { x: 8400, y: 3600 },
      ],
      peaks: [
        { pos: { x: 11500, y: 1400 }, elevation: 2150, label: '白頭山長津湖主峰 [Mount Paektu/Chosin 2150m]' },
        { pos: { x: 10400, y: 2200 }, elevation: 1750, label: '狼林山脈天險稜線 [Nangnim Ridge 1750m]' },
        { pos: { x: 9200, y: 2900 }, elevation: 1420, label: '妙香山要隘 [Myohyang Peak 1420m]' },
      ],
    },
    // 中段：太白山脈主脊、鐵三角與傷心嶺
    {
      id: 'korea-ridge-taebaek',
      width: 320,
      height: 1567,
      spine: [
        { x: 8600, y: 3800 },
        { x: 9400, y: 4800 },
        { x: 10200, y: 5800 },
        { x: 10800, y: 6800 },
        { x: 11400, y: 7800 },
        { x: 11800, y: 8600 },
      ],
      peaks: [
        { pos: { x: 9400, y: 4800 }, elevation: 931, label: '傷心嶺主峰 [Heartbreak Ridge 931m]' },
        { pos: { x: 10200, y: 5800 }, elevation: 983, label: '血嶺要塞鞍部 [Bloody Ridge 983m]' },
        { pos: { x: 10800, y: 6800 }, elevation: 1062, label: '金化鐵三角制高點 [Iron Triangle 1062m]' },
        { pos: { x: 11400, y: 7800 }, elevation: 1567, label: '太白山頂峰 [Taebaek Summit 1567m]' },
      ],
    },
    // 南段：智異山山脈與南部洛東江天險
    {
      id: 'korea-ridge-jiri',
      width: 260,
      height: 1915,
      spine: [
        { x: 11600, y: 8800 },
        { x: 10800, y: 9900 },
        { x: 9900, y: 11200 },
        { x: 9200, y: 12400 },
        { x: 8500, y: 13400 },
      ],
      peaks: [
        { pos: { x: 9900, y: 11200 }, elevation: 1915, label: '智異山天王峰 [Jiri Peak 1915m]' },
        { pos: { x: 10800, y: 9900 }, elevation: 1430, label: '伽倻山懸崖要塞 [Gaya Bluff 1430m]' },
        { pos: { x: 8800, y: 12900 }, elevation: 801, label: '釜山外圍金井山屏障 [Geumjeong Peak 801m]' },
      ],
    },
    // 東麓：日本海太白東麓斷崖海防山脈
    {
      id: 'korea-ridge-east-coast',
      width: 240,
      height: 1708,
      spine: [
        { x: 13200, y: 2600 },
        { x: 13500, y: 5200 },
        { x: 13200, y: 7800 },
        { x: 12800, y: 10500 },
      ],
      peaks: [
        { pos: { x: 13500, y: 5200 }, elevation: 1708, label: '雪嶽山大青峰 [Seoraksan Peak 1708m]' },
      ],
    },
  ];
}

/** Eras 4-5: delta river network, jungle belts and coastal plain roads. */
function addDeltaAndPlainTerrain(continent: Island): void {
  // ══════════════════════════════════════════════════════════
  // 時代四 (1965-1973) 越南戰場原型全境地形系統 (Vietnam War Continental Prototype)
  // 覆蓋全大陸 (X: 5000–14000, Y: 0–14000)
  // 包含北段紅河三角洲與下龍灣喀斯特、中段非軍事區(DMZ)與長山三重冠雨林、南段湄公河九龍江水網、東部胡志明小道縱深
  // ══════════════════════════════════════════════════════════

  // 1. 全境河流網 (North Red River, Central DMZ Ben Hai, South Mekong Delta)
  continent.rivers = [
    {
      width: 24,
      points: [
        { x: 13500, y: 1200 },
        { x: 11400, y: 2000 },
        { x: 9500, y: 2900 },
        { x: 7800, y: 3600 },
        { x: 6600, y: 4200 },
        { x: 5040, y: 4500 },
      ],
    },
    {
      width: 20,
      points: [
        { x: 12800, y: 5600 },
        { x: 10400, y: 6200 },
        { x: 8800, y: 6600 },
        { x: 7400, y: 6900 },
        { x: 5080, y: 7300 },
      ],
    },
    {
      width: 28,
      points: [
        { x: 13200, y: 9400 },
        { x: 11500, y: 10400 },
        { x: 9800, y: 11200 },
        { x: 8200, y: 12100 },
        { x: 6800, y: 12900 },
        { x: 5150, y: 13600 },
      ],
    },
    {
      width: 18,
      points: [
        { x: 9800, y: 11200 },
        { x: 9200, y: 12600 },
        { x: 7600, y: 13700 },
      ],
    },
  ];

  // 2. 越南戰略公路與胡志明小道網絡
  continent.roads = [
    {
      type: 'road',
      points: [
        { x: 5300, y: 2400 },
        { x: 6200, y: 4800 },
        { x: 6800, y: 6400 },
        { x: 7400, y: 7800 },
        { x: 8200, y: 9800 },
        { x: 8600, y: 11600 },
        { x: 8200, y: 13400 },
      ],
    },
    {
      type: 'road',
      points: [
        { x: 6800, y: 6400 },
        { x: 7900, y: 5500 },
        { x: 9200, y: 4500 },
        { x: 10600, y: 3800 },
        { x: 11800, y: 3400 },
      ],
    },
    {
      type: 'trail',
      points: [
        { x: 11500, y: 2200 },
        { x: 10800, y: 3600 },
        { x: 9800, y: 5200 },
        { x: 10400, y: 6800 },
        { x: 11200, y: 8400 },
        { x: 11800, y: 10200 },
        { x: 10900, y: 12200 },
      ],
    },
    {
      type: 'trail',
      points: [
        { x: 6400, y: 9800 },
        { x: 7600, y: 10800 },
        { x: 8800, y: 11800 },
        { x: 7900, y: 13100 },
      ],
    },
  ];

  // 3. 越南全境山嶺與制高點高地
  continent.hills = [
    { x: 11600, y: 1800, radius: 120 }, // 諒山北峰
    { x: 10200, y: 2500, radius: 110 }, // 下龍石林峰
    { x: 10800, y: 3100, radius: 125 }, // 要塞天險制高點
    { x: 7800, y: 3700, radius: 95 },   // 巴拿山嶺
    { x: 9800, y: 4200, radius: 95 },   // 875 高地
    { x: 8900, y: 5200, radius: 85 },   // 55 高地
    { x: 10400, y: 4900, radius: 105 }, // 漢堡高地 937
    { x: 7400, y: 7000, radius: 90 },   // 大理石山
    { x: 8200, y: 6200, radius: 80 },   // 虎嶺
    { x: 9400, y: 8400, radius: 95 },   // 德普丘陵
    { x: 10600, y: 10400, radius: 110 },// 波萊古高原
    { x: 9600, y: 12200, radius: 100 }, // 象山丘陵
  ];

  // 4. 熱帶雨林與密林叢林群 (Dense Jungles - 遍布北中南全境)
  continent.jungles = [
    { x: 10800, y: 1800, radius: 130, density: 0.90 },
    { x: 9600, y: 2400, radius: 140, density: 0.92 },
    { x: 8400, y: 3200, radius: 135, density: 0.90 },
    { x: 7600, y: 3900, radius: 125, density: 0.88 },
    { x: 6900, y: 4800, radius: 130, density: 0.85 },
    { x: 7300, y: 5600, radius: 120, density: 0.85 },
    { x: 7700, y: 6700, radius: 120, density: 0.85 },
    { x: 8100, y: 5800, radius: 140, density: 0.90 },
    { x: 8400, y: 6500, radius: 115, density: 0.85 },
    { x: 8700, y: 5500, radius: 135, density: 0.90 },
    { x: 9000, y: 6300, radius: 125, density: 0.85 },
    { x: 9300, y: 5200, radius: 140, density: 0.90 },
    { x: 9700, y: 5900, radius: 130, density: 0.85 },
    { x: 10000, y: 4800, radius: 145, density: 0.90 },
    { x: 10300, y: 5600, radius: 135, density: 0.85 },
    { x: 10600, y: 4500, radius: 125, density: 0.90 },
    { x: 10900, y: 5200, radius: 130, density: 0.85 },
    { x: 8900, y: 7800, radius: 130, density: 0.88 },
    { x: 9600, y: 8400, radius: 135, density: 0.90 },
    { x: 10400, y: 9200, radius: 140, density: 0.92 },
    { x: 11200, y: 9900, radius: 135, density: 0.90 },
    { x: 11800, y: 10800, radius: 130, density: 0.88 },
    { x: 8800, y: 10200, radius: 135, density: 0.90 },
    { x: 9500, y: 11400, radius: 140, density: 0.92 },
    { x: 10200, y: 12200, radius: 130, density: 0.88 },
    { x: 8900, y: 12800, radius: 135, density: 0.90 },
    { x: 7800, y: 13200, radius: 130, density: 0.85 },
    { x: 11500, y: 3400, radius: 135, density: 0.92 },
    { x: 12200, y: 4500, radius: 140, density: 0.95 },
    { x: 12600, y: 6200, radius: 140, density: 0.95 },
    { x: 12800, y: 7800, radius: 135, density: 0.92 },
    { x: 12400, y: 9400, radius: 130, density: 0.90 },
  ];

  // 5. 越南全境連續有機雨林帶 (北段石林竹林、中段三重冠雨林、南段紅樹林、東部小道走廊)
  continent.forestBelts = [
    // 北段：下龍灣喀斯特石林與北部高地原始雨林
    {
      id: 'vietnam-forest-north-karst',
      density: 0.94,
      biome: 'bamboo',
      points: [
        { x: 13500, y: 500 },
        { x: 12200, y: 1100 },
        { x: 10400, y: 1900 },
        { x: 8800, y: 2800 },
        { x: 7400, y: 3400 },
        { x: 5300, y: 3900 },
        { x: 5020, y: 3100 },
        { x: 6800, y: 2200 },
        { x: 8900, y: 1400 },
        { x: 11400, y: 600 },
      ],
    },
    // 中段：非軍事區(DMZ)、溪山與安南長山三重冠熱帶密林走廊
    {
      id: 'vietnam-forest-dmz-spine',
      density: 0.98,
      biome: 'rainforest',
      points: [
        { x: 7400, y: 4100 },
        { x: 8200, y: 4900 },
        { x: 8900, y: 5900 },
        { x: 9700, y: 7100 },
        { x: 10400, y: 8200 },
        { x: 11200, y: 8900 },
        { x: 10600, y: 9200 },
        { x: 9900, y: 8500 },
        { x: 9100, y: 7300 },
        { x: 8300, y: 6100 },
        { x: 7600, y: 5100 },
        { x: 6900, y: 4400 },
      ],
    },
    // 南段：湄公河與隆安紅樹林潮間沼澤水網林帶
    {
      id: 'vietnam-forest-mekong-mangrove',
      density: 0.96,
      biome: 'mangrove',
      points: [
        { x: 11800, y: 9200 },
        { x: 10800, y: 10300 },
        { x: 9800, y: 11500 },
        { x: 8800, y: 12700 },
        { x: 7600, y: 13600 },
        { x: 5300, y: 13800 },
        { x: 5100, y: 12900 },
        { x: 6700, y: 12200 },
        { x: 8200, y: 11200 },
        { x: 9400, y: 10100 },
        { x: 10600, y: 9100 },
      ],
    },
    // 東部：胡志明小道深層密林偽裝縱深掩護帶
    {
      id: 'vietnam-forest-trail-hinterland',
      density: 0.96,
      biome: 'rainforest',
      points: [
        { x: 12200, y: 2800 },
        { x: 13500, y: 3600 },
        { x: 13800, y: 6200 },
        { x: 13700, y: 8800 },
        { x: 13200, y: 11000 },
        { x: 12400, y: 10100 },
        { x: 12800, y: 7800 },
        { x: 12900, y: 5300 },
        { x: 12400, y: 3700 },
      ],
    },
  ];

  // 6. 越南全境山脈脊線系統 (北中南貫穿 14,000m)
  continent.mountainRidges = [
    // 北段：下龍灣喀斯特石灰岩群峰與諒山邊界險隘
    {
      id: 'vietnam-ridge-north-karst',
      width: 290,
      height: 1540,
      spine: [
        { x: 12800, y: 800 },
        { x: 11600, y: 1600 },
        { x: 10200, y: 2400 },
        { x: 8800, y: 3200 },
        { x: 7600, y: 3800 },
      ],
      peaks: [
        { pos: { x: 11600, y: 1600 }, elevation: 1540, label: '諒山隘口主峰 [Lang Son Border Peak 1540m]' },
        { pos: { x: 10200, y: 2400 }, elevation: 1180, label: '下龍石灰岩峰林 [Ha Long Karst Citadel 1180m]' },
        { pos: { x: 7800, y: 3600 }, elevation: 1487, label: '巴拿山峰要塞 [Ba Na Ridge 1487m]' },
      ],
    },
    // 中段：安南長山山脈主脊、溪山與阿紹谷地
    {
      id: 'vietnam-ridge-truongson-central',
      width: 320,
      height: 1140,
      spine: [
        { x: 7400, y: 4200 },
        { x: 8200, y: 5200 },
        { x: 9100, y: 6200 },
        { x: 10100, y: 7200 },
        { x: 11200, y: 8200 },
        { x: 12200, y: 8900 },
      ],
      peaks: [
        { pos: { x: 8200, y: 5200 }, elevation: 881, label: '溪山881南峰 [Hill 881 South 881m]' },
        { pos: { x: 9100, y: 6200 }, elevation: 937, label: '漢堡高地937頂峰 [Hamburger Hill 937m]' },
        { pos: { x: 10100, y: 7200 }, elevation: 875, label: '875高地核心稜線 [Hill 875 - 875m]' },
        { pos: { x: 11200, y: 8200 }, elevation: 1140, label: '要塞花崗岩主峰 [Citadel Granite Peak 1140m]' },
      ],
    },
    // 南段：中部高原波萊古天險與象山山脈
    {
      id: 'vietnam-ridge-highlands-south',
      width: 270,
      height: 1250,
      spine: [
        { x: 12400, y: 9200 },
        { x: 11600, y: 10400 },
        { x: 10600, y: 11600 },
        { x: 9800, y: 12600 },
        { x: 8900, y: 13500 },
      ],
      peaks: [
        { pos: { x: 11600, y: 10400 }, elevation: 1250, label: '初邦山天險主峰 [Chu Pong Massif 1250m]' },
        { pos: { x: 10600, y: 11600 }, elevation: 980, label: '波萊古高原隘口 [Pleiku Plateau Pass 980m]' },
        { pos: { x: 9800, y: 12600 }, elevation: 1080, label: '象山山脊眺望峰 [Elephant Peak 1080m]' },
      ],
    },
    // 沿海：山茶半島猴山懸崖山脊
    {
      id: 'vietnam-ridge-sontra',
      width: 190,
      height: 693,
      spine: [
        { x: 5700, y: 8600 },
        { x: 6300, y: 8100 },
        { x: 7000, y: 7700 },
        { x: 7500, y: 8200 },
      ],
      peaks: [
        { pos: { x: 6450, y: 8100 }, elevation: 693, label: '山茶半島猴山頂峰 [Son Tra Peak 693m]' },
      ],
    },
  ];
}

/** Allied logistics and defence belt in the south-western rear of the mainland. */
function addAlliedMainlandBases(continent: Island, alliedHqPos: Vector2D, hqName: string, hqDesc: string, afbName: string, afbDesc: string): void {
  continent.installations.push(
    // 1. 友軍前線指揮中心
    makeInstallation({
      id: 'player-hq-continental',
      type: 'command_post',
      name: hqName,
      weaponDesc: hqDesc,
      pos: alliedHqPos,
      angle: -Math.PI / 4,
      health: 7500,
      armor: 0.82,
      range: 1200,
      reloadTime: 1.5,
      side: 'player',
    }),
    // 2. 大陸前進航空基地
    makeInstallation({
      id: 'player-afb-continental',
      type: 'airfield',
      name: afbName,
      weaponDesc: afbDesc,
      pos: { x: 6200, y: 8200 },
      angle: -Math.PI / 4,
      health: 5500,
      armor: 0.55,
      range: 4800,
      reloadTime: 12,
      side: 'player',
    }),
    // 3. 友軍防空火網 (90mm M2 / 40mm Bofors / M42 Duster)
    makeInstallation({
      id: 'player-cont-flak-1',
      type: 'flak_battery',
      name: '美陸軍 90mm M2 重型防空砲連 (SCR-584雷達導引)',
      weaponDesc: 'SCR-584 雷達射控 VT 信管 90mm 防空砲 · 封鎖高空轟炸走廊',
      pos: { x: 6300, y: 7600 },
      health: 2600,
      armor: 0.45,
      range: 1350,
      cooldown: 0.6,
      reloadTime: 1.6,
      side: 'player',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'player-cont-flak-2',
      type: 'flak_battery',
      name: '美陸軍 40mm 博福斯四聯防空砲連 (基地直衛)',
      weaponDesc: '密集40mm速射防空彈幕 · 攔截低空噴射攻擊機與強擊機',
      pos: { x: 6550, y: 7950 },
      angle: Math.PI / 2,
      health: 2400,
      armor: 0.42,
      range: 1100,
      cooldown: 0.5,
      reloadTime: 1.3,
      side: 'player',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'player-cont-flak-3',
      type: 'flak_battery',
      name: '美陸軍 M42 清道夫雙管40mm自走防空砲陣地',
      weaponDesc: '雙管40mm機動高射砲 · 伴隨掩護司令部指揮所',
      pos: { x: 6600, y: 7650 },
      angle: -Math.PI / 3,
      health: 2200,
      armor: 0.40,
      range: 1050,
      cooldown: 0.4,
      reloadTime: 1.2,
      side: 'player',
      isASuWOnly: false,
    }),
    // 4. 友軍長程重砲群 (155mm M114 / 105mm M2A1 / 203mm 岸防加農砲)
    makeInstallation({
      id: 'player-cont-arty-1',
      type: 'towed_artillery',
      name: '美陸軍 M114 155mm 重榴彈砲連 (HQ前線重火網)',
      weaponDesc: '長程重型野戰榴彈砲 · 壓制大陸中央戰線敵軍裝甲突擊',
      pos: { x: 6500, y: 7400 },
      angle: -Math.PI / 4,
      health: 3000,
      armor: 0.48,
      range: 1750,
      cooldown: 1.1,
      reloadTime: 3.2,
      side: 'player',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'player-cont-arty-2',
      type: 'towed_artillery',
      name: '美陸軍 M2A1 105mm 輕型榴彈砲連 (前沿支援)',
      weaponDesc: '高射速步兵火力支援砲兵陣地',
      pos: { x: 6700, y: 7550 },
      angle: -Math.PI / 4,
      health: 2600,
      armor: 0.40,
      range: 1450,
      cooldown: 0.8,
      reloadTime: 2.2,
      side: 'player',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'player-cont-coastal-1',
      type: 'coastal_gun',
      name: '美海軍陸戰隊 8吋(203mm) 岸防加農砲台',
      weaponDesc: '超長程重型岸防砲 · 封鎖西南海岸深水航道與反制水面突襲',
      pos: { x: 5800, y: 8400 },
      angle: -Math.PI / 2,
      health: 3800,
      armor: 0.65,
      range: 2000,
      cooldown: 1.5,
      reloadTime: 4.0,
      side: 'player',
      isASuWOnly: true,
    }),
    // 5. 戰地後勤與醫療野戰醫院
    makeInstallation({
      id: 'player-cont-hospital',
      type: 'field_hospital',
      name: '美國陸軍第8055戰地外科醫院 (8055th MASH Unit)',
      weaponDesc: '前線直升機後送與傷患救治中心 · 快速復原陸上部隊組織度與兵員',
      pos: { x: 6150, y: 7900 },
      health: 2800,
      armor: 0.35,
      side: 'player',
    }),
    makeInstallation({
      id: 'player-cont-depot',
      type: 'supply_depot',
      name: '大陸前進戰役兵站與油彈儲備庫 (POL Logistics Depot)',
      weaponDesc: '彈藥、油料與裝甲備件樞紐 · 加速全線部隊建制度修整',
      pos: { x: 6350, y: 8050 },
      health: 3200,
      armor: 0.45,
      side: 'player',
    })
  );
}

/** OPFOR fortress complex in the north-eastern granite range. */
function addEnemyFortressComplex(era: Era, continent: Island, enemyHqPos: Vector2D): void {
  continent.installations.push(
    // 1. 遠東聯軍地下花崗岩要塞司令部
    makeInstallation({
      id: 'enemy-hq-continental',
      type: 'command_post',
      name: '遠東聯軍地下要塞前進指揮所 [OPFOR Fortress HQ]',
      weaponDesc: '深層花崗岩防核防空坑道要塞 · 戰時地下戰役指揮所',
      pos: enemyHqPos,
      angle: (Math.PI * 3) / 4,
      health: 7500,
      armor: 0.82,
      range: 1300,
      reloadTime: 1.5,
      side: 'enemy',
    }),
    // 2. 敵大陸航空基地 (OPFOR Continental Airbase)
    makeInstallation({
      id: 'enemy-afb-continental',
      type: 'airfield',
      name: era === 'era4'
        ? '內排/福安前進航空基地 [Noi Bai / Phuc Yen Airbase]'
        : '遠東聯軍前線野戰空軍基地 (OPFOR Continental Airfield)',
      weaponDesc: era === 'era4'
        ? '重型全天候噴射基地 · MiG-21 魚窩、MiG-17 壁畫、Su-7 與 IL-28 升空出擊母港'
        : '混凝土跑道航空樞紐 · MiG-15 噴射機與 IL-10 強擊機戰略升空母港',
      pos: { x: 11600, y: 3800 },
      angle: (Math.PI * 3) / 4,
      health: 5500,
      armor: 0.55,
      range: 4600,
      reloadTime: 14,
      side: 'enemy',
    }),
    // 3. 敵方防空火網 (KS-19 100mm 重高砲 / S-60 57mm 雷達砲)
    makeInstallation({
      id: 'enemy-cont-ks19-1',
      type: 'flak_battery',
      name: 'KS-19 100mm 重型防空砲第1連 (SON-9雷達導引)',
      weaponDesc: '100mm 重型雷達射控高射砲 · 封鎖大陸上空萬米轟炸走廊',
      pos: { x: 11000, y: 3600 },
      angle: (Math.PI * 3) / 4,
      health: 3800,
      armor: 0.60,
      range: 1500,
      cooldown: 0.7,
      reloadTime: 1.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-cont-ks19-2',
      type: 'flak_battery',
      name: 'KS-19 100mm 重型防空砲第2連 (要塞核心頂蓋)',
      weaponDesc: '重裝甲花崗岩掩體防空高砲 · 壓制高空轟炸',
      pos: { x: 10800, y: 3100 },
      angle: (Math.PI * 3) / 4,
      health: 3800,
      armor: 0.60,
      range: 1500,
      cooldown: 0.7,
      reloadTime: 1.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-cont-s60-1',
      type: 'flak_battery',
      name: 'S-60 57mm 自動防空高射砲連 (西翼防線)',
      weaponDesc: '57mm 雷達火控自動高射砲群 · 攔截低空噴射攻擊機',
      pos: { x: 10400, y: 4000 },
      angle: Math.PI / 2,
      health: 3200,
      armor: 0.52,
      range: 1250,
      cooldown: 0.6,
      reloadTime: 1.1,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-cont-s60-2',
      type: 'flak_battery',
      name: 'S-60 57mm 自動防空高射砲連 (東翼防線)',
      weaponDesc: '57mm 雷達火控自動高射砲群 · 攔截俯衝戰機',
      pos: { x: 11400, y: 3000 },
      health: 3200,
      armor: 0.52,
      range: 1250,
      cooldown: 0.6,
      reloadTime: 1.1,
      side: 'enemy',
      isASuWOnly: false,
    }),
    // 4. 敵方野戰重砲群 (A-19 122mm 加農砲 / ML-20 152mm 榴彈砲)
    makeInstallation({
      id: 'enemy-cont-arty-1',
      type: 'towed_artillery',
      name: 'A-19 122mm 加農砲連 (前沿反突擊砲兵陣地)',
      weaponDesc: '超長身管加農砲 · 跨越山體重創美陸軍進攻矛頭',
      pos: { x: 10600, y: 3800 },
      angle: (Math.PI * 3) / 4,
      health: 3400,
      armor: 0.52,
      range: 1650,
      cooldown: 1.0,
      reloadTime: 2.8,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-cont-arty-2',
      type: 'towed_artillery',
      name: 'ML-20 152mm 重型加農榴彈砲連 (要塞縱深重火網)',
      weaponDesc: '重裝甲要塞加農砲 · 覆蓋戰線中央交通要道',
      pos: { x: 10800, y: 3400 },
      angle: (Math.PI * 3) / 4,
      health: 3600,
      armor: 0.55,
      range: 1800,
      cooldown: 1.2,
      reloadTime: 3.4,
      side: 'enemy',
      isASuWOnly: true,
    }),
    // 5. 敵方沿海重砲要塞與雷達哨
    makeInstallation({
      id: 'enemy-cont-coastal-1',
      type: 'coastal_gun',
      name: 'B-13 130mm 沿海要塞岸防加農砲台',
      weaponDesc: '花崗岩懸崖砲台 · 封鎖北部沿海水道',
      pos: { x: 10100, y: 2600 },
      angle: -Math.PI / 3,
      health: 4400,
      armor: 0.68,
      range: 1900,
      cooldown: 1.4,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-cont-coastal-2',
      type: 'coastal_gun',
      name: '152mm 雙聯裝長程海防重砲堡',
      weaponDesc: '半地下混凝土重砲堡 · 扼守沿海登陸水線',
      pos: { x: 11800, y: 2800 },
      angle: -Math.PI / 4,
      health: 4600,
      armor: 0.70,
      range: 1950,
      cooldown: 1.5,
      reloadTime: 3.8,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-cont-radar',
      type: 'radar_station',
      name: 'P-20 (Dumbo) 遠程對空早期預警雷達站',
      weaponDesc: '大型全方位預警雷達天線 · 引導 MiG-15 高速攔截',
      pos: { x: 11100, y: 3000 },
      health: 3000,
      armor: 0.45,
      range: 4500,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-cont-depot',
      type: 'ammo_depot',
      name: '花崗岩深層防核彈藥與航油儲備掩體',
      weaponDesc: '要塞地下彈藥庫 · 為重砲與戰車提供彈藥',
      pos: { x: 11400, y: 3500 },
      health: 4000,
      armor: 0.65,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-cont-tunnel-1',
      type: 'hidden_tunnel',
      name: '前線花崗岩伏擊坑道網絡 [No.1]',
      weaponDesc: '隱蔽地下防空反擊通道',
      pos: { x: 10500, y: 4200 },
      health: 3500,
      armor: 0.70,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-cont-tunnel-2',
      type: 'hidden_tunnel',
      name: '中央丘陵地下隱蔽集結坑道 [No.2]',
      weaponDesc: '伏擊步兵機動出擊口',
      pos: { x: 9900, y: 4600 },
      health: 3500,
      armor: 0.70,
      side: 'enemy',
    })
  );
}

/** Era 4 (North Vietnam) and era 5 (Kola) enemy sites on the mainland. */
function addEraSpecificEnemySites(era: Era, continent: Island): void {
  if (era === 'era4') {
    addNorthVietnamSites(continent);
  } else if (era === 'era5') {
    addWarsawPactSites(continent);
  }
}

/** Era 4: North Vietnamese SA-2 sites, Fan Song radars, AAA belts and supply depots. */
function addNorthVietnamSites(continent: Island): void {
  continent.installations.push(
    makeInstallation({
      id: 'player-sam-hawk-1',
      type: 'sam_hawk',
      name: 'MIM-23 鷹式 (Hawk) 地面防空飛彈發射連',
      weaponDesc: '美陸戰隊/陸軍前線地空防空飛彈 · 自動雷達引導攔截2600m內來襲敵機',
      pos: { x: 6500, y: 7700 },
      health: 4200,
      armor: 0.55,
      range: 2600,
      reloadTime: 3.5,
      side: 'player',
      isASuWOnly: false,
      samMissilesReady: 12,
      samMaxMissiles: 12,
    }),
    makeInstallation({
      id: 'player-fob-1',
      type: 'forward_fob',
      name: '美陸戰隊直升機野戰前進基地 (Forward FOB LZ Stud)',
      weaponDesc: '前線突擊直升機整補基地 · 支援垂直包圍與空中突擊機降',
      pos: { x: 6700, y: 7500 },
      health: 4500,
      armor: 0.55,
      side: 'player',
    }),
    // 3x 堅固加固暗堡支撐點 (Bunker Nests) 封鎖戰線進攻軸線
    makeInstallation({
      id: 'enemy-bunker-alpha',
      type: 'bunker_nest',
      name: '北越人民軍前沿加固重機槍暗堡 [Bunker Alpha - 61高地]',
      weaponDesc: '雙層鋼筋混凝土永備暗堡 · 密集交叉火網壓制突擊步兵 · 造成重度火力壓制',
      pos: { x: 8400, y: 5500 },
      angle: -Math.PI / 4,
      health: 4600,
      armor: 0.75,
      range: 1100,
      cooldown: 0.4,
      reloadTime: 1.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-bunker-bravo',
      type: 'bunker_nest',
      name: '溪山外圍鞍部重型交叉掩蔽暗堡 [Bunker Bravo - 溪山外緣]',
      weaponDesc: '地下覆土加固重型工事 · DShK 12.7mm重機槍與無後座力砲扼守隘口',
      pos: { x: 8900, y: 4900 },
      angle: -Math.PI / 3,
      health: 4800,
      armor: 0.78,
      range: 1150,
      cooldown: 0.4,
      reloadTime: 1.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-bunker-charlie',
      type: 'bunker_nest',
      name: '881高地核心稜線重型連環暗堡群 [Bunker Charlie - 881南峰]',
      weaponDesc: '制高點山體岩洞暗堡連鎖樞紐 · 壓制沿公路推進之機械化部隊',
      pos: { x: 9600, y: 4300 },
      angle: -Math.PI / 4,
      health: 5200,
      armor: 0.82,
      range: 1200,
      cooldown: 0.35,
      reloadTime: 1.0,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-sa2-alpha',
      type: 'sa2_sam_site',
      name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Alpha]',
      weaponDesc: 'V-750 兩級固體助推防空飛彈 · 殺傷半徑45m · 由扇歌雷達導引',
      pos: { x: 10600, y: 3900 },
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-fan-song',
      type: 'fan_song_radar',
      name: 'Fan Song 扇歌射控火控雷達陣地 [Radar Guidance]',
      weaponDesc: 'E/F頻段目標跟蹤與飛彈制導雷達 · 發射強烈電磁信號 · AGM-45 反輻射飛彈首要打擊目標',
      pos: { x: 10400, y: 3700 },
      health: 2800,
      armor: 0.40,
      range: 4800,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'enemy-sa2-bravo',
      type: 'sa2_sam_site',
      name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Bravo]',
      weaponDesc: '重型防空飛彈發射陣列 · 封鎖高空轟炸空域',
      pos: { x: 11400, y: 3100 },
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-shilka-1',
      type: 'flak_battery',
      name: 'ZSU-23-4 石勒喀河四聯裝23mm雷達防砲陣地',
      weaponDesc: '雷達火控四管極高射速機砲 · 封鎖超低空突防',
      pos: { x: 10800, y: 3400 },
      health: 3200,
      armor: 0.52,
      range: 1250,
      cooldown: 0.4,
      reloadTime: 0.8,
      side: 'enemy',
    }),
    // ─── 3X 擴展大陸設施群 (均勻散布中立、敵方與可奪佔戰略據點) ───
    makeInstallation({
      id: 'neutral-plantation-1',
      type: 'rubber_plantation',
      name: '米芝蓮法式橡膠種植園莊園 [Michelin Plantation]',
      weaponDesc: '密集橡膠林覆蓋之熱帶種植園 · 佔領提供戰術隱蔽與物資補給 (+15 CP)',
      pos: { x: 7800, y: 6200 },
      health: 3200,
      armor: 0.40,
      side: 'neutral',
      civilianZoneRadius: 200,
    }),
    makeInstallation({
      id: 'neutral-plantation-2',
      type: 'rubber_plantation',
      name: '安祿外圍橡膠種植園 [An Loc Plantation]',
      weaponDesc: '天然橡膠加工廠與橡膠樹林區 · 阻滯裝甲車輛衝刺並提供步兵重掩護',
      pos: { x: 8800, y: 5800 },
      health: 3200,
      armor: 0.40,
      side: 'neutral',
      civilianZoneRadius: 200,
    }),
    makeInstallation({
      id: 'neutral-ferry-1',
      type: 'river_ferry',
      name: '班海河戰略浮橋渡口碼頭 [Ben Hai River Ferry]',
      weaponDesc: '鋼纜浮橋與木造渡輪碼頭 · 奪佔可開闢部隊跨河機動走廊',
      pos: { x: 8200, y: 4200 },
      angle: Math.PI / 2,
      health: 3500,
      armor: 0.45,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'neutral-ferry-2',
      type: 'river_ferry',
      name: '紅河支流石灘渡運站 [Delta Crossing Ferry]',
      weaponDesc: '三角洲河流交匯處渡口 · 兩棲突擊裝甲車與渡河舟艇集結地',
      pos: { x: 7700, y: 6900 },
      angle: -Math.PI / 4,
      health: 3500,
      armor: 0.45,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'neutral-radio-1',
      type: 'radio_station',
      name: '965高地戰術微波無線電轉播塔 [Relay Station 965]',
      weaponDesc: '制高點鋼架通信鐵塔 · 奪佔可大幅提升全域雷達與前線砲兵射控精度',
      pos: { x: 9400, y: 6000 },
      health: 2600,
      armor: 0.35,
      range: 3500,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'enemy-radio-relay',
      type: 'radio_station',
      name: '北越軍事通信總台與密碼監聽站 [Radio Relay Station]',
      weaponDesc: '敵軍前線通信轉發中心 · 摧毀可瓦解敵方空中攔截協同',
      pos: { x: 10900, y: 3900 },
      health: 2800,
      armor: 0.40,
      range: 4000,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'neutral-cache-1',
      type: 'ammo_cache',
      name: '叢林隱蔽野戰彈藥與航油補給點 [Forward Ammo Cache]',
      weaponDesc: '油桶與彈藥箱集結棧點 · 佔領即刻補滿周邊友軍部隊彈藥與油料',
      pos: { x: 7300, y: 6500 },
      health: 2800,
      armor: 0.30,
      side: 'player',
    }),
    makeInstallation({
      id: 'enemy-cache-2',
      type: 'ammo_cache',
      name: '胡志明小道前進物資儲備轉運站 [559 Group Depot]',
      weaponDesc: '偽裝密林彈藥轉運棧 · 堆積 122mm 火箭彈與迫擊砲彈',
      pos: { x: 9800, y: 5700 },
      health: 3200,
      armor: 0.35,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-watchtower-1',
      type: 'watchtower',
      name: '邊境叢林木質高架瞭望哨塔 [Border Watchtower 1]',
      weaponDesc: '重機槍警戒木塔 · 探測並通報潛伏滲透小隊',
      pos: { x: 8000, y: 4800 },
      health: 1800,
      armor: 0.25,
      range: 900,
      cooldown: 0.5,
      reloadTime: 1.2,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-watchtower-2',
      type: 'watchtower',
      name: '鞍部制高點鋼架偵察哨塔 [Ridge Watchtower 2]',
      weaponDesc: 'DShK 12.7mm 重機槍哨位 · 監控沿公路推進動態',
      pos: { x: 8600, y: 6400 },
      health: 2000,
      armor: 0.28,
      range: 950,
      cooldown: 0.5,
      reloadTime: 1.2,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-flak-zpu4-1',
      type: 'flak_battery',
      name: 'ZPU-4 四聯裝14.5mm防空機槍陣地 [Flak LZ Amber]',
      weaponDesc: '四管極高射速高射機槍 · 對低空穿梭機降直升機形成致命撕裂火網',
      pos: { x: 8100, y: 5300 },
      health: 2400,
      armor: 0.40,
      range: 1050,
      cooldown: 0.3,
      reloadTime: 0.9,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-flak-zpu4-2',
      type: 'flak_battery',
      name: 'ZPU-4 四聯裝14.5mm防空機槍陣地 [Flak LZ Blue]',
      weaponDesc: '密林隱蔽四聯高射機槍 · 防衛前沿隘口',
      pos: { x: 8500, y: 4600 },
      health: 2400,
      armor: 0.40,
      range: 1050,
      cooldown: 0.3,
      reloadTime: 0.9,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-flak-61k-1',
      type: 'flak_battery',
      name: '61-K 37mm 自動防空高射砲連 [Valley AA]',
      weaponDesc: '雙聯裝37mm速射高砲 · 壓制低空俯衝俯衝攻擊',
      pos: { x: 9100, y: 4100 },
      health: 2600,
      armor: 0.45,
      range: 1150,
      cooldown: 0.4,
      reloadTime: 1.1,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-arty-d30-1',
      type: 'towed_artillery',
      name: 'D-30 122mm 榴彈砲前線發射陣地 [D-30 Battery East]',
      weaponDesc: '三腳架360度環射榴彈砲 · 遠程齊射轟擊登陸部隊與直升機機降區',
      pos: { x: 9700, y: 5000 },
      angle: -Math.PI / 4,
      health: 3200,
      armor: 0.50,
      range: 1650,
      cooldown: 1.1,
      reloadTime: 2.7,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-arty-d30-2',
      type: 'towed_artillery',
      name: 'D-30 122mm 榴彈砲前線發射陣地 [D-30 Battery North]',
      weaponDesc: '隱蔽於石灰岩溶洞外圍之重榴砲陣地 · 長程火力支援暗堡群',
      pos: { x: 10200, y: 4400 },
      angle: -Math.PI / 3,
      health: 3200,
      armor: 0.50,
      range: 1650,
      cooldown: 1.1,
      reloadTime: 2.7,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-bunker-delta',
      type: 'bunker_nest',
      name: '溪山北側高地環形暗堡要塞 [Bunker Delta - 861高地]',
      weaponDesc: '花崗岩厚重暗堡 · 配備 75mm 無後座力砲與雙聯重機槍',
      pos: { x: 9100, y: 4700 },
      angle: -Math.PI / 4,
      health: 5000,
      armor: 0.80,
      range: 1150,
      cooldown: 0.4,
      reloadTime: 1.1,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-bunker-echo',
      type: 'bunker_nest',
      name: '安祿外圍鋼筋混凝土核心連鎖堡 [Bunker Echo - 核心環線]',
      weaponDesc: '重裝甲碉堡堡群 · 封鎖南部戰略公路咽喉',
      pos: { x: 8700, y: 6600 },
      angle: -Math.PI / 3,
      health: 5100,
      armor: 0.80,
      range: 1150,
      cooldown: 0.4,
      reloadTime: 1.1,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'neutral-clinic-1',
      type: 'settlement',
      name: '國際戰地平民診所與紅十字醫療站 [Civilian Field Clinic]',
      weaponDesc: '中立戰地醫療院所 · 嚴禁實彈射擊 · 誤擊遭軍法懲處 -15 CP',
      pos: { x: 7400, y: 7700 },
      health: 2600,
      armor: 0.30,
      side: 'neutral',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'neutral-town-quangtri',
      type: 'town',
      name: '廣治古城集鎮聚落 [Quang Tri Citadel Town]',
      weaponDesc: '古老城牆與瓦舍街區 · 提供優秀城市戰掩護與居民集結避難所',
      pos: { x: 8300, y: 4900 },
      health: 4800,
      armor: 0.55,
      side: 'neutral',
      civilianZoneRadius: 220,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'neutral-town-hue',
      type: 'town',
      name: '香江沿岸水鄉聚落市鎮 [Perfume River Town]',
      weaponDesc: '河畔石階市鎮與商行 · 扼守渡河樞紐',
      pos: { x: 7500, y: 6100 },
      health: 4400,
      armor: 0.50,
      side: 'player',
    })
  );
}

/** Era 5: Warsaw Pact S-300, coastal missile and armour positions. */
function addWarsawPactSites(continent: Island): void {
  continent.installations.push(
    // ─── 北約陣營防空與野戰前進陣地 (NATO Forward Air Defense & Staging) ───
    makeInstallation({
      id: 'player-sam-patriot-1',
      type: 'sam_patriot',
      name: 'MIM-104 愛國者 (Patriot PAC-1) 防空飛彈發射營 [NATO Patriot Alpha]',
      weaponDesc: 'AN/MPQ-53 相列雷達導引防空飛彈 · 射程 3800m · 攔截高空高速超音速戰機與反艦/巡弋飛彈',
      pos: { x: 6500, y: 7700 },
      health: 5200,
      armor: 0.60,
      range: 3800,
      reloadTime: 3.2,
      side: 'player',
      isASuWOnly: false,
      samMissilesReady: 16,
      samMaxMissiles: 16,
    }),
    makeInstallation({
      id: 'player-coastal-harpoon-1',
      type: 'coastal_harpoon',
      name: '岸置魚叉反艦飛彈連 (Coastal Harpoon Battery)',
      weaponDesc: 'RGM-84 陸基岸導四聯裝發射車 · 射程 4500m 掠海打擊敵軍主力水面艦隊',
      pos: { x: 6400, y: 7300 },
      health: 4600,
      armor: 0.55,
      range: 4500,
      reloadTime: 24.0,
      side: 'player',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'player-glcm-site-1',
      type: 'glcm_site',
      name: 'BGM-109G 陸射戰斧巡弋飛彈連 (GLCM Gryphon Launcher)',
      weaponDesc: 'TERCOM 地形比對長程對陸巡弋飛彈 · 射程 6000m 精確摧毀敵軍防空雷達與指揮所',
      pos: { x: 6200, y: 7900 },
      health: 4800,
      armor: 0.55,
      range: 6000,
      reloadTime: 36.0,
      side: 'player',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'player-fob-1',
      type: 'forward_fob',
      name: '美陸軍第7軍前進野戰整補基地 (Forward Staging FOB Alpha)',
      weaponDesc: '重型裝甲機步與 AH-64/CH-53 直升機野戰整補基地 · 支援前線突擊',
      pos: { x: 6700, y: 7500 },
      health: 5500,
      armor: 0.60,
      side: 'player',
    }),
    // ─── 華約前沿永備工事與重防禦核心 (Warsaw Pact Forward Fortifications) ───
    makeInstallation({
      id: 'enemy-bunker-alpha',
      type: 'bunker_nest',
      name: '蘇聯近衛裝甲前沿加固反戰車碉堡群 [Fortress Checkpoint Alpha]',
      weaponDesc: '鋼筋混凝土永備暗堡群 · Konkurs 反戰車飛彈與 30mm 機砲封鎖前進通道',
      pos: { x: 8400, y: 5500 },
      angle: -Math.PI / 4,
      health: 5400,
      armor: 0.82,
      range: 1250,
      cooldown: 0.4,
      reloadTime: 1.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-bunker-bravo',
      type: 'bunker_nest',
      name: '富爾達缺口咽喉重型防護堡壘 [Fulda Gap Fortress Strongpoint]',
      weaponDesc: '高厚度防核覆土重型工事 · 扼守歐陸裝甲衝刺核心走廊',
      pos: { x: 8900, y: 4900 },
      angle: -Math.PI / 3,
      health: 5800,
      armor: 0.85,
      range: 1300,
      cooldown: 0.4,
      reloadTime: 1.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-sa10-alpha',
      type: 's300_sam_site',
      name: 'S-300PMU (SA-10 Grumble) 長程區域防空飛彈發射營 [SAM Site 1]',
      weaponDesc: '5V55R 垂直發射長程防空飛彈 · 殺傷半徑 55m · 30N6 翻蓋相列雷達導引 · 攔截高空高速目標',
      pos: { x: 10600, y: 3900 },
      health: 5200,
      armor: 0.60,
      range: 4200,
      cooldown: 0.8,
      reloadTime: 3.2,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-coastal-rubezh-1',
      type: 'coastal_rubezh',
      name: '4K51 邊界 (Rubezh / P-15M) 重型岸防反艦飛彈連',
      weaponDesc: 'KT-161 雙聯自走重型反艦飛彈發射車 · 射程 4800m 封鎖近岸航道',
      pos: { x: 10200, y: 4300 },
      health: 5000,
      armor: 0.65,
      range: 4800,
      reloadTime: 28.0,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-scud-battery-1',
      type: 'scud_site',
      name: '9K72 飛毛腿-B (Scud-B / R-17) 重型戰術彈道飛彈營 [SSM Site Fulda]',
      weaponDesc: 'MAZ-543 重型 8x8 發射車 · 射程 6500m · 裝載 985kg 高爆彈頭超高空彈道飛彈 · 呼叫愛國者 PAC-2 反導攔截！',
      pos: { x: 11200, y: 3500 },
      health: 5600,
      armor: 0.60,
      range: 6500,
      reloadTime: 34.0,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-fan-song',
      type: 'fan_song_radar',
      name: '30N6 (Flap Lid) 相控陣追蹤與制導雷達車陣地 [30N6 Phased Array]',
      weaponDesc: 'X頻段相列雷達 · 具備全方位多目標追蹤 · AGM-88 HARM 反輻射飛彈首要壓制目標',
      pos: { x: 10400, y: 3700 },
      health: 3500,
      armor: 0.48,
      range: 5200,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'enemy-sa10-bravo',
      type: 's300_sam_site',
      name: 'Buk-M1 (SA-11 Gadfly) 中程防空飛彈營 [SAM Site 2]',
      weaponDesc: '9M38M1 半主動雷達導引野戰防空飛彈 · 多通道機動攔截',
      pos: { x: 11400, y: 3100 },
      health: 4400,
      armor: 0.58,
      range: 3200,
      cooldown: 0.9,
      reloadTime: 3.0,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-tunguska-1',
      type: 'flak_battery',
      name: '2K22 通古斯卡 (Tunguska) 彈砲合一防空陣地',
      weaponDesc: '雙聯 30mm 2A38 極速機砲 + 9M311 激光束制導防空飛彈 · 極密低空火網',
      pos: { x: 10800, y: 3400 },
      health: 3800,
      armor: 0.58,
      range: 1550,
      cooldown: 0.35,
      reloadTime: 0.7,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-sa3-pechora-era5',
      type: 'sa3_sam_site',
      name: 'S-125M 伯朝拉 (SA-3B Goa) 低空防空飛彈發射營 [Pechora Site]',
      weaponDesc: '雙聯/四聯裝 5V27 固體防空飛彈 · SNR-125 低空鎖定雷達 · 專剋超低空突防攻擊機',
      pos: { x: 9650, y: 4050 },
      angle: -Math.PI / 4,
      health: 4000,
      armor: 0.54,
      range: 2900,
      cooldown: 1.0,
      reloadTime: 3.4,
      side: 'enemy',
      samMissilesReady: 8,
      samMaxMissiles: 8,
    }),
    // ─── 歐戰戰略據點與工業樞紐 (Cold War Logistics & Redut AShM) ───
    makeInstallation({
      id: 'neutral-plantation-1',
      type: 'rubber_plantation',
      name: '北德平原農業集體農莊與糧食儲備倉 [Collective Granary]',
      weaponDesc: '歐陸開闊農業合作社與糧庫 · 奪佔提供戰術補給 (+20 CP)',
      pos: { x: 7800, y: 6200 },
      health: 3800,
      armor: 0.45,
      side: 'neutral',
      civilianZoneRadius: 200,
    }),
    makeInstallation({
      id: 'neutral-ferry-1',
      type: 'river_ferry',
      name: '易北河戰略重型渡河舟橋碼頭 [Elbe River Pontoon Ferry]',
      weaponDesc: '重裝甲舟橋渡口 · 奪佔可快速通過裝甲師主戰戰車',
      pos: { x: 8200, y: 4200 },
      angle: Math.PI / 2,
      health: 4200,
      armor: 0.50,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'neutral-radio-1',
      type: 'radio_station',
      name: '布羅肯峰微波雷達與通信中繼鐵塔 [Brocken SIGINT Station]',
      weaponDesc: '北約/華約電子監聽與通信截收站 · 奪佔提升全圖雷達精度與早期預警',
      pos: { x: 9400, y: 6000 },
      health: 3200,
      armor: 0.42,
      range: 4800,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'enemy-radio-relay',
      type: 'radio_station',
      name: '華約前線第16航空軍通信指揮總樞紐 [Air Army C3I Station]',
      weaponDesc: '蘇聯前線航空兵雷達通信指揮所 · 摧毀可瓦解敵方空中攔截協同',
      pos: { x: 10900, y: 3900 },
      health: 3400,
      armor: 0.45,
      range: 4500,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'neutral-cache-1',
      type: 'ammo_cache',
      name: '北約第5軍前進彈藥與燃料儲運棧 (Forward Refueling Point)',
      weaponDesc: '北約前沿儲備庫 · 佔領即刻補滿周邊友軍部隊彈藥與油料',
      pos: { x: 7300, y: 6500 },
      health: 3400,
      armor: 0.38,
      side: 'player',
    }),
    makeInstallation({
      id: 'enemy-cache-2',
      type: 'ammo_cache',
      name: '蘇聯西部戰區前線油料與火箭彈總庫 [Frontline Logistics Depot]',
      weaponDesc: '加固掩體庫區 · 儲備大量 BM-21 122mm 火箭彈與 152mm 砲彈',
      pos: { x: 9800, y: 5700 },
      health: 3800,
      armor: 0.42,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'neutral-clinic-1',
      type: 'settlement',
      name: '西德紅十字會戰地人道救護站 [Red Cross Field Hospital]',
      weaponDesc: '中立戰地醫療院所 · 嚴禁實彈射擊 · 誤擊遭軍法懲處 -15 CP',
      pos: { x: 7400, y: 7700 },
      health: 3000,
      armor: 0.35,
      side: 'neutral',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'neutral-town-quangtri',
      type: 'town',
      name: '漢諾威交通十字路口重鎮 [Hannover Crossroads Town]',
      weaponDesc: '鐵路與高速公路重鎮 · 密集建築提供優秀掩護與居民避難區',
      pos: { x: 8300, y: 4900 },
      health: 5600,
      armor: 0.60,
      side: 'neutral',
      civilianZoneRadius: 220,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'neutral-town-hue',
      type: 'town',
      name: '不萊梅沿河工業市鎮 [Bremen River Town]',
      weaponDesc: '河流交會處重工業市鎮 · 依河而建街道 · 提供優秀防護掩體',
      pos: { x: 7500, y: 6100 },
      health: 5200,
      armor: 0.55,
      side: 'player',
      civilianZoneRadius: 190,
      isCivilian: true,
    })
  );
}

// ══════════════════════════════════════════════════════════
// 大陸板塊城鎮、平民定居點與難民收容營 (Civilian Zones & Urban Terrain)
// 進入城鎮市區戰鬥獲 +50% 直射掩護與 70% 空襲炸彈減傷；
// 若我方砲火誤擊平民區或難民營，將遭受附帶損害懲處 (-15 CP)
// ══════════════════════════════════════════════════════════
/** Towns, villages and refugee camps that grant urban cover and carry collateral-damage penalties. */
function addMainlandCivilianZones(era: Era, continent: Island): void {
  continent.installations.push(
    // 1. 大型城市 (City - 280m 掩蔽半徑)
    makeInstallation({
      id: 'city-wonsan',
      type: 'city',
      name: '元山市核心市區 (City of Wonsan)',
      weaponDesc: '沿海港埠大城市 · 密集混凝土建築與街區 · 部隊進駐享 +50%防禦掩護與 70%空襲減傷',
      pos: { x: 6800, y: 6400 },
      health: 7000,
      armor: 0.65,
      side: 'player',
      civilianZoneRadius: 280,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'city-hamhung',
      type: 'city',
      name: '咸興工業市街 (Hamhung City District)',
      weaponDesc: '中央重工業與鐵路樞紐城市 · 密集廠房與街區 · 提供優秀城市戰掩體',
      pos: { x: 9200, y: 4500 },
      health: 6500,
      armor: 0.65,
      side: 'enemy',
      civilianZoneRadius: 260,
      isCivilian: true,
    }),
    // 2. 城鎮 (Town - 200m 掩蔽半徑)
    makeInstallation({
      id: 'town-kowon',
      type: 'town',
      name: '高原樞紐集鎮 (Kowon Crossroads Town)',
      weaponDesc: '前線交通十字路口市鎮 · 傳統市集與瓦房區 · 城市戰掩護',
      pos: { x: 7900, y: 5500 },
      health: 4500,
      armor: 0.50,
      side: 'player',
      civilianZoneRadius: 200,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'town-anbyon',
      type: 'town',
      name: '安邊山谷城鎮 (Anbyon Valley Town)',
      weaponDesc: '群山環抱之谷地城鎮 · 依山而建街道 · 阻滯空襲砲火',
      pos: { x: 7300, y: 7200 },
      health: 4200,
      armor: 0.50,
      side: 'player',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    // 3. 沿海定居點 (Settlement - 150m 半徑)
    makeInstallation({
      id: 'settlement-hungnam',
      type: 'settlement',
      name: '興南港沿海漁港定居點 (Hungnam Port Settlement)',
      weaponDesc: '沿岸漁村與碼頭民宅區 · 非軍事打擊目標',
      pos: { x: 6200, y: 5600 },
      health: 3200,
      armor: 0.35,
      side: 'player',
      civilianZoneRadius: 150,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'settlement-tongchon',
      type: 'settlement',
      name: '通川沿海村落 (Tongchon Coastal Village)',
      weaponDesc: '南部沿海漁民村落 · 平民生活居住聚落',
      pos: { x: 6600, y: 8400 },
      health: 3000,
      armor: 0.35,
      side: 'player',
      civilianZoneRadius: 140,
      isCivilian: true,
    }),
    // 4. 戰地難民收容營 (Refugee Camp - 170m 安全區)
    makeInstallation({
      id: 'refugee-hungnam',
      type: 'refugee_camp',
      name: '興南港聯合國戰地難民收容營 (UN Refugee Camp)',
      weaponDesc: '聯合國與紅十字會人道救援帳篷區 · 嚴禁實彈射擊 · 誤擊遭軍法懲處 -15 CP',
      pos: { x: 5900, y: 6600 },
      health: 2600,
      armor: 0.25,
      side: 'player',
      civilianZoneRadius: 170,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'refugee-chongjin',
      type: 'refugee_camp',
      name: '紅十字會前線戰地難民救濟站 (Red Cross Camp)',
      weaponDesc: '國際人道救濟與醫療帳篷站 · 受擊將嚴重損害盟軍國際聲譽 (-15 CP)',
      pos: { x: 7600, y: 8000 },
      health: 2400,
      armor: 0.25,
      side: 'player',
      civilianZoneRadius: 160,
      isCivilian: true,
    }),
    // ══════════════════════════════════════════════════════════
    // 大陸全境三層縱深擴展設施群 (Full Continental Multi-Quadrant Installation Network)
    // 涵蓋西南沿海、西北山區、中南渡口、北部樞紐、東北要塞、東南三角洲
    // ══════════════════════════════════════════════════════════
    // 1. 西南沿海灘頭堡與登陸補給設施 (Allied Beachhead & Logistics Expansion)
    makeInstallation({
      id: 'player-deep-pontoon-pier',
      type: 'pontoon_pier',
      name: '美陸軍/海軍工兵沿海重型浮式棧橋碼頭 [Deep-Water Pontoon Pier]',
      weaponDesc: '急造深水浮式卸載碼頭 · 為後續重裝備部隊提供搶灘登陸棧道',
      pos: { x: 5400, y: 7800 },
      angle: -Math.PI / 2,
      health: 4000,
      armor: 0.45,
      side: 'player',
    }),
    makeInstallation({
      id: 'player-amphib-staging',
      type: 'forward_fob',
      name: '第3陸戰遠征軍兩棲灘頭整備前哨 [Amphibious Staging Point]',
      weaponDesc: '兩棲履帶裝甲車 (LVTP) 與直升機出發陣地 · 提供快速前線補給',
      pos: { x: 5700, y: 7100 },
      angle: -Math.PI / 3,
      health: 3800,
      armor: 0.48,
      side: 'player',
    }),
    makeInstallation({
      id: 'player-coastal-radar-picket',
      type: 'radar_station',
      name: '海軍 SPS-10 沿海警戒與水面搜索雷達哨 [Coastal Radar Picket]',
      weaponDesc: '高靈敏度水面與超低空雷達哨 · 預警越海突襲之敵方魚雷艇與快艇',
      pos: { x: 5300, y: 8300 },
      angle: -Math.PI / 2,
      health: 2600,
      armor: 0.35,
      range: 4200,
      side: 'player',
    }),
    // 2. 中央爭奪帶與戰略交通公路節點 (Central Belt & Transport Corridor)
    makeInstallation({
      id: 'cont-route9-checkpoint',
      type: 'watchtower',
      name: '9號戰略公路十字路口檢查哨所 [Route 9 Highway Checkpoint]',
      weaponDesc: '戰略東西橫貫要道咽喉 · 奪佔可封鎖全線敵軍輪式裝甲機動',
      pos: { x: 8800, y: 5800 },
      health: 2200,
      armor: 0.32,
      range: 980,
      cooldown: 0.5,
      reloadTime: 1.2,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'cont-hydroelectric-dam',
      type: 'radio_station',
      name: '中央河流石灰岩水力發電與水閘機房 [Hydroelectric Dam Station]',
      weaponDesc: '混凝土堅固水壩樞紐 · 佔領掌控全區電力與戰術通訊中繼 (+20 CP)',
      pos: { x: 8500, y: 7100 },
      health: 4500,
      armor: 0.65,
      side: 'neutral',
    }),
    makeInstallation({
      id: 'cont-buddhist-pagoda',
      type: 'settlement',
      name: '山林避難古佛寺與僧侶禪院 [Mountain Pagoda Sanctuary]',
      weaponDesc: '石砌高山避難古剎 · 嚴禁砲擊 · 誤擊遭軍法懲處 -15 CP',
      pos: { x: 9300, y: 6400 },
      health: 3200,
      armor: 0.40,
      side: 'neutral',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'cont-valley-fuel-depot',
      type: 'ammo_cache',
      name: '中央深谷油料分裝與轉運棧 [Valley Fuel Logistics Hub]',
      weaponDesc: '林間地下儲油槽群 · 奪佔可補滿周邊友軍部隊彈藥與油料',
      pos: { x: 7600, y: 5200 },
      health: 3000,
      armor: 0.35,
      side: 'player',
    }),
    // 3. 西北高山與密林補給軸線 (Northwestern Mountain Ridge & Outposts)
    makeInstallation({
      id: 'opfor-nw-acoustic-post',
      type: 'radar_station',
      name: '西北山脈對空聽音雷達與防空觀測哨 [NW Mountain Radar Post]',
      weaponDesc: '高山之巔早期雷達監控陣列 · 監控西北峽谷超低空突防戰機',
      pos: { x: 7200, y: 3600 },
      health: 2600,
      armor: 0.38,
      range: 4500,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'opfor-upper-barge-depot',
      type: 'ammo_depot',
      name: '北部上游河運駁船水運集結站 [Upper River Barge Depot]',
      weaponDesc: '內河小型武裝艀船集結碼頭 · 堆積 82mm 迫擊砲彈與反坦克火箭',
      pos: { x: 8000, y: 3200 },
      health: 3400,
      armor: 0.45,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'opfor-nw-workshop-tunnel',
      type: 'hidden_tunnel',
      name: '西北隱蔽山體修配廠與裝甲整備坑道 [NW Mountain Tunnel Workshop]',
      weaponDesc: '岩洞內部戰車搶修與彈藥分裝廠 · 可出動裝甲步兵反突擊',
      pos: { x: 8700, y: 2800 },
      health: 4000,
      armor: 0.75,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'opfor-upper-s60-flak',
      type: 'flak_battery',
      name: 'S-60 57mm 自動高射砲山谷防空陣地 [NW Valley S-60 AA]',
      weaponDesc: '隱蔽於河谷隘口之速射防空高砲 · 壓制穿行峽谷之低空戰轟機',
      pos: { x: 7600, y: 2600 },
      angle: Math.PI / 4,
      health: 2800,
      armor: 0.45,
      range: 1250,
      cooldown: 0.5,
      reloadTime: 1.1,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'opfor-nw-ridge-bunker',
      type: 'bunker_nest',
      name: '西北稜線制高點重機槍加固掩體 [NW Ridge Bunker Nest]',
      weaponDesc: '雙層石砌暗堡 · 俯瞰山麓公路 · 形成交叉殺傷火網',
      pos: { x: 9300, y: 3400 },
      angle: -Math.PI / 3,
      health: 4800,
      armor: 0.78,
      range: 1100,
      cooldown: 0.4,
      reloadTime: 1.1,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'neutral-nw-mountain-village',
      type: 'settlement',
      name: '北部高山少數民族梯田村寨 [Highland Terraced Village]',
      weaponDesc: '高山田園聚落 · 住民自給自足 · 屬中立平民安全保護區',
      pos: { x: 8400, y: 2200 },
      health: 2800,
      armor: 0.32,
      side: 'neutral',
      civilianZoneRadius: 170,
      isCivilian: true,
    }),
    // 4. 北部與東北深層要塞群擴展 (Northern & NE Deep Bastions)
    makeInstallation({
      id: 'opfor-sa2-charlie',
      type: 'sa2_sam_site',
      name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Charlie]',
      weaponDesc: '北部縱深防空陣列 · 6座傾斜發射架 · 封鎖北方高空進襲通道',
      pos: { x: 10600, y: 2300 },
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      samMissilesReady: 6,
      samMaxMissiles: 6,
    }),
    makeInstallation({
      id: 'opfor-sa3-neva-1',
      type: 'sa3_sam_site',
      name: 'S-125 涅瓦河 (SA-3 Goa) 低空防空飛彈發射營 [SAM Neva]',
      weaponDesc: '蘇援四聯裝 5V27 防空飛彈營 · SNR-125 低空反干擾雷達 · 嚴密攔截低空突防攻擊機群',
      pos: { x: 9600, y: 4200 },
      angle: -Math.PI / 4,
      health: 3900,
      armor: 0.54,
      range: 2700,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      samMissilesReady: 8,
      samMaxMissiles: 8,
    }),
    makeInstallation({
      id: 'opfor-tunnel-3-north',
      type: 'hidden_tunnel',
      name: '東北花崗岩反擊機動坑道網絡 [No.3 北部出擊口]',
      weaponDesc: '連結司令部後方之地下坑道網 · 快速出動精銳突擊隊',
      pos: { x: 11800, y: 2600 },
      health: 3800,
      armor: 0.72,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'opfor-ml20-heavy-arty',
      type: 'towed_artillery',
      name: 'ML-20 152mm 重型加農榴彈砲縱深陣地 [152mm Heavy Battery]',
      weaponDesc: '重裝甲覆土砲位 · 43.5kg 高爆破片彈極遠射程反制美軍登陸灘頭',
      pos: { x: 11500, y: 4100 },
      angle: (Math.PI * 3) / 4,
      health: 3600,
      armor: 0.55,
      range: 1750,
      cooldown: 1.2,
      reloadTime: 3.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'opfor-rail-freight-yard',
      type: 'ammo_depot',
      name: '遠東戰略鐵路編組調度站與重裝甲集結場 [Rail Logistics Yard]',
      weaponDesc: '北部軍事鐵道幹線終點樞紐 · 吊運 T-54 戰車與蘇製軍火彈藥',
      pos: { x: 10300, y: 1900 },
      health: 4800,
      armor: 0.60,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'opfor-ne-coastal-casemate',
      type: 'coastal_gun',
      name: '東北角 130mm B-13 岸防加農砲台掩體 [NE Coastal Casemate]',
      weaponDesc: '重型岸防花崗岩半地下砲塔 · 扼守北部灣外海深水航道',
      pos: { x: 12400, y: 2800 },
      angle: Math.PI / 4,
      health: 4200,
      armor: 0.70,
      range: 2000,
      cooldown: 1.2,
      reloadTime: 3.2,
      side: 'enemy',
      isASuWOnly: true,
    }),
    // 5. 東部與東南部三角洲與沿海水網 (Eastern & SE Coastal Deltas)
    makeInstallation({
      id: 'neutral-east-delta-port',
      type: 'settlement',
      name: '東部三角洲海口漁港定居點 [Eastern Delta Fishing Port]',
      weaponDesc: '沿海木造漁船與水上民家聚落 · 平民生活漁業港',
      pos: { x: 12100, y: 5200 },
      health: 3200,
      armor: 0.35,
      side: 'neutral',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'opfor-se-estuary-watch',
      type: 'watchtower',
      name: '東南入海口警戒木質瞭望哨 [SE River Estuary Watchtower]',
      weaponDesc: '隱蔽河口灌木叢中之警戒崗哨 · 配備高倍率光學測距鏡',
      pos: { x: 11300, y: 6400 },
      health: 1900,
      armor: 0.25,
      range: 920,
      cooldown: 0.5,
      reloadTime: 1.2,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'neutral-se-rice-hamlet',
      type: 'settlement',
      name: '東南部湄公河支流水稻農莊農舍群 [SE Delta Rice Farm Hamlet]',
      weaponDesc: '阡陌水田與茅草農舍農莊 · 農業平民區 · 誤擊遭軍法懲處 -15 CP',
      pos: { x: 10600, y: 7200 },
      health: 3000,
      armor: 0.30,
      side: 'neutral',
      civilianZoneRadius: 160,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'opfor-dune-dshk',
      type: 'flak_battery',
      name: '東南沿岸沙丘 DShK 12.7mm 重機槍伏擊陣地 [Sand Dune AA]',
      weaponDesc: '半埋於海濱白沙丘之防空機槍位 · 射擊低空穿梭偵察機',
      pos: { x: 11700, y: 6000 },
      angle: -Math.PI / 4,
      health: 2200,
      armor: 0.38,
      range: 1000,
      cooldown: 0.3,
      reloadTime: 0.9,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-se-delta-ferry',
      type: 'river_ferry',
      name: '東南水網裝甲渡河浮橋與艀船碼頭 [SE Delta Pontoon Ferry]',
      weaponDesc: '連接東南部各孤立沙洲之鋼製渡船浮橋 · 奪佔加速水網穿梭',
      pos: { x: 10000, y: 7000 },
      angle: Math.PI / 4,
      health: 3500,
      armor: 0.45,
      side: 'neutral',
    }),
    // ══════════════════════════════════════════════════════════
    // 廣域分散式前哨雷達、防空與海防據點 (Wide-Area Dispersed Radars, SAM/Flak & Coastal Guns)
    // 依使用者指示擴展兩倍設施，覆蓋外圍海防、谷地隘口與戰略高地
    // ══════════════════════════════════════════════════════════
    // 1. 廣域早期預警雷達與火控導引陣地
    makeInstallation({
      id: 'opfor-p12-radar',
      type: 'radar_station',
      name: 'P-12 匙架 (Spoon Rest) 早期對空預警雷達哨 [Coast Sector Picket]',
      weaponDesc: '沿海中程預警與目標指示雷達天線陣列 · 監控北部灣低空海面空情',
      pos: { x: 6200, y: 4700 },
      angle: -Math.PI / 3,
      health: 2600,
      armor: 0.38,
      range: 4600,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'opfor-p14-radar',
      type: 'radar_station',
      name: 'P-14 巨王 (Tall King) 遠程米波全方位早期預警雷達站 [NE Deep Radar]',
      weaponDesc: '巨型拋物面天線超遠程警戒雷達 · 監控5000m外高空噴射打擊群',
      pos: { x: 12400, y: 2500 },
      health: 3200,
      armor: 0.45,
      range: 5200,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'opfor-prv11-height-finder',
      type: 'radar_station',
      name: 'PRV-11 邊網 (Side Net) 仰角測高雷達陣地 [Height-Finder Radar]',
      weaponDesc: '高精度仰角俯仰掃描雷達 · 為高空防空飛彈提供精確目標高度數據',
      pos: { x: 10600, y: 3500 },
      health: 2800,
      armor: 0.40,
      range: 4800,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    // 2. 廣域防空飛彈與重型防空火砲群 (SAM & Heavy AAA)
    makeInstallation({
      id: 'enemy-sa2-charlie',
      type: 'sa2_sam_site',
      name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Charlie - 南部谷地]',
      weaponDesc: '南部交通走廊中程地空飛彈陣地 · 攔截穿越南部山谷空域之攻擊機',
      pos: { x: 9100, y: 6100 },
      angle: -Math.PI / 4,
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-sa2-delta',
      type: 'sa2_sam_site',
      name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Delta - 東北要塞]',
      weaponDesc: '要塞東北翼重型防空飛彈連 · 封鎖外海方向高空侵入戰機',
      pos: { x: 12200, y: 3300 },
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'enemy-shilka-2',
      type: 'flak_battery',
      name: 'ZSU-23-4 石勒喀河四聯裝23mm防空機砲連 [Central Escort]',
      weaponDesc: '機動雷達火控四管極高射速機砲 · 伴隨掩護公路補給車隊',
      pos: { x: 9400, y: 5300 },
      health: 3200,
      armor: 0.52,
      range: 1250,
      cooldown: 0.4,
      reloadTime: 0.8,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-cont-ks19-3',
      type: 'flak_battery',
      name: 'KS-19 100mm 重型防空砲第3連 [Ridge Battery 3]',
      weaponDesc: '山脊加固掩體 100mm 重型高平砲 · 攔截高空水平轟炸機',
      pos: { x: 8800, y: 3800 },
      angle: Math.PI / 4,
      health: 3600,
      armor: 0.58,
      range: 1500,
      cooldown: 0.7,
      reloadTime: 1.5,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-cont-s60-3',
      type: 'flak_battery',
      name: 'S-60 57mm 自動防空高射砲連 [Delta River Mouth AA]',
      weaponDesc: '三角洲入海口速射高射砲 · 封鎖低空突防與直升機突擊機降',
      pos: { x: 6700, y: 4600 },
      angle: -Math.PI / 4,
      health: 3000,
      armor: 0.50,
      range: 1250,
      cooldown: 0.6,
      reloadTime: 1.1,
      side: 'enemy',
    }),
    // 3. 廣域海岸要塞加農砲台 (Coastal Defense Batteries)
    makeInstallation({
      id: 'enemy-sontra-gun',
      type: 'coastal_gun',
      name: 'SM-4-1 130mm 沿海要塞重砲台 [Son Tra Headland Battery]',
      weaponDesc: '懸崖花崗岩半地下重型長管岸防砲 · 封鎖北部灣深海航道',
      pos: { x: 5700, y: 4600 },
      angle: -Math.PI / 3,
      health: 4500,
      armor: 0.70,
      range: 1950,
      cooldown: 1.4,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-south-coastal',
      type: 'coastal_gun',
      name: 'B-13 130mm 隱蔽岸防砲台 [South Delta Coastal Battery]',
      weaponDesc: '南端沿岸沙洲偽裝重砲堡 · 阻擊美軍兩棲戰車與驅逐艦搶灘',
      pos: { x: 5600, y: 8900 },
      angle: -Math.PI / 2,
      health: 4200,
      armor: 0.65,
      range: 1850,
      cooldown: 1.5,
      reloadTime: 3.6,
      side: 'enemy',
      isASuWOnly: true,
    }),
    // 4. 前沿指揮、微波通訊與野戰後勤樞紐
    makeInstallation({
      id: 'enemy-fwd-cp-valley',
      type: 'command_post',
      name: '北越人民軍前沿營級加固地下指揮所 [Valley CP Echo]',
      weaponDesc: '峽谷隘口堅固防爆指揮堡 · 調度沿線伏擊暗堡與防空部隊',
      pos: { x: 8100, y: 4400 },
      health: 4800,
      armor: 0.72,
      range: 900,
      cooldown: 0.6,
      reloadTime: 1.4,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'enemy-river-torpedo-base',
      type: 'forward_fob',
      name: '內河武裝巡邏艇與魚雷快艇整備浮箱水門 [River Patrol Pier]',
      weaponDesc: '隱蔽河道水運前進母港 · 整備小型水面突擊巡邏艇',
      pos: { x: 7000, y: 4700 },
      angle: -Math.PI / 4,
      health: 3800,
      armor: 0.45,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-microwave-relay',
      type: 'radio_station',
      name: '中央高地微波戰術通信中繼鐵塔 [Ridge Relay Tower]',
      weaponDesc: '山脊鋼構微波通訊天線 · 連接各前線暗堡與司令部通信網',
      pos: { x: 9500, y: 4400 },
      health: 3200,
      armor: 0.40,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'enemy-underground-fuel',
      type: 'ammo_depot',
      name: '分散式山體地下輸油與彈藥分裝庫 [Dispersed POL Depot]',
      weaponDesc: '岩體深埋油料儲存槽群 · 支援要塞前沿機動裝甲裝備',
      pos: { x: 10100, y: 3800 },
      health: 4200,
      armor: 0.68,
      side: 'enemy',
    }),
    // 5. 盟軍外圍增援防空與長程重火砲陣地
    makeInstallation({
      id: 'player-sam-hawk-2',
      type: 'sam_hawk',
      name: 'MIM-23 鷹式 (Hawk) 地面防空飛彈第2連 [Hawk Battery Bravo]',
      weaponDesc: '峴港外圍前進防空連 · 攔截低空突破之敵機',
      pos: { x: 5900, y: 7900 },
      health: 4200,
      armor: 0.55,
      range: 2600,
      reloadTime: 3.5,
      side: 'player',
      isASuWOnly: false,
      samMissilesReady: 12,
      samMaxMissiles: 12,
    }),
    makeInstallation({
      id: 'player-long-tom-175',
      type: 'towed_artillery',
      name: '美陸軍 M107 175mm 長射程自走加農砲連 [Long Tom Battery]',
      weaponDesc: '超遠程加農重砲 · 跨越山體壓制敵方後方砲兵陣地與暗堡群',
      pos: { x: 6100, y: 7400 },
      angle: -Math.PI / 4,
      health: 3400,
      armor: 0.55,
      range: 2100,
      cooldown: 1.4,
      reloadTime: 3.8,
      side: 'player',
      isASuWOnly: true,
    }),
    // ══════════════════════════════════════════════════════════
    // 北部戰略扇區 (North Continental Sector: Y: 1000 ~ 3500)
    // 依時代背景原型：時代三為朝鮮半島蓋馬高原/長津湖；時代四為越南紅河三角洲/諒山隘口
    // ══════════════════════════════════════════════════════════
    // 【北部沿海海防】
    makeInstallation({
      id: 'cont-north-coastal-battery',
      type: 'coastal_gun',
      name: era === 'era4'
        ? 'SM-4-1 130mm 沿海要塞重砲台 [Do Son / North Headland Battery]'
        : 'B-13 130mm 興南/元山北部要塞重砲台 [Hungnam Coastal Fort]',
      weaponDesc: '北部海岸花崗岩地下重型長管岸防砲 · 封鎖外海登陸航道',
      pos: { x: 5350, y: 1750 },
      angle: -Math.PI / 3,
      health: 4600,
      armor: 0.72,
      range: 2000,
      cooldown: 1.5,
      reloadTime: 3.6,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-north-patrol-pier',
      type: 'river_ferry',
      name: era === 'era4'
        ? '紅河入海口武裝巡邏快艇隱蔽整備水門 [Red River Patrol Pier]'
        : '咸興外海魚雷快艇隱蔽整備浮箱碼頭 [Hamhung Torpedo Pier]',
      weaponDesc: '北部隱蔽河口水運前進母港 · 整備快艇與沿河伏擊巡邏',
      pos: { x: 5250, y: 2600 },
      angle: -Math.PI / 4,
      health: 3800,
      armor: 0.45,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-north-coast-radar',
      type: 'radar_station',
      name: 'P-10/SCR-584 北方海防搜索雷達警戒哨 [North Shore Radar]',
      weaponDesc: '北部海岸高處對海搜索天線 · 指引要塞重砲鎖定登陸艦艇',
      pos: { x: 5150, y: 1100 },
      angle: -Math.PI / 3,
      health: 2700,
      armor: 0.38,
      range: 4500,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    // 【北部中前線暗堡與要塞】
    makeInstallation({
      id: 'cont-north-valley-fortress',
      type: 'bunker_nest',
      name: era === 'era4'
        ? '諒山隘口地下花崗岩要塞堡壘群 [Lang Son Border Fortress]'
        : '長津湖峽谷地下永備坑道碉堡群 [Chosin Highlands Bunker Complex]',
      weaponDesc: '抗航彈重裝甲花崗岩碉堡樞紐 · 扼守北部縱深交通命脈',
      pos: { x: 8400, y: 1700 },
      health: 5200,
      armor: 0.76,
      range: 1200,
      cooldown: 0.8,
      reloadTime: 2.0,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-north-sa2-echo',
      type: 'sa2_sam_site',
      name: era === 'era4'
        ? 'SA-2 導針 (Guideline) 地空防空飛彈營 [SAM Echo - 北部隘口]'
        : 'KS-19 100mm 雷達導引重高射砲連 [North Pass Heavy Flak]',
      weaponDesc: '北部邊界高空防空網核心 · 攔截自北方突入之空襲大編隊',
      pos: { x: 9200, y: 1550 },
      health: 3900,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'cont-north-flak-s60',
      type: 'flak_battery',
      name: 'S-60 57mm 自動防空高射砲連 [North Ridge AA]',
      weaponDesc: '北部山脊速射高砲 · 壓制近距低空密接支援攻擊機',
      pos: { x: 8100, y: 2750 },
      angle: -Math.PI / 4,
      health: 3100,
      armor: 0.50,
      range: 1300,
      cooldown: 0.6,
      reloadTime: 1.2,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-north-tunnel-spawner',
      type: 'hidden_tunnel',
      name: era === 'era4'
        ? '北緯21度地下多層突擊坑道網 [North Border Tunnel Hub]'
        : '蓋馬高原地下步兵伏擊坑道 [Kaema Plateau Ambush Tunnel]',
      weaponDesc: '深層地下步兵坑道出生點 · 源源不斷投入戰術游擊奇襲部隊',
      pos: { x: 8900, y: 2300 },
      health: 3500,
      armor: 0.65,
      side: 'enemy',
    }),
    // 【北部縱深長程雷達與後勤兵站】
    makeInstallation({
      id: 'cont-north-deep-p14',
      type: 'radar_station',
      name: 'P-14 巨王 (Tall King) 遠程對空情報雷達第1站 [North Hinterland Early Warning]',
      weaponDesc: '北部深山大型拋物面預警雷達 · 監控北部邊陲全部空域動態',
      pos: { x: 12200, y: 1300 },
      health: 3300,
      armor: 0.45,
      range: 5200,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'cont-north-ammo-depot',
      type: 'ammo_depot',
      name: era === 'era4'
        ? '太原岩體縱深特重型地下彈藥總庫 [Thai Nguyen Deep POL/Ammo Depot]'
        : '江界地下戰略軍火儲備總庫 [Kanggye Mountain Arsenal]',
      weaponDesc: '北部戰區總後勤樞紐 · 儲存數百噸砲彈、航空火箭與燃料油槽',
      pos: { x: 12900, y: 2100 },
      health: 4400,
      armor: 0.70,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-north-hq-cp',
      type: 'command_post',
      name: era === 'era4'
        ? '北越第一軍區後方地下指揮司令部 [1st Military Region Underground HQ]'
        : '北方聯軍後方戰略地下前指部 [Northern Front Hinterland HQ]',
      weaponDesc: '北部方面軍最高地下指揮所 · 調度整條北線所有防空砲火與裝甲車隊',
      pos: { x: 11600, y: 1650 },
      health: 5000,
      armor: 0.75,
      range: 950,
      cooldown: 0.6,
      reloadTime: 1.4,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-north-town',
      type: 'town',
      name: era === 'era4'
        ? '高平-諒山邊界商貿城鎮 [Border Trade Town]'
        : '江界山城物流集散要地 [Kanggye Mountain Town]',
      weaponDesc: '平民居民聚落與山城集市 · 提供城鎮戰掩體',
      pos: { x: 10400, y: 2100 },
      health: 3600,
      armor: 0.40,
      side: 'neutral',
      civilianZoneRadius: 200,
      isCivilian: true,
    }),

    // ══════════════════════════════════════════════════════════
    // 南部戰略扇區 (South Continental Sector: Y: 9500 ~ 13800)
    // 依時代背景原型：時代三為洛東江/釜山防禦圈；時代四為湄公河三角洲/鐵三角/古芝
    // ══════════════════════════════════════════════════════════
    // 【南部沿海海防】
    makeInstallation({
      id: 'cont-south-coastal-battery',
      type: 'coastal_gun',
      name: era === 'era4'
        ? 'B-13 130mm 湄公海角地下岸防重砲堡 [Mekong Cape Heavy Coastal Gun]'
        : '155mm 釜山防禦圈海防要塞重砲台 [Pusan Perimeter Cape Battery]',
      weaponDesc: '突向外海沙嘴要塞重砲 · 射擊南方水面艦艇與兩棲登陸浮船塢',
      pos: { x: 5450, y: 11400 },
      angle: -Math.PI / 2,
      health: 4400,
      armor: 0.68,
      range: 1950,
      cooldown: 1.4,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-south-amphib-dock',
      type: 'pontoon_pier',
      name: '盟軍南部兩棲卸載浮箱棧橋 [Allied South Amphibious Pier]',
      weaponDesc: '友軍工兵搶建浮動棧橋 · 建立南部補給線與裝甲卸載',
      pos: { x: 5350, y: 12500 },
      health: 4500,
      armor: 0.50,
      side: 'player',
    }),
    makeInstallation({
      id: 'cont-south-shore-radar',
      type: 'radar_station',
      name: 'SPS-10 / SCR-584 南部沿海對海警戒雷達站 [South Shore Radar Picket]',
      weaponDesc: '南方岬角沿岸對海早期預警雷達 · 監測南部深水海域',
      pos: { x: 5250, y: 10200 },
      angle: -Math.PI / 2,
      health: 2800,
      armor: 0.40,
      range: 4600,
      side: 'player',
      isRadarEmitting: true,
    }),
    // 【南部中前線暗堡與要塞】
    makeInstallation({
      id: 'cont-south-bunker-complex',
      type: 'bunker_nest',
      name: era === 'era4'
        ? '鐵三角/古芝深層地下坑道指揮所與暗堡群 [Iron Triangle / Cu Chi Complex]'
        : '洛東江突出部反斜面堅固碉堡群 [Naktong Bulge Bunker Bastion]',
      weaponDesc: '地下多層加固掩體 · 機槍與無後座力砲封鎖交叉路口',
      pos: { x: 8300, y: 11200 },
      health: 5000,
      armor: 0.74,
      range: 1100,
      cooldown: 0.7,
      reloadTime: 1.8,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-south-sam-site',
      type: 'sa2_sam_site',
      name: era === 'era4'
        ? 'SA-2 導針 (Guideline) 地空防空飛彈營 [SAM Foxtrot - 南部走廊]'
        : 'S-60 57mm 雷達火控防空高射砲連 [South Flak Battery]',
      weaponDesc: '南線空中防禦核心 · 掩護南部重要水網渡口與城鎮',
      pos: { x: 9200, y: 10600 },
      health: 3800,
      armor: 0.52,
      range: 2400,
      cooldown: 1.0,
      reloadTime: 3.5,
      side: 'enemy',
      isASuWOnly: false,
    }),
    makeInstallation({
      id: 'cont-south-fob',
      type: 'forward_fob',
      name: era === 'era4'
        ? '美軍第1空中騎兵師前進火力基地 (FSB) [Fire Support Base Delta]'
        : '美第8軍團前進砲兵與野戰醫院樞紐 [8th Army Forward Artillery Hub]',
      weaponDesc: '南翼前線堅固火力堡壘 · 部署 105mm/155mm 重榴彈砲群支援反擊',
      pos: { x: 8800, y: 12200 },
      health: 4800,
      armor: 0.60,
      range: 1800,
      cooldown: 1.2,
      reloadTime: 3.2,
      side: 'player',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-south-hawk-site',
      type: 'sam_hawk',
      name: era === 'era4'
        ? 'MIM-23 鷹式 (Hawk) 地面防空飛彈第3連 [Hawk Battery Charlie]'
        : 'M42 清道夫雙管40mm防空自走砲陣地 [Duster AA Position]',
      weaponDesc: '盟軍南翼主力防空陣地 · 攔截穿越南部走廊的突擊敵機',
      pos: { x: 7700, y: 10400 },
      health: 4200,
      armor: 0.55,
      range: 2600,
      reloadTime: 3.5,
      side: 'player',
      isASuWOnly: false,
      samMissilesReady: 12,
      samMaxMissiles: 12,
    }),
    makeInstallation({
      id: 'cont-south-city',
      type: 'city',
      name: era === 'era4'
        ? '芹苴三角洲核心水運重鎮市區 [Can Tho Delta City]'
        : '大邱前線後勤核心都會區 [City of Daegu Logistics Hub]',
      weaponDesc: '南部最大都市與商業碼頭核心 · 密集成排混凝土建築群提供最高城市戰掩蔽',
      pos: { x: 7900, y: 10800 },
      health: 5500,
      armor: 0.50,
      side: 'neutral',
      civilianZoneRadius: 280,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'cont-south-town',
      type: 'town',
      name: era === 'era4'
        ? '美萩繁榮河港城鎮 [My Tho River Town]'
        : '慶州歷史要塞城鎮 [Gyeongju Fortress Town]',
      weaponDesc: '南線繁華市集與河港要津 · 居民避難區',
      pos: { x: 8600, y: 12800 },
      health: 3800,
      armor: 0.42,
      side: 'neutral',
      civilianZoneRadius: 190,
      isCivilian: true,
    }),
    makeInstallation({
      id: 'cont-south-refugee',
      type: 'refugee_camp',
      name: '聯合國戰地難民臨時庇護營 [UN South Refugee Humanitarian Shelter]',
      weaponDesc: '聯合國人道救援與戰地醫療帳篷群 · 嚴禁砲擊誤傷 -15 CP',
      pos: { x: 7300, y: 12400 },
      health: 2400,
      armor: 0.20,
      side: 'neutral',
      civilianZoneRadius: 180,
      isCivilian: true,
    }),
    // 【南部縱深長程雷達與後勤兵站】
    makeInstallation({
      id: 'cont-south-deep-radar',
      type: 'radar_station',
      name: 'P-35 條帶 (Bar Lock) 3D 遠程引導雷達站 [South Hinterland 3D Radar]',
      weaponDesc: '南端深山 3D 座標測高指示天線群 · 警戒南部大洋上空',
      pos: { x: 12500, y: 12600 },
      health: 3200,
      armor: 0.42,
      range: 5000,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'cont-south-trail-hub',
      type: 'supply_depot',
      name: era === 'era4'
        ? '胡志明小道 559 號公路南部輜重兵站 [Trail 559 Southern Staging Base]'
        : '洛東江縱深物資集結與油料總庫 [South Strategic Supply Hub]',
      weaponDesc: '密林偽裝兵站車庫與補給物資轉運場 · 快速補給南線部隊',
      pos: { x: 11400, y: 10500 },
      health: 4300,
      armor: 0.62,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-south-depot',
      type: 'ship_repair_dock',
      name: '山體隱蔽裝甲維修與後勤補給基地 [Underground Armor Maintenance Depot]',
      weaponDesc: '後方加固掩體工廠 · 修復前線受損車輛與機械裝備',
      pos: { x: 13000, y: 11200 },
      health: 4200,
      armor: 0.65,
      side: 'enemy',
    }),

    // ══════════════════════════════════════════════════════════
    // 東部深山縱深戰略帶 (Deep Eastern Hinterland: X: 11500 ~ 13800, Y: 4000 ~ 9500)
    // ══════════════════════════════════════════════════════════
    makeInstallation({
      id: 'cont-east-oth-radar',
      type: 'radar_station',
      name: '刀架 (Knife Rest B) 極高頻遠程超視距早期預警雷達站 [East Deep Strategic Radar]',
      weaponDesc: '聳立於東部頂峰之超巨型天線桅桿陣列 · 監控數千公里外空情',
      pos: { x: 13400, y: 6400 },
      health: 3500,
      armor: 0.48,
      range: 5500,
      side: 'enemy',
      isRadarEmitting: true,
    }),
    makeInstallation({
      id: 'cont-east-missile-depot',
      type: 'ammo_depot',
      name: era === 'era4'
        ? '冥河/蛙式戰術地對地火箭深山發射掩體 [Tactical Missile Mountain Silo Depot]'
        : '戰區地下重砲彈藥戰略儲備庫 [Strategic Ordnance Cavern]',
      weaponDesc: '鑿入花崗岩山體的地下飛彈與重彈藥發射井儲備庫',
      pos: { x: 13100, y: 5200 },
      health: 4600,
      armor: 0.75,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-east-underground-air-hangar',
      type: 'ammo_cache',
      name: '長山山脈地下開鑿戰機洞庫掩體 [Truong Son Granite Underground Air Facility]',
      weaponDesc: '天然花崗岩洞穴防空機庫 · 敵方後備米格噴射機與特種整備槽',
      pos: { x: 13000, y: 7800 },
      health: 4800,
      armor: 0.72,
      side: 'enemy',
    }),
    makeInstallation({
      id: 'cont-east-theatre-hq',
      type: 'command_post',
      name: era === 'era4'
        ? '559 部隊總司令部地下抗核掩體 [Route 559 High Command Underground Bunker]'
        : '遠東戰區前敵地下總指揮中心 [Far East Supreme Front HQ]',
      weaponDesc: '全戰區最高決策地下作戰室 · 堅不可摧之防爆指揮中樞',
      pos: { x: 13500, y: 8800 },
      health: 5600,
      armor: 0.80,
      range: 1000,
      cooldown: 0.6,
      reloadTime: 1.4,
      side: 'enemy',
      isASuWOnly: true,
    }),
    makeInstallation({
      id: 'cont-east-trail-depot',
      type: 'supply_depot',
      name: era === 'era4'
        ? '熱帶雨林隱蔽重型卡車集結調度場 [Rainforest Hidden Truck Convoy Staging Area]'
        : '太白山脈東線後方機械化輜重基地 [Taebaek East Heavy Convoy Base]',
      weaponDesc: '茂密三層林冠下的龐大軍用卡車整備場 · 貫穿整座大陸縱深後勤',
      pos: { x: 12400, y: 9200 },
      health: 4100,
      armor: 0.58,
      side: 'enemy',
    })
  );
}

/** Initial friendly ground units for each era. */
function addFriendlyGroundUnits(era: Era, groundUnits: GroundUnit[]): void {
  if (era === 'era1') {
    groundUnits.push(
      createGroundUnit('usmc-inf-1', 'usmc_rifle_42', 'USMC 1st Marine Div Rifle Plt (春田/M1加蘭德)', 'player', 'era1', { x: 2030, y: 12380 }),
      createGroundUnit('usmc-lvt-1', 'usmc_lvt_42', 'USMC 1st Amphibian Tractor Plt (LVT-1水牛)', 'player', 'era1', { x: 2080, y: 12410 }),
      createGroundUnit('usmc-tank-1', 'usmc_armor_m3', 'USMC 1st Tank Bn Stuart Plt (M3輕戰車)', 'player', 'era1', { x: 2040, y: 12450 }),
      createGroundUnit('usmc-art-1', 'usmc_artillery_105', 'USMC 10th Artillery Btry (M2A1 105mm)', 'player', 'era1', { x: 2060, y: 12470 }),
      createGroundUnit('usmc-eng-1', 'usmc_engineer', 'USN 133rd Seabees Combat Engr Plt', 'player', 'era1', { x: 2060, y: 12430 }),
      createGroundUnit('usmc-eng-2', 'usmc_engineer', 'USMC 第1工兵營 (野戰機場工兵隊)', 'player', 'era1', { x: 2090, y: 12460 })
    );
  } else if (era === 'era2') {
    groundUnits.push(
      createGroundUnit('usmc-inf-1', 'usmc_rifle_45', 'USMC 6th Marine Div Assault Plt (M1/巴祖卡)', 'player', 'era2', { x: 2030, y: 12380 }),
      createGroundUnit('usmc-lvt-1', 'usmc_lvt_45', 'USMC 3rd Amphibian Tractor Plt (LVT-4突擊火砲)', 'player', 'era2', { x: 2080, y: 12410 }),
      createGroundUnit('usmc-tank-1', 'usmc_armor_m4', 'USMC 4th Tank Bn Sherman Plt (M4A2薛曼)', 'player', 'era2', { x: 2040, y: 12450 }),
      createGroundUnit('usmc-art-1', 'usmc_artillery_105', 'USMC 10th Artillery Btry (M2A1 105mm)', 'player', 'era2', { x: 2060, y: 12470 }),
      createGroundUnit('usmc-eng-1', 'usmc_engineer', 'USN 133rd Seabees Combat Engr Plt', 'player', 'era2', { x: 2060, y: 12430 }),
      createGroundUnit('usmc-eng-2', 'usmc_engineer', 'USMC 第1工兵營 (野戰機場工兵隊)', 'player', 'era2', { x: 2090, y: 12460 })
    );
  } else if (era === 'era3') {
    // 時代三 (1950-1953):
    // 1. 後方艦隊後勤基地之 USMC 兩棲陸戰隊 (待乘登陸艇出擊)
    groundUnits.push(
      createGroundUnit('usmc-inf-1', 'usmc_korea_rifle', 'USMC 1st Marine Div Assault Plt (M1/M20)', 'player', 'era3', { x: 2030, y: 12380 }),
      createGroundUnit('usmc-tank-1', 'usmc_patton_m46', 'USMC 1st Tank Bn Patton Plt (M46 90mm)', 'player', 'era3', { x: 2040, y: 12450 }),
      createGroundUnit('usmc-art-1', 'usmc_howitzer_155', 'USMC 11th Artillery Btry (M114 155mm)', 'player', 'era3', { x: 2060, y: 12470 }),
      createGroundUnit('usmc-duster-1', 'usmc_duster_m42', 'US Army 3rd AAA Bn Duster Plt (M42)', 'player', 'era3', { x: 2080, y: 12410 }),
      createGroundUnit('usmc-lvt-1', 'usmc_lvtp5', 'USMC 1st Amphibian Tractor Plt (LVT-P5重裝步戰)', 'player', 'era3', { x: 2070, y: 12390 }),
      createGroundUnit('usmc-eng-1', 'usmc_engineer', 'USN 133rd Seabees Combat Engr Plt', 'player', 'era3', { x: 2060, y: 12430 })
    );

    // 2. 大陸主戰線上的 NPC 美陸軍自動推進部隊 (自動定期自友軍大陸HQ推向敵方要塞)
    groundUnits.push(
      {
        ...createGroundUnit('us-army-front-inf-1', 'us_army_infantry_korea', 'US Army 7th Inf Div Rifle Plt (前線突擊步兵第1排)', 'player', 'era3', { x: 6900, y: 7300 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-inf-2', 'us_army_infantry_korea', 'US Army 7th Inf Div Rifle Plt (前線突擊步兵第2排)', 'player', 'era3', { x: 7050, y: 7150 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-tank-1', 'us_army_armor_korea', 'US Army 70th Heavy Tank Plt (M46巴頓裝甲第1排)', 'player', 'era3', { x: 6800, y: 7400 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-m44-1', 'us_m44_spg', 'US Army 155mm M44 SPG Btry (自走砲反砲兵支援連)', 'player', 'era3', { x: 6600, y: 7600 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      }
    );

    // 3. 大陸主戰線上的 OPFOR 守備與反撲部隊
    groundUnits.push(
      createGroundUnit('opfor-cont-inf-1', 'opfor_coldwar_infantry', 'KPA 4th Inf Div Assault Plt (遠東突擊步兵第1排)', 'enemy', 'era3', { x: 8600, y: 5200 }),
      createGroundUnit('opfor-cont-inf-2', 'opfor_coldwar_infantry', 'KPA 4th Inf Div Assault Plt (遠東突擊步兵第2排)', 'enemy', 'era3', { x: 8800, y: 5000 }),
      createGroundUnit('opfor-cont-tank-1', 'opfor_t34_85', 'KPA 105th Armored Div T-34/85 Plt (裝甲突擊排)', 'enemy', 'era3', { x: 9100, y: 4700 }),
      createGroundUnit('opfor-cont-su100-1', 'opfor_su100', 'OPFOR SU-100/ISU-152 重型突擊自走砲連 (反砲兵)', 'enemy', 'era3', { x: 9300, y: 4650 }),
      createGroundUnit('opfor-cont-flak-1', 'opfor_s60_flak', 'OPFOR 24th AAA Regt S-60 Btry (57mm雷達防砲連)', 'enemy', 'era3', { x: 9400, y: 4500 })
    );
  } else if (era === 'era4') {
    // 時代四 (1965-1973):
    // 1. 後方艦隊後勤基地之 USMC 空中突擊與裝甲排
    groundUnits.push(
      createGroundUnit('usmc-inf-1', 'usmc_air_assault_65', 'USMC 3rd Marine Div Air Assault Plt (M16/M60)', 'player', 'era4', { x: 2030, y: 12380 }),
      createGroundUnit('usmc-tank-1', 'usmc_armor_m48', 'USMC 3rd Tank Bn Patton Plt (M48A3 90mm)', 'player', 'era4', { x: 2040, y: 12450 }),
      createGroundUnit('usmc-ontos-1', 'usmc_ontos_m50', 'USMC 3rd Anti-Tank Bn Ontos Plt (M50 6管無後座力砲)', 'player', 'era4', { x: 2070, y: 12390 }),
      createGroundUnit('usmc-art-1', 'usmc_howitzer_155', 'USMC 12th Artillery Btry (M109/M114 155mm)', 'player', 'era4', { x: 2060, y: 12470 }),
      createGroundUnit('usmc-duster-1', 'usmc_duster_m42', 'US Army Duster Plt (M42 40mm)', 'player', 'era4', { x: 2080, y: 12410 }),
      createGroundUnit('usmc-eng-1', 'usmc_engineer', 'USN Seabees Combat Engr Plt', 'player', 'era4', { x: 2060, y: 12430 }),
      createGroundUnit('us-army-mech-base-1', 'us_army_m113_mech', 'US Army 1st Cav M113 Mech Inf (後方機步整備排)', 'player', 'era4', { x: 2090, y: 12420 })
    );

    // 2. 大陸主戰線上的 NPC 美軍自動推進部隊
    groundUnits.push(
      {
        ...createGroundUnit('us-army-front-inf-1', 'us_army_rifle_platoon_65', 'US Army 1st Cav Rifle Plt (前線突擊步槍第1排)', 'player', 'era4', { x: 6900, y: 7300 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-inf-2', 'usmc_air_assault_65', 'USMC 3rd Marine Div Air Assault (前線突擊第2排)', 'player', 'era4', { x: 7050, y: 7150 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-m113-1', 'us_army_m113_mech', 'US Army 11th ACR M113 (M113裝甲騎兵第1排)', 'player', 'era4', { x: 6750, y: 7350 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-tank-1', 'usmc_armor_m48', 'USMC 3rd Tank Bn (M48A3巴頓裝甲第1排)', 'player', 'era4', { x: 6800, y: 7400 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-sam-1', 'us_army_chaparral_sam', 'US Army MIM-72 Chaparral (榭樹野戰防空飛彈排)', 'player', 'era4', { x: 6650, y: 7550 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-m109-1', 'us_m109_spg', 'US Army M109 155mm 自走榴彈砲連 (反砲兵支援)', 'player', 'era4', { x: 6500, y: 7650 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      }
    );

    // 3. 大陸主戰線上的 OPFOR 守備與反撲部隊 (北越人民軍與華約軍援防空網)
    groundUnits.push(
      createGroundUnit('opfor-cont-inf-1', 'opfor_vietnam_sapper', 'PAVN 320th Div Sapper Plt (北越特工突擊第1排)', 'enemy', 'era4', { x: 8600, y: 5200 }),
      createGroundUnit('opfor-cont-inf-2', 'opfor_vietnam_sapper', 'PAVN 320th Div Sapper Plt (北越特工突擊第2排)', 'enemy', 'era4', { x: 8800, y: 5000 }),
      createGroundUnit('opfor-cont-patrol-1', 'opfor_vietnam_sapper', 'PAVN 66th Regt Recon Plt (北越深入偵察特工巡邏隊)', 'enemy', 'era4', { x: 8300, y: 5800 }),
      createGroundUnit('opfor-cont-patrol-2', 'opfor_vietnam_sapper', 'PAVN Border Sapper Squad (北越前線工兵滲透排)', 'enemy', 'era4', { x: 7900, y: 6300 }),
      createGroundUnit('opfor-cont-tank-1', 'opfor_t54_tank', 'PAVN 203rd Armored Regt T-54 Plt (T-54主力戰車排)', 'enemy', 'era4', { x: 9100, y: 4700 }),
      createGroundUnit('opfor-cont-pt76-1', 'opfor_pt76_amphib', 'PAVN 198th Amphibious Plt (PT-76兩棲戰車排)', 'enemy', 'era4', { x: 8900, y: 5400 }),
      createGroundUnit('opfor-cont-2s3-1', 'opfor_2s3', '蘇援 PAVN 2S3 金合歡 152mm 自走榴彈砲連 (反砲兵)', 'enemy', 'era4', { x: 9350, y: 4800 }),
      createGroundUnit('opfor-cont-mortar-1', 'opfor_mortar_platoon', 'PAVN 120mm Heavy Mortar Btry (北越120mm重迫擊砲連)', 'enemy', 'era4', { x: 9300, y: 4900 }),
      createGroundUnit('opfor-cont-flak-1', 'opfor_zsu23_shilka', 'PAVN 367th AAA Regt Shilka (ZSU-23-4 雷達防砲連)', 'enemy', 'era4', { x: 9400, y: 4500 }),
      createGroundUnit('opfor-cont-zsu57-1', 'opfor_zsu57_2', 'PAVN ZSU-57-2「雙管57」履帶重型自走防空連', 'enemy', 'era4', { x: 9050, y: 4950 }),
      createGroundUnit('opfor-cont-sa6-1', 'opfor_sa6_kub', '蘇援 2K12 立方體 (SA-6 Gainful) 履帶防空飛彈連', 'enemy', 'era4', { x: 9700, y: 4300 }),
      createGroundUnit('opfor-cont-sa9-1', 'opfor_sa9_strela1', '華約 9K31 箭-1 (SA-9 Gaskin) 輪型野戰紅外防空車排', 'enemy', 'era4', { x: 8750, y: 5350 })
    );
  } else {
    // 時代五 (1973-1991) 歐戰與現代化冷戰主戰場:
    // 1. 後方艦隊後勤基地之 USMC / 陸軍重裝整備部隊
    groundUnits.push(
      createGroundUnit('usmc-inf-1', 'usmc_rifle_83', 'USMC 2nd Marine Div Rifle Plt (83年編裝陸戰步槍排)', 'player', 'era5', { x: 2030, y: 12380 }),
      createGroundUnit('usmc-aav-1', 'usmc_aav7a1', 'USMC 2nd Amphibian Assault Bn (AAV-7A1兩棲突擊載具)', 'player', 'era5', { x: 2070, y: 12390 }),
      createGroundUnit('usmc-lav-1', 'usmc_lav25', 'USMC 2nd LAR Bn LAV-25 Plt (25mm大毒蛇裝甲偵察排)', 'player', 'era5', { x: 2050, y: 12410 }),
      createGroundUnit('us-m1-1', 'us_m1ip_abrams', 'US Army 3rd Armored Div M1IP Plt (M1IP 艾布蘭主戰戰車排)', 'player', 'era5', { x: 2040, y: 12450 }),
      createGroundUnit('us-m60-1', 'us_m60a1_rise', 'USMC 1st Tank Bn M60A1 RISE (反應裝甲主力戰車排)', 'player', 'era5', { x: 2020, y: 12460 }),
      createGroundUnit('us-m198-1', 'us_m198_155', 'US Army 155mm M198 Btry (155mm雙模榴彈砲連)', 'player', 'era5', { x: 2060, y: 12470 }),
      createGroundUnit('us-lavad-1', 'usmc_lav_ad', 'USMC LAV-AD Air Defense Plt (刺針/加特林防空車)', 'player', 'era5', { x: 2080, y: 12430 }),
      createGroundUnit('us-m163-1', 'us_m163_vads', 'US Army M163 VADS Plt (20mm火神自走防空砲)', 'player', 'era5', { x: 2090, y: 12420 })
    );

    // 2. 大陸主戰線上的 NPC 北約自動推進部隊 (自動自友軍大陸HQ開赴敵方核心要塞)
    groundUnits.push(
      {
        ...createGroundUnit('us-army-front-m1-1', 'us_m1ip_abrams', 'US Army 3rd Armored Div (M1IP艾布蘭突破先鋒排)', 'player', 'era5', { x: 6900, y: 7300 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-m60-1', 'us_m60a1_rise', 'USMC 1st Tank Bn (M60A1 RISE反應裝甲戰車排)', 'player', 'era5', { x: 7050, y: 7150 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-lav-1', 'usmc_lav25', 'USMC 2nd LAR Bn (LAV-25裝甲前衛偵察排)', 'player', 'era5', { x: 6750, y: 7350 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-inf-1', 'us_army_rifle_83', 'US Army 8th Inf Div (83年編裝機械化步兵排)', 'player', 'era5', { x: 6800, y: 7400 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-front-ad-1', 'usmc_lav_ad', 'USMC LAV-AD (刺針防空野戰伴隨車排)', 'player', 'era5', { x: 6650, y: 7550 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-m270-1', 'us_m270_mlrs', 'US Army 1st Cav Div M270 MLRS 多管火箭連', 'player', 'era5', { x: 6500, y: 7650 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-atacms-1', 'us_m270_atacms', 'US Army 18th Field Arty Bde MGM-140 ATACMS 戰術飛彈連', 'player', 'era5', { x: 6350, y: 7750 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      },
      {
        ...createGroundUnit('us-army-paladin-1', 'us_m109a6_paladin', 'US Army 3rd Inf Div M109A6 帕拉丁 155mm 數位自走砲連', 'player', 'era5', { x: 6450, y: 7700 }),
        isNPCAlliedFrontline: true,
        order: { type: 'move', targetPos: { x: 11200, y: 3400 } },
      }
    );

    // 3. 大陸主戰線上的 OPFOR 華約近衛守備與反撲部隊 (蘇軍裝甲師與完整野戰防空網)
    groundUnits.push(
      createGroundUnit('opfor-cont-t80-1', 'opfor_t80b', '蘇軍近衛第8軍 T-80B 穿甲突擊主力戰車排', 'enemy', 'era5', { x: 8600, y: 5200 }),
      createGroundUnit('opfor-cont-t72-1', 'opfor_t72b', '蘇軍第39近衛摩托化步兵師 T-72B 戰車排', 'enemy', 'era5', { x: 8800, y: 5000 }),
      createGroundUnit('opfor-cont-bmp2-1', 'opfor_bmp2', '蘇聯近衛摩托化步兵 BMP-2 裝甲步戰排', 'enemy', 'era5', { x: 8300, y: 5800 }),
      createGroundUnit('opfor-cont-inf-1', 'opfor_motor_rifle_83', '蘇軍 83年編裝摩托化步兵突擊排 (AK-74/RPG-7)', 'enemy', 'era5', { x: 7900, y: 6300 }),
      createGroundUnit('opfor-cont-2s19-1', 'opfor_2s19', '蘇聯近衛砲兵師 2S19 姆斯塔-S 152mm 自動反砲兵自走砲連', 'enemy', 'era5', { x: 9200, y: 4650 }),
      createGroundUnit('opfor-cont-2s1-1', 'opfor_2s1', '蘇軍 2S1 石竹 122mm 自走榴彈砲連 (雙模射擊)', 'enemy', 'era5', { x: 9100, y: 4700 }),
      createGroundUnit('opfor-cont-bm21-1', 'opfor_bm21_grad', '蘇軍第39近衛摩托化步兵師 BM-21 冰雹火箭砲營', 'enemy', 'era5', { x: 9250, y: 4550 }),
      createGroundUnit('opfor-cont-bm27-1', 'opfor_bm27_uragan', '蘇聯近衛第8砲兵師 BM-27 颶風 220mm 重火箭砲營', 'enemy', 'era5', { x: 9550, y: 4350 }),
      createGroundUnit('opfor-cont-tunguska-1', 'opfor_tunguska', '蘇聯 2K22 通古斯卡 彈砲合一自走防空連', 'enemy', 'era5', { x: 8900, y: 5400 }),
      createGroundUnit('opfor-cont-strela-1', 'opfor_strela10', '蘇軍 9K35 箭-10 (SA-13) 野戰防空飛彈車排', 'enemy', 'era5', { x: 9300, y: 4900 }),
      createGroundUnit('opfor-cont-sa8-1', 'opfor_sa8_osa', '華約 9K33 黃蜂 (SA-8 Gecko) 兩棲野戰防空飛彈連', 'enemy', 'era5', { x: 8650, y: 5600 }),
      createGroundUnit('opfor-cont-sa11-1', 'opfor_sa11_buk', '蘇聯近衛防空旅 9K37 山毛櫸 (SA-11 Gadfly) 飛彈發射車連', 'enemy', 'era5', { x: 9650, y: 4250 }),
      createGroundUnit('opfor-cont-sa15-1', 'opfor_sa15_tor', '蘇軍 9K330 道爾 (SA-15 Gauntlet) 垂發反飛彈近防戰車連', 'enemy', 'era5', { x: 9450, y: 4600 }),
      createGroundUnit('opfor-cont-btrzd-1', 'opfor_btr_zd', '蘇軍空降部隊 BTR-ZD「喀嚓」雙管23mm伴隨防空車', 'enemy', 'era5', { x: 8450, y: 5150 }),
      createGroundUnit('opfor-cont-pt76-1', 'opfor_pt76_amphib', '蘇軍海軍步兵 PT-76B 水陸裝甲偵察排', 'enemy', 'era5', { x: 9400, y: 4500 })
    );
  }
}

// 敵軍機動地面部隊 (OPFOR Mobile Ground Units) - 常駐要塞與機場島嶼，執行巡邏與防守反突擊
/** OPFOR mobile ground units garrisoning the fortress and airfield islands. */
function addEnemyGarrisonUnits(era: Era, islands: Island[], groundUnits: GroundUnit[]): void {
  for (let i = 1; i < islands.length; i++) {
    const isl = islands[i];
    if (isl.id === 'island-mainland') continue; // 大陸已專門配置戰線部隊
    const center = isl.center;
    const islShortName = isl.name.split(' ')[0] || `島嶼#${i}`;

    // 每個要塞島嶼部署守備步兵部隊
    const infType: GroundUnitType =
      era === 'era5'
        ? 'opfor_motor_rifle_83'
        : era === 'era1'
        ? 'opfor_infantry_42'
        : era === 'era2'
        ? 'opfor_infantry_45'
        : era === 'era3'
        ? 'opfor_coldwar_infantry'
        : 'opfor_vietnam_sapper';
    const infName =
      era === 'era5'
        ? '蘇聯海軍步兵突擊排 (83年編裝)'
        : era === 'era1'
        ? 'IJN 2nd SNLF Rifle Plt (海軍特別陸戰隊)'
        : era === 'era2'
        ? 'IJA 32nd Army Defense Plt (守備隊步槍排)'
        : era === 'era3'
        ? 'KPA 4th Inf Div Assault Plt (遠東突擊排)'
        : 'PAVN Sapper Plt (特工排)';
    groundUnits.push(
      createGroundUnit(
        `opfor-inf-${i}`,
        infType,
        `${islShortName} · ${infName}`,
        'enemy',
        era,
        { x: center.x - 35, y: center.y + 35 }
      )
    );

    // 較大要塞島嶼配置機動裝甲小隊、迫擊砲排與野戰重砲隊
    if (isl.radius > 380) {
      const tankType: GroundUnitType =
        era === 'era5'
          ? (i % 2 === 0 ? 'opfor_t80b' : 'opfor_bmp2')
          : era === 'era4'
          ? (i % 2 === 0 ? 'opfor_t54_tank' : 'opfor_pt76_amphib')
          : era === 'era3'
          ? (i % 2 === 0 ? 'opfor_t34_85' : 'opfor_is3_heavy')
          : era === 'era2'
          ? 'opfor_type97_tank'
          : 'opfor_type95_tank';
      const tankName =
        era === 'era5'
          ? (i % 2 === 0 ? 'T-80B 穿甲突擊戰車排' : 'BMP-2 裝甲步戰排')
          : era === 'era4'
          ? (i % 2 === 0 ? 'T-54/55 主力戰車排' : 'PT-76 水陸戰車排')
          : era === 'era3'
          ? (i % 2 === 0 ? 'T-34/85 突擊戰車排' : 'IS-3 重戰車排')
          : era === 'era2'
          ? '九七式改中戰車排'
          : '九五式輕戰車機動小隊';
      groundUnits.push(
        createGroundUnit(
          `opfor-tank-${i}`,
          tankType,
          `${islShortName} · ${tankName}`,
          'enemy',
          era,
          { x: center.x + 45, y: center.y - 25 }
        )
      );

      // 迫擊砲排 / S-60 / ZSU-23-4 / ZSU-57-2 / SA-6 / SA-9 / 通古斯卡 / 黃蜂 / 道爾 / BTR-ZD
      const mortarType: GroundUnitType =
        era === 'era5'
          ? (i % 4 === 0 ? 'opfor_sa15_tor' : i % 4 === 1 ? 'opfor_sa8_osa' : i % 4 === 2 ? 'opfor_tunguska' : 'opfor_btr_zd')
          : era === 'era4'
          ? (i % 3 === 0 ? 'opfor_sa6_kub' : i % 3 === 1 ? 'opfor_zsu57_2' : 'opfor_zsu23_shilka')
          : era === 'era3'
          ? 'opfor_s60_flak'
          : 'opfor_mortar_platoon';
      const mortarName =
        mortarType === 'opfor_sa15_tor'
          ? '9K330 道爾 (SA-15 Gauntlet) 垂發反飛彈防空連'
          : mortarType === 'opfor_sa8_osa'
          ? '9K33 黃蜂 (SA-8 Gecko) 兩棲野戰防空連'
          : mortarType === 'opfor_btr_zd'
          ? 'BTR-ZD 雙管23mm空降防空自走砲連'
          : mortarType === 'opfor_tunguska'
          ? '2K22 通古斯卡彈砲合一防空連'
          : mortarType === 'opfor_sa6_kub'
          ? '2K12 立方體 (SA-6 Gainful) 履帶防空飛彈連'
          : mortarType === 'opfor_zsu57_2'
          ? 'ZSU-57-2「雙管57」履帶重型自走防空砲連'
          : mortarType === 'opfor_zsu23_shilka'
          ? 'ZSU-23-4 石勒喀河自走防空連'
          : mortarType === 'opfor_s60_flak'
          ? 'S-60 57mm雷達防空砲連'
          : '九七式81mm迫擊砲排';
      groundUnits.push(
        createGroundUnit(
          `opfor-mortar-${i}`,
          mortarType,
          `${islShortName} · ${mortarName}`,
          'enemy',
          era,
          { x: center.x - 20, y: center.y - 50 }
        )
      );

      if (era === 'era5' || era === 'era4' || era === 'era3' || era === 'era2' || i <= 2) {
        const artType: GroundUnitType =
          era === 'era5'
            ? (i % 3 === 0 ? 'opfor_2s19' : i % 3 === 1 ? 'opfor_sa11_buk' : 'opfor_2s1')
            : era === 'era4'
            ? (i % 3 === 0 ? 'opfor_2s3' : i % 3 === 1 ? 'opfor_sa9_strela1' : 'opfor_zu23_aa')
            : era === 'era3'
            ? (i % 2 === 0 ? 'opfor_su100' : 'opfor_ks19_heavy')
            : era === 'era2'
            ? (i % 2 === 0 ? 'opfor_hummel' : 'opfor_field_artillery')
            : 'opfor_field_artillery';
        const artName =
          artType === 'opfor_2s19'
            ? '2S19 姆斯塔-S 152mm自動反砲兵自走砲連'
            : artType === 'opfor_sa11_buk'
            ? '9K37 山毛櫸 (SA-11 Gadfly) 野戰防空飛彈連'
            : artType === 'opfor_2s1'
            ? '2S1 石竹 122mm自走榴彈砲連'
            : artType === 'opfor_2s3'
            ? '2S3 金合歡 152mm自走榴彈砲連'
            : artType === 'opfor_sa9_strela1'
            ? '9K31 箭-1 (SA-9 Gaskin) 輪型野戰防空連'
            : artType === 'opfor_zu23_aa'
            ? 'ZU-23-2 雙管防空砲兵連'
            : artType === 'opfor_su100'
            ? 'SU-100/ISU-152 重型反砲兵自走砲連'
            : artType === 'opfor_ks19_heavy'
            ? 'KS-19 100mm重高射砲連'
            : artType === 'opfor_hummel'
            ? 'Hummel 150mm重自走砲連 (反砲兵支援)'
            : '機動野戰重砲隊';
        groundUnits.push(
          createGroundUnit(
            `opfor-art-${i}`,
            artType,
            `${islShortName} · ${artName}`,
            'enemy',
            era,
            { x: center.x + 15, y: center.y + 70 }
          )
        );
      }
    }
  }
}

/** The player's historical task force for each era. */
function addPlayerTaskForce(era: Era, cvPos: Vector2D, initialHeading: number, playerShips: Ship[]): void {
  if (era === 'era1') {
    addPlayerFleetEra1(cvPos, initialHeading, playerShips);
  } else if (era === 'era2') {
    addPlayerFleetEra2(cvPos, initialHeading, playerShips);
  } else if (era === 'era3') {
    addPlayerFleetEra3(cvPos, initialHeading, playerShips);
  } else if (era === 'era4') {
    // ═══════════════════════════════════════════════════════════════════════
    // ERA 4 (1965~1973): US NAVY TASK FORCE 77 (越戰洋基站導引飛彈航艦特遣隊)
    // 旗艦: USS Kitty Hawk (CV-63, 超級航艦, 海麻雀防空飛彈 + 現代化超音速噴射機聯隊)
    // 飛彈巡洋艦: USS Belknap (CG-26, 雙臂長程標準/Terrier 防空飛彈 + 5"/54 Mk 42 + ASROC)
    // 飛彈驅逐艦: USS Charles F. Adams (DDG-2, 韃靼/標準防空飛彈 + 雙5吋速射砲 + 反潛火箭)
    // 兩棲突擊艦: USS Iwo Jima (LPH-2, 直升機航母, CH-46 / UH-1 / AH-1 垂直包圍突擊)
    // ═══════════════════════════════════════════════════════════════════════
    playerShips.push(
      createCV63('player-cv', 'USS Kitty Hawk (CV-63)', cvPos),
      createBelknapCG('player-cg1', 'USS Belknap (CG-26)', { x: cvPos.x - 240, y: cvPos.y + 200 }),
      createAdamsDDG('player-ddg1', 'USS Charles F. Adams (DDG-2)', { x: cvPos.x + 360, y: cvPos.y + 120 }),
      createForrestShermanDD('player-dd1', 'USS Forrest Sherman (DD-931)', { x: cvPos.x + 220, y: cvPos.y - 160 }),
      createKnoxFFG('player-ffg1', 'USS Knox (FFG-1052)', { x: cvPos.x - 180, y: cvPos.y + 260 }),
      createLPHIwoJima('player-lph1', 'USS Iwo Jima (LPH-2)', { x: cvPos.x - 300, y: cvPos.y - 140 }),
      createNewJersey1968('player-bb1', { x: cvPos.x + 120, y: cvPos.y + 300 }),
      createPBR('player-pbr1', 'PBR-105 (River Division 531)', { x: cvPos.x - 420, y: cvPos.y - 60 }),
      createPBR('player-pbr2', 'PBR-106 (River Division 531)', { x: cvPos.x - 450, y: cvPos.y - 20 })
    );
  } else {
    // ═══════════════════════════════════════════════════════════════════════
    // ERA 5 (1973~1991): NATO STRIKE FLEET ATLANTIC (北大西洋冷戰神盾與現代航艦打擊群)
    // 旗艦: USS Nimitz (CVN-68, 尼米茲級核動力超級航空母艦)
    // 神盾巡洋艦: USS Ticonderoga (CG-47, SPY-1A 神盾雷達, 雙臂 Mk 26, SM-2MR, 魚叉, 方陣)
    // 核動力巡洋艦: USS Virginia (CGN-38, 雙核反應爐, SM-2MR, 魚叉, 方陣)
    // 近代化戰艦: USS Iowa (BB-61, 9門16吋巨砲, 16枚魚叉, 32枚戰斧, 4座方陣)
    // 大型反潛驅逐艦: USS Spruance (DD-963, SQS-53聲納, ASROC, 海麻雀, 魚叉, 方陣)
    // 飛彈驅逐艦: USS Kidd (DDG-993, 2座Mk 26雙臂發射架, SM-2MR, 魚叉, 方陣)
    // 巡防艦: USS Oliver Hazard Perry (FFG-7, 單臂標準/魚叉, 76mm快砲, 方陣)
    // 攻擊核潛艦: USS Los Angeles (SSN-688, Mk 48 ADCAP重型線導魚雷, 潛射魚叉)
    // 兩棲船塢運輸艦: USS Austin (LPD-4, 泛水塢艙裝載LCAC/AAV-7A1, 方陣)
    // 氣墊登陸艇: LCAC-01 (45節掠海衝灘, 裝載M1IP艾布蘭/陸戰裝甲)
    // ═══════════════════════════════════════════════════════════════════════
    playerShips.push(
      createCVNNimitz('player-cv', 'USS Nimitz (CVN-68)', cvPos),
      createTiconderogaCG('player-cg1', 'USS Ticonderoga (CG-47)', { x: cvPos.x - 240, y: cvPos.y + 200 }),
      createVirginiaCGN('player-cgn1', 'USS Virginia (CGN-38)', { x: cvPos.x - 280, y: cvPos.y - 180 }),
      createIowaModernizedBB('player-bb1', 'USS Iowa (BB-61 Modernized)', { x: cvPos.x + 260, y: cvPos.y + 160 }),
      createSpruanceDD('player-dd1', 'USS Spruance (DD-963)', { x: cvPos.x + 360, y: cvPos.y - 120 }),
      createKiddDDG('player-ddg1', 'USS Kidd (DDG-993)', { x: cvPos.x + 220, y: cvPos.y - 200 }),
      createPerryFFG('player-ffg1', 'USS Oliver Hazard Perry (FFG-7)', { x: cvPos.x - 180, y: cvPos.y + 280 }),
      createLosAngelesSSN('player-ssn1', 'USS Los Angeles (SSN-688)', { x: cvPos.x + 420, y: cvPos.y + 40 }),
      createAustinLPD('player-lpd1', 'USS Austin (LPD-4)', { x: cvPos.x - 360, y: cvPos.y - 100 }),
      createLCAC('player-lcac1', 'LCAC-01 Air Cushion Craft', { x: cvPos.x - 380, y: cvPos.y - 60 }),
      createTarawaLHA('player-lha1', 'USS Tarawa (LHA-1)', { x: cvPos.x - 520, y: cvPos.y - 200 })
    );
  }
}

/** 1942: Task Forces 16 / 61 off Guadalcanal. */
function addPlayerFleetEra1(cvPos: Vector2D, initialHeading: number, playerShips: Ship[]): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 1 (1942): US NAVY TASK FORCE 16 / 61 (美國海軍第16/61特遣艦隊)
  // 旗艦: USS Enterprise (CV-6)
  // 護航重巡洋艦: USS San Francisco (CA-38), USS Portland (CA-33)
  // 防空巡洋艦: USS Atlanta (CL-51, 16門 5"/38 DP!)
  // 驅逐艦幕: USS Fletcher (DD-445), USS Radford (DD-446), USS O'Bannon (DD-450)
  // 艦載機編制: F4F Wildcat, SBD Dauntless, TBD Devastator, OS2U Kingfisher
  // ═══════════════════════════════════════════════════════════════════════
  // USS Washington (BB-56): North Carolina class, sank Kirishima at the Naval Battle of Guadalcanal (15 Nov 1942)
  playerShips.push(createPlayerBattleship('player-bb1', 'USS Washington (BB-56)', { x: cvPos.x + 260, y: cvPos.y + 190 }, 'era1'));
  playerShips.push(
    // 1. USS Enterprise (CV-6) - 企業號艦隊航母 (大E)
    createShip({
      id: 'player-cv',
      name: 'USS Enterprise (CV-6)',
      codeName: 'Big E',
      type: 'carrier',
      side: 'player',
      era: 'era1',
      pos: { ...cvPos },
      heading: initialHeading,
      speed: 12,
      maxSpeed: 24,
      length: 114,
      width: 25,
      health: 3200,
      maxHealth: 3200,
      armor: 0.28,
      isFlagship: true,
      detectionRange: 3200,
      turrets: [
        createTurret(28, 10, '5-inch/38 Mk 12 (右舷前單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(18, 10, '5-inch/38 Mk 12 (右舷前單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(-18, 10, '5-inch/38 Mk 12 (右舷後單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(-28, 10, '5-inch/38 Mk 12 (右舷後單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(28, -10, '5-inch/38 Mk 12 (左舷前單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(18, -10, '5-inch/38 Mk 12 (左舷前單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(-18, -10, '5-inch/38 Mk 12 (左舷後單裝)', 1050, 2.5, 1, initialHeading, 70),
        createTurret(-28, -10, '5-inch/38 Mk 12 (左舷後單裝)', 1050, 2.5, 1, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平兩用砲', count: '8門 (8座單裝耳台砲塔)', type: 'main', desc: 'Mk 12 DP 高平兩用砲，配置於飛行甲板兩舷舷側耳台' },
        { name: '1.1吋/75倍徑 四聯裝防空機砲', count: '16門 (4座四聯裝)', type: 'aa', desc: '芝加哥鋼琴 (Chicago Piano) 防空機砲' },
        { name: '20mm 厄利孔高平快砲', count: '32門 (單裝機砲)', type: 'aa', desc: '近程自衛密集火網' },
        { name: '艦載航空隊編制 (Air Group)', count: '79架', type: 'main', desc: 'F4F野貓 / SBD無畏 / TBD蹂躪者 / OS2U翠鳥' },
      ],
      flakCooldown: 0,
      flakRange: 750,
      carrierPlanes: {
        ready: { f4f: 8, sbd: 8, tbd: 2, tbf: 4, os2u: 2 },
        hangar: { f4f: 12, sbd: 12, tbd: 4, tbf: 6, os2u: 2 },
        maxPerType: { f4f: 14, sbd: 14, tbd: 6, tbf: 8, os2u: 2 },
      },
    }),

    // 2. USS San Francisco (CA-38) - 舊金山號重巡洋艦 (紐奧良級)
    createShip({
      id: 'player-ca1',
      name: 'USS San Francisco (CA-38)',
      codeName: 'Iron Cruiser',
      type: 'cruiser',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x + 220, y: cvPos.y - 140 },
      heading: initialHeading,
      speed: 12,
      maxSpeed: 25,
      length: 92,
      width: 18,
      health: 2600,
      maxHealth: 2600,
      armor: 0.36,
      detectionRange: 2800,
      turrets: [
        createTurret(28, 0, '8-inch/55 Triple Mk 9 (No.1 艦艏主砲)', 1450, 5.2, 3, initialHeading, 160),
        createTurret(15, 0, '8-inch/55 Triple Mk 9 (No.2 背負主砲)', 1450, 5.2, 3, initialHeading, 160),
        createTurret(-25, 0, '8-inch/55 Triple Mk 9 (No.3 艦艉主砲)', 1450, 5.2, 3, initialHeading, 160),
        createTurret(9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(-3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(-3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(-9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
        createTurret(-9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 65),
      ],
      detailedArmaments: [
        { name: '8吋55倍徑三聯裝主砲', count: '9門 (3座三聯裝)', type: 'main', desc: 'Mk 9 重型艦砲，穿甲彈破壞力極強' },
        { name: '5吋25倍徑防空高射砲', count: '8門 (單裝)', type: 'secondary', desc: '中遠程防空與副砲打擊' },
        { name: '20mm 厄利孔高平快砲群', count: '16門 (單裝機砲)', type: 'aa', desc: '防禦敵方俯衝轟炸機' },
        { name: '水上偵察機彈射器', count: '2具彈射器', type: 'asw', desc: '搭載 OS2U 翠鳥水上偵察機' },
      ],
      flakCooldown: 0,
      flakRange: 680,
    }),

    // 3. USS Portland (CA-33) - 波特蘭號重巡洋艦 (波特蘭級)
    createShip({
      id: 'player-ca2',
      name: 'USS Portland (CA-33)',
      codeName: 'Sweet Pea',
      type: 'cruiser',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x + 240, y: cvPos.y + 160 },
      heading: initialHeading,
      speed: 12,
      maxSpeed: 25,
      length: 90,
      width: 18,
      health: 2500,
      maxHealth: 2500,
      armor: 0.35,
      detectionRange: 2700,
      turrets: [
        createTurret(26, 0, '8-inch/55 Triple Mk 9 (No.1 艦艏主砲)', 1420, 5.2, 3, initialHeading, 155),
        createTurret(14, 0, '8-inch/55 Triple Mk 9 (No.2 背負主砲)', 1420, 5.2, 3, initialHeading, 155),
        createTurret(-24, 0, '8-inch/55 Triple Mk 9 (No.3 艦艉主砲)', 1420, 5.2, 3, initialHeading, 155),
        createTurret(9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(-3, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(-3, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(-9, 8, '5-inch/25 AA (右舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
        createTurret(-9, -8, '5-inch/25 AA (左舷5吋/25高射砲)', 950, 2.6, 1, initialHeading, 60),
      ],
      detailedArmaments: [
        { name: '8吋55倍徑三聯裝主砲', count: '9門 (3座三聯裝)', type: 'main', desc: '瓜島海戰關鍵重巡火力' },
        { name: '5吋25倍徑防空高射砲', count: '8門', type: 'secondary', desc: '防空與近距副砲' },
        { name: '20mm 厄利孔高平快砲', count: '12門', type: 'aa', desc: '自衛火網' },
      ],
      flakCooldown: 0,
      flakRange: 660,
    }),

    // 4. USS Atlanta (CL-51) - 亞特蘭大號防空巡洋艦 (16門 5"/38 DP 巨量速射防空砲幕!)
    createShip({
      id: 'player-cl1',
      name: 'USS Atlanta (CL-51)',
      codeName: 'Flak Citadel',
      type: 'cruiser',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x - 180, y: cvPos.y + 190 },
      heading: initialHeading,
      speed: 13,
      maxSpeed: 28,
      length: 86,
      width: 16,
      health: 2200,
      maxHealth: 2200,
      armor: 0.28,
      detectionRange: 2900,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 16,
      turrets: [
        createTurret(31, 0, '5-inch/38 Mk 29 Twin DP (No.1 艦艏雙聯)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(23, 0, '5-inch/38 Mk 29 Twin DP (No.2 背負雙聯)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(15, 0, '5-inch/38 Mk 29 Twin DP (No.3 三層背負)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(-15, 0, '5-inch/38 Mk 29 Twin DP (No.4 三層背負後)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(-23, 0, '5-inch/38 Mk 29 Twin DP (No.5 背負雙聯後)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(-31, 0, '5-inch/38 Mk 29 Twin DP (No.6 艦艉雙聯)', 1100, 2.2, 2, initialHeading, 80),
        createTurret(-7, -7, '5-inch/38 Twin (右舷翼砲)', 1050, 2.2, 2, initialHeading, 80),
        createTurret(-7, 7, '5-inch/38 Twin (左舷翼砲)', 1050, 2.2, 2, initialHeading, 80),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑雙聯裝高平砲 (16門)', count: '16門 (8座雙聯裝砲塔)', type: 'main', desc: '傳奇防空巡洋艦，全艦高仰角超高射速彈幕' },
        { name: '1.1吋 四聯裝防空機砲', count: '16門 (4座四聯裝)', type: 'aa', desc: '中程防空撕裂網' },
        { name: '20mm 厄利孔高射機砲', count: '12門', type: 'aa', desc: '近迫防空' },
        { name: '533mm 四聯裝魚雷發射管', count: '8管 (2座四聯裝)', type: 'torpedo', desc: 'Mk 15 水面魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 820,
    }),

    // 5. USS Fletcher (DD-445) - 弗萊徹號驅逐艦首艦
    createShip({
      id: 'player-dd1',
      name: 'USS Fletcher (DD-445)',
      codeName: 'Greyhound',
      type: 'destroyer',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x - 240, y: cvPos.y - 180 },
      heading: initialHeading,
      speed: 13,
      maxSpeed: 30,
      length: 66,
      width: 12,
      health: 1350,
      maxHealth: 1350,
      armor: 0.16,
      detectionRange: 2600,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 16,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      turrets: [
        createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門 (5座單裝砲塔)', type: 'main', desc: 'Mk 12 高平兩用砲，由 Mk 37 射控引導' },
        { name: '40mm 博福斯雙聯防空機砲', count: '4門 (2座雙聯裝)', type: 'aa', desc: '中程防空火網' },
        { name: '20mm 厄利孔高平快砲', count: '10門', type: 'aa', desc: '近程高平兩用快砲' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管 (2組五聯裝)', type: 'torpedo', desc: 'Mark 15 水面魚雷' },
        { name: '深水炸彈K型投射機與滑軌', count: '6座K-Gun + 2軌', type: 'asw', desc: '反潛爆震' },
      ],
      flakCooldown: 0,
      flakRange: 620,
    }),

    // 6. USS Radford (DD-446) - 雷德福號驅逐艦
    createShip({
      id: 'player-dd2',
      name: 'USS Radford (DD-446)',
      codeName: 'Bulldog',
      type: 'destroyer',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x + 360, y: cvPos.y - 30 },
      heading: initialHeading,
      speed: 13,
      maxSpeed: 30,
      length: 66,
      width: 12,
      health: 1350,
      maxHealth: 1350,
      armor: 0.16,
      detectionRange: 2600,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 16,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      turrets: [
        createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門', type: 'main', desc: '標準弗萊徹級高平砲' },
        { name: '40mm 博福斯雙聯高射砲', count: '4門', type: 'aa', desc: '防空火網' },
        { name: '20mm 厄利孔高平快砲', count: '10門', type: 'aa', desc: '近迫防空' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: '水面魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 620,
    }),

    // 7. USS O'Bannon (DD-450) - 奧班農號驅逐艦 (幸運之艦)
    createShip({
      id: 'player-dd3',
      name: "USS O'Bannon (DD-450)",
      codeName: 'Lucky O',
      type: 'destroyer',
      side: 'player',
      era: 'era1',
      pos: { x: cvPos.x - 340, y: cvPos.y + 40 },
      heading: initialHeading,
      speed: 13,
      maxSpeed: 30,
      length: 66,
      width: 12,
      health: 1400,
      maxHealth: 1400,
      armor: 0.16,
      detectionRange: 2600,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 16,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      turrets: [
        createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
        createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門', type: 'main', desc: '戰史獲頒17顆戰鬥之星' },
        { name: '40mm 博福斯雙聯高射砲', count: '4門', type: 'aa', desc: '防空火力' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: '雷擊戰力' },
        { name: '深水炸彈反潛投射器', count: '6座K-Gun', type: 'asw', desc: '曾擊沉多艘日軍潛艦' },
      ],
      flakCooldown: 0,
      flakRange: 620,
    })
  );
}

/** 1944-45: Task Force 38 / 58 at Leyte Gulf and Okinawa. */
function addPlayerFleetEra2(cvPos: Vector2D, initialHeading: number, playerShips: Ship[]): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 2 (1944~1945): US NAVY TASK FORCE 38 / 58 & TAFFY 3
  // 旗艦: USS Essex (CV-9)
  // 戰艦: USS Missouri (BB-63, 9門 16"/50 巨砲 + 80門博福斯機砲!)
  // 重巡洋艦: USS Baltimore (CA-68)
  // 輕巡洋艦: USS Cleveland (CL-55, 12門 6"/47 速射砲)
  // 薩馬島驅逐艦英雄群: USS Johnston (DD-557), USS Hoel (DD-533)
  // 護航驅逐艦傳奇: USS Samuel B. Roberts (DE-413)
  // 艦載機編制: F6F Hellcat, F4U Corsair, F8F Bearcat, SB2C Helldiver, TBF Avenger
  // ═══════════════════════════════════════════════════════════════════════
  // Taffy 3 escort carrier, Battle off Samar (25 Oct 1944)
  playerShips.push(createCasablancaCVE('player-cve1', 'USS Gambier Bay (CVE-73)', { x: cvPos.x - 300, y: cvPos.y + 220 }));
  playerShips.push(
    // 1. USS Essex (CV-9) - 艾塞克斯號航空母艦
    createShip({
      id: 'player-cv',
      name: 'USS Essex (CV-9)',
      codeName: 'Fightingest Ship',
      type: 'carrier',
      side: 'player',
      era: 'era2',
      pos: { ...cvPos },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 27,
      length: 130,
      width: 28,
      health: 4200,
      maxHealth: 4200,
      armor: 0.35,
      isFlagship: true,
      detectionRange: 3600,
      turrets: [
        createTurret(44, 11, '5-inch/38 Mk 32 Twin DP (艦島前背負雙聯)', 1100, 2.3, 2, initialHeading, 75),
        createTurret(38, 11, '5-inch/38 Mk 32 Twin DP (艦島前雙聯)', 1100, 2.3, 2, initialHeading, 75),
        createTurret(0, 11, '5-inch/38 Mk 32 Twin DP (艦島後雙聯)', 1100, 2.3, 2, initialHeading, 75),
        createTurret(-6, 11, '5-inch/38 Mk 32 Twin DP (艦島後背負雙聯)', 1100, 2.3, 2, initialHeading, 75),
        createTurret(26, -11, '5-inch/38 Mk 12 Single DP (左舷單裝)', 1050, 2.4, 1, initialHeading, 65),
        createTurret(16, -11, '5-inch/38 Mk 12 Single DP (左舷單裝)', 1050, 2.4, 1, initialHeading, 65),
        createTurret(-16, -11, '5-inch/38 Mk 12 Single DP (左舷單裝)', 1050, 2.4, 1, initialHeading, 65),
        createTurret(-26, -11, '5-inch/38 Mk 12 Single DP (左舷單裝)', 1050, 2.4, 1, initialHeading, 65),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑高平兩用砲 (12門)', count: '12門 (4座雙聯裝 + 4座單裝)', type: 'main', desc: '雷達射控 VT近炸信管，強悍防空幕' },
        { name: '40mm 博福斯四聯裝機砲', count: '72門 (18座四聯裝)', type: 'aa', desc: '密不透風的博福斯防空彈幕' },
        { name: '20mm 厄利孔防空快砲', count: '40門 (單裝機砲群)', type: 'aa', desc: '近迫自衛密集火網' },
        { name: '重型艦載航空聯隊 (Air Group)', count: '90-100架', type: 'main', desc: 'F6F地獄貓 / F4U海盜 / F8F熊貓 / SB2C地獄俯衝者 / TBF復仇者' },
      ],
      flakCooldown: 0,
      flakRange: 900,
      carrierPlanes: {
        ready: { f6f: 10, f4u: 8, f8f: 4, sb2c: 8, tbf: 8, sc1: 2 },
        hangar: { f6f: 14, f4u: 10, f8f: 4, sb2c: 12, tbf: 10, sc1: 2 },
        maxPerType: { f6f: 16, f4u: 12, f8f: 4, sb2c: 12, tbf: 12, sc1: 2 },
      },
    }),

    // 2. USS Missouri (BB-63) - 密蘇里號戰列艦 (衣阿華級，9門 16"/50 巨砲，80門博福斯機砲!)
    createShip({
      id: 'player-bb1',
      name: 'USS Missouri (BB-63)',
      codeName: 'Mighty Mo',
      type: 'battleship',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x + 240, y: cvPos.y + 180 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 33,
      length: 135,
      width: 30,
      health: 5800,
      maxHealth: 5800,
      armor: 0.52,
      detectionRange: 3200,
      turrets: [
        createTurret(38, 0, '16-inch/50 Mark 7 Triple (No.1 艦艏巨砲)', 1950, 7.2, 3, initialHeading, 340),
        createTurret(24, 0, '16-inch/50 Mark 7 Triple (No.2 背負巨砲)', 1950, 7.2, 3, initialHeading, 340),
        createTurret(-34, 0, '16-inch/50 Mark 7 Triple (No.3 艦艉巨砲)', 1950, 7.2, 3, initialHeading, 340),
        createTurret(12, 12, '5-inch/38 Mk 28 Twin (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(12, -12, '5-inch/38 Mk 28 Twin (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(4, 12, '5-inch/38 Mk 28 Twin (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(4, -12, '5-inch/38 Mk 28 Twin (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-4, 12, '5-inch/38 Mk 28 Twin (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-4, -12, '5-inch/38 Mk 28 Twin (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-12, 12, '5-inch/38 Mk 28 Twin (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-12, -12, '5-inch/38 Mk 28 Twin (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-20, 12, '5-inch/38 Mk 28 Twin (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
        createTurret(-20, -12, '5-inch/38 Mk 28 Twin (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 75),
      ],
      detailedArmaments: [
        { name: '16吋50倍徑三聯裝 Mark 7 巨型主砲', count: '9門 (3座三聯裝)', type: 'main', desc: '發射2,700磅超重穿甲彈 (AP Mark 8)，破壞力無與倫比' },
        { name: '5吋38倍徑雙聯裝高平兩用砲', count: '20門 (10座雙聯裝)', type: 'secondary', desc: '雷達導引 VT信管防空射控' },
        { name: '40mm 博福斯四聯裝機砲群', count: '80門 (20座四聯裝)', type: 'aa', desc: '重型刺蝟防空火網' },
        { name: '20mm 厄利孔防空機砲群', count: '49門', type: 'aa', desc: '近程掃蕩' },
      ],
      flakCooldown: 0,
      flakRange: 920,
    }),

    // 3. USS Baltimore (CA-68) - 巴爾的摩號重巡洋艦 (巴爾的摩級)
    createShip({
      id: 'player-ca1',
      name: 'USS Baltimore (CA-68)',
      codeName: 'Heavy Hammer',
      type: 'cruiser',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x + 250, y: cvPos.y - 140 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 28,
      length: 98,
      width: 19,
      health: 3100,
      maxHealth: 3100,
      armor: 0.38,
      detectionRange: 3000,
      turrets: [
        createTurret(28, 0, '8-inch/55 Triple Mk 12 (No.1 艦艏主砲)', 1550, 4.8, 3, initialHeading, 175),
        createTurret(16, 0, '8-inch/55 Triple Mk 12 (No.2 背負主砲)', 1550, 4.8, 3, initialHeading, 175),
        createTurret(-26, 0, '8-inch/55 Triple Mk 12 (No.3 艦艉主砲)', 1550, 4.8, 3, initialHeading, 175),
        createTurret(4, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-4, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(4, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-4, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(9, 0, '5-inch/38 Twin DP (艦橋前中線雙聯)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-19, 0, '5-inch/38 Twin DP (艦艉中線雙聯)', 1100, 2.2, 2, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '8吋55倍徑三聯裝 Mk 12 主砲', count: '9門 (3座三聯裝)', type: 'main', desc: '穿甲超重彈 (SHS)，強烈破甲打擊' },
        { name: '5吋38倍徑雙聯裝高平砲', count: '12門 (6座雙聯裝)', type: 'secondary', desc: '遠程高平兩用防空' },
        { name: '40mm 博福斯四聯裝機砲', count: '48門 (12座四聯裝)', type: 'aa', desc: '高射速中程防空' },
        { name: '20mm 厄利孔機砲', count: '24門', type: 'aa', desc: '近程自衛' },
      ],
      flakCooldown: 0,
      flakRange: 780,
    }),

    // 4. USS Cleveland (CL-55) - 克里夫蘭號輕巡洋艦 (12門 6"/47 速射砲)
    createShip({
      id: 'player-cl1',
      name: 'USS Cleveland (CL-55)',
      codeName: 'Rapid Fire Queen',
      type: 'cruiser',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x - 200, y: cvPos.y + 180 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 29,
      length: 96,
      width: 18,
      health: 2800,
      maxHealth: 2800,
      armor: 0.32,
      detectionRange: 3000,
      turrets: [
        createTurret(28, 0, '6-inch/47 Triple Mk 16 (No.1 艦艏主砲)', 1320, 3.4, 3, initialHeading, 130),
        createTurret(16, 0, '6-inch/47 Triple Mk 16 (No.2 背負主砲)', 1320, 3.4, 3, initialHeading, 130),
        createTurret(-16, 0, '6-inch/47 Triple Mk 16 (No.3 背負主砲)', 1320, 3.4, 3, initialHeading, 130),
        createTurret(-28, 0, '6-inch/47 Triple Mk 16 (No.4 艦艉主砲)', 1320, 3.4, 3, initialHeading, 130),
        createTurret(5, 0, '5-inch/38 Twin DP (前中央高平砲)', 1100, 2.2, 2, initialHeading, 75),
        createTurret(-5, 0, '5-inch/38 Twin DP (後中央高平砲)', 1100, 2.2, 2, initialHeading, 75),
        createTurret(3, 8, '5-inch/38 Twin DP (右舷翼砲)', 1100, 2.2, 2, initialHeading, 75),
        createTurret(3, -8, '5-inch/38 Twin DP (左舷翼砲)', 1100, 2.2, 2, initialHeading, 75),
        createTurret(-3, 8, '5-inch/38 Twin DP (右舷翼砲)', 1100, 2.2, 2, initialHeading, 75),
        createTurret(-3, -8, '5-inch/38 Twin DP (左舷翼砲)', 1100, 2.2, 2, initialHeading, 75),
      ],
      detailedArmaments: [
        { name: '6吋47倍徑三聯裝速射主砲', count: '12門 (4座三聯裝)', type: 'main', desc: 'Mk 16 高速射擊艦砲，彈幕覆蓋極度密集' },
        { name: '5吋38倍徑雙聯高平兩用砲', count: '12門 (6座雙聯裝)', type: 'secondary', desc: '強大遠程防空屏障' },
        { name: '40mm 博福斯四聯裝機砲', count: '28門', type: 'aa', desc: '密集的防空彈雨' },
        { name: '20mm 厄利孔高平快砲', count: '10門', type: 'aa', desc: '近迫自衛' },
      ],
      flakCooldown: 0,
      flakRange: 820,
    }),

    // 5. USS Johnston (DD-557) - 約翰斯頓號驅逐艦 (薩馬島海戰傳奇英雄)
    createShip({
      id: 'player-dd1',
      name: 'USS Johnston (DD-557)',
      codeName: 'Tin Can Titan',
      type: 'destroyer',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x - 250, y: cvPos.y - 180 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 32,
      length: 68,
      width: 12,
      health: 1550,
      maxHealth: 1550,
      armor: 0.18,
      detectionRange: 2700,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 14,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      hasHedgehog: true,
      hedgehogCooldown: 0,
      turrets: [
        createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, initialHeading, 75),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門 (5座單裝砲塔)', type: 'main', desc: '薩馬島海戰單艦衝鋒迎戰栗田主力艦隊' },
        { name: '40mm 博福斯高射砲', count: '10門 (雙聯裝x5)', type: 'aa', desc: '博福斯防空火網' },
        { name: '20mm 厄利孔高平快砲', count: '7門', type: 'aa', desc: '近迫自衛快砲' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管 (2組五聯裝)', type: 'torpedo', desc: '曾近距離命中重巡熊野號' },
        { name: '刺蝟砲 (Hedgehog ASW 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏前方超前射擊刺蝟迫擊砲，接觸即爆' },
        { name: '深水炸彈發射軌與K砲', count: '6座K-Gun', type: 'asw', desc: '後方反潛爆震' },
      ],
      flakCooldown: 0,
      flakRange: 680,
    }),

    // 6. USS Hoel (DD-533) - 霍爾號驅逐艦 (塔菲三號護航驅逐艦)
    createShip({
      id: 'player-dd2',
      name: 'USS Hoel (DD-533)',
      codeName: 'Iron Hound',
      type: 'destroyer',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x + 360, y: cvPos.y - 20 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 32,
      length: 68,
      width: 12,
      health: 1500,
      maxHealth: 1500,
      armor: 0.18,
      detectionRange: 2700,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 14,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      hasHedgehog: true,
      hedgehogCooldown: 0,
      turrets: [
        createTurret(22, 0, '5-inch/38 Mk 12 (No.51 艦艏單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(14, 0, '5-inch/38 Mk 12 (No.52 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-11, 0, '5-inch/38 Mk 12 (No.53 後甲板室單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-17, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
        createTurret(-24, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, initialHeading, 75),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (5門)', count: '5門', type: 'main', desc: '弗萊徹級驅逐艦' },
        { name: '40mm 博福斯高射砲', count: '10門', type: 'aa', desc: '防空火網' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: '重型魚雷' },
        { name: '刺蝟砲 (Hedgehog ASW 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏反潛刺蝟迫擊砲陣列' },
        { name: '深水炸彈發射軌與K砲', count: '6座K-Gun', type: 'asw', desc: '後方反潛爆震' },
      ],
      flakCooldown: 0,
      flakRange: 680,
    }),

    // 7. USS Samuel B. Roberts (DE-413) - 羅伯茨號護航驅逐艦 ("堪比戰艦一戰的護航驅逐艦")
    createShip({
      id: 'player-de1',
      name: 'USS Samuel B. Roberts (DE-413)',
      codeName: 'The Destroyer Escort That Fought Like a Battleship',
      type: 'destroyer',
      side: 'player',
      era: 'era2',
      pos: { x: cvPos.x - 340, y: cvPos.y + 40 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 24,
      length: 58,
      width: 11,
      health: 1250,
      maxHealth: 1250,
      armor: 0.15,
      detectionRange: 2500,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 14,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      hasHedgehog: true,
      hedgehogCooldown: 0,
      turrets: [
        createTurret(18, 0, '5-inch/38 Mk 12 (艦艏單裝)', 1080, 2.0, 1, initialHeading, 75),
        createTurret(-18, 0, '5-inch/38 Mk 12 (艦艉單裝)', 1080, 2.0, 1, initialHeading, 75),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑單裝高平砲 (2門)', count: '2門 (砲長連續發射600餘發砲彈)', type: 'main', desc: '近距轟擊鳥海號與筑摩號' },
        { name: '40mm 博福斯雙聯高射砲', count: '4門 (2座雙聯裝)', type: 'aa', desc: '防空火網' },
        { name: '20mm 厄利孔高平快砲', count: '10門', type: 'aa', desc: '近迫自衛' },
        { name: '533mm 三聯裝魚雷發射管', count: '3管 (1組三聯裝)', type: 'torpedo', desc: '曾近距雷擊重創日軍重巡洋艦' },
        { name: '刺蝟砲 (Hedgehog ASW 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏刺蝟反潛迫擊砲，對潛艇極度致命' },
      ],
      flakCooldown: 0,
      flakRange: 600,
    })
  );
}

/** 1950-53: Task Force 77 off Wonsan. */
function addPlayerFleetEra3(cvPos: Vector2D, initialHeading: number, playerShips: Ship[]): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 3 (1950~1953): US NAVY TASK FORCE 77 (遠東第七艦隊特遣隊)
  // 旗艦: USS Oriskany (CV-34 SCB-27A 噴射機現代化航母, "The Mighty O")
  // 戰艦: USS Missouri (BB-63 衣阿華級冷戰改裝戰艦, 9門 16"/50 巨砲 + SPS-6 雷達)
  // 重巡洋艦: USS Des Moines (CA-134 得梅因級全自動裝填重巡洋艦, 9門 8"/55 砲每分10發速射!)
  // 主力驅逐艦: USS Gearing (DD-710 基靈級先進艦隊驅逐艦, 3座雙聯 5"/38 DP + 刺蝟彈)
  // 屏衛驅逐艦: USS Frank Knox (DD-742 基靈級驅逐艦, 雙聯 5"/38 DP 雷達射控)
  // 艦載機編制: F8F, F9F Panther, F2H Banshee, AD-1 Skyraider, F4U-4, AF Guardian, AD-3W, HO3S-1
  // ═══════════════════════════════════════════════════════════════════════
  playerShips.push(
    // 1. USS Oriskany (CV-34) - 奧里斯卡尼號噴射航母 (SCB-27A)
    createShip({
      id: 'player-cv',
      name: 'USS Oriskany (CV-34 SCB-27A)',
      codeName: 'The Mighty O',
      type: 'carrier',
      side: 'player',
      era: 'era3',
      pos: { ...cvPos },
      heading: initialHeading,
      speed: 15,
      maxSpeed: 30,
      length: 135,
      width: 30,
      health: 4800,
      maxHealth: 4800,
      armor: 0.38,
      isFlagship: true,
      detectionRange: 4200,
      turrets: [
        createTurret(24, -10, '5-inch/38 Mk 24 Single DP (右舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(14, -10, '5-inch/38 Mk 24 Single DP (右舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(-14, -10, '5-inch/38 Mk 24 Single DP (右舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(-24, -10, '5-inch/38 Mk 24 Single DP (右舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(24, 10, '5-inch/38 Mk 24 Single DP (左舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(14, 10, '5-inch/38 Mk 24 Single DP (左舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(-14, 10, '5-inch/38 Mk 24 Single DP (左舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
        createTurret(-24, 10, '5-inch/38 Mk 24 Single DP (左舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
      ],
      detailedArmaments: [
        { name: '5吋54倍徑 Mark 16 自動高平速射砲 (8門)', count: '8門 (單裝耳台)', type: 'main', desc: 'SCB-27A 現代化改裝，射速大幅提升' },
        { name: '3吋50倍徑 Mark 33 雙聯裝自動防空砲', count: '16門 (8座雙聯裝)', type: 'aa', desc: '取代博福斯的雷達射控 VT 自動防空砲' },
        { name: 'H-8 液壓噴射彈射器與強化攔阻索', count: '2具彈射軌', type: 'asw', desc: '支援 F9F 黑豹與 F2H 女妖全重出擊' },
        { name: '時代三遠東艦載航空聯隊', count: '8款海空主力', type: 'main', desc: 'F8F / F9F黑豹 / F2H女妖 / AD-1天襲者 / F4U-4 / AF衛士 / AD-3W預警機 / HO3S-1直升機' },
      ],
      flakCooldown: 0,
      flakRange: 1050,
      carrierPlanes: {
        ready: { f8f: 4, f9f: 8, f2h: 6, ad1: 8, f4u4: 6, af_guardian: 4, ad3w: 2, ho3s1: 2 },
        hangar: { f8f: 6, f9f: 12, f2h: 8, ad1: 12, f4u4: 8, af_guardian: 6, ad3w: 2, ho3s1: 2 },
        maxPerType: { f8f: 8, f9f: 14, f2h: 10, ad1: 14, f4u4: 10, af_guardian: 6, ad3w: 2, ho3s1: 2 },
      },
    }),

    // 2. USS Missouri (BB-63) - 密蘇里號戰列艦 (韓戰戰略岸轟與旗艦屏衛)
    createShip({
      id: 'player-bb1',
      name: 'USS Missouri (BB-63)',
      codeName: 'Mighty Mo',
      type: 'battleship',
      side: 'player',
      era: 'era3',
      pos: { x: cvPos.x - 220, y: cvPos.y + 220 },
      heading: initialHeading,
      speed: 14,
      maxSpeed: 32,
      length: 145,
      width: 22,
      health: 6200,
      maxHealth: 6200,
      armor: 0.45,
      detectionRange: 3800,
      turrets: [
        createTurret(42, 0, '16-inch/50 Triple Mk 7 (No.1 艦艏主砲)', 2100, 7.5, 3, initialHeading, 380),
        createTurret(26, 0, '16-inch/50 Triple Mk 7 (No.2 背負主砲)', 2100, 7.5, 3, initialHeading, 380),
        createTurret(-34, 0, '16-inch/50 Triple Mk 7 (No.3 艦艉主砲)', 2100, 7.5, 3, initialHeading, 380),
        createTurret(12, 12, '5-inch/38 Twin Mk 28 (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(12, -12, '5-inch/38 Twin Mk 28 (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(4, 12, '5-inch/38 Twin Mk 28 (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(4, -12, '5-inch/38 Twin Mk 28 (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-4, 12, '5-inch/38 Twin Mk 28 (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-4, -12, '5-inch/38 Twin Mk 28 (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-12, 12, '5-inch/38 Twin Mk 28 (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-12, -12, '5-inch/38 Twin Mk 28 (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-20, 12, '5-inch/38 Twin Mk 28 (右舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
        createTurret(-20, -12, '5-inch/38 Twin Mk 28 (左舷5吋/38雙聯高平砲)', 1150, 2.2, 2, initialHeading, 80),
      ],
      detailedArmaments: [
        { name: '16吋50倍徑三聯裝 Mark 7 巨型艦砲', count: '9門 (3座三聯裝)', type: 'main', desc: '穿甲超重彈 (AP Mark 8) 與高爆岸轟彈，毀滅敵要塞' },
        { name: '5吋38倍徑雙聯裝高平兩用砲', count: '20門 (10座雙聯裝)', type: 'secondary', desc: 'VT信管防空射控' },
        { name: '3吋50倍徑雙聯自動防空砲群', count: '20門', type: 'aa', desc: '韓戰改裝先進雷達防空火網' },
      ],
      flakCooldown: 0,
      flakRange: 960,
    }),

    // 3. USS Des Moines (CA-134) - 得梅因號全自動重巡洋艦
    createShip({
      id: 'player-ca1',
      name: 'USS Des Moines (CA-134)',
      codeName: 'Autoloader Citadel',
      type: 'cruiser',
      side: 'player',
      era: 'era3',
      pos: { x: cvPos.x + 280, y: cvPos.y - 120 },
      heading: initialHeading,
      speed: 16,
      maxSpeed: 33,
      length: 120,
      width: 20,
      health: 3800,
      maxHealth: 3800,
      armor: 0.38,
      detectionRange: 3400,
      turrets: [
        createTurret(32, 0, '8-inch/55 Triple Mk 16 Auto (No.1 艦艏主砲)', 1600, 1.8, 3, initialHeading, 240),
        createTurret(18, 0, '8-inch/55 Triple Mk 16 Auto (No.2 背負主砲)', 1600, 1.8, 3, initialHeading, 240),
        createTurret(-28, 0, '8-inch/55 Triple Mk 16 Auto (No.3 艦艉主砲)', 1600, 1.8, 3, initialHeading, 240),
        createTurret(6, -9, '5-inch/38 Twin (右舷副砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-6, -9, '5-inch/38 Twin (右舷副砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(6, 9, '5-inch/38 Twin (左舷副砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-6, 9, '5-inch/38 Twin (左舷副砲)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(11, 0, '5-inch/38 Twin (艦橋前中線雙聯)', 1100, 2.2, 2, initialHeading, 70),
        createTurret(-21, 0, '5-inch/38 Twin (艦艉中線雙聯)', 1100, 2.2, 2, initialHeading, 70),
      ],
      detailedArmaments: [
        { name: '8吋55倍徑自動裝填三聯裝主砲 (9門)', count: '9門 (每門每分鐘10發速射!)', type: 'main', desc: '全自動液壓裝填，火力密度超越以往重巡3倍！' },
        { name: '5吋38倍徑雙聯裝高平砲', count: '12門', type: 'secondary', desc: '防空與近距打擊' },
        { name: '3吋50倍徑雙聯裝高射砲', count: '24門', type: 'aa', desc: 'VT信管近炸防空' },
      ],
      flakCooldown: 0,
      flakRange: 880,
    }),

    // 4. USS Gearing (DD-710) - 基靈號大型艦隊驅逐艦 (長艦體雷達先鋒)
    createShip({
      id: 'player-dd1',
      name: 'USS Gearing (DD-710)',
      codeName: 'Radar Picket Lead',
      type: 'destroyer',
      side: 'player',
      era: 'era3',
      pos: { x: cvPos.x + 360, y: cvPos.y + 120 },
      heading: initialHeading,
      speed: 17,
      maxSpeed: 36,
      length: 85,
      width: 15,
      health: 2100,
      maxHealth: 2100,
      armor: 0.22,
      detectionRange: 3200,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 12,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      hasHedgehog: true,
      hedgehogCooldown: 0,
      turrets: [
        createTurret(24, 0, '5-inch/38 Mk 38 Twin (No.51 艦艏雙聯)', 1100, 2.0, 2, initialHeading, 80),
        createTurret(14, 0, '5-inch/38 Mk 38 Twin (No.52 背負雙聯)', 1100, 2.0, 2, initialHeading, 80),
        createTurret(-20, 0, '5-inch/38 Mk 38 Twin (No.53 艦艉雙聯)', 1100, 2.0, 2, initialHeading, 80),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑 Mark 38 雙聯裝高平砲', count: '6門 (3座雙聯裝)', type: 'main', desc: '雷達射控速射砲' },
        { name: '3吋50倍徑 Mark 33 雙聯防空快砲', count: '6門', type: 'aa', desc: '攔截敵噴射轟炸機' },
        { name: '533mm 五聯裝魚雷發射管', count: '5管', type: 'torpedo', desc: '反艦重型魚雷' },
        { name: '刺蝟砲 (Hedgehog Mk 15 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏聲納聯動刺蝟迫擊砲彈幕' },
      ],
      flakCooldown: 0,
      flakRange: 750,
    }),

    // 5. USS Frank Knox (DD-742) - 弗蘭克·諾克斯號基靈級驅逐艦
    createShip({
      id: 'player-dd2',
      name: 'USS Frank Knox (DD-742)',
      codeName: 'Iron Vanguard',
      type: 'destroyer',
      side: 'player',
      era: 'era3',
      pos: { x: cvPos.x - 300, y: cvPos.y - 180 },
      heading: initialHeading,
      speed: 17,
      maxSpeed: 36,
      length: 85,
      width: 15,
      health: 2100,
      maxHealth: 2100,
      armor: 0.22,
      detectionRange: 3200,
      hasTorpedoes: true,
      torpedoCooldown: 2,
      torpedoReloadTime: 12,
      hasDepthCharges: true,
      depthChargeCooldown: 0,
      hasHedgehog: true,
      hedgehogCooldown: 0,
      turrets: [
        createTurret(24, 0, '5-inch/38 Mk 38 Twin (No.51 艦艏雙聯)', 1100, 2.0, 2, initialHeading, 80),
        createTurret(14, 0, '5-inch/38 Mk 38 Twin (No.52 背負雙聯)', 1100, 2.0, 2, initialHeading, 80),
        createTurret(-20, 0, '5-inch/38 Mk 38 Twin (No.53 艦艉雙聯)', 1100, 2.0, 2, initialHeading, 80),
      ],
      detailedArmaments: [
        { name: '5吋38倍徑 Mark 38 雙聯裝高平砲', count: '6門', type: 'main', desc: '雷達防空' },
        { name: '3吋50倍徑雙聯防空快砲', count: '6門', type: 'aa', desc: '防空火力' },
        { name: '533mm 五聯裝魚雷發射管', count: '5管', type: 'torpedo', desc: '魚雷戰備' },
        { name: '刺蝟砲 (Hedgehog Mk 15 24聯裝)', count: '24發向前拋射', type: 'asw', desc: '艦艏自動聲納火控刺蝟彈' },
      ],
      flakCooldown: 0,
      flakRange: 750,
    })
  );
}

// Heading 225° (South-West)
/** The historical OPFOR task force for each era. */
function addEnemyTaskForce(era: Era, enemyShips: Ship[], enemyCenter: Vector2D, enemyHeading: number): void {
  if (era === 'era1') {
    addEnemyFleetEra1(enemyShips, enemyCenter, enemyHeading);
  } else if (era === 'era2') {
    addEnemyFleetEra2(enemyShips, enemyCenter, enemyHeading);
  } else if (era === 'era3') {
    addEnemyFleetEra3(enemyShips, enemyCenter, enemyHeading);
  } else if (era === 'era4') {
    // ═══════════════════════════════════════════════════════════════════════
    // ERA 4: OPFOR SOVIET NAVAL ADVISORY GROUP & VPAF/VPN TASK FORCE (蘇聯海軍顧問特混群與北越艦艇隊)
    // 導向飛彈驅逐艦: Project 61 Kashin-class (DDG Krasny Kavkaz, 76mm速射砲, SA-N-1 Goa防空飛彈, RBU-6000)
    // 主力護衛艦: Project 50 Riga-class (FFG HQ-01, 3x 100mm 艦砲, 37mm雙管防空砲)
    // 重型飛彈快艇: 2x Project 205 Osa-class (PTG-351, PTG-352, 4聯裝 P-15 冥河飛彈, 30mm AK-230雙管機砲)
    // 輕型飛彈快艇: 1x Project 183R Komar-class (PTG-181, 2聯裝 P-15 冥河飛彈, 44kt)
    // 遠洋常規攻擊潛艦: Project 641 Foxtrot-class (B-427, 10具 533mm魚雷發射管)
    // ═══════════════════════════════════════════════════════════════════════
    enemyShips.push(
      createKashinDDG('enemy-kashin-1', 'Project 61 Kashin (DDG Krasny Kavkaz)', enemyCenter),
      createRigaFFG('enemy-riga-1', 'Project 50 Riga (HQ-01)', { x: enemyCenter.x - 420, y: enemyCenter.y + 240 }),
      createOsaPTG('enemy-osa-1', 'Project 205 Osa (PTG-351)', { x: enemyCenter.x + 360, y: enemyCenter.y - 180 }),
      createOsaPTG('enemy-osa-2', 'Project 205 Osa (PTG-352)', { x: enemyCenter.x + 500, y: enemyCenter.y + 140 }),
      createKomarMissileBoat('enemy-komar-1', 'Project 183R Komar (PTG-181)', { x: enemyCenter.x - 220, y: enemyCenter.y - 280 }),
      createFoxtrotSS('enemy-foxtrot-1', 'Project 641 Foxtrot (B-427)', { x: 3200, y: 3800 }),
      createP4TorpedoBoat('enemy-p4-1', 'Project 123K P-4 (T-333)', { x: enemyCenter.x - 520, y: enemyCenter.y + 420 }),
      createP4TorpedoBoat('enemy-p4-2', 'Project 123K P-4 (T-336)', { x: enemyCenter.x - 600, y: enemyCenter.y + 360 })
    );
  } else if (era === 'era5') {
    // ═══════════════════════════════════════════════════════════════════════
    // ERA 5: OPFOR SOVIET RED BANNER NORTHERN FLEET (蘇聯紅海軍北方艦隊主力特遣隊)
    // 重型航空巡洋艦: Project 1143 Kiev (基輔號, P-500, SA-N-3, AK-630, Yak-38, Ka-27)
    // 核動力戰鬥巡洋艦: Project 1144 Kirov (基洛夫號, 20x P-700花崗岩, S-300F堡壘, AK-130, AK-630)
    // 導向飛彈驅逐艦: Project 956 Sovremenny (現代號, 8x Moskit超音速反艦飛彈, 颶風SAM, AK-130, AK-630)
    // 大型反潛驅逐艦: Project 1155 Udaloy (無畏號, 8x Rastrub反潛飛彈, 匕首VLS, AK-100, AK-630)
    // 巡航導彈核潛艦: Project 949A Oscar II (奧斯卡級, 24x P-700花崗岩潛射飛彈, 650mm魚雷)
    // ═══════════════════════════════════════════════════════════════════════
    enemyShips.push(
      createKievCVHG('enemy-kiev-1', 'Project 1143 Kiev (CVHG Kiev)', enemyCenter),
      createKirovCGN('enemy-kirov-1', 'Project 1144 Kirov (CGN Kirov)', { x: enemyCenter.x - 380, y: enemyCenter.y + 220 }),
      createSovremennyDD('enemy-sovremenny-1', 'Project 956 Sovremenny (DDG-670)', { x: enemyCenter.x + 360, y: enemyCenter.y - 180 }),
      createUdaloyDD('enemy-udaloy-1', 'Project 1155 Udaloy (DDG-680)', { x: enemyCenter.x - 240, y: enemyCenter.y - 240 }),
      createSlavaCG('enemy-slava-1', 'Project 1164 Slava (Marshal Ustinov)', { x: enemyCenter.x + 420, y: enemyCenter.y + 300 }),
      createOscarSSGN('enemy-oscar-1', 'Project 949A Oscar II (K-148 Krasnodar)', { x: 3400, y: 3600 })
    );
  }
}

/** 1942: Nagumo's First Air Fleet and the Guadalcanal bombardment force. */
function addEnemyFleetEra1(enemyShips: Ship[], enemyCenter: Vector2D, enemyHeading: number): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 1: 1st CARRIER STRIKING FORCE & VANGUARD (南雲機動部隊與近藤前進部隊)
  // 旗艦: IJN Shōkaku (翔鶴號大型正規航母)
  // 戰艦: IJN Hiei (比叡號金剛級高速戰艦, 356mm主砲)
  // 重巡洋艦: IJN Chōkai (鳥海號第八艦隊旗艦, 10門203mm, 16枚九三式氧氣魚雷)
  // 防空驅逐艦: IJN Akizuki (秋月號, 8門100mm長身管雙聯高角砲)
  // 一等驅逐艦: IJN Kagerō (陽炎號), IJN Yukikaze (雪風號)
  // 伏擊潛艇: I-19 (伊-19號)
  // ═══════════════════════════════════════════════════════════════════════
  enemyShips.push(
    // 1. IJN Shōkaku (Fleet Carrier) - 翔鶴號大型正規航母
    createShip({
      id: 'enemy-cv-1',
      name: 'IJN Shokaku (Fleet Carrier)',
      codeName: 'Crane of Good Omen',
      type: 'carrier',
      side: 'enemy',
      era: 'era1',
      pos: { ...enemyCenter },
      heading: enemyHeading,
      speed: 12,
      maxSpeed: 27,
      length: 122,
      width: 26,
      health: 3200,
      maxHealth: 3200,
      armor: 0.28,
      detectionRange: 3200,
      turrets: [
        createTurret(30, 10, '127mm Twin Type 89 (右舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(30, -10, '127mm Twin Type 89 (左舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(22, 10, '127mm Twin Type 89 (右舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(22, -10, '127mm Twin Type 89 (左舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(-20, 10, '127mm Twin Type 89 (右舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(-20, -10, '127mm Twin Type 89 (左舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(-28, 10, '127mm Twin Type 89 (右舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
        createTurret(-28, -10, '127mm Twin Type 89 (左舷高角砲)', 950, 3.0, 2, enemyHeading, 65),
      ],
      detailedArmaments: [
        { name: '127mm 雙聯裝高角砲', count: '16門 (8座雙聯裝)', type: 'secondary', desc: '八九式高角防空砲，舷側耳台配置' },
        { name: '25mm 九六式高射機砲群', count: '42門 (三聯裝/雙聯裝群)', type: 'aa', desc: '近程高射機砲' },
        { name: '第五航空戰隊航空聯隊', count: '72-84架', type: 'main', desc: '零戰二一型 / 九九艦爆 / 九七艦攻' },
      ],
      flakCooldown: 0,
      flakRange: 720,
    }),

    // 2. IJN Hiei (Fast Battleship) - 比叡號高速戰艦 (金剛級)
    createShip({
      id: 'enemy-bb-1',
      name: 'IJN Hiei (Fast Battleship)',
      codeName: 'Iron Dragon',
      type: 'battleship',
      side: 'enemy',
      era: 'era1',
      pos: { x: enemyCenter.x - 220, y: enemyCenter.y + 240 },
      heading: enemyHeading,
      speed: 12,
      maxSpeed: 28,
      length: 110,
      width: 24,
      health: 4600,
      maxHealth: 4600,
      armor: 0.42,
      detectionRange: 2900,
      turrets: [
        createTurret(28, 0, '356mm Twin Type 41 (No.1 艦艏雙聯)', 1650, 6.5, 2, enemyHeading, 240),
        createTurret(16, 0, '356mm Twin Type 41 (No.2 背負雙聯)', 1650, 6.5, 2, enemyHeading, 240),
        createTurret(-18, 0, '356mm Twin Type 41 (No.3 背負雙聯)', 1650, 6.5, 2, enemyHeading, 240),
        createTurret(-28, 0, '356mm Twin Type 41 (No.4 艦艉雙聯)', 1650, 6.5, 2, enemyHeading, 240),
        createTurret(14, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(14, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(9, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(9, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(4, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(4, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-1, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-1, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-6, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-6, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-11, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-11, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-15, 11, '152mm Single (右舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(-15, -11, '152mm Single (左舷15.2cm副砲(砲郭))', 1100, 3.2, 1, enemyHeading, 80),
        createTurret(2, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(2, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-8, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-8, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '356mm 45倍徑四一式雙聯裝主砲', count: '8門 (4座雙聯裝)', type: 'main', desc: '金剛級高速戰艦重型巨砲' },
        { name: '152mm 50倍徑副砲', count: '14門 (單裝廓砲)', type: 'secondary', desc: '舷側副砲群' },
        { name: '127mm 雙聯裝高角砲', count: '8門 (4座雙聯裝)', type: 'secondary', desc: '防空防護火網' },
      ],
      flakCooldown: 0,
      flakRange: 750,
    }),

    // 3. IJN Chōkai (Heavy Cruiser) - 鳥海號重巡洋艦 (高雄級, 第八艦隊旗艦)
    createShip({
      id: 'enemy-ca-1',
      name: 'IJN Chokai (Heavy Cruiser)',
      codeName: 'Night Raiding Flagship',
      type: 'cruiser',
      side: 'enemy',
      era: 'era1',
      pos: { x: enemyCenter.x - 380, y: enemyCenter.y + 420 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 28,
      length: 90,
      width: 17,
      health: 2600,
      maxHealth: 2600,
      armor: 0.32,
      detectionRange: 2800,
      hasTorpedoes: true,
      torpedoCooldown: 4,
      torpedoReloadTime: 18,
      turrets: [
        createTurret(26, 0, '203mm Dual Type 3 (No.1 艦艏雙聯)', 1350, 5.0, 2, enemyHeading, 130),
        createTurret(17, 0, '203mm Dual Type 3 (No.2 背負雙聯)', 1350, 5.0, 2, enemyHeading, 130),
        createTurret(8, 0, '203mm Dual Type 3 (No.3 背負反向)', 1350, 5.0, 2, enemyHeading, 130),
        createTurret(-16, 0, '203mm Dual Type 3 (No.4 背負雙聯)', 1350, 5.0, 2, enemyHeading, 130),
        createTurret(-25, 0, '203mm Dual Type 3 (No.5 艦艉雙聯)', 1350, 5.0, 2, enemyHeading, 130),
        createTurret(0, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-7, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-7, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '203mm 雙聯裝三年式主砲', count: '10門 (5座雙聯裝)', type: 'main', desc: '高雄級強大水面砲戰火力' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '16管 (4座四聯裝)', type: 'torpedo', desc: '長矛魚雷 (Long Lance)，射程極遠航速極高' },
        { name: '127mm 雙聯裝高角砲', count: '8門', type: 'secondary', desc: '高角防空' },
      ],
      flakCooldown: 0,
      flakRange: 650,
    }),

    // 4. IJN Akizuki (Flak Destroyer) - 秋月號防空驅逐艦
    createShip({
      id: 'enemy-dd-1',
      name: 'IJN Akizuki (Flak Destroyer)',
      type: 'destroyer',
      side: 'enemy',
      era: 'era1',
      pos: { x: enemyCenter.x + 320, y: enemyCenter.y - 120 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 30,
      length: 68,
      width: 12,
      health: 1400,
      maxHealth: 1400,
      armor: 0.18,
      detectionRange: 2700,
      hasTorpedoes: true,
      torpedoCooldown: 4,
      torpedoReloadTime: 16,
      turrets: [
        createTurret(24, 0, '100mm Type 98 Twin (No.1 艦艏雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(15, 0, '100mm Type 98 Twin (No.2 背負雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(-15, 0, '100mm Type 98 Twin (No.3 背負雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(-24, 0, '100mm Type 98 Twin (No.4 艦艉雙聯)', 1150, 2.0, 2, enemyHeading, 80),
      ],
      detailedArmaments: [
        { name: '100mm 65倍徑九八式雙聯高角砲', count: '8門 (4座雙聯裝)', type: 'main', desc: '長身管高射速防空主砲' },
        { name: '25mm 三聯裝防空機砲', count: '29門', type: 'aa', desc: '護衛防空' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '4管', type: 'torpedo', desc: '長程氧氣魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 750,
    }),

    // 5. IJN Kagerō (Destroyer) - 陽炎號驅逐艦
    createShip({
      id: 'enemy-dd-2',
      name: 'IJN Kagero (Destroyer)',
      type: 'destroyer',
      side: 'enemy',
      era: 'era1',
      pos: { x: enemyCenter.x - 520, y: enemyCenter.y + 600 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 28,
      length: 64,
      width: 12,
      health: 1150,
      maxHealth: 1150,
      armor: 0.14,
      detectionRange: 2600,
      hasTorpedoes: true,
      torpedoCooldown: 2,
      torpedoReloadTime: 18,
      turrets: [
        createTurret(20, 0, '127mm Twin Type 3 (No.1 艦艏雙聯)', 1050, 3.0, 2, enemyHeading, 65),
        createTurret(-14, 0, '127mm Twin Type 3 (No.2 艦艉雙聯)', 1050, 3.0, 2, enemyHeading, 65),
        createTurret(-22, 0, '127mm Twin Type 3 (No.3 背負雙聯)', 1050, 3.0, 2, enemyHeading, 65),
      ],
      detailedArmaments: [
        { name: '127mm 雙聯裝三年式主砲', count: '6門 (3座雙聯裝)', type: 'main', desc: '陽炎級水面主砲' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '8管 (2座四聯裝)', type: 'torpedo', desc: '長程雷擊' },
      ],
      flakCooldown: 0,
      flakRange: 550,
    }),

    // 6. IJN Yukikaze (Destroyer) - 雪風號驅逐艦 (奇蹟之不沉艦)
    createShip({
      id: 'enemy-dd-3',
      name: 'IJN Yukikaze (Destroyer)',
      codeName: 'Miracle Ship',
      type: 'destroyer',
      side: 'enemy',
      era: 'era1',
      pos: { x: enemyCenter.x + 180, y: enemyCenter.y + 350 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 29,
      length: 64,
      width: 12,
      health: 1300,
      maxHealth: 1300,
      armor: 0.16,
      detectionRange: 2600,
      hasTorpedoes: true,
      torpedoCooldown: 2,
      torpedoReloadTime: 18,
      turrets: [
        createTurret(20, 0, '127mm Twin Type 3 (No.1 艦艏雙聯)', 1050, 3.0, 2, enemyHeading, 65),
        createTurret(-14, 0, '127mm Twin Type 3 (No.2 艦艉雙聯)', 1050, 3.0, 2, enemyHeading, 65),
        createTurret(-22, 0, '127mm Twin Type 3 (No.3 背負雙聯)', 1050, 3.0, 2, enemyHeading, 65),
      ],
      detailedArmaments: [
        { name: '127mm 雙聯裝主砲', count: '6門', type: 'main', desc: '陽炎級甲型驅逐艦' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '8管', type: 'torpedo', desc: '九三式氧氣魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 550,
    }),

    // 7. I-19 (Submarine) - 伊-19號潛艦 (伏擊於中央水道)
    createShip({
      id: 'enemy-sub-1',
      name: 'I-19 (Cruiser Submarine)',
      type: 'submarine',
      side: 'enemy',
      era: 'era1',
      pos: { x: 7200, y: 7400 },
      heading: -Math.PI / 2,
      speed: 6,
      maxSpeed: 14,
      length: 56,
      width: 9,
      health: 750,
      maxHealth: 750,
      armor: 0.08,
      detectionRange: 1600,
      isSubmerged: true,
      hasTorpedoes: true,
      torpedoCooldown: 8,
      torpedoReloadTime: 22,
      turrets: [],
      detailedArmaments: [
        { name: '533mm 艦首魚雷發射管', count: '6門發射管', type: 'torpedo', desc: '曾一役擊沉胡蜂號航母與奧布萊恩號驅逐艦' },
        { name: '140mm 單裝甲板砲', count: '1門', type: 'secondary', desc: '水面砲' },
      ],
      flakCooldown: 0,
      flakRange: 0,
    })
  );
}

/** 1944-45: Kurita's Centre Force and the Mobile Fleet. */
function addEnemyFleetEra2(enemyShips: Ship[], enemyCenter: Vector2D, enemyHeading: number): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 2: KURITA CENTER FORCE & 1st MOBILE FLEET (栗田主力艦隊與第一機動艦隊)
  // 戰艦: IJN Yamato (大和號超級戰艦, 9門 460mm 巨砲, 162門防空砲!)
  // 航母: IJN Taihō (大鳳號重裝甲航母)
  // 戰艦: IJN Kongō (金剛號高速戰艦, 356mm主砲)
  // 重巡洋艦: IJN Takao (高雄號重巡洋艦, 10門203mm, 16枚氧氣魚雷)
  // 輕巡洋艦: IJN Yahagi (矢矧號水雷戰隊旗艦, 152mm主砲)
  // 特型驅逐艦: IJN Shimakaze (島風號, 15管氧氣魚雷齊射!)
  // 防空驅逐艦: IJN Akizuki (秋月號)
  // 特型潛艦: I-400 (伊-400號特型潛艦)
  // ═══════════════════════════════════════════════════════════════════════
  enemyShips.push(
    // 1. IJN Yamato (Super Battleship) - 大和號超級戰列艦
    createShip({
      id: 'enemy-bb-1',
      name: 'IJN Yamato (Super Battleship)',
      codeName: 'Imperial Behemoth',
      type: 'battleship',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x - 280, y: enemyCenter.y + 280 },
      heading: enemyHeading,
      speed: 11,
      maxSpeed: 27,
      length: 138,
      width: 32,
      health: 6600,
      maxHealth: 6600,
      armor: 0.62,
      detectionRange: 3200,
      turrets: [
        createTurret(40, 0, '460mm Triple Type 94 (No.1 艦艏巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(25, 0, '460mm Triple Type 94 (No.2 背負巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(-36, 0, '460mm Triple Type 94 (No.3 艦艉巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(10, 0, '155mm Triple Type 3 (艦艏副砲)', 1400, 4.0, 3, enemyHeading, 130),
        createTurret(-22, 0, '155mm Triple Type 3 (艦艉副砲)', 1400, 4.0, 3, enemyHeading, 130),
        createTurret(12, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(12, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(6, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(6, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-6, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-6, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-18, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-18, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '460mm 45倍徑九四式三聯裝巨砲', count: '9門 (3座三聯裝)', type: 'main', desc: '人類海軍史上最大艦砲，九一式穿甲彈毀滅打擊' },
        { name: '155mm 60倍徑三聯裝副砲', count: '6門 (2座三聯裝)', type: 'secondary', desc: '最上級巡洋艦拆卸主砲改裝副砲，精準密射' },
        { name: '127mm 雙聯裝高角砲', count: '24門 (12座雙聯裝)', type: 'secondary', desc: '防空防護火網' },
        { name: '25mm 九六式防空機砲群', count: '162門 (52座三聯裝 + 6單裝)', type: 'aa', desc: '極度密集的刺蝟防空火網' },
      ],
      flakCooldown: 0,
      flakRange: 920,
    }),
    // 1b. IJN Musashi - 武藏號 (大和級二號艦，1944 年 10 月 24 日錫布延海遭 19 枚魚雷、17 枚炸彈擊沉)
    createShip({
      id: 'enemy-bb-2',
      name: 'IJN Musashi (Super Battleship)',
      codeName: 'Imperial Behemoth',
      type: 'battleship',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x - 280 - 360, y: enemyCenter.y + 280  + 260 },
      heading: enemyHeading,
      speed: 11,
      maxSpeed: 27,
      length: 138,
      width: 32,
      health: 6600,
      maxHealth: 6600,
      armor: 0.62,
      detectionRange: 3200,
      turrets: [
        createTurret(40, 0, '460mm Triple Type 94 (No.1 艦艏巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(25, 0, '460mm Triple Type 94 (No.2 背負巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(-36, 0, '460mm Triple Type 94 (No.3 艦艉巨砲)', 2100, 8.5, 3, enemyHeading, 380),
        createTurret(10, 0, '155mm Triple Type 3 (艦艏副砲)', 1400, 4.0, 3, enemyHeading, 130),
        createTurret(-22, 0, '155mm Triple Type 3 (艦艉副砲)', 1400, 4.0, 3, enemyHeading, 130),
        createTurret(12, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(12, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(6, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(6, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-6, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-6, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-18, 14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-18, -14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '460mm 45倍徑九四式三聯裝巨砲', count: '9門 (3座三聯裝)', type: 'main', desc: '人類海軍史上最大艦砲，九一式穿甲彈毀滅打擊' },
        { name: '155mm 60倍徑三聯裝副砲', count: '6門 (2座三聯裝)', type: 'secondary', desc: '最上級巡洋艦拆卸主砲改裝副砲，精準密射' },
        { name: '127mm 雙聯裝高角砲', count: '24門 (12座雙聯裝)', type: 'secondary', desc: '防空防護火網' },
        { name: '25mm 九六式防空機砲群', count: '162門 (52座三聯裝 + 6單裝)', type: 'aa', desc: '極度密集的刺蝟防空火網' },
      ],
      flakCooldown: 0,
      flakRange: 920,
    }),

    // 2. IJN Taihō (Armored Carrier) - 大鳳號裝甲航空母艦
    createShip({
      id: 'enemy-cv-1',
      name: 'IJN Taiho (Armored Carrier)',
      codeName: 'Armored Phoenix',
      type: 'carrier',
      side: 'enemy',
      era: 'era2',
      pos: { ...enemyCenter },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 28,
      length: 126,
      width: 27,
      health: 4400,
      maxHealth: 4400,
      armor: 0.44,
      detectionRange: 3400,
      turrets: [
        createTurret(26, -11, '100mm Type 98 Twin AA (右舷前高角砲)', 1100, 2.2, 2, enemyHeading, 75),
        createTurret(10, -11, '100mm Type 98 Twin AA (右舷中高角砲)', 1100, 2.2, 2, enemyHeading, 75),
        createTurret(-22, -11, '100mm Type 98 Twin AA (右舷後高角砲)', 1100, 2.2, 2, enemyHeading, 75),
        createTurret(26, 11, '100mm Type 98 Twin AA (左舷前高角砲)', 1100, 2.2, 2, enemyHeading, 75),
        createTurret(10, 11, '100mm Type 98 Twin AA (左舷中高角砲)', 1100, 2.2, 2, enemyHeading, 75),
        createTurret(-22, 11, '100mm Type 98 Twin AA (左舷後高角砲)', 1100, 2.2, 2, enemyHeading, 75),
      ],
      detailedArmaments: [
        { name: '100mm 65倍徑九八式雙聯高角砲', count: '12門 (6座雙聯裝)', type: 'secondary', desc: '高射速長身管高射砲，兩舷耳台配置' },
        { name: '25mm 三聯裝九六式防空砲', count: '51門 (17座三聯裝)', type: 'aa', desc: '重裝甲飛行甲板防禦圈' },
        { name: '新型艦載機聯隊', count: '65架', type: 'main', desc: '紫電改 / 彗星艦爆 / 天山艦攻' },
      ],
      flakCooldown: 0,
      flakRange: 820,
    }),

    // 3. IJN Kongō (Fast Battleship) - 金剛號高速戰艦
    createShip({
      id: 'enemy-bb-2',
      name: 'IJN Kongo (Fast Battleship)',
      codeName: 'Vanguard Titan',
      type: 'battleship',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x - 480, y: enemyCenter.y + 480 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 30,
      length: 112,
      width: 25,
      health: 4400,
      maxHealth: 4400,
      armor: 0.40,
      detectionRange: 3000,
      turrets: [
        createTurret(28, 0, '356mm Twin Type 41 (No.1 艦艏雙聯)', 1700, 6.2, 2, enemyHeading, 240),
        createTurret(16, 0, '356mm Twin Type 41 (No.2 背負雙聯)', 1700, 6.2, 2, enemyHeading, 240),
        createTurret(-18, 0, '356mm Twin Type 41 (No.3 背負雙聯)', 1700, 6.2, 2, enemyHeading, 240),
        createTurret(-28, 0, '356mm Twin Type 41 (No.4 艦艉雙聯)', 1700, 6.2, 2, enemyHeading, 240),
        createTurret(10, 12, '152mm Single (右舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(10, -12, '152mm Single (左舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(4, 12, '152mm Single (右舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(4, -12, '152mm Single (左舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(-2, 12, '152mm Single (右舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(-2, -12, '152mm Single (左舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(-8, 12, '152mm Single (右舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(-8, -12, '152mm Single (左舷15.2cm副砲(砲郭))', 1250, 3.5, 1, enemyHeading, 95),
        createTurret(6, 8, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(6, -8, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-4, 8, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-4, -8, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, 8, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-12, -8, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '356mm 45倍徑四一式雙聯主砲', count: '8門', type: 'main', desc: '高速戰艦砲群' },
        { name: '127mm 雙聯裝高角砲', count: '12門', type: 'secondary', desc: '防空副砲' },
        { name: '25mm 防空機砲群', count: '100+門', type: 'aa', desc: '末期防空密集火網' },
      ],
      flakCooldown: 0,
      flakRange: 780,
    }),

    // 4. IJN Takao (Heavy Cruiser) - 高雄號重巡洋艦
    createShip({
      id: 'enemy-ca-1',
      name: 'IJN Takao (Heavy Cruiser)',
      type: 'cruiser',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x - 620, y: enemyCenter.y + 650 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 29,
      length: 90,
      width: 18,
      health: 2900,
      maxHealth: 2900,
      armor: 0.35,
      detectionRange: 2800,
      hasTorpedoes: true,
      torpedoCooldown: 4,
      torpedoReloadTime: 18,
      turrets: [
        createTurret(26, 0, '203mm Dual Type 3 (No.1 艦艏雙聯)', 1380, 5.0, 2, enemyHeading, 130),
        createTurret(17, 0, '203mm Dual Type 3 (No.2 背負雙聯)', 1380, 5.0, 2, enemyHeading, 130),
        createTurret(8, 0, '203mm Dual Type 3 (No.3 背負反向)', 1380, 5.0, 2, enemyHeading, 130),
        createTurret(-16, 0, '203mm Dual Type 3 (No.4 背負雙聯)', 1380, 5.0, 2, enemyHeading, 130),
        createTurret(-25, 0, '203mm Dual Type 3 (No.5 艦艉雙聯)', 1380, 5.0, 2, enemyHeading, 130),
        createTurret(0, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(0, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-7, 7, '127mm Twin Type 89 (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
        createTurret(-7, -7, '127mm Twin Type 89 (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '203mm 雙聯裝三年式主砲', count: '10門', type: 'main', desc: '主力重巡砲戰' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '16管', type: 'torpedo', desc: '長矛魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 680,
    }),

    // 5. IJN Yahagi (Light Cruiser) - 矢矧號輕巡洋艦 (第二水雷戰隊旗艦)
    createShip({
      id: 'enemy-cl-1',
      name: 'IJN Yahagi (Light Cruiser)',
      codeName: 'DesRon 2 Flagship',
      type: 'cruiser',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x + 220, y: enemyCenter.y + 240 },
      heading: enemyHeading,
      speed: 14,
      maxSpeed: 32,
      length: 84,
      width: 15,
      health: 2200,
      maxHealth: 2200,
      armor: 0.25,
      detectionRange: 2800,
      hasTorpedoes: true,
      torpedoCooldown: 3,
      torpedoReloadTime: 16,
      turrets: [
        createTurret(24, 0, '152mm Twin Type 41 (No.1 艦艏雙聯)', 1200, 3.8, 2, enemyHeading, 100),
        createTurret(15, 0, '152mm Twin Type 41 (No.2 背負雙聯)', 1200, 3.8, 2, enemyHeading, 100),
        createTurret(-25, 0, '152mm Twin Type 41 (No.3 艦艉雙聯)', 1200, 3.8, 2, enemyHeading, 100),
      ],
      detailedArmaments: [
        { name: '152mm 雙聯裝主砲', count: '6門 (3座雙聯裝)', type: 'main', desc: '阿賀野級輕巡主砲' },
        { name: '610mm 四聯裝九三式氧氣魚雷', count: '8管 (2座四聯裝)', type: 'torpedo', desc: '重型氧氣魚雷' },
        { name: '25mm 防空高射機砲群', count: '30門', type: 'aa', desc: '防空護航' },
      ],
      flakCooldown: 0,
      flakRange: 660,
    }),

    // 6. IJN Shimakaze (Super Destroyer) - 島風號特型驅逐艦 (15管氧氣魚雷齊射!)
    createShip({
      id: 'enemy-dd-1',
      name: 'IJN Shimakaze (Super Destroyer)',
      codeName: 'Gale of the Sea',
      type: 'destroyer',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x - 780, y: enemyCenter.y + 820 },
      heading: enemyHeading,
      speed: 15,
      maxSpeed: 40,
      length: 72,
      width: 12,
      health: 1650,
      maxHealth: 1650,
      armor: 0.18,
      detectionRange: 2700,
      hasTorpedoes: true,
      torpedoCooldown: 1,
      torpedoReloadTime: 16,
      turrets: [
        createTurret(22, 0, '127mm Twin Type 3 (No.1 艦艏雙聯)', 1080, 2.8, 2, enemyHeading, 70),
        createTurret(-15, 0, '127mm Twin Type 3 (No.2 艦艉雙聯)', 1080, 2.8, 2, enemyHeading, 70),
        createTurret(-24, 0, '127mm Twin Type 3 (No.3 背負雙聯)', 1080, 2.8, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '610mm 五聯裝九三式氧氣魚雷 (15管齊射!)', count: '15管 (3座五聯裝發射管)', type: 'torpedo', desc: '世界最強水面魚雷齊射，15枚長矛魚雷扇面滅艦' },
        { name: '127mm 雙聯裝高平砲', count: '6門', type: 'main', desc: '高速驅逐艦砲戰' },
        { name: '高溫高壓蒸汽渦輪鍋爐', count: '40.9節極速', type: 'asw', desc: '極速機動突破敵艦隊反潛線' },
      ],
      flakCooldown: 0,
      flakRange: 620,
    }),

    // 7. IJN Akizuki (Flak Destroyer) - 秋月號防空驅逐艦
    createShip({
      id: 'enemy-dd-2',
      name: 'IJN Akizuki (Flak Destroyer)',
      type: 'destroyer',
      side: 'enemy',
      era: 'era2',
      pos: { x: enemyCenter.x + 360, y: enemyCenter.y - 120 },
      heading: enemyHeading,
      speed: 13,
      maxSpeed: 30,
      length: 68,
      width: 12,
      health: 1500,
      maxHealth: 1500,
      armor: 0.20,
      detectionRange: 2800,
      hasTorpedoes: true,
      torpedoCooldown: 5,
      torpedoReloadTime: 16,
      turrets: [
        createTurret(24, 0, '100mm Type 98 Twin (No.1 艦艏雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(15, 0, '100mm Type 98 Twin (No.2 背負雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(-15, 0, '100mm Type 98 Twin (No.3 背負雙聯)', 1150, 2.0, 2, enemyHeading, 80),
        createTurret(-24, 0, '100mm Type 98 Twin (No.4 艦艉雙聯)', 1150, 2.0, 2, enemyHeading, 80),
      ],
      detailedArmaments: [
        { name: '100mm 65倍徑九八式雙聯高角砲', count: '8門 (4座雙聯裝)', type: 'main', desc: '高射速長身管防空主砲' },
        { name: '25mm 三聯裝防空機砲群', count: '35門', type: 'aa', desc: '大和號護衛防空' },
      ],
      flakCooldown: 0,
      flakRange: 780,
    }),

    // 8. I-400 (Submarine Carrier) - 伊-400號特型潛艦
    createShip({
      id: 'enemy-sub-1',
      name: 'I-400 (Submarine Carrier)',
      type: 'submarine',
      side: 'enemy',
      era: 'era2',
      pos: { x: 7400, y: 7200 },
      heading: -Math.PI / 3,
      speed: 6,
      maxSpeed: 16,
      length: 70,
      width: 12,
      health: 980,
      maxHealth: 980,
      armor: 0.12,
      detectionRange: 1800,
      isSubmerged: true,
      hasTorpedoes: true,
      torpedoCooldown: 10,
      torpedoReloadTime: 20,
      turrets: [],
      detailedArmaments: [
        { name: '533mm 艦首魚雷發射管', count: '8門發射管', type: 'torpedo', desc: '重型潛射氧氣魚雷' },
        { name: '140mm 單裝甲板砲', count: '1門', type: 'secondary', desc: '水面重型甲板砲' },
        { name: '25mm 三聯裝耐壓防空砲', count: '9門', type: 'aa', desc: '防空砲' },
      ],
      flakCooldown: 0,
      flakRange: 0,
    })
  );
}

/** 1950-53: hypothetical Soviet Pacific Fleet surface group and torpedo boats. */
function addEnemyFleetEra3(enemyShips: Ship[], enemyCenter: Vector2D, enemyHeading: number): void {
  // ═══════════════════════════════════════════════════════════════════════
  // ERA 3: COLD WAR FAR EAST COALITION (冷戰遠東聯軍主力艦隊)
  // 巡洋艦: Red Fleet Sverdlov (斯維爾德洛夫級主力輕巡洋艦, 12門 152mm 主砲)
  // 艦隊驅逐艦: Skory-class (斯考利級驅逐艦 Skory DD-12 & DD-14, 130mm雙聯主砲)
  // 快速魚雷快艇: Project 183 Bolshevik (53式 P-6 魚雷快艇 PT-1, PT-2, PT-3, 42kt 極速)
  // 伏擊常規潛艦: Whiskey-class (W級常規柴電潛艇 S-117)
  // ═══════════════════════════════════════════════════════════════════════
  enemyShips.push(
    // 1. Red Fleet Sverdlov (Cruiser) - 斯維爾德洛夫級旗艦巡洋艦
    createShip({
      id: 'enemy-ca-1',
      name: 'Sverdlov (Cruiser)',
      codeName: 'Red Flagship',
      type: 'cruiser',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x - 240, y: enemyCenter.y + 240 },
      heading: enemyHeading,
      speed: 15,
      maxSpeed: 32,
      length: 125,
      width: 20,
      health: 4200,
      maxHealth: 4200,
      armor: 0.38,
      detectionRange: 3500,
      turrets: [
        createTurret(32, 0, '152mm Triple B-38 (No.1 艦艏三聯)', 1650, 2.2, 3, enemyHeading, 180),
        createTurret(18, 0, '152mm Triple B-38 (No.2 背負三聯)', 1650, 2.2, 3, enemyHeading, 180),
        createTurret(-18, 0, '152mm Triple B-38 (No.3 背負三聯)', 1650, 2.2, 3, enemyHeading, 180),
        createTurret(-32, 0, '152mm Triple B-38 (No.4 艦艉三聯)', 1650, 2.2, 3, enemyHeading, 180),
        createTurret(8, 9, '100mm Twin SM-5-1 (右舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
        createTurret(8, -9, '100mm Twin SM-5-1 (左舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
        createTurret(0, 9, '100mm Twin SM-5-1 (右舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
        createTurret(0, -9, '100mm Twin SM-5-1 (左舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
        createTurret(-8, 9, '100mm Twin SM-5-1 (右舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
        createTurret(-8, -9, '100mm Twin SM-5-1 (左舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
      ],
      detailedArmaments: [
        { name: '152mm 57倍徑 B-38 三聯裝巡洋艦砲 (12門)', count: '12門 (4座三聯裝)', type: 'main', desc: '全裝甲射擊指揮所，長程高穿透' },
        { name: '100mm 雙聯裝高平砲', count: '12門', type: 'secondary', desc: '雷達射控高射速' },
        { name: '37mm V-11 雙聯裝防空快砲群', count: '32門 (16座雙聯裝)', type: 'aa', desc: '密集近防火網' },
      ],
      flakCooldown: 0,
      flakRange: 920,
    }),

    // 2. Skory-class Destroyer (Skory DD-12) - 斯考利級驅逐艦
    createShip({
      id: 'enemy-dd-1',
      name: 'Skory (DD-12)',
      codeName: 'Red Guard Destroyer',
      type: 'destroyer',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x - 450, y: enemyCenter.y + 450 },
      heading: enemyHeading,
      speed: 17,
      maxSpeed: 36,
      length: 80,
      width: 14,
      health: 1800,
      maxHealth: 1800,
      armor: 0.22,
      detectionRange: 3000,
      hasTorpedoes: true,
      torpedoCooldown: 1,
      torpedoReloadTime: 14,
      turrets: [
        createTurret(20, 0, '130mm Twin B-13 (艦艏雙聯)', 1200, 2.0, 2, enemyHeading, 75),
        createTurret(-20, 0, '130mm Twin B-13 (艦艉雙聯)', 1200, 2.0, 2, enemyHeading, 75),
        createTurret(-12, 0, '85mm/52 92-K Twin (艦艉85mm雙聯防空砲)', 1000, 1.8, 2, enemyHeading, 60),
      ],
      detailedArmaments: [
        { name: '130mm 50倍徑 B-13 雙聯裝主砲', count: '4門 (2座雙聯裝)', type: 'main', desc: '高速驅逐艦砲戰火力' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管 (2座五聯裝)', type: 'torpedo', desc: '重型反艦魚雷' },
        { name: '37mm V-11 雙聯裝機砲', count: '4門', type: 'aa', desc: '防空防禦' },
      ],
      flakCooldown: 0,
      flakRange: 720,
    }),

    // 3. Skory-class Destroyer (Skory DD-14)
    createShip({
      id: 'enemy-dd-2',
      name: 'Skory (DD-14)',
      codeName: 'Red Guard Escort',
      type: 'destroyer',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x + 380, y: enemyCenter.y - 150 },
      heading: enemyHeading,
      speed: 17,
      maxSpeed: 36,
      length: 80,
      width: 14,
      health: 1800,
      maxHealth: 1800,
      armor: 0.22,
      detectionRange: 3000,
      hasTorpedoes: true,
      torpedoCooldown: 4,
      torpedoReloadTime: 14,
      turrets: [
        createTurret(20, 0, '130mm Twin B-13 (艦艏雙聯)', 1200, 2.0, 2, enemyHeading, 75),
        createTurret(-20, 0, '130mm Twin B-13 (艦艉雙聯)', 1200, 2.0, 2, enemyHeading, 75),
        createTurret(-12, 0, '85mm/52 92-K Twin (艦艉85mm雙聯防空砲)', 1000, 1.8, 2, enemyHeading, 60),
      ],
      detailedArmaments: [
        { name: '130mm 雙聯裝主砲', count: '4門', type: 'main', desc: '雷達射控' },
        { name: '533mm 五聯裝魚雷發射管', count: '10管', type: 'torpedo', desc: '雷擊戰備' },
      ],
      flakCooldown: 0,
      flakRange: 720,
    }),

    // 4. Project 183 Bolshevik (P-6 PT-1) - 53式魚雷快艇
    createShip({
      id: 'enemy-pt-1',
      name: 'Project 183 P-6 (PT-1)',
      codeName: 'Mosquito Striker',
      type: 'patrol_boat',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x - 700, y: enemyCenter.y + 700 },
      heading: enemyHeading,
      speed: 20,
      maxSpeed: 42,
      length: 42,
      width: 9,
      health: 650,
      maxHealth: 650,
      armor: 0.12,
      detectionRange: 2200,
      hasTorpedoes: true,
      torpedoCooldown: 0,
      torpedoReloadTime: 10,
      turrets: [
        createTurret(12, 0, '25mm Twin 2M-3 (艦艏機砲)', 800, 0.8, 2, enemyHeading, 60),
        createTurret(-12, 0, '25mm Twin 2M-3 (艦艉機砲)', 800, 0.8, 2, enemyHeading, 60),
      ],
      detailedArmaments: [
        { name: '533mm 魚雷發射管', count: '2管', type: 'torpedo', desc: '高速掠海突擊魚雷' },
        { name: '25mm 雙聯裝 2M-3 自動機砲', count: '4門', type: 'aa', desc: '近程速射防禦' },
      ],
      flakCooldown: 0,
      flakRange: 550,
    }),

    // 5. Project 183 Bolshevik (P-6 PT-2)
    createShip({
      id: 'enemy-pt-2',
      name: 'Project 183 P-6 (PT-2)',
      codeName: 'Mosquito Striker',
      type: 'patrol_boat',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x - 780, y: enemyCenter.y + 640 },
      heading: enemyHeading,
      speed: 20,
      maxSpeed: 42,
      length: 42,
      width: 9,
      health: 650,
      maxHealth: 650,
      armor: 0.12,
      detectionRange: 2200,
      hasTorpedoes: true,
      torpedoCooldown: 2,
      torpedoReloadTime: 10,
      turrets: [
        createTurret(12, 0, '25mm Twin 2M-3 (艦艏機砲)', 800, 0.8, 2, enemyHeading, 60),
        createTurret(-12, 0, '25mm Twin 2M-3 (艦艉機砲)', 800, 0.8, 2, enemyHeading, 60),
      ],
      detailedArmaments: [
        { name: '533mm 魚雷發射管', count: '2管', type: 'torpedo', desc: '掠海突擊魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 550,
    }),

    // 6. Project 183 Bolshevik (P-6 PT-3)
    createShip({
      id: 'enemy-pt-3',
      name: 'Project 183 P-6 (PT-3)',
      codeName: 'Mosquito Striker',
      type: 'patrol_boat',
      side: 'enemy',
      era: 'era3',
      pos: { x: enemyCenter.x - 620, y: enemyCenter.y + 760 },
      heading: enemyHeading,
      speed: 20,
      maxSpeed: 42,
      length: 42,
      width: 9,
      health: 650,
      maxHealth: 650,
      armor: 0.12,
      detectionRange: 2200,
      hasTorpedoes: true,
      torpedoCooldown: 3,
      torpedoReloadTime: 10,
      turrets: [
        createTurret(12, 0, '25mm Twin 2M-3 (艦艏機砲)', 800, 0.8, 2, enemyHeading, 60),
        createTurret(-12, 0, '25mm Twin 2M-3 (艦艉機砲)', 800, 0.8, 2, enemyHeading, 60),
      ],
      detailedArmaments: [
        { name: '533mm 魚雷發射管', count: '2管', type: 'torpedo', desc: '掠海突擊魚雷' },
      ],
      flakCooldown: 0,
      flakRange: 550,
    }),

    // 7. Whiskey-class Submarine (S-117) - W級常規潛艦
    createShip({
      id: 'enemy-sub-1',
      name: 'Whiskey-class (S-117)',
      codeName: 'Black Phantom',
      type: 'submarine',
      subVariant: 'whiskey',
      side: 'enemy',
      era: 'era3',
      pos: { x: 3200, y: 3800 },
      heading: -Math.PI / 3,
      speed: 7,
      maxSpeed: 17,
      length: 76,
      width: 10,
      health: 1100,
      maxHealth: 1100,
      armor: 0.15,
      detectionRange: 2000,
      sonarRange: 1150,
      isSubmerged: true,
      hasTorpedoes: true,
      torpedoCooldown: 8,
      torpedoReloadTime: 18,
      turrets: [],
      detailedArmaments: [
        { name: '533mm 重型魚雷發射管', count: '6門 (前4後2)', type: 'torpedo', desc: '常規柴電潛伏雷擊' },
      ],
      flakCooldown: 0,
      flakRange: 0,
    })
  );
}

export function createShip(
  partial: Partial<Ship> & {
    id: string;
    name: string;
    type: Ship['type'];
    side: Ship['side'];
    era: Era;
    pos: Vector2D;
    length: number;
    width: number;
    health: number;
    maxHealth: number;
  }
): Ship {
  const isSub =
    partial.type === 'submarine' ||
    partial.type === 'foxtrot' ||
    partial.type === 'ssn_la' ||
    partial.type === 'ssgn_oscar';

  const isAswCapable =
    isSub ||
    Boolean(partial.hasASROC || partial.hasDepthCharges || partial.hasHedgehog || partial.hasSVTT) ||
    partial.type === 'destroyer' ||
    partial.type === 'akizuki' ||
    partial.type === 'dd' ||
    partial.type === 'ddg' ||
    partial.type === 'ffg' ||
    partial.type === 'cg' ||
    partial.type === 'petya' ||
    partial.type === 'riga' ||
    partial.type === 'kashin' ||
    partial.type === 'dd_spruance' ||
    partial.type === 'ddg_kidd' ||
    partial.type === 'ffg_ohp' ||
    partial.type === 'cg_tico' ||
    partial.type === 'cg_virginia' ||
    partial.type === 'dd_udaloy' ||
    partial.type === 'cgn_kirov' ||
    partial.type === 'dd_sovremenny';

  const defaultSonarRange = partial.sonarRange ?? (
    !isAswCapable
      ? 0
      : partial.era === 'era5'
      ? (partial.type === 'dd_spruance' || partial.type === 'dd_udaloy' || partial.type === 'ssn_la' ? 2500 : 2100)
      : partial.era === 'era4'
      ? (partial.type === 'ffg' || partial.type === 'petya' ? 1950 : 1650)
      : partial.era === 'era3'
      ? 1450
      : partial.era === 'era2'
      ? 1200
      : 980
  );

  return {
    heading: 0,
    targetHeading: partial.heading || 0,
    speed: 0,
    targetSpeed: partial.speed || 0,
    maxSpeed: 24,
    turnRate: 0.35,
    armor: 0.2,
    turrets: [],
    vel: partial.vel ?? { x: 0, y: 0 },
    isSunk: false,
    sinkProgress: 0,
    wakePoints: [],
    order: { type: 'idle' },
    flakCooldown: 0,
    flakRange: 380,
    detectionRange: 1500,
    sonarRange: defaultSonarRange,
    isSubmerged: isSub ? (partial.isSubmerged ?? true) : partial.isSubmerged,
    isSpotted: isSub ? (partial.isSpotted ?? false) : partial.isSpotted,
    spottedTimer: isSub ? (partial.spottedTimer ?? 0) : partial.spottedTimer,
    isSpottedByEnemy: isSub ? (partial.isSpottedByEnemy ?? false) : partial.isSpottedByEnemy,
    enemySpottedTimer: isSub ? (partial.enemySpottedTimer ?? 0) : partial.enemySpottedTimer,
    weaponControlHealth: partial.weaponControlHealth ?? partial.health,
    maxWeaponControlHealth: partial.maxWeaponControlHealth ?? partial.maxHealth,
    hullCrewHealth: partial.hullCrewHealth ?? partial.health,
    maxHullCrewHealth: partial.maxHullCrewHealth ?? partial.maxHealth,
    ...partial,
    ...ashmLoad(partial.type, partial.hasHarpoon),
  };
}

/** Anti-ship missiles in the launchers at sea, from the ship's historical fit (navalMissileSalvos.ts). */
function ashmLoad(type: Ship['type'], hasHarpoon: boolean | undefined): Partial<Ship> {
  const fit = getShipAshmFit(type);
  if (!fit) return {};
  return hasHarpoon ? { readyHarpoons: fit.magazine, maxHarpoons: fit.magazine } : { ashmReady: fit.magazine };
}

export function createTurret(
  relX: number,
  relY: number,
  caliber: string,
  range: number,
  reloadTime: number,
  barrelCount: number,
  initialAngle: number,
  damage: number
): Turret {
  // Guns take historical range / rate of fire / shell weight (see navalGuns.ts); missiles, CIWS and
  // anything unrecognised keep the authored values.
  const gun = getNavalGunPerformance(caliber);
  if (gun) {
    range = gun.range;
    reloadTime = gun.reloadTime;
    if (gun.damage !== undefined) damage = gun.damage;
  } else {
    range = getNavalLauncherRange(caliber) ?? range;
  }
  return {
    relX,
    relY,
    caliber,
    range,
    reloadTime,
    cooldown: Math.random() * 1.5,
    barrelCount,
    angle: initialAngle,
    arcMin: -Math.PI * 0.85,
    arcMax: Math.PI * 0.85,
    damage,
  };
}

export function isPointInPolygon(point: Vector2D, polygon: Vector2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check whether a point is on dry island land (returns false if point is inside a central atoll lagoon)
export function isPointOnIslandLand(point: Vector2D, island: Island): boolean {
  if (!isPointInPolygon(point, island.points)) return false;
  if (island.lagoons && island.lagoons.length > 0) {
    for (const lag of island.lagoons) {
      if (isPointInPolygon(point, lag.points)) {
        return false;
      }
    }
  }
  return true;
}

