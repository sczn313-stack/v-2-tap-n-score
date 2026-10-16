# SCZN3 Episode 67: Prove the Remaining Truth

Date: 2026-10-16

## 1. Episode 66 floor

- Evidence archive: `outputs/SCZN3_EP66_FINAL_145_CONNECTION_EVIDENCE_2026-10-16.zip`
- Expected and observed SHA-256: `d64c2cfdadb8c18151dd5d690e4c8618568bdcffe2c707d4d278d273041d074f`
- ZIP integrity: PASS (`unzip -t`, no errors).
- Final receipt SHA-256: `02bd76c273bd5c22239bbebaaf0c0b1494c8fab170eac403d8b24bbe231c6cda`
- Machine proof SHA-256: `80ec9b55372005def894805c06f25a6c2701654f41d1d0da2fe4e2f807905c23`
- Apply receipt SHA-256: `36747c87c1fbad8a3edd8903f8664c4d53fac82c515a7e61eb7f3cc5974576ba`
- Receipt/proof reconciliation: PASS. Counts agree at 1,496/1,527 metadata-connected faces, 412/412 metadata-fidelity passes, 409/412 lifecycle runtime passes, and one face blocked across three runtimes.

No Episode 66 description or connection was modified during this investigation.

## 2. Master #407: American Target Company USPA/IPSC

Affected runtimes:

1. `american_target_58_q100_uspa_ipsc`
2. `american_target_58_q500_uspa_ipsc`
3. `american_target_58_q1000_uspa_ipsc`

The three commercial identities resolve to the same registered face and asset SHA-256:
`53202446b635012c7a4f509e7bbc0fb5cef10a42aa5d1c9a531f1f763d070a52`.
Publisher evidence records a 20 x 32 inch paper target. Each contract declares five result-affecting regions:
`a_head`, `b_head`, `a_body`, `c_body`, and `d_body`.

All three contracts currently have:

- `missionFamily: targetScoring`
- a complete named-region scoring definition
- five normalized geometry regions
- no `geometry.physicalAuthority`
- no `geometry.completeBoundaryProof`

The live UGO gate therefore returns:

```text
required: true
status: UNPROVEN
boundaryCount: 0
probeCount: 0
error: ugo_complete_boundary_proof_required
```

This is corroborated by the existing October 7 population audit:
`docs/authority-evidence/platform/episode64-ugo-recovery-44-2026-10-07/SCZN3_UGO_COMPLETE_BOUNDARY_POPULATION_AUDIT.json`.
That audit independently records all three identities as UNPROVEN because complete inside/edge/outside proof is absent.

### Existing evidence

- Exact publisher identity, package relationships, dimensions, artwork, and asset digest exist.
- Existing normalized A/B/C/D region coordinates exist.
- Existing lifecycle evidence predates the strengthened complete-boundary gate.
- No independent physical-to-runtime boundary correspondence artifact exists for this exact 20 x 32 face.
- No passing complete-boundary proof exists elsewhere in the repository for these identities.
- A Qualification Targets IPSC face has separate physical authority, but it is a different 23 x 35 product and cannot supply #407's physical proof.

### Legitimate evidence required

To clear the gate without pixel authority, UGO must establish the exact 20 x 32 physical face and independently measure or verify all five result-affecting boundaries. A valid bounded correction would need:

1. `physicalAuthority` identifying the exact registered face, 20 x 32 target plane, measurement method, source evidence, and `pixelIsAuthority: false`.
2. Independent physical correspondence for `a_head`, `b_head`, `a_body`, `c_body`, and `d_body`; existing normalized pixels alone are insufficient.
3. `completeBoundaryProof` using `sczn3.ugo.complete-boundary.v1`.
4. A complete roster of all five result-affecting boundaries and outer hit/miss envelopes.
5. Inside, edge, and outside probes for every boundary: 5 boundaries and 15 probes minimum.
6. Successful execution of every probe through the actual classifier, including nested-region priority behavior.
7. Revalidation of Q100, followed by exact-face inheritance to Q500 and Q1000 only after preserving their separate package identities.

### Decision

The three runtimes cannot legitimately be cleared from current evidence. The blocker must remain. A future UGO measurement/proof batch requires separate Founder authorization before any contract write.

## 3. HTTP verification

Root environment finding:

- `requirements.txt` declares `opencv-python-headless==5.0.0.93`.
- The bundled Codex Python environment did not have `cv2` installed.
- The declared dependency was installed only into `/private/tmp/sczn3-episode67-http-deps`; no repository or project environment file changed.
- Verified temporary versions: OpenCV 5.0.0 and NumPy 2.5.4.

With OpenCV restored, `test_session_authority_http.py` executes but fails at its registered-target authority assertion. A request containing:

```json
{"targetId":"m4_25m_zero","missionFamily":"spoofed-client-value"}
```

returns HTTP 404 / `target_id_not_registered`. `resolve_target_authority()` currently treats the client-supplied mission family as a contract-resolution constraint even when a registered Backend target profile already exists.

Read-only isolation proof: when the spoofed client mission-family field is removed before Backend preparation, the complete HTTP test passes:

```text
PASS Backend Session Authority HTTP contract
```

### Proposed bounded HTTP correction

Require registered Backend target authority to determine the mission family. A client-supplied mission family must not override or invalidate a registered target profile. Implementing that routing correction and updating/rerunning the HTTP regression requires separate authorization.

## 4. Requested decisions

1. Keep Master #407 blocked until UGO supplies independent physical boundary proof for the exact American Target 20 x 32 face.
2. If desired, authorize one bounded UGO proof batch: five regions, fifteen probes, three package identities, no scoring or geometry invention.
3. Authorize a separate Backend session-routing correction so registered target authority ignores a spoofed client mission-family override, then rerun the focused HTTP suite.

No target contract, geometry, scoring rule, approved description, commit, push, or deployment was changed by Episode 67.
