import asyncio
import ipaddress
import re
import socket
import uuid
from contextlib import asynccontextmanager
from dataclasses import asdict
from urllib.parse import urljoin, urlsplit

import yt_dlp
from anime_sama_api import AnimeSama, Catalogue, Season, find_site_url
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from starlette.background import BackgroundTask
from httpx import AsyncClient, Timeout
from pydantic import BaseModel

CACHE_SECONDS = 300
MAX_PLAYLIST_BYTES = 2_000_000
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/133.0 Safari/537.36"


class ResolveRequest(BaseModel):
    embed_url: str


class Bridge:
    def __init__(self) -> None:
        self.client = AsyncClient(timeout=Timeout(25), follow_redirects=False)
        self.source_client = AsyncClient(timeout=Timeout(25), follow_redirects=True)
        self.site_url: str | None = None
        self.cache: dict[str, tuple[float, object]] = {}
        self.embeds: dict[str, float] = {}
        self.streams: dict[str, tuple[str, str, str, float]] = {}
        self.resolve_limit = asyncio.Semaphore(4)

    async def start(self) -> None:
        discovered_url = await find_site_url(self.source_client)
        if not discovered_url:
            raise RuntimeError("Anime-Sama n'a pas répondu au contrôle de domaine")
        response = await self.source_client.get(discovered_url)
        response.raise_for_status()
        self.site_url = f"{response.url}".rstrip("/") + "/"

    def api(self) -> AnimeSama:
        if not self.site_url:
            raise HTTPException(503, "Source indisponible")
        return AnimeSama(self.site_url, client=self.source_client)

    async def cached(self, key: str, load):
        held = self.cache.get(key)
        if held and asyncio.get_running_loop().time() - held[0] < CACHE_SECONDS:
            return held[1]
        value = await load()
        self.cache[key] = (asyncio.get_running_loop().time(), value)
        return value

    def catalogue_url(self, url: str) -> str:
        parsed = urlsplit(url)
        site = urlsplit(self.site_url or "")
        if parsed.scheme != "https" or parsed.hostname != site.hostname or not parsed.path.startswith("/catalogue/"):
            raise HTTPException(400, "Fiche invalide")
        return url

    async def public_url(self, url: str) -> None:
        parsed = urlsplit(url)
        if parsed.scheme not in ("https", "http") or not parsed.hostname:
            raise HTTPException(400, "Adresse vidéo invalide")
        try:
            addresses = await asyncio.to_thread(socket.getaddrinfo, parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)
        except OSError as exc:
            raise HTTPException(502, "Hébergeur vidéo introuvable") from exc
        if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
            raise HTTPException(400, "Adresse vidéo refusée")

    async def open_media(self, url: str, headers: dict[str, str]):
        current = url
        for _ in range(6):
            await self.public_url(current)
            response = await self.client.send(self.client.build_request("GET", current, headers=headers), stream=True)
            if response.status_code not in (301, 302, 303, 307, 308):
                return response
            location = response.headers.get("location")
            await response.aclose()
            if not location:
                break
            current = urljoin(current, location)
        raise HTTPException(502, "Trop de redirections vidéo")

    def store_stream(self, url: str, referer: str, user_agent: str) -> str:
        token = uuid.uuid4().hex
        now = asyncio.get_running_loop().time()
        self.streams = {key: value for key, value in self.streams.items() if now - value[3] < 3600}
        self.streams[token] = (url, referer, user_agent, now)
        return token


bridge = Bridge()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await bridge.start()
    yield
    await bridge.client.aclose()
    await bridge.source_client.aclose()


app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])


@app.get("/health")
async def health():
    return {"ok": bridge.site_url is not None}


@app.get("/api/v1/featured")
async def featured():
    async def load():
        episodes = await bridge.api().new_episodes()
        output = []
        seen = set()
        for item in episodes:
            title = item.serie_name.strip()
            if not title or title.casefold() in seen or "Anime" not in item.categories:
                continue
            seen.add(title.casefold())
            output.append({
                "title": title,
                "description": item.descriptive,
                "language": str(item.language),
                "image": urljoin(bridge.site_url or "", item.image_url),
                "url": item.page_url,
            })
            if len(output) == 18:
                break
        return output

    items = await bridge.cached("featured", load)
    return {"items": items}

@app.get("/api/v1/planning")
async def planning():
    days = await bridge.cached("planning", lambda: bridge.api().planning())
    return {"days": [asdict(day) for day in days]}


async def load_releases():
    api = bridge.api()
    items = await api.new_episodes()
    semaphore = asyncio.Semaphore(4)
    now = asyncio.get_running_loop().time()

    async def details(item):
        async with semaphore:
            try:
                catalogues = await api.search(item.serie_name)
                catalogue = next((entry for entry in catalogues if entry.name.lower() == item.serie_name.lower()), None)
                if catalogue is None and catalogues:
                    catalogue = catalogues[0]
                if catalogue is None:
                    return None
                seasons = await catalogue.seasons()
                if not seasons:
                    return None
                release_path = urlsplit(item.page_url).path.lower().rstrip("/")
                matched = [entry for entry in seasons if release_path.startswith(urlsplit(entry.url).path.lower().rstrip("/"))]
                season = max(matched, key=lambda entry: len(entry.url)) if matched else seasons[-1]
                episodes = await season.episodes()
                if not episodes:
                    return None
                latest = episodes[-1]
                sources = {language: [player for group in groups for player in group] for language, groups in latest.languages.availables.items()}
                for players in sources.values():
                    bridge.embeds.update({player: now + 1800 for player in players})
                return {"title": item.serie_name, "description": item.descriptive, "language": item.language, "image": urljoin(bridge.site_url or "", item.image_url), "url": item.page_url, "episode": latest.name, "sources": sources}
            except Exception:
                return None

    loaded = await asyncio.gather(*(details(item) for item in items))
    return [item for item in loaded if item is not None]


@app.get("/api/v1/releases")
async def releases():
    items = await bridge.cached("releases", load_releases)
    return {"items": items}


@app.get("/api/v1/catalogue")
async def catalogue(search: str = Query(min_length=1, max_length=80)):
    entries = await bridge.api().search(search)
    return {"items": [{"title": item.name, "alternatives": item.alternative_names, "genres": item.genres, "languages": sorted(item.languages), "image": urljoin(bridge.site_url or "", item.image_url), "url": item.url} for item in entries[:40] if item.is_anime]}


@app.get("/api/v1/seasons")
async def seasons(url: str = Query(min_length=1, max_length=600)):
    page = Catalogue(bridge.catalogue_url(url), client=bridge.source_client)
    entries = await page.seasons()
    return {"items": [{"title": item.name, "url": item.url} for item in entries]}


@app.get("/api/v1/episodes")
async def episodes(url: str = Query(min_length=1, max_length=700)):
    page_url = bridge.catalogue_url(url)
    season = Season(page_url, client=bridge.source_client)
    entries = await season.episodes()
    output = []
    now = asyncio.get_running_loop().time()
    bridge.embeds = {url: expiry for url, expiry in bridge.embeds.items() if expiry > now}
    for index, entry in enumerate(entries, start=1):
        sources = {}
        for language, player_groups in entry.languages.availables.items():
            sources[language] = [player for group in player_groups for player in group]
            bridge.embeds.update({player: now + 1800 for player in sources[language]})
        output.append({"number": index, "title": entry.name or f"Episode {index}", "languages": sources})
    return {"items": output}


@app.post("/api/v1/resolve")
async def resolve(body: ResolveRequest):
    expiry = bridge.embeds.get(body.embed_url, 0)
    if expiry < asyncio.get_running_loop().time():
        raise HTTPException(403, "Cette source n'a pas été chargée depuis le catalogue")
    async with bridge.resolve_limit:
        def extract():
            with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True, "noplaylist": True, "format": "best"}) as client:
                return client.extract_info(body.embed_url, download=False)
        try:
            info = await asyncio.wait_for(asyncio.to_thread(extract), timeout=45)
        except Exception as exc:
            raise HTTPException(502, "Ce lecteur n'a pas pu ouvrir la vidéo") from exc
    if not isinstance(info, dict):
        raise HTTPException(502, "Flux vidéo introuvable")
    media_url = info.get("url")
    if not isinstance(media_url, str):
        formats = info.get("requested_formats") or info.get("formats") or []
        media_url = next((entry.get("url") for entry in formats if isinstance(entry, dict) and entry.get("url")), None)
    if not isinstance(media_url, str):
        raise HTTPException(502, "Flux vidéo introuvable")
    await bridge.public_url(media_url)
    headers = info.get("http_headers") or {}
    referer = str(headers.get("Referer") or body.embed_url)
    agent = str(headers.get("User-Agent") or USER_AGENT)
    token = bridge.store_stream(media_url, referer, agent)
    return {"url": f"/api/v1/media/{token}", "isHls": bool(re.search(r"\.m3u8(?:\?|$)", media_url, re.I))}


@app.get("/api/v1/media/{token}")
async def media(token: str, request: Request):
    target = bridge.streams.get(token)
    if not target:
        raise HTTPException(404, "Lien vidéo expiré")
    url, referer, agent, created = target
    if asyncio.get_running_loop().time() - created > 3600:
        bridge.streams.pop(token, None)
        raise HTTPException(404, "Lien vidéo expiré")
    headers = {"User-Agent": agent, "Referer": referer, "Origin": f"{urlsplit(referer).scheme}://{urlsplit(referer).netloc}"}
    if request.headers.get("range"):
        headers["Range"] = request.headers["range"]
    response = await bridge.open_media(url, headers)
    media_type = response.headers.get("content-type", "application/octet-stream")
    if "mpegurl" in media_type.lower() or ".m3u8" in str(response.url).lower():
        body = await response.aread()
        await response.aclose()
        if len(body) > MAX_PLAYLIST_BYTES:
            raise HTTPException(502, "Playlist trop volumineuse")
        playlist = body.decode("utf-8", errors="replace")
        rewritten = []
        for line in playlist.splitlines():
            value = line.strip()
            if not value:
                rewritten.append(line)
            elif value.startswith("#"):
                rewritten.append(re.sub(r'URI="([^"]+)"', lambda match: f'URI="/api/v1/media/{bridge.store_stream(urljoin(str(response.url), match.group(1)), referer, agent)}"', line))
            else:
                rewritten.append(f"/api/v1/media/{bridge.store_stream(urljoin(str(response.url), value), referer, agent)}")
        return Response("\n".join(rewritten), media_type="application/vnd.apple.mpegurl", headers={"Cache-Control": "no-store"})
    passthrough = {name: response.headers[name] for name in ("content-range", "accept-ranges", "content-length", "content-encoding") if name in response.headers}
    passthrough["Cache-Control"] = "no-store"
    return StreamingResponse(response.aiter_raw(), status_code=response.status_code, media_type=media_type, headers=passthrough, background=BackgroundTask(response.aclose))
