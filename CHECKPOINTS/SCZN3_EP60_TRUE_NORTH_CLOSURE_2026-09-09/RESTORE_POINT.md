# Restore Point

## Canonical artifacts

- Exact implementation source: `a9ba035659e873f5704a35ee7a10541b270fec3a`
- Snapshot: `docs/history/snapshots/SNAPSHOT_027_EPISODE_60_CLOSURE_2570_TARGET_TRUE_NORTH_EXISTING_CAPABILITY_FLOOR.md`
- Checkpoint: `CHECKPOINTS/SCZN3_EP60_TRUE_NORTH_CLOSURE_2026-09-09/`
- SCMM: v2.6
- Keepsake: #25 — Episode 60 True North Closure
- Master Vault: `/Users/ronnieseay/Documents/ChatGPT/Shortest mental model/Keepsake Vault/`

The preservation commit, bundle, ZIP filename, and SHA-256 are recorded in `ARCHIVE_MANIFEST.md` after archive creation.

## Restore procedure

1. Verify the canonical ZIP with the SHA-256 in `ARCHIVE_MANIFEST.md` or its adjacent checksum sidecar.
2. Extract the ZIP into a new directory.
3. Verify the embedded Git bundle with `git bundle verify`.
4. Clone the bundle into a new repository.
5. Check out the preservation commit named in `ARCHIVE_MANIFEST.md`.
6. Run the deposit's `VERIFY_EPISODE_60_CLOSURE.sh /path/to/restored/repository`.
7. Confirm the exact implementation source is an ancestor and the Episode Registry reports Episode 60 locked with no active Episode.

No reset of an existing working repository is required.

