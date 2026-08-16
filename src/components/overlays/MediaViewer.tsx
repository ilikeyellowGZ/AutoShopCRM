import { useEffect, useRef } from "react";
import type { VehicleImage } from "../../domain/models";
import { Dialog } from "./Dialog";

export function MediaViewer({ images, activeIndex, onIndexChange, onClose }: { images: VehicleImage[]; activeIndex: number; onIndexChange: (index: number) => void; onClose: () => void }) {
  const activeImage = images[activeIndex];
  const callbacks = useRef({ onClose, onIndexChange, images });
  callbacks.current = { onClose, onIndexChange, images };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const { images: currentImages, onIndexChange: change } = callbacks.current;
      if (event.key === "ArrowLeft") { event.preventDefault(); change((activeIndex - 1 + currentImages.length) % currentImages.length); }
      if (event.key === "ArrowRight") { event.preventDefault(); change((activeIndex + 1) % currentImages.length); }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [activeIndex]);
  if (!activeImage) return null;
  return <Dialog open title="Vehicle media" onClose={onClose}><figure className="media-viewer"><img src={activeImage.src} alt={activeImage.alt} /><figcaption>{activeImage.label} — {activeIndex + 1} of {images.length}</figcaption></figure></Dialog>;
}
