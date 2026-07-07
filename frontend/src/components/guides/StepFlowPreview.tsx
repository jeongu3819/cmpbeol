import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { Step } from "../../types/guide";

interface Props {
  steps: Step[];
  currentOrder?: number | null;
  onSelect?: (order: number) => void;
}

export default function StepFlowPreview({
  steps,
  currentOrder,
  onSelect,
}: Props) {
  if (steps.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        py: 1,
      }}
    >
      {steps.map((step, idx) => {
        const active = currentOrder === step.step_order;
        return (
          <Box
            key={step.step_order}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Chip
              label={`Step ${step.step_order}`}
              size="small"
              onClick={onSelect ? () => onSelect(step.step_order) : undefined}
              variant={active ? "filled" : "outlined"}
              color={active ? "primary" : "default"}
              sx={{
                fontWeight: active ? 700 : 500,
                cursor: onSelect ? "pointer" : "default",
                maxWidth: 220,
              }}
            />
            {idx < steps.length - 1 && (
              <ArrowForwardIcon
                fontSize="small"
                sx={{ color: "text.disabled" }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
