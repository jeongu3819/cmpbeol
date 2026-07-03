import Chip from "@mui/material/Chip";
import type { Severity } from "../../types/common";

const CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string }
> = {
  LOW: { label: "LOW", color: "#166534", bg: "#dcfce7" },
  MEDIUM: { label: "MEDIUM", color: "#92400e", bg: "#fef3c7" },
  HIGH: { label: "HIGH", color: "#9a3412", bg: "#ffedd5" },
  CRITICAL: { label: "CRITICAL", color: "#991b1b", bg: "#fee2e2" },
};

export default function SeverityChip({ severity }: { severity: Severity }) {
  const c = CONFIG[severity] ?? CONFIG.MEDIUM;
  return (
    <Chip
      label={c.label}
      size="small"
      sx={{
        color: c.color,
        backgroundColor: c.bg,
        fontWeight: 700,
        fontSize: 12,
      }}
    />
  );
}
