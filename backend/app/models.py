from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base

GUIDE_TYPE_VALUES = ("ALARM", "INTERLOCK")


class TroubleshootingGuide(Base):
    __tablename__ = "troubleshooting_guides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    guide_type = Column(Enum(*GUIDE_TYPE_VALUES, name="guide_type"), nullable=False)
    equipment_model = Column(String(100), nullable=False)
    process_area = Column(String(100), nullable=True)
    code = Column(String(100), nullable=False)
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    steps = relationship(
        "TroubleshootingStep",
        back_populates="guide",
        cascade="all, delete-orphan",
        order_by="TroubleshootingStep.step_order",
    )


class TroubleshootingStep(Base):
    __tablename__ = "troubleshooting_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    guide_id = Column(
        Integer,
        ForeignKey("troubleshooting_guides.id", ondelete="CASCADE"),
        nullable=False,
    )
    step_order = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )

    guide = relationship("TroubleshootingGuide", back_populates="steps")
    images = relationship(
        "TroubleshootingStepImage",
        back_populates="step",
        cascade="all, delete-orphan",
        order_by="TroubleshootingStepImage.sort_order",
    )


class TroubleshootingStepImage(Base):
    __tablename__ = "troubleshooting_step_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    step_id = Column(
        Integer,
        ForeignKey("troubleshooting_steps.id", ondelete="CASCADE"),
        nullable=False,
    )
    image_url = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    display_width = Column(Integer, nullable=True)
    display_height = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    step = relationship("TroubleshootingStep", back_populates="images")


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
