<?php
/**
 * Prep API — passwordless authentication.
 *
 * Accounts are created on first sign-in: there is no separate signup. The user
 * types an email, receives a one-time link, and is in. `password_hash` exists
 * on the users table but is untouched here — when passwords are added later,
 * they become a second branch in this file rather than a replacement for it.
 */

declare(strict_types=1);

/** POST /auth/request-link  { email } */
function prep_route_request_link(array $body): never
{
    $email = strtolower(trim((string) ($body['email'] ?? '')));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
        prep_json(['error' => 'Enter a valid email address.'], 422);
    }

    // Two limits: one stops hammering a single inbox, one stops a broad sweep.
    prep_rate_limit('email:' . $email, 5, 900);
    prep_rate_limit('ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 20, 900);

    $db = prep_db();

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $userId = $stmt->fetchColumn();

    if ($userId === false) {
        $userId = prep_uuid();
        $insert = $db->prepare(
            'INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)'
        );
        $insert->execute([$userId, $email, explode('@', $email)[0]]);
    }

    // Invalidate any outstanding links, so only the newest email works.
    $db->prepare(
        "UPDATE auth_tokens SET used_at = UTC_TIMESTAMP()
          WHERE user_id = ? AND purpose = 'login' AND used_at IS NULL"
    )->execute([$userId]);

    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

    $db->prepare(
        'INSERT INTO auth_tokens (id, user_id, token_hash, purpose, expires_at, request_ip)
         VALUES (?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), ?)'
    )->execute([
        prep_uuid(),
        $userId,
        hash('sha256', $token),
        'login',
        PREP_TOKEN_TTL_MINUTES,
        @inet_pton($_SERVER['REMOTE_ADDR'] ?? '') ?: null,
    ]);

    $url = rtrim(prep_env('APP_URL'), '/') . '/auth/verify?token=' . rawurlencode($token);

    if (!prep_send_login_link($email, $url)) {
        prep_json(['error' => "We couldn't send that email. Try again shortly."], 502);
    }

    // Deliberately identical whether or not the account already existed, so
    // this endpoint cannot be used to discover who has signed up.
    prep_json(['ok' => true]);
}

/** POST /auth/verify  { token } */
function prep_route_verify(array $body): never
{
    $token = trim((string) ($body['token'] ?? ''));
    if ($token === '') {
        prep_json(['error' => 'Missing token'], 422);
    }

    prep_rate_limit('verify:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 30, 900);

    $db = prep_db();

    $stmt = $db->prepare(
        'SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at,
                u.email, u.display_name, u.onboarded_at
           FROM auth_tokens t
           JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = ? AND t.purpose = ?
          LIMIT 1'
    );
    $stmt->execute([hash('sha256', $token), 'login']);
    $row = $stmt->fetch();

    if (!$row || $row['used_at'] !== null
        || strtotime((string) $row['expires_at']) < time()
    ) {
        prep_json(['error' => 'That link has expired or has already been used.'], 401);
    }

    // Burn the token before returning: one use, no exceptions.
    $db->prepare('UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?')
       ->execute([$row['token_id']]);

    // Reaching a link proves control of the inbox.
    $db->prepare(
        'UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP())
          WHERE id = ?'
    )->execute([$row['user_id']]);

    prep_json([
        'user' => [
            'id'           => $row['user_id'],
            'email'        => $row['email'],
            'display_name' => $row['display_name'],
            'onboarded'    => $row['onboarded_at'] !== null,
        ],
    ]);
}
