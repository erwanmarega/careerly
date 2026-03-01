# Careerly — Extension Chrome

## Installation (mode développeur)

1. Ouvrir Chrome → `chrome://extensions`
2. Activer le **Mode développeur** (toggle en haut à droite)
3. Cliquer **Charger l'extension non empaquetée**
4. Sélectionner le dossier `apps/extension`

## Utilisation

1. Aller sur une offre d'emploi (LinkedIn, Indeed, WTTJ, JobTeaser, HelloWork…)
2. Cliquer sur l'icône Careerly dans la barre d'extensions
3. Se connecter (une seule fois, les tokens sont stockés localement)
4. Les champs entreprise / poste / lieu sont pré-remplis automatiquement
5. Ajuster si besoin → **Ajouter la candidature**

## Sites supportés avec extraction automatique

- LinkedIn Jobs
- Indeed / Indeed.fr
- Welcome to the Jungle
- JobTeaser
- HelloWork
- Monster
- Autres sites : extraction générique via balises `og:title` / `og:site_name`

## Configuration

L'URL de l'API est définie dans `popup.js` ligne 1 :
```js
const API_URL = 'http://localhost:3001'
```
Changer en production vers l'URL déployée.
