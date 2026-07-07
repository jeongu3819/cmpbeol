import type { GuideType } from "./common";

export interface StepImage {
  id: number;
  image_url: string;
  original_filename?: string | null;
  sort_order: number;
}

export interface Step {
  id?: number;
  step_order: number;
  step_title?: string | null;
  description?: string | null;
  decision_question?: string | null;
  normal_label?: string | null;
  normal_result_text?: string | null;
  next_label?: string | null;
  next_step_order?: number | null;
  caution?: string | null;
  images?: StepImage[];
}

export interface Guide {
  id: number;
  guide_type: GuideType;
  equipment_model: string;
  process_area?: string | null;
  code: string;
  title: string;
  summary?: string | null;
  is_active: boolean;
  steps: Step[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GuideListItem {
  id: number;
  guide_type: GuideType;
  equipment_model: string;
  process_area?: string | null;
  code: string;
  title: string;
  summary?: string | null;
  is_active: boolean;
  step_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GuideList {
  total: number;
  items: GuideListItem[];
}

export interface GuideInput {
  guide_type: GuideType;
  equipment_model: string;
  process_area?: string | null;
  code: string;
  title: string;
  summary?: string | null;
  is_active: boolean;
  steps: Step[];
}

export interface GuideFilters {
  guide_type?: GuideType | "";
  equipment_model?: string;
  process_area?: string;
  q?: string;
}

export const DEFAULT_NORMAL_LABEL = "정상 / 조치 완료";
export const DEFAULT_NEXT_LABEL = "추가 판단 필요";

export function emptyStep(order: number): Step {
  return {
    step_order: order,
    step_title: "",
    description: "",
    decision_question: "",
    normal_label: DEFAULT_NORMAL_LABEL,
    normal_result_text: "",
    next_label: DEFAULT_NEXT_LABEL,
    next_step_order: null,
    caution: "",
    images: [],
  };
}
