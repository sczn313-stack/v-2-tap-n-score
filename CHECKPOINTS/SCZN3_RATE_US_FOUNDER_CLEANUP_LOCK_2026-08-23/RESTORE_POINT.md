# Restore Point — Rate Us + Founder Cleanup Lock

## Restore identity

- Source: `/private/tmp/sczn3-baker-release-main`
- Exact Git commit: archive `metadata/HEAD.txt`
- Branch: `codex/baker-release-main-20260814`
- Snapshot: Snapshot 11 — Rate Us + Founder Cleanup Baseline
- Restore point: `/private/tmp/SCZN3_RATE_US_FOUNDER_CLEANUP_LOCK_2026-08-23`
- ZIP: `/private/tmp/SCZN3_RATE_US_FOUNDER_CLEANUP_LOCK_2026-08-23.zip`
- Checksum: `/private/tmp/SCZN3_RATE_US_FOUNDER_CLEANUP_LOCK_2026-08-23.zip.sha256`

## Restore procedure

1. Verify the ZIP against its SHA-256 sidecar.
2. Run `unzip -t` on the ZIP.
3. Verify `metadata/ARCHIVE_SHA256SUMS.txt` from the extracted package root.
4. Verify `git/sczn3-rate-us-founder-cleanup.bundle` with `git bundle verify`.
5. Clone the bundle and check out the commit recorded in `metadata/HEAD.txt`.
6. Compare the checkout against `repository/` and `metadata/REPOSITORY_SHA256SUMS.txt`.
7. Run the Rate Us backend/browser, universal-navigation, and Home landing validation suites before use.

Restoration grants recoverability only. It does not authorize Survey, push, deployment, production mutation, or production promotion.
