-- Migration: Add Two-Factor Authentication (2FA) support
-- Date: 2026-05-01
-- Purpose: Implement TOTP-based 2FA with backup codes for account recovery

-- ============================================================
-- ALTER users TABLE: Add 2FA fields
-- ============================================================

ALTER TABLE users
ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_fa_secret VARCHAR(255) NULL,
ADD COLUMN two_fa_backup_codes JSON NULL;

-- ============================================================
-- CREATE totp_attempts TABLE: Rate limiting TOTP verification
-- ============================================================

CREATE TABLE totp_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(50),
    success BOOLEAN,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempted_at),
    INDEX idx_ip_attempts (ip_address, attempted_at)
);
