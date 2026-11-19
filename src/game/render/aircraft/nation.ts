import { Aircraft, AircraftModel, AircraftNation } from '../../../types/game';
import { RenderContext } from '../context';
import {
  drawFrenchRoundel,
  drawHinomaru,
  drawLuftwaffeCross,
  drawRAFRoundel,
  drawRedStar,
  drawROKAFRoundel,
  drawUSInsignia,
} from './insignia';

/** Operator whose national markings an airframe wears. */
export type { AircraftNation } from '../../../types/game';        // Soviet VVS / AV-MF red star

/** Exhaustive: adding an AircraftModel without a nation is a compile error. */
export const AIRCRAFT_NATION: Record<AircraftModel, AircraftNation> = {
  // US Navy / Marine Corps
  f4f: 'usn', sbd: 'usn', tbd: 'usn', os2u: 'usn', f6f: 'usn', f4u: 'usn', f8f: 'usn', sb2c: 'usn', tbf: 'usn',
  sc1: 'usn', f9f: 'usn', f2h: 'usn', ad1: 'usn', f4u4: 'usn', af_guardian: 'usn', ad3w: 'usn', ho3s1: 'usn',
  f8: 'usn', f4b: 'usn', f4j: 'usn', a4: 'usn', a6a: 'usn', a6b_weasel: 'usn', e1: 'usn', s2: 'usn', uh2: 'usn',
  sh2: 'usn', c1: 'usn', a7: 'usn', p3: 'usn', a1h: 'usn', f14a: 'usn', fa18a: 'usn', s3a: 'usn', a6e: 'usn',
  e2c: 'usn', ea6b: 'usn', c2a: 'usn', sh3f: 'usn', av8b: 'usn', ch53: 'usn', ah1w: 'usn', pby: 'usn', sh60b: 'usn', ch46: 'usn',
  // US Army Air Forces / US Air Force / US Army
  b17: 'usaf', b24: 'usaf', p40: 'usaf', p38: 'usaf', a20: 'usaf', a26: 'usaf', p51: 'usaf', p47: 'usaf',
  b29: 'usaf', f86: 'usaf', f4e: 'usaf', f105: 'usaf', b52: 'usaf', ov10: 'usaf', uh1: 'usaf', ah1: 'usaf',
  c47: 'usaf', f15a: 'usaf', f16a: 'usaf', a10a: 'usaf', f111: 'usaf', e3a: 'usaf', ah64a: 'usaf', c130: 'usaf',
  p36a: 'usaf', b25: 'usaf', p39d: 'usaf', b17_late: 'usaf', f82: 'usaf', a37b: 'usaf', f5a: 'usaf', f84: 'usaf', ac47: 'usaf', f100: 'usaf',
  // Imperial Japan
  rufe: 'japan', ki84: 'japan',
  zero: 'japan', zero_a6m2: 'japan', zero_a6m5: 'japan', kamikaze_zero: 'japan', ki61: 'japan', george: 'japan',
  val: 'japan', judy: 'japan', kate: 'japan', jill: 'japan', g4m: 'japan', ohka: 'japan', kamikaze_judy: 'japan',
  // Commonwealth
  hurricane: 'uk', spitfire_v: 'uk', beaufighter: 'uk', swordfish: 'uk', spitfire_xiv: 'uk', tempest: 'uk',
  mosquito: 'uk', lancaster: 'uk', meteor: 'uk', sea_fury: 'uk', firefly_as5: 'uk', hunter_fga9: 'uk',
  tornado_gr1: 'uk', tornado_adv: 'uk', jaguar_gr1: 'uk',
  rokaf_p51: 'rok',
  // NATO Europe
  f4f_phantom: 'west_germany', tornado_ids: 'west_germany', f104g: 'west_germany',
  mirage3: 'france', mirage2000: 'france',
  viggen_ja37: 'sweden',
  // Soviet Union / Warsaw Pact
  mig15: 'ussr', tu14: 'ussr', yak9: 'ussr', il10: 'ussr', mig17: 'ussr', mig19: 'ussr', mig21: 'ussr',
  su7: 'ussr', il28: 'ussr', tu16: 'ussr', tu95: 'ussr', tu22m3: 'ussr', yak38: 'ussr', ka27: 'ussr',
  mig29a: 'ussr', su27: 'ussr', a50: 'ussr', su25: 'ussr', mi24: 'ussr', be12: 'ussr', il38: 'ussr', mig23: 'ussr', mig31: 'ussr', po2: 'ussr',
};

/**
 * Draws the national marking for this airframe at (x, y) with radius r.
 * US markings are only shown on friendly (player / allied) aircraft.
 */
export function drawNationalInsignia(rc: RenderContext, plane: Aircraft, x: number, y: number, r: number) {
  switch (plane.nation ?? AIRCRAFT_NATION[plane.model]) {
    case 'usn':
      if (plane.side !== 'enemy') drawUSInsignia(rc, x, y, r, false);
      break;
    case 'usaf':
      if (plane.side !== 'enemy') drawUSInsignia(rc, x, y, r, true);
      break;
    case 'japan':
      drawHinomaru(rc, x, y, r);
      break;
    case 'uk':
      drawRAFRoundel(rc, x, y, r);
      break;
    case 'sweden':
      break; // Tre Kronor roundel is part of the Viggen silhouette
    case 'rok':
      drawROKAFRoundel(rc, x, y, r);
      break;
    case 'west_germany':
      drawLuftwaffeCross(rc, x, y, r);
      break;
    case 'france':
      drawFrenchRoundel(rc, x, y, r);
      break;
    case 'ussr':
      drawRedStar(rc, x, y, r);
      break;
  }
}
