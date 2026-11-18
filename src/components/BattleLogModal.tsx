import React, { useState, useEffect } from 'react';
import { CombatLogEntry, CombatLogCategory, CasualtiesReport, ResourceState, Era } from '../types/game';
import {
  X,
  ScrollText,
  Plane,
  Crosshair,
  Shield,
  Anchor,
  Flame,
  Search,
  Trash2,
  BarChart3,
  Award,
  Layers,
  TrendingDown,
  Zap,
} from 'lucide-react';

import { Language, getTranslation } from '../game/i18n';

interface BattleLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatLogs: CombatLogEntry[];
  casualties?: CasualtiesReport;
  resourceState?: ResourceState;
  onClearLogs?: () => void;
  lang?: Language;
  era?: Era;
}

export const BattleLogModal: React.FC<BattleLogModalProps> = ({
  isOpen,
  onClose,
  combatLogs,
  casualties,
  resourceState,
  onClearLogs,
  lang = 'zh',
  era = 'era1',
}) => {
  const t = getTranslation(lang);
  const [mainView, setMainView] = useState<'log' | 'casualties'>('log');
  const [activeTab, setActiveTab] = useState<CombatLogCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter logs by tab & search
  const filteredLogs = combatLogs.filter((log) => {
    if (activeTab !== 'all' && log.category !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.text.toLowerCase().includes(q) ||
        log.sourceName.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate combat statistics
  const directHits = combatLogs.filter(
    (l) => l.actionType === 'bomb_hit' || l.actionType === 'bomb_crit'
  ).length;
  const nearMisses = combatLogs.filter((l) => l.actionType === 'bomb_near_miss').length;
  const torpedoHits = combatLogs.filter((l) => l.actionType === 'torpedo_hit').length;
  const shipsSunk = combatLogs.filter((l) => l.actionType === 'ship_sunk').length;
  const planesDowned = combatLogs.filter((l) => l.actionType === 'aa_down').length;

  // Fallback casualty stats if not provided
  const report: CasualtiesReport = casualties || {
    playerShipsLost: 0,
    enemyShipsLost: shipsSunk,
    playerPlanesLost: combatLogs.filter((l) => l.sourceSide === 'enemy' && l.actionType === 'aa_down').length,
    enemyPlanesLost: planesDowned,
    playerGroundLost: 0,
    enemyGroundLost: 0,
    playerInstallationsLost: 0,
    enemyInstallationsLost: combatLogs.filter((l) => l.actionType === 'installation_down').length,
    playerTonnageLost: 0,
    enemyTonnageLost: shipsSunk * 15000,
    directHitsScored: directHits,
    torpedoHitsScored: torpedoHits,
    critsScored: combatLogs.filter((l) => l.isCrit).length,
  };

  const getCategoryBadge = (cat: CombatLogEntry['category']) => {
    switch (cat) {
      case 'air':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950/80 border border-sky-400/50 text-sky-300 font-bold flex items-center gap-1">
            <Plane className="w-2.5 h-2.5" />
            <span>空襲</span>
          </span>
        );
      case 'naval':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 border border-amber-400/50 text-amber-300 font-bold flex items-center gap-1">
            <Crosshair className="w-2.5 h-2.5" />
            <span>艦砲</span>
          </span>
        );
      case 'aa':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 font-bold flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            <span>防空</span>
          </span>
        );
      case 'sunk':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/80 border border-rose-400/50 text-rose-300 font-bold flex items-center gap-1">
            <Anchor className="w-2.5 h-2.5" />
            <span>擊沉</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3 shrink-0">
          <div className="flex items-center gap-3 text-[#80DEEA]">
            <ScrollText className="w-5 h-5 text-[#80DEEA]" />
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest font-mono">
                TACTICAL COMBAT LOG & CASUALTIES TELEMETRY
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA] font-mono flex items-center gap-2">
                <span>{t.battleLogTitle}</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#1976D2]/40 border border-[#80DEEA]/50 rounded-full text-[#80DEEA] font-normal">
                  {combatLogs.length} {lang === 'zh' ? '條戰況紀錄' : 'events'}
                </span>
              </h2>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#040C16] p-0.5 rounded-lg border border-[#1E3A5F]">
              <button
                onClick={() => setMainView('log')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mainView === 'log'
                    ? 'bg-[#1976D2] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '即時戰況紀錄' : 'Live Combat Log'}</span>
              </button>
              <button
                onClick={() => setMainView('casualties')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mainView === 'casualties'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.casualtiesSummary}</span>
              </button>
            </div>

            {onClearLogs && mainView === 'log' && (
              <button
                onClick={onClearLogs}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#061220] hover:bg-rose-950/40 border border-slate-700 hover:border-rose-400/60 rounded text-[11px] text-slate-400 hover:text-rose-300 transition-colors"
                title="清空紀錄"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">清空</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1E3A5F] rounded text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mainView === 'casualties' ? (
          /* ══════════════════════════════════════════════════════════
             雙方戰損總表 (CASUALTIES SUMMARY & FORCE BALANCE)
             ══════════════════════════════════════════════════════════ */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Force Balance Ratio Card */}
            <div className="bg-[#040C16] border border-[#1E3A5F] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="font-bold text-cyan-300 text-sm">美軍特混艦隊 (US PACIFIC FLEET)</span>
                </div>
                <div className="text-xs text-slate-400 font-bold">戰區實力對比與損失平衡</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-400 text-sm">
                    {era === 'era5'
                      ? '蘇聯紅旗太平洋艦隊 (SOVIET FLEET)'
                      : era === 'era4'
                      ? '北越/蘇聯海空軍部隊 (PAVN/SOVIET)'
                      : era === 'era3'
                      ? '遠東人民軍海空力量 (KPA/SOVIET)'
                      : '帝國海軍聯合艦隊 (IJN FLEET)'}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                </div>
              </div>

              {/* Balance bar */}
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      15,
                      Math.min(
                        85,
                        report.enemyTonnageLost + report.playerTonnageLost === 0
                          ? 50
                          : (report.enemyTonnageLost /
                              (report.enemyTonnageLost + report.playerTonnageLost + 1)) *
                              100
                      )
                    )}%`,
                  }}
                />
                <div className="flex-1 bg-gradient-to-r from-red-600 to-rose-500" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>美軍優勢戰損比</span>
                <span>{era === 'era5' ? '蘇聯紅海軍戰區部隊' : era === 'era4' ? 'OPFOR 水面與岸防部隊' : era === 'era3' ? '中蘇遠東聯軍' : '日軍聯合艦隊'}</span>
              </div>
            </div>

            {/* Side-by-Side Detailed Breakdown Table */}
            <div className="bg-[#061528] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg">
              <div className="grid grid-cols-12 bg-[#0A1E35] border-b border-[#1E3A5F] p-2.5 text-xs font-bold text-slate-300">
                <div className="col-span-5 text-left text-cyan-300 flex items-center gap-1.5">
                  <span>🇺🇸 美軍第十六特混艦隊</span>
                </div>
                <div className="col-span-2 text-center text-slate-400">作戰指標 / 統計項目</div>
                <div className="col-span-5 text-right text-rose-300 flex items-center justify-end gap-1.5">
                  <span>{era === 'era5' ? '🚩 蘇聯紅旗太平洋艦隊' : era === 'era4' ? '🚩 OPFOR 遠東紅海軍艦隊' : era === 'era3' ? '🚩 中蘇志願聯合艦隊' : '🇯🇵 大日本帝國海軍聯合艦隊'}</span>
                </div>
              </div>

              <div className="divide-y divide-[#122842] text-xs">
                {/* 1. 沉沒水面主力艦 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-slate-200">
                    <span className={report.playerShipsLost > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {report.playerShipsLost} 艘
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Anchor className="w-3.5 h-3.5 text-amber-400" />
                    <span>艦艇沉沒</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-rose-400">
                    <span>{report.enemyShipsLost} 艘</span>
                  </div>
                </div>

                {/* 2. 總沉沒排水量 (噸位) */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-slate-200">
                    <span className={report.playerTonnageLost > 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {report.playerTonnageLost.toLocaleString()} 噸
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>損失噸位</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-amber-300">
                    <span>{report.enemyTonnageLost.toLocaleString()} 噸</span>
                  </div>
                </div>

                {/* 3. 戰機擊落損失 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-slate-200">
                    <span className={report.playerPlanesLost > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {report.playerPlanesLost} 架
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>戰機擊墜</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-emerald-400">
                    <span>{report.enemyPlanesLost} 架</span>
                  </div>
                </div>

                {/* 4. 地面作戰人員與部隊傷亡 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-slate-200">
                    <span className={report.playerGroundLost > 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {report.playerGroundLost} 個作戰排
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>地面傷亡</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-emerald-400">
                    <span>{report.enemyGroundLost} 個作戰排</span>
                  </div>
                </div>

                {/* 5. 岸防要塞工事摧毀 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-slate-400">
                    <span>{report.playerInstallationsLost} 座</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>要塞瓦解</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-amber-400">
                    <span>{report.enemyInstallationsLost} 座摧毀</span>
                  </div>
                </div>

                {/* 6. 航空魚雷命中 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-cyan-300">
                    <span>{report.torpedoHitsScored} 發直接穿透水線</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <span>🦈 雷擊破孔</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-slate-400">
                    <span>-</span>
                  </div>
                </div>

                {/* 7. 穿甲炸彈直接命中 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-amber-300">
                    <span>{report.directHitsScored} 次甲板直接擊穿</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>航彈直擊</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-slate-400">
                    <span>-</span>
                  </div>
                </div>

                {/* 8. 致命核心爆擊 (Crits) */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors">
                  <div className="col-span-5 text-left font-bold text-rose-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{report.critsScored} 次彈藥庫殉爆 / 核心撕裂</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5 text-rose-400" />
                    <span>致命暴擊</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-slate-400">
                    <span>-</span>
                  </div>
                </div>

                {/* 9. 資源調遣累計消耗 */}
                <div className="grid grid-cols-12 p-3 items-center hover:bg-[#081B30] transition-colors bg-[#040C16]">
                  <div className="col-span-5 text-left font-bold text-cyan-300">
                    <span>{resourceState ? resourceState.totalSpent : 0} CP 已採購後勤投入</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>資源調遣</span>
                  </div>
                  <div className="col-span-5 text-right font-bold text-slate-400">
                    <span>物資枯竭 (封鎖中)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Assessment Box */}
            <div className="bg-[#05101E] border border-cyan-800/40 rounded-xl p-3 flex items-start gap-3 text-cyan-200">
              <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-xs mb-0.5">作戰參謀長戰況綜評 (TACTICAL ASSESSMENT)</div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  我軍在瓜島至鐵底灣海域持續保持戰略優勢。透過持續調遣巡洋艦與驅逐艦護航、派遣 B-17/B-24 萬米重轟炸實施基地壓制，並利用戰區資源點數 (CP) 即時補給部隊，敵軍聯合艦隊的反撲將在刺蝟防空火網與雷擊打擊下被逐步瓦解。
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════
             即時戰況紀錄 (REAL-TIME COMBAT LOG & TICKER)
             ══════════════════════════════════════════════════════════ */
          <>
            {/* Combat Stats Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
              <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>航彈直擊</span>
                </div>
                <div className="text-base font-bold text-amber-300 tabular-nums">{directHits} 次</div>
              </div>

              <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <span>💦 近失衝擊</span>
                </div>
                <div className="text-base font-bold text-sky-300 tabular-nums">{nearMisses} 次</div>
              </div>

              <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <span>🦈 魚雷命中</span>
                </div>
                <div className="text-base font-bold text-cyan-300 tabular-nums">{torpedoHits} 次</div>
              </div>

              <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <Anchor className="w-3 h-3 text-rose-400" />
                  <span>擊沉艦艇</span>
                </div>
                <div className="text-base font-bold text-rose-400 tabular-nums">{shipsSunk} 艘</div>
              </div>

              <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-2 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <Plane className="w-3 h-3 text-emerald-400" />
                  <span>擊落敵機</span>
                </div>
                <div className="text-base font-bold text-emerald-400 tabular-nums">{planesDowned} 架</div>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: 'all', label: '全部戰報', icon: null },
                    { id: 'air', label: '航空作戰', icon: <Plane className="w-3 h-3" /> },
                    { id: 'naval', label: '艦砲交火', icon: <Crosshair className="w-3 h-3" /> },
                    { id: 'aa', label: '防空防護', icon: <Shield className="w-3 h-3" /> },
                    { id: 'sunk', label: '戰果擊沉', icon: <Anchor className="w-3 h-3" /> },
                  ] as const
                ).map((tab) => {
                  const isSel = activeTab === tab.id;
                  const count =
                    tab.id === 'all'
                      ? combatLogs.length
                      : combatLogs.filter((l) => l.category === tab.id).length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                        isSel
                          ? 'bg-[#1976D2] border-[#80DEEA] text-white shadow-sm'
                          : 'bg-[#040C16] border-[#1E3A5F] text-slate-400 hover:text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      <span className="text-[9px] px-1 bg-black/40 rounded font-normal">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜尋戰報關鍵字、艦名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-[#040C16] border border-[#1E3A5F] focus:border-[#80DEEA] rounded text-slate-200 placeholder-slate-500 text-[11px] focus:outline-none"
                />
              </div>
            </div>

            {/* Combat Log List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono">
                  <div className="text-sm">尚無相關交火或戰報紀錄</div>
                  <div className="text-[10px] mt-1 text-slate-600">
                    等待戰機投彈、艦隊砲擊或防空火網開火即會自動記錄
                  </div>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isPlayerSource = log.sourceSide === 'player';
                  const isCrit = log.isCrit;
                  const isDirectHit = log.actionType === 'bomb_hit' || log.actionType === 'bomb_crit';
                  const isTorpedo = log.actionType === 'torpedo_hit';
                  const isSunk = log.actionType === 'ship_sunk';

                  return (
                    <div
                      key={log.id}
                      className={`pt-2 flex items-start gap-2.5 p-2 rounded-lg transition-colors border ${
                        isSunk
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : isCrit
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-[#05101E] border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Timestamp */}
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 pt-0.5 tabular-nums">
                        [{log.timeStr}]
                      </span>

                      {/* Category Badge */}
                      <div className="shrink-0 pt-0.5">{getCategoryBadge(log.category)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {/* Attacker */}
                          <span
                            className={`font-bold text-[11px] ${
                              isPlayerSource ? 'text-sky-300' : 'text-rose-400'
                            }`}
                          >
                            {log.sourceName}
                          </span>

                          <span className="text-slate-500 text-[10px]">➔</span>

                          {/* Target */}
                          <span className="font-semibold text-slate-300 text-[11px]">
                            {log.targetName}
                          </span>
                        </div>

                        {/* Description Text */}
                        <div className="text-slate-200 text-[11px] leading-relaxed break-words">
                          {log.text}
                        </div>
                      </div>

                      {/* Damage Pill if applicable */}
                      {log.damage !== undefined && log.damage > 0 && (
                        <div className="shrink-0 self-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] tabular-nums whitespace-nowrap ${
                              isCrit
                                ? 'bg-amber-500 text-black shadow-sm'
                                : isDirectHit
                                ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                                : isTorpedo
                                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                                : 'bg-slate-800 text-slate-300 border border-slate-600'
                            }`}
                          >
                            -{log.damage} HP
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-[#1E3A5F] pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 shrink-0">
          <div>
            <span>
              {lang === 'zh'
                ? '💡 提示：航空炸彈直擊重創裝甲甲板，魚雷撕裂水線破甲；戰損總表隨時提供雙方戰力與噸位對比。'
                : '💡 Note: Dive bomb direct hits pierce armor; torpedoes rupture waterlines; telemetry tracks casualties.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded font-bold transition-colors w-full sm:w-auto text-center"
          >
            {lang === 'zh' ? '關閉戰報 (CLOSE)' : 'Close Log'}
          </button>
        </div>
      </div>
    </div>
  );
};
