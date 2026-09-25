import type { PlanningDay } from "./api.ts";

export function PlanningGrid({
  days,
  onSelect,
}: {
  days: PlanningDay[];
  onSelect: (title: string) => void;
}) {
  return (
    <section>
      <h1 className="mb-6 font-display text-3xl font-bold">Planning de la semaine</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => (
          <section
            key={`${day.day_name}-${day.date}`}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <h2 className="mb-4 font-semibold">
              {day.day_name} <span className="text-muted">{day.date}</span>
            </h2>
            <div className="space-y-3">
              {day.entries.map((entry) => (
                <button
                  key={`${entry.url}-${entry.lang}`}
                  onClick={() => onSelect(entry.title)}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm hover:text-primary"
                >
                  <span>
                    {entry.title}
                    <span className="ml-2 text-xs text-muted">{entry.lang}</span>
                  </span>
                  <span className="shrink-0 text-muted">{entry.time}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
