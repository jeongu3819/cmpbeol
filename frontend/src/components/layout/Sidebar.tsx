import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SettingsIcon from "@mui/icons-material/Settings";

export const SIDEBAR_WIDTH = 240;

const NAV = [
  { to: "/guides", label: "트러블슈팅 가이드", icon: <MenuBookIcon /> },
  { to: "/import", label: "CSV/XLSX 업로드", icon: <UploadFileIcon /> },
  { to: "/settings", label: "설정", icon: <SettingsIcon /> },
];

export default function Sidebar() {
  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography variant="h6" color="primary" sx={{ lineHeight: 1.2 }}>
          트러블슈팅 가이드
        </Typography>
        <Typography variant="caption" color="text.secondary">
          설비모델별 조치 지식관리
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.active": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": { color: "primary.contrastText" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
