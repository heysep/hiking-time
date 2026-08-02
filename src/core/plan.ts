import type { Course } from './courses';
import { coordsOf, sunsetMinutes } from './sun';

/**
 * 등산 계획 계산.
 *
 * 소요시간은 **공단·지자체가 공표한 공식 시간**을 기준으로 삼는다.
 * 거리와 누적고도로 직접 추정하는 방식은 쓰지 않았다 — 코스 절반이 누적고도를
 * 공표하지 않아 순(net) 고도차로 대체해야 하는데, 그러면 항상 과소추정된다.
 * 공식 시간이 있는 코스가 40개 중 39개라 그쪽이 훨씬 믿을 만하다.
 */

/** 왕복·순환 코스인지 — officialMinutes가 이미 전체 시간이라 하산을 더하면 안 된다 */
export function isRoundTrip(c: Course): boolean {
  return (c.note ?? '').startsWith('[왕복·순환]');
}

export interface Pace {
  key: string;
  label: string;
  factor: number;
  desc: string;
}

export const PACES: Pace[] = [
  { key: 'fast', label: '빠름', factor: 0.85, desc: '평소 산행이 익숙해요' },
  { key: 'normal', label: '보통', factor: 1, desc: '공식 안내 시간대로' },
  { key: 'slow', label: '여유', factor: 1.3, desc: '천천히, 쉬어가며' },
];

/**
 * 하산은 보통 등산의 80% 정도 걸린다. 내리막이라 빠르지만
 * 무릎 부담과 조심스러운 발디딤 때문에 절반까지 줄지는 않는다.
 */
export const DESCENT_RATIO = 0.8;

export interface Plan {
  /** 출발 시각(자정 기준 분) */
  start: number;
  /** 정상 도착 — 왕복·순환이면 null */
  summit: number | null;
  /** 하산 완료 */
  finish: number;
  /** 총 소요(분) */
  totalMinutes: number;
  /** 일몰(자정 기준 분). 계산 불가면 null */
  sunset: number | null;
  /** 일몰까지 남는 여유(분). 음수면 어두워진 뒤 내려온다 */
  margin: number | null;
  roundTrip: boolean;
}

export function plan(
  course: Course,
  startMinutes: number,
  pace: Pace,
  date: Date
): Plan | null {
  if (course.officialMinutes === null) return null;

  const round = isRoundTrip(course);
  const up = Math.round(course.officialMinutes * pace.factor);
  const total = round ? up : up + Math.round(up * DESCENT_RATIO);

  const { lat, lon } = coordsOf(course.region);
  const sunset = sunsetMinutes(date, lat, lon);
  const finish = startMinutes + total;

  return {
    start: startMinutes,
    summit: round ? null : startMinutes + up,
    finish,
    totalMinutes: total,
    sunset,
    margin: sunset === null ? null : sunset - finish,
    roundTrip: round,
  };
}

/** 산 이름으로 묶기 — 화면에서 산 → 코스 순으로 고르게 한다 */
export function groupByMountain(courses: Course[]): { mountain: string; list: Course[] }[] {
  const map = new Map<string, Course[]>();
  for (const c of courses) {
    const arr = map.get(c.mountain);
    if (arr) arr.push(c);
    else map.set(c.mountain, [c]);
  }
  return [...map.entries()].map(([mountain, list]) => ({ mountain, list }));
}

/** "3시간 20분" */
export function fmtDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}분`;
  if (mm === 0) return `${h}시간`;
  return `${h}시간 ${mm}분`;
}

/**
 * note에서 화면에 보여줄 부분만 남긴다.
 *
 * 원본 note에는 출처 URL, 공단 내부 코스 코드(cursId), 표고 산출 근거(gain 추정) 같은
 * 개발용 메모가 함께 들어 있다. 그대로 띄우면 사용자에게는 잡음이다.
 */
const INTERNAL = /\s*(출처|cursId|gain\s|구간 난이도)/;

export function shortNote(note: string | undefined): string {
  if (!note) return '';
  const cut = note.split(INTERNAL)[0];
  return cut.replace(/^\[왕복·순환\]\s*/, '').trim();
}
