// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;
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
                    
                    <a href="/login" class="account-link">
                        <span class="material-symbols-outlined">
person
</span></span> Se connecter
                    </a>
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
});
