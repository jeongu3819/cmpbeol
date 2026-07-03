"""알람/인터락 업로드 양식 컬럼 정의."""

# 컬럼 순서 = 샘플 양식 헤더 순서
ALARM_REQUIRED = ["equipment_model", "alarm_code", "alarm_name", "action_method"]
ALARM_OPTIONAL = [
    "equipment_name",
    "process",
    "area",
    "alarm_description",
    "severity",
    "category",
    "cause",
    "check_points",
    "action_steps",
    "caution",
    "related_parts",
    "owner_team",
    "tags",
]
ALARM_COLUMNS = ALARM_REQUIRED + ALARM_OPTIONAL

INTERLOCK_REQUIRED = ["equipment_model", "interlock_code", "interlock_name", "action_method"]
INTERLOCK_OPTIONAL = [
    "equipment_name",
    "process",
    "area",
    "interlock_description",
    "severity",
    "category",
    "trigger_condition",
    "cause",
    "check_points",
    "action_steps",
    "reset_condition",
    "caution",
    "related_parts",
    "owner_team",
    "approval_required",
    "tags",
]
INTERLOCK_COLUMNS = INTERLOCK_REQUIRED + INTERLOCK_OPTIONAL

SEVERITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

BOOL_COLUMNS = {"approval_required"}
LIST_COLUMNS = {"tags"}


def get_columns(import_type: str) -> list[str]:
    return ALARM_COLUMNS if import_type == "ALARM" else INTERLOCK_COLUMNS


def get_required(import_type: str) -> list[str]:
    return ALARM_REQUIRED if import_type == "ALARM" else INTERLOCK_REQUIRED


def sample_row(import_type: str) -> dict:
    if import_type == "ALARM":
        return {
            "equipment_model": "Mirra",
            "alarm_code": "ALM-9001",
            "alarm_name": "Sample Alarm Name",
            "action_method": "조치 방법을 여기에 입력",
            "equipment_name": "CMP Polisher #1",
            "process": "CMP",
            "area": "FAB2-A",
            "alarm_description": "알람 설명",
            "severity": "MEDIUM",
            "category": "Slurry",
            "cause": "발생 원인",
            "check_points": "확인 사항",
            "action_steps": "1. 단계1\n2. 단계2",
            "caution": "주의 사항",
            "related_parts": "관련 부품",
            "owner_team": "CMP설비팀",
            "tags": "slurry;flow",
        }
    return {
        "equipment_model": "Mirra",
        "interlock_code": "ILK-9001",
        "interlock_name": "Sample Interlock Name",
        "action_method": "조치 방법을 여기에 입력",
        "equipment_name": "CMP Polisher #1",
        "process": "CMP",
        "area": "FAB2-A",
        "interlock_description": "인터락 설명",
        "severity": "HIGH",
        "category": "Safety",
        "trigger_condition": "발생 조건",
        "cause": "발생 원인",
        "check_points": "확인 사항",
        "action_steps": "1. 단계1\n2. 단계2",
        "reset_condition": "리셋 조건",
        "caution": "주의 사항",
        "related_parts": "관련 부품",
        "owner_team": "안전팀",
        "approval_required": "false",
        "tags": "safety;emo",
    }
