import { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { SEVERITY_OPTIONS } from "../../types/common";
import type { AlarmGuide, AlarmGuideInput } from "../../types/alarmGuide";

interface Props {
  initial?: Partial<AlarmGuide>;
  submitting?: boolean;
  onSubmit: (payload: AlarmGuideInput) => void;
  onCancel: () => void;
}

function toInput(initial?: Partial<AlarmGuide>): AlarmGuideInput {
  return {
    equipment_name: initial?.equipment_name ?? "",
    equipment_model: initial?.equipment_model ?? "",
    process: initial?.process ?? "",
    area: initial?.area ?? "",
    alarm_code: initial?.alarm_code ?? "",
    alarm_name: initial?.alarm_name ?? "",
    alarm_description: initial?.alarm_description ?? "",
    severity: initial?.severity ?? "MEDIUM",
    category: initial?.category ?? "",
    cause: initial?.cause ?? "",
    check_points: initial?.check_points ?? "",
    action_method: initial?.action_method ?? "",
    action_steps: initial?.action_steps ?? "",
    caution: initial?.caution ?? "",
    related_parts: initial?.related_parts ?? "",
    owner_team: initial?.owner_team ?? "",
    tags: initial?.tags ?? [],
    is_active: initial?.is_active ?? true,
  };
}

export default function AlarmGuideForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<AlarmGuideInput>(toInput(initial));
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const set = (key: keyof AlarmGuideInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof AlarmGuideInput)[] = [
      "equipment_model",
      "alarm_code",
      "alarm_name",
      "action_method",
    ];
    const nextErrors: Record<string, boolean> = {};
    required.forEach((k) => {
      if (!String(form[k] ?? "").trim()) nextErrors[k] = true;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ ...form, tags });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle1" gutterBottom>
        기본 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="설비 모델 *"
            fullWidth
            size="small"
            value={form.equipment_model ?? ""}
            onChange={set("equipment_model")}
            error={errors.equipment_model}
            helperText={errors.equipment_model ? "필수 항목입니다." : ""}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="설비명"
            fullWidth
            size="small"
            value={form.equipment_name ?? ""}
            onChange={set("equipment_name")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="알람 코드 *"
            fullWidth
            size="small"
            value={form.alarm_code}
            onChange={set("alarm_code")}
            error={errors.alarm_code}
            helperText={errors.alarm_code ? "필수 항목입니다." : ""}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="알람명 *"
            fullWidth
            size="small"
            value={form.alarm_name}
            onChange={set("alarm_name")}
            error={errors.alarm_name}
            helperText={errors.alarm_name ? "필수 항목입니다." : ""}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="공정"
            fullWidth
            size="small"
            value={form.process ?? ""}
            onChange={set("process")}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="Area"
            fullWidth
            size="small"
            value={form.area ?? ""}
            onChange={set("area")}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            select
            label="중요도"
            fullWidth
            size="small"
            value={form.severity}
            onChange={set("severity")}
          >
            {SEVERITY_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="카테고리"
            fullWidth
            size="small"
            value={form.category ?? ""}
            onChange={set("category")}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" gutterBottom>
        조치 내용
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            label="알람 설명"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={form.alarm_description ?? ""}
            onChange={set("alarm_description")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="발생 원인"
            fullWidth
            size="small"
            multiline
            minRows={3}
            value={form.cause ?? ""}
            onChange={set("cause")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="확인 사항"
            fullWidth
            size="small"
            multiline
            minRows={3}
            value={form.check_points ?? ""}
            onChange={set("check_points")}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="조치 방법 *"
            fullWidth
            size="small"
            multiline
            minRows={3}
            value={form.action_method ?? ""}
            onChange={set("action_method")}
            error={errors.action_method}
            helperText={errors.action_method ? "필수 항목입니다." : ""}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="단계별 조치"
            fullWidth
            size="small"
            multiline
            minRows={3}
            value={form.action_steps ?? ""}
            onChange={set("action_steps")}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="주의 사항"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={form.caution ?? ""}
            onChange={set("caution")}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" gutterBottom>
        참고 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="관련 부품"
            fullWidth
            size="small"
            value={form.related_parts ?? ""}
            onChange={set("related_parts")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="담당팀"
            fullWidth
            size="small"
            value={form.owner_team ?? ""}
            onChange={set("owner_team")}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="태그 (콤마로 구분)"
            fullWidth
            size="small"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="slurry, flow"
          />
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
            }
            label="활성 상태"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button onClick={onCancel}>취소</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          저장
        </Button>
      </Box>
    </Box>
  );
}
