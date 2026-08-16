import type { GalleryAngle, VehicleGallery, VehicleImage } from "../domain/models";
import manifestData from "./vehicleGalleryManifest.json";

const galleryAngles: readonly GalleryAngle[] = ["front", "front-left", "left", "rear-left", "rear", "rear-right", "right", "front-right"];

type VehicleGalleryManifestEntry = {
  id: string;
  slug: string;
  displayName: string;
  coverImageId: string;
  images: VehicleImage[];
};

type VehicleGalleryManifest = { vehicles: VehicleGalleryManifestEntry[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isGalleryAngle = (value: unknown): value is GalleryAngle => typeof value === "string" && galleryAngles.some((angle) => angle === value);

function parseVehicleGalleryManifest(value: unknown): VehicleGalleryManifest {
  if (!isRecord(value) || !Array.isArray(value.vehicles)) throw new Error("Vehicle gallery manifest must contain a vehicles array.");

  return {
    vehicles: value.vehicles.map((entry, vehicleIndex) => {
      if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.slug !== "string" || typeof entry.displayName !== "string" || typeof entry.coverImageId !== "string" || !Array.isArray(entry.images)) {
        throw new Error(`Vehicle gallery manifest entry ${vehicleIndex} is invalid.`);
      }
      const images = entry.images.map((image, imageIndex) => {
        if (!isRecord(image) || typeof image.id !== "string" || !isGalleryAngle(image.angle) || typeof image.label !== "string" || typeof image.src !== "string" || typeof image.alt !== "string") {
          throw new Error(`Vehicle gallery manifest image ${vehicleIndex}:${imageIndex} is invalid.`);
        }
        return { id: image.id, angle: image.angle, label: image.label, src: image.src, alt: image.alt };
      });
      return { id: entry.id, slug: entry.slug, displayName: entry.displayName, coverImageId: entry.coverImageId, images };
    }),
  };
}

export const vehicleGalleryManifest = parseVehicleGalleryManifest(manifestData);

const galleries: Record<string, VehicleGallery> = {};
for (const vehicle of vehicleGalleryManifest.vehicles) galleries[vehicle.id] = { coverImageId: vehicle.coverImageId, images: vehicle.images };
export const vehicleGalleries = galleries;

const angleLabels: readonly [GalleryAngle, string][] = [
  ["front", "Front elevation"], ["front-left", "Front-left three-quarter"], ["left", "Left profile"], ["rear-left", "Rear-left three-quarter"],
  ["rear", "Rear elevation"], ["rear-right", "Rear-right three-quarter"], ["right", "Right profile"], ["front-right", "Front-right three-quarter"],
];

export function createVehicleGallery(slug: string, vehicle: string): VehicleGallery {
  const images = angleLabels.map(([angle, label], index) => ({
    id: `${slug}-${String(index + 1).padStart(2, "0")}`,
    angle,
    label,
    src: `/media/vehicles/${slug}/${String(index + 1).padStart(2, "0")}-${angle}.png`,
    alt: `${vehicle}: ${label.toLowerCase()}`,
  }));
  return { coverImageId: images[0].id, images };
}
