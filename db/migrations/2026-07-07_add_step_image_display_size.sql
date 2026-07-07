-- ============================================================
-- troubleshooting_step_images 에 표시 크기(display size) 컬럼 추가
-- 등록/수정 화면에서 마우스로 조절한 이미지 표시 크기를 저장한다.
--
-- 기존 DB 에 이미 troubleshooting_step_images 테이블이 있는 경우
-- 이 스크립트를 한 번 실행하세요. (AUTO_CREATE_TABLES 는 기존 테이블을
-- 변경하지 않으므로 컬럼 추가는 수동으로 해야 합니다.)
-- ============================================================
USE cmpbeol;

ALTER TABLE troubleshooting_step_images
  ADD COLUMN display_width  INT NULL AFTER original_filename,
  ADD COLUMN display_height INT NULL AFTER display_width;
