# Verification Report — Pre-Universality Baseline

Verification date: 2026-08-15

## Repository

- Captured branch: `codex/baker-release-main-20260814`
- Captured commit: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Production branch commit: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Working tree before archival records: clean

## Production

- Netlify deploy `6a8109353cd2113bbd070578`: production baseline
- Render deploy `dep-da0ghc61egvs739g7240`: `live`
- Render deploy commit: `bfce363643eff364e43d7d71a6b1e42c0262ca42`
- Authority health endpoint: healthy
- Prior release production verification covered desktop and 390px historical SEC reopen through Vault, direct link, and Session 2 timeline navigation.

## Capture-time checks

- Netlify production build: PASS (`47` public files plus assets)
- Universal SEC Session 2 timeline contract: PASS
- Browser-suite launch in the isolated checkpoint worktree: environment-blocked because the local Playwright browser executable is not installed
- Browser behavior authority: the production verification completed with the release and is preserved in this checkpoint record

## Archive verification

The generated ZIP must pass all of the following before completion is reported:

- ZIP integrity test
- internal file manifest generation
- internal SHA-256 manifest verification
- Git bundle verification
- source archive presence
- production build presence
- restore instructions presence
- external ZIP SHA-256 generation

Final results are recorded in `ARCHIVE_MANIFEST.md` and beside the ZIP.
