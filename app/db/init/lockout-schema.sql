-- Migration: Add account lockout and login audit features
-- Date: 2026-04-24
-- Purpose: Implement rate limiting and account lockout to prevent brute force attacks

-- ============================================================
-- ALTER users TABLE: Add lockout fields
-- ============================================================

ALTER TABLE users
ADD COLUMN failed_attempts INT DEFAULT 0,
ADD COLUMN locked_until DATETIME NULL,
ADD COLUMN locked_at DATETIME NULL;

-- ============================================================
-- CREATE login_attempts TABLE: Audit trail for login attempts
-- ============================================================

CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(50),
    success BOOLEAN,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempted_at),
    INDEX idx_ip_attempts (ip_address, attempted_at)
);

-- ============================================================
-- Example query to check failed login attempts in last 60 seconds
-- ============================================================
-- SELECT COUNT(*) FROM login_attempts
-- WHERE ip_address = '192.168.1.1'
-- AND success = FALSE
-- AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE);

-- ============================================================
-- Example query to check account lock status
-- ============================================================
-- SELECT locked_until, failed_attempts FROM users
-- WHERE id = 1 AND locked_until > NOW();
