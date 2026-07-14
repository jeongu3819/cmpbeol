# PLAN-AI 전체 오픈 전 리스크 점검 문서

> 본 문서는 **현재 코드 구조 기준** 리스크 점검 문서입니다. (문서화 전용, 코드 변경 없음)
> 확인되지 않은 항목은 `확인 필요`로 표기, 민감정보는 변수명만 표기합니다.
> 기준: `main` 브랜치 / 작성일 2026-06-13 / 업데이트 2026-06-14 / **멀티모달 AI 요약 리스크 추가 2026-06-27**
> 함께 보기: `PLAN_AI_SERVICE_STRUCTURE.md`, `PLAN_AI_ACTION_BACKLOG.md`, `RUNBOOK_OPEN_STABILITY.md`

> ### 🔄 2026-06-27 후속 업데이트 — 방향 전환(VOC 제외)
> - **AI 요약 멀티모달의 입력 대상이 "프로젝트 내부 이미지"로 확정**되고 **VOC 는 제외**됨. 따라서 섹션 8의 일부 리스크(특히 VOC 다운로드 무인증·공개 VOC 노출)는 **AI 요약 경로와 분리**된다(아래 M5/M6 주석 참조).
> - 이번 회차 실제 구현은 **기반 구조화만**: `project_ai_context_builder`(LLM 미호출, `image_manifest` 생성) + `ai-context-preview`(LLM 미호출) + 모델 capability 메타. **기존 텍스트 요약/모델 호출 경로는 무변경.** → A(텍스트 요약 퇴행) 리스크는 이번 회차에 발생하지 않음.
> - 입력 후보: Task 설명/작업노트 inline image, Task 첨부 이미지, Project 파일 이미지, Project Note inline image. **VOC 첨부/댓글 이미지는 사용하지 않음.**

> ### 🔄 2026-06-27 업데이트
> - **신규 섹션 8 추가: "멀티모달 AI 요약 도입 리스크"** (A~E). AI 요약에 **프로젝트 내부 이미지**(Task/Sub Project/작업노트/Project Note/Task·Project 첨부)를 활용하는 기능 검토용. **VOC 는 제외**(방향 전환 확정).
> - 코드 재확인 결과: **현재 AI 요약은 100% 텍스트 전용**, 첨부는 파일명만 LLM에 전달, DSLLM 어댑터는 text-only 메시지 구조(섹션 8 / SERVICE_STRUCTURE 섹션 10).
> - **확인된 신규 리스크**: VOC 첨부 다운로드 엔드포인트 무인증, DSLLM 호출 timeout 미설정, 현재 모델(GPT-OSS 계열)의 vision 지원/품질 미검증.

> ### 🔄 2026-06-14 업데이트
> - **백업 스케줄러 import(#17)**: `app.utils.s3.s3_utils` 경로로 **교정 완료**(import 검증). 위험도 🔴→🟢(코드 기준). 단 사내 배포본 반영 + 실제 백업 1회 동작 확인 필요.
> - **DB 커넥션 풀(#2)**: MySQL 풀 설정 완료 → 위험도 완화.
> - **운영 reload(#10·운영설정)**: `ENV_MODE` 기반 reload 게이팅 완료.
> - **data.json(#하단)**: 코드 확인 결과 **쓰기 37곳/읽기 86곳 — 실제 쓰기 발생**. 동시 수정 lost-update 리스크 **확정**(읽기 전용 아님).
> - **운영 경로 확정**: `nginx(TLS) → FastAPI → MySQL`, DB는 HeidiSQL 관리, compose Postgres/Redis 미사용.
> - **프론트 검증**: `npm run build`는 현재 환경 검증 불가 → `npm run type-check`로 대체, 최종 build는 사내 서버 확인.

---

## 1. 전체 요약

### 🔴 즉시 대응 필요 (오픈 전 반드시)
- **백업 스케줄러 import 경로 버그** (`utils.s3` vs `app.utils.s3`) → 자동 백업이 조용히 실패할 가능성. 데이터 보호의 근간이 무너짐.
- **권한 판단을 쿼리 파라미터 `user_id`에 의존하는 엔드포인트** 존재 → 권한 우회(횡적 접근) 가능성.
- **`CORS_ORIGINS` 미설정 시 `["*"]` fallback** → 운영에서 모든 Origin 허용 위험.
- **DSLLM/openai 모듈 로드 실패 시 서버 시작 영향** 범위 확인.

### 🟡 오픈 전 점검 필요
- DB 백업 **복구(RTO) 절차/테스트 부재** — 백업만 있고 복구 검증 없음.
- 하루 1회 백업 → **RPO 최대 24시간** 데이터 유실 가능.
- MySQL 커넥션 풀/인덱스 점검.
- HTTPS/리버스 프록시/재시작/모니터링 운영 구성 미확인.

### 🟢 오픈 후 모니터링 필요
- 첨부/VOC 이미지 저장공간 증가 추이.
- Knox / DSLLM 외부 연동 장애율/지연.
- 동시 접속 증가에 따른 단일 uvicorn 부하.

### ⚪ 장기 개선 과제
- `main.py` 9,300+ 라인 모놀리식 분리.
- 인메모리 세션(dict) → 영속 세션/Redis.
- S3 versioning / orphan 파일 정리 / 증분 백업.

---

## 2. 리스크 분석 표

| # | 리스크 항목 | 발생 조건 | 영향도 | 발생 가능성 | 현재 위험도 | 즉시 대응 방안 | 장기 개선 방안 |
|---|-------------|-----------|--------|-------------|-------------|----------------|----------------|
| 1 | 동시 접속 증가 서버 부하 | 단일 uvicorn, reload=True 운영 | 높음 | 중 | 🟡 | 워커 수/리버스 프록시 구성 확인, reload=False | 수평 확장, ASGI 워커 튜닝 |
| 2 | MySQL 커넥션 부족 | 풀 크기 미설정/과다 세션 | 높음 | 중 | 🟡 | pool_size/max_overflow 점검(`확인 필요`) | 커넥션 모니터링 |
| 3 | 인덱스 부족 조회 저하 | 대량 task/voc/sheet 조회 | 중 | 중 | 🟡 | 주요 FK/조회 컬럼 인덱스 점검(모델엔 다수 ix 존재) | 슬로우쿼리 로깅 |
| 4 | 이미지/첨부 저장공간 증가 | 업로드 누적 | 중 | 높음 | 🟢 | VOC는 webp 최적화됨, 일반 첨부는 원본 저장 | orphan cleanup, 용량 모니터링 |
| 5 | S3 백업만 있고 복구 시나리오 없음 | 장애 발생 시 | 높음 | 중 | 🔴 | 복구 절차 문서화 + 1회 복구 테스트 | 자동 복구 도구 |
| 6 | 하루 1회 백업 데이터 유실 | 백업~장애 사이 변경분 | 높음 | 중 | 🟡 | 빈도 상향 검토, binlog 활성화 검토 | 증분/PITR |
| 7 | Knox 호출량 증가 | 검색 빈발 | 중 | 중 | 🟢 | timeout 설정됨(connect10/read20) | 캐싱/디바운스 |
| 8 | Knox 장애 시 그룹/멤버 기능 영향 | Knox 다운 | 중 | 중 | 🟢 | KnoxError 분기 + 친화 메시지 매핑됨 | 부분 degrade UX |
| 9 | DSLLM 비용/속도/장애 | AI 리포트/쿼리 사용 | 중 | 중 | 🟡 | RuntimeError 래핑됨, 사용자 메시지 확인 | 호출 제한/큐잉 |
| 10 | openai/DSLLM env 누락 시 서버 시작 실패 | 모듈 로드 시점 | 중 | 중 | 🟡 | dsllm_adapter import 시점 영향 확인 | 지연 import |
| 11 | 권한 체크 누락 보안 | `user_id` 쿼리 신뢰 | 높음 | 중~높 | 🔴 | 토큰 기반 사용자 강제 검증 | 공통 인증 의존성화 |
| 12 | 권한 등급 혼선 | super/admin/space role 혼재 | 중 | 중 | 🟡 | 권한 매트릭스 문서화(섹션 6) | RBAC 정리 |
| 13 | 프론트 로딩 속도 | 번들 크기/위젯 다수 | 낮 | 중 | 🟢 | 코드 스플리팅 점검 | lazy load |
| 14 | Widget Settings 공간 타입 혼선 | purpose별 위젯 분리 미완 | 중 | 중 | 🟡 | 프론트 분기 정합성 확인 | 카탈로그 스키마화 |
| 15 | VOC 이미지 저장/삭제 실패 | Pillow/S3 이슈 | 낮 | 낮 | 🟢 | 최적화 fallback + 삭제 best-effort 적용됨 | orphan 정리 |
| 16 | S3 endpoint 설정 오류 | placeholder/오타 | 중 | 중 | 🟡 | placeholder 감지로 미구성 처리됨 | 기동 시 연결 검증 |
| 17 | 백업 스케줄러 실패 | import 경로 버그 | 높음 | 낮음(수정후) | 🟢(수정완료) | ✅ `app.utils.s3.s3_utils`로 교정+검증(2026-06-14). 사내 서버 1회 동작 확인 | 백업 성공/실패 알림 |
| 18 | 로그/모니터링/장애 알림 부재 | 운영 가시성 부족 | 높음 | 중 | 🟡 | 헬스체크/로그 수집 구성 | APM 도입 |
| 19 | 재시작/복구 절차 부재 | 장애 시 | 높음 | 중 | 🟡 | runbook 작성 | 자동화 |
| 20 | 민감정보 env 관리 | 키/토큰 노출 | 높음 | 낮 | 🟡 | .env 권한/`.gitignore` 확인, DB `ai_settings.api_key` 사용 여부 점검 | 시크릿 매니저 |

---

## 3. 백업 / 복구 리스크

현재 구조: APScheduler 하루 1회(기본 03:00 KST) → DB dump(MySQL `mysqldump` / SQLite 파일복사) → S3 업로드.

- **RPO 한계**: 백업 주기가 24시간이므로 최악의 경우 **최대 약 24시간치 데이터 유실** 가능.
- **DB full backup**: `mysqldump --single-transaction`로 풀 덤프 — ✅ 존재.
- **binlog/증분 백업**: ❌ 없음. PITR 불가 → 증분/binlog 활성화 검토 필요.
- **S3 versioning**: 코드상 미설정 — `확인 필요`. 동일 키 덮어쓰기/실수 삭제 방어 부재.
- **삭제 방지 정책**: S3 Object Lock/버킷 정책 — `확인 필요`.
- **복구 테스트**: ❌ 복구 엔드포인트/스크립트 없음. **실제 복구 1회 테스트 필수**.
- **RTO**: 미정의 — `확인 필요`. 복구 절차 문서화 필요.
- **장애 복구 절차 문서화**: 부재 → runbook 작성 필요.
- ⚠️ 추가: **import 경로 버그로 자동 백업 자체가 미동작할 가능성** → 백업 신뢰성 최우선 점검.

---

## 4. 파일 / 이미지 저장 리스크

- **이미지 압축/리사이즈**: VOC 한정 `_optimize_voc_image`(긴 변 기준 리사이즈 + webp). 일반 첨부(`project_files`, task files)는 **원본 저장**.
- **Pillow 의존성**: requirements 포함. 미설치 시 VOC는 원본 저장 fallback(서버 다운은 아님).
- **webp 변환**: ✅ VOC만. 일반 첨부는 변환 없음.
- **S3 저장 경로 규칙**: `{prefix}/files/{category}/{context}_{id}/{stored_name}`, 이미지 `{BASE_S3_PATH}/images/...`, 백업 `db-backups/{date}/...`.
- **임시 이미지 정리 / orphan cleanup**: ❌ 자동 정리 로직 없음 → 삭제된 엔티티의 잔존 파일 누적 가능.
- **삭제 실패 처리**: VOC는 best-effort(예외 전파 안 함). 일반 첨부 삭제 실패 처리는 `확인 필요`.
- **파일 접근 권한**: 다운로드 엔드포인트의 권한 검증 수준 `확인 필요`(공개/멤버 제한 여부).

---

## 5. 외부 연동 리스크 (Knox / DSLLM)

### Knox
- **timeout**: `httpx.Timeout(20.0, connect=10.0)` 설정됨.
- **인증 실패**: 401/403 → `error_type=Unauthorized` → "Knox 인증 실패" 메시지.
- **로컬/서버 차이**: `trust_env=False`, `verify=False`로 사내망 직접 연결. 로컬은 ConnectTimeout 가능(친화 메시지 처리됨).
- **env 누락**: `ConfigMissing` 분기.
- **fallback 메시지**: `knox.py _FRIENDLY_KNOX_MESSAGE` 매핑 존재.

### DSLLM
- **timeout**: OpenAI SDK 기본값 의존 — 명시적 timeout 미설정(`확인 필요`).
- **403/인증 실패**: `chat()`에서 RuntimeError로 래핑(모델/base_url/에러타입 포함).
- **모델명 오류**: `_resolve_model` + legacy alias 처리, env 미설정 시 RuntimeError.
- **proxy/no_proxy 충돌**: `config.py`가 `no_proxy="*"` 제거 후 DSLLM 호스트만 우회 → Knox와 분리됨.
- **사용자 화면 안내**: 실패 시 노출 메시지/스트리밍 중단 UX `확인 필요`.

---

## 6. 권한 / 보안 체크리스트

| 항목 | 현재 상태 | 비고 |
|------|-----------|------|
| super_admin 전용 기능 | `require_super_admin()` 사용: AI 설정, Knox 디버그, 백업 API 등 | `SUPER_ADMIN_LOGINIDS` env + 코드 하드코딩(auth.py) **이중 정의** → 동기화 확인 필요 |
| admin 접근 기능 | 조직 트리/그룹 관리 등 | admin 판정 로직 일관성 `확인 필요` |
| manager/member/viewer 차이 | SpaceMember.role = owner/admin/member (viewer 역할 코드상 명시 없음) | "manager/viewer" 등급은 `확인 필요` |
| 공간별 멤버 권한 | `_require_space_admin()` | |
| 프로젝트별 멤버 권한 | ProjectMember.role + owner/super 체크 | |
| 개선요청 수정/삭제 권한 | 본인 또는 `_is_voc_admin` | ✅ 서버 검증 |
| 그룹 멤버 추가/삭제 권한 | `확인 필요` (엔드포인트별 검증 편차) | |
| Knox 검색 권한 | `/api/employees` 인증 요구 여부 `확인 필요` | 디버그 검색은 super_admin |
| AI Settings 접근 | super_admin only ✅ | |
| **API 단 권한 체크** | **다수가 `user_id` 쿼리 파라미터 신뢰** | 🔴 토큰 기반 사용자로 강제 필요 |
| 프론트 숨김 의존 위험 | 일부 기능 프론트 숨김 + API 미검증 가능성 | 🔴 서버 측 검증 보강 필요 |

> 🔴 핵심: `delete_voc(voc_id, user_id=Query(...))`처럼 **호출자가 user_id를 임의 지정** 가능한 패턴은 권한 스푸핑 위험. 세션 토큰(`get_active_user`)에서 사용자 도출로 통일 권장.

---

## 7. 운영 체크리스트 (오픈 전)

| 점검 항목 | 방법 | 현재 |
|-----------|------|------|
| 서버 재시작 방법 | systemd/pm2/수동 등 | `확인 필요` |
| 로그 확인 방법 | uvicorn stdout + `backup_logs/` | 앱 로그 파일 핸들러 `확인 필요` |
| DB 백업 확인 | `GET /api/admin/backup/status`, `backup_logs/backup_YYYY-MM.log` | import 버그로 동작 여부 우선 확인 |
| S3 백업 확인 | `GET /api/admin/s3/files` (super_admin) | |
| 복구 테스트 | mysqldump 파일 복원 리허설 | ❌ 미수행 — 필수 |
| Knox 검색 테스트 | `GET /api/employees?query=...` | |
| DSLLM 테스트 | `POST /api/report/generate` 또는 `/api/settings/ai/models` | |
| frontend build 확인 | `npm run build` → dist 산출 | outDir `확인 필요` |
| backend health check | `GET /health`(직접), `GET /api/health`(nginx 경유) | ✅ 둘 다 존재(2026-06-14 `/api/health` 추가). nginx는 `/api/`만 프록시하므로 nginx 경유 점검은 `/api/health` 사용 |
| HTTPS 인증서 확인 | 리버스 프록시 측 | `확인 필요` |
| env 파일 확인 | `app/.env.production` 키 누락 점검 | 민감정보 변수명 기준 점검 |

---

## 8. 멀티모달 AI 요약(이미지 활용) 도입 리스크 (2026-06-27 신설)

> 검토 대상: **프로젝트 내부** Task 설명 / 작업노트(TaskActivity) / Project Note / Task·Project 첨부 등에 포함된 **이미지(차트·표·에러화면·캡처)** 를 AI 요약에 활용하는 기능. **VOC 이미지는 제외(방향 전환 확정).**
> **이미지 분석은 미구현이며 이번 회차에 구현하지 않음.** 이번 회차는 `image_manifest` 구조화 기반만 구현. 아래는 실제 이미지 분석 도입 전 반드시 합의/대비해야 할 리스크.
> 현재 구조 근거는 `PLAN_AI_SERVICE_STRUCTURE.md` 섹션 10(특히 10.5 구현분).

### 핵심 개발 원칙 (리스크 회피의 전제)
- **기존 텍스트 AI 요약을 절대 망가뜨리지 않는다.** 텍스트 요약이 항상 기본 경로.
- 이미지 분석은 처음부터 기본 기능으로 넣지 않는다 → **optional / experimental / feature flag**로 분리.
- 모델이 vision을 지원하지 않으면 **이미지 분석 경로를 타지 않는다.**
- 이미지 분석 실패가 **전체 요약 실패로 이어지면 안 된다.**
- **15초 이내 응답** 목표. 초과 가능성 있으면 비동기 처리/별도 실행 UX 검토.
- 품질 낮은 모델로 무리하게 통합 요약을 만들지 않는다. 이미지 결과는 텍스트와 **구분 표시**.
- 민감정보/권한/공개 VOC 리스크를 반드시 고려한다.

### A. 기존 텍스트 요약 안정성 리스크 🔴(원칙 위반 시 치명)
- 현재 텍스트 요약(`generate_report`/`ai-query`)은 이미 동작 중 → 이미지 기능을 같은 경로에 섞다가 **품질/안정성이 퇴행하면 안 됨**.
- 요구사항:
  - 기존 텍스트 요약은 **기본 경로로 고정**(이미지 미사용 시 코드 흐름이 지금과 동일해야 함).
  - 멀티모달은 **feature flag / optional 파라미터**로 분리(예: `include_images=false` 기본).
  - **이미지 분석 실패 시에도 텍스트 요약은 정상 반환** (이미지 섹션만 비거나 "분석 실패" 표기).
  - **이미지 분석 timeout이 전체 AI 요약을 막으면 안 됨** → 이미지 단계 독립 timeout + partial result.
  - 모델 오류/403/응답 지연/JSON 파싱 실패 등에 대해 **이미지 단계 한정 fallback**.

### B. 모델 성능/속도 리스크 🔴
- 현재 연동 모델은 **GPT-OSS 계열**(model_1 기본). `model_4`(Gemma4)만 "이미지 인식 가능" 라벨이나 **실제 vision 호출/품질 미검증**.
- 사내 오픈소스 기반 모델은 **버퍼링/오류**가 잦을 수 있음.
- 요구사항:
  - **현재 모델이 실제로 image input을 지원하는지 먼저 확인** (DSLLM 게이트웨이가 `image_url` content를 받는지 PoC).
  - 지원하더라도 **응답 품질·속도 검증** 필요. **목표 응답 15초 이내**, 이미지로 인해 **30초 이상 지연 시 사용성 붕괴**.
  - 사용자가 기다릴 수 있는 UX인지 검토 → **비동기/background job/"이미지 분석 중" 상태** 필요성 판단.
  - **DSLLM 어댑터에 명시적 timeout이 없음**(현재 OpenAI SDK 기본값) → 멀티모달 전 timeout 도입 선결.
  - **모델별 capability 관리** 필요: `text-only` / `vision-supported` / `unstable·experimental`. (현재는 설명 문자열만 존재 → 구조화 필요)

### C. 품질 리스크 🟡
- 차트/표를 **오해석하면 잘못된 요약**을 생성 → 텍스트 요약보다 위험할 수 있음.
- 요구사항:
  - 이미지 분석 결과는 **"참고 정보"로만** 취급.
  - AI 요약에서 **이미지 해석 결과와 텍스트 근거를 명확히 구분** 표시(섹션 분리: 예 "첨부 이미지 참고 요약").
  - 차트 **수치/축/범례 오인식**, 에러화면/사내 캡처의 **민감정보 포함** 가능성 인지.
  - 이미지 OCR/vision 결과를 **그대로 신뢰 금지** → "이미지 기반 추정" 문구 또는 confidence 표시 검토.

### D. 보안 / 민감정보 리스크 🔴
- 프로젝트 내부 업무 이미지에도 **사람 이름·부서·사번·시스템명·장비명·에러코드·내부 URL** 등이 포함될 수 있음.
- **VOC 는 AI 요약 대상에서 제외**되므로 VOC 다운로드 무인증(`GET /api/voc/{id}/attachments/{stored_name}/download`)·공개 VOC 노출은 **AI 요약 경로와 무관**해짐. (VOC 자체 보안 과제로는 별도 유지 — M5/M6 주석 참조)
- 요구사항(프로젝트 내부 이미지 기준):
  - AI 요약에 이미지를 보내기 **전 project_id 기준 권한 체크** (요청자가 해당 프로젝트 접근 권한이 있는지). → `ai-context-preview`는 `check_project_access` 적용 완료.
  - **권한 없는 사용자가 `image_manifest`를 볼 수 없어야** 함. `image_manifest`에 raw URL/서버 경로 비노출(`storage_ref.local_path=null`, 백엔드 내부 식별자 중심) — 구현 반영됨.
  - Task/Project 첨부 **접근 권한 검증을 다운로드/분석 경로 양쪽에서** 보강.
  - **AI 호출 로그에 이미지 원본/`nearby_text` 전체를 남기지 않도록** (`nearby_text`는 ~400자 truncate, `_log_dsllm_failure`/`[DSLLM]` 로그가 프롬프트를 남기지 않는지 점검).
  - (이번 범위 아님) 민감정보 자동 제거 — 향후 확장 대비 `sensitivity_level` 필드만 manifest에 준비됨.

### D-2. 입력 이미지 품질 리스크 🟡 (2026-06-27 2차 — AI-ready Image Layer)
- 좋은 vision 모델을 붙여도 **입력 이미지가 너무 작거나/흐리거나/preview/thumbnail 만 있거나/차원 메타가 없으면** 모델 성능이 떨어진다. "좋은 모델 API 연결"보다 **입력 이미지 품질/맥락 구조화**가 실효성의 핵심.
- **현재 확인된 구체 사실**:
  - ~~프로젝트 내부 이미지는 업로드 시 width/height 미저장~~ → **2026-06-27 3차에서 업로드 시 `width/height/sha256/format` 캡처 추가**(`tasks/{id}/files`·`projects/{id}/files`·`spaces/{id}/images`, `app/utils/image_meta.py`). **신규 업로드분은 readiness 실판정**, 단 **기존 레코드는 메타 부재로 여전히 `missing_dimensions`**(재업로드 시 보강). (`PLAN_AI_SERVICE_STRUCTURE.md` 10.6/10.7)
  - 단, 프로젝트 내부 이미지는 서버측 리사이즈를 거치지 않으므로 **원본은 보존**됨(`ai_image_variants.original.available=true`). 즉 **품질 판단 메타만 부족**, 원본 데이터 손실은 아님.
  - preview/thumbnail 전용 저장 경로가 없어 **원본 vs preview 구분 정책 부재**.
- 요구사항(향후):
  - 이미지 업로드 시 **width/height(가능하면 content hash) 캡처** → 가독성 판단 가능.
  - **원본/preview/ai_readable variant 분리 저장 정책** 수립 후 실제 전처리(업스케일/타일/blur) 잡 도입.
  - 작은/저해상도/차원누락 이미지는 vision 입력에서 **선별 제외 또는 "저품질" 표기**(현재 `recommended_for_ai`/`readability_status` 로 표현됨).
- 이번 회차 구현: **판단/구조화 메타만** 추가(실제 이미지 처리·blur 측정·타일 생성 없음).

### D-3. 이미지 분석 결과 캐시(오해석 영구 재사용) 리스크 🔴 (2026-06-27 4차)
- vision 모델을 붙였을 때 **잘못 해석한 이미지 결과를 캐시로 영구 재사용**하면 이후 프로젝트 AI 요약이 계속 오염된다. (예: "불량률 3.2%→1.1% 감소"를 "증가"로 오독한 결과가 고정되면 반복 인용)
- **위험한 안티패턴**: `image_hash` 하나만으로 semantic analysis cache key를 만들어 "이미 분석한 이미지는 재분석 안 함"으로 처리하는 것.
- 요구사항(이번 회차 구조 반영):
  - **메타데이터 캐시 ↔ 의미 분석 캐시 분리.** 메타(해상도/hash/readiness/variant)는 재사용 가능, 의미 해석은 정답 캐시 금지(`analysis_reuse_policy`).
  - semantic cache key에 **model / model_version / prompt_version / context_schema / nearby_text_hash / task_context_hash / project_context_hash** 포함(`analysis_identity.semantic_cache_key_preview`). 맥락 변경 시 key가 바뀌어 재분석 유도.
  - 의미 분석은 정답 캐시가 아니라 **`ImageAnalysisAttempt` 이력**으로 관리(향후 DB, 미구현). 이전 결과 history 보존, 최신 1건을 정답 단정 금지, 사용자 "다시 분석"/낮은 confidence/피드백 시 재분석.
  - **원문 텍스트는 key/로그에 미포함**(sha256 hash만). raw URL/`local_path` 비노출 유지.
- 이번 회차 구현: **정책/식별자/트리거 구조만**(실제 vision 호출·OCR·결과 DB 저장 없음).

### E. 아키텍처 리스크 🟡
- 이미지 분석을 기존 AI 요약 경로에 직접 섞으면 **구조 복잡도/장애 영향 범위 증가**.
- 요구사항:
  - **text summary pipeline ↔ image analysis pipeline 분리**.
  - 이미지 분석 결과를 **별도 중간 데이터로 저장**할지 검토(요약 재생성마다 재분석 방지).
  - **`attachment_id`/`stored_name` 기반 캐시** 가능성(같은 이미지 재분석 회피). VocAttachment는 안정적 식별자 보유.
  - **timeout / retry / partial result** 전략 필요.
  - 프론트에서 **이미지 분석 사용 여부를 선택**할 수 있게 할지 검토.

### 멀티모달 리스크 요약표

| # | 리스크 | 영역 | 현재 상태 | 위험도 | 선결 조건 |
|---|--------|------|-----------|--------|-----------|
| M1 | 기존 텍스트 요약 퇴행 | A | 텍스트 전용 동작 중 | 🔴 | 경로 분리 + flag |
| M2 | 모델 vision 미지원/저품질 | B | 미검증(GPT-OSS) | 🔴 | DSLLM image PoC |
| M3 | 응답 지연(>15s/30s) | B | timeout 미설정 | 🔴 | timeout + 비동기 검토 |
| M4 | 이미지 오해석 | C | 미구현 | 🟡 | 결과 구분/추정 표기 |
| M5 | VOC 첨부 다운로드 무인증 | D | **현존 취약(단 AI 요약 경로와 분리)** | 🔴(VOC 자체) / 🟢(AI 요약) | VOC 제외로 AI 요약 비해당. 프로젝트 첨부는 project_id 권한 검증 |
| M6 | 공개 VOC 민감정보 노출 | D | VOC 제외 | 🟢(AI 요약 비해당) | AI 요약은 프로젝트 내부 한정. `image_manifest` 권한·raw URL 비노출 적용 |
| M7 | 파이프라인 결합도 | E | 구조화 기반만 구현 | 🟡 | text/image 분리 설계(Context Builder 분리 완료) |
| M8 | 이미지 오해석 결과 영구 캐시 | D-3 | 정책/식별자/트리거 구조 구현(분석 미구현) | 🔴 | image_hash 단독 캐시 금지, versioned attempt(ImageAnalysisAttempt) |
| M9 | compact crop 과대평가/과소평가 | C | readiness 휴리스틱 보정(2026-06-28) | 🟡 | conditional 표기 + 모델 연결 시 결과 검증 |

### F. Readiness 판단 리스크 — "작은 이미지" 오분류 (2026-06-28 보정) 🟡
- **배경**: 기존 기준은 `작은 이미지 = AI 분석 부적합(not_recommended)`. 그러나 사용자는 **필요한 텍스트/표/에러 영역만 작게 잘라(compact crop)** 작업노트에 붙이는 경우가 많다(예: `493x74`). 작다는 이유만으로 유용한 업무 근거 이미지를 후보에서 제외하면 안 된다.
- **보정**:
  - `compact_text_crop` / `small_but_readable` / `partial_screen_capture` / `too_small_for_text` status 추가, `recommendation_level`(recommended/conditional/not_recommended/unknown) 도입.
  - compact crop 은 **`conditional`** 로 분류 → `recommended_for_ai=true` 로 두되 `quality_notes`/`recommendation_level` 로 **"결과 검증 필요"** 표시. 완전 제외하지 않음.
  - 단, 진짜 too-small(`width<250 또는 height<40`)/unsupported 는 계속 `not_recommended`.
- **남은 리스크(🟡)**: OCR/vision 없이 메타(해상도/비율/역할/맥락)만으로 판단하므로 **compact crop 오분류 가능**(예: 작은 차트 수치, 흐릿한 텍스트). → conditional 로만 열어두고, **모델 연결 시 반드시 결과 검증** 단계 필요. display resize(사용자 표시 크기)와 original 품질은 **분리**해서 판단(원본 보존됨).
- **불변**: vision/OCR 미호출, AI Report/Query 무변경, DB 마이그레이션 없음, VOC 제외.

## R: 낮은 성능 vision 모델 대응 (Image Evidence Card)

- **방향**: 고성능 모델 의존 없이 사내/저비용 vision 모델도 활용 — 이미지를 바로 요약시키지 않고 `evidence_card`(image_role/context_strength/extraction_target/model_instruction_key/quality_warning/ai_input_strategy)를 함께 제공. 단계화: 이미지 판독 → evidence 생성 → Task 맥락 연결 → 프로젝트 요약 반영.
- **role 세분화**: command_snippet/code_snippet/log_capture/terminal_capture/config_capture/document_table/process_flow 추가. role 별 지시사항으로 chart/table/error/command/log/equipment 를 다르게 처리.
- **남은 리스크(🟡)**: OCR/vision 없이 메타(키워드/비율/맥락)만으로 role/strength 를 추정 → **오분류 가능**. 특히 nearby_text 없는 이미지는 role 신뢰도 low, `context_strength=weak/none` 으로 표시하고 모델 결과를 강하게 믿지 않는다(검증 대상).
- **민감정보(🟡)**: config_capture 는 `.env`/키/토큰 가능성 → 지시사항에서 **마스킹/요약** 유도, 값 추정 금지.
- **불변**: vision/OCR 미호출, AI Report/Query 무변경, DB 마이그레이션 없음, VOC 제외, storage path/raw key 미노출.

## S: Model Compatibility Layer — 사내 모델 API 충돌 리스크

- **배경**: 사내 모델 API 는 자체 system prompt / context packing / OCR / 출력 schema / 보안 필터를 가질 수 있다. PLAN-AI 의 role/extraction_target 을 **정답으로 강제**하면 내부 룰과 충돌(예: PLAN-AI=chart vs 모델=document/table).
- **대응**: `model_input_packet`(project-ai-model-input-v1) 으로 변환 시 `image_role` → `image_role_hint`, `instruction_strength=hint`, 모든 packet 에 **Global Rule**(이미지에서 보이는 사실 우선, metadata 는 힌트, 추정 금지) 포함. provider adapter 분리로 실제 API 스펙 확정 시 Layer 만 수정.
- **남은 리스크(🟡)**: role_confidence low 인데도 모델이 hint 를 과신할 가능성 → role_instruction 에 저신뢰 경고 문구 자동 삽입. A/B/C(`input_mode`)로 Evidence Card 제공 효과를 실측 후 조정 예정.
- **민감정보(🟡)**: config_capture 등은 마스킹 지시를 포함하나, 실제 마스킹은 모델/사내 필터 책임 → 사내 API 의 민감정보 정책 확인 필요(아래 체크리스트 11).
- **불변**: 실제 vision/OCR/모델 호출 없음, payload 에 image binary/base64/storage path 미포함, AI Report/Query 무변경, DB 마이그레이션 없음, VOC 제외.

### 사내 모델 API 확인 체크리스트 (모델 API 개발자에게 확인)

1. 이미지 입력 형식은 어떻게 되는가? (URL / base64 / 멀티파트 / 내부 ref)
2. 이미지와 텍스트를 함께 넣을 때 권장 순서는? (text→image / image→text)
3. system prompt 를 우리가 줄 수 있는가, 아니면 내부 고정인가?
4. metadata/custom_context 필드를 받을 수 있는가?
5. JSON output schema 를 강제할 수 있는가?
6. 이미지 여러 장을 한 번에 넣는 것보다 1장씩 넣는 게 나은가?
7. 토큰/이미지 크기 제한은?
8. 내부에서 OCR 이나 이미지 분류를 이미 수행하는가?
9. 우리가 role_hint/extraction_target 을 주면 내부 룰과 충돌하는가?
10. "metadata 는 힌트일 뿐, 이미지 내용을 우선" 같은 instruction 을 허용하는가?
11. 민감정보 필터링/마스킹 정책은 어떻게 되는가?
12. 모델 결과에 confidence 또는 uncertainty 를 반환할 수 있는가?

---

## 최신 코드 기준 업데이트

### 확인 일자
- 2026-07-09 (`main` HEAD `21dedee`)

### 최근 추가/변경으로 생긴/변한 리스크
- **[신규] 실제 메일 발송 경로 활성 가능**: `MAIL_PROVIDER=knox_api` 시 `notification_processor` 가 사내 Knox Mail API 로 실발송. `verify=False` + `trust_env=False`(사내망 직접). 리스크: ① 잘못된 대상/스팸성 발송 방지 위해 접근권한(can_access_task)·pref·self·opt-in 다중 게이트 존재(코드 확인) ② 실패 사유는 `notification_events.error_message` 로 관측. → 운영 전 `MAIL_PROVIDER` 기본 `disabled` 확인, sender/userId/System-ID env 혼동 주의.
- **[신규] OpenAI provider 외부 전송 리스크**: provider=openai 선택 시 프로젝트 텍스트가 외부 API 로 전송될 수 있음. `router.OPENAI_WARNING` 문구로 경고하며, env(`OPENAI_API_KEY`/`ENABLE_OPENAI_PROVIDER`) 없으면 선택 자체가 비활성 → 사내 운영 env 에서는 자연 차단. **민감정보 외부전송 금지 정책**을 운영 문서에 명문화 필요.
- **[신규] Vision Report PoC 실이미지 전송**: `POST /api/projects/{id}/ai-report/vision-test`(super_admin 전용)는 실제 이미지 바이트를 vision 모델에 전송. max3/hard5 제한. DB 저장 없음. 일반 사용자 비노출. → 권한 게이트/저장 미수행 확인됨, 그러나 이미지 내 민감정보 노출은 잔존 리스크.
- **[신규] realtime_events/SSE 부하**: worker당 SSE 접속 상한(`REALTIME_MAX_CLIENTS_PER_WORKER=300`), space 단위 1 poller. 비상 스위치 `REALTIME_SYNC_ENABLED=false`. payload 비민감 정책 코드로 강제.
- **[변경] AI 요약 "이미지 호출 경로 전무" 서술 보정**: 일반 Report/Query 는 여전히 text-only 이나, super_admin PoC 경로는 실제 vision 호출 존재.

### 기존 리스크 재확인
- **A2 권한 `user_id` 쿼리 의존**: 🔴 유지. 신규 VOC vote/comment 등에도 동일 패턴 확산 여부 감사 필요.
- **백업 복구(RTO)/data.json sidecar lost-update**: 🟡 유지.

### Workflow Intelligence 설계 시 확인해야 할 리스크
- 업무 흐름 로그(`ProjectProcessEvent`) 도입 시 payload 민감정보 저장 금지 원칙(realtime_events/system_event_logs 와 동일)을 스키마 레벨에서 강제. 상세: `docs/PLAN_AI_WORKFLOW_INTELLIGENCE_DATA_ARCHITECTURE.md` "구현 전 확인 리스크".

### 확인 필요
- 운영 `MAIL_PROVIDER` 값 / OpenAI provider 비활성 상태 / Vision PoC 접근 범위 실배포 확인.
