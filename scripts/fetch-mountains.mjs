/**
 * 산림청 산정보 수집기 — 코스 데이터에 있는 산의 소개글을 받아 온다.
 *
 *   DATA_GO_KR_KEY=xxx node scripts/fetch-mountains.mjs
 *
 * ── 실측한 응답 구조 (2026-08-09) ────────────────────────────────
 *   mntiname     산 이름
 *   mntiadd      소재지 주소
 *   mntidetails  소개글  ← 우리가 쓰는 것
 *   mntihigh     높이. **0으로 오는 경우가 많아 쓰지 않는다**
 *   mntilistno   산 코드
 *   mntitop/mntisummary  대부분 비어 있음
 *
 * ⚠ 좌표(위경도)를 주지 않는다. 그래서 이 데이터로는 "내 주변 산" 거리 정렬을 못 한다.
 *   소개글 표시에만 쓴다. 거리 정렬을 하려면 주소를 지오코딩하는 단계가 따로 필요하다.
 *
 * ⚠ 같은 이름의 산이 여러 건 나온다(북한산 2건 — 서대문구·기타 지자체 조사분).
 *   지자체별 조사 결과라 내용이 겹치므로 가장 긴 소개글 하나만 남긴다.
 *
 * 신선도는 커밋 로그가 아니라 이 파일의 asOf로 판단한다.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'src/data/mountains.json');

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

/**
 * courses.ts에서 산 이름과 지역을 함께 뽑는다.
 *
 * 지역이 반드시 필요하다 — 같은 이름의 산이 전국에 흔하다.
 * 이름만으로 고르면 20개 중 16개가 엉뚱한 산이 잡혔다(실측):
 *   팔공산 → 전북 장수, 무등산 → 충북 제천, 태백산 → 경남 창녕.
 */
function mountainTargets() {
  const src = readFileSync(join(ROOT, 'src/core/courses.ts'), 'utf8');
  const out = new Map();
  for (const m of src.matchAll(/mountain: '([^']+)'[\s\S]*?region: '([^']+)'/g)) {
    if (!out.has(m[1])) out.set(m[1], m[2]);
  }
  return out;
}

/** courses.ts의 짧은 지역명 → API 주소가 쓰는 시도 표기 */
const REGION_PREFIX = {
  서울: '서울', 경기: '경기도', 인천: '인천', 강원: '강원',
  충북: '충청북도', 충남: '충청남도', 대전: '대전',
  전북: '전라북도', 전남: '전라남도', 광주: '광주',
  경북: '경상북도', 대구: '대구', 경남: '경상남도',
  부산: '부산', 제주: '제주',
};

/**
 * 주소가 코스의 지역과 같은지 본다.
 *
 * 시도만 봐서는 부족하다 — 실측에서 '지리산'이 경남 통영 사량도의 다른 지리산(398m)으로,
 * '청계산'이 경기 가평의 다른 청계산으로 잡혔다. 둘 다 시도는 맞았다.
 * 그래서 courses.ts에 시군이 적혀 있으면(예: '경남 산청') 시군까지 대조한다.
 */
function addressMatches(address, region) {
  const [sido, sigun] = region.split(' ');
  const prefix = REGION_PREFIX[sido];
  if (!prefix) return true; // 모르는 지역이면 거르지 않는다
  if (!address.startsWith(prefix)) return false;
  // 시군이 없는 광역시·특별시는 시도 일치로 충분하다
  if (!sigun) return true;
  return address.includes(sigun);
}

const ENDPOINT = 'https://apis.data.go.kr/1400000/service/cultureInfoService2/mntInfoOpenAPI2';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 인증키는 발급 시 이미 인코딩돼 있다 — URLSearchParams에 넣으면 이중 인코딩된다. */
async function fetchMountain(name, attempt = 1) {
  const url = `${ENDPOINT}?serviceKey=${KEY}&searchWrd=${encodeURIComponent(name)}&numOfRows=10&pageNo=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const code = (xml.match(/<resultCode>(\d+)<\/resultCode>/) ?? [])[1];
    if (code !== '00') {
      throw Object.assign(new Error(`resultCode=${code}`), { fatal: true });
    }
    return xml;
  } catch (e) {
    if (e?.fatal || attempt >= 3) throw e;
    await sleep(1000 * attempt);
    return fetchMountain(name, attempt + 1);
  }
}

const tag = (chunk, name) => {
  const m = chunk.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : '';
};

const targets = mountainTargets();
const out = { asOf: new Date().toISOString().slice(0, 10), source: '산림청 산정보 서비스', mountains: {} };
const missed = [];

for (const [name, region] of targets) {
  try {
    const xml = await fetchMountain(name);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

    // 1) 이름 판정 — 봉우리명이 밑줄로 붙어 오는 경우가 많다(설악산_대청봉, 속리산_천황봉).
    //    그래서 밑줄 앞부분만 비교한다. 단 '북한산성'처럼 다른 산이 섞이면 안 되므로
    //    접두사 일치가 아니라 밑줄 기준 정확일치다.
    // 2) 주소가 코스의 지역과 같아야 한다 (동명이산 배제)
    const pool = items.filter(
      (c) => tag(c, 'mntiname').split('_')[0] === name && addressMatches(tag(c, 'mntiadd'), region)
    );

    // 같은 산을 여러 지자체가 조사한 경우가 있어 가장 자세한 것을 고른다
    let best = null;
    for (const c of pool) {
      const details = tag(c, 'mntidetails');
      // 5자짜리 껍데기 소개글이 실제로 있다(남산). 화면에 띄울 가치가 없으면 버린다.
      if (details.length < 40) continue;
      if (best === null || details.length > best.details.length) {
        best = { details, address: tag(c, 'mntiadd'), code: tag(c, 'mntilistno') };
      }
    }

    // 지역이 맞는 자료가 없으면 **비워 둔다.** 엉뚱한 산의 소개글을 보여주느니 없는 게 낫다.
    if (best === null || best.details === '') {
      missed.push(name);
      continue;
    }
    out.mountains[name] = { ...best, region };
  } catch (e) {
    missed.push(name);
    console.error(`${name} 실패: ${e instanceof Error ? e.message : e}`);
  }
  await sleep(300);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + '\n');

const got = Object.keys(out.mountains).length;
console.log(`산 ${got}/${targets.size}개 수집 → ${OUT}`);
if (missed.length) console.log(`소개글 없음: ${missed.join(', ')}`);
// 소개글은 부가 정보라 0건이어도 앱은 동작한다. 다만 전부 실패면 설정 문제일 가능성이 높다.
if (got === 0) {
  console.error('지역이 일치하는 자료를 하나도 찾지 못했습니다. 인증키나 지역 매핑을 확인하세요.');
  process.exit(1);
}
