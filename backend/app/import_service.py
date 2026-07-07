"""CSV/XLSX 파싱, 검증, 일괄 저장 로직 (트러블슈팅 가이드)."""
import io
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from . import import_config as cfg
from .models import ImportJob, TroubleshootingGuide, TroubleshootingStep, TroubleshootingStepImage


def parse_file(filename: str, content: bytes) -> pd.DataFrame:
    """CSV 또는 XLSX 파일 바이트를 DataFrame으로 파싱."""
    name = (filename or "").lower()
    if name.endswith(".csv"):
        try:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False, encoding="cp949")
    elif name.endswith(".xlsx") or name.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(content), dtype=str, engine="openpyxl")
        df = df.fillna("")
    else:
        raise ValueError("지원하지 않는 파일 형식입니다. .csv 또는 .xlsx 파일을 업로드하세요.")

    df.columns = [str(c).strip() for c in df.columns]
    return df


def _clean(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() == "nan" else text


def normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    """양식 컬럼만 추려서 정규화된 dict 반환."""
    row: dict[str, Any] = {}
    for col in cfg.get_columns():
        row[col] = _clean(raw.get(col, ""))
    return row


def validate_row(row: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for col in cfg.get_required():
        if not _clean(row.get(col)):
            errors.append(f"필수 컬럼 누락: {col}")

    gt = _clean(row.get("guide_type")).upper()
    if gt and gt not in cfg.GUIDE_TYPE_VALUES:
        errors.append(f"guide_type 값 오류: {gt} (허용: {', '.join(cfg.GUIDE_TYPE_VALUES)})")

    return errors


def _existing_guide(db: Session, row: dict[str, Any]) -> TroubleshootingGuide | None:
    gt = _clean(row.get("guide_type")).upper()
    model = _clean(row.get("equipment_model"))
    code = _clean(row.get("code"))
    if not (gt and model and code):
        return None
    return (
        db.query(TroubleshootingGuide)
        .filter(TroubleshootingGuide.guide_type == gt)
        .filter(TroubleshootingGuide.equipment_model == model)
        .filter(TroubleshootingGuide.code == code)
        .first()
    )


def build_preview(db: Session, df: pd.DataFrame) -> dict[str, Any]:
    required = cfg.get_required()
    file_columns = list(df.columns)
    missing_headers = [c for c in required if c not in file_columns]

    rows = []
    valid_count = 0
    create_count = 0
    update_count = 0
    for idx, record in enumerate(df.to_dict(orient="records")):
        row = normalize_row(record)
        errors = validate_row(row)
        for mh in missing_headers:
            msg = f"파일에 필수 컬럼 헤더 없음: {mh}"
            if msg not in errors:
                errors.append(msg)

        is_valid = len(errors) == 0
        action = "skip"
        if is_valid:
            valid_count += 1
            if _existing_guide(db, row):
                action = "update"
                update_count += 1
            else:
                action = "create"
                create_count += 1

        rows.append(
            {
                "row_index": idx,
                "valid": is_valid,
                "action": action,
                "errors": errors,
                "data": row,
            }
        )

    return {
        "columns": file_columns,
        "required_columns": required,
        "total_rows": len(rows),
        "valid_rows": valid_count,
        "invalid_rows": len(rows) - valid_count,
        "create_rows": create_count,
        "update_rows": update_count,
        "rows": rows,
    }


def _build_steps_from_row(row: dict[str, Any]) -> list[dict[str, Any]]:
    """step1~N 컬럼에서 step dict 목록을 생성. 내용이 있는 step 만 포함."""
    raw_steps: list[dict[str, Any]] = []
    for i in range(1, cfg.MAX_STEPS + 1):
        title = _clean(row.get(f"step{i}_title"))
        description = _clean(row.get(f"step{i}_description"))
        question = _clean(row.get(f"step{i}_question"))
        normal_result = _clean(row.get(f"step{i}_normal_result"))
        caution = _clean(row.get(f"step{i}_caution"))
        image_url = _clean(row.get(f"step{i}_image_url"))

        if any([title, description, question, normal_result, caution, image_url]):
            raw_steps.append(
                {
                    "step_title": title or None,
                    "description": description or None,
                    "decision_question": question or None,
                    "normal_result_text": normal_result or None,
                    "caution": caution or None,
                    "image_url": image_url or None,
                }
            )

    steps: list[dict[str, Any]] = []
    for pos, s in enumerate(raw_steps):
        order = pos + 1
        is_last = pos == len(raw_steps) - 1
        steps.append(
            {
                "step_order": order,
                "step_title": s["step_title"],
                "description": s["description"],
                "decision_question": s["decision_question"],
                "normal_label": "정상 / 조치 완료",
                "normal_result_text": s["normal_result_text"],
                "next_label": "추가 판단 필요",
                "next_step_order": None if is_last else order + 1,
                "caution": s["caution"],
                "image_url": s["image_url"],
            }
        )
    return steps


def confirm_import(db: Session, filename: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(rows)
    success = 0
    failed = 0
    created = 0
    updated = 0
    errors: list[str] = []

    for idx, raw in enumerate(rows):
        row = normalize_row(raw)
        row_errors = validate_row(row)
        if row_errors:
            failed += 1
            errors.append(f"{idx + 1}행: {'; '.join(row_errors)}")
            continue

        try:
            gt = _clean(row.get("guide_type")).upper()
            guide = _existing_guide(db, row)
            is_new = guide is None
            if is_new:
                guide = TroubleshootingGuide(
                    guide_type=gt,
                    equipment_model=_clean(row.get("equipment_model")),
                    code=_clean(row.get("code")),
                )
                db.add(guide)

            guide.guide_type = gt
            guide.equipment_model = _clean(row.get("equipment_model"))
            guide.code = _clean(row.get("code"))
            guide.title = _clean(row.get("title"))
            guide.process_area = _clean(row.get("process_area")) or None
            guide.summary = _clean(row.get("summary")) or None
            guide.is_active = True

            step_dicts = _build_steps_from_row(row)
            if step_dicts:
                # 기존 step 전체 교체
                guide.steps.clear()
                db.flush()
                for sd in step_dicts:
                    image_url = sd.pop("image_url", None)
                    step = TroubleshootingStep(**sd)
                    if image_url:
                        step.images.append(
                            TroubleshootingStepImage(image_url=image_url, sort_order=1)
                        )
                    guide.steps.append(step)

            if is_new:
                created += 1
            else:
                updated += 1
            success += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            errors.append(f"{idx + 1}행: 저장 오류 - {exc}")

    error_summary = "\n".join(errors) if errors else None

    # import_type 은 첫 유효행 기준 (혼합 파일이면 대표값)
    rep_type = "ALARM"
    for raw in rows:
        gt = _clean(normalize_row(raw).get("guide_type")).upper()
        if gt in cfg.GUIDE_TYPE_VALUES:
            rep_type = gt
            break

    job = ImportJob(
        import_type=rep_type,
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
        "filename": filename,
        "total_rows": total,
        "success_rows": success,
        "failed_rows": failed,
        "created_rows": created,
        "updated_rows": updated,
        "error_summary": error_summary,
    }


def build_template_df() -> pd.DataFrame:
    columns = cfg.get_columns()
    sample = cfg.sample_row()
    return pd.DataFrame([{c: sample.get(c, "") for c in columns}], columns=columns)
