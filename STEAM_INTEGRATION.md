# Steam Integration - Suivi des Versions de Jeux

## Vue d'ensemble

Cette fonctionnalité permet de suivre les versions des jeux Steam et d'alerter les utilisateurs lorsqu'une mise à jour du jeu est détectée, afin de prévenir les incompatibilités potentielles avec les mods suivis sur Nexus Mods.

## Fonctionnalités

### 1. Suivi automatique des versions Steam

- Récupération automatique des informations de jeu depuis l'API Steam
- Mapping entre les domaines Nexus Mods et les App IDs Steam
- Stockage local (localStorage) des versions pour comparaison
- Mise en cache des données Steam (6 heures)

### 2. Alertes de mise à jour

Lorsqu'une nouvelle version d'un jeu est détectée :
- Une alerte visuelle apparaît en bas à droite de l'écran
- L'alerte affiche :
  - Le nom du jeu
  - L'ancienne et la nouvelle version
  - L'ancien et le nouveau Build ID
  - Un message de prudence sur la compatibilité des mods
- Les alertes peuvent être fermées individuellement ou toutes en même temps

### 3. Affichage des infos Steam

Sur les pages "Mise à jour" et "Liste des Mods", un encadré bleu affiche pour chaque jeu :
- La version actuelle
- Le Build ID (tronqué)
- La date de dernière mise à jour
- Un lien vers la page Steam du jeu

## Architecture

### Composants

#### `useSteamGames.js` (Hook personnalisé)
- **Responsabilité** : Gestion des données Steam et détection des mises à jour
- **Fonctions exposées** :
  - `getSteamInfo(domain)` : Récupère les infos Steam d'un jeu
  - `getSteamAppId(domain)` : Récupère l'App ID Steam d'un domaine Nexus
  - `dismissAlert(alertId)` : Ferme une alerte spécifique
  - `dismissAllAlerts()` : Ferme toutes les alertes
  - `refresh()` : Rafraîchit les données Steam

#### `GameUpdateAlert.jsx` (Composant UI)
- **Responsabilité** : Affichage des alertes de mise à jour
- **Props** :
  - `alerts` : Tableau des alertes à afficher
  - `onDismiss` : Callback pour fermer une alerte
  - `onDismissAll` : Callback pour fermer toutes les alertes

#### `SteamGameInfo.jsx` (Composant UI)
- **Responsabilité** : Affichage des infos Steam dans les pages
- **Props** :
  - `domain` : Domaine Nexus du jeu
  - `steamInfo` : Objet contenant les infos Steam

### API

#### Serverless Function : `/api/steam/game/[appId].mjs`
- **Endpoint** : `GET /api/steam/game/:appId`
- **Rôle** : Proxy pour l'API Steam Store (évite les problèmes CORS)
- **Paramètres** : 
  - `appId` : ID Steam du jeu (nombre)
- **Réponse** :
  ```json
  {
    "success": true,
    "appId": 489830,
    "name": "The Elder Scrolls V: Skyrim Special Edition",
    "buildId": "1234567890123",
    "version": "Unknown",
    "lastUpdate": 1234567890123,
    "releaseDate": "2016-10-28",
    "shortDescription": "...",
    "headerImage": "https://...",
    "developers": ["Bethesda Game Studios"],
    "publishers": ["Bethesda Softworks"]
  }
  ```

#### Dev Server : `server.mjs`
Route identique pour le développement local :
```javascript
app.get("/api/steam/game/:appId", async (req, res) => { ... })
```

### Mapping Nexus → Steam

Le fichier `useSteamGames.js` contient un mapping statique :

```javascript
const NEXUS_TO_STEAM_MAP = {
  skyrimspecialedition: 489830,
  skyrim: 72850,
  fallout4: 377160,
  cyberpunk2077: 1091500,
  baldursgate3: 1086940,
  // ... etc
};
```

**Pour ajouter un nouveau jeu :**
1. Trouvez l'App ID Steam sur [SteamDB](https://steamdb.info/)
2. Ajoutez la correspondance dans `NEXUS_TO_STEAM_MAP`
3. Le domaine Nexus est visible dans les URLs : `nexusmods.com/[DOMAIN]/mods/...`

## Stockage des données

### localStorage
Clé : `steamGameVersions`

Structure :
```json
{
  "skyrimspecialedition": {
    "appId": 489830,
    "name": "The Elder Scrolls V: Skyrim Special Edition",
    "buildId": "1234567890123",
    "version": "Unknown",
    "lastUpdate": 1234567890123
  },
  "fallout4": { ... }
}
```

### Cache serveur
- Clé : `steam:${appId}`
- TTL : 6 heures
- Partagé entre les utilisateurs (en dev server uniquement)

## Limitations actuelles

### 1. Version du jeu
L'API Steam publique ne fournit pas directement le numéro de version du jeu. Actuellement, nous utilisons la date de release comme proxy pour le Build ID.

**Solutions possibles** :
- Utiliser [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) (nécessite un serveur)
- Utiliser l'API Steam Web (nécessite une clé API Steam)
- Parser les changelogs Steam (non fiable)

### 2. Jeux non-Steam
Certains jeux (Minecraft Java, GOG exclusives) ne sont pas sur Steam.

**Solution** : Retourner `null` pour ces jeux, aucune info Steam n'est affichée.

### 3. Détection des mises à jour
La détection se base sur la comparaison des Build IDs. Si Steam ne met pas à jour cette valeur immédiatement, il peut y avoir un délai.

## Tests

### Test manuel

1. **Première visite** :
   - Ouvrir l'application
   - Les infos Steam devraient se charger pour tous les jeux suivis
   - Vérifier que les encadrés bleus s'affichent

2. **Simulation de mise à jour** :
   - Ouvrir la console développeur
   - Exécuter :
     ```javascript
     localStorage.setItem('steamGameVersions', JSON.stringify({
       skyrimspecialedition: {
         appId: 489830,
         name: "Skyrim SE",
         buildId: "OLD_BUILD_ID",
         version: "1.0.0",
         lastUpdate: Date.now() - 86400000
       }
     }));
     ```
   - Rafraîchir la page
   - Une alerte devrait apparaître si le Build ID a changé

3. **Fermeture des alertes** :
   - Cliquer sur la croix d'une alerte → elle disparaît
   - Cliquer sur "Tout masquer" → toutes les alertes disparaissent

### Test de l'API

```bash
# Dev server (local)
curl http://localhost:4000/api/steam/game/489830

# Production (Vercel)
curl https://your-app.vercel.app/api/steam/game/489830
```

## Performance

### Optimisations implémentées

1. **Batch loading** : Les infos Steam sont chargées par lots de 5 jeux max en parallèle
2. **Cache API** : Les réponses Steam sont mises en cache 6 heures
3. **localStorage** : Évite de recharger les données à chaque refresh
4. **Lazy loading** : Les infos Steam ne se chargent qu'au montage du composant

### Métriques attendues

- Temps de chargement initial : +200-500ms (par rapport à sans Steam)
- Requêtes API Steam : 1 par jeu (puis cache)
- Taille localStorage : ~500 bytes par jeu

## Améliorations futures

### Court terme
- [ ] Ajouter plus de mappings Nexus → Steam
- [ ] Améliorer la détection de version (SteamCMD?)
- [ ] Ajouter un indicateur de chargement pour les infos Steam
- [ ] Permettre de désactiver le suivi Steam (option utilisateur)

### Moyen terme
- [ ] Intégrer d'autres plateformes (GOG, Epic Games Store)
- [ ] Historique des versions de jeux
- [ ] Notifications push pour les mises à jour critiques
- [ ] API pour vérifier la compatibilité des mods avec une version de jeu

### Long terme
- [ ] Base de données communautaire de compatibilité mod/version
- [ ] Intégration avec les changelogs de jeux
- [ ] Prédiction des incompatibilités basée sur l'historique

## Dépannage

### Les infos Steam ne s'affichent pas
1. Vérifier que le jeu a un mapping dans `NEXUS_TO_STEAM_MAP`
2. Vérifier la console développeur pour les erreurs API
3. Vérifier que l'API Steam est accessible (parfois bloquée par certains FAI)

### Les alertes n'apparaissent jamais
1. Vérifier que localStorage contient des données anciennes
2. Simuler une mise à jour manuellement (voir Tests)
3. Vérifier que le Build ID change réellement

### Performance lente
1. Vider le cache : `localStorage.removeItem('steamGameVersions')`
2. Vérifier le nombre de jeux suivis (temps proportionnel)
3. Vérifier les logs serveur pour les erreurs Steam API

## Ressources

- [Steam Store API](https://wiki.teamfortress.com/wiki/User:RJackson/StorefrontAPI)
- [SteamDB](https://steamdb.info/) - Database des jeux Steam
- [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD) - Outil CLI Steam
- [Nexus Mods API](https://app.swaggerhub.com/apis-docs/NexusMods/nexus-mods_public_api_params_in_form_data/1.0)
