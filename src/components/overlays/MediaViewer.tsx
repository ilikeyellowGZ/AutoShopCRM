import { useEffect, useState } from "react";
import type { VehicleImage } from "../../domain/models";
import { Dialog } from "./Dialog";

export function MediaViewer({ images, activeIndex, onIndexChange, onClose }: { images: VehicleImage[]; activeIndex: number; onIndexChange: (index: number) => void; onClose: () => void }) {
  const activeImage = images[activeIndex];
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => setUnavailable(false), [activeIndex, activeImage?.src]);
  if (!activeImage) return null;
  return <Dialog open title="Vehicle media" onClose={onClose} onOverlayKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); onIndexChange((activeIndex - 1 + images.length) % images.length); } if (event.key === "ArrowRight") { event.preventDefault(); onIndexChange((activeIndex + 1) % images.length); } }}><figure className="media-viewer">{unavailable ? <div className="media-viewer-placeholder" role="img" aria-label={`${activeImage.alt} unavailable`}>This vehicle media is unavailable.</div> : <img src={activeImage.src} alt={activeImage.alt} onError={() => setUnavailable(true)} />}<figcaption>{activeImage.label} — {activeIndex + 1} of {images.length}</figcaption></figure></Dialog>;
}
