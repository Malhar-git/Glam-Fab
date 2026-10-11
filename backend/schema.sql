-- Glam & Fab rewards database
-- Run the ALTER / CREATE statements below on an existing DB.
-- Fresh installs: the full schema (including scratch cards) is created.

CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    stamps INT DEFAULT 0,
    has_review_stamp TINYINT(1) NOT NULL DEFAULT 0,
    review_verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Reward_Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    stamps_change INT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Stamps requested by scanning the billing-desk QR (source='visit')
-- or by claiming the Google-review bonus (source='review').
-- A stamp only counts once staff approves it.
CREATE TABLE IF NOT EXISTS Stamps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    source ENUM('visit', 'review') NOT NULL DEFAULT 'visit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    INDEX idx_stamps_user_status (user_id, status)
);

-- Scratch-card reward pool. All rows carry equal weight (1) so every
-- reward has the same probability: P = 1 / (number of active rewards).
-- Gents haircut is intentionally NOT in this list.
CREATE TABLE IF NOT EXISTS Rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE,
    weight INT NOT NULL DEFAULT 1,
    active TINYINT(1) NOT NULL DEFAULT 1
);

INSERT IGNORE INTO Rewards (label, weight, active) VALUES
    ('Layer cut', 1, 1),
    ('Face de-tan', 1, 1),
    ('Manicure', 1, 1),
    ('Pedicure', 1, 1),
    ('Hair wash + blow dry', 1, 1),
    ('Fruit cleanup', 1, 1),
    ('Full face thread', 1, 1);

-- One scratch card is issued when a user reaches 3 stamps.
-- reward_id is picked SERVER-SIDE at issue time (uniform random over
-- active rewards). The client only learns the reward on reveal.
CREATE TABLE IF NOT EXISTS ScratchCards (
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
);

-- --- Migration for existing installs ---
-- The CREATE TABLE IF NOT EXISTS statements above do NOT add columns to
-- tables that already exist. If you already have Users / Stamps tables,
-- run backend/migrate.php once in a browser (staff-only), or run these:
--   ALTER TABLE Users ADD COLUMN has_review_stamp TINYINT(1) NOT NULL DEFAULT 0;
--   ALTER TABLE Users ADD COLUMN review_verified_at TIMESTAMP NULL DEFAULT NULL;
--   ALTER TABLE Stamps ADD COLUMN source ENUM('visit', 'review') NOT NULL DEFAULT 'visit';
