````markdown
# The Courrier — Installation & Mise en route

Projet React configuré avec **Tailwind CSS** pour la mise en page et un point d’entrée fonctionnel.

---

## 1. Prérequis

- **Node.js ≥ 16**
- **npm ≥ 8**

Vérifie :
```bash
node -v
npm -v
````

---

## 2. Structure du projet

```
The_Courrier/
├─ public/
│  └─ index.html
├─ src/
│  ├─ App.jsx
│  ├─ index.js
│  ├─ index.css
│  └─ ...
├─ package.json
├─ package-lock.json
├─ tailwind.config.js
└─ postcss.config.js
```

---

## 3. Installation

Depuis la racine du projet :

```bash
npm install
```

Si tu démarres de zéro :

```bash
npx create-react-app the_courrier
cd the_courrier
```

---

## 3.1 Problème connu — `react-scripts` à `^0.0.0`

Il peut arriver qu’après un `npm install`, la ligne correspondante dans `package-lock.json` soit :

```json
"react-scripts": "^0.0.0"
```

Cela empêche l’installation complète et bloque la commande `npm start`.

**Solution :**

1. Ouvre `package-lock.json` dans un éditeur.
2. Remplace manuellement la ligne par :

   ```json
   "react-scripts": "^5.0.1"
   ```
3. Sauvegarde le fichier.
4. Réinstalle :

   ```bash
   npm install
   ```

Après correction, `npm start` fonctionnera correctement.

---

## 4. Installation et configuration de Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**`tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: { extend: {} },
  plugins: [],
};
```

**`postcss.config.js`** (généré automatiquement)

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,body,#root{height:100%}
body{margin:0}
```

---

## 5. Fichiers principaux

**`public/index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>The Courrier</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**`src/index.js`**

```js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

**`src/App.jsx`**

```jsx
export default function App() {
  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-3xl font-bold">The Courrier</h1>
      <p className="mt-2 text-neutral-400">Application React + Tailwind opérationnelle.</p>
    </div>
  );
}
```

---

## ▶6. Démarrage du serveur

```bash
npm start
```

L’application se lance sur :

```
http://localhost:3000/
```

---

## 7. Dépannage courant

| Problème                    | Cause probable                                             | Solution                                                             |
| --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `react-scripts` non reconnu | Mauvaise version ou ligne erronée dans `package-lock.json` | Corriger manuellement `"react-scripts": "^5.0.1"` puis `npm install` |
| Écran vide                  | `App.jsx` vide ou erreur JavaScript                        | Vérifier la console du navigateur                                    |
| Tailwind inactif            | Mauvais `content` dans `tailwind.config.js`                | Corriger et relancer `npm start`                                     |
| Port déjà occupé            | Conflit sur `3000`                                         | `npm start -- --port=3001`                                           |

---

## 8. Résultat attendu

* Page noire (`bg-neutral-950`)
* Texte blanc **“The Courrier”**
* Aucun message d’erreur dans la console

---

## 9. Étapes suivantes

* Recréer la page d’accueil façon **Instant Gaming** avec Tailwind.
* Ajouter la grille de jeux, boutons et sections.
* Mettre en place la navigation (React Router) si nécessaire.

---

**Projet en cours de développement — dernière mise à jour :** *2025-10-29*
