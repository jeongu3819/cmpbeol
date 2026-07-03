import type { Severity } from "./common";

export interface InterlockGuide {
  id: number;
  equipment_name?: string | null;
  equipment_model?: string | null;
  process?: string | null;
  area?: string | null;
  interlock_code: string;
  interlock_name: string;
  interlock_description?: string | null;
  severity: Severity;
  category?: string | null;
  trigger_condition?: string | null;
  cause?: string | null;
  check_points?: string | null;
  action_method?: string | null;
  action_steps?: string | null;
  reset_condition?: string | null;
  caution?: string | null;
  related_parts?: string | null;
  owner_team?: string | null;
  approval_required: boolean;
  tags?: string[] | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export type InterlockGuideInput = Omit<
  InterlockGuide,
  "id" | "created_at" | "updated_at"
>;

export interface InterlockGuideList {
  total: number;
  items: InterlockGuide[];
}

export interface InterlockGuideFilters {
  search?: string;
  equipment_name?: string;
  equipment_model?: string;
  process?: string;
  interlock_code?: string;
  severity?: string;
  category?: string;
  is_active?: boolean;
}
