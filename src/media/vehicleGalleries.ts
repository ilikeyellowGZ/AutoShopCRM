import type { GalleryAngle, VehicleGallery } from "../domain/models";

const angles: readonly [GalleryAngle, string][] = [
  ["front", "Front elevation"], ["front-left", "Front-left three-quarter"], ["left", "Left profile"], ["rear-left", "Rear-left three-quarter"],
  ["rear", "Rear elevation"], ["rear-right", "Rear-right three-quarter"], ["right", "Right profile"], ["front-right", "Front-right three-quarter"],
];

const gallery = (slug: string, vehicle: string): VehicleGallery => ({
  coverImageId: `${slug}-01`,
  images: angles.map(([angle, label], index) => ({
    id: `${slug}-${String(index + 1).padStart(2, "0")}`,
    angle,
    label,
    src: `/media/vehicles/${slug}/${String(index + 1).padStart(2, "0")}-${angle}.png`,
    alt: `${vehicle} — ${label.toLowerCase()}`,
  })),
});

export const vehicleGalleries: Record<string, VehicleGallery> = {
  "vehicle-01": gallery("2024-porsche-911-gt3", "2024 Porsche 911 GT3"),
  "vehicle-02": gallery("2023-bmw-m4-csl", "2023 BMW M4 CSL"),
  "vehicle-03": gallery("2024-audi-rs6-avant", "2024 Audi RS6 Avant"),
  "vehicle-04": gallery("2024-land-rover-defender-110", "2024 Land Rover Defender 110"),
  "vehicle-05": gallery("2024-porsche-taycan-turbo-s", "2024 Porsche Taycan Turbo S"),
  "vehicle-06": gallery("2024-mercedes-amg-c63-s", "2024 Mercedes-AMG C63 S"),
  "vehicle-07": gallery("2023-toyota-gr-supra", "2023 Toyota GR Supra"),
  "vehicle-08": gallery("2024-ford-ranger-raptor", "2024 Ford Ranger Raptor"),
  "vehicle-09": gallery("2024-volkswagen-golf-8-r", "2024 Volkswagen Golf 8 R"),
  "vehicle-10": gallery("2024-bmw-x5-m-competition", "2024 BMW X5 M Competition"),
};
