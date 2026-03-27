// =============================================================
// config/db.js — connexion MySQL avec moindre privilège
// L'utilisateur 'webshop_app' n'a que les droits nécessaires :
//   SELECT/INSERT/UPDATE sur users, login_attempts, refresh_tokens
//   SELECT/INSERT/UPDATE/DELETE sur refresh_tokens
//   SELECT sur products
// Aucun droit DROP, CREATE, ALTER ou accès à d'autres bases.
// =============================================================

const mysql = require('mysql2');

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'webshop_app',
    password:           process.env.DB_PASS     || 'AppStr0ng!Pwd#2024',
    database:           process.env.DB_NAME     || 'webshop',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

// Vérification au démarrage (sans exposer les credentials en log)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Impossible de se connecter à la base de données.');
        process.exit(1);
    }
    console.log(`Connecté à la BDD "${connection.config.database}" en tant que "${connection.config.user}"`);
    connection.release();
});

module.exports = pool;