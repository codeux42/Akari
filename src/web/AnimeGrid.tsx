import type { AnimeEntry } from "./api.ts";

export function AnimeGrid({
  items,
  onSelect,
}: {
  items: AnimeEntry[];
  onSelect: (item: AnimeEntry) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.url}
          onClick={() => onSelect(item)}
          className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left hover:border-primary/50"
        >
          <img src={item.image} alt="" loading="lazy" className="h-20 w-14 rounded object-cover" />
          <span>
            <strong>{item.title}</strong>
            <span className="mt-1 block text-xs text-muted">{item.languages.join(" · ")}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
