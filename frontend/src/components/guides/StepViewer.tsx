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
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StepFlowPreview from "./StepFlowPreview";
import { resolveImageUrl } from "../../api/guideApi";
import {
  DEFAULT_NEXT_LABEL,
  DEFAULT_NORMAL_LABEL,
} from "../../types/guide";
import type { Step } from "../../types/guide";

interface Props {
  steps: Step[];
}

type Ending = { type: "normal" | "final"; message: string } | null;

const FINAL_MESSAGE =
  "조치를 완료했습니다. 문제가 지속되면 상위 담당자에게 문의하세요.";

export default function StepViewer({ steps }: Props) {
  const ordered = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order),
    [steps]
  );
  const firstOrder = ordered[0]?.step_order ?? null;

  const [currentOrder, setCurrentOrder] = useState<number | null>(firstOrder);
  const [ending, setEnding] = useState<Ending>(null);

  const current = ordered.find((s) => s.step_order === currentOrder) ?? null;

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
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 3,
          bgcolor: ending.type === "normal" ? "#f0fdf4" : "#f8fafc",
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 56,
            color: ending.type === "normal" ? "#16a34a" : "#0f172a",
            mb: 1,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {ending.type === "normal" ? "조치 완료" : "가이드 종료"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, whiteSpace: "pre-wrap" }}>
          {ending.message}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ReplayIcon />}
          onClick={reset}
        >
          가이드 처음으로 돌아가기
        </Button>
      </Paper>
    );
  }

  if (!current) return null;

  const normalLabel = current.normal_label || DEFAULT_NORMAL_LABEL;
  const nextLabel = current.next_label || DEFAULT_NEXT_LABEL;
  const hasNext =
    current.next_step_order != null &&
    ordered.some((s) => s.step_order === current.next_step_order);

  const handleNormal = () => {
    setEnding({
      type: "normal",
      message:
        current.normal_result_text ||
        "정상으로 판단되어 추가 조치가 필요하지 않습니다.",
    });
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentOrder(current.next_step_order!);
    } else {
      setEnding({ type: "final", message: FINAL_MESSAGE });
    }
  };

  const images = current.images ?? [];

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
            Step {current.step_order}
            {current.step_title ? `. ${current.step_title}` : ""}
          </Typography>
        </Box>
        <Divider />

        <Box sx={{ p: 3 }}>
          {/* 이미지 영역 */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            {images.length > 0 ? (
              images.map((img) => (
                <Box
                  key={img.id}
                  component="img"
                  src={resolveImageUrl(img.image_url)}
                  alt={img.original_filename ?? "step"}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 360,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              ))
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
            <Typography sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
              {current.description}
            </Typography>
          )}

          {/* 주의사항 */}
          {current.caution && (
            <Alert
              icon={<WarningAmberIcon />}
              severity="warning"
              sx={{ mb: 2, whiteSpace: "pre-wrap" }}
            >
              {current.caution}
            </Alert>
          )}

          {/* 판단 질문 */}
          {current.decision_question && (
            <Box
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2,
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ color: "#1e3a8a" }}>
                {current.decision_question}
              </Typography>
            </Box>
          )}

          {/* 판단 버튼 */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleNormal}
              sx={{ py: 1.5, fontSize: 16 }}
            >
              {normalLabel}
            </Button>
            <Button
              fullWidth
              size="large"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              sx={{ py: 1.5, fontSize: 16, bgcolor: "#1e293b", "&:hover": { bgcolor: "#0f172a" } }}
            >
              {hasNext ? nextLabel : "조치 완료 / 종료"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
