import React from 'react';
import { isAirliftPayload } from '../../game/airlift';
import { Anchor, HelpCircle, Plane, Radio, Shield } from 'lucide-react';
import { Era } from '../../types/game';
import { SelectableUnit, isAircraftUnit, isGroundUnit, isShipUnit } from '../../game/airWingCatalog';
import { canDipSonar } from '../../game/asw';

interface SelectedUnitsPanelProps {
  era: Era;
  selectedUnits: SelectableUnit[];
  isGuideCollapsed: boolean;
  onSetGuideCollapsed: (collapsed: boolean) => void;
  onOrderSelected: (type: 'move' | 'attack' | 'patrol' | 'rtb' | 'idle') => void;
  onStopUnits: () => void;
  onOpenEngineerDeck: () => void;
  onBuildAirfield?: (engineerId: string) => void;
  onToggleTransportEmbark?: (transportId: string) => void;
  onTriggerLSMRocket?: (lsmrId: string) => void;
  onUnloadAircraft?: () => void;
  isDesignatingCap: boolean;
  onStartCapDesignation?: () => void;
  /** In-flight rebase of the selected aircraft (T). */
  onStartRebase?: (ids: string[]) => void;
  /** Close escort: the selected fighters protect a friendly aircraft picked on the map (V). */
  onStartEscort?: (ids: string[]) => void;
  /** Main-battery ROE switches of the selected ships. */
  /** Lower / raise the dipping sonar of the selected ASW helicopters (D). */
  onToggleDipping?: () => void;
  onSetGunRoe?: (key: 'ships' | 'installations' | 'ground', value: boolean) => void;
  onCancelCap?: () => void;
  isDesignatingSonobuoy: boolean;
  onStartSonobuoyDesignation?: () => void;
  onCancelSonobuoy?: () => void;
}

export const SelectedUnitsPanel: React.FC<SelectedUnitsPanelProps> = ({
  era,
  selectedUnits,
  isGuideCollapsed,
  onSetGuideCollapsed,
  onOrderSelected,
  onStopUnits,
  onOpenEngineerDeck,
  onBuildAirfield,
  onToggleTransportEmbark,
  onTriggerLSMRocket,
  onUnloadAircraft,
  isDesignatingCap,
  onStartCapDesignation,
  onStartRebase,
  onStartEscort,
  onSetGunRoe,
  onToggleDipping,
  onCancelCap,
  isDesignatingSonobuoy,
  onStartSonobuoyDesignation,
  onCancelSonobuoy,
}) => {
  if (selectedUnits.length === 0) {
    if (isGuideCollapsed) {
      return (
        <div
          onClick={() => onSetGuideCollapsed(false)}
          className="pointer-events-auto bg-[#071322]/85 backdrop-blur-md border border-[#1E3A5F] hover:border-[#80DEEA]/60 rounded-lg px-2.5 py-1.5 text-xs font-mono shadow-lg flex items-center justify-between gap-2.5 cursor-pointer transition-all"
          title="點擊展開操作指南"
        >
          <div className="text-[#80DEEA] font-bold flex items-center gap-1.5 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>戰術操作指南</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            展開 +
          </span>
        </div>
      );
    }

    return (
      <div className="pointer-events-auto bg-[#071322]/85 backdrop-blur-md border border-[#1E3A5F] rounded-lg p-3 w-72 text-xs font-mono space-y-1.5 shadow-lg">
        <div className="text-[#80DEEA] font-bold flex items-center justify-between border-b border-[#1E3A5F] pb-1">
          <span>戰術視角與移動操作指南</span>
          <button
            type="button"
            onClick={() => onSetGuideCollapsed(true)}
            className="text-[10px] text-slate-400 hover:text-white bg-[#0A1E35] hover:bg-[#1E3A5F] px-1.5 py-0.5 rounded border border-[#1E3A5F] transition-all cursor-pointer"
            title="縮小指南"
          >
            收合 −
          </button>
        </div>
        <div className="text-[11px] text-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">平移畫面：</span>
            <span className="font-semibold text-white">WASD / Arrows</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">拖曳鏡頭：</span>
            <span className="font-semibold text-white">滑鼠中鍵 / 邊緣游標</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">縮放視角：</span>
            <span className="font-semibold text-white">滑鼠滾輪 (Wheel)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">鏡頭鎖定航母：</span>
            <span className="font-semibold text-[#80DEEA]">F key</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">框選單位：</span>
            <span className="font-semibold text-white">滑鼠左鍵拉框</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">移動 / 攻擊：</span>
            <span className="font-semibold text-[#00E676]">滑鼠右鍵點擊</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">暫停 / 倍速：</span>
            <span className="font-semibold text-white">Backspace · [ / ]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">編隊設定 / 呼叫：</span>
            <span className="font-semibold text-[#FFD54F]">Ctrl+1~4 / 1~4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">CAP 空巡 / 浮標：</span>
            <span className="font-semibold text-cyan-300">C / G (Shift連點)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">傘降卸載 / 防空：</span>
            <span className="font-semibold text-amber-300">U / Space</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#90CAF9]">全速停俥：</span>
            <span className="font-semibold text-red-400">X key</span>
          </div>
        </div>
      </div>
    );
  }

  const hasAirdropUnit = selectedUnits.some(
    (u) =>
      isAircraftUnit(u) &&
      u.hasPayload &&
      (u.ammoRemaining ?? 0) > 0 &&
      isAirliftPayload(u.payloadType)
  );

  const hasSonobuoyCapablePlane = selectedUnits.some(
    (u) =>
      isAircraftUnit(u) &&
      ((u.maxSonobuoyAmmo ?? 0) > 0 ||
        u.role === 'scout' ||
        u.role === 'rescue' ||
        u.model === 'af_guardian' ||
        u.model === 'firefly_as5' ||
        u.model === 'ho3s1' ||
        u.model === 's2' ||
        u.model === 'p3' ||
        u.model === 'sh2' ||
        u.model === 'uh2' ||
        u.model === 's3a' ||
        u.model === 'sh3f')
  );

  const isLegacyEra = era === 'era1' || era === 'era2';
  const hasBuoyAmmo = selectedUnits.some((u) => isAircraftUnit(u) && (u.sonobuoyAmmo ?? 0) > 0);
  const sonobuoyDisabled = isLegacyEra || !hasBuoyAmmo;

  return (
    <div className="pointer-events-auto bg-[#071322]/90 backdrop-blur-md border border-[#00E676]/60 rounded-lg p-3 w-80 text-xs font-mono space-y-2.5 shadow-xl">
      <div className="flex justify-between items-center text-[#00E676] font-bold border-b border-[#1E3A5F] pb-1">
        <span>單位選擇列表 ({selectedUnits.length})</span>
        <span className="text-[10px] text-slate-400">右鍵指派移動 / 攻擊</span>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {selectedUnits.slice(0, 6).map((u) => {
          const hpPct = Math.max(0, u.health / Math.max(1, u.maxHealth));
          const isPlane = isAircraftUnit(u);
          const isGround = isGroundUnit(u);
          const isShip = isShipUnit(u);
          const isTransport =
            isShip && (u.type === 'lcvp' || u.type === 'lst' || u.type === 'lcm8' || u.type === 'lpd' || u.type === 'lcac');
          const isLSMR = isShip && u.type === 'lsm_r';

          return (
            <div key={u.id} className="bg-[#040C16] p-1.5 rounded border border-[#1E3A5F]/60 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <div>
                  <div className="font-semibold text-white truncate max-w-[165px] flex items-center gap-1">
                    {isPlane && <Plane className="w-3 h-3 text-[#80DEEA]" />}
                    {isShip && <Anchor className="w-3 h-3 text-[#80D8FF]" />}
                    {isGround && <Shield className="w-3 h-3 text-[#42A5F5]" />}
                    <span title={u.name}>{u.name}</span>
                  </div>
                  <div className="text-[9.5px] text-[#90CAF9] truncate max-w-[165px]">
                    {isPlane && u.flightName && (
                      <span className="text-slate-400 mr-1">[{u.flightName.split('(')[0].trim()}]</span>
                    )}
                    {isGround
                      ? u.embarkedInShipId
                        ? ('⚓ 已裝載於登陸艦艇')
                        : ('🎖️ 地面戰鬥展開中')
                      : u.order.type === 'patrol'
                      ? ('巡邏中 (PATROL)')
                      : u.order.type === 'attack'
                      ? ('攻擊中 (ATTACK)')
                      : u.order.type === 'rtb'
                      ? ('返航中 (RTB)')
                      : u.order.type === 'move'
                      ? ('移動中 (MOVING)')
                      : ('待命 (IDLE)')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums text-emerald-400 font-bold">{Math.round(hpPct * 100)}%</div>
                  <div className="w-14 h-1 bg-[#1E3A5F] rounded overflow-hidden mt-0.5">
                    <div className="h-full bg-emerald-400" style={{ width: `${hpPct * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Ground Unit Dual Parameters & Supply Line Status */}
              {isGround && (
                <div className="text-[9.5px] pt-1 border-t border-[#1E3A5F]/40 space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div className="bg-[#071322] p-1 rounded border border-[#1E3A5F]/50">
                      <div className="flex justify-between items-center text-emerald-400 font-bold mb-0.5">
                        <span>士氣組織度 (ORG)</span>
                        <span>{Math.round(u.organization ?? 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E3A5F] rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all"
                          style={{ width: `${Math.min(100, u.organization ?? 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-[#071322] p-1 rounded border border-[#1E3A5F]/50">
                      <div className="flex justify-between items-center text-[#00E5FF] font-bold mb-0.5">
                        <span>編裝建制度 (STR)</span>
                        <span>{Math.round(u.strength ?? 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#1E3A5F] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#00E5FF] transition-all"
                          style={{ width: `${Math.min(100, u.strength ?? 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {u.isArtillery && (
                    <div className="flex items-center justify-between text-[8.5px] px-1 py-0.5 bg-amber-950/40 border border-amber-600/40 rounded text-amber-300 font-mono">
                      <span>{'砲兵模式: 直瞄平射(<700m) / 曲射壓制(≥700m)'}</span>
                      <span className="font-bold text-amber-200">
                        {u.artilleryMode === 'direct_fire' ? ('【直瞄平射】') : ('【長程曲射】')}
                      </span>
                    </div>
                  )}

                  {u.terrainInfo && !u.embarkedInShipId && (
                    <div className="text-[8.5px] px-1 py-0.5 bg-[#0B1A12] border border-emerald-800/50 rounded font-mono space-y-0.5">
                      <div className="flex justify-between text-emerald-300">
                        <span>
                          ⛰️ 地形: <b>{u.terrainInfo.onRoad ? `道路 (${u.terrainInfo.name})` : u.terrainInfo.name}</b>
                          {u.terrainInfo.deepRiver && !u.terrainInfo.onRoad ? ' · 深河需橋' : ''}
                        </span>
                        <span className="text-slate-300">海拔 {u.terrainInfo.elevationM}m</span>
                      </div>
                      <div className="flex justify-between text-slate-300 tabular-nums">
                        <span className={u.terrainInfo.move < 0.7 ? 'text-amber-300' : u.terrainInfo.move > 1 ? 'text-emerald-300' : ''}>
                          移速 ×{u.terrainInfo.move.toFixed(2)}
                        </span>
                        <span className={u.terrainInfo.concealment < 1 ? 'text-emerald-300' : ''}>
                          被發現距離 ×{u.terrainInfo.concealment.toFixed(2)}
                        </span>
                        <span className={u.terrainInfo.airDamage < 1 ? 'text-emerald-300' : ''}>
                          空襲傷害 ×{u.terrainInfo.airDamage.toFixed(2)}
                        </span>
                      </div>
                      {u.isInUrbanCover && <div className="text-cyan-300">🏛️ 城市掩體: 空襲減傷70% · 直射掩護50%</div>}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px]">
                    {u.isSupplied ? (
                      <span className="text-emerald-400 font-bold">
                        🟢 全島補給線暢通
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        🔴 補給線斷絕
                      </span>
                    )}
                    <span className="text-amber-300 font-bold tabular-nums">
                      {`DMG:${u.damage} · 射程:${u.range}m`}
                    </span>
                  </div>
                </div>
              )}

              {/* Combat Engineer Airfield & Field Construction */}
              {isGround && u.type === 'usmc_engineer' && (
                <div className="pt-1 border-t border-[#1E3A5F]/40 flex flex-col gap-1">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-[9.5px] text-[#80D8FF] font-semibold">
                      {u.embarkedInShipId
                        ? ('在登陸艇內 (需先搶灘)')
                        : ('工兵戰地急造工程')}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenEngineerDeck}
                      className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-amber-600 hover:bg-amber-500 text-white border border-amber-300 transition-colors shadow-sm"
                    >
                      <span>🏗️ 打開戰地工程建造選單</span>
                    </button>
                  </div>
                  <div className="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      disabled={Boolean(u.embarkedInShipId)}
                      onClick={() => onBuildAirfield?.(u.id)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-colors shadow-sm ${
                        !u.embarkedInShipId
                          ? 'bg-[#1565C0] hover:bg-[#1976D2] text-white border-[#42A5F5]'
                          : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      🔨 就地闢建機場
                    </button>
                  </div>
                </div>
              )}

              {/* Transport Craft Embark / Disembark */}
              {isTransport && (
                <div className="pt-1 border-t border-[#1E3A5F]/40 flex justify-between items-center gap-1">
                  <span className="text-[9.5px] text-[#A7FFEB]">
                    {u.embarkedUnitIds && u.embarkedUnitIds.length > 0
                      ? u.holdNote ?? `載運部隊: ${u.embarkedUnitIds.length}/${u.cargoCapacity ?? 2}`
                      : u.type === 'lst'
                      ? `空載 (${u.era === 'era4' || u.era === 'era5' ? '約 15 輛 M4 當量 + 400 人' : '約 20 輛 M4 + 163 人'})`
                      : `空載 (容量: ${u.cargoCapacity ?? 2})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleTransportEmbark?.(u.id)}
                    className="px-2 py-0.5 bg-[#00695C] hover:bg-[#00897B] text-white text-[9.5px] font-bold rounded border border-[#80CBC4] transition-colors"
                  >
                    ⚓ 裝載/搶灘
                  </button>
                </div>
              )}

              {/* LSM(R) Rocket Barrage */}
              {isLSMR && (
                <div className="pt-1 border-t border-[#1E3A5F]/40 flex justify-between items-center gap-1">
                  <span className="text-[9.5px] text-[#FFE082]">
                    85聯裝連續火箭彈幕
                  </span>
                  <button
                    type="button"
                    onClick={() => onTriggerLSMRocket?.(u.id)}
                    disabled={(u.rocketCooldown || 0) > 0}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-colors ${
                      (u.rocketCooldown || 0) <= 0
                        ? 'bg-[#E64A19] hover:bg-[#FF5722] text-white border-[#FFAB91]'
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    🚀 {(u.rocketCooldown || 0) > 0 ? `${Math.ceil(u.rocketCooldown!)}s` : ('發射火箭')}
                  </button>
                </div>
              )}

              {/* Aircraft Ordnance / Ammo Status */}
              {isPlane && (
                <div className="text-[10px] pt-0.5 border-t border-[#1E3A5F]/40 space-y-1">
                  <div className="flex justify-between items-center">
                    {u.role === 'fighter' && (!u.hasPayload || u.payloadType === 'clean_guns') ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <span>💥 機槍殘彈:</span>
                        <span className="tabular-nums">
                          {u.gunAmmo ?? u.ammoRemaining ?? 1440} / {u.maxGunAmmo ?? u.maxAmmo ?? 1440} 發
                        </span>
                      </span>
                    ) : u.hasPayload && (u.ammoRemaining ?? 0) > 0 ? (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <span>{isAirliftPayload(u.payloadType) ? '🪂' : '💥'} {(isAirliftPayload(u.payloadType) ? '空降編制:' : '航彈/火箭:')}</span>
                          <span>[{u.payloadName}] x{u.ammoRemaining}</span>
                        </span>
                        {u.gunAmmo !== undefined && u.gunAmmo > 0 && (
                          <span className="text-emerald-400 font-bold tabular-nums text-[9px]">
                            機槍:{u.gunAmmo}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full text-slate-400">
                        <span>⚠️ 彈藥/兵員已投罄 (返航補給中)</span>
                        {u.gunAmmo !== undefined && u.gunAmmo > 0 && (
                          <span className="text-slate-400 tabular-nums text-[9px]">
                            機槍:{u.gunAmmo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {(u.maxSonobuoyAmmo ?? 0) > 0 && (
                    <div className="flex justify-between items-center text-[10px] text-[#80DEEA]">
                      <span className="truncate">
                        📡 {u.sonobuoyModel || ('被動聲納浮標')}
                      </span>
                      <span className="font-bold tabular-nums shrink-0 ml-2">
                        {u.sonobuoyAmmo ?? 0} / {u.maxSonobuoyAmmo}
                      </span>
                    </div>
                  )}
                  {u.hasPayload &&
                    (u.ammoRemaining ?? 0) > 0 &&
                    isAirliftPayload(u.payloadType) && (
                      <button
                        type="button"
                        onClick={() => onUnloadAircraft?.()}
                        className="w-full py-1 px-2 bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#00897B] hover:to-[#00ACC1] text-white font-bold text-[10px] rounded border border-[#80CBC4] shadow flex items-center justify-center gap-1 transition-all"
                      >
                        <span>🪂 立即卸載 / 空降部隊 (U)</span>
                      </button>
                    )}
                </div>
              )}

              {isShip && !isTransport && !isLSMR && u.detailedArmaments && (
                <div className="text-[9.5px] pt-0.5 border-t border-[#1E3A5F]/40 text-slate-400 truncate">
                  <span>武裝: {u.detailedArmaments.slice(0, 2).map((a) => a.name).join(' · ')}</span>
                </div>
              )}
            </div>
          );
        })}
        {selectedUnits.length > 6 && (
          <div className="text-[10px] text-slate-400 text-center">
            +{selectedUnits.length - 6} 個其他單位
          </div>
        )}
      </div>

      {/* RTS Action Command Buttons */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-[#1E3A5F]">
        <button
          onClick={() => onOrderSelected('patrol')}
          className="py-1 bg-[#0B1E34] hover:bg-[#1976D2] border border-[#1E3A5F] rounded text-[10px] text-[#E0F7FA] font-bold"
        >
          巡邏 (Patrol) (P)
        </button>
        <button
          onClick={() => onOrderSelected('rtb')}
          className="py-1 bg-[#0B1E34] hover:bg-[#C2185B] border border-[#1E3A5F] rounded text-[10px] text-[#FF80AB] font-bold"
        >
          返航 (RTB) (B)
        </button>
        <button
          onClick={onStopUnits}
          className="py-1 bg-[#D32F2F] hover:bg-[#B71C1C] border border-[#FF8A80] rounded text-[10px] text-white font-bold"
          title="停止 (Stop)"
        >
          停止 (Stop) (X)
        </button>
        <button
          onClick={() => onOrderSelected('idle')}
          className="py-1 bg-[#0B1E34] hover:bg-slate-700 border border-[#1E3A5F] rounded text-[10px] text-slate-300 font-bold"
        >
          待命
        </button>
      </div>

      {hasAirdropUnit && (
        <div className="pt-1 border-t border-[#1E3A5F]/60">
          <button
            type="button"
            onClick={() => onUnloadAircraft?.()}
            className="w-full py-1.5 px-2 rounded text-xs font-mono font-bold bg-gradient-to-r from-[#00695C] to-[#00897B] hover:from-[#00897B] hover:to-[#00ACC1] text-white border border-[#80CBC4] flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <span>🪂 卸載空降傘兵 / 機降突擊部隊 (U)</span>
          </button>
        </div>
      )}

      {/* Main-battery rules of engagement for the selected ships */}
      {(() => {
        const ships = selectedUnits.filter((u) => isShipUnit(u) && !u.isSunk && u.turrets.length > 0);
        if (ships.length === 0) return null;
        const roeOf = (u: (typeof ships)[number]) => (isShipUnit(u) ? u.gunRoe ?? { ships: true, installations: false, ground: false } : null);
        const all = (k: 'ships' | 'installations' | 'ground') => ships.every((u) => roeOf(u)?.[k]);
        const items: { k: 'ships' | 'installations' | 'ground'; label: string }[] = [
          { k: 'ships', label: '船艦' },
          { k: 'installations', label: '地面設施' },
          { k: 'ground', label: '地面單位' },
        ];
        return (
          <div className="pt-1 border-t border-[#1E3A5F]/60">
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span className="text-slate-400 shrink-0" title="主砲對進入射程的目標自動開火（攻擊指令一律開火）">主砲 ROE:</span>
              {items.map(({ k, label }) => {
                const on = all(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onSetGunRoe?.(k, !on)}
                    className={`flex-1 py-1 rounded font-bold border transition-colors ${on ? 'bg-[#B71C1C] text-white border-[#FF8A80]' : 'bg-[#0B1E34] text-slate-400 border-[#1E3A5F] hover:text-white'}`}
                    title={on ? `對進入射程的敵${label}自動射擊（點擊改為不主動射擊）` : `不主動射擊敵${label}（點擊改為自動射擊）`}
                  >
                    {on ? '🎯 ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* CAP Patrol Designation */}
      <div className="pt-1 border-t border-[#1E3A5F]/60">
        <button
          type="button"
          onClick={() => {
            if (isDesignatingCap) onCancelCap?.();
            else onStartCapDesignation?.();
          }}
          className={`w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap ${
            isDesignatingCap
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300 ring-2 ring-cyan-400'
              : 'bg-gradient-to-r from-[#00838F] to-[#006064] hover:from-[#0097A7] hover:to-[#00838F] text-[#E0F7FA] border border-[#4DD0E1]/70'
          }`}
          title="在地圖上點擊指定空域，在航戰鬥機將前往盤旋警戒"
        >
          <Shield className="w-3.5 h-3.5 text-cyan-200" />
          <span>{isDesignatingCap ? ('⚡ 正在指定空巡空域 (拖曳/點地圖)') : '指派空優巡邏空域 (C)'}</span>
        </button>
        {selectedUnits.some((u) => isAircraftUnit(u)) && (
          <button
            type="button"
            onClick={() => onStartRebase?.(selectedUnits.filter((u) => isAircraftUnit(u)).map((u) => u.id))}
            className="mt-1 w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#388E3C] text-[#E8F5E9] border border-[#81C784]/70"
            title="選取的飛機中止任務，於空中轉降其他機場或航艦（再點地圖上的目的地）"
          >
            <span>🛬 空中轉降 Rebase (T)</span>
          </button>
        )}
        {selectedUnits.some((u) => isAircraftUnit(u) && canDipSonar(u.model)) && (() => {
          const dipping = selectedUnits.some((u) => isAircraftUnit(u) && u.dipping);
          return (
            <button
              type="button"
              onClick={() => onToggleDipping?.()}
              className={`mt-1 w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap border ${dipping ? 'bg-gradient-to-r from-sky-500 to-blue-700 text-white border-sky-200 ring-2 ring-sky-400' : 'bg-gradient-to-r from-[#01579B] to-[#0277BD] hover:from-[#0277BD] hover:to-[#0288D1] text-[#E1F5FE] border-[#81D4FA]/70'}`}
              title="懸停並降下吊放聲納：主動聲納穿透溫躍層搜索潛艦（但會驚動目標）；再按一次收回"
            >
              <span>{dipping ? '🎧 收回吊放聲納 (D)' : '🎧 吊放聲納模式 Dipping (D)'}</span>
            </button>
          );
        })()}
        {selectedUnits.some((u) => isAircraftUnit(u) && u.role === 'fighter') && (
          <button
            type="button"
            onClick={() => onStartEscort?.(selectedUnits.filter((u) => isAircraftUnit(u)).map((u) => u.id))}
            className="mt-1 w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap bg-gradient-to-r from-[#8D6E00] to-[#A67C00] hover:from-[#A67C00] hover:to-[#C79100] text-[#FFF8E1] border border-[#FFD54F]/70"
            title="選取的戰鬥機貼身護航一架友機（再點地圖上要保護的飛機）"
          >
            <span>🛡️ 指定護航 Escort (V)</span>
          </button>
        )}
      </div>

      {/* Era 3-5 Air-Dropped Passive Sonobuoy Control */}
      {hasSonobuoyCapablePlane && (
        <div className="pt-1 border-t border-[#1E3A5F]/60">
          <button
            type="button"
            disabled={sonobuoyDisabled}
            onClick={() => {
              if (sonobuoyDisabled) return;
              if (isDesignatingSonobuoy) onCancelSonobuoy?.();
              else onStartSonobuoyDesignation?.();
            }}
            className={`w-full py-1.5 px-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md whitespace-nowrap ${
              sonobuoyDisabled
                ? 'bg-slate-800/70 text-slate-500 border border-slate-700 cursor-not-allowed'
                : isDesignatingSonobuoy
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border border-cyan-200 ring-2 ring-cyan-400'
                : 'bg-gradient-to-r from-[#00695C] to-[#004D40] hover:from-[#00897B] hover:to-[#00695C] text-[#E0F2F1] border border-[#4DB6AC]/70'
            }`}
            title={
              isLegacyEra
                ? ('二戰時期（時代一～二）尚無空投被動聲納浮標')
                : '在海圖上點擊目標海域，派遣反潛機/直升機投擲被動聲納（插眼）監聽過境敵潛艦'
            }
          >
            <Radio className="w-3.5 h-3.5 text-teal-200 shrink-0" />
            <span>
              {isLegacyEra
                ? ('📡 被動聲納浮標 (ERA 3+ 解鎖)')
                : !hasBuoyAmmo
                ? ('📡 聲納浮標已耗盡')
                : isDesignatingSonobuoy
                ? '取消聲納投擲'
                : '投擲被動聲納浮標 (G)'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
