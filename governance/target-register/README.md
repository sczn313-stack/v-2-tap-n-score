# SCZN3 Target Register — Founder review proposal
Created: 2026-10-10
Status: **PROPOSED / NOT AUTHORITATIVE UNTIL RECONCILED AND FOUNDER ACCEPTED**

## Purpose
Durably answer: how many FA targets, which are the latest 10 FA targets, what SCZN3 knows about each target, and what evidence proves those answers. This is a **register/index**, not a replacement for existing Backend Authority or target files.

## Current known context (not audit results)
- Founder-stated governing population: **1,993 shootable paper targets across THE 13**.
- Number of Founder Approved (FA) targets: **UNKNOWN / NOT VERIFIED**.
- Last ten FA targets: **UNKNOWN / NOT VERIFIED**.
- Do not count representative acceptance as approval of an entire family unless the Founder-approved scope explicitly says so.
- Preserve both old historical and governing target datasets; do not delete or merge either.
- No target records or approval statuses have been modified by this proposal.

## Required row per target (see TARGET_REGISTER.csv)
Each canonical target ID references its existing backend authoritative file. No new targets may be invented. Fields:
- target_id, printer, canonical_record_uri, governing_dataset, identity_source
- fa_status (APPROVED | NOT_APPROVED | PENDING | UNKNOWN), fa_scope, founder_decision_at, founder_evidence_uri
- description_uri, geometry_authority_uri, provenance_uri
- reconciliation_status (VERIFIED | MISMATCH | MISSING | UNREVIEWED), last_verified_at, record_commit
No status becomes APPROVED solely from a verbal assistant summary or a passed execution test.

## Preservation and reconciliation
1. Discover **current live backend** and governing target dataset; this GitHub repository may be only a mirror or legacy deployment. Verify before treating it as source of truth.
2. Read-only enumerate the 1,993 governed IDs, retaining historical datasets separately.
3. Identify Founder approval events with date, scope and primary evidence. Unknown is never silently zero.
4. Reconcile one-to-one IDs and detect duplicates, deleted links and conflicting decisions.
5. Export register deterministically from canonical target records and verified approval event sources; prefer generation over hand-maintained totals.
6. Compute FA total from APPROVED rows **only after complete reconciliation** and latest ten from verified approval timestamps (explicit tie-break by ID).
7. Require automated checks: unique IDs, valid source URIs, approved status evidence, counts reconciled, data provenance and no overwritten canonical records.
8. Founder reviews the report. Only then mark a report authoritative and cite snapshot commit, backend dataset version and timestamp.
9. Each subsequent Founder approval updates its canonical record/approval evidence first, then regenerates the index; uncommitted conversational instructions are not represented as persisted.
10. Never promote image pixels to physical geometry authority. Backend authoritative physical geometry rules.

## Knowledge retention contract
Founder decisions become durable only after: capture exact directive + scope + provenance -> write to correct existing authority location -> read back -> verify -> record revision/commit -> make retrievable by ID and keyword. If a decision cannot be stored, say 'NOT PERSISTED'. ChatGPT's model weights are not updated by conversations. Do not conflate conversational memory with permanent storage.

## Immediate audit outputs still owed
- actual backend source of truth
- exact enumerated 1,993 target IDs and reconciliation
- verified FA count
- last ten FA IDs with approval date and evidence
- identified outstanding/contradictory statuses

This proposal is deliberately **not** an assertion that the register is populated or that its location is production authority.
