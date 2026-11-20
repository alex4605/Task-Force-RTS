import React, { useEffect } from 'react';
import { RES_KEYS, formatBundle, nuclearCost } from '../../game/economy';
import { ResourceBundle } from '../../types/game';
import { Check, Wrench } from 'lucide-react';
import { AircraftPayloadType, AircraftRole, PAYLOAD_CATALOG } from '../../types/game';

export interface ActiveArmamentTrayState {
  planeId: string;
  planeLabel: string;
  role: AircraftRole;
  isAirbase: boolean;
  compatiblePayloads: AircraftPayloadType[];
  currentPayload: AircraftPayloadType;
}

interface ArmamentTrayModalProps {
  tray: ActiveArmamentTrayState | null;
  stock: ResourceBundle;
  onClose: () => void;
  onSelectPayload: (pid: AircraftPayloadType) => void;
}

const NUKE_PAYLOADS = new Set<AircraftPayloadType>([
  'tactical_nuke',
  'b52_megaton_nuke',
  'tactical_b61_nuke',
]);

export const ArmamentTrayModal: React.FC<ArmamentTrayModalProps> = ({
  tray,
  stock,
  onClose,
  onSelectPayload,
}) => {
  useEffect(() => {
    if (!tray) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tray, onClose]);

  if (!tray) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 pointer-events-auto">
      <div className="bg-[#051322] border-2 border-[#1E3A5F] rounded-xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-100 font-mono">
        {/* Tray Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#081B30] border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-[#80DEEA]" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#E0F7FA]">
                  {`【${tray.planeLabel}】戰地軍械庫掛載武裝配置盤`}
                </span>
                <span className="text-[11px] text-[#80CBC4] bg-[#004D40] px-2 py-0.5 rounded border border-[#80CBC4]/40 font-bold">
                  {tray.isAirbase
                    ? '前進陸基基地'
                    : '母艦飛行甲板'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                作戰用途標註 · 殺傷破壞半徑 (m) · 政治授權 · 機體外觀掛載標籤
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right text-xs">
              <span className="text-slate-400">{'政治值 PP: '}</span>
              <span className="text-purple-300 font-bold tabular-nums">{Math.floor(stock.pp)}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1E3A5F]/80 hover:bg-[#1E3A5F] text-slate-200 hover:text-white rounded text-xs font-bold transition-colors whitespace-nowrap"
            >
              關閉選擇盤 ✕
            </button>
          </div>
        </div>

        {/* Tray Body: Grid of Payload Cards */}
        <div className="p-3.5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[calc(88vh-80px)]">
          {tray.compatiblePayloads.map((pid) => {
            const item = PAYLOAD_CATALOG[pid];
            if (!item) return null;
            const isSelected = tray.currentPayload === pid;
            const isNuke = NUKE_PAYLOADS.has(pid);
            const cpCost = item.cpCost || 0;
            const bill = nuclearCost(cpCost);
            const canAfford = !cpCost || RES_KEYS.every((k) => stock[k] >= bill[k]);

            return (
              <div
                key={pid}
                className={`flex flex-col justify-between p-3 rounded-lg border transition-all ${
                  isSelected
                    ? isNuke
                      ? 'bg-[#250F0F] border-amber-400 shadow-[0_0_18px_rgba(255,160,0,0.4)]'
                      : 'bg-[#0A2540] border-[#00E676] shadow-md'
                    : isNuke
                    ? 'bg-[#180A0A] border-red-900/80 hover:border-amber-500/80'
                    : 'bg-[#06172A] border-[#1E3A5F] hover:border-[#42A5F5]'
                }`}
              >
                <div>
                  {/* Purpose Badge & Visual Tag */}
                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isNuke
                          ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-black font-extrabold shadow'
                          : 'bg-[#004D40] text-emerald-300 border border-[#00BFA5]/30'
                      }`}
                    >
                      {item.purposeBadge || ('【戰術打擊】')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.visualTag || '[Standard]'}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-xs font-bold ${isNuke ? 'text-amber-300' : 'text-white'}`}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 text-right">
                      {item.name}
                    </span>
                  </div>

                  {/* Metrics: Blast Radius, Damage, CP */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2 bg-[#030D18] p-2 rounded border border-[#1E3A5F]/60 text-[10px]">
                    <div>
                      <span className="text-slate-400">💥 {'破壞半徑: '}</span>
                      <span className="font-bold text-amber-300 tabular-nums">
                        {item.blastRadius ? `${item.blastRadius}m` : '精密點直擊'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">🎯 {'殺傷威力: '}</span>
                      <span className="font-bold text-emerald-300 tabular-nums">
                        {item.damage > 0
                          ? `${item.damage.toLocaleString()} DMG`
                          : '空戰/機砲'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-[#1E3A5F]/40">
                      <span className="text-slate-400">{'政治授權: '}</span>
                      <span
                        className={`font-bold tabular-nums ${
                          cpCost > 0 ? (canAfford ? 'text-amber-400' : 'text-red-400') : 'text-emerald-400'
                        }`}
                      >
                        {cpCost > 0
                          ? `☢️ ${formatBundle(bill)}`
                          : '✅ 常規庫存 (免授權)'}
                      </span>
                    </div>
                  </div>

                  {/* Tactical Pros */}
                  <p className="text-[10px] text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {item.pros}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => onSelectPayload(pid)}
                  className={`mt-3 w-full py-2 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#00E676] text-black shadow-md cursor-default'
                      : isNuke
                      ? canAfford
                        ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white border border-amber-300 shadow'
                        : 'bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300'
                      : 'bg-[#1976D2] hover:bg-[#2196F3] text-white shadow'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ 目前已掛裝 (EQUIPPED)</span>
                    </>
                  ) : isNuke ? (
                    canAfford ? (
                      <span>☢️ 立即掛載核彈 (CP 授權足額)</span>
                    ) : (
                      <span>
                        {`⚠️ 掛載核彈 (出擊需 ${formatBundle(nuclearCost(cpCost || 4500))})`}
                      </span>
                    )
                  ) : (
                    <span>立即更換此武裝 (EQUIP)</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
