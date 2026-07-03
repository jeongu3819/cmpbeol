import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import type { ImportResult } from "../../types/import";

interface Props {
  result: ImportResult;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function ImportResultSummary({ result }: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        업로드 결과 — {result.filename}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <StatCard label="총 행 수" value={result.total_rows} color="#0f172a" />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <StatCard label="성공" value={result.success_rows} color="#16a34a" />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <StatCard label="신규 생성" value={result.created_rows} color="#2563eb" />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <StatCard label="업데이트" value={result.updated_rows} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <StatCard label="실패" value={result.failed_rows} color="#dc2626" />
        </Grid>
      </Grid>

      {result.error_summary && (
        <Alert severity="warning" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
          {result.error_summary}
        </Alert>
      )}
    </Box>
  );
}
