# Akari

Akari - site web anime en francais.

## Lancer en local

```bash
npm install
npm run dev
```

## Publication

Le site est construit par `npm run build:web` et publie sur GitHub Pages par le workflow `.github/workflows/pages.yml`. Le planning et la lecture utilisent le service Render decrit dans `render.yaml`. Apres deploiement du service, configurez `VITE_SAMA_API_BASE` dans les variables GitHub Actions.

## Licence

L application principale est sous licence MIT. Le service Anime-Sama comprend du code sous licence GPL-3.0-or-later ; voir `services/anime-sama-bridge/README.md`.
