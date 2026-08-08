import { describe, it, expect } from 'vitest';
import { toGrid, latestBaseTime } from './grid';
import { REGION_COORDS } from './sun';

describe('toGrid', () => {
  /**
   * 기상청이 배포한 격자 목록의 대표 지점들. 하나라도 어긋나면 변환식이 틀린 것이다.
   * 서울 종로구가 (60, 127)인 것은 이 API를 쓰는 어느 예제에서나 나오는 기준값이다.
   */
  it('서울 종로구는 nx=60, ny=127', () => {
    expect(toGrid(37.5714, 126.9779)).toEqual({ nx: 60, ny: 127 });
  });

  it('제주는 서울보다 남서쪽 격자다', () => {
    const seoul = toGrid(37.5714, 126.9779);
    const jeju = toGrid(33.4996, 126.5312);
    expect(jeju.ny).toBeLessThan(seoul.ny);
  });

  it('부산은 서울보다 동남쪽 격자다', () => {
    const seoul = toGrid(37.5714, 126.9779);
    const busan = toGrid(35.1796, 129.0756);
    expect(busan.nx).toBeGreaterThan(seoul.nx);
    expect(busan.ny).toBeLessThan(seoul.ny);
  });

  it('모든 지역 좌표가 유효한 격자 범위 안이다', () => {
    for (const [name, c] of Object.entries(REGION_COORDS)) {
      const g = toGrid(c.lat, c.lon);
      expect(Number.isInteger(g.nx), name).toBe(true);
      expect(Number.isInteger(g.ny), name).toBe(true);
      // 기상청 격자는 대략 nx 1~149, ny 1~253
      expect(g.nx, name).toBeGreaterThan(0);
      expect(g.nx, name).toBeLessThan(150);
      expect(g.ny, name).toBeGreaterThan(0);
      expect(g.ny, name).toBeLessThan(254);
    }
  });
});

describe('latestBaseTime', () => {
  const at = (y: number, m: number, d: number, h: number, min: number) =>
    new Date(y, m - 1, d, h, min);

  it('발표 15분 뒤부터 그 회차를 쓴다', () => {
    expect(latestBaseTime(at(2026, 8, 7, 14, 20)).baseTime).toBe('1400');
  });

  it('발표 직후 15분 안에는 이전 회차를 쓴다', () => {
    expect(latestBaseTime(at(2026, 8, 7, 14, 5)).baseTime).toBe('1100');
  });

  /** 자정 직후는 전날 23시 발표를 써야 한다 — 날짜까지 넘어가야 한다 */
  it('자정 직후에는 전날 23시 발표를 쓴다', () => {
    const r = latestBaseTime(at(2026, 8, 7, 0, 30));
    expect(r.baseTime).toBe('2300');
    expect(r.baseDate).toBe('20260806');
  });

  it('02:15을 넘기면 당일 02시 발표로 바뀐다', () => {
    const r = latestBaseTime(at(2026, 8, 7, 2, 20));
    expect(r.baseTime).toBe('0200');
    expect(r.baseDate).toBe('20260807');
  });

  /** 월 경계에서 날짜가 어긋나면 안 된다 */
  it('월초 자정 직후에는 전달 말일로 넘어간다', () => {
    const r = latestBaseTime(at(2026, 9, 1, 1, 0));
    expect(r.baseDate).toBe('20260831');
  });

  it('연말 경계에서도 어긋나지 않는다', () => {
    const r = latestBaseTime(at(2026, 1, 1, 1, 0));
    expect(r.baseDate).toBe('20251231');
  });
});
