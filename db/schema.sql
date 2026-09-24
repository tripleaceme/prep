-- ===========================================================================
-- Prep — MySQL / MariaDB schema  (go54 cPanel)
--
-- Import via phpMyAdmin, or:
--   mysql -u USER -p DBNAME < db/schema.sql
--
-- Scope note: this database holds NO AI credentials and NO billing tables.
-- Interviews run in the browser against the user's own Gemini key, so there is
-- nothing to meter and no interview content on our servers.
-- ===========================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- users
--
-- Sign-in is email + password. `password_hash` holds the output of PHP's
-- password_hash() — never the password itself. `email_verified_at` is unused
-- at launch and reserved for confirmation emails later.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                CHAR(36)     NOT NULL,
  email             VARCHAR(255) NOT NULL,
  email_verified_at DATETIME     NULL,
  password_hash     VARCHAR(255) NOT NULL,
  display_name      VARCHAR(120) NULL,
  -- Path to an uploaded avatar, relative to the API root. Images are resized
  -- and re-encoded in the browser before upload, so this never holds anything
  -- larger than a small square.
  avatar_url        VARCHAR(255) NULL,

  -- Onboarding answers (steps 1-4); NULL until onboarding completes.
  career_stage  ENUM('student','early','mid','senior','switching') NULL,
  employer_type ENUM('big','startup','midsize','public','any')     NULL,
  goal          ENUM('first_job','switch_job','grow','upcoming_interview') NULL,
  field         ENUM('analytics_engineering','data_engineering','analytics_bi','data_science','other') NULL,
  onboarded_at  DATETIME NULL,

  -- Derived progress, maintained by the activity endpoint.
  readiness       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  current_streak  INT UNSIGNED     NOT NULL DEFAULT 0,
  longest_streak  INT UNSIGNED     NOT NULL DEFAULT 0,
  last_active_on  DATE             NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- auth_tokens — reserved for "forgot password"
--
-- Unused at launch, but created now so adding password reset later needs no
-- migration. Only the SHA-256 hash of a token is ever stored, so a leaked
-- database cannot be used to reset anyone's password.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         CHAR(36)    NOT NULL,
  user_id    CHAR(36)    NOT NULL,
  token_hash CHAR(64)    NOT NULL,
  purpose    ENUM('password_reset','email_verify') NOT NULL DEFAULT 'password_reset',
  expires_at DATETIME    NOT NULL,
  used_at    DATETIME    NULL,
  request_ip VARBINARY(16) NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY ix_auth_tokens_user (user_id, purpose),
  KEY ix_auth_tokens_expiry (expires_at),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- interviews — one row per session started
--   'ai'   = AI Interview (role, job post, or CV supplied by the user)
--   'mock' = Mock Interview (a fixed data-domain track)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interviews (
  id              CHAR(36) NOT NULL,
  user_id         CHAR(36) NOT NULL,
  kind            ENUM('ai','mock') NOT NULL,
  track           VARCHAR(48) NULL,
  source          ENUM('role','job_post','cv') NULL,
  role_title      VARCHAR(200) NULL,
  job_description MEDIUMTEXT   NULL,
  focus           VARCHAR(500) NULL,
  stage           VARCHAR(48)  NULL,
  status          ENUM('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  question_count  TINYINT UNSIGNED NULL,
  started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME NULL,

  PRIMARY KEY (id),
  KEY ix_interviews_user (user_id, started_at DESC),
  CONSTRAINT fk_interviews_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- reports — the feedback artefact produced when an interview completes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id               CHAR(36) NOT NULL,
  interview_id     CHAR(36) NOT NULL,
  user_id          CHAR(36) NOT NULL,
  overall_score    TINYINT UNSIGNED NULL,
  -- The understanding ladder carried over from the current app.
  understanding    ENUM('surface','working','strong') NULL,
  summary          TEXT NULL,
  strengths        JSON NULL,
  knowledge_gaps   JSON NULL,
  topics_to_review JSON NULL,
  transcript       JSON NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reports_interview (interview_id),
  KEY ix_reports_user (user_id, created_at DESC),
  CONSTRAINT fk_reports_interview FOREIGN KEY (interview_id)
    REFERENCES interviews (id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- coding_attempts — progress on SQL and pipeline problems
-- One row per (user, problem); re-solving updates in place.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coding_attempts (
  id           CHAR(36) NOT NULL,
  user_id      CHAR(36) NOT NULL,
  problem_slug VARCHAR(96) NOT NULL,
  status       ENUM('attempted','solved') NOT NULL DEFAULT 'attempted',
  language     VARCHAR(24) NOT NULL DEFAULT 'sql',
  code         MEDIUMTEXT NULL,
  solved_at    DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_coding_user_problem (user_id, problem_slug),
  CONSTRAINT fk_coding_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- activity_days — powers the streak counter and the contribution blocks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_days (
  user_id    CHAR(36) NOT NULL,
  day        DATE     NOT NULL,
  interviews SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  problems   SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  PRIMARY KEY (user_id, day),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
