/**
 * 기상청 단기예보 수집기.
 *
 *   DATA_GO_KR_KEY=xxx node scripts/fetch-weather.mjs
 *
 * ── 왜 앱에서 직접 부르지 않는가 (중요) ──────────────────────────────
 * data.go.kr은 **계정당 인증키 하나**를 모든 승인 API에 공유한다.
 * 이 계정의 같은 키가 '국세청_사업자등록정보 진위확인'에도 쓰인다.
 * 키를 클라이언트 번들에 넣으면 누구나 꺼내 쓸 수 있고, 날씨 쿼터만이 아니라
 * 그쪽 API까지 남의 손에 넘어간다. 그래서 절대 번들에 넣지 않는다.
 *
 * 대신 GitHub Actions가 미리 받아 정적 JSON으로 커밋하고, 앱은 그 JSON만 읽는다.
 * 단기예보 자체가 3시간 단위 발표라 이 방식으로 신선도 손실이 거의 없다.
 *
 * 호출량: 지역 15개 × 하루 8회 = 120건. 개발계정 한도 10,000건에 한참 못 미친다.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'src/data/weather.json');

const KEY = process.env.DATA_GO_KR_KEY ?? readEnvFile('DATA_GO_KR_KEY');
if (!KEY) {
  console.error('DATA_GO_KR_KEY가 없습니다.');
  process.exit(1);
}

function readEnvFile(name) {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return '';
  const line = readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : '';
}

/** sun.ts의 REGION_COORDS와 같은 표. 빌드 없이 읽으려고 여기서 파싱한다. */
function regionCoords() {
  const src = readFileSync(join(ROOT, 'src/core/sun.ts'), 'utf8');
  const block = src.slice(src.indexOf('REGION_COORDS'), src.indexOf('export function coordsOf'));
  const out = {};
  for (const m of block.matchAll(/(\S+):\s*\{\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)\s*\}/g)) {
    out[m[1]] = { lat: Number(m[2]), lon: Number(m[3]) };
  }
  return out;
}

// grid.ts와 같은 식. ts를 직접 import할 수 없어 옮겨 적었다 —
// 값이 어긋나면 grid.test.ts의 기준점(서울 60,127)이 잡아 준다.
const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0;
const OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136, DEGRAD = Math.PI / 180;

function toGrid(lat, lon) {
  const re = RE / GRID, slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD, olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  return { nx: Math.floor(ra * Math.sin(theta) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5) };
}

function latestBaseTime(now) {
  const HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
  const d = new Date(now.getTime());
  const minutes = d.getHours() * 60 + d.getMinutes();
  let picked = -1;
  for (const h of HOURS) if (minutes >= h * 60 + 15) picked = h;
  if (picked === -1) { d.setDate(d.getDate() - 1); picked = 23; }
  const p = (n) => String(n).padStart(2, '0');
  return { baseDate: `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`, baseTime: `${p(picked)}00` };
}

const ENDPOINT = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

/** 인증키는 발급 시 이미 인코딩돼 있다 — URLSearchParams에 넣으면 이중 인코딩된다. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 15개 지역을 쉬지 않고 부르면 절반 가까이 `fetch failed`로 떨어진다(실측).
 * 인증 오류가 아니라 연속 호출에서 나는 네트워크 오류라 재시도로 해결된다.
 */
async function fetchForecast(nx, ny, baseDate, baseTime, attempt = 1) {
  const url =
    `${ENDPOINT}?serviceKey=${KEY}&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error(`XML 응답(인증키 확인): ${text.slice(0, 160)}`);
    const json = JSON.parse(text);
    const code = json?.response?.header?.resultCode;
    // 인증·쿼터 오류는 재시도해도 소용없다 — 바로 올린다.
    if (code !== '00') throw Object.assign(new Error(`resultCode=${code} ${json?.response?.header?.resultMsg ?? ''}`), { fatal: true });
    return json?.response?.body?.items?.item ?? [];
  } catch (e) {
    if (e?.fatal || attempt >= 3) throw e;
    await sleep(1000 * attempt);
    return fetchForecast(nx, ny, baseDate, baseTime, attempt + 1);
  }
}

/** 필요한 항목만 남긴다 — 하늘상태·강수형태·기온·강수확률 */
const WANTED = new Set(['SKY', 'PTY', 'TMP', 'POP']);

function summarize(items) {
  const byDateTime = new Map();
  for (const it of items) {
    if (!WANTED.has(it.category)) continue;
    const k = `${it.fcstDate}${it.fcstTime}`;
    const slot = byDateTime.get(k) ?? { date: it.fcstDate, time: it.fcstTime };
    slot[it.category] = it.fcstValue;
    byDateTime.set(k, slot);
  }
  return [...byDateTime.values()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 24);
}

const { baseDate, baseTime } = latestBaseTime(new Date());
const regions = regionCoords();
const out = { asOf: new Date().toISOString(), baseDate, baseTime, regions: {} };

let failed = 0;
for (const [name, c] of Object.entries(regions)) {
  const { nx, ny } = toGrid(c.lat, c.lon);
  try {
    out.regions[name] = { nx, ny, slots: summarize(await fetchForecast(nx, ny, baseDate, baseTime)) };
  } catch (e) {
    failed++;
    console.error(`${name} 실패: ${e instanceof Error ? e.message : e}`);
  }
  await sleep(300); // 연속 호출 완화
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + '\n');

const ok = Object.keys(out.regions).length;
console.log(`지역 ${ok}/${Object.keys(regions).length}개 수집 (기준 ${baseDate} ${baseTime}) → ${OUT}`);
if (ok === 0) {
  console.error('전 지역 실패 — 인증키나 엔드포인트를 확인하세요.');
  process.exit(1);
}
