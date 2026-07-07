import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  deleteStepImage,
  resolveImageUrl,
  uploadStepImage,
} from "../../api/guideApi";
import { extractErrorMessage } from "../../api/client";
import type { StepImage } from "../../types/guide";

interface Props {
  stepId?: number;
  images: StepImage[];
  onChange: (images: StepImage[]) => void;
}

/**
 * Step 카드의 이미지 첨부 영역.
 * 초기 버전에서는 Step 당 이미지 1장을 크게 보여준다.
 */
export default function StepImageUploader({ stepId, images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = images[0] ?? null;

  const handleFile = async (file?: File | null) => {
    if (!file || !stepId) return;
    setUploading(true);
    setError(null);
    try {
      const img = await uploadStepImage(stepId, file);
      // 초기 버전은 1장만 유지 (기존 이미지는 교체)
      onChange([img]);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: number) => {
    setError(null);
    try {
      await deleteStepImage(imageId);
      onChange(images.filter((i) => i.id !== imageId));
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const openPicker = () => {
    if (!stepId || uploading) return;
    inputRef.current?.click();
  };

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {image ? (
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#f8fafc",
          }}
        >
          <Box
            component="img"
            src={resolveImageUrl(image.image_url)}
            alt={image.original_filename ?? "step"}
            sx={{
              display: "block",
              width: "100%",
              maxHeight: 320,
              objectFit: "contain",
            }}
          />
          <IconButton
            size="small"
            onClick={() => handleDelete(image.id)}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box
          onClick={openPicker}
          sx={{
            height: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            borderRadius: 2,
            border: "2px dashed",
            borderColor: stepId ? "divider" : "action.disabledBackground",
            bgcolor: "#f8fafc",
            color: "text.secondary",
            cursor: stepId && !uploading ? "pointer" : "default",
            transition: "border-color .15s, background-color .15s",
            "&:hover":
              stepId && !uploading
                ? { borderColor: "primary.main", bgcolor: "#f1f5f9" }
                : undefined,
          }}
        >
          {uploading ? (
            <CircularProgress size={28} />
          ) : (
            <>
              <AddPhotoAlternateIcon sx={{ fontSize: 36 }} />
              <Typography variant="body2">
                {stepId
                  ? "이미지를 첨부해 주세요"
                  : "가이드를 저장하면 이미지를 첨부할 수 있습니다"}
              </Typography>
            </>
          )}
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
