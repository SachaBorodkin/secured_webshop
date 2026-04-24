const db = require('../config/db');

module.exports = {

    // ----------------------------------------------------------
    // GET /api/admin/users
    // ----------------------------------------------------------
    getUsers: (_req, res) => {
        db.query('SELECT id, username, email, role, address FROM users', (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(results);
        });
    },

    // ----------------------------------------------------------
    // POST /api/admin/products
    // Ajouter un nouveau produit (administrateur uniquement)
    // ----------------------------------------------------------
    addProduct: (req, res) => {
        const { name, description, price, image_url } = req.body;

        // Validation des champs requis
        if (!name || !description || price === undefined || price === null) {
            return res.status(400).json({
                error: 'Les champs nom, description et prix sont requis'
            });
        }

        // Validation du prix
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({
                error: 'Le prix doit être un nombre positif'
            });
        }

        // Validation du nom (non vide, string)
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                error: 'Le nom du produit est invalide'
            });
        }

        // Validation de la description (non vide, string)
        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({
                error: 'La description du produit est invalide'
            });
        }

        // Validation de l'URL de l'image (optionnel)
        if (image_url && typeof image_url !== 'string') {
            return res.status(400).json({
                error: 'L\'URL de l\'image est invalide'
            });
        }

        const query = 'INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)';
        const values = [name.trim(), description.trim(), priceNum, image_url || null];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    error: 'Erreur lors de l\'ajout du produit'
                });
            }

            res.status(201).json({
                message: 'Produit ajouté avec succès',
                productId: result.insertId
            });
        });
    }
};
