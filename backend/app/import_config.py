"""트러블슈팅 가이드 업로드 양식 컬럼 정의 (단순화 버전).

기본정보 + Step 텍스트 설명 컬럼만 다룬다. 이미지는 상세 수정 화면에서 첨부한다.
Step 은 "텍스트 설명" 하나만 받는다. (step1_description ~ step5_description)
"""

# Step 은 1~5 까지 지원
MAX_STEPS = 5

# 필수: 기본정보 + 최소 1개 Step 설명
REQUIRED = ["guide_type", "equipment_model", "code", "title", "step1_description"]

BASE_OPTIONAL = ["process_area", "summary"]

GUIDE_TYPE_VALUES = ["ALARM", "INTERLOCK"]


def step_columns() -> list[str]:
    return [f"step{i}_description" for i in range(1, MAX_STEPS + 1)]


# 양식/미리보기용 컬럼 순서: 기본정보 → Step 설명
COLUMNS = (
    ["guide_type", "equipment_model", "code", "title"]
    + BASE_OPTIONAL
    + step_columns()
)


def get_columns() -> list[str]:
    return COLUMNS


def get_required() -> list[str]:
    return REQUIRED


def sample_row() -> dict:
    return {
        "guide_type": "INTERLOCK",
        "equipment_model": "LK",
        "code": "DOOR_OPEN_INT",
        "title": "Door Open Interlock",
        "process_area": "CMP",
        "summary": "Door 열림 인터락 발생 시 조치 가이드",
        "step1_description": "Door sensor LED 상태를 확인한다.",
        "step2_description": "Sensor 케이블 연결 및 단선 여부를 확인한다.",
        "step3_description": "위 조치로 해결되지 않으면 설비 담당자에게 문의한다.",
        "step4_description": "",
        "step5_description": "",
    }
