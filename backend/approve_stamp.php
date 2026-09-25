<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

$staffPass = $data['staff_pass'] ?? '';
if ($staffPass !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

if (!isset($data['stamp_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing stamp_id"]);
    exit;
}

$stampId = (int)$data['stamp_id'];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT id, user_id FROM Stamps WHERE id = ? AND status = 'pending' FOR UPDATE");
    $stmt->execute([$stampId]);
    $stamp = $stmt->fetch();

    if (!$stamp) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Stamp request not found or already handled"]);
        exit;
    }

    // Guard: ensure this user hasn't already received an approved stamp today (IST).
    $todayGuard = $pdo->prepare(
        "SELECT id FROM Stamps
         WHERE user_id = ?
           AND status = 'approved'
           AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
         LIMIT 1"
    );
    $todayGuard->execute([$stamp['user_id']]);
    if ($todayGuard->fetch()) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "This customer already received a stamp today."]);
        exit;
    }

    $approveStmt = $pdo->prepare("UPDATE Stamps SET status = 'approved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?");
    $approveStmt->execute([$stampId]);

    $userStmt = $pdo->prepare("UPDATE Users SET stamps = stamps + 1 WHERE id = ?");
    $userStmt->execute([$stamp['user_id']]);

    $transStmt = $pdo->prepare("INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, 1, 'Stamp approved by staff')");
    $transStmt->execute([$stamp['user_id']]);

    $pdo->commit();
    echo json_encode(["message" => "Stamp approved"]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
}
?>
