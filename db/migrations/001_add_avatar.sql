-- Run this if you already imported db/schema.sql before avatars existed.
-- New installs get the column from schema.sql and can skip this file.

ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(255) NULL AFTER display_name;
