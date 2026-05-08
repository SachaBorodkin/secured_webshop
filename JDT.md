JdT - secured_webshop
2026-03-20
1. Initialisation du projet (30 min)

    Fork du projet

    Configuration de l'environnement de développement

2. Changement du nom du site (15 min)

    Modification du nom du site dans les composants globaux

3. Implémentation du Frontend - Authentification (1h30)

    Création de la page de login (champs, validation basique)

    Création de la page d’inscription (champs, gestion d'état)

2026-03-27
1. Sécurisation des données sensibles (1h15)

    Migration de la base de données pour supporter le stockage des hashs

    Implémentation du hachage des mots de passe (remplacement du texte clair)

    Ajout d'un sel (Salt) unique par utilisateur pour renforcer les hashs

2. Renforcement de la sécurité (1h00)

    Ajout d'un poivre (Pepper) via les variables d'environnement

    Audit des requêtes SQL et correction des vulnérabilités par l'utilisation de requêtes préparées (prévention de l'injection SQL)

2026-04-24
1. Gestion des accès via JWT (1h15)

    Installation et configuration de la librairie JWT

    Implémentation de la génération du token lors de la connexion

    Intégration du token dans le header des requêtes frontend

2. Contrôle d'accès par rôles (1h00)

    Ajout des rôles "administrateur" et "utilisateur" dans le payload du JWT

    Mise en place des middlewares de protection sur les routes d’administration

2026-05-01
1. Protection contre le Brute-force (1h00)

    Implémentation du Rate Limiting (limitation à 5 essais par minute par IP)

    Tests de saturation pour valider le blocage

2. Verrouillage de compte (1h15)

    Création du système de suivi des tentatives échouées en base de données

    Logique de verrouillage automatique après N tentatives

    Développement du mécanisme de déblocage (via lien email ou intervention admin)

2026-05-08
1. Authentification forte (2h15)

    Configuration de l'authentification à double facteur (2FA)

    Intégration d'une librairie de génération de TOTP (Time-based One-Time Password)

    Mise à jour du flux de login pour inclure la vérification du second facteur

    Tests finaux de bout en bout et documentation de la procédure de connexion sécurisée