<?php
/**
 * Prep API — analytics for the operator.
 *
 * Reached only by the signed-in admin at /analytics in the Next.js app. It is
 * signed like every other route; what keeps it private is that nothing else
 * calls it, and the admin session is entirely separate from user sessions, so
 * a compromised user account can never reach this data.
 *
 * Deliberately aggregate. The one exception is the recent-signups list, which
 * exists so there is someone to actually talk to about why they stopped.
 */

declare(strict_types=1);

function prep_route_analytics(): never
{
    $db = prep_db();

    $one = static function (PDO $db, string $sql, array $params = []): mixed {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn();
    };

    $all = static function (PDO $db, string $sql, array $params = []): array {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    };

    // ---- The funnel ------------------------------------------------------
    // Each step is a count of distinct users, so the drop-off between them is
    // real people rather than events.
    $registered = (int) $one($db, 'SELECT COUNT(*) FROM users');
    $verified   = (int) $one($db, 'SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL');
    $onboarded  = (int) $one($db, 'SELECT COUNT(*) FROM users WHERE onboarded_at IS NOT NULL');
    $started    = (int) $one($db, 'SELECT COUNT(DISTINCT user_id) FROM interviews');
    $completed  = (int) $one(
        $db,
        "SELECT COUNT(DISTINCT user_id) FROM interviews WHERE status = 'completed'"
    );
    $repeated = (int) $one(
        $db,
        "SELECT COUNT(*) FROM (
           SELECT user_id FROM interviews WHERE status = 'completed'
           GROUP BY user_id HAVING COUNT(*) > 1
         ) AS repeats"
    );

    // ---- Volume ----------------------------------------------------------
    $interviewsStarted   = (int) $one($db, 'SELECT COUNT(*) FROM interviews');
    $interviewsCompleted = (int) $one(
        $db,
        "SELECT COUNT(*) FROM interviews WHERE status = 'completed'"
    );
    $problemsSolved = (int) $one(
        $db,
        "SELECT COUNT(*) FROM coding_attempts WHERE status = 'solved'"
    );
    $problemsAttempted = (int) $one($db, 'SELECT COUNT(*) FROM coding_attempts');

    // ---- Activity ---------------------------------------------------------
    $activeLast7 = (int) $one(
        $db,
        'SELECT COUNT(DISTINCT user_id) FROM activity_days
          WHERE day >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    );
    $activeLast30 = (int) $one(
        $db,
        'SELECT COUNT(DISTINCT user_id) FROM activity_days
          WHERE day >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    // ---- Daily series for the last 60 days --------------------------------
    // Sixty, not thirty, because the dashboard shows a period against the one
    // before it. Charting 30 days needs 60 days of data to say whether those
    // 30 were better or worse than the last 30.
    $signupsByDay = $all(
        $db,
        'SELECT DATE(created_at) AS day, COUNT(*) AS count
           FROM users
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
          GROUP BY DATE(created_at)
          ORDER BY day'
    );

    $interviewsByDay = $all(
        $db,
        "SELECT DATE(started_at) AS day,
                COUNT(*) AS started,
                SUM(status = 'completed') AS completed
           FROM interviews
          WHERE started_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
          GROUP BY DATE(started_at)
          ORDER BY day"
    );

    // ---- Which tracks people actually pick --------------------------------
    $byTrack = $all(
        $db,
        "SELECT track,
                COUNT(*) AS started,
                SUM(status = 'completed') AS completed
           FROM interviews
          WHERE kind = 'mock' AND track IS NOT NULL
          GROUP BY track
          ORDER BY started DESC"
    );

    $byKind = $all(
        $db,
        "SELECT kind, COUNT(*) AS started, SUM(status = 'completed') AS completed
           FROM interviews GROUP BY kind"
    );

    // ---- Which problems stop people ---------------------------------------
    // A problem attempted often but solved rarely is either too hard or badly
    // worded; either way it's the one to look at.
    $byProblem = $all(
        $db,
        "SELECT problem_slug,
                COUNT(*) AS attempts,
                SUM(status = 'solved') AS solved
           FROM coding_attempts
          GROUP BY problem_slug
          ORDER BY attempts DESC"
    );

    // ---- How people are actually scoring ----------------------------------
    $byUnderstanding = $all(
        $db,
        'SELECT understanding, COUNT(*) AS count
           FROM reports WHERE understanding IS NOT NULL
          GROUP BY understanding'
    );

    $averageScore = $one($db, 'SELECT AVG(overall_score) FROM reports');

    // ---- Who signed up lately ---------------------------------------------
    $recentUsers = $all(
        $db,
        "SELECT u.email, u.display_name, u.field, u.created_at,
                u.onboarded_at IS NOT NULL AS onboarded,
                u.email_verified_at IS NOT NULL AS verified,
                u.current_streak, u.readiness,
                (SELECT COUNT(*) FROM interviews i
                  WHERE i.user_id = u.id AND i.status = 'completed') AS completed_interviews
           FROM users u
          ORDER BY u.created_at DESC
          LIMIT 25"
    );

    prep_json([
        'funnel' => [
            'registered' => $registered,
            'verified'   => $verified,
            'onboarded'  => $onboarded,
            'started'    => $started,
            'completed'  => $completed,
            'repeated'   => $repeated,
        ],
        'totals' => [
            'interviewsStarted'   => $interviewsStarted,
            'interviewsCompleted' => $interviewsCompleted,
            'problemsAttempted'   => $problemsAttempted,
            'problemsSolved'      => $problemsSolved,
            'activeLast7'         => $activeLast7,
            'activeLast30'        => $activeLast30,
            'averageScore'        => $averageScore === null ? null : round((float) $averageScore, 1),
        ],
        'signupsByDay'    => $signupsByDay,
        'interviewsByDay' => $interviewsByDay,
        'byTrack'         => $byTrack,
        'byKind'          => $byKind,
        'byProblem'       => $byProblem,
        'byUnderstanding' => $byUnderstanding,
        'recentUsers'     => $recentUsers,
        'generatedAt'     => gmdate('c'),
    ]);
}
