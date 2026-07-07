import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
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
        # 기본값 보정
        if not data.get("normal_label"):
            data["normal_label"] = schemas.DEFAULT_NORMAL_LABEL
        if not data.get("next_label"):
            data["next_label"] = schemas.DEFAULT_NEXT_LABEL

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
    if is_active is not None:
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


@router.delete("/guides/{guide_id}", status_code=204)
def delete_guide(guide_id: int, hard: bool = False, db: Session = Depends(get_db)):
    guide = db.query(models.TroubleshootingGuide).get(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="가이드를 찾을 수 없습니다.")
    if hard:
        db.delete(guide)
    else:
        guide.is_active = False
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
