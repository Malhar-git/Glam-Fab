<?php
// Shared scratch-card helpers. Reward is always picked SERVER-SIDE
// with a uniform random draw over active rewards (equal probability).
// Gents haircut is not in the Rewards pool.

function scratch_pick_random_reward(PDO $pdo) {
    $stmt = $pdo->query("SELECT id FROM Rewards WHERE active = 1 ORDER BY id ASC");
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (!$ids) return null;
    return $ids[random_int(0, count($ids) - 1)];
}

// Issue a card if the user just reached 3 stamps and has no active card.
// Must be called INSIDE an open transaction with the user row locked.
function scratch_issue_if_eligible(PDO $pdo, $userId, $stampsAfter) {
    if ((int)$stampsAfter < 3) return null;
    $chk = $pdo->prepare(
        "SELECT id FROM ScratchCards WHERE user_id = ? AND status IN ('issued','revealed') LIMIT 1"
    );
    $chk->execute([$userId]);
    if ($chk->fetch()) return null; // already has an active card
    $rewardId = scratch_pick_random_reward($pdo);
    if ($rewardId === null) return null; // pool empty — don't block the stamp
    $ins = $pdo->prepare(
        "INSERT INTO ScratchCards (user_id, reward_id, status) VALUES (?, ?, 'issued')"
    );
    $ins->execute([$userId, $rewardId]);
    return (int)$pdo->lastInsertId();
}

// Lazily expire cards older than $days that are still issued/revealed.
function scratch_expire_old(PDO $pdo, $userId, $days = 30) {
    $stmt = $pdo->prepare(
        "UPDATE ScratchCards SET status = 'expired'
         WHERE user_id = ? AND status IN ('issued','revealed')
           AND created_at < (NOW() - INTERVAL " . (int)$days . " DAY)"
    );
    $stmt->execute([$userId]);
}
?>
