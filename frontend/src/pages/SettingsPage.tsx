import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import DownloadIcon from "@mui/icons-material/Download";
import { templateDownloadUrl } from "../api/importApi";

function TemplateCard({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: "ALARM" | "INTERLOCK";
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          href={templateDownloadUrl(type, "csv")}
        >
          CSV 다운로드
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          href={templateDownloadUrl(type, "xlsx")}
        >
          XLSX 다운로드
        </Button>
      </Stack>
    </Paper>
  );
}

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        설정 / 샘플 양식
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        일괄 등록에 사용할 CSV / XLSX 샘플 양식을 다운로드할 수 있습니다.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TemplateCard
            title="알람 조치 가이드 양식"
            description="필수 컬럼: equipment_model, alarm_code, alarm_name, action_method"
            type="ALARM"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TemplateCard
            title="인터락 조치 가이드 양식"
            description="필수 컬럼: equipment_model, interlock_code, interlock_name, action_method"
            type="INTERLOCK"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          업로드 안내
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>지원 형식: .csv, .xlsx</li>
            <li>tags 컬럼은 세미콜론(;) 또는 콤마(,)로 여러 값을 구분합니다.</li>
            <li>
              severity 값은 LOW / MEDIUM / HIGH / CRITICAL 중 하나여야 합니다.
            </li>
            <li>
              approval_required(인터락)는 true/false, 1/0, yes/no 로 입력합니다.
            </li>
            <li>
              같은 설비 모델 + 코드 조합이 이미 있으면 신규 등록 대신 업데이트
              처리됩니다.
            </li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
}
