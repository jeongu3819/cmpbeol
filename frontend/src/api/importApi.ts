import { apiClient } from "./client";
import type {
  ImportConfirmPayload,
  ImportPreview,
  ImportResult,
} from "../types/import";

export async function previewImport(file: File): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<ImportPreview>(
    "/api/import/preview",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function confirmImport(
  payload: ImportConfirmPayload
): Promise<ImportResult> {
  const { data } = await apiClient.post<ImportResult>(
    "/api/import/confirm",
    payload
  );
  return data;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export function templateDownloadUrl(format: "csv" | "xlsx"): string {
  return `${baseURL}/api/import/template?format=${format}`;
}
