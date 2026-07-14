# SCZN3 Universal Shooter Experience Card Architecture

**Version:** 1.0

**Classification:** Authoritative Architecture

**Status:** Architecture Baseline

**Implementation:** Mission-specific; this document authorizes no implementation by itself

## Purpose

The Universal Shooter Experience Card (SEC) is SCZN3's consistent presentation contract for governed shooting results across different disciplines.

GSSF penalty scoring, practical-stage zone scoring, training progression, precision ring scoring, and zeroing do not share one scoring algorithm. They can share one shooter experience because each mission supplies a result package whose authority, identity, evidence, and explanation have already been established before SEC rendering begins.

The Universal SEC is therefore a renderer of governed results, not a universal scoring engine.

## Governing references

This architecture inherits and does not replace:

- [SCZN3 Target Authority — Phase 1](./SCZN3_Target_Authority_Phase1.md)
- [Smart Target Catalog](./SMART_TARGET_CATALOG.md)
- Mission Family Routing governance established by `docs/backend/mission_registry.py` and commit `de27190`
- Governed Target Registry rules established by `docs/backend/target_registry.py` and commit `8e27176`

If this document conflicts with a mission's stricter authority contract, the stricter contract governs.

## Source study

This architecture is founded on `Universal_SEC_Architecture_Four_Targets_Study.docx`, prepared for SCZN3 / Tap-n-Score on July 14, 2026.

Source artifact audit:

```text
Filename: Universal_SEC_Architecture_Four_Targets_Study.docx
SHA-256: d03a57143ec55fd840bc573bcf47a22b6eff14696dd2ad9e31e66d0a79cba6fd
Rendered pages reviewed: 5
```

The study compared GSSF, USPSA/IPSC practice, Dot Torture training, and IBS rimfire scoring. Its central discovery is preserved: scoring models may change while the shooter-facing SEC remains coherent.

## Compatibility review

No governing conflict exists after aligning the study's shorthand with current SCZN3 terminology and support status.

| Authority area | Study language | Architecture alignment | Conflict status |
|---|---|---|---|
| Mission Family Routing | Begins with target selection and ATP | Mission Family must be resolved and authorized before target execution and result selection | No conflict after making the routing gate explicit |
| Authoritative Target Profile (ATP) | ATP changes by target | ATP is a versioned authority contract containing target identity, mission compatibility, result type, scoring reference, evidence model, and registration reference | Compatible; terminology strengthened |
| Registration Package | Not represented | Required for asset-based Target Authority before coordinate classification | No conflict; omitted layer restored |
| Authoritative Shot Package | Referred to generically as an explainable result package | Used where a mission returns per-shot authoritative classifications; other missions return their own registered result-package types | No conflict; result specialization clarified |
| Zeroing Authority isolation | Not addressed | Baker zeroing retains its own mission, geometry, calculation engine, and `zeroCorrectionResult` contract | No conflict; isolation added explicitly |
| Target support status | Four examples are presented together | GSSF AC-1 and Dot Torture have supported registry paths; USPSA and IBS remain conceptual until their authority gaps are closed | No conflict after separating architecture examples from supported execution |

## Architectural principles

1. **One experience does not mean one calculation.** Each Mission Family retains its own scoring or guidance semantics.
2. **The SEC renders; it does not decide.** The frontend does not calculate official scores, classify impacts, repair authority, or infer missing values.
3. **Mission identity comes first.** Mission Family Routing determines which target and result contracts are allowed.
4. **Target authority is explicit.** An ATP and, where required, an approved Registration Package govern target identity, geometry, evidence, and coordinate meaning.
5. **Result packages remain mission-specific.** A penalty result, stage result, precision result, training result, and zeroing correction result are not interchangeable.
6. **Explainability is supplied by authority.** Formulas, classifications, subtotals, shot or bull identifiers, corrections, and stage outcomes originate in the governed result.
7. **Evidence is never substituted.** Missing or invalid evidence produces an unavailable state, not another target image or a plausible placeholder.
8. **Live and saved views preserve the same authority.** A saved record cannot override, broaden, or repair an invalid backend package.
9. **Unsupported targets remain unavailable.** A conceptual SEC example does not grant geometry or scoring authority.
10. **Presentation may adapt without changing meaning.** Responsive layout and discipline-specific explanation modules may vary while identity and result semantics remain intact.

## Universal authority pipeline

```text
Shooter selects an authorized mission and target
        │
        ▼
Mission Family Routing
        │
        ├── validates Mission Family
        ├── validates allowed Result Package type
        └── rejects unsupported combinations
        ▼
Target Authority
        │
        ├── resolves Authoritative Target Profile
        ├── checks lifecycle and support status
        ├── checks geometry and scoring authority
        ├── validates Registration Package when required
        └── binds evidence and observation coordinates
        ▼
Mission-specific backend engine
        │
        ├── classifies or evaluates governed observations
        ├── applies backend-owned rules
        └── creates explanation and authority trace
        ▼
Registered Result Package
        │
        ├── preserves target and mission identity
        ├── preserves evidence provenance
        ├── contains the final governed result
        └── contains mission-appropriate explanation
        ▼
Strict SEC package validation
        │
        ├── valid → Universal SEC rendering
        └── invalid → explicit unavailable state
```

## Relationship to Target Authority

```text
Mission Family
      ↓
Target Authority
      ↓
Result Package
      ↓
Universal SEC
```

### Mission Family

Mission Family states what the shooter is doing. It authorizes a result contract such as `gssfPaperPenaltyResult`, `stageScoreResult`, `marksmanshipTrainingResult`, `precisionScoreResult`, or `zeroCorrectionResult`.

Mission Family Routing prevents a target or saved record from silently entering the wrong calculation engine.

### Target Authority

Target Authority states which target definition may be used and what its observations mean.

The ATP supplies canonical target identity, mission compatibility, result type, authority status, evidence model, and references to scoring and registration authority. For asset-based scoring, the Registration Package binds exact approved asset bytes to dimensions and a coordinate system.

Target Authority does not create a result. It establishes whether the backend has permission and sufficient information to evaluate the observations.

### Result Package

The backend engine returns the result contract authorized for the Mission Family.

For Phase 1 GSSF target authority, the Authoritative Shot Package is the per-shot result specialization: it preserves shot IDs, classifications, scoring buckets, paper penalties, evidence binding, and authority trace. Other missions may use stage, precision, training, or correction packages with different required fields.

The Universal SEC never treats those contracts as interchangeable. It selects a renderer only after strict identity and package validation.

### Universal SEC

The SEC turns a valid mission-specific package into one consistent shooter story:

1. What was the result?
2. How was it produced?
3. Where was performance gained or lost?
4. What target evidence supports it?
5. What session produced it?
6. What can the shooter do next?

Consistency comes from this question order and visual hierarchy—not from flattening all disciplines into the same scoring vocabulary.

## Universal SEC presentation contract

Every supported SEC contains the following semantic regions when the result contract supplies them.

### 1. Result

The final governed result is the primary visual element. Its unit and meaning remain mission-specific: time, points, percentage, stage completion, group/correction, or another registered result.

### 2. Explanation

The SEC displays the backend-provided explanation appropriate to the mission. Examples include:

- timer plus paper penalties equals final time;
- zone values and stage total;
- completed stages and training outcomes;
- bull-by-bull ring values and X-count;
- observed group, point of impact, and correction guidance.

### 3. Performance detail

The result package determines the detail module. It may be a scoring rail, zone ledger, stage progression, bull ledger, group analysis, or correction summary.

Every identifier shown here—shot ID, bull ID, stage ID, or observation ID—must come from the governed package.

### 4. Target evidence

The SEC displays only evidence governed for that session and result. When evidence is missing or invalid, it displays an explicit unavailable state. It never substitutes a different target, generic image, or another mission's evidence.

### 5. Session

The SEC presents compact context needed to understand the result, including target identity, mission, date, equipment, distance, or stage context where those fields are authoritative and relevant.

### 6. Continue

Save, share, history, download, repeat, or next-stage actions remain outside scoring authority. They may act on the governed result but cannot modify its meaning.

## Discipline adapters

An SEC discipline adapter maps a validated result package into the universal presentation contract. It is a renderer selection contract, not a scoring adapter.

### GSSF paper competition

| Contract | Governed value |
|---|---|
| Mission Family | `gssf` |
| Result Package | `gssfPaperPenaltyResult` |
| Primary result | Final time |
| Explanation | Timer + paper penalties = final time |
| Performance detail | Down Zero, +1, +3, and Miss / Other breakdown with backend shot IDs |
| Evidence | Governed GSSF target evidence and marker overlay |
| Current status | GSSF AC-1 has a supported registry path; Phase 1 canonical-asset Target Authority remains implementation pending |

The GSSF SEC preserves formula, subtotal, hits, paper-penalty authority, and authoritative shot attribution. Missing authority is not zero.

### USPSA/IPSC practice target

| Contract | Governed value |
|---|---|
| Mission Family | `practicalStageScore` |
| Result Package | `stageScoreResult` |
| Primary result | Stage result defined by the approved scoring profile |
| Explanation | Mission-approved zone and stage breakdown |
| Performance detail | Governed A/C/D/Miss or other approved classifications |
| Evidence | Target evidence with governed observation identifiers |
| Current status | Conceptual architecture example; current registry authority gaps prevent execution |

This architecture does not approve a classifier, course of fire, hit-factor rule, target geometry, or frontend calculation.

### Dot Torture training

| Contract | Governed value |
|---|---|
| Mission Family | `marksmanshipTraining` |
| Result Package | `marksmanshipTrainingResult` |
| Primary result | Mission-approved training or stage outcome |
| Explanation | Stage requirements, recorded outcomes, completion, and progression supplied by the governed package |
| Performance detail | Stage-by-stage training ledger |
| Evidence | Evidence required by the training profile |
| Current status | Supported registry path exists for the governed Dot Torture variants |

The training SEC may emphasize coaching rather than competition. It still cannot convert manual or client observations into official backend claims unless the result package authorizes them.

### IBS rimfire 100-yard match

| Contract | Governed value |
|---|---|
| Mission Family | `precisionRingScore` |
| Result Package | `precisionScoreResult` |
| Primary result | Precision score and X-count defined by an approved profile |
| Explanation | Bull-by-bull governed ledger |
| Performance detail | Ring value, X classification, lost points, and bull identity |
| Evidence | Evidence mapped to approved bull and ring geometry |
| Current status | Conceptual architecture example; official geometry and scoring authority remain incomplete |

The source study's 25-record-bull example is a presentation study, not current target authority. The existing target-knowledge manifest describes five record bulls per sheet and a possible five-match total of 250-25X while explicitly marking exact ring geometry and rimfire-specific authority as unresolved.

### Baker zeroing

| Contract | Governed value |
|---|---|
| Mission Family | `zeroingCorrection` |
| Result Package | `zeroCorrectionResult` |
| Primary result | Governed correction and confirmation state |
| Explanation | Group, point of impact, correction vector, clicks, and shooter guidance supplied by backend authority |
| Performance detail | Zeroing-specific correction analysis |
| Evidence | Baker target evidence governed by the zeroing session |
| Current status | Existing supported zeroing authority path |

Baker zeroing demonstrates that the Universal SEC can preserve a consistent shooter story without forcing a score onto a correction mission.

## Zeroing Authority isolation

Universal presentation does not create universal routing.

The Baker zeroing path remains isolated by its exact contract:

```text
mission_family == zeroingCorrection
result_package_type == zeroCorrectionResult
```

The Universal SEC may render the valid zeroing result, but it must not:

- send Baker observations through GSSF target classification;
- reinterpret a correction result as points or penalties;
- replace zeroing geometry with a Registration Package from another target;
- infer a zeroing result from another mission's saved fields;
- allow a universal renderer to become a universal scoring function.

Likewise, GSSF, training, practical-stage, and precision missions must not fall through to the Baker engine when their authority is missing or mismatched.

## Result-package selection contract

The Universal SEC selects a discipline adapter only when all required package identity fields agree with the active or saved mission context.

At minimum, selection requires:

- successful authoritative status defined by that result contract;
- backend result source;
- recognized `target_profile_id`;
- recognized `mission_family`;
- the exact result-package type authorized for that Mission Family;
- complete mission-specific required fields;
- governed evidence status;
- no identity mismatch between live/saved context and backend result.

If selection fails, the SEC displays an explicit unavailable state. It does not choose a generic renderer capable of making malformed data look believable.

## Supported, conceptual, and unavailable states

The four-target study demonstrates architectural range. It does not activate all four targets.

| Study target | Architecture role | Current authority interpretation |
|---|---|---|
| GSSF AC-1 | Proven penalty-result SEC and Phase 1 Target Authority seed | Supported GSSF result path; canonical-asset Phase 1 implementation pending |
| USPSA/IPSC practice | Practical-stage adapter study | Research/conceptual until target, course, geometry, and scoring authority are confirmed |
| Dot Torture | Training-progression adapter | Supported governed variants exist; renderer must respect the actual package semantics |
| IBS rimfire 100 yard | Precision-ledger adapter study | Research/conceptual until official geometry and scoring authority are confirmed |

An unavailable target may be documented, researched, and designed. It may not produce an authoritative SEC result.

## Live and saved parity

The Universal SEC contract applies equally to live and saved rendering:

1. Both flows validate the same target, mission, result type, and authority source.
2. Both flows use the same discipline adapter for the same valid package.
3. Saved fields cannot override invalid backend authority.
4. Saved evidence cannot substitute a different target.
5. Historical rendering preserves the target and package version under which the session was created.

## Failure behavior

The Universal SEC must render an explicit unavailable state when required authority is missing, malformed, unknown, duplicated, mismatched, revoked, or unsupported.

It must never:

- calculate a fallback score;
- treat missing numeric authority as zero;
- fabricate classifications or identifiers;
- select a renderer from target appearance alone;
- convert an unknown zone into a known category;
- substitute evidence;
- use one Mission Family's package to satisfy another;
- imply that a conceptual target adapter is implemented.

## Implementation boundary

This document establishes a presentation and package-selection architecture only.

It does not authorize:

- new scoring engines;
- new target geometry;
- changes to GSSF calculations;
- changes to Baker zeroing;
- activation of USPSA/IPSC or IBS scoring;
- changes to existing backend contracts;
- generic client-side scoring;
- automatic target or shot recognition.

Each discipline requires its own approved ATP, authority completeness, registered result type, backend behavior, executable governance, and visual acceptance before its adapter can be considered supported.

## Architecture conclusion

The Universal SEC is the stable shooter-facing end of a governed chain:

```text
Mission Family → Target Authority → Result Package → Universal SEC
```

The Mission Family defines the job. Target Authority defines what may be evaluated. The backend Result Package defines what is true and why. The Universal SEC makes that truth understandable without changing it.

That separation allows SCZN3 to deliver one recognizable shooter experience across supported disciplines while preserving the distinct rules, evidence, and authority of every mission.

## Version history

| Version | Status | Summary |
|---|---|---|
| 1.0 | Architecture Baseline | Incorporates the four-target Universal SEC study into current Mission Family, Target Authority, Result Package, evidence, and zeroing-isolation governance. |
