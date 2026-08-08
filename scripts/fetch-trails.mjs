/**
 * 산·등산로 데이터 수집기.
 *
 *   node scripts/fetch-trails.mjs            # .env 또는 환경변수의 DATA_GO_KR_KEY 사용
 *   DATA_GO_KR_KEY=xxx node scripts/fetch-trails.mjs
 *
 * 왜 크롤링하지 않는가 — 산림청이 이미 공식 데이터를 개방한다. 크롤링은 사이트
 * 구조가 바뀌면 조용히 깨지고 라이선스도 불분명하다. 표준데이터셋은 좌표가
 * 정규화돼 있고 소요시간이 공식값이라 우리 추정식보다 신뢰도가 높다.
 *
 *   전국산정보표준데이터    https://www.data.go.kr/data/15029183/standard.do
 *   전국등산로표준데이터    https://www.data.go.kr/data/15029184/standard.do
 *
 * 산출물: src/data/mountains.json
 *   { asOf, mountains: [{ name, region, lat, lng, elevation, trails: [...] }] }
 *
 * ⚠ 신선도는 커밋 로그가 아니라 이 파일의 asOf로 판단한다.
 *   (다른 레포에서 Actions가 "성공"하면서도 출력 경로가 어긋나 영원히
 *    no changes로 끝난 적이 있다. 성공 = 갱신이 아니다.)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'src/data/mountains.json');

const KEY = process.env.DATA_GO_KR_KEY ?? readEnvFile('DATA_GO_KR_KEY');

function readEnvFile(name) {
  const p = join(ROOT, '.env');
  if (!existsSync(p)) return '';
  const line = readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : '';
}

if (!KEY) {
  console.error('DATA_GO_KR_KEY가 없습니다. data.go.kr에서 일반 인증키(Decoding)를 발급받아 주세요.');
  process.exit(1);
}

/**
 * 인증키는 발급 시 이미 URL 인코딩된 문자열이다. URLSearchParams에 넣으면
 * 이중 인코딩되어 인증이 실패한다 — 쿼리스트링을 직접 조립한다.
 * (같은 함정을 국토부 API에서도 겪었다)
 */
async function fetchPage(endpoint, params) {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const url = `${endpoint}?serviceKey=${KEY}&${qs}&type=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${endpoint}`);
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    // 인증 실패·쿼터 초과는 XML 에러 봉투로 온다
    throw new Error(`XML 응답(인증키 확인 필요): ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

/** 응답 스키마가 기관마다 달라 흔한 키 후보를 모두 훑는다. */
function rows(payload) {
  const cands = [
    payload?.response?.body?.items?.item,
    payload?.response?.body?.items,
    payload?.body?.items,
    payload?.items,
    payload?.records,
    payload?.data,
  ];
  for (const c of cands) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === 'object') return [c];
  }
  return [];
}

function num(v) {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** 필드명이 기관마다 달라 후보를 순서대로 본다. */
function pick(row, ...names) {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && String(row[n]).trim() !== '') return row[n];
  }
  return null;
}

async function collectAll(endpoint, extra = {}) {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const payload = await fetchPage(endpoint, { pageNo: page, numOfRows: 1000, ...extra });
    const list = rows(payload);
    out.push(...list);
    if (list.length < 1000) break;
  }
  return out;
}

const MOUNTAIN_API = 'https://api.data.go.kr/openapi/tn_pubr_public_mntn_api';
const TRAIL_API = 'https://api.data.go.kr/openapi/tn_pubr_public_mntn_rout_api';

const mountains = new Map();

for (const r of await collectAll(MOUNTAIN_API)) {
  const name = pick(r, 'mntnNm', 'mntnnm', '산명');
  const lat = num(pick(r, 'latitude', 'lat', '위도'));
  const lng = num(pick(r, 'longitude', 'lng', '경도'));
  if (!name || lat === null || lng === null) continue;
  const key = `${name}|${lat.toFixed(3)}`;
  if (!mountains.has(key)) {
    mountains.set(key, {
      name,
      region: pick(r, 'ctprvnNm', 'sidoNm', '시도명') ?? '',
      lat,
      lng,
      elevation: num(pick(r, 'mntnhg', 'height', '높이')),
      trails: [],
    });
  }
}

for (const r of await collectAll(TRAIL_API)) {
  const name = pick(r, 'mntnNm', 'mntnnm', '산명');
  if (!name) continue;
  const target = [...mountains.values()].find((m) => m.name === name);
  if (!target) continue;
  target.trails.push({
    name: pick(r, 'routNm', 'cursNm', '등산로명') ?? '',
    km: num(pick(r, 'routLt', 'cursLt', '길이')),
    officialMinutes: num(pick(r, 'routTm', 'cursTm', '소요시간')),
    level: pick(r, 'routDfclty', 'cursLevel', '난이도') ?? null,
  });
}

const result = {
  asOf: new Date().toISOString().slice(0, 10),
  source: 'data.go.kr 전국산정보/전국등산로 표준데이터',
  mountains: [...mountains.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 0) + '\n');

const withTrails = result.mountains.filter((m) => m.trails.length > 0).length;
console.log(`산 ${result.mountains.length}개 (등산로 있는 산 ${withTrails}개) → ${OUT}`);
if (result.mountains.length === 0) {
  console.error('수집 결과가 0건입니다. 응답 스키마가 바뀌었을 수 있습니다.');
  process.exit(1);
}
