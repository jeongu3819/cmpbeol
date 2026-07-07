import { useNavigate } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import EmptyState from "../common/EmptyState";
import GuideTypeBadge from "./GuideTypeBadge";
import type { GuideListItem } from "../../types/guide";

interface Props {
  rows: GuideListItem[];
}

function formatDate(dt?: string | null): string {
  if (!dt) return "-";
  return dt.slice(0, 10);
}

export default function GuideTable({ rows }: Props) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState message="등록된 트러블슈팅 가이드가 없습니다." />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>구분</TableCell>
            <TableCell>설비모델</TableCell>
            <TableCell>공정/Area</TableCell>
            <TableCell>코드</TableCell>
            <TableCell>제목</TableCell>
            <TableCell align="center">Step 수</TableCell>
            <TableCell>수정일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/guides/${row.id}`)}
            >
              <TableCell>
                <GuideTypeBadge type={row.guide_type} />
              </TableCell>
              <TableCell>{row.equipment_model || "-"}</TableCell>
              <TableCell>{row.process_area || "-"}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {row.code}
                </Typography>
              </TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell align="center">
                <Chip label={row.step_count} size="small" variant="outlined" />
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
