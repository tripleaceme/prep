<?php
/**
 * Prep API — CV revamp history.
 *
 * Mirrors the AI interview history: the work is done in the browser against
 * the user's own key, and only the result is stored here so it survives a
 * cleared browser and follows the account to another device.
 *
 * The full rewritten CV is stored rather than the inputs. Regenerating it
 * would produce a different CV each time, so history that regenerated would
 * be showing something the person never saw.
 */

declare(strict_types=1);

/** GET /cv — the list, newest first. Never the CV bodies. */
function prep_route_list_cv_revamps(string $userId): never
{
    $stmt = prep_db()->prepare(
        'SELECT id, role_title, source_name, created_at
           FROM cv_revamps
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50'
    );
    $stmt->execute([$userId]);

    prep_json(['revamps' => $stmt->fetchAll()]);
}

/** GET /cv/{id} — one revamp in full. */
function prep_route_get_cv_revamp(string $userId, string $id): never
{
    $stmt = prep_db()->prepare(
        'SELECT id, role_title, source_name, revamped_cv, changes,
                missing_keywords, honest_gaps, created_at
           FROM cv_revamps
          WHERE id = ? AND user_id = ?
          LIMIT 1'
    );
    // Scoped by user as well as id, so a guessed id returns nothing rather
    // than somebody else's CV.
    $stmt->execute([$id, $userId]);
    $row = $stmt->fetch();

    if (!$row) {
        prep_json(['error' => 'Not found.'], 404);
    }

    foreach (['changes', 'missing_keywords', 'honest_gaps'] as $field) {
        $decoded = json_decode((string) ($row[$field] ?? ''), true);
        $row[$field] = is_array($decoded) ? $decoded : [];
    }

    prep_json(['revamp' => $row]);
}

/** POST /cv — store a finished revamp. */
function prep_route_save_cv_revamp(string $userId, array $body): never
{
    $cv = trim((string) ($body['revamped_cv'] ?? ''));
    if ($cv === '') {
        prep_json(['error' => 'Nothing to save.'], 422);
    }

    // A CV that large is not a CV. The cap is here because the column is
    // MEDIUMTEXT and an unbounded write is somebody else's disk.
    if (strlen($cv) > 200000) {
        prep_json(['error' => 'That CV is too large to store.'], 422);
    }

    $id = prep_uuid();

    $stmt = prep_db()->prepare(
        'INSERT INTO cv_revamps
            (id, user_id, role_title, source_name, revamped_cv,
             changes, missing_keywords, honest_gaps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $userId,
        prep_trim_or_null($body['role_title'] ?? null, 255),
        prep_trim_or_null($body['source_name'] ?? null, 255),
        $cv,
        json_encode($body['changes'] ?? []),
        json_encode($body['missing_keywords'] ?? []),
        json_encode($body['honest_gaps'] ?? []),
    ]);

    prep_json(['ok' => true, 'id' => $id]);
}

/** POST /cv/clear — remove every stored revamp for this user. */
function prep_route_clear_cv_revamps(string $userId): never
{
    $stmt = prep_db()->prepare('DELETE FROM cv_revamps WHERE user_id = ?');
    $stmt->execute([$userId]);

    prep_json(['ok' => true, 'deleted' => $stmt->rowCount()]);
}

/** Trims to a column's width, and treats an empty string as absent. */
function prep_trim_or_null(mixed $value, int $max): ?string
{
    $text = trim((string) ($value ?? ''));
    if ($text === '') {
        return null;
    }
    return mb_substr($text, 0, $max);
}
