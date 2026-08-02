/**
 * 일출·일몰 시각 계산 (NOAA Solar Calculator 알고리즘).
 *
 * 외부 API를 쓰지 않는다. 위도·경도와 날짜만으로 계산한다.
 * 대기 굴절을 반영해 태양 고도 -0.833도를 일몰 기준으로 삼는 표준 방식이다.
 *
 * 정확도: 한국 위도대에서 공표값과 1~2분 이내로 맞는다.
 * 산 위에서는 지형에 가려 실제 체감 일몰이 더 이르다 — 화면에서 이 점을 밝힌다.
 */

const RAD = Math.PI / 180;

/** 그레고리력 → 율리우스일 (로컬 정오 기준으로 계산해 날짜 경계 흔들림을 없앤다) */
function julianDay(y: number, m: number, d: number): number {
  let yy = y;
  let mm = m;
  if (mm <= 2) {
    yy -= 1;
    mm += 12;
  }
  const a = Math.floor(yy / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + b - 1524.5;
}

interface SolarPos {
  /** 적위(도) */
  declination: number;
  /** 균시차(분) */
  equationOfTime: number;
}

function solarPosition(jd: number): SolarPos {
  const t = (jd - 2451545) / 36525; // 율리우스 세기

  const meanLong = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const meanAnom = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccent = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const center =
    Math.sin(meanAnom * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnom * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnom * RAD) * 0.000289;

  const trueLong = meanLong + center;
  const omega = 125.04 - 1934.136 * t;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const meanObliq = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD);

  const declination =
    Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD)) / RAD;

  const varY = Math.tan((obliq / 2) * RAD) ** 2;
  const eqTime =
    4 *
    (varY * Math.sin(2 * meanLong * RAD) -
      2 * eccent * Math.sin(meanAnom * RAD) +
      4 * eccent * varY * Math.sin(meanAnom * RAD) * Math.cos(2 * meanLong * RAD) -
      0.5 * varY * varY * Math.sin(4 * meanLong * RAD) -
      1.25 * eccent * eccent * Math.sin(2 * meanAnom * RAD)) /
    RAD;

  return { declination, equationOfTime: eqTime };
}

/**
 * 일몰 시각을 그날 자정 기준 분으로 반환. 백야·극야면 null.
 * tzOffsetHours는 한국이 +9.
 */
export function sunsetMinutes(
  date: Date,
  lat: number,
  lon: number,
  tzOffsetHours = 9
): number | null {
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { declination, equationOfTime } = solarPosition(jd);

  // 대기 굴절과 태양 반경을 반영한 표준 일몰 고도
  const zenith = 90.833;
  const cosH =
    (Math.cos(zenith * RAD) - Math.sin(lat * RAD) * Math.sin(declination * RAD)) /
    (Math.cos(lat * RAD) * Math.cos(declination * RAD));
  if (cosH > 1 || cosH < -1) return null; // 해가 뜨지 않거나 지지 않는 날

  const hourAngle = Math.acos(cosH) / RAD;
  // 태양 남중 시각(분) = 720 − 4×경도 − 균시차, 여기에 시간대 보정
  const solarNoon = 720 - 4 * lon - equationOfTime + tzOffsetHours * 60;
  return solarNoon + 4 * hourAngle;
}

export function sunriseMinutes(
  date: Date,
  lat: number,
  lon: number,
  tzOffsetHours = 9
): number | null {
  const set = sunsetMinutes(date, lat, lon, tzOffsetHours);
  if (set === null) return null;
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { equationOfTime } = solarPosition(jd);
  const solarNoon = 720 - 4 * lon - equationOfTime + tzOffsetHours * 60;
  return solarNoon - (set - solarNoon);
}

/** 분 → "18:35" */
export function fmtClock(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60) % 24;
  const mm = ((m % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * 지역별 대표 좌표 — 코스 데이터에 좌표가 없어서 지역 단위로 근사한다.
 * 한국은 경도 폭이 좁아 지역 간 일몰 차이가 최대 20분대다.
 */
export const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  서울: { lat: 37.57, lon: 126.98 },
  경기: { lat: 37.4, lon: 127.0 },
  인천: { lat: 37.46, lon: 126.71 },
  강원: { lat: 37.8, lon: 128.5 },
  충북: { lat: 36.8, lon: 127.8 },
  충남: { lat: 36.5, lon: 126.8 },
  대전: { lat: 36.35, lon: 127.38 },
  전북: { lat: 35.7, lon: 127.1 },
  전남: { lat: 35.0, lon: 127.0 },
  광주: { lat: 35.16, lon: 126.85 },
  경북: { lat: 36.4, lon: 128.7 },
  대구: { lat: 35.87, lon: 128.6 },
  경남: { lat: 35.3, lon: 128.4 },
  부산: { lat: 35.18, lon: 129.08 },
  제주: { lat: 33.38, lon: 126.55 },
};

export function coordsOf(region: string): { lat: number; lon: number } {
  return REGION_COORDS[region] ?? REGION_COORDS['서울'];
}
