# Task 11 media verification report

Date: 2026-08-16

## Approval status

Automated structural and frozen-asset checks pass for the current logo and all 80 current vehicle PNGs. Human visual approval is **pending re-review** after the 17 replacements below. Automated checks do not establish vehicle identity, visual consistency, or camera-angle correctness.

## Replacement set awaiting human re-review

The current media set preserves all 80 files. These are the exact 17 paths replaced after the original generation run:

1. `public/media/vehicles/2023-bmw-m4-csl/04-rear-left.png`
2. `public/media/vehicles/2023-bmw-m4-csl/06-rear-right.png`
3. `public/media/vehicles/2024-audi-rs6-avant/02-front-left.png`
4. `public/media/vehicles/2024-audi-rs6-avant/04-rear-left.png`
5. `public/media/vehicles/2024-land-rover-defender-110/04-rear-left.png`
6. `public/media/vehicles/2024-land-rover-defender-110/08-front-right.png`
7. `public/media/vehicles/2024-porsche-taycan-turbo-s/02-front-left.png`
8. `public/media/vehicles/2024-porsche-taycan-turbo-s/07-right.png`
9. `public/media/vehicles/2024-porsche-taycan-turbo-s/08-front-right.png`
10. `public/media/vehicles/2023-toyota-gr-supra/04-rear-left.png`
11. `public/media/vehicles/2024-volkswagen-golf-8-r/04-rear-left.png`
12. `public/media/vehicles/2024-volkswagen-golf-8-r/06-rear-right.png`
13. `public/media/vehicles/2024-volkswagen-golf-8-r/07-right.png`
14. `public/media/vehicles/2024-bmw-x5-m-competition/03-left.png`
15. `public/media/vehicles/2024-bmw-x5-m-competition/04-rear-left.png`
16. `public/media/vehicles/2024-bmw-x5-m-competition/06-rear-right.png`
17. `public/media/vehicles/2024-bmw-x5-m-competition/07-right.png`

## Automated checks

`npm.cmd run verify:media` currently verifies:

- the exact ordered roster of ten IDs, slugs, and display names from `src/media/vehicleGalleryManifest.json`;
- eight exact `{id, angle, label, src, alt}` records per vehicle, including deterministic labels, paths, filenames, and alt text;
- globally unique image IDs and paths;
- exactly ten expected vehicle directories and exactly eight expected PNG files in each, rejecting extra directories, nested directories, extra PNGs, and non-PNG files;
- a frozen machine-readable SHA-256, width, height, and byte-size record for the logo plus all 80 current vehicle assets in `public/media/approved-assets.json`;
- 80 unique vehicle SHA-256 hashes;
- vehicle PNG signatures and IHDR dimensions using the existing local parser;
- the frozen logo hash, exact 2172×724 RGBA metadata, transparent corners/background, exact alpha bounds, substantial opaque/high-alpha foreground, and expected green and dark pixel regions.

## Nonblocking byte-size/dimension similarity report

The verifier reports 21 pairs whose files have identical dimensions and byte sizes within 0.05%. This is a manual-review hint only. It is **not** a pixel or perceptual comparison and is never used to pass/fail the verification or to claim that an image shows the requested angle. The closest current pairs are:

| Byte-size difference | First asset | Second asset |
| ---: | --- | --- |
| 0.0011% | `2024-mercedes-amg-c63-s/03-left.png` | `2023-toyota-gr-supra/08-front-right.png` |
| 0.0048% | `2024-land-rover-defender-110/04-rear-left.png` | `2024-porsche-taycan-turbo-s/06-rear-right.png` |
| 0.0050% | `2024-porsche-taycan-turbo-s/08-front-right.png` | `2023-toyota-gr-supra/04-rear-left.png` |
| 0.0124% | `2024-porsche-911-gt3/02-front-left.png` | `2024-audi-rs6-avant/06-rear-right.png` |
| 0.0142% | `2024-mercedes-amg-c63-s/04-rear-left.png` | `2024-ford-ranger-raptor/04-rear-left.png` |

The complete 21-pair list is emitted by `npm.cmd run verify:media` on every run.

## Decoder limitation and required follow-up

Installing `pngjs` was rejected because the account usage limit was reached. The installation was not retried, bypassed, vendored, or replaced with a new decoder. The existing parser remains temporarily in use: it fully inspects the known RGBA logo for the checks above, but for the 80 vehicle files it validates PNG structure/signature and IHDR metadata without a full independent pixel decode. Full external-decoder verification of all vehicle pixels is therefore blocked until dependency installation is available.

Human reviewers must re-review all 17 replacements and the complete gallery sequences before visual approval can be recorded.
