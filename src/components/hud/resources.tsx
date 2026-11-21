import React from 'react';
import { RequisitionItem, ResourceBundle, ResourceState } from '../../types/game';
import { RES_INFO, RES_KEYS, START_STOCK, costOf, formatBundle } from '../../game/economy';

/** Whether the pools cover a price. */
export function affords(stock: ResourceBundle, cost: ResourceBundle): boolean {
  return RES_KEYS.every((k) => stock[k] + 1e-6 >= cost[k]);
}

/** What is still missing, as "RP 120 · TP 40". */
export function shortfallText(stock: ResourceBundle, cost: ResourceBundle): string {
  const s: Partial<ResourceBundle> = {};
  for (const k of RES_KEYS) if (stock[k] < cost[k]) s[k] = Math.ceil(cost[k] - stock[k]);
  return formatBundle(s);
}

export const itemCost = (item: RequisitionItem): ResourceBundle => costOf(item);
export const itemCostText = (item: RequisitionItem): string => formatBundle(costOf(item));
export const stockOf = (state?: ResourceState): ResourceBundle => state?.stock ?? START_STOCK;

/** The four pools with their income, for the top bar and the build bars. */
export const ResourceBar: React.FC<{ state?: ResourceState; compact?: boolean }> = ({ state, compact }) => {
  const stock = stockOf(state);
  return (
    <div className="flex items-center gap-1 font-mono" title={state ? `動員程度：${state.mobilisation}` : undefined}>
      {RES_KEYS.map((k) => (
        <div
          key={k}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-[#040C16] border rounded text-[11px] font-bold tabular-nums"
          style={{ borderColor: `${RES_INFO[k].colour}80`, color: RES_INFO[k].colour }}
          title={`${RES_INFO[k].label} ${RES_INFO[k].name}：${RES_INFO[k].hint}${state ? `\n每秒 +${state.rate[k].toFixed(1)}` : ''}`}
        >
          <span className="text-[9px] opacity-80">{RES_INFO[k].label}</span>
          <span>{Math.floor(stock[k])}</span>
          {!compact && state && <span className="text-[9px] font-normal text-emerald-400">+{state.rate[k].toFixed(1)}</span>}
        </div>
      ))}
      {!compact && state && <span className="hidden lg:inline text-[9px] text-slate-400 ml-0.5">{state.mobilisation}</span>}
    </div>
  );
};

/** A price, each resource coloured and turned red where the pools fall short. */
export const CostTag: React.FC<{ cost: ResourceBundle; stock: ResourceBundle; free?: boolean }> = ({ cost, stock, free }) => (
  <span className="inline-flex items-center gap-1 tabular-nums">
    {RES_KEYS.filter((k) => cost[k] > 0).map((k) => (
      <span key={k} style={{ color: !free && stock[k] < cost[k] ? '#EF5350' : RES_INFO[k].colour }}>
        <span className="opacity-70">{RES_INFO[k].label[0]}</span>
        {Math.round(cost[k])}
      </span>
    ))}
  </span>
);
