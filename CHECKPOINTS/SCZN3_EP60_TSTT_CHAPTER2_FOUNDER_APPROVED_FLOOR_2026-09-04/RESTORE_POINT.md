# Restore Point

## Exact approved runtime floor

`6dad4d6f9a0cdfc3f9ed9e76c85c8004ef8b59fd`

The preservation commit containing Snapshot 25 is the preferred next-work floor because it includes this checkpoint and all governance/history records. Its exact hash is reported to Founder after commit.

## Read-only recovery verification

```sh
git cat-file -e 6dad4d6f9a0cdfc3f9ed9e76c85c8004ef8b59fd^{commit}
git diff --exit-code 6dad4d6f9a0cdfc3f9ed9e76c85c8004ef8b59fd -- docs/m16a2-tstt.html docs/m16a2-tstt.css docs/m16a2-tstt.js docs/tstt_narration.js docs/production/episode60_m16a2_tstt_contract_test.mjs docs/production/episode60_m16a2_tstt_browser_test.mjs docs/production/m16a2_tstt_review_server.mjs docs/authority-evidence/mfam/founder-supplied-chapter2-visual-reference
git ls-tree -r 6dad4d6f9a0cdfc3f9ed9e76c85c8004ef8b59fd docs/m16a2-tstt.html docs/m16a2-tstt.css docs/m16a2-tstt.js docs/tstt_narration.js docs/production/episode60_m16a2_tstt_contract_test.mjs docs/production/episode60_m16a2_tstt_browser_test.mjs docs/production/m16a2_tstt_review_server.mjs docs/authority-evidence/mfam/founder-supplied-chapter2-visual-reference
```

The expected blob identities are recorded in `EVIDENCE_MANIFEST.md`.

To inspect the approved runtime without changing the current worktree:

```sh
git worktree add --detach /tmp/sczn3-ep60-chapter2-recovery 6dad4d6f9a0cdfc3f9ed9e76c85c8004ef8b59fd
```

Removing a temporary recovery worktree is an operator action and is not part of verification. No review-server process, ZIP, push, or deployment is part of the canonical restore state.
