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

###  Test 1 : Première utilisation (aucun credential)

1. Ouvrir l'application dans un navigateur neuf (ou vider le localStorage)
2. **Résultat attendu** : La popup de configuration s'affiche automatiquement
3. Essayer de fermer la popup
4. **Résultat attendu** : La popup ne se ferme pas (pas de bouton Annuler)
5. Entrer un username et une API key
6. Cliquer sur "Enregistrer"
7. **Résultat attendu** : La popup se ferme et le badge utilisateur apparaît dans la navbar

###  Test 2 : Validation des champs

1. Afficher la popup de configuration
2. Laisser le username vide et cliquer sur "Enregistrer"
3. **Résultat attendu** : Message d'erreur "Le nom d'utilisateur est requis"
4. Remplir le username mais laisser l'API key vide
5. **Résultat attendu** : Message d'erreur "La clé API est requise"

###  Test 3 : Modification des credentials

1. Être connecté avec des credentials valides
2. Cliquer sur le bouton " Config" dans la navbar
3. **Résultat attendu** : La popup s'affiche avec un bouton "Annuler"
4. Modifier le username ou l'API key
5. Cliquer sur "Enregistrer"
6. **Résultat attendu** : Le badge utilisateur se met à jour
7. Cliquer à nouveau sur " Config" puis sur "Annuler"
8. **Résultat attendu** : La popup se ferme sans modification

###  Test 4 : Suppression des credentials

1. Être connecté avec des credentials valides
2. Cliquer sur le bouton "" dans la navbar
3. **Résultat attendu** : Une confirmation s'affiche
4. Confirmer la suppression
5. **Résultat attendu** : Le badge utilisateur disparaît et la popup de configuration réapparaît

###  Test 5 : Navigation entre les pages

1. Configurer des credentials valides
2. Naviguer vers "Nexus Mods"
3. **Résultat attendu** : Les mods se chargent correctement
4. Naviguer vers "Actus Mods"
5. **Résultat attendu** : Les actualités se chargent correctement
6. Le badge utilisateur reste visible sur toutes les pages

###  Test 6 : Credentials invalides

1. Configurer des credentials avec une API key invalide
2. Naviguer vers "Nexus Mods" ou "Actus Mods"
3. **Résultat attendu** : Un message d'erreur s'affiche
4. Le message suggère de reconfigurer via le bouton " Config"

###  Test 7 : Persistance (localStorage)

1. Configurer des credentials valides
2. Rafraîchir la page (F5)
3. **Résultat attendu** : Le badge utilisateur réapparaît automatiquement
4. Les pages fonctionnent sans redemander les credentials
5. Fermer et rouvrir le navigateur
6. **Résultat attendu** : Les credentials sont toujours présents

###  Test 8 : Requêtes API

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet "Network"
3. Naviguer vers "Nexus Mods"
4. Inspecter la requête vers `/api/nexus/tracked`
5. **Résultat attendu** : Les headers contiennent :
   - `X-Nexus-Username`: votre username
   - `X-Nexus-ApiKey`: votre API key

###  Test 9 : Untrack d'un mod

1. Être sur la page "Nexus Mods" avec des credentials valides
2. Sélectionner un jeu dans la liste déroulante
3. Cliquer sur " Ne plus suivre" sur un mod
4. **Résultat attendu** : Une confirmation s'affiche
5. Confirmer la suppression
6. **Résultat attendu** : Le mod disparaît de la liste

###  Test 10 : Rafraîchir les données

1. Être sur "Actus Mods" ou "Nexus Mods"
2. Cliquer sur le bouton "Rafraîchir"
3. **Résultat attendu** : Les données se rechargent avec les credentials actuels

## Tests Automatisés (à implémenter)

### Tests unitaires

```javascript
// test/useNexusCredentials.test.js
describe('useNexusCredentials', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should start with no credentials', () => {
    const { result } = renderHook(() => useNexusCredentials());
    expect(result.current.hasCredentials).toBe(false);
  });

  test('should save credentials to localStorage', () => {
    const { result } = renderHook(() => useNexusCredentials());
    act(() => {
      result.current.saveCredentials('testuser', 'testkey123');
    });
    expect(result.current.hasCredentials).toBe(true);
    expect(result.current.credentials.username).toBe('testuser');
  });

  test('should clear credentials', () => {
    const { result } = renderHook(() => useNexusCredentials());
    act(() => {
      result.current.saveCredentials('testuser', 'testkey123');
      result.current.clearCredentials();
    });
    expect(result.current.hasCredentials).toBe(false);
  });
});
```

### Tests d'intégration

```javascript
// test/App.integration.test.js
describe('App Integration', () => {
  test('should show credentials modal on first load', () => {
    render(<App />);
    expect(screen.getByText(/Configuration Nexus Mods/i)).toBeInTheDocument();
  });

  test('should hide modal after saving credentials', async () => {
    render(<App />);
    
    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const apikeyInput = screen.getByLabelText(/Clé API/i);
    const saveButton = screen.getByText(/Enregistrer/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(apikeyInput, { target: { value: 'testkey123' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText(/Configuration Nexus Mods/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });
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
- **Solution** : Reconfigurer avec une clé API valide via " Config"

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

