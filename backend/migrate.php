<?php
// One-time migration: run once in a browser as staff, then delete this file.
// URL: /backend/migrate.php?staff_pass=YOUR_STAFF_PASS
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

if (($_GET['staff_pass'] ?? '') !== 'GLAM_STAFF_PASS_PLACEHOLDER') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$ran = [];

$colExists = function ($table, $col) use ($pdo) {
    $s = $pdo->prepare(
        "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
    );
    $s->execute([$table, $col]);
    return (bool)$s->fetchColumn();
};

if (!$colExists('Users', 'has_review_stamp')) {
    $pdo->exec("ALTER TABLE Users ADD COLUMN has_review_stamp TINYINT(1) NOT NULL DEFAULT 0");
    $ran[] = "Users.has_review_stamp";
}
if (!$colExists('Users', 'review_verified_at')) {
    $pdo->exec("ALTER TABLE Users ADD COLUMN review_verified_at TIMESTAMP NULL DEFAULT NULL");
    $ran[] = "Users.review_verified_at";
}
if (!$colExists('Stamps', 'source')) {
    $pdo->exec("ALTER TABLE Stamps ADD COLUMN source ENUM('visit', 'review') NOT NULL DEFAULT 'visit'");
    $ran[] = "Stamps.source";
}

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS Rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        weight INT NOT NULL DEFAULT 1,
        active TINYINT(1) NOT NULL DEFAULT 1
    )"
);
$ran[] = "Rewards table ok";

$seed = ['Layer cut', 'Face de-tan', 'Manicure', 'Pedicure', 'Hair wash + blow dry', 'Fruit cleanup', 'Full face thread'];
$ins = $pdo->prepare("INSERT IGNORE INTO Rewards (label, weight, active) VALUES (?, 1, 1)");
foreach ($seed as $label) $ins->execute([$label]);
$ran[] = "Rewards seeded (7, equal weight)";

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS ScratchCards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        reward_id INT NOT NULL,
        status ENUM('issued', 'revealed', 'redeemed', 'expired') NOT NULL DEFAULT 'issued',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revealed_at TIMESTAMP NULL DEFAULT NULL,
        redeemed_at TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (reward_id) REFERENCES Rewards(id),
        INDEX idx_scratch_user_status (user_id, status)
    )"
);
$ran[] = "ScratchCards table ok";

echo json_encode(["message" => "Migration complete. Delete this file now.", "ran" => $ran]);
?>
