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
  /** 미리보기 패널 최대 너비 (기본 420px). */
  maxWidth?: number;
  /** 미리보기 패널/이미지 최대 높이 (기본 260px). */
  maxHeight?: number;
  /** 미리보기 패널 최소 높이 (기본 180px). */
  minHeight?: number;
  /** 패널이 상위 컨테이너 높이에 맞춰 늘어나야 하면 true. */
  stretch?: boolean;
}

/**
 * 조회 화면 전용 Step 이미지 미리보기.
 * - 편집 화면의 저장된 표시 크기(display_width)를 그대로 쓰지 않고,
 *   모든 Step 을 동일한 썸네일 규칙으로 normalize 해서 보여준다.
 * - 이미지를 클릭하면 라이트박스 모달로 크게 볼 수 있다. (X / ESC / 바깥 클릭으로 닫기)
 * - 이미지가 없으면 "등록된 이미지가 없습니다." placeholder 를 표시한다.
 */
export default function StepImagePreview({
  imageUrl,
  alt = "step",
  maxWidth = 420,
  maxHeight = 260,
  minHeight = 180,
  stretch = false,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!imageUrl) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth,
          minHeight,
          height: stretch ? "100%" : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
          bgcolor: "#f1f5f9",
          border: "1px solid #e5e7eb",
          borderRadius: 5,
        }}
      >
        <ImageNotSupportedIcon sx={{ fontSize: 36, mb: 0.5 }} />
        <Typography variant="body2">등록된 이미지가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          width: "100%",
          maxWidth,
          minHeight,
          maxHeight: stretch ? undefined : maxHeight,
          height: stretch ? "100%" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 5,
          overflow: "hidden",
          cursor: "zoom-in",
          p: 2,
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          sx={{
            maxWidth: "100%",
            maxHeight,
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
