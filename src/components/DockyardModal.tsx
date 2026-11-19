import React, { useEffect } from 'react';
import { Ship, FleetUpgrades, Era } from '../types/game';
import { Wrench, Shield, Plane, Crosshair, X, Sparkles, Anchor, Zap, Radar, ArrowRight } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface DockyardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stars: number;
  onSpendStars: (amount: number) => boolean;
  playerShips: Ship[];
  onRepairShips: () => void;
  upgrades: FleetUpgrades;
  onUpgrade: (type: keyof FleetUpgrades) => void;
  era: Era;
  onSetEra: (era: Era) => void;
  onNextSector?: () => void;
  canAdvance?: boolean;
}

export const DockyardModal: React.FC<DockyardModalProps> = ({
  isOpen,
  onClose,
  stars,
  onSpendStars,
  playerShips: _playerShips,
  onRepairShips,
  upgrades,
  onUpgrade,
  era,
  onSetEra,
  onNextSector,
  canAdvance = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRepair = () => {
    if (stars >= 2) {
      if (onSpendStars(2)) {
        onRepairShips();
        soundEngine.playTorpedoLaunch();
      }
    }
  };

  const handleUpgradeClick = (type: keyof FleetUpgrades, cost: number) => {
    if (stars >= cost) {
      if (onSpendStars(cost)) {
        onUpgrade(type);
        soundEngine.playTorpedoLaunch();
      }
    }
  };

  const upgradeList: {
    key: keyof FleetUpgrades;
    name: string;
    level: number;
    cost: number;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'hullArmorLevel',
      name: '艦體鋼裝甲強化 (Hull Armor)',
      level: upgrades.hullArmorLevel,
      cost: upgrades.hullArmorLevel + 1,
      desc:
        '重裝甲雙層防禦，減少 15% 砲擊與魚雷實體傷害',
      icon: <Shield className="w-4 h-4 text-[#80DEEA]" />,
    },
    {
      key: 'aaFirepowerLevel',
      name: '全艦防空火網延伸 (AA Barrage Range)',
      level: upgrades.aaFirepowerLevel,
      cost: upgrades.aaFirepowerLevel + 1,
      desc:
        '升級 VT 無線電近發引信，防空射程 +15% 並提升攔截率',
      icon: <Crosshair className="w-4 h-4 text-[#FFD54F]" />,
    },
    {
      key: 'carrierCapacityLevel',
      name: '飛行甲板機庫擴建 (Carrier Capacity)',
      level: upgrades.carrierCapacityLevel,
      cost: upgrades.carrierCapacityLevel + 2,
      desc:
        '改建雙層機庫與甲板繫留，每種戰備飛機上限 +2 架',
      icon: <Plane className="w-4 h-4 text-[#00E676]" />,
    },
    {
      key: 'radarRangeLevel',
      name: '高空搜索雷達強化 (Radar Detection)',
      level: upgrades.radarRangeLevel,
      cost: upgrades.radarRangeLevel + 1,
      desc:
        '升級 CXAM / SK 早期預警雷達，提前探測敵方遠程機群',
      icon: <Zap className="w-4 h-4 text-[#4DD0E1]" />,
    },
    {
      key: 'artilleryDamageLevel',
      name: '穿甲主砲彈道火控 (Gunfire Accuracy)',
      level: upgrades.artilleryDamageLevel,
      cost: upgrades.artilleryDamageLevel + 1,
      desc:
        '火控光學測距儀與穿甲彈藥強化，主砲殺傷力 +20%',
      icon: <Anchor className="w-4 h-4 text-amber-300" />,
    },
    {
      key: 'depthChargeSonarLevel',
      name: '主動聲納與反潛深彈 (Sonar & ASW)',
      level: upgrades.depthChargeSonarLevel,
      cost: upgrades.depthChargeSonarLevel + 1,
      desc:
        '升級主動艦殼聲納與深水炸彈／刺蝟砲裝藥，聲納半徑 +18%、反潛傷害 +20%',
      icon: <Radar className="w-4 h-4 text-emerald-300" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-3 text-[#FFD54F]">
            <div className="p-2 bg-[#0B233A] border border-amber-400/40 rounded-lg text-amber-300">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest uppercase font-bold">
                {'PEARL HARBOR NAVAL SHIPYARD & MODERNIZATION'}
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA]">
                珍珠港海軍造船廠
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1E34] border border-amber-500/70 rounded text-[#FFD54F] font-bold shadow-sm">
              <span>★</span>
              <span className="tabular-nums text-sm">{stars}</span>
              <span className="text-[10px] text-[#90CAF9]">功勳星徽</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#90CAF9] hover:text-white hover:bg-[#1E3A5F]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fleet Overhaul Action */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-1">
            <div className="font-bold text-sm text-[#00E5FF] flex items-center gap-1.5">
              <Anchor className="w-4 h-4 text-cyan-300" />
              <span>艦隊損害管制與大修</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              消耗功勳星徽，徹底修復所有戰艦裝甲並補滿航母機庫戰備飛機。
            </p>
          </div>
          <button
            onClick={handleRepair}
            disabled={stars < 2}
            className={`px-4 py-2 rounded font-bold whitespace-nowrap transition-all shadow ${
              stars >= 2
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-900/50 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>損害管制大修 (消耗 2★)</span>
          </button>
        </div>

        {/* Era Selection Section */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-sm text-[#80DEEA]">
            <Sparkles className="w-4 h-4 text-[#FFD54F]" />
            <span>特遣艦隊時代跨越</span>
          </div>
          <p className="text-[11px] text-slate-300">
            切換太平洋戰爭前期、後期快速航母艦隊或冷戰噴射艦隊編制。
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            {/* Era 1 */}
            <button
              type="button"
              onClick={() => onSetEra('era1')}
              className={`p-3 rounded-lg border text-left transition-all ${
                era === 'era1'
                  ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.25)] ring-1 ring-[#00E676]'
                  : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA]'
              }`}
            >
              <div className="font-bold text-xs text-[#E0F7FA]">時代一 (1942)</div>
              <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                ENTERPRISE CV-6
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                野貓／無畏／破壞者／北卡羅來納
              </div>
            </button>

            {/* Era 2 */}
            <button
              type="button"
              onClick={() => onSetEra('era2')}
              className={`p-3 rounded-lg border text-left transition-all ${
                era === 'era2'
                  ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.25)] ring-1 ring-[#00E676]'
                  : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA]'
              }`}
            >
              <div className="font-bold text-xs text-[#E0F7FA]">時代二 (1944-45)</div>
              <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                ESSEX CV-9 FLEET
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                地獄貓／海盜／俯衝者／復仇者／密蘇里
              </div>
            </button>

            {/* Era 3 */}
            <button
              type="button"
              onClick={() => onSetEra('era3')}
              className={`p-3 rounded-lg border text-left transition-all ${
                era === 'era3'
                  ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.25)] ring-1 ring-[#00E676]'
                  : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA]'
              }`}
            >
              <div className="font-bold text-xs text-[#E0F7FA]">時代三 (1950-53)</div>
              <div className="text-[10px] text-cyan-300 font-semibold mt-0.5">
                ORISKANY CV-34 JET
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                黑豹／女妖／天襲者／衛士／米格走廊
              </div>
            </button>

            {/* Era 4 */}
            <button
              type="button"
              onClick={() => onSetEra('era4')}
              className={`p-3 rounded-lg border text-left transition-all ${
                era === 'era4'
                  ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.25)] ring-1 ring-[#00E676]'
                  : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA]'
              }`}
            >
              <div className="font-bold text-xs text-[#E0F7FA]">時代四 (1965-73)</div>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                KITTY HAWK CV-63
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                小鷹號／幽靈／入侵者／雷公／飛彈體系
              </div>
            </button>

            {/* Era 5 */}
            <button
              type="button"
              onClick={() => onSetEra('era5')}
              className={`p-3 rounded-lg border text-left transition-all col-span-2 sm:col-span-1 ${
                era === 'era5'
                  ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.25)] ring-1 ring-[#00E676]'
                  : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA]'
              }`}
            >
              <div className="font-bold text-xs text-[#E0F7FA]">時代五 (1973-91)</div>
              <div className="text-[10px] text-purple-300 font-semibold mt-0.5">
                NIMITZ CVN-68
              </div>
              <div className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                神盾巡洋艦／F-14A 鳳凰／戰斧／白令海飽和
              </div>
            </button>
          </div>
        </div>

        {/* Upgrade Trees */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3.5 space-y-3 shadow-md">
          <div className="font-bold text-sm text-[#FFD54F] flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>艦隊科技與戰術現代化研發</span>
          </div>

          <div className="space-y-2">
            {upgradeList.map((item) => (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#071322] border border-[#1E3A5F] rounded-lg hover:border-slate-500 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    {item.icon}
                    <span>{item.name}</span>
                    <span className="px-1.5 py-0.2 bg-[#1976D2]/60 border border-sky-400/40 rounded text-[10px] text-sky-200">
                      LV {item.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleUpgradeClick(item.key, item.cost)}
                  disabled={stars < item.cost}
                  className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all shadow ${
                    stars >= item.cost
                      ? 'bg-[#1976D2] hover:bg-[#1565C0] text-white active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>{`升級 (${item.cost}★)`}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-[#1E3A5F]">
          {canAdvance && onNextSector && (
            <button
              onClick={() => {
                onClose();
                onNextSector();
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors shadow flex items-center gap-1.5"
            >
              <span>晉級下一作戰分區 (NEXT SECTOR)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold rounded transition-colors shadow"
          >
            完成並返回 (CLOSE)
          </button>
        </div>
      </div>
    </div>
  );
};
