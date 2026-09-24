<?php
/**
 * Prep API — throwaway deployment diagnostic.
 *
 * Upload this beside index.php, open it in a browser, fix whatever it reports,
 * then DELETE IT. It prints no secrets — only whether files exist, whether
 * extensions are loaded, and the exact error text PHP is otherwise swallowing.
 *
 * It deliberately does not include config.php at the top level, so it still
 * renders when config.php is the thing that is broken.
 */

declare(strict_types=1);

// The whole point is to see errors the live site is hiding.
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: text/plain; charset=utf-8');

$dir = __DIR__;
$ok = static fn (bool $c): string => $c ? 'OK  ' : 'FAIL';

echo "PREP API DIAGNOSTIC\n";
echo str_repeat('=', 60), "\n\n";

echo "PHP\n";
printf("  %s version        %s\n", $ok(PHP_VERSION_ID >= 80100), PHP_VERSION);
printf("  %s pdo_mysql      %s\n", $ok(extension_loaded('pdo_mysql')),
    extension_loaded('pdo_mysql') ? 'loaded' : 'MISSING — enable it in cPanel > Select PHP Version > Extensions');
printf("  %s curl           %s\n", $ok(extension_loaded('curl')),
    extension_loaded('curl') ? 'loaded' : 'missing (email sending will fall back to mail())');
printf("  %s mbstring       %s\n", $ok(extension_loaded('mbstring')),
    extension_loaded('mbstring') ? 'loaded' : 'MISSING — required');
echo "\n";

echo "FILES (relative to {$dir})\n";
$required = [
    'index.php',
    'lib/config.php',
    'lib/http.php',
    'lib/db.php',
    'lib/mail.php',
    'routes/auth.php',
    'routes/profile.php',
    'routes/interviews.php',
    'routes/analytics.php',
];
$missing = [];
foreach ($required as $file) {
    $path = $dir . '/' . $file;
    $exists = is_readable($path);
    if (!$exists) {
        $missing[] = $file;
    }
    printf("  %s %-26s %s\n", $ok($exists), $file,
        $exists ? number_format((float) filesize($path)) . ' bytes' : 'MISSING OR UNREADABLE');
}
echo "\n";

echo "CONFIG FILE (.env)\n";
$candidates = [
    dirname($dir) . '/prep-config/.env' => 'preferred — outside the web root',
    dirname($dir) . '/.prep-env'        => 'also outside the web root',
    $dir . '/.env'                      => 'INSIDE the web root — see warning below',
];
$found = null;
foreach ($candidates as $path => $note) {
    $exists = is_readable($path);
    if ($exists && $found === null) {
        $found = $path;
    }
    printf("  %s %-46s %s\n", $exists ? 'FOUND' : '  -  ', $path, $note);
}
if ($found === null) {
    echo "\n  !! No .env found in any location. Nothing will work until one exists.\n";
} elseif ($found === $dir . '/.env') {
    echo "\n  !! WARNING: .env sits inside the web root.\n";
    echo "     On this host nginx serves static files itself and ignores .htaccess,\n";
    echo "     so it is very likely readable at https://<this-domain>/.env\n";
    echo "     Move it to " . dirname($dir) . "/prep-config/.env and rotate every secret in it.\n";
}
echo "\n";

echo "LOADING EACH FILE IN ORDER\n";
if ($missing) {
    echo "  Skipped — fix the MISSING files above first.\n\n";
} else {
    foreach (['lib/config.php', 'lib/http.php', 'lib/db.php', 'lib/mail.php',
              'routes/auth.php', 'routes/profile.php', 'routes/interviews.php',
              'routes/analytics.php'] as $file) {
        try {
            require_once $dir . '/' . $file;
            printf("  %s %s\n", $ok(true), $file);
        } catch (Throwable $e) {
            printf("  %s %s\n        %s: %s\n        at %s:%d\n",
                $ok(false), $file, get_class($e), $e->getMessage(),
                $e->getFile(), $e->getLine());
            break;
        }
    }
    echo "\n";

    echo "DATABASE\n";
    try {
        $pdo = prep_db();
        $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        printf("  %s connected — %d table(s): %s\n", $ok(true), count($tables),
            $tables ? implode(', ', $tables) : 'none');

        $expected = ['users', 'auth_tokens', 'interviews', 'reports',
                     'coding_attempts', 'activity_days'];
        $absent = array_diff($expected, $tables);
        if ($absent) {
            printf("  %s missing tables: %s — import db/schema.sql\n",
                $ok(false), implode(', ', $absent));
        }
    } catch (Throwable $e) {
        printf("  %s %s\n", $ok(false), $e->getMessage());
    }
    echo "\n";
}

echo "REWRITING (.htaccess)\n";
echo "  This file was reached at: " . ($_SERVER['REQUEST_URI'] ?? '?') . "\n";
echo "  Server software:          " . ($_SERVER['SERVER_SOFTWARE'] ?? 'unknown') . "\n";
echo "  If /health returns 500 but this page renders, the fault is in index.php\n";
echo "  or its includes above — not in routing.\n\n";

echo str_repeat('=', 60), "\n";
echo "DELETE THIS FILE when you are done.\n";
