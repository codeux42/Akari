import { Play, Tv, X } from "lucide-react";
import type { AnimeEntry, Episode, Season } from "./api.ts";

export function EpisodesPanel({
  anime,
  seasons,
  selectedSeason,
  episodes,
  loading,
  onSeason,
  onPlay,
  onClose,
}: {
  anime: AnimeEntry;
  seasons: Season[];
  selectedSeason: string;
  episodes: Episode[];
  loading: boolean;
  onSeason: (season: Season) => void;
  onPlay: (episode: Episode, language: string, source: string) => void;
  onClose: () => void;
}) {
  return (
    <section
      id="anime-episodes"
      className="mt-10 scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
    >
      <header className="relative isolate overflow-hidden border-b border-line p-5 sm:p-7">
        {anime.image && (
          <img
            src={anime.image}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20 blur-2xl"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-surface via-surface/95 to-surface/80" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            {anime.image ? (
              <img
                src={anime.image}
                alt={`Affiche de ${anime.title}`}
                className="hidden h-32 w-20 shrink-0 rounded-xl border border-white/10 object-cover shadow-card sm:block"
              />
            ) : (
              <span className="hidden h-32 w-20 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:grid">
                <Tv size={28} />
              </span>
            )}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Tv size={14} /> Fiche anime
              </span>
              <h2 className="mt-3 font-display text-2xl font-black sm:text-3xl">{anime.title}</h2>
              <p className="mt-2 text-sm text-muted">
                {anime.genres.length > 0
                  ? anime.genres.join(" · ")
                  : "Choisis une saison et un épisode."}
              </p>
              <p className="mt-3 text-xs text-muted">
                {seasons.length} {seasons.length === 1 ? "saison" : "saisons"} · {episodes.length}{" "}
                {episodes.length === 1 ? "épisode chargé" : "épisodes chargés"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer la fiche anime"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-bg/70 text-muted transition hover:border-primary/40 hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold">Saisons</h3>
            <span className="text-xs text-muted">Choisis une saison pour voir ses épisodes</span>
          </div>
          {seasons.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {seasons.map((season, index) => (
                <button
                  key={season.url}
                  onClick={() => onSeason(season)}
                  type="button"
                  aria-pressed={selectedSeason === season.url}
                  disabled={loading}
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${selectedSeason === season.url ? "border-primary bg-primary text-white shadow-glow" : "border-line bg-bg/70 text-muted hover:border-primary/40 hover:text-text"}`}
                >
                  <span className="mr-2 text-xs opacity-70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {season.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-line bg-bg/60 px-4 py-3 text-sm text-muted">
              {loading ? "Recherche des saisons…" : "Aucune saison trouvée."}
            </p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold">Épisodes</h3>
            {episodes.length > 0 && (
              <span className="text-xs text-muted">{episodes.length} disponibles</span>
            )}
          </div>
          {episodes.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {episodes.map((episode) => {
                const sources = Object.entries(episode.languages).flatMap(([language, links]) =>
                  links.map((source, index) => ({ language, source, index, count: links.length })),
                );

                return (
                  <article
                    key={episode.number}
                    className="flex min-h-36 flex-col rounded-2xl border border-line bg-bg/65 p-4 transition hover:border-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                        {String(episode.number).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Épisode {episode.number}
                        </p>
                        <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
                          {episode.title || `Épisode ${episode.number}`}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      {sources.length > 0 ? (
                        sources.map(({ language, source, index, count }) => (
                          <button
                            key={`${language}-${index}`}
                            onClick={() => onPlay(episode, language, source)}
                            type="button"
                            disabled={loading}
                            aria-label={`Lire ${episode.title} en ${language}${
                              count > 1 ? `, source ${index + 1}` : ""
                            }`}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                          >
                            <Play size={13} fill="currentColor" />
                            {language}
                            {count > 1 && <span className="opacity-80">· {index + 1}</span>}
                          </button>
                        ))
                      ) : (
                        <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-muted">
                          Source pas encore disponible
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-bg/40 px-5 py-10 text-center">
              <Play size={22} className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-semibold">
                {loading
                  ? "Chargement des épisodes…"
                  : "Aucun épisode disponible pour cette saison."}
              </p>
              {!loading && (
                <p className="mt-1 text-xs text-muted">Essaie une autre saison du catalogue.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
