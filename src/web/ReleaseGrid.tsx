import type { Release } from "./api.ts";

export function ReleaseGrid({
  items,
  loading,
  onSelect,
}: {
  items: Release[];
  loading: boolean;
  onSelect: (item: Release) => void;
}) {
  return (
    <section>
      <h1 className="mb-6 font-display text-3xl font-bold">Dernières sorties</h1>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center text-sm text-muted">
          {loading
            ? "Chargement des dernières sorties…"
            : "Aucune sortie disponible pour le moment."}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <button
              key={`${item.url}-${item.language}`}
              onClick={() => onSelect(item)}
              className="overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:-translate-y-1 hover:border-primary/50"
            >
              <img
                src={item.image}
                alt=""
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-4">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.episode || item.description}</p>
                <span className="mt-3 inline-block rounded bg-primary/15 px-2 py-1 text-xs text-primary">
                  {item.language}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
