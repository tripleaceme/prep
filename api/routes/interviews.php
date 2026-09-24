<?php
/**
 * Prep API — interviews, reports and coding progress.
 *
 * Note what is NOT stored: no API keys, and no audio. `transcript` holds the
 * question-and-answer text the user chose to complete an interview with, which
 * is what makes a report re-readable later.
 */

declare(strict_types=1);

/** POST /interviews — called when a session starts. */
function prep_route_start_interview(string $userId, array $body): never
{
    $kind = (string) ($body['kind'] ?? '');
    if (!in_array($kind, ['ai', 'mock'], true)) {
        prep_json(['error' => 'Invalid interview kind'], 422);
    }

    $source = (string) ($body['source'] ?? '');
    if ($source !== '' && !in_array($source, ['role', 'job_post', 'cv'], true)) {
        prep_json(['error' => 'Invalid source'], 422);
    }

    $id = prep_uuid();

    prep_db()->prepare(
        'INSERT INTO interviews
           (id, user_id, kind, track, source, role_title, job_description, focus, stage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id,
        $userId,
        $kind,
        prep_nullable($body['track'] ?? null, 48),
        $source !== '' ? $source : null,
        prep_nullable($body['role_title'] ?? null, 200),
        prep_nullable($body['job_description'] ?? null, 60000),
        prep_nullable($body['focus'] ?? null, 500),
        prep_nullable($body['stage'] ?? null, 48),
    ]);

    prep_json(['interview' => ['id' => $id]]);
}

/**
 * POST /interviews/complete — stores the report and closes the session.
 *
 * Readiness is a rolling average of the last five scores rather than the
 * latest one, so a single bad session doesn't erase weeks of progress and a
 * single good one doesn't declare someone ready.
 */
function prep_route_complete_interview(string $userId, array $body): never
{
    $interviewId = (string) ($body['interview_id'] ?? '');
    $report      = $body['report'] ?? null;

    if ($interviewId === '' || !is_array($report)) {
        prep_json(['error' => 'Missing interview or report'], 422);
    }

    $db = prep_db();

    // Ownership check: the signature proves the caller, not that this
    // interview belongs to that user.
    $owns = $db->prepare('SELECT id FROM interviews WHERE id = ? AND user_id = ? LIMIT 1');
    $owns->execute([$interviewId, $userId]);
    if ($owns->fetchColumn() === false) {
        prep_json(['error' => 'No such interview'], 404);
    }

    $understanding = (string) ($report['understanding'] ?? 'surface');
    if (!in_array($understanding, ['surface', 'working', 'strong'], true)) {
        $understanding = 'surface';
    }

    $score = (int) ($report['overall_score'] ?? 0);
    $score = max(0, min(100, $score));

    $db->beginTransaction();
    try {
        $db->prepare(
            'UPDATE interviews
                SET status = ?, completed_at = UTC_TIMESTAMP(), question_count = ?
              WHERE id = ?'
        )->execute(['completed', (int) ($body['question_count'] ?? 0), $interviewId]);

        $reportId = prep_uuid();
        $db->prepare(
            'INSERT INTO reports
               (id, interview_id, user_id, overall_score, understanding, summary,
                strengths, knowledge_gaps, topics_to_review, transcript)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               overall_score    = VALUES(overall_score),
               understanding    = VALUES(understanding),
               summary          = VALUES(summary),
               strengths        = VALUES(strengths),
               knowledge_gaps   = VALUES(knowledge_gaps),
               topics_to_review = VALUES(topics_to_review),
               transcript       = VALUES(transcript)'
        )->execute([
            $reportId,
            $interviewId,
            $userId,
            $score,
            $understanding,
            prep_nullable($report['summary'] ?? null, 4000),
            prep_json_column($report['strengths'] ?? []),
            prep_json_column($report['knowledge_gaps'] ?? []),
            prep_json_column($report['topics_to_review'] ?? []),
            prep_json_column($report['transcript'] ?? []),
        ]);

        $recent = $db->prepare(
            'SELECT AVG(overall_score) FROM (
               SELECT overall_score FROM reports
                WHERE user_id = ? AND overall_score IS NOT NULL
                ORDER BY created_at DESC LIMIT 5
             ) AS latest'
        );
        $recent->execute([$userId]);
        $readiness = (int) round((float) ($recent->fetchColumn() ?: 0));

        $db->prepare('UPDATE users SET readiness = ? WHERE id = ?')
           ->execute([max(0, min(100, $readiness)), $userId]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('[prep] complete interview failed: ' . $e->getMessage());
        prep_json(['error' => 'Could not save your report'], 500);
    }

    prep_json(['report' => ['id' => $reportId]]);
}

/** GET /reports */
function prep_route_list_reports(string $userId): never
{
    $stmt = prep_db()->prepare(
        'SELECT r.id, r.overall_score, r.understanding, r.summary, r.created_at,
                i.kind, i.track, i.role_title
           FROM reports r
           JOIN interviews i ON i.id = r.interview_id
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC
          LIMIT 100'
    );
    $stmt->execute([$userId]);
    prep_json(['reports' => $stmt->fetchAll()]);
}

/** GET /reports/{id} */
function prep_route_get_report(string $userId, string $reportId): never
{
    $stmt = prep_db()->prepare(
        'SELECT r.*, i.kind, i.track, i.role_title, i.stage, i.started_at, i.completed_at
           FROM reports r
           JOIN interviews i ON i.id = r.interview_id
          WHERE r.id = ? AND r.user_id = ?
          LIMIT 1'
    );
    $stmt->execute([$reportId, $userId]);
    $report = $stmt->fetch();

    if (!$report) {
        prep_json(['error' => 'No such report'], 404);
    }

    foreach (['strengths', 'knowledge_gaps', 'topics_to_review', 'transcript'] as $column) {
        $report[$column] = json_decode((string) ($report[$column] ?? '[]'), true) ?: [];
    }

    prep_json(['report' => $report]);
}

/** GET /coding — every problem this user has touched. */
function prep_route_list_coding(string $userId): never
{
    $stmt = prep_db()->prepare(
        'SELECT problem_slug, status, solved_at, updated_at
           FROM coding_attempts WHERE user_id = ?'
    );
    $stmt->execute([$userId]);
    prep_json(['attempts' => $stmt->fetchAll()]);
}

/** POST /coding  { problem_slug, status, code } */
function prep_route_save_coding(string $userId, array $body): never
{
    $slug   = prep_nullable($body['problem_slug'] ?? null, 96);
    $status = (string) ($body['status'] ?? 'attempted');

    if ($slug === null) {
        prep_json(['error' => 'Missing problem'], 422);
    }
    if (!in_array($status, ['attempted', 'solved'], true)) {
        $status = 'attempted';
    }

    prep_db()->prepare(
        'INSERT INTO coding_attempts (id, user_id, problem_slug, status, code, solved_at)
         VALUES (?, ?, ?, ?, ?, IF(? = \'solved\', UTC_TIMESTAMP(), NULL))
         ON DUPLICATE KEY UPDATE
           code      = VALUES(code),
           -- never demote a solved problem back to attempted
           status    = IF(coding_attempts.status = \'solved\', \'solved\', VALUES(status)),
           solved_at = COALESCE(coding_attempts.solved_at, VALUES(solved_at))'
    )->execute([
        prep_uuid(),
        $userId,
        $slug,
        $status,
        prep_nullable($body['code'] ?? null, 60000),
        $status,
    ]);

    prep_json(['ok' => true]);
}

/* ------------------------------------------------------------------------ */

function prep_nullable(mixed $value, int $maxLength): ?string
{
    if ($value === null) return null;
    $text = trim((string) $value);
    return $text === '' ? null : mb_substr($text, 0, $maxLength);
}

function prep_json_column(mixed $value): string
{
    return json_encode(
        is_array($value) ? $value : [],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    ) ?: '[]';
}
