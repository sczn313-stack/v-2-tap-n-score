# Governed Zeroing Capability v1

## Reusable boundary

`SCZN3ZeroingPlatform` owns one shooter road:

`PHOTO ENTRY → PRECISION TAP → AIM → SHOTS → UNDO/CLEAR → SHOW RESULTS → CORRECTION → APPLY → CONFIRMATION PHOTO → CONFIRMATION SHOTS → SHOW RESULTS → SEC → VAULT`

That road also owns its processing, unavailable-result, retry, additional-confirmation, and preservation states. A Target Profile is rejected if it attempts to supply workflow, controls, navigation, scoring, correction math, confirmation workflow, SEC workflow, or Vault workflow.

Backend Session Authority admits the Target Profile and returns the immutable `zeroingExperience` envelope. The browser uses that envelope to select the already-built road and the correct authority family. It does not reconstruct target geometry or mechanical click authority.

## Target Profile inputs

A supported zeroing target supplies only:

- exact target/product/representation identity;
- physical geometry, aim reference, and registration package through backend authority;
- governed shooting distance and target procedure;
- applicable equipment and mechanical adjustment authority through backend admission;
- an optional registered reference representation or shooter-photo entry mode;
- target-specific teaching/finalization language.

## M16A2-specific code that remains

- `backend/session_authority.py`: Baker standard M16A2 identity, 25-meter procedure, registration package, equipment requirements, and admitted adjustment-profile identity.
- `backend/m4_authority/authority_service.py`: governed standard-face geometry and M16A2 mechanical-authority resolution.
- `backend/registries/target_image_registration_packages.json`: exact standard-face registration evidence and orientation gates.
- `zeroing_target_profiles.js`: standard-face representation metadata plus Chapter 4 confirmation/finalization teaching content.
- `m16a2-tstt.*` and `m16a2_talking_demo_session.js`: Chapters 1–3 target-specific teaching and prepared demonstration.

M16A2 no longer owns a photo-entry flow, Precision Tap flow, Undo/Clear behavior, result screen, confirmation state machine, SEC flow, Vault flow, or recovery screen. `m4_runtime.js` remains a compatibility bridge for existing pages, but delegates zeroing request construction to `SCZN3ZeroingPlatform`.

## Scale test

`baker_m16a2_25m_zero` and `m4_25m_zero` both declare `sczn3-governed-zeroing-road-v1`. They differ in governed profile data, not workflow implementation. A future M4/M16 face becomes eligible by registering its own proven identity, geometry/registration, equipment/mechanical package, and teaching content against the same capability ID.

Registration and directional reconciliation remain fail closed. Capability reuse never grants geometry or mechanical authority.
