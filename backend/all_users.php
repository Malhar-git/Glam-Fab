<?php
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['staff_pass']) || $_GET['staff_pass'] !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(200, max(1, (int)($_GET['limit'] ?? 100)));
$offset = ($page - 1) * $limit;

$stmt = $pdo->prepare(
    "SELECT id, name, email, phone, stamps, created_at FROM Users ORDER BY created_at DESC LIMIT :lim OFFSET :off"
);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();
$users = $stmt->fetchAll();

echo json_encode(["users" => $users, "page" => $page, "limit" => $limit]);
?>
