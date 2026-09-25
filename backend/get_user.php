<?php
require 'cors.php';
require 'db.php';

if (!isset($_GET['uid'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = $_GET['uid'];

$stmt = $pdo->prepare("SELECT * FROM Users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}

// Pending (unapproved) stamp request
$pendingStmt = $pdo->prepare("SELECT id FROM Stamps WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1");
$pendingStmt->execute([$uid]);
$pending = $pendingStmt->fetch();

echo json_encode([
    "user" => $user,
    "stamps" => (int)$user['stamps'],
    "pending_stamp" => (bool)$pending,
    "reward_ready" => (int)$user['stamps'] >= 3,
    "stamps_for_reward" => 3,
]);
