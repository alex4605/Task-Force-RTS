/**
 * How each ground unit attacks: one classification shared by our, allied and enemy units so a
 * T-34/85 fires its 85mm gun, a flame tank throws fire, a B-40 team fires a rocket, a mortar lobs
 * its bombs and a Bofors section hoses the target with 40mm clips, whichever side it is on.
 */
export type GroundWeaponMode =
  /** Rocket artillery and tactical missiles with their own salvo code (Calliope, MLRS, ATACMS, Scud, BM-13/21/27). */
  | 'special'
  /** Guided anti-tank missiles (TOW, Dragon, MILAN, Konkurs). */
  | 'atgm'
  /** Field guns, howitzers and self-propelled howitzers: high-angle fire, direct fire when close. */
  | 'indirect'
  /** Mortars: high-angle only. */
  | 'mortar'
  /** Tank and anti-tank guns, assault guns, heavy AA guns in the ground role: direct-fire shells. */
  | 'cannon'
  /** 20-57mm automatic cannon: AA guns turned on ground targets, IFV and recce cannon. */
  | 'autocannon'
  /** Machine guns: HMG teams, APC and tractor guns, the M16's quad .50s. */
  | 'mg'
  /** Flame tanks and flamethrowers. */
  | 'flame'
  /** Unguided anti-tank rockets and recoilless rifles (RPG / B-40, Ontos). */
  | 'rocket_at'
  /** Thrown charges and lunge mines in a close assault (banzai parties, sappers). */
  | 'satchel'
  /** Rifles, SMGs and light machine guns. */
  | 'smallarms';

const RULES: Array<[RegExp, GroundWeaponMode]> = [
  [/calliope|m270_mlrs|atacms|scud|bm13|bm21|bm27/, 'special'],
  [/flame|matilda_frog|churchill/, 'flame'],
  [/dragon_atgm|milan|hmmwv_tow|bradley|marder|bmp2/, 'atgm'],
  [/rpg_team|ontos/, 'rocket_at'],
  [/banzai|sapper/, 'satchel'],
  [/mortar/, 'mortar'],
  [/m106|2s9_nona/, 'mortar'],
  [/artillery|howitzer|m198|25pdr|l5_pack|pack_75|m102|m46_130|type92_70|zis3|m7_priest|m44_spg|m109|m107_175|2s1|2s3|2s19|hummel/, 'indirect'],
  [/bofors|duster|m163|vads|gepard|shilka|zu23|type98_aa|s60|zsu57|tunguska|btr_zd|lav25|warrior|luchs/, 'autocannon'],
  [/37mm_at|47mm_at|su76m|su100|m36|kami|pt76|lvt_45|bmd1|ks19|90mm_aa|sheridan|t80b/, 'cannon'],
  [/armor|tank|patton|pershing|chaffee|abrams|m60a1|leopard|challenger|centurion|matilda|amx30|t34|t54|t64|t72|is3|m41|m48/, 'cannon'],
  [/hmg|vickers|dshk|quad50|m113|acav|lvt_42|lvtp5|aav7|btr70|bren_carrier|avenger/, 'mg'],
];

const cache = new Map<string, GroundWeaponMode>();

export function groundWeaponMode(type: string): GroundWeaponMode {
  let m = cache.get(type);
  if (!m) {
    m = RULES.find(([re]) => re.test(type))?.[1] ?? 'smallarms';
    cache.set(type, m);
  }
  return m;
}

/** Short Chinese label for the unit panel / encyclopedia. */
export const WEAPON_MODE_LABEL: Record<GroundWeaponMode, string> = {
  special: '火箭 / 飛彈齊射',
  atgm: '反戰車飛彈',
  indirect: '曲射砲擊 (近距離直射)',
  mortar: '迫擊砲曲射',
  cannon: '直射砲彈',
  autocannon: '機砲連射',
  mg: '機槍掃射',
  flame: '火焰噴射',
  rocket_at: '反戰車火箭 / 無後座力砲',
  satchel: '近身爆破',
  smallarms: '步槍與輕機槍',
};
