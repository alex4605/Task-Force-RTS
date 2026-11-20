import { Ship, ShipType } from '../../../types/game';
import { RenderContext } from '../context';
import { drawAkizukiDD, drawBattleship, drawCVE, drawCarrier, drawChokaiCA, drawCruiser, drawDestroyer, drawKongoBB, drawLCVP, drawLSMR, drawLST, drawSubmarine } from './ww2';
import { drawAdamsDDG, drawBelknapCG, drawCV63, drawForrestShermanDD, drawFoxtrotSS, drawKashinDDG, drawKnoxFFG, drawKomarPTG, drawKyndaCG, drawLCM8, drawLPHIwoJima, drawOsaPTG, drawP6TorpedoBoat, drawPetyaFFG, drawRigaFFG, drawSverdlovCL } from './coldWar';
import { drawAustinLPD, drawIowaModernized, drawKiddDDG, drawKievCVHG, drawKirovCGN, drawLCAC, drawLosAngelesSSN, drawNimitzCVN, drawOscarSSGN, drawPerryFFG, drawSovremennyDD, drawSpruanceDD, drawTiconderogaCG, drawUdaloyDD, drawVirginiaCG } from './modern';

import { drawPBR, drawRiverGunboat, drawSlavaCG, drawTarawaLHA } from './additions';

/** Draws a hull silhouette in the ship's local frame (bow along +x). */
export type ShipHullDrawer = (rc: RenderContext, ship: Ship, hullColor: string, detailColor: string) => void;

/** Hull artwork for every ShipType. Exhaustive: a new ShipType without artwork is a compile error. */
export const SHIP_HULL_DRAWERS: Record<ShipType, ShipHullDrawer> = {
  cg_slava: drawSlavaCG,
  lha_tarawa: drawTarawaLHA,
  pbr: drawPBR,
  river_gunboat: drawRiverGunboat,
  carrier: drawCarrier,
  battleship: drawBattleship,
  cruiser: drawCruiser,
  destroyer: drawDestroyer,
  submarine: drawSubmarine,
  patrol_boat: drawP6TorpedoBoat,
  lcvp: drawLCVP,
  lst: drawLST,
  lsm_r: drawLSMR,
  cve: drawCVE,
  cv63: drawCV63,
  cg: drawBelknapCG,
  ddg: drawAdamsDDG,
  dd: drawForrestShermanDD,
  ffg: drawKnoxFFG,
  lph: drawLPHIwoJima,
  lcm8: drawLCM8,
  komar_ptg: drawKomarPTG,
  kashin: drawKashinDDG,
  riga: drawRigaFFG,
  foxtrot: drawFoxtrotSS,
  sverdlov: drawSverdlovCL,
  kynda: drawKyndaCG,
  petya: drawPetyaFFG,
  akizuki: drawAkizukiDD,
  chokai: drawChokaiCA,
  kongo: drawKongoBB,
  osa: drawOsaPTG,
  cvn: drawNimitzCVN,
  cg_tico: drawTiconderogaCG,
  cg_virginia: drawVirginiaCG,
  dd_spruance: drawSpruanceDD,
  ddg_kidd: drawKiddDDG,
  ffg_ohp: drawPerryFFG,
  ssn_la: drawLosAngelesSSN,
  bb_iowa_mod: drawIowaModernized,
  lpd: drawAustinLPD,
  lcac: drawLCAC,
  cvhg_kiev: drawKievCVHG,
  cgn_kirov: drawKirovCGN,
  dd_sovremenny: drawSovremennyDD,
  dd_udaloy: drawUdaloyDD,
  ssgn_oscar: drawOscarSSGN,
};
