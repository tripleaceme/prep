<?php
/**
 * Prep API — request/response plumbing and request authentication.
 *
 * This API is not public. The only caller is the Next.js app on Vercel, which
 * signs every request with a shared secret. That is what lets the app tell us
 * which user a request is for without MySQL ever being reachable from outside
 * the host.
 */

declare(strict_types=1);

function prep_json(mixed $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function prep_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Verify the HMAC signature Vercel attaches to every call.
 *
 * Signed material is "timestamp.method.path.body", so a captured request
 * cannot be replayed against a different route or after the window closes.
 */
function prep_verify_signature(string $method, string $path, string $rawBody): void
{
    $timestamp = $_SERVER['HTTP_X_PREP_TIMESTAMP'] ?? '';
    $signature = $_SERVER['HTTP_X_PREP_SIGNATURE'] ?? '';

    if ($timestamp === '' || $signature === '') {
        prep_json(['error' => 'Unsigned request'], 401);
    }

    if (!ctype_digit($timestamp)
        || abs(time() - (int) $timestamp) > PREP_SIGNATURE_WINDOW
    ) {
        prep_json(['error' => 'Signature expired'], 401);
    }

    $expected = hash_hmac(
        'sha256',
        $timestamp . '.' . $method . '.' . $path . '.' . $rawBody,
        prep_env('API_SHARED_SECRET')
    );

    // Constant-time, so a wrong signature leaks nothing through timing.
    if (!hash_equals($expected, $signature)) {
        prep_json(['error' => 'Bad signature'], 401);
    }
}

/**
 * The caller states which user the request is for. We trust it only because
 * the signature above proves the caller holds the shared secret.
 */
function prep_actor(): string
{
    $userId = $_SERVER['HTTP_X_PREP_USER'] ?? '';
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $userId)) {
        prep_json(['error' => 'Authentication required'], 401);
    }
    return $userId;
}

/** Crude per-key rate limit backed by the filesystem — enough for magic links. */
function prep_rate_limit(string $key, int $max, int $windowSeconds): void
{
    $dir = sys_get_temp_dir() . '/prep-rl';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = $dir . '/' . hash('sha256', $key);
    $now = time();

    $hits = is_readable($file)
        ? array_filter(
            array_map('intval', explode(',', (string) file_get_contents($file))),
            static fn (int $t): bool => $t > $now - $windowSeconds
        )
        : [];

    if (count($hits) >= $max) {
        prep_json(['error' => 'Too many requests. Try again shortly.'], 429);
    }

    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
}
