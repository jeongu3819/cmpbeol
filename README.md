# 트러블슈팅 가이드 관리 (MVP)

설비**모델별 알람 / 인터락 조치 가이드**를 등록·검색·조회·수정하고, 작업자가 현장에서 **Step Flow(단계별 판단)** 로 조치를 따라갈 수 있는 지식관리 시스템입니다. CSV/XLSX 로 기본정보와 Step 텍스트를 일괄 등록할 수 있습니다.

> ⚠️ 이 시스템은 조치방법을 정리·조회하는 **가이드/지식관리 용도**입니다.
> 실제 설비 제어, 인터락 해제/리셋/바이패스 기능은 포함하지 않습니다.

> 알람/인터락뿐 아니라 향후 Leak, Abnormal, Particle, PM 후 이상, Sensor 이상 등도
> 같은 구조(가이드 + Step)로 확장할 수 있도록 **트러블슈팅 가이드**로 설계했습니다.

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, Axios, Material UI |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, PyMySQL, pandas, openpyxl |
| DB | MySQL 8.0+ |

## 핵심 개념

- **가이드(Guide)**: `guide_type`(ALARM/INTERLOCK) + `equipment_model` + `process_area` + `code` + `title` + `summary` 로 구성된 기본정보. 개별 설비명(KC2 등)은 입력하지 않고 **설비모델**(Mirra, Ebara, LK, LKP …) 단위로 관리합니다.
- **Step 카드**: 조치방법을 여러 개의 단계로 나눈 카드. 각 Step 은 **이미지 + 텍스트 설명**만 가집니다. Step 사이에는 화살표로 흐름을 표시합니다.
  - 조회 화면에서 각 Step 은 두 개의 버튼만 제공합니다.
  - **정상 / 조치 완료** → "조치가 완료되었습니다." 안내 후 처음으로 돌아가기
  - **추가 정보 필요** → 자동으로 다음 순서(step_order + 1)의 Step 으로 이동
  - 마지막 Step 에서 "추가 정보 필요" 선택 시 "추가 확인이 필요합니다. 담당자 또는 상위 엔지니어에게 문의하세요." 안내

## 주요 기능 / 화면

| 경로 | 설명 |
|------|------|
| `/guides` | 통합 목록 (전체/알람/인터락 탭, 코드·제목·설비모델·설명 검색, 설비모델·공정 필터) |
| `/guides/new` | 새 가이드 등록 (기본정보 + Step Builder) |
| `/guides/:id/edit` | 가이드 수정 (기본정보 + Step Builder + Step별 이미지 첨부/삭제) |
| `/guides/:id` | 가이드 조회 (상단 기본정보 + Step Flow Viewer) |
| `/import` | CSV/XLSX 미리보기·검증 → 일괄 등록 (신규/업데이트 구분 표시) |
| `/settings` | 샘플 양식 다운로드 / 업로드 안내 |

## 프로젝트 구조

```
cmpbeol/
├── backend/          # FastAPI 앱
│   └── app/
│       ├── main.py           # 엔트리포인트 + CORS + /uploads 정적 서빙
│       ├── config.py         # 환경설정 (.env, 업로드 경로)
│       ├── database.py       # SQLAlchemy 엔진/세션
│       ├── models.py         # ORM 모델 (guides / steps / step_images / import_jobs)
│       ├── schemas.py        # Pydantic 스키마
│       ├── import_config.py  # 업로드 컬럼 정의
│       ├── import_service.py # 파싱/검증/저장 로직
│       └── routers/
│           ├── guides.py     # 가이드 + Step + 이미지 API
│           └── import_router.py
├── frontend/         # React + Vite 앱
│   └── src/components/guides/  # GuideTable, GuideForm, StepBuilder,
│                                # StepEditorCard, StepFlowPreview, StepViewer,
│                                # StepImageUploader, GuideTypeBadge
├── db/
│   ├── schema.sql    # 테이블 생성
│   └── seed.sql      # CMP 샘플 데이터 (알람 3 / 인터락 2, 각 Step 포함)
├── samples/          # 업로드용 CSV/XLSX 샘플
└── README.md
```

---

## 실행 방법

### 1. 기존 cmpbeol DB 사용

이미 HeidiSQL 등에 만들어 둔 `cmpbeol` DB 를 그대로 사용합니다.
앱은 DB/테이블을 자동으로 생성하거나 초기화하지 않습니다.

- 필요한 테이블이 아직 없다면 `db/schema.sql` 을 **수동으로** 실행하세요. (참고용 스크립트)
- 샘플 데이터가 필요하면 `db/seed.sql` 을 수동 실행하세요. (선택)

> `db/schema.sql`, `db/seed.sql` 은 참고용이며 앱 실행 시 자동 실행되지 않습니다.

### 2. Backend 실행 (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
copy .env.example .env            # Windows (cp .env.example .env)
# backend/.env 를 열어 DATABASE_URL 의 비밀번호를 실제 값으로 수정
uvicorn app.main:app --reload --port 8000
```

- API 문서(Swagger): http://localhost:8000/docs
- 헬스체크: http://localhost:8000/api/health
- Step 이미지는 `backend/uploads/steps/` 에 저장되고 `/uploads/...` 로 서빙됩니다.

`backend/.env` 주요 항목:

```
DATABASE_URL=mysql+pymysql://root:your_password@127.0.0.1:3306/cmpbeol
AUTO_CREATE_TABLES=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
UPLOAD_DIR=uploads
```

- `DATABASE_URL` 은 코드에 하드코딩하지 않고 `.env` 에서만 읽습니다. 값이 없으면 앱이 시작되지 않습니다.
- `AUTO_CREATE_TABLES=true` 로 두면 **없는 테이블만** `create_all` 로 생성합니다(기존 테이블/데이터는 유지). 이미 테이블을 만들어 두었다면 `false` 권장.

### 3. Frontend 실행 (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- 화면: http://localhost:5173
- 개발 서버는 `/api` 및 `/uploads` 요청을 `http://localhost:8000` 으로 프록시합니다. (`vite.config.ts`)
- 백엔드가 다른 주소에 있으면 `frontend/.env` 에 `VITE_API_BASE_URL=http://your-host:8000` 을 설정하세요.

---

## CSV/XLSX 업로드

1. `/import` 이동 → 샘플 양식(CSV/XLSX) 다운로드
2. `samples/alarm_sample.csv` / `samples/interlock_sample.csv`(또는 `.xlsx`) 선택
3. 미리보기에서 각 행의 검증 상태와 **신규 / 업데이트** 여부 확인
4. **DB에 저장** → 정상 행만 저장, 결과 요약(총/성공/신규/업데이트/실패) 표시

> 같은 `(guide_type + equipment_model + code)` 조합이 이미 존재하면 신규 생성이 아니라 **업데이트**로 처리됩니다.
> 이미지는 업로드로 넣지 않고, 저장 후 각 가이드 수정 화면에서 Step별로 첨부합니다.

### 업로드 양식 컬럼

**필수**: `guide_type`(ALARM/INTERLOCK), `equipment_model`, `code`, `title`, `step1_description`

**선택(기본)**: `process_area`, `summary`

**선택(Step, 2~5)**: `step2_description` ~ `step5_description`

- 각 Step 은 텍스트 설명만 받습니다. 설명이 있는 Step 만 순서대로 생성됩니다.
- 이미지는 CSV/XLSX 로 처리하지 않고, 저장 후 각 Step 수정 화면에서 첨부합니다.

---

## API 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/guides` | 가이드 목록 (필터: `guide_type`, `equipment_model`, `process_area`, `q`, `is_active`) |
| POST | `/api/guides` | 가이드 등록 (steps 중첩 저장) |
| GET | `/api/guides/{id}` | 가이드 상세 (steps + images 포함) |
| PUT | `/api/guides/{id}` | 가이드 수정 (steps 를 id 기준으로 동기화 — 이미지 유지) |
| DELETE | `/api/guides/{id}` | 비활성화 (`?hard=true` 시 완전 삭제) |
| GET | `/api/guides/{id}/steps` | Step 목록 |
| POST | `/api/guides/{id}/steps` | Step 추가 |
| PUT | `/api/guides/{id}/steps/reorder` | Step 순서 변경 |
| PUT | `/api/steps/{step_id}` | Step 수정 |
| DELETE | `/api/steps/{step_id}` | Step 삭제 |
| POST | `/api/steps/{step_id}/images` | Step 이미지 업로드 (multipart) |
| DELETE | `/api/step-images/{image_id}` | Step 이미지 삭제 |
| POST | `/api/import/preview` | 파일 파싱 + 검증 (저장 X, 신규/업데이트 판별) |
| POST | `/api/import/confirm` | 검증된 행 일괄 저장 (upsert) |
| GET | `/api/import/template?format=csv\|xlsx` | 샘플 양식 다운로드 |

> 등록/수정 화면에서는 가이드와 Step 을 한 번에 저장하고(`POST`/`PUT /api/guides`), 개별 Step/이미지 엔드포인트는 세분화된 조작에 사용합니다.

---

## 이번 MVP에서 제외한 것

- 알람 발생 이력 / 조치 로그
- CSV/XLSX 내부 이미지 파싱 (이미지는 화면에서 Step별 첨부)
- 권한 관리 / 로그인
- 실제 설비 제어 · 인터락 리셋/바이패스
