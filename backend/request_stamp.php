<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['uid'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = $data['uid'];

// User must exist (created via login.php)
$stmt = $pdo->prepare("SELECT id, phone, stamps FROM Users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found. Sign in again."]);
    exit;
}

// Full card — reward must be redeemed first
if ((int)$user['stamps'] >= 3) {
    http_response_code(409);
    echo json_encode(["error" => "Your reward is ready! Ask the billing desk to redeem it."]);
    exit;
}

// Capture phone number if the customer provides it, so staff can see it.
if (isset($data['phone']) && $data['phone'] !== '') {
    $phoneStmt = $pdo->prepare("UPDATE Users SET phone = ? WHERE id = ?");
    $phoneStmt->execute([$data['phone'], $uid]);
}

// Do not allow stacking an unlimited queue of pending stamps.
$pendingStmt = $pdo->prepare("SELECT id FROM Stamps WHERE user_id = ? AND status = 'pending'");
$pendingStmt->execute([$uid]);
if ($pendingStmt->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "You already have a stamp waiting for approval."]);
    exit;
}

// One stamp per calendar day (IST = UTC+5:30).
// We convert MySQL's UTC timestamp to IST before comparing the date.
$todayStmt = $pdo->prepare(
    "SELECT id FROM Stamps
     WHERE user_id = ?
       AND status = 'approved'
       AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
     LIMIT 1"
);
$todayStmt->execute([$uid]);
if ($todayStmt->fetch()) {
    http_response_code(429);
    echo json_encode(["error" => "You've already earned a stamp today. Come back tomorrow!"]);
    exit;
}

$insertStmt = $pdo->prepare("INSERT INTO Stamps (user_id, status) VALUES (?, 'pending')");
$insertStmt->execute([$uid]);

echo json_encode(["message" => "Stamp requested"]);
?>
