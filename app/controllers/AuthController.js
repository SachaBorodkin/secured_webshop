// =============================================================
// AuthController.js — version sécurisée complète
// Points couverts :
//   - Politique mot de passe fort (validation)
//   - JWT access token court (15 min) + refresh token (7j)
//   - Gestion d'exceptions sans fuite d'information
//   - Rate limiting + lockout (via loginLimiter)
// =============================================================

const db      = require('../config/db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { recordFailedLogin, recordSuccessfulLogin } = require('../middleware/loginLimiter.js');

const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS          = 10;

// ------------------------------------------------------------------
// Validation de la politique de mot de passe
// Règles : 8 car. min, 1 maj, 1 min, 1 chiffre, 1 spécial
// ------------------------------------------------------------------
function validatePassword(password) {
    const errors = [];
    if (!password || password.length < 8)
        errors.push('Au moins 8 caractères');
    if (!/[A-Z]/.test(password))
        errors.push('Au moins une majuscule');
    if (!/[a-z]/.test(password))
        errors.push('Au moins une minuscule');
    if (!/[0-9]/.test(password))
        errors.push('Au moins un chiffre');
    if (!/[^A-Za-z0-9]/.test(password))
        errors.push('Au moins un caractère spécial (!@#$%^&*...)');
    return errors;
}

// ------------------------------------------------------------------
// Génère les deux tokens
// ------------------------------------------------------------------
function generateTokens(userId, role) {
    const secret        = process.env.JWT_SECRET || 'secret_par_defaut';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_par_defaut';

    const accessToken = jwt.sign(
        { id: userId, role },
        secret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        refreshSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
}

// ------------------------------------------------------------------
// Sauvegarde le refresh token hashé en BDD
// ------------------------------------------------------------------
function saveRefreshToken(userId, rawToken) {
    const hashed    = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at)`,
            [userId, hashed, expiresAt],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

module.exports = {

    // ----------------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------------
    login: async (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;

        try {
            const { email, password } = req.body;

            // Validation minimale des entrées
            if (!email || !password) {
                return res.status(400).json({ error: 'Identifiants manquants' });
            }

            const [rows] = await db.promise().query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            // Compte inexistant : réponse volontairement vague
            if (rows.length === 0) {
                await recordFailedLogin(email);
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const user = rows[0];

            // Compte verrouillé
            if (user.locked) {
                return res.status(403).json({
                    error: 'Compte verrouillé. Contactez l\'administrateur ou vérifiez votre email.'
                });
            }

            // Vérification du mot de passe avec poivre
            const pepper  = process.env.DB_PEPPER || '';
            const isMatch = await bcrypt.compare(password + pepper, user.password);

            if (!isMatch) {
                const wasLocked = await recordFailedLogin(email);
                if (wasLocked) {
                    return res.status(403).json({
                        error: 'Trop de tentatives. Compte verrouillé. Vérifiez votre email.'
                    });
                }
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Succès : génère les tokens et enregistre le refresh
            await recordSuccessfulLogin(email, ip);
            const { accessToken, refreshToken } = generateTokens(user.id, user.role);
            await saveRefreshToken(user.id, refreshToken);

            // Refresh token en cookie httpOnly (non accessible par JS)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure:   process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge:   7 * 24 * 3600 * 1000
            });

            res.json({
                message:     'Connexion réussie',
                accessToken,
                user: { id: user.id, username: user.username, role: user.role }
            });

        } catch {
            // Aucune information technique exposée au client
            res.status(500).json({ error: 'Une erreur est survenue. Réessayez plus tard.' });
        }
    },

    // ----------------------------------------------------------
    // POST /api/auth/register
    // ----------------------------------------------------------
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Tous les champs sont requis' });
            }

            // Politique de mot de passe fort
            const pwErrors = validatePassword(password);
            if (pwErrors.length > 0) {
                return res.status(400).json({
                    error:  'Mot de passe trop faible',
                    details: pwErrors
                });
            }

            const pepper          = process.env.DB_PEPPER || '';
            const hashedPassword  = await bcrypt.hash(password + pepper, SALT_ROUNDS);

            await db.promise().query(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, 'user']
            );

            res.status(201).json({ message: 'Compte créé avec succès' });

        } catch (err) {
            // Seul le cas d'email dupliqué donne un message explicite
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }
            res.status(500).json({ error: 'Une erreur est survenue. Réessayez plus tard.' });
        }
    },

    // ----------------------------------------------------------
    // POST /api/auth/refresh
    // Échange un refresh token (cookie) contre un nouvel access token
    // ----------------------------------------------------------
    refresh: async (req, res) => {
        try {
            const rawToken = req.cookies?.refreshToken;
            if (!rawToken) {
                return res.status(401).json({ error: 'Aucun refresh token fourni' });
            }

            const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_par_defaut';
            let payload;
            try {
                payload = jwt.verify(rawToken, refreshSecret);
            } catch {
                return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
            }

            // Vérifie que le token est bien en BDD (non révoqué)
            const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
            const [rows] = await db.promise().query(
                `SELECT * FROM refresh_tokens
                 WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()`,
                [payload.id, hashed]
            );

            if (rows.length === 0) {
                return res.status(403).json({ error: 'Refresh token révoqué ou expiré' });
            }

            // Récupère le rôle actuel de l'utilisateur
            const [users] = await db.promise().query(
                'SELECT id, role FROM users WHERE id = ?',
                [payload.id]
            );
            if (users.length === 0) {
                return res.status(403).json({ error: 'Utilisateur introuvable' });
            }

            const { accessToken, refreshToken: newRefresh } = generateTokens(users[0].id, users[0].role);
            await saveRefreshToken(users[0].id, newRefresh);

            res.cookie('refreshToken', newRefresh, {
                httpOnly: true,
                secure:   process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge:   7 * 24 * 3600 * 1000
            });

            res.json({ accessToken });

        } catch {
            res.status(500).json({ error: 'Une erreur est survenue. Réessayez plus tard.' });
        }
    },

    // ----------------------------------------------------------
    // POST /api/auth/logout
    // Révoque le refresh token
    // ----------------------------------------------------------
    logout: async (req, res) => {
        try {
            const rawToken = req.cookies?.refreshToken;
            if (rawToken) {
                const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
                await db.promise().query(
                    'DELETE FROM refresh_tokens WHERE token_hash = ?',
                    [hashed]
                );
            }
            res.clearCookie('refreshToken');
            res.json({ message: 'Déconnexion réussie' });
        } catch {
            res.status(500).json({ error: 'Une erreur est survenue.' });
        }
    },

    // ----------------------------------------------------------
    // POST /api/auth/unlock  (admin uniquement)
    // Déverrouille un compte et efface ses tentatives échouées
    // ----------------------------------------------------------
    unlockAccount: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email requis' });
            }
            await db.promise().query(
                'UPDATE users SET locked = 0 WHERE email = ?',
                [email]
            );
            await db.promise().query(
                `DELETE FROM login_attempts WHERE email = ? AND success = 0`,
                [email]
            );
            res.json({ message: 'Compte déverrouillé' });
        } catch {
            res.status(500).json({ error: 'Une erreur est survenue.' });
        }
    }
};