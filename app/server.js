require('dotenv').config({ path: '../.env' });
const authMiddleware = require("./middleware/auth");
const express = require("express");
const path = require("path");

const app = express();

// Trust proxy for accurate IP detection (important for rate limiting)
app.set('trust proxy', 1);

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");
const productController = require("./controllers/ProductController");
app.get("/api/products", productController.getAllProducts);
app.use("/api/auth",    authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin", authMiddleware, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    next();
}, adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile",  (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin",    (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));

// Démarrage du serveur
app.listen(8080, () => {
    console.log("Serveur démarré sur http://localhost:8080");
});
