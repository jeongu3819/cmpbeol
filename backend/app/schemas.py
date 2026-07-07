from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

GuideType = Literal["ALARM", "INTERLOCK"]
ImportType = Literal["ALARM", "INTERLOCK"]

DEFAULT_NORMAL_LABEL = "정상 / 조치 완료"
DEFAULT_NEXT_LABEL = "추가 판단 필요"


# ---------------------------------------------------------------------------
# Step Image
# ---------------------------------------------------------------------------
class StepImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_url: str
    original_filename: Optional[str] = None
    sort_order: int = 1


# ---------------------------------------------------------------------------
# Step
# ---------------------------------------------------------------------------
class StepBase(BaseModel):
    step_order: int
    step_title: Optional[str] = None
    description: Optional[str] = None
    decision_question: Optional[str] = None
    normal_label: Optional[str] = DEFAULT_NORMAL_LABEL
    normal_result_text: Optional[str] = None
    next_label: Optional[str] = DEFAULT_NEXT_LABEL
    next_step_order: Optional[int] = None
    caution: Optional[str] = None


class StepInput(StepBase):
    # 수정 시 기존 step 을 식별하기 위한 id (신규 step 은 생략/None)
    id: Optional[int] = None


class StepOut(StepBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    images: list[StepImageOut] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Guide
# ---------------------------------------------------------------------------
class GuideBase(BaseModel):
    guide_type: GuideType
    equipment_model: str
    process_area: Optional[str] = None
    code: str
    title: str
    summary: Optional[str] = None
    is_active: bool = True


class GuideCreate(GuideBase):
    steps: list[StepInput] = Field(default_factory=list)


class GuideUpdate(BaseModel):
    guide_type: Optional[GuideType] = None
    equipment_model: Optional[str] = None
    process_area: Optional[str] = None
    code: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    is_active: Optional[bool] = None
    # steps 가 주어지면 전체 step 집합을 이 목록으로 동기화한다.
    steps: Optional[list[StepInput]] = None


class GuideOut(GuideBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    steps: list[StepOut] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class GuideListItem(BaseModel):
    """목록 화면용 요약 (step 상세 제외, step_count 포함)."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    guide_type: GuideType
    equipment_model: str
    process_area: Optional[str] = None
    code: str
    title: str
    summary: Optional[str] = None
    is_active: bool = True
    step_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class GuideListOut(BaseModel):
    total: int
    items: list[GuideListItem]


# ---------------------------------------------------------------------------
# Step reorder
# ---------------------------------------------------------------------------
class StepReorderItem(BaseModel):
    id: int
    step_order: int


class StepReorderIn(BaseModel):
    items: list[StepReorderItem]


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------
class ImportPreviewRow(BaseModel):
    row_index: int
    valid: bool
    action: Literal["create", "update", "skip"] = "create"
    errors: list[str] = Field(default_factory=list)
    data: dict[str, Any]


class ImportPreviewOut(BaseModel):
    filename: str
    columns: list[str]
    required_columns: list[str]
    total_rows: int
    valid_rows: int
    invalid_rows: int
    create_rows: int
    update_rows: int
    rows: list[ImportPreviewRow]


class ImportConfirmIn(BaseModel):
    filename: str
    rows: list[dict[str, Any]]


class ImportResultOut(BaseModel):
    job_id: int
    filename: str
    total_rows: int
    success_rows: int
    failed_rows: int
    created_rows: int
    updated_rows: int
    error_summary: Optional[str] = None
