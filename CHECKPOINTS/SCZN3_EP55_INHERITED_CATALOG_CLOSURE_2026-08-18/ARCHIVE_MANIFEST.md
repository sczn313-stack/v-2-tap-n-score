# Archive Manifest — Episode 55 Inherited Catalog Closure

## Package

- Archive directory: `/private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18`
- ZIP: `/private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18.zip`
- SHA-256 sidecar: `/private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18.zip.sha256`

## Required contents

- Complete repository working overlay, excluding `.git` and reproducible caches/build output.
- Git bundle preserving repository history and refs.
- Episode 55 record and closing record.
- Snapshot 7 and restore instructions.
- SCZN3 Shortest Correct Mental Model v1.0.
- Episode 55 Right/Wrong Ledger.
- Relevant authority/provenance evidence and test sources.
- Episode Registry and history/architecture indexes.
- Worktree metadata, diffs, file manifests, checksums, and verification results.

## Intentionally excluded

- `.git/` directory; repository history is supplied as a verified Git bundle.
- `node_modules/`, `__pycache__/`, `test-results/`, transient `tmp/`, and prior ZIP packages.
- Production secrets, credentials, and environment-only configuration.

## Integrity contract

The outer ZIP checksum is authoritative through the sidecar. Internal archive files are covered by `metadata/SHA256SUMS.txt`; repository source files are covered independently by `metadata/REPOSITORY_SHA256SUMS.txt`.
