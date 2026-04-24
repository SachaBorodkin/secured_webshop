const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AdminController');
const isAdmin    = require('../middleware/isAdmin');

router.get('/users',     isAdmin, controller.getUsers);
router.post('/products', isAdmin, controller.addProduct);

module.exports = router;
