import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  createAlarmGuide,
  fetchAlarmGuide,
  updateAlarmGuide,
} from "../api/alarmGuideApi";
import { extractErrorMessage } from "../api/client";
import AlarmGuideForm from "../components/guides/AlarmGuideForm";
import LoadingState from "../components/common/LoadingState";
import type { AlarmGuideInput } from "../types/alarmGuide";

export default function AlarmGuideFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["alarm-guide", guideId],
    queryFn: () => fetchAlarmGuide(guideId),
    enabled: isEdit && !Number.isNaN(guideId),
  });

  const mutation = useMutation({
    mutationFn: (payload: AlarmGuideInput) =>
      isEdit ? updateAlarmGuide(guideId, payload) : createAlarmGuide(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["alarm-guides"] });
      queryClient.invalidateQueries({ queryKey: ["alarm-guide", saved.id] });
      navigate(`/alarms/${saved.id}`);
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
        {isEdit ? "알람 조치 가이드 수정" : "알람 조치 가이드 등록"}
      </Typography>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {extractErrorMessage(mutation.error)}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <AlarmGuideForm
          initial={data}
          submitting={mutation.isPending}
          onSubmit={(payload) => mutation.mutate(payload)}
          onCancel={() => navigate(-1)}
        />
      </Paper>
    </Box>
  );
}
