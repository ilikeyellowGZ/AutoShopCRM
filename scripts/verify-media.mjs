import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { galleryAngles as angleSpecs, vehicleRoster as roster } from "./vehicle-roster.mjs";

const root = process.cwd();
const logoPath = "public/media/brand/weelee-logo-transparent.png";
const logoHash = "e1157737e87a4b38dfd471a2f8b5eb7c65f9b8b819cac0297e0667b65e40add9";
const manifestPath = join(root, "src", "media", "vehicleGalleryManifest.json");
const approvedAssetsPath = join(root, "public", "media", "approved-assets.json");
const fail = (message) => { throw new Error(`Media verification failed: ${message}`); };
const diskPath = (portablePath) => join(root, ...portablePath.split("/"));
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

function assertExactKeys(value, keys, context) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${context} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(`${context} must have exactly keys ${expected.join(", ")}`);
}

function pngInfo(portablePath) {
  const file = diskPath(portablePath);
  const data = readFileSync(file);
  if (data.length < 33 || data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fail(`${portablePath} is not a PNG`);
  let offset = 8;
  let metadata;
  const idat = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    if (offset + 12 + length > data.length) fail(`${portablePath} contains a truncated PNG chunk`);
    const type = data.subarray(offset + 4, offset + 8).toString("ascii");
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") metadata = { width: chunk.readUInt32BE(0), height: chunk.readUInt32BE(4), bitDepth: chunk[8], colorType: chunk[9], compression: chunk[10], filter: chunk[11], interlace: chunk[12] };
    if (type === "IDAT") idat.push(chunk);
    if (type === "IEND") break;
  }
  if (!metadata || !metadata.width || !metadata.height || idat.length === 0) fail(`${portablePath} has incomplete PNG metadata`);
  return { ...metadata, data, compressed: Buffer.concat(idat) };
}

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  return leftDistance <= upDistance && leftDistance <= upperLeftDistance ? left : upDistance <= upperLeftDistance ? up : upperLeft;
}

function inspectLogoPixels(info) {
  if (info.bitDepth !== 8 || info.colorType !== 6 || info.compression !== 0 || info.filter !== 0 || info.interlace !== 0) fail("logo must be a non-interlaced 8-bit RGBA PNG");
  const channels = 4;
  const stride = info.width * channels;
  const raw = inflateSync(info.compressed);
  if (raw.length !== (stride + 1) * info.height) fail("logo decompressed byte length is invalid");
  let previous = Buffer.alloc(stride);
  let offset = 0;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let transparent = 0;
  let opaque = 0;
  let highAlpha = 0;
  let green = 0;
  let dark = 0;
  const cornerAlpha = [];
  for (let y = 0; y < info.height; y += 1) {
    const filterType = raw[offset++];
    const current = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;
    for (let byte = 0; byte < stride; byte += 1) {
      const left = byte >= channels ? current[byte - channels] : 0;
      const up = previous[byte] ?? 0;
      const upperLeft = byte >= channels ? previous[byte - channels] : 0;
      if (filterType === 1) current[byte] = (current[byte] + left) & 255;
      else if (filterType === 2) current[byte] = (current[byte] + up) & 255;
      else if (filterType === 3) current[byte] = (current[byte] + Math.floor((left + up) / 2)) & 255;
      else if (filterType === 4) current[byte] = (current[byte] + paeth(left, up, upperLeft)) & 255;
      else if (filterType !== 0) fail(`logo uses unsupported PNG filter ${filterType}`);
    }
    for (let x = 0; x < info.width; x += 1) {
      const pixel = x * channels;
      const red = current[pixel];
      const greenChannel = current[pixel + 1];
      const blue = current[pixel + 2];
      const alpha = current[pixel + 3];
      if (alpha === 0) transparent += 1;
      if (alpha === 255) opaque += 1;
      if (alpha >= 250) highAlpha += 1;
      if (alpha > 0) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      if (alpha >= 200 && greenChannel >= 100 && greenChannel > red * 1.25 && greenChannel > blue * 1.25) green += 1;
      if (alpha >= 200 && red < 80 && greenChannel < 100 && blue < 110) dark += 1;
      if ((x === 0 || x === info.width - 1) && (y === 0 || y === info.height - 1)) cornerAlpha.push(alpha);
    }
    previous = current;
  }
  return { bounds: [minX, minY, maxX, maxY], transparent, opaque, highAlpha, green, dark, cornerAlpha };
}

function assertExactDirectory(directory, expectedNames, directoriesOnly) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) fail(`missing directory ${directory}`);
  const entries = readdirSync(directory, { withFileTypes: true });
  const expected = [...expectedNames].sort();
  const actual = entries.map((entry) => entry.name).sort();
  if (actual.length !== expected.length || actual.some((name, index) => name !== expected[index])) fail(`${directory} must contain exactly: ${expected.join(", ")}; found: ${actual.join(", ")}`);
  for (const entry of entries) {
    if (directoriesOnly ? !entry.isDirectory() : !entry.isFile()) fail(`${join(directory, entry.name)} has the wrong filesystem type`);
  }
}

const expectedSlugs = roster.map(([, slug]) => slug);
const expectedFilenames = angleSpecs.map(([angle], index) => `${String(index + 1).padStart(2, "0")}-${angle}.png`);
const vehiclesRoot = join(root, "public", "media", "vehicles");
assertExactDirectory(vehiclesRoot, expectedSlugs, true);
for (const slug of expectedSlugs) assertExactDirectory(join(vehiclesRoot, slug), expectedFilenames, false);
assertExactDirectory(join(root, "public", "media", "brand"), ["weelee-logo-transparent.png"], false);

const galleryManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assertExactKeys(galleryManifest, ["vehicles"], "vehicle gallery manifest");
if (!Array.isArray(galleryManifest.vehicles) || galleryManifest.vehicles.length !== roster.length) fail(`vehicle gallery manifest must contain exactly ${roster.length} roster entries`);
const ids = new Set();
const slugs = new Set();
const imageIds = new Set();
const imagePaths = new Set();
for (let vehicleIndex = 0; vehicleIndex < roster.length; vehicleIndex += 1) {
  const [expectedId, expectedSlug, expectedDisplayName] = roster[vehicleIndex];
  const vehicle = galleryManifest.vehicles[vehicleIndex];
  assertExactKeys(vehicle, ["id", "slug", "displayName", "coverImageId", "images"], `vehicle manifest entry ${vehicleIndex}`);
  if (vehicle.id !== expectedId || vehicle.slug !== expectedSlug || vehicle.displayName !== expectedDisplayName) fail(`roster entry ${vehicleIndex} must be ${expectedId} / ${expectedSlug} / ${expectedDisplayName}`);
  if (ids.has(vehicle.id) || slugs.has(vehicle.slug)) fail(`duplicate roster ID or slug at ${vehicle.id}`);
  ids.add(vehicle.id); slugs.add(vehicle.slug);
  if (!Array.isArray(vehicle.images) || vehicle.images.length !== angleSpecs.length) fail(`${vehicle.id} must contain exactly eight images`);
  for (let imageIndex = 0; imageIndex < angleSpecs.length; imageIndex += 1) {
    const image = vehicle.images[imageIndex];
    const [angle, label] = angleSpecs[imageIndex];
    const number = String(imageIndex + 1).padStart(2, "0");
    const expectedImageId = `${expectedSlug}-${number}`;
    const expectedSrc = `/media/vehicles/${expectedSlug}/${number}-${angle}.png`;
    const expectedAlt = `${expectedDisplayName}: ${label.toLowerCase()}`;
    assertExactKeys(image, ["id", "angle", "label", "src", "alt"], `${vehicle.id} image ${imageIndex}`);
    if (image.id !== expectedImageId || image.angle !== angle || image.label !== label || image.src !== expectedSrc || image.alt !== expectedAlt) fail(`${vehicle.id} image ${imageIndex} does not match its deterministic manifest contract`);
    if (imageIds.has(image.id) || imagePaths.has(image.src)) fail(`duplicate image ID or path at ${image.id}`);
    imageIds.add(image.id); imagePaths.add(image.src);
  }
  if (vehicle.coverImageId !== vehicle.images[0].id) fail(`${vehicle.id} coverImageId must reference its front image`);
}

const expectedAssetPaths = [logoPath, ...roster.flatMap(([, slug]) => expectedFilenames.map((filename) => `public/media/vehicles/${slug}/${filename}`))];
const approved = JSON.parse(readFileSync(approvedAssetsPath, "utf8"));
assertExactKeys(approved, ["version", "hashAlgorithm", "assets"], "approved asset manifest");
if (approved.version !== 1 || approved.hashAlgorithm !== "sha256" || !Array.isArray(approved.assets) || approved.assets.length !== expectedAssetPaths.length) fail("approved asset manifest header or asset count is invalid");
const vehicleHashes = new Set();
const verifiedVehicleAssets = [];
for (let index = 0; index < expectedAssetPaths.length; index += 1) {
  const expectedPath = expectedAssetPaths[index];
  const approvedAsset = approved.assets[index];
  assertExactKeys(approvedAsset, ["path", "sha256", "width", "height", "size"], `approved asset ${index}`);
  if (approvedAsset.path !== expectedPath) fail(`approved asset ${index} must be ${expectedPath}`);
  const file = diskPath(expectedPath);
  if (!existsSync(file) || !statSync(file).isFile()) fail(`missing approved asset ${expectedPath}`);
  const info = pngInfo(expectedPath);
  const actual = { sha256: sha256(info.data), width: info.width, height: info.height, size: info.data.length };
  if (approvedAsset.sha256 !== actual.sha256 || approvedAsset.width !== actual.width || approvedAsset.height !== actual.height || approvedAsset.size !== actual.size) fail(`approved asset metadata mismatch for ${expectedPath}`);
  if (expectedPath !== logoPath) {
    if (info.width < 1024 || info.height < 640 || info.width / info.height < 1.2 || info.width / info.height > 2.3) fail(`invalid studio image dimensions: ${expectedPath} (${info.width}x${info.height})`);
    if (vehicleHashes.has(actual.sha256)) fail(`byte-identical roster image: ${expectedPath}`);
    vehicleHashes.add(actual.sha256);
    verifiedVehicleAssets.push(approvedAsset);
  }
}
const expectedVehicleImageCount = roster.length * angleSpecs.length;
if (vehicleHashes.size !== expectedVehicleImageCount) fail(`expected ${expectedVehicleImageCount} unique vehicle hashes; found ${vehicleHashes.size}`);
if (new Set(approved.assets.map((asset) => asset.path)).size !== expectedVehicleImageCount + 1) fail("approved asset paths must be unique");

const logoInfo = pngInfo(logoPath);
if (logoInfo.width !== 2172 || logoInfo.height !== 724 || logoInfo.bitDepth !== 8 || logoInfo.colorType !== 6) fail("logo must be exactly 2172x724 RGBA");
if (sha256(logoInfo.data) !== logoHash) fail("logo hash differs from the frozen approved asset");
const logoPixels = inspectLogoPixels(logoInfo);
if (logoPixels.cornerAlpha.some((alpha) => alpha !== 0) || logoPixels.transparent < 1_000_000) fail("logo corners and background must remain transparent");
if (logoPixels.bounds.join(",") !== "18,43,2139,683") fail(`logo alpha bounds changed: ${logoPixels.bounds.join(",")}`);
if (logoPixels.opaque < 4_000 || logoPixels.highAlpha < 400_000) fail("logo must retain substantial opaque/high-alpha foreground");
if (logoPixels.green < 100_000 || logoPixels.dark < 250_000) fail("logo must retain both expected green and dark pixel regions");

const similarityHints = [];
for (let left = 0; left < verifiedVehicleAssets.length; left += 1) {
  for (let right = left + 1; right < verifiedVehicleAssets.length; right += 1) {
    const a = verifiedVehicleAssets[left];
    const b = verifiedVehicleAssets[right];
    const relativeSizeDifference = Math.abs(a.size - b.size) / Math.max(a.size, b.size);
    if (a.width === b.width && a.height === b.height && relativeSizeDifference <= 0.0005) similarityHints.push({ a: a.path, b: b.path, relativeSizeDifference });
  }
}
similarityHints.sort((left, right) => left.relativeSizeDifference - right.relativeSizeDifference || left.a.localeCompare(right.a) || left.b.localeCompare(right.b));
console.log(`Nonblocking byte-size/dimension similarity hints (${similarityHints.length}; manual review only):`);
for (const hint of similarityHints) console.log(`- ${(hint.relativeSizeDifference * 100).toFixed(4)}% size difference at identical dimensions: ${hint.a} <> ${hint.b}`);
console.log("These hints are not pixel/perceptual comparisons and do not establish vehicle identity or camera-angle correctness.");
console.log(`Verified exact roster JSON, strict filesystem shape, approved SHA-256 metadata, ${expectedVehicleImageCount} unique vehicle files, and frozen transparent Weelee logo checks.`);
