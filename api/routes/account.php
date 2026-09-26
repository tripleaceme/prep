<?php
/**
 * Prep API — account deletion.
 *
 * Deletion is irreversible and wipes every interview, report and coding
 * attempt the account has. Two things follow from that:
 *
 *  - The session cookie alone is not enough. A signed-in browser left open on
 *    a shared machine is the realistic threat, so the current password has to
 *    be re-entered. That doubles as the confirmation step.
 *  - The work is done by the database, not by this file. Every child table
 *    declares ON DELETE CASCADE against users, so removing one row removes the
 *    rest. A hand-written list of DELETE statements would silently miss any
 *    table added later.
 */

declare(strict_types=1);

function prep_route_delete_account(string $userId, array $body): never
{
    $password = (string) ($body['password'] ?? '');

    if ($password === '') {
        prep_json(['error' => 'Enter your password to confirm.'], 422);
    }

    // Slow down someone working through guesses on a machine they have
    // borrowed rather than compromised.
    prep_rate_limit('delete:' . $userId, 5, 900);

    $db = prep_db();

    $stmt = $db->prepare(
        'SELECT id, email, display_name, password_hash, avatar_url, created_at
           FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        prep_json(['error' => 'No such user.'], 404);
    }

    if (!password_verify($password, $user['password_hash'])) {
        prep_json(['error' => 'That password is not right.'], 401);
    }

    // Counted before the delete, because afterwards there is nothing to count
    // and the operator notice is more useful with it than without.
    $interviews = 0;
    try {
        $count = $db->prepare('SELECT COUNT(*) FROM interviews WHERE user_id = ?');
        $count->execute([$userId]);
        $interviews = (int) $count->fetchColumn();
    } catch (Throwable $e) {
        error_log('[prep] could not count interviews before delete: ' . $e->getMessage());
    }

    $email   = (string) $user['email'];
    $name    = trim((string) ($user['display_name'] ?? ''));
    $avatar  = (string) ($user['avatar_url'] ?? '');
    $since   = (string) ($user['created_at'] ?? '');

    // Cascades through auth_tokens, interviews, reports, coding_attempts and
    // activity_days.
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);

    // The uploaded avatar is the one piece of the account that does not live
    // in the database, so the cascade cannot reach it. Path is checked rather
    // than trusted: it was written by us, but a stored value is still input.
    if ($avatar !== '' && str_starts_with($avatar, 'uploads/avatars/') && !str_contains($avatar, '..')) {
        @unlink(dirname(__DIR__) . '/' . $avatar);
    }

    // Mail comes last and never blocks the result. The account is already
    // gone; a mail failure must not report the deletion as failed, because a
    // retry would then find nothing to delete and look like a bug.
    try {
        prep_send_account_deleted($email, $name);
    } catch (Throwable $e) {
        error_log('[prep] account-deleted email failed: ' . $e->getMessage());
    }

    $adminAddress = $_ENV['ADMIN_EMAIL'] ?? '';
    if ($adminAddress !== '') {
        try {
            prep_send_admin_account_deleted($adminAddress, $email, $interviews, $since);
        } catch (Throwable $e) {
            error_log('[prep] admin deletion notice failed: ' . $e->getMessage());
        }
    }

    prep_json(['ok' => true]);
}
