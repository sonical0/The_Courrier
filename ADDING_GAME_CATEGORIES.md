# Comment ajouter les catégories d'un nouveau jeu

## Méthode rapide

1. Ouvrez votre navigateur et allez sur : `https://www.nexusmods.com/[GAME_DOMAIN]/mods/categories/`
   - Exemple : `https://www.nexusmods.com/starfield/mods/categories/`

2. Ouvrez la console développeur (F12) et collez ce code :

```javascript
const categories = {};
document.querySelectorAll('a[href*="/mods/categories/"]').forEach(link => {
  const match = link.href.match(/\/mods\/categories\/(\d+)\//);
  if (match) {
    const id = parseInt(match[1]);
    const text = link.textContent.trim();
    const name = text.replace(/\s*\d[\d,\s]*files.*$/i, '').trim();
    if (name && name.length > 0) {
      categories[id] = name;
    }
  }
});
console.log(JSON.stringify(categories, null, 2));
```

3. Copiez le résultat JSON de la console

4. Ouvrez [src/data/nexus-categories.json](src/data/nexus-categories.json) et ajoutez votre jeu :

```json
{
  "skyrimspecialedition": { ... },
  "starfield": {
    "1": "Starfield",
    "2": "Miscellaneous",
    "3": "Armor"
    // ... collez vos catégories ici ...
  }
}
```

5. Redémarrez le serveur !

## Méthode alternative (manuelle)

1. Allez sur la page des catégories du jeu
2. Cliquez sur chaque catégorie pour voir son URL
3. L'URL contient l'ID : `/mods/categories/24/` → ID = 24
4. Notez le nom de la catégorie
5. Ajoutez-les manuellement dans `server.mjs`

## Exemple complet

Pour **Starfield**, après extraction :

```json
"starfield": {
  "1": "Starfield",
  "2": "Miscellaneous",
  "3": "Armor",
  "4": "Audio",
  "5": "Character Presets",
  "6": "Clothing",
  "7": "Companions",
  "8": "Creatures",
  "9": "Gameplay",
  "10": "Locations",
  "11": "Miscellaneous",
  "12": "Modders Resources",
  "13": "Ships",
  "14": "User Interface",
  "15": "Utilities",
  "16": "Visuals and Graphics",
  "17": "Weapons"
}
```

## Jeux actuellement configurés

✅ Skyrim Special Edition  
✅ Skyrim (classique)  
✅ Baldur's Gate 3  
✅ Cyberpunk 2077  
✅ Fallout 4  

Pour tout autre jeu, suivez ce guide ! 🎮
