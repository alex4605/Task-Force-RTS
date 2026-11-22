import React, { useEffect } from 'react';
import { Era } from '../types/game';
import { Wrench, X, Sparkles, ArrowRight } from 'lucide-react';

interface DockyardModalProps {
  isOpen: boolean;
  onClose: () => void;
  era: Era;
  onSetEra: (era: Era) => void;
  onNextSector?: () => void;
  canAdvance?: boolean;
}

export const DockyardModal: React.FC<DockyardModalProps> = ({
  isOpen,
  onClose,
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
                {'THEATRE & ERA SELECTION'}
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA]">
                戰區與時代選擇
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#90CAF9] hover:text-white hover:bg-[#1E3A5F]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
