# 트러블슈팅 플랫폼 최소 공통 연동 구현 요청

## SSO / SSO Bypass / Knox 임직원 검색 / Knox Mail / Knox Messenger / DSLLM

---

# 0. Claude Code에 전달할 핵심 지시

현재 트러블슈팅 플랫폼 저장소에 아래 참고 자료를 함께 배치한 뒤 이 문서를 기준으로 작업해줘.

```text
reference/plan-ai/
├─ code.zip                 # PLAN-AI backend/app 공통 코드 참고본
├─ main.py                  # PLAN-AI FastAPI 앱 연결 지점 참고본
├─ requirements.txt         # PLAN-AI Python 의존성 참고본
├─ src.zip                  # PLAN-AI frontend/src 참고본
└─ docs/
   ├─ PLAN_AI_SERVICE_STRUCTURE.md
   ├─ PLAN_AI_OPEN_RISK_REVIEW.md
   ├─ PLAN_AI_ACTION_BACKLOG.md
   └─ NOTIFICATION_KNOX_MAIL_TODO.md
```

이번 작업의 목적은 PLAN-AI 전체 기능을 복사하는 것이 아니다.

**현재 트러블슈팅 플랫폼에 필요한 공통 연동 기능만 선별하여 현재 코드 구조에 맞게 이식한다.**

구현 대상은 아래 5개뿐이다.

1. 사내 ADFS/OAuth SSO
2. 로컬 개발환경 전용 SSO Bypass
3. Knox 사내 임직원 검색
4. Knox Mail 및 Knox Messenger 발송 기반
5. 사내 DSLLM Text LLM 연결

분석만 하고 멈추지 말고, 현재 플랫폼 구조 분석 → 실제 코드 수정 → 환경변수 예시 → 테스트 → 변경 보고까지 한 번에 완료해라.

---

# 1. 작업 범위

## 1-1. 반드시 구현할 것

### 인증

- ADFS/OAuth SSO 로그인
- SSO callback 처리
- 현재 사용자 조회
- 로그아웃 및 세션 폐기
- 개발환경 전용 SSO Bypass
- Backend 인증 dependency
- Frontend 로그인 진입, callback, 사용자 Context
- API 요청 Bearer token 자동 부착
- 401 발생 시 재로그인 처리

### Knox

- Knox 임직원 이름/Login ID 검색
- 검색 결과 공통 포맷 정규화
- 현재 로그인 사용자만 검색 API 사용 가능
- 관리자용 Knox 연결 진단
- 다른 사용자 선택 UI에서 Knox 검색 결과 활용 가능하도록 공통 컴포넌트 또는 API 함수 제공

### Knox Mail

- Knox Mail API transport adapter
- 환경변수 기반 연결
- 일반적인 메일 발송 함수 제공
- 관리자 전용 발송 테스트 API
- 발송 성공/실패 결과 구조화
- `mailId` 등 provider 응답 식별자 수집

### Knox Messenger

- Knox Messenger transport adapter
- Login ID 기반 수신자 지정
- 환경변수 기반 연결
- 관리자 전용 발송 테스트 API
- DRY RUN 지원
- 핵심 Trouble CRUD와 장애 격리

### DSLLM

- OpenAI-compatible DSLLM Gateway Text 호출
- env 기반 모델 목록
- 일반 chat 및 필요 시 streaming chat
- 관리자용 연결 상태/연결 테스트 API
- Frontend DSLLM 모델 선택/연결 테스트 화면
- API Key와 Base URL은 Backend env에서만 관리

## 1-2. 이번 범위에서 제외할 것

다음 PLAN-AI 기능은 가져오지 말 것.

```text
Project / Space / Task / SubProject
Board / List / Roadmap / Node Graph
Check Sheet / 설비 운영
VOC / 개선요청
Realtime SSE
S3 파일 업로드 및 DB 백업
Vision / 이미지 분석 / OCR / 멀티모달
OpenAI 외부 Provider
Workflow Intelligence
프로젝트 AI Report 전용 프롬프트
PLAN-AI 멘션·댓글·작업노트 전용 로직
PLAN-AI 조직/그룹/공간 멤버 관리
PLAN-AI 관리자 페이지 전체
PLAN-AI 시스템 로그 화면 전체
```

관련 없는 DB 테이블, migration, frontend page, scheduler도 복사하지 말 것.

---

# 2. 참고 코드 사용 원칙

## 2-1. 파일 전체 복사 금지

`main.py`는 약 18,000라인, `frontend/src/api/client.ts`와 `AdminPage.tsx`도 많은 기능이 섞여 있다.

따라서 아래처럼 **필요한 패턴과 코드 조각만 찾아 현재 플랫폼 파일에 적용**한다.

```text
잘못된 방식
- PLAN-AI main.py를 새 플랫폼 main.py로 교체
- src.zip 전체를 frontend/src에 덮어쓰기
- code.zip의 models.py 전체 복사
- requirements.txt 전체를 그대로 설치

올바른 방식
- 현재 플랫폼 앱 시작점에 필요한 router만 include
- 현재 API client에 인증 interceptor와 필요한 API method만 추가
- 현재 User 모델에 필요한 필드만 매핑
- Knox/DSLLM transport 모듈만 독립적으로 생성
- 실제로 import되는 의존성만 requirements에 추가
```

## 2-2. 현재 플랫폼 코드 우선

다음 항목은 PLAN-AI보다 현재 트러블슈팅 플랫폼 구조를 우선한다.

- 폴더 구조
- User 모델
- DB session dependency
- 관리자 권한 dependency
- 기존 로그인/세션 방식
- API prefix
- frontend state 관리 방식
- UI framework
- 기존 Trouble 생성·수정·상태변경 이벤트

PLAN-AI 파일명과 동일하게 만들 필요는 없다.

---

# 3. 구현 전 현재 트러블슈팅 플랫폼 분석

코드를 수정하기 전에 현재 저장소에서 아래를 확인하고 짧게 기록해라. 그 후 바로 구현을 계속한다.

1. Backend/Frontend 기술 스택
2. FastAPI 앱 생성 및 실행 파일
3. router 등록 방식
4. startup/lifespan 구조
5. 환경변수 로더와 env 파일 위치
6. SQLAlchemy Base/Session 구조
7. User 모델과 필드
8. 현재 인증 및 관리자 권한 방식
9. API prefix와 nginx reverse proxy 경로
10. Frontend axios/fetch client
11. React Router와 전역 사용자 상태
12. 현재 AI 기능 및 모델 설정 구조
13. Trouble 담당자, 댓글, 상태변경 등 알림을 연결할 수 있는 기존 이벤트 지점
14. 단일 worker 또는 multi-worker 여부

먼저 다음 형식으로 분석 결과를 저장소의 작업 로그 또는 최종 응답에 남겨라.

```text
1. 현재 구조 요약
2. 참고 코드와 대응되는 현재 파일
3. 신규 생성 파일
4. 수정 파일
5. 그대로 참고할 패턴
6. 현재 구조에 맞게 재작성할 부분
7. 복사하지 않을 코드
8. 구현 순서
9. 테스트 계획
```

---

# 4. 참고 자료별로 가져올 부분

## 4-1. `code.zip`에서 참고할 Backend 파일

### A. SSO

```text
app/environment.py
app/dependencies.py
app/routers/auth.py
app/models.py의 User 필드
```

가져올 개념:

- `/api/auth/login`
- `/api/auth/callback`
- `/api/auth/me` 또는 기존 호환 경로
- Bearer token에서 현재 사용자 확인
- SSO claim → User upsert
- Bypass 사용자도 일반 SSO와 동일한 session 생성 함수 사용

그대로 복사하지 않을 코드:

- 전역 `SESSIONS = {}`
- `jwt.decode(... verify_signature=False)`
- token 요청 `verify=False`
- OAuth `state` 미검증
- hard-coded super admin Login ID
- Bypass 사용자 자동 `super_admin`
- callback 예외의 전체 traceback/민감 응답 출력
- 인증 없이 사용자 생성 가능한 `/admin/users`

### B. Knox 임직원 검색

```text
app/services/knox_client.py
app/routers/knox.py
```

가져올 개념:

- `KNOX_API_URL + KNOX_EMPLOYEE_API_PATH`
- `Authorization: Bearer ...`
- `System-ID` header
- 이름 검색과 Login ID 검색 fallback
- timeout 및 오류 유형 구분
- 응답 정규화
- `userId`, `fullName`, `departmentName`, `mail` 필드 사용

반드시 수정할 부분:

- `/api/employees`에 현재 사용자 인증 dependency 추가
- `verify=False` 하드코딩 제거
- 최소 검색 길이 적용
- 결과 수 제한
- 검색어/토큰/원본 응답 전체 로그 금지
- 운영 기본 SSL 검증 `true`

### C. Knox Messenger

```text
app/services/knox_messenger_service.py
```

가져올 개념:

- 별도 transport adapter
- `KNOX_MESSENGER_ENABLED`
- `KNOX_MESSENGER_DRY_RUN`
- timeout과 SSL 설정
- 실패가 본 기능을 막지 않는 best-effort 호출
- BackgroundTasks 사용 가능

수정할 부분:

- 함수명을 `send_message()` 또는 현재 플랫폼 명칭으로 일반화
- `mention`, `plan`, Task 등 PLAN-AI 전용 기본값 제거
- 실제 Knox Messenger API 스펙에 맞게 URL/header/body 확정
- 현재 코드는 payload가 placeholder이므로 스펙 확인 없이 성공 구현으로 간주하지 말 것
- 수신자 우선 기준은 현재 사용자 모델의 `loginid`로 명확히 지정

### D. Knox Mail

```text
app/services/mail_sender.py
```

가져올 부분:

- `MailSendResult`
- `_knox_config()` 개념
- Bearer header 중복 방지
- multipart `mail` part
- Knox 응답의 `result == "success"` 확인
- `mailId` 반환
- token/body 원문을 남기지 않는 로그

가져오지 않을 부분:

- SMTP provider가 필요하지 않으면 SMTP 구현
- PLAN-AI 이름/메일 제목
- mention/VOC 전용 template

중요 구분:

```text
KNOX_MAIL_USER_ID
- Mail API URL의 ?userId= 값
- 메일 발송 계정 Login ID

KNOX_SYSTEM_ID
- System-ID HTTP header 값
- Knox 연계 시스템 식별자

KNOX_MAIL_SENDER_EMAIL
- sender.emailAddress
- 실제 발신 이메일 주소
```

이 세 값을 하나로 간주하지 말 것.

### E. DSLLM

```text
app/config.py
app/llm/dsllm_adapter.py
```

가져올 부분:

- `DSLLM_BASE_URL` → 기존 `BASE_URL` fallback
- `DSLLM_API_KEY` → 기존 `API_KEY` fallback
- `LLM_MODEL_1~4`
- `DS/` prefix 정규화
- env 모델 목록
- text-only `chat()`
- text-only `chat_stream()`
- Base URL에서 중복 `/chat/completions` 제거
- API Key 마스킹 상태 로그
- DSLLM host만 `NO_PROXY`에 추가하는 패턴

가져오지 않을 부분:

```text
vision_chat
image_url payload
DsllmVisionError
Vision capability metadata
OpenAI adapter
OpenAI Provider router
외부 Provider 경고 UI
```

이번 플랫폼에 Provider가 DSLLM 하나뿐이면 `app/llm/router.py`도 복사하지 말고, `dsllm_service.py` 또는 `dsllm_adapter.py` 하나로 단순화한다.

---

## 4-2. `main.py`에서 참고할 부분

`main.py` 전체를 복사하지 않는다.

### 참고할 연결 지점

```text
from app.routers import auth, knox
app.include_router(auth.router)
app.include_router(knox.router)
```

현재 플랫폼에 생성할 신규 router를 기존 앱 시작점에 같은 방식으로 등록한다.

### 참고할 AI Settings API 개념

PLAN-AI의 아래 API는 형태만 참고한다.

```text
GET  /api/settings/ai
GET  /api/settings/ai/models
PUT  /api/settings/ai
POST /api/settings/ai/test
```

현재 플랫폼에서는 DSLLM만 사용하므로 다음처럼 단순화한다.

- `provider` 필드 제거 가능
- `OpenAI` 분기 제거
- Vision AI 설정 제거
- Base URL/API Key는 env에서만 읽기
- DB에는 필요할 때만 선택 모델명 저장
- 모델 저장이 불필요하면 env의 `LLM_MODEL_1`을 기본값으로 사용
- 관리자 권한은 `user_id` query parameter가 아니라 인증된 현재 사용자에서 판단

### 참고할 Knox 진단 API 개념

PLAN-AI의 `/api/debug/knox/search` 개념은 관리자용 연결 테스트 API로 재작성한다.

주의:

- 운영 응답에 검색어 원문을 다시 반환할 필요 없음
- token, Authorization, 전체 Knox raw response 노출 금지
- 일반 사용자용 검색 API와 관리자용 연결 진단 API 분리

### 참고할 Notification startup

PLAN-AI는 `notification_processor` scheduler를 startup에 등록하지만, 이번 작업에서는 무조건 복사하지 않는다.

정책:

1. 현재 플랫폼에 이미 outbox/worker/scheduler가 있으면 그 구조에 Knox transport를 연결한다.
2. 그런 구조가 없으면 1차 구현은 `BackgroundTasks` 기반 best-effort 발송으로 단순화한다.
3. 전송 재시도와 영속 outbox가 실제 요구사항이면 별도 작은 테이블과 worker를 설계하되 PLAN-AI의 Task/VOC 모델은 가져오지 않는다.
4. 외부 연동 실패 때문에 서버 startup이나 Trouble CRUD가 실패하면 안 된다.

---

## 4-3. `requirements.txt`에서 참고할 부분

이번 기능에 직접 필요한 Python 의존성 후보:

```text
fastapi
uvicorn
pydantic
pydantic-settings
python-multipart
httpx
sqlalchemy
python-dotenv
pymysql                # 현재 플랫폼이 MySQL인 경우
openai>=1.30.0         # DSLLM OpenAI-compatible SDK
PyJWT
cryptography           # RS256/JWKS 서명 검증
requests               # 기존 코드 유지 시에만; 가능하면 httpx로 통일
```

아래 패키지는 이번 기능 때문에 추가하지 말 것.

```text
boto3
s3fs
openpyxl
Pillow
apscheduler            # outbox scheduler를 실제로 만들 때만
```

현재 requirements에서 이미 설치된 버전과 충돌하지 않게 병합하고, 전체 파일을 덮어쓰지 말 것.

---

## 4-4. `src.zip`에서 참고할 Frontend 파일

### A. 인증에 직접 참고

```text
src/api/client.ts
src/context/UserContext.tsx
src/pages/SsoCallbackPage.tsx
src/App.tsx
src/main.tsx
```

가져올 부분:

- Axios 공통 client
- `session_token` Bearer interceptor
- 401 발생 시 토큰 삭제 후 `/auth/login` 이동
- `/sso-callback` route
- callback에서 token 수신 및 `/auth/me` 확인
- `UserProvider`에서 앱 시작 시 현재 사용자 조회
- StrictMode 중복 로그인/callback 방지
- 로그인 이전 경로 복원

수정할 부분:

- 현재 플랫폼 API URL과 prefix 사용
- 현재 플랫폼 Router/Context 구조에 맞춤
- Backend endpoint가 `/auth/me`이면 `/auth/user/me`를 그대로 쓰지 말 것
- logout 시 Backend revoke API 호출 후 local token 제거
- token은 opaque session token이어야 하며 민감 ADFS token을 Frontend에 전달하지 말 것
- 가능하면 callback URL fragment를 사용하고 즉시 주소에서 제거
- 현재 플랫폼이 이미 cookie session을 사용하면 localStorage 구조를 강제로 도입하지 말 것

### B. Knox 검색에 참고

```text
src/api/client.ts의 searchKnoxEmployees
src/components/MemberSearchSelect.tsx
src/pages/AdminPage.tsx의 Knox 검색 UI 일부
```

가져올 부분:

- `GET /employees?query=...`
- 이름/Login ID 단일 입력 검색
- 결과에 Login ID, 이름, 부서, 이메일 표시
- 동명이인 구분
- debounce/loading/error 표시

가져오지 않을 부분:

- `AdminPage.tsx` 전체
- Space 멤버 추가
- 그룹 관리
- 프로젝트 담당자 관리
- PLAN-AI 사용자 생성/권한 화면

현재 트러블슈팅 플랫폼의 담당자 선택, 사용자 검색 또는 관리자 사용자 등록 화면에 필요한 부분만 적용한다.

### C. DSLLM 설정에 참고

```text
src/api/client.ts의 AI Settings API
src/pages/AiSettingsPage.tsx
```

`AiSettingsPage.tsx` 전체를 복사하지 말고 아래만 남긴 단순 화면으로 재작성한다.

- DSLLM 연결상태
- Base URL 설정 여부
- API Key 설정 여부
- env에서 읽은 모델 목록
- 선택 모델
- 저장 버튼
- 비민감 고정 문구 연결 테스트
- 성공/실패 표시

제거할 UI:

```text
Provider 선택
OpenAI
OpenAI 경고
Vision AI Settings
이미지 모델
API Key 입력 필드
Base URL 입력 필드
```

### D. `client.ts` 전체 복사 금지

`client.ts`에서는 아래 항목만 현재 플랫폼 API service에 병합한다.

```text
Authorization interceptor
401 처리
getMe
logout
searchKnoxEmployees
getDsllmSettings
getDsllmModels
saveDsllmSettings
runDsllmConnectionTest
runKnoxMailTest
runKnoxMessengerTest
getIntegrationStatus
```

Project, Task, Space, VOC, Sheet, Vision, Realtime API는 가져오지 않는다.

---

# 5. 권장 Backend 구조

현재 플랫폼 구조가 다르면 이름을 바꿔도 되지만 책임을 분리한다.

```text
backend/
├─ main.py 또는 app/main.py
└─ app/
   ├─ core/
   │  ├─ settings.py
   │  └─ security.py
   ├─ auth/
   │  ├─ router.py
   │  ├─ sso_service.py
   │  ├─ session_service.py
   │  └─ dependencies.py
   ├─ integrations/
   │  ├─ knox_employee_client.py
   │  ├─ knox_mail_client.py
   │  ├─ knox_messenger_client.py
   │  └─ schemas.py
   ├─ llm/
   │  └─ dsllm_adapter.py
   └─ routers/
      ├─ integrations.py
      └─ ai_settings.py
```

기존 플랫폼에 `services/`, `routers/`, `dependencies.py`가 이미 있으면 그 구조를 유지한다.

---

# 6. 환경변수 로딩

현재 플랫폼에 환경변수 로더가 있으면 유지한다. 없으면 다음 우선순위를 적용한다.

```text
ENV_MODE=development
→ .env.local
→ .env fallback

ENV_MODE=production
→ .env.production
→ 없으면 OS 환경변수
```

`environment.py`와 `config.py`가 서로 다른 파일을 중복 로딩하지 않게 단일 기준을 둔다.

다음 파일은 secret 값 없이 example만 생성한다.

```text
.env.example
.env.local.example
.env.production.example
```

---

# 7. 환경변수 목록

## 7-1. 공통

```dotenv
ENV_MODE=development
CORS_ORIGINS=http://localhost:5173
FRONTEND_REDIRECT_URI=http://localhost:5173
FRONTEND_BASE_URL=http://localhost:5173
```

## 7-2. SSO

기존 PLAN-AI 변수명과의 하위호환을 허용한다.

```dotenv
ADFS_AUTH_URL=
ADFS_TOKEN_URL=
ADFS_JWKS_URL=
ADFS_ISSUER=

SSO_CLIENT_ID=
SSO_CLIENT_SECRET=
SSO_REDIRECT_URI=http://localhost:8086/api/auth/callback
SSO_SCOPE=
SSO_VERIFY_SSL=true
SSO_TIMEOUT_SECONDS=20

# 기존 이름 fallback 허용
CLIENT_ID=
CLIENT_SECRET=
REDIRECT_URI=

SESSION_TTL_HOURS=24
```

## 7-3. 개발용 Bypass

```dotenv
BYPASS_SSO=false
BYPASS_LOGINID=local.dev
BYPASS_USERNAME=Local DEV
BYPASS_DEPTNAME=Development
BYPASS_MAIL=local.dev@example.com
BYPASS_ROLE=member
```

안전 규칙:

```text
ENV_MODE=production + BYPASS_SSO=true
→ 서버 시작 실패 또는 BYPASS 강제 false + CRITICAL 로그
```

## 7-4. Knox 임직원 검색

```dotenv
KNOX_API_URL=
KNOX_EMPLOYEE_API_PATH=
KNOX_AUTH_TOKEN=
KNOX_SYSTEM_ID=
KNOX_COMPANY_CODE=C10
KNOX_VERIFY_SSL=true
KNOX_TIMEOUT_SECONDS=20
```

## 7-5. Knox Mail

```dotenv
MAIL_PROVIDER=disabled

KNOX_MAIL_API_BASE_URL=
KNOX_MAIL_API_PATH=/mail/api/v2.0/mails/send
KNOX_MAIL_USER_ID=
KNOX_MAIL_SENDER_EMAIL=
KNOX_MAIL_API_TOKEN=
KNOX_MAIL_CONTENT_TYPE=TEXT
KNOX_MAIL_DOC_SECU_TYPE=PERSONAL
KNOX_MAIL_TIMEOUT_SECONDS=10
KNOX_MAIL_VERIFY_SSL=true
```

Fallback 규칙:

```text
KNOX_MAIL_API_BASE_URL 없으면 KNOX_API_URL
KNOX_MAIL_API_TOKEN 없으면 KNOX_AUTH_TOKEN
```

다만 `KNOX_MAIL_USER_ID`, `KNOX_SYSTEM_ID`, `KNOX_MAIL_SENDER_EMAIL`은 의미가 다르므로 무조건 같은 값으로 fallback하지 말고 회사 API 규격을 확인한다.

## 7-6. Knox Messenger

```dotenv
KNOX_MESSENGER_ENABLED=false
KNOX_MESSENGER_API_BASE_URL=
KNOX_MESSENGER_API_PATH=
KNOX_MESSENGER_API_TOKEN=
KNOX_MESSENGER_SYSTEM_ID=
KNOX_MESSENGER_TIMEOUT_SECONDS=10
KNOX_MESSENGER_VERIFY_SSL=true
KNOX_MESSENGER_DRY_RUN=false
```

## 7-7. DSLLM

```dotenv
DSLLM_BASE_URL=
DSLLM_API_KEY=

# 기존 이름 fallback
BASE_URL=
API_KEY=

LLM_MODEL_1=GPT-OSS
LLM_MODEL_2=GaussO3.2
LLM_MODEL_3=GaussO4.1
LLM_MODEL_4=Gemma4

DSLLM_TIMEOUT_SECONDS=120
DSLLM_CONNECT_TIMEOUT_SECONDS=15
DSLLM_NO_PROXY=
```

실제 모델명은 env 값이 source of truth다.

---

# 8. SSO 구현 상세

## 8-1. API

현재 플랫폼 규칙과 충돌하지 않으면 아래를 사용한다.

```text
GET  /api/auth/login
GET  /api/auth/callback
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/bypass      # development 전용, 외부 노출 최소화
```

필요하면 PLAN-AI frontend 호환용으로 `/api/auth/user/me` alias를 잠시 둘 수 있으나 신규 frontend는 `/api/auth/me`로 통일한다.

## 8-2. 로그인 흐름

```text
Frontend
→ /api/auth/login
→ Backend가 state와 nonce 생성
→ ADFS authorize redirect
→ /api/auth/callback?code=...&state=...
→ state 검증
→ code를 token으로 교환
→ id_token 서명/issuer/audience/exp/nonce 검증
→ loginid 기준 User upsert
→ 애플리케이션 전용 session 생성
→ Frontend /sso-callback#token={opaque_session_token}
→ Frontend가 /api/auth/me 호출
```

ADFS access token 또는 id_token 자체를 Frontend session token으로 사용하지 않는다.

## 8-3. Claim 매핑

회사 SSO claim명을 실제 token에서 확인해 매핑한다.

```text
loginid     필수, 소문자 normalize, unique key
username
mail/email
deptname/department
```

User role과 활성 상태는 SSO claim으로 덮어쓰지 않는다.

로그인 시 갱신 가능:

```text
username
department
email
last_login_at
```

## 8-4. 세션

현재 플랫폼에 안전한 인증 세션이 있으면 재사용한다.

신규로 만들 경우 권장:

```text
auth_sessions
- id
- token_hash
- user_id
- created_at
- expires_at
- revoked_at
- last_seen_at optional
```

- 클라이언트에는 random opaque token 전달
- DB에는 SHA-256 hash 저장
- 운영에서 Python 전역 dict 사용 금지
- logout 시 revoke
- 멀티 worker와 서버 재시작에서도 유지

## 8-5. SSO 보안 필수

- OAuth `state` 검증
- 가능하면 `nonce` 검증
- JWT signature/JWKS 검증
- issuer 검증
- audience/client ID 검증
- exp/nbf 검증
- token endpoint timeout
- SSL 검증 기본 true
- token/secret 원문 로그 금지
- 운영 CORS wildcard 금지

사내 인증서 때문에 SSL 검증을 끄는 것이 실제로 필요하면 env로만 허용하고 WARNING을 남긴다.

## 8-6. Bypass

- development에서만 동작
- 일반 SSO와 동일한 User upsert/session 함수 사용
- 기본 role은 `member`
- Bypass 분기를 업무 API마다 반복하지 않음
- production에서 endpoint 자체가 404 또는 403이 되도록 처리

---

# 9. Knox 임직원 검색 구현 상세

## 9-1. API

```text
GET /api/integrations/knox/employees?query={name_or_loginid}
```

기존 frontend 호환이 필요하면 `/api/employees` alias를 둘 수 있다.

반드시 현재 사용자 인증 필요.

## 9-2. 검색 정책

- 검색어 trim
- 너무 짧은 검색어 차단: 이름은 최소 2글자 권장
- Login ID 형태면 ID 검색 우선
- 한글/공백 포함이면 이름 검색 우선
- 첫 검색 결과가 없으면 반대 방식 fallback
- `userId` 기준 dedupe
- 최대 결과 수 제한

## 9-3. 응답 포맷

```json
{
  "items": [
    {
      "loginid": "...",
      "username": "...",
      "department": "...",
      "email": "...",
      "employee_number": "...",
      "source": "knox"
    }
  ]
}
```

Knox 원본 응답 구조를 frontend로 그대로 노출하지 않는다.

## 9-4. 장애 처리

아래를 구분한다.

```text
config_missing
connect_timeout
read_timeout
connect_error
authentication_error
permission_error
not_found
invalid_response
upstream_error
```

일반 사용자에게는 내부 URL/토큰/응답 원문을 노출하지 않는다.

---

# 10. Knox Mail 구현 상세

## 10-1. 공통 함수

```python
send_mail(
    to: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> MailSendResult
```

이번 플랫폼에서는 필요하지 않다면 SMTP/mock provider를 만들지 말고 다음만 지원해도 된다.

```text
disabled
knox_api
```

## 10-2. Knox Mail 요청

참고 구조:

```text
POST {base_url}{path}?userId={KNOX_MAIL_USER_ID}
Headers:
  Accept: application/json
  Authorization: Bearer {token}
  System-ID: {KNOX_SYSTEM_ID}

multipart/form-data:
  mail: application/json
```

mail JSON:

```json
{
  "subject": "...",
  "contents": "...",
  "contentType": "TEXT",
  "docSecuType": "PERSONAL",
  "sender": {"emailAddress": "..."},
  "recipients": [
    {"emailAddress": "...", "recipientType": "TO"}
  ]
}
```

성공 조건:

```text
HTTP 2xx
AND response.result == "success"
```

## 10-3. 테스트 API

```text
POST /api/admin/integrations/knox-mail/test
```

Body:

```json
{
  "recipient_email": "..."
}
```

- 관리자만 가능
- 제목/본문은 비민감 고정 테스트 문구
- 성공 여부, status code, provider message ID만 반환
- token/request body 전문 미반환

---

# 11. Knox Messenger 구현 상세

## 11-1. 공통 함수

```python
send_message(
    receiver_loginid: str,
    message: str,
    link: str | None = None,
    message_type: str = "notification",
    metadata: dict | None = None,
) -> SendResult
```

PLAN-AI의 `send_mention_message` 이름과 `source="plan"` 기본값은 제거한다.

## 11-2. 실제 API 스펙 확인

참고 코드의 Messenger payload는 placeholder다.

따라서 다음을 현재 회사 Knox Messenger 문서 또는 기존 운영 코드에서 확인한 뒤 확정한다.

- endpoint path
- HTTP method
- Authorization 방식
- System-ID 필요 여부
- 수신자 field명
- message field명
- link/action 구조
- 성공 응답 포맷

스펙이 확인되지 않으면 다음 상태까지 구현한다.

```text
- env/transport 구조
- DRY RUN
- payload builder 분리
- 관리자 테스트 API
- 명확한 TODO
```

실제 발송 성공을 임의로 가정하지 않는다.

## 11-3. 테스트 API

```text
POST /api/admin/integrations/knox-messenger/test
```

Body:

```json
{
  "receiver_loginid": "..."
}
```

- 관리자만 가능
- 고정 테스트 메시지
- DRY RUN 여부 반환
- 외부 연동 실패가 API 서버 전체에 영향을 주지 않음

---

# 12. Trouble 기능과 Mail/Messenger 연결

PLAN-AI의 Task/VOC mention 코드를 복사하지 말고, 현재 트러블슈팅 플랫폼의 실제 이벤트에 연결한다.

현재 코드 분석 후 아래 중 존재하는 지점을 우선 연결한다.

```text
Trouble 담당자 지정/변경
Trouble 등록 후 담당자 알림
댓글에서 사용자 멘션
상태 변경
긴급도 상승
처리기한 임박/초과
관리자 답변
```

구현 원칙:

1. 본 DB transaction을 먼저 성공시킨다.
2. commit 후 BackgroundTasks 또는 기존 outbox에 외부 알림을 요청한다.
3. Mail/Messenger 실패로 Trouble 저장을 rollback하지 않는다.
4. 같은 이벤트의 중복 발송을 방지할 수 있으면 dedup key를 사용한다.
5. 알림 본문에는 필요한 최소 정보와 플랫폼 링크만 포함한다.
6. 민감한 상세 로그나 이미지 원문을 그대로 보내지 않는다.
7. 어떤 이벤트에 어떤 채널을 사용할지는 상수 또는 설정으로 분리한다.

권장 초기 연결:

```text
담당자 지정/변경 → Knox Messenger
긴급 Trouble 또는 명시적 알림 → Knox Mail + Messenger
```

현재 플랫폼에 사용자별 알림 설정이 없다면 복잡한 preference UI를 이번 작업에서 새로 만들지 않는다. 기본 정책을 config로 두고 추후 확장 가능하게 만든다.

---

# 13. DSLLM 구현 상세

## 13-1. Text-only adapter

```python
chat(
    model_name: str | None,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str
```

필요할 때:

```python
chat_stream(...) -> Iterator[str]
```

## 13-2. OpenAI SDK Client

- `DSLLM_BASE_URL` 사용
- `DSLLM_API_KEY` 사용
- 명시적 timeout 설정
- 모델명은 `LLM_MODEL_1~4` 중 선택
- 호출자가 Base URL/API Key를 전달할 수 없게 함
- 프롬프트/응답 전문을 일반 로그에 남기지 않음
- 응답 오류는 표준 error type으로 감쌈

권장 client 예시 개념:

```python
OpenAI(
    api_key=...,
    base_url=...,
    timeout=...,
    max_retries=...,
)
```

## 13-3. 모델 목록

```text
GET /api/settings/ai/models
```

응답 예:

```json
{
  "models": ["DS/GPT-OSS", "DS/GaussO3.2", "DS/GaussO4.1", "DS/Gemma4"],
  "default_model": "DS/GPT-OSS"
}
```

빈 env 모델은 목록에서 제외한다.

## 13-4. 설정 조회

```text
GET /api/settings/ai
```

반환:

```json
{
  "model_name": "DS/GPT-OSS",
  "base_url_configured": true,
  "api_key_configured": true,
  "env_mode": "production"
}
```

Base URL 원문을 일반 사용자에게 보여주지 말고 관리자 화면에서만 host 정도를 마스킹해 보여줘도 된다.

## 13-5. 모델 저장

```text
PUT /api/settings/ai
```

Body:

```json
{
  "model_name": "DS/GPT-OSS"
}
```

정책:

- 관리자만 변경 가능
- 모델 목록에 있는 값만 허용
- API Key/Base URL 저장 금지
- 현재 플랫폼에 설정 테이블이 있으면 모델명만 저장
- 없으면 설정 테이블 하나를 최소 구성하거나 env 기본값만 사용

## 13-6. 연결 테스트

```text
POST /api/settings/ai/test
```

- 관리자만 가능
- 프로젝트/설비/Trouble 데이터 전송 금지
- 고정 비민감 문구 사용
- 응답 최대 길이 제한
- 성공 시 model과 짧은 answer 반환
- 실패 시 API Key, URL, stack trace 미노출

---

# 14. Frontend 구현 상세

## 14-1. 공통 API client

현재 client가 있으면 아래만 추가한다.

- session token Authorization header
- 401 시 session 제거 후 login redirect
- 동일 401에서 무한 redirect 방지
- SSO callback 요청은 예외 처리
- AI 요청 timeout은 일반 API와 분리 가능

## 14-2. User Context

최소 User 타입:

```ts
type CurrentUser = {
  id: number;
  loginid: string;
  username: string;
  department?: string;
  email?: string;
  role: string;
  isActive: boolean;
};
```

앱 시작 시 `/api/auth/me` 호출.

## 14-3. Callback Page

- URL fragment에서 opaque app session token 추출
- 저장 후 URL에서 token 즉시 제거
- `/api/auth/me`로 검증
- 기존 경로로 redirect
- 실패 시 token 제거 및 로그인 재시도/오류 화면
- React StrictMode 중복 실행 방지

## 14-4. Knox 검색 UI

현재 플랫폼의 담당자 선택 UI에 다음을 적용한다.

- 300~500ms debounce
- 이름 또는 Login ID 검색
- 이름 / Login ID / 부서 / 이메일 표시
- 결과 선택 시 현재 User가 없으면 현재 플랫폼 정책에 따라 upsert하거나 Knox reference로 저장
- 사용자 upsert가 필요하다면 Backend에서 수행하고 frontend가 role을 지정하지 못하게 함

## 14-5. DSLLM 설정 화면

관리자 전용 단순 화면:

```text
DSLLM 연결 상태
- ENV mode
- Base URL: 설정됨/미설정
- API Key: 설정됨/미설정

Model
- env 모델 Dropdown

Actions
- 저장
- 연결 테스트
```

OpenAI, Vision, API Key 입력, Base URL 입력 UI는 만들지 않는다.

## 14-6. 연동 진단 화면

기존 관리자 페이지가 있다면 작은 섹션으로 추가한다.

```text
SSO 설정 상태
Knox Employee 설정 상태
Knox Mail 설정 상태
Knox Messenger 설정 상태 / DRY RUN
DSLLM 설정 상태
```

secret은 bool 또는 masked 상태로만 노출한다.

---

# 15. 권장 API 목록

```text
# Auth
GET  /api/auth/login
GET  /api/auth/callback
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/bypass                development only

# Knox employee
GET  /api/integrations/knox/employees

# Integration admin diagnostics
GET  /api/admin/integrations/status
POST /api/admin/integrations/knox-employee/test
POST /api/admin/integrations/knox-mail/test
POST /api/admin/integrations/knox-messenger/test

# DSLLM
GET  /api/settings/ai
GET  /api/settings/ai/models
PUT  /api/settings/ai
POST /api/settings/ai/test
```

현재 플랫폼의 API naming rule이 있으면 맞춰 변경한다.

---

# 16. 관리자 진단 응답 원칙

`GET /api/admin/integrations/status` 예시:

```json
{
  "sso": {
    "configured": true,
    "jwks_configured": true,
    "verify_ssl": true
  },
  "knox_employee": {
    "configured": true,
    "token_configured": true,
    "system_id_configured": true
  },
  "knox_mail": {
    "enabled": false,
    "configured": false,
    "sender_email_configured": false
  },
  "knox_messenger": {
    "enabled": false,
    "configured": false,
    "dry_run": true
  },
  "dsllm": {
    "configured": true,
    "api_key_configured": true,
    "models": ["DS/GPT-OSS"]
  }
}
```

금지:

```text
API Key 원문
Bearer token 원문
Client Secret 원문
Authorization header
전체 내부 URL query
SSO id_token/access_token
메일 본문 전문
LLM prompt/response 전문
```

---

# 17. 보안 교정 체크리스트

다음 항목은 구현 완료 전에 모두 확인한다.

## SSO

- [ ] state 검증
- [ ] nonce 또는 동등한 replay 방지
- [ ] JWT 서명 검증
- [ ] issuer/audience/exp 검증
- [ ] token endpoint timeout
- [ ] SSL verify 기본 true
- [ ] 운영 Bypass 차단
- [ ] DB/Redis/기존 인증 기반 영속 세션
- [ ] logout revoke
- [ ] hard-coded super admin 제거

## Knox

- [ ] 임직원 검색 API 인증 적용
- [ ] 최소 검색 길이/결과 제한
- [ ] SSL verify env
- [ ] timeout
- [ ] token/검색 원문 로그 금지
- [ ] Mail userId/System-ID/sender 구분
- [ ] Messenger 실제 payload 스펙 확인

## DSLLM

- [ ] 명시적 timeout
- [ ] Base URL/API Key env only
- [ ] 모델 allowlist
- [ ] OpenAI/Vision 코드 미포함
- [ ] 비민감 연결 테스트
- [ ] prompt/response 전문 로그 금지

## Frontend

- [ ] ADFS token을 저장하지 않음
- [ ] callback URL token 즉시 제거
- [ ] 401 무한 redirect 방지
- [ ] secret 입력/노출 UI 없음
- [ ] 관리자 route/API 모두 Backend에서도 권한 검증

---

# 18. 구현 순서

## Phase 1. 기반

1. 현재 구조 분석
2. settings/env 통합
3. 최소 requirements 병합
4. 공통 integration result/error schema

## Phase 2. SSO

1. SSO service
2. 영속 session
3. auth dependency
4. router 등록
5. Bypass
6. Frontend Context/callback/interceptor

## Phase 3. Knox Employee

1. Knox client
2. 인증된 search router
3. 관리자 진단
4. Frontend search method/component 연동

## Phase 4. DSLLM

1. text-only adapter
2. models/settings/test API
3. 기존 Trouble AI 기능이 있으면 adapter 연결
4. 관리자 설정 화면

## Phase 5. Knox Mail/Messenger

1. generic transport
2. admin test API
3. DRY RUN
4. 현재 Trouble 이벤트 1~2개에 최소 연결
5. 실패 격리/로그

## Phase 6. 검증

1. Backend unit/smoke test
2. Frontend type check/build
3. 개발 Bypass E2E
4. 실제 사내망 SSO/Knox/DSLLM 연결 확인
5. 운영 env 누락/비활성 시 graceful behavior

---

# 19. 테스트 시나리오

## SSO

1. env 누락 시 명확한 설정 오류
2. 정상 로그인 → User upsert → `/auth/me`
3. 잘못된 state 거부
4. 만료/잘못된 token 거부
5. 비활성 사용자 403
6. logout 후 token 재사용 401
7. 서버 재시작 후 유효 session 유지
8. production Bypass 차단
9. development Bypass 일반 사용자 로그인

## Knox Employee

1. 이름 검색
2. Login ID 검색
3. fallback 검색
4. 결과 없음
5. 인증 없이 호출 401
6. timeout 502 또는 표준 오류
7. 401/403 upstream 오류 매핑
8. 중복 제거/결과 제한

## Knox Mail

1. disabled 상태에서 실제 호출 없음
2. 필수 env 누락
3. DRY RUN 또는 test recipient
4. 2xx + success
5. 2xx + failure body
6. 401/403
7. timeout
8. `mailId` 반환

## Knox Messenger

1. disabled no-op
2. DRY RUN
3. env 누락
4. 실제 test receiver
5. timeout/HTTP failure
6. Trouble 저장은 성공하고 알림만 실패

## DSLLM

1. Base URL 누락
2. API Key 누락
3. 모델 목록
4. 기본 모델
5. 잘못된 모델 저장 거부
6. 연결 테스트 성공
7. 401/403/404/429/5xx/timeout 처리
8. 일반 chat
9. streaming을 구현했다면 stream 종료/예외

## Frontend

1. token 없음 → 로그인 redirect
2. callback 성공
3. callback token 없음
4. `/auth/me` 실패
5. 401 처리
6. Knox 검색 loading/error/empty
7. DSLLM 설정 조회/저장/테스트
8. `npm run type-check`
9. `npm run build`

---

# 20. 완료 기준

다음이 모두 충족되어야 완료다.

- [ ] 현재 트러블슈팅 플랫폼 기존 기능이 유지된다.
- [ ] PLAN-AI 전체 파일을 덮어쓰지 않았다.
- [ ] SSO와 Bypass가 동일한 사용자/session 경로를 사용한다.
- [ ] 운영에서 Bypass가 불가능하다.
- [ ] SSO token 검증을 생략하지 않았다.
- [ ] Knox 검색은 인증된 사용자만 가능하다.
- [ ] Knox Mail 테스트가 실제 API 결과를 구분한다.
- [ ] Knox Messenger 스펙 확인 상태가 명확하다.
- [ ] Mail/Messenger 실패가 Trouble CRUD를 막지 않는다.
- [ ] DSLLM은 Text-only이며 OpenAI/Vision 코드가 없다.
- [ ] DSLLM secret은 env에만 있다.
- [ ] Frontend에 SSO callback과 사용자 Context가 연결됐다.
- [ ] Frontend에 Knox 검색과 DSLLM 설정/테스트가 연결됐다.
- [ ] secret/token 원문이 로그나 API 응답에 없다.
- [ ] 테스트 결과와 미확인 운영 항목이 문서화됐다.

---

# 21. 최종 보고 형식

구현 후 아래 형식으로 보고해라.

```text
1. 현재 플랫폼 구조 분석 결과
2. 실제 구현한 기능
3. 신규 파일
4. 수정 파일
5. PLAN-AI에서 참고한 원본 파일과 사용한 부분
6. 의도적으로 제외한 PLAN-AI 코드
7. 환경변수 목록
8. DB migration 여부와 적용 방법
9. API 목록
10. Frontend 변경사항
11. 실행한 테스트와 결과
12. 사내 환경에서 사용자가 직접 확인할 항목
13. 남은 위험/TODO
```

사내 환경에서만 확인 가능한 항목은 추측하지 말고 다음처럼 명확히 표시한다.

```text
확인 필요
- ADFS JWKS/issuer/audience 실제 값
- 신규 플랫폼 callback URI 등록 여부
- Knox System-ID 신규 서비스 권한
- Knox Mail 발송 계정/발신자 권한
- Knox Messenger 실제 endpoint/payload
- DSLLM Gateway 신규 플랫폼 네트워크 접근 권한
```

---

# 22. Claude Code 실행용 최종 요청문

아래 요청문과 이 문서를 함께 사용해라.

> 첨부한 PLAN-AI 참고 자료 `code.zip`, `main.py`, `requirements.txt`, `src.zip`, 관련 MD 문서를 읽기 전용 참고 자료로 사용해줘. PLAN-AI 전체 기능이나 파일을 복사하지 말고, 현재 트러블슈팅 플랫폼 구조를 먼저 분석한 뒤 이 문서에 지정된 SSO, 개발용 SSO Bypass, Knox 임직원 검색, Knox Mail, Knox Messenger, DSLLM Text 연동 코드만 선별해서 현재 저장소에 구현해줘. 특히 `main.py`, `client.ts`, `AdminPage.tsx`, `models.py` 전체를 복사하지 말고 필요한 연결 지점과 패턴만 가져와야 한다. OpenAI, Vision, S3, 백업, Realtime SSE, Project/Task/VOC/Sheet 기능은 제외해줘. 기존 참고 코드의 인메모리 세션, JWT 서명 미검증, SSL verify 비활성, hard-coded super admin, 인증 없는 Knox 검색, DSLLM timeout 부재는 그대로 복사하지 말고 문서 기준으로 교정해줘. 분석만 하고 멈추지 말고 실제 수정, env example, 테스트, 변경 파일 보고까지 완료해줘.
