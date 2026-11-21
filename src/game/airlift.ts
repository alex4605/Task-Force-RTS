import { AircraftModel, AircraftPayloadType, Era, GroundUnitType } from '../types/game';

/**
 * Airborne and air-assault cargo. Each cargo is a loadout choice on the transport, so the
 * payload menu doubles as the "what goes on board" selector, and each airframe only offers what
 * it historically carried:
 *
 * - C-47 Skytrain: one parachute rifle platoon (28 jumpers) or a 75 mm pack howitzer section
 *   dropped in bundles (1944–53).
 * - C-130 Hercules: two parachute platoons (64 jumpers), an M102 105 mm by heavy drop, an M551
 *   Sheridan by LAPES (the only US tank designed to be air-dropped), or a special-forces jump.
 * - C-1 Trader / C-2 Greyhound: carrier COD with room for a small team only: a SEAL jump.
 * - UH-1 / CH-46: one air-assault platoon each (1st Cavalry Division, Marine HMM squadrons).
 * - CH-53E: two rifle platoons, an M198 155 mm on the sling, or an HMMWV TOW inside.
 */
export const AIRLIFT_PAYLOADS: ReadonlySet<AircraftPayloadType> = new Set<AircraftPayloadType>([
  'c1_paratroopers',
  'para_sof_team',
  'para_pack_howitzer',
  'heavy_drop_sheridan',
  'helo_assault_troops',
  'helo_sling_artillery',
  'helo_vehicle_lift',
]);

/** Cargo delivered by landing or hovering rather than by parachute. */
export const HELO_LIFT: ReadonlySet<AircraftPayloadType> = new Set<AircraftPayloadType>(['helo_assault_troops', 'helo_sling_artillery', 'helo_vehicle_lift']);

export const isAirliftPayload = (p: AircraftPayloadType | undefined): boolean => !!p && AIRLIFT_PAYLOADS.has(p);
export const isHeloLift = (p: AircraftPayloadType | undefined): boolean => !!p && HELO_LIFT.has(p);

export interface AirliftCargo {
  units: { type: GroundUnitType; name: string }[];
  /** Short description for the banner: "第173空降旅 傘兵排 ×2". */
  label: string;
  method: 'parachute' | 'heavy_drop' | 'lapes' | 'helo';
}

const PARA_INFANTRY: Record<Era, { type: GroundUnitType; name: string }> = {
  era1: { type: 'usmc_paramarine_42', name: '第1陸戰傘兵營 傘兵排 (Paramarines)' },
  era2: { type: 'us_airborne_45', name: '第503傘兵團戰鬥群 傘兵排 (科雷希多)' },
  era3: { type: 'us_airborne_50', name: '第187空降團戰鬥群 傘兵排 (Rakkasans)' },
  era4: { type: 'us_airborne_65', name: '第173空降旅 傘兵排 (章克申城行動)' },
  era5: { type: 'us_airborne_83', name: '第82空降師 傘兵排 (All American)' },
};

const repeat = <T,>(x: T, n: number): T[] => Array.from({ length: n }, () => x);

export function airliftCargo(payload: AircraftPayloadType, model: AircraftModel, era: Era): AirliftCargo | null {
  const heavyLifter = model === 'c130';
  switch (payload) {
    case 'c1_paratroopers': {
      const p = PARA_INFANTRY[era];
      const n = heavyLifter ? 2 : 1;
      return { units: repeat(p, n), label: `${p.name} ×${n}`, method: 'parachute' };
    }
    case 'para_sof_team': {
      const sof: { type: GroundUnitType; name: string } =
        era === 'era5'
          ? heavyLifter
            ? { type: 'sof_ranger_83', name: '第75遊騎兵團第1營 排 (薩林斯角低空傘降)' }
            : { type: 'sof_seal_83', name: '海豹第六分隊 (海上傘降)' }
          : heavyLifter
          ? { type: 'sof_macv_sog_65', name: 'MACV-SOG 偵察小組 (HALO 傘降)' }
          : { type: 'sof_seal_65', name: '海豹第一分隊 (傘降)' };
      return { units: [sof], label: sof.name, method: 'parachute' };
    }
    case 'para_pack_howitzer': {
      const gun: { type: GroundUnitType; name: string } = heavyLifter
        ? { type: 'us_m102_105', name: 'M102 105mm 空降榴彈砲排 (重裝空投)' }
        : { type: 'us_m1a1_pack_75', name: 'M1A1 75mm 空降山砲排 (傘降綑包)' };
      return { units: [gun], label: gun.name, method: heavyLifter ? 'heavy_drop' : 'parachute' };
    }
    case 'heavy_drop_sheridan':
      return { units: [{ type: 'us_m551_sheridan', name: '第73裝甲團第3營 M551 謝里登 (LAPES 低空抽取空投)' }], label: 'M551 謝里登空降戰車', method: 'lapes' };
    case 'helo_assault_troops': {
      if (model === 'ch53') {
        const p = { type: 'usmc_rifle_83' as GroundUnitType, name: '第2陸戰師 步兵排 (CH-53E 機降)' };
        return { units: repeat(p, 2), label: `${p.name} ×2`, method: 'helo' };
      }
      const p =
        model === 'uh1'
          ? { type: 'us_cav_air_assault_65' as GroundUnitType, name: '第1騎兵師(空中機動) 空中突擊排' }
          : era === 'era5'
          ? { type: 'usmc_rifle_83' as GroundUnitType, name: '陸戰隊 步兵排 (機降)' }
          : { type: 'usmc_air_assault_65' as GroundUnitType, name: '陸戰隊 HMM 空中突擊排' };
      return { units: [p], label: p.name, method: 'helo' };
    }
    case 'helo_sling_artillery':
      return { units: [{ type: 'us_m198_155', name: 'M198 155mm 榴彈砲排 (CH-53E 吊掛)' }], label: 'M198 155mm 吊掛砲兵', method: 'helo' };
    case 'helo_vehicle_lift':
      return { units: [{ type: 'us_hmmwv_tow', name: 'M966 悍馬 TOW 反戰車班 (CH-53E 機艙運載)' }], label: '悍馬 TOW 機降', method: 'helo' };
    default:
      return null;
  }
}
