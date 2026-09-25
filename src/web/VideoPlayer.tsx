import Hls from "hls.js";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="w-full max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-4 text-white">
          <h2 className="truncate text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
            Fermer
          </button>
        </div>
        <video ref={video} controls autoPlay playsInline className="aspect-video w-full bg-black" />
      </div>
    </div>
  );
}
