import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import import_service, schemas
from ..database import get_db

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/preview", response_model=schemas.ImportPreviewOut)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        df = import_service.parse_file(file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"파일 파싱 실패: {exc}")

    preview = import_service.build_preview(db, df)
    preview["filename"] = file.filename
    return preview


@router.post("/confirm", response_model=schemas.ImportResultOut)
def confirm_import(payload: schemas.ImportConfirmIn, db: Session = Depends(get_db)):
    return import_service.confirm_import(db, payload.filename, payload.rows)


@router.get("/template")
def template(format: str = "csv"):
    fmt = format.lower()
    if fmt not in ("csv", "xlsx"):
        raise HTTPException(status_code=400, detail="format은 csv 또는 xlsx 이어야 합니다.")

    df = import_service.build_template_df()
    base = "troubleshooting_template"

    if fmt == "xlsx":
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine="openpyxl")
        buffer.seek(0)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        return StreamingResponse(
            buffer,
            media_type=media,
            headers={"Content-Disposition": f'attachment; filename="{base}.xlsx"'},
        )

    csv_str = df.to_csv(index=False)
    data = ("﻿" + csv_str).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{base}.csv"'},
    )
