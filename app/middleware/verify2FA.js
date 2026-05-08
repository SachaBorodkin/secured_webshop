const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé : aucun jeton fourni' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');

        if (verified.pending_2fa) {
            return res.status(403).json({ error: 'Vérification 2FA requise' });
        }

        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Jeton invalide ou expiré' });
    }
};
