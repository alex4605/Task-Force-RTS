import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { NavalEnsign } from './index';

/**
 * Class-specific superstructure for Commonwealth and NATO ships of the allied surface action
 * groups, drawn over the shared hull outline. Each class carries the features that identify it
 * from the air: funnel count and rake, missile launchers, radomes, hangars and flight decks.
 */

function funnel(ctx: CanvasRenderingContext2D, x: number, rx: number, ry: number): void {
  ctx.fillStyle = '#1A2530';
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(x, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0B0F14';
  ctx.beginPath();
  ctx.ellipse(x, 0, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = '#263849'): void {
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#B0BEC5';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function flightDeck(ctx: CanvasRenderingContext2D, x: number, l: number, w: number, len: number): void {
  ctx.fillStyle = '#1E2C38';
  ctx.fillRect(x, -w * 0.36, l * len, w * 0.72);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 0.9;
  ctx.strokeRect(x, -w * 0.36, l * len, w * 0.72);
  ctx.beginPath();
  ctx.arc(x + l * len * 0.5, 0, w * 0.2, 0, Math.PI * 2);
  ctx.stroke();
}

function launcherBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string): void {
  ctx.fillStyle = '#37474F';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}

type ClassDrawer = (ctx: CanvasRenderingContext2D, l: number, w: number, rc: RenderContext) => void;

/** County-class heavy cruiser: high flush deck and the three tall, evenly spaced funnels. */
const countyHeavyCruiser: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.1, -w * 0.24, l * 0.12, w * 0.48);
  for (const x of [l * 0.02, -l * 0.08, -l * 0.18]) funnel(ctx, x, 3.6, 2.6);
  // Catapult and crane between the after funnel and X turret
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-l * 0.28, -w * 0.3, l * 0.06, w * 0.6);
};

/** Leander-class light cruiser (HMAS Hobart): one large trunked funnel. */
const leanderCruiser: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.08, -w * 0.24, l * 0.12, w * 0.48);
  funnel(ctx, -l * 0.06, 6, 3.4);
};

/** Tribal-class destroyer: two funnels, the fore funnel larger, between a tall bridge and the torpedo tubes. */
const tribalDestroyer: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
  funnel(ctx, -l * 0.02, 3.8, 2.8);
  funnel(ctx, -l * 0.12, 3, 2.4);
  ctx.fillStyle = '#455A64';
  ctx.fillRect(-l * 0.24, -w * 0.12, l * 0.08, w * 0.24);
};

/** Daring-class destroyer (HMAS Vampire, HMS Defender): one big funnel enclosing the foremast "mack". */
const daringDestroyer: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.08, -w * 0.26, l * 0.12, w * 0.52);
  funnel(ctx, -l * 0.05, 6, 3.4);
  ctx.strokeStyle = '#B0BEC5';
  ctx.beginPath();
  ctx.moveTo(-l * 0.05, -w * 0.3);
  ctx.lineTo(-l * 0.05, w * 0.3);
  ctx.stroke();
};

/** Single-funnel wartime destroyer or frigate (Q / J class, Loch class, PC-701). */
const singleFunnelEscort: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.08, -w * 0.24, l * 0.12, w * 0.48);
  funnel(ctx, -l * 0.04, 3.6, 2.6);
};

/** Type 22 Broadsword: no gun, Sea Wolf six-packs fore and aft, four Exocet boxes on the forecastle, a big hangar. */
const type22Frigate: ClassDrawer = (ctx, l, w) => {
  for (const [x, y] of [[l * 0.36, -w * 0.18], [l * 0.36, w * 0.18], [l * 0.3, -w * 0.18], [l * 0.3, w * 0.18]] as const) {
    launcherBox(ctx, x, y, l * 0.05, w * 0.14, '#FFAB40');
  }
  launcherBox(ctx, l * 0.22, 0, l * 0.06, w * 0.34, '#80DEEA');
  block(ctx, -l * 0.02, -w * 0.28, l * 0.18, w * 0.56);
  funnel(ctx, -l * 0.1, 4.2, 3);
  block(ctx, -l * 0.26, -w * 0.3, l * 0.1, w * 0.6, '#1E2C38');
  launcherBox(ctx, -l * 0.2, 0, l * 0.05, w * 0.3, '#80DEEA');
  flightDeck(ctx, -l * 0.46, l, w, 0.18);
};

/** County-class guided-missile destroyer: twin funnels, the Type 965 bedstead radar, Seaslug twin launcher on the quarterdeck. */
const countyDlg: ClassDrawer = (ctx, l, w, rc) => {
  block(ctx, l * 0.12, -w * 0.26, l * 0.12, w * 0.52);
  funnel(ctx, l * 0.02, 3.4, 2.6);
  funnel(ctx, -l * 0.12, 3.4, 2.6);
  const rot = rc.time * 1.4;
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(l * 0.07 - Math.cos(rot) * 6, -Math.sin(rot) * 6);
  ctx.lineTo(l * 0.07 + Math.cos(rot) * 6, Math.sin(rot) * 6);
  ctx.stroke();
  // Long Seaslug magazine running aft to the twin launcher
  ctx.fillStyle = '#2E3B47';
  ctx.fillRect(-l * 0.4, -w * 0.08, l * 0.22, w * 0.16);
  launcherBox(ctx, -l * 0.42, 0, l * 0.05, w * 0.36, '#FFD54F');
  flightDeck(ctx, -l * 0.3, l, w, 0.1);
};

/** Charles F. Adams derivatives (Perth class, Lütjens): two macks, Mk 13 launcher aft, Ikara / ASROC amidships. */
const adamsDerivative: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.14, -w * 0.24, l * 0.12, w * 0.48);
  funnel(ctx, l * 0.04, 3.4, 2.4);
  funnel(ctx, -l * 0.1, 3.4, 2.4);
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-l * 0.04, -w * 0.12, l * 0.06, w * 0.24);
  ctx.fillStyle = '#455A64';
  ctx.beginPath();
  ctx.arc(-l * 0.3, 0, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFD54F';
  ctx.stroke();
};

/** Tromp class: the huge SPS-01 three-dimensional radar radome ("Kojak") atop the bridge. */
const trompFrigate: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.04, -w * 0.28, l * 0.2, w * 0.56);
  funnel(ctx, -l * 0.1, 4, 2.8);
  ctx.fillStyle = '#ECEFF1';
  ctx.strokeStyle = '#90A4AE';
  ctx.beginPath();
  ctx.arc(l * 0.12, 0, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  launcherBox(ctx, -l * 0.32, 0, l * 0.05, w * 0.2, '#FFD54F');
  flightDeck(ctx, -l * 0.46, l, w, 0.1);
};

/** Iroquois-class DDH-280: twin funnels splayed outboard in a V, a large twin hangar and Sea King deck aft. */
const iroquoisDdh: ClassDrawer = (ctx, l, w) => {
  block(ctx, l * 0.12, -w * 0.26, l * 0.12, w * 0.52);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(0, s * w * 0.14);
    ctx.rotate(s * 0.35);
    funnel(ctx, 0, 3.4, 2.2);
    ctx.restore();
  }
  block(ctx, -l * 0.22, -w * 0.32, l * 0.14, w * 0.64, '#1E2C38');
  flightDeck(ctx, -l * 0.46, l, w, 0.24);
};

/** Generic layout from a funnel list and fittings: covers the rest of the Commonwealth, Dutch, French and Japanese ships. */
function layout(funnels: number[], opts: { bridge?: number; radome?: number; deck?: number; launcher?: number; mack?: boolean } = {}): ClassDrawer {
  return (ctx, l, w) => {
    block(ctx, l * (opts.bridge ?? 0.12), -w * 0.24, l * 0.12, w * 0.48);
    for (const f of funnels) {
      if (opts.mack) {
        // Japanese "mack" (combined mast-stack) and French block funnels: tall rectangular
        block(ctx, l * f - 3, -w * 0.16, 6, w * 0.32, '#1A2530');
      } else {
        funnel(ctx, l * f, 3.6, 2.4);
      }
    }
    if (opts.radome !== undefined) {
      // Big fire-control / search radome (Suffren's DRBI 23 golf ball)
      ctx.fillStyle = '#ECEFF1';
      ctx.strokeStyle = '#90A4AE';
      ctx.beginPath();
      ctx.arc(l * opts.radome, 0, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (opts.launcher !== undefined) launcherBox(ctx, l * opts.launcher, 0, l * 0.05, w * 0.3, '#FFB300');
    if (opts.deck !== undefined) flightDeck(ctx, -l * 0.46, l, w, opts.deck);
  };
}

const CLASS_RULES: Array<[RegExp, ClassDrawer]> = [
  [/De Ruyter/, layout([-0.04], { bridge: 0.1 })],
  [/Exeter/, layout([0.02, -0.08])],
  [/Electra|Kortenaer|Grenville|Napier|Evertsen/, layout([0.0])],
  [/Argonaut|Belfast/, layout([0.04, -0.1])],
  [/Achilles/, leanderCruiser],
  [/Athabaskan/, tribalDestroyer],
  [/Murchison|Grandière|Trần Hưng Đạo/, layout([-0.02], { bridge: 0.08 })],
  [/Brisbane/, adamsDerivative],
  [/Chungbuk/, layout([0.04, -0.1])],
  [/Coventry|Glasgow/, layout([-0.04], { launcher: 0.24, deck: 0.18 })],
  [/Plymouth/, layout([-0.02], { launcher: -0.3 })],
  [/Suffren/, layout([0.12], { radome: -0.02, launcher: -0.36, mack: true })],
  [/Georges Leygues/, layout([0.02], { deck: 0.24, launcher: -0.12 })],
  [/Shirane/, layout([0.06, -0.06], { deck: 0.3, mack: true })],
  [/Hatakaze/, layout([0.04, -0.06], { launcher: 0.3, mack: true })],
  [/Hatsuyuki/, layout([0.0], { deck: 0.22, mack: true })],
  [/Australia|Canberra|Shropshire/, countyHeavyCruiser],
  [/HMAS Hobart 荷巴特號 \(D63\)/, leanderCruiser],
  [/Arunta|Warramunga|Bataan|Cayuga|Cossack/, tribalDestroyer],
  [/Vampire|Defender/, daringDestroyer],
  [/Quilliam|Jervis|Rotoiti|Baekdusan/, singleFunnelEscort],
  [/Broadsword|Brilliant/, type22Frigate],
  [/Glamorgan/, countyDlg],
  [/D39|D38|Perth|Lütjens/, adamsDerivative],
  [/Tromp/, trompFrigate],
  [/Iroquois/, iroquoisDdh],
];

/** Draws the ship's class features if it belongs to one of the classes above; false otherwise. */
export function drawAlliedClassFeatures(rc: RenderContext, ship: Ship, l: number, w: number): boolean {
  const rule = CLASS_RULES.find(([re]) => re.test(ship.name));
  if (!rule) return false;
  rule[1](rc.ctx, l, w, rc);
  return true;
}

/**
 * The ensign each allied navy flew: the White Ensign for the Royal Navy and, until they adopted
 * their own (RAN 1967, RCN 1965), the Australian and Canadian navies; national ensigns otherwise.
 */
export function alliedEnsign(ship: Ship): NavalEnsign | undefined {
  const early = ship.era === 'era1' || ship.era === 'era2' || ship.era === 'era3';
  const n = ship.name;
  if (n.startsWith('HMS ') || n.startsWith('HMNZS ')) return 'white_ensign';
  if (n.startsWith('HMAS ')) return early ? 'white_ensign' : 'au_white_ensign';
  if (n.startsWith('HMCS ')) return early ? 'white_ensign' : 'ca_ensign';
  if (n.startsWith('HNLMS ')) return 'nl_ensign';
  if (n.startsWith('ROKS ')) return 'rok_ensign';
  if (n.startsWith('FGS ')) return 'de_bundesmarine';
  if (n.startsWith('FS ')) return 'fr_marine';
  if (n.startsWith('JDS ')) return 'rising_sun';
  return undefined;
}
