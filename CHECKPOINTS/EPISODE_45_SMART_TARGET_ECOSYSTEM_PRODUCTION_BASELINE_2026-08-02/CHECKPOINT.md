# Episode 45 Smart Target Ecosystem Production Baseline

Status: Founder accepted and preserved

Checkpoint date: 2026-08-02

## Production identity

- Production URL: `https://tap-n-score.com/`
- Netlify project: `sczn3-tap-n-score`
- Netlify site ID: `dddf7c77-9e52-4324-82f4-cce20b55ea4e`
- Netlify production deploy ID: `6a6fdf1dff2faee6bb94cb32`
- Render authority service: `sczn3-authority`
- Render authority URL: `https://sczn3-authority.onrender.com/api/authority/m4`
- Paired backend commit: `9030cb25615a4278549bb3e767c12a8b716108dc`

## Git identity

- Repository: `sczn313-stack/v-2-tap-n-score`
- Preservation branch: `codex/episode45-smart-target-ecosystem-baseline`
- Exact deployed-source commit: `de65e5370cce5442e20da2acf6ea85b157afa393`
- Release tag: `v1.2-smart-target-ecosystem-landing`
- Tag target: `de65e5370cce5442e20da2acf6ea85b157afa393`

The tag identifies the exact source archived for this release. The preservation branch was used instead of `main` so the checkpoint would not trigger an unauthorized Render redeployment.

## Founder acceptance

Founder authorized preservation after accepting the live Smart Target Ecosystem landing page. The authorized scope was commit, push, archive, checksum, restore verification, and checkpoint documentation only. No application code, content, DNS, or production deployment changes were authorized during preservation.

## Verification summary

- Production apex HTTPS returned HTTP 200 from Netlify.
- `https://www.tap-n-score.com/` returned HTTP 301 to the apex domain.
- Landing identity rendered as `Tap-n-Score™ | Smart Target Ecosystem`.
- Catalog rendered 10 experiences: 3 available and 7 coming soon.
- Desktop rendered two catalog columns with no horizontal overflow.
- 390px rendered one catalog column with no horizontal overflow.
- All visible catalog images loaded successfully.
- M4 Launch opened the intended Weapon Library route.
- Browser console contained no errors during the landing and M4-entry checks.
- Valid same-origin `POST /api/authority/m4` returned HTTP 200 with POIB, correction, mechanical validation, shot lineage, and evidence hash.
- Malformed same-origin authority input returned HTTP 400.
- Canonical integration, Smart Target identity, and Zeroing SOP checks passed.
- M4 authority tests passed 10/10.
- Python-to-production-adapter parity passed 57/57.

## Deferred polish

- Coming-soon experiences remain intentionally non-interactive until their authoritative workflows are approved.
- Illustrative coming-soon previews may be replaced when approved target artwork becomes available.
- A physical-iPhone shooter usability rewalk remains a separate review activity; it is not part of this preservation checkpoint.

These are non-blocking future items and do not change Founder acceptance of this baseline.
