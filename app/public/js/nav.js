// ============================================================
// Auth Helper Functions
// ============================================================

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
        return null;
    }
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

function requireAuth(redirectUrl = '/login') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

function requireAdmin(redirectUrl = '/') {
    if (!isAdmin()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ============================================================
// Navigation Bar Setup
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    let userActionsContent = `
        <a href="/login" class="account-link">
            <span class="material-symbols-outlined">person</span>
            <span>Se connecter</span>
        </a>
    `;

    let subMenuAdmin = '';

    if (token && user) {
        userActionsContent = `
        <div class="acc">
        <a href="/profile" class="account-link">
    <span class="material-symbols-outlined">account_circle</span>
    <span class="user-name-text"></span>
</a>
            <button id="logout-btn" title="Déconnexion">
                <span class="material-symbols-outlined">exit_to_app</span>
            </button>
        </div>
        `;

        if (user.role === 'admin') {
            subMenuAdmin = '<a href="/admin">Administration</a>';
        }
    }

    nav.innerHTML = `
        <header class="topbar">
            <div class="container header-content">
                <div class="brand"><a href="/">Alcohol.ch</a></div>

                <button class="catalog-btn">
    <span class="material-symbols-outlined">menu</span>
    <span>Produits</span>
</button>

<div class="search-bar">
    <input type="text" placeholder="Rechercher...">
    <button class="search-btn">
        <span class="material-symbols-outlined">search</span>
    </button>
</div>

                <div class="user-actions">
                    ${userActionsContent}
                </div>
            </div>
        </header>

        <nav class="sub-menu">
            <div class="container">
                <a href="/">Accueil</a>
                <a href="/promotions">Promotions</a>
                ${subMenuAdmin}
                ${token ? '<a href="/profile">Mon Profil</a>' : ''}
            </div>
        </nav>
    `;

    // Set username safely using textContent
    if (token && user) {
        const userNameSpan = nav.querySelector('.user-name-text');
        if (userNameSpan) {
            userNameSpan.textContent = user.username;
        }
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});