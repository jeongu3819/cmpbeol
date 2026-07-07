import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createGuide, fetchGuide, updateGuide } from "../api/guideApi";
import { extractErrorMessage } from "../api/client";
import GuideForm from "../components/guides/GuideForm";
import LoadingState from "../components/common/LoadingState";
import type { GuideInput } from "../types/guide";
import type { GuideType } from "../types/common";
import { guideTypeLabels } from "../types/common";

export default function GuideFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const queryType = searchParams.get("type") === "INTERLOCK" ? "INTERLOCK" : "ALARM";

  const { data, isLoading } = useQuery({
    queryKey: ["guide", guideId],
    queryFn: () => fetchGuide(guideId),
    enabled: isEdit && !Number.isNaN(guideId),
  });

  const mutation = useMutation({
    mutationFn: (payload: GuideInput) =>
      isEdit ? updateGuide(guideId, payload) : createGuide(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      queryClient.invalidateQueries({ queryKey: ["guide", saved.id] });
      navigate(`/guides/${saved.id}/edit`);
    },
  });

  if (isEdit && isLoading) return <LoadingState />;

  const effectiveType: GuideType = isEdit
    ? data?.guide_type ?? "ALARM"
    : queryType;
  const labels = guideTypeLabels(effectiveType);

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
        {isEdit ? labels.editPageTitle : labels.newPageTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        이미지와 설명을 Step 순서대로 추가해 주세요. 조회 화면에서는 정상 여부에
        따라 다음 Step으로 이동합니다.
      </Typography>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {extractErrorMessage(mutation.error)}
        </Alert>
      )}

      <GuideForm
        key={data?.id ?? `new-${effectiveType}`}
        guideType={effectiveType}
        initial={data}
        submitting={mutation.isPending}
        onSubmit={(payload) => mutation.mutate(payload)}
        onCancel={() => navigate(-1)}
      />
    </Box>
  );
}
