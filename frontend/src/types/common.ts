export type GuideType = "ALARM" | "INTERLOCK";

export const GUIDE_TYPE_OPTIONS: { value: GuideType; label: string }[] = [
  { value: "ALARM", label: "알람" },
  { value: "INTERLOCK", label: "인터락" },
];
