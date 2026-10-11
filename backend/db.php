<?php
// DB credentials come from environment in production (Hostinger hPanel
// -> Advanced -> Environment Variables, or a non-committed .env loader).
// Fallbacks keep local XAMPP development working.
$host = getenv('GLAM_DB_HOST') ?: 'localhost';
$db   = getenv('GLAM_DB_NAME') ?: 'glam_fab_rewards';
$user = getenv('GLAM_DB_USER') ?: 'root';
$pass = getenv('GLAM_DB_PASS') ?: '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     http_response_code(500);
     echo json_encode(["error" => "Database connection failed"]);
     exit;
}
?>
