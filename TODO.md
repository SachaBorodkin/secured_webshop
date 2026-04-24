# Roadmap Sécurité & Authentification

## ÉLÉMENTS OBLIGATOIRES

Ces tâches constituent le socle de base du projet.

### Authentification & Frontend

- [ ] Implémenter une page de login en frontend
- [ ] Implémenter une page d'inscription en frontend
- [ ] Implémenter l'utilisation d'un token JWT
- [ ] Ajouter les rôles administrateur et utilisateur dans le JWT et protéger les routes d'administration

### Sécurité Backend & Base de Données

- [ ] Remplacer les mots de passes en clair dans la base par un hash
- [ ] Ajouter un sel (Salt)
- [ ] Ajouter un poivre (Pepper)
- [ ] Corriger les requêtes existantes afin de prévenir l'injection SQL

## 1.1 Activités « Faciles »

Points : 1 pt / tâche

- [ ] Tâche 1 : Mettre en place le HTTPS.
- [ ] Tâche 2 : Implémenter une politique de mot de passe fort (complexité + indicateur visuel).
- [ ] Tâche 3 : Limiter la durée du JWT et implémenter un système de refresh token.
- [ ] Tâche 4 : Audit des dépendances NPM et correction des vulnérabilités.
- [ ] Tâche 5 : Test de résistance des hashs via John The Ripper vs Rainbow Tables.
- [ ] Tâche 6 : Gestion globale des exceptions (anti-fuite d'informations sensibles).

## 1.2 Activités « Moyennes »

Points : 2 pts / tâche

- [ ] Tâche 7 : Implémenter un Rate Limiting sur le login (ex: 5 essais/min/IP).
- [ ] Tâche 8 : Verrouillage de compte après N tentatives (historique BDD + déblocage).
- [ ] Tâche 9 : Audit complet basé sur le Top 10 OWASP 2025.
- [ ] Tâche 10 : Chiffrement des données sensibles (RGPD) en base de données.
- [ ] Tâche 11 : Identification et correction d'une faille XSS spécifique.
- [ ] Tâche 12 : Application du principe de moindre privilège sur l'utilisateur BDD.

## 1.3 Activités « Difficiles »

Points : 3 pts / tâche

- [ ] Tâche 13 : Protection contre les failles CSRF sur les formulaires critiques.
- [ ] Tâche 14 : Mise en place d'une journalisation sécurisée (logging) sans données privées.
- [ ] Tâche 15 : Implémenter l'authentification à deux facteurs (2FA).
- [ ] Tâche 16 : Sécurisation de l'upload de fichiers (vérification magique, scan, exécution).
- [ ] Tâche 17 : Scan automatisé avec OWASP ZAP et correction de 3 alertes majeures.