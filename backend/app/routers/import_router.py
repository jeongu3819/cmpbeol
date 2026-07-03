import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import import_service, schemas
from ..database import get_db

router = APIRouter(prefix="/api/import", tags=["import"])

VALID_TYPES = {"ALARM", "INTERLOCK"}


@router.post("/preview", response_model=schemas.ImportPreviewOut)
async def preview_import(
    file: UploadFile = File(...),
    import_type: str = Form(...),
):
    import_type = import_type.upper()
    if import_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="import_type은 ALARM 또는 INTERLOCK 이어야 합니다.")

    content = await file.read()
    try:
        df = import_service.parse_file(file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"파일 파싱 실패: {exc}")

    preview = import_service.build_preview(import_type, df)
    preview["filename"] = file.filename
    return preview


@router.post("/confirm", response_model=schemas.ImportResultOut)
def confirm_import(payload: schemas.ImportConfirmIn, db: Session = Depends(get_db)):
    import_type = payload.import_type.upper()
    if import_type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="import_type은 ALARM 또는 INTERLOCK 이어야 합니다.")
    result = import_service.confirm_import(db, import_type, payload.filename, payload.rows)
    return result


def _template_response(import_type: str, fmt: str) -> StreamingResponse:
    df = import_service.build_template_df(import_type)
    base = f"{import_type.lower()}_template"

    if fmt == "xlsx":
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine="openpyxl")
        buffer.seek(0)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{base}.xlsx"
        return StreamingResponse(
            buffer,
            media_type=media,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # 기본 CSV (UTF-8 BOM: Excel 한글 호환)
    csv_str = df.to_csv(index=False)
    data = ("﻿" + csv_str).encode("utf-8")
    filename = f"{base}.csv"
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/template/alarm")
def template_alarm(format: str = "csv"):
    fmt = format.lower()
    if fmt not in ("csv", "xlsx"):
        raise HTTPException(status_code=400, detail="format은 csv 또는 xlsx 이어야 합니다.")
    return _template_response("ALARM", fmt)


@router.get("/template/interlock")
def template_interlock(format: str = "csv"):
    fmt = format.lower()
    if fmt not in ("csv", "xlsx"):
        raise HTTPException(status_code=400, detail="format은 csv 또는 xlsx 이어야 합니다.")
    return _template_response("INTERLOCK", fmt)
