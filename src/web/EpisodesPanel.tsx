import { Play } from "lucide-react";
import type { AnimeEntry, Episode, Season } from "./api.ts";

export function EpisodesPanel({
  anime,
  seasons,
  selectedSeason,
  episodes,
  onSeason,
  onPlay,
  onClose,
}: {
  anime: AnimeEntry;
  seasons: Season[];
  selectedSeason: string;
  episodes: Episode[];
  onSeason: (season: Season) => void;
  onPlay: (episode: Episode, language: string, source: string) => void;
  onClose: () => void;
}) {
  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{anime.title}</h2>
          <p className="mt-1 text-sm text-muted">{anime.genres.join(" · ")}</p>
        </div>
        <button onClick={onClose} className="text-sm text-muted hover:text-text">
          Fermer
        </button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {seasons.map((season) => (
          <button
            key={season.url}
            onClick={() => onSeason(season)}
            className={`rounded-lg px-3 py-2 text-sm ${selectedSeason === season.url ? "bg-primary text-white" : "bg-white/5 text-muted hover:text-text"}`}
          >
            {season.title}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line">
        {episodes.map((episode) => (
          <div
            key={episode.number}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span className="text-sm">{episode.title}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(episode.languages).flatMap(([language, sources]) =>
                sources.map((source, index) => (
                  <button
                    key={`${language}-${index}`}
                    onClick={() => onPlay(episode, language, source)}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs hover:bg-primary/20 hover:text-primary"
                  >
                    <Play size={13} />
                    {language}
                    {sources.length > 1 ? ` · ${index + 1}` : ""}
                  </button>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
