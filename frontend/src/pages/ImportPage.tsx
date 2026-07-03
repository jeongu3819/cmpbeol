import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import { confirmImport, previewImport, templateDownloadUrl } from "../api/importApi";
import { extractErrorMessage } from "../api/client";
import type { ImportType } from "../types/common";
import type { ImportPreview, ImportResult } from "../types/import";
import FileUploadBox from "../components/import/FileUploadBox";
import ImportPreviewTable from "../components/import/ImportPreviewTable";
import ImportResultSummary from "../components/import/ImportResultSummary";

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>("ALARM");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => previewImport(file, importType),
    onSuccess: (data) => {
      setPreview(data);
      setResult(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("미리보기 데이터가 없습니다.");
      const validRows = preview.rows
        .filter((r) => r.valid)
        .map((r) => r.data);
      return confirmImport({
        import_type: importType,
        filename: preview.filename,
        rows: validRows,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setPreview(null);
    },
  });

  const handleTypeChange = (_: unknown, value: ImportType | null) => {
    if (value) {
      setImportType(value);
      setPreview(null);
      setResult(null);
    }
  };

  const validCount = preview?.valid_rows ?? 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        파일 업로드 / 일괄 등록
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        CSV 또는 XLSX 파일로 알람/인터락 조치 가이드를 일괄 등록합니다. 같은 설비
        모델 + 코드 조합이 있으면 자동으로 업데이트됩니다.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          1. 업로드 타입 선택
        </Typography>
        <ToggleButtonGroup
          value={importType}
          exclusive
          onChange={handleTypeChange}
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="ALARM">알람 조치 가이드</ToggleButton>
          <ToggleButton value="INTERLOCK">인터락 조치 가이드</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl(importType, "csv")}
          >
            CSV 샘플 양식
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl(importType, "xlsx")}
          >
            XLSX 샘플 양식
          </Button>
        </Stack>

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
                총 {preview.total_rows}행 · 정상 {preview.valid_rows}행 · 오류{" "}
                {preview.invalid_rows}행
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
