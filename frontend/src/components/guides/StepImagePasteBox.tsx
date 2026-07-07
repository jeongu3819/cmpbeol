import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_WIDTH = 180;
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
 * - 영역을 클릭해 focus 한 뒤 Ctrl+V 로 캡처 이미지를 붙여넣는다. (유일한 입력 방식)
 * - 파일 선택 / 드래그 업로드는 제공하지 않는다.
 * - 붙여넣은 이미지는 실제 크기에 맞게 표시되고, 우하단 핸들을 drag 해 표시 폭을 조절한다.
 */
export default function StepImagePasteBox({
  stepOrder,
  previewUrl,
  displayWidth,
  onImageChange,
  onImageRemove,
  onResize,
}: Props) {
  const ratioRef = useRef<number>(16 / 9); // naturalWidth / naturalHeight
  const rootRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const width = displayWidth ?? DEFAULT_WIDTH;

  const validate = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("이미지 파일만 붙여넣을 수 있습니다.");
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

  const startResize = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = width;
    const ratio = ratioRef.current || 16 / 9;
    // 카드 내부 너비를 넘어서 이미지를 키우지 않는다. (사이트가 밀리지 않도록)
    const maxWidth = Math.max(MIN_WIDTH, rootRef.current?.clientWidth ?? startWidth);

    const onMove = (e: MouseEvent) => {
      const next = Math.min(
        maxWidth,
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
    <Box ref={rootRef}>
      {previewUrl ? (
        // 이미지가 있으면 placeholder 박스를 없애고, 카드 폭 안에서 표시 크기를 조절한다.
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
              width,
              height: "auto",
              maxWidth: "100%",
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
        // 이미지가 없을 때만 고정 높이 placeholder 를 사용한다.
        <Box
          tabIndex={0}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{
            borderRadius: 2,
            border: "2px dashed",
            borderColor: focused ? "primary.main" : "divider",
            bgcolor: focused ? "#eff6ff" : "#f8fafc",
            outline: "none",
            transition: "border-color .15s, background-color .15s",
            cursor: "text",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <ContentPasteIcon sx={{ fontSize: 34, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            캡처 이미지를 여기에 붙여넣으세요
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Step 카드 선택 후 Ctrl+V
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
