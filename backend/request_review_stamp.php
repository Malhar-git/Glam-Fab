<?php
// Google-review bonus stamp: one per user, ever. Creates a PENDING stamp
// with source='review' that staff verifies (checks the GBP review / asks
// to see the phone screen) and approves via the normal approve flow.
// Google offers no client-side "did they review?" callback, so manual
// staff verification is the fraud-safe option.
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) $data = [];

if (empty($data['uid']) || !is_string($data['uid'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}
$uid = substr(trim($data['uid']), 0, 255);

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT id, stamps, has_review_stamp FROM Users WHERE id = ? FOR UPDATE");
    $stmt->execute([$uid]);
    $user = $stmt->fetch();
    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "User not found. Sign in again."]);
        exit;
    }
    if ((int)$user['has_review_stamp'] === 1) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "You've already claimed the Google-review bonus."]);
        exit;
    }
    if ((int)$user['stamps'] >= 3) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "Your reward is ready! Scratch your card first."]);
        exit;
    }
    $pendingStmt = $pdo->prepare(
        "SELECT id FROM Stamps WHERE user_id = ? AND status = 'pending' LIMIT 1 FOR UPDATE"
    );
    $pendingStmt->execute([$uid]);
    if ($pendingStmt->fetch()) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "You already have a stamp waiting for approval."]);
        exit;
    }

    // NOTE: no "one stamp per day" check here, unlike request_stamp.php.
    // That cap guards against multiple VISIT stamps per day. This bonus is
    // already one-per-lifetime (has_review_stamp above), so applying the
    // daily cap only blocked customers who earned a visit stamp the same
    // day they wrote their review.
    $ins = $pdo->prepare("INSERT INTO Stamps (user_id, status, source) VALUES (?, 'pending', 'review')");
    $ins->execute([$uid]);
    // Mark claimed at REQUEST time (not approval) so it can't be double-claimed.
    $upd = $pdo->prepare("UPDATE Users SET has_review_stamp = 1 WHERE id = ?");
    $upd->execute([$uid]);
    $pdo->commit();
    echo json_encode(["message" => "Review stamp requested. Show your review at the billing desk for approval."]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("request_review_stamp failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not request the bonus stamp. Please try again."]);
}
?>
