import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Topbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          bgcolor: "background.default",
          minHeight: "100vh",
          // 카드 그리드가 화면 너비를 넘겨 가로 스크롤을 만들지 않도록 한다.
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
