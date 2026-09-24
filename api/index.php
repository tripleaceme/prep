<?php
/**
 * Prep API — front controller.
 *
 * Everything under /api is routed here by .htaccess. Every request must carry
 * a valid HMAC signature from the Next.js app; requests that touch user data
 * must also name the user. Nothing here is reachable from a browser.
 */

declare(strict_types=1);

// `never` return types and readonly semantics used below need 8.1. Failing
// loudly here beats a bare 500 with no explanation in the cPanel error log.
if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    header('Content-Type: application/json');
    exit(json_encode([
        'error' => 'Prep requires PHP 8.1 or newer. This account is running ' . PHP_VERSION
            . '. Change it in cPanel → Select PHP Version.',
    ]));
}

require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/profile.php';
require __DIR__ . '/routes/interviews.php';
require __DIR__ . '/routes/analytics.php';

// No browser should ever reach this API directly, so there is no CORS policy
// to relax — omitting the header is the policy.
header_remove('X-Powered-By');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path   = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');

// Strip the mount point, so the API works at /api or at a subdomain root.
$path = preg_replace('#^api/?#', '', $path) ?? '';
$path = trim($path, '/');

$rawBody = file_get_contents('php://input') ?: '';
prep_verify_signature($method, $path, $rawBody);

$body = prep_body();

match (true) {
    // Signed, so it can report detail without exposing it publicly.
    $method === 'GET' && $path === 'health'
        => prep_route_health(),

    $method === 'POST' && $path === 'auth/register'
        => prep_route_register($body),

    $method === 'POST' && $path === 'auth/login'
        => prep_route_login($body),

    $method === 'POST' && $path === 'auth/request-reset'
        => prep_route_request_reset($body),

    $method === 'POST' && $path === 'auth/reset'
        => prep_route_reset_password($body),

    $method === 'POST' && $path === 'auth/verify-email'
        => prep_route_verify_email($body),

    // Actor-scoped, so nobody can trigger mail to an address they don't own.
    $method === 'POST' && $path === 'auth/resend-verification'
        => prep_route_resend_verification(prep_actor()),

    // Guarded by the admin session in the Next.js app, not by prep_actor():
    // analytics is not scoped to a user.
    $method === 'GET'  && $path === 'analytics'
        => prep_route_analytics(),

    $method === 'GET'  && $path === 'profile'
        => prep_route_get_profile(prep_actor()),

    $method === 'POST' && $path === 'profile'
        => prep_route_save_onboarding(prep_actor(), $body),

    $method === 'GET'  && $path === 'dashboard'
        => prep_route_dashboard(prep_actor()),

    $method === 'POST' && $path === 'activity'
        => prep_route_record_activity(prep_actor(), $body),

    $method === 'POST' && $path === 'interviews'
        => prep_route_start_interview(prep_actor(), $body),

    $method === 'POST' && $path === 'interviews/complete'
        => prep_route_complete_interview(prep_actor(), $body),

    $method === 'GET'  && $path === 'reports'
        => prep_route_list_reports(prep_actor()),

    $method === 'GET'  && preg_match('#^reports/([0-9a-f-]{36})$#', $path, $m) === 1
        => prep_route_get_report(prep_actor(), $m[1]),

    $method === 'GET'  && $path === 'coding'
        => prep_route_list_coding(prep_actor()),

    $method === 'POST' && $path === 'coding'
        => prep_route_save_coding(prep_actor(), $body),

    default => prep_json(['error' => 'Not found'], 404),
};
