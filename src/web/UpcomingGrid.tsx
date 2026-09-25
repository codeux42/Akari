import { ArrowRight } from "lucide-react";
import type { PlanningDay } from "./api.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

function planningDate(value: string, today: Date): Date | null {
  const match =
    /^(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?)$/.exec(
      value.trim(),
    );
  if (!match) return null;

  const year = Number(match[1] ?? match[6] ?? today.getFullYear());
  const month = Number(match[2] ?? match[5]);
  const day = Number(match[3] ?? match[4]);
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  if (!match[1] && !match[6]) {
    const distance = date.getTime() - today.getTime();
    if (distance < -182 * DAY_MS) date.setFullYear(date.getFullYear() + 1);
    if (distance > 182 * DAY_MS) date.setFullYear(date.getFullYear() - 1);
  }
  return date;
}

export function UpcomingGrid({
  days,
  loaded,
  onSelect,
}: {
  days: PlanningDay[];
  loaded: boolean;
  onSelect: (title: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = days.flatMap((day) => {
    const date = planningDate(day.date, today);
    if (!date || date < today) return [];
    const entries = day.entries.filter((entry) => entry.kind.toLowerCase().includes("anime"));
    return entries.length > 0 ? [{ ...day, entries }] : [];
  });

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            À venir
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">Prochaines sorties</h2>
        </div>
        <p className="text-xs text-muted">Planning Anime-Sama</p>
      </div>
      {upcoming.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((day) => (
            <div
              key={`${day.day_name}-${day.date}`}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <h3 className="mb-3 text-sm font-semibold">
                {day.day_name} <span className="text-muted">{day.date}</span>
              </h3>
              <div className="space-y-2">
                {day.entries.map((entry) => (
                  <button
                    key={`${entry.url}-${entry.lang}`}
                    onClick={() => onSelect(entry.title)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-white/5 hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{entry.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {[entry.time, entry.lang].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <ArrowRight size={15} className="shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
          {loaded
            ? "Aucune sortie future n’est indiquée dans le planning Anime-Sama."
            : "Chargement du planning…"}
        </div>
      )}
    </section>
  );
}
