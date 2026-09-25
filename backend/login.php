<?php
require 'cors.php';
require 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['uid'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = $data['uid'];
$name = $data['name'] ?? 'Unknown';
$email = $data['email'] ?? null;
$phone = $data['phone'] ?? null;

// Check if user exists
$stmt = $pdo->prepare("SELECT * FROM Users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if (!$user) {
    // Insert new user
    $insertStmt = $pdo->prepare("INSERT INTO Users (id, name, email, phone, stamps) VALUES (?, ?, ?, ?, 0)");
    $insertStmt->execute([$uid, $name, $email, $phone]);
    
    // Fetch the newly created user
    $stmt->execute([$uid]);
    $user = $stmt->fetch();
} else {
    // Update name/email always, but only overwrite phone if a real value is provided.
    // This prevents Google login (which never returns a phone number) from
    // wiping a phone number the customer manually entered.
    if ($phone) {
        $updateStmt = $pdo->prepare("UPDATE Users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $phone, $uid]);
    } else {
        $updateStmt = $pdo->prepare("UPDATE Users SET name = ?, email = ? WHERE id = ?");
        $updateStmt->execute([$name, $email, $uid]);
    }
}

echo json_encode(["message" => "Login successful", "user" => $user]);
?>
