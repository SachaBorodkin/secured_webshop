const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const router     = express.Router();
const controller = require('../controllers/ProfileController');
const authMiddleware = require('../middleware/auth')
// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads'),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/', authMiddleware, controller.get);
router.post('/', authMiddleware, controller.update);
router.post('/photo', authMiddleware, upload.single('photo'), controller.uploadPhoto);

module.exports = router;
