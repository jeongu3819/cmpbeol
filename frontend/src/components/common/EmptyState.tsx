import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/Inbox";

export default function EmptyState({
  message = "데이터가 없습니다.",
}: {
  message?: string;
}) {
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "text.secondary",
      }}
    >
      <InboxIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
