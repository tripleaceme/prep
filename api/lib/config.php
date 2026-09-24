<?php
/**
 * Prep API — configuration.
 *
 * Reads api/.env (never committed). Keep this file, and the whole api/
 * directory, outside public_html if your plan allows it; if it must live
 * inside, the bundled .htaccess blocks direct access to .env and lib/.
 */

declare(strict_types=1);

function prep_load_env(string $path): void
{
    if (!is_readable($path)) {
        http_response_code(500);
        exit('Server is not configured.');
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $key = trim($key);
        $value = trim($value);
        // Strip optional surrounding quotes.
        if (strlen($value) >= 2
            && ($value[0] === '"' || $value[0] === "'")
            && $value[strlen($value) - 1] === $value[0]
        ) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '') {
            $_ENV[$key] = $value;
        }
    }
}

function prep_env(string $key, ?string $default = null): string
{
    $value = $_ENV[$key] ?? $default;
    if ($value === null) {
        http_response_code(500);
        exit('Missing configuration: ' . $key);
    }
    return $value;
}

prep_load_env(__DIR__ . '/../.env');

// Password reset links are short-lived: email is not a secure channel, and a
// stale reset link sitting in an inbox is a standing risk.
const PREP_TOKEN_TTL_MINUTES = 15;

// Verification links are not. They grant nothing beyond confirming an address
// the user already controls, and people genuinely do check their email the
// next morning — a 15-minute window would just generate support requests.
const PREP_VERIFY_TTL_HOURS = 48;

// Rejects replayed requests from Vercel outside this window, in seconds.
const PREP_SIGNATURE_WINDOW = 300;
