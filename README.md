# The_Courrier

Une WebApp permettant à terme de réunir dans un même endroit les informations de mises à jour de jeux sélectionnés (via Steam par exemple) et mods sélectionnés (via Nexus Mod par exemple).

## 🆕 Configuration des Identifiants

Cette application permet désormais aux utilisateurs de **configurer leurs propres identifiants Nexus Mods** directement dans l'interface, sans avoir besoin de les stocker sur le serveur.

### ⚡ Démarrage Rapide

1. Lancez l'application
2. Une popup s'affiche automatiquement pour demander vos identifiants Nexus Mods
3. Entrez votre **nom d'utilisateur** et votre **clé API** (obtenez-la sur [nexusmods.com/users/myaccount?tab=api](https://www.nexusmods.com/users/myaccount?tab=api))
4. Cliquez sur "Enregistrer"
5. Profitez de l'application !

### 🔐 Sécurité

- Vos identifiants sont stockés **uniquement dans votre navigateur** (localStorage)
- Aucune donnée sensible n'est envoyée ni stockée sur nos serveurs
- Les credentials transitent uniquement entre votre navigateur et les serveurs de Nexus Mods

📖 Pour plus de détails, consultez [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

### 🚀 Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions de déploiement sur Vercel ou Netlify.
