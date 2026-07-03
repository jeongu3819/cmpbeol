from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Column,
    Enum,
    Integer,
    String,
    Text,
    func,
)

from .database import Base

SEVERITY_VALUES = ("LOW", "MEDIUM", "HIGH", "CRITICAL")


class AlarmGuide(Base):
    __tablename__ = "alarm_guides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_name = Column(String(100), nullable=True)
    equipment_model = Column(String(100), nullable=True)
    process = Column(String(100), nullable=True)
    area = Column(String(100), nullable=True)
    alarm_code = Column(String(100), nullable=False)
    alarm_name = Column(String(300), nullable=False)
    alarm_description = Column(Text, nullable=True)
    severity = Column(Enum(*SEVERITY_VALUES, name="severity"), nullable=False, default="MEDIUM")
    category = Column(String(100), nullable=True)
    cause = Column(Text, nullable=True)
    check_points = Column(Text, nullable=True)
    action_method = Column(Text, nullable=True)
    action_steps = Column(Text, nullable=True)
    caution = Column(Text, nullable=True)
    related_parts = Column(Text, nullable=True)
    owner_team = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )


class InterlockGuide(Base):
    __tablename__ = "interlock_guides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_name = Column(String(100), nullable=True)
    equipment_model = Column(String(100), nullable=True)
    process = Column(String(100), nullable=True)
    area = Column(String(100), nullable=True)
    interlock_code = Column(String(100), nullable=False)
    interlock_name = Column(String(300), nullable=False)
    interlock_description = Column(Text, nullable=True)
    severity = Column(Enum(*SEVERITY_VALUES, name="severity"), nullable=False, default="HIGH")
    category = Column(String(100), nullable=True)
    trigger_condition = Column(Text, nullable=True)
    cause = Column(Text, nullable=True)
    check_points = Column(Text, nullable=True)
    action_method = Column(Text, nullable=True)
    action_steps = Column(Text, nullable=True)
    reset_condition = Column(Text, nullable=True)
    caution = Column(Text, nullable=True)
    related_parts = Column(Text, nullable=True)
    owner_team = Column(String(100), nullable=True)
    approval_required = Column(Boolean, nullable=False, default=False)
    tags = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    import_type = Column(Enum("ALARM", "INTERLOCK", name="import_type"), nullable=False)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, nullable=False, default=0)
    success_rows = Column(Integer, nullable=False, default=0)
    failed_rows = Column(Integer, nullable=False, default=0)
    created_rows = Column(Integer, nullable=False, default=0)
    updated_rows = Column(Integer, nullable=False, default=0)
    error_summary = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
