<?php
// Reveal an issued scratch card. The reward was fixed server-side at
// issue time; this endpoint only flips issued -> revealed and returns it.
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) $data = [];

if (empty($data['uid']) || !is_string($data['uid']) || empty($data['card_id'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

$uid = substr(trim($data['uid']), 0, 255);
$cardId = (int)$data['card_id'];

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        "SELECT c.id, c.status, r.label AS reward_label
         FROM ScratchCards c JOIN Rewards r ON r.id = c.reward_id
         WHERE c.id = ? AND c.user_id = ? FOR UPDATE"
    );
    $stmt->execute([$cardId, $uid]);
    $card = $stmt->fetch();
    if (!$card) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Card not found"]);
        exit;
    }
    if ($card['status'] === 'revealed' || $card['status'] === 'redeemed') {
        $pdo->commit();
        echo json_encode(["reward" => $card['reward_label'], "status" => $card['status']]);
        exit;
    }
    if ($card['status'] !== 'issued') {
        $pdo->rollBack();
        http_response_code(410);
        echo json_encode(["error" => "This card has expired."]);
        exit;
    }
    $upd = $pdo->prepare(
        "UPDATE ScratchCards SET status = 'revealed', revealed_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    $upd->execute([$cardId]);
    $pdo->commit();
    echo json_encode(["reward" => $card['reward_label'], "status" => "revealed"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("reveal_scratch failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not reveal the card. Please try again."]);
}
?>
