import { CalendarDays, Clock3, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import type { PlanningDay } from "./api.ts";

const LANGUAGES = ["Tout", "VOSTFR", "VF"] as const;

export function PlanningGrid({
  days,
  loading,
  onSelect,
}: {
  days: PlanningDay[];
  loading: boolean;
  onSelect: (title: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("Tout");
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long" })
    .format(new Date())
    .toLocaleLowerCase("fr-FR");
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
  const visibleDays = days
    .map((day, index) => ({
      ...day,
      id: `planning-${index}-${day.date.replace(/[^\da-z]/gi, "")}`,
      isToday: day.day_name.toLocaleLowerCase("fr-FR") === today,
      entries: day.entries.filter((entry) => {
        const matchesQuery = entry.title.toLocaleLowerCase("fr-FR").includes(normalizedQuery);
        const matchesLanguage =
          language === "Tout" || entry.lang.toLocaleUpperCase("fr-FR").includes(language);
        return matchesQuery && matchesLanguage;
      }),
    }))
    .filter((day) => day.entries.length > 0);
  const entryCount = visibleDays.reduce((count, day) => count + day.entries.length, 0);

  return (
    <section className="space-y-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 -z-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <CalendarDays size={14} /> Planning Anime-Sama
            </span>
            <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
              Tes prochains rendez-vous anime
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              Choisis une sortie pour ouvrir sa fiche et lancer un épisode disponible.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg/70 px-4 py-3">
            <Sparkles size={19} className="text-primary" />
            <div>
              <p className="font-display text-xl font-bold">{entryCount}</p>
              <p className="text-xs text-muted">sorties affichées</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-bg px-4 py-3 focus-within:border-primary">
          <Search size={17} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrer par titre…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {LANGUAGES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={language === option}
              onClick={() => setLanguage(option)}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${language === option ? "border-primary bg-primary/15 text-primary" : "border-line text-muted hover:border-primary/50 hover:text-text"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {visibleDays.length > 0 ? (
        <>
          <nav aria-label="Accès rapide aux jours" className="flex gap-2 overflow-x-auto pb-1">
            {visibleDays.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() =>
                  document.getElementById(day.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className={`shrink-0 rounded-xl border px-4 py-2 text-left transition ${day.isToday ? "border-primary/50 bg-primary/10 text-primary" : "border-line bg-surface text-muted hover:text-text"}`}
              >
                <span className="block text-xs font-semibold capitalize">{day.day_name}</span>
                <span className="mt-0.5 block text-xs opacity-75">{day.date}</span>
              </button>
            ))}
          </nav>

          <div className="grid gap-4 lg:grid-cols-2">
            {visibleDays.map((day) => (
              <section
                id={day.id}
                key={day.id}
                className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-surface ${day.isToday ? "border-primary/50 shadow-glow" : "border-line"}`}
              >
                <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${day.isToday ? "bg-primary text-white" : "bg-white/5 text-muted"}`}
                    >
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-bold capitalize">{day.day_name}</h2>
                      <p className="text-xs text-muted">{day.date}</p>
                    </div>
                  </div>
                  {day.isToday && (
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      Aujourd’hui
                    </span>
                  )}
                </header>
                <div className="space-y-2 p-3 sm:p-4">
                  {day.entries.map((entry) => (
                    <button
                      key={`${entry.url}-${entry.lang}`}
                      type="button"
                      onClick={() => onSelect(entry.title)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-bg/65 p-3 text-left transition hover:border-primary/30 hover:bg-primary/[0.06] sm:gap-4 sm:p-4"
                    >
                      <span className="flex min-w-[4.75rem] flex-col items-center justify-center rounded-lg bg-white/5 px-2 py-2 text-center text-xs font-semibold text-primary">
                        <Clock3 size={15} className="mb-1" />
                        {entry.time || "À préciser"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 font-semibold leading-5 group-hover:text-primary">
                          {entry.title}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {entry.kind && (
                            <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-muted">
                              {entry.kind}
                            </span>
                          )}
                          {entry.lang && (
                            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                              {entry.lang}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition group-hover:bg-primary group-hover:text-white">
                        Ouvrir
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <Search size={24} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold">
            {loading ? "Chargement du planning…" : "Aucune sortie trouvée"}
          </p>
          {!loading && (
            <p className="mt-1 text-sm text-muted">
              Modifie le titre recherché ou choisis une autre langue.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
