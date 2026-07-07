import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { SIDEBAR_WIDTH } from "./Sidebar";

export default function Topbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/guides?q=${encodeURIComponent(q)}`);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="inherit"
      sx={{
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: `${SIDEBAR_WIDTH}px`,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box component="form" onSubmit={submitSearch} sx={{ flexGrow: 1, maxWidth: 480 }}>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="코드 / 제목 / 설비모델 전체 검색"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => navigate("/import")}
        >
          업로드
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/guides/new")}
        >
          새 가이드
        </Button>
      </Toolbar>
    </AppBar>
  );
}
