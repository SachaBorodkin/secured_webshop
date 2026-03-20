const db = require('../config/db');

module.exports = {
    getAllProducts: (_req, res) => {
        db.query('SELECT * FROM products', (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
            }
            res.json(results);
        });
    }
};