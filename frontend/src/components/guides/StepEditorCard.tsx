import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import StepImagePasteBox from "./StepImagePasteBox";
import type { StepDraft } from "../../types/guide";

interface Props {
  step: StepDraft;
  index: number;
  total: number;
  onChange: (patch: Partial<StepDraft>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export default function StepEditorCard({
  step,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMoveLeft,
  onMoveRight,
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        // 폭은 이미지 크기에 따라 자연스럽게 커지고, 높이는 내용에 맞춰 확장된다.
        flex: "0 0 auto",
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        alignSelf: "flex-start",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Step {step.step_order}
        </Typography>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="왼쪽으로">
            <span>
              <IconButton size="small" onClick={onMoveLeft} disabled={index === 0}>
                <KeyboardArrowLeftIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="오른쪽으로">
            <span>
              <IconButton
                size="small"
                onClick={onMoveRight}
                disabled={index === total - 1}
              >
                <KeyboardArrowRightIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="복사">
            <IconButton size="small" onClick={onDuplicate}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={total <= 1 ? "최소 1개의 Step은 필요합니다" : "삭제"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
                disabled={total <= 1}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <StepImagePasteBox
        stepOrder={step.step_order}
        previewUrl={step.imagePreviewUrl}
        displayWidth={step.imageDisplayWidth}
        onImageChange={(file, previewUrl) =>
          onChange({
            imageFile: file,
            imagePreviewUrl: previewUrl,
            existingImageId: undefined,
          })
        }
        onImageRemove={() =>
          onChange({
            imageFile: undefined,
            imagePreviewUrl: undefined,
            existingImageId: undefined,
            imageDisplayWidth: undefined,
            imageDisplayHeight: undefined,
          })
        }
        onResize={(w, h) =>
          onChange({ imageDisplayWidth: w, imageDisplayHeight: h })
        }
      />

      <TextField
        fullWidth
        multiline
        minRows={3}
        sx={{ mt: 2 }}
        placeholder="이 단계에서 확인해야 할 내용을 입력하세요."
        value={step.description ?? ""}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </Paper>
  );
}
