/**
 * 위경도 → 기상청 단기예보 격자(nx, ny) 변환.
 *
 * 기상청 단기예보 API는 위경도를 받지 않는다. 자체 Lambert Conformal Conic
 * 5km 격자 좌표만 받는다. 아래 상수는 기상청이 공표한 값이다.
 *
 * 검증 기준점: 서울 종로구 (37.5714, 126.9779) → nx=60, ny=127
 */

const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 표준위도 1
const SLAT2 = 60.0; // 표준위도 2
const OLON = 126.0; // 기준점 경도
const OLAT = 38.0; // 기준점 위도
const XO = 43; // 기준점 X좌표
const YO = 136; // 기준점 Y좌표

const DEGRAD = Math.PI / 180.0;

export interface Grid {
  nx: number;
  ny: number;
}

export function toGrid(lat: number, lon: number): Grid {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/**
 * 단기예보 발표 시각. 하루 8회(02·05·08·11·14·17·20·23시)이고
 * 발표 후 약 10분 뒤부터 조회된다. 여유를 두고 15분으로 잡는다.
 *
 * 자정 직후(00:00~02:14)에는 전날 23시 발표를 써야 하므로 날짜도 함께 돌려준다.
 */
export function latestBaseTime(now: Date): { baseDate: string; baseTime: string } {
  const HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
  const d = new Date(now.getTime());
  const minutes = d.getHours() * 60 + d.getMinutes();

  let picked = -1;
  for (const h of HOURS) {
    if (minutes >= h * 60 + 15) picked = h;
  }

  if (picked === -1) {
    // 아직 오늘 02:15 전 — 전날 23시 발표를 쓴다
    d.setDate(d.getDate() - 1);
    picked = 23;
  }

  const p = (n: number) => String(n).padStart(2, '0');
  return {
    baseDate: `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`,
    baseTime: `${p(picked)}00`,
  };
}
