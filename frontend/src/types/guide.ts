import type { GuideType } from "./common";

export interface StepImage {
  id: number;
  image_url: string;
  original_filename?: string | null;
  display_width?: number | null;
  display_height?: number | null;
  sort_order: number;
}

export interface Step {
  id?: number;
  step_order: number;
  description?: string | null;
  images?: StepImage[];
}

/**
 * 등록/수정 화면에서 다루는 Step 초안.
 * 저장 전에는 이미지를 서버에 올리지 않고 frontend 상태(File + preview URL)로 보관한다.
 */
export interface StepDraft {
  clientId: string; // frontend 임시 id
  id?: number; // 수정 시 기존 step id
  step_order: number;
  description: string;
  imageFile?: File; // 새로 붙여넣기/드롭/선택한 파일
  imagePreviewUrl?: string; // objectURL 또는 기존 이미지 URL
  existingImageId?: number; // 수정 시 유지할 기존 이미지 id
  imageDisplayWidth?: number;
  imageDisplayHeight?: number;
}

export interface GuideMeta {
  guide_type: GuideType;
  equipment_model: string;
  process_area?: string | null;
  code: string;
  title: string;
  summary?: string | null;
  is_active: boolean;
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

let draftSeq = 0;

export function newClientId(): string {
  draftSeq += 1;
  return `step-${Date.now()}-${draftSeq}`;
}

export function emptyStepDraft(order: number): StepDraft {
  return {
    clientId: newClientId(),
    step_order: order,
    description: "",
  };
}
