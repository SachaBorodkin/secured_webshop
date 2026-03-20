// app/controllers/ProfileController.js
const db = require('../config/db'); // Nécessaire pour exécuter les requêtes SQL

module.exports = {

    // ----------------------------------------------------------
    // GET /api/profile
    // Récupère les infos de l'utilisateur connecté via son JWT
    // ----------------------------------------------------------
    get: (req, res) => {
        // L'ID provient du middleware d'authentification (req.user)
        const userId = req.user.id; 

        db.query(
            'SELECT id, username, email, role, address, photo_path FROM users WHERE id = ?', 
            [userId], 
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur serveur' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ error: 'Utilisateur introuvable' });
                }
                res.json(results[0]);
            }
        );
    },

    // ----------------------------------------------------------
    // POST /api/profile
    // Met à jour l'adresse de l'utilisateur connecté
    // ----------------------------------------------------------
    update: (req, res) => {
        const userId = req.user.id; 
        const { address } = req.body;

        db.query(
            'UPDATE users SET address = ? WHERE id = ?', 
            [address, userId], 
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur serveur' });
                }
                res.json({ message: 'Profil mis à jour' });
            }
        );
    },

    // ----------------------------------------------------------
    // POST /api/profile/photo
    // Met à jour la photo de profil de l'utilisateur connecté
    // ----------------------------------------------------------
    uploadPhoto: (req, res) => {
        const userId = req.user.id; 

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier reçu' });
        }

        const photoPath = '/uploads/' + req.file.filename;

        db.query(
            'UPDATE users SET photo_path = ? WHERE id = ?', 
            [photoPath, userId], 
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur serveur' });
                }
                res.json({ 
                    message: 'Photo mise à jour', 
                    photo_path: photoPath 
                });
            }
        );
    }
};