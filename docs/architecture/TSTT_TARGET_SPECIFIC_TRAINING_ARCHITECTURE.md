# TSTT — Target-Specific Training Architecture and Initial Chapter Maps

Date: 2026-09-02

Status: Founder Approved adaptive architecture / proposed chapter maps preserved / runtime implementation pending

## Purpose

TSTT — **Talking Smart Target Training** — is the target-specific learning layer between exact Smart Target identity and governed execution. It teaches the shooter what must be understood, lets the shooter rehearse physical actions before live fire, and hands into Tap-n-Score when evidence or authoritative calculation is required.

> **Teach → Rehearse → Shoot → Measure → Adjust → Confirm → Preserve**

TSTT explains resolved authority. **TSTT never invents authority.**

## Governing adaptive model

> **Target determines the lesson.**
>
> **Equipment determines the branch.**
>
> **Results determine advancement.**

The exact Smart Target selects the target-specific lesson contract. The shooter's resolved equipment/sight configuration selects only the applicable teaching and adjustment branch inside that lesson. Governed Tap-n-Score results then decide whether the shooter advances, repeats the correction cycle, or stops at a narrow authority/evidence hold.

Adaptation does not transfer authority to TSTT. Target Authority must admit the target/equipment relationship and owns target-specific procedure, applicability, overrides, calculation, execution, and confirmation. Equipment Authority supplies reusable mechanical facts for the resolved configuration. TSTT selects and explains only content supported by those owners.

Equipment branching is governed content/data selection, not permission to create target-ID, SKU, firearm-model, or optic-model application-code branches. A branch may be entered only from resolved equipment identity and configuration. Irrelevant branches are omitted, not played and verbally disclaimed. If no applicable branch resolves, the unsupported instruction fails closed while other truthful target instruction remains available.

## Chapter contract

A chapter is a complete learning unit organized around a shooter task. Every chapter must declare:

- the exact product/face and configuration to which it applies;
- what the shooter should understand when the chapter is complete;
- what the shooter may physically rehearse;
- the authority/evidence supporting the instruction;
- whether live firing occurs;
- whether control is in TSTT, Tap-n-Score, or a governed handoff between them;
- its equipment/configuration entry predicate and branch exit/rejoin point, when applicable;
- the governed result state required to advance, repeat, or stop;
- the completion condition and safe next action.

Chapter duration follows the task. It is not an arbitrary video segment.

## Phone-first navigation contract

| Control | Required behavior |
|---|---|
| `PAUSE` | Freeze narration and chapter choreography without losing chapter or governed-road state. |
| `REPLAY CHAPTER` | Return to the beginning of the current chapter and replay the complete learning unit. |
| `CHAPTERS` | Open direct navigation among available learning units while preserving any separately governed Tap-n-Score evidence. |
| `RESTART TRAINING` | Return to the beginning of the full TSTT session; it does not erase separately captured shooter evidence without an explicit governed action. |

There is no 10-second rewind control. Rehearsal is chapter-based so the shooter can repeat one complete physical or conceptual task.

## Ownership and handoff

| Owner | Owns |
|---|---|
| TSTT | Ordered teaching, authority explanation, task rehearsal, chapter state, and the timing of governed handoffs |
| Equipment Authority | Reusable control identity, movement per click, rotation, observer view, purpose, provenance, and scope |
| Target Authority | Exact applicability, printed procedure, target-specific override, geometry, correction calculation, governed execution, and confirmation requirements |
| Tap-n-Score | Photo acquisition, registration, Precision Tap observations, authoritative request/response presentation, confirmation evidence, SEC, Vault, and exact reopen |

The first live-fire chapter may not begin until required identity, distance, equipment/configuration, target setup, applicable branch, and pre-fire procedures have resolved. If a chapter's required authority is missing, TSTT withholds only the unsupported instruction or action and states what is needed.

## Equipment-adaptive branch contract

1. Resolve the exact sight/optic, firearm relationship, mount/installation, and other configuration facts required by Target Authority.
2. Ask only for the minimum missing shooter input that materially selects an applicable branch; a saved Equipment Profile may satisfy already-governed facts.
3. Admit the relationship through Target Authority. Similar names or shared click values do not establish applicability.
4. Load only the chapters or chapter variants applicable to that configuration. Common target identity, geometry, safety, evidence, and preservation units may be shared.
5. Rejoin the common governed road at the first state where branch-specific mechanical instruction is no longer required.
6. Preserve the selected authority identities and branch identity with the session so replay and exact reopen cannot silently change the lesson.

Changing equipment/configuration invalidates any dependent ready-to-fire state and requires branch resolution again. It does not erase separately preserved evidence.

## Result-adaptive advancement contract

Confirmation is a governed decision point, not necessarily the final chapter. After every live group, Tap-n-Score owns evidence registration, measurement, correction calculation, and confirmation classification. TSTT routes from the returned governed state:

| Governed result state | Required TSTT behavior |
|---|---|
| Evidence incomplete or insufficient | Return to the evidence task or request the missing governed observation; do not calculate or advance. |
| Measurable and correction required | Explain the returned correction, enter the applicable equipment adjustment branch, then return to confirmation firing. |
| Adjustment application not yet acknowledged/recorded | Remain at rehearsal/application; do not imply the correction was made. |
| Confirmation evidence collected but standard not satisfied | Repeat **Measure → Adjust → Confirm** using the new evidence and newly returned authority result. |
| Confirmed under the applicable governed standard | Exit the loop and advance to any required target-specific finalization, then Preserve. |
| Authority unavailable, configuration mismatch, or contradictory evidence | Stop narrowly at the affected action, preserve truthful evidence/state, and state what must be resolved. |

The loop has no arbitrary pass count and no TSTT-authored tolerance. Each pass uses new governed evidence. `PAUSE`, `REPLAY CHAPTER`, `CHAPTERS`, and `RESTART TRAINING` never convert an unconfirmed result into a confirmed one or erase the separately governed loop history.

## Shared chapter state model

The three maps use the same conceptual states without forcing identical language or chapter counts:

1. `teach`
2. `rehearse`
3. `ready-to-fire`
4. `fire`
5. `tap-n-score-handoff`
6. `measure`
7. `adjust`
8. `confirm`
9. `preserve`

TSTT chapter state is not correction authority. Tap-n-Score session state is not video position. Chapter order is a graph with governed branches and result gates, not a promise that every shooter watches every chapter exactly once.

---

## Baker Universal MOA 25 Meter — proposed TSTT map

Product basis: standalone Baker Smart version derived from conventional `ST-Uni25mMOA`. Shared geometry classification: `SAME_GEOMETRY_NEW_PRODUCT` against protected `m4_25m_zero`. Exact Smart SKU and QR remain unresolved.

| Chapter | What it teaches | What the shooter can rehearse | Governing authority/evidence | Firing | TSTT / Tap-n-Score boundary |
|---:|---|---|---|---|---|
| U1 — Confirm This Target | Identify the standalone Baker Universal MOA Smart face, its 25-meter use, and the requirement to match one exact sight system before correction. | Compare the physical title, center diamond, ring stack, grid, and future QR identity to the displayed reference. | Founder Baker product screenshot; `BAKER_ST_UNI25MMOA_GEOMETRY_COMPARISON.md`; future Baker Smart product/QR authority required. | None | TSTT only; block governed execution if product/face identity is unresolved. |
| U2 — Read the Target | Each small block represents 1 MOA at 25 m; the ring stack, crosshair, black disk, dashed ring, and center diamond are registration and aiming landmarks. | Trace the center axes and identify the center diamond and matching grid intersections without touching sights. | Protected Fort Benning geometry reconstruction and Baker same-geometry comparison; final Baker specimen registration still required. | None | TSTT teaches; Tap-n-Score later owns photograph registration and coordinates. |
| U3 — Select the Correct Sight Row | The printed table is not one universal adjustment rule. The shooter must select the row matching the exact installed sight/configuration. | Locate the applicable row and say the elevation and windage values back before any adjustment. | Printed Baker table; Equipment Library identity; Target Authority applicability selection. | None | TSTT may show only resolved rows; unresolved or mismatched equipment withholds correction. |
| U4 — Rehearse the Controls | For an admitted configuration, distinguish the elevation control from the windage control and practice desired-POI-first, named-control, rotation, and observer-view language. | With an unloaded/safe firearm under range rules, point to the correct control and rehearse the governed direction without consuming a correction. | Selected Equipment Authority profile or exact target-scoped authority; final observer-view iconography pending. | None | TSTT presents resolved mechanics; it does not calculate clicks. |
| U5 — Aim and Fire the First Group | Establish a deliberate point of aim at the governed center landmark and fire a group suitable for measuring center. | Rehearse sight picture, stable aim, and the post-group cease-fire/photo sequence. | Target geometry and future Baker Universal Target Profile; shot-count/group sufficiency remains unresolved. | **First live group** | TSTT leads through firing, then stops before measurement. |
| U6 — Add Photo and Precision Tap | The shooter's photograph, declared aim point, and visible impacts become governed observations. | Rehearse the order: `ADD PHOTO`, confirm registration, tap aim, tap visible impacts, review before submit. | Inherited Episode 59 Target Image Registration and Precision Tap contracts. | None | **Handoff into Tap-n-Score at `ADD PHOTO`.** |
| U7 — Measure the Group | Group center and aim-versus-impact displacement are measured from registered evidence; TSTT does not estimate them. | Review the declared aim/impacts and confirm they correspond to the paper. | Tap-n-Score registration/measurement authority; claim-proportional sufficiency. | None | Tap-n-Score owns measurement and any refusal. TSTT may explain the returned result. |
| U8 — Apply the Governed Correction | Desired POI movement, correct control, click count, rotation, and observer view come from the exact resolved row/configuration. | Pause or replay the chapter while physically applying the returned adjustment under range-safe conditions. | Backend Target Authority calculation plus selected Equipment Authority or target-scoped authority. | None | Tap-n-Score returns correction; TSTT explains and supports rehearsal without changing it. |
| U9 — Fire and Measure Confirmation | A correction is not a confirmed zero. Fire a new group and capture new evidence. | Rehearse the full confirmation loop before firing. | Printed true-range confirmation warning; future target-specific confirmation contract. | **Confirmation group** | TSTT hands back to `ADD PHOTO`; Tap-n-Score registers and measures confirmation. |
| U10 — Preserve and Continue | Save the evidence, result, applied adjustment, and confirmation outcome for SEC, Equipment Profile relationship, Vault, and exact reopen. | Rehearse where to find the saved SEC and reopen the exact session. | Inherited Universal SEC, Equipment Profile, Ballistic Vault, and exact-reopen contracts. | None | Tap-n-Score owns Save/SEC/Vault; TSTT closes only after preservation status is known. |

### Universal adaptive routing

| Decision point | Governed route |
|---|---|
| U3 equipment resolution | Select only an admitted CCO, M150/RCO, M4/M4A1 iron, M16-family iron, or later authority-complete branch. Omit all irrelevant sight instruction. An unresolved/mismatched row cannot advance to U4 or live fire. |
| U4 control rehearsal | Render the control identity, click scale, rotation, and observer-view content belonging to the resolved branch, then rejoin at U5. |
| U7 result | If correction is required, route U7 → branch-specific U8 → U9. If evidence is insufficient, return to U6. Only an authoritative confirmed result may route from U9 to U10. |
| U9 not confirmed | New confirmation evidence routes back through U6/U7 and, when another correction is returned, U8/U9. Repeat until confirmed or narrowly held. |

### Universal-specific fail-closed condition

The table's CCO, M150 RCO/TA-01, M4/M4A1, and M16-family rows do not prove every real optic or sight bearing a similar name. Exact control direction, observer view, click scale, installed configuration, and target applicability must resolve before U4 or U8 can issue adjustment instruction.

---

## Baker M4 25 Meter — proposed TSTT map

Product basis: standalone Baker Smart M4 face derived from the M4 side of conventional `ST-M16A2/M4`. The Smart product is single-sided and does not inherit the conventional sheet's M16A2 reverse face.

| Chapter | What it teaches | What the shooter can rehearse | Governing authority/evidence | Firing | TSTT / Tap-n-Score boundary |
|---:|---|---|---|---|---|
| M4-1 — Confirm M4 Target and Equipment | Match the Baker M4 Smart face to the M4/M4A1 carbine with detachable carrying handle and standard front sight post. | Identify the ±21/±8 grid, M4 silhouette, center circle/dot, and installed front/rear controls. | `BAKER_M4_MECHANICAL_AUTHORITY_EVIDENCE.md`; future Baker Smart product/QR and specimen registration. | None | TSTT only; identity/configuration mismatch blocks governed correction. |
| M4-2 — Set the Rear Sight for This Target | For this Baker M4 face, set the rear elevation knob to the 300-meter `6/3` setting and do not use `Z`. | With the firearm safe, locate `6/3`, distinguish it from `Z`, and rehearse returning to the required starting mark. | FM 3-22.9 Change 1, Figure 5-19; Baker printed M4 procedure; Target Authority owns applicability. | None | TSTT teaches the target procedure; Tap-n-Score does not infer starting setup. |
| M4-3 — Understand Aim and Grid | Aim at target center; the ±21 horizontal and ±8 vertical grid supports measured displacement toward the center white dot. | Identify center, practice the intended sight picture, and trace horizontal versus vertical correction axes. | Baker M4 printed face/procedure; FM Figure 5-19; final physical registration required. | None | TSTT only. |
| M4-4 — Rehearse M4 Controls | Front sight post owns elevation at `1.5 MOA/click`; rear windage owns windage at `0.75 MOA/click`, with desired-POI-first observer-normalized directions. | Point to each control and rehearse up/down/right/left physical movement language without choosing a click count. | `M4-IRON-DCH-FSP-ADJUSTMENT-PROFILE-2011`; `BAKER_M4_MECHANICAL_AUTHORITY_EVIDENCE.md`. | None | TSTT presents reusable mechanics; Target Authority will calculate applicability and clicks. |
| M4-5 — Fire the First Group | Fire at 25 meters using the rehearsed setup and declared center aim point. | Rehearse the cease-fire and target-photo sequence before firing. | Baker M4 Target Authority; exact shot-count/group sufficiency remains unresolved. | **First live group** | TSTT stops after the group and offers the governed photo handoff. |
| M4-6 — Add Photo and Precision Tap | Capture the paper, register it, and declare aim and visible impacts. | Practice the tap order and evidence review. | Episode 59 registration and Precision Tap contracts. | None | **Handoff into Tap-n-Score at `ADD PHOTO`.** |
| M4-7 — Measure and Receive Correction | Tap-n-Score measures group center and returns the exact target/configuration correction or a narrow refusal. | Verify the evidence and read desired POI movement before handling the sights. | Backend Target Authority; Baker M4 applicability plus reusable M4 Equipment Authority. | None | Tap-n-Score owns measurement/calculation; TSTT explains the returned package. |
| M4-8 — Apply the Adjustment | Apply the returned front-post elevation and/or rear-windage correction with explicit rotation and observer view. | Pause/replay while safely applying and verifying the exact number of clicks. | Authoritative correction package; `1.5/0.75` Baker M4 mechanics. | None | TSTT supports execution of the returned correction and may not recalculate it. |
| M4-9 — Confirm | Fire a confirmation group, add a new photo, and measure whether the zero relationship is confirmed. | Rehearse the confirmation evidence loop. | Baker target procedure plus future confirmation sufficiency; Tap-n-Score confirmation authority. | **Confirmation group** | Handoff back to Tap-n-Score for photo, Precision Tap, and confirmation result. |
| M4-10 — Preserve | Preserve original evidence, correction, applied adjustment, confirmation evidence, and exact session identity. | Locate SEC, Equipment Profile relationship, Vault record, and exact reopen. | Universal SEC, Equipment Profile, Vault, exact-reopen contracts. | None | Tap-n-Score owns preservation; TSTT closes after truthful save status. |

### M4 adaptive routing

| Decision point | Governed route |
|---|---|
| M4-1 equipment resolution | Current evidence admits the standard M4/M4A1 detachable-carrying-handle/front-sight-post branch. If a different optic/sight configuration is identified, omit M4-2/M4-4 iron-sight instruction and hold correction/live-fire advancement until Target Authority admits an equipment-appropriate branch. |
| Admitted equipment branch | Present only its target-applicable setup and control rehearsal, then rejoin at M4-5. Similar equipment names or reusable mechanics alone do not admit the branch. |
| M4-7 result | If correction is required, route M4-7 → branch-specific M4-8 → M4-9. If evidence is insufficient, return to M4-6. Only an authoritative confirmed result may route from M4-9 to M4-10. |
| M4-9 not confirmed | Route the new evidence through M4-6/M4-7 and repeat adjustment/confirmation as governed. There is no automatic advance after one confirmation group. |

---

## Baker M16A2 25 Meter — proposed TSTT map

Product basis: standalone Baker Smart M16A2 face derived from the M16A2 side of conventional `ST-M16A2/M4`. The Smart product is single-sided and does not inherit the conventional sheet's M4 reverse face.

| Chapter | What it teaches | What the shooter can rehearse | Governing authority/evidence | Firing | TSTT / Tap-n-Score boundary |
|---:|---|---|---|---|---|
| A2-1 — Confirm M16A2 Target and Equipment | Match the Baker M16A2 Smart face to an M16A2 with standard rear sight, rear elevation drum, rear windage knob, and front sight post. | Identify the ±27/±10 grid, M16A2 silhouette, center circle/dot, and all three controls. | `BAKER_M16A2_MECHANICAL_AUTHORITY_EVIDENCE.md`; future Baker Smart product/QR and specimen registration. | None | TSTT only; mismatch blocks governed correction. |
| A2-2 — Prepare the Rear Elevation Drum | The rear elevation drum is a temporary setup control: set 300, then rotate one click past 300 for the 25-meter zero. | With the firearm safe, locate 300 and rehearse one clockwise click viewed from above. | FM 3-22.9 Change 1, Figure 5-19 and Table 5-5; Baker printed procedure; Target Authority owns the one-click-past-300 sequence. | None | TSTT teaches/rehearses setup; it must not present this click as group-elevation correction. |
| A2-3 — Understand Aim and Grid | Aim at target center; the ±27 horizontal and ±10 vertical grid supports displacement measurement toward the center white dot. | Identify center and distinguish horizontal versus vertical axes. | Baker M16A2 printed face/procedure; FM Figure 5-19; final physical registration required. | None | TSTT only. |
| A2-4 — Rehearse Correction Controls | Front sight post—not the rear drum—owns shot-group elevation at `1.25 MOA/click`; rear windage owns windage at `0.5 MOA/click`. | Point to the correct controls and rehearse observer-normalized up/down/right/left movement language. | `M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011`; `BAKER_M16A2_MECHANICAL_AUTHORITY_EVIDENCE.md`. | None | TSTT presents reusable mechanics; Target Authority later calculates clicks. |
| A2-5 — Fire the First Group | Fire at 25 meters with the temporary rear-drum setup and declared center aim point. | Rehearse setup verification, cease fire, and photo sequence. | Baker M16A2 Target Authority; exact shot-count/group sufficiency remains unresolved. | **First live group** | TSTT stops after the group and offers `ADD PHOTO`. |
| A2-6 — Add Photo and Precision Tap | Register the photographed face and declare aim and visible impacts. | Practice the evidence tap/review order. | Episode 59 registration and Precision Tap contracts. | None | **Handoff into Tap-n-Score at `ADD PHOTO`.** |
| A2-7 — Measure and Receive Correction | Tap-n-Score measures group center and returns front-post/rear-windage correction or a narrow refusal. | Read desired POI movement and verify the named control before adjustment. | Backend Target Authority plus resolved M16A2 Equipment Authority. | None | Tap-n-Score owns measurement and correction calculation. |
| A2-8 — Apply the Adjustment | Apply only the returned front-post elevation and rear-windage correction; preserve the rear drum's separate temporary setup state. | Pause/replay while applying the exact clicks and verifying the correct control. | Authoritative correction package; `1.25/0.5` correction mechanics. | None | TSTT explains execution and may not turn the rear drum into a correction control. |
| A2-9 — Confirm | Fire a confirmation group and collect new registered evidence. | Rehearse the confirmation loop before firing. | Baker target procedure plus future confirmation sufficiency; Tap-n-Score confirmation authority. | **Confirmation group** | Handoff back to Tap-n-Score for photo, Precision Tap, and confirmation result. |
| A2-10 — Return the Drum to 300 | After the 25-meter zero is complete, rotate the rear elevation drum one click counterclockwise, viewed from above, back to 300. | Replay while safely performing and visually verifying the final drum position. | FM Figure 5-19/Table 5-5; Baker printed finalization procedure; Target Authority owns timing/applicability. | None | TSTT resumes only after a confirmed completion state; it does not declare confirmation itself. |
| A2-11 — Preserve | Preserve setup, evidence, correction, confirmation, finalization, SEC, equipment relationship, Vault record, and exact reopen identity. | Locate and reopen the saved session. | Universal SEC, Equipment Profile, Vault, exact-reopen contracts. | None | Tap-n-Score owns preservation; TSTT closes after truthful save status. |

### M16A2 adaptive routing

| Decision point | Governed route |
|---|---|
| A2-1 equipment resolution | Current evidence admits the standard M16A2 rear-sight/front-sight-post branch. If a different sight/optic configuration is identified, omit A2-2/A2-4 iron-sight instruction and hold correction/live-fire advancement until Target Authority admits an equipment-appropriate branch. |
| Admitted equipment branch | Present only its target-applicable setup and control rehearsal. The one-click-past-300 setup and later return-to-300 finalization belong only to the admitted standard rear-drum branch. |
| A2-7 result | If correction is required, route A2-7 → branch-specific A2-8 → A2-9. If evidence is insufficient, return to A2-6. A2-10 requires both authoritative confirmation and applicability of the rear-drum finalization step. |
| A2-9 not confirmed | Route the new evidence through A2-6/A2-7 and repeat adjustment/confirmation as governed. Only confirmed status exits the loop to applicable finalization and A2-11. |

## Remaining evidence and authority gaps

### Shared gaps

1. Final standalone Smart product names/SKUs and immutable QR destinations.
2. Baker-approved production artwork and single-sided physical specimens for all three Smart faces.
3. Exact physical registration/UGO evidence and tolerances for each production print.
4. Final chapter completion rules, resume semantics, accessibility behavior, narration scripts, media, and observer-view iconography.
5. Governed safety-language source and its exact relationship to range commands; TSTT must not replace range supervision.
6. Target-specific first-group and confirmation-group shot-count/sufficiency rules.
7. Definition of “confirmed” for each product, including whether and how true-distance confirmation is represented.
8. Evidence contract for recording whether a shooter actually applied an adjustment versus merely received one.
9. Institutional evaluation protocol for elapsed time and instructor intervention, including start/stop events and privacy boundaries.
10. Canonical governed result-state vocabulary and the durable event contract for each loop pass, branch choice, branch change, hold, and exit.
11. Minimum equipment identity/configuration inputs required to select each branch without asking the shooter for unnecessary data.

### Universal MOA gaps

1. Exact conventional side/reverse-side relationship for `ST-Uni25mMOA` and the standalone Smart face selected for production.
2. Authoritative applicability mapping from every printed sight-table row to exact equipment configurations.
3. Control rotation and observer-view authority for the CCO and M150/RCO rows; the printed click values alone are insufficient.
4. Resolution of which configurations use reusable Equipment Authority versus the protected target-scoped M4 authority.
5. Baker physical specimen registration proving the screenshot's same-geometry classification at production scale.
6. Authority-complete branch definitions and applicability tests for every supported Universal table row.

### Baker M4 gaps

1. Final single-sided Smart artwork/specimen and QR identity.
2. Exact production registration and print-tolerance evidence.
3. Target-specific group/confirmation sufficiency and true-distance confirmation contract.
4. Whether any non-standard-carry-handle or optic configuration is applicable to this exact target and, if so, its complete branch authority.

### Baker M16A2 gaps

1. Final single-sided Smart artwork/specimen and QR identity.
2. Exact production registration and print-tolerance evidence.
3. Target-specific group/confirmation sufficiency and true-distance confirmation contract.
4. Evidence/state rule proving the rear drum was returned to 300 after completion.
5. Whether any sight/optic configuration other than the standard M16A2 rear sight is applicable to this exact target and, if so, its complete branch authority and finalization rules.

## Implementation gate

No Target Profile, QR, TSTT runtime, PLAYER control, media, narration, target registration, correction path, Home availability, commercial term, push, or deployment is authorized by this architecture record. A later Founder-approved implementation specification must resolve or explicitly fail closed on the gaps above.
