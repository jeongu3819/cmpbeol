from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
ImportType = Literal["ALARM", "INTERLOCK"]


# ---------------------------------------------------------------------------
# Alarm Guide
# ---------------------------------------------------------------------------
class AlarmGuideBase(BaseModel):
    equipment_name: Optional[str] = None
    equipment_model: Optional[str] = None
    process: Optional[str] = None
    area: Optional[str] = None
    alarm_code: str
    alarm_name: str
    alarm_description: Optional[str] = None
    severity: Severity = "MEDIUM"
    category: Optional[str] = None
    cause: Optional[str] = None
    check_points: Optional[str] = None
    action_method: Optional[str] = None
    action_steps: Optional[str] = None
    caution: Optional[str] = None
    related_parts: Optional[str] = None
    owner_team: Optional[str] = None
    tags: Optional[list[str]] = None
    is_active: bool = True


class AlarmGuideCreate(AlarmGuideBase):
    pass


class AlarmGuideUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_model: Optional[str] = None
    process: Optional[str] = None
    area: Optional[str] = None
    alarm_code: Optional[str] = None
    alarm_name: Optional[str] = None
    alarm_description: Optional[str] = None
    severity: Optional[Severity] = None
    category: Optional[str] = None
    cause: Optional[str] = None
    check_points: Optional[str] = None
    action_method: Optional[str] = None
    action_steps: Optional[str] = None
    caution: Optional[str] = None
    related_parts: Optional[str] = None
    owner_team: Optional[str] = None
    tags: Optional[list[str]] = None
    is_active: Optional[bool] = None


class AlarmGuideOut(AlarmGuideBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Interlock Guide
# ---------------------------------------------------------------------------
class InterlockGuideBase(BaseModel):
    equipment_name: Optional[str] = None
    equipment_model: Optional[str] = None
    process: Optional[str] = None
    area: Optional[str] = None
    interlock_code: str
    interlock_name: str
    interlock_description: Optional[str] = None
    severity: Severity = "HIGH"
    category: Optional[str] = None
    trigger_condition: Optional[str] = None
    cause: Optional[str] = None
    check_points: Optional[str] = None
    action_method: Optional[str] = None
    action_steps: Optional[str] = None
    reset_condition: Optional[str] = None
    caution: Optional[str] = None
    related_parts: Optional[str] = None
    owner_team: Optional[str] = None
    approval_required: bool = False
    tags: Optional[list[str]] = None
    is_active: bool = True


class InterlockGuideCreate(InterlockGuideBase):
    pass


class InterlockGuideUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_model: Optional[str] = None
    process: Optional[str] = None
    area: Optional[str] = None
    interlock_code: Optional[str] = None
    interlock_name: Optional[str] = None
    interlock_description: Optional[str] = None
    severity: Optional[Severity] = None
    category: Optional[str] = None
    trigger_condition: Optional[str] = None
    cause: Optional[str] = None
    check_points: Optional[str] = None
    action_method: Optional[str] = None
    action_steps: Optional[str] = None
    reset_condition: Optional[str] = None
    caution: Optional[str] = None
    related_parts: Optional[str] = None
    owner_team: Optional[str] = None
    approval_required: Optional[bool] = None
    tags: Optional[list[str]] = None
    is_active: Optional[bool] = None


class InterlockGuideOut(InterlockGuideBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# List response
# ---------------------------------------------------------------------------
class AlarmGuideListOut(BaseModel):
    total: int
    items: list[AlarmGuideOut]


class InterlockGuideListOut(BaseModel):
    total: int
    items: list[InterlockGuideOut]


# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------
class ImportRowError(BaseModel):
    row_index: int
    field: Optional[str] = None
    message: str


class ImportPreviewRow(BaseModel):
    row_index: int
    valid: bool
    errors: list[str] = Field(default_factory=list)
    data: dict[str, Any]


class ImportPreviewOut(BaseModel):
    import_type: ImportType
    filename: str
    columns: list[str]
    required_columns: list[str]
    total_rows: int
    valid_rows: int
    invalid_rows: int
    rows: list[ImportPreviewRow]


class ImportConfirmIn(BaseModel):
    import_type: ImportType
    filename: str
    rows: list[dict[str, Any]]


class ImportResultOut(BaseModel):
    job_id: int
    import_type: ImportType
    filename: str
    total_rows: int
    success_rows: int
    failed_rows: int
    created_rows: int
    updated_rows: int
    error_summary: Optional[str] = None
