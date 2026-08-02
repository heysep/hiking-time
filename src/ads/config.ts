/**
 * 토스 개발자 콘솔에서 발급받는 광고 그룹 ID.
 * 빌드 시 환경변수로 주입. 미주입 시 빈 문자열 →
 * BannerAd는 아무것도 렌더하지 않고, 리워드는 광고 없이 보상만 준다(콘텐츠를 막지 않음).
 */
export const AD_GROUP_ID = (import.meta.env.VITE_AD_GROUP_ID as string | undefined) ?? '';

/**
 * 리워드 광고 그룹 ID.
 * 실측: 리워드 eCPM이 배너의 92배(75,600원 vs 824원)다. 신규 앱은 반드시
 * 리워드 지점을 하나 두되, **기존/핵심 기능을 광고 뒤로 옮기지 말 것**.
 * "추가로 더 보여주는 것"에만 붙인다.
 */
export const REWARDED_AD_ID = (import.meta.env.VITE_REWARDED_AD_ID as string | undefined) ?? '';

/** 전면 광고 그룹 ID — 화면 전환 사이에만. 결과를 가리면 안 된다. */
export const FULLSCREEN_AD_ID = (import.meta.env.VITE_FULLSCREEN_AD_ID as string | undefined) ?? '';
