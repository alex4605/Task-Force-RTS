import React, { useState, useEffect } from 'react';
import { Era, AirWingLoadout, SectorIntel, AircraftPayloadType, AircraftRole, PAYLOAD_CATALOG } from '../types/game';
import { getRolePayloadOptions } from '../game/aircraftLoadouts';
import { Plane, Shield, Target, Eye, Play, Crosshair, Wrench, X } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { UnitPreviewCanvas } from './hud/UnitPreviewCanvas';

interface AirWingPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  era: Era;
  intel: SectorIntel | null;
  onConfirmLoadout: (loadout: AirWingLoadout) => void;
}

const getEraCounts = (era: Era) => {
  if (era === 'era5') {
    return {
      fighters: 24,
      diveBombers: 18,
      torpedoBombers: 14,
      scouts: 8,
    };
  }
  if (era === 'era4') {
    return {
      fighters: 18,
      diveBombers: 14,
      torpedoBombers: 10,
      scouts: 6,
    };
  }
  if (era === 'era3') {
    return {
      fighters: 16,
      diveBombers: 12,
      torpedoBombers: 8,
      scouts: 4,
    };
  }
  if (era === 'era2') {
    return {
      fighters: 14,
      diveBombers: 10,
      torpedoBombers: 8,
      scouts: 4,
    };
  }
  return {
    fighters: 8,
    diveBombers: 8,
    torpedoBombers: 6,
    scouts: 2,
  };
};

/** Catalog roles each pre-battle slot covers (era 3+ attack aircraft fill the dive-bomber deck spots). */
const SLOT_ROLES = {
  fighter: ['fighter'],
  diveBomber: ['dive_bomber', 'attacker'],
  torpedoBomber: ['torpedo_bomber'],
  scout: ['scout', 'aew'],
} as const satisfies Record<string, readonly AircraftRole[]>;

/** Each slot starts on the historical default store of its first airframe. */
const slotDefault = (roles: readonly AircraftRole[], era: Era): AircraftPayloadType =>
  getRolePayloadOptions(roles, era)[0] ?? 'clean_guns';

const getEraDefaults = (era: Era) => ({
  ...getEraCounts(era),
  fighterPayload: slotDefault(SLOT_ROLES.fighter, era),
  diveBomberPayload: slotDefault(SLOT_ROLES.diveBomber, era),
  torpedoBomberPayload: slotDefault(SLOT_ROLES.torpedoBomber, era),
  scoutPayload: slotDefault(SLOT_ROLES.scout, era),
});

export const AirWingPrepModal: React.FC<AirWingPrepModalProps> = ({
  isOpen,
  onClose,
  era,
  intel: _intel,
  onConfirmLoadout,
}) => {
  const maxCapacity = era === 'era5' ? 64 : era === 'era4' ? 48 : era === 'era3' ? 40 : era === 'era2' ? 36 : 24;
  const initial = getEraDefaults(era);

  // Plane count state
  const [fighters, setFighters] = useState<number>(initial.fighters);
  const [diveBombers, setDiveBombers] = useState<number>(initial.diveBombers);
  const [torpedoBombers, setTorpedoBombers] = useState<number>(initial.torpedoBombers);
  const [scouts, setScouts] = useState<number>(initial.scouts);
  const [preLaunchCAP, setPreLaunchCAP] = useState<boolean>(true);
  const [preLaunchScout, setPreLaunchScout] = useState<boolean>(true);

  const [fighterPayload, setFighterPayload] = useState<AircraftPayloadType>(initial.fighterPayload);
  const [diveBomberPayload, setDiveBomberPayload] = useState<AircraftPayloadType>(initial.diveBomberPayload);
  const [torpedoBomberPayload, setTorpedoBomberPayload] = useState<AircraftPayloadType>(initial.torpedoBomberPayload);
  const [scoutPayload, setScoutPayload] = useState<AircraftPayloadType>(initial.scoutPayload);

  // Sync defaults whenever era changes
  useEffect(() => {
    const d = getEraDefaults(era);
    setFighters(d.fighters);
    setDiveBombers(d.diveBombers);
    setTorpedoBombers(d.torpedoBombers);
    setScouts(d.scouts);
    setFighterPayload(d.fighterPayload);
    setDiveBomberPayload(d.diveBomberPayload);
    setTorpedoBomberPayload(d.torpedoBomberPayload);
    setScoutPayload(d.scoutPayload);
  }, [era]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTotal = fighters + diveBombers + torpedoBombers + scouts;
  const isOverCapacity = currentTotal > maxCapacity;

  const handleLaunch = () => {
    soundEngine.playPlaneSortie();
    onConfirmLoadout({
      fighters,
      diveBombers,
      torpedoBombers,
      scouts,
      preLaunchCAP,
      preLaunchScout,
      fighterPayload,
      diveBomberPayload,
      torpedoBomberPayload,
      scoutPayload,
    });
    onClose();
  };

  const fighterOptions = getRolePayloadOptions(SLOT_ROLES.fighter, era);
  const diveBomberOptions = getRolePayloadOptions(SLOT_ROLES.diveBomber, era);
  const torpedoBomberOptions = getRolePayloadOptions(SLOT_ROLES.torpedoBomber, era);
  const scoutOptions = getRolePayloadOptions(SLOT_ROLES.scout, era);

  const carrierName =
    era === 'era5'
      ? 'NIMITZ CVN-68 (Nuclear Supercarrier · 1980s Cold War)'
      : era === 'era4'
      ? 'KITTY HAWK CV-63 (Supercarrier C-13 Steam Catapults)'
      : era === 'era1'
      ? 'ENTERPRISE CV-6 (Yorktown Class)'
      : era === 'era2'
      ? 'ESSEX CV-9 (Essex Class)'
      : 'ORISKANY CV-34 (SCB-27A Jet Ready)';

  const fighterPreviewModel =
    era === 'era5' ? 'f14a' : era === 'era4' ? 'f4j' : era === 'era3' ? 'f9f' : era === 'era2' ? 'f6f' : 'f4f';
  const divePreviewModel =
    era === 'era5' ? 'a6e' : era === 'era4' ? 'a6a' : era === 'era3' ? 'a1h' : era === 'era2' ? 'sb2c' : 'sbd';
  const torpPreviewModel =
    era === 'era5' ? 's3a' : era === 'era4' ? 'sh2' : era === 'era3' ? 'af2' : era === 'era2' ? 'tbf' : 'tbd';
  const scoutPreviewModel =
    era === 'era5' || era === 'era4' ? 'e2c' : era === 'era3' ? 'ad3w' : era === 'era2' ? 'sc1' : 'os2u';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#071322] border border-[#1E3A5F] rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-3 text-[#80DEEA]">
            <div className="p-2 bg-[#0B233A] border border-[#00E5FF]/40 rounded-lg text-[#00E5FF]">
              <Plane className="w-5 h-5 text-[#80DEEA]" />
            </div>
            <div>
              <div className="text-[10px] text-[#90CAF9] tracking-widest uppercase font-bold flex items-center gap-2">
                <span>航母飛行甲板預發進配置</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#E0F7FA]">
                戰前航空隊編制與掛載配置
              </h2>
              <div className="text-[11px] text-[#FFD54F]">
                {carrierName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#90CAF9] block">機庫容量</span>
              <span
                className={`font-mono font-bold text-base tabular-nums ${
                  isOverCapacity ? 'text-red-400' : 'text-[#00E5FF]'
                }`}
              >
                {currentTotal} / {maxCapacity}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white border border-[#1E3A5F] transition-colors"
              title="關閉甲板選單 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Capacity Utilization Bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#040C16] rounded-full h-2 overflow-hidden border border-[#1E3A5F]">
            <div
              className={`h-full transition-all duration-300 ${
                isOverCapacity
                  ? 'bg-red-500'
                  : currentTotal === maxCapacity
                  ? 'bg-[#00E676]'
                  : 'bg-[#1976D2]'
              }`}
              style={{ width: `${Math.min(100, (currentTotal / maxCapacity) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>依據戰場情報調整航空母艦各機種的編制比例，並指派開戰預發進空優戰巡 (CAP) 與偵察機巡邏。</span>
            {isOverCapacity && (
              <span className="text-red-400 font-bold">
                已超額！請減少戰機數量
              </span>
            )}
          </div>
        </div>

        {/* Aircraft Allocation & Payload Sliders */}
        <div className="space-y-3">
          {/* 1. Fighters */}
          <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UnitPreviewCanvas
                  kind="aircraft"
                  unitKey={fighterPreviewModel}
                  width={72}
                  height={32}
                  payloadType={fighterPayload}
                />
                <span className="flex items-center gap-1.5 text-white font-bold text-xs truncate">
                  <Shield className="w-4 h-4 text-[#80DEEA] shrink-0" />
                  <span className="truncate">
                    {era === 'era5'
                      ? 'F-14A Tomcat 雄貓 / F/A-18A Hornet 艦載超音速戰機'
                      : era === 'era4'
                      ? 'F-4 Phantom II / F-8 Crusader 艦載超音速戰鬥機'
                      : era === 'era1'
                      ? 'F4F Wildcat 戰鬥機'
                      : era === 'era2'
                      ? 'F6F Hellcat / F4U Corsair 戰鬥機'
                      : 'F9F Panther / F2H Banshee / F8F Bearcat 噴射/攔截機'}
                  </span>
                </span>
              </div>
              <span className="tabular-nums font-bold text-sm text-[#80DEEA] shrink-0">{fighters} 架</span>
            </div>
            <input
              type="range"
              min={2}
              max={era === 'era5' ? 32 : era === 'era4' ? 24 : era === 'era1' ? 14 : era === 'era2' ? 20 : 22}
              value={fighters}
              onChange={(e) => setFighters(parseInt(e.target.value))}
              className="w-full accent-[#1976D2] cursor-pointer"
            />
            {/* Payload Choices */}
            <div className="pt-1 border-t border-[#1E3A5F]/60">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-[#80DEEA]" />
                <span>戰鬥機掛載配置：</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {fighterOptions.map((opt) => {
                  const item = PAYLOAD_CATALOG[opt];
                  const isSel = fighterPayload === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFighterPayload(opt)}
                      className={`px-2 py-1.5 rounded text-left border transition-all ${
                        isSel
                          ? 'bg-[#1976D2]/30 border-[#00E676] text-white shadow-sm'
                          : 'bg-[#061220] border-[#1E3A5F] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] text-[#E0F7FA]">{item.badge}</div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Dive Bombers */}
          <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UnitPreviewCanvas
                  kind="aircraft"
                  unitKey={divePreviewModel}
                  width={72}
                  height={32}
                  payloadType={diveBomberPayload}
                />
                <span className="flex items-center gap-1.5 text-white font-bold text-xs truncate">
                  <Target className="w-4 h-4 text-[#FFD54F] shrink-0" />
                  <span className="truncate">
                    {era === 'era5'
                      ? 'A-6E Intruder / AV-8B Harrier II / EA-6B 全天候攻擊聯隊'
                      : era === 'era4'
                      ? 'A-4 Skyhawk / A-7 Corsair II / A-6 Intruder 艦載全天候攻擊機'
                      : era === 'era1'
                      ? 'SBD Dauntless 俯衝轟炸機'
                      : era === 'era2'
                      ? 'SB2C Helldiver 俯衝轟炸機'
                      : 'AD-1 Skyraider / F4U-4 天襲者重型攻擊機'}
                  </span>
                </span>
              </div>
              <span className="tabular-nums font-bold text-sm text-[#FFD54F] shrink-0">{diveBombers} 架</span>
            </div>
            <input
              type="range"
              min={2}
              max={era === 'era5' ? 24 : era === 'era4' ? 20 : era === 'era1' ? 12 : era === 'era2' ? 16 : 18}
              value={diveBombers}
              onChange={(e) => setDiveBombers(parseInt(e.target.value))}
              className="w-full accent-[#FFB300] cursor-pointer"
            />
            {/* Payload Choices */}
            <div className="pt-1 border-t border-[#1E3A5F]/60">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-[#FFD54F]" />
                <span>轟炸/攻擊機外掛彈藥：</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {diveBomberOptions.map((opt) => {
                  const item = PAYLOAD_CATALOG[opt];
                  const isSel = diveBomberPayload === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDiveBomberPayload(opt)}
                      className={`px-2 py-1.5 rounded text-left border transition-all ${
                        isSel
                          ? 'bg-[#FF8F00]/25 border-[#00E676] text-white shadow-sm'
                          : 'bg-[#061220] border-[#1E3A5F] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] text-[#FFE082]">{item.badge}</div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Torpedo Bombers */}
          <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UnitPreviewCanvas
                  kind="aircraft"
                  unitKey={torpPreviewModel}
                  width={72}
                  height={32}
                  payloadType={torpedoBomberPayload}
                />
                <span className="flex items-center gap-1.5 text-white font-bold text-xs truncate">
                  <Crosshair className="w-4 h-4 text-[#80DEEA] shrink-0" />
                  <span className="truncate">
                    {era === 'era5'
                      ? 'S-3A Viking 維京反潛機 / SH-3F Sea King (聲納浮標 · Mk 46)'
                      : era === 'era4'
                      ? 'S-2 Tracker / SH-3 Sea King (Mk 46 聲導反潛魚雷/反艦)'
                      : era === 'era1'
                      ? 'TBD Devastator 魚雷轟炸機'
                      : era === 'era2'
                      ? 'TBF Avenger 魚雷轟炸機'
                      : 'AF-2 Guardian 獵潛衛士 (ASW反潛魚雷機)'}
                  </span>
                </span>
              </div>
              <span className="tabular-nums font-bold text-sm text-[#80DEEA] shrink-0">{torpedoBombers} 架</span>
            </div>
            <input
              type="range"
              min={2}
              max={era === 'era5' ? 18 : era === 'era4' ? 14 : era === 'era1' ? 10 : 14}
              value={torpedoBombers}
              onChange={(e) => setTorpedoBombers(parseInt(e.target.value))}
              className="w-full accent-[#00ACC1] cursor-pointer"
            />
            {/* Payload Choices */}
            <div className="pt-1 border-t border-[#1E3A5F]/60">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-[#80DEEA]" />
                <span>魚雷/反潛外掛武裝：</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {torpedoBomberOptions.map((opt) => {
                  const item = PAYLOAD_CATALOG[opt];
                  const isSel = torpedoBomberPayload === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTorpedoBomberPayload(opt)}
                      className={`px-2 py-1.5 rounded text-left border transition-all ${
                        isSel
                          ? 'bg-[#00838F]/30 border-[#00E676] text-white shadow-sm'
                          : 'bg-[#061220] border-[#1E3A5F] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] text-[#80DEEA]">{item.badge}</div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Recon Scout */}
          <div className="bg-[#040C16] border border-[#1E3A5F] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UnitPreviewCanvas
                  kind="aircraft"
                  unitKey={scoutPreviewModel}
                  width={72}
                  height={32}
                  payloadType={scoutPayload}
                />
                <span className="flex items-center gap-1.5 text-white font-bold text-xs truncate">
                  <Eye className="w-4 h-4 text-[#A7FFEB] shrink-0" />
                  <span className="truncate">
                    {era === 'era5'
                      ? 'E-2C Hawkeye 鷹眼預警機 / C-2A 艦載戰術運輸機'
                      : era === 'era4'
                      ? 'E-2 Hawkeye 空中預警機 / RA-5C Vigilante 戰術超音速偵察機'
                      : era === 'era1'
                      ? 'OS2U Kingfisher 水上偵察機'
                      : era === 'era2'
                      ? 'SC-1 Seahawk 水上偵察機'
                      : 'AD-3W 空中預警機 / HO3S-1 搜救醫療直升機'}
                  </span>
                </span>
              </div>
              <span className="tabular-nums font-bold text-sm text-[#A7FFEB] shrink-0">{scouts} 架</span>
            </div>
            <input
              type="range"
              min={1}
              max={era === 'era5' ? 10 : 8}
              value={scouts}
              onChange={(e) => setScouts(parseInt(e.target.value))}
              className="w-full accent-[#00BFA5] cursor-pointer"
            />
            {/* Payload Choices */}
            <div className="pt-1 border-t border-[#1E3A5F]/60">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-[#A7FFEB]" />
                <span>偵察機觀測設備與輕航彈：</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {scoutOptions.map((opt) => {
                  const item = PAYLOAD_CATALOG[opt];
                  const isSel = scoutPayload === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setScoutPayload(opt)}
                      className={`px-2 py-1.5 rounded text-left border transition-all ${
                        isSel
                          ? 'bg-[#004D40]/40 border-[#00E676] text-white shadow-sm'
                          : 'bg-[#061220] border-[#1E3A5F] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[10px] text-[#A7FFEB]">{item.badge}</div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Immediate Airborne Checkboxes */}
        <div className="bg-[#0B1E34] border border-[#1E3A5F] rounded-lg p-3 flex flex-col gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={preLaunchCAP}
              onChange={(e) => setPreLaunchCAP(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#1976D2] accent-[#1976D2]"
            />
            <span className="font-semibold text-xs">開戰自動彈射 2 架戰鬥機執行 CAP 空優警戒</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={preLaunchScout}
              onChange={(e) => setPreLaunchScout(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#1976D2] accent-[#1976D2]"
            />
            <span className="font-semibold text-xs">開戰自動彈射 1 架偵察機展開前向索敵</span>
          </label>
        </div>

        {/* Action Buttons: Cancel and Confirm Launch (Closes Modal) */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1E3A5F]">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0B1E34] hover:bg-[#153252] border border-[#1E3A5F] hover:border-slate-400 rounded text-slate-300 hover:text-white font-mono font-bold text-xs transition-colors shadow"
          >
            <X className="w-4 h-4" />
            <span>取消</span>
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            disabled={isOverCapacity}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 font-mono font-extrabold text-xs rounded shadow-lg transition-transform active:scale-95 whitespace-nowrap ${
              isOverCapacity
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-[#1976D2] to-[#00E676] hover:from-[#2196F3] hover:to-[#00C853] text-[#06101E] hover:text-black'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{'確認配置並出發 (CONFIRM & COMMENCE)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
