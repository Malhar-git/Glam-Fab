<?php
// Same-origin friendly CORS. Previously `Access-Control-Allow-Origin: *`,
// which let any website call the stamp APIs. Now we reflect the Origin
// only when it matches this host (same-domain frontend) or an explicit
// allow-list, otherwise no CORS header is sent (same-origin still works).
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$host = $_SERVER['HTTP_HOST'] ?? '';
$extraAllowed = getenv('GLAM_ALLOWED_ORIGIN') ?: '';
if ($origin) {
    $oHost = parse_url($origin, PHP_URL_HOST);
    $allowed = ($oHost && ($oHost === $host || ($extraAllowed && $origin === $extraAllowed)));
    if ($allowed) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
    }
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (($_SERVER['REQUEST_METHOD'] ?? '') == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
