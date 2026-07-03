import type { Severity } from "./common";

export interface AlarmGuide {
  id: number;
  equipment_name?: string | null;
  equipment_model?: string | null;
  process?: string | null;
  area?: string | null;
  alarm_code: string;
  alarm_name: string;
  alarm_description?: string | null;
  severity: Severity;
  category?: string | null;
  cause?: string | null;
  check_points?: string | null;
  action_method?: string | null;
  action_steps?: string | null;
  caution?: string | null;
  related_parts?: string | null;
  owner_team?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export type AlarmGuideInput = Omit<
  AlarmGuide,
  "id" | "created_at" | "updated_at"
>;

export interface AlarmGuideList {
  total: number;
  items: AlarmGuide[];
}

export interface AlarmGuideFilters {
  search?: string;
  equipment_name?: string;
  equipment_model?: string;
  process?: string;
  alarm_code?: string;
  severity?: string;
  category?: string;
  is_active?: boolean;
}
