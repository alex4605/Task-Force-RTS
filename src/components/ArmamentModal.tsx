import React, { useState, useEffect } from 'react';
import {
  Era,
  AircraftRole,
  AircraftPayloadType,
  PAYLOAD_CATALOG,
  PayloadOption,
} from '../types/game';
import { Language, getTranslation } from '../game/i18n';
import {
  X,
  Crosshair,
  Shield,
  Target,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../game/audio';

interface ArmamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  era: Era;
  activePayloads: Record<AircraftRole, AircraftPayloadType>;
  onSelectPayload: (role: AircraftRole, payload: AircraftPayloadType) => void;
  lang?: Language;
}

export const ArmamentModal: React.FC<ArmamentModalProps> = ({
  isOpen,
  onClose,
  era,
  activePayloads,
  onSelectPayload,
  lang = 'zh',
}) => {
  const [activeRoleFilter, setActiveRoleFilter] = useState<AircraftRole | 'all'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const t = getTranslation(lang);

  const roleConfigs: {
    role: AircraftRole;
    title: string;
    planes: string;
    icon: React.ReactNode;
    color: string;
    options: PayloadOption[];
  }[] = [
    {
      role: 'fighter',
      title: lang === 'zh' ? '戰鬥機外掛配置 (FIGHTERS)' : 'Carrier Fighters (Fighters)',
      planes:
        era === 'era5'
          ? 'F-14A Tomcat / F/A-18A Hornet / F-15A Eagle / F-16A Falcon'
          : era === 'era4'
          ? 'F-4B / F-4J Phantom II / F-8 Crusader / F-4E'
          : era === 'era1'
          ? 'P-40 Warhawk / F4F Wildcat'
          : era === 'era2'
          ? 'P-51 Mustang / P-38 Lightning / F6F Hellcat / F4U Corsair'
          : 'F-86 Sabre / F9F Panther / F2H Banshee / F8F Bearcat',
      icon: <Shield className="w-4 h-4 text-[#80DEEA]" />,
      color: 'border-[#1976D2]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.aim54_phoenix,
              PAYLOAD_CATALOG.aim7_aim9_combo,
              PAYLOAD_CATALOG.rgm84_harpoon,
              PAYLOAD_CATALOG.agm88_harm,
              PAYLOAD_CATALOG.agm65_maverick,
              PAYLOAD_CATALOG.aim7_sparrow,
              PAYLOAD_CATALOG.aim9_sidewinder,
              PAYLOAD_CATALOG.clean_guns,
              PAYLOAD_CATALOG.tactical_b61_nuke,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.aim7_aim9_combo,
              PAYLOAD_CATALOG.aim7_sparrow,
              PAYLOAD_CATALOG.aim9_sidewinder,
              PAYLOAD_CATALOG.clean_guns,
              PAYLOAD_CATALOG.blu27_napalm,
              PAYLOAD_CATALOG.bombs_snakeye_retarded,
              PAYLOAD_CATALOG.agm12_bullpup,
              PAYLOAD_CATALOG.tactical_b61_nuke,
            ]
          : era === 'era3'
          ? [
              PAYLOAD_CATALOG.clean_guns,
              PAYLOAD_CATALOG.hvar_rockets,
              PAYLOAD_CATALOG.bomb_500,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.napalm_canister,
            ]
          : era === 'era2'
          ? [
              PAYLOAD_CATALOG.clean_guns,
              PAYLOAD_CATALOG.bomb_500,
              PAYLOAD_CATALOG.bombs_dual_500,
              PAYLOAD_CATALOG.hvar_rockets,
            ]
          : [
              PAYLOAD_CATALOG.clean_guns,
              PAYLOAD_CATALOG.bomb_500,
            ],
    },
    {
      role: 'dive_bomber',
      title: lang === 'zh' ? '俯衝/戰術攻擊機主武裝 (DIVE & STRIKE)' : 'Dive Bombers & Strike',
      planes:
        era === 'era5'
          ? 'A-6E Intruder / AV-8B Harrier II / F-111 Aardvark'
          : era === 'era4'
          ? 'A-4 Skyhawk / A-7 Corsair II / A-6A Intruder'
          : era === 'era1'
          ? 'SBD-3 Dauntless 無畏'
          : era === 'era2'
          ? 'SB2C-4 Helldiver 地獄俯衝'
          : 'AD-1 Skyraider 天襲者 / F4U-4 海盜',
      icon: <Crosshair className="w-4 h-4 text-[#FFD54F]" />,
      color: 'border-[#FFB300]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.agm65_maverick,
              PAYLOAD_CATALOG.rgm84_harpoon,
              PAYLOAD_CATALOG.agm88_harm,
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.mer_iron_bombs,
              PAYLOAD_CATALOG.bombs_snakeye_retarded,
              PAYLOAD_CATALOG.tactical_b61_nuke,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.blu27_napalm,
              PAYLOAD_CATALOG.mer_iron_bombs,
              PAYLOAD_CATALOG.agm62_walleye,
              PAYLOAD_CATALOG.bombs_snakeye_retarded,
              PAYLOAD_CATALOG.agm12_bullpup,
              PAYLOAD_CATALOG.bomb_2000,
            ]
          : era === 'era3'
          ? [
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bomb_2000,
              PAYLOAD_CATALOG.bombs_dual_500,
            ]
          : era === 'era2'
          ? [
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_500,
              PAYLOAD_CATALOG.bomb_1600,
            ]
          : [
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_500,
            ],
    },
    {
      role: 'torpedo_bomber',
      title: lang === 'zh' ? '魚雷打擊機／反潛配置 (TORPEDO & ASW)' : 'Torpedo & ASW Bombers',
      planes:
        era === 'era5'
          ? 'S-3A Viking / SH-3F Sea King / P-3C Orion (聲納浮標 + Mk 46)'
          : era === 'era4'
          ? 'A-6A Intruder / S-2 Tracker / SH-2 Seasprite / P-3C'
          : era === 'era1'
          ? 'TBD Devastator 毀滅者'
          : era === 'era2'
          ? 'TBF-1C Avenger 復仇者'
          : 'AF-2 Guardian 衛士 (獵潛機)',
      icon: <Target className="w-4 h-4 text-[#4DD0E1]" />,
      color: 'border-[#00ACC1]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.asw_acoustic_torpedo,
              PAYLOAD_CATALOG.rgm84_harpoon,
              PAYLOAD_CATALOG.asw_torpedo,
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.depth_bombs,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.asw_acoustic_torpedo,
              PAYLOAD_CATALOG.asw_torpedo,
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.depth_bombs,
              PAYLOAD_CATALOG.aerial_torpedo,
              PAYLOAD_CATALOG.bomb_1000,
            ]
          : era === 'era3'
          ? [
              PAYLOAD_CATALOG.asw_torpedo,
              PAYLOAD_CATALOG.aerial_torpedo,
              PAYLOAD_CATALOG.depth_bombs,
              PAYLOAD_CATALOG.bomb_1000,
            ]
          : [
              PAYLOAD_CATALOG.aerial_torpedo,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_500,
              PAYLOAD_CATALOG.depth_bombs,
            ],
    },
    {
      role: 'attacker',
      title: lang === 'zh' ? '重型攻擊／電戰與對地支援 (ATTACKERS & CAS)' : 'Heavy Attackers & SEAD',
      planes:
        era === 'era5'
          ? 'EA-6B Prowler / A-10A Warthog / AH-64A Apache / AH-1W'
          : era === 'era4'
          ? 'A-6B Wild Weasel / F-105D / A-7D / A-4F / OV-10'
          : era === 'era1'
          ? 'A-20 Havoc 浩劫'
          : era === 'era2'
          ? 'P-47 Thunderbolt 雷霆 / A-26 侵略者'
          : 'A-26 Invader 入侵者 / AD-1 天襲者 / F4U-4',
      icon: <Target className="w-4 h-4 text-[#00E676]" />,
      color: 'border-[#00C853]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.agm88_harm,
              PAYLOAD_CATALOG.agm65_maverick,
              PAYLOAD_CATALOG.hellfire_missiles,
              PAYLOAD_CATALOG.tow_missiles,
              PAYLOAD_CATALOG.rgm84_harpoon,
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.tactical_b61_nuke,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.agm78_standard_arm,
              PAYLOAD_CATALOG.gbu10_laser_paveway,
              PAYLOAD_CATALOG.mer_iron_bombs,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.blu27_napalm,
              PAYLOAD_CATALOG.agm45_shrike,
              PAYLOAD_CATALOG.agm62_walleye,
              PAYLOAD_CATALOG.tactical_b61_nuke,
            ]
          : era === 'era3'
          ? [
              PAYLOAD_CATALOG.tiny_tim_rocket,
              PAYLOAD_CATALOG.napalm_canister,
              PAYLOAD_CATALOG.bomb_2000,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.hvar_rockets,
            ]
          : era === 'era2'
          ? [
              PAYLOAD_CATALOG.mixed_bombs_rockets,
              PAYLOAD_CATALOG.hvar_rockets,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_500,
              PAYLOAD_CATALOG.asw_depth_bombs,
            ]
          : [
              PAYLOAD_CATALOG.bombs_dual_500,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.depth_bombs,
            ],
    },
    {
      role: 'level_bomber',
      title: lang === 'zh' ? '遠程重轟炸機彈艙掛載 (STRATEGIC BOMBERS)' : 'Heavy Strategic Bombers',
      planes:
        era === 'era5'
          ? 'B-52G Stratofortress 同溫層堡壘 (8x AGM-84 魚叉反艦飛彈 / 108枚地毯轟炸)'
          : era === 'era4'
          ? 'B-52D Stratofortress 同溫層堡壘 (108枚航彈走廊/戰略熱核)'
          : era === 'era1'
          ? 'B-17 飛行堡壘 (4發重轟)'
          : era === 'era2'
          ? 'B-24 解放者 (遠程重轟)'
          : 'B-29 超級堡壘 (平流層重轟 / 戰術核武)',
      icon: <Zap className="w-4 h-4 text-[#FFCA28]" />,
      color: 'border-[#FFA000]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.rgm84_harpoon,
              PAYLOAD_CATALOG.b52_megaton_carpet,
              PAYLOAD_CATALOG.mer_iron_bombs,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.b52_megaton_nuke,
              PAYLOAD_CATALOG.bomb_2000,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.b52_megaton_carpet,
              PAYLOAD_CATALOG.mer_iron_bombs,
              PAYLOAD_CATALOG.cbu_cluster_bombs,
              PAYLOAD_CATALOG.b52_megaton_nuke,
              PAYLOAD_CATALOG.bomb_2000,
            ]
          : era === 'era3'
          ? [
              PAYLOAD_CATALOG.tactical_nuke,
              PAYLOAD_CATALOG.bombs_carpet_250,
              PAYLOAD_CATALOG.bombs_quad_500,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_1000,
              PAYLOAD_CATALOG.bomb_2000,
              PAYLOAD_CATALOG.bombs_dual_500,
            ]
          : era === 'era2'
          ? [
              PAYLOAD_CATALOG.bombs_carpet_250,
              PAYLOAD_CATALOG.bombs_quad_500,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_1000,
              PAYLOAD_CATALOG.bomb_1600,
              PAYLOAD_CATALOG.bomb_1600_ap,
              PAYLOAD_CATALOG.bombs_dual_500,
            ]
          : [
              PAYLOAD_CATALOG.bombs_carpet_250,
              PAYLOAD_CATALOG.bombs_quad_500,
              PAYLOAD_CATALOG.bomb_1000,
              PAYLOAD_CATALOG.bombs_dual_500,
            ],
    },
    {
      role: 'scout',
      title: lang === 'zh' ? '水上偵察與預警機群 (RECON & AEW)' : 'Reconnaissance & AEW',
      planes:
        era === 'era5'
          ? 'E-2C Hawkeye / E-3A Sentry / C-2A / C-130'
          : era === 'era4'
          ? 'E-1B Tracer 預警機 / OV-10 Bronco / UH-1 / UH-2'
          : era === 'era1'
          ? 'OS2U Kingfisher 水上偵察機'
          : era === 'era2'
          ? 'SC-1 Seahawk 水上偵察機'
          : 'AD-3W 預警機 / HO3S-1 搜救醫療直升機',
      icon: <Eye className="w-4 h-4 text-[#A7FFEB]" />,
      color: 'border-[#00BFA5]',
      options:
        era === 'era5'
          ? [
              PAYLOAD_CATALOG.scout_fuel,
              PAYLOAD_CATALOG.agm88_harm,
              PAYLOAD_CATALOG.ffar_rockets_pod,
              PAYLOAD_CATALOG.clean_guns,
            ]
          : era === 'era4'
          ? [
              PAYLOAD_CATALOG.scout_fuel,
              PAYLOAD_CATALOG.blu27_napalm,
              PAYLOAD_CATALOG.ffar_rockets_pod,
              PAYLOAD_CATALOG.clean_guns,
            ]
          : era === 'era3'
          ? [PAYLOAD_CATALOG.scout_fuel, PAYLOAD_CATALOG.clean_guns, PAYLOAD_CATALOG.bomb_500]
          : [PAYLOAD_CATALOG.scout_fuel, PAYLOAD_CATALOG.bomb_500, PAYLOAD_CATALOG.scout_depth_charge],
    },
  ];

  const filteredConfigs =
    activeRoleFilter === 'all'
      ? roleConfigs
      : roleConfigs.filter((c) => c.role === activeRoleFilter);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B233A] border border-amber-400/40 rounded-lg text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest uppercase font-bold">
                {t.armamentSubtitle}
              </div>
              <h2 className="text-base font-bold text-[#E0F7FA]">
                {t.armamentTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#90CAF9] hover:text-white hover:bg-[#1E3A5F]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap gap-1.5 bg-[#040C16] p-1.5 rounded-lg border border-[#1E3A5F]">
          <button
            onClick={() => setActiveRoleFilter('all')}
            className={`px-3 py-1 rounded text-xs transition-colors font-bold ${
              activeRoleFilter === 'all'
                ? 'bg-[#1976D2] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '全兵種 (ALL)' : 'All Roles'}
          </button>
          {roleConfigs.map((c) => (
            <button
              key={c.role}
              onClick={() => setActiveRoleFilter(c.role)}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                activeRoleFilter === c.role
                  ? 'bg-[#1976D2] text-white shadow font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.icon}
              <span>{c.role.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Roles & Weapons Grid */}
        <div className="space-y-4">
          {filteredConfigs.map((config) => {
            const currentSelected = activePayloads[config.role];
            return (
              <div
                key={config.role}
                className={`bg-[#040C16] border ${config.color} rounded-lg p-3.5 space-y-3 shadow-md`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#1E3A5F]/60 pb-2">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-bold text-sm text-[#E0F7FA]">{config.title}</span>
                  </div>
                  <span className="text-[11px] text-[#90CAF9] truncate">
                    {config.planes}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {config.options.map((opt) => {
                    const isSelected = currentSelected === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          onSelectPayload(config.role, opt.id);
                          soundEngine.playTorpedoLaunch();
                        }}
                        className={`cursor-pointer border rounded-lg p-3 flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-[#0B2545] border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.3)] ring-1 ring-[#00E676]'
                            : 'bg-[#071322] border-[#1E3A5F] hover:border-[#80DEEA] hover:bg-[#0A1B30]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-[#E0F7FA]">
                              {lang === 'zh' ? opt.nameZh : opt.name}
                            </span>
                            {isSelected && (
                              <span className="p-0.5 bg-[#00E676] text-black rounded-full shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 text-[10px]">
                            <span className="px-1.5 py-0.5 bg-[#0B1E34] border border-[#1E3A5F] rounded text-[#80DEEA] font-semibold">
                              {opt.badge}
                            </span>
                            {opt.purposeBadge && (
                              <span className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-600/50 rounded text-amber-300 font-semibold">
                                {opt.purposeBadge}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-300 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>

                        {/* Weapon Stat Badges */}
                        <div className="mt-2.5 pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-500">{t.damage}: </span>
                            <span className="text-[#00E676] font-bold">{opt.damage}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">{t.speedMod}: </span>
                            <span className={opt.speedModifier >= 1 ? 'text-[#80DEEA]' : 'text-amber-400'}>
                              {opt.speedModifier >= 1
                                ? `+${Math.round((opt.speedModifier - 1) * 100)}%`
                                : `${Math.round((opt.speedModifier - 1) * 100)}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">{t.blastRadius}: </span>
                            <span className="text-sky-300">{opt.blastRadius || 0}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1E3A5F]">
          <div className="text-[11px] text-slate-400">
            {lang === 'zh'
              ? '掛載修改即刻生效於新起飛波次。在航飛機需返航降落重新裝彈。'
              : 'Payload reconfiguration applies immediately to subsequent sorties. Airborne units rearm on landing.'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold rounded transition-colors shadow"
          >
            {lang === 'zh' ? '確認關閉 (CLOSE)' : 'Close Matrix'}
          </button>
        </div>
      </div>
    </div>
  );
};
