const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimitAuth = require('../middleware/rateLimitAuth');

module.exports = {

    // ----------------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------------
    login: async (req, res) => {
        const { email, password } = req.body;
        const clientIp = req.clientIp || 'unknown';

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Requête préparée pour éviter l'injection SQL
        const query = 'SELECT * FROM users WHERE email = ?';

        db.query(query, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // User doesn't exist
            if (results.length === 0) {
                // Log attempt with null user_id (user not found)
                rateLimitAuth.logLoginAttempt(null, clientIp, false);
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const user = results[0];

            // ========================================================
            // Check if account is locked
            // ========================================================
            if (user.locked_until) {
                const now = new Date();
                const lockedUntil = new Date(user.locked_until);

                if (lockedUntil > now) {
                    // Account is still locked
                    rateLimitAuth.logLoginAttempt(user.id, clientIp, false);
                    const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
                    return res.status(401).json({
                        error: `Compte temporairement verrouillé. Réessayez dans ${minutesRemaining} minute(s).`,
                        locked: true
                    });
                } else {
                    // Lock has expired, reset the account
                    const resetQuery = 'UPDATE users SET failed_attempts = 0, locked_until = NULL, locked_at = NULL WHERE id = ?';
                    db.query(resetQuery, [user.id], (err) => {
                        if (err) console.error('Error resetting lock:', err);
                    });
                }
            }

            const pepper = process.env.DB_PEPPER || '';

            // Vérification du mot de passe avec poivre
            const isMatch = await bcrypt.compare(password + pepper, user.password);

            if (!isMatch) {
                // ========================================================
                // Login failed: increment attempts and check for lockout
                // ========================================================
                const newFailedAttempts = (user.failed_attempts || 0) + 1;

                // Record failed attempt in memory store for rate limiting
                rateLimitAuth.recordFailedAttempt(clientIp);

                // Log attempt to database
                rateLimitAuth.logLoginAttempt(user.id, clientIp, false);

                // Check if account should be locked
                if (newFailedAttempts >= 5) {
                    // Lock account for 30 minutes
                    const lockUntil = new Date();
                    lockUntil.setMinutes(lockUntil.getMinutes() + 30);

                    const lockQuery = 'UPDATE users SET failed_attempts = ?, locked_until = ?, locked_at = NOW() WHERE id = ?';
                    db.query(lockQuery, [newFailedAttempts, lockUntil, user.id], (err) => {
                        if (err) console.error('Error locking account:', err);
                    });

                    return res.status(401).json({
                        error: 'Trop de tentatives échouées. Votre compte a été verrouillé pour 30 minutes.',
                        locked: true
                    });
                } else {
                    // Just increment the counter
                    const updateQuery = 'UPDATE users SET failed_attempts = ? WHERE id = ?';
                    db.query(updateQuery, [newFailedAttempts, user.id], (err) => {
                        if (err) console.error('Error updating failed attempts:', err);
                    });

                    return res.status(401).json({
                        error: 'Email ou mot de passe incorrect'
                    });
                }
            }

            // ========================================================
            // Login successful: reset attempt counters
            // ========================================================
            const resetQuery = 'UPDATE users SET failed_attempts = 0, locked_until = NULL, locked_at = NULL WHERE id = ?';
            db.query(resetQuery, [user.id], (err) => {
                if (err) console.error('Error resetting login attempts:', err);
            });

            // Log successful attempt
            rateLimitAuth.logLoginAttempt(user.id, clientIp, true);

            // Génération du JWT avec ID et Rôle
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'jagermeister',
                { expiresIn: '1h' }
            );

            res.json({
                message: 'Connexion réussie',
                token: token,
                user: { id: user.id, username: user.username, role: user.role }
            });
        });
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

            // Validation du username (alphanumeric + underscore, 3-30 characters)
            if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
                return res.status(400).json({
                    error: 'Le nom d\'utilisateur doit contenir 3-30 caractères (lettres, chiffres, tiret bas uniquement)'
                });
            }

            // Validation du format email
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Format d\'email invalide' });
            }

            // Validation de la force du mot de passe (minimum 8 caractères)
            if (password.length < 8) {
                return res.status(400).json({
                    error: 'Le mot de passe doit contenir au minimum 8 caractères'
                });
            }

            //Utilisation du poivre et sel (sel géré par bcrypt)
            const pepper = process.env.DB_PEPPER || '';
            const saltRounds = 10;
            const passwordWithPepper = password + pepper;

            //Hashage du mot de passe
            const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);

            //Requête préparée pour l'inscription
            const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            const values = [username, email, hashedPassword, 'user'];

            db.query(query, values, (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
                    }
                    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                }

                res.status(201).json({
                    message: 'Utilisateur enregistré avec succès',
                    userId: result.insertId
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur interne' });
        }
    }
};
