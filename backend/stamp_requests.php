<?php
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$staffPass = $_GET['staff_pass'] ?? '';
if ($staffPass !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

// NOTE: staff_pass in the query string leaks into server logs. Kept for
// backwards compatibility with the current staff page; prefer POST body.

// Pending stamp requests with customer name + phone + source
$pendingStmt = $pdo->query(
    "SELECT s.id, s.user_id, s.created_at, s.source, u.name, u.phone, u.stamps
     FROM Stamps s
     JOIN Users u ON u.id = s.user_id
     WHERE s.status = 'pending'
     ORDER BY s.id ASC
     LIMIT 100"
);
$pending = $pendingStmt->fetchAll();

// Customers ready for a reward (3+ stamps)
$rewardStmt = $pdo->query(
    "SELECT id, name, phone, stamps
     FROM Users
     WHERE stamps >= 3
     ORDER BY stamps DESC
     LIMIT 100"
);
$rewardReady = $rewardStmt->fetchAll();

// Active scratch cards awaiting staff redemption
$scratchStmt = $pdo->query(
    "SELECT c.id AS card_id, c.user_id, c.status, c.created_at, c.revealed_at,
            r.label AS reward_label, u.name, u.phone
     FROM ScratchCards c
     JOIN Rewards r ON r.id = c.reward_id
     JOIN Users u ON u.id = c.user_id
     WHERE c.status IN ('issued','revealed')
     ORDER BY c.id ASC
     LIMIT 100"
);
$scratchCards = $scratchStmt->fetchAll();

echo json_encode([
    "pending" => $pending,
    "reward_ready" => $rewardReady,
    "scratch_cards" => $scratchCards,
]);
?>
