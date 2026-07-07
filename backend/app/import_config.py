"""트러블슈팅 가이드 업로드 양식 컬럼 정의 (단순화 버전).

기본정보 + Step1~3 텍스트 컬럼만 다룬다. 이미지는 상세 수정 화면에서 첨부한다.
"""

REQUIRED = ["guide_type", "equipment_model", "code", "title"]

BASE_OPTIONAL = ["process_area", "summary"]

# Step 은 1~3 까지 지원 (향후 확장 가능)
MAX_STEPS = 3

STEP_FIELDS = ["title", "description", "question", "normal_result", "caution"]
# 향후 확장을 위해 optional 로 image_url 도 받는다.
STEP_OPTIONAL_FIELDS = ["image_url"]

GUIDE_TYPE_VALUES = ["ALARM", "INTERLOCK"]


def step_columns() -> list[str]:
    cols: list[str] = []
    for i in range(1, MAX_STEPS + 1):
        for f in STEP_FIELDS:
            cols.append(f"step{i}_{f}")
        for f in STEP_OPTIONAL_FIELDS:
            cols.append(f"step{i}_{f}")
    return cols


COLUMNS = REQUIRED + BASE_OPTIONAL + step_columns()


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
        "step1_title": "Door Sensor 상태 확인",
        "step1_description": "Door sensor LED 상태를 확인한다.",
        "step1_question": "Sensor LED가 정상 점등 상태인가요?",
        "step1_normal_result": "정상으로 판단되어 추가 조치가 필요하지 않습니다.",
        "step1_caution": "Door 개방 시 안전에 유의한다.",
        "step2_title": "Sensor 배선 확인",
        "step2_description": "Sensor 케이블 연결 및 단선 여부를 확인한다.",
        "step2_question": "배선 상태가 정상인가요?",
        "step2_normal_result": "배선 정상. 컨트롤러 상태를 확인하세요.",
        "step2_caution": "",
        "step3_title": "상위 담당자 문의",
        "step3_description": "위 조치로 해결되지 않으면 설비 담당자에게 문의한다.",
        "step3_question": "",
        "step3_normal_result": "",
        "step3_caution": "",
    }
