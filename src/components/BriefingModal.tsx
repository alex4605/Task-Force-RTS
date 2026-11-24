import React, { useEffect } from 'react';
import { ERA_ECONOMY_NOTE } from '../game/economy';

/** The theatre command issuing the orders in each era. */
const COMMAND: Record<string, string> = {
  era1: 'CINCPAC',
  era2: 'CINCPAC',
  era3: 'CINCFE · UNC',
  era4: 'CINCPAC · MACV',
  era5: 'SACLANT · NATO',
};
import { SectorIntel } from '../types/game';
import { FileText, Target, Crosshair, CheckCircle2, X, ShieldAlert, Compass } from 'lucide-react';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  intel: SectorIntel | null;
  onStart: () => void;
  onQuickStart?: () => void;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  isOpen,
  onClose,
  intel,
  onStart,
  onQuickStart,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !intel) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs text-slate-100">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B233A] border border-[#00E5FF]/40 rounded-lg text-[#00E5FF]">
              <FileText className="w-5 h-5 text-[#80DEEA]" />
            </div>
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest uppercase font-bold flex items-center gap-1.5">
                <span className="text-[#00E5FF]">[{COMMAND[intel.era]}]</span>
                <span>{`${COMMAND[intel.era]} OPERATIONAL BRIEFING & DISPATCH`}</span>
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA] tracking-wide mt-0.5">
                {`第 ${intel.sectorNumber} 作戰海域`}: {intel.sectorName.toUpperCase()}
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
            <span>TOP SECRET // {COMMAND[intel.era]}</span>
          </span>
          <span className="text-slate-400">
            戰區戰役指令 · 即刻生效
          </span>
        </div>

        {/* Dispatch Body */}
        <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-4 space-y-3 font-mono text-[#E0F7FA]/90 leading-relaxed text-xs">
          <div className="text-[#80DEEA] font-semibold text-[11px] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>當前戰場敵情簡報 (SITREP)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{intel.briefing}</p>

          <div className="pt-2.5 border-t border-[#1E3A5F]/60 space-y-2">
            <div className="flex items-start gap-2 text-[#FFD54F]">
              <Target className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold">主要作戰目標: </span>
                <span className="text-slate-200">{intel.primaryObjective}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[#90CAF9]">
              <Crosshair className="w-4 h-4 mt-0.5 shrink-0 text-sky-400" />
              <div>
                <span className="font-bold">次要戰術目標: </span>
                <span className="text-slate-200">{intel.secondaryObjective}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Tactics Advice */}
        <div className="space-y-1.5 font-mono text-[#90CAF9] text-[11px] bg-[#07192C]/50 border border-[#1E3A5F]/60 rounded-lg p-3">
          <div className="text-[#80DEEA] font-bold">司令部戰術參謀指引:</div>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[10.5px]">
            {(
              <>
                {intel.era === 'era5' ? (
                  <>
                    <li>【宙斯盾防空與反艦學說】提康德羅加神盾與 F-14A 需優先擊落高空巡航的 P-700 花崗岩「領彈」以中斷資料鏈，削弱超音速掠海彈群（蘇聯依艦級每波 8～16 枚）；我軍 Mk 141 發射箱艦艇採 8 枚魚叉俯衝齊射、OHP 單臂 Mk 13 採單發快裝、北約友軍飛魚 MM40/MM38 則採超低空貼海突防。</li>
                    <li>【被動聲納浮標反潛網】派遣 S-3A / P-3C / SH-3F 按 <span className="text-cyan-300 font-bold">G</span>（Shift 連點）在航道前緣佈設 AN/SSQ-53 DIFAR 浮標，間歇暴露水下奧斯卡／維克托／阿庫拉核潛艦。</li>
                    <li>【SEAD 電戰防空壓制】先以 EA-6B 徘徊者（AGM-88 HARM 反輻射飛彈）摧毀敵 S-300 / SA-11 雷達陣地，再推進戰斧／魚叉與重裝攻擊機群。</li>
                    <li>【核威懾平衡警告】動用俄亥俄級三叉戟 II SLBM 或戰術核彈將立即觸發華約颱風級核潛艦與逆火轟炸機的全面核報復。</li>
                  </>
                ) : intel.era === 'era4' ? (
                  <>
                    <li>【麻雀半主動雷達導引】AIM-7 Sparrow 需母機機頭持續鎖定目標 (±50°照射錐角，最小射程 1100m)；目標貼地低飛 (&lt;300m) 將被地面雜波掩蔽導致脫鎖。</li>
                    <li>【響尾蛇後半球紅外鎖定】早期 AIM-9B/D 僅能在尾後 ±40° 排氣管熱源錐角內鎖定；高過載 (&gt;2.5G) 機動時無法發射，需把握最佳追尾窗口。</li>
                    <li>【自動被動防禦】我方超音速戰機遭遇敵 SA-2 地空飛彈或空空飛彈鎖定時，將自動拋射干擾絲 (Chaff) 與熱焰彈 (Flare) 並做高 G 規避。</li>
                    <li>【防範冥河反艦突襲】早期艦載防空飛彈缺乏超低空截擊能力，面對 Osa/Komar 飛彈快艇群突襲，請搶先以機載攻擊擊沉，或依靠艦載全自動艦砲彈幕防禦。</li>
                  </>
                ) : intel.era === 'era3' ? (
                  <>
                    <li>【軍刀機 APG-30 雷達瞄具】F-86 配備 APG-30 雷達測距計算瞄具，高初速 .50 機槍彈道極為緊實，大幅提升前置偏轉角射擊命中率。</li>
                    <li>【防範米格重砲截擊】MiG-15 裝備 37mm N-37 與 23mm NR-23 重型機砲，單發威力驚人；請發揮機動與編隊掩護優勢，避免正面對頭交火。</li>
                    <li>【反潛聲自導魚雷】自時代三起艦艇與反潛機裝備聲自導反潛魚雷，可主動鎖定追蹤敵水下潛艦。</li>
                    <li>【城區掩體與陸空協同】城市、橡膠園與工廠提供部隊高額防護；空軍基地持續補給戰力支援登陸推移。</li>
                  </>
                ) : intel.era === 'era2' ? (
                  <>
                    <li>【防空火網攔截】請保持戰鬥機空中巡邏 (CAP) 攔截神風特攻與櫻花火箭；B-29 飛在高射砲射高之上，只有敵戰鬥機能威脅它們。</li>
                    <li>【兩棲登陸突擊】派遣 LCVP / LST 靠岸裝載陸戰隊與裝甲排，航抵敵島灘頭右鍵點擊執行搶灘登陸。</li>
                    <li>【城區掩體優勢】城鎮與要塞提供部隊 70% 航彈防禦與 50% 直射減傷；注意避開平民掩蔽部以免政治值 (PP) 流失。</li>
                    <li>【VT信管與雷達火控】裝備 VT 接近引信與火控雷達之巡洋艦與驅逐艦可建立綿密艦隊防空圈。</li>
                  </>
                ) : (
                  <>
                    <li>【機場與轉場】每座機場有獨立的飛機庫存，所有增援先抵達 HQ 島機場；可自任一機場或航艦派機轉場至其他機場或航艦（實際飛行，抵達後入庫），並由所在基地出擊、返航。</li>
                    <li>【兩棲登陸突擊】派遣 LCVP / LST 靠岸裝載陸戰隊與裝甲排，航抵敵島灘頭右鍵點擊執行搶灘登陸。</li>
                    <li>【城區掩體優勢】城市、城鎮與難民營提供部隊 70% 航彈防禦與 50% 直射減傷；誤擊平民收容區將扣除政治值 (PP) 戰略懲戒。</li>
                    <li>【艦載偵察索敵】善用 OS2U 偵察機探明敵艦隊方位，先敵發現、先敵實施俯衝轟炸與魚雷夾擊。</li>
                  </>
                )}
                <li>【搜救與戰俘】跳傘落地的機組員會躲藏並避開敵軍巡邏隊，派地面部隊或搭載救援員的直升機接近即可救回（返還 TP）；可指定艦艇搜救海域。雙方據點都會派出巡邏隊搜捕落地的敵方飛行員。</li>
                <li>
                  【戰爭經濟】{ERA_ECONOMY_NOTE[intel.era]}。增援與構工需消耗 MP 人力／RP 資源／PP 政治／TP 時間四種資源，
                  佔領據點推進戰役階段會提高動員程度與產出；我軍傷亡與誤擊平民會使政治值流失。
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-2.5 pt-1">
          {onQuickStart && (
            <button
              type="button"
              onClick={onQuickStart}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B233A] hover:bg-[#14375A] border border-emerald-400/70 text-emerald-300 rounded font-mono font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
            >
              <span>⚡ 立即投入作戰 (預設編制)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1976D2] to-[#0288D1] hover:from-[#2196F3] hover:to-[#039BE5] text-white rounded font-mono font-bold text-xs transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>接受訓令 · 全軍展開作戰</span>
          </button>
        </div>
      </div>
    </div>
  );
};
