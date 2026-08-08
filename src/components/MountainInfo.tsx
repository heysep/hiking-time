import mountains from '../data/mountains.json';

interface Entry {
  details: string;
  address: string;
  region: string;
  code: string;
}

const DATA = mountains as { asOf: string; source: string; mountains: Record<string, Entry> };

/**
 * 산 소개글.
 *
 * 코스 시간은 한 번 보면 끝이지만 소개글은 "이 산이 어떤 곳인지" 알려줘서
 * 다른 산을 눌러 보게 만든다. 그래서 코스 선택 아래에 둔다.
 *
 * 없는 산이 3개 있다(가야산·오대산·남산). 산림청 자료에 해당 지역 조사분이
 * 없거나 소개글이 껍데기뿐이라 **비워 뒀다.** 다른 지역 동명이산의 소개글을
 * 대신 보여주면 틀린 정보가 된다 — 실제로 이름만으로 고르면 20개 중 16개가
 * 엉뚱한 산이었다(팔공산 → 전북 장수, 태백산 → 경남 창녕).
 */
export function MountainInfo({ mountain }: { mountain: string }) {
  const entry = DATA.mountains[mountain];
  if (!entry) return null;

  return (
    <section className="panel">
      <h2 className="panel-title">{mountain} 소개</h2>
      <p className="note" style={{ whiteSpace: 'pre-wrap' }}>
        {entry.details}
      </p>
      <p className="disclaimer">
        {entry.address} · 산림청 산정보 자료예요.
      </p>
    </section>
  );
}
