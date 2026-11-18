import { Era, Ship } from '../types/game';

/** One ship of an allied Surface Action Group, before it is instantiated by the engine. */
export type AlliedSagShipDef = {
  name: string;
  codeName: string;
  type: Ship['type'];
  length: number;
  width: number;
  maxHealth: number;
  speed: number;
  flakRange: number;
  turrets: Array<{
    id?: string;
    pos?: { x: number; y: number };
    relX?: number;
    relY?: number;
    angle: number;
    range: number;
    damage: number;
    cooldown: number;
    maxCooldown?: number;
    reloadTime?: number;
    barrelCount?: number;
    caliber: string;
  }>;
  hasSAM?: boolean;
  samRange?: number;
  samModel?: string;
  hasHarpoon?: boolean;
  ashmType?: 'harpoon' | 'exocet_mm40' | 'exocet_mm38';
  hasCIWS?: boolean;
  hasASROC?: boolean;
  hasModernNavalGunAA?: boolean;
  torpedoCooldown?: number;
};

export interface AlliedSagFleet {
  title: string;
  ships: AlliedSagShipDef[];
}

/**
 * Historical allied surface action group for an era (Royal Navy, UN, NATO or JMSDF).
 * Eras 4 and 5 pick between two task forces with one Math.random() call.
 */
export function getAlliedSagFleet(era: Era): AlliedSagFleet {
  let title = '';
  let ships: AlliedSagShipDef[] = [];

  if (era === 'era1') {
    title = '英國皇家海軍東方艦隊 (Royal Navy Eastern Fleet SAG)';
    ships = [
      {
        name: 'HMS King George V (喬治五世號戰艦)',
        codeName: 'HMS KGV (41)',
        type: 'battleship',
        length: 128,
        width: 29,
        maxHealth: 16000,
        speed: 18,
        flakRange: 1400,
        turrets: [
          { id: 'kgv-t1', pos: { x: 38, y: 0 }, angle: 0, range: 2600, damage: 1250, cooldown: 0, maxCooldown: 10, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'kgv-t2', pos: { x: 20, y: 0 }, angle: 0, range: 2600, damage: 850, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII 雙聯裝' },
          { id: 'kgv-t3', pos: { x: -36, y: 0 }, angle: Math.PI, range: 2600, damage: 1250, cooldown: 0, maxCooldown: 10, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'kgv-dp1', pos: { x: 6, y: -12 }, angle: -Math.PI / 2, range: 1800, damage: 320, cooldown: 0, maxCooldown: 4.0, caliber: '5.25吋 高平兩用雙聯裝' },
          { id: 'kgv-dp2', pos: { x: 6, y: 12 }, angle: Math.PI / 2, range: 1800, damage: 320, cooldown: 0, maxCooldown: 4.0, caliber: '5.25吋 高平兩用雙聯裝' },
        ],
      },
      {
        name: 'HMS Sheffield (謝菲爾德號輕巡洋艦)',
        codeName: 'HMS Sheffield (C24)',
        type: 'cruiser',
        length: 98,
        width: 18,
        maxHealth: 8200,
        speed: 22,
        flakRange: 1200,
        torpedoCooldown: 28,
        turrets: [
          { id: 'sheff-t1', pos: { x: 30, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (A砲塔)' },
          { id: 'sheff-t2', pos: { x: 16, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (B背負砲塔)' },
          { id: 'sheff-t3', pos: { x: -16, y: 0 }, angle: Math.PI, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (X背負砲塔)' },
          { id: 'sheff-t4', pos: { x: -28, y: 0 }, angle: Math.PI, range: 1800, damage: 420, cooldown: 0, maxCooldown: 5.0, caliber: '6吋 Mk XXIII 三聯裝 (Y砲塔)' },
          { id: 'sheff-dp1', pos: { x: 2, y: -8 }, angle: -Math.PI / 2, range: 1600, damage: 240, cooldown: 0, maxCooldown: 3.5, caliber: '4吋 Mk XVI 雙聯高平兩用砲' },
          { id: 'sheff-dp2', pos: { x: 2, y: 8 }, angle: Math.PI / 2, range: 1600, damage: 240, cooldown: 0, maxCooldown: 3.5, caliber: '4吋 Mk XVI 雙聯高平兩用砲' },
        ],
      },
      {
        name: 'HMS Jervis (賈維斯號 J級驅逐艦)',
        codeName: 'HMS Jervis (F00)',
        type: 'destroyer',
        length: 68,
        width: 13,
        maxHealth: 4200,
        speed: 26,
        flakRange: 1000,
        torpedoCooldown: 20,
        turrets: [
          { id: 'jerv-t1', pos: { x: 20, y: 0 }, angle: 0, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (A砲塔)' },
          { id: 'jerv-t2', pos: { x: 9, y: 0 }, angle: 0, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (B背負砲塔)' },
          { id: 'jerv-t3', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1500, damage: 280, cooldown: 0, maxCooldown: 3.2, caliber: '4.7吋 Mk XII 雙聯裝 (X砲塔)' },
        ],
      },
    ];
  } else if (era === 'era2') {
    title = '英國皇家海軍第57特遣艦隊 (Royal Navy Task Force 57 SAG)';
    ships = [
      {
        name: 'HMS Duke of York (約克公爵號戰艦)',
        codeName: 'HMS Duke of York (17)',
        type: 'battleship',
        length: 128,
        width: 29,
        maxHealth: 16800,
        speed: 18,
        flakRange: 1600,
        turrets: [
          { id: 'doy-t1', pos: { x: 38, y: 0 }, angle: 0, range: 2600, damage: 1350, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII (Type 284 雷達射控)' },
          { id: 'doy-t2', pos: { x: 20, y: 0 }, angle: 0, range: 2600, damage: 900, cooldown: 0, maxCooldown: 9.0, caliber: '14吋 Mk VII 雙聯裝' },
          { id: 'doy-t3', pos: { x: -36, y: 0 }, angle: Math.PI, range: 2600, damage: 1350, cooldown: 0, maxCooldown: 9.5, caliber: '14吋 Mk VII 四聯裝' },
          { id: 'doy-dp1', pos: { x: 6, y: -12 }, angle: -Math.PI / 2, range: 1800, damage: 340, cooldown: 0, maxCooldown: 3.8, caliber: '5.25吋 VT近發雙聯裝' },
          { id: 'doy-dp2', pos: { x: 6, y: 12 }, angle: Math.PI / 2, range: 1800, damage: 340, cooldown: 0, maxCooldown: 3.8, caliber: '5.25吋 VT近發雙聯裝' },
        ],
      },
      {
        name: 'HMS Belfast (貝爾法斯特號輕巡洋艦)',
        codeName: 'HMS Belfast (C35)',
        type: 'cruiser',
        length: 102,
        width: 19,
        maxHealth: 8600,
        speed: 22,
        flakRange: 1400,
        torpedoCooldown: 25,
        turrets: [
          { id: 'belf-t1', pos: { x: 32, y: 0 }, angle: 0, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (A砲塔)' },
          { id: 'belf-t2', pos: { x: 17, y: 0 }, angle: 0, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (B砲塔)' },
          { id: 'belf-t3', pos: { x: -17, y: 0 }, angle: Math.PI, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (X砲塔)' },
          { id: 'belf-t4', pos: { x: -30, y: 0 }, angle: Math.PI, range: 1800, damage: 450, cooldown: 0, maxCooldown: 4.5, caliber: '6吋 Mk XXIII 三聯裝 (Y砲塔)' },
          { id: 'belf-dp1', pos: { x: 0, y: -8 }, angle: -Math.PI / 2, range: 1600, damage: 260, cooldown: 0, maxCooldown: 3.2, caliber: '4吋 Mk XVI 雙聯裝高平砲' },
          { id: 'belf-dp2', pos: { x: 0, y: 8 }, angle: Math.PI / 2, range: 1600, damage: 260, cooldown: 0, maxCooldown: 3.2, caliber: '4吋 Mk XVI 雙聯裝高平砲' },
        ],
      },
      {
        name: 'HMS Armada (阿瑪達號戰鬥級驅逐艦)',
        codeName: 'HMS Armada (D14)',
        type: 'destroyer',
        length: 72,
        width: 13,
        maxHealth: 4500,
        speed: 26,
        flakRange: 1300,
        torpedoCooldown: 20,
        turrets: [
          { id: 'arm-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.5吋 Mk IV 雙聯裝快砲 (A砲塔)' },
          { id: 'arm-t2', pos: { x: 12, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.5吋 Mk IV 雙聯裝快砲 (B背負砲塔)' },
          { id: 'arm-aa', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1500, damage: 260, cooldown: 0, maxCooldown: 3.0, caliber: '4吋 QF Mk V 高平副砲' },
        ],
      },
    ];
  } else if (era === 'era3') {
    title = '聯合國軍第95特遣艦隊 (UN Naval Task Force 95 SAG)';
    ships = [
      {
        name: 'HMS Belfast (貝爾法斯特號 · 聯合國遠東特遣旗艦)',
        codeName: 'HMS Belfast (UN-C35)',
        type: 'cruiser',
        length: 104,
        width: 19,
        maxHealth: 9000,
        speed: 22,
        flakRange: 1600,
        hasModernNavalGunAA: true,
        turrets: [
          { id: 'un-belf-t1', pos: { x: 32, y: 0 }, angle: 0, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (A砲塔)' },
          { id: 'un-belf-t2', pos: { x: 17, y: 0 }, angle: 0, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (B背負砲塔)' },
          { id: 'un-belf-t3', pos: { x: -17, y: 0 }, angle: Math.PI, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (X背負砲塔)' },
          { id: 'un-belf-t4', pos: { x: -30, y: 0 }, angle: Math.PI, range: 2000, damage: 500, cooldown: 0, maxCooldown: 3.8, caliber: '6吋 自動填裝艦砲 (Y砲塔)' },
          { id: 'un-belf-aa1', pos: { x: 0, y: -9 }, angle: -Math.PI / 2, range: 1600, damage: 280, cooldown: 0, maxCooldown: 2.2, caliber: '3"/50 VT 雙聯裝速射砲' },
          { id: 'un-belf-aa2', pos: { x: 0, y: 9 }, angle: Math.PI / 2, range: 1600, damage: 280, cooldown: 0, maxCooldown: 2.2, caliber: '3"/50 VT 雙聯裝速射砲' },
        ],
      },
      {
        name: 'HMS Cossack (哥薩克號部族級驅逐艦)',
        codeName: 'HMS Cossack (D03)',
        type: 'destroyer',
        length: 74,
        width: 14,
        maxHealth: 4800,
        speed: 26,
        flakRange: 1200,
        torpedoCooldown: 22,
        turrets: [
          { id: 'coss-t1', pos: { x: 22, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (A砲塔)' },
          { id: 'coss-t2', pos: { x: 10, y: 0 }, angle: 0, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (B砲塔)' },
          { id: 'coss-t3', pos: { x: -18, y: 0 }, angle: Math.PI, range: 1600, damage: 340, cooldown: 0, maxCooldown: 2.8, caliber: '4.7吋 Mk XII 連環快砲 (X砲塔)' },
        ],
      },
      {
        name: 'HMS Defender (保衛者號衛士級重驅逐艦)',
        codeName: 'HMS Defender (D114)',
        type: 'destroyer',
        length: 78,
        width: 14,
        maxHealth: 5200,
        speed: 26,
        flakRange: 1400,
        hasModernNavalGunAA: true,
        torpedoCooldown: 20,
        turrets: [
          { id: 'def-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (A砲塔)' },
          { id: 'def-t2', pos: { x: 12, y: 0 }, angle: 0, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (B砲塔)' },
          { id: 'def-t3', pos: { x: -20, y: 0 }, angle: Math.PI, range: 1700, damage: 380, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk VI 全封閉雷達射控雙聯砲 (X砲塔)' },
        ],
      },
    ];
  } else if (era === 'era4') {
    const isNato = Math.random() < 0.5;
    if (isNato) {
      title = '北約大西洋常設艦隊 (NATO STANAVFORLANT SAG)';
      ships = [
        {
          name: 'HMS Sheffield (Type 42 飛彈驅逐艦)',
          codeName: 'HMS Sheffield (D80)',
          type: 'ddg',
          length: 88,
          width: 16,
          maxHealth: 6800,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasSAM: true,
          samRange: 3200,
          samModel: 'Sea Dart (海鏢) 區域防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'shef42-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 480, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk 8 全自動艦砲' },
            { id: 'shef42-sam', pos: { x: 8, y: 0 }, angle: 0, range: 3200, damage: 950, cooldown: 0, maxCooldown: 8.0, caliber: 'Sea Dart (海鏢) 雙臂防空飛彈' },
          ],
        },
        {
          name: 'HMS Andromeda (利安達級巡防艦)',
          codeName: 'HMS Andromeda (F57)',
          type: 'destroyer',
          length: 80,
          width: 15,
          maxHealth: 5500,
          speed: 24,
          flakRange: 1200,
          hasHarpoon: true,
          ashmType: 'exocet_mm38',
          hasSAM: true,
          samRange: 2400,
          samModel: 'Sea Wolf (海狼) 點防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'andro-sam', pos: { x: 18, y: 0 }, angle: 0, range: 2400, damage: 750, cooldown: 0, maxCooldown: 6.0, caliber: 'Sea Wolf (海狼) 短程防空飛彈' },
            { id: 'andro-ashm', pos: { x: -14, y: 0 }, angle: 0, range: 4000, damage: 1650, cooldown: 0, maxCooldown: 24.0, caliber: 'Exocet (飛魚 MM38) 掠海反艦飛彈' },
          ],
        },
      ];
    } else {
      title = '日本海上自衛隊護衛艦群 (JMSDF Escort Flotilla SAG)';
      ships = [
        {
          name: 'JDS Haruna 榛名號直升機護衛艦 (DDH-141)',
          codeName: 'JDS Haruna (DDH-141)',
          type: 'ddg',
          length: 104,
          width: 18,
          maxHealth: 7400,
          speed: 24,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2600,
          samModel: 'RIM-7 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'haruna-t1', pos: { x: 32, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'haruna-t2', pos: { x: 18, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'haruna-sam', pos: { x: -24, y: 0 }, angle: Math.PI, range: 2600, damage: 850, cooldown: 0, maxCooldown: 7.0, caliber: 'RIM-7 海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Takatsuki 高月號護衛艦 (DD-164)',
          codeName: 'JDS Takatsuki (DD-164)',
          type: 'destroyer',
          length: 86,
          width: 16,
          maxHealth: 5600,
          speed: 25,
          flakRange: 1200,
          hasModernNavalGunAA: true,
          hasASROC: true,
          torpedoCooldown: 25,
          turrets: [
            { id: 'taka-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
            { id: 'taka-t2', pos: { x: -22, y: 0 }, angle: Math.PI, range: 1800, damage: 500, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋砲 (Mk 42)' },
          ],
        },
      ];
    }
  } else {
    // Era 5
    const isNato = Math.random() < 0.5;
    if (isNato) {
      title = '北約海上打擊部隊 (NATO Striking Fleet Atlantic SAG)';
      ships = [
        {
          name: 'HMS Gloucester 格洛斯特號 (Type 42 Batch 2 飛彈驅逐艦)',
          codeName: 'HMS Gloucester (D96)',
          type: 'ddg_kidd',
          length: 95,
          width: 16,
          maxHealth: 7200,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasCIWS: true,
          hasSAM: true,
          samRange: 3400,
          samModel: 'Sea Dart Mod 2 區域防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'glou-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '4.5吋 Mk 8 全自動艦砲' },
            { id: 'glou-sam', pos: { x: 10, y: 0 }, angle: 0, range: 3400, damage: 1050, cooldown: 0, maxCooldown: 7.0, caliber: 'Sea Dart Mod 2 雙臂防空飛彈' },
          ],
        },
        {
          name: 'FGS Bremen 不萊梅號 (F122 巡防艦)',
          codeName: 'FGS Bremen (F207)',
          type: 'ffg_ohp',
          length: 84,
          width: 15,
          maxHealth: 6000,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'NSSMS 北約海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'brem-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托梅萊拉 76mm 快砲' },
            { id: 'brem-sam', pos: { x: -18, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: 'NSSMS 八聯裝北約海麻雀' },
          ],
        },
        {
          name: 'FS Tourville 圖爾維爾號 (F67 飛彈驅逐艦)',
          codeName: 'FS Tourville (D610)',
          type: 'dd_spruance',
          length: 98,
          width: 16,
          maxHealth: 6600,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'exocet_mm40',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2600,
          samModel: '海響尾蛇 (Crotale) 點防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'tour-t1', pos: { x: 26, y: 0 }, angle: 0, range: 1800, damage: 460, cooldown: 0, maxCooldown: 2.2, caliber: '100mm/55 Mod 68 快砲' },
            { id: 'tour-sam', pos: { x: -22, y: 0 }, angle: Math.PI, range: 2600, damage: 800, cooldown: 0, maxCooldown: 6.0, caliber: 'Crotale (海響尾蛇) 防空飛彈' },
          ],
        },
      ];
    } else {
      title = '日本海上自衛隊八八艦隊 (JMSDF Eight-Eight Escort Flotilla SAG)';
      ships = [
        {
          name: 'JDS Shirane 白根號直升機護衛艦 (DDH-143)',
          codeName: 'JDS Shirane (DDH-143)',
          type: 'ddg_kidd',
          length: 108,
          width: 18,
          maxHealth: 7800,
          speed: 24,
          flakRange: 1400,
          hasModernNavalGunAA: true,
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7F 短程海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'shirane-t1', pos: { x: 34, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋速射砲 (Mk 42)' },
            { id: 'shirane-t2', pos: { x: 20, y: 0 }, angle: 0, range: 1800, damage: 520, cooldown: 0, maxCooldown: 2.5, caliber: '54倍徑 5吋速射砲 (Mk 42)' },
            { id: 'shirane-sam', pos: { x: -28, y: 0 }, angle: Math.PI, range: 2800, damage: 880, cooldown: 0, maxCooldown: 6.5, caliber: '短程海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Asagiri 朝霧號飛彈護衛艦 (DD-151)',
          codeName: 'JDS Asagiri (DD-151)',
          type: 'ffg_ohp',
          length: 90,
          width: 16,
          maxHealth: 6400,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7M 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'asagiri-t1', pos: { x: 25, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托 76mm 快砲 (DART)' },
            { id: 'asagiri-sam', pos: { x: -22, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: '海麻雀防空飛彈' },
          ],
        },
        {
          name: 'JDS Hatsuyuki 初雪號護衛艦 (DD-122)',
          codeName: 'JDS Hatsuyuki (DD-122)',
          type: 'ffg_ohp',
          length: 86,
          width: 15,
          maxHealth: 5800,
          speed: 25,
          flakRange: 1300,
          hasModernNavalGunAA: true,
          hasHarpoon: true,
          ashmType: 'harpoon',
          hasCIWS: true,
          hasASROC: true,
          hasSAM: true,
          samRange: 2800,
          samModel: 'RIM-7E 海麻雀防空飛彈',
          torpedoCooldown: 25,
          turrets: [
            { id: 'hatsu-t1', pos: { x: 24, y: 0 }, angle: 0, range: 1800, damage: 420, cooldown: 0, maxCooldown: 1.8, caliber: '奧托 76mm 快砲 (DART)' },
            { id: 'hatsu-sam', pos: { x: -20, y: 0 }, angle: Math.PI, range: 2800, damage: 850, cooldown: 0, maxCooldown: 6.5, caliber: '海麻雀防空飛彈' },
          ],
        },
      ];
    }
  }

  return { title, ships };
}
