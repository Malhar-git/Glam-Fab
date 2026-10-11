<?php
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) $data = [];

if (!isset($data['uid']) || !is_string($data['uid']) || trim($data['uid']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

// NOTE: this endpoint trusts the Firebase UID sent by the client.
// For stronger security, send the Firebase ID token in the
// Authorization header and verify it server-side (Firebase Admin SDK),
// then use the verified uid instead of $data['uid'].
$uid = substr(trim($data['uid']), 0, 255);
$name = isset($data['name']) && is_string($data['name']) ? substr(trim($data['name']), 0, 255) : 'Unknown';
$email = isset($data['email']) && is_string($data['email']) ? substr(trim($data['email']), 0, 255) : null;
$phone = isset($data['phone']) && is_string($data['phone']) ? trim($data['phone']) : null;

if ($email !== null && $email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = null;
}
// Accept 10-digit Indian numbers (optionally prefixed with +91 / 91 / 0).
$digits = $phone !== null ? preg_replace('/\D/', '', $phone) : '';
if ($digits !== '') {
    $digits = preg_replace('/^(91|0)/', '', $digits);
    $phone = (preg_match('/^[6-9]\d{9}$/', $digits)) ? $digits : null;
} else {
    $phone = null;
}
if ($name === '') $name = 'Unknown';

// Check if user exists
$stmt = $pdo->prepare("SELECT id, name, email, phone, stamps, has_review_stamp FROM Users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if (!$user) {
    // Insert new user
    $insertStmt = $pdo->prepare("INSERT INTO Users (id, name, email, phone, stamps) VALUES (?, ?, ?, ?, 0)");
    $insertStmt->execute([$uid, $name, $email, $phone]);

    $stmt->execute([$uid]);
    $user = $stmt->fetch();
} else {
    // Update name/email always, but only overwrite phone if a real value is provided.
    // This prevents Google login (which never returns a phone number) from
    // wiping a phone number the customer manually entered.
    if ($phone) {
        $updateStmt = $pdo->prepare("UPDATE Users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $phone, $uid]);
    } else {
        $updateStmt = $pdo->prepare("UPDATE Users SET name = ?, email = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $uid]);
    }
    $stmt->execute([$uid]);
    $user = $stmt->fetch();
}

echo json_encode(["message" => "Login successful", "user" => $user]);
?>
