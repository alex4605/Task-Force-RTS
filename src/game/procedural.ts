import {
  Island,
  IslandStronghold,
  Installation,
  InstallationType,
  Ship,
  Vector2D,
  Turret,
  Era,
  SectorIntel,
  GroundUnit,
  GroundUnitType,
} from '../types/game';

export function dist(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
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
    era === 'era3'
      ? `${name} · 灘頭地下防核坑道要塞中心 [Alpha CP]`
      : era === 'era2'
      ? `${name} · 灘頭鋼筋混凝土要塞指揮所 [Alpha CP]`
      : `${name} · 灘頭木石野戰指揮掩體 [Alpha CP]`;
  const cp1Desc =
    era === 'era3'
      ? '深層花崗岩防核防空掩體 · 自動化戰術通信中樞'
      : era === 'era2'
      ? '島嶼守備第一大隊鋼筋混凝土前進指揮掩體 · 核心衛隊駐防'
      : '木質與夯土覆蓋之野戰守備指揮掩體 · 步槍兵衛隊';

  const cp1Inst: Installation = {
    id: `${id}-sh1-cp`,
    type: 'command_post',
    name: cp1Name,
    weaponDesc: cp1Desc,
    pos: cp1Pos,
    angle: sh1Angle,
    health: era === 'era3' ? 4600 : era === 'era2' ? 3800 : 3200,
    maxHealth: era === 'era3' ? 4600 : era === 'era2' ? 3800 : 3200,
    armor: era === 'era3' ? 0.68 : era === 'era2' ? 0.55 : 0.40,
    range: era === 'era3' ? 780 : era === 'era2' ? 700 : 600,
    cooldown: 0.8,
    reloadTime: era === 'era3' ? 1.4 : 1.8,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  };
  installations.push(cp1Inst);
  sh1Garrisons.push(cp1Inst.id);

  // Coastal Gun 1: Primary Heavy Coastal Battery
  const coastalGunName =
    era === 'era3'
      ? '自動雷達導引岸防砲台 (130mm 雙聯自動裝填加農砲)'
      : era === 'era2'
      ? '海岸要塞重砲台 (203mm 雙聯裝岸防重砲)'
      : '灘頭要塞岸防砲 (140mm 單裝加農砲)';
  const coastalGunDesc =
    era === 'era3'
      ? '130mm 雷達射控自動岸防砲 · 高射速壓制近海特遣艦隊'
      : era === 'era2'
      ? '203mm 雙聯裝岸防重砲 · 封鎖近海灘頭航道'
      : '140mm 單裝岸防加農砲 · 扼守近岸灘頭水道';

  const coastalGun: Installation = {
    id: `${id}-sh1-coastal-gun`,
    type: 'coastal_gun',
    name: coastalGunName,
    weaponDesc: coastalGunDesc,
    pos: { x: cp1Pos.x + 40, y: cp1Pos.y + 30 },
    angle: sh1Angle,
    health: era === 'era3' ? 4200 : era === 'era2' ? 3500 : 2800,
    maxHealth: era === 'era3' ? 4200 : era === 'era2' ? 3500 : 2800,
    armor: era === 'era3' ? 0.65 : era === 'era2' ? 0.55 : 0.45,
    range: era === 'era3' ? 1800 : era === 'era2' ? 1600 : 1350,
    cooldown: 2,
    reloadTime: era === 'era3' ? 3.4 : era === 'era2' ? 5.6 : 5.0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  };
  installations.push(coastalGun);
  sh1Garrisons.push(coastalGun.id);

  // Coastal Gun 1B: Flank Covering Battery
  const coastalGun1BName =
    era === 'era3'
      ? '側翼雷達岸防加農砲台 (100mm 自動裝填加農砲)'
      : era === 'era2'
      ? '灘頭側防要塞砲台 (140mm 單裝加農砲)'
      : '灘頭掩護野戰砲台 (75mm 單裝岸防野砲)';
  const coastalGun1BDesc =
    era === 'era3'
      ? '100mm 自動速射加農砲 · 快速擊破兩棲裝甲登陸艇'
      : era === 'era2'
      ? '140mm 側翼掩護岸防砲 · 壓制搶灘舟艇與登陸艦'
      : '75mm 野防加農砲 · 封鎖沙灘登陸路徑';

  const coastalGun1B: Installation = {
    id: `${id}-sh1-coastal-gun-2`,
    type: 'coastal_gun',
    name: coastalGun1BName,
    weaponDesc: coastalGun1BDesc,
    pos: { x: cp1Pos.x - 55, y: cp1Pos.y + 20 },
    angle: sh1Angle - 0.4,
    health: era === 'era3' ? 3400 : era === 'era2' ? 2800 : 2200,
    maxHealth: era === 'era3' ? 3400 : era === 'era2' ? 2800 : 2200,
    armor: era === 'era3' ? 0.60 : era === 'era2' ? 0.50 : 0.40,
    range: era === 'era3' ? 1500 : era === 'era2' ? 1350 : 1200,
    cooldown: 1.4,
    reloadTime: era === 'era3' ? 2.6 : era === 'era2' ? 4.2 : 4.0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  };
  installations.push(coastalGun1B);
  sh1Garrisons.push(coastalGun1B.id);

  // Flak Battery 1
  const flak1Name =
    era === 'era3'
      ? 'S-60 57mm 雷達射控防空砲連 (SON-9火輪雷達)'
      : era === 'era2'
      ? '灘頭防空高射砲連 (八八式75mm高射砲 + 25mm機砲群)'
      : '灘頭防空高射砲哨 (八八式75mm高射砲)';
  const flak1Desc =
    era === 'era3'
      ? 'SON-9 火輪雷達射控 57mm 自動防空高射砲群'
      : era === 'era2'
      ? '八八式75粍高射砲 + 九六式25粍機砲'
      : '八八式75粍野戰高射砲 · 目視光學測距';

  const flak1: Installation = {
    id: `${id}-sh1-flak`,
    type: 'flak_battery',
    name: flak1Name,
    weaponDesc: flak1Desc,
    pos: { x: cp1Pos.x - 35, y: cp1Pos.y + 45 },
    angle: sh1Angle + 0.5,
    health: era === 'era3' ? 3200 : era === 'era2' ? 2600 : 2200,
    maxHealth: era === 'era3' ? 3200 : era === 'era2' ? 2600 : 2200,
    armor: era === 'era3' ? 0.55 : era === 'era2' ? 0.45 : 0.38,
    range: era === 'era3' ? 1200 : era === 'era2' ? 950 : 880,
    cooldown: 0.8,
    reloadTime: era === 'era3' ? 1.0 : era === 'era2' ? 2.0 : 2.4,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: false,
  };
  installations.push(flak1);
  sh1Garrisons.push(flak1.id);

  // Flak Battery 1B: Close-in AA
  const flak1BName =
    era === 'era3'
      ? '雙聯裝 37mm 快速防空機砲連'
      : era === 'era2'
      ? '灘頭近迫防空高平機砲排 (九六式25mm三聯裝防空砲)'
      : '灘頭野戰防空高射機槍哨 (十三粍雙聯防空機槍)';
  const flak1BDesc =
    era === 'era3'
      ? '37mm 自動速射防空機砲 · 攔截低空噴射攻擊機'
      : era === 'era2'
      ? '密集25mm近迫機砲網 · 攔截俯衝轟炸機與低空掃射戰機'
      : '13.2mm 雙聯防空重機槍 · 壓制低空俯衝戰機';

  const flak1B: Installation = {
    id: `${id}-sh1-flak-2`,
    type: 'flak_battery',
    name: flak1BName,
    weaponDesc: flak1BDesc,
    pos: { x: cp1Pos.x + 25, y: cp1Pos.y + 55 },
    angle: sh1Angle - 0.3,
    health: era === 'era3' ? 2800 : era === 'era2' ? 2400 : 1900,
    maxHealth: era === 'era3' ? 2800 : era === 'era2' ? 2400 : 1900,
    armor: era === 'era3' ? 0.50 : era === 'era2' ? 0.42 : 0.35,
    range: era === 'era3' ? 1000 : era === 'era2' ? 820 : 750,
    cooldown: 0.5,
    reloadTime: era === 'era3' ? 0.8 : era === 'era2' ? 1.6 : 1.8,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: false,
  };
  installations.push(flak1B);
  sh1Garrisons.push(flak1B.id);

  // 2x Infantry squads
  for (let s = 1; s <= 2; s++) {
    const sqName =
      era === 'era3'
        ? `灘頭守備第${s}班 (地下防空暗堡與重機槍)`
        : era === 'era2'
        ? `灘頭守備第${s}班 (九二式重機槍碉堡)`
        : `灘頭守備第${s}班 (沙袋塹壕機槍哨)`;
    const sqDesc =
      era === 'era3'
        ? '花崗岩鋼筋掩體 + 12.7mm 重機槍 (ASuW封鎖)'
        : era === 'era2'
        ? '7.7mm 九二式重機關槍 + 沙袋掩體 (ASuW封鎖)'
        : '6.5mm 三八式步槍班 + 十一年式輕機槍 (ASuW封鎖)';

    const sqInst: Installation = {
      id: `${id}-sh1-squad-${s}`,
      type: 'infantry_squad',
      name: sqName,
      weaponDesc: sqDesc,
      pos: { x: cp1Pos.x + (s === 1 ? 50 : -45), y: cp1Pos.y + (s === 1 ? -40 : -35) },
      angle: sh1Angle,
      health: era === 'era3' ? 2400 : era === 'era2' ? 1800 : 1400,
      maxHealth: era === 'era3' ? 2400 : era === 'era2' ? 1800 : 1400,
      armor: era === 'era3' ? 0.45 : era === 'era2' ? 0.35 : 0.28,
      range: era === 'era3' ? 680 : era === 'era2' ? 580 : 500,
      cooldown: 0.3,
      reloadTime: era === 'era3' ? 1.0 : 1.4,
      isDestroyed: false,
      side: 'enemy',
      strongholdId: `${id}-sh-1`,
      isASuWOnly: true,
    };
    installations.push(sqInst);
    sh1Garrisons.push(sqInst.id);
  }

  // Towed Artillery
  const art1Name =
    era === 'era3'
      ? '野戰重型砲兵陣地 (D-30 122mm 榴彈砲)'
      : era === 'era2'
      ? '拖曳野戰砲兵陣地 (九〇式75mm野砲)'
      : '野戰砲兵陣地 (三十八式75mm野砲)';
  const art1Desc =
    era === 'era3'
      ? '122mm 牽引榴彈砲 · 重裝高爆彈壓制登陸舟艇'
      : era === 'era2'
      ? '九〇式75粍野砲 · 高爆彈壓制登陸舟艇'
      : '三十八式75粍野砲 · 扼守灘頭沙灘';

  const art1: Installation = {
    id: `${id}-sh1-artillery`,
    type: 'towed_artillery',
    name: art1Name,
    weaponDesc: art1Desc,
    pos: { x: cp1Pos.x + 10, y: cp1Pos.y - 65 },
    angle: sh1Angle,
    health: era === 'era3' ? 3000 : era === 'era2' ? 2500 : 2000,
    maxHealth: era === 'era3' ? 3000 : era === 'era2' ? 2500 : 2000,
    armor: era === 'era3' ? 0.50 : era === 'era2' ? 0.40 : 0.35,
    range: era === 'era3' ? 1500 : era === 'era2' ? 1250 : 1100,
    cooldown: 1.6,
    reloadTime: era === 'era3' ? 3.0 : era === 'era2' ? 3.8 : 4.0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-1`,
    isASuWOnly: true,
  };
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
    era === 'era3'
      ? `${name} · 核心地下堅固司令部 [Bravo CP]`
      : era === 'era2'
      ? `${name} · 核心高地司令部 [Bravo CP]`
      : `${name} · 高地守備指揮部 [Bravo CP]`;
  const cp2Desc =
    era === 'era3'
      ? '地下雙層防空防爆工事 · 遠東戰區島嶼最高指揮中心'
      : era === 'era2'
      ? '島嶼最高守備司令部核心掩體 · 警衛重兵'
      : '夯土木質司令部掩體 · 島嶼守備司令駐防';

  const cp2Inst: Installation = {
    id: `${id}-sh2-cp`,
    type: 'command_post',
    name: cp2Name,
    weaponDesc: cp2Desc,
    pos: cp2Pos,
    angle: sh2Angle,
    health: era === 'era3' ? 5200 : era === 'era2' ? 4200 : 3500,
    maxHealth: era === 'era3' ? 5200 : era === 'era2' ? 4200 : 3500,
    armor: era === 'era3' ? 0.70 : era === 'era2' ? 0.55 : 0.42,
    range: era === 'era3' ? 850 : era === 'era2' ? 750 : 650,
    cooldown: 0.6,
    reloadTime: era === 'era3' ? 1.2 : 1.6,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  };
  installations.push(cp2Inst);
  sh2Garrisons.push(cp2Inst.id);

  // Major airfield if island large enough
  if (baseRadius > 360) {
    const afName =
      era === 'era3'
        ? '島嶼前線噴射空軍基地 (混凝土跑道)'
        : era === 'era2'
        ? '島嶼前線航空基地 (飛行場)'
        : '島嶼野戰簡易飛行場 (土質跑道)';
    const afDesc =
      era === 'era3'
        ? '加固混凝土跑道 · MiG-15 / Tu-14 噴射轟炸機起降基地'
        : era === 'era2'
        ? '雙跑道 · 零戰/陸攻/神風起降基地'
        : '簡易草皮跑道 · 九六艦戰/九九艦爆起降基地';

    const afInst: Installation = {
      id: `${id}-airfield`,
      type: 'airfield',
      name: afName,
      weaponDesc: afDesc,
      pos: { x: cp2Pos.x + 40, y: cp2Pos.y - 35 },
      angle: (seed * 0.75) % (Math.PI * 2),
      health: era === 'era3' ? 6800 : era === 'era2' ? 5500 : 4500,
      maxHealth: era === 'era3' ? 6800 : era === 'era2' ? 5500 : 4500,
      armor: era === 'era3' ? 0.55 : era === 'era2' ? 0.45 : 0.35,
      range: 2800,
      cooldown: 5,
      reloadTime: 20,
      isDestroyed: false,
      side: 'enemy',
      spawnTimer: 12,
      strongholdId: `${id}-sh-2`,
    };
    installations.push(afInst);
    sh2Garrisons.push(afInst.id);
  }

  // Tank Battalion
  const tankBnName =
    era === 'era3'
      ? '裝甲突擊集群核心陣地 (T-34/85 裝甲連)'
      : era === 'era2'
      ? '戰車聯隊/大隊核心陣地 (一式中戰車集群)'
      : '戰車中隊陣地 (九五式輕戰車小隊)';
  const tankBnDesc =
    era === 'era3'
      ? '85mm 戰車加農砲裝甲集群 + 加固地下戰車庫'
      : era === 'era2'
      ? '一式中戰車「チヘ」裝甲集群 + 地下戰車庫'
      : '37mm 戰車砲掩體 · 伏擊步兵登陸';

  const tankBn: Installation = {
    id: `${id}-sh2-tank-bn`,
    type: 'tank_battalion',
    name: tankBnName,
    weaponDesc: tankBnDesc,
    pos: { x: cp2Pos.x - 55, y: cp2Pos.y - 20 },
    angle: sh2Angle,
    health: era === 'era3' ? 4400 : era === 'era2' ? 3600 : 2800,
    maxHealth: era === 'era3' ? 4400 : era === 'era2' ? 3600 : 2800,
    armor: era === 'era3' ? 0.68 : era === 'era2' ? 0.55 : 0.42,
    range: era === 'era3' ? 1200 : era === 'era2' ? 1050 : 900,
    cooldown: 1.2,
    reloadTime: era === 'era3' ? 2.5 : era === 'era2' ? 3.2 : 3.0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  };
  installations.push(tankBn);
  sh2Garrisons.push(tankBn.id);

  // Heavy Flak Battery
  const flak2Name =
    era === 'era3'
      ? 'KS-19 100mm 重型防空砲連 (SON-9雷達導引)'
      : era === 'era2'
      ? '司令部重型防空高射砲連 (八八式75mm高射砲)'
      : '高地防空高射砲哨 (八八式75mm高射砲)';
  const flak2Desc =
    era === 'era3'
      ? '100mm 重型雷達射控高射砲 · 封鎖高空轟炸走廊'
      : era === 'era2'
      ? '高仰角防空雷達射控高射機砲群'
      : '光學高仰角高射砲陣地';

  const flak2: Installation = {
    id: `${id}-sh2-flak`,
    type: 'flak_battery',
    name: flak2Name,
    weaponDesc: flak2Desc,
    pos: { x: cp2Pos.x + 60, y: cp2Pos.y + 40 },
    angle: sh2Angle + 1.2,
    health: era === 'era3' ? 3600 : era === 'era2' ? 2800 : 2200,
    maxHealth: era === 'era3' ? 3600 : era === 'era2' ? 2800 : 2200,
    armor: era === 'era3' ? 0.58 : era === 'era2' ? 0.48 : 0.38,
    range: era === 'era3' ? 1350 : era === 'era2' ? 950 : 880,
    cooldown: 0.7,
    reloadTime: era === 'era3' ? 1.4 : era === 'era2' ? 2.0 : 2.2,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: false,
  };
  installations.push(flak2);
  sh2Garrisons.push(flak2.id);

  // Coastal Gun 2
  const coastalGun2Name =
    era === 'era3'
      ? '島心高地重型長程岸防加農砲 (152mm 雙聯長身管砲台)'
      : era === 'era2'
      ? '島心高地海防長程重砲台 (203mm 雙聯裝加農砲)'
      : '高地要塞海防砲台 (140mm 單裝加農砲)';
  const coastalGun2Desc =
    era === 'era3'
      ? '152mm 制高點自動加農砲 · 跨越山體重創登陸艦隊'
      : era === 'era2'
      ? '制高點長程加農砲 · 跨越山體砲擊特混艦隊'
      : '制高點砲位 · 俯瞰水道砲擊艦隻';

  const coastalGun2: Installation = {
    id: `${id}-sh2-coastal-gun`,
    type: 'coastal_gun',
    name: coastalGun2Name,
    weaponDesc: coastalGun2Desc,
    pos: { x: cp2Pos.x - 70, y: cp2Pos.y + 35 },
    angle: sh2Angle + 0.8,
    health: era === 'era3' ? 4400 : era === 'era2' ? 3600 : 2800,
    maxHealth: era === 'era3' ? 4400 : era === 'era2' ? 3600 : 2800,
    armor: era === 'era3' ? 0.68 : era === 'era2' ? 0.55 : 0.45,
    range: era === 'era3' ? 1900 : era === 'era2' ? 1650 : 1400,
    cooldown: 2.2,
    reloadTime: era === 'era3' ? 3.8 : era === 'era2' ? 6.0 : 5.5,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
    isASuWOnly: true,
  };
  installations.push(coastalGun2);
  sh2Garrisons.push(coastalGun2.id);

  // Radar & Ammo Depot
  const radarName =
    era === 'era3'
      ? 'AN/SPS-6 3D 遠程對空搜索雷達哨 (雷達站)'
      : era === 'era2'
      ? '早期警戒對空對海電探哨 (二二號電探雷達站)'
      : '早期警戒對空電探哨 (二一號電波探信儀)';
  const radarDesc =
    era === 'era3'
      ? '3D 對空全方位搜索雷達 · 提早偵獲高空噴射打擊群'
      : era === 'era2'
      ? '二二號對海對空電探 · 廣域空情預警'
      : '二一號早期電波探信儀 · 基礎空情預警';

  const radar: Installation = {
    id: `${id}-radar`,
    type: 'radar_station',
    name: radarName,
    weaponDesc: radarDesc,
    pos: { x: cp2Pos.x - 30, y: cp2Pos.y + 55 },
    angle: sh2Angle,
    health: era === 'era3' ? 2800 : era === 'era2' ? 2200 : 1800,
    maxHealth: era === 'era3' ? 2800 : era === 'era2' ? 2200 : 1800,
    armor: era === 'era3' ? 0.45 : era === 'era2' ? 0.35 : 0.28,
    range: era === 'era3' ? 3800 : era === 'era2' ? 2400 : 2000,
    cooldown: 0,
    reloadTime: 0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  };
  installations.push(radar);
  sh2Garrisons.push(radar.id);

  const depotName =
    era === 'era3'
      ? '防核地下重裝備油彈庫 (戰略物資儲備)'
      : era === 'era2'
      ? '地下彈藥重油庫 (軍需物資儲備)'
      : '野戰掩蔽油彈棚庫 (物資儲備)';
  const depotDesc =
    era === 'era3'
      ? '花崗岩深層防核掩體 · 航油與航空重型火箭航彈'
      : era === 'era2'
      ? '強化防爆地下掩體 · 航油與航空炸彈'
      : '夯土掩蔽所 · 油料與炸彈儲備';

  const depot: Installation = {
    id: `${id}-depot`,
    type: 'ammo_depot',
    name: depotName,
    weaponDesc: depotDesc,
    pos: { x: cp2Pos.x + 30, y: cp2Pos.y + 60 },
    angle: sh2Angle,
    health: era === 'era3' ? 3400 : era === 'era2' ? 2600 : 2000,
    maxHealth: era === 'era3' ? 3400 : era === 'era2' ? 2600 : 2000,
    armor: era === 'era3' ? 0.50 : era === 'era2' ? 0.40 : 0.30,
    range: 0,
    cooldown: 0,
    reloadTime: 0,
    isDestroyed: false,
    side: 'enemy',
    strongholdId: `${id}-sh-2`,
  };
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

    const cp3Inst: Installation = {
      id: `${id}-sh3-cp`,
      type: 'command_post',
      name: cp3Name,
      weaponDesc: cp3Desc,
      pos: cp3Pos,
      angle: sh3Angle,
      health: era === 'era3' ? 4800 : era === 'era2' ? 3800 : 3000,
      maxHealth: era === 'era3' ? 4800 : era === 'era2' ? 3800 : 3000,
      armor: era === 'era3' ? 0.65 : era === 'era2' ? 0.50 : 0.38,
      range: era === 'era3' ? 800 : era === 'era2' ? 700 : 600,
      cooldown: 0.7,
      reloadTime: era === 'era3' ? 1.3 : 1.7,
      isDestroyed: false,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    };
    installations.push(cp3Inst);
    sh3Garrisons.push(cp3Inst.id);

    // Tank Platoon
    const tankPlName =
      era === 'era3'
        ? '裝甲反擊排 (T-34/85 岸防陣地)'
        : era === 'era2'
        ? '裝甲戰車排 (九七式中戰車「チハ」陣地)'
        : '裝甲戰車排 (九五式輕戰車陣地)';
    const tankPlDesc =
      era === 'era3'
        ? '85mm 戰車砲掩體 · 扼守港口防坡堤'
        : era === 'era2'
        ? '47mm 戰車砲掩體 · 港灣灘頭反擊'
        : '37mm 輕戰車掩體 · 巡邏碼頭水線';

    const tankPl: Installation = {
      id: `${id}-sh3-tank`,
      type: 'tank_platoon',
      name: tankPlName,
      weaponDesc: tankPlDesc,
      pos: { x: cp3Pos.x + 35, y: cp3Pos.y - 30 },
      angle: sh3Angle,
      health: era === 'era3' ? 3600 : era === 'era2' ? 2800 : 2100,
      maxHealth: era === 'era3' ? 3600 : era === 'era2' ? 2800 : 2100,
      armor: era === 'era3' ? 0.62 : era === 'era2' ? 0.50 : 0.40,
      range: era === 'era3' ? 1100 : era === 'era2' ? 900 : 800,
      cooldown: 1.0,
      reloadTime: era === 'era3' ? 2.4 : era === 'era2' ? 3.0 : 3.0,
      isDestroyed: false,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    };
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

    const flak3: Installation = {
      id: `${id}-sh3-flak`,
      type: 'flak_battery',
      name: flak3Name,
      weaponDesc: flak3Desc,
      pos: { x: cp3Pos.x - 40, y: cp3Pos.y + 35 },
      angle: sh3Angle,
      health: era === 'era3' ? 3100 : era === 'era2' ? 2500 : 2000,
      maxHealth: era === 'era3' ? 3100 : era === 'era2' ? 2500 : 2000,
      armor: era === 'era3' ? 0.55 : era === 'era2' ? 0.45 : 0.38,
      range: era === 'era3' ? 1150 : era === 'era2' ? 880 : 820,
      cooldown: 0.9,
      reloadTime: era === 'era3' ? 1.2 : era === 'era2' ? 2.4 : 2.5,
      isDestroyed: false,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: false,
    };
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

    const coastalGun3: Installation = {
      id: `${id}-sh3-coastal-gun`,
      type: 'coastal_gun',
      name: coastalGun3Name,
      weaponDesc: coastalGun3Desc,
      pos: { x: cp3Pos.x - 55, y: cp3Pos.y - 20 },
      angle: sh3Angle - 0.6,
      health: era === 'era3' ? 3800 : era === 'era2' ? 3000 : 2400,
      maxHealth: era === 'era3' ? 3800 : era === 'era2' ? 3000 : 2400,
      armor: era === 'era3' ? 0.62 : era === 'era2' ? 0.52 : 0.42,
      range: era === 'era3' ? 1650 : era === 'era2' ? 1400 : 1250,
      cooldown: 1.6,
      reloadTime: era === 'era3' ? 3.0 : era === 'era2' ? 4.8 : 4.5,
      isDestroyed: false,
      side: 'enemy',
      strongholdId: `${id}-sh-3`,
      isASuWOnly: true,
    };
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
    installations.push({
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
      maxHealth: 2800,
      armor: 0.65,
      range: 0,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'enemy',
    });
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
    {
      id: 'friendly-base-afb',
      type: 'airfield',
      name: '友軍前進航空基地 (AFB Henderson Field)',
      weaponDesc: '雙跑道全天候後勤航空站 · 提供機隊補充與長程空中打擊',
      pos: { x: center.x + 20, y: center.y - 20 },
      angle: -Math.PI / 4,
      health: 3500,
      maxHealth: 3500,
      range: 4500,
      cooldown: 0,
      reloadTime: 15,
      isDestroyed: false,
      side: 'player',
    },
    // Friendly Flak Batteries (90mm M2 & 40mm Bofors)
    {
      id: 'friendly-base-flak-1',
      type: 'flak_battery',
      name: '友軍重型高射砲第1連 (90mm M2 高平兩用砲)',
      weaponDesc: 'SCR-584 雷達射控 VT 信管 90mm 防空砲',
      pos: { x: center.x - 140, y: center.y - 80 },
      angle: 0,
      health: 1200,
      maxHealth: 1200,
      armor: 0.35,
      range: 1100,
      cooldown: 0.6,
      reloadTime: 1.8,
      isDestroyed: false,
      side: 'player',
      isASuWOnly: false,
    },
    {
      id: 'friendly-base-flak-2',
      type: 'flak_battery',
      name: '友軍重型高射砲第2連 (40mm 博福斯四聯裝機砲群)',
      weaponDesc: '密集博福斯防空火網 · 保護航空基地不受空襲',
      pos: { x: center.x + 160, y: center.y + 60 },
      angle: Math.PI / 2,
      health: 1100,
      maxHealth: 1100,
      armor: 0.35,
      range: 980,
      cooldown: 0.5,
      reloadTime: 1.5,
      isDestroyed: false,
      side: 'player',
      isASuWOnly: false,
    },
    // Radar Station
    {
      id: 'friendly-base-radar',
      type: 'radar_station',
      name: '友軍早期警戒防空電探哨 (SCR-270 遠程雷達)',
      weaponDesc: '長程預警雷達 · 提供戰區大範圍防空早期預警',
      pos: { x: center.x - 80, y: center.y + 120 },
      angle: 0,
      health: 800,
      maxHealth: 800,
      range: 3600,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'player',
    },
    // Munitions & Fuel Depot
    {
      id: 'friendly-base-depot',
      type: 'ammo_depot',
      name: '友軍戰略航空重油與彈藥庫',
      weaponDesc: '航空燃油儲存槽與航彈後勤基地',
      pos: { x: center.x + 80, y: center.y - 120 },
      angle: 0,
      health: 2500,
      maxHealth: 2500,
      range: 0,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'player',
    },
    // Multiple Ship Repair Facilities (船舶維修設施 / 應急造船廠浮塢) - 緊急修補到綠色生命值
    {
      id: 'friendly-base-repair-dock-1',
      type: 'ship_repair_dock',
      name: '友軍海軍第1浮動修船塢 (USS ABSD-1 巨型修船浮塢)',
      weaponDesc: '巨型浮動修船塢 · 靠泊緊急搶修船艦至安全綠色生命值 (+50 HP/s)',
      pos: { x: center.x + 230, y: center.y - 80 },
      angle: -Math.PI / 6,
      health: 4500,
      maxHealth: 4500,
      armor: 0.4,
      range: 750,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'player',
    },
    {
      id: 'friendly-base-repair-dock-2',
      type: 'ship_repair_dock',
      name: '友軍海軍第2應急搶修浮塢 (Advanced Repair Drydock No.2)',
      weaponDesc: '前線快速損管浮塢 · 破孔抽水焊接與輪機搶修',
      pos: { x: center.x + 290, y: center.y + 40 },
      angle: 0,
      health: 4200,
      maxHealth: 4200,
      armor: 0.4,
      range: 750,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'player',
    },
    {
      id: 'friendly-base-repair-dock-3',
      type: 'ship_repair_dock',
      name: '友軍深水港泊位輪機損管站 (Repair Anchorage Basin)',
      weaponDesc: '深水泊位搶修碼頭 · 滅火與緊急重置舵機結構',
      pos: { x: center.x + 180, y: center.y + 160 },
      angle: Math.PI / 4,
      health: 3800,
      maxHealth: 3800,
      armor: 0.35,
      range: 750,
      cooldown: 0,
      reloadTime: 0,
      isDestroyed: false,
      side: 'player',
    },
    // Friendly Coastal & Field Artillery Batteries (友軍島上防禦設施 藍色陣地)
    {
      id: 'friendly-base-coastal-1',
      type: 'coastal_gun',
      name: '友軍岸防要塞重砲連 (155mm M1 Long Tom 岸防加農砲)',
      weaponDesc: '長程重型岸防砲 · 封鎖港灣水道阻截敵艦突襲',
      pos: { x: center.x + 320, y: center.y - 140 },
      angle: -Math.PI / 5,
      health: 1800,
      maxHealth: 1800,
      armor: 0.45,
      range: 1550,
      cooldown: 1.0,
      reloadTime: 3.5,
      isDestroyed: false,
      side: 'player',
    },
    {
      id: 'friendly-base-artillery-1',
      type: 'towed_artillery',
      name: '友軍野戰重型砲兵連 (105mm M2A1 野戰榴彈砲)',
      weaponDesc: '陸戰隊砲兵陣地 · 提供全島灘頭反登陸火力掩護',
      pos: { x: center.x - 40, y: center.y - 150 },
      angle: -Math.PI / 3,
      health: 1200,
      maxHealth: 1200,
      armor: 0.35,
      range: 1350,
      cooldown: 0.8,
      reloadTime: 2.8,
      isDestroyed: false,
      side: 'player',
    },
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
  let health = 450;
  let armor = 0.2;
  let speed = 4;
  let range = 650;
  let damage = 50;
  let reloadTime = 1.4;
  let isAmphibious = false;

  if (type === 'usmc_rifle_42') {
    health = 1450;
    armor = 0.28;
    speed = 3.6;
    range = 650;
    damage = 65;
    reloadTime = 1.3;
  } else if (type === 'usmc_rifle_45') {
    health = 1850;
    armor = 0.35;
    speed = 4.0;
    range = 750;
    damage = 85;
    reloadTime = 1.1;
  } else if (type === 'usmc_armor_m3') {
    health = 2200;
    armor = 0.52;
    speed = 5.6;
    range = 880;
    damage = 195;
    reloadTime = 2.4;
  } else if (type === 'usmc_armor_m4') {
    health = 2900;
    armor = 0.65;
    speed = 4.8;
    range = 980;
    damage = 310;
    reloadTime = 2.6;
  } else if (type === 'usmc_lvt_42') {
    health = 1900;
    armor = 0.42;
    speed = 4.5;
    range = 720;
    damage = 120;
    reloadTime = 1.7;
    isAmphibious = true;
  } else if (type === 'usmc_lvt_45') {
    health = 2400;
    armor = 0.52;
    speed = 4.7;
    range = 900;
    damage = 230;
    reloadTime = 2.1;
    isAmphibious = true;
  } else if (type === 'usmc_engineer') {
    health = 1600;
    armor = 0.38;
    speed = 4.2;
    range = 620;
    damage = 95;
    reloadTime = 1.2;
  } else if (type === 'usmc_artillery_105') {
    health = 2200;
    armor = 0.40;
    speed = 2.4;
    range = 1450;
    damage = 350;
    reloadTime = 3.2;
  } else if (type === 'opfor_infantry_42') {
    health = 1500;
    armor = 0.30;
    speed = 3.8;
    range = 640;
    damage = 68;
    reloadTime = 1.3;
  } else if (type === 'opfor_infantry_45') {
    health = 1900;
    armor = 0.38;
    speed = 4.2;
    range = 720;
    damage = 92;
    reloadTime = 1.1;
  } else if (type === 'opfor_mortar_platoon') {
    health = 1750;
    armor = 0.32;
    speed = 3.2;
    range = 1150;
    damage = 190;
    reloadTime = 2.0;
  } else if (type === 'opfor_infantry_ambush') {
    health = 1500;
    armor = 0.32;
    speed = 5.5; // Fast ambush sprint!
    range = 580;
    damage = 110;
    reloadTime = 1.2;
  } else if (type === 'opfor_infantry_patrol') {
    health = 1650;
    armor = 0.35;
    speed = 4.0;
    range = 680;
    damage = 75;
    reloadTime = 1.2;
  } else if (type === 'opfor_type95_tank') {
    health = 2100;
    armor = 0.48;
    speed = 5.4;
    range = 850;
    damage = 180;
    reloadTime = 2.2;
  } else if (type === 'opfor_type97_tank') {
    health = 2800;
    armor = 0.60;
    speed = 4.6;
    range = 950;
    damage = 290;
    reloadTime = 2.5;
  } else if (type === 'opfor_field_artillery') {
    health = 2400;
    armor = 0.40;
    speed = 2.5;
    range = 1300;
    damage = 240;
    reloadTime = 3.2;
  } else if (type === 'usmc_korea_rifle') {
    health = 2100;
    armor = 0.38;
    speed = 4.2;
    range = 780;
    damage = 105;
    reloadTime = 1.0;
  } else if (type === 'us_army_infantry_korea') {
    health = 2200;
    armor = 0.40;
    speed = 4.4;
    range = 820;
    damage = 110;
    reloadTime = 1.0;
  } else if (type === 'us_army_armor_korea') {
    health = 3500;
    armor = 0.74;
    speed = 5.0;
    range = 1120;
    damage = 400;
    reloadTime = 2.3;
  } else if (type === 'usmc_lvtp5') {
    health = 2800;
    armor = 0.58;
    speed = 4.8;
    range = 920;
    damage = 250;
    reloadTime = 2.0;
    isAmphibious = true;
  } else if (type === 'usmc_patton_m46') {
    health = 3400;
    armor = 0.72;
    speed = 5.2;
    range = 1100;
    damage = 380;
    reloadTime = 2.3;
  } else if (type === 'usmc_howitzer_155') {
    health = 2600;
    armor = 0.45;
    speed = 2.2;
    range = 1650;
    damage = 450;
    reloadTime = 3.8;
  } else if (type === 'usmc_duster_m42') {
    health = 2400;
    armor = 0.50;
    speed = 5.4;
    range = 1050;
    damage = 160;
    reloadTime = 0.6;
  } else if (type === 'opfor_coldwar_infantry') {
    health = 2000;
    armor = 0.36;
    speed = 4.3;
    range = 740;
    damage = 98;
    reloadTime = 1.0;
  } else if (type === 'opfor_t34_85') {
    health = 3100;
    armor = 0.68;
    speed = 5.0;
    range = 1020;
    damage = 330;
    reloadTime = 2.4;
  } else if (type === 'opfor_is3_heavy') {
    health = 4200;
    armor = 0.82;
    speed = 4.0;
    range = 1200;
    damage = 520;
    reloadTime = 3.5;
  } else if (type === 'opfor_s60_flak') {
    health = 2500;
    armor = 0.45;
    speed = 2.4;
    range = 1350;
    damage = 180;
    reloadTime = 0.8;
  } else if (type === 'opfor_ks19_heavy') {
    health = 2800;
    armor = 0.48;
    speed = 2.0;
    range = 1600;
    damage = 360;
    reloadTime = 2.8;
  } else if (type === 'us_army_rifle_platoon_65') {
    health = 2200;
    armor = 0.40;
    speed = 4.6;
    range = 780;
    damage = 120;
    reloadTime = 0.9;
  } else if (type === 'us_army_m113_mech') {
    health = 2800;
    armor = 0.60;
    speed = 5.8;
    range = 850;
    damage = 220;
    reloadTime = 1.2;
    isAmphibious = true;
  } else if (type === 'us_army_chaparral_sam') {
    health = 2500;
    armor = 0.48;
    speed = 5.2;
    range = 2000;
    damage = 380;
    reloadTime = 2.5;
  } else if (type === 'usmc_air_assault_65') {
    health = 2200;
    armor = 0.40;
    speed = 4.8;
    range = 780;
    damage = 115;
    reloadTime = 0.9;
  } else if (type === 'usmc_armor_m48') {
    health = 3800;
    armor = 0.76;
    speed = 5.2;
    range = 1150;
    damage = 420;
    reloadTime = 2.4;
  } else if (type === 'usmc_ontos_m50') {
    health = 2400;
    armor = 0.45;
    speed = 6.2;
    range = 1100;
    damage = 680;
    reloadTime = 3.6;
  } else if (type === 'opfor_vietnam_sapper') {
    health = 1800;
    armor = 0.35;
    speed = 5.2;
    range = 680;
    damage = 140;
    reloadTime = 0.8;
  } else if (type === 'opfor_pt76_amphib') {
    health = 2600;
    armor = 0.50;
    speed = 5.5;
    range = 950;
    damage = 260;
    reloadTime = 2.0;
    isAmphibious = true;
  } else if (type === 'opfor_t54_tank') {
    health = 3600;
    armor = 0.74;
    speed = 4.8;
    range = 1150;
    damage = 440;
    reloadTime = 2.5;
  } else if (type === 'opfor_zsu23_shilka') {
    health = 2800;
    armor = 0.52;
    speed = 5.5;
    range = 1200;
    damage = 220;
    reloadTime = 0.4;
  } else if (type === 'opfor_zu23_aa') {
    health = 2200;
    armor = 0.42;
    speed = 2.6;
    range = 1100;
    damage = 180;
    reloadTime = 0.6;
  }

  const echelon: GroundUnit['echelon'] =
    type.includes('artillery') || type.includes('howitzer') || type.includes('flak') || type.includes('duster') || type.includes('shilka') || type.includes('zu23')
      ? 'battery'
      : type.includes('patrol') || type.includes('ambush') || type.includes('sapper')
      ? 'company'
      : 'platoon';

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

export function createCVE(id: string, name: string, pos: Vector2D, era: Era): Ship {
  return createShip({
    id,
    name,
    codeName: 'Jeep Carrier',
    type: 'cve',
    side: 'player',
    era,
    pos: { ...pos },
    heading: -Math.PI / 4,
    speed: 12,
    maxSpeed: 19,
    length: 98,
    width: 22,
    health: 2700,
    maxHealth: 2700,
    armor: 0.28,
    detectionRange: 2900,
    turrets: [
      createTurret(-32, 0, '5-inch/38 Mk 12 (艦艉自衛高平砲)', 1050, 2.5, 1, -Math.PI / 4, 120),
      createTurret(15, -9, '40mm Bofors Twin (右舷防空砲)', 850, 1.2, 2, -Math.PI / 4, 140),
      createTurret(15, 9, '40mm Bofors Twin (左舷防空砲)', 850, 1.2, 2, -Math.PI / 4, 140),
    ],
    detailedArmaments: [
      { name: '近距空中支援 (CAS) 機隊', count: '28架', type: 'main', desc: 'FM-2 野貓與 TBM 復仇者' },
      { name: '40mm 博福斯雙聯高射砲', count: '8門', type: 'aa', desc: '防空彈幕' },
      { name: '20mm 厄利孔高平快砲', count: '12門', type: 'aa', desc: '近迫自衛' },
    ],
    carrierPlanes: {
      ready: era === 'era1' ? { f4f: 6, tbd: 6 } : { f6f: 6, tbf: 6 },
      hangar: era === 'era1' ? { f4f: 8, tbd: 8 } : { f6f: 8, tbf: 8 },
      maxPerType: era === 'era1' ? { f4f: 8, tbd: 8 } : { f6f: 8, tbf: 8 },
    },
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
      createTurret(32, -14, 'RIM-7 Sea Sparrow (右舷前防空飛彈發射器)', 2400, 3.5, 1, heading, 90),
      createTurret(-32, -14, 'RIM-7 Sea Sparrow (右舷後防空飛彈發射器)', 2400, 3.5, 1, heading, 90),
      createTurret(-32, 14, 'RIM-7 Sea Sparrow (左舷後防空飛彈發射器)', 2400, 3.5, 1, heading, 90),
      createTurret(20, -12, '20mm Mk 15 Phalanx / AA (艦島近迫火網)', 1100, 0.4, 2, heading, 100),
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
      createTurret(8, -8, '3-inch/50 Mk 33 Twin AA (右舷高平砲)', 1150, 1.2, 2, heading, 75),
      createTurret(8, 8, '3-inch/50 Mk 33 Twin AA (左舷高平砲)', 1150, 1.2, 2, heading, 75),
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
      createTurret(-12, 0, 'Mk 11 Mod 0 (單臂防空飛彈發射架 RIM-66 Tartar)', 2700, 3.2, 1, heading, 220),
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
      ready: { uh1: 6, ah1: 4, sh2: 4 },
      hangar: { uh1: 8, ah1: 6, sh2: 6 },
      maxPerType: { uh1: 8, ah1: 6, sh2: 6 },
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
      createTurret(24, 0, '100mm/56 B-34 Single (艦艏100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(0, 0, '100mm/56 B-34 Single (舯部100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(-24, 0, '100mm/56 B-34 Single (艦艉100mm高平兩用砲)', 1300, 2.0, 1, heading, 110),
      createTurret(12, 0, '37mm V-11M Twin AA (雙聯裝防空砲)', 950, 0.8, 2, heading, 75),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, heading, 75),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, heading, 75),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, heading, 70),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, heading, 70),
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
          createTurret(0, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, heading, 75),
          createTurret(0, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, heading, 75),
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
          createTurret(28, 0, '5-inch/38 Mk 29 Twin DP (No.1 艦艏雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(18, 0, '5-inch/38 Mk 29 Twin DP (No.2 背負雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(8, 0, '5-inch/38 Mk 29 Twin DP (No.3 三層背負)', 1100, 2.2, 2, heading, 80),
          createTurret(-8, 0, '5-inch/38 Mk 29 Twin DP (No.4 三層背負後)', 1100, 2.2, 2, heading, 80),
          createTurret(-18, 0, '5-inch/38 Mk 29 Twin DP (No.5 背負雙聯後)', 1100, 2.2, 2, heading, 80),
          createTurret(-28, 0, '5-inch/38 Mk 29 Twin DP (No.6 艦艉雙聯)', 1100, 2.2, 2, heading, 80),
          createTurret(0, -7, '5-inch/38 Twin (右舷翼砲)', 1050, 2.2, 2, heading, 80),
          createTurret(0, 7, '5-inch/38 Twin (左舷翼砲)', 1050, 2.2, 2, heading, 80),
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
          createTurret(4, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-4, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(4, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, heading, 65),
          createTurret(-4, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, heading, 65),
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
  if (era === 'era3' || era === 'era4') {
    // ══════════════════════════════════════════════════════════
    // 時代三 (1950-1953) / 時代四 (1965-1973): 大型大陸板塊戰線 (Continental Mainland) + 外海2小島
    // ══════════════════════════════════════════════════════════
    const mainlandName =
      era === 'era4'
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

    // 1. 大陸河流與沿海水系 (Rivers & Deltas)
    continent.rivers = [
      {
        width: 18,
        points: [
          { x: 12500, y: 1500 },
          { x: 11000, y: 2200 },
          { x: 9500, y: 3200 },
          { x: 8200, y: 4200 },
          { x: 6800, y: 4800 },
          { x: 5050, y: 5000 },
        ],
      },
      {
        width: 15,
        points: [
          { x: 10400, y: 6200 },
          { x: 9100, y: 6600 },
          { x: 7700, y: 6900 },
          { x: 6400, y: 7200 },
          { x: 5080, y: 7500 },
        ],
      },
    ];

    // 2. 戰略公路與胡志明小道走廊 (Roads & Supply Trails)
    continent.roads = [
      {
        type: 'road',
        points: [
          { x: 6400, y: 7800 },
          { x: 6800, y: 6400 },
          { x: 7900, y: 5500 },
          { x: 9200, y: 4500 },
          { x: 10600, y: 3800 },
          { x: 11200, y: 3400 },
        ],
      },
      {
        type: 'trail',
        points: [
          { x: 11500, y: 3600 },
          { x: 10800, y: 4600 },
          { x: 9800, y: 5700 },
          { x: 8900, y: 6800 },
          { x: 7800, y: 7500 },
        ],
      },
      {
        type: 'trail',
        points: [
          { x: 6200, y: 5600 },
          { x: 7200, y: 5800 },
          { x: 7900, y: 5500 },
          { x: 8600, y: 5200 },
        ],
      },
    ];

    // 3. 大陸山嶺與制高點高地 (Hills & Ridges)
    continent.hills = [
      { x: 10800, y: 3100, radius: 125 }, // 要塞天險制高點
      { x: 9800, y: 4200, radius: 95 },   // 875 高地 (Hill 875)
      { x: 8900, y: 5200, radius: 85 },   // 55 高地 (Hill 55)
      { x: 7400, y: 7000, radius: 90 },   // 大理石山山脊 (Marble Mountain)
      { x: 8200, y: 6200, radius: 80 },   // 虎嶺山稜 (Tiger Ridge)
      { x: 10400, y: 4900, radius: 105 }, // 漢堡高地 (Hamburger Hill)
      { x: 9400, y: 6000, radius: 80 },   // 三角洲丘陵
      { x: 7800, y: 4600, radius: 85 },   // 谷地山丘
    ];

    // 4. 熱帶雨林與密林叢林群 (Dense Jungles - 時代四熱帶雨林核心特色)
    continent.jungles = [
      { x: 6900, y: 6900, radius: 130, density: 0.85 },
      { x: 7300, y: 6100, radius: 110, density: 0.85 },
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
      { x: 8500, y: 4700, radius: 120, density: 0.85 },
      { x: 8900, y: 3900, radius: 135, density: 0.85 },
      { x: 9400, y: 3600, radius: 140, density: 0.90 },
      { x: 9900, y: 3200, radius: 130, density: 0.85 },
      { x: 10300, y: 2800, radius: 125, density: 0.85 },
      { x: 10800, y: 2400, radius: 135, density: 0.90 },
      { x: 11300, y: 2200, radius: 120, density: 0.85 },
      { x: 11700, y: 3000, radius: 130, density: 0.85 },
      { x: 11900, y: 3600, radius: 125, density: 0.85 },
      { x: 7600, y: 5100, radius: 110, density: 0.80 },
      { x: 8100, y: 4300, radius: 125, density: 0.85 },
      { x: 8700, y: 7200, radius: 120, density: 0.85 },
      { x: 9300, y: 7400, radius: 130, density: 0.85 },
      { x: 9900, y: 6800, radius: 135, density: 0.90 },
      { x: 10500, y: 6400, radius: 125, density: 0.85 },
    ];

    // ══════════════════════════════════════════════════════════
    // 友軍大陸板塊防禦設施 (Allied Continental Logistics & Defense Belt)
    // 位於大陸西南後方縱深 (X: 5800-6800, Y: 7200-8500)
    // ══════════════════════════════════════════════════════════
    const alliedHqPos: Vector2D = { x: 6400, y: 7800 };
    const hqName =
      era === 'era4'
        ? '美軍 MACV 峴港前進指揮中心 [MACV Da Nang HQ]'
        : '美陸軍前線指揮中心 [Mainland Allied HQ]';
    const hqDesc =
      era === 'era4'
        ? '美軍軍事援助越南司令部 · 前線雷達導引通信中心與戰術任務指管部'
        : '地下花崗岩加固防核指揮掩體 · 戰術通信與前線陸軍部隊整備中心';

    const afbName =
      era === 'era4'
        ? '峴港空軍基地 (Da Nang Air Base / 366th TFW)'
        : '遠東空軍大陸前進航空基地 (K-18 Suwon/Osan AFB)';
    const afbDesc =
      era === 'era4'
        ? '雙跑道全天候重型空軍航空基地 · 部署 F-4E, F-105, B-52, A-7, OV-10, UH-1, AH-1'
        : '雙跑道全天候後勤航空站 · USAAF 第5航空隊 F-86 軍刀機與天襲者起降基地';

    continent.installations.push(
      // 1. 友軍前線指揮中心
      {
        id: 'player-hq-continental',
        type: 'command_post',
        name: hqName,
        weaponDesc: hqDesc,
        pos: alliedHqPos,
        angle: -Math.PI / 4,
        health: 7500,
        maxHealth: 7500,
        armor: 0.82,
        range: 1200,
        cooldown: 0,
        reloadTime: 1.5,
        isDestroyed: false,
        side: 'player',
      },
      // 2. 大陸前進航空基地
      {
        id: 'player-afb-continental',
        type: 'airfield',
        name: afbName,
        weaponDesc: afbDesc,
        pos: { x: 6200, y: 8200 },
        angle: -Math.PI / 4,
        health: 5500,
        maxHealth: 5500,
        armor: 0.55,
        range: 4800,
        cooldown: 0,
        reloadTime: 12,
        isDestroyed: false,
        side: 'player',
      },
      // 3. 友軍防空火網 (90mm M2 / 40mm Bofors / M42 Duster)
      {
        id: 'player-cont-flak-1',
        type: 'flak_battery',
        name: '美陸軍 90mm M2 重型防空砲連 (SCR-584雷達導引)',
        weaponDesc: 'SCR-584 雷達射控 VT 信管 90mm 防空砲 · 封鎖高空轟炸走廊',
        pos: { x: 6300, y: 7600 },
        angle: 0,
        health: 2600,
        maxHealth: 2600,
        armor: 0.45,
        range: 1350,
        cooldown: 0.6,
        reloadTime: 1.6,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: false,
      },
      {
        id: 'player-cont-flak-2',
        type: 'flak_battery',
        name: '美陸軍 40mm 博福斯四聯防空砲連 (基地直衛)',
        weaponDesc: '密集40mm速射防空彈幕 · 攔截低空噴射攻擊機與強擊機',
        pos: { x: 6550, y: 7950 },
        angle: Math.PI / 2,
        health: 2400,
        maxHealth: 2400,
        armor: 0.42,
        range: 1100,
        cooldown: 0.5,
        reloadTime: 1.3,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: false,
      },
      {
        id: 'player-cont-flak-3',
        type: 'flak_battery',
        name: '美陸軍 M42 清道夫雙管40mm自走防空砲陣地',
        weaponDesc: '雙管40mm機動高射砲 · 伴隨掩護司令部指揮所',
        pos: { x: 6600, y: 7650 },
        angle: -Math.PI / 3,
        health: 2200,
        maxHealth: 2200,
        armor: 0.40,
        range: 1050,
        cooldown: 0.4,
        reloadTime: 1.2,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: false,
      },
      // 4. 友軍長程重砲群 (155mm M114 / 105mm M2A1 / 203mm 岸防加農砲)
      {
        id: 'player-cont-arty-1',
        type: 'towed_artillery',
        name: '美陸軍 M114 155mm 重榴彈砲連 (HQ前線重火網)',
        weaponDesc: '長程重型野戰榴彈砲 · 壓制大陸中央戰線敵軍裝甲突擊',
        pos: { x: 6500, y: 7400 },
        angle: -Math.PI / 4,
        health: 3000,
        maxHealth: 3000,
        armor: 0.48,
        range: 1750,
        cooldown: 1.1,
        reloadTime: 3.2,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: true,
      },
      {
        id: 'player-cont-arty-2',
        type: 'towed_artillery',
        name: '美陸軍 M2A1 105mm 輕型榴彈砲連 (前沿支援)',
        weaponDesc: '高射速步兵火力支援砲兵陣地',
        pos: { x: 6700, y: 7550 },
        angle: -Math.PI / 4,
        health: 2600,
        maxHealth: 2600,
        armor: 0.40,
        range: 1450,
        cooldown: 0.8,
        reloadTime: 2.2,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: true,
      },
      {
        id: 'player-cont-coastal-1',
        type: 'coastal_gun',
        name: '美海軍陸戰隊 8吋(203mm) 岸防加農砲台',
        weaponDesc: '超長程重型岸防砲 · 封鎖西南海岸深水航道與反制水面突襲',
        pos: { x: 5800, y: 8400 },
        angle: -Math.PI / 2,
        health: 3800,
        maxHealth: 3800,
        armor: 0.65,
        range: 2000,
        cooldown: 1.5,
        reloadTime: 4.0,
        isDestroyed: false,
        side: 'player',
        isASuWOnly: true,
      },
      // 5. 戰地後勤與醫療野戰醫院
      {
        id: 'player-cont-hospital',
        type: 'field_hospital',
        name: '美國陸軍第8055戰地外科醫院 (8055th MASH Unit)',
        weaponDesc: '前線直升機後送與傷患救治中心 · 快速復原陸上部隊組織度與兵員',
        pos: { x: 6150, y: 7900 },
        angle: 0,
        health: 2800,
        maxHealth: 2800,
        armor: 0.35,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
      },
      {
        id: 'player-cont-depot',
        type: 'supply_depot',
        name: '大陸前進戰役兵站與油彈儲備庫 (POL Logistics Depot)',
        weaponDesc: '彈藥、油料與裝甲備件樞紐 · 加速全線部隊建制度修整',
        pos: { x: 6350, y: 8050 },
        angle: 0,
        health: 3200,
        maxHealth: 3200,
        armor: 0.45,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
      }
    );

    // ══════════════════════════════════════════════════════════
    // 敵方大陸堅固要塞群 (OPFOR Continental Fortress Complex)
    // 位於大陸東北麓花崗岩山脈深處 (X: 10000-12000, Y: 2600-4200)
    // ══════════════════════════════════════════════════════════
    const enemyHqPos: Vector2D = { x: 11200, y: 3400 };
    continent.installations.push(
      // 1. 遠東聯軍地下花崗岩要塞司令部
      {
        id: 'enemy-hq-continental',
        type: 'command_post',
        name: '遠東聯軍地下要塞前進指揮所 [OPFOR Fortress HQ]',
        weaponDesc: '深層花崗岩防核防空坑道要塞 · 戰時地下戰役指揮所',
        pos: enemyHqPos,
        angle: (Math.PI * 3) / 4,
        health: 7500,
        maxHealth: 7500,
        armor: 0.82,
        range: 1300,
        cooldown: 0,
        reloadTime: 1.5,
        isDestroyed: false,
        side: 'enemy',
      },
      // 2. 敵大陸航空基地 (OPFOR Continental Airbase)
      {
        id: 'enemy-afb-continental',
        type: 'airfield',
        name: '遠東聯軍前線野戰空軍基地 (OPFOR Continental Airfield)',
        weaponDesc: '混凝土跑道航空樞紐 · MiG-15 噴射機與 IL-10 強擊機戰略升空母港',
        pos: { x: 11600, y: 3800 },
        angle: (Math.PI * 3) / 4,
        health: 5500,
        maxHealth: 5500,
        armor: 0.55,
        range: 4600,
        cooldown: 0,
        reloadTime: 14,
        isDestroyed: false,
        side: 'enemy',
      },
      // 3. 敵方防空火網 (KS-19 100mm 重高砲 / S-60 57mm 雷達砲)
      {
        id: 'enemy-cont-ks19-1',
        type: 'flak_battery',
        name: 'KS-19 100mm 重型防空砲第1連 (SON-9雷達導引)',
        weaponDesc: '100mm 重型雷達射控高射砲 · 封鎖大陸上空萬米轟炸走廊',
        pos: { x: 11000, y: 3600 },
        angle: (Math.PI * 3) / 4,
        health: 3800,
        maxHealth: 3800,
        armor: 0.60,
        range: 1500,
        cooldown: 0.7,
        reloadTime: 1.5,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: false,
      },
      {
        id: 'enemy-cont-ks19-2',
        type: 'flak_battery',
        name: 'KS-19 100mm 重型防空砲第2連 (要塞核心頂蓋)',
        weaponDesc: '重裝甲花崗岩掩體防空高砲 · 壓制高空轟炸',
        pos: { x: 10800, y: 3100 },
        angle: (Math.PI * 3) / 4,
        health: 3800,
        maxHealth: 3800,
        armor: 0.60,
        range: 1500,
        cooldown: 0.7,
        reloadTime: 1.5,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: false,
      },
      {
        id: 'enemy-cont-s60-1',
        type: 'flak_battery',
        name: 'S-60 57mm 自動防空高射砲連 (西翼防線)',
        weaponDesc: '57mm 雷達火控自動高射砲群 · 攔截低空噴射攻擊機',
        pos: { x: 10400, y: 4000 },
        angle: Math.PI / 2,
        health: 3200,
        maxHealth: 3200,
        armor: 0.52,
        range: 1250,
        cooldown: 0.6,
        reloadTime: 1.1,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: false,
      },
      {
        id: 'enemy-cont-s60-2',
        type: 'flak_battery',
        name: 'S-60 57mm 自動防空高射砲連 (東翼防線)',
        weaponDesc: '57mm 雷達火控自動高射砲群 · 攔截俯衝戰機',
        pos: { x: 11400, y: 3000 },
        angle: 0,
        health: 3200,
        maxHealth: 3200,
        armor: 0.52,
        range: 1250,
        cooldown: 0.6,
        reloadTime: 1.1,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: false,
      },
      // 4. 敵方野戰重砲群 (A-19 122mm 加農砲 / ML-20 152mm 榴彈砲)
      {
        id: 'enemy-cont-arty-1',
        type: 'towed_artillery',
        name: 'A-19 122mm 加農砲連 (前沿反突擊砲兵陣地)',
        weaponDesc: '超長身管加農砲 · 跨越山體重創美陸軍進攻矛頭',
        pos: { x: 10600, y: 3800 },
        angle: (Math.PI * 3) / 4,
        health: 3400,
        maxHealth: 3400,
        armor: 0.52,
        range: 1650,
        cooldown: 1.0,
        reloadTime: 2.8,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: true,
      },
      {
        id: 'enemy-cont-arty-2',
        type: 'towed_artillery',
        name: 'ML-20 152mm 重型加農榴彈砲連 (要塞縱深重火網)',
        weaponDesc: '重裝甲要塞加農砲 · 覆蓋戰線中央交通要道',
        pos: { x: 10800, y: 3400 },
        angle: (Math.PI * 3) / 4,
        health: 3600,
        maxHealth: 3600,
        armor: 0.55,
        range: 1800,
        cooldown: 1.2,
        reloadTime: 3.4,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: true,
      },
      // 5. 敵方沿海重砲要塞與雷達哨
      {
        id: 'enemy-cont-coastal-1',
        type: 'coastal_gun',
        name: 'B-13 130mm 沿海要塞岸防加農砲台',
        weaponDesc: '花崗岩懸崖砲台 · 封鎖北部沿海水道',
        pos: { x: 10100, y: 2600 },
        angle: -Math.PI / 3,
        health: 4400,
        maxHealth: 4400,
        armor: 0.68,
        range: 1900,
        cooldown: 1.4,
        reloadTime: 3.5,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: true,
      },
      {
        id: 'enemy-cont-coastal-2',
        type: 'coastal_gun',
        name: '152mm 雙聯裝長程海防重砲堡',
        weaponDesc: '半地下混凝土重砲堡 · 扼守沿海登陸水線',
        pos: { x: 11800, y: 2800 },
        angle: -Math.PI / 4,
        health: 4600,
        maxHealth: 4600,
        armor: 0.70,
        range: 1950,
        cooldown: 1.5,
        reloadTime: 3.8,
        isDestroyed: false,
        side: 'enemy',
        isASuWOnly: true,
      },
      {
        id: 'enemy-cont-radar',
        type: 'radar_station',
        name: 'P-20 (Dumbo) 遠程對空早期預警雷達站',
        weaponDesc: '大型全方位預警雷達天線 · 引導 MiG-15 高速攔截',
        pos: { x: 11100, y: 3000 },
        angle: 0,
        health: 3000,
        maxHealth: 3000,
        armor: 0.45,
        range: 4500,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'enemy',
      },
      {
        id: 'enemy-cont-depot',
        type: 'ammo_depot',
        name: '花崗岩深層防核彈藥與航油儲備掩體',
        weaponDesc: '要塞地下彈藥庫 · 為重砲與戰車提供彈藥',
        pos: { x: 11400, y: 3500 },
        angle: 0,
        health: 4000,
        maxHealth: 4000,
        armor: 0.65,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'enemy',
      },
      {
        id: 'enemy-cont-tunnel-1',
        type: 'hidden_tunnel',
        name: '前線花崗岩伏擊坑道網絡 [No.1]',
        weaponDesc: '隱蔽地下防空反擊通道',
        pos: { x: 10500, y: 4200 },
        angle: 0,
        health: 3500,
        maxHealth: 3500,
        armor: 0.70,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'enemy',
      },
      {
        id: 'enemy-cont-tunnel-2',
        type: 'hidden_tunnel',
        name: '中央丘陵地下隱蔽集結坑道 [No.2]',
        weaponDesc: '伏擊步兵機動出擊口',
        pos: { x: 9900, y: 4600 },
        angle: 0,
        health: 3500,
        maxHealth: 3500,
        armor: 0.70,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'enemy',
      }
    );

    if (era === 'era4') {
      continent.installations.push(
        {
          id: 'player-sam-hawk-1',
          type: 'sam_hawk',
          name: 'MIM-23 鷹式 (Hawk) 地面防空飛彈發射連',
          weaponDesc: '美陸戰隊/陸軍前線地空防空飛彈 · 自動雷達引導攔截2600m內來襲敵機',
          pos: { x: 6500, y: 7700 },
          angle: 0,
          health: 4200,
          maxHealth: 4200,
          armor: 0.55,
          range: 2600,
          cooldown: 0,
          reloadTime: 3.5,
          isDestroyed: false,
          side: 'player',
          isASuWOnly: false,
          samMissilesReady: 12,
          samMaxMissiles: 12,
        },
        {
          id: 'player-fob-1',
          type: 'forward_fob',
          name: '美陸戰隊直升機野戰前進基地 (Forward FOB LZ Stud)',
          weaponDesc: '前線突擊直升機整補基地 · 支援垂直包圍與空中突擊機降',
          pos: { x: 6700, y: 7500 },
          angle: 0,
          health: 4500,
          maxHealth: 4500,
          armor: 0.55,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'player',
        },
        // 3x 堅固加固暗堡支撐點 (Bunker Nests) 封鎖戰線進攻軸線
        {
          id: 'enemy-bunker-alpha',
          type: 'bunker_nest',
          name: '北越人民軍前沿加固重機槍暗堡 [Bunker Alpha - 61高地]',
          weaponDesc: '雙層鋼筋混凝土永備暗堡 · 密集交叉火網壓制突擊步兵 · 造成重度火力壓制',
          pos: { x: 8400, y: 5500 },
          angle: -Math.PI / 4,
          health: 4600,
          maxHealth: 4600,
          armor: 0.75,
          range: 1100,
          cooldown: 0.4,
          reloadTime: 1.2,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-bunker-bravo',
          type: 'bunker_nest',
          name: '溪山外圍鞍部重型交叉掩蔽暗堡 [Bunker Bravo - 溪山外緣]',
          weaponDesc: '地下覆土加固重型工事 · DShK 12.7mm重機槍與無後座力砲扼守隘口',
          pos: { x: 8900, y: 4900 },
          angle: -Math.PI / 3,
          health: 4800,
          maxHealth: 4800,
          armor: 0.78,
          range: 1150,
          cooldown: 0.4,
          reloadTime: 1.2,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-bunker-charlie',
          type: 'bunker_nest',
          name: '881高地核心稜線重型連環暗堡群 [Bunker Charlie - 881南峰]',
          weaponDesc: '制高點山體岩洞暗堡連鎖樞紐 · 壓制沿公路推進之機械化部隊',
          pos: { x: 9600, y: 4300 },
          angle: -Math.PI / 4,
          health: 5200,
          maxHealth: 5200,
          armor: 0.82,
          range: 1200,
          cooldown: 0.35,
          reloadTime: 1.0,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-sa2-alpha',
          type: 'sa2_sam_site',
          name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Alpha]',
          weaponDesc: 'V-750 兩級固體助推防空飛彈 · 殺傷半徑45m · 由扇歌雷達導引',
          pos: { x: 10600, y: 3900 },
          angle: 0,
          health: 3800,
          maxHealth: 3800,
          armor: 0.52,
          range: 2400,
          cooldown: 1.0,
          reloadTime: 3.5,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: false,
        },
        {
          id: 'enemy-fan-song',
          type: 'fan_song_radar',
          name: 'Fan Song 扇歌射控火控雷達陣地 [Radar Guidance]',
          weaponDesc: 'E/F頻段目標跟蹤與飛彈制導雷達 · 發射強烈電磁信號 · AGM-45 反輻射飛彈首要打擊目標',
          pos: { x: 10400, y: 3700 },
          angle: 0,
          health: 2800,
          maxHealth: 2800,
          armor: 0.40,
          range: 4800,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'enemy',
          isRadarEmitting: true,
        },
        {
          id: 'enemy-sa2-bravo',
          type: 'sa2_sam_site',
          name: 'SA-2 導針 (Guideline) 地空防空飛彈發射營 [SAM Bravo]',
          weaponDesc: '重型防空飛彈發射陣列 · 封鎖高空轟炸空域',
          pos: { x: 11400, y: 3100 },
          angle: 0,
          health: 3800,
          maxHealth: 3800,
          armor: 0.52,
          range: 2400,
          cooldown: 1.0,
          reloadTime: 3.5,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: false,
        },
        {
          id: 'enemy-shilka-1',
          type: 'flak_battery',
          name: 'ZSU-23-4 石勒喀河四聯裝23mm雷達防砲陣地',
          weaponDesc: '雷達火控四管極高射速機砲 · 封鎖超低空突防',
          pos: { x: 10800, y: 3400 },
          angle: 0,
          health: 3200,
          maxHealth: 3200,
          armor: 0.52,
          range: 1250,
          cooldown: 0.4,
          reloadTime: 0.8,
          isDestroyed: false,
          side: 'enemy',
        },
        // ─── 3X 擴展大陸設施群 (均勻散布中立、敵方與可奪佔戰略據點) ───
        {
          id: 'neutral-plantation-1',
          type: 'rubber_plantation',
          name: '米芝蓮法式橡膠種植園莊園 [Michelin Plantation]',
          weaponDesc: '密集橡膠林覆蓋之熱帶種植園 · 佔領提供戰術隱蔽與物資補給 (+15 CP)',
          pos: { x: 7800, y: 6200 },
          angle: 0,
          health: 3200,
          maxHealth: 3200,
          armor: 0.40,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
          civilianZoneRadius: 200,
        },
        {
          id: 'neutral-plantation-2',
          type: 'rubber_plantation',
          name: '安祿外圍橡膠種植園 [An Loc Plantation]',
          weaponDesc: '天然橡膠加工廠與橡膠樹林區 · 阻滯裝甲車輛衝刺並提供步兵重掩護',
          pos: { x: 8800, y: 5800 },
          angle: 0,
          health: 3200,
          maxHealth: 3200,
          armor: 0.40,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
          civilianZoneRadius: 200,
        },
        {
          id: 'neutral-ferry-1',
          type: 'river_ferry',
          name: '班海河戰略浮橋渡口碼頭 [Ben Hai River Ferry]',
          weaponDesc: '鋼纜浮橋與木造渡輪碼頭 · 奪佔可開闢部隊跨河機動走廊',
          pos: { x: 8200, y: 4200 },
          angle: Math.PI / 2,
          health: 3500,
          maxHealth: 3500,
          armor: 0.45,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
        },
        {
          id: 'neutral-ferry-2',
          type: 'river_ferry',
          name: '紅河支流石灘渡運站 [Delta Crossing Ferry]',
          weaponDesc: '三角洲河流交匯處渡口 · 兩棲突擊裝甲車與渡河舟艇集結地',
          pos: { x: 7700, y: 6900 },
          angle: -Math.PI / 4,
          health: 3500,
          maxHealth: 3500,
          armor: 0.45,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
        },
        {
          id: 'neutral-radio-1',
          type: 'radio_station',
          name: '965高地戰術微波無線電轉播塔 [Relay Station 965]',
          weaponDesc: '制高點鋼架通信鐵塔 · 奪佔可大幅提升全域雷達與前線砲兵射控精度',
          pos: { x: 9400, y: 6000 },
          angle: 0,
          health: 2600,
          maxHealth: 2600,
          armor: 0.35,
          range: 3500,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
        },
        {
          id: 'enemy-radio-relay',
          type: 'radio_station',
          name: '北越軍事通信總台與密碼監聽站 [Radio Relay Station]',
          weaponDesc: '敵軍前線通信轉發中心 · 摧毀可瓦解敵方空中攔截協同',
          pos: { x: 10900, y: 3900 },
          angle: 0,
          health: 2800,
          maxHealth: 2800,
          armor: 0.40,
          range: 4000,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'neutral-cache-1',
          type: 'ammo_cache',
          name: '叢林隱蔽野戰彈藥與航油補給點 [Forward Ammo Cache]',
          weaponDesc: '油桶與彈藥箱集結棧點 · 佔領即刻補滿周邊友軍部隊彈藥與油料',
          pos: { x: 7300, y: 6500 },
          angle: 0,
          health: 2800,
          maxHealth: 2800,
          armor: 0.30,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'player',
        },
        {
          id: 'enemy-cache-2',
          type: 'ammo_cache',
          name: '胡志明小道前進物資儲備轉運站 [559 Group Depot]',
          weaponDesc: '偽裝密林彈藥轉運棧 · 堆積 122mm 火箭彈與迫擊砲彈',
          pos: { x: 9800, y: 5700 },
          angle: 0,
          health: 3200,
          maxHealth: 3200,
          armor: 0.35,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-watchtower-1',
          type: 'watchtower',
          name: '邊境叢林木質高架瞭望哨塔 [Border Watchtower 1]',
          weaponDesc: '重機槍警戒木塔 · 探測並通報潛伏滲透小隊',
          pos: { x: 8000, y: 4800 },
          angle: 0,
          health: 1800,
          maxHealth: 1800,
          armor: 0.25,
          range: 900,
          cooldown: 0.5,
          reloadTime: 1.2,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-watchtower-2',
          type: 'watchtower',
          name: '鞍部制高點鋼架偵察哨塔 [Ridge Watchtower 2]',
          weaponDesc: 'DShK 12.7mm 重機槍哨位 · 監控沿公路推進動態',
          pos: { x: 8600, y: 6400 },
          angle: 0,
          health: 2000,
          maxHealth: 2000,
          armor: 0.28,
          range: 950,
          cooldown: 0.5,
          reloadTime: 1.2,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-flak-zpu4-1',
          type: 'flak_battery',
          name: 'ZPU-4 四聯裝14.5mm防空機槍陣地 [Flak LZ Amber]',
          weaponDesc: '四管極高射速高射機槍 · 對低空穿梭機降直升機形成致命撕裂火網',
          pos: { x: 8100, y: 5300 },
          angle: 0,
          health: 2400,
          maxHealth: 2400,
          armor: 0.40,
          range: 1050,
          cooldown: 0.3,
          reloadTime: 0.9,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-flak-zpu4-2',
          type: 'flak_battery',
          name: 'ZPU-4 四聯裝14.5mm防空機槍陣地 [Flak LZ Blue]',
          weaponDesc: '密林隱蔽四聯高射機槍 · 防衛前沿隘口',
          pos: { x: 8500, y: 4600 },
          angle: 0,
          health: 2400,
          maxHealth: 2400,
          armor: 0.40,
          range: 1050,
          cooldown: 0.3,
          reloadTime: 0.9,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-flak-61k-1',
          type: 'flak_battery',
          name: '61-K 37mm 自動防空高射砲連 [Valley AA]',
          weaponDesc: '雙聯裝37mm速射高砲 · 壓制低空俯衝俯衝攻擊',
          pos: { x: 9100, y: 4100 },
          angle: 0,
          health: 2600,
          maxHealth: 2600,
          armor: 0.45,
          range: 1150,
          cooldown: 0.4,
          reloadTime: 1.1,
          isDestroyed: false,
          side: 'enemy',
        },
        {
          id: 'enemy-arty-d30-1',
          type: 'towed_artillery',
          name: 'D-30 122mm 榴彈砲前線發射陣地 [D-30 Battery East]',
          weaponDesc: '三腳架360度環射榴彈砲 · 遠程齊射轟擊登陸部隊與直升機機降區',
          pos: { x: 9700, y: 5000 },
          angle: -Math.PI / 4,
          health: 3200,
          maxHealth: 3200,
          armor: 0.50,
          range: 1650,
          cooldown: 1.1,
          reloadTime: 2.7,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-arty-d30-2',
          type: 'towed_artillery',
          name: 'D-30 122mm 榴彈砲前線發射陣地 [D-30 Battery North]',
          weaponDesc: '隱蔽於石灰岩溶洞外圍之重榴砲陣地 · 長程火力支援暗堡群',
          pos: { x: 10200, y: 4400 },
          angle: -Math.PI / 3,
          health: 3200,
          maxHealth: 3200,
          armor: 0.50,
          range: 1650,
          cooldown: 1.1,
          reloadTime: 2.7,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-bunker-delta',
          type: 'bunker_nest',
          name: '溪山北側高地環形暗堡要塞 [Bunker Delta - 861高地]',
          weaponDesc: '花崗岩厚重暗堡 · 配備 75mm 無後座力砲與雙聯重機槍',
          pos: { x: 9100, y: 4700 },
          angle: -Math.PI / 4,
          health: 5000,
          maxHealth: 5000,
          armor: 0.80,
          range: 1150,
          cooldown: 0.4,
          reloadTime: 1.1,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'enemy-bunker-echo',
          type: 'bunker_nest',
          name: '安祿外圍鋼筋混凝土核心連鎖堡 [Bunker Echo - 核心環線]',
          weaponDesc: '重裝甲碉堡堡群 · 封鎖南部戰略公路咽喉',
          pos: { x: 8700, y: 6600 },
          angle: -Math.PI / 3,
          health: 5100,
          maxHealth: 5100,
          armor: 0.80,
          range: 1150,
          cooldown: 0.4,
          reloadTime: 1.1,
          isDestroyed: false,
          side: 'enemy',
          isASuWOnly: true,
        },
        {
          id: 'neutral-clinic-1',
          type: 'settlement',
          name: '國際戰地平民診所與紅十字醫療站 [Civilian Field Clinic]',
          weaponDesc: '中立戰地醫療院所 · 嚴禁實彈射擊 · 誤擊遭軍法懲處 -15 CP',
          pos: { x: 7400, y: 7700 },
          angle: 0,
          health: 2600,
          maxHealth: 2600,
          armor: 0.30,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
          civilianZoneRadius: 180,
          isCivilian: true,
        },
        {
          id: 'neutral-town-quangtri',
          type: 'town',
          name: '廣治古城集鎮聚落 [Quang Tri Citadel Town]',
          weaponDesc: '古老城牆與瓦舍街區 · 提供優秀城市戰掩護與居民集結避難所',
          pos: { x: 8300, y: 4900 },
          angle: 0,
          health: 4800,
          maxHealth: 4800,
          armor: 0.55,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'neutral',
          civilianZoneRadius: 220,
          isCivilian: true,
        },
        {
          id: 'neutral-town-hue',
          type: 'town',
          name: '香江沿岸水鄉聚落市鎮 [Perfume River Town]',
          weaponDesc: '河畔石階市鎮與商行 · 扼守渡河樞紐',
          pos: { x: 7500, y: 6100 },
          angle: 0,
          health: 4400,
          maxHealth: 4400,
          armor: 0.50,
          range: 0,
          cooldown: 0,
          reloadTime: 0,
          isDestroyed: false,
          side: 'player',
          civilianZoneRadius: 190,
          isCivilian: true,
        }
      );
    }

    // ══════════════════════════════════════════════════════════
    // 大陸板塊城鎮、平民定居點與難民收容營 (Civilian Zones & Urban Terrain)
    // 進入城鎮市區戰鬥獲 +50% 直射掩護與 70% 空襲炸彈減傷；
    // 若我方砲火誤擊平民區或難民營，將遭受附帶損害懲處 (-15 CP)
    // ══════════════════════════════════════════════════════════
    continent.installations.push(
      // 1. 大型城市 (City - 280m 掩蔽半徑)
      {
        id: 'city-wonsan',
        type: 'city',
        name: '元山市核心市區 (City of Wonsan)',
        weaponDesc: '沿海港埠大城市 · 密集混凝土建築與街區 · 部隊進駐享 +50%防禦掩護與 70%空襲減傷',
        pos: { x: 6800, y: 6400 },
        angle: 0,
        health: 7000,
        maxHealth: 7000,
        armor: 0.65,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 280,
        isCivilian: true,
      },
      {
        id: 'city-hamhung',
        type: 'city',
        name: '咸興工業市街 (Hamhung City District)',
        weaponDesc: '中央重工業與鐵路樞紐城市 · 密集廠房與街區 · 提供優秀城市戰掩體',
        pos: { x: 9200, y: 4500 },
        angle: 0,
        health: 6500,
        maxHealth: 6500,
        armor: 0.65,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'enemy',
        civilianZoneRadius: 260,
        isCivilian: true,
      },
      // 2. 城鎮 (Town - 200m 掩蔽半徑)
      {
        id: 'town-kowon',
        type: 'town',
        name: '高原樞紐集鎮 (Kowon Crossroads Town)',
        weaponDesc: '前線交通十字路口市鎮 · 傳統市集與瓦房區 · 城市戰掩護',
        pos: { x: 7900, y: 5500 },
        angle: 0,
        health: 4500,
        maxHealth: 4500,
        armor: 0.50,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 200,
        isCivilian: true,
      },
      {
        id: 'town-anbyon',
        type: 'town',
        name: '安邊山谷城鎮 (Anbyon Valley Town)',
        weaponDesc: '群山環抱之谷地城鎮 · 依山而建街道 · 阻滯空襲砲火',
        pos: { x: 7300, y: 7200 },
        angle: 0,
        health: 4200,
        maxHealth: 4200,
        armor: 0.50,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 180,
        isCivilian: true,
      },
      // 3. 沿海定居點 (Settlement - 150m 半徑)
      {
        id: 'settlement-hungnam',
        type: 'settlement',
        name: '興南港沿海漁港定居點 (Hungnam Port Settlement)',
        weaponDesc: '沿岸漁村與碼頭民宅區 · 非軍事打擊目標',
        pos: { x: 6200, y: 5600 },
        angle: 0,
        health: 3200,
        maxHealth: 3200,
        armor: 0.35,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 150,
        isCivilian: true,
      },
      {
        id: 'settlement-tongchon',
        type: 'settlement',
        name: '通川沿海村落 (Tongchon Coastal Village)',
        weaponDesc: '南部沿海漁民村落 · 平民生活居住聚落',
        pos: { x: 6600, y: 8400 },
        angle: 0,
        health: 3000,
        maxHealth: 3000,
        armor: 0.35,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 140,
        isCivilian: true,
      },
      // 4. 戰地難民收容營 (Refugee Camp - 170m 安全區)
      {
        id: 'refugee-hungnam',
        type: 'refugee_camp',
        name: '興南港聯合國戰地難民收容營 (UN Refugee Camp)',
        weaponDesc: '聯合國與紅十字會人道救援帳篷區 · 嚴禁實彈射擊 · 誤擊遭軍法懲處 -15 CP',
        pos: { x: 5900, y: 6600 },
        angle: 0,
        health: 2600,
        maxHealth: 2600,
        armor: 0.25,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 170,
        isCivilian: true,
      },
      {
        id: 'refugee-chongjin',
        type: 'refugee_camp',
        name: '紅十字會前線戰地難民救濟站 (Red Cross Camp)',
        weaponDesc: '國際人道救濟與醫療帳篷站 · 受擊將嚴重損害盟軍國際聲譽 (-15 CP)',
        pos: { x: 7600, y: 8000 },
        angle: 0,
        health: 2400,
        maxHealth: 2400,
        armor: 0.25,
        range: 0,
        cooldown: 0,
        reloadTime: 0,
        isDestroyed: false,
        side: 'player',
        civilianZoneRadius: 160,
        isCivilian: true,
      }
    );

    islands.push(continent);

    // 2個外海戰略小島 (位於大陸西側深海)
    const outIsl1Name = era === 'era4' ? 'Hon Me Island (昏果島雷達前哨島)' : 'Wonsan Outer Bastion (元山外海要塞島)';
    const outIsl2Name = era === 'era4' ? 'Con Co Island (白龍尾飛彈陣地島)' : 'Chodo Radar Outpost (椒島雷達前哨島)';
    islands.push(
      generateOrganicIsland(
        'island-wonsan',
        outIsl1Name,
        { x: 3800, y: 8600 },
        440,
        seedBase + 201,
        era
      ),
      generateOrganicIsland(
        'island-chodo',
        outIsl2Name,
        { x: 3200, y: 5200 },
        360,
        seedBase + 301,
        era
      )
    );
  } else {
    // 時代一與時代二: 8座群島要塞
    const islandConfigs: { name: string; center: Vector2D; radius: number }[] = [
      { name: 'Guadalcanal Fortress (瓜達爾卡納爾島)', center: { x: 4800, y: 9200 }, radius: 520 },
      { name: 'Tulagi Deep Anchorage (圖拉吉港要塞)', center: { x: 6600, y: 8100 }, radius: 420 },
      { name: 'Savo Island Bastion (薩沃島天險)', center: { x: 3900, y: 7100 }, radius: 380 },
      { name: 'Matan Coral Atoll (馬坦珊瑚環礁)', center: { x: 8800, y: 9100 }, radius: 460 },
      { name: 'Ironbottom Sound Shoals (鐵底灣要衝)', center: { x: 7200, y: 5800 }, radius: 540 },
      { name: 'Santa Cruz Strategic Base (聖克魯斯前哨基地)', center: { x: 10100, y: 6400 }, radius: 440 },
      { name: 'Rabaul Forward Citadel (拉包爾航空要塞)', center: { x: 9200, y: 3900 }, radius: 500 },
      { name: 'Volcano Reef Strongpoint (火山礁要塞群)', center: { x: 5300, y: 4400 }, radius: 400 },
    ];

    for (let i = 0; i < islandConfigs.length; i++) {
      const cfg = islandConfigs[i];
      const jitterX = Math.sin(i * 19.3 + seedBase) * 220;
      const jitterY = Math.cos(i * 23.7 + seedBase) * 220;
      const center: Vector2D = {
        x: Math.max(1200, Math.min(worldSize - 1200, cfg.center.x + jitterX)),
        y: Math.max(1200, Math.min(worldSize - 1200, cfg.center.y + jitterY)),
      };

      islands.push(
        generateOrganicIsland(
          `island-${i + 1}`,
          cfg.name,
          center,
          cfg.radius,
          seedBase + i * 77,
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
      }
    );

    // 3. 大陸主戰線上的 OPFOR 守備與反撲部隊
    groundUnits.push(
      createGroundUnit('opfor-cont-inf-1', 'opfor_coldwar_infantry', 'KPA 4th Inf Div Assault Plt (遠東突擊步兵第1排)', 'enemy', 'era3', { x: 8600, y: 5200 }),
      createGroundUnit('opfor-cont-inf-2', 'opfor_coldwar_infantry', 'KPA 4th Inf Div Assault Plt (遠東突擊步兵第2排)', 'enemy', 'era3', { x: 8800, y: 5000 }),
      createGroundUnit('opfor-cont-tank-1', 'opfor_t34_85', 'KPA 105th Armored Div T-34/85 Plt (裝甲突擊排)', 'enemy', 'era3', { x: 9100, y: 4700 }),
      createGroundUnit('opfor-cont-flak-1', 'opfor_s60_flak', 'OPFOR 24th AAA Regt S-60 Btry (57mm雷達防砲連)', 'enemy', 'era3', { x: 9400, y: 4500 })
    );
  } else {
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
      }
    );

    // 3. 大陸主戰線上的 OPFOR 守備與反撲部隊 (北越人民軍與特工隊)
    groundUnits.push(
      createGroundUnit('opfor-cont-inf-1', 'opfor_vietnam_sapper', 'PAVN 320th Div Sapper Plt (北越特工突擊第1排)', 'enemy', 'era4', { x: 8600, y: 5200 }),
      createGroundUnit('opfor-cont-inf-2', 'opfor_vietnam_sapper', 'PAVN 320th Div Sapper Plt (北越特工突擊第2排)', 'enemy', 'era4', { x: 8800, y: 5000 }),
      createGroundUnit('opfor-cont-patrol-1', 'opfor_vietnam_sapper', 'PAVN 66th Regt Recon Plt (北越深入偵察特工巡邏隊)', 'enemy', 'era4', { x: 8300, y: 5800 }),
      createGroundUnit('opfor-cont-patrol-2', 'opfor_vietnam_sapper', 'PAVN Border Sapper Squad (北越前線工兵滲透排)', 'enemy', 'era4', { x: 7900, y: 6300 }),
      createGroundUnit('opfor-cont-tank-1', 'opfor_t54_tank', 'PAVN 203rd Armored Regt T-54 Plt (T-54主力戰車排)', 'enemy', 'era4', { x: 9100, y: 4700 }),
      createGroundUnit('opfor-cont-pt76-1', 'opfor_pt76_amphib', 'PAVN 198th Amphibious Plt (PT-76兩棲戰車排)', 'enemy', 'era4', { x: 8900, y: 5400 }),
      createGroundUnit('opfor-cont-mortar-1', 'opfor_mortar_platoon', 'PAVN 120mm Heavy Mortar Btry (北越120mm重迫擊砲連)', 'enemy', 'era4', { x: 9300, y: 4900 }),
      createGroundUnit('opfor-cont-flak-1', 'opfor_zsu23_shilka', 'PAVN 367th AAA Regt Shilka (ZSU-23-4雷達防砲連)', 'enemy', 'era4', { x: 9400, y: 4500 })
    );
  }

  // 敵軍機動地面部隊 (OPFOR Mobile Ground Units) - 常駐要塞與機場島嶼，執行巡邏與防守反突擊
  for (let i = 1; i < islands.length; i++) {
    const isl = islands[i];
    if (isl.id === 'island-mainland') continue; // 大陸已專門配置戰線部隊
    const center = isl.center;
    const islShortName = isl.name.split(' ')[0] || `島嶼#${i}`;

    // 每個要塞島嶼部署守備步兵部隊
    const infType: GroundUnitType =
      era === 'era1'
        ? 'opfor_infantry_42'
        : era === 'era2'
        ? 'opfor_infantry_45'
        : era === 'era3'
        ? 'opfor_coldwar_infantry'
        : 'opfor_vietnam_sapper';
    const infName =
      era === 'era1'
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
        era === 'era3' ? (i % 2 === 0 ? 'opfor_t34_85' : 'opfor_is3_heavy') : era === 'era2' ? 'opfor_type97_tank' : 'opfor_type95_tank';
      const tankName =
        era === 'era3' ? (i % 2 === 0 ? 'T-34/85 突擊戰車排' : 'IS-3 重戰車排') : era === 'era2' ? '九七式改中戰車排' : '九五式輕戰車機動小隊';
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

      // 迫擊砲排 / S-60 雷達防空砲連
      groundUnits.push(
        createGroundUnit(
          `opfor-mortar-${i}`,
          era === 'era3' ? 'opfor_s60_flak' : 'opfor_mortar_platoon',
          era === 'era3' ? `${islShortName} · S-60 57mm雷達防空砲連` : `${islShortName} · 九七式81mm迫擊砲排`,
          'enemy',
          era,
          { x: center.x - 20, y: center.y - 50 }
        )
      );

      if (era === 'era3' || era === 'era2' || i <= 2) {
        groundUnits.push(
          createGroundUnit(
            `opfor-art-${i}`,
            era === 'era3' ? 'opfor_ks19_heavy' : 'opfor_field_artillery',
            era === 'era3' ? `${islShortName} · KS-19 100mm重高射砲連` : `${islShortName} · 機動野戰重砲隊`,
            'enemy',
            era,
            { x: center.x + 15, y: center.y + 70 }
          )
        );
      }
    }
  }

  const cvPos: Vector2D = { ...playerSpawn };
  const initialHeading = -Math.PI / 4; // Heading 045° (North-East)

  const playerShips: Ship[] = [];

  // 初始兩棲登陸船團 (停靠於後方基地岸邊)
  if (era === 'era4') {
    playerShips.push(
      createLCM8('player-lcm-1', 'LCM-8 重型機械化登陸艇 (Mike-1)', { x: 2360, y: 12150 }),
      createLCM8('player-lcm-2', 'LCM-8 重型機械化登陸艇 (Mike-2)', { x: 2420, y: 12220 }),
      createLST('player-lst-1', 'LST-1179 紐波特級戰車登陸艦', { x: 2500, y: 12320 }, era)
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

  if (era === 'era1') {
    // ═══════════════════════════════════════════════════════════════════════
    // ERA 1 (1942): US NAVY TASK FORCE 16 / 61 (美國海軍第16/61特遣艦隊)
    // 旗艦: USS Enterprise (CV-6)
    // 護航重巡洋艦: USS San Francisco (CA-38), USS Portland (CA-33)
    // 防空巡洋艦: USS Atlanta (CL-51, 16門 5"/38 DP!)
    // 驅逐艦幕: USS Fletcher (DD-445), USS Radford (DD-446), USS O'Bannon (DD-450)
    // 艦載機編制: F4F Wildcat, SBD Dauntless, TBD Devastator, OS2U Kingfisher
    // ═══════════════════════════════════════════════════════════════════════
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
          ready: { f4f: 8, sbd: 8, tbd: 6, os2u: 2 },
          hangar: { f4f: 12, sbd: 12, tbd: 8, os2u: 2 },
          maxPerType: { f4f: 14, sbd: 14, tbd: 8, os2u: 2 },
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
          createTurret(4, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, initialHeading, 65),
          createTurret(-4, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, initialHeading, 65),
          createTurret(4, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, initialHeading, 65),
          createTurret(-4, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, initialHeading, 65),
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
          createTurret(5, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, initialHeading, 60),
          createTurret(-5, -8, '5-inch/25 AA (右舷高射砲)', 950, 2.6, 1, initialHeading, 60),
          createTurret(5, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, initialHeading, 60),
          createTurret(-5, 8, '5-inch/25 AA (左舷高射砲)', 950, 2.6, 1, initialHeading, 60),
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
          createTurret(28, 0, '5-inch/38 Mk 29 Twin DP (No.1 艦艏雙聯)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(18, 0, '5-inch/38 Mk 29 Twin DP (No.2 背負雙聯)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(8, 0, '5-inch/38 Mk 29 Twin DP (No.3 三層背負)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(-8, 0, '5-inch/38 Mk 29 Twin DP (No.4 三層背負後)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(-18, 0, '5-inch/38 Mk 29 Twin DP (No.5 背負雙聯後)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(-28, 0, '5-inch/38 Mk 29 Twin DP (No.6 艦艉雙聯)', 1100, 2.2, 2, initialHeading, 80),
          createTurret(0, -7, '5-inch/38 Twin (右舷翼砲)', 1050, 2.2, 2, initialHeading, 80),
          createTurret(0, 7, '5-inch/38 Twin (左舷翼砲)', 1050, 2.2, 2, initialHeading, 80),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1050, 2.4, 1, initialHeading, 70),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1050, 2.4, 1, initialHeading, 70),
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
  } else if (era === 'era2') {
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
          createTurret(24, -9, '5-inch/38 Mk 32 Twin DP (艦橋前雙聯)', 1100, 2.3, 2, initialHeading, 75),
          createTurret(14, -9, '5-inch/38 Mk 32 Twin DP (艦橋前背負雙聯)', 1100, 2.3, 2, initialHeading, 75),
          createTurret(-14, -9, '5-inch/38 Mk 32 Twin DP (艦橋後雙聯)', 1100, 2.3, 2, initialHeading, 75),
          createTurret(-24, -9, '5-inch/38 Mk 32 Twin DP (艦橋後背負雙聯)', 1100, 2.3, 2, initialHeading, 75),
          createTurret(26, 11, '5-inch/38 Mk 12 Single DP (左舷前單裝)', 1050, 2.4, 1, initialHeading, 65),
          createTurret(16, 11, '5-inch/38 Mk 12 Single DP (左舷前單裝)', 1050, 2.4, 1, initialHeading, 65),
          createTurret(-16, 11, '5-inch/38 Mk 12 Single DP (左舷後單裝)', 1050, 2.4, 1, initialHeading, 65),
          createTurret(-26, 11, '5-inch/38 Mk 12 Single DP (左舷後單裝)', 1050, 2.4, 1, initialHeading, 65),
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
          createTurret(8, -12, '5-inch/38 Mk 28 Twin (右舷前高平砲)', 1150, 2.2, 2, initialHeading, 75),
          createTurret(-4, -12, '5-inch/38 Mk 28 Twin (右舷中高平砲)', 1150, 2.2, 2, initialHeading, 75),
          createTurret(-16, -12, '5-inch/38 Mk 28 Twin (右舷後高平砲)', 1150, 2.2, 2, initialHeading, 75),
          createTurret(8, 12, '5-inch/38 Mk 28 Twin (左舷前高平砲)', 1150, 2.2, 2, initialHeading, 75),
          createTurret(-4, 12, '5-inch/38 Mk 28 Twin (左舷中高平砲)', 1150, 2.2, 2, initialHeading, 75),
          createTurret(-16, 12, '5-inch/38 Mk 28 Twin (左舷後高平砲)', 1150, 2.2, 2, initialHeading, 75),
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
          createTurret(0, -8, '5-inch/38 Twin DP (右舷高平砲)', 1100, 2.2, 2, initialHeading, 75),
          createTurret(0, 8, '5-inch/38 Twin DP (左舷高平砲)', 1100, 2.2, 2, initialHeading, 75),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1080, 2.2, 1, initialHeading, 75),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, initialHeading, 75),
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
          createTurret(-2, 0, '5-inch/38 Mk 12 (No.53 舯部單裝)', 1080, 2.2, 1, initialHeading, 75),
          createTurret(-14, 0, '5-inch/38 Mk 12 (No.54 背負單裝)', 1080, 2.2, 1, initialHeading, 75),
          createTurret(-22, 0, '5-inch/38 Mk 12 (No.55 艦艉單裝)', 1080, 2.2, 1, initialHeading, 75),
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
  } else if (era === 'era3') {
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
          createTurret(24, -10, '5-inch/54 Mk 16 Rapid DP (右舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(14, -10, '5-inch/54 Mk 16 Rapid DP (右舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(-14, -10, '5-inch/54 Mk 16 Rapid DP (右舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(-24, -10, '5-inch/54 Mk 16 Rapid DP (右舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(24, 10, '5-inch/54 Mk 16 Rapid DP (左舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(14, 10, '5-inch/54 Mk 16 Rapid DP (左舷前單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(-14, 10, '5-inch/54 Mk 16 Rapid DP (左舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
          createTurret(-24, 10, '5-inch/54 Mk 16 Rapid DP (左舷後單裝)', 1250, 2.0, 1, initialHeading, 80),
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
          createTurret(12, -10, '5-inch/38 Twin Mk 28 (右舷高平砲)', 1150, 2.2, 2, initialHeading, 80),
          createTurret(-2, -10, '5-inch/38 Twin Mk 28 (右舷高平砲)', 1150, 2.2, 2, initialHeading, 80),
          createTurret(12, 10, '5-inch/38 Twin Mk 28 (左舷高平砲)', 1150, 2.2, 2, initialHeading, 80),
          createTurret(-2, 10, '5-inch/38 Twin Mk 28 (左舷高平砲)', 1150, 2.2, 2, initialHeading, 80),
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
  } else {
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
      createLPHIwoJima('player-lph1', 'USS Iwo Jima (LPH-2)', { x: cvPos.x - 300, y: cvPos.y - 140 })
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 敵方主力艦隊 (OPFOR TASK FORCE BASED ON HISTORICAL COMBAT OPPONENTS)
  // ═══════════════════════════════════════════════════════════════════════
  const enemyShips: Ship[] = [];
  const enemyCenter: Vector2D =
    era === 'era3' || era === 'era4'
      ? { x: 3600, y: 1600 }
      : { x: 11400, y: 2600 };
  const enemyHeading =
    era === 'era3' || era === 'era4'
      ? Math.PI * 0.45 // Heading Southeast into the gulf/strait
      : (Math.PI * 3) / 4; // Heading 225° (South-West)

  if (era === 'era1') {
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
          createTurret(26, -10, '127mm Twin Type 89 (右舷前高角砲)', 950, 3.0, 2, enemyHeading, 65),
          createTurret(10, -10, '127mm Twin Type 89 (右舷中高角砲)', 950, 3.0, 2, enemyHeading, 65),
          createTurret(-24, -10, '127mm Twin Type 89 (右舷後高角砲)', 950, 3.0, 2, enemyHeading, 65),
          createTurret(26, 10, '127mm Twin Type 89 (左舷前高角砲)', 950, 3.0, 2, enemyHeading, 65),
          createTurret(10, 10, '127mm Twin Type 89 (左舷中高角砲)', 950, 3.0, 2, enemyHeading, 65),
          createTurret(-24, 10, '127mm Twin Type 89 (左舷後高角砲)', 950, 3.0, 2, enemyHeading, 65),
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
          createTurret(6, -10, '152mm Single (右舷副砲)', 1100, 3.2, 1, enemyHeading, 80),
          createTurret(-6, -10, '152mm Single (右舷副砲)', 1100, 3.2, 1, enemyHeading, 80),
          createTurret(6, 10, '152mm Single (左舷副砲)', 1100, 3.2, 1, enemyHeading, 80),
          createTurret(-6, 10, '152mm Single (左舷副砲)', 1100, 3.2, 1, enemyHeading, 80),
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
  } else if (era === 'era2') {
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
          createTurret(4, -14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
          createTurret(-4, -14, '127mm Twin AA (右舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
          createTurret(4, 14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
          createTurret(-4, 14, '127mm Twin AA (左舷高角砲)', 1080, 2.5, 2, enemyHeading, 70),
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
          createTurret(-16, 0, '152mm Twin Type 41 (No.2 艦艉雙聯)', 1200, 3.8, 2, enemyHeading, 100),
          createTurret(-25, 0, '152mm Twin Type 41 (No.3 背負雙聯)', 1200, 3.8, 2, enemyHeading, 100),
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
  } else if (era === 'era3') {
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
          createTurret(6, -9, '100mm Twin SM-5-1 (右舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
          createTurret(-6, -9, '100mm Twin SM-5-1 (右舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
          createTurret(6, 9, '100mm Twin SM-5-1 (左舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
          createTurret(-6, 9, '100mm Twin SM-5-1 (左舷副砲)', 1200, 1.8, 2, enemyHeading, 70),
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
      createFoxtrotSS('enemy-foxtrot-1', 'Project 641 Foxtrot (B-427)', { x: 3200, y: 3800 })
    );
  }

  const briefingName =
    era === 'era4'
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
          : 'Gulf of Tonkin & Yankee Station 1965-1973 (越戰北部灣特遣隊)',
      briefing:
        era === 'era1'
          ? '【1942 瓜達爾卡納爾戰役】美軍第16/61特遣艦隊 (USS Enterprise CV-6, San Francisco, Atlanta) 奉命進入鐵底灣與所羅門群島海域，尋殲日軍南雲第一航空艦隊 (翔鶴、比叡、鳥海、秋月) 與摧毀島嶼要塞防線！'
          : era === 'era2'
          ? '【1944~1945 雷伊泰灣與沖繩特攻戰役】第38/58快速航母特遣艦隊 (USS Essex CV-9, Missouri BB-63, Cleveland, Johnston) 迎戰栗田艦隊主力 (大和、大鳳、金剛、島風)！請務必警戒日軍神風特攻機群與一式陸攻掛載之櫻花火箭反艦飛彈！'
          : era === 'era3'
          ? '【1950~1953 韓戰與遠東冷戰戰役】美海軍第77特遣艦隊 (USS Oriskany CV-34 SCB-27A, USS Missouri BB-63, Des Moines, Gearing) 進駐元山與日本海戰區！全面出動 F9F 黑豹、F2H 女妖噴射機、AD-1 天襲者、AD-3W 全域空中預警機與 HO3S-1 搜救直升機。假想敵冷戰遠東聯軍集結 MiG-15 噴射機、Tu-14 噴射轟炸機、53式魚雷快艇群與 T-34/85、IS-3 重戰車堅固防線！'
          : '【1965~1973 越戰與北部灣特遣作戰】美海軍第77特遣艦隊旗艦小鷹號超級航艦 (CV-63 USS Kitty Hawk)、貝爾納普號飛彈巡洋艦 (CG-26)、查爾斯·亞當斯號飛彈驅逐艦 (DDG-2) 與硫磺島號兩棲突擊艦 (LPH-2) 駛入北部灣洋基站！全域實裝超音速噴射打擊群 (F-4B/J, F-8, A-6, A-4, B-52, F-105)、空空/空艦/反輻射導引飛彈系統與直升機立體垂直包圍！全面壓制北越 SA-2 導針防空飛彈營、扇歌射控雷達與冥河反艦飛彈快艇！',
      primaryObjective:
        era === 'era1'
          ? '擊沉日軍正規航母翔鶴號與護衛主力艦，摧毀島嶼核心設施'
          : era === 'era2'
          ? '擊沉超級戰艦大和號與大鳳號，殲滅敵神風特攻機隊與櫻花火箭威脅'
          : era === 'era3'
          ? '擊沉敵斯維爾德洛夫級巡洋艦與快艇群，擊落 MiG-15 噴射機隊，奪佔灘頭戰略要塞'
          : '壓制敵 SA-2 地空飛彈發射營與扇歌雷達陣地，擊沉冥河飛彈快艇群與巡防艦，奪佔陸上戰略制高點',
      secondaryObjective:
        era === 'era1'
          ? '維持企業號航母血量高於 65%，擊墜 15 架以上敵機'
          : era === 'era2'
          ? '阻截所有來襲之一式陸攻與櫻花火箭特攻機，確保艦隊主力零直擊'
          : era === 'era3'
          ? '保持 AD-3W 預警機空中導引，出動 HO3S-1 直升機成功搜救所有落海飛行員'
          : '使用野鼬機與 AGM-45 反輻射飛彈癱瘓防空網，出動直升機垂直突擊部隊搶佔內陸陣地',
    },
  };
}

function createShip(
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
    weaponControlHealth: partial.weaponControlHealth ?? partial.health,
    maxWeaponControlHealth: partial.maxWeaponControlHealth ?? partial.maxHealth,
    hullCrewHealth: partial.hullCrewHealth ?? partial.health,
    maxHullCrewHealth: partial.maxHullCrewHealth ?? partial.maxHealth,
    ...partial,
  };
}

function createTurret(
  relX: number,
  relY: number,
  caliber: string,
  range: number,
  reloadTime: number,
  barrelCount: number,
  initialAngle: number,
  damage: number
): Turret {
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
