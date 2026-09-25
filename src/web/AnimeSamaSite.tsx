import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, House, Search, Tv, UserRound } from "lucide-react";
import {
  readEpisodes,
  readFeatured,
  readPlanning,
  readReleases,
  readSeasons,
  resolveVideo,
  searchAnime,
  type AnimeEntry,
  type Episode,
  type FeaturedAnime,
  type PlanningDay,
  type Release,
  type Season,
} from "./api.ts";
import { AnimeGrid } from "./AnimeGrid.tsx";
import { EpisodesPanel } from "./EpisodesPanel.tsx";
import { PlanningGrid } from "./PlanningGrid.tsx";
import { ReleaseGrid } from "./ReleaseGrid.tsx";
import { VideoPlayer } from "./VideoPlayer.tsx";
import { HomePage } from "./HomePage.tsx";
import { ProfilePage } from "./ProfilePage.tsx";

const NAV_ITEMS = [
  { tab: "accueil", path: "", label: "Accueil", icon: House },
  { tab: "nouveautes", path: "nouveautes", label: "Nouveautés", icon: Tv },
  { tab: "planning", path: "planning", label: "Planning", icon: CalendarDays },
  { tab: "recherche", path: "recherche", label: "Recherche", icon: Search },
  { tab: "profil", path: "profil", label: "Profil", icon: UserRound },
] as const;

type SiteTab = (typeof NAV_ITEMS)[number]["tab"];

function routeBasePath(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).pathname.replace(/\/?$/, "/");
}

function routeHref(destination: SiteTab): string {
  const item = NAV_ITEMS.find((candidate) => candidate.tab === destination);
  return `${routeBasePath()}${item?.path ?? ""}`;
}

function tabFromPathname(pathname: string): SiteTab {
  const base = routeBasePath();
  const path = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname).replace(
    /^\/+|\/+$/g,
    "",
  );
  return NAV_ITEMS.find((item) => item.path === path)?.tab ?? "accueil";
}

function tabFromHash(hash: string): SiteTab {
  const path = (hash.slice(2).split("?")[0] ?? "").replace(/^\/+|\/+$/g, "");
  return NAV_ITEMS.find((item) => item.path === path)?.tab ?? "accueil";
}

function initialTab(): SiteTab {
  const recoveredRoute = new URLSearchParams(window.location.search).get("__route");
  if (recoveredRoute) {
    const path = (recoveredRoute.split(/[?#]/, 1)[0] ?? "").replace(/^\/+|\/+$/g, "");
    const item = NAV_ITEMS.find((candidate) => candidate.path === path);
    if (item) {
      const suffix = recoveredRoute.slice(path.length);
      window.history.replaceState(null, "", `${routeHref(item.tab)}${suffix}`);
      return item.tab;
    }
  }
  if (window.location.hash.startsWith("#/")) {
    const destination = tabFromHash(window.location.hash);
    window.history.replaceState(null, "", routeHref(destination));
    return destination;
  }
  return tabFromPathname(window.location.pathname);
}

export function AnimeSamaSite({ apiBase }: { apiBase: string }) {
  const base = apiBase.replace(/\/+$/, "");
  const [tab, setTab] = useState<SiteTab>(initialTab);
  const [releases, setReleases] = useState<Release[]>([]);
  const [releasesLoaded, setReleasesLoaded] = useState(false);
  const [featured, setFeatured] = useState<FeaturedAnime[]>([]);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const [days, setDays] = useState<PlanningDay[]>([]);
  const [planningLoaded, setPlanningLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeEntry[]>([]);
  const [selected, setSelected] = useState<AnimeEntry | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasonUrl, setSeasonUrl] = useState("");
  const [playing, setPlaying] = useState<{ url: string; isHls: boolean; title: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const updateRoute = () => {
      setTab(tabFromPathname(window.location.pathname));
      setSelected(null);
      setSeasons([]);
      setEpisodes([]);
      setSeasonUrl("");
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  function navigate(destination: SiteTab) {
    const href = routeHref(destination);
    if (destination !== tab) {
      setSelected(null);
      setSeasons([]);
      setEpisodes([]);
      setSeasonUrl("");
    }
    if (window.location.pathname !== href) window.history.pushState(null, "", href);
    setTab(destination);
  }

  useEffect(() => {
    if (!base || (tab !== "accueil" && tab !== "nouveautes" && tab !== "planning")) return;
    async function refresh() {
      if (tab === "accueil") {
        const [animeAnswer, planningAnswer] = await Promise.allSettled([
          readFeatured(base),
          readPlanning(base),
        ]);
        if (animeAnswer.status === "fulfilled") setFeatured(animeAnswer.value);
        setFeaturedLoaded(true);
        if (planningAnswer.status === "fulfilled") {
          setDays(planningAnswer.value);
        }
        setPlanningLoaded(true);
        const failure = [animeAnswer, planningAnswer].find(
          (answer) => answer.status === "rejected",
        );
        setError(
          failure?.status === "rejected"
            ? failure.reason instanceof Error
              ? failure.reason.message
              : "Le service vidéo est injoignable"
            : "",
        );
        return;
      }
      try {
        if (tab === "nouveautes") {
          setReleases(await readReleases(base));
          setReleasesLoaded(true);
        } else {
          setDays(await readPlanning(base));
          setPlanningLoaded(true);
        }
        setError("");
      } catch (reason) {
        if (tab === "nouveautes") setReleasesLoaded(true);
        if (tab === "planning") setPlanningLoaded(true);
        setError(reason instanceof Error ? reason.message : "Le service vidéo est injoignable");
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [base, tab]);

  async function openSeason(season: Season) {
    setSeasonUrl(season.url);
    setEpisodes([]);
    setBusy(true);
    try {
      setEpisodes(await readEpisodes(base, season.url));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Les épisodes n’ont pas pu être chargés");
    } finally {
      setBusy(false);
    }
  }

  async function openAnime(anime: AnimeEntry) {
    setSelected(anime);
    setSeasons([]);
    setEpisodes([]);
    setSeasonUrl("");
    setBusy(true);
    try {
      const found = await readSeasons(base, anime.url);
      setSeasons(found);
      const first = found[0];
      if (first) await openSeason(first);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Les saisons n’ont pas pu être chargées");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (selected) {
      document.getElementById("anime-episodes")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selected]);

  async function openPlanned(title: string) {
    setQuery(title);
    setSelected(null);
    setSeasons([]);
    setEpisodes([]);
    navigate("recherche");
    setBusy(true);
    setError("");
    try {
      const found = await searchAnime(base, title);
      setResults(found);
      const match = found[0];
      if (match) await openAnime(match);
      else setError("Cette fiche n’a pas été trouvée dans le catalogue");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La fiche n’a pas pu être ouverte");
    } finally {
      setBusy(false);
    }
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setSelected(null);
    setError("");
    try {
      setResults(await searchAnime(base, query.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La recherche a échoué");
    } finally {
      setBusy(false);
    }
  }

  async function openRelease(release: Release) {
    setBusy(true);
    setError("");
    try {
      const embed =
        release.sources[release.language]?.[0] ?? Object.values(release.sources).flat()[0];
      if (embed) {
        const source = await resolveVideo(base, embed);
        setPlaying({ ...source, title: `${release.title} — ${release.episode}` });
        return;
      }
      navigate("recherche");
      setQuery(release.title);
      const found = await searchAnime(base, release.title);
      setResults(found);
      const match = found[0];
      if (match) await openAnime(match);
      else setError("Cette fiche n’a pas été trouvée dans le catalogue");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La vidéo n’a pas pu être ouverte");
    } finally {
      setBusy(false);
    }
  }

  async function play(episode: Episode, language: string, embed: string) {
    setBusy(true);
    setError("");
    try {
      const source = await resolveVideo(base, embed);
      setPlaying({
        ...source,
        title: `${selected?.title ?? "Anime"} — ${episode.title} · ${language}`,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La vidéo n’a pas pu être lancée");
    } finally {
      setBusy(false);
    }
  }

  if (!base)
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-text">
        <p>Le service web vidéo n’est pas encore configuré.</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={routeHref("accueil")}
            onClick={(event) => {
              event.preventDefault();
              navigate("accueil");
            }}
            className="flex shrink-0 items-center gap-3"
            aria-label="Akari, accueil"
          >
            <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" className="h-9 w-9" />
            <span>
              <span className="block font-display text-xl font-extrabold tracking-wide">AKARI</span>
              <span className="block text-[10px] uppercase tracking-widest text-muted">
                Anime en ligne
              </span>
            </span>
          </a>
          <nav aria-label="Navigation principale" className="flex gap-2 overflow-x-auto pb-1">
            {NAV_ITEMS.map(({ tab: destination, label, icon: Icon }) => (
              <a
                key={destination}
                href={routeHref(destination)}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(destination);
                }}
                aria-current={tab === destination ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${tab === destination ? "bg-primary text-white shadow-glow" : "text-muted hover:bg-white/5 hover:text-text"}`}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
            {error}
            <button onClick={() => setError("")} aria-label="Fermer">
              ×
            </button>
          </div>
        )}
        {busy && <p className="mb-4 text-sm text-muted">Chargement…</p>}
        {tab === "accueil" && (
          <HomePage
            featured={featured}
            featuredLoaded={featuredLoaded}
            upcomingDays={days}
            planningLoaded={planningLoaded}
            onSelect={(title) => void openPlanned(title)}
            onNavigate={navigate}
          />
        )}
        {tab === "profil" && <ProfilePage />}
        {tab === "nouveautes" && (
          <ReleaseGrid
            items={releases}
            loading={!releasesLoaded}
            onSelect={(release) => void openRelease(release)}
          />
        )}
        {tab === "planning" && (
          <PlanningGrid
            days={days}
            loading={!planningLoaded}
            onSelect={(title) => void openPlanned(title)}
          />
        )}
        {tab === "recherche" && (
          <section>
            <h1 className="mb-6 font-display text-3xl font-bold">Catalogue</h1>
            <form
              onSubmit={(event) => void submitSearch(event)}
              className="mb-6 flex max-w-2xl gap-2"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un anime…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-primary"
              />
              <button className="rounded-xl bg-primary px-5 font-semibold text-white">
                <Search size={18} />
              </button>
            </form>
            <AnimeGrid items={results} onSelect={(anime) => void openAnime(anime)} />
          </section>
        )}
        {selected && (
          <EpisodesPanel
            anime={selected}
            seasons={seasons}
            selectedSeason={seasonUrl}
            episodes={episodes}
            loading={busy}
            onSeason={(season) => void openSeason(season)}
            onPlay={(episode, language, source) => void play(episode, language, source)}
            onClose={() => {
              setSelected(null);
              setEpisodes([]);
            }}
          />
        )}
      </div>
      {playing && <VideoPlayer {...playing} onClose={() => setPlaying(null)} />}
    </main>
  );
}
