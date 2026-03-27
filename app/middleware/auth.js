// =============================================================
// Middleware d'authentification
// =============================================================

// app/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Récupération du header Authorization (Format: "Bearer TOKEN")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé : aucun jeton fourni' });
    }

    try {
        // Vérification du jeton avec la clé secrète du .env
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');
        req.user = verified; // Injecte l'ID et le rôle dans la requête
        next();
    } catch (err) {
        res.status(403).json({ error: 'Jeton invalide ou expiré' });
    }
};