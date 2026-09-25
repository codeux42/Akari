import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Search, Tv } from "lucide-react";
import {
  readEpisodes,
  readPlanning,
  readReleases,
  readSeasons,
  resolveVideo,
  searchAnime,
  type AnimeEntry,
  type Episode,
  type PlanningDay,
  type Release,
  type Season,
} from "./api.ts";
import { AnimeGrid } from "./AnimeGrid.tsx";
import { EpisodesPanel } from "./EpisodesPanel.tsx";
import { PlanningGrid } from "./PlanningGrid.tsx";
import { ReleaseGrid } from "./ReleaseGrid.tsx";
import { VideoPlayer } from "./VideoPlayer.tsx";

export function AnimeSamaSite({ apiBase }: { apiBase: string }) {
  const base = apiBase.replace(/\/+$/, "");
  const [tab, setTab] = useState<"nouveautes" | "planning" | "recherche">("nouveautes");
  const [releases, setReleases] = useState<Release[]>([]);
  const [days, setDays] = useState<PlanningDay[]>([]);
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
    async function refresh() {
      if (!base) return;
      try {
        const [freshReleases, freshDays] = await Promise.all([
          readReleases(base),
          readPlanning(base),
        ]);
        setReleases(freshReleases);
        setDays(freshDays);
        setError("");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Le service vidéo est injoignable");
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [base]);

  async function openSeason(season: Season) {
    setSeasonUrl(season.url);
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

  async function openPlanned(title: string) {
    setQuery(title);
    setTab("recherche");
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
      setTab("recherche");
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" className="h-9 w-9" />
            <div>
              <p className="font-display text-xl font-extrabold tracking-wide">AKARI</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">Anime en ligne</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setTab("nouveautes")}
              className={`rounded-lg px-3 py-2 text-sm ${tab === "nouveautes" ? "bg-primary text-white" : "text-muted hover:bg-white/5"}`}
            >
              <Tv className="mr-2 inline" size={16} />
              Nouveautés
            </button>
            <button
              onClick={() => setTab("planning")}
              className={`rounded-lg px-3 py-2 text-sm ${tab === "planning" ? "bg-primary text-white" : "text-muted hover:bg-white/5"}`}
            >
              <CalendarDays className="mr-2 inline" size={16} />
              Planning
            </button>
            <button
              onClick={() => setTab("recherche")}
              className={`rounded-lg px-3 py-2 text-sm ${tab === "recherche" ? "bg-primary text-white" : "text-muted hover:bg-white/5"}`}
            >
              <Search className="mr-2 inline" size={16} />
              Recherche
            </button>
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
        {tab === "nouveautes" && (
          <ReleaseGrid items={releases} onSelect={(release) => void openRelease(release)} />
        )}
        {tab === "planning" && (
          <PlanningGrid days={days} onSelect={(title) => void openPlanned(title)} />
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
