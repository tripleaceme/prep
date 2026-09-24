<?php
/**
 * Prep API — outbound email.
 *
 * Only used for password resets. Deliverability is the whole game here: a
 * reset link filtered to spam is a permanently locked account, and shared-host
 * mail() is filtered routinely. Resend is used when configured; mail() remains
 * as a fallback so the flow still works before a sending domain is verified.
 */

declare(strict_types=1);

function prep_send_reset_link(string $email, string $url): bool
{
    $expiry  = PREP_TOKEN_TTL_MINUTES;
    $subject = 'Reset your Prep password';

    $text = <<<TXT
    Reset your Prep password

    Use the link below to choose a new password. It works once and expires in
    {$expiry} minutes.

    {$url}

    If you didn't ask to reset your password, you can ignore this email — your
    current password still works and nothing has changed.

    Prep — Behind The Data Academy
    TXT;

    $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $html = <<<HTML
    <div style="background:#0a0c0b;padding:40px 20px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="max-width:480px;margin:0 auto;background:#101413;border:1px solid #222a28;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 8px;color:#e8eeec;font-size:22px">Reset your password</h1>
        <p style="margin:0 0 24px;color:#9aa8a4;font-size:15px;line-height:1.6">
          Use the button below to choose a new password. It works once and
          expires in {$expiry} minutes.
        </p>
        <a href="{$safeUrl}"
           style="display:inline-block;background:#0c877b;color:#ffffff;text-decoration:none;
                  padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
          Choose a new password
        </a>
        <p style="margin:24px 0 0;color:#6b7975;font-size:13px;line-height:1.6">
          If you didn't ask for this, you can ignore this email — your current
          password still works and nothing has changed.
        </p>
      </div>
    </div>
    HTML;

    $from = prep_env('MAIL_FROM', 'Prep <no-reply@behindthedata.tech>');
    $resendKey = $_ENV['RESEND_API_KEY'] ?? '';

    if ($resendKey !== '') {
        return prep_send_via_resend($resendKey, $from, $email, $subject, $html, $text);
    }

    $headers = [
        'From: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    return mail($email, $subject, $html, implode("\r\n", $headers));
}

function prep_send_via_resend(
    string $apiKey,
    string $from,
    string $to,
    string $subject,
    string $html,
    string $text
): bool {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from'    => $from,
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
            'text'    => $text,
        ]),
    ]);

    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status < 200 || $status >= 300) {
        error_log('[prep] resend failed (' . $status . '): ' . (string) $response);
        return false;
    }
    return true;
}
