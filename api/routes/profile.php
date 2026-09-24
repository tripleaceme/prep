<?php
/**
 * Prep API — profile, onboarding answers, and the dashboard payload.
 *
 * Routes for interviews, reports and coding problems are added alongside those
 * screens; this file covers what the shell itself needs.
 */

declare(strict_types=1);

/**
 * GET /health — deployment check.
 *
 * Reports whether PHP is new enough, the database connects, and the schema has
 * been imported. Signed like every other route, so it can be specific without
 * telling the world how the host is configured.
 */
function prep_route_health(): never
{
    $tables = [];
    $dbError = null;

    try {
        $stmt = prep_db()->query('SHOW TABLES');
        $tables = $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
    } catch (Throwable $e) {
        $dbError = $e->getMessage();
    }

    $expected = ['users', 'auth_tokens', 'interviews', 'reports', 'coding_attempts', 'activity_days'];
    $missing = array_values(array_diff($expected, $tables));

    prep_json([
        // An exposed .env is a failure even when everything else works.
        'ok'            => $dbError === null && $missing === [] && !PREP_ENV_EXPOSED,
        'php'           => PHP_VERSION,
        'database'      => $dbError === null ? 'connected' : 'failed',
        'databaseError' => $dbError,
        'missingTables' => $missing,
        'envExposed'    => PREP_ENV_EXPOSED,
        'envPath'       => PREP_ENV_PATH,
    ]);
}

/** GET /profile */
function prep_route_get_profile(string $userId): never
{
    $stmt = prep_db()->prepare(
        'SELECT id, email, display_name, avatar_url, career_stage, employer_type,
                goal, field, onboarded_at, email_verified_at, readiness,
                current_streak, longest_streak, last_active_on
           FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        prep_json(['error' => 'No such user'], 404);
    }

    $user['onboarded'] = $user['onboarded_at'] !== null;
    $user['verified']  = $user['email_verified_at'] !== null;
    prep_json(['profile' => $user]);
}

/** POST /profile  { career_stage, employer_type, goal, field } */
function prep_route_save_onboarding(string $userId, array $body): never
{
    $allowed = [
        'career_stage'  => ['student', 'early', 'mid', 'senior', 'switching'],
        'employer_type' => ['big', 'startup', 'midsize', 'public', 'any'],
        'goal'          => ['first_job', 'switch_job', 'grow', 'upcoming_interview'],
        'field'         => [
            'analytics_engineering', 'data_engineering',
            'analytics_bi', 'data_science', 'other',
        ],
    ];

    $values = [];
    foreach ($allowed as $column => $options) {
        $value = (string) ($body[$column] ?? '');
        if (!in_array($value, $options, true)) {
            prep_json(['error' => "Invalid value for {$column}"], 422);
        }
        $values[] = $value;
    }
    $values[] = $userId;

    prep_db()->prepare(
        'UPDATE users
            SET career_stage = ?, employer_type = ?, goal = ?, field = ?,
                onboarded_at = COALESCE(onboarded_at, UTC_TIMESTAMP())
          WHERE id = ?'
    )->execute($values);

    prep_json(['ok' => true]);
}

/**
 * GET /dashboard
 *
 * One round trip for the home screen: profile, the last year of activity for
 * the contribution blocks, and the most recent reports.
 */
function prep_route_dashboard(string $userId): never
{
    $db = prep_db();

    $profile = $db->prepare(
        'SELECT display_name, field, goal, readiness, current_streak, longest_streak
           FROM users WHERE id = ? LIMIT 1'
    );
    $profile->execute([$userId]);

    $activity = $db->prepare(
        'SELECT day, interviews, problems
           FROM activity_days
          WHERE user_id = ? AND day >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
          ORDER BY day'
    );
    $activity->execute([$userId]);

    $reports = $db->prepare(
        'SELECT r.id, r.overall_score, r.understanding, r.summary, r.created_at,
                i.kind, i.track, i.role_title
           FROM reports r
           JOIN interviews i ON i.id = r.interview_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT 5'
    );
    $reports->execute([$userId]);

    prep_json([
        'profile'  => $profile->fetch() ?: null,
        'activity' => $activity->fetchAll(),
        'reports'  => $reports->fetchAll(),
    ]);
}

/** POST /activity  { kind: 'interview' | 'problem' } */
function prep_route_record_activity(string $userId, array $body): never
{
    $kind = (string) ($body['kind'] ?? '');
    if (!in_array($kind, ['interview', 'problem'], true)) {
        prep_json(['error' => 'Invalid activity kind'], 422);
    }

    $db = prep_db();
    $db->beginTransaction();

    try {
        $db->prepare(
            'INSERT INTO activity_days (user_id, day, interviews, problems)
             VALUES (?, CURDATE(), ?, ?)
             ON DUPLICATE KEY UPDATE
               interviews = interviews + VALUES(interviews),
               problems   = problems + VALUES(problems)'
        )->execute([
            $userId,
            $kind === 'interview' ? 1 : 0,
            $kind === 'problem' ? 1 : 0,
        ]);

        $stmt = $db->prepare(
            'SELECT last_active_on, current_streak FROM users WHERE id = ? FOR UPDATE'
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $today = new DateTimeImmutable('today');
        $last  = $row['last_active_on'] ? new DateTimeImmutable((string) $row['last_active_on']) : null;

        if ($last && $last->format('Y-m-d') === $today->format('Y-m-d')) {
            // Already counted today — the streak is unchanged.
            $db->commit();
            prep_json(['ok' => true, 'streak' => (int) $row['current_streak']]);
        }

        $yesterday = $today->modify('-1 day')->format('Y-m-d');
        $streak = ($last && $last->format('Y-m-d') === $yesterday)
            ? (int) $row['current_streak'] + 1
            : 1;

        $db->prepare(
            'UPDATE users
                SET current_streak = ?,
                    longest_streak = GREATEST(longest_streak, ?),
                    last_active_on = CURDATE()
              WHERE id = ?'
        )->execute([$streak, $streak, $userId]);

        $db->commit();
        prep_json(['ok' => true, 'streak' => $streak]);
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[prep] record activity failed: ' . $e->getMessage());
        prep_json(['error' => 'Could not record activity'], 500);
    }
}

/** POST /profile/name  { display_name } */
function prep_route_update_name(string $userId, array $body): never
{
    $name = trim((string) ($body['display_name'] ?? ''));

    if ($name === '' || mb_strlen($name) > 120) {
        prep_json(['error' => 'Enter a name of up to 120 characters.'], 422);
    }

    prep_db()->prepare('UPDATE users SET display_name = ? WHERE id = ?')
             ->execute([$name, $userId]);

    prep_json(['ok' => true, 'display_name' => $name]);
}

/**
 * POST /profile/avatar  { image: "data:image/...;base64,..." }
 *
 * The browser resizes and re-encodes the picture to a small square before
 * sending, so this receives a bounded payload, never the original file. That
 * also strips EXIF — including any GPS coordinates the phone attached.
 *
 * Sent as base64 inside JSON rather than multipart so the HMAC signature
 * covers the body unchanged, exactly like every other route.
 */
function prep_route_update_avatar(string $userId, array $body): never
{
    $payload = (string) ($body['image'] ?? '');

    if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $payload, $m)) {
        prep_json(['error' => 'Send a JPEG, PNG or WebP image.'], 422);
    }

    $binary = base64_decode(substr($payload, strlen($m[0])), true);
    if ($binary === false) {
        prep_json(['error' => 'That image could not be read.'], 422);
    }
    // The client caps this far lower; the limit is here because the client
    // cannot be trusted to have run at all.
    if (strlen($binary) > 400 * 1024) {
        prep_json(['error' => 'That image is too large.'], 422);
    }

    // Never trust the declared type — confirm it really is an image, and that
    // its dimensions are sane.
    $info = @getimagesizefromstring($binary);
    if ($info === false || $info[0] < 16 || $info[1] < 16 || $info[0] > 1024 || $info[1] > 1024) {
        prep_json(['error' => 'That does not look like a valid image.'], 422);
    }

    $extension = match ($info[2]) {
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG  => 'png',
        IMAGETYPE_WEBP => 'webp',
        default        => null,
    };
    if ($extension === null) {
        prep_json(['error' => 'Send a JPEG, PNG or WebP image.'], 422);
    }

    $dir = dirname(__DIR__) . '/uploads/avatars';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        error_log('[prep] could not create avatar directory');
        prep_json(['error' => 'Could not store that image.'], 500);
    }

    // Filename comes from the user id plus randomness — never from input — so
    // a crafted name cannot escape the directory, and the new URL busts caches.
    $filename = $userId . '-' . bin2hex(random_bytes(4)) . '.' . $extension;

    if (@file_put_contents($dir . '/' . $filename, $binary) === false) {
        error_log('[prep] could not write avatar');
        prep_json(['error' => 'Could not store that image.'], 500);
    }

    $db = prep_db();

    // Remove the previous file so the directory does not grow without bound.
    $previous = $db->prepare('SELECT avatar_url FROM users WHERE id = ? LIMIT 1');
    $previous->execute([$userId]);
    $old = (string) ($previous->fetchColumn() ?: '');
    if ($old !== '' && str_starts_with($old, 'uploads/avatars/')) {
        @unlink(dirname(__DIR__) . '/' . $old);
    }

    $relative = 'uploads/avatars/' . $filename;
    $db->prepare('UPDATE users SET avatar_url = ? WHERE id = ?')
       ->execute([$relative, $userId]);

    prep_json(['ok' => true, 'avatar_url' => $relative]);
}
