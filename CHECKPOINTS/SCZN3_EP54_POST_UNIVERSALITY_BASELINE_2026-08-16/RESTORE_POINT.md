# Restore Point — Episode 54 Post-Universality Baseline

## Restore identity

- Exact source location at capture: `/private/tmp/sczn3-baker-release-main`
- Source repository: `https://github.com/sczn313-stack/v-2-tap-n-score.git`
- Git base/HEAD: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Working branch: `codex/baker-release-main-20260814`
- ZIP: `/private/tmp/SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16.zip`
- ZIP SHA-256: recorded in `/private/tmp/SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16.zip.sha256`

## Exact restoration commands

Run these commands in a directory where a new `sczn3-ep54-restored` directory may be created:

```sh
unzip /private/tmp/SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16.zip
git clone SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16/git/sczn3-ep54.bundle sczn3-ep54-restored
git -C sczn3-ep54-restored checkout -B restore/episode-54 bfce363643eff364e43d7d71a6b1e42c0262ca42
git -C sczn3-ep54-restored rm -r --ignore-unmatch .
cp -R SCZN3_EP54_POST_UNIVERSALITY_BASELINE_2026-08-16/repository/. sczn3-ep54-restored/
git -C sczn3-ep54-restored reset --mixed HEAD
git -C sczn3-ep54-restored status --short
```

The final status must match `metadata/WORKTREE_STATUS.txt` in the archive. This intentionally reproduces the Founder-approved uncommitted working state, including tracked modifications, tracked deletions, and untracked implementation/closeout files.

## Build and local review

```sh
cd sczn3-ep54-restored/docs
npm install
npm run build:netlify
python3 -m http.server 8137
```

Local review URL: `http://127.0.0.1:8137/`

## Verification before restoration use

1. Verify the outer ZIP SHA-256 against its sidecar.
2. Run `unzip -t` on the ZIP.
3. Verify the internal `metadata/SHA256SUMS.txt` manifest.
4. Verify `git/sczn3-ep54.bundle` with `git bundle verify`.
5. Perform the clean restoration overlay above.
6. Compare restored source hashes with `metadata/REPOSITORY_SHA256SUMS.txt`.
7. Run the build, authority, contract, browser, and Item 9 inheritance suites appropriate to the intended use.

## Restoration boundary

These instructions establish recoverability only. They do not authorize production rollback, deployment, DNS change, commit, push, Episode 55 work, IDPA work, or unrelated repair.
