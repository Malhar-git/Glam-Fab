<?php
// Backfill / self-heal: a user with 3 stamps but no active card (e.g.
// stamps earned before the scratch feature launched) can claim their card.
require 'cors.php';
require 'db.php';
require 'scratch_lib.php';

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
        echo json_encode(["error" => "You need 3 stamps first."]);
        exit;
    }
    $cardId = scratch_issue_if_eligible($pdo, $uid, (int)$user['stamps']);
    $pdo->commit();
    echo json_encode(["message" => $cardId ? "Scratch card ready" : "Card already issued", "card_id" => $cardId]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("claim_scratch failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not issue the card. Please try again."]);
}
?>
