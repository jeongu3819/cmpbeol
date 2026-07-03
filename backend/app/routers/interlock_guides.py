from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/interlock-guides", tags=["interlock-guides"])


@router.get("", response_model=schemas.InterlockGuideListOut)
def list_interlock_guides(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment_name: Optional[str] = None,
    equipment_model: Optional[str] = None,
    process: Optional[str] = None,
    interlock_code: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
):
    q = db.query(models.InterlockGuide)

    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                models.InterlockGuide.interlock_name.like(like),
                models.InterlockGuide.interlock_code.like(like),
                models.InterlockGuide.interlock_description.like(like),
                models.InterlockGuide.action_method.like(like),
                models.InterlockGuide.equipment_name.like(like),
                models.InterlockGuide.equipment_model.like(like),
            )
        )
    if equipment_name:
        q = q.filter(models.InterlockGuide.equipment_name.like(f"%{equipment_name}%"))
    if equipment_model:
        q = q.filter(models.InterlockGuide.equipment_model == equipment_model)
    if process:
        q = q.filter(models.InterlockGuide.process == process)
    if interlock_code:
        q = q.filter(models.InterlockGuide.interlock_code.like(f"%{interlock_code}%"))
    if severity:
        q = q.filter(models.InterlockGuide.severity == severity)
    if category:
        q = q.filter(models.InterlockGuide.category == category)
    if is_active is not None:
        q = q.filter(models.InterlockGuide.is_active == is_active)

    total = q.count()
    items = q.order_by(models.InterlockGuide.updated_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.post("", response_model=schemas.InterlockGuideOut, status_code=201)
def create_interlock_guide(
    payload: schemas.InterlockGuideCreate, db: Session = Depends(get_db)
):
    exists = (
        db.query(models.InterlockGuide)
        .filter(models.InterlockGuide.equipment_model == payload.equipment_model)
        .filter(models.InterlockGuide.interlock_code == payload.interlock_code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=409,
            detail=f"이미 존재하는 조합입니다: {payload.equipment_model} / {payload.interlock_code}",
        )
    obj = models.InterlockGuide(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{guide_id}", response_model=schemas.InterlockGuideOut)
def get_interlock_guide(guide_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.InterlockGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="인터락 가이드를 찾을 수 없습니다.")
    return obj


@router.put("/{guide_id}", response_model=schemas.InterlockGuideOut)
def update_interlock_guide(
    guide_id: int, payload: schemas.InterlockGuideUpdate, db: Session = Depends(get_db)
):
    obj = db.query(models.InterlockGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="인터락 가이드를 찾을 수 없습니다.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{guide_id}", status_code=204)
def delete_interlock_guide(
    guide_id: int, hard: bool = False, db: Session = Depends(get_db)
):
    obj = db.query(models.InterlockGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="인터락 가이드를 찾을 수 없습니다.")
    if hard:
        db.delete(obj)
    else:
        obj.is_active = False
    db.commit()
    return None
