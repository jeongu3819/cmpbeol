import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import StepEditorCard from "./StepEditorCard";
import EmptyState from "../common/EmptyState";
import { emptyStep } from "../../types/guide";
import type { Step } from "../../types/guide";

interface Props {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

/** 배열 위치(1-based) 기준으로 step_order 를 재부여한다. */
function renumber(steps: Step[]): Step[] {
  return steps.map((s, i) => ({ ...s, step_order: i + 1 }));
}

export default function StepBuilder({ steps, onChange }: Props) {
  const update = (next: Step[]) => onChange(renumber(next));

  const addStep = () => {
    update([...steps, emptyStep(steps.length + 1)]);
  };

  const patchStep = (index: number, patch: Partial<Step>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const deleteStep = (index: number) => {
    update(steps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index: number) => {
    const src = steps[index];
    const copy: Step = { ...src, id: undefined, images: [] };
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
        <Button size="small" startIcon={<AddIcon />} onClick={addStep}>
          Step 추가
        </Button>
      </Stack>

      {steps.length === 0 ? (
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
          <EmptyState message="아직 Step이 없습니다. 'Step 추가'로 이미지와 설명을 순서대로 쌓아보세요." />
        </Box>
      ) : (
        <Stack spacing={0}>
          {steps.map((step, index) => (
            <Box key={step.id ?? `new-${index}`}>
              <StepEditorCard
                step={step}
                index={index}
                total={steps.length}
                onChange={(patch) => patchStep(index, patch)}
                onDelete={() => deleteStep(index)}
                onDuplicate={() => duplicateStep(index)}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
              />
              {index < steps.length - 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                  <ArrowDownwardIcon sx={{ color: "text.disabled" }} />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {steps.length > 0 && (
        <Button
          sx={{ mt: 2 }}
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addStep}
        >
          Step 추가
        </Button>
      )}
    </Box>
  );
}
