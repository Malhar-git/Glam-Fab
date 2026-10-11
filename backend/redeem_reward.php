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

if (!isset($data['uid']) || !is_string($data['uid']) || trim($data['uid']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = substr(trim($data['uid']), 0, 255);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT stamps FROM Users WHERE id = ? FOR UPDATE");
    $stmt->execute([$uid]);
    $user = $stmt->fetch();

    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
        exit;
    }

    if ((int)$user['stamps'] < 3) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["error" => "Customer needs 3 stamps to redeem"]);
        exit;
    }

    // Legacy fallback redeem (no scratch card). Prefer redeem_scratch.php,
    // which redeems the specific card. Close any active cards here too so
    // the user can't double-claim after a manual reset.
    $closeCards = $pdo->prepare(
        "UPDATE ScratchCards SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND status IN ('issued','revealed')"
    );
    $closeCards->execute([$uid]);

    // Reset stamps after the reward is handed out
    $resetStmt = $pdo->prepare("UPDATE Users SET stamps = 0 WHERE id = ?");
    $resetStmt->execute([$uid]);

    $transStmt = $pdo->prepare("INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, -3, 'Reward redeemed by staff')");
    $transStmt->execute([$uid]);

    $pdo->commit();
    echo json_encode(["message" => "Reward redeemed"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("redeem_reward failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not redeem. Please try again."]);
}
?>
