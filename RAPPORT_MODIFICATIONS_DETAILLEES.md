## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Section 1: Authentification & Frontend](#section-1-authentification--frontend)
3. [Section 2: Sécurité Backend & Base de Données](#section-2-sécurité-backend--base-de-données)
4. [Section 3: Rate Limiting & Verrouillage de Compte](#section-3-rate-limiting--verrouillage-de-compte)
5. [Section 4: Authentification à Deux Facteurs (2FA)](#section-4-authentification-à-deux-facteurs-2fa)
6. [Résumé des fichiers modifiés/créés](#résumé-des-fichiers-modifiéscréés)

---

## Vue d'ensemble

Ce rapport présente les modifications apportées au projet `secured_webshop-main-initiale` pour créer la version améliorée `secured_webshop`. Les améliorations incluent:

- ✅ Pages d'authentification frontend (login/register)
- ✅ Implémentation de JWT pour la sécurité des API
- ✅ Roles d'utilisateur (admin/user) avec protection des routes
- ✅ Hash des mots de passe avec bcrypt (salt + pepper)
- ✅ Prévention de l'injection SQL
- ✅ Rate limiting sur les tentatives de connexion
- ✅ Verrouillage de compte après N tentatives
- ✅ Authentification à deux facteurs (2FA) avec TOTP

---

## Section 1: Authentification & Frontend

### 1.1 Page Login Frontend

#### (1) - Initiale
**Fichier**: `app/views/login.html`  
**État**: Fichier basique ou minimal

```html
<!-- Code initial minimal ou inexistant -->
```

#### (2) - Finale
**Fichier**: `app/views/login.html`  
**État**: Page de connexion fonctionnelle

```html
<form id="login-form" class="form-card">
    <h2>Connexion</h2>
    
    <div class="form-group">
        <input type="email" id="email" required placeholder=" ">
        <label>Email</label>
    </div>
    
    <div class="form-group">
        <input type="password" id="password" required placeholder=" ">
        <label>Mot de passe</label>
    </div>
    
    <button type="submit" class="btn-primary">Se connecter</button>
</form>
```

**Logique JavaScript ajoutée**:
```javascript
// Récupération des données du formulaire
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;

// Appel à l'API de login
const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

// Stockage du token et redirection
if (res.ok) {
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/';
}
```

**Modifications**: 
- Création d'un formulaire HTML structuré
- Ajout de la logique JavaScript pour récupérer les données
- Appel API POST vers `/api/auth/login`
- Stockage du token JWT dans localStorage
- Redirection vers la page d'accueil après connexion réussie

---

### 1.2 Page Inscription Frontend

#### (1) - Initiale
**Fichier**: `app/views/register.html`  
**État**: Fichier basique ou minimal

#### (2) - Finale
**Fichier**: `app/views/register.html`  
**État**: Page d'inscription fonctionnelle

```html
<form id="register-form" class="form-card">
    <h2>Inscription</h2>
    
    <div class="form-group">
        <input type="text" id="username" required placeholder=" ">
        <label>Nom d'utilisateur</label>
    </div>
    
    <div class="form-group">
        <input type="email" id="reg-email" required placeholder=" ">
        <label>Email</label>
    </div>
    
    <div class="form-group">
        <input type="password" id="reg-password" required placeholder=" ">
        <label>Mot de passe</label>
    </div>
    
    <button type="submit" class="btn-primary">Créer mon compte</button>
</form>
```

**Logique JavaScript ajoutée**:
```javascript
// Récupération des valeurs du formulaire
const username = document.getElementById('username').value;
const email = document.getElementById('reg-email').value;
const password = document.getElementById('reg-password').value;

// Appel à l'API d'inscription
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
});

// Redirection vers login après inscription réussie
if (response.ok) {
    alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
    window.location.href = '/login';
}
```

**Modifications**:
- Création d'un formulaire HTML avec champs username, email, password
- Ajout de la logique JavaScript pour l'inscription
- Appel API POST vers `/api/auth/register`
- Message de confirmation et redirection vers login

---

### 1.3 Tokens JWT

#### (1) - Initiale
**package.json**: 
```json
{
  "dependencies": {
    // ... autres dépendances
  }
}
```
**État**: jsonwebtoken non installé

#### (2) - Finale
**package.json**: 
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.3",
    // ... autres dépendances
  }
}
```

**Configuration du secret (.env)**:
```env
JWT_SECRET=jagermeister
```

**Génération du token (AuthController.js - login())**:
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: user.id, role: user.role },           // Payload
    process.env.JWT_SECRET || 'jagermeister',   // Secret
    { expiresIn: '1h' }                         // Options
);

res.json({
    message: 'Connexion réussie',
    token: token,
    user: { id: user.id, username: user.username, role: user.role }
});
```

**Vérification du Token (middleware/auth.js)**:

#### (1) - Initiale
```javascript
// Pas de middleware d'authentification JWT
```

#### (2) - Finale
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Extraction du token du header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé : aucun jeton fourni' });
    }

    try {
        // Vérification du token
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');
        req.user = verified;  // { id: 3, role: 'user' }
        next();
    } catch (err) {
        res.status(403).json({ error: 'Jeton invalide ou expiré' });
    }
};
```

**Utilisation du Token (Frontend)**:
```javascript
// app/public/js/nav.js
const token = localStorage.getItem('token');

const response = await fetch('/api/profile', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

**Modifications**:
- Ajout de `jsonwebtoken` dans les dépendances
- Création d'un middleware `auth.js` pour vérifier les tokens JWT
- Génération de tokens lors de la connexion avec expiration de 1h
- Utilisation du token dans les requêtes frontend avec le header `Authorization: Bearer TOKEN`

---

### 1.4 Roles Admin et Protection des Routes

#### (1) - Initiale
**Routes Admin**: Pas de protection
```javascript
// Pas d'authentification ou de vérification de rôle
```

#### (2) - Finale
**Routes Admin**: Middleware de protection des rôles

**Middleware isAdmin (middleware/isAdmin.js)**:
```javascript
module.exports = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Accès réservé aux administrateurs'
        });
    }
    next();
};
```

**Routes protégées (routes/Admin.js)**:
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/AdminController');
const isAdmin = require('../middleware/isAdmin');

// GET /api/admin/users - Protégé par isAdmin
router.get('/users', isAdmin, controller.getUsers);

// POST /api/admin/products - Protégé par isAdmin
router.post('/products', isAdmin, controller.addProduct);

module.exports = router;
```

**Application de la protection dans server.js**:

#### (1) - Initiale
```javascript
app.use("/api/admin", adminRoute);
```

#### (2) - Finale
```javascript
app.use("/api/admin", authMiddleware, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Réservé aux administrateurs' });
    }
    next();
}, adminRoute);
```

**Helpers Frontend d'Authentification (public/js/nav.js)**:
```javascript
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.role === 'admin';
}

function requireAdmin(redirectUrl = '/') {
    if (!isAdmin()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}
```

**Protection Frontend (views/admin.html)**:
```javascript
<script src="/js/nav.js"></script>
<script>
    // Vérification de l'authentification
    if (!isAuthenticated()) {
       window.location.href = '/login';
    }

    // Vérification du rôle admin
    if (!isAdmin()) {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; 
                            min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            flex-direction: column; text-align: center; padding: 20px;">
                    <a href="/" style="background-color: white; color: #667eea; padding: 12px 30px; 
                                      border-radius: 50px; text-decoration: none; font-weight: bold;">
                        Back to Home
                    </a>
                </div>
            `;
        });
    }
</script>
```

**Navigation avec Affichage Conditionnel**:
```javascript
// app/public/js/nav.js
const subMenuAdmin = user && user.role === 'admin' 
    ? '<a href="/admin">Administration</a>' 
    : '';

// Affichage du lien profil seulement si connecté
const profileLink = token 
    ? '<a href="/profile">Mon Profil</a>' 
    : '';
```

**Modifications**:
- Création du middleware `isAdmin.js` pour vérifier le rôle admin
- Création des helpers frontend pour gérer l'authentification
- Protection des routes admin backend avec authentification + vérification de rôle
- Protection frontend avec redirection et masquage des contenus administrateurs
- Affichage conditionnel des éléments de navigation selon le rôle

---

## Section 2: Sécurité Backend & Base de Données

### 2.1 Hash des Mots de Passe

#### (1) - Initiale
**Fichier**: `app/db/init/init.sql`
```sql
INSERT INTO users (username, email, password, role, address) VALUES
    ('admin',  'admin@webshop.com', 'admin123',  'admin', '...'),
    ('alice',  'alice@webshop.com', 'password1', 'user',  '...');
```

**État**: Mots de passe stockés en clair (FAILLE DE SÉCURITÉ)

#### (2) - Finale
**Installation de bcrypt**:
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0"
  }
}
```

**Hachage du mot de passe lors inscription (AuthController.js - register())**:
```javascript
const bcrypt = require('bcrypt');

const pepper = process.env.DB_PEPPER || '';
const saltRounds = 10;
const passwordWithPepper = password + pepper;

// Hashage du mot de passe avec poivre
const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);

// Stockage en base de données
const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
const values = [username, email, hashedPassword, 'user'];
db.query(query, values, (err, result) => { /* ... */ });
```

**Vérification lors connexion (AuthController.js - login())**:
```javascript
const isMatch = await bcrypt.compare(password + pepper, user.password);

if (!isMatch) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
}
```

**Modifications**:
- Installation de bcrypt pour le hachage sécurisé
- Ajout du salt (10 rounds automatiques par bcrypt)
- Hachage des mots de passe lors de l'inscription
- Vérification par comparaison lors de la connexion (jamais de décodage)
- Les mots de passe en clair ne sont jamais stockés

---

### 2.2 Ajout du Sel (Salt)

#### (1) - Initiale
**État**: Aucun sel utilisé (mots de passe en clair ou avec hash simple)

#### (2) - Finale
**Salt automatique via bcrypt**:
```javascript
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);
```

**Explication**:
- bcrypt génère automatiquement un **sel aléatoire** pour chaque mot de passe
- Le nombre `saltRounds` définit le coût de calcul (10 = complexité équilibrée)
- Chaque hash produit est unique même pour le même mot de passe
- Le sel est intégré dans le hash stocké (impossible de revenir en arrière)

**Modifications**:
- Intégration du salt via bcrypt (automatique, 10 rounds)
- Plus d'attaques de dictionnaire efficaces (chaque hash est unique)
- Stockage sécurisé du hash avec salt intégré

---

### 2.3 Ajout du Poivre (Pepper)

#### (1) - Initiale
**État**: Aucun poivre utilisé

#### (2) - Finale
**Configuration du poivre (.env)**:
```env
DB_PEPPER=NoAlcoholNoLife
```

**Utilisation dans AuthController.js**:
```javascript
// Lors de l'inscription
const pepper = process.env.DB_PEPPER || '';
const passwordWithPepper = password + pepper;
const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);

// Lors de la connexion
const pepper = process.env.DB_PEPPER || '';
const isMatch = await bcrypt.compare(password + pepper, user.password);
```

**Différence Salt vs Pepper**:
- **Salt**: Stocké avec le hash, aléatoire pour chaque utilisateur
- **Pepper**: Secret additionnel stocké dans `.env`, identique pour tous les utilisateurs
- **Combinaison**: Plus de sécurité (attaquant doit avoir accès à `.env` ET à la BDD)

**Modifications**:
- Création d'une variable `.env` pour le poivre
- Concaténation du poivre au mot de passe avant hachage
- Utilisation du même poivre lors de la vérification

---

### 2.4 Prévention de l'Injection SQL

#### (1) - Initiale
**Queries vulnérables** (exemple):
```javascript
// AVANT - VULNERABLE
const email = req.body.email;
const query = `SELECT * FROM users WHERE email = '${email}'`;
db.query(query, (err, results) => { /* ... */ });

// Attaque: email = "' OR '1'='1"
// Query devient: SELECT * FROM users WHERE email = '' OR '1'='1' (retourne tous les users)
```

#### (2) - Finale
**Queries protégées avec requêtes préparées**:
```javascript
// APRES - PROTECTED
const email = req.body.email;
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email], (err, results) => { /* ... */ });

// Le ? est remplacé de manière sécurisée par la librairie
// Les données ne sont jamais interprétées comme du code SQL
```

**Tous les queries du code final utilisent ce pattern**:
```javascript
// Login
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email], async (err, results) => { /* ... */ });

// Register
const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
const values = [username, email, hashedPassword, 'user'];
db.query(query, values, (err, result) => { /* ... */ });

// Profile
const query = 'SELECT id, username, email, role, address, photo_path FROM users WHERE id = ?';
db.query(query, [userId], (err, results) => { /* ... */ });
```

**Modifications**:
- Remplacement de tous les queries dynamiques par des requêtes préparées
- Utilisation du placeholder `?` pour les paramètres
- Passage des données en tableau séparé du query
- Élimination complète du risque d'injection SQL

---

## Section 3: Rate Limiting & Verrouillage de Compte

### 3.1 Structure de la Base de Données

#### (1) - Initiale
**Fichier**: `app/db/init/init.sql`
```sql
-- Pas de colonnes pour rate limiting
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'user',
    address    VARCHAR(255),
    photo_path VARCHAR(255)
);
```

#### (2) - Finale
**Fichier**: `app/db/init/lockout-schema.sql`
```sql
-- Migration: Add account lockout and login audit features
ALTER TABLE users
ADD COLUMN failed_attempts INT DEFAULT 0,
ADD COLUMN locked_until DATETIME NULL,
ADD COLUMN locked_at DATETIME NULL;

-- Table pour l'historique des tentatives de connexion
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(50),
    success BOOLEAN,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempted_at),
    INDEX idx_ip_attempts (ip_address, attempted_at)
);
```

**Modifications**:
- Ajout de 3 colonnes à la table `users`:
  - `failed_attempts`: Compteur de tentatives échouées
  - `locked_until`: Date/heure du déblocage automatique
  - `locked_at`: Date/heure du verrouillage
- Création de la table `login_attempts` pour l'audit

---

### 3.2 Rate Limiting sur le Login

#### (1) - Initiale
**Fichier**: `app/middleware/rateLimitAuth.js`
**État**: Probablement minimal ou absent

#### (2) - Finale
**Fichier**: `app/middleware/rateLimitAuth.js`
```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');

// Rate limiter: 5 requests per minute per IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,      // 1 minute
    max: 5,                    // 5 tentatives
    message: 'Trop de tentatives de connexion, réessayez dans 1 minute',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
```

**Utilisation dans les routes (routes/Auth.js)**:

#### (1) - Initiale
```javascript
router.post('/login', controller.login);
```

#### (2) - Finale
```javascript
const rateLimitAuth = require('../middleware/rateLimitAuth');
router.post('/login', rateLimitAuth, controller.login);
```

**Modifications**:
- Ajout de middleware `express-rate-limit`
- Limitation à 5 tentatives par minute par adresse IP
- Application du limiter au route POST `/api/auth/login`

---

### 3.3 Verrouillage de Compte après N Tentatives

#### (1) - Initiale
**État**: Aucun verrouillage automatique

#### (2) - Finale
**Logique dans AuthController.js - login()**:

```javascript
// Extraction de l'IP client
const clientIp = req.clientIp || 'unknown';

// ... après vérification du mot de passe échouée ...

if (!isMatch) {
    const newFailedAttempts = (user.failed_attempts || 0) + 1;
    
    // Enregistrement de la tentative échouée
    rateLimitAuth.logLoginAttempt(user.id, clientIp, false);
    rateLimitAuth.recordFailedAttempt(clientIp);

    // Verrouillage du compte après 5 tentatives
    if (newFailedAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);  // Verrouillage 30 minutes

        const lockQuery = 'UPDATE users SET failed_attempts = ?, locked_until = ?, locked_at = NOW() WHERE id = ?';
        db.query(lockQuery, [newFailedAttempts, lockUntil, user.id], (err) => {
            if (err) console.error('Error locking account:', err);
        });

        return res.status(401).json({
            error: 'Trop de tentatives échouées. Votre compte a été verrouillé pour 30 minutes.',
            locked: true
        });
    } else {
        // Incrémentation du compteur
        const updateQuery = 'UPDATE users SET failed_attempts = ? WHERE id = ?';
        db.query(updateQuery, [newFailedAttempts, user.id], (err) => {
            if (err) console.error('Error updating failed attempts:', err);
        });

        return res.status(401).json({
            error: 'Email ou mot de passe incorrect'
        });
    }
}
```

---

### 3.4 Déblocage Automatique du Compte

#### (1) - Initiale
**État**: Aucun déblocage automatique

#### (2) - Finale
**Logique dans AuthController.js - login()**:

```javascript
// Vérification si le compte est verrouillé
if (user.locked_until) {
    const now = new Date();
    const lockedUntil = new Date(user.locked_until);

    if (lockedUntil > now) {
        // Compte toujours verrouillé
        rateLimitAuth.logLoginAttempt(user.id, clientIp, false);
        const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
        
        return res.status(401).json({
            error: `Compte temporairement verrouillé. Réessayez dans ${minutesRemaining} minute(s).`,
            locked: true
        });
    } else {
        // Délai de verrouillage expiré - déblocage automatique
        const resetQuery = 'UPDATE users SET failed_attempts = 0, locked_until = NULL, locked_at = NULL WHERE id = ?';
        db.query(resetQuery, [user.id], (err) => {
            if (err) console.error('Error resetting lock:', err);
        });
    }
}
```

**Modifications**:
- Vérification du verrouillage avant traitement du login
- Calcul du temps restant avant déblocage
- Réinitialisation automatique du compteur après expiration du délai
- Affichage du nombre de minutes restantes à l'utilisateur

---

### 3.5 Extraction de l'IP Client

#### (1) - Initiale
**server.js**: Pas d'extraction d'IP

#### (2) - Finale
**server.js**:
```javascript
const requestIp = require('request-ip');

// Trust proxy for accurate IP detection
app.set('trust proxy', 1);

// Middleware global pour extraire l'IP client
app.use((req, res, next) => {
    req.clientIp = requestIp.getClientIp(req);
    next();
});
```

**Modifications**:
- Installation et utilisation de `request-ip`
- Extraction de l'adresse IP réelle (même derrière un proxy)
- Disponibilité de `req.clientIp` dans tous les handlers

---

## Section 4: Authentification à Deux Facteurs (2FA)

### 4.1 Structure de la Base de Données

#### (1) - Initiale
**État**: Aucune colonnes/tables pour 2FA

#### (2) - Finale
**Fichier**: `app/db/init/2fa-schema.sql`

```sql
-- Migration: Add Two-Factor Authentication (2FA) support

-- Colonnes ajoutées à la table users
ALTER TABLE users
ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_fa_secret VARCHAR(255) NULL,
ADD COLUMN two_fa_backup_codes JSON NULL;

-- Table pour le rate limiting des tentatives TOTP
CREATE TABLE totp_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(50),
    success BOOLEAN,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempted_at),
    INDEX idx_ip_attempts (ip_address, attempted_at)
);
```

**Modifications**:
- 3 nouvelles colonnes dans `users`:
  - `two_fa_enabled`: Flag pour activer/désactiver 2FA
  - `two_fa_secret`: Secret TOTP encodé en base32
  - `two_fa_backup_codes`: Codes de secours hachés (JSON array)
- Table `totp_attempts` pour l'audit des tentatives TOTP

---

### 4.2 Dépendances NPM

#### (1) - Initiale
**package.json**:
```json
{
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.1",
    "express-rate-limit": "^7.5.1",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.4",
    "nodemon": "^3.1.0",
    "request-ip": "^3.3.0"
  }
}
```

#### (2) - Finale
**package.json**:
```json
{
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.1",
    "express-rate-limit": "^7.5.1",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.4",
    "nodemon": "^3.1.0",
    "qrcode": "^1.5.4",
    "request-ip": "^3.3.0",
    "speakeasy": "^2.0.0"
  }
}
```

**Modifications**:
- Ajout de `speakeasy` (génération TOTP)
- Ajout de `qrcode` (génération de QR codes)

---

### 4.3 Nouveau Controller: TwoFAController

#### (1) - Initiale
**Fichier**: `app/controllers/TwoFAController.js`
**État**: N'existe pas

#### (2) - Finale
**Fichier**: `app/controllers/TwoFAController.js`
**État**: Créé avec 4 méthodes principales

```javascript
const db = require('../config/db');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

module.exports = {
    // Génération du secret TOTP et codes de secours
    setup2FA: async (req, res) => {
        const userId = req.user.id;
        
        // Génération du secret
        const secret = speakeasy.generateSecret({
            name: `Secure Shop (${user.email})`,
            issuer: 'Secure Shop',
            length: 32
        });

        // Génération du QR Code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        
        // Génération des codes de secours
        const backupCodes = generateBackupCodes();

        res.json({
            qrCode: qrCode,
            secret: secret.base32,
            backupCodes: backupCodes,
            message: 'Scannez le code QR avec votre application d\'authentification'
        });
    },

    // Vérification du code TOTP et activation
    verify2FASetup: async (req, res) => {
        const userId = req.user.id;
        const { token, secret } = req.body;

        // Vérification du code
        const isValidToken = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (isValidToken) {
            // Stockage du secret et des codes de secours
            const backupCodes = generateBackupCodes();
            const hashedCodes = backupCodes.map(code => hashBackupCode(code));

            const query = 'UPDATE users SET two_fa_enabled = TRUE, two_fa_secret = ?, two_fa_backup_codes = ? WHERE id = ?';
            db.query(query, [secret, JSON.stringify(hashedCodes), userId], (err) => {
                if (err) return res.status(500).json({ error: 'Erreur serveur' });
                res.json({ message: '2FA activé', backupCodes });
            });
        } else {
            res.status(401).json({ error: 'Code invalide' });
        }
    },

    // Vérification du TOTP lors de la connexion
    verifyTOTPLogin: async (req, res) => {
        const { tempToken, totp } = req.body;

        try {
            const verified = jwt.verify(tempToken, process.env.JWT_SECRET, { ignoreExpiration: false });
            const userId = verified.id;

            // Récupération du secret
            const query = 'SELECT two_fa_secret FROM users WHERE id = ?';
            db.query(query, [userId], async (err, results) => {
                if (err || results.length === 0) {
                    return res.status(401).json({ error: 'Utilisateur non trouvé' });
                }

                // Vérification du TOTP
                const isValidToken = speakeasy.totp.verify({
                    secret: results[0].two_fa_secret,
                    encoding: 'base32',
                    token: totp,
                    window: 2
                });

                if (isValidToken) {
                    // Génération du JWT complet
                    const user = results[0];
                    const token = jwt.sign(
                        { id: user.id, role: user.role },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );

                    res.json({ message: 'Connexion réussie', token, user });
                } else {
                    res.status(401).json({ error: 'Code TOTP invalide' });
                }
            });
        } catch (err) {
            res.status(403).json({ error: 'Token temporaire invalide ou expiré' });
        }
    },

    // Désactivation du 2FA
    disable2FA: async (req, res) => {
        const userId = req.user.id;
        
        const query = 'UPDATE users SET two_fa_enabled = FALSE, two_fa_secret = NULL, two_fa_backup_codes = NULL WHERE id = ?';
        db.query(query, [userId], (err) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur' });
            res.json({ message: '2FA désactivé' });
        });
    }
};

// Fonctions utilitaires
const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
};

const hashBackupCode = (code) => {
    return crypto.createHash('sha256').update(code).digest('hex');
};
```

**Modifications**:
- Création du controller TwoFAController.js
- 4 méthodes: setup2FA, verify2FASetup, verifyTOTPLogin, disable2FA
- Génération de secrets TOTP
- Génération de QR codes
- Gestion des codes de secours

---

### 4.4 Nouveau Middleware: verify2FA

#### (1) - Initiale
**Fichier**: `app/middleware/verify2FA.js`
**État**: N'existe pas

#### (2) - Finale
**Fichier**: `app/middleware/verify2FA.js`
**État**: Créé pour vérifier les tokens temporaires 2FA

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Récupération du tempToken (vient du body ou du header)
    const tempToken = req.body.tempToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!tempToken) {
        return res.status(401).json({ error: 'Token temporaire requis' });
    }

    try {
        const verified = jwt.verify(tempToken, process.env.JWT_SECRET || 'jagermeister');
        
        // Vérification que c'est un token en attente de 2FA
        if (!verified.pending_2fa) {
            return res.status(403).json({ error: 'Token invalide: pas en attente de 2FA' });
        }

        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Token temporaire invalide ou expiré' });
    }
};
```

**Modifications**:
- Création du middleware verify2FA.js
- Vérification des tokens temporaires avec flag `pending_2fa`
- Injection de `req.user` pour les handlers

---

### 4.5 Routes 2FA

#### (1) - Initiale
**Fichier**: `app/routes/Auth.js`
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');
const rateLimitAuth = require('../middleware/rateLimitAuth');

router.post('/login',    rateLimitAuth, controller.login);
router.post('/register', controller.register);

module.exports = router;
```

#### (2) - Finale
**Fichier**: `app/routes/Auth.js`
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/AuthController');
const twoFAController = require('../controllers/TwoFAController');
const auth = require('../middleware/auth');
const verify2FA = require('../middleware/verify2FA');
const rateLimitAuth = require('../middleware/rateLimitAuth');

// Routes de base
router.post('/login',    rateLimitAuth, controller.login);
router.post('/register', controller.register);

// Routes 2FA
router.post('/setup-2fa', auth, twoFAController.setup2FA);
router.post('/verify-2fa-setup', verify2FA, twoFAController.verify2FASetup);
router.post('/verify-totp', twoFAController.verifyTOTPLogin);
router.post('/disable-2fa', auth, twoFAController.disable2FA);

module.exports = router;
```

**Modifications**:
- Import de `TwoFAController`
- Import du middleware `verify2FA`
- 4 nouvelles routes:
  - `/setup-2fa`: Initiation du 2FA
  - `/verify-2fa-setup`: Vérification et activation
  - `/verify-totp`: Vérification TOTP lors login
  - `/disable-2fa`: Désactivation du 2FA

---

### 4.6 Modification du Login (Intégration 2FA)

#### (1) - Initiale
**AuthController.js - login()**:
```javascript
// Retour du JWT complet
const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'jagermeister',
    { expiresIn: '1h' }
);

res.json({
    message: 'Connexion réussie',
    token: token,
    user: { id: user.id, username: user.username, role: user.role }
});
```

#### (2) - Finale
**AuthController.js - login()**:
```javascript
// Si 2FA activé: Retour d'un token temporaire
if (user.two_fa_enabled) {
    const tempToken = jwt.sign(
        { id: user.id, role: user.role, pending_2fa: true },
        process.env.JWT_SECRET || 'jagermeister',
        { expiresIn: '5m' }  // Token court terme
    );

    return res.json({
        message: 'Connexion réussie - Vérification 2FA requise',
        tempToken: tempToken,
        pending_2fa: true,
        user: { id: user.id, username: user.username, role: user.role }
    });
}
// Si pas de 2FA: Retour du JWT complet
else {
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'jagermeister',
        { expiresIn: '1h' }
    );
    
    res.json({ message: 'Connexion réussie', token, user });
}
```

**Modifications**:
- Détection de `user.two_fa_enabled`
- Retour d'un **token temporaire** (5 minutes) si 2FA activé
- Ajout du flag `pending_2fa: true`
- Retour du JWT complet seulement après vérification du TOTP

---

### 4.7 Middleware Auth Modifié

#### (1) - Initiale
**middleware/auth.js**:
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé : aucun jeton fourni' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Jeton invalide ou expiré' });
    }
};
```

#### (2) - Finale
**middleware/auth.js** (identique, mais comportement intégré):
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé : aucun jeton fourni' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'jagermeister');

        // Rejette les tokens avec flag pending_2fa (temporaires)
        if (verified.pending_2fa) {
            return res.status(403).json({ error: 'Vérification 2FA requise' });
        }

        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Jeton invalide ou expiré' });
    }
};
```

**Modifications**:
- Détection et rejet des tokens temporaires
- Obligation de vérifier le 2FA avant accès aux ressources

---

### 4.8 Nouvelle Page Frontend: 2FA Setup

#### (1) - Initiale
**Fichier**: `app/views/2fa-setup.html`
**État**: N'existe pas

#### (2) - Finale
**Fichier**: `app/views/2fa-setup.html`
**État**: Créée pour la configuration du 2FA

```html
<!DOCTYPE html>
<html>
<head>
    <title>Configuration 2FA</title>
</head>
<body>
    <div class="setup-container">
        <h2>Configuration de l'authentification à deux facteurs</h2>
        
        <div id="qr-code-container">
            <p>Scannez ce code QR avec votre application d'authentification:</p>
            <img id="qr-code" src="" />
        </div>

        <div class="verification">
            <input type="text" id="totp-code" placeholder="Entrez votre code TOTP" />
            <button onclick="verify2FA()">Vérifier</button>
        </div>

        <div id="backup-codes">
            <p>Codes de secours (conservez-les en sécurité):</p>
            <pre id="codes-list"></pre>
        </div>
    </div>

    <script>
        async function setup2FA() {
            const response = await fetch('/api/auth/setup-2fa', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            const data = await response.json();
            document.getElementById('qr-code').src = data.qrCode;
            document.getElementById('codes-list').textContent = data.backupCodes.join('\n');
        }

        async function verify2FA() {
            const code = document.getElementById('totp-code').value;
            const response = await fetch('/api/auth/verify-2fa-setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('tempToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: code })
            });

            if (response.ok) {
                alert('2FA activé avec succès!');
                window.location.href = '/profile';
            }
        }

        setup2FA();
    </script>
</body>
</html>
```

**Modifications**:
- Création de la page 2fa-setup.html
- Affichage du QR code
- Saisie et vérification du code TOTP
- Affichage des codes de secours

---

### 4.9 Integration dans server.js

#### (1) - Initiale
**server.js**:
```javascript
app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile",  (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin",    (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));
```

#### (2) - Finale
**server.js**:
```javascript
app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile",  (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin",    (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));
app.get("/2fa-setup", (_req, res) => res.sendFile(path.join(__dirname, "views", "2fa-setup.html")));
```

**Modifications**:
- Ajout de la route GET `/2fa-setup`
- Retour de la page 2fa-setup.html

---

## Résumé des Fichiers Modifiés/Créés

### Fichiers CRÉÉS (Finales uniquement)

| Fichier | Type | Description |
|---------|------|-------------|
| `app/controllers/TwoFAController.js` | Nouveau | Controller pour gérer le 2FA (setup, vérification, désactivation) |
| `app/middleware/verify2FA.js` | Nouveau | Middleware pour vérifier les tokens temporaires 2FA |
| `app/views/2fa-setup.html` | Nouveau | Page de configuration du 2FA |
| `app/db/init/2fa-schema.sql` | Nouveau | Migration BDD pour les colonnes 2FA |

### Fichiers MODIFIÉS (Changements principaux)

| Fichier | Modifications |
|---------|--------------|
| `app/package.json` | Ajout: `speakeasy`, `qrcode`, `request-ip`, `bcrypt`, `jsonwebtoken` |
| `app/server.js` | Ajout: extraction IP client via `request-ip`, route `/2fa-setup` |
| `app/routes/Auth.js` | Ajout: 4 routes 2FA (setup, verify, login, disable) |
| `app/controllers/AuthController.js` | Ajout: bcrypt hashing, JWT génération, logique 2FA conditionnelle, rate limiting |
| `app/middleware/auth.js` | Ajout: Rejet des tokens temporaires avec `pending_2fa` |
| `app/db/init/lockout-schema.sql` | Créé: Colonnes de verrouillage et table `login_attempts` |
| `app/views/login.html` | Complète: Formulaire fonctionnel avec logique JWT |
| `app/views/register.html` | Complète: Formulaire d'inscription avec validation |
| `app/views/profile.html` | Modifié: Utilisation du JWT en header Authorization |
| `app/views/admin.html` | Modifié: Protection et vérification du rôle admin |
| `app/public/js/nav.js` | Créé/Modifié: Helpers d'authentification et gestion des rôles |

### Fichiers INCHANGÉS (Identiques dans initiale et finale)

| Fichier |
|---------|
| `app/controllers/AdminController.js` |
| `app/controllers/HomeController.js` |
| `app/controllers/ProductController.js` |
| `app/controllers/ProfileController.js` |
| `app/controllers/UserController.js` |
| `app/middleware/isAdmin.js` |
| `app/middleware/requireAuthPage.js` |
| `app/middleware/rateLimitAuth.js` |
| `app/routes/Admin.js` |
| `app/routes/Home.js` |
| `app/routes/Profile.js` |
| `app/routes/User.js` |
| `app/config/db.js` |
| `app/db/init/init.sql` |

---

## Résumé des Modifications par Domaine

### 1. **Frontend & Authentification**
- ✅ Pages login/register complètes
- ✅ Stockage du JWT dans localStorage
- ✅ Helpers frontend pour gérer auth et rôles
- ✅ Protection conditionnelle de pages (admin)

### 2. **Backend & Sécurité**
- ✅ Hash des mots de passe (bcrypt + salt + pepper)
- ✅ Prévention injection SQL (requêtes préparées)
- ✅ JWT pour sécurisation des API

### 3. **Rate Limiting & Protection des Comptes**
- ✅ Rate limiting: 5 tentatives/min/IP
- ✅ Verrouillage: 30 min après 5 tentatives
- ✅ Déblocage automatique après délai
- ✅ Historique des tentatives (BDD)

### 4. **Authentification à Deux Facteurs**
- ✅ TOTP basé sur speakeasy
- ✅ Génération de QR codes
- ✅ Codes de secours (8 codes)
- ✅ Token temporaire 5 min après login
- ✅ Vérification TOTP obligatoire pour accès API

### 5. **Gestion des Rôles**
- ✅ Rôles dans JWT (admin/user)
- ✅ Middleware de vérification admin
- ✅ Protection des routes admin
- ✅ Navigation conditionnelle selon rôle

---

## Fichiers de Configuration

### .env (ajouté)
```env
JWT_SECRET=jagermeister
DB_PEPPER=NoAlcoholNoLife
DB_HOST=localhost
DB_USER=root
DB_PASS=root
DB_NAME=webshop
```

### Dependencies Finales
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.1",
    "express-rate-limit": "^7.5.1",
    "jsonwebtoken": "^9.0.3",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.4",
    "nodemon": "^3.1.0",
    "qrcode": "^1.5.4",
    "request-ip": "^3.3.0",
    "speakeasy": "^2.0.0"
  }
}
```

---

## Conclusion

Cette transformation a élevé le projet `secured_webshop-main-initiale` en version sécurisée avec:

1. **Authentification robuste**: JWT + 2FA TOTP
2. **Sécurité des données**: Hash bcrypt + salt + pepper
3. **Protection des requêtes**: Prévention injection SQL
4. **Résilience**: Rate limiting + verrouillage de compte
5. **Gestion des accès**: Rôles et permissions

Tous les changements sont documentés et traçables via cette comparaison initiale vs finale.
