import { useState, type KeyboardEvent, type TouchEvent } from "react";
import type { Vehicle } from "../../domain/models";
import { MediaViewer } from "../../components/overlays/MediaViewer";

export function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const images = vehicle.gallery.images;
  const active = images[activeIndex];
  if (!active) return <section className="vehicle-gallery" aria-label="Vehicle gallery"><div className="vehicle-gallery-placeholder" role="img" aria-label="Vehicle gallery unavailable">Vehicle media is unavailable.</div></section>;
  const move = (offset: number) => { setImageUnavailable(false); setActiveIndex((index) => (index + offset + images.length) % images.length); };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } };
  let touchStart = 0;
  const onTouchStart = (event: TouchEvent<HTMLElement>) => { touchStart = event.changedTouches[0]?.clientX ?? 0; };
  const onTouchEnd = (event: TouchEvent<HTMLElement>) => { const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart; if (Math.abs(delta) > 32) move(delta > 0 ? -1 : 1); };

  return <section className="vehicle-gallery" aria-label="Vehicle gallery" tabIndex={0} onKeyDown={onKeyDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="vehicle-gallery-stage">
      <button type="button" className="vehicle-gallery-image-button" onClick={() => setViewerOpen(true)} aria-label={`Open full screen image: ${active.alt}`}>
        {imageUnavailable ? <span className="vehicle-gallery-placeholder" role="img" aria-label={`${active.alt} unavailable`}>Vehicle image pending</span> : <img src={active.src} alt={active.alt} onError={() => setImageUnavailable(true)} />}
      </button>
      <button type="button" className="vehicle-gallery-arrow vehicle-gallery-arrow--previous" onClick={() => move(-1)} aria-label="Previous image">Previous</button>
      <button type="button" className="vehicle-gallery-arrow vehicle-gallery-arrow--next" onClick={() => move(1)} aria-label="Next image">Next</button>
      <p className="vehicle-gallery-counter" aria-live="polite">Image {activeIndex + 1} of {images.length}</p>
    </div>
    <div className="vehicle-gallery-thumbnails" aria-label="Gallery thumbnails">{images.map((image, index) => <button type="button" key={image.id} className="vehicle-gallery-thumbnail" aria-current={activeIndex === index ? "true" : undefined} aria-label={`Show ${image.label}`} onClick={() => { setImageUnavailable(false); setActiveIndex(index); }}><img src={image.src} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span>{index + 1}</span></button>)}</div>
    {viewerOpen ? <MediaViewer images={images} activeIndex={activeIndex} onIndexChange={(index) => { setImageUnavailable(false); setActiveIndex(index); }} onClose={() => setViewerOpen(false)} /> : null}
  </section>;
}
