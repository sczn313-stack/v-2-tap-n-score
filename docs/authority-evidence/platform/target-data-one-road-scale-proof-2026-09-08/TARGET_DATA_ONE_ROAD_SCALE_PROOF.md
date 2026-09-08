# Target Data / One Road Scale Proof

Date: 2026-09-08  
Baseline: `429d8c053b18bac9b7d335965968a0289e712799`

## Governing test

Nine exact publisher targets were sent through the unchanged shared `target-experience.html` road. The experiment changed only the target identity/profile query and uploaded publisher representation. No target ID was added to `target-experience.html` or `target_execution_runtime.js`; no per-target branch, page, route, or scoring rule was created.

The requested road was:

`LOAD → TAP → SCORE → SEE RESULTS → CONFIRM when applicable → SEC → VAULT`

## Result

The scale claim did **not** pass.

| # | Exact target | Shared-road result | Honest disposition |
|---:|---|---|---|
| 1 | GunFun `13120` — Small Critical Shots | Evidence capture → SEC → exact reopen | Stops at scoring: `not_applicable` |
| 2 | GunFun `22200` — B27E Black | Evidence capture → SEC → exact reopen | Stops at scoring: `not_applicable` |
| 3 | Baker `SL-ST2` — Silhouette Target (IDPA) | Session admits; Show Results refuses | `target_execution_contract_required` |
| 4 | GunFun `22470` — USPSA/IPSC | Evidence capture → SEC → exact reopen | Stops at scoring: `not_applicable` |
| 5 | GunFun `22040` — IDPA White | Evidence capture → SEC → exact reopen | Stops at scoring: `not_applicable` |
| 6 | GunFun `12070` — Big Circle | Evidence capture → SEC → exact reopen | Stops at scoring: `not_applicable` |
| 7 | Baker `BE-R9B` — Rifle Nine Bulls Eyes | Start refuses | `target_id_not_registered` |
| 8 | Baker `GF-BB-C` — Billiard Ball Color | Session admits; Show Results refuses | `target_execution_contract_required` |
| 9 | GunFun `22740` — Vital Dude | Session admits; Show Results refuses | `target_execution_contract_required` |

Totals:

- 5/9 inherited one unchanged shared evidence-capture executor and reached Universal SEC, preservation, and exact reopen.
- 0/9 completed the requested scored road.
- 3/9 already have admitted session identities/capability implementations, but those capabilities are still outside the shared Target Execution Contract road.
- 1/9 is a known printer product in the P-OS catalog but has no runtime target identity/profile binding.

## Exact reusable-system boundary

The road successfully expresses these reusable behaviors:

- registered contract admission;
- publisher image load;
- shooter-declared aim;
- normalized source-image observations;
- backend evidence reconciliation;
- Universal SEC rendering;
- immutable preservation;
- exact reopen.

It does **not** yet express the cohort's target behavior as data:

1. The five admitted GunFun contracts declare only `smartEvidenceCapture`, so the backend truthfully returns `Scoring: Not applicable`.
2. Baker `SL-ST2` (`idpaTimedPractice`), Baker `GF-BB-C` (`catalogFunGame`), and GunFun `22740` have existing target capability/session authority but no shared Target Execution Contract binding consumable by this road.
3. Baker `BE-R9B` has authoritative printer identity in P-OS but no backend target profile/session identity and no shared execution contract.

The next reusable problem is therefore **not nine pages**. It is to make existing behavioral authority expressible through shared execution contracts and shared executors, then connect the missing product identity/profile. Until that exists, “target becomes data; road stays software” is proven only for capture/preservation—not for scoring.

## Evidence

- Cohort identity manifest: `TARGET_DATA_ONE_ROAD_COHORT.json`
- Browser outcomes: `VALIDATION.json`
- Reproducible browser test: `docs/production/target_data_one_road_scale_browser_test.mjs`
- Local production-catalog harness: `docs/production/target_data_one_road_scale_review_server.py`

The harness loads the production Target Execution Contract catalog and adds no contracts or target behavior.
