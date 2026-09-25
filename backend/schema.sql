-- Create database (if you have permission, else use Hostinger hPanel to create it)
-- CREATE DATABASE glam_fab_rewards;
-- USE glam_fab_rewards;

CREATE TABLE Users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    stamps INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reward_Transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    stamps_change INT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Stamps requested by scanning the billing-desk QR.
-- A stamp only counts once staff approves it.
CREATE TABLE Stamps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);