# Episode 27 Platform Roadmap

## Smart Target Catalog

**Roadmap status:** Proposed

**Architecture baseline:** [Smart Target Catalog Version 1.0](../architecture/SMART_TARGET_CATALOG.md)

**Checkpoint type:** Platform architecture and implementation planning

## Objective

Episode 27 establishes the first executable Smart Target Catalog capability without weakening the authority boundaries already proven by SCZN3 missions.

The episode converts the permanent catalog architecture into an incremental delivery plan for target identity, manufacturer and printer participation, governed QR routing, SEC inheritance, tutoring, analytics, and partner onboarding.

## Success definition

Episode 27 is complete when SCZN3 can register, review, publish, resolve, and retire a versioned Smart Target through governed contracts, and when an approved QR route can carry a shooter into the correct target experience without embedding or fabricating authority.

## Non-goals

- Rewriting existing backend scoring engines
- Moving scoring calculations into clients
- Replacing mission or result-package registries
- Migrating every historical target in one release
- Building a public partner marketplace before catalog governance exists
- Treating QR payloads as trusted scoring or session data
- Allowing manufacturer metadata to grant scoring authority

## Workstreams

### 1. Catalog schema and persistence

**Deliverables**

- Canonical catalog-record schema
- Version and lifecycle model
- Manufacturer, print artifact, and QR route relationships
- Immutable publication semantics
- Audit metadata and change history

**Exit criteria**

- Invalid identities and illegal lifecycle transitions are rejected.
- Published versions cannot be silently mutated.
- Historical versions remain resolvable for saved sessions.

### 2. Catalog authority service

**Deliverables**

- Create, review, publish, suspend, supersede, retire, and resolve operations
- Mission/result-package compatibility checks
- Explicit unavailable responses
- Registry integration without duplicated authority

**Exit criteria**

- No client or partner payload can activate an unauthorized target.
- Missing or mismatched authority never produces a believable fallback.
- Contract tests cover valid, invalid, suspended, and historical resolution.

### 3. QR identity and routing

**Deliverables**

- Minimal governed QR payload format
- Resolver endpoint or service contract
- Target/version/action binding
- Revocation and unavailable behavior
- Routing telemetry that excludes private session data

**Exit criteria**

- Approved QR codes resolve to the intended versioned experience.
- Unknown, expired, altered, or revoked routes fail explicitly.
- QR content contains no scoring rules or trusted results.

### 4. Manufacturer and printer onboarding

**Deliverables**

- Partner identity and approval workflow
- Specification submission template
- Print-artifact validation checklist
- Tolerance and calibration evidence requirements
- Licensing, trademark, and support ownership fields

**Exit criteria**

- A pilot partner can submit an artifact without receiving scoring authority.
- Approved print output is traceable to a catalog version.
- Rejected or expired partner artifacts cannot resolve as active targets.

### 5. Shooter entry experience

**Deliverables**

- QR-to-target entry flow
- Catalog-backed target details
- Mission selection limited to authorized compatibility
- Explicit unavailable and support states

**Exit criteria**

- The shooter reaches the correct governed target with minimal friction.
- Unsupported mission combinations cannot be selected or fabricated.
- Customer language remains clear and free of developer terminology.

### 6. SEC inheritance

**Deliverables**

- Catalog identity and version in saved session context
- Governed target evidence selection
- Catalog-aware SEC presentation
- Historical rendering rules

**Exit criteria**

- Live and saved experiences preserve the same target identity.
- Saved fields cannot override invalid backend or catalog authority.
- Missing evidence never substitutes a different target.

### 7. Tutoring and analytics contracts

**Deliverables**

- Catalog-aware tutoring input contract
- Analytics dimensions for target identity, version, mission, and result package
- Privacy and retention boundaries
- Aggregation rules that prevent incompatible-result mixing

**Exit criteria**

- Tutoring consumes governed classifications rather than inventing scores.
- Analytics can distinguish versions and mission contexts.
- Private evidence and session data are excluded unless explicitly authorized.

### 8. Operations and governance

**Deliverables**

- Publication approval checklist
- Suspension and incident procedure
- Version migration guidance
- Monitoring for resolution failures and invalid routes
- Architecture change-control workflow

**Exit criteria**

- Every published target has a named owner and support path.
- Suspension stops new use without corrupting history.
- Architecture and catalog changes are auditable.

## Recommended implementation order

1. Approve the catalog schema and lifecycle.
2. Build read-only catalog resolution with unavailable behavior.
3. Register existing governed targets as seed records.
4. Add publication and audit workflows.
5. Define and validate governed QR routing.
6. Pilot one manufacturer or printer onboarding path.
7. Connect shooter entry and SEC inheritance.
8. Add tutoring and analytics contracts.
9. Complete operational controls and production acceptance.

## Seed-target strategy

Use existing governed targets to prove the catalog without changing their scoring engines. Seed adoption should verify that catalog identity references current mission, target, and result-package authority rather than duplicating it.

Suggested sequence:

1. A fully governed existing target with mature backend and SEC coverage
2. A governed training target with manual or mixed result semantics
3. A partner-produced print artifact
4. A QR-distributed target with catalog routing

## Required test layers

- Schema and lifecycle unit tests
- Catalog authority contract tests
- Mission/result-package compatibility governance
- QR tamper, revocation, and unavailable tests
- Partner artifact identity tests
- Live/saved SEC parity
- Evidence non-substitution tests
- Historical-version rendering tests
- Mobile and desktop entry-flow tests
- End-to-end pilot acceptance

## Decision log

| Decision | Rationale |
|---|---|
| Maintain a permanent architecture document separate from the episode roadmap | The catalog will outlive any implementation episode. |
| Treat targets as versioned identities rather than image assets | Identity must survive print, QR, scoring, evidence, SEC, and analytics handoffs. |
| Keep scoring authority in existing backend profiles and registries | Prevents duplicate rules and client-side authority drift. |
| Make QR codes resolve through a governed service | Allows validation, revocation, and explicit unavailable behavior. |
| Onboard manufacturers and printers through contracts | Commercial participation must not bypass platform governance. |

## Completion checkpoint

At the end of Episode 27, update this roadmap with delivered artifacts, deferred work, test evidence, and the next episode boundary. Update the permanent architecture only when the governing model itself changes.
