import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { fetchGuides, hardDeleteGuide } from "../api/guideApi";
import type { GuideFilters, GuideListItem } from "../types/guide";
import type { GuideType } from "../types/common";
import GuideTable from "../components/guides/GuideTable";
import NewGuideTypeDialog from "../components/guides/NewGuideTypeDialog";
import SearchInput from "../components/common/SearchInput";
import LoadingState from "../components/common/LoadingState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useToast } from "../components/common/ToastProvider";

type TabValue = "ALL" | GuideType;

export default function GuidesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TabValue>("ALL");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuideListItem | null>(null);
  const [filters, setFilters] = useState<GuideFilters>({
    q: searchParams.get("q") ?? "",
    equipment_model: "",
    process_area: "",
  });

  const queryFilters: GuideFilters = useMemo(
    () => ({
      ...filters,
      guide_type: tab === "ALL" ? "" : tab,
    }),
    [filters, tab]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["guides", queryFilters],
    queryFn: () => fetchGuides(queryFilters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hardDeleteGuide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      toast("삭제되었습니다.");
    },
    onSettled: () => setDeleteTarget(null),
  });

  const setField = (key: keyof GuideFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">트러블슈팅 가이드</Typography>
          <Typography variant="body2" color="text.secondary">
            설비모델별 알람/인터락 조치 가이드 · 총 {data?.total ?? 0}건
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => navigate("/import")}
          >
            CSV/XLSX 업로드
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewDialogOpen(true)}
          >
            새 가이드 등록
          </Button>
        </Stack>
      </Stack>

      <NewGuideTypeDialog
        open={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onSelect={(type) => {
          setNewDialogOpen(false);
          navigate(`/guides/new?type=${type}`);
        }}
      />

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v: TabValue) => setTab(v)}
          sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab label="전체" value="ALL" />
          <Tab label="알람" value="ALARM" />
          <Tab label="인터락" value="INTERLOCK" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SearchInput
                value={filters.q ?? ""}
                onChange={(v) => setField("q", v)}
                placeholder="코드 / 제목 / 설비모델 / 설명 검색"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                label="설비모델"
                size="small"
                fullWidth
                value={filters.equipment_model ?? ""}
                onChange={(e) => setField("equipment_model", e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                label="공정/Area"
                size="small"
                fullWidth
                value={filters.process_area ?? ""}
                onChange={(e) => setField("process_area", e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {isLoading ? (
        <LoadingState />
      ) : (
        <GuideTable rows={data?.items ?? []} onDelete={setDeleteTarget} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="이 가이드를 삭제할까요?"
        message="삭제하면 Step과 이미지도 함께 삭제됩니다."
        confirmText="삭제"
        confirmColor="error"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
