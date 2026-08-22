# Restore Point — Pre-Universality Baseline

## Restore identity

- Source repository: `https://github.com/sczn313-stack/v-2-tap-n-score.git`
- Source commit: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Working branch at capture: `codex/baker-release-main-20260814`
- Production branch: `main`
- Production URL: `https://tap-n-score.com`
- Netlify deploy ID: `6a8109353cd2113bbd070578`
- Render deploy ID: `dep-da0ghc61egvs739g7240`

## Restore from Git bundle

```sh
unzip SCZN3_PRE_UNIVERSALITY_BASELINE_2026-08-15.zip
git clone SCZN3_PRE_UNIVERSALITY_BASELINE_2026-08-15/git-bundles/sczn3-pre-universality.bundle sczn3-pre-universality-restored
git -C sczn3-pre-universality-restored checkout -b restore/pre-universality bfce363643eff364e43d7d71a6b1e42c0262ca42
```

## Restore from source archive

Extract `repository-source/sczn3-source-bfce363.tar.gz` into an empty directory. The source archive represents the committed tree at `bfce363643eff364e43d7d71a6b1e42c0262ca42`.

## Build and local review

```sh
cd sczn3-pre-universality-restored/docs
npm install
npm run build:netlify
python3 -m http.server 8137
```

Local review URL: `http://127.0.0.1:8137/`

## Verification before restoration use

1. Verify the outer ZIP SHA-256 against its `.sha256` sidecar.
2. Run `unzip -t` on the ZIP.
3. Verify `SHA256SUMS.txt` inside the extracted archive.
4. Verify the Git bundle with `git bundle verify`.
5. Confirm `git rev-parse HEAD` equals the locked source commit.
6. Run the application test and production-build suites appropriate to the intended use.

## Restoration boundary

These instructions establish recoverability only. They do not authorize a production rollback, deployment, DNS change, commit, push, Universality work, or IDPA work.
