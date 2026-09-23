<?php
/**
 * Prep API — database connection.
 *
 * MySQL is reached over localhost only. It is never exposed to the internet;
 * Remote MySQL should stay disabled on the cPanel account.
 */

declare(strict_types=1);

function prep_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        prep_env('DB_HOST', 'localhost'),
        prep_env('DB_PORT', '3306'),
        prep_env('DB_NAME')
    );

    try {
        $pdo = new PDO($dsn, prep_env('DB_USER'), prep_env('DB_PASS'), [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Real prepared statements, so parameters can never be parsed as SQL.
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        error_log('[prep] db connect failed: ' . $e->getMessage());
        prep_json(['error' => 'Database unavailable'], 503);
    }

    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

/** RFC 4122 v4 UUID, used for every primary key. */
function prep_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}
