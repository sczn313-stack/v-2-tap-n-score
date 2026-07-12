# Smart Target Catalog

**Version:** 1.0

**Classification:** Authoritative Architecture

**Status:** Living Document

## Purpose

The Smart Target Catalog is the permanent operating architecture for how SCZN3 defines, governs, distributes, resolves, and evolves Smart Targets™.

It establishes a shared contract for shooters, target manufacturers, printers, match and training partners, QR routing, scoring services, Shooter Experience Cards (SECs), tutoring, analytics, and future platform clients. Implementation roadmaps may change; the authority boundaries in this document remain the stable foundation.

## Architectural principles

1. **A target is an identity, not an image.** A printable or displayed image is evidence of a governed catalog entry, never the entry itself.
2. **Authority is explicit.** A target cannot silently acquire scoring, mission, evidence, or routing authority from client-provided fields.
3. **Missing authority is unavailable, not zero.** Incomplete or invalid catalog data must not produce a believable result.
4. **Backend-owned rules remain backend-owned.** Scoring zones, penalties, classifications, result-package types, and target contracts are resolved by authoritative services.
5. **Presentation does not invent meaning.** Clients display governed results and evidence without fallback calculations, substitute targets, or fabricated identifiers.
6. **Identity survives every handoff.** Print, QR, session, evidence, result package, SEC, and analytics records must remain traceable to the same catalog identity.
7. **Versioned definitions are immutable in use.** Published versions may be superseded, but historical sessions continue to resolve against the version under which they were created.
8. **Partners integrate through contracts.** Manufacturer and printer participation does not bypass catalog validation or platform governance.

## Catalog identity

Every Smart Target requires a stable, globally unique catalog identity. At minimum, the identity model includes:

- `target_profile_id`: canonical machine identity.
- `catalog_version`: immutable published definition version.
- `target_family`: governed family or lineage.
- `mission_family`: authorized mission context.
- `result_package_type`: authorized backend result contract.
- `authority_status`: draft, review, published, suspended, retired, or unavailable.
- `manufacturer_id`: governed source organization when applicable.
- `print_artifact_id`: versioned printable artifact identity when applicable.
- `qr_route_id`: governed routing identity when applicable.

Human-facing names, marketing names, filenames, URLs, and QR payload text are attributes. None may replace canonical identity.

## Core catalog record

A published catalog record is a governed package composed of the following domains.

### Identity

- Canonical target profile and version
- Display name and target family
- Manufacturer or SCZN3 ownership
- Lifecycle status and effective dates

### Physical specification

- Authoritative dimensions and orientation
- Printable geometry and calibration references
- Material, color, and production constraints
- Required registration or measurement marks
- Approved print tolerances

### Mission compatibility

- Authorized mission families
- Supported distances, courses, stages, or drills
- Required session context
- Explicit unsupported uses

### Scoring authority

- Backend scoring profile reference
- Zone identities and classification semantics
- Penalty or point authority references
- Authorized result-package types
- Required evidence and completeness rules

Scoring values belong to their authoritative profiles. The catalog references those profiles; it does not create competing copies.

### Evidence contract

- Accepted evidence types and formats
- Image-orientation and calibration requirements
- Marker-overlay coordinate contract
- Evidence retention and provenance requirements
- Explicit unavailable behavior

### Routing contract

- Governed QR route identity
- Allowed destinations and platform actions
- Target and version binding
- Expiration, replacement, and revocation behavior
- Offline or unresolved behavior

### Commercial and partner metadata

- Manufacturer and printer relationships
- Product identifiers and fulfillment references
- Geographic or channel availability
- Licensing and trademark requirements
- Support and escalation ownership

Commercial metadata never grants scoring or mission authority.

## Lifecycle

```text
Proposed
   ↓
Draft specification
   ↓
Authority review
   ↓
Prototype and validation
   ↓
Published catalog version
   ↓
Active distribution and resolution
   ↓
Superseded, suspended, or retired
```

### Proposed

A candidate target has a sponsor and business purpose but no executable authority.

### Draft specification

Identity, physical geometry, mission compatibility, evidence, routing, and partner metadata are assembled. Drafts must resolve as unavailable outside approved development environments.

### Authority review

The target is checked for identity uniqueness, scoring ownership, result-package compatibility, evidence integrity, print fidelity, and routing safety.

### Prototype and validation

Physical artifacts, QR routes, backend results, SEC rendering, and invalid-data behavior are exercised together. Prototype success does not itself publish the target.

### Published

A specific immutable version becomes resolvable. Publication requires named ownership, executable tests, and an auditable approval record.

### Superseded, suspended, or retired

New sessions may be prevented while historical records retain their original identity and rendering semantics. Revocation must never silently redirect to another target.

## Authority boundaries

| Domain | Authoritative owner | Client responsibility |
|---|---|---|
| Target identity and version | Smart Target Catalog | Request and preserve identity |
| Scoring rules and classifications | Backend scoring profile | Display governed results |
| Mission compatibility | Catalog and mission registry | Prevent unsupported selection |
| Result-package authorization | Mission/result registries | Validate before rendering |
| Evidence provenance | Session/evidence contract | Capture and display governed evidence |
| QR resolution | Governed routing service | Navigate only resolved routes |
| SEC data | Backend result and saved session | Present without fallback scoring |
| Commercial metadata | Catalog partner record | Display approved product information |

No client field, QR parameter, filename, saved-record override, or partner payload may silently cross these boundaries.

## QR architecture

A Smart Target QR is a governed entry point, not a raw destination URL. Resolution must:

1. Parse a minimal route identity.
2. Resolve it through the catalog.
3. Confirm target status and version.
4. Confirm the requested mission or action is authorized.
5. Produce a governed platform route.
6. Return an explicit unavailable state when resolution fails.

QR codes must not embed scoring rules, trusted result data, private session data, or mutable authority claims.

## Manufacturer and printer onboarding

Partners enter through a governed onboarding process:

1. Establish organization identity and accountable contacts.
2. Define ownership, licensing, and support responsibilities.
3. Submit physical and digital target specifications.
4. Validate print artifacts against catalog geometry and tolerances.
5. Bind product identifiers and QR routes to an approved catalog version.
6. Complete scoring, evidence, SEC, routing, and failure-state validation.
7. Publish only after SCZN3 authority review.

A printer may manufacture an approved artifact. It does not own scoring authority unless a separate governed contract explicitly grants that role.

## SEC, tutoring, and analytics inheritance

Downstream experiences inherit catalog identity rather than reconstructing it.

- **SEC:** displays the governed target, result package, evidence, and session context associated with the resolved catalog version.
- **Tutoring:** uses authorized target geometry and backend classifications; it does not reinterpret raw marks into competing scores.
- **Analytics:** aggregates by canonical target identity and version, while preserving mission and result-package boundaries.
- **History:** continues to render against the saved authority package and catalog version even after a newer version is published.

## Failure behavior

The platform must render an explicit unavailable state when any required identity or authority component is missing, malformed, mismatched, unknown, duplicated, revoked, or unsupported.

It must never:

- substitute another target image;
- infer a mission from visual similarity;
- convert unknown scoring zones into known zones;
- treat missing numeric authority as zero;
- accept partner or client fields as backend results;
- redirect an unresolved QR to a believable generic experience.

## Governance and change control

Changes to this architecture require:

1. A documented reason and affected authority domains.
2. Compatibility analysis for published targets and saved sessions.
3. Executable governance or contract coverage where behavior changes.
4. Version increment and change-log entry.
5. Approval by the accountable SCZN3 architecture owner.

### Versioning policy

- **Major:** authority model or compatibility-breaking change.
- **Minor:** backward-compatible capability or lifecycle expansion.
- **Patch:** clarification that does not change contracts or behavior.

## Version history

| Version | Status | Summary |
|---|---|---|
| 1.0 | Living Document | Establishes the Smart Target Catalog identity, lifecycle, authority boundaries, QR architecture, partner onboarding, and downstream inheritance model. |
