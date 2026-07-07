export interface ImportPreviewRow {
  row_index: number;
  valid: boolean;
  action: "create" | "update" | "skip";
  errors: string[];
  data: Record<string, string>;
}

export interface ImportPreview {
  filename: string;
  columns: string[];
  required_columns: string[];
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  create_rows: number;
  update_rows: number;
  rows: ImportPreviewRow[];
}

export interface ImportConfirmPayload {
  filename: string;
  rows: Record<string, string>[];
}

export interface ImportResult {
  job_id: number;
  filename: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  created_rows: number;
  updated_rows: number;
  error_summary?: string | null;
}
