# SCZN3 Episode Reconciliation Report

**Audit date:** 2026-08-06

**Scope:** Episode 1 through the latest locked production checkpoint
**Authoritative owner created:** `EPISODE_REGISTRY.json`

## Evidence reviewed

- SCZN3 Episode Index and History Index
- Milestone and Snapshot indexes
- Episode checkpoint records and manifests
- Archive directories and restore records
- ZIP archives and adjacent SHA-256 records
- README and architecture references
- Git history, tags, and commit subjects
- Netlify and Render deployment identities preserved in release checkpoints

## Reconciliation findings

### Missing episode records

No authoritative episode assignment was found for Episodes **1–26, 28, 29, or 34**. These numbers are now reserved as `historical-unresolved`. They are not available for new work.

The Milestone Index contains evidence for early work including the Stable Zeroing Pipeline, Backend Authority, Mission Family Routing, Governed Target Registry, Active Calculation Context, Explainable Scoring, and Universal SEC Architecture. The same index explicitly marks their episode numbers `Needs Review`; the audit therefore did not invent assignments.

### Invalid fractional episode

Commit `640fa1f0ce6fe3e754d2a8e5a8baf3938d46f535` says `Complete Episode 31.5 — Protect and Polish`. Fractional episode numbers violate the continuous integer sequence. The corrected registry assigns **Episode 31 — Protect and Polish** and preserves `Episode 31.5` as a legacy alias.

### Episode 35 title conflict

The Episode Index and canonical roadmap call Episode 35 **The Smart Target Integration Roadmap**. Its archive calls it **Refinement & Validation**. The registry retains the roadmap title as authoritative and records Refinement & Validation as the checkpoint/legacy subtitle.

### Episode 45 duplicate assignments

Episode 45 was used for:

- Smart QR Identity Checkpoint;
- Authority Provenance;
- The Ballistic Vault;
- the August 2 Smart Target Ecosystem Production Baseline.

The authoritative Episode Index identifies **Episode 45 — The Ballistic Vault** as Founder Approved, Locked, Archived, and Checkpointed. Smart QR Identity and Authority Provenance are retained as related Episode 45 checkpoint artifacts. The later August 2 production baseline is reassigned chronologically below.

### Episode 46 cross-reference conflict

The Authority Provenance record announces `Episode 46 — Smart Target Geometry Preservation`. The authoritative Episode Index and Founder Snapshot 001 assign **Episode 46 — Experience Frame Architecture**. The registry preserves Experience Frame Architecture as authoritative and retains Smart Target Geometry Preservation as a legacy planned-workstream reference, not a second Episode 46.

### Episode Index omissions

Evidence-backed records exist for Episodes 33, 38, 39, 40, and 43, but the former Episode Index table omitted them. The Episode Registry now includes them without promoting their documented Founder-review or draft status.

### Backward numbering after Episode 47

The authoritative record already contained Episodes 45, 46, and 47 when later production artifacts reused Episodes 44 and 45:

| Date | Historical artifact | Conflict | Corrected owner |
|---|---|---|---|
| 2026-07-31 | `V1_0_CANONICAL_ZEROING_SOP_DEPLOYMENT_BASELINE_0731` | Production checkpoint had no episode owner | Episode 48 |
| 2026-08-01 | `SCZN3_EP44_SMART_TARGET_ECOSYSTEM_BASELINE_2026-08-01` | Reused Episode 44 after Episodes 45–47 existed | Episode 49 |
| 2026-08-02 | `EPISODE45_SMART_TARGET_ECOSYSTEM_PRODUCTION_BASELINE_2026-08-02` | Reused locked Episode 45 | Episode 50 |
| 2026-08-05 | `SCZN3_EP44_BACKEND_SESSION_AUTHORITY_FINAL_2026-08-05` | Reused Episode 44 again | Episode 51 |

This August 1 artifact is the first confirmed point where release numbering moved backward. The August 2 and August 5 checkpoints continued the divergence.

### Snapshot review

The committed Snapshot Index contains Snapshots 1–4 with unique identities. No authoritative Snapshot 10 record exists. Snapshot numbering is separate from episode numbering and does not establish an episode.

### ZIP and archive conflicts

The following immutable historical ZIP names carry incorrect or missing episode ownership:

- `V1_0_CANONICAL_ZEROING_SOP_DEPLOYMENT_BASELINE_0731.zip` → Episode 48
- `SCZN3_EP44_SMART_TARGET_ECOSYSTEM_BASELINE_2026-08-01.zip` → Episode 49
- `EPISODE45_SMART_TARGET_ECOSYSTEM_PRODUCTION_BASELINE_2026-08-02.zip` → Episode 50
- `SCZN3_EP44_BACKEND_SESSION_AUTHORITY_FINAL_2026-08-05.zip` → Episode 51

Their original checksums and names remain historical evidence. The registry owns the corrected canonical identities and records the originals as aliases.

## Corrected authoritative sequence

| Episode | Authoritative title | Status |
|---:|---|---|
| 1–26 | Unresolved historical slots | Reserved; evidence required |
| 27 | Target Authority Phase 1 Architecture Lock | Architecture locked |
| 28–29 | Unresolved historical slots | Reserved; evidence required |
| 30 | Composable Target Authority | Architecture locked |
| 31 | Protect and Polish | Closed; legacy alias `31.5` |
| 32 | Founder Polish: Analytics Reset | Locked |
| 33 | Build Week Founder Submission | Story locked |
| 34 | Unresolved historical slot | Reserved; evidence required |
| 35 | The Smart Target Integration Roadmap | Architecture locked |
| 36 | Authority Conversion Governance | Documentation closed |
| 37 | KEY TO THE VAULT | Architecture locked |
| 38 | Universal Practice Authority Foundation | Founder-review draft |
| 39 | Universal Practice SEC V1.1 Implementation Review | Founder review |
| 40 | M4 Smart Target SEC V1.1 Implementation Review | Founder review |
| 41 | Document the M4 | Documentation complete for Founder review |
| 42 | Military Shooter Experience Card Design System | Architecture locked |
| 43 | M4 Smart Target Prototype | Founder-review prototype |
| 44 | Authoritative Army M4 Physical Artifact | Founder-approved planning |
| 45 | The Ballistic Vault | Locked |
| 46 | Experience Frame Architecture | Architecture locked |
| 47 | Experience Frame Mobile Architecture | Architecture locked |
| 48 | V1.0 Canonical Zeroing SOP Deployment Baseline | Locked |
| 49 | Smart Target Ecosystem Baseline | Locked |
| 50 | Smart Target Ecosystem Production Baseline | Locked |
| 51 | Backend Session Authority Final | Locked |

There is **no active episode**. The next available number is **Episode 52**, but it cannot be created until the Founder assigns its title and scope through the registry.

## Minimum consistency changes

1. Make `EPISODE_REGISTRY.json` the only authority for episode number, title, and status.
2. Convert the former Episode Index and History Index into generated or explicitly non-authoritative projections of the registry.
3. Preserve incorrect historical artifacts unchanged and add registry-owned canonical aliases for Episodes 48–51.
4. Add supersession notes to the Episode 31.5 commit reference, Episode 35 alternate title, Episode 45 subsidiary checkpoint titles, and Episode 46 geometry-preservation reference.
5. Do not rewrite Git history, signed tags, ZIP contents, or existing checksums.
6. Require `validate_episode_registry.mjs` to pass before checkpoint creation, ZIP creation, release announcement, or production designation.
7. Create future archive and release names from the registry entry rather than free-form text.

## Permanent rule

> **No episode may be created until the previous episode has been authoritatively closed.**

This rule and its validation gates are defined in `EPISODE_GOVERNANCE.md`.
