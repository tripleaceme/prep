<?php
/**
 * Prep API — front controller.
 *
 * Everything under /api is routed here by .htaccess. Every request must carry
 * a valid HMAC signature from the Next.js app; requests that touch user data
 * must also name the user. Nothing here is reachable from a browser.
 */

declare(strict_types=1);

require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/profile.php';

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
    $method === 'POST' && $path === 'auth/request-link'
        => prep_route_request_link($body),

    $method === 'POST' && $path === 'auth/verify'
        => prep_route_verify($body),

    $method === 'GET'  && $path === 'profile'
        => prep_route_get_profile(prep_actor()),

    $method === 'POST' && $path === 'profile'
        => prep_route_save_onboarding(prep_actor(), $body),

    $method === 'GET'  && $path === 'dashboard'
        => prep_route_dashboard(prep_actor()),

    $method === 'POST' && $path === 'activity'
        => prep_route_record_activity(prep_actor(), $body),

    default => prep_json(['error' => 'Not found'], 404),
};
