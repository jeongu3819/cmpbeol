import json
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..config import settings
from ..database import get_db

router = APIRouter(prefix="/api", tags=["guides"])

ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _sync_steps(guide: models.TroubleshootingGuide, steps: list[schemas.StepInput]) -> None:
    """payload 의 step 목록으로 guide.steps 를 동기화한다.

    - id 가 있는 step 은 기존 step 을 update (이미지 유지)
    - id 가 없는 step 은 신규 생성
    - payload 에 없는 기존 step 은 삭제 (이미지 cascade 삭제)
    """
    existing = {s.id: s for s in guide.steps}
    keep_ids: set[int] = set()

    for item in steps:
        data = item.model_dump(exclude={"id"})

        if item.id and item.id in existing:
            step = existing[item.id]
            for key, value in data.items():
                setattr(step, key, value)
            keep_ids.add(item.id)
        else:
            guide.steps.append(models.TroubleshootingStep(**data))

    for step in list(guide.steps):
        if step.id is not None and step.id not in keep_ids:
            guide.steps.remove(step)


def _load_guide(db: Session, guide_id: int) -> models.TroubleshootingGuide:
    guide = (
        db.query(models.TroubleshootingGuide)
        .options(selectinload(models.TroubleshootingGuide.steps).selectinload(models.TroubleshootingStep.images))
        .filter(models.TroubleshootingGuide.id == guide_id)
        .first()
    )
    if not guide:
        raise HTTPException(status_code=404, detail="가이드를 찾을 수 없습니다.")
    return guide


# ---------------------------------------------------------------------------
# Multipart(with-steps) helpers: 가이드 + Step + 이미지를 한 번에 저장
# ---------------------------------------------------------------------------
def _save_upload_bytes(content: bytes, original_filename: Optional[str]) -> str:
    """이미지 바이트를 troubleshooting 업로드 폴더에 저장하고 URL 을 반환한다."""
    ext = os.path.splitext(original_filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        ext = ".png"
    os.makedirs(settings.upload_troubleshooting_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(settings.upload_troubleshooting_dir, stored_name)
    with open(dest, "wb") as f:
        f.write(content)
    return f"/uploads/troubleshooting/{stored_name}"


def _delete_image_file(image: models.TroubleshootingStepImage) -> None:
    """uploads 하위에 저장된 물리 이미지 파일을 삭제한다."""
    url = image.image_url or ""
    for prefix, directory in (
        ("/uploads/troubleshooting/", settings.upload_troubleshooting_dir),
        ("/uploads/steps/", settings.upload_steps_dir),
    ):
        if url.startswith(prefix):
            path = os.path.join(directory, url.rsplit("/", 1)[-1])
            if os.path.isfile(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
            return


def _apply_step_image(
    step: models.TroubleshootingStep,
    image_spec: dict,
    contents: list[bytes],
    filenames: list[Optional[str]],
) -> None:
    """Step 하나의 이미지 상태를 spec 에 맞춰 동기화한다.

    image_spec.mode:
      - "existing": 기존 이미지 유지 (display 크기만 갱신 가능)
      - "new":      새 파일 업로드로 교체
      - "none":     이미지 없음 (기존 이미지 제거)
    """
    mode = image_spec.get("mode", "none")
    disp_w = image_spec.get("display_width")
    disp_h = image_spec.get("display_height")

    if mode == "existing":
        keep_id = image_spec.get("existing_image_id")
        for image in list(step.images):
            if image.id == keep_id:
                image.display_width = disp_w
                image.display_height = disp_h
            else:
                _delete_image_file(image)
                step.images.remove(image)
        return

    # new / none: 기존 이미지는 모두 제거
    for image in list(step.images):
        _delete_image_file(image)
        step.images.remove(image)

    if mode == "new":
        fi = image_spec.get("file_index")
        if fi is not None and 0 <= fi < len(contents):
            url = _save_upload_bytes(contents[fi], filenames[fi])
            step.images.append(
                models.TroubleshootingStepImage(
                    image_url=url,
                    original_filename=filenames[fi],
                    display_width=disp_w,
                    display_height=disp_h,
                    sort_order=1,
                )
            )


async def _read_uploads(images: list[UploadFile]) -> tuple[list[bytes], list[Optional[str]]]:
    contents: list[bytes] = []
    filenames: list[Optional[str]] = []
    for f in images:
        contents.append(await f.read())
        filenames.append(f.filename)
    return contents, filenames


def _parse_json_field(raw: str, field: str):
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} 이(가) 올바른 JSON 이 아닙니다.") from exc


# ---------------------------------------------------------------------------
# Guides
# ---------------------------------------------------------------------------
@router.get("/guides", response_model=schemas.GuideListOut)
def list_guides(
    db: Session = Depends(get_db),
    guide_type: Optional[str] = None,
    equipment_model: Optional[str] = None,
    process_area: Optional[str] = None,
    q: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
):
    G = models.TroubleshootingGuide
    S = models.TroubleshootingStep

    step_count = (
        db.query(S.guide_id, func.count(S.id).label("cnt"))
        .group_by(S.guide_id)
        .subquery()
    )

    query = db.query(G, func.coalesce(step_count.c.cnt, 0).label("step_count")).outerjoin(
        step_count, step_count.c.guide_id == G.id
    )

    if guide_type:
        query = query.filter(G.guide_type == guide_type.upper())
    if equipment_model:
        query = query.filter(G.equipment_model.like(f"%{equipment_model}%"))
    if process_area:
        query = query.filter(G.process_area.like(f"%{process_area}%"))
    # 기본값: 활성 가이드만 조회한다. (비활성/삭제한 가이드는 목록에서 숨긴다)
    if is_active is None:
        query = query.filter(G.is_active.is_(True))
    else:
        query = query.filter(G.is_active == is_active)
    if q:
        like = f"%{q}%"
        # step description 까지 검색
        matching_guide_ids = (
            db.query(S.guide_id).filter(S.description.like(like)).distinct().subquery()
        )
        query = query.filter(
            or_(
                G.code.like(like),
                G.title.like(like),
                G.equipment_model.like(like),
                G.process_area.like(like),
                G.summary.like(like),
                G.id.in_(db.query(matching_guide_ids.c.guide_id)),
            )
        )

    total = query.count()
    rows = query.order_by(G.updated_at.desc()).offset(skip).limit(limit).all()

    items = []
    for guide, cnt in rows:
        item = schemas.GuideListItem.model_validate(guide)
        item.step_count = int(cnt)
        items.append(item)
    return {"total": total, "items": items}


@router.post("/guides", response_model=schemas.GuideOut, status_code=201)
def create_guide(payload: schemas.GuideCreate, db: Session = Depends(get_db)):
    exists = (
        db.query(models.TroubleshootingGuide)
        .filter(models.TroubleshootingGuide.guide_type == payload.guide_type)
        .filter(models.TroubleshootingGuide.equipment_model == payload.equipment_model)
        .filter(models.TroubleshootingGuide.code == payload.code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=409,
            detail=f"이미 존재하는 조합입니다: {payload.guide_type} / {payload.equipment_model} / {payload.code}",
        )

    guide = models.TroubleshootingGuide(
        **payload.model_dump(exclude={"steps"})
    )
    db.add(guide)
    _sync_steps(guide, payload.steps)
    db.commit()
    return _load_guide(db, guide.id)


@router.get("/guides/{guide_id}", response_model=schemas.GuideOut)
def get_guide(guide_id: int, db: Session = Depends(get_db)):
    return _load_guide(db, guide_id)


@router.put("/guides/{guide_id}", response_model=schemas.GuideOut)
def update_guide(guide_id: int, payload: schemas.GuideUpdate, db: Session = Depends(get_db)):
    guide = _load_guide(db, guide_id)

    data = payload.model_dump(exclude_unset=True, exclude={"steps"})
    for key, value in data.items():
        setattr(guide, key, value)

    if payload.steps is not None:
        _sync_steps(guide, payload.steps)

    db.commit()
    return _load_guide(db, guide_id)


# ---------------------------------------------------------------------------
# Guides + Steps + Images (multipart, 한 번에 저장)
# ---------------------------------------------------------------------------
@router.post("/guides/with-steps", response_model=schemas.GuideOut, status_code=201)
async def create_guide_with_steps(
    guide_data: str = Form(...),
    steps_data: str = Form("[]"),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    guide_dict = _parse_json_field(guide_data, "guide_data")
    guide_payload = schemas.GuideBase(**guide_dict)
    steps = _parse_json_field(steps_data, "steps_data")
    contents, filenames = await _read_uploads(images)

    exists = (
        db.query(models.TroubleshootingGuide)
        .filter(models.TroubleshootingGuide.guide_type == guide_payload.guide_type)
        .filter(models.TroubleshootingGuide.equipment_model == guide_payload.equipment_model)
        .filter(models.TroubleshootingGuide.code == guide_payload.code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=409,
            detail=f"이미 존재하는 조합입니다: {guide_payload.guide_type} / {guide_payload.equipment_model} / {guide_payload.code}",
        )

    guide = models.TroubleshootingGuide(**guide_payload.model_dump())
    db.add(guide)
    db.flush()

    for idx, s in enumerate(steps):
        step = models.TroubleshootingStep(
            guide_id=guide.id,
            step_order=s.get("step_order", idx + 1),
            description=s.get("description"),
        )
        db.add(step)
        db.flush()
        _apply_step_image(step, s.get("image") or {}, contents, filenames)

    db.commit()
    return _load_guide(db, guide.id)


@router.put("/guides/{guide_id}/with-steps", response_model=schemas.GuideOut)
async def update_guide_with_steps(
    guide_id: int,
    guide_data: str = Form(...),
    steps_data: str = Form("[]"),
    images: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    guide = _load_guide(db, guide_id)
    guide_dict = _parse_json_field(guide_data, "guide_data")
    steps = _parse_json_field(steps_data, "steps_data")
    contents, filenames = await _read_uploads(images)

    updatable = {
        "guide_type",
        "equipment_model",
        "process_area",
        "code",
        "title",
        "summary",
        "is_active",
    }
    for key, value in guide_dict.items():
        if key in updatable:
            setattr(guide, key, value)

    existing_steps = {s.id: s for s in guide.steps}
    keep_ids: set[int] = set()

    for idx, s in enumerate(steps):
        sid = s.get("id")
        if sid and sid in existing_steps:
            step = existing_steps[sid]
            step.step_order = s.get("step_order", idx + 1)
            step.description = s.get("description")
            keep_ids.add(sid)
        else:
            step = models.TroubleshootingStep(
                guide_id=guide.id,
                step_order=s.get("step_order", idx + 1),
                description=s.get("description"),
            )
            db.add(step)
            db.flush()
        _apply_step_image(step, s.get("image") or {}, contents, filenames)

    for sid, step in existing_steps.items():
        if sid not in keep_ids:
            for image in step.images:
                _delete_image_file(image)
            guide.steps.remove(step)

    db.commit()
    return _load_guide(db, guide_id)


@router.delete("/guides/{guide_id}", status_code=204)
def delete_guide(guide_id: int, db: Session = Depends(get_db)):
    """Soft delete — 비활성화한다. 기본 목록에서 숨겨진다."""
    guide = db.query(models.TroubleshootingGuide).get(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="가이드를 찾을 수 없습니다.")
    guide.is_active = False
    db.commit()
    return None


@router.delete("/guides/{guide_id}/hard", status_code=204)
def hard_delete_guide(guide_id: int, db: Session = Depends(get_db)):
    """Hard delete — Step / 이미지 row(FK CASCADE)와 물리 이미지 파일까지 삭제한다."""
    guide = _load_guide(db, guide_id)
    # DB row 는 FK ON DELETE CASCADE 로 함께 지워지지만, 업로드된 이미지 파일은
    # 직접 지워야 하므로 먼저 물리 파일을 삭제한다.
    for step in guide.steps:
        for image in step.images:
            _delete_image_file(image)
    db.delete(guide)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Steps (granular)
# ---------------------------------------------------------------------------
@router.get("/guides/{guide_id}/steps", response_model=list[schemas.StepOut])
def list_steps(guide_id: int, db: Session = Depends(get_db)):
    guide = _load_guide(db, guide_id)
    return guide.steps


@router.post("/guides/{guide_id}/steps", response_model=schemas.StepOut, status_code=201)
def create_step(guide_id: int, payload: schemas.StepBase, db: Session = Depends(get_db)):
    _load_guide(db, guide_id)
    step = models.TroubleshootingStep(guide_id=guide_id, **payload.model_dump())
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.put("/guides/{guide_id}/steps/reorder", response_model=list[schemas.StepOut])
def reorder_steps(guide_id: int, payload: schemas.StepReorderIn, db: Session = Depends(get_db)):
    guide = _load_guide(db, guide_id)
    order_map = {item.id: item.step_order for item in payload.items}
    for step in guide.steps:
        if step.id in order_map:
            step.step_order = order_map[step.id]
    db.commit()
    return _load_guide(db, guide_id).steps


@router.put("/steps/{step_id}", response_model=schemas.StepOut)
def update_step(step_id: int, payload: schemas.StepBase, db: Session = Depends(get_db)):
    step = db.query(models.TroubleshootingStep).get(step_id)
    if not step:
        raise HTTPException(status_code=404, detail="Step 을 찾을 수 없습니다.")
    for key, value in payload.model_dump().items():
        setattr(step, key, value)
    db.commit()
    db.refresh(step)
    return step


@router.delete("/steps/{step_id}", status_code=204)
def delete_step(step_id: int, db: Session = Depends(get_db)):
    step = db.query(models.TroubleshootingStep).get(step_id)
    if not step:
        raise HTTPException(status_code=404, detail="Step 을 찾을 수 없습니다.")
    db.delete(step)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Step Images
# ---------------------------------------------------------------------------
@router.post("/steps/{step_id}/images", response_model=schemas.StepImageOut, status_code=201)
async def upload_step_image(
    step_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    step = db.query(models.TroubleshootingStep).get(step_id)
    if not step:
        raise HTTPException(status_code=404, detail="Step 을 찾을 수 없습니다.")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 이미지 형식입니다. 허용: {', '.join(sorted(ALLOWED_IMAGE_EXT))}",
        )

    os.makedirs(settings.upload_steps_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(settings.upload_steps_dir, stored_name)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    max_sort = max([img.sort_order for img in step.images], default=0)
    image = models.TroubleshootingStepImage(
        step_id=step_id,
        image_url=f"/uploads/steps/{stored_name}",
        original_filename=file.filename,
        sort_order=max_sort + 1,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/step-images/{image_id}", status_code=204)
def delete_step_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.TroubleshootingStepImage).get(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

    # 물리 파일 삭제 (uploads 하위인 경우)
    if image.image_url.startswith("/uploads/steps/"):
        fname = image.image_url.rsplit("/", 1)[-1]
        path = os.path.join(settings.upload_steps_dir, fname)
        if os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass

    db.delete(image)
    db.commit()
    return None
