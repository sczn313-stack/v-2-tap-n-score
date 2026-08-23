# Restore Point — SCMM v1.4 General Shooting Knowledge Lock

## Restore identity

- Source: `/private/tmp/sczn3-baker-release-main`
- Exact Git commit: archive `metadata/HEAD.txt`
- Branch: `codex/baker-release-main-20260814`
- Snapshot: Snapshot 10 — SCMM v1.4 General Shooting Knowledge Baseline
- Restore point: `/private/tmp/SCZN3_SCMM_V1_4_GENERAL_SHOOTING_KNOWLEDGE_LOCK_2026-08-23`
- ZIP: `/private/tmp/SCZN3_SCMM_V1_4_GENERAL_SHOOTING_KNOWLEDGE_LOCK_2026-08-23.zip`
- Checksum: `/private/tmp/SCZN3_SCMM_V1_4_GENERAL_SHOOTING_KNOWLEDGE_LOCK_2026-08-23.zip.sha256`

## Restore procedure

1. Verify the ZIP against its SHA-256 sidecar.
2. Run `unzip -t` on the ZIP.
3. Verify `metadata/SHA256SUMS.txt` from the extracted package root.
4. Verify `git/sczn3-scmm-v1.4.bundle` with `git bundle verify`.
5. Clone the bundle and check out the commit recorded in `metadata/HEAD.txt`.
6. Compare the checkout against `repository/` and `metadata/REPOSITORY_SHA256SUMS.txt`.
7. Validate SCMM links, locked phrases, first-synthesis JSON, and current denominator totals before use.

Restoration grants recoverability only. It does not authorize deployment, production mutation, Survey, Publisher #13, or knowledge-feature implementation.
