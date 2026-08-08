import { useMemo, useState } from 'react';
import { BannerAd } from './ads/BannerAd';
import { AD_GROUP_ID } from './ads/config';
import { canShowRewarded, showRewarded } from './ads/rewarded';
import { COURSES } from './core/courses';
import { PACES, fmtDuration, groupByMountain, plan, shortNote } from './core/plan';
import { fmtClock } from './core/sun';
import { WeatherCard } from './components/WeatherCard';
import weatherData from './data/weather.json';
import type { WeatherData } from './core/weather';

const KEY = 'hikingtime.last.v1';

interface Saved {
  mountain: string;
  course: string;
  pace: string;
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(v: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* 무시 */
  }
}

/** "HH:MM" → 자정 기준 분 */
function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

function nowClock(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  const today = useMemo(() => new Date(), []);
  const groups = useMemo(() => groupByMountain(COURSES), []);
  const saved = load();

  const [mountain, setMountain] = useState(saved?.mountain ?? '북한산');
  const list = useMemo(
    () => groups.find((g) => g.mountain === mountain)?.list ?? groups[0].list,
    [groups, mountain]
  );
  const [courseName, setCourseName] = useState(saved?.course ?? list[0].name);
  const course = list.find((c) => c.name === courseName) ?? list[0];

  const [paceKey, setPaceKey] = useState(saved?.pace ?? 'normal');
  const pace = PACES.find((p) => p.key === paceKey) ?? PACES[1];
  const [startText, setStartText] = useState(nowClock);
  const [bonus, setBonus] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = parseClock(startText);
  const result = useMemo(
    () => (start === null ? null : plan(course, start, pace, today)),
    [course, start, pace, today]
  );

  const pickMountain = (m: string) => {
    const first = groups.find((g) => g.mountain === m)!.list[0];
    setMountain(m);
    setCourseName(first.name);
    save({ mountain: m, course: first.name, pace: paceKey });
  };

  const unlock = () => {
    if (bonus || loading) return;
    setLoading(true);
    showRewarded({ onReward: () => setBonus(true), onClose: () => setLoading(false) });
  };

  const late = result?.margin !== null && result?.margin !== undefined && result.margin < 0;
  const tight = !late && result?.margin !== null && result?.margin !== undefined && result.margin < 60;

  return (
    <div className="app">
      <header>
        <h1 className="hdr-title">등산 소요시간</h1>
        <p className="hdr-sub">
          코스와 출발 시각을 고르면 하산 완료 시각과 일몰까지 남는 여유를 알려드려요.
        </p>
      </header>

      {result && (
        <section className={`hero${late ? ' late' : tight ? ' tight' : ''}`}>
          <span className="hero-cap">
            {course.mountain} · {course.name}
          </span>
          <span className="hero-dday">{fmtClock(result.finish)} 하산 완료</span>
          <span className="hero-title">
            {result.margin === null
              ? '일몰을 계산할 수 없는 날이에요'
              : result.margin < 0
                ? `일몰보다 ${fmtDuration(-result.margin)} 늦어요`
                : `일몰까지 ${fmtDuration(result.margin)} 여유`}
          </span>
          <span className="hero-meta">
            총 {fmtDuration(result.totalMinutes)}
            {result.sunset !== null && ` · 일몰 ${fmtClock(result.sunset)}`}
          </span>
        </section>
      )}

      <WeatherCard
        data={weatherData as WeatherData}
        region={course.region}
        gainM={course.gain}
        now={today}
      />

      <section className="panel">
        <div className="field">
          <span className="field-label">산</span>
          <div className="chips">
            {groups.map((g) => (
              <button
                key={g.mountain}
                className={`chip${mountain === g.mountain ? ' on' : ''}`}
                onClick={() => pickMountain(g.mountain)}
              >
                {g.mountain}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">코스</span>
          <ul className="list">
            {list.map((c) => (
              <li key={c.name}>
                <button
                  className={`row${course.name === c.name ? ' on' : ''}`}
                  onClick={() => {
                    setCourseName(c.name);
                    save({ mountain, course: c.name, pace: paceKey });
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span className="row-name" style={{ display: 'block' }}>
                      {c.name}
                    </span>
                    <span className="row-meta">
                      {c.km}km
                      {c.officialMinutes !== null && ` · 공식 ${fmtDuration(c.officialMinutes)}`}
                    </span>
                  </span>
                  <span className={`badge lv-${c.level}`}>{c.level}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="grid2">
          <label className="field">
            <span className="field-label">출발 시각</span>
            <input
              className="field-input"
              type="time"
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              aria-label="출발 시각"
            />
          </label>
          <div className="field">
            <span className="field-label">내 걸음</span>
            <div className="chips">
              {PACES.map((p) => (
                <button
                  key={p.key}
                  className={`chip${paceKey === p.key ? ' on' : ''}`}
                  onClick={() => {
                    setPaceKey(p.key);
                    save({ mountain, course: courseName, pace: p.key });
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="disclaimer">{pace.desc}</p>
      </section>

      {result && (
        <section className="panel">
          <h2 className="panel-title">시간표</h2>
          <ul className="list">
            <li className="row">
              <span className="row-name">출발</span>
              <span className="badge">{fmtClock(result.start)}</span>
            </li>
            {result.summit !== null && (
              <li className="row">
                <span className="row-name">정상 도착</span>
                <span className="badge">{fmtClock(result.summit)}</span>
              </li>
            )}
            <li className="row">
              <span className="row-name">하산 완료</span>
              <span className="badge">{fmtClock(result.finish)}</span>
            </li>
            {result.sunset !== null && (
              <li className={`row${late ? ' danger' : ''}`}>
                <span className="row-name">일몰</span>
                <span className="badge">{fmtClock(result.sunset)}</span>
              </li>
            )}
          </ul>
          {result.roundTrip && (
            <p className="note">
              이 코스는 공식 안내 시간이 왕복 또는 순환 기준이라 하산 시간을 따로 더하지
              않았어요.
            </p>
          )}
          {late && (
            <p className="note" style={{ color: 'var(--danger)' }}>
              해가 진 뒤에 내려오게 돼요. 산에서는 능선과 나무에 가려 공식 일몰보다 30분에서
              1시간 일찍 어두워집니다. 출발을 앞당기거나 더 짧은 코스를 골라주세요.
            </p>
          )}
        </section>
      )}

      {course.note && (
        <section className="panel">
          <h2 className="panel-title">코스 안내</h2>
          <p className="note">{shortNote(course.note)}</p>
          {course.gain >= 0 && (
            <p className="disclaimer">
              들머리와 정상의 표고 차이는 약 {course.gain}m예요. 오르내림이 반복되는 코스는
              실제로 더 많이 오릅니다.
            </p>
          )}
        </section>
      )}

      {canShowRewarded() && !bonus && (
        <button className="bonus-cta" onClick={unlock} disabled={loading}>
          {loading ? '광고 확인 중' : `광고 보고 전국 ${COURSES.length}개 코스 한눈에 보기`}
        </button>
      )}
      {bonus && (
        <section className="panel">
          <h2 className="panel-title">전국 코스 {COURSES.length}개</h2>
          <ul className="list">
            {COURSES.map((c) => (
              <li key={`${c.mountain}-${c.name}`} className="row">
                <span style={{ minWidth: 0 }}>
                  <span className="row-name" style={{ display: 'block' }}>
                    {c.mountain} {c.name}
                  </span>
                  <span className="row-meta">
                    {c.region} · {c.km}km
                    {c.officialMinutes !== null && ` · ${fmtDuration(c.officialMinutes)}`}
                  </span>
                </span>
                <span className={`badge lv-${c.level}`}>{c.level}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="disclaimer">
        코스 거리와 소요시간은 국립공원공단과 지자체가 공표한 값이에요. 일몰은 지역 대표
        좌표로 계산한 값이라 실제와 몇 분 차이가 날 수 있고, 산에서는 지형에 가려 더 일찍
        어두워집니다. 날씨와 체력에 따라 실제 산행 시간은 크게 달라지니 여유 있게 잡아주세요.
      </p>

      {/* 배너는 sticky라 마지막에 와야 화면 하단에 붙는다 */}
      <BannerAd adGroupId={AD_GROUP_ID} />
    </div>
  );
}
