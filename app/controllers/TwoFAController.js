const db = require('../config/db');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
};

const hashBackupCode = (code) => {
    return crypto.createHash('sha256').update(code).digest('hex');
};

module.exports = {
    setup2FA: async (req, res) => {
        try {
            const userId = req.user.id;

            const query = 'SELECT * FROM users WHERE id = ?';
            db.query(query, [userId], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Erreur serveur' });
                if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

                const user = results[0];

                const secret = speakeasy.generateSecret({
                    name: `Secure Shop (${user.email})`,
                    issuer: 'Secure Shop',
                    length: 32
                });

                const backupCodes = generateBackupCodes();
                const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

                try {
                    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

                    res.json({
                        qrCode: qrCode,
                        secret: secret.base32,
                        backupCodes: backupCodes,
                        message: 'Scannez le code QR avec votre application d\'authentification'
                    });
                } catch (qrErr) {
                    res.status(500).json({ error: 'Erreur lors de la génération du code QR' });
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur interne' });
        }
    },

    verify2FASetup: async (req, res) => {
        try {
            const userId = req.user.id;
            const { totp, secret } = req.body;

            if (!totp || !secret) {
                return res.status(400).json({ error: 'Code TOTP et secret requis' });
            }

            const isValidToken = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: totp,
                window: 2
            });

            if (!isValidToken) {
                return res.status(401).json({ error: 'Code TOTP invalide' });
            }

            const backupCodes = generateBackupCodes();
            const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

            const updateQuery = 'UPDATE users SET two_fa_enabled = TRUE, two_fa_secret = ?, two_fa_backup_codes = ? WHERE id = ?';
            db.query(updateQuery, [secret, JSON.stringify(hashedBackupCodes), userId], (err) => {
                if (err) return res.status(500).json({ error: 'Erreur lors de l\'activation 2FA' });

                res.json({
                    message: '2FA activé avec succès',
                    backupCodes: backupCodes
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur interne' });
        }
    },

    disable2FA: async (req, res) => {
        try {
            const userId = req.user.id;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Mot de passe requis' });
            }

            const query = 'SELECT password FROM users WHERE id = ?';
            db.query(query, [userId], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Erreur serveur' });
                if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

                const bcrypt = require('bcrypt');
                const pepper = process.env.DB_PEPPER || '';
                const isMatch = await bcrypt.compare(password + pepper, results[0].password);

                if (!isMatch) {
                    return res.status(401).json({ error: 'Mot de passe incorrect' });
                }

                const updateQuery = 'UPDATE users SET two_fa_enabled = FALSE, two_fa_secret = NULL, two_fa_backup_codes = NULL WHERE id = ?';
                db.query(updateQuery, [userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Erreur lors de la désactivation 2FA' });
                    res.json({ message: '2FA désactivé avec succès' });
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur interne' });
        }
    },

    verifyTOTPLogin: async (req, res) => {
        try {
            const { tempToken, totp, backupCode } = req.body;
            const clientIp = req.clientIp || 'unknown';

            if (!tempToken) {
                return res.status(400).json({ error: 'Token temporaire requis' });
            }

            if (!totp && !backupCode) {
                return res.status(400).json({ error: 'Code TOTP ou code de secours requis' });
            }

            const jwt = require('jsonwebtoken');
            let decoded;
            try {
                decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'jagermeister');
            } catch (err) {
                return res.status(401).json({ error: 'Token temporaire invalide ou expiré' });
            }

            if (!decoded.pending_2fa) {
                return res.status(401).json({ error: 'Token 2FA non valide' });
            }

            const query = 'SELECT * FROM users WHERE id = ?';
            db.query(query, [decoded.id], async (err, results) => {
                if (err) return res.status(500).json({ error: 'Erreur serveur' });
                if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

                const user = results[0];

                if (totp) {
                    const isValidToken = speakeasy.totp.verify({
                        secret: user.two_fa_secret,
                        encoding: 'base32',
                        token: totp,
                        window: 2
                    });

                    if (!isValidToken) {
                        db.query('INSERT INTO totp_attempts (user_id, ip_address, success) VALUES (?, ?, FALSE)',
                            [user.id, clientIp], () => {});
                        return res.status(401).json({ error: 'Code TOTP invalide' });
                    }
                } else if (backupCode) {
                    const backupCodes = JSON.parse(user.two_fa_backup_codes || '[]');
                    const codeHash = hashBackupCode(backupCode);
                    const codeIndex = backupCodes.indexOf(codeHash);

                    if (codeIndex === -1) {
                        return res.status(401).json({ error: 'Code de secours invalide' });
                    }

                    backupCodes.splice(codeIndex, 1);
                    const updateQuery = 'UPDATE users SET two_fa_backup_codes = ? WHERE id = ?';
                    db.query(updateQuery, [JSON.stringify(backupCodes), user.id], () => {});
                }

                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET || 'jagermeister',
                    { expiresIn: '1h' }
                );

                db.query('INSERT INTO totp_attempts (user_id, ip_address, success) VALUES (?, ?, TRUE)',
                    [user.id, clientIp], () => {});

                res.json({
                    message: 'Vérification 2FA réussie',
                    token: token,
                    user: { id: user.id, username: user.username, role: user.role }
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Erreur serveur interne' });
        }
    }
};
