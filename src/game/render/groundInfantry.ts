/**
 * Infantry teams seen from above: each soldier is shoulders, helmet, pack and the weapon he
 * carries, in his own army's uniform and headgear, so a USMC fireteam with its BAR, an IJA
 * section with Arisakas and a Type 96, and an NVA cell in pith helmets with an RPG read as
 * different armies before the APP-6 symbol is even checked.
 */
import type { PlanPalette } from './groundPlan';

export type InfantryWeapon = 'rifle' | 'long_rifle' | 'smg' | 'bar' | 'lmg' | 'type96' | 'rpg' | 'bazooka' | 'at4' | 'm79' | 'flame' | 'satchel' | 'radio' | 'knee_mortar' | 'detector' | 'none';
type Helmet = 'm1' | 'm1_cover' | 'ija' | 'soviet' | 'pasgt' | 'pith' | 'slouch' | 'brodie';

interface Kit {
  uniform: string;
  /** Second colour for camouflage patterns (woodland, frog-skin). */
  camo?: string;
  helmet: Helmet;
  helmetColour: string;
  pack: 'haversack' | 'alice' | 'veshmeshok' | 'ruck' | 'none';
}

const KITS = {
  usmc_ww2: { uniform: '#5F6E46', camo: '#3E4A2C', helmet: 'm1_cover', helmetColour: '#6C7A49', pack: 'haversack' },
  us_korea: { uniform: '#5B5E3C', helmet: 'm1', helmetColour: '#4B5531', pack: 'haversack' },
  us_vietnam: { uniform: '#4E5A36', helmet: 'm1_cover', helmetColour: '#5A6A3C', pack: 'alice' },
  us_83: { uniform: '#4F5638', camo: '#2F2A1F', helmet: 'pasgt', helmetColour: '#4F5638', pack: 'alice' },
  ija: { uniform: '#8C7D4E', helmet: 'ija', helmetColour: '#7B6F45', pack: 'ruck' },
  soviet: { uniform: '#6B6A43', helmet: 'soviet', helmetColour: '#4C5A2E', pack: 'veshmeshok' },
  nva: { uniform: '#56603F', helmet: 'pith', helmetColour: '#7E8A5A', pack: 'ruck' },
  // Australians in jungle green with the slouch hat; Commonwealth battledress with the Brodie helmet
  au_ww2: { uniform: '#4F5A3A', helmet: 'slouch', helmetColour: '#7A6A48', pack: 'haversack' },
  cw_korea: { uniform: '#6B6A48', helmet: 'brodie', helmetColour: '#5A5A3C', pack: 'haversack' },
  rok_marine: { uniform: '#5E6B3E', camo: '#2F3A22', helmet: 'm1_cover', helmetColour: '#56663A', pack: 'alice' },
  arvn_ranger: { uniform: '#556140', camo: '#26261A', helmet: 'm1_cover', helmetColour: '#4E5E36', pack: 'alice' },
  au_vietnam: { uniform: '#4C5638', helmet: 'slouch', helmetColour: '#6A6646', pack: 'alice' },
  // Bundeswehr 1983: olive "Moleskin" (Flecktarn only from 1990), M1-pattern steel helmet
  frg_83: { uniform: '#5E6142', helmet: 'm1', helmetColour: '#4E5236', pack: 'alice' },
} satisfies Record<string, Kit>;

interface Member {
  x: number;
  y: number;
  w: InfantryWeapon;
}

interface TeamSpec {
  match: RegExp;
  kit: Kit;
  men: Member[];
  prone?: boolean;
  foliage?: boolean;
}

const WEDGE4 = (a: InfantryWeapon, b: InfantryWeapon, c: InfantryWeapon, d: InfantryWeapon): Member[] => [
  { x: 4.2, y: 0, w: a },
  { x: 0.2, y: -4.4, w: b },
  { x: 0.2, y: 4.4, w: c },
  { x: -4.4, y: 0.3, w: d },
];

const TEAMS: TeamSpec[] = [
  // Marine Raiders: Thompsons, BAR, Johnson LMG
  { match: /raider/, kit: KITS.usmc_ww2, men: WEDGE4('smg', 'bar', 'smg', 'lmg') },
  // US Army 1945 (Okinawa): Garand, BAR, bazooka
  { match: /us_army_rifle_45/, kit: KITS.us_korea, men: WEDGE4('rifle', 'bar', 'bazooka', 'rifle') },
  // Australian infantry: Owen gun, Bren (top magazine), Lee-Enfields
  { match: /cw_infantry_ww2/, kit: KITS.au_ww2, men: WEDGE4('smg', 'type96', 'long_rifle', 'long_rifle') },
  // ROK Army 1950 in US kit
  { match: /rok_infantry/, kit: KITS.us_korea, men: WEDGE4('rifle', 'bar', 'rifle', 'rifle') },
  // Commonwealth Division: Lee-Enfield, Bren, Sten
  { match: /cw_infantry_50/, kit: KITS.cw_korea, men: WEDGE4('long_rifle', 'type96', 'smg', 'long_rifle') },
  { match: /rok_marine/, kit: KITS.rok_marine, men: WEDGE4('rifle', 'lmg', 'm79', 'rifle') },
  { match: /arvn_ranger/, kit: KITS.arvn_ranger, men: WEDGE4('rifle', 'lmg', 'm79', 'radio') },
  // 1 ATF: L1A1 SLR, M60, Owen
  { match: /au_rar/, kit: KITS.au_vietnam, men: WEDGE4('long_rifle', 'lmg', 'smg', 'long_rifle') },
  // Panzergrenadiere: G3, MG3, Panzerfaust
  { match: /frg_infantry/, kit: KITS.frg_83, men: WEDGE4('rifle', 'lmg', 'at4', 'rifle') },
  // USMC fireteam: leader, BAR man, two riflemen (1945 brings an M2 flamethrower)
  { match: /usmc_rifle_42/, kit: KITS.usmc_ww2, men: WEDGE4('rifle', 'bar', 'rifle', 'rifle') },
  { match: /usmc_rifle_45/, kit: KITS.usmc_ww2, men: WEDGE4('rifle', 'bar', 'flame', 'bazooka') },
  // Korea: Garand, BAR, 3.5in Super Bazooka, radioman
  { match: /korea/, kit: KITS.us_korea, men: WEDGE4('rifle', 'bar', 'bazooka', 'radio') },
  // 1965: M16, M60, M79
  { match: /air_assault_65/, kit: KITS.us_vietnam, men: WEDGE4('rifle', 'lmg', 'm79', 'radio') },
  { match: /platoon_65/, kit: KITS.us_vietnam, men: WEDGE4('rifle', 'lmg', 'm79', 'rifle') },
  // 1983: PASGT, M16A2, M249 SAW, AT4
  { match: /rifle_83/, kit: KITS.us_83, men: WEDGE4('rifle', 'lmg', 'at4', 'rifle') },
  // IJA section: Arisakas with bayonets, Type 96 LMG with its top magazine, Type 89 knee mortar
  { match: /opfor_infantry_42/, kit: KITS.ija, men: WEDGE4('long_rifle', 'type96', 'long_rifle', 'long_rifle') },
  { match: /opfor_infantry_45/, kit: KITS.ija, men: WEDGE4('long_rifle', 'type96', 'knee_mortar', 'long_rifle') },
  // Soviet-pattern motor rifles: AK, PK, RPG-7
  { match: /coldwar_infantry|motor_rifle/, kit: KITS.soviet, men: WEDGE4('rifle', 'lmg', 'rpg', 'rifle') },
  // NVA / VC sappers crawling with satchel charges
  { match: /sapper/, kit: KITS.nva, prone: true, men: [{ x: 4.5, y: -2.8, w: 'satchel' }, { x: 2.5, y: 3, w: 'satchel' }, { x: -3, y: 0, w: 'rifle' }] },
  // Ambush: concealed in the brush, RPG and an RPD
  { match: /ambush/, kit: KITS.nva, foliage: true, men: [{ x: 3, y: -3.2, w: 'rpg' }, { x: 3, y: 3.2, w: 'rifle' }, { x: -2.2, y: 0, w: 'lmg' }] },
  // Patrol in file
  { match: /patrol/, kit: KITS.nva, men: [{ x: 6.5, y: 0, w: 'rifle' }, { x: 2, y: 0.8, w: 'smg' }, { x: -2.5, y: -0.6, w: 'rifle' }, { x: -7, y: 0.4, w: 'rpg' }] },
];
const DEFAULT_TEAM: TeamSpec = { match: /./, kit: KITS.us_korea, men: [{ x: 3.8, y: 0, w: 'rifle' }, { x: -2.4, y: -4, w: 'rifle' }, { x: -2.4, y: 4, w: 'rifle' }] };

function rnd(i: number): number {
  const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return v - Math.floor(v);
}

// ── weapons (soldier faces +x; weapon carried on the right, +y) ─────────────

function drawWeapon(ctx: CanvasRenderingContext2D, w: InfantryWeapon, pal: PlanPalette) {
  const steel = pal.barrelColor;
  const wood = '#8D6E63';
  const y = 0.65;
  ctx.lineCap = 'round';
  const line = (x0: number, x1: number, width: number, colour: string, yy = y) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
  };
  switch (w) {
    case 'rifle':
      line(-0.4, 1.6, 0.55, wood);
      line(1.6, 4.4, 0.35, steel);
      break;
    case 'long_rifle':
      // Arisaka Type 38/99 with a long bayonet fixed
      line(-0.4, 1.8, 0.55, wood);
      line(1.8, 4.8, 0.35, steel);
      line(4.8, 6.4, 0.2, '#ECEFF1');
      break;
    case 'smg':
      line(-0.2, 1.2, 0.5, wood);
      line(1.2, 3.0, 0.4, steel);
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.arc(1.5, y + 0.55, 0.45, 0, Math.PI * 2); // drum / magazine
      ctx.fill();
      break;
    case 'bar':
      line(-0.4, 1.8, 0.6, wood);
      line(1.8, 5.0, 0.45, steel);
      ctx.strokeStyle = steel;
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(4.3, y);
      ctx.lineTo(4.9, y - 0.9);
      ctx.moveTo(4.3, y);
      ctx.lineTo(4.9, y + 0.9);
      ctx.stroke();
      break;
    case 'lmg':
      // M60 / PK / RPD: heavier receiver, bipod, belt
      line(-0.6, 1.6, 0.7, '#455A64');
      line(1.6, 5.4, 0.5, steel);
      ctx.strokeStyle = '#C9A227';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(1.0, y + 0.4);
      ctx.quadraticCurveTo(0.6, y + 1.6, -0.6, y + 1.2);
      ctx.stroke();
      ctx.strokeStyle = steel;
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(4.6, y);
      ctx.lineTo(5.2, y - 1);
      ctx.moveTo(4.6, y);
      ctx.lineTo(5.2, y + 1);
      ctx.stroke();
      break;
    case 'type96':
      line(-0.5, 1.8, 0.65, wood);
      line(1.8, 5.2, 0.45, steel);
      // Curved top-mounted magazine sticking out to the side
      ctx.strokeStyle = steel;
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(1.4, y);
      ctx.quadraticCurveTo(1.6, y - 1.0, 1.1, y - 1.6);
      ctx.stroke();
      break;
    case 'rpg':
      // RPG-7 over the shoulder: tube behind, PG-7 warhead in front
      line(-2.2, 3.0, 0.5, '#5D4037', 0.3);
      ctx.fillStyle = '#556B2F';
      ctx.beginPath();
      ctx.moveTo(3.0, 0.3 - 0.75);
      ctx.lineTo(4.8, 0.3);
      ctx.lineTo(3.0, 0.3 + 0.75);
      ctx.closePath();
      ctx.fill();
      break;
    case 'bazooka':
      line(-2.4, 3.4, 0.7, '#4E5B31', 0.3);
      break;
    case 'at4':
      line(-2.0, 2.8, 0.85, '#6B7046', 0.3);
      break;
    case 'm79':
      line(-0.2, 1.2, 0.55, wood);
      line(1.2, 2.8, 0.75, steel);
      break;
    case 'flame':
      line(0.2, 3.6, 0.4, steel);
      ctx.fillStyle = '#FF7043';
      ctx.beginPath();
      ctx.arc(3.7, y, 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'knee_mortar':
      line(0.2, 2.2, 0.6, steel);
      break;
    case 'radio':
    case 'satchel':
      line(-0.4, 1.4, 0.5, wood);
      line(1.4, 3.6, 0.35, steel);
      break;
    case 'detector':
      // Mine detector: pole and search head swept ahead
      ctx.strokeStyle = steel;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(0.4, y);
      ctx.lineTo(3.6, y + 0.8);
      ctx.stroke();
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.ellipse(4.2, y + 0.9, 0.5, 1.0, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.lineCap = 'butt';
}

function drawHelmet(ctx: CanvasRenderingContext2D, kit: Kit, x: number) {
  const c = kit.helmetColour;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.3;
  switch (kit.helmet) {
    case 'pith':
      // Wide oval pith helmet with its top vent
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, 0, 1.25, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(x, 0, 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'pasgt':
      // PASGT: rounded shell with the short front visor
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, 0, 1.05, 0.98, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + 0.75, 0, 0.35, 0.7, 0, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      break;
    case 'slouch':
      // Slouch hat: broad brim, left side pinned up, puggaree band
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, 0.15, 1.35, 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, -0.9, 1.0, 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8D7B55';
      ctx.beginPath();
      ctx.arc(x, 0, 0.75, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'brodie':
      // Mk II Brodie helmet: shallow bowl with a wide flat brim
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, 0, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(x, 0, 0.75, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ija':
      // Type 90 helmet; neck-flap cloth showing behind
      ctx.fillStyle = '#A1906A';
      ctx.beginPath();
      ctx.ellipse(x - 0.7, 0, 0.6, 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, 0, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.arc(x + 0.55, 0, 0.16, 0, Math.PI * 2); // star badge
      ctx.fill();
      break;
    default: {
      // M1 / SSh-40: round steel helmet with a rim; USMC / Vietnam cloth cover adds spots
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, 0, 1.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(x, 0, 0.7, 0, Math.PI * 2);
      ctx.stroke();
      if (kit.helmet === 'm1_cover') {
        ctx.fillStyle = 'rgba(62, 39, 35, 0.55)';
        for (const [dx, dy] of [[0.3, -0.4], [-0.35, 0.3], [0.2, 0.45]]) {
          ctx.beginPath();
          ctx.arc(x + dx, dy, 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawSoldier(ctx: CanvasRenderingContext2D, m: Member, kit: Kit, prone: boolean, pal: PlanPalette, seed: number) {
  ctx.save();
  ctx.translate(m.x, m.y);
  // Each man scans his own sector
  ctx.rotate((rnd(seed) - 0.5) * 0.5);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(prone ? -1.4 : 0.2, 0.4, prone ? 3.4 : 1.6, prone ? 1.6 : 2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (prone) {
    // Legs spread behind the body
    ctx.strokeStyle = kit.uniform;
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.2, -0.4);
    ctx.lineTo(-4.6, -1.1);
    ctx.moveTo(-2.2, 0.4);
    ctx.lineTo(-4.6, 1.0);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // Back-mounted kit (under the body outline)
  if (m.w === 'flame') {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-2.0, -1.1, 1.0, 0.9);
    ctx.fillRect(-2.0, 0.2, 1.0, 0.9);
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ctx.moveTo(-1.2, 0.8);
    ctx.quadraticCurveTo(0, 1.6, 0.6, 0.7);
    ctx.stroke();
  } else if (m.w === 'radio') {
    ctx.fillStyle = '#455A64';
    ctx.fillRect(-2.0, -0.8, 1.2, 1.6);
    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    ctx.moveTo(-1.6, -0.7);
    ctx.lineTo(-4.4, -2.4);
    ctx.stroke();
  } else if (kit.pack !== 'none') {
    ctx.fillStyle = kit.pack === 'veshmeshok' ? '#7A7350' : kit.pack === 'alice' ? '#3F4A2E' : kit.pack === 'ruck' ? '#6B6440' : '#6A6B48';
    ctx.beginPath();
    if (kit.pack === 'veshmeshok') ctx.ellipse(-1.25, 0, 0.6, 0.85, 0, 0, Math.PI * 2);
    else ctx.roundRect(-1.8, -0.8, 0.95, 1.6, 0.3);
    ctx.fill();
  }

  drawWeapon(ctx, m.w, pal);

  // Shoulders: capsule across the body, outlined in the side's colour
  ctx.fillStyle = kit.uniform;
  ctx.strokeStyle = pal.hullStroke;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  if (prone) ctx.ellipse(-1.0, 0, 1.7, 1.15, 0, 0, Math.PI * 2);
  else ctx.roundRect(-0.75, -1.4, 1.5, 2.8, 0.75);
  ctx.fill();
  ctx.stroke();
  if (kit.camo) {
    ctx.fillStyle = kit.camo;
    ctx.globalAlpha = 0.6;
    for (const [dx, dy, r] of [[-0.3, -0.8, 0.35], [0.25, 0.5, 0.3], [-0.2, 0.9, 0.25]]) {
      ctx.beginPath();
      ctx.arc((prone ? -1 : 0) + dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Arms reaching forward to the weapon
  ctx.strokeStyle = kit.uniform;
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.2, 1.1);
  ctx.lineTo(1.0, 0.75);
  ctx.moveTo(0.2, -1.1);
  ctx.lineTo(1.9, 0.5);
  ctx.stroke();
  ctx.lineCap = 'butt';

  drawHelmet(ctx, kit, prone ? 1.0 : 0.15);
  ctx.restore();
}

/** Rifle teams, sappers, ambush and patrol cells. */
export function drawInfantryTeam(ctx: CanvasRenderingContext2D, type: string, pal: PlanPalette): void {
  const t = type.toLowerCase();
  const sp = TEAMS.find((s) => s.match.test(t)) ?? DEFAULT_TEAM;
  if (sp.foliage) {
    ctx.fillStyle = 'rgba(46, 125, 50, 0.6)';
    for (const [fx, fy, fr] of [[-5, -5, 3.4], [5, -6, 3], [-6, 5, 3.2], [6, 5.5, 3.6], [0, -8, 2.6], [0, 8, 2.8]] as const) {
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  sp.men.forEach((m, i) => drawSoldier(ctx, m, sp.kit, !!sp.prone, pal, i + t.length));
}

/** 82mm mortar section: baseplate, tube on its bipod, ready rounds and a crew of three. */
export function drawMortarSection(ctx: CanvasRenderingContext2D, type: string, pal: PlanPalette): void {
  const kit = /42|45/.test(type) ? KITS.ija : KITS.soviet;
  ctx.fillStyle = '#37474F';
  ctx.beginPath();
  ctx.arc(-1, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.lineTo(4.4, 0);
  ctx.stroke();
  ctx.strokeStyle = '#90A4AE';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(2.8, 0);
  ctx.lineTo(3.8, -2.2);
  ctx.moveTo(2.8, 0);
  ctx.lineTo(3.8, 2.2);
  ctx.stroke();
  // Ammunition boxes with rounds
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(-7.5, -1.2, 2.2, 2.4);
  ctx.fillStyle = '#9E9D24';
  for (let i = 0; i < 3; i++) ctx.fillRect(-7.2 + i * 0.7, -0.9, 0.4, 1.8);
  drawSoldier(ctx, { x: -3.2, y: -3.4, w: 'smg' }, kit, false, pal, 1);
  drawSoldier(ctx, { x: -3.2, y: 3.4, w: 'rifle' }, kit, false, pal, 2);
  drawSoldier(ctx, { x: -6.2, y: 3.6, w: 'radio' }, kit, false, pal, 3);
}

/** M47 Dragon team: gunner behind the launcher on its bipod, assistant with a spare round. */
export function drawAtgmTeam(ctx: CanvasRenderingContext2D, pal: PlanPalette): void {
  // Launcher tube with the tracker at the front and the bipod
  ctx.strokeStyle = '#5D6B3A';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.4, 0);
  ctx.lineTo(4.2, 0);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#37474F';
  ctx.fillRect(-0.2, 0.7, 1.4, 1.0);
  ctx.strokeStyle = pal.barrelColor;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(3.2, 0);
  ctx.lineTo(3.8, -1.4);
  ctx.moveTo(3.2, 0);
  ctx.lineTo(3.8, 1.4);
  ctx.stroke();
  drawSoldier(ctx, { x: -3.0, y: 0.4, w: 'none' }, KITS.us_83, false, pal, 4);
  // Assistant gunner with a spare round in its carrying tube
  ctx.strokeStyle = '#5D6B3A';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-6.8, 4.2);
  ctx.lineTo(-2.6, 5.6);
  ctx.stroke();
  drawSoldier(ctx, { x: -4, y: 4.6, w: 'rifle' }, KITS.us_83, false, pal, 5);
}

/** Combat engineers: a D7 bulldozer with its blade and two sappers sweeping for mines. */
export function drawEngineerTeam(ctx: CanvasRenderingContext2D, pal: PlanPalette): void {
  const K = 3.3;
  const m = (v: number) => v * K;
  ctx.save();
  ctx.translate(-2, 0);
  // Tracks
  ctx.fillStyle = pal.trackColor;
  ctx.fillRect(-m(2.0), -m(1.25), m(4.0), m(0.5));
  ctx.fillRect(-m(2.0), m(0.75), m(4.0), m(0.5));
  // Engine hood and operator's seat / ROPS
  ctx.fillStyle = '#C9A227';
  ctx.strokeStyle = '#5D4A10';
  ctx.lineWidth = 0.6;
  ctx.fillRect(-m(0.6), -m(0.6), m(2.3), m(1.2));
  ctx.strokeRect(-m(0.6), -m(0.6), m(2.3), m(1.2));
  ctx.fillStyle = '#3E2F0A';
  ctx.fillRect(-m(1.8), -m(0.75), m(1.1), m(1.5));
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.arc(m(1.2), -m(0.3), m(0.14), 0, Math.PI * 2); // exhaust stack
  ctx.fill();
  // Push arms and the angled blade
  ctx.strokeStyle = '#5D4A10';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(m(0.2), -m(1.0));
  ctx.lineTo(m(2.4), -m(1.4));
  ctx.moveTo(m(0.2), m(1.0));
  ctx.lineTo(m(2.4), m(1.4));
  ctx.stroke();
  ctx.fillStyle = '#E0B030';
  ctx.strokeStyle = '#5D4A10';
  ctx.beginPath();
  ctx.moveTo(m(2.3), -m(1.9));
  ctx.lineTo(m(2.75), -m(1.9));
  ctx.lineTo(m(2.95), m(1.9));
  ctx.lineTo(m(2.5), m(1.9));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // Mine-clearing sappers ahead on either side
  drawSoldier(ctx, { x: 9.5, y: -6.5, w: 'detector' }, KITS.usmc_ww2, false, pal, 6);
  drawSoldier(ctx, { x: 9.5, y: 6.5, w: 'detector' }, KITS.usmc_ww2, false, pal, 7);
}
