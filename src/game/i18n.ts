// Task Force 1944: Vector Fleet Command - i18n Localization System
// Comprehensive bilingual support for Traditional Chinese (繁體中文) and English (EN)

export type Language = 'zh' | 'en';

export interface TranslationDictionary {
  // Top Header
  gameTitle: string;
  era1: string;
  era1Tooltip: string;
  era2: string;
  era2Tooltip: string;
  era3: string;
  era3Tooltip: string;
  era4: string;
  era4Tooltip: string;
  era5: string;
  era5Tooltip: string;
  paused: string;
  pause: string;
  speedSlow: string;
  speedNormal: string;
  speedFast: string;
  btnArmament: string;
  btnArmamentTooltip: string;
  btnAirPrep: string;
  btnAirPrepTooltip: string;
  btnMap: string;
  btnMapTooltip: string;
  btnBriefing: string;
  btnBriefingTooltip: string;
  btnStampActive: string;
  btnStampInactive: string;
  btnStampTooltip: string;
  btnDockyard: string;
  btnDockyardTooltip: string;
  btnBattleLog: string;
  btnBattleLogTooltip: string;
  airborne: string;
  commandPoints: string;
  stars: string;
  score: string;
  unmute: string;
  mute: string;

  // Mini-Radar
  miniMapTitle: string;
  miniMapHint: string;
  north: string;
  south: string;
  east: string;
  west: string;

  // Bottom Deck Tabs
  tabCarrier: string;
  tabAirbase: string;
  tabRequisition: string;
  tabEngineerConstruction: string;
  tabEngineerConstructionDesc: string;
  tabBattalionCp: string;
  tabBattalionCpDesc: string;
  btnOpenBuildMenu: string;
  reinforceSpawnNote: string;
  quickBuild: string;
  stampBuild: string;
  fleetHelm: string;
  speedTelegraph: string;
  rudderControls: string;
  flakBarrage: string;
  flakBarrageDesc: string;

  // Orders
  orderMove: string;
  orderAttack: string;
  orderPatrol: string;
  orderRtb: string;
  orderStop: string;
  orderCapOrbit: string;
  orderCapOrbitHint: string;
  cancelCap: string;
  orderDropSonobuoy: string;
  orderDropSonobuoyHint: string;
  cancelSonobuoy: string;

  // Requisition Categories
  catShips: string;
  catAircraft: string;
  catGroundUnits: string;
  catInstallations: string;
  btnPurchase: string;
  btnStampToMap: string;
  continuousStamping: string;
  sandboxMode: string;
  costCp: string;

  // Sortie Controls
  btnLaunchSortie: string;
  noPlanesReady: string;
  aircraftReady: string;
  formationCount: string;
  payloadChoice: string;

  // Right Panel / Selection
  selectedUnits: string;
  noSelection: string;
  hullHealth: string;
  organization: string;
  strength: string;
  supplied: string;
  unsupplied: string;
  urbanCoverActive: string;
  banzaiActive: string;
  surrendered: string;
  tabWarships: string;
  tabFlights: string;
  tabAllUnits: string;

  // Modals - Briefing
  briefingTitle: string;
  briefingSubtitle: string;
  situationReport: string;
  primaryObjective: string;
  secondaryObjective: string;
  tacticalAdvice: string;
  commenceAction: string;

  // Modals - Air Wing Prep
  prepTitle: string;
  prepCapacity: string;
  prepIntro: string;
  confirmLoadout: string;
  preLaunchCap: string;
  preLaunchScout: string;

  // Modals - Armament
  armamentTitle: string;
  armamentSubtitle: string;
  roleFighter: string;
  roleDiveBomber: string;
  roleTorpedoBomber: string;
  roleAttacker: string;
  roleScout: string;
  roleAew: string;
  roleRescue: string;
  damage: string;
  speedMod: string;
  ammo: string;
  blastRadius: string;
  purpose: string;

  // Modals - Dockyard
  dockyardTitle: string;
  dockyardSubtitle: string;
  repairFleet: string;
  repairFleetDesc: string;
  eraSelection: string;
  eraSelectionDesc: string;
  upgradesTitle: string;
  upgradeHullArmor: string;
  upgradeAaFirepower: string;
  upgradeRadarRange: string;
  upgradeCarrierCapacity: string;
  upgradeArtilleryDamage: string;
  upgradeDepthChargeSonar: string;

  // Modals - Battle Log
  battleLogTitle: string;
  logFilterAll: string;
  logFilterCombat: string;
  logFilterAir: string;
  logFilterLosses: string;
  logFilterReprimands: string;
  clearLogs: string;
  casualtiesSummary: string;
  playerLosses: string;
  enemyLosses: string;

  // Modals - Tactical Map
  tacticalMapTitle: string;
  theaterOverview: string;
  zoomIn: string;
  zoomOut: string;
  resetView: string;

  // Modals - Game Over
  victoryTitle: string;
  defeatTitle: string;
  nextSector: string;
  restartMission: string;
  totalScoreBreakdown: string;
  efficiencyRating: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  zh: {
    // Top Header
    gameTitle: '特遣艦隊 RTS',
    era1: '時代一 (1942)',
    era1Tooltip: '時代一：二戰太平洋開戰 (珊瑚海／中途島／瓜達康納爾)',
    era2: '時代二 (1944-45)',
    era2Tooltip: '時代二：快速航母特遣艦隊 (馬里亞納／雷伊泰灣／沖繩決戰)',
    era3: '時代三 (1950-53)',
    era3Tooltip: '時代三：冷戰與噴射時代 (第七艦隊／米格走廊／興南撤退)',
    era4: '時代四 (1965-73)',
    era4Tooltip: '時代四：冷戰超音速與越戰風暴 (東京灣／小鷹號超級航母／空空反輻射飛彈／直升機垂直包圍)',
    era5: '時代五 (1973-91)',
    era5Tooltip: '時代五：冷戰終局與大洋決戰 (尼米茲核航母／神盾巡洋艦／CIWS近迫防禦／魚叉與花崗岩超音速反艦／反飛彈攔截)',
    paused: '已暫停',
    pause: '暫停 (Backspace)',
    speedSlow: '0.5x 慢速推演',
    speedNormal: '1.0x 實時速度',
    speedFast: '2.0x 快速前進',
    btnArmament: '戰機掛載 (ARM)',
    btnArmamentTooltip: '重置艦載機掛載武裝 (HVAR火箭、穿甲航彈、凝固汽油彈、聲導魚雷)',
    btnAirPrep: '機隊編制',
    btnAirPrepTooltip: '調整戰鬥機、俯衝轟炸機與魚雷機數量比例',
    btnMap: '戰區全圖 (M)',
    btnMapTooltip: '開啟全戰區大比例海圖與情報疊層',
    btnBriefing: '作戰情報',
    btnBriefingTooltip: '檢視司令部作戰訓令與戰術指引',
    btnStampActive: '正在戳記中',
    btnStampInactive: '工事建築 (F3)',
    btnStampTooltip: '開啟/關閉設施自由建造戳記盤 (可在任意位置建造碼頭、船塢與要塞)',
    btnDockyard: '艦隊修護改裝',
    btnDockyardTooltip: '珍珠港海軍造船廠：艦隊大修、科技研發與時代跨越',
    btnBattleLog: '作戰日誌 (LOG)',
    btnBattleLogTooltip: '檢視全域交戰報告、擊沉紀錄與傷亡統計',
    airborne: '空中在航',
    commandPoints: '指揮點數 (CP)',
    stars: '功勳星徽',
    score: '戰果總分',
    unmute: '解除靜音',
    mute: '靜音',

    // Mini-Radar
    miniMapTitle: '戰術雷達海圖',
    miniMapHint: '點擊地圖任意處可快速平移攝影機視角',
    north: '北 N',
    south: '南 S',
    east: '東 E',
    west: '西 W',

    // Bottom Deck Tabs
    tabCarrier: '航母甲板出擊',
    tabAirbase: '陸基空軍基地',
    tabRequisition: '戰地徵用與工兵建築',
    tabEngineerConstruction: '🏗️ 工兵急造戰地工程部',
    tabEngineerConstructionDesc: '工兵專屬建造工事：前進機場、岸基要塞、箱式碼頭、急造防空、營指揮所、急造雷達',
    tabBattalionCp: '🎖️ 營前進作戰指揮所',
    tabBattalionCpDesc: '戰術支援呼叫：地面單位自本營指揮所旁集結；海軍艦艇自地圖外海邊緣駛入；戰機進駐航空基地',
    btnOpenBuildMenu: '🏗️ 打開戰地工程建造選單',
    reinforceSpawnNote: '增援規則：陸地單位自本營指揮所旁集結；海軍艦艇自地圖南緣入役；飛機進駐航空基地',
    quickBuild: '快捷建造',
    stampBuild: '指定位置建造',
    fleetHelm: '旗艦舵向與車鐘操舵',
    speedTelegraph: '航速車鐘 (Knots)',
    rudderControls: '轉向操舵 (Rudder)',
    flakBarrage: '防空全彈齊射',
    flakBarrageDesc: '觸發艦隊周邊所有高射砲密集防空彈幕阻截敵機',

    // Orders
    orderMove: '移動 (Move)',
    orderAttack: '攻擊 (Attack)',
    orderPatrol: '巡邏 (Patrol)',
    orderRtb: '返航 (RTB)',
    orderStop: '停止 (Stop)',
    orderCapOrbit: '指派空優巡邏空域 (CAP)',
    orderCapOrbitHint: '在地圖上點擊指定空域，在航戰鬥機將前往盤旋警戒',
    cancelCap: '取消空優指派',
    orderDropSonobuoy: '投擲被動聲納浮標 (G)',
    orderDropSonobuoyHint: '在海圖上點擊目標海域，派遣反潛機/直升機投擲被動聲納（插眼）監聽過境敵潛艦',
    cancelSonobuoy: '取消聲納投擲',

    // Requisition Categories
    catShips: '水面艦艇支援',
    catAircraft: '航空戰力增援',
    catGroundUnits: '陸戰隊與裝甲部隊',
    catInstallations: '防禦工事與港埠',
    btnPurchase: '徵用調遣',
    btnStampToMap: '建築擺放',
    continuousStamping: '連續蓋建',
    sandboxMode: '無限建造模式',
    costCp: '消耗 CP',

    // Sortie Controls
    btnLaunchSortie: '出擊發進 (LAUNCH)',
    noPlanesReady: '無可用戰機待命中',
    aircraftReady: '架戰備待命',
    formationCount: '出擊編隊架數',
    payloadChoice: '掛載方案',

    // Right Panel / Selection
    selectedUnits: '當前選取單位',
    noSelection: '未選取單位 (點擊或拖曳選取部隊)',
    hullHealth: '裝甲完好度',
    organization: '組織度 (ORG)',
    strength: '建制度 (STR)',
    supplied: '補給通暢',
    unsupplied: '補給中斷',
    urbanCoverActive: '城區掩體 (-70%航彈 -50%直射)',
    banzaiActive: '萬歲衝鋒中',
    surrendered: '已舉白旗投降',
    tabWarships: '水面戰艦',
    tabFlights: '空中機隊',
    tabAllUnits: '全部單位',

    // Modals - Briefing
    briefingTitle: '太平洋艦隊司令部作戰訓令',
    briefingSubtitle: 'CINCPAC OPERATIONAL BRIEFING & DISPATCH',
    situationReport: '當前戰場敵情簡報 (SITREP)',
    primaryObjective: '主要作戰目標',
    secondaryObjective: '次要戰術目標',
    tacticalAdvice: '司令部戰術參謀指引',
    commenceAction: '接受訓令 · 全軍展開作戰',

    // Modals - Air Wing Prep
    prepTitle: '戰前航空隊編制與掛載配置',
    prepCapacity: '機庫容量',
    prepIntro: '依據戰場情報調整航空母艦各機種的編制比例，並指派開戰預發進空優戰巡 (CAP) 與偵察機巡邏。',
    confirmLoadout: '確認配置並出發 (CONFIRM & COMMENCE)',
    preLaunchCap: '開戰自動彈射 2 架戰鬥機執行 CAP 空優警戒',
    preLaunchScout: '開戰自動彈射 1 架偵察機展開前向索敵',

    // Modals - Armament
    armamentTitle: '戰機外掛武裝整備庫',
    armamentSubtitle: 'AIRCRAFT ORDNANCE & PAYLOAD RECONFIGURATION',
    roleFighter: '戰鬥機 (CAP)',
    roleDiveBomber: '俯衝轟炸機 (Dive Bomber)',
    roleTorpedoBomber: '魚雷打擊機 (Torpedo Bomber)',
    roleAttacker: '重攻擊機 (Attacker)',
    roleScout: '偵察機 (Scout)',
    roleAew: '預警機 (AEW)',
    roleRescue: '搜救直升機 (SAR)',
    damage: '戰鬥部傷害',
    speedMod: '航速修正',
    ammo: '攜帶備彈',
    blastRadius: '爆炸半徑',
    purpose: '作戰定位',

    // Modals - Dockyard
    dockyardTitle: '珍珠港海軍造船廠',
    dockyardSubtitle: 'PEARL HARBOR NAVAL SHIPYARD & MODERNIZATION',
    repairFleet: '艦隊損害管制與大修',
    repairFleetDesc: '消耗功勳星徽，徹底修復所有戰艦裝甲並補滿航母機庫戰備飛機。',
    eraSelection: '特遣艦隊時代跨越',
    eraSelectionDesc: '切換太平洋戰爭前期、後期快速航母艦隊或冷戰噴射艦隊編制。',
    upgradesTitle: '艦隊科技與戰術現代化研發',
    upgradeHullArmor: '艦體鋼裝甲強化 (Hull Armor)',
    upgradeAaFirepower: '全艦防空火網延伸 (AA Barrage Range)',
    upgradeRadarRange: '高空搜索雷達強化 (Radar Detection)',
    upgradeCarrierCapacity: '飛行甲板機庫擴建 (Carrier Capacity)',
    upgradeArtilleryDamage: '穿甲主砲彈道火控 (Gunfire Accuracy)',
    upgradeDepthChargeSonar: '主動聲納與反潛深彈 (Sonar & ASW)',

    // Modals - Battle Log
    battleLogTitle: '戰區戰情報告與擊沉紀錄',
    logFilterAll: '全部日誌',
    logFilterCombat: '砲擊與轟炸',
    logFilterAir: '空中交戰',
    logFilterLosses: '損失與擊沉',
    logFilterReprimands: '平民懲戒',
    clearLogs: '清空日誌紀錄',
    casualtiesSummary: '雙方戰損評估 (CASUALTIES REPORT)',
    playerLosses: '我方聯軍損失',
    enemyLosses: '敵軍要塞戰損',

    // Modals - Tactical Map
    tacticalMapTitle: '全戰區戰術情報海圖',
    theaterOverview: '戰區整體態勢',
    zoomIn: '放大 (+)',
    zoomOut: '縮小 (-)',
    resetView: '重設視角',

    // Modals - Game Over
    victoryTitle: '作戰大捷 · 戰區肅清成功',
    defeatTitle: '戰區作戰失利 · 旗艦傾覆沉沒',
    nextSector: '晉級下一作戰分區 (NEXT SECTOR)',
    restartMission: '重新啟動本關作戰 (RETRY SECTOR)',
    totalScoreBreakdown: '戰鬥效益評估與積分結算',
    efficiencyRating: '戰役指揮官考評級別',
  },
  en: {
    // Top Header
    gameTitle: 'TASK FORCE RTS',
    era1: 'Era 1 (1942)',
    era1Tooltip: 'Era 1: Early Pacific War (Coral Sea / Midway / Guadalcanal)',
    era2: 'Era 2 (1944-45)',
    era2Tooltip: 'Era 2: Fast Carrier Task Force (Mariana / Leyte Gulf / Okinawa)',
    era3: 'Era 3 (1950-53)',
    era3Tooltip: 'Era 3: Cold War & Jet Era (7th Fleet / MiG Alley / Hungnam)',
    era4: 'Era 4 (1965-73)',
    era4Tooltip: 'Era 4: Cold War Supersonic & Vietnam War (Gulf of Tonkin / CV-63 Kitty Hawk / Guided Missiles / Heliborne Envelopment)',
    era5: 'Era 5 (1973-91)',
    era5Tooltip: 'Era 5: Cold War Climax & High-Tech Fleet (Nimitz CVN, Aegis CG, CIWS, Harpoon & Granit AShM, Missile Interception)',
    paused: 'PAUSED',
    pause: 'PAUSE (Backspace)',
    speedSlow: '0.5x Slow Motion',
    speedNormal: '1.0x Real-time',
    speedFast: '2.0x Fast Forward',
    btnArmament: 'Ordnance (ARM)',
    btnArmamentTooltip: 'Reconfigure aircraft ordnance (HVAR rockets, AP bombs, napalm, homing torpedoes)',
    btnAirPrep: 'Air Wing',
    btnAirPrepTooltip: 'Reallocate fighter, dive bomber, and torpedo bomber squadrons',
    btnMap: 'Theater Map (M)',
    btnMapTooltip: 'Open large-scale tactical theater map and intelligence overlays',
    btnBriefing: 'Intel Dispatch',
    btnBriefingTooltip: 'Review CINCPAC operational dispatch and tactical advisories',
    btnStampActive: 'Stamping Active',
    btnStampInactive: 'Fortifications (F3)',
    btnStampTooltip: 'Toggle free placement stamp tool for piers, docks, and island forts',
    btnDockyard: 'Shipyard & Refit',
    btnDockyardTooltip: 'Pearl Harbor Naval Shipyard: repairs, technological upgrades, and era transitions',
    btnBattleLog: 'Battle Log (LOG)',
    btnBattleLogTooltip: 'View full combat telemetry, sinking records, and casualty reports',
    airborne: 'AIRBORNE',
    commandPoints: 'Command Points (CP)',
    stars: 'BATTLE STARS',
    score: 'SCORE',
    unmute: 'Unmute Audio',
    mute: 'Mute Audio',

    // Mini-Radar
    miniMapTitle: 'Tactical Mini-Radar',
    miniMapHint: 'Click anywhere on radar to rapidly pan the camera view',
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'W',

    // Bottom Deck Tabs
    tabCarrier: 'Carrier Flight Deck',
    tabAirbase: 'Continental Airbase',
    tabRequisition: 'Requisition & Fortifications',
    tabEngineerConstruction: '🏗️ Combat Engineer Construction',
    tabEngineerConstructionDesc: 'Engineer constructibles: Forward Airfield, Coastal Fort, Pontoon Pier, AA Battery, Battalion CP, Radar',
    tabBattalionCp: '🎖️ Battalion Command Post',
    tabBattalionCpDesc: 'Tactical Requisitions: Ground units assemble beside CP; warships enter from sea border; aircraft to airbase',
    btnOpenBuildMenu: '🏗️ Open Construction Menu',
    reinforceSpawnNote: 'Reinforcement Rules: Ground units deploy at CP; warships arrive from map border; aircraft deploy to airbase',
    quickBuild: 'Quick Build',
    stampBuild: 'Place on Map',
    fleetHelm: 'Flagship Helm & Engine Telegraph',
    speedTelegraph: 'Engine Telegraph (Knots)',
    rudderControls: 'Rudder Control',
    flakBarrage: 'Fleet AA Barrage',
    flakBarrageDesc: 'Order all warships to fire dense coordinated AA flak umbrellas against incoming strikes',

    // Orders
    orderMove: 'Move',
    orderAttack: 'Attack',
    orderPatrol: 'Patrol',
    orderRtb: 'RTB (Return)',
    orderStop: 'Stop (Halt)',
    orderCapOrbit: 'Designate CAP Patrol Sector',
    orderCapOrbitHint: 'Click target coordinates on map to dispatch airborne fighters on orbital combat air patrol',
    cancelCap: 'Cancel CAP Designation',
    orderDropSonobuoy: 'Drop Passive Sonobuoy (G)',
    orderDropSonobuoyHint: 'Click sea coordinates to deploy an air-dropped passive sonobuoy that intermittently pings passing submarines',
    cancelSonobuoy: 'Cancel Sonobuoy Drop',

    // Requisition Categories
    catShips: 'Naval Warships',
    catAircraft: 'Air Wing Reinforcements',
    catGroundUnits: 'Ground Marines & Armor',
    catInstallations: 'Fortifications & Piers',
    btnPurchase: 'Requisition',
    btnStampToMap: 'Place on Map',
    continuousStamping: 'Continuous Stamping',
    sandboxMode: 'Sandbox Mode (Infinite CP)',
    costCp: 'Cost CP',

    // Sortie Controls
    btnLaunchSortie: 'LAUNCH SORTIE',
    noPlanesReady: 'No aircraft ready on deck',
    aircraftReady: 'ready on flight deck',
    formationCount: 'Formation Flight Size',
    payloadChoice: 'Mounted Ordnance',

    // Right Panel / Selection
    selectedUnits: 'Selected Tactical Units',
    noSelection: 'No units selected (click or box drag to select)',
    hullHealth: 'Hull Integrity',
    organization: 'Organization (ORG)',
    strength: 'Strength (STR)',
    supplied: 'Supplied',
    unsupplied: 'Supply Severed',
    urbanCoverActive: 'Urban Cover (-70% Bombs -50% Direct Fire)',
    banzaiActive: 'Banzai Assault Active',
    surrendered: 'Surrendered (POW)',
    tabWarships: 'Warships',
    tabFlights: 'Air Flights',
    tabAllUnits: 'All Units',

    // Modals - Briefing
    briefingTitle: 'CINCPAC Operational Dispatch',
    briefingSubtitle: 'PACIFIC THEATER COMBAT DIRECTIVE',
    situationReport: 'Situation Report (SITREP)',
    primaryObjective: 'Primary Directive',
    secondaryObjective: 'Secondary Objective',
    tacticalAdvice: 'Tactical Staff Recommendations',
    commenceAction: 'Acknowledge & Commence Action',

    // Modals - Air Wing Prep
    prepTitle: 'Pre-Battle Air Wing Squadron & Ordnance Allocation',
    prepCapacity: 'Hangar Capacity',
    prepIntro: 'Allocate squadron ratios based on sector intel and pre-designate initial Combat Air Patrols (CAP) and scout coverage.',
    confirmLoadout: 'CONFIRM LOADOUT & COMMENCE ACTION',
    preLaunchCap: 'Automatically launch 2 fighters on CAP upon battle commencement',
    preLaunchScout: 'Automatically launch 1 scout plane forward upon battle commencement',

    // Modals - Armament
    armamentTitle: 'Aircraft Ordnance & Weapon Matrix',
    armamentSubtitle: 'AIRCRAFT ORDNANCE & PAYLOAD RECONFIGURATION',
    roleFighter: 'Fighter (CAP)',
    roleDiveBomber: 'Dive Bomber',
    roleTorpedoBomber: 'Torpedo Bomber',
    roleAttacker: 'Heavy Attacker',
    roleScout: 'Reconnaissance Scout',
    roleAew: 'Airborne Early Warning (AEW)',
    roleRescue: 'SAR Rescue Helicopter',
    damage: 'Warhead Damage',
    speedMod: 'Airspeed Mod',
    ammo: 'Ammunition',
    blastRadius: 'Blast Radius',
    purpose: 'Tactical Role',

    // Modals - Dockyard
    dockyardTitle: 'Pearl Harbor Naval Shipyard',
    dockyardSubtitle: 'PEARL HARBOR NAVAL SHIPYARD & MODERNIZATION',
    repairFleet: 'Fleet Overhaul & Damage Control',
    repairFleetDesc: 'Expend battle stars to repair all warship hulls to 100% and replenish carrier flight deck air wings.',
    eraSelection: 'Task Force Era Transition',
    eraSelectionDesc: 'Switch between early war, fast carrier task force, or Cold War jet strike groups.',
    upgradesTitle: 'Fleet Technology & Tactical Modernization',
    upgradeHullArmor: 'Reinforced Hull Armor Plates',
    upgradeAaFirepower: 'Extended AA Flak Umbrella Range',
    upgradeRadarRange: 'High-Altitude Search Radar Sensitivity',
    upgradeCarrierCapacity: 'Expanded Flight Deck & Hangar Capacity',
    upgradeArtilleryDamage: 'Armor-Piercing Ballistic Fire Control',
    upgradeDepthChargeSonar: 'Active Sonar Arrays & ASW Depth Charges',

    // Modals - Battle Log
    battleLogTitle: 'Theater Tactical Battle Log & Telemetry',
    logFilterAll: 'All Logs',
    logFilterCombat: 'Gunfire & Bombing',
    logFilterAir: 'Dogfights & Air Combat',
    logFilterLosses: 'Sunk & Casualties',
    logFilterReprimands: 'Civilian Penalties',
    clearLogs: 'Clear Log History',
    casualtiesSummary: 'Casualties Assessment Report',
    playerLosses: 'Allied Task Force Losses',
    enemyLosses: 'Enemy Fort & Fleet Casualties',

    // Modals - Tactical Map
    tacticalMapTitle: 'Full Theater Tactical Marine Chart',
    theaterOverview: 'Theater Strategic Situation',
    zoomIn: 'Zoom In (+)',
    zoomOut: 'Zoom Out (-)',
    resetView: 'Reset View',

    // Modals - Game Over
    victoryTitle: 'DECISIVE VICTORY · SECTOR CLEARED',
    defeatTitle: 'MISSION FAILED · TASK FORCE LOST',
    nextSector: 'PROCEED TO NEXT SECTOR',
    restartMission: 'RETRY SECTOR',
    totalScoreBreakdown: 'Operational Efficiency & Battle Score',
    efficiencyRating: 'Command Efficiency Rating',
  },
};

export function getTranslation(lang: Language): TranslationDictionary {
  return translations[lang] || translations.zh;
}
