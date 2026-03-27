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

    if (token && user) {
        userActionsContent = `
        <div class="acc">
        <a href="/profile" class="account-link">
    <span class="material-symbols-outlined">account_circle</span>
    <span class="user-name-text">${user.username}</span>
</a>
            <button id="logout-btn" title="Déconnexion">
                <span class="material-symbols-outlined">exit_to_app</span>
            </button>
        </div>
        `;
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
                ${user && user.role === 'admin' ? '<a href="/admin">Administration</a>' : ''}
                <a href="/profile">Mon Profil</a>
            </div>
        </nav>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }
});