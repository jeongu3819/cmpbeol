export type GuideType = "ALARM" | "INTERLOCK";

export const GUIDE_TYPE_OPTIONS: { value: GuideType; label: string }[] = [
  { value: "ALARM", label: "알람" },
  { value: "INTERLOCK", label: "인터락" },
];

/** guide_type 에 따라 화면 라벨을 다르게 표시하기 위한 헬퍼. */
export interface GuideTypeLabels {
  type: string; // "알람" | "인터락"
  newPageTitle: string; // "새 알람 가이드 등록"
  editPageTitle: string; // "알람 가이드 수정"
  code: string; // "알람 코드"
  title: string; // "알람명"
  summary: string; // "알람 요약"
}

export function guideTypeLabels(type: GuideType): GuideTypeLabels {
  const word = type === "ALARM" ? "알람" : "인터락";
  const titleWord = type === "ALARM" ? "알람명" : "인터락명";
  return {
    type: word,
    newPageTitle: `새 ${word} 가이드 등록`,
    editPageTitle: `${word} 가이드 수정`,
    code: `${word} 코드`,
    title: titleWord,
    summary: `${word} 요약`,
  };
}
