require('dotenv').config({ path: '../.env' });

const express        = require('express');
const cookieParser   = require('cookie-parser');
const path           = require('path');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  // nécessaire pour lire req.cookies.refreshToken
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------
// Routes API
// ---------------------------------------------------------------
const authRoute         = require('./routes/Auth');
const profileRoute      = require('./routes/Profile');
const adminRoute        = require('./routes/Admin');
const productController = require('./controllers/ProductController');

app.get('/api/products', productController.getAllProducts);
app.use('/api/auth',    authRoute);
app.use('/api/profile', authMiddleware, profileRoute);

// Route admin : authentification + vérification du rôle
app.use('/api/admin', authMiddleware, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    next();
}, adminRoute);

// ---------------------------------------------------------------
// Routes pages HTML
// ---------------------------------------------------------------
const homeRoute = require('./routes/Home');
const userRoute = require('./routes/User');

app.use('/',     homeRoute);
app.use('/user', userRoute);

app.get('/login',    (_req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (_req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/profile',  (_req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));
app.use('/api/admin', adminRoute, (req, res, next) => {
    // req.user comes from the authMiddleware (verified JWT payload)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    next();
}, adminRoute);

// ---------------------------------------------------------------
// Gestionnaire d'erreurs global — ne retourne aucun détail technique
// ---------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message); // log serveur uniquement
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

app.listen(8080, () => {
    console.log('Serveur démarré sur http://localhost:8080');
});