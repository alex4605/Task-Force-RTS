import { AircraftModel, Era, Installation } from '../types/game';
import { getCatalogRole } from './airWingCatalog';
import { isRotaryOrVstol } from './aircrew';
import { damageStage } from './settlements';

/**
 * What a damaged airfield can still do, in five stages of integrity (100 / 75 / 50 / 25 / 0%).
 * The heavies need the whole runway and its hard standings: a B-29 or a B-52 at take-off weight
 * cannot use a strip patched over half its length. Fighters and light attack aircraft get off a
 * shorter cleared section (the Seabees' standard after a raid was a 1,500 m strip back in hours).
 * Helicopters and V/STOL jets need only a cleared pad. The fewer usable dispersals and fuel
 * points, the smaller the flight that can be turned round at once.
 */

export type AirfieldStage = 0 | 1 | 2 | 3 | 4;

/** Integrity of an airfield, 0..1: a cratered runway counts as 0. */
export function airfieldIntegrity(inst: Installation): number {
  if (inst.isDestroyed || inst.cratered) return 0;
  return Math.max(0, Math.min(1, inst.health / Math.max(1, inst.maxHealth)));
}

export function airfieldStage(inst: Installation): AirfieldStage {
  return damageStage(airfieldIntegrity(inst));
}

/** Heavies and transports: four-engined bombers, the jet bombers and the cargo aircraft. */
export function needsFullRunway(model: AircraftModel, era: Era): boolean {
  const role = getCatalogRole(model, 'airbase', era);
  return role === 'level_bomber' || role === 'transport';
}

/** The lowest stage an aircraft can take off from or land at. */
export function minStageFor(model: AircraftModel, era: Era): AirfieldStage {
  if (isRotaryOrVstol(model)) return 1;
  return needsFullRunway(model, era) ? 3 : 2;
}

/** Largest flight that can be launched at once. */
export function sortieCap(stage: AirfieldStage): number {
  return stage >= 4 ? Infinity : stage === 3 ? 6 : stage === 2 ? 4 : stage === 1 ? 2 : 0;
}

/** Why an aircraft cannot operate here, or undefined if it can. */
export function airfieldRefusal(inst: Installation, model: AircraftModel, era: Era): string | undefined {
  const stage = airfieldStage(inst);
  const need = minStageFor(model, era);
  if (stage >= need) return undefined;
  if (stage === 0) return '跑道癱瘓，任何飛機都無法起降';
  if (need === 3) return `跑道完整度 ${Math.round(airfieldIntegrity(inst) * 100)}%：重轟炸機與運輸機需 75% 以上的完整跑道`;
  return `跑道完整度 ${Math.round(airfieldIntegrity(inst) * 100)}%：固定翼飛機需 50% 以上，目前僅直升機與垂直起降機可起降`;
}

/** One line for the map and the airfield panel. */
export function airfieldStatusLine(inst: Installation): string {
  const s = airfieldStage(inst);
  return s === 4
    ? '跑道完好 · 全機種可起降'
    : s === 3
    ? '跑道輕損 · 全機種可起降 · 每批最多 6 架'
    : s === 2
    ? '跑道半毀 · 重轟/運輸機停飛 · 每批最多 4 架'
    : s === 1
    ? '跑道重損 · 僅直升機/垂直起降機 · 每批最多 2 架'
    : '跑道癱瘓 · 停止起降';
}
