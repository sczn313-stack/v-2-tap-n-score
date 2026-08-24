# Founder Gate 2 — MC9 PRIME + Glock Gen6 Data-Only Admission Pilot

**Result:** PASS  
**Date:** 2026-08-24  
**Contract:** `sczn3-equipment-knowledge-v1.1`

## Acceptance rule

> Admit both through governed data. Let the existing Equipment Library inherit them. No manufacturer-, model-, SKU-, or military-specific production branches.

## Data admitted

- Canik METE MC9 PRIME, 9mm
- Glock G17 Gen6, 9mm
- Glock G19 Gen6, 9mm
- Glock G45 Gen6, 9mm

The official Glock launch establishes all three initial Gen6 models, so the Glock subject was admitted as the complete evidenced launch set rather than one selectively chosen example.

## Reusable path proven

1. Canonical evidence-bearing records live in `docs/backend/registries/equipment_knowledge_registry.json`.
2. A read-only browser projection supplies identity and shooter-facing presentation data through `docs/equipment_knowledge_registry.js`.
3. The generic catalog composer merges registered records into the existing searchable Equipment Library without inspecting product identity.
4. The saved Equipment Profile preserves authority record ID, configuration ID, entity type, schema ID, and registry version.
5. Session Authority resolves the canonical backend record, overwrites catalog identity from authority, carries the record's facts and relationships into the normalized authoritative equipment package, and rejects mismatched claims.

## Shooter result

At 390px the shooter can:

- choose Pistol;
- choose Canik or Glock;
- search `Prime` or `Gen6`;
- select the exact model;
- save it once;
- reload and reopen it exactly;
- make it active;
- allow an applicable target experience to consume it without re-entry.

MC9 PRIME receives its established 3.64-inch barrel fact automatically. Gen6 barrel length and sight radius remain blank because the admitted Gen6 launch/optic sources do not establish those generation-specific dimensions. SCZN3 does not inherit Gen5 dimensions by assumption and does not ask for them unless an experience materially needs them.

## Authority result

- Every admitted fact and relationship carries its own evidence envelope.
- MC9 PRIME optic compatibility and the documented MO4 fastener relationship are preserved.
- Glock Gen6 optic-ready-system relationships are preserved.
- Browser assertions cannot manufacture catalog authority.
- Unknown record IDs and exact-identity mismatches fail closed.

## Zero-branch audit

The pilot product names and configuration IDs appear in governed registry data, evidence, and tests only. They do not appear in `matrix.html`, `app_state.js`, or `backend/session_authority.py` production routing.

No manufacturer-, model-, SKU-, target-, or military-specific application branch was created for the pilot.

## Validation

- Canonical registry JSON and browser-projection parity: PASS
- Fact/relationship envelope completeness: PASS
- Four unique record/configuration identities: PASS
- Product-specific production-routing audit: PASS
- Backend canonical resolution and tampering refusal: PASS
- Session Authority regression: 19/19 PASS
- MC9 PRIME + Gen6 390px find/select/save/reload/exact-reopen/inherit: PASS
- Existing Episode 58 Equipment Library browser suite: PASS
- Universal Equipment routing: PASS
- Existing Smart Target workspace desktop/mobile regressions: PASS
- Site build: PASS, 338 public files

## Boundary

This is a local validated Episode 58 candidate. No commit, push, deployment, snapshot, or episode closure is authorized by the pilot.

