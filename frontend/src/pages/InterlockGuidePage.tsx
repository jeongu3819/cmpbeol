import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { fetchInterlockGuides } from "../api/interlockGuideApi";
import type { InterlockGuideFilters } from "../types/interlockGuide";
import { SEVERITY_OPTIONS } from "../types/common";
import GuideTable, { GuideRow } from "../components/guides/GuideTable";
import SearchInput from "../components/common/SearchInput";
import LoadingState from "../components/common/LoadingState";

export default function InterlockGuidePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<InterlockGuideFilters>({
    search: searchParams.get("search") ?? "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["interlock-guides", filters],
    queryFn: () => fetchInterlockGuides(filters),
  });

  const rows: GuideRow[] = useMemo(
    () =>
      (data?.items ?? []).map((g) => ({
        id: g.id,
        equipment_model: g.equipment_model,
        code: g.interlock_code,
        name: g.interlock_name,
        severity: g.severity,
        category: g.category,
        action_method: g.action_method,
        updated_at: g.updated_at,
      })),
    [data]
  );

  const setField = (key: keyof InterlockGuideFilters, value: string) =>
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
          <Typography variant="h5">인터락 조치 가이드</Typography>
          <Typography variant="body2" color="text.secondary">
            총 {data?.total ?? 0}건
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/interlocks/new")}
        >
          인터락 등록
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SearchInput
              value={filters.search ?? ""}
              onChange={(v) => setField("search", v)}
              placeholder="인터락명 / 코드 / 조치방법 검색"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="설비명"
              size="small"
              fullWidth
              value={filters.equipment_name ?? ""}
              onChange={(e) => setField("equipment_name", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              label="설비 모델"
              size="small"
              fullWidth
              value={filters.equipment_model ?? ""}
              onChange={(e) => setField("equipment_model", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              label="공정"
              size="small"
              fullWidth
              value={filters.process ?? ""}
              onChange={(e) => setField("process", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              label="인터락 코드"
              size="small"
              fullWidth
              value={filters.interlock_code ?? ""}
              onChange={(e) => setField("interlock_code", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              select
              label="중요도"
              size="small"
              fullWidth
              value={filters.severity ?? ""}
              onChange={(e) => setField("severity", e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              {SEVERITY_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              label="카테고리"
              size="small"
              fullWidth
              value={filters.category ?? ""}
              onChange={(e) => setField("category", e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <LoadingState />
      ) : (
        <GuideTable rows={rows} basePath="/interlocks" />
      )}
    </Box>
  );
}
