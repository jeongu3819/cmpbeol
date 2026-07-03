import { apiClient } from "./client";
import type { ImportType } from "../types/common";
import type {
  ImportConfirmPayload,
  ImportPreview,
  ImportResult,
} from "../types/import";

export async function previewImport(
  file: File,
  importType: ImportType
): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);
  form.append("import_type", importType);
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

export function templateDownloadUrl(
  importType: ImportType,
  format: "csv" | "xlsx"
): string {
  const type = importType === "ALARM" ? "alarm" : "interlock";
  return `${baseURL}/api/import/template/${type}?format=${format}`;
}
