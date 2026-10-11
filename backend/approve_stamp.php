<?php
require 'cors.php';
require 'db.php';
require 'scratch_lib.php';

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

    $stmt = $pdo->prepare("SELECT id, user_id, source FROM Stamps WHERE id = ? AND status = 'pending' FOR UPDATE");
    $stmt->execute([$stampId]);
    $stamp = $stmt->fetch();

    if (!$stamp) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Stamp request not found or already handled"]);
        exit;
    }

    // Lock the user row and enforce the 3-stamp cap inside the transaction
    // so a late approval can't push the counter to 4+.
    $userLock = $pdo->prepare("SELECT stamps FROM Users WHERE id = ? FOR UPDATE");
    $userLock->execute([$stamp['user_id']]);
    $lockedUser = $userLock->fetch();
    if (!$lockedUser) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
        exit;
    }
    if ((int)$lockedUser['stamps'] >= 3) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "Customer already has a full card. Redeem it first."]);
        exit;
    }

    // Guard: a customer can only receive one VISIT stamp per calendar day (IST).
    // Review-source stamps are exempt from this guard — the review bonus is
    // one-per-lifetime (enforced at request time via has_review_stamp), so it
    // can be approved the same day as a visit stamp without any abuse
    // potential.
    if (($stamp['source'] ?? 'visit') === 'visit') {
        $todayGuard = $pdo->prepare(
            "SELECT id FROM Stamps
             WHERE user_id = ?
               AND status = 'approved'
               AND source = 'visit'
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
    }

    $approveStmt = $pdo->prepare("UPDATE Stamps SET status = 'approved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?");
    $approveStmt->execute([$stampId]);

    $userStmt = $pdo->prepare("UPDATE Users SET stamps = stamps + 1 WHERE id = ?");
    $userStmt->execute([$stamp['user_id']]);

    $transStmt = $pdo->prepare("INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, 1, 'Stamp approved by staff')");
    $transStmt->execute([$stamp['user_id']]);

    $stampsAfter = (int)$lockedUser['stamps'] + 1;

    // 3rd stamp → issue the scratch card (uniform random over active rewards).
    $cardId = scratch_issue_if_eligible($pdo, $stamp['user_id'], $stampsAfter);
    if ($cardId !== null) {
        $cardTrans = $pdo->prepare(
            "INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, 0, 'Scratch card issued')"
        );
        $cardTrans->execute([$stamp['user_id']]);
    }

    $pdo->commit();
    echo json_encode(["message" => "Stamp approved", "scratch_issued" => $cardId !== null]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("approve_stamp failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not approve the stamp. Please try again."]);
}
?>
