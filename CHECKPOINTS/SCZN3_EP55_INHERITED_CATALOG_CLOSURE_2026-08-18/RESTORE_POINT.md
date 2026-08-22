# Restore Point — Episode 55 Inherited Catalog Closure

## Restore identity

- Source at capture: `/private/tmp/sczn3-baker-release-main`
- Repository: `https://github.com/sczn313-stack/v-2-tap-n-score.git`
- Production baseline: `https://tap-n-score.com` at `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Git base/HEAD: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Branch: `codex/baker-release-main-20260814`
- Working overlay: intentionally modified and uncommitted Episode 54/55 state
- Snapshot: Snapshot 7 — Episode 55 Inherited Catalog Baseline
- ZIP: `/private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18.zip`
- ZIP checksum: `/private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18.zip.sha256`

## State model

`Production baseline → Git base/HEAD → working overlay → Episode 55 closing snapshot/restore point`

These are distinct states. Restoring the overlay does not make it production and does not authorize deployment.

## Restoration commands

Run in a directory where a new `sczn3-ep55-restored` directory may be created:

```sh
unzip /private/tmp/SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18.zip
git clone SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18/git/sczn3-ep55.bundle sczn3-ep55-restored
git -C sczn3-ep55-restored checkout -B restore/episode-55 bfce363643eff364e43d7d71a6b1e42c0262ca42
git -C sczn3-ep55-restored rm -r --ignore-unmatch .
cp -R SCZN3_EP55_INHERITED_CATALOG_CLOSURE_2026-08-18/repository/. sczn3-ep55-restored/
git -C sczn3-ep55-restored reset --mixed HEAD
git -C sczn3-ep55-restored status --short
```

The final status must match `metadata/WORKTREE_STATUS.txt`. Source hashes must match `metadata/REPOSITORY_SHA256SUMS.txt`.

## Verification order

1. Verify the outer ZIP against its SHA-256 sidecar.
2. Run `unzip -t`.
3. Verify `metadata/SHA256SUMS.txt`.
4. Verify `git/sczn3-ep55.bundle`.
5. Restore into a clean directory using the commands above.
6. Compare working status and repository file hashes.
7. Run the production build, authority suites, and Episode 54/55 inheritance tests appropriate to the intended use.

## Boundary

This restore point provides recoverability only. It grants no commit, push, deployment, rollback, production mutation, or new feature authority.
