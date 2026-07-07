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
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { deleteGuide, hardDeleteGuide, fetchGuide } from "../api/guideApi";
import { extractErrorMessage } from "../api/client";
import GuideTypeBadge from "../components/guides/GuideTypeBadge";
import StepViewer from "../components/guides/StepViewer";
import LoadingState from "../components/common/LoadingState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useToast } from "../components/common/ToastProvider";

export default function GuideDetailPage() {
  const { id } = useParams();
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["guide", guideId],
    queryFn: () => fetchGuide(guideId),
    enabled: !Number.isNaN(guideId),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deleteGuide(guideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      toast("비활성화되었습니다.");
      navigate("/guides");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => hardDeleteGuide(guideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      toast("삭제되었습니다.");
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
            color="warning"
            startIcon={<VisibilityOffIcon />}
            onClick={() => setDeactivateOpen(true)}
          >
            비활성화
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            삭제
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
        open={deactivateOpen}
        title="이 가이드를 비활성화할까요?"
        message="비활성화하면 기본 목록에서 보이지 않습니다."
        confirmText="비활성화"
        confirmColor="error"
        onConfirm={() => {
          setDeactivateOpen(false);
          deactivateMutation.mutate();
        }}
        onCancel={() => setDeactivateOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="이 가이드를 삭제할까요?"
        message="삭제하면 Step과 이미지도 함께 삭제됩니다."
        confirmText="삭제"
        confirmColor="error"
        onConfirm={() => {
          setDeleteOpen(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
