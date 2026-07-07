import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import StepBuilder from "./StepBuilder";
import GuideTypeBadge from "./GuideTypeBadge";
import type { Guide, GuideInput, Step } from "../../types/guide";
import type { GuideType } from "../../types/common";
import { guideTypeLabels } from "../../types/common";

interface Props {
  /** 신규 등록 시 상단 모달에서 선택된 타입 (수정 시에는 initial 값 사용) */
  guideType?: GuideType;
  initial?: Partial<Guide>;
  submitting?: boolean;
  onSubmit: (payload: GuideInput) => void;
  onCancel: () => void;
}

function toInput(guideType: GuideType, initial?: Partial<Guide>): GuideInput {
  return {
    guide_type: initial?.guide_type ?? guideType,
    equipment_model: initial?.equipment_model ?? "",
    process_area: initial?.process_area ?? "",
    code: initial?.code ?? "",
    title: initial?.title ?? "",
    summary: initial?.summary ?? "",
    is_active: initial?.is_active ?? true,
    steps: initial?.steps ?? [],
  };
}

export default function GuideForm({
  guideType = "ALARM",
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<GuideInput>(toInput(guideType, initial));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const labels = guideTypeLabels(form.guide_type);

  const set =
    (key: keyof GuideInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setSteps = (steps: Step[]) => setForm((f) => ({ ...f, steps }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof GuideInput)[] = ["equipment_model", "code", "title"];
    const nextErrors: Record<string, boolean> = {};
    required.forEach((k) => {
      if (!String(form[k] ?? "").trim()) nextErrors[k] = true;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <GuideTypeBadge type={form.guide_type} size="medium" />
          <Typography variant="subtitle1" fontWeight={700}>
            {labels.type} 기본 정보
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="설비모델 *"
              fullWidth
              size="small"
              value={form.equipment_model}
              onChange={set("equipment_model")}
              error={errors.equipment_model}
              helperText={
                errors.equipment_model ? "필수 항목입니다." : "예: Mirra, Ebara, LK, LKP"
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="공정 / Area"
              fullWidth
              size="small"
              value={form.process_area ?? ""}
              onChange={set("process_area")}
              placeholder="예: CMP"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`${labels.code} *`}
              fullWidth
              size="small"
              value={form.code}
              onChange={set("code")}
              error={errors.code}
              helperText={errors.code ? "필수 항목입니다." : undefined}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`${labels.title} *`}
              fullWidth
              size="small"
              value={form.title}
              onChange={set("title")}
              error={errors.title}
              helperText={errors.title ? "필수 항목입니다." : undefined}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={labels.summary}
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={form.summary ?? ""}
              onChange={set("summary")}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <StepBuilder steps={form.steps} onChange={setSteps} />
      </Paper>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button onClick={onCancel}>취소</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          저장
        </Button>
      </Box>
    </Box>
  );
}
