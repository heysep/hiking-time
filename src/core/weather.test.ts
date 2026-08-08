import { describe, it, expect } from 'vitest';
import { readSlot, currentSlot, warnings, tempAtSummit, type WeatherData } from './weather';

const data: WeatherData = {
  asOf: '2026-08-07T11:00:00.000Z',
  baseDate: '20260807',
  baseTime: '2000',
  regions: {
    서울: {
      nx: 60,
      ny: 127,
      slots: [
        { date: '20260807', time: '2100', TMP: '33', SKY: '1', PTY: '0', POP: '0' },
        { date: '20260807', time: '2200', TMP: '30', SKY: '3', PTY: '0', POP: '20' },
        { date: '20260808', time: '0900', TMP: '26', SKY: '4', PTY: '1', POP: '80' },
      ],
    },
  },
};

describe('readSlot', () => {
  it('하늘상태를 말로 바꾼다', () => {
    expect(readSlot(data.regions['서울'].slots[0]).sky).toBe('맑음');
    expect(readSlot(data.regions['서울'].slots[1]).sky).toBe('구름많음');
  });

  /** 비가 오는데 '흐림'이라고만 하면 안 된다 — 강수형태가 우선이다 */
  it('강수가 있으면 하늘상태보다 강수형태를 보여준다', () => {
    const c = readSlot(data.regions['서울'].slots[2]);
    expect(c.sky).toBe('비');
    expect(c.precipitating).toBe(true);
  });

  it('값이 없으면 null — 0으로 뭉개지 않는다', () => {
    const c = readSlot({ date: '20260807', time: '2100' });
    expect(c.tempC).toBeNull();
    expect(c.rainChance).toBeNull();
    expect(c.sky).toBe('정보 없음');
  });
});

describe('currentSlot', () => {
  /**
   * 21:30이면 "다음 칸(22시)"이 아니라 지금 속한 21시 예보를 본다.
   * 단기예보 TMP는 시간별 값이라 21시 칸이 21:00~22:00의 예보다.
   */
  it('지금 속한 시간대의 예보를 고른다', () => {
    expect(currentSlot(data, '서울', new Date(2026, 7, 7, 21, 30))?.time).toBe('2100');
    expect(currentSlot(data, '서울', new Date(2026, 7, 7, 21, 0))?.time).toBe('2100');
    expect(currentSlot(data, '서울', new Date(2026, 7, 7, 22, 10))?.time).toBe('2200');
  });

  it('날짜가 넘어가도 이어서 찾는다', () => {
    const s = currentSlot(data, '서울', new Date(2026, 7, 7, 23, 0));
    expect(s?.date).toBe('20260808');
  });

  /** 예보가 오래돼 지난 것뿐이면 조용히 옛 값을 보여주면 안 된다 */
  it('남은 예보가 없으면 null', () => {
    expect(currentSlot(data, '서울', new Date(2026, 7, 9, 0, 0))).toBeNull();
  });

  it('모르는 지역이면 null', () => {
    expect(currentSlot(data, '없는지역', new Date(2026, 7, 7, 21, 0))).toBeNull();
  });
});

describe('warnings', () => {
  it('비 예보면 미끄러움을 알린다', () => {
    const w = warnings(readSlot(data.regions['서울'].slots[2]));
    expect(w.some((s) => s.includes('미끄러'))).toBe(true);
  });

  it('맑고 선선하면 경고하지 않는다', () => {
    expect(warnings({ tempC: 20, sky: '맑음', rainChance: 10, precipitating: false })).toEqual([]);
  });

  it('폭염과 영하를 각각 알린다', () => {
    expect(warnings({ tempC: 33, sky: '맑음', rainChance: 0, precipitating: false })[0]).toContain('더위');
    expect(warnings({ tempC: -3, sky: '맑음', rainChance: 0, precipitating: false })[0]).toContain('영하');
  });

  /** 이미 비가 오면 확률 문구를 겹쳐 말하지 않는다 */
  it('강수 중이면 확률 문구를 중복하지 않는다', () => {
    const w = warnings({ tempC: 20, sky: '비', rainChance: 90, precipitating: true });
    expect(w).toHaveLength(1);
  });
});

describe('tempAtSummit', () => {
  /** 기온감률 100m당 0.6도 */
  it('고도가 높을수록 낮게 잡는다', () => {
    expect(tempAtSummit(30, 1000)).toBe(24);
    expect(tempAtSummit(30, 0)).toBe(30);
  });

  it('기온이나 고도를 모르면 null', () => {
    expect(tempAtSummit(null, 1000)).toBeNull();
    expect(tempAtSummit(30, -1)).toBeNull();
  });
});
