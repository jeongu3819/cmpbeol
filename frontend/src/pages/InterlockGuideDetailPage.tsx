import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  deleteInterlockGuide,
  fetchInterlockGuide,
} from "../api/interlockGuideApi";
import { extractErrorMessage } from "../api/client";
import GuideDetailCard from "../components/guides/GuideDetailCard";
import LoadingState from "../components/common/LoadingState";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function InterlockGuideDetailPage() {
  const { id } = useParams();
  const guideId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["interlock-guide", guideId],
    queryFn: () => fetchInterlockGuide(guideId),
    enabled: !Number.isNaN(guideId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInterlockGuide(guideId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interlock-guides"] });
      navigate("/interlocks");
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/interlocks")}
        >
          목록으로
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/interlocks/${guideId}/edit`)}
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

      <GuideDetailCard
        code={data.interlock_code}
        name={data.interlock_name}
        severity={data.severity}
        equipmentName={data.equipment_name}
        equipmentModel={data.equipment_model}
        process={data.process}
        category={data.category}
        approvalRequired={data.approval_required}
        isActive={data.is_active}
        tags={data.tags}
        caution={data.caution}
        fields={[
          { label: "내용 설명", value: data.interlock_description },
          { label: "발생 조건 (Trigger)", value: data.trigger_condition },
          { label: "발생 원인", value: data.cause },
          { label: "확인 사항", value: data.check_points },
          { label: "조치 방법", value: data.action_method, emphasize: true },
          { label: "단계별 조치", value: data.action_steps },
          { label: "리셋 조건", value: data.reset_condition },
          { label: "관련 부품", value: data.related_parts },
          { label: "담당팀", value: data.owner_team },
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="인터락 가이드 비활성화"
        message="이 인터락 조치 가이드를 비활성화하시겠습니까? (목록에서 숨겨집니다)"
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
