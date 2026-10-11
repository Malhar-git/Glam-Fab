<?php
require 'cors.php';
require 'db.php';
require 'scratch_lib.php';

header('Content-Type: application/json');

if (!isset($_GET['uid']) || !is_string($_GET['uid']) || trim($_GET['uid']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = substr(trim($_GET['uid']), 0, 255);

// Never SELECT * — return only what the client needs.
$stmt = $pdo->prepare(
    "SELECT id, name, email, phone, stamps, has_review_stamp FROM Users WHERE id = ?"
);
$stmt->execute([$uid]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
    exit;
}

// Expire stale cards so the client never sees a dead reward.
try {
    scratch_expire_old($pdo, $uid, 30);
} catch (Exception $e) {
    error_log("scratch expiry failed: " . $e->getMessage());
}

// Pending (unapproved) stamp request
$pendingStmt = $pdo->prepare("SELECT id FROM Stamps WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1");
$pendingStmt->execute([$uid]);
$pending = $pendingStmt->fetch();

// Active scratch card (reward label hidden until revealed).
$cardStmt = $pdo->prepare(
    "SELECT c.id, c.status, c.created_at, c.revealed_at, r.label AS reward_label
     FROM ScratchCards c JOIN Rewards r ON r.id = c.reward_id
     WHERE c.user_id = ? AND c.status IN ('issued','revealed')
     ORDER BY c.id DESC LIMIT 1"
);
$cardStmt->execute([$uid]);
$card = $cardStmt->fetch() ?: null;
if ($card && $card['status'] === 'issued') {
    unset($card['reward_label']); // keep it a surprise until reveal
}

echo json_encode([
    "user" => $user,
    "stamps" => (int)$user['stamps'],
    "pending_stamp" => (bool)$pending,
    "reward_ready" => (int)$user['stamps'] >= 3,
    "stamps_for_reward" => 3,
    "scratch_card" => $card,
    "review_stamp_available" => ((int)$user['has_review_stamp'] === 0),
]);
