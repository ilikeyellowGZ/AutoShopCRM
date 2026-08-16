import type { VehicleImage } from "../../domain/models";
import { Dialog } from "./Dialog";

export function MediaViewer({ images, activeIndex, onIndexChange, onClose }: { images: VehicleImage[]; activeIndex: number; onIndexChange: (index: number) => void; onClose: () => void }) {
  const activeImage = images[activeIndex];
  if (!activeImage) return null;
  return <Dialog open title="Vehicle media" onClose={onClose} onOverlayKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); onIndexChange((activeIndex - 1 + images.length) % images.length); } if (event.key === "ArrowRight") { event.preventDefault(); onIndexChange((activeIndex + 1) % images.length); } }}><figure className="media-viewer"><img src={activeImage.src} alt={activeImage.alt} /><figcaption>{activeImage.label} — {activeIndex + 1} of {images.length}</figcaption></figure></Dialog>;
}
