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

if (!isset($data['uid'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = $data['uid'];

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

    // Reset stamps after the reward is handed out
    $resetStmt = $pdo->prepare("UPDATE Users SET stamps = stamps - 3 WHERE id = ?");
    $resetStmt->execute([$uid]);

    $transStmt = $pdo->prepare("INSERT INTO Reward_Transactions (user_id, stamps_change, description) VALUES (?, -3, 'Reward redeemed by staff')");
    $transStmt->execute([$uid]);

    $pdo->commit();
    echo json_encode(["message" => "Reward redeemed"]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
}
?>
