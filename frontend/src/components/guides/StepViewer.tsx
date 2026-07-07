import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReplayIcon from "@mui/icons-material/Replay";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import StepFlowPreview from "./StepFlowPreview";
import StepImagePreview from "./StepImagePreview";
import { resolveImageUrl } from "../../api/guideApi";
import type { Step } from "../../types/guide";

interface Props {
  steps: Step[];
}

type Ending = { type: "done" | "escalate" } | null;

const DONE_MESSAGE = "조치가 완료되었습니다.";
const ESCALATE_MESSAGE =
  "추가 확인이 필요합니다. 담당자 또는 상위 엔지니어에게 문의하세요.";

export default function StepViewer({ steps }: Props) {
  const ordered = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order),
    [steps]
  );
  const firstOrder = ordered[0]?.step_order ?? null;

  const [currentOrder, setCurrentOrder] = useState<number | null>(firstOrder);
  const [ending, setEnding] = useState<Ending>(null);

  const currentIndex = ordered.findIndex((s) => s.step_order === currentOrder);
  const current = currentIndex >= 0 ? ordered[currentIndex] : null;

  const reset = () => {
    setEnding(null);
    setCurrentOrder(firstOrder);
  };

  if (ordered.length === 0) {
    return (
      <Alert severity="info">
        등록된 조치 Step이 없습니다. 수정 화면에서 Step을 추가하세요.
      </Alert>
    );
  }

  if (ending) {
    const isDone = ending.type === "done";
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 3,
          bgcolor: isDone ? "#f0fdf4" : "#fffbeb",
        }}
      >
        {isDone ? (
          <CheckCircleIcon sx={{ fontSize: 56, color: "#16a34a", mb: 1 }} />
        ) : (
          <SupportAgentIcon sx={{ fontSize: 56, color: "#b45309", mb: 1 }} />
        )}
        <Typography variant="h6" gutterBottom>
          {isDone ? "조치 완료" : "추가 확인 필요"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isDone ? DONE_MESSAGE : ESCALATE_MESSAGE}
        </Typography>
        <Button variant="contained" startIcon={<ReplayIcon />} onClick={reset}>
          처음으로 돌아가기
        </Button>
      </Paper>
    );
  }

  if (!current) return null;

  const isLast = currentIndex === ordered.length - 1;

  const handleDone = () => setEnding({ type: "done" });

  const handleNext = () => {
    if (!isLast) {
      setCurrentOrder(ordered[currentIndex + 1].step_order);
    } else {
      setEnding({ type: "escalate" });
    }
  };

  const image = current.images?.[0] ?? null;

  return (
    <Box>
      <StepFlowPreview
        steps={ordered}
        currentOrder={current.step_order}
        onSelect={(o) => {
          setEnding(null);
          setCurrentOrder(o);
        }}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", mt: 1 }}>
        <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc" }}>
          <Typography variant="h6" fontWeight={700}>
            Step {current.step_order} / {ordered.length}
          </Typography>
        </Box>
        <Divider />

        <Box
          sx={{
            p: 3,
            // PC: 왼쪽 이미지 / 오른쪽 설명+버튼 2컬럼, 태블릿/모바일: 세로 배치
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(320px, 42%) 1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "stretch",
          }}
        >
          {/* 왼쪽: 이미지 미리보기 (모든 Step 동일 규칙, 클릭 시 확대) */}
          <StepImagePreview
            imageUrl={image ? resolveImageUrl(image.image_url) : null}
            alt={image?.original_filename ?? `Step ${current.step_order}`}
            maxWidth={520}
            maxHeight={320}
            minHeight={320}
            stretch
          />

          {/* 오른쪽: 확인 내용 + 판단 버튼 */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              minWidth: 0,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                확인 내용
              </Typography>
              <Box
                sx={{
                  bgcolor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  p: 2.5,
                  minHeight: 180,
                  fontSize: 16,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  color: current.description ? "text.primary" : "text.disabled",
                }}
              >
                {current.description || "등록된 설명이 없습니다."}
              </Box>
            </Box>

            {/* 판단 버튼: PC 는 2열, 모바일은 1열 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleDone}
                sx={{ py: 1.5, fontSize: 16 }}
              >
                정상 / 조치 완료
              </Button>
              <Button
                fullWidth
                size="large"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                sx={{
                  py: 1.5,
                  fontSize: 16,
                  bgcolor: "#1e293b",
                  "&:hover": { bgcolor: "#0f172a" },
                }}
              >
                추가 정보 필요
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
