import { apiClient } from "./client";
import type {
  Guide,
  GuideFilters,
  GuideInput,
  GuideList,
  GuideMeta,
  StepDraft,
  StepImage,
} from "../types/guide";
import { newClientId } from "../types/guide";

const BASE = "/api/guides";

export async function fetchGuides(
  filters: GuideFilters = {}
): Promise<GuideList> {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value as string;
    }
  });
  const { data } = await apiClient.get<GuideList>(BASE, { params });
  return data;
}

export async function fetchGuide(id: number): Promise<Guide> {
  const { data } = await apiClient.get<Guide>(`${BASE}/${id}`);
  return data;
}

export async function createGuide(payload: GuideInput): Promise<Guide> {
  const { data } = await apiClient.post<Guide>(BASE, payload);
  return data;
}

export async function updateGuide(
  id: number,
  payload: Partial<GuideInput>
): Promise<Guide> {
  const { data } = await apiClient.put<Guide>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteGuide(id: number, hard = false): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`, { params: { hard } });
}

// --- Guide + Step + 이미지를 한 번에 저장 (multipart) ---

interface StepImagePayload {
  mode: "new" | "existing" | "none";
  file_index?: number;
  existing_image_id?: number;
  display_width?: number | null;
  display_height?: number | null;
}

interface StepPayload {
  client_step_id: string;
  id?: number;
  step_order: number;
  description: string;
  image: StepImagePayload;
}

/** guide 기본정보 + step 초안 + step 이미지 파일을 하나의 FormData 로 만든다. */
function buildGuideForm(meta: GuideMeta, steps: StepDraft[]): FormData {
  const form = new FormData();
  form.append("guide_data", JSON.stringify(meta));

  const stepsPayload: StepPayload[] = [];
  let fileIndex = 0;

  steps.forEach((s, i) => {
    let image: StepImagePayload;
    if (s.imageFile) {
      form.append("images", s.imageFile, s.imageFile.name);
      image = {
        mode: "new",
        file_index: fileIndex,
        display_width: s.imageDisplayWidth ?? null,
        display_height: s.imageDisplayHeight ?? null,
      };
      fileIndex += 1;
    } else if (s.existingImageId) {
      image = {
        mode: "existing",
        existing_image_id: s.existingImageId,
        display_width: s.imageDisplayWidth ?? null,
        display_height: s.imageDisplayHeight ?? null,
      };
    } else {
      image = { mode: "none" };
    }

    stepsPayload.push({
      client_step_id: s.clientId,
      id: s.id,
      step_order: i + 1,
      description: s.description ?? "",
      image,
    });
  });

  form.append("steps_data", JSON.stringify(stepsPayload));
  return form;
}

export async function createGuideWithSteps(
  meta: GuideMeta,
  steps: StepDraft[]
): Promise<Guide> {
  const { data } = await apiClient.post<Guide>(
    `${BASE}/with-steps`,
    buildGuideForm(meta, steps),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function updateGuideWithSteps(
  id: number,
  meta: GuideMeta,
  steps: StepDraft[]
): Promise<Guide> {
  const { data } = await apiClient.put<Guide>(
    `${BASE}/${id}/with-steps`,
    buildGuideForm(meta, steps),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

/** 서버에서 불러온 Guide 를 편집용 StepDraft 목록으로 변환한다. */
export function guideToStepDrafts(guide?: Partial<Guide>): StepDraft[] {
  return (guide?.steps ?? []).map((s, i) => {
    const img = s.images?.[0];
    return {
      clientId: newClientId(),
      id: s.id,
      step_order: s.step_order ?? i + 1,
      description: s.description ?? "",
      existingImageId: img?.id,
      imagePreviewUrl: img ? resolveImageUrl(img.image_url) : undefined,
      imageDisplayWidth: img?.display_width ?? undefined,
      imageDisplayHeight: img?.display_height ?? undefined,
    };
  });
}

// --- Step 이미지 (레거시: 저장 후 개별 첨부) ---
export async function uploadStepImage(
  stepId: number,
  file: File
): Promise<StepImage> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<StepImage>(
    `/api/steps/${stepId}/images`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deleteStepImage(imageId: number): Promise<void> {
  await apiClient.delete(`/api/step-images/${imageId}`);
}

const assetBaseURL = import.meta.env.VITE_API_BASE_URL || "";

/** /uploads 로 시작하는 상대 이미지 경로를 완전한 URL 로 변환 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${assetBaseURL}${url}`;
}
