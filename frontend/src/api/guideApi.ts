import { apiClient } from "./client";
import type {
  Guide,
  GuideFilters,
  GuideInput,
  GuideList,
  StepImage,
} from "../types/guide";

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

// --- Step 이미지 ---
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
