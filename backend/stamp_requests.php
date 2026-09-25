<?php
require 'cors.php';
require 'db.php';

$staffPass = $_GET['staff_pass'] ?? '';
if ($staffPass !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

// Pending stamp requests with customer name + phone
$pendingStmt = $pdo->query(
    "SELECT s.id, s.user_id, s.created_at, u.name, u.phone, u.stamps
     FROM Stamps s
     JOIN Users u ON u.id = s.user_id
     WHERE s.status = 'pending'
     ORDER BY s.id ASC"
);
$pending = $pendingStmt->fetchAll();

// Customers ready for a reward (3+ stamps)
$rewardStmt = $pdo->query(
    "SELECT id, name, phone, stamps
     FROM Users
     WHERE stamps >= 3
     ORDER BY stamps DESC"
);
$rewardReady = $rewardStmt->fetchAll();

echo json_encode([
    "pending" => $pending,
    "reward_ready" => $rewardReady,
]);
?>
