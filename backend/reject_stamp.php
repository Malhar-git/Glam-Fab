<?php
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) $data = [];

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
    $sel = $pdo->prepare("SELECT user_id, source FROM Stamps WHERE id = ? AND status = 'pending' FOR UPDATE");
    $sel->execute([$stampId]);
    $row = $sel->fetch();
    if (!$row) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Stamp request not found or already handled"]);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE Stamps SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'");
    $stmt->execute([$stampId]);

    // A rejected review claim frees the one-time bonus so the user can retry
    // after actually posting the review.
    if ($row['source'] === 'review') {
        $upd = $pdo->prepare("UPDATE Users SET has_review_stamp = 0 WHERE id = ?");
        $upd->execute([$row['user_id']]);
    }
    $pdo->commit();
    echo json_encode(["message" => "Stamp rejected"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("reject_stamp failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not reject. Please try again."]);
}
?>
