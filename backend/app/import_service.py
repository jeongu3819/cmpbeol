"""CSV/XLSX 파싱, 검증, 일괄 저장 로직."""
import io
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from . import import_config as cfg
from .models import AlarmGuide, ImportJob, InterlockGuide


def parse_file(filename: str, content: bytes) -> pd.DataFrame:
    """CSV 또는 XLSX 파일 바이트를 DataFrame으로 파싱."""
    name = (filename or "").lower()
    if name.endswith(".csv"):
        # BOM 및 인코딩 대응
        try:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False, encoding="cp949")
    elif name.endswith(".xlsx") or name.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(content), dtype=str, engine="openpyxl")
        df = df.fillna("")
    else:
        raise ValueError("지원하지 않는 파일 형식입니다. .csv 또는 .xlsx 파일을 업로드하세요.")

    # 컬럼명 공백 제거
    df.columns = [str(c).strip() for c in df.columns]
    return df


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_row(import_type: str, raw: dict[str, Any]) -> dict[str, Any]:
    """양식 컬럼만 추려서 정규화된 dict 반환 (문자열 기준)."""
    columns = cfg.get_columns(import_type)
    row: dict[str, Any] = {}
    for col in columns:
        row[col] = _clean(raw.get(col, ""))
    return row


def validate_row(import_type: str, row: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for col in cfg.get_required(import_type):
        if not _clean(row.get(col)):
            errors.append(f"필수 컬럼 누락: {col}")

    severity = _clean(row.get("severity"))
    if severity and severity.upper() not in cfg.SEVERITY_VALUES:
        errors.append(f"severity 값 오류: {severity} (허용: {', '.join(cfg.SEVERITY_VALUES)})")

    return errors


def build_preview(import_type: str, df: pd.DataFrame) -> dict[str, Any]:
    required = cfg.get_required(import_type)
    file_columns = list(df.columns)

    rows = []
    valid_count = 0
    for idx, record in enumerate(df.to_dict(orient="records")):
        row = normalize_row(import_type, record)
        errors = validate_row(import_type, row)
        # 파일 자체에 필수 컬럼 헤더가 없는 경우도 표시
        missing_headers = [c for c in required if c not in file_columns]
        for mh in missing_headers:
            msg = f"파일에 필수 컬럼 헤더 없음: {mh}"
            if msg not in errors:
                errors.append(msg)
        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1
        rows.append(
            {
                "row_index": idx,
                "valid": is_valid,
                "errors": errors,
                "data": row,
            }
        )

    return {
        "import_type": import_type,
        "columns": file_columns,
        "required_columns": required,
        "total_rows": len(rows),
        "valid_rows": valid_count,
        "invalid_rows": len(rows) - valid_count,
        "rows": rows,
    }


def _coerce_value(col: str, value: Any) -> Any:
    text = _clean(value)
    if col in cfg.BOOL_COLUMNS:
        return text.lower() in ("1", "true", "yes", "y", "t", "o")
    if col in cfg.LIST_COLUMNS:
        if not text:
            return None
        # 세미콜론 또는 콤마 구분
        sep = ";" if ";" in text else ","
        return [t.strip() for t in text.split(sep) if t.strip()]
    if col == "severity":
        return text.upper() if text else None
    return text if text else None


def _to_model_kwargs(import_type: str, row: dict[str, Any]) -> dict[str, Any]:
    columns = cfg.get_columns(import_type)
    kwargs: dict[str, Any] = {}
    for col in columns:
        kwargs[col] = _coerce_value(col, row.get(col))
    # 필수 문자열 기본값 보정
    return kwargs


def confirm_import(
    db: Session, import_type: str, filename: str, rows: list[dict[str, Any]]
) -> dict[str, Any]:
    code_col = "alarm_code" if import_type == "ALARM" else "interlock_code"
    Model = AlarmGuide if import_type == "ALARM" else InterlockGuide

    total = len(rows)
    success = 0
    failed = 0
    created = 0
    updated = 0
    errors: list[str] = []

    for idx, raw in enumerate(rows):
        row = normalize_row(import_type, raw)
        row_errors = validate_row(import_type, row)
        missing_required = [c for c in cfg.get_required(import_type) if not _clean(row.get(c))]
        if row_errors or missing_required:
            failed += 1
            errors.append(f"{idx + 1}행: {'; '.join(row_errors) or '필수값 누락'}")
            continue

        try:
            kwargs = _to_model_kwargs(import_type, row)
            model_val = _clean(row.get("equipment_model"))
            code_val = _clean(row.get(code_col))

            existing = (
                db.query(Model)
                .filter(Model.equipment_model == model_val)
                .filter(getattr(Model, code_col) == code_val)
                .first()
            )
            if existing:
                for key, value in kwargs.items():
                    setattr(existing, key, value)
                existing.is_active = True
                updated += 1
            else:
                obj = Model(**kwargs)
                obj.is_active = True
                db.add(obj)
                created += 1
            success += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            errors.append(f"{idx + 1}행: 저장 오류 - {exc}")

    error_summary = "\n".join(errors) if errors else None

    job = ImportJob(
        import_type=import_type,
        filename=filename,
        total_rows=total,
        success_rows=success,
        failed_rows=failed,
        created_rows=created,
        updated_rows=updated,
        error_summary=error_summary,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "job_id": job.id,
        "import_type": import_type,
        "filename": filename,
        "total_rows": total,
        "success_rows": success,
        "failed_rows": failed,
        "created_rows": created,
        "updated_rows": updated,
        "error_summary": error_summary,
    }


def build_template_df(import_type: str) -> pd.DataFrame:
    columns = cfg.get_columns(import_type)
    sample = cfg.sample_row(import_type)
    return pd.DataFrame([{c: sample.get(c, "") for c in columns}], columns=columns)
