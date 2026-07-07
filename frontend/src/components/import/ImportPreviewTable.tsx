import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import type { ImportPreview } from "../../types/import";

interface Props {
  preview: ImportPreview;
}

export default function ImportPreviewTable({ preview }: Props) {
  // 표시 컬럼: 필수 컬럼 + 파일 내 존재 컬럼 (중복 제거)
  const displayCols = Array.from(
    new Set([...preview.required_columns, ...preview.columns])
  );

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 70 }}>상태</TableCell>
            <TableCell sx={{ minWidth: 80 }}>처리</TableCell>
            <TableCell sx={{ minWidth: 40 }}>#</TableCell>
            {displayCols.map((c) => (
              <TableCell key={c} sx={{ whiteSpace: "nowrap" }}>
                {c}
                {preview.required_columns.includes(c) && (
                  <span style={{ color: "#dc2626" }}> *</span>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {preview.rows.map((row) => (
            <TableRow
              key={row.row_index}
              sx={{
                bgcolor: row.valid ? "transparent" : "#fef2f2",
              }}
            >
              <TableCell>
                {row.valid ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="정상"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Tooltip title={row.errors.join("\n")}>
                    <Chip
                      icon={<ErrorIcon />}
                      label="오류"
                      size="small"
                      color="error"
                    />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                {row.valid ? (
                  <Chip
                    label={row.action === "update" ? "업데이트" : "신규"}
                    size="small"
                    color={row.action === "update" ? "secondary" : "primary"}
                    variant="outlined"
                  />
                ) : (
                  <Chip label="제외" size="small" variant="outlined" />
                )}
              </TableCell>
              <TableCell>{row.row_index + 1}</TableCell>
              {displayCols.map((c) => {
                const isMissingRequired =
                  preview.required_columns.includes(c) &&
                  !String(row.data[c] ?? "").trim();
                return (
                  <TableCell
                    key={c}
                    sx={{
                      whiteSpace: "nowrap",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: isMissingRequired ? "error.main" : "inherit",
                      fontWeight: isMissingRequired ? 700 : 400,
                    }}
                  >
                    {isMissingRequired
                      ? "(누락)"
                      : String(row.data[c] ?? "")}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {preview.rows.some((r) => !r.valid) && (
        <Box sx={{ p: 1.5, bgcolor: "#fef2f2", fontSize: 13, color: "#991b1b" }}>
          오류가 있는 행은 저장 시 제외됩니다. 필수 컬럼: {" "}
          {preview.required_columns.join(", ")}
        </Box>
      )}
    </TableContainer>
  );
}
