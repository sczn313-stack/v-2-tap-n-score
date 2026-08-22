# Restore Point — Episode 57 Landing Page Closure

## Restore identity

- Source: `/private/tmp/sczn3-baker-release-main`
- Exact Git commit: archive `metadata/HEAD.txt`
- Branch: `codex/baker-release-main-20260814`
- Snapshot: Snapshot 9 — Episode 57 Landing Page Baseline
- Restore point: `/private/tmp/SCZN3_EP57_LANDING_PAGE_CLOSURE_2026-08-22`
- ZIP: `/private/tmp/SCZN3_EP57_LANDING_PAGE_CLOSURE_2026-08-22.zip`
- Checksum: `/private/tmp/SCZN3_EP57_LANDING_PAGE_CLOSURE_2026-08-22.zip.sha256`

## Restore procedure

1. Verify the ZIP against its SHA-256 sidecar.
2. Run `unzip -t` on the ZIP.
3. Verify `metadata/SHA256SUMS.txt` from the extracted package root.
4. Verify `git/sczn3-ep57.bundle` with `git bundle verify`.
5. Clone the bundle and check out the commit recorded in `metadata/HEAD.txt`.
6. Compare the checkout against `repository/` and `metadata/REPOSITORY_SHA256SUMS.txt`.
7. Run the recorded verification suite before using the restored state.

Restoration grants recoverability only. It does not authorize deployment, production mutation, or Survey work.
