# Episode 56 Capability Engine Principles

**Status:** Founder locked  
**Date:** August 19, 2026  
**Scope:** Reusable capability-family implementation after the Target Capability Coverage Analysis

## M-011 — Behavioral Primitive Dependency Order

> **Build shared behavioral primitives before higher-order mission executors that depend on them.**

The approved implementation sequence is:

> **Cue/Drill → Qualification → Diagnostic → Decision → Progression → Collection/Hand**

Cue/Drill owns the first reusable stage, cue, ordering, clock-provenance, response-association, reconciliation, transition, and completion primitives. Qualification and Decision may reuse those primitives, but they retain independent authority profiles, executors, result packages, SEC families, and preservation validators.

This principle prevents stage and timing behavior from being hidden inside a qualification-shaped implementation and later extracted or duplicated.

## M-012 — Independent Multi-Capability Resolution

> **Multi-capability does not mean multi-authority execution. One product may expose multiple governed experiences, but each experience resolves and executes independently.**

One registered publisher product may have more than one Target Execution Contract. The exact relationship is selected by:

> **`targetProfileId + missionFamily` → one exact Target Execution Contract**

Consequences:

- one executor must not silently invoke another mission family;
- one result must not merge authority from independently selectable experiences;
- the shooter selects the governed experience before execution;
- backend execution runs only the selected contract;
- SEC and preservation retain the selected mission-family identity and exact contract fingerprint;
- shared implementation primitives do not transfer authority between families.

Examples established by the catalog analysis:

- one Navy Qual product may expose Qualification and Diagnostic as separate experiences;
- one Baker CTQ product may expose Qualification and Cue/Drill as separate experiences;
- choosing Qualification does not authorize diagnostic feedback;
- choosing Cue/Drill does not authorize qualification or pass/fail claims.

## Preserved architectural boundary

These principles extend, and do not alter:

- M-009;
- ADR-001 and the locked Target Execution Contract;
- M-010 Publisher Product Boundary;
- KTIS;
- UGO;
- Session Authority;
- Backend Authority;
- Zeroing Authority isolation;
- Universal SEC;
- immutable preservation and exact reopen.

No application code, authority profile, registration, production state, commit, push, or deployment was changed when these principles were recorded.
