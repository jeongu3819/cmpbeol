import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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

export default function StepImageUploader({ stepId, images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file || !stepId) return;
    setUploading(true);
    setError(null);
    try {
      const img = await uploadStepImage(stepId, file);
      onChange([...images, img]);
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

  if (!stepId) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        가이드를 먼저 저장하면 이 Step에 이미지를 첨부할 수 있습니다.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
        {images.map((img) => (
          <Box
            key={img.id}
            sx={{
              position: "relative",
              width: 96,
              height: 96,
              borderRadius: 1.5,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <img
              src={resolveImageUrl(img.image_url)}
              alt={img.original_filename ?? "step"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <IconButton
              size="small"
              onClick={() => handleDelete(img.id)}
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                bgcolor: "rgba(0,0,0,0.55)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={
          uploading ? <CircularProgress size={16} /> : <AddPhotoAlternateIcon />
        }
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        이미지 첨부
      </Button>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ ml: 1 }}
      >
        판단에 필요한 이미지를 첨부하세요.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
