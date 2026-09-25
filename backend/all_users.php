<?php
require 'cors.php';
require 'db.php';

if (!isset($_GET['staff_pass']) || $_GET['staff_pass'] !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$stmt = $pdo->query(
    "SELECT id, name, email, phone, stamps, created_at FROM Users ORDER BY created_at DESC"
);
$users = $stmt->fetchAll();

echo json_encode(["users" => $users]);
?>
