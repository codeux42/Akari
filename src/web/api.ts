export type Release = {
  title: string;
  description: string;
  language: string;
  image: string;
  url: string;
  episode: string;
  sources: Record<string, string[]>;
};
export type PlanningEntry = {
  title: string;
  kind: string;
  time: string;
  lang: string;
  url: string;
};
export type PlanningDay = { day_name: string; date: string; entries: PlanningEntry[] };
export type AnimeEntry = {
  title: string;
  alternatives: string[];
  genres: string[];
  languages: string[];
  image: string;
  url: string;
};
export type Season = { title: string; url: string };
export type Episode = { number: number; title: string; languages: Record<string, string[]> };

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Réponse invalide");
  return value as Record<string, unknown>;
}

function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function get(base: string, path: string): Promise<unknown> {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) throw new Error(`Le service vidéo répond ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function readReleases(base: string): Promise<Release[]> {
  const root = record(await get(base, "/api/v1/releases"));
  return list(root.items).map((item) => {
    const row = record(item);
    const sources: Record<string, string[]> = {};
    for (const [language, values] of Object.entries(record(row.sources)))
      sources[language] = list(values).map(string).filter(Boolean);
    return {
      title: string(row.title),
      description: string(row.description),
      language: string(row.language),
      image: string(row.image),
      url: string(row.url),
      episode: string(row.episode),
      sources,
    };
  });
}

export async function readPlanning(base: string): Promise<PlanningDay[]> {
  const root = record(await get(base, "/api/v1/planning"));
  return list(root.days).map((item) => {
    const day = record(item);
    const entries = list(day.entries).map((entry) => {
      const row = record(entry);
      return {
        title: string(row.title),
        kind: string(row.kind),
        time: string(row.time),
        lang: string(row.lang),
        url: string(row.url),
      };
    });
    return { day_name: string(day.day_name), date: string(day.date), entries };
  });
}

export async function searchAnime(base: string, query: string): Promise<AnimeEntry[]> {
  const root = record(await get(base, `/api/v1/catalogue?search=${encodeURIComponent(query)}`));
  return list(root.items).map((item) => {
    const row = record(item);
    return {
      title: string(row.title),
      alternatives: list(row.alternatives).map(string),
      genres: list(row.genres).map(string),
      languages: list(row.languages).map(string),
      image: string(row.image),
      url: string(row.url),
    };
  });
}

export async function readSeasons(base: string, url: string): Promise<Season[]> {
  const root = record(await get(base, `/api/v1/seasons?url=${encodeURIComponent(url)}`));
  return list(root.items).map((item) => {
    const row = record(item);
    return { title: string(row.title), url: string(row.url) };
  });
}

export async function readEpisodes(base: string, url: string): Promise<Episode[]> {
  const root = record(await get(base, `/api/v1/episodes?url=${encodeURIComponent(url)}`));
  return list(root.items).map((item) => {
    const row = record(item);
    const languages: Record<string, string[]> = {};
    for (const [name, sources] of Object.entries(record(row.languages))) {
      languages[name] = list(sources).map(string).filter(Boolean);
    }
    return { number: Number(row.number), title: string(row.title), languages };
  });
}

export async function resolveVideo(
  base: string,
  embed: string,
): Promise<{ url: string; isHls: boolean }> {
  const response = await fetch(`${base}/api/v1/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embed_url: embed }),
  });
  const root = record(await response.json());
  if (!response.ok) throw new Error(string(root.detail) || "Impossible d’ouvrir cette vidéo");
  return { url: `${base}${string(root.url)}`, isHls: root.isHls === true };
}
