<?php
/**
 * Prep API — email and password authentication.
 *
 * Passwords are hashed with PHP's password_hash() using PASSWORD_DEFAULT, so
 * the algorithm follows whatever PHP considers current on the host rather than
 * being pinned here. The plaintext is never stored, logged, or returned.
 */

declare(strict_types=1);

const PREP_MIN_PASSWORD = 8;

/** Shape returned to Next.js after a successful register or login. */
function prep_user_payload(array $row): array
{
    return [
        'id'           => $row['id'],
        'email'        => $row['email'],
        'display_name' => $row['display_name'],
        'onboarded'    => $row['onboarded_at'] !== null,
        'verified'     => ($row['email_verified_at'] ?? null) !== null,
    ];
}

/**
 * Issues a fresh single-use token and emails the link.
 *
 * Shared by registration and the "resend" button. Any outstanding token of the
 * same purpose is retired first, so only the newest email ever works — which
 * is what people expect after clicking resend.
 */
function prep_issue_token(
    PDO $db,
    string $userId,
    string $purpose,
    string $ttlExpression
): string {
    // MySQL will not accept a placeholder for an INTERVAL's unit, so this one
    // fragment is interpolated. It is built from constants and never from
    // request data; the assertion keeps it that way if someone changes a caller.
    if (!preg_match('/^\d+ (MINUTE|HOUR|DAY)$/', $ttlExpression)) {
        throw new InvalidArgumentException('Unsafe TTL expression');
    }

    $db->prepare(
        'UPDATE auth_tokens SET used_at = UTC_TIMESTAMP()
          WHERE user_id = ? AND purpose = ? AND used_at IS NULL'
    )->execute([$userId, $purpose]);

    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

    // Only the hash is stored, so a leaked database cannot be used to verify
    // or reset anyone's account — the raw token exists solely in the email.
    $db->prepare(
        "INSERT INTO auth_tokens (id, user_id, token_hash, purpose, expires_at, request_ip)
         VALUES (?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL {$ttlExpression}), ?)"
    )->execute([
        prep_uuid(),
        $userId,
        hash('sha256', $token),
        $purpose,
        @inet_pton($_SERVER['REMOTE_ADDR'] ?? '') ?: null,
    ]);

    return $token;
}

/** Builds and sends the confirm-your-email message. Failure is not fatal. */
function prep_dispatch_verification(PDO $db, string $userId, string $email): bool
{
    $token = prep_issue_token(
        $db,
        $userId,
        'email_verify',
        PREP_VERIFY_TTL_HOURS . ' HOUR'
    );

    $url = rtrim(prep_env('APP_URL'), '/')
         . '/auth/verify-email?token=' . rawurlencode($token);

    if (!prep_send_verification_link($email, $url)) {
        error_log('[prep] verification email failed for ' . $email);
        return false;
    }
    return true;
}

/** POST /auth/register  { email, password, display_name? } */
function prep_route_register(array $body): never
{
    $email    = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    $name     = trim((string) ($body['display_name'] ?? ''));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
        prep_json(['error' => 'Enter a valid email address.'], 422);
    }
    if (strlen($password) < PREP_MIN_PASSWORD) {
        prep_json(['error' => 'Password must be at least ' . PREP_MIN_PASSWORD . ' characters.'], 422);
    }
    // password_hash truncates bcrypt input at 72 bytes; reject rather than
    // silently ignore the tail.
    if (strlen($password) > 200) {
        prep_json(['error' => 'That password is too long.'], 422);
    }

    prep_rate_limit('register:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 10, 900);

    $db = prep_db();

    $existing = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $existing->execute([$email]);
    if ($existing->fetchColumn() !== false) {
        prep_json(['error' => 'An account with that email already exists. Try signing in.'], 409);
    }

    $userId = prep_uuid();
    $display = $name !== '' ? mb_substr($name, 0, 120) : explode('@', $email)[0];

    $db->prepare(
        'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
    )->execute([
        $userId,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $display,
    ]);

    // Soft gate: the account is usable immediately and the email only confirms
    // we can reach them. A failed send must therefore never fail registration —
    // they can resend from the banner in the app.
    prep_dispatch_verification($db, $userId, $email);

    prep_json([
        'user' => [
            'id'           => $userId,
            'email'        => $email,
            'display_name' => $display,
            'onboarded'    => false,
            'verified'     => false,
        ],
    ]);
}

/** POST /auth/login  { email, password } */
function prep_route_login(array $body): never
{
    $email    = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        prep_json(['error' => 'Enter your email and password.'], 422);
    }

    // Two limits: one slows an attack on a single account, one slows a sweep.
    prep_rate_limit('login:' . $email, 10, 900);
    prep_rate_limit('loginip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 40, 900);

    $db = prep_db();
    $stmt = $db->prepare(
        'SELECT id, email, password_hash, display_name, onboarded_at, email_verified_at
           FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Hash even when the account is missing, so response time doesn't reveal
    // which emails are registered.
    $hash = $user['password_hash'] ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

    if (!password_verify($password, $hash) || !$user) {
        prep_json(['error' => 'That email or password is not right.'], 401);
    }

    // Transparently upgrade the stored hash if PHP's default has moved on.
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
           ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }

    prep_json(['user' => prep_user_payload($user)]);
}

/**
 * POST /auth/request-reset  { email }
 *
 * Always reports success. Telling the caller whether an address is registered
 * would turn this into an account-enumeration endpoint.
 */
function prep_route_request_reset(array $body): never
{
    $email = strtolower(trim((string) ($body['email'] ?? '')));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        prep_json(['error' => 'Enter a valid email address.'], 422);
    }

    prep_rate_limit('reset:' . $email, 5, 900);
    prep_rate_limit('resetip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 20, 900);

    $db = prep_db();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $userId = $stmt->fetchColumn();

    if ($userId !== false) {
        $token = prep_issue_token(
            $db,
            (string) $userId,
            'password_reset',
            PREP_TOKEN_TTL_MINUTES . ' MINUTE'
        );

        $url = rtrim(prep_env('APP_URL'), '/')
             . '/reset-password?token=' . rawurlencode($token);

        if (!prep_send_reset_link($email, $url)) {
            // Logged for the operator; the caller still sees a generic success.
            error_log('[prep] reset email failed for ' . $email);
        }
    }

    prep_json(['ok' => true]);
}

/** POST /auth/reset  { token, password } */
function prep_route_reset_password(array $body): never
{
    $token    = trim((string) ($body['token'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($token === '') {
        prep_json(['error' => 'Missing token'], 422);
    }
    if (strlen($password) < PREP_MIN_PASSWORD) {
        prep_json(['error' => 'Password must be at least ' . PREP_MIN_PASSWORD . ' characters.'], 422);
    }
    if (strlen($password) > 200) {
        prep_json(['error' => 'That password is too long.'], 422);
    }

    prep_rate_limit('doreset:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 20, 900);

    $db = prep_db();
    $stmt = $db->prepare(
        'SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at,
                u.email, u.display_name, u.onboarded_at, u.email_verified_at
           FROM auth_tokens t
           JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = ? AND t.purpose = ?
          LIMIT 1'
    );
    $stmt->execute([hash('sha256', $token), 'password_reset']);
    $row = $stmt->fetch();

    if (!$row || $row['used_at'] !== null
        || strtotime((string) $row['expires_at']) < time()
    ) {
        prep_json(['error' => 'That link has expired or has already been used.'], 401);
    }

    $db->beginTransaction();
    try {
        // Burn the token first: one use, no exceptions.
        $db->prepare('UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?')
           ->execute([$row['token_id']]);

        $db->prepare(
            'UPDATE users
                SET password_hash = ?,
                    email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP())
              WHERE id = ?'
        )->execute([password_hash($password, PASSWORD_DEFAULT), $row['user_id']]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[prep] reset failed: ' . $e->getMessage());
        prep_json(['error' => 'Could not reset your password.'], 500);
    }

    // Completing a reset proves they control the inbox, so the row above is
    // now stale — report them verified rather than showing the banner.
    $row['email_verified_at'] = $row['email_verified_at'] ?? gmdate('Y-m-d H:i:s');

    // Signing them straight in saves a redundant login right after.
    prep_json(['user' => prep_user_payload($row)]);
}

/** POST /auth/verify-email  { token } */
function prep_route_verify_email(array $body): never
{
    $token = trim((string) ($body['token'] ?? ''));
    if ($token === '') {
        prep_json(['error' => 'Missing token'], 422);
    }

    prep_rate_limit('verifyemail:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 30, 900);

    $db = prep_db();
    $stmt = $db->prepare(
        'SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at,
                u.email, u.display_name, u.onboarded_at, u.email_verified_at
           FROM auth_tokens t
           JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = ? AND t.purpose = ?
          LIMIT 1'
    );
    $stmt->execute([hash('sha256', $token), 'email_verify']);
    $row = $stmt->fetch();

    if (!$row) {
        prep_json(['error' => 'That confirmation link is not valid.'], 401);
    }

    // Clicking an already-used link is almost always a double-click or an email
    // client prefetching it. If the account is verified, say so happily rather
    // than showing an error for something that already worked.
    if ($row['email_verified_at'] !== null) {
        prep_json(['user' => prep_user_payload($row), 'alreadyVerified' => true]);
    }

    if ($row['used_at'] !== null || strtotime((string) $row['expires_at']) < time()) {
        prep_json([
            'error'    => 'That confirmation link has expired.',
            'expired'  => true,
        ], 401);
    }

    $db->beginTransaction();
    try {
        $db->prepare('UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?')
           ->execute([$row['token_id']]);

        $db->prepare('UPDATE users SET email_verified_at = UTC_TIMESTAMP() WHERE id = ?')
           ->execute([$row['user_id']]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[prep] verify email failed: ' . $e->getMessage());
        prep_json(['error' => 'Could not confirm your email.'], 500);
    }

    $row['email_verified_at'] = gmdate('Y-m-d H:i:s');
    prep_json(['user' => prep_user_payload($row)]);
}

/**
 * POST /auth/resend-verification
 *
 * Actor-scoped: only a signed-in user can ask for their own link, so this
 * cannot be used to send mail to arbitrary addresses.
 */
function prep_route_resend_verification(string $userId): never
{
    prep_rate_limit('resend:' . $userId, 4, 3600);

    $db = prep_db();
    $stmt = $db->prepare(
        'SELECT email, email_verified_at FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        prep_json(['error' => 'No such user'], 404);
    }
    if ($user['email_verified_at'] !== null) {
        prep_json(['ok' => true, 'alreadyVerified' => true]);
    }

    if (!prep_dispatch_verification($db, $userId, (string) $user['email'])) {
        prep_json(['error' => "We couldn't send that email. Try again shortly."], 502);
    }

    prep_json(['ok' => true]);
}

/**
 * Verifies an operator's credentials for /analytics.
 *
 * Separate from prep_route_login on purpose. A successful user login must not
 * be usable to reach analytics, and an account without is_admin must fail here
 * even when its password is correct — so this route answers a different
 * question and returns a different payload.
 */
function prep_route_admin_login(array $body): never
{
    $email    = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        prep_json(['error' => 'Enter your email and password.'], 422);
    }

    // Tighter than the user login: an operator account is worth more, and a
    // legitimate operator does not sign in often.
    prep_rate_limit('adminlogin:' . $email, 5, 900);
    prep_rate_limit('adminloginip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 15, 900);

    $db = prep_db();
    $stmt = $db->prepare(
        'SELECT id, email, password_hash, display_name, is_admin
           FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    $hash = $user['password_hash'] ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    $passwordOk = password_verify($password, $hash);

    // One message for every failure — wrong address, wrong password, or a real
    // password on an account without the flag. Distinguishing them would tell
    // an attacker which accounts are worth attacking.
    if (!$user || !$passwordOk || (int) $user['is_admin'] !== 1) {
        if ($user && $passwordOk) {
            error_log('[prep] analytics login refused for non-admin ' . $email);
        }
        prep_json(['error' => 'That email or password is not right.'], 401);
    }

    prep_json([
        'admin' => [
            'id'           => $user['id'],
            'email'        => $user['email'],
            'display_name' => $user['display_name'],
        ],
    ]);
}
