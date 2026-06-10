# Guide de Test - Configuration des Identifiants

> **Pré-requis credentials** : voir [CREDENTIALS_CONFIG.md](./CREDENTIALS_CONFIG.md)

> **Exécution locale/CI** : voir [DEPLOYMENT.md](./DEPLOYMENT.md)

## Credentials de Test

Pour tester rapidement l'application sans créer de compte Nexus Mods :

- **Username** : `TheCourrier0`
- **Password** : `The Courrier0` (pour se connecter sur nexusmods.com et voir les interactions)
- **API Key** : `UWM49C/gfBy+QCvaL2pe9p+C8PLiNji+HjObvGWuxsI9qKW3X1I=--LjVbDPG5bU/U59Ph--lzlQfxo4wC5kS6KTnG0IMw==`

>  Ces credentials sont publics et destinés aux tests uniquement.

## Tests Manuels

### Test 1 : Première utilisation (aucun credential)

1. Ouvrir l'application dans un navigateur neuf (ou vider le localStorage)
2. **Résultat attendu** : La popup de configuration s'affiche automatiquement
3. Essayer de fermer la popup
4. **Résultat attendu** : La popup ne se ferme pas (pas de bouton Annuler)
5. Entrer un username et une API key
6. Cliquer sur "Enregistrer"
7. **Résultat attendu** : La popup se ferme et le badge utilisateur apparaît dans la navbar

### Test 2 : Validation des champs

1. Afficher la popup de configuration
2. Laisser le username vide et cliquer sur "Enregistrer"
3. **Résultat attendu** : Message d'erreur "Le nom d'utilisateur est requis"
4. Remplir le username mais laisser l'API key vide
5. **Résultat attendu** : Message d'erreur "La clé API est requise"

### Test 3 : Modification des credentials

1. Être connecté avec des credentials valides
2. Cliquer sur le bouton "Config" (icone engrenage) dans la navbar
3. **Résultat attendu** : La popup s'affiche avec un bouton "Annuler"
4. Modifier le username ou l'API key
5. Cliquer sur "Enregistrer"
6. **Résultat attendu** : Le badge utilisateur se met à jour
7. Cliquer à nouveau sur "Config" puis sur "Annuler"
8. **Résultat attendu** : La popup se ferme sans modification

### Test 4 : Suppression des credentials

1. Être connecté avec des credentials valides
2. Cliquer sur le bouton de suppression (icone corbeille) dans la navbar
3. **Résultat attendu** : Une confirmation s'affiche
4. Confirmer la suppression
5. **Résultat attendu** : Le badge utilisateur disparaît et la popup de configuration réapparaît

### Test 5 : Navigation entre les pages

1. Configurer des credentials valides
2. Naviguer vers "Nexus Mods"
3. **Résultat attendu** : Les mods se chargent correctement
4. Naviguer vers "Actus Mods"
5. **Résultat attendu** : Les actualités se chargent correctement
6. Le badge utilisateur reste visible sur toutes les pages

### Test 6 : Credentials invalides

1. Configurer des credentials avec une API key invalide
2. Naviguer vers "Nexus Mods" ou "Actus Mods"
3. **Résultat attendu** : Un message d'erreur s'affiche
4. Le message suggère de reconfigurer via le bouton " Config"

### Test 7 : Persistance (localStorage)

1. Configurer des credentials valides
2. Rafraîchir la page (F5)
3. **Résultat attendu** : Le badge utilisateur réapparaît automatiquement
4. Les pages fonctionnent sans redemander les credentials
5. Fermer et rouvrir le navigateur
6. **Résultat attendu** : Les credentials sont toujours présents

### Test 8 : Requêtes API

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet "Network"
3. Naviguer vers "Nexus Mods"
4. Inspecter la requête vers `/api/nexus/tracked`
5. **Résultat attendu** : Les headers contiennent :
   - `X-Nexus-Username`: votre username
   - `X-Nexus-ApiKey`: votre API key

### Test 9 : Untrack d'un mod

1. Être sur la page "Nexus Mods" avec des credentials valides
2. Sélectionner un jeu dans la liste déroulante
3. Cliquer sur le bouton "Ne plus suivre" sur un mod
4. **Résultat attendu** : Une confirmation s'affiche
5. Confirmer la suppression
6. **Résultat attendu** : Le mod disparaît de la liste

### Test 10 : Rafraîchir les données

1. Être sur "Actus Mods" ou "Nexus Mods"
2. Cliquer sur le bouton "Rafraîchir"
3. **Résultat attendu** : Les données se rechargent avec les credentials actuels

### Test 11 : Bouton de test de connexion dans la modal credentials

1. Ouvrir la popup de configuration (bouton "Config" dans la navbar)
2. Laisser les deux champs vides
3. **Résultat attendu** : Le bouton "Tester la connexion" est désactivé
4. Remplir uniquement le champ username
5. **Résultat attendu** : Le bouton reste désactivé
6. Remplir également le champ API key avec une clé valide
7. **Résultat attendu** : Le bouton est activé
8. Cliquer sur "Tester la connexion"
9. **Résultat attendu** : Le bouton affiche "Test en cours..." pendant la requête, puis un message de succès avec le nom d'utilisateur Nexus
10. Modifier l'un des deux champs
11. **Résultat attendu** : Le message de résultat disparaît immédiatement
12. Saisir une clé API invalide et cliquer sur "Tester la connexion"
13. **Résultat attendu** : Un message d'erreur s'affiche en rouge ; la popup reste ouverte

### Test 15 : Badge NEW dismissable

1. Configurer une derniere visite ancienne (vider localStorage ou attendre un rafraichissement avec de nouvelles MAJ)
2. Ouvrir la page "Liste des Mods" — des mods doivent afficher le badge NEW
3. Cliquer sur le bouton "Lu" a cote d'un badge NEW
4. **Resultat attendu** : le badge NEW disparait immediatement sur cette carte uniquement
5. Rafraichir la page
6. **Resultat attendu** : le mod reste marque comme lu (badge absent)
7. Cliquer sur "Tout marquer comme lu (N)" dans l'entete
8. **Resultat attendu** : tous les badges NEW visibles disparaissent et le bouton disparait

### Test 19 : Export de configuration

1. Configurer des tags sur quelques mods et passer en mode sombre
2. Cliquer sur le bouton "Exporter" dans la navbar
3. **Resultat attendu** : un fichier the-courrier-config-YYYY-MM-DD.json est telecharge
4. Ouvrir le fichier et verifier qu'il contient les tags et le theme
5. **Resultat attendu** : les credentials Nexus sont absents du fichier

### Test 20 : Import de configuration

1. Modifier le theme et quelques tags, puis exporter la configuration
2. Vider le localStorage (DevTools > Application > Storage)
3. Cliquer sur "Importer" et selectionner le fichier exporte
4. **Resultat attendu** : un bandeau confirme la restauration puis la page se recharge
5. **Resultat attendu** : les tags et le theme sont restaures
6. Tenter d'importer un fichier texte ou un JSON malformed
7. **Resultat attendu** : un bandeau d'erreur s'affiche (disparait apres 4 secondes)

### Test 18 : Tags/statuts sur les mods

1. Aller sur la page "Liste des Mods" avec au moins deux mods charges
2. Sur une carte, cliquer sur le bouton "Installe"
3. **Resultat attendu** : le bouton "Installe" apparait en vert actif et la bordure de la carte devient verte
4. Rafraichir la page
5. **Resultat attendu** : le statut est conserve (persistance localStorage)
6. Cliquer a nouveau sur le bouton "Installe" actif
7. **Resultat attendu** : le statut est retire, la bordure disparait (toggle off)
8. Cliquer sur "A installer", puis "En pause", puis "Archive" sur des cartes differentes
9. **Resultat attendu** : chaque carte affiche la couleur correspondante (bleu/jaune/rouge)
10. Dans le selecteur "Statut", choisir "Installe"
11. **Resultat attendu** : seuls les mods tagues "Installe" sont affiches
12. Choisir "Sans statut"
13. **Resultat attendu** : seuls les mods sans aucun statut sont affiches

### Test 16 : Filtre par categorie

1. Aller sur la page "Liste des Mods" avec des mods appartenant a des categories differentes
2. **Resultat attendu** : Le selecteur "Categorie" est visible et contient les categories presentes
3. Selectionner une categorie, par exemple "Gameplay"
4. **Resultat attendu** : Seuls les mods de la categorie "Gameplay" sont affiches
5. Selectionner "Toutes les categories"
6. **Resultat attendu** : Tous les mods reapparaissent
7. Selectionner un jeu qui ne possede aucune categorie sur ses mods
8. **Resultat attendu** : Le selecteur "Categorie" disparait
9. Combiner le filtre categorie avec une recherche textuelle
10. **Resultat attendu** : Les deux filtres s'appliquent simultanement

### Test 17 : Filtre par categorie sur la page Actualites

1. Aller sur la page "Actualites des Mods"
2. **Resultat attendu** : Le selecteur "Categorie" est visible si des mods ont une categorie dans la periode selectionnee
3. Selectionner une categorie
4. **Resultat attendu** : Seuls les mods de cette categorie sont affiches dans chaque groupe-jeu
5. Changer de jeu dans le selecteur "Filtrer par jeu"
6. **Resultat attendu** : Le filtre categorie se reinitialise a "Toutes les categories" et la liste des categories disponibles se met a jour

### Test 12 : Recherche de mods

1. Aller sur la page "Liste des Mods" avec au moins deux mods de noms différents
2. Saisir une partie du nom d'un mod dans le champ de recherche
3. **Résultat attendu** : Seuls les mods dont le nom contient la saisie s'affichent ; le compteur de résultats est correct
4. Effacer et saisir le nom d'un auteur connu
5. **Résultat attendu** : Tous les mods de cet auteur s'affichent
6. Combiner la recherche avec le filtre jeu
7. **Résultat attendu** : Les deux filtres s'appliquent simultanément

### Test 13 : Suppression en lot de mods suivis

1. Aller sur la page "Liste des Mods"
2. Cocher deux ou trois mods via leurs cases à cocher
3. **Résultat attendu** : La barre d'action sticky apparaît en bas de page avec le compteur correct
4. Cliquer sur "Tout sélectionner"
5. **Résultat attendu** : Tous les mods visibles sont cochés
6. Cliquer sur "Tout désélectionner"
7. **Résultat attendu** : Toutes les cases sont décochées et la barre disparaît
8. Cocher à nouveau deux mods, cliquer sur le bouton de suppression de la barre
9. **Résultat attendu** : Une confirmation unique s'affiche ; après confirmation, les deux mods disparaissent

### Test 14 : Export JSON

1. Aller sur la page "Liste des Mods"
2. Cliquer sur le bouton "Exporter JSON"
3. **Résultat attendu** : Un fichier the-courrier-mods-YYYY-MM-DD.json est téléchargé
4. Ouvrir le fichier et vérifier la structure
5. **Résultat attendu** : Chaque entrée contient les champs name, author, version, category, url, game, updatedAt en ISO 8601

## Tests Automatisés

### Tests implementes

**src/components/CredentialsModal.test.jsx** (10 tests), **src/components/useLastVisit.test.js** (9 tests), **src/pages/NexusModsPage.test.jsx** (7 tests) — React Testing Library

- Rendu conditionnel selon la prop `show`
- Etat desactive du bouton de test si les champs sont vides
- Affichage du message de succes apres une reponse 200 de l'API
- Affichage du message d'erreur apres une reponse non-200 (cle invalide)
- Affichage du message d'erreur en cas d'echec reseau
- Reinitialisation du resultat lors de la modification des champs
- Appel correct de `onSave` avec les valeurs saisies
- Persistance de `seenMods` dans localStorage via `markAsSeen` et `markAllAsSeen`
- `countNew` excluant les mods deja vus
- Filtre par categorie : affichage conditionnel du selecteur, filtrage correct, cumul avec la recherche
- Tags : lecture/ecriture/suppression, toggle on/off/switch, persistance localStorage
- useNexusCredentials : chargement, JSON invalide, saveCredentials, clearCredentials
- useNexusMods : normalisation, headers, erreurs, modsForGame, refresh, untrackMod

Execution : `node_modules/.bin/react-scripts test --watchAll=false`

### Tests a implementer

```javascript
// src/components/useNexusCredentials.test.js
describe('useNexusCredentials', () => {
  test('devrait démarrer sans credentials', ...);
  test('devrait sauvegarder les credentials dans localStorage', ...);
  test('devrait supprimer les credentials', ...);
});

// src/components/useLastVisit.test.js
describe('useLastVisit', () => {
  test('isNew retourne false si le mod est dans seenMods', ...);
  test('markAsSeen persiste dans localStorage', ...);
  test('countNew exclut les mods marques comme vus', ...);
});
```

## Checklist de Validation

- [ ] La popup s'affiche au premier lancement
- [ ] Les champs sont validés correctement
- [ ] Les credentials sont sauvegardés dans localStorage
- [ ] Le badge utilisateur s'affiche correctement
- [ ] Les credentials peuvent être modifiés
- [ ] Les credentials peuvent être supprimés
- [ ] Les credentials persistent après rafraîchissement
- [ ] Les headers HTTP sont envoyés correctement
- [ ] Les erreurs 401 sont gérées avec un message clair
- [ ] La navigation fonctionne sur toutes les pages
- [ ] Le bouton "Rafraîchir" fonctionne
- [ ] Le untrack de mod fonctionne avec les nouveaux credentials
- [ ] Pas de régression sur les fonctionnalités existantes

## Scénarios d'Erreur

### Erreur 1 : API Key invalide
- **Symptôme** : Erreur 401 ou message "Invalid API Key"
- **Solution** : Reconfigurer avec une clé API valide via le bouton "Config" dans la navbar

### Erreur 2 : localStorage désactivé
- **Symptôme** : La popup réapparaît à chaque rechargement
- **Solution** : Activer les cookies/localStorage dans les paramètres du navigateur

### Erreur 3 : Headers non envoyés
- **Symptôme** : Erreur "Missing credentials"
- **Vérification** : Inspecter les requêtes dans Network tab
- **Solution** : Vérifier que les headers `X-Nexus-*` sont bien ajoutés

### Erreur 4 : CORS
- **Symptôme** : Erreur CORS dans la console
- **Vérification** : Les fonctions serverless doivent autoriser les headers personnalisés
- **Solution** : Vérifier `Access-Control-Allow-Headers` dans les fonctions API

## Performance

### Métriques à surveiller

1. **Temps de chargement initial** : < 2s
2. **Temps de sauvegarde des credentials** : < 100ms
3. **Temps de réponse API avec credentials** : similaire à avant
4. **Taille du localStorage** : ~100-200 bytes pour les credentials

### Optimisations

- Les credentials sont chargés une seule fois au démarrage
- Pas de re-render inutile grâce aux hooks mémorisés
- Le cache localStorage est instantané (pas de latence réseau)

## Sécurité

### Tests de sécurité

1. **XSS** : Vérifier que les credentials ne peuvent pas être injectés via l'URL
2. **Inspection** : Les credentials sont visibles dans localStorage (comportement attendu)
3. **HTTPS** : En production, vérifier que HTTPS est utilisé
4. **Headers** : Les credentials ne sont envoyés qu'aux endpoints `/api/nexus/*`

### Recommandations

- Ne jamais partager les credentials en clair
- En production, utiliser HTTPS obligatoirement
- Considérer l'ajout de chiffrement pour une sécurité accrue
- Implémenter une expiration automatique des credentials

---

**Note** : Pour tester en mode développement, utilisez `npm start` et ouvrez http://localhost:3000

