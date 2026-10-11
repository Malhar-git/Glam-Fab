<?php
require 'cors.php';
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) $data = [];

if (!isset($data['uid']) || !is_string($data['uid']) || trim($data['uid']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Missing UID"]);
    exit;
}

$uid = substr(trim($data['uid']), 0, 255);

try {
    $pdo->beginTransaction();

    // Lock the user row so concurrent scans can't queue duplicate stamps.
    $stmt = $pdo->prepare("SELECT id, phone, stamps FROM Users WHERE id = ? FOR UPDATE");
    $stmt->execute([$uid]);
    $user = $stmt->fetch();

    if (!$user) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "User not found. Sign in again."]);
        exit;
    }

    // Full card — reward must be redeemed first
    if ((int)$user['stamps'] >= 3) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "Your reward is ready! Scratch your card to reveal it."]);
        exit;
    }

    // Capture phone number if the customer provides it, so staff can see it.
    if (isset($data['phone']) && is_string($data['phone']) && trim($data['phone']) !== '') {
        $digits = preg_replace('/\D/', '', $data['phone']);
        $digits = preg_replace('/^(91|0)/', '', $digits);
        if (preg_match('/^[6-9]\d{9}$/', $digits)) {
            $phoneStmt = $pdo->prepare("UPDATE Users SET phone = ? WHERE id = ?");
            $phoneStmt->execute([$digits, $uid]);
        }
    }

    // Do not allow stacking an unlimited queue of pending stamps.
    // FOR UPDATE keeps two simultaneous scans from both slipping through.
    $pendingStmt = $pdo->prepare(
        "SELECT id FROM Stamps WHERE user_id = ? AND status = 'pending' LIMIT 1 FOR UPDATE"
    );
    $pendingStmt->execute([$uid]);
    if ($pendingStmt->fetch()) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(["error" => "You already have a stamp waiting for approval."]);
        exit;
    }

    // One VISIT stamp per calendar day (IST). Review-source stamps are
    // exempt — the review bonus is one-per-lifetime and can coexist with a
    // same-day visit stamp. We convert MySQL's UTC timestamp to IST before
    // comparing the date.
    // NOTE: requires MySQL timezone tables; if CONVERT_TZ returns NULL the
    // guard is skipped — ensure tz tables are loaded on the host.
    $todayStmt = $pdo->prepare(
        "SELECT id FROM Stamps
         WHERE user_id = ?
           AND status = 'approved'
           AND source = 'visit'
           AND DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
         LIMIT 1"
    );
    $todayStmt->execute([$uid]);
    if ($todayStmt->fetch()) {
        $pdo->rollBack();
        http_response_code(429);
        echo json_encode(["error" => "You've already earned a stamp today. Come back tomorrow!"]);
        exit;
    }

    $insertStmt = $pdo->prepare("INSERT INTO Stamps (user_id, status, source) VALUES (?, 'pending', 'visit')");
    $insertStmt->execute([$uid]);

    $pdo->commit();
    echo json_encode(["message" => "Stamp requested"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("request_stamp failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Could not request a stamp. Please try again."]);
}
?>
