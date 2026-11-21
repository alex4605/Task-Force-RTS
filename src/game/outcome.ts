import { Aircraft, Era, GroundUnit, Installation, Ship } from '../types/game';

/**
 * Casualty accounting and the campaign's end states. Every unit either side puts into the
 * theatre counts as committed strength; every one sunk, shot down, destroyed or captured counts
 * as a loss. How the battle ends then depends on what each side has lost, not only on whether
 * the flagship survived or the last stronghold fell.
 */
export type Faction = 'friendly' | 'enemy';

export interface SideTally {
  ships: number;
  aircraft: number;
  ground: number;
  installations: number;
  /** Weighted strength (big ships count more than a landing craft). */
  weight: number;
}

const emptyTally = (): SideTally => ({ ships: 0, aircraft: 0, ground: 0, installations: 0, weight: 0 });

function shipWeight(s: Ship): number {
  if (/carrier|cv63|cvn|kiev|battleship|bb_|kongo|kirov/.test(s.type)) return 12;
  if (/cruiser|cg|chokai|sverdlov|kynda|slava/.test(s.type)) return 6;
  if (/lcvp|lcm|lcac|patrol|komar|osa|pbr|riverine|monitor|junk|sampan/.test(s.type)) return 1;
  return 4;
}

const AIRCRAFT_WEIGHT = 1;
const GROUND_WEIGHT = 1.5;
const INSTALLATION_WEIGHT = 2;

const factionOf = (side: string): Faction => (side === 'enemy' ? 'enemy' : 'friendly');

export class CasualtyLedger {
  readonly committed: Record<Faction, SideTally> = { friendly: emptyTally(), enemy: emptyTally() };
  readonly lost: Record<Faction, SideTally> = { friendly: emptyTally(), enemy: emptyTally() };
  private seen = new Set<string>();
  private dead = new Set<string>();

  private commit(id: string, side: string, kind: keyof Omit<SideTally, 'weight'>, w: number): void {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    const t = this.committed[factionOf(side)];
    t[kind]++;
    t.weight += w;
  }

  private lose(id: string, side: string, kind: keyof Omit<SideTally, 'weight'>, w: number): void {
    if (this.dead.has(id)) return;
    this.commit(id, side, kind, w);
    this.dead.add(id);
    const t = this.lost[factionOf(side)];
    t[kind]++;
    t.weight += w;
  }

  /** A ground unit removed in the same tick it was lost (surrender). */
  loseGround(u: GroundUnit): void {
    this.lose(u.id, u.side, 'ground', GROUND_WEIGHT);
  }

  /** Called every tick, before destroyed units are cleared away. */
  observe(ships: Ship[][], aircraft: Aircraft[], ground: GroundUnit[], installations: Installation[]): void {
    for (const list of ships) {
      for (const s of list) {
        if (s.isSunk) this.lose(s.id, s.side, 'ships', shipWeight(s));
        else this.commit(s.id, s.side, 'ships', shipWeight(s));
      }
    }
    for (const a of aircraft) {
      if (a.state === 'shot_down') this.lose(a.id, a.side, 'aircraft', AIRCRAFT_WEIGHT);
      else this.commit(a.id, a.side, 'aircraft', AIRCRAFT_WEIGHT);
    }
    for (const u of ground) {
      if (u.embarkedInShipId) continue;
      if (u.isDestroyed) this.lose(u.id, u.side, 'ground', GROUND_WEIGHT);
      else this.commit(u.id, u.side, 'ground', GROUND_WEIGHT);
    }
    for (const i of installations) {
      if (i.isCivilian || i.range <= 0) continue; // towns, depots without guns: not combat strength
      if (i.isDestroyed) this.lose(i.id, i.side, 'installations', INSTALLATION_WEIGHT);
      else this.commit(i.id, i.side, 'installations', INSTALLATION_WEIGHT);
    }
  }

  /** Share of committed strength lost, 0..1. */
  lossRate(f: Faction): number {
    const c = this.committed[f].weight;
    return c > 0 ? this.lost[f].weight / c : 0;
  }

  /** Enemy weighted losses per friendly weighted loss. */
  exchangeRatio(): number {
    return this.lost.enemy.weight / Math.max(1, this.lost.friendly.weight);
  }
}

export type OutcomeKind =
  | 'decisive_victory'
  | 'victory'
  | 'pyrrhic_victory'
  | 'enemy_collapse'
  | 'armistice'
  | 'honourable_defeat'
  | 'defeat'
  | 'rout'
  | 'withdrawal';

export interface Outcome {
  kind: OutcomeKind;
  tone: 'victory' | 'draw' | 'defeat';
  title: string;
  subtitle: string;
  text: string;
  /** Extra merit stars for this ending (on top of the normal victory reward). */
  stars: number;
  /** Bonus score for this ending. */
  score: number;
  friendlyLoss: number;
  enemyLoss: number;
  exchange: number;
  progress: number;
}

const ENEMY_NAME: Record<Era, string> = {
  era1: '日本帝國海軍',
  era2: '日本帝國陸海軍',
  era3: '北韓人民軍與中國人民志願軍',
  era4: '北越人民軍',
  era5: '華沙公約組織',
};

interface EndContext {
  era: Era;
  ledger: CasualtyLedger;
  /** Objectives held, 0..1. */
  progress: number;
  gameTime: number;
}

function make(kind: OutcomeKind, ctx: EndContext, title: string, subtitle: string, text: string, stars: number, score: number): Outcome {
  const tone = kind === 'armistice' ? 'draw' : ['honourable_defeat', 'defeat', 'rout', 'withdrawal'].includes(kind) ? 'defeat' : 'victory';
  return {
    kind,
    tone,
    title,
    subtitle,
    text,
    stars,
    score,
    friendlyLoss: ctx.ledger.lossRate('friendly'),
    enemyLoss: ctx.ledger.lossRate('enemy'),
    exchange: ctx.ledger.exchangeRatio(),
    progress: ctx.progress,
  };
}

/** Ending when every stronghold is taken and the enemy carriers are gone. */
export function victoryOutcome(ctx: EndContext): Outcome {
  const fl = ctx.ledger.lossRate('friendly');
  const el = ctx.ledger.lossRate('enemy');
  const foe = ENEMY_NAME[ctx.era];
  if (fl < 0.15) {
    return make('decisive_victory', ctx, '決定性大捷 · 戰區完全肅清', '以極輕微代價全殲敵軍',
      `${foe}的島嶼要塞與艦隊主力在協同攻勢下全面瓦解，而我軍僅損失 ${pct(fl)} 投入兵力。${el > 0.6 ? '敵軍主力幾乎被全數殲滅，' : ''}此役將作為兩棲作戰範例載入戰史。`, 4, 3000);
  }
  if (fl < 0.35) {
    return make('victory', ctx, '作戰勝利 · 戰區肅清成功', '付出相應代價達成全部目標',
      `全部據點已經奪取，${foe}在本戰區的抵抗宣告終結。我軍損失 ${pct(fl)} 投入兵力，敵軍損失 ${pct(el)}。部隊需要整補，但戰略目標已達成。`, 2, 1500);
  }
  return make('pyrrhic_victory', ctx, '慘勝 · 代價沉重的勝利', '目標達成，但部隊已殘破不堪',
    `島嶼雖已全數奪下，我軍卻損失了 ${pct(fl)} 投入兵力，交換比僅 ${ctx.ledger.exchangeRatio().toFixed(1)} : 1。國內輿論開始質疑這場勝利的代價，下一階段攻勢恐將延後。`, 0, 300);
}

/** Ending when the flagship is lost. */
export function defeatOutcome(ctx: EndContext): Outcome {
  const fl = ctx.ledger.lossRate('friendly');
  const el = ctx.ledger.lossRate('enemy');
  const foe = ENEMY_NAME[ctx.era];
  if (fl > 0.55) {
    return make('rout', ctx, '全面潰敗 · 特遣艦隊覆滅', '旗艦沉沒，殘部失去指揮四散撤退',
      `旗艦沉沒時，特遣部隊已損失 ${pct(fl)} 兵力。指揮體系崩潰，殘存艦艇與登陸部隊各自突圍，${foe}重新控制了整個戰區。`, 0, 0);
  }
  if (el > fl * 1.5 && el > 0.3) {
    return make('honourable_defeat', ctx, '雖敗猶榮 · 旗艦戰沒', '旗艦沉沒，但敵軍付出了更慘重的代價',
      `旗艦雖告沉沒，${foe}卻在交戰中損失了 ${pct(el)} 兵力（我軍 ${pct(fl)}）。敵軍已無力乘勝追擊，殘存部隊得以有序撤出，為下一次攻勢保留了基幹。`, 1, 800);
  }
  return make('defeat', ctx, '作戰失利 · 旗艦傾覆沉沒', '指揮中樞喪失，特遣作戰中斷',
    `旗艦蒙受致命重創沉沒，特遣作戰被迫中止。我軍損失 ${pct(fl)} 兵力，敵軍損失 ${pct(el)}。`, 0, 0);
}

/**
 * Endings decided by attrition alone, before the normal win/lose conditions: the enemy gives
 * up once it has been bled white and most of the ground is lost; the operation is called off
 * when the landing force is shattered early; and a long, bloody deadlock ends at the table.
 */
export function attritionOutcome(ctx: EndContext): Outcome | null {
  const { ledger, progress, gameTime } = ctx;
  if (gameTime < 300) return null;
  // Enough fighting on both sides for the ratios to mean something
  if (ledger.committed.friendly.weight < 25 || ledger.committed.enemy.weight < 25) return null;
  const fl = ledger.lossRate('friendly');
  const el = ledger.lossRate('enemy');
  const foe = ENEMY_NAME[ctx.era];
  if (el >= 0.7 && progress >= 0.6 && fl < 0.45) {
    return make('enemy_collapse', ctx, '敵軍崩潰 · 守軍投降', `${foe}戰區指揮部宣布停止抵抗`,
      `${foe}已損失 ${pct(el)} 投入兵力，${pct(progress)} 的據點落入我軍手中。殘存守軍失去補給與指揮，戰區指揮官遣使接洽投降。無需逐一攻下剩餘據點，戰區即告平定。`, 3, 2200);
  }
  if (fl >= 0.65 && progress < 0.3) {
    return make('withdrawal', ctx, '作戰中止 · 撤出登陸部隊', '損失過重，上級下令撤出戰區',
      `登陸部隊與特遣艦隊已損失 ${pct(fl)} 兵力，卻只控制 ${pct(progress)} 的據點。聯合作戰司令部判斷繼續強攻將導致全軍覆沒，下令於夜間撤出灘頭。`, 0, 0);
  }
  if (gameTime >= 2400 && fl >= 0.45 && el >= 0.45 && progress >= 0.3 && progress < 0.8) {
    return make('armistice', ctx, '停戰協定 · 戰線凍結', '雙方皆已流血殆盡，於現有戰線停火',
      `經過 ${Math.round(gameTime / 60)} 分鐘的消耗戰，雙方分別損失 ${pct(fl)}（我軍）與 ${pct(el)}（敵軍）兵力，均無力發動決定性攻勢。雙方代表於現有接觸線簽署停火協定，我軍保有已奪取的 ${pct(progress)} 據點。`, 1, 1000);
  }
  return null;
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
