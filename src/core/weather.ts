/**
 * 단기예보 해석.
 *
 * 데이터는 GitHub Actions가 미리 받아 커밋한 src/data/weather.json에서 온다.
 * 앱은 인증키를 갖지 않는다 — 계정당 키가 하나라 번들에 넣으면 다른 API까지 노출된다.
 *
 * ⚠ 이 예보는 **시도 대표 지점** 기준이다. 산 정상 날씨가 아니다.
 *   고도가 100m 오를 때 기온이 약 0.6도 내려가므로 실제 산 위는 더 춥다.
 *   화면에서 반드시 이 점을 밝힌다 — 확정 정보처럼 보이면 안 된다.
 */

export interface Slot {
  date: string; // YYYYMMDD
  time: string; // HHmm
  TMP?: string; // 기온(도)
  SKY?: string; // 하늘상태 1맑음 3구름많음 4흐림
  PTY?: string; // 강수형태 0없음 1비 2비/눈 3눈 4소나기
  POP?: string; // 강수확률(%)
}

export interface WeatherData {
  asOf: string;
  baseDate: string;
  baseTime: string;
  regions: Record<string, { nx: number; ny: number; slots: Slot[] }>;
}

export interface Conditions {
  tempC: number | null;
  /** 사람이 읽는 하늘 상태 */
  sky: string;
  rainChance: number | null;
  /** 비·눈이 실제로 오는 시간대인가 */
  precipitating: boolean;
}

const SKY_LABEL: Record<string, string> = { '1': '맑음', '3': '구름많음', '4': '흐림' };
const PTY_LABEL: Record<string, string> = {
  '1': '비',
  '2': '비 또는 눈',
  '3': '눈',
  '4': '소나기',
};

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 예보 한 칸을 사람이 읽는 형태로. 강수형태가 있으면 하늘상태보다 우선한다. */
export function readSlot(slot: Slot): Conditions {
  const pty = slot.PTY ?? '0';
  const precipitating = pty !== '0';
  return {
    tempC: num(slot.TMP),
    sky: precipitating ? (PTY_LABEL[pty] ?? '강수') : (SKY_LABEL[slot.SKY ?? ''] ?? '정보 없음'),
    rainChance: num(slot.POP),
    precipitating,
  };
}

/** 지금 이후 가장 가까운 예보 칸. 지난 예보만 있으면 null */
export function currentSlot(
  data: WeatherData,
  region: string,
  now: Date
): Slot | null {
  const entry = data.regions[region];
  if (!entry || entry.slots.length === 0) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  const key =
    `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
    `${p(now.getHours())}00`;
  return entry.slots.find((s) => s.date + s.time >= key) ?? null;
}

/**
 * 산행에 영향을 주는 경고. 없으면 빈 배열.
 * 과장하지 않는다 — 실제로 판단을 바꾸는 것만 담는다.
 */
export function warnings(c: Conditions): string[] {
  const out: string[] = [];
  if (c.precipitating) out.push(`${c.sky} 예보예요. 바위가 미끄러워요`);
  else if (c.rainChance !== null && c.rainChance >= 60) out.push(`비 올 확률 ${c.rainChance}%예요`);
  if (c.tempC !== null && c.tempC >= 31) out.push('한낮 더위가 심해요. 물을 넉넉히 챙기세요');
  if (c.tempC !== null && c.tempC <= 0) out.push('영하예요. 결빙 구간을 조심하세요');
  return out;
}

/** 정상 부근 체감 기온. 고도 100m당 약 0.6도 낮아진다(기온감률). */
export function tempAtSummit(baseTempC: number | null, gainM: number): number | null {
  if (baseTempC === null || !(gainM >= 0)) return null;
  return Math.round((baseTempC - (gainM / 100) * 0.6) * 10) / 10;
}
