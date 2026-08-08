import { COURSES, type Course } from './courses';

/**
 * "내 주변 산" 계층.
 *
 * 좌표 데이터는 GitHub Actions가 채우는 src/data/mountains.json에서 온다.
 * 아직 없거나 특정 산이 빠져 있어도 앱은 동작해야 한다 — 좌표가 없으면
 * 거리 정렬만 못 할 뿐, 코스 목록은 그대로 보여준다.
 */

export interface Coords {
  lat: number;
  lng: number;
}

export interface MountainInfo {
  name: string;
  region: string;
  lat: number;
  lng: number;
  elevation: number | null;
}

export interface NearbyMountain {
  name: string;
  region: string;
  /** 좌표를 모르면 null — 이 경우 거리순 정렬에서 뒤로 밀린다 */
  km: number | null;
  elevation: number | null;
  courses: Course[];
}

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** 두 좌표 사이 대권거리(km). 하버사인. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 거리 표기 — 1km 미만은 m로, 100km 넘으면 반올림 */
export function formatDistance(km: number | null): string {
  if (km === null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/**
 * 코스 데이터와 좌표 데이터를 산 단위로 합친다.
 *
 * 기준점(here)이 없으면 거리 없이 이름순으로 준다 — 위치 권한을 거부해도
 * 앱이 빈 화면이 되면 안 된다.
 */
export function nearbyMountains(
  info: MountainInfo[],
  here: Coords | null,
  courses: Course[] = COURSES
): NearbyMountain[] {
  const byName = new Map<string, MountainInfo>();
  for (const m of info) if (!byName.has(m.name)) byName.set(m.name, m);

  const grouped = new Map<string, Course[]>();
  for (const c of courses) {
    const list = grouped.get(c.mountain);
    if (list) list.push(c);
    else grouped.set(c.mountain, [c]);
  }

  const out: NearbyMountain[] = [];
  for (const [name, list] of grouped) {
    const meta = byName.get(name);
    out.push({
      name,
      region: meta?.region || list[0].region,
      km: meta && here ? distanceKm(here, { lat: meta.lat, lng: meta.lng }) : null,
      elevation: meta?.elevation ?? null,
      courses: list,
    });
  }

  // 좌표를 아는 산이 먼저, 그 안에서 가까운 순. 나머지는 이름순으로 뒤에 붙인다.
  return out.sort((a, b) => {
    if (a.km !== null && b.km !== null) return a.km - b.km;
    if (a.km !== null) return -1;
    if (b.km !== null) return 1;
    return a.name.localeCompare(b.name, 'ko');
  });
}

/** 그 산에서 가장 빨리 오를 수 있는 코스의 공식 시간(분). 없으면 null */
export function fastestOfficial(m: NearbyMountain): number | null {
  const times = m.courses
    .map((c) => c.officialMinutes)
    .filter((v): v is number => v !== null && v > 0);
  return times.length === 0 ? null : Math.min(...times);
}
