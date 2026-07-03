import type { ImportType } from "./common";

export interface ImportPreviewRow {
  row_index: number;
  valid: boolean;
  errors: string[];
  data: Record<string, string>;
}

export interface ImportPreview {
  import_type: ImportType;
  filename: string;
  columns: string[];
  required_columns: string[];
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  rows: ImportPreviewRow[];
}

export interface ImportConfirmPayload {
  import_type: ImportType;
  filename: string;
  rows: Record<string, string>[];
}

export interface ImportResult {
  job_id: number;
  import_type: ImportType;
  filename: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  created_rows: number;
  updated_rows: number;
  error_summary?: string | null;
}
