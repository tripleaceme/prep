<?php
/**
 * Prep API — configuration.
 *
 * Credentials live in `config.local.php` beside index.php, as a PHP file that
 * returns an array. Everything stays inside the one API folder.
 *
 * It is a .php file rather than a .env file for a specific reason. This host
 * runs nginx in front of Apache, and nginx serves static files itself without
 * ever consulting .htaccess — so a deny rule on .env does nothing, and an .env
 * here was being served publicly with the database password in it. A .php file
 * in the same folder is safe because the server *executes* it: requesting
 * config.local.php directly runs the file, which returns an array to nobody and
 * prints not one character.
 *
 * A leftover .env beside index.php is still read so an in-progress deployment
 * does not break mid-switch, but /health reports it as exposed and refuses to
 * pass until it is gone.
 */

declare(strict_types=1);

/**
 * Finds the config file.
 *
 * There is exactly one supported location: config.local.php beside index.php.
 *
 * A leftover .env in the same folder is still read, purely so an existing
 * deployment keeps working during the switch — but it is reported as `exposed`
 * so /health refuses to pass while it is there. It is a migration aid, not an
 * alternative.
 */
function prep_locate_config(string $apiDir): array
{
    // A .php file in the web root is safe: the server executes it rather than
    // handing it over, so requesting it directly prints nothing.
    if (is_readable($apiDir . '/config.local.php')) {
        return ['path' => $apiDir . '/config.local.php', 'kind' => 'php', 'exposed' => false];
    }

    // Leftover from before the switch. This host serves it as plain text.
    if (is_readable($apiDir . '/.env')) {
        return ['path' => $apiDir . '/.env', 'kind' => 'env', 'exposed' => true];
    }

    return ['path' => null, 'kind' => null, 'exposed' => false];
}

/** Loads a `config.local.php` that returns an array of key => value. */
function prep_load_php_config(string $path): void
{
    $values = require $path;

    if (!is_array($values)) {
        http_response_code(500);
        header('Content-Type: application/json');
        exit(json_encode([
            'error' => 'config.local.php must return an array, e.g. return ["DB_HOST" => "localhost"];',
        ]));
    }

    foreach ($values as $key => $value) {
        $_ENV[(string) $key] = (string) $value;
    }
}

function prep_load_env(?string $path): void
{
    if ($path === null || !is_readable($path)) {
        http_response_code(500);
        header('Content-Type: application/json');
        exit(json_encode([
            'error' => 'Server is not configured: create config.local.php beside '
                . 'index.php, copying config.local.php.example.',
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

$prepConfig = prep_locate_config(dirname(__DIR__));

if ($prepConfig['kind'] === 'php') {
    prep_load_php_config($prepConfig['path']);
} else {
    prep_load_env($prepConfig['path']);
}

// Surfaced by /health, so a config file the web server would hand over is
// reported rather than assumed safe.
define('PREP_ENV_EXPOSED', $prepConfig['exposed']);
define('PREP_ENV_PATH', (string) $prepConfig['path']);

// Password reset links are short-lived: email is not a secure channel, and a
// stale reset link sitting in an inbox is a standing risk.
const PREP_TOKEN_TTL_MINUTES = 15;

// Verification links are not. They grant nothing beyond confirming an address
// the user already controls, and people genuinely do check their email the
// next morning — a 15-minute window would just generate support requests.
const PREP_VERIFY_TTL_HOURS = 48;

// Rejects replayed requests from Vercel outside this window, in seconds.
const PREP_SIGNATURE_WINDOW = 300;
