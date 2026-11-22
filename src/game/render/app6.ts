/**
 * NATO APP-6 (MIL-STD-2525) land unit symbols: affiliation frame, function icon, echelon
 * amplifier above the frame and mobility indicator below it. Geometry follows the standard's
 * proportions: friendly rectangle 1.5 : 1, hostile diamond, neutral square, unknown quatrefoil,
 * with the icon drawn in a common octagon so it fits every frame.
 */

export type Affiliation = 'friend' | 'hostile' | 'neutral' | 'unknown';

export type App6Function =
  | 'infantry'
  | 'infantry_air_assault'
  | 'infantry_airborne'
  | 'mech_infantry'
  | 'armour'
  | 'armoured_recon'
  | 'anti_armour'
  | 'anti_armour_armoured'
  | 'recon'
  | 'engineer'
  | 'mortar'
  | 'field_artillery'
  | 'rocket_artillery'
  | 'ssm'
  | 'air_defence_gun'
  | 'air_defence_missile'
  | 'special_forces';

export type Echelon = 'team' | 'squad' | 'section' | 'platoon' | 'company' | 'battery' | 'battalion' | 'regiment' | 'brigade';
export type Mobility = 'none' | 'tracked' | 'wheeled' | 'towed' | 'amphibious' | 'wheeled_tracked';

/** Standard APP-6 fill colours (light), with the frame and icon in black. */
const FILL: Record<Affiliation, string> = {
  friend: '#80E0FF',
  hostile: '#FF8080',
  neutral: '#AAFFAA',
  unknown: '#FFFF80',
};

/** Half-size of the frame: a friendly rectangle 18 × 12 units. */
const FW = 9;
const FH = 6;

/** Function icon bounding box (half extents) inside each frame. */
function iconBox(a: Affiliation): { w: number; h: number } {
  if (a === 'hostile') return { w: 6.2, h: 4.6 };
  if (a === 'friend') return { w: FW, h: FH };
  return { w: 6.6, h: 5.6 };
}

function frameTop(a: Affiliation): number {
  if (a === 'hostile') return -FW * 1.1;
  if (a === 'friend') return -FH;
  return -FH * 1.25;
}

function frameBottom(a: Affiliation): number {
  return -frameTop(a);
}

function traceFrame(ctx: CanvasRenderingContext2D, a: Affiliation) {
  ctx.beginPath();
  if (a === 'friend') {
    ctx.rect(-FW, -FH, FW * 2, FH * 2);
  } else if (a === 'hostile') {
    const r = FW * 1.1;
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
  } else if (a === 'neutral') {
    const s = FH * 1.25;
    ctx.rect(-s, -s, s * 2, s * 2);
  } else {
    // Quatrefoil
    const r = FH * 0.75;
    const o = FH * 0.7;
    ctx.arc(0, -o, r, Math.PI * 0.85, Math.PI * 0.15);
    ctx.arc(o, 0, r, -Math.PI * 0.65, Math.PI * 0.65);
    ctx.arc(0, o, r, -Math.PI * 0.15, Math.PI * 1.15);
    ctx.arc(-o, 0, r, Math.PI * 0.35, Math.PI * 1.65);
    ctx.closePath();
  }
}

function drawIcon(ctx: CanvasRenderingContext2D, fn: App6Function, a: Affiliation) {
  const { w, h } = iconBox(a);
  const ink = '#000000';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cross = (cw = w, ch = h) => {
    ctx.beginPath();
    ctx.moveTo(-cw, -ch);
    ctx.lineTo(cw, ch);
    ctx.moveTo(cw, -ch);
    ctx.lineTo(-cw, ch);
    ctx.stroke();
  };
  const armourOval = (rx = w * 0.62, ry = h * 0.5) => {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  };
  const dot = (y = 0, r = Math.min(w, h) * 0.3) => {
    ctx.beginPath();
    ctx.arc(0, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const reconSlash = () => {
    ctx.beginPath();
    ctx.moveTo(-w, h);
    ctx.lineTo(w, -h);
    ctx.stroke();
  };
  const antiArmour = () => {
    ctx.beginPath();
    ctx.moveTo(-w, h);
    ctx.lineTo(0, -h);
    ctx.lineTo(w, h);
    ctx.stroke();
  };
  const adArc = () => {
    // Air defence: dome across the lower part of the frame
    ctx.beginPath();
    ctx.ellipse(0, h, w * 0.95, h * 0.7, 0, Math.PI, 0);
    ctx.stroke();
  };
  const missile = (y0: number, y1: number) => {
    // Missile: slim body with nose and fins, pointing up
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(0, y1);
    ctx.moveTo(-h * 0.22, y0 + h * 0.3);
    ctx.lineTo(0, y0);
    ctx.lineTo(h * 0.22, y0 + h * 0.3);
    ctx.moveTo(-h * 0.25, y1);
    ctx.lineTo(0, y1 - h * 0.25);
    ctx.lineTo(h * 0.25, y1);
    ctx.stroke();
  };

  switch (fn) {
    case 'infantry':
      cross();
      break;
    case 'infantry_air_assault':
      cross();
      // Air assault: rotor-wing modifier in the lower sector
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, h * 0.62);
      ctx.quadraticCurveTo(-w * 0.17, h * 0.3, 0, h * 0.62);
      ctx.quadraticCurveTo(w * 0.17, h * 0.3, w * 0.35, h * 0.62);
      ctx.stroke();
      break;
    case 'infantry_airborne':
      cross();
      // Airborne: the gull-wing arc in the lower sector
      ctx.beginPath();
      ctx.moveTo(-w * 0.45, h * 0.62);
      ctx.quadraticCurveTo(-w * 0.22, h * 0.25, 0, h * 0.55);
      ctx.quadraticCurveTo(w * 0.22, h * 0.25, w * 0.45, h * 0.62);
      ctx.stroke();
      break;
    case 'mech_infantry':
      cross();
      armourOval();
      break;
    case 'armour':
      armourOval();
      break;
    case 'armoured_recon':
      reconSlash();
      armourOval();
      break;
    case 'anti_armour':
      antiArmour();
      break;
    case 'anti_armour_armoured':
      antiArmour();
      armourOval(w * 0.62, h * 0.45);
      break;
    case 'recon':
      reconSlash();
      break;
    case 'special_forces': {
      // Special operations forces: "SF" in the frame
      ctx.font = `bold ${Math.round(h * 1.15)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SF', 0, h * 0.05);
      break;
    }
    case 'engineer': {
      // Engineer: bridge-like "E" with three legs
      const ew = w * 0.55;
      const et = -h * 0.35;
      const eb = h * 0.35;
      ctx.beginPath();
      ctx.moveTo(-ew, eb);
      ctx.lineTo(-ew, et);
      ctx.lineTo(ew, et);
      ctx.lineTo(ew, eb);
      ctx.moveTo(0, et);
      ctx.lineTo(0, eb);
      ctx.stroke();
      break;
    }
    case 'mortar':
      // Mortar: upward arrow standing on a circle
      ctx.beginPath();
      ctx.arc(0, h * 0.55, h * 0.22, 0, Math.PI * 2);
      ctx.moveTo(0, h * 0.33);
      ctx.lineTo(0, -h * 0.65);
      ctx.moveTo(-h * 0.3, -h * 0.32);
      ctx.lineTo(0, -h * 0.65);
      ctx.lineTo(h * 0.3, -h * 0.32);
      ctx.stroke();
      break;
    case 'field_artillery':
      dot();
      break;
    case 'rocket_artillery':
      // Rocket artillery: artillery dot under two rocket chevrons
      dot(h * 0.35, Math.min(w, h) * 0.24);
      ctx.beginPath();
      for (const dx of [-w * 0.32, w * 0.32]) {
        ctx.moveTo(dx - h * 0.25, -h * 0.2);
        ctx.lineTo(dx, -h * 0.6);
        ctx.lineTo(dx + h * 0.25, -h * 0.2);
      }
      ctx.stroke();
      break;
    case 'ssm':
      missile(-h * 0.8, h * 0.8);
      break;
    case 'air_defence_gun':
      adArc();
      dot(h * 0.05, Math.min(w, h) * 0.18);
      break;
    case 'air_defence_missile':
      adArc();
      missile(-h * 0.8, h * 0.55);
      break;
  }
}

function drawEchelon(ctx: CanvasRenderingContext2D, e: Echelon, y: number) {
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.1;
  const dots = (n: number) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 3.2;
      ctx.moveTo(x + 1.05, y - 1.6);
      ctx.arc(x, y - 1.6, 1.05, 0, Math.PI * 2);
    }
    ctx.fill();
  };
  const bars = (n: number) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 2.6;
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  switch (e) {
    case 'team':
      // Team / crew: a circle crossed by a diagonal
      ctx.beginPath();
      ctx.arc(0, y - 1.8, 1.6, 0, Math.PI * 2);
      ctx.moveTo(-2, y);
      ctx.lineTo(2, y - 3.6);
      ctx.stroke();
      break;
    case 'squad':
      dots(1);
      break;
    case 'section':
      dots(2);
      break;
    case 'platoon':
      dots(3);
      break;
    case 'company':
    case 'battery':
      bars(1);
      break;
    case 'battalion':
      bars(2);
      break;
    case 'regiment':
      bars(3);
      break;
    case 'brigade':
      ctx.beginPath();
      ctx.moveTo(-1.8, y - 3.8);
      ctx.lineTo(1.8, y);
      ctx.moveTo(1.8, y - 3.8);
      ctx.lineTo(-1.8, y);
      ctx.stroke();
      break;
  }
}

function drawMobility(ctx: CanvasRenderingContext2D, m: Mobility, y: number) {
  if (m === 'none') return;
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  const wheel = (x: number) => {
    ctx.moveTo(x + 1.1, y + 1.6);
    ctx.arc(x, y + 1.6, 1.1, 0, Math.PI * 2);
  };
  ctx.beginPath();
  switch (m) {
    case 'tracked':
      ctx.roundRect(-6.5, y, 13, 3.2, 1.6);
      break;
    case 'wheeled':
      wheel(-3.5);
      wheel(0);
      wheel(3.5);
      break;
    case 'wheeled_tracked':
      wheel(-5);
      ctx.roundRect(-2.5, y, 8, 3.2, 1.6);
      break;
    case 'towed':
      ctx.moveTo(-5, y + 1.6);
      ctx.lineTo(5, y + 1.6);
      wheel(-6.2);
      wheel(6.2);
      break;
    case 'amphibious':
      // Wavy line
      ctx.moveTo(-7, y + 1.6);
      for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(-5.25 + i * 3.5, y + (i % 2 ? 3.6 : -0.4), -3.5 + i * 3.5, y + 1.6);
      break;
  }
  ctx.stroke();
}

export interface App6Options {
  affiliation: Affiliation;
  fn: App6Function;
  echelon: Echelon;
  mobility: Mobility;
  /** Dim the whole symbol (suppressed / pinned). */
  dim?: boolean;
  /** Frame fill override (allied formations: green, to tell them from the player's own blue). */
  fill?: string;
}

/** Draw the full symbol centred at (0, 0). */
export function drawApp6(ctx: CanvasRenderingContext2D, o: App6Options): void {
  ctx.save();
  if (o.dim) ctx.globalAlpha *= 0.7;
  // Dark halo so the light frame separates from any terrain
  traceFrame(ctx, o.affiliation);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.fillStyle = o.fill ?? FILL[o.affiliation];
  ctx.fill();
  ctx.save();
  traceFrame(ctx, o.affiliation);
  ctx.clip();
  drawIcon(ctx, o.fn, o.affiliation);
  ctx.restore();
  traceFrame(ctx, o.affiliation);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  drawEchelon(ctx, o.echelon, frameTop(o.affiliation) - 1.6);
  const bottom = frameBottom(o.affiliation);
  drawMobility(ctx, o.mobility, bottom + 1.4);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
// Unit type -> symbol mapping
// ════════════════════════════════════════════════════════════════════════════

const has = (t: string, ...keys: string[]) => keys.some((k) => t.includes(k));

/** Symbols for types whose names do not carry the usual keywords. */
const EXPLICIT_FUNCTION: Record<string, App6Function> = {
  usmc_raider_42: 'infantry',
  usmc_37mm_at: 'anti_armour',
  us_army_rifle_45: 'infantry',
  usmc_m4a3r3_flame: 'armour',
  us_m24_chaffee: 'armour',
  us_m16_quad50: 'air_defence_gun',
  usmc_90mm_aa_42: 'air_defence_gun',
  us_redeye_team: 'air_defence_missile',
  us_stinger_team: 'air_defence_missile',
  opfor_sa7_strela: 'air_defence_missile',
  opfor_igla_team: 'air_defence_missile',
  usmc_40mm_bofors_45: 'air_defence_gun',
  us_m113_acav: 'armoured_recon',
  us_m107_175: 'field_artillery',
  us_hmmwv_tow: 'anti_armour',
  us_avenger: 'air_defence_missile',
  cw_infantry_ww2: 'infantry',
  au_matilda: 'armour',
  rok_infantry_50: 'infantry',
  cw_infantry_50: 'infantry',
  cw_centurion: 'armour',
  rok_marine_65: 'infantry',
  arvn_ranger_65: 'infantry',
  au_rar_65: 'infantry',
  arvn_m41: 'armour',
  frg_infantry_83: 'mech_infantry',
  frg_marder: 'mech_infantry',
  frg_leopard2: 'armour',
  uk_challenger1: 'armour',
  uk_warrior: 'mech_infantry',
  nz_infantry_43: 'infantry',
  fj_commando_43: 'recon',
  cw_25pdr: 'field_artillery',
  au_commando_45: 'infantry',
  ph_guerrilla_45: 'infantry',
  au_matilda_frog: 'armour',
  tr_infantry_50: 'infantry',
  rok_m36: 'anti_armour_armoured',
  rok_tiger_65: 'infantry',
  au_centurion_68: 'armour',
  arvn_m113_acav: 'armoured_recon',
  nz_l5_pack: 'field_artillery',
  frg_gepard: 'air_defence_gun',
  frg_m109g: 'field_artillery',
  uk_milan_team: 'anti_armour',
  usmc_paramarine_42: 'infantry_airborne',
  us_airborne_45: 'infantry_airborne',
  us_airborne_50: 'infantry_airborne',
  us_airborne_65: 'infantry_airborne',
  us_airborne_83: 'infantry_airborne',
  us_cav_air_assault_65: 'infantry_air_assault',
  us_m1a1_pack_75: 'field_artillery',
  us_m102_105: 'field_artillery',
  sof_coastwatcher_42: 'recon',
  sof_alamo_scouts_45: 'special_forces',
  sof_udt_45: 'special_forces',
  sof_ranger_50: 'special_forces',
  sof_udt_50: 'special_forces',
  sof_seal_65: 'special_forces',
  sof_macv_sog_65: 'recon',
  sof_force_recon_83: 'recon',
  sof_seal_83: 'special_forces',
  sof_ranger_83: 'special_forces',
  opfor_ija_hmg_42: 'infantry',
  opfor_ija_47mm_at: 'anti_armour',
  opfor_ija_kami: 'armour',
  opfor_ija_banzai_45: 'infantry',
  opfor_pva_infantry_50: 'infantry',
  opfor_zis3_76: 'field_artillery',
  opfor_su76m: 'anti_armour_armoured',
  opfor_vc_guerrilla_65: 'infantry',
  opfor_rpg_team_65: 'anti_armour',
  opfor_m46_130mm: 'field_artillery',
  opfor_dshk_aa: 'air_defence_gun',
  opfor_spetsnaz_83: 'special_forces',
  opfor_bmd1: 'mech_infantry',
  opfor_btr70: 'mech_infantry',
  opfor_t64b: 'armour',
  cw_bren_carrier: 'armoured_recon',
  au_vickers_mg_45: 'infantry',
  cw_churchill_50: 'armour',
  gr_infantry_50: 'infantry',
  fr_infantry_50: 'infantry',
  th_cobra_67: 'infantry',
  arvn_m48a3: 'armour',
  au_sasr_66: 'special_forces',
  nl_leopard1: 'armour',
  nl_infantry_83: 'mech_infantry',
  frg_jaeger_83: 'infantry',
  frg_heimatschutz_83: 'infantry',
  fr_infantry_83: 'mech_infantry',
  fr_amx30b2: 'armour',
  uk_infantry_83: 'mech_infantry',
  arvn_rfpf_65: 'infantry',
  opfor_nlf_main_force_65: 'infantry',
  rok_police_50: 'infantry',
  opfor_kpa_infantry_50: 'infantry',
  si_scouts_42: 'infantry',
  frg_luchs: 'armoured_recon',
  uk_sas_83: 'special_forces',
};

const EXPLICIT_MOBILITY: Record<string, Mobility> = {
  usmc_37mm_at: 'towed',
  us_m16_quad50: 'wheeled_tracked',
  usmc_90mm_aa_42: 'towed',
  us_redeye_team: 'none',
  us_stinger_team: 'none',
  opfor_sa7_strela: 'none',
  opfor_igla_team: 'none',
  usmc_40mm_bofors_45: 'towed',
  us_m107_175: 'tracked',
  us_hmmwv_tow: 'wheeled',
  us_avenger: 'wheeled',
  cw_25pdr: 'towed',
  rok_m36: 'tracked',
  nz_l5_pack: 'towed',
  frg_gepard: 'tracked',
  us_m1a1_pack_75: 'towed',
  us_m102_105: 'towed',
  sof_udt_45: 'amphibious',
  sof_udt_50: 'amphibious',
  sof_seal_65: 'amphibious',
  sof_force_recon_83: 'amphibious',
  sof_seal_83: 'amphibious',
  opfor_ija_47mm_at: 'towed',
  opfor_ija_kami: 'amphibious',
  opfor_zis3_76: 'towed',
  opfor_su76m: 'tracked',
  opfor_m46_130mm: 'towed',
  opfor_dshk_aa: 'towed',
  opfor_btr70: 'wheeled',
  frg_luchs: 'wheeled',
  frg_m109g: 'tracked',
};

export function app6Function(type: string): App6Function {
  const t = type.toLowerCase();
  if (EXPLICIT_FUNCTION[t]) return EXPLICIT_FUNCTION[t];
  if (has(t, 'scud', 'atacms', 'ssm', 'ballistic')) return 'ssm';
  if (has(t, 'mlrs', 'm270', 'grad', 'uragan', 'calliope')) return 'rocket_artillery';
  if (has(t, 'chaparral', 'sa6', 'sa8', 'sa9', 'sa11', 'sa15', 'strela', 'kub', 'buk', 'lav_ad', 'stinger') || /(^|_)(sam|tor|osa)(_|$)/.test(t)) return 'air_defence_missile';
  if (has(t, 'flak', 'zu23', 'ks19', 's60', 'shilka', 'zsu', 'duster', 'vads', 'm163', 'tunguska', 'btr_zd') || /(^|_)aa(_|$)/.test(t)) return 'air_defence_gun';
  if (has(t, 'ontos', 'su100')) return 'anti_armour_armoured';
  if (has(t, 'atgm', 'dragon', 'tow', 'anti_tank')) return 'anti_armour';
  if (has(t, 'sheridan', 'pt76', 'lav25')) return 'armoured_recon';
  if (has(t, 'lvt', 'aav', 'm113', 'mech', 'bradley', 'bmp', 'btr')) return 'mech_infantry';
  if (has(t, 'armor', 'tank', 'abrams', 'm1ip', 'm1a1', 'm60', 'm48', 'patton', 'pershing', 't34', 't54', 't55', 't62', 't72', 't80', 'is3', 'type95', 'type97')) return 'armour';
  if (has(t, 'mortar')) return 'mortar';
  if (has(t, 'spg', 'paladin', 'priest', 'm44', 'hummel', 'm109', '2s1', '2s3', '2s19', 'artillery', 'howitzer', 'm198', '_155', '_105')) return 'field_artillery';
  if (has(t, 'engineer', 'sapper')) return 'engineer';
  if (has(t, 'air_assault')) return 'infantry_air_assault';
  if (has(t, 'rifle', 'infantry', 'ambush', 'patrol', 'marine')) return 'infantry';
  return 'recon';
}

export function app6Mobility(type: string, fn: App6Function): Mobility {
  const t = type.toLowerCase();
  if (EXPLICIT_MOBILITY[t]) return EXPLICIT_MOBILITY[t];
  if (has(t, 'lvt', 'aav', 'pt76', 'sa8', 'osa')) return 'amphibious';
  if (fn === 'armour' || fn === 'mech_infantry' || fn === 'armoured_recon' || fn === 'anti_armour_armoured') {
    return has(t, 'lav', 'btr') && !has(t, 'btr_zd') ? 'wheeled' : 'none';
  }
  if (has(t, 'artillery_105', 'howitzer_155', 'm198', 'field_artillery', 'ks19', 'zu23', 's60', 'flak')) return 'towed';
  if (has(t, 'scud', 'grad', 'uragan', 'sa9', 'lav_ad')) return 'wheeled';
  if (has(t, 'spg', 'paladin', 'priest', 'm44', 'hummel', 'm109', '2s', 'm270', 'atacms', 'calliope', 'chaparral', 'duster', 'vads', 'm163', 'shilka', 'zsu', 'tunguska', 'sa6', 'kub', 'sa11', 'buk', 'sa15', 'tor', 'strela10', 'btr_zd')) return 'tracked';
  return 'none';
}
