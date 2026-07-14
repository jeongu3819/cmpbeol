# PLAN-AI 액션 백로그 (수정 작업 단계화)

> 본 문서는 **실제 수정 작업을 단계별로 쪼개기 위한** 백로그입니다. (현재는 문서화 단계로, 아래 작업은 아직 수행하지 않음)
> 기준: `main` 브랜치 / 작성일 2026-06-13 / 진행 업데이트 2026-06-14 / **멀티모달 AI 요약 단계화 추가 2026-06-27**
> 함께 보기: `PLAN_AI_SERVICE_STRUCTURE.md`, `PLAN_AI_OPEN_RISK_REVIEW.md`, `RUNBOOK_OPEN_STABILITY.md`, `RUNBOOK_LOAD_TEST.md`

> ### 🔄 2026-06-27 후속 — 방향 전환 + 기반 구현 착수
> - **AI 요약 대상은 "프로젝트 단위" 유지, VOC 는 제외 확정.** 이미지 입력 후보는 **프로젝트 내부**(Task 설명/작업노트 inline image, Task 첨부 이미지, Project 파일 이미지, Project Note inline image). 이전 단계화가 "VOC 이미지"로 적었던 부분은 본 방향으로 정정함.
> - **이번 구현의 핵심은 이미지 인식이 아니라 이미지-텍스트 맥락 구조화 기반** (`image_manifest`) + 미래 vision 모델 연결 준비.
> - **이번 회차 실제 구현분**: `app/services/project_ai_context_builder.py`(LLM 미호출), `GET /api/projects/{id}/ai-context-preview`(LLM 미호출), DSLLM 모델 capability 메타(`vision_supported`, 메타데이터 전용). → Phase 1 일부 선반영(아래 체크 참조). 기존 텍스트 요약/모델 호출 경로는 **무변경**.

> ### 🔄 2026-06-27 추가
> - 문서 하단에 **"멀티모달 AI 요약(이미지 활용) 단계별 백로그 (Phase 0~5)"** 신설.
> - 멀티모달은 **기존 텍스트 요약을 기본 경로로 유지**하고 optional/experimental로만 진행하는 것이 절대 원칙(개발 원칙 섹션 참조).

> ### ✅ 2026-06-14 진행 상태
> - **A1 백업 import 교정**: 완료(`app.utils.s3.s3_utils`, import 검증). 사내 서버 동작 확인만 남음.
> - **A3 운영 CORS / reload**: reload `ENV_MODE` 게이팅 완료. CORS env 명시는 사내 설정에서 확정 필요.
> - **DB 커넥션 풀**: 설정 완료(MySQL only).
> - **A2 권한 user_id 의존 제거**: 미착수(P0 유지).
> - **A4 백업 복구 리허설**: 절차 문서화 완료(`RUNBOOK_OPEN_STABILITY.md`), 실제 리허설 미수행.
> - **B1 Knox / B2 Widget / 중복제출 가드**: 코드 확인 결과 대부분 이미 안전(아래 본문/런북 참조).

## 우선순위 분류
- **P0**: 오픈 전 반드시 수정 또는 확인
- **P1**: 오픈 직전 개선 권장
- **P2**: 오픈 후 빠르게 개선
- **P3**: 장기 개선

---

## P0 — 오픈 전 반드시

### A1. 백업 스케줄러 import 경로 정합성 확인/수정
- **목적**: 자동/수동 백업이 실제로 동작하도록 보장
- **현재 문제**: `app/services/backup_scheduler.py`가 `from utils.s3.s3_utils import ...` 사용. main.py는 `from app.utils.s3.s3_utils ...` 사용. `backend/utils/` 최상위 패키지 없음 → `No module named 'utils'`로 백업 미동작 가능 (startup try/except가 에러를 삼킴)
- **수정 파일 후보**: `app/services/backup_scheduler.py` (105, 237, 334행)
- **수정 내용**: import 경로를 `app.utils.s3.s3_utils`로 통일 (PYTHONPATH로 해석되는지 먼저 검증 후 결정)
- **테스트 방법**: `POST /api/admin/backup/db` 호출 후 결과/`backup_logs` 확인, 또는 `start_backup_scheduler()` 로그 확인
- **위험도**: 낮음 (import 경로 1줄성 변경) / 효과 큼
- **우선순위**: P0

### A2. 권한 판단의 `user_id` 쿼리 의존 제거(핵심 엔드포인트부터)
- **목적**: 권한 스푸핑(횡적 접근) 차단
- **현재 문제**: VOC 등 다수 엔드포인트가 `user_id: int = Query(...)`로 호출자 신원을 신뢰
- **수정 파일 후보**: `main.py` (VOC `/api/voc*`, 기타 user_id 쿼리 사용 엔드포인트)
- **수정 내용**: `get_active_user` 의존성으로 세션 토큰에서 사용자 도출, 쿼리 user_id와 불일치 시 거부 (대규모 → 단계적)
- **테스트 방법**: 타 사용자 토큰으로 본인 아닌 voc_id 삭제 시도 → 403 확인
- **위험도**: 중간 (프론트 호출 규약 영향 가능) → 단계적 적용
- **우선순위**: P0

### A3. 운영 CORS 화이트리스트 확정
- **목적**: `["*"]` fallback로 인한 무제한 Origin 허용 방지
- **현재 문제**: `allow_origins=CORS_ORIGINS or ["*"]` — env 미설정 시 전체 허용
- **수정 파일 후보**: `app/.env.production`(설정값), 검증은 `main.py`/`environment.py`
- **수정 내용**: 운영 도메인으로 `CORS_ORIGINS` 명시 (코드 변경 없이 env로 해결 가능)
- **테스트 방법**: 허용 외 Origin에서 요청 시 CORS 차단 확인
- **위험도**: 낮음
- **우선순위**: P0

### A4. 백업 복구 절차 문서화 + 복구 1회 테스트
- **목적**: 백업이 실제 복구 가능함을 보증 (RTO 산정)
- **현재 문제**: 복구 엔드포인트/스크립트/문서 부재
- **수정 파일 후보**: (코드 아님) runbook 문서 + mysqldump 복원 리허설
- **수정 내용**: dump 파일 → 테스트 DB 복원 절차 작성 및 1회 검증
- **테스트 방법**: S3의 최신 dump를 별도 DB에 복원, 행수/무결성 확인
- **위험도**: 낮음 (운영 절차)
- **우선순위**: P0

### A5. DSLLM/openai 모듈 로드 실패 영향 확인
- **목적**: 패키지/ENV 누락 시 서버 부팅 영향 범위 파악
- **현재 문제**: `dsllm_adapter.py`가 import 시 `_log_startup_env_state()` 즉시 실행, `from openai import OpenAI` 모듈 레벨
- **수정 파일 후보**: 확인 우선 (수정은 필요 시 `app/llm/dsllm_adapter.py`)
- **수정 내용**: openai 미설치/ENV 누락 시 서버가 죽는지 검증, 필요 시 지연 import
- **테스트 방법**: 가상환경에서 openai 미설치 상태로 기동 시도
- **위험도**: 낮음(확인) / 중간(수정 시)
- **우선순위**: P0(확인) → P1(수정)

---

## P1 — 오픈 직전 권장

### B1. Knox 검색 graceful handling 재확인
- **목적**: Knox 장애 시 그룹/어드민 페이지 전체가 깨지지 않도록
- **현재 문제**: 로컬 ConnectTimeout 가능 (이미 KnoxError 분기 + 친화 메시지 있음)
- **수정 파일 후보**: `app/services/knox_client.py`, `app/routers/knox.py`, main.py 멤버 후보 검색부
- **수정 내용**: 모든 Knox 호출부가 KnoxError를 catch하여 부분 degrade 응답 반환하는지 점검
- **테스트 방법**: `KNOX_API_URL`을 임시로 잘못 설정 후 검색
- **위험도**: 낮음
- **우선순위**: P1

### B2. Widget Settings 공간 타입(purpose) 분리 정합성
- **목적**: 설비/프로젝트 위젯 혼재 방지
- **현재 문제**: purpose별 위젯 카탈로그 분리 진행 중(최근 커밋)
- **수정 파일 후보**: `frontend/src/pages/HomePage.tsx`, `components/equipment/EquipmentOpsWidgets.tsx`, 위젯 설정 저장부(`user_preferences.layout`)
- **수정 내용**: purpose별 위젯 목록/기본 레이아웃 분기 검증
- **테스트 방법**: project_management / equipment_ops 공간 각각에서 위젯 목록 확인
- **위험도**: 낮음
- **우선순위**: P1

### B3. uvicorn 운영 실행 구성 점검
- **목적**: 운영에서 reload=True/단일 워커 부하 방지
- **현재 문제**: `main.py __main__`이 `reload=True`로 실행
- **수정 파일 후보**: 운영 실행 스크립트/서비스 정의 (`확인 필요`)
- **수정 내용**: 운영은 reload 비활성, 워커 수/프록시 구성 확정
- **테스트 방법**: 부하 시 응답 안정성 확인
- **위험도**: 낮음
- **우선순위**: P1

### B4. 백업 빈도/증분 검토
- **목적**: RPO 24h 한계 완화
- **현재 문제**: 하루 1회 full dump만
- **수정 파일 후보**: `environment.py`(BACKUP_HOUR/MINUTE) 또는 MySQL binlog 설정(코드 외부)
- **수정 내용**: 빈도 상향 또는 binlog 기반 PITR 검토
- **테스트 방법**: 백업 산출물 주기 확인
- **위험도**: 낮음
- **우선순위**: P1

---

## P2 — 오픈 후 빠르게

### C1. orphan 파일 / 임시 이미지 정리
- **목적**: 삭제된 엔티티의 S3/로컬 잔존 파일 누적 방지
- **수정 파일 후보**: `app/utils/s3/s3_utils.py`, 정리 잡 신규(backup_scheduler 확장)
- **수정 내용**: DB에 없는 stored_name 파일 주기 정리 (안전장치 포함)
- **테스트 방법**: 더미 orphan 생성 후 정리 잡 검증
- **위험도**: 중간 (삭제 잡은 신중)
- **우선순위**: P2

### C2. 일반 첨부 이미지 최적화 적용 검토
- **목적**: 저장공간 증가 억제 (현재 VOC만 webp)
- **수정 파일 후보**: main.py 파일 업로드부
- **수정 내용**: 이미지 첨부에 한해 선택적 리사이즈/webp (정책 합의 후)
- **테스트 방법**: 업로드 전후 용량 비교
- **위험도**: 중간 (원본 보존 요구 충돌 가능)
- **우선순위**: P2

### C3. 로그/모니터링/헬스 알림
- **목적**: 운영 가시성 확보
- **수정 파일 후보**: 로깅 설정, 외부 모니터링(코드 외부)
- **수정 내용**: 앱 로그 파일/수집, 백업 성공·실패 알림
- **테스트 방법**: 강제 실패 유발 후 알림 확인
- **위험도**: 낮음
- **우선순위**: P2

---

## P3 — 장기 개선

### D1. `main.py` 모놀리식 분리 (라우터 모듈화)
- 9,300+ 라인 → 도메인별 router 분리. 위험 높아 충분한 테스트 동반. (P3)

### D2. 인메모리 세션 → 영속/Redis
- 현재 `SESSIONS` dict(24h TTL) → 재시작 시 세션 소실. Redis 등으로 이전. (P3)

### D3. S3 versioning / Object Lock / 시크릿 매니저
- 백업 삭제 방지 + 민감정보 관리 강화. (P3)

### D4. super_admin 정의 이중화 정리
- `environment.py SUPER_ADMIN_LOGINIDS`(env)와 `auth.py` 하드코딩 집합을 단일 출처로 통일. (P3)

---

## Claude Code 작업 단위 추천 (한 번에 너무 크지 않게)

| 차수 | 작업 | 포함 항목 | 예상 수정 범위 | 테스트 방법 |
|------|------|-----------|----------------|-------------|
| 1차 | **서버 시작/백업 안정화** | A1, A5 | `backup_scheduler.py` import 경로 / `dsllm_adapter.py` 확인 | 백업 수동 실행 + openai 미설치 기동 |
| 2차 | **VOC 이미지 저장/삭제 안정화** | C1(VOC 범위), 이미지 표시 점검 | main.py VOC 첨부부, s3_utils | 이미지 업로드/삭제/목록 표시 |
| 3차 | **Knox 검색 graceful handling** | B1 | knox_client.py, knox.py | KNOX_API_URL 오설정 테스트 |
| 4차 | **Widget Settings 공간 타입 분리** | B2 | HomePage.tsx, equipment 위젯 | purpose별 위젯 확인 |
| 5차 | **백업/복구 점검** | A4, B4 | runbook + env | 복구 리허설 |
| 6차 | **권한 체크 보강** | A2, A3, 권한 매트릭스 | main.py 엔드포인트 | 타 사용자 토큰 권한 우회 시도 |

> 각 차수는 **독립 PR**로 분리하고, 차수 시작 전 해당 영역만 재확인 후 진행하는 것을 권장합니다.
> CLAUDE.md 메모리 지침(최소 침습 + 단계화, 확장 우선, tsc + ast.parse 검증)에 부합하도록 작업합니다.

---

## 멀티모달 AI 요약(이미지 활용) 단계별 백로그 (2026-06-27 신설)

> 목표: **프로젝트 내부**(Task 설명/작업노트/Project Note/Task·Project 첨부)에 포함된 **이미지(차트·표·에러화면·캡처)** 를 AI 요약에 활용. **VOC 제외.**
> **이미지 분석은 바로 구현하지 않는다.** 먼저 이미지-텍스트 맥락을 구조화(`image_manifest`)하고, 좋은 vision 모델 확보 후 연결한다. 각 단계는 독립 검증 후 진행.
> 현재 구조: `PLAN_AI_SERVICE_STRUCTURE.md` 섹션 10(특히 10.5 구현분) / 리스크: `PLAN_AI_OPEN_RISK_REVIEW.md` 섹션 8.

### ⛔ 개발 원칙 (모든 Phase에 우선 적용)
1. 기존 텍스트 AI 요약 기능을 **절대 망가뜨리지 않는다.**
2. 이미지 분석은 **처음부터 기본 기능으로 넣지 않는다.**
3. 멀티모달 기능은 **optional / experimental**로 분리한다.
4. 모델이 **vision을 지원하지 않으면 이미지 분석 경로를 타지 않는다.**
5. **이미지 분석 실패가 전체 요약 실패로 이어지면 안 된다.**
6. **15초 이내 응답**을 목표로 한다. 초과 가능성 있으면 비동기/별도 실행 UX를 검토한다.
7. 품질 낮은 모델로 무리하게 통합 요약을 만들지 않는다.
8. 이미지 분석 결과는 텍스트 요약과 **구분해서 표시**한다.
9. **민감정보/권한/공개 VOC 리스크**를 반드시 고려한다.

### Phase 0 — 현재 상태 문서화 ✅(본 회차 완료)
- [x] 현재 텍스트 AI 요약 구조 확인 (`generate_report`/`ai-query`, text-only)
- [x] 현재 요약 대상 데이터 확인 (프로젝트/Task/작업노트, 첨부는 파일명 텍스트만)
- [x] 현재 첨부파일 저장 구조 확인 (S3 우선 + 로컬, VOC만 webp 최적화)
- [x] 현재 VOC 첨부 이미지 구조 확인 (`VocAttachment`, comment_scoped, stored_name 식별자)
- [x] 현재 모델 capability 확인 (LLM_MODEL_1~4, model_4만 "이미지 인식 가능" 라벨 — 실제 경로 없음)
- **산출물**: SERVICE_STRUCTURE 섹션 10, OPEN_RISK 섹션 8, 본 백로그.

### Phase 0.5 — 프로젝트 이미지-텍스트 맥락 구조화 기반 ✅(2026-06-27 구현)
> 이미지 인식 전에, 이미지가 어떤 Project/SubProject/Task/작업노트/설명/첨부와 연결되는지를 구조화. **LLM 미호출 / 기존 요약 무변경 / VOC 제외.**
- [x] `app/services/project_ai_context_builder.py` — `build_project_ai_context(...)` (LLM 미호출). `text_context` + `image_manifest` 생성
- [x] `image_manifest` source_entity_type: `task_description` / `task_activity` / `task_attachment` / `project_note` / `project_file` (VOC 미포함)
- [x] 인라인 이미지(`<img>`) 추출 + `nearby_text`(~400자 truncate, HTML 제거) + 저장 메타(stored_name→s3_key) 연결
- [x] `GET /api/projects/{id}/ai-context-preview?include_images=&max_images=` — LLM 미호출, `check_project_access` 권한, `not_used_by_llm:true`
- [x] DSLLM 모델 capability 메타(`vision_supported`/`experimental`) 추가 — 메타데이터 전용(실제 image call 미수행)
- [x] 보안: manifest에 이미지 바이트/`local_path`/raw URL 비노출, `include_images=False` 기본
- 위험도: 낮음(LLM/기존 경로 무변경) — py_compile + 인메모리 SQLite 단위검증 통과

### Phase 0.6 — Image Readability / AI-ready Image Layer ✅(2026-06-27 2차)
> 미래 vision 모델이 이미지를 잘 읽도록 **입력 이미지 품질/원본보존/variant 구조**를 판단·준비. 실제 이미지 파일은 열지 않고 수집 메타만으로 1차 판단. (업스케일/타일/blur 미구현 — 구조만)
- [x] `app/services/project_ai_image_readiness.py` 신설(`assess_image_quality`/`build_ai_image_variants`/`enrich_manifest_item`/`summarize_readiness`/`readiness_counts`)
- [x] manifest item에 `image_quality`(readability_status/recommended_for_ai/quality_notes/blur 구조) + `ai_image_variants`(original/preview/ai_readable/tiles) 추가
- [x] 판단 기준 상수 분리(`AI_IMAGE_MIN_WIDTH=800`/`MIN_HEIGHT=500`/`MIN_MEGAPIXELS=0.4`/`TINY_FILE=50KB`/`LARGE=8MP`)
- [x] `ai-context-preview`에 `image_readiness_summary` + counts(`ai_recommended_images`/`low_quality_images`/`missing_dimension_images`) 추가
- [x] **확인 결과**: 프로젝트 내부 이미지는 width/height 미저장 → 대부분 `missing_dimensions`(`status="unknown"`). 단 원본은 보존(`original.available=true`). dimension 메타만 부재.
- 위험도: 낮음(LLM/기존 경로 무변경) — readiness 단위검증 + 빌더 통합검증 통과

### Phase 0.7 — 업로드 메타 캡처 + variant 정책 + 버전/role hint ✅(2026-06-27 3차)
> 10.6 의 1순위 후속: readiness 의 "판단 재료"(width/height/hash) 수집. **DB 마이그레이션 없음**(sidecar 필드 추가). VOC 미수정.
- [x] `app/utils/image_meta.py` `compute_image_meta` 신설(Pillow, 비이미지/미설치 graceful)
- [x] 업로드 시 `width/height/sha256/format` 저장: `tasks/{id}/files`, `projects/{id}/files`, `spaces/{id}/images`(content_type도 추가)
- [x] manifest item에 `content_hash`(sha256)+`format` 추가 → 중복/재분석 캐시 기반
- [x] `app/services/ai_image_storage_policy.py` — original/preview/ai_readable/tile 경로 상수화(`key`=hash 우선), **파일 미생성**, `planned_storage_path` 부여
- [x] preview 응답에 `context_schema_version`/`image_manifest_version`/`readiness_version` + `variant_storage_policy`
- [x] `image_role` 약한 hint(chart/table/error_screen/... + source + confidence low/none)
- [x] **효과**: 신규 업로드 이미지는 readiness 가 실제 판정(missing_dimensions 탈출). 기존 레코드는 재업로드 시 보강.
- 위험도: 낮음(업로드 dict에 메타 추가 + 빌더 additive) — image_meta/builder/policy 단위·통합검증 통과

### Phase 0.75 — 이미지 분석 결과 캐시 리스크 방지(versioned attempt 구조) ✅(2026-06-27 4차)
> 방향: "분석 결과 캐시"가 아니라 **"분석 시도 이력 + 재분석 가능 구조"**. 메타는 캐시 OK, 의미 해석은 정답 캐시 금지. DB 미구현(설계만).
- [x] `app/services/project_ai_analysis_policy.py` 신설(버전 상수 단일 출처 + `attach_analysis_metadata`/`summarize_analysis_policy`)
- [x] manifest item에 `analysis_reuse_policy`(semantic 캐시 금지) + `analysis_identity`(fingerprint/3 hash/`semantic_cache_key_preview`) + `reanalysis_triggers`(11종)
- [x] cache key = image_fingerprint + model + prompt + schema version + nearby/task/project context **hash 조합**(image_hash 단독 금지). 원문 미포함(sha256만)
- [x] preview 응답에 `analysis_policy_summary` + `future_image_analysis_prompt_version`
- [x] **`ImageAnalysisAttempt` 향후 DB 설계 문서화**(SERVICE_STRUCTURE 10.8) — 이력 보존/최신정답 단정 금지/재분석 트리거
- [x] OPEN_RISK D-3 + M8(오해석 영구 캐시) 추가
- [x] 검증: 맥락(프로젝트 설명) 변경 시 `semantic_cache_key_preview` 변동(재분석 유도), 원문 미포함, image_hash null도 stable fingerprint
- 위험도: 낮음(정책/식별자 메타 additive, 분석 미구현)

### Phase 0.85 — ImageAnalysisAttempt DB + 재분석 API (미구현, vision 모델 확보 후)
- [ ] `ImageAnalysisAttempt` 테이블 신설(이력) — status/result/confidence/is_current_candidate/invalidated_reason
- [ ] semantic_cache_key 로 attempt 조회 + 맥락 변경 시 재분석
- [ ] 사용자 "이미지 다시 분석" 요청 경로(낮은 confidence/피드백 포함)
- 위험도: 중간(DB 마이그레이션 동반) → 모델 확보 + 권한/민감정보 검토 후

### Phase 0.8 — super_admin용 manifest inspector (프론트, 미구현 P2)
- [ ] AI Report/프로젝트 설정 내부에 **super_admin·개발자 전용** "AI Context Preview" 디버그 버튼
- [ ] `ai-context-preview` 결과(텍스트/이미지별 readiness/연결 Task·작업노트/warnings) 시각화
- [ ] 일반 사용자 미노출. FE 검증은 `npm run type-check`(이 환경 build 크래시)
- 위험도: 낮음(읽기 전용 디버그 UI) — 단 FE 탐색 필요

### Phase 0.9 — 실제 이미지 전처리 (미구현, 모델 확보 후)
- [ ] 업스케일 / tile 분할 / `blur_score`(Pillow/OpenCV Laplacian variance) 실제 파일 생성
- [ ] variant 파일 생성 후 `ai_image_variants.*.available=true` 갱신
- 위험도: 중간(스토리지/잡 동반) → 정책(Phase 0.7) 위에서 단계 진행

### Phase 1 — 안전한 구조 분리 (코드 변경 시작점)
- [ ] 기존 텍스트 요약 기능을 **기본 경로로 고정** (이미지 미사용 시 흐름 무변경 보장) — *현재 report/ai-query 무변경 유지 중*
- [ ] 이미지 분석 기능을 **feature flag로 분리** (예: env `MULTIMODAL_SUMMARY_ENABLED=false` + 요청 파라미터)
- [x] **모델 capability 체크 추가** (`text-only` / `vision-supported` 메타 구조화 — `_MODEL_DESCRIPTIONS` 라벨을 capability 데이터로 승격, Phase 0.5에서 구현)
- [ ] vision 미지원 모델에서는 **이미지 분석 버튼/옵션 비활성화**(프론트) + 백엔드 거부
- [ ] **이미지 분석 실패 시 텍스트 요약만 반환**(이미지 단계 try/except 격리)
- 수정 후보: `app/llm/dsllm_adapter.py`(timeout), `main.py`(분기), 프론트 AI 옵션 UI
- 위험도: 중간(어댑터 변경) → text-only 회귀 테스트 필수

### Phase 2 — 이미지 분석 PoC
- [ ] **프로젝트 내부 이미지 1~3개만** 대상으로 제한 (`image_manifest`에서 `ai_eligible` 우선 선별)
- [ ] 이미지 크기 제한 (기존 인라인 이미지/첨부 업로드 정책 재사용)
- [ ] **이미지 단계 독립 timeout** 제한
- [ ] 분석 결과를 **별도 field로 반환**(기존 요약과 병합 금지)
- [ ] 별도 섹션으로 표시 — 예: **"첨부 이미지 참고 요약"**
- [ ] **선결**: DSLLM 게이트웨이가 `image_url` content를 실제 수용하는지 PoC (OPEN_RISK M2). 전달은 `text_context` + `image_manifest` + 인가된 이미지 파일
- 위험도: 중간 / 효과: 기능 가능성 검증

### Phase 3 — 품질 검증
- [ ] 테스트 데이터 구성: 차트 / 표 / 에러화면 / 회의자료 캡처 / 텍스트 많은 이미지 / 저품질 캡처
- [ ] 검증 항목: 정확도 / 응답시간(15s 목표) / 실패율 / 신뢰 가능한 표현인지 / 잘못된 수치 해석 여부 / **기존 텍스트 요약 품질 저하 여부**
- 위험도: 낮음(평가) — 단 합격 기준 미달 시 Phase 4 진행 보류

### Phase 4 — 제한적 운영 반영
- [ ] **관리자 또는 특정 공간/프로젝트에서만 ON**
- [ ] 사용자에게 **"이미지 분석은 실험 기능" 안내**
- [ ] 텍스트 요약은 **항상 기본 제공**, 이미지 분석은 **선택 기능**
- [ ] **선결**: 프로젝트 첨부/이미지 분석 경로 **project_id 권한 검증** 보강(요청자 접근 권한, OPEN_RISK D). VOC 는 대상 아님
- [ ] `ai-context-preview`/`image_manifest`는 **super_admin·개발자용으로만 노출**(일반 사용자 UI 미노출)
- 위험도: 중간(노출 범위) — 권한 게이팅 필수

### Phase 5 — 고도화
- [ ] **이미지 분석 캐시**(같은 이미지 재분석 방지) — `image_manifest`의 `storage_ref`(attachment_id/stored_name) 기반 키, 중간 저장 테이블 신규 검토(DB 마이그레이션 동반)
- [ ] 이미지 분석 결과 재사용
- [ ] 여러 이미지 요약
- [ ] 이미지 + 작업노트 + Task 맥락 **통합 요약**(`text_context` + `image_manifest` + 인가 이미지, 품질 충분한 모델 확보 후)
- [ ] 모델별 성능 비교 + **더 좋은 vision 모델로 교체 가능한 구조**(capability 메타 활용)
- 위험도: 높음(통합 요약·DB 변경) → 마지막 단계, 충분한 검증 후

### 멀티모달 작업 단위 추천 (한 번에 너무 크지 않게)
| 차수 | Phase | 핵심 작업 | 선결 리스크 |
|------|-------|-----------|-------------|
| M-0 | Phase 0.5 | ✅ Context Builder + `image_manifest` + `ai-context-preview` + capability 메타 (구현 완료) | - |
| M-1 | Phase 1 | feature flag + 텍스트 경로 고정 (capability 체크는 M-0 완료) | M1 |
| M-2 | Phase 2 | DSLLM image PoC + **프로젝트 내부 이미지 1~3장** 별도 섹션 반환 | M2, M3 |
| M-3 | Phase 3 | 품질/속도/회귀 검증 | M4 |
| M-4 | Phase 4 | project_id 권한 게이팅 + 제한 운영(super_admin·특정 프로젝트) | M5, M7 |
| M-5 | Phase 5 | 캐시/통합요약/모델 교체 구조 | M7 |

> **Readiness 기준 보정 (2026-06-28, M-3 선행)**: inspector UI 구현 전, **사용자 캡처 패턴(compact crop)** 에 맞게 readiness 판단 기준을 보정.
> - [x] `compact_text_crop`/`small_but_readable`/`partial_screen_capture`/`too_small_for_text` status 추가
> - [x] `recommendation_level`(recommended/conditional/not_recommended/unknown) 도입 — compact crop 은 conditional(=recommended_for_ai true, 검증 필요 표기)
> - [x] compact crop 휴리스틱(상수 분리: COMPACT_CROP_MIN_WIDTH/HEIGHT/ASPECT_RATIO, TINY_WIDTH/HEIGHT)
> - [x] image_role object 통일(source/confidence 항상 부여) + 신규 role(text_crop/document_crop/partial_screen_capture/note_capture) + aspect_ratio_heuristic
> - [x] `ai_image_variants.recommended_action=use_original_conditional`(compact crop 타일링 불필요)
> - [x] `image_readiness_summary` 확장(compact_text_crop/small_but_readable/partial_screen_capture/conditional_for_ai), `nearby_text` fallback + `context_text_source`
> - [x] 6개 샘플 테스트 개선 전/후 확인 — 작은 crop 이 더 이상 무조건 not_recommended 가 아님(단 진짜 too-small/unsupported 는 유지)
> - 불변: AI Report/Query, 작업노트 UX, vision/OCR, DB 마이그레이션 없음, VOC 제외
> - **다음**: super_admin inspector UI(original_size/display_size/ai_input_strategy 노출), DSLLM image PoC

> **이번 회차에서 한 것**: 프로젝트 이미지-텍스트 맥락 구조화 기반 — `project_ai_context_builder`(LLM 미호출), `GET /api/projects/{id}/ai-context-preview`(LLM 미호출), DSLLM capability 메타(additive). VOC 제외.
> **이번 회차에서 하지 않은 것**(의도적): 실제 이미지(바이트) 모델 전달, 기존 `report/generate`·`ai-query` 동작/응답 형식 변경, 이미지 분석 결과의 텍스트 요약 병합, DB 마이그레이션, 일반 사용자 실험 UI 노출.

## Image Evidence Card + Inspector 고도화 (완료분)

> **이번 회차에서 한 것**: 낮은 성능 모델 대응 evidence 구조화.
> - `app/services/project_ai_evidence.py`(evidence-card-v1): role→extraction_target / role→model_instruction_key / role별 instruction 템플릿 / `context_strength`(strong/medium/weak/none) / `quality_warning`. manifest item 에 `evidence_card` 부여(이미지 바이트/경로 미포함).
> - `image_role` 세분화: command_snippet/code_snippet/log_capture/terminal_capture/config_capture/document_table/process_flow 추가(과분류 방지 위해 generic 단어 제외).
> - `ai-context-preview` `image_scope` 확장: review_needed/all/recommended/conditional/not_recommended/warnings/fallback_context/low_confidence(서버 필터, summary 는 전체 기준). max_images 서버 상한(기본 50/최대 100) 유지.
> - 단일 이미지 lazy preview endpoint(`/ai-context-preview/image?image_id=`) 유지 — 1장 단위, 경로/키 미노출, Cache-Control private max-age=300.
> - Inspector(super_admin): 기본 "검토 필요만" + Evidence Card 섹션(context_strength/extraction_target/model_instruction_key/quality_warning/ai_input_strategy + instruction preview 접기/펼치기) + Quick Filter(Context 약함/명령어·코드·로그/에러 화면/표·차트/설비 화면/모델 지시 필요) + 필터(context_strength/extraction_target/model_instruction_key).
>
> **검증(project_id=1 6샘플)**: chart→trend_summary/analyze_chart_conservatively, table→table_structure/extract_table_carefully, meeting_slide→slide_summary, error_screen→error_diagnosis/extract_error_and_next_action, 493x74 명령어 캡처(nearby 없음)→**text_crop/low/context_strength=weak**(OCR 없이 command_snippet 강제 단정 안 함, nearby/same_entity 에 명령어 키워드 있으면 command_snippet).
>
> **이번 회차에서 하지 않은 것**(의도적): vision/OCR 호출, 이미지 분석 결과 저장, AI Report 이미지 요약, DB 마이그레이션, 작업노트 UX 변경, VOC 포함, 전체 이미지 일괄 조회.
> **다음**: 업로드 시 display_size 캡처, preview 요청 system event log, DSLLM image PoC(evidence_card 기반 role별 프롬프트 분기).

## Model Compatibility Layer (Model Input Adapter) — 완료분

> **이번 회차에서 한 것**: `image_manifest`/`evidence_card` → 사내 모델 API 입력 패킷 변환 중간 계층.
> - `app/services/project_ai_model_compatibility.py`(project-ai-model-input-v1): `build_model_input_packet()` / `ROLE_INSTRUCTION_MAP` / `ROLE_OUTPUT_SCHEMA_HINT`(+공통 schema) / `GLOBAL_RULE`(충돌 방지) / `safety_policy`. **Evidence Card 는 힌트** → `image_role`→`image_role_hint`, `role_confidence`/`context_strength` 동반, role_confidence low 면 role_instruction 에 저신뢰 경고 삽입.
> - provider adapter: `BaseModelInputAdapter`→`GenericVisionAdapter`(messages 형) / `DSLLMVisionAdapter`(placeholder), `build_provider_payload(packet, provider)`. 실제 API 스펙 확정 시 어댑터만 수정.
> - A/B/C `input_mode`: image_only / image_with_nearby_text / image_with_evidence_card.
> - endpoint: `GET /api/projects/{id}/ai-context-preview/model-packet`(super_admin 전용, image_id 1개 단위, manifest 존재 검증, provider/input_mode query). 응답: packet + provider_payload, **image binary/base64/storage path 미포함**(image_ref=image_id 중심).
> - Inspector Drawer: "🔌 Model Compatibility Preview"(provider/input_mode 선택 + Model Packet 생성 버튼 + image_role_hint/role_confidence/context_strength/extraction_target/model_instruction_key/global_rule/role_instruction/output_schema_hint/provider_payload JSON + Model Packet/Provider Payload JSON 복사).
>
> **검증(project_id=1)**: text_crop(task_activity:461:image:0, nearby 없음)→ image_role_hint=text_crop / role_confidence=low / context_strength=weak / extraction_target=text_lines / model_instruction_key=extract_text_crop / metadata_is_hint_only=true / visible_content_first=true. error_screen→error_diagnosis/extract_error_and_next_action(+error_message/file_or_location/possible_causes/next_actions schema). chart→trend_summary/analyze_chart_conservatively(정확수치 단정 금지 instruction). table→table_structure/extract_table_carefully.
>
> **이번 회차에서 하지 않은 것**(의도적): 실제 DSLLM/Vision/OCR 호출, AI Report 이미지 요약, ImageAnalysisAttempt 저장, DB 마이그레이션, `report/generate`·`ai-query` 변경, 일반 사용자 화면 변경, VOC 포함.
> **다음**: 사내 모델 API 스펙 확인(체크리스트 — OPEN_RISK_REVIEW S 섹션 1~12), DSLLMVisionAdapter 실 payload 확정, A/B/C 실측(이미지만 vs +nearby vs +Evidence Card), 모델 결과 confidence/uncertainty 수집.

---

## 최신 코드 기준 업데이트

### 확인 일자
- 2026-07-09 (`main` HEAD `21dedee`)

### 최근 추가/변경된 기능 (백로그 반영)
- **알림 발송(A-notify)**: 문서 하단 "미구현" 전제가 해소됨. `MAIL_PROVIDER=knox_api` 실발송 + `notification_processor`(APScheduler, pending→processing 가드 UPDATE) 구동. 멘션(댓글/작업노트) + VOC 답변 메일(관리자 opt-in). 사용자별 on/off(`user_notification_preferences`) + `GET/PATCH /api/users/me/notification-preferences` UI 존재. → 남은 과제: 재시도/백오프/데드레터 정책, Knox Gateway host/인증 확정.
- **AI Provider(멀티모달 백로그 연장선)**: DSLLM/OpenAI provider 라우터(`app/llm/router.py`) + Vision Report **PoC**(super_admin 전용 `vision-test`)까지 도달. 일반 Report/Query 경로는 여전히 text-only(원칙 유지). 멀티모달 Phase 0~5 중 "기반 구조화(context builder/manifest/evidence/model-packet)" 는 구현, "실제 vision 파이프라인 통합"은 미착수.
- **커스텀 워크플로우/체크포인트/자동이동**, **Task Parent-Child**, **Task move**, **TBD 일정**, **실시간 SSE**, **VOC 공감/댓글/통계**, **공간 lifecycle**, **system_event_logs 운영로그** 신규 구현 완료.

### 미해결/이월 P0·P1 (재확인)
- **A2 권한 `user_id` 쿼리 의존 제거**: 여전히 미착수(다수 엔드포인트 잔존, P0 유지). 신규 라우트(VOC vote/comment 등)도 동일 패턴 확산 여부 재감사 필요.
- **A1 백업 import 교정**: 코드상 완료, 사내 서버 실제 백업 1회 동작 확인만 남음.
- **A3 CORS 화이트리스트**: env 확정 필요(코드 fallback `["*"]` 잔존).

### Workflow Intelligence 설계 시 연결 가능한 지점
- 신규 업무 흐름 로그(`ProjectProcessEvent`)·AI 사용 로그(`AIAssistLog`) 는 이 백로그의 "멀티모달/AI 고도화" 및 "운영 관측성" 흐름과 정합. 상세: `docs/PLAN_AI_WORKFLOW_INTELLIGENCE_DATA_ARCHITECTURE.md`.

### 확인 필요
- 멀티모달 Phase 진행 시 A2(권한) 선결 여부 재확인.
