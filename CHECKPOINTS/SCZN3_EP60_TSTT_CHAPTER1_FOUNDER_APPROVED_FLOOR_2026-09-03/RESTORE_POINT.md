# Restore Point

## Exact approved runtime floor

`eba3199782ca07d87bc71677f450f00e79827990`

The preservation commit containing Snapshot 24 is the preferred next-work floor because it includes this checkpoint and all governance/history records. Its exact hash is reported to Founder after commit.

## Read-only recovery verification

```sh
git cat-file -e eba3199782ca07d87bc71677f450f00e79827990^{commit}
git diff --exit-code eba3199782ca07d87bc71677f450f00e79827990 -- docs/m16a2-tstt.html docs/m16a2-tstt.css docs/m16a2-tstt.js docs/tstt_narration.js docs/production/episode60_m16a2_tstt_contract_test.mjs docs/production/episode60_m16a2_tstt_browser_test.mjs
git ls-tree eba3199782ca07d87bc71677f450f00e79827990 docs/m16a2-tstt.html docs/m16a2-tstt.css docs/m16a2-tstt.js docs/tstt_narration.js docs/production/episode60_m16a2_tstt_contract_test.mjs docs/production/episode60_m16a2_tstt_browser_test.mjs
```

The expected blob identities are recorded in `EVIDENCE_MANIFEST.md`.

No review-server process, ZIP, push, deployment, or Home activation is part of the canonical restore state.
