<?php
/**
 * Prep API — outbound email.
 *
 * Used for password resets and email confirmation. Deliverability is the whole
 * game: a link filtered to spam is a locked account.
 *
 * SPF, DKIM and DMARC all pass on this domain, so what is left is reputation
 * and shape. Two things here work against the filters and are deliberate:
 * the sender is a real, replyable address rather than no-reply@ (which several
 * providers score down on its own), and every message carries a Reply-To so a
 * reply lands somewhere a human reads. Marking a message "not spam" and
 * replying to it are the two strongest positive signals a new sending domain
 * can earn.
 */

declare(strict_types=1);

function prep_send_reset_link(string $email, string $url): bool
{
    $expiry  = PREP_TOKEN_TTL_MINUTES;
    $subject = 'Prep: reset your password';

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

    return prep_send_email($email, $subject, $html, $text);
}

function prep_send_verification_link(string $email, string $url): bool
{
    $hours   = PREP_VERIFY_TTL_HOURS;
    $subject = 'Prep: confirm your email address';

    $text = <<<TXT
    Confirm your email

    You're already signed in and can use Prep right away — confirming just lets
    us reach you if you ever need to reset your password.

    {$url}

    This link works once and expires in {$hours} hours.

    If you didn't create a Prep account, you can ignore this email and nothing
    further will happen.

    Prep — Behind The Data Academy
    TXT;

    $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $html = <<<HTML
    <div style="background:#0a0c0b;padding:40px 20px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="max-width:480px;margin:0 auto;background:#101413;border:1px solid #222a28;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 8px;color:#e8eeec;font-size:22px">Confirm your email</h1>
        <p style="margin:0 0 24px;color:#9aa8a4;font-size:15px;line-height:1.6">
          You're already signed in and can use Prep right away — confirming just
          lets us reach you if you ever need to reset your password.
        </p>
        <a href="{$safeUrl}"
           style="display:inline-block;background:#0c877b;color:#ffffff;text-decoration:none;
                  padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px">
          Confirm my email
        </a>
        <p style="margin:24px 0 0;color:#6b7975;font-size:13px;line-height:1.6">
          This link works once and expires in {$hours} hours. If you didn't
          create a Prep account, ignore this email and nothing further happens.
        </p>
      </div>
    </div>
    HTML;

    return prep_send_email($email, $subject, $html, $text);
}

/** Shared transport: Resend when configured, PHP mail() otherwise. */
function prep_send_email(
    string $to,
    string $subject,
    string $html,
    string $text
): bool {
    $from = prep_env('MAIL_FROM', 'Prep <hello@behindthedata.tech>');
    // Falls back to the From address, so there is always somewhere to reply.
    $replyTo = $_ENV['MAIL_REPLY_TO'] ?? '';
    $resendKey = $_ENV['RESEND_API_KEY'] ?? '';

    if ($resendKey !== '') {
        return prep_send_via_resend($resendKey, $from, $to, $subject, $html, $text, $replyTo);
    }

    $headers = [
        'From: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    if ($replyTo !== '') {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    return mail($to, $subject, $html, implode("\r\n", $headers));
}

function prep_send_via_resend(
    string $apiKey,
    string $from,
    string $to,
    string $subject,
    string $html,
    string $text,
    string $replyTo = ''
): bool {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode(array_filter([
            'from'     => $from,
            'to'       => [$to],
            'subject'  => $subject,
            'html'     => $html,
            'text'     => $text,
            'reply_to' => $replyTo !== '' ? $replyTo : null,
            // Transactional mail, so it must not be grouped with anything
            // promotional a sending domain might send later.
            'tags'     => [['name' => 'category', 'value' => 'transactional']],
        ])),
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
