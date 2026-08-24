# Restore Point — Episode 58 Equipment Library Closure

## Restore identity

- Source: `/private/tmp/sczn3-baker-release-main`
- Exact Git commit: archive `metadata/HEAD.txt`
- Branch: `codex/baker-release-main-20260814`
- Snapshot: Snapshot 13 — Episode 58 Equipment Library Closure
- Restore point: `/private/tmp/SCZN3_EP58_EQUIPMENT_LIBRARY_CLOSURE_2026-08-24`
- ZIP: `/private/tmp/SCZN3_EP58_EQUIPMENT_LIBRARY_CLOSURE_2026-08-24.zip`
- Checksum: `/private/tmp/SCZN3_EP58_EQUIPMENT_LIBRARY_CLOSURE_2026-08-24.zip.sha256`

## Restore procedure

1. Verify the ZIP against its SHA-256 sidecar.
2. Run `unzip -t` on the ZIP.
3. Extract into a clean temporary directory.
4. Verify `metadata/ARCHIVE_SHA256SUMS.txt` from the package root.
5. Verify `git/sczn3-episode58-equipment-library-closure.bundle`.
6. Clone the bundle and check out the commit in `metadata/HEAD.txt`.
7. Compare the checkout against `repository/` using `metadata/REPOSITORY_SHA256SUMS.txt`.
8. Run Episode Registry, Equipment Profile V2, Gate 1/Gate 2, Session Authority, M4, and scale validations.

Restoration grants recoverability only. It does not authorize push, deployment, production change, or new episode work.
