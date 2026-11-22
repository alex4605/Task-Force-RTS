import { AircraftModel, Era, Projectile, Ship } from '../types/game';

/**
 * Electronic warfare: what each platform carried (ESM receivers, jammers, chaff and flare
 * dispensers, ship decoy launchers, torpedo noisemakers, submarine simulators) and how each
 * missile and torpedo seeker stood up to them (ECCM). The engine uses these tables for the
 * decoys it deploys, the seeker rolls against them, jamming and ESM intercepts.
 *
 * Figures follow the historical equipment: an F-4J's ALE-29 held 30 cartridges, an F/A-18's
 * ALE-39 60, an F-16's ALE-40 30 chaff + 30 flares, a Su-27's APP-50 96 rounds, an A-10's sixteen
 * ALE-40 modules 480; a Ticonderoga's four Mk 36 SRBOC launchers 24 ready rounds. Seeker
 * resistance tracks the generations: an AIM-9B, a K-13 or an SA-7 took almost any flare, an
 * AIM-9L or an R-73 rejected most; a Styx was easily seduced by chaff (Latakia and Baltim, 1973),
 * a P-700 much less; a 53-65K wake homer ignored acoustic decoys altogether.
 */

// ── Seekers ──────────────────────────────────────────────────────────────────

export type SeekerBand = 'ir' | 'radar' | 'arm' | 'laser' | 'tv' | 'acoustic' | 'wake';

export interface SeekerProfile {
  name: string;
  band: SeekerBand;
  /** Resistance to chaff, jamming and acoustic decoys, 0 (none) … 1 (immune). */
  eccm: number;
  /** Flare rejection of an IR seeker, 0 … 1. */
  irccm: number;
  /** Homes on a jamming source: self-protection jamming does not break its lock. */
  hoj: boolean;
  /** Half-angle of the seeker's field of view (rad). */
  fov: number;
}

const has = (s: string | undefined, ...keys: string[]) => !!s && keys.some((k) => s.includes(k));

export function seekerProfile(p: Projectile, era: Era): SeekerProfile {
  const att = p.attackerName ?? '';
  const g = p.guidanceType;
  // Torpedoes
  if (p.type === 'torpedo') {
    if (p.wakeHoming || has(att, '尾流', '53-65')) return { name: '53-65K 尾流自導', band: 'wake', eccm: 1, irccm: 0, hoj: false, fov: 0.6 };
    const eccm = era === 'era5' ? (p.side === 'enemy' ? 0.35 : has(att, 'Mk 48', 'ADCAP') ? 0.6 : 0.5) : era === 'era4' ? 0.25 : era === 'era3' ? 0.1 : 0;
    const enemy = p.side === 'enemy';
    const name =
      era === 'era5'
        ? enemy ? 'SET-65 / USET-80 聲導' : 'Mk 46 Mod 5 / Mk 48 聲導'
        : era === 'era4'
        ? enemy ? 'SET-53 / SAET-60 聲導' : 'Mk 44 / Mk 46 Mod 0 聲導'
        : enemy ? 'SET-53 聲導' : 'Mk 24 FIDO / Mk 32 聲導';
    return { name, band: 'acoustic', eccm, irccm: 0, hoj: false, fov: 0.8 };
  }
  // Anti-ship missiles: by variant
  if (p.ashmVariant) {
    const v = p.ashmVariant;
    const t: Record<string, [string, number]> = {
      p15_styx: ['P-15 冥河 (單脈衝前雷達)', 0.05],
      ksr5_kelt: ['KSR-5 (AS-6) 主動雷達', 0.15],
      kh22_burya: ['Kh-22 風暴 主動雷達', 0.3],
      exocet_mm38: ['MM38 飛魚 ADAC 尋標', 0.3],
      exocet_mm40: ['MM40 飛魚 Super ADAC', 0.38],
      harpoon_rgm84: ['RGM-84 魚叉 PR-53/DSQ-28', 0.42],
      harpoon_ugm84: ['UGM-84 魚叉', 0.42],
      harpoon_agm84: ['AGM-84 魚叉', 0.42],
      p270_moskit: ['P-270 白蛉 ARGS-27', 0.5],
      p700_granit: ['P-700 花崗岩 (資料鏈協同)', 0.58],
      p500_bazalt: ['P-500 玄武岩 (資料鏈協同)', 0.5],
    };
    const [name, e] = t[v] ?? ['反艦飛彈主動雷達', 0.3];
    return { name, band: 'radar', eccm: p.datalinkLost ? e * 0.5 : e, irccm: 0, hoj: v === 'p700_granit' || v === 'p500_bazalt', fov: 0.5 };
  }
  // Rocket-delivered ASW torpedoes in their air stage: no seeker to fool until they enter the water
  if (p.isASROC) return { name: 'ASROC / Ikara / Malafon 火箭助飛段', band: 'tv', eccm: 1, irccm: 1, hoj: false, fov: 0.3 };
  if (has(att, 'BGM-109', 'UGM-109', '戰斧', 'Tomahawk')) return { name: 'BGM-109 戰斧 (TERCOM / DSMAC)', band: 'tv', eccm: 1, irccm: 1, hoj: false, fov: 0.3 };
  if (g === 'laser') {
    const wire = has(att, 'TOW', '拖式', 'MILAN', 'Konkurs', '競賽', '龍式', 'Dragon', 'Malyutka', '嬰兒', 'HOT', 'Shturm', '突擊', 'Kobra', '9M112', 'Refleks', '9M119', 'Svir');
    return { name: wire ? 'SACLOS 線導/指令反戰車飛彈' : '雷射導引', band: 'laser', eccm: 1, irccm: 1, hoj: false, fov: 0.3 };
  }
  if (g === 'tv') return { name: '電視導引', band: 'tv', eccm: 1, irccm: 0.6, hoj: false, fov: 0.3 };
  if (g === 'anti_radiation' || g === 'passive_radar_arm') {
    return { name: has(att, 'HARM', 'AGM-88') ? 'AGM-88 HARM' : has(att, 'Kh-31', 'Kh-58') ? 'Kh-31P / Kh-58 反輻射' : 'AGM-45 百舌鳥', band: 'arm', eccm: 0.5, irccm: 0, hoj: true, fov: 0.6 };
  }
  // IR: AAMs and SAMs / MANPADs
  if (g === 'ir' || g === 'infrared') {
    let name = 'AIM-9B / K-13 早期紅外';
    let irccm = 0.05;
    if (has(att, 'SA-7', 'Strela-2', '箭-2', '9K32', 'Redeye', '紅眼')) [name, irccm] = ['9K32 箭-2 / 紅眼 (未冷卻 PbS)', 0];
    else if (has(att, 'Stinger', '刺針')) [name, irccm] = ['FIM-92 刺針 (POST 雙色)', 0.5];
    else if (has(att, 'Igla', '針', 'SA-14', 'SA-16', 'Strela-3')) [name, irccm] = ['9K38 針式 / 箭-3 (冷卻尋標)', 0.35];
    else if (has(att, 'Strela-1', 'SA-9', '箭-1')) [name, irccm] = ['9K31 箭-1 (SA-9 未冷卻 PbS)', 0];
    else if (has(att, 'Chaparral', '榭樹', 'MIM-72')) [name, irccm] = ['MIM-72 榭樹', era === 'era5' ? 0.3 : 0.1];
    else if (has(att, 'Strela-10', 'SA-13', '箭-10')) [name, irccm] = ['9K35 箭-10 (SA-13 雙頻)', 0.35];
    else if (has(att, 'R-73', 'AA-11')) [name, irccm] = ['R-73 (AA-11 射手)', 0.55];
    else if (has(att, 'R-60', 'AA-8')) [name, irccm] = ['R-60 (AA-8 蚜蟲)', 0.25];
    else if (has(att, 'AIM-9L', 'AIM-9M', '9L', '9M')) [name, irccm] = ['AIM-9L/M 全向紅外', 0.5];
    else if (era === 'era5') [name, irccm] = p.side === 'enemy' ? ['R-60 / R-73 紅外', 0.42] : ['AIM-9L/M 全向紅外', 0.5];
    else if (era === 'era4') [name, irccm] = p.side === 'enemy' ? ['K-13 (AA-2 環礁)', 0.05] : ['AIM-9D/G 響尾蛇', 0.15];
    return { name, band: 'ir', eccm: 1, irccm, hoj: false, fov: 0.6 };
  }
  // Radar-guided SAMs and AAMs
  let name = '雷達導引飛彈';
  let eccm = 0.3;
  let hoj = false;
  if (has(att, '愛國者', 'Patriot')) [name, eccm, hoj] = ['MIM-104 愛國者 TVM', 0.68, true];
  else if (has(att, 'S-300', '48N6', '5V55', '堡壘', 'Fort')) [name, eccm, hoj] = ['S-300 TVM', 0.66, true];
  else if (has(att, 'SA-2', 'S-75', '導針', 'Guideline', 'Fan Song', '扇歌')) [name, eccm] = ['SA-2 導針 (扇歌 指令導引)', 0.1];
  else if (has(att, 'SA-3', 'S-125', '涅瓦', 'Goa')) [name, eccm] = ['SA-3 (低打 指令導引)', 0.22];
  else if (has(att, 'Kub', 'SA-6', '增益', '立方體')) [name, eccm] = ['2K12 Kub (SA-6 連續波半主動)', 0.42];
  else if (has(att, 'Tor-M', 'Tor (', 'SA-15', '道爾')) [name, eccm] = ['9K330 Tor (SA-15 相控陣指令)', 0.62];
  else if (has(att, 'Buk', 'SA-11', '山毛櫸')) [name, eccm] = ['9K37 Buk (SA-11 半主動)', 0.55];
  else if (has(att, 'Osa', 'SA-8', '黃蜂')) [name, eccm] = ['9K33 Osa (SA-8 指令/光學)', 0.45];
  else if (has(att, 'Sea Cat', '海貓')) [name, eccm] = ['Sea Cat (目視指令導引)', 0.85];
  else if (has(att, 'Sea Slug', '海蛞蝓')) [name, eccm] = ['Sea Slug (雷達波束駕束)', 0.3];
  else if (has(att, 'SA-N-3', 'Goblet', '戈布勒', 'M-11')) [name, eccm] = ['M-11 Shtorm (SA-N-3 戈布勒)', 0.35];
  else if (has(att, 'Hawk', '霍克', '鷹式')) [name, eccm] = ['MIM-23 霍克 半主動', era === 'era5' ? 0.45 : 0.3];
  else if (has(att, 'SM-2', '神盾', 'Standard', 'SM-1', 'Terrier', 'Tartar', '韃靼', '小獵犬')) [name, eccm, hoj] = era === 'era5' ? ['SM-2 / SM-1 標準', 0.55, true] : ['小獵犬 / 韃靼', 0.25, false];
  else if (has(att, 'Sea Dart', '海標槍')) [name, eccm] = ['海標槍', 0.4];
  else if (has(att, '海麻雀', 'Sea Sparrow', 'RIM-7')) [name, eccm, hoj] = ['RIM-7 海麻雀', 0.4, true];
  else if (has(att, 'Sea Wolf', 'Crotale', 'Kinzhal', '匕首', 'Shtil', '施基利', 'Volna', '波浪', 'Shtorm', '風暴', 'Osa-M')) [name, eccm] = ['艦載指令/半主動防空飛彈', 0.4];
  else if (has(att, 'Tunguska', '通古斯卡')) [name, eccm] = ['9M311 通古斯卡 (無線電指令)', 0.45];
  else if (has(att, 'AIM-54', '鳳凰', 'Phoenix')) [name, eccm, hoj] = ['AIM-54 鳳凰', 0.48, true];
  else if (has(att, 'R-33', 'R-27', 'R-23', 'R-24')) [name, eccm, hoj] = ['R-27 / R-23 半主動', 0.38, true];
  else if (p.type === 'missile_aam') {
    if (era === 'era5') [name, eccm, hoj] = p.side === 'enemy' ? ['R-27R / R-23R 半主動', 0.38, true] : ['AIM-7F/M 麻雀 (單脈衝)', 0.55, true];
    else [name, eccm, hoj] = p.side === 'enemy' ? ['RS-2US (AA-1)', 0.05, false] : ['AIM-7E 麻雀', 0.12, false];
  } else if (p.type === 'missile_sam') {
    eccm = era === 'era5' ? 0.45 : 0.2;
  }
  return { name, band: g === 'command_radar' || g === 'radio' ? 'radar' : 'radar', eccm, irccm: 0, hoj, fov: 0.7 };
}

// ── Aircraft suites ───────────────────────────────────────────────────────────

export interface AircraftEw {
  dispenser?: string;
  chaff: number;
  flares: number;
  /** Cartridges per dispense program. */
  salvo: number;
  jammer?: { name: string; power: number; standoff?: boolean };
  /** IR jammer (ALQ-144 "disco ball", L-166 Lipa) against early IR seekers. */
  irJammer?: { name: string; power: number };
  rwr?: string;
  /** ESM receiver: intercept range as a multiple of the emitter's radar range. */
  esm?: { name: string; factor: number };
  /** Missile approach warning (UV/IR): flares go out on time even against a silent IR shot. */
  maws?: boolean;
}

/** A fit row; `eras` limits it to the years it was carried (default: Vietnam onward). */
type Row = Partial<AircraftEw> & { chaff?: number; flares?: number; eras?: Era[] };
const WW2: Era[] = ['era2'];
const KOREA: Era[] = ['era3'];
const ALE29 = 'AN/ALE-29 箔條/熱焰彈投放器';
const ALE39 = 'AN/ALE-39 投放器 (60 發)';
const ALE40 = 'AN/ALE-40 投放器';
const M130 = 'M130 熱焰彈投放器';

const AIR_EW: Partial<Record<AircraftModel, Row>> = {
  // Era 2–3: "Window"/"Rope" chaff and Carpet jammers over Japan and Korea; the IJN's own
  // 欺瞞紙 (gimanshi) chaff on night torpedo raids; APR-1 intercept receivers on Black Cats
  b29: { dispenser: '"Rope" / "Window" 箔條束', chaff: 160, flares: 0, salvo: 8, jammer: { name: 'AN/APQ-2/-9 "Carpet" 干擾機', power: 0.35 }, eras: ['era2', 'era3'] },
  b24: { dispenser: '"Window" 箔條束', chaff: 80, flares: 0, salvo: 6, eras: WW2 },
  b17_late: { dispenser: '"Window" 箔條束', chaff: 48, flares: 0, salvo: 6, eras: WW2 },
  lancaster: { dispenser: '"Window" 箔條束', chaff: 120, flares: 0, salvo: 8, jammer: { name: '"Mandrel" 干擾機', power: 0.25 }, eras: WW2 },
  g4m: { dispenser: '欺瞞紙 (錫箔箔條)', chaff: 24, flares: 0, salvo: 4, eras: WW2 },
  jill: { dispenser: '欺瞞紙 (錫箔箔條)', chaff: 12, flares: 0, salvo: 3, eras: WW2 },
  pby: { esm: { name: 'AN/APR-1 雷達截收機 (黑貓)', factor: 1.3 }, eras: WW2 },
  af_guardian: { esm: { name: 'AN/APR-9 截收機 (AF-2W 獵手)', factor: 1.3 }, eras: KOREA },
  // Era 4 (Vietnam)
  f4b: { dispenser: ALE29, chaff: 20, flares: 10, salvo: 2, jammer: { name: 'AN/ALQ-51 欺騙干擾', power: 0.3 }, rwr: 'AN/APR-25/27' },
  f4j: { dispenser: ALE29, chaff: 20, flares: 10, salvo: 2, jammer: { name: 'AN/ALQ-100 欺騙干擾', power: 0.35 }, rwr: 'AN/APR-25/27' },
  f4e: { dispenser: 'AN/ALE-38 箔條莢艙', chaff: 24, flares: 8, salvo: 2, jammer: { name: 'AN/ALQ-87 / ALQ-119 干擾莢艙', power: 0.45 }, rwr: 'AN/APR-36/37' },
  f105: { dispenser: 'AN/ALE-2 箔條莢艙', chaff: 20, flares: 0, salvo: 2, jammer: { name: 'QRC-160 (AN/ALQ-71) 干擾莢艙', power: 0.45 }, rwr: 'AN/APR-25' },
  a4: { dispenser: ALE29, chaff: 15, flares: 15, salvo: 2, jammer: { name: 'AN/ALQ-51 欺騙干擾', power: 0.3 }, rwr: 'AN/APR-25' },
  a6a: { dispenser: ALE29, chaff: 20, flares: 10, salvo: 2, jammer: { name: 'AN/ALQ-41/100', power: 0.35 }, rwr: 'AN/APR-25/27' },
  a6b_weasel: { dispenser: ALE29, chaff: 20, flares: 10, salvo: 2, jammer: { name: 'AN/ALQ-100', power: 0.35 }, rwr: 'AN/APR-25', esm: { name: 'AN/APS-107 雷達尋向接收機', factor: 1.8 } },
  a7: { dispenser: ALE29, chaff: 20, flares: 10, salvo: 2, jammer: { name: 'AN/ALQ-100', power: 0.35 }, rwr: 'AN/APR-25/27' },
  b52: { dispenser: 'AN/ALE-24 箔條 / ALE-20 熱焰', chaff: 240, flares: 48, salvo: 8, jammer: { name: 'Phase VI ECM (ALT-28 / ALQ-117)', power: 0.85 }, rwr: 'AN/APR-25' },
  uh1: { dispenser: M130, chaff: 0, flares: 30, salvo: 2 },
  ah1: { dispenser: M130, chaff: 0, flares: 30, salvo: 2 },
  ac47: { dispenser: '手拋 Mk 24 照明/誘餌彈', chaff: 0, flares: 24, salvo: 2 },
  tu16: { dispenser: 'ASO-16 箔條投放器', chaff: 48, flares: 0, salvo: 4, jammer: { name: 'SPS-5 Fasol 干擾機', power: 0.4 } },
  // Vietnam-era radar homing and warning receivers without dispensers
  f100: { rwr: 'AN/APR-25 RHAW', eras: ['era4'] },
  f104g: { rwr: 'AN/APR-25 RHAW', eras: ['era4'] },
  mig17: { rwr: 'Sirena-2 警報器', eras: ['era4'] },
  mig19: { rwr: 'Sirena-2 警報器', eras: ['era4'] },
  su7: { rwr: 'Sirena-2 警報器' },
  il28: { rwr: 'Sirena-2 警報器', eras: ['era4'] },
  // Era 5
  f14a: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-100/126 欺騙干擾', power: 0.45 }, rwr: 'AN/ALR-45/67' },
  fa18a: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-126B 欺騙干擾', power: 0.5 }, rwr: 'AN/ALR-67' },
  f15a: { dispenser: 'AN/ALE-45 投放器', chaff: 30, flares: 30, salvo: 2, jammer: { name: 'TEWS AN/ALQ-135 內建干擾', power: 0.55 }, rwr: 'AN/ALR-56' },
  f16a: { dispenser: ALE40, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-131 干擾莢艙', power: 0.5 }, rwr: 'AN/ALR-69' },
  a6e: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-126', power: 0.45 }, rwr: 'AN/ALR-67' },
  ea6b: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-99 戰術干擾系統', power: 1, standoff: true }, rwr: 'AN/ALR-67', esm: { name: 'ALQ-99 接收機 (TJS)', factor: 2.2 } },
  e2c: { chaff: 0, flares: 0, salvo: 0, esm: { name: 'AN/ALR-73 被動偵測系統', factor: 2 } },
  e3a: { chaff: 0, flares: 0, salvo: 0, esm: { name: 'ESM 被動偵測', factor: 1.5 } },
  s3a: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, esm: { name: 'AN/ALR-47 ESM', factor: 1.6 } },
  p3: { chaff: 0, flares: 0, salvo: 0, esm: { name: 'AN/ALQ-78 ESM', factor: 1.8 } },
  a10a: { dispenser: '16x AN/ALE-40 (480 發)', chaff: 240, flares: 240, salvo: 4, jammer: { name: 'AN/ALQ-119 / ALQ-131 莢艙', power: 0.45 }, rwr: 'AN/ALR-69' },
  av8b: { dispenser: ALE39, chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-126', power: 0.3 }, rwr: 'AN/ALR-67' },
  f111: { dispenser: 'AN/ALE-28 投放器', chaff: 60, flares: 30, salvo: 3, jammer: { name: 'AN/ALQ-94 / ALQ-137 內建干擾', power: 0.6 }, rwr: 'AN/ALR-62' },
  ah64a: { dispenser: M130, chaff: 30, flares: 30, salvo: 2, irJammer: { name: 'AN/ALQ-144 紅外干擾 (迪斯可球)', power: 0.5 }, maws: true },
  ah1w: { dispenser: M130, chaff: 0, flares: 30, salvo: 2, irJammer: { name: 'AN/ALQ-144', power: 0.5 }, maws: true },
  sh60b: { dispenser: M130, chaff: 30, flares: 30, salvo: 2, irJammer: { name: 'AN/ALQ-144', power: 0.45 }, esm: { name: 'AN/ALQ-142 ESM', factor: 1.5 } },
  sh3f: { dispenser: M130, chaff: 0, flares: 30, salvo: 2 },
  ch53: { dispenser: M130, chaff: 0, flares: 30, salvo: 2, irJammer: { name: 'AN/ALQ-144', power: 0.4 } },
  ch46: { dispenser: M130, chaff: 0, flares: 30, salvo: 2 },
  c130: { dispenser: 'AN/ALE-40 (尾門)', chaff: 30, flares: 60, salvo: 4 },
  tornado_gr1: { dispenser: 'BOZ-107 投放莢艙', chaff: 60, flares: 30, salvo: 3, jammer: { name: 'Sky Shadow 干擾莢艙', power: 0.55 } },
  tornado_ids: { dispenser: 'BOZ-101 投放莢艙', chaff: 60, flares: 30, salvo: 3, jammer: { name: 'Cerberus 干擾莢艙', power: 0.5 } },
  tornado_adv: { dispenser: 'ALE-40', chaff: 30, flares: 30, salvo: 2 },
  mirage2000: { dispenser: 'Spirale (Eclair)', chaff: 112, flares: 16, salvo: 4, jammer: { name: 'Sabre 干擾機', power: 0.5 } },
  jaguar_gr1: { dispenser: 'Phimat 箔條莢艙 / ALE-40', chaff: 30, flares: 15, salvo: 2, jammer: { name: 'ALQ-101 莢艙', power: 0.35 } },
  buccaneer: { dispenser: 'ALE-40', chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-101', power: 0.45 } },
  sea_harrier: { dispenser: 'ALE-40', chaff: 30, flares: 30, salvo: 2 },
  f4f_phantom: { dispenser: 'ALE-40', chaff: 30, flares: 30, salvo: 2, jammer: { name: 'AN/ALQ-131', power: 0.4 } },
  mig29a: { dispenser: '2x BVP-30-26M (60 發)', chaff: 30, flares: 30, salvo: 2, jammer: { name: 'Gardeniya 干擾莢艙', power: 0.45 }, rwr: 'SPO-15 白樺' },
  su27: { dispenser: 'APP-50 (96 發)', chaff: 48, flares: 48, salvo: 2, jammer: { name: 'Sorbtsiya 翼尖干擾莢艙', power: 0.55 }, rwr: 'SPO-15 白樺' },
  mig23: { dispenser: '2x BVP-30-26M', chaff: 30, flares: 30, salvo: 2, jammer: { name: 'SPS-141 Siren 干擾機', power: 0.3 }, rwr: 'SPO-15 白樺' },
  su25: { dispenser: '8x ASO-2V (256 發)', chaff: 64, flares: 192, salvo: 4, jammer: { name: 'SPS-141 Siren', power: 0.3 }, rwr: 'SPO-15 白樺' },
  tu22m3: { dispenser: 'APP-50 箔條/熱焰', chaff: 120, flares: 60, salvo: 4, jammer: { name: 'Ocean 電子對抗系統', power: 0.75 }, rwr: 'Sirena-3' },
  tu95: { dispenser: 'APP-50', chaff: 96, flares: 48, salvo: 4, jammer: { name: 'Buket / Fasol 干擾機', power: 0.6 }, esm: { name: 'Big Bulge 監視 / ESM', factor: 2 } },
  mi24: { dispenser: 'ASO-2V (192 發)', chaff: 0, flares: 192, salvo: 4, irJammer: { name: 'L-166V Lipa 紅外干擾', power: 0.45 } },
  ka27: { dispenser: 'ASO-2V', chaff: 0, flares: 64, salvo: 2 },
  a50: { chaff: 0, flares: 0, salvo: 0, esm: { name: 'Shmel ESM', factor: 1.8 } },
  il38: { chaff: 0, flares: 0, salvo: 0, esm: { name: 'Wet Eye ESM 偵蒐', factor: 1.5 } },
  mig21: { chaff: 0, flares: 0, salvo: 0, rwr: 'SPO-2 警報器' },
  f5a: { dispenser: ALE40, chaff: 30, flares: 15, salvo: 2, rwr: 'AN/ALR-46', eras: ['era5'] },
  yak38: { rwr: 'SPO-10 Sirena-3 警報器', eras: ['era5'] },
};

/** The electronic-warfare fit of an aircraft type in an era (no dispensers before Vietnam). */
const AIR_EW_CACHE = new Map<string, AircraftEw>();

export function aircraftEw(model: AircraftModel, era: Era): AircraftEw {
  const key = `${model}|${era}`;
  let fit = AIR_EW_CACHE.get(key);
  if (!fit) {
    fit = buildAircraftEw(model, era);
    AIR_EW_CACHE.set(key, fit);
  }
  return fit;
}

function buildAircraftEw(model: AircraftModel, era: Era): AircraftEw {
  const row = AIR_EW[model];
  const valid = row && (row.eras ? row.eras.includes(era) : era === 'era4' || era === 'era5');
  if (!row || !valid) return { chaff: 0, flares: 0, salvo: 0 };
  const { eras: _eras, ...fit } = row;
  return { chaff: 0, flares: 0, salvo: 2, ...fit };
}

// ── Ship suites ───────────────────────────────────────────────────────────────

export interface ShipEw {
  esm?: { name: string; factor: number };
  jammer?: { name: string; power: number };
  decoys?: { name: string; chaff: number; ir: number; reload: number };
  noisemaker?: { name: string; count: number; towed: boolean };
  moss?: { name: string; count: number };
}

const isSubType = (t: string) => t === 'submarine' || t === 'ssn_la' || t === 'ssgn_oscar' || t === 'foxtrot';
const SMALL = /^(lcvp|lcm8|lcac|pbr|river_gunboat|patrol_boat|lst|lsm_r)$/;

export function shipEw(ship: Pick<Ship, 'type' | 'side' | 'subVariant'>, era: Era): ShipEw {
  const t = ship.type as string;
  const enemy = ship.side === 'enemy';
  if (SMALL.test(t)) return {};
  if (isSubType(t)) {
    if (era === 'era1') return {};
    if (era === 'era2') return enemy ? { esm: { name: 'E-27 逆探 (電波探知機)', factor: 1.3 } } : { esm: { name: 'APR-1 / SPR-1 截收機', factor: 1.3 } };
    if (era === 'era3') return { esm: { name: enemy ? 'Nakat 偵收機' : 'BLR-1 截收機', factor: 1.4 }, noisemaker: { name: enemy ? 'MG-14 氣幕彈' : 'NAE Mk 1 噪音彈', count: 4, towed: false } };
    if (era === 'era4') return { esm: { name: enemy ? 'Stop Light 電子偵測' : 'WLR-1 / BRD-6', factor: 1.5 }, noisemaker: { name: enemy ? 'MG-34 氣幕彈' : 'ADC Mk 1 聲學干擾器', count: 6, towed: false } };
    return enemy
      ? { esm: { name: 'Rim Hat / Park Lamp 電子偵測', factor: 1.6 }, noisemaker: { name: 'MG-34 氣幕彈', count: 6, towed: false }, moss: { name: 'MG-74 Korund 自航誘餌', count: 2 } }
      : { esm: { name: 'AN/BRD-7 / WLR-8 電子偵測', factor: 1.6 }, noisemaker: { name: 'ADC Mk 2 聲學干擾器', count: 8, towed: false }, moss: { name: 'Mk 70 MOSS 潛艦模擬器', count: 2 } };
  }
  // Surface ships
  if (era === 'era1') return {};
  if (era === 'era2') {
    const big = /^(carrier|battleship|cruiser|cve|kongo|chokai|akizuki|destroyer)$/.test(t);
    if (!big) return {};
    return enemy ? { esm: { name: 'E-27 逆探 (電波探知機)', factor: 1.3 } } : { esm: { name: 'DBM / ARC 雷達截收機', factor: 1.3 }, jammer: /^(carrier|battleship|cruiser)$/.test(t) ? { name: 'TDY 干擾機', power: 0.2 } : undefined };
  }
  if (era === 'era3') {
    // Soviet 1950s cruisers and destroyers carried the Bizan-4 intercept receiver
    if (enemy) return /^(cruiser|destroyer|sverdlov)$/.test(t) ? { esm: { name: 'Bizan-4 偵收機', factor: 1.3 } } : {};
    return { esm: { name: 'WLR-1 截收機', factor: 1.4 }, noisemaker: /^(destroyer|carrier|cruiser|battleship)$/.test(t) ? { name: 'T-Mk 6 Fanfare 拖曳噪音器', count: 2, towed: true } : undefined };
  }
  if (era === 'era4') {
    if (enemy) {
      if (t === 'kashin' || t === 'kynda') return { esm: { name: 'Watch Dog 電子偵測', factor: 1.4 }, jammer: { name: 'Top Hat 干擾機', power: 0.25 }, decoys: { name: 'PK-16 箔條發射器', chaff: 16, ir: 0, reload: 14 } };
      if (t === 'petya' || t === 'riga' || t === 'sverdlov') return { esm: { name: 'Watch Dog 電子偵測', factor: 1.3 } };
      return {};
    }
    const combatant = /^(cg|ddg|dd|ffg|cv63|lph)$/.test(t);
    return {
      esm: { name: 'WLR-1 / WLR-11 截收機', factor: 1.5 },
      jammer: t === 'cg' || t === 'ddg' || t === 'cv63' ? { name: 'AN/ULQ-6 欺騙干擾機', power: 0.3 } : undefined,
      decoys: combatant ? { name: 'Mk 28 Chaffroc / Mk 33 RBOC', chaff: 12, ir: 0, reload: 14 } : undefined,
      noisemaker: /^(cg|ddg|dd|ffg|cv63)$/.test(t) ? { name: 'T-Mk 6 Fanfare 拖曳噪音器', count: 2, towed: true } : undefined,
    };
  }
  // Era 5
  if (enemy) {
    if (t === 'cgn_kirov' || t === 'cvhg_kiev' || t === 'cg_slava') return { esm: { name: 'Rum Tub / Side Globe 電子偵測', factor: 2 }, jammer: { name: 'Bell 系列 (Bell Shroud/Squat) 干擾機', power: 0.55 }, decoys: { name: 'PK-2 誘餌發射器', chaff: 24, ir: 8, reload: 10 } };
    if (t === 'dd_sovremenny' || t === 'dd_udaloy') return { esm: { name: 'Bell Shroud 電子偵測', factor: 1.8 }, jammer: { name: 'Bell Squat 干擾機', power: 0.45 }, decoys: { name: 'PK-10 誘餌發射器', chaff: 20, ir: 10, reload: 8 } };
    if (t === 'kashin' || t === 'kynda' || t === 'petya') return { esm: { name: 'Watch Dog 電子偵測', factor: 1.5 }, decoys: { name: 'PK-16 箔條發射器', chaff: 16, ir: 0, reload: 12 } };
    return {};
  }
  const v3 = /^(cg_tico|cg_virginia|ddg_kidd|bb_iowa_mod|cvn)$/.test(t);
  const combatant = /^(cg_tico|cg_virginia|ddg_kidd|bb_iowa_mod|cvn|dd_spruance|ffg_ohp|lpd|cg|ddg|dd|ffg)$/.test(t);
  return {
    esm: { name: v3 ? 'AN/SLQ-32(V)3' : 'AN/SLQ-32(V)2', factor: 2 },
    jammer: v3 ? { name: 'AN/SLQ-32(V)3 主動干擾', power: 0.55 } : undefined,
    decoys: combatant ? { name: 'Mk 36 SRBOC (Mk 182 箔條 / Mk 186 TORCH)', chaff: 24, ir: 12, reload: 8 } : undefined,
    noisemaker: combatant ? { name: 'AN/SLQ-25 Nixie 拖曳誘餌', count: 2, towed: true } : undefined,
  };
}

// ── Radar ECCM (resistance of a side's search radars to jamming) ──────────────

export function radarEccm(enemySide: boolean, era: Era): number {
  if (era === 'era5') return enemySide ? 0.4 : 0.55; // frequency agility, SPY-1 sidelobe blanking
  if (era === 'era4') return enemySide ? 0.12 : 0.3; // Fan Song / Bar Lock vs SPS-48
  // 1944–53: CIC operators learned to read through Window; the IJN's and the KPA's sets could not
  if (era === 'era2' || era === 'era3') return enemySide ? 0.05 : 0.25;
  return 0.05;
}

// ── Decoys ────────────────────────────────────────────────────────────────────

export type DecoyKind = 'flare' | 'chaff' | 'ship_chaff' | 'ship_ir' | 'noisemaker' | 'nixie' | 'moss';

/** Seconds each decoy lasts (game time) and its peak effect. */
export const DECOY_LIFE: Record<DecoyKind, number> = {
  flare: 4.5, // MJU-7 / PPI-26: 3.5–5 s burn
  chaff: 9, // RR-129 / PPR-26: blooms in a fraction of a second, effective a few seconds
  ship_chaff: 32, // Mk 182 cloud hangs for minutes; most of its seduction value in the first half minute
  ship_ir: 24, // Mk 186 TORCH burns ~40 s on the water
  noisemaker: 30, // ADC Mk 2 / MG-34
  nixie: 9999, // towed until hit or recovered
  moss: 80, // Mk 70 MOSS runs a few miles
};

/** Base seduction value of each decoy against its own seeker band. */
export const DECOY_POWER: Record<DecoyKind, number> = {
  flare: 0.6,
  chaff: 0.2,
  ship_chaff: 0.62,
  ship_ir: 0.55,
  noisemaker: 0.5,
  nixie: 0.55,
  moss: 0.65,
};

export function decoyBand(kind: DecoyKind): SeekerBand {
  return kind === 'flare' || kind === 'ship_ir' ? 'ir' : kind === 'chaff' || kind === 'ship_chaff' ? 'radar' : 'acoustic';
}

/** Seconds a decoy takes to reach full strength (flare ignition, chaff bloom, cloud spread). */
export const DECOY_BLOOM: Record<DecoyKind, number> = { flare: 0.12, chaff: 0.35, ship_chaff: 2.2, ship_ir: 1.5, noisemaker: 0.5, nixie: 0, moss: 0.5 };

/** Strength of a decoy at a given age, 0..1: blooms quickly, then fades. */
export function decoyStrength(kind: DecoyKind, age: number): number {
  const life = DECOY_LIFE[kind];
  if (kind === 'nixie') return 1;
  const bloom = DECOY_BLOOM[kind];
  if (age < bloom) return age / bloom;
  return Math.max(0, 1 - Math.pow((age - bloom) / Math.max(0.1, life - bloom), 1.6));
}

/**
 * Chance that a seeker takes a decoy it sees for the first time instead of its target.
 * `beam`: target crossing the missile's line of sight (Doppler notch) 0..1; `rear`: missile
 * coming from behind the target 0..1 (flares work best against a tail chase).
 */
export function seductionChance(kind: DecoyKind, seeker: SeekerProfile, strength: number, opts: { beam?: number; rear?: number; jamming?: boolean; rejected?: number } = {}): number {
  // A seeker that has already rejected decoys holds its target more firmly (range/velocity gates settled)
  const settled = Math.pow(0.6, opts.rejected ?? 0);
  return settled * baseSeduction(kind, seeker, strength, opts);
}

function baseSeduction(kind: DecoyKind, seeker: SeekerProfile, strength: number, opts: { beam?: number; rear?: number; jamming?: boolean }): number {
  const band = decoyBand(kind);
  if (band === 'ir') {
    if (seeker.band !== 'ir') return 0;
    const aspect = 0.65 + 0.35 * (opts.rear ?? 0.5);
    return Math.min(0.92, DECOY_POWER[kind] * strength * Math.pow(1 - seeker.irccm, 1.5) * aspect);
  }
  if (band === 'radar') {
    if (seeker.band !== 'radar') return 0;
    // A home-on-jam seeker follows the jammer, not the chaff
    const jam = opts.jamming ? (seeker.hoj ? 0.5 : 1.2) : 1;
    const beam = opts.beam ?? 0;
    const notch = 1 + 0.5 * beam;
    // Pulse-Doppler and TVM seekers gate on closing speed: aircraft chaff stops dead in the air and
    // drops out of the gate unless the target is beaming (notching) at the same moment
    const doppler = kind === 'chaff' && seeker.eccm >= 0.45 ? (beam > 0.7 ? 1 : 0.25) : 1;
    return Math.min(0.9, DECOY_POWER[kind] * strength * (1 - seeker.eccm) * jam * notch * doppler);
  }
  // Acoustic decoys: wake homers are immune
  if (seeker.band !== 'acoustic') return 0;
  const counter = kind === 'moss' ? seeker.eccm * 0.6 : seeker.eccm;
  return Math.min(0.85, DECOY_POWER[kind] * strength * (1 - counter));
}

/** Per-second chance that self-protection or stand-off jamming breaks a radar seeker's lock. */
export function jamBreakRate(seeker: SeekerProfile, power: number): number {
  if (seeker.band !== 'radar' || seeker.hoj) return 0;
  return 0.22 * power * (1 - seeker.eccm);
}

/** Per-second chance that an IR jammer (ALQ-144, Lipa) spoils an early reticle IR seeker. */
export function irJamBreakRate(seeker: SeekerProfile, power: number): number {
  if (seeker.band !== 'ir') return 0;
  return 0.25 * power * Math.max(0, 1 - seeker.irccm * 1.6);
}

// ── ESM ───────────────────────────────────────────────────────────────────────

/** NATO reporting names of the radars ESM operators classified, by platform. */
const EMITTER: Record<string, string> = {
  cgn_kirov: 'Top Pair / Top Dome',
  cvhg_kiev: 'Top Sail / Top Steer',
  dd_sovremenny: 'Top Steer / Band Stand',
  dd_udaloy: 'Strut Pair / Top Plate',
  kashin: 'Head Net-C / Peel Group',
  kynda: 'Head Net-A / Scoop Pair',
  petya: 'Slim Net',
  riga: 'Slim Net / Sun Visor',
  sverdlov: 'Big Net / Top Trough',
  kongo: '二一號 / 一三號 電探',
  akizuki: '二一號 電探',
  chokai: '二一號 電探',
  fan_song_radar: 'SNR-75 Fan Song',
  sa2_sam_site: 'SNR-75 Fan Song',
  sa3_sam_site: 'SNR-125 Low Blow',
  s300_sam_site: '30N6 Flap Lid / 64N6 Big Bird',
  coastal_rubezh: 'Harpoon Head',
  mig21: 'RP-21 Spin Scan',
  mig23: 'Sapfir-23 High Lark',
  mig29a: 'N019 Slot Back',
  su27: 'N001 Slot Back',
  mig31: 'Zaslon Flash Dance',
  a50: 'Shmel (A-50)',
  tu95: 'Big Bulge',
  tu16: 'Short Horn',
  tu22m3: 'Down Beat',
  il38: 'Wet Eye',
  ka27: 'Splash Drop',
  mig15: 'Izumrud Scan Odd',
  mig19: 'RP-5 Scan Fix',
};

/** Ground radars whose type depends on the era and the side. */
function siteEmitter(key: string, era: Era, enemy: boolean): string | undefined {
  const early = era === 'era1' || era === 'era2';
  switch (key) {
    case 'radar_station':
      if (early) return enemy ? '一號電波探信儀 (Type 1 預警電探)' : 'SCR-270 預警雷達';
      if (era === 'era3') return enemy ? 'P-3 Dumbo 預警雷達' : 'AN/TPS-1 預警雷達';
      return enemy ? (era === 'era4' ? 'P-12 Spoon Rest / P-35 Bar Lock' : 'P-14 Tall King / ST-68 Tin Shield') : 'AN/FPS-117 / TPS-43 預警雷達';
    case 'flak_battery':
      if (early) return enemy ? '四號電探 (砲瞄)' : 'SCR-584 砲瞄雷達';
      return enemy ? (era === 'era5' ? 'RPK-1 Flap Wheel / Gun Dish 砲瞄雷達' : 'SON-9 Fire Can 砲瞄雷達') : 'AN/TPQ / Skyguard 砲瞄雷達';
    case 'airfield':
      return enemy ? 'RSP 進場管制 / P-37 Bar Lock 攔截管制雷達' : 'AN/TPS-43 / GCA 進場雷達';
    case 'command_post':
      return enemy ? 'Long Track 機動預警雷達' : 'AN/TPS-43 指管雷達';
    case 'sam_hawk':
      return 'AN/MPQ-46 HPIR 照射雷達';
  }
  return undefined;
}

export function emitterName(key: string, fallback: string, era: Era = 'era5', enemy = true): string {
  return siteEmitter(key, era, enemy) ?? EMITTER[key] ?? fallback;
}
