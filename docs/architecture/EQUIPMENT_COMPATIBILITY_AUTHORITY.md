# SCZN3 Equipment Compatibility Authority

Status: Locked

Effective checkpoint: Episode 53 — Governed Implementation Closure

## Purpose

Equipment Compatibility Authority separates admission to a registered Smart Target from eligibility for an official mission and from the capabilities SCZN3 can truthfully provide.

Compatibility informs. It does not unnecessarily prohibit.

## Governing separation

### Target Admission

Target Admission answers whether the selected Target ID resolves to a registered, active Smart Target.

- A registered active Smart Target is admitted independently of firearm ownership.
- Selecting a target does not allow the frontend to create mission authority.
- Unknown, inactive, or invalid Target IDs fail closed through Target Authority.

### Official Mission Eligibility

Official Mission Eligibility answers whether SCZN3 can truthfully claim that the selected equipment satisfies the registered requirements of an official mission.

- Official target and mission identities remain unchanged.
- A result may be `ineligible` only when the restriction itself has registered provenance.
- When restriction provenance is not registered, the result is `authority_unavailable`.
- Placeholder restriction IDs, sources, or eligibility claims are prohibited.

### Capability Availability

Capability Availability independently declares what SCZN3 can truthfully provide for the admitted target and selected equipment.

Governed capabilities include, as applicable:

- Evidence preservation
- Measurement
- Equipment correction
- Official score
- Official mission completion

An unavailable official mission claim does not automatically remove evidence, measurement, or another independently supported capability.

## Session behavior

Backend Session Authority owns the authoritative session ID, target-to-mission resolution, target-profile version, capability assessment, mission status, restrictions, and session mode.

The frontend sends Target ID and shooter-confirmed equipment. It does not create eligibility, mission authority, restrictions, or fallback sessions.

The backend returns:

- `targetAdmission`
- `officialMission`
- `capabilities`
- `restrictions`
- `sessionMode`
- authoritative target and mission identities

`official_mission` is used only when the mission claim is supported. `target_evidence` preserves the admitted target and supported capabilities without inventing official mission completion.

## Presentation boundary

The backend response preserves authority language and traceability. The frontend translates that result into shooter guidance answering:

1. Can I use this Smart Target?
2. What will SCZN3 do for me?
3. What is unavailable, and why?

Presentation must not modify the underlying authority decision.

## Governed examples

| Target and equipment | Admission | Official mission | Supported outcome |
|---|---|---|---|
| M4 Smart Target with unproven non-M4 equipment | Admitted | `authority_unavailable` | Evidence, supported measurement, and governed equipment correction remain available |
| 100 Yard Smart Target with governed rifle setup | Admitted | Eligible | Evidence, measurement, and correction available |
| GSSF with qualifying pistol | Admitted | Eligible | Evidence, measurement, and official score available |
| GSSF with non-pistol and no registered restriction provenance | Admitted | `authority_unavailable` | Evidence and measurement available; official score withheld |

## Implementation evidence

- Release commit: `d60d2f87948b72db05e687a06288e5bbe16fc371`
- Backend contract: [`SESSION_AUTHORITY_CONTRACT.md`](../backend/SESSION_AUTHORITY_CONTRACT.md)
- Governed release record: [`SCZN3_GOVERNED_IMPLEMENTATION_LOG.md`](../governance/SCZN3_GOVERNED_IMPLEMENTATION_LOG.md)
