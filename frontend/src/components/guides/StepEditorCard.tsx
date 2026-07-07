import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
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
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: Props) {
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

      <StepImageUploader
        stepId={step.id}
        images={step.images ?? []}
        onChange={(images: StepImage[]) => onChange({ images })}
      />

      <TextField
        fullWidth
        multiline
        minRows={2}
        sx={{ mt: 2 }}
        placeholder="이 단계에서 확인해야 할 내용을 입력하세요."
        value={step.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </Paper>
  );
}
