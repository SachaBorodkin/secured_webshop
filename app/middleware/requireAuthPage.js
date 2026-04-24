// middleware/requireAuthPage.js
// Middleware to protect HTML pages by checking JWT token in Authorization header
// Used for /profile and /admin pages

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');
        req.user = verified;
        next();
    } catch (err) {
        res.redirect('/login');
    }
};
