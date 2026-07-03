import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT = ".csv,.xlsx";

export default function FileUploadBox({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelected(file);
  };

  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      sx={{
        border: "2px dashed",
        borderColor: dragOver ? "primary.main" : "divider",
        borderRadius: 2,
        p: 5,
        textAlign: "center",
        bgcolor: dragOver ? "action.hover" : "background.paper",
        transition: "all 0.15s",
      }}
    >
      <UploadFileIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
      <Typography variant="body1" gutterBottom>
        파일을 여기로 드래그하거나 아래 버튼으로 선택하세요.
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        지원 형식: .csv, .xlsx
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        variant="outlined"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        파일 선택
      </Button>
      {fileName && (
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
          선택된 파일: {fileName}
        </Typography>
      )}
    </Box>
  );
}
