import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import StepEditorCard from "./StepEditorCard";
import { emptyStepDraft, newClientId } from "../../types/guide";
import type { StepDraft } from "../../types/guide";

interface Props {
  steps: StepDraft[];
  onChange: (steps: StepDraft[]) => void;
}

/** 배열 위치(1-based) 기준으로 step_order 를 재부여한다. */
function renumber(steps: StepDraft[]): StepDraft[] {
  return steps.map((s, i) => ({ ...s, step_order: i + 1 }));
}

export default function StepBuilder({ steps, onChange }: Props) {
  const update = (next: StepDraft[]) => onChange(renumber(next));

  // 최소 1개의 Step 은 항상 보이도록 보호한다. (사용자가 모두 지워도 Step 1 복원)
  useEffect(() => {
    if (steps.length === 0) {
      onChange([emptyStepDraft(1)]);
    }
  }, [steps.length, onChange]);

  const addStep = () => {
    update([...steps, emptyStepDraft(steps.length + 1)]);
  };

  const patchStep = (index: number, patch: Partial<StepDraft>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const deleteStep = (index: number) => {
    if (steps.length <= 1) return; // 최소 1개 유지
    update(steps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index: number) => {
    const src = steps[index];
    // 이미지 파일/미리보기는 그대로 복제하되, 서버 식별자는 새 카드로 취급한다.
    const copy: StepDraft = {
      ...src,
      clientId: newClientId(),
      id: undefined,
      existingImageId: undefined,
    };
    const next = [...steps];
    next.splice(index + 1, 0, copy);
    update(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          조치 Step
        </Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addStep}>
          Step 추가
        </Button>
      </Stack>

      {/* 가로 스크롤 대신 화면 너비에 맞춰 자동으로 줄바꿈되는 카드 그리드 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
          gap: 3,
          alignItems: "start",
          width: "100%",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        {steps.map((step, index) => (
          <StepEditorCard
            key={step.clientId}
            step={step}
            index={index}
            total={steps.length}
            onChange={(patch) => patchStep(index, patch)}
            onDelete={() => deleteStep(index)}
            onDuplicate={() => duplicateStep(index)}
            onMoveLeft={() => move(index, -1)}
            onMoveRight={() => move(index, 1)}
          />
        ))}
      </Box>
    </Box>
  );
}
