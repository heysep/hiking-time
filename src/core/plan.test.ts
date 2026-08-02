import { describe, expect, it } from 'vitest';
import { COURSES } from './courses';
import { DESCENT_RATIO, PACES, fmtDuration, isRoundTrip, plan, shortNote } from './plan';
import { fmtClock, sunriseMinutes, sunsetMinutes } from './sun';

const seoul = { lat: 37.57, lon: 126.98 };
const normal = PACES.find((p) => p.key === 'normal')!;
const oneWay = COURSES.find((c) => !isRoundTrip(c) && c.officialMinutes !== null)!;

describe('일몰 계산', () => {
  it('서울 하지 일몰이 공표값과 일치한다', () => {
    expect(fmtClock(sunsetMinutes(new Date(2026, 5, 21), seoul.lat, seoul.lon)!)).toBe('19:57');
  });

  it('서울 동지 일몰이 공표값과 일치한다', () => {
    expect(fmtClock(sunsetMinutes(new Date(2026, 11, 22), seoul.lat, seoul.lon)!)).toBe('17:17');
  });

  it('하지 낮이 동지 낮보다 길다', () => {
    const day = (d: Date) =>
      sunsetMinutes(d, seoul.lat, seoul.lon)! - sunriseMinutes(d, seoul.lat, seoul.lon)!;
    expect(day(new Date(2026, 5, 21))).toBeGreaterThan(day(new Date(2026, 11, 22)));
  });

  it('남쪽일수록 여름 일몰이 이르다', () => {
    const d = new Date(2026, 7, 3);
    const jeju = sunsetMinutes(d, 33.38, 126.55)!;
    const gangwon = sunsetMinutes(d, 37.8, 128.5)!;
    expect(jeju).toBeLessThan(gangwon);
  });

  it('시각 표기는 두 자리로 채운다', () => {
    expect(fmtClock(9 * 60 + 5)).toBe('09:05');
    expect(fmtClock(0)).toBe('00:00');
  });
});

describe('산행 계획', () => {
  it('편도 코스는 하산 시간을 더한다', () => {
    const p = plan(oneWay, 6 * 60, normal, new Date(2026, 7, 3))!;
    const up = oneWay.officialMinutes!;
    expect(p.summit).toBe(6 * 60 + up);
    expect(p.totalMinutes).toBe(up + Math.round(up * DESCENT_RATIO));
  });

  it('왕복·순환 코스는 하산을 더하지 않는다', () => {
    const round = COURSES.find((c) => isRoundTrip(c) && c.officialMinutes !== null);
    if (!round) return;
    const p = plan(round, 6 * 60, normal, new Date(2026, 7, 3))!;
    expect(p.summit).toBeNull();
    expect(p.totalMinutes).toBe(round.officialMinutes);
  });

  it('걸음이 느릴수록 오래 걸린다', () => {
    const d = new Date(2026, 7, 3);
    const fast = plan(oneWay, 360, PACES[0], d)!;
    const slow = plan(oneWay, 360, PACES[2], d)!;
    expect(slow.totalMinutes).toBeGreaterThan(fast.totalMinutes);
  });

  it('늦게 출발할수록 여유가 줄어든다', () => {
    const d = new Date(2026, 7, 3);
    const early = plan(oneWay, 5 * 60, normal, d)!;
    const lateStart = plan(oneWay, 14 * 60, normal, d)!;
    expect(lateStart.margin!).toBeLessThan(early.margin!);
  });

  it('공식 시간이 없는 코스는 계획을 만들지 않는다', () => {
    const none = COURSES.find((c) => c.officialMinutes === null);
    if (none) expect(plan(none, 360, normal, new Date(2026, 7, 3))).toBeNull();
  });
});

describe('데이터 무결성', () => {
  it('모든 코스에 산·이름·지역이 있다', () => {
    for (const c of COURSES) {
      expect(c.mountain.length).toBeGreaterThan(0);
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.region.length).toBeGreaterThan(0);
    }
  });

  it('거리는 양수다', () => {
    for (const c of COURSES) expect(c.km).toBeGreaterThan(0);
  });

  it('공식 시간이 있으면 양수다', () => {
    for (const c of COURSES) {
      if (c.officialMinutes !== null) expect(c.officialMinutes).toBeGreaterThan(0);
    }
  });

  it('안내 문구에서 출처 URL을 지운다', () => {
    expect(shortNote('공식 편도 4시간. 출처 example.com')).toBe('공식 편도 4시간.');
    expect(shortNote('[왕복·순환] 순환 코스')).toBe('순환 코스');
    expect(shortNote(undefined)).toBe('');
  });
});

describe('시간 표기', () => {
  it('시간과 분을 사람이 읽는 방식으로 쓴다', () => {
    expect(fmtDuration(200)).toBe('3시간 20분');
    expect(fmtDuration(120)).toBe('2시간');
    expect(fmtDuration(45)).toBe('45분');
    expect(fmtDuration(-10)).toBe('0분');
  });
});

describe('코스 안내 정리', () => {
  it('공단 내부 코드와 표고 산출 근거를 지운다', () => {
    expect(shortNote("공식 '백운대코스'. cursId 121500V008. gain 추정: 836.5m")).toBe(
      "공식 '백운대코스'."
    );
    expect(shortNote('편도 4시간. 구간 난이도 C-C-B')).toBe('편도 4시간.');
  });

  it('실제 코스 note에 개발용 메모가 남지 않는다', () => {
    for (const c of COURSES) {
      const s = shortNote(c.note);
      expect(s).not.toMatch(/cursId|https?:\/\/|출처/);
    }
  });
});
