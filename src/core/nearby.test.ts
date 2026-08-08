import { describe, it, expect } from 'vitest';
import { distanceKm, formatDistance, nearbyMountains, fastestOfficial } from './nearby';
import type { Course } from './courses';

const SEOUL = { lat: 37.5665, lng: 126.978 };

const course = (mountain: string, name: string, official: number | null): Course => ({
  mountain,
  name,
  km: 5,
  gain: 500,
  officialMinutes: official,
  level: '보통',
  region: '서울',
});

describe('distanceKm', () => {
  it('같은 지점은 0', () => {
    expect(distanceKm(SEOUL, SEOUL)).toBeCloseTo(0, 5);
  });

  /** 서울시청 → 부산시청 약 325km (직선). 오차 5% 이내면 하버사인이 맞게 동작하는 것 */
  it('서울-부산 직선거리가 상식 범위 안이다', () => {
    const busan = { lat: 35.1796, lng: 129.0756 };
    const d = distanceKm(SEOUL, busan);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(350);
  });

  it('대칭이다', () => {
    const a = { lat: 33.4, lng: 126.5 };
    expect(distanceKm(SEOUL, a)).toBeCloseTo(distanceKm(a, SEOUL), 6);
  });
});

describe('formatDistance', () => {
  it('단위를 거리에 맞춰 바꾼다', () => {
    expect(formatDistance(0.4)).toBe('400m');
    expect(formatDistance(12.34)).toBe('12.3km');
    expect(formatDistance(325.7)).toBe('326km');
  });

  it('모르면 빈 문자열 — 0km로 표시하지 않는다', () => {
    expect(formatDistance(null)).toBe('');
  });
});

describe('nearbyMountains', () => {
  const courses = [course('북한산', 'A', 180), course('북한산', 'B', 120), course('한라산', 'C', 270)];
  const info = [
    { name: '북한산', region: '서울', lat: 37.6586, lng: 126.9779, elevation: 836 },
    { name: '한라산', region: '제주', lat: 33.3617, lng: 126.5292, elevation: 1947 },
  ];

  it('가까운 산이 먼저 온다', () => {
    const r = nearbyMountains(info, SEOUL, courses);
    expect(r[0].name).toBe('북한산');
    expect(r[1].name).toBe('한라산');
    expect(r[0].km).toBeLessThan(r[1].km!);
  });

  it('코스를 산 단위로 묶는다', () => {
    const r = nearbyMountains(info, SEOUL, courses);
    expect(r[0].courses).toHaveLength(2);
  });

  /** 위치 권한을 거부해도 빈 화면이 되면 안 된다 */
  it('기준점이 없으면 거리 없이 이름순으로 준다', () => {
    const r = nearbyMountains(info, null, courses);
    expect(r).toHaveLength(2);
    expect(r.every((m) => m.km === null)).toBe(true);
    expect(r[0].name).toBe('북한산');
  });

  /** 좌표 데이터가 아직 없어도(수집 전) 동작해야 한다 */
  it('좌표 데이터가 비어도 코스는 그대로 보여준다', () => {
    const r = nearbyMountains([], SEOUL, courses);
    expect(r).toHaveLength(2);
    expect(r.every((m) => m.km === null)).toBe(true);
  });

  it('좌표를 아는 산이 모르는 산보다 앞에 온다', () => {
    const partial = [info[1]]; // 한라산만 좌표 있음
    const r = nearbyMountains(partial, SEOUL, courses);
    expect(r[0].name).toBe('한라산');
    expect(r[0].km).not.toBeNull();
    expect(r[1].km).toBeNull();
  });
});

describe('fastestOfficial', () => {
  it('가장 짧은 공식 시간을 고른다', () => {
    const r = nearbyMountains([], null, [course('북한산', 'A', 180), course('북한산', 'B', 120)]);
    expect(fastestOfficial(r[0])).toBe(120);
  });

  it('공식 시간이 없으면 null — 추정치를 대신 쓰지 않는다', () => {
    const r = nearbyMountains([], null, [course('북한산', 'A', null)]);
    expect(fastestOfficial(r[0])).toBeNull();
  });
});
