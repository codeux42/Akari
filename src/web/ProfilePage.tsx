import { useEffect, useState } from "react";
import { Check, CircleUserRound, ShieldCheck } from "lucide-react";

type Profile = { name: string; language: string };
const STORAGE_KEY = "akari:profile:v1";
const DEFAULT_PROFILE: Profile = { name: "Anime fan", language: "VOSTFR" };

function loadProfile(): Profile {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return DEFAULT_PROFILE;
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PROFILE;
    const data = parsed as Record<string, unknown>;
    return {
      name: typeof data.name === "string" ? data.name : DEFAULT_PROFILE.name,
      language: data.language === "VF" ? "VF" : "VOSTFR",
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfilePage() {
  const [profile, setProfile] = useState(loadProfile);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [profile]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Espace personnel
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Mon profil</h1>
        <p className="mt-2 text-sm text-muted">
          Personnalise ton experience Akari sur cet appareil.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-6">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <CircleUserRound size={34} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{profile.name || "Anime fan"}</p>
          <p className="mt-1 text-sm text-muted">Profil local Akari</p>
        </div>
        {saved && (
          <Check className="ml-auto text-primary" aria-label="Modifications enregistrees" />
        )}
      </div>

      <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Nom du profil</span>
          <input
            value={profile.name}
            maxLength={32}
            onChange={(event) =>
              setProfile((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Choisis un nom"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none focus:border-primary"
          />
        </label>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Langue preferee</legend>
          <div className="grid grid-cols-2 gap-3">
            {["VOSTFR", "VF"].map((language) => (
              <button
                key={language}
                type="button"
                aria-pressed={profile.language === language}
                onClick={() => setProfile((current) => ({ ...current, language }))}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${profile.language === language ? "border-primary bg-primary/10 text-primary" : "border-line text-muted hover:border-primary/50"}`}
              >
                {language}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex gap-3 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        <ShieldCheck className="shrink-0 text-primary" size={20} />
        <p>
          Ces preferences sont enregistrees uniquement dans le navigateur de cet appareil. Aucun
          compte ni mot de passe n est demande.
        </p>
      </div>
    </section>
  );
}
