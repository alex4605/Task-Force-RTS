# 時代四海空現代化、ASROC 反潛體系、戰線推進與超視距雷達照射飛彈作戰計畫

為《Task Force 1944: Vector Fleet Command》全面強化冷戰與越南戰爭（時代三與時代四）的海空現代化作戰體驗：修正航空母艦選單與開闊海域出生點、擴充反潛航空作戰與艦載 ASROC/聲導魚雷、建立動態前線交鋒與 3 倍密度大陸設施、實裝冷戰驅逐艦/護衛艦與敵軍飛彈快艇突襲狼群，並完善 AIM-7 半主動雷達導引機頭照射機制。

---

### User Review & Critical Decisions

> [!IMPORTANT]
> 本計畫已完整整合用戶在澄清階段所確認的三大關鍵決策：
> 1. **ASROC 反潛火箭與艦側魚雷發射機制**：採「自動聲納偵搜與手動指派兼具（Automatic sonar launch with manual target override）」。當敵軍潛艇或水面艦進入射程時，配備艦艇自動發射 ASROC 助飛魚雷或艦側 Mk 32 聲自導魚雷，玩家亦可手動點選覆蓋打擊。
> 2. **大陸設施 3 倍擴充與戰線推進節奏**：採「動態戰線推進（Dynamic frontline push with captureable neutral and hostile bases）」。大陸均勻散布 35+ 座中立村落、橡膠園、渡口與敵軍工事，美軍與 OPFOR 定期沿道路生成推進波次爭奪據點。
> 3. **CAP 戰機空空飛彈交戰與半主動雷達導引 (SARH) 機制**：採「BVR 超視距 AIM-7 雷達機頭照射 + 近距 AIM-9 雙發格鬥齊射（BVR radar lock for AIM-7 followed by dual AIM-9 dogfight salvo）」。超視距發射 AIM-7 麻雀飛彈時，載機會維持機頭對準目標實施持續雷達照射，直至命中或脫鎖；近距交狗鬥時則發射雙枚 AIM-9 響尾蛇飛彈。

---

### 1. Overview & Core Concept

- **目標定位**：全面解決時代四航艦介面相容性與海軍生成邊界問題，並將遊戲機制推升至具備立體 ASW 反潛網、超視距雷達連續波照射（SARH）、掠海反艦飛彈狼群突襲與動態大陸攻防的現代化海空 RTS 系統。
- **核心解決痛點**：
  1. **時代四航母選單修正**：修正 HUD 中航母判定邏輯（涵蓋 `cv63` 旗艦與 `lph` 兩棲突擊艦），確保點擊 CV-63 與 LPH-2 均能順暢展開全套 10 款冷戰艦載機整備出擊選單。
  2. **OPFOR 海軍出生點開闊海域重校準**：修正時代三與時代四 OPFOR 艦隊生成座標，由陸地內部（`x: 11400`）移至西北方深海開闊海域（`x: 3600, y: 1600`），避免艦隻卡在陸地。
  3. **時代四反潛航空作戰**：實裝 SH-2 海妖（Seasprite）艦載反潛直升機（支援 LPH、CG、DDG、FFG 停機坪起降）與 P-3C 獵戶座（Orion）長程陸基反潛巡邏機。
  4. **艦載 ASROC 反潛火箭與艦側魚雷**：CG、DDG、DD、FFG 配備 ASROC 八聯裝發射箱與 Mk 32 艦側三聯裝魚雷管。
  5. **時代三起魚雷主動聲納導引**：二戰直航魚雷進化為 Mk 44 / Mk 46 聲自導魚雷，具備水中主動聲吶尋標與轉向追蹤功能。
  6. **小地圖友軍設施藍色標示**：小地圖上友軍設施以專屬戰術高亮藍（`#3B82F6` / `#00E5FF`）顯示，敵軍紅色，中立金色/白灰色。
  7. **大陸動態戰線自動交鋒（時代三與時代四）**：雙方沿大陸主要幹道定期生成前鋒部隊，自動交火推進爭奪村落要塞。
  8. **大陸設施擴充 3 倍+ 與多樣化地形**：新增 35+ 處中立定居點（橡膠園、渡口、米倉、野戰醫院、通信塔）與敵軍陣地（迫擊砲陣地、ZPU-4、S-60、石勒喀防空車、雷達哨）。
  9. **時代四海軍新增艦型**：實裝 Forrest Sherman 級主力驅逐艦（DD）與 Knox 級巡防艦（FFG）。
  10. **OPFOR 蚊子級飛彈快艇狼群突襲**：定期由北方海域出動 2~4 艘飛彈快艇，高速突襲發射 P-15 冥河反艦飛彈，考驗玩家遠程砲火消滅與 SAM 攔截反應。
  11. **時代四多樣化地面單位**：藍軍新增美陸軍步槍排、M113 機械化步兵排與 MIM-72 榭樹（Chaparral）野戰防空飛彈排。
  12. **CAP 飛彈戰術強化**：CAP 巡邏戰機在 1000m~2400m 超視距自動發射 AIM-7 並維持機頭持續雷達照射；800m 內發射 2 枚 AIM-9 連射。

---

### 2. User Experience & Visual Design

#### A. 現代化艦隊與直升機視覺
- **CV-63 與 LPH-2 選單解鎖**：點選艦體或切換底部 Deck 分頁時，無縫呈現時代四甲板配置與直升機垂直突擊組態。
- **SH-2 Seasprite 與 P-3C Orion 向量外型**：
  - **SH-2**：雙發渦輪軸發動機艙、下顎平圓形搜索雷達天線罩、機側 Mk 46 魚雷掛架與磁力探測儀（MAD）。
  - **P-3C**：四發 Allison 渦槳發動機、大型平直大展弦比翼、尾部細長刺針狀磁異探測器（MAD Boom）。
- **ASROC 反潛火箭發射特效**：
  - 八聯裝發射箱轉動指向目標方位，火箭發動機熾熱點火，噴射白色濃烈煙柱以拋物線彈道高速升空；
  - 於目標上空脫離助推器，降落傘減速打開，Mk 46 聲自導魚雷平穩入水並啟動聲吶環狀波紋。

#### B. 聲自導魚雷與雷達機頭照射特效
- **聲導魚雷（Acoustic Homing Torpedo）**：入水後以 35 節高速航行，頭部定期發出綠/淡藍色微弱主動聲吶探測音波弧，主動修正轉向追蹤水下潛艇與敵艦龍骨。
- **AIM-7 機頭半主動雷達照射（SARH Illumination）**：
  - 當 F-4 鎖定發射 AIM-7 時，機頭與目標之間以虛線相列雷達波束（Pencil Radar Beam）連結；
  - 飛機在飛彈飛行期間保持朝向目標錐形角（±25° 照射角），若被迫大角度避險將導致照射中斷脫鎖。
- **AIM-9 雙發連射（Ripple Salvo）**：近距格鬥時連續發射 2 枚響尾蛇飛彈，尾部拉出高機動白色煙霧軌跡。

#### C. 大陸戰線與設施密度強化
- **小地圖多色標示體系**：
  - 友軍基地/設施：戰術高亮電光藍（`#38BDF8` / `#00E5FF`）。
  - 中立設施/村落：戰術金/琥珀色（`#F59E0B` / `#FCD34D`）。
  - 敵軍設施/要塞：警戒深紅（`#EF4444`）。
- **35+ 處均勻散布設施**：
  - 包含沿海港口、內陸橡膠園加工廠、河川渡口棧橋、中央無線電塔、野戰醫療所、前哨觀察塔、補給彈藥庫與多個泥土道路交叉路口。

---

### 3. Key Technical Decisions & System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Simulation Engine Core                          │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │    Naval Fleet System     │      │   Submarine & ASW Suite     │   │
│   │  - CV-63 & LPH Carrier UI │      │  - ASROC Rocket Torpedo     │   │
│   │  - Forrest Sherman (DD)   │────> │  - Mk 32 SVTT Torpedoes     │   │
│   │  - Knox Class (FFG)       │      │  - Active Acoustic Homing   │   │
│   │  - Deep Sea OPFOR Spawns  │      │  - Sonar Lead Intercept     │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │   Mainland Frontline War  │      │  Air Combat & Missile Radar │   │
│   │  - Era 3 & 4 Clashing Auto│      │  - BVR AIM-7 Nose Tracking  │   │
│   │  - 35+ Facilities (3x)    │────> │  - SARH Illumination Cone   │   │
│   │  - M113 / Chaparral Units │      │  - AIM-9 Dual Salvo Dogfight│   │
│   │  - Komar PTG Styx Raids   │      │  - SH-2 Helo & P-3 Orion    │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Canvas & HUD Interfaces                         │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │    Minimap & Tactical Map │      │   Carrier & Armament Tray   │   │
│   │  - Blue Friendly Buildings│      │  - Unblocked CV-63/LPH Tabs │   │
│   │  - Red Hostile Outposts   │      │  - SH-2 / P-3 ASW Loadouts  │   │
│   │  - Gold Neutral Villages  │      │  - Chaparral Ground SAM     │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

| 系統/功能 | 實作方案 | 決策考量與優勢 |
| :--- | :--- | :--- |
| **航艦選單識別** | 匹配 `carrier \| cve \| cv63 \| lph` | 徹底打通時代四旗艦與兩棲艦之甲板選單與直升機整備介面 |
| **OPFOR 出生點** | 西北方開闊水域 `(x: 3600, y: 1600)` | 遠離大陸多邊形邊界（起始於 X: 4850），保留足夠海戰縱深與預警時間 |
| **ASROC 與魚雷導引** | 彈道助飛 + 入水後主動聲吶弧追蹤 | 史實重現冷戰美軍標準 ASW 打擊模式，大幅強化反潛作戰層次感 |
| **AIM-7 雷達照射** | 半主動雷達導引角限制與載機保持指向 | 史實重現 SARH 技術特徵，玩家需注意載機航向以維持雷達照射 |
| **飛彈快艇突襲狼群** | 定期出動 2~4 艘 Komar PTG 掠海疾馳 | 提供高張力水面威脅，強化反艦飛彈防禦與艦載打擊協同 |

---

### 4. Implementation Steps & File Breakdown

#### Step 1: 型別定義與資料結構擴充 (`src/types/game.ts`)
1. 擴充 `AircraftModel`：新增 `'sh2' | 'p3'`。
2. 擴充 `ShipType`：新增 `'dd' | 'ffg'`。
3. 擴充 `GroundUnitType`：新增 `'us_army_rifle_platoon_65' | 'us_army_m113_mech' | 'us_army_chaparral_sam'`。
4. 擴充 `Projectile`：新增 `isASROC`, `asrocStage`, `asrocParachute`, `acousticSonarPingTimer`, `targetSubId`。
5. 擴充 `Aircraft`：新增 `sarhTargetId`, `sarhLockTimer`, `sarhHoldingHeading`。
6. 擴充 `InstallationType`：新增 `'rubber_plantation' | 'river_ferry' | 'radio_station' | 'ammo_cache' | 'watchtower'`。

#### Step 2: 程式化生成與地圖擴充 (`src/game/procedural.ts`)
1. 修正時代三與時代四 `enemyCenter` 座標至西北深海 `(x: 3600, y: 1600)`，航向向東南（`angle: 0.4 * Math.PI`）。
2. 在時代四加入 `createForrestShermanDD` 與 `createKnoxFFG` 艦艇工廠。
3. 在時代四美軍特遣艦隊中配備 CV-63, Belknap CG, Adams DDG, Forrest Sherman DD, Knox FFG 與 Iwo Jima LPH。
4. 擴充大陸設施至 35+ 座：
   - 均勻散布 12 處中立農莊、橡膠園、渡口與通訊站；
   - 均勻散布 15+ 處 OPFOR 守備要塞、高射砲位、迫擊砲陣地與雷達哨。

#### Step 3: 模擬引擎戰術邏輯 (`src/game/engine.ts`)
1. **ASROC 與 Mk 32 SVTT 反潛發射邏輯**：
   - 配備 ASROC 之艦艇自動偵測 1800m 內敵軍潛艦，發射火箭助推魚雷；空中拋傘後分離為聲導魚雷入水。
   - 艦側魚雷發射管（SVTT）近距離（<1000m）發射 Mk 46 聲自導魚雷。
2. **聲導魚雷追蹤機制**：
   - 時代三與時代四魚雷具備主動聲吶尋標功能，動態追蹤目標並修正航向。
3. **OPFOR 蚊子級飛彈快艇狼群突襲 (2~4艘)**：
   - 定期於西北海域生成 2~4 艘 Komar 級飛彈快艇，發射 P-15 冥河飛彈突襲艦隊。
4. **大陸動態戰線自動推進**：
   - 時代三與時代四定期生成雙方步兵、戰車與機械化部隊，沿道路推進並自動交戰。
5. **CAP 軍機 BVR AIM-7 雷達機頭照射與 AIM-9 雙發連射**：
   - 800m~2400m 發射 AIM-7 並維持機頭朝向目標；近距離（<800m）發射 2 枚 AIM-9。
6. **MIM-72 榭樹防空飛彈車機制**：
   - 美軍陸戰防空車自動發射響尾蛇陸基版攔截低空敵機。

#### Step 4: 向量圖形渲染器優化 (`src/game/renderer.ts`)
1. 繪製 SH-2 海妖直升機與 P-3C 獵戶座反潛機。
2. 繪製 Forrest Sherman DD 與 Knox FFG 艦體向量結構。
3. 繪製 ASROC 火箭發射尾焰、拋傘入水動畫與聲導魚雷主動聲吶探測音波。
4. 繪製 AIM-7 半主動雷達引導射束（載機機頭至目標虛線雷達波束）。
5. 繪製小地圖友軍設施電光藍色標示。

#### Step 5: HUD 介面與選單聯動 (`src/components/HUD.tsx`)
1. 修正 `isCarrierSelected` 與底部 Deck 判定，支援 `cv63` 與 `lph` 呼叫出擊選單。
2. 整合 SH-2、P-3C、ASROC、榭樹防空車與新增設施的顯示與操作相容性。
3. 確保小地圖友軍建物清晰標示為高亮藍色。

---

### 5. Verification Plan

1. **靜態型別與語法檢查**：執行 `lint_applet`（`tsc --noEmit`），確認無任何型別錯誤。
2. **編譯打包驗證**：執行 `compile_applet`，確保 Vite 與 React 打包 100% 成功。
3. **功能性驗證清單**：
   - 點擊 CV-63 Kitty Hawk 與 LPH-2 Iwo Jima，確認底部航艦出擊選單順暢展開。
   - 切換至時代三與時代四，確認 OPFOR 水面艦艇出現在西北深海開闊水面，無任何艦艇卡在陸地上。
   - 測試艦艇自動發射 ASROC 與聲導魚雷追蹤潛艇。
   - 測試 CAP 軍機發射 AIM-7 並保持機頭照射。
   - 檢驗小地圖上友軍設施為亮藍色，中立為金色，敵軍為紅色。
   - 觀察大陸地圖均勻散布的 35+ 處設施與雙方推進部隊交戰。
   - 觀察 OPFOR 飛彈快艇狼群突襲並驗證防空攔截機制。
