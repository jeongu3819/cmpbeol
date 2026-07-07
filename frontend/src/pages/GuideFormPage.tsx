import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  createGuideWithSteps,
  fetchGuide,
  updateGuideWithSteps,
} from "../api/guideApi";
import { extractErrorMessage } from "../api/client";
import GuideForm from "../components/guides/GuideForm";
import LoadingState from "../components/common/LoadingState";
import { useToast } from "../components/common/ToastProvider";
import type { GuideMeta, StepDraft } from "../types/guide";
import type { GuideType } from "../types/common";
import { guideTypeLabels } from "../types/common";

export default function GuideFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const queryType = searchParams.get("type") === "INTERLOCK" ? "INTERLOCK" : "ALARM";

  const { data, isLoading } = useQuery({
    queryKey: ["guide", guideId],
    queryFn: () => fetchGuide(guideId),
    enabled: isEdit && !Number.isNaN(guideId),
  });

  const mutation = useMutation({
    mutationFn: ({ meta, steps }: { meta: GuideMeta; steps: StepDraft[] }) =>
      isEdit
        ? updateGuideWithSteps(guideId, meta, steps)
        : createGuideWithSteps(meta, steps),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      queryClient.invalidateQueries({ queryKey: ["guide", saved.id] });
      if (isEdit) {
        toast("수정되었습니다.");
        navigate(`/guides/${saved.id}`);
      } else {
        toast("저장되었습니다.");
        navigate("/guides");
      }
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
        Step 카드에 캡처 이미지를 Ctrl+V로 붙여넣고 설명을 입력하세요. 이미지 크기는
        우하단 핸들로 조절할 수 있으며, 저장 시 한 번에 업로드됩니다.
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
        onSubmit={(meta, steps) => mutation.mutate({ meta, steps })}
        onCancel={() => navigate(-1)}
      />
    </Box>
  );
}
