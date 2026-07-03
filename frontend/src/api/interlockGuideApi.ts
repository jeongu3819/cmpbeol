import { apiClient } from "./client";
import type {
  InterlockGuide,
  InterlockGuideFilters,
  InterlockGuideInput,
  InterlockGuideList,
} from "../types/interlockGuide";

const BASE = "/api/interlock-guides";

export async function fetchInterlockGuides(
  filters: InterlockGuideFilters = {}
): Promise<InterlockGuideList> {
  const params: Record<string, string | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value as string | boolean;
    }
  });
  const { data } = await apiClient.get<InterlockGuideList>(BASE, { params });
  return data;
}

export async function fetchInterlockGuide(id: number): Promise<InterlockGuide> {
  const { data } = await apiClient.get<InterlockGuide>(`${BASE}/${id}`);
  return data;
}

export async function createInterlockGuide(
  payload: InterlockGuideInput
): Promise<InterlockGuide> {
  const { data } = await apiClient.post<InterlockGuide>(BASE, payload);
  return data;
}

export async function updateInterlockGuide(
  id: number,
  payload: Partial<InterlockGuideInput>
): Promise<InterlockGuide> {
  const { data } = await apiClient.put<InterlockGuide>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteInterlockGuide(
  id: number,
  hard = false
): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`, { params: { hard } });
}
