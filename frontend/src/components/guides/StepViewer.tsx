import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReplayIcon from "@mui/icons-material/Replay";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import StepFlowPreview from "./StepFlowPreview";
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

        <Box sx={{ p: 3 }}>
          {/* 이미지 영역 */}
          <Box sx={{ mb: 2 }}>
            {image ? (
              <Box
                component="img"
                src={resolveImageUrl(image.image_url)}
                alt={image.original_filename ?? "step"}
                sx={{
                  display: "block",
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f8fafc",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 200,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.disabled",
                  bgcolor: "#f1f5f9",
                  borderRadius: 2,
                }}
              >
                <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 0.5 }} />
                <Typography variant="body2">이미지 없음</Typography>
              </Box>
            )}
          </Box>

          {/* 텍스트 설명 */}
          {current.description && (
            <Typography sx={{ mb: 2.5, whiteSpace: "pre-wrap", fontSize: 16 }}>
              {current.description}
            </Typography>
          )}

          {/* 판단 버튼 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
