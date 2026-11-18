/**
 * Historical naval gun performance, mapped onto game units.
 *
 * Each gun is described by three published figures: maximum range (km), rate of fire per barrel
 * (rounds / minute) and shell weight (kg). They are converted with one set of formulas so every
 * ship's guns are consistent with each other; the scale is anchored on the US 16"/50 Mk 7
 * (range 1950, reload ~7.5 s, damage 340), which keeps the game's existing pacing:
 *
 *   range  = 600 + 35 * km
 *   reload = 1.15 * (60 / rpm) ^ 0.55          (compresses slow battleship salvos vs quick-firers)
 *   damage = 19.8 * shellKg ^ 0.4              (diminishing returns on shell weight)
 *
 * Light anti-aircraft guns (< 50 mm) take historical range and rate of fire but keep their
 * hand-tuned damage, which is balanced for the anti-aircraft role. Missiles and CIWS are not
 * guns in this sense and are left to their own tuning.
 */
interface GunSpec {
  /** Pattern matched against the turret's caliber description. */
  match: RegExp;
  km: number;
  rpm: number;
  shellKg: number;
  /** Light AA: keep the authored damage, only range / reload are historical. */
  lightAA?: boolean;
}

// Order matters: the first matching entry wins, so specific designations precede generic ones.
const GUN_SPECS: GunSpec[] = [
  // Battleship main batteries
  { match: /460mm/, km: 42.0, rpm: 1.5, shellKg: 1460 }, // 46cm/45 Type 94 (Yamato)
  { match: /16-inch\/50/, km: 38.7, rpm: 2, shellKg: 1225 }, // 16"/50 Mk 7 (Iowa)
  { match: /16-inch\/45/, km: 33.7, rpm: 2, shellKg: 1225 }, // 16"/45 Mk 6 (North Carolina / South Dakota)
  { match: /14吋 Mk VII|14-inch Mk VII/, km: 33.0, rpm: 2, shellKg: 721 }, // BL 14" Mk VII (King George V)
  { match: /356mm|14-inch/, km: 35.4, rpm: 2, shellKg: 673 }, // 35.6cm/45 Type 41 (Kongo)
  // Cruiser main batteries
  { match: /8-inch\/55.*Mk 16/, km: 27.5, rpm: 10, shellKg: 152 }, // 8"/55 Mk 16 auto-loader (Des Moines)
  { match: /8-inch\/55/, km: 27.5, rpm: 3.5, shellKg: 152 }, // 8"/55 Mk 9 / 12 / 15
  { match: /203mm/, km: 29.4, rpm: 3, shellKg: 125.9 }, // 20.3cm/50 Type 3 No.2 (Takao)
  { match: /6-inch\/47.*DP/, km: 23.9, rpm: 12, shellKg: 47.6 }, // 6"/47 DP Mk 16 (Worcester)
  { match: /6-inch\/47/, km: 23.9, rpm: 10, shellKg: 59 }, // 6"/47 Mk 16 (Brooklyn / Cleveland)
  { match: /152mm Triple B-38/, km: 30.1, rpm: 7.5, shellKg: 55 }, // B-38 (Chapayev / Sverdlov)
  { match: /155mm/, km: 27.4, rpm: 5, shellKg: 55.9 }, // 15.5cm/60 Type 3 (Yamato secondary)
  { match: /152mm/, km: 21.0, rpm: 6, shellKg: 45.4 }, // 15.2cm/50 Type 41 (Agano, Kongo casemates)
  { match: /140mm/, km: 19.6, rpm: 8, shellKg: 38 }, // 14cm/50 Type 3
  { match: /5\.25吋|5\.25-inch/, km: 21.4, rpm: 8, shellKg: 36.3 }, // QF 5.25" Mk I (KGV secondary)
  { match: /6吋 Mk XXIII/, km: 23.3, rpm: 7, shellKg: 50.8 }, // BL 6" Mk XXIII (Town / Colony class)
  { match: /6吋 自動填裝/, km: 23.7, rpm: 20, shellKg: 59 }, // QF 6" Mk N5 (Tiger class)
  // Destroyer / dual-purpose guns
  { match: /4\.5吋 Mk 8/, km: 21.9, rpm: 25, shellKg: 21 }, // 4.5" Mk 8 (Type 42 / 22)
  { match: /4\.5吋/, km: 18.9, rpm: 14, shellKg: 25 }, // QF 4.5" Mk IV / V in Mk VI mount (Battle / Daring)
  { match: /4\.7吋/, km: 15.5, rpm: 11, shellKg: 22.7 }, // QF 4.7" Mk XII (Tribal / J / K / N)
  { match: /4吋 Mk XVI/, km: 18.2, rpm: 17, shellKg: 15.9 }, // QF 4" Mk XVI
  { match: /4吋/, km: 15.0, rpm: 14, shellKg: 14.1 }, // QF 4" Mk V
  { match: /100mm\/55 Mod 68/, km: 17.0, rpm: 60, shellKg: 13.5 }, // French 100mm Modèle 1968
  { match: /54倍徑 5吋/, km: 23.7, rpm: 40, shellKg: 32 }, // 5"/54 Mk 42 (JMSDF)
  { match: /奧托.*76mm/, km: 16.0, rpm: 85, shellKg: 6.3 }, // OTO Melara 76/62
  { match: /AK-130/, km: 23.0, rpm: 35, shellKg: 33.4 }, // AK-130 (Sovremenny / Frunze)
  { match: /SM-2-1/, km: 27.8, rpm: 14, shellKg: 33.4 }, // 130mm/58 SM-2-1 (Kotlin)
  { match: /130mm/, km: 25.6, rpm: 8, shellKg: 33.4 }, // 130mm/50 B-13 (Skory)
  { match: /127mm\/50 Type 3|127mm Twin Type 3/, km: 18.4, rpm: 10, shellKg: 23 }, // 12.7cm/50 Type 3 (Kagero)
  { match: /127mm/, km: 14.8, rpm: 14, shellKg: 23 }, // 12.7cm/40 Type 89 HA
  { match: /5-inch\/54 Mk 42/, km: 23.7, rpm: 40, shellKg: 32 }, // 5"/54 Mk 42
  { match: /5-inch\/54 Mk 45/, km: 23.1, rpm: 20, shellKg: 31.8 }, // 5"/54 Mk 45
  { match: /5-inch\/54/, km: 23.7, rpm: 17, shellKg: 32 }, // 5"/54 Mk 16 (Midway)
  { match: /5-inch\/25/, km: 13.2, rpm: 15, shellKg: 24.5 }, // 5"/25 Mk 10
  { match: /5-inch\/38/, km: 16.6, rpm: 15, shellKg: 25 }, // 5"/38 Mk 12
  { match: /AK-100/, km: 21.5, rpm: 60, shellKg: 15.6 }, // AK-100
  { match: /SM-5-1/, km: 24.0, rpm: 16, shellKg: 15.6 }, // 100mm/56 SM-5-1 (Sverdlov secondary)
  { match: /100mm\/56 B-34/, km: 22.2, rpm: 15, shellKg: 15.6 }, // 100mm/56 B-34 (Riga)
  { match: /100mm Type 98|100mm/, km: 19.5, rpm: 19, shellKg: 13 }, // 10cm/65 Type 98 (Akizuki)
  { match: /85mm/, km: 15.5, rpm: 15, shellKg: 9.2 }, // 85mm/52 92-K
  { match: /OTO Melara 76/, km: 16.0, rpm: 85, shellKg: 6.3 }, // OTO Melara 76/62 Compact
  { match: /AK-726/, km: 15.7, rpm: 45, shellKg: 5.9 }, // AK-726 76.2mm
  { match: /3-inch\/50|3"\/50|Mk 33 3-inch/, km: 13.4, rpm: 50, shellKg: 5.9 }, // 3"/50 Mk 22 / 33 / 34
  // Light anti-aircraft (historical effective AA range; damage stays as authored)
  { match: /45mm/, km: 5.0, rpm: 160, shellKg: 1.4, lightAA: true }, // SM-20-ZIF
  { match: /40mm Bofors/, km: 4.0, rpm: 120, shellKg: 0.9, lightAA: true },
  { match: /37mm/, km: 4.0, rpm: 160, shellKg: 0.73, lightAA: true }, // V-11M
  { match: /AK-230/, km: 4.0, rpm: 1000, shellKg: 0.39, lightAA: true },
  { match: /25mm/, km: 3.0, rpm: 450, shellKg: 0.28, lightAA: true }, // 2M-3
  { match: /20mm Oerlikon/, km: 2.0, rpm: 450, shellKg: 0.12, lightAA: true },
  { match: /\.50 cal/, km: 1.8, rpm: 550, shellKg: 0.046, lightAA: true },
];

// Weapons that are not tube artillery: missiles, CIWS, rocket launchers, grenade launchers.
const NOT_A_GUN = /Phalanx|CIWS|AK-630|Launcher|VLS|SAM|Sea Sparrow|ASROC|RBU|Mk 1[013] Mod|SA-N|Shtil|Kinzhal|S-300|P-500|P-700|AShM|Terrier|Grenade/i;

export interface GunPerformance {
  range: number;
  reloadTime: number;
  /** undefined for light AA: keep the authored value. */
  damage?: number;
}

const cache = new Map<string, GunPerformance | null>();

/** Historical performance for a naval gun described by `caliber`, or null if it is not a known gun. */
export function getNavalGunPerformance(caliber: string): GunPerformance | null {
  if (cache.has(caliber)) return cache.get(caliber)!;
  let perf: GunPerformance | null = null;
  if (!NOT_A_GUN.test(caliber)) {
    const spec = GUN_SPECS.find((g) => g.match.test(caliber));
    if (spec) {
      perf = {
        range: Math.round(600 + 35 * spec.km),
        reloadTime: Math.round(Math.min(12, Math.max(0.3, 1.15 * Math.pow(60 / spec.rpm, 0.55))) * 100) / 100,
        damage: spec.lightAA ? undefined : Math.round(19.8 * Math.pow(spec.shellKg, 0.4)),
      };
    }
  }
  cache.set(caliber, perf);
  return perf;
}
