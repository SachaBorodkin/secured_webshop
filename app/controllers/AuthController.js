const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {

    // ----------------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------------
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        //Requête préparée pour éviter l'injection SQL
        const query = 'SELECT * FROM users WHERE email = ?';

        db.query(query, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const user = results[0];
            const pepper = process.env.DB_PEPPER || '';

            //Vérification du mot de passe avec poivre
            const isMatch = await bcrypt.compare(password + pepper, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            //Génération du JWT avec ID et Rôle
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