// =============================================================
// middleware/rateLimitAuth.js
// =============================================================
// Middleware for rate limiting login attempts
// Limits: 5 failed login attempts per minute per IP address
// =============================================================

const db = require('../config/db');
const requestIp = require('request-ip');

// In-memory store for IP-based rate limiting
// In production, use Redis for distributed systems
const ipAttempts = {};

// Configuration
const MAX_ATTEMPTS_PER_MINUTE = 5;
const ATTEMPT_WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up old data every 5 minutes

// ============================================================
// Clean up old entries from memory store periodically
// ============================================================
setInterval(() => {
    const now = Date.now();
    for (const ip in ipAttempts) {
        // Remove entries older than 2 minutes
        ipAttempts[ip] = ipAttempts[ip].filter(
            timestamp => now - timestamp < 2 * ATTEMPT_WINDOW_MS
        );

        // Remove IP if no more attempts
        if (ipAttempts[ip].length === 0) {
            delete ipAttempts[ip];
        }
    }
}, CLEANUP_INTERVAL_MS);

// ============================================================
// Rate Limiting Middleware
// ============================================================
module.exports = (req, res, next) => {
    // Extract client IP address
    req.clientIp = requestIp.getClientIp(req);

    // Get current attempts for this IP from memory store
    const now = Date.now();
    if (!ipAttempts[req.clientIp]) {
        ipAttempts[req.clientIp] = [];
    }

    // Filter out attempts older than the time window
    ipAttempts[req.clientIp] = ipAttempts[req.clientIp].filter(
        timestamp => now - timestamp < ATTEMPT_WINDOW_MS
    );

    // Check if IP has exceeded the limit
    if (ipAttempts[req.clientIp].length >= MAX_ATTEMPTS_PER_MINUTE) {
        return res.status(429).json({
            error: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.'
        });
    }

    // Store the attempt timestamp (will be marked as success/failure in controller)
    req.attemptTimestamp = now;

    next();
};

// ============================================================
// Function to record failed attempt
// Called by controller after failed login
// ============================================================
function recordFailedAttempt(clientIp) {
    if (!ipAttempts[clientIp]) {
        ipAttempts[clientIp] = [];
    }
    ipAttempts[clientIp].push(Date.now());
}

// ============================================================
// Function to log attempt to database
// Called by controller for audit trail
// ============================================================
function logLoginAttempt(userId, clientIp, success, callback) {
    const query = 'INSERT INTO login_attempts (user_id, ip_address, success) VALUES (?, ?, ?)';
    const values = [userId || null, clientIp, success ? 1 : 0];

    db.query(query, values, (err) => {
        if (err) {
            console.error('Error logging login attempt:', err);
        }
        if (callback) callback(err);
    });
}

module.exports.recordFailedAttempt = recordFailedAttempt;
module.exports.logLoginAttempt = logLoginAttempt;
