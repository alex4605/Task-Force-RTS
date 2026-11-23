import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { Era, InstallationType } from '../types/game';
import { CodexEntry, CodexKind, CodexSide, ERA_LABEL, SIDE_LABEL, codexEntries } from '../game/codex';
import { UnitPreviewCanvas } from './hud/UnitPreviewCanvas';
import { drawInstallation } from '../game/render/installations/index';
import { makeInstallation } from '../game/procedural';
import { drawShipObjectPreview } from '../game/unitPreviewRenderer';
import { Ship } from '../types/game';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  era: Era;
}

const KIND_TABS: { id: CodexKind; label: string }[] = [
  { id: 'ground', label: '🪖 地面部隊' },
  { id: 'aircraft', label: '✈️ 飛機' },
  { id: 'ship', label: '⚓ 艦艇' },
  { id: 'site', label: '🏘️ 設施' },
];

const SIDE_COLOR: Record<CodexSide, string> = {
  player: 'text-sky-300 border-sky-500/60',
  allied: 'text-emerald-300 border-emerald-500/60',
  enemy: 'text-rose-300 border-rose-500/60',
  neutral: 'text-amber-200 border-amber-500/60',
  both: 'text-slate-200 border-slate-500/60',
};

/** An installation drawn with its in-game renderer, scaled to fit. */
const SitePreview: React.FC<{ type: string; name: string; era: Era; width: number; height: number }> = React.memo(({ type, name, era, width, height }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#3A4A2E';
    ctx.fillRect(0, 0, width, height);
    const inst = makeInstallation({ id: `codex-${type}`, type: type as InstallationType, name: name.split(' (')[0], pos: { x: 0, y: 0 }, health: 1000, side: 'neutral' });
    const big = type === 'airfield' ? Math.min(width / 260, height / 110) : Math.min(width / 95, height / 72);
    ctx.save();
    ctx.translate(width / 2, height / 2 + height * 0.06);
    ctx.scale(big, big);
    try {
      drawInstallation({ ctx, width, height, time: 1, era }, inst, undefined);
    } catch {
      /* an installation that needs map context simply shows the backdrop */
    }
    ctx.restore();
  }, [type, name, era, width, height]);
  return <canvas ref={ref} style={{ width, height }} className="block shrink-0 rounded border border-[#1E3A5F]/90" aria-hidden="true" />;
});
SitePreview.displayName = 'SitePreview';

/** A particular ship of the era's fleets, drawn with its own map artwork. */
const ShipPreview: React.FC<{ ship: Ship; cacheKey: string; width: number; height: number }> = React.memo(({ ship, cacheKey, width, height }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    drawShipObjectPreview(ctx, width, height, ship, cacheKey);
  }, [ship, cacheKey, width, height]);
  return <canvas ref={ref} style={{ width, height }} className="block shrink-0 rounded border border-[#1E3A5F]/90" aria-hidden="true" />;
});
ShipPreview.displayName = 'ShipPreview';

const Preview: React.FC<{ e: CodexEntry; era: Era; w: number; h: number }> = ({ e, era, w, h }) => {
  if (e.ship) return <ShipPreview ship={e.ship} cacheKey={e.key} width={w} height={h} />;
  if (e.kind === 'site') return <SitePreview type={e.key} name={e.title} era={e.eras[0] ?? era} width={w} height={h} />;
  return <UnitPreviewCanvas kind={e.kind} unitKey={e.key} width={w} height={h} era={e.eras[0] ?? era} />;
};

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose, era }) => {
  const [kind, setKind] = useState<CodexKind>('ground');
  const [eraFilter, setEraFilter] = useState<Era | 'all'>(era);
  const [sideFilter, setSideFilter] = useState<CodexSide | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const all = useMemo(() => (isOpen ? codexEntries() : []), [isOpen]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (e) =>
        e.kind === kind &&
        (eraFilter === 'all' || e.eras.length === 0 || e.eras.includes(eraFilter)) &&
        (sideFilter === 'all' || e.side === sideFilter || (e.side === 'both' && sideFilter !== 'neutral')) &&
        (!q || `${e.key} ${e.title} ${e.note} ${e.nation}`.toLowerCase().includes(q))
    );
  }, [all, kind, eraFilter, sideFilter, query]);

  const current = list.find((e) => e.key === selected) ?? list[0];

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div
        className="bg-[#061220] border border-[#80DEEA]/50 rounded-xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col font-mono text-xs text-slate-200"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2 text-[#80DEEA] font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>作戰圖鑑 · 部隊 / 飛機 / 艦艇 / 設施</span>
            <span className="text-[10px] text-slate-400 font-normal">共 {list.length} 項</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label="關閉">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-[#1E3A5F]/60">
          {KIND_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setKind(t.id);
                setSelected(null);
              }}
              className={`px-2.5 py-1 rounded font-bold ${kind === t.id ? 'bg-[#80DEEA] text-[#061220]' : 'bg-[#0B1E34] text-[#80DEEA] hover:bg-[#153252]'}`}
            >
              {t.label}
            </button>
          ))}
          <span className="mx-1 text-slate-600">|</span>
          {(['all', 'era1', 'era2', 'era3', 'era4', 'era5'] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setEraFilter(x)}
              className={`px-2 py-0.5 rounded border text-[10.5px] ${eraFilter === x ? 'bg-amber-500/90 text-black border-amber-300' : 'border-amber-700/50 text-amber-200 hover:bg-amber-900/30'}`}
            >
              {x === 'all' ? '全部時代' : ERA_LABEL[x]}
            </button>
          ))}
          <span className="mx-1 text-slate-600">|</span>
          {(['all', 'player', 'allied', 'enemy', 'neutral'] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setSideFilter(x)}
              className={`px-2 py-0.5 rounded border text-[10.5px] ${sideFilter === x ? 'bg-slate-200 text-black border-white' : 'border-slate-600 text-slate-300 hover:bg-white/5'}`}
            >
              {x === 'all' ? '全部陣營' : SIDE_LABEL[x]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 bg-[#0B1E34] border border-[#1E3A5F] rounded px-2 py-0.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="搜尋名稱 / 國家…" className="bg-transparent outline-none w-40 text-[11px]" />
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* List */}
          <div className="w-[46%] overflow-y-auto p-2 space-y-1 border-r border-[#1E3A5F]/60">
            {list.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => setSelected(e.key)}
                className={`w-full flex items-center gap-2 p-1.5 rounded border text-left ${current?.key === e.key ? 'bg-[#123250] border-[#80DEEA]/70' : 'bg-[#071526] border-[#1E3A5F]/60 hover:border-[#80DEEA]/40'}`}
              >
                <Preview e={e} era={era} w={78} h={34} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[11px] text-white truncate">{e.title}</div>
                  <div className="text-[9.5px] text-slate-400 truncate">
                    {e.group} · {e.nation} · {e.eras.map((x) => ERA_LABEL[x].split(' ')[0]).join(' / ') || '各時代'}
                  </div>
                </div>
                <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded border ${SIDE_COLOR[e.side]}`}>{SIDE_LABEL[e.side].split(' ')[0]}</span>
              </button>
            ))}
            {list.length === 0 && <div className="text-slate-500 p-4">沒有符合條件的項目</div>}
          </div>

          {/* Detail */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {current && (
              <>
                <div className="flex items-start gap-3">
                  <Preview e={current} era={era} w={300} h={130} />
                  <div className="min-w-0 space-y-1">
                    <div className="text-base font-bold text-white leading-snug">{current.title}</div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SIDE_COLOR[current.side]}`}>{SIDE_LABEL[current.side]}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 text-slate-300">{current.nation}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 text-slate-300">{current.group}</span>
                      {current.eras.map((x) => (
                        <span key={x} className="text-[10px] px-1.5 py-0.5 rounded border border-amber-700/60 text-amber-200">
                          {ERA_LABEL[x]}
                        </span>
                      ))}
                    </div>
                    {!current.ship && <div className="text-[10px] text-slate-500">代號 {current.key}</div>}
                  </div>
                </div>
                {current.note && !current.note.endsWith(current.title) && (
                  <div className="bg-[#071526] border border-[#1E3A5F]/70 rounded p-2.5 text-[11.5px] leading-relaxed text-slate-200">{current.note}</div>
                )}
                {current.stats.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {current.stats.map((s) => (
                      <div key={s.label} className="bg-[#0B1E34] border border-[#1E3A5F] rounded px-2 py-1">
                        <div className="text-[9.5px] text-slate-400">{s.label}</div>
                        <div className="text-[12px] font-bold text-[#80DEEA] tabular-nums">{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {current.extras.length > 0 && (
                  <div className="space-y-1">
                    {current.extras.map((x) => (
                      <div key={x} className="text-[11px] text-amber-100/90 bg-amber-950/20 border border-amber-800/30 rounded px-2 py-1">
                        {x}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
