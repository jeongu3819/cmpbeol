-- ============================================================
-- 설비 알람/인터락 조치 가이드 관리 - Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS cmp_guide
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE cmp_guide;

-- ------------------------------------------------------------
-- 1. alarm_guides
-- ------------------------------------------------------------
DROP TABLE IF EXISTS alarm_guides;
CREATE TABLE alarm_guides (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  equipment_name    VARCHAR(100) NULL,
  equipment_model   VARCHAR(100) NULL,
  process           VARCHAR(100) NULL,
  area              VARCHAR(100) NULL,
  alarm_code        VARCHAR(100) NOT NULL,
  alarm_name        VARCHAR(300) NOT NULL,
  alarm_description TEXT NULL,
  severity          ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  category          VARCHAR(100) NULL,
  cause             TEXT NULL,
  check_points      TEXT NULL,
  action_method     TEXT NULL,
  action_steps      TEXT NULL,
  caution           TEXT NULL,
  related_parts     TEXT NULL,
  owner_team        VARCHAR(100) NULL,
  tags              JSON NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_alarm_model_code (equipment_model, alarm_code),
  KEY idx_alarm_model (equipment_model),
  KEY idx_alarm_process (process),
  KEY idx_alarm_severity (severity),
  KEY idx_alarm_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. interlock_guides
-- ------------------------------------------------------------
DROP TABLE IF EXISTS interlock_guides;
CREATE TABLE interlock_guides (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  equipment_name       VARCHAR(100) NULL,
  equipment_model      VARCHAR(100) NULL,
  process              VARCHAR(100) NULL,
  area                 VARCHAR(100) NULL,
  interlock_code       VARCHAR(100) NOT NULL,
  interlock_name       VARCHAR(300) NOT NULL,
  interlock_description TEXT NULL,
  severity             ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'HIGH',
  category             VARCHAR(100) NULL,
  trigger_condition    TEXT NULL,
  cause                TEXT NULL,
  check_points         TEXT NULL,
  action_method        TEXT NULL,
  action_steps         TEXT NULL,
  reset_condition      TEXT NULL,
  caution              TEXT NULL,
  related_parts        TEXT NULL,
  owner_team           VARCHAR(100) NULL,
  approval_required    BOOLEAN NOT NULL DEFAULT FALSE,
  tags                 JSON NULL,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_interlock_model_code (equipment_model, interlock_code),
  KEY idx_interlock_model (equipment_model),
  KEY idx_interlock_process (process),
  KEY idx_interlock_severity (severity),
  KEY idx_interlock_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. import_jobs
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
