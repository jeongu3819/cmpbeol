# Notification / Knox Mail 연동 TODO

작성일: 2026-07-02

> **업데이트 (2026-07-06):** `MAIL_PROVIDER=knox_api` 실제 발송이 구현되었다
> (`backend/app/services/mail_sender.py` `_send_knox_api`). Knox Mail API
> `/mail/api/v2.0/mails/send?userId={loginid}` 를 multipart(mail part)로 호출한다.
> 기본값은 여전히 `disabled` 이며 env(`KNOX_MAIL_API_BASE_URL`/`KNOX_MAIL_USER_ID`/
> `KNOX_MAIL_SENDER_EMAIL`)를 명시했을 때만 동작한다. 남은 확인: API Gateway host 주소,
> 인증 방식(none/bearer) 확정, 발송 성공 시 `mailId` 는 로그만 남고 DB 미저장.

아래는 초기(2026-07-02) 기준 기록이다. 당시에는 알림 이벤트를 DB(outbox)에 남기는 구조까지만
준비했고, Knox 메일·메신저 실제 발송은 미구현 상태였다.

---

## 현재 구현된 것

- **Task Comment CRUD**
  - `GET/POST/PATCH/DELETE /api/tasks/{task_id}/comments`
  - soft delete(`deleted_at`), 작성자/관리자 권한 검증, HTML sanitize.
- **@멘션 저장 구조**
  - 댓글 본문의 `@loginid` / `@username` 을 파싱해 `task_comment_mentions` 에 저장.
  - 멘션 자동완성 UI 는 미구현(텍스트 `@` 입력 기반). — 2차 고도화 대상.
- **Notification event 기반 (outbox)**
  - `notification_events` 테이블에 이벤트 row 만 적재. **실제 발송은 하지 않는다.**
  - 이벤트 타입:
    - `task_comment_created` — 댓글 작성 시 Task 담당자 대상 (작성자 본인 제외).
    - `task_comment_mentioned` — 댓글에 멘션된 사용자 대상.
  - 중복 방지: 같은 comment 에서 같은 `target_user_id` 에게는 이벤트 1건만 생성
    (멘션이 담당자보다 우선). 작성자 == 대상이면 skip.
  - `status` 는 항상 `pending` 으로 남는다 (`skipped` / `sent` / `failed` 는 향후 worker 가 사용).
- **사용자별 알림 on/off 설정 (구조만)**
  - `user_notification_preferences` 테이블 준비
    (`task_comment_email_enabled`, `task_mention_email_enabled`, 기본 true).
  - **설정 UI 및 실제 발송 시 참조 로직은 미구현.**

### 관련 파일
- Backend
  - `backend/app/models.py` — `TaskComment`, `TaskCommentMention`, `NotificationEvent`, `UserNotificationPreference`
  - `backend/app/services/notifications.py` — `create_notification_event()` outbox helper
  - `backend/main.py` — comment CRUD 엔드포인트 + 이벤트 생성 호출
- Frontend
  - `frontend/src/components/TaskCommentsSection.tsx`
  - `frontend/src/api/client.ts` — comment API

---

## 추후 해야 할 것 (발송 연동)

1. **Knox Mail API 인증 방식 확인**
   - 인증 토큰/서비스 계정/발신자 정책, 사내 승인 절차 확인.
2. **Knox Messenger Bot 또는 Mail 발송 endpoint 확인**
   - 이미 `backend/app/services/knox_messenger_service.py` 가 존재하며,
     작업노트(TaskActivity) 멘션에 대해 Knox Messenger 발송을 수행 중이다.
     → **이 서비스를 notification_events 소비 worker 의 sender adapter 로 재사용**하는 것을 우선 검토.
3. **발송 worker / scheduler 구현**
   - `notification_events` 에서 `status='pending'` 을 주기적으로 읽어 발송하고
     `sent` / `failed` / `skipped` 로 갱신, `processed_at` 기록.
   - `user_notification_preferences` 를 확인해 off 인 대상은 `skipped` 처리.
4. **사용자별 on/off 설정 UI 구현**
   - 프로필/설정 화면에서 `task_comment_email_enabled` / `task_mention_email_enabled` 토글.
5. **실패 재시도 정책 구현**
   - 재시도 횟수/백오프/데드레터 정책은 사내 발송 API 특성 확인 후 결정 (지금은 추측 구현 금지).

---

## 하지 않은 것 (의도적 보류)

- Knox 메일 실제 발송 구현
- 메일 API endpoint / API Key / 토큰 하드코딩
- 임의 SMTP 구현
- 실패 재시도 등 운영 로직의 추측성 구현

---

## 최신 코드 기준 업데이트

### 확인 일자
- 2026-07-09 (`main` HEAD `21dedee`)

### 최근 추가/변경된 기능 — "미구현" 항목 대부분 해소
- **발송 worker/scheduler 구현됨**: `backend/app/services/notification_processor.py` (`BackgroundScheduler`, `NOTIFICATION_PROCESSOR_INTERVAL_SECONDS` 기본 60s). `notification_events` 의 `status='pending'` 을 주기적으로 소비 → `sent`/`skipped`/`failed` + `processed_at` 기록. `pending→processing` 가드 UPDATE 로 이중 처리 방지(멀티 worker 안전).
- **메일 adapter 구현됨**: `backend/app/services/mail_sender.py` — `MAIL_PROVIDER` = `disabled`(기본)/`mock`/`smtp`/`knox_api`. knox_api 는 `/mail/api/v2.0/mails/send?userId=` multipart(mail part) 호출, 성공 시 `mailId` 를 `notification_events.payload_json.mail_id` 에 저장(기존 문서 "mailId DB 미저장" → **저장으로 변경됨**).
- **메일 템플릿**: `backend/app/services/mail_templates.py` (`build_mention_email`, `build_voc_reply_email`, `build_mention_url`, `build_voc_url`). HTML 본문 복사-붙여넣기 폴백 링크 포함.
- **처리 이벤트 타입 확장**: `task_comment_mentioned`, **`task_work_note_mentioned`(작업노트 멘션)**, **`voc_reply_created`(VOC 답변, 관리자 opt-in)**. 각기 발송 조건 분기.
- **발송 게이트(멘션)**: provider≠disabled AND target.mail 존재 AND master+세부 pref=true AND actor≠target(또는 `NOTIFICATION_ALLOW_SELF_MENTION`) AND payload.send_email=true AND `can_access_task`. VOC 답변은 pref/접근권한/self 체크 없이 opt-in + 수신자 이메일만.
- **사용자 on/off UI 구현됨**: `user_notification_preferences`(`mention_email_enabled` master + `task_mention_email_enabled`/`work_note_mention_email_enabled`/`task_comment_email_enabled`) + `GET/PATCH /api/users/me/notification-preferences`.
- **운영 진단 API**: `GET /api/admin/notifications/diagnostics`, `POST /api/admin/notifications/process-now`.

### 남은 확인/과제
- Knox Mail API Gateway host 주소, 인증 방식(none/bearer) 최종 확정.
- 실패 재시도/백오프/데드레터 정책(현재 단발 시도 후 `failed` 고정).
- `task_comment_created`(담당자 댓글 알림)용 `task_comment_email_enabled` 는 컬럼만 존재, 발송 미연결(예약).

### Workflow Intelligence 연결
- `notification_events` 는 **알림 outbox 역할**로 유지하고, 업무 흐름 분석은 별도 `ProjectProcessEvent` 로 분리(발송 성공/실패는 outcome 신호로만 참조).
