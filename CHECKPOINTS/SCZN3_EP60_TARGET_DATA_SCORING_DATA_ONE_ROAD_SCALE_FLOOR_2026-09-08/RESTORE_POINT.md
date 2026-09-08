# Restore Point

## Canonical artifacts

- Exact proven source: `e249872850409536a368a695b69b682e2584bb01`
- Snapshot: `docs/history/snapshots/SNAPSHOT_026_EPISODE_60_TARGET_DATA_SCORING_DATA_ONE_ROAD_SCALE_FLOOR.md`
- Keepsake: #24 — TARGET IS DATA — SCALE PROVEN
- Master Vault: `/Users/ronnieseay/Documents/ChatGPT/Shortest mental model/Keepsake Vault/`

The preservation commit containing this checkpoint and the Keepsake archive name/hash are recorded in `ARCHIVE_MANIFEST.md` after the canonical archive is built.

## Restore procedure

1. Verify the canonical ZIP with the SHA-256 in `ARCHIVE_MANIFEST.md`.
2. Extract it into a new directory.
3. Verify the embedded Git bundle with `git bundle verify`.
4. Clone the bundle into a new repository.
5. Check out the preservation commit recorded in `ARCHIVE_MANIFEST.md`.
6. Run the deposit's `VERIFY_SCALE_FLOOR.sh` from the restored repository.

The exact implementation floor remains reachable as source commit `e249872850409536a368a695b69b682e2584bb01`. No reset of a working repository is required.
