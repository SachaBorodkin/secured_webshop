OBLIGATOIRES
 - [ ] Implémenter une page de login en frontend
 - [ ] Implémenter une page d’inscription en frontend
 - [ ] Remplacer les mots de passes en clair dans la base par un hash
 - [ ] Ajouter un sel
 - [ ] Ajouter un poivre
 - [ ] Corriger les requêtes existantes afin de prévenir l’injection SQL
 - [ ] Implémenter l’utilisation d’un token JWT
 - [ ] Ajouter les rôles administrateur et utilisateur dans le JWT et protéger les routes d’administration
  
   1.1 Activités « Faciles » (1 point / tâche)
       
    [ ] Tâche 1 : Mettre en place le HTTPS.

    [ ] Tâche 2 : Implémenter une politique de mot de passe fort (minuscules, majuscules, longueur, caractères spéciaux) avec un indicateur de force visuel.

    [ ] Tâche 3 : Limiter la durée du token JWT et implémenter un système de refresh token.

    [ ] Tâche 4 : Effectuer un audit des dépendances NPM, corriger les vulnérabilités et documenter les changements.

    [ ] Tâche 5 : Tester la résistance des hashs via John The Ripper et comparer aux rainbow tables (export BDD).

    [ ] Tâche 6 : Gestion globale des exceptions pour éviter la fuite d'informations sensibles dans les messages d'erreur.
1.2 Activités « Moyennes » (2 points / tâche)

    [ ] Tâche 7 : Implémenter un Rate Limiting sur le login (ex: 5 essais/min par IP) contre le brute-force.

    [ ] Tâche 8 : Mise en place d'un verrouillage de compte après N tentatives, avec historique en BDD et mécanisme de déblocage.

    [ ] Tâche 9 : Réaliser un audit complet basé sur le Top 10 OWASP 2025 et classer les failles identifiées.

    [ ] Tâche 10 : Chiffrement des données sensibles (RGPD) directement dans la base de données (adresses, etc.).

    [ ] Tâche 11 : Identification et correction d'une faille XSS spécifique au sein de l'application.

    [ ] Tâche 12 : Appliquer le principe de moindre privilège sur la BDD (création d'un utilisateur dédié aux scripts).
 1.3 Activités « Difficiles » (3 points / tâche)

    [ ] Tâche 13 : Implémenter une protection contre les failles CSRF sur les formulaires critiques.

    [ ] Tâche 14 : Mise en place d'une journalisation sécurisée (logging) des accès et erreurs sans fuite de données privées.

    [ ] Tâche 15 : Implémenter l'authentification à deux facteurs (2FA).

    [ ] Tâche 16 : Sécuriser l'upload de fichiers (photo de profil) pour bloquer l'exécution de scripts malveillants.

    [ ] Tâche 17 : Scanner l'application avec OWASP ZAP, fournir le rapport et corriger au minimum 3 alertes majeures.
