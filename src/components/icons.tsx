// 공용 라인 아이콘 세트 — 모든 토스 미니앱에서 src/components/icons.tsx 로 복사해 사용
// 문법: 24px viewBox, stroke 1.8, round cap/join, currentColor. 색은 부모의 color로 제어.
// 앱별 아이콘 추가 시 반드시 같은 문법(stroke 1.8, round, 단일 스트로크 톤)을 따를 것.
import React from 'react';

type IconName = keyof typeof PATHS;

const PATHS = {
  // 네비/공통
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowLeft: <path d="M19 12H5m6-7-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.5-2.4.9a8 8 0 0 0-2.6-1.5L14 2.4h-4l-.4 2.5A8 8 0 0 0 7 6.4l-2.4-.9-2 3.5 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.5 2.4-.9a8 8 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a8 8 0 0 0 2.6-1.5l2.4.9 2-3.5-2-1.5Z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8v.5" /></>,
  warning: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 10v4m0 3v.5" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="5.5" r="2.5" /><circle cx="17" cy="18.5" r="2.5" /><path d="m8.2 10.8 6.6-4M8.2 13.2l6.6 4" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  trash: <><path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6m4-6v6" /></>,
  edit: <path d="M4 20h4L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20ZM14.5 6.5l3 3" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  // 돈/금융
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18M16.5 15h.5" /><path d="M7 6V5a2 2 0 0 1 2-2h9" /></>,
  coin: <><circle cx="12" cy="12" r="8.5" /><path d="M9 9.5 10.8 15h.4l.8-3 .8 3h.4L15 9.5M8.5 12h7" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 14.5h4" /></>,
  bank: <path d="M3 9.5 12 4l9 5.5M5 10v8m4.5-8v8m5-8v8M19 10v8M3 20h18" />,
  chart: <path d="M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3" />,
  trendUp: <path d="m4 16 5-5 3.5 3.5L19 8m0 0h-4.5M19 8v4.5" />,
  piggy: <><path d="M5.5 10.5c-.8.3-1.5.4-2.5.3v3.4c1 0 1.7.1 2.4.5.6 2 2.2 3.6 4.6 4.1V21h2.5v-2h2V21H17v-2.4c2.4-1 4-3.1 4-5.6 0-3.5-3.1-6-7.5-6-1 0-2 .1-2.8.4" /><path d="M4.5 8.5C4 6.5 5.5 5 7.3 5c1.2 0 2.2.6 2.7 1.6M16.5 11h.5" /></>,
  receipt: <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3ZM9 8h6M9 12h6" />,
  calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7h7M8.5 11.5h.5m3 0h.5m3 0h.5m-8 3.5h.5m3 0h.5m3 0h.5m-8 3.5h.5m3 0h.5m3 0h.5" /></>,
  // 시간/달력
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 10h16M8 3v4m8-4v4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  bell: <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5ZM10 18.5a2 2 0 0 0 4 0" />,
  flame: <path d="M12 3s1 2.5-.5 5C10 10.5 8 11 8 14a4 4 0 0 0 8 0c0-1.4-.6-2.4-1.2-3.3-.4.8-.9 1.3-1.6 1.6.6-2.6-.2-6.5-1.2-9.3Z" />,
  // 사람
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  users: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 6a3 3 0 0 1 0 6M17 13.5c2 .6 3.5 2.3 3.5 5.5" /></>,
  crown: <path d="m4 8 4 3 4-6 4 6 4-3-1.5 10h-13L4 8Z" />,
  // 장소/사물
  building: <path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M9 7h2m-2 4h2m-2 4h2m4-8h4a1 1 0 0 1 1 1v13M3 21h18" />,
  bed: <path d="M3 18v-7m0 4h18v3m0-3v-2a3 3 0 0 0-3-3H10v5M6 11.5h.5" />,
  food: <path d="M6 3v7m0 0V3m0 7v11M4 3v4a2 2 0 0 0 4 0V3m6 0c-1.5 2-2 4-2 6 0 1.5 1 2.5 2 3v9m4-18v18" />,
  bus: <><rect x="4" y="4" width="16" height="13" rx="2" /><path d="M4 11h16M8 20v-3m8 3v-3M8 14.5h.5m7 0h.5" /></>,
  plane: <path d="M10.5 13.5 3 11l1.5-1.5L10 10l4-4.5c.5-.5 1.5-1 2.5-.5S18 6.5 17.5 7L13 11l.5 5.5L12 18l-2.5-7.5Z" />,
  bag: <path d="M6 8h12l1 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 8ZM9 10V6a3 3 0 0 1 6 0v4" />,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 3.5 5.3 3.5 8.5s-1 6.2-3.5 8.5c-2.5-2.3-3.5-5.3-3.5-8.5s1-6.2 3.5-8.5Z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 12.5h18" /></>,
  document: <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4M9.5 12h5m-5 4h5" />,
  gift: <><rect x="4" y="9" width="16" height="12" rx="1.5" /><path d="M12 9v12M4 13.5h16M12 9S9 9 8 7.5 8.5 4 10 4.5 12 9 12 9Zm0 0s3 0 4-1.5S15.5 4 14 4.5 12 9 12 9Z" /></>,
  // 놀이성(운세/테스트)
  star: <path d="m12 3.5 2.4 5.2 5.6.6-4.2 3.9 1.2 5.6L12 16l-5 2.8 1.2-5.6L4 9.3l5.6-.6L12 3.5Z" />,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5V5m0 14v2.5M2.5 12H5m14 0h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" /></>,
  sparkle: <path d="M12 3c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6ZM19 15c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z" />,
  heart: <path d="M12 20S4 14.7 4 9.3C4 6.4 6.2 4.5 8.5 4.5c1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2 2.3 0 4.5 1.9 4.5 4.8C20 14.7 12 20 12 20Z" />,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15 9-1.8 4.2L9 15l1.8-4.2L15 9Z" /></>,
  health: <path d="M4 12h4l2-5 3 9 2-4h5" />,
  // 앱 전용(오늘의 운세) — 같은 문법(24 viewBox, stroke 1.8, round)
  moonSparkle: <><path d="M18.5 14.7A7.6 7.6 0 0 1 9.3 5.5 7.6 7.6 0 1 0 18.5 14.7Z" /><path d="M17.5 3.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z" /></>,
} as const;

export function Icon({ name, size = 24, strokeWidth = 1.8, className, style }: {
  name: IconName; size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// 틴트 원 배경 아이콘 — 카테고리/목록 행 선두에 사용 (40px 원 + 20px 아이콘이 기본)
export function IconCircle({ name, tint = 'blue', size = 40, iconSize }: {
  name: IconName; tint?: 'blue' | 'green' | 'red' | 'amber' | 'grey'; size?: number; iconSize?: number;
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    blue: { bg: 'var(--blue-bg)', fg: 'var(--blue)' },
    green: { bg: 'var(--green-bg)', fg: 'var(--green)' },
    red: { bg: 'var(--red-bg)', fg: 'var(--red)' },
    amber: { bg: 'var(--amber-bg)', fg: 'var(--amber)' },
    grey: { bg: 'var(--track)', fg: 'var(--sub)' },
  };
  const c = colors[tint];
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: c.bg, color: c.fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon name={name} size={iconSize ?? Math.round(size / 2)} />
    </span>
  );
}

export type { IconName };
