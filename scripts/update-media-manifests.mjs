import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { galleryAngles, vehicleRoster } from "./vehicle-roster.mjs";

const root = process.cwd();
const logoPath = "public/media/brand/weelee-logo-transparent.png";

const imagesFor = (slug, displayName) => galleryAngles.map(([angle, label], index) => {
  const number = String(index + 1).padStart(2, "0");
  return {
    id: `${slug}-${number}`,
    angle,
    label,
    src: `/media/vehicles/${slug}/${number}-${angle}.png`,
    alt: `${displayName}: ${label.toLowerCase()}`,
  };
});

const vehicles = vehicleRoster.map(([id, slug, displayName]) => {
  const images = imagesFor(slug, displayName);
  return { id, slug, displayName, coverImageId: images[0].id, images };
});

const assetPaths = [
  logoPath,
  ...vehicleRoster.flatMap(([, slug]) => galleryAngles.map(([angle], index) => `public/media/vehicles/${slug}/${String(index + 1).padStart(2, "0")}-${angle}.png`)),
];

const assets = assetPaths.map((path) => {
  const data = readFileSync(join(root, ...path.split("/")));
  if (data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`${path} is not a PNG`);
  return {
    path,
    sha256: createHash("sha256").update(data).digest("hex"),
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    size: data.length,
  };
});

const galleryOutput = `${JSON.stringify({ vehicles }, null, 2)}\n`;
const approvedOutput = `${JSON.stringify({ version: 1, hashAlgorithm: "sha256", assets }, null, 2)}\n`;
writeFileSync(join(root, "src", "media", "vehicleGalleryManifest.json"), galleryOutput);
writeFileSync(join(root, "public", "media", "approved-assets.json"), approvedOutput);
console.log(`Updated manifests for ${vehicles.length} vehicles and ${assets.length - 1} vehicle images.`);
