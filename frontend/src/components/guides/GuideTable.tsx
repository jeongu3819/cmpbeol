import { useNavigate } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import SeverityChip from "../common/SeverityChip";
import EmptyState from "../common/EmptyState";
import type { Severity } from "../../types/common";

export interface GuideRow {
  id: number;
  equipment_model?: string | null;
  code: string;
  name: string;
  severity: Severity;
  category?: string | null;
  action_method?: string | null;
  updated_at?: string | null;
}

interface Props {
  rows: GuideRow[];
  basePath: string; // "/alarms" | "/interlocks"
}

function truncate(text?: string | null, len = 50): string {
  if (!text) return "-";
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > len ? oneLine.slice(0, len) + "…" : oneLine;
}

function formatDate(dt?: string | null): string {
  if (!dt) return "-";
  return dt.slice(0, 10);
}

export default function GuideTable({ rows, basePath }: Props) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState message="등록된 조치 가이드가 없습니다." />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>설비 모델</TableCell>
            <TableCell>코드</TableCell>
            <TableCell>이름</TableCell>
            <TableCell>중요도</TableCell>
            <TableCell>카테고리</TableCell>
            <TableCell>조치방법 요약</TableCell>
            <TableCell>수정일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`${basePath}/${row.id}`)}
            >
              <TableCell>{row.equipment_model || "-"}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {row.code}
                </Typography>
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                <SeverityChip severity={row.severity} />
              </TableCell>
              <TableCell>{row.category || "-"}</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>
                {truncate(row.action_method)}
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatDate(row.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
