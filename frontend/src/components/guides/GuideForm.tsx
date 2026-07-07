import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import StepBuilder from "./StepBuilder";
import type { Guide, GuideInput, Step } from "../../types/guide";
import type { GuideType } from "../../types/common";

interface Props {
  initial?: Partial<Guide>;
  submitting?: boolean;
  onSubmit: (payload: GuideInput) => void;
  onCancel: () => void;
}

function toInput(initial?: Partial<Guide>): GuideInput {
  return {
    guide_type: initial?.guide_type ?? "ALARM",
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
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<GuideInput>(toInput(initial));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          기본 정보
        </Typography>

        <ToggleButtonGroup
          value={form.guide_type}
          exclusive
          size="small"
          onChange={(_, v: GuideType | null) =>
            v && setForm((f) => ({ ...f, guide_type: v }))
          }
          sx={{ mb: 2 }}
        >
          <ToggleButton value="ALARM">알람</ToggleButton>
          <ToggleButton value="INTERLOCK">인터락</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="설비모델 *"
              fullWidth
              size="small"
              value={form.equipment_model}
              onChange={set("equipment_model")}
              error={errors.equipment_model}
              helperText={errors.equipment_model ? "필수 항목입니다." : "예: Mirra, Ebara, LK, LKP"}
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
              label="코드 *"
              fullWidth
              size="small"
              value={form.code}
              onChange={set("code")}
              error={errors.code}
              helperText={errors.code ? "필수 항목입니다." : "알람/인터락 코드"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="제목 *"
              fullWidth
              size="small"
              value={form.title}
              onChange={set("title")}
              error={errors.title}
              helperText={errors.title ? "필수 항목입니다." : "알람명 / 인터락명"}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="요약 설명"
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
