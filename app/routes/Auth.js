const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/AuthController');
const rateLimitAuth = require('../middleware/rateLimitAuth');

router.post('/login',    rateLimitAuth, controller.login);
router.post('/register', controller.register);

module.exports = router;
