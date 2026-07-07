import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

interface Props {
  imageUrl?: string | null;
  alt?: string;
}

/**
 * 조회 화면 전용 Step 이미지 미리보기.
 * - 편집 화면의 저장된 표시 크기(display_width)를 그대로 쓰지 않고,
 *   모든 Step 을 동일한 썸네일 규칙(max 420x260)으로 normalize 해서 보여준다.
 * - 이미지를 클릭하면 라이트박스 모달로 크게 볼 수 있다. (X / ESC / 바깥 클릭으로 닫기)
 * - 이미지가 없으면 높이가 크게 튀지 않는 간단한 placeholder 를 표시한다.
 */
export default function StepImagePreview({ imageUrl, alt = "step" }: Props) {
  const [open, setOpen] = useState(false);

  if (!imageUrl) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          bgcolor: "#f1f5f9",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
        }}
      >
        <ImageNotSupportedIcon sx={{ fontSize: 36, mb: 0.5 }} />
        <Typography variant="body2">첨부 이미지 없음</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          width: "100%",
          maxWidth: 420,
          minHeight: 180,
          maxHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          overflow: "hidden",
          cursor: "zoom-in",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          sx={{
            maxWidth: "100%",
            maxHeight: 260,
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>

      {/* 클릭 확대 라이트박스: onClose 가 ESC 와 배경 클릭을 모두 처리한다. */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            m: 0,
            overflow: "visible",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            p: 2,
            bgcolor: "rgba(15, 23, 42, 0.96)",
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={() => setOpen(false)}
            aria-label="닫기"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.4)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imageUrl}
            alt={alt}
            sx={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              display: "block",
              m: "0 auto",
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}
