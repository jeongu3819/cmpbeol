from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/alarm-guides", tags=["alarm-guides"])


@router.get("", response_model=schemas.AlarmGuideListOut)
def list_alarm_guides(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment_name: Optional[str] = None,
    equipment_model: Optional[str] = None,
    process: Optional[str] = None,
    alarm_code: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
):
    q = db.query(models.AlarmGuide)

    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                models.AlarmGuide.alarm_name.like(like),
                models.AlarmGuide.alarm_code.like(like),
                models.AlarmGuide.alarm_description.like(like),
                models.AlarmGuide.action_method.like(like),
                models.AlarmGuide.equipment_name.like(like),
                models.AlarmGuide.equipment_model.like(like),
            )
        )
    if equipment_name:
        q = q.filter(models.AlarmGuide.equipment_name.like(f"%{equipment_name}%"))
    if equipment_model:
        q = q.filter(models.AlarmGuide.equipment_model == equipment_model)
    if process:
        q = q.filter(models.AlarmGuide.process == process)
    if alarm_code:
        q = q.filter(models.AlarmGuide.alarm_code.like(f"%{alarm_code}%"))
    if severity:
        q = q.filter(models.AlarmGuide.severity == severity)
    if category:
        q = q.filter(models.AlarmGuide.category == category)
    if is_active is not None:
        q = q.filter(models.AlarmGuide.is_active == is_active)

    total = q.count()
    items = q.order_by(models.AlarmGuide.updated_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.post("", response_model=schemas.AlarmGuideOut, status_code=201)
def create_alarm_guide(payload: schemas.AlarmGuideCreate, db: Session = Depends(get_db)):
    exists = (
        db.query(models.AlarmGuide)
        .filter(models.AlarmGuide.equipment_model == payload.equipment_model)
        .filter(models.AlarmGuide.alarm_code == payload.alarm_code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=409,
            detail=f"이미 존재하는 조합입니다: {payload.equipment_model} / {payload.alarm_code}",
        )
    obj = models.AlarmGuide(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{guide_id}", response_model=schemas.AlarmGuideOut)
def get_alarm_guide(guide_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.AlarmGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="알람 가이드를 찾을 수 없습니다.")
    return obj


@router.put("/{guide_id}", response_model=schemas.AlarmGuideOut)
def update_alarm_guide(
    guide_id: int, payload: schemas.AlarmGuideUpdate, db: Session = Depends(get_db)
):
    obj = db.query(models.AlarmGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="알람 가이드를 찾을 수 없습니다.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{guide_id}", status_code=204)
def delete_alarm_guide(
    guide_id: int, hard: bool = False, db: Session = Depends(get_db)
):
    obj = db.query(models.AlarmGuide).get(guide_id)
    if not obj:
        raise HTTPException(status_code=404, detail="알람 가이드를 찾을 수 없습니다.")
    if hard:
        db.delete(obj)
    else:
        obj.is_active = False
    db.commit()
    return None
