import React from 'react';
import { SectorIntel } from '../types/game';
import { Language, getTranslation } from '../game/i18n';
import { FileText, Target, Crosshair, CheckCircle2, X, ShieldAlert, Compass } from 'lucide-react';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  intel: SectorIntel | null;
  onStart: () => void;
  lang?: Language;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  isOpen,
  onClose,
  intel,
  onStart,
  lang = 'zh',
}) => {
  if (!isOpen || !intel) return null;
  const t = getTranslation(lang);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B233A] border border-[#00E5FF]/40 rounded-lg text-[#00E5FF]">
              <FileText className="w-5 h-5 text-[#80DEEA]" />
            </div>
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest uppercase font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span>{t.briefingSubtitle}</span>
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA] tracking-wide mt-0.5">
                {lang === 'zh' ? `第 ${intel.sectorNumber} 作戰海域` : `SECTOR ${intel.sectorNumber}`}: {intel.sectorName.toUpperCase()}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#90CAF9] hover:text-white hover:bg-[#1E3A5F]/50 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Classification & Seal Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B1E34] border border-[#1E3A5F]/80 rounded text-[10px] text-[#80DEEA]">
          <span className="flex items-center gap-1 font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>TOP SECRET // CINCPAC DEPT OF THE NAVY</span>
          </span>
          <span className="text-slate-400">
            {lang === 'zh' ? '戰區戰役指令 · 即刻生效' : 'IMMEDIATE OPERATIONAL DIRECTIVE'}
          </span>
        </div>

        {/* Dispatch Body */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-4 space-y-3 font-mono text-[#E0F7FA]/90 leading-relaxed text-xs">
          <div className="text-[#80DEEA] font-semibold text-[11px] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.situationReport}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{intel.briefing}</p>

          <div className="pt-2.5 border-t border-[#1E3A5F]/60 space-y-2">
            <div className="flex items-start gap-2 text-[#FFD54F]">
              <Target className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold">{t.primaryObjective}: </span>
                <span className="text-slate-200">{intel.primaryObjective}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[#90CAF9]">
              <Crosshair className="w-4 h-4 mt-0.5 shrink-0 text-sky-400" />
              <div>
                <span className="font-bold">{t.secondaryObjective}: </span>
                <span className="text-slate-200">{intel.secondaryObjective}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Tactics Advice */}
        <div className="space-y-1.5 font-mono text-[#90CAF9] text-[11px] bg-[#07192C]/50 border border-[#1E3A5F]/60 rounded-lg p-3">
          <div className="text-[#80DEEA] font-bold">{t.tacticalAdvice}:</div>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[10.5px]">
            {lang === 'zh' ? (
              <>
                <li>【空軍基地轉場】後方空軍基地定時補充戰機，可調派轉場飛往航母機庫或直接自基地發動長程空襲。</li>
                <li>【兩棲登陸突擊】派遣 LCVP / LST 靠岸裝載陸戰隊與裝甲排，航抵敵島灘頭右鍵點擊執行搶灘登陸。</li>
                <li>【城區掩體優勢】城市、城鎮與難民營提供部隊 70% 航彈防禦與 50% 直射減傷；誤擊平民收容區將扣除 15 CP 戰略懲戒。</li>
                <li>【防空火網攔截】時代二請保持戰鬥機空中巡邏 (CAP) 攔截神風特攻與火箭；旗艦可開啟密集防空彈幕。</li>
              </>
            ) : (
              <>
                <li>【Airbase Sorties】Continental and island airbases periodically replenish aircraft for long-range strikes or carrier ferry.</li>
                <li>【Amphibious Assault】Embark marine rifle platoons and armor aboard LCVP / LST and land them on beachheads to storm strongholds.</li>
                <li>【Urban Terrain Cover】Urban zones grant units 70% bomb damage reduction and 50% direct fire cover. Collateral damage costs -15 CP.</li>
                <li>【Air Defense Umbrella】Maintain Combat Air Patrols (CAP) to intercept strike waves; trigger fleet AA flak barrages against dive bombers.</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={() => {
              onClose();
              onStart();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1976D2] to-[#0288D1] hover:from-[#2196F3] hover:to-[#039BE5] text-white rounded font-mono font-bold text-xs transition-all shadow-lg active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{t.commenceAction}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
