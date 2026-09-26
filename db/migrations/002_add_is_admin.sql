-- 002: let a registered account sign in to /analytics.
--
-- Analytics used to authenticate against ANALYTICS_USERNAME and
-- ANALYTICS_PASSWORD_HASH in Vercel's environment. That kept admin out of the
-- database entirely, which is the safer shape, but it meant generating a
-- scrypt hash by hand and it locks you out the moment either variable is
-- missing or mistyped — with a message that cannot tell you which.
--
-- Operators are now ordinary accounts carrying this flag. Password reset,
-- verification and rate limiting all apply to them like anyone else, and the
-- privilege boundary stays: /analytics still issues its own cookie with its
-- own JWT audience, so a normal user session can never be replayed as admin.
--
-- The environment credentials still work if both variables are set, as a way
-- back in if you lose database access.

ALTER TABLE users
  ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER email_verified_at;

-- Promote yourself. Register through the normal signup flow first, then run
-- this with your own address — nothing grants admin automatically, so an open
-- registration form cannot mint an operator.
--
-- UPDATE users SET is_admin = 1 WHERE email = 'you@example.com';
