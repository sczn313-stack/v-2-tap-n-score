# Episode 56 — GunFun Full Catalog Stress Test (Command 1)

Status: **PASS WITH RECORDED EXCEPTIONS**  
Frozen architecture: `2026-08-19T00:00:30-04:00`  
Experiment: `2026-08-19T11:14:31-04:00` through `2026-08-19T11:29:01-04:00`

## Governing result

The complete publisher denominator is 258 distinct published SKUs. The frozen scale architecture registered and exactly reopened 237 products (91.86%) through contract data with zero target-ID production edits, zero target-specific production modules, and zero target-specific routes created during the experiment.

One additional product, Vital Dude SKU 22740, remains governed and QR-route-ready on its preexisting target-specific flow, but it does not count as frozen-architecture inheritance. Its static Session Authority profile resolves before the contract resolver and therefore exposes one architecture failure without invalidating the other 237 products.

## Denominator and outcomes

| Outcome | Count | Denominator share |
|---|---:|---:|
| Published distinct GunFun SKUs | 258 | 100.00% |
| Unique registration possible | 241 | 93.41% |
| Frozen-architecture registration + full exact reopen | 237 | 91.86% |
| Preexisting governed Vital Dude registration | 1 | 0.39% |
| External Publisher Target Profile authority dependency | 3 | 1.16% |
| Unsupported physical representation | 17 | 6.59% |
| Unique governed route suitable for QR association | 238 | 92.25% |

The live shop grid exposed 256 results. The publisher APIs exposed 258 published products; hidden-from-grid SKUs 91160 and 92510 remain in the denominator.

## Exceptions

- Architecture failure: Vital Dude, SKU 22740. Existing target-specific Session Authority precedence shadows the contract resolver. Historical exact reopen still passes; no workaround was introduced.
- External authority dependency: Rangemaster-RFTS-Q5 SKU 140, Rangemaster-RFTS-Q4 SKU 148, and Rangemaster-RFTS-Q6 SKU 151. GunFun explicitly transfers availability to the separate MPTargets.com site, so SCZN3 did not invent Publisher Target Profile authority.
- Unsupported physical representation: 14 target hangers/backers and three multi-design Splatter Packs. They remain recognized publisher products but were not mislabeled as single executable shooting targets.
- Insufficient identity: 0.
- Duplicate or ambiguous SKU: 0.
- Missing publisher asset: 0.
- Genuine irreducible target-specific execution exception: 0.

## Capability result

All 237 frozen-architecture products inherited `smartEvidenceCapture` and `smart-evidence-family`. Every one produced a backend-authoritative result, Universal SEC, immutable preservation, and exact reopen. Numeric/official scoring, qualification, publisher mission completion, canonical regions, semantic classification, physical measurement, correction, and anatomical/medical/tactical meaning remained unavailable or not applicable.

## Validation

- PASS 237/237 backend governed lifecycles through exact reopen.
- PASS 237/237 real browser lifecycles using admitted publisher assets.
- PASS exact publisher product name and SKU in result, SEC, preservation, and reopen.
- PASS two reconciled observations, admitted evidence image, shooter-declared aim, and `scoring.status === "not_applicable"` for every admitted product.
- PASS frozen architecture synthetic acceptance and fail-closed cases.
- PASS capability-family executors.
- PASS Session Authority 17/17.
- PASS preserved SEC tests.
- PASS Vital Dude evidence, Session Authority, SEC, build, browser, and exact-reopen regressions.
- PASS Baker SL-ST1 Universal SEC regression.
- PASS Universal SEC shell regression.
- PASS build: 337 public files with registration-driven hash/role admission.

## Timing

- Total elapsed experiment time: 14.50 minutes.
- Total active Cody work: 8.75 minutes.
- Permission/environment friction: 0.25 minutes.
- Unattended waiting: 5.50 minutes.
- Founder-response waiting: 0 minutes.
- Mean active work per catalog SKU: 0.0339 minutes (2.03 seconds).
- Mean elapsed time per catalog SKU: 0.0562 minutes (3.37 seconds).
- Median live browser time to backend-authoritative result: 258 ms.
- Median live browser time to exact reopen: 326 ms.

The complete 258-record product result is preserved in `FULL_CATALOG_AUTHORITY_AUDIT.json`; per-product backend and browser lifecycle timings are preserved in `FULL_CATALOG_LIFECYCLE_RESULTS.json` and `FULL_CATALOG_BROWSER_RESULTS.json`; time by cause is preserved in `WORK_LEDGER.json`.

No frozen architecture source was changed. No production deployment, commit, or push occurred. Command 2 was not started.
