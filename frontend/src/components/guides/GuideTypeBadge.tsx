import Chip from "@mui/material/Chip";
import type { GuideType } from "../../types/common";

interface Props {
  type: GuideType;
  size?: "small" | "medium";
}

const CONFIG: Record<
  GuideType,
  { label: string; bg: string; color: string }
> = {
  ALARM: { label: "ALARM", bg: "#fff7ed", color: "#c2410c" },
  INTERLOCK: { label: "INTERLOCK", bg: "#fef2f2", color: "#b91c1c" },
};

export default function GuideTypeBadge({ type, size = "small" }: Props) {
  const c = CONFIG[type];
  return (
    <Chip
      label={c.label}
      size={size}
      sx={{
        bgcolor: c.bg,
        color: c.color,
        fontWeight: 700,
        borderRadius: 1.5,
        letterSpacing: 0.3,
      }}
    />
  );
}
