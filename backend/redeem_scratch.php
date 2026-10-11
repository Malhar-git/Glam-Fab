<?php
// Staff redeems a revealed scratch card: card -> redeemed + stamps reset.
// Idempotent: redeeming twice returns success without double-spending.
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

if (empty($data['card_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing card_id"]);
    exit;
}
$cardId = (int)$data['card_id'];

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        "SELECT c.id, c.user_id, c.status, r.label AS reward_label
         FROM ScratchCards c JOIN Rewards r ON r.id = c.reward_id
         WHERE c.id = ? FOR UPDATE"
    );
    $stmt->execute([$cardId]);
    $card = $stmt->fetch();
    if (!$card) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Card not found"]);
        exit;
    }
    if ($card['status'] === 'redeemed') {
        $pdo->commit();
        echo json_encode(["message" => "Already redeemed", "reward" => $card['reward_label']]);
        exit;
    }
    if ($card['status'] !== 'revealed') {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(["error" => "Card must be scratched before redeeming."]);
        exit;
    }
    $upd = $pdo->prepare(
        "UPDATE ScratchCards SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    $upd->execute([$cardId]);

    $reset = $pdo->prepare("UPDATE Users SET stamps = 0 WHERE id = ?");
    $reset->execute([$card['user_id']]);

    $trans = $pdo->prepare(
        "INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, 0, ?)"
    );
    $trans->execute([$card['user_id'], 'Scratch redeemed: ' . $card['reward_label']]);

    $pdo->commit();
    echo json_encode(["message" => "Reward redeemed", "reward" => $card['reward_label']]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("redeem_scratch failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not redeem. Please try again."]);
}
?>
