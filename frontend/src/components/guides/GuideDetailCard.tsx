import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SeverityChip from "../common/SeverityChip";
import type { Severity } from "../../types/common";

export interface DetailField {
  label: string;
  value?: string | null;
  emphasize?: boolean; // 크게 강조 표시
}

interface Props {
  code: string;
  name: string;
  severity: Severity;
  equipmentName?: string | null;
  equipmentModel?: string | null;
  process?: string | null;
  category?: string | null;
  approvalRequired?: boolean;
  isActive?: boolean;
  tags?: string[] | null;
  caution?: string | null;
  fields: DetailField[];
}

function TextBlock({ field }: { field: DetailField }) {
  if (field.value == null || field.value === "") return null;
  return (
    <Box sx={{ mb: field.emphasize ? 2.5 : 2 }}>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 0.5, fontWeight: 700 }}
      >
        {field.label}
      </Typography>
      <Typography
        sx={{
          whiteSpace: "pre-wrap",
          fontSize: field.emphasize ? 17 : 14.5,
          lineHeight: 1.7,
          fontWeight: field.emphasize ? 600 : 400,
          bgcolor: field.emphasize ? "#eff6ff" : "transparent",
          border: field.emphasize ? "1px solid #bfdbfe" : "none",
          borderRadius: field.emphasize ? 2 : 0,
          p: field.emphasize ? 2 : 0,
        }}
      >
        {field.value}
      </Typography>
    </Box>
  );
}

export default function GuideDetailCard(props: Props) {
  const {
    code,
    name,
    severity,
    equipmentName,
    equipmentModel,
    process,
    category,
    approvalRequired,
    isActive,
    tags,
    caution,
    fields,
  } = props;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {/* 제목 영역 */}
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="h5">{code}</Typography>
        <SeverityChip severity={severity} />
        {approvalRequired && (
          <Chip
            icon={<VerifiedUserIcon />}
            label="승인 필요"
            size="small"
            color="warning"
            sx={{ fontWeight: 700 }}
          />
        )}
        {isActive === false && (
          <Chip label="비활성" size="small" variant="outlined" />
        )}
      </Stack>
      <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
        {name}
      </Typography>

      <Stack
        direction="row"
        spacing={3}
        sx={{ mt: 1.5, color: "text.secondary", flexWrap: "wrap" }}
      >
        {equipmentName && <span>설비명: {equipmentName}</span>}
        {equipmentModel && <span>설비 모델: {equipmentModel}</span>}
        {process && <span>공정: {process}</span>}
        {category && <span>카테고리: {category}</span>}
      </Stack>

      {tags && tags.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap">
          {tags.map((t) => (
            <Chip key={t} label={t} size="small" variant="outlined" />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2.5 }} />

      {/* 주의사항 warning box */}
      {caution && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>주의 사항</AlertTitle>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{caution}</Typography>
        </Alert>
      )}

      {/* 본문 */}
      {fields.map((f) => (
        <TextBlock key={f.label} field={f} />
      ))}
    </Paper>
  );
}
