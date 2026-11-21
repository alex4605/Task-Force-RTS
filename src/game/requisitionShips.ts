import { Era, RequisitionItem, Ship, Vector2D } from '../types/game';
import {
  createAdamsDDG,
  createAustinLPD,
  createBelknapCG,
  createCV63,
  createCVNNimitz,
  createConvoyEscortShip,
  createForrestShermanDD,
  createIowaModernizedBB,
  createKiddDDG,
  createKnoxFFG,
  createLCAC,
  createLCM8,
  createLCVP,
  createLPHIwoJima,
  createLST,
  createLosAngelesSSN,
  createNewportLST,
  createPerryFFG,
  createPlayerBattleship,
  createSpruanceDD,
  createTiconderogaCG,
  createVirginiaCGN,
} from './procedural';

/**
 * The warship a naval requisition card delivers in an era (the same ship whether it is bought or
 * shown on the card). Returns null for cards that are not a ship (e.g. the SSBN strike).
 */
export function buildRequisitionShip(item: RequisitionItem, era: Era, shipId: string, warshipSpawnPos: Vector2D): Ship | null {
  let newShip: Ship | null = null;
  if (item.typeTag === 'bb' || item.typeTag === 'bb_missouri') {
    const isMo = item.typeTag === 'bb_missouri' || era === 'era3';
    newShip = createPlayerBattleship(
      shipId,
      isMo
        ? 'USS Missouri (BB-63 密蘇里號主力戰艦)'
        : era === 'era1'
        ? 'USS North Carolina (BB-55)'
        : 'USS Iowa (BB-61)',
      warshipSpawnPos,
      era
    );
  } else if (item.typeTag === 'ca' || item.typeTag === 'ca_desmoines') {
    newShip = createConvoyEscortShip(shipId, 'ca', warshipSpawnPos, era);
    if (item.typeTag === 'ca_desmoines' || era === 'era3') {
      newShip.name = 'USS Des Moines (CA-134 得梅因號自動裝填重巡)';
      newShip.health = 3600;
      newShip.maxHealth = 3600;
    }
  } else if (item.typeTag === 'cl') {
    newShip = createConvoyEscortShip(shipId, 'cl', warshipSpawnPos, era);
  } else if (item.typeTag === 'dd' || item.typeTag === 'dd_gearing' || item.typeTag === 'dd_sherman') {
    if (era === 'era4' || item.typeTag === 'dd_sherman') {
      newShip = createForrestShermanDD(shipId, 'USS Forrest Sherman (DD-931 驅逐艦)', warshipSpawnPos);
    } else {
      newShip = createConvoyEscortShip(shipId, 'dd', warshipSpawnPos, era);
      if (item.typeTag === 'dd_gearing' || era === 'era3') {
        newShip.name = 'USS Gearing (DD-710 基靈級雷達糾察驅逐艦)';
        newShip.health = 1850;
        newShip.maxHealth = 1850;
      }
    }
  } else if (item.typeTag === 'ffg') {
    newShip = createKnoxFFG(shipId, 'USS Knox (FFG-1052 巡防艦)', warshipSpawnPos);
  } else if (item.typeTag === 'ss') {
    newShip = createConvoyEscortShip(shipId, 'ss', warshipSpawnPos, era);
  } else if (item.typeTag === 'lst') {
    newShip = (era === 'era4' || era === 'era5')
      ? createNewportLST(shipId, era === 'era5' ? 'USS Newport (LST-1179 紐波特戰車登陸艦 現代化改型)' : 'USS Newport (LST-1179 紐波特級戰車登陸艦)', warshipSpawnPos, era)
      : createLST(shipId, 'USS LST-491 戰車登陸艦', warshipSpawnPos, era);
  } else if (item.typeTag === 'lcvp') {
    newShip = era === 'era5'
      ? createLCAC(shipId, 'LCAC-01 氣墊登陸艇', warshipSpawnPos)
      : era === 'era4'
      ? createLCM8(shipId, 'LCM-8 機械化登陸艇', warshipSpawnPos)
      : createLCVP(shipId, 'LCVP 突擊登陸艇', warshipSpawnPos, era);
  } else if (item.typeTag === 'cv63') {
    newShip = createCV63(shipId, 'USS Kitty Hawk (CV-63 超級航空母艦)', warshipSpawnPos);
  } else if (item.typeTag === 'cg') {
    newShip = createBelknapCG(shipId, 'USS Belknap (CG-26 導彈巡洋艦)', warshipSpawnPos);
  } else if (item.typeTag === 'ddg') {
    newShip = createAdamsDDG(shipId, 'USS Charles F. Adams (DDG-2 導彈驅逐艦)', warshipSpawnPos);
  } else if (item.typeTag === 'lph') {
    newShip = createLPHIwoJima(shipId, 'USS Iwo Jima (LPH-2 兩棲突擊艦)', warshipSpawnPos);
  } else if (item.typeTag === 'lcm8') {
    newShip = createLCM8(shipId, 'LCM-8 機械化登陸艇', warshipSpawnPos);
  } else if (item.typeTag === 'cvn') {
    newShip = createCVNNimitz(shipId, 'USS Nimitz (CVN-68 超級核動力航空母艦)', warshipSpawnPos);
  } else if (item.typeTag === 'cg_tico') {
    newShip = createTiconderogaCG(shipId, 'USS Ticonderoga (CG-47 神盾巡洋艦)', warshipSpawnPos);
  } else if (item.typeTag === 'cg_virginia') {
    newShip = createVirginiaCGN(shipId, 'USS Virginia (CGN-38 核動力巡洋艦)', warshipSpawnPos);
  } else if (item.typeTag === 'bb_iowa_mod') {
    newShip = createIowaModernizedBB(shipId, 'USS Iowa (BB-61 近代化改裝主力戰艦)', warshipSpawnPos);
  } else if (item.typeTag === 'dd_spruance') {
    newShip = createSpruanceDD(shipId, 'USS Spruance (DD-963 反潛驅逐艦)', warshipSpawnPos);
  } else if (item.typeTag === 'ddg_kidd') {
    newShip = createKiddDDG(shipId, 'USS Kidd (DDG-993 飛彈驅逐艦)', warshipSpawnPos);
  } else if (item.typeTag === 'ffg_ohp') {
    newShip = createPerryFFG(shipId, 'USS Oliver Hazard Perry (FFG-7 巡防艦)', warshipSpawnPos);
  } else if (item.typeTag === 'ssn_la') {
    newShip = createLosAngelesSSN(shipId, 'USS Los Angeles (SSN-688 攻擊核潛艦)', warshipSpawnPos);
  } else if (item.typeTag === 'lpd') {
    newShip = createAustinLPD(shipId, 'USS Austin (LPD-4 兩棲船塢運輸艦)', warshipSpawnPos);
  } else if (item.typeTag === 'lcac') {
    newShip = createLCAC(shipId, 'LCAC-01 氣墊登陸艇', warshipSpawnPos);
  }

  return newShip;
}
