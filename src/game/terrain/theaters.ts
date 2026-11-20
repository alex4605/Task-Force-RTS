import { Era, Island, MountainRidge, Vector2D } from '../../types/game';

/**
 * Mainland geography of each Cold War theatre, authored over the shared continental frame
 * (land from the west coast at x≈5000 to the east edge, y 0-14000; sea to the west). The
 * coastline and the installation layout are common to eras 3-5; these templates give each
 * theatre its own land: mountains, rivers and lakes, land-form zones, roads and railways.
 * TerrainMap turns them into terrain (organic edges, meanders, land use).
 *
 *  era 3  Korea, east coast 1950-53: Kaema plateau and Chosin Reservoir, the Taebaek range,
 *         narrow coastal plain with the coastal road and railway, Sobaek range, Naktong basin.
 *  era 4  North Vietnam / Tonkin 1965-73: Red River delta with its distributaries, Ha Long and
 *         Ninh Binh karst, the Annamite (Truong Son) range and the Ho Chi Minh trail, Route 1.
 *  era 5  North German Plain / Schleswig-Holstein 1983-91: Elbe estuary, Weser and Aller, the
 *         Kiel Canal, Holstein lakes, Lüneburg Heath, the Harz, Wadden flats, autobahns.
 */

/** "x,y x,y ..." → points. */
const P = (s: string): Vector2D[] =>
  s
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });

const ridge = (id: string, width: number, height: number, spine: string, peaks: [string, number, string][] = []): MountainRidge => ({
  id,
  width,
  height,
  spine: P(spine),
  peaks: peaks.map(([pos, elevation, label]) => ({ pos: P(pos)[0], elevation, label })),
});

function korea(m: Island): void {
  m.mountainRidges = [
    ridge('kaema', 520, 2100, '13700,300 12600,700 11400,1100 10200,1300 9000,1000', [
      ['12600,700', 2100, '蓋馬高原 赴戰嶺 [Pujon Pass 2100m]'],
      ['10200,1300', 1720, '狼林山脈 [Nangnim Range 1720m]'],
    ]),
    ridge('taebaek', 560, 1700, '10000,2600 10500,3900 11100,5300 11700,6900 12000,8300 11800,9600', [
      ['10500,3900', 1638, '金剛山 [Kumgang-san 1638m]'],
      ['11700,6900', 1708, '雪嶽山 [Sorak-san 1708m]'],
      ['12000,8300', 1567, '太白山 [Taebaek-san 1567m]'],
    ]),
    ridge('sobaek', 420, 1915, '11900,9000 11000,9900 10200,10900 9700,12000', [
      ['10200,10900', 1915, '智異山 [Jiri-san 1915m]'],
      ['11000,9900', 1440, '小白山 [Sobaek-san 1440m]'],
    ]),
    ridge('masik', 260, 1030, '7900,6800 8300,7400 8000,8200', [['8300,7400', 1030, '馬息嶺 [Masik Pass 1030m]']]),
  ];
  m.terrainZones = [
    // The Kaema plateau: a high, cold tableland north of the Chosin and Pujon reservoirs
    { kind: 'plateau', points: P('9400,200 13900,100 13900,2600 12600,3000 11000,2800 9600,2300') },
    // Hamhung and Wonsan coastal plains: low and flat between the mountains and the sea
    { kind: 'delta', points: P('5100,4300 7400,4000 8600,4600 7600,5600 6400,6000 5100,5600') },
  ];
  m.lakes = [
    { id: 'chosin', name: '長津湖 Chosin Reservoir', points: P('11700,1100 12050,1050 12250,1400 12200,1900 12050,2250 11850,2380 11650,2100 11780,1700 11600,1400') },
    { id: 'pujon', name: '赴戰湖', points: P('12900,1100 13200,1050 13350,1350 13200,1700 12950,1600 12850,1350') },
    { id: 'hwachon', name: '華川湖', points: P('10900,6100 11300,6000 11450,6250 11200,6500 10950,6450 11050,6300') },
  ];
  m.rivers = [
    { width: 22, name: '城川江', points: P('11750,2380 11000,2700 10000,2300 9000,2100 7600,2300 6200,2300 5020,2400') },
    { width: 12, points: P('12700,3600 11800,3300 10900,3100 10000,2300') },
    { width: 20, name: '南大川', points: P('11800,5000 10800,5500 9600,5800 8600,6100 7400,6300 5050,6400') },
    { width: 12, points: P('10900,6450 10200,6600 9600,6200 9600,5800') },
    { width: 26, name: '洛東江 Naktong', points: P('12100,9200 10900,9500 9900,10100 8900,10600 8500,11400 8800,12300 8000,13100 6600,13400 5200,13500') },
    { width: 14, points: P('11300,11600 10300,11700 9400,11900 8800,12300') },
    { width: 12, name: '臨津江', points: P('10600,7600 9600,8100 8400,8600 7000,8900 5300,9100') },
  ];
  m.roads = [
    // Coastal road and the east-coast railway (Wonsan–Hamhung–Hungnam)
    { type: 'road', points: P('5500,500 5700,2500 6000,4600 6400,6000 6700,7400 6500,9400 6200,11400 6000,13800') },
    { type: 'rail', points: P('5650,500 5850,2500 6150,4500 6550,5900 6850,7400 6650,9400 6350,11400 6150,13800') },
    // Main supply route inland (Wonsan – Kowon – Hamhung – Chosin)
    { type: 'road', points: P('6800,6400 7900,5500 8600,5200 9200,4500 9800,3300 10600,2900 11400,3000 11800,2950') },
    // Central corridor south
    { type: 'road', points: P('7900,5500 7900,7000 8200,9200 7900,10800 7800,11400 7200,13200') },
    { type: 'trail', points: P('11400,3000 12400,4400 12600,6000 12300,7800 11800,9200') },
    { type: 'trail', points: P('9200,4500 10200,5200 10800,6200 11000,7600') },
    { type: 'trail', points: P('7900,10800 8800,11600 9600,12300 8800,12600') },
  ];
  m.hills = [
    { x: 11200, y: 1600, radius: 115 }, { x: 9600, y: 2600, radius: 100 }, { x: 10800, y: 3100, radius: 125 },
    { x: 9800, y: 4200, radius: 95 }, { x: 8900, y: 5200, radius: 85 }, { x: 10400, y: 4900, radius: 105 },
    { x: 7400, y: 7000, radius: 90 }, { x: 8200, y: 6200, radius: 80 }, { x: 9400, y: 8200, radius: 90 },
    { x: 8600, y: 9900, radius: 95 }, { x: 9800, y: 11200, radius: 110 }, { x: 8800, y: 12600, radius: 100 },
  ];
  m.forestBelts = [];
  m.jungles = [];
}

function tonkin(m: Island): void {
  m.mountainRidges = [
    ridge('viet-bac', 480, 1540, '13800,500 12600,900 11400,1500 10500,2000', [
      ['12600,900', 1540, '諒山北部邊境主峰 [Lang Son Border Peak 1540m]'],
    ]),
    ridge('truong-son', 620, 1600, '13300,2600 12900,4400 12700,6300 12500,8200 12000,10000 11300,11800 10500,13400', [
      ['12900,4400', 1600, '長山山脈北段 [Truong Son North 1600m]'],
      ['12500,8200', 1250, '初邦山 [Chu Pong Massif 1250m]'],
      ['11300,11800', 980, '波萊古高原隘口 [Pleiku Pass 980m]'],
    ]),
    ridge('khe-sanh', 320, 937, '8600,5600 9300,6300 10100,7200 10900,7900', [
      ['8600,5600', 881, '溪山881南峰 [Hill 881 South]'],
      ['9300,6300', 937, '漢堡高地 [Hamburger Hill 937m]'],
      ['10100,7200', 875, '875高地 [Hill 875]'],
    ]),
    ridge('son-tra', 170, 693, '5300,9100 5600,8850 5850,8700', [['5600,8850', 693, '山茶半島猴山 [Son Tra Peak 693m]']]),
  ];
  m.terrainZones = [
    // Red River delta: dead-flat paddy country criss-crossed by dykes and distributaries
    { kind: 'delta', points: P('5050,2700 6600,2500 8400,3200 9000,4200 8400,5300 7200,6000 5100,6200') },
    // Ha Long Bay / Cam Pha karst behind the north coast
    { kind: 'karst', points: P('5100,300 7600,300 8600,1100 8200,2000 6600,2300 5100,2300') },
    // Ninh Binh "Ha Long on land": towers rising from the southern edge of the delta
    { kind: 'karst', points: P('7300,6300 8600,6200 9200,6900 8600,7500 7500,7300') },
    // Ca River (Vinh) coastal flats and mangrove fringe
    { kind: 'delta', points: P('5100,11600 6700,11800 7400,12900 6600,13900 5100,13900') },
  ];
  m.lakes = [{ id: 'ba-be', name: '巴貝湖', points: P('11300,2300 11600,2250 11750,2500 11500,2700 11300,2600') }];
  m.rivers = [
    { width: 30, name: '紅河 Song Hong', points: P('13600,1300 12200,1900 10800,2600 9500,3200 8400,3700 7600,4100 6800,4400 6000,4500 5040,4600') },
    { width: 18, name: '太平江', points: P('7600,4100 6900,3600 6100,3200 5040,3000') },
    { width: 16, name: '底江', points: P('7000,4350 6600,5100 6000,5700 5060,6000') },
    { width: 20, name: '沱江 Song Da', points: P('13400,4400 12000,4500 10800,4200 9900,3700 9500,3200') },
    { width: 22, name: '馬江 Song Ma', points: P('13000,5800 11400,6300 10000,6900 8800,7300 7600,7100 6500,6800 5080,6850') },
    { width: 24, name: '藍江 Song Ca', points: P('13200,9600 11800,10300 10400,11100 9000,11900 7800,12600 6600,13100 5150,13500') },
    { width: 14, points: P('11000,12800 9800,12500 9000,11900') },
    { width: 12, name: '濱海河 (DMZ)', points: P('12000,10000 10600,9800 9000,9600 7400,9500 5200,9400') },
  ];
  m.roads = [
    // Route 1 and the Hanoi–Saigon railway down the coast
    { type: 'road', points: P('5400,400 5900,2400 6300,4300 6800,6400 7300,7800 7700,9800 7600,11600 7200,13600') },
    { type: 'rail', points: P('5550,400 6050,2400 6450,4300 6950,6400 7450,7800 7850,9800 7750,11600 7350,13600') },
    // Hanoi – Haiphong highway (Route 5) and the Route 6 / 7 mountain roads
    { type: 'road', points: P('8400,3700 7400,4000 6400,4100 5300,4000') },
    { type: 'road', points: P('6800,6400 7900,5500 9200,4500 10600,3800 11800,3400') },
    // Ho Chi Minh trail: braided tracks along the Truong Son
    { type: 'trail', points: P('11800,3400 12200,5000 11900,6800 12000,8600 11500,10400 10900,12200') },
    { type: 'trail', points: P('12200,5000 12900,6600 12800,8200 12300,9600') },
    { type: 'trail', points: P('11900,6800 10900,7600 10100,8800 9200,9600') },
  ];
  m.hills = [
    { x: 7800, y: 3700, radius: 95 }, { x: 9800, y: 4200, radius: 95 }, { x: 8900, y: 5200, radius: 85 },
    { x: 10400, y: 4900, radius: 105 }, { x: 7400, y: 7000, radius: 90 }, { x: 8200, y: 6200, radius: 80 },
    { x: 9400, y: 8400, radius: 95 }, { x: 10600, y: 10400, radius: 110 }, { x: 9600, y: 12200, radius: 100 },
  ];
  // Triple-canopy rainforest over the Truong Son and the karst
  m.forestBelts = [
    { id: 'truong-son-canopy', density: 0.96, biome: 'rainforest', points: P('11600,2400 13900,2200 13900,13900 9800,13900 10400,12400 11200,10600 11700,8400 11700,6200 11800,4200') },
  ];
  m.jungles = [];
}

function northGermanPlain(m: Island): void {
  // No mountains: the Harz is the only real relief, and the rest is gentle moraine
  m.mountainRidges = [
    ridge('harz', 700, 1141, '12300,12300 13100,12700 13800,13300', [['13100,12700', 1141, '布羅肯峰 (哈茨山) [Brocken 1141m]']]),
  ];
  m.terrainZones = [
    { kind: 'upland', points: P('11700,11600 13900,11400 13900,13900 11600,13900') }, // Harz foreland
    { kind: 'heath', points: P('9600,9700 11800,9600 12600,10400 12200,11500 10200,11700 9400,10800') }, // Lüneburger Heide
    { kind: 'tidal_flat', points: P('5020,0 5900,0 5900,1500 5600,2600 5020,3000') }, // Wadden Sea flats (Dithmarschen)
    { kind: 'tidal_flat', points: P('5020,8900 5800,9000 6100,9700 5600,10300 5020,10300') }, // Elbe estuary marsh
    // Managed pine plantations: straight-edged blocks (Sachsenwald, Göhrde, Segeberger Forst)
    { kind: 'plantation', points: P('8600,7600 9500,7500 9600,8300 8700,8400') },
    { kind: 'plantation', points: P('12500,9300 13400,9250 13450,9900 12550,9950') },
    { kind: 'plantation', points: P('10400,3200 11300,3100 11400,3900 10500,4000') },
    { kind: 'plantation', points: P('7000,10600 7800,10500 7900,11200 7100,11300') },
  ];
  m.lakes = [
    { id: 'ploen', name: '大普倫湖 Großer Plöner See', points: P('12800,2700 13300,2650 13450,3000 13200,3350 12850,3250 12700,3000') },
    { id: 'ratzeburg', name: '拉策堡湖', points: P('13200,4800 13400,4750 13500,5300 13300,5600 13150,5200') },
    { id: 'steinhude', name: '斯坦胡德湖 Steinhuder Meer', points: P('11200,12900 11700,12800 11900,13100 11500,13350 11150,13200') },
  ];
  m.rivers = [
    { width: 20, name: '基爾運河 Nord-Ostsee-Kanal', straight: true, points: P('5020,2300 6400,2350 8000,2200 9600,2000 11200,1700 12600,1300 13900,1100') },
    { width: 46, name: '易北河 Elbe', points: P('13900,8100 12600,8400 11400,8800 10200,8950 9000,8800 7800,9100 6800,9400 6000,9600 5020,9700') },
    { width: 14, name: '施托爾河', points: P('9000,5200 8600,6300 7900,7300 7700,8200 7800,9100') },
    { width: 32, name: '威悉河 Weser', points: P('12600,13900 11400,13000 10200,12600 9000,12700 7800,12900 6400,13200 5150,13300') },
    { width: 18, name: '阿勒爾河 Aller', points: P('13700,10200 12600,10900 11400,11600 10200,12600') },
    { width: 14, name: '艾德河 Eider', points: P('10600,4400 9200,4600 7800,4500 6400,4300 5040,4300') },
    { width: 10, points: P('12800,6200 11800,6800 11200,7600 11400,8600') },
  ];
  m.roads = [
    // Autobahns: A7 (Flensburg–Hamburg–Hannover), A1 (Lübeck–Hamburg–Bremen), A2 (Hannover–Berlin)
    { type: 'highway', points: P('10900,0 10700,2800 10400,5600 10100,8700 9900,11000 10200,13900') },
    { type: 'highway', points: P('13900,3600 12200,5400 10400,7600 9200,9400 7800,11200 6400,13900') },
    { type: 'highway', points: P('5300,12500 7600,12200 9900,12000 12000,12300 13900,12100') },
    // Main railways and federal roads
    { type: 'rail', points: P('10700,0 10500,2800 10200,5600 9900,8700 9700,11000 10000,13900') },
    { type: 'rail', points: P('5400,6200 7400,6100 9400,6000 11600,5800 13900,5500') },
    { type: 'road', points: P('5300,2400 6200,4800 6800,6400 7400,7800 8200,9800 8600,11600 8200,13400') },
    { type: 'road', points: P('6800,6400 7900,5500 9200,4500 10600,3800 11800,3400') },
    { type: 'road', points: P('7400,7800 9000,7600 10400,7600 12000,7200 13800,7000') },
    { type: 'road', points: P('8200,9800 9800,10000 11000,10800 12400,11200') },
  ];
  m.hills = [{ x: 9800, y: 4200, radius: 95 }, { x: 10400, y: 4900, radius: 105 }, { x: 8900, y: 5200, radius: 85 }];
  m.forestBelts = [];
  m.jungles = [];
}

/** Applies the era's mainland template (eras 3-5). */
export function applyMainlandTemplate(era: Era, mainland: Island): void {
  if (era === 'era3') korea(mainland);
  else if (era === 'era4') tonkin(mainland);
  else if (era === 'era5') northGermanPlain(mainland);
}
