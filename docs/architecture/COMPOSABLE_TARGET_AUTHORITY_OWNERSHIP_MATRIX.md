# Composable Target Authority — Ownership Matrix

**Status:** Architecture Locked
**Runtime effect:** None

This matrix is the single-page authority boundary for [ADR-001 — Composable Target Authority](./decisions/ADR-001_COMPOSABLE_TARGET_AUTHORITY.md).

| Component | Owns | Explicitly does not own |
|---|---|---|
| **Geometry Profile** | Immutable spatial truth; canonical plane; physical dimensions; regions; boundaries; canonical zone IDs; geometric classification; geometric tolerance model | Target identity; manufacturer; lifecycle; scoring labels; points or penalties; mission procedure; evidence provenance; execution permission; presentation |
| **Authoritative Target Profile** | Canonical target identity; manufacturer/product relationship; lifecycle; support and authority status; one compatible Geometry Profile per ATP version; compatible Registration Packages; evidence compatibility; explicit unsupported uses | Numerical scoring semantics; penalties or points; mission procedure; timing; aggregation; official result calculation; presentation |
| **Registration Package** | One exact asset; asset ID and hash; media type; dimensions; coordinate origin and axes; canonical transform; coordinate mapping; tolerances; asset role; registration lifecycle and approval | Target identity creation; geometry definition; scoring; missions; pipeline routing; result calculation; presentation |
| **Scoring Profile** | Numerical interpretation of canonical zone IDs; customer-facing scoring labels; points; penalties; multipliers; score rules; numeric completeness; scoring treatment of governed boundary classifications | Physical geometry; asset identity; coordinate transforms; mission timing or course procedure; execution permission; evidence substitution; presentation |
| **Mission Profile** | Shooter activity; course of fire; expected observations; stage/turn structure; timing; aggregation; completion; mission-specific Result Package contract | Physical geometry; asset registration; zone boundaries; numerical zone authority; pipeline switching; target support status; presentation |
| **Target Execution Contract** | Authorization of one exact versioned ATP + Geometry Profile + Registration Package + Scoring Profile + Mission Profile + Mission Family + Result Package combination; effective dates; support; suspension; revocation; compatibility refusal | Geometry; scoring calculations; mission calculations; evidence capture; client fallback; pipeline selection; presentation |
| **Mission Result Package** | Backend-owned result; applied component identities and versions; observations; classifications; scoring breakdown; totals; completion status; evidence and authority trace | New authority; target registration; component selection; fallback calculations; presentation policy |
| **Universal SEC** | Presentation of a strictly validated mission-specific Result Package; governed evidence display; shooter-facing explanation and actions | Official calculations; geometry classification; scoring; mission aggregation; authority repair; evidence substitution; component authorization; pipeline routing |

## Mandatory refusal rule

The Target Execution Contract returns `authority_unavailable` when any component or binding is:

- unknown;
- incomplete;
- incompatible;
- unapproved;
- mismatched;
- expired;
- suspended;
- revoked; or
- unauthorized for the selected `missionFamily` and `result_package_type`.

No component may silently replace another component, select another pipeline, or manufacture missing authority.

## Constitutional ownership rule

> **No authority component may assume ownership of another component's responsibility. Every authority decision has one—and only one—authoritative owner.**

The platform is composed. Authority is not. Reusable components may participate in an execution, but authority resolves only through one explicit, governed, authorized Target Execution Contract.

## Routing invariant

`missionFamily` remains the sole authority-pipeline switch. The Target Execution Contract authorizes a combination inside the selected Target Authority pipeline; it does not select or change the pipeline.
