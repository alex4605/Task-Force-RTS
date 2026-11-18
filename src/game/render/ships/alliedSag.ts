import { Ship } from '../../../types/game';
import { RenderContext } from '../context';
import { drawNavalEnsign, drawShipTurrets } from './index';

// 專屬盟軍艦艇外觀分流分發器
export function drawAlliedSAGShip(rc: RenderContext, ship: Ship, hullColor: string, _detailColor: string) {
  const name = ship.name || '';
  const l = ship.length;
  const w = ship.width;
  const ctx = rc.ctx;

  // 1. 日本海上自衛隊 (JMSDF SAG)
  if (name.includes('JDS ') || ship.alliedSAGName?.includes('海上自衛隊')) {
    const isDDH = name.includes('Haruna') || name.includes('Shirane') || name.includes('DDH');

    // JMSDF 海自暗灰塗裝
    const jmsdfDeck = '#455A64';
    const jmsdfDetail = '#80CBC4';

    ctx.fillStyle = '#1A2630';
    ctx.strokeStyle = jmsdfDetail;
    ctx.lineWidth = 2.0;

    // 現代護衛艦船型
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.38, -w * 0.46);
    ctx.lineTo(-l * 0.44, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.35);
    ctx.lineTo(-l * 0.50, w * 0.35);
    ctx.lineTo(-l * 0.44, w * 0.46);
    ctx.lineTo(l * 0.38, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isDDH) {
      // ═══ 榛名型 / 白根型 直升機護衛艦 (DDH) 專屬特徵 ═══
      // 前部階梯雙座 5吋砲甲板
      ctx.fillStyle = jmsdfDeck;
      ctx.fillRect(l * 0.16, -w * 0.32, l * 0.18, w * 0.64);

      // Mk 112 八聯裝 ASROC 椒鹽盒發射箱
      ctx.fillStyle = '#37474F';
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1.0;
      ctx.fillRect(l * 0.08, -w * 0.22, l * 0.08, w * 0.44);
      ctx.strokeRect(l * 0.08, -w * 0.22, l * 0.08, w * 0.44);

      // 中央整合式 Mack (Mast + Stack 艦橋煙囪複合結構)
      ctx.fillStyle = '#212D38';
      ctx.fillRect(-l * 0.08, -w * 0.26, l * 0.14, w * 0.52);
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(-l * 0.08, -w * 0.26, l * 0.14, w * 0.52);

      // 後部巨型 3機直升機雙機庫 (Double Helicopter Hangar)
      ctx.fillStyle = '#1E2B37';
      ctx.fillRect(-l * 0.30, -w * 0.38, l * 0.20, w * 0.76);
      ctx.strokeStyle = jmsdfDetail;
      ctx.strokeRect(-l * 0.30, -w * 0.38, l * 0.20, w * 0.76);

      // 機庫頂部 Mk 29 海麻雀發射器
      ctx.fillStyle = '#455A64';
      ctx.fillRect(-l * 0.22, -w * 0.14, l * 0.06, w * 0.28);

      // 後甲板大型起降飛行甲板與直升機著艦 "H" 標線
      ctx.fillStyle = '#263238';
      ctx.fillRect(-l * 0.48, -w * 0.38, l * 0.18, w * 0.76);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-l * 0.48, -w * 0.38, l * 0.18, w * 0.76);

      // 白色著艦圓環與 "H"
      ctx.beginPath();
      ctx.arc(-l * 0.39, 0, w * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', -l * 0.39, 0);

    } else {
      // ═══ 朝霧型 / 初雪型 / 高月型 護衛艦 (DD/FFG) ═══
      // 艦首砲位與 ASROC 區
      ctx.fillStyle = jmsdfDeck;
      ctx.fillRect(l * 0.18, -w * 0.26, l * 0.15, w * 0.52);

      // 緊湊現代艦橋與方陣 CIWS 耳台
      ctx.fillStyle = '#212D38';
      ctx.fillRect(-l * 0.04, -w * 0.30, l * 0.16, w * 0.60);
      ctx.strokeStyle = jmsdfDetail;
      ctx.strokeRect(-l * 0.04, -w * 0.30, l * 0.16, w * 0.60);

      // CIWS sponsons (白色方陣密集陣)
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(l * 0.02, -w * 0.34, 2.8, 0, Math.PI * 2);
      ctx.arc(l * 0.02, w * 0.34, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 艦舯魚叉發射架
      ctx.fillStyle = '#455A64';
      ctx.fillRect(-l * 0.14, -w * 0.22, l * 0.07, w * 0.44);

      // 艦尾海麻雀與 SH-60J 機庫甲板
      ctx.fillStyle = '#263238';
      ctx.fillRect(-l * 0.42, -w * 0.32, l * 0.24, w * 0.64);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.strokeRect(-l * 0.42, -w * 0.32, l * 0.24, w * 0.64);
      ctx.beginPath();
      ctx.arc(-l * 0.30, 0, w * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 艦尾動態揮舞：日本海上自衛隊十六條旭日旗
    drawNavalEnsign(rc, 'rising_sun', -l * 0.48, 0, 13, 8.5);

  } else if (name.includes('Bremen') || name.includes('FGS ')) {
    // 2. 德國布萊梅級巡防艦 (FGS Bremen F207)
    const deDetail = '#FFD54F';

    ctx.fillStyle = '#1A252E';
    ctx.strokeStyle = deDetail;
    ctx.lineWidth = 1.9;

    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.36, -w * 0.46);
    ctx.lineTo(-l * 0.44, -w * 0.46);
    ctx.lineTo(-l * 0.50, 0);
    ctx.lineTo(-l * 0.44, w * 0.46);
    ctx.lineTo(l * 0.36, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 前甲板 8聯裝 NATO 海麻雀
    ctx.fillStyle = '#37474F';
    ctx.fillRect(l * 0.14, -w * 0.22, l * 0.08, w * 0.44);

    // 緊湊現代德式上層建築
    ctx.fillStyle = '#263238';
    ctx.fillRect(-l * 0.06, -w * 0.28, l * 0.16, w * 0.56);
    ctx.strokeStyle = '#90A4AE';
    ctx.strokeRect(-l * 0.06, -w * 0.28, l * 0.16, w * 0.56);

    // 艦尾飛行甲板
    ctx.fillStyle = '#212D38';
    ctx.fillRect(-l * 0.44, -w * 0.32, l * 0.22, w * 0.64);

    // 艦尾動態：德國聯邦海軍旗
    drawNavalEnsign(rc, 'de_bundesmarine', -l * 0.47, 0, 13, 8.5);

  } else if (name.includes('Tourville') || name.includes('FS ')) {
    // 3. 法國杜爾維爾級導向飛彈驅逐艦 (FS Tourville D610)
    const frDetail = '#64B5F6';
    ctx.fillStyle = '#1E2B37';
    ctx.strokeStyle = frDetail;
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.36, -w * 0.45);
    ctx.lineTo(-l * 0.45, -w * 0.45);
    ctx.lineTo(-l * 0.50, 0);
    ctx.lineTo(-l * 0.45, w * 0.45);
    ctx.lineTo(l * 0.36, w * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 法式高聳傾斜主桅杆與雷達罩
    ctx.fillStyle = '#2A3C4D';
    ctx.fillRect(-l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.arc(l * 0.05, 0, 4.0, 0, Math.PI * 2);
    ctx.fill();

    // 艦舯 Malafon 重型反潛飛彈箱
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-l * 0.18, -w * 0.20, l * 0.10, w * 0.40);

    // 艦尾響尾蛇 (Crotale) 防空飛彈發射架
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(-l * 0.34, -w * 0.16, l * 0.08, w * 0.32);

    // 艦尾動態：法國海軍三色旗
    drawNavalEnsign(rc, 'fr_marine', -l * 0.48, 0, 13, 8.5);

  } else {
    // 4. 英國皇家海軍 (Royal Navy SAG: KGV / Duke of York / Sheffield / Belfast / Type 42 / Jervis)
    const isRNBB = name.includes('George') || name.includes('York') || ship.type === 'battleship';
    const isRNDDG = name.includes('Type 42') || name.includes('42型') || name.includes('Gloucester') || (name.includes('Sheffield') && name.includes('D80'));
    const isRNCruiser = name.includes('Belfast') || (name.includes('Sheffield') && !isRNDDG);

    // 英國海軍部海軍灰 (Admiralty Dark Sea Grey)
    ctx.fillStyle = isRNBB ? '#1E2B37' : '#192633';
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 2.0;

    // 艦體線條
    ctx.beginPath();
    ctx.moveTo(l * 0.52, 0);
    ctx.lineTo(l * 0.36, -w * 0.46);
    ctx.lineTo(-l * 0.42, -w * 0.46);
    ctx.lineTo(-l * 0.50, -w * 0.30);
    ctx.lineTo(-l * 0.50, w * 0.30);
    ctx.lineTo(-l * 0.42, w * 0.46);
    ctx.lineTo(l * 0.36, w * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isRNBB) {
      // ═══ 喬治五世級戰艦 (KGV / Duke of York) 城堡艦橋與 14吋砲座 ═══
      // 城堡型裝甲艦橋 (Citadel Tower)
      ctx.fillStyle = '#263849';
      ctx.fillRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);
      ctx.strokeStyle = '#B0BEC5';
      ctx.strokeRect(l * 0.02, -w * 0.28, l * 0.16, w * 0.56);

      // 觀察窗光澤 (Cyan Bridge Windows)
      ctx.fillStyle = '#80DEEA';
      ctx.fillRect(l * 0.14, -w * 0.20, 2.5, w * 0.40);

      // 雙煙囪帶防雨排氣帽
      ctx.fillStyle = '#1A2530';
      ctx.beginPath();
      ctx.ellipse(-l * 0.04, 0, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(-l * 0.14, 0, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 艦舯水上飛機彈射甲板
      ctx.fillStyle = '#37474F';
      ctx.fillRect(-l * 0.22, -w * 0.34, l * 0.07, w * 0.68);

      // 5.25吋兩用副砲耳台 (左右各四座)
      ctx.fillStyle = '#455A64';
      for (let s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.arc(l * 0.08, s * w * 0.38, 3.5, 0, Math.PI * 2);
        ctx.arc(-l * 0.08, s * w * 0.38, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (isRNDDG) {
      // ═══ 42型 導向飛彈驅逐艦 (Type 42 Sheffield / Gloucester) ═══
      // 艦首海鏢雙臂發射架底座 (Twin Sea Dart Launcher)
      ctx.fillStyle = '#37474F';
      ctx.fillRect(l * 0.18, -w * 0.20, l * 0.08, w * 0.40);
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(l * 0.18, -w * 0.20, l * 0.08, w * 0.40);

      // 艦橋前 Type 909 白色球型射控天線罩
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(l * 0.14, 0, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // 緊湊艦橋與 Type 965 雷達大桅
      ctx.fillStyle = '#263849';
      ctx.fillRect(-l * 0.04, -w * 0.26, l * 0.15, w * 0.52);
      ctx.strokeStyle = '#B0BEC5';
      ctx.strokeRect(-l * 0.04, -w * 0.26, l * 0.15, w * 0.52);

      // 艦橋後 Type 909 第二座球型天線罩
      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.arc(-l * 0.12, 0, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // 山貓直升機飛行甲板
      ctx.fillStyle = '#1E2C38';
      ctx.fillRect(-l * 0.44, -w * 0.34, l * 0.22, w * 0.68);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.strokeRect(-l * 0.44, -w * 0.34, l * 0.22, w * 0.68);

    } else if (isRNCruiser) {
      // ═══ 謝菲爾德 / 貝爾法斯特 輕巡洋艦 ═══
      // 箱型上層艦橋
      ctx.fillStyle = '#263849';
      ctx.fillRect(l * 0.05, -w * 0.26, l * 0.15, w * 0.52);
      ctx.strokeStyle = '#80DEEA';
      ctx.strokeRect(l * 0.05, -w * 0.26, l * 0.15, w * 0.52);

      // 雙傾斜煙囪
      ctx.fillStyle = '#1A2530';
      ctx.beginPath();
      ctx.ellipse(-l * 0.05, 0, 4.5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(-l * 0.16, 0, 4.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ═══ 皇家海軍驅逐艦 (Jervis / Cossack / Defender) ═══
      ctx.fillStyle = '#263849';
      ctx.fillRect(l * 0.06, -w * 0.24, l * 0.14, w * 0.48);
      ctx.fillStyle = '#1A2530';
      ctx.beginPath();
      ctx.ellipse(-l * 0.06, 0, 4.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 艦尾動態：英國皇家海軍白船旗 (White Ensign)
    drawNavalEnsign(rc, 'white_ensign', -l * 0.48, 0, 13, 8.5);
  }

  drawShipTurrets(rc, ship, hullColor);
}
