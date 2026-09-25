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

$stmt = $pdo->prepare("UPDATE Stamps SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'");
$stmt->execute([$stampId]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(["error" => "Stamp request not found or already handled"]);
    exit;
}

echo json_encode(["message" => "Stamp rejected"]);
?>
