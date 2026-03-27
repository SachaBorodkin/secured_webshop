const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AdminController');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/users', authMiddleware, isAdmin, controller.getUsers);

module.exports = router;
