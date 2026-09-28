# Harvest Manifest

All paths below are relative to this archive root. Original repository-relative paths are retained under `source/`.

## Primary implementation

| File | Role |
|---|---|
| `source/docs/usm_proof_registry.js` | B27E-only USM eligibility, History data shaping, formulas, and exact-session references. |
| `source/docs/target_execution_runtime.js` | Shared target execution, governed RESULT, SEC preservation, History rendering, synchronized charts/selection, and exact-reopen handoff. |
| `source/docs/target-experience.css` | Accepted B27E RESULT, compact History header, charts, selected-session treatment, responsive desktop/mobile presentation. |
| `source/docs/target-experience.html` | Target/RESULT/SEC/History host and required script/style assembly. |
| `source/docs/records.html` | Ballistic Vault BEFORE \| RESULT presentation, selected-session record handling, and OPEN SEC road. |
| `source/docs/ballistic-vault.css` | Accepted Vault and preserved-session responsive presentation. |

## Required dependencies — shared frontend and reopen road

| File | Role |
|---|---|
| `source/docs/app_state.js` | Shared application/session state support. |
| `source/docs/styles.css` | Global visual foundation used by target and Vault pages. |
| `source/docs/platform-ui.css` | Shared platform UI styling. |
| `source/docs/m4-sec.css` | Shared SEC shell styling loaded by the accepted pages. |
| `source/docs/sec-framework.css` | SEC framework presentation dependency. |
| `source/docs/platform_actions.css` | Shared action/control styling. |
| `source/docs/platform_actions.js` | Shared action behavior. |
| `source/docs/sec_reopen_capability.js` | Signed preserved-SEC capability parsing, retention, and request support. |
| `source/docs/sec_reopen_lifecycle.js` | Canonical historical SEC reopen lifecycle. |
| `source/docs/platform_contracts.js` | Shared platform contract helpers. |
| `source/docs/sec_adapter_model.js` | SEC adapter selection/model support. |
| `source/docs/sec_dispatch.js` | SEC dispatch and preserved-result routing. |
| `source/docs/m4_runtime.js` | Shared runtime dependency loaded by target/SEC pages. |
| `source/docs/sec_v1.js` | Shared SEC behavior loaded by the accepted road. |
| `source/docs/navigation.js` | Shared page navigation support. |
| `source/docs/experience_frame_processing.css` | Experience-frame presentation dependency. |
| `source/docs/experience_frame_processing.js` | Experience-frame behavior dependency. |
| `source/docs/presentation_labels.js` | Shooter-facing label helpers. |
| `source/docs/zeroing_platform.js` | Shared capability module loaded by the target runtime. |
| `source/docs/zeroing_target_profiles.js` | Shared zeroing data dependency loaded by the target runtime. |
| `source/docs/m4_sec_config.js` | Shared SEC configuration. |
| `source/docs/sec_session_timeline.js` | Shared SEC timeline dependency. |
| `source/docs/universal_practice_sec.js` | Universal SEC adapter dependency. |
| `source/docs/m4_smart_target_sec.js` | Mature SEC adapter loaded by the Vault page. |
| `source/docs/baker_sl_st1_sec.js` | Mature adapter loaded unconditionally by the shared Vault page. |
| `source/docs/gunfun_vital_dude_sec.js` | Mature adapter loaded unconditionally by the shared Vault page. |
| `source/docs/baker_sl_st2_idpa_sec.js` | Mature adapter loaded unconditionally by the shared Vault page. |
| `source/docs/baker_fun_sec.js` | Mature adapter loaded unconditionally by the shared Vault page. |
| `source/docs/baker-sl-st1-sec.css` | Styling for an unconditionally loaded mature Vault adapter. |
| `source/docs/gunfun-vital-dude-sec.css` | Styling for an unconditionally loaded mature Vault adapter. |
| `source/docs/baker-sl-st2-idpa-sec.css` | Styling for an unconditionally loaded mature Vault adapter. |
| `source/docs/baker-fun-sec.css` | Styling for an unconditionally loaded mature Vault adapter. |
| `source/docs/ops.js` | Shared operational helpers loaded by the Vault page. |
| `source/docs/vendor/html2canvas-1.4.1.min.js` | Evidence capture dependency. |
| `source/docs/assets/crosshair-cross-emblem.png` | Shared rendered marker/evidence asset. |

## Required dependencies — local Backend Authority road

| File | Role |
|---|---|
| `source/docs/production/qt_episode64_founder_review_server.py` | Accepted local Authority/target-execution/SEC service entry point. |
| `source/docs/backend/execution_authority.py` | Authoritative target execution orchestration. |
| `source/docs/backend/preserved_sec_store.py` | SEC preservation package and listing/read operations. |
| `source/docs/backend/sec_reopen_authority.py` | Signed exact-reopen capability issuance and verification. |
| `source/docs/backend/session_authority.py` | Session preparation/start authority. |
| `source/docs/backend/target_execution_contract.py` | Contract resolver and identity enforcement. |
| `source/docs/backend/test_target_execution_scale_architecture.py` | Provides the current local service's MemoryStore implementation; it is a runtime dependency despite its historical filename. |
| `source/docs/backend/execution_capability_registry.py` | Executor registration and dispatch. |
| `source/docs/backend/stage_event_store.py` | Shared stage-event persistence model. |
| `source/docs/backend/gssf_ac_1_authority.py` | Imported shared authority dependency. |
| `source/docs/backend/m4_authority/weapon_equipment_registry.py` | Imported shared weapon/equipment authority dependency. |
| `source/docs/backend/mfam_family_authority.py` | Imported shared family authority dependency. |
| `source/docs/backend/target_scoring_data_contract.py` | Governed scoring-result validation. |
| `source/docs/backend/test_fixtures/target_execution_scale.py` | Current local scale fixture imported by the service/runtime support. |
| `source/docs/backend/executors/__init__.py` | Executor package initialization. |
| `source/docs/backend/executors/collection_hand_evaluator.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/cue_drill_orchestrator.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/decision_scenario_evaluator.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/declarative_target_score.py` | B27E governed target-scoring executor. |
| `source/docs/backend/executors/diagnostic_feedback_evaluator.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/precision_open_score.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/qualification_executor.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/recreational_challenge.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/sec_progression_evaluator.py` | Import-time executor-registry dependency. |
| `source/docs/backend/executors/smart_evidence_capture.py` | Shared evidence capture executor. |

## Verification / test

| File | Role |
|---|---|
| `source/docs/production/b27e_history_tap_independence_test.mjs` | B27E USM formulas, chronology, tap-count independence, and History contract. |
| `source/docs/production/canonical_preserved_lifecycle_test.mjs` | RESULT → SEC → Vault → exact-reopen ownership regression. |
| `source/docs/production/sec_vault_architecture_contract_test.mjs` | SEC/Vault architecture and presentation contract. |
| `source/docs/production/portable_exact_reopen_capability_test.mjs` | Independent-browser reopen portability guard. |
| `source/docs/production/ugo_location_authority_lock_test.mjs` | UGO canonical-coordinate authority regression. |
| `source/docs/production/pre_qt_generic_road_regression_contract_test.mjs` | Pre-QT 251-contract, mature-adapter, and 18-target generic-road regression. |
| `source/docs/production/approved_universal_result_recovery_test.mjs` | Founder-approved universal RESULT recovery contract. |
| `source/docs/backend/test_pre_qt_generic_18_regression.py` | Backend authority/lifecycle verification for the representative 18-target pre-QT floor. |

## Authority / data — reference only

| File | Role |
|---|---|
| `source/docs/backend/target_execution_contracts/contracts/gunfun_22200_b27e_black_target_scoring_v1.json` | Governed B27E execution identity, image binding, regions, values, and capability. |
| `source/docs/authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22200.jpg` | Governed B27E source image. |
| `source/docs/architecture/decisions/ADR-002_UGO_LOCATION_AUTHORITY.md` | Durable architectural rule that UGO/canonical coordinates own location truth. |
| `source/docs/backend/target_knowledge/ugo_location_authority_standard_v1.json` | Machine-readable UGO authority standard. |

## Visual evidence

| File | Evidence |
|---|---|
| `visual-evidence/B27E_ACCEPTED_RESULT_DISTRIBUTION_DESKTOP.png` | Desktop governed RESULT and current-session Scoring Distribution. |
| `visual-evidence/B27E_ACCEPTED_RESULT_DISTRIBUTION_MOBILE_390.png` | 390px mobile governed RESULT and Scoring Distribution. |
| `visual-evidence/B27E_HISTORY_HEADER_DESKTOP_COLLAPSED.png` | Accepted compact desktop History header, collapsed. |
| `visual-evidence/B27E_HISTORY_HEADER_DESKTOP_EXPANDED.png` | Accepted expanded desktop B27E USM History, synchronized charts, selection, details, and OPEN SEC. |
| `visual-evidence/B27E_HISTORY_HEADER_MOBILE_390_COLLAPSED.png` | Accepted compact 390px History header, collapsed. |
| `visual-evidence/B27E_HISTORY_HEADER_MOBILE_390_EXPANDED.png` | Accepted expanded 390px B27E USM History. |

## Known non-file dependency

The accepted local authority server held preserved sessions in process memory. That transient session dataset and its signed reopen capabilities were not repository files and could not be cleanly harvested after the service stopped. They are therefore not claimed as a restorable dependency. The source road and visual/verification evidence are preserved.
