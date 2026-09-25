import Hls from "hls.js";
import { CirclePlay, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function VideoPlayer({
  url,
  isHls,
  title,
  onClose,
}: {
  url: string;
  isHls: boolean;
  title: string;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!isHls || !Hls.isSupported()) {
      element.src = url;
      return;
    }
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(element);
    return () => hls.destroy();
  }, [url, isHls]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur vidéo : ${title}`}
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-bg shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <CirclePlay size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Lecture en cours
              </p>
              <h2 className="truncate text-sm font-semibold sm:text-base">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer le lecteur"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white/5 text-muted transition hover:border-primary/40 hover:bg-primary/10 hover:text-text"
          >
            <X size={18} />
          </button>
        </header>
        <video
          ref={video}
          controls
          autoPlay
          playsInline
          aria-label={title}
          className="aspect-video w-full bg-black"
        />
        <footer className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted sm:px-6">
          <span>Utilise Échap ou le bouton fermer pour revenir aux épisodes.</span>
          <span className="shrink-0 rounded-full bg-white/5 px-3 py-1.5">Akari Player</span>
        </footer>
      </div>
    </div>
  );
}
