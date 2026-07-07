-- ============================================================
-- 트러블슈팅 가이드 (알람/인터락 조치 가이드) - Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS cmp_guide
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE cmp_guide;

-- 기존 구조 제거 (있는 경우)
DROP TABLE IF EXISTS troubleshooting_step_images;
DROP TABLE IF EXISTS troubleshooting_steps;
DROP TABLE IF EXISTS troubleshooting_guides;
DROP TABLE IF EXISTS alarm_guides;
DROP TABLE IF EXISTS interlock_guides;

-- ------------------------------------------------------------
-- 1. troubleshooting_guides
--    설비모델별 알람/인터락 조치 가이드 (기본 정보)
-- ------------------------------------------------------------
CREATE TABLE troubleshooting_guides (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  guide_type      ENUM('ALARM','INTERLOCK') NOT NULL,
  equipment_model VARCHAR(100) NOT NULL,
  process_area    VARCHAR(100) NULL,
  code            VARCHAR(100) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  summary         TEXT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_guide_type_model_code (guide_type, equipment_model, code),
  KEY idx_guide_type (guide_type),
  KEY idx_guide_model (equipment_model),
  KEY idx_guide_process_area (process_area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. troubleshooting_steps
--    가이드별 단계(Step) 카드
-- ------------------------------------------------------------
CREATE TABLE troubleshooting_steps (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  guide_id           INT NOT NULL,
  step_order         INT NOT NULL,
  step_title         VARCHAR(300) NULL,
  description        TEXT NULL,
  decision_question  TEXT NULL,
  normal_label       VARCHAR(100) NOT NULL DEFAULT '정상 / 조치 완료',
  normal_result_text TEXT NULL,
  next_label         VARCHAR(100) NOT NULL DEFAULT '추가 판단 필요',
  next_step_order    INT NULL,
  caution            TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_step_guide (guide_id),
  CONSTRAINT fk_step_guide FOREIGN KEY (guide_id)
    REFERENCES troubleshooting_guides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. troubleshooting_step_images
--    Step별 첨부 이미지
-- ------------------------------------------------------------
CREATE TABLE troubleshooting_step_images (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  step_id           INT NOT NULL,
  image_url         VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NULL,
  sort_order        INT NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_image_step (step_id),
  CONSTRAINT fk_image_step FOREIGN KEY (step_id)
    REFERENCES troubleshooting_steps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. import_jobs
-- ------------------------------------------------------------
DROP TABLE IF EXISTS import_jobs;
CREATE TABLE import_jobs (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  import_type   ENUM('ALARM','INTERLOCK') NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  total_rows    INT NOT NULL DEFAULT 0,
  success_rows  INT NOT NULL DEFAULT 0,
  failed_rows   INT NOT NULL DEFAULT 0,
  created_rows  INT NOT NULL DEFAULT 0,
  updated_rows  INT NOT NULL DEFAULT 0,
  error_summary TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
