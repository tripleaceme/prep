-- 003: keep a history of CV revamps, the way AI interviews are kept.
--
-- The revamped CV is stored in full rather than regenerated on demand. A
-- rewrite is not deterministic — asking the model again with the same inputs
-- gives a different CV — so "history" that reproduced it would be showing you
-- something you never saw. It also means opening an old revamp costs nothing
-- and needs no API key.
--
-- Note what this holds: the rewritten CV, which is personal data. It is
-- covered by the same cascade as everything else, so deleting an account
-- removes it, and the clear-history endpoint removes it on request.

CREATE TABLE IF NOT EXISTS cv_revamps (
  id           CHAR(36)     NOT NULL,
  user_id      CHAR(36)     NOT NULL,

  -- Taken from the first meaningful line of the job post, so the list reads
  -- as "Senior Analytics Engineer — Monzo" rather than as timestamps.
  role_title   VARCHAR(255) NULL,
  -- The uploaded filename, where there was one.
  source_name  VARCHAR(255) NULL,

  revamped_cv  MEDIUMTEXT   NOT NULL,
  -- The three lists the model returns, stored as JSON text so the shape can
  -- change without a migration.
  changes      MEDIUMTEXT   NULL,
  missing_keywords TEXT     NULL,
  honest_gaps  TEXT         NULL,

  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_cv_revamps_user (user_id, created_at),
  CONSTRAINT fk_cv_revamps_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
