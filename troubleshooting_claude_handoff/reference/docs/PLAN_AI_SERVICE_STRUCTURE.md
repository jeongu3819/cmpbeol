# PLAN-AI 서비스 구조 문서

> 본 문서는 **현재 코드 기준**으로 작성된 구조 정리 문서입니다.
> 문서화 전용 작업으로, 코드/스키마/설정 변경은 포함하지 않습니다.
> 확인되지 않은 항목은 `확인 필요`로 표기했습니다.
> 민감정보(토큰/키/비밀번호)는 **변수명만** 표기하며 원문 값은 기재하지 않습니다.
>
> 기준 커밋: `main` 브랜치 / 작성일: 2026-06-13 / 사실관계 업데이트: 2026-06-14 / **코드 재확인 + AI요약 심화: 2026-06-27**

> ### 🔄 방향 전환 (2026-06-27 후속) — 프로젝트 내부 이미지 맥락 구조화 기반
> AI 요약 고도화의 방향이 확정되었습니다. **이번 구현의 핵심은 "이미지 인식 기능"이 아니라, 미래 vision/멀티모달 모델 API 연결을 위해 프로젝트 내부 이미지와 텍스트/Task/작업노트의 연관관계를 구조화하는 기반(`image_manifest`)을 만드는 것**입니다.
> - **AI 요약 대상은 "프로젝트 단위"로 유지** — Project / Sub Project / Task / Task 설명 / 작업노트(TaskActivity) / Project Note / Task·Project 첨부 / 프로젝트 내부에서 이들과 연결된 이미지.
> - **VOC 는 AI 요약 대상에서 제외** — VOC / 개선요청 / 공개 VOC / VOC 댓글 / VOC 첨부 이미지는 사용하지 않음. (이전 회차 문서가 "VOC/작업노트 이미지 활용"으로 적었던 부분은 본 방향으로 정정함)
> - **이미지 인식 구현보다 이미지-텍스트 맥락 구조화가 우선.** 현재 모델엔 이미지 바이트를 보내지 않으며, 기존 텍스트 요약 품질을 절대 건드리지 않음.
> - **이번 회차 실제 구현(코드)**: ① `app/services/project_ai_context_builder.py` (LLM 미호출, `text_context` + `image_manifest` 생성) ② `GET /api/projects/{id}/ai-context-preview` (LLM 미호출 디버깅/기반 확인용, 프로젝트 조회 권한) ③ DSLLM 어댑터에 모델 capability 메타(`vision_supported`) 추가(메타데이터 전용, 호출 경로 무변경). 상세는 섹션 10.5 신설.
> - 기존 `POST /api/report/generate` / `POST /api/projects/{id}/ai-query` 는 **무변경**(text-only, `image_manifest` 미전달).

> ### 🔄 최신화 (2026-06-27) — AI 요약 고도화 검토용
> 본 회차는 **"AI 요약 멀티모달(이미지) 확장"** 검토를 위해 현재 코드를 재확인했습니다. 핵심 사실:
> - **LLM 기반 AI 요약은 현재 2곳뿐**: `POST /api/report/generate`(프로젝트 AI 리포트, 4섹션) + `POST /api/projects/{id}/ai-query`(프로젝트 자유질의). 둘 다 **텍스트 전용**.
> - **설비운영 "AI 운영 요약" 카드(`EquipmentAiSummaryCard.tsx`)는 LLM 호출이 아님** — Project/Task/Sheet 로컬 데이터로 3~5줄 문장을 조립하는 프론트 연산. DSLLM 미사용.
> - **첨부파일은 AI 요약에 "파일명/URL 텍스트"로만 들어감** — 이미지 바이트는 LLM에 전혀 전달되지 않음. 즉 **멀티모달 요약은 미구현**.
> - **DSLLM 어댑터(`chat`/`chat_stream`)는 text-only 메시지 구조** — `messages=[{system}, {user}]`에 문자열 content만. `image_url`/멀티모달 content block 미지원.
> - **모델 설정**: `LLM_MODEL_1~4` env. `model_4`(기본 `Gemma4`)만 코드 설명상 "이미지 인식 가능"으로 라벨링돼 있으나 **실제 이미지 입력 경로는 어디에도 연결돼 있지 않음**. DSLLM 호출엔 **명시적 timeout 미설정**(OpenAI SDK 기본값 의존).
> - **이미지 첨부가 가능한 영역**: ① VOC 본문 첨부, ② VOC 댓글/추가문의 이미지, ③ Task DESCRIPTION 붙여넣기 이미지, ④ 단발 일정(CalendarEvent) 설명 이미지, ⑤ 공간 이미지(`/api/spaces/{id}/images`). 모두 **AI 요약과 미연결**.
> - **VOC 첨부 다운로드 엔드포인트는 인증 검증 없음**(코드 주석 명시: "인증은 별도 적용하지 않음 — task 첨부와 동일 정책"). 멀티모달 도입 시 **민감정보/권한 리스크 직결** → OPEN_RISK 문서 D 참조.
> - **그 사이 추가된 주요 기능**(2026-06-15~27): 실시간 동기화(SSE), 프로젝트별 커스텀 워크플로우 컬럼, VOC 공개/비공개·공감·댓글·처리율 통계, 단발 일정(CalendarEvent), 공간 생성제한/빈공간 자동보관, CSV/XLSX 가져오기, 공통 업로드 정책, 사내 추천 도구 스트립, 테마 토큰/빌더, 시스템 로그/사용통계. 라우트 수는 **~223개로 증가**(`@app.*` 데코레이터 기준, 섹션 6 참고).
> - **AI 요약 구조 + 멀티모달 영향 분석은 섹션 10에 신설**.

> ### 🔄 확정 사실관계 업데이트 (2026-06-14)
> - **실제 DB는 MySQL**이며, DB 확인/관리는 **HeidiSQL**로 수행한다.
> - `docker-compose.yml`의 **PostgreSQL/Redis는 현재 실사용하지 않음**(레거시 정의).
> - **HTTPS는 FastAPI 직접 TLS가 아니라 nginx**를 통해 적용된다. 운영 경로: `nginx → FastAPI(uvicorn) → MySQL`.
> - `backup_scheduler.py`의 import 오류는 **`app.utils.s3.s3_utils` 경로로 교정 완료**(2026-06-14). ⚠️ 단, 이 교정은 직전 워킹트리에는 반영되어 있지 않아 이번에 재확인 후 적용함 — 배포본에도 반영됐는지 확인 필요.
> - **현재 개발 환경에서는 `npm run build` 검증 불가**(vite 네이티브 크래시). 로컬 프론트 검증은 **`npm run type-check`** 기준. 최종 build 검증은 **사내 빌드/배포 서버에서 확인 필요**.
> - DB 커넥션 풀(MySQL: pool_size/max_overflow/recycle)은 **설정 완료**(2026-06-14).

---

## 1. 서비스 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | PLAN-AI (코드상 FastAPI title: `Antigravity Schedule Platform API`) |
| 서비스 목적 | 일정/프로젝트 관리 + 설비 운영 점검(Check Sheet) 통합 플랫폼 |
| 주요 사용자 | 사내 임직원 (SSO/ADFS 인증, Knox 사내 사용자 검색 연동) |
| 인증 방식 | ADFS/OAuth SSO (`app/routers/auth.py`), 로컬 개발은 `BYPASS_SSO=true` |

### 주요 기능

- **프로젝트 관리 공간** (`Space.purpose = project_management`)
  - 프로젝트/서브프로젝트/태스크 관리 (Board/List/Roadmap/Calendar/NodeGraph 등 다중 뷰)
  - 태스크 활동(체크리스트), 노트, 멘션, 첨부파일
  - 주간 진행/리포트, AI 리포트/AI 쿼리
- **설비 운영 공간** (`Space.purpose = equipment_ops`)
  - Excel 기반 Check Sheet 템플릿 업로드 → 실행본(Execution) 생성 → 항목 체크
  - 설비 운영 Dashboard (KPI, 약품, 설비 상태, AI 요약)
  - 주간/월간 Calendar (`확인 필요`: 캘린더 위젯 범위는 프론트 구현 기준 추가 확인)
- **공통 기능**
  - 공간/그룹/멤버 관리, 권한 관리
  - 어드민(사용자 관리, Knox 검색, 권한 변경, super_admin)
  - VOC/개선요청 (이미지 첨부 포함)
  - 대시보드 위젯, 바로가기(Shortcut), 알림(Knox Messenger)
  - 휴지통(soft delete + 3일 후 영구 삭제)

### 운영 환경 / 개발 환경

| 구분 | 내용 |
|------|------|
| 개발 환경 | `ENV_MODE=development` → `app/.env.local` 우선 로드, 없으면 `app/.env` |
| 운영 환경 | `ENV_MODE=production`(또는 그 외 값) → `app/.env.production` 로드 |
| 개발 DB | SQLite (`sqlite:///./dev.db` fallback) 가능 |
| 운영 DB | MySQL (PyMySQL) |
| 실행 스크립트 | `run_dev.ps1` (backend `python main.py` + frontend `npm run dev`) |
| 인프라(docker-compose) | PostgreSQL 16, Redis 7 정의 — **실사용하지 않음(레거시). 실제 DB는 MySQL** |
| DB 관리도구 | **HeidiSQL** 로 운영 MySQL 확인/관리 |
| HTTPS/프록시 | **nginx** 가 TLS 종단 + 리버스 프록시 (`nginx → FastAPI → MySQL`) |

> ✅ `docker-compose.yml`의 PostgreSQL/Redis는 **현재 미사용**입니다. 백엔드 코드(`environment.py`, `backup_scheduler.py`)는 MySQL/SQLite만 처리합니다.

---

## 2. 전체 폴더 구조

```
plan/
├── backend/                 # FastAPI 백엔드
│   ├── main.py              # FastAPI 앱 + 핵심 API (~9,340 라인 모놀리식, ~167개 라우트)
│   ├── requirements.txt     # Python 의존성
│   ├── migrations/          # SQL/py 마이그레이션 스크립트 (수동)
│   ├── uploads/             # 로컬 첨부/이미지 저장 디렉토리
│   └── app/
│       ├── environment.py   # env 로딩 (.env.local → .env → .env.production)
│       ├── config.py        # pydantic Settings (DSLLM/Knox/no_proxy)
│       ├── models.py        # SQLAlchemy ORM 모델 (~747라인)
│       ├── schemas.py       # Pydantic 스키마
│       ├── dependencies.py  # get_db 등 의존성
│       ├── db_connections/  # SQLAlchemy engine/session
│       ├── routers/         # auth.py(SSO), knox.py(사내검색) — 그 외는 main.py에 인라인
│       ├── services/        # 비즈니스 로직 (knox_client, backup_scheduler, notification 등)
│       ├── llm/             # dsllm_adapter.py (OpenAI SDK 기반 DSLLM 게이트웨이)
│       └── utils/           # s3/(s3_utils), text.py
├── frontend/                # React + TypeScript + Vite
│   └── src/
│       ├── pages/           # 라우트 레벨 페이지
│       ├── components/      # 공용 컴포넌트 (equipment/, voc/, space/, sheets/ 포함)
│       ├── features/        # project/, task/ 기능 뷰
│       ├── api/             # client.ts (Axios)
│       ├── stores/          # Zustand (useAppStore)
│       ├── context/         # UserContext
│       ├── hooks/, layouts/, types/, utils/
│       ├── App.tsx          # 라우팅
│       └── main.tsx         # 엔트리
├── docs/                    # 본 문서 디렉토리
├── data.json                # 레거시 데이터 (data.json → DB 전환 흔적)
├── docker-compose.yml       # PostgreSQL 16 + Redis 7 (실사용 여부 확인 필요)
└── run_dev.ps1              # 로컬 개발 실행 스크립트
```

### 요청된 경로 확인 결과

| 요청 경로 | 실제 존재 여부 | 비고 |
|-----------|----------------|------|
| `backend/main.py` | ✅ 존재 | ~9,340라인 모놀리식 |
| `backend/app/` | ✅ 존재 | |
| `backend/app/routers/` | ✅ 존재 | `auth.py`, `knox.py`만 존재 (나머지 라우트는 main.py 인라인) |
| `backend/app/models/` | ❌ 디렉토리 없음 | 단일 파일 `backend/app/models.py` |
| `backend/app/services/` | ✅ 존재 | backup_scheduler, knox_client, knox_messenger_service, notification_service, sheet_parser |
| `backend/app/llm/` | ✅ 존재 | `dsllm_adapter.py` |
| `backend/app/scheduler/` | ❌ 디렉토리 비어있음/없음 | 스케줄러는 `app/services/backup_scheduler.py`에 위치 |
| `frontend/src/` | ✅ 존재 | |
| `frontend/src/pages/` | ✅ 존재 | |
| `frontend/src/components/` | ✅ 존재 | |
| `frontend/src/api/` | ✅ 존재 | `client.ts` 단일 파일 |

---

## 3. 기술 스택

### Frontend

| 항목 | 내용 |
|------|------|
| Framework | React 18 + Vite |
| TypeScript | ✅ 사용 (`tsc && vite build`) |
| UI | MUI 7 + Tailwind CSS (이중 스타일링) |
| 주요 라이브러리 | @dnd-kit(드래그), TipTap(리치텍스트), React Flow + dagre(노드그래프), Recharts(차트), React Grid Layout(위젯), React Hook Form + Zod(폼) |
| 라우팅 | React Router v6 (`App.tsx`) |
| 상태 관리 | Zustand(`stores/useAppStore.ts`) 클라이언트 상태 + TanStack Query 서버 상태 |
| API 호출 | Axios 인터셉터(`api/client.ts`), localStorage `session_token` Bearer 자동 첨부 |
| 실행 명령 | `npm run dev` (Vite, port 5173) |
| 빌드 명령 | `npm run build` (`tsc && vite build`) |
| 빌드 결과물 위치 | Vite 기본값 `dist/` 추정 — `vite.config`에 `outDir` 명시 없음 → 기본 `frontend/dist/` (`확인 필요`) |
| API URL | `VITE_API_URL` 또는 `http://{hostname}:8085/api` |

### Backend

| 항목 | 내용 |
|------|------|
| Framework | FastAPI |
| 실행 방식 | `uvicorn.run("main:app", host="0.0.0.0", port=8085, reload=True)` (main.py `__main__`) |
| 주요 라이브러리 | sqlalchemy 2.x, pymysql, httpx, requests, openai>=1.30, PyJWT, boto3, s3fs, apscheduler, openpyxl, Pillow |
| API 서버 포트 | 8085 |
| HTTPS | FastAPI는 직접 TLS 미설정(HTTP). **HTTPS는 nginx가 TLS 종단**으로 처리 (확정). nginx 설정 체크리스트는 `RUNBOOK_OPEN_STABILITY.md` 참조 |
| CORS | `CORSMiddleware`, `allow_origins=CORS_ORIGINS or ["*"]`, 사설 IP 정규식 허용, `allow_credentials=False` |
| 인증 방식 | ADFS/OAuth SSO + 인메모리 세션(dict, 24h TTL), JWT Bearer |
| Scheduler | ✅ APScheduler (`backup_scheduler.py`) — startup에서 시작 |

### Database

| 항목 | 내용 |
|------|------|
| DB 종류 | **MySQL(운영, PyMySQL)** / SQLite(개발) — `DATABASE_URL`로 결정. 운영 DB는 HeidiSQL로 관리 |
| 연결 방식 | SQLAlchemy engine/session (`app/db_connections/sqlalchemy.py`). **MySQL 커넥션 풀 설정 완료**(pool_size=10/max_overflow=20/pool_recycle=1800/pool_pre_ping, `DB_*` env 조정 가능; SQLite는 미적용) |
| ORM | ✅ SQLAlchemy 2.x |
| 주요 모델 | Space, SpaceMember, Project, Task, User, Note, Attachment, Group, VocItem 등 (섹션 7 참조) |
| 마이그레이션 | 마이그레이션 프레임워크 없음. `main.py _run_migrations()`의 inspect + ALTER TABLE + `Base.metadata.create_all()` 방식. 추가로 `backend/migrations/`에 수동 SQL/py 스크립트 존재 |
| 백업 | APScheduler 하루 1회: SQLite는 파일 복사, MySQL은 `mysqldump` → S3 업로드 (섹션 5 백업 참조) |

### File / Object Storage

| 항목 | 내용 |
|------|------|
| 이미지 저장 | S3(s3fs) 우선, 미구성 시 로컬 `uploads/` fallback |
| 첨부파일 저장 | 동일 (S3 + 로컬) |
| S3 사용 | ✅ s3fs 기반 (`app/utils/s3/s3_utils.py`) |
| S3 bucket/prefix 변수 | `BASE_S3_PATH`(기본 `s3://fdc-portal/FDC/plan-a`), `BUCKET_NAME`(기본 `fdc-portal`) |
| 로컬 fallback | ✅ `is_s3_configured()` False면 로컬 저장 |
| 이미지 압축/리사이즈 | ✅ VOC 이미지 한정: 긴 변 기준 리사이즈 + webp 변환 (`_optimize_voc_image`) |
| Pillow 사용 | ✅ `from PIL import Image` (VOC 이미지 최적화). 미설치 시 except로 원본 저장 fallback |

---

## 4. 환경변수 구조

> 출처: `backend/app/environment.py`, `backend/app/config.py`, `backend/app/utils/s3/s3_utils.py`, `backend/app/services/*`, `backend/main.py`
> 민감정보는 값 없이 변수명만 표기.

| 변수명 | 사용 위치 | 목적 | 필수 여부 | 민감정보 | 비고 |
|--------|-----------|------|-----------|----------|------|
| `ENV_MODE` | environment.py, config.py | 실행 환경 분기(development/production) | 권장 | N | 기본 `development` |
| `DATABASE_URL` | environment.py, backup_scheduler.py | DB 접속 문자열 | ✅(운영) | **Y**(접속정보 포함) | 기본 fallback에 placeholder 존재 |
| `BYPASS_SSO` | environment.py | 로컬 SSO 우회 | N | N | 운영은 false |
| `BYPASS_LOGINID`/`LOGIN_ID` | environment.py | bypass 사용자 ID | N | N | |
| `BYPASS_USERNAME`/`USER_NAME` | environment.py | bypass 사용자명 | N | N | |
| `BYPASS_DEPTNAME`/`USER_DEPARTMENT` | environment.py | bypass 부서 | N | N | |
| `BYPASS_MAIL`/`USER_MAIL` | environment.py | bypass 메일 | N | N | |
| `ADFS_TOKEN_URL` | environment.py, auth.py | ADFS 토큰 URL | ✅(운영) | N | |
| `ADFS_AUTH_URL` | environment.py, auth.py | ADFS 인증 URL | N | N | 기본값 존재 |
| `CLIENT_ID`/`SSO_CLIENT_ID` | environment.py | SSO 클라이언트 ID | ✅(운영) | **Y** | |
| `CLIENT_SECRET`/`SSO_CLIENT_SECRET` | environment.py | SSO 시크릿 | ✅(운영) | **Y** | |
| `REDIRECT_URI` | environment.py | SSO 콜백 URI | ✅(운영) | N | |
| `FRONTEND_REDIRECT_URI`/`REDIRECT_URI_LOCAL` | environment.py | 로그인 후 프론트 리다이렉트 | N | N | |
| `SUPER_ADMIN_LOGINIDS` | environment.py | super_admin 계정 목록 | N | N | 기본값에 하드코딩 ID 존재 |
| `CORS_ORIGINS` | environment.py, main.py | 허용 Origin 목록 | 권장 | N | 미설정 시 `["*"]` fallback |
| `API_KEY` | config.py (DSLLM) | DSLLM 게이트웨이 API 키 | ✅(AI사용 시) | **Y** | 코드상 마스킹 처리 |
| `BASE_URL` | config.py (DSLLM) | DSLLM 게이트웨이 base URL | ✅(AI사용 시) | N | https 강제 |
| `LLM_MODEL_1` | config.py | DSLLM 모델1 | ✅(AI사용 시) | N | 기본 `GPT-OSS` |
| `LLM_MODEL_2` | config.py | DSLLM 모델2 | N | N | 기본 `GaussO3.2` |
| `LLM_MODEL_3` | config.py | DSLLM 모델3 | N | N | 기본 `GaussO4.1` |
| `LLM_MODEL_4` | config.py | DSLLM 모델4(이미지) | N | N | 기본 `Gemma4` |
| `DSLLM_NO_PROXY` | config.py | DSLLM 프록시 우회 호스트 | N | N | 비우면 BASE_URL 호스트만 우회 |
| `KNOX_API_URL` | knox_client.py, config.py | Knox 사내검색 API URL | ✅(Knox검색 시) | N | 매 호출 시 os.getenv |
| `KNOX_AUTH_TOKEN` | knox_client.py, config.py | Knox 인증 토큰 | ✅(Knox검색 시) | **Y** | Bearer로 사용, 로그엔 configured 여부만 |
| `KNOX_SYSTEM_ID` | knox_client.py, config.py | Knox System-ID 헤더 | ✅(Knox검색 시) | **Y(준)** | |
| `KNOX_MESSENGER_ENABLED` | environment.py | Knox 메신저 알림 활성화 | N | N | 기본 false |
| `KNOX_MESSENGER_API_BASE_URL` | environment.py | Knox 메신저 API URL | N | N | |
| `KNOX_MESSENGER_API_TOKEN` | environment.py | Knox 메신저 토큰 | N | **Y** | |
| `KNOX_MESSENGER_TIMEOUT_SECONDS` | environment.py | 메신저 timeout | N | N | 기본 5초 |
| `KNOX_MESSENGER_VERIFY_SSL` | environment.py | 메신저 SSL 검증 | N | N | 기본 true |
| `KNOX_MESSENGER_DRY_RUN` | environment.py | 메신저 드라이런 | N | N | |
| `AWS_ACCESS_KEY_ID` | s3_utils.py, environment.py | S3 액세스 키 | ✅(S3사용 시) | **Y** | |
| `AWS_SECRET_ACCESS_KEY` | s3_utils.py, environment.py | S3 시크릿 키 | ✅(S3사용 시) | **Y** | |
| `S3_ENDPOINT_URL` | s3_utils.py, environment.py | S3 엔드포인트 | ✅(S3사용 시) | N | placeholder면 미구성 처리 |
| `S3_REGION_NAME` | s3_utils.py, environment.py | S3 리전 | N | N | 기본 `us-east-1` |
| `BASE_S3_PATH` | s3_utils.py, environment.py | S3 base 경로(prefix) | N | N | 기본 `s3://fdc-portal/FDC/plan-a` |
| `BUCKET_NAME` | environment.py | 버킷명 | N | N | 기본 `fdc-portal` |
| `BACKUP_HOUR` | environment.py, backup_scheduler.py | 백업 시각(시) | N | N | 기본 3(KST) |
| `BACKUP_MINUTE` | environment.py, backup_scheduler.py | 백업 시각(분) | N | N | 기본 0 |
| `BACKUP_DELETE_LOCAL` | backup_scheduler.py | 백업 후 로컬삭제 | N | N | 기본 true |
| `UPLOAD_DIR` | backup_scheduler.py | 업로드 디렉토리 | N | N | 기본 `uploads` |
| `MYSQLDUMP_PATH` | backup_scheduler.py | mysqldump 경로 | N | N | 기본 `mysqldump` |
| `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY`/`no_proxy` | knox_client.py, config.py | 프록시 제어 | N | N | knox_client는 trust_env=False로 무시 |
| `VITE_API_URL` | frontend/api/client.ts | 프론트 API base URL | N | N | 미설정 시 `http://{hostname}:8085/api` |

> 요청 목록 중 `S3_BUCKET`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`/`S3_REGION`/`S3_PREFIX`는 **코드에 그 이름으로는 존재하지 않음.**
> 실제 코드 변수명은 `BUCKET_NAME` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_REGION_NAME` / `BASE_S3_PATH`(prefix 포함).

---

## 5. 주요 기능 구조

### 공간(Space) 관리
- 생성/수정/삭제: `POST/PATCH/DELETE /api/spaces/{space_id}` (main.py)
- 멤버 관리: `POST /api/spaces/{space_id}/members`, `members/knox`(Knox 추가), `members/groups`(그룹 일괄 추가), `DELETE .../members/{id}`, `PATCH .../members/{id}/role`
- 멤버 후보 검색: `GET /api/spaces/{space_id}/member-candidates`
- 가입 요청: `POST /api/spaces/{space_id}/join-request`, 승인 처리 엔드포인트 존재
- 공간별 권한: `SpaceMember.role` = owner / admin / member, `_require_space_admin()`로 검증
- 공간 목적(purpose): `project_management / equipment_ops / process_change / sw_dev / integrated_ops / custom` → 대시보드/위젯 분기
- **프로젝트 관리 vs 설비 운영 차이**: `Space.purpose` 값에 따라 프론트가 다른 대시보드/뷰를 렌더. 설비 운영은 Sheet 기능(템플릿/실행본) 중심

### 그룹 관리
- 조직 그룹: `Group`(CENTER/TEAM/GROUP/PART 계층), `GroupMembership`
- 멤버 그룹(사용자 정의 묶음): `MemberGroup` / `MemberGroupUser` — `GET/POST/PATCH/DELETE /api/member-groups`
- 그룹 CRUD: `/api/groups`, `/api/admin/groups`, `/api/admin/org/groups`
- Knox 검색 연동: 멤버 후보/Knox 추가 시 `knox_search_employees` 호출
- 사이트 사용자 검색: `GET /api/users/search`, `GET /api/member-groups/member-candidates`

### 어드민
- 사용자 관리: `GET /api/admin/users`, toggle-active, role 변경, 삭제
- Knox 검색: `GET /api/employees`(knox.py), `GET /api/debug/knox/search`(super_admin)
- 권한 변경: `PATCH /api/admin/users/{id}/role`
- super_admin: `SUPER_ADMIN_LOGINIDS`(env), `require_super_admin()`, 시작 시 `ensure_super_owner()`로 강제 보장
- 조직 트리: `GET /api/admin/org/tree`, 사용자 배정/미배정 조회

### 개선요청 / VOC
- 생성/조회/수정/삭제: `POST/GET/PATCH/DELETE /api/voc[/{voc_id}]`
- 권한: 본인 글은 본인, 그 외는 `_is_voc_admin` 관리자만 수정/삭제
- 이미지 첨부: `POST /api/voc/{voc_id}/attachments`, 다운로드/삭제 엔드포인트 존재
- 이미지 저장: `_optimize_voc_image`로 리사이즈 + **webp 변환** 후 저장 (원본 미보관)
- 이미지 최적화: Pillow 사용, 실패 시 원본 저장 fallback
- S3 삭제: `_delete_voc_attachment_storage` — **best-effort(예외 전파 안 함)**, S3/로컬 개별 try
- 통계 카드: VOC 목록/상태 집계 (`확인 필요`: 통계 카드 구체 산출은 프론트 기준 추가 확인)

### Dashboard
- 프로젝트 관리 Dashboard / 설비 운영 Dashboard: `HomePage.tsx` + `components/equipment/EquipmentOpsDashboard.tsx`
- 설비 위젯: `EquipmentOpsWidgets.tsx`, `EquipmentKpiCards.tsx`, `EquipmentChemicalsCard.tsx`, `EquipmentStatusStrip.tsx`, `EquipmentAiSummaryCard.tsx`
- Widget Settings: `HomePage.tsx` 및 equipment 컴포넌트에서 참조
- 공간 타입별 위젯 분리: `Space.purpose` 기반 분기 (최근 커밋 `feat(equipment): Widget Settings 설비운영 카탈로그 분리 + 캘린더 추가`) — **세부 분리 정합성은 섹션 9 이슈 참조**
- 설비 운영 주간/월간 Calendar: `DashboardCalendar.tsx` 존재, 캘린더 추가 커밋 확인됨

### AI Report / DSLLM
- 어댑터: `app/llm/dsllm_adapter.py`
- OpenAI SDK 사용: ✅ `from openai import OpenAI` (`chat`, `chat_stream`)
- **메시지 구조는 text-only**: `messages=[{"role":"system",...}, {"role":"user",...}]`에 **문자열 content만** 전달. `image_url`/멀티모달 content block 미사용 → **현재 이미지 입력 경로 없음**
- 모델 선택: env `LLM_MODEL_1~4` 기반 목록, 프론트 드롭다운(`DS/{model}` key), legacy alias 변환(`Guass→Gauss` 오타 보정)
- 모델 설명(`_MODEL_DESCRIPTIONS`): model_1~3 = "tool call/Reasoning 가능", **model_4 = "이미지 인식 가능"**. 단 이 라벨은 메타데이터일 뿐 **실제 vision 호출 코드는 없음**
- API_KEY / BASE_URL 관리: **항상 env에서만** 읽음. 호출자/DB가 넘긴 base_url은 무시(경고 로그). BASE_URL은 `https://` 강제
- **timeout**: `chat()`/`chat_stream()`에 **명시적 timeout 미설정** → OpenAI SDK 기본값 의존. (멀티모달 도입 시 지연 리스크 직결 — OPEN_RISK B 참조)
- `chat_stream()` 제너레이터는 정의돼 있으나 **AI 리포트/쿼리에는 미사용**(현재 `dsllm_chat` 비스트리밍만 호출). StreamingResponse는 시트 export 등 무관한 곳에서만 사용
- proxy/no_proxy: `config.py _configure_dsllm_no_proxy()` — `no_proxy="*"` 전역 강제 제거, DSLLM 호스트만 우회 추가
- 장애 시: 호출 실패를 `RuntimeError`로 감싸 모델/base_url/에러타입 포함. main.py 호출부는 `requests` 예외(Connection/Timeout/HTTP) + 일반 Exception을 각각 502/504/500으로 매핑하고 `_log_dsllm_failure`로 기록
- 관련 API: `GET /api/settings/ai/models`(super_admin), `GET/PUT /api/settings/ai`(super_admin, **model_name만 DB 저장**), `POST /api/report/generate`, `POST /api/projects/{id}/ai-query`
- **상세 구조 + 멀티모달 확장 영향은 섹션 10 참조**

### 설비운영 "AI 운영 요약" (LLM 아님)
- 위치: `frontend/src/components/equipment/EquipmentAiSummaryCard.tsx`
- **DSLLM 미호출** — Project/Task/SheetExecution 로컬 데이터(`summarizeEquipment`, `summarizeSheetStatus`)로 상태/이슈/진행률/다음작업/최근변경/담당자를 3~5줄 문장으로 조립
- "AI Report에서 상세 분석 보기" 버튼으로 실제 LLM 리포트(AI Report 탭)로 분리 이동
- ⚠️ 이름에 "AI"가 들어가지만 멀티모달/LLM 확장 대상이 아님 (혼동 주의)

### Knox 연동
- 호출 위치: `app/services/knox_client.py` (`knox_search_employees`, `knox_lookup_user`)
- 라우터: `app/routers/knox.py` (`GET /api/employees`), main.py 내 멤버 후보 검색
- env: `KNOX_API_URL`(POST 대상), `KNOX_AUTH_TOKEN`(Bearer), `KNOX_SYSTEM_ID`(System-ID 헤더) — **매 호출 시 os.getenv로 읽음**
- 로컬/서버 차이: `trust_env=False`로 프록시/no_proxy env 무시, 사내망 직접 연결. `verify=False`
- timeout: `httpx.Timeout(20.0, connect=10.0)`
- 에러 구분: `KnoxError.error_type` (ConnectTimeout/ReadTimeout/ConnectError/Unauthorized/NotFound/ConfigMissing 등) → 프론트엔 친화 메시지 매핑

### 백업 / Scheduler
- 위치: `app/services/backup_scheduler.py` (APScheduler `BackgroundScheduler`, timezone Asia/Seoul)
- 실행 시점: 매일 `BACKUP_HOUR:BACKUP_MINUTE` (기본 03:00 KST), `misfire_grace_time=3600`
- 시작: FastAPI `@app.on_event("startup")`에서 `start_backup_scheduler()` (try/except로 감쌈)
- S3 백업: DB dump → `db-backups/{date}/...` 업로드, 성공 시 로컬 삭제(설정), 실패 시 로컬 보존
- 하루 1회: ✅ (cron 1회)
- 백업 실패 처리: 로그 파일(`backup_logs/backup_YYYY-MM.log`) 기록, 예외는 잡아서 결과 dict 반환
- 복구 기능: **자동 복구 엔드포인트 없음** (수동 복구 전제) — 섹션 9/리스크 문서 참조
- 수동 실행 API: `POST /api/admin/backup/db`, `POST /api/admin/backup/files`, `GET /api/admin/backup/status`, `GET /api/admin/s3/files` (super_admin)

> ⚠️ **확인된 버그**: `backup_scheduler.py`는 `from utils.s3.s3_utils import ...`를 사용하나 실제 패키지는 `app.utils.s3.s3_utils`이며 `backend/utils` 최상위 패키지는 **존재하지 않음**. → `No module named 'utils'` 발생 가능. 섹션 9 참조.

---

## 6. API 구조

> FastAPI 라우트 총 **~223개**(2026-06-27 `@app.*` 데코레이터 기준, 기존 ~167개에서 증가). 대부분 `main.py`에 `@app.*`로 인라인 정의, 인증/Knox만 별도 라우터.
> 그 사이 추가된 라우트군(발췌): 실시간 SSE(`/api/events/stream`, `/api/events/ticket`, `realtime/bulk-event`), 커스텀 워크플로우(`/api/projects/{id}/workflow-columns`, `workflow-mode`), 단발 일정(`/api/spaces/{id}/calendar-events`, `convert-to-task`), VOC 공감/댓글/통계(`/api/voc/{id}/vote`, `comments`, `comment-images`, `/api/voc/stats`), 공간 lifecycle(`/api/admin/spaces/*`), 사내 추천도구(`/api/internal-recommendations*`), 시스템 로그/사용통계(`/api/admin/system-logs*`, `usage-stats`), 활동 이력(`/api/activity-logs`).
> 인증 패턴 주의: **다수 엔드포인트가 `user_id`를 쿼리 파라미터로 받아 권한을 판단**(세션 토큰에서 강제 도출하지 않음). 보안 리스크는 OPEN_RISK 문서 참조.

### 라우터 파일

| Router file | prefix | 주요 역할 |
|-------------|--------|-----------|
| `app/routers/auth.py` | `/api/auth` | SSO 로그인/콜백, 세션 |
| `app/routers/knox.py` | `/api` | Knox 사내 사용자 검색 (`/employees`) |
| `main.py` | (없음/`/api`) | 그 외 전 영역 |

### 대표 엔드포인트 (발췌)

| Method | Path | Router | 기능 | 인증 | 권한 조건 | 주요 모델/서비스 |
|--------|------|--------|------|------|-----------|------------------|
| GET | `/health` | main.py | 헬스체크 | N | - | - |
| GET | `/api/auth/...` | auth.py | SSO 로그인/콜백 | - | - | SESSIONS(dict) |
| GET | `/api/employees` | knox.py | Knox 사용자 검색 | `확인 필요` | - | knox_client |
| GET/POST | `/api/users` | main.py | 사용자 조회/생성 | Bearer | - | User |
| PATCH/DELETE | `/api/users/{id}` | main.py | 사용자 수정/삭제 | Bearer | `확인 필요` | User |
| GET/POST | `/api/projects` | main.py | 프로젝트 목록/생성 | Bearer | 멤버/소유자 | Project |
| PATCH/DELETE | `/api/projects/{id}` | main.py | 수정/소프트삭제 | Bearer | owner/super_admin | Project |
| POST | `/api/projects/{id}/restore` | main.py | 복구 | Bearer | - | Project |
| GET/POST | `/api/tasks` | main.py | 태스크 목록/생성 | Bearer | 프로젝트 멤버 | Task |
| PATCH/DELETE | `/api/tasks/{id}` | main.py | 태스크 수정/삭제 | Bearer | - | Task |
| POST | `/api/tasks/{id}/files` | main.py | 파일 업로드 | Bearer | - | ProjectFile/S3 |
| GET | `/api/roadmap`, `/api/roadmap/global` | main.py | 로드맵 | Bearer | - | Task/Project |
| GET | `/api/stats` | main.py | 통계 | Bearer | - | 집계 |
| POST | `/api/report/generate` | main.py | AI 리포트 생성 | Bearer | - | dsllm_adapter, ProjectAiReport |
| POST | `/api/projects/{id}/ai-query` | main.py | AI 쿼리 | Bearer | - | dsllm_adapter, ProjectAiQuery |
| GET/PUT | `/api/settings/ai` | main.py | AI 설정 | Bearer | **super_admin** | AiSetting |
| GET | `/api/debug/knox/search` | main.py | Knox 디버그 | Bearer | **super_admin** | knox_client |
| GET | `/api/admin/users` | main.py | 어드민 사용자 | Bearer | admin/super | User |
| PATCH | `/api/admin/users/{id}/role` | main.py | 권한 변경 | Bearer | super_admin | User |
| GET | `/api/admin/org/tree` | main.py | 조직 트리 | Bearer | admin | Group/GroupMembership |
| GET/POST | `/api/spaces` | main.py | 공간 목록/생성 | Bearer | - | Space/SpaceMember |
| POST | `/api/spaces/{id}/members/knox` | main.py | Knox로 멤버 추가 | Bearer | space admin | knox_client |
| POST | `/api/sheet-templates/upload` | main.py | 시트 템플릿 업로드 | Bearer | - | SheetTemplate, sheet_parser |
| POST | `/api/sheet-executions` | main.py | 시트 실행본 생성 | Bearer | - | SheetExecution |
| PATCH | `/api/sheet-executions/{id}/items/{item_id}` | main.py | 항목 체크 | Bearer | - | SheetExecutionItem/Log |
| GET | `/api/sheet-executions/{id}/export` | main.py | Excel 내보내기 | Bearer | - | openpyxl |
| POST/GET/PATCH/DELETE | `/api/voc[/{id}]` | main.py | VOC CRUD | `user_id` query | 본인/voc admin | VocItem |
| POST/DELETE | `/api/voc/{id}/attachments` | main.py | VOC 첨부 | `user_id` query | - | VocAttachment/S3 |
| POST | `/api/admin/backup/db`/`files` | main.py | 수동 백업 | Bearer | super_admin | backup_scheduler |
| GET | `/api/admin/backup/status` | main.py | 백업 상태 | Bearer | super_admin | backup_scheduler |

> 전체 167개 엔드포인트의 행별 인증/권한 매핑은 **`확인 필요`** (자동 정적 추출이 아닌 개별 함수 확인 필요). 위 표는 라인 그렙 기반 대표 발췌입니다.

---

## 7. DB 모델 / 테이블 구조

> 출처: `backend/app/models.py`. 삭제 정책 `CASCADE`는 FK `ondelete="CASCADE"` 기준.

| 테이블명 | 모델명 | 주요 컬럼 | 관계 | 삭제 정책 | 인덱스 | 주의사항 |
|----------|--------|-----------|------|-----------|--------|----------|
| `spaces` | Space | name, slug(unique), purpose, created_by | Project/SpaceMember | soft(`is_active`) | slug | purpose로 대시보드 분기 |
| `space_members` | SpaceMember | space_id, user_id, role | Space↔User | space CASCADE | uq(space,user) | role owner/admin/member |
| `space_join_requests` | SpaceJoinRequest | space_id, user_id, status | | space CASCADE | uq(space,user,status) | |
| `projects` | Project | name, space_id, owner_id, visibility, permissions(JSON), archived_at | Space/Task | soft(`archived_at`) | space_id 등 | |
| `users` | User | loginid(unique), username, role, is_active, primary_team_id | 다수 | soft(`is_active`) | loginid | role member/admin(+super_admin 동적) |
| `tasks` | Task | project_id, title, status, assignee_ids(JSON), archived_at | Project/SubProject | soft(`archived_at`) | project_id | 날짜는 문자열 YYYY-MM-DD |
| `task_activities` | TaskActivity | task_id, content(LONGTEXT), checked, style(JSON) | Task | task CASCADE | task_id | |
| `sub_projects` | SubProject | project_id, parent_id | Project | `확인 필요` | project_id | |
| `notes` | Note | project_id, author_id, content | Project | - | project_id | |
| `note_mentions` | NoteMention | note_id, user_id | Note | note CASCADE | uq(note,user) | |
| `task_activity_mentions` | TaskActivityMention | activity_id, user_id | TaskActivity | activity CASCADE | uq | |
| `attachments` | Attachment | task_id, url, type | Task | `확인 필요` | task_id | URL/파일 첨부 |
| `project_members` | ProjectMember | project_id, user_id(복합PK), role | Project↔User | - | uq | |
| `join_requests` | JoinRequest | project_id, user_id, status | | - | project_id | |
| `project_files` | ProjectFile | project_id, filename, stored_name, size | Project | `확인 필요` | project_id | S3/로컬 저장 |
| `groups` | Group | name(unique), parent_id, group_type, sort_order | self/계층 | - | name | CENTER/TEAM/GROUP/PART |
| `group_memberships` | GroupMembership | user_id, group_id, org_role, detail_level | User↔Group | - | uq(user,group) | |
| `member_groups` | MemberGroup | name, created_by | | - | - | 사용자 정의 묶음 |
| `member_group_users` | MemberGroupUser | group_id, user_id | MemberGroup | group CASCADE | uq | |
| `user_preferences` | UserPreference | user_id(PK), layout(JSON) | User | - | - | 대시보드 레이아웃 |
| `shortcuts` / `user_shortcuts` | Shortcut/UserShortcut | name, url, visibility | User | - | - | 공유 모델 |
| `ai_settings` | AiSetting | api_url, model_name, api_key | - | - | - | **api_key 컬럼 존재(DB 저장 가능)** — 단 DSLLM은 env 우선 |
| `project_ai_reports` | ProjectAiReport | project_id, overview, raw_response, model | Project | - | ix(project,created) | |
| `project_ai_queries` | ProjectAiQuery | project_id, user_id, query, response | Project/User | - | ix 2개 | |
| `sheet_templates` | SheetTemplate | space_id, structure(JSON), structure_hash | Space | - | ix(space,created) | Excel 파싱 구조 |
| `sheet_executions` | SheetExecution | template_id, project_id, space_id, status, progress | Template/Project/Space | - | ix 4개 | |
| `sheet_execution_items` | SheetExecutionItem | execution_id, cell_ref, checked, value, memo | Execution | execution CASCADE | ix | |
| `sheet_execution_logs` | SheetExecutionLog | execution_id, action, old/new_value | Execution | execution CASCADE | ix | 감사 로그 |
| `sheet_execution_mappings` | SheetExecutionMapping | execution_id, master_name, assigned_entity | Execution | execution CASCADE | ix | assignment_mapping |
| `notification_logs` | NotificationLog | event_type, target_user_id, dedup_key, status | User/Project/Task | user CASCADE 등 | ix 2개 | 중복발송 방지 |
| `voc_items` | VocItem | author_id, title, category, status, priority | User | - | ix(status,created) | 전역 피드백 |
| `voc_attachments` | VocAttachment | voc_id, stored_name, content_type, s3_key, width/height | VocItem | voc CASCADE | ix(voc,created) | webp 최적화본만 저장 |
| `visit_log` | VisitLog | ip_address, user_id, visit_date | User | - | visit_date | 방문 로그 미들웨어 |
| `activity_logs` | ActivityLog | user_id, action, entity_type, meta(JSON) | User | - | entity_id | |

### 요청된 테이블 매핑

| 요청 | 실제 테이블 |
|------|-------------|
| users | `users` ✅ |
| spaces | `spaces` ✅ |
| space_members | `space_members` ✅ |
| groups | `groups`(조직) + `member_groups`(사용자 묶음) |
| group_members | `group_memberships` + `member_group_users` |
| voc / improvement request | `voc_items` |
| voc attachment | `voc_attachments` |
| dashboard widget settings | **전용 테이블 없음** — `user_preferences.layout`(JSON)에 저장 추정 (`확인 필요`) |
| backup 관련 테이블 | **전용 테이블 없음** — 파일 로그(`backup_logs/`)만 사용 |

---

## 8. 배포 / 운영 구조

| 항목 | 내용 |
|------|------|
| frontend build | `npm run build` (`tsc && vite build`) |
| frontend dist 위치 | `frontend/dist/` (Vite 기본값, `outDir` 미지정) — `확인 필요` |
| backend 실행 | `python main.py` → `uvicorn.run("main:app", host=0.0.0.0, port=8085, reload=True)` |
| uvicorn 실행 방식 | 코드 내장 실행(개발: reload=True). 운영 reload/워커 수 `확인 필요` |
| HTTPS | 코드 내 TLS 미설정. 외부 리버스 프록시(nginx 등) 추정 — `확인 필요` |
| nginx | 저장소 내 설정 파일 없음 — `확인 필요` |
| 포트 구조 | backend 8085, frontend dev 5173, (compose) postgres 5432 / redis 6379 |
| 로그 저장 | 백업 로그 `backend/backup_logs/backup_YYYY-MM.log`. 앱 로그는 표준 logging(파일 핸들러 `확인 필요`) |
| 재시작 방식 | `확인 필요` (systemd/pm2/수동 등 미확인) |
| 장애 알림 | `확인 필요` (Knox Messenger는 업무 알림 용도, 시스템 장애 알림 채널 미확인) |

---

## 9. 현재 확인된 이슈

| 이슈 | 증상 | 원인 후보 | 영향도 | 현재 처리 상태 | 추가 확인 필요 |
|------|------|-----------|--------|----------------|----------------|
| Pillow 미설치 시 PIL 에러 | VOC 이미지 webp 최적화 실패 | PIL import 실패 | 낮음 | `_optimize_voc_image` except로 **원본 저장 fallback** 됨 | requirements에 Pillow 포함, 운영 설치 확인 |
| VOC 이미지 목록 깨짐 | 첨부 이미지 표시 안됨 | s3_key/로컬 경로 불일치, 다운로드 경로 | 중간 | 다운로드 엔드포인트 존재 | 실제 표시 깨짐 재현 여부 `확인 필요` |
| S3 endpoint placeholder | S3 미구성 처리되어 로컬 저장 | `your-`,`placeholder` 등 토큰 감지 | 낮음 | `is_s3_configured()`가 placeholder를 **미구성으로 처리** | 운영 endpoint 실값 설정 확인 |
| S3 삭제 실패가 VOC 삭제 막음 | VOC 삭제 시 500 | S3 예외 전파 | 낮음 | **이미 해결**: `_delete_voc_attachment_storage` best-effort, 예외 전파 안 함 | 추가 조치 불필요 |
| Knox 검색 로컬 ConnectTimeout | 로컬에서 검색 실패 | 사내망 직접연결 불가 | 중간 | `KnoxError(error_type=ConnectTimeout)` → 친화 메시지 매핑됨 | 로컬 테스트 시 정상 동작 |
| no_proxy 전역 적용이 Knox에 영향 | Knox 호출 경로 변경 | 과거 `no_proxy="*"` 전역 강제 | 낮음 | **해결**: knox_client `trust_env=False`로 분리, config는 DSLLM 호스트만 우회 | 최근 커밋 반영됨 |
| Widget Settings 공간 타입 불일치 | 설비 위젯/프로젝트 위젯 혼재 | purpose별 위젯 카탈로그 분리 미완 | 중간 | 최근 커밋에서 설비 카탈로그 분리 진행 | 프론트 분기 정합성 `확인 필요` |
| 백업 스케줄러 `No module named 'utils'` | 자동/수동 백업 import 에러 | `backup_scheduler.py`가 `utils.s3.s3_utils` import (실제는 `app.utils.s3.s3_utils`) | **높음** | ✅ **해결(2026-06-14)** — 3개 import를 `app.utils.s3.s3_utils`로 교정, 모듈 import 검증 완료. ⚠️ 직전 워킹트리엔 미반영 상태였음 → 배포본 반영 확인 필요 | 사내 서버에서 실제 백업 1회 동작 확인 |
| openai 미설치 시 서버 시작 실패 | import 단계 실패 | `dsllm_adapter.py` 모듈 로드 시 `from openai import OpenAI` + `_log_startup_env_state()` 즉시 실행 | 중간 | requirements에 openai 포함 | 운영 설치/실패 시 영향 범위 `확인 필요` |

> **백업 import 버그 근거**: `app/services/backup_scheduler.py:105,237,334`는 `from utils.s3.s3_utils ...`. main.py는 일관되게 `from app.utils.s3.s3_utils ...`(예: 2393, 2442) 사용. `backend/utils/` 최상위 디렉토리는 존재하지 않음 → 모듈 해석 실패 가능. PYTHONPATH에 `backend/app`이 추가되어 있다면 해석될 수 있으나 현 구조상 미확인 → `확인 필요`(단 위험도 높음).

---

## 10. AI 요약 구조 상세 + 멀티모달(이미지) 확장 영향 분석

> 본 섹션은 **"AI 요약 고도화(이미지 활용)"** 검토를 위한 것입니다.
> **현재 구현(텍스트)** 과 **향후 확장(멀티모달)** 을 명확히 구분해 정리합니다. (구현 아님, 분석 전용)

### 10.1 현재 AI 요약 구조 (실제 구현)

| 항목 | 현재 구현 | 코드 위치 |
|------|-----------|-----------|
| 프로젝트 AI 리포트 | `POST /api/report/generate` — 4섹션(개요/Task분석/종합현황/다음단계) 서술형 보고서 생성 → `ProjectAiReport` 저장 | `main.py:6293` `generate_report()` |
| 프로젝트 AI 자유질의 | `POST /api/projects/{id}/ai-query` — 질문 scope 판별 후 컨텍스트 빌드 → 답변 → `ProjectAiQuery` 저장 | `main.py:7050` `generate_project_ai_query()` |
| LLM 호출 진입점 | `dsllm_chat(base_url=None, model_name, system_prompt, user_prompt, temperature=0.3, max_tokens=4096)` | `app/llm/dsllm_adapter.py:177` |
| 설비 "AI 운영 요약" | **LLM 아님** — 로컬 데이터 문장 조립 | `EquipmentAiSummaryCard.tsx` |

**현재 요약 대상 데이터 (텍스트만):**
- 프로젝트: 이름/설명/생성일/팀원/진행률/상태 분포
- Task: 제목/상태/우선순위/진행률/마감일/담당자/설명/태그/워크플로우 라벨(CUSTOM 단계명)
- 작업노트(`TaskActivity`): 체크박스 완료 집계(`N개 중 M개 완료`) + 텍스트 메모 내용
- 서브프로젝트, 프로젝트 노트(`Note`)
- **첨부파일/이미지: "파일명·URL·크기" 텍스트만 프롬프트에 포함.** 이미지 바이트/내용은 LLM에 전달되지 않음 (`task_lines`의 `att_info`, `프로젝트 첨부파일` 섹션 참조)

**모델 선택/저장 방식:**
- `ai_settings.model_name` 컬럼에 **model key 문자열만** 저장(super_admin이 `PUT /api/settings/ai`로 변경)
- `BASE_URL`/`API_KEY`는 **env 전용**(DB의 `api_url`/`api_key` 컬럼은 레거시, 사용 안 함)
- 런타임: `get_or_create_ai_setting()` → `_normalize_selected_model()` → 비면 `dsllm_default_model_key()`(=model_1) fallback
- 모델 목록은 `LLM_MODEL_1~4` env 기반(`get_available_models()`), 프론트 드롭다운 key = `DS/{model_id}`

### 10.2 첨부파일 / 이미지 저장 구조 (멀티모달 입력 후보)

| 영역 | 모델/테이블 | 엔드포인트 | 최적화 | 인증 |
|------|-------------|-----------|--------|------|
| VOC 본문 첨부 이미지 | `VocAttachment`(comment_scoped=False) | `POST /api/voc/{id}/attachments` | ✅ webp, 긴변 1920px, q80, 최대 5장/10MB | 업로드: 작성자/voc admin |
| VOC 댓글/추가문의 이미지 | `VocAttachment`(comment_scoped=True) | `POST /api/voc/{id}/comment-images` | ✅ 동일 webp 최적화 | 업로드: 댓글 권한자 |
| **VOC 첨부 다운로드** | `VocAttachment` | `GET /api/voc/{id}/attachments/{stored_name}/download` | - | ⚠️ **인증 없음**(코드 주석 명시) |
| Task DESCRIPTION 붙여넣기 이미지 | 공간 이미지로 저장 | `POST /api/spaces/{id}/images` | - | 공간 멤버 |
| 단발 일정 설명 이미지 | 공간 이미지 | `POST /api/spaces/{id}/images` | - | 공간 멤버 |
| Task 첨부(URL/링크) | `Attachment` | `POST /api/tasks/{id}/attachments` | - | - |
| Task 파일 | (project_files 류) | `POST /api/tasks/{id}/files` | - | - |
| 프로젝트 파일 | `ProjectFile` | `POST /api/projects/{id}/files` | - | - |

- **저장 백엔드**: S3(s3fs) 우선, 미구성 시 로컬 `uploads/` fallback (`_store_voc_image_bytes`)
- **VOC 이미지만 webp 변환** (`_optimize_voc_image`, PIL 실패 시 원본 fallback). 일반 첨부는 원본 저장
- **VOC 첨부 메타**: `stored_name`(uuid+ext), `content_type`, `file_size`, `width`, `height`, `s3_key`, `comment_scoped` → **`attachment_id`/`stored_name`로 이미지 식별 가능** (멀티모달 캐시 키 후보)

### 10.3 현재 이미지가 AI 요약에 연결되어 있는가?

**❌ 아니오.** 어떤 AI 요약 경로도 이미지 바이트를 LLM에 보내지 않습니다.
- AI 리포트는 첨부를 **파일명 텍스트로만** 나열("이런 자료가 첨부돼 있다" 수준)
- DSLLM 어댑터는 **text-only 메시지 구조** (vision content block 미지원)
- `model_4`가 "이미지 인식 가능"으로 라벨링돼 있어도 **호출 경로가 없음**

### 10.4 멀티모달 AI 요약 도입 시 영향받는 영역

| 영역 | 영향 | 비고 |
|------|------|------|
| `dsllm_adapter.chat()` | content를 `str` → `[{type:text}, {type:image_url}]` 멀티모달 형태로 확장 필요 | text-only 경로는 반드시 보존(분기) |
| 모델 capability 관리 | text-only / vision-supported / experimental 구분 메타 필요 | 현재 `_MODEL_DESCRIPTIONS` 라벨만 존재 → 구조화 필요 |
| `generate_report` / `ai-query` | 이미지 선택·로딩·인코딩·결과 병합 로직 추가 | 기존 텍스트 파이프라인과 **분리** 필요 |
| 첨부 다운로드 권한 | **VOC 다운로드 무인증** → 멀티모달 전 권한 검증 선결 | OPEN_RISK D |
| timeout/비동기 | 명시적 timeout 없음 → 이미지 분석 지연 시 전체 요약 블로킹 | OPEN_RISK B |
| 신규 저장 | 이미지 분석 결과 중간 저장/캐시 테이블 필요 여부 | `attachment_id` 기반 캐시 후보 (BACKLOG Phase 5) |
| 비용/로그 | AI 호출 로그에 이미지 원본/민감 텍스트 미기록 정책 | OPEN_RISK D |

> 결론: **멀티모달은 신규 파이프라인(분리)** 으로 가야 하며, 기존 텍스트 요약 경로(`dsllm_chat` 텍스트 호출)는 **기본 경로로 무변경 유지**가 원칙. 상세 리스크는 `PLAN_AI_OPEN_RISK_REVIEW.md` 섹션 8, 단계 계획은 `PLAN_AI_ACTION_BACKLOG.md` "멀티모달" 섹션 참조.

> ⚠️ **멀티모달 입력 후보 정정(2026-06-27 후속)**: 10.2~10.4 표는 "어떤 영역에 이미지가 첨부될 수 있는가"를 코드 기준으로 나열한 것이며, 그 중 **VOC 첨부/VOC 댓글 이미지는 AI 요약 대상이 아니다**(방향 전환 확정). AI 요약용 이미지 입력 후보는 **프로젝트 내부**(Task DESCRIPTION inline image, 작업노트(TaskActivity) inline image, Task 첨부 이미지, Project 파일 이미지, Project Note inline image)로 한정한다. VOC 다운로드 무인증 이슈(10.4 / OPEN_RISK D)는 VOC 자체 보안 과제로 남되, **AI 요약 경로와는 무관**하다.

### 10.5 프로젝트 AI Context Builder + image_manifest (2026-06-27 구현)

> 본 절은 **실제 구현된 기반 코드**를 설명한다. (LLM 미호출, 기존 요약 무변경)

| 항목 | 구현 | 코드 위치 |
|------|------|-----------|
| Context Builder | `build_project_ai_context(db, project_id, *, state=None, include_images=False, max_images=30) -> ProjectAiContext` — LLM 미호출. `text_context`(현재 text-only 요약용) + `image_manifest`(미래 멀티모달용 구조화 데이터) 생성 | `app/services/project_ai_context_builder.py` |
| Preview API | `GET /api/projects/{project_id}/ai-context-preview?include_images=&max_images=` — LLM 미호출. counts / `text_context_preview` / `image_manifest` / `warnings` / `not_used_by_llm:true` 반환. 권한=`check_project_access`(기존 프로젝트 조회 권한 동일) | `main.py` |
| 모델 capability 메타 | `get_available_models()`에 `capability`/`vision_supported`/`experimental` 필드 **추가**(하위호환), `get_model_capabilities()` 신설. **메타데이터 전용 — 실제 image call 미수행** | `app/llm/dsllm_adapter.py` |

**Context Builder 수집 범위 (VOC 제외):**
- DB: Project, SubProject, Task(+description), TaskActivity(작업노트), Note(Project Note)
- sidecar(`data.json`): task 첨부 이미지(`attachments` type=file), `project_files` 이미지, 인라인 이미지 저장 메타(`space_images`/`attachments` stored_name → s3_key/content_type 해석)
- 인라인 이미지: Task.description / TaskActivity.content / Note.content HTML 의 `<img src=".../download">` 추출 → 앞/뒤 주변 텍스트(`nearby_text`, ~400자 truncate, HTML 제거) + 저장 메타 연결

**`image_manifest` source_entity_type 목록:** `task_description` / `task_activity` / `task_attachment` / `project_note` / `project_file`.
- `relation_type`: `inline_image`(설명/노트), `work_note_evidence`(작업노트), `attached_image`(Task 첨부), `project_file_reference`(Project 파일).
- ⚠️ `task_file` 과 `task_attachment` 는 코드상 **동일 저장소(`attachments`)**를 사용하므로 `task_attachment` 로 통합 표현됨.
- 보안: `image_manifest`에 **이미지 바이트 미포함**, `storage_ref.local_path`는 항상 null(서버 경로/raw URL 비노출), `include_images=False`(기본)면 manifest 미수집.
- 구조 미확인/식별 실패 항목은 `warnings`에 기록(예: data URI 인라인 이미지, sidecar stored_name 미일치).

**향후(미래 vision 모델 연결 시):** 별도 멀티모달 어댑터가 `text_context` + `image_manifest` + 인가된 이미지 파일을 소비. 기존 text 요약 경로에 이미지 분석을 직접 병합하지 않는다.

### 10.6 Image Readability / AI-ready Image Layer (2026-06-27 2차 개선)

> `image_manifest` 는 이제 단순 "이미지 목록"이 아니라 **AI 입력 품질 판단용 메타**를 포함한다. **실제 이미지 파일은 열지 않고**, 수집된 width/height/file_size/content_type 메타만으로 1차 판단한다. (업스케일링/타일/blur 측정 미구현 — 구조만 준비)

**구현 위치:** `backend/app/services/project_ai_image_readiness.py` (`assess_image_quality` / `build_ai_image_variants` / `enrich_manifest_item` / `summarize_readiness` / `readiness_counts`). 빌더가 manifest 각 item에 부여.

**manifest item 추가 필드:**
- `image_quality`: `width/height/megapixels/aspect_ratio/file_size/content_type` + `has_dimensions/is_too_small/is_low_resolution/is_probably_thumbnail` + `readability_status`(`ok`/`small`/`low_resolution`/`thumbnail_suspected`/`missing_dimensions`/`unsupported_type`/`unknown`) + `recommended_for_ai` + `quality_notes[]` + `blur_score`(null)/`blur_status`(`not_checked`)
- `ai_image_variants`: `original`(available + storage_ref + dims) / `preview`(미보유) / `ai_readable`(`planned`, `recommended_action`) / `tiles`(`planned`, `recommended`, `reason`)

**판단 기준(상수, 조정 가능):** `AI_IMAGE_MIN_WIDTH=800`, `AI_IMAGE_MIN_HEIGHT=500`, `AI_IMAGE_MIN_MEGAPIXELS=0.4`, `AI_IMAGE_TINY_FILE_SIZE_BYTES=50000`, `AI_IMAGE_LARGE_MEGAPIXELS=8.0`. 지원 타입 = png/jpeg/webp.

**ai-context-preview 응답 추가:** `counts`에 `ai_recommended_images/low_quality_images/missing_dimension_images`, 신규 `image_readiness_summary`(`total_images/recommended_for_ai/missing_dimensions/too_small/low_resolution/tiles_recommended/status`). `status` = `ok`/`needs_review`/`no_images`/`unknown`.

> ⚠️ **확인된 현실(중요):** 현재 프로젝트 내부 이미지(`attachments`/`project_files`/`space_images`)는 업로드 시 **width/height 를 저장하지 않는다**(VocAttachment 만 width/height 보유 — VOC 는 제외). 따라서 현 시점 manifest 이미지는 **대부분 `readability_status="missing_dimensions"`** 로 판정되어 `image_readiness_summary.status="unknown"` 이 되기 쉽다. → **원본 자체는 보존**된다(VOC 와 달리 프로젝트 내부 이미지는 서버측 리사이즈를 거치지 않으므로 `ai_image_variants.original.available=true`), **dimension 메타만 부재**.
>
> **향후 개선 항목**: ① 이미지 업로드 시 width/height(가능하면 file content hash) 캡처 → 가독성 판단 정확도 확보 ② **원본 / preview / ai_readable variant 분리 저장 정책** 수립(현재 preview 전용 경로 없음) ③ `blur_score`(Pillow/OpenCV Laplacian variance) ④ 큰 캡처의 표/차트 영역 tile 분할 잡. 모두 실제 파일 처리를 동반하므로 별도 단계로 진행.

### 10.7 업로드 메타 캡처 + variant 정책 + 버전/role hint (2026-06-27 3차)

> 10.6 의 1순위 후속(= "판단 재료" 수집). **DB 마이그레이션 없음**(sidecar 레코드에 필드 추가, 하위호환). VOC 미수정.

**(1) 업로드 시점 이미지 메타 캡처** — `backend/app/utils/image_meta.py` `compute_image_meta(bytes)` 신설(Pillow, 미설치/비이미지면 dimension=None + sha256만, 예외 비전파). 아래 업로드 경로의 **sidecar 레코드에 `width/height/sha256/format` 추가**:
- `POST /api/tasks/{id}/files` (Task 첨부) — `content_type`은 기존부터 저장
- `POST /api/projects/{id}/files` (Project 파일)
- `POST /api/spaces/{id}/images` (Task 설명/노트 inline image) — `content_type`도 함께 추가
- → 이제 신규 업로드 이미지는 `image_quality`가 `missing_dimensions` 대신 실제 판정(`ok`/`small`/...)을 받는다. **기존 레코드는 메타 부재로 여전히 `missing_dimensions`**(재업로드 시 보강). VocAttachment 업로드는 미수정(VOC 제외).

**(2) 이미지 식별자(hash)** — `image_manifest` item에 `content_hash`(sha256) + `format` 추가. 중복 업로드 감지 / 재분석 방지 / 원본-variant 추적의 기반(원본 hash 기준 variant 파생).

**(3) variant 저장 정책 상수화** — `backend/app/services/ai_image_storage_policy.py`. 경로 템플릿: `projects/{project_id}/images/{original|preview|ai_readable|tiles}/{key}` (`key`=content_hash 우선). **실제 파일 생성 안 함**. `ai_image_variants`의 preview/ai_readable/tiles에 `planned_storage_path` 부여, preview 응답에 `variant_storage_policy`(템플릿+`files_generated:false`) 1회 노출.

**(4) 스키마 버전** — preview 응답에 `context_schema_version`(=`project-ai-context-v1`) / `image_manifest_version`(=`image-manifest-v1`) / `readiness_version`(=`image-readiness-v1`). 캐시·모델 교체·결과 비교 추적용.

**(5) image_role 약한 hint** — item에 `image_role`(chart/table/error_screen/before_after/result_capture/equipment_screen/meeting_slide/unknown) + `image_role_source`(`filename_keyword`/`nearby_text_keyword`/`relation_type_inference`/`none`) + `image_role_confidence`(low/none). filename·nearby_text 키워드 + relation_type 기반 **약한 추정**(과신 금지, confidence는 항상 low/none). 사용자 수동 지정 아님.

**(6) nearby_text 대체 맥락 (2026-06-28 보강)** — `nearby_text`가 빈 이미지(텍스트 없이 캡처만 붙인 경우)는 item에 `fallback_context_text` 를 채운다. 우선순위: **작업노트 텍스트 → Task title → Sub Project name → Project name**(첫 비-공백). `nearby_text`가 있으면 `fallback_context_text=""`.

**(7) image_quality UI 메시지 (2026-06-28 보강)** — `image_quality`에 `message`/`message_level`(ok/info/warning) 추가. 작은 이미지 등은 `recommended_for_ai=false`이지만 UI에선 **"AI가 읽기 어려울 수 있습니다"** 정도로 안내(차단 아님). `ok`는 `message=null`. 모델 비호출 — 순수 표시용.

> **미구현(의도적)**: 실제 업스케일/타일 파일 생성, OCR, blur 측정, vision 모델 호출, AI Report 이미지 섹션 노출, super_admin용 manifest inspector(프론트). 다음 단계로 분리.

### 10.8 이미지 분석 결과 캐시 리스크 방지 — versioned attempt 구조 (2026-06-27 4차)

> **핵심 원칙**: 이미지 **메타/품질 판단은 캐시 가능**, **모델 의미 해석은 정답 캐시 금지**. 잘못 해석된 1건(예: "불량률 3.2%→1.1% 감소"를 "1.1%→3.2% 증가"로 오독)을 영구 재사용하면 이후 프로젝트 요약이 계속 오염된다. → "이미지 분석 캐시"가 아니라 **"분석 시도 이력(versioned attempt) + 재분석 가능 구조"**.

**구현 위치:** `backend/app/services/project_ai_analysis_policy.py` (버전 상수 단일 출처 + `attach_analysis_metadata` + `summarize_analysis_policy`). 빌더가 manifest 각 item에 부여.

**manifest item 추가 필드:**
- `analysis_reuse_policy`: `metadata_cacheable(true)` / `semantic_analysis_cacheable(false)` / `reuse_semantic_result_by_default(false)` / `requires_context_aware_reanalysis(true)` / `manual_reanalysis_supported_future(true)` / `reason`
- `analysis_identity`: `image_fingerprint`(content_hash→s3_key→stored_name→image_id fallback) / `image_hash`(없으면 null) / `context_schema_version` / `image_manifest_version` / `readiness_version` / `nearby_text_hash` / `task_context_hash` / `project_context_hash` / `analysis_mode`(=`project_image_context`) / `prompt_version`(=`future-project-image-analysis-v1`) / `model_key`(null) / `model_version`(null) / `semantic_cache_key_preview`
- `reanalysis_triggers`: `image_file_changed` / `model_changed` / `model_version_changed` / `prompt_version_changed` / `context_schema_changed` / `nearby_text_changed` / `task_context_changed` / `project_context_changed` / `manual_reanalysis_requested` / `low_confidence_previous_result` / `user_feedback_reported_wrong`

**cache key 설계 핵심:**
- `semantic_cache_key_preview` = sha256(image_fingerprint + image_hash + model_key + model_version + prompt_version + 3개 schema version + nearby_text_hash + task_context_hash + project_context_hash). **image_hash 단독 금지**.
- **원문 텍스트는 key/로그에 넣지 않고 sha256 hash 만** 사용. → 모델/프롬프트/주변텍스트/Task/프로젝트 맥락이 바뀌면 key가 바뀌어 재분석을 유도(검증: 프로젝트 설명 변경 시 key 변동 확인).
- 현재 실제 vision 모델이 없으므로 `model_key/model_version=null`, key는 **미래 구조 확인용 preview**.

**ai-context-preview 응답 추가:** `analysis_policy_summary`(`metadata_cacheable_images`/`semantic_cacheable_by_default(0)`/`requires_context_aware_reanalysis`/`has_cache_key_preview`/`policy`) + `future_image_analysis_prompt_version`.

**향후 DB 설계 — `ImageAnalysisAttempt` (이번 회차 미구현, 마이그레이션 없음):**
```
ImageAnalysisAttempt
  id, project_id, task_id?, sub_project_id?,
  image_fingerprint, image_hash?, source_entity_type, source_entity_id,
  model_key, model_version, prompt_version,
  context_schema_version, image_manifest_version, readiness_version,
  nearby_text_hash, task_context_hash, project_context_hash, semantic_cache_key,
  status(success/failed/timeout/skipped/invalidated),
  result_text, result_json?, confidence?, warnings_json?,
  is_current_candidate, invalidated_reason?, created_by, created_at, updated_at
```
원칙: ① 같은 이미지라도 model/prompt/주변텍스트/Task 맥락이 다르면 **다른 attempt** ② 이전 결과는 삭제 않고 **history 보존** ③ 최신 1건을 정답으로 단정하지 않음(`is_current_candidate`는 "후보") ④ 사용자 "다시 분석" 요청 가능 ⑤ 낮은 confidence/사용자 피드백 시 재분석 대상.

### 10.9 Readiness 기준을 사용자 캡처 패턴에 맞게 보정 (2026-06-28 5차)

> **문제의식**: 기존 기준은 `width<800 또는 height<500 → small → recommended_for_ai=false` 로, **"작은 이미지 = AI 분석 부적합"** 으로 단순 처리했다. 그러나 실제 사용자는 전체 화면이 아니라 **필요한 텍스트/표/에러 영역만 작게 잘라(compact crop)** `Ctrl+C → Ctrl+V` 로 작업노트에 붙인다(예: `477x81`, `493x74`). 이런 이미지는 저품질이 아니라 **필요한 영역만 정확히 잘라낸 캡처**일 수 있어, 작다는 이유만으로 유용한 업무 근거 이미지를 AI 후보에서 제외하면 안 된다. (inspector UI 구현 전 readiness 기준부터 보정)

> **원칙**: 사용자 화면 **display 크기**(작업노트에서 drag resize 가능 — 정상 UX)와 **AI 분석용 original 이미지 크기**는 분리해서 본다. 사용자가 작게 표시해도 AI 입력은 original / ai_readable variant 기준. (display_info 추출은 향후 inspector 단계)

**(1) readability_status 확장** — 기존(`ok`/`small`/`low_resolution`/`thumbnail_suspected`/`missing_dimensions`/`unsupported_type`/`unknown`)에 신규 추가:
- `compact_text_crop`: 작지만 필요한 텍스트 영역만 잘라낸 캡처로 추정(넓은 비율 + 텍스트 맥락)
- `small_but_readable`: 기준보다 작지만 파일/비율/역할/맥락상 AI가 읽을 가능성
- `partial_screen_capture`: 전체 화면이 아닌 특정 UI/문서/표/에러 영역 일부 캡처
- `too_small_for_text`: 텍스트조차 읽기 어려운 진짜 too-small(thumbnail 파일 아님)

**(2) recommendation_level 도입** — `image_quality`에 `recommendation_level`(`recommended`/`conditional`/`not_recommended`/`unknown`) 추가. `recommended_for_ai`(boolean)는 유지하되 level에서 파생: `recommended/conditional → true`, `not_recommended/unknown → false`. **compact crop 도 conditional 로 두어 recommended_for_ai=true** — 완전히 제외하면 유용한 캡처를 놓치므로, 대신 `quality_notes`/`recommendation_level` 로 "검증 필요"를 표시.

**(3) compact crop 휴리스틱(OCR 없음, 메타만)** — 상수: `AI_IMAGE_COMPACT_CROP_MIN_WIDTH=350`, `AI_IMAGE_COMPACT_CROP_MIN_HEIGHT=60`, `AI_IMAGE_COMPACT_CROP_MIN_ASPECT_RATIO=3.0`, `AI_IMAGE_TINY_WIDTH=250`, `AI_IMAGE_TINY_HEIGHT=40`.
- `width<250 또는 height<40` → `too_small_for_text`(작은 파일이면 `thumbnail_suspected`) / `not_recommended`
- tiny 는 아니지만 기준 해상도 미만(`width<800 또는 height<500`):
  - 넓고 얇음(`width≥350 & height≥60 & aspect_ratio≥3.0`) + 텍스트 맥락(nearby_text 있음 / source가 작업노트·설명·노트 / 역할이 텍스트 계열) → `compact_text_crop`
  - 역할이 화면/에러/UI 캡처 계열 → `partial_screen_capture`
  - 그 외 → `small_but_readable`
  - 모두 `conditional`

**(4) image_role object 구조 통일 + 신규 role** — item에 `image_role`/`image_role_source`/`image_role_confidence` 3필드를 **항상** 부여(undefined 금지). 신규 role: `text_crop`/`document_crop`/`partial_screen_capture`/`note_capture`. role 은 quality 판단 **이전**에 계산해 compact crop 판단의 맥락 신호로 사용.

> **role 판단 우선순위 (2026-06-28 보정 — note_capture 과분류 수정)**: Ctrl+C→Ctrl+V inline image 의 자동 stored_name/filename 에 `note`/`task_activity` 계열 문자열이 섞여 `filename_keyword` 가 과도하게 우선 적용되어 **모든 이미지가 note_capture 로 오분류**되던 문제 수정. 우선순위를 아래로 재설계:
> 1. `nearby_text` 키워드 → `nearby_text_keyword` / **medium** (사용자가 이미지 옆에 직접 적은 맥락)
> 2. `fallback_context_text` 키워드 → `fallback_context_text_keyword` / **medium** (작업노트/Task title 등 대체 맥락)
> 3. aspect_ratio 휴리스틱(넓고 얇음) → `text_crop` / `aspect_ratio_heuristic` / low
> 4. `filename` 키워드 → `filename_keyword` / **low** (붙여넣기 자동 파일명이라 신뢰도 낮음 — 후순위로 강등)
> 5. `relation_type==work_note_evidence` → `note_capture` / `relation_type` / low
> 6. `source_entity_type==task_activity` fallback → `note_capture` / `fallback` / low
> 7. → `unknown` / `none` / `none`
>
> `note_capture` 는 **키워드 매칭 대상에서 제외**하고 task_activity 맥락의 fallback role 로만 사용(요구사항 4). chart/table/error_screen/meeting_slide/text_crop/partial_screen_capture 는 nearby_text 키워드로 잡혀 note_capture 보다 항상 우선. 검증(nearby_text): "삼전 주식 차트 기록"→chart, "현황 표 첨부"→table, "회의 방법 정리"→meeting_slide, "에러났을때"→error_screen, 493x74→text_crop(aspect).

**(5) ai_image_variants.recommended_action 확장** — 신규 `use_original_conditional`. compact crop 계열(`compact_text_crop`/`small_but_readable`/`partial_screen_capture`)은 `recommended_action=use_original_conditional`, `tiles.recommended=false`, `tiles.reason=compact_crop_no_tiling_needed`(작은 crop 은 타일링 의미 없음 → 원본 crop 을 그대로 모델에 전달).

**(6) quality_notes 개선** — "해상도가 작음" 단순 문구 대신 상태별 설명(예: *"작은 이미지이지만 필요한 텍스트 영역만 잘라낸 캡처로 추정됩니다. 향후 vision 모델 분석 시 원본 이미지를 사용하되, 결과는 검증이 필요합니다."*). warning 문구도 `작은 텍스트 crop 이미지로 추정됨: 493x74, AI 분석은 conditional` 처럼 상태 반영.

**(7) image_readiness_summary 확장** — 기존 필드 유지 + 신규 `compact_text_crop`/`small_but_readable`/`partial_screen_capture`/`conditional_for_ai`/`fully_recommended_for_ai`. `recommended_for_ai` = recommended + conditional, `not_recommended_for_ai` = level==not_recommended 만. `status`: 전부 recommended → `ok`, 메타부족만 → `unknown`, conditional/not_recommended 섞임 → `needs_review`.

**(8) nearby_text fallback + 출처** — `nearby_text` 빈 이미지에 `fallback_context_text`(우선순위: 작업노트 텍스트 → Task title → Sub Project name → Project name → `source_entity_type:id`) + `context_text_source`(`nearby_text`/`work_note_text`/`task_title`/`sub_project_name`/`project_name`/`source_entity`/`none`) 부여.

**테스트(6개 샘플) 개선 전/후:**
| # | 이미지 | role | 개선 전 | 개선 후 |
|---|--------|------|---------|---------|
| 1 | 1627x698 result_capture | result_capture | ok / recommended | ok / **recommended** |
| 2 | 525x441 chart | chart | small / not_recommended | **small_but_readable / conditional** |
| 3 | 725x392 table | table | small / not_recommended | **small_but_readable / conditional** |
| 4 | 707x503 meeting_slide | meeting_slide | small / not_recommended | **partial_screen_capture / conditional** |
| 5 | 508x203 error_screen | error_screen | thumbnail_suspected / not_recommended | **partial_screen_capture / conditional** |
| 6 | 493x74 text crop | text_crop | thumbnail_suspected / not_recommended | **compact_text_crop / conditional** |

> 단, 진짜 너무 작은 이미지(`120x30` 등)나 unsupported 타입은 계속 `not_recommended`. (검증: `200x35 → too_small_for_text/not_recommended`, `pdf → unsupported_type/not_recommended`, dims 없음 → `missing_dimensions/unknown`)

> **불변(이번 회차도 미수정)**: `POST /api/report/generate`, `POST /api/projects/{id}/ai-query`, 작업노트 이미지 붙여넣기 UX, vision/OCR 호출, DB 마이그레이션, VOC 제외.

## 낮은 성능 모델 대응 — Image Evidence Card (evidence-card-v1)

PLAN-AI 는 고성능 vision 모델에 의존하지 않고, **낮은 성능의 사내/저비용 vision 모델도 활용**할 수 있도록 이미지 evidence 구조를 강화한다. 이미지를 바로 요약시키지 않고, 이미지마다 아래를 함께 제공한다.

- 모델 작업은 **이미지 판독 → evidence 생성 → Task 맥락 연결 → 프로젝트 요약 반영** 순서로 단계화한다.
- 각 `image_manifest` item 에 `evidence_card`(서비스: `app/services/project_ai_evidence.py`)를 부여: `image_role` / `context_strength` / `extraction_target` / `model_instruction_key`(+`model_instruction_text`) / `quality_warning` / `ai_input_strategy`. **이미지 바이트·base64·storage path 미포함**(안전 메타/지시만).
- `image_role` 세분화: 기존(chart/table/error_screen/meeting_slide/equipment_screen/text_crop/note_capture/partial_screen_capture/...)에 **command_snippet / code_snippet / log_capture / terminal_capture / config_capture / document_table / process_flow** 추가. 과분류 방지를 위해 지나치게 일반적인 단어(run/down/status/if/else 등)는 키워드에서 제외.
- role 별 지시사항으로 chart/table/error/command/log/equipment 화면을 **다르게 처리**한다(예: chart=정확수치 단정 금지·추세 중심, command=원문 순서 보존, config=민감정보 마스킹).
- `context_strength`(strong/medium/weak/none): `weak`/`none` 이미지는 nearby_text 가 없거나 약해 **이미지 자체 판독 의존도가 높다** → 모델 결과를 강하게 믿지 말고 검증 대상으로 둔다.
- OCR 없이 이미지 내부 텍스트는 읽을 수 없으므로, nearby_text 가 없으면 `command_snippet` 등으로 **강하게 단정하지 않고** `text_crop`/low confidence 로 둔다.

> **불변(이번 회차도 미수정)**: `POST /api/report/generate`, `POST /api/projects/{id}/ai-query`, 작업노트 UX, vision/OCR 호출, DB 마이그레이션, VOC 제외.

## Model Compatibility Layer — 모델 입력 어댑터 (project-ai-model-input-v1)

사내 다른 파트가 만든 모델 API 는 자체 system prompt / context packing / image preprocessing / OCR / 출력 schema / 보안 필터 규칙을 가질 가능성이 높다. PLAN-AI 의 `image_role` / `extraction_target` / `model_instruction_key` 를 모델에게 **정답으로 강제**하면 내부 룰과 충돌할 수 있다(예: PLAN-AI=chart vs 모델 내부 판단=document/table).

- **핵심 원칙**: Evidence Card 는 정답이 아니라 **힌트**다. 모델은 이미지에서 실제로 보이는 내용과 명확한 Task 맥락을 우선해야 한다.
- 서비스: `app/services/project_ai_model_compatibility.py` — `image_manifest`/`evidence_card` → `model_input_packet`(표준 내부 포맷) → `provider_payload`. **모델/OCR 미호출, payload 구조만 생성.**
- `image_role` 은 **`image_role_hint`** 로 취급하고 `role_confidence` / `context_strength` 를 함께 전달한다. role_confidence 가 low/none 이면 role 을 강하게 믿지 말라는 문구를 role_instruction 에 덧붙인다.
- **충돌 방지 Global Rule**(모든 packet 포함): "metadata 는 업무 맥락 힌트이며, 이미지 내용과 충돌하면 이미지에서 보이는 사실과 Task 맥락을 우선, 보이지 않는 내용은 추정 금지, 불확실하면 '확인 필요' 표시".
- `ROLE_INSTRUCTION_MAP`(role별 suggested instruction) + `ROLE_OUTPUT_SCHEMA_HINT`(role별 출력 schema 힌트, 없으면 공통 schema) + `safety_policy`(do_not_guess / visible_content_first / metadata_is_hint_only / preserve_uncertainty).
- **provider adapter**: `BaseModelInputAdapter` → `GenericVisionAdapter`(OpenAI-호환 messages) / `DSLLMVisionAdapter`(placeholder). 실제 사내 API 스펙 확정 시 **이 Layer(어댑터)만 수정**하면 되도록 분리. `build_provider_payload(packet, provider)`.
- **A/B/C 입력 모드**(`input_mode`): `image_only` / `image_with_nearby_text` / `image_with_evidence_card` — 모델 연결 후 "이미지만 / 이미지+nearby_text / 이미지+Evidence Card" 결과 비교용.
- **보안**: payload 에 이미지 binary/base64/storage path **미포함**. `image_ref` 는 image_id 중심(+ input_strategy). 실제 이미지 로딩은 모델 호출 단계에서만 서버 내부에서 수행.
- endpoint: `GET /api/projects/{id}/ai-context-preview/model-packet?image_id=&provider=&input_mode=&user_id=`(super_admin 전용, image_id 1개 단위, manifest 존재 검증). Inspector Drawer 에 "🔌 Model Compatibility Preview" 섹션(provider/input_mode 선택 + Model Packet 생성 + packet/payload JSON 복사).

> **불변(이번 회차도 미수정)**: `POST /api/report/generate`, `POST /api/projects/{id}/ai-query`, 작업노트 UX, vision/OCR/실제 모델 호출, DB 마이그레이션, 일반 사용자 화면, VOC 제외.

---

## 최신 코드 기준 업데이트

### 확인 일자
- 2026-07-09 (기준 커밋: `main` HEAD `21dedee`)

### 코드 규모 재측정
- `backend/main.py` 라우트 **248개**(`@app.get/post/patch/put/delete` 데코레이터 기준, 기존 문서 ~223 → 증가). 파일 라인 ~16,900+ (기존 문서 ~9,340 표기는 낡음).
- `app/services/` 파일 대폭 증가: `mail_sender.py`, `mail_templates.py`, `notification_processor.py`, `notifications.py`, `mention_resolver.py`, `activity_log.py`, `system_log.py`, `vision_ai_settings.py`, `project_ai_context_builder.py`, `project_ai_evidence.py`, `project_ai_image_readiness.py`, `project_ai_model_compatibility.py`, `project_ai_analysis_policy.py`, `project_ai_vision_report_test.py`, `ai_image_storage_policy.py` 등.
- `app/llm/` 에 **`router.py`(provider 분기)** + **`openai_adapter.py`** 추가 (기존 `dsllm_adapter.py` 단독 → 3파일).
- `app/realtime.py` 신설 (SSE broadcaster/ticket).

### 최근 추가/변경된 기능
- **커스텀 워크플로우 컬럼**: 프로젝트별 Board 단계 커스텀(`workflow_mode` DEFAULT/CUSTOM). 단계 자동 이동은 최종적으로 **"사용자 완료 선언"(`auto_move_on_complete`)** 기반으로 재설계됨. 중간 완료 체크포인트(`is_checkpoint`)는 보조 표시 지표.
- **Task 상하 관계(Parent/Child)**: `tasks.parent_task_id` 단일 레벨. Board 상위카드 아래 하위 mini card 중첩.
- **Task 다른 Project 이동**: `POST /api/tasks/{id}/move` (같은 Space 내).
- **Task Comment**: 담당자 외 인원 의견/논의용 댓글 CRUD + @멘션 + 이미지 붙여넣기(`task_comment_attachments`). soft delete.
- **일정 "미정(TBD)" 상태**: `start_date_tbd`/`due_date_tbd`. Roadmap/Calendar "일정 미정" 섹션 + AI 일정 분석/추천.
- **단발 일정(CalendarEvent)**: 공간 단위 경량 일정 + Task 전환(`convert-to-task`).
- **실시간 동기화(SSE)**: `realtime_events` outbox + `/api/events/stream`. bulk import 는 `?suppress_realtime=true` + `space_bulk_changed` 1건. (`docs/realtime-sync.md`)
- **알림 메일 실제 발송(신규 핵심)**: `MAIL_PROVIDER=knox_api` 로 사내 Knox Mail API 실제 발송 구현. `notification_events` outbox 를 **`notification_processor` APScheduler** 가 소비해 발송. 멘션(댓글/작업노트) + **VOC 답변 메일(관리자 opt-in)**. 기본값 `disabled`.
- **AI Provider 라우팅**: DSLLM / OpenAI 선택(`ai_settings.provider`, `app/llm/router.py`). OpenAI 는 env(`OPENAI_API_KEY`/`ENABLE_OPENAI_PROVIDER`)로만 선택 가능.
- **Vision Report 테스트(PoC)**: super_admin 전용 이미지 포함 AI Report 테스트(`vision-test` endpoint, `vision_ai_settings`, `openai_adapter.vision_chat`). 기존 text Report 와 분리.
- **VOC 확장**: 공개/비공개(`visibility`), 공감(`voc_votes`), 댓글/답변(`voc_comments`), 처리율 통계(`/api/voc/stats`).
- **공간 lifecycle**: 생성 제한 + 빈 공간 경고→자동 보관 + Admin 공간 현황(`/api/admin/spaces/*`).
- **시스템 로그/사용통계**: `system_event_logs` + `/api/admin/system-logs*`, `/api/admin/usage-stats`, `/api/admin/system-health`.
- **CSV/XLSX 가져오기**, **사내 추천 도구 스트립**, **테마 토큰/빌더**, **커스텀 워크플로우 undo 스냅샷**(`project_workflow_snapshots`).

### 최근 추가/변경된 DB 모델 또는 컬럼
- 신규 테이블: `calendar_events`, `project_task_columns`, `task_stage_completions`, `project_workflow_snapshots`, `task_comments`, `task_comment_mentions`, `task_comment_attachments`, `note_mentions`, `task_activity_mentions`, `notification_events`, `user_notification_preferences`, `voc_votes`, `voc_comments`, `voc_attachments`(+`comment_scoped`), `system_event_logs`, `realtime_events`, `vision_ai_settings`.
- `tasks`: `task_type`, `start_date_tbd`/`due_date_tbd`, `parent_task_id`, `workflow_column_id`, `progress`, `sub_project_id`, `remarks`.
- `task_activities`: `is_stage_checkpoint`/`checkpoint_stage_id`/`checkpoint_required`, `checked_at`, `style`.
- `projects`: `workflow_mode`, `auto_progress_from_notes`.
- `spaces`: `purpose`, `archived_at`, `warned_at`, `last_activity_at`, `delete_scheduled_at`, `cleanup_exempt`.
- `ai_settings`: `provider`.

### 최근 추가/변경된 API (발췌)
- 워크플로우: `GET/PUT /api/projects/{id}/workflow-columns`, `GET .../completion-checkpoints`, `POST /api/tasks/{id}/stage-completion`, `POST .../workflow-mode/preview|undo`, `PUT .../workflow-mode`.
- Task: `POST /api/tasks/{id}/move`, comment CRUD `/api/tasks/{id}/comments`, `POST .../comment-images`.
- 일정: `/api/spaces/{id}/calendar-events`, `PATCH/DELETE /api/calendar-events/{id}`, `POST .../convert-to-task`, `POST /api/spaces/{id}/oneoff-tasks`.
- 실시간: `POST /api/events/ticket`, `GET /api/events/stream`, `GET /api/admin/realtime-status`, `POST /api/spaces/{id}/realtime/bulk-event`.
- 알림: `GET/PATCH /api/users/me/notification-preferences`, `GET /api/admin/notifications/diagnostics`, `POST /api/admin/notifications/process-now`.
- AI: `GET/PUT /api/settings/ai`(+provider), `POST /api/settings/ai/test`, `GET/PUT /api/settings/vision-ai`, `POST .../vision-ai/test|vision-test`, `POST /api/projects/{id}/ai-report/vision-test`, `GET .../ai-context-preview[/image|/model-packet]`.
- VOC: `/api/voc/stats`, `/api/voc/{id}/vote`, `/api/voc/{id}/comments`, `/api/voc/{id}/comment-images`.
- Admin: `/api/admin/spaces/*`(archive/restore/notify-owner/toggle-exempt/extend-delete/hard-delete), `/api/admin/system-logs*`, `/api/admin/usage-stats`, `/api/admin/system-health`.

### 최근 추가/변경된 Frontend 화면/컴포넌트
- WorkflowSettings(단계/자동이동/체크포인트), BoardChildCard(하위 Task), CompletionCheckpointStrip, TaskCommentsSection(전용 화면), TBD 일정 표시(`utils/scheduleFormat.ts`), VisionReportTestPanel, AI Context Inspector(Model Compatibility Preview), VocCommentThread/공감 UI, useRealtimeSync 훅.

### 기존 문서와 달라진 점
- 라우트 수 223→**248**, main.py 라인 수 표기 낡음.
- "알림 메일 미구현" 서술은 **낡음** — knox_api 실발송 + processor 스케줄러 구동.
- DSLLM 단일 provider 전제 → **provider 라우터(DSLLM/OpenAI)** 로 확장.
- Vision(이미지) 은 여전히 **일반 Report 경로엔 미연결**이나, super_admin 전용 **vision-test PoC 경로**는 실제 OpenAI vision 호출 존재(기존 문서 "이미지 호출 경로 전무" 서술 보정).

### Workflow Intelligence 설계 시 연결 가능한 지점
- 이미 존재하는 이벤트/로그 계열(`activity_logs`, `realtime_events`, `notification_events`, `system_event_logs`, `task_stage_completions`, `sheet_execution_logs`)이 각기 다른 역할을 담당 → 신규 `ProjectProcessEvent` 는 이들과 **역할 분리**해 업무 흐름 영속 로그로 도입 가능. 상세는 `docs/CURRENT_PLAN_AI_LATEST_STRUCTURE_FOR_WORKFLOW_INTELLIGENCE.md` 참조.

### 확인 필요
- 운영 배포본의 `MAIL_PROVIDER` 실제 값 및 Knox Mail Gateway host/인증 방식 확정.
- 개별 248개 라우트의 인증/권한(`user_id` 쿼리 의존 잔존 범위) 정적 재감사.
