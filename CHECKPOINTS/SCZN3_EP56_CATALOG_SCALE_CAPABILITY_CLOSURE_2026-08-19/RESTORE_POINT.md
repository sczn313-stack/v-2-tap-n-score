# Restore Point — Episode 56 Catalog Scale + Capability Closure

## Restore identity

- Source: `/private/tmp/sczn3-baker-release-main`
- Git HEAD: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Branch: `codex/baker-release-main-20260814`
- Working overlay: intentionally modified and uncommitted Episode 54–56 state
- Snapshot: Snapshot 8 — Episode 56 Catalog Scale + Capability Baseline
- ZIP: `/private/tmp/SCZN3_EP56_CATALOG_SCALE_CAPABILITY_CLOSURE_2026-08-19.zip`
- Checksum: `/private/tmp/SCZN3_EP56_CATALOG_SCALE_CAPABILITY_CLOSURE_2026-08-19.zip.sha256`

## Restore procedure

1. Verify the ZIP against its SHA-256 sidecar.
2. Run `unzip -t`.
3. Verify `metadata/SHA256SUMS.txt` from the extracted package root.
4. Verify `git/sczn3-ep56.bundle` with `git bundle verify`.
5. Clone the bundle and check out the recorded HEAD.
6. Overlay `repository/` onto that clean checkout.
7. Compare the restored worktree status with `metadata/WORKTREE_STATUS.txt` and source hashes with `metadata/REPOSITORY_SHA256SUMS.txt`.
8. Run the recorded verification suite before using the restored state.

Restoration grants recoverability only. It does not authorize deployment or production mutation.
