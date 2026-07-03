import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  createInterlockGuide,
  fetchInterlockGuide,
  updateInterlockGuide,
} from "../api/interlockGuideApi";
import { extractErrorMessage } from "../api/client";
import InterlockGuideForm from "../components/guides/InterlockGuideForm";
import LoadingState from "../components/common/LoadingState";
import type { InterlockGuideInput } from "../types/interlockGuide";

export default function InterlockGuideFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["interlock-guide", guideId],
    queryFn: () => fetchInterlockGuide(guideId),
    enabled: isEdit && !Number.isNaN(guideId),
  });

  const mutation = useMutation({
    mutationFn: (payload: InterlockGuideInput) =>
      isEdit
        ? updateInterlockGuide(guideId, payload)
        : createInterlockGuide(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["interlock-guides"] });
      queryClient.invalidateQueries({ queryKey: ["interlock-guide", saved.id] });
      navigate(`/interlocks/${saved.id}`);
    },
  });

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        뒤로
      </Button>
      <Typography variant="h5" gutterBottom>
        {isEdit ? "인터락 조치 가이드 수정" : "인터락 조치 가이드 등록"}
      </Typography>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {extractErrorMessage(mutation.error)}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <InterlockGuideForm
          initial={data}
          submitting={mutation.isPending}
          onSubmit={(payload) => mutation.mutate(payload)}
          onCancel={() => navigate(-1)}
        />
      </Paper>
    </Box>
  );
}
