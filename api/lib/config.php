<?php
/**
 * Prep API — configuration.
 *
 * The .env file is looked for ONE LEVEL ABOVE the document root first, and
 * only falls back to sitting beside index.php.
 *
 * That order is deliberate and was learned the hard way. On this host nginx
 * sits in front of Apache and serves static files itself, without ever reading
 * .htaccess — so a `FilesMatch` deny on .env protects nothing, and the file was
 * being served publicly with the database password in it. A file the web server
 * cannot reach needs no rule to protect it.
 */

declare(strict_types=1);

/**
 * Finds .env, preferring a location outside the web root.
 *
 * Returns the path, and whether it is in a web-reachable directory — the
 * health check reports the unsafe case loudly rather than letting it sit.
 */
function prep_locate_env(string $apiDir): array
{
    $candidates = [
        // Preferred: one level above the document root, unreachable over HTTP.
        dirname($apiDir) . '/prep-config/.env',
        dirname($apiDir) . '/.prep-env',
        // Fallback: beside index.php. Works, but is only as private as the
        // web server's configuration — which on this host is not enough.
        $apiDir . '/.env',
    ];

    foreach ($candidates as $index => $path) {
        if (is_readable($path)) {
            return ['path' => $path, 'exposed' => $index === count($candidates) - 1];
        }
    }

    return ['path' => null, 'exposed' => false];
}

function prep_load_env(?string $path): void
{
    if ($path === null || !is_readable($path)) {
        http_response_code(500);
        header('Content-Type: application/json');
        exit(json_encode([
            'error' => 'Server is not configured: no .env file found. Expected it at '
                . '../prep-config/.env (preferred) or beside index.php.',
        ]));
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

$prepEnv = prep_locate_env(dirname(__DIR__));
prep_load_env($prepEnv['path']);

// Surfaced by /health so an exposed .env is reported rather than assumed safe.
define('PREP_ENV_EXPOSED', $prepEnv['exposed']);
define('PREP_ENV_PATH', (string) $prepEnv['path']);

// Password reset links are short-lived: email is not a secure channel, and a
// stale reset link sitting in an inbox is a standing risk.
const PREP_TOKEN_TTL_MINUTES = 15;

// Verification links are not. They grant nothing beyond confirming an address
// the user already controls, and people genuinely do check their email the
// next morning — a 15-minute window would just generate support requests.
const PREP_VERIFY_TTL_HOURS = 48;

// Rejects replayed requests from Vercel outside this window, in seconds.
const PREP_SIGNATURE_WINDOW = 300;
