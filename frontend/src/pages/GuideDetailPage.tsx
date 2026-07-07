import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteGuide, fetchGuide } from "../api/guideApi";
import { extractErrorMessage } from "../api/client";
import GuideTypeBadge from "../components/guides/GuideTypeBadge";
import StepViewer from "../components/guides/StepViewer";
import LoadingState from "../components/common/LoadingState";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function GuideDetailPage() {
  const { id } = useParams();
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["guide", guideId],
    queryFn: () => fetchGuide(guideId),
    enabled: !Number.isNaN(guideId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGuide(guideId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      navigate("/guides");
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data)
    return <Alert severity="error">{extractErrorMessage(error)}</Alert>;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/guides")}>
          목록으로
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/guides/${guideId}/edit`)}
          >
            수정
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmOpen(true)}
          >
            비활성화
          </Button>
        </Stack>
      </Stack>

      {/* 상단 기본정보 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <GuideTypeBadge type={data.guide_type} size="medium" />
          <Typography variant="h5" fontWeight={700}>
            {data.code}
          </Typography>
          {!data.is_active && (
            <Chip label="비활성" size="small" color="default" />
          )}
        </Stack>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {data.title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip
            label={`설비모델: ${data.equipment_model}`}
            size="small"
            variant="outlined"
          />
          {data.process_area && (
            <Chip
              label={`공정/Area: ${data.process_area}`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        {data.summary && (
          <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {data.summary}
          </Typography>
        )}
      </Paper>

      {/* Step Flow Viewer */}
      <StepViewer steps={data.steps} />

      <ConfirmDialog
        open={confirmOpen}
        title="가이드 비활성화"
        message="이 트러블슈팅 가이드를 비활성화하시겠습니까? (목록에서 숨겨집니다)"
        confirmText="비활성화"
        confirmColor="error"
        onConfirm={() => {
          setConfirmOpen(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
