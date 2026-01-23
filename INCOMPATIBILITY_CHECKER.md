# Vérificateur d'Incompatibilités

## Vue d'ensemble

Le **Vérificateur d'Incompatibilités** est une nouvelle page qui analyse automatiquement vos mods suivis pour détecter d'éventuels conflits ou incompatibilités potentielles.

## Fonctionnalités

### Types de conflits détectés

1. **Conflits de catégories** (Sévérité : Moyenne)
   - Détecte plusieurs mods dans des catégories critiques qui peuvent entrer en conflit
   - Catégories surveillées :
     - Overhauls
     - Combat
     - Gameplay
     - User Interface
     - Visuals and Graphics
     - ENB/ReShade Presets

2. **Conflits d'auteur** (Sévérité : Haute)
   - Détecte plusieurs mods similaires du même auteur
   - Identifie les variantes ou alternatives qui ne devraient pas être installées ensemble
   - Compare les noms de mods pour détecter les similarités

3. **Versions obsolètes** (Sévérité : Faible)
   - Identifie les mods très anciens (>1 an) utilisés avec des mods récents (<6 mois)
   - Alerte sur les risques d'incompatibilité dus à des différences de versions du jeu

## Interface utilisateur

### Éléments visuels

- **Codes couleur par sévérité** :
  - 🚨 Rouge : Conflit probable (haute sévérité)
  - ⚠️ Jaune : Attention recommandée (sévérité moyenne)
  - ℹ️ Bleu : Information (faible sévérité)

- **Filtrage par jeu** : Permet d'analyser les mods jeu par jeu ou tous ensemble

- **Détails extensibles** : Cliquez sur "▶ Détails" pour voir la liste complète des mods concernés

### États de la page

1. **Aucun mod suivi** : Affiche un message d'introduction avec instructions
2. **Analyse en cours** : Indicateur de chargement pendant la récupération des données
3. **Aucun conflit** : Message positif avec badge vert
4. **Conflits détectés** : Liste détaillée des conflits par jeu

## Algorithmes de détection

### Détection de conflits de catégories

```javascript
// Vérifie si plusieurs mods dans une catégorie critique
categoriesConflicts = mods.filter(category in criticalCategories)
  .groupBy(category)
  .filter(count > 1)
```

### Détection de conflits d'auteur

```javascript
// Vérifie si des mods du même auteur ont des noms similaires
authorConflicts = mods.groupBy(author)
  .filter(count > 1 && hasSimilarNames)
```

### Détection de versions obsolètes

```javascript
// Compare les dates de mise à jour
oldMods = mods.filter(updatedAt < 1 year ago)
recentMods = mods.filter(updatedAt < 6 months ago)
if (oldMods.length > 0 && recentMods.length > 0) {
  // Conflit potentiel
}
```

## Utilisation

### Accès

- Navigation : Cliquez sur "🔍 Incompatibilités" dans la barre de navigation
- URL directe : `/incompatibility`
- Disponible sur desktop et mobile

### Workflow recommandé

1. Configurez vos identifiants Nexus Mods
2. Suivez vos mods favoris sur Nexus Mods
3. Visitez la page Incompatibilités
4. Filtrez par jeu si nécessaire
5. Examinez les conflits détectés
6. Consultez les pages Nexus des mods concernés pour vérifier les incompatibilités documentées

## Limitations

### Ce que l'outil NE fait PAS

- ❌ Ne détecte pas les incompatibilités documentées uniquement sur les pages de mods
- ❌ Ne vérifie pas l'ordre de chargement (load order)
- ❌ Ne détecte pas les conflits de fichiers spécifiques
- ❌ Ne remplace pas la lecture des descriptions de mods

### Recommandations

Toujours :
- ✅ Lire la section "Requirements" sur chaque page de mod
- ✅ Lire la section "Incompatibilities" quand elle existe
- ✅ Vérifier les commentaires pour des problèmes signalés
- ✅ Utiliser des outils spécialisés (LOOT, Mod Organizer 2) pour l'ordre de chargement
- ✅ Chercher des patches de compatibilité sur Nexus

## Architecture technique

### Fichiers

- **Page** : `src/pages/IncompatibilityPage.jsx`
- **Route** : Ajoutée dans `src/App.jsx`

### Dépendances

- `useNexusMods` : Hook pour récupérer les données de mods
- React Router : Pour la navigation

### Données utilisées

- Liste des mods suivis (via API Nexus)
- Métadonnées : catégorie, auteur, version, date de mise à jour
- Informations de jeu : nom, domain, gameId

### Performance

- Analyse effectuée côté client (pas d'appel API supplémentaire)
- Calcul mémorisé avec `useMemo` pour éviter les recalculs inutiles
- Filtrage par jeu pour réduire la charge d'affichage

## Évolutions futures possibles

### Améliorations de détection

1. **Analyse des descriptions** : Parser les pages de mods pour extraire les incompatibilités documentées
2. **Base de données de conflits** : Maintenir une liste communautaire de conflits connus
3. **Détection de dépendances manquantes** : Vérifier si tous les "requirements" sont installés
4. **Analyse de fichiers** : Détecter les conflits de fichiers spécifiques (nécessiterait accès au système de fichiers)

### Améliorations UX

1. **Suggestions de résolution** : Proposer des patches de compatibilité
2. **Export de rapport** : Générer un rapport d'analyse téléchargeable
3. **Comparaison de load orders** : Intégrer avec LOOT pour suggestions d'ordre
4. **Notifications** : Alerter l'utilisateur quand un conflit est détecté après ajout d'un mod

### Intégrations

1. **Mod Organizer 2** : Importer/exporter la liste de mods
2. **LOOT** : Suggérer un ordre de chargement optimal
3. **Wabbajack** : Détecter les modlists populaires et leurs incompatibilités connues

## Support

Pour signaler un faux positif ou suggérer des améliorations de détection, ouvrez une issue sur GitHub.

---

**Note** : Cette fonctionnalité est expérimentale et destinée à être une aide, pas une solution définitive. Toujours vérifier manuellement les incompatibilités critiques.
