
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user')); 

 
    let userActionsContent = `
        <a href="/login" class="account-link">
            <span class="material-symbols-outlined">person</span> Se connecter
        </a>
    `;

    if (token && user) {

        userActionsContent = `
        <div class="acc">
            <div class="user-logged-in">
                <a href="/profile" class="account-link">
                    <span class="material-symbols-outlined">person</span> ${user.username}
                </a>
                
            </div>
            <button id="logout-btn"><span class="material-symbols-outlined">
exit_to_app
</span>Déconnexion</button>
        </div>
        `;
    }

    nav.innerHTML = `
        <header class="topbar">
            <div class="container header-content">
                <div class="brand"><a href="/">Alcohol.ch</a></div>

                <button class="catalog-btn">
                    <span>☰</span> Tous les produits
                </button>

                <div class="search-bar">
                    <input type="text" placeholder="Je cherche...">
                    <button class="search-btn">🔍</button>
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
                <a href="/admin">Administration</a>
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