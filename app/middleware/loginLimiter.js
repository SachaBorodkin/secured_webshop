// =============================================================
// Middleware : rate limiting + lockout de compte
// =============================================================
// - 5 tentatives par minute par IP (rate limiting)
// - Verrouillage du compte après MAX_ATTEMPTS échecs consécutifs
// - Déblocage via token envoyé par email (stub ici) ou par admin
// =============================================================

const db = require('../config/db');

// Compteurs en mémoire par IP  { ip -> { count, resetAt } }
const ipAttempts = new Map();

const RATE_LIMIT          = 5;    // essais max par fenêtre
const RATE_WINDOW_MS      = 60_000; // 1 minute
const MAX_ACCOUNT_FAILS   = 10;   // échecs avant verrouillage compte

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function isIpBlocked(ip) {
    const entry = ipAttempts.get(ip);
    if (!entry) return false;
    if (Date.now() > entry.resetAt) {
        ipAttempts.delete(ip);
        return false;
    }
    return entry.count >= RATE_LIMIT;
}

function recordIpAttempt(ip) {
    const now  = Date.now();
    const entry = ipAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        ipAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    } else {
        entry.count++;
    }
}

function resetIpAttempts(ip) {
    ipAttempts.delete(ip);
}

// ------------------------------------------------------------------
// Enregistre un échec de login en BDD et verrouille si nécessaire
// Retourne true si le compte vient d'être verrouillé
// ------------------------------------------------------------------
function recordFailedLogin(email) {
    return new Promise((resolve, reject) => {
        const ip = 'N/A'; // passé en paramètre si besoin
        db.query(
            `INSERT INTO login_attempts (email, success, attempted_at)
             VALUES (?, 0, NOW())`,
            [email],
            (err) => {
                if (err) return reject(err);

                // Compte les échecs récents (dernières 24h) pour cet email
                db.query(
                    `SELECT COUNT(*) AS fails
                     FROM login_attempts
                     WHERE email = ? AND success = 0
                       AND attempted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
                    [email],
                    (err2, rows) => {
                        if (err2) return reject(err2);
                        const fails = rows[0].fails;
                        if (fails >= MAX_ACCOUNT_FAILS) {
                            // Verrouille le compte
                            db.query(
                                `UPDATE users SET locked = 1 WHERE email = ?`,
                                [email],
                                (err3) => {
                                    if (err3) return reject(err3);
                                    resolve(true); // compte verrouillé
                                }
                            );
                        } else {
                            resolve(false);
                        }
                    }
                );
            }
        );
    });
}

// ------------------------------------------------------------------
// Enregistre un succès et remet à zéro les tentatives de l'IP
// ------------------------------------------------------------------
function recordSuccessfulLogin(email, ip) {
    resetIpAttempts(ip);
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO login_attempts (email, success, attempted_at)
             VALUES (?, 1, NOW())`,
            [email],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

// ------------------------------------------------------------------
// Middleware Express : bloque si IP trop active
// ------------------------------------------------------------------
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    if (isIpBlocked(ip)) {
        return res.status(429).json({
            error: 'Trop de tentatives. Réessayez dans une minute.'
        });
    }
    recordIpAttempt(ip);
    next();
}

module.exports = {
    rateLimitMiddleware,
    recordFailedLogin,
    recordSuccessfulLogin,
    resetIpAttempts
};