import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LockIcon from "@mui/icons-material/Lock";
import type { GuideType } from "../../types/common";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: GuideType) => void;
}

const OPTIONS: {
  type: GuideType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    type: "ALARM",
    label: "알람 가이드",
    description: "Alarm Code 기준 조치 방법을 등록합니다.",
    icon: <NotificationsActiveIcon />,
    color: "#c2410c",
  },
  {
    type: "INTERLOCK",
    label: "인터락 가이드",
    description: "Interlock Code 기준 조치 방법을 등록합니다.",
    icon: <LockIcon />,
    color: "#b91c1c",
  },
];

export default function NewGuideTypeDialog({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>어떤 가이드를 등록할까요?</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {OPTIONS.map((o) => (
            <Paper
              key={o.type}
              variant="outlined"
              onClick={() => onSelect(o.type)}
              sx={{
                p: 2,
                borderRadius: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "border-color .15s, background-color .15s",
                "&:hover": { borderColor: o.color, bgcolor: "#f8fafc" },
              }}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  color: o.color,
                  bgcolor: `${o.color}14`,
                }}
              >
                {o.icon}
              </Stack>
              <div>
                <Typography fontWeight={700}>{o.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {o.description}
                </Typography>
              </div>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
      </DialogActions>
    </Dialog>
  );
}
