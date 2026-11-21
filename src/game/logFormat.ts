/**
 * Battle-report text for display. Log entries are written as
 *   "<icons>【<headline>】<details>"
 * which reads as one long run-on line in a narrow feed. splitLogText() separates the icon, the
 * headline and the details so the feed can show "icon · headline — details" with the headline
 * emphasised, and strips dice-mechanics jargon (the dice result already has its own badge).
 */
export interface LogParts {
  icon: string;
  title: string;
  body: string;
}

const DICE_JARGON: RegExp[] = [
  /🎲\s*/g,
  /\bD(?:20|100)\s*[:：]\s*\d+\s*(?:\((?:門檻|閾值)\s*\d+\))?/g,
  /\s*vs\.?\s*DC\s*\d+/gi,
  /\s*[\/／]?\s*(?:門檻|閾值)\s*\d+/g,
  /\s*[·・]?\s*擲骰判定/g,
  /擲骰/g,
];

function clean(s: string): string {
  let out = s;
  for (const re of DICE_JARGON) out = out.replace(re, '');
  return out
    .replace(/[！!]{2,}/g, '！')
    .replace(/\s*[·・]\s*(?=[】）)]|$)/g, '')
    .replace(/\(\s*\)|（\s*）/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function splitLogText(text: string): LogParts {
  const open = text.indexOf('【');
  const close = open >= 0 ? text.indexOf('】', open) : -1;
  if (open < 0 || close < 0) return { icon: '', title: '', body: clean(text) };
  const icon = text.slice(0, open).trim();
  const title = clean(text.slice(open + 1, close)).replace(/[！!]$/, '');
  const body = clean(text.slice(close + 1)).replace(/^[：:，,\s]+/, '');
  return { icon, title, body };
}
