# Archive and Restore

## Archive identity

- Filename: `EPISODE45_SMART_TARGET_ECOSYSTEM_PRODUCTION_BASELINE_2026-08-02.zip`
- Size: `10,637,530 bytes`
- SHA-256: `2c08b1d650e591798a7ad8852d099a28f2725ba5d9248d47a3c0cc60c3790885`
- Embedded Git archive commit: `de65e5370cce5442e20da2acf6ea85b157afa393`
- Files extracted during verification: `234`

The ZIP was created with `git archive` from the annotated tag `v1.2-smart-target-ecosystem-landing`. It therefore excludes untracked files and contains the exact committed repository state at the tag target.

## Restore from Git

1. Clone `https://github.com/sczn313-stack/v-2-tap-n-score.git`.
2. Check out `v1.2-smart-target-ecosystem-landing` in detached-head mode, or create a recovery branch from that tag.
3. Confirm `git rev-parse HEAD` returns `de65e5370cce5442e20da2acf6ea85b157afa393`.
4. Use `docs/` as the static public web root.
5. Confirm `docs/_redirects` is present so `/api/authority/m4` remains a same-origin browser request proxied to Render.
6. Keep the paired Render backend at commit `9030cb25615a4278549bb3e767c12a8b716108dc` unless a separately governed backend release supersedes it.

## Restore from ZIP

1. Verify the ZIP SHA-256 before extraction.
2. Extract into an empty directory.
3. Confirm the archive comment reports commit `de65e5370cce5442e20da2acf6ea85b157afa393`.
4. Use the extracted `docs/` directory as the Netlify static deploy artifact.
5. Re-run the production authority and 390px checks before publishing.

## Rollback

No rollback was performed during preservation.

If a production rollback is separately authorized, republish the previously verified Netlify deploy `6a6cf3cbf73b8243aa5b59d0`. Do not change DNS or the Render authority service as part of that frontend rollback. After rollback, verify the apex domain, M4 entry, same-origin authority POST, SEC preservation, and Ballistic Vault reopening.
