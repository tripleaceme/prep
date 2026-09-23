<?php
/**
 * Prep API — profile, onboarding answers, and the dashboard payload.
 *
 * Routes for interviews, reports and coding problems are added alongside those
 * screens; this file covers what the shell itself needs.
 */

declare(strict_types=1);

/** GET /profile */
function prep_route_get_profile(string $userId): never
{
    $stmt = prep_db()->prepare(
        'SELECT id, email, display_name, career_stage, employer_type, goal, field,
                onboarded_at, readiness, current_streak, longest_streak, last_active_on
           FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        prep_json(['error' => 'No such user'], 404);
    }

    $user['onboarded'] = $user['onboarded_at'] !== null;
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
