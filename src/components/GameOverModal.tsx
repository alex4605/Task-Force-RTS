import React from 'react';
import { GameScore, SectorIntel } from '../types/game';
import { Trophy, Skull, RotateCcw, ArrowRight, Award, Star } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  score: GameScore;
  intel: SectorIntel | null;
  onNextSector: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  intel,
  onNextSector,
  onRestart,
}) => {

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-2">
            {isVictory ? (
              <div className="p-3.5 bg-[#1B5E20]/60 border border-[#4CAF50] rounded-full text-[#66BB6A] shadow-[0_0_20px_rgba(76,175,80,0.4)]">
                <Trophy className="w-9 h-9" />
              </div>
            ) : (
              <div className="p-3.5 bg-[#B71C1C]/60 border border-[#EF5350] rounded-full text-[#EF5350] shadow-[0_0_20px_rgba(239,83,80,0.4)]">
                <Skull className="w-9 h-9" />
              </div>
            )}
          </div>

          <h2
            className={`text-xl font-bold font-mono tracking-wider ${
              isVictory ? 'text-[#81C784]' : 'text-[#E57373]'
            }`}
          >
            {isVictory ? '作戰大捷 · 戰區肅清成功' : '戰區作戰失利 · 旗艦傾覆沉沒'}
          </h2>
          <div className="text-[11px] text-[#90CAF9] max-w-md mx-auto leading-relaxed">
            {isVictory
              ? `第 ${intel?.sectorNumber || 1} 戰區敵方主力水面艦隊與島嶼防空要塞已遭全面瓦解肅清！`
              : '旗艦蒙受致命毀滅性重創傾覆沉沒，特遣作戰中斷。'}
          </div>
        </div>

        {/* Action Performance Readout */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-4 space-y-2.5 font-mono">
          <div className="text-[#80DEEA] font-semibold text-[11px] border-b border-[#1E3A5F] pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>戰鬥效益評估與積分結算</span>
            </span>
            <span className="text-amber-300 flex items-center gap-1 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>+{isVictory ? 4 : 0} 功勳星徽</span>
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span>擊沉敵水面戰艦：</span>
            <span className="tabular-nums font-bold text-white">
              {score.enemyShipsSunk}{' 艘'}
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span>擊落敵戰備戰機：</span>
            <span className="tabular-nums font-bold text-white">
              {score.enemyPlanesDowned}{' 架'}
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span>摧毀要塞砲台／岸防設施：</span>
            <span className="tabular-nums font-bold text-white">
              {score.installationsDestroyed}{' 座'}
            </span>
          </div>

          <div className="flex justify-between text-slate-300">
            <span>累計肅清戰區海域：</span>
            <span className="tabular-nums font-bold text-white">
              {score.sectorsCleared}{' 區'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#1E3A5F] flex justify-between text-[#FFD54F] font-bold text-sm">
            <span>戰果總分:</span>
            <span className="tabular-nums text-base">{score.totalScore} PTS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-1">
          {isVictory ? (
            <button
              onClick={onNextSector}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1976D2] to-[#00E676] hover:from-[#2196F3] hover:to-[#00C853] text-[#06101E] font-mono font-bold rounded shadow-lg transition-transform active:scale-95"
            >
              <span>晉級下一作戰分區 (NEXT SECTOR)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-white font-mono font-bold rounded shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新啟動本關作戰 (RETRY SECTOR)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
