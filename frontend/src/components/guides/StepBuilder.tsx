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

/**
 * step_order 를 배열 위치(1-based)로 재부여하고,
 * next_step_order 참조를 객체 정체성 기준으로 재매핑한다.
 */
function normalize(steps: Step[]): Step[] {
  const byOldOrder = new Map<number, Step>();
  steps.forEach((s) => byOldOrder.set(s.step_order, s));
  const targets = steps.map((s) =>
    s.next_step_order != null ? byOldOrder.get(s.next_step_order) ?? null : null
  );

  return steps.map((s, i) => {
    const target = targets[i];
    let nextOrder: number | null = null;
    if (target) {
      const idx = steps.indexOf(target);
      if (idx >= 0) nextOrder = idx + 1;
    }
    return { ...s, step_order: i + 1, next_step_order: nextOrder };
  });
}

export default function StepBuilder({ steps, onChange }: Props) {
  const update = (next: Step[]) => onChange(normalize(next));

  const addStep = () => {
    const next = [...steps];
    const newStep = emptyStep(next.length + 1);
    // 직전 step 이 마지막(next 없음)이었다면 새 step 으로 연결
    if (next.length > 0 && next[next.length - 1].next_step_order == null) {
      next[next.length - 1] = {
        ...next[next.length - 1],
        next_step_order: next.length + 1,
      };
    }
    next.push(newStep);
    update(next);
  };

  const patchStep = (index: number, patch: Partial<Step>) => {
    const next = steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    // next_step_order 는 직접 유효값을 지정하므로 normalize 재매핑 없이 반영
    onChange(next.map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const deleteStep = (index: number) => {
    update(steps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index: number) => {
    const src = steps[index];
    const copy: Step = {
      ...src,
      id: undefined,
      images: [],
      next_step_order: null,
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

  const orders = steps.map((s) => s.step_order);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          조치 Step 구성
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addStep}>
          Step 추가
        </Button>
      </Stack>

      {steps.length === 0 ? (
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
          <EmptyState message="아직 Step이 없습니다. 'Step 추가'로 조치 단계를 만들어 보세요." />
        </Box>
      ) : (
        <Stack spacing={0}>
          {steps.map((step, index) => (
            <Box key={index}>
              <StepEditorCard
                step={step}
                index={index}
                total={steps.length}
                otherOrders={orders.filter((o) => o !== step.step_order)}
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
