# QT Printer #13 — Universal SEC Chassis Evidence

Date: 2026-09-29

Starting HEAD: `210e6176445f9c6cef02dc110549e9fdf36e0cca`

Commit status: **included in the Founder-acceptance checkpoint**

## Founder direction implemented

Generic Printer #13 target execution now renders through the existing `SCZN3SEC` schema `1.2` chassis. The chassis owns the shared `TARGET`, `SESSION`, and shooter-action regions. Each target's existing approved RESULT, evidence, object/region details, and eligible USM History remain target-driven inside that chassis.

The specialized M16A2 SEC remains on its existing specialized adapter and was not flattened into the generic target road.

## Shared inheritance

- `TARGET`: preserved target evidence, approved target-specific RESULT, governed detail disclosures, eligible History/USM.
- `SESSION`: shared `SessionDetails` component populated only from existing session/target facts.
- `ACTIONS`: existing shared ActionBar/Preservation components with Save SEC, Share, Export / Print PDF, Add Note, Ballistic Vault, and Exact Reopen according to lifecycle state.
- Historical exact reopen remains non-mutating and exposes Share, Export / Print PDF, and Ballistic Vault.

## Files changed for this SEC pass

- `docs/target_execution_runtime.js`
- `docs/target-experience.css`
- `docs/production/canonical_preserved_lifecycle_test.mjs`
- `docs/production/qt_printer13_universality_browser_test.mjs`

No Backend Authority, target contract, UGO, geometry, scoring, classifier, Vault owner, or specialized M16A2 SEC file was changed by this pass.

## Automated proof

PASS:

- canonical RESULT → SEC → Vault → exact-reopen ownership
- Episode 54 shared SEC component ownership across existing adapters
- QT Printer #13 DD Universality comparison
- 250 generic contracts inherit existing executors/adapters/preservation validators
- M16A2 inherits the existing specialized zeroing road
- accepted physical floor remains `200 REPAIR→PASS / 51 N/A / 3 protected HOLD`
- QT scoring → USM contract
- universal Counting drawer and shooter-facing label sanitization
- USMC-THREAT compact Zone Details presentation
- real browser lifecycle at desktop
- real browser lifecycle at 390px

The browser regression now asserts:

- `data-sec-shell="universal-v1"`
- exact region order: `target → session → actions`
- shared pre-preservation action set
- factual Session Details
- Save SEC → portable Exact Reopen
- the same universal chassis after exact reopen
- historical action set
- preserved tap markers
- no page errors

## Rendered proof

- [Desktop SEC](./QT_GENERIC_SEC_DESKTOP.png)

  SHA-256: `b093efa0b6b3740c60bba45c58b64544a0ae5e56a7f409b1dc53325f0586177e`
- [390px SEC](./QT_GENERIC_SEC_390PX.png)

  SHA-256: `4c85dc18e0eb85a712c907f0dfc1b753fd88a60175a1c5ba663474cb6e5066d8`

## Acceptance boundary

Cody verification: **PASS**

Founder acceptance: **ACCEPTED / LOCKED**
