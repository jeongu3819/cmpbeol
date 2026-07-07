import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import {
  confirmImport,
  previewImport,
  templateDownloadUrl,
} from "../api/importApi";
import { extractErrorMessage } from "../api/client";
import type { ImportPreview, ImportResult } from "../types/import";
import FileUploadBox from "../components/import/FileUploadBox";
import ImportPreviewTable from "../components/import/ImportPreviewTable";
import ImportResultSummary from "../components/import/ImportResultSummary";

export default function ImportPage() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => previewImport(file),
    onSuccess: (data) => {
      setPreview(data);
      setResult(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("미리보기 데이터가 없습니다.");
      const validRows = preview.rows.filter((r) => r.valid).map((r) => r.data);
      return confirmImport({ filename: preview.filename, rows: validRows });
    },
    onSuccess: (data) => {
      setResult(data);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["guides"] });
    },
  });

  const validCount = preview?.valid_rows ?? 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        CSV / XLSX 일괄 업로드
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        기본정보와 Step 텍스트를 한 번에 등록합니다. 같은 (구분 + 설비모델 + 코드)
        조합이 있으면 자동으로 업데이트됩니다. 이미지는 저장 후 각 가이드 수정
        화면에서 Step별로 첨부하세요.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          1. 샘플 양식 다운로드
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl("csv")}
          >
            CSV 양식
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl("xlsx")}
          >
            XLSX 양식
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          필수 컬럼: guide_type, equipment_model, code, title · 선택: process_area,
          summary, step1~3_title / _description / _question / _normal_result /
          _caution
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          2. 파일 선택
        </Typography>
        <FileUploadBox
          onFileSelected={(file) => previewMutation.mutate(file)}
          disabled={previewMutation.isPending}
        />

        {previewMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {extractErrorMessage(previewMutation.error)}
          </Alert>
        )}
      </Paper>

      {preview && (
        <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="subtitle1">3. 미리보기 및 검증</Typography>
              <Typography variant="body2" color="text.secondary">
                총 {preview.total_rows}행 · 신규 {preview.create_rows} · 업데이트{" "}
                {preview.update_rows} · 오류 {preview.invalid_rows}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={validCount === 0 || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              DB에 저장 ({validCount}행)
            </Button>
          </Stack>

          <ImportPreviewTable preview={preview} />

          {confirmMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {extractErrorMessage(confirmMutation.error)}
            </Alert>
          )}
        </Paper>
      )}

      {result && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <ImportResultSummary result={result} />
        </Paper>
      )}
    </Box>
  );
}
