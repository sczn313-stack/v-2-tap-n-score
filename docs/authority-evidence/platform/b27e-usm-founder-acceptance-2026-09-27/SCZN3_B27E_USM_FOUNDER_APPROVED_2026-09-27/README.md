# SCZN3 B27E USM Founder-Approved Source Harvest

This package preserves the Founder-approved B27E Black USM control implementation accepted on 2026-09-27.

## Definition

**USM — Universal Scoring Model**

**SCORE / HIT RATE / POINTS PER TAP**

USM does not replace target-specific scoring authority. It expresses performance after governed target scoring produces the result.

B27E is the first Founder-approved USM control implementation. Library-wide universality remains unproven.

## Package layout

- `B27E_USM_FOUNDER_ACCEPTANCE_2026-09-27.md` — acceptance, exact repository state, verification, and boundaries.
- `MANIFEST.md` — every harvested file classified and explained.
- `SHA256SUMS` — SHA-256 for every packaged file except the checksum file itself.
- `source/` — harvested source with original repository-relative paths preserved.
- `visual-evidence/` — accepted desktop and 390px mobile evidence.

## Integrity verification

From the extracted archive root:

```sh
shasum -a 256 -c SHA256SUMS
```

The ZIP has a separate sibling `.sha256` file.

## Restore guidance

This is a surgical source harvest, not a complete repository or runtime snapshot.

1. Start from the Episode 64 repository state identified in the acceptance record.
2. Verify this package with `SHA256SUMS`.
3. Review the target worktree for overlapping local changes.
4. Copy the required files from `source/docs/...` back to their matching `docs/...` paths. Preserve the relative paths exactly.
5. Re-run the verification files listed in `MANIFEST.md` before accepting the restored road.
6. Visually compare RESULT, Scoring Distribution, collapsed/expanded History, selected-session detail, SEC, and Vault against `visual-evidence/`.

Do not treat the archive as a blind overwrite bundle. The accepted state was uncommitted and coexisted with broader Episode 64 work. Preserve unrelated user changes when restoring.

## Runtime boundary

The package does not claim a standalone runtime restore. The accepted local authority service used an in-memory preserved-session store. Live historical session records and signed reopen capabilities were not durable repository files at packaging time. The implementation and visual/verification evidence are preserved; the transient service memory is not.

No commit, push, deployment, feature change, refactor, USM expansion, or target-family rollout was performed while creating this package.
