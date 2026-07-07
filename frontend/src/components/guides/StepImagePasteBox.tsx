import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_WIDTH = 160;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 320;

interface Props {
  stepOrder: number;
  previewUrl?: string;
  displayWidth?: number;
  onImageChange: (file: File, previewUrl: string) => void;
  onImageRemove: () => void;
  onResize: (width: number, height: number) => void;
}

/**
 * Step 이미지 입력 영역.
 * - Ctrl+V 붙여넣기 (가장 중요)
 * - 드래그앤드롭
 * - 클릭 후 파일 선택
 * 붙여넣은 이미지는 미리보기로 표시되고, 우하단 핸들을 drag 해 표시 크기를 조절할 수 있다.
 */
export default function StepImagePasteBox({
  stepOrder,
  previewUrl,
  displayWidth,
  onImageChange,
  onImageRemove,
  onResize,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ratioRef = useRef<number>(16 / 9); // naturalWidth / naturalHeight
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);

  const width = displayWidth ?? DEFAULT_WIDTH;

  const validate = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("이미지 파일만 첨부할 수 있습니다.");
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError("이미지 크기는 10MB 이하만 가능합니다.");
      return false;
    }
    setError(null);
    return true;
  };

  const acceptFile = (file: File) => {
    if (!validate(file)) return;
    const url = URL.createObjectURL(file);
    onImageChange(file, url);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (!blob) return;
        const file = new File([blob], `pasted-step-${stepOrder}.png`, {
          type: blob.type || "image/png",
        });
        acceptFile(file);
        event.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = width;
    const ratio = ratioRef.current || 16 / 9;

    const onMove = (e: MouseEvent) => {
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, Math.round(startWidth + (e.clientX - startX)))
      );
      onResize(next, Math.round(next / ratio));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) acceptFile(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      <Box
        tabIndex={0}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!previewUrl) inputRef.current?.click();
        }}
        sx={{
          position: "relative",
          borderRadius: 2,
          border: "2px dashed",
          borderColor: dragOver
            ? "primary.main"
            : focused
            ? "primary.light"
            : "divider",
          bgcolor: dragOver ? "#eff6ff" : "#f8fafc",
          outline: "none",
          transition: "border-color .15s, background-color .15s",
          cursor: previewUrl ? "default" : "pointer",
          minHeight: previewUrl ? undefined : 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: previewUrl ? 1 : 2,
        }}
      >
        {previewUrl ? (
          <Box sx={{ position: "relative", width, maxWidth: "100%" }}>
            <Box
              component="img"
              src={previewUrl}
              alt={`step-${stepOrder}`}
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalHeight > 0) {
                  ratioRef.current = el.naturalWidth / el.naturalHeight;
                }
              }}
              sx={{
                display: "block",
                width: "100%",
                height: "auto",
                borderRadius: 1,
                userSelect: "none",
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove();
              }}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            {/* 우하단 크기 조절 핸들 */}
            <Box
              onMouseDown={startResize}
              sx={{
                position: "absolute",
                right: -4,
                bottom: -4,
                width: 18,
                height: 18,
                borderRadius: "3px",
                bgcolor: "primary.main",
                border: "2px solid #fff",
                cursor: "nwse-resize",
                boxShadow: 1,
              }}
            />
          </Box>
        ) : (
          <>
            <ContentPasteIcon sx={{ fontSize: 34, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              이미지 붙여넣기, 드래그 또는 클릭
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              캡처 후 Ctrl+V로 바로 넣을 수 있습니다.
            </Typography>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
