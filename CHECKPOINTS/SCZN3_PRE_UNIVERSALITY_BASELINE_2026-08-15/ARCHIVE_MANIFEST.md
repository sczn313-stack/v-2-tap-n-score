# Archive Manifest — Pre-Universality Baseline

Archive ID: `SCZN3_PRE_UNIVERSALITY_BASELINE_2026-08-15`

## Required archive contents

- checkpoint and lock records
- Snapshot 5 and Snapshot Index
- unchanged authoritative Episode Registry
- full committed source archive at `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- full Git bundle
- production Netlify build
- deployment configuration
- production and repository identity records
- restore and rollback instructions
- file manifest and SHA-256 manifest

## Explicit exclusions

- credentials and access tokens
- environment secrets
- browser profiles and browser-local storage
- dependency directories such as `node_modules`
- caches and temporary runtime state
- prior ZIP archives
- uncommitted product or feature implementation

## Final package

- ZIP filename: `SCZN3_PRE_UNIVERSALITY_BASELINE_2026-08-15.zip`
- ZIP SHA-256: recorded in `SCZN3_PRE_UNIVERSALITY_BASELINE_2026-08-15.zip.sha256`
- Verification: ZIP integrity, internal hashes, Git bundle, and manifest are required to pass
