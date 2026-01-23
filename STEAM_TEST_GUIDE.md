# Test de l'Intégration Steam - Guide Rapide

## Objectif
Tester la fonctionnalité de suivi des versions de jeux Steam et les alertes de mise à jour.

## Prérequis
- Serveur dev en cours d'exécution : `npm run server`
- React app en cours d'exécution : `npm start`
- Credentials Nexus Mods configurés

## Tests à effectuer

### Test 1 : Affichage des infos Steam

1. **Démarrer l'application**
   ```bash
   npm start
   ```
   
2. **Naviguer vers "Mise à jour" ou "Liste des Mods"**

3. **Vérifier l'affichage des infos Steam**
   - Un encadré bleu devrait apparaître pour chaque jeu suivi qui a un mapping Steam
   - L'encadré contient :
     - Version (actuellement "Unknown")
     - Build ID (tronqué)
     - Date de dernière mise à jour
     - Lien vers Steam

4. **Jeux testables** (avec mapping Steam déjà configuré) :
   - Skyrim Special Edition
   - Skyrim (classique)
   - Fallout 4
   - Cyberpunk 2077
   - Baldur's Gate 3
   - The Witcher 3
   - Starfield
   - Elden Ring

### Test 2 : API Steam

1. **Tester l'endpoint directement**
   ```bash
   # Skyrim Special Edition (App ID: 489830)
   curl http://localhost:4000/api/steam/game/489830
   ```

2. **Vérifier la réponse JSON**
   ```json
   {
     "success": true,
     "appId": 489830,
     "name": "The Elder Scrolls V: Skyrim Special Edition",
     "buildId": "...",
     "version": "Unknown",
     "lastUpdate": ...,
     ...
   }
   ```

3. **Tester avec d'autres jeux**
   ```bash
   # Fallout 4 (377160)
   curl http://localhost:4000/api/steam/game/377160
   
   # Cyberpunk 2077 (1091500)
   curl http://localhost:4000/api/steam/game/1091500
   ```

### Test 3 : Simulation d'une mise à jour de jeu

1. **Ouvrir la console développeur** (F12)

2. **Vérifier le localStorage actuel**
   ```javascript
   console.log(JSON.parse(localStorage.getItem('steamGameVersions')));
   ```

3. **Simuler une ancienne version**
   ```javascript
   localStorage.setItem('steamGameVersions', JSON.stringify({
     skyrimspecialedition: {
       appId: 489830,
       name: "The Elder Scrolls V: Skyrim Special Edition",
       buildId: "OLD_VERSION_12345",
       version: "1.0.0",
       lastUpdate: Date.now() - 86400000 // Il y a 1 jour
     }
   }));
   ```

4. **Rafraîchir la page** (F5)

5. **Vérifier l'alerte**
   - Une alerte jaune devrait apparaître en bas à droite
   - Elle affiche l'ancien et le nouveau Build ID
   - Message : "Vérifiez la compatibilité de vos mods !"

### Test 4 : Gestion des alertes

1. **Générer plusieurs alertes**
   ```javascript
   localStorage.setItem('steamGameVersions', JSON.stringify({
     skyrimspecialedition: {
       appId: 489830,
       buildId: "OLD_1",
       version: "1.0.0",
       lastUpdate: Date.now() - 86400000
     },
     fallout4: {
       appId: 377160,
       buildId: "OLD_2",
       version: "1.0.0",
       lastUpdate: Date.now() - 86400000
     }
   }));
   ```

2. **Rafraîchir et tester**
   - Plusieurs alertes devraient s'empiler
   - Fermer une alerte individuellement (clic sur ✕)
   - Le bouton "Tout masquer" apparaît si > 1 alerte
   - Cliquer sur "Tout masquer" ferme toutes les alertes

### Test 5 : Cache et performance

1. **Ouvrir l'onglet Network (F12)**

2. **Naviguer vers "Mise à jour"**

3. **Observer les requêtes Steam**
   - Une requête par jeu la première fois
   - Pas de requête au second chargement (cache)

4. **Vider le cache navigateur**

5. **Recharger**
   - Les requêtes Steam sont refaites
   - Le cache serveur (6h) peut servir les données

### Test 6 : Jeux sans mapping Steam

1. **Suivre un jeu qui n'est pas dans le mapping**
   - Par exemple : un jeu obscur ou récent

2. **Vérifier qu'aucune erreur n'apparaît**
   - Pas d'encadré Steam pour ce jeu
   - Les autres jeux fonctionnent normalement

## Checklist de validation

- [ ] Les infos Steam s'affichent pour les jeux mappés
- [ ] L'API Steam répond correctement (`/api/steam/game/:appId`)
- [ ] Les alertes apparaissent lors d'une mise à jour détectée
- [ ] Les alertes peuvent être fermées individuellement
- [ ] Le bouton "Tout masquer" fonctionne
- [ ] Le cache fonctionne (pas de re-fetch à chaque chargement)
- [ ] Pas d'erreur pour les jeux non mappés
- [ ] L'animation de slide-in fonctionne
- [ ] Le thème sombre affiche correctement les infos Steam
- [ ] Les liens vers Steam fonctionnent

## Résultats attendus

### Comportement normal

1. **Au premier chargement** :
   - Les infos Steam se chargent en ~500ms par jeu
   - Un encadré bleu apparaît pour chaque jeu Steam
   - Aucune alerte (première visite)

2. **Lors d'une mise à jour réelle** :
   - Une alerte jaune apparaît automatiquement
   - L'utilisateur peut la fermer
   - Les nouvelles données sont stockées dans localStorage

3. **Performance** :
   - Impact minimal sur le temps de chargement global
   - Pas de blocage de l'interface
   - Chargement en arrière-plan

### Cas d'erreur gérés

1. **Jeu non trouvé sur Steam** → Pas d'affichage, pas d'erreur
2. **API Steam indisponible** → Pas de crash, erreur loggée
3. **localStorage désactivé** → Alertes ne se déclenchent pas mais pas de crash

## Commandes utiles

```bash
# Démarrer le dev server
npm run server

# Démarrer React
npm start

# Tester l'API
curl http://localhost:4000/api/steam/game/489830

# Vider le localStorage (console)
localStorage.clear()

# Voir les versions stockées (console)
JSON.parse(localStorage.getItem('steamGameVersions'))
```

## Notes pour le déploiement

1. **Vercel** : La fonction serverless `/api/steam/game/[appId].mjs` est déjà configurée
2. **Pas de variables d'env nécessaires** : L'API Steam Store est publique
3. **Cache** : Le cache serveur fonctionne différemment en serverless (par instance)

## Améliorations suggérées après test

Après avoir testé, notez ici ce qui pourrait être amélioré :

- [ ] 
- [ ] 
- [ ] 

## Bugs trouvés

- [ ] 
- [ ] 
- [ ] 
