import { currentSlot, readSlot, tempAtSummit, warnings, type WeatherData } from '../core/weather';

/**
 * 산행 당일 날씨.
 *
 * 이 앱이 "다시 열 이유"를 갖는 유일한 축이다 — 코스 시간은 안 바뀌지만 날씨는 매일 바뀐다.
 * 그래서 계산 결과 바로 아래, 스크롤 없이 보이는 자리에 둔다.
 *
 * 정직성: 예보는 시도 대표 지점 기준이라 산 정상 날씨가 아니다.
 * 정상 체감 기온은 고도 100m당 0.6도 보정한 추정값이고, 화면에 그렇게 밝힌다.
 */
export function WeatherCard({
  data,
  region,
  gainM,
  now,
}: {
  data: WeatherData;
  region: string;
  /** 들머리~정상 표고차. -1이면 미확인이라 정상 기온을 보여주지 않는다 */
  gainM: number;
  now: Date;
}) {
  const slot = currentSlot(data, region, now);
  if (slot === null) return null;

  const c = readSlot(slot);
  const alerts = warnings(c);
  const summit = gainM >= 0 ? tempAtSummit(c.tempC, gainM) : null;
  const hh = Number(slot.time.slice(0, 2));

  return (
    <section className="panel">
      <h2 className="panel-title">{region} 날씨</h2>

      <ul className="list">
        <li className="row">
          <span className="row-name">{hh}시 기준</span>
          <span className="badge">
            {c.sky}
            {c.tempC !== null && ` · ${c.tempC}도`}
          </span>
        </li>
        {c.rainChance !== null && (
          <li className="row">
            <span className="row-name">강수 확률</span>
            <span className="badge">{c.rainChance}%</span>
          </li>
        )}
        {summit !== null && (
          <li className="row">
            <span className="row-name">정상 부근 체감</span>
            <span className="badge">약 {summit}도</span>
          </li>
        )}
      </ul>

      {alerts.map((a) => (
        <p key={a} className="note" style={{ color: 'var(--danger)' }}>
          {a}
        </p>
      ))}

      <p className="disclaimer">
        기상청 단기예보를 {region} 대표 지점 기준으로 가져온 값이에요. 산 위는 예보 지점보다
        바람이 세고 기온이 낮습니다. 정상 부근 체감은 고도 100m당 0.6도씩 낮춰 계산한
        추정값이라 참고용으로만 봐주세요.
      </p>
    </section>
  );
}
