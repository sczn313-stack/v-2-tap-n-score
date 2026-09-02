# M/FAM Target Family Contract

Date: 2026-09-02  
Status: Founder Approved / architecture locked / implementation pending

## Purpose

M/FAM is the reusable SCZN3 family for M4/M16 Talking Smart Targets. It owns universal capability and an exact admission contract. It does not own or supply inherited target geometry, product identity, sight configuration, or mechanical defaults.

> **M/FAM owns reusable capability, never inherited geometry or mechanical defaults.**

The governed relationship is:

> **Publisher Product → Exact Face → Physical Geometry → Representation Variant → Weapon/Sight Configuration → Mechanical Authority → QR Identity → Talking Language → Governed Road**

## Contract

| Layer | Required truth | Boundary |
|---|---|---|
| Publisher Product | Publisher, commercial product identity, sheet identity, provenance, and SKU when available | Matching geometry never merges publisher products. |
| Exact Face | Specific side, printed title, instructions, and intended shooter | One two-sided sheet may produce two independent Smart Target identities. |
| Physical Geometry | Measured dimensions, scale, landmarks, grid, and versioned geometry identity | Enlarging or rescaling creates new geometry and requires separate authority validation. |
| Representation Variant | Color, ink, print treatment, photograph, scan, and harmless crop differences | A variant may share geometry only after registration proves the same landmarks and physical scale. |
| Weapon/Sight Configuration | Exact weapon, sight system, zeroing setting, and adjustable controls | Related weapons or sights do not inherit one another's mechanics by resemblance. |
| Mechanical Authority | Per-control click value, unit, observer view, rotation, resulting POI movement, purpose, applicability, and primary evidence | Authority is selected by exact face plus exact configuration. M/FAM has no family default. |
| QR Identity | Immutable destination for the exact publisher product and face | QR identity resolves the Target Profile; appearance does not choose identity. |
| Talking Language | Face- and configuration-specific setup, correction, confirmation, and printed terminology | A target inherits the PLAYER, not another target's nouns, procedures, or mechanics. |
| Governed Road | QR → Target Profile → registration → setup → shot group → correction → confirmation → SEC → Vault → exact reopen | Universal capability is inherited; exact authority is injected only after identity resolution. |

## Mechanical-language convention

Every physical-control instruction must communicate:

> **Desired POI movement first → physical control → rotation → explicit observer view.**

`clockwise` and `counterclockwise` are invalid on their own. A governed mechanical instruction records:

- desired point-of-impact movement;
- named physical control;
- rotation;
- observer position and viewing axis;
- whether the operation is correction, temporary setup, or finalization.

Examples:

- **Move impact UP:** rotate the front sight post clockwise, viewed from above.
- **Move impact RIGHT:** rotate the rear windage knob clockwise, viewed squarely at the exposed right-side knob face.
- **M16A2 temporary setup:** rotate the rear elevation drum clockwise, viewed from above, to one click past 300; after zeroing, rotate it counterclockwise one click back to 300.

The M16A2 rear elevation drum step is setup/finalization, not shot-group elevation correction.

## Initial family members

| Product identity | Face/configuration | Mechanical authority | Status |
|---|---|---|---|
| Fort Benning M4/M16 | Existing `m4_25m_zero`; standard M4/M4A1 front sight post and detachable carrying handle | `1.75 MOA` elevation / `0.75 MOA` windage; exact target-scoped Victory #2 authority | Locked and Founder Approved; not reopened by this contract |
| Baker M4 | M4 face; ±21/±8 geometry; 300-meter `6/3` setting; do not use `Z` | `1.5 MOA` front-sight elevation / `0.75 MOA` rear windage | Authority closed; profile implementation pending |
| Baker M16A2 | M16A2 face; ±27/±10 geometry; 300 plus one click setup, then return one click to 300 | `1.25 MOA` front-sight elevation / `0.5 MOA` rear windage; rear elevation drum `1 MOA/click` for setup/finalization | Authority closed; profile implementation pending |

## Admission test

Apply these tests in order:

1. Identify the publisher product and exact face. If either is unknown, hold governed admission.
2. Establish physical dimensions, scale, grid, and registration landmarks.
3. Compare geometry at physical scale. Matching landmarks and scale may reuse geometry; changed geometry or scale requires a new geometry identity.
4. Classify harmless color, ink, and print-treatment differences as representation variants only after registration proof.
5. Resolve the exact weapon and sight configuration.
6. Select mechanical authority only when its evidence scope explicitly covers the resolved face and configuration. Otherwise hold correction capability.
7. Assign QR identity to the exact publisher product and face.
8. Generate Talking Smart Target language from that face and configuration without borrowing another target's terminology.
9. Prove the complete governed road and exact reopen before availability.

The allowed classification outcomes are:

- `SAME_GEOMETRY_NEW_PRODUCT`
- `NEW_REPRESENTATION_VARIANT`
- `NEW_TARGET_PROFILE`
- `EVIDENCE_ONLY`
- `HOLD_IDENTITY_OR_AUTHORITY_UNRESOLVED`

## Fail-closed rules

- Same geometry does not mean the same publisher product.
- A harmless appearance variation does not automatically create a Target Profile.
- Materially different geometry remains separate.
- A physical scale change remains separate when it changes geometry or authority applicability.
- Related targets may require different weapon/sight authority.
- Family membership never grants geometry, mechanics, correction, or availability.
- Ambiguous identity, face, scale, configuration, or authority cannot enter governed correction.

## Preserved open work

- Baker production artwork and physical specimens are required for final registration and production validation, not architecture construction.
- Commercial SKUs and exact QR destinations remain open until Baker participation supplies them.
- Final observer-view iconography remains open.
- Baker Target Profiles, runtime authority registrations, Talking lessons, QR destinations, tests, and roads are not implemented by this architecture lock.

