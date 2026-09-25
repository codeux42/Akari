import { ArrowRight, CalendarDays, Compass, Sparkles, Tv } from "lucide-react";
import type { FeaturedAnime, PlanningDay } from "./api.ts";
import { UpcomingGrid } from "./UpcomingGrid.tsx";

type Destination = "nouveautes" | "planning" | "recherche";

export function HomePage({
  featured,
  featuredLoaded,
  upcomingDays,
  planningLoaded,
  onSelect,
  onNavigate,
}: {
  featured: FeaturedAnime[];
  featuredLoaded: boolean;
  upcomingDays: PlanningDay[];
  planningLoaded: boolean;
  onSelect: (title: string) => void;
  onNavigate: (tab: Destination) => void;
}) {
  return (
    <section className="space-y-8">
      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface px-7 py-12 sm:px-12 sm:py-16">
        <div className="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles size={14} /> Akari
          </span>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-6xl">
            Bienvenue dans ton univers anime.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Retrouve tes séries, explore le catalogue et suis les prochaines sorties.
          </p>
          <button
            onClick={() => onNavigate("recherche")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Explorer les animes <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              À découvrir
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">Animés récemment ajoutés</h2>
          </div>
          <button
            onClick={() => onNavigate("nouveautes")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Toutes les sorties
          </button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((anime) => (
              <button
                key={`${anime.title}-${anime.url}`}
                onClick={() => onSelect(anime.title)}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:-translate-y-1 hover:border-primary/50"
              >
                {anime.image ? (
                  <img
                    src={anime.image}
                    alt={anime.title}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="grid aspect-[3/4] place-items-center bg-gradient-to-br from-primary/30 to-surface p-3 text-center font-display font-bold">
                    {anime.title}
                  </div>
                )}
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold">{anime.title}</p>
                  <p className="mt-1 text-xs text-muted">{anime.description || anime.language}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            {featuredLoaded
              ? "Les animés récemment ajoutés sont momentanément indisponibles. Tu peux toujours parcourir le catalogue."
              : "Chargement des animés…"}
          </div>
        )}
      </div>

      <UpcomingGrid days={upcomingDays} loaded={planningLoaded} onSelect={onSelect} />

      <div>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Explorer</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Que veux-tu regarder ?</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => onNavigate("nouveautes")}
            className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-primary/50"
          >
            <Tv className="mb-5 text-primary" size={24} />
            <h3 className="font-display text-lg font-bold">Dernières nouveautés</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Retrouve les épisodes récemment ajoutés.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Voir les sorties <ArrowRight size={15} />
            </span>
          </button>
          <button
            onClick={() => onNavigate("planning")}
            className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-primary/50"
          >
            <CalendarDays className="mb-5 text-primary" size={24} />
            <h3 className="font-display text-lg font-bold">Planning</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Consulte les sorties prevues cette semaine.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Ouvrir le planning <ArrowRight size={15} />
            </span>
          </button>
          <button
            onClick={() => onNavigate("recherche")}
            className="group rounded-2xl border border-line bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-primary/50"
          >
            <Compass className="mb-5 text-primary" size={24} />
            <h3 className="font-display text-lg font-bold">Explorer le catalogue</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Recherche un titre et trouve ses saisons.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Lancer une recherche <ArrowRight size={15} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
