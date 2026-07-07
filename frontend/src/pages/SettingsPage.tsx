import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import DownloadIcon from "@mui/icons-material/Download";
import { templateDownloadUrl } from "../api/importApi";

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        설정 / 샘플 양식
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        일괄 등록에 사용할 CSV / XLSX 샘플 양식을 다운로드할 수 있습니다.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          트러블슈팅 가이드 업로드 양식
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          필수 컬럼: guide_type, equipment_model, code, title, step1_description
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl("csv")}
          >
            CSV 다운로드
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={templateDownloadUrl("xlsx")}
          >
            XLSX 다운로드
          </Button>
        </Stack>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          업로드 안내
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>지원 형식: .csv, .xlsx</li>
            <li>guide_type 값은 ALARM 또는 INTERLOCK 이어야 합니다.</li>
            <li>
              필수 Step: step1_description (Step 1에서 확인할 내용)
            </li>
            <li>
              선택 컬럼: process_area, summary, step2_description ~
              step5_description
            </li>
            <li>
              같은 (구분 + 설비모델 + 코드) 조합이 이미 있으면 신규 등록 대신
              업데이트 처리됩니다.
            </li>
            <li>
              이미지는 업로드로 등록하지 않고, 저장 후 각 가이드 수정 화면에서
              Step별로 첨부합니다.
            </li>
          </ul>
        </Typography>
      </Paper>
    </Box>
  );
}
