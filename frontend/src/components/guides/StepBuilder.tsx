import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StepEditorCard from "./StepEditorCard";
import EmptyState from "../common/EmptyState";
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

  const addStep = () => {
    update([...steps, emptyStepDraft(steps.length + 1)]);
  };

  const patchStep = (index: number, patch: Partial<StepDraft>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const deleteStep = (index: number) => {
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

      {steps.length === 0 ? (
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
          <EmptyState message="아직 Step이 없습니다. 'Step 추가'로 이미지와 설명을 순서대로 배치해 보세요." />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 2,
            overflowX: "auto",
            pb: 1.5,
          }}
        >
          {steps.map((step, index) => (
            <Box
              key={step.clientId}
              sx={{ display: "flex", alignItems: "stretch", gap: 2 }}
            >
              <StepEditorCard
                step={step}
                index={index}
                total={steps.length}
                onChange={(patch) => patchStep(index, patch)}
                onDelete={() => deleteStep(index)}
                onDuplicate={() => duplicateStep(index)}
                onMoveLeft={() => move(index, -1)}
                onMoveRight={() => move(index, 1)}
              />
              {index < steps.length - 1 && (
                <Box sx={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
                  <KeyboardArrowRightIcon sx={{ color: "text.disabled", fontSize: 32 }} />
                </Box>
              )}
            </Box>
          ))}

          {/* 오른쪽 끝 Step 추가 */}
          <Box sx={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addStep}
              sx={{ height: 80, whiteSpace: "nowrap" }}
            >
              Step 추가
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
