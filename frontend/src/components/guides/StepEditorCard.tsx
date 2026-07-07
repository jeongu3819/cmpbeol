import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import StepImageUploader from "./StepImageUploader";
import type { Step, StepImage } from "../../types/guide";

interface Props {
  step: Step;
  index: number;
  total: number;
  otherOrders: number[];
  onChange: (patch: Partial<Step>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function StepEditorCard({
  step,
  index,
  total,
  otherOrders,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: Props) {
  const set =
    (key: keyof Step) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [key]: e.target.value } as Partial<Step>);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Step {step.step_order}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="위로">
            <span>
              <IconButton size="small" onClick={onMoveUp} disabled={index === 0}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="아래로">
            <span>
              <IconButton
                size="small"
                onClick={onMoveDown}
                disabled={index === total - 1}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="복사">
            <IconButton size="small" onClick={onDuplicate}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            label="단계 제목"
            fullWidth
            size="small"
            value={step.step_title ?? ""}
            onChange={set("step_title")}
            placeholder="예: 압력 상태 확인"
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="caption" color="text.secondary">
            이미지 첨부
          </Typography>
          <StepImageUploader
            stepId={step.id}
            images={step.images ?? []}
            onChange={(images: StepImage[]) => onChange({ images })}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="텍스트 설명 (확인해야 할 내용)"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={step.description ?? ""}
            onChange={set("description")}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="판단 질문"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={step.decision_question ?? ""}
            onChange={set("decision_question")}
            placeholder="예: 압력 값이 정상 범위인가요?"
          />
        </Grid>

        <Grid size={12}>
          <Divider textAlign="left">
            <Typography variant="caption" color="text.secondary">
              판단 결과 분기
            </Typography>
          </Divider>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="정상 버튼 문구"
            fullWidth
            size="small"
            value={step.normal_label ?? ""}
            onChange={set("normal_label")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="추가 판단 버튼 문구"
            fullWidth
            size="small"
            value={step.next_label ?? ""}
            onChange={set("next_label")}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="정상 선택 시 종료 메시지"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={step.normal_result_text ?? ""}
            onChange={set("normal_result_text")}
            placeholder="예: 정상으로 판단되어 추가 조치가 필요하지 않습니다."
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="추가 판단 시 이동할 Step"
            fullWidth
            size="small"
            value={step.next_step_order ?? ""}
            onChange={(e) =>
              onChange({
                next_step_order:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          >
            <MenuItem value="">없음 (마지막 단계 · 종료 안내)</MenuItem>
            {otherOrders.map((o) => (
              <MenuItem key={o} value={o}>
                Step {o}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={12}>
          <TextField
            label="주의사항"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={step.caution ?? ""}
            onChange={set("caution")}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
