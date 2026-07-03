import { apiClient } from "./client";
import type {
  AlarmGuide,
  AlarmGuideFilters,
  AlarmGuideInput,
  AlarmGuideList,
} from "../types/alarmGuide";

const BASE = "/api/alarm-guides";

export async function fetchAlarmGuides(
  filters: AlarmGuideFilters = {}
): Promise<AlarmGuideList> {
  const params: Record<string, string | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value as string | boolean;
    }
  });
  const { data } = await apiClient.get<AlarmGuideList>(BASE, { params });
  return data;
}

export async function fetchAlarmGuide(id: number): Promise<AlarmGuide> {
  const { data } = await apiClient.get<AlarmGuide>(`${BASE}/${id}`);
  return data;
}

export async function createAlarmGuide(
  payload: AlarmGuideInput
): Promise<AlarmGuide> {
  const { data } = await apiClient.post<AlarmGuide>(BASE, payload);
  return data;
}

export async function updateAlarmGuide(
  id: number,
  payload: Partial<AlarmGuideInput>
): Promise<AlarmGuide> {
  const { data } = await apiClient.put<AlarmGuide>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteAlarmGuide(id: number, hard = false): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`, { params: { hard } });
}
