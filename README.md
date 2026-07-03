# 설비 알람/인터락 조치 가이드 관리 (MVP)

CMP 설비의 **알람 / 인터락 조치방법**을 등록·검색·조회·수정하고, CSV/XLSX 파일로 일괄 등록할 수 있는 지식관리 시스템입니다.

> ⚠️ 이 시스템은 조치방법을 정리·조회하는 **가이드/지식관리 용도**입니다.
> 실제 설비 제어, 인터락 해제/리셋/바이패스 기능은 포함하지 않습니다.

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, Axios, Material UI |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, PyMySQL, pandas, openpyxl |
| DB | MySQL 8.0+ |

## 주요 기능

1. 알람 조치방법 직접 등록 / 검색 / 조회 / 수정 / 비활성화 (`/alarms`)
2. 인터락 조치방법 직접 등록 / 검색 / 조회 / 수정 / 비활성화 (`/interlocks`)
3. CSV/XLSX 업로드 → 미리보기·검증 → 일괄 등록 (`/import`)
   - 같은 `equipment_model + code` 조합은 **업데이트**, 없으면 **신규 생성**
4. CSV/XLSX 샘플 양식 다운로드 (`/settings`)

## 프로젝트 구조

```
cmpbeol/
├── backend/          # FastAPI 앱
│   └── app/
│       ├── main.py           # 엔트리포인트 + CORS
│       ├── config.py         # 환경설정 (.env)
│       ├── database.py       # SQLAlchemy 엔진/세션
│       ├── models.py         # ORM 모델
│       ├── schemas.py        # Pydantic 스키마
│       ├── import_config.py  # 업로드 컬럼 정의
│       ├── import_service.py # 파싱/검증/저장 로직
│       └── routers/          # API 라우터
├── frontend/         # React + Vite 앱
├── db/
│   ├── schema.sql    # 테이블 생성
│   └── seed.sql      # CMP 샘플 데이터 (알람 5 / 인터락 5)
├── samples/          # 업로드용 CSV/XLSX 샘플
└── README.md
```

---

## 실행 방법

### 1. MySQL DB 생성 + 스키마 + 시드

MySQL 8.0 이상이 설치되어 있어야 합니다. (schema.sql 안에서 `cmp_guide` DB를 생성합니다.)

```bash
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sql
```

> Windows에서 `mysql` CLI 경로가 없다면 MySQL Workbench에서 `db/schema.sql` → `db/seed.sql` 순서로 실행해도 됩니다.

### 2. Backend 실행 (FastAPI)

```bash
cd backend

# 가상환경
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# (macOS/Linux) source .venv/bin/activate

pip install -r requirements.txt

# 환경변수 설정 (.env.example 복사 후 DB 비밀번호 수정)
copy .env.example .env      # Windows
# cp .env.example .env       # macOS/Linux

# 실행
uvicorn app.main:app --reload --port 8000
```

- API 문서(Swagger): http://localhost:8000/docs
- 헬스체크: http://localhost:8000/api/health

`.env` 주요 항목:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cmp_guide
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Frontend 실행 (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- 화면: http://localhost:5173
- 개발 서버는 `/api` 요청을 자동으로 `http://localhost:8000` 으로 프록시합니다. (`vite.config.ts`)
- 백엔드가 다른 주소에 있으면 `frontend/.env` 에 `VITE_API_BASE_URL=http://your-host:8000` 을 설정하세요.

---

## CSV/XLSX 업로드 테스트 방법

1. 프론트엔드에서 좌측 **파일 업로드** 메뉴로 이동 (`/import`)
2. **업로드 타입**을 `알람` 또는 `인터락` 으로 선택
3. `samples/alarm_sample.csv` 또는 `samples/interlock_sample.csv` (또는 `.xlsx`) 파일을 선택
4. 미리보기 테이블에서 각 행의 검증 상태 확인
   - 정상 행: 초록색 "정상" 칩
   - 오류 행: 빨간색 "오류" 칩 (필수 컬럼 누락 등, 마우스오버 시 사유 표시)
5. **DB에 저장** 버튼 클릭 → 정상 행만 저장
6. 저장 후 결과 요약 표시: 총 행 수 / 성공 / 신규 생성 / 업데이트 / 실패

> 같은 `equipment_model + code` 조합이 이미 존재하면 신규 생성이 아니라 **업데이트**로 처리됩니다.
> 샘플 양식은 화면의 **CSV/XLSX 샘플 양식** 버튼 또는 `/settings` 에서도 내려받을 수 있습니다.

---

## 샘플 파일 컬럼 설명

### 알람 업로드 양식

**필수 컬럼**

| 컬럼 | 설명 |
|------|------|
| `equipment_model` | 설비 모델 (예: Mirra, Ebara, LK, LKP) |
| `alarm_code` | 알람 코드 |
| `alarm_name` | 알람명 |
| `action_method` | 조치 방법 |

**선택 컬럼**: `equipment_name`, `process`, `area`, `alarm_description`, `severity`, `category`, `cause`, `check_points`, `action_steps`, `caution`, `related_parts`, `owner_team`, `tags`

### 인터락 업로드 양식

**필수 컬럼**

| 컬럼 | 설명 |
|------|------|
| `equipment_model` | 설비 모델 |
| `interlock_code` | 인터락 코드 |
| `interlock_name` | 인터락명 |
| `action_method` | 조치 방법 |

**선택 컬럼**: `equipment_name`, `process`, `area`, `interlock_description`, `severity`, `category`, `trigger_condition`, `cause`, `check_points`, `action_steps`, `reset_condition`, `caution`, `related_parts`, `owner_team`, `approval_required`, `tags`

### 값 규칙

- `severity` : `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` 중 하나 (미입력 시 알람 MEDIUM / 인터락 HIGH)
- `approval_required` (인터락) : `true/false`, `1/0`, `yes/no`, `y/n`
- `tags` : 세미콜론(`;`) 또는 콤마(`,`)로 여러 값 구분 (예: `slurry;flow`)

---

## API 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/alarm-guides` | 알람 목록 (검색/필터) |
| POST | `/api/alarm-guides` | 알람 등록 |
| GET | `/api/alarm-guides/{id}` | 알람 상세 |
| PUT | `/api/alarm-guides/{id}` | 알람 수정 |
| DELETE | `/api/alarm-guides/{id}` | 비활성화 (`?hard=true` 시 완전 삭제) |
| GET/POST/PUT/DELETE | `/api/interlock-guides...` | 인터락 (동일 구조) |
| POST | `/api/import/preview` | 파일 파싱 + 검증 (저장 X) |
| POST | `/api/import/confirm` | 검증된 행 일괄 저장 (upsert) |
| GET | `/api/import/template/alarm?format=csv\|xlsx` | 알람 샘플 다운로드 |
| GET | `/api/import/template/interlock?format=csv\|xlsx` | 인터락 샘플 다운로드 |

목록 조회 필터 쿼리 파라미터: `search`, `equipment_name`, `equipment_model`, `process`, `alarm_code`/`interlock_code`, `severity`, `category`, `is_active`

---

## 이번 MVP에서 제외한 것

- 알람 발생 이력 / 조치 로그
- 복잡한 실시간 대시보드
- 권한 관리 / 로그인
- 실제 설비 제어 · 인터락 리셋/바이패스
