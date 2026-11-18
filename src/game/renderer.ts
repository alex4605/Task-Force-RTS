import { Vector2D, Island, Ship, Aircraft, Projectile, Particle, SelectionBox, GroundUnit, RequisitionItem, LifeRaft, NuclearDetonation, Sonobuoy, Era } from '../types/game';
import { RenderContext } from './render/context';
import * as aircraftRender from './render/aircraft';
import * as effectsRender from './render/effects';
import * as groundUnitsRender from './render/groundUnits';
import * as islandsRender from './render/islands';
import * as oceanRender from './render/ocean';
import * as overlaysRender from './render/overlays';
import * as particlesRender from './render/particles';
import * as projectilesRender from './render/projectiles';
import * as shipsRender from './render/ships';

export type { Camera, OrderMarker } from './render/context';
import type { Camera, OrderMarker } from './render/context';

/**
 * Canvas renderer for the tactical map. Holds the shared RenderContext and delegates
 * each draw pass to the modules under ./render.
 */
export class VectorRenderer {
  private readonly rc: RenderContext;

  constructor(ctx: CanvasRenderingContext2D) {
    this.rc = { ctx, width: 0, height: 0, time: 0 };
  }

  public setSize(width: number, height: number) {
    this.rc.width = width;
    this.rc.height = height;
  }

  public updateTime(dt: number) {
    this.rc.time += dt;
  }

  // Clear & Draw Ocean Grid with Radar Sweep & Chart Markings
  public drawOcean(camera: Camera, worldSize: number, radarOrigin?: Vector2D) {
    oceanRender.drawOcean(this.rc, camera, worldSize, radarOrigin);
  }

  // Draw Islands
  public drawIslands(islands: Island[], camera: Camera) {
    islandsRender.drawIslands(this.rc, islands, camera);
  }

  // Draw Ships with RTS Selection Indicators & Submarine Fog of War
  public drawShips(ships: Ship[], camera: Camera, selectedUnitIds: string[]) {
    shipsRender.drawShips(this.rc, ships, camera, selectedUnitIds);
  }

  // Draw Specific Aircraft Models with Authentic Vector Silhouettes
  public drawAircraft(aircraftList: Aircraft[], camera: Camera, selectedUnitIds: string[]) {
    aircraftRender.drawAircraft(this.rc, aircraftList, camera, selectedUnitIds);
  }

  // Draw Projectiles with Authentic WWII Tracers, Ballistic Arcs & Cavitation Wakes
  public drawProjectiles(projectiles: Projectile[], camera: Camera) {
    projectilesRender.drawProjectiles(this.rc, projectiles, camera);
  }

  // Draw Particles including WWII Water Geysers & Authentic Flak Detonations
  public drawParticles(particles: Particle[], camera: Camera) {
    particlesRender.drawParticles(this.rc, particles, camera);
  }

  // Draw Screen-space RTS Drag Selection Box
  public drawSelectionBox(box: SelectionBox) {
    overlaysRender.drawSelectionBox(this.rc, box);
  }

  // Draw Ground Units (USMC Infantry, LVT Amphibious, Armor, and OPFOR Ambush squads)
  public drawGroundUnits(groundUnits: GroundUnit[], camera: Camera, selectedUnitIds: string[]) {
    groundUnitsRender.drawGroundUnits(this.rc, groundUnits, camera, selectedUnitIds);
  }

  // Draw Strongholds with Capture Zones and Command Posts
  public drawStrongholds(islands: Island[], camera: Camera) {
    islandsRender.drawStrongholds(this.rc, islands, camera);
  }

  // ══════════════════════════════════════════════════════════
  // 碼頭與工事營建落點預覽 (Placement Ghost Blueprint Renderer)
  // ══════════════════════════════════════════════════════════
  public drawPlacementGhost(item: RequisitionItem, worldPos: Vector2D, camera: Camera, islands: Island[]) {
    overlaysRender.drawPlacementGhost(this.rc, item, worldPos, camera, islands);
  }

  // ══════════════════════════════════════════════════════════
  // 時代三搜救救生筏繪製 (Era 3 Downed Pilot Life Raft on Ocean)
  // ══════════════════════════════════════════════════════════
  public drawLifeRafts(lifeRafts: LifeRaft[], camera: Camera) {
    effectsRender.drawLifeRafts(this.rc, lifeRafts, camera);
  }

  // ══════════════════════════════════════════════════════════
  // 時代三戰術核打擊全景特效 (全域白光盲閃、超音速擴散震波與升騰巨型蕈狀雲)
  // ══════════════════════════════════════════════════════════
  public drawNuclearEffects(flash: number, detonations: NuclearDetonation[], camera: Camera) {
    effectsRender.drawNuclearEffects(this.rc, flash, detonations, camera);
  }

  // Interactive Tactical CAP Area Designation Reticle
  public drawCapPreview(pos: Vector2D, camera: Camera) {
    overlaysRender.drawCapPreview(this.rc, pos, camera);
  }

  // Render Active Air-Dropped Passive Sonobuoys & Acoustic Ping Sweeps
  public drawSonobuoys(sonobuoys: Sonobuoy[], camera: Camera) {
    effectsRender.drawSonobuoys(this.rc, sonobuoys, camera);
  }

  // Interactive Passive Sonobuoy Drop Reticle
  public drawSonobuoyPreview(pos: Vector2D, radius: number, camera: Camera, era: Era) {
    overlaysRender.drawSonobuoyPreview(this.rc, pos, radius, camera, era);
  }

  // Right-click RTS Tactical Order Confirmation Ripples
  public drawOrderMarkers(markers: OrderMarker[], camera: Camera) {
    overlaysRender.drawOrderMarkers(this.rc, markers, camera);
  }
}
