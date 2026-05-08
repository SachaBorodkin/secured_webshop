const express      = require('express');
const router       = express.Router();
const controller   = require('../controllers/AuthController');
const twoFAController = require('../controllers/TwoFAController');
const auth = require('../middleware/auth');
const verify2FA = require('../middleware/verify2FA');
const rateLimitAuth = require('../middleware/rateLimitAuth');

router.post('/login',    rateLimitAuth, controller.login);
router.post('/register', controller.register);
router.post('/setup-2fa', verify2FA, twoFAController.setup2FA);
router.post('/verify-2fa-setup', verify2FA, twoFAController.verify2FASetup);
router.post('/verify-totp', twoFAController.verifyTOTPLogin);
router.post('/disable-2fa', verify2FA, twoFAController.disable2FA);

module.exports = router;
