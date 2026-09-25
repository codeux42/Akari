# Akari web bridge

A separate FastAPI service for the browser build. It reads the catalogue, weekly planning and
new releases through the `anime-sama-cli` Python package, exposes episode player sources, and
proxies resolved media so HLS and MP4 can be loaded from the browser. The web page refreshes
its schedule and new-release list every five minutes.

Deploy with Render from the repository root using `render.yaml`. The service is independent
of the desktop application and uses the GPL-3.0-or-later Anime-Sama client package.

The bridge uses GPL-3.0-or-later code from anime-sama-cli; its source and license are available at https://github.com/CheikhNaro/anime-sama-cli.
