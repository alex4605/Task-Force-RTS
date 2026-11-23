/**
 * Cold War allied escorts in plan view, each from its class layout: the Type 42's Sea Dart and
 * twin Type 909 domes, the Type 22's Exocets and two Sea Wolf launchers, the County's Sea Slug
 * aft, the Haruna / Shirane helicopter destroyers' huge hangars, Tromp's "egg" radome, Suffren's
 * DRBI 23 dome and Masurca, Iroquois' split funnels. Gun mounts come from the ship's own turret
 * data (drawShipTurrets); everything else is placed here as fractions of the hull length
 * (+0.5 = bow) and beam.
 */
import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawHullShape, HullForm } from './hullShape';
import { drawShipTurrets } from './mounts';

type LauncherKind =
  | 'seaDart'
  | 'mk13'
  | 'seaWolf'
  | 'exocet'
  | 'harpoon'
  | 'asroc'
  | 'seaSlug'
  | 'masurca'
  | 'malafon'
  | 'crotale'
  | 'seaSparrow'
  | 'seacat'
  | 'limbo';

interface Layout {
  hull: HullForm;
  /** Deckhouses [fwd, aft, width fraction]; the first is the bridge (window strip at its face). */
  houses: [number, number, number][];
  hangar?: [number, number, number];
  deck?: [number, number];
  /** Funnels: x, size (fraction of beam), style. */
  funnels: { x: number; s: number; kind: 'oval' | 'mack' | 'twin' | 'vsplit' }[];
  radomes?: { x: number; r: number }[];
  /** Search radar arrays on the masts: x and span (fraction of beam). */
  radars?: { x: number; span: number }[];
  /** Fire-control dishes (SPG-51, DRBR 51...) on the centreline or paired. */
  dishes?: { x: number; y?: number }[];
  launchers?: { x: number; y?: number; kind: LauncherKind; skipIf?: RegExp }[];
  helo?: boolean;
  /** Davits and boats on both sides. */
  boats?: number;
}

const FRIGATE: HullForm = { entry: 0.32, run: 0.12, transom: 0.72, fullness: 0.4, rake: 0.012 };
const DESTROYER: HullForm = { entry: 0.34, run: 0.14, transom: 0.65, fullness: 0.38, rake: 0.014 };
const CUTTER: HullForm = { entry: 0.3, run: 0.18, transom: 0.55, fullness: 0.45, rake: 0.01 };

const LAYOUTS: Array<[RegExp, Layout]> = [
  // Type 42 (Sheffield / Coventry / Glasgow; Gloucester is the stretched Batch 3)
  [
    /Sheffield \(D80|Coventry|Glasgow|Gloucester|Southampton/,
    {
      hull: DESTROYER,
      houses: [[0.12, -0.12, 0.58]],
      hangar: [-0.12, -0.25, 0.72],
      deck: [-0.25, -0.47],
      funnels: [{ x: -0.065, s: 0.36, kind: 'oval' }],
      radomes: [{ x: 0.085, r: 0.17 }, { x: -0.135, r: 0.17 }],
      radars: [{ x: 0.01, span: 0.62 }],
      launchers: [{ x: 0.18, kind: 'seaDart', skipIf: /Sea Dart/ }],
      helo: true,
      boats: -0.03,
    },
  ],
  // Type 22 Batch 1 (Broadsword / Brilliant): no gun, Exocets forward, Sea Wolf fore and aft
  [
    /Broadsword|Brilliant|Battleaxe|Brazen/,
    {
      hull: FRIGATE,
      houses: [[0.2, -0.16, 0.62]],
      hangar: [-0.16, -0.29, 0.74],
      deck: [-0.29, -0.48],
      funnels: [{ x: -0.04, s: 0.26, kind: 'twin' }],
      radars: [{ x: 0.07, span: 0.5 }, { x: -0.12, span: 0.4 }],
      helo: true,
      boats: 0.0,
    },
  ],
  // Rothesay / Leander frigates: twin 4.5in forward, single funnel, Seacat on the hangar
  [
    /Plymouth|Rothesay|Andromeda|Leander/,
    {
      hull: FRIGATE,
      houses: [[0.18, -0.1, 0.56]],
      hangar: [-0.1, -0.24, 0.62],
      deck: [-0.24, -0.44],
      funnels: [{ x: -0.03, s: 0.3, kind: 'oval' }],
      radars: [{ x: 0.06, span: 0.46 }],
      launchers: [{ x: -0.2, kind: 'seacat' }, { x: -0.47, kind: 'limbo' }],
      helo: true,
      boats: 0.02,
    },
  ],
  // County-class DLG (Glamorgan): Exocet in B position, two funnels, Wessex deck, Sea Slug aft
  [
    /Glamorgan|Antrim|Fife|Norfolk/,
    {
      hull: DESTROYER,
      houses: [[0.17, -0.12, 0.56], [-0.12, -0.18, 0.4], [-0.27, -0.34, 0.36]],
      deck: [-0.18, -0.27],
      funnels: [{ x: 0.02, s: 0.28, kind: 'oval' }, { x: -0.095, s: 0.28, kind: 'oval' }],
      radars: [{ x: 0.07, span: 0.4 }, { x: -0.04, span: 0.7 }],
      launchers: [{ x: 0.23, kind: 'exocet' }, { x: -0.15, y: -0.38, kind: 'seacat' }, { x: -0.15, y: 0.38, kind: 'seacat' }],
      helo: true,
      boats: -0.06,
    },
  ],
  // Haruna-class DDH: two 5in forward, ASROC, one great mack, huge hangar, three-helicopter deck
  [
    /Haruna|Hiei/,
    {
      hull: DESTROYER,
      houses: [[0.06, -0.12, 0.6]],
      hangar: [-0.12, -0.23, 0.86],
      deck: [-0.23, -0.48],
      funnels: [{ x: -0.05, s: 0.38, kind: 'mack' }],
      radars: [{ x: 0.0, span: 0.5 }],
      launchers: [{ x: 0.1, kind: 'asroc' }, { x: -0.215, kind: 'seaSparrow', skipIf: /RIM-7|海麻雀/ }],
      helo: true,
    },
  ],
  // Shirane-class DDH: the Haruna enlarged, two macks
  [
    /Shirane|Kurama/,
    {
      hull: DESTROYER,
      houses: [[0.1, -0.13, 0.62]],
      hangar: [-0.13, -0.24, 0.86],
      deck: [-0.24, -0.48],
      funnels: [{ x: 0.0, s: 0.34, kind: 'mack' }, { x: -0.09, s: 0.34, kind: 'mack' }],
      radars: [{ x: 0.05, span: 0.48 }],
      launchers: [{ x: 0.14, kind: 'asroc' }, { x: -0.2, kind: 'seaSparrow' }],
      helo: true,
    },
  ],
  // Takatsuki: 5in fore and aft, ASROC, two funnels, DASH drone hangar
  [
    /Takatsuki|Kikuzuki/,
    {
      hull: DESTROYER,
      houses: [[0.14, -0.04, 0.52], [-0.12, -0.18, 0.5]],
      deck: [-0.18, -0.22],
      funnels: [{ x: 0.02, s: 0.26, kind: 'oval' }, { x: -0.08, s: 0.26, kind: 'oval' }],
      radars: [{ x: 0.07, span: 0.42 }],
      launchers: [{ x: 0.19, kind: 'asroc' }],
      boats: -0.03,
    },
  ],
  // Amatsukaze: twin 3in forward, two funnels, Tartar directors and the Mk 13 aft
  [
    /Amatsukaze/,
    {
      hull: DESTROYER,
      houses: [[0.16, -0.2, 0.5]],
      funnels: [{ x: 0.02, s: 0.26, kind: 'oval' }, { x: -0.08, s: 0.26, kind: 'oval' }],
      radars: [{ x: 0.08, span: 0.42 }, { x: -0.03, span: 0.36 }],
      dishes: [{ x: -0.16, y: -0.14 }, { x: -0.16, y: 0.14 }],
      launchers: [{ x: 0.22, kind: 'asroc' }],
      boats: -0.03,
    },
  ],
  // Hatakaze: Mk 13 forward, two macks, Harpoon, ASROC, 5in fore and aft
  [
    /Hatakaze|Shimakaze/,
    {
      hull: DESTROYER,
      houses: [[0.13, -0.2, 0.56]],
      funnels: [{ x: 0.02, s: 0.3, kind: 'mack' }, { x: -0.09, s: 0.3, kind: 'mack' }],
      radars: [{ x: 0.07, span: 0.5 }],
      dishes: [{ x: -0.17, y: -0.14 }, { x: -0.17, y: 0.14 }],
      launchers: [{ x: 0.21, kind: 'mk13' }, { x: -0.13, kind: 'harpoon' }, { x: -0.26, kind: 'asroc' }],
      boats: -0.04,
    },
  ],
  // Hatsuyuki / Asagiri: 76mm, ASROC, mack(s), Harpoon, hangar, deck, Sea Sparrow at the stern
  [
    /Hatsuyuki|Asagiri/,
    {
      hull: FRIGATE,
      houses: [[0.13, -0.12, 0.56]],
      hangar: [-0.12, -0.23, 0.68],
      deck: [-0.23, -0.42],
      funnels: [{ x: 0.0, s: 0.3, kind: 'mack' }],
      radars: [{ x: 0.06, span: 0.46 }],
      launchers: [{ x: 0.2, kind: 'asroc' }, { x: -0.07, kind: 'harpoon' }, { x: -0.455, kind: 'seaSparrow', skipIf: /海麻雀/ }],
      helo: true,
    },
  ],
  // Tromp: twin 120mm, Sea Sparrow, the great 3D radome on the bridge, Mk 13 aft
  [
    /Tromp|De Ruyter \(F806/,
    {
      hull: DESTROYER,
      houses: [[0.16, -0.08, 0.58]],
      hangar: [-0.08, -0.19, 0.7],
      deck: [-0.19, -0.33],
      funnels: [{ x: -0.03, s: 0.28, kind: 'oval' }],
      radomes: [{ x: 0.07, r: 0.62 }],
      dishes: [{ x: -0.36 }],
      launchers: [{ x: 0.22, kind: 'seaSparrow' }, { x: -0.41, kind: 'mk13' }],
      helo: true,
      boats: 0.0,
    },
  ],
  // Suffren: two 100mm forward, DRBI 23 dome on the mack, Malafon, Masurca aft
  [
    /Suffren|Duquesne/,
    {
      hull: DESTROYER,
      houses: [[0.15, -0.12, 0.56], [-0.14, -0.3, 0.3]],
      funnels: [{ x: -0.05, s: 0.34, kind: 'mack' }],
      radomes: [{ x: 0.03, r: 0.58 }],
      dishes: [{ x: -0.32, y: -0.14 }, { x: -0.32, y: 0.14 }],
      launchers: [{ x: -0.1, kind: 'exocet' }, { x: -0.22, kind: 'malafon' }, { x: -0.41, kind: 'masurca' }],
      boats: -0.05,
    },
  ],
  // Georges Leygues: 100mm, mack, Exocet, hangar, deck, Crotale on the hangar
  [
    /Georges Leygues|Dupleix|Montcalm/,
    {
      hull: FRIGATE,
      houses: [[0.22, -0.1, 0.56]],
      hangar: [-0.1, -0.22, 0.64],
      deck: [-0.22, -0.46],
      funnels: [{ x: 0.0, s: 0.32, kind: 'mack' }],
      radars: [{ x: 0.1, span: 0.5 }],
      launchers: [{ x: -0.06, kind: 'exocet' }, { x: -0.16, kind: 'crotale' }],
      helo: true,
    },
  ],
  // Tourville: 100mm forward, big radar mack, Malafon, hangar and deck, Crotale
  [
    /Tourville|Duguay/,
    {
      hull: DESTROYER,
      houses: [[0.17, -0.07, 0.56]],
      hangar: [-0.17, -0.28, 0.66],
      deck: [-0.28, -0.46],
      funnels: [{ x: -0.02, s: 0.34, kind: 'mack' }],
      radars: [{ x: 0.08, span: 0.56 }],
      launchers: [{ x: -0.12, kind: 'malafon' }, { x: 0.22, kind: 'exocet' }, { x: -0.22, kind: 'crotale', skipIf: /Crotale/ }],
      helo: true,
    },
  ],
  // Bremen (F122): 76mm, NATO Sea Sparrow before the bridge, funnel, Harpoon, twin-hangar deck
  [
    /Bremen|Kortenaer \(F807|Emden/,
    {
      hull: FRIGATE,
      houses: [[0.11, -0.13, 0.56]],
      hangar: [-0.13, -0.25, 0.72],
      deck: [-0.25, -0.47],
      funnels: [{ x: -0.04, s: 0.3, kind: 'oval' }],
      radars: [{ x: 0.05, span: 0.46 }],
      launchers: [{ x: 0.17, kind: 'seaSparrow', skipIf: /海麻雀|Sea Sparrow/ }, { x: -0.1, kind: 'harpoon' }],
      helo: true,
    },
  ],
  // Iroquois (DDH 280): 127mm, Sea Sparrow deckhouse, splayed twin funnels, twin hangar, Limbo
  [
    /Iroquois|Huron|Athabaskan \(282|Algonquin/,
    {
      hull: DESTROYER,
      houses: [[0.2, -0.1, 0.58]],
      hangar: [-0.1, -0.24, 0.76],
      deck: [-0.24, -0.45],
      funnels: [{ x: -0.04, s: 0.3, kind: 'vsplit' }],
      radars: [{ x: 0.05, span: 0.5 }],
      launchers: [{ x: 0.17, y: -0.2, kind: 'seaSparrow' }, { x: 0.17, y: 0.2, kind: 'seaSparrow' }, { x: -0.47, kind: 'limbo' }],
      helo: true,
    },
  ],
  // Casco-class ex-US Coast Guard cutters (RVNS Trần Quang Khải and sisters): 5in/38 forward,
  // single funnel, the long open seaplane-tender quarterdeck aft
  [
    /Trần Quang Khải|Trần Bình Trọng|Trần Nhật Duật|Lý Thường Kiệt/,
    {
      hull: CUTTER,
      houses: [[0.2, -0.12, 0.54]],
      funnels: [{ x: 0.0, s: 0.3, kind: 'oval' }],
      radars: [{ x: 0.1, span: 0.36 }],
      boats: -0.06,
    },
  ],
];

export function drawColdWarAlliedShip(rc: RenderContext, ship: Ship, hullColor: string, detailColor: string): boolean {
  // Only the post-war navies (era 4-5): the WWII Leander / Sheffield / De Ruyter share names
  if (ship.era !== 'era4' && ship.era !== 'era5') return false;
  const hit = LAYOUTS.find(([re]) => re.test(ship.name));
  if (!hit) return false;
  const lay = hit[1];
  const ctx = rc.ctx;
  const l = ship.length;
  const w = ship.width;
  const X = (f: number) => f * l;
  const Y = (f: number) => f * w;

  drawHullShape(ctx, l, w, lay.hull, '#081726', hullColor, 1.8);
  // Deck-edge sheer line and the forecastle anchor gear
  ctx.strokeStyle = 'rgba(176, 190, 197, 0.25)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(X(0.42), Y(-0.08));
  ctx.lineTo(X(0.46), 0);
  ctx.lineTo(X(0.42), Y(0.08));
  ctx.stroke();

  // Flight deck with its landing circle and centreline
  if (lay.deck) {
    const [a, b] = lay.deck;
    ctx.fillStyle = '#0B1C2C';
    ctx.fillRect(X(b), Y(-0.4), X(a - b), Y(0.8));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(X(b), Y(-0.4), X(a - b), Y(0.8));
    const cx = X((a + b) / 2);
    ctx.beginPath();
    ctx.arc(cx, 0, Math.min(Y(0.3), X((a - b) / 2) * 0.8), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([1.6, 1.4]);
    ctx.beginPath();
    ctx.moveTo(X(a), 0);
    ctx.lineTo(X(b), 0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Deckhouses (bridge first, with its window strip)
  lay.houses.forEach(([a, b, wf], i) => {
    ctx.fillStyle = '#0E243A';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(X(b), Y(-wf / 2), X(a - b), Y(wf), Math.min(2, Y(0.08)));
    ctx.fill();
    ctx.stroke();
    if (i === 0) {
      ctx.fillStyle = 'rgba(128, 222, 234, 0.55)';
      ctx.fillRect(X(a) - 1.4, Y(-wf * 0.36), 0.9, Y(wf * 0.72));
    }
  });

  // Hangar with its roller door facing the deck
  if (lay.hangar) {
    const [a, b, wf] = lay.hangar;
    ctx.fillStyle = '#122C44';
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 1;
    ctx.fillRect(X(b), Y(-wf / 2), X(a - b), Y(wf));
    ctx.strokeRect(X(b), Y(-wf / 2), X(a - b), Y(wf));
    ctx.strokeStyle = 'rgba(176, 190, 197, 0.5)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(X(b) + 0.6 * k, Y(-wf * 0.42));
      ctx.lineTo(X(b) + 0.6 * k, Y(wf * 0.42));
    }
    ctx.stroke();
  }

  // Ship's boats in their davits
  if (lay.boats !== undefined) {
    ctx.fillStyle = '#ECEFF1';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(X(lay.boats), s * Y(0.43), X(0.035), Y(0.06), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Funnels
  for (const f of lay.funnels) {
    const fx = X(f.x);
    const r = Y(f.s) / 2;
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 0.9;
    if (f.kind === 'mack') {
      // Combined mast and stack: lattice over the exhaust
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.roundRect(fx - r * 1.1, -r, r * 2.2, r * 2, r * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(176, 190, 197, 0.6)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(fx - r, -r * 0.8);
      ctx.lineTo(fx + r, r * 0.8);
      ctx.moveTo(fx - r, r * 0.8);
      ctx.lineTo(fx + r, -r * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#0A0F14';
      ctx.fillRect(fx - r * 0.9, -r * 0.35, r * 0.6, r * 0.7);
    } else {
      const spots =
        f.kind === 'twin' ? [[0, -r * 0.62, 0], [0, r * 0.62, 0]] : f.kind === 'vsplit' ? [[0, -r * 0.75, -0.5], [0, r * 0.75, 0.5]] : [[0, 0, 0]];
      for (const [ox, oy, rot] of spots) {
        const rr = f.kind === 'oval' ? r : r * 0.62;
        ctx.fillStyle = '#263238';
        ctx.strokeStyle = detailColor;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(fx + ox, oy, rr * 1.35, rr, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0A0F14';
        ctx.beginPath();
        ctx.ellipse(fx + ox - rr * 0.3, oy, rr * 0.7, rr * 0.55, rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Search radar arrays across the masts
  for (const r of lay.radars ?? []) {
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(X(r.x), Y(-r.span / 2));
    ctx.lineTo(X(r.x), Y(r.span / 2));
    ctx.stroke();
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.arc(X(r.x), 0, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const d of lay.dishes ?? []) {
    ctx.fillStyle = '#CFD8DC';
    ctx.strokeStyle = '#607D8B';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(X(d.x), Y(d.y ?? 0), Math.max(1, Y(0.08)), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Radomes (Type 909 domes, Tromp's 3D radar, Suffren's DRBI 23)
  for (const r of lay.radomes ?? []) {
    ctx.fillStyle = '#ECEFF1';
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(X(r.x), 0, Y(r.r) / 2 + 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(X(r.x) - Y(r.r) * 0.12, -Y(r.r) * 0.12, Y(r.r) * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Missile launchers not carried in the turret data
  for (const L of lay.launchers ?? []) {
    if (L.skipIf && ship.turrets.some((t) => L.skipIf!.test(t.caliber))) continue;
    drawLauncher(ctx, X(L.x), Y(L.y ?? 0), L.kind, l, w);
  }

  // Lynx / Sea King / Wasp on the flight deck
  if (lay.helo && lay.deck) {
    const cx = X((lay.deck[0] + lay.deck[1]) / 2);
    const s = Math.min(Y(0.26), X(lay.deck[0] - lay.deck[1]) * 0.35);
    ctx.fillStyle = '#546E7A';
    ctx.strokeStyle = '#B0BEC5';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, 0, s, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx - s * 1.9, -0.35, s * 1.2, 0.7);
    ctx.strokeStyle = 'rgba(207, 216, 220, 0.75)';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(cx - s * 1.3, -s * 1.3);
    ctx.lineTo(cx + s * 1.3, s * 1.3);
    ctx.moveTo(cx - s * 1.3, s * 1.3);
    ctx.lineTo(cx + s * 1.3, -s * 1.3);
    ctx.stroke();
  }

  drawShipTurrets(rc, ship, hullColor);
  return true;
}

function drawLauncher(ctx: CanvasRenderingContext2D, x: number, y: number, kind: LauncherKind, l: number, w: number): void {
  ctx.save();
  ctx.translate(x, y);
  const u = Math.max(1, w * 0.06);
  const base = (r: number) => {
    ctx.fillStyle = '#37474F';
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  const rails = (n: number, len: number, gap: number, color = '#ECEFF1', width = 0.9) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const yy = (k - (n - 1) / 2) * gap;
      ctx.moveTo(-len * 0.2, yy);
      ctx.lineTo(len * 0.8, yy);
    }
    ctx.stroke();
  };
  const cells = (cols: number, rows: number, cw: number, color: string) => {
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.fillRect((-cols * cw) / 2, (-rows * cw) / 2, cols * cw, rows * cw);
    ctx.strokeRect((-cols * cw) / 2, (-rows * cw) / 2, cols * cw, rows * cw);
    ctx.beginPath();
    for (let c = 1; c < cols; c++) {
      ctx.moveTo((-cols * cw) / 2 + c * cw, (-rows * cw) / 2);
      ctx.lineTo((-cols * cw) / 2 + c * cw, (rows * cw) / 2);
    }
    for (let r = 1; r < rows; r++) {
      ctx.moveTo((-cols * cw) / 2, (-rows * cw) / 2 + r * cw);
      ctx.lineTo((cols * cw) / 2, (-rows * cw) / 2 + r * cw);
    }
    ctx.stroke();
  };
  switch (kind) {
    case 'seaDart':
      base(u * 2);
      rails(2, u * 5, u * 1.6);
      break;
    case 'mk13':
      base(u * 2);
      rails(1, u * 5, 0, '#ECEFF1', 1.2);
      break;
    case 'seaSlug':
    case 'masurca':
      base(u * 2.4);
      rails(2, u * 7, u * 1.9, '#ECEFF1', 1.3);
      // Magazine trunk running forward from the launcher
      ctx.fillStyle = 'rgba(38, 50, 56, 0.9)';
      ctx.fillRect(u * 2.6, -u * 1.2, l * 0.06, u * 2.4);
      break;
    case 'seaWolf':
      cells(3, 2, u * 1.3, '#FFB300');
      break;
    case 'seaSparrow':
      cells(4, 2, u * 1.1, '#80DEEA');
      break;
    case 'asroc':
      cells(4, 2, u * 1.2, '#FFD54F');
      break;
    case 'crotale':
      base(u * 1.6);
      cells(4, 2, u * 0.75, '#80DEEA');
      break;
    case 'exocet':
    case 'harpoon': {
      // Two angled pairs of canisters trained outboard
      ctx.fillStyle = kind === 'exocet' ? '#B0BEC5' : '#90A4AE';
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 0.4;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(0, s * w * 0.16);
        ctx.rotate(s * 0.35);
        for (const k of [-0.5, 0.5]) {
          ctx.fillRect(-l * 0.035, k * u * 1.3 - u * 0.5, l * 0.07, u);
          ctx.strokeRect(-l * 0.035, k * u * 1.3 - u * 0.5, l * 0.07, u);
        }
        ctx.restore();
      }
      break;
    }
    case 'malafon':
      // Malafon's long launching ramp on the centreline
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#FFB300';
      ctx.lineWidth = 0.6;
      ctx.fillRect(-l * 0.05, -u * 1.1, l * 0.1, u * 2.2);
      ctx.strokeRect(-l * 0.05, -u * 1.1, l * 0.1, u * 2.2);
      break;
    case 'seacat':
      base(u * 1.2);
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const a of [0.6, -0.6, Math.PI - 0.6, Math.PI + 0.6]) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * u * 2.2, Math.sin(a) * u * 2.2);
      }
      ctx.stroke();
      break;
    case 'limbo':
      // Limbo mortar well at the stern
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 0.5;
      ctx.fillRect(-u * 1.5, -u * 1.6, u * 3, u * 3.2);
      ctx.strokeRect(-u * 1.5, -u * 1.6, u * 3, u * 3.2);
      break;
  }
  ctx.restore();
}
