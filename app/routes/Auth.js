const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AuthController');
const { rateLimitMiddleware } = require('../middleware/loginLimiter');
const authMiddleware = require('../middleware/auth');

// Rate limiting appliqué uniquement sur le login
router.post('/login',    rateLimitMiddleware, controller.login);
router.post('/register', controller.register);
router.post('/refresh',  controller.refresh);
router.post('/logout',   controller.logout);

// Déblocage de compte : réservé aux admins
router.post('/unlock', authMiddleware, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    next();
}, controller.unlockAccount);

module.exports = router;