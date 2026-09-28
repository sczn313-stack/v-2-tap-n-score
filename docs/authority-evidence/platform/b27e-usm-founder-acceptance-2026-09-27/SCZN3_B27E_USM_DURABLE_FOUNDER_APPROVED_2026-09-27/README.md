# SCZN3 B27E USM Durable Founder-Approved Checkpoint

This successor package preserves the exact B27E Black floor accepted on 2026-09-27:

- **B27E USM product design — FOUNDER APPROVED**
- **B27E fresh-session durable road — FOUNDER APPROVED**

The earlier `SCZN3_B27E_USM_FOUNDER_APPROVED_2026-09-27` source-only package remains unchanged as the product-design milestone. This package supersedes its `MemoryStore` runtime limitation with the accepted Postgres-backed session and preserved-SEC road.

## Definition

**USM — Universal Scoring Model**

**SCORE / HIT RATE / POINTS PER TAP**

USM does not replace target-specific scoring authority. It expresses performance after governed target scoring produces the result.

B27E is the first Founder-approved USM control implementation. Library-wide universality remains unproven.

## Package layout

- `B27E_USM_FOUNDER_ACCEPTANCE_2026-09-27.md` — preserved predecessor product-design acceptance record.
- `B27E_USM_DURABLE_FOUNDER_ACCEPTANCE_2026-09-27.md` — dual Founder lock, durable runtime proof, and boundaries.
- `MANIFEST.md` — every harvested file classified and explained.
- `SHA256SUMS` — SHA-256 for every packaged file except the checksum file itself.
- `source/` — harvested source with original repository-relative paths preserved.
- `visual-evidence/` — accepted desktop and 390px mobile evidence.
- `evidence/` — Postgres process-restart durability proof for fresh sessions #060 and #061.

## Integrity verification

From the extracted archive root:

```sh
shasum -a 256 -c SHA256SUMS
```

The ZIP has a separate sibling `.sha256` file.

## Restore guidance

This is a surgical source-and-durability checkpoint, not a complete repository, database dump, or secret-custody bundle.

1. Start from the Episode 64 repository state identified in the acceptance record.
2. Verify this package with `SHA256SUMS`.
3. Review the target worktree for overlapping local changes.
4. Copy the required files from `source/docs/...` back to their matching `docs/...` paths. Preserve the relative paths exactly.
5. Provision Postgres and apply the packaged Backend Authority migrations in numeric order.
6. Set `SCZN3_SESSION_SEC_DATABASE_URL` and a high-entropy `SCZN3_SEC_REOPEN_SIGNING_KEY` through the environment or an approved secret store. Neither value is packaged.
7. Re-run the verification files listed in `MANIFEST.md` before accepting the restored road.
8. Create fresh B27E sessions; restart the authority process; then visually compare RESULT, Scoring Distribution, collapsed/expanded History, selected-session detail, SEC, Vault, and exact reopen against `visual-evidence/` and the durability proof.

Do not treat the archive as a blind overwrite bundle. The accepted state was uncommitted and coexisted with broader Episode 64 work. Preserve unrelated user changes when restoring.

## Runtime boundary

The accepted authority service is bound to `PostgresSessionStore` and `PostgresPreservedSECStore`. Fresh sessions #060 and #061 survived complete authority-process restarts and remained available to exact reopen and B27E History.

The package preserves the implementation, schema migrations, tests, authority references, visual evidence, and sanitized proof. It intentionally does **not** preserve database credentials, signing keys, signed capability tokens, a live database dump, or browser storage.

The 25 pre-durability B27E development artifacts remain quarantined evidence outside this package. They are not runtime dependencies and must not be reconstructed or imported merely to restore the accepted product road.

No commit, push, deployment, feature change, refactor, USM expansion, or target-family rollout was performed while creating this package.
