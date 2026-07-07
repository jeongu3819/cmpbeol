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
  description?: string | null;
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

export function emptyStep(order: number): Step {
  return {
    step_order: order,
    description: "",
    images: [],
  };
}
